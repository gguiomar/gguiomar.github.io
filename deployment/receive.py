#!/usr/bin/python3
"""Root-owned forced SSH command; runs as website-deploy with no sudo access."""
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile

BASE = Path('/var/www/gguiomar')
MAX_BYTES = 250 * 1024 * 1024

def unpack(stream, dest):
    total = 0
    seen = set()
    with tarfile.open(fileobj=stream, mode='r|gz') as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if not member.isfile() or path.is_absolute() or '..' in path.parts or any(p.startswith('.') for p in path.parts) or member.name in seen:
                raise ValueError('Archive contains an unsafe entry')
            total += member.size
            if total > MAX_BYTES or len(seen) > 10000:
                raise ValueError('Release too large')
            seen.add(member.name)
            target = dest / path
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as src, target.open('xb') as output:
                shutil.copyfileobj(src, output)
            target.chmod(0o644)
    manifest = json.loads((dest / 'release-manifest.json').read_text())
    if set(manifest) != seen - {'release-manifest.json'} or 'index.html' not in manifest:
        raise ValueError('Incomplete release manifest')
    for name, digest in manifest.items():
        if hashlib.sha256((dest / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Release digest mismatch')

def activate(release):
    current = BASE / 'current'
    if current.is_symlink():
        previous = BASE / '.previous-new'
        previous.unlink(missing_ok=True)
        previous.symlink_to(current.resolve())
        previous.replace(BASE / 'previous')
    pending = BASE / '.current-new'
    pending.unlink(missing_ok=True)
    pending.symlink_to(release)
    pending.replace(current)

def main():
    command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
    match = re.fullmatch(r'(deploy|rollback) ([0-9a-f]{7,40})', command)
    if not match:
        raise ValueError('Only deploy <commit> and rollback <release> are allowed')
    operation, revision = match.groups()
    with (BASE / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        release = BASE / 'releases' / revision
        if operation == 'deploy':
            stage = Path(tempfile.mkdtemp(prefix='.incoming-', dir=BASE))
            try:
                unpack(sys.stdin.buffer, stage)
                stage.chmod(0o755)
                if release.exists():
                    if (release / 'release-manifest.json').read_bytes() != (stage / 'release-manifest.json').read_bytes():
                        raise ValueError('Release ID already contains different content')
                else:
                    stage.rename(release)
            finally:
                if stage.exists():
                    shutil.rmtree(stage)
        if not (release / 'index.html').is_file() or release.is_symlink():
            raise ValueError('Release does not exist')
        activate(release)
        print(f'Activated {revision}')

if __name__ == '__main__':
    main()
