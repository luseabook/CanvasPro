import * as threeRuntime from './threeRuntime.js';
import { resolveThemeColor } from './scene3dTheme.js';
export const GIZMO_BASE_AXIS_LENGTH = 1.35;
export const GIZMO_BASE_SCALE_LENGTH = 1.22;
export const GIZMO_BASE_ROTATE_RADIUS = GIZMO_BASE_SCALE_LENGTH * 0.5;
export const GIZMO_BASE_PLANE_OFFSET = 0.38;
export const GIZMO_BASE_PLANE_SIZE = 0.42;
export const GIZMO_MOVE_SHAFT_LENGTH = 1.2;
export const GIZMO_MOVE_HEAD_LENGTH = 0.18;
export const GIZMO_MOVE_PICK_LENGTH = 1.6;
export const GIZMO_SCALE_SHAFT_LENGTH = 1.05;
export const GIZMO_SCALE_HEAD_SIZE = 0.135;
export const GIZMO_SCALE_PICK_LENGTH = 1.5;
export function createScene3DGizmoVisual({
  configureGizmoMaterial: _0x4fae50,
  configureGizmoObject: _0x1341ef,
  createMoveAxis: _0x1cd9be,
  createPlaneCornerPickGeometry: _0x2201e8,
  createPlaneCornerVisual: _0x568f28,
  createRotateRing: _0x22a95e,
  createScaleAxis: _0x186b4b,
} = {}) {
  const _0x2f03d2 = resolveThemeColor('--red', '--red'),
    _0x5debb0 = resolveThemeColor('--green', '--green'),
    _0x39ad40 = resolveThemeColor('--blue', '--blue'),
    _0x5314ce = new threeRuntime['Group']();
  ((_0x5314ce['visible'] = ![]), _0x1341ef(_0x5314ce));
  const _0x1b6c0e = new threeRuntime['Group'](),
    _0xdaa920 = new Map(),
    _0x4d8355 = [],
    _0x3690c9 = {},
    _0x506d1b = {},
    _0x1f59fc = {},
    _0x496e65 = {},
    _0x25988e = {},
    _0x41ea05 = _0x1cd9be(_0x2f03d2, 'x'),
    _0x23a06e = _0x1cd9be(_0x5debb0, 'y'),
    _0x38bb8e = _0x1cd9be(_0x39ad40, 'z');
  (_0x1b6c0e['add'](_0x41ea05['group']),
    _0x1b6c0e['add'](_0x23a06e['group']),
    _0x1b6c0e['add'](_0x38bb8e['group']),
    (_0x3690c9['x'] = _0x41ea05),
    (_0x3690c9['y'] = _0x23a06e),
    (_0x3690c9['z'] = _0x38bb8e),
    _0xdaa920['set']('axis-x', { key: 'axis-x', mode: 'axis', axis: 'x', visuals: _0x41ea05['visuals'] }),
    _0xdaa920['set']('axis-y', { key: 'axis-y', mode: 'axis', axis: 'y', visuals: _0x23a06e['visuals'] }),
    _0xdaa920['set']('axis-z', { key: 'axis-z', mode: 'axis', axis: 'z', visuals: _0x38bb8e['visuals'] }),
    (_0x41ea05['pickMesh']['userData']['gizmoHandleKey'] = 'axis-x'),
    (_0x23a06e['pickMesh']['userData']['gizmoHandleKey'] = 'axis-y'),
    (_0x38bb8e['pickMesh']['userData']['gizmoHandleKey'] = 'axis-z'),
    _0x4d8355['push'](_0x41ea05['pickMesh'], _0x23a06e['pickMesh'], _0x38bb8e['pickMesh']));
  const _0x4083c3 = ({
    key: _0x47bada,
    group: _0x1cfec3,
    handleStore: _0x5a0e61,
    mode: mode = 'plane',
    normalAxis: _0x1bc7af,
    offset: _0x119df1,
    horizontalColor: _0x151b8a,
    verticalColor: _0x1530f3,
    linkedAxes: _0x4f07d6,
    rotation: _0x582d13,
  }) => {
    const { group: _0x584699, visuals: _0x4b7b42 } = _0x568f28(
        { horizontalColor: _0x151b8a, verticalColor: _0x1530f3 },
        GIZMO_BASE_PLANE_SIZE,
      ),
      _0x41207e = _0x4fae50(
        new threeRuntime['MeshBasicMaterial']({
          color: 0xffffff,
          transparent: !![],
          opacity: 0x0,
          side: threeRuntime['DoubleSide'],
          depthWrite: ![],
        }),
        { transparent: !![], opacity: 0x0 },
      ),
      _0x49f652 = new threeRuntime['Mesh'](_0x2201e8(GIZMO_BASE_PLANE_SIZE), _0x41207e);
    (_0x584699['position']['copy'](_0x119df1),
      _0x49f652['position']['copy'](_0x119df1),
      _0x582d13?.['x'] &&
        ((_0x584699['rotation']['x'] = _0x582d13['x']), (_0x49f652['rotation']['x'] = _0x582d13['x'])),
      _0x582d13?.['y'] &&
        ((_0x584699['rotation']['y'] = _0x582d13['y']), (_0x49f652['rotation']['y'] = _0x582d13['y'])),
      _0x582d13?.['z'] &&
        ((_0x584699['rotation']['z'] = _0x582d13['z']), (_0x49f652['rotation']['z'] = _0x582d13['z'])),
      _0x1341ef(_0x584699),
      _0x1341ef(_0x49f652),
      (_0x49f652['userData']['gizmoHandleKey'] = _0x47bada),
      _0x1cfec3['add'](_0x584699),
      _0x1cfec3['add'](_0x49f652),
      _0xdaa920['set'](_0x47bada, {
        key: _0x47bada,
        mode: mode,
        normalAxis: _0x1bc7af,
        linkedAxes: Array['isArray'](_0x4f07d6) ? [..._0x4f07d6] : [],
        visuals: _0x4b7b42,
      }),
      _0x4d8355['push'](_0x49f652),
      (_0x5a0e61[_0x47bada] = { visualGroup: _0x584699, pickMesh: _0x49f652 }));
  };
  (_0x4083c3({
    key: 'plane-xy',
    group: _0x1b6c0e,
    handleStore: _0x496e65,
    normalAxis: 'z',
    offset: new threeRuntime['Vector3'](0.38, 0.38, 0x0),
    horizontalColor: _0x39ad40,
    verticalColor: _0x39ad40,
    linkedAxes: ['x', 'y'],
    rotation: null,
  }),
    _0x4083c3({
      key: 'plane-xz',
      group: _0x1b6c0e,
      handleStore: _0x496e65,
      normalAxis: 'y',
      offset: new threeRuntime['Vector3'](0.38, 0x0, 0.38),
      horizontalColor: _0x5debb0,
      verticalColor: _0x5debb0,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math['PI'] / 0x2, z: -Math['PI'] / 0x2 },
    }),
    _0x4083c3({
      key: 'plane-yz',
      group: _0x1b6c0e,
      handleStore: _0x496e65,
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0x0, 0.38, 0.38),
      horizontalColor: _0x2f03d2,
      verticalColor: _0x2f03d2,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math['PI'] / 0x2, z: Math['PI'] / 0x2 },
    }),
    _0x5314ce['add'](_0x1b6c0e));
  const _0x337c6a = new threeRuntime['Group'](),
    _0x3250ae = _0x22a95e(_0x2f03d2, 'x'),
    _0x55cc1b = _0x22a95e(_0x5debb0, 'y'),
    _0x4b30af = _0x22a95e(_0x39ad40, 'z');
  (_0x337c6a['add'](_0x3250ae['group'], _0x55cc1b['group'], _0x4b30af['group']),
    (_0x1f59fc['x'] = _0x3250ae),
    (_0x1f59fc['y'] = _0x55cc1b),
    (_0x1f59fc['z'] = _0x4b30af),
    _0xdaa920['set']('rotate-x', {
      key: 'rotate-x',
      mode: 'rotate',
      axis: 'x',
      visuals: _0x3250ae['visuals'],
    }),
    _0xdaa920['set']('rotate-y', {
      key: 'rotate-y',
      mode: 'rotate',
      axis: 'y',
      visuals: _0x55cc1b['visuals'],
    }),
    _0xdaa920['set']('rotate-z', {
      key: 'rotate-z',
      mode: 'rotate',
      axis: 'z',
      visuals: _0x4b30af['visuals'],
    }),
    (_0x3250ae['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-x'),
    (_0x55cc1b['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-y'),
    (_0x4b30af['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-z'),
    _0x4d8355['push'](_0x3250ae['pickMesh'], _0x55cc1b['pickMesh'], _0x4b30af['pickMesh']),
    _0x5314ce['add'](_0x337c6a));
  const _0x2bdd1f = new threeRuntime['Group'](),
    _0x3800a8 = _0x186b4b(_0x2f03d2, 'x'),
    _0x3cb665 = _0x186b4b(_0x5debb0, 'y'),
    _0x4b50d3 = _0x186b4b(_0x39ad40, 'z');
  (_0x2bdd1f['add'](_0x3800a8['group'], _0x3cb665['group'], _0x4b50d3['group']),
    (_0x506d1b['x'] = _0x3800a8),
    (_0x506d1b['y'] = _0x3cb665),
    (_0x506d1b['z'] = _0x4b50d3),
    _0xdaa920['set']('scale-x', {
      key: 'scale-x',
      mode: 'scale-axis',
      axis: 'x',
      visuals: _0x3800a8['visuals'],
    }),
    _0xdaa920['set']('scale-y', {
      key: 'scale-y',
      mode: 'scale-axis',
      axis: 'y',
      visuals: _0x3cb665['visuals'],
    }),
    _0xdaa920['set']('scale-z', {
      key: 'scale-z',
      mode: 'scale-axis',
      axis: 'z',
      visuals: _0x4b50d3['visuals'],
    }),
    (_0x3800a8['pickMesh']['userData']['gizmoHandleKey'] = 'scale-x'),
    (_0x3cb665['pickMesh']['userData']['gizmoHandleKey'] = 'scale-y'),
    (_0x4b50d3['pickMesh']['userData']['gizmoHandleKey'] = 'scale-z'),
    _0x4d8355['push'](_0x3800a8['pickMesh'], _0x3cb665['pickMesh'], _0x4b50d3['pickMesh']));
  const _0x409099 = resolveThemeColor('--white', '--white'),
    _0x678c9b = _0x4fae50(
      new threeRuntime['MeshBasicMaterial']({
        color: _0x409099['clone'](),
        transparent: !![],
        opacity: 0.98,
      }),
      { transparent: !![], opacity: 0.98 },
    ),
    _0x36b6b2 = new threeRuntime['Mesh'](new threeRuntime['BoxGeometry'](0.18, 0.18, 0.18), _0x678c9b);
  (_0x1341ef(_0x36b6b2),
    (_0x36b6b2['userData']['gizmoHandleKey'] = 'scale-uniform'),
    _0x2bdd1f['add'](_0x36b6b2));
  const _0x3d6f4f = new threeRuntime['Mesh'](
    new threeRuntime['BoxGeometry'](0.34, 0.34, 0.34),
    _0x4fae50(new threeRuntime['MeshBasicMaterial']({ color: 0xffffff, transparent: !![], opacity: 0x0 }), {
      transparent: !![],
      opacity: 0x0,
    }),
  );
  (_0x1341ef(_0x3d6f4f),
    (_0x3d6f4f['userData']['gizmoHandleKey'] = 'scale-uniform'),
    _0x2bdd1f['add'](_0x3d6f4f),
    _0xdaa920['set']('scale-uniform', {
      key: 'scale-uniform',
      mode: 'scale-uniform',
      linkedAxes: ['x', 'y', 'z'],
      visuals: [{ material: _0x678c9b, color: _0x409099['clone'](), opacity: 0.98 }],
    }),
    _0x4d8355['push'](_0x3d6f4f));
  for (const [_0x57beb3, _0x4a805d, _0x59a7a6, _0x7b8382, _0x1abb62, _0x9d1169] of [
    ['scale-plane-xy', 'z', new threeRuntime['Vector3'](0.38, 0.38, 0x0), _0x39ad40, ['x', 'y'], null],
    [
      'scale-plane-xz',
      'y',
      new threeRuntime['Vector3'](0.38, 0x0, 0.38),
      _0x5debb0,
      ['x', 'z'],
      { x: -Math['PI'] / 0x2, z: -Math['PI'] / 0x2 },
    ],
    [
      'scale-plane-yz',
      'x',
      new threeRuntime['Vector3'](0x0, 0.38, 0.38),
      _0x2f03d2,
      ['y', 'z'],
      { y: Math['PI'] / 0x2, z: Math['PI'] / 0x2 },
    ],
  ]) {
    _0x4083c3({
      key: _0x57beb3,
      group: _0x2bdd1f,
      handleStore: _0x25988e,
      mode: 'scale-plane',
      normalAxis: _0x4a805d,
      offset: _0x59a7a6,
      horizontalColor: _0x7b8382,
      verticalColor: _0x7b8382,
      linkedAxes: _0x1abb62,
      rotation: _0x9d1169,
    });
  }
  return (
    _0x5314ce['add'](_0x2bdd1f),
    {
      root: _0x5314ce,
      moveGroup: _0x1b6c0e,
      rotateGroup: _0x337c6a,
      scaleGroup: _0x2bdd1f,
      handles: _0xdaa920,
      pickMeshes: _0x4d8355,
      hoverHandle: null,
      activeHandle: null,
      dragLock: null,
      currentTool: 'move',
      moveAxes: _0x3690c9,
      scaleAxes: _0x506d1b,
      rotateRings: _0x1f59fc,
      planeHandles: _0x496e65,
      scalePlaneHandles: _0x25988e,
      baseLayout: {
        axisLength: GIZMO_BASE_AXIS_LENGTH,
        scaleLength: GIZMO_BASE_SCALE_LENGTH,
        rotateRadius: GIZMO_BASE_ROTATE_RADIUS,
        planeOffset: GIZMO_BASE_PLANE_OFFSET,
        planeSize: GIZMO_BASE_PLANE_SIZE,
      },
    }
  );
}
