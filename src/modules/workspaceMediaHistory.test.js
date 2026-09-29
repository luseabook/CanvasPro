import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderWorkspaceMediaHistoryMenu,
  createWorkspaceMediaHistoryMenuController,
} from './workspaceMediaHistory.js';

function makeClassList() {
  const names = new Set();
  return {
    names,
    add(...values) {
      values.forEach((value) => names.add(value));
    },
    remove(...values) {
      values.forEach((value) => names.delete(value));
    },
    contains(value) {
      return names.has(value);
    },
    toggle(value, force) {
      const on = force === undefined ? !names.has(value) : Boolean(force);
      if (on) names.add(value);
      else names.delete(value);
      return names.has(value);
    },
  };
}

function makeMenuElement(over = {}) {
  const listeners = new Map();
  const element = {
    listeners,
    classList: makeClassList(),
    style: {},
    attributes: {},
    innerHTML: '',
    rect: { left: 0, top: 0, width: 200, height: 100, bottom: 0 },
    ownerDocument: { activeElement: null },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getBoundingClientRect() {
      return this.rect;
    },
    contains() {
      return true;
    },
    querySelector() {
      return null;
    },
    addEventListener(type, handler, options) {
      const entries = listeners.get(type) || [];
      entries.push({ handler, options });
      listeners.set(type, entries);
    },
    removeEventListener(type, handler) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((entry) => entry.handler !== handler),
      );
    },
  };
  return Object.assign(element, over);
}

function makeWindow(over = {}) {
  const pending = [];
  const cleared = [];
  const frames = [];
  const windowObject = {
    pending,
    cleared,
    frames,
    innerWidth: 'innerWidth' in over ? over.innerWidth : 1024,
    innerHeight: 'innerHeight' in over ? over.innerHeight : 768,
  };
  windowObject.setTimeout =
    'setTimeout' in over
      ? over.setTimeout
      : (fn, delay) => {
          pending.push({ fn, delay });
          return pending.length;
        };
  windowObject.clearTimeout =
    'clearTimeout' in over
      ? over.clearTimeout
      : (id) => {
          cleared.push(id);
          if (id > 0) pending[id - 1] = null;
        };
  windowObject.requestAnimationFrame =
    'requestAnimationFrame' in over
      ? over.requestAnimationFrame
      : (fn) => {
          frames.push(fn);
          return frames.length;
        };
  return windowObject;
}

function makeAnchor(rect) {
  return {
    rect,
    getBoundingClientRect() {
      return this.rect;
    },
  };
}

function fire(element, type, event) {
  const entries = element.listeners.get(type) || [];
  assert.equal(entries.length, 1, `expected exactly one ${type} listener`);
  return entries[0].handler(event);
}

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function currentLabel(html) {
  const marker = html.indexOf('is-current');
  assert.notEqual(marker, -1);
  const start = html.indexOf('<strong>', marker);
  const end = html.indexOf('</strong>', start);
  return html.slice(start + '<strong>'.length, end);
}

const threeResults = () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

// ---------------------------------------------------------------- rendering

test('renders the whole menu with every default', () => {
  const html = renderWorkspaceMediaHistoryMenu({ results: [{ id: 'a' }, { id: 'b' }] });
  const item = (label, status, current) =>
    '<button type="button" class="story-media-history-item story-clip-video-history-item' +
    (current ? ' is-current' : '') +
    '"  role="menuitem" aria-current="' +
    (current ? 'true' : 'false') +
    '">\n' +
    '      <span class="story-media-history-media story-clip-video-history-media"></span>\n' +
    '      <span><strong>' +
    label +
    '</strong><small>' +
    status +
    '</small></span>\n' +
    '    </button>';
  const expected =
    '<div class="story-media-history-heading story-clip-video-history-heading"><strong>媒体结果</strong>' +
    '<span>2 个版本</span></div>\n' +
    '    <div class="story-media-history-list story-clip-video-history-list" role="menu" ' +
    'aria-label="媒体结果历史结果">' +
    item('版本 2', '点击切换', false) +
    item('版本 1', '当前使用', true) +
    '</div>';
  assert.equal(html, expected);
});

test('returns an empty string when the results are below the minimum item count', () => {
  assert.equal(renderWorkspaceMediaHistoryMenu(), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: [] }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: [{ id: 'a' }] }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: [{ id: 'a' }, null] }), '');
});

test('returns an empty string for a non-array or unusable results value', () => {
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: 'nope' }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: { length: 5 } }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: null }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: undefined }), '');
});

