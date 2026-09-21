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
function panoramaSceneText(_0x260c71, _0x2ed816 = {}) {
  return t('panoramaSceneNode.' + _0x260c71, _0x2ed816);
}
function isPanorama360ImageSourceType(_0x4a2720) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(_0x4a2720 || '').trim());
}
function createElementFromHtml(_0xf5e832) {
  const _0x4ea919 = document.createElement('template');
  return ((_0x4ea919.innerHTML = _0xf5e832.trim()), _0x4ea919.content.firstElementChild);
}
function attachUiStop(_0x160525, { wheel: wheel = false } = {}) {
  if (!_0x160525) return;
  ((_0x160525.dataset.uiStop = '1'),
    _0x160525.addEventListener('pointerdown', (_0x4f32cc) => _0x4f32cc.stopPropagation()),
    wheel &&
      _0x160525.addEventListener(
        'wheel',
        (_0x505112) => {
          _0x505112.stopPropagation();
        },
        { passive: false },
      ));
}
function getShortcutLabel(_0x58ac24) {
  const _0x40ef34 = getShortcuts()?.[_0x58ac24],
    _0x3fa6c5 = Array.isArray(_0x40ef34?.keys) ? _0x40ef34.keys.filter(Boolean) : [];
  return _0x3fa6c5.length > 0 ? '[' + _0x3fa6c5.join('+') + ']' : '';
}
function buildTooltipText(_0x487535, _0x3dd5da) {
  const _0x14ba69 = getShortcutLabel(_0x3dd5da);
  return _0x14ba69 ? _0x487535 + ' ' + _0x14ba69 : _0x487535;
}
function normalizeCameraSlot(_0x1bb732) {
  const _0x25529c = Number(_0x1bb732);
  if (!Number.isInteger(_0x25529c)) return null;
  if (_0x25529c < 1 || _0x25529c > 10) return null;
  return _0x25529c;
}
function resolveCameraSlotEntries(_0x58b503 = []) {
  const _0x3f66aa = Array.isArray(_0x58b503) ? _0x58b503 : [],
    _0x255eb5 = new Set(),
    _0x350fdb = [];
  return (
    _0x3f66aa.forEach((_0x70f70d) => {
      const _0x5991d0 = normalizeCameraSlot(_0x70f70d?.slot);
      if (!_0x5991d0 || _0x255eb5.has(_0x5991d0)) return;
      (_0x255eb5.add(_0x5991d0), _0x350fdb.push({ camera: _0x70f70d, slot: _0x5991d0 }));
    }),
    _0x3f66aa.forEach((_0x1338d8) => {
      if (_0x350fdb.some((_0xabfd34) => _0xabfd34.camera?.id === _0x1338d8?.id)) return;
      for (let _0x2acf14 = 1; _0x2acf14 <= 10; _0x2acf14 += 1) {
        if (_0x255eb5.has(_0x2acf14)) continue;
        (_0x255eb5.add(_0x2acf14), _0x350fdb.push({ camera: _0x1338d8, slot: _0x2acf14 }));
        break;
      }
    }),
    _0x350fdb.sort((_0x52ab00, _0x70c26f) => _0x52ab00.slot - _0x70c26f.slot)
  );
}
function lerp(_0x15e7fc, _0x5b2579, _0x1121d6) {
  return _0x15e7fc + (_0x5b2579 - _0x15e7fc) * _0x1121d6;
}
function smootherstep(_0x370905) {
  const _0x556898 = Math.max(0, Math.min(1, Number(_0x370905) || 0));
  return _0x556898 * _0x556898 * _0x556898 * (_0x556898 * (_0x556898 * 6 - 15) + 10);
}
function interpolateVector3(_0x334e27, _0x3be61a, _0x4d64b7) {
  return {
    x: lerp(Number(_0x334e27?.x) || 0, Number(_0x3be61a?.x) || 0, _0x4d64b7),
    y: lerp(Number(_0x334e27?.y) || 0, Number(_0x3be61a?.y) || 0, _0x4d64b7),
    z: lerp(Number(_0x334e27?.z) || 0, Number(_0x3be61a?.z) || 0, _0x4d64b7),
  };
}
function cloneVector3(_0x143d5b) {
  return interpolateVector3(_0x143d5b, _0x143d5b, 1);
}
function quaternionToRotation(_0x2bcfac) {
  const _0x237a77 = _0x2bcfac?.clone?.() || new threeRuntime['Quaternion'](),
    _0x52d8a2 = new threeRuntime['Euler'](0, 0, 0, 'YXZ').setFromQuaternion(_0x237a77, 'YXZ');
  return { x: _0x52d8a2.x, y: _0x52d8a2.y, z: _0x52d8a2.z };
}
function areSceneViewsEquivalent(_0x3bbe9b, _0xce05e6, _0x205169 = 0.00001) {
  if (!_0x3bbe9b || !_0xce05e6) return false;
  return (
    Math.abs((Number(_0x3bbe9b?.target?.x) || 0) - (Number(_0xce05e6?.target?.x) || 0)) <= _0x205169 &&
    Math.abs((Number(_0x3bbe9b?.target?.y) || 0) - (Number(_0xce05e6?.target?.y) || 0)) <= _0x205169 &&
    Math.abs((Number(_0x3bbe9b?.target?.z) || 0) - (Number(_0xce05e6?.target?.z) || 0)) <= _0x205169 &&
    Math.abs((Number(_0x3bbe9b?.orbitYaw) || 0) - (Number(_0xce05e6?.orbitYaw) || 0)) <= _0x205169 &&
    Math.abs((Number(_0x3bbe9b?.orbitPitch) || 0) - (Number(_0xce05e6?.orbitPitch) || 0)) <= _0x205169 &&
    Math.abs((Number(_0x3bbe9b?.orbitDistance) || 0) - (Number(_0xce05e6?.orbitDistance) || 0)) <= _0x205169
  );
}
const PANORAMA_CAPTURE_MODE_OPTIONS = [
  { key: 'adaptive', labelKey: 'adaptive', iconClass: 'is-adaptive' },
  { key: '9:16', labelKey: 'vertical', ratio: 9 / 16, iconClass: 'is-9-16' },
  { key: '2.35:1', labelKey: 'cinema', ratio: 2.35, iconClass: 'is-2-35-1' },
];
function normalizeCaptureMode(_0x3d14eb) {
  return PANORAMA_CAPTURE_MODE_OPTIONS.some((_0xf3adf1) => _0xf3adf1.key === _0x3d14eb)
    ? _0x3d14eb
    : 'adaptive';
}
function getCaptureModeMeta(_0xc04fe5) {
  const _0x577099 = normalizeCaptureMode(_0xc04fe5);
  return (
    PANORAMA_CAPTURE_MODE_OPTIONS.find((_0x2f5dce) => _0x2f5dce.key === _0x577099) ||
    PANORAMA_CAPTURE_MODE_OPTIONS[0]
  );
}
function getCaptureModeLabel(_0x373191) {
  const _0x12db34 = typeof _0x373191 === 'string' ? getCaptureModeMeta(_0x373191) : _0x373191,
    _0x1ebeef = String(_0x12db34?.labelKey || '').trim();
  return _0x1ebeef ? panoramaSceneText('capture.modes.' + _0x1ebeef) : String(_0x12db34?.key || '');
}
function computeCaptureFrameRect(_0x19c8d1, _0x4a2d15, _0x126a62) {
  const _0x4ff0c1 = Math.max(0, Number(_0x19c8d1) || 0),
    _0x505e62 = Math.max(0, Number(_0x4a2d15) || 0);
  if (_0x4ff0c1 <= 0 || _0x505e62 <= 0) return { x: 0, y: 0, width: 0, height: 0 };
  const _0x509187 = normalizeCaptureMode(_0x126a62);
  if (_0x509187 === 'adaptive') return { x: 0, y: 0, width: _0x4ff0c1, height: _0x505e62 };
  const _0xa0e4c6 = getCaptureModeMeta(_0x509187).ratio;
  if (!(_0xa0e4c6 > 0)) return { x: 0, y: 0, width: _0x4ff0c1, height: _0x505e62 };
  const _0x3a5786 = _0x4ff0c1 / _0x505e62;
  if (_0x3a5786 >= _0xa0e4c6) {
    const _0x5a099d = _0x505e62 * _0xa0e4c6;
    return { x: (_0x4ff0c1 - _0x5a099d) / 2, y: 0, width: _0x5a099d, height: _0x505e62 };
  }
  const _0x258b98 = _0x4ff0c1 / _0xa0e4c6;
  return { x: 0, y: (_0x505e62 - _0x258b98) / 2, width: _0x4ff0c1, height: _0x258b98 };
}
export function resolveNextPanoramaMouseTool(_0x3eb601) {
  return String(_0x3eb601 || '').trim() === 'box-select' ? 'navigate' : 'box-select';
}
function resolvePanoramaSceneHistoryShortcutAction(_0x2e8ee1) {
  const _0x3ff1b6 = _0x2e8ee1?.ctrlKey === true || _0x2e8ee1?.metaKey === true;
  if (!_0x3ff1b6 || _0x2e8ee1?.altKey === true) return null;
  const _0x1a6286 = String(_0x2e8ee1?.key || '')
    .trim()
    .toLowerCase();
  if (_0x1a6286 === 'z') return _0x2e8ee1?.shiftKey === true ? 'redo' : 'undo';
  return null;
}
async function decodeImageBlob(_0x24df26) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(_0x24df26);
  const _0x3ffb28 = await new Promise((_0x368866, _0x1d68d0) => {
    const _0x1f8f7e = URL.createObjectURL(_0x24df26),
      _0x28e7e6 = new Image();
    ((_0x28e7e6.onload = () => {
      (URL.revokeObjectURL(_0x1f8f7e), _0x368866(_0x28e7e6));
    }),
      (_0x28e7e6.onerror = (_0x1f92a1) => {
        (URL.revokeObjectURL(_0x1f8f7e), _0x1d68d0(_0x1f92a1));
      }),
      (_0x28e7e6.src = _0x1f8f7e));
  });
  return _0x3ffb28;
}
function closeDecodedImage(_0xcfd089) {
  _0xcfd089 && typeof _0xcfd089.close === 'function' && _0xcfd089.close();
}
async function canvasToPngBlob(_0x2e6d6c) {
  return new Promise((_0x3ee0f6, _0x295118) => {
    _0x2e6d6c.toBlob((_0x4e710d) => {
      if (_0x4e710d) {
        _0x3ee0f6(_0x4e710d);
        return;
      }
      _0x295118(new Error(panoramaSceneText('errors.captureCropFailed')));
    }, 'image/png');
  });
}
async function cropCaptureBlobToFrame({
  blob: _0x4d15ff,
  viewportWidth: _0x57cf61,
  viewportHeight: _0x3b50d9,
  mode: _0x54c5bc,
}) {
  if (!(_0x4d15ff instanceof Blob)) return null;
  const _0x21e437 = normalizeCaptureMode(_0x54c5bc);
  if (_0x21e437 === 'adaptive') return _0x4d15ff;
  const _0x4d439f = computeCaptureFrameRect(_0x57cf61, _0x3b50d9, _0x21e437);
  if (_0x4d439f.width <= 0 || _0x4d439f.height <= 0) return _0x4d15ff;
  const _0x113046 = await decodeImageBlob(_0x4d15ff);
  try {
    const _0x2940c6 = Number(_0x113046.width) || Number(_0x113046.videoWidth) || 0,
      _0x913b44 = Number(_0x113046.height) || Number(_0x113046.videoHeight) || 0;
    if (_0x2940c6 <= 0 || _0x913b44 <= 0) return _0x4d15ff;
    const _0x5e3028 = _0x2940c6 / Math.max(1, _0x57cf61),
      _0x2e554d = _0x913b44 / Math.max(1, _0x3b50d9),
      _0x2cafac = Math.max(0, Math.round(_0x4d439f.x * _0x5e3028)),
      _0x5e00b9 = Math.max(0, Math.round(_0x4d439f.y * _0x2e554d)),
      _0x10ac14 = Math.min(_0x2940c6 - _0x2cafac, Math.max(1, Math.round(_0x4d439f.width * _0x5e3028))),
      _0x1b36b0 = Math.min(_0x913b44 - _0x5e00b9, Math.max(1, Math.round(_0x4d439f.height * _0x2e554d))),
      _0x19a99f = document.createElement('canvas');
    ((_0x19a99f.width = _0x10ac14), (_0x19a99f.height = _0x1b36b0));
    const _0x20765e = _0x19a99f.getContext('2d');
    if (!_0x20765e) throw new Error(panoramaSceneText('errors.captureCropFailed'));
    return (
      _0x20765e.drawImage(_0x113046, _0x2cafac, _0x5e00b9, _0x10ac14, _0x1b36b0, 0, 0, _0x10ac14, _0x1b36b0),
      canvasToPngBlob(_0x19a99f)
    );
  } finally {
    closeDecodedImage(_0x113046);
  }
}
export class PanoramaSceneNode {
  constructor(_0x54dd85) {
    ((this._data = _0x54dd85),
      (this.id = _0x54dd85.id),
      (this._isPanorama360 = String(_0x54dd85?.type || '').trim() === PANORAMA_360_NODE_TYPE),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component panorama-scene-component'),
      this.el.classList.toggle('is-panorama-360', this._isPanorama360),
      (this._sceneState = getPanoramaSceneState(_0x54dd85)),
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
    const _0x1b350e = this._isPanorama360 ? PANORAMA_360_MODE_TOOLBAR_HTML : PANORAMA_SCENE_MODE_TOOLBAR_HTML;
    return (
      (this._editToolbarEl = createElementFromHtml(_0x1b350e)),
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
        onSelectGender: ({ gender: _0x4452bc }) => {
          setPanoramaSceneGridPlacement({
            nodeId: this.id,
            patch: { gender: _0x4452bc === 'female' ? 'female' : 'male' },
          });
        },
        onSelectColor: ({ colorKey: _0x87587c, gender: _0x164820 }) => {
          const _0x3d3a9c = _0x164820 === 'female' ? 'female' : 'male';
          (this._selectNodeOnCanvas(),
            setPanoramaSceneGridPlacement({
              nodeId: this.id,
              patch: { colorKey: _0x87587c, gender: _0x3d3a9c },
            }),
            addPanoramaSceneMannequin({
              nodeId: this.id,
              gender: _0x3d3a9c,
              colorKey: _0x87587c,
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
        onPanoramaStatusChange: ({ isLoaded: _0x5a33c4, error: _0x164396 }) => {
          updatePanoramaSceneLoadState({ nodeId: this.id, isLoaded: _0x5a33c4, error: _0x164396 });
        },
      })),
      this._bridge.setDefaultSceneFocalLength?.(this._defaultSceneFocalLength),
      (this._interaction = new PanoramaSceneInteraction({
        viewportEl: this._viewportEl,
        overlayEl: this._overlayEl,
        bridge: this._bridge,
        getSceneState: () => getPanoramaSceneState(appStore.getStateRaw().nodes[this.id]),
        onViewCommit: (_0x3c59e5) => {
          applyPanoramaSceneViewCommit({ nodeId: this.id, ..._0x3c59e5 });
        },
        onObjectCommit: ({ objectType: _0x5da002, objectId: _0x19f6dd, pose: _0x2a8ec8 }) => {
          updatePanoramaSceneObjectTransform({
            nodeId: this.id,
            objectType: _0x5da002,
            objectId: _0x19f6dd,
            pose: _0x2a8ec8,
          });
        },
        onSelectionChange: (_0x34f64a, _0x221230) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelection({ nodeId: this.id, objectType: _0x34f64a, objectId: _0x221230 }));
        },
        onSelectionBatchChange: (_0x2d4313, _0x58c480, _0x13e5b0 = null) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelectionBatch({
              nodeId: this.id,
              objectType: _0x2d4313,
              objectIds: _0x58c480,
              groupId: _0x13e5b0,
            }));
        },
        onSelectionObjectsChange: (_0x1acff2, _0x24a1b = {}) => {
          (this._selectNodeOnCanvas(),
            setPanoramaSceneSelectionObjects({
              nodeId: this.id,
              objects: _0x1acff2,
              activeObjectType: _0x24a1b.activeObjectType || null,
              activeObjectId: _0x24a1b.activeObjectId || null,
              groupId: _0x24a1b.groupId || null,
            }));
        },
        onSelectionClear: () => {
          clearPanoramaSceneSelection({ nodeId: this.id });
        },
        onObjectBatchCommit: ({ targets: _0x4a45de }) => {
          updatePanoramaSceneObjectTransform({ nodeId: this.id, targets: _0x4a45de });
        },
      })),
      this._interaction.attach(),
      (this._resizeObserver = new ResizeObserver((_0x200d4a) => {
        const _0x1d9354 = _0x200d4a?.[0]?.contentRect;
        (this._bridge?.resize(_0x1d9354?.width, _0x1d9354?.height), this._positionMenus());
      })),
      this._resizeObserver.observe(this._viewportEl),
      (this._unsubscribeSelection = appStore.subscribeSelector(
        (_0x4cc8b) => {
          const _0x22c1f5 = Array.isArray(_0x4cc8b.selectedNodeIds) ? _0x4cc8b.selectedNodeIds : [];
          return _0x22c1f5.includes(this.id);
        },
        (_0x111e35) => {
          const _0x40777a = this._isSelected === true,
            _0x5d8d5e = _0x111e35 === true;
          ((this._isSelected = _0x5d8d5e),
            _0x40777a && !_0x5d8d5e && this._sceneState?.ui?.isEditing === true && this._exitEditing(),
            this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
        },
      )),
      (this._unsubscribeViewport = appStore.subscribeSelector(
        (_0x341dd7) => {
          const _0x387fe8 = _0x341dd7.viewport || { x: 0, y: 0, zoom: 1 };
          return (_0x387fe8.x || 0) + '|' + (_0x387fe8.y || 0) + '|' + (_0x387fe8.zoom || 1);
        },
        () => {
          this._positionMenus();
        },
      )),
      this._isPanorama360 &&
        (this._unsubscribePanoramaIncomingSync = appStore.subscribeSelector(
          (_0x2920cf) => this._buildPanorama360IncomingImageSignature(_0x2920cf),
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
  ['_resolveCameraBySlot'](_0x595312) {
    const _0x3b2a89 = normalizeCameraSlot(_0x595312);
    if (!_0x3b2a89) return null;
    const _0x2f6677 = resolveCameraSlotEntries(this._sceneState?.cameras || []),
      _0x491a51 = _0x2f6677.find((_0x2392f7) => _0x2392f7.slot === _0x3b2a89);
    return _0x491a51 ? { ..._0x491a51 } : null;
  }
  ['_cancelCameraJumpAnimation']({ clearDraft: clearDraft = true } = {}) {
    ((this._cameraJumpToken += 1),
      this._cameraJumpRaf && (cancelAnimationFrame(this._cameraJumpRaf), (this._cameraJumpRaf = 0)),
      this._pendingCameraJumpReleaseRaf &&
        (cancelAnimationFrame(this._pendingCameraJumpReleaseRaf), (this._pendingCameraJumpReleaseRaf = 0)),
      (this._pendingCameraJumpCommit = null),
      clearDraft && this._bridge?.clearDraftView?.());
  }
  ['_setDefaultSceneFocalLength'](_0x4d0a27) {
    const _0x1e48b3 = Math.max(
      SCENE_FOCAL_LENGTH_MIN_MM,
      Math.min(SCENE_FOCAL_LENGTH_MAX_MM, Number(_0x4d0a27) || SCENE_DEFAULT_FOCAL_LENGTH_MM),
    );
    ((this._defaultSceneFocalLength = _0x1e48b3), this._bridge?.setDefaultSceneFocalLength?.(_0x1e48b3));
  }
  ['_getDefaultSceneFocalLength']() {
    return (
      this._bridge?.getDefaultSceneFocalLength?.() ||
      this._defaultSceneFocalLength ||
      SCENE_DEFAULT_FOCAL_LENGTH_MM
    );
  }
  ['_isDefaultSceneView'](_0x116ff3) {
    const _0x1f3086 = createDefaultSceneView();
    return (
      Math.abs((Number(_0x116ff3?.target?.x) || 0) - _0x1f3086.target.x) < 1e-9 &&
      Math.abs((Number(_0x116ff3?.target?.y) || 0) - _0x1f3086.target.y) < 1e-9 &&
      Math.abs((Number(_0x116ff3?.target?.z) || 0) - _0x1f3086.target.z) < 1e-9 &&
      Math.abs((Number(_0x116ff3?.orbitYaw) || 0) - _0x1f3086.orbitYaw) < 1e-9 &&
      Math.abs((Number(_0x116ff3?.orbitPitch) || 0) - _0x1f3086.orbitPitch) < 1e-9 &&
      Math.abs((Number(_0x116ff3?.orbitDistance) || 0) - _0x1f3086.orbitDistance) < 1e-9
    );
  }
  ['_maybeReleasePendingCameraJumpDraft']() {
    const _0x453127 = this._pendingCameraJumpCommit;
    if (!_0x453127 || this._pendingCameraJumpReleaseRaf) return;
    const _0x3b43fb = this._sceneState?.viewport?.sceneView || null,
      _0x248e9c = this._getDefaultSceneFocalLength();
    if (!areSceneViewsEquivalent(_0x3b43fb, _0x453127.targetSceneView)) return;
    if (Math.abs(_0x248e9c - _0x453127.targetFocalLength) > 0.000001) return;
    const _0x5a68fe = _0x453127.token;
    this._pendingCameraJumpReleaseRaf = requestAnimationFrame(() => {
      this._pendingCameraJumpReleaseRaf = 0;
      const _0x37edac = this._pendingCameraJumpCommit;
      if (!_0x37edac || _0x37edac.token !== _0x5a68fe) return;
      const _0x11ddf5 = this._sceneState?.viewport?.sceneView || null,
        _0x68565d = this._getDefaultSceneFocalLength();
      if (!areSceneViewsEquivalent(_0x11ddf5, _0x37edac.targetSceneView)) return;
      if (Math.abs(_0x68565d - _0x37edac.targetFocalLength) > 0.000001) return;
      ((this._pendingCameraJumpCommit = null), this._bridge?.clearDraftView?.());
    });
  }
  ['_maybePreloadCharacterModels'](_0x1da0ce = null) {
    if (this._isPanorama360) return;
    if (this._hasRequestedCharacterPreload) return;
    const _0x4ba24e = this._sceneState?.ui?.isEditing === true,
      _0x3821c1 = _0x1da0ce?.ui?.isEditing === true;
    if (!_0x4ba24e || _0x3821c1) return;
    ((this._hasRequestedCharacterPreload = true), void preloadPanoramaCharacterModels().catch(() => {}));
  }
  ['_commitCameraJumpTarget']({
    targetPose: _0x5ae093,
    referenceSceneView: _0x12c58a,
    targetFocalLength: _0x55d669,
  }) {
    const _0x2887af = cameraPoseToSceneViewFromReference(_0x5ae093, _0x12c58a);
    return (
      (this._pendingCameraJumpCommit = {
        token: this._cameraJumpToken,
        targetSceneView: _0x2887af,
        targetFocalLength: _0x55d669,
      }),
      this._setDefaultSceneFocalLength(_0x55d669),
      applyPanoramaSceneViewCommit({
        nodeId: this.id,
        sceneView: _0x2887af,
        activeView: 'default',
        activeCameraId: null,
      }),
      _0x2887af
    );
  }
  ['_animateCameraActivation'](_0x3134d8) {
    if (!this._supportsCameraFeatures()) return;
    const _0x38e95b =
      (this._sceneState?.cameras || []).find((_0x3986df) => _0x3986df.id === _0x3134d8) || null;
    if (!_0x38e95b || this._sceneState?.mode !== 'scene') return;
    const _0x25f922 = (_0x494284) => {
        const _0x489ea3 = _0x494284?.quaternion;
        if (
          Number.isFinite(Number(_0x489ea3?.x)) &&
          Number.isFinite(Number(_0x489ea3?.y)) &&
          Number.isFinite(Number(_0x489ea3?.z)) &&
          Number.isFinite(Number(_0x489ea3?.w))
        )
          return new threeRuntime.Quaternion(
            Number(_0x489ea3.x),
            Number(_0x489ea3.y),
            Number(_0x489ea3.z),
            Number(_0x489ea3.w),
          ).normalize();
        const _0xcc68d5 = _0x494284?.rotation || { x: 0, y: 0, z: 0 };
        return new threeRuntime.Quaternion().setFromEuler(
          new threeRuntime['Euler'](
            Number(_0xcc68d5.x) || 0,
            Number(_0xcc68d5.y) || 0,
            Number(_0xcc68d5.z) || 0,
            'YXZ',
          ),
        );
      },
      _0x25d4d8 = _0x25f922(_0x38e95b),
      _0x37ef88 = this._sceneState?.viewport?.sceneView || createDefaultSceneView(),
      _0x5487b9 = {
        kind: 'camera',
        position: cloneVector3(_0x38e95b.position),
        quaternion: { x: _0x25d4d8.x, y: _0x25d4d8.y, z: _0x25d4d8.z, w: _0x25d4d8.w },
        rotation: _0x38e95b.rotation || quaternionToRotation(_0x25d4d8),
      },
      _0x3c5803 = Number.isFinite(Number(_0x38e95b?.focalLength))
        ? Number(_0x38e95b.focalLength)
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
      _0x11ebaf = focalLengthToFov(_0x3c5803);
    ((_0x5487b9.fov = _0x11ebaf), this._cancelCameraJumpAnimation({ clearDraft: false }));
    const _0x49558e = this._bridge?.readCurrentViewPose?.();
    if (!_0x49558e?.position) {
      this._commitCameraJumpTarget({
        targetPose: _0x5487b9,
        referenceSceneView: _0x37ef88,
        targetFocalLength: _0x3c5803,
      });
      return;
    }
    const _0x116de9 = this._cameraJumpToken,
      _0x49ce6d = _0x25f922(_0x49558e),
      _0x1422ad = {
        kind: 'camera',
        position: cloneVector3(_0x49558e.position),
        quaternion: { x: _0x49ce6d.x, y: _0x49ce6d.y, z: _0x49ce6d.z, w: _0x49ce6d.w },
        rotation: _0x49558e.rotation || quaternionToRotation(_0x49ce6d),
        fov: Number.isFinite(Number(_0x49558e.fov)) ? Number(_0x49558e.fov) : 58,
      },
      _0x5b73af = 0x1c2,
      _0x179ba6 = performance.now(),
      _0x330a1d = (_0x2f757f) => {
        const _0xbf7d2d = interpolateVector3(_0x1422ad.position, _0x5487b9.position, _0x2f757f),
          _0x59c189 = new threeRuntime.Quaternion(
            _0x1422ad.quaternion.x,
            _0x1422ad.quaternion.y,
            _0x1422ad.quaternion.z,
            _0x1422ad.quaternion.w,
          ).slerp(
            new threeRuntime['Quaternion'](
              _0x5487b9.quaternion.x,
              _0x5487b9.quaternion.y,
              _0x5487b9.quaternion.z,
              _0x5487b9.quaternion.w,
            ),
            _0x2f757f,
          ),
          _0x6ae2ba = lerp(_0x1422ad.fov, _0x5487b9.fov, _0x2f757f);
        this._bridge?.setDraftView?.({
          kind: 'camera',
          position: _0xbf7d2d,
          quaternion: { x: _0x59c189.x, y: _0x59c189.y, z: _0x59c189.z, w: _0x59c189.w },
          rotation: quaternionToRotation(_0x59c189),
          fov: _0x6ae2ba,
          disableSmoothing: true,
        });
      };
    _0x330a1d(0);
    const _0x4b10b5 = (_0x4fd0fc) => {
      if (_0x116de9 !== this._cameraJumpToken) return;
      const _0x5acb14 = Math.max(0, _0x4fd0fc - _0x179ba6),
        _0x935cf6 = Math.min(1, _0x5acb14 / _0x5b73af),
        _0x1c3190 = smootherstep(_0x935cf6);
      _0x330a1d(_0x1c3190);
      if (_0x935cf6 < 1) {
        this._cameraJumpRaf = requestAnimationFrame(_0x4b10b5);
        return;
      }
      ((this._cameraJumpRaf = 0),
        this._commitCameraJumpTarget({
          targetPose: _0x5487b9,
          referenceSceneView: _0x37ef88,
          targetFocalLength: _0x3c5803,
        }),
        this._maybeReleasePendingCameraJumpDraft());
    };
    this._cameraJumpRaf = requestAnimationFrame(_0x4b10b5);
  }
  ['_saveCurrentViewToCameraSlot'](_0x206e0a) {
    if (!this._supportsCameraFeatures()) return;
    const _0x445621 = this._bridge?.readCurrentViewPose?.();
    if (!_0x445621) return;
    upsertPanoramaSceneCameraAtSlot({ nodeId: this.id, slot: _0x206e0a, viewPose: _0x445621 });
  }
  ['_handleCameraShortcutEvent'](_0x59c1b1) {
    if (!this._supportsCameraFeatures()) return;
    const _0x16396b = _0x59c1b1?.detail || {};
    if (_0x16396b.nodeId !== this.id) return;
    if (!this._isEditing()) return;
    const _0x5a1181 = normalizeCameraSlot(_0x16396b.slot);
    if (!_0x5a1181) return;
    if (_0x16396b.mode === 'save') {
      this._saveCurrentViewToCameraSlot(_0x5a1181);
      return;
    }
    const _0x4b8ec1 = this._resolveCameraBySlot(_0x5a1181);
    if (!_0x4b8ec1?.camera?.id) return;
    this._animateCameraActivation(_0x4b8ec1.camera.id);
  }
  ['_handleCaptureShortcutEvent'](_0xf27449) {
    const _0x333010 = _0xf27449?.detail || {};
    if (_0x333010.nodeId !== this.id) return;
    if (!this._isEditing()) return;
    void this._handleToolbarAction('capture');
  }
  ['_createCaptureMenu']() {
    const _0x218a47 = document.createElement('div');
    return (
      (_0x218a47.className = 'panorama-capture-menu'),
      (_0x218a47.hidden = true),
      (_0x218a47.innerHTML =
        '\n      <div class="panorama-capture-menu__grid">\n        ' +
        PANORAMA_CAPTURE_MODE_OPTIONS.map((_0x43ca73) => {
          const _0x126963 = getCaptureModeLabel(_0x43ca73);
          return (
            '\n            <button\n              type="button"\n              class="panorama-capture-menu__item"\n              data-capture-mode="' +
            _0x43ca73.key +
            '"\n              aria-label="' +
            panoramaSceneText('capture.modeAria', { label: _0x126963 }) +
            '"\n            >\n              <span class="panorama-capture-menu__icon ' +
            _0x43ca73.iconClass +
            '" aria-hidden="true">\n                <span class="panorama-capture-menu__icon-shape"></span>\n              </span>\n              <span class="panorama-capture-menu__label">' +
            _0x126963 +
            '</span>\n            </button>\n          '
          );
        }).join('') +
        '\n      </div>\n    '),
      _0x218a47
    );
  }
  ['_handleCaptureMenuClick'](_0x21db98) {
    const _0x13c973 = _0x21db98.target?.closest?.('[data-capture-mode]');
    if (!(_0x13c973 instanceof HTMLButtonElement)) return;
    const _0x4cd2f0 = _0x13c973.dataset.captureMode || 'adaptive';
    (this._selectNodeOnCanvas(),
      setPanoramaSceneCaptureMode({
        nodeId: this.id,
        mode: _0x4cd2f0,
        showSafeFrame: _0x4cd2f0 !== 'adaptive',
      }));
  }
  ['_createFocusMenu']() {
    const _0x2dc270 = document.createElement('div');
    ((_0x2dc270.className = 'panorama-scene-focus-menu'), (_0x2dc270.hidden = true));
    const _0xe80b8e = document.createElement('div');
    _0xe80b8e.className = 'panorama-scene-focus-menu__header';
    const _0xc67d18 = document.createElement('span');
    ((_0xc67d18.className = 'panorama-scene-focus-menu__title'),
      (_0xc67d18.textContent = panoramaSceneText('focus.title')),
      _0xe80b8e.appendChild(_0xc67d18));
    const _0x221f18 = document.createElement('span');
    ((_0x221f18.className = 'panorama-scene-focus-menu__value'), _0xe80b8e.appendChild(_0x221f18));
    const _0x140856 = document.createElement('input');
    ((_0x140856.className = 'panorama-scene-focus-menu__slider'),
      (_0x140856.type = 'range'),
      (_0x140856.min = String(SCENE_FOCAL_LENGTH_MIN_MM)),
      (_0x140856.max = String(SCENE_FOCAL_LENGTH_MAX_MM)),
      (_0x140856.step = '1'),
      _0x140856.setAttribute('aria-label', panoramaSceneText('focus.sliderAria')));
    const _0x322960 = () => {
      const _0x53b2ed = Math.max(
        SCENE_FOCAL_LENGTH_MIN_MM,
        Math.min(
          SCENE_FOCAL_LENGTH_MAX_MM,
          Number(this._getDefaultSceneFocalLength()) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
      );
      ((_0x140856.value = String(_0x53b2ed)), (_0x221f18.textContent = String(Math.round(_0x53b2ed))));
    };
    return (
      _0x140856.addEventListener('input', (_0x44197e) => {
        const _0x1e060a = Math.max(
          SCENE_FOCAL_LENGTH_MIN_MM,
          Math.min(
            SCENE_FOCAL_LENGTH_MAX_MM,
            Number(_0x44197e.currentTarget?.value) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
          ),
        );
        ((_0x221f18.textContent = String(Math.round(_0x1e060a))),
          this._setDefaultSceneFocalLength(_0x1e060a));
      }),
      _0x2dc270.appendChild(_0xe80b8e),
      _0x2dc270.appendChild(_0x140856),
      (_0x2dc270._syncValue = _0x322960),
      _0x322960(),
      _0x2dc270
    );
  }
  ['_resolveCaptureMode']() {
    return normalizeCaptureMode(this._sceneState?.capture?.mode);
  }
  ['_resolveCaptureFrameRect']() {
    const _0x30c4ee = this._viewportEl?.clientWidth || 0,
      _0xcd40f0 = this._viewportEl?.clientHeight || 0;
    return computeCaptureFrameRect(_0x30c4ee, _0xcd40f0, this._resolveCaptureMode());
  }
  ['_syncCaptureMenuState']() {
    if (!this._captureMenuEl) return;
    const _0x120620 = this._resolveCaptureMode();
    this._captureMenuEl.querySelectorAll('[data-capture-mode]').forEach((_0x51faef) => {
      const _0x465381 = _0x51faef.dataset.captureMode === _0x120620;
      (_0x51faef.classList.toggle('is-active', _0x465381),
        _0x51faef.setAttribute('aria-pressed', _0x465381 ? 'true' : 'false'));
    });
  }
  ['_syncCaptureSafeFrame']() {
    if (!this._captureSafeFrameEl || !this._captureSafeFrameLabelEl) return;
    const _0x2b78c2 = this._resolveCaptureMode(),
      _0x332c78 =
        this._isEditing() &&
        this._isNodeSelected() &&
        _0x2b78c2 !== 'adaptive' &&
        this._sceneState?.capture?.showSafeFrame === true;
    ((this._captureSafeFrameEl.hidden = !_0x332c78),
      this._captureSafeFrameEl.classList.toggle('is-visible', _0x332c78),
      this._captureSafeFrameEl.classList.toggle('is-adaptive', _0x2b78c2 === 'adaptive'));
    if (!_0x332c78) return;
    const _0x2cdd31 = this._resolveCaptureFrameRect();
    ((this._captureSafeFrameEl.style.left = _0x2cdd31.x + 'px'),
      (this._captureSafeFrameEl.style.top = _0x2cdd31.y + 'px'),
      (this._captureSafeFrameEl.style.width = _0x2cdd31.width + 'px'),
      (this._captureSafeFrameEl.style.height = _0x2cdd31.height + 'px'),
      (this._captureSafeFrameLabelEl.textContent = getCaptureModeLabel(_0x2b78c2)));
  }
  async ['_captureViewportByCurrentMode']() {
    const _0x33659f = await this._bridge?.captureBlob?.({ includeEditorOverlays: false });
    if (!_0x33659f) return null;
    return cropCaptureBlobToFrame({
      blob: _0x33659f,
      viewportWidth: this._viewportEl?.clientWidth || 0,
      viewportHeight: this._viewportEl?.clientHeight || 0,
      mode: this._resolveCaptureMode(),
    });
  }
  ['_createGridPanel']() {
    const _0x34a157 = document.createElement('div');
    ((_0x34a157.className = 'panorama-grid-panel'),
      (_0x34a157.innerHTML =
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
        PANORAMA_MANNEQUIN_GENDER_OPTIONS.map(([_0x16d1e0, , _0x51bae6]) => {
          const _0x1fec8f = getPanoramaMannequinGenderLabel(_0x16d1e0);
          return (
            '<button type="button" class="panorama-mannequin-menu__gender-btn" data-grid-gender="' +
            _0x16d1e0 +
            '" aria-label="' +
            panoramaSceneText('grid.setGenderAria', { label: _0x1fec8f }) +
            '">' +
            _0x51bae6 +
            '</button>'
          );
        }).join('') +
        '\n          </div>\n        </div>\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--color">\n          <span class="panorama-grid-panel__appearance-label" data-grid-label="color">' +
        panoramaSceneText('grid.color') +
        '</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--color">\n            ' +
        PANORAMA_MANNEQUIN_COLOR_OPTIONS.map(([_0x5d723d]) => {
          const _0x3dbe37 = getPanoramaMannequinColorLabel(_0x5d723d);
          return (
            '<button type="button" class="panorama-mannequin-menu__color-btn" data-grid-color="' +
            _0x5d723d +
            '" aria-label="' +
            panoramaSceneText('grid.setColorAria', { label: _0x3dbe37 }) +
            '"></button>'
          );
        }).join('') +
        '\n          </div>\n        </div>\n      </div>\n      <button type="button" class="panorama-grid-panel__apply">' +
        panoramaSceneText('grid.apply') +
        '</button>\n    '));
    const _0x530404 = {
        rows: { min: 1, max: 12, step: 1, precision: 0 },
        cols: { min: 1, max: 12, step: 1, precision: 0 },
        spacingX: { min: 0.5, max: 8, step: 0.1, precision: 1 },
        spacingZ: { min: 0.5, max: 8, step: 0.1, precision: 1 },
      },
      _0x2a5d40 = (_0x22d7af, _0x5f57b3) => {
        const _0x47a2bf = _0x530404[_0x22d7af];
        if (!_0x47a2bf) return null;
        const _0x133e5a = Number(_0x5f57b3);
        if (!Number.isFinite(_0x133e5a)) return null;
        const _0x4e2405 = Math.min(_0x47a2bf.max, Math.max(_0x47a2bf.min, _0x133e5a));
        if (_0x47a2bf.precision === 0) return Math.round(_0x4e2405);
        return Number(_0x4e2405.toFixed(_0x47a2bf.precision));
      },
      _0x12a8b1 = (_0xcf537b, _0xf5e475) => {
        const _0x298845 = _0x530404[_0xcf537b];
        if (!_0x298845 || !Number.isFinite(Number(_0xf5e475))) return '';
        return _0x298845.precision === 0
          ? String(Math.round(Number(_0xf5e475)))
          : Number(_0xf5e475).toFixed(_0x298845.precision);
      },
      _0x555797 = (_0x3b0d33, _0x1cee26, _0x2bd057) => {
        if (!_0x3b0d33) return;
        const _0x18c02f = _0x12a8b1(_0x1cee26, _0x2bd057);
        _0x3b0d33.tagName === 'INPUT'
          ? (_0x3b0d33.value = _0x18c02f)
          : ((_0x3b0d33.textContent = _0x18c02f), _0x3b0d33.setAttribute('aria-valuenow', String(_0x2bd057)));
      },
      _0x19ffea = (_0x3f490c, _0x827450) => {
        const _0x544e5d = _0x2a5d40(_0x3f490c, _0x827450);
        if (!Number.isFinite(_0x544e5d)) return;
        setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { [_0x3f490c]: _0x544e5d } });
        const _0x1d795f = _0x34a157.querySelector('[data-grid-field="' + _0x3f490c + '"]');
        _0x555797(_0x1d795f, _0x3f490c, _0x544e5d);
      };
    return (
      Object.keys(_0x530404).forEach((_0x4182ed) => {
        const _0x2d6573 = _0x530404[_0x4182ed],
          _0x276065 = _0x34a157.querySelector('[data-grid-field="' + _0x4182ed + '"]');
        if (!_0x276065) return;
        let _0x107f00 = null,
          _0x5db6ee = false;
        const _0x64e6e8 = () => {
            const _0x4f137b = _0x2a5d40(_0x4182ed, this._sceneState?.gridPlacement?.[_0x4182ed]);
            if (Number.isFinite(_0x4f137b)) return _0x4f137b;
            const _0x4701d8 = _0x2a5d40(_0x4182ed, _0x276065.getAttribute('aria-valuenow'));
            if (Number.isFinite(_0x4701d8)) return _0x4701d8;
            return _0x2d6573.min;
          },
          _0x5c7c24 = (_0x2e3234) => {
            if (!_0x107f00) return;
            const _0x83294a = _0x2e3234.clientX - _0x107f00.x;
            if (!_0x107f00.moved && Math.abs(_0x83294a) >= 3) _0x107f00.moved = true;
            const _0x5e309c = Math.trunc(_0x83294a / 6),
              _0x3072f6 = _0x107f00.v + _0x5e309c * _0x2d6573.step;
            if (_0x3072f6 === _0x107f00.last) return;
            ((_0x107f00.last = _0x3072f6), _0x19ffea(_0x4182ed, _0x3072f6));
          },
          _0x334673 = () => {
            if (!_0x107f00) return;
            const _0x441594 = _0x107f00.moved;
            (_0x107f00.el.classList.remove('is-dragging'),
              document.removeEventListener('mousemove', _0x5c7c24),
              document.removeEventListener('mouseup', _0x334673),
              _0x441594 && ((_0x5db6ee = true), (this._suppressDocClickOnce = true)),
              (_0x107f00 = null));
          },
          _0x366e64 = (_0x56978b) => {
            const _0x5322cf = _0x64e6e8(),
              _0x389518 = document.createElement('input');
            ((_0x389518.className = 'rh-stepper-input panorama-grid-panel__metric-stepper-input'),
              (_0x389518.type = 'number'),
              (_0x389518.step = String(_0x2d6573.step)),
              (_0x389518.min = String(_0x2d6573.min)),
              (_0x389518.max = String(_0x2d6573.max)),
              (_0x389518.value = _0x12a8b1(_0x4182ed, _0x5322cf)),
              _0x56978b.replaceWith(_0x389518),
              _0x389518.focus(),
              _0x389518.select());
            const _0x56148f = (_0x5688e9) => {
              const _0x28e412 = _0x5688e9 ? _0x389518.value : _0x5322cf,
                _0x2af318 = _0x2a5d40(_0x4182ed, _0x28e412),
                _0x31f020 = Number.isFinite(_0x2af318) ? _0x2af318 : _0x5322cf,
                _0x2a8b97 = document.createElement('div');
              ((_0x2a8b97.className = 'rh-stepper-value panorama-grid-panel__metric-stepper'),
                (_0x2a8b97.dataset.gridField = _0x4182ed),
                _0x2a8b97.setAttribute('role', 'spinbutton'),
                _0x2a8b97.setAttribute('tabindex', '0'));
              const _0x20b407 = _0x56978b.getAttribute('aria-label') || _0x4182ed;
              (_0x2a8b97.setAttribute('aria-label', _0x20b407),
                _0x2a8b97.setAttribute('aria-valuenow', String(_0x31f020)),
                (_0x2a8b97.textContent = _0x12a8b1(_0x4182ed, _0x31f020)),
                _0x389518.replaceWith(_0x2a8b97),
                _0x5688e9 ? _0x19ffea(_0x4182ed, _0x31f020) : _0x555797(_0x2a8b97, _0x4182ed, _0x31f020),
                _0x5ce670(_0x2a8b97));
            };
            ((_0x389518.onkeydown = (_0x87e928) => {
              if (_0x87e928.key === 'Enter') _0x56148f(true);
              if (_0x87e928.key === 'Escape') _0x56148f(false);
            }),
              (_0x389518.onblur = () => _0x56148f(true)));
          },
          _0x5ce670 = (_0x28882c) => {
            ((_0x28882c.onclick = (_0x133f74) => {
              _0x133f74.stopPropagation();
              if (_0x5db6ee) {
                _0x5db6ee = false;
                return;
              }
              _0x366e64(_0x28882c);
            }),
              (_0x28882c.onkeydown = (_0x3e8f86) => {
                const _0x1d4811 = _0x3e8f86.key === 'ArrowRight' ? 1 : _0x3e8f86.key === 'ArrowLeft' ? -1 : 0;
                if (_0x1d4811) {
                  (_0x3e8f86.preventDefault(), _0x3e8f86.stopPropagation());
                  const _0x5350c4 = _0x64e6e8();
                  _0x19ffea(_0x4182ed, _0x5350c4 + _0x1d4811 * _0x2d6573.step);
                  return;
                }
                (_0x3e8f86.key === 'Enter' || _0x3e8f86.key === ' ') &&
                  (_0x3e8f86.preventDefault(), _0x3e8f86.stopPropagation(), _0x366e64(_0x28882c));
              }),
              (_0x28882c.onmousedown = (_0x302612) => {
                if (_0x302612.button !== 0) return;
                (_0x302612.preventDefault(), (_0x5db6ee = false));
                const _0x40d63f = _0x64e6e8();
                ((_0x107f00 = {
                  x: _0x302612.clientX,
                  v: _0x40d63f,
                  moved: false,
                  last: _0x40d63f,
                  el: _0x28882c,
                }),
                  _0x28882c.classList.add('is-dragging'),
                  document.addEventListener('mousemove', _0x5c7c24),
                  document.addEventListener('mouseup', _0x334673));
              }));
          };
        _0x5ce670(_0x276065);
      }),
      _0x34a157.querySelectorAll('[data-grid-gender]').forEach((_0x3d5f50) => {
        _0x3d5f50.addEventListener('click', () => {
          const _0x167c2d = _0x3d5f50.dataset.gridGender === 'female' ? 'female' : 'male';
          setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { gender: _0x167c2d } });
        });
      }),
      _0x34a157.querySelectorAll('[data-grid-color]').forEach((_0x37cbb1) => {
        _0x37cbb1.addEventListener('click', () => {
          const _0x5ce454 = _0x37cbb1.dataset.gridColor || 'blue';
          setPanoramaSceneGridPlacement({ nodeId: this.id, patch: { colorKey: _0x5ce454 } });
        });
      }),
      _0x34a157.querySelector('.panorama-grid-panel__apply')?.addEventListener('click', () => {
        (this._selectNodeOnCanvas(),
          addPanoramaSceneMannequinGrid({ nodeId: this.id, viewPose: this._bridge?.readCurrentViewPose?.() }),
          (this._openMenuKey = null),
          this._syncOverlayState());
      }),
      _0x34a157
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
    const _0x23f38e = document.createElement('div');
    _0x23f38e.className = 'panorama-scene-browser-fullscreen';
    const _0x2c15a2 = document.createElement('button');
    ((_0x2c15a2.type = 'button'),
      (_0x2c15a2.className = 'panorama-scene-browser-fullscreen__exit'),
      (_0x2c15a2.textContent = panoramaSceneText('toolbar.exitFullscreen')),
      _0x2c15a2.setAttribute('aria-label', panoramaSceneText('toolbar.exitFullscreen')),
      _0x2c15a2.addEventListener('click', () => {
        void this._exitBrowserFullscreen();
      }),
      (this._browserFullscreenExitBtnEl = _0x2c15a2),
      _0x23f38e.appendChild(_0x2c15a2),
      _0x23f38e.appendChild(this._shellEl),
      document.body.appendChild(_0x23f38e),
      (this._browserFullscreenOverlayEl = _0x23f38e),
      this._syncToolbarState(),
      this._syncOverlayState(),
      this._positionMenus(),
      this._bridge?.resize());
  }
  async ['_exitBrowserFullscreen']({ skipSync: skipSync = false } = {}) {
    if (!this._isBrowserFullscreen()) return;
    const _0x459f92 = this._browserFullscreenOverlayEl;
    ((this._browserFullscreenOverlayEl = null), (this._browserFullscreenExitBtnEl = null));
    this._shellEl &&
      this.el?.isConnected &&
      (this._browserFullscreenAnchorEl?.parentElement === this.el
        ? this.el.insertBefore(this._shellEl, this._browserFullscreenAnchorEl.nextSibling)
        : this.el.appendChild(this._shellEl));
    _0x459f92?.remove?.();
    if (skipSync) return;
    (this._syncToolbarState(), this._syncOverlayState(), this._positionMenus(), this._bridge?.resize());
  }
  ['_handleWindowKeyDown'](_0x1dea2c) {
    if (_0x1dea2c.defaultPrevented) return;
    if (_0x1dea2c.key === 'Escape' && this._isBrowserFullscreen()) {
      (_0x1dea2c.preventDefault(),
        _0x1dea2c.stopPropagation(),
        _0x1dea2c.stopImmediatePropagation?.(),
        void this._exitBrowserFullscreen());
      return;
    }
    if (!this._isEditing()) return;
    const _0x1e8785 = _0x1dea2c.target,
      _0x270ee5 = resolvePanoramaSceneHistoryShortcutAction(_0x1dea2c);
    if (
      _0x270ee5 &&
      _0x1e8785 instanceof HTMLElement &&
      (this.el?.contains?.(_0x1e8785) || this._browserFullscreenOverlayEl?.contains?.(_0x1e8785))
    ) {
      (_0x1dea2c.preventDefault(),
        _0x1dea2c.stopPropagation(),
        _0x1dea2c.stopImmediatePropagation?.(),
        window.dispatchEvent(new CustomEvent('shortcut-action', { detail: _0x270ee5 })));
      return;
    }
    if (
      _0x1e8785 instanceof HTMLElement &&
      (_0x1e8785.isContentEditable ||
        _0x1e8785.tagName === 'INPUT' ||
        _0x1e8785.tagName === 'TEXTAREA' ||
        _0x1e8785.tagName === 'SELECT')
    )
      return;
    if (_0x1dea2c.key === 'Delete' || _0x1dea2c.key === 'Backspace') {
      (_0x1dea2c.preventDefault(),
        _0x1dea2c.stopPropagation(),
        _0x1dea2c.stopImmediatePropagation?.(),
        deleteSelectedPanoramaSceneObject({ nodeId: this.id }));
      return;
    }
    if (
      !_0x1dea2c.repeat &&
      !_0x1dea2c.ctrlKey &&
      !_0x1dea2c.metaKey &&
      !_0x1dea2c.altKey &&
      (_0x1dea2c.key === 'v' || _0x1dea2c.key === 'V')
    ) {
      (_0x1dea2c.preventDefault(),
        _0x1dea2c.stopPropagation(),
        _0x1dea2c.stopImmediatePropagation?.(),
        this._toggleMouseTool());
      return;
    }
  }
  ['_syncAttachedUiVisibility'](_0x18be4d) {
    this._bottomToolbarAnchorEl && (this._bottomToolbarAnchorEl.hidden = !_0x18be4d);
    const _0x502f75 = this._isNodeSelected() || this._isNodeHovered;
    this._infoDockEl && (this._infoDockEl.hidden = !_0x502f75);
  }
  ['_handleNodePointerEnter']() {
    ((this._isNodeHovered = true), this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
  }
  ['_handleNodePointerLeave'](_0x320971) {
    const _0x1edc4 = _0x320971.relatedTarget;
    if (_0x1edc4 && this.el.contains(_0x1edc4)) return;
    ((this._isNodeHovered = false),
      this._closeObjectContextMenu(),
      this._syncAttachedUiVisibility(this._shouldShowBottomToolbar()));
  }
  ['_selectNodeOnCanvas']({ preserveExistingSelection: preserveExistingSelection = false } = {}) {
    const _0x1b300e = appStore.getStateRaw().selectedNodeIds || [];
    if (preserveExistingSelection && _0x1b300e.includes(this.id)) return;
    if (_0x1b300e.length === 1 && _0x1b300e[0] === this.id) return;
    appStore.setSelectedNodes([this.id]);
  }
  ['_isEditing']() {
    return this._sceneState?.ui?.isEditing === true && this._data?.isCollapsed !== true;
  }
  ['_shouldShowBottomToolbar']() {
    const _0x32c41a = this._isNodeSelected();
    return this._isEditing() && _0x32c41a;
  }
  ['_resolveMouseTool']() {
    return (
      this._sceneState?.ui?.mouseTool ||
      (this._sceneState?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate')
    );
  }
  ['_toggleMouseTool']() {
    const _0x505566 = String(
        this._sceneState?.ui?.mouseTool || this._sceneState?.ui?.activeTool || '',
      ).trim(),
      _0x405096 = resolveNextPanoramaMouseTool(_0x505566);
    setPanoramaSceneTool({ nodeId: this.id, tool: _0x405096 });
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
  ['_buildPanorama360IncomingImageSignature'](_0x42222d) {
    if (!this._isPanorama360) return '';
    const _0x1096b4 = _0x42222d?.nodes || {},
      _0x5345d = _0x1096b4[this.id];
    if (!_0x5345d) return '';
    const _0x3ae43f = String(_0x5345d.parentId || '').trim(),
      _0x171edf = Object.values(_0x42222d?.edges || {}),
      _0x350507 = [];
    return (
      _0x171edf.forEach((_0x40232f) => {
        if (!_0x40232f) return;
        const _0x539679 = _0x40232f.targetId === this.id,
          _0x2423f2 = !!_0x3ae43f && _0x40232f.targetId === _0x3ae43f;
        if (!_0x539679 && !_0x2423f2) return;
        const _0x4d076e = _0x1096b4[_0x40232f.sourceId];
        if (!_0x4d076e || !isPanorama360ImageSourceType(_0x4d076e.type)) return;
        const _0x4b1321 =
            typeof _0x4d076e._bizRev === 'number' || typeof _0x4d076e._bizRev === 'string'
              ? String(_0x4d076e._bizRev)
              : '',
          _0x8187a7 = [
            String(_0x4d076e.localPath || '').trim(),
            String(_0x4d076e.imageUrl || '').trim(),
            String(_0x4d076e.src || '').trim(),
            String(_0x4d076e.fileName || '').trim(),
          ].join(':');
        _0x350507.push(
          _0x40232f.id +
            ':' +
            _0x40232f.sourceId +
            ':' +
            Number(_0x40232f.createdAt || 0) +
            ':' +
            _0x4b1321 +
            ':' +
            _0x8187a7,
        );
      }),
      _0x350507.sort((_0x59460c, _0x18b141) => _0x59460c.localeCompare(_0x18b141)),
      _0x350507.join('|')
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
  async ['_handleFileInputChange'](_0x332fdd) {
    if (!this._supportsPanoramaUpload()) {
      _0x332fdd.target.value = '';
      return;
    }
    const _0x20522c = _0x332fdd.target.files?.[0];
    if (!_0x20522c) return;
    this._selectNodeOnCanvas();
    const _0x28a4c2 = await uploadPanoramaSceneImage({ nodeId: this.id, file: _0x20522c });
    (_0x28a4c2 && this._isPanorama360 && this._enterEditing(), (_0x332fdd.target.value = ''));
  }
  ['_handleViewportPointerDown'](_0x20b6e0) {
    const _0x4907bb = this._isEditing();
    (this._selectNodeOnCanvas({ preserveExistingSelection: !_0x4907bb }), this._closeObjectContextMenu());
    if (!_0x4907bb) return;
    (this._openMenuKey && ((this._openMenuKey = null), this._syncOverlayState()),
      this._viewportEl.focus?.(),
      _0x20b6e0.stopPropagation());
  }
  ['_handleViewportContextMenu'](_0x1d2d5c) {
    if (!this._isEditing()) return;
    (_0x1d2d5c.preventDefault(), _0x1d2d5c.stopPropagation(), this._selectNodeOnCanvas());
    const _0x3376be = this._bridge?.pick?.(_0x1d2d5c.clientX, _0x1d2d5c.clientY);
    if (_0x3376be?.objectType && _0x3376be?.objectId)
      setPanoramaSceneSelection({
        nodeId: this.id,
        objectType: _0x3376be.objectType,
        objectId: _0x3376be.objectId,
      });
    else {
      if (!this._sceneState?.selection?.selectedObjectId) {
        this._closeObjectContextMenu();
        return;
      }
    }
    this._openObjectContextMenu(_0x1d2d5c.clientX, _0x1d2d5c.clientY, { type: 'selection' });
  }
  ['_handleGlobalPointerDown'](_0x3c654b) {
    if (!this._contextMenuEl || this._contextMenuEl.hidden) return;
    if (this._contextMenuEl.contains(_0x3c654b.target)) return;
    this._closeObjectContextMenu();
  }
  ['_openObjectContextMenu'](_0x12901b, _0x9582f, _0x5a735b = { type: 'selection' }) {
    if (!this._contextMenuEl || !this._overlayEl) return;
    const _0x51cb9b = this._overlayEl.getBoundingClientRect();
    if (!_0x51cb9b.width || !_0x51cb9b.height) return;
    const _0x193101 = this._contextMenuEl.offsetWidth || 132,
      _0x4451bc = this._contextMenuEl.offsetHeight || 44,
      _0x483dc0 = Math.max(0, Math.min(_0x12901b - _0x51cb9b.left, _0x51cb9b.width - _0x193101)),
      _0x162e8a = Math.max(0, Math.min(_0x9582f - _0x51cb9b.top, _0x51cb9b.height - _0x4451bc));
    ((this._contextMenuEl.style.left = _0x483dc0 + 'px'),
      (this._contextMenuEl.style.top = _0x162e8a + 'px'),
      (this._contextMenuTarget = _0x5a735b),
      (this._contextMenuEl.hidden = false),
      this._contextMenuEl.classList.add('is-visible'));
  }
  ['_closeObjectContextMenu']() {
    if (!this._contextMenuEl) return;
    ((this._contextMenuTarget = null),
      this._contextMenuEl.classList.remove('is-visible'),
      (this._contextMenuEl.hidden = true));
  }
  ['_handleViewportDoubleClick'](_0x972f06) {
    (_0x972f06.preventDefault(), _0x972f06.stopPropagation());
    if (this._isEditing() && this._sceneState?.mode === 'scene') {
      const _0x3f8546 = this._bridge?.pick?.(_0x972f06.clientX, _0x972f06.clientY);
      if (_0x3f8546?.objectType && _0x3f8546?.objectId) {
        (this._selectNodeOnCanvas(),
          setPanoramaSceneSelection({
            nodeId: this.id,
            objectType: _0x3f8546.objectType,
            objectId: _0x3f8546.objectId,
          }),
          focusPanoramaSceneSelection({ nodeId: this.id }));
        return;
      }
    }
    this._enterEditing();
  }
  ['_handleKeyDown'](_0xf7c444) {
    if (_0xf7c444.key !== 'Delete' && _0xf7c444.key !== 'Backspace') return;
    if (!this._isEditing()) return;
    (_0xf7c444.preventDefault(),
      _0xf7c444.stopPropagation(),
      deleteSelectedPanoramaSceneObject({ nodeId: this.id }));
  }
  ['_openPanoramaFilePicker']() {
    if (!this._supportsPanoramaUpload()) return;
    this._fileInput?.click();
  }
  ['_openMenu'](_0x3303e0) {
    if (!_0x3303e0) return;
    (clearTimeout(this._menuHideTimer),
      (this._openMenuKey = _0x3303e0),
      this._positionMenus(),
      this._syncOverlayState());
  }
  ['_closeMenus']() {
    (clearTimeout(this._menuHideTimer), (this._openMenuKey = null), this._syncOverlayState());
  }
  ['_scheduleMenuHide'](_0x2135e9) {
    (clearTimeout(this._menuHideTimer),
      this._openMenuKey === _0x2135e9 && ((this._openMenuKey = null), this._syncOverlayState()));
  }
  ['_handleBottomToolbarPointerEnter'](_0x1b4c97) {
    const _0x5d2163 = _0x1b4c97.target?.closest?.('button');
    if (!_0x5d2163) return;
    if (_0x5d2163.classList.contains('act-capture')) {
      this._openMenu('capture');
      return;
    }
    if (!this._isPanorama360 && _0x5d2163.classList.contains('act-focus')) {
      this._openMenu('focus');
      return;
    }
    if (_0x5d2163.classList.contains('act-mannequin-entry')) {
      if (!this._supportsCubeCreation()) return;
      this._openMenu('mannequin');
      return;
    }
    if (_0x5d2163.classList.contains('act-grid')) {
      if (!this._supportsCubeCreation()) return;
      this._openMenu('grid');
      return;
    }
    if (this._supportsCameraFeatures() && _0x5d2163.classList.contains('act-camera')) {
      this._openMenu('camera');
      return;
    }
  }
  ['_handleBottomToolbarPointerLeave'](_0x572ad9) {
    const _0x4012bf = _0x572ad9.relatedTarget;
    if (
      _0x4012bf &&
      (this._bottomToolbarEl?.contains(_0x4012bf) ||
        this._captureMenuEl?.contains(_0x4012bf) ||
        this._cameraListEl?.contains(_0x4012bf) ||
        this._focusMenuEl?.contains(_0x4012bf) ||
        this._mannequinMenuEl?.contains(_0x4012bf) ||
        this._gridPanelEl?.contains(_0x4012bf))
    )
      return;
    const _0xc8cd0b = _0x572ad9.target?.closest?.('button');
    if (!_0xc8cd0b) return;
    if (_0xc8cd0b.classList.contains('act-capture')) {
      this._scheduleMenuHide('capture');
      return;
    }
    if (!this._isPanorama360 && _0xc8cd0b.classList.contains('act-focus')) {
      this._scheduleMenuHide('focus');
      return;
    }
    if (_0xc8cd0b.classList.contains('act-mannequin-entry')) {
      if (!this._supportsCubeCreation()) return;
      this._scheduleMenuHide('mannequin');
      return;
    }
    if (_0xc8cd0b.classList.contains('act-grid')) {
      if (!this._supportsCubeCreation()) return;
      this._scheduleMenuHide('grid');
      return;
    }
    this._supportsCameraFeatures() &&
      _0xc8cd0b.classList.contains('act-camera') &&
      this._scheduleMenuHide('camera');
  }
  async ['_handleToolbarAction'](_0x101370) {
    const _0x987161 = this._sceneState;
    switch (_0x101370) {
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
        (this._closeMenus(), setPanoramaSceneTool({ nodeId: this.id, tool: _0x101370 }));
        return;
      case 'environment-toggle':
        setPanoramaSceneEnvironmentMode({
          nodeId: this.id,
          environmentMode: _0x987161.environmentMode === 'day' ? 'night' : 'day',
        });
        return;
      case 'collapse-node':
        {
          const _0x49db74 = this._data?.isCollapsed === true;
          (setPanoramaSceneCollapsed({
            nodeId: this.id,
            isCollapsed: !_0x49db74,
            enterEditingOnExpand: _0x49db74,
          }),
            _0x49db74 && requestAnimationFrame(() => this._viewportEl?.focus()));
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
  ['_handleToolbarClick'](_0x801994) {
    const _0x4dd230 = _0x801994.target.closest('button');
    if (!_0x4dd230) return;
    const _0x5acfef = Array.from(_0x4dd230.classList).find((_0x4afc65) => _0x4afc65.startsWith('act-'));
    if (!_0x5acfef) return;
    (_0x801994.preventDefault(), _0x801994.stopPropagation(), this._selectNodeOnCanvas());
    const _0x39d853 = _0x5acfef.slice(4);
    void this._handleToolbarAction(_0x39d853);
  }
  ['_syncGridPanelValues']() {
    if (!this._gridPanelEl) return;
    const _0x33dd44 = this._sceneState.gridPlacement,
      _0x442312 = (_0x4c7ccf, _0x4d918e, _0x25caaa = 0) => {
        const _0x275800 = this._gridPanelEl.querySelector('[data-grid-field="' + _0x4c7ccf + '"]');
        if (!_0x275800) return;
        if (!Number.isFinite(Number(_0x4d918e))) return;
        const _0x4ec105 =
          _0x25caaa > 0 ? Number(_0x4d918e).toFixed(_0x25caaa) : String(Math.round(Number(_0x4d918e)));
        _0x275800.tagName === 'INPUT'
          ? (_0x275800.value = _0x4ec105)
          : ((_0x275800.textContent = _0x4ec105), _0x275800.setAttribute('aria-valuenow', String(_0x4d918e)));
      };
    (_0x442312('rows', _0x33dd44.rows, 0),
      _0x442312('cols', _0x33dd44.cols, 0),
      _0x442312('spacingX', _0x33dd44.spacingX, 1),
      _0x442312('spacingZ', _0x33dd44.spacingZ, 1));
    const _0x1a4f8e = _0x33dd44.gender === 'female' ? 'female' : 'male';
    this._gridPanelEl.querySelectorAll('[data-grid-gender]').forEach((_0x509a6c) => {
      _0x509a6c.classList.toggle('is-active', _0x509a6c.dataset.gridGender === _0x1a4f8e);
    });
    const _0x4ab2a5 = new Set(PANORAMA_MANNEQUIN_COLOR_OPTIONS.map(([_0x3ae687]) => _0x3ae687)),
      _0x28d56c = _0x4ab2a5.has(_0x33dd44.colorKey) ? _0x33dd44.colorKey : 'blue';
    this._gridPanelEl.querySelectorAll('[data-grid-color]').forEach((_0x393ebb) => {
      const _0x4d2d3f = _0x393ebb.dataset.gridColor;
      (_0x393ebb.classList.toggle('is-active', _0x4d2d3f === _0x28d56c),
        _0x393ebb.style.setProperty(
          '--panorama-scene-swatch-token',
          'var(--' + resolvePanoramaSceneColorToken(_0x4d2d3f) + ')',
        ));
    });
  }
  ['_syncLocaleTexts']() {
    const _0x1f7d9e = (_0x5b5d2d, _0x3feb64) => {
        if (!_0x5b5d2d) return;
        ((_0x5b5d2d.dataset.tooltip = _0x3feb64), _0x5b5d2d.setAttribute('aria-label', _0x3feb64));
      },
      _0x10116c = (_0x55ecdd, _0x31f594) => {
        const _0x2bd446 = [this.el, this._browserFullscreenOverlayEl].filter(Boolean);
        _0x2bd446.forEach((_0x4a9638) => {
          _0x4a9638.querySelectorAll?.(_0x55ecdd)?.forEach((_0x4fb774) => _0x1f7d9e(_0x4fb774, _0x31f594));
        });
      },
      _0x5eaccc = (_0x5c35ac, _0x5189b1) => {
        const _0x126022 =
          this.el?.querySelector?.(_0x5c35ac) || this._browserFullscreenOverlayEl?.querySelector?.(_0x5c35ac);
        if (_0x126022) _0x126022.textContent = _0x5189b1;
      };
    (_0x10116c('.act-enter-edit', panoramaSceneText('toolbar.edit')),
      _0x10116c('.act-exit-edit', panoramaSceneText('toolbar.closeEdit')),
      _0x10116c('.act-upload-panorama', panoramaSceneText('toolbar.uploadPanorama')),
      _0x10116c('.act-cube', panoramaSceneText('toolbar.createCube')),
      _0x10116c('.act-mannequin-entry', panoramaSceneText('toolbar.mannequin')),
      _0x10116c('.act-grid', panoramaSceneText('toolbar.grid')),
      _0x10116c('.act-capture', panoramaSceneText('toolbar.capture')),
      _0x10116c('.act-camera', panoramaSceneText('toolbar.createCameraBookmark')),
      _0x10116c('.act-focus', panoramaSceneText('toolbar.focus')),
      _0x10116c('.act-reset-view', panoramaSceneText('toolbar.resetView')),
      _0x10116c('.act-environment-toggle', panoramaSceneText('toolbar.switchEnvironment')));
    const _0x53faed = this._contextMenuEl?.querySelector?.('.act-delete-selected');
    if (_0x53faed) _0x53faed.textContent = panoramaSceneText('contextMenu.deleteObject');
    (this._browserFullscreenExitBtnEl?.setAttribute(
      'aria-label',
      panoramaSceneText('toolbar.exitFullscreen'),
    ),
      this._browserFullscreenExitBtnEl &&
        (this._browserFullscreenExitBtnEl.textContent = panoramaSceneText('toolbar.exitFullscreen')),
      this._captureMenuEl?.querySelectorAll?.('[data-capture-mode]')?.forEach((_0x47b331) => {
        const _0x46d59b = getCaptureModeLabel(_0x47b331.dataset.captureMode || 'adaptive');
        _0x47b331.setAttribute('aria-label', panoramaSceneText('capture.modeAria', { label: _0x46d59b }));
        const _0x2c95b1 = _0x47b331.querySelector('.panorama-capture-menu__label');
        if (_0x2c95b1) _0x2c95b1.textContent = _0x46d59b;
      }),
      _0x5eaccc('.panorama-scene-focus-menu__title', panoramaSceneText('focus.title')),
      this._focusMenuEl
        ?.querySelector?.('.panorama-scene-focus-menu__slider')
        ?.setAttribute('aria-label', panoramaSceneText('focus.sliderAria')),
      _0x5eaccc('.panorama-grid-panel__title', panoramaSceneText('grid.title')),
      _0x5eaccc('[data-grid-label="rows"]', panoramaSceneText('grid.rows')),
      _0x5eaccc('[data-grid-label="cols"]', panoramaSceneText('grid.cols')),
      _0x5eaccc('[data-grid-label="spacingX"]', panoramaSceneText('grid.spacingX')),
      _0x5eaccc('[data-grid-label="spacingZ"]', panoramaSceneText('grid.spacingZ')),
      _0x5eaccc('[data-grid-label="gender"]', panoramaSceneText('grid.gender')),
      _0x5eaccc('[data-grid-label="color"]', panoramaSceneText('grid.color')),
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
      this._gridPanelEl?.querySelectorAll?.('[data-grid-gender]')?.forEach((_0x2b9dd7) => {
        const _0x552241 = getPanoramaMannequinGenderLabel(_0x2b9dd7.dataset.gridGender);
        _0x2b9dd7.setAttribute('aria-label', panoramaSceneText('grid.setGenderAria', { label: _0x552241 }));
      }),
      this._gridPanelEl?.querySelectorAll?.('[data-grid-color]')?.forEach((_0x406dca) => {
        const _0x42917c = getPanoramaMannequinColorLabel(_0x406dca.dataset.gridColor);
        _0x406dca.setAttribute('aria-label', panoramaSceneText('grid.setColorAria', { label: _0x42917c }));
      }),
      _0x5eaccc('.panorama-grid-panel__apply', panoramaSceneText('grid.apply')),
      renderMannequinQuickMenu(this._mannequinMenuEl, this._sceneState),
      this._renderCameraPresetList(),
      this._syncToolbarState(),
      this._syncHintAndStatus(),
      this._syncCaptureSafeFrame());
  }
  ['_renderCameraPresetList']() {
    renderCameraPresetList(this._cameraListEl, this._sceneState, {
      onActivate: (_0xa88fd7) => {
        (this._animateCameraActivation(_0xa88fd7), (this._openMenuKey = null), this._syncOverlayState());
      },
      onDelete: (_0x1c202c) => {
        deletePanoramaSceneCamera({ nodeId: this.id, cameraId: _0x1c202c });
      },
      onContextMenu: ({ cameraId: _0x1f2f6d, clientX: _0x340458, clientY: _0x14bea9 }) => {
        this._openObjectContextMenu(_0x340458, _0x14bea9, { type: 'camera', cameraId: _0x1f2f6d });
      },
    });
  }
  ['_syncToolbarState']() {
    const _0x353295 = this._resolveMouseTool(),
      _0x78e386 = this._resolveTransformTool();
    this._editToolbarEl
      .querySelectorAll('.act-navigate, .act-move, .act-rotate, .act-scale')
      .forEach((_0x78d81e) => {
        const _0x1b5850 = Array.from(_0x78d81e.classList).find((_0x2a6901) => _0x2a6901.startsWith('act-')),
          _0x3243f3 = _0x1b5850?.slice(4),
          _0x5708c1 = _0x3243f3 === 'navigate',
          _0x4711c5 = _0x5708c1
            ? _0x353295 === 'navigate' || _0x353295 === 'box-select'
            : _0x3243f3 === _0x78e386;
        _0x78d81e.classList.toggle('active', _0x4711c5);
      });
    const _0x1d6d4a = this._editToolbarEl.querySelector('.act-navigate');
    if (_0x1d6d4a) {
      const _0x5d6981 = _0x353295 === 'box-select';
      _0x1d6d4a.classList.toggle('is-box-select', _0x5d6981);
      const _0x1375fe = buildTooltipText(
        _0x5d6981 ? panoramaSceneText('toolbar.boxSelectMouse') : panoramaSceneText('toolbar.mouseMode'),
        'panorama-scene-tool-toggle-mouse',
      );
      ((_0x1d6d4a.dataset.tooltip = _0x1375fe), _0x1d6d4a.setAttribute('aria-label', _0x1375fe));
      const _0x30368b = _0x5d6981 ? BOX_SELECT_TOOL_ICON : POINTER_TOOL_ICON;
      _0x1d6d4a.innerHTML !== _0x30368b && (_0x1d6d4a.innerHTML = _0x30368b);
    }
    const _0x33d824 = this._editToolbarEl.querySelector('.act-move');
    if (_0x33d824) {
      const _0x55f25a = buildTooltipText(panoramaSceneText('toolbar.move'), 'panorama-scene-tool-move');
      ((_0x33d824.dataset.tooltip = _0x55f25a), _0x33d824.setAttribute('aria-label', _0x55f25a));
    }
    const _0x2d594d = this._editToolbarEl.querySelector('.act-rotate');
    if (_0x2d594d) {
      const _0x5d807 = buildTooltipText(panoramaSceneText('toolbar.rotate'), 'panorama-scene-tool-rotate');
      ((_0x2d594d.dataset.tooltip = _0x5d807), _0x2d594d.setAttribute('aria-label', _0x5d807));
    }
    const _0x5efc5e = this._editToolbarEl.querySelector('.act-scale');
    if (_0x5efc5e) {
      const _0x5c5f52 = buildTooltipText(panoramaSceneText('toolbar.scale'), 'panorama-scene-tool-scale');
      ((_0x5efc5e.dataset.tooltip = _0x5c5f52), _0x5efc5e.setAttribute('aria-label', _0x5c5f52));
    }
    const _0x36ebba = this._cornerToolbarEl.querySelector('.act-environment-toggle');
    if (_0x36ebba) {
      const _0x10abe2 =
        this._sceneState.environmentMode === 'day'
          ? panoramaSceneText('toolbar.switchToNight')
          : panoramaSceneText('toolbar.switchToDay');
      ((_0x36ebba.dataset.tooltip = _0x10abe2),
        _0x36ebba.setAttribute('aria-label', _0x10abe2),
        (_0x36ebba.hidden = false),
        _0x36ebba.setAttribute('aria-hidden', 'false'));
    }
    const _0x141369 = this._sceneToolbarEl.querySelector('.act-upload-panorama');
    if (_0x141369) {
      const _0x3afa85 = this._supportsPanoramaUpload();
      ((_0x141369.hidden = !_0x3afa85), _0x141369.setAttribute('aria-hidden', _0x3afa85 ? 'false' : 'true'));
    }
    const _0x4e18a8 = this._bottomToolbarEl.querySelector('.act-cube');
    if (_0x4e18a8) {
      const _0x50ffd3 = this._supportsCubeCreation();
      ((_0x4e18a8.hidden = !_0x50ffd3), _0x4e18a8.setAttribute('aria-hidden', _0x50ffd3 ? 'false' : 'true'));
    }
    const _0x526663 = this._bottomToolbarEl.querySelector('.act-mannequin-entry');
    if (_0x526663) {
      const _0x57656d = this._supportsCubeCreation();
      ((_0x526663.hidden = !_0x57656d),
        _0x526663.setAttribute('aria-hidden', _0x57656d ? 'false' : 'true'),
        (_0x526663.disabled = !_0x57656d),
        !_0x57656d && this._openMenuKey === 'mannequin' && (this._openMenuKey = null));
    }
    const _0x3e897d = this._bottomToolbarEl.querySelector('.act-grid');
    if (_0x3e897d) {
      const _0x41104b = this._supportsCubeCreation();
      ((_0x3e897d.hidden = !_0x41104b),
        _0x3e897d.setAttribute('aria-hidden', _0x41104b ? 'false' : 'true'),
        (_0x3e897d.disabled = !_0x41104b));
      const _0x58b587 = panoramaSceneText('toolbar.grid');
      ((_0x3e897d.dataset.tooltip = _0x58b587),
        _0x3e897d.setAttribute('aria-label', _0x58b587),
        !_0x41104b && this._openMenuKey === 'grid' && (this._openMenuKey = null));
    }
    const _0x96020b = this._bottomToolbarEl.querySelector('.act-camera');
    if (_0x96020b) {
      const _0x58c95c = this._supportsCameraFeatures(),
        _0x5c523b = this._sceneState.cameras.length >= 10;
      ((_0x96020b.hidden = !_0x58c95c),
        _0x96020b.setAttribute('aria-hidden', _0x58c95c ? 'false' : 'true'),
        (_0x96020b.disabled = !_0x58c95c),
        _0x96020b.classList.toggle('is-limit-reached', _0x58c95c && _0x5c523b),
        _0x96020b.setAttribute('aria-disabled', !_0x58c95c || _0x5c523b ? 'true' : 'false'));
      const _0x2c3749 = buildTooltipText(
        panoramaSceneText('toolbar.createCameraBookmark'),
        'panorama-scene-camera-create',
      );
      ((_0x96020b.dataset.tooltip = _0x2c3749),
        _0x96020b.setAttribute('aria-label', _0x2c3749),
        !_0x58c95c && this._openMenuKey === 'camera' && (this._openMenuKey = null));
    }
    const _0x21a7dc = this._bottomToolbarEl.querySelector('.act-focus');
    if (_0x21a7dc) {
      const _0xa4503c = !this._isPanorama360 && this._sceneState?.mode === 'scene';
      ((_0x21a7dc.hidden = !_0xa4503c),
        _0x21a7dc.setAttribute('aria-hidden', _0xa4503c ? 'false' : 'true'),
        (_0x21a7dc.disabled = !_0xa4503c));
      const _0x315f9b = panoramaSceneText('toolbar.focus');
      ((_0x21a7dc.dataset.tooltip = _0x315f9b),
        _0x21a7dc.setAttribute('aria-label', _0x315f9b),
        !_0xa4503c && this._openMenuKey === 'focus' && (this._openMenuKey = null));
    }
    const _0x4a99c0 = this._bottomToolbarEl.querySelector('.act-reset-view');
    if (_0x4a99c0) {
      const _0x40b921 = buildTooltipText(panoramaSceneText('toolbar.resetView'), 'panorama-scene-reset-view');
      ((_0x4a99c0.dataset.tooltip = _0x40b921), _0x4a99c0.setAttribute('aria-label', _0x40b921));
    }
    const _0x44ce30 = this._bottomToolbarEl.querySelector('.act-capture');
    if (_0x44ce30) {
      const _0x47a73c = getCaptureModeMeta(this._resolveCaptureMode()),
        _0x1ab201 = buildTooltipText(
          panoramaSceneText('toolbar.captureWithMode', { mode: getCaptureModeLabel(_0x47a73c) }),
          'panorama-scene-capture',
        );
      ((_0x44ce30.dataset.tooltip = _0x1ab201), _0x44ce30.setAttribute('aria-label', _0x1ab201));
    }
    this._syncCaptureMenuState();
    const _0x4f63ef = [
      this._sceneToolbarEl?.querySelector('.act-collapse-node'),
      this._editToolbarEl?.querySelector('.act-collapse-node'),
    ].filter(Boolean);
    _0x4f63ef.forEach((_0x5df562) => {
      const _0x31f5b2 = this._data?.isCollapsed === true,
        _0x15b6be = _0x31f5b2 ? panoramaSceneText('toolbar.expand') : panoramaSceneText('toolbar.collapse');
      ((_0x5df562.dataset.tooltip = _0x15b6be),
        _0x5df562.setAttribute('aria-label', _0x15b6be),
        _0x5df562.classList.toggle('is-collapsed', _0x31f5b2));
    });
    const _0x542a77 = this.el?.querySelectorAll?.('.act-fullscreen') || [];
    if (_0x542a77.length > 0) {
      const _0x1a9ffb = this._isBrowserFullscreen(),
        _0x3e2215 = _0x1a9ffb
          ? panoramaSceneText('toolbar.exitFullscreen')
          : panoramaSceneText('toolbar.fullscreen');
      _0x542a77.forEach((_0x50cadf) => {
        ((_0x50cadf.dataset.tooltip = _0x3e2215),
          _0x50cadf.setAttribute('aria-label', _0x3e2215),
          _0x50cadf.classList.toggle('active', _0x1a9ffb));
      });
    }
  }
  ['_syncHintAndStatus']() {
    const _0x46d83e = this._isEditing(),
      _0xd924c0 = this._sceneState.selection,
      _0x2e3f01 = this._resolveMouseTool();
    if (_0x46d83e) {
      const _0x3048c1 = _0xd924c0.selectedObjectId
          ? _0xd924c0.selectedObjectType === 'camera'
            ? panoramaSceneText('status.cameraSelected')
            : panoramaSceneText('status.objectSelected')
          : panoramaSceneText('status.noObjectSelected'),
        _0x7aaf85 = this._supportsPanoramaUpload()
          ? panoramaSceneText('status.panoramaMode')
          : panoramaSceneText('status.sceneMode');
      this._statusContentEl.textContent = panoramaSceneText('status.editing', {
        mode: _0x7aaf85,
        selection: _0x3048c1,
      });
    } else
      this._data?.isCollapsed
        ? (this._statusContentEl.textContent = panoramaSceneText('status.collapsed'))
        : (this._statusContentEl.textContent = panoramaSceneText('status.normalNode'));
    const _0x46cc27 = this._sceneState.panorama.error || this._sceneState.capture.error || '';
    ((this._errorEl.textContent = _0x46cc27), this._errorEl.classList.toggle('is-visible', !!_0x46cc27));
    if (this._data?.isCollapsed) this._hintContentEl.textContent = panoramaSceneText('hint.doubleClickEdit');
    else {
      if (!_0x46d83e)
        this._hintContentEl.textContent = this._supportsPanoramaUpload()
          ? panoramaSceneText('hint.clickEditPanorama')
          : panoramaSceneText('hint.clickEditScene');
      else {
        if (this._supportsPanoramaUpload() || this._sceneState.mode === 'panorama')
          this._hintContentEl.textContent = panoramaSceneText('hint.panoramaControls');
        else
          _0x2e3f01 === 'box-select'
            ? (this._hintContentEl.textContent = panoramaSceneText('hint.boxSelect'))
            : (this._hintContentEl.textContent = panoramaSceneText('hint.defaultMouse'));
      }
    }
  }
  ['_positionMenus']() {
    if (!this._bottomToolbarPopoverLayerEl || !this._bottomToolbarEl) return;
    if (this._bottomToolbarEl.offsetWidth <= 0 || this._bottomToolbarEl.offsetHeight <= 0) return;
    const _0x214c4c = (_0x52e685) => {
        if (!(_0x52e685 instanceof HTMLElement)) return null;
        const _0x6856af = _0x52e685.offsetWidth || 0,
          _0x5bc924 = _0x52e685.offsetHeight || 0;
        if (_0x6856af <= 0 || _0x5bc924 <= 0) return null;
        return { x: (_0x52e685.offsetLeft || 0) + _0x6856af / 2, y: _0x52e685.offsetTop || 0 };
      },
      _0x2a6bb9 = _0x214c4c(this._bottomToolbarEl.querySelector('.act-mannequin-entry'));
    _0x2a6bb9 &&
      ((this._mannequinMenuEl.style.left = _0x2a6bb9.x + 'px'),
      (this._mannequinMenuEl.style.top = _0x2a6bb9.y + 'px'));
    const _0x259707 = _0x214c4c(this._bottomToolbarEl.querySelector('.act-grid'));
    _0x259707 &&
      ((this._gridPanelEl.style.left = _0x259707.x + 'px'),
      (this._gridPanelEl.style.top = _0x259707.y + 'px'));
    const _0x5c9053 = _0x214c4c(this._bottomToolbarEl.querySelector('.act-capture'));
    _0x5c9053 &&
      ((this._captureMenuEl.style.left = _0x5c9053.x + 'px'),
      (this._captureMenuEl.style.top = _0x5c9053.y + 'px'));
    const _0x1cd2aa = _0x214c4c(this._bottomToolbarEl.querySelector('.act-focus'));
    _0x1cd2aa &&
      ((this._focusMenuEl.style.left = _0x1cd2aa.x + 'px'),
      (this._focusMenuEl.style.top = _0x1cd2aa.y + 'px'));
    const _0x4f2f07 = _0x214c4c(this._bottomToolbarEl.querySelector('.act-camera'));
    _0x4f2f07 &&
      ((this._cameraListEl.style.left = _0x4f2f07.x + 'px'),
      (this._cameraListEl.style.top = _0x4f2f07.y + 'px'));
  }
  ['_syncOverlayState']() {
    const _0x113767 = this._isEditing(),
      _0x2b7d6e = this._data?.isCollapsed === true,
      _0x5638ca = this._isNodeSelected(),
      _0xec7564 = !_0x113767,
      _0x264c67 = _0x113767 && !_0x2b7d6e && _0x5638ca,
      _0x428033 = _0x264c67,
      _0x33fb54 = _0x264c67;
    (this.el.classList.toggle('is-editing', _0x113767),
      this.el.classList.toggle('is-collapsed', _0x2b7d6e),
      this.el.classList.toggle('is-panorama-mode', this._sceneState.mode === 'panorama'));
    const _0x147279 = this._sceneState?.environmentMode === 'day' ? 'day' : 'night';
    ((this.el.dataset.panoramaEnv = _0x147279),
      (this._viewportEl.dataset.envMode = _0x147279),
      (this._viewportEl.dataset.sceneType = this._sceneState?.type || ''),
      this._sceneToolbarEl.classList.toggle('is-hidden', !_0xec7564),
      this._sceneToolbarEl.classList.remove('is-node-collapsed'),
      this._editToolbarEl.classList.toggle('is-hidden', !_0x264c67),
      this._editToolbarEl.classList.remove('is-node-collapsed'),
      this._cornerToolbarEl.classList.toggle('is-hidden', !_0x33fb54),
      this._cornerToolbarEl.classList.toggle('is-collapsed-state', _0x2b7d6e),
      this._bottomToolbarEl.classList.toggle('is-hidden', !_0x428033),
      (this._statusEl.style.transform = 'none'),
      (this._hintEl.style.transform = 'none'));
    !_0x264c67 && this._closeObjectContextMenu();
    const _0x5383fd =
        _0x264c67 &&
        this._supportsCameraFeatures() &&
        this._sceneState.cameras.length > 0 &&
        this._openMenuKey === 'camera',
      _0x457371 =
        _0x264c67 &&
        !this._isPanorama360 &&
        this._sceneState?.mode === 'scene' &&
        this._openMenuKey === 'focus',
      _0x1185d5 = _0x264c67 && this._openMenuKey === 'capture',
      _0x180735 = _0x264c67 && this._supportsCubeCreation() && this._openMenuKey === 'grid',
      _0x2c561a = _0x264c67 && this._supportsCubeCreation() && this._openMenuKey === 'mannequin';
    (this._captureMenuEl.classList.toggle('is-visible', _0x1185d5),
      this._cameraListEl.classList.toggle('is-visible', _0x5383fd),
      this._focusMenuEl.classList.toggle('is-visible', _0x457371),
      this._gridPanelEl.classList.toggle('is-visible', _0x180735),
      this._mannequinMenuEl.classList.toggle('is-visible', _0x2c561a),
      (this._captureMenuEl.hidden = !_0x1185d5),
      (this._cameraListEl.hidden = !_0x5383fd),
      (this._focusMenuEl.hidden = !_0x457371),
      (this._gridPanelEl.hidden = !_0x180735),
      (this._mannequinMenuEl.hidden = !_0x2c561a));
    _0x457371 && this._focusMenuEl?._syncValue?.();
    (this._statusEl.classList.toggle('is-visible', true),
      this._hintEl.classList.toggle('is-visible', true),
      this._syncAttachedUiVisibility(_0x428033),
      this._syncCaptureSafeFrame());
    const _0x46cf32 = this._bottomToolbarEl?.querySelector('.act-focus');
    if (_0x46cf32) {
      const _0x10fc6b = _0x457371 ? '' : panoramaSceneText('toolbar.focus');
      (_0x10fc6b ? (_0x46cf32.dataset.tooltip = _0x10fc6b) : _0x46cf32.removeAttribute('data-tooltip'),
        _0x46cf32.setAttribute('aria-label', panoramaSceneText('toolbar.focus')));
    }
    this._positionMenus();
  }
  ['update'](_0x4cc6a8) {
    const _0x5d01e9 = this._sceneState;
    ((this._data = _0x4cc6a8),
      (this._isPanorama360 = String(_0x4cc6a8?.type || '').trim() === PANORAMA_360_NODE_TYPE),
      this.el.classList.toggle('is-panorama-360', this._isPanorama360),
      (this._sceneState = getPanoramaSceneState(_0x4cc6a8)),
      !this._sceneState.ui.isEditing && (this._openMenuKey = null),
      this._maybePreloadCharacterModels(_0x5d01e9),
      !this._isPanorama360 &&
      this._sceneState?.mode === 'scene' &&
      (!_0x5d01e9 ||
        (!this._isDefaultSceneView(_0x5d01e9?.viewport?.sceneView) &&
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
