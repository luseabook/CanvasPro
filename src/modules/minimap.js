import { calcWorldBounds } from '../core/math.js';
import { recordMinimapUpdateSample } from './perf/perfProbe.js';
import { isNodeType } from './registry.js';
const PAN_PREVIEW_MIN_INTERVAL_MS = 96,
  PAN_NODE_UPDATE_DELAY_MS = 180;
export function initMinimap(_0xd3bc54, _0x39c75d) {
  const _0x22b21c = document.getElementById('minimapViewport'),
    _0x12b139 = document.getElementById('minimapWrapper');
  if (!_0xd3bc54 || !_0x22b21c || !_0x12b139) return;
  const _0x24515d = new Map();
  let _0x8f0841 = null,
    _0x48b73b = 1,
    _0x2507fe = 0,
    _0x51b616 = 0,
    _0x5ddff2 = 0,
    _0x4a9bb3 = 0,
    _0x4325b6 = -1,
    _0x897e42 = false,
    _0x2ff2f5 = 0,
    _0x1e93cc = 0,
    _0x2feec7 = 1,
    _0x17d401 = '',
    _0x37400a = null,
    _0x32a6a0 = null,
    _0x2fd5cb = null,
    _0x52f049 = null,
    _0x190d77 = null,
    _0x11b7f8 = null,
    _0x3c4d31 = 0,
    _0x277f12 = 0,
    _0x1f720a = false;
  function _0x19a50b() {
    return typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
  function _0x231959(_0x1f21a7) {
    const _0x878f8a = Number(_0x1f21a7?._nodeCount);
    if (Number.isFinite(_0x878f8a)) return _0x878f8a;
    return Object.keys(_0x1f21a7?.nodes || {}).length;
  }
  function _0x57045d() {
    return !!document?.body?.classList?.contains?.('is-panning');
  }
  function _0x16dfcb(_0x4fcbd7) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x4fcbd7);
    return setTimeout(_0x4fcbd7, 16);
  }
  function _0x1cf8c2(_0x52c4f1) {
    if (!_0x52c4f1) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(_0x52c4f1);
      return;
    }
    clearTimeout(_0x52c4f1);
  }
  function _0x11d5b4() {
    return { mapW: _0xd3bc54.clientWidth || 200, mapH: _0xd3bc54.clientHeight || 140 };
  }
  function _0x2d78a5(_0xa93e7b) {
    if (_0xa93e7b && _0xa93e7b.width !== 0) return _0xa93e7b;
    return { minX: -0x3e8, minY: -0x3e8, maxX: 0x3e8, maxY: 0x3e8, width: 0x7d0, height: 0x7d0 };
  }
  function _0x234dbc(_0x2df14c) {
    const _0x4b9b69 = Number(_0x2df14c?._nodeCount);
    if (Number.isFinite(_0x4b9b69)) return _0x4b9b69 <= 0;
    return !_0x2df14c?.nodes || Object.keys(_0x2df14c.nodes).length === 0;
  }
  function _0x147173(_0x5240db) {
    return {
      x: Number.isFinite(Number(_0x5240db?.x)) ? Number(_0x5240db.x) : 0,
      y: Number.isFinite(Number(_0x5240db?.y)) ? Number(_0x5240db.y) : 0,
      zoom: Number.isFinite(Number(_0x5240db?.zoom)) ? Number(_0x5240db.zoom) : 1,
    };
  }
  function _0x3cef5e(_0x48fd3b) {
    const _0x465c74 = Number(_0x48fd3b);
    return Number.isFinite(_0x465c74) ? Math.round(_0x465c74 * 100) / 100 : 0;
  }
  function _0x4dda82(_0xbdc7fb = {}) {
    let _0x2ef3bb = '';
    for (const _0x475759 of Object.values(_0xbdc7fb || {})) {
      if (!_0x475759 || isNodeType(_0x475759, 'group')) continue;
      ((_0x2ef3bb += [
        _0x475759.id || '',
        _0x475759.type || '',
        _0x3cef5e(_0x475759.x),
        _0x3cef5e(_0x475759.y),
        _0x3cef5e(_0x475759.width || 200),
        _0x3cef5e(_0x475759.height || 100),
      ].join(':')),
        (_0x2ef3bb += '|'));
    }
    return _0x2ef3bb;
  }
  function _0x3acf4d(_0x3b0287, _0x4d7a8d, _0x206064 = {}) {
    const _0x48bc20 = _0x2d78a5(_0x3b0287),
      { mapW: _0x5482cb, mapH: _0x169d00 } = _0x11d5b4(),
      _0x508e88 = Math.max(_0x48bc20.width, 0x3e8),
      _0x2bdc4a = Math.max(_0x48bc20.height, 0x3e8),
      _0x51d05e = Math.min(_0x5482cb / _0x508e88, _0x169d00 / _0x2bdc4a),
      _0x4c82a0 = (_0x5482cb - _0x508e88 * _0x51d05e) / 2,
      _0x3c4de9 = (_0x169d00 - _0x2bdc4a * _0x51d05e) / 2;
    ((_0x8f0841 = _0x48bc20),
      (_0x48b73b = _0x51d05e),
      (_0x2507fe = _0x4c82a0),
      (_0x51b616 = _0x3c4de9),
      (_0x5ddff2 = _0x5482cb),
      (_0x4a9bb3 = _0x169d00),
      (_0x4325b6 = Number.isFinite(_0x4d7a8d) ? _0x4d7a8d : -1),
      (_0x897e42 = _0x206064.trackViewport === true));
    const _0x53ff7c = _0x147173(_0x206064.viewport);
    return (
      (_0x2ff2f5 = _0x53ff7c.x),
      (_0x1e93cc = _0x53ff7c.y),
      (_0x2feec7 = _0x53ff7c.zoom),
      (window._v2MinimapScale = _0x51d05e),
      {
        bounds: _0x48bc20,
        scale: _0x51d05e,
        offsetX: _0x4c82a0,
        offsetY: _0x3c4de9,
        mapW: _0x5482cb,
        mapH: _0x169d00,
      }
    );
  }
  function _0x25cd81(_0x5b2506) {
    const _0x44a2a6 = _0x234dbc(_0x5b2506),
      _0xc9ab05 = calcWorldBounds(_0x5b2506?.nodes || {}, _0x5b2506?.viewport);
    return _0x3acf4d(_0xc9ab05, _0x5b2506?._persistRev, {
      trackViewport: _0x44a2a6,
      viewport: _0x44a2a6 ? _0x5b2506?.viewport : null,
    });
  }
  function _0x2cd81a(_0x222f77, { allowCached: allowCached = true } = {}) {
    const _0x4c7401 = Number.isFinite(_0x222f77?._persistRev) ? _0x222f77._persistRev : -1,
      _0x64d15c = _0x234dbc(_0x222f77),
      _0x59d1aa = _0x147173(_0x222f77?.viewport),
      { mapW: _0x781ffc, mapH: _0x5dbc06 } = _0x11d5b4(),
      _0x4593fc = !!_0x8f0841,
      _0x200e36 = _0x4593fc && _0x4325b6 === _0x4c7401,
      _0x392b79 = _0x4593fc && _0x5ddff2 === _0x781ffc && _0x4a9bb3 === _0x5dbc06,
      _0x28e5b8 =
        _0x4593fc &&
        _0x897e42 === true &&
        _0x64d15c === true &&
        _0x2ff2f5 === _0x59d1aa.x &&
        _0x1e93cc === _0x59d1aa.y &&
        _0x2feec7 === _0x59d1aa.zoom;
    if (allowCached && _0x200e36 && ((!_0x64d15c && !_0x897e42) || _0x28e5b8)) {
      if (_0x392b79)
        return (
          (window._v2MinimapScale = _0x48b73b),
          {
            bounds: _0x8f0841,
            scale: _0x48b73b,
            offsetX: _0x2507fe,
            offsetY: _0x51b616,
            mapW: _0x781ffc,
            mapH: _0x5dbc06,
          }
        );
      return _0x3acf4d(_0x8f0841, _0x4c7401, {
        trackViewport: _0x64d15c,
        viewport: _0x64d15c ? _0x59d1aa : null,
      });
    }
    return _0x25cd81(_0x222f77);
  }
  function _0x273d44(_0x5570e8) {
    const _0x17740a = Number.isFinite(_0x5570e8?._persistRev) ? _0x5570e8._persistRev : -1,
      _0xeec31c = _0x234dbc(_0x5570e8);
    if (_0x8f0841 && _0x4325b6 === _0x17740a && !_0xeec31c && !_0x897e42)
      return (
        (window._v2MinimapScale = _0x48b73b),
        {
          bounds: _0x8f0841,
          scale: _0x48b73b,
          offsetX: _0x2507fe,
          offsetY: _0x51b616,
          mapW: _0x5ddff2,
          mapH: _0x4a9bb3,
        }
      );
    return _0x2cd81a(_0x5570e8, { allowCached: true });
  }
  function _0x1bae22() {
    _0x2fd5cb = null;
    if (_0x57045d()) {
      _0x2fd5cb = setTimeout(_0x1bae22, PAN_NODE_UPDATE_DELAY_MS);
      return;
    }
    !_0x37400a && (_0x37400a = _0x16dfcb(_0x2b752c));
  }
  function _0x4a42b3(_0x110607) {
    if (!_0x32a6a0) _0x32a6a0 = _0x110607;
    else {
      if (_0x32a6a0 === 'both' || _0x110607 === 'both') _0x32a6a0 = 'both';
      else _0x32a6a0 !== _0x110607 ? (_0x32a6a0 = 'both') : (_0x32a6a0 = _0x110607);
    }
    if (_0x57045d() && (_0x32a6a0 === 'nodes' || _0x32a6a0 === 'both')) {
      !_0x2fd5cb && (_0x2fd5cb = setTimeout(_0x1bae22, PAN_NODE_UPDATE_DELAY_MS));
      return;
    }
    !_0x37400a && (_0x37400a = _0x16dfcb(_0x2b752c));
  }
  function _0x2b752c() {
    _0x37400a = null;
    const _0xd93dec = _0x32a6a0;
    _0x32a6a0 = null;
    if (!_0xd93dec) return;
    const _0x2933ef = _0x39c75d.getStateRaw();
    _0xd93dec === 'nodes' || _0xd93dec === 'both' ? _0x3912fc(_0x2933ef) : _0x586fda(_0x2933ef);
  }
  function _0x3912fc(_0x4c443c) {
    const _0x11c677 = _0x19a50b(),
      _0x26b694 = _0x4c443c?.nodes || {},
      _0x24bdc0 = _0x4c443c?.viewport || { x: 0, y: 0, zoom: 1 },
      _0x49cfc5 = _0x4dda82(_0x26b694),
      _0x364fc4 = Number.isFinite(_0x4c443c?._persistRev) ? _0x4c443c._persistRev : -1;
    if (_0x8f0841 && _0x17d401 === _0x49cfc5 && !_0x234dbc(_0x4c443c)) {
      ((_0x4325b6 = _0x364fc4),
        _0x3c4481(_0x24bdc0, _0x8f0841, _0x48b73b, _0x2507fe, _0x51b616),
        recordMinimapUpdateSample('viewport', _0x19a50b() - _0x11c677, {
          nodeCount: _0x231959(_0x4c443c),
          dotCount: _0x24515d.size,
          viewportOnly: true,
        }));
      return;
    }
    const {
        bounds: _0x4d39b6,
        scale: _0x12934f,
        offsetX: _0xf1d4a5,
        offsetY: _0x41ab2c,
      } = _0x25cd81(_0x4c443c),
      _0x37ae95 = new Set();
    let _0x13f8f8 = 0,
      _0x2bcb31 = 0,
      _0x323d63 = 0;
    ((window._v2MinimapDotMap = _0x24515d),
      Object.values(_0x26b694).forEach((_0x293e3b) => {
        if (isNodeType(_0x293e3b, 'group')) return;
        _0x37ae95.add(_0x293e3b.id);
        let _0x2adf94 = _0x24515d.get(_0x293e3b.id);
        const _0xb9187d = _0xf1d4a5 + (_0x293e3b.x - _0x4d39b6.minX) * _0x12934f,
          _0x424ae7 = _0x41ab2c + (_0x293e3b.y - _0x4d39b6.minY) * _0x12934f,
          _0x53ac68 = Math.max((_0x293e3b.width || 200) * _0x12934f, 2),
          _0x32b68b = Math.max((_0x293e3b.height || 100) * _0x12934f, 2);
        !_0x2adf94
          ? ((_0x2adf94 = document.createElement('div')),
            (_0x2adf94.id = 'minimap-node-' + _0x293e3b.id),
            _0x24515d.set(_0x293e3b.id, _0x2adf94),
            _0xd3bc54.appendChild(_0x2adf94),
            (_0x13f8f8 += 1))
          : (_0x2bcb31 += 1);
        let _0x3b56f0 = 'default';
        const _0x1bf2dd = _0x293e3b.type || '';
        if (_0x1bf2dd.includes('text')) _0x3b56f0 = 'text';
        else {
          if (_0x1bf2dd.includes('image')) _0x3b56f0 = 'image';
          else {
            if (_0x1bf2dd.includes('video')) _0x3b56f0 = 'video';
            else {
              if (_0x1bf2dd.includes('audio')) _0x3b56f0 = 'audio';
            }
          }
        }
        _0x2adf94.className !== 'minimap-node ' + _0x3b56f0 &&
          (_0x2adf94.className = 'minimap-node ' + _0x3b56f0);
        if (_0x2adf94.style.left !== _0xb9187d + 'px') _0x2adf94.style.left = _0xb9187d + 'px';
        if (_0x2adf94.style.top !== _0x424ae7 + 'px') _0x2adf94.style.top = _0x424ae7 + 'px';
        if (_0x2adf94.style.width !== _0x53ac68 + 'px') _0x2adf94.style.width = _0x53ac68 + 'px';
        if (_0x2adf94.style.height !== _0x32b68b + 'px') _0x2adf94.style.height = _0x32b68b + 'px';
      }),
      _0x24515d.forEach((_0x13affd, _0x4ec1c5) => {
        !_0x37ae95.has(_0x4ec1c5) && (_0x13affd.remove(), _0x24515d.delete(_0x4ec1c5), (_0x323d63 += 1));
      }),
      _0x3c4481(_0x24bdc0, _0x4d39b6, _0x12934f, _0xf1d4a5, _0x41ab2c),
      recordMinimapUpdateSample('nodes', _0x19a50b() - _0x11c677, {
        nodeCount: _0x231959(_0x4c443c),
        dotCount: _0x24515d.size,
        createdCount: _0x13f8f8,
        updatedCount: _0x2bcb31,
        removedCount: _0x323d63,
        viewportOnly: false,
      }),
      (_0x17d401 = _0x49cfc5));
  }
  function _0x586fda(_0x504d98) {
    const _0x48d5c8 = _0x19a50b(),
      _0x5900f3 = _0x504d98?.viewport || { x: 0, y: 0, zoom: 1 };
    if (!_0x8f0841) {
      _0x3912fc(_0x39c75d.getStateRaw());
      return;
    }
    const _0x55bbb4 = Number.isFinite(_0x504d98?._persistRev) ? _0x504d98._persistRev : -1;
    if (_0x4325b6 !== _0x55bbb4) {
      _0x3912fc(_0x39c75d.getStateRaw());
      return;
    }
    const {
      bounds: _0x2855da,
      scale: _0x311527,
      offsetX: _0x1427e2,
      offsetY: _0x2acd22,
    } = _0x273d44(_0x504d98);
    (_0x3c4481(_0x5900f3, _0x2855da, _0x311527, _0x1427e2, _0x2acd22),
      recordMinimapUpdateSample('viewport', _0x19a50b() - _0x48d5c8, {
        nodeCount: _0x231959(_0x504d98),
        dotCount: _0x24515d.size,
        viewportOnly: true,
      }));
  }
  function _0x3c4481(_0x55896, _0x40abac, _0x3330c9, _0x3dd0bd, _0x47a19d) {
    const _0x3998e0 = window.innerWidth / _0x55896.zoom,
      _0x2008a0 = window.innerHeight / _0x55896.zoom,
      _0x5e7a88 = -_0x55896.x / _0x55896.zoom,
      _0x93f8fd = -_0x55896.y / _0x55896.zoom,
      _0x3ffa47 = _0x3dd0bd + (_0x5e7a88 - _0x40abac.minX) * _0x3330c9,
      _0x482b22 = _0x47a19d + (_0x93f8fd - _0x40abac.minY) * _0x3330c9,
      _0x211548 = _0x3998e0 * _0x3330c9,
      _0x302427 = _0x2008a0 * _0x3330c9;
    (_0x22b21c.style.left !== _0x3ffa47 + 'px' && (_0x22b21c.style.left = _0x3ffa47 + 'px'),
      _0x22b21c.style.top !== _0x482b22 + 'px' && (_0x22b21c.style.top = _0x482b22 + 'px'),
      _0x22b21c.style.width !== _0x211548 + 'px' && (_0x22b21c.style.width = _0x211548 + 'px'),
      _0x22b21c.style.height !== _0x302427 + 'px' && (_0x22b21c.style.height = _0x302427 + 'px'));
  }
  function _0x4a5104() {
    if (_0x52f049) return;
    _0x52f049 = _0x16dfcb(_0x126248);
  }
  function _0x126248() {
    _0x52f049 = null;
    if (!_0x11b7f8) return;
    const _0x326b32 = _0x11b7f8;
    _0x11b7f8 = null;
    const _0x2e8afc = _0x39c75d.getStateRaw(),
      _0x2efc6c = { ..._0x2e8afc, viewport: _0x326b32 },
      _0x4ae6c9 = _0x19a50b(),
      {
        bounds: _0x579910,
        scale: _0x2ef428,
        offsetX: _0x191f42,
        offsetY: _0x169588,
      } = _0x2cd81a(_0x2efc6c, { allowCached: true });
    (_0x3c4481(_0x326b32, _0x579910, _0x2ef428, _0x191f42, _0x169588),
      (_0x3c4d31 = _0x19a50b()),
      (_0x277f12 += 1),
      recordMinimapUpdateSample('pan-preview', _0x3c4d31 - _0x4ae6c9, {
        nodeCount: _0x231959(_0x2e8afc),
        dotCount: _0x24515d.size,
        viewportOnly: true,
        delayed: _0x1f720a,
      }),
      (_0x1f720a = false));
  }
  function _0x3a64af(_0x361f81, _0x1e884e = {}) {
    _0x11b7f8 = _0x147173(_0x361f81);
    const _0x33517b = _0x1e884e.force === true,
      _0xd56b2c = _0x19a50b() - _0x3c4d31,
      _0x138d81 = _0x33517b ? 0 : Math.max(0, PAN_PREVIEW_MIN_INTERVAL_MS - _0xd56b2c);
    if (_0x138d81 <= 0) {
      _0x190d77 && (clearTimeout(_0x190d77), (_0x190d77 = null));
      ((_0x1f720a = false), _0x4a5104());
      return;
    }
    !_0x190d77 &&
      ((_0x1f720a = true),
      (_0x190d77 = setTimeout(() => {
        ((_0x190d77 = null), _0x4a5104());
      }, _0x138d81)));
  }
  function _0x181c18(_0x1cab22 = null) {
    if (_0x1cab22) _0x11b7f8 = _0x147173(_0x1cab22);
    return (
      _0x190d77 && (clearTimeout(_0x190d77), (_0x190d77 = null)),
      _0x52f049 && (_0x1cf8c2(_0x52f049), (_0x52f049 = null)),
      _0x126248(),
      _0x277f12
    );
  }
  const _0x5a937a = (_0x3e2269, _0x1341ba = {}) => _0x3a64af(_0x3e2269, _0x1341ba),
    _0x247583 = (_0x3995fc = null) => _0x181c18(_0x3995fc),
    _0x49cd1b = () => _0x277f12;
  ((window._v2ScheduleMinimapViewportPreview = _0x5a937a),
    (window._v2FlushMinimapViewportPreview = _0x247583),
    (window._v2GetMinimapPreviewFlushCount = _0x49cd1b));
  const _0x444eef = _0x39c75d.subscribeSelector(
      (_0x548084) => _0x548084._persistRev || 0,
      () => _0x4a42b3('nodes'),
    ),
    _0x1ff42e = _0x39c75d.subscribeSelector(
      (_0x40bc4a) => _0x40bc4a.viewport,
      () => _0x4a42b3('viewport'),
    );
  _0x4a42b3('both');
  const _0x289a37 = document.getElementById('v2-wrap');
  _0x289a37 &&
    (_0x289a37.style.removeProperty('--bg-x'),
    _0x289a37.style.removeProperty('--bg-y'),
    _0x289a37.style.removeProperty('--bg-zoom'));
  let _0x112dcf = false;
  const _0x493476 = (_0x4d6db5) => {
    const _0x1e2062 = _0x39c75d.getStateRaw(),
      { viewport: _0x575c31 } = _0x1e2062,
      {
        bounds: _0x5c01a9,
        scale: _0x9c519a,
        offsetX: _0x48b030,
        offsetY: _0x2b9ce7,
      } = _0x2cd81a(_0x1e2062, { allowCached: true }),
      _0x40546c = _0xd3bc54.getBoundingClientRect(),
      _0x2f5a7b = _0x4d6db5.clientX - _0x40546c.left - _0x48b030,
      _0x2f461e = _0x4d6db5.clientY - _0x40546c.top - _0x2b9ce7,
      _0x27ce9d = _0x5c01a9.minX + _0x2f5a7b / _0x9c519a,
      _0x57d072 = _0x5c01a9.minY + _0x2f461e / _0x9c519a,
      _0x31e4e9 = window.innerWidth / 2 - _0x27ce9d * _0x575c31.zoom,
      _0x43a3f6 = window.innerHeight / 2 - _0x57d072 * _0x575c31.zoom;
    _0x39c75d.updateViewport(_0x31e4e9, _0x43a3f6, _0x575c31.zoom);
  };
  return (
    _0x12b139.addEventListener('pointerdown', (_0x9323ff) => {
      (_0x9323ff.stopPropagation(),
        (_0x112dcf = true),
        _0x12b139.setPointerCapture(_0x9323ff.pointerId),
        _0x493476(_0x9323ff));
    }),
    _0x12b139.addEventListener('pointermove', (_0x386432) => {
      if (!_0x112dcf) return;
      _0x493476(_0x386432);
    }),
    _0x12b139.addEventListener('pointerup', (_0x1b93b7) => {
      ((_0x112dcf = false), _0x12b139.releasePointerCapture(_0x1b93b7.pointerId));
    }),
    function _0x5dd6c3() {
      (_0x444eef(),
        _0x1ff42e(),
        _0x37400a && (_0x1cf8c2(_0x37400a), (_0x37400a = null)),
        _0x2fd5cb && (clearTimeout(_0x2fd5cb), (_0x2fd5cb = null)),
        _0x52f049 && (_0x1cf8c2(_0x52f049), (_0x52f049 = null)),
        _0x190d77 && (clearTimeout(_0x190d77), (_0x190d77 = null)),
        window._v2ScheduleMinimapViewportPreview === _0x5a937a &&
          delete window._v2ScheduleMinimapViewportPreview,
        window._v2FlushMinimapViewportPreview === _0x247583 && delete window._v2FlushMinimapViewportPreview,
        window._v2GetMinimapPreviewFlushCount === _0x49cd1b && delete window._v2GetMinimapPreviewFlushCount,
        _0x24515d.forEach((_0x5903e3) => _0x5903e3.remove()),
        _0x24515d.clear());
    }
  );
}
