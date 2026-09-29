import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  computePerspectiveFrameDistance,
} from '../../core/panoramaSceneMath.js';
import { estimateSceneContentBounds } from '../panoramaSceneNode/scene3dCameraNavigation.js';
import { normalizeTransformInteractionOptions } from '../panoramaSceneNode/transformInteractionAdapter.js';
const DEFAULT_SCENE_VIEW = Object['freeze']({
  target: Object['freeze']({ x: 0x0, y: 1.2, z: 0x0 }),
  orbitYaw: Math['PI'] / 0x4,
  orbitPitch: 0.35,
  orbitDistance: 0x8,
});
function finite(_0x3d761e, _0x5f7ba9 = 0x0) {
  const _0x3b30df = Number(_0x3d761e);
  return Number['isFinite'](_0x3b30df) ? _0x3b30df : _0x5f7ba9;
}
function clamp(_0x408aa9, _0x41fe02, _0x5e02bf) {
  return Math['min'](_0x5e02bf, Math['max'](_0x41fe02, _0x408aa9));
}
function positive(_0x5d2340, _0x21bce1, _0x37ea5a, _0x5adde9) {
  return clamp(finite(_0x5d2340, _0x21bce1), _0x37ea5a, _0x5adde9);
}
function vector3(_0x3c8f7c, _0x5aff8d = DEFAULT_SCENE_VIEW['target']) {
  const _0x4a51cf = Array['isArray'](_0x3c8f7c)
    ? { x: _0x3c8f7c[0x0], y: _0x3c8f7c[0x1], z: _0x3c8f7c[0x2] }
    : _0x3c8f7c;
  return {
    x: finite(_0x4a51cf?.['x'], _0x5aff8d['x']),
    y: finite(_0x4a51cf?.['y'], _0x5aff8d['y']),
    z: finite(_0x4a51cf?.['z'], _0x5aff8d['z']),
  };
}
export function normalizeStoryboard3DSceneView(_0xd550b7 = {}) {
  const _0x10e6b0 = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene'];
  return {
    target: vector3(_0xd550b7['target']),
    orbitYaw: finite(_0xd550b7['orbitYaw'], DEFAULT_SCENE_VIEW['orbitYaw']),
    orbitPitch: clamp(
      finite(_0xd550b7['orbitPitch'], DEFAULT_SCENE_VIEW['orbitPitch']),
      _0x10e6b0['orbitPitch']['min'],
      _0x10e6b0['orbitPitch']['max'],
    ),
    orbitDistance: clamp(
      finite(_0xd550b7['orbitDistance'], DEFAULT_SCENE_VIEW['orbitDistance']),
      _0x10e6b0['orbitDistance']['min'],
      _0x10e6b0['orbitDistance']['max'],
    ),
  };
}
function normalizeFrame(_0x11a799 = {}, _0x368519 = {}) {
  const _0x3ed009 = vector3(_0x11a799['center'] || _0x368519['center'], { x: 0x0, y: 0x0, z: 0x0 });
  return {
    center: _0x3ed009,
    radius: positive(_0x11a799['radius'], finite(_0x368519['radius'], 0x1), 0.05, 0x186a0),
    aspect: positive(_0x11a799['aspect'], finite(_0x368519['aspect'], 0x10 / 0x9), 0.1, 0x14),
    fov: positive(_0x11a799['fov'], finite(_0x368519['fov'], 0x32), 0x1, 0xb3),
  };
}
export function createStoryboard3DFocusSceneView({
  sceneView: _0x1bbde3,
  frame: _0x5c814e,
  padding: padding = 1.22,
} = {}) {
  const _0x411633 = normalizeStoryboard3DSceneView(_0x1bbde3),
    _0x459cec = normalizeFrame(_0x5c814e);
  return {
    ..._0x411633,
    target: _0x459cec['center'],
    orbitDistance: computePerspectiveFrameDistance({
      radius: _0x459cec['radius'],
      fov: _0x459cec['fov'],
      aspect: _0x459cec['aspect'],
      padding: positive(padding, 1.22, 0x1, 0x5),
    }),
  };
}
export function createStoryboard3DFitAllSceneView({
  sceneView: _0x41d7bb,
  sceneState: _0x1d6b24,
  bounds: _0x56867c,
  aspect: aspect = 0x10 / 0x9,
  fov: fov = 0x32,
  padding: padding = 1.28,
} = {}) {
  const _0x4ab682 = _0x56867c || estimateSceneContentBounds(_0x1d6b24);
  return createStoryboard3DFocusSceneView({
    sceneView: _0x41d7bb,
    frame: { center: _0x4ab682?.['center'], radius: _0x4ab682?.['radius'], aspect: aspect, fov: fov },
    padding: padding,
  });
}
export const STORYBOARD_3D_ORTHOGRAPHIC_VIEW_AXES = Object['freeze'](['top', 'front', 'right']);
function normalizeStoryboard3DOrthographicAxis(_0x9d0bb4) {
  return STORYBOARD_3D_ORTHOGRAPHIC_VIEW_AXES['includes'](_0x9d0bb4) ? _0x9d0bb4 : 'top';
}
export function createStoryboard3DAxisView({
  axis: axis = 'top',
  sceneView: _0x2bb802,
  sceneState: _0x594aed,
  bounds: _0x43110a,
  aspect: aspect = 0x10 / 0x9,
  padding: padding = 1.2,
} = {}) {
  const _0x5d664a = normalizeStoryboard3DOrthographicAxis(axis),
    _0x46412e = _0x43110a || estimateSceneContentBounds(_0x594aed),
    _0x1be651 = normalizeFrame({
      center: _0x46412e?.['center'],
      radius: _0x46412e?.['radius'],
      aspect: aspect,
      fov: 0x2d,
    }),
    _0x38eb4a = normalizeStoryboard3DSceneView(_0x2bb802),
    _0x6a3b27 = positive(padding, 1.2, 0x1, 0x5),
    _0x182a84 = createStoryboard3DFocusSceneView({
      sceneView: _0x38eb4a,
      frame: _0x1be651,
      padding: _0x6a3b27,
    });
  return (
    (_0x182a84['orbitYaw'] = _0x5d664a === 'right' ? Math['PI'] / 0x2 : 0x0),
    (_0x182a84['orbitPitch'] =
      _0x5d664a === 'top' ? PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitPitch']['max'] : 0x0),
    {
      viewMode: _0x5d664a,
      projection: 'orthographic',
      sceneView: _0x182a84,
      orthographic: {
        axis: _0x5d664a,
        center: _0x1be651['center'],
        verticalSize: Math['max'](0.1, _0x1be651['radius'] * 0x2 * _0x6a3b27),
        aspect: _0x1be651['aspect'],
        near: 0.01,
        far: Math['max'](0x64, _0x1be651['radius'] * 0x8),
        top: _0x5d664a === 'top',
      },
    }
  );
}
export function createStoryboard3DTopView(_0x4104b1 = {}) {
  return createStoryboard3DAxisView({ ..._0x4104b1, axis: 'top' });
}
export function createStoryboard3DPerspectiveView({
  sceneView: _0x1711bf,
  fallbackSceneView: _0x4bbc52,
} = {}) {
  return {
    viewMode: 'perspective',
    projection: 'perspective',
    sceneView: normalizeStoryboard3DSceneView(_0x1711bf || _0x4bbc52),
    orthographic: null,
  };
}
export function normalizeStoryboard3DViewportSettings(_0x3813c2 = {}) {
  const _0x3487da = _0x3813c2['snap'] && typeof _0x3813c2['snap'] === 'object' ? _0x3813c2['snap'] : {};
  return {
    transformSpace: _0x3813c2['transformSpace'] === 'local' ? 'local' : 'world',
    groundLock: _0x3813c2['groundLock'] === !![],
    uniformScale: _0x3813c2['uniformScale'] === !![],
    snapEnabled: _0x3813c2['snapEnabled'] === !![] || _0x3487da['enabled'] === !![],
    translationSnap: positive(_0x3813c2['translationSnap'] ?? _0x3487da['translation'], 0.25, 0.01, 0xa),
    rotationSnap: positive(
      _0x3813c2['rotationSnap'] ?? _0x3487da['rotation'],
      Math['PI'] / 0xc,
      0.001,
      Math['PI'],
    ),
    scaleSnap: positive(_0x3813c2['scaleSnap'] ?? _0x3487da['scale'], 0.1, 0.01, 0xa),
  };
}
export function createStoryboard3DTransformInteractionOptions(
  _0x5b2450,
  { mode: mode = 'translate', constraint: constraint = 'free' } = {},
) {
  const _0x3e2200 = normalizeStoryboard3DViewportSettings(_0x5b2450);
  return normalizeTransformInteractionOptions({
    mode: mode,
    space: _0x3e2200['transformSpace'],
    constraint: constraint,
    groundLock: _0x3e2200['groundLock'],
    uniformScale: _0x3e2200['uniformScale'],
    snap: {
      enabled: _0x3e2200['snapEnabled'],
      translation: _0x3e2200['translationSnap'],
      rotation: _0x3e2200['rotationSnap'],
      scale: _0x3e2200['scaleSnap'],
    },
  });
}
export function createStoryboard3DDirectorViewportUIPatch(_0x347e8b) {
  const _0x305268 = normalizeStoryboard3DViewportSettings(_0x347e8b);
  return {
    transformSpace: _0x305268['transformSpace'],
    groundLock: _0x305268['groundLock'],
    uniformScale: _0x305268['uniformScale'],
    snapEnabled: _0x305268['snapEnabled'],
    translationSnap: _0x305268['translationSnap'],
    rotationSnap: _0x305268['rotationSnap'],
    scaleSnap: _0x305268['scaleSnap'],
  };
}
export class Storyboard3DWebGLContextController {
  constructor({
    canvas: _0x1faea1,
    onStateChange: _0x5ef46f,
    onLost: _0x264b8b,
    onRestored: _0xc2ca5c,
    restore: _0x22f7c6,
  } = {}) {
    if (!_0x1faea1?.['addEventListener'] || !_0x1faea1?.['removeEventListener'])
      throw new TypeError('A WebGL canvas event target is required');
    ((this['canvas'] = _0x1faea1),
      (this['onStateChange'] = _0x5ef46f),
      (this['onLost'] = _0x264b8b),
      (this['onRestored'] = _0xc2ca5c),
      (this['restore'] = _0x22f7c6),
      (this['state'] = 'ready'),
      (this['lossCount'] = 0x0),
      (this['destroyed'] = ![]),
      (this['restoreRevision'] = 0x0),
      (this['_onContextLost'] = (_0x35989f) => {
        if (this['destroyed']) return;
        (_0x35989f?.['preventDefault']?.(),
          (this['lossCount'] += 0x1),
          (this['state'] = 'lost'),
          this['onLost']?.({ event: _0x35989f, lossCount: this['lossCount'] }),
          this['_notify']('context-lost'));
      }),
      (this['_onContextRestored'] = async (_0x21aacb) => {
        if (this['destroyed']) return;
        const _0x5dc53f = ++this['restoreRevision'];
        ((this['state'] = 'restoring'), this['_notify']('context-restoring'));
        try {
          await this['restore']?.({ event: _0x21aacb, lossCount: this['lossCount'] });
          if (this['destroyed'] || _0x5dc53f !== this['restoreRevision']) return;
          ((this['state'] = 'ready'),
            this['onRestored']?.({ event: _0x21aacb, lossCount: this['lossCount'] }),
            this['_notify']('context-restored'));
        } catch (_0x10d1dd) {
          if (this['destroyed'] || _0x5dc53f !== this['restoreRevision']) return;
          ((this['state'] = 'error'), this['_notify']('context-restore-failed', _0x10d1dd));
        }
      }),
      _0x1faea1['addEventListener']('webglcontextlost', this['_onContextLost'], ![]),
      _0x1faea1['addEventListener']('webglcontextrestored', this['_onContextRestored'], ![]));
  }
  ['_notify'](_0x54f9b4, _0x417cd3 = null) {
    this['onStateChange']?.(this['getSnapshot'](), { reason: _0x54f9b4, error: _0x417cd3 });
  }
  ['getSnapshot']() {
    return { state: this['state'], lossCount: this['lossCount'] };
  }
  ['destroy']() {
    if (this['destroyed']) return;
    ((this['destroyed'] = !![]),
      (this['restoreRevision'] += 0x1),
      this['canvas']['removeEventListener']('webglcontextlost', this['_onContextLost'], ![]),
      this['canvas']['removeEventListener']('webglcontextrestored', this['_onContextRestored'], ![]),
      (this['state'] = 'destroyed'));
  }
}
export function createStoryboard3DWebGLContextController(_0x5d1594) {
  return new Storyboard3DWebGLContextController(_0x5d1594);
}
export class Storyboard3DViewportControlSystem {
  constructor({
    sceneRuntime: _0x1c5db9,
    initialSceneView: _0x389ab5,
    initialSettings: _0x159627,
    applyViewState: _0xa0984b,
    onChange: _0x457c1d,
    canvas: _0x1494c3,
    onContextStateChange: _0x3e7324,
  } = {}) {
    ((this['runtime'] = _0x1c5db9 || null),
      (this['applyViewState'] = _0xa0984b),
      (this['onChange'] = _0x457c1d),
      (this['sceneView'] = normalizeStoryboard3DSceneView(_0x389ab5)),
      (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } }),
      (this['settings'] = normalizeStoryboard3DViewportSettings(_0x159627)),
      (this['viewMode'] = 'perspective'));
    const _0x58d9a6 = _0x1494c3 || _0x1c5db9?.['bridge']?.['renderer']?.['domElement'] || null;
    ((this['canvas'] = _0x58d9a6),
      (this['contextController'] = _0x58d9a6
        ? createStoryboard3DWebGLContextController({
            canvas: _0x58d9a6,
            onStateChange: _0x3e7324,
            restore: () => {
              (this['runtime']?.['sync']?.(), this['runtime']?.['renderNow']?.());
            },
          })
        : null));
  }
  ['_apply'](_0xe921d, _0x1bee53) {
    ((this['sceneView'] = normalizeStoryboard3DSceneView(_0xe921d['sceneView'])),
      (this['viewMode'] = _0xe921d['viewMode']));
    _0xe921d['viewMode'] === 'perspective' &&
      (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } });
    const _0x279895 = { ..._0xe921d, sceneView: this['sceneView'] },
      _0x290e01 = _0x279895['projection'] === 'orthographic' ? _0x279895['orthographic'] : null;
    return (
      typeof this['runtime']?.['setViewProjection'] === 'function'
        ? this['runtime']['setViewProjection'](_0x279895['projection'], _0x290e01)
        : this['runtime']?.['bridge']?.['setViewProjection']?.({
            type: _0x279895['projection'],
            ...(_0x290e01 || {}),
          }),
      typeof this['applyViewState'] === 'function'
        ? this['applyViewState'](_0x279895, { reason: _0x1bee53 })
        : this['runtime']?.['bridge']?.['setDraftView']?.({
            kind: 'scene-default',
            sceneView: this['sceneView'],
            disableSmoothing: !![],
          }),
      this['onChange']?.(this['getSnapshot'](), { reason: _0x1bee53 }),
      _0x279895
    );
  }
  ['focusSelection']({ frame: _0x421e8d, padding: _0x33a6d7 } = {}) {
    const _0x1b33d7 = _0x421e8d || this['runtime']?.['bridge']?.['readSelectionFrame']?.();
    if (!_0x1b33d7) return null;
    const _0x27566e = createStoryboard3DFocusSceneView({
      sceneView: this['sceneView'],
      frame: _0x1b33d7,
      padding: _0x33a6d7,
    });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: _0x27566e }), 'focus-selection');
  }
  ['focusObject'](_0x11b554, _0x4dac26, { frame: _0x2b7310, padding: _0x20df44 } = {}) {
    const _0x1f96a4 = _0x2b7310 || this['runtime']?.['bridge']?.['readObjectFrame']?.(_0x11b554, _0x4dac26);
    if (!_0x1f96a4) return null;
    const _0x5f0cc7 = createStoryboard3DFocusSceneView({
      sceneView: this['sceneView'],
      frame: _0x1f96a4,
      padding: _0x20df44,
    });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: _0x5f0cc7 }), 'focus-object');
  }
  ['fitAll'](_0x2a0587 = {}) {
    const _0x4294f2 = _0x2a0587['sceneState'] || this['runtime']?.['adapted']?.['state'];
    if (!_0x4294f2 && !_0x2a0587['bounds']) return null;
    const _0x29123d = this['runtime']?.['readCurrentCamera']?.(),
      _0x2265d6 = this['canvas']?.['getBoundingClientRect']?.(),
      _0x11f8a2 = Number(_0x2265d6?.['width']) / Math['max'](0x1, Number(_0x2265d6?.['height'])),
      _0x3a73ac = {
        ..._0x2a0587,
        aspect:
          Number['isFinite'](Number(_0x2a0587['aspect'])) && Number(_0x2a0587['aspect']) > 0x0
            ? Number(_0x2a0587['aspect'])
            : Number['isFinite'](_0x11f8a2) && _0x11f8a2 > 0x0
              ? _0x11f8a2
              : 0x10 / 0x9,
        fov:
          Number['isFinite'](Number(_0x2a0587['fov'])) && Number(_0x2a0587['fov']) > 0x0
            ? Number(_0x2a0587['fov'])
            : Number(_0x29123d?.['fov']) || 0x32,
      },
      _0x1b4a62 = createStoryboard3DFitAllSceneView({
        ..._0x3a73ac,
        sceneState: _0x4294f2,
        sceneView: this['sceneView'],
      });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: _0x1b4a62 }), 'fit-all');
  }
  ['showOrthographicView'](_0x318ffe = 'top', _0x5df349 = {}) {
    const _0x459539 = _0x5df349['sceneState'] || this['runtime']?.['adapted']?.['state'];
    if (!_0x459539 && !_0x5df349['bounds']) return null;
    return (
      this['viewMode'] === 'perspective' &&
        (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } }),
      this['_apply'](
        createStoryboard3DAxisView({
          ..._0x5df349,
          sceneState: _0x459539,
          sceneView: this['sceneView'],
          axis: _0x318ffe,
        }),
        _0x318ffe + '-view',
      )
    );
  }
  ['showTopView'](_0x153ff2 = {}) {
    return this['showOrthographicView']('top', _0x153ff2);
  }
  ['showFrontView'](_0x2f2cf4 = {}) {
    return this['showOrthographicView']('front', _0x2f2cf4);
  }
  ['showRightView'](_0x4d30b1 = {}) {
    return this['showOrthographicView']('right', _0x4d30b1);
  }
  ['showPerspectiveView'](_0x1d2e0e = this['perspectiveSceneView']) {
    return this['_apply'](
      createStoryboard3DPerspectiveView({
        sceneView: _0x1d2e0e,
        fallbackSceneView: this['perspectiveSceneView'],
      }),
      'perspective-view',
    );
  }
  ['updateSettings'](_0x5bcadc = {}) {
    const _0x265a1d = { ...this['settings'], ..._0x5bcadc };
    if (_0x5bcadc['snap'] && typeof _0x5bcadc['snap'] === 'object') {
      if (_0x5bcadc['snap']['enabled'] != null) _0x265a1d['snapEnabled'] = _0x5bcadc['snap']['enabled'];
      if (_0x5bcadc['snap']['translation'] != null)
        _0x265a1d['translationSnap'] = _0x5bcadc['snap']['translation'];
      if (_0x5bcadc['snap']['rotation'] != null) _0x265a1d['rotationSnap'] = _0x5bcadc['snap']['rotation'];
      if (_0x5bcadc['snap']['scale'] != null) _0x265a1d['scaleSnap'] = _0x5bcadc['snap']['scale'];
    }
    return (
      (this['settings'] = normalizeStoryboard3DViewportSettings(_0x265a1d)),
      this['onChange']?.(this['getSnapshot'](), { reason: 'settings' }),
      { ...this['settings'] }
    );
  }
  ['getTransformOptions'](_0x531f3f) {
    return createStoryboard3DTransformInteractionOptions(this['settings'], _0x531f3f);
  }
  ['getDirectorUIPatch']() {
    return createStoryboard3DDirectorViewportUIPatch(this['settings']);
  }
  ['getSnapshot']() {
    return {
      viewMode: this['viewMode'],
      sceneView: { ...this['sceneView'], target: { ...this['sceneView']['target'] } },
      perspectiveSceneView: {
        ...this['perspectiveSceneView'],
        target: { ...this['perspectiveSceneView']['target'] },
      },
      settings: { ...this['settings'] },
      context: this['contextController']?.['getSnapshot']() || null,
    };
  }
  ['destroy']() {
    (this['contextController']?.['destroy'](), (this['contextController'] = null), (this['canvas'] = null));
  }
}
export function createStoryboard3DViewportControlSystem(_0x496eb0) {
  return new Storyboard3DViewportControlSystem(_0x496eb0);
}
