const AUDIO_EXTENSIONS = new Set([
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
]);
function firstNonEmptyString(...args) {
  for (const value of args) {
    const item = String(value || '').trim();
    if (item) return item;
  }
  return '';
}
function normalizeAudioDownloadUrl(key) {
  const enabled = String(key || '').trim();
  if (!enabled) return '';
  if (/^(?:https?:|blob:|data:)/i.test(enabled)) return enabled;
  if (enabled.startsWith('/')) return enabled;
  return '/' + enabled.replace(/^\/+/, '');
}
function safeDecode(index) {
  try {
    return decodeURIComponent(index);
  } catch {
    return index;
  }
}
function basenameFromUrl(result) {
  const enabled2 = String(result || '').trim();
  if (!enabled2 || enabled2.startsWith('data:') || enabled2.startsWith('blob:')) return '';
  try {
    const uRL = new URL(enabled2, globalThis.location?.href || 'http://localhost/');
    return safeDecode(uRL.pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    const data = enabled2.split('#')[0].split('?')[0].replace(/\\/g, '/');
    return safeDecode(data.split('/').filter(Boolean).pop() || '');
  }
}
function sanitizeFileName(options) {
  return String(options || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 160);
}
function getFileExtension(target) {
  const basenameFromUrl2 = basenameFromUrl(target) || String(target || '').trim(),
    source = basenameFromUrl2.match(/\.([a-z0-9]{1,8})$/i);
  return String(source?.[1] || '').toLowerCase();
}
function getAudioExtension(...args2) {
  for (const next of args2) {
    const fileExtension = getFileExtension(next);
    if (AUDIO_EXTENSIONS.has(fileExtension)) return fileExtension;
  }
  return 'mp3';
}
function ensureAudioFileExtension(current, entry) {
  const sanitizeFileName2 = sanitizeFileName(current);
  if (!sanitizeFileName2) return 'audio.' + (entry || 'mp3');
  if (/\.[a-z0-9]{1,8}$/i.test(sanitizeFileName2)) return sanitizeFileName2;
  return sanitizeFileName2 + '.' + (entry || 'mp3');
}
export function resolveAudioDownloadTarget({
  nodeData: nodeData = {},
  audioElement: audioElement = null,
} = {}) {
  const nonEmptyString = firstNonEmptyString(
      nodeData.localPath,
      nodeData.audioUrl,
      nodeData.src,
      nodeData.url,
      nodeData.resultUrl,
      audioElement?.currentSrc,
      audioElement?.src,
    ),
    url = normalizeAudioDownloadUrl(nonEmptyString);
  if (!url) return null;
  const audioExtension = getAudioExtension(
      nodeData.fileName,
      nodeData.localPath,
      nodeData.audioUrl,
      nodeData.src,
      nodeData.url,
      nodeData.resultUrl,
      url,
    ),
    nonEmptyString2 = firstNonEmptyString(
      nodeData.fileName,
      basenameFromUrl(nodeData.localPath),
      basenameFromUrl(nodeData.audioUrl),
      basenameFromUrl(nodeData.src),
      basenameFromUrl(nodeData.url),
      basenameFromUrl(nodeData.resultUrl),
      basenameFromUrl(url),
      nodeData.name,
    );
  return { url: url, filename: ensureAudioFileExtension(nonEmptyString2, audioExtension) };
}
export function triggerAudioDownload(response, el = globalThis.document) {
  if (!response?.url || !el?.createElement || !el?.body) return false;
  const el2 = el.createElement('a');
  ((el2.href = response.url),
    (el2.download = response.filename || 'audio.mp3'),
    (el2.rel = 'noopener'),
    el.body.appendChild(el2),
    el2.click(),
    el2.remove?.());
  if (el2.parentNode) el2.parentNode.removeChild(el2);
  return true;
}
export function bindAudioDownloadAction({
  button: button,
  getNodeData: getNodeData,
  getAudioElement: getAudioElement,
  notifyMissing: notifyMissing,
  documentRef: documentRef = globalThis.document,
} = {}) {
  if (!button) return () => {};
  const record = (event) => {
    (event?.preventDefault?.(), event?.stopPropagation?.());
    const audioDownloadTarget = resolveAudioDownloadTarget({
      nodeData: typeof getNodeData === 'function' ? getNodeData() : {},
      audioElement: typeof getAudioElement === 'function' ? getAudioElement() : null,
    });
    if (!audioDownloadTarget) {
      if (typeof notifyMissing === 'function') notifyMissing();
      return;
    }
    triggerAudioDownload(audioDownloadTarget, documentRef);
  };
  return (button.addEventListener('click', record), () => button.removeEventListener('click', record));
}
