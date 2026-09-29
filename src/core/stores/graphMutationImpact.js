export function planNodeMovement(_0x559148, _0x290da2, _0x320761) {
  const _0x4141c9 = _0x559148['nodes'] || {},
    _0x261173 = _0x559148['_parentToChildren'] || {},
    _0x13cb77 = {};
  if (_0x290da2 !== 'moveNodesByOffsets') {
    const _0x3e0b80 = _0x290da2 === 'updateNodePosition' ? [_0x320761[0x0]] : _0x320761[0x0],
      _0x1cd66f = Number(_0x320761[0x1]),
      _0x4215f7 = Number(_0x320761[0x2]);
    if (
      !_0x3e0b80?.['length'] ||
      !Number['isFinite'](_0x1cd66f) ||
      !Number['isFinite'](_0x4215f7) ||
      (!_0x1cd66f && !_0x4215f7)
    )
      return _0x13cb77;
    const _0x17fcbe = new Set(),
      _0x7e10dd = [..._0x3e0b80];
    while (_0x7e10dd['length']) {
      const _0x587887 = _0x7e10dd['pop']();
      if (_0x17fcbe['has'](_0x587887)) continue;
      _0x17fcbe['add'](_0x587887);
      if (_0x4141c9[_0x587887]) _0x13cb77[_0x587887] = { dx: _0x1cd66f, dy: _0x4215f7 };
      for (const _0x589f8f of _0x261173[_0x587887] || [])
        if (_0x4141c9[_0x589f8f]) _0x7e10dd['push'](_0x589f8f);
    }
    return _0x13cb77;
  }
  const _0x4d0414 = {};
  for (const [_0x56832e, _0x5757f8] of Object['entries'](_0x320761[0x0] || {})) {
    if (!_0x4141c9[_0x56832e] || !_0x5757f8) continue;
    const _0x9a43f2 = Number(_0x5757f8['dx']),
      _0xb6bce8 = Number(_0x5757f8['dy']);
    if (Number['isFinite'](_0x9a43f2) && Number['isFinite'](_0xb6bce8) && (_0x9a43f2 || _0xb6bce8))
      _0x4d0414[_0x56832e] = { dx: _0x9a43f2, dy: _0xb6bce8 };
  }
  const _0x564df7 = new Set(Object['keys'](_0x4d0414));
  for (const _0x24d7a2 of _0x564df7) {
    const _0x4321a8 = new Set(),
      _0x38e7ba = [_0x24d7a2];
    while (_0x38e7ba['length']) {
      const _0x2c4d5f = _0x38e7ba['pop']();
      if (_0x4321a8['has'](_0x2c4d5f)) continue;
      (_0x4321a8['add'](_0x2c4d5f), (_0x13cb77[_0x2c4d5f] = _0x4d0414[_0x24d7a2]));
      for (const _0x1af183 of _0x261173[_0x2c4d5f] || []) {
        if (_0x4141c9[_0x1af183] && !_0x564df7['has'](_0x1af183)) _0x38e7ba['push'](_0x1af183);
      }
    }
  }
  return _0x13cb77;
}
export function describeGraphMutation(_0x1e7b05, _0x322cd3, _0x5995a0) {
  const _0xe782aa = _0x5995a0['nodes'] || {},
    _0x2106e9 = _0x5995a0['edges'] || {},
    _0x18f554 = { name: _0x1e7b05, args: _0x322cd3, nodeIds: [], removedNodeIds: [] },
    _0x21a088 = (_0x183d35) => [
      ...new Set(
        _0x183d35['flatMap']((_0x1bfc2e) => [_0x1bfc2e?.['sourceId'], _0x1bfc2e?.['targetId']])['filter'](
          Boolean,
        ),
      ),
    ];
  if (['updateNodePosition', 'moveNodes', 'moveNodesByOffsets']['includes'](_0x1e7b05))
    _0x18f554['nodeIds'] = Object['keys'](planNodeMovement(_0x5995a0, _0x1e7b05, _0x322cd3));
  else {
    if (_0x1e7b05 === 'deleteNodes') {
      _0x18f554['removedNodeIds'] = [...new Set(_0x322cd3[0x0] || [])];
      const _0x2e56e6 = new Set(_0x18f554['removedNodeIds']);
      _0x18f554['nodeIds'] = [
        ...new Set([
          ..._0x2e56e6,
          ..._0x21a088(
            Object['values'](_0x2106e9)['filter'](
              (_0x34b1e4) =>
                _0x2e56e6['has'](_0x34b1e4['sourceId']) || _0x2e56e6['has'](_0x34b1e4['targetId']),
            ),
          ),
        ]),
      ];
    } else {
      if (_0x1e7b05 === 'groupNodes')
        _0x18f554['nodeIds'] = (_0x322cd3[0x0] || [])['filter'](
          (_0x17fce0) =>
            _0xe782aa[_0x17fce0] && (_0xe782aa[_0x17fce0]['parentId'] || null) !== (_0x322cd3[0x1] || null),
        );
      else {
        if (_0x1e7b05 === 'addEdge')
          _0x18f554['nodeIds'] = _0x21a088([_0x2106e9[_0x322cd3[0x0]?.['id']], _0x322cd3[0x0]]);
        else {
          if (_0x1e7b05 === 'removeEdge') _0x18f554['nodeIds'] = _0x21a088([_0x2106e9[_0x322cd3[0x0]]]);
          else {
            if (_0x1e7b05 === 'updateEdgesBatch') {
              const _0x4e68de = (_0x322cd3[0x1] || [])['filter']((_0x47a4e2) => _0x47a4e2?.['id']);
              _0x18f554['nodeIds'] = _0x21a088([
                ...(_0x322cd3[0x0] || [])['map']((_0x54ddbe) => _0x2106e9[_0x54ddbe]),
                ..._0x4e68de['map']((_0xf42821) => _0x2106e9[_0xf42821['id']]),
                ..._0x4e68de,
              ]);
            } else {
              if (_0x1e7b05 === 'updateNodesData')
                _0x18f554['nodeIds'] = Object['keys'](_0x322cd3[0x0] || {});
              else {
                if (_0x1e7b05 === 'swapStoryboardCells')
                  _0x18f554['nodeIds'] = [_0x322cd3[0x0], _0x322cd3[0x2]]['filter'](Boolean);
                else {
                  if (_0x1e7b05 === 'addNode')
                    _0x18f554['nodeIds'] = [_0x322cd3[0x0]?.['id']]['filter'](Boolean);
                  else {
                    if (['updateNodeData', 'renameNode']['includes'](_0x1e7b05))
                      _0x18f554['nodeIds'] = [_0x322cd3[0x0]];
                    else throw new Error('Unknown graph mutation: ' + _0x1e7b05);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return _0x18f554;
}
