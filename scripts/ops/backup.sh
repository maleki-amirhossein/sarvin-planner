#!/usr/bin/env bash
set -euo pipefail
umask 077
# COMPOSE_FILE / COMPOSE_ENV_FILES may select the production deployment.
backup_dir=${BACKUP_DIR:?Set BACKUP_DIR to a private backup directory}
mkdir -p "$backup_dir"
backup_file="$backup_dir/sarvin-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
temporary_file=$(mktemp "$backup_dir/.sarvin-backup.XXXXXX")
trap 'rm -f "$temporary_file"' EXIT
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$temporary_file"
test -s "$temporary_file"
mv "$temporary_file" "$backup_file"
chmod 600 "$backup_file"
# If configured, require an encrypted off-server upload to succeed before reporting success.
if [[ -n "${RESTIC_REPOSITORY:-}" ]]; then
  : "${RESTIC_PASSWORD_FILE:?Set a protected RESTIC_PASSWORD_FILE}"
  restic backup --tag sarvin-postgres "$backup_file"
  restic forget --tag sarvin-postgres --group-by tags --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --prune
fi
printf 'Backup created: %s\n' "$backup_file"
