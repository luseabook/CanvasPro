import { graphChangesConflict } from './collaborationDocument.js';
import { mergeCollaborationFields } from './collaborationFieldMerge.js';
export function createCollaborationConflicts() {
  const _0x257c93 = new Map(),
    _0x2db328 = (_0x1f8ced) => _0x1f8ced['kind'] + ':' + _0x1f8ced['id'];
  return {
    has: (_0x415c9f) => _0x257c93['has'](_0x2db328(_0x415c9f)),
    list: () => [..._0x257c93['values']()],
    clear: () => _0x257c93['clear'](),
    hold(_0x5eefc4) {
      for (const _0x50efb1 of _0x5eefc4)
        _0x257c93['set'](_0x2db328(_0x50efb1), { kind: _0x50efb1['kind'], id: _0x50efb1['id'] });
    },
    blocks(_0x5e7b26, _0x4bbf83) {
      return [..._0x257c93['values']()]['some']((_0x7efac7) =>
        _0x7efac7['kind'] === 'nodes'
          ? _0x5e7b26['includes'](_0x7efac7['id'])
          : [
              _0x4bbf83['edges'][_0x7efac7['id']]?.['sourceId'],
              _0x4bbf83['edges'][_0x7efac7['id']]?.['targetId'],
            ]['some']((_0x4c1061) => _0x5e7b26['includes'](_0x4c1061)),
      );
    },
    reconcile(_0x5a0642, _0x2068fc, _0x4b4004) {
      for (const _0x586e78 of _0x5a0642) {
        if (_0x257c93['has'](_0x2db328(_0x586e78))) continue;
        const _0x11c46e = _0x2068fc['filter']((_0x39024f) =>
          graphChangesConflict([_0x586e78], [_0x39024f], _0x4b4004),
        );
        if (!_0x11c46e['length']) continue;
        try {
          if (_0x11c46e['some']((_0x208d8a) => _0x2db328(_0x208d8a) !== _0x2db328(_0x586e78)))
            throw new Error('dependent edit');
          mergeCollaborationFields(
            _0x586e78['before'],
            _0x586e78['after'],
            _0x4b4004[_0x586e78['kind']][_0x586e78['id']] ?? null,
          );
        } catch {
          this['hold']([_0x586e78, ..._0x11c46e]);
        }
      }
      return _0x5a0642['filter']((_0xab02c8) => !_0x257c93['has'](_0x2db328(_0xab02c8)));
    },
  };
}
export function partitionCollaborationConflict(_0x15ae78, _0x462f15, _0x340247, _0x45ebb5) {
  const _0x37ed93 = (_0x49437c) =>
      new Set(
        _0x49437c['kind'] === 'nodes'
          ? [_0x49437c['id'], _0x49437c['before']?.['parentId'], _0x49437c['after']?.['parentId']]['filter'](
              Boolean,
            )
          : [
              _0x49437c['before']?.['sourceId'],
              _0x49437c['before']?.['targetId'],
              _0x49437c['after']?.['sourceId'],
              _0x49437c['after']?.['targetId'],
            ]['filter'](Boolean),
      ),
    _0x9c78a5 = new Set();
  for (const _0x33926f of _0x15ae78) {
    try {
      mergeCollaborationFields(
        _0x33926f['before'],
        _0x33926f['after'],
        _0x462f15['document'][_0x33926f['kind']][_0x33926f['id']] ?? null,
      );
    } catch {
      _0x9c78a5['add'](_0x33926f);
    }
    for (const _0x465a37 of _0x37ed93(_0x33926f)) {
      const _0x11a7a3 = _0x462f15['locks']?.[_0x465a37],
        _0xab771e = _0x462f15['jobs']?.['find'](
          (_0x14bf73) => _0x14bf73['node'] === _0x465a37 && _0x14bf73['status'] === 'running',
        );
      if (
        (_0x11a7a3 &&
          _0x11a7a3['expiresAt'] * 0x3e8 > Date['now']() &&
          (_0x11a7a3['actorId'] !== _0x340247 || _0x11a7a3['clientId'] !== _0x45ebb5)) ||
        (_0xab771e && (_0xab771e['actor'] !== _0x340247 || _0xab771e['client'] !== _0x45ebb5))
      )
        _0x9c78a5['add'](_0x33926f);
    }
  }
  if (!_0x9c78a5['size']) return { blocked: _0x15ae78, safe: [] };
  let _0x10300c;
  do {
    _0x10300c = _0x9c78a5['size'];
    const _0x32edda = new Set([..._0x9c78a5]['flatMap']((_0x591faf) => [..._0x37ed93(_0x591faf)]));
    for (const _0x56920a of _0x15ae78)
      if ([..._0x37ed93(_0x56920a)]['some']((_0x2f09b2) => _0x32edda['has'](_0x2f09b2)))
        _0x9c78a5['add'](_0x56920a);
  } while (_0x10300c !== _0x9c78a5['size']);
  return { blocked: [..._0x9c78a5], safe: _0x15ae78['filter']((_0x1f5cd6) => !_0x9c78a5['has'](_0x1f5cd6)) };
}
