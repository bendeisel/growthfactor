#!/usr/bin/env python3
"""Convert the client's published WordPress posts into src/data/posts.js.

Provenance, so the blog's copy can be audited the same way every other page
in this project can:

    source/wp-export/fightersnashville.WordPress.20260826.xml
      -> 35 items of post_type=post
      -> 10 with status=publish   KEPT, verbatim
      -> 25 with status=draft     DROPPED

The 25 drafts are the Ring theme's demo posts: lorem ipsum bodies ("Qroin
faucibus nec mauris...") under titles about samurai katanas, muay Thai and
CrossFit, only 4 unique bodies across all 25. They were never published, so
they carry no backlinks and no SEO value, and their subject matter is not
even this gym's sport. Dropping them is the same call made for the other
theme demo content in this build (see source/copy.md).

The 10 published posts keep their original root-level slugs, so every
existing backlink to /mindset-matters/ and friends still resolves.

    cd projects/fightersboxing && python3 source/build_posts.py

Stdlib only.
"""
import html
import json
import os
import re

XML = 'source/wp-export/fightersnashville.WordPress.20260826.xml'
OUT = 'site/src/data/posts.js'

# Em dashes, replaced one at a time rather than by a blind global swap, so
# each reads as the author meant it (house rule: never an em dash, and log
# the change at handover). Left side is the source text, right is ours.
EM_DASH_FIXES = [
    # colon: the dash introduces an explanation of the phrase before it
    ('growth mindset &#8212; be positive',
     'growth mindset: be positive'),
    ('Consider the design &#8212; your finger tips',
     'Consider the design: your finger tips'),
    ('very large purses &#8212; Tyson',
     'very large purses: Tyson'),
    ('of any boxer in history &#8212; the only fighter',
     'of any boxer in history: the only fighter'),
    ('their personal goals &#8212; fitness, recreational',
     'their personal goals: fitness, recreational'),
    ('into any situation &#8212; a tough training session',
     'into any situation: a tough training session'),
    ('Ask questions &#8212; our coaches',
     'Ask questions: our coaches'),
    # parentheses: a paired-dash aside whose own contents are comma-separated,
    # where swapping in commas would bury the aside in the list
    ('in boxing &#8212; dynamic warmup, shadow boxing, hitting bags &#8212; is done',
     'in boxing (dynamic warmup, shadow boxing, hitting bags) is done'),
    ('around you &#8212; trainers, manager, promoter, and sparring partners &#8212; that',
     'around you (trainers, manager, promoter, and sparring partners) that'),
    # colon: bolded list-item labels followed by their explanation
    ('</strong> &#8212; ', '</strong>: '),
]


def clean(body):
    """Gutenberg comment soup -> the plain HTML this site's pages use."""
    body = body.replace('—', '&#8212;')

    for src, dst in EM_DASH_FIXES:
        body = body.replace(src, dst)

    # block comments carry no content once the markup itself is kept
    body = re.sub(r'<!--\s*/?wp:.*?-->', '', body, flags=re.S)

    # Galleries and images: every <figure> in the export is empty, because
    # the media did not come across with the posts. Galleries nest (a
    # gallery figure wrapping image figures), so this runs to a fixed point,
    # clearing the innermost first; a single non-greedy pass would close the
    # outer figure against an inner tag and strand the leftover </figure>.
    while True:
        stripped = re.sub(r'<figure[^>]*>(?:(?!<figure).)*?</figure>', '', body, flags=re.S)
        if stripped == body:
            break
        body = stripped
    body = re.sub(r'</?figure[^>]*>', '', body)

    # The one <img> that did survive points at the old Hostinger staging
    # domain (floralwhite-woodcock-644453.hostingersite.com), which stops
    # resolving the moment the site migrates. Dropped rather than hotlinked
    # to a URL that is about to 404. Flagged in source/copy.md as art to
    # re-supply.
    body = re.sub(r'<img[^>]*hostingersite\.com[^>]*/?>', '', body)

    # theme-specific classes mean nothing outside the Ring theme
    body = re.sub(r'\s*class="(?:has-drop-cap|wp-block-[^"]*|trx_addons_[^"]*)"', '', body)

    # the export wraps some <ol>s in a heading block, which leaves list items
    # carrying a heading class; the list is the correct element, so keep it
    body = re.sub(r'<li class="wp-block-heading"', '<li', body)

    # The export wraps some posts' tails in a theme div. It carries no
    # meaning here, so unwrap it rather than inherit a class this site
    # does not style.
    body = re.sub(r'</?div[^>]*>', '', body)

    body = re.sub(r'\n{2,}', '\n', body)
    # spacer paragraphs, including the &nbsp;-only ones WordPress leaves behind
    body = re.sub(r'<p[^>]*>(?:\s|&nbsp;| )*</p>', '', body)
    return body.strip()


