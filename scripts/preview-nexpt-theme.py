#!/usr/bin/env python3
"""Preview Nexpt's static Ghost pages without a Ghost database (stdlib only)."""
import argparse
import functools
import http.server
import json
import re
import tempfile
from html.parser import HTMLParser
from pathlib import Path

THEME = Path(__file__).resolve().parents[1] / 'themes/nexpt-work'
CUSTOM = json.loads((THEME / 'package.json').read_text())['config']['custom']
PAGES = ['work', 'hr', 'outline', 'integration', 'funktionen', 'einsatzbereiche', 'faq', 'wer-wir-sind', 'kontakt']


def page_path(name):
    if name == 'work': return '/work/'
    if name == 'kontakt-danke': return '/work/kontakt/danke/'
    return '/work/' + name + '/'


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


def render(text, base_url, hide_contact=False):
    text = re.sub(r'{{![^}]*}}', '', text)
    text = re.sub(r'{{> "([^"]+)"( hideContact=true)?}}', lambda m: render(
        (THEME / 'partials' / (m[1] + '.hbs')).read_text(), base_url, bool(m[2])), text)
    text = re.sub(r'{{#unless hideContact}}(.*?){{/unless}}', lambda m: '' if hide_contact else m[1], text, flags=re.S)
    text = re.sub(r'{{#is "preview"}}.*?{{/is}}', '', text, flags=re.S)
    text = re.sub(r'{{asset [\'\"]([^\'\"]+)[\'\"]}}', lambda m: '/assets/' + m[1], text)
    text = re.sub(r'{{@custom\.([^}]+)}}', lambda m: CUSTOM[m[1]]['default'], text)
    return text.replace('{{@site.url}}', base_url).replace('{{@site.title}}', 'Nexpt').replace('{{date format="YYYY"}}', '2026')


def build_preview(output, base_url):
    (output / 'assets').symlink_to(THEME / 'assets', target_is_directory=True)
    for page in PAGES + ['kontakt-danke']:
        body = (THEME / (page + '.hbs')).read_text()
        blocks = dict(re.findall(r'{{#contentFor "([^"]+)"}}(.*?){{/contentFor}}', body, re.S))
        body = re.sub(r'{{#contentFor "[^"]+"}}.*?{{/contentFor}}', '', body, flags=re.S)
        layout = re.sub(r'{{#if \(block "seo"\)}}(.*?){{else}}(.*?){{/if}}', lambda m: m[1] if blocks.get('seo') else m[2], (THEME / 'default.hbs').read_text(), flags=re.S)
        html = render(layout, base_url).replace('{{{body}}}', render(body, base_url))
        for name, value in blocks.items():
            html = html.replace('{{{block "' + name + '"}}}', render(value, base_url))
        html = re.sub(r'{{ghost_head[^}]*}}', '', html)
        for token, value in [('meta_title', 'Nexpt'), ('body_class', ''), ('ghost_head', ''), ('ghost_foot', '')]:
            html = html.replace('{{' + token + '}}', value)
        assert '{{' not in html, (page, re.findall(r'{{.*?}}', html))
        destination = output / page_path(page).strip('/')
        destination.mkdir(parents=True, exist_ok=True)
        (destination / 'index.html').write_text(html)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8766)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='nexpt-theme-') as directory:
        output = Path(directory)
        build_preview(output, 'http://127.0.0.1:' + str(args.port))
        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(output))
        print('Preview: http://127.0.0.1:' + str(args.port) + '/work/', flush=True)
        try:
            http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler).serve_forever()
        except KeyboardInterrupt:
            pass
