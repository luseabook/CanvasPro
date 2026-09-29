import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_MARQUEE_DRAG_THRESHOLD,
  hasWorkspaceMarqueeDrag,
  createWorkspaceMarqueeRect,
  doesWorkspaceMarqueeIntersect,
  resolveWorkspaceMarqueeSelection,
  createWorkspaceMarqueeSelectionController,
} from './workspaceMarqueeSelection.js';

function classList(names = []) {
  const set = new Set(names);
  const calls = [];
  return {
    calls,
    add(name) {
      calls.push(['add', name]);
      set.add(name);
    },
    remove(name) {
      calls.push(['remove', name]);
      set.delete(name);
    },
    toggle(name, force) {
      const on = force === undefined ? !set.has(name) : Boolean(force);
      calls.push(['toggle', name, on]);
      if (on) set.add(name);
      else set.delete(name);
      return on;
    },
    has: (name) => set.has(name),
    values: () => [...set],
  };
}

function makeRoot({ items = [], contains = () => true } = {}) {
  const calls = [];
  return {
    calls,
    classList: classList(),
    contains: (element) => contains(element),
    appendChild(element) {
      calls.push(['appendChild', element]);
      return element;
    },
    querySelectorAll(selector) {
      calls.push(['querySelectorAll', selector]);
      return items;
    },
    setPointerCapture(pointerId) {
      calls.push(['setPointerCapture', pointerId]);
    },
    hasPointerCapture(pointerId) {
      return calls.some((call) => call[0] === 'setPointerCapture' && call[1] === pointerId);
    },
    releasePointerCapture(pointerId) {
      calls.push(['releasePointerCapture', pointerId]);
    },
  };
}

function makeDocument() {
  const created = [];
  return {
    created,
    createElement(tagName) {
      const element = {
        tagName: String(tagName).toUpperCase(),
        className: '',
        style: {},
        attributes: {},
        classList: classList(),
        removed: false,
      };
      element.setAttribute = (name, value) => {
        element.attributes[name] = value;
      };
      element.remove = () => {
        element.removed = true;
      };
      created.push(element);
      return element;
    },
  };
}

function makeWindow() {
  const listeners = [];
  const timers = [];
  return {
    listeners,
    timers,
    addEventListener(type, handler, capture) {
      listeners.push({ type, handler, capture, removed: false });
    },
    removeEventListener(type, handler) {
      const entry = listeners.find((item) => item.type === type && item.handler === handler && !item.removed);
      if (entry) entry.removed = true;
    },
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
  };
}

function makeRect(over = {}) {
  return { left: 0, top: 0, right: 100, bottom: 100, ...over };
}

function makeSurface({ items = [], rect = makeRect() } = {}) {
  const queries = [];
  return {
    rect,
    items,
    queries,
    getBoundingClientRect: () => rect,
    querySelectorAll(selector) {
      queries.push(selector);
      return items;
    },
  };
}

function makeItem(id, rect = makeRect({ left: 0, top: 0, right: 10, bottom: 10 })) {
  return {
    id,
    rect,
    classList: classList(),
    getBoundingClientRect: () => rect,
  };
}

function target(selectors) {
  return { closest: (selector) => (selector in selectors ? selectors[selector] : null) };
}

function pointerEvent(over = {}) {
  return Object.assign(
    {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      target: target({}),
      prevented: 0,
      stopped: 0,
      preventDefault() {
        this.prevented += 1;
      },
      stopPropagation() {
        this.stopped += 1;
      },
    },
    over,
  );
}

function buildController(over = {}) {
  const items = over.items || [];
  const surface = 'surface' in over ? over.surface : makeSurface({ items });
  const root =
    'root' in over
      ? over.root
      : makeRoot({ items, contains: 'contains' in over ? over.contains : () => true });
  const documentObject = 'document' in over ? over.document : makeDocument();
  const windowObject = 'window' in over ? over.window : makeWindow();
  const controller = createWorkspaceMarqueeSelectionController({
    root,
    documentObject,
    windowObject,
    getConfig: 'getConfig' in over ? over.getConfig : () => ({ enabled: true, commit() {} }),
    surfaceSelector: 'surfaceSelector' in over ? over.surfaceSelector : '.surface',
    resolveSurface: 'resolveSurface' in over ? over.resolveSurface : null,
    blockedControlSelector: 'blockedControlSelector' in over ? over.blockedControlSelector : '',
    overlayClassName: 'overlayClassName' in over ? over.overlayClassName : '',
    itemSelector: 'itemSelector' in over ? over.itemSelector : '.item',
    getItemId: 'getItemId' in over ? over.getItemId : (element) => element.id,
    hitClassName: 'hitClassName' in over ? over.hitClassName : 'is-marquee-hit',
    rootClassName: 'rootClassName' in over ? over.rootClassName : 'is-marquee-selecting',
    dragThreshold: 'dragThreshold' in over ? over.dragThreshold : WORKSPACE_MARQUEE_DRAG_THRESHOLD,
    onActivate: 'onActivate' in over ? over.onActivate : null,
    onCommit: 'onCommit' in over ? over.onCommit : null,
  });
  return { controller, root, documentObject, windowObject, surface, items };
}

/* ------------------------------------------------------------------ */
/* hasWorkspaceMarqueeDrag                                            */
/* ------------------------------------------------------------------ */

test('exposes the default drag threshold constant', () => {
  assert.equal(WORKSPACE_MARQUEE_DRAG_THRESHOLD, 5);
});

test('measures the pointer travel against the default threshold', () => {
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 3, 4), true);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 4, 4), true);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 5, 0), true);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 0, 4), false);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 4.99, 0), false);
  assert.equal(hasWorkspaceMarqueeDrag(10, 10, 6, 10), false);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 0, 0), false);
});

