import { queryRendererSpatialIndexIds, screenViewportToWorldBounds } from './rendererSpatialIndex.js';
export const RENDERER_VIRTUALIZATION_CONFIG = Object['freeze']({
  mountPadding: 0x258,
  parkPadding: 0x384,
  denseLowZoomMountPadding: 0x1a4,
  denseLowZoomParkPadding: 0x28a,
  denseLowZoomPreviewPadding: 0x4b0,
  veryDenseLowZoomMountPadding: 0x140,
  veryDenseLowZoomParkPadding: 0x208,
  veryDenseLowZoomPreviewPadding: 0x640,
  denseLowZoomThreshold: 0.45,
  veryDenseLowZoomThreshold: 0.33,
  denseLowZoomMaxMountCandidates: 0x24,
  veryDenseLowZoomMaxMountCandidates: 0x18,
  denseNodeCount: 0x50,
  veryDenseNodeCount: 0x78,
  settleDelayMs: 0x78,
  parkAfterInteractionDelayMs: 0x140,
  batchSize: 0xc,
  structuralFrameBudgetMs: 0x8,
  denseStructuralReconcileDelayMs: 0x2d0,
  veryDenseStructuralReconcileDelayMs: 0x640,
  lowZoomViewportCommitReconcileDelayMs: 0x2d0,
  dragCommitReconcileDelayMs: 0x1e0,
  recentPinMs: 0x7d0,
});
export function resolveRendererVirtualizationTier({ viewport: viewport, nodeCount: nodeCount = 0x0 } = {}) {
  const value = Number['isFinite'](Number(viewport?.['zoom'])) ? Number(viewport['zoom']) : 0x1,
    item = Number['isFinite'](Number(nodeCount)) ? Number(nodeCount) : 0x0;
  if (
    value <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    item >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return 'very-dense-low-zoom';
  if (
    value <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    item >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return 'dense-low-zoom';
  return 'default';
}
export function createRendererStructuralBudget({
  batchSize: batchSize = RENDERER_VIRTUALIZATION_CONFIG['batchSize'],
  frameBudgetMs: frameBudgetMs = RENDERER_VIRTUALIZATION_CONFIG['structuralFrameBudgetMs'],
  now: now = () =>
    typeof performance !== 'undefined' && typeof performance['now'] === 'function'
      ? performance['now']()
      : 0x0,
} = {}) {
  let count = batchSize,
    count2 = 0x0;
  const now2 = now();
  return {
    hasBudget() {
      return count > 0x0 && (count2 <= 0x0 || !now2 || now() - now2 < frameBudgetMs);
    },
    consume() {
      ((count -= 0x1), (count2 += 0x1));
    },
  };
}
export function getRendererStructuralReconcileDelayMs(key) {
  const index = Number(key);
  if (!Number['isFinite'](index)) return 0x0;
  if (index >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'])
    return RENDERER_VIRTUALIZATION_CONFIG['veryDenseStructuralReconcileDelayMs'];
  if (index >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'])
    return RENDERER_VIRTUALIZATION_CONFIG['denseStructuralReconcileDelayMs'];
  return 0x0;
}
function addNodeAndChildren(map, enabled, result) {
  if (!enabled || map['has'](enabled)) return;
  const list = [enabled];
  for (let data = 0x0; data < list['length']; data += 0x1) {
    const enabled2 = list[data];
    if (!enabled2 || map['has'](enabled2)) continue;
    map['add'](enabled2);
    const enabled3 = result?.[enabled2];
    if (!enabled3) continue;
    const options =
      enabled3 instanceof Set
        ? enabled3
        : Array['isArray'](enabled3)
          ? enabled3
          : typeof enabled3[Symbol['iterator']] === 'function'
            ? enabled3
            : [];
    for (const target of options) {
      if (!map['has'](target)) list['push'](target);
    }
  }
}
function isWebPreviewNode(options2 = {}) {
  return (
    String(options2?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'web-preview'
  );
}
function isPreferredLowZoomMountNode(options3 = {}) {
  const source = String(options3?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return source === 'comment-note' || source === 'group' || source === 'web-preview';
}
function isHeavyMediaNode(options4 = {}) {
  const next = String(options4?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return (
    next === 'source-image' ||
    next === 'ai-image' ||
    next === 'source-video' ||
    next === 'video' ||
    next === 'ai-video' ||
    next === 'source-audio' ||
    next === 'audio' ||
    next === 'ai-audio'
  );
}
function getViewportWorldCenter(viewport2, containerWidth, containerHeight) {
  const worldBounds = screenViewportToWorldBounds({
    viewport: viewport2,
    containerWidth: containerWidth,
    containerHeight: containerHeight,
    padding: 0x0,
  });
  return {
    x: (worldBounds['minX'] + worldBounds['maxX']) / 0x2,
    y: (worldBounds['minY'] + worldBounds['maxY']) / 0x2,
  };
}
function getNodeCenterDistanceSq(box = {}, box2 = {}) {
  const current = Number['isFinite'](Number(box['x'])) ? Number(box['x']) : 0x0,
    entry = Number['isFinite'](Number(box['y'])) ? Number(box['y']) : 0x0,
    record = Math['max'](0x1, Number(box['width']) || 0xa0),
    payload = Math['max'](0x1, Number(box['height']) || 0x78),
    handle = current + record / 0x2 - box2['x'],
    state = entry + payload / 0x2 - box2['y'];
  return handle * handle + state * state;
}
function collectViewportWebPreviewNodeIds({
  nodes: nodes,
  spatialIndex: spatialIndex2,
  viewport: viewport3,
  containerWidth: containerWidth2,
  containerHeight: containerHeight2,
  padding: padding,
} = {}) {
  const config = new Set();
  if (!nodes || !viewport3) return config;
  if (spatialIndex2) {
    const worldBounds2 = screenViewportToWorldBounds({
      viewport: viewport3,
      containerWidth: containerWidth2,
      containerHeight: containerHeight2,
      padding: padding,
    });
    for (const scope of queryRendererSpatialIndexIds(spatialIndex2, worldBounds2)) {
      if (isWebPreviewNode(nodes?.[scope])) config['add'](scope);
    }
    return config;
  }
  for (const enabled4 of Object['values'](nodes || {})) {
    if (!enabled4?.['id'] || !isWebPreviewNode(enabled4)) continue;
    isNodeInsideViewportPadding(enabled4, viewport3, containerWidth2, containerHeight2, padding) &&
      config['add'](enabled4['id']);
  }
  return config;
}
export function isNodeInsideViewportPadding(
  box3,
  box4,
  input,
  output,
  value2 = 0x0,
  value3 = 0x0,
  value4 = 0x0,
) {
  if (!box3 || !box4) return ![];
  const value5 = Number['isFinite'](box4['zoom']) ? box4['zoom'] : 0x1,
    value6 = Number['isFinite'](box3['x']) ? box3['x'] : 0x0,
    value7 = Number['isFinite'](box3['y']) ? box3['y'] : 0x0,
    value8 = Number['isFinite'](box3['width']) ? box3['width'] : 0x0,
    value9 = Number['isFinite'](box3['height']) ? box3['height'] : 0x0,
    value10 = Number['isFinite'](value3) ? value3 : 0x0,
    value11 = Number['isFinite'](value4) ? value4 : 0x0,
    value12 = (value6 + value10) * value5 + (Number['isFinite'](box4['x']) ? box4['x'] : 0x0),
    value13 = (value7 + value11) * value5 + (Number['isFinite'](box4['y']) ? box4['y'] : 0x0),
    value14 = value8 * value5,
    value15 = value9 * value5;
  return (
    value12 + value14 > -value2 &&
    value12 < input + value2 &&
    value13 + value15 > -value2 &&
    value13 < output + value2
  );
}
export function collectVirtualKeepAliveNodeIds({
  selectedNodeIds: selectedNodeIds,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
  dragContext: dragContext,
  parentToChildren: parentToChildren,
  pinnedNodeIds: pinnedNodeIds,
} = {}) {
  const value16 = new Set(),
    list2 =
      selectedNodeIds instanceof Set
        ? Array['from'](selectedNodeIds)
        : Array['isArray'](selectedNodeIds)
          ? selectedNodeIds
          : [];
  list2['forEach']((value17) => addNodeAndChildren(value16, value17, parentToChildren));
  if (dragContext?.['isDragging'] && dragContext?.['targetNodeId']) {
    const list3 = list2['includes'](dragContext['targetNodeId']) ? list2 : [dragContext['targetNodeId']];
    list3['forEach']((value18) => addNodeAndChildren(value16, value18, parentToChildren));
  }
  connOverlay?.['srcId'] && value16['add'](connOverlay['srcId']);
  connOverlay?.['hoverId'] && value16['add'](connOverlay['hoverId']);
  pickConnectMode?.['sourceNodeId'] && value16['add'](pickConnectMode['sourceNodeId']);
  pickConnectMode?.['hoverNodeId'] && value16['add'](pickConnectMode['hoverNodeId']);
  const value19 =
    pinnedNodeIds instanceof Set ? pinnedNodeIds : Array['isArray'](pinnedNodeIds) ? pinnedNodeIds : [];
  for (const value20 of value19) {
    value16['add'](value20);
  }
  return value16;
}
export function resolveRendererVirtualizationPadding({
  viewport: viewport4,
  nodeCount: nodeCount = 0x0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG['parkPadding'],
} = {}) {
  const value21 = Number['isFinite'](viewport4?.['zoom']) ? viewport4['zoom'] : 0x1,
    value22 = Number['isFinite'](nodeCount) ? nodeCount : 0x0;
  if (
    value21 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    value22 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomMountPadding'],
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomParkPadding'],
    };
  if (
    value21 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    value22 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomMountPadding'],
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomParkPadding'],
    };
  return { mountPadding: mountPadding, parkPadding: parkPadding };
}
export function resolveRendererPreviewPadding({
  viewport: viewport5,
  nodeCount: nodeCount = 0x0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  previewPadding: previewPadding = mountPadding,
} = {}) {
  const value23 = Number['isFinite'](viewport5?.['zoom']) ? viewport5['zoom'] : 0x1,
    value24 = Number['isFinite'](nodeCount) ? nodeCount : 0x0,
    value25 = Number['isFinite'](Number(previewPadding)) ? Number(previewPadding) : mountPadding;
  if (
    value23 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    value24 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return Math['max'](mountPadding, RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomPreviewPadding']);
  if (
    value23 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    value24 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return Math['max'](mountPadding, RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomPreviewPadding']);
  return Math['max'](mountPadding, value25);
}
export function resolveRendererLowZoomMountLimit({ viewport: viewport6, nodeCount: nodeCount = 0x0 } = {}) {
  const value26 = Number['isFinite'](viewport6?.['zoom']) ? viewport6['zoom'] : 0x1,
    value27 = Number['isFinite'](nodeCount) ? nodeCount : 0x0;
  if (
    value26 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    value27 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomMaxMountCandidates'];
  if (
    value26 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    value27 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomMaxMountCandidates'];
  return 0x0;
}
function limitLowZoomMountCandidates({
  nodes: nodes2,
  mountCandidateIds: mountCandidateIds,
  keepAliveNodeIds: keepAliveNodeIds,
  viewport: viewport7,
  containerWidth: containerWidth3,
  containerHeight: containerHeight3,
  limit: limit,
} = {}) {
  if (!(mountCandidateIds instanceof Set) || !(limit > 0x0)) return mountCandidateIds;
  const value28 = new Set(keepAliveNodeIds || []);
  for (const value29 of mountCandidateIds) {
    const value30 = nodes2?.[value29];
    isPreferredLowZoomMountNode(value30) && value28['add'](value29);
  }
  const map2 = new Set();
  for (const value31 of value28) {
    if (mountCandidateIds['has'](value31)) map2['add'](value31);
  }
  const count3 = Math['max'](0x0, Math['floor'](limit) - map2['size']);
  if (count3 <= 0x0) return map2;
  const viewportWorldCenter = getViewportWorldCenter(viewport7, containerWidth3, containerHeight3),
    list4 = [];
  let order = 0x0;
  for (const nodeId of mountCandidateIds) {
    if (map2['has'](nodeId)) continue;
    const enabled5 = nodes2?.[nodeId];
    if (!enabled5?.['id']) continue;
    if (isHeavyMediaNode(enabled5)) continue;
    (list4['push']({
      nodeId: nodeId,
      distanceSq: getNodeCenterDistanceSq(enabled5, viewportWorldCenter),
      order: order,
    }),
      (order += 0x1));
  }
  list4['sort'](
    (value32, value33) =>
      value32['distanceSq'] - value33['distanceSq'] || value32['order'] - value33['order'],
  );
  for (const value34 of list4['slice'](0x0, count3)) {
    map2['add'](value34['nodeId']);
  }
  return map2;
}
function finalizeVirtualizationCandidateSets({
  nodes: nodes3,
  nodeCount: nodeCount2,
  mountCandidateIds: mountCandidateIds2,
  previewCandidateIds: previewCandidateIds = mountCandidateIds2,
  parkCandidateIds: parkCandidateIds,
  keepAliveNodeIds: keepAliveNodeIds2,
  mountedNodeIds: mountedNodeIds,
  viewport: viewport8,
  containerWidth: containerWidth4,
  containerHeight: containerHeight4,
} = {}) {
  const limit2 = resolveRendererLowZoomMountLimit({ viewport: viewport8, nodeCount: nodeCount2 });
  if (!(limit2 > 0x0))
    return {
      keepAliveNodeIds: keepAliveNodeIds2,
      mountCandidateIds: mountCandidateIds2,
      previewCandidateIds: previewCandidateIds,
      parkCandidateIds: parkCandidateIds,
    };
  const mountCandidateIds3 = limitLowZoomMountCandidates({
      nodes: nodes3,
      mountCandidateIds: mountCandidateIds2,
      keepAliveNodeIds: keepAliveNodeIds2,
      viewport: viewport8,
      containerWidth: containerWidth4,
      containerHeight: containerHeight4,
      limit: limit2,
    }),
    value35 =
      mountedNodeIds instanceof Set
        ? mountedNodeIds
        : Array['isArray'](mountedNodeIds)
          ? new Set(mountedNodeIds)
          : new Set();
  for (const enabled6 of value35) {
    if (!enabled6 || keepAliveNodeIds2['has'](enabled6)) continue;
    if (!mountCandidateIds3['has'](enabled6)) parkCandidateIds['add'](enabled6);
  }
  for (const value36 of keepAliveNodeIds2) {
    parkCandidateIds['delete'](value36);
  }
  return {
    keepAliveNodeIds: keepAliveNodeIds2,
    mountCandidateIds: mountCandidateIds3,
    previewCandidateIds: previewCandidateIds,
    parkCandidateIds: parkCandidateIds,
  };
}
export function buildVirtualizationCandidateSets({
  nodes: nodes4,
  spatialIndex: spatialIndex = null,
  viewport: viewport9,
  containerWidth: containerWidth5,
  containerHeight: containerHeight5,
  selectedNodeIds: selectedNodeIds2,
  connOverlay: connOverlay2,
  pickConnectMode: pickConnectMode2,
  dragContext: dragContext2,
  parentToChildren: parentToChildren2,
  pinnedNodeIds: pinnedNodeIds2,
  mountedNodeIds: mountedNodeIds2,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG['parkPadding'],
} = {}) {
  const list5 = spatialIndex ? null : Object['values'](nodes4 || {}),
    nodeCount3 = spatialIndex?.['nodeCount'] ?? list5['length'],
    mountPadding2 = resolveRendererVirtualizationPadding({
      viewport: viewport9,
      nodeCount: nodeCount3,
      mountPadding: mountPadding,
      parkPadding: parkPadding,
    }),
    padding2 = resolveRendererPreviewPadding({
      viewport: viewport9,
      nodeCount: nodeCount3,
      mountPadding: mountPadding2['mountPadding'],
    }),
    keepAliveNodeIds3 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: selectedNodeIds2,
      connOverlay: connOverlay2,
      pickConnectMode: pickConnectMode2,
      dragContext: dragContext2,
      parentToChildren: parentToChildren2,
      pinnedNodeIds: pinnedNodeIds2,
    });
  for (const value37 of collectViewportWebPreviewNodeIds({
    nodes: nodes4,
    spatialIndex: spatialIndex,
    viewport: viewport9,
    containerWidth: containerWidth5,
    containerHeight: containerHeight5,
    padding: mountPadding2['parkPadding'],
  })) {
    keepAliveNodeIds3['add'](value37);
  }
  const mountCandidateIds4 = new Set(),
    previewCandidateIds2 = new Set(),
    parkCandidateIds2 = new Set();
  if (spatialIndex) {
    const worldBounds3 = screenViewportToWorldBounds({
        viewport: viewport9,
        containerWidth: containerWidth5,
        containerHeight: containerHeight5,
        padding: mountPadding2['mountPadding'],
      }),
      worldBounds4 = screenViewportToWorldBounds({
        viewport: viewport9,
        containerWidth: containerWidth5,
        containerHeight: containerHeight5,
        padding: mountPadding2['parkPadding'],
      }),
      value38 =
        padding2 > mountPadding2['mountPadding']
          ? screenViewportToWorldBounds({
              viewport: viewport9,
              containerWidth: containerWidth5,
              containerHeight: containerHeight5,
              padding: padding2,
            })
          : worldBounds3,
      queryRendererSpatialIndexIds2 = queryRendererSpatialIndexIds(spatialIndex, worldBounds3),
      value39 =
        value38 === worldBounds3
          ? queryRendererSpatialIndexIds2
          : queryRendererSpatialIndexIds(spatialIndex, value38),
      map3 = queryRendererSpatialIndexIds(spatialIndex, worldBounds4);
    for (const value40 of keepAliveNodeIds3) {
      (mountCandidateIds4['add'](value40), previewCandidateIds2['add'](value40));
    }
    for (const value41 of queryRendererSpatialIndexIds2) {
      (mountCandidateIds4['add'](value41), previewCandidateIds2['add'](value41));
    }
    for (const value42 of value39) {
      previewCandidateIds2['add'](value42);
    }
    const value43 =
      mountedNodeIds2 instanceof Set
        ? mountedNodeIds2
        : Array['isArray'](mountedNodeIds2)
          ? mountedNodeIds2
          : spatialIndex['nodeIds'] || [];
    for (const enabled7 of value43) {
      if (!enabled7 || keepAliveNodeIds3['has'](enabled7)) continue;
      if (!map3['has'](enabled7)) parkCandidateIds2['add'](enabled7);
    }
    return finalizeVirtualizationCandidateSets({
      nodes: nodes4,
      nodeCount: nodeCount3,
      keepAliveNodeIds: keepAliveNodeIds3,
      mountCandidateIds: mountCandidateIds4,
      previewCandidateIds: previewCandidateIds2,
      parkCandidateIds: parkCandidateIds2,
      mountedNodeIds: mountedNodeIds2,
      viewport: viewport9,
      containerWidth: containerWidth5,
      containerHeight: containerHeight5,
    });
  }
  for (const enabled8 of list5) {
    if (!enabled8?.['id']) continue;
    const value44 = enabled8['id'];
    if (keepAliveNodeIds3['has'](value44)) {
      (mountCandidateIds4['add'](value44), previewCandidateIds2['add'](value44));
      continue;
    }
    const isNodeInsideViewportPadding2 = isNodeInsideViewportPadding(
      enabled8,
      viewport9,
      containerWidth5,
      containerHeight5,
      mountPadding2['mountPadding'],
    );
    if (isNodeInsideViewportPadding2) {
      (mountCandidateIds4['add'](value44), previewCandidateIds2['add'](value44));
      continue;
    }
    if (padding2 > mountPadding2['mountPadding']) {
      const isNodeInsideViewportPadding3 = isNodeInsideViewportPadding(
        enabled8,
        viewport9,
        containerWidth5,
        containerHeight5,
        padding2,
      );
      isNodeInsideViewportPadding3 && previewCandidateIds2['add'](value44);
    }
    const isNodeInsideViewportPadding4 = isNodeInsideViewportPadding(
      enabled8,
      viewport9,
      containerWidth5,
      containerHeight5,
      mountPadding2['parkPadding'],
    );
    !isNodeInsideViewportPadding4 && parkCandidateIds2['add'](value44);
  }
  return finalizeVirtualizationCandidateSets({
    nodes: nodes4,
    nodeCount: nodeCount3,
    keepAliveNodeIds: keepAliveNodeIds3,
    mountCandidateIds: mountCandidateIds4,
    previewCandidateIds: previewCandidateIds2,
    parkCandidateIds: parkCandidateIds2,
    mountedNodeIds: mountedNodeIds2,
    viewport: viewport9,
    containerWidth: containerWidth5,
    containerHeight: containerHeight5,
  });
}
export function ensureRendererExactVisiblePreviewCandidates({
  virtualizationResult: virtualizationResult,
  nodes: nodes5,
  spatialIndex: spatialIndex = null,
  viewport: viewport10,
  containerWidth: containerWidth6,
  containerHeight: containerHeight6,
  nodeCount: nodeCount4,
} = {}) {
  const value45 = Number['isFinite'](Number(nodeCount4))
      ? Number(nodeCount4)
      : Object['keys'](nodes5 || {})['length'],
    value46 = Number(viewport10?.['zoom']);
  if (
    value45 < RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'] ||
    !Number['isFinite'](value46) ||
    value46 > RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold']
  )
    return virtualizationResult;
  const value47 = spatialIndex
      ? queryRendererSpatialIndexIds(
          spatialIndex,
          screenViewportToWorldBounds({
            viewport: viewport10,
            containerWidth: containerWidth6,
            containerHeight: containerHeight6,
            padding: 0x0,
          }),
        )
      : new Set(
          Object['values'](nodes5 || {})
            ['filter'](
              (value48) =>
                value48?.['id'] &&
                isNodeInsideViewportPadding(value48, viewport10, containerWidth6, containerHeight6, 0x0),
            )
            ['map']((value49) => value49['id']),
        ),
    map4 =
      virtualizationResult?.['previewCandidateIds'] ||
      virtualizationResult?.['mountCandidateIds'] ||
      new Set(),
    list6 = Array['from'](value47)['filter']((value50) => !map4['has'](value50));
  if (list6['length'] === 0x0) return virtualizationResult;
  return { ...virtualizationResult, previewCandidateIds: new Set([...map4, ...list6]) };
}
