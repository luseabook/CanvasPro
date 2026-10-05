const LEGACY_VIDEO_RATIO_WRAP_SELECTOR = '.img-ratio-wrap:not([data-ui-schema-composite-field])';
export function getLegacyVideoRatioWrap(footer) {
  return footer?.['querySelector']?.(LEGACY_VIDEO_RATIO_WRAP_SELECTOR) || null;
}
function getLegacyFallbackElement(element) {
  if (!element) return null;
  return element['closest']?.('[data-ui-schema-composite-field]') ? null : element;
}
export function restoreLegacyVideoRatioPopupAfterSync({ footer: footer, fallbackPopup: fallbackPopup } = {}) {
  const applyPopup = () => {
    const popup =
      getLegacyVideoRatioWrap(footer)?.['querySelector']?.('.img-ratio-popup') ||
      getLegacyFallbackElement(fallbackPopup);
    popup?.['classList']?.['add']?.('show');
  };
  applyPopup();
  const scheduleFrame =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 0);
  scheduleFrame(applyPopup);
}
export function syncLegacyVideoRatioFooter({
  footer: footer,
  fallbackLabel: fallbackLabel,
  fallbackIconSlot: fallbackIconSlot,
  labelText: labelText,
  iconHtml: iconHtml,
} = {}) {
  const wrap = getLegacyVideoRatioWrap(footer),
    label = wrap?.['querySelector']?.('.img-ratio-label') || getLegacyFallbackElement(fallbackLabel);
  if (label) label['textContent'] = labelText;
  const iconSlot =
    wrap?.['querySelector']?.('.img-ratio-icon-slot') || getLegacyFallbackElement(fallbackIconSlot);
  if (iconSlot) iconSlot['innerHTML'] = iconHtml;
}
