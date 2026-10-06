import * as threeRuntime from './threeRuntime.js';
import { createCharacterClayMaterial } from './articulatedCharacterModel.js';
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
  applyPanoramaCharacterBonePose,
  capturePanoramaCharacterBoneBase,
  createPanoramaCharacterModelInstance,
  resolvePanoramaCharacterGender,
} from './characterModelRegistry.js';
import { applyCharacterBodyProfile, captureCharacterModelBodyProfileBase } from './characterBodyProfile.js';
import { resolveSceneAsset } from './sceneAssetCatalog.js';
import {
  estimateSceneContentBounds,
  estimateSceneContentExtent,
  readSceneObjectFrame,
  readSceneSelectionFrame,
  resolvePointerDollyAnchor,
} from './scene3dCameraNavigation.js';
import { applySceneAssetColors, createSceneAssetVisual } from './scene3dProceduralAssetVisual.js';
import { loadPanoramaTextureSource } from './scene3dPanoramaTexture.js';
import {
  abortPanoramaTextureLoad,
  cancelPanoramaFullLoad,
  loadPanoramaBridgeTexture,
  schedulePanoramaFullLoad,
} from './scene3dPanoramaBridgeTexture.js';
import {
  applySelectionEmphasis,
  clamp01,
  createSelectionRing,
  normalizePanoramaTextureUrl,
  resolveThemeColor,
  resolveThemeColorValue,
} from './scene3dTheme.js';
import { resolveAxisScreenDragMetric } from './scene3dScreenProjection.js';
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
import * as scene3dViewProjection from './scene3dViewProjection.js';
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
  GIZMO_MARGIN_WORLD_MIN = 0.12,
  GIZMO_MARGIN_WORLD_RATIO = 0.12,
  DEFAULT_BG_FALLBACK = { day: '--white-90', night: '--bg' };
