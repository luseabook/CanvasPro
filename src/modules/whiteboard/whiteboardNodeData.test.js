import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WHITEBOARD_NODE_TYPE,
  WHITEBOARD_DATA_VERSION,
  WHITEBOARD_DEFAULT_SIZE,
  WHITEBOARD_DEFAULT_TOOL,
  WHITEBOARD_DEFAULT_COLOR,
  WHITEBOARD_DEFAULT_BRUSH_SIZE_PX,
  WHITEBOARD_DEFAULT_SHAPE_TYPE,
  WHITEBOARD_DEFAULT_VIEW,
  WHITEBOARD_DEFAULT_STYLE,
  normalizeWhiteboardCommand,
  normalizeWhiteboardCommands,
  createDefaultWhiteboardState,
  normalizeWhiteboardState,
  getRelevantWhiteboardStyleControls,
  createWhiteboardNodeData,
} from './whiteboardNodeData.js';

const EXPECTED_DEFAULT_STYLE = {
  color: 'black',
  size: 20,
  opacity: 1,
  fill: 'none',
  dash: 'solid',
  font: 'sans',
  textAlign: 'left',
  arrowKind: 'straight',
  arrowStart: 'none',
  arrowEnd: 'arrow',
};

test('the exported whiteboard constants keep their documented values', () => {
  assert.equal(WHITEBOARD_NODE_TYPE, 'whiteboard');
  assert.equal(WHITEBOARD_DATA_VERSION, 2);
  assert.deepEqual(WHITEBOARD_DEFAULT_SIZE, { width: 720, height: 480 });
  assert.equal(WHITEBOARD_DEFAULT_TOOL, 'brush');
  assert.equal(WHITEBOARD_DEFAULT_COLOR, 'black');
  assert.equal(WHITEBOARD_DEFAULT_BRUSH_SIZE_PX, 20);
  assert.equal(WHITEBOARD_DEFAULT_SHAPE_TYPE, 'rectangle');
  assert.deepEqual(WHITEBOARD_DEFAULT_VIEW, { x: 0, y: 0, zoom: 0.5 });
  assert.deepEqual(WHITEBOARD_DEFAULT_STYLE, EXPECTED_DEFAULT_STYLE);
});

test('normalizeWhiteboardCommand rejects non-objects and unknown types', () => {
  assert.equal(normalizeWhiteboardCommand(null), null);
  assert.equal(normalizeWhiteboardCommand('brush'), null);
  assert.equal(normalizeWhiteboardCommand({}), null);
  assert.equal(normalizeWhiteboardCommand({ type: ' unknown ' }), null);
});

test('normalizeWhiteboardCommand normalizes a brush stroke', () => {
  assert.deepEqual(
    normalizeWhiteboardCommand({
      type: 'brush',
      color: 'red',
      sizeWorld: 5,
      points: [
        { x: 1, y: 2 },
        { x: 'a', y: 2 },
      ],
    }),
    { type: 'brush', color: 'red', sizeWorld: 5, points: [{ x: 1, y: 2 }] },
  );
});

test('normalizeWhiteboardCommand slices brush points to the point limit', () => {
  const points = Array.from({ length: 5001 }, (_, i) => ({ x: i, y: i }));
  const command = normalizeWhiteboardCommand({ type: 'brush', points });
  assert.equal(command.points.length, 5000);
});

test('normalizeWhiteboardCommand folds command style options into the result', () => {
  const command = normalizeWhiteboardCommand({
    type: 'brush',
    opacity: 0.5,
    dash: 'dashed',
    fill: 'solid',
    font: 'mono',
    textAlign: 'center',
    arrowStart: 'circle',
    arrowKind: 'elbow',
    arrowEnd: 'bar',
  });
  assert.equal(command.opacity, 0.5);
  assert.equal(command.dash, 'dashed');
  assert.equal(command.fill, 'solid');
  assert.equal(command.font, 'mono');
  assert.equal(command.textAlign, 'center');
  assert.equal(command.arrowStart, 'circle');
  assert.equal(command.arrowKind, 'elbow');
  assert.equal(command.arrowEnd, 'bar');
});

test('normalizeWhiteboardCommand falls back on invalid style options', () => {
  const command = normalizeWhiteboardCommand({
    type: 'brush',
    color: 'chartreuse',
    opacity: 5,
    dash: 'wavy',
  });
  assert.equal(command.opacity, 1);
  assert.equal(command.dash, 'solid');
});

test('normalizeWhiteboardCommand copies a valid colorName override', () => {
  assert.equal(normalizeWhiteboardCommand({ type: 'brush', colorName: 'blue' }).colorName, 'blue');
  assert.equal(normalizeWhiteboardCommand({ type: 'brush', colorName: 'chartreuse' }).colorName, undefined);
});

test('normalizeWhiteboardCommand clamps stroke width and normalizes an eraser', () => {
  assert.equal(normalizeWhiteboardCommand({ type: 'brush', sizeWorld: 0 }).sizeWorld, 1);
  assert.equal(normalizeWhiteboardCommand({ type: 'brush', sizeWorld: -4 }).sizeWorld, 1);
  assert.deepEqual(normalizeWhiteboardCommand({ type: 'eraser', sizeWorld: 10, points: [] }), {
    type: 'eraser',
    sizeWorld: 10,
    points: [],
  });
});

