const CLOSE_HANDLER_PROP = '__nodeToolbarFullscreenClose';
export function closeExistingNodeToolbarFullscreen(value, el = document) {
  const el2 = el?.['querySelector']?.(value);
  if (!el2) return false;
  const run = el2[CLOSE_HANDLER_PROP];
  if (typeof run === 'function') run();
  else el2['remove']?.();
  return true;
}
export function bindNodeToolbarFullscreenOverlay(el3, { onClose: onClose } = {}) {
  if (!el3) return () => {};
  let item = false;
  const run2 = () => {
    if (item) return;
    ((item = true), document['removeEventListener']?.('keydown', run3, true));
    try {
      onClose?.();
    } finally {
      (el3['remove']?.(), delete el3[CLOSE_HANDLER_PROP]);
    }
  };
  function run3(event) {
    if (event?.['key'] !== 'Escape') return;
    (event['preventDefault']?.(), run2());
  }
  return ((el3[CLOSE_HANDLER_PROP] = run2), document['addEventListener']?.('keydown', run3, true), run2);
}
