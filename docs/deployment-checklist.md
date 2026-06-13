# Deployment Checklist

Use this before sharing Baker's World Cup Picks with friends.

## Environment

- Set `DATABASE_URL` for the production Postgres database.
- Set `FOOTBALL_DATA_API_KEY` from football-data.org.
- Set `CRON_SECRET` if the host supports authenticated scheduled requests.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` before the first seed, if using the seed script.

## Database

- Run Prisma migrations.
- Create or seed the admin user.
- Run one manual football-data sync from the admin page.
- Confirm the active tournament has 104 provider matches and 48 provider teams.

## App Checks

- Visit `/` while logged out and confirm today's matches are visible.
- Click a public match and confirm signup opens.
- Create a test user and confirm signup lands on `/predictions`.
- Save one prediction from mobile width.
- Confirm `/leaderboard` shows rank, username, points, tie-breaker details, and last update timing.
- Confirm `/admin` shows the most recent sync status.

## Scheduled Sync

- Confirm the host has registered `vercel.json` cron schedule `30 6 * * *`.
- Confirm the first scheduled run appears in the admin sync table.
- Keep manual sync available as the fallback if the scheduled job misses a match day.