function createLineGeometry(key, index) {
  return new threeRuntime.BufferGeometry().setFromPoints([key, index]);
}
function setLineGeometryPoints(enabled, result, data) {
  if (!enabled?.geometry) return;
  const box = result?.isVector3 ? result : toVector3Like(result),
    box2 = data?.isVector3 ? data : toVector3Like(data),
    enabled2 = enabled.geometry.getAttribute('position');
  if (!enabled2 || enabled2.count < 2) {
    (enabled.geometry.dispose?.(),
      (enabled.geometry = createLineGeometry(box, box2)));
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
    enabled7.setXYZ(
      1,
      box3.x * next,
      box3.y * next,
      box3.z * next,
    ),
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
    group = new threeRuntime.Group();
  configureGizmoObject(group);
  const material = configureGizmoMaterial(
      new threeRuntime.LineBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.96,
      }),
      { transparent: true, opacity: 0.96 },
    ),
    shaftLine = new threeRuntime.Line(
      createLineGeometry(
        new threeRuntime.Vector3(0, 0, 0),
        axis.clone().multiplyScalar(GIZMO_MOVE_SHAFT_LENGTH),
      ),
      material,
    );
  (configureGizmoObject(shaftLine), group.add(shaftLine));
  const material2 = configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.98,
      }),
      { transparent: true, opacity: 0.98 },
    ),
    headMesh = new threeRuntime.Mesh(
      new threeRuntime.ConeGeometry(0.06, GIZMO_MOVE_HEAD_LENGTH, 14),
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
  const pickMesh = new threeRuntime.Mesh(
    new threeRuntime.CylinderGeometry(0.14, 0.14, GIZMO_MOVE_PICK_LENGTH, 10),
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
  const color2 = state.isColor ? state.clone() : new threeRuntime.Color(state),
    axis2 = vectorFromAxisName(axisName2),
    group2 = new threeRuntime.Group();
  configureGizmoObject(group2);
  const material3 = configureGizmoMaterial(
      new threeRuntime.LineBasicMaterial({
        color: color2.clone(),
        transparent: true,
        opacity: 0.96,
      }),
      { transparent: true, opacity: 0.96 },
    ),
    shaftLine2 = new threeRuntime.Line(
      createLineGeometry(
        new threeRuntime.Vector3(0, 0, 0),
        axis2.clone().multiplyScalar(GIZMO_SCALE_SHAFT_LENGTH),
      ),
      material3,
    );
  (configureGizmoObject(shaftLine2), group2.add(shaftLine2));
  const material4 = configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({
        color: color2.clone(),
        transparent: true,
        opacity: 0.98,
      }),
      { transparent: true, opacity: 0.98 },
    ),
    headMesh2 = new threeRuntime.Mesh(
      new threeRuntime.BoxGeometry(GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE),
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
  const pickMesh2 = new threeRuntime.Mesh(
    new threeRuntime.CylinderGeometry(0.14, 0.14, GIZMO_SCALE_PICK_LENGTH, 10),
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
  const color3 = config.isColor ? config.clone() : new threeRuntime.Color(config),
    group3 = new threeRuntime.Group();
  configureGizmoObject(group3);
  const material5 = configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({
        color: color3.clone(),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0.86 },
    ),
    scope = new threeRuntime.Mesh(
      new threeRuntime.TorusGeometry(GIZMO_BASE_ROTATE_RADIUS, 0.016, 8, 64),
      material5,
    );
  if (axisName3 === 'x') scope.rotation.y = Math.PI / 2;
  else axisName3 === 'y' && (scope.rotation.x = Math.PI / 2);
  (configureGizmoObject(scope), group3.add(scope));
  const pickMesh3 = new threeRuntime.Mesh(
    new threeRuntime.TorusGeometry(GIZMO_BASE_ROTATE_RADIUS, 0.11, 8, 64),
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
    ctx.moveTo(planeCornerMetrics.inner - value4, planeCornerMetrics.outer + planeCornerMetrics.halfThickness),
    ctx.lineTo(
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
      planeCornerMetrics.outer + planeCornerMetrics.halfThickness,
    ),
    ctx.lineTo(planeCornerMetrics.outer + planeCornerMetrics.halfThickness, planeCornerMetrics.inner - value4),
    ctx.lineTo(planeCornerMetrics.outer - planeCornerMetrics.halfThickness, planeCornerMetrics.inner - value4),
    ctx.lineTo(
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
      planeCornerMetrics.diagonalEnd - value4,
    ),
    ctx.lineTo(
      planeCornerMetrics.diagonalStart - value4,
      planeCornerMetrics.outer - planeCornerMetrics.halfThickness,
    ),
    ctx.lineTo(planeCornerMetrics.inner - value4, planeCornerMetrics.outer - planeCornerMetrics.halfThickness),
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
        ? new threeRuntime.Color(horizontalColor)
        : resolveThemeColor('--white', '--white'),
    value7 = verticalColor?.isColor
      ? verticalColor.clone()
      : verticalColor
        ? new threeRuntime.Color(verticalColor)
        : resolveThemeColor('--white', '--white'),
    group4 = new threeRuntime.Group();
  configureGizmoObject(group4);
  const planeCornerMetrics2 = getPlaneCornerMetrics(value5),
    visuals = [],
    color4 = value6.clone().lerp(value7, 0.5),
    handler = (value8, value9, value10, value11, color5) => {
      const material6 = configureGizmoMaterial(
          new threeRuntime.MeshBasicMaterial({
            color: color5.clone(),
            transparent: true,
            opacity: 0.98,
            side: threeRuntime.DoubleSide,
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.98 },
        ),
        value12 = new threeRuntime.Mesh(
          new threeRuntime.PlaneGeometry(value8, value9),
          material6,
        );
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
      value13 = new threeRuntime.Mesh(
        new threeRuntime.PlaneGeometry(planeCornerMetrics2.armThickness, planeCornerMetrics2.armThickness),
        material7,
      );
    (value13.position.set(planeCornerMetrics2.outer, planeCornerMetrics2.outer, 0),
      configureGizmoObject(value13),
      group4.add(value13),
      visuals.push({ material: material7, color: color4.clone(), opacity: 0.98 }));
  }
  {
    const material8 = configureGizmoMaterial(
        new threeRuntime.MeshBasicMaterial({
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
      new threeRuntime.Float32BufferAttribute(
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
    const value15 = new threeRuntime.Mesh(el, material8);
    (configureGizmoObject(value15),
      group4.add(value15),
      visuals.push({ material: material8, color: color4.clone(), opacity: 0.38 }));
  }
  return { group: group4, visuals: visuals };
}
function eachMaterial(list, handler2) {
  if (!list) return;
  if (Array.isArray(list)) {
    list.forEach((value16) => handler2(value16));
    return;
  }
  handler2(list);
}
function createMannequinVisual(color6) {
  const group5 = new threeRuntime.Group(),
    proxyRoot = new threeRuntime.Group();
  group5.add(proxyRoot);
  const fallbackObjects = [],
    material9 = new threeRuntime.MeshStandardMaterial({
      color: color6,
      roughness: 0.62,
      metalness: 0.08,
    }),
    headMaterial = material9.clone();
  headMaterial.color = material9.color.clone().offsetHSL(0, 0, 0.08);
  const head = new threeRuntime.Mesh(
    new threeRuntime.SphereGeometry(0.155, 18, 16),
    headMaterial,
  );
  ((head.position.y = 1.7),
    head.scale.set(0.96, 1.08, 0.94),
    proxyRoot.add(head),
    fallbackObjects.push(head));
  const neck = new threeRuntime.Mesh(
    new threeRuntime.CylinderGeometry(0.052, 0.064, 0.12, 12),
    material9,
  );
  ((neck.position.y = 1.51), proxyRoot.add(neck), fallbackObjects.push(neck));
  const chest = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.17, 0.42, 6, 12),
    material9,
  );
  ((chest.position.y = 1.26),
    chest.scale.set(1.38, 1.02, 0.92),
    proxyRoot.add(chest),
    fallbackObjects.push(chest));
  const waist = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.105, 0.18, 5, 10),
    material9,
  );
  ((waist.position.y = 0.98),
    waist.scale.set(1.02, 0.94, 0.86),
    proxyRoot.add(waist),
    fallbackObjects.push(waist));
  const pelvis = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.14, 0.2, 5, 12),
    material9,
  );
  ((pelvis.position.y = 0.77),
    pelvis.scale.set(1.28, 0.96, 0.98),
    proxyRoot.add(pelvis),
    fallbackObjects.push(pelvis));
  const value17 = new threeRuntime.Mesh(new threeRuntime.SphereGeometry(0.07, 12, 12), material9);
  (value17.position.set(-0.31, 1.43, 0), proxyRoot.add(value17), fallbackObjects.push(value17));
  const value18 = value17.clone();
  ((value18.position.x = 0.31), proxyRoot.add(value18), fallbackObjects.push(value18));
  const value19 = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.048, 0.28, 4, 10),
    material9,
  );
  (value19.position.set(-0.39, 1.17, 0),
    (value19.rotation.z = 0.16),
    (value19.rotation.x = 0.03),
    proxyRoot.add(value19),
    fallbackObjects.push(value19));
  const value20 = value19.clone();
  ((value20.position.x = 0.39),
    (value20.rotation.z = -0.16),
    (value20.rotation.x = -0.03),
    proxyRoot.add(value20),
    fallbackObjects.push(value20));
  const value21 = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.038, 0.26, 4, 10),
    material9,
  );
  (value21.position.set(-0.42, 0.86, 0.01),
    (value21.rotation.z = 0.03),
    (value21.rotation.x = 0.04),
    proxyRoot.add(value21),
    fallbackObjects.push(value21));
  const value22 = value21.clone();
  ((value22.position.x = 0.42),
    (value22.rotation.z = -0.03),
    (value22.rotation.x = -0.04),
    proxyRoot.add(value22),
    fallbackObjects.push(value22));
  const box4 = new threeRuntime.Mesh(new threeRuntime.SphereGeometry(0.048, 10, 10), material9);
  (box4.position.set(-0.425, 0.62, 0.01),
    box4.scale.set(0.9, 1, 0.72),
    proxyRoot.add(box4),
    fallbackObjects.push(box4));
  const value23 = box4.clone();
  ((value23.position.x = 0.425), proxyRoot.add(value23), fallbackObjects.push(value23));
  const value24 = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.072, 0.34, 5, 12),
    material9,
  );
  (value24.position.set(-0.12, 0.47, 0),
    (value24.rotation.z = 0.03),
    proxyRoot.add(value24),
    fallbackObjects.push(value24));
  const value25 = value24.clone();
  ((value25.position.x = 0.12),
    (value25.rotation.z = -0.03),
    proxyRoot.add(value25),
    fallbackObjects.push(value25));
  const value26 = new threeRuntime.Mesh(
    new threeRuntime.CapsuleGeometry(0.055, 0.34, 5, 12),
    material9,
  );
  (value26.position.set(-0.12, 0.03, 0.01),
    proxyRoot.add(value26),
    fallbackObjects.push(value26));
  const value27 = value26.clone();
  ((value27.position.x = 0.12), proxyRoot.add(value27), fallbackObjects.push(value27));
  const value28 = new threeRuntime.Mesh(new threeRuntime.BoxGeometry(0.115, 0.075, 0.27), material9);
  (value28.position.set(-0.12, -0.19, 0.07),
    (value28.rotation.x = -0.08),
    proxyRoot.add(value28),
    fallbackObjects.push(value28));
  const value29 = value28.clone();
  ((value29.position.x = 0.12), proxyRoot.add(value29), fallbackObjects.push(value29));
  const selectionRing = createSelectionRing(0x7db4ff);
  return (
    group5.add(selectionRing),
    {
      group: group5,
      material: material9,
      headMaterial: headMaterial,
      selectionRing: selectionRing,
      proxyRoot: proxyRoot,
      fallbackObjects: fallbackObjects,
      modelGender: null,
      modelLoadToken: 0,
      modelRoot: null,
      modelBodyProfileBase: null,
      baseBonePose: null,
      appliedBonePoseSignature: '',
      parts: {
        head: head,
        neck: neck,
        chest: chest,
        waist: waist,
        pelvis: pelvis,
        shoulders: [value17, value18],
        upperArms: [value19, value20],
        lowerArms: [value21, value22],
        hands: [box4, value23],
        upperLegs: [value24, value25],
        lowerLegs: [value26, value27],
        feet: [value28, value29],
      },
    }
  );
}
function setMannequinProxyMode(value30) {
  ((value30?.fallbackObjects || []).forEach((value31) => {
    value31.visible = true;
  }),
    [value30?.material, value30?.headMaterial].forEach((enabled10) => {
      if (!enabled10) return;
      ((enabled10.transparent = true),
        (enabled10.opacity = 0.001),
        (enabled10.depthWrite = false),
        (enabled10.colorWrite = false));
    }));
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
      value32?.isColor ? value32 : new threeRuntime.Color(value32 || 0xffffff),
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
  const group6 = new threeRuntime.Group(),
    marker = new threeRuntime.Group();
  group6.add(marker);
  const bodyMaterial = new threeRuntime.LineBasicMaterial({
      color: resolveThemeColor('--white', '--white'),
      transparent: true,
      opacity: 0.8,
    }),
    helperLineMaterial = new threeRuntime.LineBasicMaterial({
      color: resolveThemeColor('--blue', '--blue'),
      transparent: true,
      opacity: 0.8,
    }),
    handler3 = (value37, value38, value39, value40) =>
      new threeRuntime.LineSegments(
        new threeRuntime.EdgesGeometry(new threeRuntime.BoxGeometry(value37, value38, value39)),
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
  const hitProxy = new threeRuntime.Mesh(
    new threeRuntime.BoxGeometry(0.42, 0.3, 0.72),
    new threeRuntime.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }),
  );
  (hitProxy.position.set(0, 0, -0.16), marker.add(hitProxy));
  const value45 = new threeRuntime.BufferGeometry().setFromPoints([
    new threeRuntime.Vector3(-0.025, 0, 0),
    new threeRuntime.Vector3(0.025, 0, 0),
    new threeRuntime.Vector3(0, -0.025, 0),
    new threeRuntime.Vector3(0, 0.025, 0),
  ]);
  marker.add(new threeRuntime.LineSegments(value45, bodyMaterial));
  const box5 = new threeRuntime.Vector3(0, 0, -0.02),
    value46 = 0.55,
    value47 = 0.18,
    value48 = 0.1,
    value49 = box5,
    value50 = new threeRuntime.Vector3(
      box5.x - value47,
      box5.y + value48,
      box5.z - value46,
    ),
    value51 = new threeRuntime.Vector3(
      box5.x + value47,
      box5.y + value48,
      box5.z - value46,
    ),
    value52 = new threeRuntime.Vector3(
      box5.x - value47,
      box5.y - value48,
      box5.z - value46,
    ),
    value53 = new threeRuntime.Vector3(
      box5.x + value47,
      box5.y - value48,
      box5.z - value46,
    ),
    value54 = new threeRuntime.BufferGeometry().setFromPoints([
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
    value55 = new threeRuntime.LineSegments(value54, helperLineMaterial);
  return (
    marker.add(value55),
    {
      group: group6,
      marker: marker,
      hitProxy: hitProxy,
      bodyMaterial: bodyMaterial,
      helperLineMaterial: helperLineMaterial,
    }
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
    box6 &&
      (box6.position.set(-0.115, 0.45, 0), box6.scale.set(0.94, 1, 0.94));
    box7 && (box7.position.set(0.115, 0.45, 0), box7.scale.set(0.94, 1, 0.94));
    box8 &&
      (box8.position.set(-0.115, 0.01, 0.01), box8.scale.set(0.92, 1.02, 0.9));
    box9 &&
      (box9.position.set(0.115, 0.01, 0.01), box9.scale.set(0.92, 1.02, 0.9));
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
    box6 &&
      (box6.position.set(-0.125, 0.47, 0), box6.scale.set(1.06, 1, 1.02));
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
  if (value68 === 'x') return new threeRuntime.Vector3(1, 0, 0);
  if (value68 === 'y') return new threeRuntime.Vector3(0, 1, 0);
  return new threeRuntime.Vector3(0, 0, 1);
}
function toVector3Like(box12, box13 = { x: 0, y: 0, z: 0 }) {
  return new threeRuntime.Vector3(
    Number.isFinite(Number(box12?.x)) ? Number(box12.x) : Number(box13?.x) || 0,
    Number.isFinite(Number(box12?.y)) ? Number(box12.y) : Number(box13?.y) || 0,
    Number.isFinite(Number(box12?.z)) ? Number(box12.z) : Number(box13?.z) || 0,
  );
}
function toEulerLike(box14, box15 = { x: 0, y: 0, z: 0 }, value69 = 'XYZ') {
  return new threeRuntime.Euler(
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
  if (
    box16 &&
    Number.isFinite(box16.x) &&
    Number.isFinite(box16.y) &&
    Number.isFinite(box16.z)
  )
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
  if (
    !Number.isFinite(x3) ||
    !Number.isFinite(y2) ||
    !Number.isFinite(z2) ||
    !Number.isFinite(w)
  )
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
    return new threeRuntime.Quaternion(box22.x, box22.y, box22.z, box22.w);
  }
  const toEulerLike2 = toEulerLike(value73?.rotation, { x: 0, y: 0, z: 0 }, value75);
  return new threeRuntime.Quaternion().setFromEuler(toEulerLike2);
}
function composeMatrixFromPose(box23 = {}, value76 = 'XYZ') {
  const toVector3Like2 = toVector3Like(box23?.position, { x: 0, y: 0, z: 0 }),
    toQuaternionFromPose2 = toQuaternionFromPose(box23, { x: 0, y: 0, z: 0, w: 1 }, value76),
    toVector3Like3 = toVector3Like(toScaleVector(box23?.scale), { x: 1, y: 1, z: 1 });
  return new threeRuntime.Matrix4().compose(toVector3Like2, toQuaternionFromPose2, toVector3Like3);
}
function quaternionFromRotationYXZ(box24) {
  const value77 = new threeRuntime.Quaternion().setFromEuler(
    new threeRuntime.Euler(
      Number(box24?.x) || 0,
      Number(box24?.y) || 0,
      Number(box24?.z) || 0,
      'YXZ',
    ),
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
    const value81 = new threeRuntime.Vector3();
    return (value79.group.getWorldPosition(value81), value81);
  }
  return new threeRuntime.Vector3();
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
    const value87 = new threeRuntime.Quaternion();
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
  const orientationQuaternion = value90?.orientationQuaternion?.clone?.() || new threeRuntime.Quaternion();
  if (!enabled14) return { orientationQuaternion: orientationQuaternion, usesLocalOrientation: true };
  const orientationQuaternion2 =
    list3.length > 0 &&
    list3.every((value91) =>
      areOrientationQuaternionsAligned(orientationQuaternion, value91.orientationQuaternion),
    );
  return {
    orientationQuaternion: orientationQuaternion2 ? orientationQuaternion : new threeRuntime.Quaternion(),
    usesLocalOrientation: orientationQuaternion2,
  };
}
function rotationFromQuaternionYXZ(value92) {
  const box27 = normalizeQuaternionData(value92),
    x4 = new threeRuntime.Euler().setFromQuaternion(
      new threeRuntime.Quaternion(box27.x, box27.y, box27.z, box27.w),
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
    rotation = hasFiniteQuaternion2
      ? rotationFromQuaternionYXZ(quaternion)
      : {
          x: Number(options2?.rotation?.x) || 0,
          y: Number(options2?.rotation?.y) || 0,
          z: Number(options2?.rotation?.z) || 0,
        };
  return {
    position: position,
    quaternion: quaternion,
    rotation: rotation,
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
function collectSelectedObjects(value93) {
  const list4 = Array.isArray(value93?.cubes) ? value93.cubes : [],
    list5 = Array.isArray(value93?.mannequins) ? value93.mannequins : [],
    list6 = Array.isArray(value93?.cameras) ? value93.cameras : [],
    map = new Set(list4.map((value94) => value94.id)),
    map2 = new Set(list5.map((value95) => value95.id)),
    map3 = new Set(list6.map((value96) => value96.id)),
    map4 = new Set(),
    list7 = [],
    handler4 = (objectType, value97) => {
      if (objectType !== 'cube' && objectType !== 'mannequin' && objectType !== 'camera') return;
      const objectId = String(value97 || '').trim();
      if (!objectId) return;
      const enabled15 =
        objectType === 'camera'
          ? map3.has(objectId)
          : objectType === 'cube'
            ? map.has(objectId)
            : map2.has(objectId);
      if (!enabled15) return;
      const value98 = objectType + ':' + objectId;
      if (map4.has(value98)) return;
      (map4.add(value98), list7.push({ objectType: objectType, objectId: objectId }));
    },
    list8 = Array.isArray(value93?.selection?.selectedObjects)
      ? value93.selection.selectedObjects
      : [];
  list8.forEach((value99) => {
    handler4(value99?.objectType, value99?.objectId);
  });
  if (list7.length > 0) return list7;
  const value100 = value93?.selection?.selectedGroupId || null;
  if (value100) {
    const value101 = (value93?.groups || []).find((value102) => value102.id === value100),
      list9 = Array.isArray(value101?.memberIds) ? value101.memberIds : [];
    list9.forEach((value103) => {
      handler4('mannequin', value103);
    });
    if (list7.length > 0) return list7;
  }
  const enabled16 =
    value93?.selection?.selectedObjectType === 'cube' ||
    value93?.selection?.selectedObjectType === 'mannequin' ||
    value93?.selection?.selectedObjectType === 'camera'
      ? value93.selection.selectedObjectType
      : null;
  if (!enabled16) return list7;
  const list10 = Array.isArray(value93?.selection?.selectedObjectIds)
    ? value93.selection.selectedObjectIds
    : [];
  if (list10.length > 0) {
    list10.forEach((value104) => {
      handler4(enabled16, value104);
    });
    if (list7.length > 0) return list7;
  }
  return (handler4(enabled16, value93?.selection?.selectedObjectId || null), list7);
}
function collectSelectedObjectIds(value105, value106) {
  return collectSelectedObjects(value105)
    .filter((value107) => value107.objectType === value106)
    .map((value108) => value108.objectId);
}
function buildTransformSelectionSignature(value109) {
  const list11 = collectSelectedObjects(value109);
  if (list11.length === 0) return '';
  return list11.map((value110) => value110.objectType + ':' + value110.objectId)
    .sort()
    .join('|');
}
function cloneGizmoDisplayContext(isMultiSelection) {
  if (!isMultiSelection) return null;
  return {
    isMultiSelection: isMultiSelection.isMultiSelection === true,
    usesLocalOrientation: isMultiSelection.usesLocalOrientation === true,
    position: isMultiSelection.position?.clone?.() || new threeRuntime.Vector3(),
    orientationQuaternion:
      isMultiSelection.orientationQuaternion?.clone?.() || new threeRuntime.Quaternion(),
    bounds: {
      box: isMultiSelection.bounds?.box?.clone?.() || createFallbackBounds().box,
      size: isMultiSelection.bounds?.size?.clone?.() || new threeRuntime.Vector3(1, 1, 1),
      sphere: isMultiSelection.bounds?.sphere
        ? new threeRuntime.Sphere(
            isMultiSelection.bounds.sphere.center?.clone?.() || new threeRuntime.Vector3(),
            Number(isMultiSelection.bounds.sphere.radius) || 0,
          )
        : new threeRuntime.Sphere(new threeRuntime.Vector3(0, 0.5, 0), Math.sqrt(0.75)),
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
      maxExtent: Number(isMultiSelection.gizmoWorldMetrics?.maxExtent) || 0.01,
      sphereRadius: Number(isMultiSelection.gizmoWorldMetrics?.sphereRadius) || 0.01,
      margin: Number(isMultiSelection.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
    },
  };
}
function measureVisualBounds(enabled17) {
  if (enabled17?.boundsBox?.isBox3 && !enabled17.boundsBox.isEmpty()) {
    const box28 = enabled17.boundsBox.clone(),
      size = new threeRuntime.Vector3(),
      sphere = new threeRuntime.Sphere();
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
  const enabled18 = enabled17?.proxyRoot || enabled17?.group;
  if (!enabled18) return null;
  const box29 = new threeRuntime.Box3().setFromObject(enabled18);
  if (box29.isEmpty()) return null;
  const size2 = new threeRuntime.Vector3(),
    sphere2 = new threeRuntime.Sphere();
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
function resolveObjectToolPivot(value111, value112) {
  return resolveObjectPivot(value111, value112);
}
function measureVisualBoundsForSelection(list12 = []) {
  const box30 = new threeRuntime.Box3();
  let enabled19 = false;
  list12.forEach((enabled20) => {
    if (enabled20?.visual?.boundsBox?.isBox3 && !enabled20.visual.boundsBox.isEmpty()) {
      const value113 = enabled20.visual.boundsBox;
      if (!enabled19) {
        (box30.copy(value113), (enabled19 = true));
        return;
      }
      box30.union(value113);
      return;
    }
    const enabled21 = enabled20?.visual?.proxyRoot || enabled20?.visual?.group;
    if (!enabled21) return;
    const value114 = new threeRuntime.Box3().setFromObject(enabled21);
    if (value114.isEmpty()) return;
    if (!enabled19) {
      (box30.copy(value114), (enabled19 = true));
      return;
    }
    box30.union(value114);
  });
  if (!enabled19) return null;
  const size3 = new threeRuntime.Vector3(),
    sphere3 = new threeRuntime.Sphere();
  return (
    box30.getSize(size3),
    box30.getBoundingSphere(sphere3),
    {
      box: box30,
      size: size3,
      sphere: sphere3,
      extents: {
        x: Math.max(0, size3.x * 0.5),
        y: Math.max(0, size3.y * 0.5),
        z: Math.max(0, size3.z * 0.5),
      },
    }
  );
}
function createFallbackBounds() {
  return {
    box: new threeRuntime.Box3(
      new threeRuntime.Vector3(-0.5, 0, -0.5),
      new threeRuntime.Vector3(0.5, 1, 0.5),
    ),
    size: new threeRuntime.Vector3(1, 1, 1),
    sphere: new threeRuntime.Sphere(new threeRuntime.Vector3(0, 0.5, 0), Math.sqrt(0.75)),
    extents: { x: 0.5, y: 0.5, z: 0.5 },
  };
}
function computeGizmoWorldMetrics(value115, box31) {
  const value116 = value115?.extents || { x: 0.5, y: 0.5, z: 0.5 },
    enabled22 = value115?.box,
    value117 = enabled22 && !enabled22.isEmpty?.() && box31,
    extents = value117
      ? {
          x: Math.max(
            Math.abs(enabled22.min.x - box31.x),
            Math.abs(enabled22.max.x - box31.x),
          ),
          y: Math.max(
            Math.abs(enabled22.min.y - box31.y),
            Math.abs(enabled22.max.y - box31.y),
          ),
          z: Math.max(
            Math.abs(enabled22.min.z - box31.z),
            Math.abs(enabled22.max.z - box31.z),
          ),
        }
      : value116,
    maxExtent = Math.max(
      0.01,
      Number(extents.x) || 0,
      Number(extents.y) || 0,
      Number(extents.z) || 0,
    ),
    sphereRadius = Math.max(0.01, Number(value115?.sphere?.radius) || 0.01),
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
      value118 =
        Math.abs(cameraPoseData2.position.x - cameraPoseData.position.x) +
        Math.abs(cameraPoseData2.position.y - cameraPoseData.position.y) +
        Math.abs(cameraPoseData2.position.z - cameraPoseData.position.z),
      value119 = Math.abs(
        cameraPoseData2.quaternion.x * cameraPoseData.quaternion.x +
          cameraPoseData2.quaternion.y * cameraPoseData.quaternion.y +
          cameraPoseData2.quaternion.z * cameraPoseData.quaternion.z +
          cameraPoseData2.quaternion.w * cameraPoseData.quaternion.w,
      ),
      value120 = 1 - Math.min(1, Math.max(0, value119));
    return value118 + value120 + Math.abs(cameraPoseData2.fov - cameraPoseData.fov);
  }
  if (event3.kind === 'panorama-default') {
    const value121 =
        Math.abs((event3.position?.x || 0) - (event2.position?.x || 0)) +
        Math.abs((event3.position?.y || 0) - (event2.position?.y || 0)) +
        Math.abs((event3.position?.z || 0) - (event2.position?.z || 0)),
      value122 =
        Math.abs((event3.yaw || 0) - (event2.yaw || 0)) +
        Math.abs((event3.pitch || 0) - (event2.pitch || 0));
    return value121 + value122 + Math.abs((event3.fov || 0) - (event2.fov || 0));
  }
  const value123 =
      Math.abs((event3.position?.x || 0) - (event2.position?.x || 0)) +
      Math.abs((event3.position?.y || 0) - (event2.position?.y || 0)) +
      Math.abs((event3.position?.z || 0) - (event2.position?.z || 0)),
    value124 =
      Math.abs((event3.target?.x || 0) - (event2.target?.x || 0)) +
      Math.abs((event3.target?.y || 0) - (event2.target?.y || 0)) +
      Math.abs((event3.target?.z || 0) - (event2.target?.z || 0));
  return value123 + value124 + Math.abs((event3.fov || 0) - (event2.fov || 0));
}
function areSceneViewsEquivalent(event4, event5, value125 = 0.00001) {
  if (!event4 || !event5) return false;
  const box32 = event4.target || {},
    box33 = event5.target || {};
  return (
    Math.abs((Number(box32.x) || 0) - (Number(box33.x) || 0)) <= value125 &&
    Math.abs((Number(box32.y) || 0) - (Number(box33.y) || 0)) <= value125 &&
    Math.abs((Number(box32.z) || 0) - (Number(box33.z) || 0)) <= value125 &&
    Math.abs(
      normalizeAngle((Number(event4.orbitYaw) || 0) - (Number(event5.orbitYaw) || 0)),
    ) <= value125 &&
    Math.abs((Number(event4.orbitPitch) || 0) - (Number(event5.orbitPitch) || 0)) <=
      value125 &&
    Math.abs((Number(event4.orbitDistance) || 0) - (Number(event5.orbitDistance) || 0)) <=
      value125
  );
}
export class PanoramaScene3DBridge {
  constructor({ container: container, onPanoramaStatusChange: onPanoramaStatusChange } = {}) {
    ((this.container = container),
      (this.onPanoramaStatusChange = onPanoramaStatusChange),
      (this.scene = new threeRuntime.Scene()),
      (this.camera = new threeRuntime.PerspectiveCamera(55, 1, 0.1, 250)),
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
      (this._ambientLight = new threeRuntime.AmbientLight(0xffffff, 0.88)),
      (this._keyLight = new threeRuntime.DirectionalLight(0xffffff, 1.05)),
      this._keyLight.position.set(6, 10, 4),
      (this._rimLight = new threeRuntime.DirectionalLight(0x88b6ff, 0.38)),
      this._rimLight.position.set(-6, 8, -10),
      this.scene.add(this._ambientLight, this._keyLight, this._rimLight));
    const themeColorValue = resolveThemeColorValue('--panorama-scene-grid-night', '--indigo-35');
    ((this._gridMinor = new threeRuntime.GridHelper(
      GRID_BASE_SPAN,
      Math.round(GRID_BASE_SPAN / GRID_MINOR_STEP),
      themeColorValue,
      themeColorValue,
    )),
      eachMaterial(this._gridMinor.material, (value126) => {
        ((value126.transparent = true),
          (value126.opacity = 0.2),
          (value126.depthWrite = false),
          (value126.depthTest = true));
      }),
      (this._gridMinor.renderOrder = 1),
      this.scene.add(this._gridMinor),
      (this._gridMajor = new threeRuntime.GridHelper(
        GRID_BASE_SPAN,
        Math.round(GRID_BASE_SPAN / GRID_MAJOR_STEP),
        themeColorValue,
        themeColorValue,
      )),
      eachMaterial(this._gridMajor.material, (value127) => {
        ((value127.transparent = true),
          (value127.opacity = 0.34),
          (value127.depthWrite = false),
          (value127.depthTest = true));
      }),
      (this._gridMajor.renderOrder = 2),
      this.scene.add(this._gridMajor),
      (this._ground = new threeRuntime.Mesh(
        new threeRuntime.PlaneGeometry(1, 1),
        new threeRuntime.MeshBasicMaterial({
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
      (this._panoramaSphere = new threeRuntime.Mesh(
        new threeRuntime.SphereGeometry(60, 48, 32),
        new threeRuntime.MeshBasicMaterial({ color: 0xffffff, side: threeRuntime.BackSide }),
      )),
      (this._panoramaSphere.visible = false),
      this.scene.add(this._panoramaSphere),
      (this._textureLoader = new threeRuntime.TextureLoader()),
      (this._panoramaTextureSourceLoader = (value128, args2 = {}) =>
        loadPanoramaTextureSource(value128, { ...args2, textureLoader: this._textureLoader })),
      (this._mannequinMap = new Map()),
      (this._mannequinStateById = new Map()),
      (this._cubeMap = new Map()),
      (this._cubeStateById = new Map()),
      (this._cameraMap = new Map()),
      (this._cameraStateById = new Map()),
      (this._visualOverrides = new Map()),
      (this._pickMap = new Map()),
      (this._pickRoots = []),
      (this._sceneState = null),
      (this._sceneContentExtent = 16),
      (this._sceneContentBounds = { center: { x: 0, y: 0, z: 0 }, radius: 16 }),
      (this._draftView = null),
      (this._draftObjects = new Map()),
      (this._draftMannequinBonePoses = new Map()),
      (this._rafId = null),
      (this._loadedPanoramaUrl = ''),
      (this._pendingPanoramaUrl = ''),
      (this._panoramaSourceKey = ''),
      (this._panoramaLoadToken = 0),
      (this._panoramaTexture = null),
      (this._panoramaTextureAbortController = null),
      (this._panoramaFullLoadFrame = null),
      (this._renderPose = null),
      (this._defaultSceneFocalLength = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this._smoothedPose = null),
      (this._lastRenderTime = 0),
      (this._viewSmoothingUntil = 0),
      (this._gridSnapState = { minorX: null, minorZ: null, majorX: null, majorZ: null }),
      (this._lastStableGizmoSelectionSignature = ''),
      (this._lastStableGizmoContext = null),
      (this._gizmo = createScene3DGizmoVisual({
        configureGizmoMaterial: configureGizmoMaterial,
        configureGizmoObject: configureGizmoObject,
        createMoveAxis: createMoveAxis,
        createPlaneCornerPickGeometry: createPlaneCornerPickGeometry,
        createPlaneCornerVisual: createPlaneCornerVisual,
        createRotateRing: createRotateRing,
        createScaleAxis: createScaleAxis,
      })),
      this.scene.add(this._gizmo.root),
      (this._gizmoMoveGuideLine = new threeRuntime.Line(
        createLineGeometry(
          new threeRuntime.Vector3(0, 0, 0),
          new threeRuntime.Vector3(0, 0, 0),
        ),
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
      this.resize(640, 360),
      this.requestRender());
  }
  ['resize'](value129, value130) {
    const value131 = Math.max(1, Math.floor(value129 || this.container?.clientWidth || 1)),
      value132 = Math.max(1, Math.floor(value130 || this.container?.clientHeight || 1));
    (this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
      scene3dViewProjection.resizeBridgeViewProjection(this, value131, value132),
      this.renderer.setSize(value131, value132, false),
      this.requestRender());
  }
  ['setViewProjection'](value133 = 'perspective', value134 = {}) {
    const value135 = scene3dViewProjection.switchBridgeViewProjection(this, value133, value134);
    return (this.requestRender(), value135);
  }
  ['readViewProjection']() {
    return scene3dViewProjection.readBridgeViewProjection(this);
  }
  ['setGridVisible'](value136) {
    ((this._gridVisible = value136 !== false),
      this._syncPanoramaModeVisibility(this._isPanorama360Mode()),
      this.requestRender());
  }
  ['setGroundFillVisible'](value137) {
    ((this._groundFillVisible = value137 !== false),
      this._syncPanoramaModeVisibility(this._isPanorama360Mode()),
      this.requestRender());
  }
  ['_isPanorama360Mode'](value138 = this._sceneState) {
    return value138?.type === 'panorama-360';
  }
  ['setDraftView'](value139) {
    ((this._draftView = value139 || null), this.requestRender());
  }
  ['setDefaultSceneFocalLength'](value140) {
    const value141 = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength;
    ((this._defaultSceneFocalLength = Math.max(
      value141.min,
      Math.min(value141.max, Number(value140) || value141.default),
    )),
      this.requestRender());
  }
  ['getDefaultSceneFocalLength']() {
    return this._defaultSceneFocalLength;
  }
  ['clearDraftView']() {
    ((this._draftView = null), this.requestRender());
  }
  ['setDraftObjectTransform'](value142, value143, box34) {
    const value144 = value142 + ':' + value143,
      quaternion2 = hasFiniteQuaternion(box34?.quaternion)
        ? normalizeQuaternionData(box34.quaternion, { x: 0, y: 0, z: 0, w: 1 })
        : value142 === 'camera'
          ? normalizeCameraPoseData(box34).quaternion
          : undefined;
    (this._draftObjects.set(value144, {
      position: { ...box34.position },
      rotation: { ...box34.rotation },
      quaternion: quaternion2,
      scale:
        Number.isFinite(box34?.scale) ||
        (box34?.scale &&
          Number.isFinite(box34.scale.x) &&
          Number.isFinite(box34.scale.y) &&
          Number.isFinite(box34.scale.z))
          ? box34.scale
          : undefined,
    }),
      this.requestRender());
  }
  ['setObjectVisualOverride'](value145, value146, enabled23) {
    const enabled24 = String(value145 || '').trim(),
      enabled25 = String(value146 || '').trim();
    if (!enabled24 || !enabled25 || !enabled23?.group) return false;
    return (
      this._visualOverrides.set(enabled24 + ':' + enabled25, enabled23),
      this.requestRender(),
      true
    );
  }
  ['clearObjectVisualOverride'](value147, value148) {
    const value149 = String(value147 || '').trim() + ':' + String(value148 || '').trim(),
      value150 = this._visualOverrides.delete(value149);
    if (value150) this.requestRender();
    return value150;
  }
  ['clearDraftObjectTransform'](value151, value152) {
    (this._draftObjects.delete(value151 + ':' + value152), this.requestRender());
  }
  ['setDraftMannequinBonePose'](value153, value154) {
    const enabled26 = String(value153 || '').trim();
    if (!enabled26) return;
    this._draftMannequinBonePoses.set(enabled26, value154 || {});
    const value155 = this._mannequinMap.get(enabled26);
    (value155?.modelRoot &&
      value155.baseBonePose &&
      (applyPanoramaCharacterBonePose(value155.modelRoot, value154, value155.baseBonePose),
      (value155.appliedBonePoseSignature = 'draft:' + JSON.stringify(value154 || {}))),
      this.requestRender());
  }
  ['clearDraftMannequinBonePose'](value156) {
    const value157 = String(value156 || '').trim();
    this._draftMannequinBonePoses.delete(value157);
    const value158 = this._mannequinStateById.get(value157),
      value159 = this._mannequinMap.get(value157);
    (value158 &&
      value159?.modelRoot &&
      value159.baseBonePose &&
      (applyPanoramaCharacterBonePose(
        value159.modelRoot,
        value158.bonePose,
        value159.baseBonePose,
      ),
      (value159.appliedBonePoseSignature = JSON.stringify(value158.bonePose || {}))),
      this.requestRender());
  }
  ['clearAllDrafts']() {
    ((this._draftView = null),
      this._draftObjects.clear(),
      this._draftMannequinBonePoses?.clear?.(),
      this.clearGizmoMoveGuideLine(),
      this.requestRender());
  }
  ['markViewSmoothingWindow'](value160 = VIEW_DAMPING_WINDOW_MS) {
    const value161 = Math.max(0, Number(value160) || VIEW_DAMPING_WINDOW_MS),
      value162 = performance.now();
    this._viewSmoothingUntil = Math.max(this._viewSmoothingUntil || 0, value162 + value161);
  }
  ['readCurrentViewPose']() {
    const x5 = new threeRuntime.Vector3(0, 0, -1).applyQuaternion(
        this.camera.quaternion,
      ),
      fov2 = scene3dViewProjection.readBridgePerspectiveFov(this);
    return {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      rotation: {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z,
      },
      quaternion: {
        x: this.camera.quaternion.x,
        y: this.camera.quaternion.y,
        z: this.camera.quaternion.z,
        w: this.camera.quaternion.w,
      },
      forward: { x: x5.x, y: x5.y, z: x5.z },
      yaw: Math.atan2(x5.x, x5.z),
      pitch: Math.asin(Math.max(-1, Math.min(1, x5.y))),
      fov: fov2,
      focalLength: fovToFocalLength(fov2),
      projection: this.readViewProjection(),
    };
  }
  ['readObjectFrame'](objectType2, objectId2) {
    return readSceneObjectFrame({
      objectType: objectType2,
      objectId: objectId2,
      cubeMap: this._cubeMap,
      mannequinMap: this._mannequinMap,
      cameraMap: this._cameraMap,
      camera: this.camera,
    });
  }
  ['readSelectionFrame']() {
    return readSceneSelectionFrame({
      selectionObjects: collectSelectedObjects(this._sceneState),
      cubeMap: this._cubeMap,
      mannequinMap: this._mannequinMap,
      cameraMap: this._cameraMap,
      camera: this.camera,
    });
  }
  ['_resolvePointerRay'](value163, value164) {
    const box35 = this.renderer.domElement.getBoundingClientRect(),
      value165 = new threeRuntime.Vector2(
        ((value163 - box35.left) / box35.width) * 2 - 1,
        -(((value164 - box35.top) / box35.height) * 2 - 1),
      ),
      value166 = new threeRuntime.Raycaster();
    return (value166.setFromCamera(value165, this.camera), value166);
  }
  ['setGizmoHoverHandle'](value167) {
    const value168 = value167 || null;
    if ((this._gizmo?.hoverHandle || null) === value168) return;
    ((this._gizmo.hoverHandle = value168), this._applyGizmoHighlight(), this.requestRender());
  }
  ['setGizmoActiveHandle'](value169) {
    const value170 = value169 || null,
      enabled27 = value170 === null && this._gizmo?.dragLock;
    if ((this._gizmo?.activeHandle || null) === value170 && !enabled27) return;
    ((this._gizmo.activeHandle = value170),
      value170 === null && (this._gizmo.dragLock = null),
      this._applyGizmoHighlight(),
      this.requestRender());
  }
  ['clearGizmoHandleState']() {
    if (!this._gizmo) return;
    const value171 =
      this._gizmo.hoverHandle || this._gizmo.activeHandle || this._gizmo.dragLock;
    ((this._gizmo.hoverHandle = null),
      (this._gizmo.activeHandle = null),
      (this._gizmo.dragLock = null),
      value171 && (this._applyGizmoHighlight(), this.requestRender()));
  }
  ['setGizmoMoveGuideLine']({ from: from2, to: to } = {}) {
    const enabled28 = this._gizmoMoveGuideLine;
    if (!enabled28) return;
    const toVector3Like4 = toVector3Like(from2, { x: 0, y: 0, z: 0 }),
      toVector3Like5 = toVector3Like(to, toVector3Like4);
    (setLineGeometryPoints(enabled28, toVector3Like4, toVector3Like5),
      (enabled28.visible = true),
      this.requestRender());
  }
  ['clearGizmoMoveGuideLine']() {
    const enabled29 = this._gizmoMoveGuideLine;
    if (!enabled29?.visible) return;
    ((enabled29.visible = false), this.requestRender());
  }
  ['_clearStableGizmoContext']() {
    ((this._lastStableGizmoSelectionSignature = ''), (this._lastStableGizmoContext = null));
  }
  ['_cacheStableGizmoContext'](value172, enabled30) {
    const transformSelectionSignature = buildTransformSelectionSignature(value172);
    if (!transformSelectionSignature || !enabled30) return;
    ((this._lastStableGizmoSelectionSignature = transformSelectionSignature),
      (this._lastStableGizmoContext = cloneGizmoDisplayContext(enabled30)));
  }
  ['_resolveStableGizmoContext'](value173) {
    const transformSelectionSignature2 = buildTransformSelectionSignature(value173);
    if (!transformSelectionSignature2) return null;
    if (transformSelectionSignature2 !== this._lastStableGizmoSelectionSignature) return null;
    return this._lastStableGizmoContext || null;
  }
  ['pickGizmoHandle'](value174, value175) {
    if (this._isPanorama360Mode()) return null;
    if (!this._gizmo?.root?.visible) return null;
    const enabled31 =
      this._gizmo?.moveGroup?.visible ||
      this._gizmo?.rotateGroup?.visible ||
      this._gizmo?.scaleGroup?.visible;
    if (!enabled31) return null;
    const list13 = Array.isArray(this._gizmo.pickMeshes) ? this._gizmo.pickMeshes : [];
    if (list13.length === 0) return null;
    const value176 = this._resolvePointerRay(value174, value175),
      value177 = value176.intersectObjects(list13, true);
    for (const x6 of value177) {
      let value178 = x6.object;
      while (value178) {
        const handleKey = value178.userData?.gizmoHandleKey;
        if (handleKey) {
          const mode = this._gizmo.handles?.get?.(handleKey) || null;
          if (!mode) return null;
          const value179 = this._gizmo?.currentTool || 'move',
            value180 =
              mode.mode === 'scale-axis' ||
              mode.mode === 'scale-plane' ||
              mode.mode === 'scale-uniform',
            enabled32 =
              (value179 === 'move' && (mode.mode === 'axis' || mode.mode === 'plane')) ||
              (value179 === 'rotate' && mode.mode === 'rotate') ||
              (value179 === 'scale' && value180);
          if (!enabled32) {
            value178 = value178.parent;
            continue;
          }
          return {
            kind: 'gizmo-handle',
            handleKey: handleKey,
            mode: mode.mode,
            axis: mode.axis || null,
            normalAxis: mode.normalAxis || null,
            linkedAxes: Array.isArray(mode.linkedAxes) ? [...mode.linkedAxes] : [],
            point: { x: x6.point.x, y: x6.point.y, z: x6.point.z },
          };
        }
        value178 = value178.parent;
      }
    }
    return null;
  }
  ['beginMoveGizmoDrag']({ handleKey: handleKey2, clientX: clientX, clientY: clientY } = {}) {
    if (!handleKey2) return null;
    const mode2 = this._gizmo?.handles?.get?.(handleKey2);
    if (!mode2) return null;
    const pivot = this._gizmo.root.position.clone(),
      gizmoQuaternion = this._gizmo.root.quaternion.clone(),
      enabled33 = mode2.mode === 'axis' ? mode2.axis : mode2.normalAxis;
    if (!enabled33) return null;
    const vectorFromAxisName3 = vectorFromAxisName(enabled33).applyQuaternion(gizmoQuaternion).normalize();
    let planeNormalWorld = vectorFromAxisName3.clone();
    if (mode2.mode === 'axis') {
      const value181 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        value182 = new threeRuntime.Vector3().crossVectors(value181, vectorFromAxisName3);
      (value182.lengthSq() < 0.00001 &&
        (value182.copy(new threeRuntime.Vector3(0, 1, 0).cross(vectorFromAxisName3)),
        value182.lengthSq() < 0.00001 &&
          value182.copy(new threeRuntime.Vector3(1, 0, 0).cross(vectorFromAxisName3))),
        (planeNormalWorld = new threeRuntime.Vector3().crossVectors(vectorFromAxisName3, value182).normalize()));
    }
    planeNormalWorld.lengthSq() < 0.000001 && (planeNormalWorld = new threeRuntime.Vector3(0, 1, 0));
    const dragPlane = new threeRuntime.Plane().setFromNormalAndCoplanarPoint(planeNormalWorld, pivot),
      value183 = this._resolvePointerRay(clientX, clientY),
      value184 = new threeRuntime.Vector3(),
      value185 = value183.ray.intersectPlane(dragPlane, value184),
      startPoint = value185 ? value184.clone() : pivot.clone();
    return {
      handleKey: handleKey2,
      mode: mode2.mode,
      constraint:
        mode2.mode === 'axis' ? mode2.axis : (mode2.linkedAxes || []).join(''),
      axisName: mode2.mode === 'axis' ? mode2.axis : null,
      axisWorld: mode2.mode === 'axis' ? vectorFromAxisName3.clone() : null,
      axis: mode2.mode === 'axis' ? vectorFromAxisName3.clone() : null,
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
    const constraint = this._gizmo?.handles?.get?.(handleKey3);
    if (!constraint || constraint.mode !== 'rotate') return null;
    const enabled34 = this._resolveGizmoContext(this._sceneState);
    if (!enabled34) return null;
    const pivot2 = this._gizmo.root.position.clone(),
      gizmoQuaternion2 = this._gizmo.root.quaternion.clone(),
      axisWorld = vectorFromAxisName(constraint.axis).applyQuaternion(gizmoQuaternion2).normalize(),
      dragPlane2 = new threeRuntime.Plane().setFromNormalAndCoplanarPoint(axisWorld, pivot2),
      value186 = this._resolvePointerRay(clientX2, clientY2),
      startPoint2 = new threeRuntime.Vector3(),
      enabled35 = value186.ray.intersectPlane(dragPlane2, startPoint2);
    if (!enabled35) return null;
    return (
      this._captureGizmoDragLock(enabled34),
      {
        handleKey: handleKey3,
        mode: 'rotate',
        constraint: constraint.axis,
        axisName: constraint.axis,
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
      startPoint: {
        x: x7.startPoint.x,
        y: x7.startPoint.y,
        z: x7.startPoint.z,
      },
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
    const mode3 = this._gizmo?.handles?.get?.(handleKey4);
    if (
      !mode3 ||
      (mode3.mode !== 'scale-axis' &&
        mode3.mode !== 'scale-plane' &&
        mode3.mode !== 'scale-uniform')
    )
      return null;
    const enabled36 = this._resolveGizmoContext(this._sceneState);
    if (!enabled36) return null;
    const pivot3 = this._gizmo.root.position.clone(),
      gizmoQuaternion3 = this._gizmo.root.quaternion.clone(),
      value187 = this._resolvePointerRay(clientX3, clientY3);
    if (mode3.mode === 'scale-plane' || mode3.mode === 'scale-uniform') {
      const value188 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        dragPlane3 = new threeRuntime.Plane().setFromNormalAndCoplanarPoint(value188, pivot3),
        startPoint3 = new threeRuntime.Vector3(),
        enabled37 = value187.ray.intersectPlane(dragPlane3, startPoint3);
      if (!enabled37) return null;
      return (
        this._captureGizmoDragLock(enabled36),
        {
          handleKey: handleKey4,
          mode: mode3.mode,
          constraint:
            mode3.mode === 'scale-uniform' ? 'xyz' : (mode3.linkedAxes || []).join(''),
          linkedAxes: Array.isArray(mode3.linkedAxes) ? [...mode3.linkedAxes] : [],
          pivot: pivot3.clone(),
          axisWorld: null,
          gizmoQuaternion: gizmoQuaternion3.clone(),
          dragPlane: dragPlane3,
          startPoint: startPoint3.clone(),
          startClientX: Number(clientX3) || 0,
          startClientY: Number(clientY3) || 0,
          referenceDistance: Math.max(0.25, startPoint3.distanceTo(pivot3)),
        }
      );
    }
    const axisWorld2 = vectorFromAxisName(mode3.axis).applyQuaternion(gizmoQuaternion3).normalize(),
      value189 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize();
    let value190 = new threeRuntime.Vector3().crossVectors(value189, axisWorld2);
    value190.lengthSq() < 0.00001 &&
      ((value190 = new threeRuntime.Vector3(0, 1, 0).cross(axisWorld2)),
      value190.lengthSq() < 0.00001 &&
        (value190 = new threeRuntime.Vector3(1, 0, 0).cross(axisWorld2)));
    const planeNormalWorld2 = new threeRuntime.Vector3().crossVectors(axisWorld2, value190).normalize(),
      dragPlane4 = new threeRuntime.Plane().setFromNormalAndCoplanarPoint(planeNormalWorld2, pivot3),
      startPoint4 = new threeRuntime.Vector3(),
      enabled38 = value187.ray.intersectPlane(dragPlane4, startPoint4);
    if (!enabled38) return null;
    this._captureGizmoDragLock(enabled36);
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
      constraint: mode3.axis,
      axisName: mode3.axis,
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
        startPoint: {
          x: startX.startPoint.x,
          y: startX.startPoint.y,
          z: startX.startPoint.z,
        },
        currentPoint: currentX,
        pivot: { x: startX.pivot.x, y: startX.pivot.y, z: startX.pivot.z },
        axis: {
          x: startX.axisWorld?.x ?? startX.axis?.x,
          y: startX.axisWorld?.y ?? startX.axis?.y,
          z: startX.axisWorld?.z ?? startX.axis?.z,
        },
        dragDirection: {
          x:
            startX.dragDirectionWorld?.x ??
            startX.axisWorld?.x ??
            startX.axis?.x,
          y:
            startX.dragDirectionWorld?.y ??
            startX.axisWorld?.y ??
            startX.axis?.y,
          z:
            startX.dragDirectionWorld?.z ??
            startX.axisWorld?.z ??
            startX.axis?.z,
        },
        referenceDistance: startX.referenceDistance,
      });
    }
    if (
      startX.mode === 'scale-uniform' &&
      Number.isFinite(Number(currentX.clientX)) &&
      Number.isFinite(Number(currentX.clientY))
    ) {
      const value191 = Number(currentX.clientX) - Number(startX.startClientX || 0),
        value192 = Number(startX.startClientY || 0) - Number(currentX.clientY);
      return Math.max(0.001, Math.exp((value192 + value191 * 0.35) / 180));
    }
    return computeUniformScaleFactor({
      startPoint: {
        x: startX.startPoint.x,
        y: startX.startPoint.y,
        z: startX.startPoint.z,
      },
      currentPoint: currentX,
      pivot: { x: startX.pivot.x, y: startX.pivot.y, z: startX.pivot.z },
      minDistance: startX.referenceDistance,
    });
  }
  ['sampleMoveGizmoDragPoint'](enabled39, clientX4, clientY4) {
    if (!enabled39?.dragPlane) return null;
    const value193 = this._resolvePointerRay(clientX4, clientY4),
      x8 = new threeRuntime.Vector3(),
      enabled40 = value193.ray.intersectPlane(enabled39.dragPlane, x8);
    if (!enabled40) return null;
    return {
      x: x8.x,
      y: x8.y,
      z: x8.z,
      clientX: clientX4,
      clientY: clientY4,
    };
  }
  ['computeMoveGizmoDelta'](x9, currentPoint2) {
    if (!x9?.startPoint || !currentPoint2) return null;
    const constrainedMoveDelta = computeConstrainedMoveDelta({
      startPoint: {
        x: x9.startPoint.x,
        y: x9.startPoint.y,
        z: x9.startPoint.z,
      },
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
  ['pick'](value194, value195) {
    if (this._isPanorama360Mode()) return null;
    if (!this._pickRoots.length) return null;
    const value196 = this._resolvePointerRay(value194, value195),
      value197 = value196.intersectObjects(this._pickRoots, false);
    for (const x10 of value197) {
      let value198 = x10.object;
      while (value198) {
        const args3 = this._pickMap.get(value198.id);
        if (args3)
          return {
            ...args3,
            point: { x: x10.point.x, y: x10.point.y, z: x10.point.z },
          };
        value198 = value198.parent;
      }
    }
    return null;
  }
  ['pickObjectsInRect'](box36) {
    if (this._isPanorama360Mode()) return [];
    const box37 = this.renderer.domElement.getBoundingClientRect(),
      list14 = [],
      handler5 = (list15, objectType3) => {
        list15.forEach((value199, objectId3) => {
          const value200 = new threeRuntime.Vector3();
          value199.group.getWorldPosition(value200);
          const depth = value200.clone().project(this.camera);
          if (
            depth.x < -1 ||
            depth.x > 1 ||
            depth.y < -1 ||
            depth.y > 1 ||
            depth.z < -1 ||
            depth.z > 1
          )
            return;
          const value201 = box37.left + (depth.x + 1) * 0.5 * box37.width,
            value202 = box37.top + (1 - depth.y) * 0.5 * box37.height;
          value201 >= box36.left &&
            value201 <= box36.right &&
            value202 >= box36.top &&
            value202 <= box36.bottom &&
            list14.push({ objectType: objectType3, objectId: objectId3, depth: depth.z });
        });
      };
    return (
      handler5(this._mannequinMap, 'mannequin'),
      handler5(this._cubeMap, 'cube'),
      handler5(this._cameraMap, 'camera'),
      list14.sort((value203, value204) => value203.depth - value204.depth),
      list14
    );
  }
  ['resolveDollyAnchor'](value205, value206) {
    if (this._isPanorama360Mode()) return null;
    const sceneView =
      this._draftView?.kind === 'scene-default'
        ? this._draftView.sceneView
        : this._sceneState?.viewport?.sceneView;
    return resolvePointerDollyAnchor({
      raycaster: this._resolvePointerRay(value205, value206),
      pickRoots: this._pickRoots,
      sceneView: sceneView,
      camera: this.camera,
    });
  }
  ['intersectGround'](value207, value208, value209 = 0) {
    if (this._isPanorama360Mode()) return null;
    const value210 = this._resolvePointerRay(value207, value208),
      value211 = new threeRuntime.Plane(new threeRuntime.Vector3(0, 1, 0), -value209),
      x11 = new threeRuntime.Vector3(),
      enabled41 = value210.ray.intersectPlane(value211, x11);
    if (!enabled41) return null;
    return { x: x11.x, y: x11.y, z: x11.z };
  }
  async ['_withCleanCaptureFrame'](handler6) {
    const list16 = [
        this._gizmo?.root,
        this._gizmoMoveGuideLine,
        ...Array.from(this._cameraMap.values()).map((value212) => value212?.group),
      ].filter(Boolean),
      list17 = list16.map((object3d) => ({ object3d: object3d, visible: object3d.visible })),
      list18 = [],
      value213 = (material10) => {
        if (!material10 || list18.some((value214) => value214.material === material10)) return;
        list18.push({
          material: material10,
          emissive: material10.emissive?.isColor ? material10.emissive.clone() : undefined,
          emissiveIntensity:
            typeof material10.emissiveIntensity === 'number' ? material10.emissiveIntensity : undefined,
          opacity: typeof material10.opacity === 'number' ? material10.opacity : undefined,
        });
      };
    (this._mannequinMap.forEach((value215) => {
      value215?.group?.traverse?.((value216) => eachMaterial(value216.material, value213));
    }),
      this._cubeMap.forEach((value217) => {
        value217?.group?.traverse?.((value218) => eachMaterial(value218.material, value213));
      }),
      list17.forEach(({ object3d: object3d2 }) => {
        object3d2.visible = false;
      }),
      this._mannequinMap.forEach((value219) =>
        applyObjectSelectionEmphasis(value219?.group, false),
      ),
      this._cubeMap.forEach((value220) => applyObjectSelectionEmphasis(value220?.group, false)));
    try {
      return await handler6();
    } finally {
      (list17.forEach(({ object3d: object3d3, visible: visible }) => {
        object3d3.visible = visible;
      }),
        list18.forEach(
          ({
            material: material11,
            emissive: emissive,
            emissiveIntensity: emissiveIntensity,
            opacity: opacity2,
          }) => {
            (emissive?.isColor &&
              material11.emissive?.isColor &&
              material11.emissive.copy(emissive),
              typeof emissiveIntensity === 'number' && (material11.emissiveIntensity = emissiveIntensity),
              typeof opacity2 === 'number' && (material11.opacity = opacity2),
              (material11.needsUpdate = true));
          },
        ),
        this.requestRender());
    }
  }
  ['captureBlob']({ includeEditorOverlays: includeEditorOverlays = true } = {}) {
    const run = () =>
      new Promise((handler7, handler8) => {
        this.renderNow();
        const value221 = this.renderer.domElement;
        if (typeof value221.toBlob === 'function') {
          value221.toBlob((enabled42) => {
            if (!enabled42) {
              handler8(new Error(panoramaSceneText('errors.captureExportFailed')));
              return;
            }
            handler7(enabled42);
          }, 'image/png');
          return;
        }
        try {
          const list19 = value221.toDataURL('image/png'),
            [, value222] = list19.split(','),
            type = list19.slice(list19.indexOf(':') + 1, list19.indexOf(';')),
            list20 = atob(value222 || ''),
            uint8Array = new Uint8Array(list20.length);
          for (let value223 = 0; value223 < list20.length; value223 += 1) {
            uint8Array[value223] = list20.charCodeAt(value223);
          }
          handler7(new Blob([uint8Array], { type: type || 'image/png' }));
        } catch (value224) {
          handler8(value224);
        }
      });
    if (includeEditorOverlays === false) return this._withCleanCaptureFrame(run);
    return run();
  }
  ['sync'](value225) {
    ((this._sceneState = value225),
      (this._sceneContentExtent = estimateSceneContentExtent(value225)),
      (this._sceneContentBounds = estimateSceneContentBounds(value225)));
    const value226 = this._isPanorama360Mode(value225);
    (this._syncEnvironment(value225?.environmentMode),
      this._syncPanorama(value225?.panorama),
      this._syncMannequins(value225, value226),
      this._syncCubes(value225, value226),
      this._syncCameras(value225, value226),
      this._syncGizmo(value225, value226),
      this._syncPanoramaModeVisibility(value226),
      this._syncPanoramaCanvasVisibility(value226),
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
    const enabled43 = this._isPanorama360Mode(this._sceneState),
      value227 = this._applyRenderView();
    (!enabled43 && this._syncInfiniteGrid(),
      this._applyDraftObjects(),
      !enabled43 && this._applyGizmoPosition(),
      this.renderer.render(this.scene, this.camera),
      value227?.keepAnimating && this.requestRender());
  }
  ['dispose']() {
    (this._rafId !== null && (cancelAnimationFrame(this._rafId), (this._rafId = null)),
      (this._panoramaLoadToken += 1),
      this._abortPanoramaTextureLoad(),
      this._cancelPanoramaFullLoad(),
      (this._smoothedPose = null),
      (this._lastRenderTime = 0),
      (this._viewSmoothingUntil = 0),
      this._mannequinMap.forEach((value228) => {
        (this.scene.remove(value228.group), disposeObject3D(value228.group));
      }),
      this._cubeMap.forEach((value229) => {
        (this.scene.remove(value229.group), disposeObject3D(value229.group));
      }),
      this._cameraMap.forEach((value230) => {
        (this.scene.remove(value230.group), disposeObject3D(value230.group));
      }),
      this._mannequinMap.clear(),
      this._mannequinStateById.clear(),
      this._draftMannequinBonePoses.clear(),
      this._cubeMap.clear(),
      this._cubeStateById.clear(),
      this._cameraMap.clear(),
      this._cameraStateById.clear(),
      this._visualOverrides.clear(),
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
  ['_syncEnvironment'](value231) {
    const value232 = value231 === 'night',
      themeColor = resolveThemeColor(
        value232 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
        value232 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
      );
    ((this.scene.background = null),
      this.renderer.setClearColor(0, 0),
      (this.scene.fog = this._isPanorama360Mode(this._sceneState)
        ? null
        : new threeRuntime.Fog(themeColor, value232 ? 46 : 58, value232 ? 138 : 0xaa)),
      (this._ambientLight.intensity = value232 ? 0.56 : 0.94),
      (this._keyLight.intensity = value232 ? 0.72 : 1.12),
      (this._rimLight.intensity = value232 ? 0.2 : 0.16),
      eachMaterial(this._gridMinor.material, (value233) => {
        ((value233.opacity = value232 ? 0.28 : 0.24),
          value233.color.copy(
            resolveThemeColor(
              value232 ? '--panorama-scene-grid-night' : '--panorama-scene-grid-day',
              value232 ? '--indigo-35' : '--black-20',
            ),
          ),
          (value233.needsUpdate = true));
      }),
      eachMaterial(this._gridMajor.material, (value234) => {
        ((value234.opacity = value232 ? 0.52 : 0.42),
          value234.color.copy(
            resolveThemeColor(
              value232 ? '--panorama-scene-grid-night-major' : '--panorama-scene-grid-day-major',
              value232 ? '--indigo-35' : '--black-20',
            ),
          ),
          (value234.needsUpdate = true));
      }),
      (this._ground.material.opacity = value232 ? 0.96 : 0.92),
      (this._ground.material.color = resolveThemeColor(
        value232 ? '--panorama-scene-ground-night' : '--panorama-scene-ground-day',
        value232 ? '--indigo-12' : '--black-10',
      )),
      (this._ground.material.needsUpdate = true));
  }
  ['_syncPanoramaModeVisibility'](enabled44) {
    ((this._gridMinor.visible = this._gridVisible !== false && !enabled44),
      (this._gridMajor.visible = this._gridVisible !== false && !enabled44),
      (this._ground.visible = this._groundFillVisible !== false && !enabled44));
    if (!enabled44) return;
    ((this._gizmo.root.visible = false),
      this.clearGizmoHandleState(),
      this._mannequinMap.forEach((value235) => {
        ((value235.group.visible = false), (value235.selectionRing.visible = false));
      }),
      this._cubeMap.forEach((value236) => {
        ((value236.group.visible = false), (value236.selectionRing.visible = false));
      }),
      this._cameraMap.forEach((value237) => {
        value237.group.visible = false;
      }),
      (this._panoramaSphere.visible = Boolean(this._panoramaSphere.material?.map)));
  }
  ['_syncPanoramaCanvasVisibility'](value238 = this._isPanorama360Mode(this._sceneState)) {
    const el2 = this.renderer?.domElement;
    if (!el2) return;
    const enabled45 = Boolean(this._panoramaSphere?.material?.map),
      value239 = value238 && !enabled45;
    ((el2.style.opacity = value239 ? '0' : '1'),
      (el2.style.background = 'transparent'),
      (el2.dataset.panoramaEmpty = value239 ? '1' : '0'));
  }
  ['_syncInfiniteGrid']() {
    const value240 = Number(this.camera?.position?.x) || 0,
      value241 = Number(this.camera?.position?.z) || 0,
      stableGridSnap = computeStableGridSnap(
        value240,
        GRID_MINOR_STEP,
        this._gridSnapState.minorX,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap2 = computeStableGridSnap(
        value241,
        GRID_MINOR_STEP,
        this._gridSnapState.minorZ,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap3 = computeStableGridSnap(
        value240,
        GRID_MAJOR_STEP,
        this._gridSnapState.majorX,
        GRID_SNAP_HYSTERESIS,
      ),
      stableGridSnap4 = computeStableGridSnap(
        value241,
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
    const value242 = Number(this._renderPose?.distance) || 0,
      value243 = Math.max(
        GRID_BASE_SPAN,
        Math.abs(Number(this.camera?.position?.y) || 0) * 26,
        value242 * 28,
      );
    (this._ground.position.set(stableGridSnap3, -0.001, stableGridSnap4),
      this._ground.scale.set(value243, value243, 1));
    const value244 = this._sceneState?.environmentMode === 'night',
      value245 = value244 ? 0.28 : 0.24,
      value246 = value244 ? 0.52 : 0.42,
      value247 = Math.abs(
        Number.isFinite(this._renderPose?.pitch)
          ? this._renderPose.pitch
          : Number(this.camera?.rotation?.x) || 0,
      ),
      clamp012 = clamp01((value247 - 0.08) / 0.32),
      value248 = 0.18 + 0.82 * clamp012,
      clamp013 = clamp01((value242 - 8) / 26),
      value249 = 1 - 0.52 * clamp013,
      value250 = value248 * value249,
      value251 = value245 * value250,
      value252 = value246 * (0.32 + 0.68 * value250);
    (eachMaterial(this._gridMinor.material, (value253) => {
      value253.opacity = value251;
    }),
      eachMaterial(this._gridMajor.material, (value254) => {
        value254.opacity = value252;
      }));
  }
  ['_syncPanorama'](value255) {
    const fullUrl2 = normalizePanoramaTextureUrl(value255?.imageUrl, value255?.localPath),
      panoramaTextureUrl = normalizePanoramaTextureUrl(value255?.previewImageUrl, null),
      enabled46 = fullUrl2 || panoramaTextureUrl;
    if (!enabled46) {
      ((this._panoramaLoadToken += 1),
        this._abortPanoramaTextureLoad(),
        this._cancelPanoramaFullLoad(),
        (this._panoramaSourceKey = ''),
        (this._loadedPanoramaUrl = ''),
        (this._pendingPanoramaUrl = ''));
      this._panoramaTexture && (this._panoramaTexture.dispose(), (this._panoramaTexture = null));
      ((this._panoramaSphere.material.map = null),
        (this._panoramaSphere.material.needsUpdate = true),
        (this._panoramaSphere.visible = false),
        this._syncPanoramaCanvasVisibility());
      return;
    }
    const value256 = panoramaTextureUrl + '\n' + fullUrl2;
    value256 !== this._panoramaSourceKey &&
      ((this._panoramaSourceKey = value256),
      (this._panoramaLoadToken += 1),
      this._abortPanoramaTextureLoad(),
      (this._pendingPanoramaUrl = ''),
      this._cancelPanoramaFullLoad());
    const token = this._panoramaLoadToken,
      value257 = Boolean(panoramaTextureUrl && panoramaTextureUrl !== fullUrl2);
    if (fullUrl2 && fullUrl2 === this._loadedPanoramaUrl) return;
    if (value257) {
      if (panoramaTextureUrl === this._loadedPanoramaUrl) {
        this._schedulePanoramaFullLoad(fullUrl2, token);
        return;
      }
      if (panoramaTextureUrl === this._pendingPanoramaUrl || fullUrl2 === this._pendingPanoramaUrl) return;
      this._loadPanoramaTexture(panoramaTextureUrl, { token: token, isPreview: true, fullUrl: fullUrl2 });
      return;
    }
    if (enabled46 === this._loadedPanoramaUrl || enabled46 === this._pendingPanoramaUrl) return;
    this._loadPanoramaTexture(enabled46, { token: token, isPreview: Boolean(panoramaTextureUrl), fullUrl: '' });
  }
  ['_loadPanoramaTexture'](
    value258,
    { token: token2, isPreview: isPreview = false, fullUrl: fullUrl = '' } = {},
  ) {
    return loadPanoramaBridgeTexture(this, value258, {
      token: token2,
      isPreview: isPreview,
      fullUrl: fullUrl,
    });
  }
  ['_abortPanoramaTextureLoad']() {
    abortPanoramaTextureLoad(this);
  }
  ['_schedulePanoramaFullLoad'](value259, value260) {
    schedulePanoramaFullLoad(this, value259, value260);
  }
  ['_cancelPanoramaFullLoad']() {
    cancelPanoramaFullLoad(this);
  }
  ['_resolveMannequinColor'](value261) {
    const value262 = PANORAMA_SCENE_COLOR_TOKENS[value261] || PANORAMA_SCENE_COLOR_TOKENS.blue;
    return /^#[0-9a-f]{6}$/i.test(String(value261 || '').trim())
      ? new threeRuntime.Color(value261)
      : resolveThemeColor(value262, '--blue');
  }
  ['_registerPickable'](value263, value264) {
    const run2 = (el3, value265 = true) => {
      if (!el3) return;
      const enabled47 = value265 && el3.visible !== false;
      if (!enabled47) return;
      el3.isMesh === true &&
        (this._pickMap.set(el3.id, value264), this._pickRoots.push(el3));
      for (const value266 of el3.children || []) run2(value266, enabled47);
    };
    run2(value263);
  }
  ['_rebuildPickRoots']() {
    (this._pickMap.clear(),
      (this._pickRoots = []),
      this._mannequinMap.forEach((value267, objectId4) => {
        this._registerPickable(value267.proxyRoot || value267.group, {
          objectType: 'mannequin',
          objectId: objectId4,
        });
      }),
      this._cubeMap.forEach((value268, objectId5) => {
        this._registerPickable(value268.group, { objectType: 'cube', objectId: objectId5 });
      }),
      this._cameraMap?.forEach((value269, objectId6) => {
        this._registerPickable(value269.group, { objectType: 'camera', objectId: objectId6 });
      }));
  }
  ['_loadCharacterModelForVisual'](style, value270, value271) {
    if (!style) return;
    const panoramaCharacterGender = resolvePanoramaCharacterGender(value271),
      value272 = (style.modelLoadToken || 0) + 1;
    ((style.modelLoadToken = value272),
      (style.modelGender = panoramaCharacterGender),
      (style.modelLoadError = null),
      setMannequinProxyMode(style),
      (style.modelStyle =
        this._mannequinStateById.get(value270)?.characterStyle || 'anatomical'),
      createPanoramaCharacterModelInstance(panoramaCharacterGender, { style: style.modelStyle })
        .then((value273) => {
          if (
            this._mannequinMap.get(value270) !== style ||
            style.modelLoadToken !== value272
          ) {
            disposeObject3D(value273);
            return;
          }
          style.modelRoot &&
            (style.group.remove(style.modelRoot), disposeObject3D(style.modelRoot));
          ((style.modelMaterial = null),
            (style.modelRoot = value273),
            (style.modelBodyProfileBase = captureCharacterModelBodyProfileBase(value273)),
            style.group.add(value273));
          const value274 = this._mannequinStateById.get(value270) || {};
          ((style.baseBonePose = capturePanoramaCharacterBoneBase(value273)),
            (style.appliedBonePoseSignature = JSON.stringify(value274.bonePose || {})),
            applyPanoramaCharacterBonePose(
              value273,
              this._draftMannequinBonePoses?.get(value270) || value274.bonePose,
              style.baseBonePose,
            ));
          const value275 = value274.colorKey;
          (applyCharacterClayMaterial(style, this._resolveMannequinColor(value275)),
            applyCharacterBodyProfile(style, value274.bodyProfile),
            setMannequinProxyMode(style),
            this._rebuildPickRoots());
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        })
        .catch((value276) => {
          if (
            this._mannequinMap.get(value270) !== style ||
            style.modelLoadToken !== value272
          )
            return;
          style.modelLoadError = value276 || new Error('Quaternius character model failed to load');
          style.modelRoot &&
            (style.group.remove(style.modelRoot),
            disposeObject3D(style.modelRoot),
            (style.modelRoot = null));
          ((style.modelMaterial = null),
            (style.modelBodyProfileBase = null),
            setMannequinProxyMode(style));
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        }));
  }
  ['_syncMannequins'](value277, enabled48 = false) {
    const list21 = value277?.mannequins || [],
      map5 = new Set(collectSelectedObjectIds(value277, 'mannequin')),
      value278 = !enabled48,
      map6 = new Set();
    list21.forEach((box38) => {
      (map6.add(box38.id), this._mannequinStateById.set(box38.id, box38));
      let mannequinVisual = this._mannequinMap.get(box38.id);
      if (!mannequinVisual)
        ((mannequinVisual = createMannequinVisual(this._resolveMannequinColor(box38.colorKey))),
          this._mannequinMap.set(box38.id, mannequinVisual),
          this.scene.add(mannequinVisual.group),
          this._loadCharacterModelForVisual(mannequinVisual, box38.id, box38.gender));
      else
        (mannequinVisual.modelGender !== resolvePanoramaCharacterGender(box38.gender) ||
          mannequinVisual.modelStyle !== (box38.characterStyle || 'anatomical')) &&
          (mannequinVisual.modelRoot &&
            (mannequinVisual.group.remove(mannequinVisual.modelRoot),
            disposeObject3D(mannequinVisual.modelRoot),
            (mannequinVisual.modelRoot = null)),
          (mannequinVisual.modelBodyProfileBase = null),
          this._loadCharacterModelForVisual(mannequinVisual, box38.id, box38.gender));
      const value279 = this._resolveMannequinColor(box38.colorKey);
      (mannequinVisual.material.color.copy(value279),
        mannequinVisual.headMaterial.color.copy(value279.clone().offsetHSL(0, 0, 0.08)),
        applyGenderShape(mannequinVisual, box38.gender),
        applyCharacterBodyProfile(mannequinVisual, box38.bodyProfile));
      const value280 = this._draftMannequinBonePoses?.get?.(box38.id),
        value281 = value280 || box38.bonePose || {},
        value282 = value280 ? 'draft:' + JSON.stringify(value281) : JSON.stringify(value281);
      mannequinVisual.modelRoot &&
        mannequinVisual.baseBonePose &&
        mannequinVisual.appliedBonePoseSignature !== value282 &&
        (applyPanoramaCharacterBonePose(mannequinVisual.modelRoot, value281, mannequinVisual.baseBonePose),
        (mannequinVisual.appliedBonePoseSignature = value282));
      const box39 = this._draftObjects.get('mannequin:' + box38.id);
      (applyGroupTransform(mannequinVisual.group, box39 || box38),
        (mannequinVisual.group.position.y =
          box39?.position?.y ?? box38.position.y ?? 0),
        applyGroupScale(mannequinVisual.group, box39?.scale ?? box38.scale ?? 1));
      const value283 =
        value278 &&
        value277?.ui?.isEditing === true &&
        value277?.ui?.showOutline !== false &&
        map5.has(box38.id);
      ((mannequinVisual.group.visible = value278),
        (mannequinVisual.selectionRing.visible = false),
        setMannequinProxyMode(mannequinVisual),
        applyCharacterClayMaterial(mannequinVisual, value279),
        applySelectionEmphasis(mannequinVisual.material, value283, 0.18),
        applySelectionEmphasis(mannequinVisual.headMaterial, value283, 0.26),
        applyObjectSelectionEmphasis(mannequinVisual.modelRoot, value283, 0.12));
    });
    for (const [value284, value285] of this._mannequinMap.entries()) {
      if (map6.has(value284)) continue;
      (this.scene.remove(value285.group),
        disposeObject3D(value285.group),
        this._mannequinMap.delete(value284),
        this._mannequinStateById.delete(value284),
        this._draftMannequinBonePoses?.delete?.(value284));
    }
    if (this._pickMap) this._rebuildPickRoots();
  }
  ['_syncCubes'](value286, enabled49 = false) {
    const list22 = value286?.cubes || [],
      map7 = new Set(collectSelectedObjectIds(value286, 'cube')),
      value287 = !enabled49,
      map8 = new Set();
    list22.forEach((box40) => {
      (map8.add(box40.id), this._cubeStateById.set(box40.id, box40));
      let sceneAssetVisual = this._cubeMap.get(box40.id);
      const sceneAsset = resolveSceneAsset(box40.assetId),
        value288 = this._resolveMannequinColor(box40.colorKey || sceneAsset?.colorKey),
        value289 = (value290) =>
          /^#[0-9a-f]{6}$/i.test(String(box40.colorKey || '').trim())
            ? value288
            : this._resolveMannequinColor(value290);
      (!sceneAssetVisual || sceneAssetVisual.assetId !== sceneAsset?.id) &&
        (sceneAssetVisual && (this.scene.remove(sceneAssetVisual.group), disposeObject3D(sceneAssetVisual.group)),
        (sceneAssetVisual = createSceneAssetVisual(sceneAsset, value288, value289)),
        this._cubeMap.set(box40.id, sceneAssetVisual),
        this.scene.add(sceneAssetVisual.group));
      applySceneAssetColors(sceneAssetVisual, value288, value289);
      const value291 = this._draftObjects.get('cube:' + box40.id),
        box41 = value291 || box40;
      (applyGroupTransform(sceneAssetVisual.group, box41),
        (sceneAssetVisual.group.position.y = Number(box41?.position?.y) || 0),
        applyGroupScale(sceneAssetVisual.group, box41?.scale ?? box40?.scale ?? 1));
      const value292 =
        value287 &&
        value286?.ui?.isEditing === true &&
        value286?.ui?.showOutline !== false &&
        map7.has(box40.id);
      ((sceneAssetVisual.group.visible = value287),
        (sceneAssetVisual.selectionRing.visible = false),
        sceneAssetVisual.materialsByColorKey.forEach((value293) => {
          applySelectionEmphasis(value293, value292, 0.22);
        }),
        sceneAssetVisual.edgeMaterialsByColorKey.forEach((value294) => {
          value294.opacity = value292 ? 1 : 0.78;
        }));
    });
    for (const [value295, value296] of this._cubeMap.entries()) {
      if (map8.has(value295)) continue;
      (this.scene.remove(value296.group),
        disposeObject3D(value296.group),
        this._cubeMap.delete(value295),
        this._cubeStateById.delete(value295));
    }
    this._rebuildPickRoots();
  }
  ['_syncCameras'](value297, enabled50 = false) {
    const list23 = Array.isArray(value297?.cameras) ? value297.cameras : [],
      value298 =
        value297?.viewport?.activeView === 'camera' && value297?.viewport?.activeCameraId
          ? String(value297.viewport.activeCameraId)
          : null,
      value299 =
        this._draftView?.kind === 'camera' && this._draftView?.cameraId
          ? String(this._draftView.cameraId)
          : null,
      map9 = new Set(collectSelectedObjectIds(value297, 'camera')),
      value300 =
        !enabled50 &&
        list23.some((enabled51) => {
          if (!enabled51?.id) return false;
          const cameraPoseData3 = normalizeCameraPoseData(enabled51),
            sceneViewFromReference = cameraPoseToSceneViewFromReference(cameraPoseData3, value297?.viewport?.sceneView);
          return areSceneViewsEquivalent(value297?.viewport?.sceneView, sceneViewFromReference);
        }),
      enabled52 = Boolean(value298 || value299 || value300),
      map10 = new Set();
    list23.forEach((enabled53) => {
      if (!enabled53?.id) return;
      const value301 = String(enabled53.id);
      (map10.add(value301), this._cameraStateById.set(value301, enabled53));
      let cameraVisual = this._cameraMap.get(value301);
      !cameraVisual &&
        ((cameraVisual = createCameraVisual()),
        this._cameraMap.set(value301, cameraVisual),
        this.scene.add(cameraVisual.group));
      const value302 = this._draftObjects?.get?.('camera:' + value301),
        cameraPoseData4 = normalizeCameraPoseData(value302 || enabled53);
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
        ));
      const value303 = map9.has(value301);
      ((cameraVisual.group.visible = !enabled50 && (!enabled52 || value303)),
        (cameraVisual.bodyMaterial.opacity = value303 ? 1 : 0.8),
        (cameraVisual.helperLineMaterial.opacity = value303 ? 1 : 0.8));
    });
    for (const [value304, value305] of this._cameraMap.entries()) {
      if (map10.has(value304)) continue;
      (this.scene.remove(value305.group),
        disposeObject3D(value305.group),
        this._cameraMap.delete(value304),
        this._cameraStateById.delete(value304));
    }
    if (this._pickMap) this._rebuildPickRoots();
  }
  ['_resolveGizmoContext'](value306) {
    const list24 = collectSelectedObjects(value306);
    if (list24.length === 0) return null;
    const activeTransformTool = resolveActiveTransformTool(value306),
      selectedObjects = list24.map((objectType4) => ({
        objectType: objectType4.objectType,
        id: objectType4.objectId,
        item:
          this._draftObjects.get(objectType4.objectType + ':' + objectType4.objectId) ||
          this._getObjectStateByObjectType(objectType4.objectType, objectType4.objectId),
        visual: this._getVisualByObjectType(objectType4.objectType, objectType4.objectId),
      })).filter((enabled54) => !!enabled54.visual && !!enabled54.item);
    if (selectedObjects.length === 0) return null;
    selectedObjects.forEach((value307) => {
      ((value307.pivotWorld = resolveObjectToolPivot(
        value307.item,
        value307.visual,
        activeTransformTool,
        value307.objectType,
      )),
        (value307.orientationQuaternion = resolveObjectOrientationQuaternion(
          value307.item,
          value307.visual,
        )));
    });
    const value308 =
        value306?.selection?.selectedObjectType === 'cube' ||
        value306?.selection?.selectedObjectType === 'mannequin' ||
        value306?.selection?.selectedObjectType === 'camera'
          ? value306.selection.selectedObjectType
          : null,
      value309 = value306?.selection?.selectedObjectId || null,
      value310 =
        value309 && value308
          ? selectedObjects.find(
              (value311) => value311.objectType === value308 && value311.id === value309,
            ) || null
          : null,
      activeEntry = value310 || selectedObjects[0],
      pivot4 = new threeRuntime.Vector3(),
      isMultiSelection2 = selectedObjects.length > 1;
    if (isMultiSelection2)
      (selectedObjects.forEach((value312) => {
        pivot4.add(value312.pivotWorld);
      }),
        pivot4.multiplyScalar(1 / selectedObjects.length));
    else activeEntry?.pivotWorld && pivot4.copy(activeEntry.pivotWorld);
    const bounds = isMultiSelection2
        ? measureVisualBoundsForSelection(selectedObjects) || createFallbackBounds()
        : measureVisualBounds(activeEntry.visual) || createFallbackBounds(),
      gizmoWorldMetrics = computeGizmoWorldMetrics(bounds, pivot4),
      { orientationQuaternion: orientationQuaternion3, usesLocalOrientation: usesLocalOrientation } =
        resolveSelectionGizmoOrientation(selectedObjects, activeEntry, isMultiSelection2),
      selectedObjectType = activeEntry?.objectType || null,
      selectedIds = selectedObjects.filter((value313) => value313.objectType === selectedObjectType).map(
        (value314) => value314.id,
      );
    return {
      selectedObjectType: selectedObjectType,
      selectedIds: selectedIds,
      selectedObjects: selectedObjects.map((objectType5) => ({
        objectType: objectType5.objectType,
        objectId: objectType5.id,
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
  ['_computeWorldUnitsPerPixelAt'](enabled55) {
    if (!enabled55 || !this.camera?.position) return 0;
    const value315 = Math.max(
      1,
      Number(this.renderer?.domElement?.clientHeight) ||
        Number(this.renderer?.domElement?.height) ||
        1,
    );
    return scene3dViewProjection.computeScene3DWorldUnitsPerPixel(this.camera, value315, enabled55);
  }
  ['_computeScreenConstantGizmoScale'](value316, value317 = 104) {
    const count2 = this._computeWorldUnitsPerPixelAt(value316);
    if (!(count2 > 0)) return 1;
    return Math.max(0.35, Math.min(6, count2 * value317));
  }
  ['_captureGizmoDragLock'](box42) {
    if (!this._gizmo || !box42) return null;
    const position2 = this._gizmo.root.position.clone(),
      orientationQuaternion4 = this._gizmo.root.quaternion.clone(),
      bounds2 = {
        box: box42.bounds?.box?.clone?.() || createFallbackBounds().box,
        size: box42.bounds?.size?.clone?.() || new threeRuntime.Vector3(1, 1, 1),
        sphere: box42.bounds?.sphere
          ? new threeRuntime.Sphere(
              box42.bounds.sphere.center?.clone?.() || new threeRuntime.Vector3(),
              Number(box42.bounds.sphere.radius) || 0,
            )
          : new threeRuntime.Sphere(new threeRuntime.Vector3(0, 0.5, 0), Math.sqrt(0.75)),
        extents: {
          x: Number(box42.bounds?.extents?.x) || 0,
          y: Number(box42.bounds?.extents?.y) || 0,
          z: Number(box42.bounds?.extents?.z) || 0,
        },
      },
      gizmoWorldMetrics2 = {
        extents: {
          x: Number(box42.gizmoWorldMetrics?.extents?.x) || 0,
          y: Number(box42.gizmoWorldMetrics?.extents?.y) || 0,
          z: Number(box42.gizmoWorldMetrics?.extents?.z) || 0,
        },
        maxExtent: Number(box42.gizmoWorldMetrics?.maxExtent) || 0.01,
        sphereRadius: Number(box42.gizmoWorldMetrics?.sphereRadius) || 0.01,
        margin: Number(box42.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
      },
      context = {
        ...box42,
        position: position2,
        pivot: box42.pivot?.clone?.() || position2.clone(),
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
  ['_applyGizmoLayoutFromContext'](value318, value319) {
    const enabled56 = this._gizmo?.baseLayout,
      enabled57 = value318?.gizmoWorldMetrics;
    if (!enabled56 || !enabled57) return;
    const x12 = enabled57.extents,
      value320 = enabled57.margin,
      value321 = Math.max(0.01, Number(enabled57.maxExtent) || 0.01),
      value322 = Math.max(0.001, Number(value319) || 1),
      value323 = GIZMO_MOVE_HEAD_LENGTH * 0.5,
      value324 = GIZMO_SCALE_HEAD_SIZE * 0.5,
      value325 = GIZMO_MOVE_PICK_LENGTH - GIZMO_BASE_AXIS_LENGTH,
      value326 = GIZMO_SCALE_PICK_LENGTH - GIZMO_BASE_SCALE_LENGTH,
      value327 = {
        x: x12.x + value320,
        y: x12.y + value320,
        z: x12.z + value320,
      };
    (['x', 'y', 'z'].forEach((value328) => {
      const value329 = this._gizmo?.moveAxes?.[value328],
        value330 = this._gizmo?.scaleAxes?.[value328],
        value331 = Math.max(enabled56.axisLength, value327[value328] / value322),
        value332 = Math.max(GIZMO_MOVE_SHAFT_LENGTH, value331 - value323),
        value333 = Math.max(GIZMO_MOVE_PICK_LENGTH, value331 + value325);
      value329?.shaftLine && setAxisLineEnd(value329.shaftLine, value328, value332);
      value329?.headMesh && setAxisHandleLayout(value329.headMesh, value331 - value323, value323);
      value329?.pickMesh &&
        (setAxisHandleLayout(value329.pickMesh, value333 * 0.5),
        value329.pickMesh.scale.set(1, value333 / GIZMO_MOVE_PICK_LENGTH, 1));
      const value334 = enabled56.scaleLength,
        value335 = Math.max(GIZMO_SCALE_SHAFT_LENGTH, value334 - value324),
        value336 = Math.max(GIZMO_SCALE_PICK_LENGTH, value334 + value326);
      (value330?.shaftLine && setAxisLineEnd(value330.shaftLine, value328, value335),
        value330?.headMesh &&
          setAxisHandleLayout(value330.headMesh, value334 - value324, value324),
        value330?.pickMesh &&
          (setAxisHandleLayout(value330.pickMesh, value336 * 0.5),
          value330.pickMesh.scale.set(1, value336 / GIZMO_SCALE_PICK_LENGTH, 1)));
    }),
      ['x', 'y', 'z'].forEach((value337) => {
        const value338 = this._gizmo?.rotateRings?.[value337];
        if (value338?.group) value338.group.scale.setScalar(1);
      }));
    const value339 = Math.max(enabled56.planeOffset * 0.5, value320 * 0.42),
      value340 = Math.max(enabled56.planeOffset, (x12.x + value339) / value322),
      value341 = Math.max(enabled56.planeOffset, (x12.y + value339) / value322),
      value342 = Math.max(enabled56.planeOffset, (x12.z + value339) / value322),
      value343 = enabled56.planeSize * 0.86,
      value344 = Math.max(enabled56.planeSize * 1.2, (value321 / value322) * 0.32),
      handler9 = (value345, value346) =>
        Math.max(value343, Math.min(value344, Math.min(value345, value346) * 0.34)),
      value347 = handler9(value340, value341),
      value348 = handler9(value340, value342),
      value349 = handler9(value341, value342),
      value350 = Math.max(enabled56.planeSize * 0.18, value320 * 0.28) / value322,
      handler10 = (
        enabled58,
        value351,
        value352,
        value353,
        value354,
        value355 = 1,
        value356 = 1,
      ) => {
        if (!enabled58) return;
        const value357 = value354 / Math.max(0.001, enabled56.planeSize);
        (enabled58.visualGroup &&
          (enabled58.visualGroup.position.set(value351, value352, value353),
          enabled58.visualGroup.scale.set(value355 * value357, value356 * value357, value357)),
          enabled58.pickMesh &&
            (enabled58.pickMesh.position.set(value351, value352, value353),
            enabled58.pickMesh.scale.setScalar(value357)));
      },
      handler11 = (value358, value359) => {
        const value360 = value358?.[value359 + 'xy'];
        value360 && handler10(value360, value340, value341, value350, value347, 1, 1);
        const value361 = value358?.[value359 + 'xz'];
        value361 && handler10(value361, value340, value350, value342, value348, 1, 1);
        const value362 = value358?.[value359 + 'yz'];
        value362 && handler10(value362, value350, value341, value342, value349, 1, 1);
      };
    (handler11(this._gizmo?.planeHandles, 'plane-'),
      handler11(this._gizmo?.scalePlaneHandles, 'scale-plane-'));
  }
  ['_applyGizmoOrientationFromContext'](enabled59, value363 = 'local') {
    if (!this._gizmo?.root?.quaternion) return;
    if (!enabled59) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    const enabled60 = this._gizmo?.currentTool === 'scale' || value363 === 'local';
    if (!enabled60) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (enabled59.isMultiSelection && enabled59.usesLocalOrientation !== true) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (enabled59.orientationQuaternion) {
      this._gizmo.root.quaternion.copy(enabled59.orientationQuaternion);
      return;
    }
    this._gizmo.root.quaternion.identity();
  }
  ['_syncGizmo'](enabled61, value364 = false) {
    if (value364 || enabled61?.mode !== 'scene') {
      ((this._gizmo.root.visible = false),
        this._clearStableGizmoContext(),
        this.clearGizmoHandleState());
      return;
    }
    if (!enabled61?.ui?.isEditing) {
      ((this._gizmo.root.visible = false),
        this._clearStableGizmoContext(),
        this.clearGizmoHandleState());
      return;
    }
    const activeTransformTool2 = resolveActiveTransformTool(enabled61);
    ((this._gizmo.currentTool = activeTransformTool2),
      (this._gizmo.root.visible =
        activeTransformTool2 === 'move' || activeTransformTool2 === 'rotate' || activeTransformTool2 === 'scale'));
    if (!this._gizmo.root.visible) {
      (this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const transformSelectionSignature3 = buildTransformSelectionSignature(enabled61);
    if (!transformSelectionSignature3) {
      ((this._gizmo.root.visible = false),
        this._clearStableGizmoContext(),
        this.clearGizmoHandleState());
      return;
    }
    const value365 = this._resolveGizmoContext(enabled61),
      enabled62 = value365 || this._resolveStableGizmoContext(enabled61);
    if (!enabled62) {
      ((this._gizmo.root.visible = false), this.clearGizmoHandleState());
      return;
    }
    (value365 && this._cacheStableGizmoContext(enabled61, value365),
      (this._gizmo.moveGroup.visible = activeTransformTool2 === 'move'),
      (this._gizmo.rotateGroup.visible = activeTransformTool2 === 'rotate'),
      (this._gizmo.scaleGroup.visible = activeTransformTool2 === 'scale'),
      this._gizmo.root.position.copy(enabled62.position),
      this._applyGizmoOrientationFromContext(enabled62, enabled61?.ui?.transformSpace),
      this._applyGizmoHighlight());
  }
  ['_applyGizmoPosition']() {
    if (!this._sceneState?.ui?.isEditing) return;
    if (!this._gizmo.root.visible) return;
    const box43 = this._gizmo.dragLock;
    if (box43) {
      (this._gizmo.root.position.copy(box43.position),
        this._gizmo.root.quaternion.copy(box43.orientationQuaternion),
        this._gizmo.root.scale.setScalar(box43.scale),
        this._applyGizmoLayoutFromContext(box43.context, box43.scale));
      return;
    }
    const value366 = this._resolveGizmoContext(this._sceneState),
      enabled63 = value366 || this._resolveStableGizmoContext(this._sceneState);
    if (!enabled63) return;
    value366 && this._cacheStableGizmoContext(this._sceneState, value366);
    (this._gizmo.root.position.copy(enabled63.position),
      this._applyGizmoOrientationFromContext(enabled63, this._sceneState?.ui?.transformSpace));
    const value367 = this._computeScreenConstantGizmoScale(enabled63.position);
    (this._gizmo.root.scale.setScalar(value367),
      this._applyGizmoLayoutFromContext(enabled63, value367));
  }
  ['_applyGizmoHighlight']() {
    const value368 = this._gizmo?.hoverHandle || null,
      value369 = this._gizmo?.activeHandle || null,
      handler12 = (enabled64) => {
        const value370 = new Set();
        if (!enabled64) return value370;
        value370.add(enabled64);
        const value371 = this._gizmo?.handles?.get?.(enabled64) || null;
        return (
          value371?.mode === 'plane' &&
            (value371.linkedAxes || []).forEach((value372) => {
              if (value372) value370.add('axis-' + value372);
            }),
          value370
        );
      },
      map11 = handler12(value369),
      map12 = handler12(value368);
    this._gizmo?.handles?.forEach((value373, value374) => {
      const enabled65 = map11.has(value374),
        value375 = !enabled65 && map12.has(value374),
        value376 = enabled65 ? 0.52 : value375 ? 0.3 : 0,
        value377 = enabled65 ? 1 : value375 ? 0.92 : 0.8;
      (value373.visuals || []).forEach((value378) => {
        const enabled66 = value378?.material,
          enabled67 = value378?.color;
        if (!enabled66?.color || !enabled67) return;
        (enabled66.color.copy(enabled67).lerp(new threeRuntime.Color(0xffffff), value376),
          typeof value378.opacity === 'number' &&
            'opacity' in enabled66 &&
            (enabled66.opacity = value378.opacity * value377),
          (enabled66.needsUpdate = true));
      });
    });
  }
  ['_applyRenderView']() {
    const value379 = this._resolveTargetRenderPose(),
      value380 = performance.now(),
      enabled68 = this._shouldSmoothTargetPose(value379, value380),
      value381 = enabled68 ? this._applyPoseSmoothing(value379, value380) : cloneRenderPose(value379),
      keepAnimating = enabled68 && measurePoseDistance(value381, value379) > POSE_SETTLE_EPSILON;
    return (
      (!enabled68 || !keepAnimating) &&
        ((this._smoothedPose = cloneRenderPose(value379)), (this._lastRenderTime = value380)),
      (this._renderPose = value381),
      this._commitCameraFromPose(value381),
      { keepAnimating: keepAnimating }
    );
  }
  ['_resolveTargetRenderPose']() {
    const value382 = this._sceneState,
      value383 = this._draftView,
      value384 = this._isPanorama360Mode(value382);
    let panoramaViewPose;
    if (value384) {
      const value385 =
        value383?.kind === 'panorama-default'
          ? value383.panoramaView || value382?.viewport?.panoramaView
          : value382?.viewport?.panoramaView;
      panoramaViewPose = resolvePanoramaViewPose(value385, { x: 0, y: 0, z: 0 });
    } else {
      if (value383?.kind === 'camera') {
        const position3 = normalizeCameraPoseData(value383);
        panoramaViewPose = {
          kind: 'camera',
          position: position3.position,
          quaternion: position3.quaternion,
          rotation: position3.rotation,
          fov: position3.fov,
        };
      } else {
        if (value383?.kind === 'scene-default')
          panoramaViewPose = resolveSceneCameraPose(
            value383.sceneView || value382.viewport.sceneView,
            Number.isFinite(Number(value383.fov))
              ? Number(value383.fov)
              : focalLengthToFov(this._defaultSceneFocalLength),
          );
        else {
          if (value383?.kind === 'panorama-default')
            panoramaViewPose = resolvePanoramaViewPose(
              value383.panoramaView || value382.viewport.panoramaView,
            );
          else {
            if (value382.mode === 'panorama')
              panoramaViewPose = resolvePanoramaViewPose(value382.viewport.panoramaView);
            else
              value382?.viewport?.activeView === 'camera' &&
              value382?.viewport?.activeCameraId
                ? (panoramaViewPose = resolveSceneCameraPose(
                    value382.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ))
                : (panoramaViewPose = resolveSceneCameraPose(
                    value382.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ));
          }
        }
      }
    }
    return panoramaViewPose;
  }
  ['_shouldSmoothTargetPose'](enabled69, value386 = performance.now()) {
    if (this._draftView?.disableSmoothing === true) return false;
    if (!enabled69 || enabled69.kind === 'camera') return false;
    if (value386 <= (this._viewSmoothingUntil || 0)) return true;
    if (!this._smoothedPose || this._smoothedPose.kind !== enabled69.kind) return false;
    return measurePoseDistance(this._smoothedPose, enabled69) > POSE_SETTLE_EPSILON;
  }
  ['_applyPoseSmoothing'](event6, value387 = performance.now()) {
    if (!this._smoothedPose || this._smoothedPose.kind !== event6.kind)
      return (
        (this._smoothedPose = cloneRenderPose(event6)),
        (this._lastRenderTime = value387),
        cloneRenderPose(event6)
      );
    const value388 = Math.min(
      VIEW_DAMPING_MAX_DT_MS,
      Math.max(0, value387 - (this._lastRenderTime || value387)),
    );
    this._lastRenderTime = value387;
    const event7 = this._smoothedPose;
    if (event6.kind === 'panorama-default')
      return (
        (event7.position.x = dampScalar(
          event7.position.x,
          event6.position.x,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.position.y = dampScalar(
          event7.position.y,
          event6.position.y,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.position.z = dampScalar(
          event7.position.z,
          event6.position.z,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.yaw = dampAngle(
          event7.yaw,
          event6.yaw,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.pitch = dampScalar(
          event7.pitch,
          event6.pitch,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (event7.fov = dampScalar(
          event7.fov,
          event6.fov,
          value388,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        cloneRenderPose(event7)
      );
    return (
      (event7.position.x = dampScalar(
        event7.position.x,
        event6.position.x,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.position.y = dampScalar(
        event7.position.y,
        event6.position.y,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.position.z = dampScalar(
        event7.position.z,
        event6.position.z,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.x = dampScalar(
        event7.target.x,
        event6.target.x,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.y = dampScalar(
        event7.target.y,
        event6.target.y,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.target.z = dampScalar(
        event7.target.z,
        event6.target.z,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.fov = dampScalar(
        event7.fov,
        event6.fov,
        value388,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (event7.yaw = event6.yaw),
      (event7.pitch = event6.pitch),
      (event7.distance = event6.distance),
      cloneRenderPose(event7)
    );
  }
  ['_commitCameraFromPose'](event8) {
    if (!event8) return;
    const value389 = event8?.kind === 'panorama-default' ? 55 : 58;
    if (scene3dViewProjection.applyBridgeCameraProjection(this, event8, value389)) return;
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
      const box44 = forwardVectorFromYawPitch(event8.yaw, event8.pitch);
      (this.camera.position.set(0, 0, 0),
        this.camera.lookAt(box44.x, box44.y, box44.z));
      return;
    }
    (this.camera.position.set(
      event8.position.x,
      event8.position.y,
      event8.position.z,
    ),
      this.camera.lookAt(event8.target.x, event8.target.y, event8.target.z));
  }
  ['_applyDraftObjects']() {
    if (!this._sceneState) return;
    (this._mannequinMap.forEach((value390, value391) => {
      const box45 = this._mannequinStateById.get(value391);
      if (!box45) return;
      const value392 = this._draftObjects.get('mannequin:' + value391),
        box46 = value392 || box45;
      (applyGroupTransform(value390.group, box46),
        (value390.group.position.y = Number(box46?.position?.y) || 0),
        applyGroupScale(value390.group, box46?.scale ?? box45?.scale ?? 1));
    }),
      this._cubeMap.forEach((value393, value394) => {
        const box47 = this._cubeStateById.get(value394);
        if (!box47) return;
        const value395 = this._draftObjects.get('cube:' + value394),
          box48 = value395 || box47;
        (applyGroupTransform(value393.group, box48),
          (value393.group.position.y = Number(box48?.position?.y) || 0),
          applyGroupScale(value393.group, box48?.scale ?? box47?.scale ?? 1));
      }),
      this._cameraMap.forEach((value396, value397) => {
        const enabled70 = this._cameraStateById.get(value397);
        if (!enabled70) return;
        const value398 = this._draftObjects.get('camera:' + value397);
        applyGroupTransform(value396.group, value398 || enabled70);
      }));
  }
  ['_getObjectStateByObjectType'](value399, value400) {
    if (value399 === 'cube') return this._cubeStateById.get(value400) || null;
    if (value399 === 'mannequin') return this._mannequinStateById.get(value400) || null;
    if (value399 === 'camera') return this._cameraStateById.get(value400) || null;
    return null;
  }
  ['_getVisualByObjectType'](value401, value402) {
    const value403 = this._visualOverrides?.get?.(value401 + ':' + value402);
    if (value403) return value403;
    if (value401 === 'cube') return this._cubeMap.get(value402);
    if (value401 === 'mannequin') return this._mannequinMap.get(value402);
    if (value401 === 'camera') return this._cameraMap.get(value402);
    return null;
  }
}
