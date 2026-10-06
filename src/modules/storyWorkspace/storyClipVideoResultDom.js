function normalizeText(value) {
  return String(value || '').trim();
}
export function findStoryClipCardShell(el, item) {
  const text = normalizeText(item);
  return (
    Array.from(el?.querySelectorAll?.('.story-clip-card-shell[data-story-clip-id]') || []).find(
      (el2) => normalizeText(el2.dataset.storyClipId) === text,
    ) || null
  );
}
export function syncStoryClipCardVideoInPlace({
  root: root,
  documentObject: documentObject,
  clipId: clipId,
  resultCount: resultCount,
  refreshThumbnail: refreshThumbnail = false,
  thumbnailMarkup: thumbnailMarkup = '',
} = {}) {
  const el3 = findStoryClipCardShell(root, clipId),
    el4 = el3?.querySelector('.story-clip-card');
  if (!el3 || !el4) return false;
  el3.dataset.storyVideoHistory = String(Number(resultCount) > 1);
  if (!refreshThumbnail) return true;
  let el5 = el4.querySelector('.story-clip-card-media');
  if (!thumbnailMarkup) return (el5?.remove(), el4.classList.remove('has-video-thumbnail'), true);
  return (
    !el5 &&
      ((el5 = documentObject.createElement('span')),
      (el5.className = 'story-clip-card-media'),
      el5.setAttribute('aria-hidden', 'true'),
      el4.querySelector('.story-clip-card-copy')?.before(el5)),
    (el5.innerHTML = thumbnailMarkup),
    el4.classList.add('has-video-thumbnail'),
    true
  );
}
export function syncSelectedClipVideoMetadataInPlace(el6, key, index) {
  const el7 = el6?.querySelector?.('.story-video-result[data-story-video-result-index]');
  if (!el7) return false;
  ((el7.dataset.storyVideoResultIndex = String(key)),
    el7.querySelectorAll('[data-story-video-result-index]').forEach((el8) => {
      el8.dataset.storyVideoResultIndex = String(key);
    }));
  const count = Math.max(1, Number(index) || 1),
    el9 = el7.querySelector('.story-video-result-meta span');
  if (el9) el9.textContent = key + 1 + '/' + count;
  return (
    count < 2 &&
      el7.querySelectorAll('.story-video-result-switch').forEach((el10) => {
        el10.remove();
      }),
    true
  );
}
