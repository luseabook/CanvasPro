function normalizeConcurrency(_0x5638f9, _0x175b9d) {
  const _0x5afc83 = Math['trunc'](Number(_0x5638f9));
  if (!Number['isFinite'](_0x5afc83) || _0x5afc83 <= 0x0) return 0x1;
  return Math['max'](0x1, Math['min'](_0x5afc83, Math['max'](0x1, _0x175b9d)));
}
export function createTaskBatchCancellationController() {
  let _0x5ef23f = ![];
  return Object['freeze']({
    request() {
      if (_0x5ef23f) return ![];
      return ((_0x5ef23f = !![]), !![]);
    },
    isRequested: () => _0x5ef23f,
  });
}
export async function runTaskBatchQueue({
  targets: targets = [],
  concurrency: concurrency = 0x1,
  shouldStop: shouldStop = () => ![],
  runTarget: _0x4a95fe,
  onTargetStart: onTargetStart = () => {},
  onTargetSettled: onTargetSettled = () => {},
} = {}) {
  const _0x4d26d0 = Array['isArray'](targets)
    ? targets['filter']((_0x2fdde3) => _0x2fdde3 !== null && _0x2fdde3 !== undefined)
    : [];
  if (!_0x4d26d0['length']) return [];
  if (typeof _0x4a95fe !== 'function') throw new TypeError('runTarget must be a function');
  const _0x243715 = new Array(_0x4d26d0['length']);
  let _0x2407cc = 0x0;
  const _0x3c2dca = normalizeConcurrency(concurrency, _0x4d26d0['length']),
    _0x1f36ac = Array['from']({ length: _0x3c2dca }, async () => {
      while (_0x2407cc < _0x4d26d0['length'] && !shouldStop()) {
        const _0x19ecbd = _0x2407cc;
        _0x2407cc += 0x1;
        const _0x442957 = _0x4d26d0[_0x19ecbd];
        onTargetStart({ target: _0x442957, index: _0x19ecbd, total: _0x4d26d0['length'] });
        let _0x21d424;
        try {
          const _0x54cdb4 = await _0x4a95fe(_0x442957, { index: _0x19ecbd, total: _0x4d26d0['length'] });
          _0x21d424 = { target: _0x442957, status: 'fulfilled', value: _0x54cdb4 };
        } catch (_0x3dc700) {
          _0x21d424 = { target: _0x442957, status: 'rejected', reason: _0x3dc700 };
        }
        ((_0x243715[_0x19ecbd] = _0x21d424),
          await onTargetSettled({ ..._0x21d424, index: _0x19ecbd, total: _0x4d26d0['length'] }));
      }
    });
  await Promise['all'](_0x1f36ac);
  for (let _0x568fde = 0x0; _0x568fde < _0x4d26d0['length']; _0x568fde += 0x1) {
    !_0x243715[_0x568fde] && (_0x243715[_0x568fde] = { target: _0x4d26d0[_0x568fde], status: 'cancelled' });
  }
  return _0x243715;
}
