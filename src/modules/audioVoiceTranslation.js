import { parseStrictJson } from '../../api/utils/strictJson.js';
export const AUDIO_VOICE_TRANSLATION_LANGUAGES = Object['freeze']([
  Object['freeze']({ id: 'zh-CN', name: 'Simplified Chinese', labelKey: 'zhCN' }),
  Object['freeze']({ id: 'en', name: 'English', labelKey: 'en' }),
  Object['freeze']({ id: 'ja', name: 'Japanese', labelKey: 'ja' }),
  Object['freeze']({ id: 'ko', name: 'Korean', labelKey: 'ko' }),
  Object['freeze']({ id: 'es', name: 'Spanish', labelKey: 'es' }),
  Object['freeze']({ id: 'fr', name: 'French', labelKey: 'fr' }),
  Object['freeze']({ id: 'de', name: 'German', labelKey: 'de' }),
  Object['freeze']({ id: 'pt', name: 'Portuguese', labelKey: 'pt' }),
]);
function normalizeTranslationSegment(options = {}) {
  const id = String(options?.['id'] || '')['trim'](),
    sourceText = String(options?.['sourceText'] || '')['trim']();
  if (!id || !sourceText) return null;
  const value = Math['max'](0x0, Math['round'](Number(options?.['startMs']) || 0x0)),
    item = Math['max'](value, Math['round'](Number(options?.['endMs']) || value)),
    key = Number(options?.['durationMs']);
  return {
    id: id,
    sourceText: sourceText,
    durationMs: Number['isFinite'](key)
      ? Math['max'](0x0, Math['round'](key))
      : Math['max'](0x0, item - value),
  };
}
export function classifyAudioVoiceTranslationConfigFailure(error = {}) {
  const index = String(error?.['type'] || error?.['code'] || '')
      ['trim']()
      ['toUpperCase'](),
    result = [typeof error === 'string' ? error : '', error?.['message'], error?.['error'], error?.['detail']]
      ['filter'](Boolean)
      ['join']('\x20')
      ['trim']();
  if (
    /(?:api\s*key|apikey).*(?:未配置|没填写|未填写|missing|not\s+configured)|(?:missing|configure).*(?:api\s*key|apikey)/i[
      'test'
    ](result)
  )
    return 'missing';
  if (['AUTH_ERROR', 'FORBIDDEN', 'MODEL_UNAVAILABLE']['includes'](index)) return 'invalid';
  if (
    /invalid\s+(?:api\s*key|apikey)|(?:api\s*key|apikey).*(?:无效|失效|过期)|unauthori[sz]ed|forbidden|permission\s+denied|no\s+permission|has\s+not\s+activated\s+the\s+model|model.*(?:not\s+activated|unavailable|no\s+access)|(?:模型|服务).*(?:未开通|不可用|无权限)|无权限|未授权|鉴权失败/i[
      'test'
    ](result)
  )
    return 'invalid';
  return '';
}
export function getAudioVoiceTranslationLanguage(data = '') {
  const target = String(data || '')['trim']();
  return AUDIO_VOICE_TRANSLATION_LANGUAGES['find']((source) => source['id'] === target) || null;
}
export function resolveAudioVoiceTranslationTargets(list = [], args = []) {
  const list2 = (Array['isArray'](list) ? list : [])['filter'](
      (response) => response?.['status'] !== 'removed',
    ),
    map = new Set(args instanceof Set ? [...args] : Array['isArray'](args) ? args : []),
    list3 = list2['filter']((next) => map['has'](next?.['id'])),
    list4 = list3['length'] > 0x0 ? list3 : list2,
    targets = list4['map'](normalizeTranslationSegment)['filter'](Boolean),
    scope = list2['length'] > 0x0 && list4['length'] === list2['length'];
  return { scope: scope ? 'all' : 'selected', targets: targets };
}
export function buildAudioVoiceTranslationPrompt({ language: language, segments: segments = [] } = {}) {
  const code = getAudioVoiceTranslationLanguage(language?.['id'] || language);
  if (!code) throw new Error('不支持的目标语言。');
  const segments2 = (Array['isArray'](segments) ? segments : [])
    ['map'](normalizeTranslationSegment)
    ['filter'](Boolean);
  if (!segments2['length']) throw new Error('没有可翻译的句子文本。');
  const current = {
    targetLanguage: { code: code['id'], name: code['name'] },
    segments: segments2,
  };
  return [
    'Translate the following voice-studio dialogue into the target language.',
    'Use\x20the\x20full\x20list\x20as\x20shared\x20context\x20so\x20names,\x20pronouns,\x20tone,\x20and\x20terminology\x20stay\x20consistent.',
    'Write natural spoken dialogue suitable for dubbing.',
    'Keep\x20each\x20translation\x20concise\x20enough\x20to\x20fit\x20its\x20durationMs\x20when\x20possible.',
    'Preserve every segment id exactly. Do not merge, split, omit, reorder, or add segments.',
    'Return only the required JSON object.',
    '',
    JSON['stringify'](current),
  ]['join']('\x0a');
}
export function createAudioVoiceTranslationStructuredOutput(list5 = []) {
  const minItems = (Array['isArray'](list5) ? list5 : [])
    ['map']((entry) => String(entry?.['id'] || '')['trim']())
    ['filter'](Boolean);
  if (!minItems['length']) throw new Error('没有可用于结构化输出的句子 ID。');
  return {
    name: 'audio_voice_translation',
    strict: !![],
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: ![],
      required: ['translations'],
      properties: {
        translations: {
          type: 'array',
          minItems: minItems['length'],
          maxItems: minItems['length'],
          items: {
            type: 'object',
            additionalProperties: ![],
            required: ['id', 'targetText'],
            properties: {
              id: { type: 'string', enum: minItems },
              targetText: { type: 'string', minLength: 0x1 },
            },
          },
        },
      },
    },
  };
}
export function parseAudioVoiceTranslationResult(response2, record = []) {
  const list6 = (Array['isArray'](record) ? record : [])
      ['map'](normalizeTranslationSegment)
      ['filter'](Boolean),
    list7 = list6['map']((payload) => payload['id']),
    map2 = new Set(list7);
  if (!list7['length'] || map2['size'] !== list7['length'])
    throw new Error('翻译请求中的句子 ID 无效或重复。');
  const handle =
      response2 && typeof response2 === 'object' && 'text' in response2 ? response2['text'] : response2,
    strictJson = parseStrictJson(handle, '模型没有返回翻译结果。'),
    list8 = Array['isArray'](strictJson?.['translations']) ? strictJson['translations'] : [];
  if (list8['length'] !== list7['length'])
    throw new Error('翻译结果数量不一致：期望 ' + list7['length'] + ' 句，实际 ' + list8['length'] + ' 句。');
  const targetText = new Map();
  list8['forEach']((state) => {
    const config = String(state?.['id'] || '')['trim'](),
      enabled = String(state?.['targetText'] || '')['trim']();
    if (!map2['has'](config)) throw new Error('翻译结果包含未知句子 ID：' + (config || '空 ID') + '。');
    if (targetText['has'](config)) throw new Error('翻译结果包含重复句子 ID：' + config + '。');
    if (!enabled) throw new Error('句子\x20' + config + ' 的翻译结果为空。');
    targetText['set'](config, enabled);
  });
  const input = list7['find']((output) => !targetText['has'](output));
  if (input) throw new Error('翻译结果缺少句子 ID：' + input + '。');
  return list7['map']((id2) => ({ id: id2, targetText: targetText['get'](id2) }));
}
