import { normalizeCanvasLocalPath, resolveCanvasVideoUrl } from '../../services/canvasMediaLocalService.js';
const NODE_GEOMETRY_KEYS = Object['freeze'](['id', 'x', 'y', 'width', 'height']);
function hasGeometryChange(_0x518f44, _0x5d6ff) {
  return NODE_GEOMETRY_KEYS['some']((_0x4767be) => _0x518f44?.[_0x4767be] !== _0x5d6ff?.[_0x4767be]);
}
function getSourceVideoSignature(_0x15b1c3) {
  if (!_0x15b1c3 || _0x15b1c3['type'] !== 'source-video') return '';
  return JSON['stringify']([
    'source-video',
    String(resolveCanvasVideoUrl(_0x15b1c3) || ''),
    String(_0x15b1c3['videoProxyVersion'] || '')['trim'](),
    normalizeCanvasLocalPath(_0x15b1c3['pendingVideoProxyLocalPath']),
    String(_0x15b1c3['pendingVideoProxyVersion'] || '')['trim'](),
  ]);
}
function hasSourceVideoChange(_0x323ac7, _0x18b347) {
  return getSourceVideoSignature(_0x323ac7) !== getSourceVideoSignature(_0x18b347);
}
export function createRendererStateRevisionTracker(_0x4cfea3) {
  function _0x499e5e(_0x226b3f) {
    _0x4cfea3[_0x226b3f] = (_0x4cfea3[_0x226b3f] || 0x0) + 0x1;
  }
  function _0x5f2c02({
    nodes: nodes = ![],
    membership: membership = ![],
    geometry: geometry = ![],
    sourceVideo: sourceVideo = ![],
  } = {}) {
    if (nodes) _0x499e5e('_nodesRev');
    if (membership) _0x499e5e('_nodeMembershipRev');
    if (geometry) _0x499e5e('_nodeGeometryRev');
    if (sourceVideo) _0x499e5e('_sourceVideoRev');
  }
  function _0x2c1aeb() {
    const _0x470345 = { nodes: ![], geometry: ![], sourceVideo: ![] };
    return {
      patch(_0xe15896, _0x2095ef) {
        ((_0x470345['nodes'] = !![]),
          (_0x470345['geometry'] = _0x470345['geometry'] || hasGeometryChange(_0xe15896, _0x2095ef)),
          (_0x470345['sourceVideo'] =
            _0x470345['sourceVideo'] || hasSourceVideoChange(_0xe15896, _0x2095ef)));
      },
      commit() {
        _0x5f2c02(_0x470345);
      },
    };
  }
  return {
    add(_0x4aa978, _0x3b41b4) {
      _0x5f2c02({
        nodes: !![],
        membership: !![],
        geometry: !![],
        sourceVideo: hasSourceVideoChange(_0x4aa978, _0x3b41b4),
      });
    },
    content() {
      _0x5f2c02({ nodes: !![] });
    },
    geometry() {
      _0x5f2c02({ nodes: !![], geometry: !![] });
    },
    remove(_0x5027a9) {
      const _0x542129 = (_0x5027a9 || [])
        ['map']((_0x1c448f) => _0x4cfea3['nodes']?.[_0x1c448f])
        ['filter'](Boolean);
      if (_0x542129['length'] === 0x0) return;
      _0x5f2c02({
        nodes: !![],
        membership: !![],
        geometry: !![],
        sourceVideo: _0x542129['some']((_0x7887aa) => _0x7887aa['type'] === 'source-video'),
      });
    },
    patch(_0x5add9b, _0x353e6e) {
      _0x5f2c02({
        nodes: !![],
        geometry: hasGeometryChange(_0x5add9b, _0x353e6e),
        sourceVideo: hasSourceVideoChange(_0x5add9b, _0x353e6e),
      });
    },
    batch: _0x2c1aeb,
    reload() {
      _0x5f2c02({ nodes: !![], membership: !![], geometry: !![], sourceVideo: !![] });
    },
    renderRequest() {
      _0x499e5e('_renderRequestRev');
    },
  };
}
