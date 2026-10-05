const listeners = new Set();
export function subscribeNodeDeletions(value) {
  if (typeof value !== 'function') throw new TypeError('subscribeNodeDeletions requires a listener');
  return (listeners['add'](value), () => listeners['delete'](value));
}
export function emitNodeDeletions(list = []) {
  const list2 = Array['isArray'](list) ? list : [];
  if (!list2['length']) return false;
  for (const run of listeners) {
    try {
      run(list2);
    } catch (item) {
      console['error']('[nodeDeletionEvents] listener failed', item);
    }
  }
  return true;
}
