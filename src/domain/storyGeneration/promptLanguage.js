import { getVideoReplicationAudioLanguage } from './videoReplicationLanguage.js';
export const STORY_PROMPT_LANGUAGES = Object['freeze']([
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: '英文' },
  { value: 'ja-JP', label: '日文' },
  { value: 'ko-KR', label: '韩文' },
  { value: 'fr-FR', label: '法文' },
  { value: 'de-DE', label: '德文' },
  { value: 'es-ES', label: '西班牙文' },
  { value: 'pt-PT', label: '葡萄牙文' },
  { value: 'ru-RU', label: '俄文' },
  { value: 'it-IT', label: '意大利文' },
  { value: 'ar-SA', label: '阿拉伯文' },
]);
export function normalizeStoryPromptLanguage(_0x3eb4d4) {
  return STORY_PROMPT_LANGUAGES['some']((_0x5102a6) => _0x5102a6['value'] === _0x3eb4d4) ? _0x3eb4d4 : '';
}
export function prependStoryDialogueLanguageConstraint(
  _0x1a4d5d,
  { clip: clip = {}, episode: episode = {}, project: project = {} } = {},
) {
  const _0x4bf48d = String(_0x1a4d5d || '');
  if (clip['requiredDialogueLanguage']) {
    const _0x4cb34a =
      STORY_PROMPT_LANGUAGES['find'](
        (_0x2640c2) => _0x2640c2['value'] === clip['requiredDialogueLanguage'],
      )?.['label'] || '原语言';
    throw new Error(
      '对白语言已改为' +
        _0x4cb34a +
        '，当前片段提示词尚未更新。请先通过\x20AI\x20调整转换语言，或重新生成分段提示词。',
    );
  }
  const _0x33b31a =
      normalizeStoryPromptLanguage(clip['promptLanguage']) ||
      getVideoReplicationAudioLanguage(episode, project)?.['targetLocale'],
    _0x196714 = STORY_PROMPT_LANGUAGES['find']((_0x1a3a6e) => _0x1a3a6e['value'] === _0x33b31a);
  if (!_0x196714 || _0x196714['value'] === 'zh-CN' || !_0x4bf48d['trim']()) return _0x4bf48d;
  const _0x33e490 = '全片人物对白仅使用' + _0x196714['label']['replace'](/文$/u, '语') + '。';
  return _0x4bf48d['startsWith'](_0x33e490) ? _0x4bf48d : _0x33e490 + '\x0a' + _0x4bf48d;
}
export function buildStoryPromptLanguageRule(_0xb5d57, { translateOnly: translateOnly = ![] } = {}) {
  const _0x16af23 = STORY_PROMPT_LANGUAGES['find']((_0x1e8695) => _0x1e8695['value'] === _0xb5d57);
  if (!_0x16af23) return '';
  return (
    '语言转换：整份 candidateText 的场景、动作、镜头描述、声音设定、语气、对白、旁白、音效及自然语言标题统一使用' +
    _0x16af23['label'] +
    '（' +
    _0x16af23['value'] +
    '）。此规则覆盖所有通用中文输出、原对白语言和模式示例语言要求。人物引用与\x20locked.assetTokens\x20逐字保留，普通说话人姓名保持对应，不翻译素材标签；JSON\x20字段名和模型结构标签保持有效，若有对白语种标签必须匹配目标语言。只翻译已有内容，不添加剧情、对白、声音或口型约束，不改变说话人或信息量。' +
    (translateOnly
      ? '本次只做翻译，不润色、不重组镜头、不改时长；所有时间标记与镜头顺序原样保留。'
      : '同时执行用户指定的提示词模式和调整要求。') +
    '不得让角色朗读语气说明。'
  );
}
