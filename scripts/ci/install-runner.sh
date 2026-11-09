#!/usr/bin/env bash
# Administrator-only bootstrap. Read a short-lived GitHub runner registration
# token from stdin; never put an account PAT or registration token in argv/logs.
set -euo pipefail
umask 077
[[ $(id -u) == 0 ]] || exit 1
IFS= read -r registration_token
runner=/opt/sarvin-runner
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
id sarvin-ci >/dev/null 2>&1 || useradd --create-home --shell /bin/bash sarvin-ci
install -d -o sarvin-ci -g sarvin-ci -m 750 "$runner"
if [[ ! -f "$runner/config.sh" ]]; then
  curl -fsSL --retry 3 -o "$runner/runner.tar.gz" \
    'https://github.com/actions/runner/releases/download/v2.338.2/actions-runner-linux-x64-2.338.2.tar.gz?download=1'
  echo 'baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40  /opt/sarvin-runner/runner.tar.gz' | sha256sum -c -
  tar xzf "$runner/runner.tar.gz" -C "$runner"
  rm "$runner/runner.tar.gz"
fi
cd "$runner"
if [[ ! -f .runner ]]; then
  chown -R sarvin-ci:sarvin-ci "$runner"
  export ACTIONS_RUNNER_INPUT_TOKEN="$registration_token"
  runuser -u sarvin-ci -- ./config.sh --unattended \
    --url https://github.com/maleki-amirhossein/sarvin-planner \
    --name echoa-sarvin-deploy --labels sarvin-deploy --work _work --disableupdate
  unset ACTIONS_RUNNER_INPUT_TOKEN
fi
unset registration_token
install -m 755 "$script_dir/runner-guard.sh" /usr/local/lib/sarvin-runner-guard.sh
python3 - <<'PY'
from pathlib import Path
p = Path('/opt/sarvin-runner/.env')
lines = [line for line in p.read_text().splitlines() if not line.startswith('ACTIONS_RUNNER_HOOK_JOB_STARTED=')]
lines.append('ACTIONS_RUNNER_HOOK_JOB_STARTED=/usr/local/lib/sarvin-runner-guard.sh')
p.write_text('\n'.join(lines) + '\n')
PY
if [[ ! -f .service ]]; then ./svc.sh install sarvin-ci; fi
service=$(cat .service)
install -d -m 755 "/etc/systemd/system/$service.d"
cat > "/etc/systemd/system/$service.d/sarvin.conf" <<'UNIT'
[Service]
MemoryMax=768M
CPUQuota=75%
UMask=0077
UNIT
# The runner can write only its workspace/logs, not its config, binaries or hook.
# Deliberately disable self-update; administrator upgrades must preserve this.
chown -R root:sarvin-ci "$runner"
chmod 750 "$runner"
for private_file in .env .credentials .credentials_rsaparams .runner .path .service; do
  if [[ -f $private_file ]]; then chmod 640 "$private_file"; fi
done
mkdir -p _work _diag
chown -R sarvin-ci:sarvin-ci _work _diag
systemctl daemon-reload
systemctl enable "$service"
systemctl restart "$service"
systemctl is-active "$service"
