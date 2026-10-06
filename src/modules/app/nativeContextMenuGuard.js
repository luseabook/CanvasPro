export function installNativeContextMenuGuard(el = globalThis.window) {
  if (!el?.addEventListener) return () => {};
  const value = (item) => {
    item?.preventDefault?.();
  };
  return (
    el.addEventListener('contextmenu', value),
    () => {
      el.removeEventListener?.('contextmenu', value);
    }
  );
}
