#!/usr/bin/env python3
"""Build only explicitly approved, Git-tracked public files and legacy redirects."""
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]

ASSET_REF = re.compile(r'(href|src)="([^":?#]+\.(?:css|js))"')

def version_assets(site, pages):
    """Append ?v=<content hash> to local CSS/JS references so edge and browser caches never serve stale files."""
    for name in pages:
        page = site / name
        def stamp(match):
            target = (page.parent / match.group(2)).resolve()
            if site.resolve() not in target.parents or not target.is_file():
                return match.group(0)
            digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
            return f'{match.group(1)}="{match.group(2)}?v={digest}"'
        page.write_text(ASSET_REF.sub(stamp, page.read_text()))

def build():
    files = json.loads((ROOT / 'deployment/public-files.json').read_text())
    tracked = set(subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines())
    out = ROOT / 'build'
    if out.exists():
        shutil.rmtree(out)
    site, redirects = out / 'site', out / 'redirects'
    site.mkdir(parents=True)
    redirects.mkdir()
    for name in files:
        path = ROOT / name
        if name not in tracked or path.is_symlink() or not path.is_file() or '..' in Path(name).parts or name.startswith('/'):
            raise ValueError(f'Invalid public file: {name}')
        dest = site / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, dest)
    version_assets(site, [n for n in files if n.endswith('.html')])
    hashes = {name: hashlib.sha256((site / name).read_bytes()).hexdigest() for name in files}
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
