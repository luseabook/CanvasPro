const CLI_TEXT_INPUT_SLOTS = Object.freeze({
    allowedKinds: Object.freeze(['text', 'image']),
    minByKind: Object.freeze({ text: 0 }),
    maxByKind: Object.freeze({ image: 5, video: 0, audio: 0 }),
  }),
  CLI_TEXT_UI_SCHEMA = Object.freeze({
    fields: Object.freeze([
      Object.freeze({
        id: 'cliModel',
        type: 'segmented',
        placement: 'mode',
        variant: 'pillMenu',
        label: '模型选择',
        menuTitle: '模型选择',
        defaultValue: 'auto',
        options: Object.freeze([
          Object.freeze({ value: 'auto', label: '自动', selectedLabel: '模型：自动' }),
        ]),
        extensions: Object.freeze({
          runtimeOptions: Object.freeze({ source: 'cliProviderModelCatalog', kind: 'model' }),
        }),
      }),
      Object.freeze({
        id: 'reasoningEffort',
        type: 'segmented',
        placement: 'mode',
        variant: 'pillMenu',
        label: '推理档位',
        menuTitle: '推理档位',
        defaultValue: 'auto',
        options: Object.freeze([
          Object.freeze({ value: 'auto', label: '自动', selectedLabel: '推理：自动' }),
        ]),
        extensions: Object.freeze({
          runtimeOptions: Object.freeze({
            source: 'cliProviderModelCatalog',
            kind: 'reasoningEffort',
            modelField: 'cliModel',
          }),
        }),
      }),
    ]),
  }),
  CLI_TEXT_RESULT = Object.freeze({ textFields: Object.freeze(['text']) });
function createCliTextModelManifest({
  modelId: modelId,
  executionId: executionId,
  provider: provider,
  displayName: displayName,
  icon: icon,
  title: title,
  subtitle: subtitle,
  order: order,
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: modelId,
    provider: provider,
    kind: 'text',
    adapterType: 'localRuntime',
    executionId: executionId,
    displayName: displayName,
    icon: icon,
    description: subtitle,
    inputSlots: CLI_TEXT_INPUT_SLOTS,
    uiSchema: CLI_TEXT_UI_SCHEMA,
    async: false,
    cancellable: false,
    outputType: 'text',
    extensions: Object.freeze({
      textMenu: Object.freeze({
        group: provider,
        order: order,
        title: title,
        subtitle: subtitle,
        icon: 'oa',
      }),
    }),
  });
}
function createCliTextExecutionManifest({ id: id, provider: provider2, cliProvider: cliProvider }) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: id,
    provider: provider2,
    kind: 'text',
    adapterType: 'localRuntime',
    runtime: 'cliText',
    result: CLI_TEXT_RESULT,
    extensions: Object.freeze({ cliProvider: cliProvider }),
  });
}
export const CODEX_CLI_TEXT_MODEL_ID = 'codex-cli/default';
export const CODEX_CLI_TEXT_EXECUTION_ID = 'codex-cli.local-runtime.text.default.v1';
export const cliTextModelManifests = Object.freeze([
  createCliTextModelManifest({
    modelId: CODEX_CLI_TEXT_MODEL_ID,
    executionId: CODEX_CLI_TEXT_EXECUTION_ID,
    provider: 'codex-cli',
    displayName: 'OpenAI CLI',
    icon: 'OA',
    title: 'OpenAI CLI',
    subtitle: '使用本机 ChatGPT/Codex 账号额度生成文本',
    order: 10,
  }),
]);
export const cliTextExecutionManifests = Object.freeze([
  createCliTextExecutionManifest({
    id: CODEX_CLI_TEXT_EXECUTION_ID,
    provider: 'codex-cli',
    cliProvider: 'codex',
  }),
]);
