import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  resolveImageMimeType,
} from './imagePngConversionService.js';
import { saveOutputBlob } from './projectService.js';
import { localPathToUrl, normalizeLocalPath as normalizeLocalPath_2 } from '../utils/localMediaPath.js';
import { t } from '../i18n/index.js';
function panoramaSceneText(_0x75a025, _0x365033 = {}) {
  return t('panoramaSceneNode.' + _0x75a025, _0x365033);
}
function normalizeMediaUrl(_0x1b1d17) {
  const _0x1247fa = String(_0x1b1d17 || '').trim();
  if (!_0x1247fa) return '';
  if (/^(https?:|blob:|data:)/i.test(_0x1247fa)) return _0x1247fa;
  return localPathToUrl(_0x1247fa);
}
function normalizeLocalPath(_0x4169d8) {
  return normalizeLocalPath_2(_0x4169d8);
}
function inferFileNameFromPath(_0x2a5ba8) {
  const _0x43158f = String(_0x2a5ba8 || '').trim();
  if (!_0x43158f) return '';
  const _0x58bb0a = _0x43158f.split('#')[0].split('?')[0],
    _0x526595 = _0x58bb0a.split(/[\\/]/).filter(Boolean);
  return _0x526595[_0x526595.length - 1] || '';
}
function stripKnownImageExtension(_0x5dab8d) {
  return String(_0x5dab8d || '').replace(/\.(png|jpg|jpeg|webp|gif|bmp|avif|svg)$/i, '');
}
function ensurePngFileName(_0x87e184) {
  const _0x2620d9 = stripKnownImageExtension(String(_0x87e184 || '').trim()) || 'panorama_input';
  return _0x2620d9 + '.png';
}
function isPngMimeType(_0x5eaf89) {
  return (
    String(_0x5eaf89 || '')
      .trim()
      .toLowerCase() === 'image/png'
  );
}
function isPngLikePath(_0x30abe5) {
  const _0x215a97 = String(_0x30abe5 || '')
    .trim()
    .split('#')[0]
    .split('?')[0]
    .toLowerCase();
  return _0x215a97.endsWith('.png');
}
function resolvePersistentPngSource(_0x135f86, _0xdbeca6) {
  const _0x137582 = normalizeLocalPath(_0x135f86);
  if (_0x137582 && isPngLikePath(_0x137582))
    return { localPath: _0x137582, imageUrl: normalizeMediaUrl(_0x137582) };
  const _0x142024 = normalizeMediaUrl(_0xdbeca6),
    _0x107447 = normalizeLocalPath(_0x142024);
  if (_0x107447 && isPngLikePath(_0x107447))
    return { localPath: _0x107447, imageUrl: normalizeMediaUrl(_0x107447) };
  return null;
}
function resolvePreferredSourceUrl(_0x55bb75, _0x2af710) {
  const _0x146591 = normalizeMediaUrl(_0x55bb75);
  if (_0x146591) return _0x146591;
  return normalizeMediaUrl(_0x2af710);
}
function normalizeSavedPngResult(_0x48582f, _0x14b3ed, _0x56a179) {
  const _0x20be34 = normalizeLocalPath(
      _0x48582f?.originalLocalPath || _0x48582f?.localPath || _0x48582f?.path || '',
    ),
    _0x5ca10f = normalizeMediaUrl(_0x48582f?.originalUrl || _0x48582f?.url || _0x20be34);
  if (!_0x20be34 || !_0x5ca10f) throw new Error(panoramaSceneText('errors.pngSaveInvalidPath'));
  const _0x555819 =
    String(_0x48582f?.filename || '').trim() ||
    inferFileNameFromPath(_0x20be34) ||
    ensurePngFileName(_0x14b3ed);
  return {
    localPath: _0x20be34,
    imageUrl: _0x5ca10f,
    fileName: _0x555819,
    sourceSignature: _0x56a179 || null,
  };
}
export async function ensurePersistedPanoramaInputPng({
  localPath: _0x1f9746,
  imageUrl: _0x4ec9c6,
  fileName: _0x26f46b,
  sourceSignature: _0x10077d,
} = {}) {
  const _0x4bce40 = normalizeLocalPath(_0x1f9746),
    _0x5f04b1 = normalizeMediaUrl(_0x4ec9c6),
    _0x40cbd9 =
      String(_0x26f46b || '').trim() ||
      inferFileNameFromPath(_0x4bce40) ||
      inferFileNameFromPath(_0x5f04b1) ||
      'panorama_input.png',
    _0x527b4b = resolvePersistentPngSource(_0x4bce40, _0x5f04b1);
  if (_0x527b4b)
    return {
      localPath: _0x527b4b.localPath,
      imageUrl: _0x527b4b.imageUrl,
      fileName: inferFileNameFromPath(_0x527b4b.localPath) || ensurePngFileName(_0x40cbd9),
      sourceSignature: _0x10077d || null,
    };
  const _0x51e7aa = resolvePreferredSourceUrl(_0x4bce40, _0x5f04b1);
  if (!_0x51e7aa) throw new Error(panoramaSceneText('errors.panoramaImageInputMissing'));
  let _0x41bade = null;
  try {
    _0x41bade = await fetchRemoteBlob(_0x51e7aa, { timeout: 0x7530 });
  } catch (_0x5b1f09) {
    throw new Error(
      panoramaSceneText('errors.readPanoramaInputFailed', {
        error: String(_0x5b1f09?.message || _0x5b1f09 || panoramaSceneText('errors.unknown')),
      }),
    );
  }
  if (!isBlobLike(_0x41bade)) throw new Error(panoramaSceneText('errors.panoramaInputEmpty'));
  const _0x27415e = resolveImageMimeType(_0x41bade, _0x51e7aa) || inferImageMimeTypeFromUrl(_0x51e7aa);
  let _0x439f0b = _0x41bade;
  !isPngMimeType(_0x27415e) && (_0x439f0b = await convertImageBlobToPngBlob(_0x41bade));
  !isBlobLike(_0x439f0b) && (_0x439f0b = await convertImageUrlToPngBlob(_0x51e7aa));
  if (!isBlobLike(_0x439f0b)) throw new Error(panoramaSceneText('errors.panoramaPngConvertFailed'));
  const _0x34f2b7 = await saveOutputBlob(_0x439f0b, {
    ext: 'png',
    subDir: 'panorama_input_png',
    kind: 'panorama-input-png',
  });
  return normalizeSavedPngResult(_0x34f2b7, _0x40cbd9, _0x10077d);
}
