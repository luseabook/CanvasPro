import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WHITEBOARD_LAYER_MAX_SCALE,
  WHITEBOARD_LAYER_MIN_SCALE,
  applyWhiteboardLayerTransform,
  createWhiteboardLayerTransformSession,
  getWhiteboardLayerGeometry,
  getWhiteboardLayerTransformHandleAtPoint,
  isWhiteboardLayerTransformable,
} from './whiteboardLayerTransform.js';

test('whiteboardLayerTransform: transformable types and geometry expose handles', () => {
  assert.equal(isWhiteboardLayerTransformable({ type: 'rect' }), true);
  assert.equal(isWhiteboardLayerTransformable({ type: 'source-image' }), false);
  const geometry = getWhiteboardLayerGeometry({
    type: 'rect',
    x1: 10,
    y1: 20,
    x2: 30,
    y2: 40,
    rotation: 0,
    sizeWorld: 4,
  });
  assert.deepEqual(geometry.bounds, { x: 10, y: 20, width: 20, height: 20 });
  assert.deepEqual(geometry.center, { x: 20, y: 30 });
  assert.deepEqual(geometry.corners, [
    { x: 10, y: 20 },
    { x: 30, y: 20 },
    { x: 30, y: 40 },
    { x: 10, y: 40 },
  ]);
  assert.equal(geometry.scaleHandles.length, 4);
  assert.deepEqual(geometry.rotationHandle.point, { x: 20, y: -4 });
  assert.equal(geometry.supportsResize, true);
  assert.equal(geometry.supportsRotation, true);
});

test('whiteboardLayerTransform: hit testing honors zoom-independent screen radius', () => {
  const rect = { type: 'rect', x1: 0, y1: 0, x2: 100, y2: 50, rotation: 0 };
  assert.equal(getWhiteboardLayerTransformHandleAtPoint(rect, { x: 1, y: 1 }).id, 'nw');
  assert.equal(getWhiteboardLayerTransformHandleAtPoint(rect, { x: 50, y: -24 }).id, 'rotate');
  assert.equal(getWhiteboardLayerTransformHandleAtPoint(rect, { x: 50, y: 25 }), null);
  assert.equal(getWhiteboardLayerTransformHandleAtPoint(rect, { x: 10, y: 0 }, { zoom: 4 }), null);
});

test('whiteboardLayerTransform: sessions reject unsupported modes and capture base state', () => {
  const rect = { type: 'rect', x1: 0, y1: 0, x2: 100, y2: 50, rotation: 0, sizeWorld: 2 };
  assert.equal(
    createWhiteboardLayerTransformSession({ command: rect, mode: 'delete', startPoint: {} }),
    null,
  );
  assert.equal(
    createWhiteboardLayerTransformSession({
      command: { type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 0 },
      mode: 'rotate',
      startPoint: {},
    }),
    null,
  );
  const session = createWhiteboardLayerTransformSession({
    command: rect,
    index: 3,
    mode: 'move',
    startPoint: { x: 10, y: 15 },
  });
  assert.equal(session.index, 3);
  assert.equal(session.mode, 'move');
  assert.deepEqual(session.center, { x: 50, y: 25 });
  assert.equal(session.base.type, 'rect');
  assert.notEqual(session.base, rect);
});

test('whiteboardLayerTransform: move and scale mutate only the draft command', () => {
  const rect = { type: 'rect', x1: 0, y1: 0, x2: 100, y2: 50, rotation: 0, sizeWorld: 2 };
  const move = createWhiteboardLayerTransformSession({
    command: rect,
    mode: 'move',
    startPoint: { x: 10, y: 20 },
  });
  assert.equal(applyWhiteboardLayerTransform(rect, move, { x: 40, y: 80 }), true);
  assert.deepEqual([rect.x1, rect.y1, rect.x2, rect.y2], [30, 60, 130, 110]);
  assert.equal(move.moved, true);

  const scaleBase = {
    type: 'brush',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    sizeWorld: 2,
  };
  const scale = createWhiteboardLayerTransformSession({
    command: scaleBase,
    mode: 'scale',
    startPoint: { x: 10, y: 0 },
  });
  assert.equal(scale.moved, false);
  assert.equal(applyWhiteboardLayerTransform(scaleBase, scale, { x: 1000, y: 0 }), true);
  assert.equal(scaleBase.sizeWorld, 2 * WHITEBOARD_LAYER_MAX_SCALE);
  assert.deepEqual(scaleBase.points[1], { x: 5 + 5 * WHITEBOARD_LAYER_MAX_SCALE, y: 0 });

  const minScaleBase = {
    type: 'brush',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    sizeWorld: 2,
  };
  const minScale = createWhiteboardLayerTransformSession({
    command: minScaleBase,
    mode: 'scale',
    startPoint: { x: 11, y: -1 },
  });
  applyWhiteboardLayerTransform(minScaleBase, minScale, { x: 5, y: 0 });
  assert.equal(minScaleBase.sizeWorld, Math.max(1, 2 * WHITEBOARD_LAYER_MIN_SCALE));
});

test('whiteboardLayerTransform: rotation applies around the captured center', () => {
  const rect = { type: 'rect', x1: 0, y1: 0, x2: 100, y2: 50, rotation: 0, sizeWorld: 2 };
  const session = createWhiteboardLayerTransformSession({
    command: rect,
    mode: 'rotate',
    startPoint: { x: 60, y: 25 },
  });
  assert.equal(applyWhiteboardLayerTransform(rect, session, { x: 50, y: 35 }), true);
  assert.ok(Math.abs(rect.rotation - Math.PI / 2) < 1e-12);
});

test('whiteboardLayerTransform: mismatched command types are ignored', () => {
  const rect = { type: 'rect', x1: 0, y1: 0, x2: 10, y2: 10 };
  const session = createWhiteboardLayerTransformSession({
    command: rect,
    mode: 'move',
    startPoint: { x: 0, y: 0 },
  });
  assert.equal(applyWhiteboardLayerTransform({ type: 'shape' }, session, { x: 10, y: 10 }), false);
});
