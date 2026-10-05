import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_DEPTH_MODEL_ID = 'runninghub/2095266738832240641';
export const RH_VIDEO_DEPTH_EXECUTION_ID = 'runninghub.workflow.video-depth.v1';
export const rhVideoDepthModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_DEPTH_MODEL_ID,
  executionId: RH_VIDEO_DEPTH_EXECUTION_ID,
  uiPlacement: ['toolbar'],
  displayName: '转为深度视频',
  description: '将源视频转换为深度视频的 RunningHub 工作流',
  extensions: Object['freeze']({
    providerProfiles: Object['freeze'](['runninghub', 'runninghub-international']),
    videoToolbarAction: Object['freeze']({
      action: 'depth-video',
      taskType: 'video-depth',
      i18nKey: 'videoDepth',
      nodeIdPrefix: 'source-video-depth',
      fileNamePrefix: 'depth_video',
      toolbarTaskOutputTextIncludes: Object['freeze'](['转为深度视频', '深度视频']),
    }),
    sourceVideoTaskName: Object['freeze']({
      key: 'depth',
      textNeedles: Object['freeze'](['转为深度视频', '深度视频']),
      managedNamePattern: '^深度视频(?:\\s*\\((?:处理中|恢复中|失败|已取消)\\))?$',
      names: Object['freeze']({
        success: '深度视频',
        failed: '深度视频 (失败)',
        cancelled: '深度视频 (已取消)',
      }),
    }),
  }),
  fixedAssetSlots: ['sourceVideo'],
  inputSlots: {
    allowedKinds: ['video'],
    minByKind: { video: 1 },
    maxByKind: { image: 0, video: 1, audio: 0 },
    fixedSlots: Object['freeze']([
      Object['freeze']({ id: 'sourceVideo', kind: 'video', label: '源视频', required: true }),
    ]),
  },
  uiFields: [
    RH_INSTANCE_FIELD,
    Object['freeze']({
      id: 'mode',
      type: 'segmented',
      variant: 'pillMenu',
      placement: 'mode',
      label: '模式选择',
      menuTitle: '模式选择',
      defaultValue: '0',
      options: Object['freeze']([
        Object['freeze']({ value: '0', label: '模式1' }),
        Object['freeze']({ value: '1', label: '模式2' }),
      ]),
    }),
    Object['freeze']({
      ...RH_VIDEO_RESOLUTION_FIELD,
      type: 'segmented',
      placement: 'resolution',
      defaultValue: 1024,
      tooltip: '视频最长边的分辨率',
      showInfoTip: true,
      options: Object['freeze']([
        Object['freeze']({ value: 768, label: '768' }),
        Object['freeze']({ value: 1024, label: '1024' }),
        Object['freeze']({ value: 1280, label: '1280' }),
      ]),
    }),
  ],
});
export const rhVideoDepthExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_DEPTH_EXECUTION_ID,
  label: '转为深度视频',
  workflowId: '2095266738832240641',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ appId: '2095267024489771009' }),
    }),
  }),
  mapping: {
    nodeInfoList: Object['freeze']([
      Object['freeze']({
        nodeId: '21',
        fieldName: 'video',
        source: 'videoInput',
        field: 'videoUrl',
        required: true,
        missingMessage: '请提供待转换的源视频',
        uploadFailedMessage: '源视频上传到 RunningHub 失败',
        description: '上传视频',
      }),
      Object['freeze']({
        nodeId: '28',
        fieldName: 'value',
        source: 'param',
        field: 'mode',
        defaultValue: '0',
        description: '选择模式（范围0~1）',
      }),
      Object['freeze']({
        nodeId: '24',
        fieldName: 'value',
        source: 'param',
        field: 'rhVideoResolution',
        defaultValue: 1024,
        description: '分辨率',
      }),
    ]),
  },
});
