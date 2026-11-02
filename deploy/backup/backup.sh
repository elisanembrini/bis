#!/bin/sh
set -eu

label="${1:-manual}"
workdir=/tmp/dump
dump="$workdir/bis.dump"

ping() {
  if [ -n "${BACKUP_PING_URL:-}" ]; then
    wget -q -O /dev/null -T 10 "${BACKUP_PING_URL}${1:-}" || true
  fi
}

fail() {
  echo "backup failed" >&2
  ping /fail
  exit 1
}

mkdir -p "$workdir"
trap 'rm -rf "$workdir"' EXIT

ping /start

restic cat config >/dev/null 2>&1 || restic init || fail

pg_dump --format=custom --no-owner --file "$dump" || fail
pg_restore --list "$dump" >/dev/null || fail

restic backup --host bis --tag "$label" --tag db "$dump" || fail
restic backup --host bis --tag "$label" --tag photos /data/photos || fail
restic forget --host bis --group-by host,paths --keep-within 14d --prune || fail
restic check || fail

echo "backup completed"
ping
