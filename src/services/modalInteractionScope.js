import { focusFirstElement, restoreFocus, trapTabKey } from '../utils/focusTrap.js';
const scopes = [];
export function hasActiveModalInteraction() {
  return scopes['some'](({ root: root }) => root['isConnected'] !== ![]);
}
export function beginModalInteraction({
  root: root2,
  onClose: onClose,
  onSuspend: onSuspend,
  returnFocus: returnFocus,
  preferredSelector: preferredSelector = '',
}) {
  if (!root2) return () => {};
  const el = root2['ownerDocument'] || globalThis['document'],
    el2 = el?.['defaultView'] || globalThis['window'],
    value = { root: root2, onSuspend: onSuspend },
    item = returnFocus || el?.['activeElement'],
    handler = () => scopes['at'](-1) === value,
    key = (index) => {
      if (!handler()) return;
      trapTabKey(index, root2, el);
    },
    result = (event) => {
      handler() &&
        !root2['contains']?.(event['target']) &&
        focusFirstElement(root2, { preferredSelector: preferredSelector });
    },
    data = (event2) => {
      if (!handler()) return;
      (event2['type'] === 'keydown' &&
        event2['key'] === 'Escape' &&
        !event2['isComposing'] &&
        !event2['defaultPrevented'] &&
        (event2['preventDefault'](), onClose?.()),
        event2['stopPropagation']());
    };
  (scopes['at'](-1)?.['onSuspend']?.(),
    scopes['push'](value),
    el2?.['addEventListener']?.('keydown', key, !![]),
    el?.['addEventListener']?.('focusin', result),
    root2['addEventListener']?.('keydown', data),
    root2['addEventListener']?.('keyup', data),
    focusFirstElement(root2, { preferredSelector: preferredSelector }));
  let options = ![];
  return ({ restoreFocus: restoreFocus2 = !![] } = {}) => {
    if (options) return;
    options = !![];
    const target = handler();
    (scopes['splice'](scopes['indexOf'](value), 1),
      el2?.['removeEventListener']?.('keydown', key, !![]),
      el?.['removeEventListener']?.('focusin', result),
      root2['removeEventListener']?.('keydown', data),
      root2['removeEventListener']?.('keyup', data));
    if (target && restoreFocus2) restoreFocus(item, el);
  };
}