test('normalizeWhiteboardCommand normalizes a rectangle', () => {
  assert.deepEqual(
    normalizeWhiteboardCommand({ type: 'rect', x1: 1, y1: 2, x2: 3, y2: 4, rotation: 0.5, color: 'blue' }),
    { type: 'rect', color: 'blue', sizeWorld: 1, x1: 1, y1: 2, x2: 3, y2: 4, rotation: 0.5 },
  );
  assert.equal(normalizeWhiteboardCommand({ type: 'rect' }).rotation, 0);
});

test('normalizeWhiteboardCommand derives the arrow kind from the bend', () => {
  const straight = normalizeWhiteboardCommand({ type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 0 });
  assert.deepEqual(straight, {
    type: 'arrow',
    color: '',
    sizeWorld: 1,
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 0,
    bend: 0,
    elbowOffset: 0,
    arrowKind: 'straight',
    arrowEnd: 'arrow',
  });
  assert.equal(normalizeWhiteboardCommand({ type: 'arrow', bend: 5 }).arrowKind, 'arc');
  assert.equal(normalizeWhiteboardCommand({ type: 'arrow', bend: 5, arrowKind: 'elbow' }).arrowKind, 'elbow');
  assert.equal(
    normalizeWhiteboardCommand({ type: 'arrow', bend: 5, arrowKind: 'nope' }).arrowKind,
    'straight',
  );
});

test('normalizeWhiteboardCommand keeps an explicit arrow head end', () => {
  assert.equal(normalizeWhiteboardCommand({ type: 'arrow', arrowEnd: 'none' }).arrowEnd, 'none');
  assert.equal(normalizeWhiteboardCommand({ type: 'arrow', arrowEnd: null }).arrowEnd, 'arrow');
});

test('normalizeWhiteboardCommand normalizes a shape and falls back on a bad shape type', () => {
  assert.equal(normalizeWhiteboardCommand({ type: 'shape', shapeType: 'star' }).shapeType, 'star');
  assert.equal(normalizeWhiteboardCommand({ type: 'shape', shapeType: 'blob' }).shapeType, 'rectangle');
});

test('normalizeWhiteboardCommand normalizes a bucket fill point', () => {
  assert.deepEqual(normalizeWhiteboardCommand({ type: 'fill', x: 1, y: 2, color: 'green' }), {
    type: 'fill',
    color: 'green',
    x: 1,
    y: 2,
  });
});

test('normalizeWhiteboardCommand normalizes text and truncates long content', () => {
  assert.deepEqual(normalizeWhiteboardCommand({ type: 'text', text: 'hi', x: 1, y: 2 }), {
    type: 'text',
    text: 'hi',
    color: '',
    sizeWorld: 16,
    x: 1,
    y: 2,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  });
  assert.equal(normalizeWhiteboardCommand({ type: 'text', text: 'a'.repeat(250) }).text.length, 200);
  assert.equal(normalizeWhiteboardCommand({ type: 'text' }).text, '');
});

test('normalizeWhiteboardCommand normalizes number labels', () => {
  assert.deepEqual(normalizeWhiteboardCommand({ type: 'number-label', number: 3.7, x: 1, y: 2 }), {
    type: 'number-label',
    number: 3,
    color: '',
    sizeWorld: 18,
    x: 1,
    y: 2,
  });
  assert.equal(normalizeWhiteboardCommand({ type: 'number-label', number: 0 }).number, 1);
  assert.equal(normalizeWhiteboardCommand({ type: 'number-label', number: -5 }).number, 1);
  assert.equal(normalizeWhiteboardCommand({ type: 'number-label' }).number, 1);
});

test('normalizeWhiteboardCommands drops unusable entries', () => {
  assert.equal(
    normalizeWhiteboardCommands([{ type: 'brush' }, null, { type: 'nope' }, { type: 'text' }]).length,
    2,
  );
  assert.deepEqual(normalizeWhiteboardCommands('nope'), []);
  assert.deepEqual(normalizeWhiteboardCommands(null), []);
});

test('normalizeWhiteboardCommands caps the command list at two thousand', () => {
  const commands = Array.from({ length: 2001 }, () => ({ type: 'brush' }));
  assert.equal(normalizeWhiteboardCommands(commands).length, 2000);
});

test('createDefaultWhiteboardState returns the pristine defaults', () => {
  assert.deepEqual(createDefaultWhiteboardState(), {
    version: 2,
    commands: [],
    tool: 'brush',
    shapeType: 'rectangle',
    view: { x: 0, y: 0, zoom: 0.5 },
    style: EXPECTED_DEFAULT_STYLE,
    color: 'black',
    brushSizePx: 20,
    updatedAt: 0,
  });
});

test('createDefaultWhiteboardState reads legacy top-level colour and brush size', () => {
  const state = createDefaultWhiteboardState({ color: 'blue', brushSizePx: 200 });
  assert.equal(state.color, 'blue');
  assert.equal(state.brushSizePx, 120);
  assert.equal(state.style.color, 'blue');
  assert.equal(state.style.size, 120);
});

