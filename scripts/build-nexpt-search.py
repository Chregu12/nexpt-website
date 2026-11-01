#!/usr/bin/env python3
"""Build the public search index from the same templates as the website preview."""
import importlib.util
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

spec = importlib.util.spec_from_file_location('preview', Path(__file__).with_name('preview-nexpt-theme.py'))
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class MainText(HTMLParser):
    def __init__(self):
        super().__init__(); self.inside = False; self.skip = 0; self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'main': self.inside = True
        if tag in ('svg', 'dialog', 'script', 'style'): self.skip += 1

    def handle_endtag(self, tag):
        if tag == 'main': self.inside = False
        if tag in ('svg', 'dialog', 'script', 'style'): self.skip -= 1

    def handle_data(self, data):
        if self.inside and not self.skip: self.parts.append(data)


pages = []
for name in preview.PAGES:
    source = (preview.THEME / (name + '.hbs')).read_text()
    title = re.search(r'{{#contentFor "pageTitle"}}(.*?){{/contentFor}}', source, re.S)[1].strip(' ·')
    parser = MainText()
    parser.feed(preview.render(source, ''))
    pages.append({'title': title, 'url': '/work/' if name == 'work' else '/work/' + name + '/', 'text': ' '.join(' '.join(parser.parts).split())})

target = preview.THEME / 'assets/search-index.json'
content = json.dumps(pages, ensure_ascii=False, indent=2) + '\n'
if '--check' in sys.argv:
    assert target.is_file() and target.read_text() == content, 'Search index is stale; run python3 scripts/build-nexpt-search.py'
    print(f'PASS: public search index matches all {len(pages)} page templates.')
else:
    target.write_text(content)
    print('Updated search index:', len(pages), 'pages')
