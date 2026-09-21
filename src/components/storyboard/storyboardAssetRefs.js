import {
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  resolveStoryboardCellPreviewSrc,
} from '../../core/storyboardCellUtils.js';
export function normalizeStoryboardLocalImageUrl(_0x43c8d7) {
  const _0xb80075 = typeof _0x43c8d7 === 'string' ? _0x43c8d7.trim() : '';
  if (!_0xb80075) return '';
  if (
    _0xb80075.startsWith('/') ||
    _0xb80075.startsWith('http://') ||
    _0xb80075.startsWith('https://') ||
    _0xb80075.startsWith('blob:') ||
    _0xb80075.startsWith('data:')
  )
    return _0xb80075;
  return '/' + _0xb80075;
}
export function getStoryboardCellSourceImageUrl(_0x563720) {
  if (!_0x563720 || typeof _0x563720 !== 'object') return '';
  if (isStoryboardCellEmpty(_0x563720)) return '';
  return (
    normalizeStoryboardLocalImageUrl(_0x563720.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x563720.sourceUrl)
  );
}
export function getStoryboardPuzzleSourceImageUrl(_0x2f0274) {
  const _0x369b79 =
    normalizeStoryboardLocalImageUrl(_0x2f0274?.storyboardSourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x2f0274?.storyboardSourceUrl) ||
    normalizeStoryboardLocalImageUrl(_0x2f0274?.storyboardBackdropLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x2f0274?.storyboardBackdropUrl) ||
    normalizeStoryboardLocalImageUrl(_0x2f0274?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x2f0274?.sourceUrl);
  if (_0x369b79) return _0x369b79;
  const _0x30a872 = Array.isArray(_0x2f0274?.cells) ? _0x2f0274.cells : [];
  for (const _0x17c99c of _0x30a872) {
    const _0x285ab6 =
      normalizeStoryboardLocalImageUrl(_0x17c99c?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(_0x17c99c?.sourceUrl);
    if (_0x285ab6) return _0x285ab6;
  }
  return '';
}
export function getStoryboardCellLiveSourceImageUrl(_0xe742f9, _0x58f2bd) {
  if (isFrozenStoryboardDisplayCell(_0xe742f9)) return '';
  const _0x1056a8 = getStoryboardCellSourceImageUrl(_0xe742f9);
  if (_0x1056a8) return _0x1056a8;
  if (!_0xe742f9 || typeof _0xe742f9 !== 'object' || isStoryboardCellEmpty(_0xe742f9)) return '';
  if (_0xe742f9.storyboardPiece === true) return getStoryboardPuzzleSourceImageUrl(_0x58f2bd);
  return '';
}
export function getStoryboardCellSourceDisplayUrl(_0x55da17, _0x1c5d73) {
  if (isFrozenStoryboardDisplayCell(_0x55da17)) return '';
  const _0x2b4f7f = getStoryboardCellLiveSourceImageUrl(_0x55da17, _0x1c5d73);
  if (!_0x2b4f7f || !_0x55da17 || typeof _0x55da17 !== 'object') return '';
  if (isStoryboardCellEmpty(_0x55da17)) return '';
  const _0x450738 = !!getStoryboardCellSourceImageUrl(_0x55da17);
  if (
    _0x450738 ||
    _0x55da17.storyboardSourceCrop === true ||
    _0x55da17.storyboardPiece === true ||
    _0x55da17.storyboardLockedCell === true
  )
    return _0x2b4f7f;
  return '';
}
export function getStoryboardCellDisplayImageUrl(_0x4f7d78, _0x950076) {
  return (
    getStoryboardCellSourceDisplayUrl(_0x4f7d78, _0x950076) || resolveStoryboardCellPreviewSrc(_0x4f7d78)
  );
}
export function getStoryboardCellResidualImageUrl(_0x2567f7) {
  if (!_0x2567f7 || typeof _0x2567f7 !== 'object') return '';
  return (
    normalizeStoryboardLocalImageUrl(_0x2567f7.residualImageLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x2567f7.residualImageUrl)
  );
}
export function getStoryboardBackdropImageUrl(_0x337c05) {
  const _0x5af9fd =
    normalizeStoryboardLocalImageUrl(_0x337c05?.storyboardBackdropLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.storyboardBackdropUrl) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.storyboardSourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.storyboardSourceUrl) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.sourceUrl);
  if (_0x5af9fd) return _0x5af9fd;
  const _0x47e217 = Array.isArray(_0x337c05?.cells) ? _0x337c05.cells : [];
  for (const _0xccf873 of _0x47e217) {
    const _0x1f44e2 =
      normalizeStoryboardLocalImageUrl(_0xccf873?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(_0xccf873?.sourceUrl);
    if (_0x1f44e2) return _0x1f44e2;
  }
  const _0x1bc79d =
    normalizeStoryboardLocalImageUrl(_0x337c05?.localPath) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.imageUrl) ||
    normalizeStoryboardLocalImageUrl(_0x337c05?.src);
  if (_0x1bc79d) return _0x1bc79d;
  for (const _0x12589f of _0x47e217) {
    const _0x557b6a = getStoryboardCellResidualImageUrl(_0x12589f);
    if (_0x557b6a) return _0x557b6a;
  }
  return '';
}
export function getStoryboardCellCommitSourceUrl(_0x242277, _0x25388b) {
  if (isFrozenStoryboardDisplayCell(_0x242277)) return '';
  const _0x5d57a5 =
    normalizeStoryboardLocalImageUrl(_0x242277?.sourceLocalPath) ||
    normalizeStoryboardLocalImageUrl(_0x242277?.sourceUrl);
  if (_0x5d57a5) return _0x5d57a5;
  if (!_0x242277 || isStoryboardCellEmpty(_0x242277)) return '';
  if (_0x242277.storyboardPiece === true || _0x242277.storyboardLockedCell === true)
    return (
      normalizeStoryboardLocalImageUrl(_0x25388b?.storyboardSourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(_0x25388b?.storyboardSourceUrl) ||
      normalizeStoryboardLocalImageUrl(_0x25388b?.storyboardBackdropLocalPath) ||
      normalizeStoryboardLocalImageUrl(_0x25388b?.storyboardBackdropUrl) ||
      normalizeStoryboardLocalImageUrl(_0x25388b?.sourceLocalPath) ||
      normalizeStoryboardLocalImageUrl(_0x25388b?.sourceUrl)
    );
  return '';
}
export function isStoryboardCellSourceCropRequired(_0xef798) {
  if (!_0xef798 || typeof _0xef798 !== 'object' || isStoryboardCellEmpty(_0xef798)) return false;
  if (isFrozenStoryboardDisplayCell(_0xef798)) return false;
  return (
    _0xef798.storyboardPiece === true ||
    _0xef798.storyboardLockedCell === true ||
    _0xef798.storyboardSourceCrop === true
  );
}