test('honours an explicit drag threshold', () => {
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 10, 0, 10), true);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 10, 0, 11), false);
  assert.equal(hasWorkspaceMarqueeDrag(0, 0, 1, 0, 1.5), false);
});

test('treats a nullish, blank or negative threshold as zero', () => {
  for (const threshold of [null, 0, -5, NaN, 'x', '']) {
    assert.equal(hasWorkspaceMarqueeDrag(0, 0, 0, 0, threshold), true);
  }
});

test('normalizes non numeric coordinates to zero', () => {
  assert.equal(hasWorkspaceMarqueeDrag(NaN, NaN, NaN, NaN), false);
  assert.equal(hasWorkspaceMarqueeDrag(null, undefined, 0, 0), false);
  assert.equal(hasWorkspaceMarqueeDrag('x', 'y', 5, 0), true);
  assert.equal(hasWorkspaceMarqueeDrag('', '', '10', '0'), true);
});

/* ------------------------------------------------------------------ */
/* createWorkspaceMarqueeRect                                         */
/* ------------------------------------------------------------------ */

test('normalizes a rect from two opposite corners', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(10, 20, 5, 8), {
    left: 5,
    top: 8,
    right: 10,
    bottom: 20,
    width: 5,
    height: 12,
  });
});

test('produces the same rect whichever corner is passed first', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(5, 8, 10, 20), createWorkspaceMarqueeRect(10, 20, 5, 8));
});

test('returns a zero area rect when both corners coincide', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(4, 4, 4, 4), {
    left: 4,
    top: 4,
    right: 4,
    bottom: 4,
    width: 0,
    height: 0,
  });
});

test('normalizes blank and non numeric corners to zero', () => {
  const zeroRect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  assert.deepEqual(createWorkspaceMarqueeRect(NaN, undefined, '', null), zeroRect);
  assert.deepEqual(createWorkspaceMarqueeRect('  ', {}, [], false), zeroRect);
});

test('keeps fractional pixel corners exactly', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(0.5, 0.25, 3.75, 2.5), {
    left: 0.5,
    top: 0.25,
    right: 3.75,
    bottom: 2.5,
    width: 3.25,
    height: 2.25,
  });
});

test('reports a negative zero corner as zero', () => {
  const rect = createWorkspaceMarqueeRect(-0, -0, -0, -0);
  assert.ok(rect.left === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0);
  assert.ok(rect.width === 0 && rect.height === 0);
});

test('clamps a rect into the given bounds', () => {
  const bounds = { left: 0, top: 0, right: 100, bottom: 100 };
  assert.deepEqual(createWorkspaceMarqueeRect(-50, -50, 200, 200, bounds), {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
  });
  assert.deepEqual(createWorkspaceMarqueeRect(50, 50, 20, 20, bounds), {
    left: 20,
    top: 20,
    right: 50,
    bottom: 50,
    width: 30,
    height: 30,
  });
});

test('clamps only the edges that leave the bounds', () => {
  const bounds = { left: 0, top: 0, right: 30, bottom: 30 };
  assert.deepEqual(createWorkspaceMarqueeRect(50, 50, 20, 20, bounds), {
    left: 20,
    top: 20,
    right: 30,
    bottom: 30,
    width: 10,
    height: 10,
  });
  assert.deepEqual(createWorkspaceMarqueeRect(-10, -10, 10, 10, bounds), {
    left: 0,
    top: 0,
    right: 10,
    bottom: 10,
    width: 10,
    height: 10,
  });
});

test('collapses an inverted bounds rect instead of mirroring it', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(5, 5, 10, 10, { left: 100, top: 0, right: 0, bottom: 0 }), {
    left: 100,
    top: 0,
    right: 100,
    bottom: 0,
    width: 0,
    height: 0,
  });
});

test('clamps everything to zero for bounds without any edge', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(5, 5, 10, 10, {}), {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  });
});

test('ignores falsy bounds', () => {
  const expected = { left: -5, top: -5, right: 5, bottom: 5, width: 10, height: 10 };
  for (const bounds of [null, undefined, 0, false, '']) {
    assert.deepEqual(createWorkspaceMarqueeRect(-5, -5, 5, 5, bounds), expected);
  }
});

test('normalizes non numeric bounds edges', () => {
  assert.deepEqual(createWorkspaceMarqueeRect(5, 5, 10, 10, { left: NaN, top: 0, right: 10, bottom: 10 }), {
    left: 5,
    top: 5,
    right: 10,
    bottom: 10,
    width: 5,
    height: 5,
  });
});

test('does not mutate the bounds object', () => {
  const bounds = { left: 0, top: 0, right: 2, bottom: 2 };
  createWorkspaceMarqueeRect(5, 5, 6, 6, bounds);
  assert.deepEqual(bounds, { left: 0, top: 0, right: 2, bottom: 2 });
});

/* ------------------------------------------------------------------ */
/* doesWorkspaceMarqueeIntersect                                      */
/* ------------------------------------------------------------------ */

test('reports no intersection when either rect is missing', () => {
  const rect = { left: 0, top: 0, right: 1, bottom: 1 };
  assert.equal(doesWorkspaceMarqueeIntersect(null, rect), false);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, null), false);
  assert.equal(doesWorkspaceMarqueeIntersect(undefined, undefined), false);
  assert.equal(doesWorkspaceMarqueeIntersect(), false);
});

test('intersects when the rects overlap', () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 5, top: 5, right: 15, bottom: 15 }), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: -5, top: -5, right: 5, bottom: 5 }), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 2, top: -20, right: 4, bottom: 30 }), true);
});

