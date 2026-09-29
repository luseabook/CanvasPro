import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import {
  getRendererSpatialIndexNode,
  queryRendererSpatialIndexIds,
  screenViewportToWorldBounds,
} from './rendererSpatialIndex.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
import { calculateDenseLowZoomRasterStrength } from './rendererRasterProxyPolicy.js';
function toIdSet(_0x50c1c7) {
  if (_0x50c1c7 instanceof Set) return new Set(_0x50c1c7);
  if (Array['isArray'](_0x50c1c7)) return new Set(_0x50c1c7);
  return new Set();
}
function getContainerSize(_0x415185) {
  return {
    width: Number['isFinite'](_0x415185?.['width']) ? _0x415185['width'] : 0x0,
    height: Number['isFinite'](_0x415185?.['height']) ? _0x415185['height'] : 0x0,
  };
}
function createSpatialNodeMapView(_0x3662a0, _0x5c4823) {
  const _0x496228 = _0x3662a0?.['nodesById'];
  if (!(_0x496228 instanceof Map)) return null;
  const _0x3b0cbb = (_0x4aec8c) => {
    if (_0x5c4823 instanceof Map) return _0x5c4823['get'](_0x4aec8c);
    if (_0x5c4823 && typeof _0x5c4823 === 'object' && !Array['isArray'](_0x5c4823))
      return _0x5c4823[_0x4aec8c];
    return getRendererSpatialIndexNode(_0x3662a0, _0x4aec8c);
  };
  return {
    get size() {
      return _0x496228['size'];
    },
    get(_0x21f840) {
      return _0x3b0cbb(_0x21f840);
    },
    has(_0x2f50fa) {
      return _0x496228['has'](_0x2f50fa);
    },
    keys() {
      return _0x496228['keys']();
    },
    *[Symbol['iterator']]() {
      for (const [_0x3632d9] of _0x496228) {
        yield [_0x3632d9, _0x3b0cbb(_0x3632d9)];
      }
    },
  };
}
function createNodeMap(_0x570841, _0x34cb38 = null) {
  const _0x9a1308 = createSpatialNodeMapView(_0x34cb38, _0x570841);
  if (_0x9a1308) return _0x9a1308;
  const _0xefbfb0 = new Map();
  let _0x4cd801 = [];
  if (Array['isArray'](_0x570841))
    _0x4cd801 = _0x570841['map']((_0xb95fc6) => [_0xb95fc6?.['id'], _0xb95fc6]);
  else {
    if (_0x570841 instanceof Map) _0x4cd801 = _0x570841['entries']();
    else _0x570841 && typeof _0x570841 === 'object' && (_0x4cd801 = Object['entries'](_0x570841));
  }
  for (const [_0x37f783, _0x2cfc31] of _0x4cd801) {
    if (!_0x2cfc31 || typeof _0x2cfc31 !== 'object') continue;
    const _0x25dfc5 = _0x2cfc31['id'] ?? _0x37f783;
    if (_0x25dfc5 == null || _0x25dfc5 === '') continue;
    _0xefbfb0['set'](_0x25dfc5, _0x2cfc31);
  }
  return _0xefbfb0;
}
function getSpatialNodeOrder(_0x56eac5, _0x518990) {
  const _0x4b04ba = _0x56eac5?.['nodesById']?.['get']?.(_0x518990)?.['order'];
  return Number['isFinite'](_0x4b04ba) ? _0x4b04ba : 0x0;
}
function collectViewportRangeIds({
  nodeById: _0x464d05,
  spatialIndex: _0x8110fe,
  viewport: _0x258adb,
  width: _0x5d7491,
  height: _0x45ca76,
  padding: _0x590392,
}) {
  if (!_0x8110fe)
    return new Set(
      [..._0x464d05['keys']()]['filter']((_0x3ea425) =>
        isNodeInsideViewportPadding(_0x464d05['get'](_0x3ea425), _0x258adb, _0x5d7491, _0x45ca76, _0x590392),
      ),
    );
  const _0x5519cf = screenViewportToWorldBounds({
    viewport: _0x258adb,
    containerWidth: _0x5d7491,
    containerHeight: _0x45ca76,
    padding: _0x590392,
  });
  return new Set(
    [...queryRendererSpatialIndexIds(_0x8110fe, _0x5519cf)]['filter']((_0x12ab43) =>
      isNodeInsideViewportPadding(_0x464d05['get'](_0x12ab43), _0x258adb, _0x5d7491, _0x45ca76, _0x590392),
    ),
  );
}
function smoothstep(_0x103e29, _0x3d64a4, _0x1879f6) {
  if (_0x1879f6 <= _0x103e29) return 0x0;
  if (_0x1879f6 >= _0x3d64a4) return 0x1;
  const _0x23f848 = (_0x1879f6 - _0x103e29) / (_0x3d64a4 - _0x103e29);
  return _0x23f848 * _0x23f848 * (0x3 - 0x2 * _0x23f848);
}
function calculateScenePressure(_0x17ef30, _0x4cd583) {
  const _0x3f9fb5 = smoothstep(0x18, 0x78, _0x17ef30),
    _0x4284e1 = smoothstep(0x50, 0x140, _0x4cd583);
  return Math['max'](_0x3f9fb5, _0x4284e1);
}
function calculateProjectedDetail(_0x73a5c3, _0x229b3c, _0x30afc6) {
  if (_0x73a5c3['size'] === 0x0) return 0x0;
  const _0x3fbfb2 =
    Number['isFinite'](_0x30afc6?.['zoom']) && _0x30afc6['zoom'] > 0x0 ? _0x30afc6['zoom'] : 0x1;
  let _0x598f58 = 0x0,
    _0x5bd929 = 0x0;
  for (const _0x44cffb of _0x73a5c3) {
    const _0x15e5f9 = _0x229b3c['get'](_0x44cffb);
    if (!_0x15e5f9) continue;
    const _0x42508f = Math['max'](0x1, Number(_0x15e5f9['width']) || 0xa0) * _0x3fbfb2,
      _0x50e6b7 = Math['max'](0x1, Number(_0x15e5f9['height']) || 0x78) * _0x3fbfb2;
    ((_0x598f58 += _0x42508f * _0x50e6b7), (_0x5bd929 += 0x1));
  }
  if (_0x5bd929 === 0x0) return 0x0;
  const _0x38dcc2 = _0x598f58 / _0x5bd929,
    _0x128e3 = Math['round'](_0x38dcc2 * 0x3b9aca00) / 0x3b9aca00;
  return smoothstep(0x4b0, 0x1c20, _0x128e3);
}
function interpolate(_0x332482, _0x5ce201, _0x5d1139) {
  return _0x332482 + (_0x5ce201 - _0x332482) * _0x5d1139;
}
function calculateDynamicPadding(_0x262a53, _0x3e53ac) {
  const _0x541d15 = interpolate(0x1a4, 0x60, _0x262a53),
    _0x3158f5 = 0x2d0 * _0x262a53 * (0x1 - _0x3e53ac) ** 0x2,
    _0x4554f0 = Math['max'](
      _0x541d15,
      interpolate(0x2d0, 0xf0, _0x262a53) +
        interpolate(0xf0, 0x0, _0x3e53ac) -
        0x90 * _0x262a53 * _0x3e53ac +
        _0x3158f5,
    );
  return {
    mount: _0x541d15,
    preview: _0x4554f0,
    park: Math['max'](interpolate(0x384, 0x168, _0x262a53), _0x4554f0 + 0x78),
  };
}
function collectLiveIds(_0x4bbfa4, ..._0x3325fe) {
  const _0x10b10f = new Set();
  for (const _0x5493ed of _0x3325fe) {
    for (const _0x1e1315 of toIdSet(_0x5493ed)) {
      if (_0x4bbfa4['has'](_0x1e1315)) _0x10b10f['add'](_0x1e1315);
    }
  }
  return _0x10b10f;
}
function buildSurfaceSignature(_0x43d3fb, _0x4a3a48, _0x447d56) {
  return ['full', ..._0x43d3fb, 'proxy', ..._0x4a3a48, 'generation-busy', ..._0x447d56]['join']('\x1f');
}
function getNodeDistanceSquared(_0x1d6ea1, _0x18f8f0, _0x3e8fde, _0xf7427c) {
  const _0x506a6e =
      Number['isFinite'](_0x18f8f0?.['zoom']) && _0x18f8f0['zoom'] > 0x0 ? _0x18f8f0['zoom'] : 0x1,
    _0x1b0095 = Number['isFinite'](_0x18f8f0?.['x']) ? _0x18f8f0['x'] : 0x0,
    _0x5bdd4a = Number['isFinite'](_0x18f8f0?.['y']) ? _0x18f8f0['y'] : 0x0,
    _0x16ee97 =
      ((Number['isFinite'](_0x1d6ea1?.['x']) ? _0x1d6ea1['x'] : 0x0) +
        (Number['isFinite'](_0x1d6ea1?.['width']) ? _0x1d6ea1['width'] : 0x0) / 0x2) *
        _0x506a6e +
      _0x1b0095,
    _0x484f51 =
      ((Number['isFinite'](_0x1d6ea1?.['y']) ? _0x1d6ea1['y'] : 0x0) +
        (Number['isFinite'](_0x1d6ea1?.['height']) ? _0x1d6ea1['height'] : 0x0) / 0x2) *
        _0x506a6e +
      _0x5bdd4a,
    _0x2220fb = _0x16ee97 - _0x3e8fde / 0x2,
    _0x5b872c = _0x484f51 - _0xf7427c / 0x2;
  return _0x2220fb * _0x2220fb + _0x5b872c * _0x5b872c;
}
export function buildRendererScenePlan({
  nodes: nodes = [],
  spatialIndex: spatialIndex = null,
  viewport: viewport = { x: 0x0, y: 0x0, zoom: 0x1 },
  containerRect: _0x477e2a,
  mountCandidateIds: _0x1e5fd9,
  previewCandidateIds: _0x4dcb3e,
  parkCandidateIds: _0x4214ab,
  selectedNodeIds: _0x363c80,
  activeNodeIds: _0x180dc0,
  keepAliveNodeIds: _0x287680,
  mountedNodeIds: _0x5fb85d,
  fullEligibleVisibleImageNodeIds: _0x53c847,
  includeParkIds: includeParkIds = !![],
  deferInitialPlanning: deferInitialPlanning = ![],
} = {}) {
  const { width: _0x24d10d, height: _0x16eb81 } = getContainerSize(_0x477e2a),
    _0x5325cf = createNodeMap(nodes, spatialIndex),
    _0x3271ac = new Map(),
    _0x4cac6c = (_0xc47f3e) => {
      if (_0x3271ac['has'](_0xc47f3e)) return _0x3271ac['get'](_0xc47f3e);
      const _0x1c9451 = getNodeDistanceSquared(_0x5325cf['get'](_0xc47f3e), viewport, _0x24d10d, _0x16eb81);
      return (_0x3271ac['set'](_0xc47f3e, _0x1c9451), _0x1c9451);
    },
    _0x420d0c = collectViewportRangeIds({
      nodeById: _0x5325cf,
      spatialIndex: spatialIndex,
      viewport: viewport,
      width: _0x24d10d,
      height: _0x16eb81,
      padding: 0x0,
    }),
    _0x586020 = new Set(),
    _0x179dca = new Set(),
    _0xe1ce94 = calculateScenePressure(_0x420d0c['size'], _0x5325cf['size']),
    _0x43d74f = calculateProjectedDetail(_0x420d0c, _0x5325cf, viewport),
    _0x3f3a69 = calculateDynamicPadding(_0xe1ce94, _0x43d74f),
    _0x55c616 = smoothstep(0x78, 0x140, _0x5325cf['size']),
    _0x35f2b0 = calculateDenseLowZoomRasterStrength(_0x55c616, viewport),
    _0x299621 = Math['round']((0x30 - 0x10 * _0xe1ce94) * _0x43d74f * (0x1 - _0x35f2b0)),
    _0x395a28 = collectLiveIds(_0x5325cf, _0x5fb85d),
    _0x584f10 = collectLiveIds(_0x5325cf, _0x363c80, _0x180dc0, _0x287680),
    _0x1afd9b = [];
  for (const _0x5732ca of _0x420d0c) {
    shouldShowGenerationBusyUi(_0x5325cf['get'](_0x5732ca)) && _0x1afd9b['push'](_0x5732ca);
  }
  spatialIndex &&
    _0x1afd9b['length'] > 0x1 &&
    _0x1afd9b['sort'](
      (_0x177592, _0x3f1dbd) =>
        getSpatialNodeOrder(spatialIndex, _0x177592) - getSpatialNodeOrder(spatialIndex, _0x3f1dbd),
    );
  const _0xbc4df9 = new Set(_0x1afd9b),
    _0x23ec90 = collectLiveIds(_0x5325cf, _0x1e5fd9);
  for (const _0x154536 of _0x584f10) _0x586020['add'](_0x154536);
  if (deferInitialPlanning === !![] && includeParkIds === ![] && _0x299621 === 0x0) {
    const _0xa22dfe = collectLiveIds(_0x5325cf, _0x4dcb3e, _0x1e5fd9, _0x420d0c);
    for (const _0x53768c of _0xa22dfe) {
      if (!_0x586020['has'](_0x53768c)) _0x179dca['add'](_0x53768c);
    }
    const _0x20ddb1 = new Set([..._0x395a28]['filter']((_0x144812) => !_0x586020['has'](_0x144812))),
      _0x35019f = new Set([..._0x586020, ..._0x179dca]),
      _0x4eded0 = new Set([...toIdSet(_0x53c847)]['filter']((_0x14417b) => _0x586020['has'](_0x14417b)));
    return {
      pressure: _0xe1ce94,
      projectedDetail: _0x43d74f,
      padding: _0x3f3a69,
      fullSurfaceBudget: _0x299621,
      exactVisibleIds: _0x420d0c,
      exactVisibleGenerationBusyIds: _0xbc4df9,
      fullSurfaceIds: _0x586020,
      proxySurfaceIds: _0x179dca,
      parkIds: new Set(),
      fullSurfaceReleaseIds: _0x20ddb1,
      presentationSurfaceIds: _0x35019f,
      plannedFullEligibleVisibleImageNodeIds: _0x4eded0,
      deferredInitialPlanning: !![],
      surfaceSignature: buildSurfaceSignature(_0x586020, _0x179dca, _0xbc4df9),
    };
  }
  const _0x3eb12a = collectViewportRangeIds({
      nodeById: _0x5325cf,
      spatialIndex: spatialIndex,
      viewport: viewport,
      width: _0x24d10d,
      height: _0x16eb81,
      padding: _0x3f3a69['mount'],
    }),
    _0x2ad677 = Math['max'](0x0, _0x299621 - _0x586020['size']);
  if (_0x2ad677 > 0x0) {
    const _0x528a30 = [..._0x3eb12a]
      ['filter']((_0x4f4e1f) => !_0x586020['has'](_0x4f4e1f))
      ['sort']((_0x31c1ec, _0x439f30) => {
        const _0x23ead6 = Number(!_0x420d0c['has'](_0x31c1ec)) - Number(!_0x420d0c['has'](_0x439f30));
        if (_0x23ead6 !== 0x0) return _0x23ead6;
        const _0x1f8376 = Number(!_0xbc4df9['has'](_0x31c1ec)) - Number(!_0xbc4df9['has'](_0x439f30));
        if (_0x1f8376 !== 0x0) return _0x1f8376;
        const _0x4e0ee5 = Number(!_0x23ec90['has'](_0x31c1ec)) - Number(!_0x23ec90['has'](_0x439f30));
        if (_0x4e0ee5 !== 0x0) return _0x4e0ee5;
        const _0x26eae7 = Number(!_0x395a28['has'](_0x31c1ec)) - Number(!_0x395a28['has'](_0x439f30));
        if (_0x26eae7 !== 0x0) return _0x26eae7;
        const _0x2e1fd1 = _0x4cac6c(_0x31c1ec) - _0x4cac6c(_0x439f30);
        if (_0x2e1fd1 !== 0x0) return _0x2e1fd1;
        return getSpatialNodeOrder(spatialIndex, _0x31c1ec) - getSpatialNodeOrder(spatialIndex, _0x439f30);
      });
    for (const _0x2b1803 of _0x528a30['slice'](0x0, _0x2ad677)) {
      _0x586020['add'](_0x2b1803);
    }
  }
  const _0x1faad9 = collectLiveIds(_0x5325cf, _0x4dcb3e),
    _0x442bcf = new Set(
      [
        ...collectViewportRangeIds({
          nodeById: _0x5325cf,
          spatialIndex: spatialIndex,
          viewport: viewport,
          width: _0x24d10d,
          height: _0x16eb81,
          padding: _0x3f3a69['preview'],
        }),
      ]['sort']((_0x49af4e, _0x276edb) => {
        const _0x60bc3b = Number(!_0x1faad9['has'](_0x49af4e)) - Number(!_0x1faad9['has'](_0x276edb));
        if (_0x60bc3b !== 0x0) return _0x60bc3b;
        const _0x46dc1 = _0x4cac6c(_0x49af4e) - _0x4cac6c(_0x276edb);
        if (_0x46dc1 !== 0x0) return _0x46dc1;
        return getSpatialNodeOrder(spatialIndex, _0x49af4e) - getSpatialNodeOrder(spatialIndex, _0x276edb);
      }),
    );
  for (const _0x4663b8 of _0x3eb12a) _0x442bcf['add'](_0x4663b8);
  for (const _0xa32082 of _0x420d0c) {
    _0x442bcf['add'](_0xa32082);
  }
  for (const _0x29d639 of _0x442bcf) {
    if (!_0x586020['has'](_0x29d639)) _0x179dca['add'](_0x29d639);
  }
  let _0x104ac5 = new Set();
  if (includeParkIds !== ![]) {
    const _0x28ff15 = collectLiveIds(_0x5325cf, _0x4214ab),
      _0x195ccb = collectViewportRangeIds({
        nodeById: _0x5325cf,
        spatialIndex: spatialIndex,
        viewport: viewport,
        width: _0x24d10d,
        height: _0x16eb81,
        padding: _0x3f3a69['park'],
      });
    _0x104ac5 = new Set(
      [..._0x5325cf['keys']()]
        ['filter']((_0x10a340) => !_0x195ccb['has'](_0x10a340))
        ['sort']((_0x435860, _0xdd3b5d) => {
          const _0x5be0b7 = Number(!_0x28ff15['has'](_0x435860)) - Number(!_0x28ff15['has'](_0xdd3b5d));
          if (_0x5be0b7 !== 0x0) return _0x5be0b7;
          return getSpatialNodeOrder(spatialIndex, _0x435860) - getSpatialNodeOrder(spatialIndex, _0xdd3b5d);
        }),
    );
    for (const _0x6bc7e5 of _0x395a28) {
      !isNodeInsideViewportPadding(
        _0x5325cf['get'](_0x6bc7e5),
        viewport,
        _0x24d10d,
        _0x16eb81,
        _0x3f3a69['park'],
      ) && _0x104ac5['add'](_0x6bc7e5);
    }
    for (const _0x4fdc6d of _0x586020) _0x104ac5['delete'](_0x4fdc6d);
    for (const _0x57c543 of _0x179dca) _0x104ac5['delete'](_0x57c543);
  }
  const _0x317181 = new Set([..._0x395a28]['filter']((_0x2bc734) => !_0x586020['has'](_0x2bc734))),
    _0xf04568 = new Set([..._0x586020, ..._0x179dca]),
    _0x3989de = new Set([...toIdSet(_0x53c847)]['filter']((_0x25b18c) => _0x586020['has'](_0x25b18c)));
  return {
    pressure: _0xe1ce94,
    projectedDetail: _0x43d74f,
    padding: _0x3f3a69,
    fullSurfaceBudget: _0x299621,
    exactVisibleIds: _0x420d0c,
    exactVisibleGenerationBusyIds: _0xbc4df9,
    fullSurfaceIds: _0x586020,
    proxySurfaceIds: _0x179dca,
    parkIds: _0x104ac5,
    fullSurfaceReleaseIds: _0x317181,
    presentationSurfaceIds: _0xf04568,
    plannedFullEligibleVisibleImageNodeIds: _0x3989de,
    surfaceSignature: buildSurfaceSignature(_0x586020, _0x179dca, _0xbc4df9),
  };
}
