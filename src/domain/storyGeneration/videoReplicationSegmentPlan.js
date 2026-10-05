import { sliceFlowSpeech } from './videoReplicationFlowSpeech.js';
import { isStoryContinuousTimelinePromptMode } from './promptModes.js';
import { getReplicationEventSpeech } from './videoReplicationSpeechOrder.js';
import {
  REPLICATION_SHOT_GUIDANCE as REPLICATION_SHOT_GUIDANCE_2,
  inspectReplicationSourceShotCoverage,
  hasReplicationInternalCut,
} from './videoReplicationShotEvidence.js';
import { REPLICATION_SPEECH_INTEGRITY_GUIDANCE } from './videoReplicationSpeechIntegrity.js';
import { REPLICATION_TIMELINE_RULE } from './videoReplicationPromptPolicy.js';
import { connectReplicationClipStates } from './videoReplicationVisualState.js';
import { resolveReplicationContentType } from './videoReplicationContentRouting.js';
const REPLICATION_SHOT_GUIDANCE = REPLICATION_SHOT_GUIDANCE_2 + REPLICATION_SPEECH_INTEGRITY_GUIDANCE,
  round = (value) => Number(value['toFixed'](3));
export function buildReplicationSegmentPlan(
  enabled,
  { durationSec: durationSec, maxSeconds: maxSeconds, promptMode: promptMode } = {},
) {
  const count = Number(durationSec),
    isStoryContinuousTimelinePromptMode2 = isStoryContinuousTimelinePromptMode(promptMode)
      ? Math['floor'](Number(maxSeconds))
      : Number(maxSeconds);
  if (!(count > 0 && isStoryContinuousTimelinePromptMode2 > 0) || !enabled?.['events']?.['length'])
    throw new Error('原片缺少可分段的时间证据。');
  const list = [...new Set(enabled['events']['map']((item) => Number(item['endSec'])))]['sort'](
      (key, index) => key - index,
    ),
    result = [];
  let data = 0;
  while (data < count - 0.001) {
    const options = Math['min'](count, data + isStoryContinuousTimelinePromptMode2),
      target = list['filter']((source) => source > data && source <= options + 0.001),
      next = target['at'](-1),
      current = options === count ? count : (next ?? options),
      entry = enabled['events']
        ['filter']((record) => record['endSec'] > data && record['startSec'] < current)
        ['map']((args) => {
          const payload = {
              ...args,
              startSec: Math['max'](data, args['startSec']),
              endSec: Math['min'](current, args['endSec']),
            },
            replicationEventSpeech = getReplicationEventSpeech(args),
            map = new Map();
          if (replicationEventSpeech) {
            const list2 = args['shots']?.['length']
              ? replicationEventSpeech['flatMap']((handle) => {
                  const list3 = args['shots']['filter']((state) =>
                      state['speechRefs']['includes'](handle['key']),
                    ),
                    config =
                      handle['timingSource'] === 'asr'
                        ? handle['startSec']
                        : list3['length']
                          ? Math['min'](...list3['map']((scope) => scope['startSec']))
                          : args['startSec'],
                    input =
                      handle['timingSource'] === 'asr'
                        ? handle['endSec']
                        : list3['length']
                          ? Math['max'](...list3['map']((output) => output['endSec']))
                          : args['endSec'];
                  return sliceFlowSpeech(
                    { ...args, startSec: config, endSec: input, parts: [handle] },
                    data,
                    current,
                  )['parts'];
                })
              : sliceFlowSpeech({ ...args, parts: replicationEventSpeech }, data, current)['parts'];
            ((payload['dialogue'] = []),
              (payload['voiceover'] = []),
              (payload['speechOrder'] = list2['map'](({ key: key2, kind: kind, ...args2 }) => {
                const value2 = payload[kind]['length'],
                  value3 = (args[kind] || [])[Number(key2?.['split'](':')[1])];
                return (
                  payload[kind]['push']({
                    ...args2,
                    ...(kind === 'voiceover' ? { kind: value3?.['kind'] || 'narration' } : {}),
                  }),
                  map['set'](key2, [...(map['get'](key2) || []), kind + ':' + value2]),
                  kind + ':' + value2
                );
              })));
          } else
            for (const value4 of ['dialogue', 'voiceover']) {
              payload[value4] = sliceFlowSpeech(
                {
                  ...args,
                  parts: (args[value4] || [])['map']((args3, value5) => ({
                    ...args3,
                    key: value4 + ':' + value5,
                  })),
                },
                data,
                current,
              )['parts']['map'](({ key: key3, ...args4 }, value6) => {
                return (map['set'](key3, [value4 + ':' + value6]), args4);
              });
            }
          if (args['shots'])
            payload['shots'] = args['shots']
              ['filter']((value7) => value7['endSec'] > data && value7['startSec'] < current)
              ['map']((args5) => ({
                ...args5,
                startSec: Math['max'](data, args5['startSec']),
                endSec: Math['min'](current, args5['endSec']),
                ...(args5['startSec'] < data ? { spatialStart: [] } : {}),
                ...(args5['endSec'] > current ? { spatialEnd: [] } : {}),
                speechRefs: [
                  ...new Set(args5['speechRefs']['flatMap']((value8) => map['get'](value8) || [])),
                ],
              }));
          return (
            (payload['timingEstimated'] = args['startSec'] < data || args['endSec'] > current),
            payload
          );
        }),
      round2 = round(current - data);
    (result['push']({
      ref: 'clip-' + (result['length'] + 1),
      sourceStartSec: round(data),
      sourceEndSec: round(current),
      durationSec: isStoryContinuousTimelinePromptMode(promptMode) ? Math['ceil'](round2) : round2,
      events: entry,
    }),
      (data = current));
  }
  return result;
}
export function getReplicationSegmentPlanGuidance(options2 = {}) {
  const enabled2 = options2['replication']?.['segmentPlan'];
  if (!enabled2?.['length']) return '';
  const value9 =
    REPLICATION_SHOT_GUIDANCE +
    '\n每个 shot.assetUsages 必须关联实际出现的场景和关键道具，不能只列人物；对白里只是提及的位置不算实际场景。使用素材清单已有 ref 和 appearanceRef，多形象选当前镜头实际状态，不凭空造素材。画外音可以延迟开始、跨镜持续；在开始发声镜头的 audio 写完整覆盖时间，正文保留整句一次，后续镜头无需延续标记；时间不得超出片段。人物对白写入对应镜头 dialogue，visual/camera 明确说话人的画面动作和景别；画外音写 voiceover，不附加口型同步或不驱动口型说明，不用‘对白同步发生’代替具体发言。';
  return (
    value9 +
    '\n程序已确定 ' +
    enabled2['length'] +
    ' 个片段。' +
    REPLICATION_TIMELINE_RULE +
    ' 每段只返回一个同 ref 的 clip，shots 合计严格等于计划 durationSec。原片绝对时间转为片段局部时间，不能重新估时。events.shots 记录实际镜头；按 speechRefs 放回人声，speechOrder 保留穿插顺序。timingEstimated 表示跨段人声近似定位，不能据此重复或猜写原话。'
  );
}
export function inspectReplicationShotGranularity({ clips: clips = [] } = {}, value10 = {}) {
  return [
    ...inspectReplicationSourceShotCoverage({ clips: clips }, value10),
    ...clips['flatMap']((value11) =>
      (value11['shots'] || [])['flatMap']((value12, value13) => {
        const value14 = String(value12['dialogue'] || '')
            ['split']('\n')
            ['filter']((value15) => /^[^：:]+[：:]/u['test'](value15)),
          value16 = /正反打|切换|切至|切到|切镜/u['test'](
            (value12['camera'] || '') + ' ' + (value12['visual'] || ''),
          );
        if (
          !(Number(value12['durationSec']) >= 15 && value14['length'] >= 3 && value16) &&
          hasReplicationInternalCut(value12)
        )
          return [
            {
              clipRef: value11['ref'],
              shotIndex: value13,
              code: 'replication_shot_internal_cut',
              message: '单个 shot 内仍包含实际切镜或多个机位，须按原片边界分成独立区间，不能改写为连续运镜。',
            },
          ];
        return Number(value12['durationSec']) >= 15 && value14['length'] >= 3 && value16
          ? [
              {
                clipRef: value11['ref'],
                shotIndex: value13,
                code: 'replication_shot_collapsed',
                message: '单镜头混入多轮问答和切镜，缺少动作与人声对应的镜头时间区间。',
              },
            ]
          : [];
      }),
    ),
  ];
}
export function applyReplicationSegmentPlan(args6, value17) {
  const enabled3 = value17['replication']?.['segmentPlan'];
  if (!enabled3?.['length']) return args6;
  if (args6['clips']?.['length'] !== enabled3['length'])
    throw new Error(
      '原片已规划 ' +
        enabled3['length'] +
        ' 段，模型返回 ' +
        (args6['clips']?.['length'] || 0) +
        ' 段，未采用偏离计划的分段。',
    );
  return {
    ...args6,
    clips: connectReplicationClipStates(
      args6['clips']['map']((args7, value18) => {
        const value19 = enabled3[value18],
          value20 = (args7['shots'] || [])['reduce'](
            (value21, value22) => value21 + Number(value22['durationSec'] || 0),
            0,
          );
        return {
          ...args7,
          ref: value19['ref'],
          durationSec: value20,
          replicationContentType: resolveReplicationContentType(
            value17['replication']['sourceAnalysis']?.['contentType'],
            args7['replicationContentType'],
          ),
          replicationSpeechEvents: value19['events'],
          replicationCharacters:
            value17['replication']['sourceAnalysis']?.['characters'] || args7['replicationCharacters'] || [],
          sourceStartSec: value19['sourceStartSec'],
          sourceEndSec: value19['sourceEndSec'],
        };
      }),
    ),
  };
}
export function inspectReplicationSegmentTiming({ clips: clips = [] } = {}, value23 = {}, count2 = 0) {
  const value24 = value23['replication']?.['segmentPlan'] || [];
  return clips['flatMap']((value25) => {
    const enabled4 = value24['find']((value26) => value26['ref'] === value25['ref']);
    if (!enabled4) return [];
    const count3 = (value25['shots'] || [])['reduce'](
        (value27, value28) => value27 + Number(value28['durationSec'] || 0),
        0,
      ),
      value29 = Number(enabled4['durationSec']),
      value30 = !Number['isFinite'](count3) || count3 <= 0,
      value31 = Math['abs'](count3 - value29) > 0.001,
      value32 = count2 > 0 && count3 > count2 + 0.11;
    return value30 || value31 || value32
      ? [
          {
            clipRef: value25['ref'],
            code: 'replication_duration_extreme',
            message:
              '片段时间已锁定为 ' +
              value29 +
              ' 秒，镜头合计 ' +
              count3 +
              ' 秒' +
              (count2 > 0 ? '，模型上限 ' + count2 + ' 秒' : '') +
              '；必须恢复既定时间范围，不能重新分配片段时长。',
          },
        ]
      : [];
  });
}
