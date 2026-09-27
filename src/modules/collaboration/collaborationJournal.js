export function createCollaborationJournal({
  roomId: _0x1f3e0d,
  actorId: _0x2ced5b,
  clientId: _0x3768a7,
  indexedDB: indexedDB = globalThis['indexedDB'],
}) {
  const _0x2b26c5 = JSON['stringify']([_0x1f3e0d, _0x2ced5b, _0x3768a7]);
  let _0x3f76da,
    _0x14e6e2 = Promise['resolve']();
  function _0x256ea4() {
    if (!indexedDB) return Promise['resolve'](null);
    if (!_0x3f76da)
      _0x3f76da = new Promise((_0x2d6d12, _0x45c513) => {
        const _0x344ba1 = indexedDB['open']('aicanvas-collaboration-recovery', 0x1);
        ((_0x344ba1['onupgradeneeded'] = () => _0x344ba1['result']['createObjectStore']('pending')),
          (_0x344ba1['onsuccess'] = () => {
            const _0x2d27e9 = _0x344ba1['result'];
            ((_0x2d27e9['onversionchange'] = () => _0x2d27e9['close']()), _0x2d6d12(_0x2d27e9));
          }),
          (_0x344ba1['onerror'] = () => _0x45c513(_0x344ba1['error'])),
          (_0x344ba1['onblocked'] = () => _0x45c513(new Error('协作恢复存储正被其他窗口占用'))));
      });
    return _0x3f76da;
  }
  function _0x335815(_0x299f2a, _0x36ba3f) {
    const _0x49b7aa = _0x14e6e2['catch'](() => {})['then'](async () => {
      const _0x2b6183 = await _0x256ea4();
      if (!_0x2b6183) return null;
      return new Promise((_0x257f95, _0x318273) => {
        const _0x4b4b99 = _0x2b6183['transaction']('pending', _0x299f2a),
          _0x23606d = _0x36ba3f(_0x4b4b99['objectStore']('pending'));
        ((_0x4b4b99['oncomplete'] = () => _0x257f95(_0x23606d['result'])),
          (_0x4b4b99['onabort'] = _0x4b4b99['onerror'] =
            () => _0x318273(_0x4b4b99['error'] || new Error('无法写入协作恢复存储'))));
      });
    });
    return ((_0x14e6e2 = _0x49b7aa), _0x49b7aa);
  }
  return {
    available: !!indexedDB,
    read: () => _0x335815('readonly', (_0xaa67bd) => _0xaa67bd['get'](_0x2b26c5)),
    write(_0x309c9a) {
      const _0x2a7331 = structuredClone({ ..._0x309c9a, schema: 0x1 });
      return _0x335815('readwrite', (_0x1e9323) => _0x1e9323['put'](_0x2a7331, _0x2b26c5));
    },
    clear: () => _0x335815('readwrite', (_0x3b6c0e) => _0x3b6c0e['delete'](_0x2b26c5)),
    async close() {
      await _0x14e6e2['catch'](() => {});
      const _0x19dfff = await _0x3f76da?.['catch'](() => null);
      _0x19dfff?.['close']();
    },
  };
}
