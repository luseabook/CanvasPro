import { waitForStoryClipTask } from './storyClipTaskWait.js';
import { waitForExactMediaTask } from './mediaTaskWait.js';
import appStore from '../src/core/stores/appStore.js';
import { captureMediaTaskCanvasScope, isMediaTaskCanvasCurrent, registerMediaTaskCanvasScope, releaseMediaTaskCanvasScope } from '../src/modules/mediaTaskCanvasScope.js';
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
function toMessage(_0x3359e7, _0x3fbd2d = 'Media task failed') {
  if (typeof _0x3359e7 === 'string') return _0x3359e7;
  if (_0x3359e7?.message) return String(_0x3359e7.message);
  return String(_0x3359e7 || _0x3fbd2d);
}
function normalizeDiagnosticSrc(_0x49aed6) {
  const _0x38a1c8 = String(_0x49aed6 || '').trim();
  return _0x38a1c8;
}
function digestDiagnosticSrc(_0x34d1f2) {
  const _0x27b3ad = normalizeDiagnosticSrc(_0x34d1f2);
  if (!_0x27b3ad) return '';
  let _0x5e5b8f = 0x811c9dc5;
  for (let _0x298148 = 0; _0x298148 < _0x27b3ad.length; _0x298148 += 1) {
    ((_0x5e5b8f ^= _0x27b3ad.charCodeAt(_0x298148)), (_0x5e5b8f = Math.imul(_0x5e5b8f, 0x1000193) >>> 0));
  }
  return _0x5e5b8f.toString(16).padStart(8, '0');
}
function summarizeDiagnosticSrc(_0x300316) {
  const _0x349b99 = normalizeDiagnosticSrc(_0x300316),
    _0xa51961 = _0x349b99.replace(/\\/g, '/'),
    _0x66ee1e = _0xa51961.split('/').filter(Boolean),
    _0x39b58e = _0x66ee1e.length > 2 ? _0x66ee1e.slice(-2).join('/') : _0x66ee1e.join('/') || _0xa51961;
  return {
    srcDigest: digestDiagnosticSrc(_0x349b99),
    srcTail: _0x39b58e ? _0x39b58e.slice(-DIAGNOSTIC_SRC_TAIL_LENGTH) : '',
    srcLength: _0x349b99.length,
  };
}
function firstDefined(..._0x3197d0) {
  for (const _0x103b37 of _0x3197d0) {
    if (_0x103b37 !== undefined && _0x103b37 !== null) return _0x103b37;
  }
  return '';
}
function normalizePayloadSrcs(_0x4a0024 = {}) {
  return Array.isArray(_0x4a0024?.srcs)
    ? _0x4a0024.srcs
    : Array.isArray(_0x4a0024?.args?.srcs)
      ? _0x4a0024.args.srcs
      : [];
}
function normalizePayloadAudioClipSources(_0x40a7e6 = {}) {
  const _0x4c2474 = Array.isArray(_0x40a7e6?.args?.audioClips)
    ? _0x40a7e6.args.audioClips
    : Array.isArray(_0x40a7e6?.audioClips)
      ? _0x40a7e6.audioClips
      : [];
  return _0x4c2474.map((_0x2cbda9) =>
    firstDefined(_0x2cbda9?.src, _0x2cbda9?.sourceKey, _0x2cbda9?.localPath, _0x2cbda9?.path),
  );
}
function normalizePayloadAudioVoiceClipSources(_0x40a7e6 = {}) {
  const _0x4c2474 = Array.isArray(_0x40a7e6?.args?.clips)
    ? _0x40a7e6.args.clips
    : Array.isArray(_0x40a7e6?.clips)
      ? _0x40a7e6.clips
      : [];
  return _0x4c2474.map((_0x2cbda9) =>
    firstDefined(_0x2cbda9?.src, _0x2cbda9?.localPath, _0x2cbda9?.path, _0x2cbda9?.audioUrl),
  );
}
function normalizeVirtualMediaSource(_0x3802ee) {
  return normalizeLocalPath(_0x3802ee);
}
function isValidMediaTaskSource(_0x394489) {
  return !!normalizeVirtualMediaSource(_0x394489);
}
function getPayloadSources(_0x17bd0c = {}, _0x6c5522 = undefined) {
  const _0x1a5703 = normalizePayloadSrcs(_0x17bd0c),
    _0x5d2ffb =
      _0x6c5522 !== undefined
        ? _0x6c5522
        : firstDefined(_0x17bd0c?.src, _0x17bd0c?.originalLocalPath, _0x17bd0c?.localPath, _0x1a5703[0]);
  return { ...summarizeDiagnosticSrc(_0x5d2ffb), srcsCount: _0x1a5703.length };
}
function validateMediaTaskSources(_0x590aab = {}) {
  const _0x16515f = String(_0x590aab?.kind || '').trim(),
    _0x42d46d = normalizePayloadSrcs(_0x590aab),
    _0x1cb9d8 = MULTI_SOURCE_KINDS.has(_0x16515f) || _0x42d46d.length > 0;
  if (_0x1cb9d8) {
    const _0xbeff17 =
      _0x16515f === 'videoCompose' && _0x590aab?.args?.includeAudio === false
        ? 1
        : MULTI_SOURCE_KINDS.has(_0x16515f)
          ? 2
          : 1;
    if (_0x42d46d.length < _0xbeff17) return { index: 0, value: '', reason: 'missing' };
    for (let _0x5e3175 = 0; _0x5e3175 < _0x42d46d.length; _0x5e3175 += 1) {
      if (!isValidMediaTaskSource(_0x42d46d[_0x5e3175]))
        return { index: _0x5e3175, value: _0x42d46d[_0x5e3175], reason: 'invalid' };
    }
    return null;
  }
  const _0x2d414a = firstDefined(_0x590aab?.src, _0x590aab?.originalLocalPath, _0x590aab?.localPath),
    _0x3d1bfa =
      _0x590aab?.src !== undefined ||
      _0x590aab?.originalLocalPath !== undefined ||
      _0x590aab?.localPath !== undefined;
  if (!SOURCE_REQUIRED_KINDS.has(_0x16515f) && !_0x3d1bfa) return null;
  if (!isValidMediaTaskSource(_0x2d414a))
    return { index: 0, value: _0x2d414a, reason: normalizeDiagnosticSrc(_0x2d414a) ? 'invalid' : 'missing' };
  if (_0x16515f === 'mediaClipExport') {
    const _0x386f73 = firstDefined(_0x590aab?.args?.audioSrc, _0x590aab?.audioSrc),
      _0x475064 = _0x590aab?.args?.audioSrc !== undefined || _0x590aab?.audioSrc !== undefined;
    if (_0x475064 && !isValidMediaTaskSource(_0x386f73))
      return {
        index: 1,
        value: _0x386f73,
        reason: normalizeDiagnosticSrc(_0x386f73) ? 'invalid' : 'missing',
      };
    const _0x3c18b8 = normalizePayloadAudioClipSources(_0x590aab);
    for (let _0x131226 = 0; _0x131226 < _0x3c18b8.length; _0x131226 += 1) {
      if (!isValidMediaTaskSource(_0x3c18b8[_0x131226]))
        return {
          index: _0x131226 + 1,
          value: _0x3c18b8[_0x131226],
          reason: normalizeDiagnosticSrc(_0x3c18b8[_0x131226]) ? 'invalid' : 'missing',
        };
    }
  }
  if (_0x16515f === 'videoAudioMux') {
    const _0x2b7441 = firstDefined(_0x590aab?.args?.audioSrc, _0x590aab?.audioSrc);
    if (!isValidMediaTaskSource(_0x2b7441))
      return {
        index: 1,
        value: _0x2b7441,
        reason: normalizeDiagnosticSrc(_0x2b7441) ? 'invalid' : 'missing',
      };
  }
  if (_0x16515f === 'audioVoiceCompose') {
    const _0x7bed53 = normalizePayloadAudioVoiceClipSources(_0x590aab);
    if (_0x7bed53.length <= 0) return { index: 1, value: '', reason: 'missing' };
    for (let _0x283e97 = 0; _0x283e97 < _0x7bed53.length; _0x283e97 += 1) {
      if (!isValidMediaTaskSource(_0x7bed53[_0x283e97]))
        return {
          index: _0x283e97 + 1,
          value: _0x7bed53[_0x283e97],
          reason: normalizeDiagnosticSrc(_0x7bed53[_0x283e97]) ? 'invalid' : 'missing',
        };
    }
  }
  return null;
}
function buildDiagnosticContext(_0x49e68b = {}, _0x23eb0a = {}) {
  const _0x5c5c3b = getPayloadSources(_0x49e68b, _0x23eb0a.sourceValue),
    _0x30f9f2 = {
      taskId: String(_0x23eb0a.taskId || _0x49e68b?.taskId || ''),
      kind: String(_0x23eb0a.kind || _0x49e68b?.kind || ''),
      nodeId: String(_0x23eb0a.nodeId || _0x49e68b?.nodeId || ''),
      assetId: String(_0x23eb0a.assetId || _0x49e68b?.assetId || ''),
      srcDigest: _0x5c5c3b.srcDigest,
      srcTail: _0x5c5c3b.srcTail,
      srcLength: _0x5c5c3b.srcLength,
      srcsCount: _0x5c5c3b.srcsCount,
      status: String(_0x23eb0a.status || ''),
      error: toMessage(_0x23eb0a.error || ''),
    },
    _0xcda9b8 = Number(_0x23eb0a.invalidSourceIndex);
  return (Number.isFinite(_0xcda9b8) && (_0x30f9f2.invalidSourceIndex = _0xcda9b8), _0x30f9f2);
}
function logMediaTaskFailure(_0x260839, _0xa4f4cb = {}, _0x45bafb = {}) {
  void logDiagnosticEvent({
    type: _0x260839,
    level: 'error',
    source: 'renderer',
    message: toMessage(_0x45bafb.error || _0x45bafb.status || _0x260839),
    context: buildDiagnosticContext(_0xa4f4cb, _0x45bafb),
  });
}
function getMediaTaskBridge() {
  const _0x11181b = globalThis.window?.electronAPI?.mediaTask;
  if (
    typeof _0x11181b?.enqueue === 'function' &&
    typeof _0x11181b?.cancel === 'function' &&
    typeof _0x11181b?.onUpdate === 'function'
  )
    return _0x11181b;
  return null;
}
export function canUseElectronMediaTask() {
  return !!getMediaTaskBridge();
}
export function waitForElectronMediaTask(
  _0x4de1ff,
  { timeout: timeout = 0, diagnosticPayload: diagnosticPayload = {} } = {},
) {
  const _0x1804dc = getMediaTaskBridge(),
    _0x2d107a = String(_0x4de1ff || '').trim();
  if (!_0x1804dc || !_0x2d107a) {
    const _0x499afb = new Error('Electron media task API unavailable');
    return (
      logMediaTaskFailure('media_task.wait_failed', diagnosticPayload, {
        taskId: _0x2d107a,
        status: !_0x1804dc ? 'bridge_unavailable' : 'missing_task_id',
        error: _0x499afb,
      }),
      Promise.reject(_0x499afb)
    );
  }
  return waitForExactMediaTask(_0x1804dc, _0x2d107a, {
    timeout,
    onFailure: failure => logMediaTaskFailure('media_task.wait_failed', diagnosticPayload, failure),
  });
}
export async function enqueueElectronMediaTask(_0x1852bf = {}, _0x52801d = {}) {
  const _0x3d5beb = getMediaTaskBridge();
  if (!_0x3d5beb) return null;
  const _0x3194dd = validateMediaTaskSources(_0x1852bf);
  if (_0x3194dd) {
    const _0x5a3fbf = new Error(
      _0x3194dd.reason === 'missing' ? 'Missing media source path' : 'Invalid media source path',
    );
    logMediaTaskFailure('media_task.enqueue_invalid_source', _0x1852bf, {
      status: 'invalid_source',
      error: _0x5a3fbf,
      invalidSourceIndex: _0x3194dd.index,
      sourceValue: _0x3194dd.value,
    });
    throw _0x5a3fbf;
  }
  // Reserve before IPC: the host can emit waiting/complete before enqueue replies.
  // No task is retried if its ID is already known or the host reply is uncertain.
  const _0x432dc8 = String(_0x1852bf?.taskId || '').trim() ||
    `renderer-media-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const _0x18d4ae = captureMediaTaskCanvasScope(appStore, globalThis.window);
  if (_0x52801d.wait === true && !_0x18d4ae?.canvasId) {
    throw new Error('No active canvas for the media result; task not started');
  }
  registerMediaTaskCanvasScope(_0x432dc8, _0x18d4ae);
  let _0x1de6f8;
  try {
    _0x1de6f8 = await _0x3d5beb.enqueue({ ..._0x1852bf, taskId: _0x432dc8 });
  } catch (_0x1e3539) {
    releaseMediaTaskCanvasScope(_0x432dc8);
    logMediaTaskFailure('media_task.enqueue_failed', _0x1852bf, {
      taskId: _0x432dc8,
      status: 'enqueue_failed',
      error: _0x1e3539,
    });
    throw _0x1e3539;
  }
  if (_0x1de6f8?.taskId !== _0x432dc8) {
    releaseMediaTaskCanvasScope(_0x432dc8);
    const error = new Error('Media task identity not confirmed; check the task center before retrying');
    logMediaTaskFailure('media_task.enqueue_identity_mismatch', _0x1852bf, {
      taskId: _0x432dc8, status: 'identity_mismatch', error,
    });
    throw error;
  }
  if (_0x52801d.wait === true) {
    const result = _0x1852bf.kind === 'storySequenceExport'
      ? await waitForStoryClipTask(_0x3d5beb, _0x432dc8, { ..._0x52801d, initial: _0x1de6f8 })
      : await waitForElectronMediaTask(_0x432dc8, {
          ..._0x52801d,
          diagnosticPayload: { ..._0x1852bf, taskId: _0x432dc8 },
        });
    if (!isMediaTaskCanvasCurrent(_0x18d4ae, appStore, globalThis.window)) {
      throw new Error('Media task completed after the canvas changed; result not returned for automatic writeback. Check the task center; do not blindly retry.');
    }
    return result;
  }
  return _0x1de6f8;
}
export async function cancelElectronMediaTask(_0x272795) {
  const _0x5cd525 = getMediaTaskBridge();
  if (!_0x5cd525) return { ok: false, error: 'Electron media task API unavailable' };
  return await _0x5cd525.cancel({ taskId: _0x272795 });
}
function buildBackendBodyFromElectronPayload(_0x3aee48 = {}) {
  const _0x4f9717 = String(_0x3aee48?.kind || '').trim(),
    _0x371fad = _0x3aee48?.args || {};
  if (_0x4f9717 === 'audioCut')
    return {
      src: _0x3aee48.src,
      start: _0x371fad.start ?? _0x3aee48.start,
      end: _0x371fad.end ?? _0x3aee48.end,
    };
  return {
    src: _0x3aee48.src,
    start: _0x371fad.videoStart ?? _0x371fad.start ?? _0x3aee48.videoStart ?? _0x3aee48.start,
    end: _0x371fad.videoEnd ?? _0x371fad.end ?? _0x3aee48.videoEnd ?? _0x3aee48.end,
    audioSrc: _0x371fad.audioSrc ?? _0x3aee48.audioSrc,
    audioStart: _0x371fad.audioStart ?? _0x3aee48.audioStart,
    audioEnd: _0x371fad.audioEnd ?? _0x3aee48.audioEnd,
    fps: _0x371fad.fps ?? _0x3aee48.fps,
  };
}
export async function runLocalMediaClipExport(_0x40fc43 = {}, _0x3ed4de = {}) {
  const _0x4639b7 = _0x40fc43?.electronPayload || _0x40fc43,
    _0x3df265 = _0x40fc43?.outputType === 'audio' || _0x4639b7?.kind === 'audioCut' ? 'audio' : 'video',
    _0x42aa26 = Number(_0x3ed4de.timeout || 0) || 0x927c0;
  if (_0x4639b7.kind === 'storySequenceExport') {
    if (!canUseElectronMediaTask() || typeof getMediaTaskBridge()?.list !== 'function') throw new Error('镜头初剪渲染需要更新后的桌面媒体任务接口；不回退到浏览器后端');
    try { return await enqueueElectronMediaTask(_0x4639b7, { wait: true, timeout: _0x42aa26 }); }
    catch (error) {
      if (String(error?.message || error).includes('Unsupported media task kind')) throw new Error('当前桌面进程尚未加载镜头初剪处理器，请更新并重启对应桌面端；未回退渲染');
      throw error;
    }
  }
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(_0x4639b7, { wait: true, timeout: _0x42aa26 });
  const _0xbb7b25 = _0x40fc43?.backendBody || buildBackendBodyFromElectronPayload(_0x4639b7),
    _0x406465 = await requester({
      url: _0x3df265 === 'audio' ? '/api/v2/audio/cut' : '/api/v2/video/clip_export',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_0xbb7b25),
      timeout: _0x42aa26,
      allow404Null: true,
      returnMeta: true,
    });
  if (!_0x406465?.data) throw new Error('Local media clip export API unavailable');
  return _0x406465.data;
}

const TERMINAL_STATUSES = new Set(['complete',"failed","cancelled"]);

export async function listElectronMediaTasks(_0x4da2c2={}){const _0x2a87e0=getMediaTaskBridge();if(!_0x2a87e0)return{'tasks':[]};return await _0x2a87e0['list'](_0x4da2c2);}
