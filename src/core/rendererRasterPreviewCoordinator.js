import { resolveRendererPreviewNodePresentation } from './rendererFastPreviewLayer.js';
import { createRendererRasterPreviewLayer } from './rendererRasterPreviewLayer.js';
import { getRendererNodeLabelKind } from './rendererNodePresentation.js';
import { planRendererRasterProxies } from './rendererRasterProxyPolicy.js';
import {
  isRendererFastPreviewMediaReadable,
  selectRendererMotionAheadMediaIds,
} from './rendererFastPreviewAdmission.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from './rendererVirtualization.js';
const DENSE_RASTER_MEDIA_DEFER_NODE_COUNT = 0x140;
function toIdSet(value) {
  if (value instanceof Set) return new Set(value);
  if (Array['isArray'](value)) return new Set(value);
  return new Set();
}
function defaultSupportsRasterPreview(item) {
  const key = String(item?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !['web-preview', 'source-audio', 'ai-audio', 'audio']['includes'](key);
}
function getNode(map, index) {
  if (map instanceof Map) return map['get'](index) || null;
  return map?.[index] || null;
}
function isVisualMediaNode(result) {
  const rendererNodeLabelKind = getRendererNodeLabelKind(result?.['type']);
  if (rendererNodeLabelKind) return rendererNodeLabelKind === 'image' || rendererNodeLabelKind === 'video';
  const list = String(result?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return list['includes']('image') || list['includes']('video') || list['includes']('media-clip');
}
function resolveRenderScale(box, data) {
  const count = Number(box?.['zoom']),
    count2 = Number(data);
  return (
    (Number['isFinite'](count) && count > 0x0 ? count : 0x1) *
    (Number['isFinite'](count2) && count2 > 0x0 ? count2 : 0x1)
  );
}
function buildRasterVisualStateSignature(options, map2) {
  return [...toIdSet(options?.['invalidNodeIds'])]
    ['filter']((target) => map2['has'](target))
    ['map'](String)
    ['sort']()
    ['join']('\x1f');
}
function buildRasterPresentationIdentity(enabled, handler = resolveRendererPreviewNodePresentation) {
  if (!enabled || typeof enabled !== 'object') return '';
  const response = handler(enabled, { displayFirst: !![] }),
    box2 = response['geometry'] || {};
  return [
    response['kind'],
    response['text'],
    Number['isFinite'](Number(box2['x'])) ? Number(box2['x']) : 0x0,
    Number['isFinite'](Number(box2['y'])) ? Number(box2['y']) : 0x0,
    Math['max'](0x1, Number(box2['width']) || 0x1),
    Math['max'](0x1, Number(box2['height']) || 0x1),
    ...response['sources'],
  ]['join']('\x1f');
}
function buildRasterPresentationIdentityCacheKey(box3) {
  const source = Number(box3?.['_bizRev']);
  if (!Number['isFinite'](source)) return null;
  const run = (next, current) => {
    const entry = Number(next);
    return Number['isFinite'](entry) ? entry : current;
  };
  return [
    source,
    run(box3?.['x'], 0x0),
    run(box3?.['y'], 0x0),
    Math['max'](0x1, run(box3?.['width'], 0xa0)),
    Math['max'](0x1, run(box3?.['height'], 0x78)),
  ]['join']('\x1f');
}
function collectExplicitDomRequiredIds({
  selectedNodeIds: selectedNodeIds,
  hoveredNodeIds: hoveredNodeIds,
  hoverNodeId: hoverNodeId,
  dragNodeIds: dragNodeIds,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
  activeMediaNodeIds: activeMediaNodeIds,
  domRequiredNodeIds: domRequiredNodeIds,
} = {}) {
  const record = new Set();
  for (const payload of [
    selectedNodeIds,
    hoveredNodeIds,
    dragNodeIds,
    activeMediaNodeIds,
    domRequiredNodeIds,
  ]) {
    for (const handle of toIdSet(payload)) record['add'](handle);
  }
  for (const state of [
    hoverNodeId,
    connOverlay?.['srcId'],
    connOverlay?.['hoverId'],
    pickConnectMode?.['active'] ? pickConnectMode['sourceNodeId'] : null,
    pickConnectMode?.['active'] ? pickConnectMode['srcId'] : null,
    pickConnectMode?.['active'] ? pickConnectMode['hoverNodeId'] : null,
    pickConnectMode?.['active'] ? pickConnectMode['hoverId'] : null,
  ]) {
    if (state != null && state !== '') record['add'](state);
  }
  for (const config of [
    connOverlay?.['activeNodeIds'],
    pickConnectMode?.['active'] ? pickConnectMode['activeNodeIds'] : null,
  ]) {
    for (const scope of toIdSet(config)) record['add'](scope);
  }
  return record;
}
export function resolveRendererRasterPreviewSources(input) {
  return resolveRendererPreviewNodePresentation(input, { displayFirst: ![] })['sources'];
}
export function createRendererRasterPreviewCoordinator({
  layer: layer = null,
  createLayer: createLayer = createRendererRasterPreviewLayer,
  isRasterSupportedNode: isRasterSupportedNode = defaultSupportsRasterPreview,
  isDomMediaPresented: isDomMediaPresented = null,
  onMediaPresented: onMediaPresented = null,
  onRasterMediaClaimed: onRasterMediaClaimed = null,
  onRasterHandoffFrame: onRasterHandoffFrame = null,
  resolvePresentation: resolvePresentation = resolveRendererPreviewNodePresentation,
} = {}) {
  const run2 = () =>
    createLayer({
      resolveMediaSources: resolveRendererRasterPreviewSources,
      onMediaPresented: onMediaPresented2,
    });
  let output = layer || run2(),
    previousRasterIds = new Set(),
    map3 = new Set(),
    map4 = new Set(),
    map5 = new Set(),
    map6 = new Map();
  const map7 = new Map();
  let value2 = '',
    mediaLoadingBusy2 = ![],
    enabled2 = ![],
    box4 = null,
    previewMotion = { active: ![] },
    value3 = null;
  function onMediaPresented2(value4) {
    const state2 = value3,
      list2 = state2
        ? (value4?.['nodeIds'] || [])['filter'](
            (value5) =>
              state2['identities']['has'](value5) &&
              state2['identities']['get'](value5) ===
                buildRasterPresentationIdentity(getNode(state2['nodes'], value5), resolvePresentation),
          )
        : [];
    if (list2['length']) {
      for (const value6 of list2) {
        (map5['add'](value6), previousRasterIds['add'](value6), map3['delete'](value6));
      }
      onRasterMediaClaimed?.(list2);
    }
    onMediaPresented?.(value4);
  }
  function run3(value7, value8) {
    const cacheKey = buildRasterPresentationIdentityCacheKey(value8),
      value9 = map7['get'](value7);
    if (cacheKey !== null && value9?.['cacheKey'] === cacheKey) return value9['identity'];
    const identity = buildRasterPresentationIdentity(value8, resolvePresentation);
    if (cacheKey === null) map7['delete'](value7);
    else map7['set'](value7, { cacheKey: cacheKey, identity: identity });
    return identity;
  }
  function sync({
    canvasEl: canvasEl,
    nodes: nodes,
    scenePlan: scenePlan,
    selectedNodeIds: selectedNodeIds2,
    hoveredNodeIds: hoveredNodeIds2,
    hoverNodeId: hoverNodeId2,
    dragNodeIds: dragNodeIds2,
    connOverlay: connOverlay2,
    pickConnectMode: pickConnectMode2,
    activeMediaNodeIds: activeMediaNodeIds2,
    domRequiredNodeIds: domRequiredNodeIds2,
    viewport: viewport,
    containerWidth: containerWidth,
    containerHeight: containerHeight,
    viewportBusy: viewportBusy = ![],
    mediaLoadingBusy: mediaLoadingBusy = viewportBusy,
    freezeRasterSurface: freezeRasterSurface = ![],
    lockRasterParticipation: lockRasterParticipation = ![],
    deferInitialPlanning: deferInitialPlanning = ![],
    releaseFullSurface: releaseFullSurface,
    devicePixelRatio: devicePixelRatio = typeof window !== 'undefined' ? window['devicePixelRatio'] : 0x1,
  } = {}) {
    ((value3 = null), (mediaLoadingBusy2 = mediaLoadingBusy === !![]));
    const enabled3 =
      box4 && viewport?.['zoom'] === box4['zoom']
        ? {
            active: !![],
            dx: (box4['x'] - viewport['x']) / viewport['zoom'],
            dy: (box4['y'] - viewport['y']) / viewport['zoom'],
          }
        : { active: ![] };
    if (!enabled3['dx'] && !enabled3['dy']) enabled3['active'] = ![];
    if (enabled3['active'] || !viewportBusy || viewport?.['zoom'] !== box4?.['zoom'])
      previewMotion = enabled3;
    box4 = viewport ? { ...viewport } : null;
    const fullSurfaceIds = toIdSet(scenePlan?.['fullSurfaceIds']),
      proxyCount = toIdSet(scenePlan?.['proxySurfaceIds']),
      args = toIdSet(scenePlan?.['fullSurfaceReleaseIds']),
      exactVisibleCount = toIdSet(scenePlan?.['exactVisibleIds']),
      value10 =
        mediaLoadingBusy2 &&
        proxyCount['size'] >= DENSE_RASTER_MEDIA_DEFER_NODE_COUNT &&
        map4['size'] === 0x0;
    if (map4['size'] === 0x0 && (deferInitialPlanning === !![] || value10)) {
      const rasterIds = new Set(),
        domProxyIds = new Set([...exactVisibleCount]['filter']((value11) => !fullSurfaceIds['has'](value11))),
        domPreviewCandidateIds = new Set([...fullSurfaceIds, ...domProxyIds]),
        domPreviewMediaSourceOwnerIds = new Set(
          [...domPreviewCandidateIds]['filter']((value12) => exactVisibleCount['has'](value12)),
        ),
        releasableFullSurfaceIds = new Set(
          [...args]['filter'](
            (value13) => !exactVisibleCount['has'](value13) || !isVisualMediaNode(getNode(nodes, value13)),
          ),
        );
      if (typeof releaseFullSurface === 'function')
        for (const value14 of releasableFullSurfaceIds) {
          releaseFullSurface(value14);
        }
      ((previousRasterIds = rasterIds), (map3 = new Set(domPreviewMediaSourceOwnerIds)));
      const signature = 'deferred-initial:' + fullSurfaceIds['size'] + ':' + domProxyIds['size'],
        policy = {
          active: ![],
          rasterIds: rasterIds,
          domProxyIds: domProxyIds,
          reason: 'deferred-initial-raster-planning',
          signature: signature,
          coverageSignature: signature,
          stats: {
            scenePressure: Number(scenePlan?.['pressure']) || 0x0,
            proxyPressure: 0x0,
            activationSignal: 0x0,
            activationFloor: 0x0,
            rasterShare: 0x0,
            proxyCount: proxyCount['size'],
            rasterCandidateCount: 0x0,
            rasterCount: 0x0,
            domProxyCount: domProxyIds['size'],
            interactiveDomCount: 0x0,
            unsupportedDomCount: 0x0,
            projectedDomCount: 0x0,
            exactVisibleCount: exactVisibleCount['size'],
            exactVisibleCoveredCount: exactVisibleCount['size'],
            exactVisibleMissingCount: 0x0,
          },
        };
      return {
        active: ![],
        rasterIds: rasterIds,
        domProxyIds: domProxyIds,
        domPreviewCandidateIds: domPreviewCandidateIds,
        domPreviewMediaSourceOwnerIds: domPreviewMediaSourceOwnerIds,
        releasableFullSurfaceIds: releasableFullSurfaceIds,
        policy: policy,
        layerStats: { active: ![], supported: !![], deferred: !![], drawnNodeIds: [], drawnMediaNodeIds: [] },
        freezeActive: ![],
        signature: signature,
      };
    }
    const rasterSupportedNodeIds = new Set(
        [...proxyCount]['filter']((value15) => {
          const node = getNode(nodes, value15);
          if (!isRasterSupportedNode(node, value15)) return ![];
          return !(value10 && exactVisibleCount['has'](value15) && isVisualMediaNode(node));
        }),
      ),
      policy2 = planRendererRasterProxies({
        nodes: nodes,
        fullSurfaceIds: fullSurfaceIds,
        proxySurfaceIds: proxyCount,
        exactVisibleIds: scenePlan?.['exactVisibleIds'],
        rasterSupportedNodeIds: rasterSupportedNodeIds,
        previousRasterIds: previousRasterIds,
        selectedNodeIds: selectedNodeIds2,
        hoveredNodeIds: hoveredNodeIds2,
        hoverNodeId: hoverNodeId2,
        dragNodeIds: dragNodeIds2,
        connOverlay: connOverlay2,
        pickConnectMode: pickConnectMode2,
        activeMediaNodeIds: activeMediaNodeIds2,
        domRequiredNodeIds: domRequiredNodeIds2,
        viewport: viewport,
        scenePressure: scenePlan?.['pressure'],
      }),
      map8 = collectExplicitDomRequiredIds({
        selectedNodeIds: selectedNodeIds2,
        hoveredNodeIds: hoveredNodeIds2,
        hoverNodeId: hoverNodeId2,
        dragNodeIds: dragNodeIds2,
        connOverlay: connOverlay2,
        pickConnectMode: pickConnectMode2,
        activeMediaNodeIds: activeMediaNodeIds2,
        domRequiredNodeIds: domRequiredNodeIds2,
      }),
      map9 = new Set(),
      map10 = new Set();
    if (typeof output['captureNodeFrame'] === 'function' && typeof onRasterHandoffFrame === 'function')
      for (const value16 of map5) {
        if (!map8['has'](value16) || !exactVisibleCount['has'](value16)) continue;
        const node2 = getNode(nodes, value16);
        if (!node2 || map6['get'](value16) !== run3(value16, node2)) continue;
        let value17 = ![];
        try {
          value17 = isDomMediaPresented?.(value16, node2) === !![];
        } catch {}
        if (value17) continue;
        map9['add'](value16);
        const enabled4 = output['captureNodeFrame'](value16);
        if (!enabled4) continue;
        try {
          (onRasterHandoffFrame(value16, enabled4), map10['add'](value16));
        } catch {}
      }
    const args2 = new Set(
        [...map5]['filter']((value18) => {
          const value19 = map8['has'](value18);
          if (
            typeof isDomMediaPresented !== 'function' ||
            policy2['rasterIds']['has'](value18) ||
            !exactVisibleCount['has'](value18) ||
            (value19 && !map9['has'](value18)) ||
            map10['has'](value18)
          )
            return ![];
          const node3 = getNode(nodes, value18);
          if (!node3 || !isVisualMediaNode(node3)) return ![];
          if (map6['get'](value18) !== run3(value18, node3)) return ![];
          try {
            return isDomMediaPresented?.(value18, node3) !== !![];
          } catch {
            return !![];
          }
        }),
      ),
      value20 = lockRasterParticipation === !![] && freezeRasterSurface === !![] && viewportBusy === !![],
      map11 = value20 && map4['size'] === 0x0 ? new Set() : policy2['rasterIds'],
      map12 = new Set([...map11, ...args2]),
      list3 = [...map11]['filter']((value21) => exactVisibleCount['has'](value21)),
      value22 = [...map4]['some']((value23) => !map12['has'](value23)),
      rasterVisualStateSignature = buildRasterVisualStateSignature(connOverlay2, policy2['rasterIds']),
      enabled5 = rasterVisualStateSignature !== value2,
      enabled6 = [...map4]['some']((value24) => {
        const node4 = getNode(nodes, value24);
        return !node4 || map6['get'](value24) !== run3(value24, node4);
      }),
      enabled7 = [...map4]['some']((value25) => map8['has'](value25)),
      reuseWhileBusy =
        freezeRasterSurface === !![] &&
        viewportBusy &&
        map4['size'] > 0x0 &&
        (map11['size'] > 0x0 || value20) &&
        !enabled5 &&
        !enabled6 &&
        !enabled7,
      forceRender = enabled5 || enabled6 || enabled7 || (!reuseWhileBusy && value22),
      args3 = reuseWhileBusy ? map4 : map12;
    value3 = {
      nodes: nodes,
      identities: new Map(
        [...args3]
          ['filter']((value26) => !map8['has'](value26) && map11['has'](value26))
          ['map']((value27) => [value27, run3(value27, getNode(nodes, value27))]),
      ),
    };
    const layerStats = output['sync'](canvasEl, nodes, args3, {
        forceRender: forceRender,
        reuseWhileBusy:
          reuseWhileBusy ||
          (viewportBusy && !forceRender && list3['every']((value28) => previousRasterIds['has'](value28))),
        renderScale: resolveRenderScale(viewport, devicePixelRatio),
        mediaLoadNodeIds: exactVisibleCount,
        viewport: viewport,
        viewportBusy: viewportBusy,
        mediaLoadingBusy: mediaLoadingBusy2 || enabled2,
        invalidNodeIds: connOverlay2?.['invalidNodeIds'],
        sourceNodeId: connOverlay2?.['srcId'],
        hoverNodeId:
          connOverlay2?.['hoverId'] ||
          (pickConnectMode2?.['active'] ? pickConnectMode2['hoverNodeId'] : null),
      }),
      map13 =
        layerStats?.['supported'] === !![] && layerStats?.['active'] === !![]
          ? toIdSet(layerStats['drawnNodeIds'])
          : new Set(),
      map14 =
        layerStats?.['supported'] === !![] && layerStats?.['active'] === !![]
          ? toIdSet(layerStats['drawnMediaNodeIds'])
          : new Set();
    ((map4 = map13),
      (map5 = map14),
      (map6 = new Map([...map13]['map']((value29) => [value29, run3(value29, getNode(nodes, value29))]))));
    for (const value30 of map7['keys']()) {
      !map13['has'](value30) && map7['delete'](value30);
    }
    value2 = rasterVisualStateSignature;
    const active = new Set(
        [...(reuseWhileBusy ? map13 : map11)]['filter'](
          (value31) =>
            map13['has'](value31) &&
            (!isVisualMediaNode(getNode(nodes, value31)) ||
              map14['has'](value31) ||
              (reuseWhileBusy &&
                viewport?.['zoom'] <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
                !isRendererFastPreviewMediaReadable(getNode(nodes, value31), { viewport: viewport }) &&
                !map3['has'](value31))) &&
            getNode(nodes, value31) &&
            !map8['has'](value31),
        ),
      ),
      domProxyIds2 = new Set(policy2['domProxyIds']),
      map15 = viewportBusy
        ? selectRendererMotionAheadMediaIds(
            [...policy2['rasterIds']]
              ['filter']((value32) => !active['has'](value32) && isVisualMediaNode(getNode(nodes, value32)))
              ['map']((nodeId) => ({ nodeId: nodeId, geometry: getNode(nodes, nodeId) })),
            {
              viewport: viewport,
              previewMotion: previewMotion,
              containerWidth: containerWidth,
              containerHeight: containerHeight,
            },
          )
        : new Set();
    for (const value33 of policy2['rasterIds']) {
      !active['has'](value33) &&
        (layerStats?.['active'] !== !![] || exactVisibleCount['has'](value33) || map15['has'](value33)) &&
        domProxyIds2['add'](value33);
    }
    previousRasterIds = active;
    const domPreviewCandidateIds2 = new Set([...fullSurfaceIds, ...domProxyIds2]);
    for (const value34 of active) {
      (domPreviewCandidateIds2['delete'](value34), domProxyIds2['delete'](value34));
    }
    const map16 = new Set(
        reuseWhileBusy ? [...policy2['rasterIds']]['filter']((value35) => !active['has'](value35)) : [],
      ),
      domPreviewMediaSourceOwnerIds2 = new Set(
        [...domPreviewCandidateIds2]['filter'](
          (value36) => (exactVisibleCount['has'](value36) && !map16['has'](value36)) || map15['has'](value36),
        ),
      );
    if (reuseWhileBusy)
      for (const value37 of map3) {
        domPreviewCandidateIds2['has'](value37) &&
          exactVisibleCount['has'](value37) &&
          !map14['has'](value37) &&
          domPreviewMediaSourceOwnerIds2['add'](value37);
      }
    if (value20)
      for (const value38 of map3) {
        if (map14['has'](value38) || !getNode(nodes, value38)) continue;
        (domPreviewCandidateIds2['add'](value38),
          domProxyIds2['add'](value38),
          domPreviewMediaSourceOwnerIds2['add'](value38));
      }
    map3 = new Set(domPreviewMediaSourceOwnerIds2);
    const releasableFullSurfaceIds2 = new Set(
      [...args]['filter'](
        (value39) =>
          !exactVisibleCount['has'](value39) ||
          !isVisualMediaNode(getNode(nodes, value39)) ||
          active['has'](value39),
      ),
    );
    if (typeof releaseFullSurface === 'function')
      for (const value40 of releasableFullSurfaceIds2) {
        releaseFullSurface(value40);
      }
    return {
      active: active['size'] > 0x0,
      rasterIds: active,
      domProxyIds: domProxyIds2,
      domPreviewCandidateIds: domPreviewCandidateIds2,
      domPreviewMediaSourceOwnerIds: domPreviewMediaSourceOwnerIds2,
      releasableFullSurfaceIds: releasableFullSurfaceIds2,
      policy: policy2,
      layerStats: layerStats,
      freezeActive: reuseWhileBusy,
      signature:
        policy2['signature'] +
        '|claimed:' +
        [...active]['join']('\x1f') +
        '|handoff:' +
        [...args2]['join']('\x1f'),
    };
  }
  function reset() {
    ((value3 = null),
      (previousRasterIds = new Set()),
      (map3 = new Set()),
      (map4 = new Set()),
      (map5 = new Set()),
      (map6 = new Map()),
      map7['clear'](),
      (value2 = ''),
      (mediaLoadingBusy2 = ![]),
      (enabled2 = ![]),
      (box4 = null),
      (previewMotion = { active: ![] }),
      output['destroy']?.());
    if (!layer) output = run2();
  }
  function setMediaLoadingBusy(value41) {
    return (
      (enabled2 = value41 === !![]),
      output['setMediaLoadingBusy']?.(mediaLoadingBusy2 || enabled2) || null
    );
  }
  function excludeNode(value42) {
    const enabled8 = String(value42 || '')['trim']();
    if (!enabled8) return ![];
    const enabled9 = map4['has'](enabled8) || map5['has'](enabled8) || previousRasterIds['has'](enabled8);
    if (typeof output['excludeNode'] !== 'function') return ![];
    const enabled10 = output['excludeNode'](enabled8) === !![];
    if (!enabled10 && !enabled9) return ![];
    return (
      map4['delete'](enabled8),
      map5['delete'](enabled8),
      map6['delete'](enabled8),
      map7['delete'](enabled8),
      previousRasterIds['delete'](enabled8),
      !![]
    );
  }
  function captureNodeFrame(value43) {
    const enabled11 = String(value43 || '')['trim']();
    if (!enabled11 || !map4['has'](enabled11)) return null;
    return output['captureNodeFrame']?.(enabled11) || null;
  }
  return {
    sync: sync,
    reset: reset,
    captureNodeFrame: captureNodeFrame,
    excludeNode: excludeNode,
    setMediaLoadingBusy: setMediaLoadingBusy,
    getStats: () => output['getStats']?.() || null,
  };
}
