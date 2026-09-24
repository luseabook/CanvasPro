import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeStoryboard3DBackgroundCalibrationDrag,
  computeStoryboard3DBackgroundGuideGeometry,
  createStoryboard3DBackgroundCalibrationInteraction,
  normalizeStoryboard3DBackgroundPointer,
  previewStoryboard3DBackgroundCalibration,
} from './backgroundCalibrationInteraction.js';

function fakeElement() {
  const attributes = {};
  return {
    attributes,
    value: '',
    textContent: '',
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
  };
}

function fakeRoot() {
  const singles = new Map();
  const multiples = new Map();
  const handlers = new Map();
  return {
    singles,
    multiples,
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (handlers.get(type) === handler) handlers.delete(type);
    },
    dispatch(type, event) {
      handlers.get(type)?.(event);
    },
    hasHandler(type) {
      return typeof handlers.get(type) === 'function';
    },
    contains: () => true,
    querySelector(selector) {
      return singles.get(selector) || null;
    },
    querySelectorAll(selector) {
      return multiples.get(selector) || [];
    },
  };
}

function fakeWindow() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      const list = listeners.get(type) || [];
      list.push(handler);
      listeners.set(type, list);
    },
    removeEventListener(type, handler) {
      const list = listeners.get(type) || [];
      const index = list.indexOf(handler);
      if (index >= 0) list.splice(index, 1);
    },
    count(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event) {
      for (const handler of [...(listeners.get(type) || [])]) handler(event);
    },
  };
}