test('counts touching edges as an intersection', () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 10, top: 10, right: 20, bottom: 20 }), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: -10, top: 0, right: 0, bottom: 10 }), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 0, top: -10, right: 10, bottom: 0 }), true);
});

test('rejects a rect separated on any single axis', () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 11, top: 0, right: 20, bottom: 10 }), false);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: -20, top: 0, right: -1, bottom: 10 }), false);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 0, top: 11, right: 10, bottom: 20 }), false);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 0, top: -20, right: 10, bottom: -1 }), false);
});

test('normalizes missing and non numeric edges to zero', () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(doesWorkspaceMarqueeIntersect(rect, {}), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: NaN, top: NaN, right: NaN, bottom: NaN }), true);
  assert.equal(doesWorkspaceMarqueeIntersect({ left: NaN, top: NaN, right: NaN, bottom: NaN }, {}), true);
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 20, top: 'x', right: 'x', bottom: 'x' }), false);
});

test('compares fractional edges exactly', () => {
  const rect = { left: 0.5, top: 0.5, right: 1.5, bottom: 1.5 };
  assert.equal(doesWorkspaceMarqueeIntersect(rect, { left: 1.5, top: 1.5, right: 2.5, bottom: 2.5 }), true);
  assert.equal(
    doesWorkspaceMarqueeIntersect(rect, { left: 1.5000001, top: 1.5, right: 2.5, bottom: 2.5 }),
    false,
  );
});

test('does not mutate the rects it compares', () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  const item = { left: 5, top: 5, right: 20, bottom: 20 };
  doesWorkspaceMarqueeIntersect(rect, item);
  assert.deepEqual(rect, { left: 0, top: 0, right: 10, bottom: 10 });
  assert.deepEqual(item, { left: 5, top: 5, right: 20, bottom: 20 });
});

/* ------------------------------------------------------------------ */
/* resolveWorkspaceMarqueeSelection                                   */
/* ------------------------------------------------------------------ */

test('returns an empty selection without any ids', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection(), []);
  assert.deepEqual(resolveWorkspaceMarqueeSelection([], []), []);
});

test('trims, stringifies and deduplicates the hit ids', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection([' a ', 'b', '', 'a', null, undefined, 3, 0, false]), [
    'a',
    'b',
    '3',
    '0',
    'false',
  ]);
});

test('keeps only the existing selection when the hit list is not an array', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection('nope', ['a'], { additive: true }), ['a']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection(null, ['a'], { additive: true }), ['a']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection('nope'), []);
  assert.deepEqual(resolveWorkspaceMarqueeSelection('nope', ['a']), []);
});

test('ignores the existing selection unless additive', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], ['a', 'b']), ['c']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], ['a', 'b'], { additive: true }), ['a', 'b', 'c']);
});

test('keeps the existing ids first and drops duplicates when additive', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['b', 'c'], [' a ', 'b', ''], { additive: true }), [
    'a',
    'b',
    'c',
  ]);
});

test('accepts a truthy additive flag but still needs an array selection', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], ['a'], { additive: 1 }), ['a', 'c']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], 'nope', { additive: true }), ['c']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], null, { additive: true }), ['c']);
});

test('treats an absent additive flag as false', () => {
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], ['a'], { additive: undefined }), ['c']);
  assert.deepEqual(resolveWorkspaceMarqueeSelection(['c'], ['a'], {}), ['c']);
});

test('throws when the options bag is null', () => {
  assert.throws(() => resolveWorkspaceMarqueeSelection([], [], null), TypeError);
});

test('does not mutate the id lists it resolves', () => {
  const hits = [' a '];
  const existing = ['b'];
  assert.deepEqual(resolveWorkspaceMarqueeSelection(hits, existing, { additive: true }), ['b', 'a']);
  assert.deepEqual(hits, [' a ']);
  assert.deepEqual(existing, ['b']);
});

/* ------------------------------------------------------------------ */
/* createWorkspaceMarqueeSelectionController - construction           */
/* ------------------------------------------------------------------ */

test('throws when the controller dependencies are incomplete', () => {
  const message = /dependencies are incomplete/;
  assert.throws(() => createWorkspaceMarqueeSelectionController(), message);
  assert.throws(() => createWorkspaceMarqueeSelectionController({}), message);
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        documentObject: {},
        windowObject: {},
        getConfig: () => ({}),
      }),
    message,
  );
  assert.throws(
    () => createWorkspaceMarqueeSelectionController({ root: {}, windowObject: {}, getConfig: () => ({}) }),
    message,
  );
  assert.throws(
    () => createWorkspaceMarqueeSelectionController({ root: {}, documentObject: {}, getConfig: () => ({}) }),
    message,
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        root: {},
        documentObject: {},
        windowObject: {},
        getConfig: 'nope',
      }),
    message,
  );
});

test('throws when the required selectors or id reader are missing', () => {
  const base = { root: {}, documentObject: {}, windowObject: {}, getConfig: () => ({}) };
  assert.throws(
    () => createWorkspaceMarqueeSelectionController({ ...base, itemSelector: '.item', getItemId: () => 'a' }),
    /surfaceSelector is required/,
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        ...base,
        surfaceSelector: '   ',
        itemSelector: '.item',
        getItemId: () => 'a',
      }),
    /surfaceSelector is required/,
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        ...base,
        surfaceSelector: '.surface',
        getItemId: () => 'a',
      }),
    /itemSelector and getItemId are required/,
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        ...base,
        surfaceSelector: '.surface',
        itemSelector: ' .item ',
      }),
    /itemSelector and getItemId are required/,
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        ...base,
        surfaceSelector: '.surface',
        itemSelector: '.item',
        getItemId: 'nope',
      }),
    /itemSelector and getItemId are required/,
  );
});

