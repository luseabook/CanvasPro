const handlers = [];
export function registerEscapeScope(value) {
  return (
    handlers['push'](value),
    () => {
      const count = handlers['lastIndexOf'](value);
      if (count >= 0x0) handlers['splice'](count, 0x1);
    }
  );
}
export function dispatchScopedEscape(event) {
  if (event['key'] !== 'Escape' || event['isComposing'] || !handlers['length']) return ![];
  return (event['preventDefault'](), event['stopImmediatePropagation'](), handlers['at'](-0x1)(), !![]);
}
