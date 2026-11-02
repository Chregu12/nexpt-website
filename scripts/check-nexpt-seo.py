#!/usr/bin/env python3
"""Validate crawler-visible metadata, structured data and AI exports."""
import importlib.util
import json
import re
import tempfile
from html.parser import HTMLParser
from pathlib import Path

spec = importlib.util.spec_from_file_location('preview', Path(__file__).with_name('preview-nexpt-theme.py'))
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)
config = json.loads((preview.THEME / 'seo.json').read_text())


class Head(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.titles = []; self.metas = {}; self.canonicals = []; self.schemas = []
        self.title = False; self.json_ld = False; self.buffer = ''
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title': self.title = True; self.buffer = ''
        if tag == 'meta': self.metas.setdefault(a.get('name', a.get('property')), []).append(a.get('content'))
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a['href'])
        if tag == 'script' and a.get('type') == 'application/ld+json': self.json_ld = True; self.buffer = ''

    def handle_endtag(self, tag):
        if tag == 'title': self.titles.append(self.buffer); self.title = False
        if tag == 'script' and self.json_ld: self.schemas.append(json.loads(self.buffer)); self.json_ld = False

    def handle_data(self, data):
        if self.title or self.json_ld: self.buffer += data


titles, descriptions = set(), set()
with tempfile.TemporaryDirectory() as directory:
    output = Path(directory); preview.build_preview(output, 'http://localhost')
    for name, data in config['pages'].items():
        url = config['site_url'] + preview.page_path(name)
        text = (output / preview.page_path(name).strip('/') / 'index.html').read_text()
        head = Head(text)
        assert len(head.titles) == 1 and 20 <= len(head.titles[0]) <= 65, (name, head.titles)
        assert head.titles[0] not in titles; titles.add(head.titles[0])
        assert head.canonicals == [url], (name, head.canonicals)
        assert head.metas.get('description') == [data['description']], name
        assert 90 <= len(data['description']) <= 165, (name, len(data['description']))
        assert data['description'] not in descriptions; descriptions.add(data['description'])
        for key in ['og:title', 'twitter:title']: assert head.metas.get(key) == head.titles, (name, key)
        for key in ['og:description', 'twitter:description']: assert head.metas.get(key) == [data['description']], (name, key)
        assert head.metas.get('og:url') == [url]
        image = config['site_url'] + '/assets/' + data.get('image', 'nexpt-icon.png')
        assert head.metas.get('og:image') == head.metas.get('twitter:image') == [image]
        assert (preview.THEME / 'assets' / image.split('/')[-1]).is_file()
        robots = head.metas.get('robots', [])
        assert len(robots) == 1
        if data.get('noindex'):
            assert 'noindex' in robots[0] and not head.schemas
            continue
        assert 'noindex' not in robots[0] and 'max-snippet:-1' in robots[0]
        assert len(head.schemas) == 1
        graph = head.schemas[0]['@graph']
        types = {node['@type'] for node in graph}
        assert {'Organization', 'WebSite', 'BreadcrumbList', data.get('page_type', 'WebPage')} <= types
        assert ('SoftwareApplication' in types) == bool(data.get('application'))
        assert not re.search(r'"(?:aggregateRating|review|offers)"', json.dumps(graph)), 'No invented commercial claims'
        page = next(node for node in graph if node['@id'] == url + '#webpage')
        assert page['url'] == url and page['name'] == head.titles[0] and page['inLanguage'] == 'de-CH'
        crumbs = next(node for node in graph if node['@type'] == 'BreadcrumbList')['itemListElement']
        assert crumbs[-1]['item'] == url
        if name != 'work': assert f'aria-current="page">{data["label"]}</span>' in text

index = (preview.THEME / 'assets/nexpt-llms.txt').read_text()
full = (preview.THEME / 'assets/nexpt-llms-full.txt').read_text()
for name in preview.PAGES:
    url = config['site_url'] + preview.page_path(name)
    assert url in index and url in full, name
assert '/work/kontakt/danke/' not in index + full
assert 'This is an independent publication' not in index + full
assert 'https://nexpt.ch/about.md' not in index + full
assert 'Verfügbarkeit' in full and 'Personalprozesse' in full
print('PASS: 10 unique SEO heads, canonical/OG/Twitter parity, JSON-LD, noindex and public AI exports.')
