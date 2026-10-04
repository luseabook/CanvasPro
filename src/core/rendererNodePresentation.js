import { isNodeType } from '../modules/registry.js';
import { getRefKindByNodeType } from '../modules/nodeMeta.js';
import { resolveModelProvider } from '../manifests/index.js';
import { t } from '../i18n/index.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
export function getRendererDefaultNodeLabel(value) {
  const list = String(value?.type || '');
  if (list === 'whiteboard') return t('nodeCreation.items.whiteboard.defaultName');
  if (list === 'comfyui-workflow') return t('nodeCreation.items.comfyWorkflow.defaultName');
  if (list === 'story-workspace') return t('nodeCreation.items.storyWorkspace.defaultName');
  let t2 = t('coreUi.renderer.defaultNodeNames.node');
  if (list.includes('image')) t2 = t('coreUi.renderer.defaultNodeNames.image');
  else {
    if (list.includes('video')) t2 = t('coreUi.renderer.defaultNodeNames.video');
    else {
      if (list.includes('audio')) t2 = t('coreUi.renderer.defaultNodeNames.audio');
      else {
        if (list.includes('text')) t2 = t('coreUi.renderer.defaultNodeNames.text');
      }
    }
  }
  return t2;
}
export function getRendererNodeZIndex(item, enabled, key = -1, index = {}) {
  if (isNodeType(item, 'group')) return 'auto';
  if (isNodeType(item, 'debug')) return '1200';
  if (isNodeType(item, 'media-clip') && item?.mediaClip?.expanded === true) return '12000';
  if (index?.isFocused === true) return '180';
  if (item?.isImagesExpanded || item?.isVideosExpanded) return '140';
  if (!enabled) return '10';
  const result = Math.max(0, Math.min(39, Number(key) || 0));
  return String(100 + result);
}
export function shouldSkipInitialMediaNodeUpdate(data, options) {
  return (
    options &&
    isNodeType(data, ['source-image', 'image', 'ai-image', 'source-video', 'video', 'ai-video']) &&
    !shouldShowGenerationBusyUi(data)
  );
}
export function buildSelectedNodeRankMap(target) {
  const source = target instanceof Set ? target : target || [];
  return new Map(Array.from(source).map((item2, next) => [item2, next]));
}
export function buildRendererDragTargetSet({
  dragContext: dragContext,
  selectedNodeSet: selectedNodeSet,
  parentToChildren: parentToChildren,
}) {
  if (!dragContext?.isDragging || !dragContext.targetNodeId) return null;
  const args = selectedNodeSet.has(dragContext.targetNodeId)
      ? Array.from(selectedNodeSet)
      : [dragContext.targetNodeId],
    map = new Set(args),
    list2 = [...args];
  while (list2.length > 0) {
    const current = list2.pop(),
      enabled2 = parentToChildren?.[current];
    if (!enabled2) continue;
    for (const entry of enabled2) {
      if (map.has(entry)) continue;
      (map.add(entry), list2.push(entry));
    }
  }
  return map;
}
export function formatRendererNodeLabelText(record) {
  const list3 = String(record || '')['trim']();
  if (!list3) return '';
  const payload = /^[\x00-\x7F]*$/['test'](list3);
  return payload && list3['length'] > 0x14 ? list3['slice'](0x0, 0x14) + '...' : list3;
}
export function getRendererGroupColorWithOpacity(handle, state) {
  const config = String(handle || '')['match'](/var\(--([^)]+)\)/);
  return config ? 'var(--' + config[0x1] + '-' + state + ')' : handle;
}
export function getRendererNodeLabelKind(scope) {
  const refKindByNodeType = getRefKindByNodeType(scope);
  return ['text', 'image', 'video', 'audio']['includes'](refKindByNodeType) ? refKindByNodeType : '';
}
export function clearRendererNodeLabelTooltip(el) {
  if (!el) return;
  const run = (input, output = '') => {
    if (typeof el['removeAttribute'] === 'function') el['removeAttribute'](input);
    else
      el['attributes'] &&
        typeof el['attributes']['delete'] === 'function' &&
        el['attributes']['delete'](input);
    output && el['dataset'] && output in el['dataset'] && delete el['dataset'][output];
  };
  run('title');
  if ('title' in el) el['title'] = '';
  (run('data-tooltip', 'tooltip'),
    run('data-tooltip-right', 'tooltipRight'),
    run('data-tooltip-source', 'tooltipSource'),
    run('data-native-title', 'nativeTitle'));
}
export function setRendererNodeLabelContent(
  el2,
  {
    labelKind: labelKind,
    displayLabelText: displayLabelText,
    defaultName: defaultName,
    isBeta: isBeta,
    fullLabelText: fullLabelText,
  },
  el3 = globalThis['document'],
) {
  if (!el2) return;
  clearRendererNodeLabelTooltip(el2);
  const list4 = [];
  if (labelKind) {
    const el4 = el3['createElement']('span');
    ((el4['className'] = 'node-label-icon'),
      el4['setAttribute']('aria-hidden', 'true'),
      (el4['dataset']['labelKind'] = labelKind),
      (el4['textContent'] = labelKind === 'text' ? 'T' : ''),
      list4['push'](el4));
  }
  const el5 = el3['createElement']('span');
  ((el5['className'] = 'node-label-text'),
    (el5['textContent'] = displayLabelText || defaultName),
    list4['push'](el5));
  if (isBeta) {
    const el6 = el3['createElement']('span');
    ((el6['className'] = 'v2-node-beta-pill'),
      (el6['textContent'] = 'Beta'),
      list4['push'](el6),
      (el2['dataset']['betaLabel'] = fullLabelText));
  } else 'betaLabel' in el2['dataset'] && delete el2['dataset']['betaLabel'];
  el2['replaceChildren'](...list4);
}
export function syncRendererNodeDragTransform(
  el7,
  box,
  {
    active: active = false,
    offsetX: offsetX = 0,
    offsetY: offsetY = 0,
    positionChanged: positionChanged = false,
  } = {},
) {
  if (!el7?.['style'] || !box) return '';
  const value2 = el7['_dragPreviewTransformActive'] === true;
  if (active === true) {
    const value3 = Number.isFinite(offsetX) ? offsetX : 0,
      value4 = Number.isFinite(offsetY) ? offsetY : 0,
      value5 = 'translate(' + (box['x'] + value3) + 'px, ' + (box['y'] + value4) + 'px)';
    return (
      el7['style']['transform'] !== value5 && (el7['style']['transform'] = value5),
      (el7['_dragPreviewTransformActive'] = true),
      value5
    );
  }
  if (positionChanged || value2) {
    const value6 = 'translate(' + box['x'] + 'px, ' + box['y'] + 'px)';
    return (
      el7['style']['transform'] !== value6 && (el7['style']['transform'] = value6),
      value2 && delete el7['_dragPreviewTransformActive'],
      value6
    );
  }
  return el7['style']['transform'] || '';
}
function getDreaminaTimerPhaseTitle(enabled3) {
  if (!enabled3 || !isNodeType(enabled3, 'ai-video')) return '';
  const modelProvider =
    resolveModelProvider(enabled3['model'], enabled3['provider'], { allowPrefixInference: false }) ===
    'dreamina';
  if (!modelProvider) return '';
  const value7 = String(enabled3['dreaminaTaskPhase'] || '')
      ['trim']()
      ['toLowerCase'](),
    value8 = String(enabled3['dreaminaTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
  if (value7 === 'failed' || value8 === 'failed') return t('coreUi.renderer.dreaminaPhase.failed');
  if (value7 === 'syncing') return t('coreUi.renderer.dreaminaPhase.syncing');
  if (value7 === 'queued') return t('coreUi.renderer.dreaminaPhase.queued');
  if (value7 === 'generating') return t('coreUi.renderer.dreaminaPhase.generating');
  if (value7 === 'done') return t('coreUi.renderer.dreaminaPhase.done');
  return String(enabled3['dreaminaTaskLabel'] || '')['trim']();
}
export function formatRendererNodeTimerText(value9, value10) {
  const value11 = Math.max(0, Number(value10) || 0),
    value12 = Math.floor(value11 / 0x3e8),
    value13 = Math.floor((value11 % 0x3e8) / 0x64),
    value14 = value12 + '.' + value13 + 's',
    dreaminaTimerPhaseTitle = getDreaminaTimerPhaseTitle(value9);
  return dreaminaTimerPhaseTitle ? dreaminaTimerPhaseTitle + ' · ' + value14 : value14;
}

const FAST_PREVIEW_PRESENTATION_OWNER = 'fast-preview',
  FAST_PREVIEW_OWNED_NODE_Z_INDEX = '10';

function normalizeRendererNodeZIndex(value15) {
  const value16 = String(value15 ?? '')['trim']();
  return value16 || FAST_PREVIEW_OWNED_NODE_Z_INDEX;
}

function resolveFastPreviewOwnedNodeZIndex(value17) {
  const value18 = Number['parseInt'](value17, 0xa),
    value19 = Number['parseInt'](FAST_PREVIEW_OWNED_NODE_Z_INDEX, 0xa);
  if (!Number['isFinite'](value18)) return FAST_PREVIEW_OWNED_NODE_Z_INDEX;
  return String(Math['min'](value18, value19));
}

function applyRendererNodePresentationZIndex(el8) {
  if (!el8?.['dataset'] || !el8?.['style']) return '';
  const rendererNodeZIndex = normalizeRendererNodeZIndex(
      el8['dataset']['rendererPresentationTargetZIndex'] || el8['style']['zIndex'],
    ),
    enabled4 =
      el8['dataset']['rendererPresentationOwner'] === FAST_PREVIEW_PRESENTATION_OWNER &&
      Number['parseInt'](rendererNodeZIndex, 0xa) > Number(FAST_PREVIEW_OWNED_NODE_Z_INDEX) &&
      !!el8['querySelector']?.('.text-prompt-panel') &&
      !!el8['querySelector']?.('.img-node-preview');
  enabled4
    ? (el8['dataset']['rendererPresentationUiLifted'] = 'true')
    : delete el8['dataset']['rendererPresentationUiLifted'];
  const value20 =
    el8['dataset']['rendererPresentationOwner'] === FAST_PREVIEW_PRESENTATION_OWNER && !enabled4
      ? resolveFastPreviewOwnedNodeZIndex(rendererNodeZIndex)
      : rendererNodeZIndex;
  return (el8['style']['zIndex'] !== value20 && (el8['style']['zIndex'] = value20), value20);
}

export function syncRendererNodePresentationZIndex(el9, value21) {
  if (!el9?.['dataset'] || !el9?.['style']) return '';
  const rendererNodeZIndex2 = normalizeRendererNodeZIndex(value21);
  return (
    el9['dataset']['rendererPresentationTargetZIndex'] !== rendererNodeZIndex2 &&
      (el9['dataset']['rendererPresentationTargetZIndex'] = rendererNodeZIndex2),
    applyRendererNodePresentationZIndex(el9)
  );
}

export function liftRendererNodePresentationZIndex(el10, value22) {
  if (!el10?.['dataset'] || !el10?.['style']) return '';
  const value23 = Number['parseInt'](
      el10['dataset']['rendererPresentationTargetZIndex'] || el10['style']['zIndex'],
      0xa,
    ),
    value24 = Number['parseInt'](value22, 0xa);
  if (!Number['isFinite'](value23) || (Number['isFinite'](value24) && value23 < value24))
    return syncRendererNodePresentationZIndex(el10, value22);
  return applyRendererNodePresentationZIndex(el10);
}

export function syncRendererFastPreviewPresentationOwner(el11, value25) {
  if (!el11?.['dataset'] || !el11?.['style']) return ![];
  !el11['dataset']['rendererPresentationTargetZIndex'] &&
    (el11['dataset']['rendererPresentationTargetZIndex'] = normalizeRendererNodeZIndex(
      el11['style']['zIndex'],
    ));
  if (value25 === !![])
    el11['dataset']['rendererPresentationOwner'] !== FAST_PREVIEW_PRESENTATION_OWNER &&
      (el11['dataset']['rendererPresentationOwner'] = FAST_PREVIEW_PRESENTATION_OWNER);
  else
    el11['dataset']['rendererPresentationOwner'] === FAST_PREVIEW_PRESENTATION_OWNER &&
      delete el11['dataset']['rendererPresentationOwner'];
  return (applyRendererNodePresentationZIndex(el11), !![]);
}

export function formatVideoMetaText({ fps: fps, frames: frames, width: width, height: height } = {}) {
  const count = Number(fps),
    count2 = Number(frames);
  if (!Number['isFinite'](count) || count <= 0x0 || !Number['isFinite'](count2) || count2 <= 0x0) return '';
  const value26 =
      Math['abs'](count - Math['round'](count)) < 0.01
        ? String(Math['round'](count))
        : String(Number(count['toFixed'](0x2))),
    count3 = Number(width),
    count4 = Number(height),
    value27 = Number['isFinite'](count3) && count3 > 0x0 && Number['isFinite'](count4) && count4 > 0x0,
    t3 = t('coreUi.renderer.videoMeta.framesFps', { frames: Math['round'](count2), fps: value26 });
  return value27 ? Math['round'](count3) + '×' + Math['round'](count4) + '\x20·\x20' + t3 : t3;
}
