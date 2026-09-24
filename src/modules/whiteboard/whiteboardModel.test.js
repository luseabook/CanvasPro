import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWhiteboardNodeData, normalizeWhiteboard, normalizeLayer,
  hitLayer, moveLayer, scaleLayer, updateShape, MAX_LAYERS,
} from './whiteboardModel.js';

const stroke = { id: 'stroke', type: 'pen', points: [[10, 20], [40, 50]], strokeWidth: 4 };
test('new nodes carry their serializable whiteboard state', () => {
  const node = createWhiteboardNodeData({ id: 'wb-1', x: 5, y: 9 });
  assert.equal(node.type, 'whiteboard');
  assert.deepEqual(JSON.parse(JSON.stringify(node)), node);
  assert.equal(node.whiteboard.version, 1);
  assert.deepEqual(node.whiteboard.layers, []);
});
test('normalization does not retain mutable point arrays from store/history', () => {
  const input = { layers: [stroke] };
  const a = normalizeWhiteboard(input), b = normalizeWhiteboard(a);
  b.layers[0].points[0][0] = 999;
  assert.equal(a.layers[0].points[0][0], 10);
  assert.equal(input.layers[0].points[0][0], 10);
});
test('round trip preserves editable layers rather than flattening to a bitmap', () => {
  const board = normalizeWhiteboard({ background: 'transparent', layers: [stroke,
    { id: 'txt', type: 'text', x: 2, y: 3, text: '<script>not executable</script> 中文', fontSize: 30 }] });
  assert.deepEqual(normalizeWhiteboard(JSON.parse(JSON.stringify(board))), board);
  assert.equal(board.layers[1].text, '<script>not executable</script> 中文');
});
test('rejects unsafe image references and unsupported layers', () => {
  for (const src of ['javascript:alert(1)', 'https://example.com/image.png', 'file:///etc/passwd', 'data:image/svg+xml;base64,PHN2Zz4=']) {
    assert.equal(normalizeLayer({ type: 'image', src }), null);
  }
  assert.equal(normalizeLayer({ type: 'script' }), null);
});
test('duplicate imported ids are repaired even if the repair suffix collides', () => {
  const board = normalizeWhiteboard({ layers: [
    { ...stroke, id: 'a' }, { ...stroke, id: 'a-2' }, { ...stroke, id: 'a' },
  ] });
  assert.equal(new Set(board.layers.map(l => l.id)).size, 3);
});
test('move and scale leave previous snapshots intact', () => {
  const layer = normalizeLayer(stroke), moved = moveLayer(layer, 20, -5);
  assert.deepEqual(moved.points, [[30, 15], [60, 45]]);
  const scaled = scaleLayer(layer, 2);
  assert.deepEqual(scaled.points, [[10, 20], [70, 80]]);
  assert.deepEqual(layer.points, [[10, 20], [40, 50]]);
});
test('hit testing returns topmost layer and handles single-point strokes', () => {
  const pen = normalizeLayer({ ...stroke, points: [[20, 20]] });
  const rect = normalizeLayer({ id: 'rect', type: 'rect', x: 5, y: 5, width: 40, height: 40 });
  assert.equal(hitLayer([pen, rect], { x: 20, y: 20 }).id, 'rect');
  assert.equal(hitLayer([pen], { x: 20, y: 20 }).id, 'stroke');
  assert.equal(hitLayer([pen], { x: 200, y: 200 }), null);
});
test('shape creation supports drawing in every direction', () => {
  const rect = updateShape({ type: 'rect' }, { x: 100, y: 100 }, { x: 30, y: 50 });
  assert.deepEqual(rect, { type: 'rect', x: 30, y: 50, width: 70, height: 50 });
  const line = updateShape({ type: 'line', x: 100, y: 100 }, { x: 100, y: 100 }, { x: 30, y: 50 });
  assert.equal(line.x2, 30); assert.equal(line.y2, 50);
});
test('invalid numeric data and oversized layer arrays are bounded', () => {
  const board = normalizeWhiteboard({ width: Infinity, height: -1, background: 'url(unsafe)',
    layers: Array.from({ length: MAX_LAYERS + 5 }, (_, i) => ({ ...stroke, id: String(i) })) });
  assert.equal(board.width, 1200); assert.equal(board.height, 128);
  assert.equal(board.background, '#ffffff'); assert.equal(board.layers.length, MAX_LAYERS);
});
