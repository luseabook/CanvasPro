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
  executionId = (_0xa8b498) => 'bailian.model-api.text.' + _0xa8b498['replaceAll']('.', '-') + '.v1',
  responseMapping = Object['freeze']({ resultPaths: Object['freeze'](['choices[].message.content']) });
export const BAILIAN_TEXT_OUTPUT_TOKENS_FIELD = Object['freeze']({
  id: 'maxOutputTokens',
  type: 'segmented',
  placement: 'mode',
  variant: 'pillMenu',
  label: '输出上限',
  defaultValue: 0x2000,
  options: [0x1000, 0x2000, 0x4000, 0x8000]['map']((_0x79e744) => ({
    value: _0x79e744,
    label: _0x79e744 / 0x400 + 'K',
  })),
});
export const bailianTextModelManifests = Object['freeze'](
  MODELS['map']((_0x347b0c) =>
    Object['freeze']({
      schemaVersion: '1.0',
      modelId: 'bailian/' + _0x347b0c,
      executionId: executionId(_0x347b0c),
      provider: 'bailian',
      kind: 'text',
      adapterType: 'modelApi',
      displayName: _0x347b0c,
      icon: 'images/qwen.svg',
      description: '百炼官方 · 文本、图片与视频画面理解',
      inputSlots: Object['freeze']({
        allowedKinds: Object['freeze'](['text', 'image', 'video']),
        minByKind: Object['freeze']({ text: 0x0, image: 0x0 }),
        maxByKind: Object['freeze']({ image: 0x8, video: 0x1, audio: 0x0 }),
      }),
      uiSchema: Object['freeze']({
        fields: Object['freeze']([
          ...(_0x347b0c['startsWith']('qwen3.8')
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
          title: _0x347b0c,
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
  MODELS['map']((_0xaf1400) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: executionId(_0xaf1400),
      provider: 'bailian',
      kind: 'text',
      adapterType: 'modelApi',
      endpoint: '/compatible-mode/v1/chat/completions',
      endpointMode: 'chat-completion',
      method: 'POST',
      model: _0xaf1400,
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
          ...(_0xaf1400['startsWith']('qwen3.8')
            ? [{ path: 'reasoning_effort', from: 'param', field: 'generationParams.reasoningEffort' }]
            : [{ path: 'enable_thinking', from: 'param', field: 'generationParams.enableThinking' }]),
        ]),
      }),
    }),
  ),
);
