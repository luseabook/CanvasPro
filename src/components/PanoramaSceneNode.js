import appStore from '../core/stores/appStore.js';
import {
  addPanoramaSceneCamera,
  addPanoramaSceneCameraKeyframe,
  addPanoramaSceneCube,
  addPanoramaSceneMannequin,
  addPanoramaSceneMannequinGrid,
  capturePanoramaSceneViewport,
  applyPanoramaSceneMannequinPose,
  clearPanoramaSceneSelection,
  deletePanoramaSceneCamera,
  deletePanoramaSceneCameraKeyframe,
  deleteSelectedPanoramaSceneObject,
  focusPanoramaSceneSelection,
  resetPanoramaSceneView,
  setPanoramaSceneCollapsed,
  setPanoramaSceneCaptureMode,
  setPanoramaSceneEditing,
  setPanoramaSceneEnvironmentMode,
  setPanoramaSceneGridPlacement,
  setPanoramaSceneInteractionOptions,
  setPanoramaSceneMode,
  setPanoramaSceneSelection,
  setPanoramaSceneSelectionBatch,
  setPanoramaSceneSelectionObjects,
  setPanoramaSceneTool,
  updatePanoramaSceneLoadState,
  updatePanoramaSceneCameraTimeline,
  updatePanoramaSceneObjectTransform,
  uploadPanoramaSceneImage,
  applyPanoramaSceneViewCommit,
  syncPanorama360FromIncomingImageEdge,
  upsertPanoramaSceneCameraAtSlot,
} from '../modules/panoramaSceneNode/sceneNodeActions.js';
import { getPanoramaSceneState } from '../modules/panoramaSceneNode/sceneNodeSelectors.js';
import { PanoramaScene3DBridge } from '../modules/panoramaSceneNode/scene3dBridge.js';
import { preloadPanoramaCharacterModels } from '../modules/panoramaSceneNode/characterModelRegistry.js';
import { PanoramaSceneInteraction } from '../modules/interaction/PanoramaSceneInteraction.js';
import { createContextMenuIcon } from '../modules/interaction/contextMenuIcons.js';
import { PANORAMA_SCENE_TOOLBAR_HTML } from './panoramaScene/PanoramaSceneToolbar.js';
import {
  PANORAMA_360_MODE_TOOLBAR_HTML,
  PANORAMA_SCENE_MODE_TOOLBAR_HTML,
} from './panoramaScene/PanoramaModeToolbar.js';
import { PANORAMA_SCENE_CORNER_TOOLBAR_HTML } from './panoramaScene/PanoramaSceneCornerToolbar.js';
import { PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML } from './panoramaScene/PanoramaSceneBottomToolbar.js';
import { createCameraPresetList, renderCameraPresetList } from './panoramaScene/CameraPresetList.js';
import {
  createMannequinQuickMenu,
  getPanoramaMannequinColorLabel,
  getPanoramaMannequinGenderLabel,
  PANORAMA_MANNEQUIN_COLOR_OPTIONS,
  PANORAMA_MANNEQUIN_GENDER_OPTIONS,
  resolvePanoramaSceneColorToken,
  renderMannequinQuickMenu,
} from './panoramaScene/MannequinQuickMenu.js';
import { createSceneAssetBrowser, renderSceneAssetBrowser } from './panoramaScene/SceneAssetBrowser.js';
import { createMannequinPosePanel, renderMannequinPosePanel } from './panoramaScene/MannequinPosePanel.js';
import {
  createCameraTimelinePanel,
  renderCameraTimelinePanel,
  setCameraTimelineDisplayTime,
} from './panoramaScene/CameraTimelinePanel.js';
import {
  normalizeCameraTimeline,
  sampleCameraTimeline,
} from '../modules/panoramaSceneNode/cameraTimeline.js';
import {
  getShortcutLabel as getShortcutLabel_2,
  getShortcutKeys,
  resolveShortcutActionForEvent,
} from '../modules/shortcuts.js';
import * as threeRuntime from '../modules/panoramaSceneNode/threeRuntime.js';
import { createDefaultSceneView, PANORAMA_360_NODE_TYPE } from '../modules/panoramaSceneNode/sceneNode.js';
import {
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_FOCAL_LENGTH_MAX_MM,
  SCENE_FOCAL_LENGTH_MIN_MM,
  cameraPoseToSceneViewFromReference,
  focalLengthToFov,
} from '../core/panoramaSceneMath.js';
import { onLocaleChange, t } from '../i18n/index.js';
const POINTER_TOOL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m5 3 10 8-6 1 2 7-3 1-2-7-4 3z"/></svg>',
  BOX_SELECT_TOOL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8v6H8z" stroke-dasharray="2 2"/></svg>',
  PANORAMA_360_IMAGE_SOURCE_TYPES = new Set(['source-image', 'ai-image', 'image']);
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
function isPanorama360ImageSourceType(key) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES['has'](String(key || '')['trim']());
}
function createElementFromHtml(index) {
  const el = document['createElement']('template');
  return ((el['innerHTML'] = index['trim']()), el['content']['firstElementChild']);
}
function removeConfiguredToolbarActions(el2, result = []) {
  if (!el2) return;
  const args = new Set(
    (Array['isArray'](result) ? result : [])
      ['map']((data) => String(data || '')['trim']())
      ['filter'](Boolean),
  );
  if (args['size'] < 0x1) return;
  el2['querySelectorAll']('button')['forEach']((el3) => {
    const options = [...args]['some']((target) =>
      el3['classList']['contains']('act-' + target),
    );
    if (options) el3['remove']();
  });
}
function attachUiStop(el4, { wheel: wheel = ![] } = {}) {
  if (!el4) return;
  ((el4['dataset']['uiStop'] = '1'),
    el4['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
    wheel &&
      el4['addEventListener'](
        'wheel',
        (event2) => {
          event2['stopPropagation']();
        },
        { passive: ![] },
      ));
}
function getShortcutLabel(source) {
  const list = getShortcutKeys(source);
  return list['length'] > 0x0 ? '[' + list['join']('+') + ']' : '';
}
function buildTooltipText(next, current) {
  const shortcutLabel = getShortcutLabel(current);
  return shortcutLabel ? next + '\x20' + shortcutLabel : next;
}
function cameraTimelineSampleToDraft(fov) {
  if (!fov) return null;
  const entry = new threeRuntime['Vector3'](
      fov['position']['x'],
      fov['position']['y'],
      fov['position']['z'],
    ),
    record = new threeRuntime['Vector3'](
      fov['target']['x'],
      fov['target']['y'],
      fov['target']['z'],
    ),
    payload = new threeRuntime['Matrix4']()['lookAt'](
      entry,
      record,
      new threeRuntime['Vector3'](0x0, 0x1, 0x0),
    ),
    x2 = new threeRuntime['Quaternion']()['setFromRotationMatrix'](payload)['normalize'](),
    x3 = new threeRuntime['Euler']()['setFromQuaternion'](x2, 'YXZ');
  return {
    kind: 'camera',
    position: { ...fov['position'] },
    target: { ...fov['target'] },
    quaternion: { x: x2['x'], y: x2['y'], z: x2['z'], w: x2['w'] },
    rotation: { x: x3['x'], y: x3['y'], z: x3['z'] },
    fov: fov['fov'],
    disableSmoothing: !![],
  };
}
function normalizeCameraSlot(handle) {
  const count = Number(handle);
  if (!Number['isInteger'](count)) return null;
  if (count < 0x1 || count > 0xa) return null;
  return count;
}
function resolveCameraSlotEntries(list2 = []) {
  const list3 = Array['isArray'](list2) ? list2 : [],
    map = new Set(),
    list4 = [];
  return (
    list3['forEach']((camera) => {
      const slot = normalizeCameraSlot(camera?.['slot']);
      if (!slot || map['has'](slot)) return;
      (map['add'](slot), list4['push']({ camera: camera, slot: slot }));
    }),
    list3['forEach']((camera2) => {
      if (list4['some']((state) => state['camera']?.['id'] === camera2?.['id'])) return;
      for (let slot2 = 0x1; slot2 <= 0xa; slot2 += 0x1) {
        if (map['has'](slot2)) continue;
        (map['add'](slot2), list4['push']({ camera: camera2, slot: slot2 }));
        break;
      }
    }),
    list4['sort']((config, scope) => config['slot'] - scope['slot'])
  );
}
function lerp(input, output, value2) {
  return input + (output - input) * value2;
}
function smootherstep(value3) {
  const value4 = Math['max'](0x0, Math['min'](0x1, Number(value3) || 0x0));
  return value4 * value4 * value4 * (value4 * (value4 * 0x6 - 0xf) + 0xa);
}
function interpolateVector3(box, box2, value5) {
  return {
    x: lerp(Number(box?.['x']) || 0x0, Number(box2?.['x']) || 0x0, value5),
    y: lerp(Number(box?.['y']) || 0x0, Number(box2?.['y']) || 0x0, value5),
    z: lerp(Number(box?.['z']) || 0x0, Number(box2?.['z']) || 0x0, value5),
  };
}
function cloneVector3(value6) {
  return interpolateVector3(value6, value6, 0x1);
}
function quaternionToRotation(value7) {
  const value8 = value7?.['clone']?.() || new threeRuntime['Quaternion'](),
    x4 = new threeRuntime['Euler'](0x0, 0x0, 0x0, 'YXZ')['setFromQuaternion'](value8, 'YXZ');
  return { x: x4['x'], y: x4['y'], z: x4['z'] };
}
function areSceneViewsEquivalent(event3, event4, value9 = 0.00001) {
  if (!event3 || !event4) return ![];
  return (
    Math['abs'](
      (Number(event3?.['target']?.['x']) || 0x0) - (Number(event4?.['target']?.['x']) || 0x0),
    ) <= value9 &&
    Math['abs'](
      (Number(event3?.['target']?.['y']) || 0x0) - (Number(event4?.['target']?.['y']) || 0x0),
    ) <= value9 &&
    Math['abs'](
      (Number(event3?.['target']?.['z']) || 0x0) - (Number(event4?.['target']?.['z']) || 0x0),
    ) <= value9 &&
    Math['abs']((Number(event3?.['orbitYaw']) || 0x0) - (Number(event4?.['orbitYaw']) || 0x0)) <=
      value9 &&
    Math['abs']((Number(event3?.['orbitPitch']) || 0x0) - (Number(event4?.['orbitPitch']) || 0x0)) <=
      value9 &&
    Math['abs'](
      (Number(event3?.['orbitDistance']) || 0x0) - (Number(event4?.['orbitDistance']) || 0x0),
    ) <= value9
  );
}
const PANORAMA_CAPTURE_MODE_OPTIONS = [
  { key: 'adaptive', labelKey: 'adaptive', iconClass: 'is-adaptive' },
  { key: '9:16', labelKey: 'vertical', ratio: 0x9 / 0x10, iconClass: 'is-9-16' },
  { key: '2.35:1', labelKey: 'cinema', ratio: 2.35, iconClass: 'is-2-35-1' },
];
function normalizeCaptureMode(value10) {
  return PANORAMA_CAPTURE_MODE_OPTIONS['some']((event5) => event5['key'] === value10)
    ? value10
    : 'adaptive';
}
function getCaptureModeMeta(value11) {
  const captureMode = normalizeCaptureMode(value11);
  return (
    PANORAMA_CAPTURE_MODE_OPTIONS['find']((event6) => event6['key'] === captureMode) ||
    PANORAMA_CAPTURE_MODE_OPTIONS[0x0]
  );
}
function getCaptureModeLabel(value12) {
  const event7 = typeof value12 === 'string' ? getCaptureModeMeta(value12) : value12,
    value13 = String(event7?.['labelKey'] || '')['trim']();
  return value13 ? panoramaSceneText('capture.modes.' + value13) : String(event7?.['key'] || '');
}
function computeCaptureFrameRect(value14, value15, value16) {
  const width = Math['max'](0x0, Number(value14) || 0x0),
    height = Math['max'](0x0, Number(value15) || 0x0);
  if (width <= 0x0 || height <= 0x0) return { x: 0x0, y: 0x0, width: 0x0, height: 0x0 };
  const captureMode2 = normalizeCaptureMode(value16);
  if (captureMode2 === 'adaptive') return { x: 0x0, y: 0x0, width: width, height: height };
  const captureModeMeta = getCaptureModeMeta(captureMode2)['ratio'];
  if (!(captureModeMeta > 0x0)) return { x: 0x0, y: 0x0, width: width, height: height };
  const value17 = width / height;
  if (value17 >= captureModeMeta) {
    const width2 = height * captureModeMeta;
    return { x: (width - width2) / 0x2, y: 0x0, width: width2, height: height };
  }
  const height2 = width / captureModeMeta;
  return { x: 0x0, y: (height - height2) / 0x2, width: width, height: height2 };
}
export function resolveNextPanoramaMouseTool(value18) {
  return String(value18 || '')['trim']() === 'box-select' ? 'navigate' : 'box-select';
}
async function decodeImageBlob(value19) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(value19);
  const value20 = await new Promise((handler, handler2) => {
    const value21 = URL['createObjectURL'](value19),
      image = new Image();
    ((image['onload'] = () => {
      (URL['revokeObjectURL'](value21), handler(image));
    }),
      (image['onerror'] = (value22) => {
        (URL['revokeObjectURL'](value21), handler2(value22));
      }),
      (image['src'] = value21));
  });
  return value20;
}
function closeDecodedImage(value23) {
  value23 && typeof value23['close'] === 'function' && value23['close']();
}
async function canvasToPngBlob(value24) {
  return new Promise((handler3, handler4) => {
    value24['toBlob']((value25) => {
      if (value25) {
        handler3(value25);
        return;
      }
      handler4(new Error(panoramaSceneText('errors.captureCropFailed')));
    }, 'image/png');
  });
}
async function cropCaptureBlobToFrame({
  blob: blob,
  viewportWidth: viewportWidth,
  viewportHeight: viewportHeight,
  mode: mode,
}) {
  if (!(blob instanceof Blob)) return null;
  const captureMode3 = normalizeCaptureMode(mode);
  if (captureMode3 === 'adaptive') return blob;
  const box3 = computeCaptureFrameRect(viewportWidth, viewportHeight, captureMode3);
  if (box3['width'] <= 0x0 || box3['height'] <= 0x0) return blob;
  const box4 = await decodeImageBlob(blob);
  try {
    const count2 = Number(box4['width']) || Number(box4['videoWidth']) || 0x0,
      count3 = Number(box4['height']) || Number(box4['videoHeight']) || 0x0;
    if (count2 <= 0x0 || count3 <= 0x0) return blob;
    const value26 = count2 / Math['max'](0x1, viewportWidth),
      value27 = count3 / Math['max'](0x1, viewportHeight),
      value28 = Math['max'](0x0, Math['round'](box3['x'] * value26)),
      value29 = Math['max'](0x0, Math['round'](box3['y'] * value27)),
      value30 = Math['min'](
        count2 - value28,
        Math['max'](0x1, Math['round'](box3['width'] * value26)),
      ),
      value31 = Math['min'](
        count3 - value29,
        Math['max'](0x1, Math['round'](box3['height'] * value27)),
      ),
      box5 = document['createElement']('canvas');
    ((box5['width'] = value30), (box5['height'] = value31));
    const ctx = box5['getContext']('2d');
    if (!ctx) throw new Error(panoramaSceneText('errors.captureCropFailed'));
    return (
      ctx['drawImage'](
        box4,
        value28,
        value29,
        value30,
        value31,
        0x0,
        0x0,
        value30,
        value31,
      ),
      canvasToPngBlob(box5)
    );
  } finally {
    closeDecodedImage(box4);
  }
}
export class PanoramaSceneNode {
  constructor(value32) {
    ((this['_data'] = value32),
      (this['id'] = value32['id']),
      (this['_isPanorama360'] = String(value32?.['type'] || '')['trim']() === PANORAMA_360_NODE_TYPE),
      (this['el'] = document['createElement']('div')),
      (this['el']['className'] = 'v2-node-component\x20panorama-scene-component'),
      this['el']['classList']['toggle']('is-panorama-360', this['_isPanorama360']),
      (this['_sceneState'] = getPanoramaSceneState(value32)),
      (this['_openMenuKey'] = null),
      (this['_menuHideTimer'] = null),
      (this['_resizeObserver'] = null),
      (this['_bridge'] = null),
      (this['_interaction'] = null),
      (this['_unsubscribeViewport'] = null),
      (this['_unsubscribeSelection'] = null),
      (this['_unsubscribePanoramaIncomingSync'] = null),
      (this['_isSelected'] = ![]),
      (this['_isNodeHovered'] = ![]),
      (this['_isUnmounted'] = ![]),
      (this['_contextMenuTarget'] = null),
      (this['_cameraJumpRaf'] = 0x0),
      (this['_cameraJumpToken'] = 0x0),
      (this['_pendingCameraJumpCommit'] = null),
      (this['_pendingCameraJumpReleaseRaf'] = 0x0),
      (this['_timelinePlaybackRaf'] = 0x0),
      (this['_timelinePlaybackStartedAt'] = 0x0),
      (this['_timelinePlaybackStartTime'] = 0x0),
      (this['_timelinePreviewTime'] = 0x0),
      (this['_isTimelinePlaying'] = ![]),
      (this['_hasRequestedCharacterPreload'] = ![]),
      (this['_defaultSceneFocalLength'] = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this['_browserFullscreenOverlayEl'] = null),
      (this['_browserFullscreenAnchorEl'] = null),
      (this['_browserFullscreenExitBtnEl'] = null),
      (this['_unsubscribeLocale'] = null),
      (this['_handleToolbarClick'] = this['_handleToolbarClick']['bind'](this)),
      (this['_handleFileInputChange'] = this['_handleFileInputChange']['bind'](this)),
      (this['_handleViewportPointerDown'] = this['_handleViewportPointerDown']['bind'](this)),
      (this['_handleViewportContextMenu'] = this['_handleViewportContextMenu']['bind'](this)),
      (this['_handleGlobalPointerDown'] = this['_handleGlobalPointerDown']['bind'](this)),
      (this['_handleViewportDoubleClick'] = this['_handleViewportDoubleClick']['bind'](this)),
      (this['_handleNodePointerEnter'] = this['_handleNodePointerEnter']['bind'](this)),
      (this['_handleNodePointerLeave'] = this['_handleNodePointerLeave']['bind'](this)),
      (this['_handleBottomToolbarPointerEnter'] = this['_handleBottomToolbarPointerEnter']['bind'](this)),
      (this['_handleBottomToolbarPointerLeave'] = this['_handleBottomToolbarPointerLeave']['bind'](this)),
      (this['_handleCaptureMenuClick'] = this['_handleCaptureMenuClick']['bind'](this)),
      (this['_handleWindowResize'] = this['_handleWindowResize']['bind'](this)),
      (this['_handleShortcutsUpdated'] = this['_handleShortcutsUpdated']['bind'](this)),
      (this['_handleCameraShortcutEvent'] = this['_handleCameraShortcutEvent']['bind'](this)),
      (this['_handleCaptureShortcutEvent'] = this['_handleCaptureShortcutEvent']['bind'](this)),
      (this['_handleWindowKeyDown'] = this['_handleWindowKeyDown']['bind'](this)),
      (this['_handleWindowKeyUp'] = this['_handleWindowKeyUp']['bind'](this)),
      (this['_handleWindowBlur'] = this['_handleWindowBlur']['bind'](this)));
  }
  ['mount']() {
    ((this['_isUnmounted'] = ![]),
      Object['assign'](this['el']['style'], {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'auto',
        cursor: 'default',
        position: 'relative',
      }),
      (this['_shellEl'] = document['createElement']('div')),
      (this['_shellEl']['className'] = 'panorama-scene-shell'),
      (this['_viewportEl'] = document['createElement']('div')),
      (this['_viewportEl']['className'] = 'panorama-scene-viewport'),
      (this['_viewportEl']['dataset']['sceneInteraction'] = 'panorama'),
      (this['_viewportEl']['tabIndex'] = 0x0),
      this['_viewportEl']['addEventListener']('pointerdown', this['_handleViewportPointerDown']),
      this['_viewportEl']['addEventListener']('contextmenu', this['_handleViewportContextMenu']),
      this['_viewportEl']['addEventListener']('dblclick', this['_handleViewportDoubleClick']),
      (this['_overlayEl'] = document['createElement']('div')),
      (this['_overlayEl']['className'] = 'panorama-scene-overlay'),
      (this['_infoDockEl'] = document['createElement']('div')),
      (this['_infoDockEl']['className'] = 'panorama-scene-fixed-info-dock'),
      (this['_infoDockEl']['style']['transform'] = 'none'),
      (this['_sceneToolbarEl'] = createElementFromHtml(PANORAMA_SCENE_TOOLBAR_HTML)),
      removeConfiguredToolbarActions(
        this['_sceneToolbarEl'],
        this['_data']?.['panoramaToolbar']?.['hiddenActions'],
      ),
      this['_sceneToolbarEl']['addEventListener']('click', this['_handleToolbarClick']),
      attachUiStop(this['_sceneToolbarEl']));
    const value33 = this['_isPanorama360']
      ? PANORAMA_360_MODE_TOOLBAR_HTML
      : PANORAMA_SCENE_MODE_TOOLBAR_HTML;
    ((this['_editToolbarEl'] = createElementFromHtml(value33)),
      removeConfiguredToolbarActions(
        this['_editToolbarEl'],
        this['_data']?.['panoramaToolbar']?.['hiddenActions'],
      ),
      this['_editToolbarEl']['addEventListener']('click', this['_handleToolbarClick']),
      attachUiStop(this['_editToolbarEl']),
      (this['_cornerToolbarEl'] = createElementFromHtml(PANORAMA_SCENE_CORNER_TOOLBAR_HTML)),
      this['_cornerToolbarEl']['addEventListener']('click', this['_handleToolbarClick']),
      attachUiStop(this['_cornerToolbarEl']),
      (this['_bottomToolbarEl'] = createElementFromHtml(PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML)),
      this['_bottomToolbarEl']['addEventListener']('click', this['_handleToolbarClick']),
      this['_bottomToolbarEl']['addEventListener']('pointerover', this['_handleBottomToolbarPointerEnter']),
      this['_bottomToolbarEl']['addEventListener']('pointerout', this['_handleBottomToolbarPointerLeave']),
      attachUiStop(this['_bottomToolbarEl']),
      (this['_bottomToolbarAnchorEl'] = document['createElement']('div')),
      (this['_bottomToolbarAnchorEl']['className'] = 'panorama-scene-bottom-toolbar-anchor'),
      this['_bottomToolbarAnchorEl']['appendChild'](this['_bottomToolbarEl']),
      (this['_bottomToolbarPopoverLayerEl'] = document['createElement']('div')),
      (this['_bottomToolbarPopoverLayerEl']['className'] = 'panorama-scene-bottom-toolbar-popovers'),
      this['_bottomToolbarEl']['appendChild'](this['_bottomToolbarPopoverLayerEl']),
      (this['_cameraListEl'] = createCameraPresetList()),
      attachUiStop(this['_cameraListEl']),
      this['_cameraListEl']['addEventListener']('mouseenter', () => this['_openMenu']('camera')),
      this['_cameraListEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('camera')),
      (this['_mannequinMenuEl'] = createMannequinQuickMenu({
        onSelectGender: ({ gender: gender }) => {
          setPanoramaSceneGridPlacement({
            nodeId: this['id'],
            patch: { gender: gender === 'female' ? 'female' : 'male' },
          });
        },
        onSelectColor: ({ colorKey: colorKey, gender: gender2 }) => {
          const gender3 = gender2 === 'female' ? 'female' : 'male';
          (this['_selectNodeOnCanvas'](),
            setPanoramaSceneGridPlacement({
              nodeId: this['id'],
              patch: { colorKey: colorKey, gender: gender3 },
            }),
            addPanoramaSceneMannequin({
              nodeId: this['id'],
              gender: gender3,
              colorKey: colorKey,
              viewPose: this['_bridge']?.['readCurrentViewPose']?.(),
            }),
            this['_closeMenus']());
        },
      })),
      attachUiStop(this['_mannequinMenuEl']),
      this['_mannequinMenuEl']['addEventListener']('mouseenter', () => this['_openMenu']('mannequin')),
      this['_mannequinMenuEl']['addEventListener']('mouseleave', () =>
        this['_scheduleMenuHide']('mannequin'),
      ),
      (this['_assetBrowserEl'] = createSceneAssetBrowser({
        onSelect: (assetId) => {
          (this['_selectNodeOnCanvas'](),
            addPanoramaSceneCube({
              nodeId: this['id'],
              assetId: assetId,
              viewPose: this['_bridge']?.['readCurrentViewPose']?.(),
            }),
            this['_closeMenus']());
        },
      })),
      attachUiStop(this['_assetBrowserEl'], { wheel: !![] }),
      this['_assetBrowserEl']['addEventListener']('mouseenter', () => this['_openMenu']('assets')),
      this['_assetBrowserEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('assets')));
    const run = () =>
      this['_sceneState']?.['selection']?.['selectedObjectType'] === 'mannequin'
        ? this['_sceneState']['selection']['selectedObjectId']
        : null;
    ((this['_posePanelEl'] = createMannequinPosePanel({
      onApplyPreset: (poseId) => {
        const mannequinId = run();
        if (!mannequinId) return;
        (applyPanoramaSceneMannequinPose({ nodeId: this['id'], mannequinId: mannequinId, poseId: poseId }),
          this['_bridge']?.['clearDraftMannequinBonePose']?.(mannequinId));
      },
      onPreview: (value34) => {
        const enabled = run();
        if (!enabled) return;
        this['_bridge']?.['setDraftMannequinBonePose']?.(enabled, value34);
      },
      onCommit: (bonePose) => {
        const mannequinId2 = run();
        if (!mannequinId2) return;
        (applyPanoramaSceneMannequinPose({
          nodeId: this['id'],
          mannequinId: mannequinId2,
          poseId: 'custom',
          bonePose: bonePose,
        }),
          this['_bridge']?.['clearDraftMannequinBonePose']?.(mannequinId2));
      },
      onSaveCustom: (args2) => {
        const mannequinId3 = run();
        if (!mannequinId3) return;
        (applyPanoramaSceneMannequinPose({
          nodeId: this['id'],
          mannequinId: mannequinId3,
          poseId: 'custom',
          customPose: { ...args2, id: 'custom-pose-' + Date['now']() },
        }),
          this['_bridge']?.['clearDraftMannequinBonePose']?.(mannequinId3));
      },
    })),
      attachUiStop(this['_posePanelEl'], { wheel: !![] }),
      this['_posePanelEl']['addEventListener']('mouseenter', () => this['_openMenu']('pose')),
      this['_posePanelEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('pose')),
      (this['_timelinePanelEl'] = createCameraTimelinePanel({
        onAddKeyframe: (time) => {
          addPanoramaSceneCameraKeyframe({
            nodeId: this['id'],
            keyframe: { time: time },
            viewPose: this['_bridge']?.['readCurrentViewPose']?.(),
          });
        },
        onPlayToggle: () => this['_toggleCameraTimelinePlayback'](),
        onScrub: (value35) => this['_previewCameraTimelineAt'](value35),
        onScrubCommit: (currentTime) => {
          ((this['_timelinePreviewTime'] = currentTime),
            updatePanoramaSceneCameraTimeline({ nodeId: this['id'], patch: { currentTime: currentTime } }));
        },
        onDeleteKeyframe: (keyframeId) => {
          deletePanoramaSceneCameraKeyframe({ nodeId: this['id'], keyframeId: keyframeId });
        },
        onSettingsChange: (patch) => {
          updatePanoramaSceneCameraTimeline({ nodeId: this['id'], patch: patch });
        },
      })),
      attachUiStop(this['_timelinePanelEl'], { wheel: !![] }),
      (this['_gridPanelEl'] = this['_createGridPanel']()),
      attachUiStop(this['_gridPanelEl'], { wheel: !![] }),
      this['_gridPanelEl']['addEventListener']('mouseenter', () => this['_openMenu']('grid')),
      this['_gridPanelEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('grid')),
      (this['_captureMenuEl'] = this['_createCaptureMenu']()),
      attachUiStop(this['_captureMenuEl']),
      this['_captureMenuEl']['addEventListener']('mouseenter', () => this['_openMenu']('capture')),
      this['_captureMenuEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('capture')),
      this['_captureMenuEl']['addEventListener']('click', this['_handleCaptureMenuClick']),
      (this['_focusMenuEl'] = this['_createFocusMenu']()),
      attachUiStop(this['_focusMenuEl'], { wheel: !![] }),
      this['_focusMenuEl']['addEventListener']('mouseenter', () => this['_openMenu']('focus')),
      this['_focusMenuEl']['addEventListener']('mouseleave', () => this['_scheduleMenuHide']('focus')),
      (this['_statusEl'] = document['createElement']('div')),
      (this['_statusEl']['className'] = 'panorama-scene-fixed-status'),
      (this['_statusEl']['style']['transform'] = 'none'),
      (this['_statusContentEl'] = document['createElement']('div')),
      (this['_statusContentEl']['className'] = 'panorama-scene-fixed-status__content'),
      this['_statusEl']['appendChild'](this['_statusContentEl']),
      attachUiStop(this['_statusEl']),
      (this['_errorEl'] = document['createElement']('div')),
      (this['_errorEl']['className'] = 'panorama-scene-error'),
      attachUiStop(this['_errorEl']),
      (this['_hintEl'] = document['createElement']('div')),
      (this['_hintEl']['className'] = 'panorama-scene-fixed-hint'),
      (this['_hintEl']['style']['transform'] = 'none'),
      (this['_hintContentEl'] = document['createElement']('div')),
      (this['_hintContentEl']['className'] = 'panorama-scene-fixed-hint__content'),
      this['_hintEl']['appendChild'](this['_hintContentEl']),
      attachUiStop(this['_hintEl']),
      (this['_contextMenuEl'] = document['createElement']('div')),
      (this['_contextMenuEl']['className'] = 'panorama-scene-object-menu'),
      (this['_contextMenuEl']['hidden'] = !![]));
    const el5 = document['createElement']('button');
    ((el5['type'] = 'button'),
      (el5['className'] = 'panorama-scene-object-menu__item act-delete-selected'));
    const el6 = document['createElement']('span');
    ((el6['className'] = 'panorama-scene-object-menu__icon'),
      el6['setAttribute']('aria-hidden', 'true'));
    const contextMenuIcon = createContextMenuIcon('delete');
    if (contextMenuIcon) el6['appendChild'](contextMenuIcon);
    const el7 = document['createElement']('span');
    ((el7['className'] = 'panorama-scene-object-menu__label'),
      (el7['textContent'] = panoramaSceneText('contextMenu.deleteObject')));
    const el8 = document['createElement']('span');
    return (
      (el8['className'] = 'v2-menu-kbd\x20panorama-scene-object-menu__kbd'),
      (el8['dataset']['shortcutAction'] = 'delete'),
      el5['appendChild'](el6),
      el5['appendChild'](el7),
      el5['appendChild'](el8),
      this['_contextMenuEl']['appendChild'](el5),
      attachUiStop(this['_contextMenuEl']),
      el5['addEventListener']('click', () => {
        (this['_contextMenuTarget']?.['type'] === 'camera' && this['_contextMenuTarget']?.['cameraId']
          ? deletePanoramaSceneCamera({
              nodeId: this['id'],
              cameraId: this['_contextMenuTarget']['cameraId'],
            })
          : deleteSelectedPanoramaSceneObject({ nodeId: this['id'] }),
          this['_closeObjectContextMenu']());
      }),
      (this['_captureSafeFrameEl'] = document['createElement']('div')),
      (this['_captureSafeFrameEl']['className'] = 'panorama-scene-capture-safe-frame'),
      (this['_captureSafeFrameEl']['hidden'] = !![]),
      (this['_captureSafeFrameLabelEl'] = document['createElement']('div')),
      (this['_captureSafeFrameLabelEl']['className'] = 'panorama-scene-capture-safe-frame__label'),
      this['_captureSafeFrameEl']['appendChild'](this['_captureSafeFrameLabelEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_captureMenuEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_cameraListEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_focusMenuEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_mannequinMenuEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_assetBrowserEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_posePanelEl']),
      this['_bottomToolbarPopoverLayerEl']['appendChild'](this['_gridPanelEl']),
      this['_overlayEl']['appendChild'](this['_captureSafeFrameEl']),
      this['_overlayEl']['appendChild'](this['_timelinePanelEl']),
      this['_overlayEl']['appendChild'](this['_contextMenuEl']),
      this['_overlayEl']['appendChild'](this['_errorEl']),
      this['_infoDockEl']['appendChild'](this['_hintEl']),
      this['_infoDockEl']['appendChild'](this['_statusEl']),
      this['_shellEl']['appendChild'](this['_viewportEl']),
      this['_shellEl']['appendChild'](this['_overlayEl']),
      this['_shellEl']['appendChild'](this['_cornerToolbarEl']),
      this['_shellEl']['appendChild'](this['_infoDockEl']),
      this['_shellEl']['appendChild'](this['_bottomToolbarAnchorEl']),
      this['el']['appendChild'](this['_sceneToolbarEl']),
      this['el']['appendChild'](this['_editToolbarEl']),
      (this['_browserFullscreenAnchorEl'] = document['createElement']('div')),
      (this['_browserFullscreenAnchorEl']['className'] = 'panorama-scene-browser-fullscreen-anchor'),
      (this['_browserFullscreenAnchorEl']['hidden'] = !![]),
      this['el']['appendChild'](this['_browserFullscreenAnchorEl']),
      this['el']['appendChild'](this['_shellEl']),
      this['el']['addEventListener']('pointerenter', this['_handleNodePointerEnter']),
      this['el']['addEventListener']('pointerleave', this['_handleNodePointerLeave']),
      (this['_fileInput'] = document['createElement']('input')),
      (this['_fileInput']['className'] = 'panorama-scene-file-input'),
      (this['_fileInput']['type'] = 'file'),
      (this['_fileInput']['accept'] = 'image/*'),
      (this['_fileInput']['style']['display'] = 'none'),
      this['_fileInput']['addEventListener']('change', this['_handleFileInputChange']),
      this['el']['appendChild'](this['_fileInput']),
      (this['_bridge'] = new PanoramaScene3DBridge({
        container: this['_viewportEl'],
        onPanoramaStatusChange: ({ isLoaded: isLoaded, error: error }) => {
          updatePanoramaSceneLoadState({ nodeId: this['id'], isLoaded: isLoaded, error: error });
        },
      })),
      this['_bridge']['setDefaultSceneFocalLength']?.(this['_defaultSceneFocalLength']),
      (this['_interaction'] = new PanoramaSceneInteraction({
        viewportEl: this['_viewportEl'],
        overlayEl: this['_overlayEl'],
        bridge: this['_bridge'],
        getSceneState: () => getPanoramaSceneState(appStore['getStateRaw']()['nodes'][this['id']]),
        onViewCommit: (args3) => {
          applyPanoramaSceneViewCommit({ nodeId: this['id'], ...args3 });
        },
        onObjectCommit: ({ objectType: objectType, objectId: objectId, pose: pose }) => {
          updatePanoramaSceneObjectTransform({
            nodeId: this['id'],
            objectType: objectType,
            objectId: objectId,
            pose: pose,
          });
        },
        onSelectionChange: (objectType2, objectId2) => {
          (this['_selectNodeOnCanvas'](),
            setPanoramaSceneSelection({ nodeId: this['id'], objectType: objectType2, objectId: objectId2 }));
        },
        onSelectionBatchChange: (objectType3, objectIds, groupId = null) => {
          (this['_selectNodeOnCanvas'](),
            setPanoramaSceneSelectionBatch({
              nodeId: this['id'],
              objectType: objectType3,
              objectIds: objectIds,
              groupId: groupId,
            }));
        },
        onSelectionObjectsChange: (objects, activeObjectType = {}) => {
          (this['_selectNodeOnCanvas'](),
            setPanoramaSceneSelectionObjects({
              nodeId: this['id'],
              objects: objects,
              activeObjectType: activeObjectType['activeObjectType'] || null,
              activeObjectId: activeObjectType['activeObjectId'] || null,
              groupId: activeObjectType['groupId'] || null,
            }));
        },
        onSelectionClear: () => {
          clearPanoramaSceneSelection({ nodeId: this['id'] });
        },
        onObjectBatchCommit: ({ targets: targets }) => {
          updatePanoramaSceneObjectTransform({ nodeId: this['id'], targets: targets });
        },
      })),
      this['_interaction']['attach'](),
      (this['_resizeObserver'] = new ResizeObserver((value36) => {
        const box6 = value36?.[0x0]?.['contentRect'];
        (this['_bridge']?.['resize'](box6?.['width'], box6?.['height']), this['_positionMenus']());
      })),
      this['_resizeObserver']['observe'](this['_viewportEl']),
      (this['_unsubscribeSelection'] = appStore['subscribeSelector'](
        (state2) => {
          const list5 = Array['isArray'](state2['selectedNodeIds'])
            ? state2['selectedNodeIds']
            : [];
          return list5['includes'](this['id']);
        },
        (value37) => {
          const value38 = this['_isSelected'] === !![],
            enabled2 = value37 === !![];
          ((this['_isSelected'] = enabled2),
            value38 &&
              !enabled2 &&
              this['_sceneState']?.['ui']?.['isEditing'] === !![] &&
              this['_exitEditing'](),
            this['_syncAttachedUiVisibility'](this['_shouldShowBottomToolbar']()));
        },
      )),
      (this['_unsubscribeViewport'] = appStore['subscribeSelector'](
        (value39) => {
          const box7 = value39['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 };
          return (box7['x'] || 0x0) + '|' + (box7['y'] || 0x0) + '|' + (box7['zoom'] || 0x1);
        },
        () => {
          this['_positionMenus']();
        },
      )),
      this['_isPanorama360'] &&
        (this['_unsubscribePanoramaIncomingSync'] = appStore['subscribeSelector'](
          (value40) => this['_buildPanorama360IncomingImageSignature'](value40),
          () => {
            syncPanorama360FromIncomingImageEdge({ nodeId: this['id'] });
          },
        )),
      window['addEventListener']('resize', this['_handleWindowResize']),
      window['addEventListener']('pointerdown', this['_handleGlobalPointerDown'], !![]),
      window['addEventListener']('keydown', this['_handleWindowKeyDown'], !![]),
      window['addEventListener']('keyup', this['_handleWindowKeyUp'], !![]),
      window['addEventListener']('blur', this['_handleWindowBlur']),
      window['addEventListener']('shortcuts-updated', this['_handleShortcutsUpdated']),
      window['addEventListener']('panorama-scene:camera-shortcut', this['_handleCameraShortcutEvent']),
      window['addEventListener']('panorama-scene:capture-shortcut', this['_handleCaptureShortcutEvent']),
      (this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']())),
      this['update'](this['_data']),
      this['_isPanorama360'] && syncPanorama360FromIncomingImageEdge({ nodeId: this['id'] }),
      this['el']
    );
  }
  ['_handleShortcutsUpdated']() {
    (this['_syncToolbarState'](), this['_syncContextMenuShortcutLabel']());
  }
  ['_syncContextMenuShortcutLabel']() {
    const el9 = this['_contextMenuEl']?.['querySelector']?.('.panorama-scene-object-menu__kbd');
    if (el9) el9['textContent'] = getShortcutLabel_2('delete');
  }
  ['_resolveCameraBySlot'](value41) {
    const cameraSlot = normalizeCameraSlot(value41);
    if (!cameraSlot) return null;
    const list6 = resolveCameraSlotEntries(this['_sceneState']?.['cameras'] || []),
      args4 = list6['find']((value42) => value42['slot'] === cameraSlot);
    return args4 ? { ...args4 } : null;
  }
  ['_cancelCameraJumpAnimation']({ clearDraft: clearDraft = !![] } = {}) {
    ((this['_cameraJumpToken'] += 0x1),
      this['_cameraJumpRaf'] &&
        (cancelAnimationFrame(this['_cameraJumpRaf']), (this['_cameraJumpRaf'] = 0x0)),
      this['_pendingCameraJumpReleaseRaf'] &&
        (cancelAnimationFrame(this['_pendingCameraJumpReleaseRaf']),
        (this['_pendingCameraJumpReleaseRaf'] = 0x0)),
      (this['_pendingCameraJumpCommit'] = null),
      clearDraft && this['_bridge']?.['clearDraftView']?.());
  }
  ['_setDefaultSceneFocalLength'](value43) {
    const value44 = Math['max'](
      SCENE_FOCAL_LENGTH_MIN_MM,
      Math['min'](SCENE_FOCAL_LENGTH_MAX_MM, Number(value43) || SCENE_DEFAULT_FOCAL_LENGTH_MM),
    );
    ((this['_defaultSceneFocalLength'] = value44),
      this['_bridge']?.['setDefaultSceneFocalLength']?.(value44));
  }
  ['_getDefaultSceneFocalLength']() {
    return (
      this['_bridge']?.['getDefaultSceneFocalLength']?.() ||
      this['_defaultSceneFocalLength'] ||
      SCENE_DEFAULT_FOCAL_LENGTH_MM
    );
  }
  ['_isDefaultSceneView'](event8) {
    const event9 = createDefaultSceneView();
    return (
      Math['abs']((Number(event8?.['target']?.['x']) || 0x0) - event9['target']['x']) < 1e-9 &&
      Math['abs']((Number(event8?.['target']?.['y']) || 0x0) - event9['target']['y']) < 1e-9 &&
      Math['abs']((Number(event8?.['target']?.['z']) || 0x0) - event9['target']['z']) < 1e-9 &&
      Math['abs']((Number(event8?.['orbitYaw']) || 0x0) - event9['orbitYaw']) < 1e-9 &&
      Math['abs']((Number(event8?.['orbitPitch']) || 0x0) - event9['orbitPitch']) < 1e-9 &&
      Math['abs']((Number(event8?.['orbitDistance']) || 0x0) - event9['orbitDistance']) < 1e-9
    );
  }
  ['_maybeReleasePendingCameraJumpDraft']() {
    const enabled3 = this['_pendingCameraJumpCommit'];
    if (!enabled3 || this['_pendingCameraJumpReleaseRaf']) return;
    const value45 = this['_sceneState']?.['viewport']?.['sceneView'] || null,
      value46 = this['_getDefaultSceneFocalLength']();
    if (!areSceneViewsEquivalent(value45, enabled3['targetSceneView'])) return;
    if (Math['abs'](value46 - enabled3['targetFocalLength']) > 0.000001) return;
    const value47 = enabled3['token'];
    this['_pendingCameraJumpReleaseRaf'] = requestAnimationFrame(() => {
      this['_pendingCameraJumpReleaseRaf'] = 0x0;
      const enabled4 = this['_pendingCameraJumpCommit'];
      if (!enabled4 || enabled4['token'] !== value47) return;
      const value48 = this['_sceneState']?.['viewport']?.['sceneView'] || null,
        value49 = this['_getDefaultSceneFocalLength']();
      if (!areSceneViewsEquivalent(value48, enabled4['targetSceneView'])) return;
      if (Math['abs'](value49 - enabled4['targetFocalLength']) > 0.000001) return;
      ((this['_pendingCameraJumpCommit'] = null), this['_bridge']?.['clearDraftView']?.());
    });
  }
  ['_maybePreloadCharacterModels'](value50 = null) {
    if (this['_isPanorama360']) return;
    if (this['_hasRequestedCharacterPreload']) return;
    const enabled5 = this['_sceneState']?.['ui']?.['isEditing'] === !![],
      value51 = value50?.['ui']?.['isEditing'] === !![];
    if (!enabled5 || value51) return;
    ((this['_hasRequestedCharacterPreload'] = !![]),
      void preloadPanoramaCharacterModels()['catch'](() => {}));
  }
  ['_commitCameraJumpTarget']({
    targetPose: targetPose,
    referenceSceneView: referenceSceneView,
    targetFocalLength: targetFocalLength,
  }) {
    const targetSceneView = cameraPoseToSceneViewFromReference(targetPose, referenceSceneView);
    return (
      (this['_pendingCameraJumpCommit'] = {
        token: this['_cameraJumpToken'],
        targetSceneView: targetSceneView,
        targetFocalLength: targetFocalLength,
      }),
      this['_setDefaultSceneFocalLength'](targetFocalLength),
      applyPanoramaSceneViewCommit({
        nodeId: this['id'],
        sceneView: targetSceneView,
        activeView: 'default',
        activeCameraId: null,
      }),
      targetSceneView
    );
  }
  ['_animateCameraActivation'](value52) {
    if (!this['_supportsCameraFeatures']()) return;
    const rotation =
      (this['_sceneState']?.['cameras'] || [])['find']((value53) => value53['id'] === value52) || null;
    if (!rotation || this['_sceneState']?.['mode'] !== 'scene') return;
    const run2 = (value54) => {
        const box8 = value54?.['quaternion'];
        if (
          Number['isFinite'](Number(box8?.['x'])) &&
          Number['isFinite'](Number(box8?.['y'])) &&
          Number['isFinite'](Number(box8?.['z'])) &&
          Number['isFinite'](Number(box8?.['w']))
        )
          return new threeRuntime['Quaternion'](
            Number(box8['x']),
            Number(box8['y']),
            Number(box8['z']),
            Number(box8['w']),
          )['normalize']();
        const box9 = value54?.['rotation'] || { x: 0x0, y: 0x0, z: 0x0 };
        return new threeRuntime['Quaternion']()['setFromEuler'](
          new threeRuntime['Euler'](
            Number(box9['x']) || 0x0,
            Number(box9['y']) || 0x0,
            Number(box9['z']) || 0x0,
            'YXZ',
          ),
        );
      },
      x5 = run2(rotation),
      referenceSceneView2 = this['_sceneState']?.['viewport']?.['sceneView'] || createDefaultSceneView(),
      targetPose2 = {
        kind: 'camera',
        position: cloneVector3(rotation['position']),
        quaternion: { x: x5['x'], y: x5['y'], z: x5['z'], w: x5['w'] },
        rotation: rotation['rotation'] || quaternionToRotation(x5),
      },
      targetFocalLength2 = Number['isFinite'](Number(rotation?.['focalLength']))
        ? Number(rotation['focalLength'])
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
      fov2 = focalLengthToFov(targetFocalLength2);
    ((targetPose2['fov'] = fov2), this['_cancelCameraJumpAnimation']({ clearDraft: ![] }));
    const rotation2 = this['_bridge']?.['readCurrentViewPose']?.();
    if (!rotation2?.['position']) {
      this['_commitCameraJumpTarget']({
        targetPose: targetPose2,
        referenceSceneView: referenceSceneView2,
        targetFocalLength: targetFocalLength2,
      });
      return;
    }
    const value55 = this['_cameraJumpToken'],
      x6 = run2(rotation2),
      value56 = {
        kind: 'camera',
        position: cloneVector3(rotation2['position']),
        quaternion: { x: x6['x'], y: x6['y'], z: x6['z'], w: x6['w'] },
        rotation: rotation2['rotation'] || quaternionToRotation(x6),
        fov: Number['isFinite'](Number(rotation2['fov'])) ? Number(rotation2['fov']) : 0x3a,
      },
      value57 = 0x1c2,
      value58 = performance['now'](),
      handler5 = (value59) => {
        const position = interpolateVector3(value56['position'], targetPose2['position'], value59),
          x7 = new threeRuntime['Quaternion'](
            value56['quaternion']['x'],
            value56['quaternion']['y'],
            value56['quaternion']['z'],
            value56['quaternion']['w'],
          )['slerp'](
            new threeRuntime['Quaternion'](
              targetPose2['quaternion']['x'],
              targetPose2['quaternion']['y'],
              targetPose2['quaternion']['z'],
              targetPose2['quaternion']['w'],
            ),
            value59,
          ),
          fov3 = lerp(value56['fov'], targetPose2['fov'], value59);
        this['_bridge']?.['setDraftView']?.({
          kind: 'camera',
          position: position,
          quaternion: { x: x7['x'], y: x7['y'], z: x7['z'], w: x7['w'] },
          rotation: quaternionToRotation(x7),
          fov: fov3,
          disableSmoothing: !![],
        });
      };
    handler5(0x0);
    const value60 = (value61) => {
      if (value55 !== this['_cameraJumpToken']) return;
      const value62 = Math['max'](0x0, value61 - value58),
        count4 = Math['min'](0x1, value62 / value57),
        smootherstep2 = smootherstep(count4);
      handler5(smootherstep2);
      if (count4 < 0x1) {
        this['_cameraJumpRaf'] = requestAnimationFrame(value60);
        return;
      }
      ((this['_cameraJumpRaf'] = 0x0),
        this['_commitCameraJumpTarget']({
          targetPose: targetPose2,
          referenceSceneView: referenceSceneView2,
          targetFocalLength: targetFocalLength2,
        }),
        this['_maybeReleasePendingCameraJumpDraft']());
    };
    this['_cameraJumpRaf'] = requestAnimationFrame(value60);
  }
  ['_saveCurrentViewToCameraSlot'](slot3) {
    if (!this['_supportsCameraFeatures']()) return;
    const viewPose = this['_bridge']?.['readCurrentViewPose']?.();
    if (!viewPose) return;
    upsertPanoramaSceneCameraAtSlot({ nodeId: this['id'], slot: slot3, viewPose: viewPose });
  }
  ['_previewCameraTimelineAt'](value63, { fromPlayback: fromPlayback = ![] } = {}) {
    if (!fromPlayback) this['_stopCameraTimelinePlayback']({ clearDraft: ![] });
    const cameraTimeline = normalizeCameraTimeline(this['_sceneState']?.['cameraTimeline']),
      sampleCameraTimeline2 = sampleCameraTimeline(cameraTimeline, value63);
    if (!sampleCameraTimeline2) return;
    const draft = cameraTimelineSampleToDraft(sampleCameraTimeline2);
    if (!draft) return;
    ((this['_timelinePreviewTime'] = sampleCameraTimeline2['time']),
      this['_bridge']?.['setDraftView']?.(draft),
      setCameraTimelineDisplayTime(this['_timelinePanelEl'], sampleCameraTimeline2['time']));
  }
  ['_stopCameraTimelinePlayback']({ clearDraft: clearDraft = ![] } = {}) {
    this['_timelinePlaybackRaf'] &&
      (cancelAnimationFrame(this['_timelinePlaybackRaf']), (this['_timelinePlaybackRaf'] = 0x0));
    this['_isTimelinePlaying'] = ![];
    if (clearDraft) this['_bridge']?.['clearDraftView']?.();
    renderCameraTimelinePanel(this['_timelinePanelEl'], this['_sceneState']?.['cameraTimeline'], {
      currentTime: this['_timelinePreviewTime'],
      isPlaying: ![],
    });
  }
  ['_toggleCameraTimelinePlayback']() {
    if (this['_isTimelinePlaying']) {
      this['_stopCameraTimelinePlayback']({ clearDraft: ![] });
      return;
    }
    const cameraTimeline2 = normalizeCameraTimeline(this['_sceneState']?.['cameraTimeline']);
    if (cameraTimeline2['keyframes']['length'] < 0x2) return;
    ((this['_isTimelinePlaying'] = !![]),
      (this['_timelinePlaybackStartTime'] =
        this['_timelinePreviewTime'] >= cameraTimeline2['duration']
          ? 0x0
          : this['_timelinePreviewTime'] || cameraTimeline2['currentTime']),
      (this['_timelinePlaybackStartedAt'] = performance['now']()));
    const value64 = (value65) => {
      if (!this['_isTimelinePlaying']) return;
      const cameraTimeline3 = normalizeCameraTimeline(this['_sceneState']?.['cameraTimeline']),
        value66 = (value65 - this['_timelinePlaybackStartedAt']) / 0x3e8;
      let value67 = this['_timelinePlaybackStartTime'] + value66;
      if (cameraTimeline3['loop'] && cameraTimeline3['duration'] > 0x0) value67 %= cameraTimeline3['duration'];
      else {
        if (value67 >= cameraTimeline3['duration']) {
          (this['_previewCameraTimelineAt'](cameraTimeline3['duration'], { fromPlayback: !![] }),
            this['_stopCameraTimelinePlayback']({ clearDraft: ![] }));
          return;
        }
      }
      (this['_previewCameraTimelineAt'](value67, { fromPlayback: !![] }),
        (this['_timelinePlaybackRaf'] = requestAnimationFrame(value64)));
    };
    (renderCameraTimelinePanel(this['_timelinePanelEl'], cameraTimeline2, {
      currentTime: this['_timelinePreviewTime'],
      isPlaying: !![],
    }),
      (this['_timelinePlaybackRaf'] = requestAnimationFrame(value64)));
  }
  ['_handleCameraShortcutEvent'](value68) {
    if (!this['_supportsCameraFeatures']()) return;
    const value69 = value68?.['detail'] || {};
    if (value69['nodeId'] !== this['id']) return;
    if (!this['_isEditing']()) return;
    const cameraSlot2 = normalizeCameraSlot(value69['slot']);
    if (!cameraSlot2) return;
    if (value69['mode'] === 'save') {
      this['_saveCurrentViewToCameraSlot'](cameraSlot2);
      return;
    }
    const enabled6 = this['_resolveCameraBySlot'](cameraSlot2);
    if (!enabled6?.['camera']?.['id']) return;
    this['_animateCameraActivation'](enabled6['camera']['id']);
  }
  ['_handleCaptureShortcutEvent'](value70) {
    const value71 = value70?.['detail'] || {};
    if (value71['nodeId'] !== this['id']) return;
    if (!this['_isEditing']()) return;
    void this['_handleToolbarAction']('capture');
  }
  ['_createCaptureMenu']() {
    const el10 = document['createElement']('div');
    return (
      (el10['className'] = 'panorama-capture-menu'),
      (el10['hidden'] = !![]),
      (el10['innerHTML'] =
        '\n      <div class="panorama-capture-menu__grid">\n        ' +
        PANORAMA_CAPTURE_MODE_OPTIONS['map']((event10) => {
          const label = getCaptureModeLabel(event10);
          return (
            '\n            <button\n              type="button"\n              class="panorama-capture-menu__item"\n              data-capture-mode="' +
            event10['key'] +
            '"\n              aria-label="' +
            panoramaSceneText('capture.modeAria', { label: label }) +
            '\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22panorama-capture-menu__icon\x20' +
            event10['iconClass'] +
            '" aria-hidden="true">\n                <span class="panorama-capture-menu__icon-shape"></span>\n              </span>\n              <span class="panorama-capture-menu__label">' +
            label +
            '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'
          );
        })['join']('') +
        '\n      </div>\n    '),
      el10
    );
  }
  ['_handleCaptureMenuClick'](event11) {
    const el11 = event11['target']?.['closest']?.('[data-capture-mode]');
    if (!(el11 instanceof HTMLButtonElement)) return;
    const mode2 = el11['dataset']['captureMode'] || 'adaptive';
    (this['_selectNodeOnCanvas'](),
      setPanoramaSceneCaptureMode({
        nodeId: this['id'],
        mode: mode2,
        showSafeFrame: mode2 !== 'adaptive',
      }));
  }
  ['_createFocusMenu']() {
    const el12 = document['createElement']('div');
    ((el12['className'] = 'panorama-scene-focus-menu'), (el12['hidden'] = !![]));
    const el13 = document['createElement']('div');
    el13['className'] = 'panorama-scene-focus-menu__header';
    const el14 = document['createElement']('span');
    ((el14['className'] = 'panorama-scene-focus-menu__title'),
      (el14['textContent'] = panoramaSceneText('focus.title')),
      el13['appendChild'](el14));
    const el15 = document['createElement']('span');
    ((el15['className'] = 'panorama-scene-focus-menu__value'), el13['appendChild'](el15));
    const el16 = document['createElement']('input');
    ((el16['className'] = 'panorama-scene-focus-menu__slider'),
      (el16['type'] = 'range'),
      (el16['min'] = String(SCENE_FOCAL_LENGTH_MIN_MM)),
      (el16['max'] = String(SCENE_FOCAL_LENGTH_MAX_MM)),
      (el16['step'] = '1'),
      el16['setAttribute']('aria-label', panoramaSceneText('focus.sliderAria')));
    const run3 = () => {
      const value72 = Math['max'](
        SCENE_FOCAL_LENGTH_MIN_MM,
        Math['min'](
          SCENE_FOCAL_LENGTH_MAX_MM,
          Number(this['_getDefaultSceneFocalLength']()) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
      );
      ((el16['value'] = String(value72)),
        (el15['textContent'] = String(Math['round'](value72))));
    };
    return (
      el16['addEventListener']('input', (event12) => {
        const value73 = Math['max'](
          SCENE_FOCAL_LENGTH_MIN_MM,
          Math['min'](
            SCENE_FOCAL_LENGTH_MAX_MM,
            Number(event12['currentTarget']?.['value']) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
          ),
        );
        ((el15['textContent'] = String(Math['round'](value73))),
          this['_setDefaultSceneFocalLength'](value73));
      }),
      el12['appendChild'](el13),
      el12['appendChild'](el16),
      (el12['_syncValue'] = run3),
      run3(),
      el12
    );
  }
  ['_resolveCaptureMode']() {
    return normalizeCaptureMode(this['_sceneState']?.['capture']?.['mode']);
  }
  ['_resolveCaptureFrameRect']() {
    const value74 = this['_viewportEl']?.['clientWidth'] || 0x0,
      value75 = this['_viewportEl']?.['clientHeight'] || 0x0;
    return computeCaptureFrameRect(value74, value75, this['_resolveCaptureMode']());
  }
  ['_syncCaptureMenuState']() {
    if (!this['_captureMenuEl']) return;
    const value76 = this['_resolveCaptureMode']();
    this['_captureMenuEl']['querySelectorAll']('[data-capture-mode]')['forEach']((el17) => {
      const value77 = el17['dataset']['captureMode'] === value76;
      (el17['classList']['toggle']('is-active', value77),
        el17['setAttribute']('aria-pressed', value77 ? 'true' : 'false'));
    });
  }
  ['_syncCaptureSafeFrame']() {
    if (!this['_captureSafeFrameEl'] || !this['_captureSafeFrameLabelEl']) return;
    const value78 = this['_resolveCaptureMode'](),
      enabled7 =
        this['_isEditing']() &&
        this['_isNodeSelected']() &&
        value78 !== 'adaptive' &&
        this['_sceneState']?.['capture']?.['showSafeFrame'] === !![];
    ((this['_captureSafeFrameEl']['hidden'] = !enabled7),
      this['_captureSafeFrameEl']['classList']['toggle']('is-visible', enabled7),
      this['_captureSafeFrameEl']['classList']['toggle']('is-adaptive', value78 === 'adaptive'));
    if (!enabled7) return;
    const box10 = this['_resolveCaptureFrameRect']();
    ((this['_captureSafeFrameEl']['style']['left'] = box10['x'] + 'px'),
      (this['_captureSafeFrameEl']['style']['top'] = box10['y'] + 'px'),
      (this['_captureSafeFrameEl']['style']['width'] = box10['width'] + 'px'),
      (this['_captureSafeFrameEl']['style']['height'] = box10['height'] + 'px'),
      (this['_captureSafeFrameLabelEl']['textContent'] = getCaptureModeLabel(value78)));
  }
  async ['_captureViewportByCurrentMode']() {
    const blob2 = await this['_bridge']?.['captureBlob']?.({ includeEditorOverlays: ![] });
    if (!blob2) return null;
    return cropCaptureBlobToFrame({
      blob: blob2,
      viewportWidth: this['_viewportEl']?.['clientWidth'] || 0x0,
      viewportHeight: this['_viewportEl']?.['clientHeight'] || 0x0,
      mode: this['_resolveCaptureMode'](),
    });
  }
  ['_createGridPanel']() {
    const el18 = document['createElement']('div');
    ((el18['className'] = 'panorama-grid-panel'),
      (el18['innerHTML'] =
        '\n      <div class="panorama-grid-panel__title">' +
        panoramaSceneText('grid.title') +
        '</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22panorama-grid-panel__metrics-row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label\x20class=\x22panorama-grid-panel__metric-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22panorama-grid-panel__metric-label\x22\x20data-grid-label=\x22rows\x22>' +
        panoramaSceneText('grid.rows') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="rows" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.rowsAria') +
        '" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="cols">' +
        panoramaSceneText('grid.cols') +
        '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22panorama-grid-panel__metric-control\x20rh-stepper\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-stepper-value\x20panorama-grid-panel__metric-stepper\x22\x20data-grid-field=\x22cols\x22\x20role=\x22spinbutton\x22\x20aria-label=\x22' +
        panoramaSceneText('grid.colsAria') +
        '" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__metrics-row">\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="spacingX">' +
        panoramaSceneText('grid.spacingX') +
        '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22panorama-grid-panel__metric-control\x20rh-stepper\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-stepper-value\x20panorama-grid-panel__metric-stepper\x22\x20data-grid-field=\x22spacingX\x22\x20role=\x22spinbutton\x22\x20aria-label=\x22' +
        panoramaSceneText('grid.spacingXAria') +
        '\x22\x20aria-valuenow=\x221.0\x22\x20tabindex=\x220\x22>1.0</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label\x20class=\x22panorama-grid-panel__metric-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22panorama-grid-panel__metric-label\x22\x20data-grid-label=\x22spacingZ\x22>' +
        panoramaSceneText('grid.spacingZ') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="spacingZ" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.spacingZAria') +
        '" aria-valuenow="1.0" tabindex="0">1.0</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__appearance-row">\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--gender">\n          <span class="panorama-grid-panel__appearance-label" data-grid-label="gender">' +
        panoramaSceneText('grid.gender') +
        '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22panorama-grid-panel__appearance-options\x20panorama-grid-panel__appearance-options--gender\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        PANORAMA_MANNEQUIN_GENDER_OPTIONS['map'](([value79, , value80]) => {
          const label2 = getPanoramaMannequinGenderLabel(value79);
          return (
            '<button type="button" class="panorama-mannequin-menu__gender-btn" data-grid-gender="' +
            value79 +
            '" aria-label="' +
            panoramaSceneText('grid.setGenderAria', { label: label2 }) +
            '\x22>' +
            value80 +
            '</button>'
          );
        })['join']('') +
        '\n          </div>\n        </div>\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--color">\n          <span class="panorama-grid-panel__appearance-label" data-grid-label="color">' +
        panoramaSceneText('grid.color') +
        '</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--color">\n            ' +
        PANORAMA_MANNEQUIN_COLOR_OPTIONS['map'](([value81]) => {
          const label3 = getPanoramaMannequinColorLabel(value81);
          return (
            '<button type="button" class="panorama-mannequin-menu__color-btn" data-grid-color="' +
            value81 +
            '" aria-label="' +
            panoramaSceneText('grid.setColorAria', { label: label3 }) +
            '"></button>'
          );
        })['join']('') +
        '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22panorama-grid-panel__apply\x22>' +
        panoramaSceneText('grid.apply') +
        '</button>\x0a\x20\x20\x20\x20'));
    const value82 = {
        rows: { min: 0x1, max: 0xc, step: 0x1, precision: 0x0 },
        cols: { min: 0x1, max: 0xc, step: 0x1, precision: 0x0 },
        spacingX: { min: 0.5, max: 0x8, step: 0.1, precision: 0x1 },
        spacingZ: { min: 0.5, max: 0x8, step: 0.1, precision: 0x1 },
      },
      handler6 = (value83, value84) => {
        const enabled8 = value82[value83];
        if (!enabled8) return null;
        const value85 = Number(value84);
        if (!Number['isFinite'](value85)) return null;
        const value86 = Math['min'](enabled8['max'], Math['max'](enabled8['min'], value85));
        if (enabled8['precision'] === 0x0) return Math['round'](value86);
        return Number(value86['toFixed'](enabled8['precision']));
      },
      handler7 = (value87, value88) => {
        const enabled9 = value82[value87];
        if (!enabled9 || !Number['isFinite'](Number(value88))) return '';
        return enabled9['precision'] === 0x0
          ? String(Math['round'](Number(value88)))
          : Number(value88)['toFixed'](enabled9['precision']);
      },
      handler8 = (el19, value89, value90) => {
        if (!el19) return;
        const value91 = handler7(value89, value90);
        el19['tagName'] === 'INPUT'
          ? (el19['value'] = value91)
          : ((el19['textContent'] = value91),
            el19['setAttribute']('aria-valuenow', String(value90)));
      },
      handler9 = (value92, value93) => {
        const value94 = handler6(value92, value93);
        if (!Number['isFinite'](value94)) return;
        setPanoramaSceneGridPlacement({ nodeId: this['id'], patch: { [value92]: value94 } });
        const value95 = el18['querySelector']('[data-grid-field="' + value92 + '\x22]');
        handler8(value95, value92, value94);
      };
    return (
      Object['keys'](value82)['forEach']((value96) => {
        const value97 = value82[value96],
          enabled10 = el18['querySelector']('[data-grid-field="' + value96 + '\x22]');
        if (!enabled10) return;
        let box11 = null,
          enabled11 = ![];
        const run4 = () => {
            const value98 = handler6(value96, this['_sceneState']?.['gridPlacement']?.[value96]);
            if (Number['isFinite'](value98)) return value98;
            const value99 = handler6(value96, enabled10['getAttribute']('aria-valuenow'));
            if (Number['isFinite'](value99)) return value99;
            return value97['min'];
          },
          value100 = (event13) => {
            if (!box11) return;
            const value101 = event13['clientX'] - box11['x'];
            if (!box11['moved'] && Math['abs'](value101) >= 0x3) box11['moved'] = !![];
            const value102 = Math['trunc'](value101 / 0x6),
              value103 = box11['v'] + value102 * value97['step'];
            if (value103 === box11['last']) return;
            ((box11['last'] = value103), handler9(value96, value103));
          },
          value104 = () => {
            if (!box11) return;
            const value105 = box11['moved'];
            (box11['el']['classList']['remove']('is-dragging'),
              document['removeEventListener']('mousemove', value100),
              document['removeEventListener']('mouseup', value104),
              value105 && ((enabled11 = !![]), (this['_suppressDocClickOnce'] = !![])),
              (box11 = null));
          },
          handler10 = (value106) => {
            const value107 = run4(),
              el20 = document['createElement']('input');
            ((el20['className'] = 'rh-stepper-input panorama-grid-panel__metric-stepper-input'),
              (el20['type'] = 'number'),
              (el20['step'] = String(value97['step'])),
              (el20['min'] = String(value97['min'])),
              (el20['max'] = String(value97['max'])),
              (el20['value'] = handler7(value96, value107)),
              value106['replaceWith'](el20),
              el20['focus'](),
              el20['select']());
            const run5 = (value108) => {
              const value109 = value108 ? el20['value'] : value107,
                value110 = handler6(value96, value109),
                value111 = Number['isFinite'](value110) ? value110 : value107,
                el21 = document['createElement']('div');
              ((el21['className'] = 'rh-stepper-value panorama-grid-panel__metric-stepper'),
                (el21['dataset']['gridField'] = value96),
                el21['setAttribute']('role', 'spinbutton'),
                el21['setAttribute']('tabindex', '0'));
              const value112 = value106['getAttribute']('aria-label') || value96;
              (el21['setAttribute']('aria-label', value112),
                el21['setAttribute']('aria-valuenow', String(value111)),
                (el21['textContent'] = handler7(value96, value111)),
                el20['replaceWith'](el21),
                value108 ? handler9(value96, value111) : handler8(el21, value96, value111),
                handler11(el21));
            };
            ((el20['onkeydown'] = (event14) => {
              if (event14['key'] === 'Enter') run5(!![]);
              if (event14['key'] === 'Escape') run5(![]);
            }),
              (el20['onblur'] = () => run5(!![])));
          },
          handler11 = (el22) => {
            ((el22['onclick'] = (event15) => {
              event15['stopPropagation']();
              if (enabled11) {
                enabled11 = ![];
                return;
              }
              handler10(el22);
            }),
              (el22['onkeydown'] = (event16) => {
                const value113 =
                  event16['key'] === 'ArrowRight' ? 0x1 : event16['key'] === 'ArrowLeft' ? -0x1 : 0x0;
                if (value113) {
                  (event16['preventDefault'](), event16['stopPropagation']());
                  const value114 = run4();
                  handler9(value96, value114 + value113 * value97['step']);
                  return;
                }
                (event16['key'] === 'Enter' || event16['key'] === '\x20') &&
                  (event16['preventDefault'](), event16['stopPropagation'](), handler10(el22));
              }),
              (el22['onmousedown'] = (x8) => {
                if (x8['button'] !== 0x0) return;
                (x8['preventDefault'](), (enabled11 = ![]));
                const v = run4();
                ((box11 = {
                  x: x8['clientX'],
                  v: v,
                  moved: ![],
                  last: v,
                  el: el22,
                }),
                  el22['classList']['add']('is-dragging'),
                  document['addEventListener']('mousemove', value100),
                  document['addEventListener']('mouseup', value104));
              }));
          };
        handler11(enabled10);
      }),
      el18['querySelectorAll']('[data-grid-gender]')['forEach']((el23) => {
        el23['addEventListener']('click', () => {
          const gender4 = el23['dataset']['gridGender'] === 'female' ? 'female' : 'male';
          setPanoramaSceneGridPlacement({ nodeId: this['id'], patch: { gender: gender4 } });
        });
      }),
      el18['querySelectorAll']('[data-grid-color]')['forEach']((el24) => {
        el24['addEventListener']('click', () => {
          const colorKey2 = el24['dataset']['gridColor'] || 'blue';
          setPanoramaSceneGridPlacement({ nodeId: this['id'], patch: { colorKey: colorKey2 } });
        });
      }),
      el18['querySelector']('.panorama-grid-panel__apply')?.['addEventListener']('click', () => {
        (this['_selectNodeOnCanvas'](),
          addPanoramaSceneMannequinGrid({
            nodeId: this['id'],
            viewPose: this['_bridge']?.['readCurrentViewPose']?.(),
          }),
          (this['_openMenuKey'] = null),
          this['_syncOverlayState']());
      }),
      el18
    );
  }
  ['_isNodeSelected']() {
    return this['_isSelected'] === !![];
  }
  ['_handleWindowResize']() {
    (this['_positionMenus'](), this['_syncCaptureSafeFrame']());
  }
  ['_isBrowserFullscreen']() {
    return !!this['_browserFullscreenOverlayEl'];
  }
  async ['_enterBrowserFullscreen']() {
    if (this['_isBrowserFullscreen']() || !this['_shellEl']) return;
    const el25 = document['createElement']('div');
    el25['className'] = 'panorama-scene-browser-fullscreen';
    const el26 = document['createElement']('button');
    ((el26['type'] = 'button'),
      (el26['className'] = 'panorama-scene-browser-fullscreen__exit'),
      (el26['textContent'] = panoramaSceneText('toolbar.exitFullscreen')),
      el26['setAttribute']('aria-label', panoramaSceneText('toolbar.exitFullscreen')),
      el26['addEventListener']('click', () => {
        void this['_exitBrowserFullscreen']();
      }),
      (this['_browserFullscreenExitBtnEl'] = el26),
      el25['appendChild'](el26),
      el25['appendChild'](this['_shellEl']),
      document['body']['appendChild'](el25),
      (this['_browserFullscreenOverlayEl'] = el25),
      this['_syncToolbarState'](),
      this['_syncOverlayState'](),
      this['_positionMenus'](),
      this['_bridge']?.['resize']());
  }
  async ['_exitBrowserFullscreen']({ skipSync: skipSync = ![] } = {}) {
    if (!this['_isBrowserFullscreen']()) return;
    const el27 = this['_browserFullscreenOverlayEl'];
    ((this['_browserFullscreenOverlayEl'] = null), (this['_browserFullscreenExitBtnEl'] = null));
    this['_shellEl'] &&
      this['el']?.['isConnected'] &&
      (this['_browserFullscreenAnchorEl']?.['parentElement'] === this['el']
        ? this['el']['insertBefore'](this['_shellEl'], this['_browserFullscreenAnchorEl']['nextSibling'])
        : this['el']['appendChild'](this['_shellEl']));
    el27?.['remove']?.();
    if (skipSync) return;
    (this['_syncToolbarState'](),
      this['_syncOverlayState'](),
      this['_positionMenus'](),
      this['_bridge']?.['resize']());
  }
  ['_handleOwnedNavigationKeyDown'](event17, enabled12) {
    if (!enabled12 || event17['ctrlKey'] || event17['metaKey'] || event17['altKey']) return ![];
    if (!event17['repeat'] && (event17['key'] === 'f' || event17['key'] === 'F'))
      return (
        event17['preventDefault'](),
        event17['stopPropagation'](),
        event17['shiftKey']
          ? setPanoramaSceneInteractionOptions({
              nodeId: this['id'],
              patch: {
                navigationMode: this['_sceneState']?.['ui']?.['navigationMode'] === 'fly' ? 'orbit' : 'fly',
              },
            })
          : focusPanoramaSceneSelection({
              nodeId: this['id'],
              frame: this['_bridge']?.['readSelectionFrame']?.(),
            }),
        !![]
      );
    return (
      this['_sceneState']?.['ui']?.['navigationMode'] === 'fly' &&
      this['_interaction']?.['handleFlightKeyDown']?.(event17) === !![]
    );
  }
  ['_handleWindowKeyDown'](event18) {
    if (event18['key'] === 'Escape' && this['_isBrowserFullscreen']()) {
      (event18['preventDefault'](),
        event18['stopPropagation'](),
        event18['stopImmediatePropagation']?.(),
        void this['_exitBrowserFullscreen']());
      return;
    }
    if (!this['_isEditing']()) return;
    if (
      this['_contextMenuEl']?.['hidden'] === ![] &&
      resolveShortcutActionForEvent(event18, ['delete']) === 'delete'
    ) {
      (event18['preventDefault']?.(),
        event18['stopPropagation']?.(),
        event18['stopImmediatePropagation']?.(),
        this['_contextMenuEl']['querySelector']?.('.act-delete-selected')?.['click']?.());
      return;
    }
    const value115 = event18['target'],
      enabled13 =
        value115 instanceof HTMLElement &&
        (value115['isContentEditable'] ||
          value115['tagName'] === 'INPUT' ||
          value115['tagName'] === 'TEXTAREA' ||
          value115['tagName'] === 'SELECT'),
      value116 =
        value115 instanceof HTMLElement &&
        (this['el']?.['contains']?.(value115) ||
          this['_browserFullscreenOverlayEl']?.['contains']?.(value115));
    if (!enabled13 && this['_handleOwnedNavigationKeyDown'](event18, value116)) {
      event18['stopImmediatePropagation']?.();
      return;
    }
    if (event18['defaultPrevented']) return;
    if (enabled13) return;
  }
  ['_handleWindowKeyUp'](value117) {
    if (!this['_isEditing']()) return;
    this['_interaction']?.['handleFlightKeyUp']?.(value117) && value117['stopImmediatePropagation']?.();
  }
  ['_handleWindowBlur']() {
    this['_interaction']?.['cancelFlightNavigation']?.({ commit: !![] });
  }
  ['_syncAttachedUiVisibility'](enabled14) {
    this['_bottomToolbarAnchorEl'] && (this['_bottomToolbarAnchorEl']['hidden'] = !enabled14);
    const enabled15 = this['_isNodeSelected']() || this['_isNodeHovered'];
    this['_infoDockEl'] && (this['_infoDockEl']['hidden'] = !enabled15);
  }
  ['_handleNodePointerEnter']() {
    ((this['_isNodeHovered'] = !![]), this['_syncAttachedUiVisibility'](this['_shouldShowBottomToolbar']()));
  }
  ['_handleNodePointerLeave'](value118) {
    const value119 = value118['relatedTarget'];
    if (value119 && this['el']['contains'](value119)) return;
    ((this['_isNodeHovered'] = ![]),
      this['_closeObjectContextMenu'](),
      this['_syncAttachedUiVisibility'](this['_shouldShowBottomToolbar']()));
  }
  ['_selectNodeOnCanvas']({ preserveExistingSelection: preserveExistingSelection = ![] } = {}) {
    const list7 = appStore['getStateRaw']()['selectedNodeIds'] || [];
    if (preserveExistingSelection && list7['includes'](this['id'])) return;
    if (list7['length'] === 0x1 && list7[0x0] === this['id']) return;
    appStore['setSelectedNodes']([this['id']]);
  }
  ['_isEditing']() {
    return this['_sceneState']?.['ui']?.['isEditing'] === !![] && this['_data']?.['isCollapsed'] !== !![];
  }
  ['_shouldShowBottomToolbar']() {
    const value120 = this['_isNodeSelected']();
    return this['_isEditing']() && value120;
  }
  ['_resolveMouseTool']() {
    return (
      this['_sceneState']?.['ui']?.['mouseTool'] ||
      (this['_sceneState']?.['ui']?.['activeTool'] === 'box-select' ? 'box-select' : 'navigate')
    );
  }
  ['_toggleMouseTool']() {
    const value121 = String(
        this['_sceneState']?.['ui']?.['mouseTool'] || this['_sceneState']?.['ui']?.['activeTool'] || '',
      )['trim'](),
      tool = resolveNextPanoramaMouseTool(value121);
    setPanoramaSceneTool({ nodeId: this['id'], tool: tool });
  }
  ['_resolveTransformTool']() {
    return (
      this['_sceneState']?.['ui']?.['transformTool'] ||
      (this['_sceneState']?.['ui']?.['activeTool'] === 'move' ||
      this['_sceneState']?.['ui']?.['activeTool'] === 'rotate' ||
      this['_sceneState']?.['ui']?.['activeTool'] === 'scale'
        ? this['_sceneState']['ui']['activeTool']
        : 'move')
    );
  }
  ['_supportsPanoramaUpload']() {
    return this['_isPanorama360'] === !![];
  }
  ['_supportsCubeCreation']() {
    return this['_isPanorama360'] !== !![];
  }
  ['_supportsCameraFeatures']() {
    return this['_isPanorama360'] !== !![];
  }
  ['_buildPanorama360IncomingImageSignature'](value122) {
    if (!this['_isPanorama360']) return '';
    const value123 = value122?.['nodes'] || {},
      enabled16 = value123[this['id']];
    if (!enabled16) return '';
    const enabled17 = String(enabled16['parentId'] || '')['trim'](),
      list8 = Object['values'](value122?.['edges'] || {}),
      list9 = [];
    return (
      list8['forEach']((enabled18) => {
        if (!enabled18) return;
        const enabled19 = enabled18['targetId'] === this['id'],
          enabled20 = !!enabled17 && enabled18['targetId'] === enabled17;
        if (!enabled19 && !enabled20) return;
        const enabled21 = value123[enabled18['sourceId']];
        if (!enabled21 || !isPanorama360ImageSourceType(enabled21['type'])) return;
        const value124 =
            typeof enabled21['_bizRev'] === 'number' || typeof enabled21['_bizRev'] === 'string'
              ? String(enabled21['_bizRev'])
              : '',
          list10 = Array['isArray'](enabled21['images']) ? enabled21['images'] : [],
          value125 = Number(enabled21['mainImageIndex']),
          value126 = Number['isFinite'](value125)
            ? Math['max'](0x0, Math['min'](list10['length'] - 0x1, Math['trunc'](value125)))
            : 0x0,
          value127 = list10[value126] || list10[0x0] || null,
          value128 = [
            String(enabled21['localPath'] || '')['trim'](),
            String(enabled21['originalLocalPath'] || '')['trim'](),
            String(enabled21['displayLocalPath'] || '')['trim'](),
            String(enabled21['thumbLocalPath'] || '')['trim'](),
            String(enabled21['imageUrl'] || '')['trim'](),
            String(enabled21['src'] || '')['trim'](),
            String(enabled21['thumbUrl'] || '')['trim'](),
            String(enabled21['fileName'] || '')['trim'](),
            String(enabled21['mainImageIndex'] || '')['trim'](),
            String(value127?.['localPath'] || '')['trim'](),
            String(value127?.['originalLocalPath'] || '')['trim'](),
            String(value127?.['displayLocalPath'] || '')['trim'](),
            String(value127?.['thumbLocalPath'] || '')['trim'](),
            String(value127?.['imageUrl'] || '')['trim'](),
            String(value127?.['thumbUrl'] || '')['trim'](),
          ]['join'](':');
        list9['push'](
          enabled18['id'] +
            ':' +
            enabled18['sourceId'] +
            ':' +
            Number(enabled18['createdAt'] || 0x0) +
            ':' +
            value124 +
            ':' +
            value128,
        );
      }),
      list9['sort']((value129, value130) => value129['localeCompare'](value130)),
      list9['join']('|')
    );
  }
  ['_enterEditing']() {
    (this['_selectNodeOnCanvas'](),
      this['_data']?.['isCollapsed'] && setPanoramaSceneCollapsed({ nodeId: this['id'], isCollapsed: ![] }),
      setPanoramaSceneEditing({ nodeId: this['id'], isEditing: !![] }),
      requestAnimationFrame(() => this['_viewportEl']?.['focus']()));
  }
  ['_exitEditing']() {
    (this['_closeMenus'](),
      this['_interaction']?.['cancelFlightNavigation']?.({ commit: !![] }),
      setPanoramaSceneEditing({ nodeId: this['id'], isEditing: ![] }));
  }
  async ['_handleFileInputChange'](event19) {
    if (!this['_supportsPanoramaUpload']()) {
      event19['target']['value'] = '';
      return;
    }
    const file = event19['target']['files']?.[0x0];
    if (!file) return;
    this['_selectNodeOnCanvas']();
    const uploadPanoramaSceneImage2 = await uploadPanoramaSceneImage({ nodeId: this['id'], file: file });
    (uploadPanoramaSceneImage2 && this['_isPanorama360'] && this['_enterEditing'](), (event19['target']['value'] = ''));
  }
  ['_handleViewportPointerDown'](event20) {
    const enabled22 = this['_isEditing']();
    (this['_selectNodeOnCanvas']({ preserveExistingSelection: !enabled22 }),
      this['_closeObjectContextMenu']());
    if (!enabled22) return;
    (this['_openMenuKey'] && ((this['_openMenuKey'] = null), this['_syncOverlayState']()),
      this['_viewportEl']['focus']?.(),
      event20['stopPropagation']());
  }
  ['_handleViewportContextMenu'](event21) {
    if (!this['_isEditing']()) return;
    (event21['preventDefault'](), event21['stopPropagation']());
    if (this['_sceneState']?.['ui']?.['navigationMode'] === 'fly') {
      this['_closeObjectContextMenu']();
      return;
    }
    this['_selectNodeOnCanvas']();
    const objectType4 = this['_bridge']?.['pick']?.(event21['clientX'], event21['clientY']);
    if (objectType4?.['objectType'] && objectType4?.['objectId'])
      setPanoramaSceneSelection({
        nodeId: this['id'],
        objectType: objectType4['objectType'],
        objectId: objectType4['objectId'],
      });
    else {
      if (!this['_sceneState']?.['selection']?.['selectedObjectId']) {
        this['_closeObjectContextMenu']();
        return;
      }
    }
    this['_openObjectContextMenu'](event21['clientX'], event21['clientY'], { type: 'selection' });
  }
  ['_handleGlobalPointerDown'](event22) {
    if (!this['_contextMenuEl'] || this['_contextMenuEl']['hidden']) return;
    if (this['_contextMenuEl']['contains'](event22['target'])) return;
    this['_closeObjectContextMenu']();
  }
  ['_openObjectContextMenu'](value131, value132, value133 = { type: 'selection' }) {
    if (!this['_contextMenuEl'] || !this['_overlayEl']) return;
    const box12 = this['_overlayEl']['getBoundingClientRect']();
    if (!box12['width'] || !box12['height']) return;
    const value134 = this['_contextMenuEl']['offsetWidth'] || 0x84,
      value135 = this['_contextMenuEl']['offsetHeight'] || 0x2c,
      value136 = Math['max'](
        0x0,
        Math['min'](value131 - box12['left'], box12['width'] - value134),
      ),
      value137 = Math['max'](
        0x0,
        Math['min'](value132 - box12['top'], box12['height'] - value135),
      );
    ((this['_contextMenuEl']['style']['left'] = value136 + 'px'),
      (this['_contextMenuEl']['style']['top'] = value137 + 'px'),
      (this['_contextMenuTarget'] = value133),
      (this['_contextMenuEl']['hidden'] = ![]),
      this['_contextMenuEl']['classList']['add']('is-visible'));
  }
  ['_closeObjectContextMenu']() {
    if (!this['_contextMenuEl']) return;
    ((this['_contextMenuTarget'] = null),
      this['_contextMenuEl']['classList']['remove']('is-visible'),
      (this['_contextMenuEl']['hidden'] = !![]));
  }
  ['_handleViewportDoubleClick'](event23) {
    (event23['preventDefault'](), event23['stopPropagation']());
    if (this['_isEditing']() && this['_sceneState']?.['mode'] === 'scene') {
      const objectType5 = this['_bridge']?.['pick']?.(event23['clientX'], event23['clientY']);
      if (objectType5?.['objectType'] && objectType5?.['objectId']) {
        (this['_selectNodeOnCanvas'](),
          setPanoramaSceneSelection({
            nodeId: this['id'],
            objectType: objectType5['objectType'],
            objectId: objectType5['objectId'],
          }),
          focusPanoramaSceneSelection({
            nodeId: this['id'],
            frame: this['_bridge']?.['readObjectFrame']?.(objectType5['objectType'], objectType5['objectId']),
          }));
        return;
      }
    }
    this['_enterEditing']();
  }
  ['_openPanoramaFilePicker']() {
    if (!this['_supportsPanoramaUpload']()) return;
    this['_fileInput']?.['click']();
  }
  ['_openMenu'](enabled23) {
    if (!enabled23) return;
    (clearTimeout(this['_menuHideTimer']),
      (this['_openMenuKey'] = enabled23),
      this['_positionMenus'](),
      this['_syncOverlayState']());
  }
  ['_closeMenus']() {
    (clearTimeout(this['_menuHideTimer']), (this['_openMenuKey'] = null), this['_syncOverlayState']());
  }
  ['_scheduleMenuHide'](value138) {
    (clearTimeout(this['_menuHideTimer']),
      this['_openMenuKey'] === value138 && ((this['_openMenuKey'] = null), this['_syncOverlayState']()));
  }
  ['_handleBottomToolbarPointerEnter'](event24) {
    const el28 = event24['target']?.['closest']?.('button');
    if (!el28) return;
    if (el28['classList']['contains']('act-capture')) {
      this['_openMenu']('capture');
      return;
    }
    if (!this['_isPanorama360'] && el28['classList']['contains']('act-focus')) {
      this['_openMenu']('focus');
      return;
    }
    if (el28['classList']['contains']('act-mannequin-entry')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_openMenu']('mannequin');
      return;
    }
    if (el28['classList']['contains']('act-asset-library')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_openMenu']('assets');
      return;
    }
    if (el28['classList']['contains']('act-pose-editor')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_openMenu']('pose');
      return;
    }
    if (el28['classList']['contains']('act-grid')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_openMenu']('grid');
      return;
    }
    if (this['_supportsCameraFeatures']() && el28['classList']['contains']('act-camera')) {
      this['_openMenu']('camera');
      return;
    }
  }
  ['_handleBottomToolbarPointerLeave'](event25) {
    const value139 = event25['relatedTarget'];
    if (
      value139 &&
      (this['_bottomToolbarEl']?.['contains'](value139) ||
        this['_captureMenuEl']?.['contains'](value139) ||
        this['_cameraListEl']?.['contains'](value139) ||
        this['_focusMenuEl']?.['contains'](value139) ||
        this['_mannequinMenuEl']?.['contains'](value139) ||
        this['_assetBrowserEl']?.['contains'](value139) ||
        this['_posePanelEl']?.['contains'](value139) ||
        this['_gridPanelEl']?.['contains'](value139))
    )
      return;
    const el29 = event25['target']?.['closest']?.('button');
    if (!el29) return;
    if (el29['classList']['contains']('act-capture')) {
      this['_scheduleMenuHide']('capture');
      return;
    }
    if (!this['_isPanorama360'] && el29['classList']['contains']('act-focus')) {
      this['_scheduleMenuHide']('focus');
      return;
    }
    if (el29['classList']['contains']('act-mannequin-entry')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_scheduleMenuHide']('mannequin');
      return;
    }
    if (el29['classList']['contains']('act-asset-library')) {
      this['_scheduleMenuHide']('assets');
      return;
    }
    if (el29['classList']['contains']('act-pose-editor')) {
      this['_scheduleMenuHide']('pose');
      return;
    }
    if (el29['classList']['contains']('act-grid')) {
      if (!this['_supportsCubeCreation']()) return;
      this['_scheduleMenuHide']('grid');
      return;
    }
    this['_supportsCameraFeatures']() &&
      el29['classList']['contains']('act-camera') &&
      this['_scheduleMenuHide']('camera');
  }
  async ['_handleToolbarAction'](tool2) {
    const navigationMode = this['_sceneState'];
    switch (tool2) {
      case 'enter-edit':
        this['_enterEditing']();
        return;
      case 'exit-edit':
        this['_exitEditing']();
        return;
      case 'upload-panorama':
        if (!this['_supportsPanoramaUpload']()) return;
        this['_openPanoramaFilePicker']();
        return;
      case 'fullscreen':
        !this['_isEditing']() && this['_enterEditing']();
        this['_isBrowserFullscreen']()
          ? await this['_exitBrowserFullscreen']()
          : await this['_enterBrowserFullscreen']();
        return;
      case 'navigate':
        {
          this['_toggleMouseTool']();
        }
        return;
      case 'fly-mode':
        (setPanoramaSceneInteractionOptions({
          nodeId: this['id'],
          patch: { navigationMode: navigationMode?.['ui']?.['navigationMode'] === 'fly' ? 'orbit' : 'fly' },
        }),
          requestAnimationFrame(() => this['_viewportEl']?.['focus']()));
        return;
      case 'frame-selection':
        focusPanoramaSceneSelection({
          nodeId: this['id'],
          frame: this['_bridge']?.['readSelectionFrame']?.(),
        });
        return;
      case 'move':
      case 'rotate':
      case 'scale':
        (this['_closeMenus'](), setPanoramaSceneTool({ nodeId: this['id'], tool: tool2 }));
        return;
      case 'transform-space':
        setPanoramaSceneInteractionOptions({
          nodeId: this['id'],
          patch: { transformSpace: navigationMode?.['ui']?.['transformSpace'] === 'local' ? 'world' : 'local' },
        });
        return;
      case 'snap-toggle':
        setPanoramaSceneInteractionOptions({
          nodeId: this['id'],
          patch: { snapEnabled: navigationMode?.['ui']?.['snapEnabled'] !== !![] },
        });
        return;
      case 'ground-lock':
        setPanoramaSceneInteractionOptions({
          nodeId: this['id'],
          patch: { groundLock: navigationMode?.['ui']?.['groundLock'] !== !![] },
        });
        return;
      case 'uniform-scale':
        setPanoramaSceneInteractionOptions({
          nodeId: this['id'],
          patch: { uniformScale: navigationMode?.['ui']?.['uniformScale'] !== !![] },
        });
        return;
      case 'environment-toggle':
        setPanoramaSceneEnvironmentMode({
          nodeId: this['id'],
          environmentMode: navigationMode['environmentMode'] === 'day' ? 'night' : 'day',
        });
        return;
      case 'collapse-node':
        {
          const enterEditingOnExpand = this['_data']?.['isCollapsed'] === !![];
          (setPanoramaSceneCollapsed({
            nodeId: this['id'],
            isCollapsed: !enterEditingOnExpand,
            enterEditingOnExpand: enterEditingOnExpand,
          }),
            enterEditingOnExpand && requestAnimationFrame(() => this['_viewportEl']?.['focus']()));
        }
        return;
      case 'cube':
        if (!this['_supportsCubeCreation']()) return;
        addPanoramaSceneCube({ nodeId: this['id'], viewPose: this['_bridge']?.['readCurrentViewPose']?.() });
        return;
      case 'asset-library':
        if (!this['_supportsCubeCreation']()) return;
        this['_openMenu']('assets');
        return;
      case 'mannequin-entry':
        if (!this['_supportsCubeCreation']()) return;
        this['_openMenu']('mannequin');
        return;
      case 'pose-editor':
        if (!this['_supportsCubeCreation']()) return;
        this['_openMenu']('pose');
        return;
      case 'camera':
        if (!this['_supportsCameraFeatures']()) return;
        {
          addPanoramaSceneCamera({
            nodeId: this['id'],
            viewPose: this['_bridge']?.['readCurrentViewPose']?.(),
          });
        }
        ((this['_openMenuKey'] = 'camera'), this['_syncOverlayState']());
        return;
      case 'timeline':
        if (!this['_supportsCameraFeatures']()) return;
        {
          const showTimeline = navigationMode?.['ui']?.['showTimeline'] !== !![];
          (setPanoramaSceneInteractionOptions({ nodeId: this['id'], patch: { showTimeline: showTimeline } }),
            !showTimeline && this['_stopCameraTimelinePlayback']({ clearDraft: !![] }));
        }
        return;
      case 'focus':
        if (this['_isPanorama360'] || this['_sceneState']?.['mode'] !== 'scene') return;
        if (this['_openMenuKey'] === 'focus') {
          (this['_setDefaultSceneFocalLength'](SCENE_DEFAULT_FOCAL_LENGTH_MM),
            this['_focusMenuEl']?.['_syncValue']?.());
          return;
        }
        this['_openMenu']('focus');
        return;
      case 'capture':
        await capturePanoramaSceneViewport({
          nodeId: this['id'],
          captureBlob: () => this['_captureViewportByCurrentMode'](),
        });
        return;
      case 'reset-view':
        (this['_setDefaultSceneFocalLength'](SCENE_DEFAULT_FOCAL_LENGTH_MM),
          resetPanoramaSceneView({ nodeId: this['id'] }));
        return;
      case 'grid':
        if (!this['_supportsCubeCreation']()) return;
        this['_openMenu']('grid');
        return;
      case 'toggle-panorama-mode':
        (this['_closeMenus'](),
          setPanoramaSceneMode({
            nodeId: this['id'],
            mode: this['_supportsPanoramaUpload']() ? 'panorama' : 'scene',
          }));
        return;
      default:
        return;
    }
  }
  ['_handleToolbarClick'](event26) {
    const el30 = event26['target']['closest']('button');
    if (!el30) return;
    const list11 = Array['from'](el30['classList'])['find']((value140) =>
      value140['startsWith']('act-'),
    );
    if (!list11) return;
    (event26['preventDefault'](), event26['stopPropagation'](), this['_selectNodeOnCanvas']());
    const value141 = list11['slice'](0x4);
    void this['_handleToolbarAction'](value141);
  }
  ['_syncGridPanelValues']() {
    if (!this['_gridPanelEl']) return;
    const value142 = this['_sceneState']['gridPlacement'],
      handler12 = (value143, value144, count5 = 0x0) => {
        const el31 = this['_gridPanelEl']['querySelector']('[data-grid-field="' + value143 + '\x22]');
        if (!el31) return;
        if (!Number['isFinite'](Number(value144))) return;
        const value145 =
          count5 > 0x0
            ? Number(value144)['toFixed'](count5)
            : String(Math['round'](Number(value144)));
        el31['tagName'] === 'INPUT'
          ? (el31['value'] = value145)
          : ((el31['textContent'] = value145),
            el31['setAttribute']('aria-valuenow', String(value144)));
      };
    (handler12('rows', value142['rows'], 0x0),
      handler12('cols', value142['cols'], 0x0),
      handler12('spacingX', value142['spacingX'], 0x1),
      handler12('spacingZ', value142['spacingZ'], 0x1));
    const value146 = value142['gender'] === 'female' ? 'female' : 'male';
    this['_gridPanelEl']['querySelectorAll']('[data-grid-gender]')['forEach']((el32) => {
      el32['classList']['toggle']('is-active', el32['dataset']['gridGender'] === value146);
    });
    const map2 = new Set(PANORAMA_MANNEQUIN_COLOR_OPTIONS['map'](([value147]) => value147)),
      value148 = map2['has'](value142['colorKey']) ? value142['colorKey'] : 'blue';
    this['_gridPanelEl']['querySelectorAll']('[data-grid-color]')['forEach']((el33) => {
      const value149 = el33['dataset']['gridColor'];
      (el33['classList']['toggle']('is-active', value149 === value148),
        el33['style']['setProperty'](
          '--panorama-scene-swatch-token',
          'var(--' + resolvePanoramaSceneColorToken(value149) + ')',
        ));
    });
  }
  ['_syncLocaleTexts']() {
    const run6 = (el34, value150) => {
        if (!el34) return;
        ((el34['dataset']['tooltip'] = value150), el34['setAttribute']('aria-label', value150));
      },
      handler13 = (value151, value152) => {
        const list12 = [this['el'], this['_browserFullscreenOverlayEl']]['filter'](Boolean);
        list12['forEach']((el35) => {
          el35['querySelectorAll']?.(value151)?.['forEach']((value153) =>
            run6(value153, value152),
          );
        });
      },
      handler14 = (value154, value155) => {
        const el36 =
          this['el']?.['querySelector']?.(value154) ||
          this['_browserFullscreenOverlayEl']?.['querySelector']?.(value154);
        if (el36) el36['textContent'] = value155;
      };
    (handler13('.act-enter-edit', panoramaSceneText('toolbar.edit')),
      handler13('.act-exit-edit', panoramaSceneText('toolbar.closeEdit')),
      handler13('.act-fly-mode', panoramaSceneText('toolbar.flyMode')),
      handler13('.act-frame-selection', panoramaSceneText('toolbar.frameSelection')),
      handler13('.act-upload-panorama', panoramaSceneText('toolbar.uploadPanorama')),
      handler13('.act-cube', panoramaSceneText('toolbar.createCube')),
      handler13('.act-mannequin-entry', panoramaSceneText('toolbar.mannequin')),
      handler13('.act-grid', panoramaSceneText('toolbar.grid')),
      handler13('.act-capture', panoramaSceneText('toolbar.capture')),
      handler13('.act-camera', panoramaSceneText('toolbar.createCameraBookmark')),
      handler13('.act-focus', panoramaSceneText('toolbar.focus')),
      handler13('.act-reset-view', panoramaSceneText('toolbar.resetView')),
      handler13('.act-environment-toggle', panoramaSceneText('toolbar.switchEnvironment')));
    const el37 = this['_contextMenuEl']?.['querySelector']?.('.panorama-scene-object-menu__label');
    (el37 && (el37['textContent'] = panoramaSceneText('contextMenu.deleteObject')),
      this['_syncContextMenuShortcutLabel'](),
      this['_browserFullscreenExitBtnEl']?.['setAttribute'](
        'aria-label',
        panoramaSceneText('toolbar.exitFullscreen'),
      ),
      this['_browserFullscreenExitBtnEl'] &&
        (this['_browserFullscreenExitBtnEl']['textContent'] = panoramaSceneText('toolbar.exitFullscreen')),
      this['_captureMenuEl']?.['querySelectorAll']?.('[data-capture-mode]')?.['forEach']((el38) => {
        const label4 = getCaptureModeLabel(el38['dataset']['captureMode'] || 'adaptive');
        el38['setAttribute']('aria-label', panoramaSceneText('capture.modeAria', { label: label4 }));
        const el39 = el38['querySelector']('.panorama-capture-menu__label');
        if (el39) el39['textContent'] = label4;
      }),
      handler14('.panorama-scene-focus-menu__title', panoramaSceneText('focus.title')),
      this['_focusMenuEl']
        ?.['querySelector']?.('.panorama-scene-focus-menu__slider')
        ?.['setAttribute']('aria-label', panoramaSceneText('focus.sliderAria')),
      handler14('.panorama-grid-panel__title', panoramaSceneText('grid.title')),
      handler14('[data-grid-label=\x22rows\x22]', panoramaSceneText('grid.rows')),
      handler14('[data-grid-label="cols"]', panoramaSceneText('grid.cols')),
      handler14('[data-grid-label="spacingX"]', panoramaSceneText('grid.spacingX')),
      handler14('[data-grid-label="spacingZ"]', panoramaSceneText('grid.spacingZ')),
      handler14('[data-grid-label=\x22gender\x22]', panoramaSceneText('grid.gender')),
      handler14('[data-grid-label="color"]', panoramaSceneText('grid.color')),
      this['_gridPanelEl']
        ?.['querySelector']?.('[data-grid-field="rows"]')
        ?.['setAttribute']('aria-label', panoramaSceneText('grid.rowsAria')),
      this['_gridPanelEl']
        ?.['querySelector']?.('[data-grid-field=\x22cols\x22]')
        ?.['setAttribute']('aria-label', panoramaSceneText('grid.colsAria')),
      this['_gridPanelEl']
        ?.['querySelector']?.('[data-grid-field=\x22spacingX\x22]')
        ?.['setAttribute']('aria-label', panoramaSceneText('grid.spacingXAria')),
      this['_gridPanelEl']
        ?.['querySelector']?.('[data-grid-field="spacingZ"]')
        ?.['setAttribute']('aria-label', panoramaSceneText('grid.spacingZAria')),
      this['_gridPanelEl']?.['querySelectorAll']?.('[data-grid-gender]')?.['forEach']((el40) => {
        const label5 = getPanoramaMannequinGenderLabel(el40['dataset']['gridGender']);
        el40['setAttribute'](
          'aria-label',
          panoramaSceneText('grid.setGenderAria', { label: label5 }),
        );
      }),
      this['_gridPanelEl']?.['querySelectorAll']?.('[data-grid-color]')?.['forEach']((el41) => {
        const label6 = getPanoramaMannequinColorLabel(el41['dataset']['gridColor']);
        el41['setAttribute']('aria-label', panoramaSceneText('grid.setColorAria', { label: label6 }));
      }),
      handler14('.panorama-grid-panel__apply', panoramaSceneText('grid.apply')),
      renderMannequinQuickMenu(this['_mannequinMenuEl'], this['_sceneState']),
      renderSceneAssetBrowser(this['_assetBrowserEl']),
      renderMannequinPosePanel(this['_posePanelEl'], this['_sceneState']),
      renderCameraTimelinePanel(this['_timelinePanelEl'], this['_sceneState']?.['cameraTimeline'], {
        currentTime: this['_timelinePreviewTime'],
        isPlaying: this['_isTimelinePlaying'],
      }),
      this['_renderCameraPresetList'](),
      this['_syncToolbarState'](),
      this['_syncHintAndStatus'](),
      this['_syncCaptureSafeFrame']());
  }
  ['_renderCameraPresetList']() {
    renderCameraPresetList(this['_cameraListEl'], this['_sceneState'], {
      onActivate: (value156) => {
        (this['_animateCameraActivation'](value156),
          (this['_openMenuKey'] = null),
          this['_syncOverlayState']());
      },
      onDelete: (cameraId) => {
        deletePanoramaSceneCamera({ nodeId: this['id'], cameraId: cameraId });
      },
      onContextMenu: ({ cameraId: cameraId2, clientX: clientX, clientY: clientY }) => {
        this['_openObjectContextMenu'](clientX, clientY, { type: 'camera', cameraId: cameraId2 });
      },
    });
  }
  ['_syncToolbarState']() {
    const value157 = this['_resolveMouseTool'](),
      value158 = this['_resolveTransformTool']();
    this['_editToolbarEl']
      ['querySelectorAll']('.act-navigate, .act-move, .act-rotate, .act-scale')
      ['forEach']((el42) => {
        const list13 = Array['from'](el42['classList'])['find']((value159) =>
            value159['startsWith']('act-'),
          ),
          value160 = list13?.['slice'](0x4),
          value161 = value160 === 'navigate',
          value162 = value161
            ? value157 === 'navigate' || value157 === 'box-select'
            : value160 === value158;
        el42['classList']['toggle']('active', value162);
      });
    const el43 = this['_editToolbarEl']['querySelector']('.act-navigate');
    if (el43) {
      const value163 = value157 === 'box-select';
      el43['classList']['toggle']('is-box-select', value163);
      const tooltipText = buildTooltipText(
        value163 ? panoramaSceneText('toolbar.boxSelectMouse') : panoramaSceneText('toolbar.mouseMode'),
        'panorama-scene-tool-toggle-mouse',
      );
      ((el43['dataset']['tooltip'] = tooltipText), el43['setAttribute']('aria-label', tooltipText));
      const value164 = value163 ? BOX_SELECT_TOOL_ICON : POINTER_TOOL_ICON;
      el43['innerHTML'] !== value164 && (el43['innerHTML'] = value164);
    }
    const el44 = this['_editToolbarEl']['querySelector']('.act-fly-mode');
    if (el44) {
      const value165 = this['_sceneState']?.['ui']?.['navigationMode'] === 'fly',
        panoramaSceneText2 = panoramaSceneText('toolbar.flyMode');
      (el44['classList']['toggle']('active', value165),
        (el44['dataset']['tooltip'] = panoramaSceneText2),
        el44['setAttribute']('aria-label', panoramaSceneText2));
    }
    const el45 = this['_editToolbarEl']['querySelector']('.act-frame-selection');
    if (el45) {
      const enabled24 = Boolean(this['_sceneState']?.['selection']?.['selectedObjectId']),
        panoramaSceneText3 = panoramaSceneText('toolbar.frameSelection');
      ((el45['disabled'] = !enabled24),
        (el45['dataset']['tooltip'] = panoramaSceneText3),
        el45['setAttribute']('aria-label', panoramaSceneText3));
    }
    const el46 = this['_editToolbarEl']['querySelector']('.act-move');
    if (el46) {
      const tooltipText2 = buildTooltipText(panoramaSceneText('toolbar.move'), 'panorama-scene-tool-move');
      ((el46['dataset']['tooltip'] = tooltipText2), el46['setAttribute']('aria-label', tooltipText2));
    }
    const el47 = this['_editToolbarEl']['querySelector']('.act-rotate');
    if (el47) {
      const tooltipText3 = buildTooltipText(panoramaSceneText('toolbar.rotate'), 'panorama-scene-tool-rotate');
      ((el47['dataset']['tooltip'] = tooltipText3), el47['setAttribute']('aria-label', tooltipText3));
    }
    const el48 = this['_editToolbarEl']['querySelector']('.act-scale');
    if (el48) {
      const tooltipText4 = buildTooltipText(panoramaSceneText('toolbar.scale'), 'panorama-scene-tool-scale');
      ((el48['dataset']['tooltip'] = tooltipText4), el48['setAttribute']('aria-label', tooltipText4));
    }
    const el49 = this['_editToolbarEl']['querySelector']('.act-transform-space');
    if (el49) {
      const value166 = this['_sceneState']?.['ui']?.['transformSpace'] === 'local',
        panoramaSceneText4 = panoramaSceneText(value166 ? 'toolbar.transformLocal' : 'toolbar.transformWorld');
      (el49['classList']['toggle']('active', value166),
        (el49['dataset']['tooltip'] = panoramaSceneText4),
        el49['setAttribute']('aria-label', panoramaSceneText4));
    }
    const el50 = this['_editToolbarEl']['querySelector']('.act-snap-toggle');
    el50 &&
      el50['classList']['toggle']('active', this['_sceneState']?.['ui']?.['snapEnabled'] === !![]);
    const el51 = this['_editToolbarEl']['querySelector']('.act-ground-lock');
    el51 &&
      (el51['classList']['toggle']('active', this['_sceneState']?.['ui']?.['groundLock'] === !![]),
      (el51['hidden'] = value158 !== 'move'));
    const el52 = this['_editToolbarEl']['querySelector']('.act-uniform-scale');
    el52 &&
      (el52['classList']['toggle']('active', this['_sceneState']?.['ui']?.['uniformScale'] === !![]),
      (el52['hidden'] = value158 !== 'scale'));
    const el53 = this['_cornerToolbarEl']['querySelector']('.act-environment-toggle');
    if (el53) {
      const value167 =
        this['_sceneState']['environmentMode'] === 'day'
          ? panoramaSceneText('toolbar.switchToNight')
          : panoramaSceneText('toolbar.switchToDay');
      ((el53['dataset']['tooltip'] = value167),
        el53['setAttribute']('aria-label', value167),
        (el53['hidden'] = ![]),
        el53['setAttribute']('aria-hidden', 'false'));
    }
    const el54 = this['_sceneToolbarEl']['querySelector']('.act-upload-panorama');
    if (el54) {
      const enabled25 = this['_supportsPanoramaUpload']();
      ((el54['hidden'] = !enabled25),
        el54['setAttribute']('aria-hidden', enabled25 ? 'false' : 'true'));
    }
    const el55 = this['_bottomToolbarEl']['querySelector']('.act-cube');
    if (el55) {
      const enabled26 = this['_supportsCubeCreation']();
      ((el55['hidden'] = !enabled26),
        el55['setAttribute']('aria-hidden', enabled26 ? 'false' : 'true'));
    }
    const el56 = this['_bottomToolbarEl']['querySelector']('.act-asset-library');
    if (el56) {
      const enabled27 = this['_supportsCubeCreation']();
      ((el56['hidden'] = !enabled27), (el56['disabled'] = !enabled27));
    }
    const el57 = this['_bottomToolbarEl']['querySelector']('.act-mannequin-entry');
    if (el57) {
      const enabled28 = this['_supportsCubeCreation']();
      ((el57['hidden'] = !enabled28),
        el57['setAttribute']('aria-hidden', enabled28 ? 'false' : 'true'),
        (el57['disabled'] = !enabled28),
        !enabled28 && this['_openMenuKey'] === 'mannequin' && (this['_openMenuKey'] = null));
    }
    const el58 = this['_bottomToolbarEl']['querySelector']('.act-pose-editor');
    if (el58) {
      const enabled29 =
        this['_sceneState']?.['selection']?.['selectedObjectType'] === 'mannequin' &&
        Boolean(this['_sceneState']?.['selection']?.['selectedObjectId']);
      ((el58['hidden'] = !this['_supportsCubeCreation']()), (el58['disabled'] = !enabled29));
    }
    const el59 = this['_bottomToolbarEl']['querySelector']('.act-grid');
    if (el59) {
      const enabled30 = this['_supportsCubeCreation']();
      ((el59['hidden'] = !enabled30),
        el59['setAttribute']('aria-hidden', enabled30 ? 'false' : 'true'),
        (el59['disabled'] = !enabled30));
      const panoramaSceneText5 = panoramaSceneText('toolbar.grid');
      ((el59['dataset']['tooltip'] = panoramaSceneText5),
        el59['setAttribute']('aria-label', panoramaSceneText5),
        !enabled30 && this['_openMenuKey'] === 'grid' && (this['_openMenuKey'] = null));
    }
    const el60 = this['_bottomToolbarEl']['querySelector']('.act-camera');
    if (el60) {
      const enabled31 = this['_supportsCameraFeatures'](),
        value168 = this['_sceneState']['cameras']['length'] >= 0xa;
      ((el60['hidden'] = !enabled31),
        el60['setAttribute']('aria-hidden', enabled31 ? 'false' : 'true'),
        (el60['disabled'] = !enabled31),
        el60['classList']['toggle']('is-limit-reached', enabled31 && value168),
        el60['setAttribute']('aria-disabled', !enabled31 || value168 ? 'true' : 'false'));
      const tooltipText5 = buildTooltipText(
        panoramaSceneText('toolbar.createCameraBookmark'),
        'panorama-scene-camera-create',
      );
      ((el60['dataset']['tooltip'] = tooltipText5),
        el60['setAttribute']('aria-label', tooltipText5),
        !enabled31 && this['_openMenuKey'] === 'camera' && (this['_openMenuKey'] = null));
    }
    const el61 = this['_bottomToolbarEl']['querySelector']('.act-timeline');
    if (el61) {
      const enabled32 = this['_supportsCameraFeatures']();
      ((el61['hidden'] = !enabled32),
        (el61['disabled'] = !enabled32),
        el61['classList']['toggle']('active', this['_sceneState']?.['ui']?.['showTimeline'] === !![]));
    }
    const el62 = this['_bottomToolbarEl']['querySelector']('.act-focus');
    if (el62) {
      const enabled33 = !this['_isPanorama360'] && this['_sceneState']?.['mode'] === 'scene';
      ((el62['hidden'] = !enabled33),
        el62['setAttribute']('aria-hidden', enabled33 ? 'false' : 'true'),
        (el62['disabled'] = !enabled33));
      const panoramaSceneText6 = panoramaSceneText('toolbar.focus');
      ((el62['dataset']['tooltip'] = panoramaSceneText6),
        el62['setAttribute']('aria-label', panoramaSceneText6),
        !enabled33 && this['_openMenuKey'] === 'focus' && (this['_openMenuKey'] = null));
    }
    const el63 = this['_bottomToolbarEl']['querySelector']('.act-reset-view');
    if (el63) {
      const tooltipText6 = buildTooltipText(panoramaSceneText('toolbar.resetView'), 'panorama-scene-reset-view');
      ((el63['dataset']['tooltip'] = tooltipText6), el63['setAttribute']('aria-label', tooltipText6));
    }
    const el64 = this['_bottomToolbarEl']['querySelector']('.act-capture');
    if (el64) {
      const captureModeMeta2 = getCaptureModeMeta(this['_resolveCaptureMode']()),
        tooltipText7 = buildTooltipText(
          panoramaSceneText('toolbar.captureWithMode', { mode: getCaptureModeLabel(captureModeMeta2) }),
          'panorama-scene-capture',
        );
      ((el64['dataset']['tooltip'] = tooltipText7), el64['setAttribute']('aria-label', tooltipText7));
    }
    this['_syncCaptureMenuState']();
    const list14 = [
      this['_sceneToolbarEl']?.['querySelector']('.act-collapse-node'),
      this['_editToolbarEl']?.['querySelector']('.act-collapse-node'),
    ]['filter'](Boolean);
    list14['forEach']((el65) => {
      const value169 = this['_data']?.['isCollapsed'] === !![],
        value170 = value169 ? panoramaSceneText('toolbar.expand') : panoramaSceneText('toolbar.collapse');
      ((el65['dataset']['tooltip'] = value170),
        el65['setAttribute']('aria-label', value170),
        el65['classList']['toggle']('is-collapsed', value169));
    });
    const list15 = this['el']?.['querySelectorAll']?.('.act-fullscreen') || [];
    if (list15['length'] > 0x0) {
      const value171 = this['_isBrowserFullscreen'](),
        value172 = value171
          ? panoramaSceneText('toolbar.exitFullscreen')
          : panoramaSceneText('toolbar.fullscreen');
      list15['forEach']((el66) => {
        ((el66['dataset']['tooltip'] = value172),
          el66['setAttribute']('aria-label', value172),
          el66['classList']['toggle']('active', value171));
      });
    }
  }
  ['_syncHintAndStatus']() {
    const enabled34 = this['_isEditing'](),
      value173 = this['_sceneState']['selection'],
      value174 = this['_resolveMouseTool']();
    if (enabled34) {
      const selection = value173['selectedObjectId']
          ? value173['selectedObjectType'] === 'camera'
            ? panoramaSceneText('status.cameraSelected')
            : panoramaSceneText('status.objectSelected')
          : panoramaSceneText('status.noObjectSelected'),
        mode3 = this['_supportsPanoramaUpload']()
          ? panoramaSceneText('status.panoramaMode')
          : panoramaSceneText('status.sceneMode');
      this['_statusContentEl']['textContent'] = panoramaSceneText('status.editing', {
        mode: mode3,
        selection: selection,
      });
    } else
      this['_data']?.['isCollapsed']
        ? (this['_statusContentEl']['textContent'] = panoramaSceneText('status.collapsed'))
        : (this['_statusContentEl']['textContent'] = panoramaSceneText('status.normalNode'));
    const enabled35 =
      this['_sceneState']['panorama']['error'] || this['_sceneState']['capture']['error'] || '';
    ((this['_errorEl']['textContent'] = enabled35),
      this['_errorEl']['classList']['toggle']('is-visible', !!enabled35));
    if (this['_data']?.['isCollapsed'])
      this['_hintContentEl']['textContent'] = panoramaSceneText('hint.doubleClickEdit');
    else {
      if (!enabled34)
        this['_hintContentEl']['textContent'] = this['_supportsPanoramaUpload']()
          ? panoramaSceneText('hint.clickEditPanorama')
          : panoramaSceneText('hint.clickEditScene');
      else {
        if (this['_supportsPanoramaUpload']() || this['_sceneState']['mode'] === 'panorama')
          this['_hintContentEl']['textContent'] = panoramaSceneText('hint.panoramaControls');
        else {
          if (value174 === 'box-select')
            this['_hintContentEl']['textContent'] = panoramaSceneText('hint.boxSelect');
          else
            this['_sceneState']?.['ui']?.['navigationMode'] === 'fly'
              ? (this['_hintContentEl']['textContent'] = panoramaSceneText('hint.flyControls'))
              : (this['_hintContentEl']['textContent'] = panoramaSceneText('hint.defaultMouse'));
        }
      }
    }
  }
  ['_positionMenus']() {
    if (!this['_bottomToolbarPopoverLayerEl'] || !this['_bottomToolbarEl']) return;
    if (this['_bottomToolbarEl']['offsetWidth'] <= 0x0 || this['_bottomToolbarEl']['offsetHeight'] <= 0x0)
      return;
    const run7 = (y2) => {
        if (!(y2 instanceof HTMLElement)) return null;
        const count6 = y2['offsetWidth'] || 0x0,
          count7 = y2['offsetHeight'] || 0x0;
        if (count6 <= 0x0 || count7 <= 0x0) return null;
        return { x: (y2['offsetLeft'] || 0x0) + count6 / 0x2, y: y2['offsetTop'] || 0x0 };
      },
      box13 = run7(this['_bottomToolbarEl']['querySelector']('.act-mannequin-entry'));
    box13 &&
      ((this['_mannequinMenuEl']['style']['left'] = box13['x'] + 'px'),
      (this['_mannequinMenuEl']['style']['top'] = box13['y'] + 'px'));
    const box14 = run7(this['_bottomToolbarEl']['querySelector']('.act-asset-library'));
    box14 &&
      ((this['_assetBrowserEl']['style']['left'] = box14['x'] + 'px'),
      (this['_assetBrowserEl']['style']['top'] = box14['y'] + 'px'));
    const box15 = run7(this['_bottomToolbarEl']['querySelector']('.act-pose-editor'));
    box15 &&
      ((this['_posePanelEl']['style']['left'] = box15['x'] + 'px'),
      (this['_posePanelEl']['style']['top'] = box15['y'] + 'px'));
    const box16 = run7(this['_bottomToolbarEl']['querySelector']('.act-grid'));
    box16 &&
      ((this['_gridPanelEl']['style']['left'] = box16['x'] + 'px'),
      (this['_gridPanelEl']['style']['top'] = box16['y'] + 'px'));
    const box17 = run7(this['_bottomToolbarEl']['querySelector']('.act-capture'));
    box17 &&
      ((this['_captureMenuEl']['style']['left'] = box17['x'] + 'px'),
      (this['_captureMenuEl']['style']['top'] = box17['y'] + 'px'));
    const box18 = run7(this['_bottomToolbarEl']['querySelector']('.act-focus'));
    box18 &&
      ((this['_focusMenuEl']['style']['left'] = box18['x'] + 'px'),
      (this['_focusMenuEl']['style']['top'] = box18['y'] + 'px'));
    const box19 = run7(this['_bottomToolbarEl']['querySelector']('.act-camera'));
    box19 &&
      ((this['_cameraListEl']['style']['left'] = box19['x'] + 'px'),
      (this['_cameraListEl']['style']['top'] = box19['y'] + 'px'));
  }
  ['_syncOverlayState']() {
    const enabled36 = this['_isEditing'](),
      enabled37 = this['_data']?.['isCollapsed'] === !![],
      value175 = this['_isNodeSelected'](),
      enabled38 = !enabled36,
      enabled39 = enabled36 && !enabled37 && value175,
      enabled40 = enabled39,
      enabled41 = enabled39;
    (this['el']['classList']['toggle']('is-editing', enabled36),
      this['el']['classList']['toggle']('is-collapsed', enabled37),
      this['el']['classList']['toggle']('is-panorama-mode', this['_sceneState']['mode'] === 'panorama'));
    const value176 = this['_sceneState']?.['environmentMode'] === 'day' ? 'day' : 'night';
    ((this['el']['dataset']['panoramaEnv'] = value176),
      (this['_viewportEl']['dataset']['envMode'] = value176),
      (this['_viewportEl']['dataset']['sceneType'] = this['_sceneState']?.['type'] || ''),
      this['_sceneToolbarEl']['classList']['toggle']('is-hidden', !enabled38),
      this['_sceneToolbarEl']['classList']['remove']('is-node-collapsed'),
      this['_editToolbarEl']['classList']['toggle']('is-hidden', !enabled39),
      this['_editToolbarEl']['classList']['remove']('is-node-collapsed'),
      this['_cornerToolbarEl']['classList']['toggle']('is-hidden', !enabled41),
      this['_cornerToolbarEl']['classList']['toggle']('is-collapsed-state', enabled37),
      this['_bottomToolbarEl']['classList']['toggle']('is-hidden', !enabled40),
      (this['_statusEl']['style']['transform'] = 'none'),
      (this['_hintEl']['style']['transform'] = 'none'));
    !enabled39 && this['_closeObjectContextMenu']();
    const enabled42 =
        enabled39 &&
        this['_supportsCameraFeatures']() &&
        this['_sceneState']['cameras']['length'] > 0x0 &&
        this['_openMenuKey'] === 'camera',
      enabled43 =
        enabled39 &&
        !this['_isPanorama360'] &&
        this['_sceneState']?.['mode'] === 'scene' &&
        this['_openMenuKey'] === 'focus',
      enabled44 = enabled39 && this['_openMenuKey'] === 'capture',
      enabled45 = enabled39 && this['_supportsCubeCreation']() && this['_openMenuKey'] === 'grid',
      enabled46 = enabled39 && this['_supportsCubeCreation']() && this['_openMenuKey'] === 'mannequin',
      enabled47 = enabled39 && this['_supportsCubeCreation']() && this['_openMenuKey'] === 'assets',
      enabled48 =
        enabled39 &&
        this['_supportsCubeCreation']() &&
        this['_openMenuKey'] === 'pose' &&
        this['_sceneState']?.['selection']?.['selectedObjectType'] === 'mannequin',
      enabled49 =
        enabled39 &&
        this['_supportsCameraFeatures']() &&
        this['_sceneState']?.['ui']?.['showTimeline'] === !![];
    (this['el']['classList']['toggle']('has-camera-timeline', enabled49),
      this['_captureMenuEl']['classList']['toggle']('is-visible', enabled44),
      this['_cameraListEl']['classList']['toggle']('is-visible', enabled42),
      this['_focusMenuEl']['classList']['toggle']('is-visible', enabled43),
      this['_gridPanelEl']['classList']['toggle']('is-visible', enabled45),
      this['_mannequinMenuEl']['classList']['toggle']('is-visible', enabled46),
      this['_assetBrowserEl']['classList']['toggle']('is-visible', enabled47),
      this['_posePanelEl']['classList']['toggle']('is-visible', enabled48),
      this['_timelinePanelEl']['classList']['toggle']('is-visible', enabled49),
      (this['_captureMenuEl']['hidden'] = !enabled44),
      (this['_cameraListEl']['hidden'] = !enabled42),
      (this['_focusMenuEl']['hidden'] = !enabled43),
      (this['_gridPanelEl']['hidden'] = !enabled45),
      (this['_mannequinMenuEl']['hidden'] = !enabled46),
      (this['_assetBrowserEl']['hidden'] = !enabled47),
      (this['_posePanelEl']['hidden'] = !enabled48),
      (this['_timelinePanelEl']['hidden'] = !enabled49));
    !enabled49 && this['_isTimelinePlaying'] && this['_stopCameraTimelinePlayback']({ clearDraft: !![] });
    enabled43 && this['_focusMenuEl']?.['_syncValue']?.();
    (this['_statusEl']['classList']['toggle']('is-visible', !![]),
      this['_hintEl']['classList']['toggle']('is-visible', !![]),
      this['_syncAttachedUiVisibility'](enabled40),
      this['_syncCaptureSafeFrame']());
    const el67 = this['_bottomToolbarEl']?.['querySelector']('.act-focus');
    if (el67) {
      const value177 = enabled43 ? '' : panoramaSceneText('toolbar.focus');
      (value177
        ? (el67['dataset']['tooltip'] = value177)
        : el67['removeAttribute']('data-tooltip'),
        el67['setAttribute']('aria-label', panoramaSceneText('toolbar.focus')));
    }
    this['_positionMenus']();
  }
  ['update'](value178) {
    const enabled50 = this['_sceneState'];
    ((this['_data'] = value178),
      (this['_isPanorama360'] = String(value178?.['type'] || '')['trim']() === PANORAMA_360_NODE_TYPE),
      this['el']['classList']['toggle']('is-panorama-360', this['_isPanorama360']),
      (this['_sceneState'] = getPanoramaSceneState(value178)));
    !this['_sceneState']['ui']['isEditing'] && (this['_openMenuKey'] = null);
    this['_maybePreloadCharacterModels'](enabled50);
    !this['_isPanorama360'] &&
    this['_sceneState']?.['mode'] === 'scene' &&
    (!enabled50 ||
      (!this['_isDefaultSceneView'](enabled50?.['viewport']?.['sceneView']) &&
        this['_isDefaultSceneView'](this['_sceneState']?.['viewport']?.['sceneView'])))
      ? this['_setDefaultSceneFocalLength'](SCENE_DEFAULT_FOCAL_LENGTH_MM)
      : this['_bridge']?.['setDefaultSceneFocalLength']?.(this['_defaultSceneFocalLength']);
    (this['_syncToolbarState'](),
      this['_syncGridPanelValues'](),
      renderMannequinQuickMenu(this['_mannequinMenuEl'], this['_sceneState']),
      renderSceneAssetBrowser(this['_assetBrowserEl']),
      renderMannequinPosePanel(this['_posePanelEl'], this['_sceneState']));
    const cameraTimeline4 = normalizeCameraTimeline(this['_sceneState']?.['cameraTimeline']);
    (!this['_isTimelinePlaying'] && (this['_timelinePreviewTime'] = cameraTimeline4['currentTime']),
      renderCameraTimelinePanel(this['_timelinePanelEl'], cameraTimeline4, {
        currentTime: this['_timelinePreviewTime'],
        isPlaying: this['_isTimelinePlaying'],
      }),
      this['_renderCameraPresetList'](),
      this['_syncHintAndStatus'](),
      this['_syncCaptureMenuState'](),
      this['_syncOverlayState'](),
      this['_bridge']?.['sync']?.(this['_sceneState']),
      this['_maybeReleasePendingCameraJumpDraft']());
  }
  ['unmount']() {
    ((this['_isUnmounted'] = !![]),
      clearTimeout(this['_menuHideTimer']),
      this['_fileInput']?.['removeEventListener']('change', this['_handleFileInputChange']),
      this['_viewportEl']?.['removeEventListener']('pointerdown', this['_handleViewportPointerDown']),
      this['_viewportEl']?.['removeEventListener']('contextmenu', this['_handleViewportContextMenu']),
      this['_viewportEl']?.['removeEventListener']('dblclick', this['_handleViewportDoubleClick']),
      this['el']?.['removeEventListener']('pointerenter', this['_handleNodePointerEnter']),
      this['el']?.['removeEventListener']('pointerleave', this['_handleNodePointerLeave']),
      this['_sceneToolbarEl']?.['removeEventListener']('click', this['_handleToolbarClick']),
      this['_editToolbarEl']?.['removeEventListener']('click', this['_handleToolbarClick']),
      this['_cornerToolbarEl']?.['removeEventListener']('click', this['_handleToolbarClick']),
      this['_bottomToolbarEl']?.['removeEventListener']('click', this['_handleToolbarClick']),
      this['_bottomToolbarEl']?.['removeEventListener'](
        'pointerover',
        this['_handleBottomToolbarPointerEnter'],
      ),
      this['_bottomToolbarEl']?.['removeEventListener'](
        'pointerout',
        this['_handleBottomToolbarPointerLeave'],
      ),
      this['_captureMenuEl']?.['removeEventListener']('click', this['_handleCaptureMenuClick']),
      this['_unsubscribeSelection']?.(),
      (this['_unsubscribeSelection'] = null),
      this['_unsubscribeViewport']?.(),
      (this['_unsubscribeViewport'] = null),
      this['_unsubscribePanoramaIncomingSync']?.(),
      (this['_unsubscribePanoramaIncomingSync'] = null),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = null),
      window['removeEventListener']('resize', this['_handleWindowResize']),
      window['removeEventListener']('pointerdown', this['_handleGlobalPointerDown'], !![]),
      window['removeEventListener']('keydown', this['_handleWindowKeyDown'], !![]),
      window['removeEventListener']('keyup', this['_handleWindowKeyUp'], !![]),
      window['removeEventListener']('blur', this['_handleWindowBlur']),
      window['removeEventListener']('shortcuts-updated', this['_handleShortcutsUpdated']),
      window['removeEventListener']('panorama-scene:camera-shortcut', this['_handleCameraShortcutEvent']),
      window['removeEventListener']('panorama-scene:capture-shortcut', this['_handleCaptureShortcutEvent']),
      void this['_exitBrowserFullscreen']({ skipSync: !![] }),
      this['_cameraJumpRaf'] &&
        (cancelAnimationFrame(this['_cameraJumpRaf']), (this['_cameraJumpRaf'] = 0x0)),
      this['_pendingCameraJumpReleaseRaf'] &&
        (cancelAnimationFrame(this['_pendingCameraJumpReleaseRaf']),
        (this['_pendingCameraJumpReleaseRaf'] = 0x0)),
      (this['_pendingCameraJumpCommit'] = null),
      this['_stopCameraTimelinePlayback']({ clearDraft: !![] }),
      this['_resizeObserver']?.['disconnect'](),
      this['_interaction']?.['detach']?.(),
      this['_bridge']?.['dispose']?.());
  }
}
