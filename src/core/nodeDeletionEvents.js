const listeners = new Set();
export function subscribeNodeDeletions(_0x338bff) {
  if (typeof _0x338bff !== 'function') throw new TypeError('subscribeNodeDeletions requires a listener');
  return (listeners['add'](_0x338bff), () => listeners['delete'](_0x338bff));
}
export function emitNodeDeletions(_0x29806a = []) {
  const _0x16aa4e = Array['isArray'](_0x29806a) ? _0x29806a : [];
  if (!_0x16aa4e['length']) return ![];
  for (const _0x35b97f of listeners) {
    try {
      _0x35b97f(_0x16aa4e);
    } catch (_0x3be3b2) {
      console['error']('[nodeDeletionEvents] listener failed', _0x3be3b2);
    }
  }
  return !![];
}
