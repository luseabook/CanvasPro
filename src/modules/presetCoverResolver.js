import { get } from '../../api/requester.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
  resolveCanvasVideoPosterUrl,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import { convertImageBlobToDataUrl } from '../services/imagePngConversionService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const IMAGE_DATA_URL_RE = /^data:image\//i;
function normalizeText(_0x189f30) {
  return String(_0x189f30 || '')['trim']();
}
function firstNonEmptyString(..._0x5eea6e) {
  for (const _0x2d9087 of _0x5eea6e) {
    const _0x4ee8bd = normalizeText(_0x2d9087);
    if (_0x4ee8bd) return _0x4ee8bd;
  }
  return '';
}
function isPlainObject(_0x545faa) {
  return !!_0x545faa && typeof _0x545faa === 'object' && !Array['isArray'](_0x545faa);
}
function hasError(_0x21b34c) {
  return !!normalizeText(_0x21b34c?.['error']);
}
function normalizeIndex(_0x241b93, _0x200e5b) {
  const _0x56458a = Number(_0x241b93);
  if (!Number['isFinite'](_0x56458a)) return 0x0;
  return Math['max'](0x0, Math['min'](Math['trunc'](_0x56458a), Math['max'](0x0, _0x200e5b - 0x1)));
}
function pickSuccessfulItem(_0x2f0e62, _0x146afd, _0x2e30b2) {
  const _0x286b86 = Array['isArray'](_0x2f0e62)
    ? _0x2f0e62['filter']((_0x810c38) => isPlainObject(_0x810c38))
    : [];
  if (_0x286b86['length'] === 0x0) return null;
  const _0x309fff = normalizeIndex(_0x146afd, _0x286b86['length']),
    _0x352db1 = _0x286b86[_0x309fff];
  if (_0x352db1 && !hasError(_0x352db1) && _0x2e30b2(_0x352db1)) return _0x352db1;
  return _0x286b86['find']((_0x5feb3a) => !hasError(_0x5feb3a) && !!_0x2e30b2(_0x5feb3a)) || null;
}
function resolveImageCoverUrl(_0x51ab89 = {}) {
  if (!isPlainObject(_0x51ab89) || hasError(_0x51ab89)) return '';
  return firstNonEmptyString(
    resolveCanvasImageThumbUrl(_0x51ab89),
    resolveCanvasImageDisplayUrl(_0x51ab89),
    resolveCanvasImageSourceUrl(_0x51ab89),
    _0x51ab89['thumbUrl'],
    _0x51ab89['imageUrl'],
    _0x51ab89['sourceUrl'],
    _0x51ab89['url'],
    _0x51ab89['resultUrl'],
    localPathToUrl(_0x51ab89['thumbLocalPath']),
    localPathToUrl(_0x51ab89['displayLocalPath']),
    localPathToUrl(_0x51ab89['localPath']),
  );
}
function resolveVideoCoverUrl(_0x560b66 = {}) {
  if (!isPlainObject(_0x560b66) || hasError(_0x560b66)) return '';
  return firstNonEmptyString(
    resolveCanvasVideoPosterUrl(_0x560b66),
    localPathToUrl(_0x560b66['posterLocalPath']),
    localPathToUrl(_0x560b66['previewLocalPath']),
    localPathToUrl(_0x560b66['thumbLocalPath']),
    localPathToUrl(_0x560b66['thumbnailLocalPath']),
    _0x560b66['posterUrl'],
    _0x560b66['previewUrl'],
    _0x560b66['thumbUrl'],
    _0x560b66['thumbnailUrl'],
    _0x560b66['coverUrl'],
  );
}
function resolveVideoResultUrl(_0x1b9839 = {}) {
  if (!isPlainObject(_0x1b9839) || hasError(_0x1b9839)) return '';
  return firstNonEmptyString(
    resolveCanvasVideoUrl(_0x1b9839),
    localPathToUrl(_0x1b9839['displayLocalPath']),
    localPathToUrl(_0x1b9839['localPath']),
    _0x1b9839['videoUrl'],
    _0x1b9839['resultUrl'],
    _0x1b9839['src'],
    _0x1b9839['url'],
  );
}
function resolveVideoThumbResultUrl(_0x33e9b2 = {}) {
  if (!isPlainObject(_0x33e9b2)) return '';
  return firstNonEmptyString(
    _0x33e9b2['url'],
    _0x33e9b2['thumbUrl'],
    _0x33e9b2['posterUrl'],
    localPathToUrl(_0x33e9b2['thumbLocalPath']),
    localPathToUrl(_0x33e9b2['posterLocalPath']),
    localPathToUrl(_0x33e9b2['localPath']),
  );
}
export function resolvePresetDefaultCoverCandidate(_0x342284 = {}) {
  if (!isPlainObject(_0x342284)) return { coverUrl: '', videoUrl: '' };
  const _0x427d61 = normalizeText(_0x342284['type']);
  if (_0x427d61 === 'ai-image') {
    const _0x26cb52 = Array['isArray'](_0x342284['images']) ? _0x342284['images'] : [];
    if (_0x26cb52['length'] > 0x0) {
      const _0x351638 = pickSuccessfulItem(_0x26cb52, _0x342284['mainImageIndex'], resolveImageCoverUrl);
      return { coverUrl: resolveImageCoverUrl(_0x351638), videoUrl: '' };
    }
    return { coverUrl: resolveImageCoverUrl(_0x342284), videoUrl: '' };
  }
  if (_0x427d61 === 'ai-video') {
    const _0x232c30 = Array['isArray'](_0x342284['videos']) ? _0x342284['videos'] : [];
    if (_0x232c30['length'] > 0x0) {
      const _0x5409cc = pickSuccessfulItem(
          _0x232c30,
          _0x342284['mainVideoIndex'],
          (_0x5f1d38) => resolveVideoCoverUrl(_0x5f1d38) || resolveVideoResultUrl(_0x5f1d38),
        ),
        _0x198d0e = resolveVideoCoverUrl(_0x5409cc);
      return { coverUrl: _0x198d0e, videoUrl: _0x198d0e ? '' : resolveVideoResultUrl(_0x5409cc) };
    }
    const _0x2c8cc7 = resolveVideoCoverUrl(_0x342284);
    return { coverUrl: _0x2c8cc7, videoUrl: _0x2c8cc7 ? '' : resolveVideoResultUrl(_0x342284) };
  }
  return { coverUrl: '', videoUrl: '' };
}
export async function imageUrlToDataUrl(_0x27c2c3, _0x2e98ab = {}) {
  const _0x2e2a58 = normalizeText(_0x27c2c3);
  if (!_0x2e2a58) return '';
  if (IMAGE_DATA_URL_RE['test'](_0x2e2a58)) return _0x2e2a58;
  const _0x21ad23 =
      typeof _0x2e98ab['getBlob'] === 'function'
        ? _0x2e98ab['getBlob']
        : (_0x55fc4c) => get(_0x55fc4c, { responseType: 'blob', provider: 'local', timeout: 0x7530 }),
    _0x435c1a =
      typeof _0x2e98ab['blobToDataUrl'] === 'function'
        ? _0x2e98ab['blobToDataUrl']
        : convertImageBlobToDataUrl;
  try {
    const _0x308986 = await _0x21ad23(_0x2e2a58),
      _0x151be8 = await _0x435c1a(_0x308986, _0x2e2a58);
    return IMAGE_DATA_URL_RE['test'](_0x151be8) ? _0x151be8 : '';
  } catch {
    return '';
  }
}
export async function resolvePresetDefaultCoverDataUrl(_0x51fabf = {}, _0x481cd1 = {}) {
  const _0xdbb4e1 =
      typeof _0x481cd1['loadImageDataUrl'] === 'function'
        ? _0x481cd1['loadImageDataUrl']
        : (_0x2be052) => imageUrlToDataUrl(_0x2be052, _0x481cd1),
    _0x330958 =
      typeof _0x481cd1['fetchVideoFirstFrameThumb'] === 'function'
        ? _0x481cd1['fetchVideoFirstFrameThumb']
        : fetchVideoFirstFrameThumbFromServer;
  try {
    const _0x5bf467 = resolvePresetDefaultCoverCandidate(_0x51fabf);
    if (_0x5bf467['coverUrl']) {
      const _0x181563 = await _0xdbb4e1(_0x5bf467['coverUrl']);
      return IMAGE_DATA_URL_RE['test'](_0x181563) ? _0x181563 : '';
    }
    if (!_0x5bf467['videoUrl']) return '';
    const _0x5e55d1 = await _0x330958(_0x5bf467['videoUrl'], { nodeId: normalizeText(_0x51fabf?.['id']) }),
      _0x3aad4d = resolveVideoThumbResultUrl(_0x5e55d1);
    if (!_0x3aad4d) return '';
    const _0x42b74b = await _0xdbb4e1(_0x3aad4d);
    return IMAGE_DATA_URL_RE['test'](_0x42b74b) ? _0x42b74b : '';
  } catch {
    return '';
  }
}
