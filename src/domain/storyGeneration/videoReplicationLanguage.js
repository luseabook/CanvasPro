export function getVideoReplicationAudioLanguage(_0xed1ebb = {}, _0x162363 = {}) {
  if (_0x162363['sourceMode'] !== 'video-replication') return null;
  const _0x172361 =
    _0xed1ebb['replication']?.['targetLocale'] || _0x162363['replication']?.['targetLocale'] || 'source';
  return {
    targetLocale: _0x172361,
    sourceLanguage: _0xed1ebb['replication']?.['sourceAnalysis']?.['sourceLanguage'] || '',
  };
}
export function buildVideoReplicationAudioLanguageRule(_0x81ede2) {
  if (!_0x81ede2?.['targetLocale']) return '';
  const _0x45a05c =
    _0x81ede2['targetLocale'] === 'source'
      ? '原片语言' +
        (_0x81ede2['sourceLanguage'] ? '（' + _0x81ede2['sourceLanguage'] + '）' : '') +
        '，保留原对白语言，不猜测未知语种'
      : _0x81ede2['targetLocale'];
  return (
    '复刻声音语言规则：对白及其括号内的语气、情绪、音量、语速、说话方式描述，旁白/画外音，以及音效与声音描述，统一使用' +
    _0x45a05c +
    '。此规则优先于通用提示词模式中的中文声音/对白要求；dialogue/q、voiceover/o、audio/a 均须遵守。已翻译的台词保留原意、完整信息、说话顺序和说话人，不得擅自改变目标语种或混入其他语言；不得把语气说明读成台词。人物姓名、素材引用、字段名与时间标记保持原样；画面 visual/v、动作、场景和运镜 camera/c 继续使用中文。没有的声音不补写。译后对白沿用既定时间轴，无法自然容纳时指出疑点，不自行改时长、不加速硬塞。'
  );
}
export const VIDEO_REPLICATION_AUDIO_LANGUAGE_SYSTEM_RULE =
  '当输入 sourceVideoEvidence.adaptation.audioLanguage 存在时，执行其中的复刻声音语言规则；该规则覆盖上述通用中文输出要求中的对白、语气、旁白及音效语言，其余画面与运镜仍使用中文。没有该规则时沿用当前模式语言。';
