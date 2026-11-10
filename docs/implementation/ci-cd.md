# Automatic deployment to amirhossein

The `CI and deploy` GitHub Actions workflow runs on pushes to **main and master**.
Pull requests run verification only; manual runs can deploy only these two branches.
The production environment permits both branches, with no approval pause. Both
branches target the same application/database: the later successful run wins.

## Pipeline

1. Ubuntu runner installs Node 24 and pnpm 10.34.9 with the frozen lockfile.
2. Contracts, lint, types, unit/deployment tests, production builds, database,
   HTTP/HTTPS authentication and domain acceptance run against disposable PostgreSQL 18.
3. Build API/web amd64 Docker images tagged with commit SHA, run number and attempt.
   Package images, committed source and SHA-256 checksums; retain the artifact for three days.
4. A separate environment-bound job on the non-root amirhossein deployment runner downloads
   the verified artifact, then sends it over pinned-host **loopback** SSH. The server
   initiates the GitHub connection because hosted runners cannot reach its SSH port.
5. The host validates archive boundaries, tags, architecture, revision, migration
   checksums and available disk space. Existing applied migrations cannot be rewritten.
6. Create a private pre-deployment database backup. When new migrations exist,
   stop API writes before the backup and apply committed migrations once.
7. Atomically select the release, replace only API/web, wait for container health,
   then verify public TLS, database readiness, Persian login, logo and private-route protection.
8. Retain current/previous images after success. At the next rollout, keep the
   current image as the rollback target and prune older Sarvin images before import. Remove only obsolete Sarvin CI images and the
   recorded original Sarvin baseline, never unrelated images/volumes or backups.

