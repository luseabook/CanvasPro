const CLI_TEXT_INPUT_SLOTS = Object['freeze']({
    allowedKinds: Object['freeze'](['text', 'image']),
    minByKind: Object['freeze']({ text: 0x0 }),
    maxByKind: Object['freeze']({ image: 0x5, video: 0x0, audio: 0x0 }),
  }),
  CLI_TEXT_UI_SCHEMA = Object['freeze']({
    fields: Object['freeze']([
      Object['freeze']({
        id: 'cliModel',
        type: 'segmented',
        placement: 'mode',
        variant: 'pillMenu',
        label: '模型选择',
        menuTitle: '模型选择',
        defaultValue: 'auto',
        options: Object['freeze']([
          Object['freeze']({ value: 'auto', label: '自动', selectedLabel: '模型：自动' }),
        ]),
        extensions: Object['freeze']({
          runtimeOptions: Object['freeze']({ source: 'cliProviderModelCatalog', kind: 'model' }),
        }),
      }),
      Object['freeze']({
        id: 'reasoningEffort',
        type: 'segmented',
        placement: 'mode',
        variant: 'pillMenu',
        label: '推理档位',
        menuTitle: '推理档位',
        defaultValue: 'auto',
        options: Object['freeze']([
          Object['freeze']({ value: 'auto', label: '自动', selectedLabel: '推理：自动' }),
        ]),
        extensions: Object['freeze']({
          runtimeOptions: Object['freeze']({
            source: 'cliProviderModelCatalog',
            kind: 'reasoningEffort',
            modelField: 'cliModel',
          }),
        }),
      }),
    ]),
  }),
  CLI_TEXT_RESULT = Object['freeze']({ textFields: Object['freeze'](['text']) });
function createCliTextModelManifest({
  modelId: _0x88719,
  executionId: _0x470b52,
  provider: _0x5fe2a5,
  displayName: _0x3e4fd3,
  icon: _0x59b291,
  title: _0x578a4f,
  subtitle: _0x559b47,
  order: _0x1995f5,
}) {
  return Object['freeze']({
    schemaVersion: '1.0',
    modelId: _0x88719,
    provider: _0x5fe2a5,
    kind: 'text',
    adapterType: 'localRuntime',
    executionId: _0x470b52,
    displayName: _0x3e4fd3,
    icon: _0x59b291,
    description: _0x559b47,
    inputSlots: CLI_TEXT_INPUT_SLOTS,
    uiSchema: CLI_TEXT_UI_SCHEMA,
    async: ![],
    cancellable: ![],
    outputType: 'text',
    extensions: Object['freeze']({
      textMenu: Object['freeze']({
        group: _0x5fe2a5,
        order: _0x1995f5,
        title: _0x578a4f,
        subtitle: _0x559b47,
        icon: 'oa',
      }),
    }),
  });
}
function createCliTextExecutionManifest({ id: _0x16510a, provider: _0x5248e0, cliProvider: _0x282eda }) {
  return Object['freeze']({
    schemaVersion: '1.0',
    id: _0x16510a,
    provider: _0x5248e0,
    kind: 'text',
    adapterType: 'localRuntime',
    runtime: 'cliText',
    result: CLI_TEXT_RESULT,
    extensions: Object['freeze']({ cliProvider: _0x282eda }),
  });
}
export const CODEX_CLI_TEXT_MODEL_ID = 'codex-cli/default';
export const CODEX_CLI_TEXT_EXECUTION_ID = 'codex-cli.local-runtime.text.default.v1';
export const cliTextModelManifests = Object['freeze']([
  createCliTextModelManifest({
    modelId: CODEX_CLI_TEXT_MODEL_ID,
    executionId: CODEX_CLI_TEXT_EXECUTION_ID,
    provider: 'codex-cli',
    displayName: 'OpenAI CLI',
    icon: 'OA',
    title: 'OpenAI CLI',
    subtitle: '使用本机 ChatGPT/Codex 账号额度生成文本',
    order: 0xa,
  }),
]);
export const cliTextExecutionManifests = Object['freeze']([
  createCliTextExecutionManifest({
    id: CODEX_CLI_TEXT_EXECUTION_ID,
    provider: 'codex-cli',
    cliProvider: 'codex',
  }),
]);
