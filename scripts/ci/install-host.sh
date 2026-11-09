#!/usr/bin/env bash
# Administrator bootstrap/update only; never execute this from a release job.
# Usage: sudo bash install-host.sh /private/path/deploy-key.pub
set -euo pipefail
umask 077
test "$(id -u)" = 0
key_file=${1:?Provide the dedicated public deploy key}
root=/opt/sarvin-planner
runtime="$root/shared/runtime"
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
test -f "$root/shared/.env.server"
test -f "$root/current/compose.yaml" || test -f "$runtime/compose.yaml"
install -d -m 700 "$runtime" "$root/incoming" /usr/local/lib/sarvin
if [[ ! -f "$runtime/compose.yaml" ]]; then
  cp "$root/current/compose.yaml" "$root/current/compose.tunnel.yaml" "$runtime/"
  cp "$root/shared/public-proxy/compose.public-proxy.yaml" "$runtime/"
  cp "$root/current/scripts/ops/backup.sh" "$runtime/backup.sh"
  cp "$root/manage" "$runtime/manage.before-ci"
  cp /etc/systemd/system/sarvin-backup.service "$runtime/backup-service.before-ci"
fi
if [[ ! -f "$root/current/images.env" ]]; then
  api_image=$(docker inspect sarvin-planner-api-1 --format '{{.Config.Image}}')
  web_image=$(docker inspect sarvin-planner-web-1 --format '{{.Config.Image}}')
  printf 'API_IMAGE=%s\nWEB_IMAGE=%s\n' "$api_image" "$web_image" > "$root/current/images.env"
fi
if [[ ! -f "$runtime/baseline-images.env" ]]; then
  cp "$root/current/images.env" "$runtime/baseline-images.env"
fi
install -m 700 "$script_dir/deploy.py" /usr/local/lib/sarvin/deploy.py
cat > "$root/manage" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
exec docker compose --project-name sarvin-planner \
  --env-file /opt/sarvin-planner/shared/.env.server \
  --env-file /opt/sarvin-planner/current/images.env \
  -f /opt/sarvin-planner/shared/runtime/compose.yaml \
  -f /opt/sarvin-planner/shared/runtime/compose.tunnel.yaml \
  -f /opt/sarvin-planner/shared/runtime/compose.public-proxy.yaml "$@"
SH
chmod 700 "$root/manage" "$runtime/backup.sh"
python3 - <<'PY'
from pathlib import Path
p = Path('/etc/systemd/system/sarvin-backup.service')
s = p.read_text()
s = s.replace('/current/compose.yaml', '/shared/runtime/compose.yaml')
s = s.replace('/current/compose.tunnel.yaml', '/shared/runtime/compose.tunnel.yaml')
s = s.replace('/shared/public-proxy/compose.public-proxy.yaml', '/shared/runtime/compose.public-proxy.yaml')
s = s.replace('/current/scripts/ops/backup.sh', '/shared/runtime/backup.sh')
s = s.replace('WorkingDirectory=/opt/sarvin-planner/current', 'WorkingDirectory=/opt/sarvin-planner/shared/runtime')
p.write_text(s)
PY
systemctl daemon-reload
python3 - "$key_file" <<'PY'
from pathlib import Path
import sys
key = Path(sys.argv[1]).read_text().strip()
assert key.startswith('ssh-ed25519 ') and '\n' not in key
p = Path('/root/.ssh/authorized_keys')
current = p.read_text()
entry = 'from="127.0.0.1,::1",restrict,command="/usr/local/lib/sarvin/deploy.py" ' + key
lines = current.splitlines()
if key.split()[1] in current:
    lines = [entry if key.split()[1] in line.split() else line for line in lines]
else:
    lines.append(entry)
p.write_text('\n'.join(lines) + '\n')
p.chmod(0o600)
PY
"$root/manage" config --quiet
"$root/manage" ps
printf 'Host gateway installed; application containers were not restarted.\n'
