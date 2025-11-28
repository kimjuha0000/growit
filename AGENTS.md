# Repository Guidelines

## 프로젝트 구조
- 프론트엔드: `growit/`(Vite). 컴포넌트 `src/components`, 페이지 `src/pages`, 훅 `src/hooks`, 빌드 산출물 `growit/dist`는 FastAPI가 정적 서빙.
- 백엔드: `web/`(FastAPI)에서 `/api/*`, `/traffic/*` 제공. 의존 설정은 `docker-compose.yml`과 `PROJECT_MANUAL.md` 참고.
- 데이터 파이프라인: Airflow DAG은 `airflow/`, Spark ETL 스크립트는 `spark/app/job_etl.py`, Postgres 초기화는 `postgres/`. 런타임 볼륨 `data/`, `pg/`, `tmp/`는 로컬 전용이며 git 무시.
- 기타: MinIO 설정은 `minio/`, Zeppelin 등 캐시는 데이터 볼륨 하위 사용.

## 빌드·개발·테스트
- 공통 기동: `docker compose up -d --build` 후 `docker compose logs -f <service>`로 헬스 확인. 권한 오류 시 컨테이너에서 `/data`가 `spark:spark`로 쓰기 가능한지 확인.
- 프론트: `cd growit && npm install && npm run dev`(환경변수 `VITE_API_BASE_URL=http://localhost:3000/api`). 배포 빌드 `npm run build && npm run preview`.
- API/ETL: `docker compose exec web pytest`, `docker compose exec airflow airflow dags test logs_etl 2025-01-01`, `docker compose exec spark python /opt/spark/app/job_etl.py`.
- 데이터 확인: Postgres `docker compose exec postgres psql -U analytics -d dwh -c "SELECT COUNT(*) FROM mart.events;"`, Delta 테이블은 Spark/Zeppelin에서 `SELECT * FROM delta.\`/data/delta/events\``로 검증.
- 트래픽 스파이크: `http://localhost:3000/traffic` UI 사용 또는 `POST /api/traffic/trigger`로 실행, `/api/traffic/status`로 모니터링.

## 코딩 스타일 & 네이밍
- TypeScript: 2스페이스, `PascalCase` 컴포넌트, `camelCase` 유틸, 훅은 `useX`. 파일명은 주요 익스포트와 일치(`Navbar.tsx` 등).
- Python: 4스페이스, `snake_case` 함수, 환경상수는 대문자(`USE_MINIO`, `TRAFFIC_TARGET_URL`). DAG ID와 Spark job 이름은 동기화(`logs_etl`).
- 라우터·서비스는 얇게 유지하고 공통 로직은 헬퍼/모듈로 재사용.

## 테스트 가이드
- 프론트: `npm run lint`, `npm run build`; 비즈니스 로직/훅은 `growit/src/__tests__/<Feature>.test.tsx`.
- 백엔드/파이프라인: `pytest`, `airflow dags test <dag> <date>`, Spark 드라이런, Postgres/Delta 조회로 적재 결과 점검. 실패 시 볼륨 권한과 스키마/merge 설정(`mergeSchema`) 확인.

## 커밋 & PR
- 커밋 메시지: 명령형·짧게, 필요 시 영역 접두사(`web:`, `spark:`). 데이터/산출물은 포함하지 말 것.
- PR 필수 내용: 변경 요약, 영향 서비스(프론트/웹/파이프라인), 실행한 테스트/명령, 신규 환경변수, UI 변경 시 스크린샷 또는 `/traffic` 결과.

## 보안·설정
- `.env`, `data/`, `pg/`, `tmp/`, 빌드 산출물은 git에 포함되지 않음. 푸시 전 `git status`로 깨끗한 상태 확인.
- 자격증명은 로컬 `.env`나 비밀 관리로만 사용. 샘플 계정(`web/users.json` 등)은 데모용이며 외부 재사용 금지.
