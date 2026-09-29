import { BAILIAN_TEXT_OUTPUT_TOKENS_FIELD } from './bailianTextModelApiManifests.js';
const MODELS = [
    { model: 'deepseek-v4-pro', title: 'DeepSeek\x20V4\x20Pro' },
    { model: 'deepseek-v4-pro-0813', title: 'DeepSeek V4 Pro 0813', lowEffort: !![] },
    { model: 'deepseek-v4-flash', title: 'DeepSeek V4 Flash' },
    { model: 'deepseek-v4-flash-0731', title: 'DeepSeek V4 Flash 0731', lowEffort: !![] },
    { model: 'kimi-k3', title: 'Kimi\x20K3', image: !![] },
  ],
  executionId = (_0x358c3c) => 'bailian.model-api.text.' + _0x358c3c + '.v1',
  responseMapping = { resultPaths: ['choices[].message.content'] };
export const bailianPartnerTextModelManifests = Object['freeze'](
  MODELS['map'](({ model: _0x5124e0, title: _0x12e413, image: _0x43c558, lowEffort: _0x8a91d3 }) => ({
    schemaVersion: '1.0',
    modelId: 'bailian/' + _0x5124e0,
    executionId: executionId(_0x5124e0),
    provider: 'bailian',
    kind: 'text',
    adapterType: 'modelApi',
    displayName: _0x12e413,
    icon: _0x43c558 ? 'images/kimi-logo.png' : 'images/deepseek.svg',
    description: _0x43c558 ? '百炼官方 · 图文理解 · 仅思考模式' : '百炼官方 · 文本推理',
    inputSlots: {
      allowedKinds: _0x43c558 ? ['text', 'image'] : ['text'],
      minByKind: { text: 0x0 },
      maxByKind: { image: _0x43c558 ? 0x8 : 0x0, video: 0x0, audio: 0x0 },
    },
    uiSchema: {
      fields: [
        ...(!_0x43c558
          ? [
              {
                id: 'reasoningEffort',
                type: 'segmented',
                placement: 'mode',
                variant: 'pillMenu',
                label: '思考深度',
                defaultValue: 'high',
                options: [
                  ...(_0x8a91d3 ? [{ value: 'low', label: '低' }] : []),
                  { value: 'high', label: '高' },
                  { value: 'max', label: '最高' },
                ],
              },
            ]
          : []),
        BAILIAN_TEXT_OUTPUT_TOKENS_FIELD,
      ],
    },
    extensions: {
      textMenu: {
        group: 'bailian',
        title: _0x12e413,
        subtitle: _0x43c558 ? '百炼官方 · 图文理解 · 仅思考模式' : '百炼官方 · 文本推理',
        icon: _0x43c558 ? 'moonshot' : 'deepseek',
      },
    },
    async: ![],
    cancellable: ![],
    outputType: 'text',
  })),
);
export const bailianPartnerTextExecutionManifests = Object['freeze'](
  MODELS['map'](({ model: _0x4105c2, image: _0x44f77b }) => ({
    schemaVersion: '1.0',
    id: executionId(_0x4105c2),
    provider: 'bailian',
    kind: 'text',
    adapterType: 'modelApi',
    endpoint: '/compatible-mode/v1/chat/completions',
    endpointMode: 'chat-completion',
    method: 'POST',
    model: _0x4105c2,
    headers: { 'Content-Type': 'application/json' },
    bodyMapping: { modelField: 'model', messagesField: 'messages' },
    responseMapping: responseMapping,
    result: { textFields: responseMapping['resultPaths'] },
    extensions: {
      chatCompletionInputPolicy: _0x44f77b ? 'image-only' : 'text-only',
      strictUpload: !![],
      streaming: !![],
      structuredOutputMode: 'json_object',
      chatCompletionBodyMapping: [
        { path: 'enable_thinking', from: 'constant', value: !![] },
        ...(!_0x44f77b
          ? [{ path: 'reasoning_effort', from: 'param', field: 'generationParams.reasoningEffort' }]
          : []),
      ],
    },
  })),
);
