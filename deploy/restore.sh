#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
source ./common.sh

usage() {
  echo "Usage: deploy/restore.sh list" >&2
  echo "       deploy/restore.sh run [DB_SNAPSHOT_ID|latest] [PHOTOS_SNAPSHOT_ID|latest]" >&2
  exit 2
}

[ "$#" -ge 1 ] || usage

require_env_file

tag="$(current_tag)"
if [ -z "$tag" ]; then
  echo "No release deployed yet: run deploy/deploy.sh --skip-backup first, then restore." >&2
  exit 1
fi
export IMAGE_TAG="$tag"

command="$1"
shift

case "$command" in
  list)
    compose run --rm restore restic snapshots --host bis
    ;;
  run)
    echo "This replaces the current database and photos with the backup."
    read -r -p "Type 'restore' to continue: " answer
    if [ "$answer" != "restore" ]; then
      echo "Cancelled."
      exit 1
    fi
    compose stop backend photo-cleaner
    compose run --rm restore /usr/local/bin/restore.sh "$@"
    compose up -d --wait --remove-orphans
    smoke_test
    echo "Restore completed."
    ;;
  *)
    usage
    ;;
esac
