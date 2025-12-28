#!/bin/sh
set -e

# Optional: wait-for-db could be implemented here

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Execute the container CMD
exec "$@"