test('keeps only object entries and leaves the caller array untouched', () => {
  const results = [{ id: 'a' }, null, 'text', 3, undefined, false, { id: 'b' }, ['array']];
  const snapshot = results.slice();
  const html = renderWorkspaceMediaHistoryMenu({ results, getItemLabel: (item) => item.id });
  assert.equal(html.includes('<span>3 个版本</span>'), true);
  assert.deepEqual(results, snapshot);
  assert.deepEqual(results[0], { id: 'a' });
});

test('renders the items in reverse order', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: threeResults(),
    getItemLabel: (item) => item.id,
  });
  assert.ok(html.indexOf('<strong>c</strong>') < html.indexOf('<strong>b</strong>'));
  assert.ok(html.indexOf('<strong>b</strong>') < html.indexOf('<strong>a</strong>'));
});

test('marks the active item as current', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: threeResults(),
    activeIndex: 1,
    getItemLabel: (item) => item.id,
  });
  assert.equal(currentLabel(html), 'b');
  assert.equal(countOf(html, 'is-current'), 1);
  assert.equal(countOf(html, 'aria-current="true"'), 1);
  assert.equal(countOf(html, 'aria-current="false"'), 2);
});

test('clamps the active index to the available items', () => {
  const render = (activeIndex) =>
    renderWorkspaceMediaHistoryMenu({
      results: threeResults(),
      activeIndex,
      getItemLabel: (item) => item.id,
    });
  assert.equal(currentLabel(render(0)), 'a');
  assert.equal(currentLabel(render(2)), 'c');
  assert.equal(currentLabel(render(99)), 'c');
  assert.equal(currentLabel(render(1.9)), 'b');
  assert.equal(currentLabel(render('1')), 'b');
});

test('falls back to the first item for unusable active indexes', () => {
  const render = (activeIndex) =>
    renderWorkspaceMediaHistoryMenu({
      results: threeResults(),
      activeIndex,
      getItemLabel: (item) => item.id,
    });
  assert.equal(currentLabel(render(-4)), 'a');
  assert.equal(currentLabel(render(-0.5)), 'a');
  assert.equal(currentLabel(render(Number.NaN)), 'a');
  assert.equal(currentLabel(render('nope')), 'a');
  assert.equal(currentLabel(render(null)), 'a');
});

test('defaults a missing or nullish title, count label and menu label', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    title: '',
    countLabel: '',
    menuLabel: '',
  });
  assert.equal(html.includes('<strong>媒体结果</strong><span>2 个版本</span>'), true);
  assert.equal(html.includes('aria-label="媒体结果历史结果"'), true);

  const nullish = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    title: null,
    countLabel: undefined,
    menuLabel: null,
  });
  assert.equal(nullish.includes('<strong>媒体结果</strong><span>2 个版本</span>'), true);
  assert.equal(nullish.includes('aria-label="媒体结果历史结果"'), true);
});

test('trims a whitespace-only title, count label and menu label to nothing', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    title: '   ',
    countLabel: '   ',
    menuLabel: '   ',
  });
  assert.equal(html.includes('<strong></strong><span></span>'), true);
  assert.equal(html.includes('aria-label=""'), true);
  assert.equal(html.includes('媒体结果'), false);
});

test('accepts custom title, count label and menu label', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    title: '剪辑',
    countLabel: '5 / 8',
    menuLabel: '更多版本',
  });
  assert.equal(html.includes('<strong>剪辑</strong><span>5 / 8</span>'), true);
  assert.equal(html.includes('aria-label="更多版本"'), true);
  assert.equal(html.includes('个版本'), false);
});

test('escapes html in the heading, the item label, the status and the menu label', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    title: 'T<&',
    countLabel: 'c"',
    menuLabel: `m'`,
    getItemLabel: () => 'a<b>&"\'',
    getItemStatus: () => 's<',
  });
  assert.equal(html.includes('<strong>T&lt;&amp;</strong><span>c&quot;</span>'), true);
  assert.equal(html.includes('aria-label="m&#39;"'), true);
  assert.equal(html.includes('<strong>a&lt;b&gt;&amp;&quot;&#39;</strong>'), true);
  assert.equal(html.includes('<small>s&lt;</small>'), true);
});

