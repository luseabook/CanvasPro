import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspacePageTransitionController } from './workspacePageTransition.js';

function makeElement(label = 'element') {
  const listeners = new Map();
  const element = {
    label,
    attributes: {},
    inert: false,
    removalCount: 0,
    parentElement: null,
    classOps: [],
    attrOps: [],
    listenerOps: [],
    classList: {
      add(...names) {
        element.classOps.push(`add:${names.join(',')}`);
      },
      remove(...names) {
        element.classOps.push(`remove:${names.join(',')}`);
      },
    },
    setAttribute(attrName, value) {
      element.attributes[attrName] = value;
      element.attrOps.push(`set:${attrName}=${String(value)}`);
    },
    removeAttribute(attrName) {
      delete element.attributes[attrName];
      element.attrOps.push(`remove:${attrName}`);
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
      element.listenerOps.push(`add:${type}`);
    },
    removeEventListener(type, fn) {
      const entries = listeners.get(type) || [];
      const index = entries.indexOf(fn);
      if (index >= 0) entries.splice(index, 1);
      element.listenerOps.push(`remove:${type}`);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event) {
      for (const fn of [...(listeners.get(type) || [])]) fn(event);
    },
    remove() {
      element.removalCount += 1;
    },
  };
  return element;
}

function makeElements() {
  return {
    current: makeElement('current'),
    next: makeElement('next'),
    parent: makeElement('parent'),
  };
}

function makeWindow() {
  const timers = [];
  const cleared = [];
  const frames = [];
  const cancelled = [];
  return {
    timers,
    cleared,
    frames,
    cancelled,
    setTimeout(fn, delay) {
      timers.push({ fn, delay });
      return timers.length;
    },
    clearTimeout(id) {
      cleared.push(id);
    },
    requestAnimationFrame(fn) {
      frames.push(fn);
      return frames.length;
    },
    cancelAnimationFrame(id) {
      cancelled.push(id);
    },
    fireLatestTimer() {
      timers[timers.length - 1].fn();
    },
    fireLatestFrame() {
      frames[frames.length - 1]();
    },
  };
}

function startTransition(controller, elements, overrides = {}) {
  return controller.start({
    current: elements.current,
    next: elements.next,
    parent: elements.parent,
    ...overrides,
  });
}

const DEFAULT_CLASS_NAMES = {
  current: 'is-current',
  page: '',
  parent: '',
  scopeCurrent: '',
  scopeNext: '',
  scopeTarget: '',
  retainCurrentOnCommit: true,
};

const DEFAULT_FORWARD_CLASSES = { entering: 'is-entering-forward', leaving: 'is-leaving-forward' };

test('a fresh controller has no active transition and bare calls are inert', () => {
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });

  assert.equal(controller.getActiveTransition(), null);
  assert.equal(controller.cancel(), false);
  assert.equal(controller.settle(), false);
  assert.equal(controller.settle({ commit: true, notify: true, reason: 'nothing' }), false);
  assert.equal(controller.destroy(), undefined);
});

test('start refuses to run without both pages, a parent, a transition element or a known direction', () => {
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const els = makeElements();

  assert.equal(controller.start(), null);
  assert.equal(controller.start({}), null);
  assert.equal(controller.start({ current: els.current, next: els.next }), null);
  assert.equal(controller.start({ current: null, next: els.next, parent: els.parent }), null);
  assert.equal(controller.start({ current: els.current, next: null, parent: els.parent }), null);
  assert.equal(controller.start({ current: els.current, next: els.next, parent: null }), null);
  assert.equal(controller.start({ current: els.current, next: els.next, parent: '' }), null);
  assert.equal(
    controller.start({
      current: els.current,
      next: els.next,
      parent: els.parent,
      transitionElement: null,
    }),
    null,
  );
  assert.equal(
    controller.start({
      current: els.current,
      next: els.next,
      parent: els.parent,
      transitionElement: '',
    }),
    null,
  );
  for (const direction of ['sideways', 'next', null, 0]) {
    assert.equal(
      controller.start({ current: els.current, next: els.next, parent: els.parent, direction }),
      null,
      String(direction),
    );
  }

  assert.equal(controller.getActiveTransition(), null);
  assert.deepEqual(els.current.classOps, []);
  assert.deepEqual(els.next.classOps, []);
  assert.deepEqual(els.parent.classOps, []);
  assert.equal(win.timers.length, 0);
  assert.equal(win.frames.length, 0);
});

test('start writes the default forward classes and toggles interactivity', () => {
  const win = makeWindow();
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els);

  assert.notEqual(handle, null);
  assert.deepEqual(els.parent.classOps, []);
  assert.deepEqual(els.current.classOps, ['add:is-current']);
  assert.deepEqual(els.next.classOps, ['add:is-entering-forward']);
  assert.deepEqual(els.current.attrOps, ['set:aria-hidden=true']);
  assert.deepEqual(els.next.attrOps, ['remove:aria-hidden']);
  assert.equal(els.current.attributes['aria-hidden'], 'true');
  assert.equal(els.current.inert, true);
  assert.equal('aria-hidden' in els.next.attributes, false);
  assert.equal(els.next.inert, false);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend']);
  assert.equal(controller.getActiveTransition(), handle.transition);
  assert.deepEqual(handle.transition.directionClasses, DEFAULT_FORWARD_CLASSES);
  assert.deepEqual(handle.transition.classNames, DEFAULT_CLASS_NAMES);
  assert.deepEqual(handle.transition.parent, els.parent);
  assert.equal(handle.transition.committed, false);
  assert.equal(handle.transition.settled, false);
  assert.equal(win.frames.length, 1);
  assert.equal(win.timers.length, 1);
  assert.equal(win.timers[0].delay, 520);
  assert.equal(handle.transition.rafId, 1);
  assert.equal(handle.transition.fallbackTimer, 1);
});

