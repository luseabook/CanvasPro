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
function isFocusable(el) {
  if (!isVisible(el)) return ![];
  if (!el || el['disabled'] === !![] || el['hidden'] === !![]) return ![];
  if (el['inert'] === !![] || el['getAttribute']?.('aria-hidden') === 'true') return ![];
  if (el['closest']?.('[hidden], [aria-hidden=\'true\'], [inert]')) return ![];
  if (Number['isFinite'](Number(el['tabIndex'])) && Number(el['tabIndex']) < 0) return ![];
  return typeof el['focus'] === 'function';
}
function focusProgrammatically(el2) {
  if (!isVisible(el2)) return ![];
  if (!el2 || el2['disabled'] === !![] || el2['hidden'] === !![]) return ![];
  if (el2['inert'] === !![] || el2['getAttribute']?.('aria-hidden') === 'true') return ![];
  if (el2['closest']?.("[hidden], [aria-hidden='true'], [inert]")) return ![];
  if (typeof el2['focus'] !== 'function') return ![];
  return (el2['focus']({ preventScroll: !![] }), !![]);
}
function isVisible(value) {
  if (value?.['getClientRects'] && value['getClientRects']()['length'] === 0) return ![];
  const item = value?.['ownerDocument']?.['defaultView']?.['getComputedStyle']?.(value);
  return item?.['visibility'] !== 'hidden' && item?.['visibility'] !== 'collapse';
}
export function listFocusableElements(el3) {
  return [...(el3?.['querySelectorAll']?.(FOCUSABLE_SELECTOR) || [])]['filter'](isFocusable);
}
export function focusFirstElement(el4, { preferredSelector: preferredSelector = '' } = {}) {
  const key = preferredSelector ? el4?.['querySelector']?.(preferredSelector) : null,
    isFocusable2 = isFocusable(key) ? key : listFocusableElements(el4)[0] || el4;
  return focusProgrammatically(isFocusable2);
}
export function trapTabKey(event, enabled, dom = globalThis['document']) {
  if (event?.['key'] !== 'Tab' || !enabled) return ![];
  const list = listFocusableElements(enabled),
    index = dom?.['activeElement'] || null,
    enabled2 = enabled['contains']?.(index) === !![];
  let enabled3 = null;
  if (list['length'] === 0) enabled3 = enabled;
  else {
    if (!enabled2 || index === enabled) enabled3 = event['shiftKey'] ? list['at'](-1) : list[0];
    else {
      if (event['shiftKey'] && index === list[0]) enabled3 = list['at'](-1);
      else {
        if (!event['shiftKey'] && index === list['at'](-1)) enabled3 = list[0];
      }
    }
  }
  if (!enabled3 || !focusProgrammatically(enabled3)) return ![];
  return (event['preventDefault']?.(), event['stopPropagation']?.(), !![]);
}
export function restoreFocus(el5, dom2 = globalThis['document']) {
  if (!isFocusable(el5) || el5['isConnected'] === ![]) return ![];
  const enabled4 = dom2?.['documentElement'];
  if (enabled4?.['contains'] && !enabled4['contains'](el5)) return ![];
  return (el5['focus']({ preventScroll: !![] }), !![]);
}
