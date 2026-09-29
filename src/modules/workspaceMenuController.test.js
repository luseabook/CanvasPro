import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspaceMenuController,
  syncWorkspaceInlineMenuExpandedWidth,
} from './workspaceMenuController.js';

const WRAPPER = '.wrapper';
const TRIGGER = '.trigger';
const MENU = '.menu';
const OPTION = '.option';
const OPEN_CLASS = 'is-open';

function makeClassList(initial = []) {
  const tokens = new Set(initial);
  return {
    contains: (token) => tokens.has(token),
    add: (token) => {
      tokens.add(token);
    },
    remove: (token) => {
      tokens.delete(token);
    },
  };
}

function makeStyle() {
  const properties = {};
  return {
    properties,
    setProperty(name, value) {
      properties[name] = String(value);
    },
  };
}

class FakeElement {
  constructor(tagName = 'div', { focusImpl = null } = {}) {
    this.tagName = String(tagName).toUpperCase();
    this.classList = makeClassList();
    this.attributes = {};
    this.disabled = false;
    this.style = makeStyle();
    this.scrollWidth = 0;
    this.ownerDocument = null;
    this.focusCalls = [];
    this.querySelectors = new Map();
    this.querySelectorAlls = new Map();
    this.ancestors = new Map();
    this.focusImpl = focusImpl;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }
  querySelector(selector) {
    return this.querySelectors.get(selector) ?? null;
  }
  querySelectorAll(selector) {
    return this.querySelectorAlls.get(selector) ?? [];
  }
  closest(selector) {
    return this.ancestors.get(selector) ?? null;
  }
  focus(options) {
    this.focusCalls.push(options);
    if (this.focusImpl) this.focusImpl(options);
  }
}

function makeOption({ disabled = false, ariaDisabled = null } = {}) {
  const option = new FakeElement('div');
  option.disabled = disabled;
  if (ariaDisabled !== null) option.setAttribute('aria-disabled', ariaDisabled);
  option.ancestors.set(OPTION, option);
  return option;
}

function makeWrapper({
  open = false,
  disabled = false,
  options = [],
  withTrigger = true,
  withMenu = true,
} = {}) {
  const wrapper = new FakeElement('div');
  if (open) wrapper.classList.add(OPEN_CLASS);
  const trigger = new FakeElement('button');
  trigger.disabled = disabled;
  const menu = new FakeElement('div');
  if (withTrigger) wrapper.querySelectors.set(TRIGGER, trigger);
  if (withMenu) wrapper.querySelectors.set(MENU, menu);
  wrapper.querySelectorAlls.set(OPTION, options);
  trigger.ancestors.set(TRIGGER, trigger);
  trigger.ancestors.set(WRAPPER, wrapper);
  menu.ancestors.set(MENU, menu);
  for (const option of options) option.ancestors.set(WRAPPER, wrapper);
  return { wrapper, trigger, menu };
}

function makeRoot(wrappers) {
  return {
    querySelectorAll(selector) {
      return selector === WRAPPER ? wrappers : [];
    },
  };
}

function selectors() {
  return {
    wrapperSelector: WRAPPER,
    triggerSelector: TRIGGER,
    menuSelector: MENU,
    optionSelector: OPTION,
  };
}

function makeKeyEvent(key, target) {
  return {
    key,
    target,
    prevented: 0,
    stopped: 0,
    preventDefault() {
      this.prevented += 1;
    },
    stopPropagation() {
      this.stopped += 1;
    },
  };
}

test('syncs a rounded inline menu width from an odd scroll width', () => {
  const element = new FakeElement('div');
  element.scrollWidth = 100.4;
  assert.equal(syncWorkspaceInlineMenuExpandedWidth(element), 101);
  assert.deepEqual(element.style.properties, { '--workspace-inline-menu-expanded-width': '101px' });
});

test('syncs an exact scroll width unchanged', () => {
  const element = new FakeElement('div');
  element.scrollWidth = 250;
  assert.equal(syncWorkspaceInlineMenuExpandedWidth(element), 250);
  assert.equal(element.style.properties['--workspace-inline-menu-expanded-width'], '250px');
});

