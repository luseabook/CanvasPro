import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
export const RH_IMAGE_DEPTH_MODEL_ID = 'runninghub/image-depth';
export const RH_IMAGE_DEPTH_EXECUTION_ID = 'runninghub.workflow.image-depth.v1';
export const rhImageDepthModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: RH_IMAGE_DEPTH_MODEL_ID,
  executionId: RH_IMAGE_DEPTH_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  uiPlacement: ['toolbar'],
  displayName: '转为深度图片',
  icon: 'images/RH.png',
  description: '将源图片转换为深度图片',
  extensions: {
    providerProfiles: ['runninghub', 'runninghub-international'],
    imageMenu: { group: 'runninghubWorkflow' },
  },
  capabilities: { inputKinds: ['image'], outputType: 'image', maxImages: 1 },
  inputSlots: {
    allowedKinds: ['image'],
    minByKind: { image: 1 },
    maxByKind: { text: 0, image: 1, video: 0, audio: 0 },
  },
  uiSchema: {
    fields: [
      {
        id: 'mode',
        type: 'segmented',
        variant: 'pillMenu',
        placement: 'mode',
        label: '模式选择',
        menuTitle: '模式选择',
        defaultValue: '0',
        options: [
          { value: '0', label: '模式1' },
          { value: '1', label: '模式2' },
        ],
      },
      {
        id: 'rhResolution',
        type: 'segmented',
        variant: 'pillMenu',
        placement: 'resolution',
        label: '分辨率',
        menuTitle: '分辨率',
        defaultValue: 1024,
        tooltip: '图片最长边的分辨率',
        options: [
          { value: 768, label: '768', selectedLabel: '分辨率768' },
          { value: 1024, label: '1024', selectedLabel: '分辨率1024' },
          { value: 1280, label: '1280', selectedLabel: '分辨率1280' },
        ],
      },
      RH_IMAGE_INSTANCE_FIELD,
    ],
  },
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const rhImageDepthExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: RH_IMAGE_DEPTH_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  workflowId: '2097736713622876162',
  appId: '2097736713622876162',
  extensions: { providerProfileBindings: { 'runninghub-international': { appId: '2097736795579863042' } } },
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  instanceType: {
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  },
  mapping: {
    maxInputImages: 1,
    imageNodes: [{ nodeId: '38', fieldName: 'image', description: '上传图片' }],
    valueNodes: [
      {
        nodeId: '28',
        fieldName: 'value',
        field: 'mode',
        defaultValue: '0',
        description: '选择模式（范围0~1）',
      },
      { nodeId: '24', fieldName: 'value', field: 'rhResolution', defaultValue: 1024, description: '分辨率' },
    ],
  },
  result: { taskIdPath: 'taskId', urlFields: ['url', 'imageUrl'] },
  validation: { minInputImages: 1, missingInputMessage: '请提供待转换的源图片' },
});
