// Compare all persisted storage buckets before offering the confirmed copy-only job.
export const FILE_SAVE_MIGRATION_KEYS = Object.freeze(['canvasDir', 'dataDir', 'outputDir', 'tempDir']);

function comparablePath(value) {
  const text = String(value || '').trim().replace(/\\/g, '/');
  return text.replace(/\/+$/g, '') || (text.startsWith('/') ? '/' : '');
}

export function fileSavePathChanges(previous, target) {
  const before = previous && typeof previous === 'object' ? previous : {};
  const after = target && typeof target === 'object' ? target : {};
  const afterTemp = after.tempDir || (after.dataDir ? `${String(after.dataDir).replace(/[\\/]+$/g, '')}/uploads` : '');
  const next = { ...after, tempDir: afterTemp };
  return FILE_SAVE_MIGRATION_KEYS.flatMap((key) => {
    const from = String(before[key] || '').trim();
    const to = String(next[key] || '').trim();
    return comparablePath(from) === comparablePath(to) ? [] : [{ key, from, to }];
  });
}
