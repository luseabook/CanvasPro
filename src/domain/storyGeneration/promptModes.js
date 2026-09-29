export const STORY_PROMPT_MODE_SEEDANCE_2_0 = 'seedance-2.0';
export const STORY_PROMPT_MODE_SEEDANCE_2_5 = 'seedance-2.5';
export const STORY_PROMPT_MODE_WAN_3_0 = 'wan-3.0';
export const STORY_PROMPT_MODE_MINIMAX_H3 = 'minimax-h3';
export const STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL = '画面内音效';
export const STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID = 'apimart/doubao-seedance-2.0';
export const STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID = 'apimart/doubao-seedance-2.5';
export const STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID = 'apimart/wan3.0';
export const STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID = 'apimart/minimax-h3';
export const STORY_PROMPT_MODE_OPTIONS = Object['freeze']([
  Object['freeze']({
    value: STORY_PROMPT_MODE_SEEDANCE_2_0,
    label: 'Seedance 2.0',
    enabled: !![],
    rules: 'current',
  }),
  Object['freeze']({
    value: STORY_PROMPT_MODE_SEEDANCE_2_5,
    label: 'Seedance\x202.5',
    enabled: !![],
    rules: 'continuous-timeline',
  }),
  Object['freeze']({
    value: STORY_PROMPT_MODE_WAN_3_0,
    label: 'Wan 3.0',
    enabled: !![],
    rules: 'wan-multimodal-timeline',
  }),
  Object['freeze']({
    value: STORY_PROMPT_MODE_MINIMAX_H3,
    label: 'MiniMax H3',
    enabled: !![],
    rules: 'minimax-h3-multimodal-story',
  }),
]);
function normalizeText(_0x3e71a9) {
  return String(_0x3e71a9 || '')['trim']();
}
export function normalizeStoryPromptMode(_0x503467, { allowDeveloperModes: allowDeveloperModes = ![] } = {}) {
  const _0x29ec7d = normalizeText(_0x503467)['toLowerCase']();
  return STORY_PROMPT_MODE_OPTIONS['some'](
    (_0x1d60f3) => _0x1d60f3['value'] === _0x29ec7d && (_0x1d60f3['enabled'] || allowDeveloperModes),
  )
    ? _0x29ec7d
    : STORY_PROMPT_MODE_SEEDANCE_2_0;
}
export function getStoryPromptModeLabel(_0x131e0d) {
  const _0x484285 = normalizeText(_0x131e0d)['toLowerCase']();
  return (
    STORY_PROMPT_MODE_OPTIONS['find']((_0x590b96) => _0x590b96['value'] === _0x484285)?.['label'] ||
    STORY_PROMPT_MODE_OPTIONS[0x0]['label']
  );
}
export function isStorySeedance25PromptMode(_0x1af15c) {
  return normalizeText(_0x1af15c)['toLowerCase']() === STORY_PROMPT_MODE_SEEDANCE_2_5;
}
export function isStoryWan30PromptMode(_0x1cb157) {
  return normalizeText(_0x1cb157)['toLowerCase']() === STORY_PROMPT_MODE_WAN_3_0;
}
export function isStoryMinimaxH3PromptMode(_0x236324) {
  return normalizeText(_0x236324)['toLowerCase']() === STORY_PROMPT_MODE_MINIMAX_H3;
}
export function isStoryContinuousTimelinePromptMode(_0x318723) {
  return isStorySeedance25PromptMode(_0x318723) || isStoryWan30PromptMode(_0x318723);
}
export function resolveStoryPromptModeDefaultVideoModelId(_0x37b603) {
  const _0x4e7591 = normalizeText(_0x37b603)['toLowerCase']();
  return (
    {
      [STORY_PROMPT_MODE_SEEDANCE_2_0]: STORY_PROMPT_MODE_SEEDANCE_2_0_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_SEEDANCE_2_5]: STORY_PROMPT_MODE_SEEDANCE_2_5_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_WAN_3_0]: STORY_PROMPT_MODE_WAN_3_0_DEFAULT_VIDEO_MODEL_ID,
      [STORY_PROMPT_MODE_MINIMAX_H3]: STORY_PROMPT_MODE_MINIMAX_H3_DEFAULT_VIDEO_MODEL_ID,
    }[_0x4e7591] || ''
  );
}
const STORY_MINIMAX_H3_REFERENCE_TAG_LABELS = Object['freeze']({
    subject: 'Subject',
    picture: 'Picture',
    video: 'Video',
    audio: 'Audio',
  }),
  STORY_MINIMAX_H3_SECTION_LABELS = Object['freeze']({
    subject_definitions: 'subject_definitions',
    summary: 'summary',
    retention_analysis: 'retention_analysis',
    detailed_description: 'detailed_description',
    integrated_multimodal_description: 'integrated_multimodal_description',
    overall_soundscape: 'overall_soundscape',
    non_diegetic_music: 'non_diegetic_music',
  });
