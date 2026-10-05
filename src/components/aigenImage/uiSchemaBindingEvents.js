import { bindRunningHubInstanceDevMode } from './runningHubInstanceDevModeBinding.js';
export function notifyUiSchemaMenuAfterOpen(
  value,
  { fieldEl: fieldEl, popup: popup, shouldOpen: shouldOpen } = {},
) {
  if (!shouldOpen) return;
  value['dispatchEvent'](
    new CustomEvent('ui-schema-menu-after-open', { detail: { fieldEl: fieldEl, popup: popup } }),
  );
}
export function bindUiSchemaBindingEvents(
  el,
  {
    handleClick: handleClick,
    handleMouseDown: handleMouseDown,
    handleInput: handleInput,
    invalidatePendingMenuRestore: invalidatePendingMenuRestore,
    commitValue: commitValue,
    getNodeData: getNodeData,
    getNodeFieldValue: getNodeFieldValue,
  } = {},
) {
  const item = (key) => {
      const enabled = key?.['detail']?.['nativeEvent'],
        index = key?.['detail']?.['fieldEl'] || null;
      if (!enabled) return;
      if (enabled['type'] === 'click') {
        handleClick(enabled, index);
        return;
      }
      if (enabled['type'] === 'mousedown') {
        handleMouseDown(enabled, index);
        return;
      }
      (enabled['type'] === 'input' || enabled['type'] === 'change') && handleInput(enabled, index);
    },
    el2 = el['ownerDocument'] || (typeof document !== 'undefined' ? document : null),
    result = (event) => {
      const data = event['target']?.['closest']?.('.aigen-ui-schema-popup-portal'),
        enabled2 = data?.['__uiSchemaPortalRoot'] === el;
      typeof el['contains'] === 'function' &&
        !el['contains'](event['target']) &&
        !enabled2 &&
        invalidatePendingMenuRestore();
    };
  (el['addEventListener']('click', handleClick, true),
    el['addEventListener']('mousedown', handleMouseDown, true),
    el['addEventListener']('input', handleInput),
    el['addEventListener']('change', handleInput),
    el['addEventListener']('ui-schema-portaled-interaction', item),
    el2?.['addEventListener']?.('click', result, true));
  const run = bindRunningHubInstanceDevMode(el, {
    commitValue: commitValue,
    getNodeData: getNodeData,
    getNodeFieldValue: getNodeFieldValue,
  });
  return () => {
    (run(),
      el['removeEventListener']('click', handleClick, true),
      el['removeEventListener']('mousedown', handleMouseDown, true),
      el['removeEventListener']('input', handleInput),
      el['removeEventListener']('change', handleInput),
      el['removeEventListener']('ui-schema-portaled-interaction', item),
      el2?.['removeEventListener']?.('click', result, true));
  };
}
