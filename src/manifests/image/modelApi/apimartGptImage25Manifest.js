import {
  APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  APIMART_GPT_IMAGE_2_QUALITY_FIELD,
  APIMART_GPT_IMAGE_2_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  IMAGE_MODEL_API_16_IMAGE_INPUT_SLOTS,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from './sharedImageModelApiFields.js';
import { GPT_IMAGE_2_5_MODE_FIELD } from './gptImage25Fields.js';
export const APIMART_GPT_IMAGE_2_5_MODEL_ID = 'apimart/gpt-image-2.5';
export const APIMART_GPT_IMAGE_2_5_EXECUTION_ID = 'apimart.model-api.gpt-image-2-5.v1';
const MODE_FIELD = Object.freeze({
    ...GPT_IMAGE_2_5_MODE_FIELD,
    menuTooltip: 'Flare 侧重生成速度，Sunburst 侧重编辑精度。两种模式计费标准相同。',
  }),
  QUALITY_DESCRIPTION =
    '支持 low / medium / high / xhigh / max 五档质量。auto 由模型决定质量，提交时按当前尺寸的 max 档预留额度，完成后按实际用量结算。',
  QUALITY_FIELD = Object.freeze({
    ...APIMART_GPT_IMAGE_2_QUALITY_FIELD,
    showWhen: null,
    description: QUALITY_DESCRIPTION,
    menuTooltip: QUALITY_DESCRIPTION,
    options: Object.freeze([
      Object.freeze({ value: 'low', label: '低' }),
      Object.freeze({ value: 'medium', label: '中' }),
      Object.freeze({ value: 'high', label: '高' }),
      Object.freeze({ value: 'xhigh', label: '超高' }),
      Object.freeze({ value: 'max', label: '最高' }),
      Object.freeze({ value: 'auto', label: '自动' }),
    ]),
  });
export const apimartGptImage25ModelManifest = createImageModelApiManifest({
  modelId: APIMART_GPT_IMAGE_2_5_MODEL_ID,
  executionId: APIMART_GPT_IMAGE_2_5_EXECUTION_ID,
  provider: 'apimart',
  displayName: 'GPT image 2.5',
  icon: 'AM',
  description: 'APIMart GPT Image 2.5 图像生成与编辑，支持 Flare / Sunburst。',
  inputSlots: IMAGE_MODEL_API_16_IMAGE_INPUT_SLOTS,
  fields: [
    MODE_FIELD,
    QUALITY_FIELD,
    APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
    APIMART_GPT_IMAGE_2_RATIO_FIELD,
    BATCH_SIZE_FIELD,
  ],
  extensions: Object.freeze({
    imageFunctionMenu: Object.freeze({ enabled: true }),
    imageMenu: Object.freeze({
      group: 'apimart',
      order: 41,
      title: 'GPT image 2.5',
      subtitle: 'Flare 快速生成 / Sunburst 精细编辑，最多 16 张参考图',
      iconKind: 'apimartBadge',
      gap: 10,
    }),
  }),
});
export const apimartGptImage25ExecutionManifest = createModelApiExecutionManifest({
  id: APIMART_GPT_IMAGE_2_5_EXECUTION_ID,
  provider: 'apimart',
  model: 'gpt-image-2.5-flare',
  endpoint: '/v1/images/generations',
  modeModels: Object.freeze({ flare: 'gpt-image-2.5-flare', sunburst: 'gpt-image-2.5-sunburst' }),
  bodyMapping: Object.freeze([
    Object.freeze({ path: 'model', from: 'model' }),
    Object.freeze({ path: 'prompt', from: 'prompt' }),
    Object.freeze({
      path: 'n',
      from: 'param',
      field: Object.freeze(['generationParams.batchSize', 'batchSize']),
      defaultValue: 1,
      transform: 'apimartImageCount',
    }),
    Object.freeze({
      path: 'resolution',
      from: 'param',
      field: Object.freeze(['generationParams.imageSize', 'imageSize']),
      defaultValue: '1K',
      transform: 'apimartGptImage2Resolution',
    }),
    Object.freeze({
      path: 'size',
      from: 'param',
      field: Object.freeze(['generationParams.aspectRatio', 'resolvedRatioLabel', 'aspectRatio']),
      transform: 'providerRatioSize',
      omitWhenEmpty: true,
    }),
    Object.freeze({
      path: 'quality',
      from: 'param',
      field: Object.freeze(['generationParams.quality', 'quality']),
      defaultValue: 'medium',
    }),
    Object.freeze({ path: 'image_urls', from: 'inputImages', omitWhenEmpty: true }),
  ]),
  responseMapping: Object.freeze({
    taskIdPath: 'data[].task_id',
    statusPath: 'status',
    errorPath: 'error',
    resultPaths: Object.freeze(['data.result.images[].url', 'result.images[].url']),
  }),
  taskPolling: Object.freeze({
    mode: 'task-proxy',
    method: 'GET',
    urlTemplate: '{baseUrl}/v1/tasks/{taskId}?language=zh',
    headersMode: 'bearer',
  }),
  extensions: Object.freeze({ batchSubmitMode: 'providerN', maxBatchSize: 4 }),
});
