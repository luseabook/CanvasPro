import test from 'node:test';
import assert from 'node:assert/strict';
import * as threeRuntime from './threeRuntime.js';
import {
  GIZMO_BASE_AXIS_LENGTH,
  GIZMO_BASE_PLANE_OFFSET,
  GIZMO_BASE_PLANE_SIZE,
  GIZMO_BASE_ROTATE_RADIUS,
  GIZMO_BASE_SCALE_LENGTH,
  GIZMO_MOVE_HEAD_LENGTH,
  GIZMO_MOVE_PICK_LENGTH,
  GIZMO_MOVE_SHAFT_LENGTH,
  GIZMO_SCALE_HEAD_SIZE,
  GIZMO_SCALE_PICK_LENGTH,
  GIZMO_SCALE_SHAFT_LENGTH,
  createScene3DGizmoVisual,
} from './scene3dGizmoVisual.js';

const EXPECTED_HANDLE_KEYS = [
  'axis-x',
  'axis-y',
  'axis-z',
  'plane-xy',
  'plane-xz',
  'plane-yz',
  'rotate-x',
  'rotate-y',
  'rotate-z',
  'scale-x',
  'scale-y',
  'scale-z',
  'scale-uniform',
  'scale-plane-xy',
  'scale-plane-xz',
  'scale-plane-yz',
];

function createHarness() {
  const calls = { moveAxis: [], rotateRing: [], scaleAxis: [], planePickGeometry: [], planeVisual: [], gizmoObject: [] };

  const axisFactory = (record) => (color, axis) => {
    const group = new threeRuntime.Group();
    const pickMesh = new threeRuntime.Mesh(new threeRuntime.BoxGeometry(0.1, 0.1, 0.1));
    record.push({ color, axis, group, pickMesh });
    return { group, visuals: [{ material: 'material-' + axis }], pickMesh };
  };

  const visual = createScene3DGizmoVisual({
    configureGizmoMaterial: (material) => material,
    configureGizmoObject: (object) => calls.gizmoObject.push(object),
    createMoveAxis: axisFactory(calls.moveAxis),
    createRotateRing: axisFactory(calls.rotateRing),
    createScaleAxis: axisFactory(calls.scaleAxis),
    createPlaneCornerPickGeometry: (size) => {
      calls.planePickGeometry.push(size);
      return new threeRuntime.BoxGeometry(size, size, 0.01);
    },
    createPlaneCornerVisual: (colors, size) => {
      calls.planeVisual.push([colors, size]);
      return { group: new threeRuntime.Group(), visuals: [{ colors, size }] };
    },
  });

  return { visual, calls };
}

test('scene3dGizmoVisual: 基础尺寸常量是固定的，旋转半径是缩放长度的一半', () => {
  assert.equal(GIZMO_BASE_AXIS_LENGTH, 1.35);
  assert.equal(GIZMO_BASE_SCALE_LENGTH, 1.22);
  assert.equal(GIZMO_BASE_ROTATE_RADIUS, 1.22 * 0.5);
  assert.equal(GIZMO_BASE_PLANE_OFFSET, 0.38);
  assert.equal(GIZMO_BASE_PLANE_SIZE, 0.42);
  assert.equal(GIZMO_MOVE_SHAFT_LENGTH, 1.2);
  assert.equal(GIZMO_MOVE_HEAD_LENGTH, 0.18);
  assert.equal(GIZMO_MOVE_PICK_LENGTH, 1.6);
  assert.equal(GIZMO_SCALE_SHAFT_LENGTH, 1.05);
  assert.equal(GIZMO_SCALE_HEAD_SIZE, 0.135);
  assert.equal(GIZMO_SCALE_PICK_LENGTH, 1.5);
});

test('scene3dGizmoVisual: 根节点初始隐藏，并且交给 configureGizmoObject 配置', () => {
  const { visual, calls } = createHarness();
  assert.equal(visual.root instanceof threeRuntime.Group, true);
  assert.equal(visual.root.visible, false);
  assert.equal(calls.gizmoObject[0], visual.root, '第一个被配置的就是根节点');
  assert.equal(calls.gizmoObject.length > 1, true);
});

test('scene3dGizmoVisual: 操作柄键集合与顺序固定，共 16 个', () => {
  const { visual } = createHarness();
  assert.deepEqual([...visual.handles.keys()], EXPECTED_HANDLE_KEYS);
  assert.equal(visual.handles.size, 16);
});

test('scene3dGizmoVisual: 拾取网格与操作柄一一对应，都带上 gizmoHandleKey', () => {
  const { visual } = createHarness();
  assert.equal(visual.pickMeshes.length, 16);

  const keys = visual.pickMeshes.map((mesh) => mesh.userData.gizmoHandleKey);
  assert.deepEqual(keys, EXPECTED_HANDLE_KEYS);
  for (const key of keys) {
    assert.equal(visual.handles.has(key), true, key + ' 必须能在 handles 里找到');
  }
});