test('accepts a numeric string as the scroll width', () => {
  const element = new FakeElement('div');
  element.scrollWidth = '50';
  assert.equal(syncWorkspaceInlineMenuExpandedWidth(element), 50);
  assert.equal(element.style.properties['--workspace-inline-menu-expanded-width'], '50px');
});

test('returns zero and writes nothing for a non positive scroll width', () => {
  const zero = new FakeElement('div');
  zero.scrollWidth = 0;
  assert.ok(syncWorkspaceInlineMenuExpandedWidth(zero) === 0);
  assert.deepEqual(zero.style.properties, {});

  const negative = new FakeElement('div');
  negative.scrollWidth = -3;
  assert.ok(syncWorkspaceInlineMenuExpandedWidth(negative) === 0);
  assert.deepEqual(negative.style.properties, {});

  const fractional = new FakeElement('div');
  fractional.scrollWidth = -0.5;
  assert.ok(syncWorkspaceInlineMenuExpandedWidth(fractional) === 0);
});

test('returns zero for a missing element or an unusable scroll width', () => {
  assert.ok(syncWorkspaceInlineMenuExpandedWidth(undefined) === 0);
  assert.ok(syncWorkspaceInlineMenuExpandedWidth(null) === 0);
  assert.ok(syncWorkspaceInlineMenuExpandedWidth({}) === 0);
  assert.ok(syncWorkspaceInlineMenuExpandedWidth({ scrollWidth: NaN }) === 0);
  assert.ok(syncWorkspaceInlineMenuExpandedWidth({ scrollWidth: 'abc' }) === 0);
  assert.ok(syncWorkspaceInlineMenuExpandedWidth({ scrollWidth: null }) === 0);
});

test('returns the width even when the element has no style object', () => {
  assert.equal(syncWorkspaceInlineMenuExpandedWidth({ scrollWidth: 42 }), 42);
});

test('exposes a frozen controller api', () => {
  const controller = createWorkspaceMenuController();
  assert.ok(Object.isFrozen(controller));
  assert.deepEqual(Object.keys(controller).sort(), ['close', 'handleKeyDown', 'open', 'toggle']);
  for (const fn of Object.values(controller)) assert.equal(typeof fn, 'function');
});

test('survives being created without any options', () => {
  const controller = createWorkspaceMenuController();
  assert.doesNotThrow(() => controller.close());
  assert.equal(controller.open(undefined), false);
  assert.equal(controller.toggle(undefined), false);
  assert.equal(controller.handleKeyDown({}), false);
  assert.equal(controller.handleKeyDown(), false);
});

test('closes every open wrapper and flips its aria state', () => {
  const first = makeWrapper({ open: true });
  const second = makeWrapper({ open: true });
  const controller = createWorkspaceMenuController({
    ...selectors(),
    root: makeRoot([first.wrapper, second.wrapper]),
  });
  controller.close();
  for (const entry of [first, second]) {
    assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
    assert.equal(entry.trigger.attributes['aria-expanded'], 'false');
    assert.equal(entry.menu.attributes['aria-hidden'], 'true');
  }
});

test('close skips the named wrapper and any already closed wrapper', () => {
  const kept = makeWrapper({ open: true });
  const other = makeWrapper({ open: true });
  const closed = makeWrapper();
  const controller = createWorkspaceMenuController({
    ...selectors(),
    root: makeRoot([kept.wrapper, other.wrapper, closed.wrapper]),
  });
  controller.close(kept.wrapper);
  assert.equal(kept.wrapper.classList.contains(OPEN_CLASS), true);
  assert.equal(kept.trigger.attributes['aria-expanded'], undefined);
  assert.equal(kept.menu.attributes['aria-hidden'], undefined);
  assert.equal(other.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(closed.trigger.attributes['aria-expanded'], undefined);
});

test('open requires a wrapper, a trigger and a menu', () => {
  const noMenu = makeWrapper({ withMenu: false });
  const noTrigger = makeWrapper({ withTrigger: false });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([]) });
  assert.equal(controller.open(undefined), false);
  assert.equal(controller.open(null), false);
  assert.equal(controller.open(noMenu.wrapper), false);
  assert.equal(controller.open(noTrigger.wrapper), false);
  assert.equal(noMenu.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(noTrigger.wrapper.classList.contains(OPEN_CLASS), false);
});