test('start returns a handle carrying the transition, the promise and four controls', () => {
  const els = makeElements();
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els);

  assert.deepEqual(Object.keys(handle).sort(), [
    'cancel',
    'commit',
    'committed',
    'rollback',
    'settle',
    'transition',
  ]);
  for (const key of ['commit', 'rollback', 'settle', 'cancel']) {
    assert.equal(typeof handle[key], 'function', key);
  }
  assert.ok(handle.committed instanceof Promise);
  assert.equal(handle.transition.current, els.current);
  assert.equal(handle.transition.next, els.next);
  assert.equal(handle.transition.parent, els.parent);
  assert.equal(handle.transition.transitionElement, els.next);
  assert.equal(handle.transition.focusKey, null);
  assert.equal(handle.transition.focusContext, null);
  assert.equal(typeof handle.transition.onTransitionEnd, 'function');
  assert.equal(typeof handle.transition.resolve, 'function');
  assert.equal(handle.transition.onBeforeCommit, null);
  assert.equal(handle.transition.onAfterCommit, null);
  assert.equal(handle.transition.onCommit, null);
  assert.equal(handle.transition.onRollback, null);
  assert.equal(handle.transition.onSettled, null);
  assert.equal(handle.transition.onTransitionComplete, null);
});

test('honours a custom class name bag together with the backward direction', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els, {
    direction: 'backward',
    classNames: {
      current: 'is-active',
      page: 'page',
      parent: 'pages',
      scopeCurrent: 'scope-a',
      scopeNext: 'scope-b',
      scopeTarget: 'scope-c',
    },
  });

  assert.deepEqual(handle.transition.directionClasses, {
    entering: 'is-entering-backward',
    leaving: 'is-leaving-backward',
  });
  assert.deepEqual(els.parent.classOps, ['add:pages']);
  assert.deepEqual(els.current.classOps, ['add:page,is-active,scope-a']);
  assert.deepEqual(els.next.classOps, ['add:page,is-entering-backward,scope-b,scope-c']);
});

test('direction overrides replace only the keys they provide', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els, {
    classNames: {
      directions: {
        forward: { entering: 'enter-custom' },
        backward: { leaving: 'leave-custom' },
      },
    },
  });

  assert.deepEqual(handle.transition.directionClasses, {
    entering: 'enter-custom',
    leaving: 'is-leaving-forward',
  });
  assert.deepEqual(els.next.classOps, ['add:enter-custom']);
});

test('a blank direction override falls back while a whitespace one wins but adds nothing', () => {
  const blank = makeElements();
  const blankController = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const blankHandle = startTransition(blankController, blank, {
    classNames: { directions: { forward: { entering: '', leaving: null } } },
  });
  assert.deepEqual(blankHandle.transition.directionClasses, DEFAULT_FORWARD_CLASSES);

  const spaces = makeElements();
  const spacesController = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const spacesHandle = startTransition(spacesController, spaces, {
    classNames: { directions: { forward: { entering: '   ' } } },
  });
  assert.equal(spacesHandle.transition.directionClasses.entering, '   ');
  assert.deepEqual(spaces.next.classOps, []);
});

test('an inherited prototype key as a direction yields undefined classes instead of null', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els, { direction: 'toString' });

  assert.notEqual(handle, null);
  assert.deepEqual(handle.transition.directionClasses, { entering: undefined, leaving: undefined });
  assert.deepEqual(els.current.classOps, ['add:is-current']);
  assert.deepEqual(els.next.classOps, []);
  assert.equal(handle.commit(), true);
  assert.deepEqual(els.current.classOps, ['add:is-current', 'remove:is-current']);
  assert.deepEqual(els.next.classOps, ['add:is-current']);
});

test('class values accept nested arrays and whitespace separated strings', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  startTransition(controller, els, {
    classNames: {
      current: ['is-current', 'extra'],
      page: 'page-a   page-b',
      parent: ['  parent-a  ', ['parent-b']],
    },
  });

  assert.deepEqual(els.parent.classOps, ['add:parent-a,parent-b']);
  assert.deepEqual(els.current.classOps, ['add:page-a,page-b,is-current,extra']);
  assert.deepEqual(els.next.classOps, ['add:page-a,page-b,is-entering-forward']);
});

test('blank class name options fall back to the defaults', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els, {
    classNames: {
      current: '',
      page: null,
      parent: undefined,
      scopeCurrent: '   ',
      scopeNext: 0,
      scopeTarget: false,
    },
  });

  assert.equal(handle.transition.classNames.current, 'is-current');
  assert.equal(handle.transition.classNames.page, '');
  assert.equal(handle.transition.classNames.parent, '');
  assert.equal(handle.transition.classNames.scopeCurrent, '   ');
  assert.equal(handle.transition.classNames.scopeNext, '');
  assert.equal(handle.transition.classNames.scopeTarget, '');
  assert.deepEqual(els.parent.classOps, []);
  assert.deepEqual(els.current.classOps, ['add:is-current']);
  assert.deepEqual(els.next.classOps, ['add:is-entering-forward']);
});

