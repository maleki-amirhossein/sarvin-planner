#!/usr/bin/env bash
# Root-owned host hook, outside the runner's writable workspace.
set -euo pipefail
[[ ${GITHUB_REPOSITORY:-} == maleki-amirhossein/sarvin-planner ]] || exit 1
[[ ${GITHUB_EVENT_NAME:-} == push || ${GITHUB_EVENT_NAME:-} == workflow_dispatch ]] || exit 1
[[ ${GITHUB_REF:-} == refs/heads/main || ${GITHUB_REF:-} == refs/heads/master ]] || exit 1
[[ ${GITHUB_JOB:-} == deploy ]] || exit 1
[[ ${GITHUB_WORKFLOW_REF:-} == "maleki-amirhossein/sarvin-planner/.github/workflows/ci-cd.yml@${GITHUB_REF}" ]] || exit 1
printf 'Trusted production deployment context verified.\n'
