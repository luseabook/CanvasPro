import {
  RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
  createAspectRatioField,
  createFooterDurationSliderOptionsField,
  createVideoInputSlots,
  freezeBodyMapping,
} from './vendorVideoModelApiShared.js';
import { createMinimaxH3VideoInputSurface } from './minimaxH3VideoModelApiShared.js';
const RUNNINGHUB_HAILUO_H3_MODE_FIELD = Object['freeze']({
  id: 'rh_hailuo_h3_mode',
  type: 'segmented',
  placement: 'mode',
  variant: 'sectionMenu',
  label: '模式选择',
  defaultValue: 'frames',
  options: Object['freeze']([
    Object['freeze']({ value: 'frames', label: '首尾帧' }),
    Object['freeze']({ value: 'reference', label: '多参考' }),
  ]),
});
function createHailuoH3FixedSlot({
  id: id,
  kind: kind,
  label: label,
  mode: mode,
  description: description,
  displayOrder: displayOrder,
}) {
  return Object['freeze']({
    id: id,
    kind: kind,
    label: label,
    description: description,
    displayOrder: displayOrder,
    showWhen: Object['freeze']({ field: 'rh_hailuo_h3_mode', value: mode }),
  });
}
const RUNNINGHUB_HAILUO_H3_FIXED_INPUT_SLOTS = Object['freeze']([
    createHailuoH3FixedSlot({
      id: 'firstFrame',
      kind: 'image',
      label: '首帧',
      mode: 'frames',
      description: '可选；不传图片时自动使用文生视频',
      displayOrder: 0xa,
    }),
    createHailuoH3FixedSlot({
      id: 'lastFrame',
      kind: 'image',
      label: '尾帧',
      mode: 'frames',
      description: '可选；与首帧配合生成首尾帧过渡',
      displayOrder: 0x14,
    }),
    createHailuoH3FixedSlot({
      id: 'referenceImage',
      kind: 'image',
      label: '参考图',
      mode: 'reference',
      description: '多参考模式最多支持 9 张图片',
      displayOrder: 0x1e,
    }),
    createHailuoH3FixedSlot({
      id: 'referenceVideo',
      kind: 'video',
      label: '参考视频',
      mode: 'reference',
      description: '多参考模式最多支持 3 个视频',
      displayOrder: 0x28,
    }),
    createHailuoH3FixedSlot({
      id: 'referenceAudio',
      kind: 'audio',
      label: '参考音频',
      mode: 'reference',
      description: '多参考模式最多支持\x203\x20个音频',
      displayOrder: 0x32,
    }),
  ]),
  RUNNINGHUB_HAILUO_H3_INPUT_POLICY_VARIANTS = Object['freeze']([
    Object['freeze']({
      when: Object['freeze']({ field: 'rh_hailuo_h3_mode', value: 'frames' }),
      allowedKinds: Object['freeze'](['text', 'image']),
      maxByKind: Object['freeze']({ image: 0x2, video: 0x0, audio: 0x0 }),
    }),
  ]),
  RUNNINGHUB_HAILUO_H3_MEDIA_CONSTRAINTS = Object['freeze']({
    image: Object['freeze']({
      maxBytes: 0x1e * 0x400 * 0x400,
      allowedExtensions: Object['freeze'](['jpg', 'jpeg', 'png', 'webp']),
    }),
    video: Object['freeze']({
      minDurationSeconds: 0x2,
      maxDurationSeconds: 0xf,
      maxBytes: 0x32 * 0x400 * 0x400,
      allowedExtensions: Object['freeze'](['mp4', 'mov']),
    }),
    audio: Object['freeze']({
      minDurationSeconds: 0x2,
      maxDurationSeconds: 0xf,
      maxBytes: 0xf * 0x400 * 0x400,
      allowedExtensions: Object['freeze'](['mp3', 'wav']),
    }),
  }),
  RUNNINGHUB_HAILUO_H3_BODY_MAPPING = freezeBodyMapping([
    Object['freeze']({ path: 'prompt', from: 'prompt' }),
    Object['freeze']({
      path: 'rh_hailuo_h3_mode',
      from: 'param',
      field: Object['freeze'](['generationParams.rh_hailuo_h3_mode', 'rh_hailuo_h3_mode']),
      defaultValue: 'frames',
    }),
    Object['freeze']({ path: 'resolution', from: 'constant', value: '2K' }),
    Object['freeze']({
      path: 'duration',
      from: 'param',
      field: Object['freeze'](['generationParams.duration', 'duration']),
      defaultValue: 0x5,
    }),
    Object['freeze']({
      path: 'ratio',
      from: 'param',
      field: Object['freeze'](['generationParams.aspectRatio', 'aspectRatio', 'ratio']),
      defaultValue: '16:9',
    }),
  ]),
  RUNNINGHUB_HAILUO_H3_TEXT_PROMPT_PLACEHOLDER = '描述要生成的视频内容、主体动作、镜头运动和画面风格。',
  RUNNINGHUB_HAILUO_H3_FRAMES_PROMPT_PLACEHOLDER =
    '不传图片时生成文生视频；传一张图片时描述画面如何运动；传首尾两帧时描述过渡过程。',
  RUNNINGHUB_HAILUO_H3_REFERENCE_PROMPT_PLACEHOLDER =
    '结合参考图片、视频或音频，描述主体、动作、声音和镜头关系。';
