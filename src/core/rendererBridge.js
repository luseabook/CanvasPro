export function syncRendererBridge(_0x34ae4e, _0x228d44 = {}) {
  if (!_0x34ae4e) return;
  const {
    componentMap: _0x2b97c7,
    wrapperMap: _0x404632,
    mountedNodeIds: _0xe4477d,
    nodeToEdgeIds: _0x21997b,
    getEdgeLayerStats: _0x177490,
    hitTestEdgeAtScreenPoint: _0x1cd8cc,
    prepareDynamicEdges: _0x37da32,
    setEdgeInteractionHighlight: _0x3c2aeb,
    setHoveredEdge: _0x1dd97f,
    markViewportInteractionBusy: _0x36045a,
    releaseViewportInteractionBusy: _0x2ce7dd,
    pinNode: _0x3f946e,
    unpinNode: _0x3ce753,
    releaseFastPreviewForPlayback: _0x38df96,
    prepareMediaSlotSource: _0x5d337a,
    reportMediaSlotFrame: _0x2b12db,
    flushNode: _0x26b7c1,
    flushNodes: _0x1ea8b9,
    flushSelection: _0x1e87f6,
    captureRasterPreviewNode: _0x308d91,
    excludeRasterPreviewNode: _0x3dfd51,
    syncFastPreviewDragProxy: _0xd2be22,
  } = _0x228d44;
  ((_0x34ae4e['v2Renderer'] = _0x34ae4e['v2Renderer'] || {}),
    delete _0x34ae4e['v2Renderer']['nodeInstances'],
    delete _0x34ae4e['v2Renderer']['wrapperMap'],
    Object['assign'](_0x34ae4e['v2Renderer'], {
      getMountedNodeCount() {
        return _0x404632?.['size'] || 0x0;
      },
      isNodeMounted(_0x51f9ba) {
        return !!(
          _0x51f9ba &&
          _0xe4477d?.['has']?.(_0x51f9ba) &&
          _0x404632?.['get']?.(_0x51f9ba)?.['isConnected']
        );
      },
      getMountedWrapper(_0x1b7736) {
        if (!_0x1b7736 || !_0xe4477d?.['has']?.(_0x1b7736)) return null;
        const _0x32b212 = _0x404632?.['get']?.(_0x1b7736);
        return _0x32b212?.['isConnected'] ? _0x32b212 : null;
      },
      getDragSurfaceWrapper(_0x216b48) {
        const _0x4e1713 = this['getMountedWrapper'](_0x216b48);
        return _0x4e1713?.['dataset']?.['rendererPresentationOwner'] === 'fast-preview' ? null : _0x4e1713;
      },
      queryMountedNodeElement(_0x203fd9, _0x51eac1) {
        const _0x42cde5 = _0x203fd9 ? _0x2b97c7?.['get']?.(_0x203fd9) : null,
          _0x4cec7b = _0x42cde5?.['el'] || this['getMountedWrapper'](_0x203fd9);
        return _0x51eac1 ? _0x4cec7b?.['querySelector']?.(_0x51eac1) || null : _0x4cec7b || null;
      },
      highlightDropSlot(_0x38177e, { kind: kind = '', index: index = -0x1 } = {}) {
        if (!_0x38177e) return ![];
        const _0x542ac3 = _0x2b97c7?.['get']?.(_0x38177e);
        if (kind === 'storyboard' && typeof _0x542ac3?.['highlightCell'] === 'function')
          return (_0x542ac3['highlightCell'](index), !![]);
        if (kind === 'collage' && typeof _0x542ac3?.['highlightSlot'] === 'function')
          return (_0x542ac3['highlightSlot'](index), !![]);
        return ![];
      },
      clearDropSlotHighlight(_0x1f8f1e) {
        if (!_0x1f8f1e) return ![];
        const _0x2edd5f = _0x2b97c7?.['get']?.(_0x1f8f1e);
        let _0xb7946f = ![];
        return (
          typeof _0x2edd5f?.['highlightCell'] === 'function' &&
            (_0x2edd5f['highlightCell'](-0x1), (_0xb7946f = !![])),
          typeof _0x2edd5f?.['highlightSlot'] === 'function' &&
            (_0x2edd5f['highlightSlot'](-0x1), (_0xb7946f = !![])),
          _0xb7946f
        );
      },
      syncNodeDragPreview(_0x188a43, _0x1afc4a) {
        if (!_0x188a43) return ![];
        let _0x52c148 = ![];
        const _0x23fc97 = _0x404632?.['get']?.(_0x188a43),
          _0x2ed490 = !!_0x23fc97 && _0x23fc97['isConnected'] !== ![],
          _0x47a230 = _0x2ed490 && _0x23fc97?.['dataset']?.['rendererPresentationOwner'] !== 'fast-preview',
          _0x3836bf =
            _0x1afc4a?.['active'] === !![] && typeof _0x308d91 === 'function' ? _0x308d91(_0x188a43) : null,
          _0xcc1dd6 = _0x3836bf ? { ..._0x1afc4a, rasterFrame: _0x3836bf } : _0x1afc4a,
          _0x322e0a = _0x2b97c7?.['get']?.(_0x188a43);
        typeof _0x322e0a?.['syncDragPreview'] === 'function' &&
          (_0x322e0a['syncDragPreview'](_0x1afc4a), (_0x52c148 = !![]));
        let _0x282d7a = ![];
        typeof _0xd2be22 === 'function' &&
          ((_0x282d7a = _0xd2be22(_0x188a43, _0xcc1dd6) === !![]), (_0x52c148 = _0x282d7a || _0x52c148));
        const _0x4ce9dd =
          (_0x1afc4a?.['active'] === !![] || _0x1afc4a?.['remove'] === !![]) &&
          (_0x47a230 || (_0x1afc4a?.['active'] === !![] && _0x282d7a));
        return (
          _0x4ce9dd &&
            typeof _0x3dfd51 === 'function' &&
            (_0x52c148 = _0x3dfd51(_0x188a43) === !![] || _0x52c148),
          _0x52c148
        );
      },
      applyImmediateCellSwapPreview(_0x2be468, { sourceIndex: _0x10ccb1, targetIndex: _0x32de0f } = {}) {
        if (!_0x2be468) return { ok: ![], revert() {} };
        const _0x2aa802 = _0x2b97c7?.['get']?.(_0x2be468);
        if (typeof _0x2aa802?.['applyImmediateCellSwap'] !== 'function') return { ok: ![], revert() {} };
        const _0x2d7acc = _0x2aa802['applyImmediateCellSwap'](_0x10ccb1, _0x32de0f);
        return _0x2d7acc && _0x2d7acc['ok'] === !![] && typeof _0x2d7acc['revert'] === 'function'
          ? _0x2d7acc
          : { ok: ![], revert() {} };
      },
      previewCollageItems(_0x443343, _0x41e4be) {
        if (!_0x443343) return ![];
        const _0x2d9a1b = _0x2b97c7?.['get']?.(_0x443343);
        if (typeof _0x2d9a1b?.['previewItems'] !== 'function') return ![];
        return (_0x2d9a1b['previewItems'](_0x41e4be), !![]);
      },
      runMountedNodeGeneration(_0x5ebf02) {
        if (!_0x5ebf02) return { started: ![], result: null };
        const _0x3393b5 = _0x2b97c7?.['get']?.(_0x5ebf02);
        if (typeof _0x3393b5?.['runGeneration'] !== 'function') return { started: ![], result: null };
        return { started: !![], result: Promise['resolve']()['then'](() => _0x3393b5['runGeneration']()) };
      },
      getEdgeIdsForNode(_0x3e8889) {
        if (!_0x3e8889) return [];
        const _0x583ee8 = _0x21997b?.['get']?.(_0x3e8889);
        return _0x583ee8 ? Array['from'](_0x583ee8) : [];
      },
      ...(typeof _0x177490 === 'function' ? { getEdgeLayerStats: _0x177490 } : {}),
      ...(typeof _0x1cd8cc === 'function' ? { hitTestEdgeAtScreenPoint: _0x1cd8cc } : {}),
      ...(typeof _0x37da32 === 'function' ? { prepareDynamicEdges: _0x37da32 } : {}),
      ...(typeof _0x3c2aeb === 'function' ? { setEdgeInteractionHighlight: _0x3c2aeb } : {}),
      ...(typeof _0x1dd97f === 'function' ? { setHoveredEdge: _0x1dd97f } : {}),
      markViewportInteractionBusy: _0x36045a,
      releaseViewportInteractionBusy: _0x2ce7dd,
      ...(typeof _0x38df96 === 'function' ? { releaseFastPreviewForPlayback: _0x38df96 } : {}),
      ...(typeof _0x5d337a === 'function' ? { prepareMediaSlotSource: _0x5d337a } : {}),
      ...(typeof _0x2b12db === 'function' ? { reportMediaSlotFrame: _0x2b12db } : {}),
      pinNode: _0x3f946e,
      unpinNode: _0x3ce753,
      ...(typeof _0x26b7c1 === 'function' ? { flushNode: _0x26b7c1 } : {}),
      ...(typeof _0x1ea8b9 === 'function' ? { flushNodes: _0x1ea8b9 } : {}),
      ...(typeof _0x1e87f6 === 'function' ? { flushSelection: _0x1e87f6 } : {}),
    }));
}
