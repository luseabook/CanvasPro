const mirrors = new WeakMap();
export function captureBackgroundTaskCanvas(store, nodes, value) {
  const persistRev = store['getStateRaw'](),
    canvas = mirrors['get'](store),
    count =
      value && canvas?.['canvas'] === nodes
        ? nodes['nodes']?.['findIndex']((item) => item['id'] === value)
        : -0x1,
    key =
      count >= 0x0 &&
      typeof store['serializeNode'] === 'function' &&
      persistRev['_persistRev'] === canvas['persistRev'] + 0x1 &&
      persistRev['_contentPersistRev'] === canvas['contentRev'] + 0x1 &&
      persistRev['_nodeMembershipRev'] === canvas['membershipRev'] &&
      persistRev['_edgesRev'] === canvas['edgesRev'],
    index = key ? store['serializeNode'](value) : null,
    snapshot = index
      ? {
          ...nodes,
          nodes: nodes['nodes']['map']((result, data) => (data === count ? index : result)),
        }
      : store['serialize']();
  return {
    snapshot: snapshot,
    remember(canvas2) {
      mirrors['set'](store, {
        canvas: canvas2,
        persistRev: persistRev['_persistRev'],
        contentRev: persistRev['_contentPersistRev'],
        membershipRev: persistRev['_nodeMembershipRev'],
        edgesRev: persistRev['_edgesRev'],
      });
    },
  };
}
