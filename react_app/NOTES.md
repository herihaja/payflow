API configuration note:

- When running the React dev server inside Docker, set the API base for in-container access to the Django service host, e.g. `VITE_API_URL=http://django:8000`.
- If you run the React dev server on your host machine (outside Docker), use `REACT_APP_API_URL=http://localhost:8000` or set `VITE_API_URL=http://localhost:8000`.
- Soketi/WebSocket: when running inside Docker, `VITE_WS_URL` is set to `http://soketi:6001` in `docker-compose.yml` and will be used by the frontend to connect (it replaces http->ws automatically in code). To override, set `VITE_WS_URL` in your `.env` or environment.

The component uses `import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:8000'` as a fallback to determine the backend base URL, and `import.meta.env.VITE_WS_URL || import.meta.env.REACT_APP_WS_URL || 'ws://localhost:6001'` as the websocket base URL.
