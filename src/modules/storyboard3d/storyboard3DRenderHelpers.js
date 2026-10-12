// Rendering helpers extracted from editorWorkspace.js (module-level string/DOM builders).
// editorWorkspace.js imports these; the module's own export surface is unchanged.

import { t } from '../../i18n/index.js';
import { renderAIGenTextModelSelectorMarkup } from '../../components/aigenText/modelSelector.js';
import { resolveSceneCameraPose } from '../../core/panoramaSceneMath.js';
import { getDisplayModelName } from '../providers.js';
import {
  STORYBOARD_3D_ACTIONS,
  STORYBOARD_3D_BODY_PRESETS,
  STORYBOARD_3D_HAND_POSES,
  quaternionToStoryboard3DEuler,
} from './characterRig.js';
import { STORYBOARD_3D_ASSET_CATEGORIES, getStoryboard3DAssetCategoryLabel } from './assetLibrary.js';
import { STORYBOARD_3D_FOCAL_LENGTH_PRESETS } from './cameraShotSystem.js';
import { STORYBOARD_3D_NAVIGATION_PRESETS, getStoryboard3DToolShortcut } from './viewportNavigationSettings.js';
import { computeStoryboard3DBackgroundGuideGeometry } from './backgroundCalibrationInteraction.js';
import { createStoryboard3DBoneOverridesSignature } from './characterImagePoseController.js';
import {
  createStoryboard3DMiniMapCameraMarker,
  createStoryboard3DMiniMapProjection,
  projectStoryboard3DTopViewFootprint,
  projectStoryboard3DWorldToMiniMapRatio,
} from './miniMapMath.js';
import { getStoryboard3DObjectTransformCapabilities } from './objectTransformCapabilities.js';
import { getStoryboard3DTextModelIds, resolveStoryboard3DTextModelSelection } from './modelSelection.js';
import { normalizeStoryboard3DBackgroundCalibration } from './backgroundCalibration.js';
import { syncStoryboard3DCameraObjectFromShot } from './projectModel.js';
import { upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
import {
  STORYBOARD_3D_EDITABLE_BONES,
  STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH,
  STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
  normalizeStoryboard3DRightSidebarWidth,
} from './editorLayoutMetrics.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
export function dispatchWorkspaceEvent(enabled, item, detail) {
  if (!enabled?.dispatchEvent || typeof enabled.CustomEvent !== 'function') return;
  enabled.dispatchEvent(new enabled.CustomEvent(item, { detail: detail }));
}
export function setStoryboard3DShotInitialCamera(enabled2, camera2, event) {
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
export function restoreStoryboard3DStoredFile(type2, key = globalThis.window) {
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
export function getSaveStatusLabel(options) {
  if (options === 'saving') return t('storyboard3d.saveStatus.saving');
  if (options === 'error') return t('storyboard3d.saveStatus.error');
  return t('storyboard3d.saveStatus.saved');
}
export function renderObjectOutline(enabled3, list = [], { query: query = '', type: type = 'all' } = {}) {
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
export function renderShotStrip(enabled5, { timelineOpen: timelineOpen = false } = {}) {
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
export function renderShotTimelineDrawerHandle(handle, state) {
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
export function formatFocalLength(scope) {
  const input = Number(scope);
  if (!Number.isFinite(input)) return '35';
  const output = Math.round(input * 10) / 10;
  return Number.isInteger(output) ? String(output) : output.toFixed(1);
}
export function resolveStoryboard3DFocalPresetIndex(value3) {
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
export function getStoryboard3DFocalPreset(value8) {
  const value9 = Math.max(
    0,
    Math.min(STORYBOARD_3D_FOCAL_LENGTH_PRESETS.length - 1, Math.round(Number(value8) || 0)),
  );
  return STORYBOARD_3D_FOCAL_LENGTH_PRESETS[value9];
}
export function renderStoryboard3DFocalControl(enabled6, value10) {
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
export function createLocalId(value16) {
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
export function renderVectorInputs(value18, value19, value20 = []) {
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
export function renderSelectedObjectInspector(error4, value24 = 'Head', value25 = null, list3 = [], value26 = null) {
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
export function renderCameraControls(value31) {
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
export function renderPropControls(value32, value33) {
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
export function renderSelectOptions(list4, value35) {
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
export function getCharacterPoseStatusText(response = {}) {
  if (response.status === 'running') return '正在本地识别“' + (response.fileName || '参考图') + '”…';
  if (response.status === 'error') return response.error || '姿势识别失败。';
  if (response.status === 'success') {
    const value62 = Math.round((Number(response.confidence) || 0) * 100),
      value63 = response.warningCount > 0 ? ' · 部分遮挡关节已跳过' : '';
    return '已应用 ' + (Number(response.boneCount) || 0) + ' 个骨骼 · 置信度 ' + value62 + '%' + value63;
  }
  return '支持单人全身 JPG、PNG、WebP；图片仅在本机处理。';
}
export function reconcileCharacterPoseState(value64, response2) {
  if (
    response2?.status === 'success' &&
    response2.poseSignature !== createStoryboard3DBoneOverridesSignature(value64?.boneOverrides)
  )
    return { status: 'idle', objectId: String(value64?.id || '') };
  return response2;
}
export function renderCharacterControls(value65, value66 = 'Head', value67 = null) {
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
export function renderLightControls(value73) {
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
export function renderBackgroundCalibrationGuide(value75) {
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
export function renderSceneControls(error7, value79, value80 = {}, value81 = false) {
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
export function renderNavigationSettings(
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
export const STORYBOARD_3D_TOOL_LABELS = Object.freeze({
    select: '选择 / 框选',
    move: '移动',
    rotate: '旋转',
    scale: '缩放',
  }),
  STORYBOARD_3D_SELECT_MOVE_TOOLS = new Set(['select', 'move']);
export function renderStoryboard3DControlIcon(value90) {
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
export function renderStoryboard3DIconButton({
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
export function renderStoryboard3DToolButton(icon2, active2, value103) {
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
export function renderStoryboard3DViewportSettingButton({
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
export function renderShotInspector(enabled9, error8) {
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
export function renderAIAssistant(error9 = {}) {
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
export function renderAIAssistantRightSidebar(options2 = {}, value109 = {}) {
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
export function renderObjectPropertiesRightSidebar(
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
export function getBackgroundCalibrationMethodLabel(value111) {
  if (value111 === 'exif-local-estimate') return 'EXIF + 图像分析';
  if (value111 === 'local-image-estimate') return '本地图像分析';
  if (value111 === 'manual') return '手动校准';
  return '尚未匹配';
}
export function renderBackgroundPerspectivePanel(value112, value113) {
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
export function renderBackgroundPerspectiveRightSidebar(
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
export function renderAssetLibrarySidebar({
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
export function renderAssetLibrary({
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
export function renderAssetLibraryRightSidebar(options3 = {}) {
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
export function finiteMiniMapValue(value122, value123 = 0) {
  const value124 = Number(value122);
  return Number.isFinite(value124) ? value124 : value123;
}
export function createStoryboard3DMiniMapCameraPose(value125, event3, value126) {
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
export function renderMiniMap(
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
export function createMiniMapWorldBounds(value134, value135, value136 = []) {
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
export function createMiniMapLayout(
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
export function renderShotExplorePanel(list10 = [], value158 = 'all') {
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
