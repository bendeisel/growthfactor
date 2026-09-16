#!/usr/bin/env python3
"""Stream a Drive tar.gz download straight out of its spilled tool-result file.

    python3 drive_tar_extract.py <tool-result.json> <outdir> [path-filter ...]

The spilled file is {"content": "<base64>", ...}. Loading a 768 MB archive that
way would mean holding a gigabyte of base64 plus the decoded bytes in memory, so
this decodes in chunks and pipes straight through gzip and tar, writing only the
members whose path matches a filter. Nothing intermediate is ever written.
"""
import base64, io, os, sys, tarfile

MEDIA = (".jpg",".jpeg",".png",".webp",".gif",".svg",".mp4",".mov",".m4v",".avif")

def b64_chunks(path, chunk=1 << 20):
    """Yield decoded bytes of the base64 "content" value without holding it all."""
    key = b'"content"'
    with open(path, "rb") as f:
        buf = b""
        while True:                              # find the key, then its opening quote
            d = f.read(chunk)
            if not d:
                raise ValueError("no content field found")
            buf += d
            i = buf.find(key)
            if i >= 0:
                j = i + len(key)
                while j < len(buf) and buf[j:j+1] in b' \t\r\n:':
                    j += 1                       # tolerate whitespace around the colon
                if j < len(buf) and buf[j:j+1] == b'"':
                    buf = buf[j+1:]
                    break
                if len(buf) - i > len(key) + 32:
                    raise ValueError("malformed content field")
            buf = buf[-(len(key) + 32):]
        pending = b""
        while True:
            end = buf.find(b'"')                 # base64 never needs escaping
            if end >= 0:
                pending += buf[:end]
                if pending:
                    yield base64.b64decode(pending + b"=" * (-len(pending) % 4))
                return
            pending += buf
            n = len(pending) - (len(pending) % 4)
            if n:
                yield base64.b64decode(pending[:n])
                pending = pending[n:]
            buf = f.read(chunk)
            if not buf:
                raise ValueError("payload not terminated")

class GenReader(io.RawIOBase):
    def __init__(self, gen):
        self.gen, self.buf = gen, b""
    def readable(self):
        return True
    def readinto(self, dest):
        while not self.buf:
            try:
                self.buf = next(self.gen)
            except StopIteration:
                return 0
        n = min(len(dest), len(self.buf))
        dest[:n], self.buf = self.buf[:n], self.buf[n:]
        return n

def main(src, outdir, *filters):
    os.makedirs(outdir, exist_ok=True)
    stream = io.BufferedReader(GenReader(b64_chunks(src)), buffer_size=1 << 20)
    kept = skipped = 0
    total = 0
    with tarfile.open(fileobj=stream, mode="r|gz") as tar:
        for m in tar:
            if not m.isfile():
                continue
            name = m.name
            if filters and not any(f in name for f in filters):
                skipped += 1; continue
            if not name.lower().endswith(MEDIA):
                skipped += 1; continue
            safe = os.path.normpath(name).lstrip("/").replace("..", "_")
            dest = os.path.join(outdir, os.path.basename(safe))
            src_f = tar.extractfile(m)
            if src_f is None:
                continue
            with open(dest, "wb") as out:
                while True:
                    b = src_f.read(1 << 20)
                    if not b:
                        break
                    out.write(b)
            kept += 1; total += m.size
    print("extracted %d media files (%.1f MB), skipped %d others" % (kept, total/1048576, skipped))
    print("next: python3 prep_assets.py '%s'" % outdir)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], *sys.argv[3:])
