import * as threeRuntime from './threeRuntime.js';
import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_FOCAL_LENGTH_MAX_MM,
  SCENE_FOCAL_LENGTH_MIN_MM,
  computeAxisScaleFactor,
  computeAxisScaleFactorFromScreenDelta,
  focalLengthToFov,
  fovToFocalLength,
  computeConstrainedMoveDelta,
  computeSignedRotationDelta,
  computeStableGridSnap,
  dampAngle,
  dampScalar,
  forwardVectorFromYawPitch,
  computeUniformScaleFactor,
  cameraPoseToSceneViewFromReference,
  normalizeAngle,
  resolvePanoramaViewPose,
  resolveSceneCameraPose,
} from '../../core/panoramaSceneMath.js';
import { PANORAMA_SCENE_COLOR_TOKENS } from './sceneNode.js';
import {
  createPanoramaCharacterModelInstance,
  resolvePanoramaCharacterGender,
} from './characterModelRegistry.js';
import {
  applySelectionEmphasis,
  clamp01,
  createSelectionRing,
  normalizePanoramaTextureUrl,
  resolveThemeColor,
  resolveThemeColorValue,
} from './scene3dTheme.js';
import { resolveAxisScreenDragMetric } from './scene3dScreenProjection.js';
import { t } from '../../i18n/index.js';
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
const GRID_MINOR_STEP = 1,
  GRID_MAJOR_STEP = 10,
  GRID_BASE_SPAN = 220,
  GRID_SNAP_HYSTERESIS = 0.12,
  VIEW_DAMPING_TIME_CONSTANT_MS = 120,
  VIEW_DAMPING_WINDOW_MS = 220,
  VIEW_DAMPING_MAX_DT_MS = 64,
  POSE_SETTLE_EPSILON = 0.0005,
  GIZMO_BASE_AXIS_LENGTH = 1.35,
  GIZMO_BASE_SCALE_LENGTH = 1.22,
  GIZMO_BASE_ROTATE_RADIUS = GIZMO_BASE_SCALE_LENGTH * 0.5,
  GIZMO_BASE_PLANE_OFFSET = 0.38,
  GIZMO_BASE_PLANE_SIZE = 0.42,
  GIZMO_MOVE_SHAFT_LENGTH = 1.2,
  GIZMO_MOVE_HEAD_LENGTH = 0.18,
  GIZMO_MOVE_PICK_LENGTH = 1.6,
  GIZMO_SCALE_SHAFT_LENGTH = 1.05,
  GIZMO_SCALE_HEAD_SIZE = 0.135,
  GIZMO_SCALE_PICK_LENGTH = 1.5,
  GIZMO_MARGIN_WORLD_MIN = 0.12,
  GIZMO_MARGIN_WORLD_RATIO = 0.12,
  DEFAULT_BG_FALLBACK = { day: '--white-90', night: '--bg' };
