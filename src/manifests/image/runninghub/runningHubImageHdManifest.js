import {
  RH_IMAGE_INSTANCE_FIELD,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../shared/runningHubImageManifestShared.js';
export const RH_IMAGE_HD_MODEL_ID = 'runninghub/2012862147813974018';
export const RH_IMAGE_HD_EXECUTION_ID = 'runninghub.image-hd';
export const rhImageHdModelManifest = Object['freeze']({
  schemaVersion: '1.0',
  modelId: RH_IMAGE_HD_MODEL_ID,
  executionId: RH_IMAGE_HD_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  uiPlacement: ['toolbar'],
  displayName: 'RH高清放大',
  icon: 'images/RH.png',
  description: '提升图像清晰度与分辨率',
  extensions: {
    providerProfiles: ['runninghub', 'runninghub-international'],
    imageMenu: { group: 'runninghubWorkflow' },
    imageHdMenu: { enabled: !![] },
  },
  capabilities: { inputKinds: ['image'], outputType: 'image', maxImages: 0x1 },
  inputSlots: {
    allowedKinds: ['image'],
    minByKind: { image: 0x1 },
    maxByKind: { text: 0x0, image: 0x1, video: 0x0, audio: 0x0 },
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
        defaultValue: 0x780,
        options: [0x500, 0x780, 0xa00]['map']((value) => ({
          value: value,
          label: String(value),
          selectedLabel: '分辨率' + value,
        })),
      },
      RH_IMAGE_INSTANCE_FIELD,
    ],
  },
  async: !![],
  cancellable: !![],
  outputType: 'image',
});
export const rhImageHdExecutionManifest = Object['freeze']({
  schemaVersion: '1.0',
  id: RH_IMAGE_HD_EXECUTION_ID,
  provider: 'runninghubwf',
  kind: 'image',
  adapterType: 'workflow',
  workflowId: '2012862147813974018',
  submitMode: 'runninghub-task-create',
  queryMode: 'runninghubwf-query',
  instanceType: {
    field: 'rhInstanceType',
    defaultValue: 'default',
    allowedValues: RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  },
  mapping: {
    nodeInfoList: [
      { nodeId: '416', fieldName: 'image', source: 'imageInput', required: !![] },
      {
        nodeId: '413',
        fieldName: 'value',
        field: 'generationParams.rhResolution',
        defaultValue: 0x780,
        transform: 'integer',
      },
    ],
  },
  result: { taskIdPath: 'data.taskId', urlFields: ['url', 'imageUrl'] },
  validation: { minInputImages: 0x1, missingInputMessage: '请提供待高清的源图片' },
});
