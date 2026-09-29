import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMaterialComparisonViewport } from './materialComparisonViewport.js';

const STAGE_WIDTH = '--material-comparison-stage-width';
const STAGE_HEIGHT = '--material-comparison-stage-height';
const DIVIDER = '--material-comparison-divider';
const DIVIDER_X = '--material-comparison-divider-x';
const DIVIDER_HEIGHT = '--material-comparison-divider-height';

function rectangle({ left = 0, top = 0, width = 0, height = 0 } = {}) {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function mainNode(over = {}) {
  return {
    clientWidth: 'clientWidth' in over ? over.clientWidth : 1000,
    clientHeight: 'clientHeight' in over ? over.clientHeight : 500,
    scrollLeft: 'scrollLeft' in over ? over.scrollLeft : 0,
    scrollTop: 'scrollTop' in over ? over.scrollTop : 0,
    getBoundingClientRect: () => ('rect' in over ? over.rect : rectangle({ width: 1000, height: 500 })),
  };
}

function stageNode(over = {}) {
  const properties = new Map();
  const rects = ('rects' in over ? over.rects : [rectangle({ width: 1000, height: 500 })]).slice();
  let calls = 0;
  const node = {
    dataset: 'dataset' in over ? over.dataset : {},
    clientLeft: 'clientLeft' in over ? over.clientLeft : 0,
    clientWidth: 'clientWidth' in over ? over.clientWidth : 0,
    style: {
      setProperty(name, value) {
        properties.set(name, value);
      },
    },
    getBoundingClientRect() {
      const value = rects[Math.min(calls, rects.length - 1)];
      calls += 1;
      return value;
    },
  };
  return { node, properties, rectCalls: () => calls };
}

function viewportNode() {
  const properties = new Map();
  return {
    node: {
      style: {
        setProperty(name, value) {
          properties.set(name, value);
        },
      },
    },
    properties,
  };
}

function windowNode(over = {}) {
  const node = {};
  if ('innerWidth' in over) node.innerWidth = over.innerWidth;
  if ('innerHeight' in over) node.innerHeight = over.innerHeight;
  if ('computedStyle' in over) node.getComputedStyle = () => over.computedStyle;
  if ('requestAnimationFrame' in over) node.requestAnimationFrame = over.requestAnimationFrame;
  if ('cancelAnimationFrame' in over) node.cancelAnimationFrame = over.cancelAnimationFrame;
  return node;
}

function setup(over = {}) {
  const state = {
    mode: 'overlay',
    zoom: 1,
    dividerPercent: 50,
    leftAspectRatio: 1,
    rightAspectRatio: 1,
    ...(over.state || {}),
  };
  const main = over.main || mainNode();
  const stage = over.stage || stageNode();
  const viewport = viewportNode();
  const windowObject = 'windowObject' in over ? over.windowObject : windowNode();
  const api = createMaterialComparisonViewport({
    state,
    main,
    stage: stage.node,
    stageShell: 'stageShell' in over ? over.stageShell : {},
    viewport: viewport.node,
    windowObject,
  });
  return {
    api,
    state,
    main,
    stage: stage.node,
    stageProperties: stage.properties,
    viewportProperties: viewport.properties,
    windowObject,
  };
}

test('exposes the viewport api', () => {
  const { api } = setup();
  assert.deepEqual(Object.keys(api).sort(), [
    'cancelZoom',
    'dispose',
    'syncDivider',
    'syncGeometry',
    'zoomBy',
  ]);
  for (const name of Object.keys(api)) assert.equal(typeof api[name], 'function');
});

test('sizes the stage from the larger fitted plate and syncs the divider', () => {
  const context = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 1, dividerPercent: 50 } });
  context.api.syncGeometry();
  assert.equal(context.state.stageWidth, 1000);
  assert.equal(context.state.stageHeight, 500);
  assert.equal(context.stageProperties.get(STAGE_WIDTH), '1000px');
  assert.equal(context.stageProperties.get(STAGE_HEIGHT), '500px');
  assert.equal(context.stage.dataset.zoom, '1');
  assert.equal(context.viewportProperties.get(DIVIDER_X), '500px');
  assert.equal(context.viewportProperties.get(DIVIDER_HEIGHT), '500px');
  assert.equal(context.stageProperties.get(DIVIDER), '50%');
});

