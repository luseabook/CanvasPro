import { isStoryContinuousTimelinePromptMode } from './promptModes.js';
export const REPLICATION_INTEGER_TIMING_RULE =
  'shot.startSec/endSec 使用片段局部整数秒，durationSec/d=endSec-startSec；首镜从0开始，各镜连续无空档重叠，末镜结束等于计划 durationSec。原片小数切点由 timingContract 就近映射；审查和修补也必须使用同一整数切点，不提出小数秒修补。已有切点和片段总时长不得改变。';
export const REPLICATION_SOURCE_CUT_RULE =
  'sourceShotsComplete=false 表示来源缺少逐镜依据：不得均分或猜测切点，不根据多轮对白虚构镜头；保留已识别人声和候选内容，标记需核对原片。修补只可补入 observedBoundaries 中已有证据的切点。';
export function isValidIntegerTimelineShot(value) {
  const count = Number(value?.['startSec']),
    item = Number(value?.['endSec']);
  return (
    value?.['startSec'] != null &&
    value?.['endSec'] != null &&
    Number['isInteger'](count) &&
    count >= 0 &&
    Number['isInteger'](item) &&
    item > count &&
    item - count === Number(value['durationSec'] ?? value['d'])
  );
}
export function getReplicationVisualGaps(list = [], key = 0, endSec = 0) {
  if (!Number['isFinite'](key) || !Number['isFinite'](endSec) || endSec <= key) return [];
  const index = list['flatMap']((result) => result['shots'] || [])
      ['filter'](
        (data) =>
          Number['isFinite'](data['startSec']) &&
          Number['isFinite'](data['endSec']) &&
          data['endSec'] > data['startSec'],
      )
      ['sort']((options, target) => options['startSec'] - target['startSec']),
    list2 = [];
  let startSec = key;
  for (const endSec2 of index) {
    if (endSec2['endSec'] <= startSec || endSec2['startSec'] >= endSec) continue;
    if (endSec2['startSec'] - startSec > 0.1)
      list2['push']({ startSec: startSec, endSec: endSec2['startSec'] });
    startSec = Math['max'](startSec, Math['min'](endSec, endSec2['endSec']));
  }
  if (endSec - startSec > 0.1) list2['push']({ startSec: startSec, endSec: endSec });
  return list2;
}
export function getReplicationClipTiming(ref, source = {}, next = 'seedance-2.5') {
  const sourceStartSec =
      source['replication']?.['segmentPlan']?.['find']((current) => current['ref'] === ref['ref']) || ref,
    sourceShotsComplete =
      sourceStartSec['events'] ||
      ref['replicationSpeechEvents'] ||
      (source['replication']?.['sourceAnalysis']?.['events'] || [])['filter'](
        (entry) =>
          entry['endSec'] > sourceStartSec['sourceStartSec'] &&
          entry['startSec'] < sourceStartSec['sourceEndSec'],
      ),
    durationSec = Number(sourceStartSec['durationSec']),
    handler = (record) =>
      isStoryContinuousTimelinePromptMode(next) ? Math['round'](record) : Number(record['toFixed'](3)),
    observedBoundaries = [
      ...new Set(
        sourceShotsComplete['flatMap']((payload) => payload['shots'] || [])
          ['flatMap']((handle) => [handle['startSec'], handle['endSec']])
          ['map']((state) => handler(state - Number(sourceStartSec['sourceStartSec'])))
          ['filter']((count2) => count2 > 0 && count2 < durationSec),
      ),
    ]['sort']((config, scope) => config - scope);
  return {
    ref: ref['ref'],
    durationSec: durationSec,
    sourceStartSec: sourceStartSec['sourceStartSec'],
    sourceEndSec: sourceStartSec['sourceEndSec'],
    sourceShotsComplete:
      sourceShotsComplete['length'] > 0 &&
      sourceShotsComplete['every']((input) => input['shots']?.['length']) &&
      !getReplicationVisualGaps(
        sourceShotsComplete,
        Number(sourceStartSec['sourceStartSec']),
        Number(sourceStartSec['sourceEndSec']),
      )['length'],
    observedBoundaries: observedBoundaries,
  };
}
export function buildReplicationTimingContract(
  output,
  value2,
  clips2 = output['replication']?.['segmentPlan'] || [],
) {
  return {
    unit: isStoryContinuousTimelinePromptMode(value2) ? 'integer-seconds' : 'seconds',
    origin: 'clip-start',
    clips: clips2['map']((value3) => getReplicationClipTiming(value3, output, value2)),
  };
}
export function inspectReplicationSourceCompleteness({ clips: clips = [] }, value4) {
  return clips['flatMap']((clipRef) =>
    getReplicationClipTiming(clipRef, value4)['sourceShotsComplete']
      ? []
      : [
          {
            clipRef: clipRef['ref'],
            code: 'replication_source_shots_missing',
            message:
              '原片记录缺少逐镜切点或人声与镜头的对应关系，本段尚未完成逐镜核对；请在原片核对页重新分析或核对镜头，不能用后续润色代替识别。',
          },
        ],
  );
}
