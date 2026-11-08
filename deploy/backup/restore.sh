#!/bin/sh
set -eu

db_snapshot="${1:-latest}"
photos_snapshot="${2:-latest}"
workdir=/tmp/restore

mkdir -p "$workdir"
trap 'rm -rf "$workdir"' EXIT

restic restore "$db_snapshot" --host bis --path /tmp/dump/bis.dump --target "$workdir"
pg_restore --clean --if-exists --no-owner --single-transaction --exit-on-error \
  --dbname "$POSTGRES_DB" "$workdir/tmp/dump/bis.dump"

restic restore "$photos_snapshot" --host bis --path /data/photos --target / --include /data/photos --delete

echo "restore completed"
