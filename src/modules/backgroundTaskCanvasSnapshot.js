const mirrors = new WeakMap();
export function captureBackgroundTaskCanvas(_0x102a2c, _0x3463d8, _0x3cdfac) {
  const _0x4063cc = _0x102a2c['getStateRaw'](),
    _0x565d50 = mirrors['get'](_0x102a2c),
    _0x1ec0f6 =
      _0x3cdfac && _0x565d50?.['canvas'] === _0x3463d8
        ? _0x3463d8['nodes']?.['findIndex']((_0x47766b) => _0x47766b['id'] === _0x3cdfac)
        : -0x1,
    _0x3b4b9a =
      _0x1ec0f6 >= 0x0 &&
      typeof _0x102a2c['serializeNode'] === 'function' &&
      _0x4063cc['_persistRev'] === _0x565d50['persistRev'] + 0x1 &&
      _0x4063cc['_contentPersistRev'] === _0x565d50['contentRev'] + 0x1 &&
      _0x4063cc['_nodeMembershipRev'] === _0x565d50['membershipRev'] &&
      _0x4063cc['_edgesRev'] === _0x565d50['edgesRev'],
    _0x4c2485 = _0x3b4b9a ? _0x102a2c['serializeNode'](_0x3cdfac) : null,
    _0x310120 = _0x4c2485
      ? {
          ..._0x3463d8,
          nodes: _0x3463d8['nodes']['map']((_0x2a0e2a, _0x2b5e48) =>
            _0x2b5e48 === _0x1ec0f6 ? _0x4c2485 : _0x2a0e2a,
          ),
        }
      : _0x102a2c['serialize']();
  return {
    snapshot: _0x310120,
    remember(_0x3a27cc) {
      mirrors['set'](_0x102a2c, {
        canvas: _0x3a27cc,
        persistRev: _0x4063cc['_persistRev'],
        contentRev: _0x4063cc['_contentPersistRev'],
        membershipRev: _0x4063cc['_nodeMembershipRev'],
        edgesRev: _0x4063cc['_edgesRev'],
      });
    },
  };
}
