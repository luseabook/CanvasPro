export function recordDirectorDeletions(_0x2e5705, _0x4dfc06, _0x34217a = '删除内容') {
  if (
    _0x2e5705['id'] !== _0x4dfc06['id'] ||
    !Array['isArray'](_0x2e5705['scenes']) ||
    !Array['isArray'](_0x4dfc06['scenes'])
  )
    return _0x4dfc06;
  const _0x1fe288 = [];
  for (const _0x139ce7 of _0x2e5705['scenes']) {
    const _0x11a39b = _0x4dfc06['scenes']['find']((_0x56126a) => _0x56126a['id'] === _0x139ce7['id']),
      _0x47c894 = _0x139ce7['objects']
        ['filter'](
          (_0x488dd6) => !_0x11a39b?.['objects']['some']((_0xb920b4) => _0xb920b4['id'] === _0x488dd6['id']),
        )
        ['map']((_0x436d17) => _0x436d17['id']),
      _0x21857b = _0x139ce7['shots']
        ['filter'](
          (_0x4bc360) => !_0x11a39b?.['shots']['some']((_0x568485) => _0x568485['id'] === _0x4bc360['id']),
        )
        ['map']((_0x37858f) => _0x37858f['id']);
    if (!_0x11a39b || _0x47c894['length'] || _0x21857b['length'])
      _0x1fe288['push']({
        scene: structuredClone(_0x139ce7),
        wholeScene: !_0x11a39b,
        objectIds: _0x47c894,
        shotIds: _0x21857b,
      });
  }
  if (_0x1fe288['length'])
    _0x4dfc06['recycleBin'] = [
      ...(_0x4dfc06['recycleBin'] || []),
      {
        id: 'recycle-' + globalThis['crypto']['randomUUID'](),
        label: _0x34217a,
        deletedAt: Date['now'](),
        removed: _0x1fe288,
      },
    ]['slice'](-0x14);
  return _0x4dfc06;
}
export function normalizeDirectorRecycleBin(_0x27f796, _0x3b89bf) {
  return (Array['isArray'](_0x27f796) ? _0x27f796 : [])
    ['slice'](-0x14)
    ['filter']((_0x4ac78a) => typeof _0x4ac78a?.['id'] === 'string')
    ['map']((_0x1f075f) => ({
      id: _0x1f075f['id'],
      label: String(_0x1f075f['label'] || '删除内容')['slice'](0x0, 0x78),
      deletedAt: Math['max'](0x0, Number(_0x1f075f['deletedAt']) || 0x0),
      removed: (Array['isArray'](_0x1f075f['removed']) ? _0x1f075f['removed'] : [])
        ['slice'](0x0, 0x64)
        ['filter']((_0x1a0b4f) => _0x1a0b4f?.['scene'])
        ['map']((_0x118dc4, _0x3a8dbc) => ({
          scene: _0x3b89bf(_0x118dc4['scene'], _0x3a8dbc),
          wholeScene: _0x118dc4['wholeScene'] === !![],
          objectIds: (Array['isArray'](_0x118dc4['objectIds']) ? _0x118dc4['objectIds'] : [])['filter'](
            (_0x24f87d) => typeof _0x24f87d === 'string',
          ),
          shotIds: (Array['isArray'](_0x118dc4['shotIds']) ? _0x118dc4['shotIds'] : [])['filter'](
            (_0x5a77e8) => typeof _0x5a77e8 === 'string',
          ),
        })),
    }));
}
export function restoreDirectorRecycleEntry(_0x2dc178, _0x118d35) {
  const _0x1732f2 = structuredClone(_0x2dc178),
    _0x5dcd05 = _0x1732f2['recycleBin']?.['find']((_0x208fe1) => _0x208fe1['id'] === _0x118d35);
  if (!_0x5dcd05) throw new Error('回收记录不存在。');
  for (const _0x3c8b8f of _0x5dcd05['removed']) {
    let _0x541049 = _0x1732f2['scenes']['find']((_0xebd10e) => _0xebd10e['id'] === _0x3c8b8f['scene']['id']);
    if (!_0x541049) {
      _0x1732f2['scenes']['push'](structuredClone(_0x3c8b8f['scene']));
      continue;
    }
    const _0x5afe0c = new Set();
    for (const _0x54872d of _0x3c8b8f['scene']['objects'])
      _0x3c8b8f['objectIds']['includes'](_0x54872d['id']) &&
        !_0x541049['objects']['some']((_0x4b1a7a) => _0x4b1a7a['id'] === _0x54872d['id']) &&
        (_0x541049['objects']['push'](structuredClone(_0x54872d)), _0x5afe0c['add'](_0x54872d['id']));
    for (const _0x22f950 of _0x541049['objects'])
      if (
        _0x22f950['parentId'] &&
        !_0x541049['objects']['some']((_0x37a49d) => _0x37a49d['id'] === _0x22f950['parentId'])
      )
        delete _0x22f950['parentId'];
    for (const _0x3eb742 of _0x3c8b8f['scene']['shots']) {
      const _0x242328 = _0x541049['shots']['find']((_0x422866) => _0x422866['id'] === _0x3eb742['id']);
      if (!_0x242328 && _0x3c8b8f['shotIds']['includes'](_0x3eb742['id'])) {
        _0x541049['shots']['push'](structuredClone(_0x3eb742));
        continue;
      }
      if (!_0x242328) continue;
      (_0x242328['animation']['objectTracks']['push'](
        ...structuredClone(
          _0x3eb742['animation']['objectTracks']['filter'](
            (_0x3a9d3d) =>
              _0x5afe0c['has'](_0x3a9d3d['objectId']) &&
              !_0x242328['animation']['objectTracks']['some'](
                (_0x2c4c01) => _0x2c4c01['objectId'] === _0x3a9d3d['objectId'],
              ),
          ),
        ),
      ),
        _0x242328['animation']['actionClips']['push'](
          ...structuredClone(
            _0x3eb742['animation']['actionClips']['filter'](
              (_0x3c18fb) =>
                _0x5afe0c['has'](_0x3c18fb['objectId']) &&
                !_0x242328['animation']['actionClips']['some'](
                  (_0x293b92) => _0x293b92['id'] === _0x3c18fb['id'],
                ),
            ),
          ),
        ));
      const _0x21af4d = new Set(
        _0x242328['animation']['objectTracks']
          ['filter']((_0x5239e7) => _0x5afe0c['has'](_0x5239e7['objectId']))
          ['flatMap']((_0xc898c0) =>
            ['position', 'rotation', 'scale']['flatMap']((_0x55ce4c) =>
              _0xc898c0[_0x55ce4c + 'Keyframes']['map']((_0x3e0123) => _0x3e0123['id']),
            ),
          ),
      );
      ((_0x242328['animation']['motionClips'] ||= []),
        _0x242328['animation']['motionClips']['push'](
          ...structuredClone(
            (_0x3eb742['animation']['motionClips'] || [])['filter'](
              (_0x507912) =>
                _0x507912['keyframeIds']['some']((_0x23def0) => _0x21af4d['has'](_0x23def0)) &&
                !_0x242328['animation']['motionClips']['some'](
                  (_0x59e48b) => _0x59e48b['id'] === _0x507912['id'],
                ),
            ),
          ),
        ));
      for (const _0x261484 of _0x5afe0c)
        if (_0x3eb742['animation']['objectPaths']?.[_0x261484])
          (_0x242328['animation']['objectPaths'] ||= {})[_0x261484] = structuredClone(
            _0x3eb742['animation']['objectPaths'][_0x261484],
          );
      for (const _0x2038f5 of ['followObjectId', 'lookAtObjectId'])
        if (
          !_0x242328['animation']['cameraConstraint'][_0x2038f5] &&
          _0x5afe0c['has'](_0x3eb742['animation']['cameraConstraint'][_0x2038f5])
        )
          _0x242328['animation']['cameraConstraint'][_0x2038f5] =
            _0x3eb742['animation']['cameraConstraint'][_0x2038f5];
      ((_0x242328['animation']['cameraConstraintClips'] ||= []),
        _0x242328['animation']['cameraConstraintClips']['push'](
          ...structuredClone(
            (_0x3eb742['animation']['cameraConstraintClips'] || [])['filter'](
              (_0x4dcd11) =>
                (_0x5afe0c['has'](_0x4dcd11['followObjectId']) ||
                  _0x5afe0c['has'](_0x4dcd11['lookAtObjectId'])) &&
                !_0x242328['animation']['cameraConstraintClips']['some'](
                  (_0x1004f2) => _0x1004f2['id'] === _0x4dcd11['id'],
                ),
            ),
          ),
        ));
    }
  }
  return (
    (_0x1732f2['recycleBin'] = _0x1732f2['recycleBin']['filter'](
      (_0x28351a) => _0x28351a['id'] !== _0x118d35,
    )),
    _0x1732f2
  );
}
export function directorDeletionImpact(_0x432825, _0x5817a7) {
  const _0x286ff9 = new Set(_0x5817a7),
    _0x14e9f2 = _0x432825['shots']['filter']((_0x1799c8) => _0x286ff9['has'](_0x1799c8['cameraId']))[
      'length'
    ],
    _0x145123 = _0x432825['shots']['reduce'](
      (_0x247929, _0x2bb08d) =>
        _0x247929 +
        _0x2bb08d['animation']['objectTracks']['filter']((_0x2f4176) =>
          _0x286ff9['has'](_0x2f4176['objectId']),
        )['length'],
      0x0,
    ),
    _0xcaf01b = _0x432825['shots']['reduce'](
      (_0x2500c4, _0x3a0ea8) =>
        _0x2500c4 +
        [
          _0x3a0ea8['animation']['cameraConstraint'],
          ...(_0x3a0ea8['animation']['cameraConstraintClips'] || []),
        ]['filter'](
          (_0x14acc2) =>
            _0x286ff9['has'](_0x14acc2['followObjectId']) || _0x286ff9['has'](_0x14acc2['lookAtObjectId']),
        )['length'],
      0x0,
    );
  return (
    '已移入回收站：' +
    _0x5817a7['length'] +
    ' 个对象，关联 ' +
    _0x14e9f2 +
    ' 个镜头、' +
    _0x145123 +
    '\x20条运动轨道、' +
    _0xcaf01b +
    ' 项跟拍约束。可在导演编排中恢复。'
  );
}
