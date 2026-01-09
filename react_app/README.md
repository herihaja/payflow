# react_app

Run the React dev server in Docker (recommended during local development):

- Build and start only the react app service (it will start dependencies if needed):

```bash
docker-compose up --build react_app
```

- Alternatively start everything:

```bash
docker-compose up --build
```

The dev server should be available at http://localhost:3000 by default.

Notes:

- The `docker-compose.yml` mount target is `/app` so the container's `WORKDIR` and files align with the Dockerfile.
- For local (no Docker) development: `cd react_app && npm install && npm start` (Vite on port 3000).
