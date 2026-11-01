const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() {
    this.listeners = {};
    this.attributes = {};
    this.dataset = {};
    this.style = { setProperty: (key, value) => { this[key] = value; } };
    this.classes = new Set();
    this.classList = { add: name => this.classes.add(name), toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
    this.children = [];
    this.selectors = {};
  }
  querySelector(selector) { return this.selectors[selector] || null; }
  querySelectorAll(selector) { return this.selectors[selector] || []; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  emit(type, event = {}) { (this.listeners[type] || []).forEach(listener => listener({ target: this, ...event })); }
  contains(element) { return element === this || this.children.some(child => child.contains(element)); }
  focus() { document.activeElement = this; }
  after(element) {
    if (element.parent) element.parent.children = element.parent.children.filter(child => child !== element);
    element.parent = this.parent;
    this.parent.children.push(element);
  }
  closest(selector) { return this.closestMap?.[selector] || this.parent?.closest(selector) || null; }
  animate() { return {}; }
  getBoundingClientRect() { return { width: 300, left: 100, top: 100, right: 400, bottom: 500 }; }
}

const root = new Element();
const controls = new Element();
const tabs = Array.from({ length: 3 }, () => new Element());
const dots = Array.from({ length: 3 }, () => new Element());
const play = new Element();
const previous = new Element();
const next = new Element();
controls.children = [...dots, play, previous, next];
controls.children.forEach(element => { element.parent = controls; });
const panels = ['Nexpt Work', 'Nexpt HR', 'Nexpt Outline'].map((name, index) => {
  const panel = new Element();
  const figure = new Element();
  const video = new Element();
  const link = new Element();
  panel.hidden = index !== 0;
  panel.dataset.storyName = name;
  panel.closestMap = { '[data-story-panel]': panel };
  figure.parent = panel;
  figure.closestMap = { '.nexpt-story-visual': figure };
  video.parent = figure;
  video.duration = 5;
  video.currentTime = 0;
  video.paused = true;
  video.playCount = 0;
  video.play = () => { video.paused = false; video.playCount++; video.emit('playing'); return Promise.resolve(); };
  video.pause = () => { video.paused = true; video.emit('pause'); };
  link.parent = panel;
  panel.children = [figure, link];
  panel.selectors = { '[data-motion-scene]': video, '.nexpt-story-visual': figure };
  panel.video = video;
  panel.link = link;
  return panel;
});
const status = new Element();
const motionNote = new Element();
root.selectors = {
  '[data-story-panel]': panels, '[data-story-tab]': tabs, '[data-story-dot]': dots,
  '[data-story-play]': play, '[data-story-controls]': controls,
  '[data-story-status]': status, '[data-story-motion-note]': motionNote,
  '[data-story-previous]': previous, '[data-story-next]': next,
  '[data-story-stage]': new Element()
};

const benefits = new Element();
const track = new Element();
track.scrollLeft = 0;
track.scrollWidth = 1600;
track.clientWidth = 800;
track.scrollBy = options => { track.lastScroll = options; track.scrollLeft = Math.max(0, Math.min(800, track.scrollLeft + options.left)); track.emit('scroll'); };
const benefitPrevious = new Element();
const benefitNext = new Element();
const cards = Array.from({ length: 5 }, () => new Element());
benefits.selectors = { '[data-benefit-track]': track, '[data-benefit-previous]': benefitPrevious, '[data-benefit-next]': benefitNext, '[data-benefit-card]': cards };
const document = new Element();
document.hidden = false;
const opener = new Element();
opener.dataset.benefitOpen = 'example';
const dialog = new Element();
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.emit('close'); };
document.getElementById = id => id === 'example' ? dialog : null;
document.dispatchEvent = event => document.emit(event.type);
document.selectors = { '[data-nexpt-showcase]': [root], '[data-nexpt-benefits]': [benefits], '[data-benefit-open]': [opener] };
const media = new Element();
media.matches = false;
let intersect;
let raf = 0;
const pending = new Map();
const rendered = [];
let now = 0;
const step = () => { now += 100; const tasks = [...pending.values()]; pending.clear(); tasks.forEach(fn => fn(now)); };
const context = {
  document, Event: class { constructor(type) { this.type = type; } }, window: { matchMedia: () => media, IntersectionObserver: true, ResizeObserver: true, NexptMotion: { duration: 10000, render: (scene, time) => rendered.push({ scene, time }) } },
  IntersectionObserver: class { constructor(callback) { intersect = callback; } observe() {} },
  ResizeObserver: class { constructor(callback) { this.callback = callback; } observe() { this.callback(); } },
  requestAnimationFrame: fn => { pending.set(++raf, fn); return raf; }, cancelAnimationFrame: id => pending.delete(id),
  getComputedStyle: () => ({ columnGap: '24px' })
};

