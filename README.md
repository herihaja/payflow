# payFlow

**payFlow** is a proof-of-concept application that demonstrates how to design and operate a system for **bulk mobile-money payouts**, with a strong focus on **operational visibility, scalability, and reliability**.

The project models a real-world fintech scenario:  
operations teams need to submit large batches of payouts and monitor their execution in real time, without blocking systems or losing visibility into individual failures.

---

## Demo

The demo below shows **payFlow in action**, focusing on the operational workflow rather than setup details.

It demonstrates:

- Submitting a batch of mobile-money payouts
- Asynchronous background processing of individual payout rows
- **Real-time, per-row status updates delivered via WebSockets**
- Scalable row rendering using **infinite scroll** to handle large batches efficiently

▶️ **Watch the demo on YouTube**

[![payFlow demo video](https://img.youtube.com/vi/qrLIiJf32Bk/maxresdefault.jpg)](https://www.youtube.com/watch?v=qrLIiJf32Bk)

---

## Design Goals

This project is intentionally small in scope, but opinionated in design.

Its primary goals are to demonstrate:

- Safe handling of **long-running batch workflows**
- **Real-time operational feedback** without polling
- UI responsiveness under **large data volumes**
- Clear separation of concerns between API, background workers, and presentation

The result is a system that remains predictable and transparent for operators, even during long-running jobs.

---

## What This Project Demonstrates

- Modeling real operator workflows instead of abstract demos
- Asynchronous job execution using background workers
- **Event-driven UI updates via WebSockets**
- Scalable UI patterns for large datasets (infinite scroll)
- Clear state transitions and traceability at batch and row level
- Production-aware architecture, even in a proof-of-concept

---

## Architecture Overview

This repository is organized as a minimal monorepo:

### Backend

**Django + Django REST Framework**

Responsible for validation, persistence, batch orchestration, and state management.

### Frontend

**React (Vite)**

An operator-focused interface for submitting batches and monitoring execution progress in real time.

### Background Processing

**Celery + Redis**

Processes batch rows asynchronously to avoid blocking API requests and to support retries and rate-limit handling.

State changes are propagated to the frontend via **WebSockets**, enabling real-time visibility as jobs progress.

---

## Quickstart

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

   Update required values such as `SECRET_KEY` and database credentials.

2. Start the full stack:
   ```bash
   docker-compose up --build
   ```

- Django API: http://localhost:8000
- React frontend: http://localhost:3000

---

## Useful Commands

### Run Django locally (without Docker)

```bash
cd django_app
pip install -r requirements.txt
python manage.py runserver
```

### Run React locally

```bash
cd react_app
npm install
npm start
```

### Run Django management commands inside containers

```bash
docker-compose run --rm django python manage.py migrate
docker-compose run --rm django python manage.py createsuperuser
```

---

## Notes for Contributors

### Agent Guidance

See `.github/copilot-instructions.md` for concise, project-specific notes for AI coding agents and contributors.

### Background Jobs

Batch rows are processed asynchronously using Celery.  
Redis and a worker service are defined in `docker-compose.yml`.

### Real-Time Updates

Row-level status changes are pushed to the frontend via **WebSockets**, allowing operators to monitor progress live without polling or page refresh.

### Database

PostgreSQL is preferred when `DB_NAME` is set in `.env`.  
If not configured, the project falls back to SQLite for local development.

---

## Scope & Limitations

This project is intentionally presented as a **proof-of-concept**.

Production usage would require additional concerns to be addressed explicitly, such as:

- Provider integrations
- Retry strategies with backoff
- Idempotency
- Observability and monitoring
- Secure credential management

---

## Final Notes

payFlow is designed to demonstrate **how systems behave under real operational constraints**, not just how features are assembled.

If anything is unclear or could be improved, feel free to open an issue or submit a pull request.
