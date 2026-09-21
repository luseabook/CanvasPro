import {
  RH_VIDEO_BASIC_EXECUTION_ID,
  RH_VIDEO_BASIC_MODEL_ID,
  RH_VIDEO_LIPSYNC_EXECUTION_ID,
  RH_VIDEO_LTX23_EXECUTION_ID,
  resolveModelExecution,
} from '../../manifests/index.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  getRunningHubVideoParameterPanelPolicy,
  getPlainGenerationParams,
} from './runningHubVideoUiSchema.js';
import {
  buildFixedInputAssetSlotMapFromRefs,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { resolveAudioDurationSec } from '../../services/audioMetadataService.js';
import { t } from '../../i18n/index.js';
function runningHubVideoSubmitText(_0x1e6e6b, _0x57b530 = {}) {
  return t('runningHubVideoSubmit.' + _0x1e6e6b, _0x57b530);
}
const RH_STANDARD_FPS_OPTIONS = Object.freeze([16, 24]),
  RH_V54_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 0x340,
  RH_VIDEO_V54_PAYLOAD_RESOLVER = 'runninghubVideoV54';
function normalizeRhStandardFps(_0x406cfe) {
  const _0x480144 = Number(_0x406cfe);
  return RH_STANDARD_FPS_OPTIONS.includes(_0x480144) ? _0x480144 : 24;
}
function normalizeRhV54Fps(_0x36e1d4) {
  const _0x1e957e = Number(_0x36e1d4);
  return RH_V54_FPS_OPTIONS.includes(_0x1e957e) ? _0x1e957e : 24;
}
function normalizeRhVideoResolution(_0x9df380) {
  const _0x290f34 = Number(_0x9df380);
  return Number.isFinite(_0x290f34)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(_0x290f34))
    : RH_MIN_VIDEO_RESOLUTION;
}
function getRunningHubVideoExecution(_0x2b2abe) {
  try {
    return resolveModelExecution(_0x2b2abe)?.executionManifest || null;
  } catch {
    return null;
  }
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return RH_VIDEO_BASIC_MODEL_ID;
}
export function shouldScopeRunningHubVideoSubmitEdges(_0xafa6fb = {}) {
  const _0x54c27b = getRunningHubVideoParameterPanelPolicy(_0xafa6fb?.model);
  return _0x54c27b?.submitScopeTargetEdges === true;
}
function getUrlForFixedSlot(_0x4a1fa0, _0x5b46e9, _0x1e53b7, _0x2fd1d4, _0x35fdce) {
  if (_0x4a1fa0 === 'maskImage') return _0x35fdce.getMaskImageUrl?.(_0x1e53b7, _0x2fd1d4) || '';
  if (_0x5b46e9 === 'video') return _0x35fdce.getVideoUrl(_0x1e53b7, _0x2fd1d4);
  if (_0x5b46e9 === 'image') return _0x35fdce.getImageUrl(_0x1e53b7);
  if (_0x5b46e9 === 'audio') return _0x35fdce.getAudioUrl(_0x1e53b7);
  return '';
}
function assignSlotPayload(_0x30d6ab, _0x2dd5c0, _0x26788e) {
  const _0x3221cc = String(_0x26788e?.url || '').trim();
  if (!_0x3221cc) return;
  if (_0x2dd5c0 === 'sourceVideo' && !_0x30d6ab.videoUrl) _0x30d6ab.videoUrl = _0x3221cc;
  else {
    if (_0x2dd5c0 === 'refImage') _0x30d6ab.inputUrls = [_0x3221cc];
    else {
      if (_0x2dd5c0 === 'referenceVideo' && !_0x30d6ab.referenceVideoUrl)
        _0x30d6ab.referenceVideoUrl = _0x3221cc;
      else {
        if (_0x2dd5c0 === 'maskImage' && !_0x30d6ab.maskImageDataUrl) _0x30d6ab.maskImageDataUrl = _0x3221cc;
        else {
          if (_0x2dd5c0 === 'audio' && !_0x30d6ab.audioUrl) _0x30d6ab.audioUrl = _0x3221cc;
          else {
            if (_0x2dd5c0 === 'firstFrame' && !_0x30d6ab.firstFrameUrl) _0x30d6ab.firstFrameUrl = _0x3221cc;
            else {
              if (_0x2dd5c0 === 'videoMask' && !_0x30d6ab.maskVideoUrl) _0x30d6ab.maskVideoUrl = _0x3221cc;
            }
          }
        }
      }
    }
  }
}
function resolveBerniniVideoReplaceInputMode(_0x3cdc47 = {}) {
  const _0x3386af = !!_0x3cdc47.sourceVideo?.url,
    _0x4a27f2 = !!_0x3cdc47.refImage?.url,
    _0x123fe7 = !!_0x3cdc47.referenceVideo?.url;
  if (_0x3386af && _0x123fe7) return 'videoVideo';
  if (_0x3386af && _0x4a27f2) return 'videoImage';
  if (_0x3386af) return 'video';
  if (_0x4a27f2) return 'image';
  return 'none';
}
function resolveBerniniFunctionForInputMode(_0x490c45, _0x4372de = '') {
  const _0x2bdc39 = {
      image: ['i2v', 'r2v'],
      video: ['v2v', 'mv2v'],
      videoImage: ['vi2v', 'rv2v', 'vrc2v'],
      videoVideo: ['ads2v'],
    },
    _0x4b19a2 = _0x2bdc39[_0x490c45] || [],
    _0x37a87d = String(_0x4372de || '').trim();
  if (_0x4b19a2.includes(_0x37a87d)) return _0x37a87d;
  return _0x4b19a2[0] || '';
}
function buildBerniniFixedSlotPayloadPatch(_0x3e90b5 = {}) {
  const _0x29e51b = {};
  (assignSlotPayload(_0x29e51b, 'sourceVideo', _0x3e90b5.sourceVideo),
    assignSlotPayload(_0x29e51b, 'refImage', _0x3e90b5.refImage),
    assignSlotPayload(_0x29e51b, 'referenceVideo', _0x3e90b5.referenceVideo));
  if (!_0x3e90b5.refImage?.url) _0x29e51b.inputUrls = [];
  return _0x29e51b;
}
export function buildRunningHubVideoFixedSlotSummaryPatch({
  model: _0x165ab1,
  nodeData: nodeData = {},
  slotEntries: slotEntries = {},
} = {}) {
  const _0x307c37 = String(_0x165ab1 || nodeData?.model || '').trim(),
    _0x3f1b51 = getRunningHubVideoParameterPanelPolicy(_0x307c37),
    _0x3e3cb3 = _0x3f1b51?.fixedSlotSummary;
  if (!_0x3e3cb3 || typeof _0x3e3cb3 !== 'object' || Array.isArray(_0x3e3cb3)) return {};
  const _0xcf53a1 = String(_0x3e3cb3.field || '').trim();
  if (!_0xcf53a1) return {};
  let _0x1ac629 = '';
  _0x3e3cb3.resolver === 'berniniVideoReplaceInputMode' &&
    (_0x1ac629 = resolveBerniniVideoReplaceInputMode(slotEntries));
  if (!_0x1ac629) return {};
  const _0x1014fb = { [_0xcf53a1]: _0x1ac629 },
    _0x2a1a31 = resolveBerniniFunctionForInputMode(
      _0x1ac629,
      nodeData?.generationParams?.rhBerniniFunction ?? nodeData?.rhBerniniFunction,
    );
  if (_0x2a1a31) _0x1014fb.rhBerniniFunction = _0x2a1a31;
  return _0x1014fb;
}
function resolveManifestFixedSlotInputs({
  nodeData: _0x53082d,
  inEdges: _0x24fe15,
  nodes: _0x55b6fe,
  assetInputRefs: _0x57ee86,
  helpers: _0x2ab0e2,
}) {
  const _0x1c440c = getFixedInputSlotConfigFromManifest(_0x53082d || {});
  if (!_0x1c440c) return { config: null, slotEntries: {} };
  const _0x583507 = {};
  for (const _0x31bf2a of _0x24fe15 || []) {
    const _0x2aee4d = _0x55b6fe?.[_0x31bf2a?.sourceId];
    if (!_0x2aee4d) continue;
    const _0x47c79a = String(resolveEffectiveInputKind(_0x2aee4d, _0x31bf2a) || ''),
      { slot: _0x500b42 } = resolveFixedInputSlotForRef({
        fixedInputConfig: _0x1c440c,
        refSlot: _0x31bf2a?.refSlot,
        kind: _0x47c79a,
        occupiedSlots: _0x583507,
        sourceNode: _0x2aee4d,
      });
    if (!_0x500b42 || _0x583507[_0x500b42]) continue;
    const _0x531c4d = String(_0x1c440c.slotKindById?.[_0x500b42] || ''),
      _0x5f597a = getUrlForFixedSlot(_0x500b42, _0x531c4d, _0x2aee4d, _0x31bf2a, _0x2ab0e2);
    _0x5f597a && (_0x583507[_0x500b42] = { url: _0x5f597a, node: _0x2aee4d, edge: _0x31bf2a });
  }
  const _0x47a911 = new Set(Object.keys(_0x583507)),
    _0x208763 = buildFixedInputAssetSlotMapFromRefs(_0x57ee86, {
      slotOrderByType: _0x1c440c.slotOrderByType,
      visibleSlots: _0x1c440c.visibleSlots,
      exclusiveGroups: _0x1c440c.exclusiveGroups,
      slotById: _0x1c440c.slotById,
      occupiedSlots: _0x47a911,
    });
  return (
    Object.entries(_0x208763).forEach(([_0x57f272, _0xd3f020]) => {
      const _0x2fb4ff =
        _0x57f272 === 'maskImage'
          ? _0x2ab0e2.getMaskImageUrl?.(_0xd3f020?.nodeData || _0xd3f020, _0xd3f020) || ''
          : String(_0xd3f020?.url || '').trim();
      !_0x583507[_0x57f272] &&
        _0x2fb4ff &&
        (_0x583507[_0x57f272] = { url: _0x2fb4ff, node: _0xd3f020.nodeData || null, ref: _0xd3f020 });
    }),
    { config: _0x1c440c, slotEntries: _0x583507 }
  );
}
function fixedInputConfigHasImageSlot(_0x147f3b = {}) {
  return Object.values(_0x147f3b?.slotKindById || {}).some(
    (_0x13c194) => String(_0x13c194 || '') === 'image',
  );
}
function buildGenericFixedSlotPayloadPatchFromEntries(_0x2bec9a = {}, _0x2ebdcd = null) {
  const _0x1ab344 = {};
  return (
    Object.entries(_0x2bec9a).forEach(([_0x1666b3, _0x4c9775]) => {
      assignSlotPayload(_0x1ab344, _0x1666b3, _0x4c9775);
    }),
    !Object.hasOwn(_0x1ab344, 'inputUrls') &&
      fixedInputConfigHasImageSlot(_0x2ebdcd) &&
      (_0x1ab344.inputUrls = []),
    _0x1ab344
  );
}
function edgeTimeKey(_0x5e3cf3) {
  const _0x3c0bd3 = Number(_0x5e3cf3?.createdAt);
  if (Number.isFinite(_0x3c0bd3) && _0x3c0bd3 > 0) return _0x3c0bd3;
  const _0x205d63 = String(_0x5e3cf3?.id || ''),
    _0x54e7da = _0x205d63.match(/(\d{10,})/g);
  if (_0x54e7da && _0x54e7da.length) return Number(_0x54e7da[_0x54e7da.length - 1]) || 0;
  return 0;
}
function buildV54FixedSlotPatch({
  nodeData: _0x5372bf,
  inEdges: _0xa3dfc,
  nodes: _0x38907a,
  assetInputRefs: _0x528b3b,
  helpers: _0x42843c,
}) {
  const _0x563abe = getFixedInputSlotConfigFromManifest(_0x5372bf || {}),
    _0x480e6d = {};
  if (!_0x563abe) return _0x480e6d;
  const _0x13a7cc = {};
  for (const _0x24c2ca of _0xa3dfc || []) {
    const _0x106754 = _0x38907a?.[_0x24c2ca?.sourceId];
    if (!_0x106754) continue;
    const _0x138c7c = String(resolveEffectiveInputKind(_0x106754, _0x24c2ca) || ''),
      { slot: _0x2dd4f7 } = resolveFixedInputSlotForRef({
        fixedInputConfig: _0x563abe,
        refSlot: _0x24c2ca?.refSlot,
        kind: _0x138c7c,
        occupiedSlots: _0x13a7cc,
        sourceNode: _0x106754,
      });
    if (!_0x2dd4f7 || _0x13a7cc[_0x2dd4f7]) continue;
    const _0xac7119 = String(_0x563abe.slotKindById?.[_0x2dd4f7] || '');
    if (!_0xac7119) continue;
    const _0x47bb35 = getUrlForFixedSlot(_0x2dd4f7, _0xac7119, _0x106754, _0x24c2ca, _0x42843c);
    if (_0x47bb35) _0x13a7cc[_0x2dd4f7] = { url: _0x47bb35, node: _0x106754, edge: _0x24c2ca };
  }
  const _0x311e28 = new Set(Object.keys(_0x13a7cc)),
    _0x22dcbd = buildFixedInputAssetSlotMapFromRefs(_0x528b3b, {
      slotOrderByType: _0x563abe.slotOrderByType,
      visibleSlots: _0x563abe.visibleSlots,
      exclusiveGroups: _0x563abe.exclusiveGroups,
      slotById: _0x563abe.slotById,
      occupiedSlots: _0x311e28,
    });
  Object.entries(_0x22dcbd).forEach(([_0x4c5fd0, _0x773294]) => {
    !_0x13a7cc[_0x4c5fd0] &&
      _0x773294?.url &&
      (_0x13a7cc[_0x4c5fd0] = { url: _0x773294.url, node: _0x773294.nodeData || null, ref: _0x773294 });
  });
  if (!_0x13a7cc.sourceVideo) {
    const _0x3dba29 = (_0xa3dfc || [])
        .map((_0x9c960e) => ({ edge: _0x9c960e, node: _0x38907a?.[_0x9c960e?.sourceId] }))
        .filter(({ node: _0xd7b4a8 }) => String(_0xd7b4a8?.type || '').includes('video'))
        .sort((_0x25e959, _0x4629f9) => edgeTimeKey(_0x25e959.edge) - edgeTimeKey(_0x4629f9.edge)),
      _0x29dfd5 = _0x3dba29[0],
      _0x3b83c7 = _0x29dfd5 ? _0x42843c.getVideoUrl(_0x29dfd5.node, _0x29dfd5.edge) : '';
    _0x3b83c7 && (_0x13a7cc.sourceVideo = { url: _0x3b83c7, node: _0x29dfd5.node, edge: _0x29dfd5.edge });
  }
  return (
    ['sourceVideo', 'refImage', 'firstFrame', 'videoMask'].forEach((_0x401dfe) => {
      assignSlotPayload(_0x480e6d, _0x401dfe, _0x13a7cc[_0x401dfe]);
    }),
    _0x480e6d
  );
}
function buildV54SubmitPatch(_0x41c5aa) {
  const { nodeData: _0x15885e } = _0x41c5aa,
    _0x5a9902 = {},
    _0xcfebf3 = {},
    _0x112b01 = _0x15885e.rhBlendIntoScene !== undefined ? _0x15885e.rhBlendIntoScene : false;
  if (_0x15885e.rhBlendIntoScene === undefined) _0x5a9902.rhBlendIntoScene = false;
  _0xcfebf3.characterIntegration = _0x112b01;
  const _0x4b83da = _0x15885e.rhControlMode || 'single';
  if (!_0x15885e.rhControlMode) _0x5a9902.rhControlMode = 'single';
  const _0x278443 = _0x15885e.rhSingleControlPreset,
    _0x361450 =
      _0x278443 === 'efficiency' || _0x278443 === 'stable' || _0x278443 === 'quality'
        ? _0x278443
        : 'efficiency';
  if (_0x4b83da !== 'multi') {
    if (_0x278443 !== _0x361450) _0x5a9902.rhSingleControlPreset = _0x361450;
  } else _0x15885e.rhSingleControlPreset !== null && (_0x5a9902.rhSingleControlPreset = null);
  _0xcfebf3.controlMode = _0x4b83da === 'multi' ? 'multi' : _0x361450;
  (_0x15885e.rhSpecialMode === 'longVideoOverlay' || _0x15885e.rhSpecialMode === 'cameraMove') &&
    (_0xcfebf3.specialMode = _0x15885e.rhSpecialMode);
  const _0x2e192a = Number(_0x15885e.rhBreastJiggle),
    _0x5d8c8c = Number.isFinite(_0x2e192a) ? Math.max(0, Math.min(1, Math.round(_0x2e192a * 20) / 20)) : 0;
  if (_0x15885e.rhBreastJiggle === undefined) _0x5a9902.rhBreastJiggle = 0;
  _0xcfebf3.rhBreastJiggle = _0x5d8c8c;
  const _0x1ab801 = _0x15885e.rhMaskExpandTouched === true,
    _0x4913fb = Number(_0x15885e.rhMaskExpand),
    _0x5dbf81 = Number.isFinite(_0x4913fb) && (_0x4913fb !== 0 || _0x1ab801),
    _0x33bce7 = _0x5dbf81 ? _0x4913fb : 25;
  if (!_0x5dbf81) _0x5a9902.rhMaskExpand = 25;
  ((_0xcfebf3.maskExpansion = _0x33bce7), (_0xcfebf3.maskRect = _0x15885e.rhMaskRect === true));
  const _0x417735 = _0x15885e.rhSubtractSubject !== false;
  if (_0x15885e.rhSubtractSubject === undefined) _0x5a9902.rhSubtractSubject = true;
  const _0x178955 = normalizeRhV54Fps(_0x15885e.rhVideoFps);
  _0xcfebf3.frameRate = _0x178955;
  const _0x64bded = Number.isFinite(_0x15885e.rhVideoFrames)
    ? Math.max(0, Math.trunc(_0x15885e.rhVideoFrames))
    : 77;
  _0xcfebf3.frameCount = _0x64bded;
  const _0x45a4f2 = Number(_0x15885e.rhVideoResolution),
    _0x365df8 = normalizeRhVideoResolution(_0x45a4f2);
  return (
    (!Number.isFinite(_0x45a4f2) || _0x365df8 !== _0x45a4f2) && (_0x5a9902.rhVideoResolution = _0x365df8),
    (_0xcfebf3.rhVideoResolution = _0x365df8),
    (_0xcfebf3.rhVideoFps = _0x178955),
    Object.assign(_0xcfebf3, buildV54FixedSlotPatch(_0x41c5aa)),
    _0xcfebf3.maskVideoUrl && _0x417735
      ? ((_0x5a9902.rhSubtractSubject = false), (_0xcfebf3.subtractSubject = false))
      : (_0xcfebf3.subtractSubject = _0x417735),
    { payloadPatch: _0xcfebf3, updateData: _0x5a9902 }
  );
}
function buildBasicSubmitPatch({ nodeData: _0x5140fb, slotEntries: _0x211dec }) {
  const _0x480ee0 = {},
    _0xf6313d = {},
    _0x27ee9c = normalizeRhStandardFps(_0x5140fb.rhVideoFps);
  if (![16, 24].includes(Number(_0x5140fb.rhVideoFps))) _0x480ee0.rhVideoFps = 24;
  _0xf6313d.rhVideoFps = _0x27ee9c;
  const _0x2aa04c = Number(_0x5140fb.rhVideoFrames),
    _0x58c265 = Number.isFinite(_0x2aa04c) ? Math.max(0, Math.trunc(_0x2aa04c)) : 77;
  if (!Number.isFinite(_0x2aa04c)) _0x480ee0.rhVideoFrames = 77;
  _0xf6313d.rhVideoFrames = _0x58c265;
  const _0x1bb1c8 = Number(_0x5140fb.rhVideoResolution),
    _0x1eb119 = normalizeRhVideoResolution(_0x1bb1c8);
  (!Number.isFinite(_0x1bb1c8) || _0x1eb119 !== _0x1bb1c8) && (_0x480ee0.rhVideoResolution = _0x1eb119);
  _0xf6313d.rhVideoResolution = _0x1eb119;
  if (_0x5140fb.rhEnableMask === undefined) _0x480ee0.rhEnableMask = false;
  return (
    (_0xf6313d.rhEnableMask = _0x5140fb.rhEnableMask === true),
    assignSlotPayload(_0xf6313d, 'sourceVideo', _0x211dec.sourceVideo),
    assignSlotPayload(_0xf6313d, 'refImage', _0x211dec.refImage),
    { payloadPatch: _0xf6313d, updateData: _0x480ee0 }
  );
}
function buildLtxSubmitPatch({ nodeData: _0x1478a4, slotEntries: _0xba0f93 }) {
  const _0x127b79 = {},
    _0x472607 = {},
    _0x2d8c05 = normalizeRhStandardFps(_0x1478a4.rhVideoFps);
  if (![16, 24].includes(Number(_0x1478a4.rhVideoFps))) _0x127b79.rhVideoFps = 24;
  _0x472607.rhVideoFps = _0x2d8c05;
  const _0x27b0dd = Number(_0x1478a4.rhVideoSeconds),
    _0x1f5b7b = Number.isFinite(_0x27b0dd) ? Math.max(1, Math.trunc(_0x27b0dd)) : 5;
  if (!Number.isFinite(_0x27b0dd)) _0x127b79.rhVideoSeconds = 5;
  _0x472607.rhVideoSeconds = _0x1f5b7b;
  const _0x6b1d02 = Number(_0x1478a4.rhVideoResolution),
    _0x48bda5 = normalizeRhVideoResolution(_0x6b1d02);
  (!Number.isFinite(_0x6b1d02) || _0x48bda5 !== _0x6b1d02) && (_0x127b79.rhVideoResolution = _0x48bda5);
  _0x472607.rhVideoResolution = _0x48bda5;
  const _0xb0e7bb = _0x1478a4.rhLtxMode || 'singing_voice';
  if (!_0x1478a4.rhLtxMode) _0x127b79.rhLtxMode = 'singing_voice';
  return (
    (_0x472607.rhLtxMode = _0xb0e7bb),
    assignSlotPayload(_0x472607, 'refImage', _0xba0f93.refImage),
    assignSlotPayload(_0x472607, 'audio', _0xba0f93.audio),
    { payloadPatch: _0x472607, updateData: _0x127b79 }
  );
}
function getVideoDurationSec(_0x509e75) {
  const _0x566413 = Number(_0x509e75?.videoDuration);
  if (Number.isFinite(_0x566413) && _0x566413 > 0) return _0x566413;
  const _0x4c6cb6 = Number(_0x509e75?.videoFrameCount),
    _0x328fa6 = Number(_0x509e75?.videoFps);
  if (Number.isFinite(_0x4c6cb6) && _0x4c6cb6 > 0 && Number.isFinite(_0x328fa6) && _0x328fa6 > 0)
    return _0x4c6cb6 / _0x328fa6;
  const _0x5ab288 = Number(_0x509e75?.duration);
  return Number.isFinite(_0x5ab288) && _0x5ab288 > 0 ? _0x5ab288 : 0;
}
async function getAudioDurationSec(_0xef7022, _0x92b5c) {
  return await resolveAudioDurationSec(_0xef7022, _0x92b5c);
}
async function buildLipSyncSubmitPatch({ nodeData: _0xa21249, slotEntries: _0x4e4d02, prompt: _0xd5619c }) {
  const _0x45ee2b = {},
    _0x25e1d7 = { prompt: _0xd5619c, inputUrls: [], rhVideoFps: 24 },
    _0x1da43f = Number(_0xa21249.rhVideoFrames);
  let _0x51792c = Number.isFinite(_0x1da43f) ? Math.max(0, Math.trunc(_0x1da43f)) : 77;
  if (!Number.isFinite(_0x1da43f)) _0x45ee2b.rhVideoFrames = 77;
  const _0x3ec288 = Number(_0xa21249.rhVideoResolution),
    _0x3a5090 = normalizeRhVideoResolution(_0x3ec288);
  (!Number.isFinite(_0x3ec288) || _0x3a5090 !== _0x3ec288) && (_0x45ee2b.rhVideoResolution = _0x3a5090);
  _0x25e1d7.rhVideoResolution = _0x3a5090;
  const _0x42a0fd = _0x4e4d02.sourceVideo,
    _0x18dee7 = _0x4e4d02.refImage,
    _0x45ed67 = _0x4e4d02.audio,
    _0x363254 = _0x18dee7?.url ? 'image' : _0x42a0fd?.url ? 'video' : '';
  if (!_0x363254)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('visualInputRequired'), 'warn'), null);
  if (!_0x45ed67?.url)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('audioInputRequired'), 'warn'), null);
  const _0xb40a15 = _0x363254 === 'video' ? getVideoDurationSec(_0x42a0fd.node) : 0;
  if (_0x51792c === 0) {
    if (_0x363254 === 'image')
      return (
        globalThis.window?.showToast?.(runningHubVideoSubmitText('referenceImageFramesRequired'), 'warn'),
        null
      );
    if (!(Number.isFinite(_0xb40a15) && _0xb40a15 > 0))
      return (
        globalThis.window?.showToast?.(runningHubVideoSubmitText('videoDurationMissing'), 'warn'),
        null
      );
    _0x51792c = Math.max(1, Math.round(_0xb40a15 * 24));
  }
  const _0x3713ad = await getAudioDurationSec(_0x45ed67.node, _0x45ed67.url);
  if (!(Number.isFinite(_0x3713ad) && _0x3713ad > 0))
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('audioDurationMissing'), 'warn'), null);
  if (_0x51792c / 24 > _0x3713ad + 0.001)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('videoLongerThanAudio'), 'warn'), null);
  return (
    (_0x25e1d7.rhVideoFrames = _0x51792c),
    (_0x25e1d7.frameCount = _0x51792c),
    (_0x25e1d7.rhLipSyncInputIndex = _0x363254 === 'image' ? 0 : 1),
    _0x363254 === 'image'
      ? (_0x25e1d7.inputUrls = [_0x18dee7.url])
      : ((_0x25e1d7.inputUrls = []), (_0x25e1d7.videoUrl = _0x42a0fd.url)),
    (_0x25e1d7.audioUrl = _0x45ed67.url),
    { payloadPatch: _0x25e1d7, updateData: _0x45ee2b }
  );
}
function getAudioDurationGuard(_0x28266c) {
  const _0x5b81c7 = _0x28266c?.extensions?.audioDurationGuard;
  return _0x5b81c7 && typeof _0x5b81c7 === 'object' && !Array.isArray(_0x5b81c7) ? _0x5b81c7 : null;
}
function resolveFrameCountForAudioDurationGuard(_0x252010, _0x527cd4) {
  const _0x306fea = Array.isArray(_0x527cd4?.frameFields)
    ? _0x527cd4.frameFields
    : [_0x527cd4?.frameField || 'rhVideoFrames'];
  for (const _0x3390c6 of _0x306fea) {
    const _0x15ccf1 = String(_0x3390c6 || '').trim();
    if (!_0x15ccf1) continue;
    const _0x5758ba = Number(_0x252010?.[_0x15ccf1]);
    if (Number.isFinite(_0x5758ba)) return Math.max(0, Math.trunc(_0x5758ba));
  }
  const _0xb27bc5 = Number(_0x527cd4?.defaultFrames);
  return Number.isFinite(_0xb27bc5) ? Math.max(0, Math.trunc(_0xb27bc5)) : 0;
}
async function validateAudioDurationGuard({
  execution: _0x53a6bb,
  payloadPatch: _0x5ab66a,
  slotEntries: _0x5f0ae7,
} = {}) {
  const _0x482839 = getAudioDurationGuard(_0x53a6bb);
  if (!_0x482839) return true;
  const _0x19b648 = Number(_0x482839.fps);
  if (!(Number.isFinite(_0x19b648) && _0x19b648 > 0)) return true;
  const _0x332cbb = resolveFrameCountForAudioDurationGuard(_0x5ab66a, _0x482839);
  if (!(Number.isFinite(_0x332cbb) && _0x332cbb > 0)) return true;
  const _0xb5fa8a = String(_0x482839.audioSlot || 'audio').trim() || 'audio',
    _0x2267f9 = _0x5f0ae7?.[_0xb5fa8a] || {},
    _0x178e18 = String(_0x5ab66a?.audioUrl || _0x2267f9?.url || '').trim(),
    _0x55d500 = await getAudioDurationSec(_0x2267f9.node, _0x178e18);
  if (!(Number.isFinite(_0x55d500) && _0x55d500 > 0))
    return (
      globalThis.window?.showToast?.(
        _0x482839.missingDurationMessage || '无法读取音频时长，请等待音频加载后再生成',
        'warn',
      ),
      false
    );
  if (_0x332cbb / _0x19b648 > _0x55d500 + 0.001)
    return (
      globalThis.window?.showToast?.(
        _0x482839.message || runningHubVideoSubmitText('videoLongerThanAudio'),
        'warn',
      ),
      false
    );
  return true;
}
async function buildSpecificSubmitPatch(_0x3ec40d, _0x4b6149) {
  if (_0x4b6149?.extensions?.payloadResolver === RH_VIDEO_V54_PAYLOAD_RESOLVER)
    return buildV54SubmitPatch(_0x3ec40d);
  const { slotEntries: _0x1e0881 } = resolveManifestFixedSlotInputs(_0x3ec40d);
  if (_0x4b6149?.id === RH_VIDEO_BASIC_EXECUTION_ID)
    return buildBasicSubmitPatch({ ..._0x3ec40d, slotEntries: _0x1e0881 });
  if (_0x4b6149?.id === RH_VIDEO_LTX23_EXECUTION_ID)
    return buildLtxSubmitPatch({ ..._0x3ec40d, slotEntries: _0x1e0881 });
  if (_0x4b6149?.id === RH_VIDEO_LIPSYNC_EXECUTION_ID)
    return await buildLipSyncSubmitPatch({ ..._0x3ec40d, slotEntries: _0x1e0881 });
  return { payloadPatch: {}, updateData: {} };
}
export async function buildRunningHubVideoWorkflowSubmitPatch(_0x5cf279 = {}) {
  const _0x3ac1b3 = String(_0x5cf279.model || _0x5cf279.nodeData?.model || '').trim(),
    _0x5572c5 = getRunningHubVideoExecution(_0x3ac1b3),
    _0x1ac072 = buildVideoWorkflowDisplayParamsPatch(_0x3ac1b3, _0x5cf279.nodeData?.generationParams),
    _0x1bf78c = getPlainGenerationParams(_0x5cf279.nodeData?.generationParams),
    { config: _0x1d7ca2, slotEntries: _0x4f802c } = resolveManifestFixedSlotInputs(_0x5cf279),
    _0x307fbd = buildGenericFixedSlotPayloadPatchFromEntries(_0x4f802c, _0x1d7ca2),
    _0x14dc69 = buildRunningHubVideoFixedSlotSummaryPatch({
      model: _0x3ac1b3,
      nodeData: _0x5cf279.nodeData,
      slotEntries: _0x4f802c,
    }),
    _0xba30bb = _0x14dc69.rhBerniniInputMode !== undefined,
    _0x195149 = await buildSpecificSubmitPatch(_0x5cf279, _0x5572c5);
  if (_0x195149 === null) return null;
  const _0xeca4b1 = {
      generationParams: _0x1bf78c,
      ..._0x1ac072,
      ...(_0xba30bb ? buildBerniniFixedSlotPayloadPatch(_0x4f802c) : _0x307fbd),
      ..._0x14dc69,
      ...(_0x195149?.payloadPatch || {}),
    },
    _0x3e5687 = await validateAudioDurationGuard({
      execution: _0x5572c5,
      payloadPatch: _0xeca4b1,
      slotEntries: _0x4f802c,
    });
  if (!_0x3e5687) return null;
  return { payloadPatch: _0xeca4b1, updateData: _0x195149?.updateData || {} };
}
