import { isStoryContinuousTimelinePromptMode } from './promptModes.js';
export const REPLICATION_INTEGER_TIMING_RULE =
  'shot.startSec/endSec\x20使用片段局部整数秒，durationSec/d=endSec-startSec；首镜从0开始，各镜连续无空档重叠，末镜结束等于计划\x20durationSec。原片小数切点由\x20timingContract\x20就近映射；审查和修补也必须使用同一整数切点，不提出小数秒修补。已有切点和片段总时长不得改变。';
export const REPLICATION_SOURCE_CUT_RULE =
  'sourceShotsComplete=false 表示来源缺少逐镜依据：不得均分或猜测切点，不根据多轮对白虚构镜头；保留已识别人声和候选内容，标记需核对原片。修补只可补入 observedBoundaries 中已有证据的切点。';
export function isValidIntegerTimelineShot(_0x562c64) {
  const _0x1a7fcc = Number(_0x562c64?.['startSec']),
    _0x287a3d = Number(_0x562c64?.['endSec']);
  return (
    _0x562c64?.['startSec'] != null &&
    _0x562c64?.['endSec'] != null &&
    Number['isInteger'](_0x1a7fcc) &&
    _0x1a7fcc >= 0x0 &&
    Number['isInteger'](_0x287a3d) &&
    _0x287a3d > _0x1a7fcc &&
    _0x287a3d - _0x1a7fcc === Number(_0x562c64['durationSec'] ?? _0x562c64['d'])
  );
}
export function getReplicationVisualGaps(_0x4ce741 = [], _0x24040e = 0x0, _0x53e24b = 0x0) {
  if (!Number['isFinite'](_0x24040e) || !Number['isFinite'](_0x53e24b) || _0x53e24b <= _0x24040e) return [];
  const _0x394a2b = _0x4ce741['flatMap']((_0x23cc58) => _0x23cc58['shots'] || [])
      ['filter'](
        (_0x585c51) =>
          Number['isFinite'](_0x585c51['startSec']) &&
          Number['isFinite'](_0x585c51['endSec']) &&
          _0x585c51['endSec'] > _0x585c51['startSec'],
      )
      ['sort']((_0x3fea8c, _0x5f02b6) => _0x3fea8c['startSec'] - _0x5f02b6['startSec']),
    _0x2771d1 = [];
  let _0x2c18f5 = _0x24040e;
  for (const _0x4c2404 of _0x394a2b) {
    if (_0x4c2404['endSec'] <= _0x2c18f5 || _0x4c2404['startSec'] >= _0x53e24b) continue;
    if (_0x4c2404['startSec'] - _0x2c18f5 > 0.1)
      _0x2771d1['push']({ startSec: _0x2c18f5, endSec: _0x4c2404['startSec'] });
    _0x2c18f5 = Math['max'](_0x2c18f5, Math['min'](_0x53e24b, _0x4c2404['endSec']));
  }
  if (_0x53e24b - _0x2c18f5 > 0.1) _0x2771d1['push']({ startSec: _0x2c18f5, endSec: _0x53e24b });
  return _0x2771d1;
}
export function getReplicationClipTiming(_0x237905, _0x4ada40 = {}, _0x371b42 = 'seedance-2.5') {
  const _0x2f30d0 =
      _0x4ada40['replication']?.['segmentPlan']?.['find'](
        (_0x107b96) => _0x107b96['ref'] === _0x237905['ref'],
      ) || _0x237905,
    _0x2ba606 =
      _0x2f30d0['events'] ||
      _0x237905['replicationSpeechEvents'] ||
      (_0x4ada40['replication']?.['sourceAnalysis']?.['events'] || [])['filter'](
        (_0x29e7ed) =>
          _0x29e7ed['endSec'] > _0x2f30d0['sourceStartSec'] &&
          _0x29e7ed['startSec'] < _0x2f30d0['sourceEndSec'],
      ),
    _0x49872c = Number(_0x2f30d0['durationSec']),
    _0x2ffd68 = (_0xce4d84) =>
      isStoryContinuousTimelinePromptMode(_0x371b42)
        ? Math['round'](_0xce4d84)
        : Number(_0xce4d84['toFixed'](0x3)),
    _0x2414ff = [
      ...new Set(
        _0x2ba606['flatMap']((_0x88e714) => _0x88e714['shots'] || [])
          ['flatMap']((_0x18b34c) => [_0x18b34c['startSec'], _0x18b34c['endSec']])
          ['map']((_0x27314e) => _0x2ffd68(_0x27314e - Number(_0x2f30d0['sourceStartSec'])))
          ['filter']((_0x2afebf) => _0x2afebf > 0x0 && _0x2afebf < _0x49872c),
      ),
    ]['sort']((_0x58136a, _0x363273) => _0x58136a - _0x363273);
  return {
    ref: _0x237905['ref'],
    durationSec: _0x49872c,
    sourceStartSec: _0x2f30d0['sourceStartSec'],
    sourceEndSec: _0x2f30d0['sourceEndSec'],
    sourceShotsComplete:
      _0x2ba606['length'] > 0x0 &&
      _0x2ba606['every']((_0x5a6d5b) => _0x5a6d5b['shots']?.['length']) &&
      !getReplicationVisualGaps(
        _0x2ba606,
        Number(_0x2f30d0['sourceStartSec']),
        Number(_0x2f30d0['sourceEndSec']),
      )['length'],
    observedBoundaries: _0x2414ff,
  };
}
export function buildReplicationTimingContract(
  _0x4b4e46,
  _0x6cb96b,
  _0x4d58eb = _0x4b4e46['replication']?.['segmentPlan'] || [],
) {
  return {
    unit: isStoryContinuousTimelinePromptMode(_0x6cb96b) ? 'integer-seconds' : 'seconds',
    origin: 'clip-start',
    clips: _0x4d58eb['map']((_0x10fd40) => getReplicationClipTiming(_0x10fd40, _0x4b4e46, _0x6cb96b)),
  };
}
export function inspectReplicationSourceCompleteness({ clips: clips = [] }, _0x53d417) {
  return clips['flatMap']((_0x13de70) =>
    getReplicationClipTiming(_0x13de70, _0x53d417)['sourceShotsComplete']
      ? []
      : [
          {
            clipRef: _0x13de70['ref'],
            code: 'replication_source_shots_missing',
            message:
              '原片记录缺少逐镜切点或人声与镜头的对应关系，本段尚未完成逐镜核对；请在原片核对页重新分析或核对镜头，不能用后续润色代替识别。',
          },
        ],
  );
}
