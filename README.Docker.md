# Development with Docker Compose

Quick steps to run the project in development using Docker Compose.

1. Build and start services:

```bash
docker compose up --build
```

2. The API will be available at http://localhost:3333 and Postgres on port 5432.

Notes:
- Source is mounted into the container, so code changes are reflected automatically via `pnpm dev` (uses `tsx watch`).
- If you need to run prisma migrations from inside the container:

```bash
# open a shell in the running app container
docker compose exec app sh
pnpm prisma migrate deploy
pnpm dlx prisma generate
```
