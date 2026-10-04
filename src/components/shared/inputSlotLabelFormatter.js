export function escapeInputSlotLabelHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
export function formatInputSlotLabelHtml(item) {
  const list = String(item ?? '')['trim']();
  if (!list) return '';
  if (/^[\u4e00-\u9fff]{4}$/['test'](list))
    return (
      escapeInputSlotLabelHtml(list['slice'](0x0, 0x2)) +
      '<br>' +
      escapeInputSlotLabelHtml(list['slice'](0x2))
    );
  if (/^[\u4e00-\u9fff]{5}$/['test'](list))
    return (
      escapeInputSlotLabelHtml(list['slice'](0x0, 0x3)) +
      '<br>' +
      escapeInputSlotLabelHtml(list['slice'](0x3))
    );
  return escapeInputSlotLabelHtml(list)['replace'](/\s+/g, '<br>');
}