Workflows queue instead of interrupting running migrations. The host additionally
locks deployments and rejects older/already successful run sequences. GitHub's
`queue: max` supports up to 100 pending runs; it does not guarantee dispatch-order
execution, so the server sequence guard also prevents stale overwrites. See
[GitHub concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
The worker runs as a transient systemd service so losing SSH does not kill a migration.

## Credentials and host boundary

Production environment secret: `DEPLOY_SSH_KEY`. Production variables: `DEPLOY_HOST` (127.0.0.1),
`DEPLOY_HOST_KEY_ALIAS`, `DEPLOY_KNOWN_HOSTS` and `PUBLIC_APP_ORIGIN`. Repository
variable `DEPLOY_RUNNER_LABEL` selects the unique host runner. `HostKeyAlias` pins the actual public host identity for the loopback connection. The host key was obtained through the existing authenticated
administrator SSH connection, not trusted from an unauthenticated key scan.
The dedicated deploy public key has `from="127.0.0.1,::1",restrict,command="/usr/local/lib/sarvin/deploy.py"`
in root's authorized_keys: shell commands, PTY, forwarding and agent forwarding
are unavailable. This key is an application-deployment credential: pushed application
code necessarily has access to its own database/session environment inside the API.
Never grant untrusted users write access to either deployment branch.

Owner passwords, database/session secrets, real envs and backups remain off GitHub.
The runner database password is only a disposable CI fixture. Pull requests do not
receive deployment credentials. Actions are pinned to full commit SHAs and checkout
does not persist credentials.

Host-managed files are outside release source:

- `/usr/local/lib/sarvin/deploy.py`: forced-command receiver and systemd worker.
- `/opt/sarvin-planner/shared/runtime/`: frozen Compose and backup tooling.
- `/opt/sarvin-planner/shared/.env.server`: existing protected production secrets.
- `/opt/sarvin-planner/current`: selected release with `images.env`, manifest and source archive.
- `/opt/sarvin-planner/shared/ci-state.json`: status, commit, previous release and backup receipt.
- `/opt/sarvin-planner/manage`: stable Compose wrapper using current image tags.

Infrastructure/gateway changes require an administrator to review and install them;
an ordinary source push updates application images and migrations, not host Nginx,
ports, secrets, Compose mounts or root-executed backup scripts. Initial bootstrap
uses `scripts/ci/install-host.sh <dedicated-public-key-file>` on the existing configured
server, with `deploy.py` beside it. Re-running preserves existing runtime config.
Key rotation means installing the new restricted public key, updating the environment
secret and removing the old dedicated key after verification. Never replace other keys.

## Failure and recovery

If no migration was attempted and candidate health fails, the previous release is
selected and started automatically. If a new migration was attempted, old-code
rollback/automatic database restore is unsafe: the API is stopped, the job fails,
and an administrator must inspect and repair forward. Neither path deletes data.
Pre-deployment dumps stay private under `/opt/sarvin-planner/backups`.

Inspect without printing secrets:

```sh
gh run list --workflow ci-cd.yml
gh run view RUN_ID --log-failed
ssh amirhossein 'cat /opt/sarvin-planner/shared/ci-state.json'
ssh amirhossein '/opt/sarvin-planner/manage ps'
ssh amirhossein 'journalctl -u sarvin-deploy-RUN_NUMBER-ATTEMPT --no-pager'
```

For a safe manual rollback **only after confirming database compatibility**, use
the previous release path from the receipt, atomically replace `current`, then run
`/opt/sarvin-planner/manage up -d --no-deps --no-build --pull never --wait api web`
and public smoke checks. Do not run `migrate dev`, reset/seed production, or restore
a dump over live data as routine recovery. Rerun the failed Actions job to produce
a new deployment attempt number while reusing its verified build artifact. If the
three-day artifact retention has expired, rerun the entire workflow to rebuild it.
A previously attempted deployment number is not reusable.

No new owner is created during deployment. Daily backup and certificate-renewal
timers continue independently. Automatic off-server backup retention/alerts remain
separate outstanding work. Low disk fails before migration; investigate Sarvin
release images/artifacts and the backup policy instead of pruning other projects.

## Verification record

Twelve local deployment boundary/recovery tests cover command injection, traversal,
symlinks, duplicate entries, bundle integrity, applied-migration changes, safe
image rollback and migration-failure forward repair. Restricted SSH rejected a
real arbitrary-shell request. The fixed runtime configuration validated and the
daily backup service ran successfully after bootstrap. See QA/handoff for the
actual GitHub run and public deployment result.

## Deployment runner

`amirhossein-sarvin-deploy` runs as the dedicated `sarvin-ci` user, without sudo or Docker
group access. Only the deploy job uses it; builds and PR tests stay GitHub-hosted.
The root-owned pre-job hook checks repository, workflow, event, branch and job
identity. The repository requires approval for **every external contributor's PR
workflow**; review workflow changes before approving any such run. Do not run
untrusted code on this server runner or relax those settings.

Runner config/binaries are root-owned; only `_work` and `_diag` are writable.
The hook is `/usr/local/lib/sarvin-runner-guard.sh`. The systemd service has a
768 MiB memory cap and 75% CPU quota; release artifacts are removed after the job.
`install-runner.sh` reads a short-lived repository runner registration token from
stdin; a broad account token is never copied to the server. The distribution
(v2.338.2) is checked against GitHub's SHA-256 before installation.

Automatic runner binary updates are deliberately disabled to preserve root-owned
configuration. Administrators must update it when GitHub releases new versions
(within GitHub's 30-day update window, sooner for critical releases), preserving
the hook, permissions and service limits. Stop the runner when idle, replace the
verified official binaries, reinstall permissions and restart its systemd service.
Application deployments themselves remain automatic and require no approval.

The first hosted-runner attempt passed all verification/build steps but timed out
connecting to echoa:22 before any release or database change. The outbound runner
path replaces that network dependency; see the QA record for the successful run.

First successful production run: [42582507446](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42582507446), commit `9b9439c`.
The existing owner session survived replacement of API/web, private task data was
unchanged, and logout/public HTTPS smoke passed from the client machine.
Runner update requirements follow [GitHub’s runner reference](https://docs.github.com/en/actions/reference/runners/self-hosted-runners#runner-software-updates-on-self-hosted-runners).

## Compose migration command correction — 2026-11-09

`docker compose run` does not accept `--no-build`. Use the reviewed
`run_migrations` helper with `run --rm --no-deps --pull never migrate` after image
validation/loading. The host-owned deployment script was patched to match this
fix; its original copy is retained beside it. Thirteen deployment tests now include
a check of migration options against the actual installed Compose CLI help.
Run 42596150213 failed before SQL execution, then was recovered forward under the
deployment lock with its original backup and verified release. See QA/handoff.


## Replacement VPS — 2026-11-10

Current app: **https://5.160.200.254**, administrator access `ssh amirhossein`.
The user explicitly chose to retain Ubuntu 20.04 and use a **fresh database**.
No old database, backup, schedule or account was imported. A new owner was created
through the masked CLI; its credentials are only in ignored mode-600
`.local/amirhossein-owner-login.json`. Do not re-provision it. The old echoa
SSH/HTTPS timed out from client/new VPS and its runner was offline during setup.

The new host has Docker 28.1.1, Compose 2.35.1, Nginx and Python 3.8.10, with the
existing amd64 application images. These Docker versions are the last candidates
in Docker's Focal repository; this is not a claim of current platform support.
Ubuntu 20.04 remains the user's explicit choice. Gateway hashing now streams SHA-256
without requiring Python 3.11. The guarded runner is v2.338.2, verified against its
published checksum, non-root and without Docker/sudo privileges.

| Scope | Variable | Value |
| --- | --- | --- |
| Repository | `DEPLOY_RUNNER_LABEL` | `sarvin-deploy-amirhossein` |
| Production | `DEPLOY_HOST` | `127.0.0.1` |
| Production | `DEPLOY_HOST_KEY_ALIAS` | `5.160.200.254` |
| Production | `DEPLOY_KNOWN_HOSTS` | Existing RSA host key obtained over authenticated admin SSH |
| Production | `PUBLIC_APP_ORIGIN` | `https://5.160.200.254` |

The runner label must be a **repository** variable, available when GitHub evaluates
`runs-on`. The unique label prevents a recovered old runner from taking new jobs.
`DEPLOY_SSH_KEY` was replaced with a new restricted loopback-only deployment key.
Bootstrap command: `install-runner.sh amirhossein-sarvin-deploy sarvin-deploy-amirhossein`,
with the short-lived registration token on stdin. The workflow reads the origin and
SSH alias from variables; the installed worker reads and validates `PUBLIC_APP_ORIGIN`
from host-owned `.env.server`, never evaluating or logging the secret file.

Host Nginx uses `infra/nginx/sarvin-vps.conf` on 443; port 80 serves HTTP-01 challenges
and redirects to HTTPS. Caddy remains on loopback 18080 and trusts only the inspected
edge gateway, 172.19.0.1. DB/API/web expose no public ports. Secure host-only cookies,
exact HTTPS origin, private route protection and forwarding sanitization passed.

Certbot 5.8.0 runs as a digest-pinned container so it does not depend on host Python.
The host-owned `/usr/local/lib/sarvin/renew-ip-certificate.sh` is installed from the
reviewed source script. `sarvin-cert-renew.timer` checks every six hours with up to
30 minutes jitter. A successful renewal creates a marker, validates Nginx and reloads
it; a failed reload retains the marker for retry. Check with:

```sh
ssh amirhossein 'systemctl list-timers sarvin-cert-renew.timer sarvin-backup.timer'
ssh amirhossein '/usr/local/lib/sarvin/renew-ip-certificate.sh --dry-run --run-deploy-hooks'
```

Trusted IP HTTPS issuance and staging renewal/deploy-hook test passed. Daily protected
backups run at 03:30 Tehran. A real dump was downloaded privately, copied back, restored
into a disposable database and verified (5 migrations, 1 owner, 0 tasks/reading sessions);
that temporary database was removed. Scheduled encrypted off-server retention and
failure notifications remain pending; this manual download does not complete them.

Bootstrap used the verified Actions artifact for `2f49906`, run `42765345145` (10/1).
General/PWA HTTP smoke, owner login/logout, CSRF/origin rejection, API-restart session
continuity and runtime configuration checks passed. Fourteen local deployment tests,
shell syntax and workflow lint passed; the installed actionlint predates the existing
GitHub-supported `concurrency.queue` key, so only that existing diagnostic was excluded.
A full deployment on the new runner is pending at this checkpoint; see QA/handoff for
the subsequent Actions result. No browser control was used.
