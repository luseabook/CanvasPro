import {
  APIMART_QWEN_IMAGE_MODE_FIELD,
  APIMART_QWEN_IMAGE_SIZE_FIELD,
  APIMART_QWEN_IMAGE_RATIO_FIELD,
  APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from './sharedImageModelApiFields.js';
const modelId = 'bailian/qwen-image-3.0',
  executionId = 'bailian.model-api.image.qwen-image-3.v1';
export const bailianImageModelManifests = Object.freeze([
  createImageModelApiManifest({
    modelId: modelId,
    executionId: executionId,
    provider: 'bailian',
    displayName: 'Qwen Image 3.0',
    icon: 'images/qwen.svg',
    description: '百炼官方 · 文生图 / 多图编辑',
    ratioPolicy: { capability: 'dimensions' },
    inputSlots: {
      allowedKinds: ['text', 'image'],
      minByKind: { image: 0 },
      maxByKind: { image: 3, video: 0, audio: 0 },
    },
    fields: [
      APIMART_QWEN_IMAGE_MODE_FIELD,
      APIMART_QWEN_IMAGE_SIZE_FIELD,
      APIMART_QWEN_IMAGE_RATIO_FIELD,
      APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD,
      { id: 'promptExtend', type: 'toggle', placement: 'advanced', label: '提示词优化', defaultValue: true },
      { id: 'enableThinking', type: 'toggle', placement: 'advanced', label: '思考模式', defaultValue: true },
      {
        id: 'negativePrompt',
        type: 'textarea',
        placement: 'advanced',
        label: '反向提示词',
        defaultValue: '',
      },
    ],
    extensions: {
      imageMenu: {
        group: 'bailian',
        order: 10,
        title: 'Qwen Image 3.0',
        subtitle: '标准 / Pro · 最多 3 张参考图',
        iconAlt: 'qwen',
      },
    },
  }),
]);
export const bailianImageExecutionManifests = Object.freeze([
  createModelApiExecutionManifest({
    id: executionId,
    provider: 'bailian',
    model: 'qwen-image-3.0',
    endpoint: '/api/v1/services/aigc/multimodal-generation/generation',
    modeModels: { standard: 'qwen-image-3.0', pro: 'qwen-image-3.0-pro' },
    bodyMapping: [
      { path: 'model', from: 'model' },
      { path: 'parameters.n', from: 'param', field: 'batchSize', defaultValue: 1 },
      { path: 'parameters.prompt_extend', from: 'param', field: 'promptExtend' },
      { path: 'parameters.enable_thinking', from: 'param', field: 'enableThinking' },
      { path: 'parameters.negative_prompt', from: 'param', field: 'negativePrompt', omitWhenEmpty: true },
      { path: 'parameters.watermark', from: 'constant', value: false },
    ],
    responseMapping: {
      resultPaths: ['output.choices[].message.content[].image'],
      errorPath: ['message', 'code'],
    },
    extensions: {
      bodyResolver: 'bailianImage',
      batchSubmitMode: 'providerN',
      requestTimeoutMs: 600000,
      strictInputCounts: true,
      imageInputUpload: {
        provider: 'freeImageHost',
        inputKinds: ['image'],
        strictUpload: true,
        applyInputQualityProfile: true,
      },
    },
  }),
]);
