function normalizeNumber(_0xaaed2f, _0x277b0 = 0x0) {
  return Number['isFinite'](_0xaaed2f) ? _0xaaed2f : _0x277b0;
}
function hasNodeRevision(_0x224c5f = {}) {
  return typeof _0x224c5f['_nodesRev'] === 'number' || typeof _0x224c5f['_persistRev'] === 'number';
}
export function createRendererSelectionFastPath({
  buildSelectionRelatedSets: _0x443c3d,
  cancelPendingRender: _0x2f881b,
  consumeViewport: _0x497c5b,
  ensureEdgeIndex: _0x19e14f,
  flushSelectionUpdate: _0xcba41f,
  hasPendingRender: _0x4094bf,
  renderAffectedEdges: _0xdadbc4,
  renderSelectionOverlays: _0x550dfe,
  setCurrentSnapshot: _0x5a089e,
} = {}) {
  let _0x57bc28 = '',
    _0x814761 = null,
    _0x263f7e = ![],
    _0x1fb916 = null;
  function _0x4b3858(_0x3a7bf6 = {}) {
    const _0x66d970 = _0x3a7bf6['viewport'] || {},
      _0x46e01d = _0x3a7bf6['ui'] || {},
      _0x1a09ac = _0x3a7bf6['selectionBox'] || {},
      _0x1e2aee = _0x3a7bf6['picker'] || {},
      _0x4a771e = _0x3a7bf6['contextMenu'] || {},
      _0x5cfabd = _0x3a7bf6['connOverlay'] || {},
      _0x5e174f = _0x3a7bf6['pickConnectMode'] || {};
    return JSON['stringify']({
      nodeCount:
        typeof _0x3a7bf6['_nodeCount'] === 'number'
          ? _0x3a7bf6['_nodeCount']
          : Object['keys'](_0x3a7bf6['nodes'] || {})['length'],
      nodesRev:
        typeof _0x3a7bf6['_nodesRev'] === 'number'
          ? _0x3a7bf6['_nodesRev']
          : typeof _0x3a7bf6['_persistRev'] === 'number'
            ? _0x3a7bf6['_persistRev']
            : 0x0,
      renderRequestRev:
        typeof _0x3a7bf6['_renderRequestRev'] === 'number' ? _0x3a7bf6['_renderRequestRev'] : 0x0,
      edgesRev: typeof _0x3a7bf6['_edgesRev'] === 'number' ? _0x3a7bf6['_edgesRev'] : 0x0,
      viewport: {
        x: normalizeNumber(_0x66d970['x']),
        y: normalizeNumber(_0x66d970['y']),
        zoom: normalizeNumber(_0x66d970['zoom'], 0x1),
      },
      connOverlay: {
        srcId: _0x5cfabd['srcId'] || '',
        hoverId: _0x5cfabd['hoverId'] || '',
        side: _0x5cfabd['side'] || '',
        active: _0x5cfabd['active'] === !![],
        invalidNodeIds: Array['isArray'](_0x5cfabd['invalidNodeIds'])
          ? _0x5cfabd['invalidNodeIds']['map']((_0x588f79) => String(_0x588f79))
          : [],
      },
      pickConnectMode: {
        active: _0x5e174f['active'] === !![],
        sourceNodeId: _0x5e174f['sourceNodeId'] || '',
        hoverNodeId: _0x5e174f['hoverNodeId'] || '',
        handleDirection: _0x5e174f['handleDirection'] || '',
      },
      selectionBox: {
        active: _0x1a09ac['active'] === !![],
        x1: normalizeNumber(_0x1a09ac['x1']),
        y1: normalizeNumber(_0x1a09ac['y1']),
        x2: normalizeNumber(_0x1a09ac['x2']),
        y2: normalizeNumber(_0x1a09ac['y2']),
      },
      picker: {
        visible: _0x1e2aee['visible'] === !![],
        x: normalizeNumber(_0x1e2aee['x']),
        y: normalizeNumber(_0x1e2aee['y']),
        screenX: normalizeNumber(_0x1e2aee['screenX']),
        screenY: normalizeNumber(_0x1e2aee['screenY']),
      },
      contextMenu: {
        visible: _0x4a771e['visible'] === !![],
        x: normalizeNumber(_0x4a771e['x']),
        y: normalizeNumber(_0x4a771e['y']),
        itemCount: Array['isArray'](_0x4a771e['items']) ? _0x4a771e['items']['length'] : 0x0,
      },
      ui: {
        connectionLinesVisible: _0x46e01d['connectionLinesVisible'] !== ![],
        connectionLineStyle: _0x46e01d['connectionLineStyle'] || 'curve',
        imageVideoNodeResizeEnabled: _0x46e01d['imageVideoNodeResizeEnabled'] === !![],
        selectionRelatedHighlightEnabled: _0x46e01d['selectionRelatedHighlightEnabled'] !== ![],
        selectionRelatedHighlightColor: _0x46e01d['selectionRelatedHighlightColor'] || '',
        showVideoMeta: _0x46e01d['showVideoMeta'] === !![],
        titleFollowsCanvasZoom: _0x46e01d['titleFollowsCanvasZoom'] === !![],
        alignFeatureEnabled: _0x46e01d['alignFeatureEnabled'] !== ![],
        alignFeatureTriggerMode: _0x46e01d['alignFeatureTriggerMode'] || 'click',
        alignPanelVisible: _0x46e01d['alignPanelVisible'] === !![],
        alignPanelAnchorWorld: _0x46e01d['alignPanelAnchorWorld']
          ? {
              x: normalizeNumber(_0x46e01d['alignPanelAnchorWorld']['x']),
              y: normalizeNumber(_0x46e01d['alignPanelAnchorWorld']['y']),
            }
          : null,
      },
    });
  }
  function _0x1358ce(_0x15ef52 = {}) {
    const _0x2bf00a = Array['isArray'](_0x15ef52['selectedNodeIds'])
        ? _0x15ef52['selectedNodeIds']['filter'](Boolean)
        : [],
      _0x12a708 = new Set(_0x2bf00a),
      _0x57cbb2 = _0x15ef52['edges'] || {},
      _0x226f95 = typeof _0x15ef52['_edgesRev'] === 'number' ? _0x15ef52['_edgesRev'] : 0x0;
    _0x19e14f?.(_0x57cbb2, _0x226f95);
    const _0x3887a6 =
      _0x15ef52['ui']?.['selectionRelatedHighlightEnabled'] === ![]
        ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
        : _0x443c3d?.(_0x12a708, _0x57cbb2) || {};
    return {
      selectedNodeIds: _0x2bf00a,
      relatedNodeIds: _0x3887a6['relatedNodeIds'] || new Set(),
      relatedEdgeIds: _0x3887a6['relatedEdgeIds'] || new Set(),
      signature: _0x2bf00a['map']((_0x230e3f) => String(_0x230e3f))['join']('\x1f'),
    };
  }
  function _0x57f1cb(_0x4dccb6) {
    ((_0x57bc28 = _0x4b3858(_0x4dccb6)),
      (_0x814761 = _0x1358ce(_0x4dccb6)),
      (_0x263f7e = hasNodeRevision(_0x4dccb6)),
      (_0x1fb916 = _0x4dccb6?.['nodes'] || null));
  }
  function _0x1bd2ce() {
    ((_0x57bc28 = ''), (_0x814761 = null), (_0x263f7e = ![]), (_0x1fb916 = null));
  }
  function _0x5db28e(_0x4defc5, _0x10daf1 = {}) {
    if (!_0x4defc5 || !_0x57bc28) return ![];
    if ((!_0x263f7e || !hasNodeRevision(_0x4defc5)) && (_0x4defc5['nodes'] || null) !== _0x1fb916) return ![];
    const _0x2285e7 = _0x4094bf?.() === !![];
    if (_0x2285e7 && _0x10daf1?.['allowPendingRaf'] !== !![]) return ![];
    const _0x5e6427 = _0x4b3858(_0x4defc5);
    if (_0x5e6427 !== _0x57bc28) return ![];
    const _0x159dde = _0x1358ce(_0x4defc5),
      _0x801a20 = _0x814761;
    if (!_0x801a20) return ![];
    if (_0x159dde['signature'] === _0x801a20['signature'])
      return (_0x5a089e?.(_0x4defc5), (_0x814761 = _0x159dde), !![]);
    _0x2285e7 && _0x10daf1?.['cancelPendingRaf'] === !![] && _0x2f881b?.();
    const _0x310e89 = new Set([
      ...(_0x801a20['selectedNodeIds'] || []),
      ...(_0x159dde['selectedNodeIds'] || []),
      ...(_0x801a20['relatedNodeIds'] || []),
      ...(_0x159dde['relatedNodeIds'] || []),
    ]);
    (_0x5a089e?.(_0x4defc5), _0x497c5b?.(_0x4defc5['viewport']));
    const _0x5df866 = _0xcba41f?.([..._0x310e89], { skipInstanceUpdate: !![] });
    if (_0x5df866 === ![]) return ![];
    const _0x55e4e8 = new Set([
      ...(_0x801a20['relatedEdgeIds'] || []),
      ...(_0x159dde['relatedEdgeIds'] || []),
    ]);
    return (
      _0xdadbc4?.(_0x55e4e8, _0x4defc5, _0x159dde['relatedEdgeIds']),
      _0x550dfe?.(_0x4defc5),
      (_0x814761 = _0x159dde),
      !![]
    );
  }
  return { flushSelectionOnlySnapshot: _0x5db28e, rememberRenderedSnapshot: _0x57f1cb, reset: _0x1bd2ce };
}
