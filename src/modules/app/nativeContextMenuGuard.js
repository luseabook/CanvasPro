export function installNativeContextMenuGuard(_0x2bc96a = globalThis['window']) {
  if (!_0x2bc96a?.['addEventListener']) return () => {};
  const _0x8d0001 = (_0x1902b8) => {
    _0x1902b8?.['preventDefault']?.();
  };
  return (
    _0x2bc96a['addEventListener']('contextmenu', _0x8d0001),
    () => {
      _0x2bc96a['removeEventListener']?.('contextmenu', _0x8d0001);
    }
  );
}
