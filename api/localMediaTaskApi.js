import { waitForStoryClipTask } from './storyClipTaskWait.js';
import { waitForExactMediaTask } from './mediaTaskWait.js';
import appStore from '../src/core/stores/appStore.js';
import {
  captureMediaTaskCanvasScope,
  isMediaTaskCanvasCurrent,
  registerMediaTaskCanvasScope,
  releaseMediaTaskCanvasScope,
} from '../src/modules/mediaTaskCanvasScope.js';
import { logDiagnosticEvent } from '../src/services/diagnosticsService.js';
import { normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { requester } from './requester.js';
const DIAGNOSTIC_SRC_TAIL_LENGTH = 96,
  SOURCE_REQUIRED_KINDS = new Set([
    'audioCut',
    'audioWaveform',
    'audioVoiceAnalyze',
    'audioVoiceCompose',
    'videoAudioSeparate',
    'videoAudioMux',
    'videoCut',
    'mediaClipExport',
    'storySequenceExport',
    'videoFirstFrame',
    'videoPoster',
    'videoReverse',
    'videoToGif',
  ]),
  MULTI_SOURCE_KINDS = new Set(['videoCompose', 'audioCompose']);
function toMessage(error2, value = 'Media task failed') {
  if (typeof error2 === 'string') return error2;
  if (error2?.message) return String(error2.message);
  return String(error2 || value);
}
function normalizeDiagnosticSrc(item) {
  const key = String(item || '').trim();
  return key;
}
function digestDiagnosticSrc(index) {
  const list = normalizeDiagnosticSrc(index);
  if (!list) return '';
  let data = 0x811c9dc5;
  for (let options = 0; options < list.length; options += 1) {
    ((data ^= list.charCodeAt(options)), (data = Math.imul(data, 0x1000193) >>> 0));
  }
  return data.toString(16).padStart(8, '0');
}
function summarizeDiagnosticSrc(target) {
  const srcLength = normalizeDiagnosticSrc(target),
    source = srcLength.replace(/\\/g, '/'),
    list2 = source.split('/').filter(Boolean),
    srcTail = list2.length > 2 ? list2.slice(-2).join('/') : list2.join('/') || source;
  return {
    srcDigest: digestDiagnosticSrc(srcLength),
    srcTail: srcTail ? srcTail.slice(-DIAGNOSTIC_SRC_TAIL_LENGTH) : '',
    srcLength: srcLength.length,
  };
}
function firstDefined(...args) {
  for (const next of args) {
    if (next !== undefined && next !== null) return next;
  }
  return '';
}
function normalizePayloadSrcs(options2 = {}) {
  return Array.isArray(options2?.srcs)
    ? options2.srcs
    : Array.isArray(options2?.args?.srcs)
      ? options2.args.srcs
      : [];
}
function normalizePayloadAudioClipSources(options3 = {}) {
  const list3 = Array.isArray(options3?.args?.audioClips)
    ? options3.args.audioClips
    : Array.isArray(options3?.audioClips)
      ? options3.audioClips
      : [];
  return list3.map((item2) => firstDefined(item2?.src, item2?.sourceKey, item2?.localPath, item2?.path));
}
function normalizePayloadAudioVoiceClipSources(options3 = {}) {
  const list3 = Array.isArray(options3?.args?.clips)
    ? options3.args.clips
    : Array.isArray(options3?.clips)
      ? options3.clips
      : [];
  return list3.map((item2) => firstDefined(item2?.src, item2?.localPath, item2?.path, item2?.audioUrl));
}
function normalizeVirtualMediaSource(current) {
  return normalizeLocalPath(current);
}
function isValidMediaTaskSource(entry) {
  return !!normalizeVirtualMediaSource(entry);
}
function getPayloadSources(options4 = {}, record = undefined) {
  const srcsCount = normalizePayloadSrcs(options4),
    payload =
      record !== undefined
        ? record
        : firstDefined(options4?.src, options4?.originalLocalPath, options4?.localPath, srcsCount[0]);
  return { ...summarizeDiagnosticSrc(payload), srcsCount: srcsCount.length };
}
function validateMediaTaskSources(options5 = {}) {
  const handle = String(options5?.kind || '').trim(),
    value2 = normalizePayloadSrcs(options5),
    state = MULTI_SOURCE_KINDS.has(handle) || value2.length > 0;
  if (state) {
    const config =
      handle === 'videoCompose' && options5?.args?.includeAudio === false
        ? 1
        : MULTI_SOURCE_KINDS.has(handle)
          ? 2
          : 1;
    if (value2.length < config) return { index: 0, value: '', reason: 'missing' };
    for (let index2 = 0; index2 < value2.length; index2 += 1) {
      if (!isValidMediaTaskSource(value2[index2]))
        return { index: index2, value: value2[index2], reason: 'invalid' };
    }
    return null;
  }
  const value3 = firstDefined(options5?.src, options5?.originalLocalPath, options5?.localPath),
    enabled =
      options5?.src !== undefined ||
      options5?.originalLocalPath !== undefined ||
      options5?.localPath !== undefined;
  if (!SOURCE_REQUIRED_KINDS.has(handle) && !enabled) return null;
  if (!isValidMediaTaskSource(value3))
    return { index: 0, value: value3, reason: normalizeDiagnosticSrc(value3) ? 'invalid' : 'missing' };
  if (handle === 'mediaClipExport') {
    const value4 = firstDefined(options5?.args?.audioSrc, options5?.audioSrc),
      scope = options5?.args?.audioSrc !== undefined || options5?.audioSrc !== undefined;
    if (scope && !isValidMediaTaskSource(value4))
      return {
        index: 1,
        value: value4,
        reason: normalizeDiagnosticSrc(value4) ? 'invalid' : 'missing',
      };
    const value5 = normalizePayloadAudioClipSources(options5);
    for (let index3 = 0; index3 < value5.length; index3 += 1) {
      if (!isValidMediaTaskSource(value5[index3]))
        return {
          index: index3 + 1,
          value: value5[index3],
          reason: normalizeDiagnosticSrc(value5[index3]) ? 'invalid' : 'missing',
        };
    }
  }
  if (handle === 'videoAudioMux') {
    const value6 = firstDefined(options5?.args?.audioSrc, options5?.audioSrc);
    if (!isValidMediaTaskSource(value6))
      return {
        index: 1,
        value: value6,
        reason: normalizeDiagnosticSrc(value6) ? 'invalid' : 'missing',
      };
  }
  if (handle === 'audioVoiceCompose') {
    const value7 = normalizePayloadAudioVoiceClipSources(options5);
    if (value7.length <= 0) return { index: 1, value: '', reason: 'missing' };
    for (let index4 = 0; index4 < value7.length; index4 += 1) {
      if (!isValidMediaTaskSource(value7[index4]))
        return {
          index: index4 + 1,
          value: value7[index4],
          reason: normalizeDiagnosticSrc(value7[index4]) ? 'invalid' : 'missing',
        };
    }
  }
  return null;
}
function buildDiagnosticContext(options6 = {}, response = {}) {
  const srcDigest = getPayloadSources(options6, response.sourceValue),
    input = {
      taskId: String(response.taskId || options6?.taskId || ''),
      kind: String(response.kind || options6?.kind || ''),
      nodeId: String(response.nodeId || options6?.nodeId || ''),
      assetId: String(response.assetId || options6?.assetId || ''),
      srcDigest: srcDigest.srcDigest,
      srcTail: srcDigest.srcTail,
      srcLength: srcDigest.srcLength,
      srcsCount: srcDigest.srcsCount,
      status: String(response.status || ''),
      error: toMessage(response.error || ''),
    },
    output = Number(response.invalidSourceIndex);
  return (Number.isFinite(output) && (input.invalidSourceIndex = output), input);
}
function logMediaTaskFailure(type, value8 = {}, response2 = {}) {
  void logDiagnosticEvent({
    type: type,
    level: 'error',
    source: 'renderer',
    message: toMessage(response2.error || response2.status || type),
    context: buildDiagnosticContext(value8, response2),
  });
}
function getMediaTaskBridge() {
  const value9 = globalThis.window?.electronAPI?.mediaTask;
  if (
    typeof value9?.enqueue === 'function' &&
    typeof value9?.cancel === 'function' &&
    typeof value9?.onUpdate === 'function'
  )
    return value9;
  return null;
}
export function canUseElectronMediaTask() {
  return !!getMediaTaskBridge();
}
export function waitForElectronMediaTask(
  value10,
  { timeout: timeout = 0, diagnosticPayload: diagnosticPayload = {} } = {},
) {
  const mediaTaskBridge = getMediaTaskBridge(),
    taskId = String(value10 || '').trim();
  if (!mediaTaskBridge || !taskId) {
    const error3 = new Error('Electron media task API unavailable');
    return (
      logMediaTaskFailure('media_task.wait_failed', diagnosticPayload, {
        taskId: taskId,
        status: !mediaTaskBridge ? 'bridge_unavailable' : 'missing_task_id',
        error: error3,
      }),
      Promise.reject(error3)
    );
  }
  return waitForExactMediaTask(mediaTaskBridge, taskId, {
    timeout,
    onFailure: (failure) => logMediaTaskFailure('media_task.wait_failed', diagnosticPayload, failure),
  });
}
export async function enqueueElectronMediaTask(args2 = {}, args3 = {}) {
  const mediaTaskBridge2 = getMediaTaskBridge();
  if (!mediaTaskBridge2) return null;
  const invalidSourceIndex = validateMediaTaskSources(args2);
  if (invalidSourceIndex) {
    const error4 = new Error(
      invalidSourceIndex.reason === 'missing' ? 'Missing media source path' : 'Invalid media source path',
    );
    logMediaTaskFailure('media_task.enqueue_invalid_source', args2, {
      status: 'invalid_source',
      error: error4,
      invalidSourceIndex: invalidSourceIndex.index,
      sourceValue: invalidSourceIndex.value,
    });
    throw error4;
  }
  // Reserve before IPC: the host can emit waiting/complete before enqueue replies.
  // No task is retried if its ID is already known or the host reply is uncertain.
  const taskId2 =
    String(args2?.taskId || '').trim() ||
    `renderer-media-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const captureMediaTaskCanvasScope2 = captureMediaTaskCanvasScope(appStore, globalThis.window);
  if (args3.wait === true && !captureMediaTaskCanvasScope2?.canvasId) {
    throw new Error('No active canvas for the media result; task not started');
  }
  registerMediaTaskCanvasScope(taskId2, captureMediaTaskCanvasScope2);
  let initial;
  try {
    initial = await mediaTaskBridge2.enqueue({ ...args2, taskId: taskId2 });
  } catch (error5) {
    releaseMediaTaskCanvasScope(taskId2);
    logMediaTaskFailure('media_task.enqueue_failed', args2, {
      taskId: taskId2,
      status: 'enqueue_failed',
      error: error5,
    });
    throw error5;
  }
  if (initial?.taskId !== taskId2) {
    releaseMediaTaskCanvasScope(taskId2);
    const error = new Error('Media task identity not confirmed; check the task center before retrying');
    logMediaTaskFailure('media_task.enqueue_identity_mismatch', args2, {
      taskId: taskId2,
      status: 'identity_mismatch',
      error,
    });
    throw error;
  }
  if (args3.wait === true) {
    const result =
      args2.kind === 'storySequenceExport'
        ? await waitForStoryClipTask(mediaTaskBridge2, taskId2, { ...args3, initial: initial })
        : await waitForElectronMediaTask(taskId2, {
            ...args3,
            diagnosticPayload: { ...args2, taskId: taskId2 },
          });
    if (!isMediaTaskCanvasCurrent(captureMediaTaskCanvasScope2, appStore, globalThis.window)) {
      throw new Error(
        'Media task completed after the canvas changed; result not returned for automatic writeback. Check the task center; do not blindly retry.',
      );
    }
    return result;
  }
  return initial;
}
export async function cancelElectronMediaTask(taskId3) {
  const mediaTaskBridge3 = getMediaTaskBridge();
  if (!mediaTaskBridge3) return { ok: false, error: 'Electron media task API unavailable' };
  return await mediaTaskBridge3.cancel({ taskId: taskId3 });
}
function buildBackendBodyFromElectronPayload(src = {}) {
  const value11 = String(src?.kind || '').trim(),
    start = src?.args || {};
  if (value11 === 'audioCut')
    return {
      src: src.src,
      start: start.start ?? src.start,
      end: start.end ?? src.end,
    };
  return {
    src: src.src,
    start: start.videoStart ?? start.start ?? src.videoStart ?? src.start,
    end: start.videoEnd ?? start.end ?? src.videoEnd ?? src.end,
    audioSrc: start.audioSrc ?? src.audioSrc,
    audioStart: start.audioStart ?? src.audioStart,
    audioEnd: start.audioEnd ?? src.audioEnd,
    fps: start.fps ?? src.fps,
  };
}
export async function runLocalMediaClipExport(options7 = {}, value12 = {}) {
  const value13 = options7?.electronPayload || options7,
    url = options7?.outputType === 'audio' || value13?.kind === 'audioCut' ? 'audio' : 'video',
    timeout2 = Number(value12.timeout || 0) || 600000;
  if (value13.kind === 'storySequenceExport') {
    if (!canUseElectronMediaTask() || typeof getMediaTaskBridge()?.list !== 'function')
      throw new Error('镜头初剪渲染需要更新后的桌面媒体任务接口；不回退到浏览器后端');
    try {
      return await enqueueElectronMediaTask(value13, { wait: true, timeout: timeout2 });
    } catch (error) {
      if (String(error?.message || error).includes('Unsupported media task kind'))
        throw new Error('当前桌面进程尚未加载镜头初剪处理器，请更新并重启对应桌面端；未回退渲染');
      throw error;
    }
  }
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(value13, { wait: true, timeout: timeout2 });
  const value14 = options7?.backendBody || buildBackendBodyFromElectronPayload(value13),
    requester2 = await requester({
      url: url === 'audio' ? '/api/v2/audio/cut' : '/api/v2/video/clip_export',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value14),
      timeout: timeout2,
      allow404Null: true,
      returnMeta: true,
    });
  if (!requester2?.data) throw new Error('Local media clip export API unavailable');
  return requester2.data;
}

const TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']);

export async function listElectronMediaTasks(options8 = {}) {
  const mediaTaskBridge4 = getMediaTaskBridge();
  if (!mediaTaskBridge4) return { tasks: [] };
  return await mediaTaskBridge4.list(options8);
}
