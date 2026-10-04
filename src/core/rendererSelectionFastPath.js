function normalizeNumber(value, item = 0x0) {
  return Number['isFinite'](value) ? value : item;
}
function hasNodeRevision(options = {}) {
  return typeof options['_nodesRev'] === 'number' || typeof options['_persistRev'] === 'number';
}
export function createRendererSelectionFastPath({
  buildSelectionRelatedSets: buildSelectionRelatedSets,
  cancelPendingRender: cancelPendingRender,
  consumeViewport: consumeViewport,
  ensureEdgeIndex: ensureEdgeIndex,
  flushSelectionUpdate: flushSelectionUpdate,
  hasPendingRender: hasPendingRender,
  renderAffectedEdges: renderAffectedEdges,
  renderSelectionOverlays: renderSelectionOverlays,
  setCurrentSnapshot: setCurrentSnapshot,
} = {}) {
  let enabled = '',
    value2 = null,
    hasNodeRevision2 = ![],
    value3 = null;
  function run(state = {}) {
    const box = state['viewport'] || {},
      connectionLinesVisible = state['ui'] || {},
      active = state['selectionBox'] || {},
      visible = state['picker'] || {},
      visible2 = state['contextMenu'] || {},
      srcId = state['connOverlay'] || {},
      active2 = state['pickConnectMode'] || {};
    return JSON['stringify']({
      nodeCount:
        typeof state['_nodeCount'] === 'number'
          ? state['_nodeCount']
          : Object['keys'](state['nodes'] || {})['length'],
      nodesRev:
        typeof state['_nodesRev'] === 'number'
          ? state['_nodesRev']
          : typeof state['_persistRev'] === 'number'
            ? state['_persistRev']
            : 0x0,
      renderRequestRev: typeof state['_renderRequestRev'] === 'number' ? state['_renderRequestRev'] : 0x0,
      edgesRev: typeof state['_edgesRev'] === 'number' ? state['_edgesRev'] : 0x0,
      viewport: {
        x: normalizeNumber(box['x']),
        y: normalizeNumber(box['y']),
        zoom: normalizeNumber(box['zoom'], 0x1),
      },
      connOverlay: {
        srcId: srcId['srcId'] || '',
        hoverId: srcId['hoverId'] || '',
        side: srcId['side'] || '',
        active: srcId['active'] === !![],
        invalidNodeIds: Array['isArray'](srcId['invalidNodeIds'])
          ? srcId['invalidNodeIds']['map']((key) => String(key))
          : [],
      },
      pickConnectMode: {
        active: active2['active'] === !![],
        sourceNodeId: active2['sourceNodeId'] || '',
        hoverNodeId: active2['hoverNodeId'] || '',
        handleDirection: active2['handleDirection'] || '',
      },
      selectionBox: {
        active: active['active'] === !![],
        x1: normalizeNumber(active['x1']),
        y1: normalizeNumber(active['y1']),
        x2: normalizeNumber(active['x2']),
        y2: normalizeNumber(active['y2']),
      },
      picker: {
        visible: visible['visible'] === !![],
        x: normalizeNumber(visible['x']),
        y: normalizeNumber(visible['y']),
        screenX: normalizeNumber(visible['screenX']),
        screenY: normalizeNumber(visible['screenY']),
      },
      contextMenu: {
        visible: visible2['visible'] === !![],
        x: normalizeNumber(visible2['x']),
        y: normalizeNumber(visible2['y']),
        itemCount: Array['isArray'](visible2['items']) ? visible2['items']['length'] : 0x0,
      },
      ui: {
        connectionLinesVisible: connectionLinesVisible['connectionLinesVisible'] !== ![],
        connectionLineStyle: connectionLinesVisible['connectionLineStyle'] || 'curve',
        imageVideoNodeResizeEnabled: connectionLinesVisible['imageVideoNodeResizeEnabled'] === !![],
        selectionRelatedHighlightEnabled: connectionLinesVisible['selectionRelatedHighlightEnabled'] !== ![],
        selectionRelatedHighlightColor: connectionLinesVisible['selectionRelatedHighlightColor'] || '',
        showVideoMeta: connectionLinesVisible['showVideoMeta'] === !![],
        titleFollowsCanvasZoom: connectionLinesVisible['titleFollowsCanvasZoom'] === !![],
        alignFeatureEnabled: connectionLinesVisible['alignFeatureEnabled'] !== ![],
        alignFeatureTriggerMode: connectionLinesVisible['alignFeatureTriggerMode'] || 'click',
        alignPanelVisible: connectionLinesVisible['alignPanelVisible'] === !![],
        alignPanelAnchorWorld: connectionLinesVisible['alignPanelAnchorWorld']
          ? {
              x: normalizeNumber(connectionLinesVisible['alignPanelAnchorWorld']['x']),
              y: normalizeNumber(connectionLinesVisible['alignPanelAnchorWorld']['y']),
            }
          : null,
      },
    });
  }
  function run2(state2 = {}) {
    const selectedNodeIds = Array['isArray'](state2['selectedNodeIds'])
        ? state2['selectedNodeIds']['filter'](Boolean)
        : [],
      index = new Set(selectedNodeIds),
      result = state2['edges'] || {},
      data = typeof state2['_edgesRev'] === 'number' ? state2['_edgesRev'] : 0x0;
    ensureEdgeIndex?.(result, data);
    const relatedNodeIds =
      state2['ui']?.['selectionRelatedHighlightEnabled'] === ![]
        ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
        : buildSelectionRelatedSets?.(index, result) || {};
    return {
      selectedNodeIds: selectedNodeIds,
      relatedNodeIds: relatedNodeIds['relatedNodeIds'] || new Set(),
      relatedEdgeIds: relatedNodeIds['relatedEdgeIds'] || new Set(),
      signature: selectedNodeIds['map']((target) => String(target))['join']('\x1f'),
    };
  }
  function rememberRenderedSnapshot(source) {
    ((enabled = run(source)),
      (value2 = run2(source)),
      (hasNodeRevision2 = hasNodeRevision(source)),
      (value3 = source?.['nodes'] || null));
  }
  function reset() {
    ((enabled = ''), (value2 = null), (hasNodeRevision2 = ![]), (value3 = null));
  }
  function flushSelectionOnlySnapshot(enabled2, next = {}) {
    if (!enabled2 || !enabled) return ![];
    if ((!hasNodeRevision2 || !hasNodeRevision(enabled2)) && (enabled2['nodes'] || null) !== value3)
      return ![];
    const current = hasPendingRender?.() === !![];
    if (current && next?.['allowPendingRaf'] !== !![]) return ![];
    const entry = run(enabled2);
    if (entry !== enabled) return ![];
    const state3 = run2(enabled2),
      enabled3 = value2;
    if (!enabled3) return ![];
    if (state3['signature'] === enabled3['signature'])
      return (setCurrentSnapshot?.(enabled2), (value2 = state3), !![]);
    current && next?.['cancelPendingRaf'] === !![] && cancelPendingRender?.();
    const args = new Set([
      ...(enabled3['selectedNodeIds'] || []),
      ...(state3['selectedNodeIds'] || []),
      ...(enabled3['relatedNodeIds'] || []),
      ...(state3['relatedNodeIds'] || []),
    ]);
    (setCurrentSnapshot?.(enabled2), consumeViewport?.(enabled2['viewport']));
    const record = flushSelectionUpdate?.([...args], { skipInstanceUpdate: !![] });
    if (record === ![]) return ![];
    const payload = new Set([...(enabled3['relatedEdgeIds'] || []), ...(state3['relatedEdgeIds'] || [])]);
    return (
      renderAffectedEdges?.(payload, enabled2, state3['relatedEdgeIds']),
      renderSelectionOverlays?.(enabled2),
      (value2 = state3),
      !![]
    );
  }
  return {
    flushSelectionOnlySnapshot: flushSelectionOnlySnapshot,
    rememberRenderedSnapshot: rememberRenderedSnapshot,
    reset: reset,
  };
}
