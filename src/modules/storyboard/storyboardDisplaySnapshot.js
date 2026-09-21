import {
  buildStoryboardCropRect,
  detachStoryboardCellSourceContext,
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  resolveStoryboardCellAssetSrc,
  resolveStoryboardCellPreviewSrc,
  resolveStoryboardCellSourceIndex,
} from '../../core/storyboardCellUtils.js';
const storyboardSourceImageCache = new Map();
function toPositiveNumber(_0x4e1304, _0x31d16e = null) {
  const _0x4bc48f = Number(_0x4e1304);
  return Number.isFinite(_0x4bc48f) && _0x4bc48f > 0 ? _0x4bc48f : _0x31d16e;
}
export function normalizeStoryboardImageUrl(_0x2ecba) {
  const _0x3a473a = String(_0x2ecba || '').trim();
  if (!_0x3a473a) return '';
  if (/^(?:https?:|blob:|data:)/i.test(_0x3a473a)) return _0x3a473a;
  if (_0x3a473a.startsWith('/')) return _0x3a473a;
  return '/' + _0x3a473a.replace(/^\/+/, '');
}
export function isSameStoryboardImageSrc(_0x4f2e1b, _0x570e64) {
  const _0x4b943f = String(_0x570e64 || '').trim();
  if (!_0x4b943f) return true;
  const _0x2aeee2 = String(_0x4f2e1b || '').trim();
  if (!_0x2aeee2) return false;
  if (_0x2aeee2 === _0x4b943f) return true;
  return normalizeStoryboardImageUrl(_0x2aeee2) === normalizeStoryboardImageUrl(_0x4b943f);
}
export function getStoryboardCellSourceImageUrl(_0x4d8c95) {
  if (!_0x4d8c95 || typeof _0x4d8c95 !== 'object') return '';
  if (isStoryboardCellEmpty(_0x4d8c95)) return '';
  const _0x34a78f =
    normalizeStoryboardImageUrl(_0x4d8c95.sourceLocalPath) ||
    normalizeStoryboardImageUrl(_0x4d8c95.sourceUrl);
  if (_0x34a78f) return _0x34a78f;
  return '';
}
export function getStoryboardNodeSourceImageUrl(_0x2586d5) {
  return (
    normalizeStoryboardImageUrl(_0x2586d5?.storyboardSourceLocalPath) ||
    normalizeStoryboardImageUrl(_0x2586d5?.storyboardSourceUrl) ||
    normalizeStoryboardImageUrl(_0x2586d5?.storyboardBackdropLocalPath) ||
    normalizeStoryboardImageUrl(_0x2586d5?.storyboardBackdropUrl) ||
    normalizeStoryboardImageUrl(_0x2586d5?.sourceLocalPath) ||
    normalizeStoryboardImageUrl(_0x2586d5?.sourceUrl)
  );
}
export function getStoryboardNodeSourceContext(_0x5ab4eb) {
  let _0x572053 =
      _0x5ab4eb?.storyboardSourceLocalPath ||
      _0x5ab4eb?.storyboardBackdropLocalPath ||
      _0x5ab4eb?.sourceLocalPath ||
      null,
    _0x3c3da5 = _0x572053
      ? ''
      : String(
          _0x5ab4eb?.storyboardSourceUrl || _0x5ab4eb?.storyboardBackdropUrl || _0x5ab4eb?.sourceUrl || '',
        ).trim();
  if (!_0x572053 && !_0x3c3da5) {
    const _0x1c813d = Array.isArray(_0x5ab4eb?.cells) ? _0x5ab4eb.cells : [];
    for (const _0x1eacf8 of _0x1c813d) {
      const _0x13322f = _0x1eacf8?.sourceLocalPath || null,
        _0x4ddbfe = String(_0x1eacf8?.sourceUrl || '').trim();
      if (!_0x13322f && !_0x4ddbfe) continue;
      ((_0x572053 = _0x13322f), (_0x3c3da5 = _0x13322f ? '' : _0x4ddbfe));
      break;
    }
  }
  return { sourceLocalPath: _0x572053 || null, sourceUrl: _0x3c3da5 };
}
export function getStoryboardPieceSourceImageUrl(_0x4fc4a7, _0x2c1b76) {
  if (isFrozenStoryboardDisplayCell(_0x4fc4a7)) return '';
  const _0x27c05e = getStoryboardCellSourceImageUrl(_0x4fc4a7);
  if (_0x27c05e) return _0x27c05e;
  if (!_0x4fc4a7 || typeof _0x4fc4a7 !== 'object' || isStoryboardCellEmpty(_0x4fc4a7)) return '';
  if (_0x4fc4a7.storyboardPiece === true) return getStoryboardNodeSourceImageUrl(_0x2c1b76);
  return '';
}
export function getStoryboardCellDisplaySrc(_0x9a2552) {
  if (isFrozenStoryboardDisplayCell(_0x9a2552))
    return resolveStoryboardCellPreviewSrc(_0x9a2552) || resolveStoryboardCellAssetSrc(_0x9a2552);
  const _0x307c81 = getStoryboardCellSourceImageUrl(_0x9a2552);
  if (_0x307c81) return _0x307c81;
  return resolveStoryboardCellPreviewSrc(_0x9a2552);
}
function isLoadedImageElement(_0x229540) {
  if (!_0x229540 || _0x229540.complete !== true) return false;
  const _0xdf4720 = Math.trunc(Number(_0x229540.naturalWidth) || 0),
    _0x58cd9d = Math.trunc(Number(_0x229540.naturalHeight) || 0);
  return _0xdf4720 > 0 && _0x58cd9d > 0;
}
function rememberStoryboardSourceImage(_0x23bf6e, _0x2b3797) {
  const _0x4921a3 = String(_0x23bf6e || '').trim();
  if (!_0x4921a3 || !isLoadedImageElement(_0x2b3797)) return;
  storyboardSourceImageCache.set(_0x4921a3, _0x2b3797);
}
function getCachedStoryboardSourceImage(_0x1f4206) {
  const _0x2c84c3 = String(_0x1f4206 || '').trim();
  if (!_0x2c84c3) return null;
  const _0x7466fe = storyboardSourceImageCache.get(_0x2c84c3) || null;
  if (isLoadedImageElement(_0x7466fe)) return _0x7466fe;
  return (storyboardSourceImageCache.delete(_0x2c84c3), null);
}
function getLoadedStoryboardSourceImage(_0x327b6e, _0x4709e1, _0xd98c55 = '') {
  if (typeof document === 'undefined') return null;
  const _0x132d78 = document.getElementById('cell-' + _0x327b6e + '-' + _0x4709e1),
    _0x424738 = _0x132d78?.querySelector?.('img.storyboard-cell-img--source-crop'),
    _0x58d56a = String(_0xd98c55 || '').trim();
  if (isLoadedImageElement(_0x424738)) {
    const _0x49364c = String(
      _0x424738.getAttribute?.('src') || _0x424738.currentSrc || _0x424738.src || '',
    ).trim();
    if (!_0x58d56a || !_0x49364c || _0x49364c === _0x58d56a)
      return (rememberStoryboardSourceImage(_0xd98c55, _0x424738), _0x424738);
  }
  const _0x218ae6 = document.getElementById('sb-node-' + _0x327b6e),
    _0x2794ac = _0x218ae6?.querySelector?.('.storyboard-source-backdrop');
  if (!isLoadedImageElement(_0x2794ac)) return null;
  if (_0x58d56a) {
    const _0x1ff1f9 = String(
      _0x2794ac.getAttribute?.('src') || _0x2794ac.currentSrc || _0x2794ac.src || '',
    ).trim();
    if (_0x1ff1f9 && _0x1ff1f9 !== _0x58d56a) return null;
  }
  return (rememberStoryboardSourceImage(_0xd98c55, _0x2794ac), _0x2794ac);
}
export function buildStoryboardSourceCropExtractFromImage(
  _0x4d5b5f,
  _0x1776f5,
  _0x2cf310,
  _0x411576,
  _0x3049bd = _0x1776f5,
) {
  if (!_0x2cf310 || typeof document === 'undefined' || typeof document.createElement !== 'function')
    return null;
  const _0x82cc4a = Math.max(1, Math.trunc(Number(_0x2cf310.naturalWidth) || 0)),
    _0x4fc21a = Math.max(1, Math.trunc(Number(_0x2cf310.naturalHeight) || 0)),
    _0x439c56 = buildStoryboardCropRect(_0x4d5b5f, _0x3049bd, {
      width: _0x82cc4a,
      height: _0x4fc21a,
      inset: 0,
    });
  if (!_0x439c56 || _0x439c56.sw <= 0 || _0x439c56.sh <= 0) return null;
  const _0x2d052a = _0x439c56.sx,
    _0x1fad73 = _0x439c56.sy,
    _0x3125d2 = _0x439c56.sw,
    _0x55c3db = _0x439c56.sh,
    _0x3e6f4e = document.createElement('canvas');
  ((_0x3e6f4e.width = _0x3125d2), (_0x3e6f4e.height = _0x55c3db));
  const _0x2cc02e = _0x3e6f4e.getContext('2d', { alpha: false });
  if (!_0x2cc02e) return null;
  try {
    ((_0x2cc02e.imageSmoothingEnabled = true),
      (_0x2cc02e.imageSmoothingQuality = 'high'),
      _0x2cc02e.drawImage(_0x2cf310, _0x2d052a, _0x1fad73, _0x3125d2, _0x55c3db, 0, 0, _0x3125d2, _0x55c3db));
    const _0x22b675 = _0x3e6f4e.toDataURL('image/jpeg', 0.9);
    if (!String(_0x22b675 || '').startsWith('data:image/')) return null;
    return {
      canvas: _0x3e6f4e,
      dataUrl: _0x22b675,
      fileName: _0x411576,
      width: _0x3125d2,
      height: _0x55c3db,
      sourceWidth: _0x82cc4a,
      sourceHeight: _0x4fc21a,
    };
  } catch {
    return null;
  }
}
export function buildStoryboardSourceCropExtract(_0x2f086e, _0x1f4ee0, _0x3fb3d7, _0x560314) {
  const _0x1917f8 = getStoryboardPieceSourceImageUrl(_0x3fb3d7, _0x2f086e);
  if (!_0x1917f8) return null;
  const _0x1d7369 = resolveStoryboardCellSourceIndex(_0x3fb3d7, _0x1f4ee0, _0x2f086e),
    _0x1fce66 =
      getLoadedStoryboardSourceImage(_0x2f086e?.id, _0x1f4ee0, _0x1917f8) ||
      getCachedStoryboardSourceImage(_0x1917f8);
  if (!_0x1fce66) return null;
  return buildStoryboardSourceCropExtractFromImage(_0x2f086e, _0x1f4ee0, _0x1fce66, _0x560314, _0x1d7369);
}
export function loadStoryboardSourceImage(_0x37d49f) {
  const _0xa226d3 = getCachedStoryboardSourceImage(_0x37d49f);
  if (_0xa226d3) return Promise.resolve(_0xa226d3);
  if (typeof Image !== 'function') return Promise.resolve(null);
  return new Promise((_0x57ee7d) => {
    const _0x3a0d9f = new Image();
    ((_0x3a0d9f.crossOrigin = 'anonymous'),
      (_0x3a0d9f.onload = () => {
        (rememberStoryboardSourceImage(_0x37d49f, _0x3a0d9f), _0x57ee7d(_0x3a0d9f));
      }),
      (_0x3a0d9f.onerror = () => _0x57ee7d(null)),
      (_0x3a0d9f.src = _0x37d49f));
  });
}
export function trimStoryboardImageRef(_0x497d41) {
  return String(_0x497d41 || '').trim();
}
export function isDataImageRef(_0x4aa9fd) {
  return trimStoryboardImageRef(_0x4aa9fd).startsWith('data:image/');
}
export function getDataImageExtension(_0x235e65) {
  const _0x15ad2e =
    String(_0x235e65 || '')
      .match(/^data:(image\/[a-z0-9.+-]+)[;,]/i)?.[1]
      ?.toLowerCase() || '';
  if (_0x15ad2e.includes('png')) return 'png';
  if (_0x15ad2e.includes('webp')) return 'webp';
  if (_0x15ad2e.includes('gif')) return 'gif';
  return 'jpg';
}
export function dataImageUrlToBlob(_0x3ec0b2) {
  const _0x4784fe = trimStoryboardImageRef(_0x3ec0b2),
    _0x28dce1 = _0x4784fe.match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
  if (!_0x28dce1 || typeof Blob !== 'function') return null;
  const _0x1998b0 = _0x28dce1[1] || 'image/jpeg',
    _0x5d7b15 = !!_0x28dce1[2],
    _0xf31ffb = _0x28dce1[3] || '';
  if (_0x5d7b15) {
    if (typeof atob !== 'function') return null;
    try {
      const _0x2ac0a1 = atob(_0xf31ffb),
        _0x4816b4 = new Uint8Array(_0x2ac0a1.length);
      for (let _0x3088e9 = 0; _0x3088e9 < _0x2ac0a1.length; _0x3088e9 += 1) {
        _0x4816b4[_0x3088e9] = _0x2ac0a1.charCodeAt(_0x3088e9);
      }
      return new Blob([_0x4816b4], { type: _0x1998b0 });
    } catch {
      return null;
    }
  }
  try {
    return new Blob([decodeURIComponent(_0xf31ffb)], { type: _0x1998b0 });
  } catch {
    return null;
  }
}
function isNonLocalImageRef(_0x15e285) {
  return /^(?:https?:|blob:|data:|aic-local-preview:)/i.test(trimStoryboardImageRef(_0x15e285));
}
function toStoredStoryboardLocalPath(_0xeea33d) {
  const _0xa1adf1 = trimStoryboardImageRef(_0xeea33d);
  if (!_0xa1adf1 || isNonLocalImageRef(_0xa1adf1)) return null;
  return _0xa1adf1.replace(/^\/+/, '') || null;
}
function isSameStoryboardImageRef(_0x4c3bb4, _0x5f564c) {
  const _0x1b4a48 = trimStoryboardImageRef(_0x4c3bb4),
    _0x1f2109 = trimStoryboardImageRef(_0x5f564c);
  if (!_0x1b4a48 || !_0x1f2109) return false;
  if (_0x1b4a48 === _0x1f2109) return true;
  return normalizeStoryboardImageUrl(_0x1b4a48) === normalizeStoryboardImageUrl(_0x1f2109);
}
function isStoryboardPayloadSourceContextRef(_0x35860a, _0x71b9fc) {
  const _0x1eb52a = trimStoryboardImageRef(_0x35860a);
  if (!_0x1eb52a || !_0x71b9fc || typeof _0x71b9fc !== 'object') return false;
  return [
    _0x71b9fc.sourceLocalPath,
    _0x71b9fc.sourceUrl,
    _0x71b9fc.storyboardSourceLocalPath,
    _0x71b9fc.storyboardSourceUrl,
  ].some((_0x28ed15) => isSameStoryboardImageRef(_0x1eb52a, _0x28ed15));
}
export function getImageElementDisplaySrc(_0x2a0f2d) {
  if (!_0x2a0f2d) return '';
  return trimStoryboardImageRef(
    _0x2a0f2d.currentSrc ||
      _0x2a0f2d.src ||
      (typeof _0x2a0f2d.getAttribute === 'function' ? _0x2a0f2d.getAttribute('src') : ''),
  );
}
function pickStoryboardCellStoredLocalPath(_0x273af0, _0x248382 = '') {
  const _0x2a914c = [
    _0x273af0?.localPath,
    _0x273af0?.displayLocalPath,
    _0x273af0?.originalLocalPath,
    _0x273af0?.thumbLocalPath,
    _0x248382,
  ];
  for (const _0x37412f of _0x2a914c) {
    const _0x4fd4c1 = toStoredStoryboardLocalPath(_0x37412f);
    if (_0x4fd4c1) return _0x4fd4c1;
  }
  return null;
}
function buildStoryboardCellAssetSnapshot(_0x46a6a7, _0x1a5c9d, _0x370f8b) {
  const _0x4430a8 = resolveStoryboardCellAssetSrc(_0x1a5c9d);
  if (!_0x4430a8) return null;
  const _0x2d1946 = isDataImageRef(_0x1a5c9d?.capturePreviewUrl)
      ? trimStoryboardImageRef(_0x1a5c9d.capturePreviewUrl)
      : isDataImageRef(_0x4430a8)
        ? trimStoryboardImageRef(_0x4430a8)
        : '',
    _0x4fb7fe = _0x2d1946 ? null : pickStoryboardCellStoredLocalPath(_0x1a5c9d, _0x4430a8),
    _0x2df000 = !_0x4fb7fe && !_0x2d1946 ? _0x4430a8 : '',
    _0x56d528 =
      toPositiveNumber(_0x1a5c9d?.imageWidth) ||
      toPositiveNumber(_0x1a5c9d?.originalWidth) ||
      toPositiveNumber(_0x1a5c9d?.w) ||
      null,
    _0xa0ab32 =
      toPositiveNumber(_0x1a5c9d?.imageHeight) ||
      toPositiveNumber(_0x1a5c9d?.originalHeight) ||
      toPositiveNumber(_0x1a5c9d?.h) ||
      null;
  return {
    kind: 'asset',
    id: _0x1a5c9d?.id || null,
    src: _0x4430a8,
    localPath: _0x4fb7fe,
    originalLocalPath: _0x2d1946 ? null : toStoredStoryboardLocalPath(_0x1a5c9d?.originalLocalPath),
    displayLocalPath: _0x2d1946 ? '' : toStoredStoryboardLocalPath(_0x1a5c9d?.displayLocalPath) || '',
    thumbLocalPath: _0x2d1946 ? null : toStoredStoryboardLocalPath(_0x1a5c9d?.thumbLocalPath),
    capturePreviewUrl: _0x2d1946,
    externalUrl: _0x2df000,
    fileName: trimStoryboardImageRef(_0x1a5c9d?.fileName),
    width: _0x56d528,
    height: _0xa0ab32,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(_0x1a5c9d, _0x370f8b, _0x46a6a7),
    storyboardExtractedCell: _0x1a5c9d?.storyboardExtractedCell === true,
    storyboardLockedCell: _0x1a5c9d?.storyboardLockedCell === true,
    wasSourceBacked: !!getStoryboardPieceSourceImageUrl(_0x1a5c9d, _0x46a6a7),
  };
}
function buildStoryboardCellCropSnapshot(_0x5971ac, _0x64361e, _0xdecdf2, _0xbb52b4) {
  if (!_0xbb52b4?.dataUrl) return null;
  return {
    kind: 'source-crop',
    id: _0x64361e?.id || null,
    src: _0xbb52b4.dataUrl,
    localPath: null,
    originalLocalPath: null,
    displayLocalPath: '',
    thumbLocalPath: null,
    capturePreviewUrl: _0xbb52b4.dataUrl,
    externalUrl: '',
    fileName: _0xbb52b4.fileName || '',
    width: _0xbb52b4.width || null,
    height: _0xbb52b4.height || null,
    sourceWidth: _0xbb52b4.sourceWidth || _0x64361e?.sourceWidth || null,
    sourceHeight: _0xbb52b4.sourceHeight || _0x64361e?.sourceHeight || null,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(_0x64361e, _0xdecdf2, _0x5971ac),
    storyboardExtractedCell: false,
    storyboardLockedCell: true,
    crop: _0xbb52b4,
    wasSourceBacked: true,
  };
}
export function resolveStoryboardPayloadDisplaySnapshot(_0x2a82d4, _0x5c01fc = {}) {
  if (!_0x2a82d4 || typeof _0x2a82d4 !== 'object') return null;
  const _0x34bcdf = trimStoryboardImageRef(_0x5c01fc.visibleSrc),
    _0xad5f66 = trimStoryboardImageRef(_0x2a82d4.url),
    _0x32f678 = isStoryboardPayloadSourceContextRef(_0xad5f66, _0x2a82d4) ? '' : _0xad5f66,
    _0x4c904f = isDataImageRef(_0x34bcdf)
      ? _0x34bcdf
      : isDataImageRef(_0x2a82d4.capturePreviewUrl)
        ? trimStoryboardImageRef(_0x2a82d4.capturePreviewUrl)
        : isDataImageRef(_0x32f678)
          ? _0x32f678
          : '',
    _0x2696fd = _0x4c904f
      ? null
      : toStoredStoryboardLocalPath(_0x34bcdf) ||
        toStoredStoryboardLocalPath(_0x2a82d4.localPath) ||
        toStoredStoryboardLocalPath(_0x2a82d4.displayLocalPath) ||
        toStoredStoryboardLocalPath(_0x2a82d4.thumbLocalPath) ||
        toStoredStoryboardLocalPath(_0x32f678),
    _0x629edc =
      _0x4c904f ||
      normalizeStoryboardImageUrl(_0x2696fd) ||
      normalizeStoryboardImageUrl(_0x34bcdf) ||
      normalizeStoryboardImageUrl(_0x2a82d4.thumbLocalPath) ||
      normalizeStoryboardImageUrl(_0x32f678);
  if (!_0x629edc) return null;
  const _0x51e5ee = Number(_0x2a82d4.storyboardSourceIndex);
  return {
    kind: 'asset',
    src: _0x629edc,
    localPath: _0x2696fd,
    originalLocalPath: toStoredStoryboardLocalPath(_0x2a82d4.originalLocalPath),
    displayLocalPath: toStoredStoryboardLocalPath(_0x2a82d4.displayLocalPath) || '',
    thumbLocalPath: toStoredStoryboardLocalPath(_0x2a82d4.thumbLocalPath),
    capturePreviewUrl: _0x4c904f,
    externalUrl: !_0x2696fd && !_0x4c904f ? _0x629edc : '',
    fileName: trimStoryboardImageRef(_0x2a82d4.fileName),
    width: toPositiveNumber(_0x2a82d4.imageWidth) || toPositiveNumber(_0x2a82d4.originalWidth) || null,
    height: toPositiveNumber(_0x2a82d4.imageHeight) || toPositiveNumber(_0x2a82d4.originalHeight) || null,
    ...(Number.isInteger(_0x51e5ee) && _0x51e5ee >= 0 ? { storyboardSourceIndex: _0x51e5ee } : {}),
    storyboardExtractedCell: _0x2a82d4.storyboardExtractedCell === true,
    storyboardLockedCell: false,
  };
}
export function resolveCollagePayloadDisplaySnapshot(_0x502fd7, _0x19152f = {}) {
  const _0x2495aa = resolveStoryboardPayloadDisplaySnapshot(_0x502fd7, _0x19152f);
  if (!_0x2495aa?.src) return null;
  return {
    src: _0x2495aa.src,
    localPath: _0x2495aa.localPath || '',
    thumbLocalPath: _0x2495aa.thumbLocalPath || null,
    width: _0x2495aa.width || null,
    height: _0x2495aa.height || null,
  };
}
export function resolveStoryboardCellDisplaySnapshot(_0x1ad00c, _0x4611cc, _0x246d44, _0x256e8d) {
  if (!_0x4611cc || typeof _0x4611cc !== 'object' || isStoryboardCellEmpty(_0x4611cc)) return null;
  const _0xa68e62 = buildStoryboardCellAssetSnapshot(_0x1ad00c, _0x4611cc, _0x246d44);
  if (isFrozenStoryboardDisplayCell(_0x4611cc)) return _0xa68e62;
  const _0x1ef004 = getStoryboardPieceSourceImageUrl(_0x4611cc, _0x1ad00c);
  if (!_0x1ef004) return _0xa68e62;
  const _0x109454 = buildStoryboardSourceCropExtract(
    _0x1ad00c,
    _0x246d44,
    _0x4611cc,
    _0x256e8d?.fileName || 'storyboard_snapshot_' + (_0x1ad00c?.id || 'node') + '_' + _0x246d44 + '.jpg',
  );
  return buildStoryboardCellCropSnapshot(_0x1ad00c, _0x4611cc, _0x246d44, _0x109454) || _0xa68e62;
}
function getStoryboardCellPositionPatch(_0x523f85, _0x3e8732) {
  return {
    col: _0x3e8732 % Math.max(1, Number(_0x523f85?.cols) || 1),
    row: Math.floor(_0x3e8732 / Math.max(1, Number(_0x523f85?.cols) || 1)),
  };
}
function getStoryboardCellSourceIndexPatch(_0x1e70a7, _0x1644b9, _0x35304d) {
  return { storyboardSourceIndex: resolveStoryboardCellSourceIndex(_0x1e70a7, _0x35304d, _0x1644b9) };
}
function cloneStoryboardCellForGridPosition(_0x15afd0, _0x3e6d24, _0x14b8e6) {
  return {
    ...(_0x15afd0 && typeof _0x15afd0 === 'object' ? _0x15afd0 : {}),
    ...getStoryboardCellSourceIndexPatch(_0x15afd0, _0x3e6d24, _0x14b8e6),
    ...getStoryboardCellPositionPatch(_0x3e6d24, _0x14b8e6),
  };
}
function buildLockedStoryboardCellFromCrop(_0x3bc93f, _0x4803ee, _0x4ce4f0, _0x497b4c) {
  if (!_0x497b4c?.dataUrl) return null;
  return detachStoryboardCellSourceContext(
    {
      ...(_0x3bc93f && typeof _0x3bc93f === 'object' ? _0x3bc93f : {}),
      ...getStoryboardCellSourceIndexPatch(_0x3bc93f, _0x4803ee, _0x4ce4f0),
      ...getStoryboardCellPositionPatch(_0x4803ee, _0x4ce4f0),
      url: '',
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: '',
      thumbLocalPath: '',
      thumbUrl: '',
      thumbId: null,
      capturePreviewUrl: _0x497b4c.dataUrl,
      fileName: _0x497b4c.fileName || '',
      originalWidth: _0x497b4c.width,
      originalHeight: _0x497b4c.height,
      imageWidth: _0x497b4c.width,
      imageHeight: _0x497b4c.height,
      w: _0x497b4c.width,
      h: _0x497b4c.height,
      sourceWidth: _0x497b4c.sourceWidth || _0x3bc93f?.sourceWidth || null,
      sourceHeight: _0x497b4c.sourceHeight || _0x3bc93f?.sourceHeight || null,
      storyboardLockedCell: true,
      storyboardExtractedCell: false,
      isEmpty: false,
    },
    { locked: true, extracted: false },
  );
}
export function buildFrozenStoryboardCellFromSnapshot(_0x4933eb, _0x42d362, _0x56838b, _0xb5bc6d = {}) {
  const _0x1f46be = trimStoryboardImageRef(_0x4933eb?.src);
  if (!_0x1f46be) return null;
  const _0x2103bf = isDataImageRef(_0x4933eb.capturePreviewUrl)
      ? trimStoryboardImageRef(_0x4933eb.capturePreviewUrl)
      : isDataImageRef(_0x1f46be)
        ? _0x1f46be
        : '',
    _0xa0277b = _0x2103bf
      ? null
      : toStoredStoryboardLocalPath(_0x4933eb.localPath) || toStoredStoryboardLocalPath(_0x1f46be),
    _0x325bae = !_0xa0277b && !_0x2103bf ? trimStoryboardImageRef(_0x4933eb.externalUrl || _0x1f46be) : '',
    _0x4adbf8 =
      toPositiveNumber(_0x4933eb.width) ||
      toPositiveNumber(_0x4933eb.imageWidth) ||
      toPositiveNumber(_0x4933eb.originalWidth) ||
      null,
    _0x1aa9b7 =
      toPositiveNumber(_0x4933eb.height) ||
      toPositiveNumber(_0x4933eb.imageHeight) ||
      toPositiveNumber(_0x4933eb.originalHeight) ||
      null,
    _0x27040f = Number(_0x4933eb.storyboardSourceIndex);
  return {
    ...(_0xb5bc6d.id ? { id: _0xb5bc6d.id } : _0x4933eb.id ? { id: _0x4933eb.id } : {}),
    url: _0x325bae || '',
    localPath: _0xa0277b,
    originalLocalPath: _0x2103bf ? null : toStoredStoryboardLocalPath(_0x4933eb.originalLocalPath),
    displayLocalPath: _0x2103bf ? '' : toStoredStoryboardLocalPath(_0x4933eb.displayLocalPath) || '',
    thumbLocalPath: _0x2103bf ? null : toStoredStoryboardLocalPath(_0x4933eb.thumbLocalPath),
    thumbUrl: '',
    thumbId: null,
    capturePreviewUrl: _0x2103bf,
    fileName: trimStoryboardImageRef(_0x4933eb.fileName),
    originalWidth: _0x4adbf8,
    originalHeight: _0x1aa9b7,
    imageWidth: _0x4adbf8,
    imageHeight: _0x1aa9b7,
    w: _0x4adbf8,
    h: _0x1aa9b7,
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardExtractedCell: _0x4933eb.storyboardExtractedCell === true,
    storyboardLockedCell:
      _0x4933eb.storyboardLockedCell === true ||
      _0x4933eb.kind === 'source-crop' ||
      _0xb5bc6d.locked === true,
    ...(Number.isInteger(_0x27040f) && _0x27040f >= 0 ? { storyboardSourceIndex: _0x27040f } : {}),
    isEmpty: false,
    ...getStoryboardCellPositionPatch(_0x42d362, _0x56838b),
  };
}
export function buildEmptyStoryboardCellForSlot(_0x449a97, _0x10ec64, _0x42c49a) {
  return normalizeEmptyStoryboardCell({
    ...(_0x449a97 && typeof _0x449a97 === 'object' ? _0x449a97 : {}),
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardLockedCell: false,
    ...getStoryboardCellPositionPatch(_0x10ec64, _0x42c49a),
  });
}
function updateStoryboardSwapCells(_0x5cd0a2, _0x2669fc, _0x8090c4, _0x32e0d9, _0x9079d4) {
  if (_0x2669fc.id === _0x8090c4.id) {
    if (typeof _0x5cd0a2.updateNodeData !== 'function') return false;
    return (_0x5cd0a2.updateNodeData(_0x2669fc.id, { cells: _0x32e0d9 }), true);
  }
  if (typeof _0x5cd0a2.updateNodesData === 'function')
    return (
      _0x5cd0a2.updateNodesData({
        [_0x2669fc.id]: { cells: _0x32e0d9 },
        [_0x8090c4.id]: { cells: _0x9079d4 },
      }),
      true
    );
  if (typeof _0x5cd0a2.updateNodeData !== 'function') return false;
  return (
    _0x5cd0a2.updateNodeData(_0x2669fc.id, { cells: _0x32e0d9 }),
    _0x5cd0a2.updateNodeData(_0x8090c4.id, { cells: _0x9079d4 }),
    true
  );
}
export function swapStoryboardCellsWithDisplaySnapshots({
  store: _0x1943ac,
  sourceNode: _0x5435f7,
  sourceCellIndex: _0x4fde35,
  targetNode: _0x1251f2,
  targetCellIndex: _0x330331,
  sourceSnapshot: sourceSnapshot = null,
  targetSnapshot: targetSnapshot = null,
}) {
  if (!_0x5435f7 || !_0x1251f2) return false;
  const _0x39524a = _0x5435f7.cells?.[_0x4fde35],
    _0x17e470 = _0x1251f2.cells?.[_0x330331];
  !sourceSnapshot && (sourceSnapshot = resolveStoryboardCellDisplaySnapshot(_0x5435f7, _0x39524a, _0x4fde35));
  if (!sourceSnapshot) return false;
  const _0x7bf453 = _0x17e470 && !isStoryboardCellEmpty(_0x17e470);
  _0x7bf453 &&
    !targetSnapshot &&
    (targetSnapshot = resolveStoryboardCellDisplaySnapshot(_0x1251f2, _0x17e470, _0x330331));
  if (_0x7bf453 && !targetSnapshot) return false;
  const _0x4e2edf = [...(_0x5435f7.cells || [])],
    _0x2298c7 = _0x5435f7.id === _0x1251f2.id ? _0x4e2edf : [...(_0x1251f2.cells || [])];
  ((_0x2298c7[_0x330331] = buildFrozenStoryboardCellFromSnapshot(sourceSnapshot, _0x1251f2, _0x330331)),
    (_0x4e2edf[_0x4fde35] = _0x7bf453
      ? buildFrozenStoryboardCellFromSnapshot(targetSnapshot, _0x5435f7, _0x4fde35)
      : buildEmptyStoryboardCellForSlot(_0x39524a, _0x5435f7, _0x4fde35)));
  if (!_0x2298c7[_0x330331] || (_0x7bf453 && !_0x4e2edf[_0x4fde35])) return false;
  return updateStoryboardSwapCells(_0x1943ac, _0x5435f7, _0x1251f2, _0x4e2edf, _0x2298c7);
}
export function lockStoryboardCellForCurrentGrid(_0x5f0db2, _0x5b071b, _0x4dbd17) {
  const _0x21aba9 = _0x5f0db2?.cells?.[_0x5b071b];
  if (!_0x21aba9 || isStoryboardCellEmpty(_0x21aba9))
    return normalizeEmptyStoryboardCell({
      ...(_0x21aba9 && typeof _0x21aba9 === 'object' ? _0x21aba9 : {}),
      ...getStoryboardCellPositionPatch(_0x5f0db2, _0x5b071b),
    });
  const _0x477358 = buildStoryboardSourceCropExtract(_0x5f0db2, _0x5b071b, _0x21aba9, _0x4dbd17);
  if (_0x477358?.dataUrl)
    return buildLockedStoryboardCellFromCrop(_0x21aba9, _0x5f0db2, _0x5b071b, _0x477358);
  if (_0x21aba9.storyboardLockedCell === true || _0x21aba9.storyboardExtractedCell === true)
    return cloneStoryboardCellForGridPosition(_0x21aba9, _0x5f0db2, _0x5b071b);
  if (getStoryboardPieceSourceImageUrl(_0x21aba9, _0x5f0db2)) return null;
  return cloneStoryboardCellForGridPosition(_0x21aba9, _0x5f0db2, _0x5b071b);
}
export function swapStoryboardCellsWithLockedBlocks({
  store: _0x2c08ec,
  sourceNode: _0x5c6e3d,
  sourceCellIndex: _0x2488d8,
  targetNode: _0xf290c2,
  targetCellIndex: _0x268c7a,
}) {
  if (!_0x5c6e3d || !_0xf290c2) return false;
  const _0x5a359e = _0x5c6e3d.cells?.[_0x2488d8],
    _0x26323c = _0xf290c2.cells?.[_0x268c7a],
    _0x35afd5 = !!getStoryboardPieceSourceImageUrl(_0x5a359e, _0x5c6e3d),
    _0x24a306 =
      _0x26323c && !isStoryboardCellEmpty(_0x26323c)
        ? !!getStoryboardPieceSourceImageUrl(_0x26323c, _0xf290c2)
        : false;
  if (!_0x35afd5 && !_0x24a306) return false;
  if (_0x5c6e3d.id === _0xf290c2.id && typeof _0x2c08ec.updateNodeData !== 'function') return false;
  if (_0x5c6e3d.id !== _0xf290c2.id && typeof _0x2c08ec.updateNodesData !== 'function') return false;
  const _0x1db78d = lockStoryboardCellForCurrentGrid(
    _0x5c6e3d,
    _0x2488d8,
    'storyboard_lock_' + _0x5c6e3d.id + '_' + _0x2488d8 + '.jpg',
  );
  if (!_0x1db78d || isStoryboardCellEmpty(_0x1db78d)) return false;
  const _0x5f096d = lockStoryboardCellForCurrentGrid(
    _0xf290c2,
    _0x268c7a,
    'storyboard_lock_' + _0xf290c2.id + '_' + _0x268c7a + '.jpg',
  );
  if (_0x26323c && !isStoryboardCellEmpty(_0x26323c) && !_0x5f096d) return false;
  if (_0x5c6e3d.id === _0xf290c2.id) {
    const _0x17d3bb = [...(_0x5c6e3d.cells || [])];
    return (
      (_0x17d3bb[_0x268c7a] = { ..._0x1db78d, ...getStoryboardCellPositionPatch(_0x5c6e3d, _0x268c7a) }),
      (_0x17d3bb[_0x2488d8] =
        _0x26323c && !isStoryboardCellEmpty(_0x26323c)
          ? { ..._0x5f096d, ...getStoryboardCellPositionPatch(_0x5c6e3d, _0x2488d8) }
          : normalizeEmptyStoryboardCell({
              ..._0x5a359e,
              ...getStoryboardCellPositionPatch(_0x5c6e3d, _0x2488d8),
            })),
      _0x2c08ec.updateNodeData(_0x5c6e3d.id, { cells: _0x17d3bb }),
      true
    );
  }
  const _0x36931a = [...(_0x5c6e3d.cells || [])],
    _0x3ad15a = [...(_0xf290c2.cells || [])];
  return (
    (_0x3ad15a[_0x268c7a] = { ..._0x1db78d, ...getStoryboardCellPositionPatch(_0xf290c2, _0x268c7a) }),
    (_0x36931a[_0x2488d8] =
      _0x26323c && !isStoryboardCellEmpty(_0x26323c)
        ? { ..._0x5f096d, ...getStoryboardCellPositionPatch(_0x5c6e3d, _0x2488d8) }
        : normalizeEmptyStoryboardCell({
            ..._0x5a359e,
            ...getStoryboardCellPositionPatch(_0x5c6e3d, _0x2488d8),
          })),
    _0x2c08ec.updateNodesData({ [_0x5c6e3d.id]: { cells: _0x36931a }, [_0xf290c2.id]: { cells: _0x3ad15a } }),
    true
  );
}
export function requiresLockedStoryboardSwap({
  sourceNode: _0x116db1,
  sourceCellIndex: _0x1a0238,
  targetNode: _0x44baad,
  targetCellIndex: _0x16329e,
}) {
  const _0x42564f = _0x116db1?.cells?.[_0x1a0238],
    _0xc784fc = _0x44baad?.cells?.[_0x16329e];
  return !!(
    getStoryboardPieceSourceImageUrl(_0x42564f, _0x116db1) ||
    (_0xc784fc && !isStoryboardCellEmpty(_0xc784fc) && getStoryboardPieceSourceImageUrl(_0xc784fc, _0x44baad))
  );
}
