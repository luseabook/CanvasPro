import { post } from './requester.js';
import { DEFAULT_APIMART_API_URL } from '../src/modules/providers.js';
const DEFAULT_APIMART_BASE_URL = DEFAULT_APIMART_API_URL,
  APIMART_UPLOAD_CDN_HOSTS = Object.freeze([
    'cdn.apimart.ai',
    'upload.apimart.ai',
    'cdn.apib.ai',
    'upload.apib.ai',
    'cdn.aishuch.com',
    'upload.aishuch.com',
  ]);
export function normalizeApimartBaseUrl(_0x5edd7a) {
  return String(_0x5edd7a || DEFAULT_APIMART_BASE_URL)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
}
export function buildApimartPresignUrl(_0x444b19) {
  const _0x19d27f = normalizeApimartBaseUrl(_0x444b19);
  try {
    const _0x5caf52 = new URL(_0x19d27f),
      _0x47f1fe = _0x5caf52.hostname.toLowerCase().replace(/^api\./, '');
    return _0x5caf52.protocol + '//' + _0x47f1fe + '/api/upload/presign';
  } catch {
    return 'https://apib.ai/api/upload/presign';
  }
}
function getBlobType(_0x44da99, _0x316b79) {
  return String(_0x44da99?.type || _0x316b79 || 'application/octet-stream').trim();
}
function extensionFromContentType(_0x120317, _0x3b3516) {
  const _0x2b7e02 = String(_0x120317 || '').toLowerCase(),
    _0x4474a4 = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mp4': 'm4a',
      'audio/aac': 'aac',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/webm': 'webm',
    };
  return _0x4474a4[_0x2b7e02] || String(_0x3b3516 || '').replace(/^\./, '') || 'bin';
}
function isApimartUploadUrl(_0x2dba7e) {
  try {
    const _0x5bbb70 = new URL(String(_0x2dba7e || ''));
    return APIMART_UPLOAD_CDN_HOSTS.includes(_0x5bbb70.hostname.toLowerCase());
  } catch {
    return false;
  }
}
export function isApimartAssetUrl(_0x3acd7a) {
  return /^asset:\/\//i.test(String(_0x3acd7a || '').trim());
}
export function isApimartReusableUrl(_0x380a10) {
  return isApimartAssetUrl(_0x380a10) || isApimartUploadUrl(_0x380a10);
}
export async function uploadBlobToApimart(_0x239aee, _0x4ffbef = {}) {
  if (!_0x239aee) throw new Error('APIMART 上传文件不能为空');
  const _0x50bebd = String(_0x4ffbef.apiKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
  if (!_0x50bebd) throw new Error('APIMART API Key 未配置，无法上传素材');
  const _0x1c6d3a = getBlobType(_0x239aee, _0x4ffbef.contentType),
    _0x29f35c = extensionFromContentType(_0x1c6d3a, _0x4ffbef.fileExtension),
    _0x58f3e2 = new FormData();
  (_0x58f3e2.append('file', _0x239aee, _0x4ffbef.filename || 'upload.' + _0x29f35c),
    _0x58f3e2.append('contentType', _0x1c6d3a),
    _0x58f3e2.append('fileExtension', _0x29f35c),
    _0x58f3e2.append('permanent', _0x4ffbef.permanent === true ? '1' : '0'),
    _0x58f3e2.append('apiKey', _0x50bebd),
    _0x58f3e2.append('apiUrl', normalizeApimartBaseUrl(_0x4ffbef.apiUrl)));
  const _0x3fe7ad = await post('/api/v2/proxy/apimart-upload', _0x58f3e2, {
      provider: 'apimart',
      timeout: _0x4ffbef.uploadTimeout || 5 * 60 * 0x3e8,
    }),
    _0x30f960 = _0x3fe7ad?.cdnUrl || _0x3fe7ad?.url || '';
  if (!_0x30f960) throw new Error('APIMART 上传返回 URL 为空');
  return String(_0x30f960).trim();
}
export async function uploadImageToApimart(_0x118579, _0x595ace = {}) {
  return await uploadBlobToApimart(_0x118579, {
    ..._0x595ace,
    contentType: _0x595ace.contentType || getBlobType(_0x118579, 'image/jpeg'),
    fileExtension: _0x595ace.fileExtension || 'jpg',
  });
}
export async function uploadVideoToApimart(_0x331f4a, _0x22c548 = {}) {
  return await uploadBlobToApimart(_0x331f4a, {
    ..._0x22c548,
    contentType: _0x22c548.contentType || getBlobType(_0x331f4a, 'video/mp4'),
    fileExtension: _0x22c548.fileExtension || 'mp4',
  });
}
export function isApimartUploadedUrl(_0x12ad78) {
  return isApimartUploadUrl(_0x12ad78);
}