test('open refuses a disabled trigger', () => {
  const entry = makeWrapper({ disabled: true });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.open(entry.wrapper, entry.trigger), false);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(entry.trigger.attributes['aria-expanded'], undefined);
});

test('open closes the other wrappers and reveals the requested menu', () => {
  const first = makeWrapper({ open: true });
  const second = makeWrapper();
  const controller = createWorkspaceMenuController({
    ...selectors(),
    root: makeRoot([first.wrapper, second.wrapper]),
  });
  assert.equal(controller.open(second.wrapper, second.trigger), true);
  assert.equal(first.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(first.trigger.attributes['aria-expanded'], 'false');
  assert.equal(first.menu.attributes['aria-hidden'], 'true');
  assert.equal(second.wrapper.classList.contains(OPEN_CLASS), true);
  assert.equal(second.trigger.attributes['aria-expanded'], 'true');
  assert.equal(second.menu.attributes['aria-hidden'], 'false');
});

test('open derives the trigger from the wrapper when it is omitted', () => {
  const entry = makeWrapper();
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.open(entry.wrapper), true);
  assert.equal(entry.trigger.attributes['aria-expanded'], 'true');
});

test('open honours a custom open class', () => {
  const entry = makeWrapper();
  const controller = createWorkspaceMenuController({
    ...selectors(),
    root: makeRoot([entry.wrapper]),
    openClass: 'open',
  });
  assert.equal(controller.open(entry.wrapper, entry.trigger), true);
  assert.equal(entry.wrapper.classList.contains('open'), true);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
});

test('resolves the root through an accessor on every call', () => {
  const first = makeWrapper({ open: true });
  const second = makeWrapper({ open: true });
  let current = makeRoot([first.wrapper]);
  const controller = createWorkspaceMenuController({ ...selectors(), root: () => current });
  controller.close();
  assert.equal(first.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(second.wrapper.classList.contains(OPEN_CLASS), true);
  current = makeRoot([second.wrapper]);
  controller.close();
  assert.equal(second.wrapper.classList.contains(OPEN_CLASS), false);
});

test('toggle ignores an element that is not inside a wrapper', () => {
  const outsider = new FakeElement('button');
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([]) });
  assert.equal(controller.toggle(outsider), false);
  assert.equal(controller.toggle({}), false);
});

test('toggle refuses a disabled element', () => {
  const entry = makeWrapper();
  const element = new FakeElement('button');
  element.disabled = true;
  element.ancestors.set(WRAPPER, entry.wrapper);
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.toggle(element), false);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
});

test('toggle closes an already open wrapper', () => {
  const entry = makeWrapper({ open: true });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.toggle(entry.trigger), false);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(entry.trigger.attributes['aria-expanded'], 'false');
});

test('toggle opens a closed wrapper', () => {
  const entry = makeWrapper();
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.toggle(entry.trigger), true);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), true);
  assert.equal(entry.menu.attributes['aria-hidden'], 'false');
});

