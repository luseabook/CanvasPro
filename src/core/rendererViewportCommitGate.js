export function createRendererViewportCommitGate({
  delayMs: delayMs = 0,
  shouldDefer: shouldDefer = () => ![],
} = {}) {
  let value = null,
    enabled = ![];
  function remember(mode, nodeCount, edgesRev) {
    ((value = { mode: mode, nodeCount: nodeCount, edgesRev: edgesRev }), (enabled = ![]));
  }
  function reset() {
    ((value = null), (enabled = ![]));
  }
  function consumeShouldDefer(nodeCount2, edgesRev2, viewport) {
    if (enabled) return ![];
    const enabled2 = value;
    if (!enabled2 || (enabled2['mode'] !== 'panning' && enabled2['mode'] !== 'zooming')) return ![];
    if (enabled2['nodeCount'] !== nodeCount2 || enabled2['edgesRev'] !== edgesRev2) return ![];
    if (!shouldDefer({ nodeCount: nodeCount2, edgesRev: edgesRev2, viewport: viewport })) return ![];
    return ((enabled = !![]), !![]);
  }
  return { consumeShouldDefer: consumeShouldDefer, delayMs: delayMs, remember: remember, reset: reset };
}
