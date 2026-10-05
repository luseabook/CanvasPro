export function createRendererViewportCommitGate({
  delayMs: delayMs = 0,
  shouldDefer: shouldDefer = () => false,
} = {}) {
  let value = null,
    enabled = false;
  function remember(mode, nodeCount, edgesRev) {
    ((value = { mode: mode, nodeCount: nodeCount, edgesRev: edgesRev }), (enabled = false));
  }
  function reset() {
    ((value = null), (enabled = false));
  }
  function consumeShouldDefer(nodeCount2, edgesRev2, viewport) {
    if (enabled) return false;
    const enabled2 = value;
    if (!enabled2 || (enabled2['mode'] !== 'panning' && enabled2['mode'] !== 'zooming')) return false;
    if (enabled2['nodeCount'] !== nodeCount2 || enabled2['edgesRev'] !== edgesRev2) return false;
    if (!shouldDefer({ nodeCount: nodeCount2, edgesRev: edgesRev2, viewport: viewport })) return false;
    return ((enabled = true), true);
  }
  return { consumeShouldDefer: consumeShouldDefer, delayMs: delayMs, remember: remember, reset: reset };
}
