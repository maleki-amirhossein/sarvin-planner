import hashlib
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import deploy as deployment
from deploy import digest, migrations, parse_command, pending_migrations, unpack


class DeploymentBoundaryTests(unittest.TestCase):
    def test_only_fixed_command_is_accepted(self):
        valid = 'deploy ' + 'a' * 40 + ' 12 1 ' + 'b' * 64
        self.assertEqual(parse_command(valid)[1:3], ('12', '1'))
        for command in ['whoami', valid + '; id', valid + '\n', valid.replace(' 12 ', ' ../ '),
                        valid.replace(' 12 ', ' -1 '), valid.replace(' 1 ', ' 0 ')]:
            with self.subTest(command=command), self.assertRaises(ValueError):
                parse_command(command)

    def test_applied_migrations_cannot_be_rewritten_or_removed(self):
        self.assertEqual(pending_migrations({'old': 'a', 'new': 'b'}, {'old': 'a'}), {'new'})
        for candidate in [{'old': 'b'}, {'new': 'b'}]:
            with self.assertRaisesRegex(ValueError, 'removed or modified'):
                pending_migrations(candidate, {'old': 'a'})

    def make_bundle(self, root, mutation=None):
        files = {'images.tar.gz': b'image fixture', 'source.tar.gz': b'source fixture'}
        metadata = {'files': {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}
        files['release.json'] = json.dumps(metadata).encode()
        bundle = root / 'bundle.tar'
        with tarfile.open(bundle, 'w') as archive:
            for name, data in files.items():
                member = tarfile.TarInfo(name)
                member.size = len(data)
                if mutation:
                    mutation(member)
                archive.addfile(member, io.BytesIO(data) if member.isfile() else None)
        return bundle

    def test_valid_bundle_and_integrity_failure(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            bundle = self.make_bundle(root)
            with self.assertRaisesRegex(ValueError, 'checksum'):
                unpack(bundle, root, '0' * 64)
            self.assertIn('files', unpack(bundle, root, digest(bundle)))

    def test_no_traversal_symlinks_duplicates_or_extra_paths(self):
        def traversal(member):
            if member.name == 'images.tar.gz':
                member.name = '../images.tar.gz'

        def symlink(member):
            if member.name == 'images.tar.gz':
                member.type, member.linkname, member.size = tarfile.SYMTYPE, '/etc/passwd', 0

        def duplicate(member):
            if member.name == 'images.tar.gz':
                member.name = 'source.tar.gz'

        for mutation in [traversal, symlink, duplicate]:
            with self.subTest(mutation=mutation.__name__), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                bundle = self.make_bundle(root, mutation)
                with self.assertRaises(ValueError):
                    unpack(bundle, root, digest(bundle))

    def test_migration_hashes_come_from_sql_bytes(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / 'source.tar.gz'
            sql = b'CREATE TABLE example (id integer);\n'
            with tarfile.open(source, 'w:gz') as archive:
                member = tarfile.TarInfo('apps/api/prisma/migrations/20261108000000_init/migration.sql')
                member.size = len(sql)
                archive.addfile(member, io.BytesIO(sql))
            self.assertEqual(migrations(source), {'20261108000000_init': hashlib.sha256(sql).hexdigest()})

    def exercise_failed_rollout(self, pending, fail_migration=False):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            previous = root / 'releases/previous'
            previous.mkdir(parents=True)
            (root / 'shared').mkdir()
            (root / 'backups').mkdir()
            (root / 'current').symlink_to(previous)
            staging = root / 'incoming'
            staging.mkdir()
            sha, number, attempt = 'a' * 40, '10', '1'
            release = root / 'releases' / f'ci-{sha}-{number}-{attempt}'
            metadata = dict(sha=sha, run=number, attempt=attempt, branch='main')
            (staging / 'release.json').write_text(json.dumps(metadata))
            (staging / 'source.tar.gz').write_bytes(b'source fixture')
            tags = [f'sarvin-planner-{service}:{release.name}' for service in ('api', 'web')]
            with tarfile.open(staging / 'images.tar.gz', 'w:gz') as archive:
                data = json.dumps([{'RepoTags': tags}]).encode()
                member = tarfile.TarInfo('manifest.json')
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
            candidate = {'old': 'checksum', **({'new': 'next'} if pending else {})}
            calls = []

            def command(args, **kwargs):
                if args[:3] == ['docker', 'image', 'inspect']:
                    return SimpleNamespace(stdout=json.dumps([{'Architecture': 'amd64', 'Config': {
                        'User': 'node', 'Labels': {'org.opencontainers.image.revision': sha}}}]))
                return SimpleNamespace(stdout=json.dumps(candidate))

            def compose(release_path, *args, **kwargs):
                calls.append((release_path, args))
                if args[0] == 'exec':
                    if 'pg_dump' in args[-1]:
                        kwargs['stdout'].write(b'private backup fixture')
                        return
                    return SimpleNamespace(stdout='0\n' if 'count(*)' in args[-1] else 'old|checksum\n')
                if args[0] == 'run' and fail_migration:
                    raise RuntimeError('migration failure')
                if args[0] == 'up' and release_path == release:
                    raise RuntimeError('candidate unhealthy')

            state = root / 'shared/ci-state.json'
            with patch.multiple(deployment, ROOT=root, STATE=state), \
                    patch.object(deployment, 'run', side_effect=command), \
                    patch.object(deployment, 'compose', side_effect=compose), \
                    patch.object(deployment, 'migrations', return_value=candidate), \
                    patch.object(deployment, 'smoke'), \
                    patch.object(deployment.shutil, 'disk_usage', return_value=SimpleNamespace(free=10 * 1024**3)):
                with self.assertRaises(RuntimeError):
                    deployment.deploy(staging, sha, number, attempt)
            status = json.loads(state.read_text())['status']
            self.assertEqual(len(list((root / 'backups').glob('*.dump'))), 1)
            if pending:
                self.assertEqual(status, 'needs-migration-repair')
                self.assertFalse(any(path == previous and args[0] == 'up' for path, args in calls))
                self.assertEqual(calls[-1][1], ('stop', 'api'))
            else:
                self.assertEqual(status, 'failed-rolled-back')
                self.assertEqual((root / 'current').resolve(), previous)
                self.assertTrue(any(path == previous and args[0] == 'up' for path, args in calls))

    def test_unhealthy_release_rolls_back_without_schema_changes(self):
        self.exercise_failed_rollout(False)

    def test_unhealthy_release_after_migration_requires_forward_repair(self):
        self.exercise_failed_rollout(True)

    def test_failed_migration_never_restarts_old_code(self):
        self.exercise_failed_rollout(True, fail_migration=True)


if __name__ == '__main__':
    unittest.main()
