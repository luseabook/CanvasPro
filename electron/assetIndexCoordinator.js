function requireFunction(value, label) {
  if (typeof value !== 'function') throw new TypeError(label + ' must be a function');
  return value;
}
function normalizeAssetId(assetId) {
  const normalized = String(assetId || '').trim();
  if (!normalized) throw new TypeError('assetId must be a non-empty string');
  return normalized;
}
function nextAssetRevision(revision) {
  const current = Number(revision || 0);
  if (!Number.isSafeInteger(current) || current < 0 || current >= Number.MAX_SAFE_INTEGER)
    throw new RangeError('asset revision must be a non-negative safe integer');
  return current + 1;
}
export function createAssetIndexCoordinator({
  readIndex: readIndex,
  writeIndex: writeIndex,
  now: now = () => new Date().toISOString(),
} = {}) {
  const readIndexFn = requireFunction(readIndex, 'readIndex'),
    writeIndexFn = requireFunction(writeIndex, 'writeIndex'),
    nowFn = requireFunction(now, 'now');
  function commit(assetId, updater) {
    const normalizedId = normalizeAssetId(assetId),
      updaterFn = requireFunction(updater, 'updater'),
      index = readIndexFn() || {},
      assets = index.assets && typeof index.assets === 'object' ? index.assets : {},
      existing = assets[normalizedId] || null,
      next = updaterFn(existing, { ...index, assets: assets });
    if (next && typeof next.then === 'function')
      throw new TypeError('asset index updater must be synchronous');
    if (!next) return null;
    const record = {
      ...next,
      assetId: normalizedId,
      assetRevision: nextAssetRevision(existing?.assetRevision),
      updatedAt: String(nowFn()),
    };
    return (
      (assets[normalizedId] = record),
      writeIndexFn({ ...index, version: 1, assets: assets }),
      record
    );
  }
  function patch(assetId, fields, { expectedMediaTaskId: expectedMediaTaskId = '' } = {}) {
    const expected = String(expectedMediaTaskId || '').trim();
    return commit(assetId, (existing) => {
      if (!existing) return null;
      if (expected && String(existing.mediaTaskId || '').trim() !== expected) return null;
      return { ...existing, ...(fields && typeof fields === 'object' ? fields : {}) };
    });
  }
  return { commit: commit, patch: patch };
}
