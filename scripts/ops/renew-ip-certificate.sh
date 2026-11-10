#!/usr/bin/env bash
# Host-installed administrator tooling; never run a release's copy as root.
set -euo pipefail
umask 077
# Pinned Certbot 5.8.0 supports short-lived IP certificates on older host Python.
image=certbot/certbot@sha256:f70ad0adbb7e117f0fe42a63c553f28ea451edabc0148757b6efcd9735acaa20
marker=/var/lib/letsencrypt/nginx-reload-required
exec 9>/run/sarvin-cert-renew.lock
flock -n 9 || exit 0
docker run --rm --pull never \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /var/log/letsencrypt:/var/log/letsencrypt \
  -v /var/www/letsencrypt:/var/www/letsencrypt \
  "$image" renew --cert-name sarvin-ip --non-interactive \
  --no-random-sleep-on-renew \
  --deploy-hook 'touch /var/lib/letsencrypt/nginx-reload-required' "$@"
if [[ -f "$marker" ]]; then
  nginx -t
  systemctl reload nginx
  rm -- "$marker"
fi