test('exposes the controller api without starting a session', () => {
  const { controller } = buildController({ items: [] });
  assert.deepEqual(Object.keys(controller).sort(), [
    'begin',
    'cancel',
    'consumeClick',
    'destroy',
    'finish',
    'update',
  ]);
});

/* ------------------------------------------------------------------ */
/* begin                                                              */
/* ------------------------------------------------------------------ */

test('begin rejects anything that is not a primary mouse press', () => {
  const { controller, surface } = buildController({ items: [] });
  const surfTarget = target({ '.surface': surface });
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, button: 1 })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, button: undefined })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, button: 2 })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, isPrimary: false })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, pointerType: 'touch' })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, pointerType: 'pen' })), false);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget })), true);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, isPrimary: undefined })), true);
  assert.equal(controller.begin(pointerEvent({ target: surfTarget, pointerType: '' })), true);
});

test('begin resolves the surface through the closest selector', () => {
  const { controller, surface } = buildController({ items: [] });
  const seen = [];
  const event = pointerEvent({
    target: {
      closest: (selector) => {
        seen.push(selector);
        return surface;
      },
    },
  });
  assert.equal(controller.begin(event), true);
  assert.deepEqual(seen, ['.surface']);
});

test('begin refuses a target with no surface or a surface outside the root', () => {
  const { controller, surface } = buildController({ items: [] });
  assert.equal(controller.begin(pointerEvent({ target: target({}) })), false);
  const outside = buildController({ items: [], contains: () => false });
  assert.equal(
    outside.controller.begin(pointerEvent({ target: target({ '.surface': outside.surface }) })),
    false,
  );
  assert.equal(controller.begin(pointerEvent({ target: { closest: () => surface } })), true);
});

test('begin prefers the injected surface resolver', () => {
  const resolved = makeSurface({ items: [] });
  const seen = [];
  const { controller, surface } = buildController({
    items: [],
    resolveSurface: (event) => {
      seen.push(event);
      return resolved;
    },
  });
  const event = pointerEvent({ target: target({ '.surface': surface }) });
  assert.equal(controller.begin(event), true);
  assert.deepEqual(seen, [event]);
  assert.equal(controller.update(pointerEvent({ clientX: 40, clientY: 0 })), true);
  assert.deepEqual(resolved.queries, ['.item']);

  const missing = buildController({ items: [], resolveSurface: () => null });
  assert.equal(
    missing.controller.begin(pointerEvent({ target: target({ '.surface': missing.surface }) })),
    false,
  );
});

test('begin passes the resolved surface into the config factory', () => {
  const seen = [];
  const { controller, surface } = buildController({
    items: [],
    getConfig: (element) => {
      seen.push(element);
      return { enabled: true, commit() {} };
    },
  });
  controller.begin(pointerEvent({ target: target({ '.surface': surface }) }));
  assert.deepEqual(seen, [surface]);
});

test('begin rejects a config that cannot start a marquee', () => {
  const configs = [
    undefined,
    null,
    {},
    { enabled: false, commit() {} },
    { enabled: true },
    { enabled: true, commit: 'nope' },
    { enabled: true, commit() {}, canBegin: () => false },
  ];
  for (const config of configs) {
    const { controller, surface } = buildController({ items: [], getConfig: () => config });
    assert.equal(controller.begin(pointerEvent({ target: target({ '.surface': surface }) })), false);
  }
});

test('begin accepts a config whose canBegin does not return false', () => {
  const cases = [() => true, () => undefined, undefined, null];
  for (const canBegin of cases) {
    const { controller, surface } = buildController({
      items: [],
      getConfig: () => ({ enabled: true, commit() {}, canBegin }),
    });
    assert.equal(controller.begin(pointerEvent({ target: target({ '.surface': surface }) })), true);
  }
});

test('begin throws when the config canBegin is not callable', () => {
  const { controller, surface } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit() {}, canBegin: 'nope' }),
  });
  assert.throws(() => controller.begin(pointerEvent({ target: target({ '.surface': surface }) })), TypeError);
});

test('begin refuses a blocked control unless it is also an item', () => {
  const { controller, surface } = buildController({ items: [], blockedControlSelector: ' .blocked ' });
  const eventFor = (element) =>
    pointerEvent({ target: target({ '.surface': surface, '.blocked': element }) });
  assert.equal(controller.begin(eventFor({ matches: (selector) => selector === '.item' })), true);
  assert.equal(controller.begin(eventFor({ matches: () => false })), false);
  assert.equal(controller.begin(eventFor({})), false);
});

test('begin skips the blocked control check when no selector is configured', () => {
  const { controller, surface } = buildController({ items: [], blockedControlSelector: '' });
  const seen = [];
  const event = pointerEvent({
    target: {
      closest: (selector) => {
        seen.push(selector);
        return selector === '.surface' ? surface : null;
      },
    },
  });
  assert.equal(controller.begin(event), true);
  assert.deepEqual(seen, ['.surface']);
});

test('begin reads the blocked control selector from the config', () => {
  const { controller, surface } = buildController({
    items: [],
    blockedControlSelector: '.base-blocked',
    getConfig: () => ({ enabled: true, commit() {}, blockedControlSelector: ' .cfg-blocked ' }),
  });
  const seen = [];
  const event = pointerEvent({
    target: {
      closest: (selector) => {
        seen.push(selector);
        return selector === '.surface' ? surface : { matches: () => false };
      },
    },
  });
  assert.equal(controller.begin(event), false);
  assert.deepEqual(seen, ['.surface', '.cfg-blocked']);
});

