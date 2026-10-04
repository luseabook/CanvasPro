import appStore from '../core/stores/appStore.js';
import {
  addPanoramaSceneCamera,
  addPanoramaSceneCube,
  addPanoramaSceneMannequin,
  addPanoramaSceneMannequinGrid,
  capturePanoramaSceneViewport,
  clearPanoramaSceneSelection,
  deletePanoramaSceneCamera,
  deleteSelectedPanoramaSceneObject,
  focusPanoramaSceneSelection,
  resetPanoramaSceneView,
  setPanoramaSceneCollapsed,
  setPanoramaSceneCaptureMode,
  setPanoramaSceneEditing,
  setPanoramaSceneEnvironmentMode,
  setPanoramaSceneGridPlacement,
  setPanoramaSceneMode,
  setPanoramaSceneSelection,
  setPanoramaSceneSelectionBatch,
  setPanoramaSceneSelectionObjects,
  setPanoramaSceneTool,
  updatePanoramaSceneLoadState,
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
import { getShortcuts } from '../modules/shortcuts.js';
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
  return PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(key || '').trim());
}
function createElementFromHtml(index) {
  const el = document.createElement('template');
  return ((el.innerHTML = index.trim()), el.content.firstElementChild);
}
function attachUiStop(el2, { wheel: wheel = false } = {}) {
  if (!el2) return;
  ((el2.dataset.uiStop = '1'),
    el2.addEventListener('pointerdown', (event) => event.stopPropagation()),
    wheel &&
      el2.addEventListener(
        'wheel',
        (event2) => {
          event2.stopPropagation();
        },
        { passive: false },
      ));
}
function getShortcutLabel(result) {
  const map = getShortcuts()?.[result],
    list = Array.isArray(map?.keys) ? map.keys.filter(Boolean) : [];
  return list.length > 0 ? '[' + list.join('+') + ']' : '';
}
function buildTooltipText(data, options) {
  const shortcutLabel = getShortcutLabel(options);
  return shortcutLabel ? data + ' ' + shortcutLabel : data;
}
function normalizeCameraSlot(target) {
  const count = Number(target);
  if (!Number.isInteger(count)) return null;
  if (count < 1 || count > 10) return null;
  return count;
}
function resolveCameraSlotEntries(list2 = []) {
  const list3 = Array.isArray(list2) ? list2 : [],
    map2 = new Set(),
    list4 = [];
  return (
    list3.forEach((camera) => {
      const slot = normalizeCameraSlot(camera?.slot);
      if (!slot || map2.has(slot)) return;
      (map2.add(slot), list4.push({ camera: camera, slot: slot }));
    }),
    list3.forEach((camera2) => {
      if (list4.some((item2) => item2.camera?.id === camera2?.id)) return;
      for (let slot2 = 1; slot2 <= 10; slot2 += 1) {
        if (map2.has(slot2)) continue;
        (map2.add(slot2), list4.push({ camera: camera2, slot: slot2 }));
        break;
      }
    }),
    list4.sort((item3, source) => item3.slot - source.slot)
  );
}
function lerp(next, current, entry) {
  return next + (current - next) * entry;
}
function smootherstep(record) {
  const payload = Math.max(0, Math.min(1, Number(record) || 0));
  return payload * payload * payload * (payload * (payload * 6 - 15) + 10);
}
function interpolateVector3(box, box2, handle) {
  return {
    x: lerp(Number(box?.x) || 0, Number(box2?.x) || 0, handle),
    y: lerp(Number(box?.y) || 0, Number(box2?.y) || 0, handle),
    z: lerp(Number(box?.z) || 0, Number(box2?.z) || 0, handle),
  };
}
function cloneVector3(state) {
  return interpolateVector3(state, state, 1);
}
function quaternionToRotation(config) {
  const scope = config?.clone?.() || new threeRuntime['Quaternion'](),
    x2 = new threeRuntime['Euler'](0, 0, 0, 'YXZ').setFromQuaternion(scope, 'YXZ');
  return { x: x2.x, y: x2.y, z: x2.z };
}
function areSceneViewsEquivalent(event3, event4, input = 0.00001) {
  if (!event3 || !event4) return false;
  return (
    Math.abs((Number(event3?.target?.x) || 0) - (Number(event4?.target?.x) || 0)) <= input &&
    Math.abs((Number(event3?.target?.y) || 0) - (Number(event4?.target?.y) || 0)) <= input &&
    Math.abs((Number(event3?.target?.z) || 0) - (Number(event4?.target?.z) || 0)) <= input &&
    Math.abs((Number(event3?.orbitYaw) || 0) - (Number(event4?.orbitYaw) || 0)) <= input &&
    Math.abs((Number(event3?.orbitPitch) || 0) - (Number(event4?.orbitPitch) || 0)) <= input &&
    Math.abs((Number(event3?.orbitDistance) || 0) - (Number(event4?.orbitDistance) || 0)) <= input
  );
}
const PANORAMA_CAPTURE_MODE_OPTIONS = [
  { key: 'adaptive', labelKey: 'adaptive', iconClass: 'is-adaptive' },
  { key: '9:16', labelKey: 'vertical', ratio: 9 / 16, iconClass: 'is-9-16' },
  { key: '2.35:1', labelKey: 'cinema', ratio: 2.35, iconClass: 'is-2-35-1' },
];
function normalizeCaptureMode(output) {
  return PANORAMA_CAPTURE_MODE_OPTIONS.some((event5) => event5.key === output) ? output : 'adaptive';
}
function getCaptureModeMeta(value2) {
  const captureMode = normalizeCaptureMode(value2);
  return (
    PANORAMA_CAPTURE_MODE_OPTIONS.find((event6) => event6.key === captureMode) ||
    PANORAMA_CAPTURE_MODE_OPTIONS[0]
  );
}
function getCaptureModeLabel(value3) {
  const event7 = typeof value3 === 'string' ? getCaptureModeMeta(value3) : value3,
    value4 = String(event7?.labelKey || '').trim();
  return value4 ? panoramaSceneText('capture.modes.' + value4) : String(event7?.key || '');
}
function computeCaptureFrameRect(value5, value6, value7) {
  const width = Math.max(0, Number(value5) || 0),
    height = Math.max(0, Number(value6) || 0);
  if (width <= 0 || height <= 0) return { x: 0, y: 0, width: 0, height: 0 };
  const captureMode2 = normalizeCaptureMode(value7);
  if (captureMode2 === 'adaptive') return { x: 0, y: 0, width: width, height: height };
  const captureModeMeta = getCaptureModeMeta(captureMode2).ratio;
  if (!(captureModeMeta > 0)) return { x: 0, y: 0, width: width, height: height };
  const value8 = width / height;
  if (value8 >= captureModeMeta) {
    const width2 = height * captureModeMeta;
    return { x: (width - width2) / 2, y: 0, width: width2, height: height };
  }
  const height2 = width / captureModeMeta;
  return { x: 0, y: (height - height2) / 2, width: width, height: height2 };
}
export function resolveNextPanoramaMouseTool(value9) {
  return String(value9 || '').trim() === 'box-select' ? 'navigate' : 'box-select';
}
function resolvePanoramaSceneHistoryShortcutAction(event8) {
  const enabled = event8?.ctrlKey === true || event8?.metaKey === true;
  if (!enabled || event8?.altKey === true) return null;
  const value10 = String(event8?.key || '')
    .trim()
    .toLowerCase();
  if (value10 === 'z') return event8?.shiftKey === true ? 'redo' : 'undo';
  return null;
}
async function decodeImageBlob(value11) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(value11);
  const value12 = await new Promise((handler, handler2) => {
    const value13 = URL.createObjectURL(value11),
      image = new Image();
    ((image.onload = () => {
      (URL.revokeObjectURL(value13), handler(image));
    }),
      (image.onerror = (value14) => {
        (URL.revokeObjectURL(value13), handler2(value14));
      }),
      (image.src = value13));
  });
  return value12;
}
function closeDecodedImage(value15) {
  value15 && typeof value15.close === 'function' && value15.close();
}
async function canvasToPngBlob(value16) {
  return new Promise((handler3, handler4) => {
    value16.toBlob((value17) => {
      if (value17) {
        handler3(value17);
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
  if (box3.width <= 0 || box3.height <= 0) return blob;
  const box4 = await decodeImageBlob(blob);
  try {
    const count2 = Number(box4.width) || Number(box4.videoWidth) || 0,
      count3 = Number(box4.height) || Number(box4.videoHeight) || 0;
    if (count2 <= 0 || count3 <= 0) return blob;
    const value18 = count2 / Math.max(1, viewportWidth),
      value19 = count3 / Math.max(1, viewportHeight),
      value20 = Math.max(0, Math.round(box3.x * value18)),
      value21 = Math.max(0, Math.round(box3.y * value19)),
      value22 = Math.min(count2 - value20, Math.max(1, Math.round(box3.width * value18))),
      value23 = Math.min(count3 - value21, Math.max(1, Math.round(box3.height * value19))),
      box5 = document.createElement('canvas');
    ((box5.width = value22), (box5.height = value23));
    const ctx = box5.getContext('2d');
    if (!ctx) throw new Error(panoramaSceneText('errors.captureCropFailed'));
    return (
      ctx.drawImage(box4, value20, value21, value22, value23, 0, 0, value22, value23),
      canvasToPngBlob(box5)
    );
  } finally {
    closeDecodedImage(box4);
  }
}
export class PanoramaSceneNode {
  constructor(value24) {
    ((this._data = value24),
      (this.id = value24.id),
      (this._isPanorama360 = String(value24?.type || '').trim() === PANORAMA_360_NODE_TYPE),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component panorama-scene-component'),
      this.el.classList.toggle('is-panorama-360', this._isPanorama360),
      (this._sceneState = getPanoramaSceneState(value24)),
      (this._openMenuKey = null),
      (this._menuHideTimer = null),
      (this._resizeObserver = null),
      (this._bridge = null),
      (this._interaction = null),
      (this._unsubscribeViewport = null),
      (this._unsubscribeSelection = null),
      (this._unsubscribePanoramaIncomingSync = null),
      (this._isSelected = false),
      (this._isNodeHovered = false),
      (this._isUnmounted = false),
      (this._contextMenuTarget = null),
      (this._cameraJumpRaf = 0),
      (this._cameraJumpToken = 0),
      (this._pendingCameraJumpCommit = null),
      (this._pendingCameraJumpReleaseRaf = 0),
      (this._hasRequestedCharacterPreload = false),
      (this._defaultSceneFocalLength = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this._browserFullscreenOverlayEl = null),
      (this._browserFullscreenAnchorEl = null),
      (this._browserFullscreenExitBtnEl = null),
      (this._unsubscribeLocale = null),
      (this._handleToolbarClick = this._handleToolbarClick.bind(this)),
      (this._handleFileInputChange = this._handleFileInputChange.bind(this)),
      (this._handleViewportPointerDown = this._handleViewportPointerDown.bind(this)),
      (this._handleViewportContextMenu = this._handleViewportContextMenu.bind(this)),
      (this._handleGlobalPointerDown = this._handleGlobalPointerDown.bind(this)),
      (this._handleViewportDoubleClick = this._handleViewportDoubleClick.bind(this)),
      (this._handleKeyDown = this._handleKeyDown.bind(this)),
      (this._handleNodePointerEnter = this._handleNodePointerEnter.bind(this)),
      (this._handleNodePointerLeave = this._handleNodePointerLeave.bind(this)),
      (this._handleBottomToolbarPointerEnter = this._handleBottomToolbarPointerEnter.bind(this)),
      (this._handleBottomToolbarPointerLeave = this._handleBottomToolbarPointerLeave.bind(this)),
      (this._handleCaptureMenuClick = this._handleCaptureMenuClick.bind(this)),
      (this._handleWindowResize = this._handleWindowResize.bind(this)),
      (this._handleShortcutsUpdated = this._handleShortcutsUpdated.bind(this)),
      (this._handleCameraShortcutEvent = this._handleCameraShortcutEvent.bind(this)),
      (this._handleCaptureShortcutEvent = this._handleCaptureShortcutEvent.bind(this)),
      (this._handleWindowKeyDown = this._handleWindowKeyDown.bind(this)));
  }
  ['mount']() {
    ((this._isUnmounted = false),
      Object.assign(this.el.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'auto',
        cursor: 'default',
        position: 'relative',
      }),
      (this._shellEl = document.createElement('div')),
      (this._shellEl.className = 'panorama-scene-shell'),
      (this._viewportEl = document.createElement('div')),
      (this._viewportEl.className = 'panorama-scene-viewport'),
      (this._viewportEl.dataset.sceneInteraction = 'panorama'),
      (this._viewportEl.tabIndex = 0),
      this._viewportEl.addEventListener('pointerdown', this._handleViewportPointerDown),
      this._viewportEl.addEventListener('contextmenu', this._handleViewportContextMenu),
      this._viewportEl.addEventListener('dblclick', this._handleViewportDoubleClick),
      this._viewportEl.addEventListener('keydown', this._handleKeyDown),
      (this._overlayEl = document.createElement('div')),
      (this._overlayEl.className = 'panorama-scene-overlay'),
      (this._infoDockEl = document.createElement('div')),
      (this._infoDockEl.className = 'panorama-scene-fixed-info-dock'),
      (this._infoDockEl.style.transform = 'none'),
      (this._sceneToolbarEl = createElementFromHtml(PANORAMA_SCENE_TOOLBAR_HTML)),
      this._sceneToolbarEl.addEventListener('click', this._handleToolbarClick),
      attachUiStop(this._sceneToolbarEl));
    const value25 = this._isPanorama360 ? PANORAMA_360_MODE_TOOLBAR_HTML : PANORAMA_SCENE_MODE_TOOLBAR_HTML;
    return (
      (this._editToolbarEl = createElementFromHtml(value25)),
      this._editToolbarEl.addEventListener('click', this._handleToolbarClick),
      attachUiStop(this._editToolbarEl),
      (this._cornerToolbarEl = createElementFromHtml(PANORAMA_SCENE_CORNER_TOOLBAR_HTML)),
      this._cornerToolbarEl.addEventListener('click', this._handleToolbarClick),
      attachUiStop(this._cornerToolbarEl),
      (this._bottomToolbarEl = createElementFromHtml(PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML)),
      this._bottomToolbarEl.addEventListener('click', this._handleToolbarClick),
      this._bottomToolbarEl.addEventListener('pointerover', this._handleBottomToolbarPointerEnter),
      this._bottomToolbarEl.addEventListener('pointerout', this._handleBottomToolbarPointerLeave),
      attachUiStop(this._bottomToolbarEl),
      (this._bottomToolbarAnchorEl = document.createElement('div')),
      (this._bottomToolbarAnchorEl.className = 'panorama-scene-bottom-toolbar-anchor'),
      this._bottomToolbarAnchorEl.appendChild(this._bottomToolbarEl),
      (this._bottomToolbarPopoverLayerEl = document.createElement('div')),
      (this._bottomToolbarPopoverLayerEl.className = 'panorama-scene-bottom-toolbar-popovers'),
      this._bottomToolbarEl.appendChild(this._bottomToolbarPopoverLayerEl),
      (this._cameraListEl = createCameraPresetList()),
      attachUiStop(this._cameraListEl),
      this._cameraListEl.addEventListener('mouseenter', () => this._openMenu('camera')),
      this._cameraListEl.addEventListener('mouseleave', () => this._scheduleMenuHide('camera')),
      (this._mannequinMenuEl = createMannequinQuickMenu({
        onSelectGender: ({ gender: gender }) => {
          setPanoramaSceneGridPlacement({
            nodeId: this.id,
            patch: { gender: gender === 'female' ? 'female' : 'male' },
          });
        },
        onSelectColor: ({ colorKey: colorKey, gender: gender2 }) => {
          const gender3 = gender2 === 'female' ? 'female' : 'male';
          (this._selectNodeOnCanvas(),
            setPanoramaSceneGridPlacement({
              nodeId: this.id,
              patch: { colorKey: colorKey, gender: gender3 },
            }),
            addPanoramaSceneMannequin({
              nodeId: this.id,
              gender: gender3,
              colorKey: colorKey,
              viewPose: this._bridge?.readCurrentViewPose?.(),
            }),
            this._closeMenus());
        },
      })),
      attachUiStop(this._mannequinMenuEl),
      this._mannequinMenuEl.addEventListener('mouseenter', () => this._openMenu('mannequin')),
      this._mannequinMenuEl.addEventListener('mouseleave', () => this._scheduleMenuHide('mannequin')),
      (this._gridPanelEl = this._createGridPanel()),
      attachUiStop(this._gridPanelEl, { wheel: true }),
      this._gridPanelEl.addEventListener('mouseenter', () => this._openMenu('grid')),
      this._gridPanelEl.addEventListener('mouseleave', () => this._scheduleMenuHide('grid')),
      (this._captureMenuEl = this._createCaptureMenu()),
      attachUiStop(this._captureMenuEl),
      this._captureMenuEl.addEventListener('mouseenter', () => this._openMenu('capture')),
      this._captureMenuEl.addEventListener('mouseleave', () => this._scheduleMenuHide('capture')),
      this._captureMenuEl.addEventListener('click', this._handleCaptureMenuClick),
      (this._focusMenuEl = this._createFocusMenu()),
      attachUiStop(this._focusMenuEl, { wheel: true }),
      this._focusMenuEl.addEventListener('mouseenter', () => this._openMenu('focus')),
      this._focusMenuEl.addEventListener('mouseleave', () => this._scheduleMenuHide('focus')),
      (this._statusEl = document.createElement('div')),
      (this._statusEl.className = 'panorama-scene-fixed-status'),
      (this._statusEl.style.transform = 'none'),
      (this._statusContentEl = document.createElement('div')),
      (this._statusContentEl.className = 'panorama-scene-fixed-status__content'),
      this._statusEl.appendChild(this._statusContentEl),
      attachUiStop(this._statusEl),
      (this._errorEl = document.createElement('div')),
      (this._errorEl.className = 'panorama-scene-error'),
      attachUiStop(this._errorEl),
      (this._hintEl = document.createElement('div')),
      (this._hintEl.className = 'panorama-scene-fixed-hint'),
      (this._hintEl.style.transform = 'none'),
      (this._hintContentEl = document.createElement('div')),
      (this._hintContentEl.className = 'panorama-scene-fixed-hint__content'),
      this._hintEl.appendChild(this._hintContentEl),
      attachUiStop(this._hintEl),
      (this._contextMenuEl = document.createElement('div')),
      (this._contextMenuEl.className = 'panorama-scene-object-menu'),
      (this._contextMenuEl.hidden = true),
      (this._contextMenuEl.innerHTML =
        '\n      <button type="button" class="panorama-scene-object-menu__item act-delete-selected">' +
        panoramaSceneText('contextMenu.deleteObject') +
        '</button>\n    '),
      attachUiStop(this._contextMenuEl),
      this._contextMenuEl.querySelector('.act-delete-selected')?.addEventListener('click', () => {
        (this._contextMenuTarget?.type === 'camera' && this._contextMenuTarget?.cameraId
          ? deletePanoramaSceneCamera({ nodeId: this.id, cameraId: this._contextMenuTarget.cameraId })
          : deleteSelectedPanoramaSceneObject({ nodeId: this.id }),
          this._closeObjectContextMenu());
      }),
      (this._captureSafeFrameEl = document.createElement('div')),
      (this._captureSafeFrameEl.className = 'panorama-scene-capture-safe-frame'),
      (this._captureSafeFrameEl.hidden = true),
      (this._captureSafeFrameLabelEl = document.createElement('div')),
      (this._captureSafeFrameLabelEl.className = 'panorama-scene-capture-safe-frame__label'),
      this._captureSafeFrameEl.appendChild(this._captureSafeFrameLabelEl),
      this._bottomToolbarPopoverLayerEl.appendChild(this._captureMenuEl),
      this._bottomToolbarPopoverLayerEl.appendChild(this._cameraListEl),
      this._bottomToolbarPopoverLayerEl.appendChild(this._focusMenuEl),
      this._bottomToolbarPopoverLayerEl.appendChild(this._mannequinMenuEl),
      this._bottomToolbarPopoverLayerEl.appendChild(this._gridPanelEl),
      this._overlayEl.appendChild(this._captureSafeFrameEl),
      this._overlayEl.appendChild(this._contextMenuEl),
      this._overlayEl.appendChild(this._errorEl),
      this._infoDockEl.appendChild(this._hintEl),
      this._infoDockEl.appendChild(this._statusEl),
      this._shellEl.appendChild(this._viewportEl),
      this._shellEl.appendChild(this._overlayEl),
      this._shellEl.appendChild(this._cornerToolbarEl),
      this._shellEl.appendChild(this._infoDockEl),
      this._shellEl.appendChild(this._bottomToolbarAnchorEl),
      this.el.appendChild(this._sceneToolbarEl),
      this.el.appendChild(this._editToolbarEl),
      (this._browserFullscreenAnchorEl = document.createElement('div')),
      (this._browserFullscreenAnchorEl.className = 'panorama-scene-browser-fullscreen-anchor'),
      (this._browserFullscreenAnchorEl.hidden = true),
      this.el.appendChild(this._browserFullscreenAnchorEl),
      this.el.appendChild(this._shellEl),
      this.el.addEventListener('pointerenter', this._handleNodePointerEnter),
      this.el.addEventListener('pointerleave', this._handleNodePointerLeave),
      (this._fileInput = document.createElement('input')),
      (this._fileInput.className = 'panorama-scene-file-input'),
      (this._fileInput.type = 'file'),
      (this._fileInput.accept = 'image/*'),
      (this._fileInput.style.display = 'none'),
      this._fileInput.addEventListener('change', this._handleFileInputChange),
      this.el.appendChild(this._fileInput),
      (this._bridge = new PanoramaScene3DBridge({
        container: this._viewportEl,
        onPanoramaStatusChange: ({ isLoaded: isLoaded, error: error }) => {
          updatePanoramaSceneLoadState({ nodeId: this.id, isLoaded: isLoaded, error: error });
        },
      })),
      this._bridge.setDefaultSceneFocalLength?.(this._defaultSceneFocalLength),
      (this._interaction = new PanoramaSceneInteraction({
        viewportEl: this._viewportEl,
        overlayEl: this._overlayEl,
        bridge: this._bridge,
        getSceneState: () => getPanoramaSceneState(appStore.getStateRaw().nodes[this.id]),
        onViewCommit: (args) => {
          applyPanoramaSceneViewCommit({ nodeId: this.id, ...args });
        },
        onObjectCommit: ({ objectType: objectType, objectId: objectId, pose: pose }) => {
          updatePanoramaSceneObjectTransform({
            nodeId: this.id,
            objectType: objectType,
            objectId: objectId,
            pose: pose,
          });
        },
        onSelectionChange: (objectType2, objectId2) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelection({ nodeId: this.id, objectType: objectType2, objectId: objectId2 }));
        },
        onSelectionBatchChange: (objectType3, objectIds, groupId = null) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelectionBatch({
              nodeId: this.id,
              objectType: objectType3,
              objectIds: objectIds,
              groupId: groupId,
            }));
        },
        onSelectionObjectsChange: (objects, activeObjectType = {}) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelectionObjects({
              nodeId: this.id,
              objects: objects,
              activeObjectType: activeObjectType.activeObjectType || null,
              activeObjectId: activeObjectType.activeObjectId || null,
              groupId: activeObjectType.groupId || null,
            }));
        },
        onSelectionClear: () => {
          clearPanoramaSceneSelection({ nodeId: this.id });
        },
        onObjectBatchCommit: ({ targets: targets }) => {
          updatePanoramaSceneObjectTransform({ nodeId: this.id, targets: targets });
        },
      })),
      this._interaction.attach(),
      (this._resizeObserver = new ResizeObserver((value26) => {
        const box6 = value26?.[0]?.contentRect;
        (this._bridge?.resize(box6?.width, box6?.height), this._positionMenus());
      })),
      this._resizeObserver.observe(this._viewportEl),
      (this._unsubscribeSelection = appStore.subscribeSelector(
        (value27) => {
          const list5 = Array.isArray(value27.selectedNodeIds) ? value27.selectedNodeIds : [];
          return list5.includes(this.id);
        },
        (value28) => {
          const value29 = this._isSelected === true,
            enabled2 = value28 === true;
          ((this._isSelected = enabled2),
            value29 && !enabled2 && this._sceneState?.ui?.isEditing === true && this._exitEditing(),
            this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
        },
      )),
      (this._unsubscribeViewport = appStore.subscribeSelector(
        (value30) => {
          const box7 = value30.viewport || { x: 0, y: 0, zoom: 1 };
          return (box7.x || 0) + '|' + (box7.y || 0) + '|' + (box7.zoom || 1);
        },
        () => {
          this._positionMenus();
        },
      )),
      this._isPanorama360 &&
        (this._unsubscribePanoramaIncomingSync = appStore.subscribeSelector(
          (value31) => this._buildPanorama360IncomingImageSignature(value31),
          () => {
            syncPanorama360FromIncomingImageEdge({ nodeId: this.id });
          },
        )),
      window.addEventListener('resize', this._handleWindowResize),
      window.addEventListener('pointerdown', this._handleGlobalPointerDown, true),
      window.addEventListener('keydown', this._handleWindowKeyDown, true),
      window.addEventListener('shortcuts-updated', this._handleShortcutsUpdated),
      window.addEventListener('panorama-scene:camera-shortcut', this._handleCameraShortcutEvent),
      window.addEventListener('panorama-scene:capture-shortcut', this._handleCaptureShortcutEvent),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this.update(this._data),
      this._isPanorama360 && syncPanorama360FromIncomingImageEdge({ nodeId: this.id }),
      this.el
    );
  }
  ['_handleShortcutsUpdated']() {
    this._syncToolbarState();
  }
  ['_resolveCameraBySlot'](value32) {
    const cameraSlot = normalizeCameraSlot(value32);
    if (!cameraSlot) return null;
    const list6 = resolveCameraSlotEntries(this._sceneState?.cameras || []),
      args2 = list6.find((item4) => item4.slot === cameraSlot);
    return args2 ? { ...args2 } : null;
  }
  ['_cancelCameraJumpAnimation']({ clearDraft: clearDraft = true } = {}) {
    ((this._cameraJumpToken += 1),
      this._cameraJumpRaf && (cancelAnimationFrame(this._cameraJumpRaf), (this._cameraJumpRaf = 0)),
      this._pendingCameraJumpReleaseRaf &&
        (cancelAnimationFrame(this._pendingCameraJumpReleaseRaf), (this._pendingCameraJumpReleaseRaf = 0)),
      (this._pendingCameraJumpCommit = null),
      clearDraft && this._bridge?.clearDraftView?.());
  }
  ['_setDefaultSceneFocalLength'](value33) {
    const value34 = Math.max(
      SCENE_FOCAL_LENGTH_MIN_MM,
      Math.min(SCENE_FOCAL_LENGTH_MAX_MM, Number(value33) || SCENE_DEFAULT_FOCAL_LENGTH_MM),
    );
    ((this._defaultSceneFocalLength = value34), this._bridge?.setDefaultSceneFocalLength?.(value34));
  }
  ['_getDefaultSceneFocalLength']() {
    return (
      this._bridge?.getDefaultSceneFocalLength?.() ||
      this._defaultSceneFocalLength ||
      SCENE_DEFAULT_FOCAL_LENGTH_MM
    );
  }
  ['_isDefaultSceneView'](event9) {
    const event10 = createDefaultSceneView();
    return (
      Math.abs((Number(event9?.target?.x) || 0) - event10.target.x) < 1e-9 &&
      Math.abs((Number(event9?.target?.y) || 0) - event10.target.y) < 1e-9 &&
      Math.abs((Number(event9?.target?.z) || 0) - event10.target.z) < 1e-9 &&
      Math.abs((Number(event9?.orbitYaw) || 0) - event10.orbitYaw) < 1e-9 &&
      Math.abs((Number(event9?.orbitPitch) || 0) - event10.orbitPitch) < 1e-9 &&
      Math.abs((Number(event9?.orbitDistance) || 0) - event10.orbitDistance) < 1e-9
    );
  }
  ['_maybeReleasePendingCameraJumpDraft']() {
    const enabled3 = this._pendingCameraJumpCommit;
    if (!enabled3 || this._pendingCameraJumpReleaseRaf) return;
    const value35 = this._sceneState?.viewport?.sceneView || null,
      value36 = this._getDefaultSceneFocalLength();
    if (!areSceneViewsEquivalent(value35, enabled3.targetSceneView)) return;
    if (Math.abs(value36 - enabled3.targetFocalLength) > 0.000001) return;
    const value37 = enabled3.token;
    this._pendingCameraJumpReleaseRaf = requestAnimationFrame(() => {
      this._pendingCameraJumpReleaseRaf = 0;
      const enabled4 = this._pendingCameraJumpCommit;
      if (!enabled4 || enabled4.token !== value37) return;
      const value38 = this._sceneState?.viewport?.sceneView || null,
        value39 = this._getDefaultSceneFocalLength();
      if (!areSceneViewsEquivalent(value38, enabled4.targetSceneView)) return;
      if (Math.abs(value39 - enabled4.targetFocalLength) > 0.000001) return;
      ((this._pendingCameraJumpCommit = null), this._bridge?.clearDraftView?.());
    });
  }
  ['_maybePreloadCharacterModels'](value40 = null) {
    if (this._isPanorama360) return;
    if (this._hasRequestedCharacterPreload) return;
    const enabled5 = this._sceneState?.ui?.isEditing === true,
      value41 = value40?.ui?.isEditing === true;
    if (!enabled5 || value41) return;
    ((this._hasRequestedCharacterPreload = true), void preloadPanoramaCharacterModels().catch(() => {}));
  }
  ['_commitCameraJumpTarget']({
    targetPose: targetPose,
    referenceSceneView: referenceSceneView,
    targetFocalLength: targetFocalLength,
  }) {
    const targetSceneView = cameraPoseToSceneViewFromReference(targetPose, referenceSceneView);
    return (
      (this._pendingCameraJumpCommit = {
        token: this._cameraJumpToken,
        targetSceneView: targetSceneView,
        targetFocalLength: targetFocalLength,
      }),
      this._setDefaultSceneFocalLength(targetFocalLength),
      applyPanoramaSceneViewCommit({
        nodeId: this.id,
        sceneView: targetSceneView,
        activeView: 'default',
        activeCameraId: null,
      }),
      targetSceneView
    );
  }
  ['_animateCameraActivation'](value42) {
    if (!this._supportsCameraFeatures()) return;
    const rotation = (this._sceneState?.cameras || []).find((item5) => item5.id === value42) || null;
    if (!rotation || this._sceneState?.mode !== 'scene') return;
    const run = (value43) => {
        const box8 = value43?.quaternion;
        if (
          Number.isFinite(Number(box8?.x)) &&
          Number.isFinite(Number(box8?.y)) &&
          Number.isFinite(Number(box8?.z)) &&
          Number.isFinite(Number(box8?.w))
        )
          return new threeRuntime.Quaternion(
            Number(box8.x),
            Number(box8.y),
            Number(box8.z),
            Number(box8.w),
          ).normalize();
        const box9 = value43?.rotation || { x: 0, y: 0, z: 0 };
        return new threeRuntime.Quaternion().setFromEuler(
          new threeRuntime['Euler'](Number(box9.x) || 0, Number(box9.y) || 0, Number(box9.z) || 0, 'YXZ'),
        );
      },
      x3 = run(rotation),
      referenceSceneView2 = this._sceneState?.viewport?.sceneView || createDefaultSceneView(),
      targetPose2 = {
        kind: 'camera',
        position: cloneVector3(rotation.position),
        quaternion: { x: x3.x, y: x3.y, z: x3.z, w: x3.w },
        rotation: rotation.rotation || quaternionToRotation(x3),
      },
      targetFocalLength2 = Number.isFinite(Number(rotation?.focalLength))
        ? Number(rotation.focalLength)
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
      fov = focalLengthToFov(targetFocalLength2);
    ((targetPose2.fov = fov), this._cancelCameraJumpAnimation({ clearDraft: false }));
    const rotation2 = this._bridge?.readCurrentViewPose?.();
    if (!rotation2?.position) {
      this._commitCameraJumpTarget({
        targetPose: targetPose2,
        referenceSceneView: referenceSceneView2,
        targetFocalLength: targetFocalLength2,
      });
      return;
    }
    const value44 = this._cameraJumpToken,
      x4 = run(rotation2),
      value45 = {
        kind: 'camera',
        position: cloneVector3(rotation2.position),
        quaternion: { x: x4.x, y: x4.y, z: x4.z, w: x4.w },
        rotation: rotation2.rotation || quaternionToRotation(x4),
        fov: Number.isFinite(Number(rotation2.fov)) ? Number(rotation2.fov) : 58,
      },
      value46 = 0x1c2,
      value47 = performance.now(),
      handler5 = (value48) => {
        const position = interpolateVector3(value45.position, targetPose2.position, value48),
          x5 = new threeRuntime.Quaternion(
            value45.quaternion.x,
            value45.quaternion.y,
            value45.quaternion.z,
            value45.quaternion.w,
          ).slerp(
            new threeRuntime['Quaternion'](
              targetPose2.quaternion.x,
              targetPose2.quaternion.y,
              targetPose2.quaternion.z,
              targetPose2.quaternion.w,
            ),
            value48,
          ),
          fov2 = lerp(value45.fov, targetPose2.fov, value48);
        this._bridge?.setDraftView?.({
          kind: 'camera',
          position: position,
          quaternion: { x: x5.x, y: x5.y, z: x5.z, w: x5.w },
          rotation: quaternionToRotation(x5),
          fov: fov2,
          disableSmoothing: true,
        });
      };
    handler5(0);
    const value49 = (value50) => {
      if (value44 !== this._cameraJumpToken) return;
      const value51 = Math.max(0, value50 - value47),
        count4 = Math.min(1, value51 / value46),
        smootherstep2 = smootherstep(count4);
      handler5(smootherstep2);
      if (count4 < 1) {
        this._cameraJumpRaf = requestAnimationFrame(value49);
        return;
      }
      ((this._cameraJumpRaf = 0),
        this._commitCameraJumpTarget({
          targetPose: targetPose2,
          referenceSceneView: referenceSceneView2,
          targetFocalLength: targetFocalLength2,
        }),
        this._maybeReleasePendingCameraJumpDraft());
    };
    this._cameraJumpRaf = requestAnimationFrame(value49);
  }
  ['_saveCurrentViewToCameraSlot'](slot3) {
    if (!this._supportsCameraFeatures()) return;
    const viewPose = this._bridge?.readCurrentViewPose?.();
    if (!viewPose) return;
    upsertPanoramaSceneCameraAtSlot({ nodeId: this.id, slot: slot3, viewPose: viewPose });
  }
  ['_handleCameraShortcutEvent'](value52) {
    if (!this._supportsCameraFeatures()) return;
    const value53 = value52?.detail || {};
    if (value53.nodeId !== this.id) return;
    if (!this._isEditing()) return;
    const cameraSlot2 = normalizeCameraSlot(value53.slot);
    if (!cameraSlot2) return;
    if (value53.mode === 'save') {
      this._saveCurrentViewToCameraSlot(cameraSlot2);
      return;
    }
    const enabled6 = this._resolveCameraBySlot(cameraSlot2);
    if (!enabled6?.camera?.id) return;
    this._animateCameraActivation(enabled6.camera.id);
  }
  ['_handleCaptureShortcutEvent'](value54) {
    const value55 = value54?.detail || {};
    if (value55.nodeId !== this.id) return;
    if (!this._isEditing()) return;
    void this._handleToolbarAction('capture');
  }
  ['_createCaptureMenu']() {
    const el3 = document.createElement('div');
    return (
      (el3.className = 'panorama-capture-menu'),
      (el3.hidden = true),
      (el3.innerHTML =
        '\n      <div class="panorama-capture-menu__grid">\n        ' +
        PANORAMA_CAPTURE_MODE_OPTIONS.map((event11) => {
          const label = getCaptureModeLabel(event11);
          return (
            '\n            <button\n              type="button"\n              class="panorama-capture-menu__item"\n              data-capture-mode="' +
            event11.key +
            '"\n              aria-label="' +
            panoramaSceneText('capture.modeAria', { label: label }) +
            '"\n            >\n              <span class="panorama-capture-menu__icon ' +
            event11.iconClass +
            '" aria-hidden="true">\n                <span class="panorama-capture-menu__icon-shape"></span>\n              </span>\n              <span class="panorama-capture-menu__label">' +
            label +
            '</span>\n            </button>\n          '
          );
        }).join('') +
        '\n      </div>\n    '),
      el3
    );
  }
  ['_handleCaptureMenuClick'](event12) {
    const el4 = event12.target?.closest?.('[data-capture-mode]');
    if (!(el4 instanceof HTMLButtonElement)) return;
    const mode2 = el4.dataset.captureMode || 'adaptive';
    (this._selectNodeOnCanvas(),
      setPanoramaSceneCaptureMode({
        nodeId: this.id,
        mode: mode2,
        showSafeFrame: mode2 !== 'adaptive',
      }));
  }
  ['_createFocusMenu']() {
    const el5 = document.createElement('div');
    ((el5.className = 'panorama-scene-focus-menu'), (el5.hidden = true));
    const el6 = document.createElement('div');
    el6.className = 'panorama-scene-focus-menu__header';
    const el7 = document.createElement('span');
    ((el7.className = 'panorama-scene-focus-menu__title'),
      (el7.textContent = panoramaSceneText('focus.title')),
      el6.appendChild(el7));
    const el8 = document.createElement('span');
    ((el8.className = 'panorama-scene-focus-menu__value'), el6.appendChild(el8));
    const el9 = document.createElement('input');
    ((el9.className = 'panorama-scene-focus-menu__slider'),
      (el9.type = 'range'),
      (el9.min = String(SCENE_FOCAL_LENGTH_MIN_MM)),
      (el9.max = String(SCENE_FOCAL_LENGTH_MAX_MM)),
      (el9.step = '1'),
      el9.setAttribute('aria-label', panoramaSceneText('focus.sliderAria')));
    const run2 = () => {
      const value56 = Math.max(
        SCENE_FOCAL_LENGTH_MIN_MM,
        Math.min(
          SCENE_FOCAL_LENGTH_MAX_MM,
          Number(this._getDefaultSceneFocalLength()) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
      );
      ((el9.value = String(value56)), (el8.textContent = String(Math.round(value56))));
    };
    return (
      el9.addEventListener('input', (event13) => {
        const value57 = Math.max(
          SCENE_FOCAL_LENGTH_MIN_MM,
          Math.min(
            SCENE_FOCAL_LENGTH_MAX_MM,
            Number(event13.currentTarget?.value) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
          ),
        );
        ((el8.textContent = String(Math.round(value57))), this._setDefaultSceneFocalLength(value57));
      }),
      el5.appendChild(el6),
      el5.appendChild(el9),
      (el5._syncValue = run2),
      run2(),
      el5
    );
  }
  ['_resolveCaptureMode']() {
    return normalizeCaptureMode(this._sceneState?.capture?.mode);
  }
  ['_resolveCaptureFrameRect']() {
    const value58 = this._viewportEl?.clientWidth || 0,
      value59 = this._viewportEl?.clientHeight || 0;
    return computeCaptureFrameRect(value58, value59, this._resolveCaptureMode());
  }
  ['_syncCaptureMenuState']() {
    if (!this._captureMenuEl) return;
    const value60 = this._resolveCaptureMode();
    this._captureMenuEl.querySelectorAll('[data-capture-mode]').forEach((el10) => {
      const value61 = el10.dataset.captureMode === value60;
      (el10.classList.toggle('is-active', value61),
        el10.setAttribute('aria-pressed', value61 ? 'true' : 'false'));
    });
  }
  ['_syncCaptureSafeFrame']() {
    if (!this._captureSafeFrameEl || !this._captureSafeFrameLabelEl) return;
    const value62 = this._resolveCaptureMode(),
      enabled7 =
        this._isEditing() &&
        this._isNodeSelected() &&
        value62 !== 'adaptive' &&
        this._sceneState?.capture?.showSafeFrame === true;
    ((this._captureSafeFrameEl.hidden = !enabled7),
      this._captureSafeFrameEl.classList.toggle('is-visible', enabled7),
      this._captureSafeFrameEl.classList.toggle('is-adaptive', value62 === 'adaptive'));
    if (!enabled7) return;
    const box10 = this._resolveCaptureFrameRect();
    ((this._captureSafeFrameEl.style.left = box10.x + 'px'),
      (this._captureSafeFrameEl.style.top = box10.y + 'px'),
      (this._captureSafeFrameEl.style.width = box10.width + 'px'),
      (this._captureSafeFrameEl.style.height = box10.height + 'px'),
      (this._captureSafeFrameLabelEl.textContent = getCaptureModeLabel(value62)));
  }
  async ['_captureViewportByCurrentMode']() {
    const blob2 = await this._bridge?.captureBlob?.({ includeEditorOverlays: false });
    if (!blob2) return null;
    return cropCaptureBlobToFrame({
      blob: blob2,
      viewportWidth: this._viewportEl?.clientWidth || 0,
      viewportHeight: this._viewportEl?.clientHeight || 0,
      mode: this._resolveCaptureMode(),
    });
  }
  ['_createGridPanel']() {
    const el11 = document.createElement('div');
    ((el11.className = 'panorama-grid-panel'),
      (el11.innerHTML =
        '\n      <div class="panorama-grid-panel__title">' +
        panoramaSceneText('grid.title') +
        '</div>\n      <div class="panorama-grid-panel__metrics-row">\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="rows">' +
        panoramaSceneText('grid.rows') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="rows" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.rowsAria') +
        '" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="cols">' +
        panoramaSceneText('grid.cols') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="cols" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.colsAria') +
        '" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__metrics-row">\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="spacingX">' +
        panoramaSceneText('grid.spacingX') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="spacingX" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.spacingXAria') +
        '" aria-valuenow="1.0" tabindex="0">1.0</div>\n          </div>\n        </label>\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label" data-grid-label="spacingZ">' +
        panoramaSceneText('grid.spacingZ') +
        '</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="spacingZ" role="spinbutton" aria-label="' +
        panoramaSceneText('grid.spacingZAria') +
        '" aria-valuenow="1.0" tabindex="0">1.0</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__appearance-row">\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--gender">\n          <span class="panorama-grid-panel__appearance-label" data-grid-label="gender">' +
        panoramaSceneText('grid.gender') +
        '</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--gender">\n            ' +
        PANORAMA_MANNEQUIN_GENDER_OPTIONS.map(([value63, , value64]) => {
          const label2 = getPanoramaMannequinGenderLabel(value63);
          return (
            '<button type="button" class="panorama-mannequin-menu__gender-btn" data-grid-gender="' +
            value63 +
            '" aria-label="' +
            panoramaSceneText('grid.setGenderAria', { label: label2 }) +
            '">' +
            value64 +
            '</button>'
          );
        }).join('') +
        '\n          </div>\n        </div>\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--color">\n          <span class="panorama-grid-panel__appearance-label" data-grid-label="color">' +
        panoramaSceneText('grid.color') +
        '</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--color">\n            ' +
        PANORAMA_MANNEQUIN_COLOR_OPTIONS.map(([value65]) => {
          const label3 = getPanoramaMannequinColorLabel(value65);
          return (
            '<button type="button" class="panorama-mannequin-menu__color-btn" data-grid-color="' +
            value65 +
            '" aria-label="' +
            panoramaSceneText('grid.setColorAria', { label: label3 }) +
            '"></button>'
          );
        }).join('') +
        '\n          </div>\n        </div>\n      </div>\n      <button type="button" class="panorama-grid-panel__apply">' +
        panoramaSceneText('grid.apply') +
        '</button>\n    '));
    const value66 = {
        rows: { min: 1, max: 12, step: 1, precision: 0 },
        cols: { min: 1, max: 12, step: 1, precision: 0 },
        spacingX: { min: 0.5, max: 8, step: 0.1, precision: 1 },
        spacingZ: { min: 0.5, max: 8, step: 0.1, precision: 1 },
      },
      handler6 = (value67, value68) => {
        const enabled8 = value66[value67];
        if (!enabled8) return null;
        const value69 = Number(value68);
        if (!Number.isFinite(value69)) return null;
        const value70 = Math.min(enabled8.max, Math.max(enabled8.min, value69));
        if (enabled8.precision === 0) return Math.round(value70);
        return Number(value70.toFixed(enabled8.precision));
      },
      handler7 = (value71, value72) => {
        const enabled9 = value66[value71];
        if (!enabled9 || !Number.isFinite(Number(value72))) return '';
        return enabled9.precision === 0
          ? String(Math.round(Number(value72)))
          : Number(value72).toFixed(enabled9.precision);
      },
      handler8 = (el12, value73, value74) => {
        if (!el12) return;
        const value75 = handler7(value73, value74);
        el12.tagName === 'INPUT'
          ? (el12.value = value75)
          : ((el12.textContent = value75), el12.setAttribute('aria-valuenow', String(value74)));
      },
      handler9 = (value76, value77) => {
        const value78 = handler6(value76, value77);
        if (!Number.isFinite(value78)) return;
        setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { [value76]: value78 } });
        const value79 = el11.querySelector('[data-grid-field="' + value76 + '"]');
        handler8(value79, value76, value78);
      };
    return (
      Object.keys(value66).forEach((item6) => {
        const value80 = value66[item6],
          enabled10 = el11.querySelector('[data-grid-field="' + item6 + '"]');
        if (!enabled10) return;
        let box11 = null,
          value81 = false;
        const run3 = () => {
            const value82 = handler6(item6, this._sceneState?.gridPlacement?.[item6]);
            if (Number.isFinite(value82)) return value82;
            const value83 = handler6(item6, enabled10.getAttribute('aria-valuenow'));
            if (Number.isFinite(value83)) return value83;
            return value80.min;
          },
          value84 = (event14) => {
            if (!box11) return;
            const value85 = event14.clientX - box11.x;
            if (!box11.moved && Math.abs(value85) >= 3) box11.moved = true;
            const value86 = Math.trunc(value85 / 6),
              value87 = box11.v + value86 * value80.step;
            if (value87 === box11.last) return;
            ((box11.last = value87), handler9(item6, value87));
          },
          value88 = () => {
            if (!box11) return;
            const value89 = box11.moved;
            (box11.el.classList.remove('is-dragging'),
              document.removeEventListener('mousemove', value84),
              document.removeEventListener('mouseup', value88),
              value89 && ((value81 = true), (this._suppressDocClickOnce = true)),
              (box11 = null));
          },
          handler10 = (value90) => {
            const value91 = run3(),
              el13 = document.createElement('input');
            ((el13.className = 'rh-stepper-input panorama-grid-panel__metric-stepper-input'),
              (el13.type = 'number'),
              (el13.step = String(value80.step)),
              (el13.min = String(value80.min)),
              (el13.max = String(value80.max)),
              (el13.value = handler7(item6, value91)),
              value90.replaceWith(el13),
              el13.focus(),
              el13.select());
            const run4 = (value92) => {
              const value93 = value92 ? el13.value : value91,
                value94 = handler6(item6, value93),
                value95 = Number.isFinite(value94) ? value94 : value91,
                el14 = document.createElement('div');
              ((el14.className = 'rh-stepper-value panorama-grid-panel__metric-stepper'),
                (el14.dataset.gridField = item6),
                el14.setAttribute('role', 'spinbutton'),
                el14.setAttribute('tabindex', '0'));
              const value96 = value90.getAttribute('aria-label') || item6;
              (el14.setAttribute('aria-label', value96),
                el14.setAttribute('aria-valuenow', String(value95)),
                (el14.textContent = handler7(item6, value95)),
                el13.replaceWith(el14),
                value92 ? handler9(item6, value95) : handler8(el14, item6, value95),
                handler11(el14));
            };
            ((el13.onkeydown = (event15) => {
              if (event15.key === 'Enter') run4(true);
              if (event15.key === 'Escape') run4(false);
            }),
              (el13.onblur = () => run4(true)));
          },
          handler11 = (el15) => {
            ((el15.onclick = (event16) => {
              event16.stopPropagation();
              if (value81) {
                value81 = false;
                return;
              }
              handler10(el15);
            }),
              (el15.onkeydown = (event17) => {
                const value97 = event17.key === 'ArrowRight' ? 1 : event17.key === 'ArrowLeft' ? -1 : 0;
                if (value97) {
                  (event17.preventDefault(), event17.stopPropagation());
                  const value98 = run3();
                  handler9(item6, value98 + value97 * value80.step);
                  return;
                }
                (event17.key === 'Enter' || event17.key === ' ') &&
                  (event17.preventDefault(), event17.stopPropagation(), handler10(el15));
              }),
              (el15.onmousedown = (x6) => {
                if (x6.button !== 0) return;
                (x6.preventDefault(), (value81 = false));
                const v = run3();
                ((box11 = {
                  x: x6.clientX,
                  v: v,
                  moved: false,
                  last: v,
                  el: el15,
                }),
                  el15.classList.add('is-dragging'),
                  document.addEventListener('mousemove', value84),
                  document.addEventListener('mouseup', value88));
              }));
          };
        handler11(enabled10);
      }),
      el11.querySelectorAll('[data-grid-gender]').forEach((el16) => {
        el16.addEventListener('click', () => {
          const gender4 = el16.dataset.gridGender === 'female' ? 'female' : 'male';
          setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { gender: gender4 } });
        });
      }),
      el11.querySelectorAll('[data-grid-color]').forEach((el17) => {
        el17.addEventListener('click', () => {
          const colorKey2 = el17.dataset.gridColor || 'blue';
          setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { colorKey: colorKey2 } });
        });
      }),
      el11.querySelector('.panorama-grid-panel__apply')?.addEventListener('click', () => {
        (this._selectNodeOnCanvas(),
          addPanoramaSceneMannequinGrid({ nodeId: this.id, viewPose: this._bridge?.readCurrentViewPose?.() }),
          (this._openMenuKey = null),
          this._syncOverlayState());
      }),
      el11
    );
  }
  ['_isNodeSelected']() {
    return this._isSelected === true;
  }
  ['_handleWindowResize']() {
    (this._positionMenus(), this._syncCaptureSafeFrame());
  }
  ['_isBrowserFullscreen']() {
    return !!this._browserFullscreenOverlayEl;
  }
  async ['_enterBrowserFullscreen']() {
    if (this._isBrowserFullscreen() || !this._shellEl) return;
    const el18 = document.createElement('div');
    el18.className = 'panorama-scene-browser-fullscreen';
    const el19 = document.createElement('button');
    ((el19.type = 'button'),
      (el19.className = 'panorama-scene-browser-fullscreen__exit'),
      (el19.textContent = panoramaSceneText('toolbar.exitFullscreen')),
      el19.setAttribute('aria-label', panoramaSceneText('toolbar.exitFullscreen')),
      el19.addEventListener('click', () => {
        void this._exitBrowserFullscreen();
      }),
      (this._browserFullscreenExitBtnEl = el19),
      el18.appendChild(el19),
      el18.appendChild(this._shellEl),
      document.body.appendChild(el18),
      (this._browserFullscreenOverlayEl = el18),
      this._syncToolbarState(),
      this._syncOverlayState(),
      this._positionMenus(),
      this._bridge?.resize());
  }
  async ['_exitBrowserFullscreen']({ skipSync: skipSync = false } = {}) {
    if (!this._isBrowserFullscreen()) return;
    const el20 = this._browserFullscreenOverlayEl;
    ((this._browserFullscreenOverlayEl = null), (this._browserFullscreenExitBtnEl = null));
    this._shellEl &&
      this.el?.isConnected &&
      (this._browserFullscreenAnchorEl?.parentElement === this.el
        ? this.el.insertBefore(this._shellEl, this._browserFullscreenAnchorEl.nextSibling)
        : this.el.appendChild(this._shellEl));
    el20?.remove?.();
    if (skipSync) return;
    (this._syncToolbarState(), this._syncOverlayState(), this._positionMenus(), this._bridge?.resize());
  }
  ['_handleWindowKeyDown'](event18) {
    if (event18.defaultPrevented) return;
    if (event18.key === 'Escape' && this._isBrowserFullscreen()) {
      (event18.preventDefault(),
        event18.stopPropagation(),
        event18.stopImmediatePropagation?.(),
        void this._exitBrowserFullscreen());
      return;
    }
    if (!this._isEditing()) return;
    const value99 = event18.target,
      detail = resolvePanoramaSceneHistoryShortcutAction(event18);
    if (
      detail &&
      value99 instanceof HTMLElement &&
      (this.el?.contains?.(value99) || this._browserFullscreenOverlayEl?.contains?.(value99))
    ) {
      (event18.preventDefault(),
        event18.stopPropagation(),
        event18.stopImmediatePropagation?.(),
        window.dispatchEvent(new CustomEvent('shortcut-action', { detail: detail })));
      return;
    }
    if (
      value99 instanceof HTMLElement &&
      (value99.isContentEditable ||
        value99.tagName === 'INPUT' ||
        value99.tagName === 'TEXTAREA' ||
        value99.tagName === 'SELECT')
    )
      return;
    if (event18.key === 'Delete' || event18.key === 'Backspace') {
      (event18.preventDefault(),
        event18.stopPropagation(),
        event18.stopImmediatePropagation?.(),
        deleteSelectedPanoramaSceneObject({ nodeId: this.id }));
      return;
    }
    if (
      !event18.repeat &&
      !event18.ctrlKey &&
      !event18.metaKey &&
      !event18.altKey &&
      (event18.key === 'v' || event18.key === 'V')
    ) {
      (event18.preventDefault(),
        event18.stopPropagation(),
        event18.stopImmediatePropagation?.(),
        this._toggleMouseTool());
      return;
    }
  }
  ['_syncAttachedUiVisibility'](enabled11) {
    this._bottomToolbarAnchorEl && (this._bottomToolbarAnchorEl.hidden = !enabled11);
    const enabled12 = this._isNodeSelected() || this._isNodeHovered;
    this._infoDockEl && (this._infoDockEl.hidden = !enabled12);
  }
  ['_handleNodePointerEnter']() {
    ((this._isNodeHovered = true), this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
  }
  ['_handleNodePointerLeave'](value100) {
    const value101 = value100.relatedTarget;
    if (value101 && this.el.contains(value101)) return;
    ((this._isNodeHovered = false),
      this._closeObjectContextMenu(),
      this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
  }
  ['_selectNodeOnCanvas']({ preserveExistingSelection: preserveExistingSelection = false } = {}) {
    const list7 = appStore.getStateRaw().selectedNodeIds || [];
    if (preserveExistingSelection && list7.includes(this.id)) return;
    if (list7.length === 1 && list7[0] === this.id) return;
    appStore.setSelectedNodes([this.id]);
  }
  ['_isEditing']() {
    return this._sceneState?.ui?.isEditing === true && this._data?.isCollapsed !== true;
  }
  ['_shouldShowBottomToolbar']() {
    const value102 = this._isNodeSelected();
    return this._isEditing() && value102;
  }
  ['_resolveMouseTool']() {
    return (
      this._sceneState?.ui?.mouseTool ||
      (this._sceneState?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate')
    );
  }
  ['_toggleMouseTool']() {
    const value103 = String(this._sceneState?.ui?.mouseTool || this._sceneState?.ui?.activeTool || '').trim(),
      tool = resolveNextPanoramaMouseTool(value103);
    setPanoramaSceneTool({ nodeId: this.id, tool: tool });
  }
  ['_resolveTransformTool']() {
    return (
      this._sceneState?.ui?.transformTool ||
      (this._sceneState?.ui?.activeTool === 'move' ||
      this._sceneState?.ui?.activeTool === 'rotate' ||
      this._sceneState?.ui?.activeTool === 'scale'
        ? this._sceneState.ui.activeTool
        : 'move')
    );
  }
  ['_supportsPanoramaUpload']() {
    return this._isPanorama360 === true;
  }
  ['_supportsCubeCreation']() {
    return this._isPanorama360 !== true;
  }
  ['_supportsCameraFeatures']() {
    return this._isPanorama360 !== true;
  }
  ['_buildPanorama360IncomingImageSignature'](value104) {
    if (!this._isPanorama360) return '';
    const value105 = value104?.nodes || {},
      enabled13 = value105[this.id];
    if (!enabled13) return '';
    const enabled14 = String(enabled13.parentId || '').trim(),
      list8 = Object.values(value104?.edges || {}),
      list9 = [];
    return (
      list8.forEach((enabled15) => {
        if (!enabled15) return;
        const enabled16 = enabled15.targetId === this.id,
          enabled17 = !!enabled14 && enabled15.targetId === enabled14;
        if (!enabled16 && !enabled17) return;
        const enabled18 = value105[enabled15.sourceId];
        if (!enabled18 || !isPanorama360ImageSourceType(enabled18.type)) return;
        const value106 =
            typeof enabled18._bizRev === 'number' || typeof enabled18._bizRev === 'string'
              ? String(enabled18._bizRev)
              : '',
          value107 = [
            String(enabled18.localPath || '').trim(),
            String(enabled18.imageUrl || '').trim(),
            String(enabled18.src || '').trim(),
            String(enabled18.fileName || '').trim(),
          ].join(':');
        list9.push(
          enabled15.id +
            ':' +
            enabled15.sourceId +
            ':' +
            Number(enabled15.createdAt || 0) +
            ':' +
            value106 +
            ':' +
            value107,
        );
      }),
      list9.sort((item7, value108) => item7.localeCompare(value108)),
      list9.join('|')
    );
  }
  ['_enterEditing']() {
    (this._selectNodeOnCanvas(),
      this._data?.isCollapsed && setPanoramaSceneCollapsed({ nodeId: this.id, isCollapsed: false }),
      setPanoramaSceneEditing({ nodeId: this.id, isEditing: true }),
      requestAnimationFrame(() => this._viewportEl?.focus()));
  }
  ['_exitEditing']() {
    (this._closeMenus(), setPanoramaSceneEditing({ nodeId: this.id, isEditing: false }));
  }
  async ['_handleFileInputChange'](event19) {
    if (!this._supportsPanoramaUpload()) {
      event19.target.value = '';
      return;
    }
    const file = event19.target.files?.[0];
    if (!file) return;
    this._selectNodeOnCanvas();
    const uploadPanoramaSceneImage2 = await uploadPanoramaSceneImage({ nodeId: this.id, file: file });
    (uploadPanoramaSceneImage2 && this._isPanorama360 && this._enterEditing(), (event19.target.value = ''));
  }
  ['_handleViewportPointerDown'](event20) {
    const enabled19 = this._isEditing();
    (this._selectNodeOnCanvas({ preserveExistingSelection: !enabled19 }), this._closeObjectContextMenu());
    if (!enabled19) return;
    (this._openMenuKey && ((this._openMenuKey = null), this._syncOverlayState()),
      this._viewportEl.focus?.(),
      event20.stopPropagation());
  }
  ['_handleViewportContextMenu'](event21) {
    if (!this._isEditing()) return;
    (event21.preventDefault(), event21.stopPropagation(), this._selectNodeOnCanvas());
    const objectType4 = this._bridge?.pick?.(event21.clientX, event21.clientY);
    if (objectType4?.objectType && objectType4?.objectId)
      setPanoramaSceneSelection({
        nodeId: this.id,
        objectType: objectType4.objectType,
        objectId: objectType4.objectId,
      });
    else {
      if (!this._sceneState?.selection?.selectedObjectId) {
        this._closeObjectContextMenu();
        return;
      }
    }
    this._openObjectContextMenu(event21.clientX, event21.clientY, { type: 'selection' });
  }
  ['_handleGlobalPointerDown'](event22) {
    if (!this._contextMenuEl || this._contextMenuEl.hidden) return;
    if (this._contextMenuEl.contains(event22.target)) return;
    this._closeObjectContextMenu();
  }
  ['_openObjectContextMenu'](value109, value110, value111 = { type: 'selection' }) {
    if (!this._contextMenuEl || !this._overlayEl) return;
    const box12 = this._overlayEl.getBoundingClientRect();
    if (!box12.width || !box12.height) return;
    const value112 = this._contextMenuEl.offsetWidth || 132,
      value113 = this._contextMenuEl.offsetHeight || 44,
      value114 = Math.max(0, Math.min(value109 - box12.left, box12.width - value112)),
      value115 = Math.max(0, Math.min(value110 - box12.top, box12.height - value113));
    ((this._contextMenuEl.style.left = value114 + 'px'),
      (this._contextMenuEl.style.top = value115 + 'px'),
      (this._contextMenuTarget = value111),
      (this._contextMenuEl.hidden = false),
      this._contextMenuEl.classList.add('is-visible'));
  }
  ['_closeObjectContextMenu']() {
    if (!this._contextMenuEl) return;
    ((this._contextMenuTarget = null),
      this._contextMenuEl.classList.remove('is-visible'),
      (this._contextMenuEl.hidden = true));
  }
  ['_handleViewportDoubleClick'](event23) {
    (event23.preventDefault(), event23.stopPropagation());
    if (this._isEditing() && this._sceneState?.mode === 'scene') {
      const objectType5 = this._bridge?.pick?.(event23.clientX, event23.clientY);
      if (objectType5?.objectType && objectType5?.objectId) {
        (this._selectNodeOnCanvas(),
          setPanoramaSceneSelection({
            nodeId: this.id,
            objectType: objectType5.objectType,
            objectId: objectType5.objectId,
          }),
          focusPanoramaSceneSelection({ nodeId: this.id }));
        return;
      }
    }
    this._enterEditing();
  }
  ['_handleKeyDown'](event24) {
    if (event24.key !== 'Delete' && event24.key !== 'Backspace') return;
    if (!this._isEditing()) return;
    (event24.preventDefault(),
      event24.stopPropagation(),
      deleteSelectedPanoramaSceneObject({ nodeId: this.id }));
  }
  ['_openPanoramaFilePicker']() {
    if (!this._supportsPanoramaUpload()) return;
    this._fileInput?.click();
  }
  ['_openMenu'](enabled20) {
    if (!enabled20) return;
    (clearTimeout(this._menuHideTimer),
      (this._openMenuKey = enabled20),
      this._positionMenus(),
      this._syncOverlayState());
  }
  ['_closeMenus']() {
    (clearTimeout(this._menuHideTimer), (this._openMenuKey = null), this._syncOverlayState());
  }
  ['_scheduleMenuHide'](value116) {
    (clearTimeout(this._menuHideTimer),
      this._openMenuKey === value116 && ((this._openMenuKey = null), this._syncOverlayState()));
  }
  ['_handleBottomToolbarPointerEnter'](event25) {
    const el21 = event25.target?.closest?.('button');
    if (!el21) return;
    if (el21.classList.contains('act-capture')) {
      this._openMenu('capture');
      return;
    }
    if (!this._isPanorama360 && el21.classList.contains('act-focus')) {
      this._openMenu('focus');
      return;
    }
    if (el21.classList.contains('act-mannequin-entry')) {
      if (!this._supportsCubeCreation()) return;
      this._openMenu('mannequin');
      return;
    }
    if (el21.classList.contains('act-grid')) {
      if (!this._supportsCubeCreation()) return;
      this._openMenu('grid');
      return;
    }
    if (this._supportsCameraFeatures() && el21.classList.contains('act-camera')) {
      this._openMenu('camera');
      return;
    }
  }
  ['_handleBottomToolbarPointerLeave'](event26) {
    const value117 = event26.relatedTarget;
    if (
      value117 &&
      (this._bottomToolbarEl?.contains(value117) ||
        this._captureMenuEl?.contains(value117) ||
        this._cameraListEl?.contains(value117) ||
        this._focusMenuEl?.contains(value117) ||
        this._mannequinMenuEl?.contains(value117) ||
        this._gridPanelEl?.contains(value117))
    )
      return;
    const el22 = event26.target?.closest?.('button');
    if (!el22) return;
    if (el22.classList.contains('act-capture')) {
      this._scheduleMenuHide('capture');
      return;
    }
    if (!this._isPanorama360 && el22.classList.contains('act-focus')) {
      this._scheduleMenuHide('focus');
      return;
    }
    if (el22.classList.contains('act-mannequin-entry')) {
      if (!this._supportsCubeCreation()) return;
      this._scheduleMenuHide('mannequin');
      return;
    }
    if (el22.classList.contains('act-grid')) {
      if (!this._supportsCubeCreation()) return;
      this._scheduleMenuHide('grid');
      return;
    }
    this._supportsCameraFeatures() &&
      el22.classList.contains('act-camera') &&
      this._scheduleMenuHide('camera');
  }
  async ['_handleToolbarAction'](tool2) {
    const environmentMode = this._sceneState;
    switch (tool2) {
      case 'enter-edit':
        this._enterEditing();
        return;
      case 'exit-edit':
        this._exitEditing();
        return;
      case 'upload-panorama':
        if (!this._supportsPanoramaUpload()) return;
        this._openPanoramaFilePicker();
        return;
      case 'fullscreen':
        !this._isEditing() && this._enterEditing();
        this._isBrowserFullscreen()
          ? await this._exitBrowserFullscreen()
          : await this._enterBrowserFullscreen();
        return;
      case 'navigate':
        {
          this._toggleMouseTool();
        }
        return;
      case 'move':
      case 'rotate':
      case 'scale':
        (this._closeMenus(), setPanoramaSceneTool({ nodeId: this.id, tool: tool2 }));
        return;
      case 'environment-toggle':
        setPanoramaSceneEnvironmentMode({
          nodeId: this.id,
          environmentMode: environmentMode.environmentMode === 'day' ? 'night' : 'day',
        });
        return;
      case 'collapse-node':
        {
          const enterEditingOnExpand = this._data?.isCollapsed === true;
          (setPanoramaSceneCollapsed({
            nodeId: this.id,
            isCollapsed: !enterEditingOnExpand,
            enterEditingOnExpand: enterEditingOnExpand,
          }),
            enterEditingOnExpand && requestAnimationFrame(() => this._viewportEl?.focus()));
        }
        return;
      case 'cube':
        if (!this._supportsCubeCreation()) return;
        addPanoramaSceneCube({ nodeId: this.id, viewPose: this._bridge?.readCurrentViewPose?.() });
        return;
      case 'mannequin-entry':
        if (!this._supportsCubeCreation()) return;
        this._openMenu('mannequin');
        return;
      case 'camera':
        if (!this._supportsCameraFeatures()) return;
        {
          addPanoramaSceneCamera({ nodeId: this.id, viewPose: this._bridge?.readCurrentViewPose?.() });
        }
        ((this._openMenuKey = 'camera'), this._syncOverlayState());
        return;
      case 'focus':
        if (this._isPanorama360 || this._sceneState?.mode !== 'scene') return;
        if (this._openMenuKey === 'focus') {
          (this._setDefaultSceneFocalLength(SCENE_DEFAULT_FOCAL_LENGTH_MM),
            this._focusMenuEl?._syncValue?.());
          return;
        }
        this._openMenu('focus');
        return;
      case 'capture':
        await capturePanoramaSceneViewport({
          nodeId: this.id,
          captureBlob: () => this._captureViewportByCurrentMode(),
        });
        return;
      case 'reset-view':
        (this._setDefaultSceneFocalLength(SCENE_DEFAULT_FOCAL_LENGTH_MM),
          resetPanoramaSceneView({ nodeId: this.id }));
        return;
      case 'grid':
        if (!this._supportsCubeCreation()) return;
        this._openMenu('grid');
        return;
      case 'toggle-panorama-mode':
        (this._closeMenus(),
          setPanoramaSceneMode({
            nodeId: this.id,
            mode: this._supportsPanoramaUpload() ? 'panorama' : 'scene',
          }));
        return;
      default:
        return;
    }
  }
  ['_handleToolbarClick'](event27) {
    const el23 = event27.target.closest('button');
    if (!el23) return;
    const list10 = Array.from(el23.classList).find((item8) => item8.startsWith('act-'));
    if (!list10) return;
    (event27.preventDefault(), event27.stopPropagation(), this._selectNodeOnCanvas());
    const value118 = list10.slice(4);
    void this._handleToolbarAction(value118);
  }
  ['_syncGridPanelValues']() {
    if (!this._gridPanelEl) return;
    const value119 = this._sceneState.gridPlacement,
      handler12 = (value120, value121, count5 = 0) => {
        const el24 = this._gridPanelEl.querySelector('[data-grid-field="' + value120 + '"]');
        if (!el24) return;
        if (!Number.isFinite(Number(value121))) return;
        const value122 = count5 > 0 ? Number(value121).toFixed(count5) : String(Math.round(Number(value121)));
        el24.tagName === 'INPUT'
          ? (el24.value = value122)
          : ((el24.textContent = value122), el24.setAttribute('aria-valuenow', String(value121)));
      };
    (handler12('rows', value119.rows, 0),
      handler12('cols', value119.cols, 0),
      handler12('spacingX', value119.spacingX, 1),
      handler12('spacingZ', value119.spacingZ, 1));
    const value123 = value119.gender === 'female' ? 'female' : 'male';
    this._gridPanelEl.querySelectorAll('[data-grid-gender]').forEach((el25) => {
      el25.classList.toggle('is-active', el25.dataset.gridGender === value123);
    });
    const map3 = new Set(PANORAMA_MANNEQUIN_COLOR_OPTIONS.map(([value124]) => value124)),
      value125 = map3.has(value119.colorKey) ? value119.colorKey : 'blue';
    this._gridPanelEl.querySelectorAll('[data-grid-color]').forEach((el26) => {
      const value126 = el26.dataset.gridColor;
      (el26.classList.toggle('is-active', value126 === value125),
        el26.style.setProperty(
          '--panorama-scene-swatch-token',
          'var(--' + resolvePanoramaSceneColorToken(value126) + ')',
        ));
    });
  }
  ['_syncLocaleTexts']() {
    const run5 = (el27, value127) => {
        if (!el27) return;
        ((el27.dataset.tooltip = value127), el27.setAttribute('aria-label', value127));
      },
      handler13 = (value128, value129) => {
        const list11 = [this.el, this._browserFullscreenOverlayEl].filter(Boolean);
        list11.forEach((el28) => {
          el28.querySelectorAll?.(value128)?.forEach((item9) => run5(item9, value129));
        });
      },
      handler14 = (value130, value131) => {
        const el29 =
          this.el?.querySelector?.(value130) || this._browserFullscreenOverlayEl?.querySelector?.(value130);
        if (el29) el29.textContent = value131;
      };
    (handler13('.act-enter-edit', panoramaSceneText('toolbar.edit')),
      handler13('.act-exit-edit', panoramaSceneText('toolbar.closeEdit')),
      handler13('.act-upload-panorama', panoramaSceneText('toolbar.uploadPanorama')),
      handler13('.act-cube', panoramaSceneText('toolbar.createCube')),
      handler13('.act-mannequin-entry', panoramaSceneText('toolbar.mannequin')),
      handler13('.act-grid', panoramaSceneText('toolbar.grid')),
      handler13('.act-capture', panoramaSceneText('toolbar.capture')),
      handler13('.act-camera', panoramaSceneText('toolbar.createCameraBookmark')),
      handler13('.act-focus', panoramaSceneText('toolbar.focus')),
      handler13('.act-reset-view', panoramaSceneText('toolbar.resetView')),
      handler13('.act-environment-toggle', panoramaSceneText('toolbar.switchEnvironment')));
    const el30 = this._contextMenuEl?.querySelector?.('.act-delete-selected');
    if (el30) el30.textContent = panoramaSceneText('contextMenu.deleteObject');
    (this._browserFullscreenExitBtnEl?.setAttribute(
      'aria-label',
      panoramaSceneText('toolbar.exitFullscreen'),
    ),
      this._browserFullscreenExitBtnEl &&
        (this._browserFullscreenExitBtnEl.textContent = panoramaSceneText('toolbar.exitFullscreen')),
      this._captureMenuEl?.querySelectorAll?.('[data-capture-mode]')?.forEach((el31) => {
        const label4 = getCaptureModeLabel(el31.dataset.captureMode || 'adaptive');
        el31.setAttribute('aria-label', panoramaSceneText('capture.modeAria', { label: label4 }));
        const el32 = el31.querySelector('.panorama-capture-menu__label');
        if (el32) el32.textContent = label4;
      }),
      handler14('.panorama-scene-focus-menu__title', panoramaSceneText('focus.title')),
      this._focusMenuEl
        ?.querySelector?.('.panorama-scene-focus-menu__slider')
        ?.setAttribute('aria-label', panoramaSceneText('focus.sliderAria')),
      handler14('.panorama-grid-panel__title', panoramaSceneText('grid.title')),
      handler14('[data-grid-label="rows"]', panoramaSceneText('grid.rows')),
      handler14('[data-grid-label="cols"]', panoramaSceneText('grid.cols')),
      handler14('[data-grid-label="spacingX"]', panoramaSceneText('grid.spacingX')),
      handler14('[data-grid-label="spacingZ"]', panoramaSceneText('grid.spacingZ')),
      handler14('[data-grid-label="gender"]', panoramaSceneText('grid.gender')),
      handler14('[data-grid-label="color"]', panoramaSceneText('grid.color')),
      this._gridPanelEl
        ?.querySelector?.('[data-grid-field="rows"]')
        ?.setAttribute('aria-label', panoramaSceneText('grid.rowsAria')),
      this._gridPanelEl
        ?.querySelector?.('[data-grid-field="cols"]')
        ?.setAttribute('aria-label', panoramaSceneText('grid.colsAria')),
      this._gridPanelEl
        ?.querySelector?.('[data-grid-field="spacingX"]')
        ?.setAttribute('aria-label', panoramaSceneText('grid.spacingXAria')),
      this._gridPanelEl
        ?.querySelector?.('[data-grid-field="spacingZ"]')
        ?.setAttribute('aria-label', panoramaSceneText('grid.spacingZAria')),
      this._gridPanelEl?.querySelectorAll?.('[data-grid-gender]')?.forEach((el33) => {
        const label5 = getPanoramaMannequinGenderLabel(el33.dataset.gridGender);
        el33.setAttribute('aria-label', panoramaSceneText('grid.setGenderAria', { label: label5 }));
      }),
      this._gridPanelEl?.querySelectorAll?.('[data-grid-color]')?.forEach((el34) => {
        const label6 = getPanoramaMannequinColorLabel(el34.dataset.gridColor);
        el34.setAttribute('aria-label', panoramaSceneText('grid.setColorAria', { label: label6 }));
      }),
      handler14('.panorama-grid-panel__apply', panoramaSceneText('grid.apply')),
      renderMannequinQuickMenu(this._mannequinMenuEl, this._sceneState),
      this._renderCameraPresetList(),
      this._syncToolbarState(),
      this._syncHintAndStatus(),
      this._syncCaptureSafeFrame());
  }
  ['_renderCameraPresetList']() {
    renderCameraPresetList(this._cameraListEl, this._sceneState, {
      onActivate: (value132) => {
        (this._animateCameraActivation(value132), (this._openMenuKey = null), this._syncOverlayState());
      },
      onDelete: (cameraId) => {
        deletePanoramaSceneCamera({ nodeId: this.id, cameraId: cameraId });
      },
      onContextMenu: ({ cameraId: cameraId2, clientX: clientX, clientY: clientY }) => {
        this._openObjectContextMenu(clientX, clientY, { type: 'camera', cameraId: cameraId2 });
      },
    });
  }
  ['_syncToolbarState']() {
    const value133 = this._resolveMouseTool(),
      value134 = this._resolveTransformTool();
    this._editToolbarEl
      .querySelectorAll('.act-navigate, .act-move, .act-rotate, .act-scale')
      .forEach((el35) => {
        const list12 = Array.from(el35.classList).find((item10) => item10.startsWith('act-')),
          value135 = list12?.slice(4),
          value136 = value135 === 'navigate',
          value137 = value136 ? value133 === 'navigate' || value133 === 'box-select' : value135 === value134;
        el35.classList.toggle('active', value137);
      });
    const el36 = this._editToolbarEl.querySelector('.act-navigate');
    if (el36) {
      const value138 = value133 === 'box-select';
      el36.classList.toggle('is-box-select', value138);
      const tooltipText = buildTooltipText(
        value138 ? panoramaSceneText('toolbar.boxSelectMouse') : panoramaSceneText('toolbar.mouseMode'),
        'panorama-scene-tool-toggle-mouse',
      );
      ((el36.dataset.tooltip = tooltipText), el36.setAttribute('aria-label', tooltipText));
      const value139 = value138 ? BOX_SELECT_TOOL_ICON : POINTER_TOOL_ICON;
      el36.innerHTML !== value139 && (el36.innerHTML = value139);
    }
    const el37 = this._editToolbarEl.querySelector('.act-move');
    if (el37) {
      const tooltipText2 = buildTooltipText(panoramaSceneText('toolbar.move'), 'panorama-scene-tool-move');
      ((el37.dataset.tooltip = tooltipText2), el37.setAttribute('aria-label', tooltipText2));
    }
    const el38 = this._editToolbarEl.querySelector('.act-rotate');
    if (el38) {
      const tooltipText3 = buildTooltipText(
        panoramaSceneText('toolbar.rotate'),
        'panorama-scene-tool-rotate',
      );
      ((el38.dataset.tooltip = tooltipText3), el38.setAttribute('aria-label', tooltipText3));
    }
    const el39 = this._editToolbarEl.querySelector('.act-scale');
    if (el39) {
      const tooltipText4 = buildTooltipText(panoramaSceneText('toolbar.scale'), 'panorama-scene-tool-scale');
      ((el39.dataset.tooltip = tooltipText4), el39.setAttribute('aria-label', tooltipText4));
    }
    const el40 = this._cornerToolbarEl.querySelector('.act-environment-toggle');
    if (el40) {
      const value140 =
        this._sceneState.environmentMode === 'day'
          ? panoramaSceneText('toolbar.switchToNight')
          : panoramaSceneText('toolbar.switchToDay');
      ((el40.dataset.tooltip = value140),
        el40.setAttribute('aria-label', value140),
        (el40.hidden = false),
        el40.setAttribute('aria-hidden', 'false'));
    }
    const el41 = this._sceneToolbarEl.querySelector('.act-upload-panorama');
    if (el41) {
      const enabled21 = this._supportsPanoramaUpload();
      ((el41.hidden = !enabled21), el41.setAttribute('aria-hidden', enabled21 ? 'false' : 'true'));
    }
    const el42 = this._bottomToolbarEl.querySelector('.act-cube');
    if (el42) {
      const enabled22 = this._supportsCubeCreation();
      ((el42.hidden = !enabled22), el42.setAttribute('aria-hidden', enabled22 ? 'false' : 'true'));
    }
    const el43 = this._bottomToolbarEl.querySelector('.act-mannequin-entry');
    if (el43) {
      const enabled23 = this._supportsCubeCreation();
      ((el43.hidden = !enabled23),
        el43.setAttribute('aria-hidden', enabled23 ? 'false' : 'true'),
        (el43.disabled = !enabled23),
        !enabled23 && this._openMenuKey === 'mannequin' && (this._openMenuKey = null));
    }
    const el44 = this._bottomToolbarEl.querySelector('.act-grid');
    if (el44) {
      const enabled24 = this._supportsCubeCreation();
      ((el44.hidden = !enabled24),
        el44.setAttribute('aria-hidden', enabled24 ? 'false' : 'true'),
        (el44.disabled = !enabled24));
      const panoramaSceneText2 = panoramaSceneText('toolbar.grid');
      ((el44.dataset.tooltip = panoramaSceneText2),
        el44.setAttribute('aria-label', panoramaSceneText2),
        !enabled24 && this._openMenuKey === 'grid' && (this._openMenuKey = null));
    }
    const el45 = this._bottomToolbarEl.querySelector('.act-camera');
    if (el45) {
      const enabled25 = this._supportsCameraFeatures(),
        value141 = this._sceneState.cameras.length >= 10;
      ((el45.hidden = !enabled25),
        el45.setAttribute('aria-hidden', enabled25 ? 'false' : 'true'),
        (el45.disabled = !enabled25),
        el45.classList.toggle('is-limit-reached', enabled25 && value141),
        el45.setAttribute('aria-disabled', !enabled25 || value141 ? 'true' : 'false'));
      const tooltipText5 = buildTooltipText(
        panoramaSceneText('toolbar.createCameraBookmark'),
        'panorama-scene-camera-create',
      );
      ((el45.dataset.tooltip = tooltipText5),
        el45.setAttribute('aria-label', tooltipText5),
        !enabled25 && this._openMenuKey === 'camera' && (this._openMenuKey = null));
    }
    const el46 = this._bottomToolbarEl.querySelector('.act-focus');
    if (el46) {
      const enabled26 = !this._isPanorama360 && this._sceneState?.mode === 'scene';
      ((el46.hidden = !enabled26),
        el46.setAttribute('aria-hidden', enabled26 ? 'false' : 'true'),
        (el46.disabled = !enabled26));
      const panoramaSceneText3 = panoramaSceneText('toolbar.focus');
      ((el46.dataset.tooltip = panoramaSceneText3),
        el46.setAttribute('aria-label', panoramaSceneText3),
        !enabled26 && this._openMenuKey === 'focus' && (this._openMenuKey = null));
    }
    const el47 = this._bottomToolbarEl.querySelector('.act-reset-view');
    if (el47) {
      const tooltipText6 = buildTooltipText(
        panoramaSceneText('toolbar.resetView'),
        'panorama-scene-reset-view',
      );
      ((el47.dataset.tooltip = tooltipText6), el47.setAttribute('aria-label', tooltipText6));
    }
    const el48 = this._bottomToolbarEl.querySelector('.act-capture');
    if (el48) {
      const captureModeMeta2 = getCaptureModeMeta(this._resolveCaptureMode()),
        tooltipText7 = buildTooltipText(
          panoramaSceneText('toolbar.captureWithMode', { mode: getCaptureModeLabel(captureModeMeta2) }),
          'panorama-scene-capture',
        );
      ((el48.dataset.tooltip = tooltipText7), el48.setAttribute('aria-label', tooltipText7));
    }
    this._syncCaptureMenuState();
    const list13 = [
      this._sceneToolbarEl?.querySelector('.act-collapse-node'),
      this._editToolbarEl?.querySelector('.act-collapse-node'),
    ].filter(Boolean);
    list13.forEach((el49) => {
      const value142 = this._data?.isCollapsed === true,
        value143 = value142 ? panoramaSceneText('toolbar.expand') : panoramaSceneText('toolbar.collapse');
      ((el49.dataset.tooltip = value143),
        el49.setAttribute('aria-label', value143),
        el49.classList.toggle('is-collapsed', value142));
    });
    const list14 = this.el?.querySelectorAll?.('.act-fullscreen') || [];
    if (list14.length > 0) {
      const value144 = this._isBrowserFullscreen(),
        value145 = value144
          ? panoramaSceneText('toolbar.exitFullscreen')
          : panoramaSceneText('toolbar.fullscreen');
      list14.forEach((el50) => {
        ((el50.dataset.tooltip = value145),
          el50.setAttribute('aria-label', value145),
          el50.classList.toggle('active', value144));
      });
    }
  }
  ['_syncHintAndStatus']() {
    const enabled27 = this._isEditing(),
      value146 = this._sceneState.selection,
      value147 = this._resolveMouseTool();
    if (enabled27) {
      const selection = value146.selectedObjectId
          ? value146.selectedObjectType === 'camera'
            ? panoramaSceneText('status.cameraSelected')
            : panoramaSceneText('status.objectSelected')
          : panoramaSceneText('status.noObjectSelected'),
        mode3 = this._supportsPanoramaUpload()
          ? panoramaSceneText('status.panoramaMode')
          : panoramaSceneText('status.sceneMode');
      this._statusContentEl.textContent = panoramaSceneText('status.editing', {
        mode: mode3,
        selection: selection,
      });
    } else
      this._data?.isCollapsed
        ? (this._statusContentEl.textContent = panoramaSceneText('status.collapsed'))
        : (this._statusContentEl.textContent = panoramaSceneText('status.normalNode'));
    const enabled28 = this._sceneState.panorama.error || this._sceneState.capture.error || '';
    ((this._errorEl.textContent = enabled28), this._errorEl.classList.toggle('is-visible', !!enabled28));
    if (this._data?.isCollapsed) this._hintContentEl.textContent = panoramaSceneText('hint.doubleClickEdit');
    else {
      if (!enabled27)
        this._hintContentEl.textContent = this._supportsPanoramaUpload()
          ? panoramaSceneText('hint.clickEditPanorama')
          : panoramaSceneText('hint.clickEditScene');
      else {
        if (this._supportsPanoramaUpload() || this._sceneState.mode === 'panorama')
          this._hintContentEl.textContent = panoramaSceneText('hint.panoramaControls');
        else
          value147 === 'box-select'
            ? (this._hintContentEl.textContent = panoramaSceneText('hint.boxSelect'))
            : (this._hintContentEl.textContent = panoramaSceneText('hint.defaultMouse'));
      }
    }
  }
  ['_positionMenus']() {
    if (!this._bottomToolbarPopoverLayerEl || !this._bottomToolbarEl) return;
    if (this._bottomToolbarEl.offsetWidth <= 0 || this._bottomToolbarEl.offsetHeight <= 0) return;
    const run6 = (y2) => {
        if (!(y2 instanceof HTMLElement)) return null;
        const count6 = y2.offsetWidth || 0,
          count7 = y2.offsetHeight || 0;
        if (count6 <= 0 || count7 <= 0) return null;
        return { x: (y2.offsetLeft || 0) + count6 / 2, y: y2.offsetTop || 0 };
      },
      box13 = run6(this._bottomToolbarEl.querySelector('.act-mannequin-entry'));
    box13 &&
      ((this._mannequinMenuEl.style.left = box13.x + 'px'),
      (this._mannequinMenuEl.style.top = box13.y + 'px'));
    const box14 = run6(this._bottomToolbarEl.querySelector('.act-grid'));
    box14 &&
      ((this._gridPanelEl.style.left = box14.x + 'px'), (this._gridPanelEl.style.top = box14.y + 'px'));
    const box15 = run6(this._bottomToolbarEl.querySelector('.act-capture'));
    box15 &&
      ((this._captureMenuEl.style.left = box15.x + 'px'), (this._captureMenuEl.style.top = box15.y + 'px'));
    const box16 = run6(this._bottomToolbarEl.querySelector('.act-focus'));
    box16 &&
      ((this._focusMenuEl.style.left = box16.x + 'px'), (this._focusMenuEl.style.top = box16.y + 'px'));
    const box17 = run6(this._bottomToolbarEl.querySelector('.act-camera'));
    box17 &&
      ((this._cameraListEl.style.left = box17.x + 'px'), (this._cameraListEl.style.top = box17.y + 'px'));
  }
  ['_syncOverlayState']() {
    const enabled29 = this._isEditing(),
      enabled30 = this._data?.isCollapsed === true,
      value148 = this._isNodeSelected(),
      enabled31 = !enabled29,
      enabled32 = enabled29 && !enabled30 && value148,
      enabled33 = enabled32,
      enabled34 = enabled32;
    (this.el.classList.toggle('is-editing', enabled29),
      this.el.classList.toggle('is-collapsed', enabled30),
      this.el.classList.toggle('is-panorama-mode', this._sceneState.mode === 'panorama'));
    const value149 = this._sceneState?.environmentMode === 'day' ? 'day' : 'night';
    ((this.el.dataset.panoramaEnv = value149),
      (this._viewportEl.dataset.envMode = value149),
      (this._viewportEl.dataset.sceneType = this._sceneState?.type || ''),
      this._sceneToolbarEl.classList.toggle('is-hidden', !enabled31),
      this._sceneToolbarEl.classList.remove('is-node-collapsed'),
      this._editToolbarEl.classList.toggle('is-hidden', !enabled32),
      this._editToolbarEl.classList.remove('is-node-collapsed'),
      this._cornerToolbarEl.classList.toggle('is-hidden', !enabled34),
      this._cornerToolbarEl.classList.toggle('is-collapsed-state', enabled30),
      this._bottomToolbarEl.classList.toggle('is-hidden', !enabled33),
      (this._statusEl.style.transform = 'none'),
      (this._hintEl.style.transform = 'none'));
    !enabled32 && this._closeObjectContextMenu();
    const enabled35 =
        enabled32 &&
        this._supportsCameraFeatures() &&
        this._sceneState.cameras.length > 0 &&
        this._openMenuKey === 'camera',
      enabled36 =
        enabled32 &&
        !this._isPanorama360 &&
        this._sceneState?.mode === 'scene' &&
        this._openMenuKey === 'focus',
      enabled37 = enabled32 && this._openMenuKey === 'capture',
      enabled38 = enabled32 && this._supportsCubeCreation() && this._openMenuKey === 'grid',
      enabled39 = enabled32 && this._supportsCubeCreation() && this._openMenuKey === 'mannequin';
    (this._captureMenuEl.classList.toggle('is-visible', enabled37),
      this._cameraListEl.classList.toggle('is-visible', enabled35),
      this._focusMenuEl.classList.toggle('is-visible', enabled36),
      this._gridPanelEl.classList.toggle('is-visible', enabled38),
      this._mannequinMenuEl.classList.toggle('is-visible', enabled39),
      (this._captureMenuEl.hidden = !enabled37),
      (this._cameraListEl.hidden = !enabled35),
      (this._focusMenuEl.hidden = !enabled36),
      (this._gridPanelEl.hidden = !enabled38),
      (this._mannequinMenuEl.hidden = !enabled39));
    enabled36 && this._focusMenuEl?._syncValue?.();
    (this._statusEl.classList.toggle('is-visible', true),
      this._hintEl.classList.toggle('is-visible', true),
      this._syncAttachedUiVisibility(enabled33),
      this._syncCaptureSafeFrame());
    const el51 = this._bottomToolbarEl?.querySelector('.act-focus');
    if (el51) {
      const value150 = enabled36 ? '' : panoramaSceneText('toolbar.focus');
      (value150 ? (el51.dataset.tooltip = value150) : el51.removeAttribute('data-tooltip'),
        el51.setAttribute('aria-label', panoramaSceneText('toolbar.focus')));
    }
    this._positionMenus();
  }
  ['update'](value151) {
    const enabled40 = this._sceneState;
    ((this._data = value151),
      (this._isPanorama360 = String(value151?.type || '').trim() === PANORAMA_360_NODE_TYPE),
      this.el.classList.toggle('is-panorama-360', this._isPanorama360),
      (this._sceneState = getPanoramaSceneState(value151)),
      !this._sceneState.ui.isEditing && (this._openMenuKey = null),
      this._maybePreloadCharacterModels(enabled40),
      !this._isPanorama360 &&
      this._sceneState?.mode === 'scene' &&
      (!enabled40 ||
        (!this._isDefaultSceneView(enabled40?.viewport?.sceneView) &&
          this._isDefaultSceneView(this._sceneState?.viewport?.sceneView)))
        ? this._setDefaultSceneFocalLength(SCENE_DEFAULT_FOCAL_LENGTH_MM)
        : this._bridge?.setDefaultSceneFocalLength?.(this._defaultSceneFocalLength),
      this._syncToolbarState(),
      this._syncGridPanelValues(),
      renderMannequinQuickMenu(this._mannequinMenuEl, this._sceneState),
      this._renderCameraPresetList(),
      this._syncHintAndStatus(),
      this._syncCaptureMenuState(),
      this._syncOverlayState(),
      this._bridge?.sync?.(this._sceneState),
      this._maybeReleasePendingCameraJumpDraft());
  }
  ['unmount']() {
    ((this._isUnmounted = true),
      clearTimeout(this._menuHideTimer),
      this._fileInput?.removeEventListener('change', this._handleFileInputChange),
      this._viewportEl?.removeEventListener('pointerdown', this._handleViewportPointerDown),
      this._viewportEl?.removeEventListener('contextmenu', this._handleViewportContextMenu),
      this._viewportEl?.removeEventListener('dblclick', this._handleViewportDoubleClick),
      this._viewportEl?.removeEventListener('keydown', this._handleKeyDown),
      this.el?.removeEventListener('pointerenter', this._handleNodePointerEnter),
      this.el?.removeEventListener('pointerleave', this._handleNodePointerLeave),
      this._sceneToolbarEl?.removeEventListener('click', this._handleToolbarClick),
      this._editToolbarEl?.removeEventListener('click', this._handleToolbarClick),
      this._cornerToolbarEl?.removeEventListener('click', this._handleToolbarClick),
      this._bottomToolbarEl?.removeEventListener('click', this._handleToolbarClick),
      this._bottomToolbarEl?.removeEventListener('pointerover', this._handleBottomToolbarPointerEnter),
      this._bottomToolbarEl?.removeEventListener('pointerout', this._handleBottomToolbarPointerLeave),
      this._captureMenuEl?.removeEventListener('click', this._handleCaptureMenuClick),
      this._unsubscribeSelection?.(),
      (this._unsubscribeSelection = null),
      this._unsubscribeViewport?.(),
      (this._unsubscribeViewport = null),
      this._unsubscribePanoramaIncomingSync?.(),
      (this._unsubscribePanoramaIncomingSync = null),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      window.removeEventListener('resize', this._handleWindowResize),
      window.removeEventListener('pointerdown', this._handleGlobalPointerDown, true),
      window.removeEventListener('keydown', this._handleWindowKeyDown, true),
      window.removeEventListener('shortcuts-updated', this._handleShortcutsUpdated),
      window.removeEventListener('panorama-scene:camera-shortcut', this._handleCameraShortcutEvent),
      window.removeEventListener('panorama-scene:capture-shortcut', this._handleCaptureShortcutEvent),
      void this._exitBrowserFullscreen({ skipSync: true }),
      this._cameraJumpRaf && (cancelAnimationFrame(this._cameraJumpRaf), (this._cameraJumpRaf = 0)),
      this._pendingCameraJumpReleaseRaf &&
        (cancelAnimationFrame(this._pendingCameraJumpReleaseRaf), (this._pendingCameraJumpReleaseRaf = 0)),
      (this._pendingCameraJumpCommit = null),
      this._resizeObserver?.disconnect(),
      this._interaction?.detach?.(),
      this._bridge?.dispose?.());
  }
}
