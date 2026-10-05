import { requireFlow, validateFlowSource } from './videoReplicationFlowContract.js';
import { sliceFlowSpeech } from './videoReplicationFlowSpeech.js';
import { buildReplicationFlowPrompt, resolveReplicationFlowOptions } from './videoReplicationFlowPrompt.js';
const round = (value) => Math['round'](value * 1000) / 1000,
  EPS = 0.001;
export function finalizeReplicationFlow(
  item,
  { durationSec: durationSec, maxSeconds: maxSeconds, promptMode: promptMode, notes: notes = [] } = {},
) {
  const response = {
    status: 'needs-attention',
    acceptancePolicy: 'usable-output',
    source: item,
    clips: [],
    notes: notes['map']((args) => ({ ...args, blocking: false })),
  };
  try {
    (requireFlow(Number['isFinite'](durationSec) && durationSec > 0, '原片时长无效'),
      (response['source'] = validateFlowSource(item, durationSec, response['notes'])));
    const replicationFlowOptions = resolveReplicationFlowOptions({
      promptMode: promptMode,
      maxSeconds: maxSeconds,
    });
    ((response['promptMode'] = replicationFlowOptions['promptMode']),
      (response['clips'] = compileReplicationFlow(
        response['source'],
        replicationFlowOptions['maxSeconds'],
        replicationFlowOptions,
      )),
      requireFlow(response['clips']['length'] > 0, '没有可用的片段提示词'),
      response['notes']['push'](
        ...response['clips']['flatMap']((key) =>
          key['notes']['map']((args2) => ({ ...args2, clip: key['index'] })),
        ),
      ),
      (response['status'] = response['notes']['length'] ? 'passed-with-notes' : 'passed'));
  } catch (index) {
    ((response['clips'] = []),
      response['notes']['push']({ code: 'output-invalid', blocking: true, detail: index['message'] }));
  }
  return response;
}
export function compileReplicationFlow(args3, maxSeconds2, { promptMode: promptMode2 } = {}) {
  ({ maxSeconds: maxSeconds2, promptMode: promptMode2 } = resolveReplicationFlowOptions({
    maxSeconds: maxSeconds2,
    promptMode: promptMode2,
  }));
  const result = args3['shots']['at'](-1)['endSec'],
    data = new Map(args3['characters']['map']((options) => [options['id'], options])),
    target = [
      ...new Set([
        0,
        result,
        ...args3['shots']['map']((source) => source['endSec']),
        ...args3['speech']['map']((next) => next['endSec']),
        ...args3['speech']['map']((current) => current['startSec']),
      ]),
    ]['sort']((entry, record) => entry - record),
    list = [];
  let payload = 0;
  while (payload < result - EPS) {
    const run = (handle) =>
        !args3['speech']['some'](
          (state) => state['startSec'] < handle - EPS && state['endSec'] > handle + EPS,
        ),
      config = target['filter'](
        (scope) => scope > payload + EPS && scope <= payload + maxSeconds2 + EPS && run(scope),
      );
    let input = config['at'](-1);
    if (input == null && run(Math['min'](payload + maxSeconds2, result)))
      input = Math['min'](payload + maxSeconds2, result);
    if (input == null) input = Math['min'](payload + maxSeconds2, result);
    const list2 = args3['shots']['filter'](
        (output) => output['endSec'] > payload + EPS && output['startSec'] < input - EPS,
      ),
      value2 = args3['speech']
        ['filter']((value3) => value3['endSec'] > payload && value3['startSec'] < input)
        ['map']((value4) => sliceFlowSpeech(value4, payload, input))
        ['filter']((value5) => value5['parts']['length']),
      list3 = value2['flatMap']((value6) =>
        value6['parts']['map']((args4) => ({ sourceId: value6['sourceId'], ...args4 })),
      ),
      value7 = [
        ...new Set([
          ...list2['flatMap']((value8) => value8['characterIds']),
          ...list3['map']((value9) => value9['speakerId'])['filter'](Boolean),
        ]),
      ]['map']((value10) => data['get'](value10)),
      value11 = [];
    if (
      !list3['length'] &&
      list2['some']((value12) => /画外音|旁白|对白|对话|说话/u['test'](value12['sound']))
    )
      value11['push']({
        code: 'unlocated-speech',
        detail: '画面记录提及人声，但本段没有原话记录',
        blocking: false,
      });
    for (const value13 of value2) {
      if (value13['estimated'])
        value11['push']({
          code: 'speech-timing-estimated',
          sourceId: value13['sourceId'],
          blocking: false,
          detail: '人声跨越片段边界，按原文顺序拆分并近似分配时间，原话未删改',
        });
      if (
        value13['parts']['some'](
          (value14) => value14['uncertainty'] || /听不清|无法辨认/u['test'](value14['text']),
        )
      )
        value11['push']({
          code: 'uncertain-speech',
          sourceId: value13['sourceId'],
          blocking: false,
          detail: '人声证据仍不确定',
        });
    }
    const args5 = buildReplicationFlowPrompt(args3, {
      start: payload,
      end: input,
      shots: list2,
      used: value7,
      promptMode: promptMode2,
    });
    (list['push']({
      index: list['length'] + 1,
      promptMode: promptMode2,
      sourceStartSec: payload,
      sourceEndSec: input,
      durationSec: round(input - payload),
      sourceShotIds: list2['map']((value15) => value15['id']),
      speechIds: value2['map']((value16) => value16['sourceId']),
      speechFragments: value2,
      notes: value11,
      ...args5,
    }),
      (payload = input));
  }
  for (const value17 of args3['speech']) {
    const value18 = value17['parts']['map']((value19) => value19['text'])['join'](''),
      value20 = list['flatMap']((value21) => value21['speechFragments'])
        ['filter']((value22) => value22['sourceId'] === value17['id'])
        ['flatMap']((value23) => value23['parts'])
        ['map']((value24) => value24['text'])
        ['join']('');
    requireFlow(value18 === value20, '分段遗漏或重复人声');
    const value25 = list['flatMap']((value26) => value26['promptShots'])
      ['flatMap']((value27) => value27['speechFragments'])
      ['filter']((value28) => value28['sourceId'] === value17['id'])
      ['flatMap']((value29) => value29['parts'])
      ['map']((value30) => value30['text'])
      ['join']('');
    requireFlow(value18 === value25, '镜头同步遗漏或重复人声');
  }
  return list;
}
