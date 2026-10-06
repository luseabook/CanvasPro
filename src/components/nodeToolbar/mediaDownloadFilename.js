import { getDownloadUseOriginalFilename } from '../../services/downloadNamingService.js';
const DEFAULT_EXTENSIONS = Object.freeze({ image: 'png', video: 'mp4', audio: 'mp3' }),
  MEDIA_EXTENSIONS = Object.freeze({
    image: new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'tif', 'tiff', 'webp']),
    video: new Set(['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'wmv']),
    audio: new Set([
      'aac',
      'aiff',
      'amr',
      'flac',
      'm4a',
      'mp3',
      'oga',
      'ogg',
      'opus',
      'wav',
      'weba',
      'webm',
      'wma',
    ]),
  });
function trimText(value) {
  return String(value || '').trim();
}
function safeDecode(item) {
  try {
    return decodeURIComponent(item);
  } catch {
    return item;
  }
}
function basenameFromSource(key) {
  const trimText2 = trimText(key);
  if (!trimText2 || /^(?:blob:|data:)/i.test(trimText2)) return '';
  try {
    const uRL = new URL(
      trimText2.replace(/\\/g, '/'),
      globalThis.location?.href || 'http://localhost/',
    );
    return safeDecode(uRL.pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    const index = trimText2.split(/[?#]/, 1)[0].replace(/\\/g, '/');
    return safeDecode(index.split('/').filter(Boolean).pop() || '');
  }
}
function sanitizeFilenamePart(result) {
  return trimText(result)
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();
}
function extensionFromSource(data, options) {
  const basenameFromSource2 = basenameFromSource(data) || trimText(data);
  return extensionFromFilename(basenameFromSource2, options);
}
function extensionFromFilename(target, source) {
  const next = target.match(/\.([a-z0-9]{1,10})$/i),
    current = String(next?.[1] || '').toLowerCase();
  return MEDIA_EXTENSIONS[source]?.has(current) ? current : '';
}
function stripKnownMediaExtension(list) {
  const entry = list.match(/\.([a-z0-9]{1,10})$/i),
    record = String(entry?.[1] || '').toLowerCase(),
    payload = Object.values(MEDIA_EXTENSIONS).some((map) => map.has(record));
  return payload ? list.slice(0, -entry[0].length) : list;
}
function withExtension(handle, list2) {
  const list3 = sanitizeFilenamePart(stripKnownMediaExtension(handle)),
    state = Math.max(1, 160 - list2.length - 1),
    config = list3.slice(0, state).replace(/[. ]+$/g, '');
  return (config || 'media') + '.' + list2;
}
export function resolveNodeMediaDownloadFilename({
  nodeName: nodeName,
  fileName: fileName,
  kind: kind,
  sources: sources = [],
  fallbackBase: fallbackBase,
  useOriginalFilename: useOriginalFilename = getDownloadUseOriginalFilename(),
} = {}) {
  const trimText3 = trimText(kind).toLowerCase(),
    scope = DEFAULT_EXTENSIONS[trimText3] || 'bin',
    list4 = Array.isArray(sources) ? sources : [sources],
    trimText4 = trimText(fileName).replace(/\\/g, '/').split('/').pop(),
    extensionFromFilename2 =
      extensionFromFilename(trimText4, trimText3) ||
      list4.map((input) => extensionFromSource(input, trimText3)).find(Boolean) ||
      scope,
    sanitizeFilenamePart2 = sanitizeFilenamePart(nodeName);
  if (!useOriginalFilename && sanitizeFilenamePart2)
    return withExtension(sanitizeFilenamePart2, extensionFromFilename2);
  const sanitizeFilenamePart3 =
    sanitizeFilenamePart(trimText4) ||
    list4.filter((output) => !useOriginalFilename || extensionFromSource(output, trimText3))
      .map((value2) => sanitizeFilenamePart(basenameFromSource(value2)))
      .find(Boolean);
  return withExtension(
    sanitizeFilenamePart3 || sanitizeFilenamePart2 || fallbackBase || trimText3 || 'media',
    extensionFromFilename2,
  );
}
