import { saveMediaDownload } from '../services/downloadSaveService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const DEFAULT_MEDIA_EXTENSIONS = Object['freeze']({ image: 'png', video: 'mp4' }),
  MEDIA_MIME_EXTENSIONS = Object['freeze']({
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  });
function normalizeText(_0x527457) {
  return String(_0x527457 ?? '')['trim']();
}
function escapeHtml(_0x472beb) {
  return String(_0x472beb ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function resolveMediaExtension(_0x4c4077, _0x868d5c) {
  const _0x4ae243 = normalizeText(_0x4c4077),
    _0x5ed50e = _0x4ae243['match'](/^data:([^;,]+)/i)?.[0x1]?.['toLowerCase']();
  if (_0x5ed50e && MEDIA_MIME_EXTENSIONS[_0x5ed50e]) return MEDIA_MIME_EXTENSIONS[_0x5ed50e];
  return (
    _0x4ae243['split'](/[?#]/, 0x1)[0x0]
      ['match'](/\.([a-z0-9]{2,5})$/i)?.[0x1]
      ?.['toLowerCase']() || DEFAULT_MEDIA_EXTENSIONS[_0x868d5c]
  );
}
function sanitizeFilenameBase(_0x4ec8a1, _0x4cd448) {
  return (
    normalizeText(_0x4ec8a1)
      ['replace'](/[\\/:*?"<>|]+/g, '-')
      ['replace'](/-+/g, '-')
      ['replace'](/[.\s-]+$/g, '')
      ['slice'](0x0, 0x60) || _0x4cd448
  );
}
export function buildWorkspaceMediaDownloadPayload({
  kind: kind = 'image',
  mediaRef: _0x18b2ff,
  filenameBase: _0x4cff71,
  title: _0x231aee,
} = {}) {
  const _0x49dd51 = Object['hasOwn'](DEFAULT_MEDIA_EXTENSIONS, kind) ? kind : '',
    _0x1016ec = normalizeText(_0x18b2ff);
  if (!_0x49dd51 || !_0x1016ec) return null;
  const _0xa1b65b = normalizeLocalPath(_0x1016ec);
  if (!_0xa1b65b) return null;
  const _0x25057d = _0x49dd51 === 'video' ? '生成视频' : '生成图片',
    _0x1d23d0 = _0x49dd51 === 'video' ? '下载视频' : '下载图片';
  return {
    kind: _0x49dd51,
    localPath: _0xa1b65b,
    url: localPathToUrl(_0xa1b65b),
    filename: sanitizeFilenameBase(_0x4cff71, _0x25057d) + '.' + resolveMediaExtension(_0x1016ec, _0x49dd51),
    title: normalizeText(_0x231aee) || _0x1d23d0,
  };
}
export async function saveWorkspaceMediaDownload({
  kind: kind = 'image',
  mediaRef: _0x1536ff,
  filenameBase: _0x27b480,
  title: _0x45dbd9,
  saveMedia: saveMedia = saveMediaDownload,
} = {}) {
  const _0x34f8b0 = kind === 'video' ? 'video' : 'image',
    _0x37b5bc = _0x34f8b0 === 'video' ? '视频' : '图片',
    _0x1a30e2 = buildWorkspaceMediaDownloadPayload({
      kind: _0x34f8b0,
      mediaRef: _0x1536ff,
      filenameBase: _0x27b480,
      title: _0x45dbd9,
    });
  if (!_0x1a30e2) {
    if (normalizeText(_0x1536ff)) throw new Error(_0x37b5bc + '尚未成功保存到本地，请重新生成后再下载。');
    throw new Error('当前没有可下载的' + _0x37b5bc + '。');
  }
  if (typeof saveMedia !== 'function') throw new Error(_0x37b5bc + '保存服务尚未初始化。');
  return await saveMedia(_0x1a30e2);
}
export function renderWorkspaceMediaDownloadButton({
  action: _0x24185a,
  enabled: enabled = ![],
  className: className = '',
  label: _0x225de4,
} = {}) {
  if (!enabled) return '';
  const _0x474f3d = normalizeText(className),
    _0x1f90a4 = normalizeText(_0x225de4) || '下载媒体';
  return (
    '<button type="button" class="workspace-image-download-button' +
    (_0x474f3d ? '\x20' + escapeHtml(_0x474f3d) : '') +
    '\x22\x20data-story-action=\x22' +
    escapeHtml(_0x24185a) +
    '" aria-label="' +
    escapeHtml(_0x1f90a4) +
    '\x22\x20title=\x22' +
    escapeHtml(_0x1f90a4) +
    '"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v4h14v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
  );
}
export async function runWorkspaceMediaDownloadAction(_0x4b176c, _0x2adfef) {
  if (!_0x4b176c || typeof _0x2adfef !== 'function') return null;
  if (_0x4b176c['classList']?.['contains']?.('is-pending')) return null;
  const _0x5b8303 = Boolean(_0x4b176c['disabled']),
    _0x310441 = _0x4b176c['getAttribute']?.('aria-busy');
  ((_0x4b176c['disabled'] = !![]),
    _0x4b176c['classList']?.['add']?.('is-pending'),
    _0x4b176c['setAttribute']?.('aria-busy', 'true'));
  try {
    return await _0x2adfef();
  } finally {
    ((_0x4b176c['disabled'] = _0x5b8303),
      _0x4b176c['classList']?.['remove']?.('is-pending'),
      _0x310441 === null || _0x310441 === undefined
        ? _0x4b176c['removeAttribute']?.('aria-busy')
        : _0x4b176c['setAttribute']?.('aria-busy', _0x310441));
  }
}
