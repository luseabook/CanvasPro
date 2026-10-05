import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
import { ASPECT_RATIO_FIELD } from '../modelApi/sharedImageModelApiFields.js';
export const KREA2_TEXT_TO_IMAGE_MODEL_ID = 'runninghub/2077034224057667585';
export const KREA2_TEXT_TO_IMAGE_EXECUTION_ID = 'runninghub.workflow.krea2-text-to-image.v1';
export const krea2TextToImageModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: KREA2_TEXT_TO_IMAGE_MODEL_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  executionId: KREA2_TEXT_TO_IMAGE_EXECUTION_ID,
  displayName: 'KREA2文生图',
  icon: 'images/RH.png',
  description: 'KREA2 文生图工作流，支持尺寸比例、提示词强化与高清选项',
  prompt: Object['freeze']({ placeholder: '输入画面描述' }),
  extensions: Object['freeze']({
    imageMenu: Object['freeze']({ group: 'runninghubWorkflow', order: 60 }),
    ratioPolicy: Object['freeze']({ capability: 'dimensions' }),
  }),
  capabilities: Object['freeze']({
    inputKinds: Object['freeze'](['text']),
    outputType: 'image',
    maxImages: 0,
  }),
  inputSlots: Object['freeze']({
    allowedKinds: Object['freeze'](['text']),
    maxByKind: Object['freeze']({ text: 1, image: 0, video: 0, audio: 0 }),
  }),
  uiSchema: Object['freeze']({
    fields: Object['freeze']([
      Object['freeze']({
        id: 'imageSize',
        type: 'segmented',
        placement: 'resolution',
        label: '尺寸',
        defaultValue: '2K',
        options: Object['freeze']([
          Object['freeze']({ value: '1K', label: '1K' }),
          Object['freeze']({ value: '1.5K', label: '1.5K' }),
          Object['freeze']({ value: '2K', label: '2K' }),
        ]),
      }),
      Object['freeze']({ ...ASPECT_RATIO_FIELD, label: '比例', defaultValue: '9:16' }),
      Object['freeze']({
        id: 'rhKrea2PromptEnhance',
        type: 'toggle',
        placement: 'advanced',
        label: '强化提示词',
        defaultValue: ![],
      }),
      Object['freeze']({
        id: 'rhKrea2Hd',
        type: 'toggle',
        placement: 'advanced',
        label: '高清',
        defaultValue: ![],
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const krea2TextToImageExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: KREA2_TEXT_TO_IMAGE_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  label: 'KREA2文生图',
  workflowId: '2077034224057667585',
  appId: '2077034224057667585',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ appId: '2084571123089752065' }),
    }),
  }),
  instanceType: Object['freeze']({
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  }),
  mapping: Object['freeze']({
    promptNode: Object['freeze']({
      nodeId: '170',
      fieldName: 'value',
      defaultValue: '',
      description: '提示词',
    }),
    dimensionsNode: Object['freeze']({
      defaultImageSize: '2K',
      defaultAspectRatio: '9:16',
      longSideByImageSize: Object['freeze']({ '1K': 1024, '1.5K': 1536, '2K': 1920 }),
      align: 64,
      widthNode: Object['freeze']({ nodeId: '171', fieldName: 'width', description: '宽度' }),
      heightNode: Object['freeze']({ nodeId: '171', fieldName: 'height', description: '高度' }),
    }),
    valueNodes: Object['freeze']([
      Object['freeze']({
        nodeId: '178',
        fieldName: 'value',
        field: 'generationParams.rhKrea2PromptEnhance',
        fallbackFields: Object['freeze'](['rhKrea2PromptEnhance']),
        defaultValue: ![],
        description: '是否强化提示词',
      }),
      Object['freeze']({
        nodeId: '192',
        fieldName: 'value',
        field: 'generationParams.rhKrea2Hd',
        fallbackFields: Object['freeze'](['rhKrea2Hd']),
        defaultValue: ![],
        description: '高清',
      }),
    ]),
  }),
  result: Object['freeze']({
    taskIdPath: 'taskId',
    imagePaths: Object['freeze'](['results[].url', 'results[].imageUrl']),
  }),
});
