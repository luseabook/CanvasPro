import { RENDERER_VIRTUALIZATION_CONFIG } from './rendererVirtualization.js';
function normalizeSignaturePart(part) {
  if (part === null || part === undefined) return null;
  if (typeof part === 'number') return Number['isFinite'](part) ? part : null;
  if (typeof part === 'boolean') return part;
  if (typeof part === 'string') return part;
  if (Array['isArray'](part)) return part['map']((item) => normalizeSignaturePart(item));
  if (typeof part === 'object') {
    const result = {};
    for (const key of Object['keys'](part)['sort']()) {
      result[key] = normalizeSignaturePart(part[key]);
    }
    return result;
  }
  return String(part);
}
function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number['isFinite'](numeric) ? numeric : fallback;
}
function quantizeSigned(value, step) {
  const safeStep = Math['max'](1, Number(step) || 1);
  return Math['trunc'](toFiniteNumber(value) / safeStep) * safeStep;
}
function normalizeViewportForSignature(viewport, nodeCount) {
  const zoom = toFiniteNumber(viewport?.['zoom'], 1),
    count = toFiniteNumber(nodeCount, 0),
    veryDense =
      zoom <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
      count >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'],
    dense =
      zoom <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
      count >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
    quantizeStep = veryDense ? 96 : dense ? 64 : 0,
    x = toFiniteNumber(viewport?.['x'], 0),
    y = toFiniteNumber(viewport?.['y'], 0);
  if (!(quantizeStep > 0)) return { x: x, y: y, zoom: zoom };
  return {
    x: quantizeSigned(x, quantizeStep),
    y: quantizeSigned(y, quantizeStep),
    zoom: zoom,
  };
}
export function buildRendererVirtualizationSignature({
  snapshotRev: snapshotRev,
  nodeCount: nodeCount,
  viewport: viewport,
  selectedNodeIds: selectedNodeIds,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
  dragContext: dragContext,
  pinnedNodeIds: pinnedNodeIds,
  containerW: containerW,
  containerH: containerH,
} = {}) {
  const selectedIds = Array['from'](
      selectedNodeIds instanceof Set
        ? selectedNodeIds
        : Array['isArray'](selectedNodeIds)
          ? selectedNodeIds
          : [],
    )
      ['map']((id) => String(id))
      ['sort'](),
    pinnedIds = Array['from'](
      pinnedNodeIds instanceof Set ? pinnedNodeIds : Array['isArray'](pinnedNodeIds) ? pinnedNodeIds : [],
    )
      ['map']((id) => String(id))
      ['sort']();
  return JSON['stringify'](
    normalizeSignaturePart({
      snapshotRev: snapshotRev,
      nodeCount: nodeCount,
      viewport: normalizeViewportForSignature(viewport, nodeCount),
      selectedNodeIds: selectedIds,
      connOverlay: { srcId: connOverlay?.['srcId'] ?? null, hoverId: connOverlay?.['hoverId'] ?? null },
      pickConnectMode: {
        active: !!pickConnectMode?.['active'],
        sourceNodeId: pickConnectMode?.['sourceNodeId'] ?? null,
        hoverNodeId: pickConnectMode?.['hoverNodeId'] ?? null,
        handleDirection: pickConnectMode?.['handleDirection'] ?? null,
      },
      dragContext: {
        isDragging: !!dragContext?.['isDragging'],
        targetNodeId: dragContext?.['targetNodeId'] ?? null,
        pendingDx: Number['isFinite'](dragContext?.['pendingDx']) ? dragContext['pendingDx'] : 0,
        pendingDy: Number['isFinite'](dragContext?.['pendingDy']) ? dragContext['pendingDy'] : 0,
      },
      pinnedNodeIds: pinnedIds,
      containerW: Number['isFinite'](containerW) ? containerW : 0,
      containerH: Number['isFinite'](containerH) ? containerH : 0,
    }),
  );
}
