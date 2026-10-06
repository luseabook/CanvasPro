import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { QWEN_IMAGE_21_EDIT_MODEL_ID } from '../../manifests/image/runninghub/qwenImage21EditManifest.js';
import {
  PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementImageSourceRef,
  resolvePersonReplacementTargetCharacterId,
} from './personReplacementProject.js';
import { resolvePersonReplacementImageGenerationState } from './personReplacementImageGeneration.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import {
  getPersonReplacementBoxedPeople,
  resolvePersonReplacementDetectionLabel,
} from './personReplacementSourceIdentity.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderAIGenImageModelSelectorMarkup } from '../../components/aigenImage/modelSelector.js';
import { renderWorkspaceAssetLoadingOverlay } from '../workspaceAssetPresentation.js';
import { renderPersonReplacementPreviewArrow } from './personReplacementAssetPresentation.js';
import { renderWorkspaceImageDownloadButton } from '../workspaceImageDownload.js';
import { renderWorkspaceUploadIcon } from '../workspaceActionIcons.js';
import { normalizePersonReplacementLayout } from './personReplacementProjectSession.js';
import { renderPersonReplacementPromptHtml } from './personReplacementPromptMentions.js';
import { resolvePersonReplacementSourcePlaybackRef } from './personReplacementSourcePlayback.js';
import {
  renderPersonReplacementPromptModeControl,
  isPersonReplacementManualPromptMode,
  PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP,
} from './personReplacementPromptControls.js';
import { buildPersonReplacementImageGate } from './personReplacementImageGate.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
export function syncPersonReplacementImageStageFrame(el) {
  const count = Math.max(0, Number(el?.naturalWidth) || 0),
    count2 = Math.max(0, Number(el?.naturalHeight) || 0),
    el2 = el?.closest?.('[data-person-replacement-keyframe-stage]');
  if (!(count > 0 && count2 > 0) || !el2?.style) return false;
  (el2.style.setProperty('--frame-aspect', count + ' / ' + count2),
    el2.style.setProperty('--frame-width', String(count)),
    el2.style.setProperty('--frame-height', String(count2)),
    el.setAttribute?.('width', String(count)),
    el.setAttribute?.('height', String(count2)));
  const el3 = el2.parentElement,
    box = el3?.getBoundingClientRect?.(),
    count3 = Math.max(0, Number(el3?.clientWidth) || Number(box?.width) || 0),
    count4 = Math.max(0, Number(el3?.clientHeight) || Number(box?.height) || 0);
  if (count3 > 0 && count4 > 0) {
    const item = count / count2,
      key = count3 / count4,
      index = key > item ? count4 * item : count3,
      result = key > item ? count4 : count3 / item;
    (el2.style.setProperty('width', index + 'px'),
      el2.style.setProperty('height', result + 'px'));
  }
  return true;
}
function resolveSelectedShot(options = {}) {
  const list = Array.isArray(options?.shots) ? options.shots : [],
    text = normalizeText(options?.workspace?.selectedShotId);
  return list.find((data) => normalizeText(data?.id) === text) || list[0] || null;
}
function buildIdentityPresentation({
  project: project = {},
  shot: shot = {},
  boxedPeople: boxedPeople = [],
  duplicateRoleLabels: duplicateRoleLabels = [],
  mappedPersonIds: mappedPersonIds = [],
} = {}) {
  const map = new Set(duplicateRoleLabels),
    map2 = new Set(mappedPersonIds),
    text2 = normalizeText(shot?.id);
  return boxedPeople.map((person, target) => {
    const label = resolvePersonReplacementDetectionLabel(person, target, project, text2),
      targetCharacterId = resolvePersonReplacementTargetCharacterId(project, person),
      mapped = map2.has(normalizeText(person?.id)),
      duplicateRole = map.has(label);
    return {
      person: person,
      personId: normalizeText(person?.id),
      sourceCharacterId: normalizeText(person?.sourceCharacterId),
      targetCharacterId: targetCharacterId,
      label: label,
      mapped: mapped,
      duplicateRole: duplicateRole,
      eligible: mapped && !duplicateRole,
    };
  });
}
function hasProjectDerivedArtifacts(options2 = {}) {
  const source = options2?.output || {};
  return Boolean(
    normalizeText(options2?.audio?.originalAudioRef) ||
    normalizeText(source.originalMasterRef) ||
    normalizeText(source.visualMasterRef) ||
    normalizeText(source.finalVideoRef) ||
    normalizeText(source.finalAudioTrack) ||
    normalizeText(source.composeStatus).toLowerCase() === 'succeeded' ||
    (Array.isArray(source.composedShotIds) &&
      source.composedShotIds.some((next) => normalizeText(next))),
  );
}
function buildResultPresentation(options3 = {}, current = null) {
  const results = getPersonReplacementImageResults(current),
    activeIndex = getPersonReplacementActiveImageResultIndex(current, results),
    active = results[activeIndex] || null,
    activeRef =
      resolvePersonReplacementImageResultRef(active) || normalizeText(current?.replacementImageRef),
    shotHasDerivedArtifacts = Boolean(
      getPersonReplacementVideoResults(current).length ||
      normalizeText(current?.resultVideoRef) ||
      (normalizeText(current?.generationStatus) &&
        normalizeText(current?.generationStatus).toLowerCase() !== 'pending') ||
      normalizeText(current?.error),
    ),
    projectHasDerivedArtifacts = hasProjectDerivedArtifacts(options3);
  return {
    results: results,
    active: active,
    activeIndex: activeIndex,
    activeRef: activeRef,
    activePrompt: normalizeText(current?.imagePrompt),
    resultPrompt: Object.prototype.hasOwnProperty.call(active || {}, 'userPrompt')
      ? normalizeText(active?.userPrompt)
      : '',
    hasHistory: results.length > 1,
    downstream: {
      shotHasDerivedArtifacts: shotHasDerivedArtifacts,
      projectHasDerivedArtifacts: projectHasDerivedArtifacts,
      invalidationRequired: shotHasDerivedArtifacts || projectHasDerivedArtifacts,
    },
  };
}
export function buildPersonReplacementImagePresentation(project2 = {}, entry = []) {
  const shot2 = resolveSelectedShot(project2),
    selectedShotId = normalizeText(shot2?.id),
    promptPackage = shot2 ? buildPersonReplacementPromptPackage({ project: project2, shot: shot2 }) : null,
    boxedPeople2 = shot2 ? getPersonReplacementBoxedPeople(shot2) : [],
    mappedPersonIds2 = buildPersonReplacementImageGate({
      project: project2,
      shot: shot2 || {},
      promptPackage: promptPackage,
    }),
    duplicateRoleLabels2 = mappedPersonIds2.duplicateRoleLabels,
    state = resolvePersonReplacementImageGenerationState(project2?.workspace, selectedShotId),
    map3 = new Set((Array.isArray(entry) ? entry : []).map(normalizeText).filter(Boolean)),
    loading = Boolean(
      selectedShotId &&
      ((state.status === 'running' && normalizeText(state.shotId) === selectedShotId) ||
        map3.has(selectedShotId)),
    );
  return {
    selectedShot: shot2,
    selectedShotId: selectedShotId,
    sourceImageRef: resolvePersonReplacementImageSourceRef(shot2),
    promptPackage: promptPackage,
    boxedPeople: boxedPeople2,
    identities: buildIdentityPresentation({
      project: project2,
      shot: shot2,
      boxedPeople: boxedPeople2,
      duplicateRoleLabels: duplicateRoleLabels2,
      mappedPersonIds: mappedPersonIds2.mappedPersonIds,
    }),
    gate: mappedPersonIds2,
    generation: { state: state, loading: loading },
    result: buildResultPresentation(project2, shot2),
  };
}
function escapeHtml(record) {
  return String(record ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
function normalizeMediaUrl(payload) {
  const text3 = normalizeText(payload);
  return text3 ? localPathToUrl(text3) || text3 : '';
}
function renderPromptEnhancementControl(
  options4 = {},
  { disabled: disabled = false, pendingShotIds: pendingShotIds = [], model: model = {} } = {},
) {
  const isPersonReplacementManualPromptMode2 = isPersonReplacementManualPromptMode(options4);
  disabled = disabled || isPersonReplacementManualPromptMode2;
  const handle =
      !isPersonReplacementManualPromptMode2 &&
      options4.settings?.replacementPromptEnhancementEnabled === true,
    text4 = normalizeText(model.displayName || model.modelId) || '未配置',
    config =
      model.supportsImage === false
        ? '当前画布 Agent 模型“' +
          text4 +
          '”不支持图片理解。开启增强前，请在画布 Agent 面板切换为支持视觉理解的模型。按钮高亮表示已开启，再次点击关闭。'
        : '开启后，会识别选框中的原人物特征，并按既定绑定直接生成替换指令；同一原图和选框复用识别结果。首次识别会增加等待时间。当前模型：' +
          text4 +
          '，可在画布 Agent 面板更换。按钮高亮表示已开启，再次点击关闭。';
  return (
    '<div class="person-replacement-prompt-controls">' +
    renderPersonReplacementPromptModeControl(options4, { pendingShotIds: pendingShotIds }) +
    '<button type="button" class="story-secondary-button person-replacement-toggle-button person-replacement-prompt-enhancement-toggle" data-person-replacement-action="toggle-prompt-enhancement" aria-pressed="' +
    handle +
    '" data-auto-tooltip="' +
    escapeHtml(config) +
    '" data-tooltip="' +
    escapeHtml(
      isPersonReplacementManualPromptMode2 ? PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP : config,
    ) +
    '" ' +
    (disabled ? 'disabled' : '') +
    '>AI 提示词增强</button></div>'
  );
}
function renderImageReplacementGenerateButton(
  args,
  {
    presentation: presentation = {},
    shotBatchGenerationActive: shotBatchGenerationActive = false,
    shotBatchCancelRequested: shotBatchCancelRequested = false,
  } = {},
) {
  const enabled = presentation.selectedShot || null,
    scope = args.workspace.shotSelectionMode === true,
    enabled2 = Array.isArray(args.workspace.selectedShotIds)
      ? args.workspace.selectedShotIds.length
      : 0,
    map4 = new Set(
      Array.isArray(args.workspace.selectedShotIds)
        ? args.workspace.selectedShotIds.map(normalizeText).filter(Boolean)
        : [],
    ),
    input = args.shots.some((output) => {
      if (!map4.has(normalizeText(output.id))) return false;
      const personReplacementImagePresentation = buildPersonReplacementImagePresentation({
        ...args,
        workspace: { ...args.workspace, selectedShotId: normalizeText(output.id) },
      });
      return (
        !personReplacementImagePresentation.gate.sceneOnly &&
        personReplacementImagePresentation.gate.duplicateRoleLabels.length > 0
      );
    }),
    value2 = Boolean(presentation.generation?.loading),
    value3 = enabled2 ? ' (' + enabled2 + ')' : '',
    value4 = scope
      ? shotBatchGenerationActive
        ? shotBatchCancelRequested
          ? '正在停止' + value3
          : '取消运行' + value3
        : '' + (enabled2 > 1 ? '批量生成替换图' : '生成替换图') + value3
      : value2
        ? '生成中'
        : '生成替换图',
    value5 = scope
      ? !enabled2 || input || shotBatchCancelRequested
      : !enabled || !presentation.gate?.eligible || value2;
  return (
    '<button type="button" class="story-asset-generate-button" aria-busy="' +
    shotBatchGenerationActive +
    '" data-person-replacement-action="generate-replacement-image" ' +
    (value5 ? 'disabled' : '') +
    '>' +
    value4 +
    '</button>'
  );
}
function renderImageReplacementPage(
  runtimePreviewRef,
  smartDetectOpen = {},
  {
    buildIdentityView: buildIdentityView2,
    renderShotTimeline: renderShotTimeline2,
    renderLayoutSplitter: renderLayoutSplitter2,
    renderFooter: renderFooter2,
    renderSmartDetectTrigger: renderSmartDetectTrigger2,
  },
) {
  const presentation2 = buildPersonReplacementImagePresentation(
      runtimePreviewRef,
      smartDetectOpen.shotBatchGeneratingShotIds,
    ),
    description = presentation2.selectedShot,
    value6 = presentation2.sourceImageRef,
    enabled3 = smartDetectOpen.cutEditorOpen === true,
    value7 = smartDetectOpen.omitShotTimeline === true,
    value8 = smartDetectOpen.cutEditorSoundEnabled === true,
    value9 = enabled3
      ? Array.isArray(smartDetectOpen.cutEditorDraft)
        ? smartDetectOpen.cutEditorDraft.find(
            (value10) => value10.shotId === normalizeText(smartDetectOpen.cutEditorPreviewShotId),
          )
        : null
      : null,
    sourceShot = enabled3
      ? runtimePreviewRef.shots.find(
          (value11) => value11.id === normalizeText(smartDetectOpen.cutEditorPreviewShotId),
        ) ||
        runtimePreviewRef.shots.find(
          (value12) => value12.id === normalizeText(value9?.originShotId),
        ) ||
        description
      : description,
    source2 = enabled3
      ? runtimePreviewRef.sources.find((value13) => value13.id === sourceShot?.sourceId)
      : null,
    personReplacementSourcePlaybackRef = resolvePersonReplacementSourcePlaybackRef({
      runtimePreviewRef: runtimePreviewRef.sourcePreviewRefs?.[sourceShot?.sourceId],
      source: source2,
      sourceShot: sourceShot,
    }),
    mediaUrl = normalizeMediaUrl(personReplacementSourcePlaybackRef),
    value14 = /^aic-local-preview:/iu.test(mediaUrl) ? 'crossorigin="anonymous" ' : '',
    value15 = Boolean(
      enabled3 && mediaUrl && normalizeText(smartDetectOpen.cutEditorBufferedMediaRef) === mediaUrl,
    ),
    mediaUrl2 = normalizeMediaUrl(sourceShot?.keyframeRef || description?.keyframeRef),
    enabled4 = presentation2.generation.state,
    value16 = presentation2.generation.loading,
    value17 = Boolean(
      !isPersonReplacementManualPromptMode(runtimePreviewRef) &&
      value16 &&
      runtimePreviewRef.settings?.replacementPromptEnhancementEnabled === true &&
      !enabled4.promptEnhancement,
    ),
    text5 =
      normalizeText(
        smartDetectOpen.promptEnhancementModel?.displayName ||
          smartDetectOpen.promptEnhancementModel?.modelId,
      ) || '画布 Agent 当前模型',
    value18 = value17
      ? {
          title: 'AI 提示词增强中',
          description:
            description?.replacementPromptMode === 'positioning'
              ? '正在使用' + text5 + '识别选框中的原人物特征，完成后将自动开始生成替换图。'
              : '正在使用' + text5 + '分析原图与参考图，完成后将自动开始生成替换图。',
        }
      : !isPersonReplacementManualPromptMode(runtimePreviewRef) && enabled4.promptEnhancement
        ? { title: '图片生成中', description: '增强提示词已准备完成，正在等待生成结果。' }
        : { title: '图片生成中', description: '正在等待生成结果，完成后会自动显示。' },
    list2 = presentation2.result.results,
    value19 = presentation2.result.activeIndex,
    value20 = presentation2.result.hasHistory,
    value21 = value20
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-replacement-image-result',
          label: '切换到上一个替换图结果',
          className: 'person-replacement-image-result-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-replacement-image-result',
          label: '切换到下一个替换图结果',
          className: 'person-replacement-image-result-arrow',
        })
      : '',
    box2 = enabled3 ? sourceShot?.frame : description?.frame,
    value22 = Math.max(1, Number(box2?.width) || 16),
    value23 = Math.max(1, Number(box2?.height) || 9),
    value24 =
      '--frame-aspect:' +
      value22 +
      ' / ' +
      value23 +
      ';--frame-width:' +
      value22 +
      ';--frame-height:' +
      value23,
    people = presentation2.boxedPeople,
    duplicateRoleLabels3 = new Set(presentation2.gate.duplicateRoleLabels),
    value25 = buildIdentityView2(runtimePreviewRef, presentation2, {
      people: people,
      duplicateRoleLabels: duplicateRoleLabels3,
    }),
    value26 =
      (duplicateRoleLabels3.size
        ? '<p class="person-replacement-limit-warning person-replacement-role-conflict-warning">同一镜头内角色不能重复：' +
          escapeHtml([...duplicateRoleLabels3].join('、')) +
          '。请修改红色框中的角色名。</p>'
        : '') +
      (presentation2.gate.blockers.some((value27) =>
        ['image-limit', 'reference-review'].includes(value27),
      )
        ? '<p class="person-replacement-limit-warning" role="alert"' +
          (presentation2.gate.blockers.includes('reference-review')
            ? ' data-person-replacement-reference-review-warning'
            : '') +
          '>' +
          escapeHtml(presentation2.gate.message) +
          '</p>'
        : ''),
    value28 =
      description?.analysisStatus === 'failed'
        ? '人物检测失败'
        : description?.people?.length
          ? '检测结果缺少人物框'
          : '当前帧未检测到人物（可替换主体）',
    value29 =
      description?.analysisStatus === 'failed'
        ? description.error || '错误详情未保留，请用原视频新建项目重试后生成诊断包。'
        : '怪物、兽人等人形角色可能被人体模型漏检，可直接框选主体。',
    value30 =
      '<div class="person-replacement-detection-empty"><strong>' +
      value28 +
      '</strong><span>' +
      escapeHtml(value29) +
      '</span></div>',
    enabled5 = people.length > 0,
    value31 = enabled5
      ? '<button type="button" class="person-replacement-secondary-button person-replacement-clear-people-button" data-person-replacement-action="clear-shot-people" data-shot-id="' +
        escapeHtml(description?.id || '') +
        '" aria-label="清空全部人物框">清空</button>'
      : '<button type="button" class="person-replacement-secondary-button person-replacement-clear-people-button" aria-hidden="true" tabindex="-1" disabled>清空</button>',
    value32 =
      'person-replacement-keyframe-display person-replacement-middle-preview-slide' +
      (enabled3 ? ' is-cut-editor-open' : ''),
    value33 = !enabled3 && !enabled5,
    value34 = enabled3
      ? renderSmartDetectTrigger2({
          smartDetectOpen: smartDetectOpen.cutEditorSmartDetectOpen === true,
          smartDetecting: smartDetectOpen.cutEditorSmartDetecting === true,
          disabled: Boolean(
            smartDetectOpen.cutEditorSubmitting || smartDetectOpen.cutEditorSmartDetecting,
          ),
        })
      : value31,
    value35 =
      '<div class="person-replacement-keyframe-tools' +
      (value33 ? ' is-layout-placeholder' : '') +
      '"' +
      (value33 ? ' aria-hidden="true" inert' : '') +
      '>' +
      value34 +
      '</div>',
    value36 = runtimePreviewRef.shots.length > 1,
    value37 = value36
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-shot',
          label: '上一个片段',
          className: 'person-replacement-shot-navigation-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-shot',
          label: '下一个片段',
          className: 'person-replacement-shot-navigation-arrow',
        })
      : '',
    value38 = value36 ? ' aria-label="滚动鼠标滚轮或按左右方向键切换片段"' : '',
    value39 =
      enabled3 && personReplacementSourcePlaybackRef
        ? '<div class="' +
          value32 +
          '">' +
          value35 +
          '<div class="person-replacement-keyframe-stage-shell"><div class="person-replacement-shot-clip-stage" data-person-replacement-shot-cut-preview-stage data-person-replacement-video-playback-stage="cut-editor" data-shot-id="' +
          escapeHtml(sourceShot?.id || '') +
          '" style="' +
          value24 +
          '"><video aria-label="镜头切口预览" ' +
          value14 +
          'preload="' +
          (value15 ? 'none' : 'auto') +
          '" playsinline ' +
          (value8 ? '' : 'muted ') +
          (value15 ? '' : 'src="' + escapeHtml(mediaUrl) + '" ') +
          (mediaUrl2 ? 'poster="' + escapeHtml(mediaUrl2) + '"' : '') +
          ' data-person-replacement-shot-cut-video data-source-id="' +
          escapeHtml(sourceShot?.sourceId || '') +
          '"></video></div></div></div>'
        : value6
          ? '<div class="' +
            value32 +
            '"' +
            (value36 ? ' data-person-replacement-shot-wheel="true"' : '') +
            '>' +
            value35 +
            '<div class="person-replacement-keyframe-stage-shell"><div class="person-replacement-keyframe-stage" data-person-replacement-keyframe-stage data-story-marquee-surface="people" data-shot-id="' +
            escapeHtml(description?.id || '') +
            '" tabindex="0" aria-keyshortcuts="Control D Delete" style="' +
            value24 +
            '"' +
            value38 +
            '><img src="' +
            escapeHtml(normalizeMediaUrl(value6)) +
            '" alt="' +
            (description?.imageIterationReferenceRef ? '图像1参考图' : '视频首帧') +
            '" width="' +
            value22 +
            '" height="' +
            value23 +
            '">' +
            (people.length ? value25.detectionBoxesHtml : value30) +
            '</div></div>' +
            value37 +
            '</div>'
          : '<div class="person-replacement-inline-empty">视频仍在抽帧或没有可用首帧</div>',
    box3 = normalizePersonReplacementLayout(runtimePreviewRef.workspace.replacementLayout),
    value40 =
      '--person-replacement-left-width:' +
      box3.left +
      '%;--person-replacement-right-width:' +
      box3.right +
      '%;--person-replacement-center-top:' +
      box3.centerTop +
      '%;',
    renderPromptEnhancementControl2 = renderPromptEnhancementControl(runtimePreviewRef, {
      pendingShotIds: smartDetectOpen.shotBatchGeneratingShotIds,
      disabled: Boolean(value16 || smartDetectOpen.shotBatchGenerationActive),
      model: smartDetectOpen.promptEnhancementModel,
    });
  return (
    '<div class="person-replacement-production-page">\n    <div class="person-replacement-four-panel-layout" data-person-replacement-layout style="' +
    value40 +
    '">\n       ' +
    value25.targetAssetRailHtml +
    '\n       ' +
    renderLayoutSplitter2('left', box3) +
    '\n       <section class="person-replacement-keyframe-panel person-replacement-middle-layout">' +
    value39 +
    renderLayoutSplitter2('center', box3) +
    (value7 ? '' : renderShotTimeline2(runtimePreviewRef, { ...smartDetectOpen, allowCutEditing: true })) +
    '</section>\n      ' +
    renderLayoutSplitter2('right', box3) +
    '\n      <aside class="person-replacement-generation-panel person-replacement-image-generation-panel">\n        <div class="person-replacement-generation-preview ' +
    (value16 ? 'img-preview-loading' : '') +
    '" aria-busy="' +
    value16 +
    '"' +
    (value20
      ? ' data-person-replacement-image-result-wheel="true" aria-label="滚动鼠标滚轮切换生成结果"'
      : '') +
    '>\n          <div class="person-replacement-image-preview-slide">\n            ' +
    (presentation2.result.activeRef
      ? '<img src="' +
        escapeHtml(normalizeMediaUrl(presentation2.result.activeRef)) +
        '" alt="替换结果 ' +
        (value19 + 1) +
        '" width="' +
        value22 +
        '" height="' +
        value23 +
        '">'
      : '<span>生成结果显示在这里</span>') +
    '\n          </div>\n          ' +
    (value16 ? renderWorkspaceAssetLoadingOverlay(value18) : '') +
    '\n          <div class="story-asset-preview-actions person-replacement-result-actions">\n            ' +
    renderWorkspaceImageDownloadButton({
      action: 'download-replacement-image',
      enabled: Boolean(presentation2.result.activeRef),
      className: 'person-replacement-result-download',
    }) +
    '\n            <button type="button" class="story-upload-replace story-character-voice-upload-button person-replacement-result-upload" data-story-action="upload-replacement-image" aria-label="上传替换图片" ' +
    (!description || value16 ? 'disabled' : '') +
    '>' +
    renderWorkspaceUploadIcon() +
    '</button>\n          </div>\n          ' +
    value21 +
    '\n          ' +
    (list2.length
      ? '<div class="person-replacement-image-result-meta" aria-label="生成结果 ' +
        (value19 + 1) +
        '/' +
        list2.length +
        '"><span>' +
        (value19 + 1) +
        '/' +
        list2.length +
        '</span></div>'
      : '') +
    '\n        </div>\n        ' +
    renderLayoutSplitter2('center', box3, { label: '调整结果预览与提示词区域高度' }) +
    '\n        <div class="story-asset-detail-copy person-replacement-generation-copy"><div class="story-asset-prompt-field person-replacement-prompt-field"><div class="person-replacement-prompt-field-heading">' +
    value25.promptReferenceInputsHtml +
    renderPromptEnhancementControl2 +
    '</div><div class="prompt-input-wrapper is-resizable person-replacement-prompt-input-wrapper"><div class="prompt-textarea custom-textarea story-asset-prompt-editor person-replacement-prompt-editor" contenteditable="true" role="textbox" aria-label="图像替换提示词" data-placeholder="描述替换效果，输入 @ 引用左侧素材图" data-person-replacement-field="image-prompt" data-shot-id="' +
    escapeHtml(description?.id || '') +
    '">' +
    renderPersonReplacementPromptHtml(presentation2.result.activePrompt) +
    '</div></div></div>' +
    (presentation2.gate.overflowPersonIds.length
      ? '<p class="person-replacement-limit-warning">单次最多 8 个目标人物</p>'
      : '') +
    (presentation2.gate.unresolvedOrientationPersonIds.length
      ? '<p class="person-replacement-limit-warning person-replacement-orientation-warning">还有 ' +
        presentation2.gate.unresolvedOrientationPersonIds.length +
        ' 个人物未确认朝向，确认后才能生成。</p>'
      : '') +
    value26 +
    '<div class="story-asset-generation-bar prompt-panel-footer">' +
    renderAIGenImageModelSelectorMarkup({
      modelId:
        runtimePreviewRef.settings.replacementImageModelId || PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
      provider: runtimePreviewRef.settings.replacementImageProvider,
      generationParams: runtimePreviewRef.settings.replacementImageGenerationParams || {},
      providerProfileId: runtimePreviewRef.settings.replacementImageProviderProfileId,
      providerProfileIdByModel: runtimePreviewRef.settings.replacementImageProviderProfileIdByModel,
      showSchemaControls: true,
      runningHubWorkflowModelIds: [QWEN_IMAGE_21_EDIT_MODEL_ID],
      className: 'story-asset-image-model-selector person-replacement-image-model-selector',
    }) +
    renderRequestDebugButton('data-story-action="debug-generation-image"') +
    renderImageReplacementGenerateButton(runtimePreviewRef, {
      presentation: presentation2,
      ...smartDetectOpen,
    }) +
    '</div>' +
    (enabled4.error
      ? '<p class="person-replacement-error">' + escapeHtml(enabled4.error) + '</p>'
      : '') +
    '</div>\n      </aside>\n   </div>' +
    renderFooter2(runtimePreviewRef, { nextLabel: '进入视频替换' }) +
    '\n  </div>'
  );
}
function cloneFrozenPresentationValue(list3) {
  if (Array.isArray(list3)) return Object.freeze(list3.map(cloneFrozenPresentationValue));
  if (!list3 || typeof list3 !== 'object') return list3;
  return Object.freeze(
    Object.fromEntries(
      Object.entries(list3).map(([value41, value42]) => [
        value41,
        cloneFrozenPresentationValue(value42),
      ]),
    ),
  );
}
function buildReadonlyImagePresentation(value43, value44) {
  const selectedShot = buildPersonReplacementImagePresentation(value43, value44);
  return Object.freeze({
    selectedShot: selectedShot.selectedShot
      ? cloneFrozenPresentationValue(selectedShot.selectedShot)
      : null,
    selectedShotId: selectedShot.selectedShotId,
    sourceImageRef: selectedShot.sourceImageRef,
    promptPackage: selectedShot.promptPackage
      ? cloneFrozenPresentationValue(selectedShot.promptPackage)
      : null,
    boxedPeople: cloneFrozenPresentationValue(selectedShot.boxedPeople),
    identities: cloneFrozenPresentationValue(selectedShot.identities),
    gate: cloneFrozenPresentationValue(selectedShot.gate),
    generation: cloneFrozenPresentationValue(selectedShot.generation),
    result: cloneFrozenPresentationValue(selectedShot.result),
  });
}
export function syncPersonReplacementImageGenerationLoading(el4, value45) {
  const el5 = el4?.querySelector?.('.person-replacement-generation-preview');
  if (!el5) return;
  const enabled6 = Boolean(value45?.generation?.loading);
  (el5.classList.toggle('img-preview-loading', enabled6),
    el5.setAttribute('aria-busy', String(enabled6)));
  const el6 = el5.querySelector('.story-asset-loading-overlay');
  if (!enabled6) el6?.remove();
  else {
    if (!el6) {
      const el7 = el5.ownerDocument.createElement('template');
      ((el7.innerHTML = renderWorkspaceAssetLoadingOverlay()),
        el5.append(el7.content.firstElementChild));
    }
  }
}
export function syncPersonReplacementImagePromptGate(el8, value46, args2 = {}) {
  const el9 = el8?.querySelector?.('[data-person-replacement-action="generate-replacement-image"]'),
    el10 = el8?.ownerDocument;
  if (!el9 || !el10?.createElement) return;
  const presentation3 = buildReadonlyImagePresentation(value46, args2.shotBatchGeneratingShotIds),
    el11 = el10.createElement('template');
  ((el11.innerHTML = renderImageReplacementGenerateButton(value46, {
    ...args2,
    presentation: presentation3,
  })),
    (el9.disabled = el11.content.firstElementChild.disabled));
  let el12 = el8.querySelector('[data-person-replacement-reference-review-warning]');
  if (!presentation3.gate.blockers.includes('reference-review')) {
    el12?.remove();
    return;
  }
  (!el12 &&
    ((el12 = el10.createElement('p')),
    (el12.className = 'person-replacement-limit-warning'),
    el12.setAttribute('role', 'alert'),
    el12.setAttribute('data-person-replacement-reference-review-warning', ''),
    el9.closest('.prompt-panel-footer')?.before(el12)),
    (el12.textContent = presentation3.gate.message));
}
export function createPersonReplacementImagePresentation({
  buildIdentityView: buildIdentityView = () => ({
    detectionBoxesHtml: '',
    promptReferenceInputsHtml: '',
    targetAssetRailHtml: '',
  }),
  renderShotTimeline: renderShotTimeline = () => '',
  renderLayoutSplitter: renderLayoutSplitter = () => '',
  renderFooter: renderFooter = () => '',
  renderSmartDetectTrigger: renderSmartDetectTrigger = () => '',
} = {}) {
  const value47 = Object.freeze({
    buildIdentityView: buildIdentityView,
    renderShotTimeline: renderShotTimeline,
    renderLayoutSplitter: renderLayoutSplitter,
    renderFooter: renderFooter,
    renderSmartDetectTrigger: renderSmartDetectTrigger,
  });
  return Object.freeze({
    build: buildReadonlyImagePresentation,
    render: (value48, value49 = {}) => renderImageReplacementPage(value48, value49, value47),
    renderGenerateButton: renderImageReplacementGenerateButton,
  });
}
