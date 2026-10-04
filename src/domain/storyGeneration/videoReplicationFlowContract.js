import { normalizeFlowSource } from './videoReplicationFlowNormalization.js';
export function requireFlow(enabled, value) {
  if (!enabled) throw new Error(value);
}
const text = (item) => typeof item === 'string',
  wording = (key) => key['replace'](/[^\p{L}\p{N}]/gu, ''),
  partsText = (index) => index['parts']['map']((result) => result['text'])['join'](''),
  exactFields = (data, args) =>
    requireFlow(
      data && Object['keys'](data)['sort']()['join'](',') === [...args]['sort']()['join'](','),
      '补丁包含未授权或缺失字段',
    );
export function inspectFlowSpeech(enabled2) {
  return enabled2['shots']
    ['filter']((options) => {
      const target = options['sound']['replace'](
        /无(?:人声|旁白|对白|对话)|没有(?:人声|旁白|对白|对话)/gu,
        '',
      );
      return (
        /旁白|画外音|对白|对话|说话/u['test'](target) &&
        !enabled2['speech']['some'](
          (source) => source['startSec'] < options['endSec'] && source['endSec'] > options['startSec'],
        )
      );
    })
    ['map']((next) => next['id']);
}
export function applyFlowSpeechRecovery(args2, current, entry) {
  (exactFields(current, ['videoObserved', 'speech']),
    requireFlow(
      current['videoObserved'] === !![] && Array['isArray'](current['speech']) && current['speech']['length'],
      '人声补录未确认原片或仍为空',
    ));
  const record = [],
    validateFlowSource2 = validateFlowSource({ ...args2, speech: current['speech'] }, entry, record),
    list = [];
  for (const payload of validateFlowSource2['shots']) {
    payload['visual'] = payload['visual']['replace'](/字幕(?:显示|为)?[：:]?\s*“[^”]*”[。]?/gu, (handle) => {
      return (list['push']({ shotId: payload['id'], exactText: handle }), '');
    });
  }
  return { source: validateFlowSource(validateFlowSource2, entry), removals: list, notes: record };
}
export function validateFlowSource(state, config, scope = []) {
  (requireFlow(state, '未获得可用的原片识别结果，请查看前序步骤的具体错误'),
    requireFlow(state?.['videoObserved'] === !![], '模型未确认读取原片'),
    requireFlow(
      Array['isArray'](state['characters']) &&
        Array['isArray'](state['shots']) &&
        state['shots']['length'] &&
        Array['isArray'](state['speech']),
      '识别结果缺少人物、镜头或人声数组',
    ));
  const args3 = normalizeFlowSource(state, config),
    args4 = args3['source'],
    input = [...args4['characters'], ...args4['shots'], ...args4['speech']]['map']((output) => output['id']);
  requireFlow(
    input['every']((value2) => text(value2) && value2['trim']()) &&
      new Set(input)['size'] === input['length'],
    '原片记录编号缺失或重复',
  );
  const value3 = new Set(args4['characters']['map']((value4) => value4['id']));
  requireFlow(
    args4['characters']['every'](
      (error) => text(error['name']) && error['name']['trim']() && text(error['appearance']),
    ),
    '人物名称或外观无效',
  );
  for (const [value5, value6] of args4['shots']['entries']()) {
    requireFlow(
      Number['isFinite'](value6['startSec']) &&
        Number['isFinite'](value6['endSec']) &&
        value6['endSec'] > value6['startSec'],
      '镜头时间无效：' + value6['id'],
    );
    const value7 = value5 ? args4['shots'][value5 - 0x1]['endSec'] : 0x0;
    (requireFlow(
      Math['abs'](value6['startSec'] - value7) < 0.02 && value6['endSec'] <= config + 0.02,
      '镜头时间不连续或越界：' + value6['id'],
    ),
      requireFlow(
        Array['isArray'](value6['characterIds']) &&
          value6['characterIds']['every']((value8) => value3['has'](value8)),
        '镜头人物引用无效：' + value6['id'],
      ),
      requireFlow(
        text(value6['visual']) &&
          value6['visual']['trim']() &&
          text(value6['camera']) &&
          text(value6['sound']) &&
          text(value6['uncertainty']),
        '镜头内容无效：' + value6['id'],
      ));
  }
  requireFlow(Math['abs'](args4['shots']['at'](-0x1)['endSec'] - config) < 0.02, '镜头未覆盖至原片结尾');
  for (const [enabled3, value9] of args4['speech']['entries']()) {
    (requireFlow(
      Number['isFinite'](value9['startSec']) &&
        Number['isFinite'](value9['endSec']) &&
        value9['startSec'] >= 0x0 &&
        value9['endSec'] > value9['startSec'] &&
        value9['endSec'] <= config + 0.02,
      '人声时间无效：' + value9['id'],
    ),
      requireFlow(
        !enabled3 || value9['startSec'] >= args4['speech'][enabled3 - 0x1]['startSec'],
        '人声记录顺序错误',
      ),
      requireFlow(
        Array['isArray'](value9['parts']) &&
          value9['parts']['length'] > 0x0 &&
          value9['parts']['length'] <= 0x10,
        '人声内容为空：' + value9['id'],
      ));
    for (const value10 of value9['parts']) {
      requireFlow(
        (value3['has'](value10['speakerId']) || value10['speakerId'] === '') &&
          ['dialogue', 'voiceover']['includes'](value10['kind']) &&
          text(value10['text']) &&
          value10['text']['trim']() &&
          text(value10['uncertainty']),
        '人声归属、类型或文本无效：' + value9['id'],
      );
    }
  }
  return (scope['push'](...args3['notes']), args4);
}
export function classifyFlowReview(args5, value11, value12) {
  requireFlow(value11?.['videoObserved'] === !![] && Array['isArray'](value11['issues']), '审查结果结构无效');
  const value13 = [],
    value14 = [],
    enabled4 = new Set();
  for (const [value15, list2] of [
    ['checkedSpeechIds', args5['speech']],
    ['checkedShotIds', args5['shots']],
  ]) {
    (!Array['isArray'](value11[value15]) ||
      JSON['stringify']([...new Set(value11[value15])]['sort']()) !==
        JSON['stringify'](list2['map']((value16) => value16['id'])['sort']())) &&
      value14['push']({
        code: 'review-coverage',
        blocking: ![],
        detail: '审查未确认覆盖全部镜头与人声，保留可定位的意见并继续',
        field: value15,
      });
  }
  const value17 = new Set(
      [...args5['characters'], ...args5['shots'], ...args5['speech']]['map']((value18) => value18['id']),
    ),
    value19 = new Set(['speaker', 'identity', 'key_action', 'plot', 'major_omission']);
  for (const args6 of value11['issues']['slice'](0x0, 0xc)) {
    try {
      (requireFlow(args6 && typeof args6 === 'object', '审查问题不是对象'),
        requireFlow(
          text(args6['id']) &&
            args6['id'] &&
            !enabled4['has'](args6['id']) &&
            Array['isArray'](args6['sourceIds']) &&
            args6['sourceIds']['length'] &&
            args6['sourceIds']['every']((value20) => value17['has'](value20)),
          '审查引用缺失、重复或未知',
        ),
        enabled4['add'](args6['id']),
        requireFlow(
          Number['isFinite'](args6['startSec']) &&
            Number['isFinite'](args6['endSec']) &&
            args6['startSec'] >= 0x0 &&
            args6['endSec'] > args6['startSec'] &&
            args6['endSec'] <= value12,
          '审查证据时间无效',
        ),
        requireFlow(
          text(args6['evidence']) &&
            args6['evidence']['trim']() &&
            ['high', 'uncertain']['includes'](args6['confidence']),
          '审查缺少证据或置信度',
        ),
        requireFlow(
          value19['has'](args6['category']) || args6['category'] === 'minor_wording',
          '审查问题类别无效',
        ));
      if (value19['has'](args6['category']) && args6['confidence'] === 'high') value13['push'](args6);
      else value14['push']({ ...args6, blocking: ![], code: 'review-note' });
    } catch (value21) {
      value14['push']({
        code: 'review-issue-skipped',
        blocking: ![],
        issue: args6,
        detail: value21['message'],
      });
    }
  }
  if (value11['hasMoreIssues'] || value11['issues']['length'] > 0xc)
    value14['push']({ code: 'review-overflow', blocking: ![], detail: '审查仍有未列出的实质问题' });
  return { actionable: value13, notes: value14 };
}
export function mapFlowReviewTimes(args7, list3, list4 = []) {
  return (
    requireFlow(
      ['reel', 'source']['includes'](args7?.['timeBasis']) && Array['isArray'](args7['issues']),
      '审查缺少明确的窗口时间基准',
    ),
    {
      ...args7,
      timeBasis: 'source',
      issues: args7['issues']['flatMap']((args8) => {
        const value22 =
            Number['isFinite'](args8?.['startSec']) &&
            Number['isFinite'](args8?.['endSec']) &&
            args8['endSec'] > args8['startSec'],
          handler = (value23, value24, value25 = 0x0) =>
            value22 &&
            args8['startSec'] >= value23[value24 + 'StartSec'] - value25 &&
            args8['endSec'] <= value23[value24 + 'EndSec'] + value25;
        let value26 = args7['timeBasis'],
          enabled5 =
            list3['find']((value27) => handler(value27, value26)) ||
            list3['find']((value28) => handler(value28, value26, 0x1));
        if (!enabled5 && value26 === 'reel') {
          enabled5 = list3['find']((value29) => handler(value29, 'source'));
          if (enabled5) value26 = 'source';
        }
        if (!enabled5)
          return (
            list4['push']({
              code: 'review-issue-skipped',
              blocking: ![],
              issue: args8,
              detail: '审查时间无法定位到证据窗口，保留意见但不据此改稿',
            }),
            []
          );
        const value30 = value26 === 'reel' ? enabled5['sourceStartSec'] - enabled5['reelStartSec'] : 0x0,
          value31 = Math['max'](enabled5['sourceStartSec'], args8['startSec'] + value30),
          value32 = Math['min'](enabled5['sourceEndSec'], args8['endSec'] + value30);
        if (value32 <= value31)
          return (
            list4['push']({
              code: 'review-issue-skipped',
              blocking: ![],
              issue: args8,
              detail: '审查时间未与证据窗口相交，保留意见但不据此改稿',
            }),
            []
          );
        return (
          (value26 !== args7['timeBasis'] ||
            value31 !== args8['startSec'] + value30 ||
            value32 !== args8['endSec'] + value30) &&
            list4['push']({
              code: 'review-time-normalized',
              blocking: ![],
              issueId: args8['id'],
              detail:
                value26 !== args7['timeBasis']
                  ? '审查时间使用了原片秒数，已按原片窗口定位'
                  : '已对齐审查时间边缘不超过 1 秒的偏差',
            }),
          [{ ...args8, startSec: value31, endSec: value32 }]
        );
      }),
    }
  );
}
export function applyFlowRepair(value33, value34, value35, value36) {
  exactFields(value35, ['speechPatches', 'shotPatches', 'characterPatches', 'addedSpeech', 'issueResults']);
  for (const value37 of Object['keys'](value35))
    requireFlow(Array['isArray'](value35[value37]), '修补结果必须为数组');
  requireFlow(
    JSON['stringify'](value35['issueResults']['map']((value38) => value38['issueId'])['sort']()) ===
      JSON['stringify'](value34['map']((value39) => value39['id'])['sort']()),
    '修补未逐项回应审查问题',
  );
  for (const response of value35['issueResults'])
    requireFlow(
      ['repaired', 'rejected', 'uncertain']['includes'](response['status']) &&
        text(response['reason']) &&
        response['reason']['trim'](),
      '修补处理状态无效',
    );
  const args9 = structuredClone(value33),
    enabled6 = new Set(),
    handler2 = (value40) => value34['filter']((value41) => value41['sourceIds']['includes'](value40)),
    handler3 = (value42, value43) => {
      requireFlow(handler2(value42)['length'] && !enabled6['has'](value42), '补丁越过审查范围或重复修改');
      const value44 = value43['find']((value45) => value45['id'] === value42);
      return (requireFlow(value44, '补丁引用未知记录'), enabled6['add'](value42), value44);
    };
  for (const value46 of value35['speechPatches']) {
    exactFields(value46, ['id', 'parts']);
    const value47 = handler3(value46['id'], args9['speech']);
    (handler2(value46['id'])['every']((value48) => value48['category'] === 'speaker') &&
      requireFlow(
        Array['isArray'](value46['parts']) && wording(partsText(value46)) === wording(partsText(value47)),
        '说话人修补不得改写原话',
      ),
      (value47['parts'] = structuredClone(value46['parts'])));
  }
  for (const value49 of value35['shotPatches']) {
    (exactFields(value49, ['id', 'visual', 'camera', 'sound', 'characterIds', 'uncertainty']),
      Object['assign'](handler3(value49['id'], args9['shots']), value49));
  }
  for (const value50 of value35['characterPatches']) {
    (exactFields(value50, ['id', 'name', 'appearance']),
      requireFlow(
        handler2(value50['id'])['some']((value51) => value51['category'] === 'identity'),
        '人物修改必须由身份问题授权',
      ),
      Object['assign'](handler3(value50['id'], args9['characters']), value50));
  }
  for (const [value52, value53] of value35['addedSpeech']['entries']()) {
    exactFields(value53, ['shotId', 'startSec', 'endSec', 'parts']);
    const value54 = args9['shots']['find']((value55) => value55['id'] === value53['shotId']);
    (requireFlow(
      value54 && handler2(value54['id'])['some']((value56) => value56['category'] === 'major_omission'),
      '补录人声必须引用被报告遗漏的镜头',
    ),
      requireFlow(
        value53['startSec'] >= value54['startSec'] && value53['endSec'] <= value54['endSec'],
        '补录人声越过证据范围',
      ));
    const value57 = 'repair-speech-' + (value52 + 0x1);
    (requireFlow(
      ![...args9['characters'], ...args9['shots'], ...args9['speech']]['some'](
        (value58) => value58['id'] === value57,
      ),
      '补录编号冲突',
    ),
      args9['speech']['push']({
        id: value57,
        startSec: value53['startSec'],
        endSec: value53['endSec'],
        parts: structuredClone(value53['parts']),
      }));
  }
  return (
    args9['speech']['sort']((value59, value60) => value59['startSec'] - value60['startSec']),
    validateFlowSource(args9, value36)
  );
}
export function applyFlowRepairIndividually(value61, value62, value63, value64) {
  exactFields(value63, ['speechPatches', 'shotPatches', 'characterPatches', 'addedSpeech', 'issueResults']);
  const args10 = {
    speechPatches: [],
    shotPatches: [],
    characterPatches: [],
    addedSpeech: [],
    issueResults: value63['issueResults'],
  };
  let flowRepair = applyFlowRepair(value61, value62, args10, value64);
  const list5 = [],
    enabled7 = new Set();
  for (const value65 of ['speechPatches', 'shotPatches', 'characterPatches', 'addedSpeech']) {
    requireFlow(Array['isArray'](value63[value65]), '修补字段不是数组');
    const value66 =
      value65 === 'addedSpeech' ? [value63[value65]] : value63[value65]['map']((value67) => [value67]);
    for (const list6 of value66) {
      if (!list6['length']) continue;
      try {
        for (const enabled8 of list6) {
          if (!enabled8['id']) continue;
          (requireFlow(!enabled7['has'](enabled8['id']), '同一记录不能重复修补'),
            enabled7['add'](enabled8['id']));
        }
        flowRepair = applyFlowRepair(flowRepair, value62, { ...args10, [value65]: list6 }, value64);
      } catch (error2) {
        list5['push']({
          field: value65,
          ids: list6['map']((value68) => value68['id'] || value68['shotId']),
          detail: error2['message'],
        });
      }
    }
  }
  return { candidate: flowRepair, rejected: list5 };
}
export function flowEvidenceWindows(args11, value69, value70) {
  const value71 = value69['map']((value72) => {
      const list7 = [...args11['shots'], ...args11['speech']]['filter']((value73) =>
        value72['sourceIds']['includes'](value73['id']),
      );
      for (const value74 of value72['sourceIds']) {
        const count = args11['speech']['findIndex']((value75) => value75['id'] === value74);
        if (count > 0x0) list7['push'](args11['speech'][count - 0x1]);
        if (count >= 0x0 && count + 0x1 < args11['speech']['length'])
          list7['push'](args11['speech'][count + 0x1]);
      }
      return {
        sourceStartSec: Math['max'](
          0x0,
          Math['floor'](Math['min'](value72['startSec'], ...list7['map']((value76) => value76['startSec']))) -
            0x1,
        ),
        sourceEndSec: Math['min'](
          value70,
          Math['ceil'](Math['max'](value72['endSec'], ...list7['map']((value77) => value77['endSec']))) + 0x1,
        ),
      };
    })['sort']((value78, value79) => value78['sourceStartSec'] - value79['sourceStartSec']),
    value80 = [];
  for (const args12 of value71) {
    const value81 = value80['at'](-0x1);
    if (value81 && args12['sourceStartSec'] <= value81['sourceEndSec'])
      value81['sourceEndSec'] = Math['max'](value81['sourceEndSec'], args12['sourceEndSec']);
    else value80['push']({ ...args12 });
  }
  let value82 = 0x0;
  return value80['map']((args13) => {
    const value83 = value82;
    return (
      (value82 += args13['sourceEndSec'] - args13['sourceStartSec']),
      { ...args13, reelStartSec: value83, reelEndSec: value82 }
    );
  });
}
export function createFlowReviewWindows(value84, value85, count2 = 0x23) {
  requireFlow(Number['isFinite'](count2) && count2 >= 0xa, '审查窗口上限无效');
  const value86 = Math['ceil'](value85 / count2),
    value87 = value85 / value86,
    value88 = Array['from']({ length: value86 }, () => ({
      characters: value84['characters'],
      shots: [],
      speech: [],
      videoObserved: !![],
      title: value84['title'],
    }));
  for (const value89 of ['shots', 'speech']) {
    for (const value90 of value84[value89])
      value88[
        Math['min'](value86 - 0x1, Math['floor']((value90['startSec'] + value90['endSec']) / 0x2 / value87))
      ][value89]['push'](value90);
  }
  return value88['map']((args14, value91) => {
    if (!args14['shots']['length'] && !args14['speech']['length']) return null;
    const list8 = [...args14['shots'], ...args14['speech']],
      value92 = Math['max'](
        0x0,
        Math['min'](value91 * value87, ...list8['map']((value93) => value93['startSec'])) - 0x2,
      ),
      value94 = Math['min'](
        value85,
        Math['max']((value91 + 0x1) * value87, ...list8['map']((value95) => value95['endSec'])) + 0x2,
      );
    return {
      scope: args14,
      windows: [
        { sourceStartSec: value92, sourceEndSec: value94, reelStartSec: 0x0, reelEndSec: value94 - value92 },
      ],
    };
  })['filter'](Boolean);
}