test('begin starts a fresh session and replaces any previous one', () => {
  const { controller, surface, root, documentObject } = buildController({ items: [] });
  const start = (pointerId) =>
    pointerEvent({ pointerId, clientX: 0, clientY: 0, target: target({ '.surface': surface }) });
  controller.begin(start(6));
  controller.update(pointerEvent({ pointerId: 6, clientX: 30, clientY: 0 }));
  const firstOverlay = documentObject.created[0];
  assert.equal(controller.begin(start(7)), true);
  assert.equal(firstOverlay.removed, true);
  assert.equal(root.classList.has('is-marquee-selecting'), false);
  assert.ok(root.calls.some((call) => call[0] === 'releasePointerCapture' && call[1] === 6));
  assert.equal(controller.update(pointerEvent({ pointerId: 6, clientX: 50, clientY: 0 })), false);
  assert.equal(controller.update(pointerEvent({ pointerId: 7, clientX: 50, clientY: 0 })), true);
});

test('begin normalizes the start coordinates', () => {
  const { controller, surface, documentObject } = buildController({ items: [] });
  controller.begin(pointerEvent({ clientX: 'x', clientY: NaN, target: target({ '.surface': surface }) }));
  assert.equal(controller.update(pointerEvent({ clientX: 5, clientY: 0 })), true);
  assert.deepEqual(documentObject.created[0].style, {
    left: '0px',
    top: '0px',
    width: '5px',
    height: '0px',
  });
});

/* ------------------------------------------------------------------ */
/* update                                                             */
/* ------------------------------------------------------------------ */

test('update ignores unknown pointers and sessions', () => {
  const { controller, surface } = buildController({ items: [] });
  assert.equal(controller.update(pointerEvent({ pointerId: 7 })), false);
  controller.begin(pointerEvent({ pointerId: 7, target: target({ '.surface': surface }) }));
  assert.equal(controller.update(pointerEvent({ pointerId: 8, clientX: 50 })), false);
  assert.equal(controller.update(pointerEvent({ pointerId: 7, clientX: 50, clientY: 0 })), true);
});

test('update waits for the default five pixel threshold', () => {
  const { controller, surface, documentObject } = buildController({ items: [] });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  const short = pointerEvent({ clientX: 4, clientY: 0 });
  assert.equal(controller.update(short), false);
  assert.deepEqual(documentObject.created, []);
  assert.equal(short.prevented, 0);
  assert.equal(controller.update(pointerEvent({ clientX: 5, clientY: 0 })), true);
});

test('update activates the overlay exactly once', () => {
  const activated = [];
  const items = [
    makeItem('a', makeRect({ left: 0, top: 0, right: 10, bottom: 10 })),
    makeItem('b', makeRect({ left: 50, top: 50, right: 60, bottom: 60 })),
  ];
  const { controller, root, documentObject, surface } = buildController({
    items,
    onActivate: () => activated.push('activate'),
  });
  controller.begin(pointerEvent({ clientX: 1, clientY: 1, target: target({ '.surface': surface }) }));
  const move = pointerEvent({ clientX: 6, clientY: 1 });
  assert.equal(controller.update(move), true);
  assert.equal(controller.update(pointerEvent({ clientX: 7, clientY: 1 })), true);
  assert.deepEqual(activated, ['activate']);
  assert.equal(documentObject.created.length, 1);
  assert.deepEqual(root.classList.values(), ['is-marquee-selecting']);
  assert.ok(root.calls.some((call) => call[0] === 'setPointerCapture' && call[1] === 1));
  assert.equal(move.prevented, 1);
  assert.equal(move.stopped, 1);
  assert.deepEqual(items[0].classList.values(), ['is-marquee-hit']);
  assert.deepEqual(items[1].classList.values(), []);
  assert.equal(items[0].classList.calls.filter((call) => call[0] === 'toggle').length, 2);
});

test('update creates the overlay with the default class and aria attribute', () => {
  const { controller, surface, documentObject, root } = buildController({ items: [] });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 9, clientY: 0 }));
  const overlay = documentObject.created[0];
  assert.equal(overlay.tagName, 'DIV');
  assert.equal(overlay.className, '');
  assert.deepEqual(overlay.attributes, { 'aria-hidden': 'true' });
  assert.deepEqual(overlay.style, { left: '0px', top: '0px', width: '9px', height: '0px' });
  assert.deepEqual(
    root.calls.filter((call) => call[0] === 'appendChild'),
    [['appendChild', overlay]],
  );
});

test('update joins the base and config overlay class names', () => {
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const { controller, surface, documentObject, root } = buildController({
    items: [item],
    overlayClassName: 'base-overlay',
    hitClassName: 'base-hit',
    rootClassName: 'base-root',
    getConfig: () => ({
      enabled: true,
      commit() {},
      overlayClassName: ' cfg-overlay ',
      hitClassName: ' cfg-hit ',
      rootClassName: ' cfg-root ',
    }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.equal(documentObject.created[0].className, 'base-overlay cfg-overlay');
  assert.equal(item.classList.has('cfg-hit'), true);
  assert.equal(root.classList.has('cfg-root'), true);
  assert.equal(root.classList.has('base-root'), false);
});

test('update skips the hit class when it is blank', () => {
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const { controller, surface, root, documentObject } = buildController({
    items: [item],
    hitClassName: '',
    rootClassName: '',
    overlayClassName: '',
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(item.classList.calls, []);
  assert.deepEqual(root.classList.calls, []);
  assert.equal(documentObject.created[0].className, '');
});

test('update clamps the overlay to the surface bounds', () => {
  const surface = makeSurface({ items: [], rect: makeRect({ left: 20, top: 30, right: 120, bottom: 130 }) });
  const { controller, documentObject } = buildController({ items: [], surface });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 60, clientY: 60 }));
  assert.deepEqual(documentObject.created[0].style, {
    left: '20px',
    top: '30px',
    width: '40px',
    height: '30px',
  });
});

test('update recomputes the hit class and ids on every move', () => {
  const item = makeItem('a', makeRect({ left: 50, top: 0, right: 60, bottom: 10 }));
  const { controller, surface } = buildController({ items: [item] });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 60, clientY: 5 }));
  assert.equal(item.classList.has('is-marquee-hit'), true);
  controller.update(pointerEvent({ clientX: 20, clientY: 5 }));
  assert.equal(item.classList.has('is-marquee-hit'), false);
});

