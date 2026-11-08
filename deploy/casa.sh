#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

export ENV_FILE=.env.casa
export COMPOSE_OVERRIDE="docker-compose.casa.yml docker-compose.casa.ports.yml"
export SMOKE_URL=http://127.0.0.1:8080

source ./common.sh

usage() {
  echo "Usage: deploy/casa.sh deploy [--rollback] [--skip-backup] [--no-pull]" >&2
  echo "       deploy/casa.sh restore list|run [DB_SNAPSHOT_ID|latest] [PHOTOS_SNAPSHOT_ID|latest]" >&2
  echo "       deploy/casa.sh compose <docker compose arguments>" >&2
  exit 2
}

check_loopback_only() {
  local config published loopback
  config="$(compose config)"
  published="$(grep -c 'published:' <<<"$config" || true)"
  loopback="$(grep -c 'host_ip: 127.0.0.1' <<<"$config" || true)"
  if [ "$published" -eq 0 ] || [ "$published" -ne "$loopback" ]; then
    echo "Refusing to start: every published port must be bound to 127.0.0.1 ($loopback of $published are)." >&2
    exit 1
  fi
}

[ "$#" -ge 1 ] || usage
command="$1"
shift

require_env_file

backup_dir="$(env_value BACKUP_DIR)"
if [ "${backup_dir#/}" = "$backup_dir" ]; then
  echo "BACKUP_DIR in $env_file must be an absolute path." >&2
  exit 1
fi
mkdir -p "$backup_dir"

check_loopback_only

case "$command" in
  deploy) exec "$root/deploy/deploy.sh" "$@" ;;
  restore) exec "$root/deploy/restore.sh" "$@" ;;
  compose) exec "$root/deploy/compose.sh" "$@" ;;
  *) usage ;;
esac
