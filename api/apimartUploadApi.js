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
export function normalizeApimartBaseUrl(value) {
  return String(value || DEFAULT_APIMART_BASE_URL)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
}
export function buildApimartPresignUrl(item) {
  const apimartBaseUrl = normalizeApimartBaseUrl(item);
  try {
    const uRL = new URL(apimartBaseUrl),
      key = uRL.hostname.toLowerCase().replace(/^api\./, '');
    return uRL.protocol + '//' + key + '/api/upload/presign';
  } catch {
    return 'https://apib.ai/api/upload/presign';
  }
}
function getBlobType(index, result) {
  return String(index?.type || result || 'application/octet-stream').trim();
}
function extensionFromContentType(data, options) {
  const target = String(data || '').toLowerCase(),
    source = {
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
  return source[target] || String(options || '').replace(/^\./, '') || 'bin';
}
function isApimartUploadUrl(next) {
  try {
    const uRL2 = new URL(String(next || ''));
    return APIMART_UPLOAD_CDN_HOSTS.includes(uRL2.hostname.toLowerCase());
  } catch {
    return false;
  }
}
export function isApimartAssetUrl(current) {
  return /^asset:\/\//i.test(String(current || '').trim());
}
export function isApimartReusableUrl(entry) {
  return isApimartAssetUrl(entry) || isApimartUploadUrl(entry);
}
export async function uploadBlobToApimart(enabled, timeout = {}) {
  if (!enabled) throw new Error('APIMART 上传文件不能为空');
  const enabled2 = String(timeout.apiKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
  if (!enabled2) throw new Error('APIMART API Key 未配置，无法上传素材');
  const blobType = getBlobType(enabled, timeout.contentType),
    extensionFromContentType2 = extensionFromContentType(blobType, timeout.fileExtension),
    formData = new FormData();
  (formData.append('file', enabled, timeout.filename || 'upload.' + extensionFromContentType2),
    formData.append('contentType', blobType),
    formData.append('fileExtension', extensionFromContentType2),
    formData.append('permanent', timeout.permanent === true ? '1' : '0'),
    formData.append('apiKey', enabled2),
    formData.append('apiUrl', normalizeApimartBaseUrl(timeout.apiUrl)));
  const response = await post('/api/v2/proxy/apimart-upload', formData, {
      provider: 'apimart',
      timeout: timeout.uploadTimeout || 5 * 60 * 0x3e8,
    }),
    enabled3 = response?.cdnUrl || response?.url || '';
  if (!enabled3) throw new Error('APIMART 上传返回 URL 为空');
  return String(enabled3).trim();
}
export async function uploadImageToApimart(record, contentType = {}) {
  return await uploadBlobToApimart(record, {
    ...contentType,
    contentType: contentType.contentType || getBlobType(record, 'image/jpeg'),
    fileExtension: contentType.fileExtension || 'jpg',
  });
}
export async function uploadVideoToApimart(payload, contentType2 = {}) {
  return await uploadBlobToApimart(payload, {
    ...contentType2,
    contentType: contentType2.contentType || getBlobType(payload, 'video/mp4'),
    fileExtension: contentType2.fileExtension || 'mp4',
  });
}
export function isApimartUploadedUrl(handle) {
  return isApimartUploadUrl(handle);
}
