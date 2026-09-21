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
  RH_MIN_VIDEO_RESOLUTION = 0x340;
function referenceInputText(_0x178c82, _0x457a9d = {}) {
  return t('videoNode.referenceInput.' + _0x178c82, _0x457a9d);
}
function normalizeRhV54Fps(_0xe2de76) {
  const _0x2a7671 = Number(_0xe2de76);
  return RH_V54_FPS_OPTIONS.includes(_0x2a7671) ? _0x2a7671 : 24;
}
function normalizeRhVideoResolution(_0x354f8a) {
  const _0x33d0d0 = Number(_0x354f8a);
  return Number.isFinite(_0x33d0d0)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(_0x33d0d0))
    : RH_MIN_VIDEO_RESOLUTION;
}
function normalizeVideoMediaKey(_0x509147) {
  return String(_0x509147 || '')
    .trim()
    .replace(/^\/+/, '');
}
function normalizeRefSignaturePart(_0x355386) {
  return String(_0x355386 || '').trim();
}
function getFixedRefBarLayoutKey(_0x181070) {
  if (!_0x181070) return 'generic';
  return 'fixed';
}
function getVideoItemMediaKey(_0x2d334f) {
  return (
    normalizeVideoMediaKey(_0x2d334f?.localPath) ||
    normalizeVideoMediaKey(_0x2d334f?.displayLocalPath) ||
    normalizeVideoMediaKey(_0x2d334f?.originalLocalPath) ||
    normalizeVideoMediaKey(_0x2d334f?.videoLocalPath) ||
    normalizeVideoMediaKey(_0x2d334f?.videoUrl)
  );
}
function getVideoItemByEdge(_0x2d721e, _0x4a17ba) {
  const _0x16bf27 = Array.isArray(_0x2d721e?.videos) ? _0x2d721e.videos : [];
  if (!_0x16bf27.length) return { item: null, index: -1, matchedByKey: false };
  const _0x27f4fd = normalizeVideoMediaKey(_0x4a17ba?.sourceMediaKey);
  let _0x479643 = -1;
  _0x27f4fd &&
    (_0x479643 = _0x16bf27.findIndex((_0x29b379) => getVideoItemMediaKey(_0x29b379) === _0x27f4fd));
  const _0x25cd54 = _0x479643 >= 0;
  if (_0x479643 < 0) {
    const _0x389b2e = Number(_0x2d721e?.mainVideoIndex),
      _0x50136e = Number.isFinite(_0x389b2e) ? Math.max(0, Math.trunc(_0x389b2e)) : 0;
    _0x479643 = Math.max(0, Math.min(_0x16bf27.length - 1, _0x50136e));
  }
  return { item: _0x16bf27[_0x479643] || null, index: _0x479643, matchedByKey: _0x25cd54 };
}
function getVideoThumbCandidate(_0x5ce356, _0x260abe) {
  const _0x298ab5 = getVideoItemByEdge(_0x5ce356, _0x260abe),
    _0x5d0e6a = String(_0x298ab5.item?.thumbUrl || '').trim();
  if (_0x5d0e6a) return { thumbUrl: _0x5d0e6a, selected: _0x298ab5 };
  const _0xd21120 = Array.isArray(_0x5ce356?.videos) ? _0x5ce356.videos : [],
    _0xd1d24 = Number(_0x5ce356?.mainVideoIndex),
    _0x317ef9 = Number.isFinite(_0xd1d24) ? Math.max(0, Math.trunc(_0xd1d24)) : 0,
    _0x42af5c = Math.max(0, Math.min(_0xd21120.length - 1, _0x317ef9)),
    _0x22bad9 = String(_0xd21120[_0x42af5c]?.thumbUrl || '').trim();
  if (_0x22bad9 && !_0x298ab5.matchedByKey)
    return {
      thumbUrl: _0x22bad9,
      selected: { item: _0xd21120[_0x42af5c] || null, index: _0x42af5c, matchedByKey: false },
    };
  const _0x4c34e2 = String(_0x5ce356?.thumbUrl || '').trim();
  if (_0x4c34e2 && (!_0x298ab5.matchedByKey || _0x298ab5.index === _0x42af5c))
    return { thumbUrl: _0x4c34e2, selected: _0x298ab5 };
  return { thumbUrl: '', selected: _0x298ab5 };
}
function getVideoSourcePathForThumb(_0x430120, _0x55f05b) {
  if (String(_0x430120?.type || '') === 'ai-video') {
    const { item: _0xd496cb } = getVideoItemByEdge(_0x430120, _0x55f05b),
      _0x345d48 = String(_0xd496cb?.localPath || '').trim();
    if (_0x345d48) return localPathToUrl(_0x345d48);
    const _0x105ef6 = String(_0xd496cb?.displayLocalPath || '').trim();
    if (_0x105ef6) return localPathToUrl(_0x105ef6);
    const _0xad1754 = String(_0xd496cb?.originalLocalPath || '').trim();
    if (_0xad1754) return localPathToUrl(_0xad1754);
    const _0x3b3882 = String(_0xd496cb?.videoLocalPath || '').trim();
    if (_0x3b3882) return localPathToUrl(_0x3b3882);
    const _0x58453f = String(_0xd496cb?.videoUrl || '').trim(),
      _0x279998 = localPathToUrl(_0x58453f);
    if (_0x279998) return _0x279998;
    return '';
  }
  const _0x3e20b9 = String(_0x430120?.localPath || '').trim();
  if (_0x3e20b9) return localPathToUrl(_0x3e20b9);
  const _0x37db75 = String(_0x430120?.displayLocalPath || '').trim();
  if (_0x37db75) return localPathToUrl(_0x37db75);
  const _0x34a477 = String(_0x430120?.originalLocalPath || '').trim();
  if (_0x34a477) return localPathToUrl(_0x34a477);
  const _0x58efa1 = String(_0x430120?.videoLocalPath || '').trim();
  if (_0x58efa1) return localPathToUrl(_0x58efa1);
  const _0x2c918f = String(_0x430120?.videoUrl || _0x430120?.src || '').trim(),
    _0x57a209 = localPathToUrl(_0x2c918f);
  if (_0x57a209) return _0x57a209;
  return '';
}
function getVideoRefMediaSignature(_0x28b368, _0x1fe3a3) {
  const _0x5d14cc = getVideoItemByEdge(_0x28b368, _0x1fe3a3);
  return (
    getVideoItemMediaKey(_0x5d14cc.item) ||
    normalizeVideoMediaKey(_0x28b368?.localPath) ||
    normalizeVideoMediaKey(_0x28b368?.displayLocalPath) ||
    normalizeVideoMediaKey(_0x28b368?.originalLocalPath) ||
    normalizeVideoMediaKey(_0x28b368?.videoLocalPath) ||
    normalizeVideoMediaKey(_0x28b368?.videoUrl) ||
    normalizeVideoMediaKey(_0x28b368?.src)
  );
}
function pickPositiveNumber(..._0x5e4c8a) {
  for (const _0x523193 of _0x5e4c8a) {
    const _0x48f8c1 = Number(_0x523193);
    if (Number.isFinite(_0x48f8c1) && _0x48f8c1 > 0) return _0x48f8c1;
  }
  return 0;
}
function getSourceVideoFrameCount(_0x24d376, _0xbc5248) {
  const _0x173f56 = getVideoItemByEdge(_0x24d376, _0xbc5248).item,
    _0x39f024 = pickPositiveNumber(
      _0x173f56?.videoFrameCount,
      _0x173f56?.frameCount,
      _0x24d376?.videoFrameCount,
      _0x24d376?.frameCount,
    );
  return _0x39f024 > 0 ? Math.round(_0x39f024) : 0;
}
function getSourceVideoDuration(_0x10c6dd, _0x5f28a6) {
  const _0x3913d1 = getVideoItemByEdge(_0x10c6dd, _0x5f28a6).item;
  return pickPositiveNumber(
    _0x3913d1?.videoDuration,
    _0x3913d1?.duration,
    _0x10c6dd?.videoDuration,
    _0x10c6dd?.duration,
  );
}
function getRhV5SourceVideoNode({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
}) {
  const _0x1c0815 = Array.isArray(inEdges) ? inEdges : [];
  let _0x1be162 = _0x1c0815.find((_0xe00333) => String(_0xe00333?.refSlot || '') === 'sourceVideo') || null;
  !_0x1be162 &&
    (_0x1be162 =
      _0x1c0815.find((_0x28b13a) => String(nodes?.[_0x28b13a?.sourceId]?.type || '').includes('video')) ||
      null);
  if (_0x1be162 && nodes?.[_0x1be162.sourceId]) return { node: nodes[_0x1be162.sourceId], edge: _0x1be162 };
  const _0x3d65f0 = getAssetInputRefsFromPromptAndNode(promptEl, {
    nodeData: nodeData,
    allowedTypes: ['video'],
  })[0];
  return _0x3d65f0?.nodeData ? { node: _0x3d65f0.nodeData, edge: null } : { node: null, edge: null };
}
function getRhV5SourceVideoFrameCount({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
  targetFps: targetFps = 0,
} = {}) {
  const { node: _0x451404, edge: _0x264882 } = getRhV5SourceVideoNode({
    inEdges: inEdges,
    nodes: nodes,
    promptEl: promptEl,
    nodeData: nodeData,
  });
  if (!_0x451404) return null;
  const _0x1195b3 = getSourceVideoFrameCount(_0x451404, _0x264882);
  if (_0x1195b3 > 0) return _0x1195b3;
  const _0x2b2081 = Number(targetFps);
  if (!Number.isFinite(_0x2b2081) || _0x2b2081 <= 0) return null;
  let _0x34d230 = getSourceVideoDuration(_0x451404, _0x264882);
  if (!(_0x34d230 > 0)) {
    const _0x5d6170 = getVideoItemByEdge(_0x451404, _0x264882).item,
      _0x520866 = pickPositiveNumber(
        _0x5d6170?.videoFrameCount,
        _0x5d6170?.frameCount,
        _0x451404?.videoFrameCount,
        _0x451404?.frameCount,
      ),
      _0x21de59 = pickPositiveNumber(
        _0x5d6170?.videoFps,
        _0x5d6170?.fps,
        _0x451404?.videoFps,
        _0x451404?.fps,
      );
    if (_0x520866 > 0 && _0x21de59 > 0) _0x34d230 = _0x520866 / _0x21de59;
  }
  return _0x34d230 > 0 ? Math.round(_0x34d230 * _0x2b2081) : null;
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
function escapeHtmlText(_0x5d1a74) {
  return String(_0x5d1a74 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeHtmlAttr(_0x548033) {
  return escapeHtmlText(_0x548033).replace(/"/g, '&quot;');
}
function getFixedRefKindLabel(_0x2d9db2) {
  const _0x5bd091 = FIXED_REF_KIND_LABEL_KEYS[String(_0x2d9db2 || '')];
  return _0x5bd091 ? referenceInputText(_0x5bd091) : '';
}
function getFixedRefSlotFallbackLabel(_0xc95df0) {
  const _0x173e01 = FIXED_REF_SLOT_FALLBACK_LABEL_KEYS[String(_0xc95df0 || '')];
  return _0x173e01 ? referenceInputText(_0x173e01) : '';
}
function createRefThumbDeleteButtonHtml() {
  return (
    '<button type="button" class="ref-thumb-delete" title="' +
    escapeHtmlAttr(referenceInputText('removeReference')) +
    '">&times;</button>'
  );
}
function getFixedSlotLabelHtml(_0x32e047, _0x3dd032) {
  const _0x294108 = String(_0x3dd032 || '').trim(),
    _0x5bb5ef = _0x32e047?.slotById?.[_0x294108] || null,
    _0x14d2fc =
      String(_0x5bb5ef?.label || '').trim() ||
      getFixedRefSlotFallbackLabel(_0x294108) ||
      getFixedRefKindLabel(_0x32e047?.slotKindById?.[_0x294108]) ||
      _0x294108;
  return escapeHtmlText(_0x14d2fc);
}
function getFixedSlotAcceptMap(_0xb3ec84) {
  const _0x2ce1cf = {};
  return (
    (_0xb3ec84?.visibleSlots || []).forEach((_0x4af91c) => {
      const _0x5190f4 = String(_0xb3ec84?.slotKindById?.[_0x4af91c] || '').trim();
      if (_0x4af91c && _0x5190f4) _0x2ce1cf[_0x4af91c] = _0x5190f4;
    }),
    _0x2ce1cf
  );
}
function normalizeDisplayRatioSource(_0x5055d4) {
  if (!_0x5055d4 || typeof _0x5055d4 !== 'object' || Array.isArray(_0x5055d4)) return null;
  const _0x151504 = Array.from(
      new Set(
        [
          String(_0x5055d4.slot || _0x5055d4.refSlot || '').trim(),
          ...(Array.isArray(_0x5055d4.slots) ? _0x5055d4.slots : []),
        ]
          .map((_0x46d277) => String(_0x46d277 || '').trim())
          .filter(Boolean),
      ),
    ),
    _0x3e184c = String(_0x5055d4.kind || '').trim(),
    _0x3587fe = Number(_0x5055d4.fallbackIndex ?? _0x5055d4.inputIndex ?? _0x5055d4.index),
    _0x56a786 = Number.isFinite(_0x3587fe) && _0x3587fe >= 0 ? Math.trunc(_0x3587fe) : null;
  if (_0x151504.length === 0 && _0x56a786 === null) return null;
  return {
    ...(_0x151504.length ? { slot: _0x151504[0], slots: _0x151504 } : {}),
    ...(_0x3e184c ? { kind: _0x3e184c } : {}),
    ...(_0x56a786 !== null ? { fallbackIndex: _0x56a786 } : {}),
  };
}
function resolveConfiguredDisplayRatioSlot(_0x5cad24, _0x14fb9b = {}) {
  const _0x4936dd = normalizeDisplayRatioSource(_0x5cad24?.manifest?.inputSlots?.displayAspectRatioSource);
  if (!_0x4936dd) return null;
  const _0x3bf336 = Array.isArray(_0x4936dd.slots) ? _0x4936dd.slots : _0x4936dd.slot ? [_0x4936dd.slot] : [];
  for (const _0x465f50 of _0x3bf336) {
    if (!_0x14fb9b?.[_0x465f50]) continue;
    if (_0x4936dd.kind && String(_0x5cad24?.slotKindById?.[_0x465f50] || '') !== _0x4936dd.kind) continue;
    return { slot: _0x465f50, mode: 'configured' };
  }
  const _0x2f3531 = Array.isArray(_0x5cad24?.visibleSlots) ? _0x5cad24.visibleSlots : [],
    _0x1a23a4 = _0x2f3531.filter((_0x11e2d6) => {
      const _0x1c9950 = _0x14fb9b?.[_0x11e2d6];
      if (!_0x1c9950) return false;
      if (!_0x4936dd.kind) return true;
      return String(_0x5cad24?.slotKindById?.[_0x11e2d6] || '') === _0x4936dd.kind;
    }),
    _0x477fc9 = _0x4936dd.fallbackIndex;
  if (Number.isInteger(_0x477fc9) && _0x477fc9 >= 0 && _0x477fc9 < _0x1a23a4.length)
    return { slot: _0x1a23a4[_0x477fc9], mode: 'configured' };
  return null;
}
function resolveLegacySingleReferenceVideoSlot(_0x372fd9, _0x424d53 = {}) {
  const _0x2652c2 = _0x372fd9?.visibleSlots || [],
    _0x32f3e9 =
      _0x2652c2.length === 2 &&
      _0x2652c2[0] === 'sourceVideo' &&
      _0x2652c2[1] === 'refImage' &&
      (_0x372fd9?.fixedSlots || []).length === 2;
  if (!_0x32f3e9 || !_0x424d53?.sourceVideo) return null;
  return { slot: 'sourceVideo', mode: 'sourceVideoFrames' };
}
function resolveFixedInputDisplayRatioSlot(_0x191afc, _0x51f60f = {}) {
  return (
    resolveConfiguredDisplayRatioSlot(_0x191afc, _0x51f60f) ||
    resolveLegacySingleReferenceVideoSlot(_0x191afc, _0x51f60f)
  );
}
function getFixedInputRatioMediaSize(_0x45633c, _0x5dc366 = {}) {
  if (!_0x45633c) return null;
  const _0xb1a9b0 = String(_0x45633c.kind || _0x45633c.refType || '').trim(),
    _0x2b6443 = _0x45633c.node || _0x45633c.ref?.nodeData || _0x5dc366?.[_0x45633c.sourceId];
  if (!_0x2b6443) return null;
  const _0x957e0 = _0xb1a9b0 === 'video' ? 'video' : _0xb1a9b0 === 'image' ? 'img' : 'img, video';
  return getGenerationRatioSizeWithDom({
    nodeId: _0x45633c.sourceId,
    nodeData: _0x2b6443,
    edge: _0x45633c.edge || null,
    mediaSelector: _0x957e0,
    includeNodeFrame: true,
  });
}
function calcFixedInputDisplaySize(_0x48145c, _0xebc4af, _0x58a6b6 = 0x12c) {
  const _0x5b2603 = Number(_0x48145c),
    _0x5839b7 = Number(_0xebc4af);
  if (!(Number.isFinite(_0x5b2603) && _0x5b2603 > 0)) return null;
  if (!(Number.isFinite(_0x5839b7) && _0x5839b7 > 0)) return null;
  const _0x20ab7d = Math.max(1, Math.round(Number(_0x58a6b6) || 0x12c));
  if (_0x5b2603 >= _0x5839b7)
    return { width: Math.round((_0x5b2603 / _0x5839b7) * _0x20ab7d), height: _0x20ab7d };
  return { width: _0x20ab7d, height: Math.round((_0x5839b7 / _0x5b2603) * _0x20ab7d) };
}
export const __videoReferenceInputTest = {
  getVideoThumbCandidate: getVideoThumbCandidate,
  getVideoSourcePathForThumb: getVideoSourcePathForThumb,
  getVideoRefMediaSignature: getVideoRefMediaSignature,
  getRhV5SourceVideoFrameCount: getRhV5SourceVideoFrameCount,
  createRunningHubAudioFallbackThumbHtml: createRunningHubAudioFallbackThumbHtml,
  calcFixedInputDisplaySize: calcFixedInputDisplaySize,
};
export function createVideoNodeReferenceInputModule(_0x41f3ac) {
  const {
    store: _0x2b49c9,
    api: _0x50c6b2,
    _syncPillLabels: _0xd25a29,
    getImage: _0x46ffd3,
    ensureThumbDecoded: _0x3ca8ce,
    revealRefThumbMedia: _0x9589d,
  } = _0x41f3ac;
  class _0x21ad33 {
    ['_getRefSourceStateKey'](_0x18343d) {
      const _0x3d9a43 = String(_0x18343d?.type || ''),
        _0x455fba = getReferenceMaskSignaturePart(_0x18343d),
        _0x1fecec = normalizeRefSignaturePart(
          _0x18343d?.outputText || _0x18343d?.text || _0x18343d?.content || '',
        );
      if (_0x3d9a43.includes('text')) return 't:' + _0x1fecec;
      if (_0x3d9a43.includes('video')) {
        const _0x9a4599 = (Array.isArray(_0x18343d?.videos) ? _0x18343d.videos : [])
          .map((_0x3229e6) =>
            [
              normalizeVideoMediaKey(_0x3229e6?.localPath),
              normalizeVideoMediaKey(_0x3229e6?.displayLocalPath),
              normalizeVideoMediaKey(_0x3229e6?.originalLocalPath),
              normalizeVideoMediaKey(_0x3229e6?.videoLocalPath),
              normalizeVideoMediaKey(_0x3229e6?.videoUrl),
              normalizeVideoMediaKey(_0x3229e6?.thumbId),
              normalizeVideoMediaKey(_0x3229e6?.thumbUrl),
              Number(_0x3229e6?.videoFrameCount || _0x3229e6?.frameCount || 0) || 0,
              Number(_0x3229e6?.videoDuration || _0x3229e6?.duration || 0) || 0,
              Number(_0x3229e6?.videoFps || _0x3229e6?.fps || 0) || 0,
            ].join(','),
          )
          .join(';');
        return [
          'v',
          Number.isFinite(Number(_0x18343d?.mainVideoIndex))
            ? Math.max(0, Math.trunc(Number(_0x18343d.mainVideoIndex)))
            : 0,
          normalizeVideoMediaKey(_0x18343d?.thumbId),
          normalizeVideoMediaKey(_0x18343d?.thumbUrl),
          normalizeVideoMediaKey(_0x18343d?.localPath),
          normalizeVideoMediaKey(_0x18343d?.displayLocalPath),
          normalizeVideoMediaKey(_0x18343d?.originalLocalPath),
          normalizeVideoMediaKey(_0x18343d?.videoLocalPath),
          normalizeVideoMediaKey(_0x18343d?.videoUrl),
          normalizeVideoMediaKey(_0x18343d?.src),
          normalizeVideoMediaKey(_0x18343d?.url),
          normalizeVideoMediaKey(_0x18343d?.resultUrl),
          normalizeVideoMediaKey(_0x18343d?.sourceUrl),
          Number(_0x18343d?.videoFrameCount || 0) || 0,
          Number(_0x18343d?.videoDuration || 0) || 0,
          Number(_0x18343d?.videoFps || 0) || 0,
          _0x9a4599,
        ].join(':');
      }
      if (_0x3d9a43.includes('audio'))
        return [
          'a',
          normalizeRefSignaturePart(_0x18343d?.audioUrl),
          normalizeRefSignaturePart(_0x18343d?.src),
          normalizeRefSignaturePart(_0x18343d?.localPath),
        ].join(':');
      return [
        'i',
        normalizeRefSignaturePart(_0x18343d?.thumbId),
        normalizeRefSignaturePart(_0x18343d?.thumbUrl),
        normalizeRefSignaturePart(_0x18343d?.imageUrl),
        normalizeRefSignaturePart(_0x18343d?.src),
        normalizeRefSignaturePart(_0x18343d?.localPath),
        _0x455fba,
      ].join(':');
    }
    ['_getRhV5SourceVideoFrameCount'](_0x19a786) {
      const _0xf1dcad = _0x2b49c9.getIncomingEdges(this.nodeId) || [],
        _0x3e7d01 = _0x2b49c9.getState() || {},
        _0x378dc4 = _0x3e7d01.nodes || {};
      return getRhV5SourceVideoFrameCount({
        inEdges: _0xf1dcad,
        nodes: _0x378dc4,
        promptEl: this.promptEl,
        nodeData: _0x378dc4?.[this.nodeId] || this._data || null,
        targetFps: _0x19a786,
      });
    }
    ['_createAssetRefThumbData'](_0x385b72, { slot: slot = '', key: key = '' } = {}) {
      const _0xaa206a = String(_0x385b72?.type || '').trim();
      if (!_0xaa206a) return null;
      let _0x2d425b = '',
        _0x2e8a3a = '';
      if (_0xaa206a === 'image') {
        const _0x1082ee = this._resolveMediaUrl(_0x385b72.thumbUrl || _0x385b72.url || '');
        if (!_0x1082ee) return null;
        (_0x3ca8ce(_0x1082ee),
          (_0x2d425b = '<img src="' + _0x1082ee + '" class="ref-thumb-media is-pending" draggable="false">'),
          (_0x2e8a3a = 'asset-i|' + _0x1082ee));
      } else {
        if (_0xaa206a === 'video') {
          const _0x4b3f11 = this._resolveMediaUrl(_0x385b72.thumbUrl || '');
          _0x4b3f11
            ? (_0x3ca8ce(_0x4b3f11),
              (_0x2d425b =
                '<img src="' + _0x4b3f11 + '" class="ref-thumb-media is-pending" draggable="false">'),
              (_0x2e8a3a = 'asset-v|' + _0x4b3f11))
            : ((_0x2d425b = createReferenceFallbackThumbHtml('video')), (_0x2e8a3a = 'asset-v|fallback'));
        } else {
          if (_0xaa206a === 'audio')
            ((_0x2d425b = createReferenceFallbackThumbHtml('audio')), (_0x2e8a3a = 'asset-a|fallback'));
          else {
            if (_0xaa206a === 'text')
              ((_0x2d425b = createReferenceFallbackThumbHtml('text')),
                (_0x2e8a3a = 'asset-t|' + String(_0x385b72.content || _0x385b72.label || '').trim()));
            else return null;
          }
        }
      }
      const _0x10f83c = String(_0x385b72.assetId || ''),
        _0x20f21e = String(_0x385b72.itemIndex ?? ''),
        _0x21510b = String(_0x385b72.assetMentionOccurrence ?? ''),
        _0x1728ec = String(_0x385b72.assetRefSource || 'prompt'),
        _0x49efa9 = 'asset:' + _0x10f83c + ':' + _0x20f21e;
      return {
        key:
          key || 'asset:' + _0x1728ec + ':' + _0x10f83c + ':' + _0x20f21e + ':' + _0xaa206a + ':' + _0x21510b,
        edgeId: '',
        kind: _0xaa206a,
        sourceId: _0x49efa9,
        assetId: _0x10f83c,
        assetIndex: _0x20f21e,
        assetOccurrence: _0x21510b,
        assetRefSource: _0x1728ec,
        refType: _0xaa206a,
        node: _0x385b72.nodeData || null,
        ref: _0x385b72,
        html: _0x2d425b,
        thumbHTML: _0x2d425b,
        sig:
          '' +
          (slot ? slot + '|' : '') +
          _0x49efa9 +
          '|' +
          _0xaa206a +
          '|' +
          String(_0x385b72.url || '') +
          '|' +
          _0x2e8a3a,
        virtual: true,
      };
    }
    ['_createTextEdgeRefThumbData'](_0x5f555e, _0x2b61b1) {
      const _0x11a25e = String(
        _0x2b61b1?.outputText || _0x2b61b1?.text || _0x2b61b1?.content || _0x2b61b1?.prompt || '',
      ).trim();
      if (!_0x11a25e) return null;
      return {
        key: 'edge:' + _0x5f555e.id,
        edgeId: _0x5f555e.id,
        kind: 'text',
        sourceId: _0x5f555e.sourceId,
        html: createReferenceFallbackThumbHtml('text'),
        sig: 'text|' + _0x5f555e.id + '|' + _0x5f555e.sourceId + '|' + _0x11a25e,
      };
    }
    ['_syncFixedTrailingRefItems'](_0x2007a5, _0x3d71d7 = []) {
      if (!_0x2007a5) return;
      const _0x26a0d5 = new Map();
      _0x2007a5
        .querySelectorAll('.rh-fixed-extra-ref')
        .forEach((_0x1dae0c) => _0x26a0d5.set(_0x1dae0c.dataset.refKey, _0x1dae0c));
      const _0x5b0626 = new Set();
      (Array.isArray(_0x3d71d7) ? _0x3d71d7 : []).forEach((_0x568641) => {
        if (!_0x568641?.key) return;
        let _0x46acb6 = _0x26a0d5.get(_0x568641.key);
        (!_0x46acb6 &&
          ((_0x46acb6 = document.createElement('div')),
          (_0x46acb6.className =
            'ref-thumb-wrap rh-v5-ref-box rh-fixed-extra-ref' +
            (_0x568641.virtual ? ' ref-thumb-wrap--asset' : ''))),
          _0x46acb6.setAttribute('draggable', _0x568641.virtual || !_0x568641.edgeId ? 'false' : 'true'),
          _0x46acb6.dataset.sig !== _0x568641.sig &&
            ((_0x46acb6.innerHTML = '' + _0x568641.html + createRefThumbDeleteButtonHtml()),
            (_0x46acb6.dataset.sig = _0x568641.sig),
            _0x9589d(_0x46acb6, _0x568641.sig)),
          (_0x46acb6.dataset.refKey = _0x568641.key),
          (_0x46acb6.dataset.edgeId = _0x568641.edgeId || ''),
          (_0x46acb6.dataset.kind = _0x568641.kind || ''),
          (_0x46acb6.dataset.sourceId = _0x568641.sourceId || ''),
          (_0x46acb6.dataset.refOrigin = _0x568641.virtual ? 'asset' : 'node'),
          _0x568641.virtual
            ? ((_0x46acb6.dataset.assetId = _0x568641.assetId || ''),
              (_0x46acb6.dataset.assetIndex = _0x568641.assetIndex || ''),
              (_0x46acb6.dataset.assetOccurrence = _0x568641.assetOccurrence || ''),
              (_0x46acb6.dataset.assetRefSource = _0x568641.assetRefSource || 'prompt'),
              (_0x46acb6.dataset.refType = _0x568641.refType || _0x568641.kind || ''))
            : (delete _0x46acb6.dataset.assetId,
              delete _0x46acb6.dataset.assetIndex,
              delete _0x46acb6.dataset.assetOccurrence,
              delete _0x46acb6.dataset.assetRefSource,
              delete _0x46acb6.dataset.refType),
          _0x2007a5.appendChild(_0x46acb6),
          _0x5b0626.add(_0x568641.key));
      });
      for (const [_0x39898e, _0x14b89b] of _0x26a0d5.entries()) {
        if (!_0x5b0626.has(_0x39898e)) _0x14b89b.remove();
      }
    }
    ['_getFixedSlotRefThumbObjectUrlMap']() {
      return (
        !this._fixedSlotRefThumbObjectUrls && (this._fixedSlotRefThumbObjectUrls = new Map()),
        this._fixedSlotRefThumbObjectUrls
      );
    }
    ['_clearObjectUrlMap'](_0x3f955d) {
      if (!_0x3f955d || _0x3f955d.size === 0) return;
      for (const _0x406627 of _0x3f955d.values()) {
        _0x406627 && String(_0x406627).startsWith('blob:') && URL.revokeObjectURL(_0x406627);
      }
      _0x3f955d.clear();
    }
    ['_pruneFixedSlotRefThumbObjectUrls'](_0xed1e37 = [], _0x4e5422 = {}) {
      const _0x4bc221 = this._getFixedSlotRefThumbObjectUrlMap(),
        _0x1d95e3 = new Set();
      for (const _0x269f98 of _0xed1e37 || []) {
        const _0x6a4a89 = _0x4e5422?.[_0x269f98?.sourceId];
        if (_0x6a4a89?.thumbId) _0x1d95e3.add(_0x6a4a89.thumbId);
      }
      for (const [_0x17404b, _0x223502] of _0x4bc221.entries()) {
        if (_0x1d95e3.has(_0x17404b)) continue;
        (_0x223502 && String(_0x223502).startsWith('blob:') && URL.revokeObjectURL(_0x223502),
          _0x4bc221.delete(_0x17404b));
      }
    }
    ['_resolveFixedMediaUrl'](_0x2ecd17) {
      const _0x4f808f = String(_0x2ecd17 || '').trim();
      if (!_0x4f808f) return '';
      if (typeof this._resolveMediaUrl === 'function') return this._resolveMediaUrl(_0x4f808f);
      return _0x4f808f;
    }
    async ['_resolveFixedThumbObjectUrl'](_0x2be8fa) {
      const _0x48e3dc = String(_0x2be8fa || '').trim();
      if (!_0x48e3dc) return '';
      const _0x23a6d0 = this._getFixedSlotRefThumbObjectUrlMap();
      if (_0x23a6d0.has(_0x48e3dc)) return _0x23a6d0.get(_0x48e3dc);
      const _0x578c69 = await _0x46ffd3(_0x48e3dc);
      if (!_0x578c69) return '';
      const _0x480490 = URL.createObjectURL(_0x578c69);
      return (_0x23a6d0.set(_0x48e3dc, _0x480490), _0x480490);
    }
    async ['_createFixedEdgeRefThumbData'](_0x85229d, _0x384965, _0x1a9a19, _0x4e2855) {
      const _0xe9e71f = String(_0x1a9a19 || '').trim();
      if (!_0x85229d || !_0x384965 || !_0xe9e71f) return null;
      if (_0xe9e71f === 'text') return this._createTextEdgeRefThumbData(_0x85229d, _0x384965);
      let _0x2df400 = '',
        _0x488dbb = '';
      if (_0xe9e71f === 'image') {
        let _0x47b330 = await this._resolveFixedThumbObjectUrl(_0x384965.thumbId);
        !_0x47b330 && (_0x47b330 = this._resolveFixedMediaUrl(resolveCanvasImageLowZoomUrl(_0x384965)));
        !_0x47b330 &&
          _0x384965.localPath &&
          (_0x47b330 = this._resolveFixedMediaUrl(localPathToUrl(_0x384965.localPath)));
        if (!_0x47b330) return null;
        (_0x3ca8ce(_0x47b330),
          (_0x2df400 =
            '<img src="' +
            _0x47b330 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            createReferenceMaskBadgeHtml(_0x384965)),
          (_0x488dbb = 'i|' + _0x47b330 + '|' + getReferenceMaskSignaturePart(_0x384965)));
      } else {
        if (_0xe9e71f === 'video') {
          const _0x152ce5 = getVideoRefMediaSignature(_0x384965, _0x85229d);
          let _0x5628d6 = await this._resolveFixedThumbObjectUrl(_0x384965.thumbId);
          if (!_0x5628d6) {
            const _0x50ebde = getVideoThumbCandidate(_0x384965, _0x85229d);
            _0x5628d6 = this._resolveFixedMediaUrl(_0x50ebde.thumbUrl || _0x384965.imageUrl || '');
          }
          _0x5628d6
            ? (_0x3ca8ce(_0x5628d6),
              (_0x2df400 =
                '<img src="' + _0x5628d6 + '" class="ref-thumb-media is-pending" draggable="false">'),
              (_0x488dbb = 'v|' + (_0x152ce5 || _0x5628d6)))
            : (_0x4e2855?.(_0x85229d, _0x384965),
              (_0x2df400 = createReferenceFallbackThumbHtml(
                'video',
                'ref-thumb-media rh-v5-ref-media-fallback',
              )),
              (_0x488dbb = 'v|' + (_0x152ce5 || 'fallback')));
        } else {
          if (_0xe9e71f === 'audio') {
            const _0x5fd65b = String(_0x384965.localPath || _0x384965.src || _0x384965.audioUrl || '');
            if (!_0x5fd65b) return null;
            ((_0x2df400 = createRunningHubAudioFallbackThumbHtml()), (_0x488dbb = 'a|' + _0x5fd65b));
          } else return null;
        }
      }
      return {
        key: 'edge:' + _0x85229d.id,
        edgeId: _0x85229d.id,
        kind: _0xe9e71f,
        sourceId: _0x85229d.sourceId,
        node: _0x384965,
        edge: _0x85229d,
        html: _0x2df400,
        thumbHTML: _0x2df400,
        sig: _0x85229d.id + '|' + _0x85229d.sourceId + '|' + _0x488dbb,
      };
    }
    ['_syncFixedSlotEl'](_0x29a5ef, _0x2cdb77, _0xf1ae3c, _0x165983) {
      if (!_0x29a5ef || !_0x2cdb77) return;
      const _0x10a4e9 = String(_0x165983?.slotKindById?.[_0x2cdb77] || '').trim(),
        _0x2e7277 = _0x29a5ef.querySelector('[data-slot="' + _0x2cdb77 + '"]');
      if (!_0xf1ae3c) {
        let _0x12c1a5 =
          _0x2e7277 && _0x2e7277.classList?.contains('ref-upload-slot')
            ? _0x2e7277
            : document.createElement('button');
        ((_0x12c1a5.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
          (_0x12c1a5.type = 'button'),
          _0x12c1a5.setAttribute('draggable', 'false'),
          _0x12c1a5.setAttribute('title', referenceInputText('uploadReference')),
          (_0x12c1a5.dataset.slot = _0x2cdb77),
          (_0x12c1a5.dataset.kind = _0x10a4e9),
          (_0x12c1a5.dataset.edgeId = ''),
          (_0x12c1a5.dataset.sourceId = ''),
          (_0x12c1a5.dataset.refOrigin = ''),
          delete _0x12c1a5.dataset.refKey,
          delete _0x12c1a5.dataset.assetId,
          delete _0x12c1a5.dataset.assetIndex,
          delete _0x12c1a5.dataset.assetOccurrence,
          delete _0x12c1a5.dataset.assetRefSource,
          delete _0x12c1a5.dataset.refType);
        const _0x289a8f = getFixedSlotLabelHtml(_0x165983, _0x2cdb77),
          _0x1715b3 = 'empty|' + _0x2cdb77 + '|' + _0x10a4e9 + '|' + _0x289a8f;
        _0x12c1a5.dataset.sig !== _0x1715b3 &&
          ((_0x12c1a5.innerHTML = '<span class="ref-upload-label">' + _0x289a8f + '</span>'),
          (_0x12c1a5.dataset.sig = _0x1715b3));
        if (_0x2e7277 && _0x2e7277 !== _0x12c1a5) _0x2e7277.replaceWith(_0x12c1a5);
        else {
          if (!_0x2e7277) _0x29a5ef.appendChild(_0x12c1a5);
        }
        return;
      }
      let _0x5a7a42 =
        _0x2e7277 && !_0x2e7277.classList?.contains('ref-upload-slot')
          ? _0x2e7277
          : document.createElement('div');
      ((_0x5a7a42.className =
        'ref-thumb-wrap rh-v5-ref-box' + (_0xf1ae3c.virtual ? ' ref-thumb-wrap--asset' : '')),
        _0x5a7a42.setAttribute('draggable', _0xf1ae3c.virtual || !_0xf1ae3c.edgeId ? 'false' : 'true'));
      const _0x27758d = _0x2cdb77 + '|' + (_0xf1ae3c.sig || '');
      _0x5a7a42.dataset.sig !== _0x27758d &&
        ((_0x5a7a42.innerHTML = '' + _0xf1ae3c.html + createRefThumbDeleteButtonHtml()),
        (_0x5a7a42.dataset.sig = _0x27758d),
        _0x9589d(_0x5a7a42, _0x27758d));
      ((_0x5a7a42.dataset.slot = _0x2cdb77),
        (_0x5a7a42.dataset.kind = _0xf1ae3c.kind || _0x10a4e9),
        (_0x5a7a42.dataset.refKey = _0xf1ae3c.key || (_0xf1ae3c.edgeId ? 'edge:' + _0xf1ae3c.edgeId : '')),
        (_0x5a7a42.dataset.edgeId = _0xf1ae3c.edgeId || ''),
        (_0x5a7a42.dataset.sourceId = _0xf1ae3c.sourceId || ''),
        (_0x5a7a42.dataset.refOrigin = _0xf1ae3c.virtual ? 'asset' : 'node'));
      _0xf1ae3c.virtual
        ? ((_0x5a7a42.dataset.assetId = _0xf1ae3c.assetId || ''),
          (_0x5a7a42.dataset.assetIndex = _0xf1ae3c.assetIndex || ''),
          (_0x5a7a42.dataset.assetOccurrence = _0xf1ae3c.assetOccurrence || ''),
          (_0x5a7a42.dataset.assetRefSource = _0xf1ae3c.assetRefSource || 'prompt'),
          (_0x5a7a42.dataset.refType = _0xf1ae3c.refType || _0xf1ae3c.kind || _0x10a4e9))
        : (delete _0x5a7a42.dataset.assetId,
          delete _0x5a7a42.dataset.assetIndex,
          delete _0x5a7a42.dataset.assetOccurrence,
          delete _0x5a7a42.dataset.assetRefSource,
          delete _0x5a7a42.dataset.refType);
      if (_0x2e7277 && _0x2e7277 !== _0x5a7a42) _0x2e7277.replaceWith(_0x5a7a42);
      else {
        if (!_0x2e7277) _0x29a5ef.appendChild(_0x5a7a42);
      }
    }
    ['_syncFixedSlotOrder'](_0x4c93c9, _0x55eb6b = []) {
      if (!_0x4c93c9) return;
      const _0x2aea0d = _0x4c93c9.querySelector('.rh-fixed-extra-ref');
      (Array.isArray(_0x55eb6b) ? _0x55eb6b : []).forEach((_0x503074) => {
        const _0x4d7b2e = _0x4c93c9.querySelector('[data-slot="' + _0x503074 + '"]');
        if (!_0x4d7b2e) return;
        _0x2aea0d && typeof _0x4c93c9.insertBefore === 'function'
          ? _0x4c93c9.insertBefore(_0x4d7b2e, _0x2aea0d)
          : _0x4c93c9.appendChild(_0x4d7b2e);
      });
    }
    ['_syncSingleReferenceEditorRatio'](_0x16610b, _0x331a68, _0x4f5a47 = {}) {
      const _0x349c4b = resolveFixedInputDisplayRatioSlot(_0x16610b, _0x331a68),
        _0x135e4f = _0x349c4b?.slot || '';
      if (!_0x135e4f || !_0x331a68?.[_0x135e4f]) return;
      const _0x167a04 = getFixedInputRatioMediaSize(_0x331a68[_0x135e4f], _0x4f5a47),
        _0x16523c = calcFixedInputDisplaySize(_0x167a04?.width, _0x167a04?.height);
      if (!_0x16523c) return;
      const _0x5c536a = 0x118,
        _0x4f3b77 = (_0x274c53) => {
          const _0x51063b =
            typeof document !== 'undefined' && typeof document.getElementById === 'function'
              ? document.getElementById(this.nodeId)
              : null;
          if (!_0x51063b) return;
          _0x51063b.classList.add('is-ratio-animating');
          if (this._ratioAnimTimer) clearTimeout(this._ratioAnimTimer);
          this._ratioAnimTimer = setTimeout(() => {
            const _0x2207cb =
              typeof document !== 'undefined' && typeof document.getElementById === 'function'
                ? document.getElementById(this.nodeId)
                : null;
            if (_0x2207cb) _0x2207cb.classList.remove('is-ratio-animating');
            this._ratioAnimTimer = null;
          }, _0x274c53 + 80);
        },
        _0x3d4a17 = _0x2b49c9.getState?.().nodes?.[this.nodeId] || this._data || {},
        _0x44ce97 = Number(_0x3d4a17.width) || 0x12c,
        _0x461d73 = Number(_0x3d4a17.height) || 0x12c,
        _0x2a8c91 = Number.isFinite(Number(_0x3d4a17.x)) ? Number(_0x3d4a17.x) : 0,
        _0x22fdf6 = Number.isFinite(Number(_0x3d4a17.y)) ? Number(_0x3d4a17.y) : 0,
        _0x8e3336 = _0x16523c.width,
        _0x145676 = _0x16523c.height,
        _0x22fd37 = _0x8e3336 - _0x44ce97,
        _0x32beaa = _0x145676 - _0x461d73;
      if (_0x22fd37 !== 0 || _0x32beaa !== 0) _0x4f3b77(_0x5c536a);
      const _0x2b2f79 = {
        width: _0x8e3336,
        height: _0x145676,
        x: Math.round(_0x2a8c91 - _0x22fd37 / 2),
        y: Math.round(_0x22fdf6 - _0x32beaa),
        aspectRatio: '自适应',
      };
      (_0x2b49c9.updateNodeData(this.nodeId, _0x2b2f79), (this._data = { ..._0x3d4a17, ..._0x2b2f79 }));
      const _0x4a4879 = this.footerEl?.querySelector('.img-ratio-label'),
        _0x539eae = this.footerEl?.querySelector('.img-ratio-icon-slot');
      if (_0x4a4879 && _0x349c4b.mode === 'sourceVideoFrames') {
        const _0x4c4182 = normalizeRhV54Fps(this._data?.rhVideoFps),
          _0x2e00b1 = Number.isFinite(this._data?.rhVideoFrames)
            ? Math.max(0, Math.trunc(this._data.rhVideoFrames))
            : 77,
          _0x400a95 = normalizeRhVideoResolution(this._data?.rhVideoResolution),
          _0x1a1c15 = _0x2e00b1 === 0 ? referenceInputText('fullLength') : String(_0x2e00b1);
        _0x4a4879.textContent = referenceInputText('sourceVideoFramesLabel', {
          frames: _0x1a1c15,
          fps: _0x4c4182,
          resolution: _0x400a95,
        });
      }
      _0x539eae &&
        typeof this._getRatioIconHTML === 'function' &&
        (_0x539eae.innerHTML = this._getRatioIconHTML('自适应'));
      if (this.previewEl && typeof this.previewEl.animate === 'function') {
        ((this.previewEl.style.transition = 'none'),
          (this.previewEl.style.transformOrigin = 'bottom center'),
          (this.previewEl.style.transform =
            'scaleX(' + _0x44ce97 / _0x8e3336 + ') scaleY(' + _0x461d73 / _0x145676 + ')'),
          void this.previewEl.offsetWidth);
        if (this._ratioFlipAnim) this._ratioFlipAnim.cancel();
        const _0x205396 = 'scaleX(' + _0x44ce97 / _0x8e3336 + ') scaleY(' + _0x461d73 / _0x145676 + ')';
        this._ratioFlipAnim = this.previewEl.animate([{ transform: _0x205396 }, { transform: 'none' }], {
          duration: _0x5c536a,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards',
        });
        const _0x5c1f52 = () => {
          ((this._ratioFlipAnim = null),
            (this.previewEl.style.transformOrigin = ''),
            (this.previewEl.style.transform = ''));
        };
        ((this._ratioFlipAnim.onfinish = _0x5c1f52), (this._ratioFlipAnim.oncancel = _0x5c1f52));
      }
    }
    async ['_renderManifestFixedRefBar']({
      fixedInputConfig: _0x372ee3,
      inEdges: _0x49a244,
      nodes: _0x36b9fa,
      nodeData: _0x40b3b5,
      attachBtnHTML: _0x44723c,
      ensureVideoThumb: _0x434d08,
    }) {
      const _0x2d584d = (_0x372ee3?.visibleSlots || [])
        .map((_0x4b8294) => String(_0x4b8294 || '').trim())
        .filter(Boolean);
      if (!_0x2d584d.length) return false;
      this._pruneFixedSlotRefThumbObjectUrls(_0x49a244, _0x36b9fa);
      const _0x10e8c3 = new Set(_0x2d584d),
        _0x3d4fc3 = {};
      _0x2d584d.forEach((_0x1d38f9) => {
        _0x3d4fc3[_0x1d38f9] = null;
      });
      const _0x4cee92 = [],
        _0x49deb2 = { text: 0, image: 0, video: 0, audio: 0 },
        _0x5e4c4f = {},
        _0x24bf32 = [];
      for (const _0x1d1b56 of _0x49a244 || []) {
        const _0x18d3ec = _0x36b9fa?.[_0x1d1b56?.sourceId];
        if (!_0x18d3ec) continue;
        const _0x59028c = resolveEffectiveInputKind(_0x18d3ec, _0x1d1b56) || 'image';
        ((_0x49deb2[_0x59028c] = Number(_0x49deb2[_0x59028c] || 0) + 1),
          (_0x5e4c4f[_0x1d1b56.sourceId] =
            '@' + (getFixedRefKindLabel(_0x59028c) || _0x59028c) + _0x49deb2[_0x59028c]));
        if (_0x59028c === 'text') {
          const _0x50cdd6 = this._createTextEdgeRefThumbData(_0x1d1b56, _0x18d3ec);
          if (_0x50cdd6) _0x4cee92.push(_0x50cdd6);
          continue;
        }
        const _0x53ddaf = resolveFixedInputSlotForRef({
            fixedInputConfig: _0x372ee3,
            refSlot: _0x1d1b56?.refSlot,
            kind: _0x59028c,
            occupiedSlots: _0x3d4fc3,
            sourceNode: _0x18d3ec,
          }),
          _0x5f0c3e = _0x53ddaf.slot;
        if (_0x53ddaf.reason === 'kindMismatch') continue;
        if (_0x53ddaf.reason === 'hidden' || _0x53ddaf.reason === 'slotConstraint') {
          if (_0x1d1b56?.id) _0x24bf32.push(_0x1d1b56.id);
          continue;
        }
        if (!_0x5f0c3e || _0x3d4fc3[_0x5f0c3e]) {
          const _0x461026 = await this._createFixedEdgeRefThumbData(
            _0x1d1b56,
            _0x18d3ec,
            _0x59028c,
            _0x434d08,
          );
          if (_0x461026) _0x4cee92.push(_0x461026);
          continue;
        }
        const _0x754115 = await this._createFixedEdgeRefThumbData(_0x1d1b56, _0x18d3ec, _0x59028c, _0x434d08);
        if (_0x754115) _0x3d4fc3[_0x5f0c3e] = _0x754115;
      }
      _0x24bf32.length > 0 &&
        (typeof _0x2b49c9.batch === 'function'
          ? _0x2b49c9.batch(() => {
              _0x24bf32.forEach((_0x55ceb1) => _0x2b49c9.removeEdge(_0x55ceb1));
            })
          : _0x24bf32.forEach((_0x5d5d44) => _0x2b49c9.removeEdge(_0x5d5d44)));
      const _0x156af7 = new Set(
          Object.entries(_0x3d4fc3)
            .filter(([, _0x5e7863]) => !!_0x5e7863)
            .map(([_0x51bed7]) => _0x51bed7),
        ),
        _0x36beba = buildFixedInputAssetSlotMap(this.promptEl, {
          slotOrderByType: _0x372ee3?.slotOrderByType || {},
          visibleSlots: _0x2d584d,
          exclusiveGroups: _0x372ee3?.exclusiveGroups || [],
          slotById: _0x372ee3?.slotById || {},
          occupiedSlots: _0x156af7,
          nodeData: _0x40b3b5,
        });
      (_0x2d584d.forEach((_0x5b0283) => {
        if (_0x3d4fc3[_0x5b0283]) return;
        const _0x4af6da = this._createAssetRefThumbData(_0x36beba[_0x5b0283], { slot: _0x5b0283 });
        if (_0x4af6da) _0x3d4fc3[_0x5b0283] = _0x4af6da;
      }),
        getAssetInputRefsFromPrompt(this.promptEl, { allowedTypes: ['text'] }).forEach(
          (_0x384c29, _0xa59229) => {
            const _0x41638b = this._createAssetRefThumbData(_0x384c29, {
              key:
                'asset-text:' +
                String(_0x384c29.assetId || '') +
                ':' +
                String(_0x384c29.itemIndex ?? '') +
                ':' +
                _0xa59229,
            });
            if (_0x41638b) _0x4cee92.push(_0x41638b);
          },
        ),
        this.refBarEl.classList.add('active', 'rh-v5-refbar'));
      let _0x47701c = this.refBarEl.querySelector('.rh-v5-ref-container');
      const _0x309674 = !_0x47701c || !this.refBarEl.querySelector('.prompt-attachment-btn');
      if (_0x309674) {
        const _0x3afa72 =
            String(_0x372ee3?.manifest?.displayName || '').trim() ||
            String(_0x372ee3?.manifest?.label || '').trim() ||
            referenceInputText('fixedInputs'),
          _0x5c30cb = _0x2d584d
            .map((_0x5233b9) => {
              const _0x3dee74 = String(_0x372ee3?.slotKindById?.[_0x5233b9] || '');
              return (
                '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
                escapeHtmlAttr(_0x5233b9) +
                '" data-kind="' +
                escapeHtmlAttr(_0x3dee74) +
                '" title="' +
                escapeHtmlAttr(referenceInputText('uploadReference')) +
                '"><span class="ref-upload-label">' +
                getFixedSlotLabelHtml(_0x372ee3, _0x5233b9) +
                '</span></button>'
              );
            })
            .join('');
        ((this.refBarEl.innerHTML =
          _0x44723c +
          ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
          escapeHtmlAttr(referenceInputText('fixedInputsAria', { label: _0x3afa72 })) +
          '">' +
          _0x5c30cb +
          '</div>'),
          (_0x47701c = this.refBarEl.querySelector('.rh-v5-ref-container')));
      } else {
        const _0x4b1689 =
          String(_0x372ee3?.manifest?.displayName || '').trim() ||
          String(_0x372ee3?.manifest?.label || '').trim() ||
          referenceInputText('fixedInputs');
        _0x47701c.setAttribute('aria-label', referenceInputText('fixedInputsAria', { label: _0x4b1689 }));
      }
      const _0x2bcc80 = Array.from(_0x47701c?.querySelectorAll?.('[data-slot]') || []).filter(
        (_0x3bd812) => !_0x10e8c3.has(String(_0x3bd812?.dataset?.slot || '')),
      );
      return (
        _0x2bcc80.forEach((_0x1b6e5a) => _0x1b6e5a.remove()),
        _0x2d584d.forEach((_0x466a8d) => {
          this._syncFixedSlotEl(_0x47701c, _0x466a8d, _0x3d4fc3[_0x466a8d], _0x372ee3);
        }),
        this._syncFixedSlotOrder(_0x47701c, _0x2d584d),
        this._syncFixedTrailingRefItems(_0x47701c, _0x4cee92),
        this._bindFixedSlotDragSwap(_0x47701c, getFixedSlotAcceptMap(_0x372ee3)),
        this._syncSingleReferenceEditorRatio(_0x372ee3, _0x3d4fc3, _0x36b9fa),
        this._syncBtnIconState(),
        _0xd25a29(this, _0x5e4c4f),
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
      const _0x404dcb = _0x2b49c9.getIncomingEdges(this.nodeId),
        _0x24204c = _0x2b49c9.getState().nodes,
        _0x5b309e = _0x24204c?.[this.nodeId] || this._data || null,
        _0x4a4c02 = getFixedInputSlotConfigFromManifest(_0x5b309e || {}),
        _0x53ffad = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' }),
        _0x17decc = (_0x5b1965, _0x219ea6) => {
          const _0x2c3e62 = String(_0x5b1965?.sourceId || '');
          if (!_0x2c3e62) return;
          const _0x2e4a65 = String(_0x5b1965?.refSlot || 'sourceVideo'),
            _0x37d27b = getVideoSourcePathForThumb(_0x219ea6, _0x5b1965);
          if (!_0x37d27b) return;
          if (!(_0x37d27b.startsWith('/output/') || _0x37d27b.startsWith('/data/'))) return;
          const _0x433b44 = (() => {
            if (String(_0x219ea6?.type || '') === 'ai-video') {
              const _0xd70a66 = getVideoItemByEdge(_0x219ea6, _0x5b1965);
              return String(_0xd70a66?.item?.videoThumbUnavailableSource || '').trim();
            }
            return String(_0x219ea6?.videoThumbUnavailableSource || '').trim();
          })();
          if (_0x433b44 === _0x37d27b) return;
          const _0x65af57 = _0x2e4a65 + '|' + _0x2c3e62 + '|' + _0x37d27b;
          if (this._videoThumbPending.has(_0x65af57)) return;
          (this._videoThumbPending.add(_0x65af57),
            _0x50c6b2
              .fetchVideoFirstFrameThumbFromServer(_0x37d27b, {
                nodeId: _0x2c3e62,
                assetId: String(_0x5b1965?.sourceMediaKey || _0x5b1965?.id || ''),
              })
              .then((_0x2d8829) => {
                const _0x4f7ec6 = String(_0x2d8829?.url || '').trim();
                if (!_0x4f7ec6) return;
                const _0x4a3a0d = _0x2b49c9.getState(),
                  _0x5a10fd = _0x4a3a0d.nodes?.[_0x2c3e62];
                if (!_0x5a10fd) return;
                if (String(_0x5a10fd.type || '') === 'ai-video') {
                  const _0x3abf53 = getVideoItemByEdge(_0x5a10fd, _0x5b1965),
                    _0x21081b = Number(_0x3abf53.index),
                    _0xa467bc = Array.isArray(_0x5a10fd.videos) ? _0x5a10fd.videos : [];
                  if (!(_0x21081b >= 0 && _0x21081b < _0xa467bc.length)) return;
                  const _0x19b3d1 = _0xa467bc[_0x21081b] || null;
                  if (!_0x19b3d1 || typeof _0x19b3d1 !== 'object') return;
                  if (String(_0x19b3d1.thumbUrl || '').trim()) return;
                  const _0x1846e5 = { ..._0x19b3d1, thumbUrl: _0x4f7ec6, videoThumbUnavailableSource: '' },
                    _0x25cb46 = _0xa467bc.slice();
                  _0x25cb46[_0x21081b] = _0x1846e5;
                  const _0x374c33 = { videos: _0x25cb46 },
                    _0x21f4e3 = Number(_0x5a10fd.mainVideoIndex),
                    _0x58dd1e = Number.isFinite(_0x21f4e3) ? Math.max(0, Math.trunc(_0x21f4e3)) : 0;
                  if (_0x21081b === _0x58dd1e) _0x374c33.videoThumbUnavailableSource = '';
                  if (_0x21081b === _0x58dd1e && !String(_0x5a10fd.thumbUrl || '').trim())
                    _0x374c33.thumbUrl = _0x4f7ec6;
                  _0x2b49c9.updateNodeData(_0x2c3e62, _0x374c33);
                } else {
                  if (String(_0x5a10fd.thumbUrl || '').trim()) return;
                  _0x2b49c9.updateNodeData(_0x2c3e62, {
                    thumbUrl: _0x4f7ec6,
                    videoThumbUnavailableSource: '',
                  });
                }
              })
              .catch(() => {
                const _0xd4813 = _0x2b49c9.getState(),
                  _0x5c70fe = _0xd4813.nodes?.[_0x2c3e62];
                if (!_0x5c70fe) return;
                if (getVideoSourcePathForThumb(_0x5c70fe, _0x5b1965) !== _0x37d27b) return;
                if (String(_0x5c70fe.type || '') === 'ai-video') {
                  const _0x130532 = getVideoItemByEdge(_0x5c70fe, _0x5b1965),
                    _0x22bd1f = Number(_0x130532.index),
                    _0x655fbd = Array.isArray(_0x5c70fe.videos) ? _0x5c70fe.videos : [];
                  if (!(_0x22bd1f >= 0 && _0x22bd1f < _0x655fbd.length)) return;
                  const _0x1364f7 = _0x655fbd[_0x22bd1f] || null;
                  if (!_0x1364f7 || typeof _0x1364f7 !== 'object') return;
                  const _0x5bd2a2 = _0x655fbd.slice();
                  _0x5bd2a2[_0x22bd1f] = {
                    ..._0x1364f7,
                    videoThumbUnavailableSource: _0x37d27b,
                    thumbUrl: '',
                  };
                  const _0x483871 = { videos: _0x5bd2a2 },
                    _0x342149 = Number(_0x5c70fe.mainVideoIndex),
                    _0x4586ff = Number.isFinite(_0x342149) ? Math.max(0, Math.trunc(_0x342149)) : 0;
                  (_0x22bd1f === _0x4586ff &&
                    ((_0x483871.videoThumbUnavailableSource = _0x37d27b), (_0x483871.thumbUrl = '')),
                    _0x2b49c9.updateNodeData(_0x2c3e62, _0x483871));
                } else
                  _0x2b49c9.updateNodeData(_0x2c3e62, {
                    videoThumbUnavailableSource: _0x37d27b,
                    thumbUrl: '',
                  });
              })
              .finally(() => {
                this._videoThumbPending.delete(_0x65af57);
              }));
        },
        _0x4bd56c = getFixedRefBarLayoutKey(_0x4a4c02);
      this._refBarLayoutKey !== _0x4bd56c &&
        ((this._refBarLayoutKey = _0x4bd56c),
        this.refBarEl.classList.remove('active', 'rh-v5-refbar'),
        (this.refBarEl.innerHTML = ''),
        !_0x4a4c02 && this._clearObjectUrlMap(this._getFixedSlotRefThumbObjectUrlMap()),
        _0x4bd56c !== 'generic' && this._clearObjectUrlMap(this._refThumbObjectUrls));
      if (_0x4a4c02) {
        await this._renderManifestFixedRefBar({
          fixedInputConfig: _0x4a4c02,
          inEdges: _0x404dcb,
          nodes: _0x24204c,
          nodeData: _0x5b309e,
          attachBtnHTML: _0x53ffad,
          ensureVideoThumb: _0x17decc,
        });
        return;
      }
      const _0x3a26d8 = getAssetInputRefsFromPromptAndNode(this.promptEl, {
        nodeData: _0x5b309e,
        allowedTypes: ['text', 'image', 'video', 'audio'],
      });
      if (_0x404dcb.length === 0 && _0x3a26d8.length === 0) {
        (this.refBarEl.classList.remove('rh-v5-refbar'),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = _0x53ffad),
          this._syncBtnIconState(),
          _0xd25a29(this, {}));
        return;
      }
      const _0x15d987 = new Set();
      for (const _0x2ee1de of _0x404dcb) {
        const _0xf982b3 = _0x24204c?.[_0x2ee1de.sourceId];
        if (_0xf982b3?.thumbId) _0x15d987.add(_0xf982b3.thumbId);
      }
      for (const [_0x188f54, _0x51321e] of this._refThumbObjectUrls.entries()) {
        !_0x15d987.has(_0x188f54) &&
          (_0x51321e && String(_0x51321e).startsWith('blob:') && URL.revokeObjectURL(_0x51321e),
          this._refThumbObjectUrls.delete(_0x188f54));
      }
      let _0x1c7426 = [];
      const _0xfee9ad = { text: 0, image: 0, video: 0, audio: 0 },
        _0x5a20f2 = {},
        _0x1bf1dd = {
          text: referenceInputText('kind.text'),
          image: referenceInputText('kind.image'),
          video: referenceInputText('kind.video'),
          audio: referenceInputText('kind.audio'),
        };
      for (const _0x1a5b74 of _0x404dcb) {
        const _0x1c8984 = _0x24204c[_0x1a5b74.sourceId];
        if (!_0x1c8984) continue;
        const _0xe923c1 = resolveEffectiveInputKind(_0x1c8984, _0x1a5b74) || 'image';
        if (_0xe923c1 === 'text') {
          const _0x19a777 = String(
            _0x1c8984.outputText || _0x1c8984.text || _0x1c8984.content || _0x1c8984.prompt || '',
          ).trim();
          if (!_0x19a777) continue;
        } else {
          if (_0xe923c1 === 'image') {
            const _0xa98f23 =
              !!_0x1c8984.thumbId ||
              !!_0x1c8984.thumbUrl ||
              !!_0x1c8984.imageUrl ||
              !!_0x1c8984.src ||
              !!_0x1c8984.localPath;
            if (!_0xa98f23) continue;
          } else {
            if (_0xe923c1 === 'video') {
              const _0x41ec7a =
                (Array.isArray(_0x1c8984.videos) && _0x1c8984.videos.length > 0) ||
                !!_0x1c8984.thumbId ||
                !!_0x1c8984.thumbUrl ||
                !!_0x1c8984.videoUrl ||
                !!_0x1c8984.displayLocalPath ||
                !!_0x1c8984.originalLocalPath ||
                !!_0x1c8984.videoLocalPath ||
                !!_0x1c8984.src ||
                !!_0x1c8984.localPath ||
                !!_0x1c8984.url ||
                !!_0x1c8984.resultUrl ||
                !!_0x1c8984.sourceUrl;
              if (!_0x41ec7a) continue;
            } else {
              if (_0xe923c1 === 'audio') {
                const _0x35c5a1 = !!_0x1c8984.audioUrl || !!_0x1c8984.src || !!_0x1c8984.localPath;
                if (!_0x35c5a1) continue;
              }
            }
          }
        }
        let _0x32bf41 = '',
          _0x38c83f = '';
        if (_0xe923c1 === 'image') {
          let _0x542876 = '';
          if (_0x1c8984.thumbId) {
            if (this._refThumbObjectUrls.has(_0x1c8984.thumbId))
              _0x542876 = this._refThumbObjectUrls.get(_0x1c8984.thumbId);
            else {
              const _0x42b8bc = await _0x46ffd3(_0x1c8984.thumbId);
              if (_0x42b8bc) {
                const _0x119293 = URL.createObjectURL(_0x42b8bc);
                (this._refThumbObjectUrls.set(_0x1c8984.thumbId, _0x119293), (_0x542876 = _0x119293));
              }
            }
          }
          !_0x542876 && (_0x542876 = this._resolveMediaUrl(resolveCanvasImageLowZoomUrl(_0x1c8984)));
          !_0x542876 &&
            _0x1c8984.localPath &&
            (_0x542876 = this._resolveMediaUrl(localPathToUrl(_0x1c8984.localPath)));
          if (!_0x542876) continue;
          (_0x3ca8ce(_0x542876),
            (_0x32bf41 =
              '<img src="' +
              _0x542876 +
              '" class="ref-thumb-media is-pending" draggable="false">' +
              createReferenceMaskBadgeHtml(_0x1c8984)),
            (_0x38c83f = 'i|' + _0x542876 + '|' + getReferenceMaskSignaturePart(_0x1c8984)));
        } else {
          if (_0xe923c1 === 'video') {
            const _0x1d6719 = getVideoThumbCandidate(_0x1c8984, _0x1a5b74),
              _0x40a485 = this._resolveMediaUrl(_0x1d6719.thumbUrl || _0x1c8984.imageUrl || '');
            _0x40a485
              ? (_0x3ca8ce(_0x40a485),
                (_0x32bf41 =
                  '<img src="' + _0x40a485 + '" class="ref-thumb-media is-pending" draggable="false">'),
                (_0x38c83f = 'v|' + _0x40a485))
              : (_0x17decc(_0x1a5b74, _0x1c8984),
                (_0x32bf41 =
                  '<div class="ref-thumb-media" style="background:var(--bg-node);display:flex;align-items:center;justify-content:center;">\n                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n                </div>'),
                (_0x38c83f = 'v|fallback'));
          } else
            ((_0x32bf41 = createReferenceFallbackThumbHtml(_0xe923c1)),
              (_0x38c83f = _0xe923c1 + '|fallback'));
        }
        _0xfee9ad[_0xe923c1]++;
        const _0x1a2e28 = '@' + _0x1bf1dd[_0xe923c1] + _0xfee9ad[_0xe923c1];
        _0x5a20f2[_0x1a5b74.sourceId] = _0x1a2e28;
        const _0x5bfeb2 = _0x1a5b74.id + '|' + _0x1a5b74.sourceId + '|' + _0x38c83f;
        _0x1c7426.push({
          key: 'edge:' + _0x1a5b74.id,
          edgeId: _0x1a5b74.id,
          sourceId: _0x1a5b74.sourceId,
          sig: _0x5bfeb2,
          thumbHTML: _0x32bf41,
        });
      }
      _0x3a26d8.forEach((_0x26f33f, _0x2b970d) => {
        const _0x3e7f96 = String(_0x26f33f?.type || '').trim();
        if (!_0x3e7f96) return;
        let _0x1df164 = '',
          _0x5cd581 = '';
        if (_0x3e7f96 === 'image') {
          const _0x2f2fc9 = this._resolveMediaUrl(_0x26f33f.thumbUrl || _0x26f33f.url || '');
          if (!_0x2f2fc9) return;
          (_0x3ca8ce(_0x2f2fc9),
            (_0x1df164 =
              '<img src="' + _0x2f2fc9 + '" class="ref-thumb-media is-pending" draggable="false">'),
            (_0x5cd581 = 'asset-i|' + _0x2f2fc9));
        } else {
          if (_0x3e7f96 === 'video') {
            const _0x538e12 = this._resolveMediaUrl(_0x26f33f.thumbUrl || '');
            _0x538e12
              ? (_0x3ca8ce(_0x538e12),
                (_0x1df164 =
                  '<img src="' + _0x538e12 + '" class="ref-thumb-media is-pending" draggable="false">'),
                (_0x5cd581 = 'asset-v|' + _0x538e12))
              : ((_0x1df164 = createReferenceFallbackThumbHtml('video')), (_0x5cd581 = 'asset-v|fallback'));
          } else
            ((_0x1df164 = createReferenceFallbackThumbHtml(_0x3e7f96)),
              (_0x5cd581 = 'asset-' + _0x3e7f96 + '|fallback'));
        }
        const _0x31d4cd = String(_0x26f33f.assetId || ''),
          _0x33fe67 = String(_0x26f33f.itemIndex ?? ''),
          _0x3de94e = String(_0x26f33f.assetMentionOccurrence ?? ''),
          _0x21bd7e = String(_0x26f33f.assetRefSource || 'prompt'),
          _0x2f04d3 = 'asset:' + _0x31d4cd + ':' + _0x33fe67;
        _0x1c7426.push({
          key: 'asset:' + _0x31d4cd + ':' + _0x33fe67 + ':' + _0x3e7f96 + ':' + _0x2b970d,
          edgeId: '',
          sourceId: _0x2f04d3,
          sig: _0x2f04d3 + '|' + _0x3e7f96 + '|' + String(_0x26f33f.url || '') + '|' + _0x5cd581,
          thumbHTML: _0x1df164,
          virtual: true,
          assetId: _0x31d4cd,
          assetIndex: _0x33fe67,
          assetOccurrence: _0x3de94e,
          assetRefSource: _0x21bd7e,
          refType: _0x3e7f96,
        });
      });
      if (_0x1c7426.length === 0) {
        (this.refBarEl.classList.remove('rh-v5-refbar'),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = _0x53ffad),
          this._syncBtnIconState(),
          _0xd25a29(this, {}));
        return;
      }
      if (this._isDraggingSorting) {
        (this._syncBtnIconState(), _0xd25a29(this, _0x5a20f2));
        return;
      }
      (this.refBarEl.classList.remove('rh-v5-refbar'), this.refBarEl.classList.add('active'));
      let _0x5ce106 = this.refBarEl.querySelector('.ref-thumb-container');
      (!this.refBarEl.querySelector('.prompt-attachment-btn') || !_0x5ce106) &&
        ((this.refBarEl.innerHTML = _0x53ffad + ' <div class="ref-thumb-container"></div>'),
        (_0x5ce106 = this.refBarEl.querySelector('.ref-thumb-container')));
      const _0x4224dd = new Map();
      _0x5ce106
        .querySelectorAll('.ref-thumb-wrap')
        .forEach((_0x3f47a5) =>
          _0x4224dd.set(_0x3f47a5.dataset.refKey || 'edge:' + _0x3f47a5.dataset.edgeId, _0x3f47a5),
        );
      const _0x4e185e = new Set();
      for (let _0xcdeb93 = 0; _0xcdeb93 < _0x1c7426.length; _0xcdeb93++) {
        const _0x44f58b = _0x1c7426[_0xcdeb93];
        let _0x3837e0 = _0x4224dd.get(_0x44f58b.key);
        (!_0x3837e0 &&
          ((_0x3837e0 = document.createElement('div')),
          (_0x3837e0.className = 'ref-thumb-wrap' + (_0x44f58b.virtual ? ' ref-thumb-wrap--asset' : ''))),
          _0x3837e0.setAttribute('draggable', _0x44f58b.virtual ? 'false' : 'true'),
          _0x3837e0.dataset.sig !== _0x44f58b.sig &&
            ((_0x3837e0.innerHTML = '' + _0x44f58b.thumbHTML + createRefThumbDeleteButtonHtml()),
            (_0x3837e0.dataset.sig = _0x44f58b.sig),
            _0x9589d(_0x3837e0, _0x44f58b.sig)),
          (_0x3837e0.dataset.refKey = _0x44f58b.key),
          (_0x3837e0.dataset.edgeId = _0x44f58b.edgeId),
          (_0x3837e0.dataset.sourceId = _0x44f58b.sourceId),
          (_0x3837e0.dataset.refOrigin = _0x44f58b.virtual ? 'asset' : 'node'),
          _0x44f58b.virtual
            ? ((_0x3837e0.dataset.assetId = _0x44f58b.assetId || ''),
              (_0x3837e0.dataset.assetIndex = _0x44f58b.assetIndex || ''),
              (_0x3837e0.dataset.assetOccurrence = _0x44f58b.assetOccurrence || ''),
              (_0x3837e0.dataset.assetRefSource = _0x44f58b.assetRefSource || 'prompt'),
              (_0x3837e0.dataset.refType = _0x44f58b.refType || ''))
            : (delete _0x3837e0.dataset.assetId,
              delete _0x3837e0.dataset.assetIndex,
              delete _0x3837e0.dataset.assetOccurrence,
              delete _0x3837e0.dataset.assetRefSource,
              delete _0x3837e0.dataset.refType),
          _0x5ce106.appendChild(_0x3837e0),
          _0x4e185e.add(_0x44f58b.key));
      }
      for (const [_0x3aa90b, _0x22720f] of _0x4224dd.entries()) {
        if (!_0x4e185e.has(_0x3aa90b)) _0x22720f.remove();
      }
      (this._bindDragSort(this.refBarEl), this._syncBtnIconState(), _0xd25a29(this, _0x5a20f2));
    }
    ['_bindFixedSlotDragSwap'](_0x350416, _0x3adc25) {
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: _0x350416,
        store: _0x2b49c9,
        nodeId: this.nodeId,
        acceptMap: _0x3adc25,
      });
    }
    ['_bindDragSort'](_0x469190) {
      bindRefThumbOrderDrag({ owner: this, container: _0x469190, store: _0x2b49c9, nodeId: this.nodeId });
    }
  }
  return _0x21ad33.prototype;
}