test('picks the larger plate and breaks ties towards the left one', () => {
  const rightWins = setup({ state: { leftAspectRatio: 1, rightAspectRatio: 2 } });
  rightWins.api.syncGeometry();
  assert.equal(rightWins.state.stageWidth, 1000);
  assert.equal(rightWins.state.stageHeight, 500);

  const leftWins = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1 } });
  leftWins.api.syncGeometry();
  assert.equal(leftWins.state.stageWidth, 1000);

  const tie = setup({ state: { leftAspectRatio: 1, rightAspectRatio: 1 } });
  tie.api.syncGeometry();
  assert.equal(tie.state.stageWidth, 500);
  assert.equal(tie.state.stageHeight, 500);
});

test('adds the plate aspects together in side by side mode', () => {
  const paired = setup({ state: { mode: 'side-by-side', leftAspectRatio: 1, rightAspectRatio: 1 } });
  paired.api.syncGeometry();
  assert.equal(paired.state.stageWidth, 1000);
  assert.equal(paired.state.stageHeight, 500);

  const wide = setup({ state: { mode: 'side-by-side', leftAspectRatio: 1, rightAspectRatio: 3 } });
  wide.api.syncGeometry();
  assert.equal(wide.state.stageWidth, 1000);
  assert.equal(wide.state.stageHeight, 250);

  const overlay = setup({ state: { mode: 'overlay', leftAspectRatio: 1, rightAspectRatio: 1 } });
  overlay.api.syncGeometry();
  assert.equal(overlay.state.stageWidth, 500);
});

test('defaults a non-positive aspect ratio to one', () => {
  for (const value of [0, -3, null, undefined, NaN, 'nope']) {
    const context = setup({ state: { leftAspectRatio: value, rightAspectRatio: value } });
    context.api.syncGeometry();
    assert.equal(context.state.stageWidth, 500, `left aspect ${String(value)}`);
    assert.equal(context.state.stageHeight, 500, `left aspect ${String(value)}`);
  }
});

test('treats a non-positive aspect ratio as one in side by side mode', () => {
  const zeroLeft = setup({ state: { mode: 'side-by-side', leftAspectRatio: 0, rightAspectRatio: 1 } });
  zeroLeft.api.syncGeometry();
  assert.equal(zeroLeft.state.stageWidth, 1000);
  assert.equal(zeroLeft.state.stageHeight, 500);

  const zeroRight = setup({ state: { mode: 'side-by-side', leftAspectRatio: 1, rightAspectRatio: 0 } });
  zeroRight.api.syncGeometry();
  assert.equal(zeroRight.state.stageWidth, 1000);
  assert.equal(zeroRight.state.stageHeight, 500);
});

test('floors the measured size at one pixel', () => {
  const context = setup({
    main: mainNode({ clientWidth: 0, clientHeight: 0, rect: rectangle({ width: 0, height: 0 }) }),
  });
  context.api.syncGeometry();
  assert.equal(context.state.stageWidth, 1);
  assert.equal(context.state.stageHeight, 1);
  assert.equal(context.stageProperties.get(STAGE_WIDTH), '1px');
  assert.equal(context.stageProperties.get(STAGE_HEIGHT), '1px');
});

test('subtracts the shell padding from the measured size', () => {
  const context = setup({
    main: mainNode({ clientWidth: 200, clientHeight: 100 }),
    windowObject: windowNode({
      computedStyle: { paddingLeft: '10px', paddingRight: '10px', paddingTop: '5px', paddingBottom: '5px' },
    }),
    state: { leftAspectRatio: 4, rightAspectRatio: 1 },
  });
  context.api.syncGeometry();
  assert.equal(context.stageProperties.get(STAGE_WIDTH), '180px');
  assert.equal(context.stageProperties.get(STAGE_HEIGHT), '45px');
});

