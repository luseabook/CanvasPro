export const STORY_PROMPT_MODE_SEEDANCE_2_0 = 'seedance-2.0';
export const STORY_PROMPT_MODE_SEEDANCE_2_5 = 'seedance-2.5';
export const STORY_PROMPT_MODE_WAN_3_0 = 'wan-3.0';
export const STORY_PROMPT_MODE_MINIMAX_H3 = 'minimax-h3';
export const STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL = '画面内音效';
export const STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID = 'apimart/doubao-seedance-2.0';
export const STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID = 'apimart/doubao-seedance-2.5';
export const STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID = 'apimart/wan3.0';
export const STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID = 'apimart/minimax-h3';
export const STORY_PROMPT_MODE_OPTIONS = Object.freeze([
  Object.freeze({
    value: STORY_PROMPT_MODE_SEEDANCE_2_0,
    label: 'Seedance 2.0',
    enabled: true,
    rules: 'current',
  }),
  Object.freeze({
    value: STORY_PROMPT_MODE_SEEDANCE_2_5,
    label: 'Seedance 2.5',
    enabled: true,
    rules: 'continuous-timeline',
  }),
  Object.freeze({
    value: STORY_PROMPT_MODE_WAN_3_0,
    label: 'Wan 3.0',
    enabled: true,
    rules: 'wan-multimodal-timeline',
  }),
  Object.freeze({
    value: STORY_PROMPT_MODE_MINIMAX_H3,
    label: 'MiniMax H3',
    enabled: true,
    rules: 'minimax-h3-multimodal-story',
  }),
]);
function normalizeText(value) {
  return String(value || '').trim();
}
export function normalizeStoryPromptMode(item, { allowDeveloperModes: allowDeveloperModes = false } = {}) {
  const text = normalizeText(item).toLowerCase();
  return STORY_PROMPT_MODE_OPTIONS.some(
    (el) => el.value === text && (el.enabled || allowDeveloperModes),
  )
    ? text
    : STORY_PROMPT_MODE_SEEDANCE_2_0;
}
export const STORY_DEFAULT_PROMPT_MODE = STORY_PROMPT_MODE_SEEDANCE_2_0;
export function isStoryPromptModeSelectable(key, { allowDeveloperModes: allowDeveloperModes = false } = {}) {
  return STORY_PROMPT_MODE_OPTIONS.some(
    (el) => el.value === normalizeText(key).toLowerCase() && (allowDeveloperModes || el.enabled),
  );
}
export function getStoryPromptModeMaxClipSeconds(value) {
  return isStorySeedance25PromptMode(value) || isStoryWan30PromptMode(value) ? 30 : 15;
}
export function getStoryPromptModeLabel(key) {
  const text2 = normalizeText(key).toLowerCase();
  return (
    STORY_PROMPT_MODE_OPTIONS.find((el2) => el2.value === text2)?.label ||
    STORY_PROMPT_MODE_OPTIONS[0].label
  );
}
export function isStorySeedance25PromptMode(index) {
  return normalizeText(index).toLowerCase() === STORY_PROMPT_MODE_SEEDANCE_2_5;
}
export function isStoryWan30PromptMode(result) {
  return normalizeText(result).toLowerCase() === STORY_PROMPT_MODE_WAN_3_0;
}
export function isStoryMinimaxH3PromptMode(data) {
  return normalizeText(data).toLowerCase() === STORY_PROMPT_MODE_MINIMAX_H3;
}
export function isStoryContinuousTimelinePromptMode(options) {
  return isStorySeedance25PromptMode(options) || isStoryWan30PromptMode(options);
}
export function resolveStoryPromptModeDefaultVideoModelId(target) {
  const text3 = normalizeText(target).toLowerCase();
  return (
    {
      [STORY_PROMPT_MODE_SEEDANCE_2_0]: STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_SEEDANCE_2_5]: STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_WAN_3_0]: STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_MINIMAX_H3]: STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID,
    }[text3] || ''
  );
}
const STORY_MINIMAX_H3_REFERENCE_TAG_LABELS = Object.freeze({
    subject: 'Subject',
    picture: 'Picture',
    video: 'Video',
    audio: 'Audio',
  }),
  STORY_MINIMAX_H3_SECTION_LABELS = Object.freeze({
    subject_definitions: 'subject_definitions',
    summary: 'summary',
    retention_analysis: 'retention_analysis',
    detailed_description: 'detailed_description',
    integrated_multimodal_description: 'integrated_multimodal_description',
    overall_soundscape: 'overall_soundscape',
    non_diegetic_music: 'non_diegetic_music',
  });