test('derives the parent from the next page, then from the current one', () => {
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const current = makeElement('current');
  const next = makeElement('next');
  const nextParent = makeElement('nextParent');
  const currentParent = makeElement('currentParent');
  next.parentElement = nextParent;
  current.parentElement = currentParent;

  const handle = controller.start({ current, next });
  assert.equal(handle.transition.parent, nextParent);
  assert.deepEqual(nextParent.classOps, []);

  const secondCurrent = makeElement('secondCurrent');
  const secondNext = makeElement('secondNext');
  secondCurrent.parentElement = currentParent;
  const secondHandle = controller.start({ current: secondCurrent, next: secondNext });
  assert.equal(secondHandle.transition.parent, currentParent);
});

test('an explicit parent wins over the derived one', () => {
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const current = makeElement('current');
  const next = makeElement('next');
  const derived = makeElement('derived');
  const explicit = makeElement('explicit');
  next.parentElement = derived;

  const handle = controller.start({ current, next, parent: explicit });
  assert.equal(handle.transition.parent, explicit);
  assert.deepEqual(derived.classOps, []);
  assert.deepEqual(explicit.classOps, []);
});

test('captures focus when the caller leaves the focus key undefined', () => {
  const els = makeElements();
  const captured = [];
  const controller = createWorkspacePageTransitionController({
    windowObject: makeWindow(),
    captureFocus: (context) => {
      captured.push(context);
      return 'captured';
    },
  });
  const handle = startTransition(controller, els);

  assert.equal(handle.transition.focusKey, 'captured');
  assert.equal(captured.length, 1);
  assert.deepEqual(Object.keys(captured[0]).sort(), ['current', 'next', 'parent']);
  assert.equal(captured[0].current, els.current);
  assert.equal(captured[0].next, els.next);
  assert.equal(captured[0].parent, els.parent);
});

test('a nullish capture result and a missing capture hook leave the focus key null', () => {
  const nullEls = makeElements();
  const nullController = createWorkspacePageTransitionController({
    windowObject: makeWindow(),
    captureFocus: () => null,
  });
  assert.equal(startTransition(nullController, nullEls).transition.focusKey, null);

  const plainEls = makeElements();
  const plainController = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  assert.equal(startTransition(plainController, plainEls).transition.focusKey, null);
});

test('an explicit focus key skips capture, even when it is null', () => {
  const els = makeElements();
  let captures = 0;
  const controller = createWorkspacePageTransitionController({
    windowObject: makeWindow(),
    captureFocus: () => {
      captures += 1;
      return 'ignored';
    },
  });

  const handle = startTransition(controller, els, { focusKey: null });
  assert.equal(captures, 0);
  assert.equal(handle.transition.focusKey, null);
});

test('restores focus on commit only, passing key, context and transition', () => {
  const restores = [];
  const controller = createWorkspacePageTransitionController({
    windowObject: makeWindow(),
    restoreFocus: (...args) => restores.push(args),
  });

  const rolled = makeElements();
  const rollbackHandle = startTransition(controller, rolled, {
    focusKey: 0,
    focusContext: { page: 'a' },
  });
  rollbackHandle.rollback();
  assert.deepEqual(restores, []);

  const committed = makeElements();
  const commitHandle = startTransition(controller, committed, {
    focusKey: 0,
    focusContext: { page: 'b' },
  });
  commitHandle.cancel({ commit: true });
  assert.equal(restores.length, 1);
  assert.equal(restores[0][0], 0);
  assert.deepEqual(restores[0][1], { page: 'b' });
  assert.equal(restores[0][2], commitHandle.transition);

  const contextless = makeElements();
  const contextlessHandle = startTransition(controller, contextless, { focusKey: 'k' });
  contextlessHandle.settle({ commit: true });
  assert.equal(restores.length, 2);
  assert.equal(restores[1][0], 'k');
  assert.equal(restores[1][1], null);
});

test('mount and forceLayout wrap the class writes and the listener binding', () => {
  const win = makeWindow();
  const els = makeElements();
  const calls = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, {
    mount: (context) => {
      calls.push(['mount', context, els.next.listenerCount('transitionend'), els.next.classOps.length]);
    },
    forceLayout: (context) => {
      calls.push(['forceLayout', context, els.next.listenerCount('transitionend')]);
    },
  });

  assert.deepEqual(
    calls.map((call) => call[0]),
    ['mount', 'forceLayout'],
  );
  assert.equal(calls[0][2], 0);
  assert.equal(calls[0][3], 1);
  assert.equal(calls[1][2], 1);
  for (const call of calls) {
    assert.equal(call[1].current, els.current);
    assert.equal(call[1].next, els.next);
    assert.equal(call[1].parent, els.parent);
    assert.equal(call[1].transition, handle.transition);
  }
});

test('settling clears the fallback timer, cancels the frame and drops the listener once', async () => {
  const win = makeWindow();
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: win, fallbackMs: 300 });
  const handle = startTransition(controller, els);

  assert.equal(win.timers.length, 1);
  assert.equal(win.timers[0].delay, 300);
  assert.equal(els.next.listenerCount('transitionend'), 1);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend']);

  assert.equal(handle.settle({ commit: true, notify: true, reason: 'manual' }), true);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(win.cancelled, [1]);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
  assert.equal(els.next.listenerCount('transitionend'), 0);
  assert.equal(await handle.committed, true);

  assert.equal(handle.settle({ commit: true, notify: true, reason: 'again' }), false);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(win.cancelled, [1]);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
});

