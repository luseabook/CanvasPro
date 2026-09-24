function normalizeBatchId(_0x2f8418) {
  return String(_0x2f8418 || '')['trim']();
}
export function createStoryTaskBatchCancellationRegistry() {
  const _0x113057 = new Set();
  return {
    request(_0x1b5d7d) {
      const _0xa93bb5 = normalizeBatchId(_0x1b5d7d);
      if (!_0xa93bb5) return ![];
      return (_0x113057['add'](_0xa93bb5), !![]);
    },
    isRequested(_0x59fb24) {
      const _0x149960 = normalizeBatchId(_0x59fb24);
      return Boolean(_0x149960 && _0x113057['has'](_0x149960));
    },
    clear(_0x2570a5) {
      const _0x100047 = normalizeBatchId(_0x2570a5);
      return Boolean(_0x100047 && _0x113057['delete'](_0x100047));
    },
  };
}
