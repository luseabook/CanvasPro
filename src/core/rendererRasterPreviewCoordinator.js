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
function toIdSet(_0x16d57f) {
  if (_0x16d57f instanceof Set) return new Set(_0x16d57f);
  if (Array['isArray'](_0x16d57f)) return new Set(_0x16d57f);
  return new Set();
}
function defaultSupportsRasterPreview(_0xfc434d) {
  const _0x2fa097 = String(_0xfc434d?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !['web-preview', 'source-audio', 'ai-audio', 'audio']['includes'](_0x2fa097);
}
function getNode(_0x54614e, _0x3da2c7) {
  if (_0x54614e instanceof Map) return _0x54614e['get'](_0x3da2c7) || null;
  return _0x54614e?.[_0x3da2c7] || null;
}
function isVisualMediaNode(_0x271d80) {
  const _0x3ede66 = getRendererNodeLabelKind(_0x271d80?.['type']);
  if (_0x3ede66) return _0x3ede66 === 'image' || _0x3ede66 === 'video';
  const _0x5726d4 = String(_0x271d80?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return (
    _0x5726d4['includes']('image') || _0x5726d4['includes']('video') || _0x5726d4['includes']('media-clip')
  );
}
function resolveRenderScale(_0x478b67, _0x29b768) {
  const _0x57fb10 = Number(_0x478b67?.['zoom']),
    _0x48baef = Number(_0x29b768);
  return (
    (Number['isFinite'](_0x57fb10) && _0x57fb10 > 0x0 ? _0x57fb10 : 0x1) *
    (Number['isFinite'](_0x48baef) && _0x48baef > 0x0 ? _0x48baef : 0x1)
  );
}
function buildRasterVisualStateSignature(_0x3b98a0, _0x4bc4af) {
  return [...toIdSet(_0x3b98a0?.['invalidNodeIds'])]
    ['filter']((_0x5957da) => _0x4bc4af['has'](_0x5957da))
    ['map'](String)
    ['sort']()
    ['join']('\x1f');
}
function buildRasterPresentationIdentity(_0x4469bd, _0x641215 = resolveRendererPreviewNodePresentation) {
  if (!_0x4469bd || typeof _0x4469bd !== 'object') return '';
  const _0x5d6029 = _0x641215(_0x4469bd, { displayFirst: !![] }),
    _0x24310f = _0x5d6029['geometry'] || {};
  return [
    _0x5d6029['kind'],
    _0x5d6029['text'],
    Number['isFinite'](Number(_0x24310f['x'])) ? Number(_0x24310f['x']) : 0x0,
    Number['isFinite'](Number(_0x24310f['y'])) ? Number(_0x24310f['y']) : 0x0,
    Math['max'](0x1, Number(_0x24310f['width']) || 0x1),
    Math['max'](0x1, Number(_0x24310f['height']) || 0x1),
    ..._0x5d6029['sources'],
  ]['join']('\x1f');
}
function buildRasterPresentationIdentityCacheKey(_0x1e55c0) {
  const _0x3ba1d2 = Number(_0x1e55c0?.['_bizRev']);
  if (!Number['isFinite'](_0x3ba1d2)) return null;
  const _0x4d209f = (_0x106c21, _0x238fc7) => {
    const _0x5e8ffb = Number(_0x106c21);
    return Number['isFinite'](_0x5e8ffb) ? _0x5e8ffb : _0x238fc7;
  };
  return [
    _0x3ba1d2,
    _0x4d209f(_0x1e55c0?.['x'], 0x0),
    _0x4d209f(_0x1e55c0?.['y'], 0x0),
    Math['max'](0x1, _0x4d209f(_0x1e55c0?.['width'], 0xa0)),
    Math['max'](0x1, _0x4d209f(_0x1e55c0?.['height'], 0x78)),
  ]['join']('\x1f');
}
function collectExplicitDomRequiredIds({
  selectedNodeIds: _0x5d334d,
  hoveredNodeIds: _0x5170ed,
  hoverNodeId: _0x68a981,
  dragNodeIds: _0x1b05bb,
  connOverlay: _0x418ad8,
  pickConnectMode: _0x3442e7,
  activeMediaNodeIds: _0x200431,
  domRequiredNodeIds: _0x12df3c,
} = {}) {
  const _0x49bc05 = new Set();
  for (const _0x1adee6 of [_0x5d334d, _0x5170ed, _0x1b05bb, _0x200431, _0x12df3c]) {
    for (const _0x17f80a of toIdSet(_0x1adee6)) _0x49bc05['add'](_0x17f80a);
  }
  for (const _0x4eb530 of [
    _0x68a981,
    _0x418ad8?.['srcId'],
    _0x418ad8?.['hoverId'],
    _0x3442e7?.['active'] ? _0x3442e7['sourceNodeId'] : null,
    _0x3442e7?.['active'] ? _0x3442e7['srcId'] : null,
    _0x3442e7?.['active'] ? _0x3442e7['hoverNodeId'] : null,
    _0x3442e7?.['active'] ? _0x3442e7['hoverId'] : null,
  ]) {
    if (_0x4eb530 != null && _0x4eb530 !== '') _0x49bc05['add'](_0x4eb530);
  }
  for (const _0x1a33f2 of [
    _0x418ad8?.['activeNodeIds'],
    _0x3442e7?.['active'] ? _0x3442e7['activeNodeIds'] : null,
  ]) {
    for (const _0x3d8ce5 of toIdSet(_0x1a33f2)) _0x49bc05['add'](_0x3d8ce5);
  }
  return _0x49bc05;
}
export function resolveRendererRasterPreviewSources(_0x1b2bd5) {
  return resolveRendererPreviewNodePresentation(_0x1b2bd5, { displayFirst: ![] })['sources'];
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
  const _0x1e0b39 = () =>
    createLayer({ resolveMediaSources: resolveRendererRasterPreviewSources, onMediaPresented: _0x240859 });
  let _0x90c1dc = layer || _0x1e0b39(),
    _0x3874f6 = new Set(),
    _0x1c7a20 = new Set(),
    _0x263f1d = new Set(),
    _0x1e4294 = new Set(),
    _0x3243ae = new Map();
  const _0x2c340b = new Map();
  let _0x50c10d = '',
    _0x21f7e8 = ![],
    _0x47be10 = ![],
    _0x16cfdf = null,
    _0x177685 = { active: ![] },
    _0x24de3a = null;
  function _0x240859(_0x254047) {
    const _0x5eaba8 = _0x24de3a,
      _0xe02c59 = _0x5eaba8
        ? (_0x254047?.['nodeIds'] || [])['filter'](
            (_0x1c9e4f) =>
              _0x5eaba8['identities']['has'](_0x1c9e4f) &&
              _0x5eaba8['identities']['get'](_0x1c9e4f) ===
                buildRasterPresentationIdentity(getNode(_0x5eaba8['nodes'], _0x1c9e4f), resolvePresentation),
          )
        : [];
    if (_0xe02c59['length']) {
      for (const _0x3bf40c of _0xe02c59) {
        (_0x1e4294['add'](_0x3bf40c), _0x3874f6['add'](_0x3bf40c), _0x1c7a20['delete'](_0x3bf40c));
      }
      onRasterMediaClaimed?.(_0xe02c59);
    }
    onMediaPresented?.(_0x254047);
  }
  function _0xe40e69(_0xcd49bb, _0x3b72cd) {
    const _0x3fbd7e = buildRasterPresentationIdentityCacheKey(_0x3b72cd),
      _0x1dbd9d = _0x2c340b['get'](_0xcd49bb);
    if (_0x3fbd7e !== null && _0x1dbd9d?.['cacheKey'] === _0x3fbd7e) return _0x1dbd9d['identity'];
    const _0x1cb808 = buildRasterPresentationIdentity(_0x3b72cd, resolvePresentation);
    if (_0x3fbd7e === null) _0x2c340b['delete'](_0xcd49bb);
    else _0x2c340b['set'](_0xcd49bb, { cacheKey: _0x3fbd7e, identity: _0x1cb808 });
    return _0x1cb808;
  }
  function _0x14a198({
    canvasEl: _0x2af3a1,
    nodes: _0x1cce44,
    scenePlan: _0x4d68f7,
    selectedNodeIds: _0x583ac0,
    hoveredNodeIds: _0x607e7d,
    hoverNodeId: _0x26dbf4,
    dragNodeIds: _0x2a56b7,
    connOverlay: _0x18709b,
    pickConnectMode: _0x380dfe,
    activeMediaNodeIds: _0x526889,
    domRequiredNodeIds: _0x6fc69,
    viewport: _0x206209,
    containerWidth: _0x45815b,
    containerHeight: _0x1c74f9,
    viewportBusy: viewportBusy = ![],
    mediaLoadingBusy: mediaLoadingBusy = viewportBusy,
    freezeRasterSurface: freezeRasterSurface = ![],
    lockRasterParticipation: lockRasterParticipation = ![],
    deferInitialPlanning: deferInitialPlanning = ![],
    releaseFullSurface: _0x531c91,
    devicePixelRatio: devicePixelRatio = typeof window !== 'undefined' ? window['devicePixelRatio'] : 0x1,
  } = {}) {
    ((_0x24de3a = null), (_0x21f7e8 = mediaLoadingBusy === !![]));
    const _0x4d2d14 =
      _0x16cfdf && _0x206209?.['zoom'] === _0x16cfdf['zoom']
        ? {
            active: !![],
            dx: (_0x16cfdf['x'] - _0x206209['x']) / _0x206209['zoom'],
            dy: (_0x16cfdf['y'] - _0x206209['y']) / _0x206209['zoom'],
          }
        : { active: ![] };
    if (!_0x4d2d14['dx'] && !_0x4d2d14['dy']) _0x4d2d14['active'] = ![];
    if (_0x4d2d14['active'] || !viewportBusy || _0x206209?.['zoom'] !== _0x16cfdf?.['zoom'])
      _0x177685 = _0x4d2d14;
    _0x16cfdf = _0x206209 ? { ..._0x206209 } : null;
    const _0x4f0b16 = toIdSet(_0x4d68f7?.['fullSurfaceIds']),
      _0x5ac25f = toIdSet(_0x4d68f7?.['proxySurfaceIds']),
      _0x4b9e45 = toIdSet(_0x4d68f7?.['fullSurfaceReleaseIds']),
      _0x7664a1 = toIdSet(_0x4d68f7?.['exactVisibleIds']),
      _0x334698 =
        _0x21f7e8 && _0x5ac25f['size'] >= DENSE_RASTER_MEDIA_DEFER_NODE_COUNT && _0x263f1d['size'] === 0x0;
    if (_0x263f1d['size'] === 0x0 && (deferInitialPlanning === !![] || _0x334698)) {
      const _0x3f6fb7 = new Set(),
        _0x4aae52 = new Set([..._0x7664a1]['filter']((_0x3332be) => !_0x4f0b16['has'](_0x3332be))),
        _0x5be6d5 = new Set([..._0x4f0b16, ..._0x4aae52]),
        _0x4e9f64 = new Set([..._0x5be6d5]['filter']((_0x30d656) => _0x7664a1['has'](_0x30d656))),
        _0x2bc1de = new Set(
          [..._0x4b9e45]['filter'](
            (_0x5f1255) => !_0x7664a1['has'](_0x5f1255) || !isVisualMediaNode(getNode(_0x1cce44, _0x5f1255)),
          ),
        );
      if (typeof _0x531c91 === 'function')
        for (const _0x44b2c7 of _0x2bc1de) {
          _0x531c91(_0x44b2c7);
        }
      ((_0x3874f6 = _0x3f6fb7), (_0x1c7a20 = new Set(_0x4e9f64)));
      const _0x4b0399 = 'deferred-initial:' + _0x4f0b16['size'] + ':' + _0x4aae52['size'],
        _0x48e454 = {
          active: ![],
          rasterIds: _0x3f6fb7,
          domProxyIds: _0x4aae52,
          reason: 'deferred-initial-raster-planning',
          signature: _0x4b0399,
          coverageSignature: _0x4b0399,
          stats: {
            scenePressure: Number(_0x4d68f7?.['pressure']) || 0x0,
            proxyPressure: 0x0,
            activationSignal: 0x0,
            activationFloor: 0x0,
            rasterShare: 0x0,
            proxyCount: _0x5ac25f['size'],
            rasterCandidateCount: 0x0,
            rasterCount: 0x0,
            domProxyCount: _0x4aae52['size'],
            interactiveDomCount: 0x0,
            unsupportedDomCount: 0x0,
            projectedDomCount: 0x0,
            exactVisibleCount: _0x7664a1['size'],
            exactVisibleCoveredCount: _0x7664a1['size'],
            exactVisibleMissingCount: 0x0,
          },
        };
      return {
        active: ![],
        rasterIds: _0x3f6fb7,
        domProxyIds: _0x4aae52,
        domPreviewCandidateIds: _0x5be6d5,
        domPreviewMediaSourceOwnerIds: _0x4e9f64,
        releasableFullSurfaceIds: _0x2bc1de,
        policy: _0x48e454,
        layerStats: { active: ![], supported: !![], deferred: !![], drawnNodeIds: [], drawnMediaNodeIds: [] },
        freezeActive: ![],
        signature: _0x4b0399,
      };
    }
    const _0x1bbe7d = new Set(
        [..._0x5ac25f]['filter']((_0x3fac0d) => {
          const _0x2b6e4e = getNode(_0x1cce44, _0x3fac0d);
          if (!isRasterSupportedNode(_0x2b6e4e, _0x3fac0d)) return ![];
          return !(_0x334698 && _0x7664a1['has'](_0x3fac0d) && isVisualMediaNode(_0x2b6e4e));
        }),
      ),
      _0x382967 = planRendererRasterProxies({
        nodes: _0x1cce44,
        fullSurfaceIds: _0x4f0b16,
        proxySurfaceIds: _0x5ac25f,
        exactVisibleIds: _0x4d68f7?.['exactVisibleIds'],
        rasterSupportedNodeIds: _0x1bbe7d,
        previousRasterIds: _0x3874f6,
        selectedNodeIds: _0x583ac0,
        hoveredNodeIds: _0x607e7d,
        hoverNodeId: _0x26dbf4,
        dragNodeIds: _0x2a56b7,
        connOverlay: _0x18709b,
        pickConnectMode: _0x380dfe,
        activeMediaNodeIds: _0x526889,
        domRequiredNodeIds: _0x6fc69,
        viewport: _0x206209,
        scenePressure: _0x4d68f7?.['pressure'],
      }),
      _0x10b6fd = collectExplicitDomRequiredIds({
        selectedNodeIds: _0x583ac0,
        hoveredNodeIds: _0x607e7d,
        hoverNodeId: _0x26dbf4,
        dragNodeIds: _0x2a56b7,
        connOverlay: _0x18709b,
        pickConnectMode: _0x380dfe,
        activeMediaNodeIds: _0x526889,
        domRequiredNodeIds: _0x6fc69,
      }),
      _0x15b5d8 = new Set(),
      _0x43ab21 = new Set();
    if (typeof _0x90c1dc['captureNodeFrame'] === 'function' && typeof onRasterHandoffFrame === 'function')
      for (const _0x152ea1 of _0x1e4294) {
        if (!_0x10b6fd['has'](_0x152ea1) || !_0x7664a1['has'](_0x152ea1)) continue;
        const _0x493049 = getNode(_0x1cce44, _0x152ea1);
        if (!_0x493049 || _0x3243ae['get'](_0x152ea1) !== _0xe40e69(_0x152ea1, _0x493049)) continue;
        let _0x2f9fa2 = ![];
        try {
          _0x2f9fa2 = isDomMediaPresented?.(_0x152ea1, _0x493049) === !![];
        } catch {}
        if (_0x2f9fa2) continue;
        _0x15b5d8['add'](_0x152ea1);
        const _0x509244 = _0x90c1dc['captureNodeFrame'](_0x152ea1);
        if (!_0x509244) continue;
        try {
          (onRasterHandoffFrame(_0x152ea1, _0x509244), _0x43ab21['add'](_0x152ea1));
        } catch {}
      }
    const _0x18eb0e = new Set(
        [..._0x1e4294]['filter']((_0x230f23) => {
          const _0x3694f5 = _0x10b6fd['has'](_0x230f23);
          if (
            typeof isDomMediaPresented !== 'function' ||
            _0x382967['rasterIds']['has'](_0x230f23) ||
            !_0x7664a1['has'](_0x230f23) ||
            (_0x3694f5 && !_0x15b5d8['has'](_0x230f23)) ||
            _0x43ab21['has'](_0x230f23)
          )
            return ![];
          const _0x49d7d7 = getNode(_0x1cce44, _0x230f23);
          if (!_0x49d7d7 || !isVisualMediaNode(_0x49d7d7)) return ![];
          if (_0x3243ae['get'](_0x230f23) !== _0xe40e69(_0x230f23, _0x49d7d7)) return ![];
          try {
            return isDomMediaPresented?.(_0x230f23, _0x49d7d7) !== !![];
          } catch {
            return !![];
          }
        }),
      ),
      _0x24d0be = lockRasterParticipation === !![] && freezeRasterSurface === !![] && viewportBusy === !![],
      _0x305e3b = _0x24d0be && _0x263f1d['size'] === 0x0 ? new Set() : _0x382967['rasterIds'],
      _0x466ffb = new Set([..._0x305e3b, ..._0x18eb0e]),
      _0x3de1aa = [..._0x305e3b]['filter']((_0x304885) => _0x7664a1['has'](_0x304885)),
      _0xd03955 = [..._0x263f1d]['some']((_0x57a634) => !_0x466ffb['has'](_0x57a634)),
      _0x4ed407 = buildRasterVisualStateSignature(_0x18709b, _0x382967['rasterIds']),
      _0x323769 = _0x4ed407 !== _0x50c10d,
      _0x385f0f = [..._0x263f1d]['some']((_0x31b7b7) => {
        const _0x407496 = getNode(_0x1cce44, _0x31b7b7);
        return !_0x407496 || _0x3243ae['get'](_0x31b7b7) !== _0xe40e69(_0x31b7b7, _0x407496);
      }),
      _0xa06ff0 = [..._0x263f1d]['some']((_0x1dbae2) => _0x10b6fd['has'](_0x1dbae2)),
      _0x2cfc44 =
        freezeRasterSurface === !![] &&
        viewportBusy &&
        _0x263f1d['size'] > 0x0 &&
        (_0x305e3b['size'] > 0x0 || _0x24d0be) &&
        !_0x323769 &&
        !_0x385f0f &&
        !_0xa06ff0,
      _0x4faae5 = _0x323769 || _0x385f0f || _0xa06ff0 || (!_0x2cfc44 && _0xd03955),
      _0x3d51de = _0x2cfc44 ? _0x263f1d : _0x466ffb;
    _0x24de3a = {
      nodes: _0x1cce44,
      identities: new Map(
        [..._0x3d51de]
          ['filter']((_0x4afc0d) => !_0x10b6fd['has'](_0x4afc0d) && _0x305e3b['has'](_0x4afc0d))
          ['map']((_0x2aaacf) => [_0x2aaacf, _0xe40e69(_0x2aaacf, getNode(_0x1cce44, _0x2aaacf))]),
      ),
    };
    const _0x450834 = _0x90c1dc['sync'](_0x2af3a1, _0x1cce44, _0x3d51de, {
        forceRender: _0x4faae5,
        reuseWhileBusy:
          _0x2cfc44 ||
          (viewportBusy && !_0x4faae5 && _0x3de1aa['every']((_0x504c4e) => _0x3874f6['has'](_0x504c4e))),
        renderScale: resolveRenderScale(_0x206209, devicePixelRatio),
        mediaLoadNodeIds: _0x7664a1,
        viewport: _0x206209,
        viewportBusy: viewportBusy,
        mediaLoadingBusy: _0x21f7e8 || _0x47be10,
        invalidNodeIds: _0x18709b?.['invalidNodeIds'],
        sourceNodeId: _0x18709b?.['srcId'],
        hoverNodeId: _0x18709b?.['hoverId'] || (_0x380dfe?.['active'] ? _0x380dfe['hoverNodeId'] : null),
      }),
      _0x2e7b21 =
        _0x450834?.['supported'] === !![] && _0x450834?.['active'] === !![]
          ? toIdSet(_0x450834['drawnNodeIds'])
          : new Set(),
      _0x2a092e =
        _0x450834?.['supported'] === !![] && _0x450834?.['active'] === !![]
          ? toIdSet(_0x450834['drawnMediaNodeIds'])
          : new Set();
    ((_0x263f1d = _0x2e7b21),
      (_0x1e4294 = _0x2a092e),
      (_0x3243ae = new Map(
        [..._0x2e7b21]['map']((_0x33919d) => [
          _0x33919d,
          _0xe40e69(_0x33919d, getNode(_0x1cce44, _0x33919d)),
        ]),
      )));
    for (const _0x143804 of _0x2c340b['keys']()) {
      !_0x2e7b21['has'](_0x143804) && _0x2c340b['delete'](_0x143804);
    }
    _0x50c10d = _0x4ed407;
    const _0x444911 = new Set(
        [...(_0x2cfc44 ? _0x2e7b21 : _0x305e3b)]['filter'](
          (_0x558101) =>
            _0x2e7b21['has'](_0x558101) &&
            (!isVisualMediaNode(getNode(_0x1cce44, _0x558101)) ||
              _0x2a092e['has'](_0x558101) ||
              (_0x2cfc44 &&
                _0x206209?.['zoom'] <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
                !isRendererFastPreviewMediaReadable(getNode(_0x1cce44, _0x558101), { viewport: _0x206209 }) &&
                !_0x1c7a20['has'](_0x558101))) &&
            getNode(_0x1cce44, _0x558101) &&
            !_0x10b6fd['has'](_0x558101),
        ),
      ),
      _0x3331e1 = new Set(_0x382967['domProxyIds']),
      _0x38d318 = viewportBusy
        ? selectRendererMotionAheadMediaIds(
            [..._0x382967['rasterIds']]
              ['filter'](
                (_0x537c9d) =>
                  !_0x444911['has'](_0x537c9d) && isVisualMediaNode(getNode(_0x1cce44, _0x537c9d)),
              )
              ['map']((_0x906fea) => ({ nodeId: _0x906fea, geometry: getNode(_0x1cce44, _0x906fea) })),
            {
              viewport: _0x206209,
              previewMotion: _0x177685,
              containerWidth: _0x45815b,
              containerHeight: _0x1c74f9,
            },
          )
        : new Set();
    for (const _0x514206 of _0x382967['rasterIds']) {
      !_0x444911['has'](_0x514206) &&
        (_0x450834?.['active'] !== !![] || _0x7664a1['has'](_0x514206) || _0x38d318['has'](_0x514206)) &&
        _0x3331e1['add'](_0x514206);
    }
    _0x3874f6 = _0x444911;
    const _0x5569e1 = new Set([..._0x4f0b16, ..._0x3331e1]);
    for (const _0x4bfeb0 of _0x444911) {
      (_0x5569e1['delete'](_0x4bfeb0), _0x3331e1['delete'](_0x4bfeb0));
    }
    const _0x123ddd = new Set(
        _0x2cfc44 ? [..._0x382967['rasterIds']]['filter']((_0x2338d4) => !_0x444911['has'](_0x2338d4)) : [],
      ),
      _0x4ec7fb = new Set(
        [..._0x5569e1]['filter'](
          (_0x353c93) =>
            (_0x7664a1['has'](_0x353c93) && !_0x123ddd['has'](_0x353c93)) || _0x38d318['has'](_0x353c93),
        ),
      );
    if (_0x2cfc44)
      for (const _0x353806 of _0x1c7a20) {
        _0x5569e1['has'](_0x353806) &&
          _0x7664a1['has'](_0x353806) &&
          !_0x2a092e['has'](_0x353806) &&
          _0x4ec7fb['add'](_0x353806);
      }
    if (_0x24d0be)
      for (const _0x44ba07 of _0x1c7a20) {
        if (_0x2a092e['has'](_0x44ba07) || !getNode(_0x1cce44, _0x44ba07)) continue;
        (_0x5569e1['add'](_0x44ba07), _0x3331e1['add'](_0x44ba07), _0x4ec7fb['add'](_0x44ba07));
      }
    _0x1c7a20 = new Set(_0x4ec7fb);
    const _0x1cac82 = new Set(
      [..._0x4b9e45]['filter'](
        (_0x681e82) =>
          !_0x7664a1['has'](_0x681e82) ||
          !isVisualMediaNode(getNode(_0x1cce44, _0x681e82)) ||
          _0x444911['has'](_0x681e82),
      ),
    );
    if (typeof _0x531c91 === 'function')
      for (const _0x4303a7 of _0x1cac82) {
        _0x531c91(_0x4303a7);
      }
    return {
      active: _0x444911['size'] > 0x0,
      rasterIds: _0x444911,
      domProxyIds: _0x3331e1,
      domPreviewCandidateIds: _0x5569e1,
      domPreviewMediaSourceOwnerIds: _0x4ec7fb,
      releasableFullSurfaceIds: _0x1cac82,
      policy: _0x382967,
      layerStats: _0x450834,
      freezeActive: _0x2cfc44,
      signature:
        _0x382967['signature'] +
        '|claimed:' +
        [..._0x444911]['join']('\x1f') +
        '|handoff:' +
        [..._0x18eb0e]['join']('\x1f'),
    };
  }
  function _0x154adf() {
    ((_0x24de3a = null),
      (_0x3874f6 = new Set()),
      (_0x1c7a20 = new Set()),
      (_0x263f1d = new Set()),
      (_0x1e4294 = new Set()),
      (_0x3243ae = new Map()),
      _0x2c340b['clear'](),
      (_0x50c10d = ''),
      (_0x21f7e8 = ![]),
      (_0x47be10 = ![]),
      (_0x16cfdf = null),
      (_0x177685 = { active: ![] }),
      _0x90c1dc['destroy']?.());
    if (!layer) _0x90c1dc = _0x1e0b39();
  }
  function _0x5df7b3(_0x184d83) {
    return (
      (_0x47be10 = _0x184d83 === !![]),
      _0x90c1dc['setMediaLoadingBusy']?.(_0x21f7e8 || _0x47be10) || null
    );
  }
  function _0x26a56c(_0xbfffc6) {
    const _0x21f0c2 = String(_0xbfffc6 || '')['trim']();
    if (!_0x21f0c2) return ![];
    const _0x5c9f68 =
      _0x263f1d['has'](_0x21f0c2) || _0x1e4294['has'](_0x21f0c2) || _0x3874f6['has'](_0x21f0c2);
    if (typeof _0x90c1dc['excludeNode'] !== 'function') return ![];
    const _0x2d3e50 = _0x90c1dc['excludeNode'](_0x21f0c2) === !![];
    if (!_0x2d3e50 && !_0x5c9f68) return ![];
    return (
      _0x263f1d['delete'](_0x21f0c2),
      _0x1e4294['delete'](_0x21f0c2),
      _0x3243ae['delete'](_0x21f0c2),
      _0x2c340b['delete'](_0x21f0c2),
      _0x3874f6['delete'](_0x21f0c2),
      !![]
    );
  }
  function _0x3d4e39(_0x4075cf) {
    const _0x619ec6 = String(_0x4075cf || '')['trim']();
    if (!_0x619ec6 || !_0x263f1d['has'](_0x619ec6)) return null;
    return _0x90c1dc['captureNodeFrame']?.(_0x619ec6) || null;
  }
  return {
    sync: _0x14a198,
    reset: _0x154adf,
    captureNodeFrame: _0x3d4e39,
    excludeNode: _0x26a56c,
    setMediaLoadingBusy: _0x5df7b3,
    getStats: () => _0x90c1dc['getStats']?.() || null,
  };
}
