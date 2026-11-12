import hashlib
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch
import receive


def archive(entries):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:gz') as tar:
        for name, content, kind in entries:
            item = tarfile.TarInfo(name)
            item.type = kind
            item.size = len(content)
            tar.addfile(item, io.BytesIO(content))
    stream.seek(0)
    return stream

class ReleaseTests(unittest.TestCase):
    def test_valid_release(self):
        body = b'<h1>Website</h1>'
        manifest = json.dumps({'index.html': hashlib.sha256(body).hexdigest()}).encode()
        with tempfile.TemporaryDirectory() as directory:
            receive.unpack(archive([('index.html', body, tarfile.REGTYPE), ('release-manifest.json', manifest, tarfile.REGTYPE)]), Path(directory))
            self.assertEqual((Path(directory)/'index.html').read_bytes(), body)

    def test_unsafe_entries(self):
        for name, kind in [('../escape', tarfile.REGTYPE),('/escape',tarfile.REGTYPE),('.ssh/key',tarfile.REGTYPE),('link',tarfile.SYMTYPE),('hardlink',tarfile.LNKTYPE)]:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    receive.unpack(archive([(name,b'',kind)]),Path(directory))

    def test_bad_digest(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                receive.unpack(archive([('index.html',b'changed',tarfile.REGTYPE),('release-manifest.json',b'{"index.html":"bad"}',tarfile.REGTYPE)]),Path(directory))

    def test_atomic_switch_and_rollback(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(receive,'BASE',Path(directory)):
            base=Path(directory).resolve()
            first,second=base/'first',base/'second'
            first.mkdir();second.mkdir()
            (base/'current').symlink_to(first)
            receive.activate(second)
            self.assertEqual((base/'current').resolve(),second)
            self.assertEqual((base/'previous').resolve(),first)
            receive.activate(first)
            self.assertEqual((base/'current').resolve(),first)
            self.assertEqual((base/'previous').resolve(),second)

if __name__ == '__main__':
    unittest.main()
