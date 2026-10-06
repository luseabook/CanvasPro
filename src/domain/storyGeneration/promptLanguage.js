import { getVideoReplicationAudioLanguage } from './videoReplicationLanguage.js';
export const STORY_PROMPT_LANGUAGES = Object.freeze([
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
export function normalizeStoryPromptLanguage(value) {
  return STORY_PROMPT_LANGUAGES.some((el) => el.value === value) ? value : '';
}
export function prependStoryDialogueLanguageConstraint(
  item,
  { clip: clip = {}, episode: episode = {}, project: project = {} } = {},
) {
  const enabled = String(item || '');
  if (clip.requiredDialogueLanguage) {
    const key =
      STORY_PROMPT_LANGUAGES.find((el2) => el2.value === clip.requiredDialogueLanguage)?.label ||
      '原语言';
    throw new Error(
      '对白语言已改为' +
        key +
        '，当前片段提示词尚未更新。请先通过 AI 调整转换语言，或重新生成分段提示词。',
    );
  }
  const storyPromptLanguage =
      normalizeStoryPromptLanguage(clip.promptLanguage) ||
      getVideoReplicationAudioLanguage(episode, project)?.targetLocale,
    el3 = STORY_PROMPT_LANGUAGES.find((el4) => el4.value === storyPromptLanguage);
  if (!el3 || el3.value === 'zh-CN' || !enabled.trim()) return enabled;
  const index = '全片人物对白仅使用' + el3.label.replace(/文$/u, '语') + '。';
  return enabled.startsWith(index) ? enabled : index + '\n' + enabled;
}
export function buildStoryPromptLanguageRule(result, { translateOnly: translateOnly = false } = {}) {
  const el5 = STORY_PROMPT_LANGUAGES.find((el6) => el6.value === result);
  if (!el5) return '';
  return (
    '语言转换：整份 candidateText 的场景、动作、镜头描述、声音设定、语气、对白、旁白、音效及自然语言标题统一使用' +
    el5.label +
    '（' +
    el5.value +
    '）。此规则覆盖所有通用中文输出、原对白语言和模式示例语言要求。人物引用与 locked.assetTokens 逐字保留，普通说话人姓名保持对应，不翻译素材标签；JSON 字段名和模型结构标签保持有效，若有对白语种标签必须匹配目标语言。只翻译已有内容，不添加剧情、对白、声音或口型约束，不改变说话人或信息量。' +
    (translateOnly
      ? '本次只做翻译，不润色、不重组镜头、不改时长；所有时间标记与镜头顺序原样保留。'
      : '同时执行用户指定的提示词模式和调整要求。') +
    '不得让角色朗读语气说明。'
  );
}
