import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
} from '../services/imagePngConversionService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image', 'storyboard']);
function pickMainItem(_0x3139f0, _0x5c7cd3) {
  if (!Array.isArray(_0x3139f0) || _0x3139f0.length === 0) return null;
  const _0x525720 = Number(_0x5c7cd3),
    _0x1ff7e5 = Number.isFinite(_0x525720) ? Math.max(0, Math.trunc(_0x525720)) : 0;
  return _0x3139f0[_0x1ff7e5] || _0x3139f0[0] || null;
}
function normalizeMediaUrl(_0x110174) {
  const _0xd05879 = String(_0x110174 || '').trim();
  if (!_0xd05879) return '';
  if (/^(https?:|blob:|data:)/i.test(_0xd05879)) return _0xd05879;
  const _0x50d632 = localPathToUrl(_0xd05879);
  if (_0x50d632) return _0x50d632;
  const _0x2b74f7 = _0xd05879.replace(/\\/g, '/');
  if (
    /^(?:file:|javascript:)/i.test(_0x2b74f7) ||
    /^[a-zA-Z]:\//.test(_0x2b74f7) ||
    _0x2b74f7.startsWith('//')
  )
    return '';
  const _0x4c8709 = _0x2b74f7.split(/[?#]/, 1)[0].replace(/^\/+/, ''),
    _0x36ebe6 = _0x4c8709.split('/').filter(Boolean);
  if (!_0x36ebe6.length || _0x36ebe6.some((_0x32728a) => _0x32728a === '.' || _0x32728a === '..')) return '';
  return '/' + _0x36ebe6.join('/');
}
function normalizeLocalMediaPath(_0x4f3057) {
  return normalizeLocalPath(_0x4f3057);
}
function pickMediaUrl(..._0x197518) {
  for (const _0x36915c of _0x197518) {
    const _0x2017f0 = normalizeMediaUrl(_0x36915c);
    if (_0x2017f0) return _0x2017f0;
  }
  return '';
}
function pickLocalMediaPath(..._0x33c722) {
  for (const _0x259a68 of _0x33c722) {
    const _0x1f408b = normalizeLocalMediaPath(_0x259a68);
    if (_0x1f408b) return _0x1f408b;
  }
  return '';
}
function resolveNodeMedia(_0x3a2964) {
  const _0xcea1d3 = String(_0x3a2964?.type || '').trim();
  if (!IMAGE_NODE_TYPES.has(_0xcea1d3)) return { kind: '', url: '', localPath: '' };
  if (_0xcea1d3 === 'storyboard') {
    const _0x124692 = Array.isArray(_0x3a2964?.cells) ? _0x3a2964.cells[0] : null;
    return {
      kind: 'image',
      url: pickMediaUrl(
        _0x124692?.url,
        _0x3a2964?.sourceUrl,
        _0x3a2964?.imageUrl,
        _0x3a2964?.src,
        _0x3a2964?.localPath,
      ),
      localPath: pickLocalMediaPath(
        _0x124692?.localPath,
        _0x124692?.url,
        _0x3a2964?.localPath,
        _0x3a2964?.sourceUrl,
        _0x3a2964?.imageUrl,
        _0x3a2964?.src,
      ),
    };
  }
  if (_0xcea1d3 === 'source-image')
    return {
      kind: 'image',
      url: pickMediaUrl(
        _0x3a2964?.localPath,
        _0x3a2964?.sourceUrl,
        _0x3a2964?.imageUrl,
        _0x3a2964?.src,
        _0x3a2964?.thumbUrl,
      ),
      localPath: pickLocalMediaPath(
        _0x3a2964?.displayLocalPath,
        _0x3a2964?.localPath,
        _0x3a2964?.originalLocalPath,
        _0x3a2964?.sourceUrl,
        _0x3a2964?.imageUrl,
        _0x3a2964?.src,
        _0x3a2964?.thumbUrl,
      ),
    };
  const _0x4c1de1 = pickMainItem(_0x3a2964?.images, _0x3a2964?.mainImageIndex);
  return {
    kind: 'image',
    url: pickMediaUrl(
      _0x4c1de1?.localPath,
      _0x4c1de1?.sourceUrl,
      _0x4c1de1?.imageUrl,
      _0x4c1de1?.url,
      _0x4c1de1?.thumbUrl,
      _0x3a2964?.localPath,
      _0x3a2964?.sourceUrl,
      _0x3a2964?.imageUrl,
      _0x3a2964?.src,
      _0x3a2964?.thumbUrl,
    ),
    localPath: pickLocalMediaPath(
      _0x4c1de1?.displayLocalPath,
      _0x4c1de1?.localPath,
      _0x4c1de1?.originalLocalPath,
      _0x4c1de1?.sourceUrl,
      _0x4c1de1?.imageUrl,
      _0x4c1de1?.url,
      _0x4c1de1?.thumbUrl,
      _0x3a2964?.displayLocalPath,
      _0x3a2964?.localPath,
      _0x3a2964?.originalLocalPath,
      _0x3a2964?.sourceUrl,
      _0x3a2964?.imageUrl,
      _0x3a2964?.src,
      _0x3a2964?.thumbUrl,
    ),
  };
}
function getElectronClipboardApi() {
  const _0x2bb8ce = globalThis?.window?.electronAPI?.clipboard;
  return _0x2bb8ce && typeof _0x2bb8ce.writeImage === 'function' ? _0x2bb8ce : null;
}
async function copyNodeMediaToElectronClipboard({ url: _0x151334, localPath: _0xef0e69 } = {}) {
  const _0x542952 = getElectronClipboardApi();
  if (!_0x542952) return null;
  const _0x4b0f69 = _0xef0e69 || normalizeLocalMediaPath(_0x151334);
  if (!_0x4b0f69) return { ok: false, reason: 'no-local-path' };
  try {
    const _0x57fd98 = await _0x542952.writeImage({
      localPath: _0x4b0f69,
      text: String(_0x151334 || _0x4b0f69 || ''),
    });
    if (_0x57fd98?.ok)
      return {
        ok: true,
        kind: 'image',
        mimeType: _0x57fd98.mimeType || 'image/png',
        sourceUrl: _0x151334,
        localPath: _0x4b0f69,
        copyPath: 'electron',
      };
    return { ok: false, reason: _0x57fd98?.reason || 'copy-failed', error: _0x57fd98?.error };
  } catch (_0x4222bd) {
    return { ok: false, reason: 'copy-failed', error: _0x4222bd };
  }
}
async function writeImageBlobToClipboard({
  clipboard: _0x2e23bc,
  write: _0x4191d8,
  ClipboardItemCtor: _0xed542b,
  blob: _0x2ef4e0,
  mimeType: _0x12999b,
} = {}) {
  const _0x13bc3b = normalizeImageMimeType(_0x12999b) || 'image/png',
    _0x41c4fd = new _0xed542b({ [_0x13bc3b]: _0x2ef4e0 });
  return (await _0x4191d8.call(_0x2e23bc, [_0x41c4fd]), _0x13bc3b);
}
export async function copyNodeMediaToSystemClipboard(_0x66afbd) {
  const { kind: _0x1a2b5a, url: _0x8a8b3f, localPath: _0x512224 } = resolveNodeMedia(_0x66afbd);
  if (_0x1a2b5a !== 'image' || !_0x8a8b3f) return { ok: false, reason: 'no-media' };
  const _0x433b15 = await copyNodeMediaToElectronClipboard({ url: _0x8a8b3f, localPath: _0x512224 });
  if (_0x433b15?.ok) return _0x433b15;
  const _0x77174 = globalThis?.navigator?.clipboard,
    _0x11057b = _0x77174?.write,
    _0x2ff2d0 = globalThis?.ClipboardItem;
  if (typeof _0x11057b !== 'function' || typeof _0x2ff2d0 !== 'function')
    return { ok: false, reason: 'not-supported' };
  let _0x424ff1 = null,
    _0x386936 = null;
  try {
    ((_0x424ff1 = await fetchRemoteBlob(_0x8a8b3f, { timeout: 0x3a98 })),
      !isBlobLike(_0x424ff1) && (_0x424ff1 = null));
  } catch (_0x3ae6c9) {
    _0x386936 = _0x3ae6c9;
  }
  if (_0x424ff1) {
    const _0x3df42d = resolveImageMimeType(_0x424ff1, _0x8a8b3f) || 'image/png';
    try {
      const _0x56dfa3 = await writeImageBlobToClipboard({
        clipboard: _0x77174,
        write: _0x11057b,
        ClipboardItemCtor: _0x2ff2d0,
        blob: _0x424ff1,
        mimeType: _0x3df42d,
      });
      return { ok: true, kind: 'image', mimeType: _0x56dfa3, sourceUrl: _0x8a8b3f, copyPath: 'direct' };
    } catch (_0x5a90dc) {
      _0x386936 = _0x5a90dc;
    }
  }
  try {
    let _0x36d22b = null;
    _0x424ff1 && (_0x36d22b = await convertImageBlobToPngBlob(_0x424ff1));
    !isBlobLike(_0x36d22b) && (_0x36d22b = await convertImageUrlToPngBlob(_0x8a8b3f));
    if (!isBlobLike(_0x36d22b)) return { ok: false, reason: 'copy-failed', error: _0x386936 };
    const _0x3b19a3 = await writeImageBlobToClipboard({
      clipboard: _0x77174,
      write: _0x11057b,
      ClipboardItemCtor: _0x2ff2d0,
      blob: _0x36d22b,
      mimeType: 'image/png',
    });
    return { ok: true, kind: 'image', mimeType: _0x3b19a3, sourceUrl: _0x8a8b3f, copyPath: 'png-fallback' };
  } catch (_0x49c070) {
    return { ok: false, reason: 'copy-failed', error: _0x49c070 || _0x386936 };
  }
}
