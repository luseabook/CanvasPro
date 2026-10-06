import {
  createMinimaxH3Fields,
  createMinimaxH3InputSlots,
  createMinimaxH3Prompt,
  createMinimaxH3VideoInputSurface,
  MINIMAX_H3_HELP_TOOLTIP,
} from './minimaxH3VideoModelApiShared.js';
import { freezeBodyMapping, VIDEO_SIZE_RATIO_POLICY } from './vendorVideoModelApiShared.js';
import { MINIMAX_MODEL_API_PROFILE_IDS } from '../../../modules/minimaxProviderProfiles.js';
const MINIMAX_H3_MODE_FIELD_ID = 'minimax_h3_mode',
  MINIMAX_H3_BODY_MAPPING = freezeBodyMapping([
    Object.freeze({ path: 'model', from: 'model' }),
    Object.freeze({ path: 'prompt', from: 'prompt' }),
    Object.freeze({
      path: MINIMAX_H3_MODE_FIELD_ID,
      from: 'param',
      field: Object.freeze(['generationParams.' + MINIMAX_H3_MODE_FIELD_ID, MINIMAX_H3_MODE_FIELD_ID]),
      defaultValue: 'frames',
    }),
    Object.freeze({
      path: 'resolution',
      from: 'param',
      field: Object.freeze(['generationParams.resolution', 'resolution']),
      defaultValue: '2K',
    }),
    Object.freeze({
      path: 'duration',
      from: 'param',
      field: Object.freeze(['generationParams.duration', 'duration']),
      defaultValue: 5,
    }),
    Object.freeze({
      path: 'ratio',
      from: 'param',
      field: Object.freeze(['generationParams.aspectRatio', 'aspectRatio', 'ratio']),
      defaultValue: '16:9',
    }),
    Object.freeze({
      path: 'aigc_watermark',
      from: 'param',
      field: Object.freeze(['generationParams.watermark', 'watermark', 'aigc_watermark']),
      defaultValue: false,
      transform: 'booleanParam',
    }),
  ]),
  MINIMAX_H3_RESPONSE_MAPPING = Object.freeze({
    taskIdPath: 'task_id',
    statusPath: 'task.status',
    errorPaths: Object.freeze(['task.error.message', 'error.message', 'error']),
    resultPaths: Object.freeze(['task.content.url']),
  }),
  MINIMAX_H3_TASK_POLLING = Object.freeze({
    mode: 'task-proxy',
    method: 'GET',
    urlTemplate: '{baseUrl}/v2/query/video_generation/{taskId}',
    headersMode: 'bearer',
    successStatuses: Object.freeze(['succeeded']),
    failedStatuses: Object.freeze(['failed', 'cancelled']),
  });
export const MINIMAX_VIDEO_MODELS = Object.freeze([
  Object.freeze({
    modelId: 'minimax/hailuo-h3',
    executionId: 'minimax.model-api.video.hailuo-h3.v1',
    displayName: '海螺H3',
    provider: 'minimax',
    icon: 'images/minimax-logo.avif',
    model: 'MiniMax-H3',
    endpoint: '/v2/video_generation',
    description: 'MiniMAX 官方海螺 H3 视频模型 API',
    fields: createMinimaxH3Fields(MINIMAX_H3_MODE_FIELD_ID),
    inputSlots: createMinimaxH3InputSlots(MINIMAX_H3_MODE_FIELD_ID),
    bodyMapping: MINIMAX_H3_BODY_MAPPING,
    responseMapping: MINIMAX_H3_RESPONSE_MAPPING,
    taskPolling: MINIMAX_H3_TASK_POLLING,
    resultTaskIdPath: 'task_id',
    executionExtensions: Object.freeze({
      bodyResolver: 'minimaxH3Video',
      mergeGenericInputImagesWithSlots: true,
    }),
    ratioPolicy: Object.freeze({ ...VIDEO_SIZE_RATIO_POLICY, preserveAdaptive: true }),
    prompt: createMinimaxH3Prompt(MINIMAX_H3_MODE_FIELD_ID),
    help: Object.freeze({ tooltip: MINIMAX_H3_HELP_TOOLTIP }),
    extensions: Object.freeze({
      storyWorkspace: Object.freeze({ promptMode: 'minimax-h3' }),
      providerProfiles: MINIMAX_MODEL_API_PROFILE_IDS,
      videoMenu: Object.freeze({
        role: 'minimaxOfficialModel',
        order: 10,
        label: '海螺H3',
        subtitle: '768P / 2K · 文生 / 首尾帧 / 多参考',
      }),
      videoInputSurface: createMinimaxH3VideoInputSurface(MINIMAX_H3_MODE_FIELD_ID),
    }),
  }),
]);
