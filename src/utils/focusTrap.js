export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  "input:not([disabled]):not([type='hidden'])",
  'select:not([disabled])',
  'textarea:not([disabled])',
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
]['join'](',');
function isFocusable(_0x3f9520) {
  if (!isVisible(_0x3f9520)) return ![];
  if (!_0x3f9520 || _0x3f9520['disabled'] === !![] || _0x3f9520['hidden'] === !![]) return ![];
  if (_0x3f9520['inert'] === !![] || _0x3f9520['getAttribute']?.('aria-hidden') === 'true') return ![];
  if (_0x3f9520['closest']?.('[hidden],\x20[aria-hidden=\x27true\x27],\x20[inert]')) return ![];
  if (Number['isFinite'](Number(_0x3f9520['tabIndex'])) && Number(_0x3f9520['tabIndex']) < 0x0) return ![];
  return typeof _0x3f9520['focus'] === 'function';
}
function focusProgrammatically(_0x99472d) {
  if (!isVisible(_0x99472d)) return ![];
  if (!_0x99472d || _0x99472d['disabled'] === !![] || _0x99472d['hidden'] === !![]) return ![];
  if (_0x99472d['inert'] === !![] || _0x99472d['getAttribute']?.('aria-hidden') === 'true') return ![];
  if (_0x99472d['closest']?.("[hidden], [aria-hidden='true'], [inert]")) return ![];
  if (typeof _0x99472d['focus'] !== 'function') return ![];
  return (_0x99472d['focus']({ preventScroll: !![] }), !![]);
}
function isVisible(_0x3a5bcd) {
  if (_0x3a5bcd?.['getClientRects'] && _0x3a5bcd['getClientRects']()['length'] === 0x0) return ![];
  const _0x48aac3 = _0x3a5bcd?.['ownerDocument']?.['defaultView']?.['getComputedStyle']?.(_0x3a5bcd);
  return _0x48aac3?.['visibility'] !== 'hidden' && _0x48aac3?.['visibility'] !== 'collapse';
}
export function listFocusableElements(_0x593c34) {
  return [...(_0x593c34?.['querySelectorAll']?.(FOCUSABLE_SELECTOR) || [])]['filter'](isFocusable);
}
export function focusFirstElement(_0x44fe36, { preferredSelector: preferredSelector = '' } = {}) {
  const _0x5400dd = preferredSelector ? _0x44fe36?.['querySelector']?.(preferredSelector) : null,
    _0x4f8a24 = isFocusable(_0x5400dd) ? _0x5400dd : listFocusableElements(_0x44fe36)[0x0] || _0x44fe36;
  return focusProgrammatically(_0x4f8a24);
}
export function trapTabKey(_0x385566, _0x91a978, _0x2bb1a7 = globalThis['document']) {
  if (_0x385566?.['key'] !== 'Tab' || !_0x91a978) return ![];
  const _0x46433f = listFocusableElements(_0x91a978),
    _0xd7dc73 = _0x2bb1a7?.['activeElement'] || null,
    _0x2c4e04 = _0x91a978['contains']?.(_0xd7dc73) === !![];
  let _0x37dcda = null;
  if (_0x46433f['length'] === 0x0) _0x37dcda = _0x91a978;
  else {
    if (!_0x2c4e04 || _0xd7dc73 === _0x91a978)
      _0x37dcda = _0x385566['shiftKey'] ? _0x46433f['at'](-0x1) : _0x46433f[0x0];
    else {
      if (_0x385566['shiftKey'] && _0xd7dc73 === _0x46433f[0x0]) _0x37dcda = _0x46433f['at'](-0x1);
      else {
        if (!_0x385566['shiftKey'] && _0xd7dc73 === _0x46433f['at'](-0x1)) _0x37dcda = _0x46433f[0x0];
      }
    }
  }
  if (!_0x37dcda || !focusProgrammatically(_0x37dcda)) return ![];
  return (_0x385566['preventDefault']?.(), _0x385566['stopPropagation']?.(), !![]);
}
export function restoreFocus(_0x1c7379, _0x197ee9 = globalThis['document']) {
  if (!isFocusable(_0x1c7379) || _0x1c7379['isConnected'] === ![]) return ![];
  const _0x1d849e = _0x197ee9?.['documentElement'];
  if (_0x1d849e?.['contains'] && !_0x1d849e['contains'](_0x1c7379)) return ![];
  return (_0x1c7379['focus']({ preventScroll: !![] }), !![]);
}
