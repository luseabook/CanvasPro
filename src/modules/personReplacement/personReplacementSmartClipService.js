import {
  SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
  SmartClipJobError,
  normalizeSmartClipRunOptions,
  runSmartClipJob,
} from '../../services/smartClipJobService.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
const TIMELINE_MATCH_TOLERANCE_SEC = 0.15;
function toFiniteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function toPositiveIndex(index) {
  const count = Number(index);
  if (!Number['isFinite'](count) || count < 1) return 0;
  return Math['trunc'](count);
}
function serializeStageError(error, result) {
  return {
    stage: String(error?.['stage'] || result || 'unknown'),
    code: String(error?.['code'] || 'smart_clip_failed'),
    message: String(error?.['message'] || error || 'Smart clip failed'),
    jobId: String(error?.['jobId'] || ''),
  };
}
function normalizeSegment(data, sourcePosition) {
  const personDetection = data && typeof data === 'object' ? data : {},
    start2 = Math['max'](0, toFiniteNumber(personDetection['start'], 0)),
    count2 = Math['max'](0, toFiniteNumber(personDetection['duration'], 0)),
    toFiniteNumber2 = toFiniteNumber(personDetection['end'], start2 + count2),
    end2 = Math['max'](start2, toFiniteNumber2),
    duration2 = count2 > 0 ? count2 : Math['max'](0, end2 - start2),
    ref = pickResultLocalPath(personDetection);
  return {
    sourceIndex: toPositiveIndex(personDetection['index']),
    sourcePosition: sourcePosition,
    start: start2,
    end: end2 > start2 ? end2 : start2 + duration2,
    duration: duration2,
    fps: Math['max'](0, toFiniteNumber(personDetection['fps'], 0)),
    keyframeIndex: Math['max'](0, Math['trunc'](toFiniteNumber(personDetection['keyframeIndex'], 0))),
    keyframeTimeSec: Math['max'](start2, toFiniteNumber(personDetection['keyframeTimeSec'], start2)),
    personDetection:
      personDetection['personDetection'] && typeof personDetection['personDetection'] === 'object'
        ? personDetection['personDetection']
        : null,
    personFound: personDetection['personFound'] === true,
    keyframeSelectionPolicy: String(personDetection['keyframeSelectionPolicy'] || ''),
    ref: ref,
    url: localPathToUrl(ref),
    fileName: String(personDetection['fileName'] || ''),
  };
}
export function normalizePersonReplacementSmartClipSegments(options) {
  const list = (Array['isArray'](options) ? options : [])
      ['map']((target, source) => normalizeSegment(target, source))
      ['sort'](
        (next, current) =>
          next['start'] - current['start'] ||
          next['end'] - current['end'] ||
          next['sourceIndex'] - current['sourceIndex'] ||
          next['sourcePosition'] - current['sourcePosition'],
      ),
    map = new Set(list['map']((entry) => entry['sourceIndex'])['filter'](Boolean)),
    map2 = new Set();
  let record = 1;
  return list['map']((args) => {
    let index2 = args['sourceIndex'];
    if (!index2 || map2['has'](index2)) {
      while (map['has'](record) || map2['has'](record)) {
        record += 1;
      }
      ((index2 = record), (record += 1));
    }
    return (map2['add'](index2), { ...args, index: index2 });
  });
}
function timelineDiffers(enabled, enabled2) {
  if (!enabled || !enabled2) return false;
  return (
    Math['abs'](enabled['start'] - enabled2['start']) > TIMELINE_MATCH_TOLERANCE_SEC ||
    Math['abs'](enabled['end'] - enabled2['end']) > TIMELINE_MATCH_TOLERANCE_SEC
  );
}
function missingRefError(stage, code, message) {
  return { stage: stage, code: code, message: message, jobId: '' };
}
export function buildPersonReplacementShotBundles({
  clipSegments: clipSegments,
  keyframeSegments: keyframeSegments,
  stageErrors: stageErrors = {},
  requireClip: requireClip = true,
} = {}) {
  const list2 = normalizePersonReplacementSmartClipSegments(clipSegments),
    list3 = normalizePersonReplacementSmartClipSegments(keyframeSegments),
    map3 = new Map(list2['map']((payload) => [payload['index'], payload])),
    map4 = new Map(list3['map']((handle) => [handle['index'], handle])),
    list4 = Array['from'](new Set([...map3['keys'](), ...map4['keys']()]))['sort']((state, config) => {
      const scope = map3['get'](state) || map4['get'](state),
        input = map3['get'](config) || map4['get'](config);
      return scope['start'] - input['start'] || scope['end'] - input['end'] || state - config;
    });
  return list4['map']((sourceIndex, index3) => {
    const clipRef = map3['get'](sourceIndex) || null,
      fps = map4['get'](sourceIndex) || null,
      start3 = clipRef || fps || { start: 0, end: 0, duration: 0 },
      errors = [];
    requireClip &&
      !clipRef?.['ref'] &&
      errors['push'](
        stageErrors['videoSegments'] ||
          missingRefError('videoSegments', 'missing_clip_ref', 'Video segment output is missing'),
      );
    !fps?.['ref'] &&
      errors['push'](
        stageErrors['keyframes'] ||
          missingRefError('keyframes', 'missing_keyframe_ref', 'Keyframe output is missing'),
      );
    timelineDiffers(clipRef, fps) &&
      errors['push'](
        missingRefError('pairing', 'timeline_mismatch', 'Video segment and keyframe timelines do not match'),
      );
    const output = Boolean(clipRef?.['ref']),
      value2 = Boolean(fps?.['ref']),
      value3 = !requireClip || output,
      status =
        value3 && value2 && errors['length'] === 0 ? 'ready' : output || value2 ? 'partial' : 'failed';
    return {
      id: 'shot-' + String(index3 + 1)['padStart'](3, '0'),
      index: index3 + 1,
      sourceIndex: sourceIndex,
      start: start3['start'],
      end: start3['end'],
      duration: start3['duration'] || Math['max'](0, start3['end'] - start3['start']),
      fps: fps?.['fps'] || clipRef?.['fps'] || 0,
      keyframeIndex: fps?.['keyframeIndex'] || 0,
      keyframeTimeSec: fps?.['keyframeTimeSec'] || start3['start'],
      personDetection: fps?.['personDetection'] || null,
      personFound: fps?.['personFound'] === true,
      keyframeSelectionPolicy: fps?.['keyframeSelectionPolicy'] || '',
      clipRef: clipRef?.['ref'] || '',
      keyframeRef: fps?.['ref'] || '',
      status: status,
      errors: errors,
    };
  });
}
function normalizeSourceRef(value4) {
  const resultLocalPath = pickResultLocalPath(value4);
  return localPathToUrl(resultLocalPath);
}
function createStageSuccess(value5) {
  const status2 = Array['isArray'](value5?.['segments']) ? value5['segments'] : [];
  return {
    status: status2['length'] > 0 ? 'complete' : 'empty',
    jobId: String(value5?.['jobId'] || ''),
    count: status2['length'],
    error:
      status2['length'] > 0
        ? null
        : {
            stage: String(value5?.['outputMode'] || 'unknown'),
            code: 'no_results',
            message: 'Smart clip stage returned no results',
            jobId: String(value5?.['jobId'] || ''),
          },
  };
}
function emitProgress(handler, phase, args2) {
  if (typeof handler !== 'function') return;
  try {
    handler({ phase: phase, ...args2 });
  } catch {}
}
async function runStage({
  phase: phase2,
  src: src,
  options: options2,
  runJob: runJob2,
  onProgress: onProgress,
  shouldContinue: shouldContinue,
  signal: signal,
}) {
  try {
    const result2 = await runJob2({
      src: src,
      options: { ...options2, outputMode: phase2 },
      shouldContinue: shouldContinue,
      signal: signal,
      onProgress: (value6) => emitProgress(onProgress, phase2, value6),
    });
    return { result: result2, error: null, stage: createStageSuccess(result2) };
  } catch (value7) {
    const jobId = serializeStageError(value7, phase2);
    return {
      result: { segments: [], outputMode: phase2, jobId: jobId['jobId'] },
      error: jobId,
      stage: {
        status: jobId['code'] === 'cancelled' ? 'cancelled' : 'failed',
        jobId: jobId['jobId'],
        count: 0,
        error: jobId,
      },
    };
  }
}
export async function runPersonReplacementSmartClip({
  source: source2,
  options: options3,
  onProgress: onProgress2,
  shouldContinue: shouldContinue2,
  signal: signal2,
  runJob: runJob = runSmartClipJob,
} = {}) {
  const src2 = normalizeSourceRef(source2);
  if (!src2)
    throw new SmartClipJobError('Invalid person replacement source video', {
      code: 'invalid_source',
      stage: 'prepare',
    });
  if (typeof runJob !== 'function') throw new TypeError('Smart clip job runner is required');
  const mode = normalizeSmartClipRunOptions(options3),
    options4 = {
      mode: mode['mode'],
      ...(mode['unlimitedSegments'] === true
        ? { unlimitedSegments: true }
        : { maxSegments: mode['maxSegments'] }),
      fps: mode['fps'],
      keyframeSelectionPolicy: 'person',
      ...(mode['preserveWholeVideo'] === true ? { preserveWholeVideo: true } : {}),
    },
    keyframes = await runStage({
      phase: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
      src: src2,
      options: options4,
      runJob: runJob,
      onProgress: onProgress2,
      shouldContinue: shouldContinue2,
      signal: signal2,
    }),
    stageErrors2 = { keyframes: keyframes['error'] || keyframes['stage']['error'] },
    shotBundles = buildPersonReplacementShotBundles({
      keyframeSegments: keyframes['result']['segments'],
      stageErrors: stageErrors2,
      requireClip: false,
    }),
    value8 = keyframes['stage']['status'] !== 'complete',
    value9 = shotBundles['some']((response) => response['status'] !== 'ready'),
    enabled3 = shotBundles['some']((response2) => response2['status'] !== 'failed'),
    ok = shotBundles['length'] === 0 || !enabled3 ? 'failed' : value8 || value9 ? 'partial' : 'ready';
  return {
    ok: ok !== 'failed',
    status: ok,
    sourceRef: pickResultLocalPath(source2),
    options: options4,
    shotBundles: shotBundles,
    stages: {
      videoSegments: { status: 'deferred', jobId: '', count: 0, error: null },
      keyframes: keyframes['stage'],
    },
  };
}
