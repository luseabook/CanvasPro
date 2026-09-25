import { captureVideoFrameSnapshot, waitForVideoFrame } from '../../components/videoFrameCapture.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
const STORY_CLIP_VIDEO_LOCALIZE_MAX_BYTES = 0x200 * 0x400 * 0x400,
  STORY_CLIP_FRAME_READY_TIMEOUT_MS = 0x2710,
  STORY_CLIP_FRAME_SEEK_TIMEOUT_MS = 0x1f40;
function normalizeText(_0x284be7) {
  return String(_0x284be7 || '')['trim']();
}
function seekVideoToTime(_0x4c92f5, _0x46c717, _0x3354f8 = STORY_CLIP_FRAME_SEEK_TIMEOUT_MS) {
  return new Promise((_0x9b7970) => {
    let _0x3dbee0 = ![],
      _0x250803 = null;
    const _0x121657 = (_0x425fc5) => {
        if (_0x3dbee0) return;
        _0x3dbee0 = !![];
        if (_0x250803) clearTimeout(_0x250803);
        (_0x4c92f5['removeEventListener']?.('seeked', _0x2e8073),
          _0x4c92f5['removeEventListener']?.('error', _0x26b33e),
          _0x4c92f5['removeEventListener']?.('abort', _0x26b33e),
          _0x9b7970(_0x425fc5 === !![]));
      },
      _0x2e8073 = () => _0x121657(!![]),
      _0x26b33e = () => _0x121657(![]);
    (_0x4c92f5['addEventListener']?.('seeked', _0x2e8073, { once: !![] }),
      _0x4c92f5['addEventListener']?.('error', _0x26b33e, { once: !![] }),
      _0x4c92f5['addEventListener']?.('abort', _0x26b33e, { once: !![] }),
      (_0x250803 = setTimeout(
        () =>
          _0x121657(
            !_0x4c92f5['seeking'] &&
              Math['abs'](Number(_0x4c92f5['currentTime']) - Number(_0x46c717)) <= 0.05,
          ),
        _0x3354f8,
      )));
    try {
      _0x4c92f5['currentTime'] = _0x46c717;
    } catch {
      _0x121657(![]);
      return;
    }
    !_0x4c92f5['seeking'] &&
      Math['abs'](Number(_0x4c92f5['currentTime']) - Number(_0x46c717)) <= 0.01 &&
      queueMicrotask(() => _0x121657(!![]));
  });
}
function resolveCaptureTime(_0x5490d6, _0x324f32) {
  const _0x1656c5 = Math['max'](0x0, Number(_0x324f32) || 0x0),
    _0x197b18 = Number(_0x5490d6?.['duration']);
  if (!Number['isFinite'](_0x197b18) || _0x197b18 <= 0x0) return _0x1656c5;
  return Math['min'](_0x1656c5, Math['max'](0x0, _0x197b18 - 0.001));
}
function inferVideoExtension(_0x4f4334, _0x12f9d6 = {}) {
  const _0x38ac68 = normalizeText(_0x12f9d6['mimeType'] || _0x12f9d6['contentType'])['toLowerCase']();
  if (_0x38ac68['includes']('webm')) return 'webm';
  if (_0x38ac68['includes']('quicktime')) return 'mov';
  if (_0x38ac68['includes']('mp4')) return 'mp4';
  try {
    const _0x3cc4fb = new URL(_0x4f4334, globalThis['location']?.['href'] || 'http://localhost/')['pathname'],
      _0x4f0d94 = normalizeText(_0x3cc4fb['match'](/\.([a-z0-9]{2,5})$/i)?.[0x1])['toLowerCase']();
    if (['mp4', 'm4v', 'mov', 'webm']['includes'](_0x4f0d94)) return _0x4f0d94;
  } catch {}
  return 'mp4';
}
function resolveRemoteVideoUrl(_0x45644d = {}, _0x3cbdac = '') {
  return (
    [_0x45644d['videoUrl'], _0x45644d['url'], _0x45644d['displayUrl'], _0x3cbdac]
      ['map'](normalizeText)
      ['find']((_0x3bdedc) => /^https?:\/\//i['test'](_0x3bdedc)) || ''
  );
}
function normalizeLocalizedVideoResult(_0x2847a3 = {}) {
  const _0xea2299 = pickResultLocalPath(_0x2847a3),
    _0x2bdaa5 = localPathToUrl(_0xea2299) || normalizeText(_0x2847a3['url']);
  if (!_0xea2299 || !_0x2bdaa5) return null;
  return {
    url: _0x2bdaa5,
    localPath: _0xea2299,
    originalLocalPath: normalizeLocalPath(_0x2847a3['originalLocalPath'] || _0xea2299),
    displayLocalPath: normalizeLocalPath(_0x2847a3['displayLocalPath']),
  };
}
export function isStoryClipFrameCanvasSecurityError(_0x5ca085) {
  const _0x4ebb35 = normalizeText(_0x5ca085?.['name'])['toLowerCase'](),
    _0x1ae719 = normalizeText(_0x5ca085?.['message'])['toLowerCase']();
  return (
    _0x4ebb35 === 'securityerror' ||
    _0x1ae719['includes']('tainted canvas') ||
    _0x1ae719['includes']('tainted canvases') ||
    _0x1ae719['includes']('insecure')
  );
}
export async function captureStoryClipFrameFromSource({
  sourceUrl: _0xafd283,
  currentTimeSec: currentTimeSec = 0x0,
  documentObject: documentObject = globalThis['document'],
  fileNamePrefix: fileNamePrefix = 'story_clip_frame',
  crop: _0x59528a,
} = {}) {
  const _0x3a0b91 = normalizeText(_0xafd283);
  if (!_0x3a0b91 || !documentObject?.['createElement']) throw new Error('片段视频本地源不可用');
  const _0x39424d = documentObject['createElement']('video');
  ((_0x39424d['muted'] = !![]),
    (_0x39424d['playsInline'] = !![]),
    (_0x39424d['preload'] = 'auto'),
    (_0x39424d['style']['position'] = 'fixed'),
    (_0x39424d['style']['left'] = '-10000px'),
    (_0x39424d['style']['top'] = '-10000px'),
    (_0x39424d['style']['width'] = '1px'),
    (_0x39424d['style']['height'] = '1px'),
    (_0x39424d['style']['opacity'] = '0'),
    documentObject['body']?.['appendChild'](_0x39424d));
  try {
    ((_0x39424d['src'] = _0x3a0b91), _0x39424d['load']?.());
    const _0x492707 = await waitForVideoFrame(_0x39424d, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS });
    if (!_0x492707) throw new Error('片段视频本地画面加载失败');
    const _0x4701ed = resolveCaptureTime(_0x39424d, currentTimeSec);
    if (_0x4701ed > 0.001 && Math['abs'](Number(_0x39424d['currentTime']) - _0x4701ed) > 0.01) {
      if (!(await seekVideoToTime(_0x39424d, _0x4701ed))) throw new Error('片段视频定位当前时间失败');
      if (!(await waitForVideoFrame(_0x39424d, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS })))
        throw new Error('片段视频当前画面加载失败');
    }
    return captureVideoFrameSnapshot(_0x39424d, {
      type: 'image/png',
      fileNamePrefix: fileNamePrefix,
      crop: _0x59528a,
    });
  } finally {
    try {
      (_0x39424d['pause']?.(), _0x39424d['removeAttribute']?.('src'), _0x39424d['load']?.());
    } catch {}
    _0x39424d['remove']?.();
  }
}
export async function captureStoryClipFrameSnapshot({
  videoEl: _0x321188,
  sourceResult: sourceResult = {},
  sourceUrl: sourceUrl = '',
  currentTimeSec: currentTimeSec = 0x0,
  saveOutputFromUrl: _0x2894a5,
  documentObject: documentObject = globalThis['document'],
  fileNamePrefix: fileNamePrefix = 'story_clip_frame',
} = {}) {
  if (!_0x321188) throw new Error('当前片段视频不可用');
  if (!(await waitForVideoFrame(_0x321188, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS })))
    throw new Error('视频画面尚未加载完成，请稍后重试');
  try {
    return {
      snapshot: await captureVideoFrameSnapshot(_0x321188, {
        type: 'image/png',
        fileNamePrefix: fileNamePrefix,
      }),
      localizedVideo: null,
    };
  } catch (_0x4a395a) {
    if (!isStoryClipFrameCanvasSecurityError(_0x4a395a)) throw _0x4a395a;
    const _0x12e992 = resolveRemoteVideoUrl(sourceResult, sourceUrl);
    if (!_0x12e992 || typeof _0x2894a5 !== 'function') throw _0x4a395a;
    const _0x56c6ec = normalizeLocalizedVideoResult(
      await _0x2894a5(_0x12e992, {
        ext: inferVideoExtension(_0x12e992, sourceResult),
        maxBytes: STORY_CLIP_VIDEO_LOCALIZE_MAX_BYTES,
        dedupeKey: 'story-clip-video:' + _0x12e992,
      }),
    );
    if (!_0x56c6ec) throw new Error('片段视频本地保存失败');
    return {
      snapshot: await captureStoryClipFrameFromSource({
        sourceUrl: _0x56c6ec['url'],
        currentTimeSec: currentTimeSec,
        documentObject: documentObject,
        fileNamePrefix: fileNamePrefix,
      }),
      localizedVideo: _0x56c6ec,
    };
  }
}
