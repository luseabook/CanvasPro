import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderStatusTooltipController } from './providerStatusTooltipController.js';

function element(over = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();
  const styleVars = new Map();
  const node = {
    className: '',
    dataset: {},
    hidden: false,
    textContent: '',
    rect: 'rect' in over ? over.rect : { left: 0, top: 0, width: 0, height: 0 },
    modal: 'modal' in over ? over.modal : null,
    attributes,
    styleVars,
    style: {
      setProperty(name, value) {
        styleVars.set(name, String(value));
      },
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    getBoundingClientRect() {
      return node.rect;
    },
    closest(selector) {
      assert.equal(selector, '.settings-modal');
      return node.modal;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    emit(type) {
      for (const listener of [...(listeners.get(type) || [])]) listener();
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
  if ('tooltipText' in over) node.attributes.set('data-provider-test-tooltip', over.tooltipText);
  return node;
}

function installGlobals(t, over = {}) {
  const appended = [];
  const created = [];
  const document = {
    body: 'body' in over ? over.body : { appendChild: (child) => appended.push(child) },
    createElement(tag) {
      assert.equal(tag, 'div');
      const node = element({ rect: 'tooltipRect' in over ? over.tooltipRect : { width: 200, height: 40 } });
      created.push(node);
      return node;
    },
  };
  const window = 'window' in over ? over.window : { innerWidth: 800 };
  const previous = ['document', 'window'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: window });
  t.after(() => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { appended, created };
}

test('bind ignores nullish elements', (t) => {
  installGlobals(t);
  const controller = createProviderStatusTooltipController();
  assert.equal(controller.bind(null), undefined);
  assert.equal(controller.bind(undefined), undefined);
});

test('bind requires an element carrying a dataset', (t) => {
  installGlobals(t);
  const controller = createProviderStatusTooltipController();
  assert.throws(() => controller.bind({}), TypeError);
});

test('bind marks the element and registers the four listeners once', (t) => {
  installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  assert.equal(trigger.dataset.providerTestTooltipBound, '1');
  for (const type of ['pointerenter', 'pointerleave', 'focus', 'blur']) {
    assert.equal(trigger.listenerCount(type), 1);
  }
  controller.bind(trigger);
  assert.equal(trigger.listenerCount('pointerenter'), 1);
});

test('pointerenter shows the trimmed tooltip text', (t) => {
  const { appended, created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '  需要密钥 \n' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  assert.equal(created.length, 1);
  assert.equal(appended.length, 1);
  const tooltip = created[0];
  assert.equal(tooltip.className, 'settings-provider-test-tooltip');
  assert.equal(tooltip.getAttribute('role'), 'tooltip');
  assert.equal(tooltip.textContent, '需要密钥');
  assert.equal(tooltip.hidden, false);
  assert.equal(tooltip.classList.contains('is-visible'), true);
});

test('an element without tooltip text shows nothing', (t) => {
  const { appended, created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '   ' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  assert.equal(created.length, 0);
  assert.equal(appended.length, 0);
});

test('pointerleave hides the tooltip again', (t) => {
  const { created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  trigger.emit('pointerleave');
  const tooltip = created[0];
  assert.equal(tooltip.hidden, true);
  assert.equal(tooltip.classList.contains('is-visible'), false);
});

test('focus and blur mirror enter and leave', (t) => {
  const { created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  trigger.emit('focus');
  assert.equal(created[0].hidden, false);
  trigger.emit('blur');
  assert.equal(created[0].hidden, true);
});

test('hiding a non-active element is ignored', (t) => {
  const { created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const first = element({ tooltipText: '第一个' });
  const second = element({ tooltipText: '第二个' });
  controller.bind(first);
  controller.bind(second);
  first.emit('pointerenter');
  second.emit('pointerleave');
  assert.equal(created[0].hidden, false);
  assert.equal(created[0].textContent, '第一个');
});

test('hiding without an argument always hides', (t) => {
  const { created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  controller.hide();
  assert.equal(created[0].hidden, true);
});

test('hiding before any tooltip exists is safe', (t) => {
  const { created } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  assert.equal(controller.hide(), undefined);
  assert.equal(controller.hide('anything'), undefined);
  assert.equal(created.length, 0);
});

test('switching triggers reuses the single tooltip element', (t) => {
  const { created, appended } = installGlobals(t);
  const controller = createProviderStatusTooltipController();
  const first = element({ tooltipText: '甲' });
  const second = element({ tooltipText: '乙' });
  controller.bind(first);
  controller.bind(second);
  first.emit('pointerenter');
  second.emit('pointerenter');
  assert.equal(created.length, 1);
  assert.equal(appended.length, 1);
  assert.equal(created[0].textContent, '乙');
});

test('positioning follows the frozen centred-above formula', (t) => {
  const { created } = installGlobals(t, { tooltipRect: { width: 200, height: 40 } });
  const controller = createProviderStatusTooltipController();
  const trigger = element({
    tooltipText: '就绪',
    rect: { left: 100, top: 300, width: 60, height: 20 },
  });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  const tooltip = created[0];
  assert.equal(tooltip.style.left, '30px');
  assert.equal(tooltip.style.top, '248px');
  assert.equal(tooltip.styleVars.get('--settings-provider-test-tooltip-arrow-left'), '100px');
});

test('positioning clamps to the viewport gutter', (t) => {
  const { created } = installGlobals(t, { tooltipRect: { width: 200, height: 40 } });
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪', rect: { left: 0, top: 10, width: 10, height: 20 } });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  const tooltip = created[0];
  assert.equal(tooltip.style.left, '24px');
  assert.equal(tooltip.style.top, '24px');
  assert.equal(tooltip.styleVars.get('--settings-provider-test-tooltip-arrow-left'), '14px');
});

test('positioning clamps to the right edge on a narrow viewport', (t) => {
  const { created } = installGlobals(t, {
    tooltipRect: { width: 200, height: 40 },
    window: { innerWidth: 300 },
  });
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪', rect: { left: 500, top: 300, width: 100, height: 20 } });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  const tooltip = created[0];
  assert.equal(tooltip.style.left, '76px');
  assert.equal(tooltip.styleVars.get('--settings-provider-test-tooltip-arrow-left'), '186px');
});

test('a settings modal pushes the tooltip below its top edge', (t) => {
  const { created } = installGlobals(t, { tooltipRect: { width: 200, height: 40 } });
  const controller = createProviderStatusTooltipController();
  const modal = element({ rect: { left: 0, top: 100, width: 600, height: 400 } });
  const trigger = element({
    tooltipText: '就绪',
    rect: { left: 100, top: 105, width: 60, height: 20 },
    modal,
  });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  assert.equal(created[0].style.top, '110px');
});

test('a document without a body creates nothing', (t) => {
  const { created } = installGlobals(t, { body: null });
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  assert.equal(created.length, 0);
});

test('a missing window still shows the tooltip without positioning', (t) => {
  const { created } = installGlobals(t, { window: undefined });
  const controller = createProviderStatusTooltipController();
  const trigger = element({ tooltipText: '就绪' });
  controller.bind(trigger);
  trigger.emit('pointerenter');
  const tooltip = created[0];
  assert.equal(tooltip.hidden, false);
  assert.equal(tooltip.style.left, undefined);
  assert.equal(tooltip.styleVars.size, 0);
});
