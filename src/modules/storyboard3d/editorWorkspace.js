import { t } from '../../i18n/index.js';
import {
  bindAIGenTextModelSelector,
  renderAIGenTextModelSelectorMarkup,
} from '../../components/aigenText/modelSelector.js';
import {
  fetchStoryboard3DModelPackAssetFile,
  getStoryboard3DModelPackStatus,
} from '../../../api/storyboard3dModelPackApi.js';
import {
  applyOrbitDelta,
  applySceneFlyLookDelta,
  applySceneFlyMovement,
  applySceneDollyDelta,
  applyScenePanDelta,
  applySceneZoomDelta,
  normalizeWheelDelta,
  resolveSceneCameraPose,
} from '../../core/panoramaSceneMath.js';
import { createStoryboard3DEditorStore } from './editorStore.js';
import {
  createDefaultStoryboard3DCameraState,
  createStoryboard3DScene,
  getActiveStoryboard3DScene,
  getActiveStoryboard3DShot,
  summarizeStoryboard3DProject,
  syncStoryboard3DCameraObjectFromShot,
  syncStoryboard3DShotFromCameraObject,
} from './projectModel.js';
import { createStoryboard3DProjectStore } from './projectStore.js';
import { createStoryboard3DSceneRuntime } from './sceneRuntime.js';
import { createStoryboard3DShotTimelineController } from './shotTimelineController.js';
import { renderStoryboard3DShotVideo } from './shotVideoRecorder.js';
import { renderStoryboard3DShotFrame } from './shotFrameCapture.js';
import { directorDeletionImpact } from './directorRecovery.js';
import { captureTimelinePresentation, restoreTimelinePresentation } from './timelinePresentation.js';
import { upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
import {
  createCommandHistory,
  createStoryboard3DProjectMutationCommand,
  createStoryboard3DTransformCommand,
} from './commandHistory.js';
import {
  appendShotFromCurrentView,
  appendStoryboard3DShotCandidate,
  duplicateStoryboard3DShot,
  deleteStoryboard3DShot,
  describeStoryboard3DShot,
  renameStoryboard3DShot,
  reorderStoryboard3DShot,
  replaceStoryboard3DShotCamera,
  replaceStoryboard3DShotWithCandidate,
  setStoryboard3DCameraFocalLength,
  STORYBOARD_3D_FOCAL_LENGTH_PRESETS,
} from './cameraShotSystem.js';
import { generateStoryboard3DShotCandidates } from './shotExploration.js';
import { createStoryboard3DExportController } from './exportController.js';
import {
  createStoryboard3DAssetLibrary,
  getStoryboard3DAssetCategoryLabel,
  STORYBOARD_3D_ASSET_CATEGORIES,
} from './assetLibrary.js';
import { getStoryboard3DAssetSpatialExtent } from './spatialLayout.js';
import {
  createStoryboard3DBuiltinAssetThumbnailModel,
  createStoryboard3DAssetThumbnailRenderer,
  disposeStoryboard3DAssetThumbnailModel,
  storyboard3DAssetThumbnailCache,
} from './assetThumbnailRenderer.js';
import {
  STORYBOARD_3D_MODEL_ACCEPT,
  importStoryboard3DModelFile,
  setStoryboard3DModelNormalization,
} from './modelImport.js';
import { createThreeStoryboard3DModelParsers } from './legacyModelImportAdapters.js';
import { createThreeWorkerBackedStoryboard3DModelParsers } from './workerModelImportAdapters.js';
import {
  createStoryboard3DBoneOverridesSignature,
  createStoryboard3DCharacterImagePoseController,
} from './characterImagePoseController.js';
import { applyStoryboard3DTexturePolicy, preflightStoryboard3DImageFile } from './texturePolicy.js';
import {
  STORYBOARD_3D_ACTIONS,
  STORYBOARD_3D_BODY_PRESETS,
  STORYBOARD_3D_HAND_POSES,
  seekStoryboard3DCharacterAction,
  setStoryboard3DCharacterActionPlayback,
  quaternionToStoryboard3DEuler,
  setStoryboard3DBoneOverride,
} from './characterRig.js';
import {
  computeStoryboard3DMiniMapObjectDrag,
  createStoryboard3DMiniMapCameraMarker,
  createStoryboard3DMiniMapProjection,
  projectStoryboard3DTopViewFootprint,
  projectStoryboard3DWorldToMiniMapRatio,
} from './miniMapMath.js';
import {
  deriveStoryboard3DBackgroundCamera,
  guardStoryboard3DBackgroundCameraChange,
  normalizeStoryboard3DBackgroundCalibration,
  setStoryboard3DBackgroundCameraLock,
  updateStoryboard3DBackgroundCalibration,
} from './backgroundCalibration.js';
import {
  computeStoryboard3DBackgroundGuideGeometry,
  createStoryboard3DBackgroundCalibrationInteraction,
} from './backgroundCalibrationInteraction.js';
import { analyzeStoryboard3DBackgroundImage } from './backgroundPerspectiveEstimator.js';
import {
  createStoryboard3DAIVoiceController,
  createStoryboard3DSafeToolExecutor,
} from './aiVoiceController.js';
import { getStoryboard3DTextModelIds, resolveStoryboard3DTextModelSelection } from './modelSelection.js';
import { getDisplayModelName } from '../providers.js';
import {
  createStoryboard3DViewportControlSystem,
  normalizeStoryboard3DViewportSettings,
} from './viewportControlSystem.js';
import {
  createStoryboard3DTransformSession,
  updateStoryboard3DTransformSession,
} from './transformSession.js';
import {
  canStoryboard3DObjectEditTransformField,
  canStoryboard3DObjectUseTransformTool,
  getStoryboard3DObjectTransformCapabilities,
} from './objectTransformCapabilities.js';
import {
  getStoryboard3DNavigationHelpText,
  resolveStoryboard3DNavigationMode,
} from './viewportNavigationProtocol.js';
import {
  STORYBOARD_3D_NAVIGATION_PRESETS,
  createStoryboard3DNavigationPresetSettings,
  getStoryboard3DToolShortcut,
  loadStoryboard3DNavigationSettings,
  resolveStoryboard3DToolFromShortcut,
  saveStoryboard3DNavigationSettings,
} from './viewportNavigationSettings.js';
import {
  loadStoryboard3DTransformSettings,
  saveStoryboard3DTransformSettings,
} from './viewportTransformSettings.js';
import {
  createStoryboard3DSelectionRect,
  hasStoryboard3DSelectionDragMoved,
  mergeStoryboard3DBoxSelection,
} from './selectionBox.js';
import { trapTabKey } from '../../utils/focusTrap.js';
import {
  applyStoryboard3DEnvironmentPreset,
  deleteStoryboard3DScene,
  duplicateStoryboard3DScene,
  renameStoryboard3DScene,
  reorderStoryboard3DScene,
  replaceStoryboard3DShotFromCurrentView,
  createStoryboard3DShotThumbnailToken,
  applyStoryboard3DShotThumbnail,
} from './sceneProjectOperations.js';
import { createStoryboard3DBackgroundImageController } from './backgroundImageController.js';
import {
  STORYBOARD_3D_BINARY_ASSET_DB_NAME,
  STORYBOARD_3D_BINARY_ASSET_STORE_NAME,
  createStoryboard3DBinaryAssetRepository,
} from './binaryAssetRepository.js';
import { createCanonicalStoryboard3DAssetId, createStoryboard3DAssetRecord } from './assetRecord.js';
import { containWorkspaceContextMenu } from '../workspaceContextMenuGuard.js';
import {
  deleteStoryboard3DSceneGroup,
  groupStoryboard3DSceneObjects,
  setStoryboard3DObjectParent,
  ungroupStoryboard3DSceneGroup,
} from './sceneHierarchy.js';
import {
  createStoryboard3DModelImportJob,
  disposeCancelledStoryboard3DModelImportResult,
} from './modelImportJob.js';
function escapeHtml(_0xa0512f) {
  return String(_0xa0512f ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function dispatchWorkspaceEvent(_0x409551, _0x30735a, _0x1760fc) {
  if (!_0x409551?.['dispatchEvent'] || typeof _0x409551['CustomEvent'] !== 'function') return;
  _0x409551['dispatchEvent'](new _0x409551['CustomEvent'](_0x30735a, { detail: _0x1760fc }));
}
function setStoryboard3DShotInitialCamera(_0xd8e78f, _0x50b4f8, _0x467533) {
  if (!_0xd8e78f || !_0x50b4f8 || !_0x467533) return;
  ((_0x50b4f8['camera'] = {
    ..._0x50b4f8['camera'],
    ..._0x467533,
    position: [..._0x467533['position']],
    target: [..._0x467533['target']],
  }),
    (_0x50b4f8['animation'] = upsertStoryboard3DCameraKeyframe(_0x50b4f8['animation'], {
      time: 0x0,
      camera: _0x50b4f8['camera'],
    })),
    syncStoryboard3DCameraObjectFromShot(_0xd8e78f, _0x50b4f8));
}
function restoreStoryboard3DStoredFile(_0x51b4e6, _0x2b3614 = globalThis['window']) {
  if (!_0x51b4e6?.['blob']) return null;
  const _0x5a66bc = _0x2b3614?.['File'] || globalThis['File'];
  if (typeof _0x5a66bc === 'function') {
    const _0x8321d5 = new _0x5a66bc([_0x51b4e6['blob']], _0x51b4e6['name'], {
      type: _0x51b4e6['type'] || _0x51b4e6['blob']['type'],
      lastModified: _0x51b4e6['lastModified'] || 0x0,
    });
    return (
      _0x51b4e6['relativePath'] &&
        _0x51b4e6['relativePath'] !== _0x51b4e6['name'] &&
        Object['defineProperty'](_0x8321d5, 'webkitRelativePath', {
          configurable: !![],
          value: _0x51b4e6['relativePath'],
        }),
      _0x8321d5
    );
  }
  const _0x5938fd = _0x51b4e6['blob'];
  for (const [_0x2e2765, _0x35734b] of Object['entries']({
    name: _0x51b4e6['name'],
    lastModified: _0x51b4e6['lastModified'] || 0x0,
    webkitRelativePath: _0x51b4e6['relativePath'] || _0x51b4e6['name'],
  })) {
    try {
      Object['defineProperty'](_0x5938fd, _0x2e2765, { configurable: !![], value: _0x35734b });
    } catch {}
  }
  return _0x5938fd;
}
function getSaveStatusLabel(_0x422449) {
  if (_0x422449 === 'saving') return t('storyboard3d.saveStatus.saving');
  if (_0x422449 === 'error') return t('storyboard3d.saveStatus.error');
  return t('storyboard3d.saveStatus.saved');
}
function renderObjectOutline(_0x2279cf, _0x16b1e6 = [], { query: query = '', type: type = 'all' } = {}) {
  if (!_0x2279cf || _0x2279cf['objects']['length'] === 0x0)
    return (
      '<div\x20class=\x22storyboard-3d-empty-state\x22>\x0a\x20\x20\x20\x20\x20\x20<strong>' +
      escapeHtml(t('storyboard3d.editor.emptyOutlineTitle')) +
      '</strong>\n      <span>' +
      escapeHtml(t('storyboard3d.editor.emptyOutlineDescription')) +
      '</span>\n    </div>'
    );
  const _0x34f96f = String(query || '')
      ['trim']()
      ['toLocaleLowerCase'](),
    _0x33f288 = _0x2279cf['objects']['filter']((_0x4ec67c) => {
      if (type !== 'all' && _0x4ec67c['type'] !== type) return ![];
      return (
        !_0x34f96f ||
        (_0x4ec67c['name'] + '\x20' + _0x4ec67c['type'])['toLocaleLowerCase']()['includes'](_0x34f96f)
      );
    });
  if (_0x33f288['length'] === 0x0)
    return '<div class="storyboard-3d-empty-state"><strong>没有匹配对象</strong><span>调整名称或类型筛选。</span></div>';
  const _0x37e5b8 = new Map(_0x2279cf['objects']['map']((_0x5ca81b) => [_0x5ca81b['id'], _0x5ca81b])),
    _0x4307a1 = (_0x2869ef) => {
      let _0x32094c = 0x0,
        _0x6ba5b7 = _0x2869ef['parentId'];
      const _0xa128a3 = new Set([_0x2869ef['id']]);
      while (_0x6ba5b7 && _0x37e5b8['has'](_0x6ba5b7) && !_0xa128a3['has'](_0x6ba5b7) && _0x32094c < 0x4) {
        (_0xa128a3['add'](_0x6ba5b7),
          (_0x32094c += 0x1),
          (_0x6ba5b7 = _0x37e5b8['get'](_0x6ba5b7)?.['parentId']));
      }
      return _0x32094c;
    };
  return _0x33f288['map']((_0x5db13c) => {
    const _0x24a4ea = _0x5db13c['visible'] !== ![],
      _0x176b39 = _0x5db13c['locked'] === !![],
      _0x2aa416 = escapeHtml(_0x5db13c['name']);
    return (
      '<div draggable="true" class="storyboard-3d-object-row is-depth-' +
      _0x4307a1(_0x5db13c) +
      '\x20' +
      (_0x16b1e6['includes'](_0x5db13c['id']) ? 'is-active' : '') +
      '" data-object-type="' +
      escapeHtml(_0x5db13c['type']) +
      '" data-object-id="' +
      escapeHtml(_0x5db13c['id']) +
      '">\n          <button type="button" class="storyboard-3d-object-row-select" data-storyboard-3d-action="select-object" data-object-id="' +
      escapeHtml(_0x5db13c['id']) +
      '" data-object-type="' +
      escapeHtml(_0x5db13c['type']) +
      '" aria-pressed="' +
      _0x16b1e6['includes'](_0x5db13c['id']) +
      '" aria-label="选择 ' +
      _0x2aa416 +
      '">\n            <span class="storyboard-3d-object-type">' +
      escapeHtml(_0x5db13c['type']) +
      '</span>\n          </button>\n          <input type="text" class="storyboard-3d-object-row-name-input" value="' +
      _0x2aa416 +
      '\x22\x20maxlength=\x22120\x22\x20draggable=\x22false\x22\x20data-storyboard-3d-action=\x22edit-object-name\x22\x20data-storyboard-3d-outline-name\x20data-storyboard-3d-object-name\x20data-object-id=\x22' +
      escapeHtml(_0x5db13c['id']) +
      '" data-object-type="' +
      escapeHtml(_0x5db13c['type']) +
      '" aria-label="重命名 ' +
      _0x2aa416 +
      '\x22\x20title=\x22点击重命名\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-object-row-actions\x22\x20role=\x22group\x22\x20aria-label=\x22' +
      _0x2aa416 +
      ' 对象状态">\n            <button type="button" class="storyboard-3d-object-state-button ' +
      (_0x24a4ea ? '' : 'is-off') +
      '" data-storyboard-3d-action="toggle-object-visibility" data-object-id="' +
      escapeHtml(_0x5db13c['id']) +
      '" aria-pressed="' +
      _0x24a4ea +
      '" aria-label="' +
      (_0x24a4ea ? '隐藏' : '显示') +
      '\x20' +
      _0x2aa416 +
      '" title="' +
      (_0x24a4ea ? '隐藏对象' : '显示对象') +
      '\x22>' +
      renderStoryboard3DControlIcon(_0x24a4ea ? 'eye' : 'eyeOff') +
      '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-object-state-button\x20' +
      (_0x176b39 ? 'is-locked' : '') +
      '" data-storyboard-3d-action="toggle-object-lock" data-object-id="' +
      escapeHtml(_0x5db13c['id']) +
      '" aria-pressed="' +
      _0x176b39 +
      '\x22\x20aria-label=\x22' +
      (_0x176b39 ? '解锁' : '锁定') +
      '\x20' +
      _0x2aa416 +
      '" title="' +
      (_0x176b39 ? '解锁对象' : '锁定对象') +
      '\x22>' +
      renderStoryboard3DControlIcon(_0x176b39 ? 'lock' : 'unlock') +
      '</button>\n            <button type="button" class="storyboard-3d-object-state-button is-delete" data-storyboard-3d-action="delete-object" data-object-id="' +
      escapeHtml(_0x5db13c['id']) +
      '" aria-label="删除 ' +
      _0x2aa416 +
      '" title="删除对象">×</button>\n          </span>\n        </div>'
    );
  })['join']('');
}
function renderShotStrip(_0xf51cc0, { timelineOpen: timelineOpen = ![] } = {}) {
  if (!_0xf51cc0) return '';
  const _0x2b253b =
      '<div class="storyboard-3d-shot-strip-heading">\n    <strong>' +
      escapeHtml(t('storyboard3d.editor.shots')) +
      '</strong>\n    <button type="button" class="storyboard-3d-shot-keyframe-trigger ' +
      (timelineOpen ? 'is-active' : '') +
      '\x22\x20data-storyboard-3d-action=\x22timeline-toggle-drawer\x22\x20aria-expanded=\x22' +
      timelineOpen +
      '\x22>关键帧</button>\x0a\x20\x20</div>',
    _0x5bb7d7 = _0xf51cc0['shots']
      ['map'](
        (_0x11d4dc, _0x3b4f0c) =>
          '<button type="button" draggable="true" class="storyboard-3d-shot-card ' +
          (_0x11d4dc['id'] === _0xf51cc0['activeShotId'] ? 'is-active' : '') +
          '" data-storyboard-3d-action="select-shot" data-shot-id="' +
          escapeHtml(_0x11d4dc['id']) +
          '" aria-pressed="' +
          (_0x11d4dc['id'] === _0xf51cc0['activeShotId']) +
          '">\n        <span class="storyboard-3d-shot-thumb">\n          ' +
          (_0x11d4dc['thumbnailUrl']
            ? '<img\x20src=\x22' +
              escapeHtml(_0x11d4dc['thumbnailUrl']) +
              '" alt="' +
              escapeHtml(_0x11d4dc['name']) +
              '\x22>'
            : '<span>' + escapeHtml(t('storyboard3d.editor.previewPending')) + '</span>') +
          '\n        </span>\n        <span class="storyboard-3d-shot-copy">\n          <small>' +
          escapeHtml(t('storyboard3d.editor.shotNumber', { index: _0x3b4f0c + 0x1 })) +
          '</small>\n          <strong>' +
          escapeHtml(_0x11d4dc['name']) +
          '</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
          escapeHtml(
            formatFocalLength(_0x11d4dc['camera']['focalLength']) + 'mm · ' + _0x11d4dc['shotSize'],
          ) +
          '</span>\n        </span>\n      </button>',
      )
      ['join'](''),
    _0x60dd63 = escapeHtml(t('storyboard3d.editor.addShot')),
    _0x1fc8ea = escapeHtml(t('storyboard3d.editor.addShotDescription'));
  return (
    '' +
    _0x2b253b +
    _0x5bb7d7 +
    '<button type="button" class="storyboard-3d-shot-add-card" data-storyboard-3d-action="add-shot" aria-label="' +
    _0x60dd63 +
    '" title="' +
    _0x1fc8ea +
    '\x22>' +
    renderStoryboard3DControlIcon('camera') +
    '<strong>' +
    _0x60dd63 +
    '</strong></button>'
  );
}
function renderShotTimelineDrawerHandle(_0x505f01, _0x5d4584) {
  const _0x5ce1df = _0x505f01 ? '拖拽调整关键帧区域高度，点击收起' : '向上拖拽调整关键帧区域高度，点击展开';
  return (
    '<button type="button" class="storyboard-3d-timeline-drawer-handle ' +
    (_0x505f01 ? 'is-open' : '') +
    '\x22\x20data-storyboard-3d-action=\x22timeline-toggle-drawer\x22\x20data-storyboard-3d-timeline-resize-handle\x20role=\x22separator\x22\x20aria-orientation=\x22horizontal\x22\x20aria-valuemin=\x22120\x22\x20aria-valuemax=\x22720\x22\x20aria-valuenow=\x22' +
    _0x5d4584 +
    '" aria-expanded="' +
    _0x505f01 +
    '" aria-label="' +
    _0x5ce1df +
    '">\n    <span class="storyboard-3d-timeline-drawer-grip" aria-hidden="true"></span>\n  </button>'
  );
}
function formatFocalLength(_0x42e6c) {
  const _0xce11b7 = Number(_0x42e6c);
  if (!Number['isFinite'](_0xce11b7)) return '35';
  const _0x231896 = Math['round'](_0xce11b7 * 0xa) / 0xa;
  return Number['isInteger'](_0x231896) ? String(_0x231896) : _0x231896['toFixed'](0x1);
}
function resolveStoryboard3DFocalPresetIndex(_0x1a3637) {
  const _0x540546 = Number(_0x1a3637);
  if (!Number['isFinite'](_0x540546)) return STORYBOARD_3D_FOCAL_LENGTH_PRESETS['indexOf'](0x23);
  return STORYBOARD_3D_FOCAL_LENGTH_PRESETS['reduce'](
    (_0x3a8bda, _0x26727c, _0x1766a8) =>
      Math['abs'](_0x26727c - _0x540546) <
      Math['abs'](STORYBOARD_3D_FOCAL_LENGTH_PRESETS[_0x3a8bda] - _0x540546)
        ? _0x1766a8
        : _0x3a8bda,
    0x0,
  );
}
function getStoryboard3DFocalPreset(_0x2571ef) {
  const _0x540d27 = Math['max'](
    0x0,
    Math['min'](STORYBOARD_3D_FOCAL_LENGTH_PRESETS['length'] - 0x1, Math['round'](Number(_0x2571ef) || 0x0)),
  );
  return STORYBOARD_3D_FOCAL_LENGTH_PRESETS[_0x540d27];
}
function renderStoryboard3DFocalControl(_0x55d006, _0x23830e) {
  if (!_0x55d006) return '';
  const _0x1b9768 = resolveStoryboard3DFocalPresetIndex(_0x23830e),
    _0x33be94 = STORYBOARD_3D_FOCAL_LENGTH_PRESETS[_0x1b9768],
    _0x43a329 = _0x55d006?.['background']?.['lockedCamera'] === !![],
    _0x333f17 = _0x43a329
      ? '背景机位已锁定，请先解除锁定再调整视口焦距'
      : '拖动调整视口焦距；添加摄像机时才会保存',
    _0x900d72 = [...STORYBOARD_3D_FOCAL_LENGTH_PRESETS]
      ['reverse']()
      ['map']((_0x5c2c70) => {
        const _0x3f1135 = _0x5c2c70 === _0x33be94 ? ' is-active' : '';
        return _0x5c2c70 === 0x23
          ? '<button type="button" class="storyboard-3d-focal-tick is-default' +
              _0x3f1135 +
              '" data-storyboard-3d-action="reset-focal-length" data-focal-length="35" aria-label="恢复默认焦距 35mm"><span aria-hidden="true">35</span><small aria-hidden="true">默认</small></button>'
          : '<span class="storyboard-3d-focal-tick' +
              _0x3f1135 +
              '" data-focal-length="' +
              _0x5c2c70 +
              '" aria-hidden="true">' +
              _0x5c2c70 +
              '</span>';
      })
      ['join']('');
  return (
    '<div class="storyboard-3d-focal-control" title="' +
    _0x333f17 +
    '">\n    <span class="storyboard-3d-focal-value">焦距 <output data-storyboard-3d-focal-output>' +
    _0x33be94 +
    'mm</output></span>\n    <span class="storyboard-3d-focal-slider-wrap">\n      <input type="range" min="0" max="' +
    (STORYBOARD_3D_FOCAL_LENGTH_PRESETS['length'] - 0x1) +
    '" step="1" value="' +
    _0x1b9768 +
    '\x22\x20data-storyboard-3d-focal-slider\x20aria-label=\x22镜头焦距\x22\x20aria-valuetext=\x22' +
    _0x33be94 +
    'mm" ' +
    (_0x43a329 ? 'disabled' : '') +
    '>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-focal-ticks\x22>' +
    _0x900d72 +
    '</span>\n    </span>\n  </div>'
  );
}
function createLocalId(_0x575002) {
  const _0xff2a2a = globalThis['crypto'];
  if (typeof _0xff2a2a?.['randomUUID'] === 'function') return _0x575002 + '-' + _0xff2a2a['randomUUID']();
  return (
    _0x575002 +
    '-' +
    Date['now']()['toString'](0x24) +
    '-' +
    Math['random']()['toString'](0x24)['slice'](0x2, 0x9)
  );
}
function renderVectorInputs(_0x297d2b, _0x1d8080, _0x172f96 = []) {
  const _0x327ba2 = _0x1d8080 === 'rotation';
  return ['x', 'y', 'z']
    ['map'](
      (_0x184df3, _0x5efd50) =>
        '<label><span>' +
        _0x184df3['toUpperCase']() +
        (_0x327ba2 ? '°' : '') +
        '</span><input type="number" step="' +
        (_0x327ba2 ? '1' : '0.01') +
        '\x22\x20value=\x22' +
        escapeHtml(
          (_0x327ba2
            ? (Number(_0x172f96[_0x5efd50] || 0x0) * 0xb4) / Math['PI']
            : Number(_0x172f96[_0x5efd50] || 0x0))['toFixed'](_0x327ba2 ? 0x1 : 0x2),
        ) +
        '" data-storyboard-3d-transform-input data-object-id="' +
        escapeHtml(_0x297d2b) +
        '" data-transform-field="' +
        _0x1d8080 +
        '" data-transform-axis="' +
        _0x5efd50 +
        '"></label>',
    )
    ['join']('');
}
function renderSelectedObjectInspector(
  _0x46d1d9,
  _0xe8b3b2 = 'Head',
  _0x1faea4 = null,
  _0xca506a = [],
  _0xb101a5 = null,
) {
  if (!_0x46d1d9)
    return (
      '<section class="storyboard-3d-inspector-card is-muted">\n      <small>' +
      escapeHtml(t('storyboard3d.editor.selection')) +
      '</small>\n      <strong>' +
      escapeHtml(t('storyboard3d.editor.noSelection')) +
      '</strong>\n      <p>' +
      escapeHtml(t('storyboard3d.editor.noSelectionDescription')) +
      '</p>\n    </section>'
    );
  const _0x8ab860 = getStoryboard3DObjectTransformCapabilities(_0x46d1d9),
    _0x2152e6 = { position: '位置', rotation: '旋转', scale: '缩放' },
    _0x22890e =
      _0x8ab860['fields']['length'] > 0x0
        ? _0x8ab860['fields']
            ['map'](
              (_0x2b49f6) =>
                '<div\x20class=\x22storyboard-3d-transform-group\x22><strong>' +
                _0x2152e6[_0x2b49f6] +
                '</strong><div>' +
                renderVectorInputs(_0x46d1d9['id'], _0x2b49f6, _0x46d1d9['transform']?.[_0x2b49f6]) +
                '</div></div>',
            )
            ['join']('')
        : '<p class="storyboard-3d-transform-unavailable">该对象没有可生效的空间变换；请编辑下方对象参数。</p>';
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-object-inspector">\n    <small>当前选择 · ' +
    escapeHtml(_0x46d1d9['type']) +
    '</small>\n    <input class="storyboard-3d-object-name-input" value="' +
    escapeHtml(_0x46d1d9['name']) +
    '" maxlength="120" data-storyboard-3d-object-name data-object-id="' +
    escapeHtml(_0x46d1d9['id']) +
    '" aria-label="对象名称">\n    <label class="storyboard-3d-object-parent"><span>所属分组</span><select data-storyboard-3d-object-parent data-object-id="' +
    escapeHtml(_0x46d1d9['id']) +
    '"><option value="">无分组</option>' +
    _0xca506a['filter']((_0x5e9c1e) => _0x5e9c1e['id'] !== _0x46d1d9['id'])
      ['map'](
        (_0x8d525f) =>
          '<option value="' +
          escapeHtml(_0x8d525f['id']) +
          '\x22\x20' +
          (_0x46d1d9['parentId'] === _0x8d525f['id'] ? 'selected' : '') +
          '>' +
          escapeHtml(_0x8d525f['name']) +
          '</option>',
      )
      ['join']('') +
    '</select></label>\n    ' +
    _0x22890e +
    '\n    ' +
    (_0x46d1d9['type'] === 'prop' ? renderPropControls(_0x46d1d9, _0x1faea4) : '') +
    '\n    ' +
    (_0x46d1d9['type'] === 'character' ? renderCharacterControls(_0x46d1d9, _0xe8b3b2, _0xb101a5) : '') +
    '\n    ' +
    (_0x46d1d9['type'] === 'light' ? renderLightControls(_0x46d1d9) : '') +
    '\n    ' +
    (_0x46d1d9['type'] === 'camera' ? renderCameraControls(_0x46d1d9) : '') +
    '\n    <div class="storyboard-3d-object-actions">\n      ' +
    (_0x46d1d9['type'] === 'group'
      ? '<button type="button" data-storyboard-3d-action="ungroup-object" data-object-id="' +
        escapeHtml(_0x46d1d9['id']) +
        '">解除分组</button>'
      : '') +
    '\n      <button type="button" data-storyboard-3d-action="duplicate-object" data-object-id="' +
    escapeHtml(_0x46d1d9['id']) +
    '">复制</button>\n      <button type="button" data-storyboard-3d-action="delete-object" data-object-id="' +
    escapeHtml(_0x46d1d9['id']) +
    '\x22>删除</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</section>'
  );
}
function renderCameraControls(_0x43dcde) {
  return (
    '<div class="storyboard-3d-character-controls storyboard-3d-camera-controls">\n    <label><span>焦距 mm</span><input type="number" min="1" max="200" step="1" value="' +
    escapeHtml(_0x43dcde['focalLength'] ?? 0x23) +
    '" data-storyboard-3d-camera-field="focalLength" data-object-id="' +
    escapeHtml(_0x43dcde['id']) +
    '"></label>\n    <label><span>宽高比</span><input type="text" value="' +
    escapeHtml(_0x43dcde['aspectRatio'] || '16:9') +
    '" data-storyboard-3d-camera-field="aspectRatio" data-object-id="' +
    escapeHtml(_0x43dcde['id']) +
    '"></label>\n    <label><span>近裁剪面</span><input type="number" min="0.001" step="0.01" value="' +
    escapeHtml(_0x43dcde['near'] ?? 0.1) +
    '\x22\x20data-storyboard-3d-camera-field=\x22near\x22\x20data-object-id=\x22' +
    escapeHtml(_0x43dcde['id']) +
    '"></label>\n    <label><span>远裁剪面</span><input type="number" min="1" step="1" value="' +
    escapeHtml(_0x43dcde['far'] ?? 0x3e8) +
    '" data-storyboard-3d-camera-field="far" data-object-id="' +
    escapeHtml(_0x43dcde['id']) +
    '"></label>\n    <p>该摄像机与对应 Shot 一对一绑定；移动、旋转和焦距修改会同步到镜头与摄像机关键帧。</p>\n  </div>'
  );
}
function renderPropControls(_0x3d12da, _0x403a22) {
  const _0x972c63 = _0x403a22?.['assetRecord'];
  return (
    '<div class="storyboard-3d-character-controls storyboard-3d-prop-controls">\n    <label><span>分类</span><input type="text" value="' +
    escapeHtml(_0x403a22?.['category'] || '道具') +
    '" readonly></label>\n    ' +
    (_0x972c63
      ? '<label><span>格式 / 三角面</span><input type="text" value="' +
        escapeHtml(_0x972c63['sourceFormat']['toUpperCase']() + ' · ' + _0x972c63['triangleCount']) +
        '" readonly></label>'
      : '') +
    '\n    <label><span>色调覆盖</span><input type="color" value="' +
    escapeHtml(_0x3d12da['tint'] || '#ffffff') +
    '\x22\x20data-storyboard-3d-prop-field=\x22tint\x22\x20data-object-id=\x22' +
    escapeHtml(_0x3d12da['id']) +
    '"></label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-prop-field="castShadow" data-object-id="' +
    escapeHtml(_0x3d12da['id']) +
    '\x22\x20' +
    (_0x3d12da['castShadow'] !== ![] ? 'checked' : '') +
    '>投射阴影</label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-prop-field="receiveShadow" data-object-id="' +
    escapeHtml(_0x3d12da['id']) +
    '\x22\x20' +
    (_0x3d12da['receiveShadow'] !== ![] ? 'checked' : '') +
    '>接收阴影</label>\n  </div>'
  );
}
function renderSelectOptions(_0x1f58e2, _0x102735) {
  return _0x1f58e2['map'](
    (_0x5cdb7a) =>
      '<option\x20value=\x22' +
      escapeHtml(_0x5cdb7a['id']) +
      '\x22\x20' +
      (_0x5cdb7a['id'] === _0x102735 ? 'selected' : '') +
      '>' +
      escapeHtml(_0x5cdb7a['name']) +
      '</option>',
  )['join']('');
}
const STORYBOARD_3D_EDITABLE_BONES = Object['freeze']([
    ['Head', '头部'],
    ['spine_02', '胸腔'],
    ['pelvis', '骨盆'],
    ['hand_l', '左手'],
    ['hand_r', '右手'],
    ['lowerarm_l', '左肘'],
    ['lowerarm_r', '右肘'],
    ['foot_l', '左脚'],
    ['foot_r', '右脚'],
    ['calf_l', '左膝'],
    ['calf_r', '右膝'],
  ]),
  STORYBOARD_3D_INSPECTOR_MIN_WIDTH = 0x118,
  STORYBOARD_3D_INSPECTOR_MAX_WIDTH = 0x230,
  STORYBOARD_3D_VIEWPORT_MIN_WIDTH = 0x1a4,
  STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH = 0xe,
  STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH = 0x168,
  STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH = 0x708,
  STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH = 0x118,
  STORYBOARD_3D_TIMELINE_MIN_HEIGHT = 0xdc,
  STORYBOARD_3D_TIMELINE_MAX_HEIGHT = 0x2d0,
  STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT = 0x154,
  STORYBOARD_3D_VIEWPORT_MIN_HEIGHT = 0xa0;
export function normalizeStoryboard3DInspectorWidth(_0x1351a0, _0x3a432d = 0x4b0) {
  const _0x3f9020 = Number(_0x3a432d),
    _0x142e45 = Number['isFinite'](_0x3f9020)
      ? _0x3f9020 - STORYBOARD_3D_VIEWPORT_MIN_WIDTH - STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH
      : STORYBOARD_3D_INSPECTOR_MAX_WIDTH,
    _0x270fab = Math['max'](
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math['min'](STORYBOARD_3D_INSPECTOR_MAX_WIDTH, _0x142e45),
    ),
    _0x5bacba = Number(_0x1351a0),
    _0x149491 = Math['min'](0x168, _0x270fab);
  return Math['round'](
    Math['max'](
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math['min'](_0x270fab, Number['isFinite'](_0x5bacba) ? _0x5bacba : _0x149491),
    ),
  );
}
export function resolveStoryboard3DViewportCenterPosition(_0x266c9b) {
  const _0x1bf4f3 = _0x266c9b?.['target'],
    _0x3f3dc8 = Array['isArray'](_0x1bf4f3) ? Number(_0x1bf4f3[0x0]) : Number(_0x1bf4f3?.['x']),
    _0x225af9 = Array['isArray'](_0x1bf4f3) ? Number(_0x1bf4f3[0x2]) : Number(_0x1bf4f3?.['z']);
  return [
    Number['isFinite'](_0x3f3dc8) ? _0x3f3dc8 : 0x0,
    0x0,
    Number['isFinite'](_0x225af9) ? _0x225af9 : 0x0,
  ];
}
export function normalizeStoryboard3DRightSidebarWidth(_0x4783c4, _0x47ceeb = 0x5a0, _0x386054 = 'assets') {
  const _0x434687 = Number(_0x47ceeb),
    _0x16973a = Number['isFinite'](_0x434687)
      ? _0x434687 - STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH
      : STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH,
    _0x5a6066 = Math['max'](
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math['min'](STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH, _0x16973a),
    ),
    _0x594d11 = _0x4783c4 == null ? Number['NaN'] : Number(_0x4783c4),
    _0x43c46f = _0x386054 !== 'assets',
    _0x5a519a = Math['min'](
      _0x43c46f ? 0x1e0 : 0x3c0,
      Math['max'](
        STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
        Number['isFinite'](_0x434687) ? _0x434687 * (_0x43c46f ? 0.21 : 0.42) : _0x43c46f ? 0x168 : 0x2d0,
      ),
    );
  return Math['round'](
    Math['max'](
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math['min'](_0x5a6066, Number['isFinite'](_0x594d11) ? _0x594d11 : _0x5a519a),
    ),
  );
}
export function normalizeStoryboard3DTimelineHeight(_0x256bf1, _0x46cf0b = 0x384) {
  const _0x66376c = Number(_0x46cf0b),
    _0x10b4e7 = Number['isFinite'](_0x66376c)
      ? Math['min'](
          STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
          Math['max'](0x78, _0x66376c - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT),
        )
      : STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
    _0x393893 = Number['isFinite'](_0x66376c)
      ? _0x66376c - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT
      : STORYBOARD_3D_TIMELINE_MAX_HEIGHT,
    _0x2eafe5 = Math['max'](_0x10b4e7, Math['min'](STORYBOARD_3D_TIMELINE_MAX_HEIGHT, _0x393893)),
    _0x777c51 = _0x256bf1 == null ? Number['NaN'] : Number(_0x256bf1),
    _0x5af6dd = Math['min'](STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT, _0x2eafe5);
  return Math['round'](
    Math['max'](_0x10b4e7, Math['min'](_0x2eafe5, Number['isFinite'](_0x777c51) ? _0x777c51 : _0x5af6dd)),
  );
}
function getCharacterPoseStatusText(_0xb0a470 = {}) {
  if (_0xb0a470['status'] === 'running') return '正在本地识别“' + (_0xb0a470['fileName'] || '参考图') + '”…';
  if (_0xb0a470['status'] === 'error') return _0xb0a470['error'] || '姿势识别失败。';
  if (_0xb0a470['status'] === 'success') {
    const _0x40cce1 = Math['round']((Number(_0xb0a470['confidence']) || 0x0) * 0x64),
      _0xce2a63 = _0xb0a470['warningCount'] > 0x0 ? ' · 部分遮挡关节已跳过' : '';
    return (
      '已应用 ' + (Number(_0xb0a470['boneCount']) || 0x0) + ' 个骨骼 · 置信度 ' + _0x40cce1 + '%' + _0xce2a63
    );
  }
  return '支持单人全身\x20JPG、PNG、WebP；图片仅在本机处理。';
}
function reconcileCharacterPoseState(_0x4ff658, _0x543b23) {
  if (
    _0x543b23?.['status'] === 'success' &&
    _0x543b23['poseSignature'] !== createStoryboard3DBoneOverridesSignature(_0x4ff658?.['boneOverrides'])
  )
    return { status: 'idle', objectId: String(_0x4ff658?.['id'] || '') };
  return _0x543b23;
}
function renderCharacterControls(_0x49cec9, _0x363e43 = 'Head', _0x282543 = null) {
  const _0x513459 =
      STORYBOARD_3D_ACTIONS['find']((_0x22e521) => _0x22e521['id'] === _0x49cec9['actionId']) ||
      STORYBOARD_3D_ACTIONS[0x0],
    _0x3d9fdd = quaternionToStoryboard3DEuler(_0x49cec9['boneOverrides']?.[_0x363e43]),
    _0x2423c2 = _0x282543 || { status: 'idle' },
    _0x5b4d8d = _0x2423c2['status'] === 'running',
    _0x2732e4 = Object['keys'](_0x49cec9['boneOverrides'] || {})['length'] > 0x0;
  return (
    '<div class="storyboard-3d-character-controls">\n    <label><span>人偶外观</span><select data-storyboard-3d-character-field="characterStyle" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22><option\x20value=\x22articulated\x22\x20' +
    (_0x49cec9['characterStyle'] !== 'anatomical' ? 'selected' : '') +
    '>关节预演人偶</option><option value="anatomical" ' +
    (_0x49cec9['characterStyle'] === 'anatomical' ? 'selected' : '') +
    '>人体模型</option></select></label>\n    <label><span>体型</span><select data-storyboard-3d-character-field="bodyPresetId" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    renderSelectOptions(STORYBOARD_3D_BODY_PRESETS, _0x49cec9['bodyPresetId']) +
    '</select></label>\n    <label><span>动作</span><select data-storyboard-3d-character-field="actionId" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    renderSelectOptions(STORYBOARD_3D_ACTIONS, _0x49cec9['actionId']) +
    '</select></label>\n    <label><span>左手</span><select data-storyboard-3d-character-field="leftHandPoseId" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    renderSelectOptions(STORYBOARD_3D_HAND_POSES, _0x49cec9['leftHandPoseId']) +
    '</select></label>\x0a\x20\x20\x20\x20<label><span>右手</span><select\x20data-storyboard-3d-character-field=\x22rightHandPoseId\x22\x20data-object-id=\x22' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    renderSelectOptions(STORYBOARD_3D_HAND_POSES, _0x49cec9['rightHandPoseId']) +
    '</select></label>\n    <label><span>发型</span><input type="text" maxlength="80" value="' +
    escapeHtml(_0x49cec9['hairId'] || '') +
    '\x22\x20placeholder=\x22默认\x22\x20data-storyboard-3d-character-field=\x22hairId\x22\x20data-object-id=\x22' +
    escapeHtml(_0x49cec9['id']) +
    '"></label>\n    <label class="is-wide"><span>附件 ID（逗号分隔）</span><input type="text" maxlength="500" value="' +
    escapeHtml((_0x49cec9['attachmentIds'] || [])['join'](',\x20')) +
    '" placeholder="hat-01, bag-02" data-storyboard-3d-character-attachments data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22></label>\x0a\x20\x20\x20\x20<label\x20class=\x22is-wide\x22><span>动作时间\x20' +
    Number(_0x49cec9['actionTime'] || 0x0)['toFixed'](0x2) +
    's</span><input type="range" min="0" max="' +
    escapeHtml(_0x513459['duration'] || 0x1) +
    '" step="0.01" value="' +
    escapeHtml(_0x49cec9['actionTime'] || 0x0) +
    '" data-storyboard-3d-character-time data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '"></label>\n    <button type="button" data-storyboard-3d-action="toggle-character-play" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    (_0x49cec9['actionPlaying'] ? '暂停动作' : '播放动作') +
    '</button>\x0a\x20\x20\x20\x20<section\x20class=\x22storyboard-3d-character-pose-from-image\x22\x20data-storyboard-3d-character-pose\x20data-object-id=\x22' +
    escapeHtml(_0x49cec9['id']) +
    '" data-pose-status="' +
    escapeHtml(_0x2423c2['status'] || 'idle') +
    '" data-has-pose="' +
    _0x2732e4 +
    '\x22\x20aria-busy=\x22' +
    _0x5b4d8d +
    '">\n      <div>\n        <strong>参考图姿势</strong>\n        <small>MediaPipe Heavy · 本地单人识别</small>\n      </div>\n      <div class="storyboard-3d-character-pose-actions">\n        <button type="button" class="is-primary" data-storyboard-3d-action="extract-character-pose" data-object-id="' +
    escapeHtml(_0x49cec9['id']) +
    '\x22\x20' +
    (_0x5b4d8d ? 'disabled' : '') +
    '>' +
    (_0x5b4d8d ? '识别中…' : '从图片提取姿势') +
    '</button>\n        <button type="button" data-storyboard-3d-action="' +
    (_0x5b4d8d ? 'cancel-character-pose' : 'reset-character-pose') +
    '\x22\x20data-object-id=\x22' +
    escapeHtml(_0x49cec9['id']) +
    '\x22\x20' +
    (!_0x5b4d8d && !_0x2732e4 ? 'disabled' : '') +
    '>' +
    (_0x5b4d8d ? '取消识别' : '重置骨骼') +
    '</button>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<p\x20data-storyboard-3d-character-pose-status\x20role=\x22status\x22\x20aria-live=\x22polite\x22>' +
    escapeHtml(getCharacterPoseStatusText(_0x2423c2)) +
    '</p>\x0a\x20\x20\x20\x20</section>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-bone-editor\x22>\x0a\x20\x20\x20\x20\x20\x20<label><span>骨骼微调</span><select\x20data-storyboard-3d-bone-select\x20data-object-id=\x22' +
    escapeHtml(_0x49cec9['id']) +
    '\x22>' +
    STORYBOARD_3D_EDITABLE_BONES['map'](
      ([_0x5974c3, _0x2c5304]) =>
        '<option value="' +
        _0x5974c3 +
        '\x22\x20' +
        (_0x5974c3 === _0x363e43 ? 'selected' : '') +
        '>' +
        _0x2c5304 +
        '</option>',
    )['join']('') +
    '</select></label>\n      <div>' +
    ['x', 'y', 'z']
      ['map'](
        (_0x5a3d9d) =>
          '<label><span>' +
          _0x5a3d9d['toUpperCase']() +
          '°</span><input\x20type=\x22number\x22\x20min=\x22-180\x22\x20max=\x22180\x22\x20step=\x221\x22\x20value=\x22' +
          escapeHtml(Math['round'](((_0x3d9fdd[_0x5a3d9d] || 0x0) * 0xb4) / Math['PI'])) +
          '" data-storyboard-3d-bone-axis="' +
          _0x5a3d9d +
          '" data-bone-name="' +
          escapeHtml(_0x363e43) +
          '" data-object-id="' +
          escapeHtml(_0x49cec9['id']) +
          '"></label>',
      )
      ['join']('') +
    '</div>\n    </div>\n  </div>'
  );
}
function renderLightControls(_0x2ac24d) {
  return (
    '<div\x20class=\x22storyboard-3d-character-controls\x20storyboard-3d-light-controls\x22>\x0a\x20\x20\x20\x20<label><span>类型</span><select\x20data-storyboard-3d-light-field=\x22lightType\x22\x20data-object-id=\x22' +
    escapeHtml(_0x2ac24d['id']) +
    '">\n      ' +
    ['ambient', 'directional', 'point', 'spot']
      ['map'](
        (_0x189183) =>
          '<option\x20value=\x22' +
          _0x189183 +
          '\x22\x20' +
          (_0x2ac24d['lightType'] === _0x189183 ? 'selected' : '') +
          '>' +
          _0x189183 +
          '</option>',
      )
      ['join']('') +
    '\x0a\x20\x20\x20\x20</select></label>\x0a\x20\x20\x20\x20<label><span>强度</span><input\x20type=\x22number\x22\x20min=\x220\x22\x20max=\x22100\x22\x20step=\x220.1\x22\x20value=\x22' +
    escapeHtml(_0x2ac24d['intensity'] ?? 0x1) +
    '" data-storyboard-3d-light-field="intensity" data-object-id="' +
    escapeHtml(_0x2ac24d['id']) +
    '\x22></label>\x0a\x20\x20\x20\x20<label><span>颜色</span><input\x20type=\x22color\x22\x20value=\x22' +
    escapeHtml(_0x2ac24d['color'] || '#ffffff') +
    '" data-storyboard-3d-light-field="color" data-object-id="' +
    escapeHtml(_0x2ac24d['id']) +
    '"></label>\n    <label><span>衰减距离</span><input type="number" min="0" max="10000" step="0.1" value="' +
    escapeHtml(_0x2ac24d['distance'] ?? 0x0) +
    '\x22\x20data-storyboard-3d-light-field=\x22distance\x22\x20data-object-id=\x22' +
    escapeHtml(_0x2ac24d['id']) +
    '"></label>\n    <label><span>衰减系数</span><input type="number" min="0" max="10" step="0.1" value="' +
    escapeHtml(_0x2ac24d['decay'] ?? 0x2) +
    '" data-storyboard-3d-light-field="decay" data-object-id="' +
    escapeHtml(_0x2ac24d['id']) +
    '"></label>\n    <label><span>聚光角度°</span><input type="number" min="1" max="179" step="1" value="' +
    escapeHtml(Math['round'](((_0x2ac24d['angle'] ?? Math['PI'] / 0x6) * 0xb4) / Math['PI'])) +
    '" data-storyboard-3d-light-field="angleDegrees" data-object-id="' +
    escapeHtml(_0x2ac24d['id']) +
    '"></label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-light-field="castShadow" data-object-id="' +
    escapeHtml(_0x2ac24d['id']) +
    '\x22\x20' +
    (_0x2ac24d['castShadow'] === !![] ? 'checked' : '') +
    '>投射阴影</label>\n  </div>'
  );
}
function renderBackgroundCalibrationGuide(_0x276c23) {
  const _0x190971 = normalizeStoryboard3DBackgroundCalibration(_0x276c23);
  if (!_0x190971['imageUrl']) return '';
  const _0x1d0fe8 = computeStoryboard3DBackgroundGuideGeometry(_0x190971),
    [_0x1f913a, _0x10aabe] = _0x1d0fe8['vanishingPoint'],
    _0x42fb15 = Math['round'](_0x190971['calibrationConfidence'] * 0x64);
  return (
    '<div class="storyboard-3d-background-calibration-guide" aria-hidden="true">\n    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">\n      <polygon class="storyboard-3d-background-ground-region" data-storyboard-3d-background-ground-region points="' +
    _0x1d0fe8['groundPoints'] +
    '"></polygon>\n      <line class="storyboard-3d-background-axis" data-storyboard-3d-background-axis-left x1="' +
    _0x1f913a +
    '" y1="' +
    _0x10aabe +
    '" x2="0" y2="1000"></line>\n      <line class="storyboard-3d-background-axis" data-storyboard-3d-background-axis-right x1="' +
    _0x1f913a +
    '" y1="' +
    _0x10aabe +
    '" x2="1000" y2="1000"></line>\n      <line class="storyboard-3d-background-horizon" data-storyboard-3d-background-horizon-line x1="0" y1="' +
    _0x1d0fe8['leftY'] +
    '" x2="1000" y2="' +
    _0x1d0fe8['rightY'] +
    '"></line>\n      <line class="storyboard-3d-background-horizon-hit" data-storyboard-3d-background-horizon-line data-storyboard-3d-background-drag="horizon" x1="0" y1="' +
    _0x1d0fe8['leftY'] +
    '" x2="1000" y2="' +
    _0x1d0fe8['rightY'] +
    '\x22></line>\x0a\x20\x20\x20\x20\x20\x20<circle\x20class=\x22storyboard-3d-background-vanishing-point\x22\x20data-storyboard-3d-background-vanishing-point\x20cx=\x22' +
    _0x1f913a +
    '" cy="' +
    _0x10aabe +
    '" r="9"></circle>\n      <circle class="storyboard-3d-background-vanishing-point-hit" data-storyboard-3d-background-vanishing-point data-storyboard-3d-background-drag="vanishing-point" cx="' +
    _0x1f913a +
    '\x22\x20cy=\x22' +
    _0x10aabe +
    '\x22\x20r=\x2224\x22></circle>\x0a\x20\x20\x20\x20</svg>\x0a\x20\x20\x20\x20<span\x20data-storyboard-3d-background-guide-status>拖动青线或黄点调整\x20·\x20' +
    _0x42fb15 +
    '%</span>\x0a\x20\x20</div>'
  );
}
function renderSceneControls(_0x326553, _0xd727ac, _0x511a73 = {}, _0xf72154 = ![]) {
  const _0x53c6c5 = normalizeStoryboard3DBackgroundCalibration(_0x326553?.['background']),
    _0x4b497b = Math['max'](
      0x0,
      Math['min'](
        0x1,
        _0x53c6c5['horizonY'] + _0x53c6c5['horizonSlope'] * (_0x53c6c5['vanishingPoint'][0x0] - 0.5),
      ),
    );
  return (
    '<section\x20class=\x22storyboard-3d-inspector-card\x20storyboard-3d-scene-controls\x22>\x0a\x20\x20\x20\x20<small>场景设置</small>\x0a\x20\x20\x20\x20<input\x20class=\x22storyboard-3d-scene-name-input\x22\x20type=\x22text\x22\x20maxlength=\x22120\x22\x20value=\x22' +
    escapeHtml(_0x326553?.['name'] || '') +
    '\x22\x20data-storyboard-3d-scene-name\x20data-scene-id=\x22' +
    escapeHtml(_0x326553?.['id'] || '') +
    '" aria-label="场景名称">\n    <details class="storyboard-3d-scene-environment" data-storyboard-3d-scene-environment ' +
    (_0xf72154 ? 'open' : '') +
    '>\n      <summary data-storyboard-3d-action="toggle-scene-environment"><span>环境与参考背景</span><small>展开设置</small></summary>\n      <div class="storyboard-3d-scene-control-grid">\n      <label><span>环境</span><select data-storyboard-3d-scene-field="environmentType">\n        ' +
    ['empty', 'outdoor', 'indoor', 'studio']
      ['map'](
        (_0x15e5db) =>
          '<option value="' +
          _0x15e5db +
          '\x22\x20' +
          (_0x326553?.['environment']?.['type'] === _0x15e5db ? 'selected' : '') +
          '>' +
          _0x15e5db +
          '</option>',
      )
      ['join']('') +
    '\n      </select></label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-scene-field="showGrid" ' +
    (_0x326553?.['environment']?.['showGrid'] !== ![] ? 'checked' : '') +
    '>显示网格</label>\x0a\x20\x20\x20\x20\x20\x20<label\x20class=\x22is-check\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-scene-field=\x22showOutline\x22\x20' +
    (_0x326553?.['environment']?.['showOutline'] !== ![] ? 'checked' : '') +
    '>选择描边</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-scene-field="enableShadows" ' +
    (_0x326553?.['environment']?.['enableShadows'] !== ![] ? 'checked' : '') +
    '>启用阴影</label>\n      <label class="is-wide"><span>参考背景 URL</span><input type="url" value="' +
    escapeHtml(_0x53c6c5['imageUrl']) +
    '" placeholder="https://…" data-storyboard-3d-background-field="imageUrl"></label>\n      <label><span>水平 FOV</span><input type="number" min="10" max="170" step="1" value="' +
    _0x53c6c5['horizontalFov'] +
    '" data-storyboard-3d-background-field="horizontalFov"></label>\n      <label><span>垂直 FOV</span><input type="number" min="10" max="170" step="1" value="' +
    (_0x53c6c5['verticalFov'] || 0x28) +
    '" data-storyboard-3d-background-field="verticalFov"></label>\n      <label><span>地平线</span><input type="number" min="0" max="1" step="0.01" value="' +
    _0x53c6c5['horizonY'] +
    '" data-storyboard-3d-background-field="horizonY"></label>\n      <label><span>地平线倾斜</span><input type="number" min="-1" max="1" step="0.01" value="' +
    _0x53c6c5['horizonSlope'] +
    '" data-storyboard-3d-background-field="horizonSlope"></label>\n      <label><span>相机高度 m</span><input type="number" min="0.2" max="20" step="0.1" value="' +
    _0x53c6c5['cameraHeight'] +
    '\x22\x20data-storyboard-3d-background-field=\x22cameraHeight\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label><span>背景缩放</span><input\x20type=\x22number\x22\x20min=\x220.1\x22\x20max=\x2210\x22\x20step=\x220.1\x22\x20value=\x22' +
    _0x53c6c5['imageScale'] +
    '\x22\x20data-storyboard-3d-background-field=\x22imageScale\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label><span>消失点\x20X</span><input\x20type=\x22number\x22\x20min=\x220\x22\x20max=\x221\x22\x20step=\x220.01\x22\x20value=\x22' +
    _0x53c6c5['vanishingPoint'][0x0] +
    '\x22\x20data-storyboard-3d-background-field=\x22vanishingPointX\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label><span>消失点\x20Y（自动）</span><input\x20type=\x22number\x22\x20value=\x22' +
    _0x4b497b['toFixed'](0x3) +
    '" disabled></label>\n      <label><span>背景偏移 X</span><input type="number" min="-2" max="2" step="0.01" value="' +
    _0x53c6c5['imageOffset'][0x0] +
    '" data-storyboard-3d-background-field="imageOffsetX"></label>\n      <label><span>背景偏移 Y</span><input type="number" min="-2" max="2" step="0.01" value="' +
    _0x53c6c5['imageOffset'][0x1] +
    '\x22\x20data-storyboard-3d-background-field=\x22imageOffsetY\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label\x20class=\x22is-check\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-background-lock\x20' +
    (_0x53c6c5['lockedCamera'] ? 'checked' : '') +
    '\x20' +
    (!_0x53c6c5['imageUrl'] ? 'disabled' : '') +
    '>锁定背景机位</label>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</details>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-viewport-settings\x22>\x0a\x20\x20\x20\x20\x20\x20<label><span>变换空间</span><select\x20data-storyboard-3d-viewport-setting=\x22transformSpace\x22><option\x20value=\x22world\x22\x20' +
    (_0x511a73['transformSpace'] !== 'local' ? 'selected' : '') +
    '>世界</option><option value="local" ' +
    (_0x511a73['transformSpace'] === 'local' ? 'selected' : '') +
    '>本地</option></select></label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="groundLock" ' +
    (_0x511a73['groundLock'] ? 'checked' : '') +
    '>地面吸附</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="uniformScale" ' +
    (_0x511a73['uniformScale'] ? 'checked' : '') +
    '>均匀缩放</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="snapEnabled" ' +
    (_0x511a73['snapEnabled'] ? 'checked' : '') +
    '>启用吸附</label>\n      <label><span>移动步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(_0x511a73['translationSnap'] || 0.25) +
    '" data-storyboard-3d-viewport-setting="translationSnap"></label>\n      <label><span>旋转步长°</span><input type="number" min="1" max="180" step="1" value="' +
    escapeHtml(Math['round'](((_0x511a73['rotationSnap'] || Math['PI'] / 0xc) * 0xb4) / Math['PI'])) +
    '" data-storyboard-3d-viewport-setting="rotationSnapDegrees"></label>\n      <label><span>缩放步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(_0x511a73['scaleSnap'] || 0.1) +
    '" data-storyboard-3d-viewport-setting="scaleSnap"></label>\n    </div>\n    <div class="storyboard-3d-scene-control-actions">\n      <button type="button" data-storyboard-3d-action="add-light">添加灯光</button>\n      <button type="button" data-storyboard-3d-action="upload-background">上传背景</button>\n      <button type="button" data-storyboard-3d-action="analyze-background" ' +
    (_0x53c6c5['binaryAssetId'] ? '' : 'disabled') +
    '>重新自动匹配</button>\n      <button type="button" data-storyboard-3d-action="clear-background" ' +
    (_0x53c6c5['imageUrl'] ? '' : 'disabled') +
    '>清除背景</button>\n      <small>' +
    (_0x53c6c5['lockedCamera']
      ? '已锁定 ' +
        escapeHtml(formatFocalLength(_0xd727ac?.['camera']?.['focalLength']) + 'mm') +
        ' · 匹配度 ' +
        Math['round'](_0x53c6c5['calibrationConfidence'] * 0x64) +
        '%'
      : '调整地平线、消失点和相机高度后再锁定') +
    '</small>\n    </div>\n  </section>'
  );
}
function renderNavigationSettings(
  _0x2f3472,
  { open: open = ![], viewportSettings: viewportSettings = {} } = {},
) {
  const _0x5945e1 =
      STORYBOARD_3D_NAVIGATION_PRESETS[_0x2f3472['preset']] || STORYBOARD_3D_NAVIGATION_PRESETS['unity'],
    _0x289d15 = Object['values'](STORYBOARD_3D_NAVIGATION_PRESETS)
      ['map'](
        (_0x17ed54) =>
          '<label class="storyboard-3d-navigation-preset ' +
          (_0x17ed54['id'] === _0x5945e1['id'] ? 'is-active' : '') +
          '">\n      <input type="radio" name="storyboard-3d-navigation-preset" value="' +
          escapeHtml(_0x17ed54['id']) +
          '\x22\x20data-storyboard-3d-navigation-preset\x20' +
          (_0x17ed54['id'] === _0x5945e1['id'] ? 'checked' : '') +
          '>\n      <strong>' +
          escapeHtml(_0x17ed54['label']) +
          '</strong>\n      <span>' +
          escapeHtml(_0x17ed54['summary']) +
          '</span>\x0a\x20\x20\x20\x20</label>',
      )
      ['join'](''),
    _0x56eb1d = (_0x23d709, _0x1c6f4d) =>
      '<label class="storyboard-3d-navigation-slider">\n    <span>' +
      escapeHtml(_0x1c6f4d) +
      '\x20<output\x20data-storyboard-3d-navigation-output=\x22' +
      _0x23d709 +
      '\x22>' +
      Number(_0x2f3472[_0x23d709])['toFixed'](0x2) +
      '×</output></span>\n    <input type="range" min="0.2" max="3" step="0.05" value="' +
      escapeHtml(_0x2f3472[_0x23d709]) +
      '" data-storyboard-3d-navigation-setting="' +
      _0x23d709 +
      '">\n  </label>';
  return (
    '<details class="storyboard-3d-global-settings" ' +
    (open ? 'open' : '') +
    '>\n    <summary title="3D 操作习惯设置 (K)" aria-keyshortcuts="K"><span aria-hidden="true">⚙</span>全局设置<small data-storyboard-3d-navigation-current>' +
    escapeHtml(_0x5945e1['label']) +
    '</small></summary>\n    <section class="storyboard-3d-global-settings-panel" aria-label="3D 全局操作设置">\n      <header><div><strong>视口操作习惯</strong><span>每次只启用一套映射，设置会保存到本机。</span></div></header>\n      <div class="storyboard-3d-navigation-presets">' +
    _0x289d15 +
    '</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-navigation-tuning\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    _0x56eb1d('orbitSensitivity', '环绕灵敏度') +
    '\n        ' +
    _0x56eb1d('panSensitivity', '平移灵敏度') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    _0x56eb1d('zoomSensitivity', '缩放灵敏度') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-navigation-setting=\x22invertOrbitX\x22\x20' +
    (_0x2f3472['invertOrbitX'] ? 'checked' : '') +
    '>反向环绕 X</label>\n        <label><input type="checkbox" data-storyboard-3d-navigation-setting="invertOrbitY" ' +
    (_0x2f3472['invertOrbitY'] ? 'checked' : '') +
    '>反向环绕 Y</label>\n        <label><input type="checkbox" data-storyboard-3d-navigation-setting="invertWheel" ' +
    (_0x2f3472['invertWheel'] ? 'checked' : '') +
    '>反向滚轮缩放</label>\n      </div>\n      <header><div><strong>对象变换</strong><span>吸附与变换偏好会保存到本机；地面吸附按模型可见底部对齐。</span></div></header>\n      <div class="storyboard-3d-viewport-settings">\n        <label><span>变换空间</span><select data-storyboard-3d-viewport-setting="transformSpace"><option value="world" ' +
    (viewportSettings['transformSpace'] !== 'local' ? 'selected' : '') +
    '>世界</option><option value="local" ' +
    (viewportSettings['transformSpace'] === 'local' ? 'selected' : '') +
    '>本地</option></select></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label\x20class=\x22is-check\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-viewport-setting=\x22groundLock\x22\x20' +
    (viewportSettings['groundLock'] ? 'checked' : '') +
    '>地面吸附</label>\n        <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="uniformScale" ' +
    (viewportSettings['uniformScale'] ? 'checked' : '') +
    '>均匀缩放</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label\x20class=\x22is-check\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-viewport-setting=\x22snapEnabled\x22\x20' +
    (viewportSettings['snapEnabled'] ? 'checked' : '') +
    '>启用步进吸附</label>\n        <label><span>移动步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(viewportSettings['translationSnap'] || 0.25) +
    '" data-storyboard-3d-viewport-setting="translationSnap"></label>\n        <label><span>旋转步长°</span><input type="number" min="1" max="180" step="1" value="' +
    escapeHtml(Math['round'](((viewportSettings['rotationSnap'] || Math['PI'] / 0xc) * 0xb4) / Math['PI'])) +
    '\x22\x20data-storyboard-3d-viewport-setting=\x22rotationSnapDegrees\x22></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><span>缩放步长</span><input\x20type=\x22number\x22\x20min=\x220.01\x22\x20max=\x2210\x22\x20step=\x220.01\x22\x20value=\x22' +
    escapeHtml(viewportSettings['scaleSnap'] || 0.1) +
    '" data-storyboard-3d-viewport-setting="scaleSnap"></label>\n      </div>\n    </section>\n  </details>'
  );
}
const STORYBOARD_3D_TOOL_LABELS = Object['freeze']({
    select: '选择 / 框选',
    move: '移动',
    rotate: '旋转',
    scale: '缩放',
  }),
  STORYBOARD_3D_SELECT_MOVE_TOOLS = new Set(['select', 'move']);
function renderStoryboard3DControlIcon(_0x3b0e6d) {
  const _0x219e00 = {
    select: '<path d="M5 3.5 16.5 12l-5.1 1.2L9.2 19 5 3.5Z"/><path d="M18 5h2v2M20 17v2h-2M6 19H4v-2"/>',
    move: '<path d="M12 3v18M3 12h18"/><path d="m12 3-2.5 2.5M12 3l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5"/>',
    rotate: '<path d="M19 10a7.5 7.5 0 1 0 .2 4.7"/><path d="m15 5 4.8.2L19.5 10"/>',
    scale:
      '<path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"/><path d="m9 9-4-4m10 4 4-4m-4 10 4 4M9 15l-4 4"/>',
    camera:
      '<rect\x20x=\x223\x22\x20y=\x227\x22\x20width=\x2214\x22\x20height=\x2211\x22\x20rx=\x222\x22/><path\x20d=\x22m17\x2010\x204-2v9l-4-2\x22/><circle\x20cx=\x2210\x22\x20cy=\x2212.5\x22\x20r=\x222.5\x22/>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/>',
    eyeOff:
      '<path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.7 3.3M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5M9.9 9.8a3 3 0 0 0 4.2 4.2"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
    unlock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2M12 14v2"/>',
    light:
      '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    background:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4.5 18 5-5 3.5 3 2.5-2.5 4 4"/>',
    fly: '<path d="m4 12 16-7-5.5 14-2.2-5.1L7 11.7 4 12Z"/><path d="m12.3 13.9 2.2-8.9"/>',
    perspective: '<path d="m5 7 7-4 7 4v10l-7 4-7-4V7Z"/><path d="m5 7 7 4 7-4M12 11v10"/>',
    top: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 8h8v8H8z"/>',
    front:
      '<rect\x20x=\x224\x22\x20y=\x224\x22\x20width=\x2216\x22\x20height=\x2216\x22\x20rx=\x221.5\x22/><path\x20d=\x22M8\x208h8v8H8zM8\x2012h8\x22/>',
    right: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 8v8M8 8h8v8H8z"/>',
    fit: '<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/><path d="m4 8 5-5m7 0 5 5m0 8-5 5M9 21l-5-5"/>',
    focus:
      '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3"/>',
    transformSpace:
      '<path d="M5 19V8m0 11h11"/><path d="m5 8-2 3m2-3 2 3M16 19l-3-2m3 2-3 2"/><circle cx="5" cy="19" r="1"/>',
    snap: '<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h4M14 7h4"/>',
    ground: '<path d="M3 18h18M6 14h12"/><path d="M12 3v11m-4-4 4 4 4-4"/>',
    uniform:
      '<rect x="5" y="5" width="14" height="14"/><path d="M9 5V3m6 2V3M9 21v-2m6 2v-2M5 9H3m2 6H3m18-6h-2m2 6h-2"/>',
  };
  return (
    '<svg\x20class=\x22storyboard-3d-control-icon\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.7\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22\x20aria-hidden=\x22true\x22\x20focusable=\x22false\x22>' +
    (_0x219e00[_0x3b0e6d] || '') +
    '</svg>'
  );
}
function renderStoryboard3DIconButton({
  action: _0x28401d,
  icon: _0x4117b5,
  label: _0x5555f2,
  shortcut: shortcut = '',
  active: active = null,
  dataTool: dataTool = '',
  dataView: dataView = '',
  dataShortcutTool: dataShortcutTool = '',
  dataSetting: dataSetting = '',
  className: className = '',
  disabled: disabled = ![],
  hidden: hidden = ![],
  title: title = '',
}) {
  const _0x54a240 = ['storyboard-3d-icon-button', className, active === !![] ? 'is-active' : '']
      ['filter'](Boolean)
      ['join']('\x20'),
    _0xd973fc = dataTool ? '\x20data-tool=\x22' + escapeHtml(dataTool) + '\x22' : '',
    _0x43e8b1 = dataView ? ' data-view="' + escapeHtml(dataView) + '\x22' : '',
    _0x25bfd0 = dataShortcutTool
      ? '\x20data-storyboard-3d-tool-shortcut=\x22' + escapeHtml(dataShortcutTool) + '\x22'
      : '',
    _0x18b114 = dataSetting
      ? ' data-storyboard-3d-viewport-setting-toggle="' + escapeHtml(dataSetting) + '\x22'
      : '',
    _0x2f599b = active === null ? '' : ' aria-pressed="' + active + '\x22',
    _0x3f131e = disabled ? ' disabled' : '',
    _0x54db7e = hidden ? '\x20hidden' : '',
    _0x2a63a9 = shortcut
      ? '<span\x20class=\x22storyboard-3d-control-shortcut\x22\x20aria-hidden=\x22true\x22>' +
        escapeHtml(shortcut) +
        '</span>'
      : '',
    _0x24c394 = shortcut ? ' aria-keyshortcuts="' + escapeHtml(shortcut) + '\x22' : '',
    _0x582be8 = title || (shortcut ? _0x5555f2 + '\x20(' + shortcut + ')' : _0x5555f2);
  return (
    '<button type="button" class="' +
    _0x54a240 +
    '\x22\x20data-storyboard-3d-action=\x22' +
    escapeHtml(_0x28401d) +
    '\x22' +
    _0xd973fc +
    _0x43e8b1 +
    _0x25bfd0 +
    _0x18b114 +
    _0x2f599b +
    _0x3f131e +
    _0x54db7e +
    _0x24c394 +
    '\x20aria-label=\x22' +
    escapeHtml(_0x5555f2) +
    '" title="' +
    escapeHtml(_0x582be8) +
    '\x22>' +
    renderStoryboard3DControlIcon(_0x4117b5) +
    _0x2a63a9 +
    '</button>'
  );
}
function renderStoryboard3DToolButton(_0x4d0e0c, _0x5b991c, _0x1c441a) {
  const _0x19e906 = _0x4d0e0c;
  return renderStoryboard3DIconButton({
    action: 'set-tool',
    icon: _0x4d0e0c,
    label: STORYBOARD_3D_TOOL_LABELS[_0x4d0e0c] || _0x4d0e0c,
    shortcut: getStoryboard3DToolShortcut(_0x1c441a, _0x19e906),
    active: _0x5b991c,
    dataTool: _0x4d0e0c,
    dataShortcutTool: _0x19e906,
  });
}
function renderStoryboard3DViewportSettingButton({
  field: _0x4b98d8,
  icon: _0x2eac09,
  label: _0x1044a9,
  active: _0x31758f,
  hidden: hidden = ![],
}) {
  return renderStoryboard3DIconButton({
    action: 'toggle-viewport-setting',
    icon: _0x2eac09,
    label: _0x1044a9,
    active: _0x31758f,
    dataSetting: _0x4b98d8,
    hidden: hidden,
  });
}
function renderShotInspector(_0x45b83b, _0x13f0fe) {
  if (!_0x45b83b || !_0x13f0fe) return '';
  const _0x3e3452 = _0x45b83b['shots']['findIndex']((_0xce5929) => _0xce5929['id'] === _0x13f0fe['id']);
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-shot-inspector">\n    <small>当前镜头 · ' +
    (_0x3e3452 + 0x1) +
    '/' +
    _0x45b83b['shots']['length'] +
    '</small>\n    <input type="text" maxlength="120" value="' +
    escapeHtml(_0x13f0fe['name']) +
    '" data-storyboard-3d-shot-field="name" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '\x22\x20aria-label=\x22镜头名称\x22>\x0a\x20\x20\x20\x20<textarea\x20rows=\x222\x22\x20maxlength=\x221000\x22\x20placeholder=\x22镜头说明\x22\x20data-storyboard-3d-shot-field=\x22description\x22\x20data-shot-id=\x22' +
    escapeHtml(_0x13f0fe['id']) +
    '\x22>' +
    escapeHtml(_0x13f0fe['description'] || '') +
    '</textarea>\n    <div class="storyboard-3d-shot-inspector-meta"><span>' +
    escapeHtml(_0x13f0fe['shotSize']) +
    '</span><span>' +
    escapeHtml(_0x13f0fe['shotAngle']) +
    '</span><strong>' +
    escapeHtml(formatFocalLength(_0x13f0fe['camera']['focalLength']) + 'mm') +
    '</strong></div>\n    <div class="storyboard-3d-shot-inspector-actions">\n      <button type="button" data-storyboard-3d-action="replace-shot-camera" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '">更新当前镜头</button>\n      <button type="button" data-storyboard-3d-action="move-shot" data-direction="-1" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '\x22\x20' +
    (_0x3e3452 <= 0x0 ? 'disabled' : '') +
    '>前移</button>\n      <button type="button" data-storyboard-3d-action="move-shot" data-direction="1" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '\x22\x20' +
    (_0x3e3452 >= _0x45b83b['shots']['length'] - 0x1 ? 'disabled' : '') +
    '>后移</button>\n      <button type="button" data-storyboard-3d-action="duplicate-shot" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '">复制</button>\n      <button type="button" data-storyboard-3d-action="delete-shot" data-shot-id="' +
    escapeHtml(_0x13f0fe['id']) +
    '">删除</button>\n    </div>\n  </section>'
  );
}
function renderAIAssistant(_0x2e04ba = {}) {
  const { modelId: _0x6c1a63, provider: _0xf7fb1b } = resolveStoryboard3DTextModelSelection(
      _0x2e04ba['modelId'],
    ),
    _0x178823 = _0x2e04ba['status'] || 'idle',
    _0x35085e = ['planning', 'executing', 'starting', 'listening', 'transcribing', 'stopping']['includes'](
      _0x178823,
    ),
    _0x4c06cc = {
      idle: '等待指令',
      planning: '正在规划安全命令…',
      ready: '计划已就绪',
      executing: '正在执行事务…',
      completed: '执行完成',
      starting: '正在启动麦克风…',
      listening: '正在聆听…',
      transcribing: '正在转写…',
      stopping: '正在结束录音…',
      error: _0x2e04ba['error']?.['message'] || '执行失败',
    },
    _0x59e98e = _0x2e04ba['plan']?.['commands'] || [];
  return (
    '<section\x20class=\x22storyboard-3d-inspector-card\x20storyboard-3d-ai-assistant\x22\x20data-storyboard-3d-ai-panel\x20data-status=\x22' +
    escapeHtml(_0x178823) +
    '\x22>\x0a\x20\x20\x20\x20<small>AI\x20场景助手</small>\x0a\x20\x20\x20\x20<strong>用自然语言编辑当前场景</strong>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-ai-feed\x22\x20aria-live=\x22polite\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-ai-message\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span>场景助手</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<p\x20data-storyboard-3d-ai-status>' +
    escapeHtml(_0x4c06cc[_0x178823] || _0x178823) +
    '</p>\n      </div>\n      ' +
    (_0x59e98e['length']
      ? '<ol class="storyboard-3d-ai-plan">' +
        _0x59e98e['map'](
          (_0x43a0cb) =>
            '<li><strong>' +
            escapeHtml(_0x43a0cb['tool']) +
            '</strong><span>' +
            escapeHtml(_0x43a0cb['commandId'] || '') +
            '</span></li>',
        )['join']('') +
        '</ol>'
      : '<p class="storyboard-3d-ai-empty">AI 返回的计划与执行信息会显示在这里。</p>') +
    '\n    </div>\n    <div class="storyboard-3d-ai-composer">\n      <div class="storyboard-3d-ai-prompt-wrap">\n        <textarea rows="4" maxlength="5000" aria-label="AI 场景指令" placeholder="例如：在人物左侧放一张桌子，再增加一个 50mm 近景镜头" data-storyboard-3d-ai-instruction>' +
    escapeHtml(_0x2e04ba['instruction'] || '') +
    '</textarea>\n        ' +
    (_0x2e04ba['interimTranscript']
      ? '<p class="storyboard-3d-ai-transcript">正在转写：' +
        escapeHtml(_0x2e04ba['interimTranscript']) +
        '</p>'
      : '') +
    '\n      </div>\n      <div class="storyboard-3d-ai-model-bar">\n        ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: _0x6c1a63,
      provider: _0xf7fb1b,
      getDisplayModelName: getDisplayModelName,
      className: 'storyboard-3d-ai-text-model-selector',
      allowedModelIds: getStoryboard3DTextModelIds(),
    }) +
    '\n        <div class="storyboard-3d-ai-actions">\n          <button type="button" data-storyboard-3d-action="toggle-ai-voice" ' +
    (_0x2e04ba['voiceSupported'] === ![] ? 'disabled' : '') +
    '>' +
    (['starting', 'listening', 'transcribing', 'stopping']['includes'](_0x178823) ? '停止语音' : '语音输入') +
    '</button>\n          <button type="button" class="is-primary" data-storyboard-3d-action="run-ai-command" ' +
    (_0x35085e || !_0xf7fb1b ? 'disabled' : '') +
    '>执行指令</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (_0x2e04ba['canUndoAI']
      ? '<button type="button" data-storyboard-3d-action="undo-ai-command">撤销本次 AI 修改</button>'
      : '') +
    '\n          ' +
    (_0x35085e
      ? '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22cancel-ai-command\x22>取消</button>'
      : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</section>'
  );
}
function renderAIAssistantRightSidebar(_0x4d5dce = {}, _0x53c6a0 = {}) {
  return (
    '<aside\x20class=\x22storyboard-3d-right-sidebar\x20storyboard-3d-ai-sidebar\x22\x20id=\x22storyboard3DRightSidebar\x22\x20aria-labelledby=\x22storyboard3DAIAssistantTitle\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-right-sidebar-splitter\x20panel-resize-handle\x22\x20data-storyboard-3d-right-sidebar-splitter\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22调整\x20AI\x20助手宽度\x22\x20aria-valuemin=\x22' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(_0x53c6a0['sidebarWidth'], _0x53c6a0['layoutWidth']) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-ai-sidebar-layout">\n      <header class="storyboard-3d-ai-sidebar-heading">\n        <div><small>场景编辑</small><h2 id="storyboard3DAIAssistantTitle">AI 助手</h2></div>\n      </header>\n      <div class="storyboard-3d-ai-sidebar-content">' +
    renderAIAssistant(_0x4d5dce) +
    '</div>\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</aside>'
  );
}
function renderObjectPropertiesRightSidebar(
  {
    object: object = null,
    selectedBoneName: selectedBoneName = 'Head',
    assetDescriptor: assetDescriptor = null,
    sceneGroups: sceneGroups = [],
    characterPoseState: characterPoseState = null,
  } = {},
  _0x44903a = {},
) {
  if (!object) return '';
  return (
    '<aside\x20class=\x22storyboard-3d-right-sidebar\x20storyboard-3d-object-properties-sidebar\x22\x20id=\x22storyboard3DRightSidebar\x22\x20data-object-id=\x22' +
    escapeHtml(object['id']) +
    '" aria-labelledby="storyboard3DObjectPropertiesTitle">\n    <div class="storyboard-3d-right-sidebar-splitter panel-resize-handle" data-storyboard-3d-right-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整对象属性宽度" aria-valuemin="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(_0x44903a['sidebarWidth'], _0x44903a['layoutWidth']) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-ai-sidebar-layout storyboard-3d-object-properties-layout">\n      <header class="storyboard-3d-ai-sidebar-heading storyboard-3d-object-properties-heading">\n        <div><small>' +
    escapeHtml(object['type']) +
    ' · 对象属性</small><h2 id="storyboard3DObjectPropertiesTitle">' +
    escapeHtml(object['name']) +
    '</h2></div>\x0a\x20\x20\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-ai-sidebar-content\x20storyboard-3d-object-properties-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderSelectedObjectInspector(
      object,
      selectedBoneName,
      assetDescriptor,
      sceneGroups,
      characterPoseState,
    ) +
    '\n      </div>\n    </section>\n  </aside>'
  );
}
function getBackgroundCalibrationMethodLabel(_0x4bc639) {
  if (_0x4bc639 === 'exif-local-estimate') return 'EXIF + 图像分析';
  if (_0x4bc639 === 'local-image-estimate') return '本地图像分析';
  if (_0x4bc639 === 'manual') return '手动校准';
  return '尚未匹配';
}
function renderBackgroundPerspectivePanel(_0x56bae9, _0x6c16c8) {
  const _0x316b93 = normalizeStoryboard3DBackgroundCalibration(_0x56bae9?.['background']),
    _0x18ef6b = Boolean(_0x316b93['imageUrl']),
    _0xea9aee = Math['round'](_0x316b93['calibrationConfidence'] * 0x64),
    _0x38d3b9 = Math['max'](
      0x0,
      Math['min'](
        0x1,
        _0x316b93['horizonY'] + _0x316b93['horizonSlope'] * (_0x316b93['vanishingPoint'][0x0] - 0.5),
      ),
    ),
    _0x54cf06 =
      _0x316b93['imageWidth'] > 0x1 && _0x316b93['imageHeight'] > 0x1
        ? _0x316b93['imageWidth'] + ' × ' + _0x316b93['imageHeight']
        : '尺寸未知';
  if (!_0x18ef6b)
    return '<section\x20class=\x22storyboard-3d-perspective-panel\x22\x20data-storyboard-3d-perspective-panel>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-perspective-empty\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20aria-hidden=\x22true\x22>⌗</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<strong>用参考图匹配\x203D\x20透视</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<p>上传图片后自动检测地平线、消失点和地面区域，并将当前摄像机匹配到图片视角。</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22is-primary\x22\x20data-storyboard-3d-action=\x22upload-background\x22>选择图像并匹配</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<small>支持\x20PNG、JPG、WEBP；原图只保存在本地项目资源中。</small>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</section>';
  return (
    '<section class="storyboard-3d-perspective-panel" data-storyboard-3d-perspective-panel>\n    <figure class="storyboard-3d-perspective-preview">\n      <img src="' +
    escapeHtml(_0x316b93['imageUrl']) +
    '" alt="当前透视匹配参考图">\n      <figcaption>\n        <span>' +
    (_0x316b93['lockedCamera'] ? '透视已锁定' : '透视未锁定') +
    '</span>\n        <strong>' +
    _0xea9aee +
    '%</strong>\n      </figcaption>\n    </figure>\n    <div class="storyboard-3d-perspective-summary" data-state="' +
    (_0x316b93['lockedCamera'] ? 'locked' : 'ready') +
    '">\n      <div><small>匹配方式</small><strong>' +
    escapeHtml(getBackgroundCalibrationMethodLabel(_0x316b93['calibrationMethod'])) +
    '</strong></div>\n      <div><small>图像尺寸</small><strong>' +
    escapeHtml(_0x54cf06) +
    '</strong></div>\n      <div><small>当前镜头</small><strong>' +
    escapeHtml(_0x6c16c8 ? formatFocalLength(_0x6c16c8['camera']?.['focalLength']) + 'mm' : '未创建') +
    '</strong></div>\n    </div>\n    <div class="storyboard-3d-perspective-actions">\n      <button type="button" class="is-primary" data-storyboard-3d-action="upload-background">更换图像</button>\n      <button type="button" data-storyboard-3d-action="analyze-background" ' +
    (_0x316b93['binaryAssetId'] ? '' : 'disabled') +
    '>重新匹配</button>\n      <button type="button" data-storyboard-3d-action="clear-background">清除</button>\n    </div>\n    <details class="storyboard-3d-perspective-settings" open>\n      <summary>匹配参数 <small>修改后即时更新摄像机</small></summary>\n      <div class="storyboard-3d-scene-control-grid">\n        <label><span>水平 FOV°</span><input type="number" min="10" max="170" step="0.1" value="' +
    _0x316b93['horizontalFov'] +
    '" data-storyboard-3d-background-field="horizontalFov"></label>\n        <label><span>垂直 FOV°</span><input type="number" min="10" max="170" step="0.1" value="' +
    (_0x316b93['verticalFov'] || 0x28) +
    '\x22\x20data-storyboard-3d-background-field=\x22verticalFov\x22></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><span>地平线\x20Y</span><input\x20type=\x22number\x22\x20min=\x220\x22\x20max=\x221\x22\x20step=\x220.01\x22\x20value=\x22' +
    _0x316b93['horizonY'] +
    '\x22\x20data-storyboard-3d-background-field=\x22horizonY\x22></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><span>地平线倾斜</span><input\x20type=\x22number\x22\x20min=\x22-1\x22\x20max=\x221\x22\x20step=\x220.01\x22\x20value=\x22' +
    _0x316b93['horizonSlope'] +
    '" data-storyboard-3d-background-field="horizonSlope"></label>\n        <label><span>消失点 X</span><input type="number" min="0" max="1" step="0.01" value="' +
    _0x316b93['vanishingPoint'][0x0] +
    '" data-storyboard-3d-background-field="vanishingPointX"></label>\n        <label><span>消失点 Y</span><input type="number" value="' +
    _0x38d3b9['toFixed'](0x3) +
    '" disabled></label>\n        <label><span>相机高度 m</span><input type="number" min="0.2" max="20" step="0.1" value="' +
    _0x316b93['cameraHeight'] +
    '\x22\x20data-storyboard-3d-background-field=\x22cameraHeight\x22></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><span>背景缩放</span><input\x20type=\x22number\x22\x20min=\x220.1\x22\x20max=\x2210\x22\x20step=\x220.1\x22\x20value=\x22' +
    _0x316b93['imageScale'] +
    '" data-storyboard-3d-background-field="imageScale"></label>\n        <label><span>背景偏移 X</span><input type="number" min="-2" max="2" step="0.01" value="' +
    _0x316b93['imageOffset'][0x0] +
    '" data-storyboard-3d-background-field="imageOffsetX"></label>\n        <label><span>背景偏移 Y</span><input type="number" min="-2" max="2" step="0.01" value="' +
    _0x316b93['imageOffset'][0x1] +
    '" data-storyboard-3d-background-field="imageOffsetY"></label>\n      </div>\n    </details>\n    <label class="storyboard-3d-perspective-lock">\n      <input type="checkbox" data-storyboard-3d-background-lock ' +
    (_0x316b93['lockedCamera'] ? 'checked' : '') +
    '>\n      <span><strong>锁定匹配机位</strong><small>锁定后禁止意外改变与参考图对应的摄像机视角</small></span>\n    </label>\n  </section>'
  );
}
function renderBackgroundPerspectiveRightSidebar(
  { scene: scene = null, activeShot: activeShot = null } = {},
  _0x22278c = {},
) {
  return (
    '<aside\x20class=\x22storyboard-3d-right-sidebar\x20storyboard-3d-perspective-sidebar\x22\x20id=\x22storyboard3DRightSidebar\x22\x20aria-labelledby=\x22storyboard3DPerspectiveTitle\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-right-sidebar-splitter\x20panel-resize-handle\x22\x20data-storyboard-3d-right-sidebar-splitter\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22调整图像透视匹配宽度\x22\x20aria-valuemin=\x22' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(
      _0x22278c['sidebarWidth'],
      _0x22278c['layoutWidth'],
      'perspective',
    ) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-ai-sidebar-layout storyboard-3d-perspective-layout">\n      <header class="storyboard-3d-ai-sidebar-heading">\n        <div><small>场景校准</small><h2 id="storyboard3DPerspectiveTitle">图像透视匹配</h2></div>\n      </header>\n      <div class="storyboard-3d-ai-sidebar-content storyboard-3d-perspective-content">\n        ' +
    renderBackgroundPerspectivePanel(scene, activeShot) +
    '\n      </div>\n    </section>\n  </aside>'
  );
}
function renderAssetLibrarySidebar({
  query: query = '',
  category: category = 'all',
  importState: importState = null,
} = {}) {
  const _0x521220 = ['queued', 'reading', 'parsing']['includes'](importState?.['status']),
    _0x2e7933 = [
      ...STORYBOARD_3D_ASSET_CATEGORIES,
      { id: 'recent', label: getStoryboard3DAssetCategoryLabel('recent') },
      { id: 'favorite', label: getStoryboard3DAssetCategoryLabel('favorite') },
    ];
  return (
    '<aside class="storyboard-3d-asset-library-sidebar" aria-label="模型库工具">\n    <div class="storyboard-3d-asset-sidebar-heading">\n      <small>模型工具</small>\n      <strong>查找与导入</strong>\n    </div>\n    <div class="storyboard-3d-asset-filters">\n      <label>\n        <span>搜索模型</span>\n        <input type="search" value="' +
    escapeHtml(query) +
    '" placeholder="输入模型名称" data-storyboard-3d-asset-query>\n      </label>\n      <nav class="storyboard-3d-asset-category-panel" aria-label="模型分类">\n        <span>模型分类</span>\n        <div class="storyboard-3d-asset-category-list">\n          ' +
    _0x2e7933['map'](
      (_0x512cb3) =>
        '<button\x20type=\x22button\x22\x20class=\x22' +
        (_0x512cb3['id'] === category ? 'is-active' : '') +
        '" data-storyboard-3d-action="select-asset-category" data-storyboard-3d-asset-category="' +
        escapeHtml(_0x512cb3['id']) +
        '" aria-pressed="' +
        (_0x512cb3['id'] === category) +
        '\x22>' +
        escapeHtml(_0x512cb3['label']) +
        '</button>',
    )['join']('') +
    '\n        </div>\n      </nav>\n    </div>\n    <div class="storyboard-3d-asset-toolbar">\n      <strong>导入本地模型</strong>\n      <button type="button" data-storyboard-3d-action="import-model" ' +
    (_0x521220 ? 'disabled' : '') +
    '>导入模型</button>\x0a\x20\x20\x20\x20\x20\x20' +
    (_0x521220 ? '<button type="button" data-storyboard-3d-action="cancel-model-import">取消</button>' : '') +
    '\n      <small>支持 GLB / GLTF / FBX / OBJ / STL</small>\n      <span data-storyboard-3d-import-status>' +
    (_0x521220
      ? escapeHtml(importState['fileName'] || '模型') +
        '\x20·\x20' +
        importState['status'] +
        ' · ' +
        Math['round']((importState['progress'] || 0x0) * 0x64) +
        '%'
      : '') +
    '</span>\n    </div>\n  </aside>'
  );
}
function renderAssetLibrary({
  assets: assets = [],
  hasMore: hasMore = ![],
  favoriteIds: favoriteIds = new Set(),
} = {}) {
  return (
    '<section class="storyboard-3d-asset-results" aria-label="模型列表">\n      <div class="storyboard-3d-asset-grid">\n      ' +
    (assets['length'] > 0x0
      ? assets['map'](
          (_0x397dd3) =>
            '<article><button type="button" data-storyboard-3d-action="add-asset" data-asset-id="' +
            escapeHtml(_0x397dd3['id']) +
            '\x22><span\x20class=\x22storyboard-3d-asset-thumb\x22\x20data-storyboard-3d-asset-thumbnail\x20data-asset-id=\x22' +
            escapeHtml(_0x397dd3['id']) +
            '\x22\x20data-thumbnail-status=\x22' +
            (_0x397dd3['thumbnailUrl'] ? 'ready' : 'pending') +
            '\x22>' +
            (_0x397dd3['thumbnailUrl']
              ? '<img src="' +
                escapeHtml(_0x397dd3['thumbnailUrl']) +
                '\x22\x20alt=\x22' +
                escapeHtml(_0x397dd3['name'] + ' 模型预览') +
                '\x22>'
              : '<span\x20class=\x22storyboard-3d-asset-thumb-loading\x22\x20aria-label=\x22正在生成\x20' +
                escapeHtml(_0x397dd3['name']) +
                ' 的模型预览"><i></i><small>生成预览</small></span>') +
            '</span><span>' +
            escapeHtml(getStoryboard3DAssetCategoryLabel(_0x397dd3['category'])) +
            (_0x397dd3['assetRecord']?.['sourceFormat']
              ? '\x20·\x20' + escapeHtml(_0x397dd3['assetRecord']['sourceFormat']['toUpperCase']())
              : '') +
            '</span><strong title="' +
            escapeHtml(_0x397dd3['name']) +
            '\x22>' +
            escapeHtml(_0x397dd3['name']) +
            '</strong></button><button type="button" class="storyboard-3d-asset-favorite ' +
            (favoriteIds['has'](_0x397dd3['id']) ? 'is-active' : '') +
            '\x22\x20data-storyboard-3d-action=\x22toggle-asset-favorite\x22\x20data-asset-id=\x22' +
            escapeHtml(_0x397dd3['id']) +
            '" aria-label="' +
            (favoriteIds['has'](_0x397dd3['id']) ? '取消收藏' : '收藏') +
            '">★</button></article>',
        )['join']('')
      : '<div\x20class=\x22storyboard-3d-empty-state\x22><strong>没有匹配的模型</strong><span>调整搜索词或分类后重试。</span></div>') +
    '\n      </div>\n      ' +
    (hasMore
      ? '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-assets-load-more\x22\x20data-storyboard-3d-action=\x22load-more-assets\x22>加载更多模型</button>'
      : '') +
    '\n    </section>'
  );
}
function renderAssetLibraryRightSidebar(_0xadeeb5 = {}) {
  const _0x387433 = Array['isArray'](_0xadeeb5['assets']) ? _0xadeeb5['assets']['length'] : 0x0,
    _0x24a18c = Math['max'](_0x387433, Number(_0xadeeb5['totalCount']) || 0x0);
  return (
    '<aside\x20class=\x22storyboard-3d-right-sidebar\x20storyboard-3d-asset-library-panel\x22\x20id=\x22storyboard3DRightSidebar\x22\x20aria-labelledby=\x22storyboard3DAssetLibraryTitle\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-right-sidebar-splitter\x20panel-resize-handle\x22\x20data-storyboard-3d-right-sidebar-splitter\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22调整模型库宽度\x22\x20aria-valuemin=\x22' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(_0xadeeb5['sidebarWidth'], _0xadeeb5['layoutWidth']) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-asset-library-layout">\n      ' +
    renderAssetLibrarySidebar(_0xadeeb5) +
    '\n      <div class="storyboard-3d-asset-library-main">\n        <header class="storyboard-3d-asset-library-heading">\n          <div>\n            <small>场景资源</small>\n            <h2 id="storyboard3DAssetLibraryTitle">模型库</h2>\n            <p>查看模型外观后，点击卡片即可加入当前场景。</p>\n          </div>\n          <span>' +
    _0x24a18c +
    ' 个模型</span>\n        </header>\n        <div class="storyboard-3d-asset-library-content">' +
    renderAssetLibrary(_0xadeeb5) +
    '</div>\n      </div>\n    </section>\n  </aside>'
  );
}
function finiteMiniMapValue(_0x2044bc, _0x1d4eb6 = 0x0) {
  const _0x1da292 = Number(_0x2044bc);
  return Number['isFinite'](_0x1da292) ? _0x1da292 : _0x1d4eb6;
}
function createStoryboard3DMiniMapCameraPose(_0x86c82a, _0x4f3eff, _0x476cef) {
  const _0x545093 = _0x86c82a?.['camera']?.['position'] || [0x0, 0x0, 0x0],
    _0x2b3d97 = _0x86c82a?.['camera']?.['target'] || [0x0, 0x0, -0x1],
    _0x46418c = _0x4f3eff ? resolveSceneCameraPose(_0x4f3eff) : null,
    _0x3bfeec = {
      x: finiteMiniMapValue(_0x46418c?.['position']?.['x'], _0x476cef?.['position']?.['x'] ?? _0x545093[0x0]),
      y: finiteMiniMapValue(_0x46418c?.['position']?.['y'], _0x476cef?.['position']?.['y'] ?? _0x545093[0x1]),
      z: finiteMiniMapValue(_0x46418c?.['position']?.['z'], _0x476cef?.['position']?.['z'] ?? _0x545093[0x2]),
    },
    _0x53e33d = _0x46418c?.['target'] ||
      _0x4f3eff?.['target'] || { x: _0x2b3d97[0x0], y: _0x2b3d97[0x1], z: _0x2b3d97[0x2] };
  return {
    position: _0x3bfeec,
    target: {
      x: finiteMiniMapValue(_0x53e33d?.['x'], _0x2b3d97[0x0]),
      y: finiteMiniMapValue(_0x53e33d?.['y'], _0x2b3d97[0x1]),
      z: finiteMiniMapValue(_0x53e33d?.['z'], _0x2b3d97[0x2]),
    },
  };
}
function renderMiniMap(
  _0x262709,
  _0x28155f,
  {
    expanded: expanded = ![],
    zoom: zoom = 0x1,
    footprints: footprints = [],
    worldBounds: worldBounds = null,
    camera: camera = null,
  } = {},
) {
  const _0x20a3e4 = camera || createStoryboard3DMiniMapCameraPose(_0x28155f),
    { objects: _0x56e37c, projection: _0x3ea818 } = createMiniMapLayout(
      _0x262709,
      _0x28155f,
      undefined,
      zoom,
      footprints,
      worldBounds,
      _0x20a3e4,
    ),
    _0x163fca = new Map(
      (Array['isArray'](footprints) ? footprints : [])['map']((_0x29fcea) => [
        _0x29fcea['objectId'],
        _0x29fcea,
      ]),
    ),
    _0x56f855 = _0x56e37c['map']((_0x3ff1e3) => {
      const _0x4bd09b = projectStoryboard3DWorldToMiniMapRatio(
          { x: _0x3ff1e3['transform']?.['position']?.[0x0], z: _0x3ff1e3['transform']?.['position']?.[0x2] },
          _0x3ea818,
        ),
        _0x44770c = projectStoryboard3DTopViewFootprint(
          _0x163fca['get'](_0x3ff1e3['id'])?.['points'],
          _0x3ea818,
        );
      if (_0x44770c) {
        const _0x157881 = _0x44770c['polygon']
          ['map']((_0x55f229) => _0x55f229['x'] * 0x64 + '%\x20' + _0x55f229['y'] * 0x64 + '%')
          ['join'](',');
        return (
          '<button type="button" class="storyboard-3d-mini-map-marker has-top-view-footprint is-' +
          escapeHtml(_0x3ff1e3['type']) +
          '\x22\x20data-storyboard-3d-action=\x22select-object\x22\x20data-object-id=\x22' +
          escapeHtml(_0x3ff1e3['id']) +
          '" data-top-view-footprint="true" title="' +
          escapeHtml(_0x3ff1e3['name']) +
          '" style="--mini-x:' +
          _0x44770c['centerX'] * 0x64 +
          '%;--mini-y:' +
          _0x44770c['centerY'] * 0x64 +
          '%;--mini-left:' +
          _0x44770c['left'] * 0x64 +
          '%;--mini-top:' +
          _0x44770c['top'] * 0x64 +
          '%;--mini-width:' +
          _0x44770c['width'] * 0x64 +
          '%;--mini-height:' +
          _0x44770c['height'] * 0x64 +
          '%;clip-path:polygon(' +
          _0x157881 +
          ')"></button>'
        );
      }
      return (
        '<button type="button" class="storyboard-3d-mini-map-marker" data-storyboard-3d-action="select-object" data-object-id="' +
        escapeHtml(_0x3ff1e3['id']) +
        '" title="' +
        escapeHtml(_0x3ff1e3['name']) +
        '\x22\x20style=\x22--mini-x:' +
        _0x4bd09b['x'] * 0x64 +
        '%;--mini-y:' +
        _0x4bd09b['y'] * 0x64 +
        '%"></button>'
      );
    })['join'](''),
    _0x50d4a9 = createStoryboard3DMiniMapCameraMarker(_0x20a3e4, _0x3ea818),
    _0x43df22 = projectStoryboard3DWorldToMiniMapRatio(_0x20a3e4['position'], _0x3ea818);
  return (
    '<div class="storyboard-3d-mini-map-title"><span>Mini Map · 跟随视角</span><small>' +
    _0x56e37c['length'] +
    ' 个对象 · ' +
    Math['round'](zoom * 0x64) +
    '%</small><button type="button" data-storyboard-3d-action="toggle-mini-map" aria-label="' +
    (expanded ? '折叠 Mini Map' : '展开 Mini Map') +
    '\x22>' +
    (expanded ? '−' : '+') +
    '</button></div>\x0a\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-mini-map-canvas\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-mini-map-grid\x22\x20aria-hidden=\x22true\x22\x20style=\x22--mini-map-rotation:' +
    _0x3ea818['rotation'] +
    'rad"></span>\n      ' +
    _0x56f855 +
    '\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-mini-map-camera\x22\x20data-storyboard-3d-mini-map-camera\x20style=\x22--mini-x:' +
    _0x43df22['x'] * 0x64 +
    '%;--mini-y:' +
    _0x43df22['y'] * 0x64 +
    '%;--mini-angle:' +
    _0x50d4a9['angle'] +
    'rad"></span>\n    </div>'
  );
}
function createMiniMapWorldBounds(_0x125a04, _0x30541d, _0x23e0b5 = []) {
  const _0x160512 = Array['isArray'](_0x125a04?.['objects'])
      ? _0x125a04['objects']['filter']((_0x1ccd04) => _0x1ccd04['visible'] !== ![])
      : [],
    _0x3f9caf = _0x160512['map']((_0x5cb31d) => _0x5cb31d['transform']?.['position'] || [0x0, 0x0, 0x0]),
    _0x5b2e00 = new Set(_0x160512['map']((_0x444531) => _0x444531['id'])),
    _0x5f6563 = (Array['isArray'](_0x23e0b5) ? _0x23e0b5 : [])
      ['filter']((_0x87692a) => _0x5b2e00['has'](_0x87692a?.['objectId']))
      ['flatMap']((_0x10e773) => (Array['isArray'](_0x10e773?.['points']) ? _0x10e773['points'] : [])),
    _0x1cf302 = _0x30541d?.['camera']?.['position'] || [0x0, 0x0, 0x0],
    _0x4d8d0e = [
      ..._0x3f9caf['map']((_0x76929e) => Number(_0x76929e[0x0]) || 0x0),
      ..._0x5f6563['map']((_0x2716d2) => Number(_0x2716d2['x']) || 0x0),
      Number(_0x1cf302[0x0]) || 0x0,
    ],
    _0x1aecce = [
      ..._0x3f9caf['map']((_0x156d0a) => Number(_0x156d0a[0x2]) || 0x0),
      ..._0x5f6563['map']((_0x2fa361) => Number(_0x2fa361['z']) || 0x0),
      Number(_0x1cf302[0x2]) || 0x0,
    ],
    _0xebfe8c = Math['min'](-0x5, ..._0x4d8d0e) - 0x2,
    _0x5a76c0 = Math['max'](0x5, ..._0x4d8d0e) + 0x2,
    _0x2b2c65 = Math['min'](-0x5, ..._0x1aecce) - 0x2,
    _0x2d4482 = Math['max'](0x5, ..._0x1aecce) + 0x2;
  return { minX: _0xebfe8c, maxX: _0x5a76c0, minZ: _0x2b2c65, maxZ: _0x2d4482 };
}
function createMiniMapLayout(
  _0x4e4be9,
  _0x185816,
  _0x225e44 = { width: 0x8c, height: 0x69 },
  _0x1d3ccc = 0x1,
  _0x12e216 = [],
  _0x533ab2 = null,
  _0x3b3f06 = null,
) {
  const _0x6c6320 = Array['isArray'](_0x4e4be9?.['objects'])
      ? _0x4e4be9['objects']['filter']((_0x1c60c2) => _0x1c60c2['visible'] !== ![])
      : [],
    _0x2e63af = _0x533ab2 || createMiniMapWorldBounds(_0x4e4be9, _0x185816, _0x12e216),
    _0x325f50 = Math['max'](0.5, Math['min'](0x3, Number(_0x1d3ccc) || 0x1)),
    _0x3c7293 = _0x3b3f06 || createStoryboard3DMiniMapCameraPose(_0x185816),
    _0x3ea5c5 = finiteMiniMapValue(
      _0x3c7293['position']?.['x'],
      (_0x2e63af['minX'] + _0x2e63af['maxX']) / 0x2,
    ),
    _0x56b63a = finiteMiniMapValue(
      _0x3c7293['position']?.['z'],
      (_0x2e63af['minZ'] + _0x2e63af['maxZ']) / 0x2,
    ),
    _0x54fae6 = (_0x2e63af['maxX'] - _0x2e63af['minX']) / 0x2 / _0x325f50,
    _0x22c8c5 = (_0x2e63af['maxZ'] - _0x2e63af['minZ']) / 0x2 / _0x325f50,
    _0xd6d415 = _0x3ea5c5 - _0x54fae6,
    _0x4b812d = _0x3ea5c5 + _0x54fae6,
    _0x4dda85 = _0x56b63a - _0x22c8c5,
    _0x211c8a = _0x56b63a + _0x22c8c5,
    _0x57a6cc = finiteMiniMapValue(_0x3c7293['target']?.['x']) - _0x3ea5c5,
    _0x5dee30 = finiteMiniMapValue(_0x3c7293['target']?.['z']) - _0x56b63a,
    _0x49221d = Math['hypot'](_0x57a6cc, _0x5dee30) > 0.000001,
    _0x43a965 = _0x49221d ? Math['atan2'](_0x5dee30, _0x57a6cc) : 0x0,
    _0x7a22d4 = createStoryboard3DMiniMapProjection({
      worldBounds: { minX: _0xd6d415, maxX: _0x4b812d, minZ: _0x4dda85, maxZ: _0x211c8a },
      viewport: { x: 0x0, y: 0x0, width: _0x225e44['width'] || 0x8c, height: _0x225e44['height'] || 0x69 },
      padding: 0x8,
      center: { x: _0x3ea5c5, z: _0x56b63a },
      rotation: _0x49221d ? -Math['PI'] / 0x2 - _0x43a965 : 0x0,
    });
  return { objects: _0x6c6320, projection: _0x7a22d4 };
}
function renderShotExplorePanel(_0xfe5bad = [], _0x50b462 = 'all') {
  const _0x420248 = {
      close: new Set(['MCU', 'CU', 'ECU']),
      medium: new Set(['MLS', 'MED']),
      wide: new Set(['EST', 'ELS', 'LS']),
    },
    _0x32b267 = _0xfe5bad['map']((_0x166dbb, _0x316da5) => ({ candidate: _0x166dbb, index: _0x316da5 }))[
      'filter'
    ](
      ({ candidate: _0x2b31c7 }) =>
        _0x50b462 === 'all' || _0x420248[_0x50b462]?.['has'](_0x2b31c7['shotSize']),
    );
  return (
    '<section class="storyboard-3d-explore-panel" aria-label="镜头探索">\n    <header><div><small>SHOT EXPLORER</small><strong>镜头探索</strong></div><div class="storyboard-3d-explore-toolbar">' +
    [
      ['all', '全部'],
      ['close', '特写'],
      ['medium', '中景'],
      ['wide', '远景'],
    ]
      ['map'](
        ([_0x21006f, _0x4bed8b]) =>
          '<button type="button" data-storyboard-3d-action="filter-explore" data-explore-filter="' +
          _0x21006f +
          '\x22\x20aria-pressed=\x22' +
          (_0x50b462 === _0x21006f) +
          '\x22>' +
          _0x4bed8b +
          '</button>',
      )
      ['join']('') +
    '<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22regenerate-explore\x22>重新生成</button><button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22close-explore\x22\x20aria-label=\x22关闭\x22>×</button></div></header>\x0a\x20\x20\x20\x20' +
    (_0x32b267['length'] > 0x0
      ? '<div class="storyboard-3d-candidate-grid">' +
        _0x32b267['map'](
          ({ candidate: _0x31d36d, index: _0x4e9435 }) =>
            '<article>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-candidate-preview\x22\x20data-candidate-preview=\x22' +
            _0x4e9435 +
            '\x22>' +
            (_0x31d36d['thumbnailUrl']
              ? '<img src="' +
                escapeHtml(_0x31d36d['thumbnailUrl']) +
                '" alt="候选镜头 ' +
                (_0x4e9435 + 0x1) +
                '\x22>'
              : '<span>正在渲染候选\x20' + (_0x4e9435 + 0x1) + '</span>') +
            '</div>\n          <div><strong>' +
            escapeHtml(_0x31d36d['shotSize'] + '\x20·\x20' + _0x31d36d['shotAngle']) +
            '</strong><small>' +
            Math['round'](_0x31d36d['score'] * 0x64) +
            ' 分 · ' +
            formatFocalLength(_0x31d36d['camera']['focalLength']) +
            'mm</small></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<footer><button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22preview-candidate\x22\x20data-candidate-index=\x22' +
            _0x4e9435 +
            '">主视口预览</button><button type="button" data-storyboard-3d-action="replace-with-candidate" data-candidate-index="' +
            _0x4e9435 +
            '">替换当前</button><button type="button" data-storyboard-3d-action="append-candidate" data-candidate-index="' +
            _0x4e9435 +
            '\x22>添加镜头</button></footer>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</article>',
        )['join']('') +
        '</div>'
      : '<div class="storyboard-3d-explore-empty"><strong>' +
        (_0xfe5bad['length'] > 0x0 ? '当前景别没有候选' : '需要至少一个可见主体') +
        '</strong><span>' +
        (_0xfe5bad['length'] > 0x0
          ? '切换筛选或重新生成一组机位。'
          : '从素材库添加人物或道具后，即可生成 9 个候选机位。') +
        '</span></div>') +
    '\n  </section>'
  );
}
export class Storyboard3DEditorWorkspace {
  constructor({
    projectId: _0x436da8,
    project: _0x14a3e9,
    onProjectChange: _0x3cad46,
    onClose: _0x55f4f7,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
    binaryAssetRepository: binaryAssetRepository = null,
    modelPackApi: modelPackApi = null,
    assetThumbnailRenderer: assetThumbnailRenderer = null,
    imagePoseEstimator: imagePoseEstimator = null,
    imagePoseRetargeter: imagePoseRetargeter = null,
  } = {}) {
    ((this['projectId'] = String(_0x436da8 || _0x14a3e9?.['id'] || '')),
      (this['document'] = documentObject),
      (this['window'] = windowObject),
      (this['onProjectChange'] = _0x3cad46),
      (this['onClose'] = _0x55f4f7),
      (this['root'] = null),
      (this['_message'] = ''),
      (this['_closed'] = ![]),
      (this['_serverAlertMutationObserver'] = null),
      (this['_serverAlertResizeObserver'] = null),
      (this['sceneRuntime'] = null),
      (this['backgroundCalibrationInteraction'] = null),
      (this['_sceneRuntimeResizeObserver'] = null),
      (this['_gizmoDrag'] = null),
      (this['_selectionDrag'] = null),
      (this['_cameraDrag'] = null),
      (this['_flyKeys'] = new Set()),
      (this['_flyBoost'] = ![]),
      (this['_flyFrame'] = null),
      (this['_flyLastTime'] = 0x0),
      (this['_flySceneView'] = null),
      (this['_miniMapDrag'] = null),
      (this['miniMapExpanded'] = ![]),
      (this['miniMapZoom'] = 0x1),
      (this['miniMapWindowOffset'] = { x: 0x0, y: 0x0 }),
      (this['_miniMapFootprints'] = []),
      (this['_miniMapFrame'] = null),
      (this['_miniMapPreviewSceneView'] = null),
      (this['_miniMapRefreshFrame'] = null),
      (this['_miniMapWindowDrag'] = null),
      (this['inspectorWidth'] = 0x168),
      (this['_inspectorResize'] = null),
      (this['rightSidebarMode'] = Number(this['window']?.['innerWidth']) <= 0x384 ? null : 'ai'),
      (this['rightSidebarWidth'] = null),
      (this['_rightSidebarResize'] = null),
      (this['timelineHeight'] = STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT),
      (this['_timelineResize'] = null),
      (this['_suppressTimelineToggleClick'] = ![]),
      (this['_runtimeError'] = ''),
      (this['_runtimeFailureTitle'] = ''),
      (this['viewportControls'] = null),
      (this['viewportSettings'] = loadStoryboard3DTransformSettings(this['window']?.['localStorage'])),
      (this['navigationSettings'] = loadStoryboard3DNavigationSettings(this['window']?.['localStorage'])),
      (this['assetLibrary'] = createStoryboard3DAssetLibrary()),
      (this['assetQuery'] = ''),
      (this['assetCategory'] = 'all'),
      (this['assetVisibleLimit'] = 0x20),
      (this['favoriteAssetIds'] = new Set()),
      (this['assetThumbnailRenderer'] = assetThumbnailRenderer),
      (this['_assetThumbnailObserver'] = null),
      (this['_assetThumbnailQueue'] = Promise['resolve']()),
      (this['_assetThumbnailLoads'] = new Map()),
      (this['_assetThumbnailFailures'] = new Set()),
      (this['characterBoneSelection'] = new Map()),
      (this['outlineQuery'] = ''),
      (this['outlineType'] = 'all'),
      (this['sceneEnvironmentOpen'] = ![]),
      (this['importedModelScenes'] = new Map()),
      (this['modelPackApi'] = modelPackApi || {
        getStatus: getStoryboard3DModelPackStatus,
        fetchAssetFile: fetchStoryboard3DModelPackAssetFile,
      }),
      (this['modelPackStatus'] = { loaded: ![], installed: ![], assets: [], error: '' }),
      (this['_modelPackStatusPromise'] = null),
      (this['_packAssetLoads'] = new Map()),
      (this['binaryAssetRepository'] = binaryAssetRepository || createStoryboard3DBinaryAssetRepository()),
      (this['_binaryAssetHydrationPromise'] = null));
    const _0x2a82a8 = createThreeStoryboard3DModelParsers({
      gltf: { urlApi: this['window']?.['URL'] || globalThis['URL'] },
      fbx: { urlApi: this['window']?.['URL'] || globalThis['URL'] },
    });
    ((this['modelParsers'] = {
      ..._0x2a82a8,
      ...createThreeWorkerBackedStoryboard3DModelParsers({
        obj: { fallbackParser: _0x2a82a8['obj'] },
        stl: { fallbackParser: _0x2a82a8['stl'] },
      }),
    }),
      (this['modelImportJob'] = null),
      (this['modelImportState'] = null),
      (this['backgroundImageControllers'] = new Map()),
      (this['exploreOpen'] = ![]),
      (this['exploreFilter'] = 'all'),
      (this['exploreVariation'] = 0x0),
      (this['shotCandidates'] = []),
      (this['_candidateRenderToken'] = 0x0),
      (this['_shotThumbnailQueue'] = Promise['resolve']()));
    const _0x3c1ad3 = resolveStoryboard3DTextModelSelection();
    ((this['aiModelId'] = _0x3c1ad3['modelId']),
      (this['aiProvider'] = _0x3c1ad3['provider']),
      (this['_aiModelSelectorController'] = null),
      (this['aiState'] = { status: 'idle', instruction: '', voiceSupported: ![] }),
      (this['exportController'] = createStoryboard3DExportController({
        documentObject: this['document'],
        windowObject: this['window'],
        getProject: () => this['projectStore']['getSnapshot'](),
        renderFrame: (_0x31e46c, _0x4e077e) => this['_renderShotFrame'](_0x31e46c, _0x4e077e),
        renderVideo: (_0x4f3daf, _0x424aad) =>
          renderStoryboard3DShotVideo({
            ..._0x424aad,
            shot: _0x4f3daf,
            project: this['projectStore']['getSnapshot'](),
            importedModelResolver: (_0x5728a1) => this['importedModelScenes']['get'](_0x5728a1),
            windowObject: this['window'],
          }),
        onComplete: ({ project: _0x23a6b5, options: _0x1c9fa1, results: _0x451167 }) => {
          dispatchWorkspaceEvent(this['window'], 'storyboard-3d:export-complete', {
            projectId: _0x23a6b5['id'],
            projectName: _0x23a6b5['name'],
            options: _0x1c9fa1,
            results: _0x451167,
          });
        },
      })),
      (this['_handleClick'] = this['_handleClick']['bind'](this)),
      (this['_handleInput'] = this['_handleInput']['bind'](this)),
      (this['_handleChange'] = this['_handleChange']['bind'](this)),
      (this['_handleWindowKeyDown'] = this['_handleWindowKeyDown']['bind'](this)),
      (this['_handleWindowKeyUp'] = this['_handleWindowKeyUp']['bind'](this)),
      (this['_handleWindowBlur'] = this['_handleWindowBlur']['bind'](this)),
      (this['_handleRuntimePointerDown'] = this['_handleRuntimePointerDown']['bind'](this)),
      (this['_handleRuntimePointerMove'] = this['_handleRuntimePointerMove']['bind'](this)),
      (this['_handleRuntimePointerUp'] = this['_handleRuntimePointerUp']['bind'](this)),
      (this['_handleRuntimePointerCancel'] = this['_handleRuntimePointerCancel']['bind'](this)),
      (this['_handleRuntimePointerHover'] = this['_handleRuntimePointerHover']['bind'](this)),
      (this['_handleRuntimePointerLeave'] = this['_handleRuntimePointerLeave']['bind'](this)),
      (this['_handleRuntimeContextMenu'] = this['_handleRuntimeContextMenu']['bind'](this)),
      (this['_handleRuntimeWheel'] = this['_handleRuntimeWheel']['bind'](this)),
      (this['_handleMiniMapPointerDown'] = this['_handleMiniMapPointerDown']['bind'](this)),
      (this['_handleMiniMapPointerMove'] = this['_handleMiniMapPointerMove']['bind'](this)),
      (this['_handleMiniMapPointerUp'] = this['_handleMiniMapPointerUp']['bind'](this)),
      (this['_handleMiniMapWheel'] = this['_handleMiniMapWheel']['bind'](this)),
      (this['_handleMiniMapWindowMove'] = this['_handleMiniMapWindowMove']['bind'](this)),
      (this['_handleMiniMapWindowUp'] = this['_handleMiniMapWindowUp']['bind'](this)),
      (this['_handleInspectorResizePointerDown'] = this['_handleInspectorResizePointerDown']['bind'](this)),
      (this['_handleInspectorResizePointerMove'] = this['_handleInspectorResizePointerMove']['bind'](this)),
      (this['_handleInspectorResizePointerUp'] = this['_handleInspectorResizePointerUp']['bind'](this)),
      (this['_handleRightSidebarResizePointerDown'] =
        this['_handleRightSidebarResizePointerDown']['bind'](this)),
      (this['_handleRightSidebarResizePointerMove'] =
        this['_handleRightSidebarResizePointerMove']['bind'](this)),
      (this['_handleRightSidebarResizePointerUp'] = this['_handleRightSidebarResizePointerUp']['bind'](this)),
      (this['_handleTimelineResizePointerDown'] = this['_handleTimelineResizePointerDown']['bind'](this)),
      (this['_handleTimelineResizePointerMove'] = this['_handleTimelineResizePointerMove']['bind'](this)),
      (this['_handleTimelineResizePointerUp'] = this['_handleTimelineResizePointerUp']['bind'](this)),
      (this['_handleOutlineDragStart'] = this['_handleOutlineDragStart']['bind'](this)),
      (this['_handleOutlineDragOver'] = this['_handleOutlineDragOver']['bind'](this)),
      (this['_handleOutlineDrop'] = this['_handleOutlineDrop']['bind'](this)),
      (this['_syncServerAlertOffset'] = this['_syncServerAlertOffset']['bind'](this)),
      (this['editorStore'] = createStoryboard3DEditorStore({ inspectorOpen: ![] })),
      (this['projectStore'] = createStoryboard3DProjectStore(_0x14a3e9, {
        onPersist: (_0x42a6c7, _0x15fb7d) => this['_persistProject'](_0x42a6c7, _0x15fb7d),
      })),
      (this['viewportFocalLength'] =
        Number(
          getActiveStoryboard3DShot(this['projectStore']['getSnapshot']())?.['camera']?.['focalLength'],
        ) || 0x23),
      (this['commandHistory'] = createCommandHistory({
        context: {
          getProject: () => this['projectStore']['getSnapshot'](),
          replaceProject: (_0x3d97e4, _0x1a8d64 = {}) => {
            const _0x2a7964 = this['projectStore']['replaceProject'](
              _0x3d97e4,
              _0x1a8d64['reason'] || 'history-command',
            );
            return (this['_render'](this['_historyRenderOptions'] || undefined), _0x2a7964);
          },
        },
        limit: 0x64,
        onChange: () => this['_syncHistoryButtons'](),
      })),
      (this['characterImagePoseController'] = createStoryboard3DCharacterImagePoseController({
        ...(imagePoseEstimator ? { estimator: imagePoseEstimator } : {}),
        ...(imagePoseRetargeter ? { retarget: imagePoseRetargeter } : {}),
        getCharacter: (_0x5e6af2) => {
          for (const _0x2f3dc1 of this['projectStore']['getSnapshot']()['scenes'] || []) {
            const _0x3de966 = _0x2f3dc1['objects']?.['find']((_0x7b76a7) => _0x7b76a7['id'] === _0x5e6af2);
            if (_0x3de966?.['type'] === 'character') return _0x3de966;
          }
          return null;
        },
        applyPose: ({ objectId: _0x2394e1, boneOverrides: _0x37f522, confidence: _0x10d4e8 }) => {
          (this['_executeMutation']({
            type: 'apply-character-pose-from-image',
            label: 'Apply character pose from image',
            mutate: (_0xd53812) => {
              for (const _0x4362d9 of _0xd53812['scenes'] || []) {
                const _0x347568 = _0x4362d9['objects']?.['find'](
                  (_0x423586) => _0x423586['id'] === _0x2394e1,
                );
                if (_0x347568?.['type'] !== 'character') continue;
                ((_0x347568['boneOverrides'] = Object['fromEntries'](
                  Object['entries'](_0x37f522)['map'](([_0x45b348, _0xeb2491]) => [
                    _0x45b348,
                    [..._0xeb2491],
                  ]),
                )),
                  (_0x347568['actionId'] = 'standing'),
                  (_0x347568['actionTime'] = 0x0),
                  (_0x347568['actionPlaying'] = ![]));
                break;
              }
              return _0xd53812;
            },
          }),
            this['_setMessage'](
              '已从参考图应用人物姿势（置信度\x20' + Math['round'](_0x10d4e8 * 0x64) + '%）。',
            ));
        },
        onStateChange: (_0x3ce8ae) => this['_syncCharacterImagePoseUI'](_0x3ce8ae),
      })),
      (this['shotTimelineController'] = createStoryboard3DShotTimelineController({
        windowObject: this['window'],
        getProject: () => this['projectStore']['getSnapshot'](),
        getEditorState: () => this['editorStore']['getSnapshot'](),
        getRoot: () => this['root'],
        readCurrentCamera: () => this['_readCurrentCameraState'](),
        getRuntime: () => this['sceneRuntime'],
        getBinaryAssetRepository: () => this['binaryAssetRepository'],
        getImportedModel: (_0x2e2395) => this['importedModelScenes']['get'](_0x2e2395),
        getGenerationContext: () => ({
          model: this['aiModelId'],
          provider: this['aiProvider'],
          assets: this['modelPackStatus']['assets'],
        }),
        requestGeneration: (_0x1e0631) =>
          dispatchWorkspaceEvent(this['window'], 'storyboard-3d:generate-layer', _0x1e0631),
        importProject: (_0x5ccbb5) =>
          dispatchWorkspaceEvent(this['window'], 'storyboard-3d:save-as-copy', { project: _0x5ccbb5 }),
        sendResults: ({ project: _0x199b15, options: _0x2aba0b, results: _0x4c6b26 }) =>
          dispatchWorkspaceEvent(this['window'], 'storyboard-3d:export-complete', {
            projectId: _0x199b15['id'],
            projectName: _0x199b15['name'],
            options: _0x2aba0b,
            results: _0x4c6b26,
          }),
        previewSample: (_0x5f4d87) => this['_previewShotTimelineSample'](_0x5f4d87),
        clearPreview: () => this['_clearShotTimelinePreview'](),
        expandDirectorPanel: () => this['_applyTimelineHeight'](Math['max'](this['timelineHeight'], 0x1ae)),
        commitMutation: (_0x57fb43) => this['_executeMutation'](_0x57fb43),
        requestRender: () => this['_render'](),
        setMessage: (_0x5df9b6) => this['_setMessage'](_0x5df9b6),
      })));
    let _0x1c46b6 = null;
    const _0x46691e = createStoryboard3DSafeToolExecutor({
      projectStore: {
        getSnapshot: () => this['projectStore']['getSnapshot'](),
        replaceProject: (_0x519f80) => {
          return ((_0x1c46b6 = _0x519f80), _0x519f80);
        },
      },
      assetLibrary: this['assetLibrary'],
      readCurrentCamera: () => this['_readCurrentCameraState'](),
    });
    ((this['aiController'] = createStoryboard3DAIVoiceController({
      projectStore: this['projectStore'],
      model: () => this['aiModelId'],
      provider: () => this['aiProvider'],
      executeTransaction: async (_0x241c65, _0x4df324) => {
        (await this['_ensurePackAssetsForCommands'](_0x241c65), (_0x1c46b6 = null));
        const _0x39faf5 = await _0x46691e(_0x241c65, _0x4df324);
        return (
          _0x39faf5['changed'] &&
            _0x1c46b6 &&
            this['commandHistory']['execute'](
              createStoryboard3DProjectMutationCommand({
                type: 'ai-scene-transaction',
                label: 'AI scene transaction',
                mutate: () => _0x1c46b6,
              }),
            ),
          { ..._0x39faf5, project: this['projectStore']['getSnapshot']() }
        );
      },
      assetLibrary: this['assetLibrary'],
      windowObject: this['window'],
      onStateChange: (_0xeb34ac, _0x2f63ee = {}) => {
        this['aiState'] = _0xeb34ac;
        if (_0x2f63ee['reason'] !== 'set-instruction') this['_syncAIAssistant']();
      },
      onError: (_0xacb61b) => this['_setMessage'](_0xacb61b?.['message'] || String(_0xacb61b)),
    })),
      (this['aiState'] = this['aiController']['getSnapshot']()),
      (this['_unsubscribeProject'] = this['projectStore']['subscribe']((_0x3577ad, _0x226423) => {
        this['_syncSaveStatus'](_0x226423?.['saveStatus']);
      })),
      (this['_unsubscribeEditor'] = this['editorStore']['subscribe'](() => {
        this['_syncResponsiveState']();
      })));
  }
  ['mount']() {
    if (this['root'] || !this['document']?.['body']) return this['root'];
    const _0x453aa6 = this['document']['createElement']('section');
    return (
      (_0x453aa6['className'] = 'storyboard-3d-editor-overlay'),
      (_0x453aa6['dataset']['uiStop'] = '1'),
      _0x453aa6['setAttribute']('role', 'dialog'),
      _0x453aa6['setAttribute']('aria-modal', 'true'),
      (_0x453aa6['tabIndex'] = -0x1),
      _0x453aa6['setAttribute']('aria-label', t('storyboard3d.editor.ariaLabel')),
      (this['backgroundCalibrationInteraction'] = createStoryboard3DBackgroundCalibrationInteraction({
        root: _0x453aa6,
        windowObject: this['window'],
        getBackground: () =>
          getActiveStoryboard3DScene(this['projectStore']['getSnapshot']())?.['background'],
        onPreview: (_0x16735a) => this['_previewBackgroundCalibrationDrag'](_0x16735a),
        onCommit: (_0x562095) => this['_commitBackgroundCalibrationDrag'](_0x562095),
        onCancel: () => this['_render'](),
      })),
      _0x453aa6['addEventListener']('contextmenu', containWorkspaceContextMenu),
      _0x453aa6['addEventListener']('pointerdown', (_0x254dd3) => _0x254dd3['stopPropagation']()),
      _0x453aa6['addEventListener']('pointerdown', this['_handleInspectorResizePointerDown']),
      _0x453aa6['addEventListener']('pointerdown', this['_handleRightSidebarResizePointerDown']),
      _0x453aa6['addEventListener']('pointerdown', this['_handleTimelineResizePointerDown']),
      _0x453aa6['addEventListener']('pointerdown', this['_handleMiniMapPointerDown']),
      _0x453aa6['addEventListener']('wheel', (_0x5dae85) => _0x5dae85['stopPropagation'](), {
        passive: !![],
      }),
      _0x453aa6['addEventListener']('wheel', this['_handleMiniMapWheel'], { passive: ![] }),
      _0x453aa6['addEventListener']('click', this['_handleClick']),
      _0x453aa6['addEventListener']('input', this['_handleInput']),
      _0x453aa6['addEventListener']('change', this['_handleChange']),
      _0x453aa6['addEventListener']('dragstart', this['_handleOutlineDragStart']),
      _0x453aa6['addEventListener']('dragover', this['_handleOutlineDragOver']),
      _0x453aa6['addEventListener']('drop', this['_handleOutlineDrop']),
      (this['root'] = _0x453aa6),
      this['document']['body']['appendChild'](_0x453aa6),
      this['document']['body']['classList']['add']('storyboard-3d-editor-open'),
      this['window']?.['addEventListener']?.('keydown', this['_handleWindowKeyDown'], !![]),
      this['window']?.['addEventListener']?.('keyup', this['_handleWindowKeyUp'], !![]),
      this['window']?.['addEventListener']?.('blur', this['_handleWindowBlur']),
      this['window']?.['addEventListener']?.('resize', this['_syncServerAlertOffset']),
      this['_observeServerAlert'](),
      this['_render'](),
      (this['_modelPackStatusPromise'] = this['_loadModelPackStatus']()),
      (this['_binaryAssetHydrationPromise'] = this['_hydrateBinaryAssets']()),
      _0x453aa6['querySelector']('[data-storyboard-3d-project-name]')?.['focus']?.(),
      _0x453aa6
    );
  }
  ['_observeServerAlert']() {
    const _0x3c7a4f = this['document']?.['getElementById']?.('v2-server-disconnect-alert'),
      _0x1c57d5 = this['document']?.['querySelector']?.('.header');
    this['_syncServerAlertOffset']();
    const _0x42584d = this['window']?.['MutationObserver'];
    _0x3c7a4f &&
      typeof _0x42584d === 'function' &&
      ((this['_serverAlertMutationObserver'] = new _0x42584d(this['_syncServerAlertOffset'])),
      this['_serverAlertMutationObserver']['observe'](_0x3c7a4f, {
        attributes: !![],
        attributeFilter: ['style', 'class'],
        childList: !![],
        subtree: !![],
      }));
    const _0x2cb5e3 = this['window']?.['ResizeObserver'];
    if (typeof _0x2cb5e3 === 'function') {
      this['_serverAlertResizeObserver'] = new _0x2cb5e3(this['_syncServerAlertOffset']);
      if (_0x3c7a4f) this['_serverAlertResizeObserver']['observe'](_0x3c7a4f);
      if (_0x1c57d5) this['_serverAlertResizeObserver']['observe'](_0x1c57d5);
    }
  }
  ['_syncServerAlertOffset']() {
    if (!this['root']) return;
    const _0x2fe2ce = this['document']?.['getElementById']?.('v2-server-disconnect-alert'),
      _0x5b220e = this['document']?.['querySelector']?.('.header');
    let _0xa25640 = Math['max'](0x0, Math['ceil'](_0x5b220e?.['getBoundingClientRect']?.()['bottom'] || 0x0));
    if (_0x2fe2ce) {
      const _0x4a4779 = this['window']?.['getComputedStyle']?.(_0x2fe2ce);
      _0x4a4779?.['display'] !== 'none' &&
        _0x4a4779?.['visibility'] !== 'hidden' &&
        (_0xa25640 = Math['max'](
          _0xa25640,
          Math['max'](0x0, Math['ceil'](_0x2fe2ce['getBoundingClientRect']?.()['bottom'] || 0x0)),
        ));
    }
    this['root']['style']['setProperty']('--storyboard-3d-editor-top-offset', _0xa25640 + 'px');
  }
  ['_disposeSceneRuntime']() {
    (this['_sceneRuntimeResizeObserver']?.['disconnect']?.(), (this['_sceneRuntimeResizeObserver'] = null));
    this['_miniMapRefreshFrame'] !== null &&
      (this['window']?.['cancelAnimationFrame']?.(this['_miniMapRefreshFrame']),
      (this['_miniMapRefreshFrame'] = null));
    const _0x34fbac = this['root']?.['querySelector']?.('[data-storyboard-3d-runtime-host]');
    (_0x34fbac?.['removeEventListener']?.('pointerdown', this['_handleRuntimePointerDown']),
      _0x34fbac?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerHover']),
      _0x34fbac?.['removeEventListener']?.('pointerleave', this['_handleRuntimePointerLeave']),
      _0x34fbac?.['removeEventListener']?.('contextmenu', this['_handleRuntimeContextMenu']),
      _0x34fbac?.['removeEventListener']?.('wheel', this['_handleRuntimeWheel']),
      this['_cancelRuntimeSelection'](),
      this['_cancelRuntimeTransform'](),
      this['sceneRuntime']?.['dispose']?.(),
      (this['sceneRuntime'] = null),
      this['viewportControls']?.['destroy']?.(),
      (this['viewportControls'] = null),
      (this['_gizmoDrag'] = null),
      (this['_selectionDrag'] = null),
      (this['_cameraDrag'] = null),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]));
  }
  ['_showRuntimeFailure'](_0x5d22be, _0x2553e5, { busy: busy = ![] } = {}) {
    const _0x374667 = this['root']?.['querySelector']?.('[data-storyboard-3d-runtime-status]');
    if (!_0x374667) return;
    const _0x1a897f = String(_0x2553e5?.['message'] || _0x2553e5 || '')['trim']();
    !busy &&
      ((this['_runtimeFailureTitle'] = String(_0x5d22be || '3D 视口不可用')),
      (this['_runtimeError'] = _0x1a897f || this['_runtimeError'] || this['_runtimeFailureTitle']));
    ((_0x374667['hidden'] = ![]),
      (_0x374667['dataset']['state'] = busy ? 'rebuilding' : 'error'),
      _0x374667['replaceChildren']?.());
    if (typeof this['document']?.['createElement'] !== 'function') {
      _0x374667['textContent'] = _0x1a897f ? _0x5d22be + '：' + _0x1a897f : _0x5d22be;
      return;
    }
    const _0x5f022e = this['document']['createElement']('strong');
    ((_0x5f022e['textContent'] = _0x5d22be), _0x374667['appendChild'](_0x5f022e));
    if (_0x1a897f) {
      const _0x4468b1 = this['document']['createElement']('span');
      ((_0x4468b1['textContent'] = _0x1a897f), _0x374667['appendChild'](_0x4468b1));
    }
    if (!busy) {
      const _0x1b0f73 = this['document']['createElement']('button');
      ((_0x1b0f73['type'] = 'button'),
        _0x1b0f73['setAttribute']('data-storyboard-3d-action', 'rebuild-viewport'),
        (_0x1b0f73['textContent'] = '重建视口'),
        _0x374667['appendChild'](_0x1b0f73));
    }
  }
  ['_hideRuntimeFailure']() {
    const _0x29b13a = this['root']?.['querySelector']?.('[data-storyboard-3d-runtime-status]');
    if (!_0x29b13a) return;
    ((_0x29b13a['hidden'] = !![]),
      _0x29b13a['removeAttribute']?.('data-state'),
      _0x29b13a['replaceChildren']?.(),
      (this['_runtimeFailureTitle'] = ''));
  }
  ['_rebuildSceneRuntime']() {
    if (this['_closed'] || !this['root']) return ![];
    const _0x4d6f11 = this['projectStore']['getSnapshot'](),
      _0x186e73 = this['editorStore']['getSnapshot']();
    (this['_disposeSceneRuntime'](),
      (this['_runtimeError'] = ''),
      (this['_runtimeFailureTitle'] = ''),
      this['_showRuntimeFailure']('正在重建 3D 视口…', '', { busy: !![] }));
    const _0x2fd777 = this['_mountSceneRuntime'](_0x4d6f11, _0x186e73);
    if (_0x2fd777) this['_setMessage']('3D 视口已重建。');
    return _0x2fd777;
  }
  ['_mountSceneRuntime'](_0x20681b, _0x199f97) {
    const _0x29e41f = this['root']?.['querySelector']?.('[data-storyboard-3d-runtime-host]');
    if (!_0x29e41f) return ![];
    let _0x2b687b = null;
    try {
      ((_0x2b687b = createStoryboard3DSceneRuntime({
        container: _0x29e41f,
        importedModelResolver: (_0x187a47) => this['importedModelScenes']['get'](_0x187a47) || null,
        onVisualChange: () => this['_scheduleMiniMapRefresh'](),
      })),
        _0x2b687b['sync']({
          project: _0x20681b,
          sceneId: _0x20681b['activeSceneId'],
          selectedObjectIds: _0x199f97['selectedObjectIds'],
          activeTool: _0x199f97['activeTool'],
        }),
        _0x29e41f['addEventListener']('pointerdown', this['_handleRuntimePointerDown']),
        _0x29e41f['addEventListener']('pointermove', this['_handleRuntimePointerHover']),
        _0x29e41f['addEventListener']('pointerleave', this['_handleRuntimePointerLeave']),
        _0x29e41f['addEventListener']('contextmenu', this['_handleRuntimeContextMenu']),
        _0x29e41f['addEventListener']('wheel', this['_handleRuntimeWheel'], { passive: ![] }),
        (this['sceneRuntime'] = _0x2b687b),
        this['_scheduleMiniMapRefresh'](),
        (this['viewportControls'] = createStoryboard3DViewportControlSystem({
          sceneRuntime: _0x2b687b,
          initialSceneView: _0x2b687b['getSceneView'](),
          initialSettings: this['viewportSettings'],
          applyViewState: (_0x9e5cf2) => _0x2b687b['commitSceneView'](_0x9e5cf2['sceneView']),
          onChange: (_0x5d337c, _0x4a4c62) => {
            ((this['viewportSettings'] = _0x5d337c['settings']),
              _0x2b687b['setViewportUIPatch']?.(this['viewportControls']?.['getDirectorUIPatch']?.() || {}));
            for (const _0x3b7f16 of this['root']?.['querySelectorAll']?.(
              '[data-storyboard-3d-action="set-viewport-view"]',
            ) || []) {
              const _0x2617e5 = _0x3b7f16['dataset']['view'] === _0x5d337c['viewMode'];
              (_0x3b7f16['classList']?.['toggle']?.('is-active', _0x2617e5),
                _0x3b7f16['setAttribute']?.('aria-pressed', String(_0x2617e5)));
            }
            if (_0x4a4c62?.['reason'] === 'settings') this['_syncViewportSettingControls']();
          },
          onContextStateChange: (_0x26e466, _0x1dbe99) => {
            if (_0x26e466['state'] === 'lost')
              this['_setMessage']('WebGL\x20上下文已丢失，正在等待浏览器恢复。');
            if (_0x26e466['state'] === 'ready' && _0x26e466['lossCount'] > 0x0)
              this['_setMessage']('WebGL\x20上下文已恢复。');
            _0x26e466['state'] === 'error' &&
              ((this['_runtimeError'] =
                _0x1dbe99?.['error']?.['message'] || String(_0x1dbe99?.['error'] || 'WebGL 上下文恢复失败')),
              this['_showRuntimeFailure']('WebGL 恢复失败', this['_runtimeError']));
          },
        })),
        _0x2b687b['setViewportUIPatch'](this['viewportControls']['getDirectorUIPatch']()),
        this['_restoreViewportFocalLength'](),
        (this['_runtimeError'] = ''),
        (this['_runtimeFailureTitle'] = ''),
        this['_hideRuntimeFailure']());
      const _0x370c7f = () => {
          const _0x5f0530 = _0x29e41f['getBoundingClientRect']?.();
          (_0x2b687b['resize'](
            Math['max'](0x1, Math['round'](_0x5f0530?.['width'] || _0x29e41f['clientWidth'] || 0x1)),
            Math['max'](0x1, Math['round'](_0x5f0530?.['height'] || _0x29e41f['clientHeight'] || 0x1)),
          ),
            _0x2b687b['renderNow']());
        },
        _0x514806 = this['window']?.['ResizeObserver'];
      typeof _0x514806 === 'function' &&
        ((this['_sceneRuntimeResizeObserver'] = new _0x514806(_0x370c7f)),
        this['_sceneRuntimeResizeObserver']['observe'](_0x29e41f));
      _0x370c7f();
      const _0x22f017 = getActiveStoryboard3DScene(_0x20681b);
      return (
        _0x22f017?.['shots']?.['some']((_0xbff91) => !_0xbff91['thumbnailUrl']) &&
          this['window']?.['setTimeout']?.(() => {
            if (!this['_closed']) void this['_generateMissingShotThumbnails'](_0x22f017['id']);
          }, 0x0),
        !![]
      );
    } catch (_0x54b680) {
      ((this['_runtimeError'] = _0x54b680?.['message'] || String(_0x54b680)),
        (this['_runtimeFailureTitle'] = '3D\x20视口初始化失败'));
      if (this['sceneRuntime'] === _0x2b687b) this['_disposeSceneRuntime']();
      else _0x2b687b?.['dispose']?.();
      return (this['_showRuntimeFailure']('3D 视口初始化失败', this['_runtimeError']), ![]);
    }
  }
  async ['_renderShotCandidatePreviews'](_0x19ab2a, _0x9b797b) {
    const _0x431701 = this['sceneRuntime'];
    if (!_0x431701) return;
    const _0x5f2d8f = ++this['_candidateRenderToken'],
      _0x588230 = this['window']?.['URL'] || globalThis['URL'];
    for (let _0x42da5d = 0x0; _0x42da5d < this['shotCandidates']['length']; _0x42da5d += 0x1) {
      const _0x43a06c = this['shotCandidates'][_0x42da5d];
      if (_0x43a06c['thumbnailUrl'] || _0x5f2d8f !== this['_candidateRenderToken']) continue;
      const _0x81f8a8 = structuredClone(_0x19ab2a),
        _0x369486 = getActiveStoryboard3DScene(_0x81f8a8),
        _0x3bce44 = getActiveStoryboard3DShot(_0x81f8a8);
      if (!_0x369486 || !_0x3bce44) continue;
      ((_0x3bce44['camera'] = structuredClone(_0x43a06c['camera'])),
        _0x431701['sync']({
          project: _0x81f8a8,
          sceneId: _0x369486['id'],
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        _0x431701['renderNow']());
      try {
        const _0x37a0b7 = await _0x431701['captureBlob']({ includeEditorOverlays: ![] });
        if (_0x5f2d8f !== this['_candidateRenderToken']) return;
        if (_0x37a0b7 && typeof _0x588230?.['createObjectURL'] === 'function') {
          _0x43a06c['thumbnailUrl'] = _0x588230['createObjectURL'](_0x37a0b7);
          const _0x297a57 = this['root']?.['querySelector']?.(
            '[data-candidate-preview="' + _0x42da5d + '\x22]',
          );
          _0x297a57 &&
            (_0x297a57['innerHTML'] =
              '<img src="' +
              escapeHtml(_0x43a06c['thumbnailUrl']) +
              '" alt="候选镜头 ' +
              (_0x42da5d + 0x1) +
              '\x22>');
        }
      } catch (_0x124550) {
        const _0x4eac36 = this['root']?.['querySelector']?.(
          '[data-candidate-preview=\x22' + _0x42da5d + '\x22]',
        );
        if (_0x4eac36) _0x4eac36['textContent'] = _0x124550?.['message'] || '候选预览失败';
      }
    }
    _0x5f2d8f === this['_candidateRenderToken'] &&
      this['sceneRuntime'] === _0x431701 &&
      (_0x431701['sync']({
        project: _0x19ab2a,
        sceneId: _0x19ab2a['activeSceneId'],
        selectedObjectIds: _0x9b797b['selectedObjectIds'],
        activeTool: _0x9b797b['activeTool'],
      }),
      _0x431701['renderNow']());
  }
  ['_clearShotCandidates']() {
    this['_candidateRenderToken'] += 0x1;
    const _0xc8da3f = this['window']?.['URL'] || globalThis['URL'];
    (this['shotCandidates']['forEach']((_0x16339d) => {
      if (_0x16339d['thumbnailUrl']) _0xc8da3f?.['revokeObjectURL']?.(_0x16339d['thumbnailUrl']);
    }),
      (this['shotCandidates'] = []));
  }
  async ['_renderShotFrame'](_0x41302a, { width: _0x164dca, height: _0x47f18e } = {}) {
    return renderStoryboard3DShotFrame({
      shot: _0x41302a,
      width: _0x164dca,
      height: _0x47f18e,
      runtime: this['sceneRuntime'],
      getProject: () => this['projectStore']['getSnapshot'](),
      getEditorState: () => this['editorStore']['getSnapshot'](),
      getHost: () => this['root']?.['querySelector']?.('[data-storyboard-3d-runtime-host]'),
      windowObject: this['window'],
    });
  }
  ['_generateShotThumbnail'](_0x3a092b, _0x344492) {
    return (
      (this['_shotThumbnailQueue'] = this['_shotThumbnailQueue']
        ['catch'](() => ![])
        ['then'](() => this['_generateShotThumbnailNow'](_0x3a092b, _0x344492))),
      this['_shotThumbnailQueue']
    );
  }
  async ['_generateShotThumbnailNow'](_0x29d7dc, _0x34d84f) {
    if (this['_closed'] || !this['sceneRuntime']) return ![];
    const _0x282793 = this['projectStore']['getSnapshot'](),
      _0xc63dd0 = _0x282793['scenes']['find']((_0x588196) => _0x588196['id'] === _0x29d7dc),
      _0x10500f = _0xc63dd0?.['shots']?.['find']((_0x4879cb) => _0x4879cb['id'] === _0x34d84f);
    if (!_0x10500f) return ![];
    const _0x34ab5c = createStoryboard3DShotThumbnailToken(_0x29d7dc, _0x10500f);
    try {
      const _0x569200 = await this['_renderShotFrame'](_0x10500f, { width: 0x140, height: 0xb4 }),
        _0x3eab22 = this['document']?.['createElement']?.('canvas');
      if (!_0x3eab22?.['getContext']) return ![];
      ((_0x3eab22['width'] = 0x140),
        (_0x3eab22['height'] = 0xb4),
        _0x3eab22['getContext']('2d')?.['drawImage']?.(
          _0x569200?.['image'] || _0x569200,
          0x0,
          0x0,
          0x140,
          0xb4,
        ));
      const _0x23494a = _0x3eab22['toDataURL']?.('image/jpeg', 0.78) || '';
      _0x569200?.['close']?.();
      if (!_0x23494a) return ![];
      const _0x2a5628 = applyStoryboard3DShotThumbnail(
        this['projectStore']['getSnapshot'](),
        _0x34ab5c,
        _0x23494a,
        { now: Date['now']() },
      );
      if (!_0x2a5628['applied']) return ![];
      return (
        this['projectStore']['replaceProject'](_0x2a5628['project'], 'shot-thumbnail'),
        this['_render'](),
        dispatchWorkspaceEvent(this['window'], 'storyboard-3d:preview-updated', {
          projectId: this['projectId'],
          sceneId: _0x29d7dc,
          shotId: _0x34d84f,
          previewUrl: _0x23494a,
        }),
        !![]
      );
    } catch (_0x586bf2) {
      return (this['_setMessage'](_0x586bf2?.['message'] || String(_0x586bf2)), ![]);
    }
  }
  async ['_generateMissingShotThumbnails'](_0x3a214a) {
    const _0xd947df = this['projectStore']
        ['getSnapshot']()
        ['scenes']['find']((_0x3a6941) => _0x3a6941['id'] === _0x3a214a),
      _0xcf4753 = (_0xd947df?.['shots'] || [])
        ['filter']((_0x552734) => !_0x552734['thumbnailUrl'])
        ['map']((_0x5ace43) => _0x5ace43['id']);
    for (const _0x377e3c of _0xcf4753) {
      if (this['_closed'] || !this['sceneRuntime']) break;
      await this['_generateShotThumbnail'](_0x3a214a, _0x377e3c);
    }
  }
  ['_syncHistoryButtons']() {
    const _0xc04565 = this['commandHistory']?.['getSnapshot']?.() || {},
      _0x5f5454 = this['root']?.['querySelector']?.('[data-storyboard-3d-action="undo"]'),
      _0x227814 = this['root']?.['querySelector']?.('[data-storyboard-3d-action="redo"]');
    if (_0x5f5454) _0x5f5454['disabled'] = !_0xc04565['canUndo'];
    if (_0x227814) _0x227814['disabled'] = !_0xc04565['canRedo'];
  }
  ['_readCurrentCameraState']() {
    const _0x1e0439 = this['sceneRuntime']?.['readCurrentCamera']?.();
    if (_0x1e0439?.['position'] && _0x1e0439?.['forward']) {
      const _0x46c946 = this['sceneRuntime']?.['getSceneView']?.(),
        _0x110495 = Number(this['sceneRuntime']?.['getViewportFocalLength']?.());
      return {
        position: [_0x1e0439['position']['x'], _0x1e0439['position']['y'], _0x1e0439['position']['z']],
        target: _0x46c946?.['target']
          ? [_0x46c946['target']['x'], _0x46c946['target']['y'], _0x46c946['target']['z']]
          : [
              _0x1e0439['position']['x'] + _0x1e0439['forward']['x'] * 0xa,
              _0x1e0439['position']['y'] + _0x1e0439['forward']['y'] * 0xa,
              _0x1e0439['position']['z'] + _0x1e0439['forward']['z'] * 0xa,
            ],
        focalLength:
          Number['isFinite'](_0x110495) && _0x110495 > 0x0
            ? _0x110495
            : Number(_0x1e0439['focalLength']) || 0x23,
        near: 0.1,
        far: 0x3e8,
        aspectRatio: '16:9',
      };
    }
    return getActiveStoryboard3DShot(this['projectStore']['getSnapshot']())?.['camera'] || null;
  }
  ['_previewFocalLength'](_0x22394e) {
    const _0x3d42c2 = getStoryboard3DFocalPreset(_0x22394e),
      _0x5bcd18 = this['projectStore']['getSnapshot'](),
      _0x1fb2f4 = getActiveStoryboard3DScene(_0x5bcd18),
      _0x44126d = this['_readCurrentCameraState']();
    if (!_0x1fb2f4 || !_0x44126d) return null;
    const _0x10f21f = setStoryboard3DCameraFocalLength(_0x44126d, _0x3d42c2),
      _0x2ece17 = guardStoryboard3DBackgroundCameraChange(_0x1fb2f4['background'], _0x10f21f);
    if (!_0x2ece17['allowed']) return (this['_setMessage'](_0x2ece17['reason']), null);
    ((this['viewportFocalLength'] = _0x3d42c2),
      this['sceneRuntime']?.['setViewportFocalLength']?.(_0x3d42c2));
    const _0xea04b8 = this['root']?.['querySelector']?.('[data-storyboard-3d-focal-slider]');
    if (_0xea04b8) _0xea04b8['value'] = String(resolveStoryboard3DFocalPresetIndex(_0x3d42c2));
    _0xea04b8?.['setAttribute']?.('aria-valuetext', _0x3d42c2 + 'mm');
    const _0x57cf50 = this['root']?.['querySelector']?.('[data-storyboard-3d-focal-output]');
    if (_0x57cf50) _0x57cf50['textContent'] = _0x3d42c2 + 'mm';
    this['root']
      ?.['querySelectorAll']?.('.storyboard-3d-focal-ticks [data-focal-length]')
      ?.['forEach']?.((_0x3b29b3) => {
        _0x3b29b3['classList']['toggle'](
          'is-active',
          Number(_0x3b29b3['dataset']['focalLength']) === _0x3d42c2,
        );
      });
    const _0x78d3de = this['root']?.['querySelector']?.('.storyboard-3d-viewport-hud\x20>\x20strong');
    if (_0x78d3de) _0x78d3de['textContent'] = _0x3d42c2 + 'mm';
    return { camera: _0x10f21f, focalLength: _0x3d42c2, scene: _0x1fb2f4 };
  }
  ['_commitFocalLength'](_0x52ffb2) {
    return Boolean(this['_previewFocalLength'](_0x52ffb2));
  }
  ['_restoreViewportFocalLength']() {
    const _0x1c8349 = Number(this['viewportFocalLength']),
      _0x3ab55c = this['_readCurrentCameraState']();
    if (!Number['isFinite'](_0x1c8349) || !_0x3ab55c) return ![];
    return this['sceneRuntime']?.['setViewportFocalLength']?.(_0x1c8349) === !![];
  }
  ['_previewShotTimelineSample'](_0x4cbaef) {
    if (!_0x4cbaef || !this['sceneRuntime']) return;
    (this['sceneRuntime']['previewTimelineSample']?.(_0x4cbaef),
      (this['_miniMapPreviewSceneView'] = null),
      this['_scheduleMiniMapRefresh']());
  }
  ['_clearShotTimelinePreview']() {
    (this['sceneRuntime']?.['clearPreviews']?.(),
      (this['_miniMapPreviewSceneView'] = null),
      this['_scheduleMiniMapRefresh']());
  }
  ['_syncAIAssistant']() {
    const _0xfc8b26 = this['root']?.['querySelector']?.('[data-storyboard-3d-ai-panel]');
    if (!_0xfc8b26) return;
    (this['_aiModelSelectorController']?.['destroy']?.(),
      (this['_aiModelSelectorController'] = null),
      (_0xfc8b26['outerHTML'] = renderAIAssistant({
        ...this['aiState'],
        modelId: this['aiModelId'],
        provider: this['aiProvider'],
        canUndoAI: this['commandHistory']['getSnapshot']()['nextUndoLabel'] === 'AI\x20scene\x20transaction',
      })),
      this['_bindAIAssistantModelSelector']());
  }
  ['_bindAIAssistantModelSelector']() {
    (this['_aiModelSelectorController']?.['destroy']?.(), (this['_aiModelSelectorController'] = null));
    const _0x453486 = this['root']?.['querySelector']?.(
      '.storyboard-3d-ai-assistant [data-aigen-text-model-selector]',
    );
    if (!_0x453486) return;
    ((this['_aiModelSelectorController'] = bindAIGenTextModelSelector(_0x453486, {
      modelId: this['aiModelId'],
      provider: this['aiProvider'],
      getDisplayModelName: getDisplayModelName,
      documentObject: this['document'],
      onChange: ({ modelId: _0x430f14 }) => {
        const _0x4b7e13 = resolveStoryboard3DTextModelSelection(_0x430f14);
        ((this['aiModelId'] = _0x4b7e13['modelId']), (this['aiProvider'] = _0x4b7e13['provider']));
        const _0x4fd910 = this['root']?.['querySelector']?.('[data-storyboard-3d-action="run-ai-command"]');
        if (_0x4fd910) {
          const _0x5cf3ad = ['planning', 'executing', 'starting', 'listening', 'transcribing', 'stopping'][
            'includes'
          ](this['aiState']['status']);
          _0x4fd910['disabled'] = _0x5cf3ad || !this['aiProvider'];
        }
      },
    })),
      _0x453486['querySelectorAll']?.('.node-model-submenu')?.['forEach']((_0x21e289) => {
        _0x21e289['dataset']['nodeSubmenuPlacement'] = 'viewport-left';
      }));
  }
  ['_syncViewportSettingControls']() {
    for (const _0x50a0f8 of this['root']?.['querySelectorAll']?.('[data-storyboard-3d-viewport-setting]') ||
      []) {
      const _0x31890b = _0x50a0f8['getAttribute']('data-storyboard-3d-viewport-setting');
      if (_0x50a0f8['type'] === 'checkbox')
        _0x50a0f8['checked'] = this['viewportSettings'][_0x31890b] === !![];
      else {
        if (_0x31890b === 'rotationSnapDegrees')
          _0x50a0f8['value'] = String(
            Math['round']((this['viewportSettings']['rotationSnap'] * 0xb4) / Math['PI']),
          );
        else {
          if (_0x31890b in this['viewportSettings'])
            _0x50a0f8['value'] = String(this['viewportSettings'][_0x31890b]);
        }
      }
    }
  }
  ['_syncNavigationSettingControls']() {
    const _0x54dd9a =
      STORYBOARD_3D_NAVIGATION_PRESETS[this['navigationSettings']['preset']] ||
      STORYBOARD_3D_NAVIGATION_PRESETS['unity'];
    for (const _0xe40a8d of this['root']?.['querySelectorAll']?.('[data-storyboard-3d-navigation-preset]') ||
      []) {
      const _0x3d6cb0 = _0xe40a8d['value'] === _0x54dd9a['id'];
      ((_0xe40a8d['checked'] = _0x3d6cb0),
        _0xe40a8d['closest']('.storyboard-3d-navigation-preset')?.['classList']?.['toggle']?.(
          'is-active',
          _0x3d6cb0,
        ));
    }
    for (const _0x5800b7 of this['root']?.['querySelectorAll']?.('[data-storyboard-3d-navigation-setting]') ||
      []) {
      const _0xfc6b33 = _0x5800b7['getAttribute']('data-storyboard-3d-navigation-setting');
      if (_0x5800b7['type'] === 'checkbox')
        _0x5800b7['checked'] = this['navigationSettings'][_0xfc6b33] === !![];
      else _0x5800b7['value'] = String(this['navigationSettings'][_0xfc6b33]);
      const _0x4b3e8e = this['root']?.['querySelector']?.(
        '[data-storyboard-3d-navigation-output="' + _0xfc6b33 + '\x22]',
      );
      if (_0x4b3e8e)
        _0x4b3e8e['textContent'] = Number(this['navigationSettings'][_0xfc6b33])['toFixed'](0x2) + '×';
    }
    const _0x35d137 = this['root']?.['querySelector']?.('[data-storyboard-3d-navigation-current]');
    if (_0x35d137) _0x35d137['textContent'] = _0x54dd9a['label'];
    for (const _0x2c1478 of this['root']?.['querySelectorAll']?.('[data-storyboard-3d-tool-shortcut]') ||
      []) {
      const _0xa8ebe0 = _0x2c1478['getAttribute']('data-storyboard-3d-tool-shortcut'),
        _0x40c57d = getStoryboard3DToolShortcut(_0x54dd9a['id'], _0xa8ebe0),
        _0xd142d8 = _0x2c1478['querySelector']?.('.storyboard-3d-control-shortcut');
      if (_0xd142d8) _0xd142d8['textContent'] = _0x40c57d;
      const _0x317b3c = _0x2c1478['getAttribute']('aria-label') || _0xa8ebe0;
      _0x2c1478['setAttribute']('title', _0x40c57d ? _0x317b3c + '\x20(' + _0x40c57d + ')' : _0x317b3c);
    }
    const _0x33f0e8 = this['root']?.['querySelector']?.('.storyboard-3d-navigation-status:not(.is-fly-mode)');
    _0x33f0e8 && (_0x33f0e8['textContent'] = getStoryboard3DNavigationHelpText({ preset: _0x54dd9a['id'] }));
  }
  ['_saveNavigationSettings'](_0x1821a4) {
    ((this['navigationSettings'] = saveStoryboard3DNavigationSettings(
      _0x1821a4,
      this['window']?.['localStorage'],
    )),
      this['_syncNavigationSettingControls']());
  }
  ['_saveTransformSettings'](_0x4d7c4b) {
    return (
      (this['viewportSettings'] = saveStoryboard3DTransformSettings(
        _0x4d7c4b,
        this['window']?.['localStorage'],
      )),
      this['_syncViewportSettingControls'](),
      this['viewportSettings']
    );
  }
  ['_syncModelImportStatus']() {
    const _0x5b54ba = this['root']?.['querySelector']?.('[data-storyboard-3d-import-status]');
    _0x5b54ba &&
      this['modelImportState'] &&
      (_0x5b54ba['textContent'] =
        (this['modelImportState']['fileName'] || '模型') +
        '\x20·\x20' +
        this['modelImportState']['status'] +
        ' · ' +
        Math['round']((this['modelImportState']['progress'] || 0x0) * 0x64) +
        '%');
  }
  ['_syncCharacterImagePoseUI'](_0x1aa0cb) {
    const _0x3ce1ed = String(_0x1aa0cb?.['objectId'] || ''),
      _0x3ba5d4 = [...(this['root']?.['querySelectorAll']?.('[data-storyboard-3d-character-pose]') || [])][
        'find'
      ]((_0xe9a851) => _0xe9a851['dataset']['objectId'] === _0x3ce1ed);
    if (!_0x3ba5d4) return;
    const _0x31d145 = _0x1aa0cb['status'] === 'running',
      _0x7e3d68 = this['projectStore']
        ['getSnapshot']()
        ['scenes']?.['flatMap']((_0x57cb4) => _0x57cb4['objects'] || [])
        ['find']((_0x5b1c09) => _0x5b1c09['id'] === _0x3ce1ed && _0x5b1c09['type'] === 'character'),
      _0x59eafc = Object['keys'](_0x7e3d68?.['boneOverrides'] || {})['length'] > 0x0;
    ((_0x3ba5d4['dataset']['poseStatus'] = _0x1aa0cb['status'] || 'idle'),
      (_0x3ba5d4['dataset']['hasPose'] = String(_0x59eafc)),
      _0x3ba5d4['setAttribute']('aria-busy', String(_0x31d145)));
    const _0x43fbe0 = _0x3ba5d4['querySelector']('[data-storyboard-3d-action="extract-character-pose"]');
    _0x43fbe0 &&
      ((_0x43fbe0['disabled'] = _0x31d145),
      (_0x43fbe0['textContent'] = _0x31d145 ? '识别中…' : '从图片提取姿势'));
    const _0x541ba5 = _0x3ba5d4['querySelector'](
      '[data-storyboard-3d-action="reset-character-pose"], [data-storyboard-3d-action="cancel-character-pose"]',
    );
    _0x541ba5 &&
      (_0x541ba5['setAttribute'](
        'data-storyboard-3d-action',
        _0x31d145 ? 'cancel-character-pose' : 'reset-character-pose',
      ),
      (_0x541ba5['disabled'] = !_0x31d145 && !_0x59eafc),
      (_0x541ba5['textContent'] = _0x31d145 ? '取消识别' : '重置骨骼'));
    const _0x2bfac5 = _0x3ba5d4['querySelector']('[data-storyboard-3d-character-pose-status]');
    if (_0x2bfac5) _0x2bfac5['textContent'] = getCharacterPoseStatusText(_0x1aa0cb);
  }
  ['_executeMutation']({
    type: _0x3dfcd4,
    label: _0x51fc9f,
    mutate: _0x1dffbd,
    renderOptions: renderOptions = null,
  }) {
    const _0x1a80ec = this['_historyRenderOptions'];
    this['_historyRenderOptions'] = renderOptions;
    try {
      return this['commandHistory']['execute'](
        createStoryboard3DProjectMutationCommand({ type: _0x3dfcd4, label: _0x51fc9f, mutate: _0x1dffbd }),
      );
    } finally {
      this['_historyRenderOptions'] = _0x1a80ec;
    }
  }
  ['_previewBackgroundCalibrationDrag'](_0x34d729) {
    const _0x6665f1 = this['projectStore']['getSnapshot'](),
      _0x42dacf = getActiveStoryboard3DShot(_0x6665f1);
    if (!_0x34d729?.['imageUrl'] || !_0x42dacf?.['camera']) return;
    this['sceneRuntime']?.['previewCamera']?.(
      deriveStoryboard3DBackgroundCamera(_0x34d729, _0x42dacf['camera']),
    );
  }
  ['_commitBackgroundCalibrationDrag'](_0x17c726) {
    this['_executeMutation']({
      type: 'adjust-background-perspective',
      label: 'Adjust background perspective',
      mutate: (_0x4567c3) => {
        const _0x51c90a = getActiveStoryboard3DScene(_0x4567c3),
          _0x47c0b3 = getActiveStoryboard3DShot(_0x4567c3);
        if (!_0x51c90a?.['background']) return _0x4567c3;
        const _0x5c358e = updateStoryboard3DBackgroundCalibration(_0x51c90a['background'], {
          horizonY: _0x17c726['horizonY'],
          vanishingPoint: [..._0x17c726['vanishingPoint']],
          calibrationMethod: 'manual',
          calibrationConfidence: 0x1,
        });
        if (_0x47c0b3?.['camera']) {
          const _0x50f31e = deriveStoryboard3DBackgroundCamera(_0x5c358e, _0x47c0b3['camera']);
          (setStoryboard3DShotInitialCamera(_0x51c90a, _0x47c0b3, _0x50f31e),
            (_0x51c90a['background'] = setStoryboard3DBackgroundCameraLock(
              _0x5c358e,
              _0x5c358e['lockedCamera'],
              _0x47c0b3['camera'],
            )));
        } else _0x51c90a['background'] = _0x5c358e;
        return _0x4567c3;
      },
    });
  }
  ['_deleteObjects'](_0x4c4b04) {
    const _0x4f554c = [
      ...new Set(
        (Array['isArray'](_0x4c4b04) ? _0x4c4b04 : [_0x4c4b04])
          ['map']((_0xdb4564) => String(_0xdb4564 || '')['trim']())
          ['filter'](Boolean),
      ),
    ];
    if (_0x4f554c['length'] === 0x0) return ![];
    const _0x169328 = this['projectStore']
        ['getSnapshot']()
        ['scenes']['find'](
          (_0x3f855c) => _0x3f855c['id'] === this['projectStore']['getSnapshot']()['activeSceneId'],
        ),
      _0x19abd6 = _0x169328 ? directorDeletionImpact(_0x169328, _0x4f554c) : '';
    (this['_executeMutation']({
      type: _0x4f554c['length'] === 0x1 ? 'delete-object' : 'delete-objects',
      label: _0x4f554c['length'] === 0x1 ? 'Delete object' : 'Delete objects',
      mutate: (_0x386599) => {
        const _0x4a2643 = _0x386599['scenes']['findIndex'](
          (_0x15a437) => _0x15a437['id'] === _0x386599['activeSceneId'],
        );
        if (_0x4a2643 < 0x0) return _0x386599;
        let _0x2a5b0f = _0x386599['scenes'][_0x4a2643];
        return (
          _0x4f554c['forEach']((_0x4b4388) => {
            const _0x2e5e59 = _0x2a5b0f['objects']?.['find']((_0xd06ff8) => _0xd06ff8['id'] === _0x4b4388);
            if (!_0x2e5e59) return;
            if (_0x2e5e59['type'] === 'camera') {
              const _0x41bee4 = _0x2a5b0f['shots']?.['find'](
                (_0x14f3a2) => _0x14f3a2['cameraId'] === _0x4b4388,
              );
              _0x2a5b0f = _0x41bee4
                ? deleteStoryboard3DShot(_0x2a5b0f, _0x41bee4['id'])
                : {
                    ..._0x2a5b0f,
                    objects: _0x2a5b0f['objects']['filter']((_0x4d59eb) => _0x4d59eb['id'] !== _0x4b4388),
                  };
              return;
            }
            if (_0x2e5e59['type'] === 'group') {
              _0x2a5b0f = deleteStoryboard3DSceneGroup(_0x2a5b0f, _0x4b4388, { deleteChildren: ![] });
              return;
            }
            _0x2a5b0f = {
              ..._0x2a5b0f,
              objects: _0x2a5b0f['objects']['filter']((_0xca2680) => _0xca2680['id'] !== _0x4b4388),
            };
          }),
          (_0x386599['scenes'][_0x4a2643] = _0x2a5b0f),
          _0x386599
        );
      },
    }),
      this['_setSelectedObjects']([]));
    if (_0x19abd6) this['_setMessage'](_0x19abd6);
    return (this['_render'](), !![]);
  }
  ['_activateShotForCamera'](_0x2a1fb1) {
    const _0x56ab45 = this['projectStore']['getSnapshot'](),
      _0x22036f = getActiveStoryboard3DScene(_0x56ab45),
      _0x5d1823 = _0x22036f?.['shots']?.['find']((_0x23e0a3) => _0x23e0a3['cameraId'] === _0x2a1fb1);
    if (!_0x5d1823) return !![];
    const _0x128910 = guardStoryboard3DBackgroundCameraChange(_0x22036f['background'], _0x5d1823['camera']);
    if (!_0x128910['allowed']) return (this['_setMessage'](_0x128910['reason']), ![]);
    return (this['projectStore']['selectShot'](_0x5d1823['id']), !![]);
  }
  ['_focusCameraObject'](_0x5ae977) {
    if (!_0x5ae977) return;
    const _0x374086 = () => this['viewportControls']?.['focusObject']?.('camera', _0x5ae977),
      _0x1d2691 =
        this['window']?.['requestAnimationFrame']?.['bind'](this['window']) ||
        globalThis['requestAnimationFrame']?.['bind'](globalThis);
    if (_0x1d2691) _0x1d2691(_0x374086);
    else queueMicrotask(_0x374086);
  }
  ['_recordTransformedKeyframes'](_0x2c1f8c, _0x6221c4) {
    if (typeof this['projectStore']?.['getSnapshot'] !== 'function') {
      this['shotTimelineController']?.['recordObjectTransforms']?.(_0x2c1f8c, _0x6221c4);
      return;
    }
    const _0x2078ba = this['projectStore']['getSnapshot'](),
      _0x4e3d63 = getActiveStoryboard3DScene(_0x2078ba),
      _0x52024c = getActiveStoryboard3DShot(_0x2078ba),
      _0xddadf1 = _0x52024c?.['cameraId'] && _0x2c1f8c?.[_0x52024c['cameraId']];
    if (_0xddadf1) this['shotTimelineController']?.['recordCameraKeyframe']?.(_0x52024c['camera']);
    const _0x2266d4 = Object['fromEntries'](
      Object['entries'](_0x2c1f8c || {})['filter'](
        ([_0x176079]) =>
          _0x4e3d63?.['objects']?.['find']((_0x52701f) => _0x52701f['id'] === _0x176079)?.['type'] !==
          'camera',
      ),
    );
    Object['keys'](_0x2266d4)['length'] > 0x0 &&
      this['shotTimelineController']?.['recordObjectTransforms']?.(_0x2266d4, _0x6221c4);
  }
  ['_commitObjectTransforms']({
    sceneId: _0x5ed6a5,
    transforms: _0x352fd1,
    activeTool: _0x26ed7b,
    label: _0x8b64f1,
  }) {
    const _0x56b278 = () => {
      const _0x5b4fc1 = this['commandHistory']['execute'](
        createStoryboard3DTransformCommand({
          sceneId: _0x5ed6a5,
          transforms: _0x352fd1,
          label: _0x8b64f1,
          mergeKey: ![],
        }),
      );
      if (_0x5b4fc1 !== ![]) this['_recordTransformedKeyframes'](_0x352fd1, _0x26ed7b);
      return _0x5b4fc1;
    };
    if (
      this['shotTimelineController']?.['isAutoKeyEnabled']?.() &&
      typeof this['commandHistory']['runTransaction'] === 'function'
    )
      return this['commandHistory']['runTransaction'](_0x8b64f1 + '\x20+\x20Auto\x20Key', _0x56b278);
    return _0x56b278();
  }
  ['_applyDetectedBackgroundCalibration'](
    _0x5a8594,
    { type: type = 'calibrate-background', label: label = 'Calibrate background' } = {},
  ) {
    const _0x54f4cb = this['_readCurrentCameraState']?.() || createDefaultStoryboard3DCameraState();
    this['_executeMutation']({
      type: type,
      label: label,
      mutate: (_0x40a021) => {
        const _0xe3ce5 = _0x40a021['scenes']['findIndex'](
          (_0x2f860b) => _0x2f860b['id'] === _0x40a021['activeSceneId'],
        );
        if (_0xe3ce5 < 0x0) return _0x40a021;
        let _0x549ad4 = _0x40a021['scenes'][_0xe3ce5],
          _0x1c6e46 = _0x549ad4['shots']?.['find'](
            (_0x45dbfd) => _0x45dbfd['id'] === _0x549ad4['activeShotId'],
          );
        !_0x1c6e46 &&
          ((_0x549ad4 = appendShotFromCurrentView({ scene: _0x549ad4, camera: _0x54f4cb })),
          (_0x40a021['scenes'][_0xe3ce5] = _0x549ad4),
          (_0x1c6e46 = _0x549ad4['shots']['find'](
            (_0xa38d29) => _0xa38d29['id'] === _0x549ad4['activeShotId'],
          )));
        if (!_0x1c6e46) return _0x40a021;
        const _0x4e441c = updateStoryboard3DBackgroundCalibration(_0x549ad4['background'], _0x5a8594),
          _0x461be6 = deriveStoryboard3DBackgroundCamera(_0x4e441c, _0x1c6e46['camera']);
        return (
          setStoryboard3DShotInitialCamera(_0x549ad4, _0x1c6e46, _0x461be6),
          (_0x549ad4['background'] = setStoryboard3DBackgroundCameraLock(
            _0x4e441c,
            !![],
            _0x1c6e46['camera'],
          )),
          _0x40a021
        );
      },
    });
    const _0x108396 =
      this['viewportControls']?.['updateSettings']?.({ groundLock: !![] }) ||
      normalizeStoryboard3DViewportSettings({ ...this['viewportSettings'], groundLock: !![] });
    (this['_saveTransformSettings'](_0x108396),
      this['sceneRuntime']?.['setViewportUIPatch']?.(
        this['viewportControls']?.['getDirectorUIPatch']?.() || {},
      ),
      (this['sceneEnvironmentOpen'] = !![]));
  }
  async ['_reanalyzeActiveBackground']() {
    try {
      const _0x538e09 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']()),
        _0x57f1a3 = _0x538e09?.['background']?.['binaryAssetId'];
      if (!_0x538e09 || !_0x57f1a3) throw new Error('当前背景缺少可重新分析的本地原图。');
      this['_setMessage']('正在分析地面、地平线和消失点…');
      const _0x59cfdf = await this['binaryAssetRepository']['get'](_0x57f1a3),
        _0x1bb828 = restoreStoryboard3DStoredFile(_0x59cfdf?.['primaryFile'], this['window']);
      if (!_0x1bb828) throw new Error('无法读取当前背景原图。');
      const _0x50f7f8 = await analyzeStoryboard3DBackgroundImage(_0x1bb828, {
        documentObject: this['document'],
        imageBitmapFactory:
          typeof this['window']?.['createImageBitmap'] === 'function'
            ? this['window']['createImageBitmap']['bind'](this['window'])
            : undefined,
      });
      (this['_applyDetectedBackgroundCalibration'](_0x50f7f8, {
        type: 'reanalyze-background',
        label: 'Reanalyze background',
      }),
        this['_setMessage'](
          '背景透视已重新匹配并锁定，当前匹配度 ' +
            Math['round'](_0x50f7f8['calibrationConfidence'] * 0x64) +
            '%。',
        ));
    } catch (_0x5bffaa) {
      this['_setMessage'](_0x5bffaa?.['message'] || String(_0x5bffaa));
    }
  }
  ['_getBackgroundImageController'](_0x26733d) {
    const _0x2e25f0 = String(_0x26733d || '');
    return (
      !this['backgroundImageControllers']['has'](_0x2e25f0) &&
        this['backgroundImageControllers']['set'](
          _0x2e25f0,
          createStoryboard3DBackgroundImageController({
            urlApi: this['window']?.['URL'] || globalThis['URL'],
          }),
        ),
      this['backgroundImageControllers']['get'](_0x2e25f0)
    );
  }
  ['_setImportedModelScene'](_0x601bed, _0x85a944, _0x1b71c4 = null) {
    const _0x19967c = this['importedModelScenes']['get'](_0x601bed);
    (_0x19967c &&
      _0x19967c !== _0x85a944 &&
      disposeCancelledStoryboard3DModelImportResult({ parsed: { scene: _0x19967c } }),
      this['importedModelScenes']['set'](_0x601bed, setStoryboard3DModelNormalization(_0x85a944, _0x1b71c4)));
  }
  ['_getAssetThumbnailRenderer']() {
    return (
      !this['assetThumbnailRenderer'] &&
        (this['assetThumbnailRenderer'] = createStoryboard3DAssetThumbnailRenderer({
          documentObject: this['document'],
        })),
      this['assetThumbnailRenderer']
    );
  }
  ['_syncAssetThumbnail'](_0x2c4dd4, _0xc3b003, _0x564fde = 'ready') {
    const _0x502c64 =
      '[data-storyboard-3d-asset-thumbnail][data-asset-id="' +
      (globalThis['CSS']?.['escape']?.(_0x2c4dd4) || _0x2c4dd4) +
      '\x22]';
    this['root']?.['querySelectorAll']?.(_0x502c64)?.['forEach']((_0x4fb4b4) => {
      _0x4fb4b4['dataset']['thumbnailStatus'] = _0x564fde;
      if (_0xc3b003) {
        const _0x11f8fa = this['assetLibrary']['find'](_0x2c4dd4),
          _0x19af8c = this['document']['createElement']('img');
        ((_0x19af8c['src'] = _0xc3b003),
          (_0x19af8c['alt'] = (_0x11f8fa?.['name'] || '模型') + ' 模型预览'),
          _0x4fb4b4['replaceChildren'](_0x19af8c));
      } else {
        if (_0x564fde === 'unavailable') {
          const _0x3860bd = this['document']['createElement']('small');
          ((_0x3860bd['textContent'] = '暂无预览'), _0x4fb4b4['replaceChildren'](_0x3860bd));
        }
      }
    });
  }
  ['_ensureAssetThumbnail'](_0x281f53) {
    const _0x372471 = this['assetLibrary']['find'](_0x281f53);
    if (!_0x372471 || this['_assetThumbnailFailures']['has'](_0x372471['id'])) return Promise['resolve']('');
    const _0x5f63bf = storyboard3DAssetThumbnailCache['get'](_0x372471);
    if (_0x5f63bf)
      return (this['_syncAssetThumbnail'](_0x372471['id'], _0x5f63bf), Promise['resolve'](_0x5f63bf));
    if (this['_assetThumbnailLoads']['has'](_0x372471['id']))
      return this['_assetThumbnailLoads']['get'](_0x372471['id']);
    const _0x3627ab =
      _0x372471['source']?.['kind'] === 'builtin'
        ? createStoryboard3DBuiltinAssetThumbnailModel(_0x372471['source']['assetId'] || _0x372471['id'], {
            clayColor: _0x372471['tint'],
          })
        : null;
    if (
      _0x372471['source']?.['kind'] !== 'pack' &&
      !this['importedModelScenes']['has'](_0x372471['id']) &&
      !_0x3627ab
    )
      return (
        this['_assetThumbnailFailures']['add'](_0x372471['id']),
        this['_syncAssetThumbnail'](_0x372471['id'], '', 'unavailable'),
        Promise['resolve']('')
      );
    this['_syncAssetThumbnail'](_0x372471['id'], '', 'loading');
    const _0x4b5bc8 = this['_assetThumbnailQueue']
      ['catch'](() => '')
      ['then'](async () => {
        const _0x37a7d8 = _0x3627ab;
        try {
          if (this['_closed']) return '';
          const _0x1594ad =
            _0x37a7d8 ||
            this['importedModelScenes']['get'](_0x372471['id']) ||
            (await this['_loadPackAsset'](_0x372471['id']));
          if (!_0x1594ad || this['_closed']) return '';
          const _0xf63996 = this['_getAssetThumbnailRenderer']()['render'](_0x1594ad);
          return (
            storyboard3DAssetThumbnailCache['set'](_0x372471, _0xf63996),
            this['_syncAssetThumbnail'](_0x372471['id'], _0xf63996),
            _0xf63996
          );
        } finally {
          if (_0x37a7d8) disposeStoryboard3DAssetThumbnailModel(_0x37a7d8);
        }
      })
      ['catch'](() => {
        return (
          this['_assetThumbnailFailures']['add'](_0x372471['id']),
          this['_syncAssetThumbnail'](_0x372471['id'], '', 'unavailable'),
          ''
        );
      })
      ['finally'](() => this['_assetThumbnailLoads']['delete'](_0x372471['id']));
    return (
      this['_assetThumbnailLoads']['set'](_0x372471['id'], _0x4b5bc8),
      (this['_assetThumbnailQueue'] = _0x4b5bc8),
      _0x4b5bc8
    );
  }
  ['_observeVisibleAssetThumbnails']() {
    (this['_assetThumbnailObserver']?.['disconnect']?.(), (this['_assetThumbnailObserver'] = null));
    if (!this['editorStore']['getSnapshot']()['assetLibraryOpen']) return;
    const _0x57e5be = [
      ...(this['root']?.['querySelectorAll']?.(
        '[data-storyboard-3d-asset-thumbnail][data-thumbnail-status="pending"]',
      ) || []),
    ];
    if (_0x57e5be['length'] === 0x0) return;
    const _0x4340cb = this['window']?.['IntersectionObserver'];
    if (typeof _0x4340cb !== 'function') {
      _0x57e5be['slice'](0x0, 0xc)['forEach']((_0x11eec8) => {
        void this['_ensureAssetThumbnail'](_0x11eec8['dataset']['assetId']);
      });
      return;
    }
    ((this['_assetThumbnailObserver'] = new _0x4340cb(
      (_0x3d7fd5) => {
        _0x3d7fd5['forEach']((_0x4bfe6e) => {
          if (!_0x4bfe6e['isIntersecting']) return;
          (this['_assetThumbnailObserver']?.['unobserve']?.(_0x4bfe6e['target']),
            void this['_ensureAssetThumbnail'](_0x4bfe6e['target']['dataset']['assetId']));
        });
      },
      { root: this['root']['querySelector']('.storyboard-3d-asset-grid'), rootMargin: '120px' },
    )),
      _0x57e5be['forEach']((_0x1de1b5) => this['_assetThumbnailObserver']['observe'](_0x1de1b5)));
  }
  async ['_loadModelPackStatus']() {
    try {
      const _0x172987 = await this['modelPackApi']['getStatus']();
      this['modelPackStatus'] = { ..._0x172987, loaded: !![], error: '' };
      if (this['_closed']) return this['modelPackStatus'];
      if (!_0x172987['installed'])
        return (
          this['_setMessage']('3D 模型包尚未安装，请返回 3D 场景预演首页完成下载后再使用 Agent。'),
          this['modelPackStatus']
        );
      (this['assetLibrary']['registerPackAssets'](_0x172987['assets'], { packId: _0x172987['packId'] }),
        await this['_hydratePackAssetsForProject']());
      if (!this['_closed'] && !this['_runtimeError']) this['_render']();
      return this['modelPackStatus'];
    } catch (_0x73facc) {
      const _0x22bc10 = '无法读取 3D 模型包：' + (_0x73facc?.['message'] || String(_0x73facc));
      return (
        (this['modelPackStatus'] = { loaded: !![], installed: ![], assets: [], error: _0x22bc10 }),
        this['_setMessage'](_0x22bc10),
        this['modelPackStatus']
      );
    }
  }
  async ['_requireInstalledModelPack']() {
    const _0x4be108 = this['_modelPackStatusPromise']
      ? await this['_modelPackStatusPromise']
      : await this['_loadModelPackStatus']();
    if (!_0x4be108?.['installed'])
      throw new Error(_0x4be108?.['error'] || '3D 模型包尚未安装，无法生成场景。请先返回首页下载模型包。');
    return _0x4be108;
  }
  async ['_loadPackAsset'](_0xf199dd) {
    const _0x3c9124 = this['assetLibrary']['find'](_0xf199dd);
    if (_0x3c9124?.['source']?.['kind'] !== 'pack') return null;
    if (this['importedModelScenes']['has'](_0x3c9124['id']))
      return this['importedModelScenes']['get'](_0x3c9124['id']);
    if (this['_packAssetLoads']['has'](_0x3c9124['id']))
      return this['_packAssetLoads']['get'](_0x3c9124['id']);
    const _0x10c867 = (async () => {
      const _0x3d6989 = await this['modelPackApi']['fetchAssetFile'](_0x3c9124['source']),
        _0x379f31 = await importStoryboard3DModelFile(_0x3d6989, {
          parsers: this['modelParsers'],
          targetSize: getStoryboard3DAssetSpatialExtent(_0x3c9124),
        });
      await applyStoryboard3DTexturePolicy(_0x379f31['parsed']['scene'], {
        renderer: this['sceneRuntime']?.['bridge']?.['renderer'],
      });
      if (this['_closed']) {
        disposeCancelledStoryboard3DModelImportResult(_0x379f31);
        throw new Error('3D\x20编辑器已关闭。');
      }
      return (
        this['_setImportedModelScene'](
          _0x3c9124['id'],
          _0x379f31['parsed']['scene'],
          _0x379f31['normalization'],
        ),
        _0x379f31['parsed']['scene']
      );
    })()['catch']((_0x41dfba) => {
      this['_packAssetLoads']['delete'](_0x3c9124['id']);
      throw new Error(
        '模型包素材“' + _0x3c9124['name'] + '”加载失败：' + (_0x41dfba?.['message'] || String(_0x41dfba)),
      );
    });
    return (this['_packAssetLoads']['set'](_0x3c9124['id'], _0x10c867), _0x10c867);
  }
  async ['_hydratePackAssetsForProject']() {
    const _0x11822e = [
        ...new Set(
          this['projectStore']
            ['getSnapshot']()
            ['scenes']['flatMap']((_0x1a5722) =>
              _0x1a5722['objects']
                ['filter']((_0x3b86ed) => _0x3b86ed['type'] === 'prop')
                ['map']((_0x1191e5) => _0x1191e5['assetId']),
            )
            ['filter'](Boolean),
        ),
      ],
      _0x57f2ce = _0x11822e['filter'](
        (_0x130c04) => this['assetLibrary']['find'](_0x130c04)?.['source']?.['kind'] === 'pack',
      );
    if (_0x57f2ce['length'] === 0x0) return [];
    const _0x5b4ef5 = await Promise['allSettled'](
        _0x57f2ce['map']((_0x2e2ac7) => this['_loadPackAsset'](_0x2e2ac7)),
      ),
      _0x381386 = _0x5b4ef5['find']((_0x41b46e) => _0x41b46e['status'] === 'rejected');
    if (_0x381386) this['_setMessage'](_0x381386['reason']?.['message'] || String(_0x381386['reason']));
    return _0x5b4ef5;
  }
  async ['_ensurePackAssetsForCommands'](_0x345172 = []) {
    await this['_requireInstalledModelPack']();
    const _0x144056 = [
      ...new Set(
        _0x345172['filter']((_0x8d8c89) => _0x8d8c89?.['tool'] === 'addProp')
          ['map']((_0x247e42) => _0x247e42?.['args']?.['assetId'])
          ['filter']((_0x21f7ed) => this['assetLibrary']['find'](_0x21f7ed)?.['source']?.['kind'] === 'pack'),
      ),
    ];
    await Promise['all'](_0x144056['map']((_0x19cefc) => this['_loadPackAsset'](_0x19cefc)));
  }
  async ['_hydrateBinaryAssets']() {
    const _0x114343 = this['projectStore']['getSnapshot'](),
      _0x47fbe9 = [
        ...new Set(
          _0x114343['scenes']
            ['flatMap']((_0x44feac) =>
              _0x44feac['objects']
                ['filter']((_0x1547c3) => _0x1547c3['type'] === 'prop')
                ['map']((_0x1c585a) => _0x1c585a['assetId']),
            )
            ['filter'](Boolean),
        ),
      ],
      _0x554dd9 = [
        ...new Set(
          _0x114343['scenes']
            ['map']((_0x93ed92) => _0x93ed92['background']?.['binaryAssetId'])
            ['filter'](Boolean),
        ),
      ],
      _0x4c421e = [...new Set([..._0x47fbe9, ..._0x554dd9])];
    if (_0x4c421e['length'] === 0x0) return { restoredModels: 0x0, restoredBackgrounds: 0x0 };
    try {
      const _0x15cae3 = await this['binaryAssetRepository']['getMany'](_0x4c421e);
      if (this['_closed']) return { restoredModels: 0x0, restoredBackgrounds: 0x0 };
      let _0x3f75f5 = 0x0;
      const _0x50d1d0 = new Map();
      for (const _0x554e9e of _0x15cae3['filter'](Boolean)) {
        const _0x30c65c = restoreStoryboard3DStoredFile(_0x554e9e['primaryFile'], this['window']),
          _0x575fea = _0x554e9e['relatedFiles']
            ['map']((_0x423ede) => restoreStoryboard3DStoredFile(_0x423ede, this['window']))
            ['filter'](Boolean);
        if (!_0x30c65c) continue;
        if (_0x554e9e['kind'] === 'model') {
          const _0x4e17e7 = await importStoryboard3DModelFile(_0x30c65c, {
            parsers: this['modelParsers'],
            relatedFiles: _0x575fea,
          });
          if (this['_closed']) {
            disposeCancelledStoryboard3DModelImportResult(_0x4e17e7);
            break;
          }
          await applyStoryboard3DTexturePolicy(_0x4e17e7['parsed']['scene'], {
            renderer: this['sceneRuntime']?.['bridge']?.['renderer'],
          });
          if (this['_closed']) {
            disposeCancelledStoryboard3DModelImportResult(_0x4e17e7);
            break;
          }
          const _0x343093 = _0x554e9e['descriptor']?.['assetDescriptor'];
          if (_0x343093) this['assetLibrary']['registerImported'](_0x343093);
          (this['_setImportedModelScene'](
            _0x554e9e['assetId'],
            _0x4e17e7['parsed']['scene'],
            _0x4e17e7['normalization'],
          ),
            (_0x3f75f5 += 0x1));
        } else
          _0x554e9e['kind'] === 'background' &&
            _0x114343['scenes']
              ['filter']((_0x294c9c) => _0x294c9c['background']?.['binaryAssetId'] === _0x554e9e['assetId'])
              ['forEach']((_0x32c517) => {
                const _0x3edd90 = this['_getBackgroundImageController'](_0x32c517['id'])['load'](_0x30c65c);
                _0x50d1d0['set'](_0x32c517['id'], _0x3edd90['imageUrl']);
              });
      }
      _0x50d1d0['size'] > 0x0 &&
        this['projectStore']['updateProject']('restore-background-assets', (_0x59b71e) => {
          _0x59b71e['scenes']['forEach']((_0x321368) => {
            _0x321368['background'] &&
              _0x50d1d0['has'](_0x321368['id']) &&
              (_0x321368['background']['imageUrl'] = _0x50d1d0['get'](_0x321368['id']));
          });
        });
      if (_0x3f75f5 > 0x0 || _0x50d1d0['size'] > 0x0) this['_render']();
      return { restoredModels: _0x3f75f5, restoredBackgrounds: _0x50d1d0['size'] };
    } catch (_0x2d8102) {
      if (!this['_closed'])
        this['_setMessage']('本地 3D 资源恢复失败：' + (_0x2d8102?.['message'] || String(_0x2d8102)));
      return { restoredModels: 0x0, restoredBackgrounds: 0x0, error: _0x2d8102 };
    }
  }
  ['_getObject'](_0x92fd32, _0x4dffa3) {
    const _0xed5b8c = this['projectStore']['getSnapshot'](),
      _0x417b3a = _0xed5b8c['scenes']['find']((_0xa98f1) => _0xa98f1['id'] === _0x92fd32);
    return _0x417b3a?.['objects']?.['find']((_0x833606) => _0x833606['id'] === _0x4dffa3) || null;
  }
  ['_handleRuntimePointerDown'](_0xb1817f) {
    if (!this['sceneRuntime']) return;
    const _0x1f8156 = this['editorStore']['getSnapshot'](),
      _0x664abe = resolveStoryboard3DNavigationMode(_0xb1817f, {
        flyMode: _0x1f8156['flyMode'],
        preset: this['navigationSettings']['preset'],
      });
    if (_0x664abe) {
      const _0x1c771c = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
      if (_0x1c771c?.['background']?.['lockedCamera']) {
        this['_setMessage']('背景机位已锁定；请先解除锁定再导航视口。');
        return;
      }
      const _0x305eea = this['sceneRuntime']['getSceneView']?.(),
        _0x3ebb38 = _0xb1817f['currentTarget'],
        _0x1293e7 = _0x3ebb38?.['getBoundingClientRect']?.();
      if (!_0x305eea || !_0x1293e7?.['width'] || !_0x1293e7?.['height']) return;
      (_0xb1817f['preventDefault'](), _0xb1817f['stopPropagation']());
      const _0x4c819d = structuredClone(
        _0x664abe === 'fly-look' ? this['_flySceneView'] || _0x305eea : _0x305eea,
      );
      if (_0x664abe === 'fly-look') this['_flySceneView'] = _0x4c819d;
      const _0x50750a = this['sceneRuntime']['readCurrentCamera']?.();
      ((this['_cameraDrag'] = {
        mode: _0x664abe,
        startX: _0xb1817f['clientX'],
        startY: _0xb1817f['clientY'],
        lastX: _0xb1817f['clientX'],
        lastY: _0xb1817f['clientY'],
        rect: _0x1293e7,
        sceneView: _0x4c819d,
        cameraPose: _0x50750a,
        fov: this['sceneRuntime']['getViewportFov']?.() ?? _0x50750a?.['fov'],
        latestSceneView: _0x4c819d,
        pointerId: _0xb1817f['pointerId'],
        host: _0x3ebb38,
      }),
        _0x3ebb38?.['classList']?.['add']?.('is-camera-' + _0x664abe));
      try {
        _0x3ebb38?.['setPointerCapture']?.(_0xb1817f['pointerId']);
      } catch {}
      (this['window']?.['addEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
        this['window']?.['addEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
        this['window']?.['addEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]));
      return;
    }
    if (_0xb1817f['button'] !== 0x0) return;
    (_0xb1817f['preventDefault'](), _0xb1817f['stopPropagation']());
    const _0x7dc79d = this['sceneRuntime']['pickGizmoHandle'](_0xb1817f['clientX'], _0xb1817f['clientY']);
    if (_0x7dc79d && _0x1f8156['selectedObjectIds']['length'] > 0x0) {
      const _0xb2c912 = this['sceneRuntime']['beginGizmoDrag']({
        handleKey: _0x7dc79d['handleKey'],
        clientX: _0xb1817f['clientX'],
        clientY: _0xb1817f['clientY'],
      });
      if (_0xb2c912) {
        const _0x4f887c = this['projectStore']['getSnapshot'](),
          _0x4d0584 = getActiveStoryboard3DScene(_0x4f887c),
          _0x9ad0b1 = {};
        _0x1f8156['selectedObjectIds']['forEach']((_0x13d73f) => {
          const _0x154023 = _0x4d0584?.['objects']?.['find']((_0x27a741) => _0x27a741['id'] === _0x13d73f);
          _0x154023 &&
            _0x154023['visible'] !== ![] &&
            _0x154023['locked'] !== !![] &&
            canStoryboard3DObjectUseTransformTool(_0x154023, _0x1f8156['activeTool']) &&
            (_0x9ad0b1[_0x13d73f] = structuredClone(
              this['shotTimelineController']?.['getPreviewTransform']?.(_0x13d73f) || _0x154023['transform'],
            ));
        });
        if (Object['keys'](_0x9ad0b1)['length'] > 0x0) {
          const _0x4407fd = createStoryboard3DTransformSession({
            sceneId: _0x4d0584['id'],
            activeTool: _0x1f8156['activeTool'],
            initialTransforms: _0x9ad0b1,
            dragState: _0xb2c912,
            settings: {
              ...this['viewportSettings'],
              groundPositions: this['sceneRuntime']['resolveObjectGroundPositions']?.(
                Object['keys'](_0x9ad0b1),
              ),
            },
          });
          if (!_0x4407fd) return;
          _0x4407fd['forcedUniformScale'] &&
            this['_setMessage']('多选对象朝向不同，已使用均匀缩放以避免产生不可保存的剪切变形。');
          ((_0x4407fd['pointerId'] = _0xb1817f['pointerId']),
            (_0x4407fd['host'] = _0xb1817f['currentTarget']),
            (this['_gizmoDrag'] = _0x4407fd),
            this['sceneRuntime']['setGizmoHoverHandle']?.(null),
            this['sceneRuntime']['setGizmoActiveHandle']?.(_0x7dc79d['handleKey']));
          if (_0x4407fd['activeTool'] === 'move') {
            const _0x46be42 = _0xb2c912['pivot'] || { x: 0x0, y: 0x0, z: 0x0 };
            this['sceneRuntime']['setGizmoMoveGuideLine']?.({ from: _0x46be42, to: _0x46be42 });
          }
          _0xb1817f['currentTarget']?.['classList']?.['add']?.('is-gizmo-dragging');
          try {
            _0xb1817f['currentTarget']?.['setPointerCapture']?.(_0xb1817f['pointerId']);
          } catch {}
          (this['window']?.['addEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
            this['window']?.['addEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
            this['window']?.['addEventListener']?.(
              'pointercancel',
              this['_handleRuntimePointerCancel'],
              !![],
            ));
          return;
        }
      }
    }
    const _0x51a696 = this['sceneRuntime']['pick'](_0xb1817f['clientX'], _0xb1817f['clientY']),
      _0x579419 = _0x1f8156['selectedObjectIds'];
    if (STORYBOARD_3D_SELECT_MOVE_TOOLS['has'](_0x1f8156['activeTool']) && !_0x51a696) {
      this['_beginRuntimeSelectionBox'](_0xb1817f, _0x579419);
      return;
    }
    let _0x3e41e9 = _0x51a696 ? [_0x51a696['storyboardObjectId']] : [];
    _0x51a696 &&
      (_0xb1817f['shiftKey'] || _0xb1817f['ctrlKey'] || _0xb1817f['metaKey']) &&
      (_0x3e41e9 = _0x579419['includes'](_0x51a696['storyboardObjectId'])
        ? _0x579419['filter']((_0x25656f) => _0x25656f !== _0x51a696['storyboardObjectId'])
        : [..._0x579419, _0x51a696['storyboardObjectId']]);
    if (
      _0x51a696?.['storyboardObjectType'] === 'camera' &&
      _0x3e41e9['includes'](_0x51a696['storyboardObjectId'])
    ) {
      if (!this['_activateShotForCamera'](_0x51a696['storyboardObjectId'])) return;
    }
    (this['_setSelectedObjects'](_0x3e41e9),
      this['_render'](),
      _0x51a696?.['storyboardObjectType'] === 'camera' &&
        _0x3e41e9['length'] === 0x1 &&
        this['_focusCameraObject'](_0x51a696['storyboardObjectId']));
  }
  ['_beginRuntimeSelectionBox'](_0x1a7f8c, _0x2d9c75 = []) {
    const _0x5c03d8 = _0x1a7f8c['currentTarget'];
    if (!_0x5c03d8) return;
    const _0x230b4f = this['document']?.['createElement']?.('div') || null;
    _0x230b4f &&
      ((_0x230b4f['className'] = 'storyboard-3d-selection-box'),
      (_0x230b4f['hidden'] = !![]),
      _0x5c03d8['appendChild'](_0x230b4f));
    ((this['_selectionDrag'] = {
      pointerId: _0x1a7f8c['pointerId'],
      host: _0x5c03d8,
      box: _0x230b4f,
      start: { clientX: _0x1a7f8c['clientX'], clientY: _0x1a7f8c['clientY'] },
      initialObjectIds: [..._0x2d9c75],
      latestObjectIds: [..._0x2d9c75],
      additive: _0x1a7f8c['shiftKey'] === !![],
      toggle: _0x1a7f8c['ctrlKey'] === !![] || _0x1a7f8c['metaKey'] === !![],
      moved: ![],
    }),
      _0x5c03d8['classList']?.['add']?.('is-box-selecting'),
      this['sceneRuntime']?.['setGizmoHoverHandle']?.(null));
    try {
      _0x5c03d8['setPointerCapture']?.(_0x1a7f8c['pointerId']);
    } catch {}
    (this['window']?.['addEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
      this['window']?.['addEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
      this['window']?.['addEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]));
  }
  ['_cleanupRuntimeSelectionBox'](_0x197f35) {
    (this['window']?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]),
      _0x197f35?.['box']?.['remove']?.(),
      _0x197f35?.['host']?.['classList']?.['remove']?.('is-box-selecting'));
    try {
      _0x197f35?.['host']?.['releasePointerCapture']?.(_0x197f35['pointerId']);
    } catch {}
  }
  ['_finishRuntimeSelectionBox'](_0x507834) {
    const _0x2201c1 = this['_selectionDrag'];
    if (!_0x2201c1) return ![];
    if (_0x2201c1['pointerId'] != null && _0x507834?.['pointerId'] !== _0x2201c1['pointerId']) return ![];
    (_0x507834?.['preventDefault']?.(),
      _0x507834?.['stopImmediatePropagation']?.(),
      this['_cleanupRuntimeSelectionBox'](_0x2201c1),
      (this['_selectionDrag'] = null));
    if (_0x2201c1['moved']) (this['_setSelectedObjects'](_0x2201c1['latestObjectIds']), this['_render']());
    else
      !_0x2201c1['additive'] && !_0x2201c1['toggle']
        ? (this['_setSelectedObjects']([]), this['_render']())
        : this['sceneRuntime']?.['setSelection']?.(_0x2201c1['initialObjectIds']);
    return !![];
  }
  ['_cancelRuntimeSelection'](_0x55bcf3) {
    const _0x5cd855 = this['_selectionDrag'];
    if (!_0x5cd855) return ![];
    if (_0x55bcf3 && _0x5cd855['pointerId'] != null && _0x55bcf3['pointerId'] !== _0x5cd855['pointerId'])
      return ![];
    return (
      _0x55bcf3?.['preventDefault']?.(),
      _0x55bcf3?.['stopImmediatePropagation']?.(),
      this['_cleanupRuntimeSelectionBox'](_0x5cd855),
      (this['_selectionDrag'] = null),
      this['sceneRuntime']?.['setSelection']?.(_0x5cd855['initialObjectIds']),
      !![]
    );
  }
  ['_handleRuntimePointerHover'](_0x53f44d) {
    if (!this['sceneRuntime'] || this['_gizmoDrag'] || this['_selectionDrag'] || this['_cameraDrag']) return;
    const _0x5e2b5f = this['editorStore']['getSnapshot'](),
      _0x14f640 =
        _0x5e2b5f['selectedObjectIds']['length'] === 0x0
          ? null
          : this['sceneRuntime']['pickGizmoHandle'](_0x53f44d['clientX'], _0x53f44d['clientY']);
    (this['sceneRuntime']['setGizmoHoverHandle']?.(_0x14f640?.['handleKey'] || null),
      _0x53f44d['currentTarget']?.['classList']?.['toggle']?.('is-gizmo-hovered', Boolean(_0x14f640)));
  }
  ['_handleRuntimePointerLeave'](_0x55f797) {
    if (this['_gizmoDrag'] || this['_selectionDrag'] || this['_cameraDrag']) return;
    (this['sceneRuntime']?.['setGizmoHoverHandle']?.(null),
      _0x55f797['currentTarget']?.['classList']?.['remove']?.('is-gizmo-hovered'));
  }
  ['_handleRuntimeContextMenu'](_0xf66558) {
    _0xf66558['preventDefault']();
  }
  ['_handleRuntimePointerMove'](_0x25d09d) {
    const _0x500b5c = this['_cameraDrag'];
    if (_0x500b5c && this['sceneRuntime']) {
      if (_0x500b5c['pointerId'] != null && _0x25d09d['pointerId'] !== _0x500b5c['pointerId']) return;
      (_0x25d09d['preventDefault'](), _0x25d09d['stopImmediatePropagation']());
      const _0x571a83 = _0x25d09d['clientX'] - _0x500b5c['startX'],
        _0x316a90 = _0x25d09d['clientY'] - _0x500b5c['startY'],
        _0x5aab2b =
          _0x571a83 *
          this['navigationSettings']['orbitSensitivity'] *
          (this['navigationSettings']['invertOrbitX'] ? -0x1 : 0x1),
        _0x4414d3 =
          _0x316a90 *
          this['navigationSettings']['orbitSensitivity'] *
          (this['navigationSettings']['invertOrbitY'] ? -0x1 : 0x1),
        _0x3a0bdb = _0x571a83 * this['navigationSettings']['panSensitivity'],
        _0x1601f1 = _0x316a90 * this['navigationSettings']['panSensitivity'],
        _0x350c9e = _0x316a90 * this['navigationSettings']['zoomSensitivity'];
      if (_0x500b5c['mode'] === 'fly-look') {
        const _0x1d8bcf = this['_flySceneView'] || _0x500b5c['latestSceneView'],
          _0x1d3f6c = _0x25d09d['clientX'] - _0x500b5c['lastX'],
          _0x126aa9 = _0x25d09d['clientY'] - _0x500b5c['lastY'];
        ((_0x500b5c['lastX'] = _0x25d09d['clientX']),
          (_0x500b5c['lastY'] = _0x25d09d['clientY']),
          (_0x500b5c['latestSceneView'] = {
            ..._0x1d8bcf,
            ...applySceneFlyLookDelta(_0x1d8bcf, _0x1d3f6c, _0x126aa9, _0x500b5c['rect'], {
              fov: _0x500b5c['fov'],
            }),
          }),
          (this['_flySceneView'] = _0x500b5c['latestSceneView']));
      } else {
        const _0x51e91d =
          _0x500b5c['mode'] === 'pan'
            ? applyScenePanDelta(
                _0x500b5c['sceneView'],
                _0x500b5c['cameraPose'],
                _0x3a0bdb,
                _0x1601f1,
                _0x500b5c['rect'],
              )
            : _0x500b5c['mode'] === 'dolly'
              ? applySceneDollyDelta(_0x500b5c['sceneView'], _0x350c9e)
              : applyOrbitDelta(_0x500b5c['sceneView'], _0x5aab2b, _0x4414d3, _0x500b5c['rect'], {
                  fov: _0x500b5c['fov'],
                });
        _0x500b5c['latestSceneView'] = { ..._0x500b5c['sceneView'], ..._0x51e91d };
      }
      (this['sceneRuntime']['previewSceneView'](_0x500b5c['latestSceneView']),
        (this['_miniMapPreviewSceneView'] = structuredClone(_0x500b5c['latestSceneView'])),
        this['_scheduleMiniMapRefresh']());
      return;
    }
    const _0x38f5e3 = this['_selectionDrag'];
    if (_0x38f5e3 && this['sceneRuntime']) {
      if (_0x38f5e3['pointerId'] != null && _0x25d09d['pointerId'] !== _0x38f5e3['pointerId']) return;
      (_0x25d09d['preventDefault'](), _0x25d09d['stopImmediatePropagation']());
      const _0x889220 = createStoryboard3DSelectionRect(_0x38f5e3['start'], _0x25d09d);
      _0x38f5e3['moved'] = hasStoryboard3DSelectionDragMoved(_0x889220);
      const _0x4a2ee5 = _0x38f5e3['host']?.['getBoundingClientRect']?.();
      _0x38f5e3['box'] &&
        _0x4a2ee5 &&
        ((_0x38f5e3['box']['hidden'] = !_0x38f5e3['moved']),
        (_0x38f5e3['box']['style']['left'] = Math['max'](0x0, _0x889220['left'] - _0x4a2ee5['left']) + 'px'),
        (_0x38f5e3['box']['style']['top'] = Math['max'](0x0, _0x889220['top'] - _0x4a2ee5['top']) + 'px'),
        (_0x38f5e3['box']['style']['width'] = _0x889220['width'] + 'px'),
        (_0x38f5e3['box']['style']['height'] = _0x889220['height'] + 'px'));
      if (_0x38f5e3['moved']) {
        const _0xd1afb = this['sceneRuntime']
          ['pickObjectsInRect'](_0x889220)
          ['map']((_0x14ce75) => _0x14ce75['storyboardObjectId'] || _0x14ce75['objectId'])
          ['filter'](Boolean);
        ((_0x38f5e3['latestObjectIds'] = mergeStoryboard3DBoxSelection({
          initialObjectIds: _0x38f5e3['initialObjectIds'],
          hitObjectIds: _0xd1afb,
          additive: _0x38f5e3['additive'],
          toggle: _0x38f5e3['toggle'],
        })),
          this['sceneRuntime']['setSelection'](_0x38f5e3['latestObjectIds']));
      }
      return;
    }
    const _0x14e065 = this['_gizmoDrag'];
    if (!_0x14e065 || !this['sceneRuntime']) return;
    if (_0x14e065['pointerId'] != null && _0x25d09d['pointerId'] !== _0x14e065['pointerId']) return;
    (_0x25d09d['preventDefault'](), _0x25d09d['stopImmediatePropagation']());
    const _0x56eed8 = this['sceneRuntime']['sampleGizmoDragPoint'](
      _0x14e065['dragState'],
      _0x25d09d['clientX'],
      _0x25d09d['clientY'],
    );
    if (!_0x56eed8) return;
    const _0x4b9b05 = this['sceneRuntime']['computeGizmoDragValue'](_0x14e065['dragState'], _0x56eed8),
      _0x5bbd5f = updateStoryboard3DTransformSession(_0x14e065, _0x4b9b05, {
        precision: _0x25d09d['shiftKey'] === !![],
        toggleSnap: _0x25d09d['ctrlKey'] === !![] || _0x25d09d['metaKey'] === !![],
      });
    this['sceneRuntime']['previewObjectTransforms']?.(_0x5bbd5f);
    if (_0x14e065['activeTool'] === 'move') {
      const _0x11d630 = Object['keys'](_0x5bbd5f)[0x0],
        _0x5b7929 = _0x14e065['initialTransforms'][_0x11d630],
        _0x1ed941 = _0x5bbd5f[_0x11d630],
        _0x1a7cac = _0x14e065['dragState']['pivot'] || { x: 0x0, y: 0x0, z: 0x0 };
      this['sceneRuntime']['setGizmoMoveGuideLine']?.({
        from: _0x1a7cac,
        to: {
          x:
            (_0x1a7cac['x'] || 0x0) +
            (_0x1ed941?.['position']?.[0x0] || 0x0) -
            (_0x5b7929?.['position']?.[0x0] || 0x0),
          y:
            (_0x1a7cac['y'] || 0x0) +
            (_0x1ed941?.['position']?.[0x1] || 0x0) -
            (_0x5b7929?.['position']?.[0x1] || 0x0),
          z:
            (_0x1a7cac['z'] || 0x0) +
            (_0x1ed941?.['position']?.[0x2] || 0x0) -
            (_0x5b7929?.['position']?.[0x2] || 0x0),
        },
      });
    }
  }
  ['_handleRuntimePointerUp'](_0x2b11d6) {
    if (this['_finishRuntimeSelectionBox'](_0x2b11d6)) return;
    const _0x11e579 = this['_cameraDrag'];
    if (_0x11e579) {
      if (_0x11e579['pointerId'] != null && _0x2b11d6?.['pointerId'] !== _0x11e579['pointerId']) return;
      (_0x2b11d6?.['preventDefault']?.(),
        _0x2b11d6?.['stopImmediatePropagation']?.(),
        this['window']?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
        this['window']?.['removeEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
        this['window']?.['removeEventListener']?.(
          'pointercancel',
          this['_handleRuntimePointerCancel'],
          !![],
        ));
      try {
        _0x11e579['host']?.['releasePointerCapture']?.(_0x11e579['pointerId']);
      } catch {}
      (_0x11e579['host']?.['classList']?.['remove']?.(
        'is-camera-orbit',
        'is-camera-pan',
        'is-camera-dolly',
        'is-camera-fly-look',
      ),
        (this['_cameraDrag'] = null));
      const _0x4c4e6f = _0x11e579['mode'] === 'fly-look';
      _0x4c4e6f
        ? ((this['_flySceneView'] = structuredClone(_0x11e579['latestSceneView'])),
          this['_flyKeys']['size'] > 0x0
            ? this['sceneRuntime']?.['previewSceneView']?.(this['_flySceneView'])
            : this['_finishFlyMovement']())
        : this['sceneRuntime']?.['commitSceneView']?.(_0x11e579['latestSceneView']);
      if (this['viewportControls']) {
        this['viewportControls']['sceneView'] = structuredClone(_0x11e579['latestSceneView']);
        const _0x3cf7e9 =
          this['viewportControls']['getSnapshot']?.()['viewMode'] || this['viewportControls']['viewMode'];
        _0x3cf7e9 === 'perspective' &&
          (this['viewportControls']['perspectiveSceneView'] = structuredClone(_0x11e579['latestSceneView']));
      }
      ((this['_miniMapPreviewSceneView'] = null), this['_scheduleMiniMapRefresh']());
      !_0x4c4e6f &&
        this['shotTimelineController']?.['isAutoKeyEnabled']?.() &&
        this['shotTimelineController']['recordCameraKeyframe'](this['_readCurrentCameraState']());
      return;
    }
    const _0x3300ef = this['_gizmoDrag'];
    if (!_0x3300ef) return;
    if (_0x3300ef['pointerId'] != null && _0x2b11d6?.['pointerId'] !== _0x3300ef['pointerId']) return;
    (_0x2b11d6?.['preventDefault']?.(),
      _0x2b11d6?.['stopImmediatePropagation']?.(),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]),
      this['sceneRuntime']?.['clearPreviews']?.(),
      this['sceneRuntime']?.['clearGizmoState']?.(),
      _0x3300ef['host']?.['classList']?.['remove']?.('is-gizmo-dragging', 'is-gizmo-hovered'));
    try {
      _0x3300ef['host']?.['releasePointerCapture']?.(_0x3300ef['pointerId']);
    } catch {}
    ((this['_gizmoDrag'] = null),
      this['_commitObjectTransforms']({
        sceneId: _0x3300ef['sceneId'],
        transforms: _0x3300ef['latestTransforms'],
        activeTool: _0x3300ef['activeTool'],
        label: _0x3300ef['activeTool'] + '\x20objects',
      }));
  }
  ['_cancelRuntimeTransform'](_0x34a93e) {
    const _0x114fc6 = this['_gizmoDrag'];
    if (!_0x114fc6) return ![];
    if (_0x34a93e && _0x114fc6['pointerId'] != null && _0x34a93e['pointerId'] !== _0x114fc6['pointerId'])
      return ![];
    (_0x34a93e?.['preventDefault']?.(),
      _0x34a93e?.['stopImmediatePropagation']?.(),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleRuntimePointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleRuntimePointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleRuntimePointerCancel'], !![]),
      this['sceneRuntime']?.['clearPreviews']?.(),
      this['sceneRuntime']?.['clearGizmoState']?.(),
      _0x114fc6['host']?.['classList']?.['remove']?.('is-gizmo-dragging', 'is-gizmo-hovered'));
    try {
      _0x114fc6['host']?.['releasePointerCapture']?.(_0x114fc6['pointerId']);
    } catch {}
    return ((this['_gizmoDrag'] = null), !![]);
  }
  ['_handleRuntimePointerCancel'](_0x3e7623) {
    if (this['_cancelRuntimeSelection'](_0x3e7623)) return;
    if (this['_cancelRuntimeTransform'](_0x3e7623)) return;
    this['_handleRuntimePointerUp'](_0x3e7623);
  }
  ['_handleRuntimeWheel'](_0x199320) {
    if (!this['sceneRuntime']) return;
    const _0x4c5815 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
    if (_0x4c5815?.['background']?.['lockedCamera']) {
      this['_setMessage']('背景机位已锁定；请先解除锁定再缩放视口。');
      return;
    }
    const _0x270e8d = this['sceneRuntime']['getSceneView']?.();
    if (!_0x270e8d) return;
    (_0x199320['preventDefault'](), _0x199320['stopPropagation']());
    const _0x170e58 = _0x199320['currentTarget']?.['getBoundingClientRect']?.(),
      _0x24b7d2 = this['navigationSettings']['invertWheel'] ? -0x1 : 0x1,
      _0x439502 =
        normalizeWheelDelta(_0x199320['deltaY'], _0x199320['deltaMode'], _0x170e58?.['height'] || 0x320) *
        this['navigationSettings']['zoomSensitivity'] *
        _0x24b7d2,
      _0x3258fd = { ..._0x270e8d, ...applySceneZoomDelta(_0x270e8d, _0x439502) };
    (this['sceneRuntime']['previewSceneView'](_0x3258fd),
      this['sceneRuntime']['commitSceneView'](_0x3258fd),
      this['_scheduleMiniMapRefresh'](),
      this['viewportControls'] &&
        ((this['viewportControls']['sceneView'] = structuredClone(_0x3258fd)),
        this['viewportControls']['getSnapshot']?.()['viewMode'] === 'perspective' &&
          (this['viewportControls']['perspectiveSceneView'] = structuredClone(_0x3258fd))));
  }
  ['_handleMiniMapPointerDown'](_0x2f53fc) {
    const _0x164ea3 = _0x2f53fc['target']?.['closest']?.('.storyboard-3d-mini-map-title');
    if (_0x164ea3 && !_0x2f53fc['target']['closest']('button') && _0x2f53fc['button'] === 0x0) {
      const _0x1af466 = _0x164ea3['closest']('.storyboard-3d-mini-map-placeholder'),
        _0xc1f485 = _0x1af466?.['closest']?.('.storyboard-3d-viewport'),
        _0x2a8d9d = _0x1af466?.['getBoundingClientRect']?.(),
        _0x382b72 = _0xc1f485?.['getBoundingClientRect']?.();
      if (!_0x2a8d9d || !_0x382b72) return;
      (_0x2f53fc['preventDefault'](),
        _0x2f53fc['stopImmediatePropagation'](),
        (this['_miniMapWindowDrag'] = {
          startX: _0x2f53fc['clientX'],
          startY: _0x2f53fc['clientY'],
          initial: { ...this['miniMapWindowOffset'] },
          maxLeft: Math['max'](0x0, _0x382b72['width'] - _0x2a8d9d['width'] - 0x1c),
          maxDown: Math['max'](0x0, _0x382b72['height'] - _0x2a8d9d['height'] - 0x1c),
        }),
        this['window']?.['addEventListener']?.('pointermove', this['_handleMiniMapWindowMove'], !![]),
        this['window']?.['addEventListener']?.('pointerup', this['_handleMiniMapWindowUp'], !![]),
        this['window']?.['addEventListener']?.('pointercancel', this['_handleMiniMapWindowUp'], !![]));
      return;
    }
    const _0x5e60f5 = _0x2f53fc['target']?.['closest']?.('.storyboard-3d-mini-map-canvas [data-object-id]');
    if (!_0x5e60f5 || _0x2f53fc['button'] !== 0x0) return;
    const _0x497c89 = this['projectStore']['getSnapshot'](),
      _0x33b727 = getActiveStoryboard3DScene(_0x497c89),
      _0x2285a0 = _0x33b727?.['objects']?.['find'](
        (_0x3fcb08) => _0x3fcb08['id'] === _0x5e60f5['dataset']['objectId'],
      ),
      _0x18686c = _0x5e60f5['closest']('.storyboard-3d-mini-map-canvas'),
      _0x108b01 = _0x18686c?.['getBoundingClientRect']?.();
    if (!_0x2285a0 || _0x2285a0['locked'] || !_0x108b01?.['width'] || !_0x108b01?.['height']) return;
    (_0x2f53fc['preventDefault'](),
      _0x2f53fc['stopImmediatePropagation'](),
      this['_setSelectedObjects']([_0x2285a0['id']]));
    const _0x2435e6 = getActiveStoryboard3DShot(_0x497c89);
    ((this['_miniMapDrag'] = {
      sceneId: _0x33b727['id'],
      objectId: _0x2285a0['id'],
      object: _0x2285a0,
      rect: _0x108b01,
      projection: createMiniMapLayout(
        _0x33b727,
        _0x2435e6,
        _0x108b01,
        this['miniMapZoom'],
        this['_miniMapFootprints'],
        this['_miniMapFrame']?.['worldBounds'] || null,
        this['_getMiniMapCamera'](_0x2435e6),
      )['projection'],
      transform: structuredClone(_0x2285a0['transform']),
    }),
      this['window']?.['addEventListener']?.('pointermove', this['_handleMiniMapPointerMove'], !![]),
      this['window']?.['addEventListener']?.('pointerup', this['_handleMiniMapPointerUp'], !![]),
      this['window']?.['addEventListener']?.('pointercancel', this['_handleMiniMapPointerUp'], !![]));
  }
  ['_handleMiniMapPointerMove'](_0x248c9a) {
    const _0x59dbc3 = this['_miniMapDrag'];
    if (!_0x59dbc3) return;
    (_0x248c9a['preventDefault']?.(),
      _0x248c9a['stopImmediatePropagation']?.(),
      (_0x59dbc3['transform'] = computeStoryboard3DMiniMapObjectDrag(
        {
          x: _0x248c9a['clientX'] - _0x59dbc3['rect']['left'],
          y: _0x248c9a['clientY'] - _0x59dbc3['rect']['top'],
        },
        _0x59dbc3['object'],
        _0x59dbc3['projection'],
      )),
      this['sceneRuntime']?.['previewObjectTransform']?.(_0x59dbc3['objectId'], _0x59dbc3['transform']));
    const _0x28def8 = [
        ...(this['root']?.['querySelectorAll']?.('.storyboard-3d-mini-map-canvas [data-object-id]') || []),
      ]['find']((_0x360a93) => _0x360a93['dataset']['objectId'] === _0x59dbc3['objectId']),
      _0x2c5bc9 = projectStoryboard3DWorldToMiniMapRatio(
        { x: _0x59dbc3['transform']['position'][0x0], z: _0x59dbc3['transform']['position'][0x2] },
        _0x59dbc3['projection'],
      );
    (_0x28def8?.['style']?.['setProperty']?.('--mini-x', _0x2c5bc9['x'] * 0x64 + '%'),
      _0x28def8?.['style']?.['setProperty']?.('--mini-y', _0x2c5bc9['y'] * 0x64 + '%'));
  }
  ['_scheduleMiniMapRefresh']() {
    if (this['_closed'] || !this['root'] || this['_miniMapRefreshFrame'] !== null) return;
    const _0x2a9899 = this['window']?.['requestAnimationFrame']?.['bind']?.(this['window']);
    if (typeof _0x2a9899 !== 'function') {
      this['_refreshMiniMapFromRuntime']();
      return;
    }
    this['_miniMapRefreshFrame'] = _0x2a9899(() => {
      ((this['_miniMapRefreshFrame'] = null), this['_refreshMiniMapFromRuntime']());
    });
  }
  ['_refreshMiniMapFromRuntime']() {
    if (this['_closed'] || !this['root'] || !this['sceneRuntime']) return;
    this['_miniMapFootprints'] = this['sceneRuntime']['getMiniMapFootprints']?.() || [];
    const _0x203142 = this['projectStore']['getSnapshot'](),
      _0x31614f = getActiveStoryboard3DScene(_0x203142),
      _0x196e62 = getActiveStoryboard3DShot(_0x203142),
      _0x471d93 = this['root']['querySelector']('.storyboard-3d-mini-map-placeholder');
    if (!_0x471d93 || !_0x31614f) return;
    const _0x35b386 = this['_resolveMiniMapWorldBounds'](_0x31614f, _0x196e62, this['_miniMapFootprints']),
      _0x372aa1 = this['_getMiniMapCamera'](_0x196e62);
    _0x471d93['innerHTML'] = renderMiniMap(_0x31614f, _0x196e62, {
      expanded: this['miniMapExpanded'],
      zoom: this['miniMapZoom'],
      footprints: this['_miniMapFootprints'],
      worldBounds: _0x35b386,
      camera: _0x372aa1,
    });
  }
  ['_getMiniMapCamera'](_0x30fb72) {
    return createStoryboard3DMiniMapCameraPose(
      _0x30fb72,
      this['_miniMapPreviewSceneView'] || this['sceneRuntime']?.['getSceneView']?.(),
      this['sceneRuntime']?.['readCurrentCamera']?.(),
    );
  }
  ['_resolveMiniMapWorldBounds'](_0x15b99a, _0x26bb5c, _0x873a03 = []) {
    const _0x1f3b17 = (_0x15b99a?.['objects'] || [])
        ['filter']((_0x5612d9) => _0x5612d9?.['visible'] !== ![])
        ['map']((_0x2554cc) => String(_0x2554cc['id'] || ''))
        ['filter'](Boolean)
        ['sort'](),
      _0x27cb76 = _0x1f3b17['join']('|'),
      _0x2d36f3 = (_0x873a03 || [])['some'](
        (_0x236018) => Array['isArray'](_0x236018?.['points']) && _0x236018['points']['length'] >= 0x3,
      );
    return (
      (!this['_miniMapFrame'] ||
        this['_miniMapFrame']['sceneId'] !== _0x15b99a?.['id'] ||
        this['_miniMapFrame']['objectSignature'] !== _0x27cb76 ||
        (!this['_miniMapFrame']['hasGeometry'] && _0x2d36f3)) &&
        (this['_miniMapFrame'] = {
          sceneId: _0x15b99a?.['id'] || '',
          objectSignature: _0x27cb76,
          hasGeometry: _0x2d36f3,
          worldBounds: createMiniMapWorldBounds(_0x15b99a, _0x26bb5c, _0x873a03),
        }),
      this['_miniMapFrame']['worldBounds']
    );
  }
  ['_handleMiniMapPointerUp'](_0x4c8f23) {
    const _0x87c0f0 = this['_miniMapDrag'];
    if (!_0x87c0f0) return;
    (_0x4c8f23?.['preventDefault']?.(),
      _0x4c8f23?.['stopImmediatePropagation']?.(),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleMiniMapPointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleMiniMapPointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleMiniMapPointerUp'], !![]),
      this['sceneRuntime']?.['clearObjectTransformPreview']?.(_0x87c0f0['objectId']),
      (this['_miniMapDrag'] = null),
      this['_commitObjectTransforms']({
        sceneId: _0x87c0f0['sceneId'],
        transforms: { [_0x87c0f0['objectId']]: _0x87c0f0['transform'] },
        activeTool: 'move',
        label: 'Move object from mini map',
      }));
  }
  ['_handleMiniMapWheel'](_0x48c32a) {
    if (!_0x48c32a['target']?.['closest']?.('.storyboard-3d-mini-map-placeholder')) return;
    (_0x48c32a['preventDefault'](),
      _0x48c32a['stopPropagation'](),
      (this['miniMapZoom'] = Math['max'](
        0.5,
        Math['min'](0x3, this['miniMapZoom'] * Math['exp'](-(Number(_0x48c32a['deltaY']) || 0x0) * 0.001)),
      )),
      this['_render']());
  }
  ['_handleMiniMapWindowMove'](_0x5085a9) {
    const _0x4dc7f7 = this['_miniMapWindowDrag'];
    if (!_0x4dc7f7) return;
    (_0x5085a9['preventDefault']?.(),
      _0x5085a9['stopImmediatePropagation']?.(),
      (this['miniMapWindowOffset'] = {
        x: Math['max'](
          -_0x4dc7f7['maxLeft'],
          Math['min'](0x0, _0x4dc7f7['initial']['x'] + _0x5085a9['clientX'] - _0x4dc7f7['startX']),
        ),
        y: Math['max'](
          0x0,
          Math['min'](
            _0x4dc7f7['maxDown'],
            _0x4dc7f7['initial']['y'] + _0x5085a9['clientY'] - _0x4dc7f7['startY'],
          ),
        ),
      }));
    const _0x3359f4 = this['root']?.['querySelector']?.('.storyboard-3d-mini-map-placeholder');
    (_0x3359f4?.['style']?.['setProperty']?.('--mini-map-window-x', this['miniMapWindowOffset']['x'] + 'px'),
      _0x3359f4?.['style']?.['setProperty']?.(
        '--mini-map-window-y',
        this['miniMapWindowOffset']['y'] + 'px',
      ));
  }
  ['_handleMiniMapWindowUp'](_0x85c12b) {
    if (!this['_miniMapWindowDrag']) return;
    (_0x85c12b?.['preventDefault']?.(),
      _0x85c12b?.['stopImmediatePropagation']?.(),
      (this['_miniMapWindowDrag'] = null),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleMiniMapWindowMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleMiniMapWindowUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleMiniMapWindowUp'], !![]));
  }
  ['_handleOutlineDragStart'](_0x139714) {
    const _0x599564 = _0x139714['target']?.['closest']?.('.storyboard-3d-scene-item[data-scene-id]');
    if (_0x599564 && _0x139714['dataTransfer']) {
      ((_0x139714['dataTransfer']['effectAllowed'] = 'move'),
        _0x139714['dataTransfer']['setData'](
          'application/x-storyboard3d-scene',
          _0x599564['dataset']['sceneId'] || '',
        ));
      return;
    }
    const _0x10cdc3 = _0x139714['target']?.['closest']?.('.storyboard-3d-shot-card[data-shot-id]');
    if (_0x10cdc3 && _0x139714['dataTransfer']) {
      ((_0x139714['dataTransfer']['effectAllowed'] = 'move'),
        _0x139714['dataTransfer']['setData'](
          'application/x-storyboard3d-shot',
          _0x10cdc3['dataset']['shotId'] || '',
        ));
      return;
    }
    const _0xf68107 = _0x139714['target']?.['closest']?.('.storyboard-3d-object-row[data-object-id]');
    if (!_0xf68107 || !_0x139714['dataTransfer']) return;
    ((_0x139714['dataTransfer']['effectAllowed'] = 'move'),
      _0x139714['dataTransfer']['setData'](
        'text/storyboard3d-object-id',
        _0xf68107['dataset']['objectId'] || '',
      ),
      _0x139714['dataTransfer']['setData']('text/plain', _0xf68107['dataset']['objectId'] || ''));
  }
  ['_handleOutlineDragOver'](_0x40dc58) {
    if (_0x40dc58['target']?.['closest']?.('.storyboard-3d-scene-item,\x20.storyboard-3d-shot-card')) {
      _0x40dc58['preventDefault']();
      if (_0x40dc58['dataTransfer']) _0x40dc58['dataTransfer']['dropEffect'] = 'move';
      return;
    }
    if (!_0x40dc58['target']?.['closest']?.('.storyboard-3d-outline-list')) return;
    const _0xb59af5 = _0x40dc58['target']['closest']('.storyboard-3d-object-row');
    if (_0xb59af5 && _0xb59af5['dataset']['objectType'] !== 'group') return;
    _0x40dc58['preventDefault']();
    if (_0x40dc58['dataTransfer']) _0x40dc58['dataTransfer']['dropEffect'] = 'move';
  }
  ['_handleOutlineDrop'](_0xfe85f) {
    const _0x2f1369 = _0xfe85f['target']?.['closest']?.('.storyboard-3d-scene-item[data-scene-id]'),
      _0x332c6a = _0xfe85f['dataTransfer']?.['getData']?.('application/x-storyboard3d-scene') || '';
    if (_0x2f1369 && _0x332c6a) {
      (_0xfe85f['preventDefault'](),
        this['_executeMutation']({
          type: 'drag-reorder-scene',
          label: 'Reorder scene',
          mutate: (_0x17e8a0) =>
            reorderStoryboard3DScene(
              _0x17e8a0,
              _0x332c6a,
              _0x17e8a0['scenes']['findIndex'](
                (_0x4a503c) => _0x4a503c['id'] === _0x2f1369['dataset']['sceneId'],
              ),
              { now: Date['now']() },
            ),
        }),
        this['_render']());
      return;
    }
    const _0xd9b28c = _0xfe85f['target']?.['closest']?.('.storyboard-3d-shot-card[data-shot-id]'),
      _0x28133e = _0xfe85f['dataTransfer']?.['getData']?.('application/x-storyboard3d-shot') || '';
    if (_0xd9b28c && _0x28133e) {
      (_0xfe85f['preventDefault'](),
        this['_executeMutation']({
          type: 'drag-reorder-shot',
          label: 'Reorder shot',
          mutate: (_0x1aeb94) => {
            const _0xf76e6 = _0x1aeb94['scenes']['findIndex'](
                (_0x518829) => _0x518829['id'] === _0x1aeb94['activeSceneId'],
              ),
              _0x4c346d = _0x1aeb94['scenes'][_0xf76e6];
            return (
              _0x4c346d &&
                (_0x1aeb94['scenes'][_0xf76e6] = reorderStoryboard3DShot(
                  _0x4c346d,
                  _0x28133e,
                  _0x4c346d['shots']['findIndex'](
                    (_0x29f821) => _0x29f821['id'] === _0xd9b28c['dataset']['shotId'],
                  ),
                )),
              _0x1aeb94
            );
          },
        }),
        this['_render']());
      return;
    }
    if (!_0xfe85f['target']?.['closest']?.('.storyboard-3d-outline-list')) return;
    const _0x14913f =
      _0xfe85f['dataTransfer']?.['getData']?.('text/storyboard3d-object-id') ||
      _0xfe85f['dataTransfer']?.['getData']?.('text/plain') ||
      '';
    if (!_0x14913f) return;
    const _0x286695 = _0xfe85f['target']['closest']('.storyboard-3d-object-row');
    if (_0x286695 && _0x286695['dataset']['objectType'] !== 'group') return;
    _0xfe85f['preventDefault']();
    const _0x53c586 = _0x286695?.['dataset']['objectId'] || null;
    try {
      this['_executeMutation']({
        type: 'drag-object-parent',
        label: 'Move object in hierarchy',
        mutate: (_0x5532f3) => {
          const _0xd239fc = _0x5532f3['scenes']['findIndex'](
            (_0x55dbce) => _0x55dbce['id'] === _0x5532f3['activeSceneId'],
          );
          return (
            _0xd239fc >= 0x0 &&
              (_0x5532f3['scenes'][_0xd239fc] = setStoryboard3DObjectParent(
                _0x5532f3['scenes'][_0xd239fc],
                _0x14913f,
                _0x53c586,
              )),
            _0x5532f3
          );
        },
      });
    } catch (_0x4c01c0) {
      this['_setMessage'](_0x4c01c0?.['message'] || String(_0x4c01c0));
    }
    this['_render']();
  }
  ['_render']({ preserveAssetLibrary: preserveAssetLibrary = ![] } = {}) {
    if (!this['root']) return;
    const _0x19fb8a = captureTimelinePresentation(this['root']),
      _0x25802c = this['root']['querySelector']('.storyboard-3d-outline-list')?.['scrollTop'] || 0x0,
      _0x3f1e06 = this['root']['querySelector']('.storyboard-3d-object-properties-sidebar'),
      _0x1dac6c = _0x3f1e06?.['dataset']['objectId'] || '',
      _0x41f464 =
        _0x3f1e06?.['querySelector']('.storyboard-3d-object-properties-content')?.['scrollTop'] || 0x0,
      _0x231b6d = this['root']['querySelector']('.storyboard-3d-global-settings')?.['open'] === !![];
    (this['_aiModelSelectorController']?.['destroy']?.(), (this['_aiModelSelectorController'] = null));
    const _0x26a06c = this['projectStore']['getSnapshot'](),
      _0x37bf1f = this['editorStore']['getSnapshot'](),
      _0x261fcb = getActiveStoryboard3DScene(_0x26a06c),
      _0x144b5f = getActiveStoryboard3DShot(_0x26a06c),
      _0x25b821 = _0x37bf1f['selectedObjectIds']['at'](-0x1),
      _0x4195c0 = _0x261fcb?.['objects']?.['find']((_0x54ef64) => _0x54ef64['id'] === _0x25b821),
      _0x2e1b39 = _0x37bf1f['assetLibraryOpen']
        ? 'assets'
        : this['rightSidebarMode'] === 'object' && _0x4195c0
          ? 'object'
          : ['ai', 'perspective']['includes'](this['rightSidebarMode'])
            ? this['rightSidebarMode']
            : null;
    this['rightSidebarMode'] = _0x2e1b39;
    const _0xc070be = this['window']?.['innerWidth'] || 0x5a0,
      _0x48932d = normalizeStoryboard3DRightSidebarWidth(this['rightSidebarWidth'], _0xc070be, _0x2e1b39),
      _0xbbcb21 =
        preserveAssetLibrary && _0x2e1b39 === 'assets'
          ? this['root']['querySelector']('.storyboard-3d-right-sidebar')
          : null,
      _0x7a3557 = _0xbbcb21?.['contains']?.(this['document']?.['activeElement'])
        ? this['document']['activeElement']
        : null;
    _0xbbcb21?.['remove']?.();
    const _0xf44e69 = this['viewportControls']?.['getSnapshot']?.()['viewMode'] || 'perspective',
      _0x51d4da = this['shotTimelineController']?.['isDrawerOpen']?.() === !![],
      _0x2cff3a =
        this['root']['getBoundingClientRect']?.()['height'] || this['window']?.['innerHeight'] || 0x384,
      _0x379796 = normalizeStoryboard3DTimelineHeight(this['timelineHeight'], _0x2cff3a);
    this['timelineHeight'] = _0x379796;
    const _0x3ceccb = this['_getMiniMapCamera'](_0x144b5f),
      _0x1d6e22 = summarizeStoryboard3DProject(_0x26a06c),
      _0x2f2149 = this['_resolveMiniMapWorldBounds'](_0x261fcb, _0x144b5f, this['_miniMapFootprints']),
      _0xfc7f77 = _0x37bf1f['assetLibraryOpen']
        ? this['assetLibrary']
            ['list']({
              query: this['assetQuery'],
              category: this['assetCategory'] === 'favorite' ? 'all' : this['assetCategory'],
              limit: 0x640,
            })
            ['filter'](
              (_0xdb492e) =>
                this['assetCategory'] !== 'favorite' || this['favoriteAssetIds']['has'](_0xdb492e['id']),
            )
        : [],
      _0x4c2e4d = _0xfc7f77['slice'](0x0, this['assetVisibleLimit'])['map']((_0x4ddbe6) => ({
        ..._0x4ddbe6,
        thumbnailUrl: _0x4ddbe6['thumbnailUrl'] || storyboard3DAssetThumbnailCache['get'](_0x4ddbe6),
      })),
      _0x448062 = this['sceneRuntime']
        ? this['root']['querySelector']('[data-storyboard-3d-runtime-host]')
        : null;
    _0x448062?.['remove']?.();
    if (!_0x448062) this['_disposeSceneRuntime']();
    this['root']['innerHTML'] =
      '<div class="storyboard-3d-editor-shell ' +
      (_0x2e1b39 ? 'is-right-sidebar-open' : '') +
      '">\n      <header class="storyboard-3d-editor-topbar">\n        <div class="storyboard-3d-editor-identity">\n          <span class="storyboard-3d-editor-mark" aria-hidden="true">3D</span>\n          <label>\n            <span>' +
      escapeHtml(t('storyboard3d.editor.projectName')) +
      '</span>\n            <input type="text" value="' +
      escapeHtml(_0x26a06c['name']) +
      '" maxlength="120" data-storyboard-3d-project-name aria-label="' +
      escapeHtml(t('storyboard3d.editor.projectName')) +
      '">\n          </label>\n          <span class="storyboard-3d-save-status" data-storyboard-3d-save-status data-status="' +
      escapeHtml(this['projectStore']['getSaveStatus']()) +
      '\x22>' +
      escapeHtml(getSaveStatusLabel(this['projectStore']['getSaveStatus']())) +
      '</span>\n        </div>\n        <nav class="storyboard-3d-mode-switcher" aria-label="' +
      escapeHtml(t('storyboard3d.editor.modeAria')) +
      '">\n          <button type="button" class="is-active" aria-pressed="true">' +
      escapeHtml(t('storyboard3d.editor.editMode')) +
      '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22open-explore\x22>' +
      escapeHtml(t('storyboard3d.editor.exploreMode')) +
      '</button>\n        </nav>\n        <div class="storyboard-3d-topbar-actions">\n          <button type="button" class="storyboard-3d-asset-library-trigger ' +
      (_0x2e1b39 === 'assets' ? 'is-active' : '') +
      '" data-storyboard-3d-action="open-asset-library" aria-controls="storyboard3DRightSidebar" aria-expanded="' +
      (_0x2e1b39 === 'assets') +
      '\x22><span\x20aria-hidden=\x22true\x22>◇</span>模型库</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderNavigationSettings(this['navigationSettings'], {
        open: _0x231b6d,
        viewportSettings: this['viewportSettings'],
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-ai-sidebar-trigger\x20' +
      (_0x2e1b39 === 'ai' ? 'is-active' : '') +
      '" data-storyboard-3d-action="toggle-ai-sidebar" aria-controls="storyboard3DRightSidebar" aria-expanded="' +
      (_0x2e1b39 === 'ai') +
      '"><span aria-hidden="true">✦</span>AI 助手</button>\n          <button type="button" data-storyboard-3d-action="undo" title="Ctrl+Z">撤销</button>\n          <button type="button" data-storyboard-3d-action="redo" title="Ctrl+Shift+Z">重做</button>\n          <button type="button" class="storyboard-3d-export-trigger" data-storyboard-3d-action="export-storyboard">导出分镜</button>\n        </div>\n      </header>\n\n      <div class="storyboard-3d-editor-main" style="--storyboard-3d-right-sidebar-width:' +
      _0x48932d +
      'px\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<main\x20class=\x22storyboard-3d-viewport-column\x20' +
      (_0x51d4da ? 'is-timeline-open' : 'is-timeline-collapsed') +
      '" style="--storyboard-3d-timeline-height:' +
      _0x379796 +
      'px">\n          <section class="storyboard-3d-viewport" tabindex="0" aria-label="' +
      escapeHtml(t('storyboard3d.editor.viewport')) +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-tool-rail\x22\x20role=\x22toolbar\x22\x20aria-label=\x22' +
      escapeHtml(t('storyboard3d.editor.tools')) +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DIconButton({ action: 'add-light', icon: 'light', label: '添加灯光' }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'open-background-perspective',
        icon: 'background',
        label: '图像透视匹配',
        active: _0x2e1b39 === 'perspective',
        className: 'storyboard-3d-background-match-trigger',
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-view-controls\x22\x20role=\x22toolbar\x22\x20aria-label=\x22视图控制\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'perspective',
        label: '透视视图',
        active: _0xf44e69 === 'perspective',
        dataView: 'perspective',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'top',
        label: '顶视图',
        active: _0xf44e69 === 'top',
        dataView: 'top',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'front',
        label: '前视图',
        active: _0xf44e69 === 'front',
        dataView: 'front',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'right',
        label: '右视图',
        active: _0xf44e69 === 'right',
        dataView: 'right',
      }) +
      '\n            </div>\n            <details class="storyboard-3d-object-popover" ' +
      (_0x37bf1f['objectOutlineOpen'] ? 'open' : '') +
      '>\n              <summary data-storyboard-3d-action="toggle-object-outline"><span>对象</span><small>' +
      _0x1d6e22['objectCount'] +
      '</small></summary>\n              <div class="storyboard-3d-object-outline">\n                <div class="storyboard-3d-object-popover-heading">\n                  <span>' +
      escapeHtml(_0x261fcb?.['name'] || '当前场景') +
      '</span>\n                  <button type="button" data-storyboard-3d-action="group-selected" title="将当前选中对象创建为分组">分组</button>\n                </div>\n                <div class="storyboard-3d-outline-filters"><input type="search" value="' +
      escapeHtml(this['outlineQuery']) +
      '" placeholder="搜索对象" data-storyboard-3d-outline-query><select data-storyboard-3d-outline-type>' +
      ['all', 'camera', 'character', 'prop', 'light', 'group']
        ['map'](
          (_0x143e95) =>
            '<option value="' +
            _0x143e95 +
            '\x22\x20' +
            (_0x143e95 === this['outlineType'] ? 'selected' : '') +
            '>' +
            (_0x143e95 === 'all' ? '全部类型' : _0x143e95) +
            '</option>',
        )
        ['join']('') +
      '</select></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-outline-list\x22>' +
      renderObjectOutline(_0x261fcb, _0x37bf1f['selectedObjectIds'], {
        query: this['outlineQuery'],
        type: this['outlineType'],
      }) +
      '</div>\n              </div>\n            </details>\n            <div class="storyboard-3d-viewport-stage">\n              <div class="storyboard-3d-runtime-host" data-storyboard-3d-runtime-host></div>\n              ' +
      renderBackgroundCalibrationGuide(_0x261fcb?.['background']) +
      '\n              <div class="storyboard-3d-runtime-status" data-storyboard-3d-runtime-status hidden></div>\n            </div>\n            <div class="storyboard-3d-viewport-toolbar" role="toolbar" aria-label="常用 3D 工具">\n              ' +
      renderStoryboard3DToolButton(
        'select',
        _0x37bf1f['activeTool'] === 'select',
        this['navigationSettings']['preset'],
      ) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DToolButton(
        'move',
        _0x37bf1f['activeTool'] === 'move',
        this['navigationSettings']['preset'],
      ) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'toggle-fly-mode',
        icon: 'fly',
        label: '飞行模式',
        shortcut: 'Shift+F',
        active: _0x37bf1f['flyMode'],
        className: 'storyboard-3d-fly-mode-button',
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DIconButton({
        action: 'focus-selection',
        icon: 'focus',
        label: '聚焦选中',
        shortcut: 'F',
        disabled: _0x37bf1f['selectedObjectIds']['length'] === 0x0,
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'add-shot',
        icon: 'camera',
        label: t('storyboard3d.editor.addShot'),
        title: t('storyboard3d.editor.addShotDescription'),
        className: 'storyboard-3d-add-shot-control',
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-view-controls-separator\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DToolButton(
        'rotate',
        _0x37bf1f['activeTool'] === 'rotate',
        this['navigationSettings']['preset'],
      ) +
      '\n              ' +
      renderStoryboard3DToolButton(
        'scale',
        _0x37bf1f['activeTool'] === 'scale',
        this['navigationSettings']['preset'],
      ) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-view-controls-separator\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DViewportSettingButton({
        field: 'transformSpace',
        icon: 'transformSpace',
        label: this['viewportSettings']['transformSpace'] === 'local' ? '本地坐标' : '世界坐标',
        active: this['viewportSettings']['transformSpace'] === 'local',
        hidden: _0x37bf1f['activeTool'] === 'scale',
      }) +
      '\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'snapEnabled',
        icon: 'snap',
        label: '启用步进吸附',
        active: this['viewportSettings']['snapEnabled'],
      }) +
      '\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'groundLock',
        icon: 'ground',
        label: '地面吸附',
        active: this['viewportSettings']['groundLock'],
        hidden: !STORYBOARD_3D_SELECT_MOVE_TOOLS['has'](_0x37bf1f['activeTool']),
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DViewportSettingButton({
        field: 'uniformScale',
        icon: 'uniform',
        label: '均匀缩放',
        active: this['viewportSettings']['uniformScale'],
        hidden: _0x37bf1f['activeTool'] !== 'scale',
      }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderStoryboard3DIconButton({
        action: 'fit-all',
        icon: 'fit',
        label: '适配全部',
        shortcut: 'Home',
        className: 'storyboard-3d-fit-all-control',
      }) +
      '\n            ' +
      renderStoryboard3DFocalControl(_0x261fcb, this['viewportFocalLength']) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-viewport-hud\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-navigation-status\x20' +
      (_0x37bf1f['flyMode'] ? 'is-fly-mode' : '') +
      '\x22>' +
      escapeHtml(
        getStoryboard3DNavigationHelpText({
          flyMode: _0x37bf1f['flyMode'],
          preset: this['navigationSettings']['preset'],
        }),
      ) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
      escapeHtml(_0x144b5f?.['shotSize'] || 'MED') +
      '</span>\n              <span>' +
      escapeHtml(_0x144b5f?.['shotAngle'] || 'eye') +
      '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>' +
      escapeHtml(formatFocalLength(this['viewportFocalLength']) + 'mm') +
      '</strong>\n            </div>\n            <div class="storyboard-3d-mini-map-placeholder ' +
      (this['miniMapExpanded'] ? 'is-expanded' : '') +
      '" style="--mini-map-window-x:' +
      this['miniMapWindowOffset']['x'] +
      'px;--mini-map-window-y:' +
      this['miniMapWindowOffset']['y'] +
      'px\x22>' +
      renderMiniMap(_0x261fcb, _0x144b5f, {
        expanded: this['miniMapExpanded'],
        zoom: this['miniMapZoom'],
        footprints: this['_miniMapFootprints'],
        worldBounds: _0x2f2149,
        camera: _0x3ceccb,
      }) +
      '</div>\n          </section>\n          <section class="storyboard-3d-shot-dock ' +
      (_0x51d4da ? 'is-timeline-open' : 'is-timeline-collapsed') +
      '" aria-label="' +
      escapeHtml(t('storyboard3d.editor.shots')) +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-shot-strip\x22>' +
      renderShotStrip(_0x261fcb, { timelineOpen: _0x51d4da }) +
      '</div>\n            ' +
      renderShotTimelineDrawerHandle(_0x51d4da, _0x379796) +
      '\n            <div class="storyboard-3d-timeline-drawer-content" aria-hidden="' +
      !_0x51d4da +
      '\x22\x20' +
      (_0x51d4da ? '' : 'inert') +
      '>\n              ' +
      (this['shotTimelineController']?.['render']?.() || '') +
      '\n            </div>\n          </section>\n        </main>\n        ' +
      (_0x37bf1f['assetLibraryOpen'] && !_0xbbcb21
        ? renderAssetLibraryRightSidebar({
            assets: _0x4c2e4d,
            totalCount: _0xfc7f77['length'],
            hasMore: _0xfc7f77['length'] > _0x4c2e4d['length'],
            query: this['assetQuery'],
            category: this['assetCategory'],
            favoriteIds: this['favoriteAssetIds'],
            importState: this['modelImportState'],
            sidebarWidth: _0x48932d,
            layoutWidth: _0xc070be,
          })
        : '') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x2e1b39 === 'object'
        ? renderObjectPropertiesRightSidebar(
            {
              object: _0x4195c0,
              selectedBoneName: this['characterBoneSelection']['get'](_0x4195c0?.['id']) || 'Head',
              characterPoseState:
                _0x4195c0?.['type'] === 'character'
                  ? reconcileCharacterPoseState(
                      _0x4195c0,
                      this['characterImagePoseController']['getSnapshot'](_0x4195c0['id']),
                    )
                  : null,
              assetDescriptor:
                _0x4195c0?.['type'] === 'prop' ? this['assetLibrary']['find'](_0x4195c0['assetId']) : null,
              sceneGroups:
                _0x261fcb?.['objects']?.['filter']((_0x2eec77) => _0x2eec77['type'] === 'group') || [],
            },
            { sidebarWidth: _0x48932d, layoutWidth: _0xc070be },
          )
        : '') +
      '\n        ' +
      (_0x2e1b39 === 'perspective'
        ? renderBackgroundPerspectiveRightSidebar(
            { scene: _0x261fcb, activeShot: _0x144b5f },
            { sidebarWidth: _0x48932d, layoutWidth: _0xc070be },
          )
        : '') +
      '\n        ' +
      (_0x2e1b39 === 'ai'
        ? renderAIAssistantRightSidebar(
            {
              ...this['aiState'],
              modelId: this['aiModelId'],
              provider: this['aiProvider'],
              canUndoAI: this['commandHistory']['getSnapshot']()['nextUndoLabel'] === 'AI scene transaction',
            },
            { sidebarWidth: _0x48932d, layoutWidth: _0xc070be },
          )
        : '') +
      '\n      </div>\n\n      ' +
      (this['exploreOpen'] ? renderShotExplorePanel(this['shotCandidates'], this['exploreFilter']) : '') +
      '\n\n      <input type="file" accept="' +
      STORYBOARD_3D_MODEL_ACCEPT +
      ',.bin,.png,.jpg,.jpeg,.webp,.ktx2" data-storyboard-3d-model-input multiple hidden>\n      <input type="file" accept="image/*" data-storyboard-3d-background-input hidden>\n      <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-storyboard-3d-pose-image-input hidden>\n      <div class="storyboard-3d-editor-message" data-storyboard-3d-message role="status" aria-live="polite" ' +
      (this['_message'] ? '' : 'hidden') +
      '>' +
      escapeHtml(this['_message']) +
      '</div>\n    </div>';
    const _0x2052c = this['root']['querySelector']('.storyboard-3d-outline-list');
    if (_0x2052c) _0x2052c['scrollTop'] = _0x25802c;
    const _0x7f2e3b = this['root']['querySelector']('.storyboard-3d-object-properties-content');
    _0x7f2e3b && _0x1dac6c && _0x1dac6c === _0x4195c0?.['id'] && (_0x7f2e3b['scrollTop'] = _0x41f464);
    _0xbbcb21 &&
      (this['root']['querySelector']('.storyboard-3d-editor-main')?.['append']?.(_0xbbcb21),
      _0x7a3557?.['focus']?.({ preventScroll: !![] }));
    const _0xe08971 = this['root']['querySelector']('[data-storyboard-3d-runtime-host]');
    if (_0x448062 && _0xe08971 && this['sceneRuntime']) {
      _0xe08971['replaceWith'](_0x448062);
      try {
        this['sceneRuntime']['sync']({
          project: _0x26a06c,
          sceneId: _0x26a06c['activeSceneId'],
          selectedObjectIds: _0x37bf1f['selectedObjectIds'],
          activeTool: _0x37bf1f['activeTool'],
        });
        if (this['viewportControls']) {
          const _0x43700a = this['sceneRuntime']['getSceneView']();
          ((this['viewportControls']['sceneView'] = _0x43700a),
            this['viewportControls']['viewMode'] === 'perspective' &&
              (this['viewportControls']['perspectiveSceneView'] = structuredClone(_0x43700a)));
        }
        this['_restoreViewportFocalLength']();
        const _0xf1f5f2 = _0x448062['getBoundingClientRect']?.();
        this['sceneRuntime']['resize'](_0xf1f5f2?.['width'], _0xf1f5f2?.['height']);
      } catch (_0x19cc3d) {
        ((this['_runtimeError'] = _0x19cc3d?.['message'] || String(_0x19cc3d)),
          this['_disposeSceneRuntime']());
      }
    }
    (this['_syncResponsiveState'](),
      this['_syncHistoryButtons'](),
      !this['sceneRuntime'] && !this['_runtimeError'] && this['_mountSceneRuntime'](_0x26a06c, _0x37bf1f),
      this['_runtimeError'] &&
        this['_showRuntimeFailure'](
          this['_runtimeFailureTitle'] || '3D\x20视口不可用',
          this['_runtimeError'],
        ),
      this['exploreOpen'] &&
        this['shotCandidates']['length'] > 0x0 &&
        void this['_renderShotCandidatePreviews'](_0x26a06c, _0x37bf1f),
      this['_bindAIAssistantModelSelector'](),
      this['_observeVisibleAssetThumbnails'](),
      this['shotTimelineController']?.['syncPreview']?.(),
      restoreTimelinePresentation(this['root'], _0x19fb8a));
  }
  ['_syncSaveStatus'](_0xa9b86d = this['projectStore']['getSaveStatus']()) {
    const _0x3eeee0 = this['root']?.['querySelector']?.('[data-storyboard-3d-save-status]');
    if (!_0x3eeee0) return;
    ((_0x3eeee0['dataset']['status'] = _0xa9b86d),
      (_0x3eeee0['textContent'] = getSaveStatusLabel(_0xa9b86d)));
  }
  ['_syncResponsiveState']() {
    const _0x3f2ca5 = this['root']?.['querySelector']?.('.storyboard-3d-editor-shell');
    if (!_0x3f2ca5) return;
    _0x3f2ca5['classList']['remove']('is-inspector-open');
  }
  ['_applyInspectorWidth'](_0x68d95c, _0x4308e2 = null) {
    const _0x557a2a = _0x4308e2 || this['root']?.['querySelector']?.('.storyboard-3d-editor-main'),
      _0x507738 =
        _0x557a2a?.['getBoundingClientRect']?.()['width'] || this['window']?.['innerWidth'] || 0x4b0;
    return (
      (this['inspectorWidth'] = normalizeStoryboard3DInspectorWidth(_0x68d95c, _0x507738)),
      _0x557a2a?.['style']?.['setProperty']?.(
        '--storyboard-3d-inspector-width',
        this['inspectorWidth'] + 'px',
      ),
      _0x557a2a?.['querySelector']?.('[data-storyboard-3d-inspector-splitter]')?.['setAttribute']?.(
        'aria-valuenow',
        String(this['inspectorWidth']),
      ),
      this['inspectorWidth']
    );
  }
  ['_handleInspectorResizePointerDown'](_0x19ca98) {
    const _0x2918c6 = _0x19ca98['target']?.['closest']?.('[data-storyboard-3d-inspector-splitter]');
    if (
      !_0x2918c6 ||
      _0x19ca98['isPrimary'] === ![] ||
      (Number['isFinite'](_0x19ca98['button']) && _0x19ca98['button'] !== 0x0)
    )
      return;
    const _0x433725 = _0x2918c6['closest']?.('.storyboard-3d-editor-main'),
      _0x1ecb76 = _0x433725?.['getBoundingClientRect']?.();
    if (!_0x1ecb76?.['width'] || _0x1ecb76['width'] < 0x384) return;
    (_0x19ca98['preventDefault']?.(), _0x19ca98['stopImmediatePropagation']?.());
    const _0x387293 = _0x19ca98['pointerId'];
    try {
      _0x2918c6['setPointerCapture']?.(_0x387293);
    } catch {}
    ((this['_inspectorResize'] = {
      pointerId: _0x387293,
      splitter: _0x2918c6,
      layout: _0x433725,
      bounds: _0x1ecb76,
    }),
      this['document']?.['body']?.['classList']?.['add']?.('storyboard-3d-inspector-resizing'),
      this['_applyInspectorWidth'](_0x1ecb76['right'] - Number(_0x19ca98['clientX']), _0x433725),
      this['window']?.['addEventListener']?.('pointermove', this['_handleInspectorResizePointerMove'], !![]),
      this['window']?.['addEventListener']?.('pointerup', this['_handleInspectorResizePointerUp'], !![]),
      this['window']?.['addEventListener']?.('pointercancel', this['_handleInspectorResizePointerUp'], !![]));
  }
  ['_handleInspectorResizePointerMove'](_0x2936e7) {
    const _0x2a4684 = this['_inspectorResize'];
    if (!_0x2a4684 || (_0x2a4684['pointerId'] != null && _0x2936e7['pointerId'] !== _0x2a4684['pointerId']))
      return;
    (_0x2936e7['preventDefault']?.(),
      _0x2936e7['stopImmediatePropagation']?.(),
      this['_applyInspectorWidth'](
        _0x2a4684['bounds']['right'] - Number(_0x2936e7['clientX']),
        _0x2a4684['layout'],
      ));
  }
  ['_handleInspectorResizePointerUp'](_0x262151) {
    const _0x4150fc = this['_inspectorResize'];
    if (!_0x4150fc || (_0x4150fc['pointerId'] != null && _0x262151?.['pointerId'] !== _0x4150fc['pointerId']))
      return;
    (_0x262151?.['preventDefault']?.(),
      _0x262151?.['stopImmediatePropagation']?.(),
      (this['_inspectorResize'] = null),
      this['document']?.['body']?.['classList']?.['remove']?.('storyboard-3d-inspector-resizing'));
    try {
      _0x4150fc['splitter']['hasPointerCapture']?.(_0x4150fc['pointerId']) &&
        _0x4150fc['splitter']['releasePointerCapture']?.(_0x4150fc['pointerId']);
    } catch {}
    (this['window']?.['removeEventListener']?.(
      'pointermove',
      this['_handleInspectorResizePointerMove'],
      !![],
    ),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleInspectorResizePointerUp'], !![]),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleInspectorResizePointerUp'],
        !![],
      ));
  }
  ['_applyRightSidebarWidth'](_0x5cdad1, _0x404df5 = null) {
    const _0x1d4e5d = _0x404df5 || this['root']?.['querySelector']?.('.storyboard-3d-editor-main'),
      _0x202bd5 =
        _0x1d4e5d?.['getBoundingClientRect']?.()['width'] || this['window']?.['innerWidth'] || 0x5a0;
    return (
      (this['rightSidebarWidth'] = normalizeStoryboard3DRightSidebarWidth(_0x5cdad1, _0x202bd5)),
      _0x1d4e5d?.['style']?.['setProperty']?.(
        '--storyboard-3d-right-sidebar-width',
        this['rightSidebarWidth'] + 'px',
      ),
      _0x1d4e5d?.['querySelector']?.('[data-storyboard-3d-right-sidebar-splitter]')?.['setAttribute']?.(
        'aria-valuenow',
        String(this['rightSidebarWidth']),
      ),
      this['rightSidebarWidth']
    );
  }
  ['_handleRightSidebarResizePointerDown'](_0x3f2d26) {
    const _0x1bb151 = _0x3f2d26['target']?.['closest']?.('[data-storyboard-3d-right-sidebar-splitter]');
    if (
      !_0x1bb151 ||
      _0x3f2d26['isPrimary'] === ![] ||
      (Number['isFinite'](_0x3f2d26['button']) && _0x3f2d26['button'] !== 0x0)
    )
      return;
    const _0x539bb8 = _0x1bb151['closest']?.('.storyboard-3d-right-sidebar'),
      _0x944613 = _0x539bb8?.['closest']?.('.storyboard-3d-editor-main'),
      _0x948b4e = _0x539bb8?.['getBoundingClientRect']?.();
    if (!_0x948b4e?.['width'] || !_0x944613) return;
    (_0x3f2d26['preventDefault']?.(), _0x3f2d26['stopImmediatePropagation']?.());
    const _0x4f1aeb = _0x3f2d26['pointerId'];
    try {
      _0x1bb151['setPointerCapture']?.(_0x4f1aeb);
    } catch {}
    ((this['_rightSidebarResize'] = {
      pointerId: _0x4f1aeb,
      splitter: _0x1bb151,
      layout: _0x944613,
      right: _0x948b4e['right'],
    }),
      this['document']?.['body']?.['classList']?.['add']?.('storyboard-3d-right-sidebar-resizing'),
      this['_applyRightSidebarWidth'](_0x948b4e['right'] - Number(_0x3f2d26['clientX']), _0x944613),
      this['window']?.['addEventListener']?.(
        'pointermove',
        this['_handleRightSidebarResizePointerMove'],
        !![],
      ),
      this['window']?.['addEventListener']?.('pointerup', this['_handleRightSidebarResizePointerUp'], !![]),
      this['window']?.['addEventListener']?.(
        'pointercancel',
        this['_handleRightSidebarResizePointerUp'],
        !![],
      ));
  }
  ['_handleRightSidebarResizePointerMove'](_0xb5ea0b) {
    const _0x598608 = this['_rightSidebarResize'];
    if (!_0x598608 || (_0x598608['pointerId'] != null && _0xb5ea0b['pointerId'] !== _0x598608['pointerId']))
      return;
    (_0xb5ea0b['preventDefault']?.(),
      _0xb5ea0b['stopImmediatePropagation']?.(),
      this['_applyRightSidebarWidth'](
        _0x598608['right'] - Number(_0xb5ea0b['clientX']),
        _0x598608['layout'],
      ));
  }
  ['_handleRightSidebarResizePointerUp'](_0x3a81e4) {
    const _0x4901ad = this['_rightSidebarResize'];
    if (!_0x4901ad || (_0x4901ad['pointerId'] != null && _0x3a81e4?.['pointerId'] !== _0x4901ad['pointerId']))
      return;
    (_0x3a81e4?.['preventDefault']?.(),
      _0x3a81e4?.['stopImmediatePropagation']?.(),
      (this['_rightSidebarResize'] = null),
      this['document']?.['body']?.['classList']?.['remove']?.('storyboard-3d-right-sidebar-resizing'));
    try {
      _0x4901ad['splitter']['hasPointerCapture']?.(_0x4901ad['pointerId']) &&
        _0x4901ad['splitter']['releasePointerCapture']?.(_0x4901ad['pointerId']);
    } catch {}
    (this['window']?.['removeEventListener']?.(
      'pointermove',
      this['_handleRightSidebarResizePointerMove'],
      !![],
    ),
      this['window']?.['removeEventListener']?.(
        'pointerup',
        this['_handleRightSidebarResizePointerUp'],
        !![],
      ),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleRightSidebarResizePointerUp'],
        !![],
      ));
  }
  ['_applyTimelineHeight'](_0x112e7b, _0x1d36a5 = null) {
    const _0x56674d = _0x1d36a5 || this['root']?.['querySelector']?.('.storyboard-3d-viewport-column'),
      _0x23ee4c =
        _0x56674d?.['getBoundingClientRect']?.()['height'] ||
        this['root']?.['getBoundingClientRect']?.()['height'] ||
        this['window']?.['innerHeight'] ||
        0x384;
    return (
      (this['timelineHeight'] = normalizeStoryboard3DTimelineHeight(_0x112e7b, _0x23ee4c)),
      _0x56674d?.['style']?.['setProperty']?.(
        '--storyboard-3d-timeline-height',
        this['timelineHeight'] + 'px',
      ),
      _0x56674d?.['querySelector']?.('[data-storyboard-3d-timeline-resize-handle]')?.['setAttribute']?.(
        'aria-valuenow',
        String(this['timelineHeight']),
      ),
      this['timelineHeight']
    );
  }
  ['_handleTimelineResizePointerDown'](_0x29dcb3) {
    const _0x2e1d8a = _0x29dcb3['target']?.['closest']?.('[data-storyboard-3d-timeline-resize-handle]');
    if (
      !_0x2e1d8a ||
      _0x29dcb3['isPrimary'] === ![] ||
      (Number['isFinite'](_0x29dcb3['button']) && _0x29dcb3['button'] !== 0x0)
    )
      return;
    const _0x2232d6 = _0x2e1d8a['closest']?.('.storyboard-3d-viewport-column'),
      _0x5d6de = _0x2232d6?.['getBoundingClientRect']?.(),
      _0x434f23 = _0x2e1d8a['closest']?.('.storyboard-3d-shot-dock')?.['getBoundingClientRect']?.()['height'];
    if (!_0x5d6de?.['height']) return;
    const _0x467e34 = _0x29dcb3['pointerId'];
    try {
      _0x2e1d8a['setPointerCapture']?.(_0x467e34);
    } catch {}
    ((this['_timelineResize'] = {
      pointerId: _0x467e34,
      handle: _0x2e1d8a,
      column: _0x2232d6,
      startHeight: Number(_0x434f23) || this['timelineHeight'],
      startY: Number(_0x29dcb3['clientY']),
      moved: ![],
    }),
      this['window']?.['addEventListener']?.('pointermove', this['_handleTimelineResizePointerMove'], !![]),
      this['window']?.['addEventListener']?.('pointerup', this['_handleTimelineResizePointerUp'], !![]),
      this['window']?.['addEventListener']?.('pointercancel', this['_handleTimelineResizePointerUp'], !![]));
  }
  ['_handleTimelineResizePointerMove'](_0x10b516) {
    const _0x2033a5 = this['_timelineResize'];
    if (!_0x2033a5 || (_0x2033a5['pointerId'] != null && _0x10b516['pointerId'] !== _0x2033a5['pointerId']))
      return;
    const _0x53e982 = Number(_0x10b516['clientY']);
    if (!Number['isFinite'](_0x53e982)) return;
    if (!_0x2033a5['moved'] && Math['abs'](_0x53e982 - _0x2033a5['startY']) < 0x4) return;
    (_0x10b516['preventDefault']?.(),
      _0x10b516['stopImmediatePropagation']?.(),
      !_0x2033a5['moved'] &&
        ((_0x2033a5['moved'] = !![]),
        (this['_suppressTimelineToggleClick'] = !![]),
        this['shotTimelineController']?.['setDrawerOpen']?.(!![]),
        this['document']?.['body']?.['classList']?.['add']?.('storyboard-3d-timeline-resizing')),
      this['_applyTimelineHeight'](
        _0x2033a5['startHeight'] + _0x2033a5['startY'] - _0x53e982,
        _0x2033a5['column'],
      ));
  }
  ['_handleTimelineResizePointerUp'](_0x19f570) {
    const _0x2b449d = this['_timelineResize'];
    if (!_0x2b449d || (_0x2b449d['pointerId'] != null && _0x19f570?.['pointerId'] !== _0x2b449d['pointerId']))
      return;
    _0x2b449d['moved'] && (_0x19f570?.['preventDefault']?.(), _0x19f570?.['stopImmediatePropagation']?.());
    ((this['_timelineResize'] = null),
      this['document']?.['body']?.['classList']?.['remove']?.('storyboard-3d-timeline-resizing'));
    try {
      _0x2b449d['handle']['hasPointerCapture']?.(_0x2b449d['pointerId']) &&
        _0x2b449d['handle']['releasePointerCapture']?.(_0x2b449d['pointerId']);
    } catch {}
    (this['window']?.['removeEventListener']?.('pointermove', this['_handleTimelineResizePointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleTimelineResizePointerUp'], !![]),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleTimelineResizePointerUp'],
        !![],
      ));
    if (_0x2b449d['moved']) {
      const _0x2a3b98 = () => {
        this['_suppressTimelineToggleClick'] = ![];
      };
      typeof this['window']?.['setTimeout'] === 'function'
        ? this['window']['setTimeout'](_0x2a3b98, 0x0)
        : globalThis['setTimeout']?.(_0x2a3b98, 0x0);
    }
  }
  ['_openAssetLibrary']() {
    ((this['assetVisibleLimit'] = Math['max'](0x20, this['assetVisibleLimit'])),
      (this['rightSidebarMode'] = 'assets'),
      this['editorStore']['setAssetLibraryOpen'](!![]),
      this['_render'](),
      this['root']?.['querySelector']?.('[data-storyboard-3d-asset-query]')?.['focus']?.());
  }
  ['_openBackgroundPerspective']() {
    ((this['rightSidebarMode'] = 'perspective'),
      this['editorStore']['setAssetLibraryOpen'](![]),
      this['_assetThumbnailObserver']?.['disconnect']?.(),
      (this['_assetThumbnailObserver'] = null),
      this['_render']());
  }
  ['_setSelectedObjects'](_0x22505a, { openProperties: openProperties = !![] } = {}) {
    const _0x4ed055 = this['editorStore']['setSelectedObjects'](_0x22505a);
    if (openProperties && _0x4ed055['selectedObjectIds']['length'] > 0x0) {
      this['rightSidebarMode'] = 'object';
      if (_0x4ed055['assetLibraryOpen']) this['editorStore']['setAssetLibraryOpen'](![]);
      (this['_assetThumbnailObserver']?.['disconnect']?.(), (this['_assetThumbnailObserver'] = null));
    } else
      _0x4ed055['selectedObjectIds']['length'] === 0x0 &&
        this['rightSidebarMode'] === 'object' &&
        (this['rightSidebarMode'] = Number(this['window']?.['innerWidth']) <= 0x384 ? null : 'ai');
    return _0x4ed055['selectedObjectIds'];
  }
  ['_toggleAIAssistant']() {
    const _0x4fb5e0 = this['rightSidebarMode'] !== 'ai';
    ((this['rightSidebarMode'] = _0x4fb5e0 ? 'ai' : null),
      this['editorStore']['setAssetLibraryOpen'](![]),
      this['_assetThumbnailObserver']?.['disconnect']?.(),
      (this['_assetThumbnailObserver'] = null),
      this['_render']());
    if (_0x4fb5e0) this['root']?.['querySelector']?.('[data-storyboard-3d-ai-instruction]')?.['focus']?.();
  }
  ['_setMessage'](_0x140753) {
    this['_message'] = String(_0x140753 || '');
    const _0x1c4d10 = this['root']?.['querySelector']?.('[data-storyboard-3d-message]');
    if (!_0x1c4d10) return;
    ((_0x1c4d10['textContent'] = this['_message']), (_0x1c4d10['hidden'] = !this['_message']));
  }
  async ['_runAICommand']() {
    const _0x51e987 = this['root']?.['querySelector']?.('[data-storyboard-3d-ai-instruction]'),
      _0x3dbdfb = String(_0x51e987?.['value'] || this['aiState']['instruction'] || '')['trim']();
    if (!_0x3dbdfb) {
      this['_setMessage']('请先输入要执行的 3D 场景指令。');
      return;
    }
    try {
      await this['_requireInstalledModelPack']();
    } catch (_0xf08d38) {
      this['_setMessage'](_0xf08d38?.['message'] || String(_0xf08d38));
      return;
    }
    this['aiController']['setInstruction'](_0x3dbdfb);
    try {
      const _0x46d3f0 = await this['aiController']['submit']({ instruction: _0x3dbdfb });
      if (_0x46d3f0) {
        this['_setMessage'](_0x46d3f0['plan']?.['summary'] || 'AI 场景指令已执行。');
        const _0x556a0b = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
        if (_0x556a0b) void this['_generateMissingShotThumbnails'](_0x556a0b['id']);
      }
    } catch {}
  }
  ['_persistProject'](_0x5d7cb6, _0x2a68a7 = {}) {
    const _0x35768c = this['onProjectChange']?.(_0x5d7cb6, _0x2a68a7);
    dispatchWorkspaceEvent(this['window'], 'storyboard-3d:project-changed', {
      projectId: _0x5d7cb6['id'],
      updatedAt: _0x5d7cb6['updatedAt'],
      reason: _0x2a68a7['reason'],
    });
    if (_0x2a68a7['reason'] === 'select-shot') {
      const _0x4ffa81 = getActiveStoryboard3DScene(_0x5d7cb6);
      dispatchWorkspaceEvent(this['window'], 'storyboard-3d:shot-selected', {
        projectId: this['projectId'],
        sceneId: _0x4ffa81?.['id'] || '',
        shotId: _0x4ffa81?.['activeShotId'] || '',
      });
    }
    return _0x35768c;
  }
  ['_getFlyMovementKey'](_0x5e75cb) {
    return (
      { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', KeyQ: 'down', KeyE: 'up' }[
        _0x5e75cb
      ] || ''
    );
  }
  ['_scheduleFlyMovement']() {
    if (this['_flyFrame'] != null || this['_flyKeys']['size'] === 0x0) return;
    const _0x52f3cc =
      this['window']?.['requestAnimationFrame']?.['bind'](this['window']) ||
      globalThis['requestAnimationFrame']?.['bind'](globalThis);
    if (!_0x52f3cc) return;
    ((this['_flyLastTime'] =
      this['_flyLastTime'] || this['window']?.['performance']?.['now']?.() || Date['now']()),
      (this['_flyFrame'] = _0x52f3cc((_0x1bcb13) => {
        this['_flyFrame'] = null;
        if (
          !this['editorStore']['getSnapshot']()['flyMode'] ||
          !this['sceneRuntime'] ||
          this['_flyKeys']['size'] === 0x0
        )
          return;
        const _0x403ee3 = Number(_0x1bcb13) || this['window']?.['performance']?.['now']?.() || Date['now'](),
          _0x2a0c63 = Math['max'](0x0, Math['min'](0.1, (_0x403ee3 - this['_flyLastTime']) / 0x3e8));
        this['_flyLastTime'] = _0x403ee3;
        const _0x14839a = this['_flySceneView'] || this['sceneRuntime']['getSceneView']?.();
        if (!_0x14839a) return;
        const _0x3a9a1b = applySceneFlyMovement(
          _0x14839a,
          {
            forward:
              (this['_flyKeys']['has']('forward') ? 0x1 : 0x0) -
              (this['_flyKeys']['has']('backward') ? 0x1 : 0x0),
            right:
              (this['_flyKeys']['has']('right') ? 0x1 : 0x0) - (this['_flyKeys']['has']('left') ? 0x1 : 0x0),
            vertical:
              (this['_flyKeys']['has']('up') ? 0x1 : 0x0) - (this['_flyKeys']['has']('down') ? 0x1 : 0x0),
            boost: this['_flyBoost'],
          },
          _0x2a0c63,
          { speed: 0x4, boostMultiplier: 0x4 },
        );
        ((this['_flySceneView'] = { ..._0x14839a, ..._0x3a9a1b }),
          this['_cameraDrag']?.['mode'] === 'fly-look' &&
            (this['_cameraDrag']['latestSceneView'] = this['_flySceneView']),
          this['sceneRuntime']['previewSceneView']?.(this['_flySceneView']),
          (this['_miniMapPreviewSceneView'] = structuredClone(this['_flySceneView'])),
          this['_scheduleMiniMapRefresh'](),
          this['viewportControls'] &&
            ((this['viewportControls']['sceneView'] = structuredClone(this['_flySceneView'])),
            (this['viewportControls']['perspectiveSceneView'] = structuredClone(this['_flySceneView']))),
          this['_scheduleFlyMovement']());
      })));
  }
  ['_stopFlyMovementFrame']() {
    const _0x38206c =
      this['window']?.['cancelAnimationFrame']?.['bind'](this['window']) ||
      globalThis['cancelAnimationFrame']?.['bind'](globalThis);
    if (this['_flyFrame'] != null) _0x38206c?.(this['_flyFrame']);
    ((this['_flyFrame'] = null), (this['_flyLastTime'] = 0x0));
  }
  ['_finishFlyMovement']({ clearKeys: clearKeys = ![] } = {}) {
    this['_stopFlyMovementFrame']();
    const _0x41f703 = this['_flySceneView'];
    if (_0x41f703) this['sceneRuntime']?.['commitSceneView']?.(_0x41f703);
    ((this['_flySceneView'] = null),
      (this['_miniMapPreviewSceneView'] = null),
      this['_scheduleMiniMapRefresh'](),
      clearKeys && (this['_flyKeys']['clear'](), (this['_flyBoost'] = ![])),
      !this['_closed'] &&
        _0x41f703 &&
        this['shotTimelineController']?.['isAutoKeyEnabled']?.() &&
        this['shotTimelineController']['recordCameraKeyframe'](this['_readCurrentCameraState']()));
  }
  ['_setFlyMode'](_0x5250e9) {
    const _0x13a774 = _0x5250e9 === !![];
    if (!_0x13a774) this['_finishFlyMovement']({ clearKeys: !![] });
    (_0x13a774 &&
      this['viewportControls']?.['getSnapshot']?.()['viewMode'] !== 'perspective' &&
      this['viewportControls']['showPerspectiveView']?.(),
      this['editorStore']['setFlyMode'](_0x13a774),
      this['_render'](),
      this['root']?.['querySelector']?.('.storyboard-3d-viewport')?.['focus']?.(),
      this['_setMessage'](
        _0x13a774 ? '飞行模式已开启：WASD 移动，Q/E 升降，右键观察，Shift 加速。' : '飞行模式已关闭。',
      ));
  }
  ['_handleWindowKeyUp'](_0x305b9a) {
    if (!this['root'] || !this['editorStore']['getSnapshot']()['flyMode']) return;
    const _0xe9f0a3 = this['_getFlyMovementKey'](_0x305b9a['code']),
      _0x460892 = _0x305b9a['code'] === 'ShiftLeft' || _0x305b9a['code'] === 'ShiftRight';
    if (!_0xe9f0a3 && !_0x460892) return;
    (_0x305b9a['preventDefault']?.(), _0x305b9a['stopImmediatePropagation']?.());
    if (_0xe9f0a3) this['_flyKeys']['delete'](_0xe9f0a3);
    if (_0x460892) this['_flyBoost'] = ![];
    if (this['_flyKeys']['size'] === 0x0) {
      if (this['_cameraDrag']?.['mode'] === 'fly-look') this['_stopFlyMovementFrame']();
      else this['_finishFlyMovement']();
    }
  }
  ['_handleWindowBlur']() {
    (this['_finishFlyMovement']({ clearKeys: !![] }),
      this['_cancelRuntimeSelection'](),
      this['_cancelRuntimeTransform'](),
      this['shotTimelineController']?.['stopPlayback']?.({ clear: !![] }));
  }
  ['_toggleNavigationSettings']() {
    const _0x97e801 = this['root']?.['querySelector']?.('.storyboard-3d-global-settings');
    if (!_0x97e801) return ![];
    return ((_0x97e801['open'] = !_0x97e801['open']), !![]);
  }
  ['_handleWindowKeyDown'](_0x3900f8) {
    if (!this['root']) return;
    if (this['exportController']?.['root']) return;
    if (this['shotTimelineController']?.['cameraPath']?.['onKey'](_0x3900f8)) return;
    if (this['shotTimelineController']?.['editing']?.['handleKey'](_0x3900f8)) return;
    const _0x39e8af = _0x3900f8['target']?.['closest']?.('[data-storyboard-3d-inspector-splitter]');
    if (_0x39e8af && ['ArrowLeft', 'ArrowRight']['includes'](_0x3900f8['key'])) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      const _0x127372 = _0x3900f8['shiftKey'] ? 0x30 : 0x10;
      this['_applyInspectorWidth'](
        this['inspectorWidth'] + (_0x3900f8['key'] === 'ArrowLeft' ? _0x127372 : -_0x127372),
        _0x39e8af['closest']?.('.storyboard-3d-editor-main'),
      );
      return;
    }
    const _0x2249d3 = _0x3900f8['target']?.['closest']?.('[data-storyboard-3d-right-sidebar-splitter]');
    if (_0x2249d3 && ['ArrowLeft', 'ArrowRight']['includes'](_0x3900f8['key'])) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      const _0x921998 = _0x3900f8['shiftKey'] ? 0x30 : 0x10,
        _0x1cc6fb = Number['isFinite'](this['rightSidebarWidth'])
          ? this['rightSidebarWidth']
          : _0x2249d3['closest']?.('.storyboard-3d-right-sidebar')?.['getBoundingClientRect']?.()['width'];
      this['_applyRightSidebarWidth'](
        _0x1cc6fb + (_0x3900f8['key'] === 'ArrowLeft' ? _0x921998 : -_0x921998),
        _0x2249d3['closest']?.('.storyboard-3d-editor-main'),
      );
      return;
    }
    const _0x4ca6a7 = _0x3900f8['target']?.['closest']?.('[data-storyboard-3d-timeline-resize-handle]');
    if (_0x4ca6a7 && ['ArrowUp', 'ArrowDown']['includes'](_0x3900f8['key'])) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      const _0x47a952 = _0x3900f8['shiftKey'] ? 0x40 : 0x18;
      (this['shotTimelineController']?.['setDrawerOpen']?.(!![]),
        this['_applyTimelineHeight'](
          this['timelineHeight'] + (_0x3900f8['key'] === 'ArrowUp' ? _0x47a952 : -_0x47a952),
          _0x4ca6a7['closest']?.('.storyboard-3d-viewport-column'),
        ));
      return;
    }
    if (this['rightSidebarMode']) {
      const _0x3b0970 = this['root']['querySelector']('.storyboard-3d-right-sidebar');
      if (_0x3b0970?.['contains']?.(_0x3900f8['target'])) {
        if (trapTabKey(_0x3900f8, _0x3b0970, this['document'])) return;
        _0x3900f8['stopImmediatePropagation']();
        return;
      }
    }
    if (trapTabKey(_0x3900f8, this['root'], this['document'])) return;
    const _0x328d0c = _0x3900f8['target']?.['matches']?.(
        'input,\x20textarea,\x20select,\x20[contenteditable=\x27true\x27]',
      ),
      _0xc70059 =
        !_0x328d0c &&
        !_0x3900f8['altKey'] &&
        !_0x3900f8['ctrlKey'] &&
        !_0x3900f8['metaKey'] &&
        !_0x3900f8['shiftKey'] &&
        (_0x3900f8['code'] === 'KeyK' || String(_0x3900f8['key'] || '')['toLowerCase']() === 'k');
    if (_0xc70059) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      if (!_0x3900f8['repeat']) this['_toggleNavigationSettings']();
      return;
    }
    const _0x1900b4 =
      !_0x328d0c &&
      !_0x3900f8['altKey'] &&
      !_0x3900f8['ctrlKey'] &&
      !_0x3900f8['metaKey'] &&
      !_0x3900f8['shiftKey'] &&
      (_0x3900f8['code'] === 'Space' || _0x3900f8['key'] === '\x20') &&
      !_0x3900f8['target']?.['closest']?.("button, a, [role='button']");
    if (_0x1900b4) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      if (!_0x3900f8['repeat']) this['shotTimelineController']?.['togglePlayback']?.();
      return;
    }
    if (
      !_0x328d0c &&
      _0x3900f8['shiftKey'] &&
      (_0x3900f8['code'] === 'KeyF' || _0x3900f8['key']['toLowerCase']() === 'f')
    ) {
      (_0x3900f8['preventDefault'](),
        _0x3900f8['stopImmediatePropagation'](),
        this['_setFlyMode'](!this['editorStore']['getSnapshot']()['flyMode']));
      return;
    }
    if (!_0x328d0c && this['editorStore']['getSnapshot']()['flyMode']) {
      const _0x4f3f34 = this['_getFlyMovementKey'](_0x3900f8['code']),
        _0x3ad01b = _0x3900f8['code'] === 'ShiftLeft' || _0x3900f8['code'] === 'ShiftRight';
      if (_0x4f3f34 || _0x3ad01b) {
        (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
        if (_0x4f3f34) this['_flyKeys']['add'](_0x4f3f34);
        if (_0x3ad01b || _0x3900f8['shiftKey']) this['_flyBoost'] = !![];
        this['_scheduleFlyMovement']();
        return;
      }
    }
    if (
      !_0x328d0c &&
      (_0x3900f8['ctrlKey'] || _0x3900f8['metaKey']) &&
      _0x3900f8['key']['toLowerCase']() === 'z'
    ) {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      if (this['_cancelRuntimeSelection']()) return;
      if (this['_cancelRuntimeTransform']()) return;
      if (_0x3900f8['shiftKey']) this['commandHistory']['redo']();
      else this['commandHistory']['undo']();
      return;
    }
    if (_0x3900f8['key'] === 'Escape') {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      if (this['_cancelRuntimeSelection']()) return;
      if (this['_cancelRuntimeTransform']()) return;
      if (this['editorStore']['getSnapshot']()['flyMode']) {
        this['_setFlyMode'](![]);
        return;
      }
      if (this['editorStore']['getSnapshot']()['selectedObjectIds']['length'] > 0x0) {
        (this['_setSelectedObjects']([]), this['_render']());
        return;
      }
      this['close']();
      return;
    }
    const _0x461175 =
      !_0x328d0c && !_0x3900f8['altKey'] && !_0x3900f8['ctrlKey'] && !_0x3900f8['metaKey']
        ? resolveStoryboard3DToolFromShortcut(_0x3900f8['key'], this['navigationSettings']['preset'])
        : null;
    if (_0x461175) {
      (_0x3900f8['preventDefault'](),
        _0x3900f8['stopImmediatePropagation'](),
        this['editorStore']['setActiveTool'](_0x461175),
        this['_render']());
      return;
    }
    if (!_0x328d0c && !_0x3900f8['shiftKey'] && _0x3900f8['key']['toLowerCase']() === 'f') {
      (_0x3900f8['preventDefault'](), _0x3900f8['stopImmediatePropagation']());
      if (!this['viewportControls']?.['focusSelection']?.()) this['_setMessage']('请先选择一个可见对象。');
      return;
    }
    if (!_0x328d0c && _0x3900f8['key'] === 'Home') {
      (_0x3900f8['preventDefault'](),
        _0x3900f8['stopImmediatePropagation'](),
        this['viewportControls']?.['fitAll']?.());
      return;
    }
    const _0x29d2e2 =
      ['Delete', 'Backspace']['includes'](_0x3900f8['key']) ||
      (!_0x3900f8['shiftKey'] &&
        !_0x3900f8['altKey'] &&
        !_0x3900f8['ctrlKey'] &&
        !_0x3900f8['metaKey'] &&
        _0x3900f8['code'] === 'KeyD');
    if (!_0x328d0c && _0x29d2e2) {
      const _0x276cac = this['editorStore']['getSnapshot']()['selectedObjectIds'];
      if (_0x276cac['length'] > 0x0) {
        (_0x3900f8['preventDefault'](),
          _0x3900f8['stopImmediatePropagation'](),
          this['_deleteObjects'](_0x276cac));
        return;
      }
    }
    _0x3900f8['stopImmediatePropagation']();
  }
  ['_addAssetToActiveScene'](_0x56a290, { position: position = null } = {}) {
    let _0x39655f = '';
    const _0x3da595 = this['sceneRuntime']?.['resolveViewportGroundPosition']?.(0x0),
      _0x21724a = Array['isArray'](position)
        ? position['slice'](0x0, 0x3)
        : Array['isArray'](_0x3da595)
          ? _0x3da595['slice'](0x0, 0x3)
          : resolveStoryboard3DViewportCenterPosition(this['sceneRuntime']?.['getSceneView']?.());
    (this['_executeMutation']({
      type: 'add-object',
      label: 'Add asset',
      renderOptions: { preserveAssetLibrary: !![] },
      mutate: (_0x1b2c11) => {
        const _0x2245d4 = _0x1b2c11['scenes']['find'](
          (_0x2e25a4) => _0x2e25a4['id'] === _0x1b2c11['activeSceneId'],
        );
        if (!_0x2245d4) return _0x1b2c11;
        const _0x4028da = _0x56a290['source']?.['assetId'] || _0x56a290['id'] || '',
          _0x459058 =
            _0x56a290['category'] === 'character' &&
            STORYBOARD_3D_BODY_PRESETS['some']((_0x532e11) => _0x532e11['id'] === _0x4028da),
          _0x40538a = {
            id: createLocalId(_0x459058 ? 'character' : 'prop'),
            type: _0x459058 ? 'character' : 'prop',
            name: _0x56a290['name'],
            visible: !![],
            locked: ![],
            transform: { position: _0x21724a, rotation: [0x0, 0x0, 0x0], scale: [0x1, 0x1, 0x1] },
            ...(_0x459058
              ? {
                  bodyPresetId: _0x4028da || 'adult-male',
                  actionId: 'standing',
                  actionPlaying: ![],
                  leftHandPoseId: 'relaxed',
                  rightHandPoseId: 'relaxed',
                  boneOverrides: {},
                }
              : {
                  assetId: _0x56a290['source']?.['assetId'] || _0x56a290['id'],
                  ...(_0x56a290['tint'] ? { tint: _0x56a290['tint'] } : {}),
                  castShadow: !![],
                  receiveShadow: !![],
                }),
          };
        return (_0x2245d4['objects']['push'](_0x40538a), (_0x39655f = _0x40538a['id']), _0x1b2c11);
      },
    }),
      this['assetLibrary']['markUsed'](_0x56a290['id']),
      _0x39655f &&
        (this['_setSelectedObjects']([_0x39655f], { openProperties: ![] }),
        this['_render']({ preserveAssetLibrary: !![] })));
  }
  ['_handleClick'](_0x57058e) {
    const _0x415d6f = _0x57058e['target']?.['closest']?.('[data-storyboard-3d-action]');
    if (!_0x415d6f || _0x415d6f['disabled']) return;
    const _0x382e67 = _0x415d6f['getAttribute']('data-storyboard-3d-action');
    if (_0x382e67 === 'timeline-toggle-drawer' && this['_suppressTimelineToggleClick']) {
      ((this['_suppressTimelineToggleClick'] = ![]),
        _0x57058e['preventDefault']?.(),
        _0x57058e['stopImmediatePropagation']?.());
      return;
    }
    if (this['shotTimelineController']?.['handleClick']?.(_0x382e67, _0x415d6f, _0x57058e)) return;
    if (_0x382e67 === 'set-inspector-tab') {
      const _0x429039 = this['root']?.['querySelector']?.('.storyboard-3d-inspector-dock');
      if (_0x429039) _0x429039['scrollTop'] = 0x0;
      (this['editorStore']['setInspectorTab'](_0x415d6f['dataset']['inspectorTab']), this['_render']());
      return;
    }
    if (_0x382e67 === 'toggle-object-outline') {
      const _0x150f40 = _0x415d6f['closest']('.storyboard-3d-object-popover');
      this['editorStore']['setObjectOutlineOpen'](!_0x150f40?.['open']);
      return;
    }
    if (_0x382e67 === 'toggle-scene-environment') {
      const _0x54401b = _0x415d6f['closest']('[data-storyboard-3d-scene-environment]');
      this['sceneEnvironmentOpen'] = !_0x54401b?.['open'];
      return;
    }
    if (_0x382e67 === 'toggle-fly-mode') {
      this['_setFlyMode'](!this['editorStore']['getSnapshot']()['flyMode']);
      return;
    }
    if (_0x382e67 === 'open-asset-library') {
      this['_openAssetLibrary']();
      return;
    }
    if (_0x382e67 === 'open-background-perspective') {
      this['_openBackgroundPerspective']();
      return;
    }
    if (_0x382e67 === 'toggle-ai-sidebar') {
      this['_toggleAIAssistant']();
      return;
    }
    if (_0x382e67 === 'select-asset-category') {
      ((this['assetCategory'] = String(
        _0x415d6f['getAttribute']('data-storyboard-3d-asset-category') || 'all',
      )),
        (this['assetVisibleLimit'] = 0x20),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'rebuild-viewport') {
      this['_rebuildSceneRuntime']();
      return;
    }
    if (_0x382e67 === 'focus-selection') {
      if (!this['viewportControls']?.['focusSelection']?.()) this['_setMessage']('请先选择一个可见对象。');
      return;
    }
    if (_0x382e67 === 'fit-all') {
      this['viewportControls']?.['fitAll']?.();
      return;
    }
    if (_0x382e67 === 'reset-focal-length') {
      this['_commitFocalLength'](STORYBOARD_3D_FOCAL_LENGTH_PRESETS['indexOf'](0x23));
      return;
    }
    if (_0x382e67 === 'set-viewport-view') {
      const _0x479716 = _0x415d6f['dataset']['view'];
      if (_0x479716 === 'perspective') this['viewportControls']?.['showPerspectiveView']?.();
      else this['viewportControls']?.['showOrthographicView']?.(_0x479716);
      return;
    }
    if (_0x382e67 === 'toggle-viewport-setting') {
      const _0x521a5f = _0x415d6f['getAttribute']('data-storyboard-3d-viewport-setting-toggle');
      if (!['transformSpace', 'snapEnabled', 'groundLock', 'uniformScale']['includes'](_0x521a5f)) return;
      const _0x8de972 =
          _0x521a5f === 'transformSpace'
            ? { transformSpace: this['viewportSettings']['transformSpace'] === 'local' ? 'world' : 'local' }
            : { [_0x521a5f]: this['viewportSettings'][_0x521a5f] !== !![] },
        _0x5ea01c =
          this['viewportControls']?.['updateSettings']?.(_0x8de972) ||
          normalizeStoryboard3DViewportSettings({ ...this['viewportSettings'], ..._0x8de972 });
      (this['_saveTransformSettings'](_0x5ea01c),
        this['sceneRuntime']?.['setViewportUIPatch']?.(
          this['viewportControls']?.['getDirectorUIPatch']?.() || {},
        ),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'toggle-top-view') {
      const _0x4fdc84 = this['viewportControls']?.['getSnapshot']?.()['viewMode'];
      if (_0x4fdc84 === 'top') this['viewportControls']['showPerspectiveView']();
      else this['viewportControls']?.['showTopView']?.();
      return;
    }
    if (_0x382e67 === 'run-ai-command') {
      void this['_runAICommand']();
      return;
    }
    if (_0x382e67 === 'toggle-mini-map') {
      ((this['miniMapExpanded'] = !this['miniMapExpanded']), this['_render']());
      return;
    }
    if (_0x382e67 === 'cancel-ai-command') {
      this['aiController']['cancel']();
      return;
    }
    if (_0x382e67 === 'toggle-ai-voice') {
      ['starting', 'listening', 'transcribing', 'stopping']['includes'](this['aiState']['status'])
        ? this['aiController']['stopVoice']()
        : this['aiController']['startVoice']({ language: 'zh-CN' });
      return;
    }
    if (_0x382e67 === 'undo') {
      this['commandHistory']['undo']();
      return;
    }
    if (_0x382e67 === 'redo') {
      this['commandHistory']['redo']();
      return;
    }
    if (_0x382e67 === 'undo-ai-command') {
      this['commandHistory']['getSnapshot']()['nextUndoLabel'] === 'AI scene transaction' &&
        (this['commandHistory']['undo'](),
        this['_setMessage']('已撤销本次 AI 场景修改。'),
        this['_syncAIAssistant']());
      return;
    }
    if (_0x382e67 === 'set-tool') {
      (this['editorStore']['setActiveTool'](_0x415d6f['dataset']['tool']), this['_render']());
      return;
    }
    if (['toggle-object-visibility', 'toggle-object-lock']['includes'](_0x382e67)) {
      const _0x2cb6e5 = _0x415d6f['dataset']['objectId'],
        _0x1afd5a = _0x382e67 === 'toggle-object-visibility' ? 'visible' : 'locked';
      this['_executeMutation']({
        type: 'toggle-object-' + _0x1afd5a,
        label: 'Toggle\x20object\x20' + _0x1afd5a,
        mutate: (_0x525be2) => {
          const _0x59767f = _0x525be2['scenes']['find'](
              (_0x2f6595) => _0x2f6595['id'] === _0x525be2['activeSceneId'],
            ),
            _0x41237d = _0x59767f?.['objects']?.['find']((_0x9db8d) => _0x9db8d['id'] === _0x2cb6e5);
          return (
            _0x41237d &&
              (_0x41237d[_0x1afd5a] =
                _0x1afd5a === 'visible' ? _0x41237d['visible'] === ![] : _0x41237d['locked'] !== !![]),
            _0x525be2
          );
        },
      });
      return;
    }
    if (_0x382e67 === 'edit-object-name') {
      const _0x40d7cb = _0x415d6f['dataset']['objectId'],
        _0x3dfa50 = _0x415d6f['dataset']['objectType'],
        _0x36df7b = this['editorStore']['getSnapshot'](),
        _0x1e11eb = _0x57058e['shiftKey'] || _0x57058e['ctrlKey'] || _0x57058e['metaKey'];
      if (_0x1e11eb) {
        const _0xc97c4e = _0x36df7b['selectedObjectIds']['includes'](_0x40d7cb)
          ? _0x36df7b['selectedObjectIds']['filter']((_0x3c517a) => _0x3c517a !== _0x40d7cb)
          : [..._0x36df7b['selectedObjectIds'], _0x40d7cb];
        if (_0x3dfa50 === 'camera' && _0xc97c4e['includes'](_0x40d7cb)) {
          if (!this['_activateShotForCamera'](_0x40d7cb)) return;
        }
        (this['_setSelectedObjects'](_0xc97c4e), this['_render']());
        return;
      }
      const _0x4d71fb =
        _0x36df7b['selectedObjectIds']['length'] === 0x1 &&
        _0x36df7b['selectedObjectIds'][0x0] === _0x40d7cb &&
        !_0x36df7b['assetLibraryOpen'] &&
        this['rightSidebarMode'] === 'object';
      if (_0x4d71fb) return;
      if (_0x3dfa50 === 'camera' && !this['_activateShotForCamera'](_0x40d7cb)) return;
      (this['_setSelectedObjects']([_0x40d7cb]), this['_render']());
      const _0x344514 = [
        ...(this['root']?.['querySelectorAll']?.('[data-storyboard-3d-outline-name]') || []),
      ]['find']((_0x28250b) => _0x28250b['dataset']['objectId'] === _0x40d7cb);
      (_0x344514?.['focus']?.(), _0x344514?.['select']?.());
      if (_0x3dfa50 === 'camera') this['_focusCameraObject'](_0x40d7cb);
      return;
    }
    if (_0x382e67 === 'select-object') {
      const _0x4f82fa = _0x415d6f['dataset']['objectId'],
        _0x14beac = this['editorStore']['getSnapshot']()['selectedObjectIds'],
        _0x4acb7c = _0x57058e['shiftKey'] || _0x57058e['ctrlKey'] || _0x57058e['metaKey'],
        _0x30e20f = !_0x4f82fa
          ? []
          : _0x4acb7c
            ? _0x14beac['includes'](_0x4f82fa)
              ? _0x14beac['filter']((_0x3c94de) => _0x3c94de !== _0x4f82fa)
              : [..._0x14beac, _0x4f82fa]
            : [_0x4f82fa];
      if (_0x415d6f['dataset']['objectType'] === 'camera' && _0x30e20f['includes'](_0x4f82fa)) {
        if (!this['_activateShotForCamera'](_0x4f82fa)) return;
      }
      (this['_setSelectedObjects'](_0x30e20f), this['_render']());
      _0x415d6f['dataset']['objectType'] === 'camera' &&
        _0x30e20f['length'] === 0x1 &&
        this['_focusCameraObject'](_0x4f82fa);
      return;
    }
    if (_0x382e67 === 'open-explore') {
      this['_clearShotCandidates']();
      const _0x257f6d = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
      ((this['exploreFilter'] = 'all'),
        (this['exploreVariation'] = 0x0),
        (this['shotCandidates'] = generateStoryboard3DShotCandidates(_0x257f6d, {
          count: 0x9,
          variation: 0x0,
        })),
        (this['exploreOpen'] = !![]),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'filter-explore') {
      ((this['exploreFilter'] = ['all', 'close', 'medium', 'wide']['includes'](
        _0x415d6f['dataset']['exploreFilter'],
      )
        ? _0x415d6f['dataset']['exploreFilter']
        : 'all'),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'regenerate-explore') {
      const _0x5a8ad1 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
      (this['_clearShotCandidates'](),
        (this['exploreVariation'] += 0x1),
        (this['shotCandidates'] = generateStoryboard3DShotCandidates(_0x5a8ad1, {
          count: 0x9,
          variation: this['exploreVariation'],
        })),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'close-explore') {
      ((this['exploreOpen'] = ![]), this['_clearShotCandidates'](), this['_render']());
      return;
    }
    if (_0x382e67 === 'preview-candidate') {
      const _0x53130c = this['shotCandidates'][Number(_0x415d6f['dataset']['candidateIndex'])],
        _0xef1316 = this['projectStore']['getSnapshot'](),
        _0x90b45c = getActiveStoryboard3DScene(_0xef1316),
        _0x100d82 = getActiveStoryboard3DShot(_0xef1316);
      if (!_0x53130c || !_0x90b45c || !_0x100d82 || !this['sceneRuntime']) return;
      const _0x4a025e = structuredClone(_0xef1316),
        _0x12a666 = getActiveStoryboard3DScene(_0x4a025e),
        _0x113cbd = getActiveStoryboard3DShot(_0x4a025e);
      ((_0x113cbd['camera'] = structuredClone(_0x53130c['camera'])),
        this['sceneRuntime']['sync']({
          project: _0x4a025e,
          sceneId: _0x12a666['id'],
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        this['sceneRuntime']['renderNow'](),
        this['_setMessage'](
          '正在预览\x20' + _0x53130c['shotSize'] + ' · ' + _0x53130c['shotAngle'] + ' 候选机位。',
        ));
      return;
    }
    if (_0x382e67 === 'replace-with-candidate' || _0x382e67 === 'append-candidate') {
      const _0xe155db = this['shotCandidates'][Number(_0x415d6f['dataset']['candidateIndex'])];
      if (!_0xe155db) return;
      (this['_executeMutation']({
        type: _0x382e67 === 'append-candidate' ? 'append-shot-candidate' : 'replace-shot-candidate',
        label: _0x382e67 === 'append-candidate' ? 'Append shot candidate' : 'Replace shot candidate',
        mutate: (_0xc15fbf) => {
          const _0x2d2540 = _0xc15fbf['scenes']['findIndex'](
            (_0x4a912c) => _0x4a912c['id'] === _0xc15fbf['activeSceneId'],
          );
          if (_0x2d2540 < 0x0) return _0xc15fbf;
          const _0x1e15ce = _0xc15fbf['scenes'][_0x2d2540];
          return (
            (_0xc15fbf['scenes'][_0x2d2540] =
              _0x382e67 === 'append-candidate'
                ? appendStoryboard3DShotCandidate(_0x1e15ce, _0xe155db)
                : replaceStoryboard3DShotWithCandidate(_0x1e15ce, _0x1e15ce['activeShotId'], _0xe155db)),
            _0xc15fbf
          );
        },
      }),
        (this['exploreOpen'] = ![]),
        this['_clearShotCandidates'](),
        this['_render']());
      const _0x3b6ebc = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']()),
        _0x16a8ee = _0x3b6ebc?.['shots']?.['find'](
          (_0xec7bb2) => _0xec7bb2['id'] === _0x3b6ebc['activeShotId'],
        );
      _0x16a8ee &&
        (this['_setSelectedObjects']([_0x16a8ee['cameraId']]),
        this['_render'](),
        this['_focusCameraObject'](_0x16a8ee['cameraId']),
        void this['_generateShotThumbnail'](_0x3b6ebc['id'], _0x16a8ee['id']));
      return;
    }
    if (_0x382e67 === 'add-asset') {
      const _0x1da8d6 = _0x415d6f['dataset']['assetId'],
        _0x4bab19 = this['assetLibrary']['find'](_0x1da8d6);
      if (!_0x4bab19) return;
      const _0x5cece6 =
        this['sceneRuntime']?.['resolveViewportGroundPosition']?.(0x0) ||
        resolveStoryboard3DViewportCenterPosition(this['sceneRuntime']?.['getSceneView']?.());
      if (_0x4bab19['source']?.['kind'] === 'pack' && !this['importedModelScenes']['has'](_0x4bab19['id'])) {
        (this['_setMessage']('正在加载模型包素材“' + _0x4bab19['name'] + '”…'),
          void this['_loadPackAsset'](_0x4bab19['id'])
            ['then'](() => {
              if (this['_closed']) return;
              (this['_addAssetToActiveScene'](_0x4bab19, { position: _0x5cece6 }),
                this['_setMessage']('模型包素材“' + _0x4bab19['name'] + '”已加入场景。'));
            })
            ['catch']((_0x480280) => this['_setMessage'](_0x480280?.['message'] || String(_0x480280))));
        return;
      }
      this['_addAssetToActiveScene'](_0x4bab19, { position: _0x5cece6 });
      return;
    }
    if (_0x382e67 === 'toggle-asset-favorite') {
      const _0x3a6235 = _0x415d6f['dataset']['assetId'];
      if (this['favoriteAssetIds']['has'](_0x3a6235)) this['favoriteAssetIds']['delete'](_0x3a6235);
      else this['favoriteAssetIds']['add'](_0x3a6235);
      this['_render']();
      return;
    }
    if (_0x382e67 === 'load-more-assets') {
      ((this['assetVisibleLimit'] = Math['min'](0x640, this['assetVisibleLimit'] + 0x20)), this['_render']());
      return;
    }
    if (_0x382e67 === 'toggle-character-play') {
      const _0x15030e = _0x415d6f['dataset']['objectId'];
      this['_executeMutation']({
        type: 'toggle-character-playback',
        label: 'Toggle\x20character\x20playback',
        mutate: (_0x2ba6d9) => {
          const _0x5196da = _0x2ba6d9['scenes']['find'](
              (_0x25b126) => _0x25b126['id'] === _0x2ba6d9['activeSceneId'],
            ),
            _0x1d4164 = _0x5196da?.['objects']?.['find']((_0x5ccf27) => _0x5ccf27['id'] === _0x15030e);
          return (
            _0x1d4164?.['type'] === 'character' &&
              Object['assign'](
                _0x1d4164,
                setStoryboard3DCharacterActionPlayback(_0x1d4164, !_0x1d4164['actionPlaying']),
              ),
            _0x2ba6d9
          );
        },
      });
      return;
    }
    if (_0x382e67 === 'extract-character-pose') {
      const _0x5a7fe4 = this['root']['querySelector']('[data-storyboard-3d-pose-image-input]');
      if (!_0x5a7fe4) return;
      ((_0x5a7fe4['dataset']['objectId'] = String(_0x415d6f['dataset']['objectId'] || '')),
        _0x5a7fe4['click']?.());
      return;
    }
    if (_0x382e67 === 'cancel-character-pose') {
      const _0x308a7f = String(_0x415d6f['dataset']['objectId'] || '');
      (this['characterImagePoseController']['clear'](_0x308a7f), this['_setMessage']('已取消人物姿势识别。'));
      return;
    }
    if (_0x382e67 === 'reset-character-pose') {
      const _0x25c2d0 = String(_0x415d6f['dataset']['objectId'] || '');
      (this['characterImagePoseController']['clear'](_0x25c2d0),
        this['_executeMutation']({
          type: 'reset-character-pose',
          label: 'Reset\x20character\x20pose',
          mutate: (_0x249a1a) => {
            for (const _0x57a305 of _0x249a1a['scenes'] || []) {
              const _0x46854b = _0x57a305['objects']?.['find']((_0x8fcb7a) => _0x8fcb7a['id'] === _0x25c2d0);
              if (_0x46854b?.['type'] !== 'character') continue;
              _0x46854b['boneOverrides'] = {};
              break;
            }
            return _0x249a1a;
          },
        }),
        this['_setMessage']('已重置人物骨骼姿势。'));
      return;
    }
    if (_0x382e67 === 'import-model') {
      this['root']['querySelector']('[data-storyboard-3d-model-input]')?.['click']?.();
      return;
    }
    if (_0x382e67 === 'cancel-model-import') {
      (this['modelImportJob']?.['cancel']?.('用户取消了模型导入'),
        (this['modelImportState'] = this['modelImportJob']?.['getSnapshot']?.() || this['modelImportState']),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'add-scene') {
      (this['_executeMutation']({
        type: 'add-scene',
        label: 'Add\x20scene',
        mutate: (_0x396279) => {
          const _0x56daeb = createStoryboard3DScene({
            name: '场景 ' + (_0x396279['scenes']['length'] + 0x1),
            shotName: '镜头 1',
          });
          return (
            _0x396279['scenes']['push'](_0x56daeb),
            (_0x396279['activeSceneId'] = _0x56daeb['id']),
            _0x396279
          );
        },
      }),
        this['_setSelectedObjects']([]),
        this['_render']());
      return;
    }
    if (['duplicate-scene', 'delete-scene', 'move-scene']['includes'](_0x382e67)) {
      const _0x102eb4 = _0x415d6f['dataset']['sceneId'],
        _0x2a03d4 = Number(_0x415d6f['dataset']['direction']) || 0x0,
        _0xe2db23 = this['projectStore']['getSnapshot'](),
        _0x36807c = _0xe2db23['scenes']['findIndex']((_0x48987b) => _0x48987b['id'] === _0x102eb4);
      (this['_executeMutation']({
        type: _0x382e67,
        label: _0x382e67,
        mutate: (_0x1689ab) => {
          if (_0x382e67 === 'duplicate-scene')
            return duplicateStoryboard3DScene(_0x1689ab, _0x102eb4, {
              name:
                (_0x1689ab['scenes']['find']((_0x70ece4) => _0x70ece4['id'] === _0x102eb4)?.['name'] ||
                  '场景') + ' 副本',
              now: Date['now'](),
            });
          if (_0x382e67 === 'delete-scene')
            return deleteStoryboard3DScene(_0x1689ab, _0x102eb4, { now: Date['now']() });
          return reorderStoryboard3DScene(_0x1689ab, _0x102eb4, _0x36807c + _0x2a03d4, {
            now: Date['now'](),
          });
        },
      }),
        this['_setSelectedObjects']([]),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'add-shot') {
      const _0x474337 = this['_readCurrentCameraState']();
      if (!_0x474337) {
        this['_setMessage']('当前摄像机状态不可用。');
        return;
      }
      const _0x383218 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']()),
        _0x32d5d1 = guardStoryboard3DBackgroundCameraChange(_0x383218?.['background'], _0x474337);
      if (!_0x32d5d1['allowed']) {
        this['_setMessage'](_0x32d5d1['reason']);
        return;
      }
      this['_executeMutation']({
        type: 'add-shot',
        label: 'Add shot from current view',
        mutate: (_0x6257f4) => {
          const _0x57ac76 = _0x6257f4['scenes']['findIndex'](
            (_0x290f3a) => _0x290f3a['id'] === _0x6257f4['activeSceneId'],
          );
          return (
            _0x57ac76 >= 0x0 &&
              (_0x6257f4['scenes'][_0x57ac76] = appendShotFromCurrentView({
                scene: _0x6257f4['scenes'][_0x57ac76],
                camera: _0x474337,
              })),
            _0x6257f4
          );
        },
      });
      const _0x34839a = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']()),
        _0x3726cd = _0x34839a?.['shots']?.['find'](
          (_0x1acd6e) => _0x1acd6e['id'] === _0x34839a['activeShotId'],
        );
      _0x3726cd &&
        (this['_setSelectedObjects']([_0x3726cd['cameraId']]),
        this['_render'](),
        this['_focusCameraObject'](_0x3726cd['cameraId']),
        void this['_generateShotThumbnail'](_0x34839a['id'], _0x3726cd['id']));
      return;
    }
    if (_0x382e67 === 'replace-shot-camera') {
      const _0x5325e7 = this['_readCurrentCameraState'](),
        _0x2e712d = this['projectStore']['getSnapshot'](),
        _0x1ba71b = getActiveStoryboard3DScene(_0x2e712d),
        _0x4dacf6 = _0x415d6f['dataset']['shotId'];
      if (!_0x5325e7 || !_0x1ba71b) return;
      const _0x63973e = guardStoryboard3DBackgroundCameraChange(_0x1ba71b['background'], _0x5325e7);
      if (!_0x63973e['allowed']) {
        this['_setMessage'](_0x63973e['reason']);
        return;
      }
      (this['_executeMutation']({
        type: 'replace-shot-camera',
        label: 'Replace shot camera',
        mutate: (_0x451242) =>
          replaceStoryboard3DShotFromCurrentView(_0x451242, {
            sceneId: _0x1ba71b['id'],
            shotId: _0x4dacf6,
            camera: _0x5325e7,
            now: Date['now'](),
          }),
      }),
        void this['_generateShotThumbnail'](_0x1ba71b['id'], _0x4dacf6));
      return;
    }
    if (_0x382e67 === 'group-selected') {
      const _0x161f01 = this['editorStore']['getSnapshot']()['selectedObjectIds'];
      if (_0x161f01['length'] === 0x0) {
        this['_setMessage']('请先选择要分组的对象。');
        return;
      }
      let _0x3196de = '';
      this['_executeMutation']({
        type: 'group-objects',
        label: 'Group selected objects',
        mutate: (_0x1d2a42) => {
          const _0xdc4e77 = _0x1d2a42['scenes']['findIndex'](
            (_0x2a04dd) => _0x2a04dd['id'] === _0x1d2a42['activeSceneId'],
          );
          if (_0xdc4e77 < 0x0) return _0x1d2a42;
          const _0x5c5f75 = groupStoryboard3DSceneObjects(_0x1d2a42['scenes'][_0xdc4e77], _0x161f01, {
            name: '新分组',
            idFactory: createLocalId,
          });
          return (
            (_0x3196de = _0x5c5f75['objects']['at'](-0x1)?.['id'] || ''),
            (_0x1d2a42['scenes'][_0xdc4e77] = _0x5c5f75),
            _0x1d2a42
          );
        },
      });
      if (_0x3196de) this['_setSelectedObjects']([_0x3196de]);
      this['_render']();
      return;
    }
    if (_0x382e67 === 'ungroup-object') {
      const _0x5995f5 = _0x415d6f['dataset']['objectId'];
      (this['_executeMutation']({
        type: 'ungroup-objects',
        label: 'Ungroup\x20objects',
        mutate: (_0x41fb03) => {
          const _0x1c9cb2 = _0x41fb03['scenes']['findIndex'](
            (_0x2aceff) => _0x2aceff['id'] === _0x41fb03['activeSceneId'],
          );
          return (
            _0x1c9cb2 >= 0x0 &&
              (_0x41fb03['scenes'][_0x1c9cb2] = ungroupStoryboard3DSceneGroup(
                _0x41fb03['scenes'][_0x1c9cb2],
                _0x5995f5,
              )),
            _0x41fb03
          );
        },
      }),
        this['_setSelectedObjects']([]),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'duplicate-object') {
      const _0xeff2e3 = _0x415d6f['dataset']['objectId'];
      let _0x3a9df8 = '';
      this['_executeMutation']({
        type: 'duplicate-object',
        label: 'Duplicate\x20object',
        mutate: (_0x289ede) => {
          const _0x2c5230 = _0x289ede['scenes']['find'](
              (_0x403498) => _0x403498['id'] === _0x289ede['activeSceneId'],
            ),
            _0x2b135e = _0x2c5230?.['objects']?.['find']((_0x39298a) => _0x39298a['id'] === _0xeff2e3);
          if (!_0x2b135e) return _0x289ede;
          if (_0x2b135e['type'] === 'camera') {
            const _0x333658 = _0x2c5230['shots']?.['find'](
                (_0x3e4d01) => _0x3e4d01['cameraId'] === _0x2b135e['id'],
              ),
              _0x24624c = _0x289ede['scenes']['findIndex'](
                (_0x591667) => _0x591667['id'] === _0x2c5230['id'],
              );
            if (!_0x333658 || _0x24624c < 0x0) return _0x289ede;
            const _0x1fecf0 = duplicateStoryboard3DShot(_0x2c5230, _0x333658['id'], {
              idFactory: createLocalId,
            });
            return (
              (_0x289ede['scenes'][_0x24624c] = _0x1fecf0),
              (_0x3a9df8 =
                _0x1fecf0['shots']['find']((_0x2d8f5d) => _0x2d8f5d['id'] === _0x1fecf0['activeShotId'])?.[
                  'cameraId'
                ] || ''),
              _0x289ede
            );
          }
          const _0x47d897 = structuredClone(_0x2b135e);
          return (
            (_0x47d897['id'] = createLocalId(_0x2b135e['type'] || 'object')),
            (_0x47d897['name'] = _0x2b135e['name'] + ' 副本'),
            (_0x47d897['transform']['position'][0x0] += 0.5),
            (_0x47d897['transform']['position'][0x2] += 0.5),
            _0x2c5230['objects']['push'](_0x47d897),
            (_0x3a9df8 = _0x47d897['id']),
            _0x289ede
          );
        },
      });
      if (_0x3a9df8) {
        (this['_setSelectedObjects']([_0x3a9df8]), this['_render']());
        const _0x160484 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']())?.['objects']?.[
          'find'
        ]((_0x4cb2ac) => _0x4cb2ac['id'] === _0x3a9df8);
        if (_0x160484?.['type'] === 'camera') this['_focusCameraObject'](_0x3a9df8);
      }
      return;
    }
    if (_0x382e67 === 'delete-object') {
      this['_deleteObjects'](_0x415d6f['dataset']['objectId']);
      return;
    }
    if (_0x382e67 === 'clear-background') {
      const _0x2fb7e5 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']()),
        _0x1beb51 = _0x2fb7e5?.['background']?.['binaryAssetId'];
      (this['_getBackgroundImageController'](_0x2fb7e5?.['id'])?.['clear']?.(),
        this['_executeMutation']({
          type: 'clear-background',
          label: 'Clear background',
          mutate: (_0x494499) => {
            const _0x4fe35a = _0x494499['scenes']['find'](
              (_0x2cb783) => _0x2cb783['id'] === _0x494499['activeSceneId'],
            );
            if (_0x4fe35a) delete _0x4fe35a['background'];
            return _0x494499;
          },
        }));
      if (_0x1beb51) void this['binaryAssetRepository']['remove'](_0x1beb51)['catch'](() => {});
      return;
    }
    if (_0x382e67 === 'upload-background') {
      this['root']['querySelector']('[data-storyboard-3d-background-input]')?.['click']?.();
      return;
    }
    if (_0x382e67 === 'analyze-background') {
      void this['_reanalyzeActiveBackground']();
      return;
    }
    if (_0x382e67 === 'add-light') {
      let _0x1c1609 = '';
      this['_executeMutation']({
        type: 'add-light',
        label: 'Add light',
        mutate: (_0x4b0902) => {
          const _0x2d995c = _0x4b0902['scenes']['find'](
            (_0x1ac7e2) => _0x1ac7e2['id'] === _0x4b0902['activeSceneId'],
          );
          if (!_0x2d995c) return _0x4b0902;
          return (
            (_0x1c1609 = createLocalId('light')),
            _0x2d995c['objects']['push']({
              id: _0x1c1609,
              type: 'light',
              name:
                '灯光 ' +
                (_0x2d995c['objects']['filter']((_0x4bec24) => _0x4bec24['type'] === 'light')['length'] +
                  0x1),
              lightType: 'directional',
              color: '#ffffff',
              intensity: 0x1,
              visible: !![],
              locked: ![],
              transform: { position: [0x3, 0x5, 0x3], rotation: [0x0, 0x0, 0x0], scale: [0x1, 0x1, 0x1] },
              castShadow: !![],
            }),
            _0x4b0902
          );
        },
      });
      _0x1c1609 && (this['_setSelectedObjects']([_0x1c1609]), this['_render']());
      return;
    }
    if (['duplicate-shot', 'delete-shot', 'move-shot']['includes'](_0x382e67)) {
      const _0x21a362 = _0x415d6f['dataset']['shotId'],
        _0x202cc3 = Number(_0x415d6f['dataset']['direction']) || 0x0;
      this['_executeMutation']({
        type: _0x382e67,
        label: _0x382e67,
        mutate: (_0x6872bf) => {
          const _0x1f617f = _0x6872bf['scenes']['findIndex'](
            (_0x144bce) => _0x144bce['id'] === _0x6872bf['activeSceneId'],
          );
          if (_0x1f617f < 0x0) return _0x6872bf;
          const _0x5b4785 = _0x6872bf['scenes'][_0x1f617f];
          if (_0x382e67 === 'duplicate-shot')
            _0x6872bf['scenes'][_0x1f617f] = duplicateStoryboard3DShot(_0x5b4785, _0x21a362);
          else {
            if (_0x382e67 === 'delete-shot')
              _0x6872bf['scenes'][_0x1f617f] = deleteStoryboard3DShot(_0x5b4785, _0x21a362);
            else {
              const _0x206957 = _0x5b4785['shots']['findIndex']((_0x1c6f52) => _0x1c6f52['id'] === _0x21a362);
              _0x6872bf['scenes'][_0x1f617f] = reorderStoryboard3DShot(
                _0x5b4785,
                _0x21a362,
                Math['max'](0x0, Math['min'](_0x5b4785['shots']['length'] - 0x1, _0x206957 + _0x202cc3)),
              );
            }
          }
          return _0x6872bf;
        },
      });
      return;
    }
    if (_0x382e67 === 'close') {
      this['close']();
      return;
    }
    if (_0x382e67 === 'select-scene') {
      (this['projectStore']['selectScene'](_0x415d6f['dataset']['sceneId']),
        (this['viewportFocalLength'] =
          Number(
            getActiveStoryboard3DShot(this['projectStore']['getSnapshot']())?.['camera']?.['focalLength'],
          ) || 0x23),
        this['_render']());
      return;
    }
    if (_0x382e67 === 'select-shot') {
      const _0x5acdf0 = this['projectStore']['getSnapshot'](),
        _0x1b8a44 = getActiveStoryboard3DScene(_0x5acdf0),
        _0x47eefc = _0x1b8a44?.['shots']?.['find'](
          (_0x59bb37) => _0x59bb37['id'] === _0x415d6f['dataset']['shotId'],
        ),
        _0x488240 = guardStoryboard3DBackgroundCameraChange(_0x1b8a44?.['background'], _0x47eefc?.['camera']);
      if (!_0x488240['allowed']) {
        this['_setMessage'](_0x488240['reason']);
        return;
      }
      (this['projectStore']['selectShot'](_0x415d6f['dataset']['shotId']),
        (this['viewportFocalLength'] = Number(_0x47eefc?.['camera']?.['focalLength']) || 0x23),
        this['_render']());
      return;
    }
    _0x382e67 === 'export-storyboard' && this['exportStoryboard']();
  }
  ['_handleInput'](_0x3768e7) {
    if (_0x3768e7['target']?.['matches']?.('[data-storyboard-3d-focal-slider]')) {
      this['_previewFocalLength'](_0x3768e7['target']['value']);
      return;
    }
    this['shotTimelineController']?.['handleInput']?.(_0x3768e7);
  }
  async ['_handleChange'](_0x532a39) {
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-focal-slider]')) {
      this['_commitFocalLength'](_0x532a39['target']['value']);
      return;
    }
    if (this['shotTimelineController']?.['handleChange']?.(_0x532a39)) return;
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-pose-image-input]')) {
      const _0x3fda8c = _0x532a39['target']['files']?.[0x0],
        _0x160946 = String(_0x532a39['target']['dataset']['objectId'] || '');
      ((_0x532a39['target']['value'] = ''), delete _0x532a39['target']['dataset']['objectId']);
      if (!_0x3fda8c || !_0x160946) return;
      try {
        await this['characterImagePoseController']['extract']({ objectId: _0x160946, file: _0x3fda8c });
      } catch (_0x48a50c) {
        _0x48a50c?.['name'] !== 'AbortError' &&
          _0x48a50c?.['code'] !== 'ABORT_ERR' &&
          this['_setMessage'](_0x48a50c?.['message'] || String(_0x48a50c));
      }
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-navigation-preset]')) {
      this['_saveNavigationSettings'](
        createStoryboard3DNavigationPresetSettings(_0x532a39['target']['value']),
      );
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-navigation-setting]')) {
      const _0x5b122d = _0x532a39['target']['getAttribute']('data-storyboard-3d-navigation-setting'),
        _0x4e2350 =
          _0x532a39['target']['type'] === 'checkbox'
            ? _0x532a39['target']['checked']
            : Number(_0x532a39['target']['value']);
      this['_saveNavigationSettings']({ ...this['navigationSettings'], [_0x5b122d]: _0x4e2350 });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-bone-select]')) {
      (this['characterBoneSelection']['set'](
        _0x532a39['target']['dataset']['objectId'],
        String(_0x532a39['target']['value'] || 'Head'),
      ),
        this['_render']());
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-bone-axis]')) {
      const _0x34774a = _0x532a39['target']['dataset']['objectId'],
        _0xacb3c1 = _0x532a39['target']['dataset']['boneName'],
        _0x51e262 = _0x532a39['target']['getAttribute']('data-storyboard-3d-bone-axis'),
        _0x2eb045 = Number(_0x532a39['target']['value']) || 0x0;
      this['_executeMutation']({
        type: 'edit-character-bone',
        label: 'Edit character bone',
        mutate: (_0x5b685b) => {
          const _0x2ce2a6 = _0x5b685b['scenes']['find'](
              (_0x168421) => _0x168421['id'] === _0x5b685b['activeSceneId'],
            ),
            _0x78cf90 = _0x2ce2a6?.['objects']?.['find']((_0x1b6826) => _0x1b6826['id'] === _0x34774a);
          if (_0x78cf90?.['type'] !== 'character' || !['x', 'y', 'z']['includes'](_0x51e262))
            return _0x5b685b;
          const _0x1d1c35 = quaternionToStoryboard3DEuler(_0x78cf90['boneOverrides']?.[_0xacb3c1]);
          return (
            (_0x1d1c35[_0x51e262] = (_0x2eb045 * Math['PI']) / 0xb4),
            (_0x78cf90['boneOverrides'] = setStoryboard3DBoneOverride(
              _0x78cf90['boneOverrides'],
              _0xacb3c1,
              _0x1d1c35,
            )),
            _0x5b685b
          );
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-character-time]')) {
      const _0xbe99e6 = _0x532a39['target']['dataset']['objectId'],
        _0x5c34dc = Number(_0x532a39['target']['value']) || 0x0;
      this['_executeMutation']({
        type: 'seek-character-action',
        label: 'Seek character action',
        mutate: (_0xdc8b07) => {
          const _0x4bba2f = _0xdc8b07['scenes']['find'](
              (_0x5928de) => _0x5928de['id'] === _0xdc8b07['activeSceneId'],
            ),
            _0x4206a9 = _0x4bba2f?.['objects']?.['find']((_0x473123) => _0x473123['id'] === _0xbe99e6);
          if (_0x4206a9?.['type'] === 'character')
            Object['assign'](_0x4206a9, seekStoryboard3DCharacterAction(_0x4206a9, _0x5c34dc));
          return _0xdc8b07;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-background-input]')) {
      const _0x399420 = _0x532a39['target']['files']?.[0x0];
      _0x532a39['target']['value'] = '';
      if (!_0x399420) return;
      try {
        const _0x322f27 = getActiveStoryboard3DScene(this['projectStore']['getSnapshot']());
        if (!_0x322f27) return;
        const _0x51c93d = await preflightStoryboard3DImageFile(_0x399420, {
          renderer: this['sceneRuntime']?.['bridge']?.['renderer'],
        });
        if (!_0x51c93d['ok'])
          throw new Error(_0x51c93d['errors']['map']((_0x3ee969) => _0x3ee969['message'])['join']('\x20'));
        let _0x55f703 = null,
          _0x399651 = null;
        try {
          _0x55f703 = await analyzeStoryboard3DBackgroundImage(_0x399420, {
            documentObject: this['document'],
            imageBitmapFactory:
              typeof this['window']?.['createImageBitmap'] === 'function'
                ? this['window']['createImageBitmap']['bind'](this['window'])
                : undefined,
          });
        } catch (_0x28d42e) {
          _0x399651 = _0x28d42e;
        }
        const _0x34cd49 = _0x322f27['background']?.['binaryAssetId'] || createLocalId('background');
        await this['binaryAssetRepository']['put']({
          assetId: _0x34cd49,
          kind: 'background',
          descriptor: { sceneId: _0x322f27['id'], fileName: _0x399420['name'] },
          primaryFile: _0x399420,
          relatedFiles: [],
        });
        const _0x4679ba = this['_getBackgroundImageController'](_0x322f27?.['id'])['load'](_0x399420),
          _0x58660c = {
            imageUrl: _0x4679ba['imageUrl'],
            binaryAssetId: _0x34cd49,
            ...(_0x55f703 || { calibrationMethod: 'unconfigured', calibrationConfidence: 0x0 }),
          };
        _0x55f703
          ? (this['_applyDetectedBackgroundCalibration'](_0x58660c, {
              type: 'upload-and-calibrate-background',
              label: 'Upload and calibrate background',
            }),
            this['_setMessage'](
              _0x4679ba['fileName'] +
                ' 已自动匹配地面透视并锁定，匹配度 ' +
                Math['round'](_0x55f703['calibrationConfidence'] * 0x64) +
                '%。',
            ))
          : (this['_executeMutation']({
              type: 'upload-background',
              label: 'Upload background',
              mutate: (_0x2c3ee3) => {
                const _0x1a89c8 = _0x2c3ee3['scenes']['find'](
                  (_0x1752bb) => _0x1752bb['id'] === _0x2c3ee3['activeSceneId'],
                );
                return (
                  _0x1a89c8 &&
                    (_0x1a89c8['background'] = updateStoryboard3DBackgroundCalibration(
                      _0x1a89c8['background'],
                      _0x58660c,
                    )),
                  _0x2c3ee3
                );
              },
            }),
            this['_setMessage'](
              _0x4679ba['fileName'] +
                ' 已设置为背景，但自动匹配失败：' +
                (_0x399651?.['message'] || '请手动调整参数') +
                '。',
            ));
      } catch (_0x4619e3) {
        this['_setMessage'](_0x4619e3?.['message'] || String(_0x4619e3));
      }
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-scene-name]')) {
      const _0x10e6a4 = _0x532a39['target']['dataset']['sceneId'],
        _0x2f3e88 = String(_0x532a39['target']['value'] || '')['trim']();
      this['_executeMutation']({
        type: 'rename-scene',
        label: 'Rename\x20scene',
        mutate: (_0x4b0a91) =>
          renameStoryboard3DScene(_0x4b0a91, _0x10e6a4, _0x2f3e88, { now: Date['now']() }),
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-viewport-setting]')) {
      const _0x378bf6 = _0x532a39['target']['getAttribute']('data-storyboard-3d-viewport-setting'),
        _0x23c905 =
          _0x532a39['target']['type'] === 'checkbox'
            ? _0x532a39['target']['checked']
            : _0x532a39['target']['value'],
        _0x4eb735 =
          _0x378bf6 === 'rotationSnapDegrees'
            ? { rotationSnap: (Math['max'](0x1, Number(_0x23c905) || 0xf) * Math['PI']) / 0xb4 }
            : {
                [_0x378bf6]: ['translationSnap', 'scaleSnap']['includes'](_0x378bf6)
                  ? Number(_0x23c905)
                  : _0x23c905,
              },
        _0x402e80 =
          this['viewportControls']?.['updateSettings']?.(_0x4eb735) ||
          normalizeStoryboard3DViewportSettings({ ...this['viewportSettings'], ..._0x4eb735 });
      (this['_saveTransformSettings'](_0x402e80),
        this['sceneRuntime']?.['setViewportUIPatch']?.(
          this['viewportControls']?.['getDirectorUIPatch']?.() || {},
        ));
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-outline-query]')) {
      ((this['outlineQuery'] = String(_0x532a39['target']['value'] || '')['trim']()),
        queueMicrotask(() => this['_render']()));
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-outline-type]')) {
      ((this['outlineType'] = String(_0x532a39['target']['value'] || 'all')),
        queueMicrotask(() => this['_render']()));
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-asset-query]')) {
      ((this['assetQuery'] = String(_0x532a39['target']['value'] || '')['trim']()),
        (this['assetVisibleLimit'] = 0x20),
        queueMicrotask(() => this['_render']()));
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-camera-field]')) {
      const _0x5c77f0 = _0x532a39['target']['dataset']['objectId'],
        _0x49f558 = _0x532a39['target']['getAttribute']('data-storyboard-3d-camera-field'),
        _0x4ed652 = _0x532a39['target']['value'];
      this['_executeMutation']({
        type: 'update-camera-' + _0x49f558,
        label: 'Update camera ' + _0x49f558,
        mutate: (_0x2012ed) => {
          const _0x53d7b9 = _0x2012ed['scenes']['find'](
              (_0x266ed0) => _0x266ed0['id'] === _0x2012ed['activeSceneId'],
            ),
            _0x307bc2 = _0x53d7b9?.['objects']?.['find']((_0x4abb11) => _0x4abb11['id'] === _0x5c77f0);
          if (_0x307bc2?.['type'] !== 'camera') return _0x2012ed;
          if (_0x49f558 === 'aspectRatio') {
            const _0x50303c = String(_0x4ed652 || '')['trim']();
            if (/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/['test'](_0x50303c)) _0x307bc2['aspectRatio'] = _0x50303c;
          } else {
            const _0x3f596a = Number(_0x4ed652);
            if (!Number['isFinite'](_0x3f596a)) return _0x2012ed;
            if (_0x49f558 === 'focalLength')
              _0x307bc2['focalLength'] = Math['max'](0x1, Math['min'](0xc8, _0x3f596a));
            if (_0x49f558 === 'near') _0x307bc2['near'] = Math['max'](0.001, _0x3f596a);
            if (_0x49f558 === 'far') _0x307bc2['far'] = Math['max'](_0x307bc2['near'] + 0.001, _0x3f596a);
          }
          return (syncStoryboard3DShotFromCameraObject(_0x53d7b9, _0x5c77f0), _0x2012ed);
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-light-field]')) {
      const _0xef1e57 = _0x532a39['target']['dataset']['objectId'],
        _0x5d9c79 = _0x532a39['target']['getAttribute']('data-storyboard-3d-light-field'),
        _0x98d35e =
          _0x532a39['target']['type'] === 'checkbox'
            ? _0x532a39['target']['checked']
            : ['intensity', 'distance', 'decay', 'angleDegrees']['includes'](_0x5d9c79)
              ? Number(_0x532a39['target']['value'])
              : String(_0x532a39['target']['value'] || '');
      this['_executeMutation']({
        type: 'update-light-' + _0x5d9c79,
        label: 'Update light ' + _0x5d9c79,
        mutate: (_0x1810c4) => {
          const _0xf43147 = _0x1810c4['scenes']['find'](
              (_0x48f5b1) => _0x48f5b1['id'] === _0x1810c4['activeSceneId'],
            ),
            _0x26a95b = _0xf43147?.['objects']?.['find']((_0x2f3a01) => _0x2f3a01['id'] === _0xef1e57);
          if (_0x26a95b?.['type'] !== 'light') return _0x1810c4;
          if (_0x5d9c79 === 'intensity')
            _0x26a95b['intensity'] = Math['max'](0x0, Number['isFinite'](_0x98d35e) ? _0x98d35e : 0x1);
          if (_0x5d9c79 === 'distance')
            _0x26a95b['distance'] = Math['max'](0x0, Number['isFinite'](_0x98d35e) ? _0x98d35e : 0x0);
          if (_0x5d9c79 === 'decay')
            _0x26a95b['decay'] = Math['max'](0x0, Number['isFinite'](_0x98d35e) ? _0x98d35e : 0x2);
          _0x5d9c79 === 'angleDegrees' &&
            (_0x26a95b['angle'] =
              (Math['max'](0x1, Math['min'](0xb3, Number['isFinite'](_0x98d35e) ? _0x98d35e : 0x1e)) *
                Math['PI']) /
              0xb4);
          if (_0x5d9c79 === 'castShadow') _0x26a95b['castShadow'] = _0x98d35e === !![];
          if (_0x5d9c79 === 'color' && /^#[0-9a-f]{6}$/i['test'](_0x98d35e)) _0x26a95b['color'] = _0x98d35e;
          return (
            _0x5d9c79 === 'lightType' &&
              ['ambient', 'directional', 'point', 'spot']['includes'](_0x98d35e) &&
              (_0x26a95b['lightType'] = _0x98d35e),
            _0x1810c4
          );
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-prop-field]')) {
      const _0x386246 = _0x532a39['target']['dataset']['objectId'],
        _0x164b13 = _0x532a39['target']['getAttribute']('data-storyboard-3d-prop-field'),
        _0x2f90f8 =
          _0x532a39['target']['type'] === 'checkbox'
            ? _0x532a39['target']['checked']
            : String(_0x532a39['target']['value'] || '');
      this['_executeMutation']({
        type: 'update-prop-' + _0x164b13,
        label: 'Update prop ' + _0x164b13,
        mutate: (_0x4c7dd8) => {
          const _0x2f6d54 = _0x4c7dd8['scenes']['find'](
              (_0x4bf671) => _0x4bf671['id'] === _0x4c7dd8['activeSceneId'],
            ),
            _0x88d651 = _0x2f6d54?.['objects']?.['find']((_0x4f26a3) => _0x4f26a3['id'] === _0x386246);
          if (_0x88d651?.['type'] !== 'prop') return _0x4c7dd8;
          if (_0x164b13 === 'tint' && /^#[0-9a-f]{6}$/i['test'](_0x2f90f8)) _0x88d651['tint'] = _0x2f90f8;
          if (['castShadow', 'receiveShadow']['includes'](_0x164b13))
            _0x88d651[_0x164b13] = _0x2f90f8 === !![];
          return _0x4c7dd8;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-shot-field]')) {
      const _0x4a221f = _0x532a39['target']['getAttribute']('data-storyboard-3d-shot-field'),
        _0x370852 = _0x532a39['target']['dataset']['shotId'],
        _0x385c70 = String(_0x532a39['target']['value'] || '')['trim']();
      this['_executeMutation']({
        type: 'update-shot-' + _0x4a221f,
        label: 'Update shot ' + _0x4a221f,
        mutate: (_0xd8cbb0) => {
          const _0x59cd0a = _0xd8cbb0['scenes']['findIndex'](
            (_0x5353be) => _0x5353be['id'] === _0xd8cbb0['activeSceneId'],
          );
          if (_0x59cd0a < 0x0) return _0xd8cbb0;
          const _0x4e74b9 = _0xd8cbb0['scenes'][_0x59cd0a];
          return (
            (_0xd8cbb0['scenes'][_0x59cd0a] =
              _0x4a221f === 'name'
                ? renameStoryboard3DShot(_0x4e74b9, _0x370852, _0x385c70)
                : describeStoryboard3DShot(_0x4e74b9, _0x370852, _0x385c70)),
            _0xd8cbb0
          );
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-ai-instruction]')) {
      this['aiController']['setInstruction'](_0x532a39['target']['value']);
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-scene-field]')) {
      const _0x132fbd = _0x532a39['target']['getAttribute']('data-storyboard-3d-scene-field'),
        _0x1278d9 =
          _0x532a39['target']['type'] === 'checkbox'
            ? _0x532a39['target']['checked']
            : String(_0x532a39['target']['value'] || '');
      this['_executeMutation']({
        type: 'update-scene-' + _0x132fbd,
        label: 'Update scene ' + _0x132fbd,
        mutate: (_0x5061e3) => {
          const _0x4afbd6 = _0x5061e3['scenes']['find'](
            (_0x26f4a3) => _0x26f4a3['id'] === _0x5061e3['activeSceneId'],
          );
          if (!_0x4afbd6) return _0x5061e3;
          ['showGrid', 'showOutline', 'enableShadows']['includes'](_0x132fbd) &&
            (_0x4afbd6['environment'][_0x132fbd] = _0x1278d9 === !![]);
          if (['empty', 'outdoor', 'indoor', 'studio']['includes'](_0x1278d9))
            return applyStoryboard3DEnvironmentPreset(_0x5061e3, _0x4afbd6['id'], _0x1278d9, {
              overrides: {
                showGrid: _0x4afbd6['environment']['showGrid'],
                showOutline: _0x4afbd6['environment']['showOutline'],
                enableShadows: _0x4afbd6['environment']['enableShadows'],
              },
              now: Date['now'](),
            });
          return _0x5061e3;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-background-field]')) {
      const _0x46ad53 = _0x532a39['target']['getAttribute']('data-storyboard-3d-background-field'),
        _0x383862 =
          _0x46ad53 === 'imageUrl'
            ? String(_0x532a39['target']['value'] || '')['trim']()
            : Number(_0x532a39['target']['value']);
      this['_executeMutation']({
        type: 'update-background-' + _0x46ad53,
        label: 'Update background ' + _0x46ad53,
        mutate: (_0x5b455f) => {
          const _0x254701 = _0x5b455f['scenes']['find'](
            (_0x2505a3) => _0x2505a3['id'] === _0x5b455f['activeSceneId'],
          );
          if (!_0x254701) return _0x5b455f;
          const _0x123487 = _0x254701['shots']?.['find'](
              (_0xc0f98f) => _0xc0f98f['id'] === _0x254701['activeShotId'],
            ),
            _0x472cab = normalizeStoryboard3DBackgroundCalibration(_0x254701['background']),
            _0xe1e79e =
              _0x46ad53 === 'vanishingPointX'
                ? { vanishingPoint: [_0x383862, _0x472cab['vanishingPoint'][0x1]] }
                : _0x46ad53 === 'vanishingPointY'
                  ? { vanishingPoint: [_0x472cab['vanishingPoint'][0x0], _0x383862] }
                  : _0x46ad53 === 'imageOffsetX'
                    ? { imageOffset: [_0x383862, _0x472cab['imageOffset'][0x1]] }
                    : _0x46ad53 === 'imageOffsetY'
                      ? { imageOffset: [_0x472cab['imageOffset'][0x0], _0x383862] }
                      : { [_0x46ad53]: _0x383862 },
            _0x189557 = new Set([
              'horizontalFov',
              'verticalFov',
              'horizonY',
              'horizonSlope',
              'vanishingPointX',
              'cameraHeight',
            ]),
            _0x7a3f75 = updateStoryboard3DBackgroundCalibration(_0x254701['background'], {
              ..._0xe1e79e,
              ...(_0x189557['has'](_0x46ad53)
                ? { calibrationMethod: 'manual', calibrationConfidence: 0x1 }
                : {}),
            });
          if (_0x7a3f75['imageUrl'] && _0x7a3f75['lockedCamera'] && _0x123487) {
            const _0x1d82c0 = deriveStoryboard3DBackgroundCamera(_0x7a3f75, _0x123487['camera']);
            (setStoryboard3DShotInitialCamera(_0x254701, _0x123487, _0x1d82c0),
              (_0x254701['background'] = setStoryboard3DBackgroundCameraLock(
                _0x7a3f75,
                !![],
                _0x123487['camera'],
              )));
          } else {
            if (_0x7a3f75['imageUrl']) _0x254701['background'] = _0x7a3f75;
            else delete _0x254701['background'];
          }
          return _0x5b455f;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-background-lock]')) {
      const _0x19e77e = _0x532a39['target']['checked'] === !![];
      this['_executeMutation']({
        type: 'set-background-camera-lock',
        label: _0x19e77e ? 'Lock background camera' : 'Unlock background camera',
        mutate: (_0x25f71c) => {
          const _0x45cc3c = _0x25f71c['scenes']['find'](
              (_0x23bfbd) => _0x23bfbd['id'] === _0x25f71c['activeSceneId'],
            ),
            _0x7d037c = _0x45cc3c?.['shots']?.['find'](
              (_0x1576b3) => _0x1576b3['id'] === _0x45cc3c['activeShotId'],
            );
          if (_0x45cc3c?.['background'] && _0x7d037c?.['camera']) {
            const _0x469154 = _0x19e77e
              ? deriveStoryboard3DBackgroundCamera(_0x45cc3c['background'], _0x7d037c['camera'])
              : _0x7d037c['camera'];
            if (_0x19e77e) setStoryboard3DShotInitialCamera(_0x45cc3c, _0x7d037c, _0x469154);
            _0x45cc3c['background'] = setStoryboard3DBackgroundCameraLock(
              _0x45cc3c['background'],
              _0x19e77e,
              _0x469154,
            );
          }
          return _0x25f71c;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-character-field]')) {
      const _0x2f0591 = _0x532a39['target']['dataset']['objectId'],
        _0x47c1af = _0x532a39['target']['getAttribute']('data-storyboard-3d-character-field'),
        _0x4d2937 = String(_0x532a39['target']['value'] || '');
      this['_executeMutation']({
        type: 'update-character',
        label: 'Update character',
        mutate: (_0x5a32c8) => {
          const _0x138282 = _0x5a32c8['scenes']['find'](
              (_0x29837d) => _0x29837d['id'] === _0x5a32c8['activeSceneId'],
            ),
            _0x27afdf = _0x138282?.['objects']?.['find']((_0x74986a) => _0x74986a['id'] === _0x2f0591);
          return (
            _0x27afdf?.['type'] === 'character' &&
              ['bodyPresetId', 'actionId', 'leftHandPoseId', 'rightHandPoseId', 'hairId', 'characterStyle'][
                'includes'
              ](_0x47c1af) &&
              ((_0x27afdf[_0x47c1af] = _0x4d2937),
              _0x47c1af === 'actionId' &&
                ((_0x27afdf['actionTime'] = 0x0), (_0x27afdf['actionPlaying'] = ![]))),
            _0x5a32c8
          );
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-character-attachments]')) {
      const _0x2c4be1 = _0x532a39['target']['dataset']['objectId'],
        _0x9fcdcd = [
          ...new Set(
            String(_0x532a39['target']['value'] || '')
              ['split'](',')
              ['map']((_0x39be0e) => _0x39be0e['trim']())
              ['filter'](Boolean),
          ),
        ]['slice'](0x0, 0x20);
      this['_executeMutation']({
        type: 'update-character-attachments',
        label: 'Update\x20character\x20attachments',
        mutate: (_0x1c0107) => {
          const _0x4b2a70 = _0x1c0107['scenes']['find'](
              (_0x3bebfe) => _0x3bebfe['id'] === _0x1c0107['activeSceneId'],
            ),
            _0x2e6653 = _0x4b2a70?.['objects']?.['find']((_0x4e3eea) => _0x4e3eea['id'] === _0x2c4be1);
          if (_0x2e6653?.['type'] === 'character') _0x2e6653['attachmentIds'] = _0x9fcdcd;
          return _0x1c0107;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-transform-input]')) {
      const _0xe9204d = _0x532a39['target']['dataset']['objectId'],
        _0x497617 = _0x532a39['target']['dataset']['transformField'],
        _0xad482f = Math['max'](
          0x0,
          Math['min'](0x2, Number(_0x532a39['target']['dataset']['transformAxis']) || 0x0),
        ),
        _0x20a2be = this['projectStore']['getSnapshot'](),
        _0x385354 = getActiveStoryboard3DScene(_0x20a2be),
        _0x51b749 = _0x385354?.['objects']?.['find']((_0x436e0f) => _0x436e0f['id'] === _0xe9204d);
      if (
        !_0x51b749 ||
        !['position', 'rotation', 'scale']['includes'](_0x497617) ||
        !canStoryboard3DObjectEditTransformField(_0x51b749, _0x497617)
      )
        return;
      const _0x310d25 = structuredClone(_0x51b749['transform']),
        _0x52051d = Number(_0x532a39['target']['value']);
      ((_0x310d25[_0x497617][_0xad482f] =
        _0x497617 === 'scale'
          ? Math['max'](0.001, Number['isFinite'](_0x52051d) ? _0x52051d : _0x310d25[_0x497617][_0xad482f])
          : _0x497617 === 'rotation' && Number['isFinite'](_0x52051d)
            ? (_0x52051d * Math['PI']) / 0xb4
            : Number['isFinite'](_0x52051d)
              ? _0x52051d
              : _0x310d25[_0x497617][_0xad482f]),
        this['_commitObjectTransforms']({
          sceneId: _0x385354['id'],
          transforms: { [_0xe9204d]: _0x310d25 },
          activeTool: _0x497617 === 'position' ? 'move' : _0x497617 === 'rotation' ? 'rotate' : 'scale',
          label: 'Update ' + _0x497617,
        }));
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-object-name]')) {
      const _0x176e7a = _0x532a39['target']['dataset']['objectId'],
        _0x267e26 = String(_0x532a39['target']['value'] || '')['trim']();
      this['_executeMutation']({
        type: 'rename-object',
        label: 'Rename\x20object',
        mutate: (_0x16e498) => {
          const _0x10370c = _0x16e498['scenes']['find'](
              (_0x54834c) => _0x54834c['id'] === _0x16e498['activeSceneId'],
            ),
            _0x26c33f = _0x10370c?.['objects']?.['find']((_0xe6405f) => _0xe6405f['id'] === _0x176e7a);
          if (_0x26c33f && _0x267e26 && _0x26c33f['type'] === 'camera') {
            const _0x1b63ba = _0x10370c['shots']?.['find'](
              (_0x245237) => _0x245237['cameraId'] === _0x176e7a,
            );
            _0x1b63ba &&
              ((_0x1b63ba['name'] = _0x267e26['replace'](/\s*摄像机$/, '')['trim']() || _0x267e26),
              (_0x1b63ba['updatedAt'] = Date['now']()),
              syncStoryboard3DCameraObjectFromShot(_0x10370c, _0x1b63ba));
          } else {
            if (_0x26c33f && _0x267e26) _0x26c33f['name'] = _0x267e26;
          }
          return _0x16e498;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-object-parent]')) {
      const _0x2b3441 = _0x532a39['target']['dataset']['objectId'],
        _0x2cfae3 = String(_0x532a39['target']['value'] || '')['trim']() || null;
      try {
        this['_executeMutation']({
          type: 'set-object-parent',
          label: 'Set object parent',
          mutate: (_0x4261c1) => {
            const _0x322fcd = _0x4261c1['scenes']['findIndex'](
              (_0xb22bb6) => _0xb22bb6['id'] === _0x4261c1['activeSceneId'],
            );
            return (
              _0x322fcd >= 0x0 &&
                (_0x4261c1['scenes'][_0x322fcd] = setStoryboard3DObjectParent(
                  _0x4261c1['scenes'][_0x322fcd],
                  _0x2b3441,
                  _0x2cfae3,
                )),
              _0x4261c1
            );
          },
        });
      } catch (_0x4cd843) {
        (this['_setMessage'](_0x4cd843?.['message'] || String(_0x4cd843)), this['_render']());
      }
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-object-flag]')) {
      const _0x33d0c0 = _0x532a39['target']['dataset']['objectId'],
        _0x3a0551 = _0x532a39['target']['getAttribute']('data-storyboard-3d-object-flag'),
        _0x2834bb = _0x532a39['target']['checked'];
      this['_executeMutation']({
        type: 'set-object-' + _0x3a0551,
        label: 'Set object ' + _0x3a0551,
        mutate: (_0x381dcc) => {
          const _0xc70b9d = _0x381dcc['scenes']['find'](
              (_0x4afcc3) => _0x4afcc3['id'] === _0x381dcc['activeSceneId'],
            ),
            _0x4d80d9 = _0xc70b9d?.['objects']?.['find']((_0x1f16d3) => _0x1f16d3['id'] === _0x33d0c0);
          if (_0x4d80d9 && ['visible', 'locked']['includes'](_0x3a0551)) _0x4d80d9[_0x3a0551] = _0x2834bb;
          return _0x381dcc;
        },
      });
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-project-name]')) {
      const _0x3e0617 = this['projectStore']['renameProject'](_0x532a39['target']['value']);
      ((_0x532a39['target']['value'] = _0x3e0617['name']), this['_render']());
      return;
    }
    if (_0x532a39['target']?.['matches']?.('[data-storyboard-3d-model-input]')) {
      const _0x5863d3 = [...(_0x532a39['target']['files'] || [])];
      _0x532a39['target']['value'] = '';
      const _0x1c4fed = _0x5863d3['find']((_0x32fd03) =>
        /\.(glb|gltf|fbx|obj|stl)$/i['test'](_0x32fd03['name'] || ''),
      );
      if (!_0x1c4fed) return;
      try {
        (this['modelImportJob']?.['cancel']?.('开始新的模型导入'),
          (this['modelImportJob'] = createStoryboard3DModelImportJob({
            file: _0x1c4fed,
            relatedFiles: _0x5863d3['filter']((_0x326ba1) => _0x326ba1 !== _0x1c4fed),
            importOptions: { parsers: this['modelParsers'] },
            onStateChange: (_0x257738) => {
              ((this['modelImportState'] = _0x257738), this['_syncModelImportStatus']());
            },
          })),
          (this['modelImportState'] = this['modelImportJob']['getSnapshot']()),
          this['_render']());
        const _0x3c03a1 = await this['modelImportJob']['start']();
        if (!_0x3c03a1) {
          this['_render']();
          return;
        }
        const _0x21dca2 = await applyStoryboard3DTexturePolicy(_0x3c03a1['parsed']['scene'], {
            renderer: this['sceneRuntime']?.['bridge']?.['renderer'],
          }),
          _0xfc231c = await createCanonicalStoryboard3DAssetId(_0x1c4fed),
          _0x30a934 = await createStoryboard3DAssetRecord({
            file: _0x1c4fed,
            format: _0x3c03a1['format'],
            parsed: _0x3c03a1['parsed'],
            normalization: _0x3c03a1['normalization'],
            canonicalAssetId: _0xfc231c,
            indexedDbReference: {
              databaseName: STORYBOARD_3D_BINARY_ASSET_DB_NAME,
              storeName: STORYBOARD_3D_BINARY_ASSET_STORE_NAME,
              key: _0xfc231c,
            },
          }),
          _0x119c7d = _0x30a934['canonicalAssetId'],
          _0x23bf53 = this['assetLibrary']['registerImported']({
            id: _0x119c7d,
            name: _0x1c4fed['name']['replace'](/\.[^.]+$/, ''),
            tags: [_0x3c03a1['format'], '3d', 'model'],
            source: {
              kind: 'file',
              format: _0x3c03a1['format'],
              fileName: _0x1c4fed['name'],
              byteLength: _0x1c4fed['size'],
              fingerprint:
                _0x1c4fed['name'] + ':' + _0x1c4fed['size'] + ':' + (_0x1c4fed['lastModified'] || 0x0),
            },
            normalization: _0x3c03a1['normalization'],
            assetRecord: _0x30a934,
            createdAt: Date['now'](),
          });
        (await this['binaryAssetRepository']['put']({
          assetId: _0x119c7d,
          kind: 'model',
          descriptor: { assetDescriptor: _0x23bf53 },
          primaryFile: _0x1c4fed,
          relatedFiles: _0x5863d3['filter']((_0x260eea) => _0x260eea !== _0x1c4fed),
        }),
          this['_setImportedModelScene'](
            _0x119c7d,
            _0x3c03a1['parsed']['scene'],
            _0x3c03a1['normalization'],
          ));
        let _0x5e36a8 = '';
        (this['_executeMutation']({
          type: 'import-model',
          label: 'Import\x20' + _0x3c03a1['format']['toUpperCase']() + ' model',
          mutate: (_0x1b1804) => {
            const _0x298f60 = _0x1b1804['scenes']['find'](
              (_0x1c23f3) => _0x1c23f3['id'] === _0x1b1804['activeSceneId'],
            );
            if (!_0x298f60) return _0x1b1804;
            return (
              (_0x5e36a8 = createLocalId('prop')),
              _0x298f60['objects']['push']({
                id: _0x5e36a8,
                type: 'prop',
                name: _0x23bf53['name'],
                assetId: _0x119c7d,
                visible: !![],
                locked: ![],
                transform: { position: [0x0, 0x0, 0x0], rotation: [0x0, 0x0, 0x0], scale: [0x1, 0x1, 0x1] },
                castShadow: !![],
                receiveShadow: !![],
              }),
              _0x1b1804
            );
          },
        }),
          this['assetLibrary']['markUsed'](_0x119c7d));
        if (_0x5e36a8) this['_setSelectedObjects']([_0x5e36a8], { openProperties: ![] });
        const _0x473bf3 =
          _0x21dca2['optimized']['length'] > 0x0
            ? '，已优化 ' + _0x21dca2['optimized']['length'] + ' 张超限纹理'
            : '';
        (this['_setMessage'](_0x1c4fed['name'] + ' 已解析并加入当前场景' + _0x473bf3 + '。'),
          (this['modelImportState'] = this['modelImportJob']['getSnapshot']()),
          this['_render']());
      } catch (_0x22d1eb) {
        ((this['modelImportState'] = this['modelImportJob']?.['getSnapshot']?.() || this['modelImportState']),
          this['_setMessage'](_0x22d1eb?.['message'] || String(_0x22d1eb)),
          this['_render']());
      }
      return;
    }
  }
  async ['load'](_0x4da653) {
    const _0x449c18 = this['projectStore']['load'](_0x4da653);
    return (this['_render'](), _0x449c18);
  }
  async ['save']() {
    return this['projectStore']['save']();
  }
  ['focusObject'](_0x2934d1) {
    this['_setSelectedObjects'](_0x2934d1 ? [_0x2934d1] : []);
  }
  ['undo']() {
    return this['commandHistory']['undo']();
  }
  ['redo']() {
    return this['commandHistory']['redo']();
  }
  async ['renderShot']() {
    const _0x1ab607 = getActiveStoryboard3DShot(this['projectStore']['getSnapshot']());
    if (!_0x1ab607) throw new Error('当前场景没有可渲染镜头。');
    return this['_renderShotFrame'](_0x1ab607, { width: 0x780, height: 0x438 });
  }
  async ['exportStoryboard']() {
    return this['exportController']['open']();
  }
  ['close']({ persist: persist = !![] } = {}) {
    if (this['_closed']) return;
    this['_closed'] = !![];
    const _0x46f22e = persist ? this['projectStore']['save']() : this['projectStore']['getSnapshot'](),
      _0x199198 = getActiveStoryboard3DScene(_0x46f22e),
      _0x454068 = getActiveStoryboard3DShot(_0x46f22e);
    (this['_finishFlyMovement']({ clearKeys: !![] }),
      this['exportController']['destroy'](),
      this['_aiModelSelectorController']?.['destroy']?.(),
      (this['_aiModelSelectorController'] = null),
      this['aiController']['destroy'](),
      this['backgroundCalibrationInteraction']?.['destroy']?.(),
      (this['backgroundCalibrationInteraction'] = null),
      this['shotTimelineController']?.['destroy']?.(),
      this['modelImportJob']?.['cancel']?.('编辑器已关闭'),
      this['_clearShotCandidates'](),
      this['characterImagePoseController']['dispose'](),
      this['_disposeSceneRuntime']());
    this['_inspectorResize'] &&
      this['_handleInspectorResizePointerUp']({ pointerId: this['_inspectorResize']['pointerId'] });
    this['_rightSidebarResize'] &&
      this['_handleRightSidebarResizePointerUp']({ pointerId: this['_rightSidebarResize']['pointerId'] });
    this['_timelineResize'] &&
      this['_handleTimelineResizePointerUp']({ pointerId: this['_timelineResize']['pointerId'] });
    (this['_assetThumbnailObserver']?.['disconnect']?.(),
      (this['_assetThumbnailObserver'] = null),
      this['assetThumbnailRenderer']?.['dispose']?.(),
      (this['assetThumbnailRenderer'] = null),
      this['importedModelScenes']['forEach']((_0x5d9ef4) => {
        disposeCancelledStoryboard3DModelImportResult({ parsed: { scene: _0x5d9ef4 } });
      }),
      this['importedModelScenes']['clear'](),
      this['_packAssetLoads']['clear'](),
      this['_assetThumbnailLoads']['clear'](),
      this['_assetThumbnailFailures']['clear'](),
      this['backgroundImageControllers']['forEach']((_0xdcebe3) => _0xdcebe3['dispose']?.()),
      this['backgroundImageControllers']['clear'](),
      void this['binaryAssetRepository']['close'](),
      this['window']?.['removeEventListener']?.('keydown', this['_handleWindowKeyDown'], !![]),
      this['window']?.['removeEventListener']?.('keyup', this['_handleWindowKeyUp'], !![]),
      this['window']?.['removeEventListener']?.('blur', this['_handleWindowBlur']),
      this['window']?.['removeEventListener']?.('resize', this['_syncServerAlertOffset']),
      this['_serverAlertMutationObserver']?.['disconnect']?.(),
      this['_serverAlertResizeObserver']?.['disconnect']?.(),
      (this['_serverAlertMutationObserver'] = null),
      (this['_serverAlertResizeObserver'] = null),
      this['root']?.['removeEventListener']?.('contextmenu', containWorkspaceContextMenu),
      this['root']?.['removeEventListener']?.('click', this['_handleClick']),
      this['root']?.['removeEventListener']?.('input', this['_handleInput']),
      this['root']?.['removeEventListener']?.('change', this['_handleChange']),
      this['root']?.['removeEventListener']?.('dragstart', this['_handleOutlineDragStart']),
      this['root']?.['removeEventListener']?.('dragover', this['_handleOutlineDragOver']),
      this['root']?.['removeEventListener']?.('drop', this['_handleOutlineDrop']),
      this['root']?.['removeEventListener']?.('pointerdown', this['_handleInspectorResizePointerDown']),
      this['root']?.['removeEventListener']?.('pointerdown', this['_handleRightSidebarResizePointerDown']),
      this['root']?.['removeEventListener']?.('pointerdown', this['_handleTimelineResizePointerDown']),
      this['root']?.['removeEventListener']?.('pointerdown', this['_handleMiniMapPointerDown']),
      this['root']?.['removeEventListener']?.('wheel', this['_handleMiniMapWheel']),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleMiniMapPointerMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleMiniMapPointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleMiniMapPointerUp'], !![]),
      this['window']?.['removeEventListener']?.('pointermove', this['_handleMiniMapWindowMove'], !![]),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleMiniMapWindowUp'], !![]),
      this['window']?.['removeEventListener']?.('pointercancel', this['_handleMiniMapWindowUp'], !![]),
      this['window']?.['removeEventListener']?.(
        'pointermove',
        this['_handleInspectorResizePointerMove'],
        !![],
      ),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleInspectorResizePointerUp'], !![]),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleInspectorResizePointerUp'],
        !![],
      ),
      this['window']?.['removeEventListener']?.(
        'pointermove',
        this['_handleRightSidebarResizePointerMove'],
        !![],
      ),
      this['window']?.['removeEventListener']?.(
        'pointerup',
        this['_handleRightSidebarResizePointerUp'],
        !![],
      ),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleRightSidebarResizePointerUp'],
        !![],
      ),
      this['window']?.['removeEventListener']?.(
        'pointermove',
        this['_handleTimelineResizePointerMove'],
        !![],
      ),
      this['window']?.['removeEventListener']?.('pointerup', this['_handleTimelineResizePointerUp'], !![]),
      this['window']?.['removeEventListener']?.(
        'pointercancel',
        this['_handleTimelineResizePointerUp'],
        !![],
      ),
      this['root']?.['remove']?.(),
      (this['root'] = null),
      this['document']?.['body']?.['classList']?.['remove']?.('storyboard-3d-editor-open'),
      this['document']?.['body']?.['classList']?.['remove']?.('storyboard-3d-timeline-resizing'),
      this['_unsubscribeProject']?.(),
      this['_unsubscribeEditor']?.(),
      this['projectStore']['destroy'](),
      this['editorStore']['destroy'](),
      this['commandHistory']['clear']());
    const _0x2739c3 = {
      projectId: _0x46f22e['id'],
      activeSceneId: _0x199198?.['id'] || '',
      activeShotId: _0x454068?.['id'] || '',
      previewUrl: _0x454068?.['thumbnailUrl'] || '',
    };
    (dispatchWorkspaceEvent(this['window'], 'storyboard-3d:editor-closed', _0x2739c3),
      this['onClose']?.(_0x2739c3, _0x46f22e));
  }
}
export function openStoryboard3DEditor(_0xa442dc) {
  const _0x70973f = new Storyboard3DEditorWorkspace(_0xa442dc);
  return (_0x70973f['mount'](), _0x70973f);
}
