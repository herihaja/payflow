Auth notes for frontend / testing

- The backend uses DRF Token authentication by default (`TokenAuthentication`).
- To authenticate uploads from the frontend, obtain a token (e.g., via the admin or via an auth endpoint) and store it in localStorage:
  - localStorage.setItem('authToken', '<your-token>')
  - or localStorage.setItem('token', '<your-token>')
- Create a token server-side (examples):
  - Via Django admin: go to Admin → Tokens and create a token for a user.
  - Via management command inside the django container: `docker compose exec django python manage.py drf_create_token <username>`
- The `BatchUploader` will automatically add the header `Authorization: Token <your-token>` when available.
- If you prefer session-based auth (login with Django session), the frontend uses `credentials: 'include'`, but you must also include a valid CSRF token on POST requests (Django's CSRF cookie + X-CSRFToken header).
