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
const normalizeText = (_0x5bc4f8) => String(_0x5bc4f8 ?? '')['trim']();
export function buildPersonReplacementVideoRequest({
  currentProject: _0x4e8a63,
  shot: _0x109f8c,
  modelId: modelId = _0x4e8a63['settings']['replacementModelId'] || PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  provider: provider = resolveModelProvider(modelId),
  providerProfileId: providerProfileId = _0x4e8a63['settings']['replacementVideoProviderProfileId'],
  resolvedExecution: resolvedExecution = resolveModelExecution(modelId),
  installId: installId = '',
  imageInput: imageInput = resolvePersonReplacementVideoImageInput(_0x4e8a63, _0x109f8c),
  slotState: slotState = resolvePersonReplacementVideoSlotState(_0x4e8a63, _0x109f8c),
} = {}) {
  const _0x2b4dc4 = (Array['isArray'](_0x109f8c['people']) ? _0x109f8c['people'] : [])['filter'](
      (_0x1554e4) => _0x1554e4['targetCharacterId'],
    )['length'],
    _0x2a581b = imageInput['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    _0x5ebcf9 = resolvePersonReplacementVideoParameterPolicy({
      modelId: modelId,
      inputMode: imageInput['mode'],
      generationParams: _0x4e8a63['settings']['replacementVideoGenerationParams'],
    }),
    _0x4284eb = {
      rhVideoResolution: 0x400,
      rhVideoFrames: 0x0,
      rhScail2PersonCount: _0x2a581b ? 0x1 : Math['max'](0x1, _0x2b4dc4),
      rhScailDetectPrompt: 'person',
      ...buildModelUiSchemaDefaultParams(modelId),
      ..._0x5ebcf9['generationParams'],
      rhVideoFps: resolvePersonReplacementVideoGenerationFps(_0x4e8a63['settings']),
      ...(_0x2a581b ? { rhScail2PersonCount: 0x1 } : {}),
    },
    { payloadPatch: _0x286b21 } = buildPersonReplacementVideoSlotPayloadPatch({
      project: _0x4e8a63,
      shot: _0x109f8c,
      generationParams: _0x4284eb,
    });
  _0x286b21['maskVideoUrl'] &&
    _0x4284eb['rhSubtractSubject'] === !![] &&
    ((_0x4284eb['rhSubtractSubject'] = ![]), (_0x286b21['subtractSubject'] = ![]));
  _0x286b21['rhBerniniFunction'] && (_0x4284eb['rhBerniniFunction'] = _0x286b21['rhBerniniFunction']);
  const _0x5d534e = {
    model: modelId,
    provider: provider,
    providerProfileId: providerProfileId,
    ...(installId ? { installId: installId } : {}),
    prompt:
      normalizeText(_0x109f8c['videoPrompt']) ||
      (resolvedExecution?.['modelManifest']?.['prompt']?.['emptyPolicy'] === 'allow'
        ? ''
        : PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT),
    videoUrl: slotState['slotEntries']['sourceVideo']['url'],
    inputUrls: [imageInput['imageRef']],
    ..._0x286b21,
    generationParams: _0x4284eb,
  };
  return (
    applyVideoAdaptiveAspectRatio(_0x5d534e, {
      nodeData: { generationParams: _0x4284eb },
      modelManifest: resolvedExecution?.['modelManifest'],
      provider: provider,
      model: modelId,
      sourceWidth: Number(_0x109f8c['frame']?.['width']) || 0x0,
      sourceHeight: Number(_0x109f8c['frame']?.['height']) || 0x0,
    }),
    _0x5d534e
  );
}
