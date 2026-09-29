import {
  setNodeGeometryPreview,
  clearNodeGeometryPreview,
  readNodeGeometryPreviewEntries,
} from '../../core/nodeGeometryPreview.js';
export function createCollaborationGeometry({
  store: _0x133103,
  getSession: _0x50dd31,
  windowObject: windowObject = globalThis['window'],
}) {
  const _0x4067e1 = Symbol('remote-geometry'),
    _0x379401 = new Map();
  let _0x4ea6ee = {},
    _0x4ba6a9 = '',
    _0x264d34 = null;
  function _0x1b4a4d() {
    const _0x275173 = _0x50dd31(),
      _0x29716a = _0x275173?.['state'],
      _0x57fffb = _0x133103['getStateRaw']()['nodes'];
    _0x275173 !== _0x264d34 && (_0x1ba4e0(), (_0x264d34 = _0x275173));
    if (!_0x29716a) return;
    const _0x2d80bb = Date['now'](),
      _0x30149c = new Map(readNodeGeometryPreviewEntries()),
      _0x3183a4 = (_0x5c3e57) => {
        const _0x8492e = _0x29716a['locks']?.[_0x5c3e57];
        return _0x8492e?.['clientId'] === _0x29716a['clientId'] &&
          _0x8492e['actorId'] === _0x29716a['actorId'] &&
          _0x8492e['expiresAt'] * 0x3e8 > _0x2d80bb
          ? _0x8492e
          : null;
      },
      _0x2b3802 = {};
    for (const [_0x136e08, _0xa99f23] of _0x30149c) {
      const _0x3b63b2 = _0x3183a4(_0x136e08);
      if (_0x3b63b2) _0x2b3802[_0x136e08] = { ..._0xa99f23, editId: _0x3b63b2['editId'] };
    }
    for (const [_0x5247fe, _0x226993] of Object['entries'](_0x4ea6ee)) {
      if (
        !_0x2b3802[_0x5247fe] &&
        _0x3183a4(_0x5247fe)?.['editId'] === _0x226993['editId'] &&
        Object['entries'](_0x226993)['every'](
          ([_0x2c9965, _0x3e8784]) =>
            _0x2c9965 === 'editId' || _0x57fffb[_0x5247fe]?.[_0x2c9965] === _0x3e8784,
        )
      )
        _0x2b3802[_0x5247fe] = _0x226993;
    }
    _0x4ea6ee = _0x2b3802;
    const _0x50a62e = JSON['stringify'](_0x4ea6ee);
    _0x50a62e !== _0x4ba6a9 && ((_0x4ba6a9 = _0x50a62e), _0x275173['setPresence']({ geometry: _0x4ea6ee }));
    const _0x35edf1 = new Map();
    for (const _0x39f4ab of _0x29716a['presence'] || []) {
      if (_0x39f4ab['clientId'] === _0x29716a['clientId'] || _0x39f4ab['expiresAt'] * 0x3e8 <= _0x2d80bb)
        continue;
      for (const [_0x1b1239, _0x3f203e] of Object['entries'](_0x39f4ab['geometry'] || {})) {
        const _0x33fc94 = _0x29716a['locks']?.[_0x1b1239];
        if (
          !_0x57fffb[_0x1b1239] ||
          _0x30149c['has'](_0x1b1239) ||
          _0x33fc94?.['clientId'] !== _0x39f4ab['clientId'] ||
          _0x33fc94['actorId'] !== _0x39f4ab['actorId'] ||
          _0x33fc94['editId'] !== _0x3f203e['editId'] ||
          _0x33fc94['expiresAt'] * 0x3e8 <= _0x2d80bb
        )
          continue;
        const _0x33408d = Object['fromEntries'](
          Object['entries'](_0x3f203e)['filter'](
            ([_0x566dd4, _0x3f498f]) =>
              ['x', 'y', 'width', 'height']['includes'](_0x566dd4) && Number['isFinite'](_0x3f498f),
          ),
        );
        _0x35edf1['set'](_0x1b1239, { patch: _0x33408d, clientId: _0x39f4ab['clientId'] });
      }
      if (_0x39f4ab['geometryRevision'] > _0x29716a['revision'])
        for (const [_0x3bf6db, _0x46a056] of _0x379401) {
          if (
            !_0x35edf1['has'](_0x3bf6db) &&
            !_0x30149c['has'](_0x3bf6db) &&
            _0x57fffb[_0x3bf6db] &&
            _0x46a056['clientId'] === _0x39f4ab['clientId']
          )
            _0x35edf1['set'](_0x3bf6db, _0x46a056);
        }
    }
    const _0x3bb216 = [..._0x379401['keys']()]['filter']((_0x2f0cb8) => !_0x35edf1['has'](_0x2f0cb8));
    if (_0x3bb216['length']) clearNodeGeometryPreview(_0x3bb216, _0x4067e1);
    const _0x4c245d = [..._0x35edf1]['filter'](
      ([_0x1b075f, _0x1b31dd]) =>
        JSON['stringify'](_0x379401['get'](_0x1b075f)) !== JSON['stringify'](_0x1b31dd),
    );
    if (_0x4c245d['length'])
      setNodeGeometryPreview(
        _0x4c245d['map'](([_0x1b1396, _0x6a8a37]) => [_0x1b1396, _0x6a8a37['patch']]),
        _0x4067e1,
      );
    const _0x5a726f = [
      ..._0x3bb216['filter']((_0x1689a8) => !_0x30149c['has'](_0x1689a8))['map']((_0x99ca48) => [
        _0x99ca48,
        null,
      ]),
      ...[..._0x35edf1]['map'](([_0x8d9e64, _0x39ffc3]) => [_0x8d9e64, _0x39ffc3['patch']]),
    ];
    if (_0x5a726f['length']) windowObject?.['v2Renderer']?.['previewNodeGeometry']?.(_0x5a726f);
    _0x379401['clear']();
    for (const [_0x2b9245, _0xe6bfa0] of _0x35edf1) _0x379401['set'](_0x2b9245, _0xe6bfa0);
  }
  function _0x1ba4e0() {
    const _0x52210f = [..._0x379401['keys']()];
    (clearNodeGeometryPreview(_0x52210f, _0x4067e1),
      windowObject?.['v2Renderer']?.['previewNodeGeometry']?.(
        _0x52210f['map']((_0x587501) => [_0x587501, null]),
      ),
      _0x379401['clear'](),
      (_0x4ea6ee = {}),
      (_0x4ba6a9 = ''));
  }
  return { update: _0x1b4a4d, clear: _0x1ba4e0, active: () => _0x379401['size'] > 0x0 };
}
