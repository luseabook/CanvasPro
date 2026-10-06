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
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
function dispatchWorkspaceEvent(enabled, item, detail) {
  if (!enabled?.dispatchEvent || typeof enabled.CustomEvent !== 'function') return;
  enabled.dispatchEvent(new enabled.CustomEvent(item, { detail: detail }));
}
function setStoryboard3DShotInitialCamera(enabled2, camera2, event) {
  if (!enabled2 || !camera2 || !event) return;
  ((camera2.camera = {
    ...camera2.camera,
    ...event,
    position: [...event.position],
    target: [...event.target],
  }),
    (camera2.animation = upsertStoryboard3DCameraKeyframe(camera2.animation, {
      time: 0,
      camera: camera2.camera,
    })),
    syncStoryboard3DCameraObjectFromShot(enabled2, camera2));
}
function restoreStoryboard3DStoredFile(type2, key = globalThis.window) {
  if (!type2?.blob) return null;
  const run = key?.File || globalThis.File;
  if (typeof run === 'function') {
    const index = new run([type2.blob], type2.name, {
      type: type2.type || type2.blob.type,
      lastModified: type2.lastModified || 0,
    });
    return (
      type2.relativePath &&
        type2.relativePath !== type2.name &&
        Object.defineProperty(index, 'webkitRelativePath', {
          configurable: true,
          value: type2.relativePath,
        }),
      index
    );
  }
  const result = type2.blob;
  for (const [data, value2] of Object.entries({
    name: type2.name,
    lastModified: type2.lastModified || 0,
    webkitRelativePath: type2.relativePath || type2.name,
  })) {
    try {
      Object.defineProperty(result, data, { configurable: true, value: value2 });
    } catch {}
  }
  return result;
}
function getSaveStatusLabel(options) {
  if (options === 'saving') return t('storyboard3d.saveStatus.saving');
  if (options === 'error') return t('storyboard3d.saveStatus.error');
  return t('storyboard3d.saveStatus.saved');
}
function renderObjectOutline(enabled3, list = [], { query: query = '', type: type = 'all' } = {}) {
  if (!enabled3 || enabled3.objects.length === 0)
    return (
      '<div class="storyboard-3d-empty-state">\n      <strong>' +
      escapeHtml(t('storyboard3d.editor.emptyOutlineTitle')) +
      '</strong>\n      <span>' +
      escapeHtml(t('storyboard3d.editor.emptyOutlineDescription')) +
      '</span>\n    </div>'
    );
  const enabled4 = String(query || '')
      .trim()
      .toLocaleLowerCase(),
    list2 = enabled3.objects.filter((error) => {
      if (type !== 'all' && error.type !== type) return false;
      return (
        !enabled4 || (error.name + ' ' + error.type).toLocaleLowerCase().includes(enabled4)
      );
    });
  if (list2.length === 0)
    return '<div class="storyboard-3d-empty-state"><strong>没有匹配对象</strong><span>调整名称或类型筛选。</span></div>';
  const map = new Map(enabled3.objects.map((target) => [target.id, target])),
    handler = (source) => {
      let count = 0,
        next = source.parentId;
      const map2 = new Set([source.id]);
      while (next && map.has(next) && !map2.has(next) && count < 4) {
        (map2.add(next), (count += 1), (next = map.get(next)?.parentId));
      }
      return count;
    };
  return list2.map((error2) => {
    const current = error2.visible !== false,
      entry = error2.locked === true,
      escapeHtml2 = escapeHtml(error2.name);
    return (
      '<div draggable="true" class="storyboard-3d-object-row is-depth-' +
      handler(error2) +
      ' ' +
      (list.includes(error2.id) ? 'is-active' : '') +
      '" data-object-type="' +
      escapeHtml(error2.type) +
      '" data-object-id="' +
      escapeHtml(error2.id) +
      '">\n          <button type="button" class="storyboard-3d-object-row-select" data-storyboard-3d-action="select-object" data-object-id="' +
      escapeHtml(error2.id) +
      '" data-object-type="' +
      escapeHtml(error2.type) +
      '" aria-pressed="' +
      list.includes(error2.id) +
      '" aria-label="选择 ' +
      escapeHtml2 +
      '">\n            <span class="storyboard-3d-object-type">' +
      escapeHtml(error2.type) +
      '</span>\n          </button>\n          <input type="text" class="storyboard-3d-object-row-name-input" value="' +
      escapeHtml2 +
      '" maxlength="120" draggable="false" data-storyboard-3d-action="edit-object-name" data-storyboard-3d-outline-name data-storyboard-3d-object-name data-object-id="' +
      escapeHtml(error2.id) +
      '" data-object-type="' +
      escapeHtml(error2.type) +
      '" aria-label="重命名 ' +
      escapeHtml2 +
      '" title="点击重命名">\n          <span class="storyboard-3d-object-row-actions" role="group" aria-label="' +
      escapeHtml2 +
      ' 对象状态">\n            <button type="button" class="storyboard-3d-object-state-button ' +
      (current ? '' : 'is-off') +
      '" data-storyboard-3d-action="toggle-object-visibility" data-object-id="' +
      escapeHtml(error2.id) +
      '" aria-pressed="' +
      current +
      '" aria-label="' +
      (current ? '隐藏' : '显示') +
      ' ' +
      escapeHtml2 +
      '" title="' +
      (current ? '隐藏对象' : '显示对象') +
      '">' +
      renderStoryboard3DControlIcon(current ? 'eye' : 'eyeOff') +
      '</button>\n            <button type="button" class="storyboard-3d-object-state-button ' +
      (entry ? 'is-locked' : '') +
      '" data-storyboard-3d-action="toggle-object-lock" data-object-id="' +
      escapeHtml(error2.id) +
      '" aria-pressed="' +
      entry +
      '" aria-label="' +
      (entry ? '解锁' : '锁定') +
      ' ' +
      escapeHtml2 +
      '" title="' +
      (entry ? '解锁对象' : '锁定对象') +
      '">' +
      renderStoryboard3DControlIcon(entry ? 'lock' : 'unlock') +
      '</button>\n            <button type="button" class="storyboard-3d-object-state-button is-delete" data-storyboard-3d-action="delete-object" data-object-id="' +
      escapeHtml(error2.id) +
      '" aria-label="删除 ' +
      escapeHtml2 +
      '" title="删除对象">×</button>\n          </span>\n        </div>'
    );
  }).join('');
}
function renderShotStrip(enabled5, { timelineOpen: timelineOpen = false } = {}) {
  if (!enabled5) return '';
  const record =
      '<div class="storyboard-3d-shot-strip-heading">\n    <strong>' +
      escapeHtml(t('storyboard3d.editor.shots')) +
      '</strong>\n    <button type="button" class="storyboard-3d-shot-keyframe-trigger ' +
      (timelineOpen ? 'is-active' : '') +
      '" data-storyboard-3d-action="timeline-toggle-drawer" aria-expanded="' +
      timelineOpen +
      '">关键帧</button>\n  </div>',
    payload = enabled5.shots
      .map(
        (error3, index2) =>
          '<button type="button" draggable="true" class="storyboard-3d-shot-card ' +
          (error3.id === enabled5.activeShotId ? 'is-active' : '') +
          '" data-storyboard-3d-action="select-shot" data-shot-id="' +
          escapeHtml(error3.id) +
          '" aria-pressed="' +
          (error3.id === enabled5.activeShotId) +
          '">\n        <span class="storyboard-3d-shot-thumb">\n          ' +
          (error3.thumbnailUrl
            ? '<img src="' +
              escapeHtml(error3.thumbnailUrl) +
              '" alt="' +
              escapeHtml(error3.name) +
              '">'
            : '<span>' + escapeHtml(t('storyboard3d.editor.previewPending')) + '</span>') +
          '\n        </span>\n        <span class="storyboard-3d-shot-copy">\n          <small>' +
          escapeHtml(t('storyboard3d.editor.shotNumber', { index: index2 + 1 })) +
          '</small>\n          <strong>' +
          escapeHtml(error3.name) +
          '</strong>\n          <span>' +
          escapeHtml(formatFocalLength(error3.camera.focalLength) + 'mm · ' + error3.shotSize) +
          '</span>\n        </span>\n      </button>',
      )
      .join(''),
    escapeHtml3 = escapeHtml(t('storyboard3d.editor.addShot')),
    escapeHtml4 = escapeHtml(t('storyboard3d.editor.addShotDescription'));
  return (
    '' +
    record +
    payload +
    '<button type="button" class="storyboard-3d-shot-add-card" data-storyboard-3d-action="add-shot" aria-label="' +
    escapeHtml3 +
    '" title="' +
    escapeHtml4 +
    '">' +
    renderStoryboard3DControlIcon('camera') +
    '<strong>' +
    escapeHtml3 +
    '</strong></button>'
  );
}
function renderShotTimelineDrawerHandle(handle, state) {
  const config = handle ? '拖拽调整关键帧区域高度，点击收起' : '向上拖拽调整关键帧区域高度，点击展开';
  return (
    '<button type="button" class="storyboard-3d-timeline-drawer-handle ' +
    (handle ? 'is-open' : '') +
    '" data-storyboard-3d-action="timeline-toggle-drawer" data-storyboard-3d-timeline-resize-handle role="separator" aria-orientation="horizontal" aria-valuemin="120" aria-valuemax="720" aria-valuenow="' +
    state +
    '" aria-expanded="' +
    handle +
    '" aria-label="' +
    config +
    '">\n    <span class="storyboard-3d-timeline-drawer-grip" aria-hidden="true"></span>\n  </button>'
  );
}
function formatFocalLength(scope) {
  const input = Number(scope);
  if (!Number.isFinite(input)) return '35';
  const output = Math.round(input * 10) / 10;
  return Number.isInteger(output) ? String(output) : output.toFixed(1);
}
function resolveStoryboard3DFocalPresetIndex(value3) {
  const value4 = Number(value3);
  if (!Number.isFinite(value4)) return STORYBOARD_3D_FOCAL_LENGTH_PRESETS.indexOf(35);
  return STORYBOARD_3D_FOCAL_LENGTH_PRESETS.reduce(
    (value5, value6, value7) =>
      Math.abs(value6 - value4) < Math.abs(STORYBOARD_3D_FOCAL_LENGTH_PRESETS[value5] - value4)
        ? value7
        : value5,
    0,
  );
}
function getStoryboard3DFocalPreset(value8) {
  const value9 = Math.max(
    0,
    Math.min(STORYBOARD_3D_FOCAL_LENGTH_PRESETS.length - 1, Math.round(Number(value8) || 0)),
  );
  return STORYBOARD_3D_FOCAL_LENGTH_PRESETS[value9];
}
function renderStoryboard3DFocalControl(enabled6, value10) {
  if (!enabled6) return '';
  const storyboard3DFocalPresetIndex = resolveStoryboard3DFocalPresetIndex(value10),
    value11 = STORYBOARD_3D_FOCAL_LENGTH_PRESETS[storyboard3DFocalPresetIndex],
    value12 = enabled6?.background?.lockedCamera === true,
    value13 = value12
      ? '背景机位已锁定，请先解除锁定再调整视口焦距'
      : '拖动调整视口焦距；添加摄像机时才会保存',
    value14 = [...STORYBOARD_3D_FOCAL_LENGTH_PRESETS]
      .reverse()
      .map((count2) => {
        const value15 = count2 === value11 ? ' is-active' : '';
        return count2 === 35
          ? '<button type="button" class="storyboard-3d-focal-tick is-default' +
              value15 +
              '" data-storyboard-3d-action="reset-focal-length" data-focal-length="35" aria-label="恢复默认焦距 35mm"><span aria-hidden="true">35</span><small aria-hidden="true">默认</small></button>'
          : '<span class="storyboard-3d-focal-tick' +
              value15 +
              '" data-focal-length="' +
              count2 +
              '" aria-hidden="true">' +
              count2 +
              '</span>';
      })
      .join('');
  return (
    '<div class="storyboard-3d-focal-control" title="' +
    value13 +
    '">\n    <span class="storyboard-3d-focal-value">焦距 <output data-storyboard-3d-focal-output>' +
    value11 +
    'mm</output></span>\n    <span class="storyboard-3d-focal-slider-wrap">\n      <input type="range" min="0" max="' +
    (STORYBOARD_3D_FOCAL_LENGTH_PRESETS.length - 1) +
    '" step="1" value="' +
    storyboard3DFocalPresetIndex +
    '" data-storyboard-3d-focal-slider aria-label="镜头焦距" aria-valuetext="' +
    value11 +
    'mm" ' +
    (value12 ? 'disabled' : '') +
    '>\n      <span class="storyboard-3d-focal-ticks">' +
    value14 +
    '</span>\n    </span>\n  </div>'
  );
}
function createLocalId(value16) {
  const value17 = globalThis.crypto;
  if (typeof value17?.randomUUID === 'function') return value16 + '-' + value17.randomUUID();
  return (
    value16 +
    '-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 9)
  );
}
function renderVectorInputs(value18, value19, value20 = []) {
  const value21 = value19 === 'rotation';
  return ['x', 'y', 'z']
    .map(
      (value22, value23) =>
        '<label><span>' +
        value22.toUpperCase() +
        (value21 ? '°' : '') +
        '</span><input type="number" step="' +
        (value21 ? '1' : '0.01') +
        '" value="' +
        escapeHtml(
          (value21 ? (Number(value20[value23] || 0) * 180) / Math.PI : Number(value20[value23] || 0)).toFixed(value21 ? 1 : 2),
        ) +
        '" data-storyboard-3d-transform-input data-object-id="' +
        escapeHtml(value18) +
        '" data-transform-field="' +
        value19 +
        '" data-transform-axis="' +
        value23 +
        '"></label>',
    )
    .join('');
}
function renderSelectedObjectInspector(error4, value24 = 'Head', value25 = null, list3 = [], value26 = null) {
  if (!error4)
    return (
      '<section class="storyboard-3d-inspector-card is-muted">\n      <small>' +
      escapeHtml(t('storyboard3d.editor.selection')) +
      '</small>\n      <strong>' +
      escapeHtml(t('storyboard3d.editor.noSelection')) +
      '</strong>\n      <p>' +
      escapeHtml(t('storyboard3d.editor.noSelectionDescription')) +
      '</p>\n    </section>'
    );
  const storyboard3DObjectTransformCapabilities = getStoryboard3DObjectTransformCapabilities(error4),
    value27 = { position: '位置', rotation: '旋转', scale: '缩放' },
    value28 =
      storyboard3DObjectTransformCapabilities.fields.length > 0
        ? storyboard3DObjectTransformCapabilities.fields
            .map(
              (value29) =>
                '<div class="storyboard-3d-transform-group"><strong>' +
                value27[value29] +
                '</strong><div>' +
                renderVectorInputs(error4.id, value29, error4.transform?.[value29]) +
                '</div></div>',
            )
            .join('')
        : '<p class="storyboard-3d-transform-unavailable">该对象没有可生效的空间变换；请编辑下方对象参数。</p>';
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-object-inspector">\n    <small>当前选择 · ' +
    escapeHtml(error4.type) +
    '</small>\n    <input class="storyboard-3d-object-name-input" value="' +
    escapeHtml(error4.name) +
    '" maxlength="120" data-storyboard-3d-object-name data-object-id="' +
    escapeHtml(error4.id) +
    '" aria-label="对象名称">\n    <label class="storyboard-3d-object-parent"><span>所属分组</span><select data-storyboard-3d-object-parent data-object-id="' +
    escapeHtml(error4.id) +
    '"><option value="">无分组</option>' +
    list3.filter((value30) => value30.id !== error4.id)
      .map(
        (error5) =>
          '<option value="' +
          escapeHtml(error5.id) +
          '" ' +
          (error4.parentId === error5.id ? 'selected' : '') +
          '>' +
          escapeHtml(error5.name) +
          '</option>',
      )
      .join('') +
    '</select></label>\n    ' +
    value28 +
    '\n    ' +
    (error4.type === 'prop' ? renderPropControls(error4, value25) : '') +
    '\n    ' +
    (error4.type === 'character' ? renderCharacterControls(error4, value24, value26) : '') +
    '\n    ' +
    (error4.type === 'light' ? renderLightControls(error4) : '') +
    '\n    ' +
    (error4.type === 'camera' ? renderCameraControls(error4) : '') +
    '\n    <div class="storyboard-3d-object-actions">\n      ' +
    (error4.type === 'group'
      ? '<button type="button" data-storyboard-3d-action="ungroup-object" data-object-id="' +
        escapeHtml(error4.id) +
        '">解除分组</button>'
      : '') +
    '\n      <button type="button" data-storyboard-3d-action="duplicate-object" data-object-id="' +
    escapeHtml(error4.id) +
    '">复制</button>\n      <button type="button" data-storyboard-3d-action="delete-object" data-object-id="' +
    escapeHtml(error4.id) +
    '">删除</button>\n    </div>\n  </section>'
  );
}
function renderCameraControls(value31) {
  return (
    '<div class="storyboard-3d-character-controls storyboard-3d-camera-controls">\n    <label><span>焦距 mm</span><input type="number" min="1" max="200" step="1" value="' +
    escapeHtml(value31.focalLength ?? 35) +
    '" data-storyboard-3d-camera-field="focalLength" data-object-id="' +
    escapeHtml(value31.id) +
    '"></label>\n    <label><span>宽高比</span><input type="text" value="' +
    escapeHtml(value31.aspectRatio || '16:9') +
    '" data-storyboard-3d-camera-field="aspectRatio" data-object-id="' +
    escapeHtml(value31.id) +
    '"></label>\n    <label><span>近裁剪面</span><input type="number" min="0.001" step="0.01" value="' +
    escapeHtml(value31.near ?? 0.1) +
    '" data-storyboard-3d-camera-field="near" data-object-id="' +
    escapeHtml(value31.id) +
    '"></label>\n    <label><span>远裁剪面</span><input type="number" min="1" step="1" value="' +
    escapeHtml(value31.far ?? 1000) +
    '" data-storyboard-3d-camera-field="far" data-object-id="' +
    escapeHtml(value31.id) +
    '"></label>\n    <p>该摄像机与对应 Shot 一对一绑定；移动、旋转和焦距修改会同步到镜头与摄像机关键帧。</p>\n  </div>'
  );
}
function renderPropControls(value32, value33) {
  const value34 = value33?.assetRecord;
  return (
    '<div class="storyboard-3d-character-controls storyboard-3d-prop-controls">\n    <label><span>分类</span><input type="text" value="' +
    escapeHtml(value33?.category || '道具') +
    '" readonly></label>\n    ' +
    (value34
      ? '<label><span>格式 / 三角面</span><input type="text" value="' +
        escapeHtml(value34.sourceFormat.toUpperCase() + ' · ' + value34.triangleCount) +
        '" readonly></label>'
      : '') +
    '\n    <label><span>色调覆盖</span><input type="color" value="' +
    escapeHtml(value32.tint || '#ffffff') +
    '" data-storyboard-3d-prop-field="tint" data-object-id="' +
    escapeHtml(value32.id) +
    '"></label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-prop-field="castShadow" data-object-id="' +
    escapeHtml(value32.id) +
    '" ' +
    (value32.castShadow !== false ? 'checked' : '') +
    '>投射阴影</label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-prop-field="receiveShadow" data-object-id="' +
    escapeHtml(value32.id) +
    '" ' +
    (value32.receiveShadow !== false ? 'checked' : '') +
    '>接收阴影</label>\n  </div>'
  );
}
function renderSelectOptions(list4, value35) {
  return list4.map(
    (error6) =>
      '<option value="' +
      escapeHtml(error6.id) +
      '" ' +
      (error6.id === value35 ? 'selected' : '') +
      '>' +
      escapeHtml(error6.name) +
      '</option>',
  ).join('');
}
const STORYBOARD_3D_EDITABLE_BONES = Object.freeze([
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
  STORYBOARD_3D_INSPECTOR_MIN_WIDTH = 280,
  STORYBOARD_3D_INSPECTOR_MAX_WIDTH = 560,
  STORYBOARD_3D_VIEWPORT_MIN_WIDTH = 420,
  STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH = 14,
  STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH = 360,
  STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH = 1800,
  STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH = 280,
  STORYBOARD_3D_TIMELINE_MIN_HEIGHT = 220,
  STORYBOARD_3D_TIMELINE_MAX_HEIGHT = 720,
  STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT = 340,
  STORYBOARD_3D_VIEWPORT_MIN_HEIGHT = 160;
export function normalizeStoryboard3DInspectorWidth(value36, value37 = 1200) {
  const value38 = Number(value37),
    value39 = Number.isFinite(value38)
      ? value38 - STORYBOARD_3D_VIEWPORT_MIN_WIDTH - STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH
      : STORYBOARD_3D_INSPECTOR_MAX_WIDTH,
    value40 = Math.max(
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math.min(STORYBOARD_3D_INSPECTOR_MAX_WIDTH, value39),
    ),
    value41 = Number(value36),
    value42 = Math.min(360, value40);
  return Math.round(
    Math.max(
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math.min(value40, Number.isFinite(value41) ? value41 : value42),
    ),
  );
}
export function resolveStoryboard3DViewportCenterPosition(event2) {
  const box = event2?.target,
    value43 = Array.isArray(box) ? Number(box[0]) : Number(box?.x),
    value44 = Array.isArray(box) ? Number(box[2]) : Number(box?.z);
  return [Number.isFinite(value43) ? value43 : 0, 0, Number.isFinite(value44) ? value44 : 0];
}
export function normalizeStoryboard3DRightSidebarWidth(value45, value46 = 1440, value47 = 'assets') {
  const value48 = Number(value46),
    value49 = Number.isFinite(value48)
      ? value48 - STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH
      : STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH,
    value50 = Math.max(
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math.min(STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH, value49),
    ),
    value51 = value45 == null ? Number.NaN : Number(value45),
    value52 = value47 !== 'assets',
    value53 = Math.min(
      value52 ? 480 : 960,
      Math.max(
        STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
        Number.isFinite(value48) ? value48 * (value52 ? 0.21 : 0.42) : value52 ? 360 : 720,
      ),
    );
  return Math.round(
    Math.max(
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math.min(value50, Number.isFinite(value51) ? value51 : value53),
    ),
  );
}
export function normalizeStoryboard3DTimelineHeight(value54, value55 = 900) {
  const value56 = Number(value55),
    value57 = Number.isFinite(value56)
      ? Math.min(
          STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
          Math.max(120, value56 - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT),
        )
      : STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
    value58 = Number.isFinite(value56)
      ? value56 - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT
      : STORYBOARD_3D_TIMELINE_MAX_HEIGHT,
    value59 = Math.max(value57, Math.min(STORYBOARD_3D_TIMELINE_MAX_HEIGHT, value58)),
    value60 = value54 == null ? Number.NaN : Number(value54),
    value61 = Math.min(STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT, value59);
  return Math.round(
    Math.max(value57, Math.min(value59, Number.isFinite(value60) ? value60 : value61)),
  );
}
function getCharacterPoseStatusText(response = {}) {
  if (response.status === 'running') return '正在本地识别“' + (response.fileName || '参考图') + '”…';
  if (response.status === 'error') return response.error || '姿势识别失败。';
  if (response.status === 'success') {
    const value62 = Math.round((Number(response.confidence) || 0) * 100),
      value63 = response.warningCount > 0 ? ' · 部分遮挡关节已跳过' : '';
    return '已应用 ' + (Number(response.boneCount) || 0) + ' 个骨骼 · 置信度 ' + value62 + '%' + value63;
  }
  return '支持单人全身 JPG、PNG、WebP；图片仅在本机处理。';
}
function reconcileCharacterPoseState(value64, response2) {
  if (
    response2?.status === 'success' &&
    response2.poseSignature !== createStoryboard3DBoneOverridesSignature(value64?.boneOverrides)
  )
    return { status: 'idle', objectId: String(value64?.id || '') };
  return response2;
}
function renderCharacterControls(value65, value66 = 'Head', value67 = null) {
  const value68 =
      STORYBOARD_3D_ACTIONS.find((value69) => value69.id === value65.actionId) ||
      STORYBOARD_3D_ACTIONS[0],
    storyboard3DEuler = quaternionToStoryboard3DEuler(value65.boneOverrides?.[value66]),
    response3 = value67 || { status: 'idle' },
    enabled7 = response3.status === 'running',
    enabled8 = Object.keys(value65.boneOverrides || {}).length > 0;
  return (
    '<div class="storyboard-3d-character-controls">\n    <label><span>人偶外观</span><select data-storyboard-3d-character-field="characterStyle" data-object-id="' +
    escapeHtml(value65.id) +
    '"><option value="articulated" ' +
    (value65.characterStyle !== 'anatomical' ? 'selected' : '') +
    '>关节预演人偶</option><option value="anatomical" ' +
    (value65.characterStyle === 'anatomical' ? 'selected' : '') +
    '>人体模型</option></select></label>\n    <label><span>体型</span><select data-storyboard-3d-character-field="bodyPresetId" data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    renderSelectOptions(STORYBOARD_3D_BODY_PRESETS, value65.bodyPresetId) +
    '</select></label>\n    <label><span>动作</span><select data-storyboard-3d-character-field="actionId" data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    renderSelectOptions(STORYBOARD_3D_ACTIONS, value65.actionId) +
    '</select></label>\n    <label><span>左手</span><select data-storyboard-3d-character-field="leftHandPoseId" data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    renderSelectOptions(STORYBOARD_3D_HAND_POSES, value65.leftHandPoseId) +
    '</select></label>\n    <label><span>右手</span><select data-storyboard-3d-character-field="rightHandPoseId" data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    renderSelectOptions(STORYBOARD_3D_HAND_POSES, value65.rightHandPoseId) +
    '</select></label>\n    <label><span>发型</span><input type="text" maxlength="80" value="' +
    escapeHtml(value65.hairId || '') +
    '" placeholder="默认" data-storyboard-3d-character-field="hairId" data-object-id="' +
    escapeHtml(value65.id) +
    '"></label>\n    <label class="is-wide"><span>附件 ID（逗号分隔）</span><input type="text" maxlength="500" value="' +
    escapeHtml((value65.attachmentIds || []).join(', ')) +
    '" placeholder="hat-01, bag-02" data-storyboard-3d-character-attachments data-object-id="' +
    escapeHtml(value65.id) +
    '"></label>\n    <label class="is-wide"><span>动作时间 ' +
    Number(value65.actionTime || 0).toFixed(2) +
    's</span><input type="range" min="0" max="' +
    escapeHtml(value68.duration || 1) +
    '" step="0.01" value="' +
    escapeHtml(value65.actionTime || 0) +
    '" data-storyboard-3d-character-time data-object-id="' +
    escapeHtml(value65.id) +
    '"></label>\n    <button type="button" data-storyboard-3d-action="toggle-character-play" data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    (value65.actionPlaying ? '暂停动作' : '播放动作') +
    '</button>\n    <section class="storyboard-3d-character-pose-from-image" data-storyboard-3d-character-pose data-object-id="' +
    escapeHtml(value65.id) +
    '" data-pose-status="' +
    escapeHtml(response3.status || 'idle') +
    '" data-has-pose="' +
    enabled8 +
    '" aria-busy="' +
    enabled7 +
    '">\n      <div>\n        <strong>参考图姿势</strong>\n        <small>MediaPipe Heavy · 本地单人识别</small>\n      </div>\n      <div class="storyboard-3d-character-pose-actions">\n        <button type="button" class="is-primary" data-storyboard-3d-action="extract-character-pose" data-object-id="' +
    escapeHtml(value65.id) +
    '" ' +
    (enabled7 ? 'disabled' : '') +
    '>' +
    (enabled7 ? '识别中…' : '从图片提取姿势') +
    '</button>\n        <button type="button" data-storyboard-3d-action="' +
    (enabled7 ? 'cancel-character-pose' : 'reset-character-pose') +
    '" data-object-id="' +
    escapeHtml(value65.id) +
    '" ' +
    (!enabled7 && !enabled8 ? 'disabled' : '') +
    '>' +
    (enabled7 ? '取消识别' : '重置骨骼') +
    '</button>\n      </div>\n      <p data-storyboard-3d-character-pose-status role="status" aria-live="polite">' +
    escapeHtml(getCharacterPoseStatusText(response3)) +
    '</p>\n    </section>\n    <div class="storyboard-3d-bone-editor">\n      <label><span>骨骼微调</span><select data-storyboard-3d-bone-select data-object-id="' +
    escapeHtml(value65.id) +
    '">' +
    STORYBOARD_3D_EDITABLE_BONES.map(
      ([value70, value71]) =>
        '<option value="' +
        value70 +
        '" ' +
        (value70 === value66 ? 'selected' : '') +
        '>' +
        value71 +
        '</option>',
    ).join('') +
    '</select></label>\n      <div>' +
    ['x', 'y', 'z']
      .map(
        (value72) =>
          '<label><span>' +
          value72.toUpperCase() +
          '°</span><input type="number" min="-180" max="180" step="1" value="' +
          escapeHtml(Math.round(((storyboard3DEuler[value72] || 0) * 180) / Math.PI)) +
          '" data-storyboard-3d-bone-axis="' +
          value72 +
          '" data-bone-name="' +
          escapeHtml(value66) +
          '" data-object-id="' +
          escapeHtml(value65.id) +
          '"></label>',
      )
      .join('') +
    '</div>\n    </div>\n  </div>'
  );
}
function renderLightControls(value73) {
  return (
    '<div class="storyboard-3d-character-controls storyboard-3d-light-controls">\n    <label><span>类型</span><select data-storyboard-3d-light-field="lightType" data-object-id="' +
    escapeHtml(value73.id) +
    '">\n      ' +
    ['ambient', 'directional', 'point', 'spot']
      .map(
        (value74) =>
          '<option value="' +
          value74 +
          '" ' +
          (value73.lightType === value74 ? 'selected' : '') +
          '>' +
          value74 +
          '</option>',
      )
      .join('') +
    '\n    </select></label>\n    <label><span>强度</span><input type="number" min="0" max="100" step="0.1" value="' +
    escapeHtml(value73.intensity ?? 1) +
    '" data-storyboard-3d-light-field="intensity" data-object-id="' +
    escapeHtml(value73.id) +
    '"></label>\n    <label><span>颜色</span><input type="color" value="' +
    escapeHtml(value73.color || '#ffffff') +
    '" data-storyboard-3d-light-field="color" data-object-id="' +
    escapeHtml(value73.id) +
    '"></label>\n    <label><span>衰减距离</span><input type="number" min="0" max="10000" step="0.1" value="' +
    escapeHtml(value73.distance ?? 0) +
    '" data-storyboard-3d-light-field="distance" data-object-id="' +
    escapeHtml(value73.id) +
    '"></label>\n    <label><span>衰减系数</span><input type="number" min="0" max="10" step="0.1" value="' +
    escapeHtml(value73.decay ?? 2) +
    '" data-storyboard-3d-light-field="decay" data-object-id="' +
    escapeHtml(value73.id) +
    '"></label>\n    <label><span>聚光角度°</span><input type="number" min="1" max="179" step="1" value="' +
    escapeHtml(Math.round(((value73.angle ?? Math.PI / 6) * 180) / Math.PI)) +
    '" data-storyboard-3d-light-field="angleDegrees" data-object-id="' +
    escapeHtml(value73.id) +
    '"></label>\n    <label class="is-check"><input type="checkbox" data-storyboard-3d-light-field="castShadow" data-object-id="' +
    escapeHtml(value73.id) +
    '" ' +
    (value73.castShadow === true ? 'checked' : '') +
    '>投射阴影</label>\n  </div>'
  );
}
function renderBackgroundCalibrationGuide(value75) {
  const storyboard3DBackgroundCalibration = normalizeStoryboard3DBackgroundCalibration(value75);
  if (!storyboard3DBackgroundCalibration.imageUrl) return '';
  const storyboard3DBackgroundGuideGeometry = computeStoryboard3DBackgroundGuideGeometry(
      storyboard3DBackgroundCalibration,
    ),
    [value76, value77] = storyboard3DBackgroundGuideGeometry.vanishingPoint,
    value78 = Math.round(storyboard3DBackgroundCalibration.calibrationConfidence * 100);
  return (
    '<div class="storyboard-3d-background-calibration-guide" aria-hidden="true">\n    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">\n      <polygon class="storyboard-3d-background-ground-region" data-storyboard-3d-background-ground-region points="' +
    storyboard3DBackgroundGuideGeometry.groundPoints +
    '"></polygon>\n      <line class="storyboard-3d-background-axis" data-storyboard-3d-background-axis-left x1="' +
    value76 +
    '" y1="' +
    value77 +
    '" x2="0" y2="1000"></line>\n      <line class="storyboard-3d-background-axis" data-storyboard-3d-background-axis-right x1="' +
    value76 +
    '" y1="' +
    value77 +
    '" x2="1000" y2="1000"></line>\n      <line class="storyboard-3d-background-horizon" data-storyboard-3d-background-horizon-line x1="0" y1="' +
    storyboard3DBackgroundGuideGeometry.leftY +
    '" x2="1000" y2="' +
    storyboard3DBackgroundGuideGeometry.rightY +
    '"></line>\n      <line class="storyboard-3d-background-horizon-hit" data-storyboard-3d-background-horizon-line data-storyboard-3d-background-drag="horizon" x1="0" y1="' +
    storyboard3DBackgroundGuideGeometry.leftY +
    '" x2="1000" y2="' +
    storyboard3DBackgroundGuideGeometry.rightY +
    '"></line>\n      <circle class="storyboard-3d-background-vanishing-point" data-storyboard-3d-background-vanishing-point cx="' +
    value76 +
    '" cy="' +
    value77 +
    '" r="9"></circle>\n      <circle class="storyboard-3d-background-vanishing-point-hit" data-storyboard-3d-background-vanishing-point data-storyboard-3d-background-drag="vanishing-point" cx="' +
    value76 +
    '" cy="' +
    value77 +
    '" r="24"></circle>\n    </svg>\n    <span data-storyboard-3d-background-guide-status>拖动青线或黄点调整 · ' +
    value78 +
    '%</span>\n  </div>'
  );
}
function renderSceneControls(error7, value79, value80 = {}, value81 = false) {
  const storyboard3DBackgroundCalibration2 = normalizeStoryboard3DBackgroundCalibration(
      error7?.background,
    ),
    value82 = Math.max(
      0,
      Math.min(
        1,
        storyboard3DBackgroundCalibration2.horizonY +
          storyboard3DBackgroundCalibration2.horizonSlope *
            (storyboard3DBackgroundCalibration2.vanishingPoint[0] - 0.5),
      ),
    );
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-scene-controls">\n    <small>场景设置</small>\n    <input class="storyboard-3d-scene-name-input" type="text" maxlength="120" value="' +
    escapeHtml(error7?.name || '') +
    '" data-storyboard-3d-scene-name data-scene-id="' +
    escapeHtml(error7?.id || '') +
    '" aria-label="场景名称">\n    <details class="storyboard-3d-scene-environment" data-storyboard-3d-scene-environment ' +
    (value81 ? 'open' : '') +
    '>\n      <summary data-storyboard-3d-action="toggle-scene-environment"><span>环境与参考背景</span><small>展开设置</small></summary>\n      <div class="storyboard-3d-scene-control-grid">\n      <label><span>环境</span><select data-storyboard-3d-scene-field="environmentType">\n        ' +
    ['empty', 'outdoor', 'indoor', 'studio']
      .map(
        (value83) =>
          '<option value="' +
          value83 +
          '" ' +
          (error7?.environment?.type === value83 ? 'selected' : '') +
          '>' +
          value83 +
          '</option>',
      )
      .join('') +
    '\n      </select></label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-scene-field="showGrid" ' +
    (error7?.environment?.showGrid !== false ? 'checked' : '') +
    '>显示网格</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-scene-field="showOutline" ' +
    (error7?.environment?.showOutline !== false ? 'checked' : '') +
    '>选择描边</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-scene-field="enableShadows" ' +
    (error7?.environment?.enableShadows !== false ? 'checked' : '') +
    '>启用阴影</label>\n      <label class="is-wide"><span>参考背景 URL</span><input type="url" value="' +
    escapeHtml(storyboard3DBackgroundCalibration2.imageUrl) +
    '" placeholder="https://…" data-storyboard-3d-background-field="imageUrl"></label>\n      <label><span>水平 FOV</span><input type="number" min="10" max="170" step="1" value="' +
    storyboard3DBackgroundCalibration2.horizontalFov +
    '" data-storyboard-3d-background-field="horizontalFov"></label>\n      <label><span>垂直 FOV</span><input type="number" min="10" max="170" step="1" value="' +
    (storyboard3DBackgroundCalibration2.verticalFov || 40) +
    '" data-storyboard-3d-background-field="verticalFov"></label>\n      <label><span>地平线</span><input type="number" min="0" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration2.horizonY +
    '" data-storyboard-3d-background-field="horizonY"></label>\n      <label><span>地平线倾斜</span><input type="number" min="-1" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration2.horizonSlope +
    '" data-storyboard-3d-background-field="horizonSlope"></label>\n      <label><span>相机高度 m</span><input type="number" min="0.2" max="20" step="0.1" value="' +
    storyboard3DBackgroundCalibration2.cameraHeight +
    '" data-storyboard-3d-background-field="cameraHeight"></label>\n      <label><span>背景缩放</span><input type="number" min="0.1" max="10" step="0.1" value="' +
    storyboard3DBackgroundCalibration2.imageScale +
    '" data-storyboard-3d-background-field="imageScale"></label>\n      <label><span>消失点 X</span><input type="number" min="0" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration2.vanishingPoint[0] +
    '" data-storyboard-3d-background-field="vanishingPointX"></label>\n      <label><span>消失点 Y（自动）</span><input type="number" value="' +
    value82.toFixed(3) +
    '" disabled></label>\n      <label><span>背景偏移 X</span><input type="number" min="-2" max="2" step="0.01" value="' +
    storyboard3DBackgroundCalibration2.imageOffset[0] +
    '" data-storyboard-3d-background-field="imageOffsetX"></label>\n      <label><span>背景偏移 Y</span><input type="number" min="-2" max="2" step="0.01" value="' +
    storyboard3DBackgroundCalibration2.imageOffset[1] +
    '" data-storyboard-3d-background-field="imageOffsetY"></label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-background-lock ' +
    (storyboard3DBackgroundCalibration2.lockedCamera ? 'checked' : '') +
    ' ' +
    (!storyboard3DBackgroundCalibration2.imageUrl ? 'disabled' : '') +
    '>锁定背景机位</label>\n      </div>\n    </details>\n    <div class="storyboard-3d-viewport-settings">\n      <label><span>变换空间</span><select data-storyboard-3d-viewport-setting="transformSpace"><option value="world" ' +
    (value80.transformSpace !== 'local' ? 'selected' : '') +
    '>世界</option><option value="local" ' +
    (value80.transformSpace === 'local' ? 'selected' : '') +
    '>本地</option></select></label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="groundLock" ' +
    (value80.groundLock ? 'checked' : '') +
    '>地面吸附</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="uniformScale" ' +
    (value80.uniformScale ? 'checked' : '') +
    '>均匀缩放</label>\n      <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="snapEnabled" ' +
    (value80.snapEnabled ? 'checked' : '') +
    '>启用吸附</label>\n      <label><span>移动步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(value80.translationSnap || 0.25) +
    '" data-storyboard-3d-viewport-setting="translationSnap"></label>\n      <label><span>旋转步长°</span><input type="number" min="1" max="180" step="1" value="' +
    escapeHtml(Math.round(((value80.rotationSnap || Math.PI / 12) * 180) / Math.PI)) +
    '" data-storyboard-3d-viewport-setting="rotationSnapDegrees"></label>\n      <label><span>缩放步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(value80.scaleSnap || 0.1) +
    '" data-storyboard-3d-viewport-setting="scaleSnap"></label>\n    </div>\n    <div class="storyboard-3d-scene-control-actions">\n      <button type="button" data-storyboard-3d-action="add-light">添加灯光</button>\n      <button type="button" data-storyboard-3d-action="upload-background">上传背景</button>\n      <button type="button" data-storyboard-3d-action="analyze-background" ' +
    (storyboard3DBackgroundCalibration2.binaryAssetId ? '' : 'disabled') +
    '>重新自动匹配</button>\n      <button type="button" data-storyboard-3d-action="clear-background" ' +
    (storyboard3DBackgroundCalibration2.imageUrl ? '' : 'disabled') +
    '>清除背景</button>\n      <small>' +
    (storyboard3DBackgroundCalibration2.lockedCamera
      ? '已锁定 ' +
        escapeHtml(formatFocalLength(value79?.camera?.focalLength) + 'mm') +
        ' · 匹配度 ' +
        Math.round(storyboard3DBackgroundCalibration2.calibrationConfidence * 100) +
        '%'
      : '调整地平线、消失点和相机高度后再锁定') +
    '</small>\n    </div>\n  </section>'
  );
}
function renderNavigationSettings(
  value84,
  { open: open = false, viewportSettings: viewportSettings = {} } = {},
) {
  const value85 =
      STORYBOARD_3D_NAVIGATION_PRESETS[value84.preset] || STORYBOARD_3D_NAVIGATION_PRESETS.unity,
    value86 = Object.values(STORYBOARD_3D_NAVIGATION_PRESETS)
      .map(
        (value87) =>
          '<label class="storyboard-3d-navigation-preset ' +
          (value87.id === value85.id ? 'is-active' : '') +
          '">\n      <input type="radio" name="storyboard-3d-navigation-preset" value="' +
          escapeHtml(value87.id) +
          '" data-storyboard-3d-navigation-preset ' +
          (value87.id === value85.id ? 'checked' : '') +
          '>\n      <strong>' +
          escapeHtml(value87.label) +
          '</strong>\n      <span>' +
          escapeHtml(value87.summary) +
          '</span>\n    </label>',
      )
      .join(''),
    handler2 = (value88, value89) =>
      '<label class="storyboard-3d-navigation-slider">\n    <span>' +
      escapeHtml(value89) +
      ' <output data-storyboard-3d-navigation-output="' +
      value88 +
      '">' +
      Number(value84[value88]).toFixed(2) +
      '×</output></span>\n    <input type="range" min="0.2" max="3" step="0.05" value="' +
      escapeHtml(value84[value88]) +
      '" data-storyboard-3d-navigation-setting="' +
      value88 +
      '">\n  </label>';
  return (
    '<details class="storyboard-3d-global-settings" ' +
    (open ? 'open' : '') +
    '>\n    <summary title="3D 操作习惯设置 (K)" aria-keyshortcuts="K"><span aria-hidden="true">⚙</span>全局设置<small data-storyboard-3d-navigation-current>' +
    escapeHtml(value85.label) +
    '</small></summary>\n    <section class="storyboard-3d-global-settings-panel" aria-label="3D 全局操作设置">\n      <header><div><strong>视口操作习惯</strong><span>每次只启用一套映射，设置会保存到本机。</span></div></header>\n      <div class="storyboard-3d-navigation-presets">' +
    value86 +
    '</div>\n      <div class="storyboard-3d-navigation-tuning">\n        ' +
    handler2('orbitSensitivity', '环绕灵敏度') +
    '\n        ' +
    handler2('panSensitivity', '平移灵敏度') +
    '\n        ' +
    handler2('zoomSensitivity', '缩放灵敏度') +
    '\n        <label><input type="checkbox" data-storyboard-3d-navigation-setting="invertOrbitX" ' +
    (value84.invertOrbitX ? 'checked' : '') +
    '>反向环绕 X</label>\n        <label><input type="checkbox" data-storyboard-3d-navigation-setting="invertOrbitY" ' +
    (value84.invertOrbitY ? 'checked' : '') +
    '>反向环绕 Y</label>\n        <label><input type="checkbox" data-storyboard-3d-navigation-setting="invertWheel" ' +
    (value84.invertWheel ? 'checked' : '') +
    '>反向滚轮缩放</label>\n      </div>\n      <header><div><strong>对象变换</strong><span>吸附与变换偏好会保存到本机；地面吸附按模型可见底部对齐。</span></div></header>\n      <div class="storyboard-3d-viewport-settings">\n        <label><span>变换空间</span><select data-storyboard-3d-viewport-setting="transformSpace"><option value="world" ' +
    (viewportSettings.transformSpace !== 'local' ? 'selected' : '') +
    '>世界</option><option value="local" ' +
    (viewportSettings.transformSpace === 'local' ? 'selected' : '') +
    '>本地</option></select></label>\n        <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="groundLock" ' +
    (viewportSettings.groundLock ? 'checked' : '') +
    '>地面吸附</label>\n        <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="uniformScale" ' +
    (viewportSettings.uniformScale ? 'checked' : '') +
    '>均匀缩放</label>\n        <label class="is-check"><input type="checkbox" data-storyboard-3d-viewport-setting="snapEnabled" ' +
    (viewportSettings.snapEnabled ? 'checked' : '') +
    '>启用步进吸附</label>\n        <label><span>移动步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(viewportSettings.translationSnap || 0.25) +
    '" data-storyboard-3d-viewport-setting="translationSnap"></label>\n        <label><span>旋转步长°</span><input type="number" min="1" max="180" step="1" value="' +
    escapeHtml(Math.round(((viewportSettings.rotationSnap || Math.PI / 12) * 180) / Math.PI)) +
    '" data-storyboard-3d-viewport-setting="rotationSnapDegrees"></label>\n        <label><span>缩放步长</span><input type="number" min="0.01" max="10" step="0.01" value="' +
    escapeHtml(viewportSettings.scaleSnap || 0.1) +
    '" data-storyboard-3d-viewport-setting="scaleSnap"></label>\n      </div>\n    </section>\n  </details>'
  );
}
const STORYBOARD_3D_TOOL_LABELS = Object.freeze({
    select: '选择 / 框选',
    move: '移动',
    rotate: '旋转',
    scale: '缩放',
  }),
  STORYBOARD_3D_SELECT_MOVE_TOOLS = new Set(['select', 'move']);
function renderStoryboard3DControlIcon(value90) {
  const value91 = {
    select: '<path d="M5 3.5 16.5 12l-5.1 1.2L9.2 19 5 3.5Z"/><path d="M18 5h2v2M20 17v2h-2M6 19H4v-2"/>',
    move: '<path d="M12 3v18M3 12h18"/><path d="m12 3-2.5 2.5M12 3l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5"/>',
    rotate: '<path d="M19 10a7.5 7.5 0 1 0 .2 4.7"/><path d="m15 5 4.8.2L19.5 10"/>',
    scale:
      '<path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"/><path d="m9 9-4-4m10 4 4-4m-4 10 4 4M9 15l-4 4"/>',
    camera:
      '<rect x="3" y="7" width="14" height="11" rx="2"/><path d="m17 10 4-2v9l-4-2"/><circle cx="10" cy="12.5" r="2.5"/>',
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
      '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 8h8v8H8zM8 12h8"/>',
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
    '<svg class="storyboard-3d-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    (value91[value90] || '') +
    '</svg>'
  );
}
function renderStoryboard3DIconButton({
  action: action,
  icon: icon,
  label: label2,
  shortcut: shortcut = '',
  active: active = null,
  dataTool: dataTool = '',
  dataView: dataView = '',
  dataShortcutTool: dataShortcutTool = '',
  dataSetting: dataSetting = '',
  className: className = '',
  disabled: disabled = false,
  hidden: hidden = false,
  title: title = '',
}) {
  const value92 = ['storyboard-3d-icon-button', className, active === true ? 'is-active' : '']
      .filter(Boolean)
      .join(' '),
    value93 = dataTool ? ' data-tool="' + escapeHtml(dataTool) + '"' : '',
    value94 = dataView ? ' data-view="' + escapeHtml(dataView) + '"' : '',
    value95 = dataShortcutTool
      ? ' data-storyboard-3d-tool-shortcut="' + escapeHtml(dataShortcutTool) + '"'
      : '',
    value96 = dataSetting
      ? ' data-storyboard-3d-viewport-setting-toggle="' + escapeHtml(dataSetting) + '"'
      : '',
    value97 = active === null ? '' : ' aria-pressed="' + active + '"',
    value98 = disabled ? ' disabled' : '',
    value99 = hidden ? ' hidden' : '',
    value100 = shortcut
      ? '<span class="storyboard-3d-control-shortcut" aria-hidden="true">' +
        escapeHtml(shortcut) +
        '</span>'
      : '',
    value101 = shortcut ? ' aria-keyshortcuts="' + escapeHtml(shortcut) + '"' : '',
    value102 = title || (shortcut ? label2 + ' (' + shortcut + ')' : label2);
  return (
    '<button type="button" class="' +
    value92 +
    '" data-storyboard-3d-action="' +
    escapeHtml(action) +
    '"' +
    value93 +
    value94 +
    value95 +
    value96 +
    value97 +
    value98 +
    value99 +
    value101 +
    ' aria-label="' +
    escapeHtml(label2) +
    '" title="' +
    escapeHtml(value102) +
    '">' +
    renderStoryboard3DControlIcon(icon) +
    value100 +
    '</button>'
  );
}
function renderStoryboard3DToolButton(icon2, active2, value103) {
  const dataShortcutTool2 = icon2;
  return renderStoryboard3DIconButton({
    action: 'set-tool',
    icon: icon2,
    label: STORYBOARD_3D_TOOL_LABELS[icon2] || icon2,
    shortcut: getStoryboard3DToolShortcut(value103, dataShortcutTool2),
    active: active2,
    dataTool: icon2,
    dataShortcutTool: dataShortcutTool2,
  });
}
function renderStoryboard3DViewportSettingButton({
  field: field,
  icon: icon3,
  label: label3,
  active: active3,
  hidden: hidden = false,
}) {
  return renderStoryboard3DIconButton({
    action: 'toggle-viewport-setting',
    icon: icon3,
    label: label3,
    active: active3,
    dataSetting: field,
    hidden: hidden,
  });
}
function renderShotInspector(enabled9, error8) {
  if (!enabled9 || !error8) return '';
  const count3 = enabled9.shots.findIndex((value104) => value104.id === error8.id);
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-shot-inspector">\n    <small>当前镜头 · ' +
    (count3 + 1) +
    '/' +
    enabled9.shots.length +
    '</small>\n    <input type="text" maxlength="120" value="' +
    escapeHtml(error8.name) +
    '" data-storyboard-3d-shot-field="name" data-shot-id="' +
    escapeHtml(error8.id) +
    '" aria-label="镜头名称">\n    <textarea rows="2" maxlength="1000" placeholder="镜头说明" data-storyboard-3d-shot-field="description" data-shot-id="' +
    escapeHtml(error8.id) +
    '">' +
    escapeHtml(error8.description || '') +
    '</textarea>\n    <div class="storyboard-3d-shot-inspector-meta"><span>' +
    escapeHtml(error8.shotSize) +
    '</span><span>' +
    escapeHtml(error8.shotAngle) +
    '</span><strong>' +
    escapeHtml(formatFocalLength(error8.camera.focalLength) + 'mm') +
    '</strong></div>\n    <div class="storyboard-3d-shot-inspector-actions">\n      <button type="button" data-storyboard-3d-action="replace-shot-camera" data-shot-id="' +
    escapeHtml(error8.id) +
    '">更新当前镜头</button>\n      <button type="button" data-storyboard-3d-action="move-shot" data-direction="-1" data-shot-id="' +
    escapeHtml(error8.id) +
    '" ' +
    (count3 <= 0 ? 'disabled' : '') +
    '>前移</button>\n      <button type="button" data-storyboard-3d-action="move-shot" data-direction="1" data-shot-id="' +
    escapeHtml(error8.id) +
    '" ' +
    (count3 >= enabled9.shots.length - 1 ? 'disabled' : '') +
    '>后移</button>\n      <button type="button" data-storyboard-3d-action="duplicate-shot" data-shot-id="' +
    escapeHtml(error8.id) +
    '">复制</button>\n      <button type="button" data-storyboard-3d-action="delete-shot" data-shot-id="' +
    escapeHtml(error8.id) +
    '">删除</button>\n    </div>\n  </section>'
  );
}
function renderAIAssistant(error9 = {}) {
  const { modelId: modelId, provider: provider } = resolveStoryboard3DTextModelSelection(error9.modelId),
    value105 = error9.status || 'idle',
    value106 = ['planning', 'executing', 'starting', 'listening', 'transcribing', 'stopping'].includes(
      value105,
    ),
    value107 = {
      idle: '等待指令',
      planning: '正在规划安全命令…',
      ready: '计划已就绪',
      executing: '正在执行事务…',
      completed: '执行完成',
      starting: '正在启动麦克风…',
      listening: '正在聆听…',
      transcribing: '正在转写…',
      stopping: '正在结束录音…',
      error: error9.error?.message || '执行失败',
    },
    list5 = error9.plan?.commands || [];
  return (
    '<section class="storyboard-3d-inspector-card storyboard-3d-ai-assistant" data-storyboard-3d-ai-panel data-status="' +
    escapeHtml(value105) +
    '">\n    <small>AI 场景助手</small>\n    <strong>用自然语言编辑当前场景</strong>\n    <div class="storyboard-3d-ai-feed" aria-live="polite">\n      <div class="storyboard-3d-ai-message">\n        <span>场景助手</span>\n        <p data-storyboard-3d-ai-status>' +
    escapeHtml(value107[value105] || value105) +
    '</p>\n      </div>\n      ' +
    (list5.length
      ? '<ol class="storyboard-3d-ai-plan">' +
        list5.map(
          (value108) =>
            '<li><strong>' +
            escapeHtml(value108.tool) +
            '</strong><span>' +
            escapeHtml(value108.commandId || '') +
            '</span></li>',
        ).join('') +
        '</ol>'
      : '<p class="storyboard-3d-ai-empty">AI 返回的计划与执行信息会显示在这里。</p>') +
    '\n    </div>\n    <div class="storyboard-3d-ai-composer">\n      <div class="storyboard-3d-ai-prompt-wrap">\n        <textarea rows="4" maxlength="5000" aria-label="AI 场景指令" placeholder="例如：在人物左侧放一张桌子，再增加一个 50mm 近景镜头" data-storyboard-3d-ai-instruction>' +
    escapeHtml(error9.instruction || '') +
    '</textarea>\n        ' +
    (error9.interimTranscript
      ? '<p class="storyboard-3d-ai-transcript">正在转写：' + escapeHtml(error9.interimTranscript) + '</p>'
      : '') +
    '\n      </div>\n      <div class="storyboard-3d-ai-model-bar">\n        ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: modelId,
      provider: provider,
      getDisplayModelName: getDisplayModelName,
      className: 'storyboard-3d-ai-text-model-selector',
      allowedModelIds: getStoryboard3DTextModelIds(),
    }) +
    '\n        <div class="storyboard-3d-ai-actions">\n          <button type="button" data-storyboard-3d-action="toggle-ai-voice" ' +
    (error9.voiceSupported === false ? 'disabled' : '') +
    '>' +
    (['starting', 'listening', 'transcribing', 'stopping'].includes(value105) ? '停止语音' : '语音输入') +
    '</button>\n          <button type="button" class="is-primary" data-storyboard-3d-action="run-ai-command" ' +
    (value106 || !provider ? 'disabled' : '') +
    '>执行指令</button>\n          ' +
    (error9.canUndoAI
      ? '<button type="button" data-storyboard-3d-action="undo-ai-command">撤销本次 AI 修改</button>'
      : '') +
    '\n          ' +
    (value106
      ? '<button type="button" data-storyboard-3d-action="cancel-ai-command">取消</button>'
      : '') +
    '\n        </div>\n      </div>\n    </div>\n  </section>'
  );
}
function renderAIAssistantRightSidebar(options2 = {}, value109 = {}) {
  return (
    '<aside class="storyboard-3d-right-sidebar storyboard-3d-ai-sidebar" id="storyboard3DRightSidebar" aria-labelledby="storyboard3DAIAssistantTitle">\n    <div class="storyboard-3d-right-sidebar-splitter panel-resize-handle" data-storyboard-3d-right-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整 AI 助手宽度" aria-valuemin="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(value109.sidebarWidth, value109.layoutWidth) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-ai-sidebar-layout">\n      <header class="storyboard-3d-ai-sidebar-heading">\n        <div><small>场景编辑</small><h2 id="storyboard3DAIAssistantTitle">AI 助手</h2></div>\n      </header>\n      <div class="storyboard-3d-ai-sidebar-content">' +
    renderAIAssistant(options2) +
    '</div>\n    </section>\n  </aside>'
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
  value110 = {},
) {
  if (!object) return '';
  return (
    '<aside class="storyboard-3d-right-sidebar storyboard-3d-object-properties-sidebar" id="storyboard3DRightSidebar" data-object-id="' +
    escapeHtml(object.id) +
    '" aria-labelledby="storyboard3DObjectPropertiesTitle">\n    <div class="storyboard-3d-right-sidebar-splitter panel-resize-handle" data-storyboard-3d-right-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整对象属性宽度" aria-valuemin="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(value110.sidebarWidth, value110.layoutWidth) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-ai-sidebar-layout storyboard-3d-object-properties-layout">\n      <header class="storyboard-3d-ai-sidebar-heading storyboard-3d-object-properties-heading">\n        <div><small>' +
    escapeHtml(object.type) +
    ' · 对象属性</small><h2 id="storyboard3DObjectPropertiesTitle">' +
    escapeHtml(object.name) +
    '</h2></div>\n      </header>\n      <div class="storyboard-3d-ai-sidebar-content storyboard-3d-object-properties-content">\n        ' +
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
function getBackgroundCalibrationMethodLabel(value111) {
  if (value111 === 'exif-local-estimate') return 'EXIF + 图像分析';
  if (value111 === 'local-image-estimate') return '本地图像分析';
  if (value111 === 'manual') return '手动校准';
  return '尚未匹配';
}
function renderBackgroundPerspectivePanel(value112, value113) {
  const storyboard3DBackgroundCalibration3 = normalizeStoryboard3DBackgroundCalibration(
      value112?.background,
    ),
    enabled10 = Boolean(storyboard3DBackgroundCalibration3.imageUrl),
    value114 = Math.round(storyboard3DBackgroundCalibration3.calibrationConfidence * 100),
    value115 = Math.max(
      0,
      Math.min(
        1,
        storyboard3DBackgroundCalibration3.horizonY +
          storyboard3DBackgroundCalibration3.horizonSlope *
            (storyboard3DBackgroundCalibration3.vanishingPoint[0] - 0.5),
      ),
    ),
    value116 =
      storyboard3DBackgroundCalibration3.imageWidth > 1 &&
      storyboard3DBackgroundCalibration3.imageHeight > 1
        ? storyboard3DBackgroundCalibration3.imageWidth +
          ' × ' +
          storyboard3DBackgroundCalibration3.imageHeight
        : '尺寸未知';
  if (!enabled10)
    return '<section class="storyboard-3d-perspective-panel" data-storyboard-3d-perspective-panel>\n      <div class="storyboard-3d-perspective-empty">\n        <span aria-hidden="true">⌗</span>\n        <strong>用参考图匹配 3D 透视</strong>\n        <p>上传图片后自动检测地平线、消失点和地面区域，并将当前摄像机匹配到图片视角。</p>\n        <button type="button" class="is-primary" data-storyboard-3d-action="upload-background">选择图像并匹配</button>\n        <small>支持 PNG、JPG、WEBP；原图只保存在本地项目资源中。</small>\n      </div>\n    </section>';
  return (
    '<section class="storyboard-3d-perspective-panel" data-storyboard-3d-perspective-panel>\n    <figure class="storyboard-3d-perspective-preview">\n      <img src="' +
    escapeHtml(storyboard3DBackgroundCalibration3.imageUrl) +
    '" alt="当前透视匹配参考图">\n      <figcaption>\n        <span>' +
    (storyboard3DBackgroundCalibration3.lockedCamera ? '透视已锁定' : '透视未锁定') +
    '</span>\n        <strong>' +
    value114 +
    '%</strong>\n      </figcaption>\n    </figure>\n    <div class="storyboard-3d-perspective-summary" data-state="' +
    (storyboard3DBackgroundCalibration3.lockedCamera ? 'locked' : 'ready') +
    '">\n      <div><small>匹配方式</small><strong>' +
    escapeHtml(getBackgroundCalibrationMethodLabel(storyboard3DBackgroundCalibration3.calibrationMethod)) +
    '</strong></div>\n      <div><small>图像尺寸</small><strong>' +
    escapeHtml(value116) +
    '</strong></div>\n      <div><small>当前镜头</small><strong>' +
    escapeHtml(value113 ? formatFocalLength(value113.camera?.focalLength) + 'mm' : '未创建') +
    '</strong></div>\n    </div>\n    <div class="storyboard-3d-perspective-actions">\n      <button type="button" class="is-primary" data-storyboard-3d-action="upload-background">更换图像</button>\n      <button type="button" data-storyboard-3d-action="analyze-background" ' +
    (storyboard3DBackgroundCalibration3.binaryAssetId ? '' : 'disabled') +
    '>重新匹配</button>\n      <button type="button" data-storyboard-3d-action="clear-background">清除</button>\n    </div>\n    <details class="storyboard-3d-perspective-settings" open>\n      <summary>匹配参数 <small>修改后即时更新摄像机</small></summary>\n      <div class="storyboard-3d-scene-control-grid">\n        <label><span>水平 FOV°</span><input type="number" min="10" max="170" step="0.1" value="' +
    storyboard3DBackgroundCalibration3.horizontalFov +
    '" data-storyboard-3d-background-field="horizontalFov"></label>\n        <label><span>垂直 FOV°</span><input type="number" min="10" max="170" step="0.1" value="' +
    (storyboard3DBackgroundCalibration3.verticalFov || 40) +
    '" data-storyboard-3d-background-field="verticalFov"></label>\n        <label><span>地平线 Y</span><input type="number" min="0" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration3.horizonY +
    '" data-storyboard-3d-background-field="horizonY"></label>\n        <label><span>地平线倾斜</span><input type="number" min="-1" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration3.horizonSlope +
    '" data-storyboard-3d-background-field="horizonSlope"></label>\n        <label><span>消失点 X</span><input type="number" min="0" max="1" step="0.01" value="' +
    storyboard3DBackgroundCalibration3.vanishingPoint[0] +
    '" data-storyboard-3d-background-field="vanishingPointX"></label>\n        <label><span>消失点 Y</span><input type="number" value="' +
    value115.toFixed(3) +
    '" disabled></label>\n        <label><span>相机高度 m</span><input type="number" min="0.2" max="20" step="0.1" value="' +
    storyboard3DBackgroundCalibration3.cameraHeight +
    '" data-storyboard-3d-background-field="cameraHeight"></label>\n        <label><span>背景缩放</span><input type="number" min="0.1" max="10" step="0.1" value="' +
    storyboard3DBackgroundCalibration3.imageScale +
    '" data-storyboard-3d-background-field="imageScale"></label>\n        <label><span>背景偏移 X</span><input type="number" min="-2" max="2" step="0.01" value="' +
    storyboard3DBackgroundCalibration3.imageOffset[0] +
    '" data-storyboard-3d-background-field="imageOffsetX"></label>\n        <label><span>背景偏移 Y</span><input type="number" min="-2" max="2" step="0.01" value="' +
    storyboard3DBackgroundCalibration3.imageOffset[1] +
    '" data-storyboard-3d-background-field="imageOffsetY"></label>\n      </div>\n    </details>\n    <label class="storyboard-3d-perspective-lock">\n      <input type="checkbox" data-storyboard-3d-background-lock ' +
    (storyboard3DBackgroundCalibration3.lockedCamera ? 'checked' : '') +
    '>\n      <span><strong>锁定匹配机位</strong><small>锁定后禁止意外改变与参考图对应的摄像机视角</small></span>\n    </label>\n  </section>'
  );
}
function renderBackgroundPerspectiveRightSidebar(
  { scene: scene = null, activeShot: activeShot = null } = {},
  value117 = {},
) {
  return (
    '<aside class="storyboard-3d-right-sidebar storyboard-3d-perspective-sidebar" id="storyboard3DRightSidebar" aria-labelledby="storyboard3DPerspectiveTitle">\n    <div class="storyboard-3d-right-sidebar-splitter panel-resize-handle" data-storyboard-3d-right-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整图像透视匹配宽度" aria-valuemin="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(value117.sidebarWidth, value117.layoutWidth, 'perspective') +
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
  const value118 = ['queued', 'reading', 'parsing'].includes(importState?.status),
    list6 = [
      ...STORYBOARD_3D_ASSET_CATEGORIES,
      { id: 'recent', label: getStoryboard3DAssetCategoryLabel('recent') },
      { id: 'favorite', label: getStoryboard3DAssetCategoryLabel('favorite') },
    ];
  return (
    '<aside class="storyboard-3d-asset-library-sidebar" aria-label="模型库工具">\n    <div class="storyboard-3d-asset-sidebar-heading">\n      <small>模型工具</small>\n      <strong>查找与导入</strong>\n    </div>\n    <div class="storyboard-3d-asset-filters">\n      <label>\n        <span>搜索模型</span>\n        <input type="search" value="' +
    escapeHtml(query) +
    '" placeholder="输入模型名称" data-storyboard-3d-asset-query>\n      </label>\n      <nav class="storyboard-3d-asset-category-panel" aria-label="模型分类">\n        <span>模型分类</span>\n        <div class="storyboard-3d-asset-category-list">\n          ' +
    list6.map(
      (value119) =>
        '<button type="button" class="' +
        (value119.id === category ? 'is-active' : '') +
        '" data-storyboard-3d-action="select-asset-category" data-storyboard-3d-asset-category="' +
        escapeHtml(value119.id) +
        '" aria-pressed="' +
        (value119.id === category) +
        '">' +
        escapeHtml(value119.label) +
        '</button>',
    ).join('') +
    '\n        </div>\n      </nav>\n    </div>\n    <div class="storyboard-3d-asset-toolbar">\n      <strong>导入本地模型</strong>\n      <button type="button" data-storyboard-3d-action="import-model" ' +
    (value118 ? 'disabled' : '') +
    '>导入模型</button>\n      ' +
    (value118 ? '<button type="button" data-storyboard-3d-action="cancel-model-import">取消</button>' : '') +
    '\n      <small>支持 GLB / GLTF / FBX / OBJ / STL</small>\n      <span data-storyboard-3d-import-status>' +
    (value118
      ? escapeHtml(importState.fileName || '模型') +
        ' · ' +
        importState.status +
        ' · ' +
        Math.round((importState.progress || 0) * 100) +
        '%'
      : '') +
    '</span>\n    </div>\n  </aside>'
  );
}
function renderAssetLibrary({
  assets: assets = [],
  hasMore: hasMore = false,
  favoriteIds: favoriteIds = new Set(),
} = {}) {
  return (
    '<section class="storyboard-3d-asset-results" aria-label="模型列表">\n      <div class="storyboard-3d-asset-grid">\n      ' +
    (assets.length > 0
      ? assets.map(
          (error10) =>
            '<article><button type="button" data-storyboard-3d-action="add-asset" data-asset-id="' +
            escapeHtml(error10.id) +
            '"><span class="storyboard-3d-asset-thumb" data-storyboard-3d-asset-thumbnail data-asset-id="' +
            escapeHtml(error10.id) +
            '" data-thumbnail-status="' +
            (error10.thumbnailUrl ? 'ready' : 'pending') +
            '">' +
            (error10.thumbnailUrl
              ? '<img src="' +
                escapeHtml(error10.thumbnailUrl) +
                '" alt="' +
                escapeHtml(error10.name + ' 模型预览') +
                '">'
              : '<span class="storyboard-3d-asset-thumb-loading" aria-label="正在生成 ' +
                escapeHtml(error10.name) +
                ' 的模型预览"><i></i><small>生成预览</small></span>') +
            '</span><span>' +
            escapeHtml(getStoryboard3DAssetCategoryLabel(error10.category)) +
            (error10.assetRecord?.sourceFormat
              ? ' · ' + escapeHtml(error10.assetRecord.sourceFormat.toUpperCase())
              : '') +
            '</span><strong title="' +
            escapeHtml(error10.name) +
            '">' +
            escapeHtml(error10.name) +
            '</strong></button><button type="button" class="storyboard-3d-asset-favorite ' +
            (favoriteIds.has(error10.id) ? 'is-active' : '') +
            '" data-storyboard-3d-action="toggle-asset-favorite" data-asset-id="' +
            escapeHtml(error10.id) +
            '" aria-label="' +
            (favoriteIds.has(error10.id) ? '取消收藏' : '收藏') +
            '">★</button></article>',
        ).join('')
      : '<div class="storyboard-3d-empty-state"><strong>没有匹配的模型</strong><span>调整搜索词或分类后重试。</span></div>') +
    '\n      </div>\n      ' +
    (hasMore
      ? '<button type="button" class="storyboard-3d-assets-load-more" data-storyboard-3d-action="load-more-assets">加载更多模型</button>'
      : '') +
    '\n    </section>'
  );
}
function renderAssetLibraryRightSidebar(options3 = {}) {
  const value120 = Array.isArray(options3.assets) ? options3.assets.length : 0,
    value121 = Math.max(value120, Number(options3.totalCount) || 0);
  return (
    '<aside class="storyboard-3d-right-sidebar storyboard-3d-asset-library-panel" id="storyboard3DRightSidebar" aria-labelledby="storyboard3DAssetLibraryTitle">\n    <div class="storyboard-3d-right-sidebar-splitter panel-resize-handle" data-storyboard-3d-right-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整模型库宽度" aria-valuemin="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH +
    '" aria-valuemax="' +
    STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH +
    '" aria-valuenow="' +
    normalizeStoryboard3DRightSidebarWidth(options3.sidebarWidth, options3.layoutWidth) +
    '" tabindex="0"></div>\n    <section class="storyboard-3d-asset-library-layout">\n      ' +
    renderAssetLibrarySidebar(options3) +
    '\n      <div class="storyboard-3d-asset-library-main">\n        <header class="storyboard-3d-asset-library-heading">\n          <div>\n            <small>场景资源</small>\n            <h2 id="storyboard3DAssetLibraryTitle">模型库</h2>\n            <p>查看模型外观后，点击卡片即可加入当前场景。</p>\n          </div>\n          <span>' +
    value121 +
    ' 个模型</span>\n        </header>\n        <div class="storyboard-3d-asset-library-content">' +
    renderAssetLibrary(options3) +
    '</div>\n      </div>\n    </section>\n  </aside>'
  );
}
function finiteMiniMapValue(value122, value123 = 0) {
  const value124 = Number(value122);
  return Number.isFinite(value124) ? value124 : value123;
}
function createStoryboard3DMiniMapCameraPose(value125, event3, value126) {
  const value127 = value125?.camera?.position || [0, 0, 0],
    x2 = value125?.camera?.target || [0, 0, -1],
    event4 = event3 ? resolveSceneCameraPose(event3) : null,
    position2 = {
      x: finiteMiniMapValue(event4?.position?.x, value126?.position?.x ?? value127[0]),
      y: finiteMiniMapValue(event4?.position?.y, value126?.position?.y ?? value127[1]),
      z: finiteMiniMapValue(event4?.position?.z, value126?.position?.z ?? value127[2]),
    },
    box2 = event4?.target || event3?.target || { x: x2[0], y: x2[1], z: x2[2] };
  return {
    position: position2,
    target: {
      x: finiteMiniMapValue(box2?.x, x2[0]),
      y: finiteMiniMapValue(box2?.y, x2[1]),
      z: finiteMiniMapValue(box2?.z, x2[2]),
    },
  };
}
function renderMiniMap(
  value128,
  value129,
  {
    expanded: expanded = false,
    zoom: zoom = 1,
    footprints: footprints = [],
    worldBounds: worldBounds = null,
    camera: camera = null,
  } = {},
) {
  const value130 = camera || createStoryboard3DMiniMapCameraPose(value129),
    { objects: objects, projection: projection } = createMiniMapLayout(
      value128,
      value129,
      undefined,
      zoom,
      footprints,
      worldBounds,
      value130,
    ),
    map3 = new Map(
      (Array.isArray(footprints) ? footprints : []).map((value131) => [value131.objectId, value131]),
    ),
    value132 = objects.map((x3) => {
      const box3 = projectStoryboard3DWorldToMiniMapRatio(
          { x: x3.transform?.position?.[0], z: x3.transform?.position?.[2] },
          projection,
        ),
        box4 = projectStoryboard3DTopViewFootprint(map3.get(x3.id)?.points, projection);
      if (box4) {
        const value133 = box4.polygon
          .map((box5) => box5.x * 100 + '% ' + box5.y * 100 + '%')
          .join(',');
        return (
          '<button type="button" class="storyboard-3d-mini-map-marker has-top-view-footprint is-' +
          escapeHtml(x3.type) +
          '" data-storyboard-3d-action="select-object" data-object-id="' +
          escapeHtml(x3.id) +
          '" data-top-view-footprint="true" title="' +
          escapeHtml(x3.name) +
          '" style="--mini-x:' +
          box4.centerX * 100 +
          '%;--mini-y:' +
          box4.centerY * 100 +
          '%;--mini-left:' +
          box4.left * 100 +
          '%;--mini-top:' +
          box4.top * 100 +
          '%;--mini-width:' +
          box4.width * 100 +
          '%;--mini-height:' +
          box4.height * 100 +
          '%;clip-path:polygon(' +
          value133 +
          ')"></button>'
        );
      }
      return (
        '<button type="button" class="storyboard-3d-mini-map-marker" data-storyboard-3d-action="select-object" data-object-id="' +
        escapeHtml(x3.id) +
        '" title="' +
        escapeHtml(x3.name) +
        '" style="--mini-x:' +
        box3.x * 100 +
        '%;--mini-y:' +
        box3.y * 100 +
        '%"></button>'
      );
    }).join(''),
    storyboard3DMiniMapCameraMarker = createStoryboard3DMiniMapCameraMarker(value130, projection),
    box6 = projectStoryboard3DWorldToMiniMapRatio(value130.position, projection);
  return (
    '<div class="storyboard-3d-mini-map-title"><span>Mini Map · 跟随视角</span><small>' +
    objects.length +
    ' 个对象 · ' +
    Math.round(zoom * 100) +
    '%</small><button type="button" data-storyboard-3d-action="toggle-mini-map" aria-label="' +
    (expanded ? '折叠 Mini Map' : '展开 Mini Map') +
    '">' +
    (expanded ? '−' : '+') +
    '</button></div>\n    <div class="storyboard-3d-mini-map-canvas">\n      <span class="storyboard-3d-mini-map-grid" aria-hidden="true" style="--mini-map-rotation:' +
    projection.rotation +
    'rad"></span>\n      ' +
    value132 +
    '\n      <span class="storyboard-3d-mini-map-camera" data-storyboard-3d-mini-map-camera style="--mini-x:' +
    box6.x * 100 +
    '%;--mini-y:' +
    box6.y * 100 +
    '%;--mini-angle:' +
    storyboard3DMiniMapCameraMarker.angle +
    'rad"></span>\n    </div>'
  );
}
function createMiniMapWorldBounds(value134, value135, value136 = []) {
  const list7 = Array.isArray(value134?.objects)
      ? value134.objects.filter((value137) => value137.visible !== false)
      : [],
    list8 = list7.map((value138) => value138.transform?.position || [0, 0, 0]),
    map4 = new Set(list7.map((value139) => value139.id)),
    list9 = (Array.isArray(value136) ? value136 : [])
      .filter((value140) => map4.has(value140?.objectId))
      .flatMap((value141) => (Array.isArray(value141?.points) ? value141.points : [])),
    value142 = value135?.camera?.position || [0, 0, 0],
    args = [
      ...list8.map((value143) => Number(value143[0]) || 0),
      ...list9.map((box7) => Number(box7.x) || 0),
      Number(value142[0]) || 0,
    ],
    args2 = [
      ...list8.map((value144) => Number(value144[2]) || 0),
      ...list9.map((value145) => Number(value145.z) || 0),
      Number(value142[2]) || 0,
    ],
    minX = Math.min(-5, ...args) - 2,
    maxX = Math.max(5, ...args) + 2,
    minZ = Math.min(-5, ...args2) - 2,
    maxZ = Math.max(5, ...args2) + 2;
  return { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
}
function createMiniMapLayout(
  value146,
  value147,
  width = { width: 140, height: 105 },
  value148 = 1,
  value149 = [],
  value150 = null,
  value151 = null,
) {
  const objects2 = Array.isArray(value146?.objects)
      ? value146.objects.filter((value152) => value152.visible !== false)
      : [],
    value153 = value150 || createMiniMapWorldBounds(value146, value147, value149),
    value154 = Math.max(0.5, Math.min(3, Number(value148) || 1)),
    event5 = value151 || createStoryboard3DMiniMapCameraPose(value147),
    x4 = finiteMiniMapValue(event5.position?.x, (value153.minX + value153.maxX) / 2),
    z2 = finiteMiniMapValue(event5.position?.z, (value153.minZ + value153.maxZ) / 2),
    value155 = (value153.maxX - value153.minX) / 2 / value154,
    value156 = (value153.maxZ - value153.minZ) / 2 / value154,
    minX2 = x4 - value155,
    maxX2 = x4 + value155,
    minZ2 = z2 - value156,
    maxZ2 = z2 + value156,
    finiteMiniMapValue2 = finiteMiniMapValue(event5.target?.x) - x4,
    finiteMiniMapValue3 = finiteMiniMapValue(event5.target?.z) - z2,
    rotation = Math.hypot(finiteMiniMapValue2, finiteMiniMapValue3) > 0.000001,
    value157 = rotation ? Math.atan2(finiteMiniMapValue3, finiteMiniMapValue2) : 0,
    projection2 = createStoryboard3DMiniMapProjection({
      worldBounds: { minX: minX2, maxX: maxX2, minZ: minZ2, maxZ: maxZ2 },
      viewport: { x: 0, y: 0, width: width.width || 140, height: width.height || 105 },
      padding: 8,
      center: { x: x4, z: z2 },
      rotation: rotation ? -Math.PI / 2 - value157 : 0,
    });
  return { objects: objects2, projection: projection2 };
}
function renderShotExplorePanel(list10 = [], value158 = 'all') {
  const value159 = {
      close: new Set(['MCU', 'CU', 'ECU']),
      medium: new Set(['MLS', 'MED']),
      wide: new Set(['EST', 'ELS', 'LS']),
    },
    list11 = list10.map((candidate, index3) => ({ candidate: candidate, index: index3 })).filter(
      ({ candidate: candidate2 }) =>
        value158 === 'all' || value159[value158]?.has(candidate2.shotSize),
    );
  return (
    '<section class="storyboard-3d-explore-panel" aria-label="镜头探索">\n    <header><div><small>SHOT EXPLORER</small><strong>镜头探索</strong></div><div class="storyboard-3d-explore-toolbar">' +
    [
      ['all', '全部'],
      ['close', '特写'],
      ['medium', '中景'],
      ['wide', '远景'],
    ]
      .map(
        ([value160, value161]) =>
          '<button type="button" data-storyboard-3d-action="filter-explore" data-explore-filter="' +
          value160 +
          '" aria-pressed="' +
          (value158 === value160) +
          '">' +
          value161 +
          '</button>',
      )
      .join('') +
    '<button type="button" data-storyboard-3d-action="regenerate-explore">重新生成</button><button type="button" data-storyboard-3d-action="close-explore" aria-label="关闭">×</button></div></header>\n    ' +
    (list11.length > 0
      ? '<div class="storyboard-3d-candidate-grid">' +
        list11.map(
          ({ candidate: candidate3, index: index4 }) =>
            '<article>\n          <div class="storyboard-3d-candidate-preview" data-candidate-preview="' +
            index4 +
            '">' +
            (candidate3.thumbnailUrl
              ? '<img src="' +
                escapeHtml(candidate3.thumbnailUrl) +
                '" alt="候选镜头 ' +
                (index4 + 1) +
                '">'
              : '<span>正在渲染候选 ' + (index4 + 1) + '</span>') +
            '</div>\n          <div><strong>' +
            escapeHtml(candidate3.shotSize + ' · ' + candidate3.shotAngle) +
            '</strong><small>' +
            Math.round(candidate3.score * 100) +
            ' 分 · ' +
            formatFocalLength(candidate3.camera.focalLength) +
            'mm</small></div>\n          <footer><button type="button" data-storyboard-3d-action="preview-candidate" data-candidate-index="' +
            index4 +
            '">主视口预览</button><button type="button" data-storyboard-3d-action="replace-with-candidate" data-candidate-index="' +
            index4 +
            '">替换当前</button><button type="button" data-storyboard-3d-action="append-candidate" data-candidate-index="' +
            index4 +
            '">添加镜头</button></footer>\n        </article>',
        ).join('') +
        '</div>'
      : '<div class="storyboard-3d-explore-empty"><strong>' +
        (list10.length > 0 ? '当前景别没有候选' : '需要至少一个可见主体') +
        '</strong><span>' +
        (list10.length > 0
          ? '切换筛选或重新生成一组机位。'
          : '从素材库添加人物或道具后，即可生成 9 个候选机位。') +
        '</span></div>') +
    '\n  </section>'
  );
}
export class Storyboard3DEditorWorkspace {
  constructor({
    projectId: projectId,
    project: project,
    onProjectChange: onProjectChange,
    onClose: onClose,
    documentObject: documentObject = globalThis.document,
    windowObject: windowObject = globalThis.window,
    binaryAssetRepository: binaryAssetRepository = null,
    modelPackApi: modelPackApi = null,
    assetThumbnailRenderer: assetThumbnailRenderer = null,
    imagePoseEstimator: imagePoseEstimator = null,
    imagePoseRetargeter: imagePoseRetargeter = null,
  } = {}) {
    ((this.projectId = String(projectId || project?.id || '')),
      (this.document = documentObject),
      (this.window = windowObject),
      (this.onProjectChange = onProjectChange),
      (this.onClose = onClose),
      (this.root = null),
      (this._message = ''),
      (this._closed = false),
      (this._serverAlertMutationObserver = null),
      (this._serverAlertResizeObserver = null),
      (this.sceneRuntime = null),
      (this.backgroundCalibrationInteraction = null),
      (this._sceneRuntimeResizeObserver = null),
      (this._gizmoDrag = null),
      (this._selectionDrag = null),
      (this._cameraDrag = null),
      (this._flyKeys = new Set()),
      (this._flyBoost = false),
      (this._flyFrame = null),
      (this._flyLastTime = 0),
      (this._flySceneView = null),
      (this._miniMapDrag = null),
      (this.miniMapExpanded = false),
      (this.miniMapZoom = 1),
      (this.miniMapWindowOffset = { x: 0, y: 0 }),
      (this._miniMapFootprints = []),
      (this._miniMapFrame = null),
      (this._miniMapPreviewSceneView = null),
      (this._miniMapRefreshFrame = null),
      (this._miniMapWindowDrag = null),
      (this.inspectorWidth = 360),
      (this._inspectorResize = null),
      (this.rightSidebarMode = Number(this.window?.innerWidth) <= 900 ? null : 'ai'),
      (this.rightSidebarWidth = null),
      (this._rightSidebarResize = null),
      (this.timelineHeight = STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT),
      (this._timelineResize = null),
      (this._suppressTimelineToggleClick = false),
      (this._runtimeError = ''),
      (this._runtimeFailureTitle = ''),
      (this.viewportControls = null),
      (this.viewportSettings = loadStoryboard3DTransformSettings(this.window?.localStorage)),
      (this.navigationSettings = loadStoryboard3DNavigationSettings(this.window?.localStorage)),
      (this.assetLibrary = createStoryboard3DAssetLibrary()),
      (this.assetQuery = ''),
      (this.assetCategory = 'all'),
      (this.assetVisibleLimit = 32),
      (this.favoriteAssetIds = new Set()),
      (this.assetThumbnailRenderer = assetThumbnailRenderer),
      (this._assetThumbnailObserver = null),
      (this._assetThumbnailQueue = Promise.resolve()),
      (this._assetThumbnailLoads = new Map()),
      (this._assetThumbnailFailures = new Set()),
      (this.characterBoneSelection = new Map()),
      (this.outlineQuery = ''),
      (this.outlineType = 'all'),
      (this.sceneEnvironmentOpen = false),
      (this.importedModelScenes = new Map()),
      (this.modelPackApi = modelPackApi || {
        getStatus: getStoryboard3DModelPackStatus,
        fetchAssetFile: fetchStoryboard3DModelPackAssetFile,
      }),
      (this.modelPackStatus = { loaded: false, installed: false, assets: [], error: '' }),
      (this._modelPackStatusPromise = null),
      (this._packAssetLoads = new Map()),
      (this.binaryAssetRepository = binaryAssetRepository || createStoryboard3DBinaryAssetRepository()),
      (this._binaryAssetHydrationPromise = null));
    const fallbackParser = createThreeStoryboard3DModelParsers({
      gltf: { urlApi: this.window?.URL || globalThis.URL },
      fbx: { urlApi: this.window?.URL || globalThis.URL },
    });
    ((this.modelParsers = {
      ...fallbackParser,
      ...createThreeWorkerBackedStoryboard3DModelParsers({
        obj: { fallbackParser: fallbackParser.obj },
        stl: { fallbackParser: fallbackParser.stl },
      }),
    }),
      (this.modelImportJob = null),
      (this.modelImportState = null),
      (this.backgroundImageControllers = new Map()),
      (this.exploreOpen = false),
      (this.exploreFilter = 'all'),
      (this.exploreVariation = 0),
      (this.shotCandidates = []),
      (this._candidateRenderToken = 0),
      (this._shotThumbnailQueue = Promise.resolve()));
    const storyboard3DTextModelSelection = resolveStoryboard3DTextModelSelection();
    ((this.aiModelId = storyboard3DTextModelSelection.modelId),
      (this.aiProvider = storyboard3DTextModelSelection.provider),
      (this._aiModelSelectorController = null),
      (this.aiState = { status: 'idle', instruction: '', voiceSupported: false }),
      (this.exportController = createStoryboard3DExportController({
        documentObject: this.document,
        windowObject: this.window,
        getProject: () => this.projectStore.getSnapshot(),
        renderFrame: (value162, value163) => this._renderShotFrame(value162, value163),
        renderVideo: (shot, args3) =>
          renderStoryboard3DShotVideo({
            ...args3,
            shot: shot,
            project: this.projectStore.getSnapshot(),
            importedModelResolver: (value164) => this.importedModelScenes.get(value164),
            windowObject: this.window,
          }),
        onComplete: ({ project: project2, options: options4, results: results }) => {
          dispatchWorkspaceEvent(this.window, 'storyboard-3d:export-complete', {
            projectId: project2.id,
            projectName: project2.name,
            options: options4,
            results: results,
          });
        },
      })),
      (this._handleClick = this._handleClick.bind(this)),
      (this._handleInput = this._handleInput.bind(this)),
      (this._handleChange = this._handleChange.bind(this)),
      (this._handleWindowKeyDown = this._handleWindowKeyDown.bind(this)),
      (this._handleWindowKeyUp = this._handleWindowKeyUp.bind(this)),
      (this._handleWindowBlur = this._handleWindowBlur.bind(this)),
      (this._handleRuntimePointerDown = this._handleRuntimePointerDown.bind(this)),
      (this._handleRuntimePointerMove = this._handleRuntimePointerMove.bind(this)),
      (this._handleRuntimePointerUp = this._handleRuntimePointerUp.bind(this)),
      (this._handleRuntimePointerCancel = this._handleRuntimePointerCancel.bind(this)),
      (this._handleRuntimePointerHover = this._handleRuntimePointerHover.bind(this)),
      (this._handleRuntimePointerLeave = this._handleRuntimePointerLeave.bind(this)),
      (this._handleRuntimeContextMenu = this._handleRuntimeContextMenu.bind(this)),
      (this._handleRuntimeWheel = this._handleRuntimeWheel.bind(this)),
      (this._handleMiniMapPointerDown = this._handleMiniMapPointerDown.bind(this)),
      (this._handleMiniMapPointerMove = this._handleMiniMapPointerMove.bind(this)),
      (this._handleMiniMapPointerUp = this._handleMiniMapPointerUp.bind(this)),
      (this._handleMiniMapWheel = this._handleMiniMapWheel.bind(this)),
      (this._handleMiniMapWindowMove = this._handleMiniMapWindowMove.bind(this)),
      (this._handleMiniMapWindowUp = this._handleMiniMapWindowUp.bind(this)),
      (this._handleInspectorResizePointerDown = this._handleInspectorResizePointerDown.bind(this)),
      (this._handleInspectorResizePointerMove = this._handleInspectorResizePointerMove.bind(this)),
      (this._handleInspectorResizePointerUp = this._handleInspectorResizePointerUp.bind(this)),
      (this._handleRightSidebarResizePointerDown =
        this._handleRightSidebarResizePointerDown.bind(this)),
      (this._handleRightSidebarResizePointerMove =
        this._handleRightSidebarResizePointerMove.bind(this)),
      (this._handleRightSidebarResizePointerUp = this._handleRightSidebarResizePointerUp.bind(this)),
      (this._handleTimelineResizePointerDown = this._handleTimelineResizePointerDown.bind(this)),
      (this._handleTimelineResizePointerMove = this._handleTimelineResizePointerMove.bind(this)),
      (this._handleTimelineResizePointerUp = this._handleTimelineResizePointerUp.bind(this)),
      (this._handleOutlineDragStart = this._handleOutlineDragStart.bind(this)),
      (this._handleOutlineDragOver = this._handleOutlineDragOver.bind(this)),
      (this._handleOutlineDrop = this._handleOutlineDrop.bind(this)),
      (this._syncServerAlertOffset = this._syncServerAlertOffset.bind(this)),
      (this.editorStore = createStoryboard3DEditorStore({ inspectorOpen: false })),
      (this.projectStore = createStoryboard3DProjectStore(project, {
        onPersist: (value165, value166) => this._persistProject(value165, value166),
      })),
      (this.viewportFocalLength =
        Number(
          getActiveStoryboard3DShot(this.projectStore.getSnapshot())?.camera?.focalLength,
        ) || 35),
      (this.commandHistory = createCommandHistory({
        context: {
          getProject: () => this.projectStore.getSnapshot(),
          replaceProject: (value167, value168 = {}) => {
            const value169 = this.projectStore.replaceProject(
              value167,
              value168.reason || 'history-command',
            );
            return (this._render(this._historyRenderOptions || undefined), value169);
          },
        },
        limit: 100,
        onChange: () => this._syncHistoryButtons(),
      })),
      (this.characterImagePoseController = createStoryboard3DCharacterImagePoseController({
        ...(imagePoseEstimator ? { estimator: imagePoseEstimator } : {}),
        ...(imagePoseRetargeter ? { retarget: imagePoseRetargeter } : {}),
        getCharacter: (value170) => {
          for (const value171 of this.projectStore.getSnapshot().scenes || []) {
            const value172 = value171.objects?.find((value173) => value173.id === value170);
            if (value172?.type === 'character') return value172;
          }
          return null;
        },
        applyPose: ({ objectId: objectId, boneOverrides: boneOverrides, confidence: confidence }) => {
          (this._executeMutation({
            type: 'apply-character-pose-from-image',
            label: 'Apply character pose from image',
            mutate: (value174) => {
              for (const value175 of value174.scenes || []) {
                const value176 = value175.objects?.find((value177) => value177.id === objectId);
                if (value176?.type !== 'character') continue;
                ((value176.boneOverrides = Object.fromEntries(
                  Object.entries(boneOverrides).map(([value178, args4]) => [value178, [...args4]]),
                )),
                  (value176.actionId = 'standing'),
                  (value176.actionTime = 0),
                  (value176.actionPlaying = false));
                break;
              }
              return value174;
            },
          }),
            this._setMessage(
              '已从参考图应用人物姿势（置信度 ' + Math.round(confidence * 100) + '%）。',
            ));
        },
        onStateChange: (value179) => this._syncCharacterImagePoseUI(value179),
      })),
      (this.shotTimelineController = createStoryboard3DShotTimelineController({
        windowObject: this.window,
        getProject: () => this.projectStore.getSnapshot(),
        getEditorState: () => this.editorStore.getSnapshot(),
        getRoot: () => this.root,
        readCurrentCamera: () => this._readCurrentCameraState(),
        getRuntime: () => this.sceneRuntime,
        getBinaryAssetRepository: () => this.binaryAssetRepository,
        getImportedModel: (value180) => this.importedModelScenes.get(value180),
        getGenerationContext: () => ({
          model: this.aiModelId,
          provider: this.aiProvider,
          assets: this.modelPackStatus.assets,
        }),
        requestGeneration: (value181) =>
          dispatchWorkspaceEvent(this.window, 'storyboard-3d:generate-layer', value181),
        importProject: (project3) =>
          dispatchWorkspaceEvent(this.window, 'storyboard-3d:save-as-copy', { project: project3 }),
        sendResults: ({ project: project4, options: options5, results: results2 }) =>
          dispatchWorkspaceEvent(this.window, 'storyboard-3d:export-complete', {
            projectId: project4.id,
            projectName: project4.name,
            options: options5,
            results: results2,
          }),
        previewSample: (value182) => this._previewShotTimelineSample(value182),
        clearPreview: () => this._clearShotTimelinePreview(),
        expandDirectorPanel: () => this._applyTimelineHeight(Math.max(this.timelineHeight, 430)),
        commitMutation: (value183) => this._executeMutation(value183),
        requestRender: () => this._render(),
        setMessage: (value184) => this._setMessage(value184),
      })));
    let value185 = null;
    const run2 = createStoryboard3DSafeToolExecutor({
      projectStore: {
        getSnapshot: () => this.projectStore.getSnapshot(),
        replaceProject: (value186) => {
          return ((value185 = value186), value186);
        },
      },
      assetLibrary: this.assetLibrary,
      readCurrentCamera: () => this._readCurrentCameraState(),
    });
    ((this.aiController = createStoryboard3DAIVoiceController({
      projectStore: this.projectStore,
      model: () => this.aiModelId,
      provider: () => this.aiProvider,
      executeTransaction: async (value187, value188) => {
        (await this._ensurePackAssetsForCommands(value187), (value185 = null));
        const args5 = await run2(value187, value188);
        return (
          args5.changed &&
            value185 &&
            this.commandHistory.execute(
              createStoryboard3DProjectMutationCommand({
                type: 'ai-scene-transaction',
                label: 'AI scene transaction',
                mutate: () => value185,
              }),
            ),
          { ...args5, project: this.projectStore.getSnapshot() }
        );
      },
      assetLibrary: this.assetLibrary,
      windowObject: this.window,
      onStateChange: (value189, value190 = {}) => {
        this.aiState = value189;
        if (value190.reason !== 'set-instruction') this._syncAIAssistant();
      },
      onError: (error11) => this._setMessage(error11?.message || String(error11)),
    })),
      (this.aiState = this.aiController.getSnapshot()),
      (this._unsubscribeProject = this.projectStore.subscribe((value191, value192) => {
        this._syncSaveStatus(value192?.saveStatus);
      })),
      (this._unsubscribeEditor = this.editorStore.subscribe(() => {
        this._syncResponsiveState();
      })));
  }
  ['mount']() {
    if (this.root || !this.document?.body) return this.root;
    const root = this.document.createElement('section');
    return (
      (root.className = 'storyboard-3d-editor-overlay'),
      (root.dataset.uiStop = '1'),
      root.setAttribute('role', 'dialog'),
      root.setAttribute('aria-modal', 'true'),
      (root.tabIndex = -1),
      root.setAttribute('aria-label', t('storyboard3d.editor.ariaLabel')),
      (this.backgroundCalibrationInteraction = createStoryboard3DBackgroundCalibrationInteraction({
        root: root,
        windowObject: this.window,
        getBackground: () =>
          getActiveStoryboard3DScene(this.projectStore.getSnapshot())?.background,
        onPreview: (value193) => this._previewBackgroundCalibrationDrag(value193),
        onCommit: (value194) => this._commitBackgroundCalibrationDrag(value194),
        onCancel: () => this._render(),
      })),
      root.addEventListener('contextmenu', containWorkspaceContextMenu),
      root.addEventListener('pointerdown', (event6) => event6.stopPropagation()),
      root.addEventListener('pointerdown', this._handleInspectorResizePointerDown),
      root.addEventListener('pointerdown', this._handleRightSidebarResizePointerDown),
      root.addEventListener('pointerdown', this._handleTimelineResizePointerDown),
      root.addEventListener('pointerdown', this._handleMiniMapPointerDown),
      root.addEventListener('wheel', (event7) => event7.stopPropagation(), {
        passive: true,
      }),
      root.addEventListener('wheel', this._handleMiniMapWheel, { passive: false }),
      root.addEventListener('click', this._handleClick),
      root.addEventListener('input', this._handleInput),
      root.addEventListener('change', this._handleChange),
      root.addEventListener('dragstart', this._handleOutlineDragStart),
      root.addEventListener('dragover', this._handleOutlineDragOver),
      root.addEventListener('drop', this._handleOutlineDrop),
      (this.root = root),
      this.document.body.appendChild(root),
      this.document.body.classList.add('storyboard-3d-editor-open'),
      this.window?.addEventListener?.('keydown', this._handleWindowKeyDown, true),
      this.window?.addEventListener?.('keyup', this._handleWindowKeyUp, true),
      this.window?.addEventListener?.('blur', this._handleWindowBlur),
      this.window?.addEventListener?.('resize', this._syncServerAlertOffset),
      this._observeServerAlert(),
      this._render(),
      (this._modelPackStatusPromise = this._loadModelPackStatus()),
      (this._binaryAssetHydrationPromise = this._hydrateBinaryAssets()),
      root.querySelector('[data-storyboard-3d-project-name]')?.focus?.(),
      root
    );
  }
  ['_observeServerAlert']() {
    const value195 = this.document?.getElementById?.('v2-server-disconnect-alert'),
      value196 = this.document?.querySelector?.('.header');
    this._syncServerAlertOffset();
    const run3 = this.window?.MutationObserver;
    value195 &&
      typeof run3 === 'function' &&
      ((this._serverAlertMutationObserver = new run3(this._syncServerAlertOffset)),
      this._serverAlertMutationObserver.observe(value195, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: true,
      }));
    const run4 = this.window?.ResizeObserver;
    if (typeof run4 === 'function') {
      this._serverAlertResizeObserver = new run4(this._syncServerAlertOffset);
      if (value195) this._serverAlertResizeObserver.observe(value195);
      if (value196) this._serverAlertResizeObserver.observe(value196);
    }
  }
  ['_syncServerAlertOffset']() {
    if (!this.root) return;
    const el = this.document?.getElementById?.('v2-server-disconnect-alert'),
      el2 = this.document?.querySelector?.('.header');
    let value197 = Math.max(0, Math.ceil(el2?.getBoundingClientRect?.().bottom || 0));
    if (el) {
      const value198 = this.window?.getComputedStyle?.(el);
      value198?.display !== 'none' &&
        value198?.visibility !== 'hidden' &&
        (value197 = Math.max(
          value197,
          Math.max(0, Math.ceil(el.getBoundingClientRect?.().bottom || 0)),
        ));
    }
    this.root.style.setProperty('--storyboard-3d-editor-top-offset', value197 + 'px');
  }
  ['_disposeSceneRuntime']() {
    (this._sceneRuntimeResizeObserver?.disconnect?.(), (this._sceneRuntimeResizeObserver = null));
    this._miniMapRefreshFrame !== null &&
      (this.window?.cancelAnimationFrame?.(this._miniMapRefreshFrame),
      (this._miniMapRefreshFrame = null));
    const el3 = this.root?.querySelector?.('[data-storyboard-3d-runtime-host]');
    (el3?.removeEventListener?.('pointerdown', this._handleRuntimePointerDown),
      el3?.removeEventListener?.('pointermove', this._handleRuntimePointerHover),
      el3?.removeEventListener?.('pointerleave', this._handleRuntimePointerLeave),
      el3?.removeEventListener?.('contextmenu', this._handleRuntimeContextMenu),
      el3?.removeEventListener?.('wheel', this._handleRuntimeWheel),
      this._cancelRuntimeSelection(),
      this._cancelRuntimeTransform(),
      this.sceneRuntime?.dispose?.(),
      (this.sceneRuntime = null),
      this.viewportControls?.destroy?.(),
      (this.viewportControls = null),
      (this._gizmoDrag = null),
      (this._selectionDrag = null),
      (this._cameraDrag = null),
      this.window?.removeEventListener?.('pointermove', this._handleRuntimePointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleRuntimePointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleRuntimePointerCancel, true));
  }
  ['_showRuntimeFailure'](value199, error12, { busy: busy = false } = {}) {
    const el4 = this.root?.querySelector?.('[data-storyboard-3d-runtime-status]');
    if (!el4) return;
    const value200 = String(error12?.message || error12 || '').trim();
    !busy &&
      ((this._runtimeFailureTitle = String(value199 || '3D 视口不可用')),
      (this._runtimeError = value200 || this._runtimeError || this._runtimeFailureTitle));
    ((el4.hidden = false),
      (el4.dataset.state = busy ? 'rebuilding' : 'error'),
      el4.replaceChildren?.());
    if (typeof this.document?.createElement !== 'function') {
      el4.textContent = value200 ? value199 + '：' + value200 : value199;
      return;
    }
    const el5 = this.document.createElement('strong');
    ((el5.textContent = value199), el4.appendChild(el5));
    if (value200) {
      const el6 = this.document.createElement('span');
      ((el6.textContent = value200), el4.appendChild(el6));
    }
    if (!busy) {
      const el7 = this.document.createElement('button');
      ((el7.type = 'button'),
        el7.setAttribute('data-storyboard-3d-action', 'rebuild-viewport'),
        (el7.textContent = '重建视口'),
        el4.appendChild(el7));
    }
  }
  ['_hideRuntimeFailure']() {
    const el8 = this.root?.querySelector?.('[data-storyboard-3d-runtime-status]');
    if (!el8) return;
    ((el8.hidden = true),
      el8.removeAttribute?.('data-state'),
      el8.replaceChildren?.(),
      (this._runtimeFailureTitle = ''));
  }
  ['_rebuildSceneRuntime']() {
    if (this._closed || !this.root) return false;
    const value201 = this.projectStore.getSnapshot(),
      value202 = this.editorStore.getSnapshot();
    (this._disposeSceneRuntime(),
      (this._runtimeError = ''),
      (this._runtimeFailureTitle = ''),
      this._showRuntimeFailure('正在重建 3D 视口…', '', { busy: true }));
    const value203 = this._mountSceneRuntime(value201, value202);
    if (value203) this._setMessage('3D 视口已重建。');
    return value203;
  }
  ['_mountSceneRuntime'](project5, selectedObjectIds) {
    const container = this.root?.querySelector?.('[data-storyboard-3d-runtime-host]');
    if (!container) return false;
    let sceneRuntime = null;
    try {
      ((sceneRuntime = createStoryboard3DSceneRuntime({
        container: container,
        importedModelResolver: (value204) => this.importedModelScenes.get(value204) || null,
        onVisualChange: () => this._scheduleMiniMapRefresh(),
      })),
        sceneRuntime.sync({
          project: project5,
          sceneId: project5.activeSceneId,
          selectedObjectIds: selectedObjectIds.selectedObjectIds,
          activeTool: selectedObjectIds.activeTool,
        }),
        container.addEventListener('pointerdown', this._handleRuntimePointerDown),
        container.addEventListener('pointermove', this._handleRuntimePointerHover),
        container.addEventListener('pointerleave', this._handleRuntimePointerLeave),
        container.addEventListener('contextmenu', this._handleRuntimeContextMenu),
        container.addEventListener('wheel', this._handleRuntimeWheel, { passive: false }),
        (this.sceneRuntime = sceneRuntime),
        this._scheduleMiniMapRefresh(),
        (this.viewportControls = createStoryboard3DViewportControlSystem({
          sceneRuntime: sceneRuntime,
          initialSceneView: sceneRuntime.getSceneView(),
          initialSettings: this.viewportSettings,
          applyViewState: (value205) => sceneRuntime.commitSceneView(value205.sceneView),
          onChange: (value206, value207) => {
            ((this.viewportSettings = value206.settings),
              sceneRuntime.setViewportUIPatch?.(
                this.viewportControls?.getDirectorUIPatch?.() || {},
              ));
            for (const el9 of this.root?.querySelectorAll?.(
              '[data-storyboard-3d-action="set-viewport-view"]',
            ) || []) {
              const value208 = el9.dataset.view === value206.viewMode;
              (el9.classList?.toggle?.('is-active', value208),
                el9.setAttribute?.('aria-pressed', String(value208)));
            }
            if (value207?.reason === 'settings') this._syncViewportSettingControls();
          },
          onContextStateChange: (value209, value210) => {
            if (value209.state === 'lost')
              this._setMessage('WebGL 上下文已丢失，正在等待浏览器恢复。');
            if (value209.state === 'ready' && value209.lossCount > 0)
              this._setMessage('WebGL 上下文已恢复。');
            value209.state === 'error' &&
              ((this._runtimeError =
                value210?.error?.message || String(value210?.error || 'WebGL 上下文恢复失败')),
              this._showRuntimeFailure('WebGL 恢复失败', this._runtimeError));
          },
        })),
        sceneRuntime.setViewportUIPatch(this.viewportControls.getDirectorUIPatch()),
        this._restoreViewportFocalLength(),
        (this._runtimeError = ''),
        (this._runtimeFailureTitle = ''),
        this._hideRuntimeFailure());
      const run5 = () => {
          const box8 = container.getBoundingClientRect?.();
          (sceneRuntime.resize(
            Math.max(1, Math.round(box8?.width || container.clientWidth || 1)),
            Math.max(1, Math.round(box8?.height || container.clientHeight || 1)),
          ),
            sceneRuntime.renderNow());
        },
        handler3 = this.window?.ResizeObserver;
      typeof handler3 === 'function' &&
        ((this._sceneRuntimeResizeObserver = new handler3(run5)),
        this._sceneRuntimeResizeObserver.observe(container));
      run5();
      const activeStoryboard3DScene = getActiveStoryboard3DScene(project5);
      return (
        activeStoryboard3DScene?.shots?.some((enabled11) => !enabled11.thumbnailUrl) &&
          this.window?.setTimeout?.(() => {
            if (!this._closed) void this._generateMissingShotThumbnails(activeStoryboard3DScene.id);
          }, 0),
        true
      );
    } catch (error13) {
      ((this._runtimeError = error13?.message || String(error13)),
        (this._runtimeFailureTitle = '3D 视口初始化失败'));
      if (this.sceneRuntime === sceneRuntime) this._disposeSceneRuntime();
      else sceneRuntime?.dispose?.();
      return (this._showRuntimeFailure('3D 视口初始化失败', this._runtimeError), false);
    }
  }
  async ['_renderShotCandidatePreviews'](project6, selectedObjectIds2) {
    const enabled12 = this.sceneRuntime;
    if (!enabled12) return;
    const value211 = ++this._candidateRenderToken,
      value212 = this.window?.URL || globalThis.URL;
    for (let value213 = 0; value213 < this.shotCandidates.length; value213 += 1) {
      const value214 = this.shotCandidates[value213];
      if (value214.thumbnailUrl || value211 !== this._candidateRenderToken) continue;
      const project7 = structuredClone(project6),
        sceneId = getActiveStoryboard3DScene(project7),
        activeStoryboard3DShot = getActiveStoryboard3DShot(project7);
      if (!sceneId || !activeStoryboard3DShot) continue;
      ((activeStoryboard3DShot.camera = structuredClone(value214.camera)),
        enabled12.sync({
          project: project7,
          sceneId: sceneId.id,
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        enabled12.renderNow());
      try {
        const value215 = await enabled12.captureBlob({ includeEditorOverlays: false });
        if (value211 !== this._candidateRenderToken) return;
        if (value215 && typeof value212?.createObjectURL === 'function') {
          value214.thumbnailUrl = value212.createObjectURL(value215);
          const el10 = this.root?.querySelector?.('[data-candidate-preview="' + value213 + '"]');
          el10 &&
            (el10.innerHTML =
              '<img src="' +
              escapeHtml(value214.thumbnailUrl) +
              '" alt="候选镜头 ' +
              (value213 + 1) +
              '">');
        }
      } catch (error14) {
        const el11 = this.root?.querySelector?.('[data-candidate-preview="' + value213 + '"]');
        if (el11) el11.textContent = error14?.message || '候选预览失败';
      }
    }
    value211 === this._candidateRenderToken &&
      this.sceneRuntime === enabled12 &&
      (enabled12.sync({
        project: project6,
        sceneId: project6.activeSceneId,
        selectedObjectIds: selectedObjectIds2.selectedObjectIds,
        activeTool: selectedObjectIds2.activeTool,
      }),
      enabled12.renderNow());
  }
  ['_clearShotCandidates']() {
    this._candidateRenderToken += 1;
    const value216 = this.window?.URL || globalThis.URL;
    (this.shotCandidates.forEach((value217) => {
      if (value217.thumbnailUrl) value216?.revokeObjectURL?.(value217.thumbnailUrl);
    }),
      (this.shotCandidates = []));
  }
  async ['_renderShotFrame'](shot2, { width: width2, height: height } = {}) {
    return renderStoryboard3DShotFrame({
      shot: shot2,
      width: width2,
      height: height,
      runtime: this.sceneRuntime,
      getProject: () => this.projectStore.getSnapshot(),
      getEditorState: () => this.editorStore.getSnapshot(),
      getHost: () => this.root?.querySelector?.('[data-storyboard-3d-runtime-host]'),
      windowObject: this.window,
    });
  }
  ['_generateShotThumbnail'](value218, value219) {
    return (
      (this._shotThumbnailQueue = this._shotThumbnailQueue
        .catch(() => false)
        .then(() => this._generateShotThumbnailNow(value218, value219))),
      this._shotThumbnailQueue
    );
  }
  async ['_generateShotThumbnailNow'](sceneId2, shotId) {
    if (this._closed || !this.sceneRuntime) return false;
    const value220 = this.projectStore.getSnapshot(),
      value221 = value220.scenes.find((value222) => value222.id === sceneId2),
      enabled13 = value221?.shots?.find((value223) => value223.id === shotId);
    if (!enabled13) return false;
    const storyboard3DShotThumbnailToken = createStoryboard3DShotThumbnailToken(sceneId2, enabled13);
    try {
      const value224 = await this._renderShotFrame(enabled13, { width: 320, height: 180 }),
        box9 = this.document?.createElement?.('canvas');
      if (!box9?.getContext) return false;
      ((box9.width = 320),
        (box9.height = 180),
        box9.getContext('2d')?.drawImage?.(value224?.image || value224, 0, 0, 320, 180));
      const previewUrl = box9.toDataURL?.('image/jpeg', 0.78) || '';
      value224?.close?.();
      if (!previewUrl) return false;
      const storyboard3DShotThumbnail = applyStoryboard3DShotThumbnail(
        this.projectStore.getSnapshot(),
        storyboard3DShotThumbnailToken,
        previewUrl,
        { now: Date.now() },
      );
      if (!storyboard3DShotThumbnail.applied) return false;
      return (
        this.projectStore.replaceProject(storyboard3DShotThumbnail.project, 'shot-thumbnail'),
        this._render(),
        dispatchWorkspaceEvent(this.window, 'storyboard-3d:preview-updated', {
          projectId: this.projectId,
          sceneId: sceneId2,
          shotId: shotId,
          previewUrl: previewUrl,
        }),
        true
      );
    } catch (error15) {
      return (this._setMessage(error15?.message || String(error15)), false);
    }
  }
  async ['_generateMissingShotThumbnails'](value225) {
    const value226 = this.projectStore
        .getSnapshot()
        .scenes.find((value227) => value227.id === value225),
      value228 = (value226?.shots || [])
        .filter((enabled14) => !enabled14.thumbnailUrl)
        .map((value229) => value229.id);
    for (const value230 of value228) {
      if (this._closed || !this.sceneRuntime) break;
      await this._generateShotThumbnail(value225, value230);
    }
  }
  ['_syncHistoryButtons']() {
    const enabled15 = this.commandHistory?.getSnapshot?.() || {},
      el12 = this.root?.querySelector?.('[data-storyboard-3d-action="undo"]'),
      el13 = this.root?.querySelector?.('[data-storyboard-3d-action="redo"]');
    if (el12) el12.disabled = !enabled15.canUndo;
    if (el13) el13.disabled = !enabled15.canRedo;
  }
  ['_readCurrentCameraState']() {
    const value231 = this.sceneRuntime?.readCurrentCamera?.();
    if (value231?.position && value231?.forward) {
      const target2 = this.sceneRuntime?.getSceneView?.(),
        count4 = Number(this.sceneRuntime?.getViewportFocalLength?.());
      return {
        position: [value231.position.x, value231.position.y, value231.position.z],
        target: target2?.target
          ? [target2.target.x, target2.target.y, target2.target.z]
          : [
              value231.position.x + value231.forward.x * 10,
              value231.position.y + value231.forward.y * 10,
              value231.position.z + value231.forward.z * 10,
            ],
        focalLength:
          Number.isFinite(count4) && count4 > 0 ? count4 : Number(value231.focalLength) || 35,
        near: 0.1,
        far: 1000,
        aspectRatio: '16:9',
      };
    }
    return getActiveStoryboard3DShot(this.projectStore.getSnapshot())?.camera || null;
  }
  ['_previewFocalLength'](value232) {
    const focalLength = getStoryboard3DFocalPreset(value232),
      value233 = this.projectStore.getSnapshot(),
      scene2 = getActiveStoryboard3DScene(value233),
      enabled16 = this._readCurrentCameraState();
    if (!scene2 || !enabled16) return null;
    const camera3 = setStoryboard3DCameraFocalLength(enabled16, focalLength),
      guardStoryboard3DBackgroundCameraChange2 = guardStoryboard3DBackgroundCameraChange(
        scene2.background,
        camera3,
      );
    if (!guardStoryboard3DBackgroundCameraChange2.allowed)
      return (this._setMessage(guardStoryboard3DBackgroundCameraChange2.reason), null);
    ((this.viewportFocalLength = focalLength),
      this.sceneRuntime?.setViewportFocalLength?.(focalLength));
    const el14 = this.root?.querySelector?.('[data-storyboard-3d-focal-slider]');
    if (el14) el14.value = String(resolveStoryboard3DFocalPresetIndex(focalLength));
    el14?.setAttribute?.('aria-valuetext', focalLength + 'mm');
    const el15 = this.root?.querySelector?.('[data-storyboard-3d-focal-output]');
    if (el15) el15.textContent = focalLength + 'mm';
    this.root
      ?.querySelectorAll?.('.storyboard-3d-focal-ticks [data-focal-length]')
      ?.forEach?.((el16) => {
        el16.classList.toggle('is-active', Number(el16.dataset.focalLength) === focalLength);
      });
    const el17 = this.root?.querySelector?.('.storyboard-3d-viewport-hud > strong');
    if (el17) el17.textContent = focalLength + 'mm';
    return { camera: camera3, focalLength: focalLength, scene: scene2 };
  }
  ['_commitFocalLength'](value234) {
    return Boolean(this._previewFocalLength(value234));
  }
  ['_restoreViewportFocalLength']() {
    const value235 = Number(this.viewportFocalLength),
      enabled17 = this._readCurrentCameraState();
    if (!Number.isFinite(value235) || !enabled17) return false;
    return this.sceneRuntime?.setViewportFocalLength?.(value235) === true;
  }
  ['_previewShotTimelineSample'](enabled18) {
    if (!enabled18 || !this.sceneRuntime) return;
    (this.sceneRuntime.previewTimelineSample?.(enabled18),
      (this._miniMapPreviewSceneView = null),
      this._scheduleMiniMapRefresh());
  }
  ['_clearShotTimelinePreview']() {
    (this.sceneRuntime?.clearPreviews?.(),
      (this._miniMapPreviewSceneView = null),
      this._scheduleMiniMapRefresh());
  }
  ['_syncAIAssistant']() {
    const enabled19 = this.root?.querySelector?.('[data-storyboard-3d-ai-panel]');
    if (!enabled19) return;
    (this._aiModelSelectorController?.destroy?.(),
      (this._aiModelSelectorController = null),
      (enabled19.outerHTML = renderAIAssistant({
        ...this.aiState,
        modelId: this.aiModelId,
        provider: this.aiProvider,
        canUndoAI: this.commandHistory.getSnapshot().nextUndoLabel === 'AI scene transaction',
      })),
      this._bindAIAssistantModelSelector());
  }
  ['_bindAIAssistantModelSelector']() {
    (this._aiModelSelectorController?.destroy?.(), (this._aiModelSelectorController = null));
    const el18 = this.root?.querySelector?.(
      '.storyboard-3d-ai-assistant [data-aigen-text-model-selector]',
    );
    if (!el18) return;
    ((this._aiModelSelectorController = bindAIGenTextModelSelector(el18, {
      modelId: this.aiModelId,
      provider: this.aiProvider,
      getDisplayModelName: getDisplayModelName,
      documentObject: this.document,
      onChange: ({ modelId: modelId2 }) => {
        const storyboard3DTextModelSelection2 = resolveStoryboard3DTextModelSelection(modelId2);
        ((this.aiModelId = storyboard3DTextModelSelection2.modelId),
          (this.aiProvider = storyboard3DTextModelSelection2.provider));
        const el19 = this.root?.querySelector?.('[data-storyboard-3d-action="run-ai-command"]');
        if (el19) {
          const value236 = ['planning', 'executing', 'starting', 'listening', 'transcribing', 'stopping'].includes(this.aiState.status);
          el19.disabled = value236 || !this.aiProvider;
        }
      },
    })),
      el18.querySelectorAll?.('.node-model-submenu')?.forEach((el20) => {
        el20.dataset.nodeSubmenuPlacement = 'viewport-left';
      }));
  }
  ['_syncViewportSettingControls']() {
    for (const el21 of this.root?.querySelectorAll?.('[data-storyboard-3d-viewport-setting]') || []) {
      const value237 = el21.getAttribute('data-storyboard-3d-viewport-setting');
      if (el21.type === 'checkbox') el21.checked = this.viewportSettings[value237] === true;
      else {
        if (value237 === 'rotationSnapDegrees')
          el21.value = String(
            Math.round((this.viewportSettings.rotationSnap * 180) / Math.PI),
          );
        else {
          if (value237 in this.viewportSettings)
            el21.value = String(this.viewportSettings[value237]);
        }
      }
    }
  }
  ['_syncNavigationSettingControls']() {
    const preset =
      STORYBOARD_3D_NAVIGATION_PRESETS[this.navigationSettings.preset] ||
      STORYBOARD_3D_NAVIGATION_PRESETS.unity;
    for (const el22 of this.root?.querySelectorAll?.('[data-storyboard-3d-navigation-preset]') || []) {
      const value238 = el22.value === preset.id;
      ((el22.checked = value238),
        el22.closest('.storyboard-3d-navigation-preset')?.classList?.toggle?.(
          'is-active',
          value238,
        ));
    }
    for (const el23 of this.root?.querySelectorAll?.('[data-storyboard-3d-navigation-setting]') ||
      []) {
      const value239 = el23.getAttribute('data-storyboard-3d-navigation-setting');
      if (el23.type === 'checkbox') el23.checked = this.navigationSettings[value239] === true;
      else el23.value = String(this.navigationSettings[value239]);
      const el24 = this.root?.querySelector?.(
        '[data-storyboard-3d-navigation-output="' + value239 + '"]',
      );
      if (el24) el24.textContent = Number(this.navigationSettings[value239]).toFixed(2) + '×';
    }
    const el25 = this.root?.querySelector?.('[data-storyboard-3d-navigation-current]');
    if (el25) el25.textContent = preset.label;
    for (const el26 of this.root?.querySelectorAll?.('[data-storyboard-3d-tool-shortcut]') || []) {
      const value240 = el26.getAttribute('data-storyboard-3d-tool-shortcut'),
        storyboard3DToolShortcut = getStoryboard3DToolShortcut(preset.id, value240),
        el27 = el26.querySelector?.('.storyboard-3d-control-shortcut');
      if (el27) el27.textContent = storyboard3DToolShortcut;
      const value241 = el26.getAttribute('aria-label') || value240;
      el26.setAttribute(
        'title',
        storyboard3DToolShortcut ? value241 + ' (' + storyboard3DToolShortcut + ')' : value241,
      );
    }
    const el28 = this.root?.querySelector?.('.storyboard-3d-navigation-status:not(.is-fly-mode)');
    el28 && (el28.textContent = getStoryboard3DNavigationHelpText({ preset: preset.id }));
  }
  ['_saveNavigationSettings'](value242) {
    ((this.navigationSettings = saveStoryboard3DNavigationSettings(
      value242,
      this.window?.localStorage,
    )),
      this._syncNavigationSettingControls());
  }
  ['_saveTransformSettings'](value243) {
    return (
      (this.viewportSettings = saveStoryboard3DTransformSettings(
        value243,
        this.window?.localStorage,
      )),
      this._syncViewportSettingControls(),
      this.viewportSettings
    );
  }
  ['_syncModelImportStatus']() {
    const el29 = this.root?.querySelector?.('[data-storyboard-3d-import-status]');
    el29 &&
      this.modelImportState &&
      (el29.textContent =
        (this.modelImportState.fileName || '模型') +
        ' · ' +
        this.modelImportState.status +
        ' · ' +
        Math.round((this.modelImportState.progress || 0) * 100) +
        '%');
  }
  ['_syncCharacterImagePoseUI'](response4) {
    const value244 = String(response4?.objectId || ''),
      el30 = [...(this.root?.querySelectorAll?.('[data-storyboard-3d-character-pose]') || [])].find(
        (el31) => el31.dataset.objectId === value244,
      );
    if (!el30) return;
    const enabled20 = response4.status === 'running',
      value245 = this.projectStore
        .getSnapshot()
        .scenes?.flatMap((value246) => value246.objects || [])
        .find((value247) => value247.id === value244 && value247.type === 'character'),
      enabled21 = Object.keys(value245?.boneOverrides || {}).length > 0;
    ((el30.dataset.poseStatus = response4.status || 'idle'),
      (el30.dataset.hasPose = String(enabled21)),
      el30.setAttribute('aria-busy', String(enabled20)));
    const el32 = el30.querySelector('[data-storyboard-3d-action="extract-character-pose"]');
    el32 &&
      ((el32.disabled = enabled20), (el32.textContent = enabled20 ? '识别中…' : '从图片提取姿势'));
    const el33 = el30.querySelector(
      '[data-storyboard-3d-action="reset-character-pose"], [data-storyboard-3d-action="cancel-character-pose"]',
    );
    el33 &&
      (el33.setAttribute(
        'data-storyboard-3d-action',
        enabled20 ? 'cancel-character-pose' : 'reset-character-pose',
      ),
      (el33.disabled = !enabled20 && !enabled21),
      (el33.textContent = enabled20 ? '取消识别' : '重置骨骼'));
    const el34 = el30.querySelector('[data-storyboard-3d-character-pose-status]');
    if (el34) el34.textContent = getCharacterPoseStatusText(response4);
  }
  ['_executeMutation']({ type: type3, label: label4, mutate: mutate, renderOptions: renderOptions = null }) {
    const value248 = this._historyRenderOptions;
    this._historyRenderOptions = renderOptions;
    try {
      return this.commandHistory.execute(
        createStoryboard3DProjectMutationCommand({ type: type3, label: label4, mutate: mutate }),
      );
    } finally {
      this._historyRenderOptions = value248;
    }
  }
  ['_previewBackgroundCalibrationDrag'](enabled22) {
    const value249 = this.projectStore.getSnapshot(),
      activeStoryboard3DShot2 = getActiveStoryboard3DShot(value249);
    if (!enabled22?.imageUrl || !activeStoryboard3DShot2?.camera) return;
    this.sceneRuntime?.previewCamera?.(
      deriveStoryboard3DBackgroundCamera(enabled22, activeStoryboard3DShot2.camera),
    );
  }
  ['_commitBackgroundCalibrationDrag'](horizonY) {
    this._executeMutation({
      type: 'adjust-background-perspective',
      label: 'Adjust background perspective',
      mutate: (value250) => {
        const activeStoryboard3DScene2 = getActiveStoryboard3DScene(value250),
          activeStoryboard3DShot3 = getActiveStoryboard3DShot(value250);
        if (!activeStoryboard3DScene2?.background) return value250;
        const updateStoryboard3DBackgroundCalibration2 = updateStoryboard3DBackgroundCalibration(
          activeStoryboard3DScene2.background,
          {
            horizonY: horizonY.horizonY,
            vanishingPoint: [...horizonY.vanishingPoint],
            calibrationMethod: 'manual',
            calibrationConfidence: 1,
          },
        );
        if (activeStoryboard3DShot3?.camera) {
          const storyboard3DBackgroundCamera = deriveStoryboard3DBackgroundCamera(
            updateStoryboard3DBackgroundCalibration2,
            activeStoryboard3DShot3.camera,
          );
          (setStoryboard3DShotInitialCamera(
            activeStoryboard3DScene2,
            activeStoryboard3DShot3,
            storyboard3DBackgroundCamera,
          ),
            (activeStoryboard3DScene2.background = setStoryboard3DBackgroundCameraLock(
              updateStoryboard3DBackgroundCalibration2,
              updateStoryboard3DBackgroundCalibration2.lockedCamera,
              activeStoryboard3DShot3.camera,
            )));
        } else activeStoryboard3DScene2.background = updateStoryboard3DBackgroundCalibration2;
        return value250;
      },
    });
  }
  ['_deleteObjects'](value251) {
    const type4 = [
      ...new Set(
        (Array.isArray(value251) ? value251 : [value251])
          .map((value252) => String(value252 || '').trim())
          .filter(Boolean),
      ),
    ];
    if (type4.length === 0) return false;
    const value253 = this.projectStore
        .getSnapshot()
        .scenes.find(
          (value254) => value254.id === this.projectStore.getSnapshot().activeSceneId,
        ),
      value255 = value253 ? directorDeletionImpact(value253, type4) : '';
    (this._executeMutation({
      type: type4.length === 1 ? 'delete-object' : 'delete-objects',
      label: type4.length === 1 ? 'Delete object' : 'Delete objects',
      mutate: (value256) => {
        const count5 = value256.scenes.findIndex(
          (value257) => value257.id === value256.activeSceneId,
        );
        if (count5 < 0) return value256;
        let objects3 = value256.scenes[count5];
        return (
          type4.forEach((value258) => {
            const enabled23 = objects3.objects?.find((value259) => value259.id === value258);
            if (!enabled23) return;
            if (enabled23.type === 'camera') {
              const value260 = objects3.shots?.find((value261) => value261.cameraId === value258);
              objects3 = value260
                ? deleteStoryboard3DShot(objects3, value260.id)
                : {
                    ...objects3,
                    objects: objects3.objects.filter((value262) => value262.id !== value258),
                  };
              return;
            }
            if (enabled23.type === 'group') {
              objects3 = deleteStoryboard3DSceneGroup(objects3, value258, { deleteChildren: false });
              return;
            }
            objects3 = {
              ...objects3,
              objects: objects3.objects.filter((value263) => value263.id !== value258),
            };
          }),
          (value256.scenes[count5] = objects3),
          value256
        );
      },
    }),
      this._setSelectedObjects([]));
    if (value255) this._setMessage(value255);
    return (this._render(), true);
  }
  ['_activateShotForCamera'](value264) {
    const value265 = this.projectStore.getSnapshot(),
      activeStoryboard3DScene3 = getActiveStoryboard3DScene(value265),
      enabled24 = activeStoryboard3DScene3?.shots?.find(
        (value266) => value266.cameraId === value264,
      );
    if (!enabled24) return true;
    const guardStoryboard3DBackgroundCameraChange3 = guardStoryboard3DBackgroundCameraChange(
      activeStoryboard3DScene3.background,
      enabled24.camera,
    );
    if (!guardStoryboard3DBackgroundCameraChange3.allowed)
      return (this._setMessage(guardStoryboard3DBackgroundCameraChange3.reason), false);
    return (this.projectStore.selectShot(enabled24.id), true);
  }
  ['_focusCameraObject'](enabled25) {
    if (!enabled25) return;
    const value267 = () => this.viewportControls?.focusObject?.('camera', enabled25),
      handler4 =
        this.window?.requestAnimationFrame?.bind(this.window) ||
        globalThis.requestAnimationFrame?.bind(globalThis);
    if (handler4) handler4(value267);
    else queueMicrotask(value267);
  }
  ['_recordTransformedKeyframes'](value268, value269) {
    if (typeof this.projectStore?.getSnapshot !== 'function') {
      this.shotTimelineController?.recordObjectTransforms?.(value268, value269);
      return;
    }
    const value270 = this.projectStore.getSnapshot(),
      activeStoryboard3DScene4 = getActiveStoryboard3DScene(value270),
      activeStoryboard3DShot4 = getActiveStoryboard3DShot(value270),
      value271 = activeStoryboard3DShot4?.cameraId && value268?.[activeStoryboard3DShot4.cameraId];
    if (value271)
      this.shotTimelineController?.recordCameraKeyframe?.(activeStoryboard3DShot4.camera);
    const value272 = Object.fromEntries(
      Object.entries(value268 || {}).filter(
        ([value273]) =>
          activeStoryboard3DScene4?.objects?.find((value274) => value274.id === value273)?.type !== 'camera',
      ),
    );
    Object.keys(value272).length > 0 &&
      this.shotTimelineController?.recordObjectTransforms?.(value272, value269);
  }
  ['_commitObjectTransforms']({
    sceneId: sceneId3,
    transforms: transforms,
    activeTool: activeTool,
    label: label5,
  }) {
    const run6 = () => {
      const value275 = this.commandHistory.execute(
        createStoryboard3DTransformCommand({
          sceneId: sceneId3,
          transforms: transforms,
          label: label5,
          mergeKey: false,
        }),
      );
      if (value275 !== false) this._recordTransformedKeyframes(transforms, activeTool);
      return value275;
    };
    if (
      this.shotTimelineController?.isAutoKeyEnabled?.() &&
      typeof this.commandHistory.runTransaction === 'function'
    )
      return this.commandHistory.runTransaction(label5 + ' + Auto Key', run6);
    return run6();
  }
  ['_applyDetectedBackgroundCalibration'](
    value276,
    { type: type = 'calibrate-background', label: label = 'Calibrate background' } = {},
  ) {
    const camera4 = this._readCurrentCameraState?.() || createDefaultStoryboard3DCameraState();
    this._executeMutation({
      type: type,
      label: label,
      mutate: (value277) => {
        const count6 = value277.scenes.findIndex(
          (value278) => value278.id === value277.activeSceneId,
        );
        if (count6 < 0) return value277;
        let scene3 = value277.scenes[count6],
          enabled26 = scene3.shots?.find((value279) => value279.id === scene3.activeShotId);
        !enabled26 &&
          ((scene3 = appendShotFromCurrentView({ scene: scene3, camera: camera4 })),
          (value277.scenes[count6] = scene3),
          (enabled26 = scene3.shots.find((value280) => value280.id === scene3.activeShotId)));
        if (!enabled26) return value277;
        const updateStoryboard3DBackgroundCalibration3 = updateStoryboard3DBackgroundCalibration(
            scene3.background,
            value276,
          ),
          storyboard3DBackgroundCamera2 = deriveStoryboard3DBackgroundCamera(
            updateStoryboard3DBackgroundCalibration3,
            enabled26.camera,
          );
        return (
          setStoryboard3DShotInitialCamera(scene3, enabled26, storyboard3DBackgroundCamera2),
          (scene3.background = setStoryboard3DBackgroundCameraLock(
            updateStoryboard3DBackgroundCalibration3,
            true,
            enabled26.camera,
          )),
          value277
        );
      },
    });
    const value281 =
      this.viewportControls?.updateSettings?.({ groundLock: true }) ||
      normalizeStoryboard3DViewportSettings({ ...this.viewportSettings, groundLock: true });
    (this._saveTransformSettings(value281),
      this.sceneRuntime?.setViewportUIPatch?.(
        this.viewportControls?.getDirectorUIPatch?.() || {},
      ),
      (this.sceneEnvironmentOpen = true));
  }
  async ['_reanalyzeActiveBackground']() {
    try {
      const activeStoryboard3DScene5 = getActiveStoryboard3DScene(this.projectStore.getSnapshot()),
        enabled27 = activeStoryboard3DScene5?.background?.binaryAssetId;
      if (!activeStoryboard3DScene5 || !enabled27) throw new Error('当前背景缺少可重新分析的本地原图。');
      this._setMessage('正在分析地面、地平线和消失点…');
      const value282 = await this.binaryAssetRepository.get(enabled27),
        restoreStoryboard3DStoredFile2 = restoreStoryboard3DStoredFile(
          value282?.primaryFile,
          this.window,
        );
      if (!restoreStoryboard3DStoredFile2) throw new Error('无法读取当前背景原图。');
      const analyzeStoryboard3DBackgroundImage2 = await analyzeStoryboard3DBackgroundImage(
        restoreStoryboard3DStoredFile2,
        {
          documentObject: this.document,
          imageBitmapFactory:
            typeof this.window?.createImageBitmap === 'function'
              ? this.window.createImageBitmap.bind(this.window)
              : undefined,
        },
      );
      (this._applyDetectedBackgroundCalibration(analyzeStoryboard3DBackgroundImage2, {
        type: 'reanalyze-background',
        label: 'Reanalyze background',
      }),
        this._setMessage(
          '背景透视已重新匹配并锁定，当前匹配度 ' +
            Math.round(analyzeStoryboard3DBackgroundImage2.calibrationConfidence * 100) +
            '%。',
        ));
    } catch (error16) {
      this._setMessage(error16?.message || String(error16));
    }
  }
  ['_getBackgroundImageController'](value283) {
    const value284 = String(value283 || '');
    return (
      !this.backgroundImageControllers.has(value284) &&
        this.backgroundImageControllers.set(
          value284,
          createStoryboard3DBackgroundImageController({
            urlApi: this.window?.URL || globalThis.URL,
          }),
        ),
      this.backgroundImageControllers.get(value284)
    );
  }
  ['_setImportedModelScene'](value285, value286, value287 = null) {
    const scene4 = this.importedModelScenes.get(value285);
    (scene4 &&
      scene4 !== value286 &&
      disposeCancelledStoryboard3DModelImportResult({ parsed: { scene: scene4 } }),
      this.importedModelScenes.set(value285, setStoryboard3DModelNormalization(value286, value287)));
  }
  ['_getAssetThumbnailRenderer']() {
    return (
      !this.assetThumbnailRenderer &&
        (this.assetThumbnailRenderer = createStoryboard3DAssetThumbnailRenderer({
          documentObject: this.document,
        })),
      this.assetThumbnailRenderer
    );
  }
  ['_syncAssetThumbnail'](value288, value289, value290 = 'ready') {
    const value291 =
      '[data-storyboard-3d-asset-thumbnail][data-asset-id="' +
      (globalThis.CSS?.escape?.(value288) || value288) +
      '"]';
    this.root?.querySelectorAll?.(value291)?.forEach((el35) => {
      el35.dataset.thumbnailStatus = value290;
      if (value289) {
        const error17 = this.assetLibrary.find(value288),
          value292 = this.document.createElement('img');
        ((value292.src = value289),
          (value292.alt = (error17?.name || '模型') + ' 模型预览'),
          el35.replaceChildren(value292));
      } else {
        if (value290 === 'unavailable') {
          const el36 = this.document.createElement('small');
          ((el36.textContent = '暂无预览'), el35.replaceChildren(el36));
        }
      }
    });
  }
  ['_ensureAssetThumbnail'](value293) {
    const clayColor = this.assetLibrary.find(value293);
    if (!clayColor || this._assetThumbnailFailures.has(clayColor.id)) return Promise.resolve('');
    const value294 = storyboard3DAssetThumbnailCache.get(clayColor);
    if (value294)
      return (this._syncAssetThumbnail(clayColor.id, value294), Promise.resolve(value294));
    if (this._assetThumbnailLoads.has(clayColor.id))
      return this._assetThumbnailLoads.get(clayColor.id);
    const enabled28 =
      clayColor.source?.kind === 'builtin'
        ? createStoryboard3DBuiltinAssetThumbnailModel(clayColor.source.assetId || clayColor.id, {
            clayColor: clayColor.tint,
          })
        : null;
    if (
      clayColor.source?.kind !== 'pack' &&
      !this.importedModelScenes.has(clayColor.id) &&
      !enabled28
    )
      return (
        this._assetThumbnailFailures.add(clayColor.id),
        this._syncAssetThumbnail(clayColor.id, '', 'unavailable'),
        Promise.resolve('')
      );
    this._syncAssetThumbnail(clayColor.id, '', 'loading');
    const value295 = this._assetThumbnailQueue
      .catch(() => '')
      .then(async () => {
        const value296 = enabled28;
        try {
          if (this._closed) return '';
          const enabled29 =
            value296 ||
            this.importedModelScenes.get(clayColor.id) ||
            (await this._loadPackAsset(clayColor.id));
          if (!enabled29 || this._closed) return '';
          const value297 = this._getAssetThumbnailRenderer().render(enabled29);
          return (
            storyboard3DAssetThumbnailCache.set(clayColor, value297),
            this._syncAssetThumbnail(clayColor.id, value297),
            value297
          );
        } finally {
          if (value296) disposeStoryboard3DAssetThumbnailModel(value296);
        }
      })
      .catch(() => {
        return (
          this._assetThumbnailFailures.add(clayColor.id),
          this._syncAssetThumbnail(clayColor.id, '', 'unavailable'),
          ''
        );
      })
      .finally(() => this._assetThumbnailLoads.delete(clayColor.id));
    return (
      this._assetThumbnailLoads.set(clayColor.id, value295),
      (this._assetThumbnailQueue = value295),
      value295
    );
  }
  ['_observeVisibleAssetThumbnails']() {
    (this._assetThumbnailObserver?.disconnect?.(), (this._assetThumbnailObserver = null));
    if (!this.editorStore.getSnapshot().assetLibraryOpen) return;
    const list12 = [
      ...(this.root?.querySelectorAll?.(
        '[data-storyboard-3d-asset-thumbnail][data-thumbnail-status="pending"]',
      ) || []),
    ];
    if (list12.length === 0) return;
    const run7 = this.window?.IntersectionObserver;
    if (typeof run7 !== 'function') {
      list12.slice(0, 12).forEach((el37) => {
        void this._ensureAssetThumbnail(el37.dataset.assetId);
      });
      return;
    }
    ((this._assetThumbnailObserver = new run7(
      (list13) => {
        list13.forEach((event8) => {
          if (!event8.isIntersecting) return;
          (this._assetThumbnailObserver?.unobserve?.(event8.target),
            void this._ensureAssetThumbnail(event8.target.dataset.assetId));
        });
      },
      { root: this.root.querySelector('.storyboard-3d-asset-grid'), rootMargin: '120px' },
    )),
      list12.forEach((value298) => this._assetThumbnailObserver.observe(value298)));
  }
  async ['_loadModelPackStatus']() {
    try {
      const packId = await this.modelPackApi.getStatus();
      this.modelPackStatus = { ...packId, loaded: true, error: '' };
      if (this._closed) return this.modelPackStatus;
      if (!packId.installed)
        return (
          this._setMessage('3D 模型包尚未安装，请返回 3D 场景预演首页完成下载后再使用 Agent。'),
          this.modelPackStatus
        );
      (this.assetLibrary.registerPackAssets(packId.assets, { packId: packId.packId }),
        await this._hydratePackAssetsForProject());
      if (!this._closed && !this._runtimeError) this._render();
      return this.modelPackStatus;
    } catch (error18) {
      const error19 = '无法读取 3D 模型包：' + (error18?.message || String(error18));
      return (
        (this.modelPackStatus = { loaded: true, installed: false, assets: [], error: error19 }),
        this._setMessage(error19),
        this.modelPackStatus
      );
    }
  }
  async ['_requireInstalledModelPack']() {
    const enabled30 = this._modelPackStatusPromise
      ? await this._modelPackStatusPromise
      : await this._loadModelPackStatus();
    if (!enabled30?.installed)
      throw new Error(enabled30?.error || '3D 模型包尚未安装，无法生成场景。请先返回首页下载模型包。');
    return enabled30;
  }
  async ['_loadPackAsset'](value299) {
    const error20 = this.assetLibrary.find(value299);
    if (error20?.source?.kind !== 'pack') return null;
    if (this.importedModelScenes.has(error20.id))
      return this.importedModelScenes.get(error20.id);
    if (this._packAssetLoads.has(error20.id)) return this._packAssetLoads.get(error20.id);
    const value300 = (async () => {
      const value301 = await this.modelPackApi.fetchAssetFile(error20.source),
        importStoryboard3DModelFile2 = await importStoryboard3DModelFile(value301, {
          parsers: this.modelParsers,
          targetSize: getStoryboard3DAssetSpatialExtent(error20),
        });
      await applyStoryboard3DTexturePolicy(importStoryboard3DModelFile2.parsed.scene, {
        renderer: this.sceneRuntime?.bridge?.renderer,
      });
      if (this._closed) {
        disposeCancelledStoryboard3DModelImportResult(importStoryboard3DModelFile2);
        throw new Error('3D 编辑器已关闭。');
      }
      return (
        this._setImportedModelScene(
          error20.id,
          importStoryboard3DModelFile2.parsed.scene,
          importStoryboard3DModelFile2.normalization,
        ),
        importStoryboard3DModelFile2.parsed.scene
      );
    })().catch((error21) => {
      this._packAssetLoads.delete(error20.id);
      throw new Error(
        '模型包素材“' + error20.name + '”加载失败：' + (error21?.message || String(error21)),
      );
    });
    return (this._packAssetLoads.set(error20.id, value300), value300);
  }
  async ['_hydratePackAssetsForProject']() {
    const list14 = [
        ...new Set(
          this.projectStore
            .getSnapshot()
            .scenes.flatMap((value302) =>
              value302.objects
                .filter((value303) => value303.type === 'prop')
                .map((value304) => value304.assetId),
            )
            .filter(Boolean),
        ),
      ],
      list15 = list14.filter(
        (value305) => this.assetLibrary.find(value305)?.source?.kind === 'pack',
      );
    if (list15.length === 0) return [];
    const list16 = await Promise.allSettled(list15.map((value306) => this._loadPackAsset(value306))),
      value307 = list16.find((response5) => response5.status === 'rejected');
    if (value307) this._setMessage(value307.reason?.message || String(value307.reason));
    return list16;
  }
  async ['_ensurePackAssetsForCommands'](list17 = []) {
    await this._requireInstalledModelPack();
    const list18 = [
      ...new Set(
        list17.filter((value308) => value308?.tool === 'addProp')
          .map((value309) => value309?.args?.assetId)
          .filter((value310) => this.assetLibrary.find(value310)?.source?.kind === 'pack'),
      ),
    ];
    await Promise.all(list18.map((value311) => this._loadPackAsset(value311)));
  }
  async ['_hydrateBinaryAssets']() {
    const value312 = this.projectStore.getSnapshot(),
      args6 = [
        ...new Set(
          value312.scenes
            .flatMap((value313) =>
              value313.objects
                .filter((value314) => value314.type === 'prop')
                .map((value315) => value315.assetId),
            )
            .filter(Boolean),
        ),
      ],
      args7 = [
        ...new Set(
          value312.scenes
            .map((value316) => value316.background?.binaryAssetId)
            .filter(Boolean),
        ),
      ],
      list19 = [...new Set([...args6, ...args7])];
    if (list19.length === 0) return { restoredModels: 0, restoredBackgrounds: 0 };
    try {
      const list20 = await this.binaryAssetRepository.getMany(list19);
      if (this._closed) return { restoredModels: 0, restoredBackgrounds: 0 };
      let restoredModels = 0;
      const restoredBackgrounds = new Map();
      for (const value317 of list20.filter(Boolean)) {
        const restoreStoryboard3DStoredFile3 = restoreStoryboard3DStoredFile(
            value317.primaryFile,
            this.window,
          ),
          relatedFiles = value317.relatedFiles
            .map((value318) => restoreStoryboard3DStoredFile(value318, this.window))
            .filter(Boolean);
        if (!restoreStoryboard3DStoredFile3) continue;
        if (value317.kind === 'model') {
          const importStoryboard3DModelFile3 = await importStoryboard3DModelFile(
            restoreStoryboard3DStoredFile3,
            {
              parsers: this.modelParsers,
              relatedFiles: relatedFiles,
            },
          );
          if (this._closed) {
            disposeCancelledStoryboard3DModelImportResult(importStoryboard3DModelFile3);
            break;
          }
          await applyStoryboard3DTexturePolicy(importStoryboard3DModelFile3.parsed.scene, {
            renderer: this.sceneRuntime?.bridge?.renderer,
          });
          if (this._closed) {
            disposeCancelledStoryboard3DModelImportResult(importStoryboard3DModelFile3);
            break;
          }
          const value319 = value317.descriptor?.assetDescriptor;
          if (value319) this.assetLibrary.registerImported(value319);
          (this._setImportedModelScene(
            value317.assetId,
            importStoryboard3DModelFile3.parsed.scene,
            importStoryboard3DModelFile3.normalization,
          ),
            (restoredModels += 1));
        } else
          value317.kind === 'background' &&
            value312.scenes
              .filter((value320) => value320.background?.binaryAssetId === value317.assetId)
              .forEach((value321) => {
                const value322 = this._getBackgroundImageController(value321.id).load(
                  restoreStoryboard3DStoredFile3,
                );
                restoredBackgrounds.set(value321.id, value322.imageUrl);
              });
      }
      restoredBackgrounds.size > 0 &&
        this.projectStore.updateProject('restore-background-assets', (value323) => {
          value323.scenes.forEach((value324) => {
            value324.background &&
              restoredBackgrounds.has(value324.id) &&
              (value324.background.imageUrl = restoredBackgrounds.get(value324.id));
          });
        });
      if (restoredModels > 0 || restoredBackgrounds.size > 0) this._render();
      return { restoredModels: restoredModels, restoredBackgrounds: restoredBackgrounds.size };
    } catch (error22) {
      if (!this._closed)
        this._setMessage('本地 3D 资源恢复失败：' + (error22?.message || String(error22)));
      return { restoredModels: 0, restoredBackgrounds: 0, error: error22 };
    }
  }
  ['_getObject'](value325, value326) {
    const value327 = this.projectStore.getSnapshot(),
      value328 = value327.scenes.find((value329) => value329.id === value325);
    return value328?.objects?.find((value330) => value330.id === value326) || null;
  }
  ['_handleRuntimePointerDown'](startX) {
    if (!this.sceneRuntime) return;
    const flyMode = this.editorStore.getSnapshot(),
      mode = resolveStoryboard3DNavigationMode(startX, {
        flyMode: flyMode.flyMode,
        preset: this.navigationSettings.preset,
      });
    if (mode) {
      const activeStoryboard3DScene6 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
      if (activeStoryboard3DScene6?.background?.lockedCamera) {
        this._setMessage('背景机位已锁定；请先解除锁定再导航视口。');
        return;
      }
      const enabled31 = this.sceneRuntime.getSceneView?.(),
        host = startX.currentTarget,
        rect = host?.getBoundingClientRect?.();
      if (!enabled31 || !rect?.width || !rect?.height) return;
      (startX.preventDefault(), startX.stopPropagation());
      const sceneView = structuredClone(mode === 'fly-look' ? this._flySceneView || enabled31 : enabled31);
      if (mode === 'fly-look') this._flySceneView = sceneView;
      const cameraPose = this.sceneRuntime.readCurrentCamera?.();
      ((this._cameraDrag = {
        mode: mode,
        startX: startX.clientX,
        startY: startX.clientY,
        lastX: startX.clientX,
        lastY: startX.clientY,
        rect: rect,
        sceneView: sceneView,
        cameraPose: cameraPose,
        fov: this.sceneRuntime.getViewportFov?.() ?? cameraPose?.fov,
        latestSceneView: sceneView,
        pointerId: startX.pointerId,
        host: host,
      }),
        host?.classList?.add?.('is-camera-' + mode));
      try {
        host?.setPointerCapture?.(startX.pointerId);
      } catch {}
      (this.window?.addEventListener?.('pointermove', this._handleRuntimePointerMove, true),
        this.window?.addEventListener?.('pointerup', this._handleRuntimePointerUp, true),
        this.window?.addEventListener?.('pointercancel', this._handleRuntimePointerCancel, true));
      return;
    }
    if (startX.button !== 0) return;
    (startX.preventDefault(), startX.stopPropagation());
    const handleKey = this.sceneRuntime.pickGizmoHandle(startX.clientX, startX.clientY);
    if (handleKey && flyMode.selectedObjectIds.length > 0) {
      const dragState = this.sceneRuntime.beginGizmoDrag({
        handleKey: handleKey.handleKey,
        clientX: startX.clientX,
        clientY: startX.clientY,
      });
      if (dragState) {
        const value331 = this.projectStore.getSnapshot(),
          sceneId4 = getActiveStoryboard3DScene(value331),
          initialTransforms = {};
        flyMode.selectedObjectIds.forEach((value332) => {
          const value333 = sceneId4?.objects?.find((value334) => value334.id === value332);
          value333 &&
            value333.visible !== false &&
            value333.locked !== true &&
            canStoryboard3DObjectUseTransformTool(value333, flyMode.activeTool) &&
            (initialTransforms[value332] = structuredClone(
              this.shotTimelineController?.getPreviewTransform?.(value332) || value333.transform,
            ));
        });
        if (Object.keys(initialTransforms).length > 0) {
          const event9 = createStoryboard3DTransformSession({
            sceneId: sceneId4.id,
            activeTool: flyMode.activeTool,
            initialTransforms: initialTransforms,
            dragState: dragState,
            settings: {
              ...this.viewportSettings,
              groundPositions: this.sceneRuntime.resolveObjectGroundPositions?.(
                Object.keys(initialTransforms),
              ),
            },
          });
          if (!event9) return;
          event9.forcedUniformScale &&
            this._setMessage('多选对象朝向不同，已使用均匀缩放以避免产生不可保存的剪切变形。');
          ((event9.pointerId = startX.pointerId),
            (event9.host = startX.currentTarget),
            (this._gizmoDrag = event9),
            this.sceneRuntime.setGizmoHoverHandle?.(null),
            this.sceneRuntime.setGizmoActiveHandle?.(handleKey.handleKey));
          if (event9.activeTool === 'move') {
            const from2 = dragState.pivot || { x: 0, y: 0, z: 0 };
            this.sceneRuntime.setGizmoMoveGuideLine?.({ from: from2, to: from2 });
          }
          startX.currentTarget?.classList?.add?.('is-gizmo-dragging');
          try {
            startX.currentTarget?.setPointerCapture?.(startX.pointerId);
          } catch {}
          (this.window?.addEventListener?.('pointermove', this._handleRuntimePointerMove, true),
            this.window?.addEventListener?.('pointerup', this._handleRuntimePointerUp, true),
            this.window?.addEventListener?.(
              'pointercancel',
              this._handleRuntimePointerCancel,
              true,
            ));
          return;
        }
      }
    }
    const enabled32 = this.sceneRuntime.pick(startX.clientX, startX.clientY),
      list21 = flyMode.selectedObjectIds;
    if (STORYBOARD_3D_SELECT_MOVE_TOOLS.has(flyMode.activeTool) && !enabled32) {
      this._beginRuntimeSelectionBox(startX, list21);
      return;
    }
    let list22 = enabled32 ? [enabled32.storyboardObjectId] : [];
    enabled32 &&
      (startX.shiftKey || startX.ctrlKey || startX.metaKey) &&
      (list22 = list21.includes(enabled32.storyboardObjectId)
        ? list21.filter((value335) => value335 !== enabled32.storyboardObjectId)
        : [...list21, enabled32.storyboardObjectId]);
    if (
      enabled32?.storyboardObjectType === 'camera' &&
      list22.includes(enabled32.storyboardObjectId)
    ) {
      if (!this._activateShotForCamera(enabled32.storyboardObjectId)) return;
    }
    (this._setSelectedObjects(list22),
      this._render(),
      enabled32?.storyboardObjectType === 'camera' &&
        list22.length === 1 &&
        this._focusCameraObject(enabled32.storyboardObjectId));
  }
  ['_beginRuntimeSelectionBox'](pointerId, args8 = []) {
    const host2 = pointerId.currentTarget;
    if (!host2) return;
    const box10 = this.document?.createElement?.('div') || null;
    box10 &&
      ((box10.className = 'storyboard-3d-selection-box'),
      (box10.hidden = true),
      host2.appendChild(box10));
    ((this._selectionDrag = {
      pointerId: pointerId.pointerId,
      host: host2,
      box: box10,
      start: { clientX: pointerId.clientX, clientY: pointerId.clientY },
      initialObjectIds: [...args8],
      latestObjectIds: [...args8],
      additive: pointerId.shiftKey === true,
      toggle: pointerId.ctrlKey === true || pointerId.metaKey === true,
      moved: false,
    }),
      host2.classList?.add?.('is-box-selecting'),
      this.sceneRuntime?.setGizmoHoverHandle?.(null));
    try {
      host2.setPointerCapture?.(pointerId.pointerId);
    } catch {}
    (this.window?.addEventListener?.('pointermove', this._handleRuntimePointerMove, true),
      this.window?.addEventListener?.('pointerup', this._handleRuntimePointerUp, true),
      this.window?.addEventListener?.('pointercancel', this._handleRuntimePointerCancel, true));
  }
  ['_cleanupRuntimeSelectionBox'](event10) {
    (this.window?.removeEventListener?.('pointermove', this._handleRuntimePointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleRuntimePointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleRuntimePointerCancel, true),
      event10?.box?.remove?.(),
      event10?.host?.classList?.remove?.('is-box-selecting'));
    try {
      event10?.host?.releasePointerCapture?.(event10.pointerId);
    } catch {}
  }
  ['_finishRuntimeSelectionBox'](event11) {
    const event12 = this._selectionDrag;
    if (!event12) return false;
    if (event12.pointerId != null && event11?.pointerId !== event12.pointerId) return false;
    (event11?.preventDefault?.(),
      event11?.stopImmediatePropagation?.(),
      this._cleanupRuntimeSelectionBox(event12),
      (this._selectionDrag = null));
    if (event12.moved) (this._setSelectedObjects(event12.latestObjectIds), this._render());
    else
      !event12.additive && !event12.toggle
        ? (this._setSelectedObjects([]), this._render())
        : this.sceneRuntime?.setSelection?.(event12.initialObjectIds);
    return true;
  }
  ['_cancelRuntimeSelection'](event13) {
    const event14 = this._selectionDrag;
    if (!event14) return false;
    if (event13 && event14.pointerId != null && event13.pointerId !== event14.pointerId) return false;
    return (
      event13?.preventDefault?.(),
      event13?.stopImmediatePropagation?.(),
      this._cleanupRuntimeSelectionBox(event14),
      (this._selectionDrag = null),
      this.sceneRuntime?.setSelection?.(event14.initialObjectIds),
      true
    );
  }
  ['_handleRuntimePointerHover'](event15) {
    if (!this.sceneRuntime || this._gizmoDrag || this._selectionDrag || this._cameraDrag) return;
    const value336 = this.editorStore.getSnapshot(),
      value337 =
        value336.selectedObjectIds.length === 0
          ? null
          : this.sceneRuntime.pickGizmoHandle(event15.clientX, event15.clientY);
    (this.sceneRuntime.setGizmoHoverHandle?.(value337?.handleKey || null),
      event15.currentTarget?.classList?.toggle?.('is-gizmo-hovered', Boolean(value337)));
  }
  ['_handleRuntimePointerLeave'](event16) {
    if (this._gizmoDrag || this._selectionDrag || this._cameraDrag) return;
    (this.sceneRuntime?.setGizmoHoverHandle?.(null),
      event16.currentTarget?.classList?.remove?.('is-gizmo-hovered'));
  }
  ['_handleRuntimeContextMenu'](event17) {
    event17.preventDefault();
  }
  ['_handleRuntimePointerMove'](precision) {
    const fov = this._cameraDrag;
    if (fov && this.sceneRuntime) {
      if (fov.pointerId != null && precision.pointerId !== fov.pointerId) return;
      (precision.preventDefault(), precision.stopImmediatePropagation());
      const value338 = precision.clientX - fov.startX,
        value339 = precision.clientY - fov.startY,
        value340 =
          value338 *
          this.navigationSettings.orbitSensitivity *
          (this.navigationSettings.invertOrbitX ? -1 : 1),
        value341 =
          value339 *
          this.navigationSettings.orbitSensitivity *
          (this.navigationSettings.invertOrbitY ? -1 : 1),
        value342 = value338 * this.navigationSettings.panSensitivity,
        value343 = value339 * this.navigationSettings.panSensitivity,
        value344 = value339 * this.navigationSettings.zoomSensitivity;
      if (fov.mode === 'fly-look') {
        const args9 = this._flySceneView || fov.latestSceneView,
          value345 = precision.clientX - fov.lastX,
          value346 = precision.clientY - fov.lastY;
        ((fov.lastX = precision.clientX),
          (fov.lastY = precision.clientY),
          (fov.latestSceneView = {
            ...args9,
            ...applySceneFlyLookDelta(args9, value345, value346, fov.rect, {
              fov: fov.fov,
            }),
          }),
          (this._flySceneView = fov.latestSceneView));
      } else {
        const args10 =
          fov.mode === 'pan'
            ? applyScenePanDelta(fov.sceneView, fov.cameraPose, value342, value343, fov.rect)
            : fov.mode === 'dolly'
              ? applySceneDollyDelta(fov.sceneView, value344)
              : applyOrbitDelta(fov.sceneView, value340, value341, fov.rect, {
                  fov: fov.fov,
                });
        fov.latestSceneView = { ...fov.sceneView, ...args10 };
      }
      (this.sceneRuntime.previewSceneView(fov.latestSceneView),
        (this._miniMapPreviewSceneView = structuredClone(fov.latestSceneView)),
        this._scheduleMiniMapRefresh());
      return;
    }
    const initialObjectIds = this._selectionDrag;
    if (initialObjectIds && this.sceneRuntime) {
      if (initialObjectIds.pointerId != null && precision.pointerId !== initialObjectIds.pointerId)
        return;
      (precision.preventDefault(), precision.stopImmediatePropagation());
      const box11 = createStoryboard3DSelectionRect(initialObjectIds.start, precision);
      initialObjectIds.moved = hasStoryboard3DSelectionDragMoved(box11);
      const box12 = initialObjectIds.host?.getBoundingClientRect?.();
      initialObjectIds.box &&
        box12 &&
        ((initialObjectIds.box.hidden = !initialObjectIds.moved),
        (initialObjectIds.box.style.left = Math.max(0, box11.left - box12.left) + 'px'),
        (initialObjectIds.box.style.top = Math.max(0, box11.top - box12.top) + 'px'),
        (initialObjectIds.box.style.width = box11.width + 'px'),
        (initialObjectIds.box.style.height = box11.height + 'px'));
      if (initialObjectIds.moved) {
        const hitObjectIds = this.sceneRuntime
          .pickObjectsInRect(box11)
          .map((value347) => value347.storyboardObjectId || value347.objectId)
          .filter(Boolean);
        ((initialObjectIds.latestObjectIds = mergeStoryboard3DBoxSelection({
          initialObjectIds: initialObjectIds.initialObjectIds,
          hitObjectIds: hitObjectIds,
          additive: initialObjectIds.additive,
          toggle: initialObjectIds.toggle,
        })),
          this.sceneRuntime.setSelection(initialObjectIds.latestObjectIds));
      }
      return;
    }
    const event18 = this._gizmoDrag;
    if (!event18 || !this.sceneRuntime) return;
    if (event18.pointerId != null && precision.pointerId !== event18.pointerId) return;
    (precision.preventDefault(), precision.stopImmediatePropagation());
    const enabled33 = this.sceneRuntime.sampleGizmoDragPoint(
      event18.dragState,
      precision.clientX,
      precision.clientY,
    );
    if (!enabled33) return;
    const value348 = this.sceneRuntime.computeGizmoDragValue(event18.dragState, enabled33),
      updateStoryboard3DTransformSession2 = updateStoryboard3DTransformSession(event18, value348, {
        precision: precision.shiftKey === true,
        toggleSnap: precision.ctrlKey === true || precision.metaKey === true,
      });
    this.sceneRuntime.previewObjectTransforms?.(updateStoryboard3DTransformSession2);
    if (event18.activeTool === 'move') {
      const value349 = Object.keys(updateStoryboard3DTransformSession2)[0],
        value350 = event18.initialTransforms[value349],
        value351 = updateStoryboard3DTransformSession2[value349],
        from3 = event18.dragState.pivot || { x: 0, y: 0, z: 0 };
      this.sceneRuntime.setGizmoMoveGuideLine?.({
        from: from3,
        to: {
          x:
            (from3.x || 0) +
            (value351?.position?.[0] || 0) -
            (value350?.position?.[0] || 0),
          y:
            (from3.y || 0) +
            (value351?.position?.[1] || 0) -
            (value350?.position?.[1] || 0),
          z:
            (from3.z || 0) +
            (value351?.position?.[2] || 0) -
            (value350?.position?.[2] || 0),
        },
      });
    }
  }
  ['_handleRuntimePointerUp'](event19) {
    if (this._finishRuntimeSelectionBox(event19)) return;
    const event20 = this._cameraDrag;
    if (event20) {
      if (event20.pointerId != null && event19?.pointerId !== event20.pointerId) return;
      (event19?.preventDefault?.(),
        event19?.stopImmediatePropagation?.(),
        this.window?.removeEventListener?.('pointermove', this._handleRuntimePointerMove, true),
        this.window?.removeEventListener?.('pointerup', this._handleRuntimePointerUp, true),
        this.window?.removeEventListener?.(
          'pointercancel',
          this._handleRuntimePointerCancel,
          true,
        ));
      try {
        event20.host?.releasePointerCapture?.(event20.pointerId);
      } catch {}
      (event20.host?.classList?.remove?.(
        'is-camera-orbit',
        'is-camera-pan',
        'is-camera-dolly',
        'is-camera-fly-look',
      ),
        (this._cameraDrag = null));
      const enabled34 = event20.mode === 'fly-look';
      enabled34
        ? ((this._flySceneView = structuredClone(event20.latestSceneView)),
          this._flyKeys.size > 0
            ? this.sceneRuntime?.previewSceneView?.(this._flySceneView)
            : this._finishFlyMovement())
        : this.sceneRuntime?.commitSceneView?.(event20.latestSceneView);
      if (this.viewportControls) {
        this.viewportControls.sceneView = structuredClone(event20.latestSceneView);
        const value352 =
          this.viewportControls.getSnapshot?.().viewMode || this.viewportControls.viewMode;
        value352 === 'perspective' &&
          (this.viewportControls.perspectiveSceneView = structuredClone(event20.latestSceneView));
      }
      ((this._miniMapPreviewSceneView = null), this._scheduleMiniMapRefresh());
      !enabled34 &&
        this.shotTimelineController?.isAutoKeyEnabled?.() &&
        this.shotTimelineController.recordCameraKeyframe(this._readCurrentCameraState());
      return;
    }
    const sceneId5 = this._gizmoDrag;
    if (!sceneId5) return;
    if (sceneId5.pointerId != null && event19?.pointerId !== sceneId5.pointerId) return;
    (event19?.preventDefault?.(),
      event19?.stopImmediatePropagation?.(),
      this.window?.removeEventListener?.('pointermove', this._handleRuntimePointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleRuntimePointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleRuntimePointerCancel, true),
      this.sceneRuntime?.clearPreviews?.(),
      this.sceneRuntime?.clearGizmoState?.(),
      sceneId5.host?.classList?.remove?.('is-gizmo-dragging', 'is-gizmo-hovered'));
    try {
      sceneId5.host?.releasePointerCapture?.(sceneId5.pointerId);
    } catch {}
    ((this._gizmoDrag = null),
      this._commitObjectTransforms({
        sceneId: sceneId5.sceneId,
        transforms: sceneId5.latestTransforms,
        activeTool: sceneId5.activeTool,
        label: sceneId5.activeTool + ' objects',
      }));
  }
  ['_cancelRuntimeTransform'](event21) {
    const event22 = this._gizmoDrag;
    if (!event22) return false;
    if (event21 && event22.pointerId != null && event21.pointerId !== event22.pointerId) return false;
    (event21?.preventDefault?.(),
      event21?.stopImmediatePropagation?.(),
      this.window?.removeEventListener?.('pointermove', this._handleRuntimePointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleRuntimePointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleRuntimePointerCancel, true),
      this.sceneRuntime?.clearPreviews?.(),
      this.sceneRuntime?.clearGizmoState?.(),
      event22.host?.classList?.remove?.('is-gizmo-dragging', 'is-gizmo-hovered'));
    try {
      event22.host?.releasePointerCapture?.(event22.pointerId);
    } catch {}
    return ((this._gizmoDrag = null), true);
  }
  ['_handleRuntimePointerCancel'](value353) {
    if (this._cancelRuntimeSelection(value353)) return;
    if (this._cancelRuntimeTransform(value353)) return;
    this._handleRuntimePointerUp(value353);
  }
  ['_handleRuntimeWheel'](event23) {
    if (!this.sceneRuntime) return;
    const activeStoryboard3DScene7 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
    if (activeStoryboard3DScene7?.background?.lockedCamera) {
      this._setMessage('背景机位已锁定；请先解除锁定再缩放视口。');
      return;
    }
    const args11 = this.sceneRuntime.getSceneView?.();
    if (!args11) return;
    (event23.preventDefault(), event23.stopPropagation());
    const box13 = event23.currentTarget?.getBoundingClientRect?.(),
      value354 = this.navigationSettings.invertWheel ? -1 : 1,
      wheelDelta =
        normalizeWheelDelta(event23.deltaY, event23.deltaMode, box13?.height || 800) *
        this.navigationSettings.zoomSensitivity *
        value354,
      value355 = { ...args11, ...applySceneZoomDelta(args11, wheelDelta) };
    (this.sceneRuntime.previewSceneView(value355),
      this.sceneRuntime.commitSceneView(value355),
      this._scheduleMiniMapRefresh(),
      this.viewportControls &&
        ((this.viewportControls.sceneView = structuredClone(value355)),
        this.viewportControls.getSnapshot?.().viewMode === 'perspective' &&
          (this.viewportControls.perspectiveSceneView = structuredClone(value355))));
  }
  ['_handleMiniMapPointerDown'](startX2) {
    const el38 = startX2.target?.closest?.('.storyboard-3d-mini-map-title');
    if (el38 && !startX2.target.closest('button') && startX2.button === 0) {
      const el39 = el38.closest('.storyboard-3d-mini-map-placeholder'),
        el40 = el39?.closest?.('.storyboard-3d-viewport'),
        box14 = el39?.getBoundingClientRect?.(),
        box15 = el40?.getBoundingClientRect?.();
      if (!box14 || !box15) return;
      (startX2.preventDefault(),
        startX2.stopImmediatePropagation(),
        (this._miniMapWindowDrag = {
          startX: startX2.clientX,
          startY: startX2.clientY,
          initial: { ...this.miniMapWindowOffset },
          maxLeft: Math.max(0, box15.width - box14.width - 28),
          maxDown: Math.max(0, box15.height - box14.height - 28),
        }),
        this.window?.addEventListener?.('pointermove', this._handleMiniMapWindowMove, true),
        this.window?.addEventListener?.('pointerup', this._handleMiniMapWindowUp, true),
        this.window?.addEventListener?.('pointercancel', this._handleMiniMapWindowUp, true));
      return;
    }
    const el41 = startX2.target?.closest?.('.storyboard-3d-mini-map-canvas [data-object-id]');
    if (!el41 || startX2.button !== 0) return;
    const value356 = this.projectStore.getSnapshot(),
      sceneId6 = getActiveStoryboard3DScene(value356),
      objectId2 = sceneId6?.objects?.find(
        (value357) => value357.id === el41.dataset.objectId,
      ),
      el42 = el41.closest('.storyboard-3d-mini-map-canvas'),
      rect2 = el42?.getBoundingClientRect?.();
    if (!objectId2 || objectId2.locked || !rect2?.width || !rect2?.height) return;
    (startX2.preventDefault(),
      startX2.stopImmediatePropagation(),
      this._setSelectedObjects([objectId2.id]));
    const activeStoryboard3DShot5 = getActiveStoryboard3DShot(value356);
    ((this._miniMapDrag = {
      sceneId: sceneId6.id,
      objectId: objectId2.id,
      object: objectId2,
      rect: rect2,
      projection: createMiniMapLayout(
        sceneId6,
        activeStoryboard3DShot5,
        rect2,
        this.miniMapZoom,
        this._miniMapFootprints,
        this._miniMapFrame?.worldBounds || null,
        this._getMiniMapCamera(activeStoryboard3DShot5),
      ).projection,
      transform: structuredClone(objectId2.transform),
    }),
      this.window?.addEventListener?.('pointermove', this._handleMiniMapPointerMove, true),
      this.window?.addEventListener?.('pointerup', this._handleMiniMapPointerUp, true),
      this.window?.addEventListener?.('pointercancel', this._handleMiniMapPointerUp, true));
  }
  ['_handleMiniMapPointerMove'](x5) {
    const x6 = this._miniMapDrag;
    if (!x6) return;
    (x5.preventDefault?.(),
      x5.stopImmediatePropagation?.(),
      (x6.transform = computeStoryboard3DMiniMapObjectDrag(
        {
          x: x5.clientX - x6.rect.left,
          y: x5.clientY - x6.rect.top,
        },
        x6.object,
        x6.projection,
      )),
      this.sceneRuntime?.previewObjectTransform?.(x6.objectId, x6.transform));
    const el43 = [
        ...(this.root?.querySelectorAll?.('.storyboard-3d-mini-map-canvas [data-object-id]') || []),
      ].find((el44) => el44.dataset.objectId === x6.objectId),
      box16 = projectStoryboard3DWorldToMiniMapRatio(
        { x: x6.transform.position[0], z: x6.transform.position[2] },
        x6.projection,
      );
    (el43?.style?.setProperty?.('--mini-x', box16.x * 100 + '%'),
      el43?.style?.setProperty?.('--mini-y', box16.y * 100 + '%'));
  }
  ['_scheduleMiniMapRefresh']() {
    if (this._closed || !this.root || this._miniMapRefreshFrame !== null) return;
    const run8 = this.window?.requestAnimationFrame?.bind?.(this.window);
    if (typeof run8 !== 'function') {
      this._refreshMiniMapFromRuntime();
      return;
    }
    this._miniMapRefreshFrame = run8(() => {
      ((this._miniMapRefreshFrame = null), this._refreshMiniMapFromRuntime());
    });
  }
  ['_refreshMiniMapFromRuntime']() {
    if (this._closed || !this.root || !this.sceneRuntime) return;
    this._miniMapFootprints = this.sceneRuntime.getMiniMapFootprints?.() || [];
    const value358 = this.projectStore.getSnapshot(),
      activeStoryboard3DScene8 = getActiveStoryboard3DScene(value358),
      activeStoryboard3DShot6 = getActiveStoryboard3DShot(value358),
      el45 = this.root.querySelector('.storyboard-3d-mini-map-placeholder');
    if (!el45 || !activeStoryboard3DScene8) return;
    const worldBounds2 = this._resolveMiniMapWorldBounds(
        activeStoryboard3DScene8,
        activeStoryboard3DShot6,
        this._miniMapFootprints,
      ),
      camera5 = this._getMiniMapCamera(activeStoryboard3DShot6);
    el45.innerHTML = renderMiniMap(activeStoryboard3DScene8, activeStoryboard3DShot6, {
      expanded: this.miniMapExpanded,
      zoom: this.miniMapZoom,
      footprints: this._miniMapFootprints,
      worldBounds: worldBounds2,
      camera: camera5,
    });
  }
  ['_getMiniMapCamera'](value359) {
    return createStoryboard3DMiniMapCameraPose(
      value359,
      this._miniMapPreviewSceneView || this.sceneRuntime?.getSceneView?.(),
      this.sceneRuntime?.readCurrentCamera?.(),
    );
  }
  ['_resolveMiniMapWorldBounds'](sceneId7, value360, value361 = []) {
    const list23 = (sceneId7?.objects || [])
        .filter((value362) => value362?.visible !== false)
        .map((value363) => String(value363.id || ''))
        .filter(Boolean)
        .sort(),
      objectSignature = list23.join('|'),
      hasGeometry = (value361 || []).some(
        (value364) => Array.isArray(value364?.points) && value364.points.length >= 3,
      );
    return (
      (!this._miniMapFrame ||
        this._miniMapFrame.sceneId !== sceneId7?.id ||
        this._miniMapFrame.objectSignature !== objectSignature ||
        (!this._miniMapFrame.hasGeometry && hasGeometry)) &&
        (this._miniMapFrame = {
          sceneId: sceneId7?.id || '',
          objectSignature: objectSignature,
          hasGeometry: hasGeometry,
          worldBounds: createMiniMapWorldBounds(sceneId7, value360, value361),
        }),
      this._miniMapFrame.worldBounds
    );
  }
  ['_handleMiniMapPointerUp'](event24) {
    const sceneId8 = this._miniMapDrag;
    if (!sceneId8) return;
    (event24?.preventDefault?.(),
      event24?.stopImmediatePropagation?.(),
      this.window?.removeEventListener?.('pointermove', this._handleMiniMapPointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleMiniMapPointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleMiniMapPointerUp, true),
      this.sceneRuntime?.clearObjectTransformPreview?.(sceneId8.objectId),
      (this._miniMapDrag = null),
      this._commitObjectTransforms({
        sceneId: sceneId8.sceneId,
        transforms: { [sceneId8.objectId]: sceneId8.transform },
        activeTool: 'move',
        label: 'Move object from mini map',
      }));
  }
  ['_handleMiniMapWheel'](event25) {
    if (!event25.target?.closest?.('.storyboard-3d-mini-map-placeholder')) return;
    (event25.preventDefault(),
      event25.stopPropagation(),
      (this.miniMapZoom = Math.max(
        0.5,
        Math.min(3, this.miniMapZoom * Math.exp(-(Number(event25.deltaY) || 0) * 0.001)),
      )),
      this._render());
  }
  ['_handleMiniMapWindowMove'](event26) {
    const enabled35 = this._miniMapWindowDrag;
    if (!enabled35) return;
    (event26.preventDefault?.(),
      event26.stopImmediatePropagation?.(),
      (this.miniMapWindowOffset = {
        x: Math.max(
          -enabled35.maxLeft,
          Math.min(0, enabled35.initial.x + event26.clientX - enabled35.startX),
        ),
        y: Math.max(
          0,
          Math.min(
            enabled35.maxDown,
            enabled35.initial.y + event26.clientY - enabled35.startY,
          ),
        ),
      }));
    const el46 = this.root?.querySelector?.('.storyboard-3d-mini-map-placeholder');
    (el46?.style?.setProperty?.('--mini-map-window-x', this.miniMapWindowOffset.x + 'px'),
      el46?.style?.setProperty?.('--mini-map-window-y', this.miniMapWindowOffset.y + 'px'));
  }
  ['_handleMiniMapWindowUp'](event27) {
    if (!this._miniMapWindowDrag) return;
    (event27?.preventDefault?.(),
      event27?.stopImmediatePropagation?.(),
      (this._miniMapWindowDrag = null),
      this.window?.removeEventListener?.('pointermove', this._handleMiniMapWindowMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleMiniMapWindowUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleMiniMapWindowUp, true));
  }
  ['_handleOutlineDragStart'](event28) {
    const el47 = event28.target?.closest?.('.storyboard-3d-scene-item[data-scene-id]');
    if (el47 && event28.dataTransfer) {
      ((event28.dataTransfer.effectAllowed = 'move'),
        event28.dataTransfer.setData(
          'application/x-storyboard3d-scene',
          el47.dataset.sceneId || '',
        ));
      return;
    }
    const el48 = event28.target?.closest?.('.storyboard-3d-shot-card[data-shot-id]');
    if (el48 && event28.dataTransfer) {
      ((event28.dataTransfer.effectAllowed = 'move'),
        event28.dataTransfer.setData(
          'application/x-storyboard3d-shot',
          el48.dataset.shotId || '',
        ));
      return;
    }
    const el49 = event28.target?.closest?.('.storyboard-3d-object-row[data-object-id]');
    if (!el49 || !event28.dataTransfer) return;
    ((event28.dataTransfer.effectAllowed = 'move'),
      event28.dataTransfer.setData('text/storyboard3d-object-id', el49.dataset.objectId || ''),
      event28.dataTransfer.setData('text/plain', el49.dataset.objectId || ''));
  }
  ['_handleOutlineDragOver'](event29) {
    if (event29.target?.closest?.('.storyboard-3d-scene-item, .storyboard-3d-shot-card')) {
      event29.preventDefault();
      if (event29.dataTransfer) event29.dataTransfer.dropEffect = 'move';
      return;
    }
    if (!event29.target?.closest?.('.storyboard-3d-outline-list')) return;
    const el50 = event29.target.closest('.storyboard-3d-object-row');
    if (el50 && el50.dataset.objectType !== 'group') return;
    event29.preventDefault();
    if (event29.dataTransfer) event29.dataTransfer.dropEffect = 'move';
  }
  ['_handleOutlineDrop'](event30) {
    const el51 = event30.target?.closest?.('.storyboard-3d-scene-item[data-scene-id]'),
      value365 = event30.dataTransfer?.getData?.('application/x-storyboard3d-scene') || '';
    if (el51 && value365) {
      (event30.preventDefault(),
        this._executeMutation({
          type: 'drag-reorder-scene',
          label: 'Reorder scene',
          mutate: (value366) =>
            reorderStoryboard3DScene(
              value366,
              value365,
              value366.scenes.findIndex((value367) => value367.id === el51.dataset.sceneId),
              { now: Date.now() },
            ),
        }),
        this._render());
      return;
    }
    const el52 = event30.target?.closest?.('.storyboard-3d-shot-card[data-shot-id]'),
      value368 = event30.dataTransfer?.getData?.('application/x-storyboard3d-shot') || '';
    if (el52 && value368) {
      (event30.preventDefault(),
        this._executeMutation({
          type: 'drag-reorder-shot',
          label: 'Reorder shot',
          mutate: (value369) => {
            const value370 = value369.scenes.findIndex(
                (value371) => value371.id === value369.activeSceneId,
              ),
              value372 = value369.scenes[value370];
            return (
              value372 &&
                (value369.scenes[value370] = reorderStoryboard3DShot(
                  value372,
                  value368,
                  value372.shots.findIndex((value373) => value373.id === el52.dataset.shotId),
                )),
              value369
            );
          },
        }),
        this._render());
      return;
    }
    if (!event30.target?.closest?.('.storyboard-3d-outline-list')) return;
    const enabled36 =
      event30.dataTransfer?.getData?.('text/storyboard3d-object-id') ||
      event30.dataTransfer?.getData?.('text/plain') ||
      '';
    if (!enabled36) return;
    const el53 = event30.target.closest('.storyboard-3d-object-row');
    if (el53 && el53.dataset.objectType !== 'group') return;
    event30.preventDefault();
    const value374 = el53?.dataset.objectId || null;
    try {
      this._executeMutation({
        type: 'drag-object-parent',
        label: 'Move object in hierarchy',
        mutate: (value375) => {
          const count7 = value375.scenes.findIndex(
            (value376) => value376.id === value375.activeSceneId,
          );
          return (
            count7 >= 0 &&
              (value375.scenes[count7] = setStoryboard3DObjectParent(
                value375.scenes[count7],
                enabled36,
                value374,
              )),
            value375
          );
        },
      });
    } catch (error23) {
      this._setMessage(error23?.message || String(error23));
    }
    this._render();
  }
  ['_render']({ preserveAssetLibrary: preserveAssetLibrary = false } = {}) {
    if (!this.root) return;
    const captureTimelinePresentation2 = captureTimelinePresentation(this.root),
      value377 = this.root.querySelector('.storyboard-3d-outline-list')?.scrollTop || 0,
      el54 = this.root.querySelector('.storyboard-3d-object-properties-sidebar'),
      value378 = el54?.dataset.objectId || '',
      value379 = el54?.querySelector('.storyboard-3d-object-properties-content')?.scrollTop || 0,
      open2 = this.root.querySelector('.storyboard-3d-global-settings')?.open === true;
    (this._aiModelSelectorController?.destroy?.(), (this._aiModelSelectorController = null));
    const project8 = this.projectStore.getSnapshot(),
      active4 = this.editorStore.getSnapshot(),
      sceneGroups2 = getActiveStoryboard3DScene(project8),
      activeShot2 = getActiveStoryboard3DShot(project8),
      value380 = active4.selectedObjectIds.at(-1),
      object2 = sceneGroups2?.objects?.find((value381) => value381.id === value380),
      active5 = active4.assetLibraryOpen
        ? 'assets'
        : this.rightSidebarMode === 'object' && object2
          ? 'object'
          : ['ai', 'perspective'].includes(this.rightSidebarMode)
            ? this.rightSidebarMode
            : null;
    this.rightSidebarMode = active5;
    const layoutWidth = this.window?.innerWidth || 1440,
      sidebarWidth = normalizeStoryboard3DRightSidebarWidth(this.rightSidebarWidth, layoutWidth, active5),
      el55 =
        preserveAssetLibrary && active5 === 'assets'
          ? this.root.querySelector('.storyboard-3d-right-sidebar')
          : null,
      el56 = el55?.contains?.(this.document?.activeElement)
        ? this.document.activeElement
        : null;
    el55?.remove?.();
    const active6 = this.viewportControls?.getSnapshot?.().viewMode || 'perspective',
      timelineOpen2 = this.shotTimelineController?.isDrawerOpen?.() === true,
      value382 =
        this.root.getBoundingClientRect?.().height || this.window?.innerHeight || 900,
      storyboard3DTimelineHeight = normalizeStoryboard3DTimelineHeight(this.timelineHeight, value382);
    this.timelineHeight = storyboard3DTimelineHeight;
    const camera6 = this._getMiniMapCamera(activeShot2),
      summarizeStoryboard3DProject2 = summarizeStoryboard3DProject(project8),
      worldBounds3 = this._resolveMiniMapWorldBounds(
        sceneGroups2,
        activeShot2,
        this._miniMapFootprints,
      ),
      totalCount = active4.assetLibraryOpen
        ? this.assetLibrary
            .list({
              query: this.assetQuery,
              category: this.assetCategory === 'favorite' ? 'all' : this.assetCategory,
              limit: 1600,
            })
            .filter(
              (value383) =>
                this.assetCategory !== 'favorite' || this.favoriteAssetIds.has(value383.id),
            )
        : [],
      assets2 = totalCount.slice(0, this.assetVisibleLimit).map((thumbnailUrl) => ({
        ...thumbnailUrl,
        thumbnailUrl: thumbnailUrl.thumbnailUrl || storyboard3DAssetThumbnailCache.get(thumbnailUrl),
      })),
      el57 = this.sceneRuntime ? this.root.querySelector('[data-storyboard-3d-runtime-host]') : null;
    el57?.remove?.();
    if (!el57) this._disposeSceneRuntime();
    this.root.innerHTML =
      '<div class="storyboard-3d-editor-shell ' +
      (active5 ? 'is-right-sidebar-open' : '') +
      '">\n      <header class="storyboard-3d-editor-topbar">\n        <div class="storyboard-3d-editor-identity">\n          <span class="storyboard-3d-editor-mark" aria-hidden="true">3D</span>\n          <label>\n            <span>' +
      escapeHtml(t('storyboard3d.editor.projectName')) +
      '</span>\n            <input type="text" value="' +
      escapeHtml(project8.name) +
      '" maxlength="120" data-storyboard-3d-project-name aria-label="' +
      escapeHtml(t('storyboard3d.editor.projectName')) +
      '">\n          </label>\n          <span class="storyboard-3d-save-status" data-storyboard-3d-save-status data-status="' +
      escapeHtml(this.projectStore.getSaveStatus()) +
      '">' +
      escapeHtml(getSaveStatusLabel(this.projectStore.getSaveStatus())) +
      '</span>\n        </div>\n        <nav class="storyboard-3d-mode-switcher" aria-label="' +
      escapeHtml(t('storyboard3d.editor.modeAria')) +
      '">\n          <button type="button" class="is-active" aria-pressed="true">' +
      escapeHtml(t('storyboard3d.editor.editMode')) +
      '</button>\n          <button type="button" data-storyboard-3d-action="open-explore">' +
      escapeHtml(t('storyboard3d.editor.exploreMode')) +
      '</button>\n        </nav>\n        <div class="storyboard-3d-topbar-actions">\n          <button type="button" class="storyboard-3d-asset-library-trigger ' +
      (active5 === 'assets' ? 'is-active' : '') +
      '" data-storyboard-3d-action="open-asset-library" aria-controls="storyboard3DRightSidebar" aria-expanded="' +
      (active5 === 'assets') +
      '"><span aria-hidden="true">◇</span>模型库</button>\n          ' +
      renderNavigationSettings(this.navigationSettings, {
        open: open2,
        viewportSettings: this.viewportSettings,
      }) +
      '\n          <button type="button" class="storyboard-3d-ai-sidebar-trigger ' +
      (active5 === 'ai' ? 'is-active' : '') +
      '" data-storyboard-3d-action="toggle-ai-sidebar" aria-controls="storyboard3DRightSidebar" aria-expanded="' +
      (active5 === 'ai') +
      '"><span aria-hidden="true">✦</span>AI 助手</button>\n          <button type="button" data-storyboard-3d-action="undo" title="Ctrl+Z">撤销</button>\n          <button type="button" data-storyboard-3d-action="redo" title="Ctrl+Shift+Z">重做</button>\n          <button type="button" class="storyboard-3d-export-trigger" data-storyboard-3d-action="export-storyboard">导出分镜</button>\n        </div>\n      </header>\n\n      <div class="storyboard-3d-editor-main" style="--storyboard-3d-right-sidebar-width:' +
      sidebarWidth +
      'px">\n        <main class="storyboard-3d-viewport-column ' +
      (timelineOpen2 ? 'is-timeline-open' : 'is-timeline-collapsed') +
      '" style="--storyboard-3d-timeline-height:' +
      storyboard3DTimelineHeight +
      'px">\n          <section class="storyboard-3d-viewport" tabindex="0" aria-label="' +
      escapeHtml(t('storyboard3d.editor.viewport')) +
      '">\n            <div class="storyboard-3d-tool-rail" role="toolbar" aria-label="' +
      escapeHtml(t('storyboard3d.editor.tools')) +
      '">\n              ' +
      renderStoryboard3DIconButton({ action: 'add-light', icon: 'light', label: '添加灯光' }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'open-background-perspective',
        icon: 'background',
        label: '图像透视匹配',
        active: active5 === 'perspective',
        className: 'storyboard-3d-background-match-trigger',
      }) +
      '\n            </div>\n            <div class="storyboard-3d-view-controls" role="toolbar" aria-label="视图控制">\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'perspective',
        label: '透视视图',
        active: active6 === 'perspective',
        dataView: 'perspective',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'top',
        label: '顶视图',
        active: active6 === 'top',
        dataView: 'top',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'front',
        label: '前视图',
        active: active6 === 'front',
        dataView: 'front',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'set-viewport-view',
        icon: 'right',
        label: '右视图',
        active: active6 === 'right',
        dataView: 'right',
      }) +
      '\n            </div>\n            <details class="storyboard-3d-object-popover" ' +
      (active4.objectOutlineOpen ? 'open' : '') +
      '>\n              <summary data-storyboard-3d-action="toggle-object-outline"><span>对象</span><small>' +
      summarizeStoryboard3DProject2.objectCount +
      '</small></summary>\n              <div class="storyboard-3d-object-outline">\n                <div class="storyboard-3d-object-popover-heading">\n                  <span>' +
      escapeHtml(sceneGroups2?.name || '当前场景') +
      '</span>\n                  <button type="button" data-storyboard-3d-action="group-selected" title="将当前选中对象创建为分组">分组</button>\n                </div>\n                <div class="storyboard-3d-outline-filters"><input type="search" value="' +
      escapeHtml(this.outlineQuery) +
      '" placeholder="搜索对象" data-storyboard-3d-outline-query><select data-storyboard-3d-outline-type>' +
      ['all', 'camera', 'character', 'prop', 'light', 'group']
        .map(
          (value384) =>
            '<option value="' +
            value384 +
            '" ' +
            (value384 === this.outlineType ? 'selected' : '') +
            '>' +
            (value384 === 'all' ? '全部类型' : value384) +
            '</option>',
        )
        .join('') +
      '</select></div>\n                <div class="storyboard-3d-outline-list">' +
      renderObjectOutline(sceneGroups2, active4.selectedObjectIds, {
        query: this.outlineQuery,
        type: this.outlineType,
      }) +
      '</div>\n              </div>\n            </details>\n            <div class="storyboard-3d-viewport-stage">\n              <div class="storyboard-3d-runtime-host" data-storyboard-3d-runtime-host></div>\n              ' +
      renderBackgroundCalibrationGuide(sceneGroups2?.background) +
      '\n              <div class="storyboard-3d-runtime-status" data-storyboard-3d-runtime-status hidden></div>\n            </div>\n            <div class="storyboard-3d-viewport-toolbar" role="toolbar" aria-label="常用 3D 工具">\n              ' +
      renderStoryboard3DToolButton(
        'select',
        active4.activeTool === 'select',
        this.navigationSettings.preset,
      ) +
      '\n              ' +
      renderStoryboard3DToolButton(
        'move',
        active4.activeTool === 'move',
        this.navigationSettings.preset,
      ) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'toggle-fly-mode',
        icon: 'fly',
        label: '飞行模式',
        shortcut: 'Shift+F',
        active: active4.flyMode,
        className: 'storyboard-3d-fly-mode-button',
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'focus-selection',
        icon: 'focus',
        label: '聚焦选中',
        shortcut: 'F',
        disabled: active4.selectedObjectIds.length === 0,
      }) +
      '\n              ' +
      renderStoryboard3DIconButton({
        action: 'add-shot',
        icon: 'camera',
        label: t('storyboard3d.editor.addShot'),
        title: t('storyboard3d.editor.addShotDescription'),
        className: 'storyboard-3d-add-shot-control',
      }) +
      '\n              <span class="storyboard-3d-view-controls-separator" aria-hidden="true"></span>\n              ' +
      renderStoryboard3DToolButton(
        'rotate',
        active4.activeTool === 'rotate',
        this.navigationSettings.preset,
      ) +
      '\n              ' +
      renderStoryboard3DToolButton(
        'scale',
        active4.activeTool === 'scale',
        this.navigationSettings.preset,
      ) +
      '\n              <span class="storyboard-3d-view-controls-separator" aria-hidden="true"></span>\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'transformSpace',
        icon: 'transformSpace',
        label: this.viewportSettings.transformSpace === 'local' ? '本地坐标' : '世界坐标',
        active: this.viewportSettings.transformSpace === 'local',
        hidden: active4.activeTool === 'scale',
      }) +
      '\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'snapEnabled',
        icon: 'snap',
        label: '启用步进吸附',
        active: this.viewportSettings.snapEnabled,
      }) +
      '\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'groundLock',
        icon: 'ground',
        label: '地面吸附',
        active: this.viewportSettings.groundLock,
        hidden: !STORYBOARD_3D_SELECT_MOVE_TOOLS.has(active4.activeTool),
      }) +
      '\n              ' +
      renderStoryboard3DViewportSettingButton({
        field: 'uniformScale',
        icon: 'uniform',
        label: '均匀缩放',
        active: this.viewportSettings.uniformScale,
        hidden: active4.activeTool !== 'scale',
      }) +
      '\n            </div>\n            ' +
      renderStoryboard3DIconButton({
        action: 'fit-all',
        icon: 'fit',
        label: '适配全部',
        shortcut: 'Home',
        className: 'storyboard-3d-fit-all-control',
      }) +
      '\n            ' +
      renderStoryboard3DFocalControl(sceneGroups2, this.viewportFocalLength) +
      '\n            <div class="storyboard-3d-viewport-hud">\n              <span class="storyboard-3d-navigation-status ' +
      (active4.flyMode ? 'is-fly-mode' : '') +
      '">' +
      escapeHtml(
        getStoryboard3DNavigationHelpText({
          flyMode: active4.flyMode,
          preset: this.navigationSettings.preset,
        }),
      ) +
      '</span>\n              <span>' +
      escapeHtml(activeShot2?.shotSize || 'MED') +
      '</span>\n              <span>' +
      escapeHtml(activeShot2?.shotAngle || 'eye') +
      '</span>\n              <strong>' +
      escapeHtml(formatFocalLength(this.viewportFocalLength) + 'mm') +
      '</strong>\n            </div>\n            <div class="storyboard-3d-mini-map-placeholder ' +
      (this.miniMapExpanded ? 'is-expanded' : '') +
      '" style="--mini-map-window-x:' +
      this.miniMapWindowOffset.x +
      'px;--mini-map-window-y:' +
      this.miniMapWindowOffset.y +
      'px">' +
      renderMiniMap(sceneGroups2, activeShot2, {
        expanded: this.miniMapExpanded,
        zoom: this.miniMapZoom,
        footprints: this._miniMapFootprints,
        worldBounds: worldBounds3,
        camera: camera6,
      }) +
      '</div>\n          </section>\n          <section class="storyboard-3d-shot-dock ' +
      (timelineOpen2 ? 'is-timeline-open' : 'is-timeline-collapsed') +
      '" aria-label="' +
      escapeHtml(t('storyboard3d.editor.shots')) +
      '">\n            <div class="storyboard-3d-shot-strip">' +
      renderShotStrip(sceneGroups2, { timelineOpen: timelineOpen2 }) +
      '</div>\n            ' +
      renderShotTimelineDrawerHandle(timelineOpen2, storyboard3DTimelineHeight) +
      '\n            <div class="storyboard-3d-timeline-drawer-content" aria-hidden="' +
      !timelineOpen2 +
      '" ' +
      (timelineOpen2 ? '' : 'inert') +
      '>\n              ' +
      (this.shotTimelineController?.render?.() || '') +
      '\n            </div>\n          </section>\n        </main>\n        ' +
      (active4.assetLibraryOpen && !el55
        ? renderAssetLibraryRightSidebar({
            assets: assets2,
            totalCount: totalCount.length,
            hasMore: totalCount.length > assets2.length,
            query: this.assetQuery,
            category: this.assetCategory,
            favoriteIds: this.favoriteAssetIds,
            importState: this.modelImportState,
            sidebarWidth: sidebarWidth,
            layoutWidth: layoutWidth,
          })
        : '') +
      '\n        ' +
      (active5 === 'object'
        ? renderObjectPropertiesRightSidebar(
            {
              object: object2,
              selectedBoneName: this.characterBoneSelection.get(object2?.id) || 'Head',
              characterPoseState:
                object2?.type === 'character'
                  ? reconcileCharacterPoseState(
                      object2,
                      this.characterImagePoseController.getSnapshot(object2.id),
                    )
                  : null,
              assetDescriptor:
                object2?.type === 'prop' ? this.assetLibrary.find(object2.assetId) : null,
              sceneGroups:
                sceneGroups2?.objects?.filter((value385) => value385.type === 'group') || [],
            },
            { sidebarWidth: sidebarWidth, layoutWidth: layoutWidth },
          )
        : '') +
      '\n        ' +
      (active5 === 'perspective'
        ? renderBackgroundPerspectiveRightSidebar(
            { scene: sceneGroups2, activeShot: activeShot2 },
            { sidebarWidth: sidebarWidth, layoutWidth: layoutWidth },
          )
        : '') +
      '\n        ' +
      (active5 === 'ai'
        ? renderAIAssistantRightSidebar(
            {
              ...this.aiState,
              modelId: this.aiModelId,
              provider: this.aiProvider,
              canUndoAI: this.commandHistory.getSnapshot().nextUndoLabel === 'AI scene transaction',
            },
            { sidebarWidth: sidebarWidth, layoutWidth: layoutWidth },
          )
        : '') +
      '\n      </div>\n\n      ' +
      (this.exploreOpen ? renderShotExplorePanel(this.shotCandidates, this.exploreFilter) : '') +
      '\n\n      <input type="file" accept="' +
      STORYBOARD_3D_MODEL_ACCEPT +
      ',.bin,.png,.jpg,.jpeg,.webp,.ktx2" data-storyboard-3d-model-input multiple hidden>\n      <input type="file" accept="image/*" data-storyboard-3d-background-input hidden>\n      <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-storyboard-3d-pose-image-input hidden>\n      <div class="storyboard-3d-editor-message" data-storyboard-3d-message role="status" aria-live="polite" ' +
      (this._message ? '' : 'hidden') +
      '>' +
      escapeHtml(this._message) +
      '</div>\n    </div>';
    const value386 = this.root.querySelector('.storyboard-3d-outline-list');
    if (value386) value386.scrollTop = value377;
    const value387 = this.root.querySelector('.storyboard-3d-object-properties-content');
    value387 && value378 && value378 === object2?.id && (value387.scrollTop = value379);
    el55 &&
      (this.root.querySelector('.storyboard-3d-editor-main')?.append?.(el55),
      el56?.focus?.({ preventScroll: true }));
    const value388 = this.root.querySelector('[data-storyboard-3d-runtime-host]');
    if (el57 && value388 && this.sceneRuntime) {
      value388.replaceWith(el57);
      try {
        this.sceneRuntime.sync({
          project: project8,
          sceneId: project8.activeSceneId,
          selectedObjectIds: active4.selectedObjectIds,
          activeTool: active4.activeTool,
        });
        if (this.viewportControls) {
          const value389 = this.sceneRuntime.getSceneView();
          ((this.viewportControls.sceneView = value389),
            this.viewportControls.viewMode === 'perspective' &&
              (this.viewportControls.perspectiveSceneView = structuredClone(value389)));
        }
        this._restoreViewportFocalLength();
        const box17 = el57.getBoundingClientRect?.();
        this.sceneRuntime.resize(box17?.width, box17?.height);
      } catch (error24) {
        ((this._runtimeError = error24?.message || String(error24)), this._disposeSceneRuntime());
      }
    }
    (this._syncResponsiveState(),
      this._syncHistoryButtons(),
      !this.sceneRuntime && !this._runtimeError && this._mountSceneRuntime(project8, active4),
      this._runtimeError &&
        this._showRuntimeFailure(
          this._runtimeFailureTitle || '3D 视口不可用',
          this._runtimeError,
        ),
      this.exploreOpen &&
        this.shotCandidates.length > 0 &&
        void this._renderShotCandidatePreviews(project8, active4),
      this._bindAIAssistantModelSelector(),
      this._observeVisibleAssetThumbnails(),
      this.shotTimelineController?.syncPreview?.(),
      restoreTimelinePresentation(this.root, captureTimelinePresentation2));
  }
  ['_syncSaveStatus'](value390 = this.projectStore.getSaveStatus()) {
    const el58 = this.root?.querySelector?.('[data-storyboard-3d-save-status]');
    if (!el58) return;
    ((el58.dataset.status = value390), (el58.textContent = getSaveStatusLabel(value390)));
  }
  ['_syncResponsiveState']() {
    const el59 = this.root?.querySelector?.('.storyboard-3d-editor-shell');
    if (!el59) return;
    el59.classList.remove('is-inspector-open');
  }
  ['_applyInspectorWidth'](value391, value392 = null) {
    const el60 = value392 || this.root?.querySelector?.('.storyboard-3d-editor-main'),
      value393 = el60?.getBoundingClientRect?.().width || this.window?.innerWidth || 1200;
    return (
      (this.inspectorWidth = normalizeStoryboard3DInspectorWidth(value391, value393)),
      el60?.style?.setProperty?.('--storyboard-3d-inspector-width', this.inspectorWidth + 'px'),
      el60?.querySelector?.('[data-storyboard-3d-inspector-splitter]')?.setAttribute?.(
        'aria-valuenow',
        String(this.inspectorWidth),
      ),
      this.inspectorWidth
    );
  }
  ['_handleInspectorResizePointerDown'](event31) {
    const splitter = event31.target?.closest?.('[data-storyboard-3d-inspector-splitter]');
    if (
      !splitter ||
      event31.isPrimary === false ||
      (Number.isFinite(event31.button) && event31.button !== 0)
    )
      return;
    const layout = splitter.closest?.('.storyboard-3d-editor-main'),
      bounds = layout?.getBoundingClientRect?.();
    if (!bounds?.width || bounds.width < 900) return;
    (event31.preventDefault?.(), event31.stopImmediatePropagation?.());
    const pointerId2 = event31.pointerId;
    try {
      splitter.setPointerCapture?.(pointerId2);
    } catch {}
    ((this._inspectorResize = {
      pointerId: pointerId2,
      splitter: splitter,
      layout: layout,
      bounds: bounds,
    }),
      this.document?.body?.classList?.add?.('storyboard-3d-inspector-resizing'),
      this._applyInspectorWidth(bounds.right - Number(event31.clientX), layout),
      this.window?.addEventListener?.('pointermove', this._handleInspectorResizePointerMove, true),
      this.window?.addEventListener?.('pointerup', this._handleInspectorResizePointerUp, true),
      this.window?.addEventListener?.('pointercancel', this._handleInspectorResizePointerUp, true));
  }
  ['_handleInspectorResizePointerMove'](event32) {
    const event33 = this._inspectorResize;
    if (!event33 || (event33.pointerId != null && event32.pointerId !== event33.pointerId)) return;
    (event32.preventDefault?.(),
      event32.stopImmediatePropagation?.(),
      this._applyInspectorWidth(
        event33.bounds.right - Number(event32.clientX),
        event33.layout,
      ));
  }
  ['_handleInspectorResizePointerUp'](event34) {
    const event35 = this._inspectorResize;
    if (!event35 || (event35.pointerId != null && event34?.pointerId !== event35.pointerId)) return;
    (event34?.preventDefault?.(),
      event34?.stopImmediatePropagation?.(),
      (this._inspectorResize = null),
      this.document?.body?.classList?.remove?.('storyboard-3d-inspector-resizing'));
    try {
      event35.splitter.hasPointerCapture?.(event35.pointerId) &&
        event35.splitter.releasePointerCapture?.(event35.pointerId);
    } catch {}
    (this.window?.removeEventListener?.(
      'pointermove',
      this._handleInspectorResizePointerMove,
      true,
    ),
      this.window?.removeEventListener?.('pointerup', this._handleInspectorResizePointerUp, true),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleInspectorResizePointerUp,
        true,
      ));
  }
  ['_applyRightSidebarWidth'](value394, value395 = null) {
    const el61 = value395 || this.root?.querySelector?.('.storyboard-3d-editor-main'),
      value396 = el61?.getBoundingClientRect?.().width || this.window?.innerWidth || 1440;
    return (
      (this.rightSidebarWidth = normalizeStoryboard3DRightSidebarWidth(value394, value396)),
      el61?.style?.setProperty?.(
        '--storyboard-3d-right-sidebar-width',
        this.rightSidebarWidth + 'px',
      ),
      el61?.querySelector?.('[data-storyboard-3d-right-sidebar-splitter]')?.setAttribute?.(
        'aria-valuenow',
        String(this.rightSidebarWidth),
      ),
      this.rightSidebarWidth
    );
  }
  ['_handleRightSidebarResizePointerDown'](event36) {
    const splitter2 = event36.target?.closest?.('[data-storyboard-3d-right-sidebar-splitter]');
    if (
      !splitter2 ||
      event36.isPrimary === false ||
      (Number.isFinite(event36.button) && event36.button !== 0)
    )
      return;
    const el62 = splitter2.closest?.('.storyboard-3d-right-sidebar'),
      layout2 = el62?.closest?.('.storyboard-3d-editor-main'),
      right = el62?.getBoundingClientRect?.();
    if (!right?.width || !layout2) return;
    (event36.preventDefault?.(), event36.stopImmediatePropagation?.());
    const pointerId3 = event36.pointerId;
    try {
      splitter2.setPointerCapture?.(pointerId3);
    } catch {}
    ((this._rightSidebarResize = {
      pointerId: pointerId3,
      splitter: splitter2,
      layout: layout2,
      right: right.right,
    }),
      this.document?.body?.classList?.add?.('storyboard-3d-right-sidebar-resizing'),
      this._applyRightSidebarWidth(right.right - Number(event36.clientX), layout2),
      this.window?.addEventListener?.(
        'pointermove',
        this._handleRightSidebarResizePointerMove,
        true,
      ),
      this.window?.addEventListener?.('pointerup', this._handleRightSidebarResizePointerUp, true),
      this.window?.addEventListener?.(
        'pointercancel',
        this._handleRightSidebarResizePointerUp,
        true,
      ));
  }
  ['_handleRightSidebarResizePointerMove'](event37) {
    const event38 = this._rightSidebarResize;
    if (!event38 || (event38.pointerId != null && event37.pointerId !== event38.pointerId)) return;
    (event37.preventDefault?.(),
      event37.stopImmediatePropagation?.(),
      this._applyRightSidebarWidth(event38.right - Number(event37.clientX), event38.layout));
  }
  ['_handleRightSidebarResizePointerUp'](event39) {
    const event40 = this._rightSidebarResize;
    if (!event40 || (event40.pointerId != null && event39?.pointerId !== event40.pointerId)) return;
    (event39?.preventDefault?.(),
      event39?.stopImmediatePropagation?.(),
      (this._rightSidebarResize = null),
      this.document?.body?.classList?.remove?.('storyboard-3d-right-sidebar-resizing'));
    try {
      event40.splitter.hasPointerCapture?.(event40.pointerId) &&
        event40.splitter.releasePointerCapture?.(event40.pointerId);
    } catch {}
    (this.window?.removeEventListener?.(
      'pointermove',
      this._handleRightSidebarResizePointerMove,
      true,
    ),
      this.window?.removeEventListener?.(
        'pointerup',
        this._handleRightSidebarResizePointerUp,
        true,
      ),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleRightSidebarResizePointerUp,
        true,
      ));
  }
  ['_applyTimelineHeight'](value397, value398 = null) {
    const el63 = value398 || this.root?.querySelector?.('.storyboard-3d-viewport-column'),
      value399 =
        el63?.getBoundingClientRect?.().height ||
        this.root?.getBoundingClientRect?.().height ||
        this.window?.innerHeight ||
        900;
    return (
      (this.timelineHeight = normalizeStoryboard3DTimelineHeight(value397, value399)),
      el63?.style?.setProperty?.('--storyboard-3d-timeline-height', this.timelineHeight + 'px'),
      el63?.querySelector?.('[data-storyboard-3d-timeline-resize-handle]')?.setAttribute?.(
        'aria-valuenow',
        String(this.timelineHeight),
      ),
      this.timelineHeight
    );
  }
  ['_handleTimelineResizePointerDown'](event41) {
    const handle2 = event41.target?.closest?.('[data-storyboard-3d-timeline-resize-handle]');
    if (
      !handle2 ||
      event41.isPrimary === false ||
      (Number.isFinite(event41.button) && event41.button !== 0)
    )
      return;
    const column = handle2.closest?.('.storyboard-3d-viewport-column'),
      box18 = column?.getBoundingClientRect?.(),
      value400 = handle2.closest?.('.storyboard-3d-shot-dock')?.getBoundingClientRect?.().height;
    if (!box18?.height) return;
    const pointerId4 = event41.pointerId;
    try {
      handle2.setPointerCapture?.(pointerId4);
    } catch {}
    ((this._timelineResize = {
      pointerId: pointerId4,
      handle: handle2,
      column: column,
      startHeight: Number(value400) || this.timelineHeight,
      startY: Number(event41.clientY),
      moved: false,
    }),
      this.window?.addEventListener?.('pointermove', this._handleTimelineResizePointerMove, true),
      this.window?.addEventListener?.('pointerup', this._handleTimelineResizePointerUp, true),
      this.window?.addEventListener?.('pointercancel', this._handleTimelineResizePointerUp, true));
  }
  ['_handleTimelineResizePointerMove'](event42) {
    const event43 = this._timelineResize;
    if (!event43 || (event43.pointerId != null && event42.pointerId !== event43.pointerId)) return;
    const value401 = Number(event42.clientY);
    if (!Number.isFinite(value401)) return;
    if (!event43.moved && Math.abs(value401 - event43.startY) < 4) return;
    (event42.preventDefault?.(),
      event42.stopImmediatePropagation?.(),
      !event43.moved &&
        ((event43.moved = true),
        (this._suppressTimelineToggleClick = true),
        this.shotTimelineController?.setDrawerOpen?.(true),
        this.document?.body?.classList?.add?.('storyboard-3d-timeline-resizing')),
      this._applyTimelineHeight(event43.startHeight + event43.startY - value401, event43.column));
  }
  ['_handleTimelineResizePointerUp'](event44) {
    const event45 = this._timelineResize;
    if (!event45 || (event45.pointerId != null && event44?.pointerId !== event45.pointerId)) return;
    event45.moved && (event44?.preventDefault?.(), event44?.stopImmediatePropagation?.());
    ((this._timelineResize = null),
      this.document?.body?.classList?.remove?.('storyboard-3d-timeline-resizing'));
    try {
      event45.handle.hasPointerCapture?.(event45.pointerId) &&
        event45.handle.releasePointerCapture?.(event45.pointerId);
    } catch {}
    (this.window?.removeEventListener?.('pointermove', this._handleTimelineResizePointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleTimelineResizePointerUp, true),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleTimelineResizePointerUp,
        true,
      ));
    if (event45.moved) {
      const value402 = () => {
        this._suppressTimelineToggleClick = false;
      };
      typeof this.window?.setTimeout === 'function'
        ? this.window.setTimeout(value402, 0)
        : globalThis.setTimeout?.(value402, 0);
    }
  }
  ['_openAssetLibrary']() {
    ((this.assetVisibleLimit = Math.max(32, this.assetVisibleLimit)),
      (this.rightSidebarMode = 'assets'),
      this.editorStore.setAssetLibraryOpen(true),
      this._render(),
      this.root?.querySelector?.('[data-storyboard-3d-asset-query]')?.focus?.());
  }
  ['_openBackgroundPerspective']() {
    ((this.rightSidebarMode = 'perspective'),
      this.editorStore.setAssetLibraryOpen(false),
      this._assetThumbnailObserver?.disconnect?.(),
      (this._assetThumbnailObserver = null),
      this._render());
  }
  ['_setSelectedObjects'](value403, { openProperties: openProperties = true } = {}) {
    const value404 = this.editorStore.setSelectedObjects(value403);
    if (openProperties && value404.selectedObjectIds.length > 0) {
      this.rightSidebarMode = 'object';
      if (value404.assetLibraryOpen) this.editorStore.setAssetLibraryOpen(false);
      (this._assetThumbnailObserver?.disconnect?.(), (this._assetThumbnailObserver = null));
    } else
      value404.selectedObjectIds.length === 0 &&
        this.rightSidebarMode === 'object' &&
        (this.rightSidebarMode = Number(this.window?.innerWidth) <= 900 ? null : 'ai');
    return value404.selectedObjectIds;
  }
  ['_toggleAIAssistant']() {
    const value405 = this.rightSidebarMode !== 'ai';
    ((this.rightSidebarMode = value405 ? 'ai' : null),
      this.editorStore.setAssetLibraryOpen(false),
      this._assetThumbnailObserver?.disconnect?.(),
      (this._assetThumbnailObserver = null),
      this._render());
    if (value405) this.root?.querySelector?.('[data-storyboard-3d-ai-instruction]')?.focus?.();
  }
  ['_setMessage'](value406) {
    this._message = String(value406 || '');
    const el64 = this.root?.querySelector?.('[data-storyboard-3d-message]');
    if (!el64) return;
    ((el64.textContent = this._message), (el64.hidden = !this._message));
  }
  async ['_runAICommand']() {
    const el65 = this.root?.querySelector?.('[data-storyboard-3d-ai-instruction]'),
      instruction = String(el65?.value || this.aiState.instruction || '').trim();
    if (!instruction) {
      this._setMessage('请先输入要执行的 3D 场景指令。');
      return;
    }
    try {
      await this._requireInstalledModelPack();
    } catch (error25) {
      this._setMessage(error25?.message || String(error25));
      return;
    }
    this.aiController.setInstruction(instruction);
    try {
      const value407 = await this.aiController.submit({ instruction: instruction });
      if (value407) {
        this._setMessage(value407.plan?.summary || 'AI 场景指令已执行。');
        const activeStoryboard3DScene9 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
        if (activeStoryboard3DScene9)
          void this._generateMissingShotThumbnails(activeStoryboard3DScene9.id);
      }
    } catch {}
  }
  ['_persistProject'](projectId2, reason = {}) {
    const value408 = this.onProjectChange?.(projectId2, reason);
    dispatchWorkspaceEvent(this.window, 'storyboard-3d:project-changed', {
      projectId: projectId2.id,
      updatedAt: projectId2.updatedAt,
      reason: reason.reason,
    });
    if (reason.reason === 'select-shot') {
      const sceneId9 = getActiveStoryboard3DScene(projectId2);
      dispatchWorkspaceEvent(this.window, 'storyboard-3d:shot-selected', {
        projectId: this.projectId,
        sceneId: sceneId9?.id || '',
        shotId: sceneId9?.activeShotId || '',
      });
    }
    return value408;
  }
  ['_getFlyMovementKey'](value409) {
    return (
      { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', KeyQ: 'down', KeyE: 'up' }[
        value409
      ] || ''
    );
  }
  ['_scheduleFlyMovement']() {
    if (this._flyFrame != null || this._flyKeys.size === 0) return;
    const run9 =
      this.window?.requestAnimationFrame?.bind(this.window) ||
      globalThis.requestAnimationFrame?.bind(globalThis);
    if (!run9) return;
    ((this._flyLastTime =
      this._flyLastTime || this.window?.performance?.now?.() || Date.now()),
      (this._flyFrame = run9((value410) => {
        this._flyFrame = null;
        if (
          !this.editorStore.getSnapshot().flyMode ||
          !this.sceneRuntime ||
          this._flyKeys.size === 0
        )
          return;
        const value411 = Number(value410) || this.window?.performance?.now?.() || Date.now(),
          value412 = Math.max(0, Math.min(0.1, (value411 - this._flyLastTime) / 1000));
        this._flyLastTime = value411;
        const args12 = this._flySceneView || this.sceneRuntime.getSceneView?.();
        if (!args12) return;
        const args13 = applySceneFlyMovement(
          args12,
          {
            forward:
              (this._flyKeys.has('forward') ? 1 : 0) -
              (this._flyKeys.has('backward') ? 1 : 0),
            right:
              (this._flyKeys.has('right') ? 1 : 0) - (this._flyKeys.has('left') ? 1 : 0),
            vertical:
              (this._flyKeys.has('up') ? 1 : 0) - (this._flyKeys.has('down') ? 1 : 0),
            boost: this._flyBoost,
          },
          value412,
          { speed: 4, boostMultiplier: 4 },
        );
        ((this._flySceneView = { ...args12, ...args13 }),
          this._cameraDrag?.mode === 'fly-look' &&
            (this._cameraDrag.latestSceneView = this._flySceneView),
          this.sceneRuntime.previewSceneView?.(this._flySceneView),
          (this._miniMapPreviewSceneView = structuredClone(this._flySceneView)),
          this._scheduleMiniMapRefresh(),
          this.viewportControls &&
            ((this.viewportControls.sceneView = structuredClone(this._flySceneView)),
            (this.viewportControls.perspectiveSceneView = structuredClone(this._flySceneView))),
          this._scheduleFlyMovement());
      })));
  }
  ['_stopFlyMovementFrame']() {
    const value413 =
      this.window?.cancelAnimationFrame?.bind(this.window) ||
      globalThis.cancelAnimationFrame?.bind(globalThis);
    if (this._flyFrame != null) value413?.(this._flyFrame);
    ((this._flyFrame = null), (this._flyLastTime = 0));
  }
  ['_finishFlyMovement']({ clearKeys: clearKeys = false } = {}) {
    this._stopFlyMovementFrame();
    const value414 = this._flySceneView;
    if (value414) this.sceneRuntime?.commitSceneView?.(value414);
    ((this._flySceneView = null),
      (this._miniMapPreviewSceneView = null),
      this._scheduleMiniMapRefresh(),
      clearKeys && (this._flyKeys.clear(), (this._flyBoost = false)),
      !this._closed &&
        value414 &&
        this.shotTimelineController?.isAutoKeyEnabled?.() &&
        this.shotTimelineController.recordCameraKeyframe(this._readCurrentCameraState()));
  }
  ['_setFlyMode'](value415) {
    const enabled37 = value415 === true;
    if (!enabled37) this._finishFlyMovement({ clearKeys: true });
    (enabled37 &&
      this.viewportControls?.getSnapshot?.().viewMode !== 'perspective' &&
      this.viewportControls.showPerspectiveView?.(),
      this.editorStore.setFlyMode(enabled37),
      this._render(),
      this.root?.querySelector?.('.storyboard-3d-viewport')?.focus?.(),
      this._setMessage(
        enabled37 ? '飞行模式已开启：WASD 移动，Q/E 升降，右键观察，Shift 加速。' : '飞行模式已关闭。',
      ));
  }
  ['_handleWindowKeyUp'](event46) {
    if (!this.root || !this.editorStore.getSnapshot().flyMode) return;
    const enabled38 = this._getFlyMovementKey(event46.code),
      enabled39 = event46.code === 'ShiftLeft' || event46.code === 'ShiftRight';
    if (!enabled38 && !enabled39) return;
    (event46.preventDefault?.(), event46.stopImmediatePropagation?.());
    if (enabled38) this._flyKeys.delete(enabled38);
    if (enabled39) this._flyBoost = false;
    if (this._flyKeys.size === 0) {
      if (this._cameraDrag?.mode === 'fly-look') this._stopFlyMovementFrame();
      else this._finishFlyMovement();
    }
  }
  ['_handleWindowBlur']() {
    (this._finishFlyMovement({ clearKeys: true }),
      this._cancelRuntimeSelection(),
      this._cancelRuntimeTransform(),
      this.shotTimelineController?.stopPlayback?.({ clear: true }));
  }
  ['_toggleNavigationSettings']() {
    const enabled40 = this.root?.querySelector?.('.storyboard-3d-global-settings');
    if (!enabled40) return false;
    return ((enabled40.open = !enabled40.open), true);
  }
  ['_handleWindowKeyDown'](event47) {
    if (!this.root) return;
    if (this.exportController?.root) return;
    if (this.shotTimelineController?.cameraPath?.onKey(event47)) return;
    if (this.shotTimelineController?.editing?.handleKey(event47)) return;
    const el66 = event47.target?.closest?.('[data-storyboard-3d-inspector-splitter]');
    if (el66 && ['ArrowLeft', 'ArrowRight'].includes(event47.key)) {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      const value416 = event47.shiftKey ? 48 : 16;
      this._applyInspectorWidth(
        this.inspectorWidth + (event47.key === 'ArrowLeft' ? value416 : -value416),
        el66.closest?.('.storyboard-3d-editor-main'),
      );
      return;
    }
    const el67 = event47.target?.closest?.('[data-storyboard-3d-right-sidebar-splitter]');
    if (el67 && ['ArrowLeft', 'ArrowRight'].includes(event47.key)) {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      const value417 = event47.shiftKey ? 48 : 16,
        value418 = Number.isFinite(this.rightSidebarWidth)
          ? this.rightSidebarWidth
          : el67.closest?.('.storyboard-3d-right-sidebar')?.getBoundingClientRect?.().width;
      this._applyRightSidebarWidth(
        value418 + (event47.key === 'ArrowLeft' ? value417 : -value417),
        el67.closest?.('.storyboard-3d-editor-main'),
      );
      return;
    }
    const el68 = event47.target?.closest?.('[data-storyboard-3d-timeline-resize-handle]');
    if (el68 && ['ArrowUp', 'ArrowDown'].includes(event47.key)) {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      const value419 = event47.shiftKey ? 64 : 24;
      (this.shotTimelineController?.setDrawerOpen?.(true),
        this._applyTimelineHeight(
          this.timelineHeight + (event47.key === 'ArrowUp' ? value419 : -value419),
          el68.closest?.('.storyboard-3d-viewport-column'),
        ));
      return;
    }
    if (this.rightSidebarMode) {
      const value420 = this.root.querySelector('.storyboard-3d-right-sidebar');
      if (value420?.contains?.(event47.target)) {
        if (trapTabKey(event47, value420, this.document)) return;
        event47.stopImmediatePropagation();
        return;
      }
    }
    if (trapTabKey(event47, this.root, this.document)) return;
    const enabled41 = event47.target?.matches?.(
        'input, textarea, select, [contenteditable=\'true\']',
      ),
      value421 =
        !enabled41 &&
        !event47.altKey &&
        !event47.ctrlKey &&
        !event47.metaKey &&
        !event47.shiftKey &&
        (event47.code === 'KeyK' || String(event47.key || '').toLowerCase() === 'k');
    if (value421) {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      if (!event47.repeat) this._toggleNavigationSettings();
      return;
    }
    const value422 =
      !enabled41 &&
      !event47.altKey &&
      !event47.ctrlKey &&
      !event47.metaKey &&
      !event47.shiftKey &&
      (event47.code === 'Space' || event47.key === ' ') &&
      !event47.target?.closest?.("button, a, [role='button']");
    if (value422) {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      if (!event47.repeat) this.shotTimelineController?.togglePlayback?.();
      return;
    }
    if (
      !enabled41 &&
      event47.shiftKey &&
      (event47.code === 'KeyF' || event47.key.toLowerCase() === 'f')
    ) {
      (event47.preventDefault(),
        event47.stopImmediatePropagation(),
        this._setFlyMode(!this.editorStore.getSnapshot().flyMode));
      return;
    }
    if (!enabled41 && this.editorStore.getSnapshot().flyMode) {
      const value423 = this._getFlyMovementKey(event47.code),
        value424 = event47.code === 'ShiftLeft' || event47.code === 'ShiftRight';
      if (value423 || value424) {
        (event47.preventDefault(), event47.stopImmediatePropagation());
        if (value423) this._flyKeys.add(value423);
        if (value424 || event47.shiftKey) this._flyBoost = true;
        this._scheduleFlyMovement();
        return;
      }
    }
    if (!enabled41 && (event47.ctrlKey || event47.metaKey) && event47.key.toLowerCase() === 'z') {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      if (this._cancelRuntimeSelection()) return;
      if (this._cancelRuntimeTransform()) return;
      if (event47.shiftKey) this.commandHistory.redo();
      else this.commandHistory.undo();
      return;
    }
    if (event47.key === 'Escape') {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      if (this._cancelRuntimeSelection()) return;
      if (this._cancelRuntimeTransform()) return;
      if (this.editorStore.getSnapshot().flyMode) {
        this._setFlyMode(false);
        return;
      }
      if (this.editorStore.getSnapshot().selectedObjectIds.length > 0) {
        (this._setSelectedObjects([]), this._render());
        return;
      }
      this.close();
      return;
    }
    const value425 =
      !enabled41 && !event47.altKey && !event47.ctrlKey && !event47.metaKey
        ? resolveStoryboard3DToolFromShortcut(event47.key, this.navigationSettings.preset)
        : null;
    if (value425) {
      (event47.preventDefault(),
        event47.stopImmediatePropagation(),
        this.editorStore.setActiveTool(value425),
        this._render());
      return;
    }
    if (!enabled41 && !event47.shiftKey && event47.key.toLowerCase() === 'f') {
      (event47.preventDefault(), event47.stopImmediatePropagation());
      if (!this.viewportControls?.focusSelection?.()) this._setMessage('请先选择一个可见对象。');
      return;
    }
    if (!enabled41 && event47.key === 'Home') {
      (event47.preventDefault(),
        event47.stopImmediatePropagation(),
        this.viewportControls?.fitAll?.());
      return;
    }
    const value426 =
      ['Delete', 'Backspace'].includes(event47.key) ||
      (!event47.shiftKey &&
        !event47.altKey &&
        !event47.ctrlKey &&
        !event47.metaKey &&
        event47.code === 'KeyD');
    if (!enabled41 && value426) {
      const list24 = this.editorStore.getSnapshot().selectedObjectIds;
      if (list24.length > 0) {
        (event47.preventDefault(), event47.stopImmediatePropagation(), this._deleteObjects(list24));
        return;
      }
    }
    event47.stopImmediatePropagation();
  }
  ['_addAssetToActiveScene'](name, { position: position = null } = {}) {
    let value427 = '';
    const list25 = this.sceneRuntime?.resolveViewportGroundPosition?.(0),
      position3 = Array.isArray(position)
        ? position.slice(0, 3)
        : Array.isArray(list25)
          ? list25.slice(0, 3)
          : resolveStoryboard3DViewportCenterPosition(this.sceneRuntime?.getSceneView?.());
    (this._executeMutation({
      type: 'add-object',
      label: 'Add asset',
      renderOptions: { preserveAssetLibrary: true },
      mutate: (value428) => {
        const enabled42 = value428.scenes.find(
          (value429) => value429.id === value428.activeSceneId,
        );
        if (!enabled42) return value428;
        const bodyPresetId = name.source?.assetId || name.id || '',
          type5 =
            name.category === 'character' &&
            STORYBOARD_3D_BODY_PRESETS.some((value430) => value430.id === bodyPresetId),
          value431 = {
            id: createLocalId(type5 ? 'character' : 'prop'),
            type: type5 ? 'character' : 'prop',
            name: name.name,
            visible: true,
            locked: false,
            transform: { position: position3, rotation: [0, 0, 0], scale: [1, 1, 1] },
            ...(type5
              ? {
                  bodyPresetId: bodyPresetId || 'adult-male',
                  actionId: 'standing',
                  actionPlaying: false,
                  leftHandPoseId: 'relaxed',
                  rightHandPoseId: 'relaxed',
                  boneOverrides: {},
                }
              : {
                  assetId: name.source?.assetId || name.id,
                  ...(name.tint ? { tint: name.tint } : {}),
                  castShadow: true,
                  receiveShadow: true,
                }),
          };
        return (enabled42.objects.push(value431), (value427 = value431.id), value428);
      },
    }),
      this.assetLibrary.markUsed(name.id),
      value427 &&
        (this._setSelectedObjects([value427], { openProperties: false }),
        this._render({ preserveAssetLibrary: true })));
  }
  ['_handleClick'](event48) {
    const el69 = event48.target?.closest?.('[data-storyboard-3d-action]');
    if (!el69 || el69.disabled) return;
    const type6 = el69.getAttribute('data-storyboard-3d-action');
    if (type6 === 'timeline-toggle-drawer' && this._suppressTimelineToggleClick) {
      ((this._suppressTimelineToggleClick = false),
        event48.preventDefault?.(),
        event48.stopImmediatePropagation?.());
      return;
    }
    if (this.shotTimelineController?.handleClick?.(type6, el69, event48)) return;
    if (type6 === 'set-inspector-tab') {
      const value432 = this.root?.querySelector?.('.storyboard-3d-inspector-dock');
      if (value432) value432.scrollTop = 0;
      (this.editorStore.setInspectorTab(el69.dataset.inspectorTab), this._render());
      return;
    }
    if (type6 === 'toggle-object-outline') {
      const enabled43 = el69.closest('.storyboard-3d-object-popover');
      this.editorStore.setObjectOutlineOpen(!enabled43?.open);
      return;
    }
    if (type6 === 'toggle-scene-environment') {
      const enabled44 = el69.closest('[data-storyboard-3d-scene-environment]');
      this.sceneEnvironmentOpen = !enabled44?.open;
      return;
    }
    if (type6 === 'toggle-fly-mode') {
      this._setFlyMode(!this.editorStore.getSnapshot().flyMode);
      return;
    }
    if (type6 === 'open-asset-library') {
      this._openAssetLibrary();
      return;
    }
    if (type6 === 'open-background-perspective') {
      this._openBackgroundPerspective();
      return;
    }
    if (type6 === 'toggle-ai-sidebar') {
      this._toggleAIAssistant();
      return;
    }
    if (type6 === 'select-asset-category') {
      ((this.assetCategory = String(el69.getAttribute('data-storyboard-3d-asset-category') || 'all')),
        (this.assetVisibleLimit = 32),
        this._render());
      return;
    }
    if (type6 === 'rebuild-viewport') {
      this._rebuildSceneRuntime();
      return;
    }
    if (type6 === 'focus-selection') {
      if (!this.viewportControls?.focusSelection?.()) this._setMessage('请先选择一个可见对象。');
      return;
    }
    if (type6 === 'fit-all') {
      this.viewportControls?.fitAll?.();
      return;
    }
    if (type6 === 'reset-focal-length') {
      this._commitFocalLength(STORYBOARD_3D_FOCAL_LENGTH_PRESETS.indexOf(35));
      return;
    }
    if (type6 === 'set-viewport-view') {
      const value433 = el69.dataset.view;
      if (value433 === 'perspective') this.viewportControls?.showPerspectiveView?.();
      else this.viewportControls?.showOrthographicView?.(value433);
      return;
    }
    if (type6 === 'toggle-viewport-setting') {
      const value434 = el69.getAttribute('data-storyboard-3d-viewport-setting-toggle');
      if (!['transformSpace', 'snapEnabled', 'groundLock', 'uniformScale'].includes(value434)) return;
      const args14 =
          value434 === 'transformSpace'
            ? { transformSpace: this.viewportSettings.transformSpace === 'local' ? 'world' : 'local' }
            : { [value434]: this.viewportSettings[value434] !== true },
        value435 =
          this.viewportControls?.updateSettings?.(args14) ||
          normalizeStoryboard3DViewportSettings({ ...this.viewportSettings, ...args14 });
      (this._saveTransformSettings(value435),
        this.sceneRuntime?.setViewportUIPatch?.(
          this.viewportControls?.getDirectorUIPatch?.() || {},
        ),
        this._render());
      return;
    }
    if (type6 === 'toggle-top-view') {
      const value436 = this.viewportControls?.getSnapshot?.().viewMode;
      if (value436 === 'top') this.viewportControls.showPerspectiveView();
      else this.viewportControls?.showTopView?.();
      return;
    }
    if (type6 === 'run-ai-command') {
      void this._runAICommand();
      return;
    }
    if (type6 === 'toggle-mini-map') {
      ((this.miniMapExpanded = !this.miniMapExpanded), this._render());
      return;
    }
    if (type6 === 'cancel-ai-command') {
      this.aiController.cancel();
      return;
    }
    if (type6 === 'toggle-ai-voice') {
      ['starting', 'listening', 'transcribing', 'stopping'].includes(this.aiState.status)
        ? this.aiController.stopVoice()
        : this.aiController.startVoice({ language: 'zh-CN' });
      return;
    }
    if (type6 === 'undo') {
      this.commandHistory.undo();
      return;
    }
    if (type6 === 'redo') {
      this.commandHistory.redo();
      return;
    }
    if (type6 === 'undo-ai-command') {
      this.commandHistory.getSnapshot().nextUndoLabel === 'AI scene transaction' &&
        (this.commandHistory.undo(),
        this._setMessage('已撤销本次 AI 场景修改。'),
        this._syncAIAssistant());
      return;
    }
    if (type6 === 'set-tool') {
      (this.editorStore.setActiveTool(el69.dataset.tool), this._render());
      return;
    }
    if (['toggle-object-visibility', 'toggle-object-lock'].includes(type6)) {
      const value437 = el69.dataset.objectId,
        value438 = type6 === 'toggle-object-visibility' ? 'visible' : 'locked';
      this._executeMutation({
        type: 'toggle-object-' + value438,
        label: 'Toggle object ' + value438,
        mutate: (value439) => {
          const value440 = value439.scenes.find(
              (value441) => value441.id === value439.activeSceneId,
            ),
            value442 = value440?.objects?.find((value443) => value443.id === value437);
          return (
            value442 &&
              (value442[value438] =
                value438 === 'visible' ? value442.visible === false : value442.locked !== true),
            value439
          );
        },
      });
      return;
    }
    if (type6 === 'edit-object-name') {
      const value444 = el69.dataset.objectId,
        value445 = el69.dataset.objectType,
        args15 = this.editorStore.getSnapshot(),
        value446 = event48.shiftKey || event48.ctrlKey || event48.metaKey;
      if (value446) {
        const list26 = args15.selectedObjectIds.includes(value444)
          ? args15.selectedObjectIds.filter((value447) => value447 !== value444)
          : [...args15.selectedObjectIds, value444];
        if (value445 === 'camera' && list26.includes(value444)) {
          if (!this._activateShotForCamera(value444)) return;
        }
        (this._setSelectedObjects(list26), this._render());
        return;
      }
      const value448 =
        args15.selectedObjectIds.length === 1 &&
        args15.selectedObjectIds[0] === value444 &&
        !args15.assetLibraryOpen &&
        this.rightSidebarMode === 'object';
      if (value448) return;
      if (value445 === 'camera' && !this._activateShotForCamera(value444)) return;
      (this._setSelectedObjects([value444]), this._render());
      const el70 = [...(this.root?.querySelectorAll?.('[data-storyboard-3d-outline-name]') || [])].find((el71) => el71.dataset.objectId === value444);
      (el70?.focus?.(), el70?.select?.());
      if (value445 === 'camera') this._focusCameraObject(value444);
      return;
    }
    if (type6 === 'select-object') {
      const enabled45 = el69.dataset.objectId,
        list27 = this.editorStore.getSnapshot().selectedObjectIds,
        value449 = event48.shiftKey || event48.ctrlKey || event48.metaKey,
        list28 = !enabled45
          ? []
          : value449
            ? list27.includes(enabled45)
              ? list27.filter((value450) => value450 !== enabled45)
              : [...list27, enabled45]
            : [enabled45];
      if (el69.dataset.objectType === 'camera' && list28.includes(enabled45)) {
        if (!this._activateShotForCamera(enabled45)) return;
      }
      (this._setSelectedObjects(list28), this._render());
      el69.dataset.objectType === 'camera' &&
        list28.length === 1 &&
        this._focusCameraObject(enabled45);
      return;
    }
    if (type6 === 'open-explore') {
      this._clearShotCandidates();
      const activeStoryboard3DScene10 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
      ((this.exploreFilter = 'all'),
        (this.exploreVariation = 0),
        (this.shotCandidates = generateStoryboard3DShotCandidates(activeStoryboard3DScene10, {
          count: 9,
          variation: 0,
        })),
        (this.exploreOpen = true),
        this._render());
      return;
    }
    if (type6 === 'filter-explore') {
      ((this.exploreFilter = ['all', 'close', 'medium', 'wide'].includes(
        el69.dataset.exploreFilter,
      )
        ? el69.dataset.exploreFilter
        : 'all'),
        this._render());
      return;
    }
    if (type6 === 'regenerate-explore') {
      const activeStoryboard3DScene11 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
      (this._clearShotCandidates(),
        (this.exploreVariation += 1),
        (this.shotCandidates = generateStoryboard3DShotCandidates(activeStoryboard3DScene11, {
          count: 9,
          variation: this.exploreVariation,
        })),
        this._render());
      return;
    }
    if (type6 === 'close-explore') {
      ((this.exploreOpen = false), this._clearShotCandidates(), this._render());
      return;
    }
    if (type6 === 'preview-candidate') {
      const enabled46 = this.shotCandidates[Number(el69.dataset.candidateIndex)],
        value451 = this.projectStore.getSnapshot(),
        activeStoryboard3DScene12 = getActiveStoryboard3DScene(value451),
        activeStoryboard3DShot7 = getActiveStoryboard3DShot(value451);
      if (!enabled46 || !activeStoryboard3DScene12 || !activeStoryboard3DShot7 || !this.sceneRuntime)
        return;
      const project9 = structuredClone(value451),
        sceneId10 = getActiveStoryboard3DScene(project9),
        activeStoryboard3DShot8 = getActiveStoryboard3DShot(project9);
      ((activeStoryboard3DShot8.camera = structuredClone(enabled46.camera)),
        this.sceneRuntime.sync({
          project: project9,
          sceneId: sceneId10.id,
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        this.sceneRuntime.renderNow(),
        this._setMessage(
          '正在预览 ' + enabled46.shotSize + ' · ' + enabled46.shotAngle + ' 候选机位。',
        ));
      return;
    }
    if (type6 === 'replace-with-candidate' || type6 === 'append-candidate') {
      const enabled47 = this.shotCandidates[Number(el69.dataset.candidateIndex)];
      if (!enabled47) return;
      (this._executeMutation({
        type: type6 === 'append-candidate' ? 'append-shot-candidate' : 'replace-shot-candidate',
        label: type6 === 'append-candidate' ? 'Append shot candidate' : 'Replace shot candidate',
        mutate: (value452) => {
          const count8 = value452.scenes.findIndex(
            (value453) => value453.id === value452.activeSceneId,
          );
          if (count8 < 0) return value452;
          const value454 = value452.scenes[count8];
          return (
            (value452.scenes[count8] =
              type6 === 'append-candidate'
                ? appendStoryboard3DShotCandidate(value454, enabled47)
                : replaceStoryboard3DShotWithCandidate(value454, value454.activeShotId, enabled47)),
            value452
          );
        },
      }),
        (this.exploreOpen = false),
        this._clearShotCandidates(),
        this._render());
      const activeStoryboard3DScene13 = getActiveStoryboard3DScene(this.projectStore.getSnapshot()),
        value455 = activeStoryboard3DScene13?.shots?.find(
          (value456) => value456.id === activeStoryboard3DScene13.activeShotId,
        );
      value455 &&
        (this._setSelectedObjects([value455.cameraId]),
        this._render(),
        this._focusCameraObject(value455.cameraId),
        void this._generateShotThumbnail(activeStoryboard3DScene13.id, value455.id));
      return;
    }
    if (type6 === 'add-asset') {
      const value457 = el69.dataset.assetId,
        error26 = this.assetLibrary.find(value457);
      if (!error26) return;
      const position4 =
        this.sceneRuntime?.resolveViewportGroundPosition?.(0) ||
        resolveStoryboard3DViewportCenterPosition(this.sceneRuntime?.getSceneView?.());
      if (error26.source?.kind === 'pack' && !this.importedModelScenes.has(error26.id)) {
        (this._setMessage('正在加载模型包素材“' + error26.name + '”…'),
          void this._loadPackAsset(error26.id)
            .then(() => {
              if (this._closed) return;
              (this._addAssetToActiveScene(error26, { position: position4 }),
                this._setMessage('模型包素材“' + error26.name + '”已加入场景。'));
            })
            .catch((error27) => this._setMessage(error27?.message || String(error27))));
        return;
      }
      this._addAssetToActiveScene(error26, { position: position4 });
      return;
    }
    if (type6 === 'toggle-asset-favorite') {
      const value458 = el69.dataset.assetId;
      if (this.favoriteAssetIds.has(value458)) this.favoriteAssetIds.delete(value458);
      else this.favoriteAssetIds.add(value458);
      this._render();
      return;
    }
    if (type6 === 'load-more-assets') {
      ((this.assetVisibleLimit = Math.min(1600, this.assetVisibleLimit + 32)), this._render());
      return;
    }
    if (type6 === 'toggle-character-play') {
      const value459 = el69.dataset.objectId;
      this._executeMutation({
        type: 'toggle-character-playback',
        label: 'Toggle character playback',
        mutate: (value460) => {
          const value461 = value460.scenes.find(
              (value462) => value462.id === value460.activeSceneId,
            ),
            enabled48 = value461?.objects?.find((value463) => value463.id === value459);
          return (
            enabled48?.type === 'character' &&
              Object.assign(
                enabled48,
                setStoryboard3DCharacterActionPlayback(enabled48, !enabled48.actionPlaying),
              ),
            value460
          );
        },
      });
      return;
    }
    if (type6 === 'extract-character-pose') {
      const el72 = this.root.querySelector('[data-storyboard-3d-pose-image-input]');
      if (!el72) return;
      ((el72.dataset.objectId = String(el69.dataset.objectId || '')), el72.click?.());
      return;
    }
    if (type6 === 'cancel-character-pose') {
      const value464 = String(el69.dataset.objectId || '');
      (this.characterImagePoseController.clear(value464), this._setMessage('已取消人物姿势识别。'));
      return;
    }
    if (type6 === 'reset-character-pose') {
      const value465 = String(el69.dataset.objectId || '');
      (this.characterImagePoseController.clear(value465),
        this._executeMutation({
          type: 'reset-character-pose',
          label: 'Reset character pose',
          mutate: (value466) => {
            for (const value467 of value466.scenes || []) {
              const value468 = value467.objects?.find((value469) => value469.id === value465);
              if (value468?.type !== 'character') continue;
              value468.boneOverrides = {};
              break;
            }
            return value466;
          },
        }),
        this._setMessage('已重置人物骨骼姿势。'));
      return;
    }
    if (type6 === 'import-model') {
      this.root.querySelector('[data-storyboard-3d-model-input]')?.click?.();
      return;
    }
    if (type6 === 'cancel-model-import') {
      (this.modelImportJob?.cancel?.('用户取消了模型导入'),
        (this.modelImportState = this.modelImportJob?.getSnapshot?.() || this.modelImportState),
        this._render());
      return;
    }
    if (type6 === 'add-scene') {
      (this._executeMutation({
        type: 'add-scene',
        label: 'Add scene',
        mutate: (value470) => {
          const storyboard3DScene = createStoryboard3DScene({
            name: '场景 ' + (value470.scenes.length + 1),
            shotName: '镜头 1',
          });
          return (
            value470.scenes.push(storyboard3DScene),
            (value470.activeSceneId = storyboard3DScene.id),
            value470
          );
        },
      }),
        this._setSelectedObjects([]),
        this._render());
      return;
    }
    if (['duplicate-scene', 'delete-scene', 'move-scene'].includes(type6)) {
      const value471 = el69.dataset.sceneId,
        value472 = Number(el69.dataset.direction) || 0,
        value473 = this.projectStore.getSnapshot(),
        value474 = value473.scenes.findIndex((value475) => value475.id === value471);
      (this._executeMutation({
        type: type6,
        label: type6,
        mutate: (value476) => {
          if (type6 === 'duplicate-scene')
            return duplicateStoryboard3DScene(value476, value471, {
              name:
                (value476.scenes.find((value477) => value477.id === value471)?.name || '场景') +
                ' 副本',
              now: Date.now(),
            });
          if (type6 === 'delete-scene')
            return deleteStoryboard3DScene(value476, value471, { now: Date.now() });
          return reorderStoryboard3DScene(value476, value471, value474 + value472, {
            now: Date.now(),
          });
        },
      }),
        this._setSelectedObjects([]),
        this._render());
      return;
    }
    if (type6 === 'add-shot') {
      const camera7 = this._readCurrentCameraState();
      if (!camera7) {
        this._setMessage('当前摄像机状态不可用。');
        return;
      }
      const activeStoryboard3DScene14 = getActiveStoryboard3DScene(this.projectStore.getSnapshot()),
        guardStoryboard3DBackgroundCameraChange4 = guardStoryboard3DBackgroundCameraChange(
          activeStoryboard3DScene14?.background,
          camera7,
        );
      if (!guardStoryboard3DBackgroundCameraChange4.allowed) {
        this._setMessage(guardStoryboard3DBackgroundCameraChange4.reason);
        return;
      }
      this._executeMutation({
        type: 'add-shot',
        label: 'Add shot from current view',
        mutate: (scene5) => {
          const count9 = scene5.scenes.findIndex(
            (value478) => value478.id === scene5.activeSceneId,
          );
          return (
            count9 >= 0 &&
              (scene5.scenes[count9] = appendShotFromCurrentView({
                scene: scene5.scenes[count9],
                camera: camera7,
              })),
            scene5
          );
        },
      });
      const activeStoryboard3DScene15 = getActiveStoryboard3DScene(this.projectStore.getSnapshot()),
        value479 = activeStoryboard3DScene15?.shots?.find(
          (value480) => value480.id === activeStoryboard3DScene15.activeShotId,
        );
      value479 &&
        (this._setSelectedObjects([value479.cameraId]),
        this._render(),
        this._focusCameraObject(value479.cameraId),
        void this._generateShotThumbnail(activeStoryboard3DScene15.id, value479.id));
      return;
    }
    if (type6 === 'replace-shot-camera') {
      const camera8 = this._readCurrentCameraState(),
        value481 = this.projectStore.getSnapshot(),
        sceneId11 = getActiveStoryboard3DScene(value481),
        shotId2 = el69.dataset.shotId;
      if (!camera8 || !sceneId11) return;
      const guardStoryboard3DBackgroundCameraChange5 = guardStoryboard3DBackgroundCameraChange(
        sceneId11.background,
        camera8,
      );
      if (!guardStoryboard3DBackgroundCameraChange5.allowed) {
        this._setMessage(guardStoryboard3DBackgroundCameraChange5.reason);
        return;
      }
      (this._executeMutation({
        type: 'replace-shot-camera',
        label: 'Replace shot camera',
        mutate: (value482) =>
          replaceStoryboard3DShotFromCurrentView(value482, {
            sceneId: sceneId11.id,
            shotId: shotId2,
            camera: camera8,
            now: Date.now(),
          }),
      }),
        void this._generateShotThumbnail(sceneId11.id, shotId2));
      return;
    }
    if (type6 === 'group-selected') {
      const list29 = this.editorStore.getSnapshot().selectedObjectIds;
      if (list29.length === 0) {
        this._setMessage('请先选择要分组的对象。');
        return;
      }
      let value483 = '';
      this._executeMutation({
        type: 'group-objects',
        label: 'Group selected objects',
        mutate: (value484) => {
          const count10 = value484.scenes.findIndex(
            (value485) => value485.id === value484.activeSceneId,
          );
          if (count10 < 0) return value484;
          const groupStoryboard3DSceneObjects2 = groupStoryboard3DSceneObjects(
            value484.scenes[count10],
            list29,
            {
              name: '新分组',
              idFactory: createLocalId,
            },
          );
          return (
            (value483 = groupStoryboard3DSceneObjects2.objects.at(-1)?.id || ''),
            (value484.scenes[count10] = groupStoryboard3DSceneObjects2),
            value484
          );
        },
      });
      if (value483) this._setSelectedObjects([value483]);
      this._render();
      return;
    }
    if (type6 === 'ungroup-object') {
      const value486 = el69.dataset.objectId;
      (this._executeMutation({
        type: 'ungroup-objects',
        label: 'Ungroup objects',
        mutate: (value487) => {
          const count11 = value487.scenes.findIndex(
            (value488) => value488.id === value487.activeSceneId,
          );
          return (
            count11 >= 0 &&
              (value487.scenes[count11] = ungroupStoryboard3DSceneGroup(
                value487.scenes[count11],
                value486,
              )),
            value487
          );
        },
      }),
        this._setSelectedObjects([]),
        this._render());
      return;
    }
    if (type6 === 'duplicate-object') {
      const value489 = el69.dataset.objectId;
      let value490 = '';
      this._executeMutation({
        type: 'duplicate-object',
        label: 'Duplicate object',
        mutate: (value491) => {
          const value492 = value491.scenes.find(
              (value493) => value493.id === value491.activeSceneId,
            ),
            error28 = value492?.objects?.find((value494) => value494.id === value489);
          if (!error28) return value491;
          if (error28.type === 'camera') {
            const enabled49 = value492.shots?.find(
                (value495) => value495.cameraId === error28.id,
              ),
              count12 = value491.scenes.findIndex((value496) => value496.id === value492.id);
            if (!enabled49 || count12 < 0) return value491;
            const duplicateStoryboard3DShot2 = duplicateStoryboard3DShot(value492, enabled49.id, {
              idFactory: createLocalId,
            });
            return (
              (value491.scenes[count12] = duplicateStoryboard3DShot2),
              (value490 =
                duplicateStoryboard3DShot2.shots.find(
                  (value497) => value497.id === duplicateStoryboard3DShot2.activeShotId,
                )?.cameraId || ''),
              value491
            );
          }
          const error29 = structuredClone(error28);
          return (
            (error29.id = createLocalId(error28.type || 'object')),
            (error29.name = error28.name + ' 副本'),
            (error29.transform.position[0] += 0.5),
            (error29.transform.position[2] += 0.5),
            value492.objects.push(error29),
            (value490 = error29.id),
            value491
          );
        },
      });
      if (value490) {
        (this._setSelectedObjects([value490]), this._render());
        const activeStoryboard3DScene16 = getActiveStoryboard3DScene(this.projectStore.getSnapshot())?.objects?.find((value498) => value498.id === value490);
        if (activeStoryboard3DScene16?.type === 'camera') this._focusCameraObject(value490);
      }
      return;
    }
    if (type6 === 'delete-object') {
      this._deleteObjects(el69.dataset.objectId);
      return;
    }
    if (type6 === 'clear-background') {
      const activeStoryboard3DScene17 = getActiveStoryboard3DScene(this.projectStore.getSnapshot()),
        value499 = activeStoryboard3DScene17?.background?.binaryAssetId;
      (this._getBackgroundImageController(activeStoryboard3DScene17?.id)?.clear?.(),
        this._executeMutation({
          type: 'clear-background',
          label: 'Clear background',
          mutate: (value500) => {
            const value501 = value500.scenes.find(
              (value502) => value502.id === value500.activeSceneId,
            );
            if (value501) delete value501.background;
            return value500;
          },
        }));
      if (value499) void this.binaryAssetRepository.remove(value499).catch(() => {});
      return;
    }
    if (type6 === 'upload-background') {
      this.root.querySelector('[data-storyboard-3d-background-input]')?.click?.();
      return;
    }
    if (type6 === 'analyze-background') {
      void this._reanalyzeActiveBackground();
      return;
    }
    if (type6 === 'add-light') {
      let id = '';
      this._executeMutation({
        type: 'add-light',
        label: 'Add light',
        mutate: (value503) => {
          const enabled50 = value503.scenes.find(
            (value504) => value504.id === value503.activeSceneId,
          );
          if (!enabled50) return value503;
          return (
            (id = createLocalId('light')),
            enabled50.objects.push({
              id: id,
              type: 'light',
              name:
                '灯光 ' +
                (enabled50.objects.filter((value505) => value505.type === 'light').length + 1),
              lightType: 'directional',
              color: '#ffffff',
              intensity: 1,
              visible: true,
              locked: false,
              transform: { position: [3, 5, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
              castShadow: true,
            }),
            value503
          );
        },
      });
      id && (this._setSelectedObjects([id]), this._render());
      return;
    }
    if (['duplicate-shot', 'delete-shot', 'move-shot'].includes(type6)) {
      const value506 = el69.dataset.shotId,
        value507 = Number(el69.dataset.direction) || 0;
      this._executeMutation({
        type: type6,
        label: type6,
        mutate: (value508) => {
          const count13 = value508.scenes.findIndex(
            (value509) => value509.id === value508.activeSceneId,
          );
          if (count13 < 0) return value508;
          const value510 = value508.scenes[count13];
          if (type6 === 'duplicate-shot')
            value508.scenes[count13] = duplicateStoryboard3DShot(value510, value506);
          else {
            if (type6 === 'delete-shot')
              value508.scenes[count13] = deleteStoryboard3DShot(value510, value506);
            else {
              const value511 = value510.shots.findIndex((value512) => value512.id === value506);
              value508.scenes[count13] = reorderStoryboard3DShot(
                value510,
                value506,
                Math.max(0, Math.min(value510.shots.length - 1, value511 + value507)),
              );
            }
          }
          return value508;
        },
      });
      return;
    }
    if (type6 === 'close') {
      this.close();
      return;
    }
    if (type6 === 'select-scene') {
      (this.projectStore.selectScene(el69.dataset.sceneId),
        (this.viewportFocalLength =
          Number(
            getActiveStoryboard3DShot(this.projectStore.getSnapshot())?.camera?.focalLength,
          ) || 35),
        this._render());
      return;
    }
    if (type6 === 'select-shot') {
      const value513 = this.projectStore.getSnapshot(),
        activeStoryboard3DScene18 = getActiveStoryboard3DScene(value513),
        value514 = activeStoryboard3DScene18?.shots?.find(
          (value515) => value515.id === el69.dataset.shotId,
        ),
        guardStoryboard3DBackgroundCameraChange6 = guardStoryboard3DBackgroundCameraChange(
          activeStoryboard3DScene18?.background,
          value514?.camera,
        );
      if (!guardStoryboard3DBackgroundCameraChange6.allowed) {
        this._setMessage(guardStoryboard3DBackgroundCameraChange6.reason);
        return;
      }
      (this.projectStore.selectShot(el69.dataset.shotId),
        (this.viewportFocalLength = Number(value514?.camera?.focalLength) || 35),
        this._render());
      return;
    }
    type6 === 'export-storyboard' && this.exportStoryboard();
  }
  ['_handleInput'](event49) {
    if (event49.target?.matches?.('[data-storyboard-3d-focal-slider]')) {
      this._previewFocalLength(event49.target.value);
      return;
    }
    this.shotTimelineController?.handleInput?.(event49);
  }
  async ['_handleChange'](event50) {
    if (event50.target?.matches?.('[data-storyboard-3d-focal-slider]')) {
      this._commitFocalLength(event50.target.value);
      return;
    }
    if (this.shotTimelineController?.handleChange?.(event50)) return;
    if (event50.target?.matches?.('[data-storyboard-3d-pose-image-input]')) {
      const file = event50.target.files?.[0],
        objectId3 = String(event50.target.dataset.objectId || '');
      ((event50.target.value = ''), delete event50.target.dataset.objectId);
      if (!file || !objectId3) return;
      try {
        await this.characterImagePoseController.extract({ objectId: objectId3, file: file });
      } catch (error30) {
        error30?.name !== 'AbortError' &&
          error30?.code !== 'ABORT_ERR' &&
          this._setMessage(error30?.message || String(error30));
      }
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-navigation-preset]')) {
      this._saveNavigationSettings(createStoryboard3DNavigationPresetSettings(event50.target.value));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-navigation-setting]')) {
      const value516 = event50.target.getAttribute('data-storyboard-3d-navigation-setting'),
        value517 =
          event50.target.type === 'checkbox'
            ? event50.target.checked
            : Number(event50.target.value);
      this._saveNavigationSettings({ ...this.navigationSettings, [value516]: value517 });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-bone-select]')) {
      (this.characterBoneSelection.set(
        event50.target.dataset.objectId,
        String(event50.target.value || 'Head'),
      ),
        this._render());
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-bone-axis]')) {
      const value518 = event50.target.dataset.objectId,
        value519 = event50.target.dataset.boneName,
        value520 = event50.target.getAttribute('data-storyboard-3d-bone-axis'),
        value521 = Number(event50.target.value) || 0;
      this._executeMutation({
        type: 'edit-character-bone',
        label: 'Edit character bone',
        mutate: (value522) => {
          const value523 = value522.scenes.find(
              (value524) => value524.id === value522.activeSceneId,
            ),
            value525 = value523?.objects?.find((value526) => value526.id === value518);
          if (value525?.type !== 'character' || !['x', 'y', 'z'].includes(value520)) return value522;
          const storyboard3DEuler2 = quaternionToStoryboard3DEuler(value525.boneOverrides?.[value519]);
          return (
            (storyboard3DEuler2[value520] = (value521 * Math.PI) / 180),
            (value525.boneOverrides = setStoryboard3DBoneOverride(
              value525.boneOverrides,
              value519,
              storyboard3DEuler2,
            )),
            value522
          );
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-character-time]')) {
      const value527 = event50.target.dataset.objectId,
        value528 = Number(event50.target.value) || 0;
      this._executeMutation({
        type: 'seek-character-action',
        label: 'Seek character action',
        mutate: (value529) => {
          const value530 = value529.scenes.find(
              (value531) => value531.id === value529.activeSceneId,
            ),
            value532 = value530?.objects?.find((value533) => value533.id === value527);
          if (value532?.type === 'character')
            Object.assign(value532, seekStoryboard3DCharacterAction(value532, value528));
          return value529;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-background-input]')) {
      const fileName = event50.target.files?.[0];
      event50.target.value = '';
      if (!fileName) return;
      try {
        const sceneId12 = getActiveStoryboard3DScene(this.projectStore.getSnapshot());
        if (!sceneId12) return;
        const response6 = await preflightStoryboard3DImageFile(fileName, {
          renderer: this.sceneRuntime?.bridge?.renderer,
        });
        if (!response6.ok)
          throw new Error(response6.errors.map((error31) => error31.message).join(' '));
        let analyzeStoryboard3DBackgroundImage3 = null,
          error32 = null;
        try {
          analyzeStoryboard3DBackgroundImage3 = await analyzeStoryboard3DBackgroundImage(fileName, {
            documentObject: this.document,
            imageBitmapFactory:
              typeof this.window?.createImageBitmap === 'function'
                ? this.window.createImageBitmap.bind(this.window)
                : undefined,
          });
        } catch (value534) {
          error32 = value534;
        }
        const assetId = sceneId12.background?.binaryAssetId || createLocalId('background');
        await this.binaryAssetRepository.put({
          assetId: assetId,
          kind: 'background',
          descriptor: { sceneId: sceneId12.id, fileName: fileName.name },
          primaryFile: fileName,
          relatedFiles: [],
        });
        const imageUrl = this._getBackgroundImageController(sceneId12?.id).load(fileName),
          value535 = {
            imageUrl: imageUrl.imageUrl,
            binaryAssetId: assetId,
            ...(analyzeStoryboard3DBackgroundImage3 || {
              calibrationMethod: 'unconfigured',
              calibrationConfidence: 0,
            }),
          };
        analyzeStoryboard3DBackgroundImage3
          ? (this._applyDetectedBackgroundCalibration(value535, {
              type: 'upload-and-calibrate-background',
              label: 'Upload and calibrate background',
            }),
            this._setMessage(
              imageUrl.fileName +
                ' 已自动匹配地面透视并锁定，匹配度 ' +
                Math.round(analyzeStoryboard3DBackgroundImage3.calibrationConfidence * 100) +
                '%。',
            ))
          : (this._executeMutation({
              type: 'upload-background',
              label: 'Upload background',
              mutate: (value536) => {
                const value537 = value536.scenes.find(
                  (value538) => value538.id === value536.activeSceneId,
                );
                return (
                  value537 &&
                    (value537.background = updateStoryboard3DBackgroundCalibration(
                      value537.background,
                      value535,
                    )),
                  value536
                );
              },
            }),
            this._setMessage(
              imageUrl.fileName +
                ' 已设置为背景，但自动匹配失败：' +
                (error32?.message || '请手动调整参数') +
                '。',
            ));
      } catch (error33) {
        this._setMessage(error33?.message || String(error33));
      }
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-scene-name]')) {
      const value539 = event50.target.dataset.sceneId,
        value540 = String(event50.target.value || '').trim();
      this._executeMutation({
        type: 'rename-scene',
        label: 'Rename scene',
        mutate: (value541) => renameStoryboard3DScene(value541, value539, value540, { now: Date.now() }),
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-viewport-setting]')) {
      const value542 = event50.target.getAttribute('data-storyboard-3d-viewport-setting'),
        value543 =
          event50.target.type === 'checkbox'
            ? event50.target.checked
            : event50.target.value,
        args16 =
          value542 === 'rotationSnapDegrees'
            ? { rotationSnap: (Math.max(1, Number(value543) || 15) * Math.PI) / 180 }
            : {
                [value542]: ['translationSnap', 'scaleSnap'].includes(value542)
                  ? Number(value543)
                  : value543,
              },
        value544 =
          this.viewportControls?.updateSettings?.(args16) ||
          normalizeStoryboard3DViewportSettings({ ...this.viewportSettings, ...args16 });
      (this._saveTransformSettings(value544),
        this.sceneRuntime?.setViewportUIPatch?.(
          this.viewportControls?.getDirectorUIPatch?.() || {},
        ));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-outline-query]')) {
      ((this.outlineQuery = String(event50.target.value || '').trim()),
        queueMicrotask(() => this._render()));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-outline-type]')) {
      ((this.outlineType = String(event50.target.value || 'all')),
        queueMicrotask(() => this._render()));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-asset-query]')) {
      ((this.assetQuery = String(event50.target.value || '').trim()),
        (this.assetVisibleLimit = 32),
        queueMicrotask(() => this._render()));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-camera-field]')) {
      const value545 = event50.target.dataset.objectId,
        value546 = event50.target.getAttribute('data-storyboard-3d-camera-field'),
        value547 = event50.target.value;
      this._executeMutation({
        type: 'update-camera-' + value546,
        label: 'Update camera ' + value546,
        mutate: (value548) => {
          const value549 = value548.scenes.find(
              (value550) => value550.id === value548.activeSceneId,
            ),
            value551 = value549?.objects?.find((value552) => value552.id === value545);
          if (value551?.type !== 'camera') return value548;
          if (value546 === 'aspectRatio') {
            const value553 = String(value547 || '').trim();
            if (/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(value553)) value551.aspectRatio = value553;
          } else {
            const value554 = Number(value547);
            if (!Number.isFinite(value554)) return value548;
            if (value546 === 'focalLength')
              value551.focalLength = Math.max(1, Math.min(200, value554));
            if (value546 === 'near') value551.near = Math.max(0.001, value554);
            if (value546 === 'far') value551.far = Math.max(value551.near + 0.001, value554);
          }
          return (syncStoryboard3DShotFromCameraObject(value549, value545), value548);
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-light-field]')) {
      const value555 = event50.target.dataset.objectId,
        value556 = event50.target.getAttribute('data-storyboard-3d-light-field'),
        value557 =
          event50.target.type === 'checkbox'
            ? event50.target.checked
            : ['intensity', 'distance', 'decay', 'angleDegrees'].includes(value556)
              ? Number(event50.target.value)
              : String(event50.target.value || '');
      this._executeMutation({
        type: 'update-light-' + value556,
        label: 'Update light ' + value556,
        mutate: (value558) => {
          const value559 = value558.scenes.find(
              (value560) => value560.id === value558.activeSceneId,
            ),
            value561 = value559?.objects?.find((value562) => value562.id === value555);
          if (value561?.type !== 'light') return value558;
          if (value556 === 'intensity')
            value561.intensity = Math.max(0, Number.isFinite(value557) ? value557 : 1);
          if (value556 === 'distance')
            value561.distance = Math.max(0, Number.isFinite(value557) ? value557 : 0);
          if (value556 === 'decay')
            value561.decay = Math.max(0, Number.isFinite(value557) ? value557 : 2);
          value556 === 'angleDegrees' &&
            (value561.angle =
              (Math.max(1, Math.min(179, Number.isFinite(value557) ? value557 : 30)) *
                Math.PI) /
              180);
          if (value556 === 'castShadow') value561.castShadow = value557 === true;
          if (value556 === 'color' && /^#[0-9a-f]{6}$/i.test(value557)) value561.color = value557;
          return (
            value556 === 'lightType' &&
              ['ambient', 'directional', 'point', 'spot'].includes(value557) &&
              (value561.lightType = value557),
            value558
          );
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-prop-field]')) {
      const value563 = event50.target.dataset.objectId,
        value564 = event50.target.getAttribute('data-storyboard-3d-prop-field'),
        value565 =
          event50.target.type === 'checkbox'
            ? event50.target.checked
            : String(event50.target.value || '');
      this._executeMutation({
        type: 'update-prop-' + value564,
        label: 'Update prop ' + value564,
        mutate: (value566) => {
          const value567 = value566.scenes.find(
              (value568) => value568.id === value566.activeSceneId,
            ),
            value569 = value567?.objects?.find((value570) => value570.id === value563);
          if (value569?.type !== 'prop') return value566;
          if (value564 === 'tint' && /^#[0-9a-f]{6}$/i.test(value565)) value569.tint = value565;
          if (['castShadow', 'receiveShadow'].includes(value564)) value569[value564] = value565 === true;
          return value566;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-shot-field]')) {
      const value571 = event50.target.getAttribute('data-storyboard-3d-shot-field'),
        value572 = event50.target.dataset.shotId,
        value573 = String(event50.target.value || '').trim();
      this._executeMutation({
        type: 'update-shot-' + value571,
        label: 'Update shot ' + value571,
        mutate: (value574) => {
          const count14 = value574.scenes.findIndex(
            (value575) => value575.id === value574.activeSceneId,
          );
          if (count14 < 0) return value574;
          const value576 = value574.scenes[count14];
          return (
            (value574.scenes[count14] =
              value571 === 'name'
                ? renameStoryboard3DShot(value576, value572, value573)
                : describeStoryboard3DShot(value576, value572, value573)),
            value574
          );
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-ai-instruction]')) {
      this.aiController.setInstruction(event50.target.value);
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-scene-field]')) {
      const value577 = event50.target.getAttribute('data-storyboard-3d-scene-field'),
        value578 =
          event50.target.type === 'checkbox'
            ? event50.target.checked
            : String(event50.target.value || '');
      this._executeMutation({
        type: 'update-scene-' + value577,
        label: 'Update scene ' + value577,
        mutate: (value579) => {
          const showGrid = value579.scenes.find(
            (value580) => value580.id === value579.activeSceneId,
          );
          if (!showGrid) return value579;
          ['showGrid', 'showOutline', 'enableShadows'].includes(value577) &&
            (showGrid.environment[value577] = value578 === true);
          if (['empty', 'outdoor', 'indoor', 'studio'].includes(value578))
            return applyStoryboard3DEnvironmentPreset(value579, showGrid.id, value578, {
              overrides: {
                showGrid: showGrid.environment.showGrid,
                showOutline: showGrid.environment.showOutline,
                enableShadows: showGrid.environment.enableShadows,
              },
              now: Date.now(),
            });
          return value579;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-background-field]')) {
      const value581 = event50.target.getAttribute('data-storyboard-3d-background-field'),
        value582 =
          value581 === 'imageUrl'
            ? String(event50.target.value || '').trim()
            : Number(event50.target.value);
      this._executeMutation({
        type: 'update-background-' + value581,
        label: 'Update background ' + value581,
        mutate: (value583) => {
          const enabled51 = value583.scenes.find(
            (value584) => value584.id === value583.activeSceneId,
          );
          if (!enabled51) return value583;
          const value585 = enabled51.shots?.find(
              (value586) => value586.id === enabled51.activeShotId,
            ),
            storyboard3DBackgroundCalibration4 = normalizeStoryboard3DBackgroundCalibration(
              enabled51.background,
            ),
            args17 =
              value581 === 'vanishingPointX'
                ? { vanishingPoint: [value582, storyboard3DBackgroundCalibration4.vanishingPoint[1]] }
                : value581 === 'vanishingPointY'
                  ? { vanishingPoint: [storyboard3DBackgroundCalibration4.vanishingPoint[0], value582] }
                  : value581 === 'imageOffsetX'
                    ? { imageOffset: [value582, storyboard3DBackgroundCalibration4.imageOffset[1]] }
                    : value581 === 'imageOffsetY'
                      ? { imageOffset: [storyboard3DBackgroundCalibration4.imageOffset[0], value582] }
                      : { [value581]: value582 },
            map5 = new Set([
              'horizontalFov',
              'verticalFov',
              'horizonY',
              'horizonSlope',
              'vanishingPointX',
              'cameraHeight',
            ]),
            updateStoryboard3DBackgroundCalibration4 = updateStoryboard3DBackgroundCalibration(
              enabled51.background,
              {
                ...args17,
                ...(map5.has(value581) ? { calibrationMethod: 'manual', calibrationConfidence: 1 } : {}),
              },
            );
          if (
            updateStoryboard3DBackgroundCalibration4.imageUrl &&
            updateStoryboard3DBackgroundCalibration4.lockedCamera &&
            value585
          ) {
            const storyboard3DBackgroundCamera3 = deriveStoryboard3DBackgroundCamera(
              updateStoryboard3DBackgroundCalibration4,
              value585.camera,
            );
            (setStoryboard3DShotInitialCamera(enabled51, value585, storyboard3DBackgroundCamera3),
              (enabled51.background = setStoryboard3DBackgroundCameraLock(
                updateStoryboard3DBackgroundCalibration4,
                true,
                value585.camera,
              )));
          } else {
            if (updateStoryboard3DBackgroundCalibration4.imageUrl)
              enabled51.background = updateStoryboard3DBackgroundCalibration4;
            else delete enabled51.background;
          }
          return value583;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-background-lock]')) {
      const label6 = event50.target.checked === true;
      this._executeMutation({
        type: 'set-background-camera-lock',
        label: label6 ? 'Lock background camera' : 'Unlock background camera',
        mutate: (value587) => {
          const value588 = value587.scenes.find(
              (value589) => value589.id === value587.activeSceneId,
            ),
            value590 = value588?.shots?.find(
              (value591) => value591.id === value588.activeShotId,
            );
          if (value588?.background && value590?.camera) {
            const value592 = label6
              ? deriveStoryboard3DBackgroundCamera(value588.background, value590.camera)
              : value590.camera;
            if (label6) setStoryboard3DShotInitialCamera(value588, value590, value592);
            value588.background = setStoryboard3DBackgroundCameraLock(
              value588.background,
              label6,
              value592,
            );
          }
          return value587;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-character-field]')) {
      const value593 = event50.target.dataset.objectId,
        value594 = event50.target.getAttribute('data-storyboard-3d-character-field'),
        value595 = String(event50.target.value || '');
      this._executeMutation({
        type: 'update-character',
        label: 'Update character',
        mutate: (value596) => {
          const value597 = value596.scenes.find(
              (value598) => value598.id === value596.activeSceneId,
            ),
            value599 = value597?.objects?.find((value600) => value600.id === value593);
          return (
            value599?.type === 'character' &&
              ['bodyPresetId', 'actionId', 'leftHandPoseId', 'rightHandPoseId', 'hairId', 'characterStyle'].includes(value594) &&
              ((value599[value594] = value595),
              value594 === 'actionId' && ((value599.actionTime = 0), (value599.actionPlaying = false))),
            value596
          );
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-character-attachments]')) {
      const value601 = event50.target.dataset.objectId,
        value602 = [
          ...new Set(
            String(event50.target.value || '')
              .split(',')
              .map((value603) => value603.trim())
              .filter(Boolean),
          ),
        ].slice(0, 32);
      this._executeMutation({
        type: 'update-character-attachments',
        label: 'Update character attachments',
        mutate: (value604) => {
          const value605 = value604.scenes.find(
              (value606) => value606.id === value604.activeSceneId,
            ),
            value607 = value605?.objects?.find((value608) => value608.id === value601);
          if (value607?.type === 'character') value607.attachmentIds = value602;
          return value604;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-transform-input]')) {
      const value609 = event50.target.dataset.objectId,
        activeTool2 = event50.target.dataset.transformField,
        value610 = Math.max(
          0,
          Math.min(2, Number(event50.target.dataset.transformAxis) || 0),
        ),
        value611 = this.projectStore.getSnapshot(),
        sceneId13 = getActiveStoryboard3DScene(value611),
        enabled52 = sceneId13?.objects?.find((value612) => value612.id === value609);
      if (
        !enabled52 ||
        !['position', 'rotation', 'scale'].includes(activeTool2) ||
        !canStoryboard3DObjectEditTransformField(enabled52, activeTool2)
      )
        return;
      const structuredClone2 = structuredClone(enabled52.transform),
        value613 = Number(event50.target.value);
      ((structuredClone2[activeTool2][value610] =
        activeTool2 === 'scale'
          ? Math.max(
              0.001,
              Number.isFinite(value613) ? value613 : structuredClone2[activeTool2][value610],
            )
          : activeTool2 === 'rotation' && Number.isFinite(value613)
            ? (value613 * Math.PI) / 180
            : Number.isFinite(value613)
              ? value613
              : structuredClone2[activeTool2][value610]),
        this._commitObjectTransforms({
          sceneId: sceneId13.id,
          transforms: { [value609]: structuredClone2 },
          activeTool: activeTool2 === 'position' ? 'move' : activeTool2 === 'rotation' ? 'rotate' : 'scale',
          label: 'Update ' + activeTool2,
        }));
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-object-name]')) {
      const value614 = event50.target.dataset.objectId,
        value615 = String(event50.target.value || '').trim();
      this._executeMutation({
        type: 'rename-object',
        label: 'Rename object',
        mutate: (value616) => {
          const value617 = value616.scenes.find(
              (value618) => value618.id === value616.activeSceneId,
            ),
            error34 = value617?.objects?.find((value619) => value619.id === value614);
          if (error34 && value615 && error34.type === 'camera') {
            const error35 = value617.shots?.find((value620) => value620.cameraId === value614);
            error35 &&
              ((error35.name = value615.replace(/\s*摄像机$/, '').trim() || value615),
              (error35.updatedAt = Date.now()),
              syncStoryboard3DCameraObjectFromShot(value617, error35));
          } else {
            if (error34 && value615) error34.name = value615;
          }
          return value616;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-object-parent]')) {
      const value621 = event50.target.dataset.objectId,
        value622 = String(event50.target.value || '').trim() || null;
      try {
        this._executeMutation({
          type: 'set-object-parent',
          label: 'Set object parent',
          mutate: (value623) => {
            const count15 = value623.scenes.findIndex(
              (value624) => value624.id === value623.activeSceneId,
            );
            return (
              count15 >= 0 &&
                (value623.scenes[count15] = setStoryboard3DObjectParent(
                  value623.scenes[count15],
                  value621,
                  value622,
                )),
              value623
            );
          },
        });
      } catch (error36) {
        (this._setMessage(error36?.message || String(error36)), this._render());
      }
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-object-flag]')) {
      const value625 = event50.target.dataset.objectId,
        value626 = event50.target.getAttribute('data-storyboard-3d-object-flag'),
        value627 = event50.target.checked;
      this._executeMutation({
        type: 'set-object-' + value626,
        label: 'Set object ' + value626,
        mutate: (value628) => {
          const value629 = value628.scenes.find(
              (value630) => value630.id === value628.activeSceneId,
            ),
            value631 = value629?.objects?.find((value632) => value632.id === value625);
          if (value631 && ['visible', 'locked'].includes(value626)) value631[value626] = value627;
          return value628;
        },
      });
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-project-name]')) {
      const error37 = this.projectStore.renameProject(event50.target.value);
      ((event50.target.value = error37.name), this._render());
      return;
    }
    if (event50.target?.matches?.('[data-storyboard-3d-model-input]')) {
      const relatedFiles2 = [...(event50.target.files || [])];
      event50.target.value = '';
      const file2 = relatedFiles2.find((error38) =>
        /\.(glb|gltf|fbx|obj|stl)$/i.test(error38.name || ''),
      );
      if (!file2) return;
      try {
        (this.modelImportJob?.cancel?.('开始新的模型导入'),
          (this.modelImportJob = createStoryboard3DModelImportJob({
            file: file2,
            relatedFiles: relatedFiles2.filter((value633) => value633 !== file2),
            importOptions: { parsers: this.modelParsers },
            onStateChange: (value634) => {
              ((this.modelImportState = value634), this._syncModelImportStatus());
            },
          })),
          (this.modelImportState = this.modelImportJob.getSnapshot()),
          this._render());
        const format = await this.modelImportJob.start();
        if (!format) {
          this._render();
          return;
        }
        const storyboard3DTexturePolicy = await applyStoryboard3DTexturePolicy(format.parsed.scene, {
            renderer: this.sceneRuntime?.bridge?.renderer,
          }),
          canonicalAssetId = await createCanonicalStoryboard3DAssetId(file2),
          assetRecord = await createStoryboard3DAssetRecord({
            file: file2,
            format: format.format,
            parsed: format.parsed,
            normalization: format.normalization,
            canonicalAssetId: canonicalAssetId,
            indexedDbReference: {
              databaseName: STORYBOARD_3D_BINARY_ASSET_DB_NAME,
              storeName: STORYBOARD_3D_BINARY_ASSET_STORE_NAME,
              key: canonicalAssetId,
            },
          }),
          id2 = assetRecord.canonicalAssetId,
          assetDescriptor2 = this.assetLibrary.registerImported({
            id: id2,
            name: file2.name.replace(/\.[^.]+$/, ''),
            tags: [format.format, '3d', 'model'],
            source: {
              kind: 'file',
              format: format.format,
              fileName: file2.name,
              byteLength: file2.size,
              fingerprint: file2.name + ':' + file2.size + ':' + (file2.lastModified || 0),
            },
            normalization: format.normalization,
            assetRecord: assetRecord,
            createdAt: Date.now(),
          });
        (await this.binaryAssetRepository.put({
          assetId: id2,
          kind: 'model',
          descriptor: { assetDescriptor: assetDescriptor2 },
          primaryFile: file2,
          relatedFiles: relatedFiles2.filter((value635) => value635 !== file2),
        }),
          this._setImportedModelScene(id2, format.parsed.scene, format.normalization));
        let id3 = '';
        (this._executeMutation({
          type: 'import-model',
          label: 'Import ' + format.format.toUpperCase() + ' model',
          mutate: (value636) => {
            const enabled53 = value636.scenes.find(
              (value637) => value637.id === value636.activeSceneId,
            );
            if (!enabled53) return value636;
            return (
              (id3 = createLocalId('prop')),
              enabled53.objects.push({
                id: id3,
                type: 'prop',
                name: assetDescriptor2.name,
                assetId: id2,
                visible: true,
                locked: false,
                transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                castShadow: true,
                receiveShadow: true,
              }),
              value636
            );
          },
        }),
          this.assetLibrary.markUsed(id2));
        if (id3) this._setSelectedObjects([id3], { openProperties: false });
        const value638 =
          storyboard3DTexturePolicy.optimized.length > 0
            ? '，已优化 ' + storyboard3DTexturePolicy.optimized.length + ' 张超限纹理'
            : '';
        (this._setMessage(file2.name + ' 已解析并加入当前场景' + value638 + '。'),
          (this.modelImportState = this.modelImportJob.getSnapshot()),
          this._render());
      } catch (error39) {
        ((this.modelImportState = this.modelImportJob?.getSnapshot?.() || this.modelImportState),
          this._setMessage(error39?.message || String(error39)),
          this._render());
      }
      return;
    }
  }
  async ['load'](value639) {
    const value640 = this.projectStore.load(value639);
    return (this._render(), value640);
  }
  async ['save']() {
    return this.projectStore.save();
  }
  ['focusObject'](value641) {
    this._setSelectedObjects(value641 ? [value641] : []);
  }
  ['undo']() {
    return this.commandHistory.undo();
  }
  ['redo']() {
    return this.commandHistory.redo();
  }
  async ['renderShot']() {
    const activeStoryboard3DShot9 = getActiveStoryboard3DShot(this.projectStore.getSnapshot());
    if (!activeStoryboard3DShot9) throw new Error('当前场景没有可渲染镜头。');
    return this._renderShotFrame(activeStoryboard3DShot9, { width: 1920, height: 1080 });
  }
  async ['exportStoryboard']() {
    return this.exportController.open();
  }
  ['close']({ persist: persist = true } = {}) {
    if (this._closed) return;
    this._closed = true;
    const projectId3 = persist ? this.projectStore.save() : this.projectStore.getSnapshot(),
      activeSceneId = getActiveStoryboard3DScene(projectId3),
      activeShotId = getActiveStoryboard3DShot(projectId3);
    (this._finishFlyMovement({ clearKeys: true }),
      this.exportController.destroy(),
      this._aiModelSelectorController?.destroy?.(),
      (this._aiModelSelectorController = null),
      this.aiController.destroy(),
      this.backgroundCalibrationInteraction?.destroy?.(),
      (this.backgroundCalibrationInteraction = null),
      this.shotTimelineController?.destroy?.(),
      this.modelImportJob?.cancel?.('编辑器已关闭'),
      this._clearShotCandidates(),
      this.characterImagePoseController.dispose(),
      this._disposeSceneRuntime());
    this._inspectorResize &&
      this._handleInspectorResizePointerUp({ pointerId: this._inspectorResize.pointerId });
    this._rightSidebarResize &&
      this._handleRightSidebarResizePointerUp({ pointerId: this._rightSidebarResize.pointerId });
    this._timelineResize &&
      this._handleTimelineResizePointerUp({ pointerId: this._timelineResize.pointerId });
    (this._assetThumbnailObserver?.disconnect?.(),
      (this._assetThumbnailObserver = null),
      this.assetThumbnailRenderer?.dispose?.(),
      (this.assetThumbnailRenderer = null),
      this.importedModelScenes.forEach((scene6) => {
        disposeCancelledStoryboard3DModelImportResult({ parsed: { scene: scene6 } });
      }),
      this.importedModelScenes.clear(),
      this._packAssetLoads.clear(),
      this._assetThumbnailLoads.clear(),
      this._assetThumbnailFailures.clear(),
      this.backgroundImageControllers.forEach((value642) => value642.dispose?.()),
      this.backgroundImageControllers.clear(),
      void this.binaryAssetRepository.close(),
      this.window?.removeEventListener?.('keydown', this._handleWindowKeyDown, true),
      this.window?.removeEventListener?.('keyup', this._handleWindowKeyUp, true),
      this.window?.removeEventListener?.('blur', this._handleWindowBlur),
      this.window?.removeEventListener?.('resize', this._syncServerAlertOffset),
      this._serverAlertMutationObserver?.disconnect?.(),
      this._serverAlertResizeObserver?.disconnect?.(),
      (this._serverAlertMutationObserver = null),
      (this._serverAlertResizeObserver = null),
      this.root?.removeEventListener?.('contextmenu', containWorkspaceContextMenu),
      this.root?.removeEventListener?.('click', this._handleClick),
      this.root?.removeEventListener?.('input', this._handleInput),
      this.root?.removeEventListener?.('change', this._handleChange),
      this.root?.removeEventListener?.('dragstart', this._handleOutlineDragStart),
      this.root?.removeEventListener?.('dragover', this._handleOutlineDragOver),
      this.root?.removeEventListener?.('drop', this._handleOutlineDrop),
      this.root?.removeEventListener?.('pointerdown', this._handleInspectorResizePointerDown),
      this.root?.removeEventListener?.('pointerdown', this._handleRightSidebarResizePointerDown),
      this.root?.removeEventListener?.('pointerdown', this._handleTimelineResizePointerDown),
      this.root?.removeEventListener?.('pointerdown', this._handleMiniMapPointerDown),
      this.root?.removeEventListener?.('wheel', this._handleMiniMapWheel),
      this.window?.removeEventListener?.('pointermove', this._handleMiniMapPointerMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleMiniMapPointerUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleMiniMapPointerUp, true),
      this.window?.removeEventListener?.('pointermove', this._handleMiniMapWindowMove, true),
      this.window?.removeEventListener?.('pointerup', this._handleMiniMapWindowUp, true),
      this.window?.removeEventListener?.('pointercancel', this._handleMiniMapWindowUp, true),
      this.window?.removeEventListener?.(
        'pointermove',
        this._handleInspectorResizePointerMove,
        true,
      ),
      this.window?.removeEventListener?.('pointerup', this._handleInspectorResizePointerUp, true),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleInspectorResizePointerUp,
        true,
      ),
      this.window?.removeEventListener?.(
        'pointermove',
        this._handleRightSidebarResizePointerMove,
        true,
      ),
      this.window?.removeEventListener?.(
        'pointerup',
        this._handleRightSidebarResizePointerUp,
        true,
      ),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleRightSidebarResizePointerUp,
        true,
      ),
      this.window?.removeEventListener?.(
        'pointermove',
        this._handleTimelineResizePointerMove,
        true,
      ),
      this.window?.removeEventListener?.('pointerup', this._handleTimelineResizePointerUp, true),
      this.window?.removeEventListener?.(
        'pointercancel',
        this._handleTimelineResizePointerUp,
        true,
      ),
      this.root?.remove?.(),
      (this.root = null),
      this.document?.body?.classList?.remove?.('storyboard-3d-editor-open'),
      this.document?.body?.classList?.remove?.('storyboard-3d-timeline-resizing'),
      this._unsubscribeProject?.(),
      this._unsubscribeEditor?.(),
      this.projectStore.destroy(),
      this.editorStore.destroy(),
      this.commandHistory.clear());
    const value643 = {
      projectId: projectId3.id,
      activeSceneId: activeSceneId?.id || '',
      activeShotId: activeShotId?.id || '',
      previewUrl: activeShotId?.thumbnailUrl || '',
    };
    (dispatchWorkspaceEvent(this.window, 'storyboard-3d:editor-closed', value643),
      this.onClose?.(value643, projectId3));
  }
}
export function openStoryboard3DEditor(value644) {
  const storyboard3DEditorWorkspace = new Storyboard3DEditorWorkspace(value644);
  return (storyboard3DEditorWorkspace.mount(), storyboard3DEditorWorkspace);
}
