# Repository Guidelines

## Project Structure & Module Organization
GrowIt’s Vite/React UI lives in `growit/` (components in `src/components`, screens in `src/pages`, hooks under `src/hooks`), while FastAPI resides in `web/` to serve `/api/*` plus the SPA built into `growit/dist`. Airflow (`airflow/`), Spark (`spark/app/`), Postgres bootstraps (`postgres/`, `pg/`), MinIO, and shared volumes like `data/` or `tmp/` power the pipeline—see `docker-compose.yml` and `PROJECT_MANUAL.md` for wiring details.

## Build, Test, and Development Commands
- `docker compose up -d --build` – start the stack; adjust compose volume paths if the repo lives elsewhere.
- `docker compose logs -f <service>` – quick health for `web`, `spark`, `airflow`, etc.
- `cd growit && npm install && npm run dev` – run the Vite dev server (set `VITE_API_BASE_URL=http://localhost:3000/api` first).
- `cd growit && npm run build && npm run preview` – verify the production bundle served by FastAPI.
- `docker compose exec airflow airflow dags test logs_etl 2024-01-01` or `docker compose exec spark python /opt/spark/app/job_etl.py` – dry-run pipeline jobs without waiting for schedules.
- `cd growit && npm run lint` – enforce the ESLint + TypeScript config before committing.

## Coding Style & Naming Conventions
TypeScript sticks to 2-space indents, `PascalCase` components, `camelCase` utilities, and `useX` hook names; reuse Tailwind utilities and shadcn/ui tokens instead of ad-hoc CSS. Python favors 4-space indents, `snake_case` functions, uppercase env constants (`USE_MINIO`, `BRONZE_ROOT`), and `pydantic.BaseModel` schemas for payloads. Match Airflow DAG IDs to Spark job names (`logs_etl`) and pick descriptive filenames such as `logs_etl_dag.py`.

## Testing Guidelines
Run `npm run lint` and `npm run build && npm run preview` before every commit. UI logic or hook changes need specs in `growit/src/__tests__/` named `<Feature>.test.tsx`. API or pipeline updates should include `docker compose exec web pytest`, `airflow dags test logs_etl <date>`, and a Postgres check such as `docker compose exec postgres psql -U analytics -d dwh -c "SELECT COUNT(*) FROM mart.daily_events;"`, covering both success and failure cases.

## Commit & Pull Request Guidelines
History currently shows one short `beta` commit, so keep future commits equally concise, imperative, and `<scope>: <verb>` formatted (e.g., `feat: refine recommendation copy`). PRs must describe affected services, list the commands/tests run, link tracking issues, attach UI screenshots when `growit/` changes, and rebase before review.

## Security & Configuration Tips
Copy `.env.example` to `.env` (and `growit/.env.local`) instead of committing secrets—Docker already supplies the MinIO/Postgres credentials. Keep compose paths writable for `data/`, `pg/`, and `tmp/`, and treat `web/users.json` as demo-only credentials.