function guideStub() {
  const classes = new Set();
  return {
    classes,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
}

function handleStub(mode, { rect = { left: 0, top: 0, width: 100, height: 100 } } = {}) {
  const guide = guideStub();
  return {
    guide,
    captured: [],
    released: [],
    getAttribute: () => mode,
    ownerSVGElement: { getBoundingClientRect: () => rect },
    closest: (selector) => (selector === '.storyboard-3d-background-calibration-guide' ? guide : null),
    setPointerCapture(id) {
      this.captured.push(id);
    },
    releasePointerCapture(id) {
      this.released.push(id);
    },
  };
}

function pointerEvent(overrides = {}) {
  return {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    preventDefault() {},
    stopImmediatePropagation() {},
    ...overrides,
  };
}

test('背景校准交互：指针坐标按矩形归一化并夹紧', () => {
  assert.deepEqual(
    normalizeStoryboard3DBackgroundPointer(pointerEvent({ clientX: 50, clientY: 25 }), {
      left: 0,
      top: 0,
      width: 100,
      height: 50,
    }),
    {
      x: 0.5,
      y: 0.5,
    },
  );
  assert.deepEqual(
    normalizeStoryboard3DBackgroundPointer(pointerEvent({ clientX: 110, clientY: 70 }), {
      left: 10,
      top: 20,
      width: 200,
      height: 100,
    }),
    {
      x: 0.5,
      y: 0.5,
    },
  );
  assert.deepEqual(
    normalizeStoryboard3DBackgroundPointer(pointerEvent({ clientX: -50, clientY: 500 }), {
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    }),
    { x: 0, y: 1 },
  );
  assert.deepEqual(
    normalizeStoryboard3DBackgroundPointer(pointerEvent({ clientX: 5, clientY: 5 }), {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    }),
    { x: 1, y: 1 },
  );
  assert.deepEqual(normalizeStoryboard3DBackgroundPointer(undefined, undefined), { x: 0, y: 0 });
});

test('背景校准交互：拖动地平线同步消失点', () => {
  const result = computeStoryboard3DBackgroundCalibrationDrag({
    mode: 'horizon',
    background: { horizonY: 0.5, horizonSlope: 0, vanishingPoint: [0.5, 0.5] },
    startPoint: { x: 0.5, y: 0.5 },
    currentPoint: { x: 0.5, y: 0.3 },
  });
  assert.ok(Math.abs(result.horizonY - 0.3) < 1e-9);
  assert.deepEqual(result.vanishingPoint, [0.5, result.horizonY]);
  assert.equal(result.calibrationMethod, 'manual');
  assert.equal(result.calibrationConfidence, 1);
  assert.deepEqual(result.groundRegion, [
    [0, result.horizonY],
    [1, result.horizonY],
    [1, 1],
    [0, 1],
  ]);
});

test('背景校准交互：拖动消失点反推地平线', () => {
  const result = computeStoryboard3DBackgroundCalibrationDrag({
    mode: 'vanishing-point',
    background: { horizonY: 0.5, horizonSlope: 0.2, vanishingPoint: [0.5, 0.5] },
    startPoint: { x: 0.5, y: 0.5 },
    currentPoint: { x: 0.8, y: 0.7 },
  });
  assert.ok(Math.abs(result.horizonY - 0.64) < 1e-9);
  assert.deepEqual(result.vanishingPoint, [0.8, 0.7]);

  const untouched = computeStoryboard3DBackgroundCalibrationDrag({
    mode: 'pan',
    background: { horizonY: 0.5, vanishingPoint: [0.5, 0.5] },
    startPoint: { x: 0.5, y: 0.5 },
    currentPoint: { x: 0.9, y: 0.9 },
  });
  assert.equal(untouched.horizonY, 0.5);
  assert.deepEqual(untouched.vanishingPoint, [0.5, 0.5]);
});

test('背景校准交互：引导几何按千分比取整', () => {
  const geometry = computeStoryboard3DBackgroundGuideGeometry({
    horizonY: 0.5,
    horizonSlope: 0,
    vanishingPoint: [0.25, 0.5],
  });
  assert.equal(geometry.leftY, 500);
  assert.equal(geometry.rightY, 500);
  assert.deepEqual(geometry.vanishingPoint, [250, 500]);
  assert.equal(geometry.groundPoints, '0,500 1000,500 1000,1000 0,1000');

  const sloped = computeStoryboard3DBackgroundGuideGeometry({
    horizonY: 0.5,
    horizonSlope: 0.4,
    vanishingPoint: [0.5, 0.5],
  });
  assert.equal(sloped.leftY, 300);
  assert.equal(sloped.rightY, 700);
  assert.deepEqual(sloped.vanishingPoint, [500, 500]);
});

test('背景校准交互：预览同步 SVG 属性与数值输入', () => {
  const root = fakeRoot();
  const ground = fakeElement();
  const lineA = fakeElement();
  const lineB = fakeElement();
  const axisLeft = fakeElement();
  const axisRight = fakeElement();
  const vanishing = fakeElement();
  const fieldHorizon = fakeElement();
  const fieldX = fakeElement();
  const fieldY = fakeElement();
  const status = fakeElement();
  root.singles.set('[data-storyboard-3d-background-ground-region]', ground);
  root.multiples.set('[data-storyboard-3d-background-horizon-line]', [lineA, lineB]);
  root.singles.set('[data-storyboard-3d-background-axis-left]', axisLeft);
  root.singles.set('[data-storyboard-3d-background-axis-right]', axisRight);
  root.multiples.set('[data-storyboard-3d-background-vanishing-point]', [vanishing]);
  root.singles.set('[data-storyboard-3d-background-field="horizonY"]', fieldHorizon);
  root.singles.set('[data-storyboard-3d-background-field="vanishingPointX"]', fieldX);
  root.singles.set('[data-storyboard-3d-background-field="vanishingPointY"]', fieldY);
  root.singles.set('[data-storyboard-3d-background-guide-status]', status);

  const returned = previewStoryboard3DBackgroundCalibration(root, {
    horizonY: 0.5,
    horizonSlope: 0,
    vanishingPoint: [0.25, 0.5],
  });
  assert.equal(returned.horizonY, 0.5);
  assert.equal(ground.attributes.points, '0,500 1000,500 1000,1000 0,1000');
  assert.equal(lineA.attributes.y1, '500');
  assert.equal(lineA.attributes.y2, '500');
  assert.equal(lineB.attributes.y1, '500');
  assert.equal(axisLeft.attributes.x1, '250');
  assert.equal(axisLeft.attributes.y1, '500');
  assert.equal(axisRight.attributes.x1, '250');
  assert.equal(vanishing.attributes.cx, '250');
  assert.equal(vanishing.attributes.cy, '500');
  assert.equal(fieldHorizon.value, '0.5');
  assert.equal(fieldX.value, '0.25');
  assert.equal(fieldY.value, '0.5');
  assert.equal(status.textContent, '正在手动调整 · 100%');
});

test('背景校准交互：预览在缺失节点时安全跳过', () => {
  const returned = previewStoryboard3DBackgroundCalibration(fakeRoot(), { horizonY: 0.25 });
  assert.equal(returned.horizonY, 0.25);
});

test('背景校准交互：拖动地平线时预览并提交', () => {
  const root = fakeRoot();
  const win = fakeWindow();
  const handle = handleStub('horizon');
  const previews = [];
  const commits = [];
  const interaction = createStoryboard3DBackgroundCalibrationInteraction({
    root,
    windowObject: win,
    getBackground: () => ({ imageUrl: 'bg.png', horizonY: 0.5, horizonSlope: 0, vanishingPoint: [0.5, 0.5] }),
    onPreview: (background, meta) => previews.push({ background, meta }),
    onCommit: (background, meta) => commits.push({ background, meta }),
  });

  assert.equal(interaction.isDragging(), false);
  root.dispatch('pointerdown', pointerEvent({ clientY: 50, target: { closest: () => handle } }));
  assert.equal(interaction.isDragging(), true);
  assert.deepEqual(handle.captured, [1]);
  assert.equal(handle.guide.classes.has('is-adjusting'), true);
  assert.equal(win.count('pointermove'), 1);
  assert.equal(win.count('pointerup'), 1);
  assert.equal(win.count('pointercancel'), 1);
  assert.equal(win.count('keydown'), 1);

  win.dispatch('pointermove', pointerEvent({ clientY: 50 }));
  assert.equal(previews.length, 0);
  assert.equal(interaction.isDragging(), true);

  win.dispatch('pointermove', pointerEvent({ clientY: 0 }));
  assert.equal(previews.length, 1);
  assert.equal(previews[0].meta.mode, 'horizon');
  assert.equal(previews[0].background.horizonY, 0);

  win.dispatch('pointerup', pointerEvent({ clientY: 0 }));
  assert.equal(interaction.isDragging(), false);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].meta.mode, 'horizon');
  assert.equal(commits[0].background.horizonY, 0);
  assert.equal(handle.guide.classes.has('is-adjusting'), false);
  assert.deepEqual(handle.released, [1]);
  assert.equal(win.count('pointermove'), 0);
  assert.equal(win.count('pointerup'), 0);

  interaction.destroy();
  assert.equal(root.hasHandler('pointerdown'), false);
  assert.equal(interaction.isDragging(), false);
});

