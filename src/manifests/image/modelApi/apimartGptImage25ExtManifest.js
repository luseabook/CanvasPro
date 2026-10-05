import {
  APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  ASPECT_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  IMAGE_MODEL_API_16_IMAGE_INPUT_SLOTS,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from './sharedImageModelApiFields.js';
import { GPT_IMAGE_2_5_MODE_FIELD } from './gptImage25Fields.js';
import { apimartGptImage25ExecutionManifest } from './apimartGptImage25Manifest.js';
export const APIMART_GPT_IMAGE_2_5_EXT_MODEL_ID = 'apimart/gpt-image-2.5-ext';
export const APIMART_GPT_IMAGE_2_5_EXT_EXECUTION_ID = 'apimart.model-api.gpt-image-2-5-ext.v1';
export const apimartGptImage25ExtModelManifest = createImageModelApiManifest({
  modelId: APIMART_GPT_IMAGE_2_5_EXT_MODEL_ID,
  executionId: APIMART_GPT_IMAGE_2_5_EXT_EXECUTION_ID,
  provider: 'apimart',
  displayName: 'GPT image 2.5 Ext',
  icon: 'AM',
  description: 'APIMart GPT Image 2.5 Ext 图像生成与编辑，支持 Flare / Sunburst。',
  inputSlots: IMAGE_MODEL_API_16_IMAGE_INPUT_SLOTS,
  fields: [
    GPT_IMAGE_2_5_MODE_FIELD,
    APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
    ASPECT_RATIO_FIELD,
    BATCH_SIZE_FIELD,
  ],
  extensions: Object['freeze']({
    imageFunctionMenu: Object['freeze']({ enabled: true }),
    imageMenu: Object['freeze']({
      group: 'apimart',
      order: 42,
      title: 'GPT image 2.5 Ext',
      subtitle: 'Flare / Sunburst，最高 4K，最多 16 张参考图',
      iconKind: 'apimartBadge',
      gap: 10,
    }),
  }),
});
export const apimartGptImage25ExtExecutionManifest = createModelApiExecutionManifest({
  id: APIMART_GPT_IMAGE_2_5_EXT_EXECUTION_ID,
  provider: 'apimart',
  model: 'gpt-image-2.5-ext',
  endpoint: '/v1/images/generations',
  bodyMapping: Object['freeze']([
    Object['freeze']({ path: 'model', from: 'model' }),
    Object['freeze']({ path: 'prompt', from: 'prompt' }),
    Object['freeze']({
      path: 'version',
      from: 'param',
      field: 'generationParams.mode',
      defaultValue: 'flare',
    }),
    Object['freeze']({
      path: 'n',
      from: 'param',
      field: 'generationParams.batchSize',
      defaultValue: 1,
      transform: 'apimartImageCount',
    }),
    Object['freeze']({
      path: 'resolution',
      from: 'param',
      field: 'generationParams.imageSize',
      defaultValue: '1K',
    }),
    Object['freeze']({
      path: 'size',
      from: 'param',
      field: 'generationParams.aspectRatio',
      omitWhenEmpty: true,
      when: Object['freeze']([
        Object['freeze']({
          field: 'generationParams.aspectRatio',
          notIn: Object['freeze'](['自适应', 'auto']),
        }),
        Object['freeze']({ field: 'suppressAspectRatio', falsy: true }),
      ]),
    }),
    Object['freeze']({ path: 'image_urls', from: 'inputImages', omitWhenEmpty: true }),
  ]),
  responseMapping: Object['freeze']({
    ...apimartGptImage25ExecutionManifest['responseMapping'],
    taskIdPath: Object['freeze'](['data[].task_id', 'data.id']),
  }),
  taskPolling: apimartGptImage25ExecutionManifest['extensions']['taskPolling'],
  extensions: Object['freeze']({ batchSubmitMode: 'providerN', maxBatchSize: 4 }),
});