test('a matching transitionend commits and settles with the full write sequence', () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, {
    onBeforeCommit: (transition) => events.push(['before', transition]),
    onAfterCommit: (transition) => events.push(['after', transition]),
    onCommit: (transition) => events.push(['commit', transition]),
    onRollback: (transition) => events.push(['rollback', transition]),
    onSettled: (payload) => events.push(['settled', payload]),
    onTransitionComplete: (transition) => events.push(['complete', transition]),
  });
  assert.deepEqual(events, []);

  win.fireLatestFrame();
  assert.deepEqual(
    events.map((event) => event[0]),
    ['before', 'after'],
  );
  assert.deepEqual(els.current.classOps, ['add:is-current', 'add:is-leaving-forward', 'remove:is-current']);
  assert.deepEqual(els.next.classOps, [
    'add:is-entering-forward',
    'add:is-current',
    'remove:is-entering-forward',
  ]);
  assert.equal(els.current.removalCount, 0);

  els.next.dispatch('transitionend', { target: els.next, propertyName: 'transform' });

  assert.deepEqual(
    events.map((event) => event[0]),
    ['before', 'after', 'commit', 'settled', 'complete'],
  );
  assert.equal(events[1][1], handle.transition);
  assert.equal(events[2][1], handle.transition);
  assert.equal(events[4][1], handle.transition);
  assert.deepEqual(els.current.classOps, [
    'add:is-current',
    'add:is-leaving-forward',
    'remove:is-current',
    'remove:is-current,is-leaving-forward',
  ]);
  assert.deepEqual(els.next.classOps, [
    'add:is-entering-forward',
    'add:is-current',
    'remove:is-entering-forward',
    'remove:is-entering-forward',
    'add:is-current',
  ]);
  assert.deepEqual(els.parent.classOps, []);
  assert.deepEqual(els.current.attrOps, ['set:aria-hidden=true']);
  assert.equal(els.current.attributes['aria-hidden'], 'true');
  assert.equal(els.current.inert, true);
  assert.deepEqual(els.next.attrOps, ['remove:aria-hidden', 'remove:aria-hidden']);
  assert.equal(els.next.inert, false);
  assert.equal(els.current.removalCount, 1);
  assert.equal(els.next.removalCount, 0);
  assert.equal(controller.getActiveTransition(), null);

  const payload = events[3][1];
  assert.deepEqual(Object.keys(payload).sort(), ['committed', 'notify', 'reason', 'transition']);
  assert.equal(payload.committed, true);
  assert.equal(payload.notify, true);
  assert.equal(payload.reason, 'transitionend');
  assert.equal(payload.transition, handle.transition);
  assert.equal(handle.transition.settled, true);
  assert.equal(handle.transition.committed, true);
});

test('transitionend is ignored unless the target and the property both match', () => {
  const win = makeWindow();
  const els = makeElements();
  const other = makeElement('other');
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els);
  const handler = handle.transition.onTransitionEnd;

  assert.doesNotThrow(() => handler(null));
  handler({ target: other, propertyName: 'transform' });
  handler({ target: els.next, propertyName: 'opacity' });
  handler({ target: null, propertyName: 'transform' });
  handler({});
  assert.equal(handle.transition.settled, false);
  assert.equal(controller.getActiveTransition(), handle.transition);
  assert.equal(els.next.listenerCount('transitionend'), 1);

  handler({ target: els.next, propertyName: 'transform' });
  assert.equal(handle.transition.settled, true);
  assert.equal(handle.transition.committed, true);
});

test('a blank transition property accepts any animated property', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({
    windowObject: makeWindow(),
    transitionProperty: '',
  });
  const handle = startTransition(controller, els);

  handle.transition.onTransitionEnd({ target: els.next, propertyName: 'opacity' });
  assert.equal(handle.transition.settled, true);
  assert.equal(handle.transition.committed, true);
});

test('the event must come from the transition element, not the next page', () => {
  const els = makeElements();
  const wrapper = makeElement('wrapper');
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els, { transitionElement: wrapper });

  assert.equal(wrapper.listenerCount('transitionend'), 1);
  assert.equal(els.next.listenerCount('transitionend'), 0);

  handle.transition.onTransitionEnd({ target: els.next, propertyName: 'transform' });
  assert.equal(handle.transition.settled, false);

  handle.transition.onTransitionEnd({ target: wrapper, propertyName: 'transform' });
  assert.equal(handle.transition.settled, true);
});

test('commit advances the visual state on every call while the transition is active', () => {
  const els = makeElements();
  const win = makeWindow();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, {
    onBeforeCommit: () => events.push('before'),
    onAfterCommit: () => events.push('after'),
    onCommit: () => events.push('commit'),
  });

  assert.equal(handle.commit(), true);
  assert.deepEqual(events, ['before', 'after']);
  assert.equal(handle.transition.committed, true);
  assert.equal(handle.transition.settled, false);
  assert.equal(controller.getActiveTransition(), handle.transition);

  assert.equal(handle.commit(), true);
  assert.deepEqual(events, ['before', 'after', 'before', 'after']);
  assert.deepEqual(els.current.classOps, [
    'add:is-current',
    'add:is-leaving-forward',
    'remove:is-current',
    'add:is-leaving-forward',
    'remove:is-current',
  ]);

  win.fireLatestFrame();
  assert.deepEqual(events, ['before', 'after', 'before', 'after', 'before', 'after']);

  handle.settle({ commit: true, notify: false, reason: 'later' });
  assert.deepEqual(events, ['before', 'after', 'before', 'after', 'before', 'after', 'commit']);
  assert.equal(handle.commit(), false);
});

