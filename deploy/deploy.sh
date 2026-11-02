#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
source ./common.sh

mode=release
skip_backup=0
skip_pull=0

for arg in "$@"; do
  case "$arg" in
    --rollback) mode=rollback ;;
    --skip-backup) skip_backup=1 ;;
    --no-pull) skip_pull=1 ;;
    *)
      echo "Usage: deploy/deploy.sh [--rollback] [--skip-backup] [--no-pull]" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$state_dir"
if ! mkdir "$state_dir/lock" 2>/dev/null; then
  echo "Another release is running (remove $state_dir/lock if it is stale)." >&2
  exit 1
fi
trap 'rmdir "$state_dir/lock"' EXIT

step="preflight"

on_error() {
  echo >&2
  echo "Release failed during step: $step" >&2
  case "$step" in
    rollback)
      echo "The rollback did not complete. Look at the logs with deploy/compose.sh logs --tail 100." >&2
      ;;
    preflight | pull | build | backup | migrate)
      if [ "$step" = migrate ]; then
        echo "The migration failed. The running app was not touched. Migrations run in a transaction," >&2
        echo "so the database is unchanged. Fix the migration and release again." >&2
      else
        echo "Nothing was changed on the running app." >&2
      fi
      ;;
    *)
      echo "The new version may be running but unhealthy. Options:" >&2
      echo "  1. Look at the logs: deploy/compose.sh logs --tail 100" >&2
      echo "  2. Go back to the previous images: deploy/deploy.sh --rollback" >&2
      echo "  3. If the release included a migration, also restore the database taken before it:" >&2
      echo "     deploy/restore.sh run" >&2
      ;;
  esac
}
trap on_error ERR

require_env_file

if [ "$mode" = rollback ]; then
  step="rollback"
  previous="$(cat "$state_dir/previous" 2>/dev/null || true)"
  if [ -z "$previous" ]; then
    echo "No previous release recorded." >&2
    exit 1
  fi
  export IMAGE_TAG="$previous"
  for image in bis-prod-backend bis-prod-web bis-prod-backup; do
    docker image inspect "$image:$previous" >/dev/null
  done
  compose up -d --wait --no-deps --no-build backend photo-cleaner caddy backup
  smoke_test
  current_before="$(current_tag)"
  echo "$previous" >"$state_dir/current"
  echo "${current_before:-}" >"$state_dir/previous"
  echo "Rolled back to $previous."
  echo "If the failed release applied database migrations, run deploy/restore.sh run to restore the pre-release backup."
  exit 0
fi

if [ "$skip_pull" -eq 0 ]; then
  step="pull"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "The working tree has local changes: commit or discard them first." >&2
    exit 1
  fi
  git fetch --quiet origin
  git merge --ff-only '@{u}'
fi

export IMAGE_TAG
IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
echo "Releasing $IMAGE_TAG"

step="build"
compose build

step="database"
compose up -d --wait db

if [ "$skip_backup" -eq 0 ]; then
  step="backup"
  compose run --rm backup /usr/local/bin/backup.sh pre-release
else
  echo "Skipping the pre-release backup (--skip-backup)."
fi

step="migrate"
compose run --rm migrate

step="start"
compose up -d --wait --remove-orphans

step="smoke test"
smoke_test

step="cleanup"
previous="$(current_tag)"
if [ "$previous" != "$IMAGE_TAG" ]; then
  echo "$previous" >"$state_dir/previous"
fi
echo "$IMAGE_TAG" >"$state_dir/current"

keep_previous="$(cat "$state_dir/previous" 2>/dev/null || true)"
for image in bis-prod-backend bis-prod-web bis-prod-backup; do
  docker image ls "$image" --format '{{.Tag}}' | while read -r tag; do
    if [ "$tag" != "$IMAGE_TAG" ] && [ "$tag" != "$keep_previous" ]; then
      docker image rm "$image:$tag" >/dev/null 2>&1 || true
    fi
  done
done
docker image prune -f >/dev/null

echo "Release $IMAGE_TAG is live."
