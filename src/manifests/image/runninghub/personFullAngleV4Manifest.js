import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
export const PERSON_FULL_ANGLE_V4_MODEL_ID = 'runninghub/1989779993284800514';
export const PERSON_FULL_ANGLE_V4_EXECUTION_ID = 'runninghub.workflow.person-full-angle-v4.v1';
export const PERSON_FULL_ANGLE_V4_SUBSCRIPTION_ALIASES = Object['freeze']([
  'person_full_angle_v4',
  'person_full_angle.pro',
]);
export const PERSON_FULL_ANGLE_V4_HELP_TOOLTIP = [
  '人物全角度V4用法',
  '接入 [[red:1 张人物参考图]]，生成同一人物的全角度参考图',
  '提示词可补充服装、发型、表情和镜头要求，也可以留空',
  '背景提示词放在高级设置中，用于单独约束背景环境',
]['join']('\n');
export const PERSON_FULL_ANGLE_V4_IMAGE_SIZE_FIELD = Object['freeze']({
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
});
export const PERSON_FULL_ANGLE_V4_RATIO_FIELD = Object['freeze']({
  id: 'aspectRatio',
  type: 'segmented',
  placement: 'resolution',
  label: '比例',
  defaultValue: '9:16',
  options: Object['freeze']([
    Object['freeze']({ value: '9:16', label: '9:16' }),
    Object['freeze']({ value: '5:4', label: '5:4' }),
    Object['freeze']({ value: '4:3', label: '4:3' }),
  ]),
});
export const personFullAngleV4ModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: PERSON_FULL_ANGLE_V4_MODEL_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  executionId: PERSON_FULL_ANGLE_V4_EXECUTION_ID,
  displayName: '人物全角度V4',
  icon: 'images/RH.png',
  description: '单图生成人物全角度参考图，支持角色类型、尺寸比例和背景提示词',
  vip: !![],
  subscriptionAliases: PERSON_FULL_ANGLE_V4_SUBSCRIPTION_ALIASES,
  help: Object['freeze']({ tooltip: PERSON_FULL_ANGLE_V4_HELP_TOOLTIP }),
  prompt: Object['freeze']({
    emptyPolicy: 'allow',
    placeholder: '可补充人物外观、服装、表情或镜头提示词，也可以留空',
  }),
  extensions: Object['freeze']({
    imageMenu: Object['freeze']({ group: 'runninghubWorkflow', order: 50 }),
    ratioPolicy: Object['freeze']({ capability: 'dimensions' }),
    vipAliases: PERSON_FULL_ANGLE_V4_SUBSCRIPTION_ALIASES,
  }),
  capabilities: Object['freeze']({
    inputKinds: Object['freeze'](['text', 'image']),
    outputType: 'image',
    maxImages: 1,
    fixedImageSlots: Object['freeze'](['personReference']),
  }),
  inputSlots: Object['freeze']({
    allowedKinds: Object['freeze'](['text', 'image']),
    minByKind: Object['freeze']({ image: 1 }),
    maxByKind: Object['freeze']({ text: 0, image: 1, video: 0, audio: 0 }),
    displayAspectRatioSource: Object['freeze']({
      kind: 'image',
      slot: 'personReference',
      fallbackIndex: 0,
    }),
    fixedSlots: Object['freeze']([
      Object['freeze']({ id: 'personReference', kind: 'image', label: '人物参考', required: !![] }),
    ]),
  }),
  uiSchema: Object['freeze']({
    fields: Object['freeze']([
      Object['freeze']({
        id: 'rhPersonFullAngleCharacterType',
        type: 'segmented',
        placement: 'mode',
        variant: 'pillMenu',
        label: '角色类型',
        defaultValue: '0',
        options: Object['freeze']([
          Object['freeze']({ value: '0', label: '写实女' }),
          Object['freeze']({ value: '1', label: '写实男' }),
          Object['freeze']({ value: '2', label: '动漫女' }),
          Object['freeze']({ value: '3', label: '动漫男' }),
        ]),
      }),
      PERSON_FULL_ANGLE_V4_IMAGE_SIZE_FIELD,
      PERSON_FULL_ANGLE_V4_RATIO_FIELD,
      Object['freeze']({
        id: 'rhPersonFullAngleNewModel',
        type: 'toggle',
        placement: 'advanced',
        label: '新模型切换',
        defaultValue: ![],
      }),
      Object['freeze']({
        id: 'rhPersonFullAngleBackgroundPrompt',
        type: 'textarea',
        placement: 'advanced',
        label: '背景提示词',
        defaultValue: '',
        placeholder: '可选，单独描述背景环境',
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const personFullAngleV4ExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: PERSON_FULL_ANGLE_V4_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  label: '人物全角度V4',
  workflowId: '1989779993284800514',
  appId: '1989779993284800514',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  instanceType: Object['freeze']({
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  }),
  validation: Object['freeze']({ minInputImages: 1, missingInputMessage: '请先添加一张人物参考图再生成' }),
  mapping: Object['freeze']({
    maxInputImages: 1,
    imageNodes: Object['freeze']([
      Object['freeze']({ nodeId: '22', fieldName: 'image', description: '载入图片' }),
    ]),
    promptNode: Object['freeze']({
      nodeId: '226',
      fieldName: 'value',
      defaultValue: '',
      description: '提示词（可以不输入）',
    }),
    dimensionsNode: Object['freeze']({
      defaultImageSize: '1K',
      defaultAspectRatio: '9:16',
      longSideByImageSize: Object['freeze']({ '1K': 1280, '1.5K': 1920, '2K': 2560 }),
      align: 8,
      widthNode: Object['freeze']({ nodeId: '1381', fieldName: 'value', description: '宽' }),
      heightNode: Object['freeze']({ nodeId: '1382', fieldName: 'value', description: '高' }),
    }),
    valueNodes: Object['freeze']([
      Object['freeze']({
        nodeId: '1389',
        fieldName: 'value',
        field: 'rhPersonFullAngleCharacterType',
        defaultValue: '0',
        allowedValues: Object['freeze']([0, 1, 2, 3]),
        description: '写实女0 写实男1 动漫女2 动漫男3',
      }),
      Object['freeze']({
        nodeId: '1319',
        fieldName: 'value',
        field: 'rhPersonFullAngleNewModel',
        defaultValue: ![],
        description: '新模型切换',
      }),
      Object['freeze']({
        nodeId: '1084',
        fieldName: 'value',
        field: 'rhPersonFullAngleBackgroundPrompt',
        defaultValue: '',
        description: '背景提示词',
      }),
    ]),
  }),
  result: Object['freeze']({
    taskIdPath: 'taskId',
    imagePaths: Object['freeze'](['results[].url', 'results[].imageUrl']),
  }),
});
