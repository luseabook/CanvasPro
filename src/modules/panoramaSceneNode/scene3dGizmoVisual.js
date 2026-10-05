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
  configureGizmoMaterial: configureGizmoMaterial,
  configureGizmoObject: configureGizmoObject,
  createMoveAxis: createMoveAxis,
  createPlaneCornerPickGeometry: createPlaneCornerPickGeometry,
  createPlaneCornerVisual: createPlaneCornerVisual,
  createRotateRing: createRotateRing,
  createScaleAxis: createScaleAxis,
} = {}) {
  const horizontalColor = resolveThemeColor('--red', '--red'),
    horizontalColor2 = resolveThemeColor('--green', '--green'),
    horizontalColor3 = resolveThemeColor('--blue', '--blue'),
    root = new threeRuntime['Group']();
  ((root['visible'] = false), configureGizmoObject(root));
  const group = new threeRuntime['Group'](),
    handles = new Map(),
    pickMeshes = [],
    moveAxes = {},
    scaleAxes = {},
    rotateRings = {},
    handleStore = {},
    handleStore2 = {},
    visuals = createMoveAxis(horizontalColor, 'x'),
    visuals2 = createMoveAxis(horizontalColor2, 'y'),
    visuals3 = createMoveAxis(horizontalColor3, 'z');
  (group['add'](visuals['group']),
    group['add'](visuals2['group']),
    group['add'](visuals3['group']),
    (moveAxes['x'] = visuals),
    (moveAxes['y'] = visuals2),
    (moveAxes['z'] = visuals3),
    handles['set']('axis-x', { key: 'axis-x', mode: 'axis', axis: 'x', visuals: visuals['visuals'] }),
    handles['set']('axis-y', { key: 'axis-y', mode: 'axis', axis: 'y', visuals: visuals2['visuals'] }),
    handles['set']('axis-z', { key: 'axis-z', mode: 'axis', axis: 'z', visuals: visuals3['visuals'] }),
    (visuals['pickMesh']['userData']['gizmoHandleKey'] = 'axis-x'),
    (visuals2['pickMesh']['userData']['gizmoHandleKey'] = 'axis-y'),
    (visuals3['pickMesh']['userData']['gizmoHandleKey'] = 'axis-z'),
    pickMeshes['push'](visuals['pickMesh'], visuals2['pickMesh'], visuals3['pickMesh']));
  const run = ({
    key: key,
    group: group2,
    handleStore: handleStore3,
    mode: mode = 'plane',
    normalAxis: normalAxis,
    offset: offset,
    horizontalColor: horizontalColor4,
    verticalColor: verticalColor,
    linkedAxes: linkedAxes,
    rotation: rotation,
  }) => {
    const { group: group3, visuals: visuals4 } = createPlaneCornerVisual(
        { horizontalColor: horizontalColor4, verticalColor: verticalColor },
        GIZMO_BASE_PLANE_SIZE,
      ),
      value = configureGizmoMaterial(
        new threeRuntime['MeshBasicMaterial']({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: threeRuntime['DoubleSide'],
          depthWrite: false,
        }),
        { transparent: true, opacity: 0 },
      ),
      pickMesh = new threeRuntime['Mesh'](createPlaneCornerPickGeometry(GIZMO_BASE_PLANE_SIZE), value);
    (group3['position']['copy'](offset),
      pickMesh['position']['copy'](offset),
      rotation?.['x'] &&
        ((group3['rotation']['x'] = rotation['x']), (pickMesh['rotation']['x'] = rotation['x'])),
      rotation?.['y'] &&
        ((group3['rotation']['y'] = rotation['y']), (pickMesh['rotation']['y'] = rotation['y'])),
      rotation?.['z'] &&
        ((group3['rotation']['z'] = rotation['z']), (pickMesh['rotation']['z'] = rotation['z'])),
      configureGizmoObject(group3),
      configureGizmoObject(pickMesh),
      (pickMesh['userData']['gizmoHandleKey'] = key),
      group2['add'](group3),
      group2['add'](pickMesh),
      handles['set'](key, {
        key: key,
        mode: mode,
        normalAxis: normalAxis,
        linkedAxes: Array['isArray'](linkedAxes) ? [...linkedAxes] : [],
        visuals: visuals4,
      }),
      pickMeshes['push'](pickMesh),
      (handleStore3[key] = { visualGroup: group3, pickMesh: pickMesh }));
  };
  (run({
    key: 'plane-xy',
    group: group,
    handleStore: handleStore,
    normalAxis: 'z',
    offset: new threeRuntime['Vector3'](0.38, 0.38, 0),
    horizontalColor: horizontalColor3,
    verticalColor: horizontalColor3,
    linkedAxes: ['x', 'y'],
    rotation: null,
  }),
    run({
      key: 'plane-xz',
      group: group,
      handleStore: handleStore,
      normalAxis: 'y',
      offset: new threeRuntime['Vector3'](0.38, 0, 0.38),
      horizontalColor: horizontalColor2,
      verticalColor: horizontalColor2,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math['PI'] / 2, z: -Math['PI'] / 2 },
    }),
    run({
      key: 'plane-yz',
      group: group,
      handleStore: handleStore,
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor: horizontalColor,
      verticalColor: horizontalColor,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math['PI'] / 2, z: Math['PI'] / 2 },
    }),
    root['add'](group));
  const rotateGroup = new threeRuntime['Group'](),
    visuals5 = createRotateRing(horizontalColor, 'x'),
    visuals6 = createRotateRing(horizontalColor2, 'y'),
    visuals7 = createRotateRing(horizontalColor3, 'z');
  (rotateGroup['add'](visuals5['group'], visuals6['group'], visuals7['group']),
    (rotateRings['x'] = visuals5),
    (rotateRings['y'] = visuals6),
    (rotateRings['z'] = visuals7),
    handles['set']('rotate-x', {
      key: 'rotate-x',
      mode: 'rotate',
      axis: 'x',
      visuals: visuals5['visuals'],
    }),
    handles['set']('rotate-y', {
      key: 'rotate-y',
      mode: 'rotate',
      axis: 'y',
      visuals: visuals6['visuals'],
    }),
    handles['set']('rotate-z', {
      key: 'rotate-z',
      mode: 'rotate',
      axis: 'z',
      visuals: visuals7['visuals'],
    }),
    (visuals5['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-x'),
    (visuals6['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-y'),
    (visuals7['pickMesh']['userData']['gizmoHandleKey'] = 'rotate-z'),
    pickMeshes['push'](visuals5['pickMesh'], visuals6['pickMesh'], visuals7['pickMesh']),
    root['add'](rotateGroup));
  const group4 = new threeRuntime['Group'](),
    visuals8 = createScaleAxis(horizontalColor, 'x'),
    visuals9 = createScaleAxis(horizontalColor2, 'y'),
    visuals10 = createScaleAxis(horizontalColor3, 'z');
  (group4['add'](visuals8['group'], visuals9['group'], visuals10['group']),
    (scaleAxes['x'] = visuals8),
    (scaleAxes['y'] = visuals9),
    (scaleAxes['z'] = visuals10),
    handles['set']('scale-x', {
      key: 'scale-x',
      mode: 'scale-axis',
      axis: 'x',
      visuals: visuals8['visuals'],
    }),
    handles['set']('scale-y', {
      key: 'scale-y',
      mode: 'scale-axis',
      axis: 'y',
      visuals: visuals9['visuals'],
    }),
    handles['set']('scale-z', {
      key: 'scale-z',
      mode: 'scale-axis',
      axis: 'z',
      visuals: visuals10['visuals'],
    }),
    (visuals8['pickMesh']['userData']['gizmoHandleKey'] = 'scale-x'),
    (visuals9['pickMesh']['userData']['gizmoHandleKey'] = 'scale-y'),
    (visuals10['pickMesh']['userData']['gizmoHandleKey'] = 'scale-z'),
    pickMeshes['push'](visuals8['pickMesh'], visuals9['pickMesh'], visuals10['pickMesh']));
  const color = resolveThemeColor('--white', '--white'),
    material = configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({
        color: color['clone'](),
        transparent: true,
        opacity: 0.98,
      }),
      { transparent: true, opacity: 0.98 },
    ),
    item = new threeRuntime['Mesh'](new threeRuntime['BoxGeometry'](0.18, 0.18, 0.18), material);
  (configureGizmoObject(item), (item['userData']['gizmoHandleKey'] = 'scale-uniform'), group4['add'](item));
  const index = new threeRuntime['Mesh'](
    new threeRuntime['BoxGeometry'](0.34, 0.34, 0.34),
    configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({ color: 0xffffff, transparent: true, opacity: 0 }),
      {
        transparent: true,
        opacity: 0,
      },
    ),
  );
  (configureGizmoObject(index),
    (index['userData']['gizmoHandleKey'] = 'scale-uniform'),
    group4['add'](index),
    handles['set']('scale-uniform', {
      key: 'scale-uniform',
      mode: 'scale-uniform',
      linkedAxes: ['x', 'y', 'z'],
      visuals: [{ material: material, color: color['clone'](), opacity: 0.98 }],
    }),
    pickMeshes['push'](index));
  for (const [key2, normalAxis2, offset2, horizontalColor5, linkedAxes2, rotation2] of [
    ['scale-plane-xy', 'z', new threeRuntime['Vector3'](0.38, 0.38, 0), horizontalColor3, ['x', 'y'], null],
    [
      'scale-plane-xz',
      'y',
      new threeRuntime['Vector3'](0.38, 0, 0.38),
      horizontalColor2,
      ['x', 'z'],
      { x: -Math['PI'] / 2, z: -Math['PI'] / 2 },
    ],
    [
      'scale-plane-yz',
      'x',
      new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor,
      ['y', 'z'],
      { y: Math['PI'] / 2, z: Math['PI'] / 2 },
    ],
  ]) {
    run({
      key: key2,
      group: group4,
      handleStore: handleStore2,
      mode: 'scale-plane',
      normalAxis: normalAxis2,
      offset: offset2,
      horizontalColor: horizontalColor5,
      verticalColor: horizontalColor5,
      linkedAxes: linkedAxes2,
      rotation: rotation2,
    });
  }
  return (
    root['add'](group4),
    {
      root: root,
      moveGroup: group,
      rotateGroup: rotateGroup,
      scaleGroup: group4,
      handles: handles,
      pickMeshes: pickMeshes,
      hoverHandle: null,
      activeHandle: null,
      dragLock: null,
      currentTool: 'move',
      moveAxes: moveAxes,
      scaleAxes: scaleAxes,
      rotateRings: rotateRings,
      planeHandles: handleStore,
      scalePlaneHandles: handleStore2,
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
