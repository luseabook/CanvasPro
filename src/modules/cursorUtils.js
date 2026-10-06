export function createLinkCursor(options = {}) {
  const value = options && typeof options === 'object' ? options : {},
    item = { small: 24, medium: 36, large: 48 },
    key = { small: 4, medium: 6, large: 8 },
    index = Object.prototype.hasOwnProperty.call(item, value.size) ? value.size : 'small',
    result = value.strokeColor || 'white',
    data = value.fillColor || 'white',
    target = value.fillOpacity ?? '0.18',
    source = value.fallback || 'crosshair',
    next = item[index],
    current = key[index],
    entry =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      next +
      '" height="' +
      next +
      '" viewBox="0 0 24 24" fill="none" stroke="' +
      result +
      '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
      data +
      '" fill-opacity="' +
      target +
      '"/><circle cx="20" cy="20" r="2.5" fill="' +
      result +
      '"/><path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3"/></svg>';
  return (
    'url("data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(entry) +
    '") ' +
    current +
    ' ' +
    current +
    ', ' +
    source
  );
}
export function getCursorSize() {
  return localStorage.getItem('v2-cursor-style') || localStorage.getItem('cursorSize') || 'small';
}
export function applyLinkCursor(el, record = {}) {
  const linkCursor = createLinkCursor(record);
  el.style.setProperty('cursor', linkCursor, 'important');
}
export function removeLinkCursor(el2) {
  el2.style.removeProperty('cursor');
}

export function createRotateCursor(options2 = {}) {
  const payload = options2 && typeof options2 === 'object' ? options2 : {},
    handle = payload.strokeColor || '#17191f',
    state = payload.outlineColor || '#ffffff',
    config = payload.fallback || 'grab',
    scope =
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M20.7 8.1A9 9 0 1 0 22 18.3" stroke="' +
      state +
      '" stroke-width="4.2" stroke-linecap="round"/><path d="M20.7 8.1A9 9 0 1 0 22 18.3" stroke="' +
      handle +
      '" stroke-width="2" stroke-linecap="round"/><path d="M16.5 7.9h4.6V3.3" stroke="' +
      state +
      '" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 7.9h4.6V3.3" stroke="' +
      handle +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scope) + '") 14 14, ' + config;
}
