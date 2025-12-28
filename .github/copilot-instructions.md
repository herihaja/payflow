# copilot-instructions for payFlow

Short summary

- payFlow is a minimal two-service monorepo: a Django backend in `django_app/` and a Vite React frontend in `react_app/`. Services are composed with `docker-compose.yml` and an optional PostgreSQL service (`db`).

Quick start (development)

1. Copy `.env.example` → `.env` and edit values (e.g. `SECRET_KEY`, DB credentials).
2. Start everything: `docker-compose up --build` (Django on port 8000, React on port 3000)
3. Django migrations and `collectstatic` are run automatically by `django_app/entrypoint.sh` on container start.

Useful local commands (examples)

- Run Django dev server locally (no Docker):
  - `cd django_app && pip install -r requirements.txt && python manage.py runserver`
- Create superuser / run management commands inside container:
  - `docker-compose run --rm django python manage.py createsuperuser`
  - `docker-compose exec django python manage.py migrate`
- React dev server locally:
  - `cd react_app && npm install && npm start` (Vite on port 3000)
  - Build production frontend: `npm run build` in `react_app/`

Key discoverable patterns & gotchas

- Environment loading: `django_app/payflow/settings.py` loads a `.env` from repository root via `python-dotenv`.
- Database behavior (important): settings attempt to support Postgres when `DB_NAME` is set, but there is a later unconditional assignment that forces SQLite (`db.sqlite3`). If you expect Postgres to be used by docker-compose, verify `django_app/payflow/settings.py` — currently the second `DATABASES = {...sqlite...}` will override the earlier conditional block.
- `db.sqlite3` is committed in the repo for convenience; be cautious about data and merges.
- Docker volumes:
  - `django` service mounts `./django_app:/app` (code changes are live inside container)
  - `react_app` service mounts `./react_app:/app/react_app` (note: the Dockerfile `WORKDIR` is `/app`; the mount point is `/app/react_app` — this can affect where files appear inside the container and where `npm` runs)
- Entrypoint: `django_app/entrypoint.sh` runs migrations and `collectstatic` automatically; `collectstatic` can fail if `STATIC_ROOT` is not set — add `STATIC_ROOT = BASE_DIR / "staticfiles"` to `django_app/payflow/settings.py` for a sensible default, and in production set `STATIC_ROOT` to a persistent directory or remote storage backend.
- Postgres disk warnings: you may see `FATAL: could not write lock file "postmaster.pid": No space left on device` in `docker compose logs db`. Check host disk and Docker usage with `df -h` and `docker system df`; prune unused resources carefully (e.g., `docker system prune --volumes`) or reinitialize the `django_data` volume if you want a clean DB.
- Frontend → backend: React reads `REACT_APP_API_URL` from environment (see `.env.example`). For Vite, prefix env vars with `REACT_APP_` as required.
- Production Dockerfile: `django_app/Dockerfile.prod` exists and uses `gunicorn` and a non-root user; prefer it for image builds intended for deployment.

Files to inspect for feature work or troubleshooting

- `docker-compose.yml` (service wiring and ports) — note: Redis and a `worker` service have been added for Celery
- `.env.example` (all env variables used in dev) — add `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND` if you want non-default values
- `django_app/entrypoint.sh`, `django_app/Dockerfile`, `django_app/Dockerfile.prod`
- `django_app/payflow/settings.py` (env loading and DB configuration) — also contains `CELERY_*` settings and `django_celery_results` configuration
- `react_app/package.json`, `react_app/Dockerfile`, `react_app/src/` (frontend)

When you see failures

- DB connection errors: check `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD` in `.env` and confirm whether `settings.py` ended up using SQLite (see "Database behavior" above).
- Missing dependencies in React: run `npm install` inside `react_app` or `docker-compose run react_app npm install`.
- Migrations fail on container start: try `docker-compose run --rm django python manage.py migrate` and inspect the output.

Examples of high-value changes to request (for future PRs)

- Fix the double `DATABASES` definition so setting `DB_NAME` activates Postgres as intended.
- Add basic tests and a GitHub Actions workflow (none present in repo currently).
- Add a brief `README.md` at root describing local dev workflow (this file is minimal and intended for agent use only).

If anything in this sheet is unclear or you want more detail (examples of git commands, preferred commit messages, or conventions for adding endpoints and components), tell me which area to expand and I will iterate.

Batch upload API (added):

- POST `/api/batches/` — multipart form upload with a single Excel file in `file`; processing auto-starts on upload.
- GET `/api/batches/<id>/` — get batch meta and status (summary and items).
- GET `/api/batches/<id>/items/` — list per-row items with their status and result messages.

The per-row processing is queued to Celery (broker: Redis). For now the USSD/modem call is mocked in `batch.tasks.process_batch_item`.

---

Please review and let me know which sections you want expanded or if I should merge this into an existing guidance file (if you have one elsewhere).
