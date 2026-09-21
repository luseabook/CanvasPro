import { buildApiUrl } from '../../../api/apiBase.js';
import {
  resolveCanvasAudioUrl,
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasVideoUrl,
} from '../../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolveMediaClipDimensions } from './mediaClipState.js';
import { firstNonEmpty, normalizeText, toNumber } from './mediaClipUtils.js';
import { isRenderableUrl, isUsableMediaElement } from './mediaClipMediaElement.js';
export function downloadLocalPath(_0x4c76f0, _0x4a14eb = '') {
  const _0x268874 = normalizeText(_0x4c76f0);
  if (!_0x268874) return;
  const _0x160d17 = document.createElement('a');
  ((_0x160d17.href = localPathToUrl(_0x268874) || '/' + _0x268874.replace(/^\/+/, '')),
    (_0x160d17.download = _0x4a14eb || _0x268874.split(/[\\/]/).pop() || 'clip'),
    (_0x160d17.rel = 'noopener'),
    document.body.appendChild(_0x160d17),
    _0x160d17.click(),
    _0x160d17.remove());
}
export function toPlayableMediaUrl(_0x1a1910) {
  const _0x357576 = normalizeText(_0x1a1910);
  if (!_0x357576) return '';
  if (/^(?:https?:|data:|blob:|aic-local-preview:)/i.test(_0x357576)) return _0x357576;
  const _0x294f00 = localPathToUrl(_0x357576),
    _0x583352 = _0x294f00 || (_0x357576.startsWith('/') ? _0x357576 : '');
  return _0x583352 ? buildApiUrl(_0x583352) : '';
}
export function resolveLiveMediaElementUrl(_0x590d78 = {}, _0x990238 = 'video') {
  const _0x188d3d = normalizeText(_0x590d78?.id);
  if (!_0x188d3d || typeof document === 'undefined' || typeof document.getElementById !== 'function')
    return '';
  const _0x48e633 = document.getElementById(_0x188d3d);
  if (!_0x48e633) return '';
  const _0x24c5a6 = Array.from(_0x48e633.querySelectorAll(_0x990238));
  let _0x2538d6 = '';
  for (const _0x1d0e53 of _0x24c5a6) {
    const _0x109e8a = firstNonEmpty(_0x1d0e53.currentSrc, _0x1d0e53.getAttribute?.('src'), _0x1d0e53.src),
      _0x3d7578 = toPlayableMediaUrl(_0x109e8a) || (isRenderableUrl(_0x109e8a) ? _0x109e8a : '');
    if (!_0x3d7578) continue;
    if (!_0x2538d6) _0x2538d6 = _0x3d7578;
    if (isUsableMediaElement(_0x1d0e53)) return _0x3d7578;
  }
  return _0x2538d6;
}
export function getSourceDataCandidates(_0x49b6c0 = {}) {
  if (!_0x49b6c0 || typeof _0x49b6c0 !== 'object') return [];
  const _0x5d658b = [],
    _0x47cd91 = (_0xfea2f0) => {
      if (!_0xfea2f0 || typeof _0xfea2f0 !== 'object') return;
      if (_0x5d658b.includes(_0xfea2f0)) return;
      _0x5d658b.push(_0xfea2f0);
    };
  (_0x47cd91(_0x49b6c0),
    _0x47cd91(_0x49b6c0.nodeData),
    _0x47cd91(_0x49b6c0.data),
    _0x47cd91(_0x49b6c0._data));
  for (let _0x2ec9af = 0; _0x2ec9af < _0x5d658b.length; _0x2ec9af += 1) {
    const _0x597e92 = _0x5d658b[_0x2ec9af];
    (_0x47cd91(_0x597e92.nodeData), _0x47cd91(_0x597e92.data), _0x47cd91(_0x597e92._data));
    const _0x132d7b = Array.isArray(_0x597e92.videos) ? _0x597e92.videos : [],
      _0x5d399e = Number(_0x597e92.mainVideoIndex),
      _0x3c07a3 = Number.isFinite(_0x5d399e) ? Math.max(0, Math.trunc(_0x5d399e)) : 0;
    (_0x47cd91(_0x132d7b[_0x3c07a3]), _0x132d7b.forEach(_0x47cd91));
  }
  return _0x5d658b;
}
export function resolveNestedMediaUrl(_0xdc2309, _0x5ce8dd, _0x3fb3a0 = []) {
  for (const _0x548334 of getSourceDataCandidates(_0xdc2309)) {
    const _0x420026 = normalizeText(_0x5ce8dd(_0x548334));
    if (_0x420026) return toPlayableMediaUrl(_0x420026) || _0x420026;
    for (const _0x25c988 of _0x3fb3a0) {
      const _0x452de0 = normalizeText(_0x548334?.[_0x25c988]);
      if (!_0x452de0) continue;
      const _0x3f9dc7 = toPlayableMediaUrl(_0x452de0);
      if (_0x3f9dc7) return _0x3f9dc7;
      if (isRenderableUrl(_0x452de0)) return _0x452de0;
    }
  }
  return '';
}
export function resolveMediaClipVideoUrl(_0x1a80cf = {}) {
  return (
    resolveLiveMediaElementUrl(_0x1a80cf, 'video') ||
    resolveNestedMediaUrl(_0x1a80cf, resolveCanvasVideoUrl, [
      'displayLocalPath',
      'videoMetaSrc',
      'videoLocalPath',
      'videoUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'sourceUrl',
      'localPath',
      'originalLocalPath',
      'capturePreviewUrl',
      'playbackUrl',
      'mediaUrl',
    ])
  );
}
export function resolveMediaClipAudioUrl(_0x5aab10 = {}) {
  return (
    resolveLiveMediaElementUrl(_0x5aab10, 'audio') ||
    resolveNestedMediaUrl(_0x5aab10, resolveCanvasAudioUrl, [
      'audioLocalPath',
      'audioUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'sourceUrl',
      'localPath',
      'mediaUrl',
    ])
  );
}
export function resolveMediaClipWaveformUrl(_0xde98e4 = {}) {
  for (const _0x2b7561 of getSourceDataCandidates(_0xde98e4)) {
    const _0x4afd44 = firstNonEmpty(
      _0x2b7561?.waveformLocalPath,
      _0x2b7561?.waveformUrl,
      _0x2b7561?.waveformJsonUrl,
    );
    if (!_0x4afd44) continue;
    return (
      localPathToUrl(_0x4afd44) ||
      toPlayableMediaUrl(_0x4afd44) ||
      (isRenderableUrl(_0x4afd44) ? _0x4afd44 : '')
    );
  }
  return '';
}
export function resolveMediaClipImageUrl(_0x2b3e60 = {}) {
  return (
    resolveNestedMediaUrl(_0x2b3e60, resolveCanvasImagePreviewUrl, [
      'displayLocalPath',
      'imageUrl',
      'sourceUrl',
      'thumbUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'localPath',
      'originalLocalPath',
      'thumbLocalPath',
    ]) ||
    resolveNestedMediaUrl(_0x2b3e60, resolveCanvasImageSourceUrl, [
      'imageUrl',
      'sourceUrl',
      'src',
      'localPath',
      'originalLocalPath',
    ])
  );
}
export function resolveMediaClipThumbUrl(_0x29d300 = {}) {
  for (const _0x21f0bb of getSourceDataCandidates(_0x29d300)) {
    const _0x33fc1a = firstNonEmpty(
      _0x21f0bb.thumbUrl,
      _0x21f0bb.thumbnailUrl,
      _0x21f0bb.posterUrl,
      _0x21f0bb.imageUrl,
      _0x21f0bb.sourceUrl,
      _0x21f0bb.videoThumbSrc,
      _0x21f0bb.videoMetaSrc,
      _0x21f0bb.coverUrl,
      _0x21f0bb.src,
    );
    if (_0x33fc1a) {
      const _0x567af1 = toPlayableMediaUrl(_0x33fc1a);
      if (_0x567af1) return _0x567af1;
      if (isRenderableUrl(_0x33fc1a)) return _0x33fc1a;
    }
    const _0x164fa1 = firstNonEmpty(
        _0x21f0bb.posterLocalPath,
        _0x21f0bb.thumbLocalPath,
        _0x21f0bb.coverLocalPath,
        _0x21f0bb.displayLocalPath,
        _0x21f0bb.localPath,
      ),
      _0x293785 = toPlayableMediaUrl(_0x164fa1);
    if (_0x293785) return _0x293785;
  }
  return '';
}
export function resolveMediaClipPosterImageFields(_0x5111d8 = {}, _0x62a3d5 = {}, _0x3be5b6 = {}) {
  const _0x51d811 = (_0xbdcf7a) => {
      const _0x277096 = normalizeText(_0xbdcf7a);
      if (!_0x277096) return '';
      return toPlayableMediaUrl(_0x277096) || (isRenderableUrl(_0x277096) ? _0x277096 : '');
    },
    _0x51e381 = firstNonEmpty(
      _0x62a3d5.thumbUrl,
      _0x62a3d5.posterUrl,
      _0x3be5b6.thumbUrl,
      _0x3be5b6.posterUrl,
    ),
    _0x1be040 = firstNonEmpty(
      _0x62a3d5.thumbLocalPath,
      _0x62a3d5.posterLocalPath,
      _0x3be5b6.thumbLocalPath,
      _0x3be5b6.posterLocalPath,
    );
  if (_0x51e381 || _0x1be040)
    return {
      thumbUrl: _0x51d811(_0x51e381 || _0x1be040),
      posterUrl: _0x51d811(_0x51e381 || _0x1be040),
      thumbLocalPath: normalizeText(_0x1be040),
      posterLocalPath: normalizeText(_0x1be040),
      isOutputPoster: true,
    };
  for (const _0x5938d2 of getSourceDataCandidates(_0x5111d8)) {
    const _0x1b4e64 = firstNonEmpty(
        _0x5938d2.thumbUrl,
        _0x5938d2.thumbnailUrl,
        _0x5938d2.posterUrl,
        _0x5938d2.coverUrl,
      ),
      _0x2b5e98 = firstNonEmpty(
        _0x5938d2.thumbLocalPath,
        _0x5938d2.posterLocalPath,
        _0x5938d2.coverLocalPath,
      );
    if (_0x1b4e64 || _0x2b5e98) {
      const _0x3ae3a8 = _0x51d811(_0x1b4e64 || _0x2b5e98);
      return {
        thumbUrl: _0x3ae3a8,
        posterUrl: _0x3ae3a8,
        thumbLocalPath: normalizeText(_0x2b5e98),
        posterLocalPath: normalizeText(_0x2b5e98),
        isOutputPoster: false,
      };
    }
  }
  return { thumbUrl: '', posterUrl: '', thumbLocalPath: '', posterLocalPath: '', isOutputPoster: false };
}
export function resolveMediaClipOutputVideoDimensions(_0x5a6eb1 = {}, _0x28cbed = {}) {
  const _0xe47b59 = toNumber(_0x28cbed.videoWidth, 0),
    _0x29606c = toNumber(_0x28cbed.videoHeight, 0);
  if (_0xe47b59 > 0 && _0x29606c > 0) return { width: _0xe47b59, height: _0x29606c };
  const _0x1d48ab = toNumber(_0x28cbed.width, 0),
    _0x3b05be = toNumber(_0x28cbed.height, 0);
  if (_0x1d48ab > 0 && _0x3b05be > 0) return { width: _0x1d48ab, height: _0x3b05be };
  return resolveMediaClipDimensions(_0x5a6eb1);
}
export function collectMediaClipFrameUrls(_0x22ac5e = {}) {
  const _0x69c706 = [],
    _0x3b7412 = new Set(),
    _0xa30cf5 = (_0x4e641e) => {
      const _0x41c98f = normalizeText(_0x4e641e);
      if (!_0x41c98f) return;
      const _0x1ff784 = toPlayableMediaUrl(_0x41c98f) || (isRenderableUrl(_0x41c98f) ? _0x41c98f : '');
      if (!_0x1ff784 || _0x3b7412.has(_0x1ff784)) return;
      (_0x3b7412.add(_0x1ff784), _0x69c706.push(_0x1ff784));
    },
    _0x254870 = (_0x193d16, _0x14e192 = {}) => {
      if (!_0x193d16) return;
      if (typeof _0x193d16 === 'string') {
        _0xa30cf5(_0x193d16);
        return;
      }
      if (typeof _0x193d16 !== 'object') return;
      _0xa30cf5(
        firstNonEmpty(
          _0x193d16.thumbUrl,
          _0x193d16.thumbnailUrl,
          _0x193d16.posterUrl,
          _0x193d16.imageUrl,
          _0x193d16.sourceUrl,
          _0x193d16.url,
          _0x193d16.src,
          _0x193d16.thumbLocalPath,
          _0x193d16.posterLocalPath,
          _0x14e192.allowLocalPath === true ? _0x193d16.localPath : '',
        ),
      );
    };
  for (const _0xd6838e of getSourceDataCandidates(_0x22ac5e)) {
    ([
      _0xd6838e.frameThumbUrls,
      _0xd6838e.frameThumbnailUrls,
      _0xd6838e.thumbnailUrls,
      _0xd6838e.thumbUrls,
      _0xd6838e.posterUrls,
      _0xd6838e.frames,
      _0xd6838e.thumbnails,
      _0xd6838e.videoFrames,
    ].forEach((_0x45fc66) => {
      Array.isArray(_0x45fc66) &&
        _0x45fc66.forEach((_0x4ad5fc) => _0x254870(_0x4ad5fc, { allowLocalPath: true }));
    }),
      _0x254870(_0xd6838e));
  }
  const _0x11b75e = resolveMediaClipThumbUrl(_0x22ac5e);
  if (_0x11b75e) _0xa30cf5(_0x11b75e);
  return _0x69c706;
}
export function resolveMediaClipLocalPath(_0x2d420a = {}) {
  for (const _0x4a5389 of getSourceDataCandidates(_0x2d420a)) {
    const _0xc36e6f = firstNonEmpty(
      _0x4a5389.localPath,
      _0x4a5389.originalLocalPath,
      _0x4a5389.displayLocalPath,
      _0x4a5389.videoLocalPath,
      _0x4a5389.audioLocalPath,
      _0x4a5389.imageUrl,
      _0x4a5389.sourceUrl,
      _0x4a5389.src,
      _0x4a5389.url,
      _0x4a5389.resultUrl,
    );
    if (_0xc36e6f) return _0xc36e6f;
  }
  return '';
}