function formatStoryMinimaxH3DetailedBody(_0xd12a38 = '') {
  const _0xf888dc = String(_0xd12a38 || '')['trim'](),
    _0x453113 = /\[Shot\s+\d+\](?:\s+At\s+\d{2}:\d{2}\.\d{3}，镜头切换为新镜头。)?/gu,
    _0x105473 = [..._0xf888dc['matchAll'](_0x453113)];
  if (!_0x105473['length']) return _0xf888dc;
  const _0x34ac8d = _0xf888dc['slice'](0x0, _0x105473[0x0]['index'])['trim'](),
    _0x1f9657 = _0x105473['map']((_0x4faff6, _0x1d3979) => {
      const _0x59a0f5 = Number(_0x4faff6['index']) + _0x4faff6[0x0]['length'],
        _0x37307f = _0x105473[_0x1d3979 + 0x1]?.['index'] ?? _0xf888dc['length'],
        _0x22b590 = _0xf888dc['slice'](_0x59a0f5, _0x37307f)
          ['trim']()
          ['replace'](
            /[ \t]+(?=(?:<Subject \d+>|角色[^\s]+|说话人) \(S\d+\) (?:说|以画外音说)：<d>)/gu,
            '\x0a',
          )
          ['replace'](new RegExp('[ \\t]+(?=' + STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL + '：)', 'gu'), '\x0a');
      return [_0x4faff6[0x0], _0x22b590]['filter'](Boolean)['join']('\x0a');
    });
  return [_0x34ac8d, ..._0x1f9657]['filter'](Boolean)['join']('\x0a\x0a');
}
export function formatStoryMinimaxH3PromptLayout(_0x80a95b = '') {
  return String(_0x80a95b || '')['replace'](
    /(^|\n)(detailed_description|integrated_multimodal_description):[ \t]*\n?([\s\S]*?)(?=\n+overall_soundscape:)/u,
    (_0x512a9f, _0x15c1b2, _0x2e3f15, _0x4b394d) =>
      '' + _0x15c1b2 + _0x2e3f15 + ':\x0a' + formatStoryMinimaxH3DetailedBody(_0x4b394d),
  );
}
export function normalizeStoryMinimaxH3OfficialTags(_0x14194a = '') {
  const _0x3176fc = String(_0x14194a || '')
    ['replace'](/&(?:amp;)?lt;|&#0*60;|&#x0*3c;|＜/giu, '<')
    ['replace'](/&(?:amp;)?gt;|&#0*62;|&#x0*3e;|＞/giu, '>')
    ['replace'](/&(?:amp;)?nbsp;|&#0*160;|&#x0*a0;/giu, '\x20')
    ['replace'](/［/gu, '[')
    ['replace'](/］/gu, ']')
    ['replace'](/同步声音\s*[：:]/gu, STORY_MINIMAX_H3_DIEGETIC_SOUND_LABEL + '：')
    ['replace'](
      /<\s*(Subject|Picture|Video|Audio)\s+(\d+)\s*>/giu,
      (_0x5b07a3, _0x10cadb, _0x1d6aff) =>
        '<' + STORY_MINIMAX_H3_REFERENCE_TAG_LABELS[_0x10cadb['toLowerCase']()] + '\x20' + _0x1d6aff + '>',
    )
    ['replace'](/(<Subject \d+>)(?=[（(\u3400-\u9fff])/gu, '$1 ')
    ['replace'](/<\s*(\/?)\s*d\s*>/giu, (_0x54eb73, _0x1090c5) => '<' + (_0x1090c5 ? '/' : '') + 'd>')
    ['replace'](
      /<\s*(scenetrans|cutoff)\s*>/giu,
      (_0x53b5ce, _0x5e2402) => '<' + _0x5e2402['toLowerCase']() + '>',
    )
    ['replace'](/\[\s*Shot\s+(\d+)\s*\]/giu, (_0x2ce0d0, _0x4548f6) => '[Shot\x20' + _0x4548f6 + ']')
    ['replace'](/\[\s*Chinese\s*\]/giu, '[Chinese]')
    ['replace'](/\[\s*reference\s+generation\s*\]/giu, '[reference\x20generation]')
    ['replace'](/[（(]\s*S\s*(\d+)\s*[）)]/giu, (_0x257b47, _0x556abd) => '(S' + _0x556abd + ')')
    ['replace'](/(\(S\d+\))(?=[\u3400-\u9fff])/gu, '$1 ')
    ['replace'](
      /(^|\n)([\t ]*)(?:#{1,6}[\t ]*|\*{1,2})?(subject[\s_-]*definitions|summary|retention[\s_-]*analysis|detailed[\s_-]*description|integrated[\s_-]*multimodal[\s_-]*description|overall[\s_-]*soundscape|non[\s_-]*diegetic[\s_-]*music)\s*[:：](?:\*{1,2})?/giu,
      (_0x1947da, _0x1d8bf2, _0x1ccfe9, _0x4d8434) => {
        const _0x5c33f0 =
          STORY_MINIMAX_H3_SECTION_LABELS[_0x4d8434['toLowerCase']()['replace'](/[\s-]+/gu, '_')];
        return '' + _0x1d8bf2 + _0x1ccfe9 + _0x5c33f0 + ':';
      },
    )
    ['replace'](/(<Subject \d+>[^\n:]*:\s*)fully_preserved\b/giu, '$1fully_preserved')
    ['replace'](/(<Audio \d+>\s*:\s*)reference\b/giu, '$1reference')
    ['replace'](/(\[Shot \d+\]\s+)At\b/giu, '$1At');
  return formatStoryMinimaxH3PromptLayout(_0x3176fc);
}
function convertStoryMinimaxH3ReferencePromptToT2VA(_0x4440e1 = '') {
  const _0x2912e1 = String(_0x4440e1 || ''),
    _0x5ae81e = _0x2912e1['match'](
      /(?:^|\n\n)detailed_description:\s*([\s\S]*?)\n\noverall_soundscape:/u,
    )?.[0x1]?.['trim'](),
    _0x22c61d = _0x2912e1['match'](
      /(?:^|\n\n)overall_soundscape:\s*([\s\S]*?)\n\nnon_diegetic_music:/u,
    )?.[0x1]?.['trim'](),
    _0x56c850 = _0x2912e1['match'](/(?:^|\n\n)non_diegetic_music:\s*([\s\S]*)$/u)?.[0x1]?.['trim']();
  if (!_0x5ae81e || !_0x22c61d || !_0x56c850) return _0x2912e1;
  const _0x5aa851 = new Map(),
    _0x306819 = _0x2912e1['match'](/^subject_definitions:\s*([\s\S]*?)\n\nsummary:/u)?.[0x1] || '';
  [
    /<Subject\s+(\d+)>\s+是(?:角色|场景|环境|道具)\s+([^，；\n]+)/gu,
    /<Subject\s+(\d+)>\s+is\s+the\s+(?:character|environment|prop)\s+([^,;\n]+)/gu,
  ]['forEach']((_0x17e5ed) => {
    [..._0x306819['matchAll'](_0x17e5ed)]['forEach']((_0x4ac3ab) => {
      _0x5aa851['set'](_0x4ac3ab[0x1], _0x4ac3ab[0x2]['trim']());
    });
  });
  const _0x5ed46d = _0x5ae81e['replace'](
    /<Subject\s+(\d+)>/gu,
    (_0x5a9a7c, _0x4b6494) => _0x5aa851['get'](_0x4b6494) || '参考主体\x20' + _0x4b6494,
  );
  return formatStoryMinimaxH3PromptLayout(
    [
      'integrated_multimodal_description:\n' + _0x5ed46d,
      'overall_soundscape:\x0a' + _0x22c61d,
      'non_diegetic_music:\n' + _0x56c850,
    ]['join']('\x0a\x0a'),
  );
}
export function serializeStoryPromptForMode(_0x56d51a = '', _0x2a687c = '') {
  const _0x5850dc = String(_0x56d51a || '');
  if (isStoryMinimaxH3PromptMode(_0x2a687c)) {
    let _0x3ec65e = normalizeStoryMinimaxH3OfficialTags(_0x5850dc)
      ['replace'](/@(?:图片|图像)(\d+)/gu, '<Picture $1>')
      ['replace'](/@视频(\d+)/gu, '<Video\x20$1>')
      ['replace'](/@(?:声音|音频)(\d+)/gu, '<Audio $1>');
    if (!/<(?:Picture|Video)\s+\d+>/u['test'](_0x3ec65e))
      return convertStoryMinimaxH3ReferencePromptToT2VA(_0x3ec65e['replace'](/<Audio\s+\d+>/gu, ''));
    const _0x13645e = new Map();
    _0x3ec65e['split']('\x0a')['forEach']((_0x486770) => {
      const _0x31d267 = _0x486770['match'](/<Subject\s+(\d+)>/u)?.[0x1];
      if (!_0x31d267) return;
      [..._0x486770['matchAll'](/<Audio\s+(\d+)>/gu)]['forEach']((_0x1c90b0) => {
        _0x13645e['set'](_0x1c90b0[0x1], _0x31d267);
      });
    });
    if (!_0x13645e['size']) return _0x3ec65e;
    const _0xda8427 = [],
      _0x321af3 = [],
      _0x53a3b0 = [];
    return (
      _0x13645e['forEach']((_0x3eb0a1, _0xa17b68) => {
        const _0x358a77 = _0x3ec65e['match'](
            new RegExp('<Subject\\s+' + _0x3eb0a1 + '>\x5cs+\x5c((S\x5cd+)\x5c)', 'u'),
          )?.[0x1],
          _0xa07818 = '<Subject ' + _0x3eb0a1 + '>' + (_0x358a77 ? '\x20(' + _0x358a77 + ')' : '');
        (_0xda8427['push']('<Audio ' + _0xa17b68 + '> 是 ' + _0xa07818 + ' 的声线、语气与说话方式参考。'),
          _0x321af3['push'](
            '<Audio\x20' +
              _0xa17b68 +
              '>: reference - <Audio ' +
              _0xa17b68 +
              '>\x20为\x20' +
              _0xa07818 +
              ' 提供声线、语气与说话方式参考。',
          ),
          _0x53a3b0['push'](_0xa07818 + ' 的 <Audio ' + _0xa17b68 + '>'));
      }),
      (_0x3ec65e = _0x3ec65e['replace'](
        /\n\nsummary:/u,
        '\x0a' + _0xda8427['join']('\x0a') + '\x0a\x0asummary:',
      )
        ['replace'](
          /\n\nretention_analysis:/u,
          ' 目标还使用' + _0x53a3b0['join']('、') + '。\n\nretention_analysis:',
        )
        ['replace'](
          /\n\ndetailed_description:/u,
          '\x0a' + _0x321af3['join']('\x0a') + '\n\ndetailed_description:',
        )),
      _0x3ec65e
    );
  }
  if (!isStoryWan30PromptMode(_0x2a687c)) return _0x5850dc;
  return _0x5850dc['replace'](/@图片(\d+)/gu, '图$1')
    ['replace'](/@视频(\d+)/gu, '视频$1')
    ['replace'](/@(?:声音|音频)(\d+)/gu, '音频$1');
}
