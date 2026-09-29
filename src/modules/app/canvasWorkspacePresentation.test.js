import test from 'node:test';
import assert from 'node:assert/strict';

import { createCanvasWorkspacePresentation } from './canvasWorkspacePresentation.js';

function createHarness() {
  const calls = { renderer: [], warmup: [] };
  const root = {
    hidden: false,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      return value;
    },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll: () => [],
    getAnimations: () => [],
  };
  const renderer = {
    setPresentationActive(value) {
      calls.renderer.push(value);
    },
  };
  const warmup = {
    setPresentationActive(value) {
      calls.warmup.push(value);
    },
  };
  return { root, renderer, warmup, calls };
}

test('canvasWorkspacePresentation: 切换激活态会同时通知渲染器与预热器', () => {
  const harness = createHarness();
  const presentation = createCanvasWorkspacePresentation({
    root: harness.root,
    renderer: harness.renderer,
    warmup: harness.warmup,
  });

  presentation.setPresentationActive(true);
  assert.deepEqual(harness.calls.renderer, [true]);
  assert.deepEqual(harness.calls.warmup, [true]);

  presentation.setPresentationActive(false);
  assert.deepEqual(harness.calls.renderer, [true, false]);
  assert.deepEqual(harness.calls.warmup, [true, false]);
});

test('canvasWorkspacePresentation: 激活态同步到根节点的 hidden 与 aria-hidden', () => {
  const harness = createHarness();
  const presentation = createCanvasWorkspacePresentation({
    root: harness.root,
    renderer: harness.renderer,
    warmup: harness.warmup,
  });

  presentation.setPresentationActive(true);
  assert.equal(harness.root.hidden, false);
  assert.equal(harness.root.attributes['aria-hidden'], 'false');

  presentation.setPresentationActive(false);
  assert.equal(harness.root.hidden, true);
  assert.equal(harness.root.attributes['aria-hidden'], 'true');
});

test('canvasWorkspacePresentation: 预热器可省，渲染器仍会被通知', () => {
  const harness = createHarness();
  const presentation = createCanvasWorkspacePresentation({ root: harness.root, renderer: harness.renderer });
  presentation.setPresentationActive(true);
  assert.deepEqual(harness.calls.renderer, [true]);
  assert.equal(harness.root.hidden, false);
});

test('canvasWorkspacePresentation: 重复设置同一状态可反复调用，不报错', () => {
  const harness = createHarness();
  const presentation = createCanvasWorkspacePresentation({
    root: harness.root,
    renderer: harness.renderer,
    warmup: harness.warmup,
  });
  presentation.setPresentationActive(true);
  presentation.setPresentationActive(true);
  assert.deepEqual(harness.calls.renderer, [true, true]);
});

test('canvasWorkspacePresentation: destroy 会收尾并把根节点置为隐藏', () => {
  const harness = createHarness();
  const presentation = createCanvasWorkspacePresentation({
    root: harness.root,
    renderer: harness.renderer,
    warmup: harness.warmup,
  });
  presentation.setPresentationActive(true);
  presentation.destroy();
  assert.equal(harness.root.hidden, true);
  assert.equal(harness.root.attributes['aria-hidden'], 'true');
});
