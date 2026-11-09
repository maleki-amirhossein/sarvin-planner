# Personal-server deployment

Current access is **https://87.107.160.160:8443** on `echoa`. At the user’s request on 2026-11-09, the initial private deployment was promoted to public HTTPS without purchasing/configuring a domain. The existing valid IP certificate is terminated by a dedicated host Nginx listener. The same server database, account and password are preserved. Scheduled off-server backup/retention and remaining acceptance checks are still pending; see the QA report. Never point the server at the local owner database or seed production fixtures.

## Current public IP HTTPS topology

`Internet → host Nginx :8443 (TLS) → Caddy 127.0.0.1:18080 → private Nest/Next containers`. The existing Nginx virtual hosts on ports 80/443 are unchanged. `infra/nginx/sarvin-echoa.conf` uses the existing Let's Encrypt IP certificate `/etc/letsencrypt/live/echoa-api-ip/fullchain.pem`; its private key remains host-only. The existing certbot timer and Nginx deploy hook manage renewal. IP certificates are short-lived; monitor renewal failures and expiry. See [Let's Encrypt IP certificate availability](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability).

Apply `compose.public-proxy.yaml` **after** the base and tunnel overrides. It requires `PUBLIC_APP_ORIGIN=https://87.107.160.160:8443`, the actual Docker edge gateway in `HOST_PROXY_IP` (currently `172.19.0.1`), and `PUBLIC_CADDYFILE` pointing to `Caddyfile.nginx`. Public mode enforces Secure cookies and disables the localhost HTTP exception. Nginx replaces forwarded headers with the actual scheme/client; Caddy trusts only the explicitly configured host gateway, following [Caddy's trusted proxy configuration](https://caddyserver.com/docs/caddyfile/options#trusted-proxies). Revalidate that gateway if the edge network is recreated.

```sh
COMPOSE_FILE=compose.yaml:compose.tunnel.yaml:compose.public-proxy.yaml COMPOSE_ENV_FILES=.env.server node scripts/ops/check-public-proxy.mjs
```

On echoa, the overlay and internal proxy file are in `/opt/sarvin-planner/shared/public-proxy`, secrets/config are in mode-600 `/opt/sarvin-planner/shared/.env.server`, and `/opt/sarvin-planner/manage` includes all three Compose files. The backup service uses the same config. The previous private access wrapper/config are retained under `shared/before-public-20261109` for deliberate rollback. A backup was taken before switching. Never restore the insecure tunnel settings while leaving the public Nginx listener enabled: disable that listener and reload Nginx first if rolling back.

Only Nginx 8443 is newly public. Caddy remains loopback-only; database/API/web have no public ports. Nginx access logging is off for this site, error logs use the existing rotated `/var/log/nginx/*.log` policy, and HTTP accidentally sent to 8443 redirects to canonical HTTPS. No SSH tunnel is needed to use the app. The old localhost tunnel URL is no longer a supported login origin.

## Initial private server access (superseded on echoa)

Use `compose.yaml` plus `compose.tunnel.yaml` **instead of** the public HTTPS override. The tunnel override publishes only `127.0.0.1:18080` on the server, removes the PostgreSQL host port, keeps the database network internal, and applies memory/CPU limits. Nginx and other existing services on ports 80/443 remain untouched. HTTP and non-Secure cookies are allowed only for the exact localhost origins; the remote transport is encrypted by SSH. Never change the binding to `0.0.0.0` or allow an IP/public HTTP origin. A host TLS proxy requires the separate public override above.

Generate independent secrets into a mode-600 `.env.tunnel` using `.env.tunnel.example`, and set explicit release image tags. Validate without printing configuration:

```sh
COMPOSE_FILE=compose.yaml:compose.tunnel.yaml COMPOSE_ENV_FILES=.env.tunnel node scripts/ops/check-tunnel.mjs
```

Build images for the server architecture (`linux/amd64` on echoa), using the pinned lockfile. Build locally when server resources are constrained, then transfer images with `docker image save | gzip | ssh echoa 'gunzip | docker load'`. Transfer only Git-eligible source files, never local env files, owner credentials or `.local` artifacts. The separately generated server env file must be sent over SSH and stored mode 600. Verify image IDs and source hashes after transfer.

The installation layout is `/opt/sarvin-planner/releases/<release>`, `/opt/sarvin-planner/current`, `/opt/sarvin-planner/shared/.env.tunnel` and `/opt/sarvin-planner/backups`. Run Compose with the explicit env and both config files. Apply committed migrations once, then start the application. Create the first owner only after checking the new database has no owner; do not reuse local data or reset an existing owner.

To access the server from this computer, keep this command running:

```sh
ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 127.0.0.1:18080:127.0.0.1:18080 echoa
```

Open http://localhost:18080. This URL is the **server application through the tunnel**, separate from the local application at port 8080. The tunnel must be reconnected after the computer/network restarts. VPN routing initially prevented SSH banner exchange; connection worked after the VPN was disconnected. Private access does not verify public DNS, TLS certificates, HTTPS cookies, certificate renewal or off-server backup scheduling; those acceptance items stay open until configured.

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

## Current private release and operator commands

Verified release: `20261109-101631-c81a785606b2` on echoa. `/opt/sarvin-planner/manage ps` checks the isolated stack; its wrapper fixes the Compose project/config/env paths. The new owner exists, so do not run owner creation again. No local schedules were imported. Operator receipt is `/opt/sarvin-planner/shared/release.json`; no secrets are included.

`systemctl status sarvin-backup.timer` shows the daily 03:30 Tehran schedule. `systemctl start sarvin-backup.service` makes a protected on-server dump. Backups are in `/opt/sarvin-planner/backups`. The first real backup was downloaded to the client and restored in a disposable database. Automated off-server upload, encryption/recovery policy, retention and notifications still need a chosen destination. Local dumps are not pruned automatically. Approximately 4.3 GiB disk was free after deployment; never prune other projects' images or volumes as routine maintenance.

Only Sarvin containers were restarted for persistence verification. Do not reboot the shared server or change Nginx/Echoa services for Sarvin checks without explicit authorization. Public-domain deployment later requires resolving the existing Nginx ownership of 80/443 before applying the public Compose override.

### Certificate renewal operator note

The timer uses `/opt/echoa-certbot/bin/certbot` (5.8), **not** Ubuntu's `/usr/bin/certbot` (2.9). The latter cannot handle the existing IP-only certificate. The following staging renewal and Nginx deploy-hook test passed on 2026-11-09 without replacing the active certificate:

```sh
/opt/echoa-certbot/bin/certbot renew --cert-name echoa-api-ip --dry-run --run-deploy-hooks --no-random-sleep-on-renew
```

The active timer checks every six hours with up to 30 minutes jitter. Keep its existing HTTP-01 webroot route on port 80 intact. Public access and Secure-cookie verification passed after the Nginx reload. Automatic external failure notifications still need a destination.