export const RUNNINGHUB_HAILUO_H3_VIDEO_MODELS = Object['freeze']([
  Object['freeze']({
    provider: 'runninghub',
    modelId: 'runninghub-model/hailuo-h3',
    executionId: 'runninghub.model-api.video.hailuo-h3.v1',
    displayName: 'MiniMax-H3',
    icon: 'images/RH.png',
    description: 'RunningHub\x20MiniMax-H3（Hailuo-03）2K\x20视频模型\x20API',
    model: 'minimax/hailuo-h3',
    endpoint: '/openapi/v2/minimax/hailuo-h3/text-to-video',
    fields: Object['freeze']([
      RUNNINGHUB_HAILUO_H3_MODE_FIELD,
      createAspectRatioField({
        label: '宽高比',
        defaultValue: '16:9',
        options: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      }),
      createFooterDurationSliderOptionsField({
        values: [0x5, 0x6, 0x7, 0x8, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf],
        defaultValue: 0x5,
      }),
    ]),
    inputSlots: createVideoInputSlots({
      image: 0x9,
      video: 0x3,
      audio: 0x3,
      fixedSlots: RUNNINGHUB_HAILUO_H3_FIXED_INPUT_SLOTS,
      cycleFixedInputWhenFull: !![],
      preserveHiddenInputsByKind: !![],
      policyVariants: RUNNINGHUB_HAILUO_H3_INPUT_POLICY_VARIANTS,
      mediaConstraintsByKind: RUNNINGHUB_HAILUO_H3_MEDIA_CONSTRAINTS,
    }),
    bodyMapping: RUNNINGHUB_HAILUO_H3_BODY_MAPPING,
    responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
    taskPolling: null,
    resultTaskIdPath: 'taskId',
    executionExtensions: Object['freeze']({
      bodyResolver: 'runninghubHailuoH3Video',
      endpointResolver: 'runninghubHailuoH3VideoEndpoint',
    }),
    ratioPolicy: Object['freeze']({ capability: 'size', preserveAdaptive: !![] }),
    prompt: Object['freeze']({
      placeholder: RUNNINGHUB_HAILUO_H3_FRAMES_PROMPT_PLACEHOLDER,
      variants: Object['freeze']([
        Object['freeze']({
          when: Object['freeze']({ field: 'rh_hailuo_h3_mode', value: 'frames' }),
          placeholder: RUNNINGHUB_HAILUO_H3_FRAMES_PROMPT_PLACEHOLDER,
        }),
        Object['freeze']({
          when: Object['freeze']({ field: 'rh_hailuo_h3_mode', value: 'reference' }),
          placeholder: RUNNINGHUB_HAILUO_H3_REFERENCE_PROMPT_PLACEHOLDER,
        }),
      ]),
    }),
    help: Object['freeze']({
      tooltip: Object['freeze']([
        'MiniMax-H3（Hailuo-03），固定 2K 输出，支持 5-15 秒。',
        '首尾帧模式：无图片自动文生视频；一张图片自动图生视频；两张图片作为首尾帧。',
        '多参考模式：最多支持\x209\x20张图片、3\x20个视频和\x203\x20个音频。',
        RUNNINGHUB_HAILUO_H3_TEXT_PROMPT_PLACEHOLDER,
      ]),
    }),
    extensions: Object['freeze']({
      storyWorkspace: Object['freeze']({ promptMode: 'minimax-h3' }),
      videoMenu: Object['freeze']({
        role: 'runninghubModel',
        order: 0x64,
        label: 'MiniMax-H3',
        subtitle: '2K，文生 / 图生 / 首尾帧 / 多参考',
      }),
      videoInputSurface: createMinimaxH3VideoInputSurface(RUNNINGHUB_HAILUO_H3_MODE_FIELD['id']),
    }),
  }),
]);
