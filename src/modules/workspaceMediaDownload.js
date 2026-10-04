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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function resolveMediaExtension(key, index) {
  const text = normalizeText(key),
    result = text['match'](/^data:([^;,]+)/i)?.[0x1]?.['toLowerCase']();
  if (result && MEDIA_MIME_EXTENSIONS[result]) return MEDIA_MIME_EXTENSIONS[result];
  return (
    text['split'](/[?#]/, 0x1)[0x0]
      ['match'](/\.([a-z0-9]{2,5})$/i)?.[0x1]
      ?.['toLowerCase']() || DEFAULT_MEDIA_EXTENSIONS[index]
  );
}
function sanitizeFilenameBase(data, options) {
  return (
    normalizeText(data)
      ['replace'](/[\\/:*?"<>|]+/g, '-')
      ['replace'](/-+/g, '-')
      ['replace'](/[.\s-]+$/g, '')
      ['slice'](0x0, 0x60) || options
  );
}
export function buildWorkspaceMediaDownloadPayload({
  kind: kind = 'image',
  mediaRef: mediaRef,
  filenameBase: filenameBase,
  title: title,
} = {}) {
  const kind2 = Object['hasOwn'](DEFAULT_MEDIA_EXTENSIONS, kind) ? kind : '',
    text2 = normalizeText(mediaRef);
  if (!kind2 || !text2) return null;
  const localPath = normalizeLocalPath(text2);
  if (!localPath) return null;
  const target = kind2 === 'video' ? '生成视频' : '生成图片',
    source = kind2 === 'video' ? '下载视频' : '下载图片';
  return {
    kind: kind2,
    localPath: localPath,
    url: localPathToUrl(localPath),
    filename: sanitizeFilenameBase(filenameBase, target) + '.' + resolveMediaExtension(text2, kind2),
    title: normalizeText(title) || source,
  };
}
export async function saveWorkspaceMediaDownload({
  kind: kind = 'image',
  mediaRef: mediaRef2,
  filenameBase: filenameBase2,
  title: title2,
  saveMedia: saveMedia = saveMediaDownload,
} = {}) {
  const kind3 = kind === 'video' ? 'video' : 'image',
    next = kind3 === 'video' ? '视频' : '图片',
    workspaceMediaDownloadPayload = buildWorkspaceMediaDownloadPayload({
      kind: kind3,
      mediaRef: mediaRef2,
      filenameBase: filenameBase2,
      title: title2,
    });
  if (!workspaceMediaDownloadPayload) {
    if (normalizeText(mediaRef2)) throw new Error(next + '尚未成功保存到本地，请重新生成后再下载。');
    throw new Error('当前没有可下载的' + next + '。');
  }
  if (typeof saveMedia !== 'function') throw new Error(next + '保存服务尚未初始化。');
  return await saveMedia(workspaceMediaDownloadPayload);
}
export function renderWorkspaceMediaDownloadButton({
  action: action,
  enabled: enabled = ![],
  className: className = '',
  label: label,
} = {}) {
  if (!enabled) return '';
  const text3 = normalizeText(className),
    text4 = normalizeText(label) || '下载媒体';
  return (
    '<button type="button" class="workspace-image-download-button' +
    (text3 ? '\x20' + escapeHtml(text3) : '') +
    '\x22\x20data-story-action=\x22' +
    escapeHtml(action) +
    '" aria-label="' +
    escapeHtml(text4) +
    '\x22\x20title=\x22' +
    escapeHtml(text4) +
    '"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v4h14v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
  );
}
export async function runWorkspaceMediaDownloadAction(el, handler) {
  if (!el || typeof handler !== 'function') return null;
  if (el['classList']?.['contains']?.('is-pending')) return null;
  const current = Boolean(el['disabled']),
    entry = el['getAttribute']?.('aria-busy');
  ((el['disabled'] = !![]),
    el['classList']?.['add']?.('is-pending'),
    el['setAttribute']?.('aria-busy', 'true'));
  try {
    return await handler();
  } finally {
    ((el['disabled'] = current),
      el['classList']?.['remove']?.('is-pending'),
      entry === null || entry === undefined
        ? el['removeAttribute']?.('aria-busy')
        : el['setAttribute']?.('aria-busy', entry));
  }
}
