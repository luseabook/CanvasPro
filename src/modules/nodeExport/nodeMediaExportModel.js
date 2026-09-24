// Shared renderer/main-process contract. No settings, credentials or remote requests.
export const NODE_MEDIA_EXPORT_LIMITS = Object.freeze({
  items: 100, fileBytes: 512 * 1024 * 1024, totalBytes: 2 * 1024 * 1024 * 1024,
});
const EXTENSIONS = Object.freeze({
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'avif', 'tif', 'tiff'],
  video: ['mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi'],
  audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'],
});
export const NODE_MEDIA_EXPORT_ROOTS = Object.freeze(['data/assets/', 'data/uploads/', 'output/']);

export function validateExportMediaPath(value, kind) {
  if (typeof value !== 'string' || value.length > 1024 ||
      /[\\%?#:\x00-\x1f\x7f]/.test(value) || !NODE_MEDIA_EXPORT_ROOTS.some(root => value.startsWith(root))) {
    throw new Error('仅支持已保存到本地素材目录的媒体，不接受远程或绝对路径');
  }
  if (value.split('/').some(part => !part || part === '.' || part === '..' || /[ .]$/.test(part))) {
    throw new Error('媒体路径包含不安全的目录片段');
  }
  const extension = value.split('.').pop().toLowerCase();
  if (!EXTENSIONS[kind]?.includes(extension)) throw new Error('媒体类型与扩展名不匹配或不支持');
  return extension;
}

export function safeExportName(value) {
  const name = String(value || 'media').replace(/[\\/:*?"<>|\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, '_')
    .replace(/[ .]+$/g, '').trim().slice(0, 60).replace(/[ .]+$/g, '');
  return name || 'media';
}

export function normalizeMediaExportItems(payload) {
  if (!Array.isArray(payload?.items) || !payload.items.length || payload.items.length > NODE_MEDIA_EXPORT_LIMITS.items) {
    throw new Error('每批请选择 1–100 个本地媒体节点');
  }
  const ids = new Set();
  return payload.items.map((item, index) => {
    if (!item || typeof item.nodeId !== 'string' || !item.nodeId.trim() || item.nodeId.length > 160 ||
        /[\x00-\x1f\x7f]/.test(item.nodeId) || ids.has(item.nodeId)) throw new Error('节点标识无效或重复');
    ids.add(item.nodeId);
    const extension = validateExportMediaPath(item.localPath, item.kind);
    const name = safeExportName(item.name);
    return { nodeId: item.nodeId, name, kind: item.kind, localPath: item.localPath,
      fileName: `${String(index + 1).padStart(3, '0')}-${name}.${extension}` };
  });
}
