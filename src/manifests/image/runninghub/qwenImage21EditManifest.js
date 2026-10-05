import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
import { ASPECT_RATIO_FIELD } from '../modelApi/sharedImageModelApiFields.js';
export const QWEN_IMAGE_21_EDIT_MODEL_ID = 'runninghub/2102016235713159169';
export const QWEN_IMAGE_21_EDIT_EXECUTION_ID = 'runninghub.workflow.qwen-image-21-edit.v1';
const QWEN_IMAGE_21_EDIT_IMAGE_NODES = Object['freeze'](
    ['490', '487', '541', '544', '543', '545', '548', '547', '546']['map']((nodeId, value) =>
      Object['freeze']({ nodeId: nodeId, fieldName: 'image', description: '图像' + (value + 1) }),
    ),
  ),
  QWEN_IMAGE_21_EDIT_CONDITIONING_FIELDS = Object['freeze'](
    Array['from']({ length: 9 }, (item, key) =>
      Object['freeze']({
        nodeId: '518',
        fieldName: 'images.image_' + (key + 1),
        description: '图像' + (key + 1) + '输入',
      }),
    ),
  );
export const QWEN_IMAGE_21_EDIT_HELP_TOOLTIP = [
  'Qwen Image 2.1 图像编辑用法',
  '不接参考图时按提示词生成图片。',
  '接入 1-9 张参考图时，按连接顺序作为图像1至图像9进行编辑。',
  '高级设置可控制是否开启提示词增强。',
]['join']('\n');
export const qwenImage21EditModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: QWEN_IMAGE_21_EDIT_MODEL_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  executionId: QWEN_IMAGE_21_EDIT_EXECUTION_ID,
  displayName: 'Qwen Image 2.1 图像编辑',
  icon: 'images/RH.png',
  description: '支持文生图和最多 9 张参考图的 Qwen Image 2.1 编辑工作流',
  help: Object['freeze']({ tooltip: QWEN_IMAGE_21_EDIT_HELP_TOOLTIP }),
  prompt: Object['freeze']({ placeholder: '描述要生成的画面，或说明图像1至图像9的编辑要求' }),
  extensions: Object['freeze']({
    personReplacement: Object['freeze']({ imageMentionFormat: 'at-image' }),
    providerProfiles: Object['freeze'](['runninghub', 'runninghub-international']),
    imageMenu: Object['freeze']({ group: 'runninghubWorkflow', order: 45 }),
    ratioPolicy: Object['freeze']({ capability: 'dimensions' }),
  }),
  capabilities: Object['freeze']({
    inputKinds: Object['freeze'](['text', 'image']),
    outputType: 'image',
    maxImages: 9,
  }),
  inputSlots: Object['freeze']({
    allowedKinds: Object['freeze'](['text', 'image']),
    minByKind: Object['freeze']({ image: 0 }),
    maxByKind: Object['freeze']({ text: 1, image: 9, video: 0, audio: 0 }),
    displayAspectRatioSource: Object['freeze']({ kind: 'image', fallbackIndex: 0 }),
  }),
  uiSchema: Object['freeze']({
    fields: Object['freeze']([
      Object['freeze']({
        id: 'imageSize',
        type: 'segmented',
        placement: 'resolution',
        label: '尺寸',
        defaultValue: '1K',
        options: Object['freeze']([
          Object['freeze']({ value: '1K', label: '1K' }),
          Object['freeze']({ value: '1.5K', label: '1.5K' }),
          Object['freeze']({ value: '2K', label: '2K' }),
        ]),
      }),
      Object['freeze']({ ...ASPECT_RATIO_FIELD, label: '比例', defaultValue: '自适应' }),
      Object['freeze']({
        id: 'rhQwenImage21PromptEnhance',
        type: 'toggle',
        placement: 'advanced',
        label: '开启提示词增强',
        defaultValue: ![],
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const qwenImage21EditExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: QWEN_IMAGE_21_EDIT_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  label: 'Qwen Image 2.1 图像编辑',
  workflowId: '2102016235713159169',
  submitMode: 'runninghub-task-create',
  queryMode: 'runninghubwf-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ workflowId: '2102082936647565314' }),
    }),
    payloadResolver: 'runninghubQwenImage21Edit',
    taskCreate: Object['freeze']({ retainSeconds: 60 }),
  }),
  instanceType: Object['freeze']({
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  }),
  mapping: Object['freeze']({
    maxInputImages: 9,
    imageLoaderNodes: QWEN_IMAGE_21_EDIT_IMAGE_NODES,
    conditioningImageNodes: QWEN_IMAGE_21_EDIT_CONDITIONING_FIELDS,
    promptNode: Object['freeze']({ nodeId: '489', fieldName: 'value', description: '提示词' }),
    dimensionsNode: Object['freeze']({
      defaultImageSize: '1K',
      defaultAspectRatio: '1:1',
      longSideByImageSize: Object['freeze']({ '1K': 1024, '1.5K': 1536, '2K': 1920 }),
      align: 32,
      minDimension: 512,
      widthNode: Object['freeze']({ nodeId: '481', fieldName: 'width', description: '宽度' }),
      heightNode: Object['freeze']({ nodeId: '481', fieldName: 'height', description: '高度' }),
    }),
    promptEnhanceNode: Object['freeze']({
      nodeId: '536',
      fieldName: 'value',
      field: 'rhQwenImage21PromptEnhance',
      defaultValue: ![],
      description: '开启提示词增强',
    }),
    hasImageNode: Object['freeze']({ nodeId: '579', fieldName: 'value', description: '是否图片增强' }),
    latentSwitchNode: Object['freeze']({
      nodeId: '482',
      fieldName: 'switch',
      description: '是否使用空 Latent',
    }),
  }),
  result: Object['freeze']({ taskIdPath: 'taskId', urlFields: Object['freeze'](['url', 'imageUrl']) }),
});