test('a bare handle settle uses the already-committed state and the settled reason', () => {
  const els = makeElements();
  const win = makeWindow();
  const settled = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, { onSettled: (payload) => settled.push(payload) });

  assert.equal(handle.settle(), true);
  assert.equal(settled.length, 1);
  assert.equal(settled[0].committed, false);
  assert.equal(settled[0].notify, false);
  assert.equal(settled[0].reason, 'settled');
  assert.equal(settled[0].transition, handle.transition);
  assert.equal(els.next.removalCount, 1);
  assert.equal(els.current.removalCount, 0);
});

test('the fallback timer commits, notifies and clears itself', async () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win, fallbackMs: 0 });
  const handle = startTransition(controller, els, {
    onCommit: () => events.push('commit'),
    onSettled: (payload) => events.push(`settled:${payload.reason}:${payload.notify}`),
    onTransitionComplete: () => events.push('complete'),
  });

  assert.equal(win.timers.length, 1);
  assert.equal(win.timers[0].delay, 0);

  win.fireLatestTimer();
  assert.deepEqual(events, ['commit', 'settled:fallback:true', 'complete']);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(win.cancelled, [1]);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
  assert.equal(handle.transition.settled, true);
  assert.equal(await handle.committed, true);
});

test('a fallback after a frame re-runs the advance hooks but commits only once', async () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, {
    onBeforeCommit: () => events.push('before'),
    onAfterCommit: () => events.push('after'),
    onCommit: () => events.push('commit'),
    onSettled: (payload) => events.push(`settled:${payload.reason}`),
  });

  win.fireLatestFrame();
  win.fireLatestTimer();
  assert.deepEqual(events, ['before', 'after', 'before', 'after', 'commit', 'settled:fallback']);
  assert.equal(await handle.committed, true);
});

test('without requestAnimationFrame the commit happens before start returns', () => {
  const win = makeWindow();
  delete win.requestAnimationFrame;
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els);

  assert.deepEqual(els.current.classOps, ['add:is-current', 'add:is-leaving-forward', 'remove:is-current']);
  assert.deepEqual(els.next.classOps, [
    'add:is-entering-forward',
    'add:is-current',
    'remove:is-entering-forward',
  ]);
  assert.equal(handle.transition.committed, true);
  assert.ok(handle.transition.rafId === 0);
  assert.equal(win.frames.length, 0);

  handle.settle({ commit: true, notify: true, reason: 'fallback' });
  assert.deepEqual(win.cancelled, []);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(els.current.classOps, [
    'add:is-current',
    'add:is-leaving-forward',
    'remove:is-current',
    'remove:is-current,is-leaving-forward',
  ]);
});

test('rollback restores the current page and disposes the incoming one', async () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const restores = [];
  const controller = createWorkspacePageTransitionController({
    windowObject: win,
    restoreFocus: (...args) => restores.push(args),
  });
  const handle = startTransition(controller, els, {
    focusKey: 'key',
    onRollback: (transition) => events.push(['rollback', transition]),
    onCommit: () => events.push(['commit']),
    onTransitionComplete: () => events.push(['complete']),
    onSettled: (payload) => events.push(['settled', payload.committed, payload.notify, payload.reason]),
  });

  assert.equal(handle.rollback(), true);
  assert.equal(events[0][0], 'rollback');
  assert.equal(events[0][1], handle.transition);
  assert.deepEqual(events[1], ['settled', false, false, 'rollback']);
  assert.deepEqual(restores, []);
  assert.equal(await handle.committed, false);

  assert.deepEqual(els.current.classOps, ['add:is-current', 'remove:is-leaving-forward', 'add:is-current']);
  assert.deepEqual(els.next.classOps, ['add:is-entering-forward']);
  assert.deepEqual(els.parent.classOps, []);
  assert.deepEqual(els.current.attrOps, ['set:aria-hidden=true', 'remove:aria-hidden']);
  assert.equal(els.current.attributes['aria-hidden'], undefined);
  assert.equal(els.current.inert, false);
  assert.deepEqual(els.next.attrOps, ['remove:aria-hidden']);
  assert.equal(els.current.removalCount, 0);
  assert.equal(els.next.removalCount, 1);
  assert.equal(controller.getActiveTransition(), null);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(win.cancelled, [1]);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
});

test('cancel rolls back before the commit and commits after it', async () => {
  const win = makeWindow();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });

  const beforeEls = makeElements();
  const before = startTransition(controller, beforeEls, {
    onRollback: () => events.push('rollback'),
    onCommit: () => events.push('commit'),
    onSettled: (payload) => events.push(`settled:${payload.reason}:${payload.committed}:${payload.notify}`),
    onTransitionComplete: () => events.push('complete'),
  });
  assert.equal(before.cancel(), true);
  assert.equal(await before.committed, false);
  assert.deepEqual(events, ['rollback', 'settled:cancelled:false:false']);

  const afterEls = makeElements();
  const after = startTransition(controller, afterEls, {
    onCommit: () => events.push('commit2'),
    onSettled: (payload) => events.push(`settled2:${payload.reason}:${payload.committed}:${payload.notify}`),
    onTransitionComplete: () => events.push('complete2'),
  });
  win.fireLatestFrame();
  assert.equal(after.cancel(), true);
  assert.equal(await after.committed, true);
  assert.deepEqual(events.slice(2), ['commit2', 'settled2:cancelled:true:false']);
});

