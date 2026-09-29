import {
  rhVideoHailuoH3OmniExecutionManifest,
  rhVideoHailuoH3OmniModelManifest,
} from './runningHubVideoHailuoH3OmniManifest.js';

export const RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_MODEL_ID = 'runninghub/2090422129480265729';
export const RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID =
  'runninghub.workflow.video-hailuo-h3-dual-sampling-x2.v1';

export const rhVideoHailuoH3DualSamplingX2ModelManifest = Object.freeze({
  ...rhVideoHailuoH3OmniModelManifest,
  modelId: RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_MODEL_ID,
  executionId: RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID,
  displayName: '海螺H3双采（分辨率X2）',
});

export const rhVideoHailuoH3DualSamplingX2ExecutionManifest = Object.freeze({
  ...rhVideoHailuoH3OmniExecutionManifest,
  id: RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID,
  label: '海螺H3双采（分辨率X2）',
  workflowId: '2090422129480265729',
  appId: '2090422129480265729',
  extensions: Object.freeze({
    ...rhVideoHailuoH3OmniExecutionManifest.extensions,
    providerProfileBindings: Object.freeze({
      'runninghub-international': Object.freeze({
        workflowId: '2090405010136297474',
      }),
    }),
  }),
});
