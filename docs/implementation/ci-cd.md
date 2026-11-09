# Automatic deployment to echoa

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
4. A separate environment-bound job on the non-root echoa deployment runner downloads
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

Production environment secret: `DEPLOY_SSH_KEY`. Variables: `DEPLOY_HOST` (127.0.0.1) and
`DEPLOY_KNOWN_HOSTS`. `HostKeyAlias` pins the actual public host identity for the loopback connection. The host key was obtained through the existing authenticated
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
ssh echoa 'cat /opt/sarvin-planner/shared/ci-state.json'
ssh echoa '/opt/sarvin-planner/manage ps'
ssh echoa 'journalctl -u sarvin-deploy-RUN_NUMBER-ATTEMPT --no-pager'
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

`echoa-sarvin-deploy` runs as the dedicated `sarvin-ci` user, without sudo or Docker
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
