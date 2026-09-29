import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementResultHistoryLayout } from './personReplacementResultHistoryLayout.js';

const SIZE = '--person-replacement-results-height';

function makeLayout() {
  const writes = [];
  const classes = [];
  return {
    writes,
    classes,
    style: {
      setProperty: (name, value) => writes.push([name, value]),
    },
    classList: {
      add: (name) => classes.push(['add', name]),
      remove: (name) => classes.push(['remove', name]),
    },
    getAnimations: () => [
      { transitionProperty: SIZE },
      { transitionProperty: 'opacity' },
      { transitionProperty: SIZE },
    ],
  };
}

function makeHarness({ height = 120, content = true, resizeObserver = true } = {}) {
  const observed = [];
  const disconnects = [];
  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      observed.push(this);
    }
    observe(element) {
      this.element = element;
    }
    disconnect() {
      disconnects.push(this);
    }
  }
  const layout = makeLayout();
  const contentNode = content ? { getBoundingClientRect: () => ({ height }) } : null;
  const host = {
    closest: (selector) => (selector === '.person-replacement-middle-layout' ? layout : null),
    querySelector: (selector) =>
      selector === '.person-replacement-result-history-content' ? contentNode : null,
    ownerDocument: { defaultView: resizeObserver ? { ResizeObserver: FakeResizeObserver } : {} },
  };
  return { host, layout, contentNode, observed, disconnects, FakeResizeObserver };
}

test('createPersonReplacementResultHistoryLayout exposes a frozen api', () => {
  const controller = createPersonReplacementResultHistoryLayout();
  assert.deepEqual(Object.keys(controller).sort(), ['destroy', 'hide', 'show']);
  assert.equal(Object.isFrozen(controller), true);
});

test('the first show only writes the measured height', () => {
  const { host, layout, observed } = makeHarness({ height: 120 });
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  assert.deepEqual(layout.writes, [[SIZE, '120px']]);
  assert.deepEqual(layout.classes, []);
  assert.equal(observed.length, 1);
  assert.equal(observed[0].element.getBoundingClientRect().height, 120);
});

test('show reuses the observer and re-measures when nothing changed', () => {
  const { host, layout, observed, disconnects } = makeHarness({ height: 64 });
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  controller.show(host);
  assert.equal(observed.length, 1);
  assert.deepEqual(disconnects, []);
  assert.deepEqual(layout.writes, [
    [SIZE, '64px'],
    [SIZE, '64px'],
  ]);
});

test('switching layout resets the old height to zero before measuring the new one', () => {
  const first = makeHarness({ height: 120 });
  const second = makeHarness({ height: 64 });
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(first.host);
  controller.show(second.host);
  assert.deepEqual(first.layout.writes, [
    [SIZE, '120px'],
    [SIZE, '0px'],
  ]);
  assert.deepEqual(first.layout.classes, [
    ['add', 'is-results-layout-static'],
    ['remove', 'is-results-layout-static'],
  ]);
  assert.deepEqual(second.layout.writes, [[SIZE, '64px']]);
  assert.deepEqual(first.disconnects, [first.observed[0]]);
  assert.equal(second.observed.length, 1);
});

test('hide animates to zero without the static class when asked', () => {
  const { host, layout, disconnects } = makeHarness();
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  const before = layout.classes.length;
  controller.hide({ animate: true });
  assert.deepEqual(layout.writes.at(-1), [SIZE, '0px']);
  assert.equal(layout.classes.length, before);
  assert.equal(disconnects.length, 1);
});

test('hide freezes the layout while it animates out by default', () => {
  const { host, layout, disconnects } = makeHarness();
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  const before = layout.classes.length;
  controller.hide();
  assert.deepEqual(layout.writes.at(-1), [SIZE, '0px']);
  assert.deepEqual(layout.classes.slice(before), [
    ['add', 'is-results-layout-static'],
    ['remove', 'is-results-layout-static'],
  ]);
  assert.equal(disconnects.length, 1);
});

test('destroy clears the state so later calls stop writing', () => {
  const { host, layout, disconnects } = makeHarness();
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  controller.destroy();
  const writes = layout.writes.length;
  const classes = layout.classes.length;
  controller.hide();
  assert.equal(layout.writes.length, writes);
  assert.equal(layout.classes.length, classes);
  assert.equal(disconnects.length, 1);
});

test('show tolerates a host without a ResizeObserver', () => {
  const { host, layout, observed } = makeHarness({ resizeObserver: false, height: 48 });
  const controller = createPersonReplacementResultHistoryLayout();
  assert.doesNotThrow(() => controller.show(host));
  assert.equal(observed.length, 0);
  assert.deepEqual(layout.writes, [[SIZE, '48px']]);
});

test('show tolerates a layout without getAnimations', () => {
  const { host, layout } = makeHarness();
  delete layout.getAnimations;
  const controller = createPersonReplacementResultHistoryLayout();
  assert.doesNotThrow(() => controller.show(host));
  assert.deepEqual(layout.writes, [[SIZE, '120px']]);
});

test('show writes nothing when the content element is missing', () => {
  const { host, layout, observed } = makeHarness({ content: false });
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  assert.deepEqual(layout.writes, []);
  assert.equal(observed.length, 0);
});

test('show does not apply an unusable height', () => {
  const { host, layout } = makeHarness();
  host.querySelector = (selector) =>
    selector === '.person-replacement-result-history-content'
      ? { getBoundingClientRect: () => ({}) }
      : host.querySelector(selector);
  const controller = createPersonReplacementResultHistoryLayout();
  controller.show(host);
  assert.deepEqual(layout.writes, []);
});
