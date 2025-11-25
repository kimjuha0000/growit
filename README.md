# 러닝 파이프라인 허브 안내서

GrowIt이라는 React/Vite 기반 프론트엔드와 FastAPI 백엔드, 그리고 Airflow → Spark/Delta → Postgres → Zeppelin으로 이어지는 데이터 파이프라인을 한 번에 체험할 수 있는 실습 환경입니다. 아래 내용을 순서대로 따라 하면 새로 합류한 팀원도 빠르게 전체 구조를 이해하고 실행해 볼 수 있습니다.

## 한눈에 보기

| 계층 | 사용 기술 | 역할 |
| --- | --- | --- |
| 프론트엔드 | React 18, Vite, TypeScript, shadcn/ui | `growit/` 폴더. `npm run build`로 만든 `dist/`를 FastAPI가 서빙합니다. |
| 웹/API | FastAPI (`web/app.py`) | `/api/login`, `/api/categories`, `/api/recommendations` 제공. `users.json`을 기준으로 인증하고 JSONL 이벤트를 기록하며, 필요 시 MinIO로 업로드합니다. |
| 워크플로 | Airflow (`airflow/`) | 브론즈(JSONL) 데이터를 주기적으로 Spark 작업으로 넘겨줍니다. |
| 처리 | Spark + Delta (`spark/app/job_etl.py`) | `/data/bronze/app`을 읽어 Delta/Parquet 레이어와 Postgres 마트로 적재합니다. |
| 저장소 | Postgres, MinIO, Delta Lake | Zeppelin이나 외부 BI 도구에서 조회할 수 있는 최종 지표를 제공합니다. |

## 폴더 구조 요약

- `growit/` : GrowIt UI 소스. React Query, shadcn/ui 컴포넌트, Tailwind가 포함되어 있습니다.
- `web/` : FastAPI 서버와 `users.json`, `ERD.md` 등이 있습니다. `growit/dist`를 자동으로 감지해 정적 자산을 제공합니다.
- `airflow/`, `spark/`, `postgres/`, `pg/`, `minio/`, `data/`, `tmp/` : docker-compose가 사용하는 각종 서비스 및 마운트 포인트.
- `docker-compose.yml` : 전체 스택을 띄우는 기준 파일.
- `PROJECT_MANUAL.md` : 서비스별 상세한 운영/트러블슈팅 가이드.

## 빠른 시작

1. **클론 및 환경 변수 준비**
   ```bash
   git clone <repo-url> learningpipeline
   cd learningpipeline
   cp .env.example .env   # 존재한다면 복사 후 MinIO/DB 정보 확인
   ```
2. **폴더 권한 확인**  
   `data/`, `pg/`, `tmp/`, `zeppelin/` 등은 Docker 컨테이너에서 읽고 쓸 수 있어야 합니다. Windows라면 해당 폴더의 “보안” 탭에서 `Users` 그룹에 쓰기 권한을 부여하세요.
3. **도커 서비스 실행**
   ```bash
   docker compose up -d --build
   docker compose ps   # 모든 서비스가 Up인지 확인
   ```
4. **GrowIt 프론트엔드 빌드**
   ```bash
   cd growit
   npm install
   npm run build    # dist/ 생성 → FastAPI가 자동 서빙
   ```
5. **웹 접속 후 체험**
   - 브라우저에서 `http://localhost:3000` 접속.
   - 샘플 계정: `datafan/pass1234`, `growthhacker/grow2025`, `juniordev/devstart`.
   - 로그인 → 카테고리 선택 → “추천 강의 요청”을 누르면 이벤트가 `/data/bronze/app`과 MinIO(선택)로 기록되고, Airflow → Spark → Delta/Postgres → Zeppelin 흐름으로 흘러갑니다.

