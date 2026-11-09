#!/usr/bin/env python3
"""Host-installed SSH gateway/worker. Updates require an administrator, not a push.

No shell supplied by GitHub is executed. Compose, secrets and backup tooling remain
host-owned. Releases contain images, archived source and metadata, never live envs.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path('/opt/sarvin-planner')
RUNTIME = ROOT / 'shared/runtime'
STATE = ROOT / 'shared/ci-state.json'
MAX_BUNDLE = 1536 * 1024 * 1024
FILES = {'release.json', 'images.tar.gz', 'source.tar.gz'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def parse_command(command):
    match = re.fullmatch(r'deploy ([0-9a-f]{40}) ([1-9][0-9]{0,9}) ([1-9][0-9]{0,5}) ([0-9a-f]{64})', command)
    require(match is not None, 'Only the fixed deploy command is permitted')
    return match.groups()


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def unpack(bundle, directory, expected):
    require(digest(bundle) == expected, 'Bundle checksum mismatch')
    with tarfile.open(bundle, 'r:') as archive:
        members = archive.getmembers()
        require(len(members) == 3 and {m.name for m in members} == FILES,
                'Unexpected or duplicate bundle members')
        for member in members:
            require(member.isfile() and 0 < member.size <= MAX_BUNDLE, 'Invalid bundle entry')
            require(member.name != 'release.json' or member.size < 16384, 'Oversized manifest')
            with archive.extractfile(member) as source, (directory / member.name).open('xb') as target:
                shutil.copyfileobj(source, target)
    return validate_files(directory)


def validate_files(directory):
    metadata = json.loads((directory / 'release.json').read_text())
    require(set(metadata['files']) == FILES - {'release.json'}, 'Unexpected checksum entries')
    for name, expected_digest in metadata['files'].items():
        require(digest(directory / name) == expected_digest, 'File checksum mismatch')
    return metadata


def receive(stream, directory, expected):
    # Stream flat entries to staging once, avoiding a second large bundle copy
    # on this shared, small server. Nothing is used until the whole hash matches.
    class Reader:
        def __init__(self):
            self.hash = hashlib.sha256()
            self.size = 0

        def read(self, size):
            chunk = stream.read(size)
            self.size += len(chunk)
            require(self.size <= MAX_BUNDLE, 'Bundle exceeds size limit')
            require(shutil.disk_usage(directory).free > 512 * 1024**2, 'Insufficient staging disk space')
            self.hash.update(chunk)
            return chunk

    reader = Reader()
    seen = set()
    with tarfile.open(fileobj=reader, mode='r|') as archive:
        for member in archive:
            require(member.name in FILES and member.name not in seen, 'Unexpected or duplicate bundle members')
            require(member.isfile() and 0 < member.size <= MAX_BUNDLE, 'Invalid bundle entry')
            require(member.name != 'release.json' or member.size < 16384, 'Oversized manifest')
            seen.add(member.name)
            with archive.extractfile(member) as source, (directory / member.name).open('xb') as target:
                shutil.copyfileobj(source, target)
    while reader.read(1024 * 1024):
        pass
    require(seen == FILES, 'Incomplete bundle')
    require(reader.hash.hexdigest() == expected, 'Bundle checksum mismatch')
    return validate_files(directory)


def migrations(source):
    result = {}
    with tarfile.open(source, 'r:gz') as archive:
        for member in archive:
            match = re.fullmatch(r'apps/api/prisma/migrations/([0-9]{14}_[A-Za-z0-9_]+)/migration.sql', member.name)
            if match:
                require(member.isfile() and member.size < 10 * 1024 * 1024, 'Invalid migration entry')
                require(match[1] not in result, 'Duplicate migration')
                result[match[1]] = hashlib.sha256(archive.extractfile(member).read()).hexdigest()
    require(result, 'No committed migrations in release')
    return result


def pending_migrations(candidate, applied):
    for name, checksum in applied.items():
        require(candidate.get(name) == checksum, 'An applied migration was removed or modified: ' + name)
    return set(candidate) - set(applied)


def run(args, capture=False, **kwargs):
    if capture:
        kwargs['stdout'] = subprocess.PIPE
    return subprocess.run(args, check=True, text=True, **kwargs)


def compose(release, *args, **kwargs):
    return run(['docker', 'compose', '--project-name', 'sarvin-planner',
                '--env-file', str(ROOT / 'shared/.env.server'),
                '--env-file', str(release / 'images.env'),
                '-f', str(RUNTIME / 'compose.yaml'),
                '-f', str(RUNTIME / 'compose.tunnel.yaml'),
                '-f', str(RUNTIME / 'compose.public-proxy.yaml'), *args], **kwargs)


def switch(release):
    temporary = ROOT / '.current-next'
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(release)
    temporary.replace(ROOT / 'current')


def save_json(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def smoke():
    origin = 'https://87.107.160.160:8443'
    for attempt in range(12):
        try:
            with urllib.request.urlopen(origin + '/api/health', timeout=10) as response:
                require(json.load(response) == {'status': 'ok'}, 'API is not ready')
            with urllib.request.urlopen(origin + '/login', timeout=10) as response:
                html = response.read().decode()
                require('lang="fa"' in html and 'dir="rtl"' in html, 'Persian web page missing')
            with urllib.request.urlopen(origin + '/sarvin-planner-logo.png', timeout=10) as response:
                require(response.headers.get_content_type() == 'image/png', 'Logo missing')
            try:
                urllib.request.urlopen(origin + '/api/auth/me', timeout=10)
                raise ValueError('Private API unexpectedly public')
            except urllib.error.HTTPError as error:
                require(error.code == 401, 'Unexpected private API status')
            return
        except (OSError, ValueError):
            if attempt == 11:
                raise
            time.sleep(5)


def prune_images(retain):
    # Never use system/image prune: this server hosts other projects.
    keep = set()
    for release in retain:
        for line in (release / 'images.env').read_text().splitlines():
            keep.add(line.split('=', 1)[1])
    rows = run(['docker', 'image', 'ls', '--filter', 'label=io.sarvin.managed=actions',
                '--format', '{{.Repository}}:{{.Tag}}'], capture=True).stdout.splitlines()
    baseline = RUNTIME / 'baseline-images.env'
    if baseline.exists():
        rows += [line.split('=', 1)[1] for line in baseline.read_text().splitlines()]
    for tag in rows:
        if re.fullmatch(r'sarvin-planner-(api|web):(ci-[0-9a-f]{40}-[0-9]+-[0-9]+|20261109-101631-c81a785606b2)', tag) and tag not in keep:
            subprocess.run(['docker', 'image', 'rm', tag], check=False)


def deploy(directory, sha, number, attempt):
    with (ROOT / 'shared/deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = json.loads(STATE.read_text()) if STATE.exists() else {}
        sequence = (int(number), int(attempt))
        previous_sequence = tuple(state.get('sequence', [0, 0]))
        if sequence < previous_sequence or (sequence == previous_sequence and state.get('status') == 'deployed'):
            print('Skipped superseded/already deployed run', flush=True)
            return
        require(sequence != previous_sequence, 'Failed attempt cannot be reused; rerun the GitHub job')
        previous = (ROOT / 'current').resolve(strict=True)
        release_id = f'ci-{sha}-{number}-{attempt}'
        release = ROOT / 'releases' / release_id
        require(not release.exists(), 'Release already exists')
        require(shutil.disk_usage(ROOT).free > 1536 * 1024**2, 'Less than 1.5 GiB free; administrator cleanup required')
        metadata = json.loads((directory / 'release.json').read_text())
        require((metadata['sha'], metadata['run'], metadata['attempt']) == (sha, number, attempt), 'Release identity mismatch')
        require(metadata['branch'] in ('main', 'master'), 'Only main/master may deploy')
        candidate = migrations(directory / 'source.tar.gz')
        # Validate archive tags before docker load can alter local image references.
        with tarfile.open(directory / 'images.tar.gz', 'r:gz') as archive:
            manifest = json.load(archive.extractfile('manifest.json'))
            tags = [tag for item in manifest for tag in item.get('RepoTags', [])]
        expected_tags = [f'sarvin-planner-{service}:{release_id}' for service in ('api', 'web')]
        require(sorted(tags) == sorted(expected_tags), 'Unexpected image tags')
        run(['docker', 'load', '-i', str(directory / 'images.tar.gz')])
        (directory / 'images.tar.gz').unlink()
        for tag in expected_tags:
            image = json.loads(run(['docker', 'image', 'inspect', tag], capture=True).stdout)[0]
            require(image['Architecture'] == 'amd64', 'Wrong image architecture')
            require(image['Config']['User'] == 'node', 'Image must run as node')
            require(image['Config']['Labels'].get('org.opencontainers.image.revision') == sha, 'Image revision mismatch')
        image_migrations = run(['docker', 'run', '--rm', '--network', 'none', '--entrypoint', 'node',
                                expected_tags[0], '-e',
                                "const fs=require('fs'),crypto=require('crypto');const p='prisma/migrations';console.log(JSON.stringify(Object.fromEntries(fs.readdirSync(p).filter(n=>fs.existsSync(p+'/'+n+'/migration.sql')).map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(p+'/'+n+'/migration.sql')).digest('hex')]))));"], capture=True).stdout
        require(json.loads(image_migrations) == candidate, 'Image migrations differ from committed source')
        failed = compose(previous, 'exec', '-T', 'db', 'sh', '-c',
                         'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "$1"', 'query',
                         'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL;', capture=True).stdout.strip()
        require(failed == '0', 'Unresolved failed migration; administrator repair required')
        sql = "SELECT migration_name, checksum FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name;"
        rows = compose(previous, 'exec', '-T', 'db', 'sh', '-c',
                       'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -F "|" -c "$1"', 'query', sql, capture=True).stdout
        applied = dict(line.split('|', 1) for line in rows.splitlines() if line)
        pending = pending_migrations(candidate, applied)
        release.mkdir(mode=0o700)
        shutil.move(str(directory / 'source.tar.gz'), release / 'source.tar.gz')
        shutil.copyfile(directory / 'release.json', release / 'release.json')
        (release / 'images.env').write_text(f'API_IMAGE={expected_tags[0]}\nWEB_IMAGE={expected_tags[1]}\n')
        state = {'sequence': list(sequence), 'sha': sha, 'status': 'deploying',
                 'release': str(release), 'previous': str(previous), 'branch': metadata['branch']}
        save_json(STATE, state)
        stopped = False
        migration_attempted = False
        switched = False
        try:
            if pending:
                compose(previous, 'stop', 'api')
                stopped = True
            backup = ROOT / 'backups' / f'pre-{release_id}.dump'
            with backup.open('xb') as output:
                compose(previous, 'exec', '-T', 'db', 'sh', '-c',
                        'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl', stdout=output)
            require(backup.stat().st_size > 0, 'Empty database backup')
            state['backup'] = str(backup)
            save_json(STATE, state)
            if pending:
                migration_attempted = True
                compose(release, 'run', '--rm', '--no-deps', '--no-build', 'migrate')
            switch(release)
            switched = True
            compose(release, 'up', '-d', '--no-deps', '--no-build', '--pull', 'never',
                    '--wait', '--wait-timeout', '180', 'api', 'web')
            smoke()
        except Exception:
            if migration_attempted:
                # A partially applied migration makes old-code rollback unsafe.
                compose(release if switched else previous, 'stop', 'api')
                state['status'] = 'needs-migration-repair'
                print('Migration attempted: API stopped. Repair forward; never auto-restore the database.', flush=True)
            else:
                if switched:
                    switch(previous)
                if switched or stopped:
                    compose(previous, 'up', '-d', '--no-deps', '--no-build', '--pull', 'never',
                            '--wait', '--wait-timeout', '180', 'api', 'web')
                    smoke()
                state['status'] = 'failed-rolled-back'
            save_json(STATE, state)
            raise
        state['status'] = 'deployed'
        save_json(STATE, state)
        print(f'Deployed {sha}; previous release retained; HTTPS smoke passed.', flush=True)
        # Remove only this project's completed one-shot migration container so an
        # obsolete baseline image is not pinned forever on the small server disk.
        compose(release, 'rm', '-f', 'migrate')
        prune_images([release, previous])


def gateway():
    sha, number, attempt, checksum = parse_command(os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    incoming = ROOT / 'incoming'
    incoming.mkdir(mode=0o700, exist_ok=True)
    directory = Path(tempfile.mkdtemp(prefix=f'{number}-{attempt}-', dir=incoming))
    try:
        receive(sys.stdin.buffer, directory, checksum)
        unit = f'sarvin-deploy-{number}-{attempt}'
        result = subprocess.run(['systemd-run', '--quiet', '--wait', '--collect', '--service-type=exec',
                                 '--property=UMask=0077', '--property=RuntimeMaxSec=1500',
                                 '--unit=' + unit, '/usr/local/lib/sarvin/deploy.py', '--worker',
                                 str(directory), sha, number, attempt], stdin=subprocess.DEVNULL)
        subprocess.run(['journalctl', '--no-pager', '-o', 'cat', '-u', unit, '-n', '150'], check=False)
        raise SystemExit(result.returncode)
    finally:
        # The systemd worker owns cleanup after launch, including SSH disconnects.
        if 'result' in locals() or 'unit' not in locals():
            shutil.rmtree(directory, ignore_errors=True)


if __name__ == '__main__':
    os.umask(0o077)
    try:
        if len(sys.argv) == 6 and sys.argv[1] == '--worker':
            staging = Path(sys.argv[2])
            try:
                deploy(staging, *sys.argv[3:])
            finally:
                shutil.rmtree(staging, ignore_errors=True)
        else:
            gateway()
    except Exception as error:
        # Do not dump environment, resolved Compose config, or subprocess input.
        print(f'Deployment failed: {type(error).__name__}: {error}', file=sys.stderr)
        sys.exit(1)
