#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_SHA:?}" "${GITHUB_RUN_NUMBER:?}" "${GITHUB_RUN_ATTEMPT:?}" "${GITHUB_REF_NAME:?}"
release="ci-${GITHUB_SHA}-${GITHUB_RUN_NUMBER}-${GITHUB_RUN_ATTEMPT}"
mkdir -p .local/ci-package
for service in api web; do
  docker build --platform linux/amd64 \
    --label io.sarvin.managed=actions \
    --label "org.opencontainers.image.revision=$GITHUB_SHA" \
    -f "apps/$service/Dockerfile" -t "sarvin-planner-$service:$release" .
done
docker save "sarvin-planner-api:$release" "sarvin-planner-web:$release" | gzip -1 > .local/ci-package/images.tar.gz
git archive --format=tar.gz HEAD > .local/ci-package/source.tar.gz
python3 - <<'PY'
import hashlib, json, os
from pathlib import Path
base = Path('.local/ci-package')
manifest = {k: os.environ[v] for k, v in {
    'sha': 'GITHUB_SHA', 'run': 'GITHUB_RUN_NUMBER',
    'attempt': 'GITHUB_RUN_ATTEMPT', 'branch': 'GITHUB_REF_NAME',
}.items()}
manifest['files'] = {name: hashlib.file_digest((base / name).open('rb'), 'sha256').hexdigest()
                     for name in ['images.tar.gz', 'source.tar.gz']}
(base / 'release.json').write_text(json.dumps(manifest, indent=2) + '\n')
PY
tar -cf .local/ci-bundle.tar -C .local/ci-package release.json images.tar.gz source.tar.gz