test('scene3dGizmoVisual: 移动轴、旋转环、缩放轴各建三根，轴序固定为 x/y/z', () => {
  const { calls } = createHarness();
  assert.deepEqual(calls.moveAxis.map((entry) => entry.axis), ['x', 'y', 'z']);
  assert.deepEqual(calls.rotateRing.map((entry) => entry.axis), ['x', 'y', 'z']);
  assert.deepEqual(calls.scaleAxis.map((entry) => entry.axis), ['x', 'y', 'z']);
});

test('scene3dGizmoVisual: 三根轴分别挂在 moveGroup / rotateGroup / scaleGroup 上', () => {
  const { visual, calls } = createHarness();
  assert.equal(visual.moveGroup.children.includes(calls.moveAxis[0].group), true);
  assert.equal(visual.moveGroup.children.includes(calls.moveAxis[2].group), true);
  assert.equal(visual.rotateGroup.children.includes(calls.rotateRing[1].group), true);
  assert.equal(visual.scaleGroup.children.includes(calls.scaleAxis[1].group), true);
});

test('scene3dGizmoVisual: 平面操作柄按模式分到两张表，链接轴是拷贝出来的数组', () => {
  const { visual } = createHarness();
  assert.deepEqual(Object.keys(visual.planeHandles), ['plane-xy', 'plane-xz', 'plane-yz']);
  assert.deepEqual(Object.keys(visual.scalePlaneHandles), ['scale-plane-xy', 'scale-plane-xz', 'scale-plane-yz']);

  const moveHandle = visual.handles.get('plane-xy');
  assert.equal(moveHandle.mode, 'plane');
  assert.equal(moveHandle.normalAxis, 'z');
  assert.deepEqual(moveHandle.linkedAxes, ['x', 'y']);

  const scaleHandle = visual.handles.get('scale-plane-yz');
  assert.equal(scaleHandle.mode, 'scale-plane');
  assert.equal(scaleHandle.normalAxis, 'x');
  assert.deepEqual(scaleHandle.linkedAxes, ['y', 'z']);

  moveHandle.linkedAxes.push('z');
  assert.deepEqual(visual.handles.get('plane-xz').linkedAxes, ['x', 'z'], '每个柄的链接轴互不共享引用');
});

test('scene3dGizmoVisual: 三种轴模式在 handles 里各自标注正确', () => {
  const { visual } = createHarness();
  assert.deepEqual(
    ['axis-x', 'rotate-x', 'scale-x'].map((key) => [visual.handles.get(key).mode, visual.handles.get(key).axis]),
    [
      ['axis', 'x'],
      ['rotate', 'x'],
      ['scale-axis', 'x'],
    ],
  );
  assert.deepEqual(visual.handles.get('scale-uniform').linkedAxes, ['x', 'y', 'z']);
  assert.equal(visual.handles.get('scale-uniform').mode, 'scale-uniform');
});

test('scene3dGizmoVisual: 平面角标按平面尺寸创建，六个平面共用同一个尺寸', () => {
  const { calls } = createHarness();
  assert.deepEqual(calls.planePickGeometry, new Array(6).fill(GIZMO_BASE_PLANE_SIZE));
  assert.equal(calls.planeVisual.length, 6);
  for (const [, size] of calls.planeVisual) {
    assert.equal(size, GIZMO_BASE_PLANE_SIZE);
  }
});

test('scene3dGizmoVisual: 返回的运行时状态字段有默认值，baseLayout 与常量一致', () => {
  const { visual } = createHarness();
  assert.equal(visual.hoverHandle, null);
  assert.equal(visual.activeHandle, null);
  assert.equal(visual.dragLock, null);
  assert.equal(visual.currentTool, 'move');
  assert.deepEqual(Object.keys(visual.moveAxes), ['x', 'y', 'z']);
  assert.deepEqual(Object.keys(visual.scaleAxes), ['x', 'y', 'z']);
  assert.deepEqual(Object.keys(visual.rotateRings), ['x', 'y', 'z']);
  assert.deepEqual(visual.baseLayout, {
    axisLength: GIZMO_BASE_AXIS_LENGTH,
    scaleLength: GIZMO_BASE_SCALE_LENGTH,
    rotateRadius: GIZMO_BASE_ROTATE_RADIUS,
    planeOffset: GIZMO_BASE_PLANE_OFFSET,
    planeSize: GIZMO_BASE_PLANE_SIZE,
  });
});

test('scene3dGizmoVisual: 三个分组都挂在根节点下', () => {
  const { visual } = createHarness();
  for (const group of [visual.moveGroup, visual.rotateGroup, visual.scaleGroup]) {
    assert.equal(visual.root.children.includes(group), true);
  }
});
