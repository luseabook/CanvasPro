export function escapeInputSlotLabelHtml(_0x3a038a) {
  return String(_0x3a038a ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
export function formatInputSlotLabelHtml(_0x43290b) {
  const _0x499734 = String(_0x43290b ?? '')['trim']();
  if (!_0x499734) return '';
  if (/^[\u4e00-\u9fff]{4}$/['test'](_0x499734))
    return (
      escapeInputSlotLabelHtml(_0x499734['slice'](0x0, 0x2)) +
      '<br>' +
      escapeInputSlotLabelHtml(_0x499734['slice'](0x2))
    );
  if (/^[\u4e00-\u9fff]{5}$/['test'](_0x499734))
    return (
      escapeInputSlotLabelHtml(_0x499734['slice'](0x0, 0x3)) +
      '<br>' +
      escapeInputSlotLabelHtml(_0x499734['slice'](0x3))
    );
  return escapeInputSlotLabelHtml(_0x499734)['replace'](/\s+/g, '<br>');
}