test('背景校准交互：Escape 与 pointercancel 回滚到初始值', () => {
  const root = fakeRoot();
  const win = fakeWindow();
  const handle = handleStub('vanishing-point');
  const cancels = [];
  const interaction = createStoryboard3DBackgroundCalibrationInteraction({
    root,
    windowObject: win,
    getBackground: () => ({ imageUrl: 'bg.png', vanishingPoint: [0.5, 0.5] }),
    onCancel: (background, meta) => cancels.push({ background, meta }),
  });

  root.dispatch('pointerdown', pointerEvent({ target: { closest: () => handle } }));
  win.dispatch('pointermove', pointerEvent({ clientX: 100 }));
  assert.equal(interaction.isDragging(), true);
  win.dispatch('keydown', { key: 'Escape' });
  assert.equal(interaction.isDragging(), false);
  assert.equal(cancels.length, 1);
  assert.equal(cancels[0].meta.mode, 'vanishing-point');
  assert.deepEqual(cancels[0].background.vanishingPoint, [0.5, 0.5]);

  const cancelHandle = handleStub('horizon');
  root.dispatch('pointerdown', pointerEvent({ clientY: 50, target: { closest: () => cancelHandle } }));
  win.dispatch('pointermove', pointerEvent({ clientY: 0 }));
  win.dispatch('pointercancel', pointerEvent({ pointerId: 1 }));
  assert.equal(cancels.length, 2);
  assert.equal(cancels[1].meta.mode, 'horizon');
  assert.equal(interaction.isDragging(), false);
});

test('背景校准交互：忽略非法模式、缺失背景与无效矩形', () => {
  const root = fakeRoot();
  const win = fakeWindow();
  let background = { imageUrl: 'bg.png' };
  const interaction = createStoryboard3DBackgroundCalibrationInteraction({
    root,
    windowObject: win,
    getBackground: () => background,
  });

  root.dispatch('pointerdown', pointerEvent({ button: 2, target: { closest: () => handleStub('horizon') } }));
  assert.equal(interaction.isDragging(), false);

  root.dispatch('pointerdown', pointerEvent({ target: { closest: () => handleStub('pan') } }));
  assert.equal(interaction.isDragging(), false);

  background = {};
  root.dispatch('pointerdown', pointerEvent({ target: { closest: () => handleStub('horizon') } }));
  assert.equal(interaction.isDragging(), false);

  background = { imageUrl: 'bg.png' };
  const zeroRect = handleStub('horizon', { rect: { left: 0, top: 0, width: 0, height: 0 } });
  root.dispatch('pointerdown', pointerEvent({ target: { closest: () => zeroRect } }));
  assert.equal(interaction.isDragging(), false);

  root.dispatch('pointerdown', pointerEvent({ target: { closest: () => null } }));
  assert.equal(interaction.isDragging(), false);
  assert.equal(win.count('pointermove'), 0);
});