test('cancel with an explicit commit advances the visual state first', () => {
  const els = makeElements();
  const win = makeWindow();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, {
    onBeforeCommit: () => events.push('before'),
    onCommit: () => events.push('commit'),
  });

  assert.equal(handle.cancel({ commit: true }), true);
  assert.deepEqual(events, ['before', 'commit']);
  assert.equal(handle.transition.committed, true);
  assert.deepEqual(els.current.classOps, [
    'add:is-current',
    'add:is-leaving-forward',
    'remove:is-current',
    'remove:is-current,is-leaving-forward',
  ]);
});

test('the controller cancel only targets the active transition', () => {
  const els = makeElements();
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });

  assert.equal(controller.cancel(), false);
  const handle = startTransition(controller, els);
  assert.equal(controller.cancel({ commit: false }), true);
  assert.equal(handle.transition.settled, true);
  assert.equal(controller.cancel(), false);
});

test('the controller settle forwards an empty options bag with a settled reason', () => {
  const win = makeWindow();
  const settled = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const els = makeElements();
  const handle = startTransition(controller, els, {
    onSettled: (payload) => settled.push(payload),
    onTransitionComplete: () => settled.push('complete'),
  });

  win.fireLatestFrame();
  assert.equal(controller.settle(), true);
  assert.equal(settled.length, 1);
  assert.equal(settled[0].reason, 'settled');
  assert.equal(settled[0].committed, true);
  assert.equal(settled[0].notify, false);
  assert.equal(handle.transition.settled, true);

  const customEls = makeElements();
  const completions = [];
  const custom = startTransition(controller, customEls, {
    onTransitionComplete: (transition) => completions.push(transition),
  });
  assert.equal(controller.settle({ commit: false, notify: true, reason: 'custom' }), true);
  assert.deepEqual(completions, [custom.transition]);
  assert.equal(custom.transition.committed, false);
});

test('a settled transition refuses further settle, commit, rollback and cancel calls', () => {
  const els = makeElements();
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els);

  assert.equal(handle.settle({ commit: true, notify: true, reason: 'first' }), true);
  assert.equal(handle.settle(), false);
  assert.equal(handle.commit(), false);
  assert.equal(handle.rollback(), false);
  assert.equal(handle.cancel(), false);
  assert.equal(handle.transition.settled, true);
  assert.equal(els.current.removalCount, 1);
  assert.deepEqual(win.cleared, [1]);
  assert.deepEqual(els.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
});

test('passing null wherever an options bag is expected throws instead of being ignored', () => {
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const handle = startTransition(controller, els);

  assert.throws(() => createWorkspacePageTransitionController(null), TypeError);
  assert.throws(() => controller.start(null), TypeError);
  assert.throws(() => controller.settle(null), TypeError);
  assert.throws(() => handle.cancel(null), TypeError);
  assert.throws(() => controller.destroy(null), TypeError);
  assert.equal(handle.transition.settled, false);
  assert.equal(controller.getActiveTransition(), handle.transition);
});

test('starting a second transition settles the first one as replaced', async () => {
  const win = makeWindow();
  const firstEls = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const first = startTransition(controller, firstEls, {
    onRollback: () => events.push('a:rollback'),
    onCommit: () => events.push('a:commit'),
    onSettled: (payload) => events.push(`a:settled:${payload.reason}:${payload.notify}`),
    onTransitionComplete: () => events.push('a:complete'),
  });

  const secondEls = makeElements();
  const second = startTransition(controller, secondEls);

  assert.deepEqual(events, ['a:rollback', 'a:settled:replaced:false']);
  assert.equal(await first.committed, false);
  assert.equal(first.transition.settled, true);
  assert.equal(first.commit(), false);
  assert.equal(controller.getActiveTransition(), second.transition);
  assert.deepEqual(win.cleared, [1]);
  assert.equal(win.timers.length, 2);
  assert.deepEqual(firstEls.next.listenerOps, ['add:transitionend', 'remove:transitionend']);
  assert.equal(secondEls.next.listenerCount('transitionend'), 1);
});

test('replacing an already-committed transition commits it first', () => {
  const win = makeWindow();
  const firstEls = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  startTransition(controller, firstEls, {
    onCommit: () => events.push('a:commit'),
    onSettled: (payload) => events.push(`a:settled:${payload.reason}:${payload.committed}`),
    onTransitionComplete: () => events.push('a:complete'),
  });

  win.fireLatestFrame();
  const secondEls = makeElements();
  startTransition(controller, secondEls);

  assert.deepEqual(events, ['a:commit', 'a:settled:replaced:true']);
  assert.equal(firstEls.current.removalCount, 1);
  assert.equal(firstEls.next.removalCount, 0);
});

test('destroy rolls back by default and blocks every later call', () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, { onRollback: () => events.push('rollback') });

  assert.equal(controller.destroy(), undefined);
  assert.deepEqual(events, ['rollback']);
  assert.equal(handle.transition.settled, true);
  assert.equal(controller.getActiveTransition(), null);
  assert.deepEqual(win.cleared, [1]);
  assert.equal(controller.cancel(), false);
  assert.equal(controller.settle({ commit: true }), false);
  assert.equal(handle.commit(), false);
  assert.equal(handle.settle({ commit: true, notify: true }), false);
  assert.equal(
    controller.start({ current: makeElement('c'), next: makeElement('n'), parent: makeElement('p') }),
    null,
  );
  assert.doesNotThrow(() => controller.destroy());
  assert.equal(els.current.removalCount, 0);
  assert.equal(els.next.removalCount, 1);
});