test('update uses the config item selector and falls back when it is blank', () => {
  const surface = makeSurface({ items: [] });
  const withConfig = buildController({
    items: [],
    surface,
    getConfig: () => ({ enabled: true, commit() {}, itemSelector: '.other' }),
  });
  withConfig.controller.begin(pointerEvent({ target: target({ '.surface': surface }) }));
  withConfig.controller.update(pointerEvent({ clientX: 40, clientY: 0 }));
  assert.deepEqual(surface.queries, ['.other']);

  const blankConfig = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit() {}, itemSelector: '' }),
  });
  blankConfig.controller.begin(pointerEvent({ target: target({ '.surface': blankConfig.surface }) }));
  blankConfig.controller.update(pointerEvent({ clientX: 40, clientY: 0 }));
  assert.deepEqual(blankConfig.surface.queries, ['.item']);
});

test('update honours the config drag threshold and falls back when it is nullish', () => {
  const custom = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit() {}, dragThreshold: 20 }),
  });
  custom.controller.begin(pointerEvent({ target: target({ '.surface': custom.surface }) }));
  assert.equal(custom.controller.update(pointerEvent({ clientX: 19, clientY: 0 })), false);
  assert.equal(custom.controller.update(pointerEvent({ clientX: 20, clientY: 0 })), true);

  for (const dragThreshold of [null, undefined]) {
    const fallback = buildController({
      items: [],
      getConfig: () => ({ enabled: true, commit() {}, dragThreshold }),
    });
    fallback.controller.begin(pointerEvent({ target: target({ '.surface': fallback.surface }) }));
    assert.equal(fallback.controller.update(pointerEvent({ clientX: 4, clientY: 0 })), false);
    assert.equal(fallback.controller.update(pointerEvent({ clientX: 5, clientY: 0 })), true);
  }
});

test('update clamps a negative or non numeric config threshold to zero', () => {
  for (const dragThreshold of [-10, NaN, 'x']) {
    const { controller, surface } = buildController({
      items: [],
      getConfig: () => ({ enabled: true, commit() {}, dragThreshold }),
    });
    controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
    assert.equal(controller.update(pointerEvent({ clientX: 0, clientY: 0 })), true);
  }
});

test('update uses the controller drag threshold option', () => {
  const { controller, surface } = buildController({ items: [], dragThreshold: 20 });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  assert.equal(controller.update(pointerEvent({ clientX: 19, clientY: 0 })), false);
  assert.equal(controller.update(pointerEvent({ clientX: 20, clientY: 0 })), true);
});

test('update strips the hit class through the surface when the root cannot be queried', () => {
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const surface = makeSurface({ items: [item] });
  const root = makeRoot({ items: [item] });
  delete root.querySelectorAll;
  const { controller } = buildController({ items: [item], surface, root });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.equal(item.classList.has('is-marquee-hit'), true);
  assert.equal(controller.cancel(), true);
  assert.equal(item.classList.has('is-marquee-hit'), false);
  assert.deepEqual(surface.queries, ['.item', '.item']);
});

/* ------------------------------------------------------------------ */
/* finish                                                             */
/* ------------------------------------------------------------------ */

