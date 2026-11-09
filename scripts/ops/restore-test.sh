#!/usr/bin/env bash
set -euo pipefail
backup_file=${1:?Usage: restore-test.sh /path/to/sarvin.dump}
test -r "$backup_file"
# The name is generated here, never supplied by the caller. The owner's database is untouched.
restore_db="sarvin_restore_test_$(date -u +%Y%m%d%H%M%S)_$$"
cleanup() { docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --if-exists "$1"' sh "$restore_db"; }
trap cleanup EXIT
docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" "$1"' sh "$restore_db"
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$1" --exit-on-error --no-owner --no-acl' sh "$restore_db" < "$backup_file"
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1 -c '\''SELECT count(*) AS applied_migrations FROM "_prisma_migrations" WHERE finished_at IS NOT NULL; SELECT count(*) AS owners FROM "Owner"; SELECT count(*) AS tasks FROM "Task"; SELECT count(*) AS reading_sessions FROM "ReadingSession";'\''' sh "$restore_db"
printf 'Restore verified in disposable database: %s\n' "$restore_db"