test('destroy can commit the active transition on the way out', () => {
  const win = makeWindow();
  const els = makeElements();
  const events = [];
  const restores = [];
  const controller = createWorkspacePageTransitionController({
    windowObject: win,
    restoreFocus: (...args) => restores.push(args),
  });
  const handle = startTransition(controller, els, {
    focusKey: 'k',
    onCommit: () => events.push('commit'),
  });

  assert.throws(() => controller.destroy(null), TypeError);
  controller.destroy({ commit: true });

  assert.deepEqual(events, ['commit']);
  assert.equal(handle.transition.committed, true);
  assert.equal(handle.transition.settled, true);
  assert.equal(els.current.removalCount, 1);
  assert.equal(restores.length, 1);
  assert.equal(restores[0][0], 'k');
  assert.equal(restores[0][2], handle.transition);
});

test('a window that cannot cancel frames or clear a zero timer is left alone', () => {
  const noCancel = makeWindow();
  noCancel.cancelAnimationFrame = 'not a function';
  const noCancelEls = makeElements();
  const noCancelController = createWorkspacePageTransitionController({ windowObject: noCancel });
  const noCancelHandle = startTransition(noCancelController, noCancelEls);
  assert.equal(noCancelHandle.transition.rafId, 1);
  assert.equal(noCancelHandle.settle({ commit: true }), true);

  const silent = makeWindow();
  silent.setTimeout = () => undefined;
  const silentEls = makeElements();
  const silentController = createWorkspacePageTransitionController({ windowObject: silent });
  const silentHandle = startTransition(silentController, silentEls);
  assert.ok(silentHandle.transition.fallbackTimer === 0);
  assert.equal(silentHandle.settle({ commit: true }), true);
  assert.deepEqual(silent.cleared, []);
  assert.deepEqual(silent.cancelled, [1]);
});

test('a null, empty or broken window object degrades to an immediate commit', () => {
  const nullEls = makeElements();
  const nullController = createWorkspacePageTransitionController({ windowObject: null });
  const nullHandle = startTransition(nullController, nullEls);
  assert.equal(nullHandle.transition.committed, true);
  assert.ok(nullHandle.transition.fallbackTimer === 0);
  assert.ok(nullHandle.transition.rafId === 0);
  assert.equal(nullHandle.settle({ commit: true }), true);

  const emptyEls = makeElements();
  const emptyController = createWorkspacePageTransitionController({ windowObject: {} });
  const emptyHandle = startTransition(emptyController, emptyEls);
  assert.equal(emptyHandle.transition.committed, true);
  assert.ok(emptyHandle.transition.fallbackTimer === 0);
  assert.equal(emptyHandle.settle({ commit: true }), true);

  const brokenEls = makeElements();
  const broken = makeWindow();
  broken.requestAnimationFrame = 'not a function';
  const brokenController = createWorkspacePageTransitionController({ windowObject: broken });
  const brokenHandle = startTransition(brokenController, brokenEls);
  assert.equal(brokenHandle.transition.committed, true);
  assert.equal(broken.frames.length, 0);
  assert.equal(brokenHandle.settle({ commit: true }), true);
});

test('elements without classList, attributes or listeners are tolerated', () => {
  const bareCurrent = {};
  const bareNext = {};
  const bareParent = {};
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });

  let handle = null;
  assert.doesNotThrow(() => {
    handle = controller.start({ current: bareCurrent, next: bareNext, parent: bareParent });
  });
  assert.notEqual(handle, null);
  assert.equal(bareCurrent.inert, true);
  assert.equal(bareNext.inert, false);
  assert.equal(bareParent.inert, undefined);

  assert.doesNotThrow(() => handle.settle({ commit: true, notify: true }));
  assert.equal(handle.transition.settled, true);
});

test('an element that refuses to become inert keeps its aria state written', () => {
  const current = makeElement('current');
  Object.defineProperty(current, 'inert', {
    configurable: true,
    get: () => 'blocked',
    set: () => {
      throw new Error('nope');
    },
  });
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });

  let handle = null;
  assert.doesNotThrow(() => {
    handle = controller.start({ current, next: els.next, parent: els.parent });
  });
  assert.deepEqual(current.attrOps, ['set:aria-hidden=true']);
  assert.equal(current.inert, 'blocked');

  assert.doesNotThrow(() => handle.settle({ commit: true }));
  assert.deepEqual(current.attrOps, ['set:aria-hidden=true']);
  assert.equal(current.removalCount, 1);
});

test('omitted factory options fall back to the documented defaults', () => {
  const win = makeWindow();
  const els = makeElements();
  const controller = createWorkspacePageTransitionController({
    windowObject: win,
    fallbackMs: undefined,
    transitionProperty: undefined,
    disposePage: undefined,
    captureFocus: undefined,
    restoreFocus: undefined,
  });
  const handle = startTransition(controller, els);

  assert.equal(win.timers[0].delay, 520);
  assert.equal(handle.transition.focusKey, null);
  assert.deepEqual(handle.transition.directionClasses, DEFAULT_FORWARD_CLASSES);
  assert.deepEqual(handle.transition.classNames, DEFAULT_CLASS_NAMES);
  assert.deepEqual(els.current.classOps, ['add:is-current']);

  win.fireLatestFrame();
  handle.settle({ commit: true, notify: false });
  assert.equal(els.current.removalCount, 1);
  assert.equal(els.next.removalCount, 0);
  assert.deepEqual(els.next.attrOps, ['remove:aria-hidden', 'remove:aria-hidden']);
});