test('falls back when a label, status or attributes callback returns a falsy value', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    getItemLabel: () => '',
    getItemStatus: () => null,
    getItemAttributes: () => 0,
    renderMedia: () => 0,
    renderItemAction: () => undefined,
  });
  assert.equal(html.includes('<strong>版本 1</strong>'), true);
  assert.equal(html.includes('<strong>版本 2</strong>'), true);
  assert.equal(html.includes('<small>点击切换</small>'), true);
  assert.equal(html.includes('class="story-media-history-media story-clip-video-history-media">'), true);
  assert.equal(countOf(html, '<div class="story-media-history-entry'), 0);
});

test('trims callback results that contain only whitespace', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    getItemLabel: () => '  标签  ',
    getItemStatus: () => '  ',
    getItemAttributes: () => '  data-id="x"  ',
    renderItemAction: () => '   ',
  });
  assert.equal(html.includes('<strong>标签</strong>'), true);
  assert.equal(html.includes('<small></small>'), true);
  assert.equal(html.includes('" data-id="x" role="menuitem"'), true);
  assert.equal(countOf(html, '<div class="story-media-history-entry'), 0);
});

test('passes each item, its index and the active index to the callbacks', () => {
  const seen = { label: [], status: [], media: [], attributes: [], action: [] };
  renderWorkspaceMediaHistoryMenu({
    results: threeResults(),
    activeIndex: 5,
    getItemLabel: (item, index) => {
      seen.label.push([item.id, index]);
      return item.id;
    },
    getItemStatus: (item, index, active) => {
      seen.status.push([item.id, index, active]);
      return 'st';
    },
    renderMedia: (item, index) => {
      seen.media.push([item.id, index]);
      return '';
    },
    getItemAttributes: (item, index) => {
      seen.attributes.push([item.id, index]);
      return '';
    },
    renderItemAction: (item, index, active) => {
      seen.action.push([item.id, index, active]);
      return '';
    },
  });
  assert.deepEqual(seen.label, [
    ['a', 0],
    ['b', 1],
    ['c', 2],
  ]);
  assert.deepEqual(seen.status, [
    ['a', 0, 2],
    ['b', 1, 2],
    ['c', 2, 2],
  ]);
  assert.deepEqual(seen.media, [
    ['a', 0],
    ['b', 1],
    ['c', 2],
  ]);
  assert.deepEqual(seen.attributes, [
    ['a', 0],
    ['b', 1],
    ['c', 2],
  ]);
  assert.deepEqual(seen.action, [
    ['a', 0, 2],
    ['b', 1, 2],
    ['c', 2, 2],
  ]);
});

test('injects media and attributes without escaping them', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: [{ id: 'a' }, { id: 'b' }],
    renderMedia: () => '<video src="a&b"></video>',
    getItemAttributes: () => 'data-id="x&y"',
  });
  assert.equal(countOf(html, '<video src="a&b"></video>'), 2);
  assert.equal(countOf(html, '" data-id="x&y" role="menuitem"'), 2);
  assert.equal(html.includes('&amp;'), false);
});

test('wraps an item in an entry div only when it has an action', () => {
  const html = renderWorkspaceMediaHistoryMenu({
    results: threeResults(),
    activeIndex: 1,
    getItemLabel: (item) => item.id,
    renderItemAction: (item) =>
      item.id === 'a' ? '  <button>del-a</button>  ' : item.id === 'b' ? '<button>del-b</button>' : '',
  });
  assert.equal(countOf(html, '<div class="story-media-history-entry">'), 1);
  assert.equal(countOf(html, '<div class="story-media-history-entry is-current">'), 1);
  assert.equal(countOf(html, '<button>del-'), 2);
  assert.equal(countOf(html, '<button type="button"'), 3);

  const current = html.indexOf('<div class="story-media-history-entry is-current">');
  const currentButton = html.indexOf('<button type="button"', current);
  const currentAction = html.indexOf('<button>del-b</button>');
  assert.ok(current < currentButton && currentButton < currentAction);

  assert.equal(html.endsWith('<button>del-a</button></div></div>'), true);
});

test('floors the minimum item count at one and treats zero as the default', () => {
  const one = [{ id: 'a' }];
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: 1 }) === '', false);
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: -5 }) === '', false);
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: 0 }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: Number.NaN }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: 'nope' }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: one, minimumItemCount: undefined }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: [], minimumItemCount: 0.5 }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: [], minimumItemCount: -0.5 }), '');
});

test('honours a custom minimum item count', () => {
  const two = [{ id: 'a' }, { id: 'b' }];
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: 2 }) === '', false);
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: 2.9 }) === '', false);
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: '2' }) === '', false);
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: 3 }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: '4' }), '');
  assert.equal(renderWorkspaceMediaHistoryMenu({ results: two, minimumItemCount: Infinity }), '');
});

