#!/bin/sh
set -eu

if command -v docker >/dev/null 2>&1; then
  DOCKER="docker"
elif [ -x /Applications/Docker.app/Contents/Resources/bin/docker ]; then
  DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
else
  echo "Docker CLI not found. Start Docker Desktop and make sure docker is on PATH." >&2
  exit 1
fi

if "$DOCKER" ps -a --format '{{.Names}}' | grep -qx 'bakers-world-cup-picks-postgres'; then
  "$DOCKER" start bakers-world-cup-picks-postgres >/dev/null
else
  "$DOCKER" run \
    --name bakers-world-cup-picks-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=bakers_world_cup_picks \
    -p 5432:5432 \
    -d postgres:16 >/dev/null
fi

for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
  if "$DOCKER" exec bakers-world-cup-picks-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "Postgres is ready on localhost:5432."
    exit 0
  fi
  sleep 1
done

echo "Postgres container started, but did not become ready in time." >&2
exit 1
