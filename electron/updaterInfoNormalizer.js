const PREVIEW_VIDEO_META_RE = /^\[(?:previewVideoUrl|preview_video_url|videoUrl)\]\s*:\s*(\S+)\s*$/im;
function firstNonEmptyString(..._0x2aaaa1) {
  for (const _0x4a7410 of _0x2aaaa1) {
    const _0x591827 = String(_0x4a7410 || '').trim();
    if (_0x591827) return _0x591827;
  }
  return '';
}
function normalizeReleaseNotesItem(_0x44e737) {
  if (_0x44e737 && typeof _0x44e737 === 'object')
    return firstNonEmptyString(_0x44e737.note, _0x44e737.notes, _0x44e737.body);
  return String(_0x44e737 || '');
}
export function normalizeReleaseNotes(_0x1d53ab) {
  if (Array.isArray(_0x1d53ab)) return _0x1d53ab.map(normalizeReleaseNotesItem).filter(Boolean).join('\n');
  return String(_0x1d53ab || '');
}
export function extractPreviewVideoUrlFromNotes(_0x37f3a0) {
  const _0x1e5a85 = String(_0x37f3a0 || '').match(PREVIEW_VIDEO_META_RE);
  return String(_0x1e5a85?.[1] || '').trim();
}
export function normalizeUpdaterInfoPayload(_0x28500e, _0x396711 = {}) {
  const _0x485e21 = _0x28500e && typeof _0x28500e === 'object' ? _0x28500e : {},
    _0x55058f = normalizeReleaseNotes(_0x485e21.releaseNotes),
    _0x110002 = firstNonEmptyString(
      _0x485e21.previewVideoUrl,
      _0x485e21.preview_video_url,
      extractPreviewVideoUrlFromNotes(_0x55058f),
    ),
    _0xe9aec3 = _0x110002
      ? ''
      : firstNonEmptyString(
          _0x396711.localPreviewVideoUrl,
          typeof _0x396711.readLocalPreviewVideoUrl === 'function'
            ? _0x396711.readLocalPreviewVideoUrl()
            : '',
        );
  return {
    version: String(_0x485e21.version || ''),
    releaseName: String(_0x485e21.releaseName || ''),
    releaseDate: String(_0x485e21.releaseDate || ''),
    releaseNotes: _0x55058f,
    previewVideoUrl: _0x110002 || _0xe9aec3,
  };
}
