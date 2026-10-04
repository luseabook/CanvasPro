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
function runningHubVideoSubmitText(value, item = {}) {
  return t('runningHubVideoSubmit.' + value, item);
}
const RH_STANDARD_FPS_OPTIONS = Object.freeze([16, 24]),
  RH_V54_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 0x340,
  RH_VIDEO_V54_PAYLOAD_RESOLVER = 'runninghubVideoV54';
function normalizeRhStandardFps(key) {
  const index = Number(key);
  return RH_STANDARD_FPS_OPTIONS.includes(index) ? index : 24;
}
function normalizeRhV54Fps(result) {
  const data = Number(result);
  return RH_V54_FPS_OPTIONS.includes(data) ? data : 24;
}
function normalizeRhVideoResolution(options) {
  const target = Number(options);
  return Number.isFinite(target)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(target))
    : RH_MIN_VIDEO_RESOLUTION;
}
function getRunningHubVideoExecution(source) {
  try {
    return resolveModelExecution(source)?.executionManifest || null;
  } catch {
    return null;
  }
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return RH_VIDEO_BASIC_MODEL_ID;
}
export function shouldScopeRunningHubVideoSubmitEdges(options2 = {}) {
  const runningHubVideoParameterPanelPolicy = getRunningHubVideoParameterPanelPolicy(options2?.model);
  return runningHubVideoParameterPanelPolicy?.submitScopeTargetEdges === true;
}
function getUrlForFixedSlot(next, current, entry, record, payload) {
  if (next === 'maskImage') return payload.getMaskImageUrl?.(entry, record) || '';
  if (current === 'video') return payload.getVideoUrl(entry, record);
  if (current === 'image') return payload.getImageUrl(entry);
  if (current === 'audio') return payload.getAudioUrl(entry);
  return '';
}
function assignSlotPayload(enabled, handle, response) {
  const enabled2 = String(response?.url || '').trim();
  if (!enabled2) return;
  if (handle === 'sourceVideo' && !enabled.videoUrl) enabled.videoUrl = enabled2;
  else {
    if (handle === 'refImage') enabled.inputUrls = [enabled2];
    else {
      if (handle === 'referenceVideo' && !enabled.referenceVideoUrl) enabled.referenceVideoUrl = enabled2;
      else {
        if (handle === 'maskImage' && !enabled.maskImageDataUrl) enabled.maskImageDataUrl = enabled2;
        else {
          if (handle === 'audio' && !enabled.audioUrl) enabled.audioUrl = enabled2;
          else {
            if (handle === 'firstFrame' && !enabled.firstFrameUrl) enabled.firstFrameUrl = enabled2;
            else {
              if (handle === 'videoMask' && !enabled.maskVideoUrl) enabled.maskVideoUrl = enabled2;
            }
          }
        }
      }
    }
  }
}
function resolveBerniniVideoReplaceInputMode(enabled3 = {}) {
  const state = !!enabled3.sourceVideo?.url,
    config = !!enabled3.refImage?.url,
    scope = !!enabled3.referenceVideo?.url;
  if (state && scope) return 'videoVideo';
  if (state && config) return 'videoImage';
  if (state) return 'video';
  if (config) return 'image';
  return 'none';
}
function resolveBerniniFunctionForInputMode(input, output = '') {
  const value2 = {
      image: ['i2v', 'r2v'],
      video: ['v2v', 'mv2v'],
      videoImage: ['vi2v', 'rv2v', 'vrc2v'],
      videoVideo: ['ads2v'],
    },
    list = value2[input] || [],
    value3 = String(output || '').trim();
  if (list.includes(value3)) return value3;
  return list[0] || '';
}
function buildBerniniFixedSlotPayloadPatch(enabled4 = {}) {
  const value4 = {};
  (assignSlotPayload(value4, 'sourceVideo', enabled4.sourceVideo),
    assignSlotPayload(value4, 'refImage', enabled4.refImage),
    assignSlotPayload(value4, 'referenceVideo', enabled4.referenceVideo));
  if (!enabled4.refImage?.url) value4.inputUrls = [];
  return value4;
}
export function buildRunningHubVideoFixedSlotSummaryPatch({
  model: model2,
  nodeData: nodeData = {},
  slotEntries: slotEntries = {},
} = {}) {
  const value5 = String(model2 || nodeData?.model || '').trim(),
    runningHubVideoParameterPanelPolicy2 = getRunningHubVideoParameterPanelPolicy(value5),
    enabled5 = runningHubVideoParameterPanelPolicy2?.fixedSlotSummary;
  if (!enabled5 || typeof enabled5 !== 'object' || Array.isArray(enabled5)) return {};
  const enabled6 = String(enabled5.field || '').trim();
  if (!enabled6) return {};
  let berniniVideoReplaceInputMode = '';
  enabled5.resolver === 'berniniVideoReplaceInputMode' &&
    (berniniVideoReplaceInputMode = resolveBerniniVideoReplaceInputMode(slotEntries));
  if (!berniniVideoReplaceInputMode) return {};
  const value6 = { [enabled6]: berniniVideoReplaceInputMode },
    berniniFunctionForInputMode = resolveBerniniFunctionForInputMode(
      berniniVideoReplaceInputMode,
      nodeData?.generationParams?.rhBerniniFunction ?? nodeData?.rhBerniniFunction,
    );
  if (berniniFunctionForInputMode) value6.rhBerniniFunction = berniniFunctionForInputMode;
  return value6;
}
function resolveManifestFixedSlotInputs({
  nodeData: nodeData2,
  inEdges: inEdges,
  nodes: nodes,
  assetInputRefs: assetInputRefs,
  helpers: helpers,
}) {
  const fixedInputConfig = getFixedInputSlotConfigFromManifest(nodeData2 || {});
  if (!fixedInputConfig) return { config: null, slotEntries: {} };
  const occupiedSlots = {};
  for (const refSlot of inEdges || []) {
    const sourceNode = nodes?.[refSlot?.sourceId];
    if (!sourceNode) continue;
    const kind = String(resolveEffectiveInputKind(sourceNode, refSlot) || ''),
      { slot: slot } = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: refSlot?.refSlot,
        kind: kind,
        occupiedSlots: occupiedSlots,
        sourceNode: sourceNode,
      });
    if (!slot || occupiedSlots[slot]) continue;
    const value7 = String(fixedInputConfig.slotKindById?.[slot] || ''),
      url = getUrlForFixedSlot(slot, value7, sourceNode, refSlot, helpers);
    url && (occupiedSlots[slot] = { url: url, node: sourceNode, edge: refSlot });
  }
  const occupiedSlots2 = new Set(Object.keys(occupiedSlots)),
    fixedInputAssetSlotMapFromRefs = buildFixedInputAssetSlotMapFromRefs(assetInputRefs, {
      slotOrderByType: fixedInputConfig.slotOrderByType,
      visibleSlots: fixedInputConfig.visibleSlots,
      exclusiveGroups: fixedInputConfig.exclusiveGroups,
      slotById: fixedInputConfig.slotById,
      occupiedSlots: occupiedSlots2,
    });
  return (
    Object.entries(fixedInputAssetSlotMapFromRefs).forEach(([value8, node]) => {
      const url2 =
        value8 === 'maskImage'
          ? helpers.getMaskImageUrl?.(node?.nodeData || node, node) || ''
          : String(node?.url || '').trim();
      !occupiedSlots[value8] &&
        url2 &&
        (occupiedSlots[value8] = { url: url2, node: node.nodeData || null, ref: node });
    }),
    { config: fixedInputConfig, slotEntries: occupiedSlots }
  );
}
function fixedInputConfigHasImageSlot(options3 = {}) {
  return Object.values(options3?.slotKindById || {}).some((item2) => String(item2 || '') === 'image');
}
function buildGenericFixedSlotPayloadPatchFromEntries(options4 = {}, value9 = null) {
  const value10 = {};
  return (
    Object.entries(options4).forEach(([value11, value12]) => {
      assignSlotPayload(value10, value11, value12);
    }),
    !Object.hasOwn(value10, 'inputUrls') && fixedInputConfigHasImageSlot(value9) && (value10.inputUrls = []),
    value10
  );
}
function edgeTimeKey(value13) {
  const count = Number(value13?.createdAt);
  if (Number.isFinite(count) && count > 0) return count;
  const value14 = String(value13?.id || ''),
    list2 = value14.match(/(\d{10,})/g);
  if (list2 && list2.length) return Number(list2[list2.length - 1]) || 0;
  return 0;
}
function buildV54FixedSlotPatch({
  nodeData: nodeData3,
  inEdges: inEdges2,
  nodes: nodes2,
  assetInputRefs: assetInputRefs2,
  helpers: helpers2,
}) {
  const fixedInputConfig2 = getFixedInputSlotConfigFromManifest(nodeData3 || {}),
    value15 = {};
  if (!fixedInputConfig2) return value15;
  const occupiedSlots3 = {};
  for (const refSlot2 of inEdges2 || []) {
    const sourceNode2 = nodes2?.[refSlot2?.sourceId];
    if (!sourceNode2) continue;
    const kind2 = String(resolveEffectiveInputKind(sourceNode2, refSlot2) || ''),
      { slot: slot2 } = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig2,
        refSlot: refSlot2?.refSlot,
        kind: kind2,
        occupiedSlots: occupiedSlots3,
        sourceNode: sourceNode2,
      });
    if (!slot2 || occupiedSlots3[slot2]) continue;
    const enabled7 = String(fixedInputConfig2.slotKindById?.[slot2] || '');
    if (!enabled7) continue;
    const url3 = getUrlForFixedSlot(slot2, enabled7, sourceNode2, refSlot2, helpers2);
    if (url3) occupiedSlots3[slot2] = { url: url3, node: sourceNode2, edge: refSlot2 };
  }
  const occupiedSlots4 = new Set(Object.keys(occupiedSlots3)),
    fixedInputAssetSlotMapFromRefs2 = buildFixedInputAssetSlotMapFromRefs(assetInputRefs2, {
      slotOrderByType: fixedInputConfig2.slotOrderByType,
      visibleSlots: fixedInputConfig2.visibleSlots,
      exclusiveGroups: fixedInputConfig2.exclusiveGroups,
      slotById: fixedInputConfig2.slotById,
      occupiedSlots: occupiedSlots4,
    });
  Object.entries(fixedInputAssetSlotMapFromRefs2).forEach(([value16, url4]) => {
    !occupiedSlots3[value16] &&
      url4?.url &&
      (occupiedSlots3[value16] = { url: url4.url, node: url4.nodeData || null, ref: url4 });
  });
  if (!occupiedSlots3.sourceVideo) {
    const value17 = (inEdges2 || [])
        .map((edge) => ({ edge: edge, node: nodes2?.[edge?.sourceId] }))
        .filter(({ node: node2 }) => String(node2?.type || '').includes('video'))
        .sort((item3, value18) => edgeTimeKey(item3.edge) - edgeTimeKey(value18.edge)),
      node3 = value17[0],
      url5 = node3 ? helpers2.getVideoUrl(node3.node, node3.edge) : '';
    url5 && (occupiedSlots3.sourceVideo = { url: url5, node: node3.node, edge: node3.edge });
  }
  return (
    ['sourceVideo', 'refImage', 'firstFrame', 'videoMask'].forEach((item4) => {
      assignSlotPayload(value15, item4, occupiedSlots3[item4]);
    }),
    value15
  );
}
function buildV54SubmitPatch(value19) {
  const { nodeData: nodeData4 } = value19,
    updateData = {},
    payloadPatch = {},
    value20 = nodeData4.rhBlendIntoScene !== undefined ? nodeData4.rhBlendIntoScene : false;
  if (nodeData4.rhBlendIntoScene === undefined) updateData.rhBlendIntoScene = false;
  payloadPatch.characterIntegration = value20;
  const value21 = nodeData4.rhControlMode || 'single';
  if (!nodeData4.rhControlMode) updateData.rhControlMode = 'single';
  const value22 = nodeData4.rhSingleControlPreset,
    value23 =
      value22 === 'efficiency' || value22 === 'stable' || value22 === 'quality' ? value22 : 'efficiency';
  if (value21 !== 'multi') {
    if (value22 !== value23) updateData.rhSingleControlPreset = value23;
  } else nodeData4.rhSingleControlPreset !== null && (updateData.rhSingleControlPreset = null);
  payloadPatch.controlMode = value21 === 'multi' ? 'multi' : value23;
  (nodeData4.rhSpecialMode === 'longVideoOverlay' || nodeData4.rhSpecialMode === 'cameraMove') &&
    (payloadPatch.specialMode = nodeData4.rhSpecialMode);
  const value24 = Number(nodeData4.rhBreastJiggle),
    value25 = Number.isFinite(value24) ? Math.max(0, Math.min(1, Math.round(value24 * 20) / 20)) : 0;
  if (nodeData4.rhBreastJiggle === undefined) updateData.rhBreastJiggle = 0;
  payloadPatch.rhBreastJiggle = value25;
  const value26 = nodeData4.rhMaskExpandTouched === true,
    count2 = Number(nodeData4.rhMaskExpand),
    enabled8 = Number.isFinite(count2) && (count2 !== 0 || value26),
    value27 = enabled8 ? count2 : 25;
  if (!enabled8) updateData.rhMaskExpand = 25;
  ((payloadPatch.maskExpansion = value27), (payloadPatch.maskRect = nodeData4.rhMaskRect === true));
  const value28 = nodeData4.rhSubtractSubject !== false;
  if (nodeData4.rhSubtractSubject === undefined) updateData.rhSubtractSubject = true;
  const rhV54Fps = normalizeRhV54Fps(nodeData4.rhVideoFps);
  payloadPatch.frameRate = rhV54Fps;
  const value29 = Number.isFinite(nodeData4.rhVideoFrames)
    ? Math.max(0, Math.trunc(nodeData4.rhVideoFrames))
    : 77;
  payloadPatch.frameCount = value29;
  const value30 = Number(nodeData4.rhVideoResolution),
    rhVideoResolution = normalizeRhVideoResolution(value30);
  return (
    (!Number.isFinite(value30) || rhVideoResolution !== value30) &&
      (updateData.rhVideoResolution = rhVideoResolution),
    (payloadPatch.rhVideoResolution = rhVideoResolution),
    (payloadPatch.rhVideoFps = rhV54Fps),
    Object.assign(payloadPatch, buildV54FixedSlotPatch(value19)),
    payloadPatch.maskVideoUrl && value28
      ? ((updateData.rhSubtractSubject = false), (payloadPatch.subtractSubject = false))
      : (payloadPatch.subtractSubject = value28),
    { payloadPatch: payloadPatch, updateData: updateData }
  );
}
function buildBasicSubmitPatch({ nodeData: nodeData5, slotEntries: slotEntries2 }) {
  const updateData2 = {},
    payloadPatch2 = {},
    rhStandardFps = normalizeRhStandardFps(nodeData5.rhVideoFps);
  if (![16, 24].includes(Number(nodeData5.rhVideoFps))) updateData2.rhVideoFps = 24;
  payloadPatch2.rhVideoFps = rhStandardFps;
  const value31 = Number(nodeData5.rhVideoFrames),
    value32 = Number.isFinite(value31) ? Math.max(0, Math.trunc(value31)) : 77;
  if (!Number.isFinite(value31)) updateData2.rhVideoFrames = 77;
  payloadPatch2.rhVideoFrames = value32;
  const value33 = Number(nodeData5.rhVideoResolution),
    rhVideoResolution2 = normalizeRhVideoResolution(value33);
  (!Number.isFinite(value33) || rhVideoResolution2 !== value33) &&
    (updateData2.rhVideoResolution = rhVideoResolution2);
  payloadPatch2.rhVideoResolution = rhVideoResolution2;
  if (nodeData5.rhEnableMask === undefined) updateData2.rhEnableMask = false;
  return (
    (payloadPatch2.rhEnableMask = nodeData5.rhEnableMask === true),
    assignSlotPayload(payloadPatch2, 'sourceVideo', slotEntries2.sourceVideo),
    assignSlotPayload(payloadPatch2, 'refImage', slotEntries2.refImage),
    { payloadPatch: payloadPatch2, updateData: updateData2 }
  );
}
function buildLtxSubmitPatch({ nodeData: nodeData6, slotEntries: slotEntries3 }) {
  const updateData3 = {},
    payloadPatch3 = {},
    rhStandardFps2 = normalizeRhStandardFps(nodeData6.rhVideoFps);
  if (![16, 24].includes(Number(nodeData6.rhVideoFps))) updateData3.rhVideoFps = 24;
  payloadPatch3.rhVideoFps = rhStandardFps2;
  const value34 = Number(nodeData6.rhVideoSeconds),
    value35 = Number.isFinite(value34) ? Math.max(1, Math.trunc(value34)) : 5;
  if (!Number.isFinite(value34)) updateData3.rhVideoSeconds = 5;
  payloadPatch3.rhVideoSeconds = value35;
  const value36 = Number(nodeData6.rhVideoResolution),
    rhVideoResolution3 = normalizeRhVideoResolution(value36);
  (!Number.isFinite(value36) || rhVideoResolution3 !== value36) &&
    (updateData3.rhVideoResolution = rhVideoResolution3);
  payloadPatch3.rhVideoResolution = rhVideoResolution3;
  const value37 = nodeData6.rhLtxMode || 'singing_voice';
  if (!nodeData6.rhLtxMode) updateData3.rhLtxMode = 'singing_voice';
  return (
    (payloadPatch3.rhLtxMode = value37),
    assignSlotPayload(payloadPatch3, 'refImage', slotEntries3.refImage),
    assignSlotPayload(payloadPatch3, 'audio', slotEntries3.audio),
    { payloadPatch: payloadPatch3, updateData: updateData3 }
  );
}
function getVideoDurationSec(value38) {
  const count3 = Number(value38?.videoDuration);
  if (Number.isFinite(count3) && count3 > 0) return count3;
  const count4 = Number(value38?.videoFrameCount),
    count5 = Number(value38?.videoFps);
  if (Number.isFinite(count4) && count4 > 0 && Number.isFinite(count5) && count5 > 0) return count4 / count5;
  const count6 = Number(value38?.duration);
  return Number.isFinite(count6) && count6 > 0 ? count6 : 0;
}
async function getAudioDurationSec(value39, value40) {
  return await resolveAudioDurationSec(value39, value40);
}
async function buildLipSyncSubmitPatch({ nodeData: nodeData7, slotEntries: slotEntries4, prompt: prompt }) {
  const updateData4 = {},
    payloadPatch4 = { prompt: prompt, inputUrls: [], rhVideoFps: 24 },
    value41 = Number(nodeData7.rhVideoFrames);
  let count7 = Number.isFinite(value41) ? Math.max(0, Math.trunc(value41)) : 77;
  if (!Number.isFinite(value41)) updateData4.rhVideoFrames = 77;
  const value42 = Number(nodeData7.rhVideoResolution),
    rhVideoResolution4 = normalizeRhVideoResolution(value42);
  (!Number.isFinite(value42) || rhVideoResolution4 !== value42) &&
    (updateData4.rhVideoResolution = rhVideoResolution4);
  payloadPatch4.rhVideoResolution = rhVideoResolution4;
  const response2 = slotEntries4.sourceVideo,
    response3 = slotEntries4.refImage,
    response4 = slotEntries4.audio,
    enabled9 = response3?.url ? 'image' : response2?.url ? 'video' : '';
  if (!enabled9)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('visualInputRequired'), 'warn'), null);
  if (!response4?.url)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('audioInputRequired'), 'warn'), null);
  const count8 = enabled9 === 'video' ? getVideoDurationSec(response2.node) : 0;
  if (count7 === 0) {
    if (enabled9 === 'image')
      return (
        globalThis.window?.showToast?.(runningHubVideoSubmitText('referenceImageFramesRequired'), 'warn'),
        null
      );
    if (!(Number.isFinite(count8) && count8 > 0))
      return (
        globalThis.window?.showToast?.(runningHubVideoSubmitText('videoDurationMissing'), 'warn'),
        null
      );
    count7 = Math.max(1, Math.round(count8 * 24));
  }
  const audioDurationSec = await getAudioDurationSec(response4.node, response4.url);
  if (!(Number.isFinite(audioDurationSec) && audioDurationSec > 0))
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('audioDurationMissing'), 'warn'), null);
  if (count7 / 24 > audioDurationSec + 0.001)
    return (globalThis.window?.showToast?.(runningHubVideoSubmitText('videoLongerThanAudio'), 'warn'), null);
  return (
    (payloadPatch4.rhVideoFrames = count7),
    (payloadPatch4.frameCount = count7),
    (payloadPatch4.rhLipSyncInputIndex = enabled9 === 'image' ? 0 : 1),
    enabled9 === 'image'
      ? (payloadPatch4.inputUrls = [response3.url])
      : ((payloadPatch4.inputUrls = []), (payloadPatch4.videoUrl = response2.url)),
    (payloadPatch4.audioUrl = response4.url),
    { payloadPatch: payloadPatch4, updateData: updateData4 }
  );
}
function getAudioDurationGuard(value43) {
  const value44 = value43?.extensions?.audioDurationGuard;
  return value44 && typeof value44 === 'object' && !Array.isArray(value44) ? value44 : null;
}
function resolveFrameCountForAudioDurationGuard(value45, value46) {
  const value47 = Array.isArray(value46?.frameFields)
    ? value46.frameFields
    : [value46?.frameField || 'rhVideoFrames'];
  for (const value48 of value47) {
    const enabled10 = String(value48 || '').trim();
    if (!enabled10) continue;
    const value49 = Number(value45?.[enabled10]);
    if (Number.isFinite(value49)) return Math.max(0, Math.trunc(value49));
  }
  const value50 = Number(value46?.defaultFrames);
  return Number.isFinite(value50) ? Math.max(0, Math.trunc(value50)) : 0;
}
async function validateAudioDurationGuard({
  execution: execution,
  payloadPatch: payloadPatch5,
  slotEntries: slotEntries5,
} = {}) {
  const error = getAudioDurationGuard(execution);
  if (!error) return true;
  const count9 = Number(error.fps);
  if (!(Number.isFinite(count9) && count9 > 0)) return true;
  const frameCountForAudioDurationGuard = resolveFrameCountForAudioDurationGuard(payloadPatch5, error);
  if (!(Number.isFinite(frameCountForAudioDurationGuard) && frameCountForAudioDurationGuard > 0)) return true;
  const value51 = String(error.audioSlot || 'audio').trim() || 'audio',
    response5 = slotEntries5?.[value51] || {},
    value52 = String(payloadPatch5?.audioUrl || response5?.url || '').trim(),
    audioDurationSec2 = await getAudioDurationSec(response5.node, value52);
  if (!(Number.isFinite(audioDurationSec2) && audioDurationSec2 > 0))
    return (
      globalThis.window?.showToast?.(
        error.missingDurationMessage || '无法读取音频时长，请等待音频加载后再生成',
        'warn',
      ),
      false
    );
  if (frameCountForAudioDurationGuard / count9 > audioDurationSec2 + 0.001)
    return (
      globalThis.window?.showToast?.(
        error.message || runningHubVideoSubmitText('videoLongerThanAudio'),
        'warn',
      ),
      false
    );
  return true;
}
async function buildSpecificSubmitPatch(args, value53) {
  if (value53?.extensions?.payloadResolver === RH_VIDEO_V54_PAYLOAD_RESOLVER)
    return buildV54SubmitPatch(args);
  const { slotEntries: slotEntries6 } = resolveManifestFixedSlotInputs(args);
  if (value53?.id === RH_VIDEO_BASIC_EXECUTION_ID)
    return buildBasicSubmitPatch({ ...args, slotEntries: slotEntries6 });
  if (value53?.id === RH_VIDEO_LTX23_EXECUTION_ID)
    return buildLtxSubmitPatch({ ...args, slotEntries: slotEntries6 });
  if (value53?.id === RH_VIDEO_LIPSYNC_EXECUTION_ID)
    return await buildLipSyncSubmitPatch({ ...args, slotEntries: slotEntries6 });
  return { payloadPatch: {}, updateData: {} };
}
export async function buildRunningHubVideoWorkflowSubmitPatch(nodeData8 = {}) {
  const model3 = String(nodeData8.model || nodeData8.nodeData?.model || '').trim(),
    execution2 = getRunningHubVideoExecution(model3),
    args2 = buildVideoWorkflowDisplayParamsPatch(model3, nodeData8.nodeData?.generationParams),
    generationParams = getPlainGenerationParams(nodeData8.nodeData?.generationParams),
    { config: config2, slotEntries: slotEntries7 } = resolveManifestFixedSlotInputs(nodeData8),
    genericFixedSlotPayloadPatchFromEntries = buildGenericFixedSlotPayloadPatchFromEntries(
      slotEntries7,
      config2,
    ),
    args3 = buildRunningHubVideoFixedSlotSummaryPatch({
      model: model3,
      nodeData: nodeData8.nodeData,
      slotEntries: slotEntries7,
    }),
    value54 = args3.rhBerniniInputMode !== undefined,
    updateData5 = await buildSpecificSubmitPatch(nodeData8, execution2);
  if (updateData5 === null) return null;
  const payloadPatch6 = {
      generationParams: generationParams,
      ...args2,
      ...(value54
        ? buildBerniniFixedSlotPayloadPatch(slotEntries7)
        : genericFixedSlotPayloadPatchFromEntries),
      ...args3,
      ...(updateData5?.payloadPatch || {}),
    },
    validateAudioDurationGuard2 = await validateAudioDurationGuard({
      execution: execution2,
      payloadPatch: payloadPatch6,
      slotEntries: slotEntries7,
    });
  if (!validateAudioDurationGuard2) return null;
  return { payloadPatch: payloadPatch6, updateData: updateData5?.updateData || {} };
}

