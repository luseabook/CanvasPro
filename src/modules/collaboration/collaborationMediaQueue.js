import { createCollaborationMedia } from './collaborationMedia.js';
import { projectGraph } from './collaborationDocument.js';
import { normalizeCollaborationMediaSource } from '../../../api/canvasCollaborationApi.js';
const PENDING = /^aic-(pending|failed):([\w-]+)$/,
  PREVIEW_FIELDS = [
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'originalWidth',
    'originalHeight',
  ];
function walk(_0x171391, _0x5a67b4, _0x1246c0 = []) {
  if (typeof _0x171391 === 'string') return _0x5a67b4(_0x171391, _0x1246c0);
  if (Array['isArray'](_0x171391))
    return _0x171391['map']((_0x19b366, _0x5afd91) => walk(_0x19b366, _0x5a67b4, [..._0x1246c0, _0x5afd91]));
  if (_0x171391 && typeof _0x171391 === 'object')
    return Object['fromEntries'](
      Object['entries'](_0x171391)['map'](([_0x52c9ab, _0xd63173]) => [
        _0x52c9ab,
        walk(_0xd63173, _0x5a67b4, [..._0x1246c0, _0x52c9ab]),
      ]),
    );
  return _0x171391;
}
export function createCollaborationMediaQueue({
  onChange: onChange = () => {},
  onPreview: onPreview = () => {},
  readGraph: _0x3c44e0,
  ..._0x56d221
}) {
  const _0x3b7525 = createCollaborationMedia(_0x56d221),
    _0x206e3d = new Map(),
    _0x5477b0 = new Map(),
    _0x4c00cb = [],
    _0x251144 = new Set();
  let _0x2a0266 = ![],
    _0x2ac1b9 = null,
    _0x344357 = 0x0,
    _0x3a1911 = null,
    _0x1e3b9b = null,
    _0x537a6a = null,
    _0x4aa5db = null,
    _0x399cca = [];
  const _0x52774b = (_0x7eb7f0) =>
      Number['isFinite'](_0x7eb7f0['_nodesRev'])
        ? _0x7eb7f0['_nodesRev'] + ':' + _0x7eb7f0['_edgesRev'] + ':' + _0x344357
        : null,
    _0x3d9ba9 = () => !_0x2a0266 && !_0x56d221['signal']?.['aborted'];
  function _0xb68fbc(_0xb0385d) {
    const _0x3b297a = normalizeCollaborationMediaSource(_0xb0385d);
    if (!_0x206e3d['has'](_0x3b297a)) {
      const _0x5cfea7 = { source: _0x3b297a, token: crypto['randomUUID'](), phase: 'queued', ref: null };
      (_0x206e3d['set'](_0x3b297a, _0x5cfea7), _0x5477b0['set'](_0x5cfea7['token'], _0x5cfea7));
    }
    return _0x206e3d['get'](_0x3b297a);
  }
  function _0x492b58(_0x5219f8) {
    const _0x4e7b8b = _0x5219f8['_collaborationPendingMedia'] || [];
    if (!_0x4e7b8b['length']) return _0x5219f8;
    return walk(_0x5219f8, (_0x1e2fb0, _0x9c728c) => {
      if (_0x1e2fb0 !== '') return _0x1e2fb0;
      return (
        _0x4e7b8b['find'](
          (_0x4cee9b) => JSON['stringify'](_0x4cee9b['path']) === JSON['stringify'](_0x9c728c),
        )?.['value'] || _0x1e2fb0
      );
    });
  }
  function _0x521a8c(_0x3682a1) {
    const _0x184dac = _0x52774b(_0x3682a1);
    if (_0x184dac !== null && _0x184dac === _0x1e3b9b)
      return { nodes: { ..._0x537a6a['nodes'] }, edges: { ..._0x537a6a['edges'] } };
    const _0x5360e0 = Object['fromEntries'](
        Object['entries'](_0x3682a1['nodes'] || {})['map'](([_0x282e99, _0x71cb5e]) => [
          _0x282e99,
          _0x492b58(_0x71cb5e),
        ]),
      ),
      _0x4d25f9 = projectGraph({ nodes: _0x5360e0, edges: _0x3682a1['edges'] || {} }, (_0x263607) => {
        const _0x372a0d = _0x3b7525['resolveSource'](_0x263607);
        if (_0x372a0d !== _0x263607) return _0x372a0d;
        const _0x333e3b = _0xb68fbc(_0x263607);
        return (
          _0x333e3b['ref'] ||
          'aic-' + (_0x333e3b['phase'] === 'failed' ? 'failed' : 'pending') + ':' + _0x333e3b['token']
        );
      }),
      _0x1c5f2b = _0x54fc54(_0x4d25f9);
    return (
      _0x184dac !== null && ((_0x1e3b9b = _0x184dac), (_0x537a6a = _0x1c5f2b)),
      { nodes: { ..._0x1c5f2b['nodes'] }, edges: { ..._0x1c5f2b['edges'] } }
    );
  }
  function _0x54fc54(_0x281553) {
    return walk(_0x281553, (_0x13849d) => {
      const _0x107c46 = _0x13849d['match'](PENDING),
        _0x2c400c = _0x107c46 && _0x5477b0['get'](_0x107c46[0x2]);
      return _0x2c400c
        ? _0x2c400c['ref'] ||
            'aic-' + (_0x2c400c['phase'] === 'failed' ? 'failed' : 'pending') + ':' + _0x2c400c['token']
        : _0x13849d;
    });
  }
  function _0x29530a(_0x3b4953) {
    const _0x2fd7b3 = new Set();
    return (
      projectGraph({ nodes: { node: _0x492b58(_0x3b4953) }, edges: {} }, (_0xa85e84) => {
        if (_0x3b7525['resolveSource'](_0xa85e84) === _0xa85e84)
          _0x2fd7b3['add'](normalizeCollaborationMediaSource(_0xa85e84));
        return _0xa85e84;
      }),
      [..._0x2fd7b3]
    );
  }
  function _0x5f1199(_0x437ada) {
    if (Number['isFinite'](_0x437ada['_nodesRev']) && _0x437ada['_nodesRev'] === _0x3a1911)
      return _0x521a8c(_0x437ada);
    ((_0x3a1911 = Number['isFinite'](_0x437ada['_nodesRev']) ? _0x437ada['_nodesRev'] : null),
      _0x521a8c(_0x437ada));
    for (const [_0x748811, _0x341d32] of Object['entries'](_0x437ada['nodes'] || {})) {
      const _0x473f86 = _0x29530a(_0x341d32)
        ['map'](_0xb68fbc)
        ['filter']((_0x24ef5e) => _0x24ef5e['phase'] === 'queued');
      if (!_0x473f86['length']) continue;
      for (const _0x4327d6 of _0x473f86) _0x4327d6['phase'] = 'waiting';
      _0x4c00cb['push']({ id: _0x748811, node: structuredClone(_0x341d32), needed: _0x473f86 });
    }
    return (_0x59cd57(), _0x521a8c(_0x437ada));
  }
  function _0x59cd57() {
    while (_0x3d9ba9() && _0x251144['size'] < 0x1 && _0x4c00cb['length']) {
      const _0xe906b2 = _0x4c00cb['shift']();
      (_0x251144['add'](_0xe906b2),
        void (async () => {
          try {
            const _0x51146a = _0x3c44e0?.()['nodes'][_0xe906b2['id']];
            if (
              _0x3c44e0 &&
              (!_0x51146a ||
                !_0xe906b2['needed']['some']((_0x2effdc) =>
                  _0x29530a(_0x51146a)['includes'](_0x2effdc['source']),
                ))
            ) {
              for (const _0x3604e7 of _0xe906b2['needed']) _0x3604e7['phase'] = 'queued';
              _0x3a1911 = null;
              return;
            }
            for (const _0x55e854 of _0xe906b2['needed']) _0x55e854['phase'] = 'preparing';
            const _0x4ed2ba = await _0x3b7525['prepare']({
              nodes: { [_0xe906b2['id']]: _0xe906b2['node'] },
              edges: {},
            });
            if (!_0x3d9ba9()) return;
            for (const _0x4ffb78 of _0xe906b2['needed']) {
              ((_0x4ffb78['ref'] = _0x3b7525['project']({ nodes: { source: { src: _0x4ffb78['source'] } } })[
                'nodes'
              ]['source']['src']),
                (_0x4ffb78['phase'] = 'ready'));
            }
            const _0x6f2527 = await _0x3b7525['materialize'](_0x4ed2ba);
            if (!_0x3d9ba9()) return;
            const _0x24f6e2 = Object['fromEntries'](
              PREVIEW_FIELDS['filter'](
                (_0x221e9d) =>
                  _0x6f2527['nodes'][_0xe906b2['id']][_0x221e9d] !== undefined &&
                  _0x6f2527['nodes'][_0xe906b2['id']][_0x221e9d] !== _0xe906b2['node'][_0x221e9d],
              )['map']((_0x314c0a) => [_0x314c0a, _0x6f2527['nodes'][_0xe906b2['id']][_0x314c0a]]),
            );
            if (Object['keys'](_0x24f6e2)['length']) onPreview(_0xe906b2['id'], _0xe906b2['node'], _0x24f6e2);
          } catch (_0x897044) {
            if (!_0x3d9ba9()) return;
            for (const _0x2f4d7a of _0xe906b2['needed']) {
              ((_0x2f4d7a['phase'] = 'failed'), (_0x2f4d7a['message'] = _0x897044['message']));
            }
          } finally {
            _0x251144['delete'](_0xe906b2);
            if (_0x3d9ba9()) {
              (_0x344357++, onChange());
              if (_0x4c00cb['length'] && !_0x2ac1b9)
                _0x2ac1b9 = setTimeout(() => {
                  ((_0x2ac1b9 = null), _0x59cd57());
                }, 0x0);
            }
          }
        })());
    }
  }
  return {
    project: _0x521a8c,
    resolveWire: _0x54fc54,
    snapshotBindings: (_0x49dbc0) => _0x3b7525['snapshotBindings'](_0x49dbc0),
    restoreBindings(_0x444e48) {
      (_0x3b7525['restoreBindings'](_0x444e48), (_0x1e3b9b = null), (_0x4aa5db = null), (_0x3a1911 = null));
    },
    afterEdit({ name: _0x5343cb, args: _0x4e697a }, _0x2addf0, _0x3322b9) {
      const _0x244cb5 =
        _0x5343cb === 'updateNodeData'
          ? { [_0x4e697a[0x0]]: _0x4e697a[0x1] }
          : _0x5343cb === 'updateNodesData'
            ? _0x4e697a[0x0]
            : {};
      for (const [_0x13dd64, _0x3a7d0c] of Object['entries'](_0x244cb5 || {})) {
        const _0x206aa3 = _0x2addf0['nodes'][_0x13dd64]?.['_collaborationPendingMedia'];
        if (!_0x206aa3 || !_0x3a7d0c || _0x3a7d0c['_collaborationPendingMedia']) continue;
        const _0x52f3d9 = _0x206aa3['filter'](
          (_0x4550e2) => !Object['hasOwn'](_0x3a7d0c, _0x4550e2['path'][0x0]),
        );
        if (_0x52f3d9['length'] !== _0x206aa3['length']) _0x3322b9(_0x13dd64, _0x52f3d9);
      }
    },
    prepare: _0x5f1199,
    async materialize(_0x515cb7) {
      const _0x7a32ec = await _0x3b7525['materialize'](_0x54fc54(_0x515cb7));
      for (const _0x1779c8 of Object['values'](_0x7a32ec['nodes'] || {})) {
        const _0x17aa36 = [],
          _0x292a16 = walk(_0x1779c8, (_0x3b9e83, _0x1fb165) => {
            const _0x193f81 = _0x3b9e83['match'](PENDING);
            if (!_0x193f81) return _0x3b9e83;
            const _0x1f384d = _0x5477b0['get'](_0x193f81[0x2]);
            return (_0x17aa36['push']({ path: _0x1fb165, value: _0x3b9e83 }), _0x1f384d?.['source'] || '');
          });
        Object['assign'](_0x1779c8, _0x292a16);
        if (_0x17aa36['length']) _0x1779c8['_collaborationPendingMedia'] = _0x17aa36;
      }
      return _0x7a32ec;
    },
    states(_0x151a60) {
      const _0x32f854 = _0x52774b(_0x151a60);
      if (_0x32f854 !== null && _0x32f854 === _0x4aa5db) return [..._0x399cca];
      const _0x13bff5 = [];
      for (const [_0x56b04c, _0x2b7260] of Object['entries'](_0x521a8c(_0x151a60)['nodes'])) {
        let _0x369b25 = ![],
          _0x106d59 = ![],
          _0x27f8e1 = ![],
          _0x2b6bb7 = ![],
          _0x101306 = '';
        walk(_0x2b7260, (_0x35e10c) => {
          const _0x1ca66d = _0x35e10c['match'](PENDING);
          if (_0x1ca66d) {
            ((_0x369b25 = !![]),
              (_0x106d59 ||= _0x1ca66d[0x1] === 'failed'),
              (_0x2b6bb7 ||= _0x5477b0['has'](_0x1ca66d[0x2])),
              (_0x27f8e1 ||= _0x5477b0['has'](_0x1ca66d[0x2]) && _0x1ca66d[0x1] === 'failed'));
            if (_0x1ca66d[0x1] === 'failed')
              _0x101306 ||= _0x5477b0['get'](_0x1ca66d[0x2])?.['message'] || '';
          }
          return _0x35e10c;
        });
        if (_0x369b25)
          _0x13bff5['push']({
            id: _0x56b04c,
            failed: _0x106d59,
            retry: _0x27f8e1,
            owned: _0x2b6bb7,
            ...(_0x101306 ? { message: _0x101306 } : {}),
          });
      }
      return (_0x32f854 !== null && ((_0x4aa5db = _0x32f854), (_0x399cca = _0x13bff5)), [..._0x13bff5]);
    },
    retry(_0x5661ca, _0x215f3c) {
      const _0x56fc1d = _0x215f3c['nodes'][_0x5661ca];
      if (!_0x56fc1d) return;
      for (const _0x2336ba of _0x29530a(_0x56fc1d)) {
        const _0xd38920 = _0xb68fbc(_0x2336ba);
        if (_0xd38920['phase'] === 'failed') _0xd38920['phase'] = 'queued';
      }
      (_0x344357++, (_0x3a1911 = null), _0x5f1199(_0x215f3c), onChange());
    },
    snapshot() {
      return [..._0x206e3d['values']()]['map'](({ source: _0x38ed54, token: _0x1461a5, ref: _0x1ea93b }) => ({
        source: _0x38ed54,
        token: _0x1461a5,
        ref: _0x1ea93b,
      }));
    },
    restore(_0x41a433) {
      (_0x344357++, (_0x3a1911 = null));
      for (const _0x209571 of _0x41a433 || []) {
        if (typeof _0x209571['source'] !== 'string' || !/^[\w-]+$/['test'](_0x209571['token'])) continue;
        const _0xe7d87 = { ..._0x209571, phase: 'queued' };
        (_0x206e3d['set'](_0x209571['source'], _0xe7d87), _0x5477b0['set'](_0x209571['token'], _0xe7d87));
      }
    },
    dispose() {
      ((_0x2a0266 = !![]),
        clearTimeout(_0x2ac1b9),
        (_0x4c00cb['length'] = 0x0),
        (_0x537a6a = null),
        (_0x399cca = []),
        _0x3b7525['dispose'](),
        _0x206e3d['clear'](),
        _0x5477b0['clear']());
    },
  };
}
