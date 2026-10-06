import { randomBytes } from 'node:crypto';
import { createReadStream, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
const PREVIEWABLE_MEDIA_PATTERN =
    /\.(?:png|jpe?g|webp|gif|bmp|avif|mp4|webm|mov|m4v|mp3|wav|m4a|aac|ogg|flac)$/i,
  MIME_BY_EXTENSION = Object.freeze({
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
  });
function requireFunction(value, name) {
  if (typeof value !== 'function') throw new TypeError(name + ' must be a function');
  return value;
}
export function parseLocalPreviewRange(rangeHeader, size) {
  const totalSize = Number(size),
    match = String(rangeHeader || '').match(/^bytes=(\d*)-(\d*)$/);
  if (!match || !Number.isSafeInteger(totalSize) || totalSize <= 0) return null;
  const startText = match[1],
    endText = match[2];
  let start = startText ? Number.parseInt(startText, 10) : 0,
    end = endText ? Number.parseInt(endText, 10) : totalSize - 1;
  if (!startText && endText) {
    const suffixLength = Number.parseInt(endText, 10);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    ((start = Math.max(0, totalSize - suffixLength)), (end = totalSize - 1));
  }
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || end < start || start >= totalSize) return null;
  return { start: start, end: Math.min(end, totalSize - 1) };
}
export function isPreviewableLocalMedia(fileInfo = {}, filePath = '') {
  const type = String(fileInfo?.type || '').toLowerCase();
  if (type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/'))
    return true;
  return PREVIEWABLE_MEDIA_PATTERN.test(String(filePath || ''));
}
export function getLocalPreviewMimeType(filePath, type = '') {
  const normalizedType = String(type || '').toLowerCase();
  if (
    normalizedType.startsWith('image/') ||
    normalizedType.startsWith('video/') ||
    normalizedType.startsWith('audio/')
  )
    return normalizedType;
  return (
    MIME_BY_EXTENSION[path.extname(String(filePath || '')).toLowerCase()] || 'application/octet-stream'
  );
}
export function createLocalPreviewProtocolRuntime({
  protocol: protocolApi,
  scheme: scheme,
  appOrigin: appOrigin,
  ttlMs: ttlMs,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
  now: now = Date.now,
  createToken: createToken = () => randomBytes(24).toString('hex'),
  resolveRealPath: resolveRealPath = realpathSync,
  statFile: statFile = statSync,
  createFileReadStream: createFileReadStream = createReadStream,
  toWebStream: toWebStream = (stream) => Readable.toWeb(stream),
  ResponseCtor: ResponseCtor = globalThis.Response,
  URLCtor: URLCtor = globalThis.URL,
  logWarning: logWarning = (...args) => console.warn(...args),
} = {}) {
  if (!protocolApi?.handle) throw new TypeError('protocol.handle must be a function');
  const resolveVirtualPath = requireFunction(resolveLocalVirtualPath, 'resolveLocalVirtualPath'),
    clock = requireFunction(now, 'now'),
    mintToken = requireFunction(createToken, 'createToken'),
    entryTtlMs = Math.max(1, Number(ttlMs) || 1),
    entries = new Map();
  let installed = false;
  function resolveSourcePath(request = {}) {
    const directPath = String(request?.path || '').trim();
    return (
      directPath || resolveVirtualPath(request?.localPath || request?.url || request?.src || '')
    );
  }
  function clearExpired() {
    const currentTime = clock();
    for (const [token, entry] of entries.entries()) {
      (!entry || Number(entry.expiresAt || 0) <= currentTime) && entries.delete(token);
    }
  }
  function createUrl(request = {}) {
    const sourcePath = resolveSourcePath(request);
    if (!sourcePath) throw new Error('缺少文件路径');
    if (!path.isAbsolute(sourcePath)) throw new Error('文件路径必须是绝对路径');
    const realPath = resolveRealPath(sourcePath),
      fileStat = statFile(realPath);
    if (!fileStat.isFile()) throw new Error('只支持预览文件');
    if (!isPreviewableLocalMedia(request, realPath)) throw new Error('只支持图片或视频快速预览');
    clearExpired();
    const token = String(mintToken() || '').trim();
    if (!token) throw new Error('无法创建预览令牌');
    const mimeType = getLocalPreviewMimeType(realPath, request?.type || '');
    entries.set(token, {
      path: realPath,
      mimeType: mimeType,
      size: fileStat.size,
      expiresAt: clock() + entryTtlMs,
    });
    const basename = encodeURIComponent(path.basename(realPath));
    return scheme + '://preview/' + token + '/' + basename;
  }
  function install() {
    if (installed) return false;
    return (
      (installed = true),
      protocolApi.handle(scheme, (request) => {
        try {
          clearExpired();
          const requestUrl = new URLCtor(request.url),
            token = decodeURIComponent(requestUrl.pathname.split('/').filter(Boolean)[0] || ''),
            entry = entries.get(token);
          if (!entry) return new ResponseCtor('Preview not found', { status: 404 });
          const fileStat = statFile(entry.path);
          if (!fileStat.isFile())
            return (entries.delete(token), new ResponseCtor('Preview not found', { status: 404 }));
          const totalSize = fileStat.size,
            range = parseLocalPreviewRange(request.headers.get('range'), totalSize),
            headers = {
              'Content-Type': entry.mimeType,
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': appOrigin,
              'Cache-Control': 'private, max-age=' + Math.floor(entryTtlMs / 1000) + ', immutable',
            };
          if (range)
            return (
              (headers['Content-Range'] = 'bytes ' + range.start + '-' + range.end + '/' + totalSize),
              (headers['Content-Length'] = String(range.end - range.start + 1)),
              new ResponseCtor(
                toWebStream(
                  createFileReadStream(entry.path, {
                    start: range.start,
                    end: range.end,
                  }),
                ),
                { status: 206, headers: headers },
              )
            );
          return (
            (headers['Content-Length'] = String(totalSize)),
            new ResponseCtor(toWebStream(createFileReadStream(entry.path)), {
              status: 200,
              headers: headers,
            })
          );
        } catch (error) {
          return (
            logWarning('[electron] local preview failed:', error),
            new ResponseCtor('Preview failed', { status: 500 })
          );
        }
      }),
      true
    );
  }
  return { clearExpired: clearExpired, createUrl: createUrl, install: install };
}
