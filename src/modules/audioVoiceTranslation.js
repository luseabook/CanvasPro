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
function normalizeTranslationSegment(_0x5f893c = {}) {
  const _0x472dcf = String(_0x5f893c?.['id'] || '')['trim'](),
    _0x3e067c = String(_0x5f893c?.['sourceText'] || '')['trim']();
  if (!_0x472dcf || !_0x3e067c) return null;
  const _0x1404e4 = Math['max'](0x0, Math['round'](Number(_0x5f893c?.['startMs']) || 0x0)),
    _0x33e3a6 = Math['max'](_0x1404e4, Math['round'](Number(_0x5f893c?.['endMs']) || _0x1404e4)),
    _0x30de47 = Number(_0x5f893c?.['durationMs']);
  return {
    id: _0x472dcf,
    sourceText: _0x3e067c,
    durationMs: Number['isFinite'](_0x30de47)
      ? Math['max'](0x0, Math['round'](_0x30de47))
      : Math['max'](0x0, _0x33e3a6 - _0x1404e4),
  };
}
export function classifyAudioVoiceTranslationConfigFailure(_0x45f1ac = {}) {
  const _0x4a394a = String(_0x45f1ac?.['type'] || _0x45f1ac?.['code'] || '')
      ['trim']()
      ['toUpperCase'](),
    _0xef86ee = [
      typeof _0x45f1ac === 'string' ? _0x45f1ac : '',
      _0x45f1ac?.['message'],
      _0x45f1ac?.['error'],
      _0x45f1ac?.['detail'],
    ]
      ['filter'](Boolean)
      ['join']('\x20')
      ['trim']();
  if (
    /(?:api\s*key|apikey).*(?:未配置|没填写|未填写|missing|not\s+configured)|(?:missing|configure).*(?:api\s*key|apikey)/i[
      'test'
    ](_0xef86ee)
  )
    return 'missing';
  if (['AUTH_ERROR', 'FORBIDDEN', 'MODEL_UNAVAILABLE']['includes'](_0x4a394a)) return 'invalid';
  if (
    /invalid\s+(?:api\s*key|apikey)|(?:api\s*key|apikey).*(?:无效|失效|过期)|unauthori[sz]ed|forbidden|permission\s+denied|no\s+permission|has\s+not\s+activated\s+the\s+model|model.*(?:not\s+activated|unavailable|no\s+access)|(?:模型|服务).*(?:未开通|不可用|无权限)|无权限|未授权|鉴权失败/i[
      'test'
    ](_0xef86ee)
  )
    return 'invalid';
  return '';
}
export function getAudioVoiceTranslationLanguage(_0x4ebc10 = '') {
  const _0x1102cd = String(_0x4ebc10 || '')['trim']();
  return AUDIO_VOICE_TRANSLATION_LANGUAGES['find']((_0x5bbb89) => _0x5bbb89['id'] === _0x1102cd) || null;
}
export function resolveAudioVoiceTranslationTargets(_0x2fe93a = [], _0x111a95 = []) {
  const _0x324005 = (Array['isArray'](_0x2fe93a) ? _0x2fe93a : [])['filter'](
      (_0x25e167) => _0x25e167?.['status'] !== 'removed',
    ),
    _0x4d050a = new Set(
      _0x111a95 instanceof Set ? [..._0x111a95] : Array['isArray'](_0x111a95) ? _0x111a95 : [],
    ),
    _0x1975d4 = _0x324005['filter']((_0x32fa87) => _0x4d050a['has'](_0x32fa87?.['id'])),
    _0x35d509 = _0x1975d4['length'] > 0x0 ? _0x1975d4 : _0x324005,
    _0x1518ac = _0x35d509['map'](normalizeTranslationSegment)['filter'](Boolean),
    _0x4ad602 = _0x324005['length'] > 0x0 && _0x35d509['length'] === _0x324005['length'];
  return { scope: _0x4ad602 ? 'all' : 'selected', targets: _0x1518ac };
}
export function buildAudioVoiceTranslationPrompt({ language: _0x299c6b, segments: segments = [] } = {}) {
  const _0x71a637 = getAudioVoiceTranslationLanguage(_0x299c6b?.['id'] || _0x299c6b);
  if (!_0x71a637) throw new Error('不支持的目标语言。');
  const _0x5ce094 = (Array['isArray'](segments) ? segments : [])
    ['map'](normalizeTranslationSegment)
    ['filter'](Boolean);
  if (!_0x5ce094['length']) throw new Error('没有可翻译的句子文本。');
  const _0x1d827f = {
    targetLanguage: { code: _0x71a637['id'], name: _0x71a637['name'] },
    segments: _0x5ce094,
  };
  return [
    'Translate the following voice-studio dialogue into the target language.',
    'Use\x20the\x20full\x20list\x20as\x20shared\x20context\x20so\x20names,\x20pronouns,\x20tone,\x20and\x20terminology\x20stay\x20consistent.',
    'Write natural spoken dialogue suitable for dubbing.',
    'Keep\x20each\x20translation\x20concise\x20enough\x20to\x20fit\x20its\x20durationMs\x20when\x20possible.',
    'Preserve every segment id exactly. Do not merge, split, omit, reorder, or add segments.',
    'Return only the required JSON object.',
    '',
    JSON['stringify'](_0x1d827f),
  ]['join']('\x0a');
}
export function createAudioVoiceTranslationStructuredOutput(_0x4edb61 = []) {
  const _0x3e960b = (Array['isArray'](_0x4edb61) ? _0x4edb61 : [])
    ['map']((_0x3ce04d) => String(_0x3ce04d?.['id'] || '')['trim']())
    ['filter'](Boolean);
  if (!_0x3e960b['length']) throw new Error('没有可用于结构化输出的句子 ID。');
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
          minItems: _0x3e960b['length'],
          maxItems: _0x3e960b['length'],
          items: {
            type: 'object',
            additionalProperties: ![],
            required: ['id', 'targetText'],
            properties: {
              id: { type: 'string', enum: _0x3e960b },
              targetText: { type: 'string', minLength: 0x1 },
            },
          },
        },
      },
    },
  };
}
export function parseAudioVoiceTranslationResult(_0x2cf5a7, _0x3321ec = []) {
  const _0x10c678 = (Array['isArray'](_0x3321ec) ? _0x3321ec : [])
      ['map'](normalizeTranslationSegment)
      ['filter'](Boolean),
    _0x380018 = _0x10c678['map']((_0x4f2ee6) => _0x4f2ee6['id']),
    _0x10cd1b = new Set(_0x380018);
  if (!_0x380018['length'] || _0x10cd1b['size'] !== _0x380018['length'])
    throw new Error('翻译请求中的句子 ID 无效或重复。');
  const _0x2b3350 =
      _0x2cf5a7 && typeof _0x2cf5a7 === 'object' && 'text' in _0x2cf5a7 ? _0x2cf5a7['text'] : _0x2cf5a7,
    _0x52c398 = parseStrictJson(_0x2b3350, '模型没有返回翻译结果。'),
    _0x560ab0 = Array['isArray'](_0x52c398?.['translations']) ? _0x52c398['translations'] : [];
  if (_0x560ab0['length'] !== _0x380018['length'])
    throw new Error(
      '翻译结果数量不一致：期望 ' + _0x380018['length'] + ' 句，实际 ' + _0x560ab0['length'] + ' 句。',
    );
  const _0x1df188 = new Map();
  _0x560ab0['forEach']((_0x5d614e) => {
    const _0xeec6c4 = String(_0x5d614e?.['id'] || '')['trim'](),
      _0x5af697 = String(_0x5d614e?.['targetText'] || '')['trim']();
    if (!_0x10cd1b['has'](_0xeec6c4))
      throw new Error('翻译结果包含未知句子 ID：' + (_0xeec6c4 || '空 ID') + '。');
    if (_0x1df188['has'](_0xeec6c4)) throw new Error('翻译结果包含重复句子 ID：' + _0xeec6c4 + '。');
    if (!_0x5af697) throw new Error('句子\x20' + _0xeec6c4 + ' 的翻译结果为空。');
    _0x1df188['set'](_0xeec6c4, _0x5af697);
  });
  const _0x95db40 = _0x380018['find']((_0x3b2ddd) => !_0x1df188['has'](_0x3b2ddd));
  if (_0x95db40) throw new Error('翻译结果缺少句子 ID：' + _0x95db40 + '。');
  return _0x380018['map']((_0x4ff006) => ({ id: _0x4ff006, targetText: _0x1df188['get'](_0x4ff006) }));
}