> 📌 **프론트엔드 개발 중이라면**  
> `growit/.env.local` 파일에 `VITE_API_BASE_URL=http://localhost:3000/api`를 추가한 뒤 `npm run dev`로 개발 서버(기본 5173포트)를 띄우면 빠르게 UI를 수정할 수 있습니다.

## GrowIt UI 주요 포인트

- `src/App.tsx`에서 `AuthProvider`와 React Query를 루트에 감싸고, 라우터를 정의합니다.
- `src/lib/api.ts` + `src/types/pipeline.ts`는 FastAPI의 `/api/*` 응답을 타입으로 관리합니다.
- `src/hooks/use-auth.tsx`는 로그인 응답을 localStorage에 저장해 네비게이션이나 보호된 페이지에서 활용할 수 있게 해줍니다.
- `src/pages/Categories.tsx`는 GrowIt 디자인에 맞춰 파이프라인 타임라인과 추천 결과, 카테고리 선택 UI를 구현했습니다.
- shadcn/ui 스타일의 컴포넌트(`components/ui/`)는 Tailwind 기반으로 통일된 디자인 가이드를 제공합니다.

## FastAPI 백엔드 핵심

- `web/app.py`는 서버 시작 시 다음을 수행합니다.
  - `growit/dist`(혹은 하위에 또 있는 dist) 폴더를 찾으면 `/assets`로 마운트하고, SPA 라우팅을 위해 모든 비-API 요청을 index.html로 돌립니다.
  - `/api/*` 경로와 기존 `/login`, `/categories`, `/recommendations` 경로를 동시에 유지해 하위 호환성을 확보했습니다.
  - 10개의 카테고리 × 100개의 강의 URL을 생성하는 `COURSE_CATALOG`를 보관합니다.
  - 로그인 및 추천 시 `/data/bronze/app/YYYY/MM/DD/part-YYYYMMDD-HH.jsonl` 파일에 JSONL 레코드를 추가하고, `USE_MINIO=true`라면 MinIO `logs` 버킷에 업로드합니다.
- `web/ERD.md`에서 사용자·카테고리·강의·이벤트 간 관계를 Mermaid 다이어그램으로 정리했습니다.

## 모니터링 & 분석 포인트

- **MinIO 콘솔** : `http://localhost:9001` (admin/admin12345). `logs` 버킷이 없으면 만든 뒤 다운로드 정책을 열어두세요.
- **Airflow** : `http://localhost:8082` (admin/admin). `logs_etl` DAG를 수동 혹은 스케줄로 돌려 Spark ETL을 확인합니다.
- **Spark/Delta** : `/data` 권한이 `spark`/`airflow` 사용자에게 있는지 점검하고, 필요 시 `chown/chmod` 명령으로 조정합니다.
- **Postgres** : `psql -h localhost -U analytics -d dwh` 후 `SELECT * FROM mart.daily_events LIMIT 20;` 등으로 데이터 적재 여부를 체크합니다.
- **Zeppelin** : `http://localhost:8081` 접속 후 Spark 인터프리터 설정에 Delta/MinIO 관련 의존성을 추가하면 `/data/delta/events`를 바로 조회할 수 있습니다.

## 더 알아보기

- [`PROJECT_MANUAL.md`](./PROJECT_MANUAL.md) : 서비스별 세부 설정, 파이프라인 흐름, 트러블슈팅을 모두 모아둔 설명서입니다.
- [`web/ERD.md`](./web/ERD.md) : 엔터티 관계(ERD) 문서.

프론트엔드 수정 후에는 항상 `npm run build`를 다시 실행해 FastAPI가 최신 정적 파일을 제공하도록 해주세요. 도커 환경을 전체적으로 재시작하고 싶다면 `docker compose down && docker compose up -d --build`를 사용하면 됩니다. 문제가 생기면 도커 로그(`docker compose logs <서비스>`), FastAPI 로그, 브라우저 네트워크 탭, Airflow Task 로그를 순서대로 확인하면 대부분 원인을 찾을 수 있습니다.