test('rejects a null options bag', () => {
  assert.throws(() => renderWorkspaceMediaHistoryMenu(null), TypeError);
  assert.throws(() => createWorkspaceMediaHistoryMenuController(null), TypeError);
});

// --------------------------------------------------------------- controller

test('registers the pointer and wheel listeners and freezes the api', () => {
  const menuElement = makeMenuElement();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
  });
  assert.deepEqual([...menuElement.listeners.keys()].sort(), ['pointerenter', 'pointerleave', 'wheel']);
  assert.deepEqual(menuElement.listeners.get('wheel')[0].options, { passive: false });
  assert.equal(Object.isFrozen(api), true);
  assert.deepEqual(Object.keys(api).sort(), [
    'clearHideTimer',
    'destroy',
    'getAnchor',
    'hide',
    'position',
    'refresh',
    'show',
  ]);
  assert.throws(() => {
    api.show = () => {};
  }, TypeError);
});

test('does nothing without a menu element', () => {
  const api = createWorkspaceMediaHistoryMenuController();
  assert.equal(api.show({}), false);
  assert.equal(api.position(), false);
  assert.equal(api.refresh(), false);
  assert.equal(api.getAnchor(), null);
  assert.doesNotThrow(() => api.clearHideTimer());
  assert.doesNotThrow(() => api.hide());
  assert.doesNotThrow(() => api.hide({ delayed: true }));
  assert.doesNotThrow(() => api.destroy());
});

test('show renders the markup, marks the menu visible and remembers the anchor', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const anchor = makeAnchor({ left: 500, top: 400, width: 100, height: 50, bottom: 450 });
  const seen = [];
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: (target, context) => {
      seen.push([target, context]);
      return '<div>menu</div>';
    },
  });
  const context = { event: { pointerType: 'mouse' } };
  assert.equal(api.show(anchor, context), true);
  assert.equal(menuElement.innerHTML, '<div>menu</div>');
  assert.equal(menuElement.classList.contains('is-visible'), true);
  assert.equal(menuElement.attributes['aria-hidden'], 'false');
  assert.equal(api.getAnchor(), anchor);
  assert.deepEqual(seen, [[anchor, context]]);
  assert.equal(menuElement.style.left, '450px');
  assert.equal(menuElement.style.top, '290px');
});

test('show replaces the previous markup', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({ left: 0, top: 0, width: 0, height: 0, bottom: 0 });
  let markup = '<div>first</div>';
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => markup,
  });
  api.show(anchor);
  markup = '<div>second</div>';
  api.show(anchor);
  assert.equal(menuElement.innerHTML, '<div>second</div>');
});

test('show ignores a missing anchor or menu element', () => {
  const menuElement = makeMenuElement();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  assert.equal(api.show(), false);
  assert.equal(api.show(null), false);
  assert.equal(api.show(''), false);
  assert.equal(api.show(0), false);
  assert.equal(menuElement.innerHTML, '');
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(api.getAnchor(), null);
});

test('show hides the menu when the markup is empty', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({ left: 0, top: 0, width: 0, height: 0, bottom: 0 });
  menuElement.classList.add('is-visible', 'opens-downward');
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '',
  });
  assert.equal(api.show(anchor), false);
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(menuElement.classList.contains('opens-downward'), false);
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
  assert.equal(api.getAnchor(), null);
});

test('show uses the module default markup so nothing appears', () => {
  const menuElement = makeMenuElement();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
  });
  assert.equal(api.show(makeAnchor({})), false);
  assert.equal(menuElement.classList.contains('is-visible'), false);
});

test('show treats whitespace-only markup as real markup', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({ left: 0, top: 0, width: 0, height: 0, bottom: 0 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '   ',
  });
  assert.equal(api.show(anchor), true);
  assert.equal(menuElement.innerHTML, '   ');
  assert.equal(menuElement.classList.contains('is-visible'), true);
});

test('show ignores touch pointers', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({});
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  assert.equal(api.show(anchor, { event: { pointerType: 'touch' } }), false);
  assert.equal(menuElement.innerHTML, '');
  assert.equal(api.getAnchor(), null);
  assert.equal(api.show(anchor, { event: { pointerType: 'pen' } }), true);
});