function createLineGeometry(key, index) {
  return new threeRuntime['BufferGeometry']().setFromPoints([key, index]);
}
function setLineGeometryPoints(enabled, result, data) {
  if (!enabled?.geometry) return;
  const box = result?.isVector3 ? result : toVector3Like(result),
    box2 = data?.isVector3 ? data : toVector3Like(data),
    enabled2 = enabled.geometry.getAttribute('position');
  if (!enabled2 || enabled2.count < 2) {
    (enabled.geometry.dispose?.(), (enabled.geometry = createLineGeometry(box, box2)));
    return;
  }
  (enabled2.setXYZ(0, box.x, box.y, box.z),
    enabled2.setXYZ(1, box2.x, box2.y, box2.z),
    (enabled2.needsUpdate = true),
    enabled.geometry.computeBoundingSphere?.(),
    enabled.geometry.computeBoundingBox?.());
}
function configureGizmoMaterial(enabled3, { transparent: transparent = false, opacity: opacity = 1 } = {}) {
  if (!enabled3) return enabled3;
  enabled3.transparent = transparent;
  if ('opacity' in enabled3) enabled3.opacity = opacity;
  return (
    (enabled3.depthWrite = false),
    (enabled3.depthTest = false),
    (enabled3.toneMapped = false),
    (enabled3.fog = false),
    enabled3
  );
}
function configureGizmoObject(enabled4) {
  if (!enabled4) return enabled4;
  return ((enabled4.frustumCulled = false), (enabled4.renderOrder = 100), enabled4);
}
function orientAxisHead(enabled5, options) {
  if (!enabled5) return;
  enabled5.rotation.set(0, 0, 0);
  if (options === 'x') enabled5.rotation.z = -Math.PI / 2;
  if (options === 'z') enabled5.rotation.x = Math.PI / 2;
}
function setAxisLineEnd(enabled6, target, source) {
  if (!enabled6?.geometry) return;
  const box3 = vectorFromAxisName(target),
    next = Math.max(0, Number(source) || 0),
    enabled7 = enabled6.geometry.getAttribute('position');
  if (!enabled7 || enabled7.count < 2) return;
  (enabled7.setXYZ(0, 0, 0, 0),
    enabled7.setXYZ(1, box3.x * next, box3.y * next, box3.z * next),
    (enabled7.needsUpdate = true),
    enabled6.geometry.computeBoundingSphere?.(),
    enabled6.geometry.computeBoundingBox?.());
}
function setAxisHandleLayout(enabled8, current, entry = 0) {
  if (!enabled8) return;
  const enabled9 = enabled8.userData?.axisName || enabled8.axisName;
  if (!enabled9) return;
  const vectorFromAxisName2 = vectorFromAxisName(enabled9),
    record = Math.max(0, Number(current) || 0),
    payload = Number(entry) || 0;
  enabled8.position.copy(vectorFromAxisName2.multiplyScalar(record + payload));
}
function createMoveAxis(handle, axisName) {
  const color = handle.isColor ? handle.clone() : new threeRuntime.Color(handle),
    axis = vectorFromAxisName(axisName),
    group = new threeRuntime['Group']();
  configureGizmoObject(group);
  const material = configureGizmoMaterial(
      new threeRuntime.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.96 }),
      { transparent: true, opacity: 0.96 },
    ),
    shaftLine = new threeRuntime['Line'](
      createLineGeometry(
        new threeRuntime['Vector3'](0, 0, 0),
        axis.clone().multiplyScalar(GIZMO_MOVE_SHAFT_LENGTH),
      ),
      material,
    );
  (configureGizmoObject(shaftLine), group.add(shaftLine));
  const material2 = configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.98 }),
      { transparent: true, opacity: 0.98 },
    ),
    headMesh = new threeRuntime['Mesh'](
      new threeRuntime['ConeGeometry'](0.06, GIZMO_MOVE_HEAD_LENGTH, 14),
      material2,
    );
  ((headMesh.userData.axisName = axisName),
    setAxisHandleLayout(
      headMesh,
      GIZMO_BASE_AXIS_LENGTH - GIZMO_MOVE_HEAD_LENGTH * 0.5,
      GIZMO_MOVE_HEAD_LENGTH * 0.5,
    ),
    orientAxisHead(headMesh, axisName),
    configureGizmoObject(headMesh),
    group.add(headMesh));
  const pickMesh = new threeRuntime['Mesh'](
    new threeRuntime['CylinderGeometry'](0.14, 0.14, GIZMO_MOVE_PICK_LENGTH, 10),
    configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    (pickMesh.userData.axisName = axisName),
    setAxisHandleLayout(pickMesh, GIZMO_MOVE_PICK_LENGTH * 0.5),
    orientAxisHead(pickMesh, axisName),
    configureGizmoObject(pickMesh),
    group.add(pickMesh),
    {
      axisName: axisName,
      axis: axis.clone(),
      group: group,
      shaftLine: shaftLine,
      headMesh: headMesh,
      visuals: [
        { material: material, color: color.clone(), opacity: 1 },
        { material: material2, color: color.clone(), opacity: 1 },
      ],
      pickMesh: pickMesh,
    }
  );
}
function createScaleAxis(state, axisName2) {
  const color2 = state.isColor ? state.clone() : new threeRuntime['Color'](state),
    axis2 = vectorFromAxisName(axisName2),
    group2 = new threeRuntime['Group']();
  configureGizmoObject(group2);
  const material3 = configureGizmoMaterial(
      new threeRuntime['LineBasicMaterial']({ color: color2.clone(), transparent: true, opacity: 0.96 }),
      { transparent: true, opacity: 0.96 },
    ),
    shaftLine2 = new threeRuntime.Line(
      createLineGeometry(
        new threeRuntime['Vector3'](0, 0, 0),
        axis2.clone().multiplyScalar(GIZMO_SCALE_SHAFT_LENGTH),
      ),
      material3,
    );
  (configureGizmoObject(shaftLine2), group2.add(shaftLine2));
  const material4 = configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({ color: color2.clone(), transparent: true, opacity: 0.98 }),
      { transparent: true, opacity: 0.98 },
    ),
    headMesh2 = new threeRuntime.Mesh(
      new threeRuntime['BoxGeometry'](GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE),
      material4,
    );
  ((headMesh2.userData.axisName = axisName2),
    setAxisHandleLayout(
      headMesh2,
      GIZMO_BASE_SCALE_LENGTH - GIZMO_SCALE_HEAD_SIZE * 0.5,
      GIZMO_SCALE_HEAD_SIZE * 0.5,
    ),
    orientAxisHead(headMesh2, axisName2),
    configureGizmoObject(headMesh2),
    group2.add(headMesh2));
  const pickMesh2 = new threeRuntime['Mesh'](
    new threeRuntime['CylinderGeometry'](0.14, 0.14, GIZMO_SCALE_PICK_LENGTH, 10),
    configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    (pickMesh2.userData.axisName = axisName2),
    setAxisHandleLayout(pickMesh2, GIZMO_SCALE_PICK_LENGTH * 0.5),
    orientAxisHead(pickMesh2, axisName2),
    configureGizmoObject(pickMesh2),
    group2.add(pickMesh2),
    {
      axisName: axisName2,
      axis: axis2.clone(),
      group: group2,
      shaftLine: shaftLine2,
      headMesh: headMesh2,
      visuals: [
        { material: material3, color: color2.clone(), opacity: 1 },
        { material: material4, color: color2.clone(), opacity: 1 },
      ],
      pickMesh: pickMesh2,
    }
  );
}
function createRotateRing(config, axisName3) {
  const color3 = config.isColor ? config.clone() : new threeRuntime['Color'](config),
    group3 = new threeRuntime['Group']();
  configureGizmoObject(group3);
  const material5 = configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({
        color: color3.clone(),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0.86 },
    ),
    scope = new threeRuntime['Mesh'](
      new threeRuntime.TorusGeometry(GIZMO_BASE_ROTATE_RADIUS, 0.016, 8, 64),
      material5,
    );
  if (axisName3 === 'x') scope.rotation.y = Math.PI / 2;
  else axisName3 === 'y' && (scope.rotation.x = Math.PI / 2);
  (configureGizmoObject(scope), group3.add(scope));
  const pickMesh3 = new threeRuntime['Mesh'](
    new threeRuntime['TorusGeometry'](GIZMO_BASE_ROTATE_RADIUS, 0.11, 8, 64),
    configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    pickMesh3.rotation.copy(scope.rotation),
    configureGizmoObject(pickMesh3),
    group3.add(pickMesh3),
    {
      axisName: axisName3,
      group: group3,
      visuals: [{ material: material5, color: color3.clone(), opacity: 0.9 }],
      pickMesh: pickMesh3,
    }
  );
}
function getPlaneCornerMetrics(input = GIZMO_BASE_PLANE_SIZE, output = 0) {
  const armLength = input * 0.56,
    armThickness = Math.max(input * 0.065, 0.012),
    cornerInset = input * 0.06,
    outer = input * 0.5 - cornerInset,
    inner = outer - armLength,
    armCenter = (outer + inner) * 0.5,
    halfThickness = armThickness * 0.5 + output,
    value2 = armLength * 0.46 - output * 0.35;
  return {
    armLength: armLength,
    armThickness: armThickness,
    cornerInset: cornerInset,
    outer: outer,
    inner: inner,
    armCenter: armCenter,
    halfThickness: halfThickness,
    diagonalStart: Math.max(inner, inner + value2),
    diagonalEnd: Math.max(inner, inner + value2),
  };
}
function createPlaneCornerPickGeometry(value3 = GIZMO_BASE_PLANE_SIZE) {
  const value4 = Math.max(value3 * 0.018, 0.006),
    planeCornerMetrics = getPlaneCornerMetrics(value3, value4),
    ctx = new threeRuntime.Shape();
  return (
    ctx.moveTo(
      planeCornerMetrics.inner - value4,
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
    ),
    ctx.lineTo(
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
    ),
    ctx.lineTo(
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
      planeCornerMetrics.inner - value4,
    ),
    ctx.lineTo(
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
      planeCornerMetrics.inner - value4,
    ),
    ctx.lineTo(
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
      planeCornerMetrics.diagonalEnd - value4,
    ),
    ctx.lineTo(
      planeCornerMetrics.diagonalStart - value4,
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
    ),
    ctx.lineTo(
      planeCornerMetrics.inner - value4,
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
    ),
    ctx.closePath(),
    new threeRuntime.ShapeGeometry(ctx)
  );
}
function createPlaneCornerVisual(
  { horizontalColor: horizontalColor, verticalColor: verticalColor } = {},
  value5 = GIZMO_BASE_PLANE_SIZE,
) {
  const value6 = horizontalColor?.isColor
      ? horizontalColor.clone()
      : horizontalColor
        ? new threeRuntime['Color'](horizontalColor)
        : resolveThemeColor('--white', '--white'),
    value7 = verticalColor?.isColor
      ? verticalColor.clone()
      : verticalColor
        ? new threeRuntime.Color(verticalColor)
        : resolveThemeColor('--white', '--white'),
    group4 = new threeRuntime['Group']();
  configureGizmoObject(group4);
  const planeCornerMetrics2 = getPlaneCornerMetrics(value5),
    visuals = [],
    color4 = value6.clone().lerp(value7, 0.5),
    handler = (value8, value9, value10, value11, color5) => {
      const material6 = configureGizmoMaterial(
          new threeRuntime['MeshBasicMaterial']({
            color: color5.clone(),
            transparent: true,
            opacity: 0.98,
            side: threeRuntime.DoubleSide,
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.98 },
        ),
        value12 = new threeRuntime['Mesh'](new threeRuntime.PlaneGeometry(value8, value9), material6);
      (value12.position.set(value10, value11, 0),
        configureGizmoObject(value12),
        group4.add(value12),
        visuals.push({ material: material6, color: color5.clone(), opacity: 0.98 }));
    };
  (handler(
    planeCornerMetrics2.armLength,
    planeCornerMetrics2.armThickness,
    planeCornerMetrics2.armCenter,
    planeCornerMetrics2.outer,
    value6,
  ),
    handler(
      planeCornerMetrics2.armThickness,
      planeCornerMetrics2.armLength,
      planeCornerMetrics2.outer,
      planeCornerMetrics2.armCenter,
      value7,
    ));
  {
    const material7 = configureGizmoMaterial(
        new threeRuntime.MeshBasicMaterial({
          color: color4.clone(),
          transparent: true,
          opacity: 0.98,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.98 },
      ),
      value13 = new threeRuntime['Mesh'](
        new threeRuntime['PlaneGeometry'](planeCornerMetrics2.armThickness, planeCornerMetrics2.armThickness),
        material7,
      );
    (value13.position.set(planeCornerMetrics2.outer, planeCornerMetrics2.outer, 0),
      configureGizmoObject(value13),
      group4.add(value13),
      visuals.push({ material: material7, color: color4.clone(), opacity: 0.98 }));
  }
  {
    const material8 = configureGizmoMaterial(
        new threeRuntime['MeshBasicMaterial']({
          color: color4,
          transparent: true,
          opacity: 0.38,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.38 },
      ),
      el = new threeRuntime.BufferGeometry(),
      value14 = planeCornerMetrics2.armThickness * 0.5;
    (el.setAttribute(
      'position',
      new threeRuntime['Float32BufferAttribute'](
        [
          planeCornerMetrics2.diagonalStart,
          planeCornerMetrics2.outer - value14,
          0,
          planeCornerMetrics2.outer - value14,
          planeCornerMetrics2.outer - value14,
          0,
          planeCornerMetrics2.outer - value14,
          planeCornerMetrics2.diagonalEnd,
          0,
        ],
        3,
      ),
    ),
      el.setIndex([0, 1, 2]),
      el.computeVertexNormals());
    const value15 = new threeRuntime['Mesh'](el, material8);
    (configureGizmoObject(value15),
      group4.add(value15),
      visuals.push({ material: material8, color: color4.clone(), opacity: 0.38 }));
  }
  return { group: group4, visuals: visuals };
}
function createGizmoVisual() {
  const horizontalColor2 = resolveThemeColor('--red', '--red'),
    horizontalColor3 = resolveThemeColor('--green', '--green'),
    horizontalColor4 = resolveThemeColor('--blue', '--blue'),
    root = new threeRuntime['Group']();
  ((root.visible = false), configureGizmoObject(root));
  const group5 = new threeRuntime['Group'](),
    handles = new Map(),
    pickMeshes = [],
    moveAxes = {},
    scaleAxes = {},
    rotateRings = {},
    handleStore = {},
    handleStore2 = {},
    visuals2 = createMoveAxis(horizontalColor2, 'x'),
    visuals3 = createMoveAxis(horizontalColor3, 'y'),
    visuals4 = createMoveAxis(horizontalColor4, 'z');
  (group5.add(visuals2.group),
    group5.add(visuals3.group),
    group5.add(visuals4.group),
    (moveAxes.x = visuals2),
    (moveAxes.y = visuals3),
    (moveAxes.z = visuals4),
    handles.set('axis-x', { key: 'axis-x', mode: 'axis', axis: 'x', visuals: visuals2.visuals }),
    handles.set('axis-y', { key: 'axis-y', mode: 'axis', axis: 'y', visuals: visuals3.visuals }),
    handles.set('axis-z', { key: 'axis-z', mode: 'axis', axis: 'z', visuals: visuals4.visuals }),
    (visuals2.pickMesh.userData.gizmoHandleKey = 'axis-x'),
    (visuals3.pickMesh.userData.gizmoHandleKey = 'axis-y'),
    (visuals4.pickMesh.userData.gizmoHandleKey = 'axis-z'),
    pickMeshes.push(visuals2.pickMesh, visuals3.pickMesh, visuals4.pickMesh));
  const run = ({
    key: key2,
    group: group6,
    handleStore: handleStore3,
    mode: mode = 'plane',
    normalAxis: normalAxis,
    offset: offset,
    horizontalColor: horizontalColor5,
    verticalColor: verticalColor2,
    linkedAxes: linkedAxes,
    rotation: rotation,
  }) => {
    const { group: group7, visuals: visuals5 } = createPlaneCornerVisual(
        { horizontalColor: horizontalColor5, verticalColor: verticalColor2 },
        GIZMO_BASE_PLANE_SIZE,
      ),
      configureGizmoMaterial2 = configureGizmoMaterial(
        new threeRuntime['MeshBasicMaterial']({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0 },
      ),
      pickMesh4 = new threeRuntime['Mesh'](
        createPlaneCornerPickGeometry(GIZMO_BASE_PLANE_SIZE),
        configureGizmoMaterial2,
      );
    (group7.position.copy(offset),
      pickMesh4.position.copy(offset),
      rotation?.x && ((group7.rotation.x = rotation.x), (pickMesh4.rotation.x = rotation.x)),
      rotation?.y && ((group7.rotation.y = rotation.y), (pickMesh4.rotation.y = rotation.y)),
      rotation?.z && ((group7.rotation.z = rotation.z), (pickMesh4.rotation.z = rotation.z)),
      configureGizmoObject(group7),
      configureGizmoObject(pickMesh4),
      (pickMesh4.userData.gizmoHandleKey = key2),
      group6.add(group7),
      group6.add(pickMesh4),
      handles.set(key2, {
        key: key2,
        mode: mode,
        normalAxis: normalAxis,
        linkedAxes: Array.isArray(linkedAxes) ? [...linkedAxes] : [],
        visuals: visuals5,
      }),
      pickMeshes.push(pickMesh4),
      (handleStore3[key2] = { visualGroup: group7, pickMesh: pickMesh4 }));
  };
  (run({
    key: 'plane-xy',
    group: group5,
    handleStore: handleStore,
    normalAxis: 'z',
    offset: new threeRuntime.Vector3(0.38, 0.38, 0),
    horizontalColor: horizontalColor4,
    verticalColor: horizontalColor4,
    linkedAxes: ['x', 'y'],
    rotation: null,
  }),
    run({
      key: 'plane-xz',
      group: group5,
      handleStore: handleStore,
      normalAxis: 'y',
      offset: new threeRuntime.Vector3(0.38, 0, 0.38),
      horizontalColor: horizontalColor3,
      verticalColor: horizontalColor3,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math.PI / 2, z: -Math.PI / 2 },
    }),
    run({
      key: 'plane-yz',
      group: group5,
      handleStore: handleStore,
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor: horizontalColor2,
      verticalColor: horizontalColor2,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math.PI / 2, z: Math.PI / 2 },
    }),
    root.add(group5));
  const rotateGroup = new threeRuntime['Group'](),
    visuals6 = createRotateRing(horizontalColor2, 'x'),
    visuals7 = createRotateRing(horizontalColor3, 'y'),
    visuals8 = createRotateRing(horizontalColor4, 'z');
  (rotateGroup.add(visuals6.group),
    rotateGroup.add(visuals7.group),
    rotateGroup.add(visuals8.group),
    (rotateRings.x = visuals6),
    (rotateRings.y = visuals7),
    (rotateRings.z = visuals8),
    handles.set('rotate-x', { key: 'rotate-x', mode: 'rotate', axis: 'x', visuals: visuals6.visuals }),
    handles.set('rotate-y', { key: 'rotate-y', mode: 'rotate', axis: 'y', visuals: visuals7.visuals }),
    handles.set('rotate-z', { key: 'rotate-z', mode: 'rotate', axis: 'z', visuals: visuals8.visuals }),
    (visuals6.pickMesh.userData.gizmoHandleKey = 'rotate-x'),
    (visuals7.pickMesh.userData.gizmoHandleKey = 'rotate-y'),
    (visuals8.pickMesh.userData.gizmoHandleKey = 'rotate-z'),
    pickMeshes.push(visuals6.pickMesh, visuals7.pickMesh, visuals8.pickMesh),
    root.add(rotateGroup));
  const group8 = new threeRuntime['Group'](),
    visuals9 = createScaleAxis(horizontalColor2, 'x'),
    visuals10 = createScaleAxis(horizontalColor3, 'y'),
    visuals11 = createScaleAxis(horizontalColor4, 'z');
  return (
    group8.add(visuals9.group),
    group8.add(visuals10.group),
    group8.add(visuals11.group),
    (scaleAxes.x = visuals9),
    (scaleAxes.y = visuals10),
    (scaleAxes.z = visuals11),
    handles.set('scale-x', { key: 'scale-x', mode: 'scale-axis', axis: 'x', visuals: visuals9.visuals }),
    handles.set('scale-y', { key: 'scale-y', mode: 'scale-axis', axis: 'y', visuals: visuals10.visuals }),
    handles.set('scale-z', { key: 'scale-z', mode: 'scale-axis', axis: 'z', visuals: visuals11.visuals }),
    (visuals9.pickMesh.userData.gizmoHandleKey = 'scale-x'),
    (visuals10.pickMesh.userData.gizmoHandleKey = 'scale-y'),
    (visuals11.pickMesh.userData.gizmoHandleKey = 'scale-z'),
    pickMeshes.push(visuals9.pickMesh, visuals10.pickMesh, visuals11.pickMesh),
    run({
      key: 'scale-plane-xy',
      group: group8,
      handleStore: handleStore2,
      mode: 'scale-uniform',
      normalAxis: 'z',
      offset: new threeRuntime['Vector3'](0.38, 0.38, 0),
      horizontalColor: horizontalColor4,
      verticalColor: horizontalColor4,
      linkedAxes: ['x', 'y'],
      rotation: null,
    }),
    run({
      key: 'scale-plane-xz',
      group: group8,
      handleStore: handleStore2,
      mode: 'scale-uniform',
      normalAxis: 'y',
      offset: new threeRuntime.Vector3(0.38, 0, 0.38),
      horizontalColor: horizontalColor3,
      verticalColor: horizontalColor3,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math.PI / 2, z: -Math.PI / 2 },
    }),
    run({
      key: 'scale-plane-yz',
      group: group8,
      handleStore: handleStore2,
      mode: 'scale-uniform',
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor: horizontalColor2,
      verticalColor: horizontalColor2,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math.PI / 2, z: Math.PI / 2 },
    }),
    root.add(group8),
    {
      root: root,
      moveGroup: group5,
      rotateGroup: rotateGroup,
      scaleGroup: group8,
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
function eachMaterial(list, handler2) {
  if (!list) return;
  if (Array.isArray(list)) {
    list.forEach((item2) => handler2(item2));
    return;
  }
  handler2(list);
}
function createMannequinVisual(color6) {
  const group9 = new threeRuntime['Group'](),
    proxyRoot = new threeRuntime['Group']();
  group9.add(proxyRoot);
  const fallbackObjects = [],
    material9 = new threeRuntime['MeshStandardMaterial']({
      color: color6,
      roughness: 0.62,
      metalness: 0.08,
    }),
    headMaterial = material9.clone();
  headMaterial.color = material9.color.clone().offsetHSL(0, 0, 0.08);
  const head = new threeRuntime['Mesh'](new threeRuntime.SphereGeometry(0.155, 18, 16), headMaterial);
  ((head.position.y = 1.7),
    head.scale.set(0.96, 1.08, 0.94),
    proxyRoot.add(head),
    fallbackObjects.push(head));
  const neck = new threeRuntime.Mesh(new threeRuntime['CylinderGeometry'](0.052, 0.064, 0.12, 12), material9);
  ((neck.position.y = 1.51), proxyRoot.add(neck), fallbackObjects.push(neck));
  const chest = new threeRuntime['Mesh'](new threeRuntime['CapsuleGeometry'](0.17, 0.42, 6, 12), material9);
  ((chest.position.y = 1.26),
    chest.scale.set(1.38, 1.02, 0.92),
    proxyRoot.add(chest),
    fallbackObjects.push(chest));
  const waist = new threeRuntime.Mesh(new threeRuntime.CapsuleGeometry(0.105, 0.18, 5, 10), material9);
  ((waist.position.y = 0.98),
    waist.scale.set(1.02, 0.94, 0.86),
    proxyRoot.add(waist),
    fallbackObjects.push(waist));
  const pelvis = new threeRuntime['Mesh'](new threeRuntime['CapsuleGeometry'](0.14, 0.2, 5, 12), material9);
  ((pelvis.position.y = 0.77),
    pelvis.scale.set(1.28, 0.96, 0.98),
    proxyRoot.add(pelvis),
    fallbackObjects.push(pelvis));
  const value16 = new threeRuntime['Mesh'](new threeRuntime['SphereGeometry'](0.07, 12, 12), material9);
  (value16.position.set(-0.31, 1.43, 0), proxyRoot.add(value16), fallbackObjects.push(value16));
  const value17 = value16.clone();
  ((value17.position.x = 0.31), proxyRoot.add(value17), fallbackObjects.push(value17));
  const value18 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.048, 0.28, 4, 10),
    material9,
  );
  (value18.position.set(-0.39, 1.17, 0),
    (value18.rotation.z = 0.16),
    (value18.rotation.x = 0.03),
    proxyRoot.add(value18),
    fallbackObjects.push(value18));
  const value19 = value18.clone();
  ((value19.position.x = 0.39),
    (value19.rotation.z = -0.16),
    (value19.rotation.x = -0.03),
    proxyRoot.add(value19),
    fallbackObjects.push(value19));
  const value20 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.038, 0.26, 4, 10),
    material9,
  );
  (value20.position.set(-0.42, 0.86, 0.01),
    (value20.rotation.z = 0.03),
    (value20.rotation.x = 0.04),
    proxyRoot.add(value20),
    fallbackObjects.push(value20));
  const value21 = value20.clone();
  ((value21.position.x = 0.42),
    (value21.rotation.z = -0.03),
    (value21.rotation.x = -0.04),
    proxyRoot.add(value21),
    fallbackObjects.push(value21));
  const box4 = new threeRuntime['Mesh'](new threeRuntime['SphereGeometry'](0.048, 10, 10), material9);
  (box4.position.set(-0.425, 0.62, 0.01),
    box4.scale.set(0.9, 1, 0.72),
    proxyRoot.add(box4),
    fallbackObjects.push(box4));
  const value22 = box4.clone();
  ((value22.position.x = 0.425), proxyRoot.add(value22), fallbackObjects.push(value22));
  const value23 = new threeRuntime.Mesh(new threeRuntime.CapsuleGeometry(0.072, 0.34, 5, 12), material9);
  (value23.position.set(-0.12, 0.47, 0),
    (value23.rotation.z = 0.03),
    proxyRoot.add(value23),
    fallbackObjects.push(value23));
  const value24 = value23.clone();
  ((value24.position.x = 0.12),
    (value24.rotation.z = -0.03),
    proxyRoot.add(value24),
    fallbackObjects.push(value24));
  const value25 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.055, 0.34, 5, 12),
    material9,
  );
  (value25.position.set(-0.12, 0.03, 0.01), proxyRoot.add(value25), fallbackObjects.push(value25));
  const value26 = value25.clone();
  ((value26.position.x = 0.12), proxyRoot.add(value26), fallbackObjects.push(value26));
  const value27 = new threeRuntime['Mesh'](new threeRuntime['BoxGeometry'](0.115, 0.075, 0.27), material9);
  (value27.position.set(-0.12, -0.19, 0.07),
    (value27.rotation.x = -0.08),
    proxyRoot.add(value27),
    fallbackObjects.push(value27));
  const value28 = value27.clone();
  ((value28.position.x = 0.12), proxyRoot.add(value28), fallbackObjects.push(value28));
  const selectionRing = createSelectionRing(0x7db4ff);
  return (
    group9.add(selectionRing),
    {
      group: group9,
      material: material9,
      headMaterial: headMaterial,
      selectionRing: selectionRing,
      proxyRoot: proxyRoot,
      fallbackObjects: fallbackObjects,
      modelGender: null,
      modelLoadToken: 0,
      modelRoot: null,
      parts: {
        head: head,
        neck: neck,
        chest: chest,
        waist: waist,
        pelvis: pelvis,
        shoulders: [value16, value17],
        upperArms: [value18, value19],
        lowerArms: [value20, value21],
        hands: [box4, value22],
        upperLegs: [value23, value24],
        lowerLegs: [value25, value26],
        feet: [value27, value28],
      },
    }
  );
}
function createCubeVisual(color7) {
  const group10 = new threeRuntime.Group(),
    material10 = new threeRuntime['MeshStandardMaterial']({
      color: color7,
      roughness: 0.42,
      metalness: 0.06,
    }),
    edgeMaterial = new threeRuntime['LineBasicMaterial']({
      color: new threeRuntime['Color'](color7).clone().offsetHSL(0, 0, -0.18),
      transparent: true,
      opacity: 0.9,
    }),
    value29 = new threeRuntime['Mesh'](new threeRuntime.BoxGeometry(1, 1, 1), material10);
  group10.add(value29);
  const value30 = new threeRuntime['LineSegments'](
    new threeRuntime['EdgesGeometry'](new threeRuntime.BoxGeometry(1, 1, 1)),
    edgeMaterial,
  );
  group10.add(value30);
  const selectionRing2 = createSelectionRing(0x7db4ff);
  return (
    group10.add(selectionRing2),
    { group: group10, material: material10, edgeMaterial: edgeMaterial, selectionRing: selectionRing2 }
  );
}
function setMannequinProxyMode(value31) {
  ((value31?.fallbackObjects || []).forEach((item3) => {
    item3.visible = true;
  }),
    [value31?.material, value31?.headMaterial].forEach((enabled10) => {
      if (!enabled10) return;
      ((enabled10.transparent = true),
        (enabled10.opacity = 0.001),
        (enabled10.depthWrite = false),
        (enabled10.colorWrite = false));
    }));
}
function createCharacterClayMaterial(color8) {
  return new threeRuntime['MeshStandardMaterial']({
    color: color8?.isColor ? color8.clone() : new threeRuntime.Color(color8 || 0xffffff),
    roughness: 0.78,
    metalness: 0,
  });
}
function applyCharacterClayMaterial(enabled11, value32) {
  if (!enabled11?.modelRoot) return;
  (!enabled11.modelMaterial &&
    ((enabled11.modelMaterial = createCharacterClayMaterial(value32)),
    enabled11.modelRoot.traverse((enabled12) => {
      if (!enabled12.isMesh) return;
      (disposeMaterial(enabled12.material), (enabled12.material = enabled11.modelMaterial));
    })),
    enabled11.modelMaterial.color.copy(
      value32?.isColor ? value32 : new threeRuntime['Color'](value32 || 0xffffff),
    ));
}
function applyObjectSelectionEmphasis(enabled13, value33, value34 = 0.12) {
  if (!enabled13) return;
  enabled13.traverse((value35) => {
    eachMaterial(value35.material, (value36) => {
      applySelectionEmphasis(value36, value33, value34);
    });
  });
}
function createCameraVisual() {
  const group11 = new threeRuntime['Group'](),
    marker = new threeRuntime['Group']();
  group11.add(marker);
  const bodyMaterial = new threeRuntime['LineBasicMaterial']({
      color: resolveThemeColor('--white', '--white'),
      transparent: true,
      opacity: 0.8,
    }),
    helperLineMaterial = new threeRuntime['LineBasicMaterial']({
      color: resolveThemeColor('--blue', '--blue'),
      transparent: true,
      opacity: 0.8,
    }),
    handler3 = (value37, value38, value39, value40) =>
      new threeRuntime['LineSegments'](
        new threeRuntime['EdgesGeometry'](new threeRuntime['BoxGeometry'](value37, value38, value39)),
        value40,
      ),
    value41 = handler3(0.26, 0.16, 0.14, bodyMaterial);
  (value41.position.set(0, 0, 0.075), marker.add(value41));
  const value42 = handler3(0.1, 0.045, 0.06, bodyMaterial);
  (value42.position.set(0, 0.102, 0.08), marker.add(value42));
  const value43 = handler3(0.06, 0.045, 0.08, bodyMaterial);
  (value43.position.set(-0.105, 0.05, 0.155), marker.add(value43));
  const value44 = handler3(0.12, 0.09, 0.02, bodyMaterial);
  (value44.position.set(0, 0, -0.01), marker.add(value44));
  const value45 = new threeRuntime.BufferGeometry().setFromPoints([
    new threeRuntime.Vector3(-0.025, 0, 0),
    new threeRuntime['Vector3'](0.025, 0, 0),
    new threeRuntime['Vector3'](0, -0.025, 0),
    new threeRuntime['Vector3'](0, 0.025, 0),
  ]);
  marker.add(new threeRuntime['LineSegments'](value45, bodyMaterial));
  const box5 = new threeRuntime['Vector3'](0, 0, -0.02),
    value46 = 0.55,
    value47 = 0.18,
    value48 = 0.1,
    value49 = box5,
    value50 = new threeRuntime['Vector3'](box5.x - value47, box5.y + value48, box5.z - value46),
    value51 = new threeRuntime.Vector3(box5.x + value47, box5.y + value48, box5.z - value46),
    value52 = new threeRuntime['Vector3'](box5.x - value47, box5.y - value48, box5.z - value46),
    value53 = new threeRuntime['Vector3'](box5.x + value47, box5.y - value48, box5.z - value46),
    value54 = new threeRuntime['BufferGeometry']().setFromPoints([
      value49,
      value50,
      value49,
      value51,
      value49,
      value52,
      value49,
      value53,
      value50,
      value51,
      value51,
      value53,
      value53,
      value52,
      value52,
      value50,
    ]),
    value55 = new threeRuntime['LineSegments'](value54, helperLineMaterial);
  return (
    marker.add(value55),
    { group: group11, marker: marker, bodyMaterial: bodyMaterial, helperLineMaterial: helperLineMaterial }
  );
}
function applyGenderShape(value56, value57) {
  const dom = value56?.parts;
  if (!dom) return;
  const [value58, value59] = dom.shoulders || [],
    [value60, value61] = dom.upperArms || [],
    [value62, value63] = dom.lowerArms || [],
    [value64, value65] = dom.hands || [],
    [box6, box7] = dom.upperLegs || [],
    [box8, box9] = dom.lowerLegs || [],
    [box10, box11] = dom.feet || [];
  if (value57 === 'female') {
    (dom.head?.scale.set(0.94, 1.08, 0.92),
      dom.neck?.scale.set(0.92, 1, 0.92),
      dom.chest?.scale.set(1.2, 0.98, 0.82),
      dom.waist?.scale.set(0.84, 0.92, 0.72),
      dom.pelvis?.scale.set(1.38, 0.98, 1.08));
    if (value58) value58.position.set(-0.27, 1.42, 0);
    if (value59) value59.position.set(0.27, 1.42, 0);
    if (value60) value60.position.set(-0.34, 1.14, 0);
    if (value61) value61.position.set(0.34, 1.14, 0);
    if (value62) value62.position.set(-0.37, 0.84, 0.01);
    if (value63) value63.position.set(0.37, 0.84, 0.01);
    if (value64) value64.position.set(-0.375, 0.59, 0.01);
    if (value65) value65.position.set(0.375, 0.59, 0.01);
    box6 && (box6.position.set(-0.115, 0.45, 0), box6.scale.set(0.94, 1, 0.94));
    box7 && (box7.position.set(0.115, 0.45, 0), box7.scale.set(0.94, 1, 0.94));
    box8 && (box8.position.set(-0.115, 0.01, 0.01), box8.scale.set(0.92, 1.02, 0.9));
    box9 && (box9.position.set(0.115, 0.01, 0.01), box9.scale.set(0.92, 1.02, 0.9));
    if (box10) box10.scale.set(0.88, 0.96, 0.95);
    if (box11) box11.scale.set(0.88, 0.96, 0.95);
  } else {
    (dom.head?.scale.set(0.98, 1.08, 0.95),
      dom.neck?.scale.set(1.02, 1, 1.02),
      dom.chest?.scale.set(1.48, 1.04, 0.98),
      dom.waist?.scale.set(1.02, 0.96, 0.84),
      dom.pelvis?.scale.set(1.2, 0.94, 0.96));
    if (value58) value58.position.set(-0.33, 1.44, 0);
    if (value59) value59.position.set(0.33, 1.44, 0);
    if (value60) value60.position.set(-0.42, 1.18, 0);
    if (value61) value61.position.set(0.42, 1.18, 0);
    if (value62) value62.position.set(-0.45, 0.87, 0.01);
    if (value63) value63.position.set(0.45, 0.87, 0.01);
    if (value64) value64.position.set(-0.455, 0.63, 0.01);
    if (value65) value65.position.set(0.455, 0.63, 0.01);
    box6 && (box6.position.set(-0.125, 0.47, 0), box6.scale.set(1.06, 1, 1.02));
    box7 && (box7.position.set(0.125, 0.47, 0), box7.scale.set(1.06, 1, 1.02));
    box8 && (box8.position.set(-0.125, 0.03, 0.01), box8.scale.set(1, 1, 1));
    box9 && (box9.position.set(0.125, 0.03, 0.01), box9.scale.set(1, 1, 1));
    if (box10) box10.scale.set(1, 1, 1);
    if (box11) box11.scale.set(1, 1, 1);
  }
}
function disposeMaterial(list2) {
  if (!list2) return;
  if (Array.isArray(list2)) {
    list2.forEach(disposeMaterial);
    return;
  }
  (list2.map && (list2.map.dispose(), (list2.map = null)), list2.dispose?.());
}
function disposeObject3D(value66) {
  value66.traverse((value67) => {
    (value67.geometry?.dispose?.(), disposeMaterial(value67.material));
  });
}
function vectorFromAxisName(value68) {
  if (value68 === 'x') return new threeRuntime['Vector3'](1, 0, 0);
  if (value68 === 'y') return new threeRuntime['Vector3'](0, 1, 0);
  return new threeRuntime['Vector3'](0, 0, 1);
}
function toVector3Like(box12, box13 = { x: 0, y: 0, z: 0 }) {
  return new threeRuntime.Vector3(
    Number.isFinite(Number(box12?.x)) ? Number(box12.x) : Number(box13?.x) || 0,
    Number.isFinite(Number(box12?.y)) ? Number(box12.y) : Number(box13?.y) || 0,
    Number.isFinite(Number(box12?.z)) ? Number(box12.z) : Number(box13?.z) || 0,
  );
}
function toEulerLike(box14, box15 = { x: 0, y: 0, z: 0 }, value69 = 'XYZ') {
  return new threeRuntime['Euler'](
    Number.isFinite(Number(box14?.x)) ? Number(box14.x) : Number(box15?.x) || 0,
    Number.isFinite(Number(box14?.y)) ? Number(box14.y) : Number(box15?.y) || 0,
    Number.isFinite(Number(box14?.z)) ? Number(box14.z) : Number(box15?.z) || 0,
    value69,
  );
}
function toScaleVector(box16) {
  if (Number.isFinite(box16)) {
    const x2 = Math.max(0.01, Number(box16) || 1);
    return { x: x2, y: x2, z: x2 };
  }
  if (box16 && Number.isFinite(box16.x) && Number.isFinite(box16.y) && Number.isFinite(box16.z))
    return {
      x: Math.max(0.01, Number(box16.x) || 1),
      y: Math.max(0.01, Number(box16.y) || 1),
      z: Math.max(0.01, Number(box16.z) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function applyGroupScale(box17, value70) {
  const box18 = toScaleVector(value70);
  box17.scale.set(box18.x, box18.y, box18.z);
}
function applyGroupTransform(value71, value72) {
  value71.position.set(
    Number(value72?.position?.x) || 0,
    Number(value72?.position?.y) || 0,
    Number(value72?.position?.z) || 0,
  );
  if (hasFiniteQuaternion(value72?.quaternion)) {
    const box19 = normalizeQuaternionData(value72.quaternion, { x: 0, y: 0, z: 0, w: 1 });
    value71.quaternion.set(box19.x, box19.y, box19.z, box19.w);
    return;
  }
  value71.rotation.set(
    Number(value72?.rotation?.x) || 0,
    Number(value72?.rotation?.y) || 0,
    Number(value72?.rotation?.z) || 0,
  );
}
function hasFiniteQuaternion(box20) {
  return (
    Number.isFinite(Number(box20?.x)) &&
    Number.isFinite(Number(box20?.y)) &&
    Number.isFinite(Number(box20?.z)) &&
    Number.isFinite(Number(box20?.w))
  );
}
function normalizeQuaternionData(box21, args = { x: 0, y: 0, z: 0, w: 1 }) {
  const x3 = Number(box21?.x),
    y2 = Number(box21?.y),
    z2 = Number(box21?.z),
    w = Number(box21?.w);
  if (!Number.isFinite(x3) || !Number.isFinite(y2) || !Number.isFinite(z2) || !Number.isFinite(w))
    return { ...args };
  const count = Math.hypot(x3, y2, z2, w);
  if (count < 0.000001) return { ...args };
  return {
    x: x3 / count,
    y: y2 / count,
    z: z2 / count,
    w: w / count,
  };
}
function toQuaternionFromPose(value73, value74 = { x: 0, y: 0, z: 0, w: 1 }, value75 = 'XYZ') {
  if (hasFiniteQuaternion(value73?.quaternion)) {
    const box22 = normalizeQuaternionData(value73.quaternion, value74);
    return new threeRuntime['Quaternion'](box22.x, box22.y, box22.z, box22.w);
  }
  const toEulerLike2 = toEulerLike(value73?.rotation, { x: 0, y: 0, z: 0 }, value75);
  return new threeRuntime['Quaternion']().setFromEuler(toEulerLike2);
}
function composeMatrixFromPose(box23 = {}, value76 = 'XYZ') {
  const toVector3Like2 = toVector3Like(box23?.position, { x: 0, y: 0, z: 0 }),
    toQuaternionFromPose2 = toQuaternionFromPose(box23, { x: 0, y: 0, z: 0, w: 1 }, value76),
    toVector3Like3 = toVector3Like(toScaleVector(box23?.scale), { x: 1, y: 1, z: 1 });
  return new threeRuntime['Matrix4']().compose(toVector3Like2, toQuaternionFromPose2, toVector3Like3);
}
function quaternionFromRotationYXZ(box24) {
  const value77 = new threeRuntime['Quaternion']().setFromEuler(
    new threeRuntime['Euler'](Number(box24?.x) || 0, Number(box24?.y) || 0, Number(box24?.z) || 0, 'YXZ'),
  );
  return normalizeQuaternionData(value77);
}
function resolveObjectPivot(value78, value79) {
  if (
    Number.isFinite(Number(value78?.pivot?.x)) &&
    Number.isFinite(Number(value78?.pivot?.y)) &&
    Number.isFinite(Number(value78?.pivot?.z))
  )
    return toVector3Like(value78.pivot);
  if (value78) {
    const composeMatrixFromPose2 = composeMatrixFromPose(value78),
      value80 = new threeRuntime.Vector3();
    return (value80.setFromMatrixPosition(composeMatrixFromPose2), value80);
  }
  if (value79?.group) {
    const value81 = new threeRuntime['Vector3']();
    return (value79.group.getWorldPosition(value81), value81);
  }
  return new threeRuntime['Vector3']();
}
function resolveActiveTransformTool(value82) {
  const value83 = String(value82?.ui?.transformTool || '').trim();
  if (value83 === 'move' || value83 === 'rotate' || value83 === 'scale') return value83;
  const value84 = String(value82?.ui?.activeTool || '').trim();
  if (value84 === 'move' || value84 === 'rotate' || value84 === 'scale') return value84;
  return 'move';
}
function resolveObjectOrientationQuaternion(value85, value86) {
  if (value86?.group) {
    const value87 = new threeRuntime['Quaternion']();
    return (value86.group.getWorldQuaternion(value87), value87);
  }
  return toQuaternionFromPose(value85, { x: 0, y: 0, z: 0, w: 1 });
}
function areOrientationQuaternionsAligned(box25, box26, value88 = 0.00001) {
  if (!box25 || !box26) return false;
  const value89 = Math.abs(
    (Number(box25.x) || 0) * (Number(box26.x) || 0) +
      (Number(box25.y) || 0) * (Number(box26.y) || 0) +
      (Number(box25.z) || 0) * (Number(box26.z) || 0) +
      (Number(box25.w) || 0) * (Number(box26.w) || 0),
  );
  return Math.abs(1 - value89) <= value88;
}
function resolveSelectionGizmoOrientation(list3, value90, enabled14) {
  const orientationQuaternion = value90?.orientationQuaternion?.clone?.() || new threeRuntime['Quaternion']();
  if (!enabled14) return { orientationQuaternion: orientationQuaternion, usesLocalOrientation: true };
  const orientationQuaternion2 =
    list3.length > 0 &&
    list3.every((item4) =>
      areOrientationQuaternionsAligned(orientationQuaternion, item4.orientationQuaternion),
    );
  return {
    orientationQuaternion: orientationQuaternion2 ? orientationQuaternion : new threeRuntime.Quaternion(),
    usesLocalOrientation: orientationQuaternion2,
  };
}
function rotationFromQuaternionYXZ(value91) {
  const box27 = normalizeQuaternionData(value91),
    x4 = new threeRuntime['Euler']().setFromQuaternion(
      new threeRuntime['Quaternion'](box27.x, box27.y, box27.z, box27.w),
      'YXZ',
    );
  return { x: x4.x, y: x4.y, z: x4.z };
}
function normalizeCameraPoseData(options2 = {}) {
  const position = {
      x: Number(options2?.position?.x) || 0,
      y: Number(options2?.position?.y) || 0,
      z: Number(options2?.position?.z) || 0,
    },
    hasFiniteQuaternion2 = hasFiniteQuaternion(options2?.quaternion),
    quaternion = hasFiniteQuaternion2
      ? normalizeQuaternionData(options2.quaternion, quaternionFromRotationYXZ(options2?.rotation))
      : quaternionFromRotationYXZ(options2?.rotation),
    rotation2 = hasFiniteQuaternion2
      ? rotationFromQuaternionYXZ(quaternion)
      : {
          x: Number(options2?.rotation?.x) || 0,
          y: Number(options2?.rotation?.y) || 0,
          z: Number(options2?.rotation?.z) || 0,
        };
  return {
    position: position,
    quaternion: quaternion,
    rotation: rotation2,
    fov: Number.isFinite(Number(options2?.fov))
      ? Number(options2.fov)
      : focalLengthToFov(
          Object.prototype.hasOwnProperty.call(options2 || {}, 'focalLength')
            ? options2.focalLength
            : SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
    focalLength: Object.prototype.hasOwnProperty.call(options2 || {}, 'focalLength')
      ? Number(options2.focalLength) || SCENE_DEFAULT_FOCAL_LENGTH_MM
      : Number.isFinite(Number(options2?.fov))
        ? fovToFocalLength(options2.fov)
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function collectSelectedObjects(value92) {
  const list4 = Array.isArray(value92?.cubes) ? value92.cubes : [],
    list5 = Array.isArray(value92?.mannequins) ? value92.mannequins : [],
    map = new Set(list4.map((item5) => item5.id)),
    map2 = new Set(list5.map((item6) => item6.id)),
    map3 = new Set(),
    list6 = [],
    handler4 = (objectType, value93) => {
      if (objectType !== 'cube' && objectType !== 'mannequin') return;
      const objectId = String(value93 || '').trim();
      if (!objectId) return;
      const enabled15 = objectType === 'cube' ? map.has(objectId) : map2.has(objectId);
      if (!enabled15) return;
      const value94 = objectType + ':' + objectId;
      if (map3.has(value94)) return;
      (map3.add(value94), list6.push({ objectType: objectType, objectId: objectId }));
    },
    list7 = Array.isArray(value92?.selection?.selectedObjects) ? value92.selection.selectedObjects : [];
  list7.forEach((item7) => {
    handler4(item7?.objectType, item7?.objectId);
  });
  if (list6.length > 0) return list6;
  const value95 = value92?.selection?.selectedGroupId || null;
  if (value95) {
    const value96 = (value92?.groups || []).find((item8) => item8.id === value95),
      list8 = Array.isArray(value96?.memberIds) ? value96.memberIds : [];
    list8.forEach((item9) => {
      handler4('mannequin', item9);
    });
    if (list6.length > 0) return list6;
  }
  const enabled16 =
    value92?.selection?.selectedObjectType === 'cube' ||
    value92?.selection?.selectedObjectType === 'mannequin'
      ? value92.selection.selectedObjectType
      : null;
  if (!enabled16) return list6;
  const list9 = Array.isArray(value92?.selection?.selectedObjectIds)
    ? value92.selection.selectedObjectIds
    : [];
  if (list9.length > 0) {
    list9.forEach((item10) => {
      handler4(enabled16, item10);
    });
    if (list6.length > 0) return list6;
  }
  return (handler4(enabled16, value92?.selection?.selectedObjectId || null), list6);
}
function collectSelectedObjectIds(value97, value98) {
  return collectSelectedObjects(value97)
    .filter((item11) => item11.objectType === value98)
    .map((item12) => item12.objectId);
}
function buildTransformSelectionSignature(value99) {
  const list10 = collectSelectedObjects(value99);
  if (list10.length === 0) return '';
  return list10
    .map((item13) => item13.objectType + ':' + item13.objectId)
    .sort()
    .join('|');
}
function cloneGizmoDisplayContext(isMultiSelection) {
  if (!isMultiSelection) return null;
  return {
    isMultiSelection: isMultiSelection.isMultiSelection === true,
    usesLocalOrientation: isMultiSelection.usesLocalOrientation === true,
    position: isMultiSelection.position?.clone?.() || new threeRuntime['Vector3'](),
    orientationQuaternion:
      isMultiSelection.orientationQuaternion?.clone?.() || new threeRuntime['Quaternion'](),
    bounds: {
      box: isMultiSelection.bounds?.box?.clone?.() || createFallbackBounds().box,
      size: isMultiSelection.bounds?.size?.clone?.() || new threeRuntime.Vector3(1, 1, 1),
      sphere: isMultiSelection.bounds?.sphere
        ? new threeRuntime['Sphere'](
            isMultiSelection.bounds.sphere.center?.clone?.() || new threeRuntime.Vector3(),
            Number(isMultiSelection.bounds.sphere.radius) || 0,
          )
        : new threeRuntime['Sphere'](new threeRuntime.Vector3(0, 0.5, 0), Math.sqrt(0.75)),
      extents: {
        x: Number(isMultiSelection.bounds?.extents?.x) || 0,
        y: Number(isMultiSelection.bounds?.extents?.y) || 0,
        z: Number(isMultiSelection.bounds?.extents?.z) || 0,
      },
    },
    gizmoWorldMetrics: {
      extents: {
        x: Number(isMultiSelection.gizmoWorldMetrics?.extents?.x) || 0,
        y: Number(isMultiSelection.gizmoWorldMetrics?.extents?.y) || 0,
        z: Number(isMultiSelection.gizmoWorldMetrics?.extents?.z) || 0,
      },
      sphereRadius: Number(isMultiSelection.gizmoWorldMetrics?.sphereRadius) || 0.01,
      margin: Number(isMultiSelection.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
    },
  };
}
function measureVisualBounds(value100) {
  const enabled17 = value100?.proxyRoot || value100?.group;
  if (!enabled17) return null;
  const box28 = new threeRuntime.Box3().setFromObject(enabled17);
  if (box28.isEmpty()) return null;
  const size = new threeRuntime['Vector3'](),
    sphere = new threeRuntime['Sphere']();
  return (
    box28.getSize(size),
    box28.getBoundingSphere(sphere),
    {
      box: box28,
      size: size,
      sphere: sphere,
      extents: {
        x: Math.max(0, size.x * 0.5),
        y: Math.max(0, size.y * 0.5),
        z: Math.max(0, size.z * 0.5),
      },
    }
  );
}
function resolveVisualBoundsCenter(value101) {
  const measureVisualBounds2 = measureVisualBounds(value101);
  if (!measureVisualBounds2?.box || measureVisualBounds2.box.isEmpty()) return null;
  const value102 = new threeRuntime['Vector3']();
  return (measureVisualBounds2.box.getCenter(value102), value102);
}
function resolveObjectToolPivot(value103, value104, value105, value106) {
  const value107 = String(value106 || '').trim();
  if (value107 !== 'camera') {
    const visualBoundsCenter = resolveVisualBoundsCenter(value104);
    if (visualBoundsCenter) return visualBoundsCenter;
  }
  return resolveObjectPivot(value103, value104);
}
function measureVisualBoundsForSelection(list11 = []) {
  const box29 = new threeRuntime['Box3']();
  let enabled18 = false;
  list11.forEach((item14) => {
    const enabled19 = item14?.visual?.proxyRoot || item14?.visual?.group;
    if (!enabled19) return;
    const value108 = new threeRuntime['Box3']().setFromObject(enabled19);
    if (value108.isEmpty()) return;
    if (!enabled18) {
      (box29.copy(value108), (enabled18 = true));
      return;
    }
    box29.union(value108);
  });
  if (!enabled18) return null;
  const size2 = new threeRuntime.Vector3(),
    sphere2 = new threeRuntime['Sphere']();
  return (
    box29.getSize(size2),
    box29.getBoundingSphere(sphere2),
    {
      box: box29,
      size: size2,
      sphere: sphere2,
      extents: {
        x: Math.max(0, size2.x * 0.5),
        y: Math.max(0, size2.y * 0.5),
        z: Math.max(0, size2.z * 0.5),
      },
    }
  );
}
function createFallbackBounds() {
  return {
    box: new threeRuntime['Box3'](
      new threeRuntime['Vector3'](-0.5, 0, -0.5),
      new threeRuntime['Vector3'](0.5, 1, 0.5),
    ),
    size: new threeRuntime['Vector3'](1, 1, 1),
    sphere: new threeRuntime.Sphere(new threeRuntime['Vector3'](0, 0.5, 0), Math.sqrt(0.75)),
    extents: { x: 0.5, y: 0.5, z: 0.5 },
  };
}
function computeGizmoWorldMetrics(value109) {
  const extents = value109?.extents || { x: 0.5, y: 0.5, z: 0.5 },
    maxExtent = Math.max(0.01, Number(extents.x) || 0, Number(extents.y) || 0, Number(extents.z) || 0),
    sphereRadius = Math.max(0.01, Number(value109?.sphere?.radius) || 0.01),
    margin = Math.max(GIZMO_MARGIN_WORLD_MIN, sphereRadius * GIZMO_MARGIN_WORLD_RATIO, maxExtent * 0.18);
  return { extents: extents, maxExtent: maxExtent, sphereRadius: sphereRadius, margin: margin };
}
function cloneRenderPose(event) {
  if (!event) return null;
  if (event.kind === 'camera') {
    const fov = normalizeCameraPoseData(event);
    return {
      kind: 'camera',
      position: { ...fov.position },
      quaternion: { ...fov.quaternion },
      rotation: { ...fov.rotation },
      fov: fov.fov,
    };
  }
  if (event.kind === 'panorama-default')
    return {
      kind: 'panorama-default',
      position: { ...event.position },
      yaw: Number(event.yaw) || 0,
      pitch: Number(event.pitch) || 0,
      fov: Number(event.fov) || 72,
    };
  return {
    kind: 'scene-default',
    position: { ...event.position },
    target: { ...event.target },
    yaw: Number(event.yaw) || 0,
    pitch: Number(event.pitch) || 0,
    distance: Number(event.distance) || 0,
    fov: Number(event.fov) || 58,
  };
}
function measurePoseDistance(event2, event3) {
  if (!event2 || !event3 || event2.kind !== event3.kind) return Number.POSITIVE_INFINITY;
  if (event3.kind === 'camera') {
    const cameraPoseData = normalizeCameraPoseData(event2),
      cameraPoseData2 = normalizeCameraPoseData(event3),
      value110 =
        Math.abs(cameraPoseData2.position.x - cameraPoseData.position.x) +
        Math.abs(cameraPoseData2.position.y - cameraPoseData.position.y) +
        Math.abs(cameraPoseData2.position.z - cameraPoseData.position.z),
      value111 = Math.abs(
        cameraPoseData2.quaternion.x * cameraPoseData.quaternion.x +
          cameraPoseData2.quaternion.y * cameraPoseData.quaternion.y +
          cameraPoseData2.quaternion.z * cameraPoseData.quaternion.z +
          cameraPoseData2.quaternion.w * cameraPoseData.quaternion.w,
      ),
      value112 = 1 - Math.min(1, Math.max(0, value111));
    return value110 + value112 + Math.abs(cameraPoseData2.fov - cameraPoseData.fov);
  }
  if (event3.kind === 'panorama-default') {
    const value113 =
        Math.abs((event3.position?.x || 0) - (event2.position?.x || 0)) +
        Math.abs((event3.position?.y || 0) - (event2.position?.y || 0)) +
        Math.abs((event3.position?.z || 0) - (event2.position?.z || 0)),
      value114 =
        Math.abs((event3.yaw || 0) - (event2.yaw || 0)) + Math.abs((event3.pitch || 0) - (event2.pitch || 0));
    return value113 + value114 + Math.abs((event3.fov || 0) - (event2.fov || 0));
  }
  const value115 =
      Math.abs((event3.position?.x || 0) - (event2.position?.x || 0)) +
      Math.abs((event3.position?.y || 0) - (event2.position?.y || 0)) +
      Math.abs((event3.position?.z || 0) - (event2.position?.z || 0)),
    value116 =
      Math.abs((event3.target?.x || 0) - (event2.target?.x || 0)) +
      Math.abs((event3.target?.y || 0) - (event2.target?.y || 0)) +
      Math.abs((event3.target?.z || 0) - (event2.target?.z || 0));
  return value115 + value116 + Math.abs((event3.fov || 0) - (event2.fov || 0));
}
function areSceneViewsEquivalent(event4, event5, value117 = 0.00001) {
  if (!event4 || !event5) return false;
  const box30 = event4.target || {},
    box31 = event5.target || {};
  return (
    Math.abs((Number(box30.x) || 0) - (Number(box31.x) || 0)) <= value117 &&
    Math.abs((Number(box30.y) || 0) - (Number(box31.y) || 0)) <= value117 &&
    Math.abs((Number(box30.z) || 0) - (Number(box31.z) || 0)) <= value117 &&
    Math.abs(normalizeAngle((Number(event4.orbitYaw) || 0) - (Number(event5.orbitYaw) || 0))) <= value117 &&
    Math.abs((Number(event4.orbitPitch) || 0) - (Number(event5.orbitPitch) || 0)) <= value117 &&
    Math.abs((Number(event4.orbitDistance) || 0) - (Number(event5.orbitDistance) || 0)) <= value117
  );
}
export class PanoramaScene3DBridge {
  constructor({ container: container, onPanoramaStatusChange: onPanoramaStatusChange } = {}) {
    ((this.container = container),
      (this.onPanoramaStatusChange = onPanoramaStatusChange),
      (this.scene = new threeRuntime['Scene']()),
      (this.camera = new threeRuntime['PerspectiveCamera'](55, 1, 0.1, 250)),
      (this.camera.rotation.order = 'YXZ'),
      (this.renderer = new threeRuntime.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      })),
      (this.renderer.sortObjects = true),
      (this.renderer.outputColorSpace = threeRuntime.SRGBColorSpace),
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
      this.renderer.setClearAlpha(0),
      (this.renderer.domElement.className = 'panorama-scene-webgl'),
      (this.renderer.domElement.draggable = false),
      this.container?.appendChild(this.renderer.domElement),
      (this._ambientLight = new threeRuntime['AmbientLight'](0xffffff, 0.88)),
      (this._keyLight = new threeRuntime.DirectionalLight(0xffffff, 1.05)),
      this._keyLight.position.set(6, 10, 4),
      (this._rimLight = new threeRuntime['DirectionalLight'](0x88b6ff, 0.38)),
      this._rimLight.position.set(-6, 8, -10),
      this.scene.add(this._ambientLight, this._keyLight, this._rimLight));
    const themeColorValue = resolveThemeColorValue('--panorama-scene-grid-night', '--indigo-35');
    ((this._gridMinor = new threeRuntime['GridHelper'](
      GRID_BASE_SPAN,
      Math.round(GRID_BASE_SPAN / GRID_MINOR_STEP),
      themeColorValue,
      themeColorValue,
    )),
      eachMaterial(this._gridMinor.material, (value118) => {
        ((value118.transparent = true),
          (value118.opacity = 0.2),
          (value118.depthWrite = false),
          (value118.depthTest = true));
      }),
      (this._gridMinor.renderOrder = 1),
      this.scene.add(this._gridMinor),
      (this._gridMajor = new threeRuntime.GridHelper(
        GRID_BASE_SPAN,
        Math.round(GRID_BASE_SPAN / GRID_MAJOR_STEP),
        themeColorValue,
        themeColorValue,
      )),
      eachMaterial(this._gridMajor.material, (value119) => {
        ((value119.transparent = true),
          (value119.opacity = 0.34),
          (value119.depthWrite = false),
          (value119.depthTest = true));
      }),
      (this._gridMajor.renderOrder = 2),
      this.scene.add(this._gridMajor),
      (this._ground = new threeRuntime['Mesh'](
        new threeRuntime['PlaneGeometry'](1, 1),
        new threeRuntime['MeshBasicMaterial']({
          color: resolveThemeColor('--panorama-scene-ground-night', '--indigo-12'),
          transparent: true,
          opacity: 0.1,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      )),
      (this._ground.rotation.x = -Math.PI / 2),
      (this._ground.position.y = -0.001),
      (this._ground.renderOrder = 0),
      this.scene.add(this._ground),
      (this._panoramaSphere = new threeRuntime['Mesh'](
        new threeRuntime.SphereGeometry(60, 48, 32),
        new threeRuntime.MeshBasicMaterial({ color: 0xffffff, side: threeRuntime.BackSide }),
      )),
      (this._panoramaSphere.visible = false),
      this.scene.add(this._panoramaSphere),
      (this._textureLoader = new threeRuntime['TextureLoader']()),
      (this._mannequinMap = new Map()),
      (this._mannequinStateById = new Map()),
      (this._cubeMap = new Map()),
      (this._cubeStateById = new Map()),
      (this._cameraMap = new Map()),
      (this._cameraStateById = new Map()),
      (this._pickMap = new Map()),
      (this._pickRoots = []),
      (this._sceneState = null),
      (this._draftView = null),
      (this._draftObjects = new Map()),
      (this._rafId = null),
      (this._loadedPanoramaUrl = ''),
      (this._pendingPanoramaUrl = ''),
      (this._panoramaLoadToken = 0),
      (this._panoramaTexture = null),
      (this._renderPose = null),
      (this._defaultSceneFocalLength = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this._smoothedPose = null),
      (this._lastRenderTime = 0),
      (this._viewSmoothingUntil = 0),
      (this._gridSnapState = { minorX: null, minorZ: null, majorX: null, majorZ: null }),
      (this._lastStableGizmoSelectionSignature = ''),
      (this._lastStableGizmoContext = null),
      (this._gizmo = createGizmoVisual()),
      this.scene.add(this._gizmo.root),
      (this._gizmoMoveGuideLine = new threeRuntime['Line'](
        createLineGeometry(new threeRuntime['Vector3'](0, 0, 0), new threeRuntime.Vector3(0, 0, 0)),
        configureGizmoMaterial(
          new threeRuntime.LineBasicMaterial({
            color: resolveThemeColor('--white', '--white'),
            transparent: true,
            opacity: 0.76,
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.76 },
        ),
      )),
      configureGizmoObject(this._gizmoMoveGuideLine),
      (this._gizmoMoveGuideLine.visible = false),
      (this._gizmoMoveGuideLine.renderOrder = 3),
      this.scene.add(this._gizmoMoveGuideLine),
      this.resize(0x280, 0x168),
      this.requestRender());
  }
  ['resize'](value120, value121) {
    const value122 = Math.max(1, Math.floor(value120 || this.container?.clientWidth || 1)),
      value123 = Math.max(1, Math.floor(value121 || this.container?.clientHeight || 1));
    (this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
      (this.camera.aspect = value122 / value123),
      this.camera.updateProjectionMatrix(),
      this.renderer.setSize(value122, value123, false),
      this.requestRender());
  }
  ['_isPanorama360Mode'](value124 = this._sceneState) {
    return value124?.type === 'panorama-360';
  }
  ['setDraftView'](value125) {
    ((this._draftView = value125 || null), this.requestRender());
  }
  ['setDefaultSceneFocalLength'](value126) {
    const value127 = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength;
    ((this._defaultSceneFocalLength = Math.max(
      value127.min,
      Math.min(value127.max, Number(value126) || value127.default),
    )),
      this.requestRender());
  }
  ['getDefaultSceneFocalLength']() {
    return this._defaultSceneFocalLength;
  }
  ['clearDraftView']() {
    ((this._draftView = null), this.requestRender());
  }
  ['setDraftObjectTransform'](value128, value129, box32) {
    const value130 = value128 + ':' + value129;
    (this._draftObjects.set(value130, {
      position: { ...box32.position },
      rotation: { ...box32.rotation },
      quaternion: hasFiniteQuaternion(box32?.quaternion)
        ? normalizeQuaternionData(box32.quaternion, { x: 0, y: 0, z: 0, w: 1 })
        : undefined,
      scale:
        Number.isFinite(box32?.scale) ||
        (box32?.scale &&
          Number.isFinite(box32.scale.x) &&
          Number.isFinite(box32.scale.y) &&
          Number.isFinite(box32.scale.z))
          ? box32.scale
          : undefined,
    }),
      this.requestRender());
  }
  ['clearDraftObjectTransform'](value131, value132) {
    (this._draftObjects.delete(value131 + ':' + value132), this.requestRender());
  }
  ['clearAllDrafts']() {
    ((this._draftView = null),
      this._draftObjects.clear(),
      this.clearGizmoMoveGuideLine(),
      this.requestRender());
  }
  ['markViewSmoothingWindow'](value133 = VIEW_DAMPING_WINDOW_MS) {
    const value134 = Math.max(0, Number(value133) || VIEW_DAMPING_WINDOW_MS),
      value135 = performance.now();
    this._viewSmoothingUntil = Math.max(this._viewSmoothingUntil || 0, value135 + value134);
  }
  ['readCurrentViewPose']() {
    const x5 = new threeRuntime.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    return {
      position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      rotation: { x: this.camera.rotation.x, y: this.camera.rotation.y, z: this.camera.rotation.z },
      quaternion: {
        x: this.camera.quaternion.x,
        y: this.camera.quaternion.y,
        z: this.camera.quaternion.z,
        w: this.camera.quaternion.w,
      },
      forward: { x: x5.x, y: x5.y, z: x5.z },
      yaw: Math.atan2(x5.x, x5.z),
      pitch: Math.asin(Math.max(-1, Math.min(1, x5.y))),
      fov: this.camera.fov,
      focalLength: fovToFocalLength(this.camera.fov),
    };
  }
  ['_resolvePointerRay'](value136, value137) {
    const box33 = this.renderer.domElement.getBoundingClientRect(),
      value138 = new threeRuntime['Vector2'](
        ((value136 - box33.left) / box33.width) * 2 - 1,
        -(((value137 - box33.top) / box33.height) * 2 - 1),
      ),
      value139 = new threeRuntime['Raycaster']();
    return (value139.setFromCamera(value138, this.camera), value139);
  }
  ['setGizmoHoverHandle'](value140) {
    const value141 = value140 || null;
    if ((this._gizmo?.hoverHandle || null) === value141) return;
    ((this._gizmo.hoverHandle = value141), this._applyGizmoHighlight(), this.requestRender());
  }
  ['setGizmoActiveHandle'](value142) {
    const value143 = value142 || null,
      enabled20 = value143 === null && this._gizmo?.dragLock;
    if ((this._gizmo?.activeHandle || null) === value143 && !enabled20) return;
    ((this._gizmo.activeHandle = value143),
      value143 === null && (this._gizmo.dragLock = null),
      this._applyGizmoHighlight(),
      this.requestRender());
  }
  ['clearGizmoHandleState']() {
    if (!this._gizmo) return;
    const value144 = this._gizmo.hoverHandle || this._gizmo.activeHandle || this._gizmo.dragLock;
    ((this._gizmo.hoverHandle = null),
      (this._gizmo.activeHandle = null),
      (this._gizmo.dragLock = null),
      value144 && (this._applyGizmoHighlight(), this.requestRender()));
  }
  ['setGizmoMoveGuideLine']({ from: from2, to: to } = {}) {
    const enabled21 = this._gizmoMoveGuideLine;
    if (!enabled21) return;
    const toVector3Like4 = toVector3Like(from2, { x: 0, y: 0, z: 0 }),
      toVector3Like5 = toVector3Like(to, toVector3Like4);
    (setLineGeometryPoints(enabled21, toVector3Like4, toVector3Like5),
      (enabled21.visible = true),
      this.requestRender());
  }
  ['clearGizmoMoveGuideLine']() {
    const enabled22 = this._gizmoMoveGuideLine;
    if (!enabled22?.visible) return;
    ((enabled22.visible = false), this.requestRender());
  }
  ['_clearStableGizmoContext']() {
    ((this._lastStableGizmoSelectionSignature = ''), (this._lastStableGizmoContext = null));
  }
  ['_cacheStableGizmoContext'](value145, enabled23) {
    const transformSelectionSignature = buildTransformSelectionSignature(value145);
    if (!transformSelectionSignature || !enabled23) return;
    ((this._lastStableGizmoSelectionSignature = transformSelectionSignature),
      (this._lastStableGizmoContext = cloneGizmoDisplayContext(enabled23)));
  }
  ['_resolveStableGizmoContext'](value146) {
    const transformSelectionSignature2 = buildTransformSelectionSignature(value146);
    if (!transformSelectionSignature2) return null;
    if (transformSelectionSignature2 !== this._lastStableGizmoSelectionSignature) return null;
    return this._lastStableGizmoContext || null;
  }
  ['pickGizmoHandle'](value147, value148) {
    if (this._isPanorama360Mode()) return null;
    if (!this._gizmo?.root?.visible) return null;
    const enabled24 =
      this._gizmo?.moveGroup?.visible ||
      this._gizmo?.rotateGroup?.visible ||
      this._gizmo?.scaleGroup?.visible;
    if (!enabled24) return null;
    const list12 = Array.isArray(this._gizmo.pickMeshes) ? this._gizmo.pickMeshes : [];
    if (list12.length === 0) return null;
    const value149 = this._resolvePointerRay(value147, value148),
      value150 = value149.intersectObjects(list12, true);
    for (const x6 of value150) {
      let value151 = x6.object;
      while (value151) {
        const handleKey = value151.userData?.gizmoHandleKey;
        if (handleKey) {
          const mode2 = this._gizmo.handles?.get?.(handleKey) || null;
          if (!mode2) return null;
          const value152 = this._gizmo?.currentTool || 'move',
            value153 = mode2.mode === 'scale-axis' || mode2.mode === 'scale-uniform',
            enabled25 =
              (value152 === 'move' && (mode2.mode === 'axis' || mode2.mode === 'plane')) ||
              (value152 === 'rotate' && mode2.mode === 'rotate') ||
              (value152 === 'scale' && value153);
          if (!enabled25) {
            value151 = value151.parent;
            continue;
          }
          return {
            kind: 'gizmo-handle',
            handleKey: handleKey,
            mode: mode2.mode,
            axis: mode2.axis || null,
            normalAxis: mode2.normalAxis || null,
            point: { x: x6.point.x, y: x6.point.y, z: x6.point.z },
          };
        }
        value151 = value151.parent;
      }
    }
    return null;
  }
  ['beginMoveGizmoDrag']({ handleKey: handleKey2, clientX: clientX, clientY: clientY } = {}) {
    if (!handleKey2) return null;
    const mode3 = this._gizmo?.handles?.get?.(handleKey2);
    if (!mode3) return null;
    const pivot = this._gizmo.root.position.clone(),
      gizmoQuaternion = this._gizmo.root.quaternion.clone(),
      enabled26 = mode3.mode === 'axis' ? mode3.axis : mode3.normalAxis;
    if (!enabled26) return null;
    const vectorFromAxisName3 = vectorFromAxisName(enabled26).applyQuaternion(gizmoQuaternion).normalize();
    let planeNormalWorld = vectorFromAxisName3.clone();
    if (mode3.mode === 'axis') {
      const value154 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        value155 = new threeRuntime['Vector3']().crossVectors(value154, vectorFromAxisName3);
      (value155.lengthSq() < 0.00001 &&
        (value155.copy(new threeRuntime['Vector3'](0, 1, 0).cross(vectorFromAxisName3)),
        value155.lengthSq() < 0.00001 &&
          value155.copy(new threeRuntime['Vector3'](1, 0, 0).cross(vectorFromAxisName3))),
        (planeNormalWorld = new threeRuntime['Vector3']()
          .crossVectors(vectorFromAxisName3, value155)
          .normalize()));
    }
    planeNormalWorld.lengthSq() < 0.000001 && (planeNormalWorld = new threeRuntime['Vector3'](0, 1, 0));
    const dragPlane = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(planeNormalWorld, pivot),
      value156 = this._resolvePointerRay(clientX, clientY),
      value157 = new threeRuntime.Vector3(),
      value158 = value156.ray.intersectPlane(dragPlane, value157),
      startPoint = value158 ? value157.clone() : pivot.clone();
    return {
      handleKey: handleKey2,
      mode: mode3.mode,
      axisWorld: mode3.mode === 'axis' ? vectorFromAxisName3.clone() : null,
      axis: mode3.mode === 'axis' ? vectorFromAxisName3.clone() : null,
      planeNormalWorld: planeNormalWorld.clone(),
      planeNormal: planeNormalWorld.clone(),
      pivot: pivot.clone(),
      gizmoQuaternion: gizmoQuaternion.clone(),
      startPoint: startPoint.clone(),
      dragPlane: dragPlane,
    };
  }
  ['beginRotateGizmoDrag']({ handleKey: handleKey3, clientX: clientX2, clientY: clientY2 } = {}) {
    if (!handleKey3) return null;
    const enabled27 = this._gizmo?.handles?.get?.(handleKey3);
    if (!enabled27 || enabled27.mode !== 'rotate') return null;
    const enabled28 = this._resolveGizmoContext(this._sceneState);
    if (!enabled28) return null;
    const pivot2 = this._gizmo.root.position.clone(),
      gizmoQuaternion2 = this._gizmo.root.quaternion.clone(),
      axisWorld = vectorFromAxisName(enabled27.axis).applyQuaternion(gizmoQuaternion2).normalize(),
      dragPlane2 = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(axisWorld, pivot2),
      value159 = this._resolvePointerRay(clientX2, clientY2),
      startPoint2 = new threeRuntime['Vector3'](),
      enabled29 = value159.ray.intersectPlane(dragPlane2, startPoint2);
    if (!enabled29) return null;
    return (
      this._captureGizmoDragLock(enabled28),
      {
        handleKey: handleKey3,
        mode: 'rotate',
        axisWorld: axisWorld.clone(),
        axis: axisWorld.clone(),
        pivot: pivot2.clone(),
        gizmoQuaternion: gizmoQuaternion2.clone(),
        dragPlane: dragPlane2,
        startPoint: startPoint2.clone(),
      }
    );
  }
  ['computeRotateGizmoAngle'](x7, currentPoint) {
    if (!x7?.startPoint || !currentPoint) return 0;
    return computeSignedRotationDelta({
      startPoint: { x: x7.startPoint.x, y: x7.startPoint.y, z: x7.startPoint.z },
      currentPoint: currentPoint,
      pivot: { x: x7.pivot.x, y: x7.pivot.y, z: x7.pivot.z },
      axis: {
        x: x7.axisWorld?.x ?? x7.axis?.x,
        y: x7.axisWorld?.y ?? x7.axis?.y,
        z: x7.axisWorld?.z ?? x7.axis?.z,
      },
    });
  }
  ['beginScaleGizmoDrag']({ handleKey: handleKey4, clientX: clientX3, clientY: clientY3 } = {}) {
    if (!handleKey4) return null;
    const enabled30 = this._gizmo?.handles?.get?.(handleKey4);
    if (!enabled30 || (enabled30.mode !== 'scale-axis' && enabled30.mode !== 'scale-uniform')) return null;
    const enabled31 = this._resolveGizmoContext(this._sceneState);
    if (!enabled31) return null;
    const pivot3 = this._gizmo.root.position.clone(),
      gizmoQuaternion3 = this._gizmo.root.quaternion.clone(),
      value160 = this._resolvePointerRay(clientX3, clientY3);
    if (enabled30.mode === 'scale-uniform') {
      const value161 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        dragPlane3 = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(value161, pivot3),
        startPoint3 = new threeRuntime['Vector3'](),
        enabled32 = value160.ray.intersectPlane(dragPlane3, startPoint3);
      if (!enabled32) return null;
      return (
        this._captureGizmoDragLock(enabled31),
        {
          handleKey: handleKey4,
          mode: 'scale-uniform',
          pivot: pivot3.clone(),
          axisWorld: null,
          gizmoQuaternion: gizmoQuaternion3.clone(),
          dragPlane: dragPlane3,
          startPoint: startPoint3.clone(),
          referenceDistance: Math.max(0.25, startPoint3.distanceTo(pivot3)),
        }
      );
    }
    const axisWorld2 = vectorFromAxisName(enabled30.axis).applyQuaternion(gizmoQuaternion3).normalize(),
      value162 = this.camera.getWorldDirection(new threeRuntime['Vector3']()).normalize();
    let value163 = new threeRuntime['Vector3']().crossVectors(value162, axisWorld2);
    value163.lengthSq() < 0.00001 &&
      ((value163 = new threeRuntime.Vector3(0, 1, 0).cross(axisWorld2)),
      value163.lengthSq() < 0.00001 && (value163 = new threeRuntime.Vector3(1, 0, 0).cross(axisWorld2)));
    const planeNormalWorld2 = new threeRuntime.Vector3().crossVectors(axisWorld2, value163).normalize(),
      dragPlane4 = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(planeNormalWorld2, pivot3),
      startPoint4 = new threeRuntime['Vector3'](),
      enabled33 = value160.ray.intersectPlane(dragPlane4, startPoint4);
    if (!enabled33) return null;
    this._captureGizmoDragLock(enabled31);
    const worldDistance = Math.max(
        0.35,
        Math.abs(startPoint4.clone().sub(pivot3).dot(axisWorld2)),
        (Number(this._gizmo?.root?.scale?.x) || 1) * 0.9,
      ),
      axisScreenDirection = resolveAxisScreenDragMetric({
        pivot: pivot3,
        axisWorld: axisWorld2,
        camera: this.camera,
        domElement: this.renderer?.domElement,
        worldDistance: worldDistance,
      });
    return {
      handleKey: handleKey4,
      mode: 'scale-axis',
      axisWorld: axisWorld2.clone(),
      dragDirectionWorld: axisWorld2.clone(),
      axis: axisWorld2.clone(),
      pivot: pivot3.clone(),
      planeNormalWorld: planeNormalWorld2.clone(),
      gizmoQuaternion: gizmoQuaternion3.clone(),
      dragPlane: dragPlane4,
      startPoint: startPoint4.clone(),
      startClientX: Number(clientX3) || 0,
      startClientY: Number(clientY3) || 0,
      axisScreenDirection: axisScreenDirection?.axisScreenDirection || null,
      screenReferencePixels: axisScreenDirection?.screenReferencePixels || null,
      referenceDistance: worldDistance,
    };
  }
  ['computeScaleGizmoFactor'](startX, currentX) {
    if (!startX?.startPoint || !currentX) return 1;
    if (startX.mode === 'scale-axis') {
      if (
        startX.axisScreenDirection &&
        Number.isFinite(Number(currentX.clientX)) &&
        Number.isFinite(Number(currentX.clientY))
      )
        return computeAxisScaleFactorFromScreenDelta({
          startX: startX.startClientX,
          startY: startX.startClientY,
          currentX: currentX.clientX,
          currentY: currentX.clientY,
          axisDirection: startX.axisScreenDirection,
          referencePixels: startX.screenReferencePixels,
        });
      return computeAxisScaleFactor({
        startPoint: { x: startX.startPoint.x, y: startX.startPoint.y, z: startX.startPoint.z },
        currentPoint: currentX,
        pivot: { x: startX.pivot.x, y: startX.pivot.y, z: startX.pivot.z },
        axis: {
          x: startX.axisWorld?.x ?? startX.axis?.x,
          y: startX.axisWorld?.y ?? startX.axis?.y,
          z: startX.axisWorld?.z ?? startX.axis?.z,
        },
        dragDirection: {
          x: startX.dragDirectionWorld?.x ?? startX.axisWorld?.x ?? startX.axis?.x,
          y: startX.dragDirectionWorld?.y ?? startX.axisWorld?.y ?? startX.axis?.y,
          z: startX.dragDirectionWorld?.z ?? startX.axisWorld?.z ?? startX.axis?.z,
        },
        referenceDistance: startX.referenceDistance,
      });
    }
    return computeUniformScaleFactor({
      startPoint: { x: startX.startPoint.x, y: startX.startPoint.y, z: startX.startPoint.z },
      currentPoint: currentX,
      pivot: { x: startX.pivot.x, y: startX.pivot.y, z: startX.pivot.z },
      minDistance: startX.referenceDistance,
    });
  }
  ['sampleMoveGizmoDragPoint'](enabled34, clientX4, clientY4) {
    if (!enabled34?.dragPlane) return null;
    const value164 = this._resolvePointerRay(clientX4, clientY4),
      x8 = new threeRuntime['Vector3'](),
      enabled35 = value164.ray.intersectPlane(enabled34.dragPlane, x8);
    if (!enabled35) return null;
    return { x: x8.x, y: x8.y, z: x8.z, clientX: clientX4, clientY: clientY4 };
  }
  ['computeMoveGizmoDelta'](x9, currentPoint2) {
    if (!x9?.startPoint || !currentPoint2) return null;
    const constrainedMoveDelta = computeConstrainedMoveDelta({
      startPoint: { x: x9.startPoint.x, y: x9.startPoint.y, z: x9.startPoint.z },
      currentPoint: currentPoint2,
      axis: x9?.axisWorld
        ? { x: x9.axisWorld.x, y: x9.axisWorld.y, z: x9.axisWorld.z }
        : x9?.axis
          ? { x: x9.axis.x, y: x9.axis.y, z: x9.axis.z }
          : null,
      planeNormal: {
        x: x9?.planeNormalWorld?.x ?? x9?.planeNormal?.x,
        y: x9?.planeNormalWorld?.y ?? x9?.planeNormal?.y,
        z: x9?.planeNormalWorld?.z ?? x9?.planeNormal?.z,
      },
      mode: x9.mode,
    });
    return constrainedMoveDelta;
  }
  ['pick'](value165, value166) {
    if (this._isPanorama360Mode()) return null;
    if (!this._pickRoots.length) return null;
    const value167 = this._resolvePointerRay(value165, value166),
      value168 = value167.intersectObjects(this._pickRoots, true);
    for (const x10 of value168) {
      let value169 = x10.object;
      while (value169) {
        const args2 = this._pickMap.get(value169.id);
        if (args2)
          return {
            ...args2,
            point: { x: x10.point.x, y: x10.point.y, z: x10.point.z },
          };
        value169 = value169.parent;
      }
    }
    return null;
  }
  ['pickObjectsInRect'](box34) {
    if (this._isPanorama360Mode()) return [];
    const box35 = this.renderer.domElement.getBoundingClientRect(),
      list13 = [],
      handler5 = (list14, objectType2) => {
        list14.forEach((item15, objectId2) => {
          const value170 = new threeRuntime['Vector3']();
          item15.group.getWorldPosition(value170);
          const depth = value170.clone().project(this.camera);
          if (depth.x < -1 || depth.x > 1 || depth.y < -1 || depth.y > 1 || depth.z < -1 || depth.z > 1)
            return;
          const value171 = box35.left + (depth.x + 1) * 0.5 * box35.width,
            value172 = box35.top + (1 - depth.y) * 0.5 * box35.height;
          value171 >= box34.left &&
            value171 <= box34.right &&
            value172 >= box34.top &&
            value172 <= box34.bottom &&
            list13.push({ objectType: objectType2, objectId: objectId2, depth: depth.z });
        });
      };
    return (
      handler5(this._mannequinMap, 'mannequin'),
      handler5(this._cubeMap, 'cube'),
      list13.sort((item16, value173) => item16.depth - value173.depth),
      list13
    );
  }
  ['intersectGround'](value174, value175, value176 = 0) {
    if (this._isPanorama360Mode()) return null;
    const value177 = this._resolvePointerRay(value174, value175),
      value178 = new threeRuntime['Plane'](new threeRuntime.Vector3(0, 1, 0), -value176),
      x11 = new threeRuntime['Vector3'](),
      enabled36 = value177.ray.intersectPlane(value178, x11);
    if (!enabled36) return null;
    return { x: x11.x, y: x11.y, z: x11.z };
  }
  async ['_withCleanCaptureFrame'](handler6) {
    const list15 = [
        this._gizmo?.root,
        this._gizmoMoveGuideLine,
        ...Array.from(this._cameraMap.values()).map((item17) => item17?.group),
      ].filter(Boolean),
      list16 = list15.map((object3d) => ({ object3d: object3d, visible: object3d.visible })),
      list17 = [],
      value179 = (material11) => {
        if (!material11 || list17.some((item18) => item18.material === material11)) return;
        list17.push({
          material: material11,
          emissive: material11.emissive?.isColor ? material11.emissive.clone() : undefined,
          emissiveIntensity:
            typeof material11.emissiveIntensity === 'number' ? material11.emissiveIntensity : undefined,
          opacity: typeof material11.opacity === 'number' ? material11.opacity : undefined,
        });
      };
    (this._mannequinMap.forEach((item19) => {
      item19?.group?.traverse?.((value180) => eachMaterial(value180.material, value179));
    }),
      this._cubeMap.forEach((item20) => {
        item20?.group?.traverse?.((value181) => eachMaterial(value181.material, value179));
      }),
      list16.forEach(({ object3d: object3d2 }) => {
        object3d2.visible = false;
      }),
      this._mannequinMap.forEach((item21) => applyObjectSelectionEmphasis(item21?.group, false)),
      this._cubeMap.forEach((item22) => applyObjectSelectionEmphasis(item22?.group, false)));
    try {
      return await handler6();
    } finally {
      (list16.forEach(({ object3d: object3d3, visible: visible }) => {
        object3d3.visible = visible;
      }),
        list17.forEach(
          ({
            material: material12,
            emissive: emissive,
            emissiveIntensity: emissiveIntensity,
            opacity: opacity2,
          }) => {
            (emissive?.isColor && material12.emissive?.isColor && material12.emissive.copy(emissive),
              typeof emissiveIntensity === 'number' && (material12.emissiveIntensity = emissiveIntensity),
              typeof opacity2 === 'number' && (material12.opacity = opacity2),
              (material12.needsUpdate = true));
          },
        ),
        this.requestRender());
    }
  }
  ['captureBlob']({ includeEditorOverlays: includeEditorOverlays = true } = {}) {
    const run2 = () =>
      new Promise((handler7, handler8) => {
        this.renderNow();
        const value182 = this.renderer.domElement;
        if (typeof value182.toBlob === 'function') {
          value182.toBlob((enabled37) => {
            if (!enabled37) {
              handler8(new Error(panoramaSceneText('errors.captureExportFailed')));
              return;
            }
            handler7(enabled37);
          }, 'image/png');
          return;
        }
        try {
          const list18 = value182.toDataURL('image/png'),
            [, value183] = list18.split(','),
            type = list18.slice(list18.indexOf(':') + 1, list18.indexOf(';')),
            list19 = atob(value183 || ''),
            uint8Array = new Uint8Array(list19.length);
          for (let value184 = 0; value184 < list19.length; value184 += 1) {
            uint8Array[value184] = list19.charCodeAt(value184);
          }
          handler7(new Blob([uint8Array], { type: type || 'image/png' }));
        } catch (value185) {
          handler8(value185);
        }
      });
    if (includeEditorOverlays === false) return this._withCleanCaptureFrame(run2);
    return run2();
  }
  ['sync'](value186) {
    this._sceneState = value186;
    const value187 = this._isPanorama360Mode(value186);
    (this._syncEnvironment(value186?.environmentMode),
      this._syncPanorama(value186?.panorama),
      this._syncMannequins(value186, value187),
      this._syncCubes(value186, value187),
      this._syncCameras(value186, value187),
      this._syncGizmo(value186, value187),
      this._syncPanoramaModeVisibility(value187),
      this._syncPanoramaCanvasVisibility(value187),
      this.requestRender());
  }
  ['requestRender']() {
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      ((this._rafId = null), this.renderNow());
    });
  }
  ['renderNow']() {
    if (!this._sceneState) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const enabled38 = this._isPanorama360Mode(this._sceneState),
      value188 = this._applyRenderView();
    (!enabled38 && this._syncInfiniteGrid(),
      this._applyDraftObjects(),
      !enabled38 && this._applyGizmoPosition(),
      this.renderer.render(this.scene, this.camera),
      value188?.keepAnimating && this.requestRender());
  }
  ['dispose']() {
    (this._rafId !== null && (cancelAnimationFrame(this._rafId), (this._rafId = null)),
      (this._panoramaLoadToken += 1),
      (this._smoothedPose = null),
      (this._lastRenderTime = 0),
      (this._viewSmoothingUntil = 0),
      this._mannequinMap.forEach((item23) => {
        (this.scene.remove(item23.group), disposeObject3D(item23.group));
      }),
      this._cubeMap.forEach((item24) => {
        (this.scene.remove(item24.group), disposeObject3D(item24.group));
      }),
      this._cameraMap.forEach((item25) => {
        (this.scene.remove(item25.group), disposeObject3D(item25.group));
      }),
      this._mannequinMap.clear(),
      this._mannequinStateById.clear(),
      this._cubeMap.clear(),
      this._cubeStateById.clear(),
      this._cameraMap.clear(),
      this._cameraStateById.clear(),
      this._pickMap.clear(),
      (this._pickRoots = []),
      this._clearStableGizmoContext(),
      this.scene.remove(this._gizmo.root),
      disposeObject3D(this._gizmo.root),
      this._panoramaTexture && (this._panoramaTexture.dispose(), (this._panoramaTexture = null)),
      disposeObject3D(this._panoramaSphere),
      disposeObject3D(this._ground),
      disposeObject3D(this._gridMinor),
      disposeObject3D(this._gridMajor),
      this.scene.clear(),
      this.renderer.dispose(),
      this.renderer.forceContextLoss?.(),
      this.renderer.domElement.remove());
  }
  ['_syncEnvironment'](value189) {
    const value190 = value189 === 'night',
      themeColor = resolveThemeColor(
        value190 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
        value190 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
      );
    ((this.scene.background = null),
      this.renderer.setClearColor(0, 0),
      (this.scene.fog = this._isPanorama360Mode(this._sceneState)
        ? null
        : new threeRuntime.Fog(themeColor, value190 ? 46 : 58, value190 ? 138 : 170)),
      (this._ambientLight.intensity = value190 ? 0.56 : 0.94),
      (this._keyLight.intensity = value190 ? 0.72 : 1.12),
      (this._rimLight.intensity = value190 ? 0.2 : 0.16),
      eachMaterial(this._gridMinor.material, (value191) => {
        ((value191.opacity = value190 ? 0.28 : 0.24),
          value191.color.copy(
            resolveThemeColor(
              value190 ? '--panorama-scene-grid-night' : '--panorama-scene-grid-day',
              value190 ? '--indigo-35' : '--black-20',
            ),
          ),
          (value191.needsUpdate = true));
      }),
      eachMaterial(this._gridMajor.material, (value192) => {
        ((value192.opacity = value190 ? 0.52 : 0.42),
          value192.color.copy(
            resolveThemeColor(
              value190 ? '--panorama-scene-grid-night-major' : '--panorama-scene-grid-day-major',
              value190 ? '--indigo-35' : '--black-20',
            ),
          ),
          (value192.needsUpdate = true));
      }),
      (this._ground.material.opacity = value190 ? 0.96 : 0.92),
      (this._ground.material.color = resolveThemeColor(
        value190 ? '--panorama-scene-ground-night' : '--panorama-scene-ground-day',
        value190 ? '--indigo-12' : '--black-10',
      )),
      (this._ground.material.needsUpdate = true));
  }
  ['_syncPanoramaModeVisibility'](enabled39) {
    ((this._gridMinor.visible = !enabled39),
      (this._gridMajor.visible = !enabled39),
      (this._ground.visible = !enabled39));
    if (!enabled39) return;
    ((this._gizmo.root.visible = false),
      this.clearGizmoHandleState(),
      this._mannequinMap.forEach((item26) => {
        ((item26.group.visible = false), (item26.selectionRing.visible = false));
      }),
      this._cubeMap.forEach((item27) => {
        ((item27.group.visible = false), (item27.selectionRing.visible = false));
      }),
      this._cameraMap.forEach((item28) => {
        item28.group.visible = false;
      }),
      (this._panoramaSphere.visible = Boolean(this._panoramaSphere.material?.map)));
  }
  ['_syncPanoramaCanvasVisibility'](value193 = this._isPanorama360Mode(this._sceneState)) {
    const el2 = this.renderer?.domElement;
    if (!el2) return;
    const enabled40 = Boolean(this._panoramaSphere?.material?.map),
      value194 = value193 && !enabled40;
    ((el2.style.opacity = value194 ? '0' : '1'),
      (el2.style.background = 'transparent'),
      (el2.dataset.panoramaEmpty = value194 ? '1' : '0'));
  }
  ['_syncInfiniteGrid']() {
    const value195 = Number(this.camera?.position?.x) || 0,
      value196 = Number(this.camera?.position?.z) || 0,
      stableGridSnap = computeStableGridSnap(
        value195,
        GRID_MINOR_STEP,
        this._gridSnapState.minorX,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap2 = computeStableGridSnap(
        value196,
        GRID_MINOR_STEP,
        this._gridSnapState.minorZ,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap3 = computeStableGridSnap(
        value195,
        GRID_MAJOR_STEP,
        this._gridSnapState.majorX,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap4 = computeStableGridSnap(
        value196,
        GRID_MAJOR_STEP,
        this._gridSnapState.majorZ,
        GRID_SNAP_HYSTERESIS,
      );
    ((this._gridSnapState.minorX = stableGridSnap),
      (this._gridSnapState.minorZ = stableGridSnap2),
      (this._gridSnapState.majorX = stableGridSnap3),
      (this._gridSnapState.majorZ = stableGridSnap4),
      this._gridMinor.position.set(stableGridSnap, 0, stableGridSnap2),
      this._gridMajor.position.set(stableGridSnap3, 0.0002, stableGridSnap4));
    const value197 = Number(this._renderPose?.distance) || 0,
      value198 = Math.max(
        GRID_BASE_SPAN,
        Math.abs(Number(this.camera?.position?.y) || 0) * 26,
        value197 * 28,
      );
    (this._ground.position.set(stableGridSnap3, -0.001, stableGridSnap4),
      this._ground.scale.set(value198, value198, 1));
    const value199 = this._sceneState?.environmentMode === 'night',
      value200 = value199 ? 0.28 : 0.24,
      value201 = value199 ? 0.52 : 0.42,
      value202 = Math.abs(
        Number.isFinite(this._renderPose?.pitch)
          ? this._renderPose.pitch
          : Number(this.camera?.rotation?.x) || 0,
      ),
      clamp012 = clamp01((value202 - 0.08) / 0.32),
      value203 = 0.18 + 0.82 * clamp012,
      clamp013 = clamp01((value197 - 8) / 26),
      value204 = 1 - 0.52 * clamp013,
      value205 = value203 * value204,
      value206 = value200 * value205,
      value207 = value201 * (0.32 + 0.68 * value205);
    (eachMaterial(this._gridMinor.material, (value208) => {
      value208.opacity = value206;
    }),
      eachMaterial(this._gridMajor.material, (value209) => {
        value209.opacity = value207;
      }));
  }
  ['_syncPanorama'](value210) {
    const panoramaTextureUrl = normalizePanoramaTextureUrl(value210?.imageUrl, value210?.localPath);
    if (!panoramaTextureUrl) {
      ((this._panoramaLoadToken += 1),
        (this._loadedPanoramaUrl = ''),
        (this._pendingPanoramaUrl = ''),
        (this._panoramaSphere.material.map = null),
        (this._panoramaSphere.material.needsUpdate = true),
        (this._panoramaSphere.visible = false),
        this._syncPanoramaCanvasVisibility());
      return;
    }
    if (panoramaTextureUrl === this._loadedPanoramaUrl || panoramaTextureUrl === this._pendingPanoramaUrl)
      return;
    this._pendingPanoramaUrl = panoramaTextureUrl;
    const value211 = ++this._panoramaLoadToken;
    this._textureLoader.load(
      panoramaTextureUrl,
      (value212) => {
        if (value211 !== this._panoramaLoadToken) {
          value212.dispose();
          return;
        }
        ((value212.colorSpace = threeRuntime.SRGBColorSpace),
          (value212.minFilter = threeRuntime.LinearMipmapLinearFilter),
          (value212.magFilter = threeRuntime.LinearFilter),
          (value212.generateMipmaps = true),
          (value212.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy?.() || 1)),
          (value212.needsUpdate = true),
          this._panoramaTexture && this._panoramaTexture.dispose(),
          (this._panoramaTexture = value212),
          (this._loadedPanoramaUrl = panoramaTextureUrl),
          (this._pendingPanoramaUrl = ''),
          (this._panoramaSphere.material.map = value212),
          (this._panoramaSphere.material.needsUpdate = true),
          (this._panoramaSphere.visible = true),
          this._syncPanoramaCanvasVisibility(),
          this.onPanoramaStatusChange?.({ isLoaded: true, error: null }),
          this.requestRender());
      },
      undefined,
      () => {
        if (value211 !== this._panoramaLoadToken) return;
        ((this._pendingPanoramaUrl = ''),
          (this._panoramaSphere.visible = false),
          this._syncPanoramaCanvasVisibility(),
          this.onPanoramaStatusChange?.({
            isLoaded: false,
            error: panoramaSceneText('errors.panoramaLoadFailed'),
          }));
      },
    );
  }
  ['_resolveMannequinColor'](value213) {
    const value214 = PANORAMA_SCENE_COLOR_TOKENS[value213] || PANORAMA_SCENE_COLOR_TOKENS.blue;
    return resolveThemeColor(value214, '--blue');
  }
  ['_registerPickable'](value215, value216) {
    (value215.traverse((value217) => {
      this._pickMap.set(value217.id, value216);
    }),
      this._pickRoots.push(value215));
  }
  ['_rebuildPickRoots']() {
    (this._pickMap.clear(),
      (this._pickRoots = []),
      this._mannequinMap.forEach((item29, objectId3) => {
        this._registerPickable(item29.proxyRoot || item29.group, {
          objectType: 'mannequin',
          objectId: objectId3,
        });
      }),
      this._cubeMap.forEach((item30, objectId4) => {
        this._registerPickable(item30.group, { objectType: 'cube', objectId: objectId4 });
      }));
  }
  ['_loadCharacterModelForVisual'](enabled41, value218, value219) {
    if (!enabled41) return;
    const panoramaCharacterGender = resolvePanoramaCharacterGender(value219),
      value220 = (enabled41.modelLoadToken || 0) + 1;
    ((enabled41.modelLoadToken = value220),
      (enabled41.modelGender = panoramaCharacterGender),
      (enabled41.modelLoadError = null),
      setMannequinProxyMode(enabled41),
      createPanoramaCharacterModelInstance(panoramaCharacterGender)
        .then((value221) => {
          if (this._mannequinMap.get(value218) !== enabled41 || enabled41.modelLoadToken !== value220) {
            disposeObject3D(value221);
            return;
          }
          enabled41.modelRoot &&
            (enabled41.group.remove(enabled41.modelRoot), disposeObject3D(enabled41.modelRoot));
          ((enabled41.modelMaterial = null), (enabled41.modelRoot = value221), enabled41.group.add(value221));
          const value222 = this._mannequinStateById.get(value218)?.colorKey;
          (applyCharacterClayMaterial(enabled41, this._resolveMannequinColor(value222)),
            setMannequinProxyMode(enabled41),
            this._rebuildPickRoots());
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        })
        .catch((value223) => {
          if (this._mannequinMap.get(value218) !== enabled41 || enabled41.modelLoadToken !== value220) return;
          enabled41.modelLoadError = value223 || new Error('Quaternius character model failed to load');
          enabled41.modelRoot &&
            (enabled41.group.remove(enabled41.modelRoot),
            disposeObject3D(enabled41.modelRoot),
            (enabled41.modelRoot = null));
          ((enabled41.modelMaterial = null), setMannequinProxyMode(enabled41));
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        }));
  }
  ['_syncMannequins'](value224, enabled42 = false) {
    const list20 = value224?.mannequins || [],
      map4 = new Set(collectSelectedObjectIds(value224, 'mannequin')),
      value225 = !enabled42,
      map5 = new Set();
    list20.forEach((box36) => {
      (map5.add(box36.id), this._mannequinStateById.set(box36.id, box36));
      let mannequinVisual = this._mannequinMap.get(box36.id);
      if (!mannequinVisual)
        ((mannequinVisual = createMannequinVisual(this._resolveMannequinColor(box36.colorKey))),
          this._mannequinMap.set(box36.id, mannequinVisual),
          this.scene.add(mannequinVisual.group),
          this._loadCharacterModelForVisual(mannequinVisual, box36.id, box36.gender));
      else
        mannequinVisual.modelGender !== resolvePanoramaCharacterGender(box36.gender) &&
          (mannequinVisual.modelRoot &&
            (mannequinVisual.group.remove(mannequinVisual.modelRoot),
            disposeObject3D(mannequinVisual.modelRoot),
            (mannequinVisual.modelRoot = null)),
          this._loadCharacterModelForVisual(mannequinVisual, box36.id, box36.gender));
      const value226 = this._resolveMannequinColor(box36.colorKey);
      (mannequinVisual.material.color.copy(value226),
        mannequinVisual.headMaterial.color.copy(value226.clone().offsetHSL(0, 0, 0.08)),
        applyGenderShape(mannequinVisual, box36.gender));
      const box37 = this._draftObjects.get('mannequin:' + box36.id);
      (applyGroupTransform(mannequinVisual.group, box37 || box36),
        (mannequinVisual.group.position.y = box37?.position?.y ?? box36.position.y ?? 0),
        applyGroupScale(mannequinVisual.group, box37?.scale ?? box36.scale ?? 1));
      const value227 = value225 && value224?.ui?.isEditing === true && map4.has(box36.id);
      ((mannequinVisual.group.visible = value225),
        (mannequinVisual.selectionRing.visible = false),
        setMannequinProxyMode(mannequinVisual),
        applyCharacterClayMaterial(mannequinVisual, value226),
        applySelectionEmphasis(mannequinVisual.material, value227, 0.18),
        applySelectionEmphasis(mannequinVisual.headMaterial, value227, 0.26),
        applyObjectSelectionEmphasis(mannequinVisual.modelRoot, value227, 0.12));
    });
    for (const [value228, value229] of this._mannequinMap.entries()) {
      if (map5.has(value228)) continue;
      (this.scene.remove(value229.group),
        disposeObject3D(value229.group),
        this._mannequinMap.delete(value228),
        this._mannequinStateById.delete(value228));
    }
    this._rebuildPickRoots();
  }
  ['_syncCubes'](value230, enabled43 = false) {
    const list21 = value230?.cubes || [],
      map6 = new Set(collectSelectedObjectIds(value230, 'cube')),
      value231 = !enabled43,
      map7 = new Set();
    list21.forEach((box38) => {
      (map7.add(box38.id), this._cubeStateById.set(box38.id, box38));
      let cubeVisual = this._cubeMap.get(box38.id);
      !cubeVisual &&
        ((cubeVisual = createCubeVisual(this._resolveMannequinColor(box38.colorKey))),
        this._cubeMap.set(box38.id, cubeVisual),
        this.scene.add(cubeVisual.group));
      const value232 = this._resolveMannequinColor(box38.colorKey);
      (cubeVisual.material.color.copy(value232),
        cubeVisual.edgeMaterial.color.copy(value232.clone().offsetHSL(0, 0, -0.18)));
      const value233 = this._draftObjects.get('cube:' + box38.id),
        box39 = value233 || box38;
      (applyGroupTransform(cubeVisual.group, box39),
        (cubeVisual.group.position.y = Number(box39?.position?.y) || 0),
        applyGroupScale(cubeVisual.group, box39?.scale ?? box38?.scale ?? 1));
      const value234 = value231 && value230?.ui?.isEditing === true && map6.has(box38.id);
      ((cubeVisual.group.visible = value231),
        (cubeVisual.selectionRing.visible = false),
        applySelectionEmphasis(cubeVisual.material, value234, 0.22),
        (cubeVisual.edgeMaterial.opacity = value234 ? 1 : 0.9));
    });
    for (const [value235, value236] of this._cubeMap.entries()) {
      if (map7.has(value235)) continue;
      (this.scene.remove(value236.group),
        disposeObject3D(value236.group),
        this._cubeMap.delete(value235),
        this._cubeStateById.delete(value235));
    }
    this._rebuildPickRoots();
  }
  ['_syncCameras'](value237, enabled44 = false) {
    const list22 = Array.isArray(value237?.cameras) ? value237.cameras : [],
      value238 =
        value237?.viewport?.activeView === 'camera' && value237?.viewport?.activeCameraId
          ? String(value237.viewport.activeCameraId)
          : null,
      value239 =
        this._draftView?.kind === 'camera' && this._draftView?.cameraId
          ? String(this._draftView.cameraId)
          : null,
      value240 =
        !enabled44 &&
        list22.some((enabled45) => {
          if (!enabled45?.id) return false;
          const cameraPoseData3 = normalizeCameraPoseData(enabled45),
            sceneViewFromReference = cameraPoseToSceneViewFromReference(
              cameraPoseData3,
              value237?.viewport?.sceneView,
            );
          return areSceneViewsEquivalent(value237?.viewport?.sceneView, sceneViewFromReference);
        }),
      enabled46 = Boolean(value238 || value239 || value240),
      value241 = !enabled44 && !enabled46,
      map8 = new Set();
    list22.forEach((enabled47) => {
      if (!enabled47?.id) return;
      const value242 = String(enabled47.id);
      (map8.add(value242), this._cameraStateById.set(value242, enabled47));
      let cameraVisual = this._cameraMap.get(value242);
      !cameraVisual &&
        ((cameraVisual = createCameraVisual()),
        this._cameraMap.set(value242, cameraVisual),
        this.scene.add(cameraVisual.group));
      const cameraPoseData4 = normalizeCameraPoseData(enabled47);
      (cameraVisual.group.position.set(
        cameraPoseData4.position.x,
        cameraPoseData4.position.y,
        cameraPoseData4.position.z,
      ),
        cameraVisual.group.quaternion.set(
          cameraPoseData4.quaternion.x,
          cameraPoseData4.quaternion.y,
          cameraPoseData4.quaternion.z,
          cameraPoseData4.quaternion.w,
        ),
        (cameraVisual.group.visible = value241));
    });
    for (const [value243, value244] of this._cameraMap.entries()) {
      if (map8.has(value243)) continue;
      (this.scene.remove(value244.group),
        disposeObject3D(value244.group),
        this._cameraMap.delete(value243),
        this._cameraStateById.delete(value243));
    }
  }
  ['_resolveGizmoContext'](value245) {
    const list23 = collectSelectedObjects(value245);
    if (list23.length === 0) return null;
    const activeTransformTool = resolveActiveTransformTool(value245),
      selectedObjects = list23
        .map((objectType3) => ({
          objectType: objectType3.objectType,
          id: objectType3.objectId,
          item:
            this._draftObjects.get(objectType3.objectType + ':' + objectType3.objectId) ||
            this._getObjectStateByObjectType(objectType3.objectType, objectType3.objectId),
          visual: this._getVisualByObjectType(objectType3.objectType, objectType3.objectId),
        }))
        .filter((enabled48) => !!enabled48.visual && !!enabled48.item);
    if (selectedObjects.length === 0) return null;
    selectedObjects.forEach((item31) => {
      ((item31.pivotWorld = resolveObjectToolPivot(
        item31.item,
        item31.visual,
        activeTransformTool,
        item31.objectType,
      )),
        (item31.orientationQuaternion = resolveObjectOrientationQuaternion(item31.item, item31.visual)));
    });
    const value246 =
        value245?.selection?.selectedObjectType === 'cube' ||
        value245?.selection?.selectedObjectType === 'mannequin'
          ? value245.selection.selectedObjectType
          : null,
      value247 = value245?.selection?.selectedObjectId || null,
      value248 =
        value247 && value246
          ? selectedObjects.find((item32) => item32.objectType === value246 && item32.id === value247) || null
          : null,
      activeEntry = value248 || selectedObjects[0],
      pivot4 = new threeRuntime['Vector3'](),
      isMultiSelection2 = selectedObjects.length > 1;
    if (isMultiSelection2)
      (selectedObjects.forEach((item33) => {
        pivot4.add(item33.pivotWorld);
      }),
        pivot4.multiplyScalar(1 / selectedObjects.length));
    else activeEntry?.pivotWorld && pivot4.copy(activeEntry.pivotWorld);
    const bounds = isMultiSelection2
        ? measureVisualBoundsForSelection(selectedObjects) || createFallbackBounds()
        : measureVisualBounds(activeEntry.visual) || createFallbackBounds(),
      gizmoWorldMetrics = computeGizmoWorldMetrics(bounds),
      { orientationQuaternion: orientationQuaternion3, usesLocalOrientation: usesLocalOrientation } =
        resolveSelectionGizmoOrientation(selectedObjects, activeEntry, isMultiSelection2),
      selectedObjectType = activeEntry?.objectType || null,
      selectedIds = selectedObjects
        .filter((item34) => item34.objectType === selectedObjectType)
        .map((item35) => item35.id);
    return {
      selectedObjectType: selectedObjectType,
      selectedIds: selectedIds,
      selectedObjects: selectedObjects.map((objectType4) => ({
        objectType: objectType4.objectType,
        objectId: objectType4.id,
      })),
      selectedVisuals: selectedObjects,
      activeEntry: activeEntry,
      isMultiSelection: isMultiSelection2,
      pivot: pivot4.clone(),
      position: pivot4.clone(),
      orientationQuaternion: orientationQuaternion3,
      usesLocalOrientation: usesLocalOrientation,
      bounds: bounds,
      gizmoWorldMetrics: gizmoWorldMetrics,
    };
  }
  ['_computeWorldUnitsPerPixelAt'](enabled49) {
    if (!enabled49 || !this.camera?.position) return 0;
    const value249 = Math.max(0.001, this.camera.position.distanceTo(enabled49)),
      value250 = ((Number(this.camera?.fov) || 58) * Math.PI) / 180,
      value251 = Math.max(
        1,
        Number(this.renderer?.domElement?.clientHeight) || Number(this.renderer?.domElement?.height) || 1,
      ),
      value252 = 2 * Math.tan(value250 / 2) * value249;
    return value252 / value251;
  }
  ['_computeScreenConstantGizmoScale'](value253, value254 = 104) {
    const count2 = this._computeWorldUnitsPerPixelAt(value253);
    if (!(count2 > 0)) return 1;
    return Math.max(0.35, Math.min(6, count2 * value254));
  }
  ['_captureGizmoDragLock'](box40) {
    if (!this._gizmo || !box40) return null;
    const position2 = this._gizmo.root.position.clone(),
      orientationQuaternion4 = this._gizmo.root.quaternion.clone(),
      bounds2 = {
        box: box40.bounds?.box?.clone?.() || createFallbackBounds().box,
        size: box40.bounds?.size?.clone?.() || new threeRuntime['Vector3'](1, 1, 1),
        sphere: box40.bounds?.sphere
          ? new threeRuntime['Sphere'](
              box40.bounds.sphere.center?.clone?.() || new threeRuntime['Vector3'](),
              Number(box40.bounds.sphere.radius) || 0,
            )
          : new threeRuntime['Sphere'](new threeRuntime['Vector3'](0, 0.5, 0), Math.sqrt(0.75)),
        extents: {
          x: Number(box40.bounds?.extents?.x) || 0,
          y: Number(box40.bounds?.extents?.y) || 0,
          z: Number(box40.bounds?.extents?.z) || 0,
        },
      },
      gizmoWorldMetrics2 = {
        extents: {
          x: Number(box40.gizmoWorldMetrics?.extents?.x) || 0,
          y: Number(box40.gizmoWorldMetrics?.extents?.y) || 0,
          z: Number(box40.gizmoWorldMetrics?.extents?.z) || 0,
        },
        sphereRadius: Number(box40.gizmoWorldMetrics?.sphereRadius) || 0.01,
        margin: Number(box40.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
      },
      context = {
        ...box40,
        position: position2,
        pivot: box40.pivot?.clone?.() || position2.clone(),
        orientationQuaternion: orientationQuaternion4,
        bounds: bounds2,
        gizmoWorldMetrics: gizmoWorldMetrics2,
      },
      scale = this._computeScreenConstantGizmoScale(position2);
    return (
      (this._gizmo.dragLock = {
        context: context,
        position: position2.clone(),
        orientationQuaternion: orientationQuaternion4.clone(),
        bounds: bounds2,
        gizmoWorldMetrics: gizmoWorldMetrics2,
        scale: scale,
      }),
      this._gizmo.dragLock
    );
  }
  ['_applyGizmoLayoutFromContext'](value255, value256) {
    const enabled50 = this._gizmo?.baseLayout,
      enabled51 = value255?.gizmoWorldMetrics;
    if (!enabled50 || !enabled51) return;
    const x12 = enabled51.extents,
      value257 = enabled51.margin,
      value258 = Math.max(0.01, Number(enabled51.maxExtent) || 0.01),
      value259 = Math.max(0.001, Number(value256) || 1),
      value260 = GIZMO_MOVE_HEAD_LENGTH * 0.5,
      value261 = GIZMO_SCALE_HEAD_SIZE * 0.5,
      value262 = GIZMO_MOVE_PICK_LENGTH - GIZMO_BASE_AXIS_LENGTH,
      value263 = GIZMO_SCALE_PICK_LENGTH - GIZMO_BASE_SCALE_LENGTH,
      value264 = { x: x12.x + value257, y: x12.y + value257, z: x12.z + value257 };
    (['x', 'y', 'z'].forEach((item36) => {
      const value265 = this._gizmo?.moveAxes?.[item36],
        value266 = this._gizmo?.scaleAxes?.[item36],
        value267 = Math.max(enabled50.axisLength, value264[item36] / value259),
        value268 = Math.max(GIZMO_MOVE_SHAFT_LENGTH, value267 - value260),
        value269 = Math.max(GIZMO_MOVE_PICK_LENGTH, value267 + value262);
      value265?.shaftLine && setAxisLineEnd(value265.shaftLine, item36, value268);
      value265?.headMesh && setAxisHandleLayout(value265.headMesh, value267 - value260, value260);
      value265?.pickMesh &&
        (setAxisHandleLayout(value265.pickMesh, value269 * 0.5),
        value265.pickMesh.scale.set(1, value269 / GIZMO_MOVE_PICK_LENGTH, 1));
      const value270 = enabled50.scaleLength,
        value271 = Math.max(GIZMO_SCALE_SHAFT_LENGTH, value270 - value261),
        value272 = Math.max(GIZMO_SCALE_PICK_LENGTH, value270 + value263);
      (value266?.shaftLine && setAxisLineEnd(value266.shaftLine, item36, value271),
        value266?.headMesh && setAxisHandleLayout(value266.headMesh, value270 - value261, value261),
        value266?.pickMesh &&
          (setAxisHandleLayout(value266.pickMesh, value272 * 0.5),
          value266.pickMesh.scale.set(1, value272 / GIZMO_SCALE_PICK_LENGTH, 1)));
    }),
      ['x', 'y', 'z'].forEach((item37) => {
        const value273 = this._gizmo?.rotateRings?.[item37];
        if (value273?.group) value273.group.scale.setScalar(1);
      }));
    const value274 = Math.max(enabled50.planeOffset * 0.5, value257 * 0.42),
      value275 = Math.max(enabled50.planeOffset, (x12.x + value274) / value259),
      value276 = Math.max(enabled50.planeOffset, (x12.y + value274) / value259),
      value277 = Math.max(enabled50.planeOffset, (x12.z + value274) / value259),
      value278 = enabled50.planeSize * 0.86,
      value279 = Math.max(enabled50.planeSize * 1.2, (value258 / value259) * 0.32),
      handler9 = (value280, value281) =>
        Math.max(value278, Math.min(value279, Math.min(value280, value281) * 0.34)),
      value282 = handler9(value275, value276),
      value283 = handler9(value275, value277),
      value284 = handler9(value276, value277),
      value285 = Math.max(enabled50.planeSize * 0.18, value257 * 0.28) / value259,
      handler10 = (enabled52, value286, value287, value288, value289, value290 = 1, value291 = 1) => {
        if (!enabled52) return;
        const value292 = value289 / Math.max(0.001, enabled50.planeSize);
        (enabled52.visualGroup &&
          (enabled52.visualGroup.position.set(value286, value287, value288),
          enabled52.visualGroup.scale.set(value290 * value292, value291 * value292, value292)),
          enabled52.pickMesh &&
            (enabled52.pickMesh.position.set(value286, value287, value288),
            enabled52.pickMesh.scale.setScalar(value292)));
      },
      handler11 = (value293, value294) => {
        const value295 = value293?.[value294 + 'xy'];
        value295 && handler10(value295, value275, value276, value285, value282, 1, 1);
        const value296 = value293?.[value294 + 'xz'];
        value296 && handler10(value296, value275, value285, value277, value283, 1, 1);
        const value297 = value293?.[value294 + 'yz'];
        value297 && handler10(value297, value285, value276, value277, value284, 1, 1);
      };
    (handler11(this._gizmo?.planeHandles, 'plane-'),
      handler11(this._gizmo?.scalePlaneHandles, 'scale-plane-'));
  }
  ['_applyGizmoOrientationFromContext'](enabled53) {
    if (!this._gizmo?.root?.quaternion) return;
    if (!enabled53) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (enabled53.isMultiSelection && enabled53.usesLocalOrientation !== true) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (enabled53.orientationQuaternion) {
      this._gizmo.root.quaternion.copy(enabled53.orientationQuaternion);
      return;
    }
    this._gizmo.root.quaternion.identity();
  }
  ['_syncGizmo'](enabled54, value298 = false) {
    if (value298 || enabled54?.mode !== 'scene') {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    if (!enabled54?.ui?.isEditing) {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const activeTransformTool2 = resolveActiveTransformTool(enabled54);
    ((this._gizmo.currentTool = activeTransformTool2),
      (this._gizmo.root.visible =
        activeTransformTool2 === 'move' ||
        activeTransformTool2 === 'rotate' ||
        activeTransformTool2 === 'scale'));
    if (!this._gizmo.root.visible) {
      (this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const transformSelectionSignature3 = buildTransformSelectionSignature(enabled54);
    if (!transformSelectionSignature3) {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const value299 = this._resolveGizmoContext(enabled54),
      enabled55 = value299 || this._resolveStableGizmoContext(enabled54);
    if (!enabled55) {
      ((this._gizmo.root.visible = false), this.clearGizmoHandleState());
      return;
    }
    (value299 && this._cacheStableGizmoContext(enabled54, value299),
      (this._gizmo.moveGroup.visible = activeTransformTool2 === 'move'),
      (this._gizmo.rotateGroup.visible = activeTransformTool2 === 'rotate'),
      (this._gizmo.scaleGroup.visible = activeTransformTool2 === 'scale'),
      this._gizmo.root.position.copy(enabled55.position),
      this._applyGizmoOrientationFromContext(enabled55),
      this._applyGizmoHighlight());
  }
  ['_applyGizmoPosition']() {
    if (!this._sceneState?.ui?.isEditing) return;
    if (!this._gizmo.root.visible) return;
    const box41 = this._gizmo.dragLock;
    if (box41) {
      (this._gizmo.root.position.copy(box41.position),
        this._gizmo.root.quaternion.copy(box41.orientationQuaternion),
        this._gizmo.root.scale.setScalar(box41.scale),
        this._applyGizmoLayoutFromContext(box41.context, box41.scale));
      return;
    }
    const value300 = this._resolveGizmoContext(this._sceneState),
      enabled56 = value300 || this._resolveStableGizmoContext(this._sceneState);
    if (!enabled56) return;
    value300 && this._cacheStableGizmoContext(this._sceneState, value300);
    (this._gizmo.root.position.copy(enabled56.position), this._applyGizmoOrientationFromContext(enabled56));
    const value301 = this._computeScreenConstantGizmoScale(enabled56.position);
    (this._gizmo.root.scale.setScalar(value301), this._applyGizmoLayoutFromContext(enabled56, value301));
  }
  ['_applyGizmoHighlight']() {
    const value302 = this._gizmo?.hoverHandle || null,
      value303 = this._gizmo?.activeHandle || null,
      handler12 = (enabled57) => {
        const value304 = new Set();
        if (!enabled57) return value304;
        value304.add(enabled57);
        const value305 = this._gizmo?.handles?.get?.(enabled57) || null;
        return (
          value305?.mode === 'plane' &&
            (value305.linkedAxes || []).forEach((item38) => {
              if (item38) value304.add('axis-' + item38);
            }),
          value304
        );
      },
      map9 = handler12(value303),
      map10 = handler12(value302);
    this._gizmo?.handles?.forEach((item39, value306) => {
      const enabled58 = map9.has(value306),
        value307 = !enabled58 && map10.has(value306),
        value308 = enabled58 ? 0.52 : value307 ? 0.3 : 0,
        value309 = enabled58 ? 1 : value307 ? 0.92 : 0.8;
      (item39.visuals || []).forEach((item40) => {
        const enabled59 = item40?.material,
          enabled60 = item40?.color;
        if (!enabled59?.color || !enabled60) return;
        (enabled59.color.copy(enabled60).lerp(new threeRuntime.Color(0xffffff), value308),
          typeof item40.opacity === 'number' &&
            'opacity' in enabled59 &&
            (enabled59.opacity = item40.opacity * value309),
          (enabled59.needsUpdate = true));
      });
    });
  }
  ['_applyRenderView']() {
    const value310 = this._resolveTargetRenderPose(),
      value311 = performance.now(),
      enabled61 = this._shouldSmoothTargetPose(value310, value311),
      value312 = enabled61 ? this._applyPoseSmoothing(value310, value311) : cloneRenderPose(value310),
      keepAnimating = enabled61 && measurePoseDistance(value312, value310) > POSE_SETTLE_EPSILON;
    return (
      (!enabled61 || !keepAnimating) &&
        ((this._smoothedPose = cloneRenderPose(value310)), (this._lastRenderTime = value311)),
      (this._renderPose = value312),
      this._commitCameraFromPose(value312),
      { keepAnimating: keepAnimating }
    );
  }
  ['_resolveTargetRenderPose']() {
    const value313 = this._sceneState,
      value314 = this._draftView,
      value315 = this._isPanorama360Mode(value313);
    let panoramaViewPose;
    if (value315) {
      const value316 =
        value314?.kind === 'panorama-default'
          ? value314.panoramaView || value313?.viewport?.panoramaView
          : value313?.viewport?.panoramaView;
      panoramaViewPose = resolvePanoramaViewPose(value316, { x: 0, y: 0, z: 0 });
    } else {
      if (value314?.kind === 'camera') {
        const position3 = normalizeCameraPoseData(value314);
        panoramaViewPose = {
          kind: 'camera',
          position: position3.position,
          quaternion: position3.quaternion,
          rotation: position3.rotation,
          fov: position3.fov,
        };
      } else {
        if (value314?.kind === 'scene-default')
          panoramaViewPose = resolveSceneCameraPose(
            value314.sceneView || value313.viewport.sceneView,
            Number.isFinite(Number(value314.fov))
              ? Number(value314.fov)
              : focalLengthToFov(this._defaultSceneFocalLength),
          );
        else {
          if (value314?.kind === 'panorama-default')
            panoramaViewPose = resolvePanoramaViewPose(
              value314.panoramaView || value313.viewport.panoramaView,
            );
          else {
            if (value313.mode === 'panorama')
              panoramaViewPose = resolvePanoramaViewPose(value313.viewport.panoramaView);
            else
              value313?.viewport?.activeView === 'camera' && value313?.viewport?.activeCameraId
                ? (panoramaViewPose = resolveSceneCameraPose(
                    value313.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ))
                : (panoramaViewPose = resolveSceneCameraPose(
                    value313.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ));
          }
        }
      }
    }
    return panoramaViewPose;
  }
  ['_shouldSmoothTargetPose'](enabled62, value317 = performance.now()) {
    if (this._draftView?.disableSmoothing === true) return false;
    if (!enabled62 || enabled62.kind === 'camera') return false;
    if (value317 <= (this._viewSmoothingUntil || 0)) return true;
    if (!this._smoothedPose || this._smoothedPose.kind !== enabled62.kind) return false;
    return measurePoseDistance(this._smoothedPose, enabled62) > POSE_SETTLE_EPSILON;
  }
  ['_applyPoseSmoothing'](event6, value318 = performance.now()) {
    if (!this._smoothedPose || this._smoothedPose.kind !== event6.kind)
      return (
        (this._smoothedPose = cloneRenderPose(event6)),
        (this._lastRenderTime = value318),
        cloneRenderPose(event6)
      );
    const value319 = Math.min(
      VIEW_DAMPING_MAX_DT_MS,
      Math.max(0, value318 - (this._lastRenderTime || value318)),
    );
    this._lastRenderTime = value318;
    const event7 = this._smoothedPose;
    if (event6.kind === 'panorama-default')
      return (
        (event7.position.x = dampScalar(
          event7.position.x,
          event6.position.x,
          value319,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.position.y = dampScalar(
          event7.position.y,
          event6.position.y,
          value319,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.position.z = dampScalar(
          event7.position.z,
          event6.position.z,
          value319,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.yaw = dampAngle(event7.yaw, event6.yaw, value319, VIEW_DAMPING_TIME_CONSTANT_MS)),
        (event7.pitch = dampScalar(event7.pitch, event6.pitch, value319, VIEW_DAMPING_TIME_CONSTANT_MS)),
        (event7.fov = dampScalar(event7.fov, event6.fov, value319, VIEW_DAMPING_TIME_CONSTANT_MS)),
        cloneRenderPose(event7)
      );
    return (
      (event7.position.x = dampScalar(
        event7.position.x,
        event6.position.x,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.position.y = dampScalar(
        event7.position.y,
        event6.position.y,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.position.z = dampScalar(
        event7.position.z,
        event6.position.z,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.x = dampScalar(
        event7.target.x,
        event6.target.x,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.y = dampScalar(
        event7.target.y,
        event6.target.y,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.z = dampScalar(
        event7.target.z,
        event6.target.z,
        value319,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.fov = dampScalar(event7.fov, event6.fov, value319, VIEW_DAMPING_TIME_CONSTANT_MS)),
      (event7.yaw = event6.yaw),
      (event7.pitch = event6.pitch),
      (event7.distance = event6.distance),
      cloneRenderPose(event7)
    );
  }
  ['_commitCameraFromPose'](event8) {
    if (!event8) return;
    const value320 = event8?.kind === 'panorama-default' ? 55 : 58;
    ((this.camera.fov = Number.isFinite(Number(event8?.fov)) ? Number(event8.fov) : value320),
      this.camera.updateProjectionMatrix());
    if (event8.kind === 'camera') {
      const cameraPoseData5 = normalizeCameraPoseData(event8);
      (this.camera.position.set(
        cameraPoseData5.position.x,
        cameraPoseData5.position.y,
        cameraPoseData5.position.z,
      ),
        this.camera.quaternion.set(
          cameraPoseData5.quaternion.x,
          cameraPoseData5.quaternion.y,
          cameraPoseData5.quaternion.z,
          cameraPoseData5.quaternion.w,
        ));
      return;
    }
    if (event8.kind === 'panorama-default') {
      const box42 = forwardVectorFromYawPitch(event8.yaw, event8.pitch);
      (this.camera.position.set(0, 0, 0), this.camera.lookAt(box42.x, box42.y, box42.z));
      return;
    }
    (this.camera.position.set(event8.position.x, event8.position.y, event8.position.z),
      this.camera.lookAt(event8.target.x, event8.target.y, event8.target.z));
  }
  ['_applyDraftObjects']() {
    if (!this._sceneState) return;
    (this._mannequinMap.forEach((item41, value321) => {
      const box43 = this._mannequinStateById.get(value321);
      if (!box43) return;
      const value322 = this._draftObjects.get('mannequin:' + value321),
        box44 = value322 || box43;
      (applyGroupTransform(item41.group, box44),
        (item41.group.position.y = Number(box44?.position?.y) || 0),
        applyGroupScale(item41.group, box44?.scale ?? box43?.scale ?? 1));
    }),
      this._cubeMap.forEach((item42, value323) => {
        const box45 = this._cubeStateById.get(value323);
        if (!box45) return;
        const value324 = this._draftObjects.get('cube:' + value323),
          box46 = value324 || box45;
        (applyGroupTransform(item42.group, box46),
          (item42.group.position.y = Number(box46?.position?.y) || 0),
          applyGroupScale(item42.group, box46?.scale ?? box45?.scale ?? 1));
      }));
  }
  ['_getObjectStateByObjectType'](value325, value326) {
    if (value325 === 'cube') return this._cubeStateById.get(value326) || null;
    if (value325 === 'mannequin') return this._mannequinStateById.get(value326) || null;
    return null;
  }
  ['_getVisualByObjectType'](value327, value328) {
    if (value327 === 'cube') return this._cubeMap.get(value328);
    if (value327 === 'mannequin') return this._mannequinMap.get(value328);
    return null;
  }
}
