#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assembles the Growth Factor AI site from src/ partials.

  python3 build.py

Emits the deployable multi-page site into site/ and a single-file
preview.html (inlined CSS/JS, hash router) for review in an Artifact.
Edit src/ and features.py -- never the generated files in site/.
"""
import os, re, html

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(HERE, 'src')
OUT  = os.path.join(HERE, 'site')

import features as F

def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as fh:
        return fh.read()


def row(feat, page):
    """One feature: a plain row that opens to show what it does."""
    fid, cat, ico, name, sub, body, uses = feat
    rid = '%s-%s' % (page, fid)
    return (
        '<div class="idx__row">'
        '<h3 style="margin:0">'
        '<button class="idx__btn" type="button" aria-expanded="false" aria-controls="p-%(rid)s">'
        '<span><span class="idx__name">%(name)s</span>'
        '<span class="idx__sub">%(sub)s</span></span>'
        '<svg class="idx__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
        '<path d="M12 5v14M5 12h14"/></svg>'
        '</button></h3>'
        '<div class="idx__panel" id="p-%(rid)s">'
        '<div><div class="idx__inner"><p>%(body)s</p></div></div>'
        '</div></div>'
    ) % dict(rid=rid, name=name, sub=sub, body=body)


def home_index():
    by_id = dict((f[0], f) for f in F.FEATURES)
    return ''.join(row(by_id[i], 'h') for i in F.HOME_IDS)


def category_bands():
    out = []
    for key, title, head, note in F.CATEGORIES:
        rows = ''.join(row(f, 'f') for f in F.FEATURES if f[1] == key)
        out.append(
            '<section id="%(key)s"><div class="shell">'
            '<h2 class="sec-h">%(head)s</h2>'
            '<p class="lede">%(note)s</p>'
            '<div class="idx" style="margin-top:24px">%(rows)s</div>'
            '</div></section>'
            % dict(key=key, head=head, note=note, rows=rows)
        )
    return '\n'.join(out)


PAGES = [
    ('index.html', 'home.html', 'home',
     'Growth Factor AI &mdash; More leads. More customers. And you built it yourself.',
     'The whole growth stack &mdash; CRM, funnels, automations and AI agents &mdash; for $100 a month flat. '
     'We teach you to run it, and build your first set of ads with you.'),
    ('features.html', 'features.html', 'features',
     'Platform &mdash; Everything included for $100 | Growth Factor AI',
     'Every feature included at $100 a month: CRM, funnels, calendars, workflows, '
     'AI Agents, Super Agents, reviews, courses, payments and reporting.'),
    ('done-for-you.html', 'done-for-you.html', 'dfy',
     'Done-For-You builds &mdash; from $500 | Growth Factor AI',
     'Want it built instead of taught? Simple builds start around $500, complex '
     'systems can reach $10,000. Scoped and quoted before any work starts.'),
]


def shell(title, desc, body, key):
    head = (read('_head.html')
            .replace('{{TITLE}}', title)
            .replace('{{DESC}}', desc))
    hdr = (read('_header.html')
           .replace('{{NAV_FEATURES}}', ' aria-current="page"' if key == 'features' else '')
           .replace('{{NAV_DFY}}', ' aria-current="page"' if key == 'dfy' else ''))
    return ('<!doctype html>\n<html lang="en">\n<head>\n%s</head>\n<body>\n'
            '%s\n<main id="main">\n%s\n</main>\n%s\n%s\n'
            '</body>\n</html>\n' % (head, hdr, body, read('_footer.html'), read('_modal.html')))


def build_pages():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    bodies = {}
    for out_name, src_name, key, title, desc in PAGES:
        body = read(src_name)
        body = body.replace('{{IDX_HOME}}', home_index())
        body = body.replace('{{CATEGORY_BANDS}}', category_bands())
        bodies[key] = body
        with open(os.path.join(OUT, out_name), 'w', encoding='utf-8') as fh:
            fh.write(shell(title, desc, body, key))
        print('  site/%s' % out_name)
    return bodies


VIEW_OF = {'index.html': 'home', 'features.html': 'features', 'done-for-you.html': 'dfy'}


def to_preview_links(markup):
    """Rewrite cross-page hrefs into router hashes for the single-file preview."""
    def sub(m):
        page, frag = m.group(1), m.group(2) or ''
        view = VIEW_OF[page]
        return 'href="#%s%s"' % (view, ('/' + frag[1:]) if frag else '')
    return re.sub(r'href="(index\.html|features\.html|done-for-you\.html)(#[\w-]+)?"', sub, markup)


PREVIEW_CSS = """
.view{display:none}.view.is-active{display:block}
"""

PREVIEW_JS = """
(function(){
  var views = {}, order = ['home','features','dfy'];
  order.forEach(function(k){ views[k] = document.getElementById('v-'+k); });
  var nav = document.querySelectorAll('.nav a[data-view]');

  function show(view, frag, push){
    if(!views[view]) view = 'home';
    order.forEach(function(k){ views[k].classList.toggle('is-active', k===view); });
    nav.forEach(function(a){
      if(a.getAttribute('data-view')===view){ a.setAttribute('aria-current','page'); }
      else { a.removeAttribute('aria-current'); }
    });
    if(window.GFReveal){ window.GFReveal(views[view]); }
    if(frag){
      var el = views[view].querySelector('#'+frag) || document.getElementById(frag);
      if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
    }
    window.scrollTo(0,0);
  }

  function route(){
    var h = (location.hash||'').replace(/^#/,'');
    if(!h){ show('home'); return; }
    var parts = h.split('/');
    if(views[parts[0]]){ show(parts[0], parts[1]); return; }
    /* a bare fragment: find whichever view owns it */
    for(var i=0;i<order.length;i++){
      if(views[order[i]].querySelector('#'+CSS.escape(h))){ show(order[i], h); return; }
    }
    show('home');
  }
  window.addEventListener('hashchange', route);
  route();
})();
"""


def build_preview(bodies):
    css = open(os.path.join(OUT, 'assets/gf.css'), encoding='utf-8').read()
    js  = open(os.path.join(OUT, 'assets/gf.js'), encoding='utf-8').read()

    hdr = (read('_header.html')
           .replace('{{NAV_FEATURES}}', ' data-view="features"')
           .replace('{{NAV_DFY}}', ' data-view="dfy"'))
    hdr = to_preview_links(hdr)
    hdr = hdr.replace('<a class="logo" href="#home"', '<a class="logo" data-view="home" href="#home"')

    ftr   = to_preview_links(read('_footer.html'))
    modal = read('_modal.html')
    modal = modal.replace('<script src="assets/gf.js"></script>', '')
    modal = to_preview_links(modal)

    views = []
    for key in ('home', 'features', 'dfy'):
        views.append('<div class="view" id="v-%s">\n%s\n</div>' % (key, to_preview_links(bodies[key])))

    doc = (
        '<title>Growth Factor AI</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700'
        '&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n'
        '<style>\n%s\n%s</style>\n%s\n<main id="main">\n%s\n</main>\n%s\n%s\n'
        '<script>\n%s\n</script>\n<script>\n%s\n</script>\n'
        % (css, PREVIEW_CSS, hdr, '\n'.join(views), ftr, modal, js, PREVIEW_JS)
    )
    path = os.path.join(HERE, 'preview.html')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(doc)
    print('  preview.html  (%.0f KB)' % (len(doc.encode('utf-8')) / 1024.0))


if __name__ == '__main__':
    print('Building Growth Factor AI:')
    build_preview(build_pages())
    print('Done.')
