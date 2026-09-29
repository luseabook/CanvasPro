import {
  MANY_EDGES_THRESHOLD,
  queryEdgeVisibilityIndex,
  shouldRenderAllEdgesAtLowZoom,
} from './rendererEdgeVisibilityIndex.js';
import { screenViewportToWorldBounds } from './rendererSpatialIndex.js';
import { screenToWorld } from './math.js';
import { createEdgeHitSpatialIndex } from './rendererEdgeHitIndex.js';
import {
  buildConnectionPathGeometry,
  normalizeConnectionLineStyle,
  resolveConnectionEndpoints,
} from './edgePathGeometry.js';
const SVG_NS = 'http://www.w3.org/2000/svg',
  EDGE_VIEWPORT_PADDING = 0xc8;
export const DEFAULT_EDGE_POOL_BUCKET_COUNT = 0x8;
function normalizeNumber(_0x5de063, _0x2aca1b = 0x0) {
  const _0x340dcf = Number(_0x5de063);
  return Number['isFinite'](_0x340dcf) ? _0x340dcf : _0x2aca1b;
}
function normalizeBucketCount(_0x232d1b) {
  return Math['max'](0x1, Math['floor'](normalizeNumber(_0x232d1b, DEFAULT_EDGE_POOL_BUCKET_COUNT)));
}
export function resolveEdgePoolBucketIndex(_0x3ca398, _0x4dbb9e = DEFAULT_EDGE_POOL_BUCKET_COUNT) {
  const _0x457af0 = normalizeBucketCount(_0x4dbb9e),
    _0xffa410 = String(_0x3ca398 || '');
  let _0x3d206b = 0x811c9dc5;
  for (let _0x2de937 = 0x0; _0x2de937 < _0xffa410['length']; _0x2de937 += 0x1) {
    ((_0x3d206b ^= _0xffa410['charCodeAt'](_0x2de937)), (_0x3d206b = Math['imul'](_0x3d206b, 0x1000193)));
  }
  return (_0x3d206b >>> 0x0) % _0x457af0;
}
export function buildEdgePathGeometry(_0x1320d7, _0x4c55b3, _0x1e33df = null, _0x4086ed = 'curve') {
  if (!_0x1320d7?.['id']) return null;
  const _0x20f377 = _0x4c55b3?.[_0x1320d7['sourceId']],
    _0x239fce = _0x4c55b3?.[_0x1320d7['targetId']];
  if (!_0x20f377 || !_0x239fce) return null;
  const _0x1b6125 = _0x1e33df?.['movedNodeIds'] instanceof Set ? _0x1e33df['movedNodeIds'] : null,
    _0x32f61f = normalizeNumber(_0x1e33df?.['dx']),
    _0x42ff7a = normalizeNumber(_0x1e33df?.['dy']),
    _0x238e91 = _0x1b6125?.['has'](_0x1320d7['sourceId']) ? _0x32f61f : 0x0,
    _0x15c079 = _0x1b6125?.['has'](_0x1320d7['sourceId']) ? _0x42ff7a : 0x0,
    _0x2d06bd = _0x1b6125?.['has'](_0x1320d7['targetId']) ? _0x32f61f : 0x0,
    _0x88b5f5 = _0x1b6125?.['has'](_0x1320d7['targetId']) ? _0x42ff7a : 0x0,
    _0x4f4ff5 = normalizeNumber(_0x20f377['x']) + _0x238e91,
    _0x32351c = normalizeNumber(_0x20f377['y']) + _0x15c079,
    _0x39fb5d = normalizeNumber(_0x239fce['x']) + _0x2d06bd,
    _0x431d2b = normalizeNumber(_0x239fce['y']) + _0x88b5f5,
    _0x1ef99d = resolveConnectionEndpoints({
      sourceX: _0x4f4ff5,
      sourceY: _0x32351c,
      sourceWidth: _0x20f377['width'],
      sourceHeight: _0x20f377['height'],
      targetX: _0x39fb5d,
      targetY: _0x431d2b,
      targetWidth: _0x239fce['width'],
      targetHeight: _0x239fce['height'],
    });
  return buildConnectionPathGeometry({ ..._0x1ef99d, style: _0x4086ed });
}
export function resolveEdgeVisualOwner({
  poolingEnabled: poolingEnabled = ![],
  edge: _0x4aceea,
  relatedEdgeIds: _0x4b1616,
  movedNodeIds: _0x32d297,
  forcedDynamicEdgeIds: _0x259c15,
} = {}) {
  if (!poolingEnabled || !_0x4aceea?.['id']) return 'individual';
  if (_0x4b1616?.['has']?.(_0x4aceea['id'])) return 'individual';
  if (_0x259c15?.['has']?.(_0x4aceea['id'])) return 'individual';
  if (_0x32d297?.['has']?.(_0x4aceea['sourceId']) || _0x32d297?.['has']?.(_0x4aceea['targetId']))
    return 'individual';
  return 'pooled';
}
export function buildPooledEdgeVisualBuckets(
  _0x3c6a3b,
  { bucketCount: bucketCount = DEFAULT_EDGE_POOL_BUCKET_COUNT } = {},
) {
  const _0x198ab7 = normalizeBucketCount(bucketCount),
    _0x34fdb1 = Array['from']({ length: _0x198ab7 }, (_0x19b4b5, _0x4d57f2) => ({
      index: _0x4d57f2,
      edgeIds: [],
      dParts: [],
    }));
  for (const _0x560953 of _0x3c6a3b || []) {
    if (_0x560953?.['owner'] !== 'pooled' || !_0x560953['edgeId'] || !_0x560953['d']) continue;
    const _0x463b9b = _0x34fdb1[resolveEdgePoolBucketIndex(_0x560953['edgeId'], _0x198ab7)];
    (_0x463b9b['edgeIds']['push'](_0x560953['edgeId']), _0x463b9b['dParts']['push'](_0x560953['d']));
  }
  return _0x34fdb1['map']((_0x363b24) => ({
    index: _0x363b24['index'],
    edgeIds: _0x363b24['edgeIds'],
    edgeCount: _0x363b24['edgeIds']['length'],
    d: _0x363b24['dParts']['join']('\x20'),
  }));
}
function isEdgeVisible(_0x39d92d, _0x49f490, _0x5d9dd0, _0x1e4bee, _0x157b3e) {
  if (!_0x39d92d) return ![];
  if (_0x157b3e) return !![];
  const _0xba1825 = normalizeNumber(_0x49f490?.['zoom'], 0x1),
    _0x15baff = normalizeNumber(_0x49f490?.['x']),
    _0x505c62 = normalizeNumber(_0x49f490?.['y']),
    _0x5225c1 = _0x39d92d['startX'] * _0xba1825 + _0x15baff,
    _0x5e359a = _0x39d92d['startY'] * _0xba1825 + _0x505c62,
    _0x163992 = _0x39d92d['endX'] * _0xba1825 + _0x15baff,
    _0x575035 = _0x39d92d['endY'] * _0xba1825 + _0x505c62;
  return (
    Math['max'](_0x5225c1, _0x163992) > -EDGE_VIEWPORT_PADDING &&
    Math['min'](_0x5225c1, _0x163992) < _0x5d9dd0 + EDGE_VIEWPORT_PADDING &&
    Math['max'](_0x5e359a, _0x575035) > -EDGE_VIEWPORT_PADDING &&
    Math['min'](_0x5e359a, _0x575035) < _0x1e4bee + EDGE_VIEWPORT_PADDING
  );
}
export function createRendererEdgeLayer({
  createHitSpatialIndex: createHitSpatialIndex = createEdgeHitSpatialIndex,
  getContainerSize: _0x5c973e,
  manyEdgesThreshold: manyEdgesThreshold = MANY_EDGES_THRESHOLD,
  nowMs: nowMs = () =>
    typeof performance !== 'undefined' && typeof performance['now'] === 'function'
      ? performance['now']()
      : Date['now'](),
  poolBucketCount: poolBucketCount = DEFAULT_EDGE_POOL_BUCKET_COUNT,
  recordRedrawSample: recordRedrawSample = () => {},
} = {}) {
  const _0x1acc03 = normalizeBucketCount(poolBucketCount),
    _0x3f7666 = new Map(),
    _0x2adbdf = new Set(),
    _0x25a029 = Array['from']({ length: _0x1acc03 }, () => new Map()),
    _0x9c9575 = createHitSpatialIndex(),
    _0x48eb01 = new Set(),
    _0xe27dc3 = Array['from']({ length: _0x1acc03 }, () => null);
  let _0x365c27 = null,
    _0x1b78c7 = null,
    _0x57e651 = null,
    _0x4e6cd2 = null,
    _0x5eb238 = null,
    _0xc030e2 = { x: 0x0, y: 0x0, zoom: 0x1 },
    _0x82ee38 = ![],
    _0x2a2097 = '',
    _0x3176ce = '',
    _0x314191 = 0x0;
  function _0xdb778a() {
    return _0x365c27?.['ownerDocument'] || globalThis['document'];
  }
  function _0x344fcd(_0xa718d4) {
    if (!_0xa718d4 || _0x365c27 === _0xa718d4) return;
    (_0x58ec5a(_0x365c27), (_0x365c27 = _0xa718d4));
  }
  function _0x273328() {
    if (!_0x365c27 || !_0x82ee38) return null;
    (!_0x1b78c7 || _0x1b78c7['parentNode'] !== _0x365c27) &&
      ((_0x1b78c7 = _0xdb778a()['createElementNS'](SVG_NS, 'g')),
      (_0x1b78c7['id'] = 'v2-edge-pool'),
      _0x1b78c7['setAttribute']('class', 'connection-pool'),
      _0x1b78c7['setAttribute']('data-edge-visual-layer', 'pooled'),
      _0x365c27['prepend'](_0x1b78c7));
    for (let _0x3efd70 = 0x0; _0x3efd70 < _0x1acc03; _0x3efd70 += 0x1) {
      let _0x1e49f0 = _0xe27dc3[_0x3efd70];
      if (_0x1e49f0 && _0x1e49f0['parentNode'] === _0x1b78c7) continue;
      ((_0x1e49f0 = _0xdb778a()['createElementNS'](SVG_NS, 'path')),
        (_0x1e49f0['id'] = 'v2-edge-pool-' + _0x3efd70),
        _0x1e49f0['setAttribute']('class', 'connection-main\x20connection-pooled-main'),
        _0x1e49f0['setAttribute']('data-edge-pool-bucket', String(_0x3efd70)),
        _0x1e49f0['setAttribute']('d', ''),
        _0x1b78c7['appendChild'](_0x1e49f0),
        (_0xe27dc3[_0x3efd70] = _0x1e49f0));
    }
    return _0x1b78c7;
  }
  function _0x2e4afb() {
    (_0x1b78c7?.['remove']?.(), (_0x1b78c7 = null));
    for (let _0x57fa0f = 0x0; _0x57fa0f < _0xe27dc3['length']; _0x57fa0f += 0x1) {
      _0xe27dc3[_0x57fa0f] = null;
    }
  }
  function _0x41cdc0(_0x506eed) {
    const _0x229b0c = _0x506eed === !![];
    if (_0x82ee38 === _0x229b0c) return;
    ((_0x82ee38 = _0x229b0c), _0x9c9575['clear']());
    for (const _0x477d4e of _0x25a029) _0x477d4e['clear']();
    _0x48eb01['clear']();
    if (_0x82ee38) {
      _0x273328();
      for (let _0x99fb83 = 0x0; _0x99fb83 < _0x1acc03; _0x99fb83 += 0x1) {
        _0x48eb01['add'](_0x99fb83);
      }
    } else _0x2e4afb();
  }
  function _0x531d74(_0x502ed8, _0x3cc8c6, _0x438c1d) {
    const _0x4ca2f1 = resolveEdgePoolBucketIndex(_0x502ed8, _0x1acc03),
      _0x122791 = _0x25a029[_0x4ca2f1],
      _0x47e78f = _0x122791['get'](_0x502ed8);
    if (_0x438c1d) {
      if (_0x47e78f === _0x3cc8c6) return ![];
      _0x122791['set'](_0x502ed8, _0x3cc8c6);
    } else {
      if (!_0x122791['has'](_0x502ed8)) return ![];
      _0x122791['delete'](_0x502ed8);
    }
    return (_0x48eb01['add'](_0x4ca2f1), !![]);
  }
  function _0x5dbe3b() {
    if (!_0x82ee38 || _0x48eb01['size'] === 0x0) return 0x0;
    _0x273328();
    let _0x26979b = 0x0;
    for (const _0xad7c12 of _0x48eb01) {
      const _0x5ea201 = _0xe27dc3[_0xad7c12];
      if (!_0x5ea201) continue;
      const _0x27aff3 = _0x25a029[_0xad7c12],
        _0x75a533 = Array['from'](_0x27aff3['values']())['join']('\x20');
      (_0x5ea201['getAttribute']('d') !== _0x75a533 &&
        (_0x5ea201['setAttribute']('d', _0x75a533), (_0x314191 += 0x1), (_0x26979b += 0x1)),
        _0x5ea201['setAttribute']('data-pooled-edge-count', String(_0x27aff3['size'])));
    }
    return (_0x48eb01['clear'](), _0x26979b);
  }
  function _0x19f92a(_0x27dbdc) {
    let _0x30f770 = _0x3f7666['get'](_0x27dbdc);
    if (_0x30f770) return { cache: _0x30f770, created: ![] };
    return (
      (_0x30f770 = {
        edgeId: _0x27dbdc,
        groupEl: null,
        hoverPath: null,
        pathEl: null,
        highlighted: null,
        pooled: ![],
        d: '',
        geometry: null,
        geometryCacheKey: '',
        order: 0x0,
      }),
      _0x3f7666['set'](_0x27dbdc, _0x30f770),
      { cache: _0x30f770, created: !![] }
    );
  }
  function _0x3ae5ca(_0xa4a564) {
    if (!_0xa4a564) return null;
    if (_0xa4a564['groupEl']?.['parentNode'] !== _0x365c27) {
      const _0x2e0825 = _0xdb778a()['createElementNS'](SVG_NS, 'g');
      ((_0x2e0825['id'] = 'edge-group-' + _0xa4a564['edgeId']),
        _0x2e0825['setAttribute']('class', 'connection-group'),
        _0x2e0825['setAttribute']('data-conn-id', _0xa4a564['edgeId']));
      const _0x3b77bc = _0xdb778a()['createElementNS'](SVG_NS, 'path');
      _0x3b77bc['setAttribute']('class', 'connection-bg');
      if (_0xa4a564['d']) _0x3b77bc['setAttribute']('d', _0xa4a564['d']);
      (_0x2e0825['appendChild'](_0x3b77bc),
        _0x365c27['appendChild'](_0x2e0825),
        (_0xa4a564['groupEl'] = _0x2e0825),
        (_0xa4a564['hoverPath'] = _0x3b77bc));
    }
    return _0xa4a564['groupEl'];
  }
  function _0x5e75c7(_0x3598bc) {
    _0x3ae5ca(_0x3598bc);
    if (_0x3598bc?.['pathEl']?.['parentNode'] === _0x3598bc['groupEl']) return _0x3598bc['pathEl'];
    const _0x5d8e73 = _0xdb778a()['createElementNS'](SVG_NS, 'path');
    _0x5d8e73['setAttribute']('class', 'connection-main');
    if (_0x3598bc?.['d']) _0x5d8e73['setAttribute']('d', _0x3598bc['d']);
    return (_0x3598bc['groupEl']['appendChild'](_0x5d8e73), (_0x3598bc['pathEl'] = _0x5d8e73), _0x5d8e73);
  }
  function _0x160d29(_0x1440e0) {
    if (!_0x1440e0) return ![];
    const _0x1a3dc6 = _0x1440e0['groupEl']?.['isConnected'] === !![];
    return (
      _0x1440e0['groupEl']?.['remove']?.(),
      (_0x1440e0['groupEl'] = null),
      (_0x1440e0['hoverPath'] = null),
      (_0x1440e0['pathEl'] = null),
      (_0x1440e0['highlighted'] = null),
      _0x1a3dc6
    );
  }
  function _0x57067e(_0x372005, _0x39bf99) {
    if (!_0x372005?.['groupEl']?.['classList']) return;
    const _0x160e4b = _0x372005['groupEl']['classList']['contains']('connection-highlighted');
    if (_0x39bf99 && !_0x160e4b) _0x372005['groupEl']['classList']['add']('connection-highlighted');
    else !_0x39bf99 && _0x160e4b && _0x372005['groupEl']['classList']['remove']('connection-highlighted');
    _0x372005['highlighted'] = _0x39bf99;
  }
  function _0x37ea9e(
    _0xdbb716,
    _0x334fd9,
    _0x13fc16,
    _0x15ffd,
    _0x14eb03,
    _0x1766fb = _0xdbb716?.['order'] || 0x0,
    _0x2630f2 = '',
  ) {
    const _0x3720be = _0x15ffd === 'pooled',
      _0x11677f = _0xdbb716['pooled'],
      _0x103781 = _0xdbb716['order'],
      _0x196705 = _0xdbb716['d'] !== _0x13fc16['d'];
    ((_0xdbb716['d'] = _0x13fc16['d']),
      (_0xdbb716['geometry'] = _0x13fc16),
      (_0xdbb716['geometryCacheKey'] = _0x2630f2),
      (_0xdbb716['order'] = _0x1766fb));
    if (_0x3720be)
      (_0x160d29(_0xdbb716),
        _0x531d74(_0x334fd9['id'], _0x13fc16['d'], !![]),
        (_0x196705 || !_0x11677f || _0x103781 !== _0x1766fb) &&
          _0x9c9575['upsert']({ edgeId: _0x334fd9['id'], geometry: _0x13fc16, order: _0x1766fb }));
    else {
      if (_0x11677f) _0x9c9575['remove'](_0x334fd9['id']);
      (_0x531d74(_0x334fd9['id'], _0x13fc16['d'], ![]),
        _0x3ae5ca(_0xdbb716),
        _0x57067e(_0xdbb716, !!_0x14eb03?.['has']?.(_0x334fd9['id'])));
      _0xdbb716['hoverPath']['getAttribute']('d') !== _0x13fc16['d'] &&
        _0xdbb716['hoverPath']['setAttribute']('d', _0x13fc16['d']);
      const _0x43b7bd = _0x5e75c7(_0xdbb716);
      _0x43b7bd['getAttribute']('d') !== _0x13fc16['d'] && _0x43b7bd['setAttribute']('d', _0x13fc16['d']);
    }
    return ((_0xdbb716['pooled'] = _0x3720be), _0x196705);
  }
  function _0x37e181(_0x1171b9) {
    const _0x455ded = _0x3f7666['get'](_0x1171b9);
    if (!_0x455ded) return ![];
    (_0x9c9575['remove'](_0x1171b9),
      _0x531d74(_0x1171b9, _0x455ded['d'], ![]),
      _0x455ded['groupEl']?.['remove']?.(),
      _0x3f7666['delete'](_0x1171b9),
      _0x2adbdf['delete'](_0x1171b9));
    if (_0x2a2097 === _0x1171b9) _0x2a2097 = '';
    if (_0x3176ce === _0x1171b9) _0x3176ce = '';
    return !![];
  }
  function _0x35726a() {
    if (!_0x365c27) return null;
    if (_0x57e651?.['parentNode'] === _0x365c27) return _0x57e651;
    return (
      (_0x57e651 = _0xdb778a()['createElementNS'](SVG_NS, 'g')),
      (_0x57e651['id'] = 'v2-edge-interaction-group'),
      _0x57e651['setAttribute']('class', 'connection-group connection-interaction-group'),
      _0x57e651['setAttribute']('data-edge-visual-layer', 'interaction'),
      (_0x4e6cd2 = _0xdb778a()['createElementNS'](SVG_NS, 'path')),
      _0x4e6cd2['setAttribute']('class', 'connection-bg'),
      (_0x5eb238 = _0xdb778a()['createElementNS'](SVG_NS, 'path')),
      (_0x5eb238['id'] = 'v2-edge-interaction-highlight'),
      _0x5eb238['setAttribute']('class', 'connection-main connection-hover-main'),
      _0x57e651['appendChild'](_0x4e6cd2),
      _0x57e651['appendChild'](_0x5eb238),
      _0x365c27['appendChild'](_0x57e651),
      _0x57e651
    );
  }
  function _0x11661a() {
    (_0x57e651?.['remove']?.(), (_0x57e651 = null), (_0x4e6cd2 = null), (_0x5eb238 = null));
  }
  function _0x1edb0f() {
    const _0x2b372a = _0x3176ce || _0x2a2097,
      _0x31f036 = _0x2b372a ? _0x3f7666['get'](_0x2b372a) : null;
    if (!_0x82ee38 || !_0x31f036?.['pooled'] || !_0x31f036['d']) {
      _0x11661a();
      return;
    }
    const _0x57c1b7 = _0x35726a();
    (_0x57c1b7['setAttribute']('data-conn-id', _0x2b372a),
      _0x4e6cd2['setAttribute']('d', _0x31f036['d']),
      _0x5eb238['setAttribute']('d', _0x31f036['d']));
  }
  function _0x382297(_0x903cd8, _0x4814b4, _0x58d808 = 0xa) {
    if (!_0x82ee38) return null;
    const _0x2a1cea = Math['max'](0.01, normalizeNumber(_0xc030e2?.['zoom'], 0x1)),
      _0xe6a268 = screenToWorld(_0x903cd8, _0x4814b4, _0xc030e2);
    return (
      _0x9c9575['hitTest'](
        _0xe6a268['x'],
        _0xe6a268['y'],
        Math['max'](0x1, normalizeNumber(_0x58d808, 0xa)) / _0x2a1cea,
      )?.['edgeId'] || null
    );
  }
  function _0x3ff98f(_0x555405, _0x15bf29) {
    return (
      _0x15bf29?.['containerSize'] ||
      _0x5c973e?.(_0x555405) || { containerW: 0x0, containerH: 0x0, layoutReadMs: 0x0 }
    );
  }
  function _0x3e7538(_0x1af4ed, _0x3e2d4d, _0x30b304) {
    recordRedrawSample(_0x1af4ed, Math['max'](0x0, nowMs() - _0x3e2d4d), _0x30b304);
  }
  function _0x5afde3({
    svgEl: _0x29ae21,
    edgeIds: _0x525d7c,
    edges: _0xb33a32,
    nodes: _0x44bd3a,
    viewport: _0x491976,
    containerEl: _0x3ac94a,
    dragOffsetCtx: dragOffsetCtx = null,
    relatedEdgeIds: relatedEdgeIds = null,
    options: options = {},
  } = {}) {
    _0x344fcd(_0x29ae21);
    const _0x18a8b5 = nowMs(),
      _0x52fe9a = nowMs(),
      _0x3f59df = _0x491976 || { x: 0x0, y: 0x0, zoom: 0x1 },
      _0x4e7a6e = normalizeConnectionLineStyle(options?.['pathStyle']);
    _0xc030e2 = _0x3f59df;
    const _0x2f829c = _0x3ff98f(_0x3ac94a, options),
      _0x47518c = dragOffsetCtx?.['movedNodeIds'] instanceof Set ? dragOffsetCtx['movedNodeIds'] : null;
    let _0x473447 = 0x0,
      _0x27c868 = 0x0,
      _0x154a1d = 0x0,
      _0xd81389 = 0x0,
      _0xe33501 = 0x0,
      _0x7d90d2 = 0x0;
    for (const _0xd937a1 of _0x525d7c || []) {
      const _0x361d1d = _0xb33a32?.[_0xd937a1];
      if (!_0x361d1d) continue;
      const _0x3beecc = buildEdgePathGeometry(_0x361d1d, _0x44bd3a, dragOffsetCtx, _0x4e7a6e);
      if (!isEdgeVisible(_0x3beecc, _0x3f59df, _0x2f829c['containerW'], _0x2f829c['containerH'], ![])) {
        _0x7d90d2 += 0x1;
        if (_0x37e181(_0xd937a1)) _0x154a1d += 0x1;
        continue;
      }
      _0x473447 += 0x1;
      const _0x3cfea1 = _0x19f92a(_0xd937a1);
      if (_0x3cfea1['created']) _0x27c868 += 0x1;
      else _0xd81389 += 0x1;
      const _0x4c87c2 = resolveEdgeVisualOwner({
        poolingEnabled: _0x82ee38,
        edge: _0x361d1d,
        relatedEdgeIds: relatedEdgeIds,
        movedNodeIds: _0x47518c,
        forcedDynamicEdgeIds: _0x2adbdf,
      });
      _0x37ea9e(_0x3cfea1['cache'], _0x361d1d, _0x3beecc, _0x4c87c2, relatedEdgeIds) && (_0xe33501 += 0x1);
    }
    const _0x437566 = nowMs(),
      _0x5967d9 = _0x5dbe3b();
    _0x1edb0f();
    const _0x281ff2 = nowMs(),
      _0x207933 = _0xe33501 > 0x0 || _0x27c868 > 0x0 || _0x154a1d > 0x0 || _0x5967d9 > 0x0;
    return (
      _0x3e7538('partial', _0x18a8b5, {
        reason: options?.['reason'] || 'drag-related-edges',
        edgeCount: _0x525d7c?.['size'] ?? Array['from'](_0x525d7c || [])['length'],
        visibleEdgeCount: _0x473447,
        updatedCount: _0xe33501,
        createdCount: _0x27c868,
        removedCount: _0x154a1d,
        reusedCount: _0xd81389,
        skippedInvisibleCount: _0x7d90d2,
        cacheSize: _0x3f7666['size'],
        layoutReadMs: _0x2f829c['layoutReadMs'] || 0x0,
        pathBuildMs: Math['max'](0x0, _0x437566 - _0x52fe9a),
        domWriteMs: Math['max'](0x0, _0x281ff2 - _0x437566),
        clearedDom: ![],
      }),
      { mutated: _0x207933 }
    );
  }
  function _0x2d2379({
    svgEl: _0x13639d,
    edges: _0x5daff9,
    nodes: _0x110e91,
    viewport: _0x32f96a,
    containerEl: _0x1435ec,
    dragOffsetCtx: dragOffsetCtx = null,
    relatedEdgeIds: relatedEdgeIds = null,
    edgeEntries: edgeEntries = null,
    reason: reason = 'steady',
    options: options = {},
  } = {}) {
    _0x344fcd(_0x13639d);
    const _0x3554c6 = nowMs(),
      _0x5576c6 = nowMs(),
      _0x3a6bc1 = _0x32f96a || { x: 0x0, y: 0x0, zoom: 0x1 },
      _0x3ee5c5 = normalizeConnectionLineStyle(options?.['pathStyle']),
      _0x127f3a =
        !dragOffsetCtx &&
        typeof options?.['geometryRevisionKey'] === 'string' &&
        options['geometryRevisionKey']
          ? _0x3ee5c5 + ':' + options['geometryRevisionKey']
          : '';
    _0xc030e2 = _0x3a6bc1;
    const _0x4a6765 = _0x3ff98f(_0x1435ec, options),
      _0x1bfe3d = Array['isArray'](edgeEntries) ? edgeEntries : Object['values'](_0x5daff9 || {});
    (_0x41cdc0(_0x1bfe3d['length'] >= manyEdgesThreshold), _0x2adbdf['clear']());
    const _0xcffbf3 = shouldRenderAllEdgesAtLowZoom({ edgeCount: _0x1bfe3d['length'], viewport: _0x3a6bc1 });
    let _0xc82607 = _0x1bfe3d,
      _0xfa1ebd = null;
    if (options?.['edgeVisibilityIndex'] && !_0xcffbf3) {
      const _0x273737 = screenViewportToWorldBounds({
          viewport: _0x3a6bc1,
          containerWidth: _0x4a6765['containerW'],
          containerHeight: _0x4a6765['containerH'],
          padding: EDGE_VIEWPORT_PADDING,
        }),
        _0x3a4910 = queryEdgeVisibilityIndex(options['edgeVisibilityIndex'], _0x273737);
      ((_0xfa1ebd = new Set(_0x3a4910)),
        (_0xc82607 = _0x3a4910['map'](
          (_0x1b0612) =>
            options['edgeVisibilityIndex']['edgesById']?.['get']?.(_0x1b0612) || _0x5daff9?.[_0x1b0612],
        )['filter'](Boolean)));
    }
    const _0x1ca6ba = dragOffsetCtx?.['movedNodeIds'] instanceof Set ? dragOffsetCtx['movedNodeIds'] : null;
    let _0x3ad66f = 0x0,
      _0x26708e = 0x0,
      _0x4cb77f = 0x0,
      _0x635160 = 0x0,
      _0x921f89 = 0x0,
      _0x36d98a = 0x0;
    const _0x555270 = _0xfa1ebd;
    if (_0x555270) {
      _0x36d98a += Math['max'](0x0, _0x1bfe3d['length'] - (_0x555270['size'] || _0xc82607['length']));
      for (const _0x30fc8a of Array['from'](_0x3f7666['keys']())) {
        if (_0x5daff9?.[_0x30fc8a] && _0x555270['has'](_0x30fc8a)) continue;
        if (_0x37e181(_0x30fc8a)) _0x4cb77f += 0x1;
      }
    }
    let _0x4991fc = 0x0;
    for (const _0x23ae65 of _0xc82607) {
      const _0x147705 = options?.['edgeVisibilityIndex']?.['edgeOrder']?.['get']?.(_0x23ae65?.['id']),
        _0x5dbad9 = Number['isFinite'](_0x147705) ? _0x147705 : _0x4991fc;
      _0x4991fc += 0x1;
      const _0x69362a = _0x3f7666['get'](_0x23ae65?.['id']),
        _0x20c202 =
          _0x127f3a && _0x69362a?.['geometry'] && _0x69362a['geometryCacheKey'] === _0x127f3a
            ? _0x69362a['geometry']
            : buildEdgePathGeometry(_0x23ae65, _0x110e91, dragOffsetCtx, _0x3ee5c5);
      if (!isEdgeVisible(_0x20c202, _0x3a6bc1, _0x4a6765['containerW'], _0x4a6765['containerH'], _0xcffbf3)) {
        _0x36d98a += 0x1;
        if (_0x37e181(_0x23ae65['id'])) _0x4cb77f += 0x1;
        continue;
      }
      _0x3ad66f += 0x1;
      const _0x32e5d7 = _0x19f92a(_0x23ae65['id']);
      if (_0x32e5d7['created']) _0x26708e += 0x1;
      else _0x635160 += 0x1;
      const _0x37ab26 = resolveEdgeVisualOwner({
        poolingEnabled: _0x82ee38,
        edge: _0x23ae65,
        relatedEdgeIds: relatedEdgeIds,
        movedNodeIds: _0x1ca6ba,
      });
      _0x37ea9e(_0x32e5d7['cache'], _0x23ae65, _0x20c202, _0x37ab26, relatedEdgeIds, _0x5dbad9, _0x127f3a) &&
        (_0x921f89 += 0x1);
    }
    const _0x596e4f = nowMs();
    (_0x5dbe3b(), _0x1edb0f());
    const _0x4480e4 = nowMs();
    return (
      _0x3e7538('full', _0x3554c6, {
        reason: reason,
        edgeCount: _0x1bfe3d['length'],
        visibleEdgeCount: _0x3ad66f,
        updatedCount: _0x921f89,
        createdCount: _0x26708e,
        removedCount: _0x4cb77f,
        reusedCount: _0x635160,
        skippedInvisibleCount: _0x36d98a,
        cacheSize: _0x3f7666['size'],
        layoutReadMs: _0x4a6765['layoutReadMs'] || 0x0,
        pathBuildMs: Math['max'](0x0, _0x596e4f - _0x5576c6),
        domWriteMs: Math['max'](0x0, _0x4480e4 - _0x596e4f),
        clearedDom: options?.['clearedDom'] === !![],
        renderAllLowZoomEdges: _0xcffbf3,
      }),
      { mutated: !![] }
    );
  }
  function _0x15ea90(_0x4a78a8) {
    let _0x3b71b9 = ![];
    for (const _0x5583f6 of _0x4a78a8 || []) {
      const _0x69ce1e = _0x3f7666['get'](_0x5583f6);
      if (!_0x69ce1e) continue;
      _0x2adbdf['add'](_0x5583f6);
      if (!_0x69ce1e['pooled']) continue;
      (_0x9c9575['remove'](_0x5583f6),
        _0x531d74(_0x5583f6, _0x69ce1e['d'], ![]),
        _0x5e75c7(_0x69ce1e),
        (_0x69ce1e['pooled'] = ![]),
        (_0x3b71b9 = !![]));
    }
    return (_0x3b71b9 && (_0x5dbe3b(), _0x1edb0f()), _0x3b71b9);
  }
  function _0x1a44e0({
    svgEl: _0x434b63,
    edges: _0x4b13e2,
    nodes: _0x1bdd24,
    viewport: _0x30dcbe,
    containerEl: _0x569fae,
    relatedEdgeIds: relatedEdgeIds = null,
    options: options = {},
  } = {}) {
    const _0x307117 = new Set(_0x2adbdf);
    if (_0x307117['size'] === 0x0) return { mutated: ![] };
    return (
      _0x2adbdf['clear'](),
      _0x5afde3({
        svgEl: _0x434b63,
        edgeIds: _0x307117,
        edges: _0x4b13e2,
        nodes: _0x1bdd24,
        viewport: _0x30dcbe,
        containerEl: _0x569fae,
        dragOffsetCtx: null,
        relatedEdgeIds: relatedEdgeIds,
        options: options,
      })
    );
  }
  function _0x53ce57(_0x1d30f3, _0x38ce22) {
    const _0xb40130 = String(_0x1d30f3 || '');
    if (_0x38ce22) _0x2a2097 = _0xb40130;
    else {
      if (!_0xb40130 || _0x2a2097 === _0xb40130) _0x2a2097 = '';
    }
    _0x1edb0f();
  }
  function _0x130960(_0x4bea6a, _0x112672) {
    const _0x167708 = String(_0x4bea6a || '');
    if (_0x112672) _0x3176ce = _0x167708;
    else {
      if (!_0x167708 || _0x3176ce === _0x167708) _0x3176ce = '';
    }
    _0x1edb0f();
  }
  function _0x471883(_0x5494af, _0x2bb9a2) {
    _0x344fcd(_0x5494af);
    let _0xcdfb91 = 0x0;
    for (const _0x5e073c of Array['from'](_0x3f7666['keys']())) {
      if (_0x2bb9a2?.[_0x5e073c]) continue;
      if (_0x37e181(_0x5e073c)) _0xcdfb91 += 0x1;
    }
    _0x5dbe3b();
    for (const _0xf61f2f of _0x365c27?.['querySelectorAll']?.('path') || []) {
      if (_0xf61f2f['id'] === 'v2-draft-edge') continue;
      if (!_0xf61f2f['id']?.['startsWith']?.('edge-') && !_0xf61f2f['id']?.['startsWith']?.('hover-edge-'))
        continue;
      const _0x3bc241 = _0xf61f2f['id']['replace']('hover-edge-', '')['replace']('edge-', '');
      if (_0x2bb9a2?.[_0x3bc241]) continue;
      (_0xf61f2f['remove'](), (_0xcdfb91 += 0x1));
    }
    return _0xcdfb91;
  }
  function _0x58ec5a(_0x5a50ca = _0x365c27) {
    if (_0x5a50ca && _0x365c27 && _0x5a50ca !== _0x365c27) return 0x0;
    let _0x1e59a7 = 0x0;
    for (const _0x550e16 of _0x3f7666['values']()) {
      if (_0x550e16['groupEl']?.['isConnected']) _0x1e59a7 += 0x1;
      _0x550e16['groupEl']?.['remove']?.();
    }
    (_0x3f7666['clear'](), _0x2adbdf['clear'](), _0x9c9575['clear']());
    for (const _0x132dd2 of _0x25a029) _0x132dd2['clear']();
    _0x48eb01['clear']();
    if (_0x1b78c7?.['isConnected']) _0x1e59a7 += 0x1;
    _0x2e4afb();
    if (_0x57e651?.['isConnected']) _0x1e59a7 += 0x1;
    return (_0x11661a(), (_0x82ee38 = ![]), (_0x2a2097 = ''), (_0x3176ce = ''), _0x1e59a7);
  }
  function _0x3d6d66() {
    const _0x3730db = _0x58ec5a(_0x365c27);
    return ((_0x365c27 = null), (_0x314191 = 0x0), _0x3730db);
  }
  function _0x30b6de() {
    let _0x4d6d10 = 0x0;
    for (const _0x4652be of _0x25a029) _0x4d6d10 += _0x4652be['size'];
    let _0x1a3ff8 = 0x0,
      _0x7d46c4 = 0x0;
    for (const _0x3c3b4e of _0x3f7666['values']()) {
      if (_0x3c3b4e['pathEl']?.['isConnected']) _0x1a3ff8 += 0x1;
      if (_0x3c3b4e['hoverPath']?.['isConnected']) _0x7d46c4 += 0x1;
    }
    if (_0x4e6cd2?.['isConnected']) _0x7d46c4 += 0x1;
    const _0xcdb4 = _0x9c9575['getStats']();
    return {
      poolingEnabled: _0x82ee38,
      pooledEdgeCount: _0x4d6d10,
      pooledPathCount: _0xe27dc3['filter']((_0x4d0447) => _0x4d0447?.['isConnected'])['length'],
      individualVisualCount: _0x1a3ff8,
      interactionVisualCount: _0x5eb238?.['isConnected'] ? 0x1 : 0x0,
      hitPathCount: _0x7d46c4,
      hitIndexEdgeCount: _0xcdb4['edgeCount'],
      hitIndexCellCount: _0xcdb4['cellCount'],
      dynamicEdgeCount: _0x2adbdf['size'],
      pooledPathWriteCount: _0x314191,
    };
  }
  return {
    cleanupEdges: _0x471883,
    clearRenderedEdges: _0x58ec5a,
    getDomCache: () => _0x3f7666,
    getStats: _0x30b6de,
    hitTestEdgeAtScreenPoint: _0x382297,
    prepareDynamicEdges: _0x15ea90,
    renderFull: _0x2d2379,
    renderPartial: _0x5afde3,
    reset: _0x3d6d66,
    setActiveEdge: _0x130960,
    setHoveredEdge: _0x53ce57,
    settleDynamicEdges: _0x1a44e0,
  };
}
