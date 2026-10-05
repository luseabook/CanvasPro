import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  resolvePersonReplacementVideoGenerationFps,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoParameterPolicy,
} from './personReplacementProject.js';
import {
  buildPersonReplacementVideoSlotPayloadPatch,
  resolvePersonReplacementVideoSlotState,
} from './personReplacementVideoInputs.js';
import { buildModelUiSchemaDefaultParams } from '../../components/aigenImage/uiSchemaRenderer.js';
import { resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import { applyVideoAdaptiveAspectRatio } from '../videoAspectRatioExecution.js';
const normalizeText = (value) => String(value ?? '')['trim']();
export function buildPersonReplacementVideoRequest({
  currentProject: currentProject,
  shot: shot,
  modelId: modelId = currentProject['settings']['replacementModelId'] ||
    PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  provider: provider = resolveModelProvider(modelId),
  providerProfileId: providerProfileId = currentProject['settings']['replacementVideoProviderProfileId'],
  resolvedExecution: resolvedExecution = resolveModelExecution(modelId),
  installId: installId = '',
  imageInput: imageInput = resolvePersonReplacementVideoImageInput(currentProject, shot),
  slotState: slotState = resolvePersonReplacementVideoSlotState(currentProject, shot),
} = {}) {
  const item = (Array['isArray'](shot['people']) ? shot['people'] : [])['filter'](
      (key) => key['targetCharacterId'],
    )['length'],
    rhScail2PersonCount = imageInput['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    args = resolvePersonReplacementVideoParameterPolicy({
      modelId: modelId,
      inputMode: imageInput['mode'],
      generationParams: currentProject['settings']['replacementVideoGenerationParams'],
    }),
    generationParams = {
      rhVideoResolution: 1024,
      rhVideoFrames: 0,
      rhScail2PersonCount: rhScail2PersonCount ? 1 : Math['max'](1, item),
      rhScailDetectPrompt: 'person',
      ...buildModelUiSchemaDefaultParams(modelId),
      ...args['generationParams'],
      rhVideoFps: resolvePersonReplacementVideoGenerationFps(currentProject['settings']),
      ...(rhScail2PersonCount ? { rhScail2PersonCount: 1 } : {}),
    },
    { payloadPatch: payloadPatch } = buildPersonReplacementVideoSlotPayloadPatch({
      project: currentProject,
      shot: shot,
      generationParams: generationParams,
    });
  payloadPatch['maskVideoUrl'] &&
    generationParams['rhSubtractSubject'] === true &&
    ((generationParams['rhSubtractSubject'] = false), (payloadPatch['subtractSubject'] = false));
  payloadPatch['rhBerniniFunction'] &&
    (generationParams['rhBerniniFunction'] = payloadPatch['rhBerniniFunction']);
  const index = {
    model: modelId,
    provider: provider,
    providerProfileId: providerProfileId,
    ...(installId ? { installId: installId } : {}),
    prompt:
      normalizeText(shot['videoPrompt']) ||
      (resolvedExecution?.['modelManifest']?.['prompt']?.['emptyPolicy'] === 'allow'
        ? ''
        : PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT),
    videoUrl: slotState['slotEntries']['sourceVideo']['url'],
    inputUrls: [imageInput['imageRef']],
    ...payloadPatch,
    generationParams: generationParams,
  };
  return (
    applyVideoAdaptiveAspectRatio(index, {
      nodeData: { generationParams: generationParams },
      modelManifest: resolvedExecution?.['modelManifest'],
      provider: provider,
      model: modelId,
      sourceWidth: Number(shot['frame']?.['width']) || 0,
      sourceHeight: Number(shot['frame']?.['height']) || 0,
    }),
    index
  );
}
