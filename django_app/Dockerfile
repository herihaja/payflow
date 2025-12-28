# django_app/Dockerfile (development)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

# Install system deps needed for PostgreSQL and building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy project files
COPY . /app/

EXPOSE 8000

# Entrypoint will run migrations/collectstatic then exec the CMD
ENTRYPOINT ["./entrypoint.sh"]
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:${DJANGO_PORT:-8000}"]