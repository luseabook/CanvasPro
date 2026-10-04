export function syncRendererBridge(enabled, value = {}) {
  if (!enabled) return;
  const {
    componentMap: componentMap,
    wrapperMap: wrapperMap,
    mountedNodeIds: mountedNodeIds,
    nodeToEdgeIds: nodeToEdgeIds,
    getEdgeLayerStats: getEdgeLayerStats,
    hitTestEdgeAtScreenPoint: hitTestEdgeAtScreenPoint,
    prepareDynamicEdges: prepareDynamicEdges,
    setEdgeInteractionHighlight: setEdgeInteractionHighlight,
    setHoveredEdge: setHoveredEdge,
    markViewportInteractionBusy: markViewportInteractionBusy,
    releaseViewportInteractionBusy: releaseViewportInteractionBusy,
    pinNode: pinNode,
    unpinNode: unpinNode,
    releaseFastPreviewForPlayback: releaseFastPreviewForPlayback,
    prepareMediaSlotSource: prepareMediaSlotSource,
    reportMediaSlotFrame: reportMediaSlotFrame,
    flushNode: flushNode,
    flushNodes: flushNodes,
    flushSelection: flushSelection,
    captureRasterPreviewNode: captureRasterPreviewNode,
    excludeRasterPreviewNode: excludeRasterPreviewNode,
    syncFastPreviewDragProxy: syncFastPreviewDragProxy,
  } = value;
  ((enabled['v2Renderer'] = enabled['v2Renderer'] || {}),
    delete enabled['v2Renderer']['nodeInstances'],
    delete enabled['v2Renderer']['wrapperMap'],
    Object['assign'](enabled['v2Renderer'], {
      getMountedNodeCount() {
        return wrapperMap?.['size'] || 0x0;
      },
      isNodeMounted(item) {
        return !!(item && mountedNodeIds?.['has']?.(item) && wrapperMap?.['get']?.(item)?.['isConnected']);
      },
      getMountedWrapper(enabled2) {
        if (!enabled2 || !mountedNodeIds?.['has']?.(enabled2)) return null;
        const el = wrapperMap?.['get']?.(enabled2);
        return el?.['isConnected'] ? el : null;
      },
      getDragSurfaceWrapper(key) {
        const el2 = this['getMountedWrapper'](key);
        return el2?.['dataset']?.['rendererPresentationOwner'] === 'fast-preview' ? null : el2;
      },
      queryMountedNodeElement(result, data) {
        const options = result ? componentMap?.['get']?.(result) : null,
          el3 = options?.['el'] || this['getMountedWrapper'](result);
        return data ? el3?.['querySelector']?.(data) || null : el3 || null;
      },
      highlightDropSlot(enabled3, { kind: kind = '', index: index = -0x1 } = {}) {
        if (!enabled3) return ![];
        const target = componentMap?.['get']?.(enabled3);
        if (kind === 'storyboard' && typeof target?.['highlightCell'] === 'function')
          return (target['highlightCell'](index), !![]);
        if (kind === 'collage' && typeof target?.['highlightSlot'] === 'function')
          return (target['highlightSlot'](index), !![]);
        return ![];
      },
      clearDropSlotHighlight(enabled4) {
        if (!enabled4) return ![];
        const source = componentMap?.['get']?.(enabled4);
        let next = ![];
        return (
          typeof source?.['highlightCell'] === 'function' && (source['highlightCell'](-0x1), (next = !![])),
          typeof source?.['highlightSlot'] === 'function' && (source['highlightSlot'](-0x1), (next = !![])),
          next
        );
      },
      syncNodeDragPreview(enabled5, el4) {
        if (!enabled5) return ![];
        let current = ![];
        const el5 = wrapperMap?.['get']?.(enabled5),
          entry = !!el5 && el5['isConnected'] !== ![],
          record = entry && el5?.['dataset']?.['rendererPresentationOwner'] !== 'fast-preview',
          rasterFrame =
            el4?.['active'] === !![] && typeof captureRasterPreviewNode === 'function'
              ? captureRasterPreviewNode(enabled5)
              : null,
          payload = rasterFrame ? { ...el4, rasterFrame: rasterFrame } : el4,
          handle = componentMap?.['get']?.(enabled5);
        typeof handle?.['syncDragPreview'] === 'function' &&
          (handle['syncDragPreview'](el4), (current = !![]));
        let state = ![];
        typeof syncFastPreviewDragProxy === 'function' &&
          ((state = syncFastPreviewDragProxy(enabled5, payload) === !![]), (current = state || current));
        const config =
          (el4?.['active'] === !![] || el4?.['remove'] === !![]) &&
          (record || (el4?.['active'] === !![] && state));
        return (
          config &&
            typeof excludeRasterPreviewNode === 'function' &&
            (current = excludeRasterPreviewNode(enabled5) === !![] || current),
          current
        );
      },
      applyImmediateCellSwapPreview(enabled6, { sourceIndex: sourceIndex, targetIndex: targetIndex } = {}) {
        if (!enabled6) return { ok: ![], revert() {} };
        const scope = componentMap?.['get']?.(enabled6);
        if (typeof scope?.['applyImmediateCellSwap'] !== 'function') return { ok: ![], revert() {} };
        const response = scope['applyImmediateCellSwap'](sourceIndex, targetIndex);
        return response && response['ok'] === !![] && typeof response['revert'] === 'function'
          ? response
          : { ok: ![], revert() {} };
      },
      previewCollageItems(enabled7, input) {
        if (!enabled7) return ![];
        const output = componentMap?.['get']?.(enabled7);
        if (typeof output?.['previewItems'] !== 'function') return ![];
        return (output['previewItems'](input), !![]);
      },
      runMountedNodeGeneration(enabled8) {
        if (!enabled8) return { started: ![], result: null };
        const value2 = componentMap?.['get']?.(enabled8);
        if (typeof value2?.['runGeneration'] !== 'function') return { started: ![], result: null };
        return { started: !![], result: Promise['resolve']()['then'](() => value2['runGeneration']()) };
      },
      getEdgeIdsForNode(enabled9) {
        if (!enabled9) return [];
        const value3 = nodeToEdgeIds?.['get']?.(enabled9);
        return value3 ? Array['from'](value3) : [];
      },
      ...(typeof getEdgeLayerStats === 'function' ? { getEdgeLayerStats: getEdgeLayerStats } : {}),
      ...(typeof hitTestEdgeAtScreenPoint === 'function'
        ? { hitTestEdgeAtScreenPoint: hitTestEdgeAtScreenPoint }
        : {}),
      ...(typeof prepareDynamicEdges === 'function' ? { prepareDynamicEdges: prepareDynamicEdges } : {}),
      ...(typeof setEdgeInteractionHighlight === 'function'
        ? { setEdgeInteractionHighlight: setEdgeInteractionHighlight }
        : {}),
      ...(typeof setHoveredEdge === 'function' ? { setHoveredEdge: setHoveredEdge } : {}),
      markViewportInteractionBusy: markViewportInteractionBusy,
      releaseViewportInteractionBusy: releaseViewportInteractionBusy,
      ...(typeof releaseFastPreviewForPlayback === 'function'
        ? { releaseFastPreviewForPlayback: releaseFastPreviewForPlayback }
        : {}),
      ...(typeof prepareMediaSlotSource === 'function'
        ? { prepareMediaSlotSource: prepareMediaSlotSource }
        : {}),
      ...(typeof reportMediaSlotFrame === 'function' ? { reportMediaSlotFrame: reportMediaSlotFrame } : {}),
      pinNode: pinNode,
      unpinNode: unpinNode,
      ...(typeof flushNode === 'function' ? { flushNode: flushNode } : {}),
      ...(typeof flushNodes === 'function' ? { flushNodes: flushNodes } : {}),
      ...(typeof flushSelection === 'function' ? { flushSelection: flushSelection } : {}),
    }));
}
