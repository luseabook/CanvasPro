import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementExportSubmenuController } from './personReplacementExportSubmenuController.js';

const GROUP = '[data-person-replacement-export-group]';
const TRIGGER = '[data-person-replacement-export-submenu-trigger]';
const SUBMENU = '[data-person-replacement-export-submenu]';
const OPTION = SUBMENU + ' .story-canvas-sync-option';
const NEXT_OPTION = OPTION + ':not(:disabled)';

function makeOption({ disabled = false, ariaDisabled = null, label = '' } = {}) {
  const state = { focused: 0 };
  const option = {
    disabled,
    label,
    state,
    closest: (selector) => (selector === '.story-canvas-sync-option' ? option : null),
    getAttribute: (name) => (name === 'aria-disabled' ? ariaDisabled : null),
    focus: () => {
      state.focused += 1;
    },
  };
  return option;
}

function makeGroup({ options = [], disabled = false } = {}) {
  const triggerState = { focused: 0 };
  const trigger = {
    attrs: {},
    disabled,
    triggerState,
    setAttribute: (name, value) => {
      trigger.attrs[name] = value;
    },
    closest: (selector) => (selector === TRIGGER ? trigger : null),
    focus: () => {
      triggerState.focused += 1;
    },
  };
  const submenu = {
    attrs: {},
    setAttribute: (name, value) => {
      submenu.attrs[name] = value;
    },
  };
  const classes = new Set();
  const group = {
    classes,
    trigger,
    submenu,
    options,
    classList: {
      toggle: (name, on) => {
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    querySelector: (selector) => {
      if (selector === TRIGGER) return trigger;
      if (selector === SUBMENU) return submenu;
      if (selector === NEXT_OPTION) {
        return (
          options.find((option) => !option.disabled && option.getAttribute('aria-disabled') !== 'true') ||
          null
        );
      }
      return null;
    },
    querySelectorAll: (selector) => (selector === OPTION ? options : null),
    contains: (element) => element === group || options.includes(element) || element === trigger,
  };
  const resolveClosest = (selector) => {
    if (selector === TRIGGER) return trigger;
    if (selector === GROUP) return group;
    return null;
  };
  trigger.closest = resolveClosest;
  for (const option of options) {
    const base = option.closest;
    option.closest = (selector) => (selector === GROUP ? group : base(selector));
  }
  return group;
}

function makeEvent({ target = null, relatedTarget = null, key = undefined } = {}) {
  const record = { prevented: 0, stopped: 0 };
  return {
    record,
    event: {
      target,
      relatedTarget,
      key,
      preventDefault: () => {
        record.prevented += 1;
      },
      stopPropagation: () => {
        record.stopped += 1;
      },
    },
  };
}

function makeRoot(groups) {
  return {
    querySelectorAll: (selector) => (selector === GROUP ? groups : null),
    contains: (element) => groups.includes(element),
  };
}

test('createPersonReplacementExportSubmenuController exposes a frozen handler set', () => {
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([]) });
  assert.deepEqual(Object.keys(controller).sort(), [
    'close',
    'handleClick',
    'handleFocusIn',
    'handleFocusOut',
    'handleKeyDown',
    'handlePointerOut',
    'handlePointerOver',
  ]);
  assert.equal(Object.isFrozen(controller), true);
});

test('close collapses every group, optionally sparing one', () => {
  const first = makeGroup();
  const second = makeGroup();
  first.classList.toggle('is-open', true);
  second.classList.toggle('is-open', true);
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([first, second]) });
  controller.close();
  assert.equal(first.classList.contains('is-open'), false);
  assert.equal(second.classList.contains('is-open'), false);
  assert.equal(first.trigger.attrs['aria-expanded'], 'false');
  assert.equal(first.submenu.attrs['aria-hidden'], 'true');

  first.classList.toggle('is-open', true);
  second.classList.toggle('is-open', true);
  controller.close(second);
  assert.equal(first.classList.contains('is-open'), false);
  assert.equal(second.classList.contains('is-open'), true);
});

test('close tolerates a missing root', () => {
  const controller = createPersonReplacementExportSubmenuController({});
  assert.doesNotThrow(() => controller.close());
  assert.equal(controller.handleClick(makeEvent().event), false);
});

test('handleClick opens the submenu of a pressed trigger', () => {
  const group = makeGroup();
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
  const { event, record } = makeEvent({ target: group.trigger });
  assert.equal(controller.handleClick(event), true);
  assert.equal(group.classList.contains('is-open'), true);
  assert.equal(group.trigger.attrs['aria-expanded'], 'true');
  assert.equal(group.submenu.attrs['aria-hidden'], 'false');
  assert.deepEqual(record, { prevented: 1, stopped: 0 });
});

test('handleClick ignores a disabled trigger and unknown targets', () => {
  const group = makeGroup({ disabled: true });
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
  assert.equal(controller.handleClick(makeEvent({ target: group.trigger }).event), false);
  assert.equal(group.classList.contains('is-open'), false);
  assert.equal(controller.handleClick(makeEvent({ target: null }).event), false);
  const outside = { closest: () => null };
  assert.equal(controller.handleClick(makeEvent({ target: outside }).event), false);
});

