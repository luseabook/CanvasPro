function cloneViewport(args) {
  return args && typeof args === 'object' ? { ...args } : null;
}
export function createViewportPreviewCoordinator({
  beginPreview: beginPreview,
  updatePreview: updatePreview,
  flushPreview: flushPreview,
  getPreview: getPreview,
  isPreviewActive: isPreviewActive,
} = {}) {
  let value = null,
    cloneViewport2 = null;
  function acquire(enabled, item) {
    if (!enabled) return null;
    if (value === enabled) return cloneViewport(cloneViewport2 || getPreview?.() || item);
    if (value === null && isPreviewActive?.()) return null;
    const cloneViewport3 = cloneViewport(cloneViewport2 || getPreview?.() || item);
    if (!cloneViewport3) return null;
    return (
      (value = enabled),
      (cloneViewport2 = cloneViewport3),
      beginPreview?.(cloneViewport3),
      cloneViewport(cloneViewport3)
    );
  }
  function update(key, enabled2) {
    if (key !== value || !enabled2) return false;
    return ((cloneViewport2 = cloneViewport(enabled2)), updatePreview?.(cloneViewport2), true);
  }
  function commit(index) {
    if (index !== value) return null;
    const cloneViewport4 = cloneViewport(cloneViewport2),
      cloneViewport5 = cloneViewport(flushPreview?.());
    return ((value = null), (cloneViewport2 = null), cloneViewport5 || cloneViewport4);
  }
  return {
    acquire: acquire,
    update: update,
    commit: commit,
    getActiveOwner() {
      return value;
    },
  };
}
