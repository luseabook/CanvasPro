import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
export const SEED_VR2_IMAGE_HD_MODEL_ID = 'runninghub/2098332624828846082';
export const SEED_VR2_IMAGE_HD_EXECUTION_ID = 'runninghub.workflow.seedvr2-image-hd.v1';
export const seedVr2ImageHdModelManifest = Object.freeze({
  schemaVersion: '1.0',
  modelId: SEED_VR2_IMAGE_HD_MODEL_ID,
  executionId: SEED_VR2_IMAGE_HD_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  uiPlacement: ['toolbar'],
  displayName: 'SeedVR2 高清放大',
  icon: 'images/RH.png',
  description: '使用 SeedVR2 将图片高清放大至 2048 或 4096 分辨率',
  extensions: {
    providerProfiles: ['runninghub', 'runninghub-international'],
    imageMenu: { group: 'runninghubWorkflow' },
    imageHdMenu: { enabled: true },
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
        id: 'rhResolution',
        type: 'segmented',
        variant: 'pillMenu',
        placement: 'resolution',
        label: '分辨率',
        menuTitle: '分辨率',
        defaultValue: 4096,
        options: [2048, 4096].map((value) => ({
          value: value,
          label: String(value),
          selectedLabel: '分辨率' + value,
        })),
      },
      RH_IMAGE_INSTANCE_FIELD,
    ],
  },
  async: true,
  cancellable: true,
  outputType: 'image',
});
export const seedVr2ImageHdExecutionManifest = Object.freeze({
  schemaVersion: '1.0',
  id: SEED_VR2_IMAGE_HD_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  workflowId: '2098332624828846082',
  appId: '2098332624828846082',
  extensions: { providerProfileBindings: { 'runninghub-international': { appId: '2098332722527039489' } } },
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  instanceType: {
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  },
  mapping: {
    nodeInfoList: [
      { nodeId: '52', fieldName: 'image', source: 'imageInput', required: true, description: '上传图片' },
      {
        nodeId: '54',
        fieldName: 'value',
        field: 'generationParams.rhResolution',
        defaultValue: 4096,
        transform: 'integer',
        description: '放大分辨率',
      },
    ],
  },
  result: { taskIdPath: 'taskId', urlFields: ['url', 'imageUrl'] },
  validation: { minInputImages: 1, missingInputMessage: '请提供待高清的源图片' },
});
