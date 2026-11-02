#!/usr/bin/env python3
"""Check all Nexpt landing pages, assets, links, dialogs and Ghost settings."""
import importlib.util
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

spec = importlib.util.spec_from_file_location('preview', Path(__file__).with_name('preview-nexpt-theme.py'))
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.ids = set(); self.refs = []; self.controls = []; self.dialogs = set()
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, ('duplicate ID', attrs['id'])
            self.ids.add(attrs['id'])
        if tag == 'dialog': self.dialogs.add(attrs['id'])
        if 'data-benefit-open' in attrs: self.controls.append(attrs['data-benefit-open'])
        for key in ('href', 'src', 'poster'):
            if key in attrs: self.refs.append(attrs[key])
        for key in ('aria-controls', 'aria-labelledby', 'aria-describedby'):
            if key in attrs: self.controls.extend(attrs[key].split())

with tempfile.TemporaryDirectory() as directory:
    output = Path(directory); preview.build_preview(output, 'http://localhost')
    pages = {'/' + str(f.relative_to(output)).removesuffix('index.html'): Page(f.read_text()) for f in output.rglob('*.html')}
    routes = dict(re.findall(r'^  (/work/[^\n]*):\n    template: ([\w-]+)$', (preview.THEME / 'routes.yaml').read_text(), re.M))
    for name in preview.PAGES + ['kontakt-danke']:
        route = preview.page_path(name)
        assert routes.get(route) == name, ('missing Ghost route', route, name)
    for route, page in pages.items():
        assert all(target in page.ids for target in page.controls), ('missing dialog or ARIA target', route)
        for ref in page.refs:
            url = urlsplit(ref)
            if url.netloc not in ('', 'localhost') or url.scheme not in ('', 'http'): continue
            path = url.path or route
            if path.startswith('/assets/'):
                assert (output / path.lstrip('/')).is_file(), ('missing asset', ref)
            elif path in pages:
                assert not url.fragment or url.fragment in pages[path].ids, ('missing anchor', route, ref)
    assert len(pages['/work/'].dialogs) == 6
    source = '\n'.join(f.read_text() for f in preview.THEME.rglob('*.hbs'))
    assert 'data-higgsfield' not in source and not re.search(r'''{{asset ['"]video/''', source)
    assert set(re.findall(r'{{@custom\.([^}]+)}}', source)) == set(preview.CUSTOM)
subprocess.run([sys.executable, str(Path(__file__).with_name('build-nexpt-search.py')), '--check'], check=True)
subprocess.run([sys.executable, str(Path(__file__).with_name('build-nexpt-seo.py')), '--check'], check=True)
subprocess.run([sys.executable, str(Path(__file__).with_name('check-nexpt-seo.py'))], check=True)
print(f'PASS: {len(pages)} pages, Ghost routes, assets, internal anchors, unique IDs, 6 dialogs, ARIA targets and all Ghost custom settings.')
