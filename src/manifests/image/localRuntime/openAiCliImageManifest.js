import {
  ASPECT_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  GPT_IMAGE_2_IMAGE_SIZE_FIELD,
} from '../modelApi/sharedImageModelApiFields.js';
const OPENAI_CLI_IMAGE_INPUT_SLOTS = Object.freeze({
    allowedKinds: Object.freeze(['text', 'image']),
    minByKind: Object.freeze({ text: 0 }),
    maxByKind: Object.freeze({ image: 5, video: 0, audio: 0 }),
  }),
  OPENAI_CLI_IMAGE_UI_SCHEMA = Object.freeze({
    fields: Object.freeze([
      Object.freeze({
        ...GPT_IMAGE_2_IMAGE_SIZE_FIELD,
        showInfoTip: true,
        description: '比例和分辨率作为创作要求传给 Codex，实际输出以生成结果为准。',
      }),
      ASPECT_RATIO_FIELD,
      Object.freeze({
        ...BATCH_SIZE_FIELD,
        showInfoTip: true,
        menuTooltip: '逐次生成独立图片，每次均使用 Codex 额度。',
      }),
    ]),
  }),
  OPENAI_CLI_IMAGE_RESULT = Object.freeze({ urlFields: Object.freeze(['imageUrl', 'url']) });
export const OPENAI_CLI_IMAGE_MODEL_ID = 'openai-cli/image-generation';
export const OPENAI_CLI_IMAGE_EXECUTION_ID = 'openai-cli.local-runtime.image-generation.v1';
export const openAiCliImageModelManifests = Object.freeze([
  Object.freeze({
    schemaVersion: '1.0',
    modelId: OPENAI_CLI_IMAGE_MODEL_ID,
    provider: 'openai-cli',
    kind: 'image',
    adapterType: 'localRuntime',
    executionId: OPENAI_CLI_IMAGE_EXECUTION_ID,
    displayName: 'GPT Image 2',
    description:
      '使用已登录的 Codex 内置生图，当前官方标注为 GPT Image 2；底层版本由 Codex 管理。比例和分辨率为创作要求。',
    inputSlots: OPENAI_CLI_IMAGE_INPUT_SLOTS,
    uiSchema: OPENAI_CLI_IMAGE_UI_SCHEMA,
    async: false,
    cancellable: false,
    outputType: 'image',
    extensions: Object.freeze({
      imageFunctionMenu: Object.freeze({ enabled: true }),
      inputValidation: Object.freeze({ rejectImageOverflow: true }),
      imageMenu: Object.freeze({
        group: 'openai-cli',
        order: 10,
        title: 'GPT Image 2',
        subtitle: 'OpenAI CLI · Codex 额度 · 比例/分辨率为创作要求',
        iconKind: 'openAiBadge',
      }),
    }),
  }),
]);
export const openAiCliImageExecutionManifests = Object.freeze([
  Object.freeze({
    schemaVersion: '1.0',
    id: OPENAI_CLI_IMAGE_EXECUTION_ID,
    provider: 'openai-cli',
    kind: 'image',
    adapterType: 'localRuntime',
    runtime: 'openAiCliImage',
    result: OPENAI_CLI_IMAGE_RESULT,
    extensions: Object.freeze({
      cliProvider: 'codex',
      promptFields: Object.freeze([
        Object.freeze({ field: 'imageSize', template: 'Requested image resolution tier: {value}.' }),
        Object.freeze({
          field: 'aspectRatio',
          template: 'Requested image aspect ratio: {value}.',
          omitValues: Object.freeze(['自适应']),
        }),
      ]),
    }),
  }),
]);
