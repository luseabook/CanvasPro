export const REPLICATION_VOICEOVER_KINDS = Object['freeze']({
  narration: '解说／旁白',
  inner_monologue: '内心独白',
  uncertain: '类型待核对',
});
export const REPLICATION_SPEECH_GUIDANCE =
  '完整保留原片所有人声文案：dialogue 是人物对白，voiceover 是解说／旁白或内心独白。逐句保留原语言、第一／第三人称、叙述顺序、信息和语气；目标语言变化时逐句翻译，不得将解说概括成剧情摘要、改成人物对白或省略。正文用‘旁白：’或‘内心独白：’明确标注；分镜将这些文案放入 shot.voiceover，人物对白放入 shot.dialogue。旁白和内心独白不要求画面人物开口或匹配口型，不把独立解说员列为画面角色。声音描述 sound 仅承载音乐、音效与声音特征，不替代人声原文；没有的人声不得补写。';
export function normalizeReplicationVoiceover(_0x4d8cda = [], _0xfdbd9c) {
  if (!Array['isArray'](_0x4d8cda)) throw new Error('原视频解说文案格式无效。');
  return _0x4d8cda['map']((_0x148fd1) => {
    const _0x51d915 = String(_0x148fd1['kind'] || '')['trim'](),
      _0x4ccf79 = String(_0x148fd1['speakerId'] || '')['trim']();
    if (!Object['hasOwn'](REPLICATION_VOICEOVER_KINDS, _0x51d915)) throw new Error('原视频解说类型无效。');
    if (_0x4ccf79 && !_0xfdbd9c['has'](_0x4ccf79)) throw new Error('原视频解说引用了未登记的人物。');
    return {
      kind: _0x51d915,
      speakerId: _0x4ccf79,
      text: String(_0x148fd1['text'] || '')['trim'](),
      uncertain:
        _0x148fd1['uncertain'] === !![] ||
        _0x51d915 === 'uncertain' ||
        (_0x51d915 === 'inner_monologue' && !_0x4ccf79),
    };
  });
}
export function formatReplicationVoiceover(_0x4947f3, _0x1d67c2 = []) {
  const _0x1f424c = _0x1d67c2['find']((_0x53e8e0) => _0x53e8e0['id'] === _0x4947f3['speakerId']),
    _0x1ed14d = _0x1f424c ? '（' + _0x1f424c['id'] + '：' + _0x1f424c['name'] + '）' : '';
  return (
    '' +
    REPLICATION_VOICEOVER_KINDS[_0x4947f3['kind']] +
    _0x1ed14d +
    '：' +
    _0x4947f3['text'] +
    (_0x4947f3['uncertain'] ? '\x20[待核对]' : '')
  );
}