vm.runInNewContext(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/work-stories.js`, 'utf8'), context);
assert.equal(pending.size, 0, 'Autoplay waits until the carousel is visible');
assert.equal(play.attributes['aria-pressed'], 'true');
intersect([{ isIntersecting: true }]); step(); step();
assert.ok(Number(dots[0]['--story-progress']) > 0, 'The active indicator advances with autoplay');
play.emit('click');
const pausedProgress = dots[0]['--story-progress'];
step(); step();
assert.equal(dots[0]['--story-progress'], pausedProgress, 'Pause freezes the progress indicator');
intersect([{ isIntersecting: false }]); intersect([{ isIntersecting: true }]);
assert.equal(pending.size, 0, 'A user pause survives scrolling out and back into view');
play.emit('click'); step(); step();
assert.ok(Number(dots[0]['--story-progress']) > Number(pausedProgress), 'Play resumes from the paused position');
tabs[0].emit('keydown', { key: 'ArrowRight', preventDefault() {} });
assert.equal(panels[1].hidden, false);
assert.equal(document.activeElement, tabs[1]);
assert.equal(controls.parent, panels[1]);
step(); step();
assert.equal(play.attributes['aria-pressed'], 'true');
assert.ok(rendered.at(-1).time > 0, 'Motion advances over real frame timestamps');
next.focus(); next.emit('click');
assert.equal(document.activeElement, next, 'Product changes preserve control focus');
assert.equal(panels[2].hidden, false);
for (let i = 0; i < 102; i++) step();
assert.equal(panels[0].hidden, false, 'The timeline advances to the next product');
document.hidden = true; document.emit('visibilitychange');
assert.equal(pending.size, 0, 'Background tabs stop requesting frames');
document.hidden = false; document.emit('visibilitychange');
assert.equal(pending.size, 1);
intersect([{ isIntersecting: false }]); assert.equal(pending.size, 0);
intersect([{ isIntersecting: true }]); assert.equal(pending.size, 1);
opener.emit('click');
assert.equal(dialog.open, true, 'Plus opens the requested native dialog');
assert.equal(play.attributes['aria-pressed'], 'false', 'A modal stops the carousel');
assert.equal(pending.size, 0);
dialog.emit('pointerdown', { clientX: 150, clientY: 200 });
dialog.emit('click', { clientX: 150, clientY: 200 });
assert.equal(dialog.open, true, 'Clicking dialog padding does not close it');
dialog.emit('pointerdown', { clientX: 50, clientY: 50 });
dialog.emit('click', { clientX: 50, clientY: 50 });
assert.equal(dialog.open, false, 'Backdrop click closes the dialog');
assert.equal(document.activeElement, opener, 'Closing restores focus to the plus card');
media.matches = true; media.emit('change');
assert.equal(play.disabled, true);
assert.equal(motionNote.hidden, false);
tabs[2].emit('click'); assert.equal(panels[2].hidden, false, 'Manual tabs work with reduced motion');
benefitNext.emit('click');
assert.equal(track.lastScroll.behavior, 'auto');
assert.equal(benefitPrevious.disabled, false);
track.scrollLeft = 800; track.emit('scroll'); assert.equal(benefitNext.disabled, true);
console.log('PASS: product tabs, timed motion, Play/Pause, auto advance, hidden/offscreen pause, reduced motion, modal open/backdrop/focus and benefit navigation.');

// Exercise the real vector timelines against every declared SVG motion track.
const animations = [];
class VectorElement {
  animate(frames, options) {
    assert.ok(frames?.length, 'Every SVG track has keyframes');
    assert.equal(options.duration, 10000);
    for (let i = 1; i < frames.length; i++) assert.ok(frames[i].offset >= frames[i - 1].offset);
    const animation = { pause() { this.paused = true; } };
    animations.push(animation);
    return animation;
  }
}
const motionContext = { Element: VectorElement, window: { matchMedia: () => ({ matches: false }) }, document: { querySelectorAll: () => [] } };
vm.runInNewContext(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/product-motion.js`, 'utf8'), motionContext);
for (const product of ['work', 'hr', 'outline']) {
  const markup = fs.readFileSync(`${__dirname}/../themes/nexpt-work/partials/motion-${product}.hbs`, 'utf8');
  const nodes = [...markup.matchAll(/data-motion="([^"]+)"/g)].map(m => Object.assign(new VectorElement(), { dataset: { motion: m[1] } }));
  const scene = { querySelectorAll: () => nodes };
  motionContext.window.NexptMotion.render(scene, -100);
  assert.ok(animations.every(animation => animation.paused && animation.currentTime === 0));
  motionContext.window.NexptMotion.render(scene, 12000);
  assert.ok(animations.slice(-nodes.length).every(animation => animation.currentTime === 10000));
  animations.length = 0;
}
console.log('PASS: every SVG track, ordered keyframes, paused creation and bounded timeline seeking.');

