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
function toErrorMessage(error, value) {
  return String(error?.['message'] || error || value || 'Smart\x20clip\x20failed');
}
export class SmartClipJobError extends Error {
  constructor(item, { code: code = 'smart_clip_failed', stage: stage = 'unknown', jobId: jobId = '' } = {}) {
    (super(String(item || 'Smart clip failed')),
      (this['name'] = 'SmartClipJobError'),
      (this['code'] = code),
      (this['stage'] = stage),
      (this['jobId'] = String(jobId || '')));
  }
}
export function normalizeSmartClipMaxSegments(key) {
  const index = Number(key),
    result = Number['isFinite'](index) ? Math['round'](index) : SMART_CLIP_DEFAULT_SEGMENTS;
  return Math['max'](SMART_CLIP_MIN_SEGMENTS, Math['min'](SMART_CLIP_MAX_SEGMENTS, result));
}
export function normalizeSmartClipFps(data) {
  const options = Number(data),
    target = Number['isFinite'](options) ? Math['round'](options) : SMART_CLIP_DEFAULT_FPS;
  return SMART_CLIP_FPS_OPTIONS['includes'](target) ? target : SMART_CLIP_DEFAULT_FPS;
}
export function normalizeSmartClipMaxSegmentDuration(source) {
  if (source === undefined || source === null || source === '') return 0x0;
  const count = Number(source);
  if (!Number['isFinite'](count) || count <= 0x0) return 0x0;
  return Math['max'](0x1, Math['min'](SMART_CLIP_MAX_SEGMENT_DURATION_SECONDS, count));
}
export function normalizeSmartClipOutputMode(next) {
  const current = String(next || '')['trim']();
  if (current === SMART_CLIP_OUTPUT_MODE_ANALYSIS) return SMART_CLIP_OUTPUT_MODE_ANALYSIS;
  return current === SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    ? SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    : SMART_CLIP_DEFAULT_OUTPUT_MODE;
}
export function normalizeSmartClipMode(entry) {
  const record = String(entry || '')
    ['trim']()
    ['toLowerCase']();
  return SMART_CLIP_MODE_OPTIONS['includes'](record) ? record : 'stable';
}
export function normalizeSmartClipRunOptions(options2 = {}) {
  const payload = options2 && typeof options2 === 'object' ? options2 : {};
  return {
    mode: normalizeSmartClipMode(payload['mode']),
    ...(payload['unlimitedSegments'] === !![]
      ? { unlimitedSegments: !![] }
      : { maxSegments: normalizeSmartClipMaxSegments(payload['maxSegments']) }),
    fps: normalizeSmartClipFps(payload['fps']),
    outputMode: normalizeSmartClipOutputMode(payload['outputMode']),
    ...(String(payload['keyframeSelectionPolicy'] || '')
      ['trim']()
      ['toLowerCase']() === SMART_CLIP_KEYFRAME_SELECTION_POLICY_PERSON
      ? { keyframeSelectionPolicy: SMART_CLIP_KEYFRAME_SELECTION_POLICY_PERSON }
      : {}),
    ...(payload['preserveWholeVideo'] === !![] ? { preserveWholeVideo: !![] } : {}),
    ...(normalizeSmartClipMaxSegmentDuration(payload['maxSegmentDurationSec']) > 0x0
      ? { maxSegmentDurationSec: normalizeSmartClipMaxSegmentDuration(payload['maxSegmentDurationSec']) }
      : {}),
  };
}
function emitProgress(handler, handle) {
  if (typeof handler !== 'function') return;
  try {
    handler(handle);
  } catch {}
}
function isCancelled(state, handler2) {
  return state?.['aborted'] === !![] || (typeof handler2 === 'function' && handler2() === ![]);
}
function throwIfCancelled(config, scope, jobId2 = '') {
  if (!isCancelled(config, scope)) return;
  throw new SmartClipJobError('Smart clip cancelled', {
    code: 'cancelled',
    stage: 'cancelled',
    jobId: jobId2,
  });
}
function waitForNextPoll(input, el) {
  const count2 = Math['max'](0x0, Number(input) || 0x0);
  if (count2 <= 0x0) return Promise['resolve']();
  return new Promise((output, handler3) => {
    let value2 = ![];
    const run = (handler4) => {
        if (value2) return;
        ((value2 = !![]), el?.['removeEventListener']?.('abort', handler5), handler4());
      },
      setTimeout2 = setTimeout(() => run(output), count2),
      handler5 = () => {
        (clearTimeout(setTimeout2),
          run(() =>
            handler3(
              new SmartClipJobError('Smart clip cancelled', { code: 'cancelled', stage: 'cancelled' }),
            ),
          ));
      };
    if (el?.['aborted']) handler5();
    else el?.['addEventListener']?.('abort', handler5, { once: !![] });
  });
}
function readResponseData(value3) {
  if (value3 && typeof value3 === 'object' && Object['prototype']['hasOwnProperty']['call'](value3, 'data'))
    return value3['data'];
  return value3;
}
export async function runSmartClipJob({
  src: src,
  options: options3,
  onProgress: onProgress,
  shouldContinue: shouldContinue,
  signal: signal,
  request: request = requester,
  pollIntervalMs: pollIntervalMs = SMART_CLIP_STATUS_POLL_INTERVAL_MS,
  wait: wait = waitForNextPoll,
} = {}) {
  const src2 = String(src || '')['trim']();
  if (!src2)
    throw new SmartClipJobError('Missing smart clip source', { code: 'invalid_source', stage: 'prepare' });
  if (typeof request !== 'function') throw new TypeError('Smart clip request function is required');
  const options4 = normalizeSmartClipRunOptions(options3);
  throwIfCancelled(signal, shouldContinue);
  let response;
  try {
    response = await request({
      url: '/api/v2/video/smart_clip',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify']({ src: src2, options: options4 }),
      allow404Null: !![],
      returnMeta: !![],
      signal: signal,
    });
  } catch (value4) {
    if (signal?.['aborted'] || value4?.['code'] === 'cancelled')
      throw new SmartClipJobError('Smart clip cancelled', { code: 'cancelled', stage: 'cancelled' });
    throw new SmartClipJobError(toErrorMessage(value4, 'Smart clip start failed'), {
      code: 'start_failed',
      stage: 'start',
    });
  }
  if (response?.['status'] === 0x194 || readResponseData(response) == null)
    throw new SmartClipJobError('Smart clip endpoint unavailable', {
      code: 'endpoint_unavailable',
      stage: 'start',
    });
  const response2 = readResponseData(response) || {};
  if (!response2['success'])
    throw new SmartClipJobError(response2['error'] || 'Smart\x20clip\x20start\x20failed', {
      code: 'start_failed',
      stage: 'start',
    });
  const jobId3 = String(response2['jobId'] || '')['trim']();
  if (!jobId3)
    throw new SmartClipJobError('Smart\x20clip\x20start\x20response\x20is\x20missing\x20jobId', {
      code: 'missing_job_id',
      stage: 'start',
    });
  for (;;) {
    throwIfCancelled(signal, shouldContinue, jobId3);
    let request2;
    try {
      request2 = await request({
        url: '/api/v2/video/smart_clip/status?jobId=' + encodeURIComponent(jobId3),
        method: 'GET',
        provider: 'local',
        timeout: 0x4e20,
        returnMeta: !![],
        signal: signal,
      });
    } catch (value5) {
      if (signal?.['aborted'] || value5?.['code'] === 'cancelled')
        throw new SmartClipJobError('Smart clip cancelled', {
          code: 'cancelled',
          stage: 'cancelled',
          jobId: jobId3,
        });
      throw new SmartClipJobError(toErrorMessage(value5, 'Smart clip status failed'), {
        code: 'status_failed',
        stage: 'status',
        jobId: jobId3,
      });
    }
    const job = readResponseData(request2) || {};
    emitProgress(onProgress, {
      ...job,
      jobId: jobId3,
      outputMode: normalizeSmartClipOutputMode(job['outputMode'] || options4['outputMode']),
    });
    if (job['status'] === 'error' || job['status'] === 'failed')
      throw new SmartClipJobError(job['error'] || 'Smart clip job failed', {
        code: 'job_failed',
        stage: String(job['stage'] || 'processing'),
        jobId: jobId3,
      });
    if (job['status'] === 'cancelled')
      throw new SmartClipJobError(job['error'] || 'Smart clip cancelled', {
        code: 'cancelled',
        stage: String(job['stage'] || 'cancelled'),
        jobId: jobId3,
      });
    if (job['status'] === 'done' || job['status'] === 'complete')
      return {
        jobId: jobId3,
        outputMode: normalizeSmartClipOutputMode(job['outputMode'] || options4['outputMode']),
        segments: Array['isArray'](job['segments']) ? job['segments'] : [],
        job: job,
      };
    try {
      await wait(pollIntervalMs, signal);
    } catch (value6) {
      if (signal?.['aborted'] || value6?.['code'] === 'cancelled')
        throw new SmartClipJobError('Smart clip cancelled', {
          code: 'cancelled',
          stage: 'cancelled',
          jobId: jobId3,
        });
      throw value6;
    }
  }
}
