import {
  createEdgeCutCandidateIndex,
  queryEdgeCutCandidateIds,
  resolveEdgeCutSegment,
} from '../../core/edgeCuttingCandidates.js';
const CUTTING_MODE_CLASS = 'is-cutting-mode';
export function createEdgeCuttingController({
  graphStore: _0x14399e,
  getStateRaw: _0x1e3f08,
  commit: _0x936177,
  checkBBoxIntersection: _0x223d74,
  checkLineIntersection: _0x1fa88d,
  getCutEdgeKeys: _0x5cf787,
  getDocumentElement: getDocumentElement = () =>
    typeof document !== 'undefined' ? document['documentElement'] : null,
} = {}) {
  let _0x3f8b51 = ![],
    _0x255a63 = null;
  const _0xaf348d = new Set();
  let _0x3a63db = null;
  function _0x536bc3(_0x3f0b4e, _0x40963d) {
    if (Number['isFinite'](_0x3f0b4e?.[_0x40963d])) return _0x3f0b4e[_0x40963d];
    return Number['isFinite'](_0x3f0b4e?.['_persistRev']) ? _0x3f0b4e['_persistRev'] : null;
  }
  function _0x49b430(_0x13e215) {
    const _0xab3ca2 = _0x13e215?.['nodes'] || {},
      _0x393702 = _0x13e215?.['edges'] || {},
      _0x544bbb = _0x536bc3(_0x13e215, '_edgesRev'),
      _0x1347de = _0x536bc3(_0x13e215, '_nodeGeometryRev'),
      _0x10c144 = _0x544bbb !== null && _0x1347de !== null;
    if (
      _0x10c144 &&
      _0x3a63db?.['edges'] === _0x393702 &&
      _0x3a63db?.['nodes'] === _0xab3ca2 &&
      _0x3a63db?.['edgesRev'] === _0x544bbb &&
      _0x3a63db?.['geometryRev'] === _0x1347de
    )
      return _0x3a63db['candidateIndex'];
    const _0x233369 = createEdgeCutCandidateIndex(_0x393702, _0xab3ca2);
    return (
      (_0x3a63db = _0x10c144
        ? {
            edges: _0x393702,
            nodes: _0xab3ca2,
            edgesRev: _0x544bbb,
            geometryRev: _0x1347de,
            candidateIndex: _0x233369,
          }
        : null),
      _0x233369
    );
  }
  function _0x5dbbf7(_0x528b39) {
    const _0x18751a = getDocumentElement?.();
    if (!_0x18751a?.['classList']) return;
    if (_0x528b39) _0x18751a['classList']['add'](CUTTING_MODE_CLASS);
    else _0x18751a['classList']['remove'](CUTTING_MODE_CLASS);
  }
  function _0x44f46a(_0x312a1e) {
    ((_0x3f8b51 = !!_0x312a1e), _0x5dbbf7(_0x3f8b51));
  }
  function _0x2434eb() {
    return !!_0x255a63 || _0xaf348d['size'] > 0x0;
  }
  function _0x1fd511() {
    ((_0x255a63 = null), _0xaf348d['clear']());
  }
  function _0x3efacb(_0x5e96ba) {
    const _0x117463 = _0x5e96ba['filter']((_0x4df44c) => _0x4df44c && !_0xaf348d['has'](_0x4df44c));
    if (_0x117463['length'] === 0x0) return ![];
    return (
      _0x14399e['updateEdgesBatch'](_0x117463, []),
      _0x117463['forEach']((_0x17a20e) => _0xaf348d['add'](_0x17a20e)),
      !![]
    );
  }
  function _0x3fad28() {
    const _0x282e33 = _0xaf348d['size'] > 0x0;
    _0x1fd511();
    if (_0x282e33) _0x936177();
    return _0x282e33;
  }
  function _0x5b2d27(_0x4083e4, _0x49ae7f, _0x1d0ba5) {
    const _0x3b4b04 = [],
      _0x23b058 = _0x4083e4?.['nodes'] || {},
      _0x43d591 = _0x4083e4?.['edges'] || {},
      _0x19d554 = queryEdgeCutCandidateIds(
        _0x49b430(_0x4083e4),
        _0x255a63['x'],
        _0x255a63['y'],
        _0x49ae7f,
        _0x1d0ba5,
      );
    for (const _0x3e4366 of _0x19d554) {
      const _0x3cc97c = _0x43d591[_0x3e4366];
      if (!_0x3cc97c) continue;
      const _0x20919d = resolveEdgeCutSegment(_0x3cc97c, _0x23b058);
      if (!_0x20919d) continue;
      const { startX: _0x2270e0, startY: _0x3d38ae, endX: _0x24764d, endY: _0x55cda9 } = _0x20919d,
        _0x4d22c1 = _0x223d74(
          _0x255a63['x'],
          _0x255a63['y'],
          _0x49ae7f,
          _0x1d0ba5,
          _0x2270e0,
          _0x3d38ae,
          _0x24764d,
          _0x55cda9,
        );
      if (!_0x4d22c1) continue;
      const _0x4e2cad = _0x1fa88d(
        _0x255a63['x'],
        _0x255a63['y'],
        _0x49ae7f,
        _0x1d0ba5,
        _0x2270e0,
        _0x3d38ae,
        _0x24764d,
        _0x55cda9,
      );
      if (_0x4e2cad) _0x3b4b04['push'](_0x3e4366);
    }
    return _0x3b4b04;
  }
  function _0xbcc285({ e: _0x9576b2, worldX: _0x818231, worldY: _0x45eedc } = {}) {
    if (_0x3f8b51 && _0x9576b2 && _0x9576b2['buttons'] === 0x1) {
      if (_0x255a63) {
        const _0x3d7deb = _0x5b2d27(_0x1e3f08(), _0x818231, _0x45eedc);
        if (_0x3d7deb['length'] > 0x0) _0x3efacb(_0x3d7deb);
      }
      return ((_0x255a63 = { x: _0x818231, y: _0x45eedc }), !![]);
    }
    return (_0x3fad28(), ![]);
  }
  function _0x333060(_0x5e0467) {
    const _0x5f379d = String(_0x5e0467 || '')['trim']();
    if (!_0x5f379d) return '';
    const _0x517426 = _0x5f379d['toLowerCase']();
    if (_0x517426 === 'ctrl' || _0x517426 === 'control' || _0x517426 === 'meta') return 'Ctrl';
    if (_0x517426 === 'shift') return 'Shift';
    if (_0x517426 === 'alt' || _0x517426 === 'option') return 'Alt';
    if (_0x517426 === 'space' || _0x5f379d === '\x20') return 'Space';
    if (_0x517426 === 'backquote' || _0x5f379d === '`' || _0x5f379d === '~') return '`';
    if (_0x5f379d['length'] === 0x1) return _0x5f379d['toUpperCase']();
    return _0x5f379d;
  }
  function _0x428238(_0x1f92a9) {
    const _0x379b70 = Array['isArray'](_0x1f92a9) && _0x1f92a9['length'] > 0x0 ? _0x1f92a9 : ['Ctrl'],
      _0x5cf6cd = _0x379b70['map']((_0x1085da) => _0x333060(_0x1085da))['filter'](Boolean),
      _0x5bee14 = [];
    if (_0x5cf6cd['includes']('Ctrl')) _0x5bee14['push']('Ctrl');
    if (_0x5cf6cd['includes']('Shift')) _0x5bee14['push']('Shift');
    if (_0x5cf6cd['includes']('Alt')) _0x5bee14['push']('Alt');
    const _0x288581 = _0x5cf6cd['filter'](
      (_0x85518) => _0x85518 !== 'Ctrl' && _0x85518 !== 'Shift' && _0x85518 !== 'Alt',
    );
    return [..._0x5bee14, ..._0x288581];
  }
  function _0x4cd716(_0x24cb83) {
    const _0x244a8e = String(_0x24cb83?.['code'] || '')['trim']();
    if (_0x244a8e === 'Backquote') return '`';
    if (_0x244a8e === 'Space') return 'Space';
    if (_0x244a8e === 'Delete') return 'Delete';
    if (_0x244a8e === 'Backspace') return 'Backspace';
    return _0x333060(_0x24cb83?.['key'] === '\x20' ? 'Space' : _0x24cb83?.['key']);
  }
  function _0x5d434d(_0x338196) {
    const _0x19d881 = _0x428238(_0x5cf787?.()),
      _0x1ceb6a = _0x19d881['includes']('Ctrl'),
      _0x3e312f = _0x19d881['includes']('Shift'),
      _0x37de1d = _0x19d881['includes']('Alt');
    if (!!(_0x338196?.['ctrlKey'] || _0x338196?.['metaKey']) !== _0x1ceb6a) return ![];
    if ((_0x338196?.['shiftKey'] === !![]) !== _0x3e312f) return ![];
    if ((_0x338196?.['altKey'] === !![]) !== _0x37de1d) return ![];
    const _0x4ca40d = _0x19d881['filter'](
        (_0x17f8a4) => _0x17f8a4 !== 'Ctrl' && _0x17f8a4 !== 'Shift' && _0x17f8a4 !== 'Alt',
      ),
      _0x4c5f8e = _0x4cd716(_0x338196);
    if (_0x4ca40d['length'] === 0x0) {
      if (_0x19d881['length'] !== 0x1) return ![];
      return _0x4c5f8e === _0x19d881[0x0];
    }
    return _0x4ca40d['length'] === 0x1 && _0x4c5f8e === _0x4ca40d[0x0];
  }
  function _0x3b6b61(_0x54b9db) {
    const _0x276590 = _0x428238(_0x5cf787?.()),
      _0x30b5d2 = _0x4cd716(_0x54b9db);
    if (!_0x30b5d2) return ![];
    if (_0x276590['length'] === 0x1) return _0x30b5d2 === _0x276590[0x0];
    const _0xbb5618 = _0x276590['filter'](
      (_0x1308f7) => _0x1308f7 !== 'Ctrl' && _0x1308f7 !== 'Shift' && _0x1308f7 !== 'Alt',
    );
    return _0xbb5618['length'] === 0x1 && _0x30b5d2 === _0xbb5618[0x0];
  }
  function _0x598a9d(_0x45a1b4) {
    if (_0x5d434d(_0x45a1b4)) _0x44f46a(!![]);
  }
  function _0xbf4082() {
    (_0x44f46a(![]), _0x3fad28());
  }
  function _0x2e0b33(_0x3317a3) {
    if (!_0x3f8b51 || !_0x3b6b61(_0x3317a3)) return;
    _0xbf4082();
  }
  function _0x1a7b58(_0x3950a4 = typeof window !== 'undefined' ? window : null) {
    if (!_0x3950a4?.['addEventListener']) return () => {};
    return (
      _0x3950a4['addEventListener']('keydown', _0x598a9d),
      _0x3950a4['addEventListener']('keyup', _0x2e0b33),
      _0x3950a4['addEventListener']('blur', _0xbf4082),
      () => {
        (_0x3950a4['removeEventListener']?.('keydown', _0x598a9d),
          _0x3950a4['removeEventListener']?.('keyup', _0x2e0b33),
          _0x3950a4['removeEventListener']?.('blur', _0xbf4082),
          _0x44f46a(![]),
          _0x1fd511());
      }
    );
  }
  return {
    finishSession: _0x3fad28,
    handlePointerMove: _0xbcc285,
    hasActiveSession: _0x2434eb,
    install: _0x1a7b58,
  };
}
