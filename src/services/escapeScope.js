const handlers = [];
export function registerEscapeScope(value) {
  return (
    handlers['push'](value),
    () => {
      const count = handlers['lastIndexOf'](value);
      if (count >= 0) handlers['splice'](count, 1);
    }
  );
}
export function dispatchScopedEscape(event) {
  if (event['key'] !== 'Escape' || event['isComposing'] || !handlers['length']) return false;
  return (event['preventDefault'](), event['stopImmediatePropagation'](), handlers['at'](-1)(), true);
}