test('handleKeyDown ignores events that hit no control', () => {
  const entry = makeWrapper({ open: true, options: [makeOption()] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const plain = new FakeElement('div');
  assert.equal(controller.handleKeyDown({}), false);
  assert.equal(controller.handleKeyDown({ key: 'ArrowDown' }), false);
  assert.equal(controller.handleKeyDown({ key: 'ArrowDown', target: plain }), false);
});

test('an arrow key on a trigger opens the menu and focuses the first enabled option', () => {
  const blocked = makeOption({ disabled: true });
  const first = makeOption();
  const ariaBlocked = makeOption({ ariaDisabled: 'true' });
  const last = makeOption();
  const entry = makeWrapper({ options: [blocked, first, ariaBlocked, last] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('ArrowDown', entry.trigger);
  assert.equal(controller.handleKeyDown(event), true);
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), true);
  assert.equal(entry.trigger.attributes['aria-expanded'], 'true');
  assert.deepEqual(first.focusCalls, [{ preventScroll: true }]);
  assert.equal(blocked.focusCalls.length, 0);
  assert.equal(ariaBlocked.focusCalls.length, 0);
  assert.equal(last.focusCalls.length, 0);
});

test('an up arrow on a trigger focuses the last enabled option', () => {
  const first = makeOption();
  const last = makeOption();
  const blocked = makeOption({ disabled: true });
  const entry = makeWrapper({ options: [first, last, blocked] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('ArrowUp', entry.trigger);
  assert.equal(controller.handleKeyDown(event), true);
  assert.deepEqual(last.focusCalls, [{ preventScroll: true }]);
  assert.equal(first.focusCalls.length, 0);
});

test('an arrow key on a trigger leaves a disabled menu untouched', () => {
  const option = makeOption();
  const entry = makeWrapper({ disabled: true, options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('ArrowDown', entry.trigger);
  assert.equal(controller.handleKeyDown(event), false);
  assert.equal(event.prevented, 0);
  assert.equal(event.stopped, 0);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(option.focusCalls.length, 0);
});

test('escape on an open trigger closes the menu and refocuses the trigger', () => {
  const entry = makeWrapper({ open: true, options: [makeOption()] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('Escape', entry.trigger);
  assert.equal(controller.handleKeyDown(event), true);
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
  assert.equal(entry.trigger.attributes['aria-expanded'], 'false');
  assert.deepEqual(entry.trigger.focusCalls, [undefined]);
});

test('escape on a closed trigger falls through to the option guard', () => {
  const entry = makeWrapper({ options: [makeOption()] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('Escape', entry.trigger);
  assert.equal(controller.handleKeyDown(event), false);
  assert.equal(event.prevented, 0);
  assert.equal(entry.trigger.focusCalls.length, 0);
});

test('escape on an option closes the menu and focuses the trigger', () => {
  const option = makeOption();
  const entry = makeWrapper({ open: true, options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('Escape', option);
  assert.equal(controller.handleKeyDown(event), true);
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);
  assert.equal(entry.wrapper.classList.contains(OPEN_CLASS), false);
  assert.deepEqual(entry.trigger.focusCalls, [undefined]);
});

test('escape on a lone option without a wrapper does nothing', () => {
  const option = makeOption();
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([]) });
  const event = makeKeyEvent('Escape', option);
  assert.equal(controller.handleKeyDown(event), false);
  assert.equal(event.prevented, 0);
});

test('a down arrow on an option steps to the next enabled option', () => {
  const first = makeOption();
  const second = makeOption();
  const blocked = makeOption({ disabled: true });
  const third = makeOption();
  const entry = makeWrapper({ open: true, options: [first, second, blocked, third] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('ArrowDown', second);
  assert.equal(controller.handleKeyDown(event), true);
  assert.equal(event.prevented, 1);
  assert.deepEqual(third.focusCalls, [{ preventScroll: true }]);
  assert.equal(blocked.focusCalls.length, 0);
});

test('a down arrow on the last option wraps to the first', () => {
  const first = makeOption();
  const second = makeOption();
  const entry = makeWrapper({ open: true, options: [first, second] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.handleKeyDown(makeKeyEvent('ArrowDown', second)), true);
  assert.deepEqual(first.focusCalls, [{ preventScroll: true }]);
});

test('an up arrow on the first option wraps to the last', () => {
  const first = makeOption();
  const second = makeOption();
  const third = makeOption();
  const entry = makeWrapper({ open: true, options: [first, second, third] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.handleKeyDown(makeKeyEvent('ArrowUp', first)), true);
  assert.deepEqual(third.focusCalls, [{ preventScroll: true }]);
  assert.equal(second.focusCalls.length, 0);
});

test('home and end jump to the first and last enabled options', () => {
  const first = makeOption();
  const second = makeOption();
  const third = makeOption();
  const entry = makeWrapper({ open: true, options: [first, second, third] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.handleKeyDown(makeKeyEvent('Home', second)), true);
  assert.deepEqual(first.focusCalls, [{ preventScroll: true }]);
  assert.equal(controller.handleKeyDown(makeKeyEvent('End', second)), true);
  assert.deepEqual(third.focusCalls, [{ preventScroll: true }]);
});

test('an unsupported key on an option is ignored', () => {
  const first = makeOption();
  const second = makeOption();
  const entry = makeWrapper({ open: true, options: [first, second] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('a', second);
  assert.equal(controller.handleKeyDown(event), false);
  assert.equal(event.prevented, 0);
  assert.equal(first.focusCalls.length, 0);
  assert.equal(second.focusCalls.length, 0);
});

test('a disabled option is not a valid navigation target', () => {
  const first = makeOption();
  const blocked = makeOption({ disabled: true });
  const entry = makeWrapper({ open: true, options: [first, blocked] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  const event = makeKeyEvent('ArrowDown', blocked);
  assert.equal(controller.handleKeyDown(event), false);
  assert.equal(event.prevented, 0);
  assert.equal(first.focusCalls.length, 0);
});

test('focus retries through requestAnimationFrame until the option is active', () => {
  const option = makeOption();
  const frames = [];
  const documentObject = {
    activeElement: null,
    defaultView: {
      requestAnimationFrame(callback) {
        frames.push(callback);
        return frames.length;
      },
    },
  };
  option.ownerDocument = documentObject;
  const entry = makeWrapper({ open: false, options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.handleKeyDown(makeKeyEvent('ArrowDown', entry.trigger)), true);
  assert.deepEqual(option.focusCalls, [{ preventScroll: true }]);
  assert.equal(frames.length, 1);

  frames[0]();
  assert.equal(option.focusCalls.length, 2);
  assert.equal(frames.length, 2);

  documentObject.activeElement = option;
  frames[1]();
  assert.equal(option.focusCalls.length, 3);
  assert.equal(frames.length, 2);
});

test('focus does not schedule a retry when the option is already active', () => {
  const option = makeOption();
  const frames = [];
  const documentObject = {
    activeElement: null,
    defaultView: {
      requestAnimationFrame(callback) {
        frames.push(callback);
      },
    },
  };
  option.ownerDocument = documentObject;
  const entry = makeWrapper({ options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  documentObject.activeElement = option;
  assert.equal(controller.handleKeyDown(makeKeyEvent('ArrowDown', entry.trigger)), true);
  assert.deepEqual(option.focusCalls, [{ preventScroll: true }]);
  assert.equal(frames.length, 0);
});

test('focus tolerates a document without requestAnimationFrame', () => {
  const option = makeOption();
  option.ownerDocument = { activeElement: null };
  const entry = makeWrapper({ options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.doesNotThrow(() => controller.handleKeyDown(makeKeyEvent('ArrowDown', entry.trigger)));
  assert.equal(option.focusCalls.length, 1);
});

test('focus falls back to a plain focus call when options are rejected', () => {
  const option = makeOption();
  option.focusImpl = (options) => {
    if (options) throw new Error('rejected');
  };
  const entry = makeWrapper({ options: [option] });
  const controller = createWorkspaceMenuController({ ...selectors(), root: makeRoot([entry.wrapper]) });
  assert.equal(controller.handleKeyDown(makeKeyEvent('ArrowDown', entry.trigger)), true);
  assert.deepEqual(option.focusCalls, [{ preventScroll: true }, undefined]);
});

test('does not mutate the caller options object', () => {
  const entry = makeWrapper();
  const options = { ...selectors(), root: makeRoot([entry.wrapper]) };
  const snapshot = { ...options };
  const controller = createWorkspaceMenuController(options);
  controller.open(entry.wrapper);
  controller.close();
  controller.toggle(entry.trigger);
  assert.deepEqual(options, snapshot);
  assert.equal(Object.keys(options).length, 5);
});
