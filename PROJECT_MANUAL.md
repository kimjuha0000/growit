# 러닝 파이프라인 허브 기술 설명서

이 문서는 README보다 한 단계 깊게 들어가 FastAPI + GrowIt SPA, Airflow → Spark/Delta → Postgres → Zeppelin까지 이어지는 흐름을 상세하게 설명합니다. 환경 준비, 서비스별 설정, 사용자 여정 시뮬레이션, 오류 대응 팁 등을 모두 한곳에 정리했습니다.

## 목차
1. [전체 구조](#전체-구조)  
2. [사전 준비](#사전-준비)  
3. [GrowIt 프론트엔드](#growit-프론트엔드)  
4. [FastAPI 백엔드](#fastapi-백엔드)  
5. [데이터 파이프라인 (Airflow/Spark/Delta/Postgres/MinIO)](#데이터-파이프라인-airflowsparkdeltapostgresminio)  
6. [서비스별 운영 팁](#서비스별-운영-팁)  
7. [사용자 여정 시뮬레이션](#사용자-여정-시뮬레이션)  
8. [트러블슈팅 요약](#트러블슈팅-요약)

---

## 전체 구조

```
React/Vite (GrowIt SPA)
   │  /api/* 요청
FastAPI (web/app.py) ───▶ /data/bronze/app/part-*.jsonl (+ MinIO 업로드)
   │                          │
   │ Airflow DAG              ▼
Spark Job (spark/app/job_etl.py) → Delta Lake (/data/delta/…)
   │                                     │
   └────▶ Postgres mart 스키마 ◀──────────┘
                        │
                   Zeppelin 대시보드
```

- **프론트엔드**: `growit/`에서 개발. React Query + shadcn/ui. Vite로 빌드한 뒤 FastAPI가 정적 자산을 제공합니다.
- **웹/API**: `web/app.py`가 로그인·카테고리·추천 API를 제공하고 JSONL 이벤트를 기록합니다.
- **워크플로**: Airflow DAG가 Bronze 로그를 감지해 Spark ETL을 실행합니다.
- **저장소**: Delta Lake, Postgres, MinIO에 결과가 쌓여 Zeppelin 등에서 조회합니다.

## 사전 준비

| 항목 | 설명 |
| --- | --- |
| Docker Desktop + WSL2 | Windows에서 실행 시 필수. |
| Node.js 18+ / npm | GrowIt 프론트엔드를 빌드할 때 필요. |
| 필수 포트 | 3000(웹), 5432(Postgres), 7077(Spark), 8081(Zeppelin), 8082(Airflow), 9000/9001(MinIO). |
| 폴더 권한 | `data/`, `pg/`, `tmp/`, `zeppelin/` 등 Docker가 마운트하는 경로는 모두 쓰기 가능해야 합니다. Windows라면 해당 폴더 > 속성 > 보안 > Users 그룹에 수정 권한 부여. |
| Git 제외 대상 | `.env`, `data/`, `pg/`, `tmp/`, `zeppelin/` 등은 `.gitignore`로 제외되어 있습니다. 커밋 시 데이터/로그가 포함되지 않았는지 확인하세요. |

## GrowIt 프론트엔드

1. **설치 & 빌드**
   ```bash
   cd growit
   npm install
   npm run build
   ```
   이때 생성되는 `dist/`가 FastAPI에서 자동으로 감지되어 `/assets` 경로로 제공됩니다.

2. **개발 서버**
   ```bash
   npm run dev
   ```
   - `growit/.env.local` 파일에 `VITE_API_BASE_URL=http://localhost:3000/api`를 넣으면 개발 서버(5173 포트)에서도 FastAPI API를 사용할 수 있습니다.

3. **구조 요약**
   - `src/App.tsx`: `AuthProvider`와 React Query로 전체 앱을 감싼 뒤 라우터를 설정합니다.
   - `src/lib/api.ts` / `src/types/pipeline.ts`: FastAPI 응답을 타입으로 관리하는 헬퍼.
   - `src/hooks/use-auth.tsx`: 로그인 결과를 localStorage에 저장하고, Navbar나 보호된 페이지에서 접근할 수 있도록 하는 컨텍스트.
   - `src/pages/Categories.tsx`: 새로운 GrowIt 디자인에 맞춰 카테고리 선택, 파이프라인 타임라인, 추천 결과를 보여줍니다.
   - `src/components/Categories.tsx`: 홈 화면용 미리보기. `/api/categories` 응답을 기반으로 콘텐츠를 표시합니다.

## FastAPI 백엔드

- **정적 자산 제공**
  - `web/app.py`는 `growit/dist`(혹은 하위 폴더) 존재 여부를 확인해 `/assets` 마운트 및 SPA 라우팅을 설정합니다.
  - `web/static/` 내 HTML은 빌드가 없을 때 사용하는 백업 UI입니다.

- **API & 이벤트 로깅**
  - `/api/login`: `users.json`을 기준으로 인증하고 `login` 이벤트를 JSONL에 기록합니다.
  - `/api/categories`: 10개의 카테고리 목록(아이콘, 색상, 샘플 링크, 강의 수)을 제공합니다.
  - `/api/recommendations`: 선택한 카테고리의 100개 강의 목록을 반환하고 `category_recommendation` 이벤트를 기록합니다.
  - 앞선 세 API는 `/login`, `/categories`, `/recommendations`라는 구 버전 경로도 그대로 유지합니다.
  - 모든 이벤트는 `/data/bronze/app/YYYY/MM/DD/part-YYYYMMDD-HH.jsonl` 형식으로 적재되며, `USE_MINIO=true`일 때 MinIO `logs` 버킷에도 전체 파일을 업로드합니다.
  - `/traffic` HTML 패널과 `/api/traffic/trigger`(POST), `/api/traffic/status`(GET)를 통해 대량 트래픽을 백그라운드로 전송할 수 있습니다. 기본 타깃은 `TRAFFIC_TARGET_URL`(기본 `http://web:3000/api/events`), 최대 20,000건/동시 200개 제한, `X-Load-Test: traffic_button` 헤더 자동 추가.

- **ERD 문서**
  - `web/ERD.md`에서 USERS, CATEGORIES, COURSES, RECOMMENDATION_REQUESTS, EVENTS, BRONZE_FILES 관계를 Mermaid 다이어그램으로 정리했습니다.

## 데이터 파이프라인 (Airflow/Spark/Delta/Postgres/MinIO)

### Airflow
- 위치: `airflow/`. DAG 예시는 `logs_etl`.
- UI: `http://localhost:8082` (기본 `admin/admin`).
- DAG는 `/data/bronze/app`을 파싱해 Spark 작업을 실행하고 Delta + Postgres에 적재합니다.

### Spark & Delta
- 스크립트: `spark/app/job_etl.py`.
- `/data` 경로를 Spark Master/Worker, Airflow가 모두 읽고 쓸 수 있어야 합니다. 권한 문제 시 다음 명령으로 조정하세요.
  ```bash
  docker compose exec --user root spark-master bash -c "chown -R spark:spark /data && chmod -R 775 /data"
  docker compose exec --user root spark-worker bash -c "chown -R spark:spark /data && chmod -R 775 /data"
  docker compose exec --user root airflow bash -c "chown -R airflow:root /data && chmod -R 775 /data"
  ```

### Postgres
- 데이터 디렉터리: `pg/`.
- `.env`에서 `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`를 확인하세요.
- 예시 쿼리:
  ```bash
  psql -h localhost -U analytics -d dwh -c "SELECT * FROM mart.daily_events ORDER BY event_date DESC LIMIT 10"
  ```

### MinIO
- 콘솔: `http://localhost:9001` (admin/admin12345).
- 처음 실행하면 `logs` 버킷을 만들고 다운로드 정책을 `download`로 설정하세요.
  ```bash
  docker compose exec minio mc alias set local http://localhost:9000 admin admin12345
  docker compose exec minio mc mb -p local/logs
  docker compose exec minio mc policy set download local/logs
  ```

### Zeppelin
- URL: `http://localhost:8081`.
- Spark 인터프리터 설정 예시:
  - `master`: `spark://spark-master:7077`
  - `spark.submit.deployMode`: `client`
  - `spark.jars.packages`: `io.delta:delta-spark_2.12:3.2.0,org.postgresql:postgresql:42.7.4,org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.772`
  - MinIO 옵션: `spark.hadoop.fs.s3a.endpoint=http://minio:9000`, `spark.hadoop.fs.s3a.access.key`, `spark.hadoop.fs.s3a.secret.key`, `spark.hadoop.fs.s3a.path.style.access=true`
- 샘플 쿼리:
  ```scala
  %spark.sql
  SELECT * FROM delta.`/data/delta/events` ORDER BY event_date DESC LIMIT 20;
  ```

## 서비스별 운영 팁

| 서비스 | 자주 쓰는 명령/URL | 설명 |
| --- | --- | --- |
| Docker Compose | `docker compose up -d --build` | 전체 스택 실행/갱신 |
| FastAPI 단독 실행 | `cd web && uvicorn app:app --reload` | 도커 없이 백엔드만 테스트 |
| 프론트엔드 개발 | `cd growit && npm run dev` | Vite 개발 서버 |
| Airflow DAG 테스트 | `docker compose exec airflow airflow dags test logs_etl 2024-01-01` | 한 번만 실행해보고 싶을 때 |
| Spark 잡 수동 실행 | `docker compose exec spark-master spark-submit /opt/spark/app/job_etl.py` | DAG 없이 ETL을 강제로 돌릴 때 |

## 사용자 여정 시뮬레이션

1. **도커 스택**을 모두 띄우고, GrowIt을 `npm run build`로 빌드합니다.
2. **웹 접속**: `http://localhost:3000`.
3. **로그인**: `datafan/pass1234` 등 샘플 계정 사용.
4. **카테고리 페이지**에서 관심 분야를 선택하고 “추천 강의 요청” 클릭.
5. **브론즈 로그 확인**:
   ```bash
  docker compose exec web tail -n 5 /data/bronze/app/$(date +%Y/%m/%d)/part-$(date +%Y%m%d)-$(date +%H).jsonl
   ```
6. **Airflow DAG** 실행 → Delta/MinIO/Postgres 반영 확인.
7. **Zeppelin** 또는 `psql`에서 최신 지표를 조회.

매 로그인/추천마다 JSONL 2건이 생기고, DAG가 실행되면 Delta 및 Postgres에도 신규 레코드가 추가됩니다.

## 트러블슈팅 요약

| 증상 | 원인 | 해결책 |
| --- | --- | --- |
| 브라우저에서 빈 화면 | `npm run build` 미실행 또는 `dist/` 누락 | `growit`에서 다시 빌드 |
| Vite 개발 서버에서 API 404 | `VITE_API_BASE_URL` 미설정 | `.env.local`에 FastAPI 주소 추가 |
| `/data/bronze/app`에 쓰기 실패 | 권한 부족 | 위의 chown/chmod 명령으로 조정 |
| 트래픽 스파이크 실패 | `TRAFFIC_TARGET_URL` 미설정, 20k/200 제한 초과, 네트워크 타임아웃 | `/api/traffic/status`로 에러 메시지 확인 후 파라미터 축소 또는 타깃 URL 지정 |
| MinIO 업로드 실패 | 버킷 없음 / 키 오류 | `logs` 버킷 생성 및 정책 설정, 환경 변수 재확인 |
| Airflow DAG Spark 단계 오류 | Delta 패키지 또는 `/data` 권한 문제 | Spark 인터프리터 설정/권한 점검 |
| Zeppelin에서 MinIO 접근 실패 | S3A 설정 누락 | `spark.hadoop.fs.s3a.*` 옵션과 AWS SDK 패키지 확인 |
| npm install 중 캐시 오류 | 호스트 npm 캐시 손상 | `~/.npm` 삭제 후 재설치 |

추가로 궁금한 내용이나 설정 변경이 필요하면 `README.md`와 `web/ERD.md`를 함께 참고하세요. 새로운 카테고리·이벤트를 추가할 때는 FastAPI의 `COURSE_CATALOG`, 프론트엔드 타입 정의, Spark ETL 로직을 동시에 업데이트해야 일관성을 유지할 수 있습니다.