test('clamps a padded away size to one pixel', () => {
  const context = setup({
    main: mainNode({ clientWidth: 10, clientHeight: 10 }),
    windowObject: windowNode({
      computedStyle: { paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px' },
    }),
  });
  context.api.syncGeometry();
  assert.equal(context.state.stageWidth, 1);
  assert.equal(context.state.stageHeight, 1);
});

test('falls back to the rect and then to the window for the measured size', () => {
  const fromRect = setup({
    main: mainNode({ clientWidth: 0, clientHeight: 0, rect: rectangle({ width: 800, height: 400 }) }),
  });
  fromRect.api.syncGeometry();
  assert.equal(fromRect.state.stageWidth, 400);
  assert.equal(fromRect.state.stageHeight, 400);

  const fromWindow = setup({
    main: mainNode({ clientWidth: 0, clientHeight: 0, rect: null }),
    windowObject: windowNode({ innerWidth: 600, innerHeight: 600 }),
  });
  fromWindow.api.syncGeometry();
  assert.equal(fromWindow.state.stageWidth, 600);
  assert.equal(fromWindow.state.stageHeight, 600);
});

test('rounds the stage size to two decimals and the zoom to three', () => {
  const context = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 0.123456 } });
  context.api.syncGeometry();
  assert.equal(context.stageProperties.get(STAGE_WIDTH), '123.46px');
  assert.equal(context.stageProperties.get(STAGE_HEIGHT), '61.73px');
  assert.equal(context.stage.dataset.zoom, '0.123');
});

test('floors the zoomed stage size at one pixel', () => {
  const context = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 0 } });
  context.api.syncGeometry();
  assert.equal(context.state.stageWidth, 1);
  assert.equal(context.state.stageHeight, 1);
  assert.equal(context.stage.dataset.zoom, '0');
});

test('clamps the divider percentage into the stage rect', () => {
  const below = setup({
    stage: stageNode({ rects: [rectangle({ left: 2000, width: 1000, height: 500 })] }),
    state: { dividerPercent: 50 },
  });
  below.api.syncDivider();
  assert.equal(below.stageProperties.get(DIVIDER), '0%');
  assert.equal(below.viewportProperties.get(DIVIDER_X), '500px');
  assert.equal(below.viewportProperties.get(DIVIDER_HEIGHT), '500px');

  const above = setup({
    stage: stageNode({ rects: [rectangle({ left: -5000, width: 1000, height: 500 })] }),
    state: { dividerPercent: 50 },
  });
  above.api.syncDivider();
  assert.equal(above.stageProperties.get(DIVIDER), '100%');
});

test('subtracts the stage border and prefers its client width', () => {
  const border = setup({
    stage: stageNode({ rects: [rectangle({ width: 1000, height: 500 })], clientLeft: 500 }),
    state: { dividerPercent: 50 },
  });
  border.api.syncDivider();
  assert.equal(border.stageProperties.get(DIVIDER), '0%');

  const narrow = setup({
    stage: stageNode({ rects: [rectangle({ width: 400, height: 300 })], clientWidth: 250 }),
    state: { dividerPercent: 50 },
  });
  narrow.api.syncDivider();
  assert.equal(narrow.stageProperties.get(DIVIDER), '100%');
  assert.equal(narrow.viewportProperties.get(DIVIDER_X), '500px');
});

test('prefers the main client size over its rect for the divider', () => {
  const context = setup({
    main: mainNode({ clientWidth: 400, clientHeight: 200, rect: rectangle({ width: 1000, height: 1000 }) }),
    state: { dividerPercent: 25 },
  });
  context.api.syncDivider();
  assert.equal(context.viewportProperties.get(DIVIDER_X), '100px');
  assert.equal(context.viewportProperties.get(DIVIDER_HEIGHT), '200px');
  assert.equal(context.stageProperties.get(DIVIDER), '10%');
});

test('skips the divider sync without both rects', () => {
  const noMain = setup({ main: mainNode({ rect: null }) });
  noMain.api.syncDivider();
  assert.deepEqual([...noMain.stageProperties.keys()], []);
  assert.deepEqual([...noMain.viewportProperties.keys()], []);

  const noStage = setup({ stage: stageNode({ rects: [null] }) });
  noStage.api.syncDivider();
  assert.deepEqual([...noStage.stageProperties.keys()], []);
  assert.deepEqual([...noStage.viewportProperties.keys()], []);
});

