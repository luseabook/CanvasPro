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
function finite(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['min'](data, Math['max'](result, index));
}
function positive(options, target, source, next) {
  return clamp(finite(options, target), source, next);
}
function vector3(x, box = DEFAULT_SCENE_VIEW['target']) {
  const box2 = Array['isArray'](x) ? { x: x[0x0], y: x[0x1], z: x[0x2] } : x;
  return {
    x: finite(box2?.['x'], box['x']),
    y: finite(box2?.['y'], box['y']),
    z: finite(box2?.['z'], box['z']),
  };
}
export function normalizeStoryboard3DSceneView(event = {}) {
  const current = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene'];
  return {
    target: vector3(event['target']),
    orbitYaw: finite(event['orbitYaw'], DEFAULT_SCENE_VIEW['orbitYaw']),
    orbitPitch: clamp(
      finite(event['orbitPitch'], DEFAULT_SCENE_VIEW['orbitPitch']),
      current['orbitPitch']['min'],
      current['orbitPitch']['max'],
    ),
    orbitDistance: clamp(
      finite(event['orbitDistance'], DEFAULT_SCENE_VIEW['orbitDistance']),
      current['orbitDistance']['min'],
      current['orbitDistance']['max'],
    ),
  };
}
function normalizeFrame(options2 = {}, entry = {}) {
  const center = vector3(options2['center'] || entry['center'], { x: 0x0, y: 0x0, z: 0x0 });
  return {
    center: center,
    radius: positive(options2['radius'], finite(entry['radius'], 0x1), 0.05, 0x186a0),
    aspect: positive(options2['aspect'], finite(entry['aspect'], 0x10 / 0x9), 0.1, 0x14),
    fov: positive(options2['fov'], finite(entry['fov'], 0x32), 0x1, 0xb3),
  };
}
export function createStoryboard3DFocusSceneView({
  sceneView: sceneView,
  frame: frame,
  padding: padding = 1.22,
} = {}) {
  const args = normalizeStoryboard3DSceneView(sceneView),
    target2 = normalizeFrame(frame);
  return {
    ...args,
    target: target2['center'],
    orbitDistance: computePerspectiveFrameDistance({
      radius: target2['radius'],
      fov: target2['fov'],
      aspect: target2['aspect'],
      padding: positive(padding, 1.22, 0x1, 0x5),
    }),
  };
}
export function createStoryboard3DFitAllSceneView({
  sceneView: sceneView2,
  sceneState: sceneState,
  bounds: bounds,
  aspect: aspect = 0x10 / 0x9,
  fov: fov = 0x32,
  padding: padding = 1.28,
} = {}) {
  const center2 = bounds || estimateSceneContentBounds(sceneState);
  return createStoryboard3DFocusSceneView({
    sceneView: sceneView2,
    frame: { center: center2?.['center'], radius: center2?.['radius'], aspect: aspect, fov: fov },
    padding: padding,
  });
}
export const STORYBOARD_3D_ORTHOGRAPHIC_VIEW_AXES = Object['freeze'](['top', 'front', 'right']);
function normalizeStoryboard3DOrthographicAxis(record) {
  return STORYBOARD_3D_ORTHOGRAPHIC_VIEW_AXES['includes'](record) ? record : 'top';
}
export function createStoryboard3DAxisView({
  axis: axis = 'top',
  sceneView: sceneView3,
  sceneState: sceneState2,
  bounds: bounds2,
  aspect: aspect = 0x10 / 0x9,
  padding: padding = 1.2,
} = {}) {
  const viewMode = normalizeStoryboard3DOrthographicAxis(axis),
    center3 = bounds2 || estimateSceneContentBounds(sceneState2),
    frame2 = normalizeFrame({
      center: center3?.['center'],
      radius: center3?.['radius'],
      aspect: aspect,
      fov: 0x2d,
    }),
    sceneView4 = normalizeStoryboard3DSceneView(sceneView3),
    padding2 = positive(padding, 1.2, 0x1, 0x5),
    sceneView5 = createStoryboard3DFocusSceneView({
      sceneView: sceneView4,
      frame: frame2,
      padding: padding2,
    });
  return (
    (sceneView5['orbitYaw'] = viewMode === 'right' ? Math['PI'] / 0x2 : 0x0),
    (sceneView5['orbitPitch'] =
      viewMode === 'top' ? PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitPitch']['max'] : 0x0),
    {
      viewMode: viewMode,
      projection: 'orthographic',
      sceneView: sceneView5,
      orthographic: {
        axis: viewMode,
        center: frame2['center'],
        verticalSize: Math['max'](0.1, frame2['radius'] * 0x2 * padding2),
        aspect: frame2['aspect'],
        near: 0.01,
        far: Math['max'](0x64, frame2['radius'] * 0x8),
        top: viewMode === 'top',
      },
    }
  );
}
export function createStoryboard3DTopView(args2 = {}) {
  return createStoryboard3DAxisView({ ...args2, axis: 'top' });
}
export function createStoryboard3DPerspectiveView({
  sceneView: sceneView6,
  fallbackSceneView: fallbackSceneView,
} = {}) {
  return {
    viewMode: 'perspective',
    projection: 'perspective',
    sceneView: normalizeStoryboard3DSceneView(sceneView6 || fallbackSceneView),
    orthographic: null,
  };
}
export function normalizeStoryboard3DViewportSettings(transformSpace = {}) {
  const box3 =
    transformSpace['snap'] && typeof transformSpace['snap'] === 'object' ? transformSpace['snap'] : {};
  return {
    transformSpace: transformSpace['transformSpace'] === 'local' ? 'local' : 'world',
    groundLock: transformSpace['groundLock'] === !![],
    uniformScale: transformSpace['uniformScale'] === !![],
    snapEnabled: transformSpace['snapEnabled'] === !![] || box3['enabled'] === !![],
    translationSnap: positive(transformSpace['translationSnap'] ?? box3['translation'], 0.25, 0.01, 0xa),
    rotationSnap: positive(
      transformSpace['rotationSnap'] ?? box3['rotation'],
      Math['PI'] / 0xc,
      0.001,
      Math['PI'],
    ),
    scaleSnap: positive(transformSpace['scaleSnap'] ?? box3['scale'], 0.1, 0.01, 0xa),
  };
}
export function createStoryboard3DTransformInteractionOptions(
  payload,
  { mode: mode = 'translate', constraint: constraint = 'free' } = {},
) {
  const space = normalizeStoryboard3DViewportSettings(payload);
  return normalizeTransformInteractionOptions({
    mode: mode,
    space: space['transformSpace'],
    constraint: constraint,
    groundLock: space['groundLock'],
    uniformScale: space['uniformScale'],
    snap: {
      enabled: space['snapEnabled'],
      translation: space['translationSnap'],
      rotation: space['rotationSnap'],
      scale: space['scaleSnap'],
    },
  });
}
export function createStoryboard3DDirectorViewportUIPatch(handle) {
  const transformSpace2 = normalizeStoryboard3DViewportSettings(handle);
  return {
    transformSpace: transformSpace2['transformSpace'],
    groundLock: transformSpace2['groundLock'],
    uniformScale: transformSpace2['uniformScale'],
    snapEnabled: transformSpace2['snapEnabled'],
    translationSnap: transformSpace2['translationSnap'],
    rotationSnap: transformSpace2['rotationSnap'],
    scaleSnap: transformSpace2['scaleSnap'],
  };
}
export class Storyboard3DWebGLContextController {
  constructor({
    canvas: canvas,
    onStateChange: onStateChange,
    onLost: onLost,
    onRestored: onRestored,
    restore: restore,
  } = {}) {
    if (!canvas?.['addEventListener'] || !canvas?.['removeEventListener'])
      throw new TypeError('A WebGL canvas event target is required');
    ((this['canvas'] = canvas),
      (this['onStateChange'] = onStateChange),
      (this['onLost'] = onLost),
      (this['onRestored'] = onRestored),
      (this['restore'] = restore),
      (this['state'] = 'ready'),
      (this['lossCount'] = 0x0),
      (this['destroyed'] = ![]),
      (this['restoreRevision'] = 0x0),
      (this['_onContextLost'] = (event2) => {
        if (this['destroyed']) return;
        (event2?.['preventDefault']?.(),
          (this['lossCount'] += 0x1),
          (this['state'] = 'lost'),
          this['onLost']?.({ event: event2, lossCount: this['lossCount'] }),
          this['_notify']('context-lost'));
      }),
      (this['_onContextRestored'] = async (event3) => {
        if (this['destroyed']) return;
        const state = ++this['restoreRevision'];
        ((this['state'] = 'restoring'), this['_notify']('context-restoring'));
        try {
          await this['restore']?.({ event: event3, lossCount: this['lossCount'] });
          if (this['destroyed'] || state !== this['restoreRevision']) return;
          ((this['state'] = 'ready'),
            this['onRestored']?.({ event: event3, lossCount: this['lossCount'] }),
            this['_notify']('context-restored'));
        } catch (config) {
          if (this['destroyed'] || state !== this['restoreRevision']) return;
          ((this['state'] = 'error'), this['_notify']('context-restore-failed', config));
        }
      }),
      canvas['addEventListener']('webglcontextlost', this['_onContextLost'], ![]),
      canvas['addEventListener']('webglcontextrestored', this['_onContextRestored'], ![]));
  }
  ['_notify'](reason, error = null) {
    this['onStateChange']?.(this['getSnapshot'](), { reason: reason, error: error });
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
export function createStoryboard3DWebGLContextController(scope) {
  return new Storyboard3DWebGLContextController(scope);
}
export class Storyboard3DViewportControlSystem {
  constructor({
    sceneRuntime: sceneRuntime,
    initialSceneView: initialSceneView,
    initialSettings: initialSettings,
    applyViewState: applyViewState,
    onChange: onChange,
    canvas: canvas2,
    onContextStateChange: onContextStateChange,
  } = {}) {
    ((this['runtime'] = sceneRuntime || null),
      (this['applyViewState'] = applyViewState),
      (this['onChange'] = onChange),
      (this['sceneView'] = normalizeStoryboard3DSceneView(initialSceneView)),
      (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } }),
      (this['settings'] = normalizeStoryboard3DViewportSettings(initialSettings)),
      (this['viewMode'] = 'perspective'));
    const canvas3 = canvas2 || sceneRuntime?.['bridge']?.['renderer']?.['domElement'] || null;
    ((this['canvas'] = canvas3),
      (this['contextController'] = canvas3
        ? createStoryboard3DWebGLContextController({
            canvas: canvas3,
            onStateChange: onContextStateChange,
            restore: () => {
              (this['runtime']?.['sync']?.(), this['runtime']?.['renderNow']?.());
            },
          })
        : null));
  }
  ['_apply'](args3, reason2) {
    ((this['sceneView'] = normalizeStoryboard3DSceneView(args3['sceneView'])),
      (this['viewMode'] = args3['viewMode']));
    args3['viewMode'] === 'perspective' &&
      (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } });
    const type = { ...args3, sceneView: this['sceneView'] },
      input = type['projection'] === 'orthographic' ? type['orthographic'] : null;
    return (
      typeof this['runtime']?.['setViewProjection'] === 'function'
        ? this['runtime']['setViewProjection'](type['projection'], input)
        : this['runtime']?.['bridge']?.['setViewProjection']?.({
            type: type['projection'],
            ...(input || {}),
          }),
      typeof this['applyViewState'] === 'function'
        ? this['applyViewState'](type, { reason: reason2 })
        : this['runtime']?.['bridge']?.['setDraftView']?.({
            kind: 'scene-default',
            sceneView: this['sceneView'],
            disableSmoothing: !![],
          }),
      this['onChange']?.(this['getSnapshot'](), { reason: reason2 }),
      type
    );
  }
  ['focusSelection']({ frame: frame3, padding: padding3 } = {}) {
    const frame4 = frame3 || this['runtime']?.['bridge']?.['readSelectionFrame']?.();
    if (!frame4) return null;
    const sceneView7 = createStoryboard3DFocusSceneView({
      sceneView: this['sceneView'],
      frame: frame4,
      padding: padding3,
    });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: sceneView7 }), 'focus-selection');
  }
  ['focusObject'](output, value2, { frame: frame5, padding: padding4 } = {}) {
    const frame6 = frame5 || this['runtime']?.['bridge']?.['readObjectFrame']?.(output, value2);
    if (!frame6) return null;
    const sceneView8 = createStoryboard3DFocusSceneView({
      sceneView: this['sceneView'],
      frame: frame6,
      padding: padding4,
    });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: sceneView8 }), 'focus-object');
  }
  ['fitAll'](args4 = {}) {
    const sceneState3 = args4['sceneState'] || this['runtime']?.['adapted']?.['state'];
    if (!sceneState3 && !args4['bounds']) return null;
    const value3 = this['runtime']?.['readCurrentCamera']?.(),
      box4 = this['canvas']?.['getBoundingClientRect']?.(),
      count = Number(box4?.['width']) / Math['max'](0x1, Number(box4?.['height'])),
      args5 = {
        ...args4,
        aspect:
          Number['isFinite'](Number(args4['aspect'])) && Number(args4['aspect']) > 0x0
            ? Number(args4['aspect'])
            : Number['isFinite'](count) && count > 0x0
              ? count
              : 0x10 / 0x9,
        fov:
          Number['isFinite'](Number(args4['fov'])) && Number(args4['fov']) > 0x0
            ? Number(args4['fov'])
            : Number(value3?.['fov']) || 0x32,
      },
      sceneView9 = createStoryboard3DFitAllSceneView({
        ...args5,
        sceneState: sceneState3,
        sceneView: this['sceneView'],
      });
    return this['_apply'](createStoryboard3DPerspectiveView({ sceneView: sceneView9 }), 'fit-all');
  }
  ['showOrthographicView'](axis2 = 'top', args6 = {}) {
    const sceneState4 = args6['sceneState'] || this['runtime']?.['adapted']?.['state'];
    if (!sceneState4 && !args6['bounds']) return null;
    return (
      this['viewMode'] === 'perspective' &&
        (this['perspectiveSceneView'] = { ...this['sceneView'], target: { ...this['sceneView']['target'] } }),
      this['_apply'](
        createStoryboard3DAxisView({
          ...args6,
          sceneState: sceneState4,
          sceneView: this['sceneView'],
          axis: axis2,
        }),
        axis2 + '-view',
      )
    );
  }
  ['showTopView'](options3 = {}) {
    return this['showOrthographicView']('top', options3);
  }
  ['showFrontView'](options4 = {}) {
    return this['showOrthographicView']('front', options4);
  }
  ['showRightView'](options5 = {}) {
    return this['showOrthographicView']('right', options5);
  }
  ['showPerspectiveView'](sceneView10 = this['perspectiveSceneView']) {
    return this['_apply'](
      createStoryboard3DPerspectiveView({
        sceneView: sceneView10,
        fallbackSceneView: this['perspectiveSceneView'],
      }),
      'perspective-view',
    );
  }
  ['updateSettings'](args7 = {}) {
    const value4 = { ...this['settings'], ...args7 };
    if (args7['snap'] && typeof args7['snap'] === 'object') {
      if (args7['snap']['enabled'] != null) value4['snapEnabled'] = args7['snap']['enabled'];
      if (args7['snap']['translation'] != null) value4['translationSnap'] = args7['snap']['translation'];
      if (args7['snap']['rotation'] != null) value4['rotationSnap'] = args7['snap']['rotation'];
      if (args7['snap']['scale'] != null) value4['scaleSnap'] = args7['snap']['scale'];
    }
    return (
      (this['settings'] = normalizeStoryboard3DViewportSettings(value4)),
      this['onChange']?.(this['getSnapshot'](), { reason: 'settings' }),
      { ...this['settings'] }
    );
  }
  ['getTransformOptions'](value5) {
    return createStoryboard3DTransformInteractionOptions(this['settings'], value5);
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
export function createStoryboard3DViewportControlSystem(value6) {
  return new Storyboard3DViewportControlSystem(value6);
}
