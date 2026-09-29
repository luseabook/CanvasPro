import { requester } from '../../api/requester.js';
export const SMART_CLIP_MIN_SEGMENTS = 0x2;
export const SMART_CLIP_MAX_SEGMENTS = 0x19;
export const SMART_CLIP_DEFAULT_SEGMENTS = 0x14;
export const SMART_CLIP_FPS_OPTIONS = Object['freeze']([0x10, 0x18, 0x1e]);
export const SMART_CLIP_DEFAULT_FPS = 0x18;
export const SMART_CLIP_MAX_SEGMENT_DURATION_SECONDS = 0x258;
export const SMART_CLIP_OUTPUT_MODE_SEGMENTS = 'videoSegments';
export const SMART_CLIP_OUTPUT_MODE_KEYFRAMES = 'keyframes';
export const SMART_CLIP_OUTPUT_MODE_ANALYSIS = 'analysis';
export const SMART_CLIP_DEFAULT_OUTPUT_MODE = SMART_CLIP_OUTPUT_MODE_SEGMENTS;
export const SMART_CLIP_KEYFRAME_SELECTION_POLICY_PERSON = 'person';
const SMART_CLIP_MODE_OPTIONS = Object['freeze'](['stable', 'balanced', 'sensitive']),
  SMART_CLIP_STATUS_POLL_INTERVAL_MS = 0x320;
