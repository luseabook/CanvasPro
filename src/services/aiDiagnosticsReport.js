import { getCanvasMediaSchedulerStats } from '../modules/canvasMediaScheduler.js';
import { getPerfProbeSnapshot } from '../modules/perf/perfProbe.js';
const REPORT_SCHEMA_VERSION = 1,
  MAX_DIAGNOSTIC_NODES = 12,
  MAX_LIST_ITEMS = 6,
  MAX_DOM_MEDIA = 8;
function toText(value) {
  return String(value || '').trim();
}
function toNumber(item, key = 0) {
  const index = Number(item);
  return Number.isFinite(index) ? index : key;
}
function normalizeIndex(result, data = Infinity) {
  const options = Math.max(0, Math.trunc(toNumber(result, 0)));
  if (!Number.isFinite(data)) return options;
  return Math.min(Math.max(0, data - 1), options);
}
function hashText(target) {
  const list = toText(target);
  let source = 0x811c9dc5;
  for (let next = 0; next < list.length; next += 1) {
    ((source ^= list.charCodeAt(next)), (source = Math.imul(source, 0x1000193)));
  }
  return (source >>> 0).toString(36);
}
function normalizeComparableRef(current) {
  let toText2 = toText(current).replace(/\\/g, '/');
  if (!toText2) return '';
  try {
    toText2 = decodeURIComponent(toText2);
  } catch {}
  return (
    (toText2 = toText2.split('#')[0].split('?')[0].replace(/\\/g, '/').toLowerCase()),
    (toText2 = toText2.replace(/^https?:\/\/[^/]+\//, '')),
    (toText2 = toText2.replace(/^file:\/\/\/?/, '')),
    (toText2 = toText2.replace(/^\/+/, '')),
    toText2
  );
}
function getRefKind(entry) {
  const toText3 = toText(entry);
  if (!toText3) return 'empty';
  if (/^data:/i.test(toText3)) return 'data';
  if (/^blob:/i.test(toText3)) return 'blob';
  if (/^aic-local-preview:/i.test(toText3)) return 'localPreview';
  if (/^https?:/i.test(toText3)) return 'remote';
  if (/^file:/i.test(toText3)) return 'file';
  return 'local';
}
function getRefExtension(record) {
  const comparableRef = normalizeComparableRef(record),
    payload = comparableRef.match(/\.([a-z0-9]{1,8})$/i);
  return payload ? '.' + payload[1].toLowerCase() : '';
}
function sanitizeMediaRef(handle) {
  const length = toText(handle);
  if (!length) return { present: false };
  const ext = getRefExtension(length);
  return {
    present: true,
    kind: getRefKind(length),
    ext: ext,
    hash: hashText(normalizeComparableRef(length) || length),
    isImage: /\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(ext),
    isVideo: /\.(?:mp4|mov|webm|m4v|avi|mkv)$/i.test(ext),
    length: length.length,
  };
}
function getPrimaryListItem(list2, config = 0) {
  if (!Array.isArray(list2) || list2.length === 0) return null;
  const index2 = normalizeIndex(config, list2.length);
  return list2[index2] || list2[0] || null;
}
function pushCandidate(list3, label, scope) {
  const toText4 = toText(scope);
  if (!toText4) return;
  const comparable = normalizeComparableRef(toText4);
  list3.push({ label: label, comparable: comparable, ref: sanitizeMediaRef(toText4) });
}
function collectVideoPosterCandidates(options2 = {}) {
  const list4 = Array.isArray(options2.videos) ? options2.videos : [],
    index3 = normalizeIndex(options2.mainVideoIndex, list4.length || 1),
    primaryListItem = getPrimaryListItem(list4, index3),
    input = [],
    handler = (enabled, output) => {
      if (!enabled || typeof enabled !== 'object') return;
      (pushCandidate(input, output + '.posterLocalPath', enabled.posterLocalPath),
        pushCandidate(input, output + '.thumbLocalPath', enabled.thumbLocalPath),
        pushCandidate(input, output + '.previewLocalPath', enabled.previewLocalPath),
        pushCandidate(input, output + '.thumbnailLocalPath', enabled.thumbnailLocalPath),
        pushCandidate(input, output + '.posterUrl', enabled.posterUrl),
        pushCandidate(input, output + '.thumbUrl', enabled.thumbUrl),
        pushCandidate(input, output + '.previewUrl', enabled.previewUrl),
        pushCandidate(input, output + '.thumbnailUrl', enabled.thumbnailUrl));
    };
  if (primaryListItem) handler(primaryListItem, 'videos[' + index3 + ']');
  return (
    handler(options2, 'node'),
    list4.slice(0, MAX_LIST_ITEMS).forEach((item2, value2) => {
      if (value2 === index3) return;
      handler(item2, 'videos[' + value2 + ']');
    }),
    input
  );
}
function collectVideoSourceCandidates(options3 = {}) {
  const list5 = Array.isArray(options3.videos) ? options3.videos : [],
    index4 = normalizeIndex(options3.mainVideoIndex, list5.length || 1),
    primaryListItem2 = getPrimaryListItem(list5, index4),
    value3 = [],
    handler2 = (response, value4) => {
      if (!response || typeof response !== 'object') return;
      (pushCandidate(value3, value4 + '.displayLocalPath', response.displayLocalPath),
        pushCandidate(value3, value4 + '.localPath', response.localPath),
        pushCandidate(value3, value4 + '.videoLocalPath', response.videoLocalPath),
        pushCandidate(value3, value4 + '.videoUrl', response.videoUrl),
        pushCandidate(value3, value4 + '.src', response.src),
        pushCandidate(value3, value4 + '.url', response.url),
        pushCandidate(value3, value4 + '.resultUrl', response.resultUrl));
    };
  if (primaryListItem2) handler2(primaryListItem2, 'videos[' + index4 + ']');
  return (
    handler2(options3, 'node'),
    list5.slice(0, MAX_LIST_ITEMS).forEach((item3, value5) => {
      if (value5 === index4) return;
      handler2(item3, 'videos[' + value5 + ']');
    }),
    value3
  );
}
function matchCandidateLabels(value6, value7 = []) {
  const comparableRef2 = normalizeComparableRef(value6);
  if (!comparableRef2) return [];
  const list6 = [];
  for (const value8 of value7) {
    value8.comparable && value8.comparable === comparableRef2 && list6.push(value8.label);
  }
  return list6;
}
function getElementSrc(value9) {
  return toText(
    value9?.currentSrc ||
      value9?.src ||
      value9?.getAttribute?.('src') ||
      value9?.getAttribute?.('poster') ||
      '',
  );
}
function getVideoSrc(el) {
  return toText(
    el?.currentSrc ||
      el?.src ||
      el?.getAttribute?.('src') ||
      el?.querySelector?.('source')?.src ||
      el?.querySelector?.('source')?.getAttribute?.('src') ||
      '',
  );
}
function escapeAttr(value10) {
  return String(value10 || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
function queryNodeDom(el2, enabled2) {
  if (!el2 || !enabled2) return {};
  const escapeAttr2 = escapeAttr(enabled2),
    wrapper =
      el2.getElementById?.(enabled2) ||
      el2.querySelector?.('.v2-node[data-node-id="' + escapeAttr2 + '"]') ||
      null,
    fastPreview = el2.querySelector?.('.v2-fast-preview-node[data-node-id="' + escapeAttr2 + '"]') || null;
  return { wrapper: wrapper, fastPreview: fastPreview };
}
function summarizeImageElement(complete, value11 = []) {
  const elementSrc = getElementSrc(complete);
  return {
    className: toText(complete?.className),
    src: { ...sanitizeMediaRef(elementSrc), matches: matchCandidateLabels(elementSrc, value11) },
    complete: complete?.complete !== false,
    naturalWidth: toNumber(complete?.naturalWidth || complete?.width, 0),
    display: toText(complete?.style?.display),
    visibility: toText(complete?.style?.visibility),
    opacity: toText(complete?.style?.opacity),
  };
}
function summarizeVideoElement(paused, value12 = [], value13 = []) {
  const videoSrc = getVideoSrc(paused),
    toText5 = toText(paused?.poster || paused?.getAttribute?.('poster'));
  return {
    src: { ...sanitizeMediaRef(videoSrc), matches: matchCandidateLabels(videoSrc, value12) },
    poster: { ...sanitizeMediaRef(toText5), matches: matchCandidateLabels(toText5, value13) },
    readyState: toNumber(paused?.readyState, 0),
    preload: toText(paused?.preload || paused?.getAttribute?.('preload')),
    paused: paused?.paused !== false,
    display: toText(paused?.style?.display),
    visibility: toText(paused?.style?.visibility),
    opacity: toText(paused?.style?.opacity),
  };
}
function summarizeNodeData(isGenerating = {}) {
  const videosLength = Array.isArray(isGenerating.videos) ? isGenerating.videos : [],
    imagesLength = Array.isArray(isGenerating.images) ? isGenerating.images : [];
  return {
    id: toText(isGenerating.id),
    type: toText(isGenerating.type),
    selected: false,
    geometry: {
      x: toNumber(isGenerating.x, 0),
      y: toNumber(isGenerating.y, 0),
      width: toNumber(isGenerating.width, 0),
      height: toNumber(isGenerating.height, 0),
    },
    mediaIndexes: {
      mainVideoIndex: normalizeIndex(isGenerating.mainVideoIndex, videosLength.length || 1),
      mainImageIndex: normalizeIndex(isGenerating.mainImageIndex, imagesLength.length || 1),
      videosLength: videosLength.length,
      imagesLength: imagesLength.length,
    },
    taskState: {
      isGenerating: isGenerating.isGenerating === true,
      jobStatus: toText(isGenerating.jobStatus),
      rhTaskStatus: toText(isGenerating.rhTaskStatus),
      dreaminaTaskStatus: toText(isGenerating.dreaminaTaskStatus),
      asyncTaskStatus: toText(isGenerating.asyncTaskStatus),
      mediaUnavailable: isGenerating.mediaUnavailable === true,
    },
  };
}
function summarizeNodeDom(value14, value15) {
  const toText6 = toText(value14?.id),
    { wrapper: wrapper2, fastPreview: fastPreview2 } = queryNodeDom(value15, toText6),
    posterCandidates = collectVideoPosterCandidates(value14),
    videoSourceCandidates = collectVideoSourceCandidates(value14),
    value16 =
      fastPreview2?.querySelector?.('.v2-fast-preview-media') || fastPreview2?.querySelector?.('img') || null,
    elementSrc2 = getElementSrc(value16),
    value17 =
      wrapper2?.querySelector?.('.source-video-poster-frame') ||
      wrapper2?.querySelector?.('.ai-video-deferred-poster') ||
      null,
    elementSrc3 = getElementSrc(value17),
    imageElements = Array.from(wrapper2?.querySelectorAll?.('img') || [])
      .slice(0, MAX_DOM_MEDIA)
      .map((item4) => summarizeImageElement(item4, posterCandidates)),
    videoElements = Array.from(wrapper2?.querySelectorAll?.('video') || [])
      .slice(0, MAX_DOM_MEDIA)
      .map((item5) => summarizeVideoElement(item5, videoSourceCandidates, posterCandidates));
  return {
    mounted: !!wrapper2,
    hasFastPreview: !!fastPreview2,
    detailStage: toText(wrapper2?.dataset?.detailStage),
    mediaLod: toText(wrapper2?.dataset?.mediaLod),
    className: toText(wrapper2?.className).slice(0, 240),
    actual: {
      fastPreviewSrc: {
        ...sanitizeMediaRef(elementSrc2),
        matches: matchCandidateLabels(elementSrc2, posterCandidates),
      },
      posterFrameSrc: {
        ...sanitizeMediaRef(elementSrc3),
        matches: matchCandidateLabels(elementSrc3, posterCandidates),
      },
      imageElements: imageElements,
      videoElements: videoElements,
    },
    expected: {
      posterCandidates: posterCandidates
        .slice(0, MAX_LIST_ITEMS)
        .map((label2) => ({ label: label2.label, ref: label2.ref })),
      videoSourceCandidates: videoSourceCandidates
        .slice(0, MAX_LIST_ITEMS)
        .map((label3) => ({ label: label3.label, ref: label3.ref })),
    },
  };
}
function getProblemLayer(value18) {
  const list7 = value18?.type || '';
  if (!list7.includes('video')) return null;
  const mainVideoIndex = value18.mediaIndexes?.mainVideoIndex ?? 0,
    value19 = 'videos[' + mainVideoIndex + ']',
    actualFastPreviewMatches = value18.dom?.actual?.fastPreviewSrc?.matches || [],
    actualPosterMatches = value18.dom?.actual?.posterFrameSrc?.matches || [],
    unexpectedMatch = (list8) =>
      list8.find((enabled3) => /^videos\[\d+\]\./.test(enabled3) && !enabled3.startsWith(value19));
  if (
    actualFastPreviewMatches.length > 0 &&
    !actualFastPreviewMatches.some((item6) => item6.startsWith(value19))
  )
    return {
      code: 'fast_preview_poster_mismatch',
      severity: 'warn',
      message: 'Fast preview poster does not match videos[mainVideoIndex].',
      likelyLayer: 'fastPreviewLayer',
      evidence: {
        mainVideoIndex: mainVideoIndex,
        actualFastPreviewMatches: actualFastPreviewMatches,
        unexpectedMatch: unexpectedMatch(actualFastPreviewMatches) || '',
      },
    };
  if (actualPosterMatches.length > 0 && !actualPosterMatches.some((item7) => item7.startsWith(value19)))
    return {
      code: 'poster_frame_mismatch',
      severity: 'warn',
      message: 'Poster frame does not match videos[mainVideoIndex].',
      likelyLayer: 'nodePosterResolver',
      evidence: {
        mainVideoIndex: mainVideoIndex,
        actualPosterMatches: actualPosterMatches,
        unexpectedMatch: unexpectedMatch(actualPosterMatches) || '',
      },
    };
  return null;
}
function getDocumentBodyClasses(dom) {
  const toText7 = toText(dom?.body?.className);
  if (toText7) return toText7.split(/\s+/).filter(Boolean).slice(0, 20);
  const enabled4 = dom?.body?.classList;
  if (!enabled4 || typeof enabled4[Symbol.iterator] !== 'function') return [];
  return Array.from(enabled4).slice(0, 20);
}
function collectCandidateNodeIds(options4 = {}, el3) {
  const list9 = Array.isArray(options4.selectedNodeIds) ? options4.selectedNodeIds : [],
    list10 = [],
    handler3 = (value20) => {
      const toText8 = toText(value20);
      if (toText8 && !list10.includes(toText8)) list10.push(toText8);
    };
  list9.forEach(handler3);
  for (const el4 of el3?.querySelectorAll?.('#v2-canvas .v2-node, #v2-canvas .v2-fast-preview-node') || []) {
    handler3(el4?.id || el4?.dataset?.nodeId);
    if (list10.length >= MAX_DIAGNOSTIC_NODES) break;
  }
  for (const value21 of Object.values(options4.nodes || {})) {
    const list11 = toText(value21?.type).toLowerCase();
    if (list11.includes('video') || list11.includes('image')) handler3(value21?.id);
    if (list10.length >= MAX_DIAGNOSTIC_NODES) break;
  }
  return list10.slice(0, MAX_DIAGNOSTIC_NODES);
}
function buildAiAnalysis(list12 = []) {
  const summary = [];
  for (const nodeId of list12) {
    const args = getProblemLayer(nodeId);
    args && summary.push({ nodeId: nodeId.id, nodeType: nodeId.type, ...args });
  }
  return {
    summary:
      summary.length > 0
        ? 'Potential media resolution issues were detected. See findings for the likely layer.'
        : 'No obvious media preview mismatch was detected in the captured node set.',
    findings: summary,
    nextChecks:
      summary.length > 0
        ? [
            'Compare actualFastPreviewMatches with videos[mainVideoIndex].',
            'Check whether top-level node poster fields are stale mirrors of another result.',
          ]
        : [
            'If the user still sees a mismatch, ask them to select the problematic node and generate a new diagnostics package.',
          ],
  };
}
export function createAiDiagnosticsReport({
  graphStore: graphStore = null,
  state: state = null,
  documentRef: documentRef = typeof document !== 'undefined' ? document : null,
  reason: reason = 'settings_diagnostics_package',
} = {}) {
  const value22 = state || graphStore?.getStateRaw?.() || graphStore?.getState?.() || {},
    value23 = value22.nodes || {},
    list13 = collectCandidateNodeIds(value22, documentRef),
    map = new Set(Array.isArray(value22.selectedNodeIds) ? value22.selectedNodeIds.map(String) : []),
    nodes = list13
      .map((item8) => value23[item8])
      .filter(Boolean)
      .map((item9) => {
        const summarizeNodeData2 = summarizeNodeData(item9);
        return (
          (summarizeNodeData2.selected = map.has(summarizeNodeData2.id)),
          (summarizeNodeData2.dom = summarizeNodeDom(item9, documentRef)),
          summarizeNodeData2
        );
      }),
    args2 = {
      schemaVersion: REPORT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      reason: toText(reason) || 'settings_diagnostics_package',
      privacy:
        'No project JSON, asset files, prompts, API keys, or raw media paths are included. Media references are represented by kind/ext/hash only.',
      canvas: {
        nodeCount: Object.keys(value23).length,
        edgeCount: Object.keys(value22.edges || {}).length,
        selectedNodeIds: Array.from(map).slice(0, MAX_DIAGNOSTIC_NODES),
        viewport: {
          x: toNumber(value22.viewport?.x, 0),
          y: toNumber(value22.viewport?.y, 0),
          zoom: toNumber(value22.viewport?.zoom, 1),
        },
        bodyClasses: getDocumentBodyClasses(documentRef),
        mountedNodeCount: documentRef?.querySelectorAll?.('#v2-canvas .v2-node')?.length || 0,
        fastPreviewCount: documentRef?.querySelectorAll?.('#v2-canvas .v2-fast-preview-node')?.length || 0,
        videoElementCount: documentRef?.querySelectorAll?.('#v2-canvas video')?.length || 0,
      },
      mediaScheduler: getCanvasMediaSchedulerStats(),
      performance: getPerfProbeSnapshot(),
      nodes: nodes,
    };
  return { ...args2, aiAnalysis: buildAiAnalysis(nodes) };
}
