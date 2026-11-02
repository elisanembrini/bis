#!/bin/sh
set -eu

hour="${BACKUP_HOUR_UTC:-3}"
case "$hour" in
  [0-9] | 1[0-9] | 2[0-3]) ;;
  *)
    echo "BACKUP_HOUR_UTC must be an integer from 0 to 23, without a leading zero" >&2
    exit 1
    ;;
esac

while true; do
  now=$(date -u +%s)
  target=$(( now - now % 86400 + hour * 3600 ))
  if [ "$target" -le "$now" ]; then
    target=$(( target + 86400 ))
  fi
  while [ "$(date -u +%s)" -lt "$target" ]; do
    touch /tmp/heartbeat
    sleep 30
  done
  if /usr/local/bin/backup.sh nightly; then
    rm -f /tmp/failed
  else
    touch /tmp/failed
  fi
done
