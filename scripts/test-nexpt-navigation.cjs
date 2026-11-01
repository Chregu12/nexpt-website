const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Node {
  constructor(document) {
    this.document = document; this.listeners = {}; this.attributes = {}; this.selectors = {}; this.children = []; this.dataset = {}; this.value = '';
    this.classes = new Set(); this.classList = { add: name => this.classes.add(name), toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
  }
  querySelector(selector) { return this.selectors[selector] || null; }
  querySelectorAll(selector) { return this.selectors[selector] || []; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  async emit(type, event = {}) { for (const listener of this.listeners[type] || []) await listener({ type, target: this, ...event }); }
  dispatchEvent(event) { return this.emit(event.type); }
  focus() { this.document.activeElement = this; }
  click() { this.clicked = true; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  closest() { return null; }
  getClientRects() { return [{}]; }
  getBoundingClientRect() { return { left: 100, top: 100, right: 600, bottom: 700 }; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  showModal() { this.open = true; }
  close() { this.open = false; return this.emit('close'); }
}

(async () => {
  const document = new Node(); document.document = document;
  const node = () => new Node(document);
  document.documentElement = node();
  const header = node(), nav = node(), toggle = node(), search = node(), main = node(), footer = node();
  const brand = node(), link = node(), summary = node(); link.href = 'https://nexpt.ch/work/hr/';
  const menus = [node(), node()]; menus.forEach(menu => { menu.selectors.summary = summary; });
  const mobile = node(); mobile.matches = true;
  document.selectors = { '.site-header': header, 'main, body > footer': [main, footer], '#site-search': search };
  header.selectors = { '.nav': nav, '.mobile-nav-toggle': toggle, 'a[href], button:not([disabled]), summary': [brand, toggle, link] };
  header.children = [nav, toggle, brand]; nav.children = [link];
  nav.selectors = { details: menus, a: [link] };
  const context = { document, window: { matchMedia: () => mobile }, URL, location: { pathname: '/work/hr/' } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/navigation.js`, 'utf8'), context);
  assert.equal(nav.inert, true, 'Closed mobile navigation cannot receive focus');
  assert.equal(link.attributes['aria-current'], 'page');
  await toggle.emit('click');
  assert.equal(toggle.attributes['aria-label'], 'Menü schliessen');
  assert.ok(menus.every(menu => menu.open), 'Mobile product and about groups open together');
  assert.equal(main.inert, true); assert.equal(footer.inert, true);
  link.focus(); let prevented = false;
  await document.emit('keydown', { key: 'Tab', preventDefault() { prevented = true; } });
  assert.ok(prevented); assert.equal(document.activeElement, brand, 'Focus wraps inside the navigation');
  await document.emit('keydown', { key: 'Escape' });
  assert.equal(document.activeElement, toggle); assert.equal(nav.inert, true); assert.equal(main.inert, false);
  await toggle.emit('click'); await document.emit('nexpt:searchopen');
  assert.equal(toggle.attributes['aria-expanded'], 'false'); assert.equal(main.inert, false, 'Search releases the mobile background lock');
  await toggle.emit('click'); await link.emit('click');
  assert.equal(toggle.attributes['aria-expanded'], 'false', 'Following a link closes the overlay');
  mobile.matches = false; await mobile.emit('change');
  assert.equal(nav.inert, false, 'Desktop navigation remains accessible after resizing');
  menus[0].open = true; menus[1].open = true; await menus[0].emit('toggle');
  assert.equal(menus[1].open, false, 'Desktop dropdowns remain mutually exclusive');
  console.log('PASS: mobile open/close, grouped links, background lock, focus wrap, Escape, search handoff, navigation and desktop resize.');

  const input = node(), results = node(), status = node(), opener = node();
  search.selectors = { input, '#search-results': results, '[data-search-status]': status };
  search.dataset.searchIndex = '/assets/search-index.json';
  document.selectors['[data-search-open]'] = [opener];
  document.createElement = node;
  let fetches = 0, failing = true;
  const pages = JSON.parse(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/search-index.json`, 'utf8'));
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/site-search.js`, 'utf8'), {
    document, Event: class { constructor(type) { this.type = type; } },
    fetch: async url => { assert.equal(url, search.dataset.searchIndex); fetches++; return { ok: !failing, json: async () => pages }; }
  });
  await opener.emit('click');
  assert.match(status.textContent, /nicht verfügbar/, 'Network failure keeps the direct-entry fallback');
  failing = false; await opener.emit('click');
  assert.equal(document.activeElement, input); assert.equal(results.children.length, 8);
  input.value = 'FERIEN'; await input.emit('input');
  assert.ok(results.children.some(item => item.children[0].href === '/work/hr/'), 'HR content is searchable regardless of case');
  input.value = 'Überblick'; await input.emit('input'); const accented = results.children.length;
  input.value = 'Uberblick'; await input.emit('input'); assert.equal(results.children.length, accented);
  input.value = 'Spesen Freigaben'; await input.emit('input');
  assert.equal(results.children[0].children[0].href, '/work/hr/', 'Multiple words match actual page content');
  input.value = '<script>kein-treffer</script>'; await input.emit('input');
  assert.equal(results.children.length, 0); assert.match(status.textContent, /Keine passende Seite/);
  input.value = 'Outline'; await input.emit('input'); assert.match(results.children[0].children[0].children[0].textContent, /Outline/);
  const firstResult = results.children[0].children[0]; results.selectors.a = firstResult;
  await input.emit('keydown', { key: 'Enter', preventDefault() {} }); assert.equal(firstResult.clicked, true, 'Enter follows the top result');
  await search.close(); assert.equal(document.activeElement, opener, 'Closing search restores focus to its opener');
  await opener.emit('click'); assert.equal(fetches, 2, 'A loaded index is reused; a failed request can retry');
  await search.emit('pointerdown', { clientX: 150, clientY: 150 }); await search.emit('click', { clientX: 150, clientY: 150 });
  assert.equal(search.open, true, 'Clicking dialog padding keeps search open');
  await search.emit('pointerdown', { clientX: 20, clientY: 20 }); await search.emit('click', { clientX: 20, clientY: 20 });
  assert.equal(search.open, false);
  console.log('PASS: search content, ranking, case/accents, multiword queries, no results, load errors/retry/cache, backdrop and focus return.');
})().catch(error => { console.error(error); process.exitCode = 1; });
