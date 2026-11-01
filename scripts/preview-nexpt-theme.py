#!/usr/bin/env python3
"""Preview Nexpt's static Ghost pages without a Ghost database (stdlib only)."""
import argparse
import functools
import http.server
import json
import re
import tempfile
from pathlib import Path

THEME = Path(__file__).resolve().parents[1] / 'themes/nexpt-work'
CUSTOM = json.loads((THEME / 'package.json').read_text())['config']['custom']
PAGES = ['work', 'hr', 'outline', 'integration', 'funktionen', 'einsatzbereiche', 'faq', 'wer-wir-sind', 'kontakt']


def render(text, base_url, hide_contact=False):
    text = re.sub(r'{{> "([^"]+)"( hideContact=true)?}}', lambda m: render(
        (THEME / 'partials' / (m[1] + '.hbs')).read_text(), base_url, bool(m[2])), text)
    text = re.sub(r'{{#unless hideContact}}(.*?){{/unless}}', lambda m: '' if hide_contact else m[1], text, flags=re.S)
    text = re.sub(r'{{asset [\'\"]([^\'\"]+)[\'\"]}}', lambda m: '/assets/' + m[1], text)
    text = re.sub(r'{{@custom\.([^}]+)}}', lambda m: CUSTOM[m[1]]['default'], text)
    return text.replace('{{@site.url}}', base_url).replace('{{@site.title}}', 'Nexpt').replace('{{date format="YYYY"}}', '2026')


def build_preview(output, base_url):
    (output / 'assets').symlink_to(THEME / 'assets', target_is_directory=True)
    for page in PAGES:
        body = (THEME / (page + '.hbs')).read_text()
        title = re.search(r'{{#contentFor "pageTitle"}}(.*?){{/contentFor}}', body, re.S)[1]
        body = re.sub(r'{{#contentFor "pageTitle"}}.*?{{/contentFor}}', '', body, flags=re.S).replace('{{!< default}}', '')
        html = render((THEME / 'default.hbs').read_text(), base_url)
        html = html.replace('{{{body}}}', render(body, base_url)).replace('{{{block "pageTitle"}}}', title)
        for token, value in [('meta_title', 'Nexpt'), ('body_class', ''), ('ghost_head', ''), ('ghost_foot', '')]:
            html = html.replace('{{' + token + '}}', value)
        assert '{{' not in html, (page, re.findall(r'{{.*?}}', html))
        destination = output / 'work' if page == 'work' else output / 'work' / page
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
