# Repository Guidelines

## Project Structure & Module Organization
- `growit/` (React 18 + Vite + TypeScript): pages in `src/pages`, shared UI in `src/components/ui`, auth/hooks in `src/hooks`, API helpers in `src/lib`. Build output `growit/dist` is mounted into the FastAPI container.
- `web/` (FastAPI): main entry `web/app.py`, static assets in `web/static`, sample accounts in `web/users.json`. Serves `/api/login`, `/api/categories`, `/api/recommendations`, `/api/events`, and the SPA shell.
- Data & pipeline: Airflow DAGs in `airflow/dags`, Spark ETL in `spark/app/job_etl.py`, Postgres bootstrap SQL in `postgres/init/init.sql`. Runtime volumes `data/`, `pg/`, `tmp/`, `minio/` are for containers only and must stay out of git.
- Compose & ops: `docker-compose.yml` wires MinIO, Postgres, Spark, Airflow, and the web app. `PROJECT_MANUAL.md` and `README.md` hold deeper runbook notes.

## Build, Test, and Development Commands
- Bring up the stack: `docker compose up -d --build` then `docker compose ps` / `docker compose logs -f <service>` to verify.
- Frontend: `cd growit && npm install && npm run dev` for local dev (`VITE_API_BASE_URL=http://localhost:3000/api`), `npm run build` to refresh `dist/`, `npm run lint` for ESLint.
- Backend/API quick check: `docker compose exec web pytest` (if tests exist) or `curl http://localhost:3000/api/health` once added. Spark ETL dry run: `docker compose exec spark python /opt/spark/app/job_etl.py`.
- Data validation: `docker compose exec postgres psql -U ${POSTGRES_USER:-analytics} -d ${POSTGRES_DB:-dwh} -c "SELECT * FROM mart.daily_events LIMIT 20;"`. Delta view: query `delta.\`/data/delta/events\`` from Spark/Zeppelin.
- Traffic spike: open `http://localhost:3000/traffic` or `POST /api/traffic/trigger` to generate load; observe `/api/traffic/status`.

## Coding Style & Naming Conventions
- TypeScript/React: 2-space indent, `PascalCase` components, `camelCase` utilities, hooks start with `use`. Keep components small; shared UI lives under `components/ui`.
- Python (FastAPI/Spark): 4-space indent, `snake_case` functions, uppercase constants for env (`USE_MINIO`, `TRAFFIC_TARGET_URL`). Keep request/response models in `pydantic` classes.
- Assets and routes mirror feature names (`Categories.tsx`, `/categories`), and data files should be lower_snake_case.

## Testing Guidelines
- Frontend: `npm run lint` + `npm run build` before pushing; add `growit/src/__tests__/<Feature>.test.tsx` for hooks or logic-heavy components.
- Pipeline/backend: prefer `pytest` for API helpers, `airflow dags test logs_etl <date>` for DAGs, and Spark job dry runs against a small `/data/bronze/app` sample. Verify Postgres tables (`mart.events`, `mart.daily_events`) after ETL.

## Commit & Pull Request Guidelines
- Commits: imperative, short, with optional scope (`web:`, `growit:`, `spark:`). Never commit `data/`, `pg/`, `tmp/`, `.env`, or built `dist/`.
- PRs: include summary, affected services, commands/tests run, new env vars, and screenshots/GIFs for UI changes. Link related issues. For performance/ETL changes, mention expected data volume and backfill impact.

## Security & Configuration Tips
- Keep secrets in local `.env`; sample credentials in `web/users.json` are demo-only. Rotate MinIO/Postgres creds before any shared deployment.
- On Windows, ensure `data/`, `pg/`, `tmp/` are writeable by Docker (see `README.md` for `icacls` example). If volumes break, rebuild with `docker compose down && docker compose up -d --build`.