test('finish commits the resolved ids and cleans up', () => {
  const committed = [];
  const committedCallbacks = [];
  const items = [
    makeItem('a', makeRect({ left: 0, top: 0, right: 10, bottom: 10 })),
    makeItem('b', makeRect({ left: 50, top: 50, right: 60, bottom: 60 })),
  ];
  const { controller, surface, root, documentObject, windowObject } = buildController({
    items,
    getConfig: () => ({ enabled: true, selectedIds: ['z'], commit: (ids) => committed.push(ids) }),
    onCommit: (ids) => committedCallbacks.push(ids),
  });
  controller.begin(
    pointerEvent({ pointerId: 1, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  assert.equal(controller.update(pointerEvent({ pointerId: 1, clientX: 40, clientY: 40 })), true);
  const up = pointerEvent({ pointerId: 1, clientX: 40, clientY: 40 });
  assert.equal(controller.finish(up), true);
  assert.deepEqual(committed, [['a']]);
  assert.deepEqual(committedCallbacks, [['a']]);
  assert.equal(up.prevented, 2);
  assert.equal(up.stopped, 2);
  assert.equal(documentObject.created[0].removed, true);
  assert.equal(root.classList.has('is-marquee-selecting'), false);
  assert.deepEqual(items[0].classList.values(), []);
  assert.ok(root.calls.some((call) => call[0] === 'setPointerCapture' && call[1] === 1));
  assert.ok(root.calls.some((call) => call[0] === 'releasePointerCapture' && call[1] === 1));
  assert.deepEqual(
    windowObject.timers.map((timer) => timer.delay),
    [0],
  );
});

test('finish merges into the existing selection when additive', () => {
  const committed = [];
  const items = [
    makeItem('a', makeRect({ left: 0, top: 0, right: 10, bottom: 10 })),
    makeItem('b', makeRect({ left: 50, top: 50, right: 60, bottom: 60 })),
  ];
  const { controller, surface } = buildController({
    items,
    getConfig: () => ({ enabled: true, selectedIds: ['z', ' a '], commit: (ids) => committed.push(ids) }),
  });
  controller.begin(
    pointerEvent({
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      shiftKey: true,
      target: target({ '.surface': surface }),
    }),
  );
  controller.update(pointerEvent({ pointerId: 1, clientX: 40, clientY: 40 }));
  assert.equal(controller.finish(pointerEvent({ pointerId: 1, clientX: 40, clientY: 40 })), true);
  assert.deepEqual(committed, [['z', 'a']]);
});

test('finish reads additive mode from the config before the keyboard', () => {
  const cases = [
    [{ additive: true }, {}, ['z', 'a']],
    [{ additive: false }, { shiftKey: true }, ['a']],
    [{}, { shiftKey: true }, ['z', 'a']],
    [{}, { ctrlKey: true }, ['z', 'a']],
    [{}, { metaKey: true }, ['z', 'a']],
    [{}, { shiftKey: 1 }, ['a']],
  ];
  for (const [configExtra, eventExtra, expected] of cases) {
    const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
    const committed = [];
    const { controller, surface } = buildController({
      items: [item],
      getConfig: () => ({
        enabled: true,
        selectedIds: ['z'],
        commit: (ids) => committed.push(ids),
        ...configExtra,
      }),
    });
    controller.begin(
      pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }), ...eventExtra }),
    );
    controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
    controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
    assert.deepEqual(committed, [expected]);
  }
});