test('show cancels a pending delayed hide', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const anchor = makeAnchor({});
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.hide({ delayed: true });
  assert.equal(windowObject.pending.length, 1);
  assert.equal(api.show(anchor), true);
  assert.deepEqual(windowObject.cleared, [1]);
  assert.equal(windowObject.pending[0], null);
  api.hide();
  assert.equal(windowObject.pending.length, 1);
});

test('hide clears the anchor and the menu attributes at once', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const anchor = makeAnchor({});
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(anchor);
  api.hide();
  assert.equal(api.getAnchor(), null);
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(menuElement.classList.contains('opens-downward'), false);
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
  assert.equal(menuElement.innerHTML, '<div>x</div>');
  assert.deepEqual(windowObject.cleared, []);
});

test('hide schedules the delayed close with the configured delay', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(makeAnchor({}));
  api.hide({ delayed: true });
  assert.equal(windowObject.pending.length, 1);
  assert.equal(windowObject.pending[0].delay, 120);
  assert.equal(menuElement.classList.contains('is-visible'), true);
  assert.equal(api.getAnchor() !== null, true);
  windowObject.pending[0].fn();
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
  assert.equal(api.getAnchor(), null);
});

test('collapses an unusable hide delay to zero', () => {
  const make = (hideDelayMs) => {
    const windowObject = makeWindow();
    createWorkspaceMediaHistoryMenuController({
      menuElement: makeMenuElement(),
      windowObject,
      hideDelayMs,
    }).hide({ delayed: true });
    return windowObject.pending[0].delay;
  };
  assert.equal(make(0), 0);
  assert.equal(make(-50), 0);
  assert.equal(make(Number.NaN), 0);
  assert.equal(make('nope'), 0);
  assert.equal(make(undefined), 120);
  assert.equal(make(250), 250);
});

test('collapses a negative hide delay to zero', () => {
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement: makeMenuElement(),
    windowObject,
    hideDelayMs: -1,
  });
  api.hide({ delayed: true });
  assert.ok(windowObject.pending[0].delay === 0);
});

test('a delayed hide can be rescheduled', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(makeAnchor({}));
  api.hide({ delayed: true });
  api.hide({ delayed: true });
  assert.deepEqual(windowObject.cleared, [1]);
  assert.equal(windowObject.pending.length, 2);
  assert.equal(windowObject.pending[1].delay, 120);
  assert.equal(menuElement.attributes['aria-hidden'], 'false');
  assert.equal(menuElement.classList.contains('is-visible'), true);
  assert.equal(api.getAnchor() !== null, true);
  windowObject.pending[1].fn();
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(api.getAnchor(), null);
});

test('a delayed hide without a timer hook changes nothing', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow({ setTimeout: undefined });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(makeAnchor({}));
  assert.doesNotThrow(() => api.hide({ delayed: true }));
  assert.equal(menuElement.classList.contains('is-visible'), true);
  assert.equal(menuElement.attributes['aria-hidden'], 'false');
});

test('clearHideTimer only clears a pending timer once', () => {
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement: makeMenuElement(),
    windowObject,
  });
  api.clearHideTimer();
  assert.deepEqual(windowObject.cleared, []);
  api.hide({ delayed: true });
  api.clearHideTimer();
  assert.deepEqual(windowObject.cleared, [1]);
  api.clearHideTimer();
  assert.deepEqual(windowObject.cleared, [1]);
});