test('writes a zero divider for zero or non-numeric percentages', () => {
  const context = setup({ state: { dividerPercent: NaN } });
  context.api.syncDivider();
  assert.equal(context.viewportProperties.get(DIVIDER_X), 'NaNpx');
  assert.equal(context.stageProperties.get(DIVIDER), '0%');

  const blank = setup({ state: { dividerPercent: null } });
  blank.api.syncDivider();
  assert.equal(blank.viewportProperties.get(DIVIDER_X), '0px');
  assert.equal(blank.stageProperties.get(DIVIDER), '0%');

  const zero = setup({ state: { dividerPercent: 0 } });
  zero.api.syncDivider();
  assert.equal(zero.viewportProperties.get(DIVIDER_X), '0px');
  assert.equal(zero.stageProperties.get(DIVIDER), '0%');
});

test('tracks only the documented state fields', () => {
  const context = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1 } });
  context.api.syncGeometry();
  assert.deepEqual(Object.keys(context.state).sort(), [
    'dividerPercent',
    'leftAspectRatio',
    'mode',
    'rightAspectRatio',
    'stageHeight',
    'stageWidth',
    'zoom',
  ]);
});

test('tolerates a missing window object', () => {
  const context = setup({
    main: mainNode({ clientWidth: 300, clientHeight: 300 }),
    stage: stageNode({ rects: [rectangle({ width: 300, height: 300 })] }),
    windowObject: undefined,
  });
  context.api.syncGeometry();
  assert.equal(context.state.stageWidth, 300);
  assert.equal(context.state.stageHeight, 300);
});

test('dispose stops every later sync', () => {
  const context = setup({ state: { leftAspectRatio: 2, rightAspectRatio: 1 } });
  context.api.dispose();
  context.api.dispose();
  context.api.syncGeometry();
  context.api.syncDivider();
  assert.deepEqual([...context.stageProperties.keys()], []);
  assert.deepEqual([...context.viewportProperties.keys()], []);
  assert.equal('stageWidth' in context.state, false);
});

test('zoomBy ignores an event without a delta', () => {
  let prevented = 0;
  const context = setup();
  context.api.zoomBy({ deltaY: 0, deltaX: 0, preventDefault: () => (prevented += 1) });
  context.api.zoomBy(undefined);
  context.api.zoomBy(null);
  context.api.zoomBy({});
  context.api.zoomBy({ deltaY: NaN });
  assert.equal(prevented, 0);
  assert.equal(context.state.zoom, 1);
  assert.deepEqual([...context.stageProperties.keys()], []);
});

test('zoomBy falls back to deltaX and applies the wheel intensity', () => {
  const horizontal = setup();
  horizontal.api.zoomBy({ deltaY: 0, deltaX: -100, preventDefault() {}, stopPropagation() {} });
  assert.equal(horizontal.state.zoom, 1.162);

  const vertical = setup();
  vertical.api.zoomBy({ deltaY: 100, preventDefault() {}, stopPropagation() {} });
  assert.equal(vertical.state.zoom, 0.861);

  const positive = setup({ state: { zoom: 2 } });
  positive.api.zoomBy({ deltaY: 100 });
  assert.equal(positive.state.zoom, 1.721);
});

test('clamps the wheel zoom to the allowed range', () => {
  const upper = setup({ state: { zoom: 4 } });
  upper.api.zoomBy({ deltaY: -1000, preventDefault() {}, stopPropagation() {} });
  assert.equal(upper.state.zoom, 6);

  const lower = setup({ state: { zoom: 0.3 } });
  lower.api.zoomBy({ deltaY: 1000, preventDefault() {}, stopPropagation() {} });
  assert.equal(lower.state.zoom, 0.25);
});

test('zoomBy prevents the default and stops propagation', () => {
  const calls = [];
  const event = {
    deltaY: -10,
    preventDefault: () => calls.push('prevent'),
    stopPropagation: () => calls.push('stop'),
  };
  setup().api.zoomBy(event);
  assert.deepEqual(calls, ['prevent', 'stop']);
  assert.deepEqual(Object.keys(event).sort(), ['deltaY', 'preventDefault', 'stopPropagation']);
});

