#!/usr/bin/env python3
"""Build only explicitly approved, Git-tracked public files and legacy redirects."""
import hashlib
import html
import json
from pathlib import Path
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]

def build():
    files = json.loads((ROOT / 'deployment/public-files.json').read_text())
    tracked = set(subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines())
    out = ROOT / 'build'
    if out.exists():
        shutil.rmtree(out)
    site, redirects = out / 'site', out / 'redirects'
    site.mkdir(parents=True)
    redirects.mkdir()
    hashes = {}
    for name in files:
        path = ROOT / name
        if name not in tracked or path.is_symlink() or not path.is_file() or '..' in Path(name).parts or name.startswith('/'):
            raise ValueError(f'Invalid public file: {name}')
        dest = site / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, dest)
        hashes[name] = hashlib.sha256(dest.read_bytes()).hexdigest()
    (site / 'release-manifest.json').write_text(json.dumps(hashes, sort_keys=True))
    for name in [n for n in files if n.endswith('.html')] + ['404.html']:
        target = 'https://gguiomar.org/' + ('' if name in ('index.html', '404.html') else name)
        dest = redirects / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<title>Website moved</title><script>location.replace("https://gguiomar.org"+'
            'location.pathname+location.search+location.hash);</script>'
            f'<meta http-equiv="refresh" content="0;url={html.escape(target, quote=True)}">'
            f'<link rel="canonical" href="{html.escape(target, quote=True)}"></head>'
            f'<body><a href="{html.escape(target, quote=True)}">Continue to gguiomar.org</a></body></html>')
    (redirects / '.nojekyll').touch()
    with tarfile.open(out / 'site.tar.gz', 'w:gz') as archive:
        for path in sorted(site.rglob('*')):
            if path.is_file():
                archive.add(path, arcname=path.relative_to(site).as_posix(), recursive=False)
    print(f'Built {len(files)} public files and legacy redirect pages')

if __name__ == '__main__':
    build()