function toErrorMessage(_0x4b11bc, _0x5145ef) {
  return String(_0x4b11bc?.['message'] || _0x4b11bc || _0x5145ef || 'Smart\x20clip\x20failed');
}
export class SmartClipJobError extends Error {
  constructor(
    _0x936b1e,
    { code: code = 'smart_clip_failed', stage: stage = 'unknown', jobId: jobId = '' } = {},
  ) {
    (super(String(_0x936b1e || 'Smart clip failed')),
      (this['name'] = 'SmartClipJobError'),
      (this['code'] = code),
      (this['stage'] = stage),
      (this['jobId'] = String(jobId || '')));
  }
}
export function normalizeSmartClipMaxSegments(_0x6ed87b) {
  const _0x1a630e = Number(_0x6ed87b),
    _0xaa5af6 = Number['isFinite'](_0x1a630e) ? Math['round'](_0x1a630e) : SMART_CLIP_DEFAULT_SEGMENTS;
  return Math['max'](SMART_CLIP_MIN_SEGMENTS, Math['min'](SMART_CLIP_MAX_SEGMENTS, _0xaa5af6));
}
export function normalizeSmartClipFps(_0x2d0418) {
  const _0x4398c5 = Number(_0x2d0418),
    _0x10e674 = Number['isFinite'](_0x4398c5) ? Math['round'](_0x4398c5) : SMART_CLIP_DEFAULT_FPS;
  return SMART_CLIP_FPS_OPTIONS['includes'](_0x10e674) ? _0x10e674 : SMART_CLIP_DEFAULT_FPS;
}
export function normalizeSmartClipMaxSegmentDuration(_0x514823) {
  if (_0x514823 === undefined || _0x514823 === null || _0x514823 === '') return 0x0;
  const _0x326d11 = Number(_0x514823);
  if (!Number['isFinite'](_0x326d11) || _0x326d11 <= 0x0) return 0x0;
  return Math['max'](0x1, Math['min'](SMART_CLIP_MAX_SEGMENT_DURATION_SECONDS, _0x326d11));
}
export function normalizeSmartClipOutputMode(_0x41068a) {
  const _0x5e0ca2 = String(_0x41068a || '')['trim']();
  if (_0x5e0ca2 === SMART_CLIP_OUTPUT_MODE_ANALYSIS) return SMART_CLIP_OUTPUT_MODE_ANALYSIS;
  return _0x5e0ca2 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    ? SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    : SMART_CLIP_DEFAULT_OUTPUT_MODE;
}
export function normalizeSmartClipMode(_0xed7da3) {
  const _0x4fb7f0 = String(_0xed7da3 || '')
    ['trim']()
    ['toLowerCase']();
  return SMART_CLIP_MODE_OPTIONS['includes'](_0x4fb7f0) ? _0x4fb7f0 : 'stable';
}
export function normalizeSmartClipRunOptions(_0x1d5571 = {}) {
  const _0x3e493f = _0x1d5571 && typeof _0x1d5571 === 'object' ? _0x1d5571 : {};
  return {
    mode: normalizeSmartClipMode(_0x3e493f['mode']),
    ...(_0x3e493f['unlimitedSegments'] === !![]
      ? { unlimitedSegments: !![] }
      : { maxSegments: normalizeSmartClipMaxSegments(_0x3e493f['maxSegments']) }),
    fps: normalizeSmartClipFps(_0x3e493f['fps']),
    outputMode: normalizeSmartClipOutputMode(_0x3e493f['outputMode']),
    ...(String(_0x3e493f['keyframeSelectionPolicy'] || '')
      ['trim']()
      ['toLowerCase']() === SMART_CLIP_KEYFRAME_SELECTION_POLICY_PERSON
      ? { keyframeSelectionPolicy: SMART_CLIP_KEYFRAME_SELECTION_POLICY_PERSON }
      : {}),
    ...(_0x3e493f['preserveWholeVideo'] === !![] ? { preserveWholeVideo: !![] } : {}),
    ...(normalizeSmartClipMaxSegmentDuration(_0x3e493f['maxSegmentDurationSec']) > 0x0
      ? { maxSegmentDurationSec: normalizeSmartClipMaxSegmentDuration(_0x3e493f['maxSegmentDurationSec']) }
      : {}),
  };
}
function emitProgress(_0x1aa1e3, _0x32f0ec) {
  if (typeof _0x1aa1e3 !== 'function') return;
  try {
    _0x1aa1e3(_0x32f0ec);
  } catch {}
}
function isCancelled(_0x351d21, _0x3679b8) {
  return _0x351d21?.['aborted'] === !![] || (typeof _0x3679b8 === 'function' && _0x3679b8() === ![]);
}
function throwIfCancelled(_0x15ee80, _0x152a3a, _0xa50e93 = '') {
  if (!isCancelled(_0x15ee80, _0x152a3a)) return;
  throw new SmartClipJobError('Smart clip cancelled', {
    code: 'cancelled',
    stage: 'cancelled',
    jobId: _0xa50e93,
  });
}
function waitForNextPoll(_0x2c9397, _0x454fdf) {
  const _0x4e12ff = Math['max'](0x0, Number(_0x2c9397) || 0x0);
  if (_0x4e12ff <= 0x0) return Promise['resolve']();
  return new Promise((_0x4b7698, _0x2f51e3) => {
    let _0x177023 = ![];
    const _0x19c337 = (_0x2392e5) => {
        if (_0x177023) return;
        ((_0x177023 = !![]), _0x454fdf?.['removeEventListener']?.('abort', _0x2a62f0), _0x2392e5());
      },
      _0x3abe53 = setTimeout(() => _0x19c337(_0x4b7698), _0x4e12ff),
      _0x2a62f0 = () => {
        (clearTimeout(_0x3abe53),
          _0x19c337(() =>
            _0x2f51e3(
              new SmartClipJobError('Smart clip cancelled', { code: 'cancelled', stage: 'cancelled' }),
            ),
          ));
      };
    if (_0x454fdf?.['aborted']) _0x2a62f0();
    else _0x454fdf?.['addEventListener']?.('abort', _0x2a62f0, { once: !![] });
  });
}
function readResponseData(_0x55d3bf) {
  if (
    _0x55d3bf &&
    typeof _0x55d3bf === 'object' &&
    Object['prototype']['hasOwnProperty']['call'](_0x55d3bf, 'data')
  )
    return _0x55d3bf['data'];
  return _0x55d3bf;
}
export async function runSmartClipJob({
  src: _0x7738fa,
  options: _0x1d1609,
  onProgress: _0x37dd9f,
  shouldContinue: _0x167e17,
  signal: _0x32cadd,
  request: request = requester,
  pollIntervalMs: pollIntervalMs = SMART_CLIP_STATUS_POLL_INTERVAL_MS,
  wait: wait = waitForNextPoll,
} = {}) {
  const _0x11d554 = String(_0x7738fa || '')['trim']();
  if (!_0x11d554)
    throw new SmartClipJobError('Missing smart clip source', { code: 'invalid_source', stage: 'prepare' });
  if (typeof request !== 'function') throw new TypeError('Smart clip request function is required');
  const _0x57bb9d = normalizeSmartClipRunOptions(_0x1d1609);
  throwIfCancelled(_0x32cadd, _0x167e17);
  let _0x4e0913;
  try {
    _0x4e0913 = await request({
      url: '/api/v2/video/smart_clip',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify']({ src: _0x11d554, options: _0x57bb9d }),
      allow404Null: !![],
      returnMeta: !![],
      signal: _0x32cadd,
    });
  } catch (_0xd6dccf) {
    if (_0x32cadd?.['aborted'] || _0xd6dccf?.['code'] === 'cancelled')
      throw new SmartClipJobError('Smart clip cancelled', { code: 'cancelled', stage: 'cancelled' });
    throw new SmartClipJobError(toErrorMessage(_0xd6dccf, 'Smart clip start failed'), {
      code: 'start_failed',
      stage: 'start',
    });
  }
  if (_0x4e0913?.['status'] === 0x194 || readResponseData(_0x4e0913) == null)
    throw new SmartClipJobError('Smart clip endpoint unavailable', {
      code: 'endpoint_unavailable',
      stage: 'start',
    });
  const _0x2eec21 = readResponseData(_0x4e0913) || {};
  if (!_0x2eec21['success'])
    throw new SmartClipJobError(_0x2eec21['error'] || 'Smart\x20clip\x20start\x20failed', {
      code: 'start_failed',
      stage: 'start',
    });
  const _0x51ba99 = String(_0x2eec21['jobId'] || '')['trim']();
  if (!_0x51ba99)
    throw new SmartClipJobError('Smart\x20clip\x20start\x20response\x20is\x20missing\x20jobId', {
      code: 'missing_job_id',
      stage: 'start',
    });
  for (;;) {
    throwIfCancelled(_0x32cadd, _0x167e17, _0x51ba99);
    let _0x5cf457;
    try {
      _0x5cf457 = await request({
        url: '/api/v2/video/smart_clip/status?jobId=' + encodeURIComponent(_0x51ba99),
        method: 'GET',
        provider: 'local',
        timeout: 0x4e20,
        returnMeta: !![],
        signal: _0x32cadd,
      });
    } catch (_0xeaaa21) {
      if (_0x32cadd?.['aborted'] || _0xeaaa21?.['code'] === 'cancelled')
        throw new SmartClipJobError('Smart clip cancelled', {
          code: 'cancelled',
          stage: 'cancelled',
          jobId: _0x51ba99,
        });
      throw new SmartClipJobError(toErrorMessage(_0xeaaa21, 'Smart clip status failed'), {
        code: 'status_failed',
        stage: 'status',
        jobId: _0x51ba99,
      });
    }
    const _0x2ea371 = readResponseData(_0x5cf457) || {};
    emitProgress(_0x37dd9f, {
      ..._0x2ea371,
      jobId: _0x51ba99,
      outputMode: normalizeSmartClipOutputMode(_0x2ea371['outputMode'] || _0x57bb9d['outputMode']),
    });
    if (_0x2ea371['status'] === 'error' || _0x2ea371['status'] === 'failed')
      throw new SmartClipJobError(_0x2ea371['error'] || 'Smart clip job failed', {
        code: 'job_failed',
        stage: String(_0x2ea371['stage'] || 'processing'),
        jobId: _0x51ba99,
      });
    if (_0x2ea371['status'] === 'cancelled')
      throw new SmartClipJobError(_0x2ea371['error'] || 'Smart clip cancelled', {
        code: 'cancelled',
        stage: String(_0x2ea371['stage'] || 'cancelled'),
        jobId: _0x51ba99,
      });
    if (_0x2ea371['status'] === 'done' || _0x2ea371['status'] === 'complete')
      return {
        jobId: _0x51ba99,
        outputMode: normalizeSmartClipOutputMode(_0x2ea371['outputMode'] || _0x57bb9d['outputMode']),
        segments: Array['isArray'](_0x2ea371['segments']) ? _0x2ea371['segments'] : [],
        job: _0x2ea371,
      };
    try {
      await wait(pollIntervalMs, _0x32cadd);
    } catch (_0x5c8ed8) {
      if (_0x32cadd?.['aborted'] || _0x5c8ed8?.['code'] === 'cancelled')
        throw new SmartClipJobError('Smart clip cancelled', {
          code: 'cancelled',
          stage: 'cancelled',
          jobId: _0x51ba99,
        });
      throw _0x5c8ed8;
    }
  }
}
