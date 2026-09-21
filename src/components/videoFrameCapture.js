import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
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
function drawVideoFrameToCanvas(_0x39949c) {
  if (!isVideoFrameReady(_0x39949c)) throw new Error('video frame is not ready');
  const _0x2f9033 = Math.max(1, Math.trunc(Number(_0x39949c.videoWidth) || 0)),
    _0x4887a0 = Math.max(1, Math.trunc(Number(_0x39949c.videoHeight) || 0)),
    _0x1f98a4 = document.createElement('canvas');
  ((_0x1f98a4.width = _0x2f9033), (_0x1f98a4.height = _0x4887a0));
  const _0x346604 = _0x1f98a4.getContext('2d');
  if (!_0x346604) throw new Error('canvas context is unavailable');
  return (
    _0x346604.drawImage(_0x39949c, 0, 0, _0x2f9033, _0x4887a0),
    { canvas: _0x1f98a4, width: _0x2f9033, height: _0x4887a0 }
  );
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
  { type: type = 'image/png', quality: _0x35c2ea } = {},
) {
  const { canvas: _0x14d608 } = drawVideoFrameToCanvas(_0x4e2707);
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
  { type: type = 'image/png', quality: _0xf017c7, fileNamePrefix: fileNamePrefix = 'video_frame' } = {},
) {
  const _0x4c2d25 = Math.max(1, Math.trunc(Number(_0x466bba?.videoWidth) || 0)),
    _0x317518 = Math.max(1, Math.trunc(Number(_0x466bba?.videoHeight) || 0)),
    _0x5707d3 = extFromImageType(type),
    _0xf37d39 = fileNamePrefix + '_' + Date.now() + '.' + _0x5707d3,
    _0x43feb2 = await captureVideoFrameBlob(_0x466bba, { type: type, quality: _0xf017c7 });
  return {
    blob: _0x43feb2,
    width: _0x4c2d25,
    height: _0x317518,
    originalWidth: _0x4c2d25,
    originalHeight: _0x317518,
    type: _0x43feb2.type || type,
    ext: _0x5707d3,
    fileName: _0xf37d39,
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
