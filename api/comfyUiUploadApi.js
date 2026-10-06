import { get, post } from './requester.js';
import {
  DEFAULT_COMFYUI_BASE_URL,
  normalizeComfyUiBaseUrl,
  shouldAllowCloudComfyUiBaseUrl,
} from './adapters/ComfyUiAdapter.js';
const IMAGE_EXTENSIONS = new Set(['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp']),
  VIDEO_EXTENSIONS = new Set(['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'webm']),
  AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'weba']),
  MEDIA_EXTENSIONS_BY_KIND = Object.freeze({
    image: IMAGE_EXTENSIONS,
    video: VIDEO_EXTENSIONS,
    audio: AUDIO_EXTENSIONS,
  }),
  MIME_EXTENSION_MAP = Object.freeze({
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/webm': 'weba',
    'audio/x-m4a': 'm4a',
    'audio/x-wav': 'wav',
    'image/apng': 'apng',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/avi': 'avi',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpg',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
    'video/x-matroska': 'mkv',
    'video/x-msvideo': 'avi',
  }),
  FALLBACK_EXTENSION_BY_KIND = Object.freeze({ image: 'png', video: 'mp4', audio: 'wav' });
function normalizeText(value, item = '') {
  const key = String(value ?? '').trim();
  return key || item;
}
function isCanvasLocalMediaReference(index) {
  return /^\/?(data\/uploads|data\/assets|output|uploads|temp|tmp|local)\//i.test(normalizeText(index));
}
function normalizeMediaKind(result) {
  const data = String(result || 'image')
    .trim()
    .toLowerCase();
  return MEDIA_EXTENSIONS_BY_KIND[data] ? data : 'image';
}
function getAllowedExtensions(options) {
  return MEDIA_EXTENSIONS_BY_KIND[normalizeMediaKind(options)] || IMAGE_EXTENSIONS;
}
function isComfyUiFileReference(target, source = 'image') {
  const text = normalizeText(target);
  if (!text) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return false;
  if (text.startsWith('/') || /[\\?#]/.test(text)) return false;
  if (text.split('/').some((next) => next === '.' || next === '..')) return false;
  if (isCanvasLocalMediaReference(text)) return false;
  const current = text.split('.').pop()?.toLowerCase() || '';
  return getAllowedExtensions(source).has(current);
}
function normalizeFetchUrl(entry) {
  const text2 = normalizeText(entry);
  if (!text2) return '';
  if (
    /^https?:\/\//i.test(text2) ||
    text2.startsWith('/') ||
    text2.startsWith('data:') ||
    text2.startsWith('blob:')
  )
    return text2;
  if (/^(data|output|uploads|temp|tmp)\//i.test(text2)) return '/' + text2;
  return text2;
}
function getExtensionForBlob(record, payload = 'image') {
  const text3 = normalizeText(record?.type).toLowerCase(),
    mediaKind = normalizeMediaKind(payload);
  return MIME_EXTENSION_MAP[text3] || FALLBACK_EXTENSION_BY_KIND[mediaKind];
}
function sanitizeFileName(handle) {
  return normalizeText(handle)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}
function inferFileName(state, config, scope = 'image') {
  const extensionForBlob = getExtensionForBlob(config, scope),
    map = getAllowedExtensions(scope);
  let decodeURIComponent2 = '';
  try {
    const uRL = new URL(String(state || ''), 'http://aic.local');
    decodeURIComponent2 = decodeURIComponent(uRL.pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    decodeURIComponent2 =
      String(state || '')
        .split(/[?#]/, 1)[0]
        .split(/[\\/]/)
        .filter(Boolean)
        .pop() || '';
  }
  let list = sanitizeFileName(decodeURIComponent2) || 'aic-comfyui-input.' + extensionForBlob;
  const input = list.includes('.') ? list.split('.').pop().toLowerCase() : '';
  if (!map.has(input)) list = list + '.' + extensionForBlob;
  return list;
}
function buildComfyUiUploadUrl(output) {
  const baseUrl = normalizeComfyUiBaseUrl(output || DEFAULT_COMFYUI_BASE_URL),
    map2 = new URLSearchParams({ baseUrl: baseUrl });
  return (
    shouldAllowCloudComfyUiBaseUrl(baseUrl) && map2.set('allowCloudBaseUrl', '1'),
    '/api/v2/comfyui/upload?' + map2.toString()
  );
}
function getUploadedFileRecord(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled)) return {};
  if (enabled.data && typeof enabled.data === 'object' && !Array.isArray(enabled.data))
    return enabled.data;
  return enabled;
}
function resolveUploadedComfyUiFileName(value2) {
  const error = getUploadedFileRecord(value2),
    text4 = normalizeText(
      error.name || error.filename || error.fileName || error.file?.name || error.file,
    );
  if (!text4) throw new Error('ComfyUI 媒体上传未返回文件名');
  const text5 = normalizeText(error.subfolder || error.folder).replace(/^\/+|\/+$/g, '');
  return text5 ? text5 + '/' + text4 : text4;
}
export async function uploadMediaInputToComfyUi(value3, { baseUrl: baseUrl2, kind: kind = 'image' } = {}) {
  const mediaKind2 = normalizeMediaKind(kind),
    text6 = normalizeText(value3);
  if (!text6) return '';
  if (isComfyUiFileReference(text6, mediaKind2)) return text6;
  const fetchUrl = normalizeFetchUrl(text6),
    get2 = await get(fetchUrl, {
      provider: 'remote',
      buildUrl: false,
      responseType: 'blob',
      timeout: 60000,
    }),
    formData = new FormData();
  (formData.append('image', get2, inferFileName(text6, get2, mediaKind2)),
    formData.append('type', 'input'),
    formData.append('overwrite', 'true'));
  const post2 = await post(buildComfyUiUploadUrl(baseUrl2), formData, {
    provider: 'comfyui',
    timeout: 60000,
  });
  return resolveUploadedComfyUiFileName(post2);
}
export async function uploadImageInputToComfyUi(value4, args = {}) {
  return uploadMediaInputToComfyUi(value4, { ...args, kind: 'image' });
}
export async function uploadInputToComfyUi(value5, value6 = {}) {
  return uploadMediaInputToComfyUi(value5, value6);
}
