import { buildResponsesStructuredOutput } from './textStructuredOutput.js';
export function selectTextMediaExecution(manifest, payload, ctx) {
  const videoChatCompletion = manifest['extensions']?.['videoChatCompletion'];
  if (!videoChatCompletion) return manifest;
  const resolvedInputs = ctx['resolveChatCompletionInputUrls']({
    providerId: manifest['provider'],
    mediaPolicy: manifest['extensions']['chatCompletionInputPolicy'],
    inputUrls: payload['inputUrls'],
    inputImageUrls: payload['inputImageUrls'],
    inputVideoUrls: payload['inputVideoUrls'],
    inputAudioUrls: payload['inputAudioUrls'],
  });
  if (!resolvedInputs['inputVideoUrls']?.['length']) return manifest;
  if (payload['webSearch'] === true || (payload['imageSearch'] && payload['imageSearch'] !== 'off'))
    throw new Error('视频理解暂不能同时使用联网或搜图，请关闭联网和搜图后重试');
  const manifestMaxTokens = Number(manifest['extensions']['maxOutputTokens']);
  if (Number(payload['maxOutputTokens']) > manifestMaxTokens)
    throw new Error('输出上限不能超过 ' + manifestMaxTokens + ' tokens');
  return {
    ...manifest,
    endpoint: videoChatCompletion['endpoint'],
    endpointMode: 'chat-completion',
    responseMapping: videoChatCompletion['responseMapping'],
    extensions: {
      ...manifest['extensions'],
      structuredOutputMode: videoChatCompletion['structuredOutputMode'],
    },
  };
}
export async function buildTextResponsesBody({
  executionManifest: executionManifest,
  payload: payload,
  finalPrompt: finalPrompt,
  apiKey: apiKey,
  provider: provider,
  modelToken: modelToken,
  cfg: cfg,
  ctx: ctx,
  maxOutputTokens: maxOutputTokens,
  thinkingType: thinkingType,
  thinkingControlMode: thinkingControlMode,
  forceCustomProviderFreeImageHost: forceCustomProviderFreeImageHost,
}) {
  const extensions = executionManifest['extensions'] || {},
    usesImageUrlFormat = extensions['responsesInputFormat'] === 'image-url',
    buildUserContent = usesImageUrlFormat
      ? ctx['buildChatCompletionUserContent']
      : ctx['buildVolcengineResponsesUserContent'];
  if (typeof buildUserContent !== 'function')
    throw new Error('responses text manifest requires user content resolver');
  const inputUrls =
      typeof ctx['resolveChatCompletionInputUrls'] === 'function'
        ? ctx['resolveChatCompletionInputUrls']({
            providerId: provider,
            mediaPolicy: extensions['chatCompletionInputPolicy'],
            inputUrls: payload['inputUrls'] || [],
            inputImageUrls: payload['inputImageUrls'] || [],
            inputVideoUrls: payload['inputVideoUrls'] || [],
            inputAudioUrls: payload['inputAudioUrls'] || [],
          })
        : payload['inputImageUrls'] || payload['inputUrls'] || [],
    userContent = await buildUserContent(finalPrompt, inputUrls, apiKey, provider, {
      mediaPolicy: extensions['chatCompletionInputPolicy'],
      inputImageUrls: payload['inputImageUrls'] || [],
      inputVideoUrls: payload['inputVideoUrls'] || [],
      inputAudioUrls: payload['inputAudioUrls'] || [],
      baseUrl: cfg['apiUrl'],
      model: modelToken,
      videoFps: extensions['volcengineFiles']?.['videoFps'],
      forceCustomProviderFreeImageHost: forceCustomProviderFreeImageHost,
      strictUpload: usesImageUrlFormat,
    }),
    inputParts = usesImageUrlFormat
      ? (typeof userContent === 'string' ? [{ type: 'text', text: userContent }] : userContent)['map'](
          (part) => {
            if (part['type'] === 'text') return { type: 'input_text', text: part['text'] };
            if (part['type'] === 'image_url')
              return { type: 'input_image', image_url: part['image_url']['url'] };
            throw new Error('Unsupported Responses input part: ' + part['type']);
          },
        )
      : userContent,
    manifestMaxTokens = Number(extensions['maxOutputTokens']);
  if (maxOutputTokens && Number['isFinite'](manifestMaxTokens) && maxOutputTokens > manifestMaxTokens)
    throw new Error('输出上限不能超过 ' + manifestMaxTokens + ' tokens');
  const tools =
      payload['webSearch'] === true
        ? (extensions['webSearchTools'] || [{ type: 'web_search' }])['map']((tool) => ({ ...tool }))
        : [],
    imageSearchMode = payload['imageSearch'] || 'off',
    imageSearchTool = extensions['imageSearchTools']?.[imageSearchMode];
  if (extensions['imageSearchTools'] && imageSearchMode !== 'off') {
    if (!imageSearchTool) throw new Error('不支持的搜图模式');
    if (imageSearchTool['requiresImage'] && !inputParts['some']((part) => part['type'] === 'input_image'))
      throw new Error('以图搜图需要连接或引用至少一张图片');
    tools['push']({ type: imageSearchTool['type'] });
  }
  const instructions = [payload['systemPrompt'], imageSearchTool && extensions['imageSearchInstructions']]
    ['filter'](Boolean)
    ['join']('\n\n');
  return {
    apiKey: apiKey,
    model: modelToken,
    stream: false,
    ...(instructions ? { instructions: instructions } : {}),
    input: [{ role: 'user', content: inputParts }],
    ...(tools['length'] ? { tools: tools } : {}),
    ...(maxOutputTokens ? { max_output_tokens: maxOutputTokens } : {}),
    ...(thinkingType && thinkingControlMode === 'thinking' ? { thinking: { type: thinkingType } } : {}),
    ...buildResponsesStructuredOutput(payload['structuredOutput']),
  };
}
