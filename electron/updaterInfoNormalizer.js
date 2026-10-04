const PREVIEW_VIDEO_META_RE = /^\[(?:previewVideoUrl|preview_video_url|videoUrl)\]\s*:\s*(\S+)\s*$/im;
function firstNonEmptyString(...args) {
  for (const value of args) {
    const item = String(value || '').trim();
    if (item) return item;
  }
  return '';
}
function normalizeReleaseNotesItem(dom) {
  if (dom && typeof dom === 'object') return firstNonEmptyString(dom.note, dom.notes, dom.body);
  return String(dom || '');
}
export function normalizeReleaseNotes(list) {
  if (Array.isArray(list)) return list.map(normalizeReleaseNotesItem).filter(Boolean).join('\n');
  return String(list || '');
}
export function extractPreviewVideoUrlFromNotes(key) {
  const index = String(key || '').match(PREVIEW_VIDEO_META_RE);
  return String(index?.[1] || '').trim();
}
export function normalizeUpdaterInfoPayload(result, data = {}) {
  const options = result && typeof result === 'object' ? result : {},
    releaseNotes = normalizeReleaseNotes(options.releaseNotes),
    previewVideoUrl = firstNonEmptyString(
      options.previewVideoUrl,
      options.preview_video_url,
      extractPreviewVideoUrlFromNotes(releaseNotes),
    ),
    target = previewVideoUrl
      ? ''
      : firstNonEmptyString(
          data.localPreviewVideoUrl,
          typeof data.readLocalPreviewVideoUrl === 'function' ? data.readLocalPreviewVideoUrl() : '',
        );
  return {
    version: String(options.version || ''),
    releaseName: String(options.releaseName || ''),
    releaseDate: String(options.releaseDate || ''),
    releaseNotes: releaseNotes,
    previewVideoUrl: previewVideoUrl || target,
  };
}
