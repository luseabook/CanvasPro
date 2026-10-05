import {
  VIDEO_SEED_FIELDS,
  VIDEO_RATIO_FIELD,
  createFooterDurationSliderOptionsField,
  createResolutionField,
  createVideoInputSlots,
  freezeBodyMapping,
  freezeOption,
} from './vendorVideoModelApiShared.js';
const DURATION_VALUES = Array['from']({ length: 15 }, (value, item) => item + 1),
  GRSAI_H3_FIELDS = Object['freeze']([
    createResolutionField({ defaultValue: '768p', options: ['480p', '768p', '1080p'] }),
    Object['freeze']({
      ...VIDEO_RATIO_FIELD,
      defaultValue: '16:9',
      options: Object['freeze'](['16:9', '9:16', '1:1']['map'](freezeOption)),
    }),
    createFooterDurationSliderOptionsField({
      values: DURATION_VALUES,
      defaultValue: 10,
      optionOverridesByValue: Object['fromEntries'](
        DURATION_VALUES['filter']((count) => count > 10)['map']((key) => [
          key,
          Object['freeze']({
            disableWhen: Object['freeze']({ field: 'resolution', value: '1080p' }),
            hideWhen: Object['freeze']({ field: 'resolution', value: '1080p' }),
          }),
        ]),
      ),
    }),
    ...VIDEO_SEED_FIELDS,
  ]),
  GRSAI_H3_BODY_MAPPING = freezeBodyMapping([
    { path: 'model', from: 'model' },
    { path: 'prompt', from: 'prompt' },
    { path: 'replyType', from: 'constant', value: 'async' },
    { path: 'aspectRatio', from: 'constant', value: 'landscape' },
    ...[
      ['9:16', 'portrait'],
      ['1:1', 'square'],
    ]['map'](([equals, value2]) => ({
      path: 'aspectRatio',
      from: 'constant',
      value: value2,
      when: Object['freeze']({ field: 'generationParams.aspectRatio', equals: equals }),
    })),
    { path: 'resolution', from: 'param', field: 'generationParams.resolution' },
    { path: 'duration', from: 'param', field: 'generationParams.duration', transform: 'integerParam' },
    { path: 'seed', from: 'param', field: 'generationParams.seed', transform: 'integerParam' },
    { path: 'images', from: 'inputImages', omitWhenEmpty: !![] },
    { path: 'audios', from: 'inputAudios', omitWhenEmpty: !![] },
  ]);
export const GRSAI_VIDEO_MODELS = Object['freeze']([
  Object['freeze']({
    modelId: 'grsai/minimax-h3',
    executionId: 'grsai.model-api.video.minimax-h3.v1',
    displayName: 'MiniMax H3',
    provider: 'grsai',
    icon: 'images/grsai.png',
    model: 'minimax-h3',
    endpoint: '/v1/api/generate',
    description: '480p / 768p / 1080p · 文生视频 / 图片与音频参考',
    fields: GRSAI_H3_FIELDS,
    inputSlots: createVideoInputSlots({ image: 9, video: 0, audio: 3 }),
    bodyMapping: GRSAI_H3_BODY_MAPPING,
    responseMapping: Object['freeze']({
      taskIdPath: 'id',
      statusPath: 'status',
      errorPaths: Object['freeze'](['error']),
      resultPaths: Object['freeze'](['results[].url']),
    }),
    taskPolling: Object['freeze']({
      mode: 'task-proxy',
      method: 'GET',
      urlTemplate: '{baseUrl}/v1/api/result?id={taskId}',
      headersMode: 'bearer',
      successStatuses: Object['freeze'](['succeeded']),
      failedStatuses: Object['freeze'](['failed', 'violation']),
    }),
    resultTaskIdPath: 'id',
    prompt: Object['freeze']({
      placeholder: '描述场景、人物动作、分段运镜、对白和声音；可添加图片与音频参考。',
    }),
    help: Object['freeze']({
      tooltip: Object['freeze']([
        '支持文生视频，最多 9 张参考图和 3 段参考音频。',
        '480p / 768p 支持 1–15 秒；1080p 最多 10 秒。',
        '建议明确描述分段时序、镜头运动、对白和声音要求。',
      ]),
    }),
    extensions: Object['freeze']({ storyWorkspace: Object['freeze']({ promptMode: 'minimax-h3' }) }),
  }),
]);
