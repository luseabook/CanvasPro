import {
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  resolveStoryboardCellPreviewSrc,
} from '../../core/storyboardCellUtils.js';
export function normalizeStoryboardLocalImageUrl(value) {
  const enabled = typeof value === 'string' ? value.trim() : '';
  if (!enabled) return '';
  if (
    enabled.startsWith('/') ||
    enabled.startsWith('http://') ||
    enabled.startsWith('https://') ||
    enabled.startsWith('blob:') ||
    enabled.startsWith('data:')
  )
    return enabled;
  return '/' + enabled;
}
export function getStoryboardCellSourceImageUrl(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return '';
  if (isStoryboardCellEmpty(enabled2)) return '';
  return (
    normalizeStoryboardLocalImageUrl(enabled2.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(enabled2.sourceUrl)
  );
}
export function getStoryboardPuzzleSourceImageUrl(item) {
  const storyboardLocalImageUrl =
    normalizeStoryboardLocalImageUrl(item?.storyboardSourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(item?.storyboardSourceUrl) ||
    normalizeStoryboardLocalImageUrl(item?.storyboardBackdropLocalPath) ||
    normalizeStoryboardLocalImageUrl(item?.storyboardBackdropUrl) ||
    normalizeStoryboardLocalImageUrl(item?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(item?.sourceUrl);
  if (storyboardLocalImageUrl) return storyboardLocalImageUrl;
  const key = Array.isArray(item?.cells) ? item.cells : [];
  for (const index of key) {
    const storyboardLocalImageUrl2 =
      normalizeStoryboardLocalImageUrl(index?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(index?.sourceUrl);
    if (storyboardLocalImageUrl2) return storyboardLocalImageUrl2;
  }
  return '';
}
export function getStoryboardCellLiveSourceImageUrl(enabled3, result) {
  if (isFrozenStoryboardDisplayCell(enabled3)) return '';
  const storyboardCellSourceImageUrl = getStoryboardCellSourceImageUrl(enabled3);
  if (storyboardCellSourceImageUrl) return storyboardCellSourceImageUrl;
  if (!enabled3 || typeof enabled3 !== 'object' || isStoryboardCellEmpty(enabled3)) return '';
  if (enabled3.storyboardPiece === true) return getStoryboardPuzzleSourceImageUrl(result);
  return '';
}
export function getStoryboardCellSourceDisplayUrl(enabled4, data) {
  if (isFrozenStoryboardDisplayCell(enabled4)) return '';
  const storyboardCellLiveSourceImageUrl = getStoryboardCellLiveSourceImageUrl(enabled4, data);
  if (!storyboardCellLiveSourceImageUrl || !enabled4 || typeof enabled4 !== 'object') return '';
  if (isStoryboardCellEmpty(enabled4)) return '';
  const options = !!getStoryboardCellSourceImageUrl(enabled4);
  if (
    options ||
    enabled4.storyboardSourceCrop === true ||
    enabled4.storyboardPiece === true ||
    enabled4.storyboardLockedCell === true
  )
    return storyboardCellLiveSourceImageUrl;
  return '';
}
export function getStoryboardCellDisplayImageUrl(target, source) {
  return getStoryboardCellSourceDisplayUrl(target, source) || resolveStoryboardCellPreviewSrc(target);
}
export function getStoryboardCellResidualImageUrl(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return '';
  return (
    normalizeStoryboardLocalImageUrl(enabled5.residualImageLocalPath) ||
    normalizeStoryboardLocalImageUrl(enabled5.residualImageUrl)
  );
}
export function getStoryboardBackdropImageUrl(next) {
  const storyboardLocalImageUrl3 =
    normalizeStoryboardLocalImageUrl(next?.storyboardBackdropLocalPath) ||
    normalizeStoryboardLocalImageUrl(next?.storyboardBackdropUrl) ||
    normalizeStoryboardLocalImageUrl(next?.storyboardSourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(next?.storyboardSourceUrl) ||
    normalizeStoryboardLocalImageUrl(next?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(next?.sourceUrl);
  if (storyboardLocalImageUrl3) return storyboardLocalImageUrl3;
  const current = Array.isArray(next?.cells) ? next.cells : [];
  for (const entry of current) {
    const storyboardLocalImageUrl4 =
      normalizeStoryboardLocalImageUrl(entry?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(entry?.sourceUrl);
    if (storyboardLocalImageUrl4) return storyboardLocalImageUrl4;
  }
  const storyboardLocalImageUrl5 =
    normalizeStoryboardLocalImageUrl(next?.localPath) ||
    normalizeStoryboardLocalImageUrl(next?.imageUrl) ||
    normalizeStoryboardLocalImageUrl(next?.src);
  if (storyboardLocalImageUrl5) return storyboardLocalImageUrl5;
  for (const record of current) {
    const storyboardCellResidualImageUrl = getStoryboardCellResidualImageUrl(record);
    if (storyboardCellResidualImageUrl) return storyboardCellResidualImageUrl;
  }
  return '';
}
export function getStoryboardCellCommitSourceUrl(enabled6, payload) {
  if (isFrozenStoryboardDisplayCell(enabled6)) return '';
  const storyboardLocalImageUrl6 =
    normalizeStoryboardLocalImageUrl(enabled6?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(enabled6?.sourceUrl);
  if (storyboardLocalImageUrl6) return storyboardLocalImageUrl6;
  if (!enabled6 || isStoryboardCellEmpty(enabled6)) return '';
  if (enabled6.storyboardPiece === true || enabled6.storyboardLockedCell === true)
    return (
      normalizeStoryboardLocalImageUrl(payload?.storyboardSourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(payload?.storyboardSourceUrl) ||
      normalizeStoryboardLocalImageUrl(payload?.storyboardBackdropLocalPath) ||
      normalizeStoryboardLocalImageUrl(payload?.storyboardBackdropUrl) ||
      normalizeStoryboardLocalImageUrl(payload?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(payload?.sourceUrl)
    );
  return '';
}
export function isStoryboardCellSourceCropRequired(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object' || isStoryboardCellEmpty(enabled7)) return false;
  if (isFrozenStoryboardDisplayCell(enabled7)) return false;
  return (
    enabled7.storyboardPiece === true ||
    enabled7.storyboardLockedCell === true ||
    enabled7.storyboardSourceCrop === true
  );
}