test('position refuses while the menu is hidden or the rects are missing', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({ left: 500, top: 400, width: 100, height: 50, bottom: 450 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  assert.equal(api.position(anchor), false);
  assert.deepEqual(menuElement.style, {});

  menuElement.classList.add('is-visible');
  anchor.rect = null;
  assert.equal(api.position(anchor), false);

  anchor.rect = { left: 500, top: 400, width: 100, height: 50, bottom: 450 };
  menuElement.rect = null;
  assert.equal(api.position(anchor), false);

  menuElement.rect = { width: 200, height: 100 };
  assert.equal(api.position(), false);
  assert.equal(api.position(null), false);
});

test('position centres the menu above the anchor', () => {
  const menuElement = makeMenuElement();
  menuElement.classList.add('is-visible');
  const anchor = makeAnchor({ left: 500, top: 400, width: 100, height: 50, bottom: 450 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
  });
  assert.equal(api.position(anchor), true);
  assert.equal(menuElement.style.left, '450px');
  assert.equal(menuElement.style.top, '290px');
  assert.equal(menuElement.classList.contains('opens-downward'), false);
});

test('position flips the menu below the anchor when there is no room above', () => {
  const menuElement = makeMenuElement();
  menuElement.classList.add('is-visible');
  const anchor = makeAnchor({ left: 500, top: 20, width: 100, height: 50, bottom: 70 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
  });
  assert.equal(api.position(anchor), true);
  assert.equal(menuElement.style.left, '450px');
  assert.equal(menuElement.style.top, '80px');
  assert.equal(menuElement.classList.contains('opens-downward'), true);
});

test('position clamps the menu to the bottom of the viewport', () => {
  const menuElement = makeMenuElement();
  menuElement.classList.add('is-visible');
  const anchor = makeAnchor({ left: 500, top: 115, width: 100, height: 50, bottom: 165 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow({ innerHeight: 250 }),
  });
  assert.equal(api.position(anchor), true);
  assert.equal(menuElement.style.top, '140px');
  assert.equal(menuElement.classList.contains('opens-downward'), true);
});

test('position clamps the menu to the viewport edges', () => {
  const menuElement = makeMenuElement();
  menuElement.classList.add('is-visible');
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
  });
  assert.equal(api.position(makeAnchor({ left: 0, top: 400, width: 0, height: 50, bottom: 450 })), true);
  assert.equal(menuElement.style.left, '10px');
  assert.equal(api.position(makeAnchor({ left: 1000, top: 400, width: 100, height: 50, bottom: 450 })), true);
  assert.equal(menuElement.style.left, '814px');
});

test('position falls back to a default viewport size', () => {
  const menuElement = makeMenuElement();
  menuElement.classList.add('is-visible');
  const anchor = makeAnchor({ left: 500, top: 400, width: 100, height: 50, bottom: 450 });
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow({ innerWidth: 0, innerHeight: 0 }),
  });
  assert.equal(api.position(anchor), true);
  assert.equal(menuElement.style.left, '450px');
  assert.equal(menuElement.style.top, '290px');
  assert.equal(api.position(makeAnchor({ left: 1000, top: 400, width: 100, height: 50, bottom: 450 })), true);
  assert.equal(menuElement.style.left, '814px');

  const bareElement = makeMenuElement();
  bareElement.classList.add('is-visible');
  const bareApi = createWorkspaceMediaHistoryMenuController({
    menuElement: bareElement,
    windowObject: null,
  });
  assert.equal(bareApi.position(anchor), true);
  assert.equal(bareElement.style.left, '450px');
  assert.equal(bareElement.style.top, '290px');
});

test('refresh restores the scroll position and the focus', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const anchor = makeAnchor({ left: 500, top: 400, width: 100, height: 50, bottom: 450 });
  const focused = [];
  const focusTarget = { focus: () => focused.push('target') };
  const lists = [];
  menuElement.querySelector = (selector) => {
    if (selector === '#target') return focusTarget;
    if (selector !== '.story-media-history-list') return null;
    const list = {
      scrollLeft: lists.length === 0 ? 40 : 0,
      scrollTop: lists.length === 0 ? 12 : 0,
    };
    lists.push(list);
    return list;
  };
  const inner = { id: 'inner' };
  menuElement.ownerDocument = { activeElement: inner };
  menuElement.contains = (node) => node === inner;
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  assert.equal(api.refresh({ anchor, focusSelector: '#target' }), true);
  assert.equal(lists.length, 2);
  assert.equal(lists[0].scrollLeft, 40);
  assert.equal(lists[1].scrollLeft, 40);
  assert.equal(lists[1].scrollTop, 12);
  assert.deepEqual(focused, ['target']);
  assert.equal(windowObject.frames.length, 1);

  windowObject.frames[0]();
  assert.equal(lists.length, 3);
  assert.equal(lists[2].scrollLeft, 40);
  assert.equal(lists[2].scrollTop, 12);
});

test('refresh skips the focus work when nothing inside was focused', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({});
  const focused = [];
  menuElement.querySelector = (selector) =>
    selector === '.story-media-history-list' ? { scrollLeft: 5, scrollTop: 6 } : null;
  menuElement.ownerDocument = { activeElement: { id: 'outside' } };
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  assert.equal(api.refresh({ anchor, focusSelector: '#target' }), true);
  assert.deepEqual(focused, []);
});

