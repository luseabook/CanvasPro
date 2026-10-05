export const REPLICATION_VOICEOVER_KINDS = Object['freeze']({
  narration: '解说／旁白',
  inner_monologue: '内心独白',
  uncertain: '类型待核对',
});
export const REPLICATION_SPEECH_GUIDANCE =
  '完整保留原片所有人声文案：dialogue 是人物对白，voiceover 是解说／旁白或内心独白。逐句保留原语言、第一／第三人称、叙述顺序、信息和语气；目标语言变化时逐句翻译，不得将解说概括成剧情摘要、改成人物对白或省略。正文用‘旁白：’或‘内心独白：’明确标注；分镜将这些文案放入 shot.voiceover，人物对白放入 shot.dialogue。旁白和内心独白不要求画面人物开口或匹配口型，不把独立解说员列为画面角色。声音描述 sound 仅承载音乐、音效与声音特征，不替代人声原文；没有的人声不得补写。';
export function normalizeReplicationVoiceover(list = [], map) {
  if (!Array['isArray'](list)) throw new Error('原视频解说文案格式无效。');
  return list['map']((uncertain) => {
    const kind = String(uncertain['kind'] || '')['trim'](),
      speakerId = String(uncertain['speakerId'] || '')['trim']();
    if (!Object['hasOwn'](REPLICATION_VOICEOVER_KINDS, kind)) throw new Error('原视频解说类型无效。');
    if (speakerId && !map['has'](speakerId)) throw new Error('原视频解说引用了未登记的人物。');
    return {
      kind: kind,
      speakerId: speakerId,
      text: String(uncertain['text'] || '')['trim'](),
      uncertain:
        uncertain['uncertain'] === !![] || kind === 'uncertain' || (kind === 'inner_monologue' && !speakerId),
    };
  });
}
export function formatReplicationVoiceover(response, list2 = []) {
  const error = list2['find']((value) => value['id'] === response['speakerId']),
    item = error ? '（' + error['id'] + '：' + error['name'] + '）' : '';
  return (
    '' +
    REPLICATION_VOICEOVER_KINDS[response['kind']] +
    item +
    '：' +
    response['text'] +
    (response['uncertain'] ? ' [待核对]' : '')
  );
}