def dek(body):
    """The post's own opening line, for the index.

    Deliberately the first block of text in document order, not the first
    <p>: several of these posts open with the list itself and their first
    paragraph is the closing thought ("There are plenty of additional ways
    to protect yourself, also."), which reads backwards as a standfirst.

    Their words either way. Nothing here is written for them.
    """
    m = re.search(r'<(p|li|h\d)[^>]*>(.*?)</\1>', body, re.S)
    if not m:
        return ''
    text = m.group(2)
    # <br> is a line break, so it has to become punctuation before the tags
    # go, or the lines weld together ("The LegendThe Problem Child"). After
    # a bold label it is doing a colon's job ("Build Cardio Fitness" / "the
    # rest"), so it becomes one; elsewhere a space is right.
    # ...unless the label punctuates itself already ("Start training today."),
    # where adding one gives "today.:".
    text = re.sub(
        r'([^\s>])\s*</strong>\s*<br\s*/?>',
        lambda m: '%s</strong>%s ' % (m.group(1), '' if m.group(1) in '.!?:;,' else ':'),
        text,
    )
    text = re.sub(r'<br\s*/?>', ' ', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()

    cut = re.split(r'(?<=[.!?])\s', text)[0]
    if len(cut) > 40:
        return cut
    if len(text) <= 180:
        return text
    return text[:177].rsplit(' ', 1)[0] + '...'


def main():
    xml = open(XML, encoding='utf-8').read()
    posts = []
    for item in re.findall(r'<item>(.*?)</item>', xml, re.S):
        ptype = re.search(r'<wp:post_type><!\[CDATA\[(.*?)\]\]></wp:post_type>', item)
        status = re.search(r'<wp:status><!\[CDATA\[(.*?)\]\]></wp:status>', item)
        if not ptype or ptype.group(1) != 'post':
            continue
        if not status or status.group(1) != 'publish':
            continue

        title = re.search(r'<title>(.*?)</title>', item, re.S).group(1).strip()
        title = re.sub(r'^<!\[CDATA\[|\]\]>$', '', title)
        slug = re.search(r'<wp:post_name><!\[CDATA\[(.*?)\]\]></wp:post_name>', item).group(1)
        date = re.search(r'<wp:post_date><!\[CDATA\[(.*?)\]\]></wp:post_date>', item).group(1)
        raw = re.search(r'<content:encoded><!\[CDATA\[(.*?)\]\]></content:encoded>',
                        item, re.S).group(1)

        body = clean(raw)
        posts.append({
            'slug': slug,
            'title': html.unescape(title).replace('—', ', '),
            'date': date[:10],
            'dek': dek(body),
            'body': body,
        })

    posts.sort(key=lambda p: p['date'], reverse=True)

    left = sum(p['body'].count('—') + p['body'].count('&#8212;') for p in posts)
    if left:
        raise SystemExit('error: %d em dash(es) survived; add a rule to '
                         'EM_DASH_FIXES rather than shipping one' % left)

    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('// BLOG POSTS\n')
        fh.write('//\n')
        fh.write('// Generated by source/build_posts.py from the client\'s WordPress\n')
        fh.write('// export (Tools > Export, 2026-08-26). Do not hand-edit: re-run the\n')
        fh.write('// script instead, so the copy stays traceable to their export.\n')
        fh.write('//\n')
        fh.write('// The 10 posts they actually published. Slugs are unchanged from\n')
        fh.write('// WordPress, and the pages render at the same root-level paths, so\n')
        fh.write('// existing backlinks keep resolving after the migration.\n')
        fh.write('export const posts = %s;\n' % json.dumps(posts, indent=2, ensure_ascii=False))

    print('wrote %s: %d posts' % (OUT, len(posts)))
    for p in posts:
        print('  %s  %-46s %d chars' % (p['date'], p['slug'], len(p['body'])))


if __name__ == '__main__':
    main()
