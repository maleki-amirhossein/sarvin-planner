# Personal-server deployment

Preparation is implemented. No server, domain, or off-server destination has been supplied; **nothing has been deployed to a real domain**. Local HTTP works at http://localhost:8080. Do not point production at the local database or use test fixtures there.

## Server prerequisites and configuration

Record the actual OS/architecture, available RAM/disk, SSH method, existing listeners/services, domain/DNS, and backup destination before changing that server. Use Docker Engine with Compose 2.24.4 or newer. Inspect existing ports 80/443 before installing Caddy; do not replace another service's configuration blindly.

Create `.env.production` from `.env.production.example`, set mode 600, and generate independent secrets locally:

```sh
openssl rand -hex 32       # PostgreSQL password; hex avoids URL escaping problems
openssl rand -base64 48   # session secret
chmod 600 .env.production
export COMPOSE_FILE=compose.yaml:compose.production.yaml
export COMPOSE_ENV_FILES=.env.production
node scripts/ops/check-production.mjs
```

Set the real domain in `CADDY_SITE_ADDRESS` without a scheme and the exact HTTPS origin in `APP_ORIGINS`. Set immutable release tags in `API_IMAGE` and `WEB_IMAGE` for each release. The production override removes the PostgreSQL host port and publishes only Caddy 80/443. The database network is internal in production; local development uses a loopback database port. Web/API run as non-root users with init, graceful shutdown, readiness dependencies, and bounded Docker logs.

Caddy preserves `/api` and proxies it to Nest; other paths go to Next. Configure DNS A/AAAA records and firewall access for 80/443. Remove an incorrect AAAA record rather than assuming IPv6 works. Caddy persists certificates in its named volumes and obtains/renews them when the real domain is reachable. Certificate issuance and renewal remain unverified until deployment.

`TRUST_PROXY=loopback,uniquelocal` assumes only the container network reaches Nest. Revisit it if the topology changes; never publish Nest directly or trust arbitrary Internet proxies. Production validation rejects insecure cookies, local origins, example domains and placeholder secrets. The API also validates these settings at startup.

## Release procedure

1. Review the release diff and migration compatibility. Keep the previous image tags and a recent backup.
2. Run the full local checks in README, then `docker compose build` with the intended release tags.
3. Start PostgreSQL with `docker compose up -d db`. Before an upgrade, run `scripts/ops/backup.sh` and verify the off-server upload.
4. Run exactly one migration job: `docker compose run --rm --no-deps migrate`. Stop on failure. Do not run schema-changing jobs simultaneously or use `migrate dev` in production.
5. Run `docker compose up -d`, then `docker compose ps`. The dependency migration job may perform a harmless second no-op deploy, but only after the explicit job has completed. Keep one API replica for this personal app.
6. Create the owner from an interactive terminal: `docker compose exec api node dist/setup/owner.js malekii.dev@gmail.com`. Enter a unique password in the masked prompt. Do not place it in shell arguments, logs or chat. There is no public signup.
7. Run `WEB_URL=https://REAL_DOMAIN pnpm smoke`, then verify browser login, reload, task movement, reading persistence and logout over HTTPS. Inspect Secure/HttpOnly/SameSite cookies without copying their values.
8. Restart containers and verify data and unexpired sessions survive. Record the real URL and results in the handoff report.

Never run `docker compose down -v` as troubleshooting. Image rebuilds and normal `down` preserve named volumes. PostgreSQL initialization variables do not rotate the password of an existing role; use an explicit database password rotation and update every dependent secret together.

## Backups, retention and restore

Set `BACKUP_DIR` to a private directory owned by the deployment operator. `scripts/ops/backup.sh` writes a custom-format PostgreSQL dump atomically with mode 600. Dumps contain private data and password hashes: never commit them, publish them, or put them in the web public directory.

For off-server backups, configure an initialized, encrypted **restic** repository and a protected `RESTIC_PASSWORD_FILE`. Repository/provider credentials belong in a mode-600 environment file outside the repository. Set `RESTIC_REPOSITORY` and `RESTIC_PASSWORD_FILE`; the script requires upload success and applies 7 daily, 5 weekly and 12 monthly snapshots tagged `sarvin-postgres`. Keep the recovery password separately from the server. Use provider access limited to the chosen backup repository.

`infra/backup.cron.example` is a template only; it has not been installed. Configure failure notifications and log rotation on the real host. A local dump by itself does not satisfy the off-server backup requirement. Local dump files are not automatically purged; set a disk budget and only remove older local copies after verified off-server upload and restore testing.

Test any downloaded dump without touching the active database:

```sh
scripts/ops/restore-test.sh /private/path/sarvin.dump
```

The script creates a generated `sarvin_restore_test_*` database, restores with fail-on-error, checks application tables/migrations, and drops only that temporary database. A local schema/data restore was executed during development. Repeat with an off-server downloaded backup and representative populated data before closing deployment acceptance.

For disaster recovery, stop API writes, restore into a **new** database, verify counts and application behavior privately, then switch `DATABASE_URL`/database configuration. Preserve the original database until the restored instance has been accepted. Restoring also restores session records; rotate the session secret or revoke sessions if the backup may have been exposed or old sessions should not remain valid.

## Monitoring and rollback

Readiness `/api/health` checks PostgreSQL; liveness `/api/health/live` checks only the API process. Public replies contain no configuration or database details. Monitor HTTPS readiness externally, backup job exit status, disk usage and certificate expiry. Docker JSON logs rotate at 10 MB × 3 files per service. Access logging of private URLs/bodies is not enabled. Avoid debug logs with passwords, session cookies, notes or exported data.

An application rollback means selecting the previous immutable `API_IMAGE`/`WEB_IMAGE` tags and restarting those services **only if the current schema remains backward-compatible**. Applied migrations are never edited or automatically reversed. For an incompatible migration, prefer a forward repair; otherwise restore the pre-migration backup to a new database during a maintenance window and explicitly assess data written since the backup. An old image alone does not restore an old schema.

Remaining real-host checks: access/inventory, DNS, HTTPS/cookie verification, owner bootstrap, off-server scheduled backup and downloaded restore, reboot persistence, monitoring delivery and certificate renewal.
