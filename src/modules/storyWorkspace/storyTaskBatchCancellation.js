function normalizeBatchId(value) {
  return String(value || '')['trim']();
}
export function createStoryTaskBatchCancellationRegistry() {
  const map = new Set();
  return {
    request(item) {
      const batchId = normalizeBatchId(item);
      if (!batchId) return false;
      return (map['add'](batchId), true);
    },
    isRequested(key) {
      const batchId2 = normalizeBatchId(key);
      return Boolean(batchId2 && map['has'](batchId2));
    },
    clear(index) {
      const batchId3 = normalizeBatchId(index);
      return Boolean(batchId3 && map['delete'](batchId3));
    },
  };
}
