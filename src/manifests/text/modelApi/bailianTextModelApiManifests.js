const MODELS = Object['freeze']([
    'qwen3.8-max',
    'qwen3.8-max-0902',
    'qwen3.8-flash',
    'qwen3.8-2.4t-a95b',
    'qwen3.8-27b',
    'qwen3.7-max',
    'qwen3.7-max-preview',
    'qwen3.7-max-2026-06-08',
    'qwen3.7-max-2026-05-20',
    'qwen3.7-max-2026-05-17',
    'qwen3.7-plus',
    'qwen3.7-plus-2026-05-26',
    'qwen3.7-flash',
    'qwen3.7-flash-2026-07-15',
  ]),
  executionId = (value) => 'bailian.model-api.text.' + value['replaceAll']('.', '-') + '.v1',
  responseMapping = Object['freeze']({ resultPaths: Object['freeze'](['choices[].message.content']) });
export const BAILIAN_TEXT_OUTPUT_TOKENS_FIELD = Object['freeze']({
  id: 'maxOutputTokens',
  type: 'segmented',
  placement: 'mode',
  variant: 'pillMenu',
  label: '输出上限',
  defaultValue: 8192,
  options: [4096, 8192, 16384, 32768]['map']((value2) => ({
    value: value2,
    label: value2 / 1024 + 'K',
  })),
});
export const bailianTextModelManifests = Object['freeze'](
  MODELS['map']((displayName) =>
    Object['freeze']({
      schemaVersion: '1.0',
      modelId: 'bailian/' + displayName,
      executionId: executionId(displayName),
      provider: 'bailian',
      kind: 'text',
      adapterType: 'modelApi',
      displayName: displayName,
      icon: 'images/qwen.svg',
      description: '百炼官方 · 文本、图片与视频画面理解',
      inputSlots: Object['freeze']({
        allowedKinds: Object['freeze'](['text', 'image', 'video']),
        minByKind: Object['freeze']({ text: 0, image: 0 }),
        maxByKind: Object['freeze']({ image: 8, video: 1, audio: 0 }),
      }),
      uiSchema: Object['freeze']({
        fields: Object['freeze']([
          ...(displayName['startsWith']('qwen3.8')
            ? [
                {
                  id: 'reasoningEffort',
                  type: 'segmented',
                  placement: 'mode',
                  variant: 'pillMenu',
                  label: '思考深度',
                  defaultValue: 'xhigh',
                  options: [
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'xhigh', label: '高' },
                  ],
                },
              ]
            : [
                {
                  id: 'enableThinking',
                  type: 'toggle',
                  placement: 'advanced',
                  label: '深度思考',
                  defaultValue: ![],
                },
              ]),
          { id: 'webSearch', type: 'toggle', placement: 'advanced', label: '联网搜索', defaultValue: ![] },
          BAILIAN_TEXT_OUTPUT_TOKENS_FIELD,
        ]),
      }),
      extensions: Object['freeze']({
        textMenu: Object['freeze']({
          group: 'bailian',
          title: displayName,
          subtitle: '百炼官方 · 图文 / 视频理解',
          icon: 'qwen',
        }),
      }),
      async: ![],
      cancellable: ![],
      outputType: 'text',
    }),
  ),
);
export const bailianTextExecutionManifests = Object['freeze'](
  MODELS['map']((model) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: executionId(model),
      provider: 'bailian',
      kind: 'text',
      adapterType: 'modelApi',
      endpoint: '/compatible-mode/v1/chat/completions',
      endpointMode: 'chat-completion',
      method: 'POST',
      model: model,
      headers: Object['freeze']({ 'Content-Type': 'application/json' }),
      bodyMapping: Object['freeze']({ modelField: 'model', messagesField: 'messages' }),
      responseMapping: responseMapping,
      result: Object['freeze']({ textFields: responseMapping['resultPaths'] }),
      extensions: Object['freeze']({
        chatCompletionInputPolicy: 'image-video',
        strictUpload: !![],
        structuredOutputMode: 'json_object',
        streaming: !![],
        chatCompletionBodyMapping: Object['freeze']([
          { path: 'enable_search', from: 'param', field: 'generationParams.webSearch' },
          ...(model['startsWith']('qwen3.8')
            ? [{ path: 'reasoning_effort', from: 'param', field: 'generationParams.reasoningEffort' }]
            : [{ path: 'enable_thinking', from: 'param', field: 'generationParams.enableThinking' }]),
        ]),
      }),
    }),
  ),
);
