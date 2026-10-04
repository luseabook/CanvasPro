import {
  APIMART_NANO_BANANA_IMAGE_SIZE_FIELD,
  APIMART_QWEN_IMAGE_RATIO_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from './sharedImageModelApiFields.js';
import { AGNES_MODEL_API_PROFILE_IDS } from '../../../modules/agnesProviderProfiles.js';
const AGNES_IMAGE_INPUT_SLOTS = Object.freeze({
    allowedKinds: Object.freeze(['text', 'image']),
    minByKind: Object.freeze({ text: 0, image: 0 }),
    maxByKind: Object.freeze({ image: 8, video: 0, audio: 0 }),
  }),
  AGNES_IMAGE_BODY_MAPPING = Object.freeze([
    Object.freeze({ path: 'model', from: 'model' }),
    Object.freeze({ path: 'prompt', from: 'prompt' }),
    Object.freeze({
      path: 'size',
      from: 'param',
      field: Object.freeze(['generationParams.aspectRatio', 'resolvedRatioLabel', 'aspectRatio']),
      defaultValue: '4:3',
      transform: 'agnesImageSize',
    }),
    Object.freeze({ path: 'extra_body.image', from: 'inputImages', omitWhenEmpty: true }),
  ]),
  AGNES_IMAGE_RESPONSE_MAPPING = Object.freeze({
    statusPath: 'status',
    errorPath: Object.freeze(['error.message', 'message', 'error']),
    resultPaths: Object.freeze(['data[].url', 'data.url', 'results[].url', 'results[].imageUrl', 'url']),
  }),
  AGNES_IMAGE_MODELS = Object.freeze([
    Object.freeze({
      modelId: 'agnes/agnes-image-2.0-flash',
      executionId: 'agnes.model-api.image.agnes-image-2-flash.v1',
      displayName: 'Agnes Image 2.0 Flash',
      model: 'agnes-image-2.0-flash',
      description: 'Agnes AI text-to-image and image-to-image model API',
      inputSlots: AGNES_IMAGE_INPUT_SLOTS,
      bodyMapping: AGNES_IMAGE_BODY_MAPPING,
      order: 10,
    }),
    Object.freeze({
      modelId: 'agnes/agnes-image-2.1-flash',
      executionId: 'agnes.model-api.image.agnes-image-2-1-flash.v1',
      displayName: 'Agnes Image 2.1 Flash',
      model: 'agnes-image-2.1-flash',
      description: 'Agnes AI text-to-image and image-to-image model API',
      inputSlots: AGNES_IMAGE_INPUT_SLOTS,
      bodyMapping: AGNES_IMAGE_BODY_MAPPING,
      order: 20,
    }),
    Object.freeze({
      modelId: 'agnes/agnes-image-2.5-flash',
      executionId: 'agnes.model-api.image.agnes-image-2-5-flash.v1',
      displayName: 'Agnes Image 2.5 Flash',
      model: 'agnes-image-2.5-flash',
      description: 'Agnes AI text-to-image and image-to-image model API',
      inputSlots: AGNES_IMAGE_INPUT_SLOTS,
      bodyMapping: AGNES_IMAGE_BODY_MAPPING,
      order: 30,
    }),
  ]);
export const agnesImageModelApiModelManifests = Object.freeze(
  AGNES_IMAGE_MODELS.map((modelId) =>
    createImageModelApiManifest({
      modelId: modelId.modelId,
      executionId: modelId.executionId,
      provider: 'agnes',
      displayName: modelId.displayName,
      icon: 'AG',
      description: modelId.description,
      fields: Object.freeze([APIMART_NANO_BANANA_IMAGE_SIZE_FIELD, APIMART_QWEN_IMAGE_RATIO_FIELD]),
      inputSlots: modelId.inputSlots,
      extensions: Object.freeze({
        // Declares the domestic and international lines so the key panel can offer the route
        // switch, the same way the video manifests already do.
        providerProfiles: AGNES_MODEL_API_PROFILE_IDS,
        imageMenu: Object.freeze({
          group: 'agnes',
          order: modelId.order,
          title: modelId.displayName,
          subtitle: modelId.description,
          iconKind: 'agnesBadge',
        }),
      }),
    }),
  ),
);
export const agnesImageModelApiExecutionManifests = Object.freeze(
  AGNES_IMAGE_MODELS.map((id) =>
    createModelApiExecutionManifest({
      id: id.executionId,
      provider: 'agnes',
      model: id.model,
      endpoint: '/v1/images/generations',
      endpointMode: 'image-generation',
      bodyMapping: id.bodyMapping,
      responseMapping: AGNES_IMAGE_RESPONSE_MAPPING,
      extensions: Object.freeze({ bodyResolver: 'agnesImage' }),
    }),
  ),
);
