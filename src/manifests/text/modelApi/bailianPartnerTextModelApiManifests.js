import { BAILIAN_TEXT_OUTPUT_TOKENS_FIELD } from './bailianTextModelApiManifests.js';
const MODELS = [
    { model: 'deepseek-v4-pro', title: 'DeepSeek V4 Pro' },
    { model: 'deepseek-v4-pro-0813', title: 'DeepSeek V4 Pro 0813', lowEffort: !![] },
    { model: 'deepseek-v4-flash', title: 'DeepSeek V4 Flash' },
    { model: 'deepseek-v4-flash-0731', title: 'DeepSeek V4 Flash 0731', lowEffort: !![] },
    { model: 'kimi-k3', title: 'Kimi K3', image: !![] },
  ],
  executionId = (value) => 'bailian.model-api.text.' + value + '.v1',
  responseMapping = { resultPaths: ['choices[].message.content'] };
export const bailianPartnerTextModelManifests = Object['freeze'](
  MODELS['map'](({ model: model, title: title, image: image, lowEffort: lowEffort }) => ({
    schemaVersion: '1.0',
    modelId: 'bailian/' + model,
    executionId: executionId(model),
    provider: 'bailian',
    kind: 'text',
    adapterType: 'modelApi',
    displayName: title,
    icon: image ? 'images/kimi-logo.png' : 'images/deepseek.svg',
    description: image ? '百炼官方 · 图文理解 · 仅思考模式' : '百炼官方 · 文本推理',
    inputSlots: {
      allowedKinds: image ? ['text', 'image'] : ['text'],
      minByKind: { text: 0 },
      maxByKind: { image: image ? 8 : 0, video: 0, audio: 0 },
    },
    uiSchema: {
      fields: [
        ...(!image
          ? [
              {
                id: 'reasoningEffort',
                type: 'segmented',
                placement: 'mode',
                variant: 'pillMenu',
                label: '思考深度',
                defaultValue: 'high',
                options: [
                  ...(lowEffort ? [{ value: 'low', label: '低' }] : []),
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
        title: title,
        subtitle: image ? '百炼官方 · 图文理解 · 仅思考模式' : '百炼官方 · 文本推理',
        icon: image ? 'moonshot' : 'deepseek',
      },
    },
    async: ![],
    cancellable: ![],
    outputType: 'text',
  })),
);
export const bailianPartnerTextExecutionManifests = Object['freeze'](
  MODELS['map'](({ model: model2, image: image2 }) => ({
    schemaVersion: '1.0',
    id: executionId(model2),
    provider: 'bailian',
    kind: 'text',
    adapterType: 'modelApi',
    endpoint: '/compatible-mode/v1/chat/completions',
    endpointMode: 'chat-completion',
    method: 'POST',
    model: model2,
    headers: { 'Content-Type': 'application/json' },
    bodyMapping: { modelField: 'model', messagesField: 'messages' },
    responseMapping: responseMapping,
    result: { textFields: responseMapping['resultPaths'] },
    extensions: {
      chatCompletionInputPolicy: image2 ? 'image-only' : 'text-only',
      strictUpload: !![],
      streaming: !![],
      structuredOutputMode: 'json_object',
      chatCompletionBodyMapping: [
        { path: 'enable_thinking', from: 'constant', value: !![] },
        ...(!image2
          ? [{ path: 'reasoning_effort', from: 'param', field: 'generationParams.reasoningEffort' }]
          : []),
      ],
    },
  })),
);
