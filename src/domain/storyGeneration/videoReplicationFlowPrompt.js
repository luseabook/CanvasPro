import { requireFlow } from './videoReplicationFlowContract.js';
import { STORY_PROMPT_MODE_SEEDANCE_2_0, STORY_PROMPT_MODE_SEEDANCE_2_5 } from './promptModes.js';
import { formatStoryPromptShotHeading } from './promptShotFormat.js';
import { sliceFlowSpeech } from './videoReplicationFlowSpeech.js';
import {
  findReplicationSpeechBlock,
  groupContinuousReplicationVoiceover,
} from './videoReplicationSpeechLayout.js';
import { formatReplicationSpatial } from './videoReplicationVisualContract.js';
const limits = Object['freeze']({
    [STORY_PROMPT_MODE_SEEDANCE_2_0]: 15,
    [STORY_PROMPT_MODE_SEEDANCE_2_5]: 30,
  }),
  tick = (value) => Math['round']((value + Number['EPSILON']) * 10),
  seconds = (item) => (tick(item) / 10)['toFixed'](1);
export function resolveReplicationFlowOptions({
  promptMode: promptMode = STORY_PROMPT_MODE_SEEDANCE_2_0,
  maxSeconds: maxSeconds,
} = {}) {
  return (
    requireFlow(
      Object['hasOwn'](limits, promptMode),
      '当前复刻草稿编译仅支持 Seedance 2.0 / 2.5',
    ),
    (maxSeconds ??= limits[promptMode]),
    requireFlow(Number['isFinite'](maxSeconds) && maxSeconds >= 0.1, '片段时长上限无效'),
    { promptMode: promptMode, maxSeconds: Math['min'](maxSeconds, limits[promptMode]) }
  );
}
export function stripFlowSubtitleOverlays(key = '') {
  const index = [],
    enabled = [],
    result = { '“': '”', '‘': '’', '（': '）', '(': ')', '「': '」' };
  let data = '';
  for (const options of key) {
    data += options;
    if (options === '"') {
      if (enabled['at'](-1) === options) enabled['pop']();
      else enabled['push'](options);
    } else {
      if (result[options]) enabled['push'](result[options]);
      else {
        if (options === enabled['at'](-1)) enabled['pop']();
      }
    }
    !enabled['length'] && /[，,。；;\n]/u['test'](options) && (index['push'](data), (data = ''));
  }
  if (data) index['push'](data);
  const enabled2 =
      /^(?:(?:同时|此时)[，,\s]*)?(?:(?:屏幕|画面)(?:(?:的)?(?:左上角|右上角|左下角|右下角|左侧|右侧|左边|右边|下方|上方|底部|顶部|中央|中间)|上)?(?:字幕|(?:出现|显示|叠加|浮现)(?=[、：:\s“"「]|字幕|文字|$))|(?:屏幕|画面)[。\s]*$|(?:旁白|对话|解说)?字幕|(?:旁边|一旁|画面旁边)?(?:配有|出现|叠加)(?:身份|人物)介绍文字)/u,
    enabled3 =
      /^(?:(?:屏幕|画面)(?:的)?)?(?:左上角|右上角|左下角|右下角|左侧|右侧|下方|上方|底部|顶部)(?:有|出现|显示|叠加)(?:竖排|横排|人物介绍|身份介绍|姓名|介绍|白色|黑色|红色|金色|的)*(?:文字|字幕|字样|标题|文案)/u;
  return index['filter'](
    (target) => !enabled2['test'](target['trim']()) && !enabled3['test'](target['trim']()),
  )
    ['join']('')
    ['trim']()
    ['replace'](/[，,；;]\s*$/u, '。');
}
function promptBlocks(source, next, current, handler = tick) {
  const entry = [];
  let args = [];
  for (const record of source) {
    const payload = Math['max'](next, record['startSec']),
      handle = Math['min'](current, record['endSec']);
    if (handler(handle - next) === handler(payload - next)) {
      if (entry['length'])
        ((entry['at'](-1)['endSec'] = handle), entry['at'](-1)['shots']['push'](record));
      else args['push'](record);
    } else
      (entry['push']({ startSec: args['length'] ? next : payload, endSec: handle, shots: [...args, record] }),
        (args = []));
  }
  if (args['length']) entry['push']({ startSec: next, endSec: current, shots: args });
  return entry;
}
export function buildReplicationFlowPrompt(
  state,
  {
    start: start,
    end: end,
    shots: shots,
    used: used,
    promptMode: promptMode2,
    referenceHeader: referenceHeader,
    continuityLines: continuityLines,
    integerTime: integerTime = false,
    shotSpeech: shotSpeech = false,
    stagingHandoff: stagingHandoff = false,
  },
) {
  const run = integerTime ? (config) => String(Math['round'](config)) : seconds,
    map = new Map(state['characters']['map']((scope) => [scope['id'], scope['name']])),
    input = state['speech']
      ['filter']((output) => output['endSec'] > start && output['startSec'] < end)
      ['map']((value2) => sliceFlowSpeech(value2, start, end))
      ['filter']((value3) => value3['parts']['length']),
    handler2 = (value4) => value4['speakerLabel'] || map['get'](value4['speakerId']) || '',
    list = [...map['keys']()]
      ['filter'](Boolean)
      ['sort']((list2, list3) => list3['length'] - list2['length'])
      ['map']((value5) => value5['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&')),
    value6 = list['length']
      ? new RegExp('(?<![A-Za-z0-9_-])(?:' + list['join']('|') + ')(?![A-Za-z0-9_-])', 'gu')
      : null,
    handler3 = (value7) =>
      String(value7 || '')
        ['replace'](/\s*[（(]([^（）()]+)[）)]/gu, (value8, value9) => (map['has'](value9) ? '' : value8))
        ['replace'](value6 || /(?!)/u, (value10) => map['get'](value10) || value10),
    handler4 = integerTime ? Math['round'] : tick,
    promptBlocks2 = promptBlocks(shots, start, end, handler4),
    handler5 = (value11) =>
      findReplicationSpeechBlock(promptBlocks2, value11['startSec'], handler4, start, value11['endSec']),
    list4 = promptBlocks2['map']((value12, value13) => {
      const tick2 = tick(value12['startSec'] - start),
        tick3 = tick(value12['endSec'] - start),
        value14 = input['filter']((value15) => handler5(value15) === value13),
        value16 = input['filter'](
          (value17) => handler5(value17) < value13 && value17['endSec'] > value12['startSec'],
        ),
        value18 = value12['shots']
          ['map']((value19) => {
            const value20 = handler3(value19['visual']),
              value21 = handler3(value19['camera']),
              stripFlowSubtitleOverlays2 = stripFlowSubtitleOverlays(value19['sound'])
                ['replace'](
                  /(?:画外音|对白)时间[：:]\s*\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?秒?[，。；;]?/gu,
                  '',
                )
                ['split'](/[，,；;、]/u)
                ['filter'](
                  (value22) =>
                    value22['trim']() &&
                    !/^(?:画外音|旁白|对白|对话|人声)(?:解说|声|开始|继续|结束|响起)*[。\s]*$/u['test'](
                      value22['trim'](),
                    ),
                )
                ['join']('，'),
              count = shots['indexOf'](value19),
              value23 =
                count === 0 ||
                (value19['sceneKey'] && value19['sceneKey'] !== shots[count - 1]?.['sceneKey']),
              value24 = stagingHandoff && count === shots['length'] - 1,
              value25 = value23 ? formatReplicationSpatial(value19['spatialStart']) : '',
              value26 = value24 ? formatReplicationSpatial(value19['spatialEnd']) : '';
            return [
              value25 ? '站位设定：' + handler3(value25) : '',
              value20 ? '画面：' + value20 : '',
              value21 ? '镜头：' + value21['replace'](/[。]+$/u, '') + '。' : '',
              value26 ? '片段结束站位：' + handler3(value26) : '',
              stripFlowSubtitleOverlays2 && stripFlowSubtitleOverlays2 !== '无'
                ? '环境音：' + stripFlowSubtitleOverlays2['replace'](/[。]+$/u, '') + '。'
                : '',
            ]
              ['filter'](Boolean)
              ['join']('\n');
          })
          ['join']('\n'),
        formatStoryPromptShotHeading2 = formatStoryPromptShotHeading({
          promptMode: promptMode2,
          index: value13,
          durationSec: (tick3 - tick2) / 10,
          timeRange: run(value12['startSec'] - start) + '-' + run(value12['endSec'] - start) + '秒',
        }),
        value27 = shotSpeech
          ? groupContinuousReplicationVoiceover(
              value14,
              input,
              (value28) => handler4(value28 - start),
              handler2,
            )
          : value14,
        args2 = value27['map']((value29) => {
          const value30 = value29['startSec'] - start,
            value31 = value29['endSec'] - start,
            handler6 =
              run(value30) === run(value31) && value31 > value30
                ? (value32) => String(Number(value32['toFixed'](3)))
                : run,
            value33 = handler6(value30) + '-' + handler6(value31) + '秒',
            list5 = value29['parts']['map']((response) =>
              response['kind'] === 'voiceover'
                ? '' +
                  (shotSpeech ? '（本片段' + value33 + '）' : '') +
                  handler2(response) +
                  '画外音：“' +
                  response['text'] +
                  '”'
                : (handler2(response) || '说话人') + '说：“' + response['text'] + '”',
            );
          if (shotSpeech) return list5['join']('\n随后，');
          return (
            '同期人声（本片段' +
            value33 +
            (value29['endSec'] > value12['endSec'] ? '，跨镜连续' : '') +
            '）：\n' +
            list5['join']('\n随后，')
          );
        });
      return {
        startSec: value12['startSec'] - start,
        endSec: value12['endSec'] - start,
        sourceShotIds: value12['shots']['map']((value34) => value34['id']),
        speechFragments: value14,
        continuedSpeechIds: value16['map']((value35) => value35['sourceId']),
        prompt: [formatStoryPromptShotHeading2 + '：\n' + value18, ...args2]['join']('\n'),
      };
    });
  return {
    promptShots: list4,
    prompt: [
      '生成' + run(end - start) + '秒视频。',
      referenceHeader ??
        (used['length']
          ? '人物：' +
            used['map']((value36) => value36['name'] + '（' + value36['appearance'] + '）')['join']('；')
          : ''),
      ...(continuityLines ?? []),
      ...list4['map']((value37) => value37['prompt']),
    ]
      ['filter'](Boolean)
      ['join']('\n\n'),
  };
}