test('createDefaultWhiteboardState prefers an explicit style block', () => {
  const state = createDefaultWhiteboardState({
    style: { color: 'red', size: 5, opacity: 0.5, fill: 'solid' },
    brushSizePx: 33,
  });
  assert.equal(state.color, 'red');
  assert.equal(state.brushSizePx, 5);
  assert.equal(state.style.opacity, 0.5);
  assert.equal(state.style.fill, 'solid');
});

test('createDefaultWhiteboardState sanitizes tool, shape and view', () => {
  const state = createDefaultWhiteboardState({
    tool: 'hand',
    shapeType: 'star',
    view: { x: 5, y: 6, zoom: 99 },
  });
  assert.equal(state.tool, 'hand');
  assert.equal(state.shapeType, 'star');
  assert.deepEqual(state.view, { x: 5, y: 6, zoom: 8 });
  assert.equal(createDefaultWhiteboardState({ tool: 'nope' }).tool, 'brush');
  assert.equal(createDefaultWhiteboardState({ shapeType: 'nope' }).shapeType, 'rectangle');
  assert.equal(createDefaultWhiteboardState({ view: 'nope' }).view.zoom, 0.5);
  assert.equal(createDefaultWhiteboardState({ view: { zoom: 0.01 } }).view.zoom, 0.1);
});

test('createDefaultWhiteboardState normalizes the updatedAt stamp', () => {
  assert.equal(createDefaultWhiteboardState({ updatedAt: '123' }).updatedAt, 123);
  assert.equal(createDefaultWhiteboardState({ updatedAt: 'abc' }).updatedAt, 0);
  assert.equal(createDefaultWhiteboardState({ updatedAt: null }).updatedAt, 0);
});

test('normalizeWhiteboardState falls back to defaults for a non-object', () => {
  assert.deepEqual(normalizeWhiteboardState(undefined), createDefaultWhiteboardState());
  assert.deepEqual(normalizeWhiteboardState(null), createDefaultWhiteboardState());
  assert.equal(normalizeWhiteboardState({ tool: 'hand' }).tool, 'hand');
});

test('getRelevantWhiteboardStyleControls maps each tool to its controls', () => {
  assert.deepEqual(getRelevantWhiteboardStyleControls('brush'), ['color', 'size', 'opacity']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('eraser'), ['size']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('arrow'), [
    'color',
    'size',
    'opacity',
    'dash',
    'arrow-kind',
    'arrowheads',
  ]);
  assert.deepEqual(getRelevantWhiteboardStyleControls('rect'), ['color', 'fill', 'size', 'opacity', 'dash']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('shape'), ['color', 'fill', 'size', 'opacity', 'dash']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('text'), ['color', 'size', 'opacity', 'font']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('number-label'), ['color', 'size', 'opacity']);
  assert.deepEqual(getRelevantWhiteboardStyleControls('select'), []);
  assert.deepEqual(getRelevantWhiteboardStyleControls('hand'), []);
  assert.deepEqual(getRelevantWhiteboardStyleControls('bucket'), []);
});

test('getRelevantWhiteboardStyleControls lets a selected target override the tool', () => {
  assert.deepEqual(getRelevantWhiteboardStyleControls('brush', { type: 'arrow' }), [
    'color',
    'size',
    'opacity',
    'dash',
    'arrow-kind',
    'arrowheads',
  ]);
  assert.deepEqual(getRelevantWhiteboardStyleControls('arrow', { type: 'brush' }), [
    'color',
    'size',
    'opacity',
  ]);
  assert.deepEqual(getRelevantWhiteboardStyleControls('hand', { type: 'brush' }), []);
  assert.deepEqual(getRelevantWhiteboardStyleControls(undefined), []);
});

test('createWhiteboardNodeData fills in the default board geometry', () => {
  const node = createWhiteboardNodeData({ id: 'n1' });
  assert.equal(node.id, 'n1');
  assert.equal(node.type, 'whiteboard');
  assert.equal(node.x, 0);
  assert.equal(node.y, 0);
  assert.equal(node.width, 720);
  assert.equal(node.height, 480);
  assert.equal(node.name, '白板');
  assert.deepEqual(node.whiteboard, createDefaultWhiteboardState());
});

test('createWhiteboardNodeData passes geometry through and normalizes the board state', () => {
  const node = createWhiteboardNodeData({
    id: 'n1',
    x: 5,
    y: 6,
    width: 100,
    height: 200,
    name: '草稿',
    whiteboard: { tool: 'hand', commands: [{ type: 'brush' }] },
  });
  assert.equal(node.x, 5);
  assert.equal(node.y, 6);
  assert.equal(node.width, 100);
  assert.equal(node.height, 200);
  assert.equal(node.name, '草稿');
  assert.equal(node.whiteboard.tool, 'hand');
  assert.equal(node.whiteboard.commands.length, 1);
  assert.equal(node.type, WHITEBOARD_NODE_TYPE);
});