// Check standalone playback with the real controller on each product page.
for (const reduceMotion of [false, true]) {
  const productDocument = new Element();
  productDocument.hidden = false;
  const preference = new Element();
  preference.matches = reduceMotion;
  const observers = [];
  const productFrames = new Map();
  let frameId = 0, timestamp = 0;
  const products = ['work', 'hr', 'outline'].map(product => {
    const container = new Element();
    const button = new Element();
    const scene = new Element();
    const node = Object.assign(new VectorElement(), { dataset: { motion: `${product}-${product === 'work' ? 'card' : product === 'hr' ? 'request' : 'selection'}` } });
    scene.selectors['[data-motion]'] = [node];
    container.selectors = { '[data-motion-scene]': scene, '[data-motion-play]': button };
    return { container, button };
  });
  productDocument.selectors['[data-product-motion]'] = products.map(product => product.container);
  const productContext = {
    Element: VectorElement, document: productDocument,
    window: { matchMedia: () => preference, IntersectionObserver: true },
    IntersectionObserver: class { constructor(callback) { observers.push(callback); } observe() {} },
    requestAnimationFrame: callback => { productFrames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => productFrames.delete(id)
  };
  const advance = () => { timestamp += 100; const callbacks = [...productFrames.values()]; productFrames.clear(); callbacks.forEach(callback => callback(timestamp)); };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../themes/nexpt-work/assets/product-motion.js`, 'utf8'), productContext);
  assert.equal(productFrames.size, 0, 'Standalone autoplay waits for visibility');
  observers.forEach(callback => callback([{ isIntersecting: true }]));
  advance(); advance();
  for (const { container, button } of products) {
    assert.equal(button.attributes['aria-pressed'], String(!reduceMotion));
    assert.equal(button.disabled, reduceMotion);
    if (!reduceMotion) assert.ok(Number(container['--motion-progress']) > 0);
  }
  if (reduceMotion) { assert.equal(productFrames.size, 0, 'Reduced motion never autoplays'); continue; }
  products.forEach(({ button }) => button.emit('click'));
  const frozen = products.map(({ container }) => container['--motion-progress']);
  advance(); advance();
  products.forEach(({ container }, i) => assert.equal(container['--motion-progress'], frozen[i]));
  observers.forEach(callback => callback([{ isIntersecting: false }]));
  observers.forEach(callback => callback([{ isIntersecting: true }]));
  assert.equal(productFrames.size, 0, 'Scrolling does not undo a user pause');
  products.forEach(({ button }) => button.emit('click'));
  advance(); advance();
  products.forEach(({ container }, i) => assert.ok(Number(container['--motion-progress']) > Number(frozen[i])));
  productDocument.hidden = true; productDocument.emit('visibilitychange');
  assert.equal(productFrames.size, 0, 'Hidden tabs stop all standalone clocks');
  productDocument.hidden = false; productDocument.emit('visibilitychange');
  observers.forEach(callback => callback([{ isIntersecting: false }]));
  assert.equal(productFrames.size, 0, 'Offscreen product scenes stop requesting frames');
  observers.forEach(callback => callback([{ isIntersecting: true }]));
  for (let i = 0; i < 100; i++) advance();
  products.forEach(({ container }) => assert.ok(Number(container['--motion-progress']) < .1, 'The indicator loops with the 10-second scene'));
  preference.matches = true; preference.emit('change');
  assert.equal(productFrames.size, 0, 'Changing the motion preference stops active playback');
}
console.log('PASS: Work, HR and Outline autoplay, synchronized progress, pause/resume, loop, offscreen/background suspension and reduced motion.');
