const handlers = [];
export function registerEscapeScope(_0x30953f) {
  return (
    handlers['push'](_0x30953f),
    () => {
      const _0x58876c = handlers['lastIndexOf'](_0x30953f);
      if (_0x58876c >= 0x0) handlers['splice'](_0x58876c, 0x1);
    }
  );
}
export function dispatchScopedEscape(_0x4277fe) {
  if (_0x4277fe['key'] !== 'Escape' || _0x4277fe['isComposing'] || !handlers['length']) return ![];
  return (
    _0x4277fe['preventDefault'](),
    _0x4277fe['stopImmediatePropagation'](),
    handlers['at'](-0x1)(),
    !![]
  );
}
