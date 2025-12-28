# payFlow

Minimal monorepo demonstrating a Django backend and a Vite React frontend composed with Docker Compose for local development.

payFlow is a small proof‑of‑concept application that provides a Django backend and Vite React frontend to support **batch mobile‑money sending** (bulk payouts). It’s intended for operator workflows that need to schedule or submit many mobile wallet transfers in a single job. For production use, ensure provider credentials and payout data are stored securely and add monitoring, retries, and rate‑limit handling.

Quickstart

1. Copy `.env.example` → `.env` and edit required values (e.g., `SECRET_KEY`, DB credentials).
2. Start everything: `docker-compose up --build` (Django runs on port 8000, React on port 3000).

Useful commands

- Run Django locally (no Docker):
  - `cd django_app && pip install -r requirements.txt && python manage.py runserver`
- Run React locally:
  - `cd react_app && npm install && npm start`
- Run Django management inside containers:
  - `docker-compose run --rm django python manage.py migrate`
  - `docker-compose run --rm django python manage.py createsuperuser`

Notes for contributors

- Agent guidance: See `.github/copilot-instructions.md` for concise, project-specific notes aimed at AI coding agents and contributors.
- Static files: `STATIC_ROOT` is set to `staticfiles` in `django_app/payflow/settings.py` — in production configure a persistent `STATIC_ROOT` or a remote store.
- Database: By default the project prefers Postgres if `DB_NAME` is set in `.env`. If Postgres is not configured, the project falls back to SQLite.

If anything is missing or unclear in this README, open an issue or submit a PR with suggested improvements.
