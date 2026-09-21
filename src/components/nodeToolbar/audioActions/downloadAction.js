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
function firstNonEmptyString(..._0x3a08ce) {
  for (const _0x15a165 of _0x3a08ce) {
    const _0x34f5ef = String(_0x15a165 || '').trim();
    if (_0x34f5ef) return _0x34f5ef;
  }
  return '';
}
function normalizeAudioDownloadUrl(_0x576d88) {
  const _0x212fbb = String(_0x576d88 || '').trim();
  if (!_0x212fbb) return '';
  if (/^(?:https?:|blob:|data:)/i.test(_0x212fbb)) return _0x212fbb;
  if (_0x212fbb.startsWith('/')) return _0x212fbb;
  return '/' + _0x212fbb.replace(/^\/+/, '');
}
function safeDecode(_0x42e57d) {
  try {
    return decodeURIComponent(_0x42e57d);
  } catch {
    return _0x42e57d;
  }
}
function basenameFromUrl(_0x3f8cf8) {
  const _0x3e257c = String(_0x3f8cf8 || '').trim();
  if (!_0x3e257c || _0x3e257c.startsWith('data:') || _0x3e257c.startsWith('blob:')) return '';
  try {
    const _0x2b1afb = new URL(_0x3e257c, globalThis.location?.href || 'http://localhost/');
    return safeDecode(_0x2b1afb.pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    const _0x24ab7b = _0x3e257c.split('#')[0].split('?')[0].replace(/\\/g, '/');
    return safeDecode(_0x24ab7b.split('/').filter(Boolean).pop() || '');
  }
}
function sanitizeFileName(_0x63808) {
  return String(_0x63808 || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 160);
}
function getFileExtension(_0x3a9767) {
  const _0x306e24 = basenameFromUrl(_0x3a9767) || String(_0x3a9767 || '').trim(),
    _0x327e08 = _0x306e24.match(/\.([a-z0-9]{1,8})$/i);
  return String(_0x327e08?.[1] || '').toLowerCase();
}
function getAudioExtension(..._0x415c08) {
  for (const _0x508e1e of _0x415c08) {
    const _0x254bdc = getFileExtension(_0x508e1e);
    if (AUDIO_EXTENSIONS.has(_0x254bdc)) return _0x254bdc;
  }
  return 'mp3';
}
function ensureAudioFileExtension(_0x1891c1, _0x3608dc) {
  const _0x3ac89f = sanitizeFileName(_0x1891c1);
  if (!_0x3ac89f) return 'audio.' + (_0x3608dc || 'mp3');
  if (/\.[a-z0-9]{1,8}$/i.test(_0x3ac89f)) return _0x3ac89f;
  return _0x3ac89f + '.' + (_0x3608dc || 'mp3');
}
export function resolveAudioDownloadTarget({
  nodeData: nodeData = {},
  audioElement: audioElement = null,
} = {}) {
  const _0x9a8cf9 = firstNonEmptyString(
      nodeData.localPath,
      nodeData.audioUrl,
      nodeData.src,
      nodeData.url,
      nodeData.resultUrl,
      audioElement?.currentSrc,
      audioElement?.src,
    ),
    _0x56dd1d = normalizeAudioDownloadUrl(_0x9a8cf9);
  if (!_0x56dd1d) return null;
  const _0x5d8ab7 = getAudioExtension(
      nodeData.fileName,
      nodeData.localPath,
      nodeData.audioUrl,
      nodeData.src,
      nodeData.url,
      nodeData.resultUrl,
      _0x56dd1d,
    ),
    _0x2babf5 = firstNonEmptyString(
      nodeData.fileName,
      basenameFromUrl(nodeData.localPath),
      basenameFromUrl(nodeData.audioUrl),
      basenameFromUrl(nodeData.src),
      basenameFromUrl(nodeData.url),
      basenameFromUrl(nodeData.resultUrl),
      basenameFromUrl(_0x56dd1d),
      nodeData.name,
    );
  return { url: _0x56dd1d, filename: ensureAudioFileExtension(_0x2babf5, _0x5d8ab7) };
}
export function triggerAudioDownload(_0x34446d, _0x105d7a = globalThis.document) {
  if (!_0x34446d?.url || !_0x105d7a?.createElement || !_0x105d7a?.body) return false;
  const _0x4ce1ff = _0x105d7a.createElement('a');
  ((_0x4ce1ff.href = _0x34446d.url),
    (_0x4ce1ff.download = _0x34446d.filename || 'audio.mp3'),
    (_0x4ce1ff.rel = 'noopener'),
    _0x105d7a.body.appendChild(_0x4ce1ff),
    _0x4ce1ff.click(),
    _0x4ce1ff.remove?.());
  if (_0x4ce1ff.parentNode) _0x4ce1ff.parentNode.removeChild(_0x4ce1ff);
  return true;
}
export function bindAudioDownloadAction({
  button: _0xdd5c6f,
  getNodeData: _0xdb8b11,
  getAudioElement: _0x2bafb8,
  notifyMissing: _0x4b5370,
  documentRef: documentRef = globalThis.document,
} = {}) {
  if (!_0xdd5c6f) return () => {};
  const _0x44a53c = (_0x34a8f) => {
    (_0x34a8f?.preventDefault?.(), _0x34a8f?.stopPropagation?.());
    const _0x1b9222 = resolveAudioDownloadTarget({
      nodeData: typeof _0xdb8b11 === 'function' ? _0xdb8b11() : {},
      audioElement: typeof _0x2bafb8 === 'function' ? _0x2bafb8() : null,
    });
    if (!_0x1b9222) {
      if (typeof _0x4b5370 === 'function') _0x4b5370();
      return;
    }
    triggerAudioDownload(_0x1b9222, documentRef);
  };
  return (
    _0xdd5c6f.addEventListener('click', _0x44a53c),
    () => _0xdd5c6f.removeEventListener('click', _0x44a53c)
  );
}