const RH_LTX23_RESOLUTION_OPTIONS = Object['freeze']([0x400, 0x500, 0x5a0, 0x640, 0x780]);

function normalizeRhLtx23Resolution(value55) {
  const value56 = Number(value55);
  return RH_LTX23_RESOLUTION_OPTIONS['includes'](value56) ? value56 : 0x500;
}

export function buildRunningHubVideoFixedSlotPayloadPatch({
  model: model = '',
  nodeData: nodeData = {},
  slotEntries: slotEntries = {},
} = {}) {
  const value57 = String(model || nodeData?.['model'] || '')['trim'](),
    fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(
      { ...nodeData, model: value57 },
      { includeHiddenSlots: !![] },
    );
  if (!fixedInputSlotConfigFromManifest) return {};
  const runningHubVideoParameterPanelPolicy3 =
      getRunningHubVideoParameterPanelPolicy(value57)?.['fixedSlotSummary']?.['resolver'] ===
      'berniniVideoReplaceInputMode',
    args4 = runningHubVideoParameterPanelPolicy3
      ? buildBerniniFixedSlotPayloadPatch(slotEntries)
      : buildGenericFixedSlotPayloadPatchFromEntries(slotEntries, fixedInputSlotConfigFromManifest),
    value58 = Object['fromEntries'](
      Object['entries'](slotEntries)
        ['map'](([value59, value60]) => [
          String(value59 || '')['trim'](),
          String(value60?.['url'] || '')['trim'](),
        ])
        ['filter'](([value61, value62]) => value61 && value62),
    );
  return (
    Object['keys'](value58)['length'] && (args4['inputUrlsBySlot'] = value58),
    {
      ...args4,
      ...buildRunningHubVideoFixedSlotSummaryPatch({
        model: value57,
        nodeData: nodeData,
        slotEntries: slotEntries,
      }),
    }
  );
}

function buildCollectedMediaPayloadPatch(value63, value64 = {}) {
  if (value63?.['extensions']?.['collectMediaInputs'] !== !![]) return {};
  const run = (value65) =>
    (Array['isArray'](value65) ? value65 : [])
      ['map']((value66) => String(value66 || '')['trim']())
      ['filter'](Boolean);
  return {
    inputImages: run(value64['images']),
    inputVideos: run(value64['videos']),
    inputAudios: run(value64['audios']),
  };
}