test('zoomBy keeps the scroll anchored to the pointer', () => {
  const context = setup({
    main: mainNode({ clientWidth: 1000, clientHeight: 500, scrollLeft: 10, scrollTop: 20 }),
    stage: stageNode({
      rects: [
        rectangle({ left: 100, top: 50, width: 400, height: 300 }),
        rectangle({ left: 0, top: 0, width: 800, height: 600 }),
      ],
    }),
    state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 1, dividerPercent: 50 },
  });
  context.api.zoomBy({ deltaY: -100, clientX: 300, clientY: 200, preventDefault() {}, stopPropagation() {} });
  assert.equal(context.state.zoom, 1.162);
  assert.equal(context.state.stageWidth, 1162);
  assert.equal(context.main.scrollLeft, 110);
  assert.equal(context.main.scrollTop, 120);
  assert.equal(context.stageProperties.get(DIVIDER), '62.5%');
});

test('clamps the pointer ratio into the stage', () => {
  const context = setup({
    main: mainNode({ clientWidth: 1000, clientHeight: 500, scrollLeft: 0, scrollTop: 0 }),
    stage: stageNode({
      rects: [rectangle({ width: 100, height: 100 }), rectangle({ width: 100, height: 100 })],
    }),
    state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 1 },
  });
  context.api.zoomBy({ deltaY: -100, clientX: 500, clientY: -500 });
  assert.equal(context.main.scrollLeft, -400);
  assert.equal(context.main.scrollTop, 500);
});

test('collapses a zero sized stage to a one pixel pointer denominator', () => {
  const context = setup({
    main: mainNode({ clientWidth: 1000, clientHeight: 500, scrollLeft: 5, scrollTop: 0 }),
    stage: stageNode({ rects: [rectangle({ width: 0, height: 0 }), rectangle({ width: 0, height: 0 })] }),
    state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 1 },
  });
  context.api.zoomBy({ deltaY: -100, clientX: 3, clientY: 0 });
  assert.equal(context.main.scrollLeft, 2);
  assert.equal(context.main.scrollTop, 0);
});

test('a requested frame batches the wheel deltas', () => {
  const frames = [];
  const context = setup({
    windowObject: windowNode({
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 7;
      },
    }),
    state: { leftAspectRatio: 2, rightAspectRatio: 1, zoom: 1 },
  });
  context.api.zoomBy({ deltaY: -100 });
  context.api.zoomBy({ deltaY: -100 });
  assert.equal(frames.length, 1);
  assert.equal(context.state.zoom, 1);
  frames[0]();
  assert.equal(context.state.zoom, 1.35);
  assert.equal(context.state.stageWidth, 1350);
});

test('cancelZoom drops the pending frame and its zoom', () => {
  const frames = [];
  const cancelled = [];
  const context = setup({
    windowObject: windowNode({
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 7;
      },
      cancelAnimationFrame: (handle) => cancelled.push(handle),
    }),
    state: { zoom: 1 },
  });
  context.api.zoomBy({ deltaY: -100 });
  context.api.cancelZoom();
  assert.deepEqual(cancelled, [7]);
  frames[0]();
  assert.equal(context.state.zoom, 1);
  context.api.cancelZoom();
  assert.deepEqual(cancelled, [7]);
});

test('dispose cancels a pending zoom', () => {
  const frames = [];
  const cancelled = [];
  const context = setup({
    windowObject: windowNode({
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 3;
      },
      cancelAnimationFrame: (handle) => cancelled.push(handle),
    }),
    state: { zoom: 1 },
  });
  context.api.zoomBy({ deltaY: -50 });
  context.api.dispose();
  assert.deepEqual(cancelled, [3]);
  frames[0]();
  context.api.zoomBy({ deltaY: -50 });
  assert.equal(frames.length, 1);
  assert.equal(cancelled.length, 1);
  assert.equal(context.state.zoom, 1);
});

test('zoomBy does nothing when the clamped zoom already matches', () => {
  const context = setup({ state: { zoom: 6, leftAspectRatio: 2, rightAspectRatio: 1 } });
  context.main.scrollLeft = 7;
  context.main.scrollTop = 9;
  context.api.zoomBy({ deltaY: -100, clientX: 10, clientY: 10 });
  assert.equal(context.state.zoom, 6);
  assert.equal(context.main.scrollLeft, 7);
  assert.equal(context.main.scrollTop, 9);
  assert.deepEqual([...context.stageProperties.keys()], []);
  assert.deepEqual([...context.viewportProperties.keys()], []);
});
