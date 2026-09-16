#!/usr/bin/env python3
"""Decode a Google Drive download that spilled to a tool-results file.

    python3 drive_unpack.py <tool-result.json> [outdir]

When an MCP download is too large for context it is written to disk as
{content, id, mimeType, title} with content base64 encoded. This decodes that
back into the real file, unzipping it when it is an archive, so the bytes never
have to pass through the conversation.
"""
import base64, json, os, sys, zipfile

def main(src, outdir=None):
    d = json.load(open(src))
    raw = base64.b64decode(d["content"])
    title = d.get("title") or "download.bin"
    outdir = outdir or os.path.join(os.path.dirname(os.path.abspath(src)), "unpacked")
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, title)
    with open(path, "wb") as f:
        f.write(raw)
    print("%s  %.1f MB  (%s)" % (title, len(raw) / 1048576, d.get("mimeType", "?")))
    if zipfile.is_zipfile(path):
        dest = os.path.join(outdir, os.path.splitext(title)[0])
        with zipfile.ZipFile(path) as z:
            z.extractall(dest)
            print("  unzipped %d entries into %s" % (len(z.namelist()), dest))
        print("  next: python3 prep_assets.py '%s'" % dest)
    else:
        print("  next: python3 prep_assets.py '%s'" % outdir)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(*sys.argv[1:3])
