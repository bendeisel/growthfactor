#!/usr/bin/env python3
"""Build a preview-only copy of site.html with /img and /video paths
inlined as base64 data URIs, so images and the hero video actually render
inside the published artifact (which has no server to resolve relative
paths against).

site.html itself stays untouched, real relative paths, because that is
the file split_pages.py runs against for the production Hostinger build
(the images ship there as real files at those same paths, not data URIs).

    python3 build_preview.py   # writes site.preview.html

site.preview.html is scratch: not committed, regenerated from site.html
any time it changes, then published to the artifact.
"""
import base64
import mimetypes
import re

SRC = 'site.html'
OUT = 'site.preview.html'
PUBLIC = 'site/public'

html = open(SRC, encoding='utf-8').read()


def inline(m):
    path = m.group(2)
    if not (path.startswith('/img/') or path.startswith('/video/')):
        return m.group(0)
    data = open(PUBLIC + path, 'rb').read()
    mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    b64 = base64.b64encode(data).decode('ascii')
    return '%s"data:%s;base64,%s"' % (m.group(1), mime, b64)


html = re.sub(r'(src=)"(/(?:img|video)/[^"]+)"', inline, html)

open(OUT, 'w', encoding='utf-8').write(html)
print('wrote %s: %d KB' % (OUT, len(html) // 1024))