test('fallbackMs is clamped, coerced and defaulted before scheduling', () => {
  const cases = [
    [{}, 520],
    [{ fallbackMs: undefined }, 520],
    [{ fallbackMs: 300 }, 300],
    [{ fallbackMs: '250' }, 250],
    [{ fallbackMs: -5 }, 0],
    [{ fallbackMs: 0 }, 0],
    [{ fallbackMs: null }, 0],
    [{ fallbackMs: Number.NaN }, 0],
    [{ fallbackMs: 'abc' }, 0],
    [{ fallbackMs: Number.POSITIVE_INFINITY }, Number.POSITIVE_INFINITY],
  ];

  for (const [options, expected] of cases) {
    const win = makeWindow();
    const els = makeElements();
    const controller = createWorkspacePageTransitionController({ windowObject: win, ...options });
    startTransition(controller, els);
    assert.equal(win.timers[0].delay, expected, JSON.stringify(options));
    controller.destroy({ commit: true });
  }
});

test('the factory defaults to the ambient window when none is injected', () => {
  const win = makeWindow();
  const saved = {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const els = makeElements();
  let handle = null;

  try {
    globalThis.setTimeout = win.setTimeout;
    globalThis.clearTimeout = win.clearTimeout;
    globalThis.requestAnimationFrame = win.requestAnimationFrame;
    globalThis.cancelAnimationFrame = win.cancelAnimationFrame;

    const controller = createWorkspacePageTransitionController();
    handle = startTransition(controller, els);
    assert.equal(win.timers[0].delay, 520);
    assert.equal(win.frames.length, 1);
    assert.equal(controller.settle({ commit: true, notify: true, reason: 'ambient' }), true);
    assert.deepEqual(win.cleared, [1]);
    assert.deepEqual(win.cancelled, [1]);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }

  assert.equal(handle.transition.settled, true);
  assert.equal(els.current.removalCount, 1);
});

test('only an explicit false turns off retaining the current class on commit', () => {
  const win = makeWindow();
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const cases = [
    { label: 'omitted', omit: true, flag: true, ops: ['add:is-current', 'add:is-current'] },
    { label: 'undefined', value: undefined, flag: true, ops: ['add:is-current', 'add:is-current'] },
    { label: 'null', value: null, flag: true, ops: ['add:is-current', 'add:is-current'] },
    { label: 'zero', value: 0, flag: true, ops: ['add:is-current', 'add:is-current'] },
    { label: 'false', value: false, flag: false, ops: ['add:is-current', 'remove:is-current'] },
  ];

  for (const testCase of cases) {
    const els = makeElements();
    const classNames = testCase.omit ? {} : { retainCurrentOnCommit: testCase.value };
    const handle = startTransition(controller, els, { classNames });

    assert.equal(handle.transition.classNames.retainCurrentOnCommit, testCase.flag, testCase.label);
    win.fireLatestFrame();
    handle.settle({ commit: true, notify: false, reason: 'check' });
    assert.deepEqual(
      els.next.classOps.filter((op) => op.includes('is-current')),
      testCase.ops,
      testCase.label,
    );
  }
});

test('start never mutates the option bags it is handed', () => {
  const els = makeElements();
  const win = makeWindow();
  const classNames = {
    current: 'is-active',
    page: 'page',
    directions: { forward: { entering: 'enter', leaving: 'leave' } },
  };
  const snapshot = JSON.parse(JSON.stringify(classNames));
  const startOptions = { direction: 'forward', classNames };
  const controller = createWorkspacePageTransitionController({ windowObject: win });
  const handle = startTransition(controller, els, startOptions);
  handle.settle({ commit: true });

  assert.deepEqual(classNames, snapshot);
  assert.deepEqual(startOptions.classNames, snapshot);
  assert.equal(startOptions.direction, 'forward');
  assert.equal('directions' in handle.transition.classNames, false);
  assert.deepEqual(handle.transition.classNames, {
    ...DEFAULT_CLASS_NAMES,
    current: 'is-active',
    page: 'page',
  });
  assert.deepEqual(els.current.classOps, [
    'add:page,is-active',
    'add:leave',
    'remove:is-active',
    'remove:is-active,leave,page',
  ]);
  assert.deepEqual(els.next.classOps, [
    'add:page,enter',
    'add:is-active',
    'remove:enter',
    'remove:enter,page',
    'add:is-active',
  ]);
  assert.deepEqual(els.parent.classOps, []);
});

test('custom directions leave the shared defaults untouched for later runs', () => {
  const controller = createWorkspacePageTransitionController({ windowObject: makeWindow() });
  const custom = makeElements();
  startTransition(controller, custom, {
    classNames: { directions: { forward: { entering: 'enter', leaving: 'leave' } } },
  });
  assert.deepEqual(custom.next.classOps, ['add:enter']);

  const fresh = makeElements();
  const handle = startTransition(controller, fresh);
  assert.deepEqual(handle.transition.directionClasses, DEFAULT_FORWARD_CLASSES);
  assert.deepEqual(fresh.next.classOps, ['add:is-entering-forward']);
  assert.deepEqual(fresh.current.classOps, ['add:is-current']);
  assert.deepEqual(handle.transition.classNames, DEFAULT_CLASS_NAMES);
});
