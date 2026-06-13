# Local Development

## Database

Docker Desktop must be running.

Start Postgres:

```sh
npm run db:start
```

The scripts use `docker` from PATH when available, and fall back to Docker Desktop's macOS CLI path.

Create `.env.local` from `.env.local.example`, then run migrations and seed data:

```sh
cp .env.local.example .env.local
npm run prisma:migrate
npm run db:seed
```

Add your football-data.org token to `.env.local` as `FOOTBALL_DATA_API_KEY` before working on the provider integration.

Run the app:

```sh
npm run dev
```

Local seeded users all use `password` as the password. The default admin user is `baker`.

Stop Postgres:

```sh
npm run db:stop
```
