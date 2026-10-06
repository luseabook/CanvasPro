import {
  NODE_MANAGER_PLACEMENT_EVENT,
  normalizeNodeManagerPlacement,
} from '../nodeManager/nodeManagerPlacement.js';
const NODE_MANAGER_PLACEMENT_BUTTONS = Object.freeze([
  Object.freeze({ id: 'btnNodeManagerPlacementLeft', placement: 'left' }),
  Object.freeze({ id: 'btnNodeManagerPlacementRight', placement: 'right' }),
  Object.freeze({ id: 'btnNodeManagerPlacementBottom', placement: 'bottom' }),
]);
function readNodeManagerPlacement(store) {
  try {
    const state = store?.getStateRaw?.() || store?.getState?.() || {};
    return normalizeNodeManagerPlacement(state.ui?.nodeManagerPlacement);
  } catch {
    return normalizeNodeManagerPlacement();
  }
}
function dispatchPlacementChange(target, placement) {
  if (typeof target?.dispatchEvent !== 'function') return;
  const CustomEventCtor = target?.CustomEvent || globalThis.CustomEvent;
  if (typeof CustomEventCtor !== 'function') return;
  target.dispatchEvent(
    new CustomEventCtor(NODE_MANAGER_PLACEMENT_EVENT, { detail: { placement: placement } }),
  );
}
export function initNodeManagerSettings({
  uiStore: uiStore,
  root: root = globalThis.document,
  eventTarget: eventTarget = globalThis.window,
} = {}) {
  const entries = NODE_MANAGER_PLACEMENT_BUTTONS.map(({ id: id, placement: placement }) => ({
    button: root?.getElementById?.(id) || null,
    placement: placement,
  }));
  let applied = null;
  const applyPlacement = (value) => {
      const normalized = normalizeNodeManagerPlacement(value);
      return (
        entries.forEach(({ button: button, placement: placement }) => {
          const isActive = placement === normalized;
          (button?.classList?.toggle('active', isActive),
            button?.setAttribute?.('aria-pressed', isActive ? 'true' : 'false'));
        }),
        applied !== normalized && ((applied = normalized), dispatchPlacementChange(eventTarget, normalized)),
        normalized
      );
    },
    listeners = new Map();
  (entries.forEach(({ button: button, placement: placement }) => {
    if (!button) return;
    const onClick = () => {
      const normalized = normalizeNodeManagerPlacement(placement);
      (uiStore?.setNodeManagerPlacement?.(normalized), applyPlacement(normalized));
    };
    (listeners.set(button, onClick), button.addEventListener?.('click', onClick));
  }),
    applyPlacement(readNodeManagerPlacement(uiStore)));
  const unsubscribe = uiStore?.subscribeSelector?.(
    (state) => normalizeNodeManagerPlacement(state.ui?.nodeManagerPlacement),
    applyPlacement,
  );
  return () => {
    (listeners.forEach((handler, button) => {
      button.removeEventListener?.('click', handler);
    }),
      listeners.clear(),
      unsubscribe?.());
  };
}
