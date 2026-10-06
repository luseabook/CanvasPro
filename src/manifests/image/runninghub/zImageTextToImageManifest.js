import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
import { ASPECT_RATIO_FIELD } from '../modelApi/sharedImageModelApiFields.js';
export const Z_IMAGE_TEXT_TO_IMAGE_MODEL_ID = 'runninghub/2081817390274408449';
export const Z_IMAGE_TEXT_TO_IMAGE_EXECUTION_ID = 'runninghub.workflow.z-image-text-to-image.v1';
export const zImageTextToImageModelManifest = Object.freeze({
  schemaVersion: '1.0',
  modelId: Z_IMAGE_TEXT_TO_IMAGE_MODEL_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  executionId: Z_IMAGE_TEXT_TO_IMAGE_EXECUTION_ID,
  displayName: 'Z-image 文生图',
  icon: 'images/RH.png',
  description: 'Z-image 文生图工作流，支持尺寸比例、提示词增强、高清与 LoRA 选择',
  prompt: Object.freeze({ placeholder: '输入画面描述' }),
  extensions: Object.freeze({
    imageMenu: Object.freeze({ group: 'runninghubWorkflow', order: 70 }),
    ratioPolicy: Object.freeze({ capability: 'dimensions' }),
  }),
  capabilities: Object.freeze({
    inputKinds: Object.freeze(['text']),
    outputType: 'image',
    maxImages: 0,
  }),
  inputSlots: Object.freeze({
    allowedKinds: Object.freeze(['text']),
    maxByKind: Object.freeze({ text: 1, image: 0, video: 0, audio: 0 }),
  }),
  uiSchema: Object.freeze({
    fields: Object.freeze([
      Object.freeze({
        id: 'imageSize',
        type: 'segmented',
        placement: 'resolution',
        label: '尺寸',
        defaultValue: '2K',
        options: Object.freeze([
          Object.freeze({ value: '1K', label: '1K' }),
          Object.freeze({ value: '1.5K', label: '1.5K' }),
          Object.freeze({ value: '2K', label: '2K' }),
        ]),
      }),
      Object.freeze({ ...ASPECT_RATIO_FIELD, label: '比例', defaultValue: '2:3' }),
      Object.freeze({
        id: 'rhZImagePromptEnhance',
        type: 'toggle',
        placement: 'advanced',
        label: '提示词增强',
        defaultValue: false,
      }),
      Object.freeze({
        id: 'rhZImageHd',
        type: 'toggle',
        placement: 'advanced',
        label: '高清',
        defaultValue: false,
      }),
      Object.freeze({
        id: 'rhZImageLora',
        type: 'select',
        placement: 'advanced',
        label: 'LoRA 选择',
        defaultValue: '1',
        options: Object.freeze([
          Object.freeze({ value: '0', label: '无' }),
          Object.freeze({ value: '1', label: '瑶光' }),
        ]),
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: true,
  cancellable: true,
  outputType: 'image',
});
export const zImageTextToImageExecutionManifest = Object.freeze({
  schemaVersion: '1.0',
  id: Z_IMAGE_TEXT_TO_IMAGE_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  label: 'Z-image 文生图',
  workflowId: '2081817390274408449',
  appId: '2081817390274408449',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object.freeze({
    providerProfileBindings: Object.freeze({
      'runninghub-international': Object.freeze({ appId: '2084569686239842306' }),
    }),
  }),
  instanceType: Object.freeze({
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  }),
  mapping: Object.freeze({
    promptNode: Object.freeze({
      nodeId: '35',
      fieldName: 'value',
      defaultValue: '',
      description: '提示词',
    }),
    dimensionsNode: Object.freeze({
      defaultImageSize: '2K',
      defaultAspectRatio: '2:3',
      longSideByImageSize: Object.freeze({ '1K': 1024, '1.5K': 1536, '2K': 1920 }),
      align: 64,
      widthNode: Object.freeze({ nodeId: '13', fieldName: 'width', description: 'width' }),
      heightNode: Object.freeze({ nodeId: '13', fieldName: 'height', description: 'height' }),
    }),
    valueNodes: Object.freeze([
      Object.freeze({
        nodeId: '72',
        fieldName: 'value',
        field: 'generationParams.rhZImageHd',
        fallbackFields: Object.freeze(['rhZImageHd']),
        defaultValue: false,
        description: '高清',
      }),
      Object.freeze({
        nodeId: '85',
        fieldName: 'value',
        field: 'generationParams.rhZImagePromptEnhance',
        fallbackFields: Object.freeze(['rhZImagePromptEnhance']),
        defaultValue: false,
        description: '提示词增强',
      }),
      Object.freeze({
        nodeId: '87',
        fieldName: 'index',
        field: 'generationParams.rhZImageLora',
        fallbackFields: Object.freeze(['rhZImageLora']),
        defaultValue: '1',
        allowedValues: Object.freeze([0, 1]),
        description: 'LoRA 选择',
      }),
    ]),
  }),
  result: Object.freeze({
    taskIdPath: 'taskId',
    imagePaths: Object.freeze(['results[].url', 'results[].imageUrl']),
  }),
});
