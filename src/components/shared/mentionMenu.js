export function createMentionMenuItem({
  label: label = '',
  subtitle: subtitle = '',
  disabled: disabled = ![],
  hasSubmenu: hasSubmenu = ![],
  compactVisual: compactVisual = ![],
} = {}) {
  const item = document['createElement']('div');
  item['className'] =
    'at-mention-item' +
    (disabled ? ' at-mention-disabled disabled' : '') +
    (hasSubmenu ? ' at-mention-has-submenu' : '') +
    (compactVisual ? ' at-mention-compact-visual' : '');
  const copyEl = document['createElement']('span');
  copyEl['className'] = 'at-mention-copy';
  const labelEl = document['createElement']('span');
  ((labelEl['className'] = 'at-mention-label'), (labelEl['textContent'] = label));
  const subtitleEl = document['createElement']('span');
  return (
    (subtitleEl['className'] = 'at-mention-subtitle'),
    (subtitleEl['textContent'] = subtitle),
    (subtitleEl['hidden'] = !subtitle),
    copyEl['appendChild'](labelEl),
    copyEl['appendChild'](subtitleEl),
    item['classList']['toggle']('at-mention-has-subtitle', Boolean(subtitle)),
    { item: item, copyEl: copyEl, labelEl: labelEl, subtitleEl: subtitleEl }
  );
}
export function positionMentionMenu(el, box) {
  const count = Number(globalThis['window']?.['innerWidth'] || 0x0),
    count2 = Number(globalThis['window']?.['innerHeight'] || 0x0),
    value = 0xc,
    key = 0x5;
  el['style']['maxHeight'] = '';
  const box2 = el['getBoundingClientRect']?.(),
    count3 = Math['max'](0x0, Number(box2?.['width'] || el['offsetWidth'] || 0x0)),
    index = Math['max'](0x1, Number(box2?.['height'] || el['offsetHeight'] || 0x0));
  let result = Number(box['left'] || 0x0),
    data = Number(box['top'] || 0x0);
  if (count > 0x0 && count3 > 0x0)
    result = Math['min'](Math['max'](value, result), Math['max'](value, count - value - count3));
  if (count2 > 0x0) {
    const options = Math['max'](0x0, count2 - value - data),
      target = Number['isFinite'](box['anchorTop']) ? Number(box['anchorTop']) : data - key,
      source = Math['max'](0x0, target - value),
      next = index > options && source > options,
      current = Math['max'](0x1, Math['min'](index, next ? source : options));
    ((el['style']['maxHeight'] = current + 'px'),
      (data = next
        ? Math['max'](value, target - key - current)
        : Math['min'](Math['max'](value, data), Math['max'](value, count2 - value - current))));
  }
  ((el['style']['left'] = result + 'px'), (el['style']['top'] = data + 'px'));
}
