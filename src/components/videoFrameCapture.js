import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { resolveNormalizedMediaCrop } from '../core/math.js';
export function getVideoFrameSource(_0x22c970) {
  return String(_0x22c970?.currentSrc || _0x22c970?.src || _0x22c970?.getAttribute?.('src') || '').trim();
}
export function isVideoFrameReady(_0x140b94) {
  return (
    !!getVideoFrameSource(_0x140b94) &&
    Number(_0x140b94?.readyState || 0) >= 2 &&
    Number(_0x140b94?.videoWidth || 0) > 0 &&
    Number(_0x140b94?.videoHeight || 0) > 0
  );
}
function drawVideoFrameToCanvas(_0x39949c, _0x477b62) {
  if (!isVideoFrameReady(_0x39949c)) throw new Error('video frame is not ready');
  const _0x2f9033 = Math.max(1, Math.trunc(Number(_0x39949c.videoWidth) || 0)),
    _0x4887a0 = Math.max(1, Math.trunc(Number(_0x39949c.videoHeight) || 0)),
    _0x1f98a4 = document.createElement('canvas'),
    _0x1edbd9 = resolveNormalizedMediaCrop(_0x477b62, _0x2f9033, _0x4887a0);
  ((_0x1f98a4.width = _0x1edbd9.width), (_0x1f98a4.height = _0x1edbd9.height));
  const _0x346604 = _0x1f98a4.getContext('2d');
  if (!_0x346604) throw new Error('canvas context is unavailable');
  if (_0x477b62)
    _0x346604.drawImage(
      _0x39949c,
      _0x1edbd9.x,
      _0x1edbd9.y,
      _0x1edbd9.width,
      _0x1edbd9.height,
      0,
      0,
      _0x1edbd9.width,
      _0x1edbd9.height,
    );
  else _0x346604.drawImage(_0x39949c, 0, 0, _0x2f9033, _0x4887a0);
  return { canvas: _0x1f98a4, width: _0x1edbd9.width, height: _0x1edbd9.height };
}
function dataUrlToBlob(_0xc4d379) {
  const _0x225bcd = String(_0xc4d379 || ''),
    _0x44a365 = _0x225bcd.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!_0x44a365) throw new Error('invalid data url');
  const _0x20adf1 = _0x44a365[1] || 'application/octet-stream',
    _0x1a06f6 = _0x44a365[3] || '',
    _0x48d48e = _0x44a365[2] ? atob(_0x1a06f6) : decodeURIComponent(_0x1a06f6),
    _0x302a2c = new Uint8Array(_0x48d48e.length);
  for (let _0x427336 = 0; _0x427336 < _0x48d48e.length; _0x427336 += 1) {
    _0x302a2c[_0x427336] = _0x48d48e.charCodeAt(_0x427336);
  }
  return new Blob([_0x302a2c], { type: _0x20adf1 });
}
function extFromImageType(_0x28a50a) {
  const _0x21874f = String(_0x28a50a || '').toLowerCase();
  if (_0x21874f.includes('jpeg') || _0x21874f.includes('jpg')) return 'jpg';
  if (_0x21874f.includes('webp')) return 'webp';
  return 'png';
}
function normalizeFrameIndex(_0x7524b2) {
  const _0x4b2820 = Number(_0x7524b2);
  if (!Number.isFinite(_0x4b2820) || _0x4b2820 <= 0) return 1;
  return Math.max(1, Math.round(_0x4b2820));
}
export function resolveVideoFrameCaptureIndex(
  _0x1be913,
  {
    currentTimeSec: currentTimeSec = 0,
    fallbackDurationSec: fallbackDurationSec = 0,
    fallbackFrameRate: fallbackFrameRate = 0,
  } = {},
) {
  const _0x2c961b = Number(_0x1be913?.videoFps),
    _0x554a3b = Number(_0x1be913?.videoFrameCount),
    _0x3259d1 = Number(_0x1be913?.videoDuration),
    _0x4215a5 = Number.isFinite(_0x3259d1) && _0x3259d1 > 0 ? _0x3259d1 : Number(fallbackDurationSec),
    _0x1aa312 = Number(fallbackFrameRate),
    _0x3425a7 =
      Number.isFinite(_0x2c961b) && _0x2c961b > 0
        ? _0x2c961b
        : Number.isFinite(_0x554a3b) && _0x554a3b > 0 && Number.isFinite(_0x4215a5) && _0x4215a5 > 0
          ? _0x554a3b / _0x4215a5
          : Number.isFinite(_0x1aa312) && _0x1aa312 > 0
            ? _0x1aa312
            : 0;
  if (Number.isFinite(_0x3425a7) && _0x3425a7 > 0) {
    let _0x5c456c = Math.floor(Math.max(0, Number(currentTimeSec) || 0) * _0x3425a7) + 1;
    return (
      Number.isFinite(_0x554a3b) && _0x554a3b > 0
        ? (_0x5c456c = Math.max(1, Math.min(Math.round(_0x554a3b), _0x5c456c)))
        : (_0x5c456c = Math.max(1, _0x5c456c)),
      { frameIndex: _0x5c456c, nextSnapSeq: null, usedSequence: false }
    );
  }
  const _0x233361 = Math.max(1, Math.floor(Number(_0x1be913?.snapSeq) || 0) + 1);
  return { frameIndex: _0x233361, nextSnapSeq: _0x233361, usedSequence: true };
}
export function buildVideoFrameCaptureNodeName(
  _0x589f7e,
  { frameIndex: _0x5998ea, fallbackName: fallbackName = '', formatSourceFrameName: _0x2de09a } = {},
) {
  const _0x5ab5e6 = normalizeFrameIndex(_0x5998ea),
    _0x5efe79 = String(fallbackName || '').trim(),
    _0x4bd32d = String(_0x589f7e?.name || '').trim();
  if (!_0x4bd32d) return _0x5efe79;
  if (typeof _0x2de09a === 'function') {
    const _0x1d9ddd = String(_0x2de09a({ sourceName: _0x4bd32d, frameIndex: _0x5ab5e6 }) || '').trim();
    if (_0x1d9ddd) return _0x1d9ddd;
  }
  return _0x5efe79 || _0x4bd32d + '.' + _0x5ab5e6;
}
export function waitForVideoFrame(_0x1acf80, { timeoutMs: timeoutMs = 0x9c4 } = {}) {
  if (isVideoFrameReady(_0x1acf80)) return Promise.resolve(true);
  if (!getVideoFrameSource(_0x1acf80)) return Promise.resolve(false);
  return new Promise((_0x2f44ca) => {
    let _0x4e10f6 = false;
    const _0x3c814d = ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'timeupdate'],
      _0x4dca29 = (_0x1a00d1) => {
        if (_0x4e10f6) return;
        ((_0x4e10f6 = true), clearTimeout(_0x2fde1a));
        for (const _0xa974c3 of _0x3c814d) {
          _0x1acf80.removeEventListener?.(_0xa974c3, _0x2c3da6);
        }
        (_0x1acf80.removeEventListener?.('error', _0x2530ee),
          _0x1acf80.removeEventListener?.('abort', _0x2530ee),
          _0x2f44ca(_0x1a00d1 === true));
      },
      _0x2c3da6 = () => {
        if (isVideoFrameReady(_0x1acf80)) _0x4dca29(true);
      },
      _0x2530ee = () => _0x4dca29(false),
      _0x2fde1a = setTimeout(() => _0x4dca29(isVideoFrameReady(_0x1acf80)), timeoutMs);
    for (const _0xd81f8c of _0x3c814d) {
      _0x1acf80.addEventListener?.(_0xd81f8c, _0x2c3da6);
    }
    (_0x1acf80.addEventListener?.('error', _0x2530ee), _0x1acf80.addEventListener?.('abort', _0x2530ee));
    if (Number(_0x1acf80.readyState || 0) < 1)
      try {
        _0x1acf80.load?.();
      } catch {}
  });
}
export function captureVideoFrameDataUrl(_0x2b2206, { type: type = 'image/png', quality: _0x5d5a94 } = {}) {
  const { canvas: _0x68c303 } = drawVideoFrameToCanvas(_0x2b2206);
  return _0x68c303.toDataURL(type, _0x5d5a94);
}
export async function captureVideoFrameBlob(
  _0x4e2707,
  { type: type = 'image/png', quality: _0x35c2ea, crop: _0x5091a7 } = {},
) {
  const { canvas: _0x14d608 } = drawVideoFrameToCanvas(_0x4e2707, _0x5091a7);
  if (typeof _0x14d608.toBlob === 'function') {
    const _0x471fe5 = await new Promise((_0x190030) => {
      _0x14d608.toBlob(_0x190030, type, _0x35c2ea);
    });
    if (!_0x471fe5) throw new Error('video frame blob export failed');
    return _0x471fe5;
  }
  return dataUrlToBlob(_0x14d608.toDataURL(type, _0x35c2ea));
}
export async function captureVideoFrameSnapshot(
  _0x466bba,
  {
    type: type = 'image/png',
    quality: _0xf017c7,
    fileNamePrefix: fileNamePrefix = 'video_frame',
    crop: _0x4fd887,
  } = {},
) {
  const _0x4c2d25 = Math.max(1, Math.trunc(Number(_0x466bba?.videoWidth) || 0)),
    _0x317518 = Math.max(1, Math.trunc(Number(_0x466bba?.videoHeight) || 0)),
    _0x5707d3 = extFromImageType(type),
    _0xf37d39 = fileNamePrefix + '_' + Date.now() + '.' + _0x5707d3,
    _0x43feb2 = await captureVideoFrameBlob(_0x466bba, {
      type: type,
      quality: _0xf017c7,
      crop: _0x4fd887,
    }),
    _0x362cc0 = resolveNormalizedMediaCrop(_0x4fd887, _0x4c2d25, _0x317518);
  return {
    blob: _0x43feb2,
    width: _0x362cc0.width,
    height: _0x362cc0.height,
    originalWidth: _0x362cc0.width,
    originalHeight: _0x362cc0.height,
    type: _0x43feb2.type || type,
    ext: _0x5707d3,
    fileName: _0xf37d39,
  };
}
export async function captureAnnotatedVideoFrameSnapshot(
  _0x1c1944,
  _0x1363ad,
  {
    type: type = 'image/png',
    quality: _0x405e55,
    fileNamePrefix: fileNamePrefix = 'video_annotation',
    strokeStyle: strokeStyle = 'CanvasText',
  } = {},
) {
  const { canvas: _0x3e2513, width: _0x31f67c, height: _0x49151c } = drawVideoFrameToCanvas(_0x1c1944),
    _0x443c4d = _0x3e2513.getContext('2d');
  if (!_0x443c4d) throw new Error('canvas context is unavailable');
  const _0x224b40 = Math.max(0, Number(_0x1363ad?.x) || 0),
    _0x789b60 = Math.max(0, Number(_0x1363ad?.y) || 0),
    _0x570a20 = Math.max(1, Number(_0x1363ad?.width) || 1),
    _0x58067d = Math.max(1, Number(_0x1363ad?.height) || 1);
  (_0x443c4d.save(),
    (_0x443c4d.strokeStyle = strokeStyle),
    (_0x443c4d.lineWidth = Math.max(3, Math.round(Math.min(_0x31f67c, _0x49151c) / 180))),
    _0x443c4d.setLineDash([
      Math.max(6, _0x443c4d.lineWidth * 2.5),
      Math.max(4, _0x443c4d.lineWidth * 1.5),
    ]),
    _0x443c4d.strokeRect(_0x224b40, _0x789b60, _0x570a20, _0x58067d),
    _0x443c4d.restore());
  const _0x29a7f5 = await new Promise((_0x5e3bd7) => _0x3e2513.toBlob(_0x5e3bd7, type, _0x405e55));
  if (!_0x29a7f5) throw new Error('annotated video frame blob export failed');
  const _0x399206 = extFromImageType(type);
  return {
    blob: _0x29a7f5,
    width: _0x31f67c,
    height: _0x49151c,
    originalWidth: _0x31f67c,
    originalHeight: _0x49151c,
    type: _0x29a7f5.type || type,
    ext: _0x399206,
    fileName: fileNamePrefix + '_' + Date.now() + '.' + _0x399206,
  };
}
export async function saveVideoFrameSnapshot(_0x410f02, _0x449aef) {
  if (typeof _0x449aef !== 'function') throw new Error('saveOutputBlob is required');
  if (!_0x410f02?.blob) throw new Error('video frame snapshot is required');
  const _0x4e407b = String(_0x410f02.type || _0x410f02.blob.type || 'image/png'),
    _0x29bdeb = String(_0x410f02.ext || extFromImageType(_0x4e407b)),
    _0x1650df = String(_0x410f02.fileName || 'video_frame_' + Date.now() + '.' + _0x29bdeb),
    _0x25019d = Math.max(1, Math.trunc(Number(_0x410f02.width || _0x410f02.originalWidth) || 0)),
    _0x2557ba = Math.max(1, Math.trunc(Number(_0x410f02.height || _0x410f02.originalHeight) || 0)),
    _0x551565 =
      typeof File === 'function'
        ? new File([_0x410f02.blob], _0x1650df, { type: _0x4e407b })
        : _0x410f02.blob,
    _0x36f9b2 = await _0x449aef(_0x551565, { ext: _0x29bdeb }),
    _0x4b1a54 = pickResultLocalPath(_0x36f9b2),
    _0x31b0a6 = String(_0x36f9b2?.url || '').trim() || localPathToUrl(_0x4b1a54);
  if (!_0x31b0a6 || !_0x4b1a54) throw new Error('saved video frame did not return a local image path');
  const _0x6ccf5b = normalizeLocalPath(_0x36f9b2?.originalLocalPath || _0x4b1a54),
    _0x2c1c51 = normalizeLocalPath(_0x36f9b2?.displayLocalPath),
    _0x2b100f = normalizeLocalPath(_0x36f9b2?.thumbLocalPath);
  return {
    src: _0x31b0a6,
    localPath: _0x4b1a54,
    originalLocalPath: _0x6ccf5b,
    displayLocalPath: _0x2c1c51,
    thumbLocalPath: _0x2b100f,
    originalWidth: Number(_0x36f9b2?.originalWidth || _0x25019d) || _0x25019d,
    originalHeight: Number(_0x36f9b2?.originalHeight || _0x2557ba) || _0x2557ba,
    fileName: _0x36f9b2?.filename || _0x1650df,
  };
}
export function createVideoFrameCapturePreviewUrl(
  _0x31679e,
  { urlApi: urlApi = globalThis.window?.URL || globalThis.URL } = {},
) {
  if (!_0x31679e || typeof urlApi?.createObjectURL !== 'function') return '';
  try {
    return urlApi.createObjectURL(_0x31679e);
  } catch {
    return '';
  }
}
export function startVideoFrameSnapshotPersistence(_0x456832, _0x3591e7, { onPreview: _0x2b205b } = {}) {
  if (!_0x456832?.blob) throw new Error('video frame snapshot is required');
  const _0x100cf2 = createVideoFrameCapturePreviewUrl(_0x456832.blob);
  if (typeof _0x2b205b === 'function')
    _0x2b205b({ previewUrl: _0x100cf2, snapshot: _0x456832 });
  const _0xd05b32 = Promise.resolve().then(() => saveVideoFrameSnapshot(_0x456832, _0x3591e7));
  return { previewUrl: _0x100cf2, savePromise: _0xd05b32 };
}
export async function saveVideoFrameCapture(
  _0x481964,
  _0x2b2811,
  { type: type = 'image/png', quality: _0x15712f, fileNamePrefix: fileNamePrefix = 'video_frame' } = {},
) {
  const _0x10a451 = await captureVideoFrameSnapshot(_0x481964, {
    type: type,
    quality: _0x15712f,
    fileNamePrefix: fileNamePrefix,
  });
  return saveVideoFrameSnapshot(_0x10a451, _0x2b2811);
}

export const DEFAULT_VIDEO_FRAME_CAPTURE_FPS=0x18;
