import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
export const ANIME_REAL_V3_MODEL_ID = 'runninghub/2076822239906979842';
export const ANIME_REAL_V3_EXECUTION_ID = 'runninghub.workflow.anime-real-v3.v1';
export const ANIME_REAL_V3_HELP_TOOLTIP = [
  '漫画转真人V3用法',
  '接入 [[red:1 张漫画/二次元角色图]]',
  '调整分辨率后生成写实人像',
]['join']('\x0a');
export const animeRealV3ModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: ANIME_REAL_V3_MODEL_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  executionId: ANIME_REAL_V3_EXECUTION_ID,
  displayName: '漫画转真人V3',
  icon: 'images/RH.png',
  description: '基于工作流把二次元角色转写实人像',
  help: Object['freeze']({ tooltip: ANIME_REAL_V3_HELP_TOOLTIP }),
  extensions: Object['freeze']({
    imageMenu: Object['freeze']({ group: 'runninghubWorkflow', order: 0x23 }),
    imageNodeUi: Object['freeze']({
      alwaysShowRefBar: !![],
      rootClass: 'rh-anime-real-node',
      workflowBusyButton: !![],
      inputGate: Object['freeze']({
        kind: 'image',
        max: 0x1,
        uploadedUrlField: 'rhAnimeRealRefUrl',
        clearFields: Object['freeze']([
          'rhAnimeRealRefUrl',
          'rhAnimeRealRefLocalPath',
          'rhAnimeRealRefFileName',
        ]),
        missingMessage: '请先上传一张参考图再生成',
      }),
    }),
  }),
  capabilities: Object['freeze']({
    inputKinds: Object['freeze'](['image']),
    outputType: 'image',
    maxImages: 0x1,
  }),
  inputSlots: Object['freeze']({
    allowedKinds: Object['freeze'](['image']),
    minByKind: Object['freeze']({ image: 0x1 }),
    maxByKind: Object['freeze']({ text: 0x0, image: 0x1, video: 0x0, audio: 0x0 }),
  }),
  uiSchema: Object['freeze']({
    fields: Object['freeze']([
      Object['freeze']({
        id: 'rhAnimeRealResolution',
        type: 'slider',
        placement: 'resolution',
        label: '分辨率',
        defaultValue: 0x540,
        options: Object['freeze']([
          Object['freeze']({ value: 0x500, label: '1280' }),
          Object['freeze']({ value: 0x540, label: '1344' }),
          Object['freeze']({ value: 0x5a0, label: '1440' }),
          Object['freeze']({ value: 0x640, label: '1600' }),
          Object['freeze']({ value: 0x6e0, label: '1760' }),
          Object['freeze']({ value: 0x780, label: '1920' }),
        ]),
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const animeRealV3ExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: ANIME_REAL_V3_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  workflowId: '2076822239906979842',
  appId: '2076822239906979842',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ appId: '2084568195419193346' }),
    }),
  }),
  instanceType: Object['freeze']({
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  }),
  mapping: Object['freeze']({
    maxInputImages: 0x1,
    imageNodes: Object['freeze']([
      Object['freeze']({ nodeId: '97', fieldName: 'image', description: '上传图片' }),
    ]),
    valueNodes: Object['freeze']([
      Object['freeze']({
        nodeId: '85',
        fieldName: 'value',
        field: 'rhAnimeRealResolution',
        fallbackFields: Object['freeze'](['rhResolution']),
        defaultValue: 0x540,
        description: '分辨率',
      }),
    ]),
  }),
  result: Object['freeze']({ taskIdPath: 'taskId', urlFields: Object['freeze'](['url', 'imageUrl']) }),
  validation: Object['freeze']({ minInputImages: 0x1, missingInputMessage: '请添加一张参考图片' }),
});