test('refresh clamps a negative stored scroll position', () => {
  const menuElement = makeMenuElement();
  const lists = [];
  menuElement.querySelector = (selector) => {
    if (selector !== '.story-media-history-list') return null;
    const list = { scrollLeft: lists.length === 0 ? -30 : 0, scrollTop: lists.length === 0 ? -8 : 0 };
    lists.push(list);
    return list;
  };
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  api.refresh({ anchor: makeAnchor({}) });
  assert.ok(lists[1].scrollLeft === 0);
  assert.ok(lists[1].scrollTop === 0);
});

test('refresh stops restoring once the menu is hidden', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const anchor = makeAnchor({});
  const lists = [];
  menuElement.querySelector = (selector) => {
    if (selector !== '.story-media-history-list') return null;
    const list = { scrollLeft: 40, scrollTop: 12 };
    lists.push(list);
    return list;
  };
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.refresh({ anchor });
  assert.equal(windowObject.frames.length, 1);
  api.hide();
  windowObject.frames[0]();
  assert.equal(lists.length, 2);
});

test('refresh falls back to the fallback focus when the menu cannot show', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({});
  const fallback = [];
  const inner = { id: 'inner' };
  menuElement.ownerDocument = { activeElement: inner };
  menuElement.contains = (node) => node === inner;
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '',
  });
  assert.equal(
    api.refresh({
      anchor,
      fallbackFocus: { focus: () => fallback.push('fallback') },
    }),
    false,
  );
  assert.deepEqual(fallback, ['fallback']);
  assert.equal(menuElement.classList.contains('is-visible'), false);

  menuElement.contains = () => false;
  assert.equal(api.refresh({ fallbackFocus: { focus: () => fallback.push('again') } }), false);
  assert.deepEqual(fallback, ['fallback']);
});

test('refresh defaults the anchor to the current one', () => {
  const menuElement = makeMenuElement();
  const anchorA = makeAnchor({});
  const anchorB = makeAnchor({});
  const seen = [];
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: (target) => {
      seen.push(target);
      return '<div>x</div>';
    },
  });
  api.show(anchorA);
  assert.equal(api.refresh(), true);
  assert.deepEqual(seen, [anchorA, anchorA]);
  api.refresh({ anchor: anchorB });
  assert.equal(seen[2], anchorB);
  assert.equal(api.getAnchor(), anchorB);
  api.hide();
  assert.equal(api.refresh(), false);
});

test('wheel scrolls the horizontal list and consumes the event', () => {
  const menuElement = makeMenuElement();
  const scroller = { scrollWidth: 500, clientWidth: 200, scrollLeft: 50 };
  menuElement.contains = (node) => node === scroller;
  createWorkspaceMediaHistoryMenuController({ menuElement, windowObject: makeWindow() });
  const consumed = [];
  const event = {
    target: { closest: (selector) => (selector.includes('.story-media-history-list') ? scroller : null) },
    deltaX: 40,
    deltaY: 5,
    preventDefault: () => consumed.push('prevent'),
    stopPropagation: () => consumed.push('stop'),
  };
  assert.equal(fire(menuElement, 'wheel', event), true);
  assert.equal(scroller.scrollLeft, 90);
  assert.deepEqual(consumed, ['prevent', 'stop']);
});

test('wheel prefers the dominant delta axis', () => {
  const menuElement = makeMenuElement();
  const scroller = { scrollWidth: 500, clientWidth: 200, scrollLeft: 50 };
  menuElement.contains = () => true;
  createWorkspaceMediaHistoryMenuController({ menuElement, windowObject: makeWindow() });
  const base = { target: { closest: () => scroller }, preventDefault() {}, stopPropagation() {} };
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaX: 10, deltaY: -50 }), true);
  assert.ok(scroller.scrollLeft === 0);
  scroller.scrollLeft = 50;
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaX: 500, deltaY: 30 }), true);
  assert.equal(scroller.scrollLeft, 300);
});

test('wheel stops at the scroll edges', () => {
  const menuElement = makeMenuElement();
  const scroller = { scrollWidth: 500, clientWidth: 200, scrollLeft: 290 };
  menuElement.contains = () => true;
  createWorkspaceMediaHistoryMenuController({ menuElement, windowObject: makeWindow() });
  const consumed = [];
  const base = {
    target: { closest: () => scroller },
    preventDefault: () => consumed.push('prevent'),
    stopPropagation: () => consumed.push('stop'),
  };
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaY: 40 }), true);
  assert.equal(scroller.scrollLeft, 300);
  assert.deepEqual(consumed, ['prevent', 'stop']);

  scroller.scrollLeft = 0;
  consumed.length = 0;
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaY: -40 }), false);
  assert.ok(scroller.scrollLeft === 0);
  assert.deepEqual(consumed, []);
});

