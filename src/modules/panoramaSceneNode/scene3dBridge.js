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
function panoramaSceneText(_0x2a7b3f, _0x3a4688 = {}) {
  return t('panoramaSceneNode.' + _0x2a7b3f, _0x3a4688);
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
function createLineGeometry(_0x5af297, _0x46cdcd) {
  return new threeRuntime['BufferGeometry']().setFromPoints([_0x5af297, _0x46cdcd]);
}
function setLineGeometryPoints(_0x549247, _0x5bfe72, _0x493fa0) {
  if (!_0x549247?.geometry) return;
  const _0x486438 = _0x5bfe72?.isVector3 ? _0x5bfe72 : toVector3Like(_0x5bfe72),
    _0x84296e = _0x493fa0?.isVector3 ? _0x493fa0 : toVector3Like(_0x493fa0),
    _0x134435 = _0x549247.geometry.getAttribute('position');
  if (!_0x134435 || _0x134435.count < 2) {
    (_0x549247.geometry.dispose?.(), (_0x549247.geometry = createLineGeometry(_0x486438, _0x84296e)));
    return;
  }
  (_0x134435.setXYZ(0, _0x486438.x, _0x486438.y, _0x486438.z),
    _0x134435.setXYZ(1, _0x84296e.x, _0x84296e.y, _0x84296e.z),
    (_0x134435.needsUpdate = true),
    _0x549247.geometry.computeBoundingSphere?.(),
    _0x549247.geometry.computeBoundingBox?.());
}
function configureGizmoMaterial(_0x443f51, { transparent: transparent = false, opacity: opacity = 1 } = {}) {
  if (!_0x443f51) return _0x443f51;
  _0x443f51.transparent = transparent;
  if ('opacity' in _0x443f51) _0x443f51.opacity = opacity;
  return (
    (_0x443f51.depthWrite = false),
    (_0x443f51.depthTest = false),
    (_0x443f51.toneMapped = false),
    (_0x443f51.fog = false),
    _0x443f51
  );
}
function configureGizmoObject(_0x45d1c0) {
  if (!_0x45d1c0) return _0x45d1c0;
  return ((_0x45d1c0.frustumCulled = false), (_0x45d1c0.renderOrder = 100), _0x45d1c0);
}
function orientAxisHead(_0x4cb16e, _0x4464ad) {
  if (!_0x4cb16e) return;
  _0x4cb16e.rotation.set(0, 0, 0);
  if (_0x4464ad === 'x') _0x4cb16e.rotation.z = -Math.PI / 2;
  if (_0x4464ad === 'z') _0x4cb16e.rotation.x = Math.PI / 2;
}
function setAxisLineEnd(_0x2172ce, _0x203b8a, _0x46bd15) {
  if (!_0x2172ce?.geometry) return;
  const _0x2e440b = vectorFromAxisName(_0x203b8a),
    _0x50a24c = Math.max(0, Number(_0x46bd15) || 0),
    _0x5ed683 = _0x2172ce.geometry.getAttribute('position');
  if (!_0x5ed683 || _0x5ed683.count < 2) return;
  (_0x5ed683.setXYZ(0, 0, 0, 0),
    _0x5ed683.setXYZ(1, _0x2e440b.x * _0x50a24c, _0x2e440b.y * _0x50a24c, _0x2e440b.z * _0x50a24c),
    (_0x5ed683.needsUpdate = true),
    _0x2172ce.geometry.computeBoundingSphere?.(),
    _0x2172ce.geometry.computeBoundingBox?.());
}
function setAxisHandleLayout(_0x54ea0f, _0x335532, _0x5a03b5 = 0) {
  if (!_0x54ea0f) return;
  const _0x2edeab = _0x54ea0f.userData?.axisName || _0x54ea0f.axisName;
  if (!_0x2edeab) return;
  const _0x1adae4 = vectorFromAxisName(_0x2edeab),
    _0x5e91e1 = Math.max(0, Number(_0x335532) || 0),
    _0x5116aa = Number(_0x5a03b5) || 0;
  _0x54ea0f.position.copy(_0x1adae4.multiplyScalar(_0x5e91e1 + _0x5116aa));
}
function createMoveAxis(_0x4a337b, _0x538c41) {
  const _0x596344 = _0x4a337b.isColor ? _0x4a337b.clone() : new threeRuntime.Color(_0x4a337b),
    _0x78174f = vectorFromAxisName(_0x538c41),
    _0xff7881 = new threeRuntime['Group']();
  configureGizmoObject(_0xff7881);
  const _0x5862ca = configureGizmoMaterial(
      new threeRuntime.LineBasicMaterial({ color: _0x596344.clone(), transparent: true, opacity: 0.96 }),
      { transparent: true, opacity: 0.96 },
    ),
    _0x2f238b = new threeRuntime['Line'](
      createLineGeometry(
        new threeRuntime['Vector3'](0, 0, 0),
        _0x78174f.clone().multiplyScalar(GIZMO_MOVE_SHAFT_LENGTH),
      ),
      _0x5862ca,
    );
  (configureGizmoObject(_0x2f238b), _0xff7881.add(_0x2f238b));
  const _0x1367fd = configureGizmoMaterial(
      new threeRuntime.MeshBasicMaterial({ color: _0x596344.clone(), transparent: true, opacity: 0.98 }),
      { transparent: true, opacity: 0.98 },
    ),
    _0x4f6beb = new threeRuntime['Mesh'](
      new threeRuntime['ConeGeometry'](0.06, GIZMO_MOVE_HEAD_LENGTH, 14),
      _0x1367fd,
    );
  ((_0x4f6beb.userData.axisName = _0x538c41),
    setAxisHandleLayout(
      _0x4f6beb,
      GIZMO_BASE_AXIS_LENGTH - GIZMO_MOVE_HEAD_LENGTH * 0.5,
      GIZMO_MOVE_HEAD_LENGTH * 0.5,
    ),
    orientAxisHead(_0x4f6beb, _0x538c41),
    configureGizmoObject(_0x4f6beb),
    _0xff7881.add(_0x4f6beb));
  const _0x237bce = new threeRuntime['Mesh'](
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
    (_0x237bce.userData.axisName = _0x538c41),
    setAxisHandleLayout(_0x237bce, GIZMO_MOVE_PICK_LENGTH * 0.5),
    orientAxisHead(_0x237bce, _0x538c41),
    configureGizmoObject(_0x237bce),
    _0xff7881.add(_0x237bce),
    {
      axisName: _0x538c41,
      axis: _0x78174f.clone(),
      group: _0xff7881,
      shaftLine: _0x2f238b,
      headMesh: _0x4f6beb,
      visuals: [
        { material: _0x5862ca, color: _0x596344.clone(), opacity: 1 },
        { material: _0x1367fd, color: _0x596344.clone(), opacity: 1 },
      ],
      pickMesh: _0x237bce,
    }
  );
}
function createScaleAxis(_0x131201, _0x34bf5f) {
  const _0x38cc64 = _0x131201.isColor ? _0x131201.clone() : new threeRuntime['Color'](_0x131201),
    _0x34ae70 = vectorFromAxisName(_0x34bf5f),
    _0x36f2bc = new threeRuntime['Group']();
  configureGizmoObject(_0x36f2bc);
  const _0x124013 = configureGizmoMaterial(
      new threeRuntime['LineBasicMaterial']({ color: _0x38cc64.clone(), transparent: true, opacity: 0.96 }),
      { transparent: true, opacity: 0.96 },
    ),
    _0x22f7e4 = new threeRuntime.Line(
      createLineGeometry(
        new threeRuntime['Vector3'](0, 0, 0),
        _0x34ae70.clone().multiplyScalar(GIZMO_SCALE_SHAFT_LENGTH),
      ),
      _0x124013,
    );
  (configureGizmoObject(_0x22f7e4), _0x36f2bc.add(_0x22f7e4));
  const _0x183306 = configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({ color: _0x38cc64.clone(), transparent: true, opacity: 0.98 }),
      { transparent: true, opacity: 0.98 },
    ),
    _0x2658f5 = new threeRuntime.Mesh(
      new threeRuntime['BoxGeometry'](GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE, GIZMO_SCALE_HEAD_SIZE),
      _0x183306,
    );
  ((_0x2658f5.userData.axisName = _0x34bf5f),
    setAxisHandleLayout(
      _0x2658f5,
      GIZMO_BASE_SCALE_LENGTH - GIZMO_SCALE_HEAD_SIZE * 0.5,
      GIZMO_SCALE_HEAD_SIZE * 0.5,
    ),
    orientAxisHead(_0x2658f5, _0x34bf5f),
    configureGizmoObject(_0x2658f5),
    _0x36f2bc.add(_0x2658f5));
  const _0x4c7013 = new threeRuntime['Mesh'](
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
    (_0x4c7013.userData.axisName = _0x34bf5f),
    setAxisHandleLayout(_0x4c7013, GIZMO_SCALE_PICK_LENGTH * 0.5),
    orientAxisHead(_0x4c7013, _0x34bf5f),
    configureGizmoObject(_0x4c7013),
    _0x36f2bc.add(_0x4c7013),
    {
      axisName: _0x34bf5f,
      axis: _0x34ae70.clone(),
      group: _0x36f2bc,
      shaftLine: _0x22f7e4,
      headMesh: _0x2658f5,
      visuals: [
        { material: _0x124013, color: _0x38cc64.clone(), opacity: 1 },
        { material: _0x183306, color: _0x38cc64.clone(), opacity: 1 },
      ],
      pickMesh: _0x4c7013,
    }
  );
}
function createRotateRing(_0x5bc253, _0x164412) {
  const _0x548eee = _0x5bc253.isColor ? _0x5bc253.clone() : new threeRuntime['Color'](_0x5bc253),
    _0x51a365 = new threeRuntime['Group']();
  configureGizmoObject(_0x51a365);
  const _0x39a15a = configureGizmoMaterial(
      new threeRuntime['MeshBasicMaterial']({
        color: _0x548eee.clone(),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0.86 },
    ),
    _0x1baf57 = new threeRuntime['Mesh'](
      new threeRuntime.TorusGeometry(GIZMO_BASE_ROTATE_RADIUS, 0.016, 8, 64),
      _0x39a15a,
    );
  if (_0x164412 === 'x') _0x1baf57.rotation.y = Math.PI / 2;
  else _0x164412 === 'y' && (_0x1baf57.rotation.x = Math.PI / 2);
  (configureGizmoObject(_0x1baf57), _0x51a365.add(_0x1baf57));
  const _0x405073 = new threeRuntime['Mesh'](
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
    _0x405073.rotation.copy(_0x1baf57.rotation),
    configureGizmoObject(_0x405073),
    _0x51a365.add(_0x405073),
    {
      axisName: _0x164412,
      group: _0x51a365,
      visuals: [{ material: _0x39a15a, color: _0x548eee.clone(), opacity: 0.9 }],
      pickMesh: _0x405073,
    }
  );
}
function getPlaneCornerMetrics(_0x480525 = GIZMO_BASE_PLANE_SIZE, _0x1224ee = 0) {
  const _0x24a38e = _0x480525 * 0.56,
    _0x5809b0 = Math.max(_0x480525 * 0.065, 0.012),
    _0x515593 = _0x480525 * 0.06,
    _0x1be83a = _0x480525 * 0.5 - _0x515593,
    _0x67f4ca = _0x1be83a - _0x24a38e,
    _0x385f96 = (_0x1be83a + _0x67f4ca) * 0.5,
    _0x5a8df0 = _0x5809b0 * 0.5 + _0x1224ee,
    _0x41973d = _0x24a38e * 0.46 - _0x1224ee * 0.35;
  return {
    armLength: _0x24a38e,
    armThickness: _0x5809b0,
    cornerInset: _0x515593,
    outer: _0x1be83a,
    inner: _0x67f4ca,
    armCenter: _0x385f96,
    halfThickness: _0x5a8df0,
    diagonalStart: Math.max(_0x67f4ca, _0x67f4ca + _0x41973d),
    diagonalEnd: Math.max(_0x67f4ca, _0x67f4ca + _0x41973d),
  };
}
function createPlaneCornerPickGeometry(_0x4da2a2 = GIZMO_BASE_PLANE_SIZE) {
  const _0x4066df = Math.max(_0x4da2a2 * 0.018, 0.006),
    _0x3525c4 = getPlaneCornerMetrics(_0x4da2a2, _0x4066df),
    _0x3c0bc9 = new threeRuntime.Shape();
  return (
    _0x3c0bc9.moveTo(_0x3525c4.inner - _0x4066df, _0x3525c4.outer + _0x3525c4.halfThickness),
    _0x3c0bc9.lineTo(_0x3525c4.outer + _0x3525c4.halfThickness, _0x3525c4.outer + _0x3525c4.halfThickness),
    _0x3c0bc9.lineTo(_0x3525c4.outer + _0x3525c4.halfThickness, _0x3525c4.inner - _0x4066df),
    _0x3c0bc9.lineTo(_0x3525c4.outer - _0x3525c4.halfThickness, _0x3525c4.inner - _0x4066df),
    _0x3c0bc9.lineTo(_0x3525c4.outer - _0x3525c4.halfThickness, _0x3525c4.diagonalEnd - _0x4066df),
    _0x3c0bc9.lineTo(_0x3525c4.diagonalStart - _0x4066df, _0x3525c4.outer - _0x3525c4.halfThickness),
    _0x3c0bc9.lineTo(_0x3525c4.inner - _0x4066df, _0x3525c4.outer - _0x3525c4.halfThickness),
    _0x3c0bc9.closePath(),
    new threeRuntime.ShapeGeometry(_0x3c0bc9)
  );
}
function createPlaneCornerVisual(
  { horizontalColor: _0x4d9254, verticalColor: _0x2055e0 } = {},
  _0x231cff = GIZMO_BASE_PLANE_SIZE,
) {
  const _0x37d48b = _0x4d9254?.isColor
      ? _0x4d9254.clone()
      : _0x4d9254
        ? new threeRuntime['Color'](_0x4d9254)
        : resolveThemeColor('--white', '--white'),
    _0xffe608 = _0x2055e0?.isColor
      ? _0x2055e0.clone()
      : _0x2055e0
        ? new threeRuntime.Color(_0x2055e0)
        : resolveThemeColor('--white', '--white'),
    _0x4df37d = new threeRuntime['Group']();
  configureGizmoObject(_0x4df37d);
  const _0x2ae40b = getPlaneCornerMetrics(_0x231cff),
    _0x5739a4 = [],
    _0x4c802a = _0x37d48b.clone().lerp(_0xffe608, 0.5),
    _0x18663a = (_0x8f584, _0x41cdda, _0x134d4e, _0xcad6bf, _0xb777d) => {
      const _0x2c872f = configureGizmoMaterial(
          new threeRuntime['MeshBasicMaterial']({
            color: _0xb777d.clone(),
            transparent: true,
            opacity: 0.98,
            side: threeRuntime.DoubleSide,
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.98 },
        ),
        _0x173a73 = new threeRuntime['Mesh'](new threeRuntime.PlaneGeometry(_0x8f584, _0x41cdda), _0x2c872f);
      (_0x173a73.position.set(_0x134d4e, _0xcad6bf, 0),
        configureGizmoObject(_0x173a73),
        _0x4df37d.add(_0x173a73),
        _0x5739a4.push({ material: _0x2c872f, color: _0xb777d.clone(), opacity: 0.98 }));
    };
  (_0x18663a(_0x2ae40b.armLength, _0x2ae40b.armThickness, _0x2ae40b.armCenter, _0x2ae40b.outer, _0x37d48b),
    _0x18663a(_0x2ae40b.armThickness, _0x2ae40b.armLength, _0x2ae40b.outer, _0x2ae40b.armCenter, _0xffe608));
  {
    const _0x525919 = configureGizmoMaterial(
        new threeRuntime.MeshBasicMaterial({
          color: _0x4c802a.clone(),
          transparent: true,
          opacity: 0.98,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.98 },
      ),
      _0x3ad915 = new threeRuntime['Mesh'](
        new threeRuntime['PlaneGeometry'](_0x2ae40b.armThickness, _0x2ae40b.armThickness),
        _0x525919,
      );
    (_0x3ad915.position.set(_0x2ae40b.outer, _0x2ae40b.outer, 0),
      configureGizmoObject(_0x3ad915),
      _0x4df37d.add(_0x3ad915),
      _0x5739a4.push({ material: _0x525919, color: _0x4c802a.clone(), opacity: 0.98 }));
  }
  {
    const _0x1c78f8 = configureGizmoMaterial(
        new threeRuntime['MeshBasicMaterial']({
          color: _0x4c802a,
          transparent: true,
          opacity: 0.38,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.38 },
      ),
      _0x4e0837 = new threeRuntime.BufferGeometry(),
      _0x496994 = _0x2ae40b.armThickness * 0.5;
    (_0x4e0837.setAttribute(
      'position',
      new threeRuntime['Float32BufferAttribute'](
        [
          _0x2ae40b.diagonalStart,
          _0x2ae40b.outer - _0x496994,
          0,
          _0x2ae40b.outer - _0x496994,
          _0x2ae40b.outer - _0x496994,
          0,
          _0x2ae40b.outer - _0x496994,
          _0x2ae40b.diagonalEnd,
          0,
        ],
        3,
      ),
    ),
      _0x4e0837.setIndex([0, 1, 2]),
      _0x4e0837.computeVertexNormals());
    const _0x1a1e69 = new threeRuntime['Mesh'](_0x4e0837, _0x1c78f8);
    (configureGizmoObject(_0x1a1e69),
      _0x4df37d.add(_0x1a1e69),
      _0x5739a4.push({ material: _0x1c78f8, color: _0x4c802a.clone(), opacity: 0.38 }));
  }
  return { group: _0x4df37d, visuals: _0x5739a4 };
}
function createGizmoVisual() {
  const _0x5510fe = resolveThemeColor('--red', '--red'),
    _0x50ffac = resolveThemeColor('--green', '--green'),
    _0x2657be = resolveThemeColor('--blue', '--blue'),
    _0x1bcc1a = new threeRuntime['Group']();
  ((_0x1bcc1a.visible = false), configureGizmoObject(_0x1bcc1a));
  const _0x38274b = new threeRuntime['Group'](),
    _0x114664 = new Map(),
    _0x5f5550 = [],
    _0x87f2e8 = {},
    _0x25bc69 = {},
    _0x1bf185 = {},
    _0x27b81d = {},
    _0x99aafd = {},
    _0x33da9c = createMoveAxis(_0x5510fe, 'x'),
    _0x2e258d = createMoveAxis(_0x50ffac, 'y'),
    _0x13982e = createMoveAxis(_0x2657be, 'z');
  (_0x38274b.add(_0x33da9c.group),
    _0x38274b.add(_0x2e258d.group),
    _0x38274b.add(_0x13982e.group),
    (_0x87f2e8.x = _0x33da9c),
    (_0x87f2e8.y = _0x2e258d),
    (_0x87f2e8.z = _0x13982e),
    _0x114664.set('axis-x', { key: 'axis-x', mode: 'axis', axis: 'x', visuals: _0x33da9c.visuals }),
    _0x114664.set('axis-y', { key: 'axis-y', mode: 'axis', axis: 'y', visuals: _0x2e258d.visuals }),
    _0x114664.set('axis-z', { key: 'axis-z', mode: 'axis', axis: 'z', visuals: _0x13982e.visuals }),
    (_0x33da9c.pickMesh.userData.gizmoHandleKey = 'axis-x'),
    (_0x2e258d.pickMesh.userData.gizmoHandleKey = 'axis-y'),
    (_0x13982e.pickMesh.userData.gizmoHandleKey = 'axis-z'),
    _0x5f5550.push(_0x33da9c.pickMesh, _0x2e258d.pickMesh, _0x13982e.pickMesh));
  const _0x11b81a = ({
    key: _0x359213,
    group: _0x26776d,
    handleStore: _0x7df7c3,
    mode: mode = 'plane',
    normalAxis: _0x7d00c9,
    offset: _0x5cb0dc,
    horizontalColor: _0x45cbb5,
    verticalColor: _0x469931,
    linkedAxes: _0x4cc086,
    rotation: _0x54d1b9,
  }) => {
    const { group: _0x18a6b0, visuals: _0x28f128 } = createPlaneCornerVisual(
        { horizontalColor: _0x45cbb5, verticalColor: _0x469931 },
        GIZMO_BASE_PLANE_SIZE,
      ),
      _0x428b20 = configureGizmoMaterial(
        new threeRuntime['MeshBasicMaterial']({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: threeRuntime.DoubleSide,
          depthWrite: false,
        }),
        { transparent: true, opacity: 0 },
      ),
      _0xfc932b = new threeRuntime['Mesh'](createPlaneCornerPickGeometry(GIZMO_BASE_PLANE_SIZE), _0x428b20);
    (_0x18a6b0.position.copy(_0x5cb0dc),
      _0xfc932b.position.copy(_0x5cb0dc),
      _0x54d1b9?.x && ((_0x18a6b0.rotation.x = _0x54d1b9.x), (_0xfc932b.rotation.x = _0x54d1b9.x)),
      _0x54d1b9?.y && ((_0x18a6b0.rotation.y = _0x54d1b9.y), (_0xfc932b.rotation.y = _0x54d1b9.y)),
      _0x54d1b9?.z && ((_0x18a6b0.rotation.z = _0x54d1b9.z), (_0xfc932b.rotation.z = _0x54d1b9.z)),
      configureGizmoObject(_0x18a6b0),
      configureGizmoObject(_0xfc932b),
      (_0xfc932b.userData.gizmoHandleKey = _0x359213),
      _0x26776d.add(_0x18a6b0),
      _0x26776d.add(_0xfc932b),
      _0x114664.set(_0x359213, {
        key: _0x359213,
        mode: mode,
        normalAxis: _0x7d00c9,
        linkedAxes: Array.isArray(_0x4cc086) ? [..._0x4cc086] : [],
        visuals: _0x28f128,
      }),
      _0x5f5550.push(_0xfc932b),
      (_0x7df7c3[_0x359213] = { visualGroup: _0x18a6b0, pickMesh: _0xfc932b }));
  };
  (_0x11b81a({
    key: 'plane-xy',
    group: _0x38274b,
    handleStore: _0x27b81d,
    normalAxis: 'z',
    offset: new threeRuntime.Vector3(0.38, 0.38, 0),
    horizontalColor: _0x2657be,
    verticalColor: _0x2657be,
    linkedAxes: ['x', 'y'],
    rotation: null,
  }),
    _0x11b81a({
      key: 'plane-xz',
      group: _0x38274b,
      handleStore: _0x27b81d,
      normalAxis: 'y',
      offset: new threeRuntime.Vector3(0.38, 0, 0.38),
      horizontalColor: _0x50ffac,
      verticalColor: _0x50ffac,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math.PI / 2, z: -Math.PI / 2 },
    }),
    _0x11b81a({
      key: 'plane-yz',
      group: _0x38274b,
      handleStore: _0x27b81d,
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor: _0x5510fe,
      verticalColor: _0x5510fe,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math.PI / 2, z: Math.PI / 2 },
    }),
    _0x1bcc1a.add(_0x38274b));
  const _0x3e25c7 = new threeRuntime['Group'](),
    _0xcebf7c = createRotateRing(_0x5510fe, 'x'),
    _0x4fc00f = createRotateRing(_0x50ffac, 'y'),
    _0x17017d = createRotateRing(_0x2657be, 'z');
  (_0x3e25c7.add(_0xcebf7c.group),
    _0x3e25c7.add(_0x4fc00f.group),
    _0x3e25c7.add(_0x17017d.group),
    (_0x1bf185.x = _0xcebf7c),
    (_0x1bf185.y = _0x4fc00f),
    (_0x1bf185.z = _0x17017d),
    _0x114664.set('rotate-x', { key: 'rotate-x', mode: 'rotate', axis: 'x', visuals: _0xcebf7c.visuals }),
    _0x114664.set('rotate-y', { key: 'rotate-y', mode: 'rotate', axis: 'y', visuals: _0x4fc00f.visuals }),
    _0x114664.set('rotate-z', { key: 'rotate-z', mode: 'rotate', axis: 'z', visuals: _0x17017d.visuals }),
    (_0xcebf7c.pickMesh.userData.gizmoHandleKey = 'rotate-x'),
    (_0x4fc00f.pickMesh.userData.gizmoHandleKey = 'rotate-y'),
    (_0x17017d.pickMesh.userData.gizmoHandleKey = 'rotate-z'),
    _0x5f5550.push(_0xcebf7c.pickMesh, _0x4fc00f.pickMesh, _0x17017d.pickMesh),
    _0x1bcc1a.add(_0x3e25c7));
  const _0x3f6c4a = new threeRuntime['Group'](),
    _0x125fac = createScaleAxis(_0x5510fe, 'x'),
    _0x3895e2 = createScaleAxis(_0x50ffac, 'y'),
    _0x356e5a = createScaleAxis(_0x2657be, 'z');
  return (
    _0x3f6c4a.add(_0x125fac.group),
    _0x3f6c4a.add(_0x3895e2.group),
    _0x3f6c4a.add(_0x356e5a.group),
    (_0x25bc69.x = _0x125fac),
    (_0x25bc69.y = _0x3895e2),
    (_0x25bc69.z = _0x356e5a),
    _0x114664.set('scale-x', { key: 'scale-x', mode: 'scale-axis', axis: 'x', visuals: _0x125fac.visuals }),
    _0x114664.set('scale-y', { key: 'scale-y', mode: 'scale-axis', axis: 'y', visuals: _0x3895e2.visuals }),
    _0x114664.set('scale-z', { key: 'scale-z', mode: 'scale-axis', axis: 'z', visuals: _0x356e5a.visuals }),
    (_0x125fac.pickMesh.userData.gizmoHandleKey = 'scale-x'),
    (_0x3895e2.pickMesh.userData.gizmoHandleKey = 'scale-y'),
    (_0x356e5a.pickMesh.userData.gizmoHandleKey = 'scale-z'),
    _0x5f5550.push(_0x125fac.pickMesh, _0x3895e2.pickMesh, _0x356e5a.pickMesh),
    _0x11b81a({
      key: 'scale-plane-xy',
      group: _0x3f6c4a,
      handleStore: _0x99aafd,
      mode: 'scale-uniform',
      normalAxis: 'z',
      offset: new threeRuntime['Vector3'](0.38, 0.38, 0),
      horizontalColor: _0x2657be,
      verticalColor: _0x2657be,
      linkedAxes: ['x', 'y'],
      rotation: null,
    }),
    _0x11b81a({
      key: 'scale-plane-xz',
      group: _0x3f6c4a,
      handleStore: _0x99aafd,
      mode: 'scale-uniform',
      normalAxis: 'y',
      offset: new threeRuntime.Vector3(0.38, 0, 0.38),
      horizontalColor: _0x50ffac,
      verticalColor: _0x50ffac,
      linkedAxes: ['x', 'z'],
      rotation: { x: -Math.PI / 2, z: -Math.PI / 2 },
    }),
    _0x11b81a({
      key: 'scale-plane-yz',
      group: _0x3f6c4a,
      handleStore: _0x99aafd,
      mode: 'scale-uniform',
      normalAxis: 'x',
      offset: new threeRuntime['Vector3'](0, 0.38, 0.38),
      horizontalColor: _0x5510fe,
      verticalColor: _0x5510fe,
      linkedAxes: ['y', 'z'],
      rotation: { y: Math.PI / 2, z: Math.PI / 2 },
    }),
    _0x1bcc1a.add(_0x3f6c4a),
    {
      root: _0x1bcc1a,
      moveGroup: _0x38274b,
      rotateGroup: _0x3e25c7,
      scaleGroup: _0x3f6c4a,
      handles: _0x114664,
      pickMeshes: _0x5f5550,
      hoverHandle: null,
      activeHandle: null,
      dragLock: null,
      currentTool: 'move',
      moveAxes: _0x87f2e8,
      scaleAxes: _0x25bc69,
      rotateRings: _0x1bf185,
      planeHandles: _0x27b81d,
      scalePlaneHandles: _0x99aafd,
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
function eachMaterial(_0x5a896c, _0xc3959) {
  if (!_0x5a896c) return;
  if (Array.isArray(_0x5a896c)) {
    _0x5a896c.forEach((_0x3b3147) => _0xc3959(_0x3b3147));
    return;
  }
  _0xc3959(_0x5a896c);
}
function createMannequinVisual(_0x260062) {
  const _0x44a944 = new threeRuntime['Group'](),
    _0x688f0a = new threeRuntime['Group']();
  _0x44a944.add(_0x688f0a);
  const _0x32c26c = [],
    _0x3df959 = new threeRuntime['MeshStandardMaterial']({
      color: _0x260062,
      roughness: 0.62,
      metalness: 0.08,
    }),
    _0x1238a2 = _0x3df959.clone();
  _0x1238a2.color = _0x3df959.color.clone().offsetHSL(0, 0, 0.08);
  const _0x5dcc27 = new threeRuntime['Mesh'](new threeRuntime.SphereGeometry(0.155, 18, 16), _0x1238a2);
  ((_0x5dcc27.position.y = 1.7),
    _0x5dcc27.scale.set(0.96, 1.08, 0.94),
    _0x688f0a.add(_0x5dcc27),
    _0x32c26c.push(_0x5dcc27));
  const _0x5a6e4e = new threeRuntime.Mesh(
    new threeRuntime['CylinderGeometry'](0.052, 0.064, 0.12, 12),
    _0x3df959,
  );
  ((_0x5a6e4e.position.y = 1.51), _0x688f0a.add(_0x5a6e4e), _0x32c26c.push(_0x5a6e4e));
  const _0x2da694 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.17, 0.42, 6, 12),
    _0x3df959,
  );
  ((_0x2da694.position.y = 1.26),
    _0x2da694.scale.set(1.38, 1.02, 0.92),
    _0x688f0a.add(_0x2da694),
    _0x32c26c.push(_0x2da694));
  const _0x233e02 = new threeRuntime.Mesh(new threeRuntime.CapsuleGeometry(0.105, 0.18, 5, 10), _0x3df959);
  ((_0x233e02.position.y = 0.98),
    _0x233e02.scale.set(1.02, 0.94, 0.86),
    _0x688f0a.add(_0x233e02),
    _0x32c26c.push(_0x233e02));
  const _0x43abd7 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.14, 0.2, 5, 12),
    _0x3df959,
  );
  ((_0x43abd7.position.y = 0.77),
    _0x43abd7.scale.set(1.28, 0.96, 0.98),
    _0x688f0a.add(_0x43abd7),
    _0x32c26c.push(_0x43abd7));
  const _0x3a810d = new threeRuntime['Mesh'](new threeRuntime['SphereGeometry'](0.07, 12, 12), _0x3df959);
  (_0x3a810d.position.set(-0.31, 1.43, 0), _0x688f0a.add(_0x3a810d), _0x32c26c.push(_0x3a810d));
  const _0x48ffe5 = _0x3a810d.clone();
  ((_0x48ffe5.position.x = 0.31), _0x688f0a.add(_0x48ffe5), _0x32c26c.push(_0x48ffe5));
  const _0x366672 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.048, 0.28, 4, 10),
    _0x3df959,
  );
  (_0x366672.position.set(-0.39, 1.17, 0),
    (_0x366672.rotation.z = 0.16),
    (_0x366672.rotation.x = 0.03),
    _0x688f0a.add(_0x366672),
    _0x32c26c.push(_0x366672));
  const _0x1b145a = _0x366672.clone();
  ((_0x1b145a.position.x = 0.39),
    (_0x1b145a.rotation.z = -0.16),
    (_0x1b145a.rotation.x = -0.03),
    _0x688f0a.add(_0x1b145a),
    _0x32c26c.push(_0x1b145a));
  const _0x169902 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.038, 0.26, 4, 10),
    _0x3df959,
  );
  (_0x169902.position.set(-0.42, 0.86, 0.01),
    (_0x169902.rotation.z = 0.03),
    (_0x169902.rotation.x = 0.04),
    _0x688f0a.add(_0x169902),
    _0x32c26c.push(_0x169902));
  const _0x5d6880 = _0x169902.clone();
  ((_0x5d6880.position.x = 0.42),
    (_0x5d6880.rotation.z = -0.03),
    (_0x5d6880.rotation.x = -0.04),
    _0x688f0a.add(_0x5d6880),
    _0x32c26c.push(_0x5d6880));
  const _0x4df25e = new threeRuntime['Mesh'](new threeRuntime['SphereGeometry'](0.048, 10, 10), _0x3df959);
  (_0x4df25e.position.set(-0.425, 0.62, 0.01),
    _0x4df25e.scale.set(0.9, 1, 0.72),
    _0x688f0a.add(_0x4df25e),
    _0x32c26c.push(_0x4df25e));
  const _0x2195b2 = _0x4df25e.clone();
  ((_0x2195b2.position.x = 0.425), _0x688f0a.add(_0x2195b2), _0x32c26c.push(_0x2195b2));
  const _0xc1e9fd = new threeRuntime.Mesh(new threeRuntime.CapsuleGeometry(0.072, 0.34, 5, 12), _0x3df959);
  (_0xc1e9fd.position.set(-0.12, 0.47, 0),
    (_0xc1e9fd.rotation.z = 0.03),
    _0x688f0a.add(_0xc1e9fd),
    _0x32c26c.push(_0xc1e9fd));
  const _0x1ba723 = _0xc1e9fd.clone();
  ((_0x1ba723.position.x = 0.12),
    (_0x1ba723.rotation.z = -0.03),
    _0x688f0a.add(_0x1ba723),
    _0x32c26c.push(_0x1ba723));
  const _0x53ac74 = new threeRuntime['Mesh'](
    new threeRuntime['CapsuleGeometry'](0.055, 0.34, 5, 12),
    _0x3df959,
  );
  (_0x53ac74.position.set(-0.12, 0.03, 0.01), _0x688f0a.add(_0x53ac74), _0x32c26c.push(_0x53ac74));
  const _0x4692cc = _0x53ac74.clone();
  ((_0x4692cc.position.x = 0.12), _0x688f0a.add(_0x4692cc), _0x32c26c.push(_0x4692cc));
  const _0x2e285c = new threeRuntime['Mesh'](new threeRuntime['BoxGeometry'](0.115, 0.075, 0.27), _0x3df959);
  (_0x2e285c.position.set(-0.12, -0.19, 0.07),
    (_0x2e285c.rotation.x = -0.08),
    _0x688f0a.add(_0x2e285c),
    _0x32c26c.push(_0x2e285c));
  const _0xbb48c0 = _0x2e285c.clone();
  ((_0xbb48c0.position.x = 0.12), _0x688f0a.add(_0xbb48c0), _0x32c26c.push(_0xbb48c0));
  const _0x31cd64 = createSelectionRing(0x7db4ff);
  return (
    _0x44a944.add(_0x31cd64),
    {
      group: _0x44a944,
      material: _0x3df959,
      headMaterial: _0x1238a2,
      selectionRing: _0x31cd64,
      proxyRoot: _0x688f0a,
      fallbackObjects: _0x32c26c,
      modelGender: null,
      modelLoadToken: 0,
      modelRoot: null,
      parts: {
        head: _0x5dcc27,
        neck: _0x5a6e4e,
        chest: _0x2da694,
        waist: _0x233e02,
        pelvis: _0x43abd7,
        shoulders: [_0x3a810d, _0x48ffe5],
        upperArms: [_0x366672, _0x1b145a],
        lowerArms: [_0x169902, _0x5d6880],
        hands: [_0x4df25e, _0x2195b2],
        upperLegs: [_0xc1e9fd, _0x1ba723],
        lowerLegs: [_0x53ac74, _0x4692cc],
        feet: [_0x2e285c, _0xbb48c0],
      },
    }
  );
}
function createCubeVisual(_0x14987f) {
  const _0x275dd3 = new threeRuntime.Group(),
    _0x4fd079 = new threeRuntime['MeshStandardMaterial']({
      color: _0x14987f,
      roughness: 0.42,
      metalness: 0.06,
    }),
    _0x33a6d5 = new threeRuntime['LineBasicMaterial']({
      color: new threeRuntime['Color'](_0x14987f).clone().offsetHSL(0, 0, -0.18),
      transparent: true,
      opacity: 0.9,
    }),
    _0xe2adda = new threeRuntime['Mesh'](new threeRuntime.BoxGeometry(1, 1, 1), _0x4fd079);
  _0x275dd3.add(_0xe2adda);
  const _0x1fd4af = new threeRuntime['LineSegments'](
    new threeRuntime['EdgesGeometry'](new threeRuntime.BoxGeometry(1, 1, 1)),
    _0x33a6d5,
  );
  _0x275dd3.add(_0x1fd4af);
  const _0x4e4dcd = createSelectionRing(0x7db4ff);
  return (
    _0x275dd3.add(_0x4e4dcd),
    { group: _0x275dd3, material: _0x4fd079, edgeMaterial: _0x33a6d5, selectionRing: _0x4e4dcd }
  );
}
function setMannequinProxyMode(_0x1a1f38) {
  ((_0x1a1f38?.fallbackObjects || []).forEach((_0x5c98bb) => {
    _0x5c98bb.visible = true;
  }),
    [_0x1a1f38?.material, _0x1a1f38?.headMaterial].forEach((_0x4e9d03) => {
      if (!_0x4e9d03) return;
      ((_0x4e9d03.transparent = true),
        (_0x4e9d03.opacity = 0.001),
        (_0x4e9d03.depthWrite = false),
        (_0x4e9d03.colorWrite = false));
    }));
}
function createCharacterClayMaterial(_0x17526f) {
  return new threeRuntime['MeshStandardMaterial']({
    color: _0x17526f?.isColor ? _0x17526f.clone() : new threeRuntime.Color(_0x17526f || 0xffffff),
    roughness: 0.78,
    metalness: 0,
  });
}
function applyCharacterClayMaterial(_0x1e064d, _0x2bda8f) {
  if (!_0x1e064d?.modelRoot) return;
  (!_0x1e064d.modelMaterial &&
    ((_0x1e064d.modelMaterial = createCharacterClayMaterial(_0x2bda8f)),
    _0x1e064d.modelRoot.traverse((_0x1647fe) => {
      if (!_0x1647fe.isMesh) return;
      (disposeMaterial(_0x1647fe.material), (_0x1647fe.material = _0x1e064d.modelMaterial));
    })),
    _0x1e064d.modelMaterial.color.copy(
      _0x2bda8f?.isColor ? _0x2bda8f : new threeRuntime['Color'](_0x2bda8f || 0xffffff),
    ));
}
function applyObjectSelectionEmphasis(_0x33af90, _0x3d213c, _0x3a8018 = 0.12) {
  if (!_0x33af90) return;
  _0x33af90.traverse((_0x57b5a0) => {
    eachMaterial(_0x57b5a0.material, (_0x5eca15) => {
      applySelectionEmphasis(_0x5eca15, _0x3d213c, _0x3a8018);
    });
  });
}
function createCameraVisual() {
  const _0x479295 = new threeRuntime['Group'](),
    _0x599f22 = new threeRuntime['Group']();
  _0x479295.add(_0x599f22);
  const _0x1b3421 = new threeRuntime['LineBasicMaterial']({
      color: resolveThemeColor('--white', '--white'),
      transparent: true,
      opacity: 0.8,
    }),
    _0x1204e0 = new threeRuntime['LineBasicMaterial']({
      color: resolveThemeColor('--blue', '--blue'),
      transparent: true,
      opacity: 0.8,
    }),
    _0x130a91 = (_0x6db8f9, _0x1a4b30, _0x3baa33, _0x41e812) =>
      new threeRuntime['LineSegments'](
        new threeRuntime['EdgesGeometry'](new threeRuntime['BoxGeometry'](_0x6db8f9, _0x1a4b30, _0x3baa33)),
        _0x41e812,
      ),
    _0x5be83b = _0x130a91(0.26, 0.16, 0.14, _0x1b3421);
  (_0x5be83b.position.set(0, 0, 0.075), _0x599f22.add(_0x5be83b));
  const _0x8f57cb = _0x130a91(0.1, 0.045, 0.06, _0x1b3421);
  (_0x8f57cb.position.set(0, 0.102, 0.08), _0x599f22.add(_0x8f57cb));
  const _0x5a3108 = _0x130a91(0.06, 0.045, 0.08, _0x1b3421);
  (_0x5a3108.position.set(-0.105, 0.05, 0.155), _0x599f22.add(_0x5a3108));
  const _0x585ed8 = _0x130a91(0.12, 0.09, 0.02, _0x1b3421);
  (_0x585ed8.position.set(0, 0, -0.01), _0x599f22.add(_0x585ed8));
  const _0x3c78fa = new threeRuntime.BufferGeometry().setFromPoints([
    new threeRuntime.Vector3(-0.025, 0, 0),
    new threeRuntime['Vector3'](0.025, 0, 0),
    new threeRuntime['Vector3'](0, -0.025, 0),
    new threeRuntime['Vector3'](0, 0.025, 0),
  ]);
  _0x599f22.add(new threeRuntime['LineSegments'](_0x3c78fa, _0x1b3421));
  const _0x49bfbd = new threeRuntime['Vector3'](0, 0, -0.02),
    _0x2c9273 = 0.55,
    _0x173cfc = 0.18,
    _0x277821 = 0.1,
    _0x373802 = _0x49bfbd,
    _0xc4b075 = new threeRuntime['Vector3'](
      _0x49bfbd.x - _0x173cfc,
      _0x49bfbd.y + _0x277821,
      _0x49bfbd.z - _0x2c9273,
    ),
    _0x2c3b8d = new threeRuntime.Vector3(
      _0x49bfbd.x + _0x173cfc,
      _0x49bfbd.y + _0x277821,
      _0x49bfbd.z - _0x2c9273,
    ),
    _0x409362 = new threeRuntime['Vector3'](
      _0x49bfbd.x - _0x173cfc,
      _0x49bfbd.y - _0x277821,
      _0x49bfbd.z - _0x2c9273,
    ),
    _0x593efd = new threeRuntime['Vector3'](
      _0x49bfbd.x + _0x173cfc,
      _0x49bfbd.y - _0x277821,
      _0x49bfbd.z - _0x2c9273,
    ),
    _0x2b1980 = new threeRuntime['BufferGeometry']().setFromPoints([
      _0x373802,
      _0xc4b075,
      _0x373802,
      _0x2c3b8d,
      _0x373802,
      _0x409362,
      _0x373802,
      _0x593efd,
      _0xc4b075,
      _0x2c3b8d,
      _0x2c3b8d,
      _0x593efd,
      _0x593efd,
      _0x409362,
      _0x409362,
      _0xc4b075,
    ]),
    _0xdd391a = new threeRuntime['LineSegments'](_0x2b1980, _0x1204e0);
  return (
    _0x599f22.add(_0xdd391a),
    { group: _0x479295, marker: _0x599f22, bodyMaterial: _0x1b3421, helperLineMaterial: _0x1204e0 }
  );
}
function applyGenderShape(_0x117835, _0x12284e) {
  const _0x206da1 = _0x117835?.parts;
  if (!_0x206da1) return;
  const [_0x3c317a, _0x1ecac2] = _0x206da1.shoulders || [],
    [_0x1621a4, _0x5de585] = _0x206da1.upperArms || [],
    [_0x13a5e4, _0x345f5d] = _0x206da1.lowerArms || [],
    [_0x3579f2, _0x41e804] = _0x206da1.hands || [],
    [_0x17c351, _0x59171a] = _0x206da1.upperLegs || [],
    [_0x481424, _0x59deca] = _0x206da1.lowerLegs || [],
    [_0x446020, _0x30bdde] = _0x206da1.feet || [];
  if (_0x12284e === 'female') {
    (_0x206da1.head?.scale.set(0.94, 1.08, 0.92),
      _0x206da1.neck?.scale.set(0.92, 1, 0.92),
      _0x206da1.chest?.scale.set(1.2, 0.98, 0.82),
      _0x206da1.waist?.scale.set(0.84, 0.92, 0.72),
      _0x206da1.pelvis?.scale.set(1.38, 0.98, 1.08));
    if (_0x3c317a) _0x3c317a.position.set(-0.27, 1.42, 0);
    if (_0x1ecac2) _0x1ecac2.position.set(0.27, 1.42, 0);
    if (_0x1621a4) _0x1621a4.position.set(-0.34, 1.14, 0);
    if (_0x5de585) _0x5de585.position.set(0.34, 1.14, 0);
    if (_0x13a5e4) _0x13a5e4.position.set(-0.37, 0.84, 0.01);
    if (_0x345f5d) _0x345f5d.position.set(0.37, 0.84, 0.01);
    if (_0x3579f2) _0x3579f2.position.set(-0.375, 0.59, 0.01);
    if (_0x41e804) _0x41e804.position.set(0.375, 0.59, 0.01);
    _0x17c351 && (_0x17c351.position.set(-0.115, 0.45, 0), _0x17c351.scale.set(0.94, 1, 0.94));
    _0x59171a && (_0x59171a.position.set(0.115, 0.45, 0), _0x59171a.scale.set(0.94, 1, 0.94));
    _0x481424 && (_0x481424.position.set(-0.115, 0.01, 0.01), _0x481424.scale.set(0.92, 1.02, 0.9));
    _0x59deca && (_0x59deca.position.set(0.115, 0.01, 0.01), _0x59deca.scale.set(0.92, 1.02, 0.9));
    if (_0x446020) _0x446020.scale.set(0.88, 0.96, 0.95);
    if (_0x30bdde) _0x30bdde.scale.set(0.88, 0.96, 0.95);
  } else {
    (_0x206da1.head?.scale.set(0.98, 1.08, 0.95),
      _0x206da1.neck?.scale.set(1.02, 1, 1.02),
      _0x206da1.chest?.scale.set(1.48, 1.04, 0.98),
      _0x206da1.waist?.scale.set(1.02, 0.96, 0.84),
      _0x206da1.pelvis?.scale.set(1.2, 0.94, 0.96));
    if (_0x3c317a) _0x3c317a.position.set(-0.33, 1.44, 0);
    if (_0x1ecac2) _0x1ecac2.position.set(0.33, 1.44, 0);
    if (_0x1621a4) _0x1621a4.position.set(-0.42, 1.18, 0);
    if (_0x5de585) _0x5de585.position.set(0.42, 1.18, 0);
    if (_0x13a5e4) _0x13a5e4.position.set(-0.45, 0.87, 0.01);
    if (_0x345f5d) _0x345f5d.position.set(0.45, 0.87, 0.01);
    if (_0x3579f2) _0x3579f2.position.set(-0.455, 0.63, 0.01);
    if (_0x41e804) _0x41e804.position.set(0.455, 0.63, 0.01);
    _0x17c351 && (_0x17c351.position.set(-0.125, 0.47, 0), _0x17c351.scale.set(1.06, 1, 1.02));
    _0x59171a && (_0x59171a.position.set(0.125, 0.47, 0), _0x59171a.scale.set(1.06, 1, 1.02));
    _0x481424 && (_0x481424.position.set(-0.125, 0.03, 0.01), _0x481424.scale.set(1, 1, 1));
    _0x59deca && (_0x59deca.position.set(0.125, 0.03, 0.01), _0x59deca.scale.set(1, 1, 1));
    if (_0x446020) _0x446020.scale.set(1, 1, 1);
    if (_0x30bdde) _0x30bdde.scale.set(1, 1, 1);
  }
}
function disposeMaterial(_0x24d401) {
  if (!_0x24d401) return;
  if (Array.isArray(_0x24d401)) {
    _0x24d401.forEach(disposeMaterial);
    return;
  }
  (_0x24d401.map && (_0x24d401.map.dispose(), (_0x24d401.map = null)), _0x24d401.dispose?.());
}
function disposeObject3D(_0x2af598) {
  _0x2af598.traverse((_0x21e63c) => {
    (_0x21e63c.geometry?.dispose?.(), disposeMaterial(_0x21e63c.material));
  });
}
function vectorFromAxisName(_0x58a440) {
  if (_0x58a440 === 'x') return new threeRuntime['Vector3'](1, 0, 0);
  if (_0x58a440 === 'y') return new threeRuntime['Vector3'](0, 1, 0);
  return new threeRuntime['Vector3'](0, 0, 1);
}
function toVector3Like(_0x1af759, _0x572808 = { x: 0, y: 0, z: 0 }) {
  return new threeRuntime.Vector3(
    Number.isFinite(Number(_0x1af759?.x)) ? Number(_0x1af759.x) : Number(_0x572808?.x) || 0,
    Number.isFinite(Number(_0x1af759?.y)) ? Number(_0x1af759.y) : Number(_0x572808?.y) || 0,
    Number.isFinite(Number(_0x1af759?.z)) ? Number(_0x1af759.z) : Number(_0x572808?.z) || 0,
  );
}
function toEulerLike(_0x2a77e0, _0x49fffd = { x: 0, y: 0, z: 0 }, _0x4f7417 = 'XYZ') {
  return new threeRuntime['Euler'](
    Number.isFinite(Number(_0x2a77e0?.x)) ? Number(_0x2a77e0.x) : Number(_0x49fffd?.x) || 0,
    Number.isFinite(Number(_0x2a77e0?.y)) ? Number(_0x2a77e0.y) : Number(_0x49fffd?.y) || 0,
    Number.isFinite(Number(_0x2a77e0?.z)) ? Number(_0x2a77e0.z) : Number(_0x49fffd?.z) || 0,
    _0x4f7417,
  );
}
function toScaleVector(_0x50c0ec) {
  if (Number.isFinite(_0x50c0ec)) {
    const _0x28ee8c = Math.max(0.01, Number(_0x50c0ec) || 1);
    return { x: _0x28ee8c, y: _0x28ee8c, z: _0x28ee8c };
  }
  if (
    _0x50c0ec &&
    Number.isFinite(_0x50c0ec.x) &&
    Number.isFinite(_0x50c0ec.y) &&
    Number.isFinite(_0x50c0ec.z)
  )
    return {
      x: Math.max(0.01, Number(_0x50c0ec.x) || 1),
      y: Math.max(0.01, Number(_0x50c0ec.y) || 1),
      z: Math.max(0.01, Number(_0x50c0ec.z) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function applyGroupScale(_0xf50c0c, _0x530f2e) {
  const _0x23609b = toScaleVector(_0x530f2e);
  _0xf50c0c.scale.set(_0x23609b.x, _0x23609b.y, _0x23609b.z);
}
function applyGroupTransform(_0x519d68, _0x42fb6f) {
  _0x519d68.position.set(
    Number(_0x42fb6f?.position?.x) || 0,
    Number(_0x42fb6f?.position?.y) || 0,
    Number(_0x42fb6f?.position?.z) || 0,
  );
  if (hasFiniteQuaternion(_0x42fb6f?.quaternion)) {
    const _0x44ec23 = normalizeQuaternionData(_0x42fb6f.quaternion, { x: 0, y: 0, z: 0, w: 1 });
    _0x519d68.quaternion.set(_0x44ec23.x, _0x44ec23.y, _0x44ec23.z, _0x44ec23.w);
    return;
  }
  _0x519d68.rotation.set(
    Number(_0x42fb6f?.rotation?.x) || 0,
    Number(_0x42fb6f?.rotation?.y) || 0,
    Number(_0x42fb6f?.rotation?.z) || 0,
  );
}
function hasFiniteQuaternion(_0x3a78e9) {
  return (
    Number.isFinite(Number(_0x3a78e9?.x)) &&
    Number.isFinite(Number(_0x3a78e9?.y)) &&
    Number.isFinite(Number(_0x3a78e9?.z)) &&
    Number.isFinite(Number(_0x3a78e9?.w))
  );
}
function normalizeQuaternionData(_0x1ab3ce, _0x7c23e7 = { x: 0, y: 0, z: 0, w: 1 }) {
  const _0x11f268 = Number(_0x1ab3ce?.x),
    _0x1da17e = Number(_0x1ab3ce?.y),
    _0x5e2c00 = Number(_0x1ab3ce?.z),
    _0x4bbd51 = Number(_0x1ab3ce?.w);
  if (
    !Number.isFinite(_0x11f268) ||
    !Number.isFinite(_0x1da17e) ||
    !Number.isFinite(_0x5e2c00) ||
    !Number.isFinite(_0x4bbd51)
  )
    return { ..._0x7c23e7 };
  const _0x3d5a65 = Math.hypot(_0x11f268, _0x1da17e, _0x5e2c00, _0x4bbd51);
  if (_0x3d5a65 < 0.000001) return { ..._0x7c23e7 };
  return {
    x: _0x11f268 / _0x3d5a65,
    y: _0x1da17e / _0x3d5a65,
    z: _0x5e2c00 / _0x3d5a65,
    w: _0x4bbd51 / _0x3d5a65,
  };
}
function toQuaternionFromPose(_0x4077ac, _0x3297f0 = { x: 0, y: 0, z: 0, w: 1 }, _0x17445c = 'XYZ') {
  if (hasFiniteQuaternion(_0x4077ac?.quaternion)) {
    const _0x3bcd9a = normalizeQuaternionData(_0x4077ac.quaternion, _0x3297f0);
    return new threeRuntime['Quaternion'](_0x3bcd9a.x, _0x3bcd9a.y, _0x3bcd9a.z, _0x3bcd9a.w);
  }
  const _0x58966b = toEulerLike(_0x4077ac?.rotation, { x: 0, y: 0, z: 0 }, _0x17445c);
  return new threeRuntime['Quaternion']().setFromEuler(_0x58966b);
}
function composeMatrixFromPose(_0x4f6c34 = {}, _0xd39c51 = 'XYZ') {
  const _0x307eb5 = toVector3Like(_0x4f6c34?.position, { x: 0, y: 0, z: 0 }),
    _0x1ff52f = toQuaternionFromPose(_0x4f6c34, { x: 0, y: 0, z: 0, w: 1 }, _0xd39c51),
    _0x4d4e16 = toVector3Like(toScaleVector(_0x4f6c34?.scale), { x: 1, y: 1, z: 1 });
  return new threeRuntime['Matrix4']().compose(_0x307eb5, _0x1ff52f, _0x4d4e16);
}
function quaternionFromRotationYXZ(_0x21111c) {
  const _0x51e3a9 = new threeRuntime['Quaternion']().setFromEuler(
    new threeRuntime['Euler'](
      Number(_0x21111c?.x) || 0,
      Number(_0x21111c?.y) || 0,
      Number(_0x21111c?.z) || 0,
      'YXZ',
    ),
  );
  return normalizeQuaternionData(_0x51e3a9);
}
function resolveObjectPivot(_0x559205, _0x27c0ae) {
  if (
    Number.isFinite(Number(_0x559205?.pivot?.x)) &&
    Number.isFinite(Number(_0x559205?.pivot?.y)) &&
    Number.isFinite(Number(_0x559205?.pivot?.z))
  )
    return toVector3Like(_0x559205.pivot);
  if (_0x559205) {
    const _0x5589e7 = composeMatrixFromPose(_0x559205),
      _0x59b90b = new threeRuntime.Vector3();
    return (_0x59b90b.setFromMatrixPosition(_0x5589e7), _0x59b90b);
  }
  if (_0x27c0ae?.group) {
    const _0xd04f56 = new threeRuntime['Vector3']();
    return (_0x27c0ae.group.getWorldPosition(_0xd04f56), _0xd04f56);
  }
  return new threeRuntime['Vector3']();
}
function resolveActiveTransformTool(_0x3d052d) {
  const _0x39be63 = String(_0x3d052d?.ui?.transformTool || '').trim();
  if (_0x39be63 === 'move' || _0x39be63 === 'rotate' || _0x39be63 === 'scale') return _0x39be63;
  const _0x5df4fb = String(_0x3d052d?.ui?.activeTool || '').trim();
  if (_0x5df4fb === 'move' || _0x5df4fb === 'rotate' || _0x5df4fb === 'scale') return _0x5df4fb;
  return 'move';
}
function resolveObjectOrientationQuaternion(_0x3c3c6f, _0x3d8f5c) {
  if (_0x3d8f5c?.group) {
    const _0x4af861 = new threeRuntime['Quaternion']();
    return (_0x3d8f5c.group.getWorldQuaternion(_0x4af861), _0x4af861);
  }
  return toQuaternionFromPose(_0x3c3c6f, { x: 0, y: 0, z: 0, w: 1 });
}
function areOrientationQuaternionsAligned(_0x365ad9, _0x3ebaae, _0x279c31 = 0.00001) {
  if (!_0x365ad9 || !_0x3ebaae) return false;
  const _0x882b0d = Math.abs(
    (Number(_0x365ad9.x) || 0) * (Number(_0x3ebaae.x) || 0) +
      (Number(_0x365ad9.y) || 0) * (Number(_0x3ebaae.y) || 0) +
      (Number(_0x365ad9.z) || 0) * (Number(_0x3ebaae.z) || 0) +
      (Number(_0x365ad9.w) || 0) * (Number(_0x3ebaae.w) || 0),
  );
  return Math.abs(1 - _0x882b0d) <= _0x279c31;
}
function resolveSelectionGizmoOrientation(_0x1367cf, _0x326051, _0xdcd01f) {
  const _0x1eb9e8 = _0x326051?.orientationQuaternion?.clone?.() || new threeRuntime['Quaternion']();
  if (!_0xdcd01f) return { orientationQuaternion: _0x1eb9e8, usesLocalOrientation: true };
  const _0xfce801 =
    _0x1367cf.length > 0 &&
    _0x1367cf.every((_0xe9ec50) =>
      areOrientationQuaternionsAligned(_0x1eb9e8, _0xe9ec50.orientationQuaternion),
    );
  return {
    orientationQuaternion: _0xfce801 ? _0x1eb9e8 : new threeRuntime.Quaternion(),
    usesLocalOrientation: _0xfce801,
  };
}
function rotationFromQuaternionYXZ(_0x620da7) {
  const _0x5ef417 = normalizeQuaternionData(_0x620da7),
    _0x4c03c9 = new threeRuntime['Euler']().setFromQuaternion(
      new threeRuntime['Quaternion'](_0x5ef417.x, _0x5ef417.y, _0x5ef417.z, _0x5ef417.w),
      'YXZ',
    );
  return { x: _0x4c03c9.x, y: _0x4c03c9.y, z: _0x4c03c9.z };
}
function normalizeCameraPoseData(_0x1a6e75 = {}) {
  const _0x144964 = {
      x: Number(_0x1a6e75?.position?.x) || 0,
      y: Number(_0x1a6e75?.position?.y) || 0,
      z: Number(_0x1a6e75?.position?.z) || 0,
    },
    _0x5dd241 = hasFiniteQuaternion(_0x1a6e75?.quaternion),
    _0x4736a2 = _0x5dd241
      ? normalizeQuaternionData(_0x1a6e75.quaternion, quaternionFromRotationYXZ(_0x1a6e75?.rotation))
      : quaternionFromRotationYXZ(_0x1a6e75?.rotation),
    _0x4181e3 = _0x5dd241
      ? rotationFromQuaternionYXZ(_0x4736a2)
      : {
          x: Number(_0x1a6e75?.rotation?.x) || 0,
          y: Number(_0x1a6e75?.rotation?.y) || 0,
          z: Number(_0x1a6e75?.rotation?.z) || 0,
        };
  return {
    position: _0x144964,
    quaternion: _0x4736a2,
    rotation: _0x4181e3,
    fov: Number.isFinite(Number(_0x1a6e75?.fov))
      ? Number(_0x1a6e75.fov)
      : focalLengthToFov(
          Object.prototype.hasOwnProperty.call(_0x1a6e75 || {}, 'focalLength')
            ? _0x1a6e75.focalLength
            : SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
    focalLength: Object.prototype.hasOwnProperty.call(_0x1a6e75 || {}, 'focalLength')
      ? Number(_0x1a6e75.focalLength) || SCENE_DEFAULT_FOCAL_LENGTH_MM
      : Number.isFinite(Number(_0x1a6e75?.fov))
        ? fovToFocalLength(_0x1a6e75.fov)
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function collectSelectedObjects(_0x5a87cd) {
  const _0xe0216 = Array.isArray(_0x5a87cd?.cubes) ? _0x5a87cd.cubes : [],
    _0x20fc7b = Array.isArray(_0x5a87cd?.mannequins) ? _0x5a87cd.mannequins : [],
    _0x3af8da = new Set(_0xe0216.map((_0x307076) => _0x307076.id)),
    _0xfd79a7 = new Set(_0x20fc7b.map((_0x53a633) => _0x53a633.id)),
    _0x1b42f7 = new Set(),
    _0x2ebeab = [],
    _0x2ff413 = (_0xc2fcf2, _0x50e035) => {
      if (_0xc2fcf2 !== 'cube' && _0xc2fcf2 !== 'mannequin') return;
      const _0x33981a = String(_0x50e035 || '').trim();
      if (!_0x33981a) return;
      const _0x23fd21 = _0xc2fcf2 === 'cube' ? _0x3af8da.has(_0x33981a) : _0xfd79a7.has(_0x33981a);
      if (!_0x23fd21) return;
      const _0x1ed8c0 = _0xc2fcf2 + ':' + _0x33981a;
      if (_0x1b42f7.has(_0x1ed8c0)) return;
      (_0x1b42f7.add(_0x1ed8c0), _0x2ebeab.push({ objectType: _0xc2fcf2, objectId: _0x33981a }));
    },
    _0x300cb9 = Array.isArray(_0x5a87cd?.selection?.selectedObjects)
      ? _0x5a87cd.selection.selectedObjects
      : [];
  _0x300cb9.forEach((_0xb35258) => {
    _0x2ff413(_0xb35258?.objectType, _0xb35258?.objectId);
  });
  if (_0x2ebeab.length > 0) return _0x2ebeab;
  const _0x3f86b1 = _0x5a87cd?.selection?.selectedGroupId || null;
  if (_0x3f86b1) {
    const _0x1a4f93 = (_0x5a87cd?.groups || []).find((_0x2d7667) => _0x2d7667.id === _0x3f86b1),
      _0x588760 = Array.isArray(_0x1a4f93?.memberIds) ? _0x1a4f93.memberIds : [];
    _0x588760.forEach((_0xfe4a1e) => {
      _0x2ff413('mannequin', _0xfe4a1e);
    });
    if (_0x2ebeab.length > 0) return _0x2ebeab;
  }
  const _0x2341b1 =
    _0x5a87cd?.selection?.selectedObjectType === 'cube' ||
    _0x5a87cd?.selection?.selectedObjectType === 'mannequin'
      ? _0x5a87cd.selection.selectedObjectType
      : null;
  if (!_0x2341b1) return _0x2ebeab;
  const _0x4f3a8f = Array.isArray(_0x5a87cd?.selection?.selectedObjectIds)
    ? _0x5a87cd.selection.selectedObjectIds
    : [];
  if (_0x4f3a8f.length > 0) {
    _0x4f3a8f.forEach((_0x8432b4) => {
      _0x2ff413(_0x2341b1, _0x8432b4);
    });
    if (_0x2ebeab.length > 0) return _0x2ebeab;
  }
  return (_0x2ff413(_0x2341b1, _0x5a87cd?.selection?.selectedObjectId || null), _0x2ebeab);
}
function collectSelectedObjectIds(_0x585495, _0x3b3f77) {
  return collectSelectedObjects(_0x585495)
    .filter((_0xd0dac5) => _0xd0dac5.objectType === _0x3b3f77)
    .map((_0x102b50) => _0x102b50.objectId);
}
function buildTransformSelectionSignature(_0x555d8f) {
  const _0x31fca5 = collectSelectedObjects(_0x555d8f);
  if (_0x31fca5.length === 0) return '';
  return _0x31fca5
    .map((_0x31f2ee) => _0x31f2ee.objectType + ':' + _0x31f2ee.objectId)
    .sort()
    .join('|');
}
function cloneGizmoDisplayContext(_0x2aa052) {
  if (!_0x2aa052) return null;
  return {
    isMultiSelection: _0x2aa052.isMultiSelection === true,
    usesLocalOrientation: _0x2aa052.usesLocalOrientation === true,
    position: _0x2aa052.position?.clone?.() || new threeRuntime['Vector3'](),
    orientationQuaternion: _0x2aa052.orientationQuaternion?.clone?.() || new threeRuntime['Quaternion'](),
    bounds: {
      box: _0x2aa052.bounds?.box?.clone?.() || createFallbackBounds().box,
      size: _0x2aa052.bounds?.size?.clone?.() || new threeRuntime.Vector3(1, 1, 1),
      sphere: _0x2aa052.bounds?.sphere
        ? new threeRuntime['Sphere'](
            _0x2aa052.bounds.sphere.center?.clone?.() || new threeRuntime.Vector3(),
            Number(_0x2aa052.bounds.sphere.radius) || 0,
          )
        : new threeRuntime['Sphere'](new threeRuntime.Vector3(0, 0.5, 0), Math.sqrt(0.75)),
      extents: {
        x: Number(_0x2aa052.bounds?.extents?.x) || 0,
        y: Number(_0x2aa052.bounds?.extents?.y) || 0,
        z: Number(_0x2aa052.bounds?.extents?.z) || 0,
      },
    },
    gizmoWorldMetrics: {
      extents: {
        x: Number(_0x2aa052.gizmoWorldMetrics?.extents?.x) || 0,
        y: Number(_0x2aa052.gizmoWorldMetrics?.extents?.y) || 0,
        z: Number(_0x2aa052.gizmoWorldMetrics?.extents?.z) || 0,
      },
      sphereRadius: Number(_0x2aa052.gizmoWorldMetrics?.sphereRadius) || 0.01,
      margin: Number(_0x2aa052.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
    },
  };
}
function measureVisualBounds(_0x21b606) {
  const _0x1d6b3c = _0x21b606?.proxyRoot || _0x21b606?.group;
  if (!_0x1d6b3c) return null;
  const _0x604d97 = new threeRuntime.Box3().setFromObject(_0x1d6b3c);
  if (_0x604d97.isEmpty()) return null;
  const _0x44237e = new threeRuntime['Vector3'](),
    _0x3cdcd3 = new threeRuntime['Sphere']();
  return (
    _0x604d97.getSize(_0x44237e),
    _0x604d97.getBoundingSphere(_0x3cdcd3),
    {
      box: _0x604d97,
      size: _0x44237e,
      sphere: _0x3cdcd3,
      extents: {
        x: Math.max(0, _0x44237e.x * 0.5),
        y: Math.max(0, _0x44237e.y * 0.5),
        z: Math.max(0, _0x44237e.z * 0.5),
      },
    }
  );
}
function resolveVisualBoundsCenter(_0x36d663) {
  const _0x5904f7 = measureVisualBounds(_0x36d663);
  if (!_0x5904f7?.box || _0x5904f7.box.isEmpty()) return null;
  const _0x3b8bc4 = new threeRuntime['Vector3']();
  return (_0x5904f7.box.getCenter(_0x3b8bc4), _0x3b8bc4);
}
function resolveObjectToolPivot(_0x2cf33c, _0x233a31, _0x258b10, _0x4ce03a) {
  const _0x33dca6 = String(_0x4ce03a || '').trim();
  if (_0x33dca6 !== 'camera') {
    const _0x258f04 = resolveVisualBoundsCenter(_0x233a31);
    if (_0x258f04) return _0x258f04;
  }
  return resolveObjectPivot(_0x2cf33c, _0x233a31);
}
function measureVisualBoundsForSelection(_0x325266 = []) {
  const _0x1d22fb = new threeRuntime['Box3']();
  let _0x457003 = false;
  _0x325266.forEach((_0x4715e7) => {
    const _0x562fef = _0x4715e7?.visual?.proxyRoot || _0x4715e7?.visual?.group;
    if (!_0x562fef) return;
    const _0x137d1b = new threeRuntime['Box3']().setFromObject(_0x562fef);
    if (_0x137d1b.isEmpty()) return;
    if (!_0x457003) {
      (_0x1d22fb.copy(_0x137d1b), (_0x457003 = true));
      return;
    }
    _0x1d22fb.union(_0x137d1b);
  });
  if (!_0x457003) return null;
  const _0x3da2b3 = new threeRuntime.Vector3(),
    _0x127d60 = new threeRuntime['Sphere']();
  return (
    _0x1d22fb.getSize(_0x3da2b3),
    _0x1d22fb.getBoundingSphere(_0x127d60),
    {
      box: _0x1d22fb,
      size: _0x3da2b3,
      sphere: _0x127d60,
      extents: {
        x: Math.max(0, _0x3da2b3.x * 0.5),
        y: Math.max(0, _0x3da2b3.y * 0.5),
        z: Math.max(0, _0x3da2b3.z * 0.5),
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
function computeGizmoWorldMetrics(_0x1c040c) {
  const _0x237d0 = _0x1c040c?.extents || { x: 0.5, y: 0.5, z: 0.5 },
    _0x124244 = Math.max(0.01, Number(_0x237d0.x) || 0, Number(_0x237d0.y) || 0, Number(_0x237d0.z) || 0),
    _0x2c1d13 = Math.max(0.01, Number(_0x1c040c?.sphere?.radius) || 0.01),
    _0x45c80a = Math.max(GIZMO_MARGIN_WORLD_MIN, _0x2c1d13 * GIZMO_MARGIN_WORLD_RATIO, _0x124244 * 0.18);
  return { extents: _0x237d0, maxExtent: _0x124244, sphereRadius: _0x2c1d13, margin: _0x45c80a };
}
function cloneRenderPose(_0x4e013b) {
  if (!_0x4e013b) return null;
  if (_0x4e013b.kind === 'camera') {
    const _0x1a7544 = normalizeCameraPoseData(_0x4e013b);
    return {
      kind: 'camera',
      position: { ..._0x1a7544.position },
      quaternion: { ..._0x1a7544.quaternion },
      rotation: { ..._0x1a7544.rotation },
      fov: _0x1a7544.fov,
    };
  }
  if (_0x4e013b.kind === 'panorama-default')
    return {
      kind: 'panorama-default',
      position: { ..._0x4e013b.position },
      yaw: Number(_0x4e013b.yaw) || 0,
      pitch: Number(_0x4e013b.pitch) || 0,
      fov: Number(_0x4e013b.fov) || 72,
    };
  return {
    kind: 'scene-default',
    position: { ..._0x4e013b.position },
    target: { ..._0x4e013b.target },
    yaw: Number(_0x4e013b.yaw) || 0,
    pitch: Number(_0x4e013b.pitch) || 0,
    distance: Number(_0x4e013b.distance) || 0,
    fov: Number(_0x4e013b.fov) || 58,
  };
}
function measurePoseDistance(_0x13c5d6, _0x16f409) {
  if (!_0x13c5d6 || !_0x16f409 || _0x13c5d6.kind !== _0x16f409.kind) return Number.POSITIVE_INFINITY;
  if (_0x16f409.kind === 'camera') {
    const _0x4c7bef = normalizeCameraPoseData(_0x13c5d6),
      _0x878c64 = normalizeCameraPoseData(_0x16f409),
      _0x499ff0 =
        Math.abs(_0x878c64.position.x - _0x4c7bef.position.x) +
        Math.abs(_0x878c64.position.y - _0x4c7bef.position.y) +
        Math.abs(_0x878c64.position.z - _0x4c7bef.position.z),
      _0x27777b = Math.abs(
        _0x878c64.quaternion.x * _0x4c7bef.quaternion.x +
          _0x878c64.quaternion.y * _0x4c7bef.quaternion.y +
          _0x878c64.quaternion.z * _0x4c7bef.quaternion.z +
          _0x878c64.quaternion.w * _0x4c7bef.quaternion.w,
      ),
      _0x38539c = 1 - Math.min(1, Math.max(0, _0x27777b));
    return _0x499ff0 + _0x38539c + Math.abs(_0x878c64.fov - _0x4c7bef.fov);
  }
  if (_0x16f409.kind === 'panorama-default') {
    const _0x3690f8 =
        Math.abs((_0x16f409.position?.x || 0) - (_0x13c5d6.position?.x || 0)) +
        Math.abs((_0x16f409.position?.y || 0) - (_0x13c5d6.position?.y || 0)) +
        Math.abs((_0x16f409.position?.z || 0) - (_0x13c5d6.position?.z || 0)),
      _0x4ca37c =
        Math.abs((_0x16f409.yaw || 0) - (_0x13c5d6.yaw || 0)) +
        Math.abs((_0x16f409.pitch || 0) - (_0x13c5d6.pitch || 0));
    return _0x3690f8 + _0x4ca37c + Math.abs((_0x16f409.fov || 0) - (_0x13c5d6.fov || 0));
  }
  const _0x30b0ca =
      Math.abs((_0x16f409.position?.x || 0) - (_0x13c5d6.position?.x || 0)) +
      Math.abs((_0x16f409.position?.y || 0) - (_0x13c5d6.position?.y || 0)) +
      Math.abs((_0x16f409.position?.z || 0) - (_0x13c5d6.position?.z || 0)),
    _0x2e2749 =
      Math.abs((_0x16f409.target?.x || 0) - (_0x13c5d6.target?.x || 0)) +
      Math.abs((_0x16f409.target?.y || 0) - (_0x13c5d6.target?.y || 0)) +
      Math.abs((_0x16f409.target?.z || 0) - (_0x13c5d6.target?.z || 0));
  return _0x30b0ca + _0x2e2749 + Math.abs((_0x16f409.fov || 0) - (_0x13c5d6.fov || 0));
}
function areSceneViewsEquivalent(_0x2f8c70, _0x30b3b6, _0x5f52b7 = 0.00001) {
  if (!_0x2f8c70 || !_0x30b3b6) return false;
  const _0x81c256 = _0x2f8c70.target || {},
    _0xcb9fb2 = _0x30b3b6.target || {};
  return (
    Math.abs((Number(_0x81c256.x) || 0) - (Number(_0xcb9fb2.x) || 0)) <= _0x5f52b7 &&
    Math.abs((Number(_0x81c256.y) || 0) - (Number(_0xcb9fb2.y) || 0)) <= _0x5f52b7 &&
    Math.abs((Number(_0x81c256.z) || 0) - (Number(_0xcb9fb2.z) || 0)) <= _0x5f52b7 &&
    Math.abs(normalizeAngle((Number(_0x2f8c70.orbitYaw) || 0) - (Number(_0x30b3b6.orbitYaw) || 0))) <=
      _0x5f52b7 &&
    Math.abs((Number(_0x2f8c70.orbitPitch) || 0) - (Number(_0x30b3b6.orbitPitch) || 0)) <= _0x5f52b7 &&
    Math.abs((Number(_0x2f8c70.orbitDistance) || 0) - (Number(_0x30b3b6.orbitDistance) || 0)) <= _0x5f52b7
  );
}
export class PanoramaScene3DBridge {
  constructor({ container: _0x32a8a5, onPanoramaStatusChange: _0x3c5fd9 } = {}) {
    ((this.container = _0x32a8a5),
      (this.onPanoramaStatusChange = _0x3c5fd9),
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
    const _0x579f5e = resolveThemeColorValue('--panorama-scene-grid-night', '--indigo-35');
    ((this._gridMinor = new threeRuntime['GridHelper'](
      GRID_BASE_SPAN,
      Math.round(GRID_BASE_SPAN / GRID_MINOR_STEP),
      _0x579f5e,
      _0x579f5e,
    )),
      eachMaterial(this._gridMinor.material, (_0x4b2ca4) => {
        ((_0x4b2ca4.transparent = true),
          (_0x4b2ca4.opacity = 0.2),
          (_0x4b2ca4.depthWrite = false),
          (_0x4b2ca4.depthTest = true));
      }),
      (this._gridMinor.renderOrder = 1),
      this.scene.add(this._gridMinor),
      (this._gridMajor = new threeRuntime.GridHelper(
        GRID_BASE_SPAN,
        Math.round(GRID_BASE_SPAN / GRID_MAJOR_STEP),
        _0x579f5e,
        _0x579f5e,
      )),
      eachMaterial(this._gridMajor.material, (_0x5d1dc7) => {
        ((_0x5d1dc7.transparent = true),
          (_0x5d1dc7.opacity = 0.34),
          (_0x5d1dc7.depthWrite = false),
          (_0x5d1dc7.depthTest = true));
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
  ['resize'](_0x5ba652, _0x5b4da5) {
    const _0x47167a = Math.max(1, Math.floor(_0x5ba652 || this.container?.clientWidth || 1)),
      _0x50c8c7 = Math.max(1, Math.floor(_0x5b4da5 || this.container?.clientHeight || 1));
    (this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
      (this.camera.aspect = _0x47167a / _0x50c8c7),
      this.camera.updateProjectionMatrix(),
      this.renderer.setSize(_0x47167a, _0x50c8c7, false),
      this.requestRender());
  }
  ['_isPanorama360Mode'](_0x21502a = this._sceneState) {
    return _0x21502a?.type === 'panorama-360';
  }
  ['setDraftView'](_0x4e21f2) {
    ((this._draftView = _0x4e21f2 || null), this.requestRender());
  }
  ['setDefaultSceneFocalLength'](_0x1118ea) {
    const _0xf920ee = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength;
    ((this._defaultSceneFocalLength = Math.max(
      _0xf920ee.min,
      Math.min(_0xf920ee.max, Number(_0x1118ea) || _0xf920ee.default),
    )),
      this.requestRender());
  }
  ['getDefaultSceneFocalLength']() {
    return this._defaultSceneFocalLength;
  }
  ['clearDraftView']() {
    ((this._draftView = null), this.requestRender());
  }
  ['setDraftObjectTransform'](_0x2d74b4, _0x153770, _0x50969f) {
    const _0x160dac = _0x2d74b4 + ':' + _0x153770;
    (this._draftObjects.set(_0x160dac, {
      position: { ..._0x50969f.position },
      rotation: { ..._0x50969f.rotation },
      quaternion: hasFiniteQuaternion(_0x50969f?.quaternion)
        ? normalizeQuaternionData(_0x50969f.quaternion, { x: 0, y: 0, z: 0, w: 1 })
        : undefined,
      scale:
        Number.isFinite(_0x50969f?.scale) ||
        (_0x50969f?.scale &&
          Number.isFinite(_0x50969f.scale.x) &&
          Number.isFinite(_0x50969f.scale.y) &&
          Number.isFinite(_0x50969f.scale.z))
          ? _0x50969f.scale
          : undefined,
    }),
      this.requestRender());
  }
  ['clearDraftObjectTransform'](_0xfd1e31, _0x50cf1d) {
    (this._draftObjects.delete(_0xfd1e31 + ':' + _0x50cf1d), this.requestRender());
  }
  ['clearAllDrafts']() {
    ((this._draftView = null),
      this._draftObjects.clear(),
      this.clearGizmoMoveGuideLine(),
      this.requestRender());
  }
  ['markViewSmoothingWindow'](_0x2cce7f = VIEW_DAMPING_WINDOW_MS) {
    const _0x2aa3a1 = Math.max(0, Number(_0x2cce7f) || VIEW_DAMPING_WINDOW_MS),
      _0x4c51ae = performance.now();
    this._viewSmoothingUntil = Math.max(this._viewSmoothingUntil || 0, _0x4c51ae + _0x2aa3a1);
  }
  ['readCurrentViewPose']() {
    const _0x3b05df = new threeRuntime.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    return {
      position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      rotation: { x: this.camera.rotation.x, y: this.camera.rotation.y, z: this.camera.rotation.z },
      quaternion: {
        x: this.camera.quaternion.x,
        y: this.camera.quaternion.y,
        z: this.camera.quaternion.z,
        w: this.camera.quaternion.w,
      },
      forward: { x: _0x3b05df.x, y: _0x3b05df.y, z: _0x3b05df.z },
      yaw: Math.atan2(_0x3b05df.x, _0x3b05df.z),
      pitch: Math.asin(Math.max(-1, Math.min(1, _0x3b05df.y))),
      fov: this.camera.fov,
      focalLength: fovToFocalLength(this.camera.fov),
    };
  }
  ['_resolvePointerRay'](_0x2dc500, _0x1ca0c1) {
    const _0x2bcdcc = this.renderer.domElement.getBoundingClientRect(),
      _0x54a691 = new threeRuntime['Vector2'](
        ((_0x2dc500 - _0x2bcdcc.left) / _0x2bcdcc.width) * 2 - 1,
        -(((_0x1ca0c1 - _0x2bcdcc.top) / _0x2bcdcc.height) * 2 - 1),
      ),
      _0x455817 = new threeRuntime['Raycaster']();
    return (_0x455817.setFromCamera(_0x54a691, this.camera), _0x455817);
  }
  ['setGizmoHoverHandle'](_0x1a7a5a) {
    const _0x21f523 = _0x1a7a5a || null;
    if ((this._gizmo?.hoverHandle || null) === _0x21f523) return;
    ((this._gizmo.hoverHandle = _0x21f523), this._applyGizmoHighlight(), this.requestRender());
  }
  ['setGizmoActiveHandle'](_0x54bb24) {
    const _0x4b322c = _0x54bb24 || null,
      _0x52a4f6 = _0x4b322c === null && this._gizmo?.dragLock;
    if ((this._gizmo?.activeHandle || null) === _0x4b322c && !_0x52a4f6) return;
    ((this._gizmo.activeHandle = _0x4b322c),
      _0x4b322c === null && (this._gizmo.dragLock = null),
      this._applyGizmoHighlight(),
      this.requestRender());
  }
  ['clearGizmoHandleState']() {
    if (!this._gizmo) return;
    const _0x568eab = this._gizmo.hoverHandle || this._gizmo.activeHandle || this._gizmo.dragLock;
    ((this._gizmo.hoverHandle = null),
      (this._gizmo.activeHandle = null),
      (this._gizmo.dragLock = null),
      _0x568eab && (this._applyGizmoHighlight(), this.requestRender()));
  }
  ['setGizmoMoveGuideLine']({ from: _0x59c1bb, to: _0x5db483 } = {}) {
    const _0x148241 = this._gizmoMoveGuideLine;
    if (!_0x148241) return;
    const _0x26460f = toVector3Like(_0x59c1bb, { x: 0, y: 0, z: 0 }),
      _0x4756ce = toVector3Like(_0x5db483, _0x26460f);
    (setLineGeometryPoints(_0x148241, _0x26460f, _0x4756ce),
      (_0x148241.visible = true),
      this.requestRender());
  }
  ['clearGizmoMoveGuideLine']() {
    const _0x585569 = this._gizmoMoveGuideLine;
    if (!_0x585569?.visible) return;
    ((_0x585569.visible = false), this.requestRender());
  }
  ['_clearStableGizmoContext']() {
    ((this._lastStableGizmoSelectionSignature = ''), (this._lastStableGizmoContext = null));
  }
  ['_cacheStableGizmoContext'](_0x282602, _0x241e35) {
    const _0x34ebe4 = buildTransformSelectionSignature(_0x282602);
    if (!_0x34ebe4 || !_0x241e35) return;
    ((this._lastStableGizmoSelectionSignature = _0x34ebe4),
      (this._lastStableGizmoContext = cloneGizmoDisplayContext(_0x241e35)));
  }
  ['_resolveStableGizmoContext'](_0x4572d8) {
    const _0x1cf1b6 = buildTransformSelectionSignature(_0x4572d8);
    if (!_0x1cf1b6) return null;
    if (_0x1cf1b6 !== this._lastStableGizmoSelectionSignature) return null;
    return this._lastStableGizmoContext || null;
  }
  ['pickGizmoHandle'](_0x47805c, _0x3501fb) {
    if (this._isPanorama360Mode()) return null;
    if (!this._gizmo?.root?.visible) return null;
    const _0x3f697b =
      this._gizmo?.moveGroup?.visible ||
      this._gizmo?.rotateGroup?.visible ||
      this._gizmo?.scaleGroup?.visible;
    if (!_0x3f697b) return null;
    const _0x3b4279 = Array.isArray(this._gizmo.pickMeshes) ? this._gizmo.pickMeshes : [];
    if (_0x3b4279.length === 0) return null;
    const _0xba1d10 = this._resolvePointerRay(_0x47805c, _0x3501fb),
      _0x11bd81 = _0xba1d10.intersectObjects(_0x3b4279, true);
    for (const _0x5c8308 of _0x11bd81) {
      let _0x1ce0c2 = _0x5c8308.object;
      while (_0x1ce0c2) {
        const _0x6a0db0 = _0x1ce0c2.userData?.gizmoHandleKey;
        if (_0x6a0db0) {
          const _0x4903e6 = this._gizmo.handles?.get?.(_0x6a0db0) || null;
          if (!_0x4903e6) return null;
          const _0x566314 = this._gizmo?.currentTool || 'move',
            _0x31feec = _0x4903e6.mode === 'scale-axis' || _0x4903e6.mode === 'scale-uniform',
            _0x48a284 =
              (_0x566314 === 'move' && (_0x4903e6.mode === 'axis' || _0x4903e6.mode === 'plane')) ||
              (_0x566314 === 'rotate' && _0x4903e6.mode === 'rotate') ||
              (_0x566314 === 'scale' && _0x31feec);
          if (!_0x48a284) {
            _0x1ce0c2 = _0x1ce0c2.parent;
            continue;
          }
          return {
            kind: 'gizmo-handle',
            handleKey: _0x6a0db0,
            mode: _0x4903e6.mode,
            axis: _0x4903e6.axis || null,
            normalAxis: _0x4903e6.normalAxis || null,
            point: { x: _0x5c8308.point.x, y: _0x5c8308.point.y, z: _0x5c8308.point.z },
          };
        }
        _0x1ce0c2 = _0x1ce0c2.parent;
      }
    }
    return null;
  }
  ['beginMoveGizmoDrag']({ handleKey: _0x474c23, clientX: _0x2b30d2, clientY: _0x44de4f } = {}) {
    if (!_0x474c23) return null;
    const _0x4fdf52 = this._gizmo?.handles?.get?.(_0x474c23);
    if (!_0x4fdf52) return null;
    const _0x48b12a = this._gizmo.root.position.clone(),
      _0x4deece = this._gizmo.root.quaternion.clone(),
      _0x3442d2 = _0x4fdf52.mode === 'axis' ? _0x4fdf52.axis : _0x4fdf52.normalAxis;
    if (!_0x3442d2) return null;
    const _0x4903b2 = vectorFromAxisName(_0x3442d2).applyQuaternion(_0x4deece).normalize();
    let _0x419998 = _0x4903b2.clone();
    if (_0x4fdf52.mode === 'axis') {
      const _0x438a03 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        _0x596990 = new threeRuntime['Vector3']().crossVectors(_0x438a03, _0x4903b2);
      (_0x596990.lengthSq() < 0.00001 &&
        (_0x596990.copy(new threeRuntime['Vector3'](0, 1, 0).cross(_0x4903b2)),
        _0x596990.lengthSq() < 0.00001 &&
          _0x596990.copy(new threeRuntime['Vector3'](1, 0, 0).cross(_0x4903b2))),
        (_0x419998 = new threeRuntime['Vector3']().crossVectors(_0x4903b2, _0x596990).normalize()));
    }
    _0x419998.lengthSq() < 0.000001 && (_0x419998 = new threeRuntime['Vector3'](0, 1, 0));
    const _0x1270ed = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(_0x419998, _0x48b12a),
      _0x33b15a = this._resolvePointerRay(_0x2b30d2, _0x44de4f),
      _0x36ce58 = new threeRuntime.Vector3(),
      _0x3e1d1c = _0x33b15a.ray.intersectPlane(_0x1270ed, _0x36ce58),
      _0x10fbd0 = _0x3e1d1c ? _0x36ce58.clone() : _0x48b12a.clone();
    return {
      handleKey: _0x474c23,
      mode: _0x4fdf52.mode,
      axisWorld: _0x4fdf52.mode === 'axis' ? _0x4903b2.clone() : null,
      axis: _0x4fdf52.mode === 'axis' ? _0x4903b2.clone() : null,
      planeNormalWorld: _0x419998.clone(),
      planeNormal: _0x419998.clone(),
      pivot: _0x48b12a.clone(),
      gizmoQuaternion: _0x4deece.clone(),
      startPoint: _0x10fbd0.clone(),
      dragPlane: _0x1270ed,
    };
  }
  ['beginRotateGizmoDrag']({ handleKey: _0x1c954b, clientX: _0x33fe64, clientY: _0x24fb8f } = {}) {
    if (!_0x1c954b) return null;
    const _0x4d9baf = this._gizmo?.handles?.get?.(_0x1c954b);
    if (!_0x4d9baf || _0x4d9baf.mode !== 'rotate') return null;
    const _0x2fb0ef = this._resolveGizmoContext(this._sceneState);
    if (!_0x2fb0ef) return null;
    const _0x329c21 = this._gizmo.root.position.clone(),
      _0x40ab72 = this._gizmo.root.quaternion.clone(),
      _0x30a608 = vectorFromAxisName(_0x4d9baf.axis).applyQuaternion(_0x40ab72).normalize(),
      _0x2d7331 = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(_0x30a608, _0x329c21),
      _0x536a27 = this._resolvePointerRay(_0x33fe64, _0x24fb8f),
      _0x32716f = new threeRuntime['Vector3'](),
      _0x15efdc = _0x536a27.ray.intersectPlane(_0x2d7331, _0x32716f);
    if (!_0x15efdc) return null;
    return (
      this._captureGizmoDragLock(_0x2fb0ef),
      {
        handleKey: _0x1c954b,
        mode: 'rotate',
        axisWorld: _0x30a608.clone(),
        axis: _0x30a608.clone(),
        pivot: _0x329c21.clone(),
        gizmoQuaternion: _0x40ab72.clone(),
        dragPlane: _0x2d7331,
        startPoint: _0x32716f.clone(),
      }
    );
  }
  ['computeRotateGizmoAngle'](_0x12f238, _0x2446d9) {
    if (!_0x12f238?.startPoint || !_0x2446d9) return 0;
    return computeSignedRotationDelta({
      startPoint: { x: _0x12f238.startPoint.x, y: _0x12f238.startPoint.y, z: _0x12f238.startPoint.z },
      currentPoint: _0x2446d9,
      pivot: { x: _0x12f238.pivot.x, y: _0x12f238.pivot.y, z: _0x12f238.pivot.z },
      axis: {
        x: _0x12f238.axisWorld?.x ?? _0x12f238.axis?.x,
        y: _0x12f238.axisWorld?.y ?? _0x12f238.axis?.y,
        z: _0x12f238.axisWorld?.z ?? _0x12f238.axis?.z,
      },
    });
  }
  ['beginScaleGizmoDrag']({ handleKey: _0x4239a5, clientX: _0x54605d, clientY: _0x26c97a } = {}) {
    if (!_0x4239a5) return null;
    const _0xb68675 = this._gizmo?.handles?.get?.(_0x4239a5);
    if (!_0xb68675 || (_0xb68675.mode !== 'scale-axis' && _0xb68675.mode !== 'scale-uniform')) return null;
    const _0x595ebb = this._resolveGizmoContext(this._sceneState);
    if (!_0x595ebb) return null;
    const _0x5a3a2d = this._gizmo.root.position.clone(),
      _0x412a7c = this._gizmo.root.quaternion.clone(),
      _0x3cfc62 = this._resolvePointerRay(_0x54605d, _0x26c97a);
    if (_0xb68675.mode === 'scale-uniform') {
      const _0x34fa00 = this.camera.getWorldDirection(new threeRuntime.Vector3()).normalize(),
        _0x1bb730 = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(_0x34fa00, _0x5a3a2d),
        _0x3c8715 = new threeRuntime['Vector3'](),
        _0x28c7c5 = _0x3cfc62.ray.intersectPlane(_0x1bb730, _0x3c8715);
      if (!_0x28c7c5) return null;
      return (
        this._captureGizmoDragLock(_0x595ebb),
        {
          handleKey: _0x4239a5,
          mode: 'scale-uniform',
          pivot: _0x5a3a2d.clone(),
          axisWorld: null,
          gizmoQuaternion: _0x412a7c.clone(),
          dragPlane: _0x1bb730,
          startPoint: _0x3c8715.clone(),
          referenceDistance: Math.max(0.25, _0x3c8715.distanceTo(_0x5a3a2d)),
        }
      );
    }
    const _0x28977e = vectorFromAxisName(_0xb68675.axis).applyQuaternion(_0x412a7c).normalize(),
      _0x47b74a = this.camera.getWorldDirection(new threeRuntime['Vector3']()).normalize();
    let _0x5644a4 = new threeRuntime['Vector3']().crossVectors(_0x47b74a, _0x28977e);
    _0x5644a4.lengthSq() < 0.00001 &&
      ((_0x5644a4 = new threeRuntime.Vector3(0, 1, 0).cross(_0x28977e)),
      _0x5644a4.lengthSq() < 0.00001 && (_0x5644a4 = new threeRuntime.Vector3(1, 0, 0).cross(_0x28977e)));
    const _0x43a7c2 = new threeRuntime.Vector3().crossVectors(_0x28977e, _0x5644a4).normalize(),
      _0x2f104e = new threeRuntime['Plane']().setFromNormalAndCoplanarPoint(_0x43a7c2, _0x5a3a2d),
      _0x521c47 = new threeRuntime['Vector3'](),
      _0x8e2794 = _0x3cfc62.ray.intersectPlane(_0x2f104e, _0x521c47);
    if (!_0x8e2794) return null;
    this._captureGizmoDragLock(_0x595ebb);
    const _0x26fb4d = Math.max(
        0.35,
        Math.abs(_0x521c47.clone().sub(_0x5a3a2d).dot(_0x28977e)),
        (Number(this._gizmo?.root?.scale?.x) || 1) * 0.9,
      ),
      _0x33644f = resolveAxisScreenDragMetric({
        pivot: _0x5a3a2d,
        axisWorld: _0x28977e,
        camera: this.camera,
        domElement: this.renderer?.domElement,
        worldDistance: _0x26fb4d,
      });
    return {
      handleKey: _0x4239a5,
      mode: 'scale-axis',
      axisWorld: _0x28977e.clone(),
      dragDirectionWorld: _0x28977e.clone(),
      axis: _0x28977e.clone(),
      pivot: _0x5a3a2d.clone(),
      planeNormalWorld: _0x43a7c2.clone(),
      gizmoQuaternion: _0x412a7c.clone(),
      dragPlane: _0x2f104e,
      startPoint: _0x521c47.clone(),
      startClientX: Number(_0x54605d) || 0,
      startClientY: Number(_0x26c97a) || 0,
      axisScreenDirection: _0x33644f?.axisScreenDirection || null,
      screenReferencePixels: _0x33644f?.screenReferencePixels || null,
      referenceDistance: _0x26fb4d,
    };
  }
  ['computeScaleGizmoFactor'](_0x357dbd, _0x5479dc) {
    if (!_0x357dbd?.startPoint || !_0x5479dc) return 1;
    if (_0x357dbd.mode === 'scale-axis') {
      if (
        _0x357dbd.axisScreenDirection &&
        Number.isFinite(Number(_0x5479dc.clientX)) &&
        Number.isFinite(Number(_0x5479dc.clientY))
      )
        return computeAxisScaleFactorFromScreenDelta({
          startX: _0x357dbd.startClientX,
          startY: _0x357dbd.startClientY,
          currentX: _0x5479dc.clientX,
          currentY: _0x5479dc.clientY,
          axisDirection: _0x357dbd.axisScreenDirection,
          referencePixels: _0x357dbd.screenReferencePixels,
        });
      return computeAxisScaleFactor({
        startPoint: { x: _0x357dbd.startPoint.x, y: _0x357dbd.startPoint.y, z: _0x357dbd.startPoint.z },
        currentPoint: _0x5479dc,
        pivot: { x: _0x357dbd.pivot.x, y: _0x357dbd.pivot.y, z: _0x357dbd.pivot.z },
        axis: {
          x: _0x357dbd.axisWorld?.x ?? _0x357dbd.axis?.x,
          y: _0x357dbd.axisWorld?.y ?? _0x357dbd.axis?.y,
          z: _0x357dbd.axisWorld?.z ?? _0x357dbd.axis?.z,
        },
        dragDirection: {
          x: _0x357dbd.dragDirectionWorld?.x ?? _0x357dbd.axisWorld?.x ?? _0x357dbd.axis?.x,
          y: _0x357dbd.dragDirectionWorld?.y ?? _0x357dbd.axisWorld?.y ?? _0x357dbd.axis?.y,
          z: _0x357dbd.dragDirectionWorld?.z ?? _0x357dbd.axisWorld?.z ?? _0x357dbd.axis?.z,
        },
        referenceDistance: _0x357dbd.referenceDistance,
      });
    }
    return computeUniformScaleFactor({
      startPoint: { x: _0x357dbd.startPoint.x, y: _0x357dbd.startPoint.y, z: _0x357dbd.startPoint.z },
      currentPoint: _0x5479dc,
      pivot: { x: _0x357dbd.pivot.x, y: _0x357dbd.pivot.y, z: _0x357dbd.pivot.z },
      minDistance: _0x357dbd.referenceDistance,
    });
  }
  ['sampleMoveGizmoDragPoint'](_0x460650, _0x534ef7, _0x51a168) {
    if (!_0x460650?.dragPlane) return null;
    const _0x137a22 = this._resolvePointerRay(_0x534ef7, _0x51a168),
      _0x564bae = new threeRuntime['Vector3'](),
      _0x4b009c = _0x137a22.ray.intersectPlane(_0x460650.dragPlane, _0x564bae);
    if (!_0x4b009c) return null;
    return { x: _0x564bae.x, y: _0x564bae.y, z: _0x564bae.z, clientX: _0x534ef7, clientY: _0x51a168 };
  }
  ['computeMoveGizmoDelta'](_0x1d254e, _0x318ddc) {
    if (!_0x1d254e?.startPoint || !_0x318ddc) return null;
    const _0x1efd5f = computeConstrainedMoveDelta({
      startPoint: { x: _0x1d254e.startPoint.x, y: _0x1d254e.startPoint.y, z: _0x1d254e.startPoint.z },
      currentPoint: _0x318ddc,
      axis: _0x1d254e?.axisWorld
        ? { x: _0x1d254e.axisWorld.x, y: _0x1d254e.axisWorld.y, z: _0x1d254e.axisWorld.z }
        : _0x1d254e?.axis
          ? { x: _0x1d254e.axis.x, y: _0x1d254e.axis.y, z: _0x1d254e.axis.z }
          : null,
      planeNormal: {
        x: _0x1d254e?.planeNormalWorld?.x ?? _0x1d254e?.planeNormal?.x,
        y: _0x1d254e?.planeNormalWorld?.y ?? _0x1d254e?.planeNormal?.y,
        z: _0x1d254e?.planeNormalWorld?.z ?? _0x1d254e?.planeNormal?.z,
      },
      mode: _0x1d254e.mode,
    });
    return _0x1efd5f;
  }
  ['pick'](_0x372598, _0x594da8) {
    if (this._isPanorama360Mode()) return null;
    if (!this._pickRoots.length) return null;
    const _0x6e0793 = this._resolvePointerRay(_0x372598, _0x594da8),
      _0x4f3f48 = _0x6e0793.intersectObjects(this._pickRoots, true);
    for (const _0x1bcbec of _0x4f3f48) {
      let _0xe291b2 = _0x1bcbec.object;
      while (_0xe291b2) {
        const _0x3c26bd = this._pickMap.get(_0xe291b2.id);
        if (_0x3c26bd)
          return {
            ..._0x3c26bd,
            point: { x: _0x1bcbec.point.x, y: _0x1bcbec.point.y, z: _0x1bcbec.point.z },
          };
        _0xe291b2 = _0xe291b2.parent;
      }
    }
    return null;
  }
  ['pickObjectsInRect'](_0x1a1fe2) {
    if (this._isPanorama360Mode()) return [];
    const _0x995af1 = this.renderer.domElement.getBoundingClientRect(),
      _0x580381 = [],
      _0x5d8895 = (_0x5b9c9a, _0x1805fc) => {
        _0x5b9c9a.forEach((_0x1cc326, _0x22dcf9) => {
          const _0x1195ca = new threeRuntime['Vector3']();
          _0x1cc326.group.getWorldPosition(_0x1195ca);
          const _0x1f25d2 = _0x1195ca.clone().project(this.camera);
          if (
            _0x1f25d2.x < -1 ||
            _0x1f25d2.x > 1 ||
            _0x1f25d2.y < -1 ||
            _0x1f25d2.y > 1 ||
            _0x1f25d2.z < -1 ||
            _0x1f25d2.z > 1
          )
            return;
          const _0x25053f = _0x995af1.left + (_0x1f25d2.x + 1) * 0.5 * _0x995af1.width,
            _0x2dd099 = _0x995af1.top + (1 - _0x1f25d2.y) * 0.5 * _0x995af1.height;
          _0x25053f >= _0x1a1fe2.left &&
            _0x25053f <= _0x1a1fe2.right &&
            _0x2dd099 >= _0x1a1fe2.top &&
            _0x2dd099 <= _0x1a1fe2.bottom &&
            _0x580381.push({ objectType: _0x1805fc, objectId: _0x22dcf9, depth: _0x1f25d2.z });
        });
      };
    return (
      _0x5d8895(this._mannequinMap, 'mannequin'),
      _0x5d8895(this._cubeMap, 'cube'),
      _0x580381.sort((_0x4c9670, _0x31a69f) => _0x4c9670.depth - _0x31a69f.depth),
      _0x580381
    );
  }
  ['intersectGround'](_0x1f0c9d, _0x570bca, _0x591d63 = 0) {
    if (this._isPanorama360Mode()) return null;
    const _0x1a387e = this._resolvePointerRay(_0x1f0c9d, _0x570bca),
      _0x1c7080 = new threeRuntime['Plane'](new threeRuntime.Vector3(0, 1, 0), -_0x591d63),
      _0x33323c = new threeRuntime['Vector3'](),
      _0xa79fae = _0x1a387e.ray.intersectPlane(_0x1c7080, _0x33323c);
    if (!_0xa79fae) return null;
    return { x: _0x33323c.x, y: _0x33323c.y, z: _0x33323c.z };
  }
  async ['_withCleanCaptureFrame'](_0x189a48) {
    const _0x1c012e = [
        this._gizmo?.root,
        this._gizmoMoveGuideLine,
        ...Array.from(this._cameraMap.values()).map((_0x5b30dc) => _0x5b30dc?.group),
      ].filter(Boolean),
      _0x488ab8 = _0x1c012e.map((_0x31f33d) => ({ object3d: _0x31f33d, visible: _0x31f33d.visible })),
      _0x1370f9 = [],
      _0xe283f0 = (_0x5d832d) => {
        if (!_0x5d832d || _0x1370f9.some((_0x336a66) => _0x336a66.material === _0x5d832d)) return;
        _0x1370f9.push({
          material: _0x5d832d,
          emissive: _0x5d832d.emissive?.isColor ? _0x5d832d.emissive.clone() : undefined,
          emissiveIntensity:
            typeof _0x5d832d.emissiveIntensity === 'number' ? _0x5d832d.emissiveIntensity : undefined,
          opacity: typeof _0x5d832d.opacity === 'number' ? _0x5d832d.opacity : undefined,
        });
      };
    (this._mannequinMap.forEach((_0x18b4ae) => {
      _0x18b4ae?.group?.traverse?.((_0x2cc1c2) => eachMaterial(_0x2cc1c2.material, _0xe283f0));
    }),
      this._cubeMap.forEach((_0x3ca46b) => {
        _0x3ca46b?.group?.traverse?.((_0xa310e9) => eachMaterial(_0xa310e9.material, _0xe283f0));
      }),
      _0x488ab8.forEach(({ object3d: _0x3cf0ba }) => {
        _0x3cf0ba.visible = false;
      }),
      this._mannequinMap.forEach((_0x2a3bc4) => applyObjectSelectionEmphasis(_0x2a3bc4?.group, false)),
      this._cubeMap.forEach((_0xc46ef4) => applyObjectSelectionEmphasis(_0xc46ef4?.group, false)));
    try {
      return await _0x189a48();
    } finally {
      (_0x488ab8.forEach(({ object3d: _0x18d4fd, visible: _0x1e2881 }) => {
        _0x18d4fd.visible = _0x1e2881;
      }),
        _0x1370f9.forEach(
          ({
            material: _0x5c443f,
            emissive: _0x435433,
            emissiveIntensity: _0x4a451f,
            opacity: _0x38e7a2,
          }) => {
            (_0x435433?.isColor && _0x5c443f.emissive?.isColor && _0x5c443f.emissive.copy(_0x435433),
              typeof _0x4a451f === 'number' && (_0x5c443f.emissiveIntensity = _0x4a451f),
              typeof _0x38e7a2 === 'number' && (_0x5c443f.opacity = _0x38e7a2),
              (_0x5c443f.needsUpdate = true));
          },
        ),
        this.requestRender());
    }
  }
  ['captureBlob']({ includeEditorOverlays: includeEditorOverlays = true } = {}) {
    const _0xbfa2a = () =>
      new Promise((_0x23d0b4, _0x112845) => {
        this.renderNow();
        const _0x34f4ce = this.renderer.domElement;
        if (typeof _0x34f4ce.toBlob === 'function') {
          _0x34f4ce.toBlob((_0x3a2fa1) => {
            if (!_0x3a2fa1) {
              _0x112845(new Error(panoramaSceneText('errors.captureExportFailed')));
              return;
            }
            _0x23d0b4(_0x3a2fa1);
          }, 'image/png');
          return;
        }
        try {
          const _0x4afade = _0x34f4ce.toDataURL('image/png'),
            [, _0x185e1b] = _0x4afade.split(','),
            _0x1bd7a6 = _0x4afade.slice(_0x4afade.indexOf(':') + 1, _0x4afade.indexOf(';')),
            _0x53e201 = atob(_0x185e1b || ''),
            _0x2e8f0c = new Uint8Array(_0x53e201.length);
          for (let _0x218f08 = 0; _0x218f08 < _0x53e201.length; _0x218f08 += 1) {
            _0x2e8f0c[_0x218f08] = _0x53e201.charCodeAt(_0x218f08);
          }
          _0x23d0b4(new Blob([_0x2e8f0c], { type: _0x1bd7a6 || 'image/png' }));
        } catch (_0x4fe657) {
          _0x112845(_0x4fe657);
        }
      });
    if (includeEditorOverlays === false) return this._withCleanCaptureFrame(_0xbfa2a);
    return _0xbfa2a();
  }
  ['sync'](_0x5dbee3) {
    this._sceneState = _0x5dbee3;
    const _0x53d5d6 = this._isPanorama360Mode(_0x5dbee3);
    (this._syncEnvironment(_0x5dbee3?.environmentMode),
      this._syncPanorama(_0x5dbee3?.panorama),
      this._syncMannequins(_0x5dbee3, _0x53d5d6),
      this._syncCubes(_0x5dbee3, _0x53d5d6),
      this._syncCameras(_0x5dbee3, _0x53d5d6),
      this._syncGizmo(_0x5dbee3, _0x53d5d6),
      this._syncPanoramaModeVisibility(_0x53d5d6),
      this._syncPanoramaCanvasVisibility(_0x53d5d6),
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
    const _0x393bf4 = this._isPanorama360Mode(this._sceneState),
      _0x405457 = this._applyRenderView();
    (!_0x393bf4 && this._syncInfiniteGrid(),
      this._applyDraftObjects(),
      !_0x393bf4 && this._applyGizmoPosition(),
      this.renderer.render(this.scene, this.camera),
      _0x405457?.keepAnimating && this.requestRender());
  }
  ['dispose']() {
    (this._rafId !== null && (cancelAnimationFrame(this._rafId), (this._rafId = null)),
      (this._panoramaLoadToken += 1),
      (this._smoothedPose = null),
      (this._lastRenderTime = 0),
      (this._viewSmoothingUntil = 0),
      this._mannequinMap.forEach((_0x58e5a5) => {
        (this.scene.remove(_0x58e5a5.group), disposeObject3D(_0x58e5a5.group));
      }),
      this._cubeMap.forEach((_0x5da532) => {
        (this.scene.remove(_0x5da532.group), disposeObject3D(_0x5da532.group));
      }),
      this._cameraMap.forEach((_0x528f34) => {
        (this.scene.remove(_0x528f34.group), disposeObject3D(_0x528f34.group));
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
  ['_syncEnvironment'](_0x1a33c3) {
    const _0xdbbb84 = _0x1a33c3 === 'night',
      _0xc5f492 = resolveThemeColor(
        _0xdbbb84 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
        _0xdbbb84 ? '--panorama-scene-fog-night' : '--panorama-scene-fog-day',
      );
    ((this.scene.background = null),
      this.renderer.setClearColor(0, 0),
      (this.scene.fog = this._isPanorama360Mode(this._sceneState)
        ? null
        : new threeRuntime.Fog(_0xc5f492, _0xdbbb84 ? 46 : 58, _0xdbbb84 ? 138 : 170)),
      (this._ambientLight.intensity = _0xdbbb84 ? 0.56 : 0.94),
      (this._keyLight.intensity = _0xdbbb84 ? 0.72 : 1.12),
      (this._rimLight.intensity = _0xdbbb84 ? 0.2 : 0.16),
      eachMaterial(this._gridMinor.material, (_0x4a7325) => {
        ((_0x4a7325.opacity = _0xdbbb84 ? 0.28 : 0.24),
          _0x4a7325.color.copy(
            resolveThemeColor(
              _0xdbbb84 ? '--panorama-scene-grid-night' : '--panorama-scene-grid-day',
              _0xdbbb84 ? '--indigo-35' : '--black-20',
            ),
          ),
          (_0x4a7325.needsUpdate = true));
      }),
      eachMaterial(this._gridMajor.material, (_0x4c506b) => {
        ((_0x4c506b.opacity = _0xdbbb84 ? 0.52 : 0.42),
          _0x4c506b.color.copy(
            resolveThemeColor(
              _0xdbbb84 ? '--panorama-scene-grid-night-major' : '--panorama-scene-grid-day-major',
              _0xdbbb84 ? '--indigo-35' : '--black-20',
            ),
          ),
          (_0x4c506b.needsUpdate = true));
      }),
      (this._ground.material.opacity = _0xdbbb84 ? 0.96 : 0.92),
      (this._ground.material.color = resolveThemeColor(
        _0xdbbb84 ? '--panorama-scene-ground-night' : '--panorama-scene-ground-day',
        _0xdbbb84 ? '--indigo-12' : '--black-10',
      )),
      (this._ground.material.needsUpdate = true));
  }
  ['_syncPanoramaModeVisibility'](_0xcb80be) {
    ((this._gridMinor.visible = !_0xcb80be),
      (this._gridMajor.visible = !_0xcb80be),
      (this._ground.visible = !_0xcb80be));
    if (!_0xcb80be) return;
    ((this._gizmo.root.visible = false),
      this.clearGizmoHandleState(),
      this._mannequinMap.forEach((_0x4144b4) => {
        ((_0x4144b4.group.visible = false), (_0x4144b4.selectionRing.visible = false));
      }),
      this._cubeMap.forEach((_0x57b3a8) => {
        ((_0x57b3a8.group.visible = false), (_0x57b3a8.selectionRing.visible = false));
      }),
      this._cameraMap.forEach((_0x2acadb) => {
        _0x2acadb.group.visible = false;
      }),
      (this._panoramaSphere.visible = Boolean(this._panoramaSphere.material?.map)));
  }
  ['_syncPanoramaCanvasVisibility'](_0x53f6e7 = this._isPanorama360Mode(this._sceneState)) {
    const _0x5c6680 = this.renderer?.domElement;
    if (!_0x5c6680) return;
    const _0x5d2349 = Boolean(this._panoramaSphere?.material?.map),
      _0x21cdad = _0x53f6e7 && !_0x5d2349;
    ((_0x5c6680.style.opacity = _0x21cdad ? '0' : '1'),
      (_0x5c6680.style.background = 'transparent'),
      (_0x5c6680.dataset.panoramaEmpty = _0x21cdad ? '1' : '0'));
  }
  ['_syncInfiniteGrid']() {
    const _0x441b2c = Number(this.camera?.position?.x) || 0,
      _0x731d5 = Number(this.camera?.position?.z) || 0,
      _0xd85b05 = computeStableGridSnap(
        _0x441b2c,
        GRID_MINOR_STEP,
        this._gridSnapState.minorX,
        GRID_SNAP_HYSTERESIS,
      ),
      _0x58b36e = computeStableGridSnap(
        _0x731d5,
        GRID_MINOR_STEP,
        this._gridSnapState.minorZ,
        GRID_SNAP_HYSTERESIS,
      ),
      _0x45ae8a = computeStableGridSnap(
        _0x441b2c,
        GRID_MAJOR_STEP,
        this._gridSnapState.majorX,
        GRID_SNAP_HYSTERESIS,
      ),
      _0x5a1f48 = computeStableGridSnap(
        _0x731d5,
        GRID_MAJOR_STEP,
        this._gridSnapState.majorZ,
        GRID_SNAP_HYSTERESIS,
      );
    ((this._gridSnapState.minorX = _0xd85b05),
      (this._gridSnapState.minorZ = _0x58b36e),
      (this._gridSnapState.majorX = _0x45ae8a),
      (this._gridSnapState.majorZ = _0x5a1f48),
      this._gridMinor.position.set(_0xd85b05, 0, _0x58b36e),
      this._gridMajor.position.set(_0x45ae8a, 0.0002, _0x5a1f48));
    const _0x2203ba = Number(this._renderPose?.distance) || 0,
      _0x15437 = Math.max(
        GRID_BASE_SPAN,
        Math.abs(Number(this.camera?.position?.y) || 0) * 26,
        _0x2203ba * 28,
      );
    (this._ground.position.set(_0x45ae8a, -0.001, _0x5a1f48), this._ground.scale.set(_0x15437, _0x15437, 1));
    const _0x449ba0 = this._sceneState?.environmentMode === 'night',
      _0x1fb1e1 = _0x449ba0 ? 0.28 : 0.24,
      _0x451de5 = _0x449ba0 ? 0.52 : 0.42,
      _0x506ca3 = Math.abs(
        Number.isFinite(this._renderPose?.pitch)
          ? this._renderPose.pitch
          : Number(this.camera?.rotation?.x) || 0,
      ),
      _0xa6243d = clamp01((_0x506ca3 - 0.08) / 0.32),
      _0x314dcf = 0.18 + 0.82 * _0xa6243d,
      _0x406dcc = clamp01((_0x2203ba - 8) / 26),
      _0x446326 = 1 - 0.52 * _0x406dcc,
      _0x1eb837 = _0x314dcf * _0x446326,
      _0x2a6444 = _0x1fb1e1 * _0x1eb837,
      _0x404467 = _0x451de5 * (0.32 + 0.68 * _0x1eb837);
    (eachMaterial(this._gridMinor.material, (_0x259ef6) => {
      _0x259ef6.opacity = _0x2a6444;
    }),
      eachMaterial(this._gridMajor.material, (_0x46ff7a) => {
        _0x46ff7a.opacity = _0x404467;
      }));
  }
  ['_syncPanorama'](_0x37eb04) {
    const _0x332c5c = normalizePanoramaTextureUrl(_0x37eb04?.imageUrl, _0x37eb04?.localPath);
    if (!_0x332c5c) {
      ((this._panoramaLoadToken += 1),
        (this._loadedPanoramaUrl = ''),
        (this._pendingPanoramaUrl = ''),
        (this._panoramaSphere.material.map = null),
        (this._panoramaSphere.material.needsUpdate = true),
        (this._panoramaSphere.visible = false),
        this._syncPanoramaCanvasVisibility());
      return;
    }
    if (_0x332c5c === this._loadedPanoramaUrl || _0x332c5c === this._pendingPanoramaUrl) return;
    this._pendingPanoramaUrl = _0x332c5c;
    const _0x2be69d = ++this._panoramaLoadToken;
    this._textureLoader.load(
      _0x332c5c,
      (_0x282d73) => {
        if (_0x2be69d !== this._panoramaLoadToken) {
          _0x282d73.dispose();
          return;
        }
        ((_0x282d73.colorSpace = threeRuntime.SRGBColorSpace),
          (_0x282d73.minFilter = threeRuntime.LinearMipmapLinearFilter),
          (_0x282d73.magFilter = threeRuntime.LinearFilter),
          (_0x282d73.generateMipmaps = true),
          (_0x282d73.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy?.() || 1)),
          (_0x282d73.needsUpdate = true),
          this._panoramaTexture && this._panoramaTexture.dispose(),
          (this._panoramaTexture = _0x282d73),
          (this._loadedPanoramaUrl = _0x332c5c),
          (this._pendingPanoramaUrl = ''),
          (this._panoramaSphere.material.map = _0x282d73),
          (this._panoramaSphere.material.needsUpdate = true),
          (this._panoramaSphere.visible = true),
          this._syncPanoramaCanvasVisibility(),
          this.onPanoramaStatusChange?.({ isLoaded: true, error: null }),
          this.requestRender());
      },
      undefined,
      () => {
        if (_0x2be69d !== this._panoramaLoadToken) return;
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
  ['_resolveMannequinColor'](_0x19c9d4) {
    const _0x1d1898 = PANORAMA_SCENE_COLOR_TOKENS[_0x19c9d4] || PANORAMA_SCENE_COLOR_TOKENS.blue;
    return resolveThemeColor(_0x1d1898, '--blue');
  }
  ['_registerPickable'](_0x51667e, _0x55182b) {
    (_0x51667e.traverse((_0x5ccbb5) => {
      this._pickMap.set(_0x5ccbb5.id, _0x55182b);
    }),
      this._pickRoots.push(_0x51667e));
  }
  ['_rebuildPickRoots']() {
    (this._pickMap.clear(),
      (this._pickRoots = []),
      this._mannequinMap.forEach((_0x496b45, _0x18e80a) => {
        this._registerPickable(_0x496b45.proxyRoot || _0x496b45.group, {
          objectType: 'mannequin',
          objectId: _0x18e80a,
        });
      }),
      this._cubeMap.forEach((_0x226b79, _0x144722) => {
        this._registerPickable(_0x226b79.group, { objectType: 'cube', objectId: _0x144722 });
      }));
  }
  ['_loadCharacterModelForVisual'](_0xd80042, _0x581a5f, _0x4bd5ba) {
    if (!_0xd80042) return;
    const _0x5155b9 = resolvePanoramaCharacterGender(_0x4bd5ba),
      _0x504a11 = (_0xd80042.modelLoadToken || 0) + 1;
    ((_0xd80042.modelLoadToken = _0x504a11),
      (_0xd80042.modelGender = _0x5155b9),
      (_0xd80042.modelLoadError = null),
      setMannequinProxyMode(_0xd80042),
      createPanoramaCharacterModelInstance(_0x5155b9)
        .then((_0x5edead) => {
          if (this._mannequinMap.get(_0x581a5f) !== _0xd80042 || _0xd80042.modelLoadToken !== _0x504a11) {
            disposeObject3D(_0x5edead);
            return;
          }
          _0xd80042.modelRoot &&
            (_0xd80042.group.remove(_0xd80042.modelRoot), disposeObject3D(_0xd80042.modelRoot));
          ((_0xd80042.modelMaterial = null),
            (_0xd80042.modelRoot = _0x5edead),
            _0xd80042.group.add(_0x5edead));
          const _0x57b803 = this._mannequinStateById.get(_0x581a5f)?.colorKey;
          (applyCharacterClayMaterial(_0xd80042, this._resolveMannequinColor(_0x57b803)),
            setMannequinProxyMode(_0xd80042),
            this._rebuildPickRoots());
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        })
        .catch((_0x2ac573) => {
          if (this._mannequinMap.get(_0x581a5f) !== _0xd80042 || _0xd80042.modelLoadToken !== _0x504a11)
            return;
          _0xd80042.modelLoadError = _0x2ac573 || new Error('Quaternius character model failed to load');
          _0xd80042.modelRoot &&
            (_0xd80042.group.remove(_0xd80042.modelRoot),
            disposeObject3D(_0xd80042.modelRoot),
            (_0xd80042.modelRoot = null));
          ((_0xd80042.modelMaterial = null), setMannequinProxyMode(_0xd80042));
          if (typeof requestAnimationFrame === 'function') this.requestRender();
        }));
  }
  ['_syncMannequins'](_0x39168f, _0x6dcf76 = false) {
    const _0x41f02c = _0x39168f?.mannequins || [],
      _0x31a20e = new Set(collectSelectedObjectIds(_0x39168f, 'mannequin')),
      _0x290480 = !_0x6dcf76,
      _0x3009f0 = new Set();
    _0x41f02c.forEach((_0x300dcf) => {
      (_0x3009f0.add(_0x300dcf.id), this._mannequinStateById.set(_0x300dcf.id, _0x300dcf));
      let _0x46b8c5 = this._mannequinMap.get(_0x300dcf.id);
      if (!_0x46b8c5)
        ((_0x46b8c5 = createMannequinVisual(this._resolveMannequinColor(_0x300dcf.colorKey))),
          this._mannequinMap.set(_0x300dcf.id, _0x46b8c5),
          this.scene.add(_0x46b8c5.group),
          this._loadCharacterModelForVisual(_0x46b8c5, _0x300dcf.id, _0x300dcf.gender));
      else
        _0x46b8c5.modelGender !== resolvePanoramaCharacterGender(_0x300dcf.gender) &&
          (_0x46b8c5.modelRoot &&
            (_0x46b8c5.group.remove(_0x46b8c5.modelRoot),
            disposeObject3D(_0x46b8c5.modelRoot),
            (_0x46b8c5.modelRoot = null)),
          this._loadCharacterModelForVisual(_0x46b8c5, _0x300dcf.id, _0x300dcf.gender));
      const _0x5a58bf = this._resolveMannequinColor(_0x300dcf.colorKey);
      (_0x46b8c5.material.color.copy(_0x5a58bf),
        _0x46b8c5.headMaterial.color.copy(_0x5a58bf.clone().offsetHSL(0, 0, 0.08)),
        applyGenderShape(_0x46b8c5, _0x300dcf.gender));
      const _0x2ac4c5 = this._draftObjects.get('mannequin:' + _0x300dcf.id);
      (applyGroupTransform(_0x46b8c5.group, _0x2ac4c5 || _0x300dcf),
        (_0x46b8c5.group.position.y = _0x2ac4c5?.position?.y ?? _0x300dcf.position.y ?? 0),
        applyGroupScale(_0x46b8c5.group, _0x2ac4c5?.scale ?? _0x300dcf.scale ?? 1));
      const _0x1c44dc = _0x290480 && _0x39168f?.ui?.isEditing === true && _0x31a20e.has(_0x300dcf.id);
      ((_0x46b8c5.group.visible = _0x290480),
        (_0x46b8c5.selectionRing.visible = false),
        setMannequinProxyMode(_0x46b8c5),
        applyCharacterClayMaterial(_0x46b8c5, _0x5a58bf),
        applySelectionEmphasis(_0x46b8c5.material, _0x1c44dc, 0.18),
        applySelectionEmphasis(_0x46b8c5.headMaterial, _0x1c44dc, 0.26),
        applyObjectSelectionEmphasis(_0x46b8c5.modelRoot, _0x1c44dc, 0.12));
    });
    for (const [_0x3af543, _0x3c3a4c] of this._mannequinMap.entries()) {
      if (_0x3009f0.has(_0x3af543)) continue;
      (this.scene.remove(_0x3c3a4c.group),
        disposeObject3D(_0x3c3a4c.group),
        this._mannequinMap.delete(_0x3af543),
        this._mannequinStateById.delete(_0x3af543));
    }
    this._rebuildPickRoots();
  }
  ['_syncCubes'](_0x295382, _0x40b420 = false) {
    const _0x2f18d2 = _0x295382?.cubes || [],
      _0x29f7f8 = new Set(collectSelectedObjectIds(_0x295382, 'cube')),
      _0x3af657 = !_0x40b420,
      _0x807312 = new Set();
    _0x2f18d2.forEach((_0x120864) => {
      (_0x807312.add(_0x120864.id), this._cubeStateById.set(_0x120864.id, _0x120864));
      let _0x4af6ef = this._cubeMap.get(_0x120864.id);
      !_0x4af6ef &&
        ((_0x4af6ef = createCubeVisual(this._resolveMannequinColor(_0x120864.colorKey))),
        this._cubeMap.set(_0x120864.id, _0x4af6ef),
        this.scene.add(_0x4af6ef.group));
      const _0xac5775 = this._resolveMannequinColor(_0x120864.colorKey);
      (_0x4af6ef.material.color.copy(_0xac5775),
        _0x4af6ef.edgeMaterial.color.copy(_0xac5775.clone().offsetHSL(0, 0, -0.18)));
      const _0x253883 = this._draftObjects.get('cube:' + _0x120864.id),
        _0x31fc1a = _0x253883 || _0x120864;
      (applyGroupTransform(_0x4af6ef.group, _0x31fc1a),
        (_0x4af6ef.group.position.y = Number(_0x31fc1a?.position?.y) || 0),
        applyGroupScale(_0x4af6ef.group, _0x31fc1a?.scale ?? _0x120864?.scale ?? 1));
      const _0x5dd5c3 = _0x3af657 && _0x295382?.ui?.isEditing === true && _0x29f7f8.has(_0x120864.id);
      ((_0x4af6ef.group.visible = _0x3af657),
        (_0x4af6ef.selectionRing.visible = false),
        applySelectionEmphasis(_0x4af6ef.material, _0x5dd5c3, 0.22),
        (_0x4af6ef.edgeMaterial.opacity = _0x5dd5c3 ? 1 : 0.9));
    });
    for (const [_0x1f591b, _0x2c1f86] of this._cubeMap.entries()) {
      if (_0x807312.has(_0x1f591b)) continue;
      (this.scene.remove(_0x2c1f86.group),
        disposeObject3D(_0x2c1f86.group),
        this._cubeMap.delete(_0x1f591b),
        this._cubeStateById.delete(_0x1f591b));
    }
    this._rebuildPickRoots();
  }
  ['_syncCameras'](_0x589451, _0x47c5ab = false) {
    const _0x1d6378 = Array.isArray(_0x589451?.cameras) ? _0x589451.cameras : [],
      _0x3c98ef =
        _0x589451?.viewport?.activeView === 'camera' && _0x589451?.viewport?.activeCameraId
          ? String(_0x589451.viewport.activeCameraId)
          : null,
      _0x4b757c =
        this._draftView?.kind === 'camera' && this._draftView?.cameraId
          ? String(this._draftView.cameraId)
          : null,
      _0x2a124a =
        !_0x47c5ab &&
        _0x1d6378.some((_0x3d9e39) => {
          if (!_0x3d9e39?.id) return false;
          const _0x2a17ff = normalizeCameraPoseData(_0x3d9e39),
            _0x11a2d6 = cameraPoseToSceneViewFromReference(_0x2a17ff, _0x589451?.viewport?.sceneView);
          return areSceneViewsEquivalent(_0x589451?.viewport?.sceneView, _0x11a2d6);
        }),
      _0x263e5b = Boolean(_0x3c98ef || _0x4b757c || _0x2a124a),
      _0x206c6e = !_0x47c5ab && !_0x263e5b,
      _0x11092f = new Set();
    _0x1d6378.forEach((_0x261259) => {
      if (!_0x261259?.id) return;
      const _0x5aaab9 = String(_0x261259.id);
      (_0x11092f.add(_0x5aaab9), this._cameraStateById.set(_0x5aaab9, _0x261259));
      let _0x74e7a3 = this._cameraMap.get(_0x5aaab9);
      !_0x74e7a3 &&
        ((_0x74e7a3 = createCameraVisual()),
        this._cameraMap.set(_0x5aaab9, _0x74e7a3),
        this.scene.add(_0x74e7a3.group));
      const _0x1570fd = normalizeCameraPoseData(_0x261259);
      (_0x74e7a3.group.position.set(_0x1570fd.position.x, _0x1570fd.position.y, _0x1570fd.position.z),
        _0x74e7a3.group.quaternion.set(
          _0x1570fd.quaternion.x,
          _0x1570fd.quaternion.y,
          _0x1570fd.quaternion.z,
          _0x1570fd.quaternion.w,
        ),
        (_0x74e7a3.group.visible = _0x206c6e));
    });
    for (const [_0x40a4fd, _0x3ec161] of this._cameraMap.entries()) {
      if (_0x11092f.has(_0x40a4fd)) continue;
      (this.scene.remove(_0x3ec161.group),
        disposeObject3D(_0x3ec161.group),
        this._cameraMap.delete(_0x40a4fd),
        this._cameraStateById.delete(_0x40a4fd));
    }
  }
  ['_resolveGizmoContext'](_0x52393b) {
    const _0x3de35b = collectSelectedObjects(_0x52393b);
    if (_0x3de35b.length === 0) return null;
    const _0x243be6 = resolveActiveTransformTool(_0x52393b),
      _0x51cbfa = _0x3de35b
        .map((_0x26463d) => ({
          objectType: _0x26463d.objectType,
          id: _0x26463d.objectId,
          item:
            this._draftObjects.get(_0x26463d.objectType + ':' + _0x26463d.objectId) ||
            this._getObjectStateByObjectType(_0x26463d.objectType, _0x26463d.objectId),
          visual: this._getVisualByObjectType(_0x26463d.objectType, _0x26463d.objectId),
        }))
        .filter((_0x3f47da) => !!_0x3f47da.visual && !!_0x3f47da.item);
    if (_0x51cbfa.length === 0) return null;
    _0x51cbfa.forEach((_0x29e53e) => {
      ((_0x29e53e.pivotWorld = resolveObjectToolPivot(
        _0x29e53e.item,
        _0x29e53e.visual,
        _0x243be6,
        _0x29e53e.objectType,
      )),
        (_0x29e53e.orientationQuaternion = resolveObjectOrientationQuaternion(
          _0x29e53e.item,
          _0x29e53e.visual,
        )));
    });
    const _0x281673 =
        _0x52393b?.selection?.selectedObjectType === 'cube' ||
        _0x52393b?.selection?.selectedObjectType === 'mannequin'
          ? _0x52393b.selection.selectedObjectType
          : null,
      _0xd5c0ea = _0x52393b?.selection?.selectedObjectId || null,
      _0x4f26d3 =
        _0xd5c0ea && _0x281673
          ? _0x51cbfa.find((_0xdab524) => _0xdab524.objectType === _0x281673 && _0xdab524.id === _0xd5c0ea) ||
            null
          : null,
      _0x25a9ba = _0x4f26d3 || _0x51cbfa[0],
      _0x1b2708 = new threeRuntime['Vector3'](),
      _0x335036 = _0x51cbfa.length > 1;
    if (_0x335036)
      (_0x51cbfa.forEach((_0x320c56) => {
        _0x1b2708.add(_0x320c56.pivotWorld);
      }),
        _0x1b2708.multiplyScalar(1 / _0x51cbfa.length));
    else _0x25a9ba?.pivotWorld && _0x1b2708.copy(_0x25a9ba.pivotWorld);
    const _0x5bb504 = _0x335036
        ? measureVisualBoundsForSelection(_0x51cbfa) || createFallbackBounds()
        : measureVisualBounds(_0x25a9ba.visual) || createFallbackBounds(),
      _0x1e6c41 = computeGizmoWorldMetrics(_0x5bb504),
      { orientationQuaternion: _0x47aff4, usesLocalOrientation: _0x499f82 } =
        resolveSelectionGizmoOrientation(_0x51cbfa, _0x25a9ba, _0x335036),
      _0x3e4e16 = _0x25a9ba?.objectType || null,
      _0x2607a3 = _0x51cbfa
        .filter((_0x3691f9) => _0x3691f9.objectType === _0x3e4e16)
        .map((_0x524028) => _0x524028.id);
    return {
      selectedObjectType: _0x3e4e16,
      selectedIds: _0x2607a3,
      selectedObjects: _0x51cbfa.map((_0xa0a61c) => ({
        objectType: _0xa0a61c.objectType,
        objectId: _0xa0a61c.id,
      })),
      selectedVisuals: _0x51cbfa,
      activeEntry: _0x25a9ba,
      isMultiSelection: _0x335036,
      pivot: _0x1b2708.clone(),
      position: _0x1b2708.clone(),
      orientationQuaternion: _0x47aff4,
      usesLocalOrientation: _0x499f82,
      bounds: _0x5bb504,
      gizmoWorldMetrics: _0x1e6c41,
    };
  }
  ['_computeWorldUnitsPerPixelAt'](_0x39c3af) {
    if (!_0x39c3af || !this.camera?.position) return 0;
    const _0x28abe1 = Math.max(0.001, this.camera.position.distanceTo(_0x39c3af)),
      _0xa618ca = ((Number(this.camera?.fov) || 58) * Math.PI) / 180,
      _0x547054 = Math.max(
        1,
        Number(this.renderer?.domElement?.clientHeight) || Number(this.renderer?.domElement?.height) || 1,
      ),
      _0x361784 = 2 * Math.tan(_0xa618ca / 2) * _0x28abe1;
    return _0x361784 / _0x547054;
  }
  ['_computeScreenConstantGizmoScale'](_0x57c33b, _0x1953ea = 104) {
    const _0x4005db = this._computeWorldUnitsPerPixelAt(_0x57c33b);
    if (!(_0x4005db > 0)) return 1;
    return Math.max(0.35, Math.min(6, _0x4005db * _0x1953ea));
  }
  ['_captureGizmoDragLock'](_0x13ebc4) {
    if (!this._gizmo || !_0x13ebc4) return null;
    const _0x5c61c8 = this._gizmo.root.position.clone(),
      _0x21c168 = this._gizmo.root.quaternion.clone(),
      _0x3fcef2 = {
        box: _0x13ebc4.bounds?.box?.clone?.() || createFallbackBounds().box,
        size: _0x13ebc4.bounds?.size?.clone?.() || new threeRuntime['Vector3'](1, 1, 1),
        sphere: _0x13ebc4.bounds?.sphere
          ? new threeRuntime['Sphere'](
              _0x13ebc4.bounds.sphere.center?.clone?.() || new threeRuntime['Vector3'](),
              Number(_0x13ebc4.bounds.sphere.radius) || 0,
            )
          : new threeRuntime['Sphere'](new threeRuntime['Vector3'](0, 0.5, 0), Math.sqrt(0.75)),
        extents: {
          x: Number(_0x13ebc4.bounds?.extents?.x) || 0,
          y: Number(_0x13ebc4.bounds?.extents?.y) || 0,
          z: Number(_0x13ebc4.bounds?.extents?.z) || 0,
        },
      },
      _0x49bec6 = {
        extents: {
          x: Number(_0x13ebc4.gizmoWorldMetrics?.extents?.x) || 0,
          y: Number(_0x13ebc4.gizmoWorldMetrics?.extents?.y) || 0,
          z: Number(_0x13ebc4.gizmoWorldMetrics?.extents?.z) || 0,
        },
        sphereRadius: Number(_0x13ebc4.gizmoWorldMetrics?.sphereRadius) || 0.01,
        margin: Number(_0x13ebc4.gizmoWorldMetrics?.margin) || GIZMO_MARGIN_WORLD_MIN,
      },
      _0x4aba1d = {
        ..._0x13ebc4,
        position: _0x5c61c8,
        pivot: _0x13ebc4.pivot?.clone?.() || _0x5c61c8.clone(),
        orientationQuaternion: _0x21c168,
        bounds: _0x3fcef2,
        gizmoWorldMetrics: _0x49bec6,
      },
      _0x463f21 = this._computeScreenConstantGizmoScale(_0x5c61c8);
    return (
      (this._gizmo.dragLock = {
        context: _0x4aba1d,
        position: _0x5c61c8.clone(),
        orientationQuaternion: _0x21c168.clone(),
        bounds: _0x3fcef2,
        gizmoWorldMetrics: _0x49bec6,
        scale: _0x463f21,
      }),
      this._gizmo.dragLock
    );
  }
  ['_applyGizmoLayoutFromContext'](_0x3c741a, _0x2c2b18) {
    const _0x4bf2cc = this._gizmo?.baseLayout,
      _0x270caf = _0x3c741a?.gizmoWorldMetrics;
    if (!_0x4bf2cc || !_0x270caf) return;
    const _0x17c857 = _0x270caf.extents,
      _0x466952 = _0x270caf.margin,
      _0x341cbc = Math.max(0.01, Number(_0x270caf.maxExtent) || 0.01),
      _0x394550 = Math.max(0.001, Number(_0x2c2b18) || 1),
      _0x474e4b = GIZMO_MOVE_HEAD_LENGTH * 0.5,
      _0x1463d3 = GIZMO_SCALE_HEAD_SIZE * 0.5,
      _0x512497 = GIZMO_MOVE_PICK_LENGTH - GIZMO_BASE_AXIS_LENGTH,
      _0x26a370 = GIZMO_SCALE_PICK_LENGTH - GIZMO_BASE_SCALE_LENGTH,
      _0x147dbc = { x: _0x17c857.x + _0x466952, y: _0x17c857.y + _0x466952, z: _0x17c857.z + _0x466952 };
    (['x', 'y', 'z'].forEach((_0x5cdc02) => {
      const _0x367797 = this._gizmo?.moveAxes?.[_0x5cdc02],
        _0x153b53 = this._gizmo?.scaleAxes?.[_0x5cdc02],
        _0x26d91d = Math.max(_0x4bf2cc.axisLength, _0x147dbc[_0x5cdc02] / _0x394550),
        _0x32b5bb = Math.max(GIZMO_MOVE_SHAFT_LENGTH, _0x26d91d - _0x474e4b),
        _0x1f6612 = Math.max(GIZMO_MOVE_PICK_LENGTH, _0x26d91d + _0x512497);
      _0x367797?.shaftLine && setAxisLineEnd(_0x367797.shaftLine, _0x5cdc02, _0x32b5bb);
      _0x367797?.headMesh && setAxisHandleLayout(_0x367797.headMesh, _0x26d91d - _0x474e4b, _0x474e4b);
      _0x367797?.pickMesh &&
        (setAxisHandleLayout(_0x367797.pickMesh, _0x1f6612 * 0.5),
        _0x367797.pickMesh.scale.set(1, _0x1f6612 / GIZMO_MOVE_PICK_LENGTH, 1));
      const _0x3f735d = _0x4bf2cc.scaleLength,
        _0xc429b6 = Math.max(GIZMO_SCALE_SHAFT_LENGTH, _0x3f735d - _0x1463d3),
        _0x1e8b0d = Math.max(GIZMO_SCALE_PICK_LENGTH, _0x3f735d + _0x26a370);
      (_0x153b53?.shaftLine && setAxisLineEnd(_0x153b53.shaftLine, _0x5cdc02, _0xc429b6),
        _0x153b53?.headMesh && setAxisHandleLayout(_0x153b53.headMesh, _0x3f735d - _0x1463d3, _0x1463d3),
        _0x153b53?.pickMesh &&
          (setAxisHandleLayout(_0x153b53.pickMesh, _0x1e8b0d * 0.5),
          _0x153b53.pickMesh.scale.set(1, _0x1e8b0d / GIZMO_SCALE_PICK_LENGTH, 1)));
    }),
      ['x', 'y', 'z'].forEach((_0x465348) => {
        const _0xecb2c2 = this._gizmo?.rotateRings?.[_0x465348];
        if (_0xecb2c2?.group) _0xecb2c2.group.scale.setScalar(1);
      }));
    const _0x346950 = Math.max(_0x4bf2cc.planeOffset * 0.5, _0x466952 * 0.42),
      _0x28323a = Math.max(_0x4bf2cc.planeOffset, (_0x17c857.x + _0x346950) / _0x394550),
      _0x4e5e12 = Math.max(_0x4bf2cc.planeOffset, (_0x17c857.y + _0x346950) / _0x394550),
      _0x193ae2 = Math.max(_0x4bf2cc.planeOffset, (_0x17c857.z + _0x346950) / _0x394550),
      _0x20ef5f = _0x4bf2cc.planeSize * 0.86,
      _0x35af15 = Math.max(_0x4bf2cc.planeSize * 1.2, (_0x341cbc / _0x394550) * 0.32),
      _0x494ec9 = (_0x19586a, _0xdc0a1a) =>
        Math.max(_0x20ef5f, Math.min(_0x35af15, Math.min(_0x19586a, _0xdc0a1a) * 0.34)),
      _0x267310 = _0x494ec9(_0x28323a, _0x4e5e12),
      _0x348693 = _0x494ec9(_0x28323a, _0x193ae2),
      _0x21c7f6 = _0x494ec9(_0x4e5e12, _0x193ae2),
      _0xf640c6 = Math.max(_0x4bf2cc.planeSize * 0.18, _0x466952 * 0.28) / _0x394550,
      _0xabd4d7 = (_0x4485e1, _0x908fd5, _0x3e1702, _0x3c737e, _0x4ea506, _0x5b857d = 1, _0x5565b4 = 1) => {
        if (!_0x4485e1) return;
        const _0x407193 = _0x4ea506 / Math.max(0.001, _0x4bf2cc.planeSize);
        (_0x4485e1.visualGroup &&
          (_0x4485e1.visualGroup.position.set(_0x908fd5, _0x3e1702, _0x3c737e),
          _0x4485e1.visualGroup.scale.set(_0x5b857d * _0x407193, _0x5565b4 * _0x407193, _0x407193)),
          _0x4485e1.pickMesh &&
            (_0x4485e1.pickMesh.position.set(_0x908fd5, _0x3e1702, _0x3c737e),
            _0x4485e1.pickMesh.scale.setScalar(_0x407193)));
      },
      _0x9de507 = (_0x503bff, _0x277b95) => {
        const _0x24964e = _0x503bff?.[_0x277b95 + 'xy'];
        _0x24964e && _0xabd4d7(_0x24964e, _0x28323a, _0x4e5e12, _0xf640c6, _0x267310, 1, 1);
        const _0x5a77cc = _0x503bff?.[_0x277b95 + 'xz'];
        _0x5a77cc && _0xabd4d7(_0x5a77cc, _0x28323a, _0xf640c6, _0x193ae2, _0x348693, 1, 1);
        const _0x5834a6 = _0x503bff?.[_0x277b95 + 'yz'];
        _0x5834a6 && _0xabd4d7(_0x5834a6, _0xf640c6, _0x4e5e12, _0x193ae2, _0x21c7f6, 1, 1);
      };
    (_0x9de507(this._gizmo?.planeHandles, 'plane-'),
      _0x9de507(this._gizmo?.scalePlaneHandles, 'scale-plane-'));
  }
  ['_applyGizmoOrientationFromContext'](_0x61e33e) {
    if (!this._gizmo?.root?.quaternion) return;
    if (!_0x61e33e) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (_0x61e33e.isMultiSelection && _0x61e33e.usesLocalOrientation !== true) {
      this._gizmo.root.quaternion.identity();
      return;
    }
    if (_0x61e33e.orientationQuaternion) {
      this._gizmo.root.quaternion.copy(_0x61e33e.orientationQuaternion);
      return;
    }
    this._gizmo.root.quaternion.identity();
  }
  ['_syncGizmo'](_0x236195, _0x98eb98 = false) {
    if (_0x98eb98 || _0x236195?.mode !== 'scene') {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    if (!_0x236195?.ui?.isEditing) {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const _0x4289c9 = resolveActiveTransformTool(_0x236195);
    ((this._gizmo.currentTool = _0x4289c9),
      (this._gizmo.root.visible = _0x4289c9 === 'move' || _0x4289c9 === 'rotate' || _0x4289c9 === 'scale'));
    if (!this._gizmo.root.visible) {
      (this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const _0x57367b = buildTransformSelectionSignature(_0x236195);
    if (!_0x57367b) {
      ((this._gizmo.root.visible = false), this._clearStableGizmoContext(), this.clearGizmoHandleState());
      return;
    }
    const _0x4fecad = this._resolveGizmoContext(_0x236195),
      _0x34b865 = _0x4fecad || this._resolveStableGizmoContext(_0x236195);
    if (!_0x34b865) {
      ((this._gizmo.root.visible = false), this.clearGizmoHandleState());
      return;
    }
    (_0x4fecad && this._cacheStableGizmoContext(_0x236195, _0x4fecad),
      (this._gizmo.moveGroup.visible = _0x4289c9 === 'move'),
      (this._gizmo.rotateGroup.visible = _0x4289c9 === 'rotate'),
      (this._gizmo.scaleGroup.visible = _0x4289c9 === 'scale'),
      this._gizmo.root.position.copy(_0x34b865.position),
      this._applyGizmoOrientationFromContext(_0x34b865),
      this._applyGizmoHighlight());
  }
  ['_applyGizmoPosition']() {
    if (!this._sceneState?.ui?.isEditing) return;
    if (!this._gizmo.root.visible) return;
    const _0x35d0e8 = this._gizmo.dragLock;
    if (_0x35d0e8) {
      (this._gizmo.root.position.copy(_0x35d0e8.position),
        this._gizmo.root.quaternion.copy(_0x35d0e8.orientationQuaternion),
        this._gizmo.root.scale.setScalar(_0x35d0e8.scale),
        this._applyGizmoLayoutFromContext(_0x35d0e8.context, _0x35d0e8.scale));
      return;
    }
    const _0x5bb47b = this._resolveGizmoContext(this._sceneState),
      _0x43fcf7 = _0x5bb47b || this._resolveStableGizmoContext(this._sceneState);
    if (!_0x43fcf7) return;
    _0x5bb47b && this._cacheStableGizmoContext(this._sceneState, _0x5bb47b);
    (this._gizmo.root.position.copy(_0x43fcf7.position), this._applyGizmoOrientationFromContext(_0x43fcf7));
    const _0x4450d9 = this._computeScreenConstantGizmoScale(_0x43fcf7.position);
    (this._gizmo.root.scale.setScalar(_0x4450d9), this._applyGizmoLayoutFromContext(_0x43fcf7, _0x4450d9));
  }
  ['_applyGizmoHighlight']() {
    const _0x1073e7 = this._gizmo?.hoverHandle || null,
      _0x4d0813 = this._gizmo?.activeHandle || null,
      _0x4a85a8 = (_0x2d41da) => {
        const _0x7cfb1f = new Set();
        if (!_0x2d41da) return _0x7cfb1f;
        _0x7cfb1f.add(_0x2d41da);
        const _0x23d02a = this._gizmo?.handles?.get?.(_0x2d41da) || null;
        return (
          _0x23d02a?.mode === 'plane' &&
            (_0x23d02a.linkedAxes || []).forEach((_0x3ad386) => {
              if (_0x3ad386) _0x7cfb1f.add('axis-' + _0x3ad386);
            }),
          _0x7cfb1f
        );
      },
      _0x249056 = _0x4a85a8(_0x4d0813),
      _0x3a51f6 = _0x4a85a8(_0x1073e7);
    this._gizmo?.handles?.forEach((_0x496612, _0x409c65) => {
      const _0x1a0218 = _0x249056.has(_0x409c65),
        _0x3a2451 = !_0x1a0218 && _0x3a51f6.has(_0x409c65),
        _0x11332a = _0x1a0218 ? 0.52 : _0x3a2451 ? 0.3 : 0,
        _0x358e44 = _0x1a0218 ? 1 : _0x3a2451 ? 0.92 : 0.8;
      (_0x496612.visuals || []).forEach((_0x180e0f) => {
        const _0x484c43 = _0x180e0f?.material,
          _0x49a758 = _0x180e0f?.color;
        if (!_0x484c43?.color || !_0x49a758) return;
        (_0x484c43.color.copy(_0x49a758).lerp(new threeRuntime.Color(0xffffff), _0x11332a),
          typeof _0x180e0f.opacity === 'number' &&
            'opacity' in _0x484c43 &&
            (_0x484c43.opacity = _0x180e0f.opacity * _0x358e44),
          (_0x484c43.needsUpdate = true));
      });
    });
  }
  ['_applyRenderView']() {
    const _0x3bc3cd = this._resolveTargetRenderPose(),
      _0x26390a = performance.now(),
      _0x33f238 = this._shouldSmoothTargetPose(_0x3bc3cd, _0x26390a),
      _0x20f325 = _0x33f238 ? this._applyPoseSmoothing(_0x3bc3cd, _0x26390a) : cloneRenderPose(_0x3bc3cd),
      _0x402b08 = _0x33f238 && measurePoseDistance(_0x20f325, _0x3bc3cd) > POSE_SETTLE_EPSILON;
    return (
      (!_0x33f238 || !_0x402b08) &&
        ((this._smoothedPose = cloneRenderPose(_0x3bc3cd)), (this._lastRenderTime = _0x26390a)),
      (this._renderPose = _0x20f325),
      this._commitCameraFromPose(_0x20f325),
      { keepAnimating: _0x402b08 }
    );
  }
  ['_resolveTargetRenderPose']() {
    const _0x8795ff = this._sceneState,
      _0x1c175e = this._draftView,
      _0x5b76bb = this._isPanorama360Mode(_0x8795ff);
    let _0x2bab4e;
    if (_0x5b76bb) {
      const _0xed22a6 =
        _0x1c175e?.kind === 'panorama-default'
          ? _0x1c175e.panoramaView || _0x8795ff?.viewport?.panoramaView
          : _0x8795ff?.viewport?.panoramaView;
      _0x2bab4e = resolvePanoramaViewPose(_0xed22a6, { x: 0, y: 0, z: 0 });
    } else {
      if (_0x1c175e?.kind === 'camera') {
        const _0x1cb46b = normalizeCameraPoseData(_0x1c175e);
        _0x2bab4e = {
          kind: 'camera',
          position: _0x1cb46b.position,
          quaternion: _0x1cb46b.quaternion,
          rotation: _0x1cb46b.rotation,
          fov: _0x1cb46b.fov,
        };
      } else {
        if (_0x1c175e?.kind === 'scene-default')
          _0x2bab4e = resolveSceneCameraPose(
            _0x1c175e.sceneView || _0x8795ff.viewport.sceneView,
            Number.isFinite(Number(_0x1c175e.fov))
              ? Number(_0x1c175e.fov)
              : focalLengthToFov(this._defaultSceneFocalLength),
          );
        else {
          if (_0x1c175e?.kind === 'panorama-default')
            _0x2bab4e = resolvePanoramaViewPose(_0x1c175e.panoramaView || _0x8795ff.viewport.panoramaView);
          else {
            if (_0x8795ff.mode === 'panorama')
              _0x2bab4e = resolvePanoramaViewPose(_0x8795ff.viewport.panoramaView);
            else
              _0x8795ff?.viewport?.activeView === 'camera' && _0x8795ff?.viewport?.activeCameraId
                ? (_0x2bab4e = resolveSceneCameraPose(
                    _0x8795ff.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ))
                : (_0x2bab4e = resolveSceneCameraPose(
                    _0x8795ff.viewport.sceneView,
                    focalLengthToFov(this._defaultSceneFocalLength),
                  ));
          }
        }
      }
    }
    return _0x2bab4e;
  }
  ['_shouldSmoothTargetPose'](_0x41c91e, _0x1d6197 = performance.now()) {
    if (this._draftView?.disableSmoothing === true) return false;
    if (!_0x41c91e || _0x41c91e.kind === 'camera') return false;
    if (_0x1d6197 <= (this._viewSmoothingUntil || 0)) return true;
    if (!this._smoothedPose || this._smoothedPose.kind !== _0x41c91e.kind) return false;
    return measurePoseDistance(this._smoothedPose, _0x41c91e) > POSE_SETTLE_EPSILON;
  }
  ['_applyPoseSmoothing'](_0x1fa06d, _0x4f57a7 = performance.now()) {
    if (!this._smoothedPose || this._smoothedPose.kind !== _0x1fa06d.kind)
      return (
        (this._smoothedPose = cloneRenderPose(_0x1fa06d)),
        (this._lastRenderTime = _0x4f57a7),
        cloneRenderPose(_0x1fa06d)
      );
    const _0x5e719c = Math.min(
      VIEW_DAMPING_MAX_DT_MS,
      Math.max(0, _0x4f57a7 - (this._lastRenderTime || _0x4f57a7)),
    );
    this._lastRenderTime = _0x4f57a7;
    const _0x363b64 = this._smoothedPose;
    if (_0x1fa06d.kind === 'panorama-default')
      return (
        (_0x363b64.position.x = dampScalar(
          _0x363b64.position.x,
          _0x1fa06d.position.x,
          _0x5e719c,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (_0x363b64.position.y = dampScalar(
          _0x363b64.position.y,
          _0x1fa06d.position.y,
          _0x5e719c,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (_0x363b64.position.z = dampScalar(
          _0x363b64.position.z,
          _0x1fa06d.position.z,
          _0x5e719c,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (_0x363b64.yaw = dampAngle(_0x363b64.yaw, _0x1fa06d.yaw, _0x5e719c, VIEW_DAMPING_TIME_CONSTANT_MS)),
        (_0x363b64.pitch = dampScalar(
          _0x363b64.pitch,
          _0x1fa06d.pitch,
          _0x5e719c,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (_0x363b64.fov = dampScalar(_0x363b64.fov, _0x1fa06d.fov, _0x5e719c, VIEW_DAMPING_TIME_CONSTANT_MS)),
        cloneRenderPose(_0x363b64)
      );
    return (
      (_0x363b64.position.x = dampScalar(
        _0x363b64.position.x,
        _0x1fa06d.position.x,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.position.y = dampScalar(
        _0x363b64.position.y,
        _0x1fa06d.position.y,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.position.z = dampScalar(
        _0x363b64.position.z,
        _0x1fa06d.position.z,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.target.x = dampScalar(
        _0x363b64.target.x,
        _0x1fa06d.target.x,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.target.y = dampScalar(
        _0x363b64.target.y,
        _0x1fa06d.target.y,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.target.z = dampScalar(
        _0x363b64.target.z,
        _0x1fa06d.target.z,
        _0x5e719c,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (_0x363b64.fov = dampScalar(_0x363b64.fov, _0x1fa06d.fov, _0x5e719c, VIEW_DAMPING_TIME_CONSTANT_MS)),
      (_0x363b64.yaw = _0x1fa06d.yaw),
      (_0x363b64.pitch = _0x1fa06d.pitch),
      (_0x363b64.distance = _0x1fa06d.distance),
      cloneRenderPose(_0x363b64)
    );
  }
  ['_commitCameraFromPose'](_0xbdc6eb) {
    if (!_0xbdc6eb) return;
    const _0x551fc4 = _0xbdc6eb?.kind === 'panorama-default' ? 55 : 58;
    ((this.camera.fov = Number.isFinite(Number(_0xbdc6eb?.fov)) ? Number(_0xbdc6eb.fov) : _0x551fc4),
      this.camera.updateProjectionMatrix());
    if (_0xbdc6eb.kind === 'camera') {
      const _0x27817c = normalizeCameraPoseData(_0xbdc6eb);
      (this.camera.position.set(_0x27817c.position.x, _0x27817c.position.y, _0x27817c.position.z),
        this.camera.quaternion.set(
          _0x27817c.quaternion.x,
          _0x27817c.quaternion.y,
          _0x27817c.quaternion.z,
          _0x27817c.quaternion.w,
        ));
      return;
    }
    if (_0xbdc6eb.kind === 'panorama-default') {
      const _0x1bdd2f = forwardVectorFromYawPitch(_0xbdc6eb.yaw, _0xbdc6eb.pitch);
      (this.camera.position.set(0, 0, 0), this.camera.lookAt(_0x1bdd2f.x, _0x1bdd2f.y, _0x1bdd2f.z));
      return;
    }
    (this.camera.position.set(_0xbdc6eb.position.x, _0xbdc6eb.position.y, _0xbdc6eb.position.z),
      this.camera.lookAt(_0xbdc6eb.target.x, _0xbdc6eb.target.y, _0xbdc6eb.target.z));
  }
  ['_applyDraftObjects']() {
    if (!this._sceneState) return;
    (this._mannequinMap.forEach((_0x28a6b2, _0x49809a) => {
      const _0xe152ae = this._mannequinStateById.get(_0x49809a);
      if (!_0xe152ae) return;
      const _0x5d26b7 = this._draftObjects.get('mannequin:' + _0x49809a),
        _0x406ea6 = _0x5d26b7 || _0xe152ae;
      (applyGroupTransform(_0x28a6b2.group, _0x406ea6),
        (_0x28a6b2.group.position.y = Number(_0x406ea6?.position?.y) || 0),
        applyGroupScale(_0x28a6b2.group, _0x406ea6?.scale ?? _0xe152ae?.scale ?? 1));
    }),
      this._cubeMap.forEach((_0x164249, _0x348758) => {
        const _0x2fae1a = this._cubeStateById.get(_0x348758);
        if (!_0x2fae1a) return;
        const _0x23fc32 = this._draftObjects.get('cube:' + _0x348758),
          _0x57091d = _0x23fc32 || _0x2fae1a;
        (applyGroupTransform(_0x164249.group, _0x57091d),
          (_0x164249.group.position.y = Number(_0x57091d?.position?.y) || 0),
          applyGroupScale(_0x164249.group, _0x57091d?.scale ?? _0x2fae1a?.scale ?? 1));
      }));
  }
  ['_getObjectStateByObjectType'](_0xae93da, _0x4926b2) {
    if (_0xae93da === 'cube') return this._cubeStateById.get(_0x4926b2) || null;
    if (_0xae93da === 'mannequin') return this._mannequinStateById.get(_0x4926b2) || null;
    return null;
  }
  ['_getVisualByObjectType'](_0x529348, _0x38e950) {
    if (_0x529348 === 'cube') return this._cubeMap.get(_0x38e950);
    if (_0x529348 === 'mannequin') return this._mannequinMap.get(_0x38e950);
    return null;
  }
}