test('finish copies the config selection without mutating it', () => {
  const selectedIds = ['z'];
  const committed = [];
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const { controller, surface } = buildController({
    items: [item],
    getConfig: () => ({ enabled: true, selectedIds, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(
    pointerEvent({ clientX: 0, clientY: 0, shiftKey: true, target: target({ '.surface': surface }) }),
  );
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(committed, [['z', 'a']]);
  assert.deepEqual(selectedIds, ['z']);
});

test('finish ignores a non array config selection', () => {
  const committed = [];
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const { controller, surface } = buildController({
    items: [item],
    getConfig: () => ({ enabled: true, selectedIds: 'nope', commit: (ids) => committed.push(ids) }),
  });
  controller.begin(
    pointerEvent({ clientX: 0, clientY: 0, shiftKey: true, target: target({ '.surface': surface }) }),
  );
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(committed, [['a']]);
});

test('finish normalizes the ids reported by getItemId', () => {
  const covering = makeRect({ left: 0, top: 0, right: 100, bottom: 100 });
  const items = [
    makeItem(' a ', covering),
    makeItem('b', covering),
    makeItem('   ', covering),
    makeItem('', covering),
    makeItem(null, covering),
  ];
  const committed = [];
  const { controller, surface } = buildController({
    items,
    getItemId: (item) => item.id,
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(committed, [['a', 'b']]);
});

test('finish drops a falsy id reported by getItemId', () => {
  const covering = makeRect({ left: 0, top: 0, right: 100, bottom: 100 });
  const committed = [];
  const { controller, surface } = buildController({
    items: [makeItem(0, covering), makeItem(false, covering)],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(committed, [[]]);
});

test('finish falls back to the controller getItemId when the config provides none', () => {
  const covering = makeRect({ left: 0, top: 0, right: 100, bottom: 100 });
  const committed = [];
  const { controller, surface } = buildController({
    items: [makeItem('a', covering)],
    getConfig: () => ({ enabled: true, getItemId: 'nope', commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 40, clientY: 40 }));
  controller.finish(pointerEvent({ clientX: 40, clientY: 40 }));
  assert.deepEqual(committed, [['a']]);
});

test('finish does not activate a marquee that never passed the threshold', () => {
  const item = makeItem('a', makeRect({ left: 0, top: 0, right: 100, bottom: 100 }));
  const committed = [];
  const { controller, surface, documentObject } = buildController({
    items: [item],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  assert.equal(controller.update(pointerEvent({ clientX: 2, clientY: 0 })), false);
  assert.equal(controller.finish(pointerEvent({ clientX: 8, clientY: 0 })), false);
  assert.deepEqual(committed, []);
  assert.deepEqual(documentObject.created, []);
});

test('finish recomputes the hits from the final pointer position', () => {
  const items = [
    makeItem('a', makeRect({ left: 0, top: 0, right: 10, bottom: 10 })),
    makeItem('b', makeRect({ left: 30, top: 30, right: 40, bottom: 40 })),
  ];
  const committed = [];
  const { controller, surface } = buildController({
    items,
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  assert.equal(controller.update(pointerEvent({ clientX: 6, clientY: 6 })), true);
  assert.equal(controller.finish(pointerEvent({ clientX: 40, clientY: 40 })), true);
  assert.deepEqual(committed, [['a', 'b']]);
});

test('finish ignores an unknown pointer and leaves the session alive', () => {
  const committed = [];
  const { controller, surface } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  assert.equal(controller.finish(pointerEvent({ pointerId: 9 })), false);
  controller.begin(pointerEvent({ pointerId: 9, target: target({ '.surface': surface }) }));
  assert.equal(controller.finish(pointerEvent({ pointerId: 10, clientX: 50 })), false);
  assert.deepEqual(committed, []);
  assert.equal(controller.update(pointerEvent({ pointerId: 9, clientX: 50, clientY: 0 })), true);
});

test('finish without a drag cleans up without committing', () => {
  const committed = [];
  const { controller, surface, documentObject, root } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  const up = pointerEvent({ clientX: 1, clientY: 0 });
  assert.equal(controller.finish(up), false);
  assert.deepEqual(committed, []);
  assert.equal(up.prevented, 0);
  assert.equal(up.stopped, 0);
  assert.deepEqual(documentObject.created, []);
  assert.equal(root.classList.has('is-marquee-selecting'), false);
  assert.equal(controller.finish(up), false);
});

test('a cancelled finish drops the session without committing', () => {
  const committed = [];
  const { controller, surface, documentObject } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  controller.begin(
    pointerEvent({ pointerId: 4, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  controller.update(pointerEvent({ pointerId: 4, clientX: 30, clientY: 0 }));
  const up = pointerEvent({ pointerId: 4, clientX: 30, clientY: 0 });
  assert.equal(controller.finish(up, { cancelled: true }), false);
  assert.deepEqual(committed, []);
  assert.equal(up.prevented, 0);
  assert.equal(documentObject.created[0].removed, true);
});

/* ------------------------------------------------------------------ */
/* cancel                                                             */
/* ------------------------------------------------------------------ */

test('cancel drops the session without committing', () => {
  const committed = [];
  const { controller, surface, documentObject, root } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  assert.equal(controller.cancel(), false);
  controller.begin(
    pointerEvent({ pointerId: 3, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  controller.update(pointerEvent({ pointerId: 3, clientX: 30, clientY: 0 }));
  assert.equal(controller.cancel(), true);
  assert.deepEqual(committed, []);
  assert.equal(documentObject.created[0].removed, true);
  assert.equal(root.classList.has('is-marquee-selecting'), false);
  assert.equal(controller.cancel(), false);
});

test('cancel leaves a session that never activated untouched', () => {
  const { controller, surface, documentObject } = buildController({ items: [] });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  assert.equal(controller.cancel(), true);
  assert.deepEqual(documentObject.created, []);
  assert.equal(controller.update(pointerEvent({ clientX: 30, clientY: 0 })), false);
});

/* ------------------------------------------------------------------ */
/* consumeClick, listeners and destroy                                */
/* ------------------------------------------------------------------ */

test('consume click swallows exactly the click that follows a commit', () => {
  const { controller, surface } = buildController({ items: [] });
  const before = pointerEvent({});
  assert.equal(controller.consumeClick(before), false);
  assert.equal(before.prevented, 0);
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 30, clientY: 0 }));
  controller.finish(pointerEvent({ clientX: 30, clientY: 0 }));
  const after = pointerEvent({});
  assert.equal(controller.consumeClick(after), true);
  assert.equal(after.prevented, 1);
  assert.equal(after.stopped, 1);
  assert.equal(controller.consumeClick(pointerEvent({})), false);
});

test('consume click forgets the click once the deferred reset runs', () => {
  const { controller, surface, windowObject } = buildController({ items: [] });
  controller.begin(pointerEvent({ clientX: 0, clientY: 0, target: target({ '.surface': surface }) }));
  controller.update(pointerEvent({ clientX: 30, clientY: 0 }));
  controller.finish(pointerEvent({ clientX: 30, clientY: 0 }));
  windowObject.timers[0].callback();
  assert.equal(controller.consumeClick(pointerEvent({})), false);
});

test('routes the window pointer events into the session', () => {
  const committed = [];
  const { controller, surface, windowObject } = buildController({
    items: [],
    getConfig: () => ({ enabled: true, commit: (ids) => committed.push(ids) }),
  });
  const listenerFor = (type) => windowObject.listeners.find((entry) => entry.type === type).handler;
  assert.deepEqual(
    windowObject.listeners.map((entry) => entry.type),
    ['pointermove', 'pointerup', 'pointercancel'],
  );
  assert.deepEqual(
    windowObject.listeners.map((entry) => entry.capture),
    [true, true, true],
  );

  controller.begin(
    pointerEvent({ pointerId: 2, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  assert.equal(listenerFor('pointermove')(pointerEvent({ pointerId: 2, clientX: 30, clientY: 0 })), true);
  assert.equal(listenerFor('pointercancel')(pointerEvent({ pointerId: 2, clientX: 30, clientY: 0 })), false);
  assert.deepEqual(committed, []);

  controller.begin(
    pointerEvent({ pointerId: 3, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  assert.equal(listenerFor('pointermove')(pointerEvent({ pointerId: 3, clientX: 30, clientY: 0 })), true);
  assert.equal(listenerFor('pointerup')(pointerEvent({ pointerId: 3, clientX: 30, clientY: 0 })), true);
  assert.deepEqual(committed, [[]]);
});

test('destroy cancels the session and unhooks the window listeners', () => {
  const { controller, surface, windowObject, documentObject, root } = buildController({ items: [] });
  controller.begin(
    pointerEvent({ pointerId: 5, clientX: 0, clientY: 0, target: target({ '.surface': surface }) }),
  );
  controller.update(pointerEvent({ pointerId: 5, clientX: 30, clientY: 0 }));
  controller.destroy();
  assert.equal(documentObject.created[0].removed, true);
  assert.equal(root.classList.has('is-marquee-selecting'), false);
  assert.deepEqual(
    windowObject.listeners.map((entry) => entry.removed),
    [true, true, true],
  );
  assert.doesNotThrow(() => controller.destroy());
  assert.equal(controller.update(pointerEvent({ pointerId: 5, clientX: 40, clientY: 0 })), false);
});
