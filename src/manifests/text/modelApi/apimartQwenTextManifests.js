const QWEN_MODELS = Object['freeze']([
    ['qwen3.8-max', 'Qwen 3.8 Max', !![]],
    ['qwen3.8-max-0902', 'Qwen 3.8 Max 0902'],
    ['qwen3.8-flash', 'Qwen 3.8 Flash', ![], 'enable_thinking'],
    ['qwen3.8-27b', 'Qwen 3.8 27B'],
    ['qwen3.8-2.4t-a95b', 'Qwen 3.8 2.4T A95B'],
  ]),
  executionId = (_0x4d7ad3) => 'apimart.model-api.text.' + _0x4d7ad3['replaceAll']('.', '-') + '.v1',
  CHAT_RESPONSE_MAPPING = Object['freeze']({ resultPaths: Object['freeze'](['choices[].message.content']) }),
  CHAT_EXTENSIONS = Object['freeze']({
    chatCompletionInputPolicy: 'image-video',
    strictUpload: !![],
    structuredOutputMode: 'json_object',
  });
export const apimartQwenTextModelManifests = Object['freeze'](
  QWEN_MODELS['map'](([_0x5ab025, _0x391b1a, _0x5ef678]) =>
    Object['freeze']({
      schemaVersion: '1.0',
      modelId: 'apimart/' + _0x5ab025,
      executionId: executionId(_0x5ab025),
      provider: 'apimart',
      kind: 'text',
      adapterType: 'modelApi',
      displayName: _0x391b1a,
      icon: 'images/qwen.svg',
      description: _0x5ef678
        ? '支持图文理解、联网搜索和网页读取；推理始终开启'
        : 'APIMart chat completion model API',
      inputSlots: Object['freeze']({
        allowedKinds: Object['freeze'](['text', 'image', 'video']),
        minByKind: Object['freeze']({ text: 0x0, image: 0x0 }),
        maxByKind: Object['freeze']({ image: 0x8, video: 0x1, audio: 0x0 }),
      }),
      uiSchema: _0x5ef678
        ? Object['freeze']({
            fields: Object['freeze']([
              Object['freeze']({
                id: 'webSearch',
                type: 'segmented',
                placement: 'mode',
                variant: 'pillMenu',
                label: '联网',
                defaultValue: ![],
                menuDescription: '开启后允许模型搜索和读取网页，工具按实际调用次数额外计费。',
                options: Object['freeze']([
                  Object['freeze']({ value: ![], label: '关闭', selectedLabel: '联网：关' }),
                  Object['freeze']({
                    value: !![],
                    label: '搜索与读取网页',
                    selectedLabel: '联网：开',
                    subtitle: '工具按实际调用次数额外计费',
                  }),
                ]),
              }),
              Object['freeze']({
                id: 'imageSearch',
                type: 'segmented',
                placement: 'mode',
                variant: 'pillMenu',
                label: '搜图',
                defaultValue: 'off',
                menuDescription:
                  '搜索网上已有图片，工具按实际调用次数额外计费；以图搜图需要参考图，耗时较长。',
                options: Object['freeze']([
                  Object['freeze']({ value: 'off', label: '关闭', selectedLabel: '搜图：关' }),
                  Object['freeze']({ value: 'text', label: '文字搜图', selectedLabel: '文字搜图' }),
                  Object['freeze']({ value: 'image', label: '以图搜图', selectedLabel: '以图搜图' }),
                ]),
              }),
              Object['freeze']({
                id: 'maxOutputTokens',
                type: 'segmented',
                placement: 'mode',
                variant: 'pillMenu',
                label: '输出上限',
                defaultValue: 0x2000,
                menuDescription: '上限包含思考与正文；本模型的思考不可关闭。',
                options: Object['freeze'](
                  [0x1000, 0x2000, 0x4000, 0x8000, 0x10000, 0x20000]['map']((_0x304946) =>
                    Object['freeze']({
                      value: _0x304946,
                      label: _0x304946['toLocaleString']('en-US') + ' tokens',
                      selectedLabel: '上限：' + _0x304946 / 0x400 + 'K',
                    }),
                  ),
                ),
              }),
            ]),
          })
        : Object['freeze']({ fields: Object['freeze']([]) }),
      extensions: Object['freeze']({
        textMenu: Object['freeze']({
          group: 'apimart',
          title: _0x391b1a,
          subtitle: _0x5ef678 ? '图文理解 · 可选联网搜索 / 网页读取' : 'APIMart chat completion model API',
          icon: 'qwen',
        }),
      }),
      async: ![],
      cancellable: ![],
      outputType: 'text',
    }),
  ),
);
export const apimartQwenTextExecutionManifests = Object['freeze'](
  QWEN_MODELS['map'](([_0x1234fb, , _0x4b6984, _0x56006b]) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: executionId(_0x1234fb),
      provider: 'apimart',
      kind: 'text',
      adapterType: 'modelApi',
      endpoint: _0x4b6984 ? '/v1/responses' : '/v1/chat/completions',
      endpointMode: _0x4b6984 ? 'responses' : 'chat-completion',
      method: 'POST',
      model: _0x1234fb,
      headers: Object['freeze']({ 'Content-Type': 'application/json' }),
      bodyMapping: Object['freeze'](
        _0x4b6984
          ? { modelField: 'model', promptField: 'input' }
          : { modelField: 'model', messagesField: 'messages' },
      ),
      responseMapping: _0x4b6984
        ? Object['freeze']({
            resultPaths: Object['freeze'](['output_text', 'output[].content[].text']),
            includeSources: !![],
            imageResults: 'markdown',
          })
        : CHAT_RESPONSE_MAPPING,
      result: Object['freeze']({
        textFields: _0x4b6984
          ? Object['freeze'](['output_text', 'output[].content[].text'])
          : CHAT_RESPONSE_MAPPING['resultPaths'],
      }),
      extensions: _0x4b6984
        ? Object['freeze']({
            chatCompletionInputPolicy: 'image-video',
            strictUpload: !![],
            videoChatCompletion: Object['freeze']({
              endpoint: '/v1/chat/completions',
              structuredOutputMode: 'json_object',
              responseMapping: CHAT_RESPONSE_MAPPING,
            }),
            responsesInputFormat: 'image-url',
            maxOutputTokens: 0x20000,
            webSearchTools: Object['freeze']([
              Object['freeze']({ type: 'web_search' }),
              Object['freeze']({ type: 'web_extractor' }),
            ]),
            imageSearchTools: Object['freeze']({
              text: Object['freeze']({ type: 'web_search_image' }),
              image: Object['freeze']({ type: 'image_search', requiresImage: !![] }),
            }),
            imageSearchInstructions:
              'When presenting image search results, use only actual image URLs returned by the search tool. Format each image as [![short description](<image URL>)](<source page URL>), or ![short description](<image URL>) if no source page is provided. Do not invent URLs. If the tool returns no usable image URLs, explain that no images were found. Return at most 24 images.',
          })
        : _0x56006b
          ? Object['freeze']({ ...CHAT_EXTENSIONS, thinkingControlMode: _0x56006b })
          : CHAT_EXTENSIONS,
    }),
  ),
);