function formatStoryMinimaxH3DetailedBody(source = '') {
  const list = String(source || '').trim(),
    next = /\[Shot\s+\d+\](?:\s+At\s+\d{2}:\d{2}\.\d{3}，镜头切换为新镜头。)?/gu,
    list2 = [...list.matchAll(next)];
  if (!list2.length) return list;
  const current = list.slice(0, list2[0].index).trim(),
    args = list2.map((entry, record) => {
      const payload = Number(entry.index) + entry[0].length,
        handle = list2[record + 1]?.index ?? list.length,
        state = list.slice(payload, handle)
          .trim()
          .replace(
            /[ \t]+(?=(?:<Subject \d+>|角色[^\s]+|说话人) \(S\d+\) (?:说|以画外音说)：<d>)/gu,
            '\n',
          )
          .replace(new RegExp('[ \\t]+(?=' + STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL + '：)', 'gu'), '\n');
      return [entry[0], state].filter(Boolean).join('\n');
    });
  return [current, ...args].filter(Boolean).join('\n\n');
}
export function formatStoryMinimaxH3PromptLayout(config = '') {
  return String(config || '').replace(
    /(^|\n)(detailed_description|integrated_multimodal_description):[ \t]*\n?([\s\S]*?)(?=\n+overall_soundscape:)/u,
    (scope, input, output, value2) =>
      '' + input + output + ':\n' + formatStoryMinimaxH3DetailedBody(value2),
  );
}
export function normalizeStoryMinimaxH3OfficialTags(value3 = '') {
  const value4 = String(value3 || '')
    .replace(/&(?:amp;)?lt;|&#0*60;|&#x0*3c;|＜/giu, '<')
    .replace(/&(?:amp;)?gt;|&#0*62;|&#x0*3e;|＞/giu, '>')
    .replace(/&(?:amp;)?nbsp;|&#0*160;|&#x0*a0;/giu, ' ')
    .replace(/［/gu, '[')
    .replace(/］/gu, ']')
    .replace(/同步声音\s*[：:]/gu, STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL + '：')
    .replace(
      /<\s*(Subject|Picture|Video|Audio)\s+(\d+)\s*>/giu,
      (value5, value6, value7) =>
        '<' + STORY_MINIMAX_H3_REFERENCE_TAG_LABELS[value6.toLowerCase()] + ' ' + value7 + '>',
    )
    .replace(/(<Subject \d+>)(?=[（(\u3400-\u9fff])/gu, '$1 ')
    .replace(/<\s*(\/?)\s*d\s*>/giu, (value8, value9) => '<' + (value9 ? '/' : '') + 'd>')
    .replace(/<\s*(scenetrans|cutoff)\s*>/giu, (value10, value11) => '<' + value11.toLowerCase() + '>')
    .replace(/\[\s*Shot\s+(\d+)\s*\]/giu, (value12, value13) => '[Shot ' + value13 + ']')
    .replace(/\[\s*Chinese\s*\]/giu, '[Chinese]')
    .replace(/\[\s*reference\s+generation\s*\]/giu, '[reference generation]')
    .replace(/[（(]\s*S\s*(\d+)\s*[）)]/giu, (value14, value15) => '(S' + value15 + ')')
    .replace(/(\(S\d+\))(?=[\u3400-\u9fff])/gu, '$1 ')
    .replace(
      /(^|\n)([\t ]*)(?:#{1,6}[\t ]*|\*{1,2})?(subject[\s_-]*definitions|summary|retention[\s_-]*analysis|detailed[\s_-]*description|integrated[\s_-]*multimodal[\s_-]*description|overall[\s_-]*soundscape|non[\s_-]*diegetic[\s_-]*music)\s*[:：](?:\*{1,2})?/giu,
      (value16, value17, value18, value19) => {
        const value20 = STORY_MINIMAX_H3_SECTION_LABELS[value19.toLowerCase().replace(/[\s-]+/gu, '_')];
        return '' + value17 + value18 + value20 + ':';
      },
    )
    .replace(/(<Subject \d+>[^\n:]*:\s*)fully_preserved\b/giu, '$1fully_preserved')
    .replace(/(<Audio \d+>\s*:\s*)reference\b/giu, '$1reference')
    .replace(/(\[Shot \d+\]\s+)At\b/giu, '$1At');
  return formatStoryMinimaxH3PromptLayout(value4);
}
function convertStoryMinimaxH3ReferencePromptToT2VA(value21 = '') {
  const value22 = String(value21 || ''),
    enabled = value22.match(
      /(?:^|\n\n)detailed_description:\s*([\s\S]*?)\n\noverall_soundscape:/u,
    )?.[1]?.trim(),
    enabled2 = value22.match(
      /(?:^|\n\n)overall_soundscape:\s*([\s\S]*?)\n\nnon_diegetic_music:/u,
    )?.[1]?.trim(),
    enabled3 = value22.match(/(?:^|\n\n)non_diegetic_music:\s*([\s\S]*)$/u)?.[1]?.trim();
  if (!enabled || !enabled2 || !enabled3) return value22;
  const map = new Map(),
    args2 = value22.match(/^subject_definitions:\s*([\s\S]*?)\n\nsummary:/u)?.[1] || '';
  [
    /<Subject\s+(\d+)>\s+是(?:角色|场景|环境|道具)\s+([^，；\n]+)/gu,
    /<Subject\s+(\d+)>\s+is\s+the\s+(?:character|environment|prop)\s+([^,;\n]+)/gu,
  ].forEach((value23) => {
    [...args2.matchAll(value23)].forEach((value24) => {
      map.set(value24[1], value24[2].trim());
    });
  });
  const value25 = enabled.replace(
    /<Subject\s+(\d+)>/gu,
    (value26, value27) => map.get(value27) || '参考主体 ' + value27,
  );
  return formatStoryMinimaxH3PromptLayout(
    [
      'integrated_multimodal_description:\n' + value25,
      'overall_soundscape:\n' + enabled2,
      'non_diegetic_music:\n' + enabled3,
    ].join('\n\n'),
  );
}
export function serializeStoryPromptForMode(value28 = '', value29 = '') {
  const value30 = String(value28 || '');
  if (isStoryMinimaxH3PromptMode(value29)) {
    let storyMinimaxH3OfficialTags = normalizeStoryMinimaxH3OfficialTags(value30)
      .replace(/@(?:图片|图像)(\d+)/gu, '<Picture $1>')
      .replace(/@视频(\d+)/gu, '<Video $1>')
      .replace(/@(?:声音|音频)(\d+)/gu, '<Audio $1>');
    if (!/<(?:Picture|Video)\s+\d+>/u.test(storyMinimaxH3OfficialTags))
      return convertStoryMinimaxH3ReferencePromptToT2VA(
        storyMinimaxH3OfficialTags.replace(/<Audio\s+\d+>/gu, ''),
      );
    const list3 = new Map();
    storyMinimaxH3OfficialTags.split('\n').forEach((args3) => {
      const enabled4 = args3.match(/<Subject\s+(\d+)>/u)?.[1];
      if (!enabled4) return;
      [...args3.matchAll(/<Audio\s+(\d+)>/gu)].forEach((value31) => {
        list3.set(value31[1], enabled4);
      });
    });
    if (!list3.size) return storyMinimaxH3OfficialTags;
    const list4 = [],
      list5 = [],
      list6 = [];
    return (
      list3.forEach((value32, value33) => {
        const value34 = storyMinimaxH3OfficialTags.match(
            new RegExp('<Subject\\s+' + value32 + '>\\s+\\((S\\d+)\\)', 'u'),
          )?.[1],
          value35 = '<Subject ' + value32 + '>' + (value34 ? ' (' + value34 + ')' : '');
        (list4.push('<Audio ' + value33 + '> 是 ' + value35 + ' 的声线、语气与说话方式参考。'),
          list5.push(
            '<Audio ' +
              value33 +
              '>: reference - <Audio ' +
              value33 +
              '> 为 ' +
              value35 +
              ' 提供声线、语气与说话方式参考。',
          ),
          list6.push(value35 + ' 的 <Audio ' + value33 + '>'));
      }),
      (storyMinimaxH3OfficialTags = storyMinimaxH3OfficialTags.replace(
        /\n\nsummary:/u,
        '\n' + list4.join('\n') + '\n\nsummary:',
      )
        .replace(
          /\n\nretention_analysis:/u,
          ' 目标还使用' + list6.join('、') + '。\n\nretention_analysis:',
        )
        .replace(
          /\n\ndetailed_description:/u,
          '\n' + list5.join('\n') + '\n\ndetailed_description:',
        )),
      storyMinimaxH3OfficialTags
    );
  }
  if (!isStoryWan30PromptMode(value29)) return value30;
  return value30.replace(/@图片(\d+)/gu, '图$1')
    .replace(/@视频(\d+)/gu, '视频$1')
    .replace(/@(?:声音|音频)(\d+)/gu, '音频$1');
}