test('handlePointerOver and handleFocusIn open the hovered group', () => {
  const group = makeGroup();
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
  assert.equal(
    controller.handlePointerOver(makeEvent({ target: group.options[0] || group.trigger }).event),
    true,
  );
  assert.equal(group.classList.contains('is-open'), true);
  group.classList.toggle('is-open', false);
  assert.equal(controller.handleFocusIn(makeEvent({ target: group.trigger }).event), true);
  assert.equal(group.classList.contains('is-open'), true);
});

test('handlePointerOver and handleFocusIn report false without a group', () => {
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([]) });
  assert.equal(controller.handlePointerOver(makeEvent({ target: null }).event), false);
  assert.equal(controller.handleFocusIn(makeEvent({ target: null }).event), false);
});

test('handlePointerOut and handleFocusOut close only when the pointer leaves the group', () => {
  const option = makeOption({ label: 'a' });
  const group = makeGroup({ options: [option] });
  group.classList.toggle('is-open', true);
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });

  assert.equal(
    controller.handlePointerOut(makeEvent({ target: option, relatedTarget: option }).event),
    false,
  );
  assert.equal(group.classList.contains('is-open'), true);

  const outside = { closest: () => null };
  assert.equal(
    controller.handlePointerOut(makeEvent({ target: option, relatedTarget: outside }).event),
    true,
  );
  assert.equal(group.classList.contains('is-open'), false);

  group.classList.toggle('is-open', true);
  assert.equal(controller.handleFocusOut(makeEvent({ target: option, relatedTarget: option }).event), false);
  assert.equal(group.classList.contains('is-open'), true);
  assert.equal(controller.handleFocusOut(makeEvent({ target: option, relatedTarget: outside }).event), true);
  assert.equal(group.classList.contains('is-open'), false);
});

test('handleKeyDown opens on ArrowRight, Enter and Space and focuses the first enabled option', () => {
  for (const key of ['ArrowRight', 'Enter', ' ']) {
    const first = makeOption({ label: 'first' });
    const disabled = makeOption({ disabled: true, label: 'disabled' });
    const group = makeGroup({ options: [disabled, first] });
    const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
    const { event, record } = makeEvent({ target: group.trigger, key });
    assert.equal(controller.handleKeyDown(event), true, key);
    assert.equal(group.classList.contains('is-open'), true);
    assert.equal(first.state.focused, 1, key);
    assert.deepEqual(record, { prevented: 1, stopped: 1 });
  }
});

test('handleKeyDown closes and returns focus to the trigger on ArrowLeft and Escape', () => {
  for (const key of ['ArrowLeft', 'Escape']) {
    const option = makeOption({ label: 'a' });
    const group = makeGroup({ options: [option] });
    group.classList.toggle('is-open', true);
    const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
    const { event, record } = makeEvent({ target: option, key });
    assert.equal(controller.handleKeyDown(event), true, key);
    assert.equal(group.classList.contains('is-open'), false);
    assert.equal(group.trigger.triggerState.focused, 1, key);
    assert.deepEqual(record, { prevented: 1, stopped: 1 });
  }
});

test('handleKeyDown walks the option list with Arrow, Home and End', () => {
  const cases = [
    ['ArrowDown', 0, 1],
    ['ArrowDown', 2, 0],
    ['ArrowUp', 0, 2],
    ['ArrowUp', 1, 0],
    ['Home', 2, 0],
    ['End', 0, 2],
  ];
  for (const [key, from, expected] of cases) {
    const options = [makeOption({ label: 'a' }), makeOption({ label: 'b' }), makeOption({ label: 'c' })];
    const group = makeGroup({ options });
    const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
    controller.handleKeyDown(makeEvent({ target: options[from], key }).event);
    assert.equal(options[expected].state.focused, 1, `${key} from ${from}`);
  }
});

test('handleKeyDown skips disabled and aria-disabled options', () => {
  const options = [
    makeOption({ label: 'a' }),
    makeOption({ disabled: true, label: 'b' }),
    makeOption({ label: 'c', ariaDisabled: 'true' }),
  ];
  const group = makeGroup({ options });
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
  controller.handleKeyDown(makeEvent({ target: options[0], key: 'ArrowDown' }).event);
  assert.equal(options[0].state.focused, 1);
  assert.equal(options[1].state.focused, 0);
  assert.equal(options[2].state.focused, 0);
});

test('handleKeyDown ignores keys on unrelated targets', () => {
  const option = makeOption({ label: 'a' });
  const group = makeGroup({ options: [option] });
  const controller = createPersonReplacementExportSubmenuController({ root: makeRoot([group]) });
  const outside = { closest: () => null };
  assert.equal(controller.handleKeyDown(makeEvent({ target: outside, key: 'ArrowDown' }).event), false);
  assert.equal(controller.handleKeyDown(makeEvent({ target: group.trigger, key: 'Tab' }).event), false);
  assert.equal(controller.handleKeyDown(makeEvent({ target: null, key: 'ArrowDown' }).event), false);
});

test('createPersonReplacementExportSubmenuController accepts a root resolver function', () => {
  const group = makeGroup();
  let resolved = 0;
  const controller = createPersonReplacementExportSubmenuController({
    root: () => {
      resolved += 1;
      return makeRoot([group]);
    },
  });
  assert.equal(controller.handleClick(makeEvent({ target: group.trigger }).event), true);
  assert.equal(resolved > 0, true);
});