test('wheel ignores events outside the list or without overflow', () => {
  const menuElement = makeMenuElement();
  const inside = { scrollWidth: 500, clientWidth: 200, scrollLeft: 50 };
  const outside = { scrollWidth: 500, clientWidth: 200, scrollLeft: 50 };
  menuElement.contains = (node) => node === inside;
  createWorkspaceMediaHistoryMenuController({ menuElement, windowObject: makeWindow() });
  const payload = { deltaX: 40, deltaY: 0, preventDefault() {}, stopPropagation() {} };
  assert.equal(fire(menuElement, 'wheel', { ...payload, target: {} }), false);
  assert.equal(fire(menuElement, 'wheel', { ...payload, target: { closest: () => null } }), false);
  assert.equal(fire(menuElement, 'wheel', { ...payload, target: { closest: () => outside } }), false);
  assert.equal(outside.scrollLeft, 50);

  const tight = { scrollWidth: 100, clientWidth: 200, scrollLeft: 10 };
  const flat = { scrollWidth: 200, clientWidth: 200, scrollLeft: 10 };
  menuElement.contains = () => true;
  assert.equal(fire(menuElement, 'wheel', { ...payload, target: { closest: () => tight } }), false);
  assert.equal(fire(menuElement, 'wheel', { ...payload, target: { closest: () => flat } }), false);
  assert.equal(
    fire(menuElement, 'wheel', {
      ...payload,
      target: { closest: () => ({ scrollLeft: 10 }) },
    }),
    false,
  );
});

test('wheel ignores a zero or unusable delta', () => {
  const menuElement = makeMenuElement();
  const scroller = { scrollWidth: 500, clientWidth: 200, scrollLeft: 50 };
  menuElement.contains = () => true;
  createWorkspaceMediaHistoryMenuController({ menuElement, windowObject: makeWindow() });
  const base = {
    target: { closest: () => scroller },
    preventDefault() {
      throw new Error('should not be consumed');
    },
    stopPropagation() {
      throw new Error('should not be consumed');
    },
  };
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaX: 0, deltaY: 0 }), false);
  assert.equal(fire(menuElement, 'wheel', { ...base }), false);
  assert.equal(fire(menuElement, 'wheel', { ...base, deltaX: 'nope', deltaY: Number.NaN }), false);
  assert.equal(scroller.scrollLeft, 50);
});

test('pointerenter cancels the pending hide and pointerleave schedules one', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(makeAnchor({}));
  api.hide({ delayed: true });
  assert.equal(windowObject.pending.length, 1);
  fire(menuElement, 'pointerenter', {});
  assert.deepEqual(windowObject.cleared, [1]);
  assert.equal(windowObject.pending[0], null);
  assert.equal(menuElement.classList.contains('is-visible'), true);

  fire(menuElement, 'pointerleave', {});
  assert.equal(windowObject.pending.length, 2);
  assert.equal(windowObject.pending[1].delay, 120);
  windowObject.pending[1].fn();
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
});

test('destroy hides the menu, clears the timer and removes the listeners', () => {
  const menuElement = makeMenuElement();
  const windowObject = makeWindow();
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject,
    getMarkup: () => '<div>x</div>',
  });
  api.show(makeAnchor({}));
  api.hide({ delayed: true });
  api.destroy();
  assert.deepEqual(windowObject.cleared, [1]);
  assert.equal(menuElement.classList.contains('is-visible'), false);
  assert.equal(menuElement.attributes['aria-hidden'], 'true');
  assert.equal(api.getAnchor(), null);
  assert.deepEqual(menuElement.listeners.get('pointerenter'), []);
  assert.deepEqual(menuElement.listeners.get('pointerleave'), []);
  assert.deepEqual(menuElement.listeners.get('wheel'), []);
  assert.doesNotThrow(() => api.destroy());
});

test('the controller can show again after destroy', () => {
  const menuElement = makeMenuElement();
  const anchor = makeAnchor({});
  const api = createWorkspaceMediaHistoryMenuController({
    menuElement,
    windowObject: makeWindow(),
    getMarkup: () => '<div>x</div>',
  });
  api.show(anchor);
  api.destroy();
  assert.equal(api.show(anchor), true);
  assert.equal(menuElement.classList.contains('is-visible'), true);
  assert.equal(menuElement.attributes['aria-hidden'], 'false');
});
