import { buildResponsesStructuredOutput } from './textStructuredOutput.js';
export function selectTextMediaExecution(_0x4e2366, _0xd12894, _0x3bdfc7) {
  const _0x1f837c = _0x4e2366['extensions']?.['videoChatCompletion'];
  if (!_0x1f837c) return _0x4e2366;
  const _0x1d1ad0 = _0x3bdfc7['resolveChatCompletionInputUrls']({
    providerId: _0x4e2366['provider'],
    mediaPolicy: _0x4e2366['extensions']['chatCompletionInputPolicy'],
    inputUrls: _0xd12894['inputUrls'],
    inputImageUrls: _0xd12894['inputImageUrls'],
    inputVideoUrls: _0xd12894['inputVideoUrls'],
    inputAudioUrls: _0xd12894['inputAudioUrls'],
  });
  if (!_0x1d1ad0['inputVideoUrls']?.['length']) return _0x4e2366;
  if (_0xd12894['webSearch'] === !![] || (_0xd12894['imageSearch'] && _0xd12894['imageSearch'] !== 'off'))
    throw new Error('视频理解暂不能同时使用联网或搜图，请关闭联网和搜图后重试');
  const _0x319dba = Number(_0x4e2366['extensions']['maxOutputTokens']);
  if (Number(_0xd12894['maxOutputTokens']) > _0x319dba)
    throw new Error('输出上限不能超过 ' + _0x319dba + '\x20tokens');
  return {
    ..._0x4e2366,
    endpoint: _0x1f837c['endpoint'],
    endpointMode: 'chat-completion',
    responseMapping: _0x1f837c['responseMapping'],
    extensions: { ..._0x4e2366['extensions'], structuredOutputMode: _0x1f837c['structuredOutputMode'] },
  };
}
export async function buildTextResponsesBody({
  executionManifest: _0xd1246,
  payload: _0x4f7666,
  finalPrompt: _0x17acf6,
  apiKey: _0x44c413,
  provider: _0x39363f,
  modelToken: _0x5140f4,
  cfg: _0x507260,
  ctx: _0x398686,
  maxOutputTokens: _0x50bf8c,
  thinkingType: _0x3ff989,
  thinkingControlMode: _0x1f3d9c,
  forceCustomProviderFreeImageHost: _0x5ac9fc,
}) {
  const _0x26c61b = _0xd1246['extensions'] || {},
    _0x45d04d = _0x26c61b['responsesInputFormat'] === 'image-url',
    _0x2c7694 = _0x45d04d
      ? _0x398686['buildChatCompletionUserContent']
      : _0x398686['buildVolcengineResponsesUserContent'];
  if (typeof _0x2c7694 !== 'function')
    throw new Error('responses\x20text\x20manifest\x20requires\x20user\x20content\x20resolver');
  const _0x78eacc =
      typeof _0x398686['resolveChatCompletionInputUrls'] === 'function'
        ? _0x398686['resolveChatCompletionInputUrls']({
            providerId: _0x39363f,
            mediaPolicy: _0x26c61b['chatCompletionInputPolicy'],
            inputUrls: _0x4f7666['inputUrls'] || [],
            inputImageUrls: _0x4f7666['inputImageUrls'] || [],
            inputVideoUrls: _0x4f7666['inputVideoUrls'] || [],
            inputAudioUrls: _0x4f7666['inputAudioUrls'] || [],
          })
        : _0x4f7666['inputImageUrls'] || _0x4f7666['inputUrls'] || [],
    _0x51002a = await _0x2c7694(_0x17acf6, _0x78eacc, _0x44c413, _0x39363f, {
      mediaPolicy: _0x26c61b['chatCompletionInputPolicy'],
      inputImageUrls: _0x4f7666['inputImageUrls'] || [],
      inputVideoUrls: _0x4f7666['inputVideoUrls'] || [],
      inputAudioUrls: _0x4f7666['inputAudioUrls'] || [],
      baseUrl: _0x507260['apiUrl'],
      model: _0x5140f4,
      videoFps: _0x26c61b['volcengineFiles']?.['videoFps'],
      forceCustomProviderFreeImageHost: _0x5ac9fc,
      strictUpload: _0x45d04d,
    }),
    _0x591e86 = _0x45d04d
      ? (typeof _0x51002a === 'string' ? [{ type: 'text', text: _0x51002a }] : _0x51002a)['map'](
          (_0x2c4e78) => {
            if (_0x2c4e78['type'] === 'text') return { type: 'input_text', text: _0x2c4e78['text'] };
            if (_0x2c4e78['type'] === 'image_url')
              return { type: 'input_image', image_url: _0x2c4e78['image_url']['url'] };
            throw new Error('Unsupported Responses input part: ' + _0x2c4e78['type']);
          },
        )
      : _0x51002a,
    _0x314525 = Number(_0x26c61b['maxOutputTokens']);
  if (_0x50bf8c && Number['isFinite'](_0x314525) && _0x50bf8c > _0x314525)
    throw new Error('输出上限不能超过\x20' + _0x314525 + ' tokens');
  const _0x380d85 =
      _0x4f7666['webSearch'] === !![]
        ? (_0x26c61b['webSearchTools'] || [{ type: 'web_search' }])['map']((_0x50543a) => ({ ..._0x50543a }))
        : [],
    _0x4b5775 = _0x4f7666['imageSearch'] || 'off',
    _0x371a81 = _0x26c61b['imageSearchTools']?.[_0x4b5775];
  if (_0x26c61b['imageSearchTools'] && _0x4b5775 !== 'off') {
    if (!_0x371a81) throw new Error('不支持的搜图模式');
    if (_0x371a81['requiresImage'] && !_0x591e86['some']((_0x16ac0f) => _0x16ac0f['type'] === 'input_image'))
      throw new Error('以图搜图需要连接或引用至少一张图片');
    _0x380d85['push']({ type: _0x371a81['type'] });
  }
  const _0x2629ec = [_0x4f7666['systemPrompt'], _0x371a81 && _0x26c61b['imageSearchInstructions']]
    ['filter'](Boolean)
    ['join']('\x0a\x0a');
  return {
    apiKey: _0x44c413,
    model: _0x5140f4,
    stream: ![],
    ...(_0x2629ec ? { instructions: _0x2629ec } : {}),
    input: [{ role: 'user', content: _0x591e86 }],
    ...(_0x380d85['length'] ? { tools: _0x380d85 } : {}),
    ...(_0x50bf8c ? { max_output_tokens: _0x50bf8c } : {}),
    ...(_0x3ff989 && _0x1f3d9c === 'thinking' ? { thinking: { type: _0x3ff989 } } : {}),
    ...buildResponsesStructuredOutput(_0x4f7666['structuredOutput']),
  };
}
