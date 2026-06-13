#!/bin/sh
set -eu

if command -v docker >/dev/null 2>&1; then
  DOCKER="docker"
elif [ -x /Applications/Docker.app/Contents/Resources/bin/docker ]; then
  DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
else
  echo "Docker CLI not found." >&2
  exit 1
fi

"$DOCKER" stop bakers-world-cup-picks-postgres >/dev/null
echo "Postgres stopped."
