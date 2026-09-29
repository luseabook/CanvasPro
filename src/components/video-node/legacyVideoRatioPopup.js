const LEGACY_VIDEO_RATIO_WRAP_SELECTOR = '.img-ratio-wrap:not([data-ui-schema-composite-field])';
export function getLegacyVideoRatioWrap(_0x3f381e) {
  return _0x3f381e?.['querySelector']?.(LEGACY_VIDEO_RATIO_WRAP_SELECTOR) || null;
}
function getLegacyFallbackElement(_0x45cd36) {
  if (!_0x45cd36) return null;
  return _0x45cd36['closest']?.('[data-ui-schema-composite-field]') ? null : _0x45cd36;
}
export function restoreLegacyVideoRatioPopupAfterSync({ footer: _0x35f427, fallbackPopup: _0x7d9852 } = {}) {
  const _0x2f6d84 = () => {
    const _0x58c709 =
      getLegacyVideoRatioWrap(_0x35f427)?.['querySelector']?.('.img-ratio-popup') ||
      getLegacyFallbackElement(_0x7d9852);
    _0x58c709?.['classList']?.['add']?.('show');
  };
  _0x2f6d84();
  const _0x25ee27 =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (_0xaa57b0) => setTimeout(_0xaa57b0, 0x0);
  _0x25ee27(_0x2f6d84);
}
export function syncLegacyVideoRatioFooter({
  footer: _0x3b80be,
  fallbackLabel: _0xe8a212,
  fallbackIconSlot: _0x15baed,
  labelText: _0x14c318,
  iconHtml: _0x485d9e,
} = {}) {
  const _0x1f69f6 = getLegacyVideoRatioWrap(_0x3b80be),
    _0x1ca30b = _0x1f69f6?.['querySelector']?.('.img-ratio-label') || getLegacyFallbackElement(_0xe8a212);
  if (_0x1ca30b) _0x1ca30b['textContent'] = _0x14c318;
  const _0x3ae285 =
    _0x1f69f6?.['querySelector']?.('.img-ratio-icon-slot') || getLegacyFallbackElement(_0x15baed);
  if (_0x3ae285) _0x3ae285['innerHTML'] = _0x485d9e;
}
