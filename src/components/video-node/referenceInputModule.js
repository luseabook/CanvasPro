import { createReferenceFallbackThumbHtml } from '../../modules/referenceThumbnailFallback.js';
import {
  createReferenceMaskBadgeHtml,
  getReferenceMaskSignaturePart,
} from '../../modules/refThumbMaskBadge.js';
import { bindRefThumbFixedSlotDrag, bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import {
  getAssetInputRefsFromPrompt,
  getAssetInputRefsFromPromptAndNode,
} from '../../modules/nodePromptShared.js';
import { getGenerationRatioSizeWithDom } from '../../modules/generationRatioSource.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolveCanvasImageLowZoomUrl } from '../../services/canvasMediaLocalService.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { t } from '../../i18n/index.js';
const RH_V54_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 832;
function referenceInputText(value, item = {}) {
  return t('videoNode.referenceInput.' + value, item);
}
function normalizeRhV54Fps(index) {
  const result = Number(index);
  return RH_V54_FPS_OPTIONS.includes(result) ? result : 24;
}
function normalizeRhVideoResolution(data) {
  const options = Number(data);
  return Number.isFinite(options)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(options))
    : RH_MIN_VIDEO_RESOLUTION;
}
function normalizeVideoMediaKey(target) {
  return String(target || '')
    .trim()
    .replace(/^\/+/, '');
}
function normalizeRefSignaturePart(source) {
  return String(source || '').trim();
}
function getFixedRefBarLayoutKey(enabled) {
  if (!enabled) return 'generic';
  return 'fixed';
}
function getVideoItemMediaKey(next) {
  return (
    normalizeVideoMediaKey(next?.localPath) ||
    normalizeVideoMediaKey(next?.displayLocalPath) ||
    normalizeVideoMediaKey(next?.originalLocalPath) ||
    normalizeVideoMediaKey(next?.videoLocalPath) ||
    normalizeVideoMediaKey(next?.videoUrl)
  );
}
function getVideoItemByEdge(current, entry) {
  const item2 = Array.isArray(current?.videos) ? current.videos : [];
  if (!item2.length) return { item: null, index: -1, matchedByKey: false };
  const videoMediaKey = normalizeVideoMediaKey(entry?.sourceMediaKey);
  let index2 = -1;
  videoMediaKey && (index2 = item2.findIndex((item3) => getVideoItemMediaKey(item3) === videoMediaKey));
  const matchedByKey = index2 >= 0;
  if (index2 < 0) {
    const record = Number(current?.mainVideoIndex),
      payload = Number.isFinite(record) ? Math.max(0, Math.trunc(record)) : 0;
    index2 = Math.max(0, Math.min(item2.length - 1, payload));
  }
  return { item: item2[index2] || null, index: index2, matchedByKey: matchedByKey };
}
function getVideoThumbCandidate(handle, state) {
  const selected = getVideoItemByEdge(handle, state),
    thumbUrl = String(selected.item?.thumbUrl || '').trim();
  if (thumbUrl) return { thumbUrl: thumbUrl, selected: selected };
  const item4 = Array.isArray(handle?.videos) ? handle.videos : [],
    config = Number(handle?.mainVideoIndex),
    scope = Number.isFinite(config) ? Math.max(0, Math.trunc(config)) : 0,
    index3 = Math.max(0, Math.min(item4.length - 1, scope)),
    thumbUrl2 = String(item4[index3]?.thumbUrl || '').trim();
  if (thumbUrl2 && !selected.matchedByKey)
    return {
      thumbUrl: thumbUrl2,
      selected: { item: item4[index3] || null, index: index3, matchedByKey: false },
    };
  const thumbUrl3 = String(handle?.thumbUrl || '').trim();
  if (thumbUrl3 && (!selected.matchedByKey || selected.index === index3))
    return { thumbUrl: thumbUrl3, selected: selected };
  return { thumbUrl: '', selected: selected };
}
function getVideoSourcePathForThumb(input, output) {
  if (String(input?.type || '') === 'ai-video') {
    const { item: item5 } = getVideoItemByEdge(input, output),
      value2 = String(item5?.localPath || '').trim();
    if (value2) return localPathToUrl(value2);
    const value3 = String(item5?.displayLocalPath || '').trim();
    if (value3) return localPathToUrl(value3);
    const value4 = String(item5?.originalLocalPath || '').trim();
    if (value4) return localPathToUrl(value4);
    const value5 = String(item5?.videoLocalPath || '').trim();
    if (value5) return localPathToUrl(value5);
    const value6 = String(item5?.videoUrl || '').trim(),
      url = localPathToUrl(value6);
    if (url) return url;
    return '';
  }
  const value7 = String(input?.localPath || '').trim();
  if (value7) return localPathToUrl(value7);
  const value8 = String(input?.displayLocalPath || '').trim();
  if (value8) return localPathToUrl(value8);
  const value9 = String(input?.originalLocalPath || '').trim();
  if (value9) return localPathToUrl(value9);
  const value10 = String(input?.videoLocalPath || '').trim();
  if (value10) return localPathToUrl(value10);
  const value11 = String(input?.videoUrl || input?.src || '').trim(),
    url2 = localPathToUrl(value11);
  if (url2) return url2;
  return '';
}
function getVideoRefMediaSignature(value12, value13) {
  const videoItemByEdge = getVideoItemByEdge(value12, value13);
  return (
    getVideoItemMediaKey(videoItemByEdge.item) ||
    normalizeVideoMediaKey(value12?.localPath) ||
    normalizeVideoMediaKey(value12?.displayLocalPath) ||
    normalizeVideoMediaKey(value12?.originalLocalPath) ||
    normalizeVideoMediaKey(value12?.videoLocalPath) ||
    normalizeVideoMediaKey(value12?.videoUrl) ||
    normalizeVideoMediaKey(value12?.src)
  );
}
function pickPositiveNumber(...args) {
  for (const value14 of args) {
    const count = Number(value14);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
function getSourceVideoFrameCount(value15, value16) {
  const videoItemByEdge2 = getVideoItemByEdge(value15, value16).item,
    positiveNumber = pickPositiveNumber(
      videoItemByEdge2?.videoFrameCount,
      videoItemByEdge2?.frameCount,
      value15?.videoFrameCount,
      value15?.frameCount,
    );
  return positiveNumber > 0 ? Math.round(positiveNumber) : 0;
}
function getSourceVideoDuration(value17, value18) {
  const videoItemByEdge3 = getVideoItemByEdge(value17, value18).item;
  return pickPositiveNumber(
    videoItemByEdge3?.videoDuration,
    videoItemByEdge3?.duration,
    value17?.videoDuration,
    value17?.duration,
  );
}
function getRhV5SourceVideoNode({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
}) {
  const list = Array.isArray(inEdges) ? inEdges : [];
  let edge = list.find((item6) => String(item6?.refSlot || '') === 'sourceVideo') || null;
  !edge &&
    (edge = list.find((item7) => String(nodes?.[item7?.sourceId]?.type || '').includes('video')) || null);
  if (edge && nodes?.[edge.sourceId]) return { node: nodes[edge.sourceId], edge: edge };
  const node = getAssetInputRefsFromPromptAndNode(promptEl, {
    nodeData: nodeData,
    allowedTypes: ['video'],
  })[0];
  return node?.nodeData ? { node: node.nodeData, edge: null } : { node: null, edge: null };
}
function getRhV5SourceVideoFrameCount({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
  targetFps: targetFps = 0,
} = {}) {
  const { node: node2, edge: edge2 } = getRhV5SourceVideoNode({
    inEdges: inEdges,
    nodes: nodes,
    promptEl: promptEl,
    nodeData: nodeData,
  });
  if (!node2) return null;
  const sourceVideoFrameCount = getSourceVideoFrameCount(node2, edge2);
  if (sourceVideoFrameCount > 0) return sourceVideoFrameCount;
  const count2 = Number(targetFps);
  if (!Number.isFinite(count2) || count2 <= 0) return null;
  let sourceVideoDuration = getSourceVideoDuration(node2, edge2);
  if (!(sourceVideoDuration > 0)) {
    const videoItemByEdge4 = getVideoItemByEdge(node2, edge2).item,
      positiveNumber2 = pickPositiveNumber(
        videoItemByEdge4?.videoFrameCount,
        videoItemByEdge4?.frameCount,
        node2?.videoFrameCount,
        node2?.frameCount,
      ),
      positiveNumber3 = pickPositiveNumber(
        videoItemByEdge4?.videoFps,
        videoItemByEdge4?.fps,
        node2?.videoFps,
        node2?.fps,
      );
    if (positiveNumber2 > 0 && positiveNumber3 > 0) sourceVideoDuration = positiveNumber2 / positiveNumber3;
  }
  return sourceVideoDuration > 0 ? Math.round(sourceVideoDuration * count2) : null;
}
function createRunningHubAudioFallbackThumbHtml() {
  return createReferenceFallbackThumbHtml('audio', 'ref-thumb-media rh-v5-ref-media-fallback');
}
const FIXED_REF_KIND_LABEL_KEYS = Object.freeze({
    text: 'kind.text',
    image: 'kind.image',
    video: 'kind.video',
    audio: 'kind.audio',
  }),
  FIXED_REF_SLOT_FALLBACK_LABEL_KEYS = Object.freeze({
    sourceVideo: 'slots.sourceVideo',
    refImage: 'slots.refImage',
    firstFrame: 'slots.firstFrame',
    videoMask: 'slots.videoMask',
    maskImage: 'slots.maskImage',
    audio: 'slots.audio',
  });
function escapeHtmlText(value19) {
  return String(value19 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeHtmlAttr(value20) {
  return escapeHtmlText(value20).replace(/"/g, '&quot;');
}
function getFixedRefKindLabel(value21) {
  const value22 = FIXED_REF_KIND_LABEL_KEYS[String(value21 || '')];
  return value22 ? referenceInputText(value22) : '';
}
function getFixedRefSlotFallbackLabel(value23) {
  const value24 = FIXED_REF_SLOT_FALLBACK_LABEL_KEYS[String(value23 || '')];
  return value24 ? referenceInputText(value24) : '';
}
function createRefThumbDeleteButtonHtml() {
  return (
    '<button type="button" class="ref-thumb-delete" title="' +
    escapeHtmlAttr(referenceInputText('removeReference')) +
    '">&times;</button>'
  );
}
function getFixedSlotLabelHtml(value25, value26) {
  const value27 = String(value26 || '').trim(),
    value28 = value25?.slotById?.[value27] || null,
    value29 =
      String(value28?.label || '').trim() ||
      getFixedRefSlotFallbackLabel(value27) ||
      getFixedRefKindLabel(value25?.slotKindById?.[value27]) ||
      value27;
  return escapeHtmlText(value29);
}
function getFixedSlotAcceptMap(value30) {
  const value31 = {};
  return (
    (value30?.visibleSlots || []).forEach((item8) => {
      const value32 = String(value30?.slotKindById?.[item8] || '').trim();
      if (item8 && value32) value31[item8] = value32;
    }),
    value31
  );
}
function normalizeDisplayRatioSource(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array.isArray(enabled2)) return null;
  const slot2 = Array.from(
      new Set(
        [
          String(enabled2.slot || enabled2.refSlot || '').trim(),
          ...(Array.isArray(enabled2.slots) ? enabled2.slots : []),
        ]
          .map((item9) => String(item9 || '').trim())
          .filter(Boolean),
      ),
    ),
    kind = String(enabled2.kind || '').trim(),
    count3 = Number(enabled2.fallbackIndex ?? enabled2.inputIndex ?? enabled2.index),
    fallbackIndex = Number.isFinite(count3) && count3 >= 0 ? Math.trunc(count3) : null;
  if (slot2.length === 0 && fallbackIndex === null) return null;
  return {
    ...(slot2.length ? { slot: slot2[0], slots: slot2 } : {}),
    ...(kind ? { kind: kind } : {}),
    ...(fallbackIndex !== null ? { fallbackIndex: fallbackIndex } : {}),
  };
}
function resolveConfiguredDisplayRatioSlot(value33, enabled3 = {}) {
  const displayRatioSource = normalizeDisplayRatioSource(
    value33?.manifest?.inputSlots?.displayAspectRatioSource,
  );
  if (!displayRatioSource) return null;
  const value34 = Array.isArray(displayRatioSource.slots)
    ? displayRatioSource.slots
    : displayRatioSource.slot
      ? [displayRatioSource.slot]
      : [];
  for (const slot3 of value34) {
    if (!enabled3?.[slot3]) continue;
    if (displayRatioSource.kind && String(value33?.slotKindById?.[slot3] || '') !== displayRatioSource.kind)
      continue;
    return { slot: slot3, mode: 'configured' };
  }
  const list2 = Array.isArray(value33?.visibleSlots) ? value33.visibleSlots : [],
    slot4 = list2.filter((item10) => {
      const enabled4 = enabled3?.[item10];
      if (!enabled4) return false;
      if (!displayRatioSource.kind) return true;
      return String(value33?.slotKindById?.[item10] || '') === displayRatioSource.kind;
    }),
    count4 = displayRatioSource.fallbackIndex;
  if (Number.isInteger(count4) && count4 >= 0 && count4 < slot4.length)
    return { slot: slot4[count4], mode: 'configured' };
  return null;
}
function resolveLegacySingleReferenceVideoSlot(value35, enabled5 = {}) {
  const list3 = value35?.visibleSlots || [],
    enabled6 =
      list3.length === 2 &&
      list3[0] === 'sourceVideo' &&
      list3[1] === 'refImage' &&
      (value35?.fixedSlots || []).length === 2;
  if (!enabled6 || !enabled5?.sourceVideo) return null;
  return { slot: 'sourceVideo', mode: 'sourceVideoFrames' };
}
function resolveFixedInputDisplayRatioSlot(value36, value37 = {}) {
  return (
    resolveConfiguredDisplayRatioSlot(value36, value37) ||
    resolveLegacySingleReferenceVideoSlot(value36, value37)
  );
}
function getFixedInputRatioMediaSize(nodeId, value38 = {}) {
  if (!nodeId) return null;
  const value39 = String(nodeId.kind || nodeId.refType || '').trim(),
    nodeData2 = nodeId.node || nodeId.ref?.nodeData || value38?.[nodeId.sourceId];
  if (!nodeData2) return null;
  const mediaSelector = value39 === 'video' ? 'video' : value39 === 'image' ? 'img' : 'img, video';
  return getGenerationRatioSizeWithDom({
    nodeId: nodeId.sourceId,
    nodeData: nodeData2,
    edge: nodeId.edge || null,
    mediaSelector: mediaSelector,
    includeNodeFrame: true,
  });
}
function calcFixedInputDisplaySize(value40, value41, value42 = 300) {
  const count5 = Number(value40),
    count6 = Number(value41);
  if (!(Number.isFinite(count5) && count5 > 0)) return null;
  if (!(Number.isFinite(count6) && count6 > 0)) return null;
  const height = Math.max(1, Math.round(Number(value42) || 300));
  if (count5 >= count6) return { width: Math.round((count5 / count6) * height), height: height };
  return { width: height, height: Math.round((count6 / count5) * height) };
}
export const __videoReferenceInputTest = {
  getVideoThumbCandidate: getVideoThumbCandidate,
  getVideoSourcePathForThumb: getVideoSourcePathForThumb,
  getVideoRefMediaSignature: getVideoRefMediaSignature,
  getRhV5SourceVideoFrameCount: getRhV5SourceVideoFrameCount,
  createRunningHubAudioFallbackThumbHtml: createRunningHubAudioFallbackThumbHtml,
  calcFixedInputDisplaySize: calcFixedInputDisplaySize,
};
export function createVideoNodeReferenceInputModule(value43) {
  const {
    store: store,
    api: api,
    _syncPillLabels: _syncPillLabels,
    getImage: getImage,
    ensureThumbDecoded: ensureThumbDecoded,
    revealRefThumbMedia: revealRefThumbMedia,
  } = value43;
  class value44 {
    ['_getRefSourceStateKey'](response) {
      const list4 = String(response?.type || ''),
        referenceMaskSignaturePart = getReferenceMaskSignaturePart(response),
        refSignaturePart = normalizeRefSignaturePart(
          response?.outputText || response?.text || response?.content || '',
        );
      if (list4.includes('text')) return 't:' + refSignaturePart;
      if (list4.includes('video')) {
        const value45 = (Array.isArray(response?.videos) ? response.videos : [])
          .map((item11) =>
            [
              normalizeVideoMediaKey(item11?.localPath),
              normalizeVideoMediaKey(item11?.displayLocalPath),
              normalizeVideoMediaKey(item11?.originalLocalPath),
              normalizeVideoMediaKey(item11?.videoLocalPath),
              normalizeVideoMediaKey(item11?.videoUrl),
              normalizeVideoMediaKey(item11?.thumbId),
              normalizeVideoMediaKey(item11?.thumbUrl),
              Number(item11?.videoFrameCount || item11?.frameCount || 0) || 0,
              Number(item11?.videoDuration || item11?.duration || 0) || 0,
              Number(item11?.videoFps || item11?.fps || 0) || 0,
            ].join(','),
          )
          .join(';');
        return [
          'v',
          Number.isFinite(Number(response?.mainVideoIndex))
            ? Math.max(0, Math.trunc(Number(response.mainVideoIndex)))
            : 0,
          normalizeVideoMediaKey(response?.thumbId),
          normalizeVideoMediaKey(response?.thumbUrl),
          normalizeVideoMediaKey(response?.localPath),
          normalizeVideoMediaKey(response?.displayLocalPath),
          normalizeVideoMediaKey(response?.originalLocalPath),
          normalizeVideoMediaKey(response?.videoLocalPath),
          normalizeVideoMediaKey(response?.videoUrl),
          normalizeVideoMediaKey(response?.src),
          normalizeVideoMediaKey(response?.url),
          normalizeVideoMediaKey(response?.resultUrl),
          normalizeVideoMediaKey(response?.sourceUrl),
          Number(response?.videoFrameCount || 0) || 0,
          Number(response?.videoDuration || 0) || 0,
          Number(response?.videoFps || 0) || 0,
          value45,
        ].join(':');
      }
      if (list4.includes('audio'))
        return [
          'a',
          normalizeRefSignaturePart(response?.audioUrl),
          normalizeRefSignaturePart(response?.src),
          normalizeRefSignaturePart(response?.localPath),
        ].join(':');
      return [
        'i',
        normalizeRefSignaturePart(response?.thumbId),
        normalizeRefSignaturePart(response?.thumbUrl),
        normalizeRefSignaturePart(response?.imageUrl),
        normalizeRefSignaturePart(response?.src),
        normalizeRefSignaturePart(response?.localPath),
        referenceMaskSignaturePart,
      ].join(':');
    }
    ['_getRhV5SourceVideoFrameCount'](targetFps2) {
      const inEdges2 = store.getIncomingEdges(this.nodeId) || [],
        value46 = store.getState() || {},
        nodes2 = value46.nodes || {};
      return getRhV5SourceVideoFrameCount({
        inEdges: inEdges2,
        nodes: nodes2,
        promptEl: this.promptEl,
        nodeData: nodes2?.[this.nodeId] || this._data || null,
        targetFps: targetFps2,
      });
    }
    ['_createAssetRefThumbData'](node3, { slot: slot = '', key: key = '' } = {}) {
      const kind2 = String(node3?.type || '').trim();
      if (!kind2) return null;
      let html = '',
        value47 = '';
      if (kind2 === 'image') {
        const enabled7 = this._resolveMediaUrl(node3.thumbUrl || node3.url || '');
        if (!enabled7) return null;
        (ensureThumbDecoded(enabled7),
          (html = '<img src="' + enabled7 + '" class="ref-thumb-media is-pending" draggable="false">'),
          (value47 = 'asset-i|' + enabled7));
      } else {
        if (kind2 === 'video') {
          const value48 = this._resolveMediaUrl(node3.thumbUrl || '');
          value48
            ? (ensureThumbDecoded(value48),
              (html = '<img src="' + value48 + '" class="ref-thumb-media is-pending" draggable="false">'),
              (value47 = 'asset-v|' + value48))
            : ((html = createReferenceFallbackThumbHtml('video')), (value47 = 'asset-v|fallback'));
        } else {
          if (kind2 === 'audio')
            ((html = createReferenceFallbackThumbHtml('audio')), (value47 = 'asset-a|fallback'));
          else {
            if (kind2 === 'text')
              ((html = createReferenceFallbackThumbHtml('text')),
                (value47 = 'asset-t|' + String(node3.content || node3.label || '').trim()));
            else return null;
          }
        }
      }
      const assetId = String(node3.assetId || ''),
        assetIndex = String(node3.itemIndex ?? ''),
        assetOccurrence = String(node3.assetMentionOccurrence ?? ''),
        assetRefSource = String(node3.assetRefSource || 'prompt'),
        sourceId = 'asset:' + assetId + ':' + assetIndex;
      return {
        key:
          key ||
          'asset:' + assetRefSource + ':' + assetId + ':' + assetIndex + ':' + kind2 + ':' + assetOccurrence,
        edgeId: '',
        kind: kind2,
        sourceId: sourceId,
        assetId: assetId,
        assetIndex: assetIndex,
        assetOccurrence: assetOccurrence,
        assetRefSource: assetRefSource,
        refType: kind2,
        node: node3.nodeData || null,
        ref: node3,
        html: html,
        thumbHTML: html,
        sig:
          '' +
          (slot ? slot + '|' : '') +
          sourceId +
          '|' +
          kind2 +
          '|' +
          String(node3.url || '') +
          '|' +
          value47,
        virtual: true,
      };
    }
    ['_createTextEdgeRefThumbData'](edgeId, response2) {
      const enabled8 = String(
        response2?.outputText || response2?.text || response2?.content || response2?.prompt || '',
      ).trim();
      if (!enabled8) return null;
      return {
        key: 'edge:' + edgeId.id,
        edgeId: edgeId.id,
        kind: 'text',
        sourceId: edgeId.sourceId,
        html: createReferenceFallbackThumbHtml('text'),
        sig: 'text|' + edgeId.id + '|' + edgeId.sourceId + '|' + enabled8,
      };
    }
    ['_syncFixedTrailingRefItems'](el, value49 = []) {
      if (!el) return;
      const map = new Map();
      el.querySelectorAll('.rh-fixed-extra-ref').forEach((el2) => map.set(el2.dataset.refKey, el2));
      const map2 = new Set();
      (Array.isArray(value49) ? value49 : []).forEach((event) => {
        if (!event?.key) return;
        let el3 = map.get(event.key);
        (!el3 &&
          ((el3 = document.createElement('div')),
          (el3.className =
            'ref-thumb-wrap rh-v5-ref-box rh-fixed-extra-ref' +
            (event.virtual ? ' ref-thumb-wrap--asset' : ''))),
          el3.setAttribute('draggable', event.virtual || !event.edgeId ? 'false' : 'true'),
          el3.dataset.sig !== event.sig &&
            ((el3.innerHTML = '' + event.html + createRefThumbDeleteButtonHtml()),
            (el3.dataset.sig = event.sig),
            revealRefThumbMedia(el3, event.sig)),
          (el3.dataset.refKey = event.key),
          (el3.dataset.edgeId = event.edgeId || ''),
          (el3.dataset.kind = event.kind || ''),
          (el3.dataset.sourceId = event.sourceId || ''),
          (el3.dataset.refOrigin = event.virtual ? 'asset' : 'node'),
          event.virtual
            ? ((el3.dataset.assetId = event.assetId || ''),
              (el3.dataset.assetIndex = event.assetIndex || ''),
              (el3.dataset.assetOccurrence = event.assetOccurrence || ''),
              (el3.dataset.assetRefSource = event.assetRefSource || 'prompt'),
              (el3.dataset.refType = event.refType || event.kind || ''))
            : (delete el3.dataset.assetId,
              delete el3.dataset.assetIndex,
              delete el3.dataset.assetOccurrence,
              delete el3.dataset.assetRefSource,
              delete el3.dataset.refType),
          el.appendChild(el3),
          map2.add(event.key));
      });
      for (const [value50, el4] of map.entries()) {
        if (!map2.has(value50)) el4.remove();
      }
    }
    ['_getFixedSlotRefThumbObjectUrlMap']() {
      return (
        !this._fixedSlotRefThumbObjectUrls && (this._fixedSlotRefThumbObjectUrls = new Map()),
        this._fixedSlotRefThumbObjectUrls
      );
    }
    ['_clearObjectUrlMap'](map3) {
      if (!map3 || map3.size === 0) return;
      for (const value51 of map3.values()) {
        value51 && String(value51).startsWith('blob:') && URL.revokeObjectURL(value51);
      }
      map3.clear();
    }
    ['_pruneFixedSlotRefThumbObjectUrls'](list5 = [], value52 = {}) {
      const map4 = this._getFixedSlotRefThumbObjectUrlMap(),
        map5 = new Set();
      for (const value53 of list5 || []) {
        const value54 = value52?.[value53?.sourceId];
        if (value54?.thumbId) map5.add(value54.thumbId);
      }
      for (const [value55, value56] of map4.entries()) {
        if (map5.has(value55)) continue;
        (value56 && String(value56).startsWith('blob:') && URL.revokeObjectURL(value56),
          map4.delete(value55));
      }
    }
    ['_resolveFixedMediaUrl'](value57) {
      const enabled9 = String(value57 || '').trim();
      if (!enabled9) return '';
      if (typeof this._resolveMediaUrl === 'function') return this._resolveMediaUrl(enabled9);
      return enabled9;
    }
    async ['_resolveFixedThumbObjectUrl'](value58) {
      const enabled10 = String(value58 || '').trim();
      if (!enabled10) return '';
      const map6 = this._getFixedSlotRefThumbObjectUrlMap();
      if (map6.has(enabled10)) return map6.get(enabled10);
      const enabled11 = await getImage(enabled10);
      if (!enabled11) return '';
      const value59 = URL.createObjectURL(enabled11);
      return (map6.set(enabled10, value59), value59);
    }
    async ['_createFixedEdgeRefThumbData'](edgeId2, node4, value60, value61) {
      const kind3 = String(value60 || '').trim();
      if (!edgeId2 || !node4 || !kind3) return null;
      if (kind3 === 'text') return this._createTextEdgeRefThumbData(edgeId2, node4);
      let html2 = '',
        value62 = '';
      if (kind3 === 'image') {
        let enabled12 = await this._resolveFixedThumbObjectUrl(node4.thumbId);
        !enabled12 && (enabled12 = this._resolveFixedMediaUrl(resolveCanvasImageLowZoomUrl(node4)));
        !enabled12 &&
          node4.localPath &&
          (enabled12 = this._resolveFixedMediaUrl(localPathToUrl(node4.localPath)));
        if (!enabled12) return null;
        (ensureThumbDecoded(enabled12),
          (html2 =
            '<img src="' +
            enabled12 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            createReferenceMaskBadgeHtml(node4)),
          (value62 = 'i|' + enabled12 + '|' + getReferenceMaskSignaturePart(node4)));
      } else {
        if (kind3 === 'video') {
          const videoRefMediaSignature = getVideoRefMediaSignature(node4, edgeId2);
          let enabled13 = await this._resolveFixedThumbObjectUrl(node4.thumbId);
          if (!enabled13) {
            const videoThumbCandidate = getVideoThumbCandidate(node4, edgeId2);
            enabled13 = this._resolveFixedMediaUrl(videoThumbCandidate.thumbUrl || node4.imageUrl || '');
          }
          enabled13
            ? (ensureThumbDecoded(enabled13),
              (html2 = '<img src="' + enabled13 + '" class="ref-thumb-media is-pending" draggable="false">'),
              (value62 = 'v|' + (videoRefMediaSignature || enabled13)))
            : (value61?.(edgeId2, node4),
              (html2 = createReferenceFallbackThumbHtml('video', 'ref-thumb-media rh-v5-ref-media-fallback')),
              (value62 = 'v|' + (videoRefMediaSignature || 'fallback')));
        } else {
          if (kind3 === 'audio') {
            const enabled14 = String(node4.localPath || node4.src || node4.audioUrl || '');
            if (!enabled14) return null;
            ((html2 = createRunningHubAudioFallbackThumbHtml()), (value62 = 'a|' + enabled14));
          } else return null;
        }
      }
      return {
        key: 'edge:' + edgeId2.id,
        edgeId: edgeId2.id,
        kind: kind3,
        sourceId: edgeId2.sourceId,
        node: node4,
        edge: edgeId2,
        html: html2,
        thumbHTML: html2,
        sig: edgeId2.id + '|' + edgeId2.sourceId + '|' + value62,
      };
    }
    ['_syncFixedSlotEl'](el5, enabled15, event2, value63) {
      if (!el5 || !enabled15) return;
      const value64 = String(value63?.slotKindById?.[enabled15] || '').trim(),
        el6 = el5.querySelector('[data-slot="' + enabled15 + '"]');
      if (!event2) {
        let el7 = el6 && el6.classList?.contains('ref-upload-slot') ? el6 : document.createElement('button');
        ((el7.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
          (el7.type = 'button'),
          el7.setAttribute('draggable', 'false'),
          el7.setAttribute('title', referenceInputText('uploadReference')),
          (el7.dataset.slot = enabled15),
          (el7.dataset.kind = value64),
          (el7.dataset.edgeId = ''),
          (el7.dataset.sourceId = ''),
          (el7.dataset.refOrigin = ''),
          delete el7.dataset.refKey,
          delete el7.dataset.assetId,
          delete el7.dataset.assetIndex,
          delete el7.dataset.assetOccurrence,
          delete el7.dataset.assetRefSource,
          delete el7.dataset.refType);
        const fixedSlotLabelHtml = getFixedSlotLabelHtml(value63, enabled15),
          value65 = 'empty|' + enabled15 + '|' + value64 + '|' + fixedSlotLabelHtml;
        el7.dataset.sig !== value65 &&
          ((el7.innerHTML = '<span class="ref-upload-label">' + fixedSlotLabelHtml + '</span>'),
          (el7.dataset.sig = value65));
        if (el6 && el6 !== el7) el6.replaceWith(el7);
        else {
          if (!el6) el5.appendChild(el7);
        }
        return;
      }
      let el8 = el6 && !el6.classList?.contains('ref-upload-slot') ? el6 : document.createElement('div');
      ((el8.className = 'ref-thumb-wrap rh-v5-ref-box' + (event2.virtual ? ' ref-thumb-wrap--asset' : '')),
        el8.setAttribute('draggable', event2.virtual || !event2.edgeId ? 'false' : 'true'));
      const value66 = enabled15 + '|' + (event2.sig || '');
      el8.dataset.sig !== value66 &&
        ((el8.innerHTML = '' + event2.html + createRefThumbDeleteButtonHtml()),
        (el8.dataset.sig = value66),
        revealRefThumbMedia(el8, value66));
      ((el8.dataset.slot = enabled15),
        (el8.dataset.kind = event2.kind || value64),
        (el8.dataset.refKey = event2.key || (event2.edgeId ? 'edge:' + event2.edgeId : '')),
        (el8.dataset.edgeId = event2.edgeId || ''),
        (el8.dataset.sourceId = event2.sourceId || ''),
        (el8.dataset.refOrigin = event2.virtual ? 'asset' : 'node'));
      event2.virtual
        ? ((el8.dataset.assetId = event2.assetId || ''),
          (el8.dataset.assetIndex = event2.assetIndex || ''),
          (el8.dataset.assetOccurrence = event2.assetOccurrence || ''),
          (el8.dataset.assetRefSource = event2.assetRefSource || 'prompt'),
          (el8.dataset.refType = event2.refType || event2.kind || value64))
        : (delete el8.dataset.assetId,
          delete el8.dataset.assetIndex,
          delete el8.dataset.assetOccurrence,
          delete el8.dataset.assetRefSource,
          delete el8.dataset.refType);
      if (el6 && el6 !== el8) el6.replaceWith(el8);
      else {
        if (!el6) el5.appendChild(el8);
      }
    }
    ['_syncFixedSlotOrder'](el9, value67 = []) {
      if (!el9) return;
      const value68 = el9.querySelector('.rh-fixed-extra-ref');
      (Array.isArray(value67) ? value67 : []).forEach((item12) => {
        const enabled16 = el9.querySelector('[data-slot="' + item12 + '"]');
        if (!enabled16) return;
        value68 && typeof el9.insertBefore === 'function'
          ? el9.insertBefore(enabled16, value68)
          : el9.appendChild(enabled16);
      });
    }
    ['_syncSingleReferenceEditorRatio'](value69, enabled17, value70 = {}) {
      const fixedInputDisplayRatioSlot = resolveFixedInputDisplayRatioSlot(value69, enabled17),
        enabled18 = fixedInputDisplayRatioSlot?.slot || '';
      if (!enabled18 || !enabled17?.[enabled18]) return;
      const box = getFixedInputRatioMediaSize(enabled17[enabled18], value70),
        box2 = calcFixedInputDisplaySize(box?.width, box?.height);
      if (!box2) return;
      const duration = 280,
        handler = (value71) => {
          const el10 =
            typeof document !== 'undefined' && typeof document.getElementById === 'function'
              ? document.getElementById(this.nodeId)
              : null;
          if (!el10) return;
          el10.classList.add('is-ratio-animating');
          if (this._ratioAnimTimer) clearTimeout(this._ratioAnimTimer);
          this._ratioAnimTimer = setTimeout(() => {
            const el11 =
              typeof document !== 'undefined' && typeof document.getElementById === 'function'
                ? document.getElementById(this.nodeId)
                : null;
            if (el11) el11.classList.remove('is-ratio-animating');
            this._ratioAnimTimer = null;
          }, value71 + 80);
        },
        box3 = store.getState?.().nodes?.[this.nodeId] || this._data || {},
        value72 = Number(box3.width) || 300,
        value73 = Number(box3.height) || 300,
        value74 = Number.isFinite(Number(box3.x)) ? Number(box3.x) : 0,
        value75 = Number.isFinite(Number(box3.y)) ? Number(box3.y) : 0,
        width = box2.width,
        height2 = box2.height,
        count7 = width - value72,
        count8 = height2 - value73;
      if (count7 !== 0 || count8 !== 0) handler(duration);
      const args2 = {
        width: width,
        height: height2,
        x: Math.round(value74 - count7 / 2),
        y: Math.round(value75 - count8),
        aspectRatio: '自适应',
      };
      (store.updateNodeData(this.nodeId, args2), (this._data = { ...box3, ...args2 }));
      const el12 = this.footerEl?.querySelector('.img-ratio-label'),
        el13 = this.footerEl?.querySelector('.img-ratio-icon-slot');
      if (el12 && fixedInputDisplayRatioSlot.mode === 'sourceVideoFrames') {
        const fps = normalizeRhV54Fps(this._data?.rhVideoFps),
          count9 = Number.isFinite(this._data?.rhVideoFrames)
            ? Math.max(0, Math.trunc(this._data.rhVideoFrames))
            : 77,
          resolution = normalizeRhVideoResolution(this._data?.rhVideoResolution),
          frames = count9 === 0 ? referenceInputText('fullLength') : String(count9);
        el12.textContent = referenceInputText('sourceVideoFramesLabel', {
          frames: frames,
          fps: fps,
          resolution: resolution,
        });
      }
      el13 &&
        typeof this._getRatioIconHTML === 'function' &&
        (el13.innerHTML = this._getRatioIconHTML('自适应'));
      if (this.previewEl && typeof this.previewEl.animate === 'function') {
        ((this.previewEl.style.transition = 'none'),
          (this.previewEl.style.transformOrigin = 'bottom center'),
          (this.previewEl.style.transform =
            'scaleX(' + value72 / width + ') scaleY(' + value73 / height2 + ')'),
          void this.previewEl.offsetWidth);
        if (this._ratioFlipAnim) this._ratioFlipAnim.cancel();
        const transform = 'scaleX(' + value72 / width + ') scaleY(' + value73 / height2 + ')';
        this._ratioFlipAnim = this.previewEl.animate([{ transform: transform }, { transform: 'none' }], {
          duration: duration,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards',
        });
        const value76 = () => {
          ((this._ratioFlipAnim = null),
            (this.previewEl.style.transformOrigin = ''),
            (this.previewEl.style.transform = ''));
        };
        ((this._ratioFlipAnim.onfinish = value76), (this._ratioFlipAnim.oncancel = value76));
      }
    }
    async ['_renderManifestFixedRefBar']({
      fixedInputConfig: fixedInputConfig,
      inEdges: inEdges3,
      nodes: nodes3,
      nodeData: nodeData3,
      attachBtnHTML: attachBtnHTML,
      ensureVideoThumb: ensureVideoThumb,
    }) {
      const visibleSlots = (fixedInputConfig?.visibleSlots || [])
        .map((item13) => String(item13 || '').trim())
        .filter(Boolean);
      if (!visibleSlots.length) return false;
      this._pruneFixedSlotRefThumbObjectUrls(inEdges3, nodes3);
      const map7 = new Set(visibleSlots),
        occupiedSlots = {};
      visibleSlots.forEach((item14) => {
        occupiedSlots[item14] = null;
      });
      const list6 = [],
        value77 = { text: 0, image: 0, video: 0, audio: 0 },
        value78 = {},
        list7 = [];
      for (const refSlot of inEdges3 || []) {
        const sourceNode = nodes3?.[refSlot?.sourceId];
        if (!sourceNode) continue;
        const kind4 = resolveEffectiveInputKind(sourceNode, refSlot) || 'image';
        ((value77[kind4] = Number(value77[kind4] || 0) + 1),
          (value78[refSlot.sourceId] = '@' + (getFixedRefKindLabel(kind4) || kind4) + value77[kind4]));
        if (kind4 === 'text') {
          const value79 = this._createTextEdgeRefThumbData(refSlot, sourceNode);
          if (value79) list6.push(value79);
          continue;
        }
        const fixedInputSlotForRef = resolveFixedInputSlotForRef({
            fixedInputConfig: fixedInputConfig,
            refSlot: refSlot?.refSlot,
            kind: kind4,
            occupiedSlots: occupiedSlots,
            sourceNode: sourceNode,
          }),
          enabled19 = fixedInputSlotForRef.slot;
        if (fixedInputSlotForRef.reason === 'kindMismatch') continue;
        if (fixedInputSlotForRef.reason === 'hidden' || fixedInputSlotForRef.reason === 'slotConstraint') {
          if (refSlot?.id) list7.push(refSlot.id);
          continue;
        }
        if (!enabled19 || occupiedSlots[enabled19]) {
          const value80 = await this._createFixedEdgeRefThumbData(
            refSlot,
            sourceNode,
            kind4,
            ensureVideoThumb,
          );
          if (value80) list6.push(value80);
          continue;
        }
        const value81 = await this._createFixedEdgeRefThumbData(refSlot, sourceNode, kind4, ensureVideoThumb);
        if (value81) occupiedSlots[enabled19] = value81;
      }
      list7.length > 0 &&
        (typeof store.batch === 'function'
          ? store.batch(() => {
              list7.forEach((item15) => store.removeEdge(item15));
            })
          : list7.forEach((item16) => store.removeEdge(item16)));
      const occupiedSlots2 = new Set(
          Object.entries(occupiedSlots)
            .filter(([, enabled20]) => !!enabled20)
            .map(([value82]) => value82),
        ),
        fixedInputAssetSlotMap = buildFixedInputAssetSlotMap(this.promptEl, {
          slotOrderByType: fixedInputConfig?.slotOrderByType || {},
          visibleSlots: visibleSlots,
          exclusiveGroups: fixedInputConfig?.exclusiveGroups || [],
          slotById: fixedInputConfig?.slotById || {},
          occupiedSlots: occupiedSlots2,
          nodeData: nodeData3,
        });
      (visibleSlots.forEach((slot5) => {
        if (occupiedSlots[slot5]) return;
        const value83 = this._createAssetRefThumbData(fixedInputAssetSlotMap[slot5], { slot: slot5 });
        if (value83) occupiedSlots[slot5] = value83;
      }),
        getAssetInputRefsFromPrompt(this.promptEl, { allowedTypes: ['text'] }).forEach((item17, value84) => {
          const value85 = this._createAssetRefThumbData(item17, {
            key:
              'asset-text:' +
              String(item17.assetId || '') +
              ':' +
              String(item17.itemIndex ?? '') +
              ':' +
              value84,
          });
          if (value85) list6.push(value85);
        }),
        this.refBarEl.classList.add('active', 'rh-v5-refbar'));
      let el14 = this.refBarEl.querySelector('.rh-v5-ref-container');
      const value86 = !el14 || !this.refBarEl.querySelector('.prompt-attachment-btn');
      if (value86) {
        const label =
            String(fixedInputConfig?.manifest?.displayName || '').trim() ||
            String(fixedInputConfig?.manifest?.label || '').trim() ||
            referenceInputText('fixedInputs'),
          value87 = visibleSlots
            .map((item18) => {
              const value88 = String(fixedInputConfig?.slotKindById?.[item18] || '');
              return (
                '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
                escapeHtmlAttr(item18) +
                '" data-kind="' +
                escapeHtmlAttr(value88) +
                '" title="' +
                escapeHtmlAttr(referenceInputText('uploadReference')) +
                '"><span class="ref-upload-label">' +
                getFixedSlotLabelHtml(fixedInputConfig, item18) +
                '</span></button>'
              );
            })
            .join('');
        ((this.refBarEl.innerHTML =
          attachBtnHTML +
          ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
          escapeHtmlAttr(referenceInputText('fixedInputsAria', { label: label })) +
          '">' +
          value87 +
          '</div>'),
          (el14 = this.refBarEl.querySelector('.rh-v5-ref-container')));
      } else {
        const label2 =
          String(fixedInputConfig?.manifest?.displayName || '').trim() ||
          String(fixedInputConfig?.manifest?.label || '').trim() ||
          referenceInputText('fixedInputs');
        el14.setAttribute('aria-label', referenceInputText('fixedInputsAria', { label: label2 }));
      }
      const list8 = Array.from(el14?.querySelectorAll?.('[data-slot]') || []).filter(
        (el15) => !map7.has(String(el15?.dataset?.slot || '')),
      );
      return (
        list8.forEach((el16) => el16.remove()),
        visibleSlots.forEach((item19) => {
          this._syncFixedSlotEl(el14, item19, occupiedSlots[item19], fixedInputConfig);
        }),
        this._syncFixedSlotOrder(el14, visibleSlots),
        this._syncFixedTrailingRefItems(el14, list6),
        this._bindFixedSlotDragSwap(el14, getFixedSlotAcceptMap(fixedInputConfig)),
        this._syncSingleReferenceEditorRatio(fixedInputConfig, occupiedSlots, nodes3),
        this._syncBtnIconState(),
        _syncPillLabels(this, value78),
        true
      );
    }
    async ['_renderRefBar']() {
      if (!this.refBarEl) return;
      if (this._rendererMediaDeferred === true) {
        this._renderRefBarPendingWhenVisible = true;
        return;
      }
      if (this._renderRefBarLock) {
        this._renderRefBarPending = true;
        return;
      }
      ((this._renderRefBarLock = true), (this._renderRefBarPending = false));
      try {
        await this._renderRefBarImpl();
      } finally {
        ((this._renderRefBarLock = false),
          this._renderRefBarPending && ((this._renderRefBarPending = false), this._renderRefBar()));
      }
    }
    async ['_renderRefBarImpl']() {
      if (!this.refBarEl) return;
      const inEdges4 = store.getIncomingEdges(this.nodeId),
        nodes4 = store.getState().nodes,
        nodeData4 = nodes4?.[this.nodeId] || this._data || null,
        fixedInputConfig2 = getFixedInputSlotConfigFromManifest(nodeData4 || {}),
        attachBtnHTML2 = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' }),
        ensureVideoThumb2 = (value89, value90) => {
          const nodeId2 = String(value89?.sourceId || '');
          if (!nodeId2) return;
          const value91 = String(value89?.refSlot || 'sourceVideo'),
            videoThumbUnavailableSource = getVideoSourcePathForThumb(value90, value89);
          if (!videoThumbUnavailableSource) return;
          if (!(
            videoThumbUnavailableSource.startsWith('/output/') ||
            videoThumbUnavailableSource.startsWith('/data/')
          ))
            return;
          const value92 = (() => {
            if (String(value90?.type || '') === 'ai-video') {
              const videoItemByEdge5 = getVideoItemByEdge(value90, value89);
              return String(videoItemByEdge5?.item?.videoThumbUnavailableSource || '').trim();
            }
            return String(value90?.videoThumbUnavailableSource || '').trim();
          })();
          if (value92 === videoThumbUnavailableSource) return;
          const value93 = value91 + '|' + nodeId2 + '|' + videoThumbUnavailableSource;
          if (this._videoThumbPending.has(value93)) return;
          (this._videoThumbPending.add(value93),
            api
              .fetchVideoFirstFrameThumbFromServer(videoThumbUnavailableSource, {
                nodeId: nodeId2,
                assetId: String(value89?.sourceMediaKey || value89?.id || ''),
              })
              .then((response3) => {
                const thumbUrl4 = String(response3?.url || '').trim();
                if (!thumbUrl4) return;
                const value94 = store.getState(),
                  enabled21 = value94.nodes?.[nodeId2];
                if (!enabled21) return;
                if (String(enabled21.type || '') === 'ai-video') {
                  const videoItemByEdge6 = getVideoItemByEdge(enabled21, value89),
                    count10 = Number(videoItemByEdge6.index),
                    list9 = Array.isArray(enabled21.videos) ? enabled21.videos : [];
                  if (!(count10 >= 0 && count10 < list9.length)) return;
                  const args3 = list9[count10] || null;
                  if (!args3 || typeof args3 !== 'object') return;
                  if (String(args3.thumbUrl || '').trim()) return;
                  const value95 = { ...args3, thumbUrl: thumbUrl4, videoThumbUnavailableSource: '' },
                    videos = list9.slice();
                  videos[count10] = value95;
                  const value96 = { videos: videos },
                    value97 = Number(enabled21.mainVideoIndex),
                    value98 = Number.isFinite(value97) ? Math.max(0, Math.trunc(value97)) : 0;
                  if (count10 === value98) value96.videoThumbUnavailableSource = '';
                  if (count10 === value98 && !String(enabled21.thumbUrl || '').trim())
                    value96.thumbUrl = thumbUrl4;
                  store.updateNodeData(nodeId2, value96);
                } else {
                  if (String(enabled21.thumbUrl || '').trim()) return;
                  store.updateNodeData(nodeId2, {
                    thumbUrl: thumbUrl4,
                    videoThumbUnavailableSource: '',
                  });
                }
              })
              .catch(() => {
                const value99 = store.getState(),
                  enabled22 = value99.nodes?.[nodeId2];
                if (!enabled22) return;
                if (getVideoSourcePathForThumb(enabled22, value89) !== videoThumbUnavailableSource) return;
                if (String(enabled22.type || '') === 'ai-video') {
                  const videoItemByEdge7 = getVideoItemByEdge(enabled22, value89),
                    count11 = Number(videoItemByEdge7.index),
                    list10 = Array.isArray(enabled22.videos) ? enabled22.videos : [];
                  if (!(count11 >= 0 && count11 < list10.length)) return;
                  const args4 = list10[count11] || null;
                  if (!args4 || typeof args4 !== 'object') return;
                  const videos2 = list10.slice();
                  videos2[count11] = {
                    ...args4,
                    videoThumbUnavailableSource: videoThumbUnavailableSource,
                    thumbUrl: '',
                  };
                  const value100 = { videos: videos2 },
                    value101 = Number(enabled22.mainVideoIndex),
                    value102 = Number.isFinite(value101) ? Math.max(0, Math.trunc(value101)) : 0;
                  (count11 === value102 &&
                    ((value100.videoThumbUnavailableSource = videoThumbUnavailableSource),
                    (value100.thumbUrl = '')),
                    store.updateNodeData(nodeId2, value100));
                } else
                  store.updateNodeData(nodeId2, {
                    videoThumbUnavailableSource: videoThumbUnavailableSource,
                    thumbUrl: '',
                  });
              })
              .finally(() => {
                this._videoThumbPending.delete(value93);
              }));
        },
        fixedRefBarLayoutKey = getFixedRefBarLayoutKey(fixedInputConfig2);
      this._refBarLayoutKey !== fixedRefBarLayoutKey &&
        ((this._refBarLayoutKey = fixedRefBarLayoutKey),
        this.refBarEl.classList.remove('active', 'rh-v5-refbar'),
        (this.refBarEl.innerHTML = ''),
        !fixedInputConfig2 && this._clearObjectUrlMap(this._getFixedSlotRefThumbObjectUrlMap()),
        fixedRefBarLayoutKey !== 'generic' && this._clearObjectUrlMap(this._refThumbObjectUrls));
      if (fixedInputConfig2) {
        await this._renderManifestFixedRefBar({
          fixedInputConfig: fixedInputConfig2,
          inEdges: inEdges4,
          nodes: nodes4,
          nodeData: nodeData4,
          attachBtnHTML: attachBtnHTML2,
          ensureVideoThumb: ensureVideoThumb2,
        });
        return;
      }
      const list11 = getAssetInputRefsFromPromptAndNode(this.promptEl, {
        nodeData: nodeData4,
        allowedTypes: ['text', 'image', 'video', 'audio'],
      });
      if (inEdges4.length === 0 && list11.length === 0) {
        (this.refBarEl.classList.remove('rh-v5-refbar'),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = attachBtnHTML2),
          this._syncBtnIconState(),
          _syncPillLabels(this, {}));
        return;
      }
      const map8 = new Set();
      for (const value103 of inEdges4) {
        const value104 = nodes4?.[value103.sourceId];
        if (value104?.thumbId) map8.add(value104.thumbId);
      }
      for (const [value105, value106] of this._refThumbObjectUrls.entries()) {
        !map8.has(value105) &&
          (value106 && String(value106).startsWith('blob:') && URL.revokeObjectURL(value106),
          this._refThumbObjectUrls.delete(value105));
      }
      let list12 = [];
      const value107 = { text: 0, image: 0, video: 0, audio: 0 },
        value108 = {},
        value109 = {
          text: referenceInputText('kind.text'),
          image: referenceInputText('kind.image'),
          video: referenceInputText('kind.video'),
          audio: referenceInputText('kind.audio'),
        };
      for (const edgeId3 of inEdges4) {
        const response4 = nodes4[edgeId3.sourceId];
        if (!response4) continue;
        const effectiveInputKind = resolveEffectiveInputKind(response4, edgeId3) || 'image';
        if (effectiveInputKind === 'text') {
          const enabled23 = String(
            response4.outputText || response4.text || response4.content || response4.prompt || '',
          ).trim();
          if (!enabled23) continue;
        } else {
          if (effectiveInputKind === 'image') {
            const enabled24 =
              !!response4.thumbId ||
              !!response4.thumbUrl ||
              !!response4.imageUrl ||
              !!response4.src ||
              !!response4.localPath;
            if (!enabled24) continue;
          } else {
            if (effectiveInputKind === 'video') {
              const enabled25 =
                (Array.isArray(response4.videos) && response4.videos.length > 0) ||
                !!response4.thumbId ||
                !!response4.thumbUrl ||
                !!response4.videoUrl ||
                !!response4.displayLocalPath ||
                !!response4.originalLocalPath ||
                !!response4.videoLocalPath ||
                !!response4.src ||
                !!response4.localPath ||
                !!response4.url ||
                !!response4.resultUrl ||
                !!response4.sourceUrl;
              if (!enabled25) continue;
            } else {
              if (effectiveInputKind === 'audio') {
                const enabled26 = !!response4.audioUrl || !!response4.src || !!response4.localPath;
                if (!enabled26) continue;
              }
            }
          }
        }
        let thumbHTML = '',
          value110 = '';
        if (effectiveInputKind === 'image') {
          let enabled27 = '';
          if (response4.thumbId) {
            if (this._refThumbObjectUrls.has(response4.thumbId))
              enabled27 = this._refThumbObjectUrls.get(response4.thumbId);
            else {
              const value111 = await getImage(response4.thumbId);
              if (value111) {
                const value112 = URL.createObjectURL(value111);
                (this._refThumbObjectUrls.set(response4.thumbId, value112), (enabled27 = value112));
              }
            }
          }
          !enabled27 && (enabled27 = this._resolveMediaUrl(resolveCanvasImageLowZoomUrl(response4)));
          !enabled27 &&
            response4.localPath &&
            (enabled27 = this._resolveMediaUrl(localPathToUrl(response4.localPath)));
          if (!enabled27) continue;
          (ensureThumbDecoded(enabled27),
            (thumbHTML =
              '<img src="' +
              enabled27 +
              '" class="ref-thumb-media is-pending" draggable="false">' +
              createReferenceMaskBadgeHtml(response4)),
            (value110 = 'i|' + enabled27 + '|' + getReferenceMaskSignaturePart(response4)));
        } else {
          if (effectiveInputKind === 'video') {
            const videoThumbCandidate2 = getVideoThumbCandidate(response4, edgeId3),
              value113 = this._resolveMediaUrl(videoThumbCandidate2.thumbUrl || response4.imageUrl || '');
            value113
              ? (ensureThumbDecoded(value113),
                (thumbHTML =
                  '<img src="' + value113 + '" class="ref-thumb-media is-pending" draggable="false">'),
                (value110 = 'v|' + value113))
              : (ensureVideoThumb2(edgeId3, response4),
                (thumbHTML =
                  '<div class="ref-thumb-media" style="background:var(--bg-node);display:flex;align-items:center;justify-content:center;">\n                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n                </div>'),
                (value110 = 'v|fallback'));
          } else
            ((thumbHTML = createReferenceFallbackThumbHtml(effectiveInputKind)),
              (value110 = effectiveInputKind + '|fallback'));
        }
        value107[effectiveInputKind]++;
        const value114 = '@' + value109[effectiveInputKind] + value107[effectiveInputKind];
        value108[edgeId3.sourceId] = value114;
        const sig = edgeId3.id + '|' + edgeId3.sourceId + '|' + value110;
        list12.push({
          key: 'edge:' + edgeId3.id,
          edgeId: edgeId3.id,
          sourceId: edgeId3.sourceId,
          sig: sig,
          thumbHTML: thumbHTML,
        });
      }
      list11.forEach((response5, value115) => {
        const refType = String(response5?.type || '').trim();
        if (!refType) return;
        let thumbHTML2 = '',
          value116 = '';
        if (refType === 'image') {
          const enabled28 = this._resolveMediaUrl(response5.thumbUrl || response5.url || '');
          if (!enabled28) return;
          (ensureThumbDecoded(enabled28),
            (thumbHTML2 =
              '<img src="' + enabled28 + '" class="ref-thumb-media is-pending" draggable="false">'),
            (value116 = 'asset-i|' + enabled28));
        } else {
          if (refType === 'video') {
            const value117 = this._resolveMediaUrl(response5.thumbUrl || '');
            value117
              ? (ensureThumbDecoded(value117),
                (thumbHTML2 =
                  '<img src="' + value117 + '" class="ref-thumb-media is-pending" draggable="false">'),
                (value116 = 'asset-v|' + value117))
              : ((thumbHTML2 = createReferenceFallbackThumbHtml('video')), (value116 = 'asset-v|fallback'));
          } else
            ((thumbHTML2 = createReferenceFallbackThumbHtml(refType)),
              (value116 = 'asset-' + refType + '|fallback'));
        }
        const assetId2 = String(response5.assetId || ''),
          assetIndex2 = String(response5.itemIndex ?? ''),
          assetOccurrence2 = String(response5.assetMentionOccurrence ?? ''),
          assetRefSource2 = String(response5.assetRefSource || 'prompt'),
          sourceId2 = 'asset:' + assetId2 + ':' + assetIndex2;
        list12.push({
          key: 'asset:' + assetId2 + ':' + assetIndex2 + ':' + refType + ':' + value115,
          edgeId: '',
          sourceId: sourceId2,
          sig: sourceId2 + '|' + refType + '|' + String(response5.url || '') + '|' + value116,
          thumbHTML: thumbHTML2,
          virtual: true,
          assetId: assetId2,
          assetIndex: assetIndex2,
          assetOccurrence: assetOccurrence2,
          assetRefSource: assetRefSource2,
          refType: refType,
        });
      });
      if (list12.length === 0) {
        (this.refBarEl.classList.remove('rh-v5-refbar'),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = attachBtnHTML2),
          this._syncBtnIconState(),
          _syncPillLabels(this, {}));
        return;
      }
      if (this._isDraggingSorting) {
        (this._syncBtnIconState(), _syncPillLabels(this, value108));
        return;
      }
      (this.refBarEl.classList.remove('rh-v5-refbar'), this.refBarEl.classList.add('active'));
      let el17 = this.refBarEl.querySelector('.ref-thumb-container');
      (!this.refBarEl.querySelector('.prompt-attachment-btn') || !el17) &&
        ((this.refBarEl.innerHTML = attachBtnHTML2 + ' <div class="ref-thumb-container"></div>'),
        (el17 = this.refBarEl.querySelector('.ref-thumb-container')));
      const map9 = new Map();
      el17
        .querySelectorAll('.ref-thumb-wrap')
        .forEach((el18) => map9.set(el18.dataset.refKey || 'edge:' + el18.dataset.edgeId, el18));
      const map10 = new Set();
      for (let value118 = 0; value118 < list12.length; value118++) {
        const event3 = list12[value118];
        let el19 = map9.get(event3.key);
        (!el19 &&
          ((el19 = document.createElement('div')),
          (el19.className = 'ref-thumb-wrap' + (event3.virtual ? ' ref-thumb-wrap--asset' : ''))),
          el19.setAttribute('draggable', event3.virtual ? 'false' : 'true'),
          el19.dataset.sig !== event3.sig &&
            ((el19.innerHTML = '' + event3.thumbHTML + createRefThumbDeleteButtonHtml()),
            (el19.dataset.sig = event3.sig),
            revealRefThumbMedia(el19, event3.sig)),
          (el19.dataset.refKey = event3.key),
          (el19.dataset.edgeId = event3.edgeId),
          (el19.dataset.sourceId = event3.sourceId),
          (el19.dataset.refOrigin = event3.virtual ? 'asset' : 'node'),
          event3.virtual
            ? ((el19.dataset.assetId = event3.assetId || ''),
              (el19.dataset.assetIndex = event3.assetIndex || ''),
              (el19.dataset.assetOccurrence = event3.assetOccurrence || ''),
              (el19.dataset.assetRefSource = event3.assetRefSource || 'prompt'),
              (el19.dataset.refType = event3.refType || ''))
            : (delete el19.dataset.assetId,
              delete el19.dataset.assetIndex,
              delete el19.dataset.assetOccurrence,
              delete el19.dataset.assetRefSource,
              delete el19.dataset.refType),
          el17.appendChild(el19),
          map10.add(event3.key));
      }
      for (const [value119, el20] of map9.entries()) {
        if (!map10.has(value119)) el20.remove();
      }
      (this._bindDragSort(this.refBarEl), this._syncBtnIconState(), _syncPillLabels(this, value108));
    }
    ['_bindFixedSlotDragSwap'](container, acceptMap) {
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: container,
        store: store,
        nodeId: this.nodeId,
        acceptMap: acceptMap,
      });
    }
    ['_bindDragSort'](container2) {
      bindRefThumbOrderDrag({ owner: this, container: container2, store: store, nodeId: this.nodeId });
    }
  }
  return value44.prototype;
}
