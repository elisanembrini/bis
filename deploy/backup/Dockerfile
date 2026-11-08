FROM restic/restic:0.19.1 AS restic

FROM postgres:18.6-alpine AS runtime

COPY --from=restic /usr/bin/restic /usr/local/bin/restic
COPY scheduler.sh backup.sh restore.sh /usr/local/bin/

RUN chmod 0755 /usr/local/bin/scheduler.sh /usr/local/bin/backup.sh /usr/local/bin/restore.sh

ENV HOME=/tmp \
    RESTIC_CACHE_DIR=/tmp/restic-cache

USER 10001:10001

ENTRYPOINT []
CMD ["/usr/local/bin/scheduler.sh"]
