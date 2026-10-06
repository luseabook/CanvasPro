import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { normalizeLocalPath } from '../utils/localMediaPath.js';
import { normalizeNodeType } from './nodeMeta.js';
import { resolveNodeDisplayedMediaMetrics } from './nodeMediaMetrics.js';
import { resolveSourceVideoMediaTaskSrc } from '../components/source-video/sourceVideoMediaState.js';
import { scheduleSourceVideoIdleTask } from '../components/source-video/sourceVideoRuntime.js';
const VIDEO_META_RETRY_DELAY_MS = 30000,
  IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image']),
  VIDEO_NODE_TYPES = new Set(['source-video', 'ai-video']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'ai-audio']),
  TEXT_EDITOR_SELECTOR = '.prompt-textarea, .source-text-content';
function toPositiveNumber(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function pickPositiveNumber(...args) {
  for (const item of args) {
    const toPositiveNumber2 = toPositiveNumber(item);
    if (toPositiveNumber2 > 0) return toPositiveNumber2;
  }
  return 0;
}
function normalizeMetaSourceIdentity(key) {
  return normalizeLocalPath(key) || String(key || '').trim();
}
function pickMainItem(list, index) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const result = Number(index),
    data = Number.isFinite(result) ? Math.max(0, Math.trunc(result)) : 0;
  return list[data] || list[0] || null;
}
function resolveNodeName(error, error2) {
  return String(error?.name || error?.fileName || error2?.name || error2?.fileName || '').trim();
}
function buildImageModel(args2) {
  const options = { ...args2, type: normalizeNodeType(args2?.type) },
    mainItem = pickMainItem(options.images, options.mainImageIndex) || options,
    nodeDisplayedMediaMetrics = resolveNodeDisplayedMediaMetrics(options).image,
    width = pickPositiveNumber(
      mainItem?.originalWidth,
      mainItem?.imageWidth,
      nodeDisplayedMediaMetrics?.w,
      options.originalWidth,
      options.imageWidth,
      options.naturalWidth,
    ),
    height = pickPositiveNumber(
      mainItem?.originalHeight,
      mainItem?.imageHeight,
      nodeDisplayedMediaMetrics?.h,
      options.originalHeight,
      options.imageHeight,
      options.naturalHeight,
    );
  return {
    nodeId: String(options.id || ''),
    kind: 'image',
    name: resolveNodeName(options, mainItem),
    width: width,
    height: height,
    duration: 0,
    fps: 0,
    frameCount: 0,
    frameCountApproximate: false,
    metaSource: '',
    needsVideoProbe: false,
  };
}
function buildVideoModel(args3) {
  const target = { ...args3, type: normalizeNodeType(args3?.type) },
    box = pickMainItem(target.videos, target.mainVideoIndex) || target,
    metaSource = resolveSourceVideoMediaTaskSrc(target),
    metaSourceIdentity = normalizeMetaSourceIdentity(metaSource),
    metaSourceIdentity2 = normalizeMetaSourceIdentity(target.videoMetaSrc),
    source = !metaSourceIdentity2 || !metaSourceIdentity || metaSourceIdentity2 === metaSourceIdentity,
    nodeDisplayedMediaMetrics2 = resolveNodeDisplayedMediaMetrics(target).video,
    width2 = pickPositiveNumber(
      box?.videoWidth,
      box?.originalWidth,
      box?.width,
      nodeDisplayedMediaMetrics2?.w,
      source ? target.videoWidth : 0,
      target.naturalWidth,
    ),
    height2 = pickPositiveNumber(
      box?.videoHeight,
      box?.originalHeight,
      box?.height,
      nodeDisplayedMediaMetrics2?.h,
      source ? target.videoHeight : 0,
      target.naturalHeight,
    ),
    duration = pickPositiveNumber(
      box?.videoDuration,
      box?.duration,
      source ? target.videoDuration : 0,
      target.duration,
    ),
    fps = pickPositiveNumber(
      box?.videoFps,
      box?.fps,
      source ? target.videoFps : 0,
      target.fps,
      target.frameRate,
    ),
    frameCount = pickPositiveNumber(
      box?.videoFrameCount,
      box?.frameCount,
      source ? target.videoFrameCount : 0,
      target.frameCount,
    ),
    count2 =
      frameCount <= 0 && duration > 0 && fps > 0
        ? Math.max(1, Math.round(duration * fps))
        : 0;
  return {
    nodeId: String(target.id || ''),
    kind: 'video',
    name: resolveNodeName(target, box),
    width: width2,
    height: height2,
    duration: duration,
    fps: fps,
    frameCount: frameCount || count2,
    frameCountApproximate: frameCount <= 0 && count2 > 0,
    metaSource: metaSource,
    needsVideoProbe:
      !!metaSource && (width2 <= 0 || height2 <= 0 || duration <= 0 || fps <= 0 || frameCount <= 0),
  };
}
function buildAudioModel(args4) {
  const next = { ...args4, type: normalizeNodeType(args4?.type) },
    mainItem2 = pickMainItem(next.audios, next.mainAudioIndex) || next,
    duration2 = pickPositiveNumber(
      mainItem2?.audioDuration,
      mainItem2?.duration,
      next.audioDuration,
      next.duration,
    );
  return {
    nodeId: String(next.id || ''),
    kind: 'audio',
    name: resolveNodeName(next, mainItem2),
    width: 0,
    height: 0,
    duration: duration2,
    fps: 0,
    frameCount: 0,
    frameCountApproximate: false,
    metaSource: '',
    needsVideoProbe: false,
  };
}
function buildTextEditingModel(current, characterCount) {
  return {
    nodeId: String(current?.id || ''),
    kind: 'text',
    name: resolveNodeName(current),
    width: 0,
    height: 0,
    duration: 0,
    fps: 0,
    frameCount: 0,
    frameCountApproximate: false,
    characterCount: characterCount,
    metaSource: '',
    needsVideoProbe: false,
  };
}
export function buildSelectionMediaPropertiesModel(entry) {
  const nodeType = normalizeNodeType(entry?.type);
  if (IMAGE_NODE_TYPES.has(nodeType)) return buildImageModel(entry);
  if (VIDEO_NODE_TYPES.has(nodeType)) return buildVideoModel(entry);
  if (AUDIO_NODE_TYPES.has(nodeType)) return buildAudioModel(entry);
  return null;
}
export function selectSelectionMediaPropertiesModel(state = {}) {
  const list2 = Array.isArray(state.selectedNodeIds) ? state.selectedNodeIds : [];
  if (list2.length !== 1) return null;
  const record = state.nodes?.[list2[0]];
  return buildSelectionMediaPropertiesModel(record);
}
function isSupportedTextEditor(enabled) {
  if (!enabled?.matches?.(TEXT_EDITOR_SELECTOR)) return false;
  if (!enabled.matches('.source-text-content')) return true;
  return enabled.isContentEditable === true || enabled.getAttribute?.('contenteditable') === 'true';
}
function readEditorText(el) {
  if (typeof el?.value === 'string') return el.value;
  if (typeof el?.innerText === 'string') return el.innerText;
  return String(el?.textContent || '');
}
export function selectActiveTextEditingProperties(enabled2 = {}, dom = globalThis.document) {
  const el2 = dom?.activeElement;
  if (!isSupportedTextEditor(el2)) return null;
  const el3 = el2.closest?.('[data-node-id]'),
    nodeId = String(el3?.dataset?.nodeId || el3?.getAttribute?.('data-node-id') || '').trim();
  if (!nodeId || !enabled2.nodes?.[nodeId]) return null;
  return { nodeId: nodeId, characterCount: readEditorText(el2).length };
}
export function selectSelectionPropertiesDisplayModel(state2 = {}, payload = globalThis.document) {
  const characterCount2 = selectActiveTextEditingProperties(state2, payload);
  if (!characterCount2) return selectSelectionMediaPropertiesModel(state2);
  const handle = state2.nodes?.[characterCount2.nodeId],
    args5 =
      buildSelectionMediaPropertiesModel(handle) ||
      buildTextEditingModel(handle, characterCount2.characterCount);
  return { ...args5, characterCount: characterCount2.characterCount };
}
function formatDecimal(config, maximumFractionDigits = 2) {
  const toPositiveNumber3 = toPositiveNumber(config);
  if (toPositiveNumber3 <= 0) return '';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maximumFractionDigits }).format(
    toPositiveNumber3,
  );
}
function formatDimension(scope, input) {
  const count3 = Math.round(toPositiveNumber(scope)),
    count4 = Math.round(toPositiveNumber(input));
  if (count3 <= 0 || count4 <= 0) return '—';
  return count3 + ' × ' + count4;
}
function formatDuration(output) {
  const value2 = formatDecimal(output);
  return value2 ? t('selectionMediaProperties.values.seconds', { value: value2 }) : '—';
}
function formatFps(value3) {
  const formatDecimal2 = formatDecimal(value3);
  return formatDecimal2 ? formatDecimal2 + ' fps' : '—';
}
function formatFrameCount(value4, value5) {
  const count5 = Math.round(toPositiveNumber(value4));
  if (count5 <= 0) return '—';
  return t(
    value5 ? 'selectionMediaProperties.values.framesApproximate' : 'selectionMediaProperties.values.frames',
    { value: new Intl.NumberFormat().format(count5) },
  );
}
function formatCharacterCount(value6) {
  const value7 = Number(value6),
    value8 = Number.isFinite(value7) ? Math.max(0, Math.trunc(value7)) : 0;
  return new Intl.NumberFormat().format(value8);
}
function setText(el4, value9, value10) {
  const el5 = el4?.querySelector?.(value9);
  if (el5 && el5.textContent !== value10) el5.textContent = value10;
}
function setRowVisible(el6, value11, value12) {
  const el7 = el6?.querySelector?.('[data-selection-media-row="' + value11 + '"]');
  if (el7) el7.hidden = value12 !== true;
}
export function renderSelectionMediaProperties(el8, box2) {
  if (!el8) return;
  if (!box2) {
    ((el8.hidden = true), el8.removeAttribute?.('data-media-kind'));
    return;
  }
  ((el8.hidden = false),
    el8.setAttribute?.('data-media-kind', box2.kind),
    setText(el8, '[data-selection-media-kind]', t('selectionMediaProperties.' + box2.kind)),
    setText(
      el8,
      '[data-selection-media-name]',
      box2.name || t('selectionMediaProperties.' + box2.kind),
    ),
    setText(
      el8,
      '[data-selection-media-value="dimensions"]',
      formatDimension(box2.width, box2.height),
    ));
  const value13 = box2.kind === 'image' || box2.kind === 'video',
    value14 = box2.kind === 'video',
    value15 = value14 || box2.kind === 'audio',
    value16 = Number.isFinite(box2.characterCount);
  (setRowVisible(el8, 'dimensions', value13),
    setRowVisible(el8, 'duration', value15),
    setRowVisible(el8, 'fps', value14),
    setRowVisible(el8, 'frames', value14),
    setRowVisible(el8, 'characters', value16),
    value15 && setText(el8, '[data-selection-media-value="duration"]', formatDuration(box2.duration)),
    value14 &&
      (setText(el8, '[data-selection-media-value="fps"]', formatFps(box2.fps)),
      setText(
        el8,
        '[data-selection-media-value="frames"]',
        formatFrameCount(box2.frameCount, box2.frameCountApproximate === true),
      )),
    value16 &&
      setText(
        el8,
        '[data-selection-media-value="characters"]',
        formatCharacterCount(box2.characterCount),
      ));
}
function buildVideoMetaPatch(box3, videoMetaSrc) {
  const value17 = { videoMetaSrc: videoMetaSrc },
    toPositiveNumber4 = toPositiveNumber(box3?.fps),
    toPositiveNumber5 = toPositiveNumber(box3?.frameCount),
    toPositiveNumber6 = toPositiveNumber(box3?.duration),
    toPositiveNumber7 = toPositiveNumber(box3?.width),
    toPositiveNumber8 = toPositiveNumber(box3?.height);
  if (toPositiveNumber4 > 0) value17.videoFps = toPositiveNumber4;
  if (toPositiveNumber5 > 0) value17.videoFrameCount = Math.round(toPositiveNumber5);
  if (toPositiveNumber6 > 0) value17.videoDuration = toPositiveNumber6;
  if (toPositiveNumber7 > 0) value17.videoWidth = Math.round(toPositiveNumber7);
  if (toPositiveNumber8 > 0) value17.videoHeight = Math.round(toPositiveNumber8);
  return value17;
}
export function initSelectionMediaProperties({
  graphStore: graphStore,
  uiStore: uiStore,
  element: element,
  fetchVideoMeta: fetchVideoMeta = fetchVideoMetaFromServer,
  scheduleIdleTask: scheduleIdleTask = scheduleSourceVideoIdleTask,
  now: now = () => Date.now(),
  documentObject: documentObject = globalThis.document,
} = {}) {
  if (!graphStore?.subscribeSelector || !uiStore?.subscribeSelector || !element) return () => {};
  let enabled3 = uiStore.getState?.()?.ui?.showSelectionMediaProperties !== false,
    selectionMediaPropertiesModel = selectSelectionMediaPropertiesModel(
      graphStore.getStateRaw?.() || graphStore.getState?.(),
    ),
    scheduleIdleTask2 = null,
    value18 = '',
    enabled4 = false,
    value19 = false;
  const map = new Map(),
    handler = () => {
      (scheduleIdleTask2?.(), (scheduleIdleTask2 = null), (value18 = ''));
    },
    handler2 = (value20) => {
      const enabled5 = String(value20?.metaSource || '').trim();
      if (!enabled3 || value20?.kind !== 'video' || value20?.needsVideoProbe !== true || !enabled5) {
        handler();
        return;
      }
      const response = map.get(enabled5);
      if (response?.status === 'success') {
        response.patch &&
          !response.appliedNodeIds?.has(value20.nodeId) &&
          (response.appliedNodeIds.add(value20.nodeId),
          graphStore.updateNodeData?.(value20.nodeId, response.patch));
        return;
      }
      if (
        response?.status === 'pending' ||
        (response?.status === 'failed' &&
          now() - Number(response.failedAt || 0) < VIDEO_META_RETRY_DELAY_MS)
      )
        return;
      if (value18 === enabled5) return;
      (handler(),
        (value18 = enabled5),
        (scheduleIdleTask2 = scheduleIdleTask(async () => {
          ((scheduleIdleTask2 = null), (value18 = ''));
          if (enabled4) return;
          const selectionMediaPropertiesModel2 = selectSelectionMediaPropertiesModel(
            graphStore.getStateRaw?.() || graphStore.getState?.(),
          );
          if (
            !enabled3 ||
            selectionMediaPropertiesModel2?.nodeId !== value20.nodeId ||
            selectionMediaPropertiesModel2?.metaSource !== enabled5 ||
            selectionMediaPropertiesModel2?.needsVideoProbe !== true
          )
            return;
          map.set(enabled5, { status: 'pending' });
          try {
            const response2 = await fetchVideoMeta(enabled5);
            if (enabled4) return;
            if (!response2 || response2.success !== true) throw new Error('video metadata unavailable');
            const patch = buildVideoMetaPatch(response2, enabled5);
            map.set(enabled5, {
              status: 'success',
              patch: patch,
              appliedNodeIds: new Set([value20.nodeId]),
            });
            const selectionMediaPropertiesModel3 = selectSelectionMediaPropertiesModel(
              graphStore.getStateRaw?.() || graphStore.getState?.(),
            );
            selectionMediaPropertiesModel3?.nodeId === value20.nodeId &&
              selectionMediaPropertiesModel3?.metaSource === enabled5 &&
              graphStore.updateNodeData?.(value20.nodeId, patch);
          } catch {
            if (enabled4) return;
            map.set(enabled5, { status: 'failed', failedAt: now() });
          }
        })));
    },
    handler3 = () => {
      const selectionPropertiesDisplayModel = selectSelectionPropertiesDisplayModel(
        graphStore.getStateRaw?.() || graphStore.getState?.(),
        documentObject,
      );
      (renderSelectionMediaProperties(
        element,
        enabled3 ? selectionPropertiesDisplayModel || selectionMediaPropertiesModel : null,
      ),
        handler2(enabled3 ? selectionPropertiesDisplayModel || selectionMediaPropertiesModel : null));
    },
    handler4 = () => {
      if (value19 || enabled4) return;
      value19 = true;
      const value21 = () => {
        value19 = false;
        if (!enabled4) handler3();
      };
      typeof queueMicrotask === 'function' ? queueMicrotask(value21) : Promise.resolve().then(value21);
    },
    value22 = (event) => {
      (isSupportedTextEditor(event?.target) || isSupportedTextEditor(event?.relatedTarget)) &&
        handler4();
    },
    value23 = (event2) => {
      if (isSupportedTextEditor(event2?.target)) handler3();
    },
    value24 = graphStore.subscribeSelector(selectSelectionMediaPropertiesModel, (value25) => {
      ((selectionMediaPropertiesModel = value25), handler3());
    }),
    value26 = uiStore.subscribeSelector(
      (value27) => value27.ui?.showSelectionMediaProperties !== false,
      (value28) => {
        ((enabled3 = value28 !== false), handler3());
      },
    ),
    onLocaleChange2 = onLocaleChange(handler3);
  return (
    documentObject?.addEventListener?.('focusin', value22, true),
    documentObject?.addEventListener?.('focusout', value22, true),
    documentObject?.addEventListener?.('input', value23, true),
    () => {
      ((enabled4 = true),
        handler(),
        value24?.(),
        value26?.(),
        onLocaleChange2?.(),
        documentObject?.removeEventListener?.('focusin', value22, true),
        documentObject?.removeEventListener?.('focusout', value22, true),
        documentObject?.removeEventListener?.('input', value23, true));
    }
  );
}
