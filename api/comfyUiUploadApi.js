import { get, post } from './requester.js';
import {
  DEFAULT_COMFYUI_BASE_URL,
  normalizeComfyUiBaseUrl,
  shouldAllowCloudComfyUiBaseUrl,
} from './adapters/ComfyUiAdapter.js';
const IMAGE_EXTENSIONS = new Set(['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp']),
  VIDEO_EXTENSIONS = new Set(['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'webm']),
  AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'weba']),
  MEDIA_EXTENSIONS_BY_KIND = Object['freeze']({
    image: IMAGE_EXTENSIONS,
    video: VIDEO_EXTENSIONS,
    audio: AUDIO_EXTENSIONS,
  }),
  MIME_EXTENSION_MAP = Object['freeze']({
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
  FALLBACK_EXTENSION_BY_KIND = Object['freeze']({ image: 'png', video: 'mp4', audio: 'wav' });
function normalizeText(_0x3304e9, _0x59b4a7 = '') {
  const _0x414c18 = String(_0x3304e9 ?? '')['trim']();
  return _0x414c18 || _0x59b4a7;
}
function isCanvasLocalMediaReference(_0x47860b) {
  return /^\/?(data\/uploads|data\/assets|output|uploads|temp|tmp|local)\//i['test'](
    normalizeText(_0x47860b),
  );
}
function normalizeMediaKind(_0x3a7aa6) {
  const _0x367d4a = String(_0x3a7aa6 || 'image')
    ['trim']()
    ['toLowerCase']();
  return MEDIA_EXTENSIONS_BY_KIND[_0x367d4a] ? _0x367d4a : 'image';
}
function getAllowedExtensions(_0x1e375b) {
  return MEDIA_EXTENSIONS_BY_KIND[normalizeMediaKind(_0x1e375b)] || IMAGE_EXTENSIONS;
}
function isComfyUiFileReference(_0x6a0a12, _0x39a6fc = 'image') {
  const _0x36dd76 = normalizeText(_0x6a0a12);
  if (!_0x36dd76) return ![];
  if (/^[a-z][a-z0-9+.-]*:/i['test'](_0x36dd76)) return ![];
  if (_0x36dd76['startsWith']('/') || /[\\?#]/['test'](_0x36dd76)) return ![];
  if (_0x36dd76['split']('/')['some']((_0x51474f) => _0x51474f === '.' || _0x51474f === '..')) return ![];
  if (isCanvasLocalMediaReference(_0x36dd76)) return ![];
  const _0x585b7a = _0x36dd76['split']('.')['pop']()?.['toLowerCase']() || '';
  return getAllowedExtensions(_0x39a6fc)['has'](_0x585b7a);
}
function normalizeFetchUrl(_0x56eff5) {
  const _0x212d3b = normalizeText(_0x56eff5);
  if (!_0x212d3b) return '';
  if (
    /^https?:\/\//i['test'](_0x212d3b) ||
    _0x212d3b['startsWith']('/') ||
    _0x212d3b['startsWith']('data:') ||
    _0x212d3b['startsWith']('blob:')
  )
    return _0x212d3b;
  if (/^(data|output|uploads|temp|tmp)\//i['test'](_0x212d3b)) return '/' + _0x212d3b;
  return _0x212d3b;
}
function getExtensionForBlob(_0x3f7a4e, _0x1d3c95 = 'image') {
  const _0x536bbc = normalizeText(_0x3f7a4e?.['type'])['toLowerCase'](),
    _0x51388b = normalizeMediaKind(_0x1d3c95);
  return MIME_EXTENSION_MAP[_0x536bbc] || FALLBACK_EXTENSION_BY_KIND[_0x51388b];
}
function sanitizeFileName(_0x350cdd) {
  return normalizeText(_0x350cdd)
    ['replace'](/[\\/:*?"<>|]+/g, '_')
    ['replace'](/\s+/g, '_')
    ['replace'](/^_+|_+$/g, '');
}
function inferFileName(_0x3f734e, _0x5a5392, _0x34be98 = 'image') {
  const _0x5c6cb8 = getExtensionForBlob(_0x5a5392, _0x34be98),
    _0x41d8db = getAllowedExtensions(_0x34be98);
  let _0xac884 = '';
  try {
    const _0x192d28 = new URL(String(_0x3f734e || ''), 'http://aic.local');
    _0xac884 = decodeURIComponent(_0x192d28['pathname']['split']('/')['filter'](Boolean)['pop']() || '');
  } catch {
    _0xac884 =
      String(_0x3f734e || '')
        ['split'](/[?#]/, 0x1)[0x0]
        ['split'](/[\\/]/)
        ['filter'](Boolean)
        ['pop']() || '';
  }
  let _0x162fc3 = sanitizeFileName(_0xac884) || 'aic-comfyui-input.' + _0x5c6cb8;
  const _0x3e3911 = _0x162fc3['includes']('.') ? _0x162fc3['split']('.')['pop']()['toLowerCase']() : '';
  if (!_0x41d8db['has'](_0x3e3911)) _0x162fc3 = _0x162fc3 + '.' + _0x5c6cb8;
  return _0x162fc3;
}
function buildComfyUiUploadUrl(_0x5ab2bd) {
  const _0x34913a = normalizeComfyUiBaseUrl(_0x5ab2bd || DEFAULT_COMFYUI_BASE_URL),
    _0x1af985 = new URLSearchParams({ baseUrl: _0x34913a });
  return (
    shouldAllowCloudComfyUiBaseUrl(_0x34913a) && _0x1af985['set']('allowCloudBaseUrl', '1'),
    '/api/v2/comfyui/upload?' + _0x1af985['toString']()
  );
}
function getUploadedFileRecord(_0xcba6ed) {
  if (!_0xcba6ed || typeof _0xcba6ed !== 'object' || Array['isArray'](_0xcba6ed)) return {};
  if (_0xcba6ed['data'] && typeof _0xcba6ed['data'] === 'object' && !Array['isArray'](_0xcba6ed['data']))
    return _0xcba6ed['data'];
  return _0xcba6ed;
}
function resolveUploadedComfyUiFileName(_0x4dfd40) {
  const _0x2dd81f = getUploadedFileRecord(_0x4dfd40),
    _0x326c11 = normalizeText(
      _0x2dd81f['name'] ||
        _0x2dd81f['filename'] ||
        _0x2dd81f['fileName'] ||
        _0x2dd81f['file']?.['name'] ||
        _0x2dd81f['file'],
    );
  if (!_0x326c11) throw new Error('ComfyUI 媒体上传未返回文件名');
  const _0x568e8f = normalizeText(_0x2dd81f['subfolder'] || _0x2dd81f['folder'])['replace'](/^\/+|\/+$/g, '');
  return _0x568e8f ? _0x568e8f + '/' + _0x326c11 : _0x326c11;
}
export async function uploadMediaInputToComfyUi(
  _0x4af321,
  { baseUrl: _0x56774b, kind: kind = 'image' } = {},
) {
  const _0xe61d8b = normalizeMediaKind(kind),
    _0x7a0e6b = normalizeText(_0x4af321);
  if (!_0x7a0e6b) return '';
  if (isComfyUiFileReference(_0x7a0e6b, _0xe61d8b)) return _0x7a0e6b;
  const _0x374954 = normalizeFetchUrl(_0x7a0e6b),
    _0x423a71 = await get(_0x374954, {
      provider: 'remote',
      buildUrl: ![],
      responseType: 'blob',
      timeout: 0xea60,
    }),
    _0x5a7e68 = new FormData();
  (_0x5a7e68['append']('image', _0x423a71, inferFileName(_0x7a0e6b, _0x423a71, _0xe61d8b)),
    _0x5a7e68['append']('type', 'input'),
    _0x5a7e68['append']('overwrite', 'true'));
  const _0x3aa0d7 = await post(buildComfyUiUploadUrl(_0x56774b), _0x5a7e68, {
    provider: 'comfyui',
    timeout: 0xea60,
  });
  return resolveUploadedComfyUiFileName(_0x3aa0d7);
}
export async function uploadImageInputToComfyUi(_0x14465d, _0x4ee2f3 = {}) {
  return uploadMediaInputToComfyUi(_0x14465d, { ..._0x4ee2f3, kind: 'image' });
}
export async function uploadInputToComfyUi(_0x91eef0, _0x232cf5 = {}) {
  return uploadMediaInputToComfyUi(_0x91eef0, _0x232cf5);
}
