import { resolveModelProvider } from '../../manifests/index.js';
import { resolveCanvasVideoPosterUrl } from '../../services/canvasMediaLocalService.js';
import { buildRunningHubVideoFixedSlotPayloadPatch } from '../../components/video-node/runningHubVideoSubmitPayload.js';
import { getFixedInputSlotConfigFromManifest } from '../fixedInputAssetRefs.js';
import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoResultRef,
  resolvePersonReplacementVideoSourceRef,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoModelId,
} from './personReplacementProject.js';
import { normalizePersonReplacementWorkspaceProject } from './personReplacementProjectSession.js';
import { updatePersonReplacementVideoGenerationState } from './personReplacementVideoGeneration.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function getStoredVideoInputsBySlot(options = {}) {
  const item = options?.replacementVideoInputsBySlot;
  return item && typeof item === 'object' && !Array.isArray(item) ? item : {};
}
function resolveStoredInputUrl(response) {
  if (typeof response === 'string') return normalizeText(response);
  return normalizeText(
    response?.url ||
      response?.localUrl ||
      response?.imageUrl ||
      response?.videoUrl ||
      response?.localPath,
  );
}
function resolveProjectSourceVideoRef(options2 = {}, key = {}) {
  const text = normalizeText(key?.sourceId),
    index = (Array.isArray(options2?.sources) ? options2.sources : []).find(
      (result) => normalizeText(result?.id) === text,
    );
  return normalizeText(key?.sourceVideoRef || index?.videoRef);
}
export function appendPersonReplacementVideoResults(options3 = {}, list = []) {
  const args = getPersonReplacementVideoResults(options3),
    results = [...args];
  let activeIndex = -1;
  return (
    list.forEach((args2) => {
      const personReplacementVideoResultRef = resolvePersonReplacementVideoResultRef(args2);
      if (!personReplacementVideoResultRef) return;
      const count = results.findIndex(
        (data) => resolvePersonReplacementVideoResultRef(data) === personReplacementVideoResultRef,
      );
      if (count >= 0) {
        if (activeIndex < 0) activeIndex = count;
        return;
      }
      if (activeIndex < 0) activeIndex = results.length;
      results.push({ ...args2 });
    }),
    {
      results: results,
      activeIndex: activeIndex >= 0 ? activeIndex : Math.max(0, results.length - 1),
    }
  );
}
export function applyPersonReplacementVideoCrop(
  options4 = {},
  { shotId: shotId = '', cutLocalPath: cutLocalPath = '', videoUrl: videoUrl = '', fps: fps = 0 } = {},
) {
  const shots = normalizePersonReplacementWorkspaceProject(options4),
    shotId2 = normalizeText(shotId || shots.workspace.selectedShotId),
    videoIterationInputRef = normalizeText(cutLocalPath || videoUrl);
  if (!shotId2 || !videoIterationInputRef) return shots;
  const enabled = shots.shots.find((target) => target.id === shotId2);
  if (!enabled) return shots;
  const outputFps = Number(fps) > 0 ? Number(fps) : enabled.outputFps,
    source = {
      ...shots,
      shots: shots.shots.map((args3) =>
        args3.id === shotId2
          ? {
              ...args3,
              ...(args3.videoIterationReferenceRef
                ? { videoIterationInputRef: videoIterationInputRef }
                : { videoRef: videoIterationInputRef, videoRefIsCropped: true }),
              outputFps: outputFps,
              materializationStatus: 'succeeded',
              materializationProgress: 100,
              error: '',
            }
          : args3,
      ),
      workspace: updatePersonReplacementVideoGenerationState(shots.workspace, {
        status: 'idle',
        shotId: shotId2,
        error: '',
      }),
    };
  return normalizePersonReplacementWorkspaceProject(source);
}
export function resolvePersonReplacementVideoSlotState(generationParams2 = {}, thumbUrl = {}) {
  const model = resolvePersonReplacementVideoModelId(
      generationParams2?.settings?.replacementModelId || PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
    ),
    provider = resolveModelProvider(model, '', { allowProviderHint: false, allowPrefixInference: false }),
    fixedInputConfig = getFixedInputSlotConfigFromManifest(
      {
        model: model,
        provider: provider,
        generationParams: generationParams2?.settings?.replacementVideoGenerationParams || {},
      },
      { includeHiddenSlots: true },
    ),
    inputsBySlot = {},
    readOnlySlots = ['refImage'].filter((next) => fixedInputConfig?.visibleSlots?.includes(next)),
    storedVideoInputsBySlot = getStoredVideoInputsBySlot(thumbUrl);
  (fixedInputConfig?.visibleSlots || []).forEach((current) => {
    const entry = storedVideoInputsBySlot[current],
      text2 = normalizeText(entry?.modelId),
      url = resolveStoredInputUrl(entry),
      kind = normalizeText(fixedInputConfig?.slotKindById?.[current] || entry?.kind);
    if (!url || (text2 && text2 !== model)) return;
    inputsBySlot[current] = {
      ...(entry && typeof entry === 'object' ? entry : {}),
      kind: kind,
      url: url,
    };
  });
  const personReplacementVideoSourceRef = resolvePersonReplacementVideoSourceRef(thumbUrl),
    url2 = personReplacementVideoSourceRef || resolveProjectSourceVideoRef(generationParams2, thumbUrl);
  url2 &&
    fixedInputConfig?.slotKindById?.sourceVideo === 'video' &&
    (!inputsBySlot.sourceVideo || thumbUrl?.videoIterationReferenceRef) &&
    ((inputsBySlot.sourceVideo = {
      kind: 'video',
      url: url2,
      thumbUrl: thumbUrl?.videoIterationReferenceRef
        ? resolveCanvasVideoPosterUrl(
            getPersonReplacementVideoResults(thumbUrl).find(
              (record) => resolvePersonReplacementVideoResultRef(record) === personReplacementVideoSourceRef,
            ),
          )
        : normalizeText(thumbUrl?.keyframeRef),
      pending: !personReplacementVideoSourceRef,
    }),
    readOnlySlots.push('sourceVideo'));
  const url3 = resolvePersonReplacementVideoImageInput(generationParams2, thumbUrl);
  url3.status === 'ready' &&
    fixedInputConfig?.slotKindById?.refImage === 'image' &&
    (inputsBySlot.refImage = { kind: 'image', url: url3.imageRef });
  const slotEntries = Object.fromEntries(
      Object.entries(inputsBySlot)
        .filter(
          ([payload, response2]) =>
            fixedInputConfig?.visibleSlots?.includes(payload) &&
            normalizeText(response2?.url) &&
            response2?.pending !== true,
        )
        .map(([handle, response3]) => [handle, { ...response3, url: normalizeText(response3.url) }]),
    ),
    referenceCounts = { imageCount: 0, videoCount: 0, audioCount: 0 };
  return (
    Object.entries(inputsBySlot).forEach(([state, config]) => {
      const text3 = normalizeText(fixedInputConfig?.slotKindById?.[state] || config?.kind),
        scope = text3 + 'Count';
      Object.hasOwn(referenceCounts, scope) && (referenceCounts[scope] += 1);
    }),
    {
      modelId: model,
      provider: provider,
      fixedInputConfig: fixedInputConfig,
      imageInput: url3,
      inputsBySlot: inputsBySlot,
      readOnlySlots: readOnlySlots,
      slotEntries: slotEntries,
      referenceCounts: referenceCounts,
    }
  );
}
export function buildPersonReplacementVideoSlotPayloadPatch({
  project: project = {},
  shot: shot = {},
  generationParams: generationParams = {},
} = {}) {
  const model2 = resolvePersonReplacementVideoSlotState(project, shot),
    payloadPatch = buildRunningHubVideoFixedSlotPayloadPatch({
      model: model2.modelId,
      nodeData: {
        model: model2.modelId,
        provider: model2.provider,
        generationParams: generationParams,
      },
      slotEntries: model2.slotEntries,
    });
  return { slotState: model2, payloadPatch: payloadPatch };
}
