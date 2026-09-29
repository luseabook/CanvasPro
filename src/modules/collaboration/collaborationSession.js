import {
  applyGraphChanges,
  cloneGraph,
  graphChanges,
  invertChanges,
  mergeSharedNode,
  sharedValue,
} from './collaborationDocument.js';
import { createCollaborationMediaQueue } from './collaborationMediaQueue.js';
import { setGenerationExecutionPolicy } from '../../core/generationExecutionPolicy.js';
import { createCollaborationPresenceChannel } from './collaborationPresenceChannel.js';
import { createCollaborationChangeFeed } from './collaborationChangeFeed.js';
import { createCollaborationConflicts, partitionCollaborationConflict } from './collaborationConflicts.js';
import { mergeCollaborationFields } from './collaborationFieldMerge.js';
import { createCollaborationJournal } from './collaborationJournal.js';
import { readHostAttention } from './collaborationPreferences.js';
import { createCollaborationEditing } from './collaborationEditing.js';
import { createCollaborationReviewState } from './collaborationReviewState.js';
const PERMANENT_ERRORS = new Set([
  'EDIT_CONFLICT',
  'NODE_BUSY',
  'TASK_BUSY',
  'ROOM_FORBIDDEN',
  'ROLE_FORBIDDEN',
  'ACTIVATION_REQUIRED',
  'SESSION_EXPIRED',
  'VERSION_MISMATCH',
  'HOST_CERT_CHANGED',
  'PRIVATE_DATA',
  'LOCAL_MEDIA',
  'INVALID_DOCUMENT',
  'INVALID_REVISION',
  'ASSET_LIMIT',
  'ASSET_EMPTY',
  'ASSET_TYPE',
  'ASSET_MISSING',
  'ASSET_CHANGED',
  'ROOM_LIMIT',
  'ROOM_STORAGE_FULL',
]);
export function createCollaborationSession({
  store: _0x1be6b2,
  api: _0x4d7a9d,
  room: _0x21fa45,
  actorId: _0x4b82f3,
  clientId: _0xe6810,
  getCanvasId: _0x1851b3,
  hosting: hosting = ![],
  onChange: onChange = () => {},
  onPresence: onPresence = () => {},
  onDetach: onDetach = () => {},
  onConfirmed: onConfirmed = () => {},
  onAttention: onAttention = () => {},
  onNotice: onNotice = () => {},
  onComment: onComment = () => {},
  mediaOptions: mediaOptions = {},
  journal: journal = createCollaborationJournal({
    roomId: _0x21fa45['roomId'],
    actorId: _0x4b82f3,
    clientId: _0xe6810,
  }),
}) {
  const _0x110093 = _0x1851b3(),
    _0xd4433b = new AbortController(),
    _0x1e251e = {
      ..._0x21fa45,
      actorId: _0x4b82f3,
      clientId: _0xe6810,
      status: 'connecting',
      message: '正在同步画布',
      pending: ![],
    };
  let _0x82a4dc = cloneGraph(_0x21fa45['document']),
    _0x3c6d8d = null,
    _0xe7ef3b = null,
    _0x55e51f = null,
    _0x33cdc9 = null,
    _0x2d37b7 = ![],
    _0x40ebd4 = null,
    _0x232bfb = ![];
  const _0x77184 = new Set();
  let _0x219031 = ![],
    _0x2322b3 = ![],
    _0x254d76 = -0x1,
    _0x528df0 = null,
    _0x5a0f09 = null,
    _0x3520bd = null,
    _0x35e5d1 = 0x0,
    _0x42206c = 0x0,
    _0x502216 = '',
    _0xf72e2d = Promise['resolve']();
  const _0x286e6e = new WeakSet();
  let _0x5c948f = ![],
    _0x572870 = _0x21fa45['attention']?.['id'],
    _0x3923a4 = () => {},
    _0x13f860 = () => {},
    _0x540798 = { selected: [] };
  const _0x2149a4 = [],
    _0xf316ee = [],
    _0x5cf612 = new Map(),
    _0xd197a6 = new Set(),
    _0x6b7c55 = createCollaborationConflicts(),
    _0x17ec17 = () =>
      _0xd197a6['size'] > 0x0 ||
      [..._0x5cf612]['some'](([_0x44f1cc, _0x139c56]) => {
        const _0x2fe860 = _0x1be6b2['getStateRaw']()['nodes'][_0x44f1cc];
        return !_0x139c56['released'] || _0x2fe860?.['isGenerating'] || _0x2fe860?.['isLoading'];
      }),
    _0xc83269 = () => {
      ((_0x1e251e['conflicts'] = _0x6b7c55['list']()),
        (_0x1e251e['mediaNodes'] = _0x337259['states'](_0x1be6b2['getStateRaw']())));
      for (const _0x18d202 of _0x77184)
        if (!_0x1e251e['mediaNodes']['some']((_0x20b0df) => _0x20b0df['id'] === _0x18d202))
          _0x1e251e['mediaNodes']['push']({ id: _0x18d202, owned: !![] });
      if (!_0x2d37b7)
        onChange({
          ..._0x1e251e,
          pending: _0x219031 || _0x232bfb || !!_0xe7ef3b || _0xd197a6['size'] > 0x0,
          executing: _0x5cf612['size'] > 0x0 || _0xd197a6['size'] > 0x0,
        });
    },
    _0x3fbf5a = (_0x5deed7) =>
      _0x4d7a9d['rpc'](
        { ..._0x5deed7, roomId: _0x21fa45['roomId'], clientId: _0xe6810 },
        _0xd4433b['signal'],
      ),
    _0x1ab936 = { roomId: _0x21fa45['roomId'], clientId: _0xe6810 },
    _0x337259 = createCollaborationMediaQueue({
      uploadMedia:
        _0x4d7a9d['uploadMedia'] &&
        ((_0x185cea, _0x5a54ec) =>
          _0x4d7a9d['uploadMedia'](_0x185cea, _0x1ab936, _0xd4433b['signal'], _0x5a54ec)),
      imagePreviews: _0x4d7a9d['imagePreviews'],
      registerMedia:
        _0x4d7a9d['registerMedia'] &&
        ((_0x43a7fd) => _0x4d7a9d['registerMedia'](_0x43a7fd, _0x1ab936, _0xd4433b['signal'])),
      bindMedia:
        _0x4d7a9d['bindMedia'] &&
        ((_0x295db9) => _0x4d7a9d['bindMedia'](_0x295db9, _0x1ab936, _0xd4433b['signal'])),
      ...mediaOptions,
      rpc: _0x3fbf5a,
      signal: _0xd4433b['signal'],
      readGraph: () => _0x1be6b2['getStateRaw'](),
      onChange() {
        if (_0x6def90()) {
          (_0x42206c++, (_0x232bfb = !![]), _0x1908c7());
          if (!_0x3520bd)
            _0x3520bd = setTimeout(() => {
              _0x3520bd = null;
              if (_0x6def90()) _0x11bfa9();
            }, 0x64);
        }
      },
      onPreview(_0x15b15d, _0x1ab72c, _0x192b0a) {
        const _0x185321 = _0x1be6b2['getStateRaw']()['nodes'][_0x15b15d];
        if (
          !_0x6def90() ||
          !_0x185321 ||
          ['src', 'localPath', 'originalLocalPath']['some'](
            (_0x4c4640) => _0x185321[_0x4c4640] !== _0x1ab72c[_0x4c4640],
          )
        )
          return;
        const _0x4214a6 = Object['fromEntries'](
          Object['entries'](_0x192b0a)['filter'](
            ([_0x488c78]) => _0x185321[_0x488c78] === _0x1ab72c[_0x488c78],
          ),
        );
        if (Object['keys'](_0x4214a6)['length'])
          _0x1be6b2['withGraphMutationBypass'](() => _0x1be6b2['updateNodeData'](_0x15b15d, _0x4214a6));
      },
    }),
    _0x6def90 = () => !_0x2d37b7 && _0x1851b3() === _0x110093,
    _0x507fdb = () =>
      _0x77184['size'] > 0x0 ||
      _0x337259['states'](_0x1be6b2['getStateRaw']())['some']((_0x50b3f2) => hosting || _0x50b3f2['owned']),
    _0x24cf08 = () => {
      if (!_0x6def90()) throw new DOMException('Aborted', 'AbortError');
    },
    _0x885910 = createCollaborationReviewState({
      rpc: _0x3fbf5a,
      current: _0x6def90,
      initialRevision: _0x21fa45['reviewRevision'],
      onComment: onComment,
      onChange(_0x27f56c) {
        ((_0x1e251e['review'] = _0x27f56c), _0xc83269());
      },
    }),
    _0xb81c3 = () => _0x337259['project'](_0x1be6b2['getStateRaw']()),
    _0xe0fbd6 = (_0x4aa9fd) =>
      JSON['stringify'](_0x337259['resolveWire'](_0x4aa9fd['before'])) ===
      JSON['stringify'](_0x4aa9fd['after']),
    _0x15b0af = (_0x21baa3) => {
      const _0x1c158b = _0x1e251e['locks']?.[_0x21baa3],
        _0x4ab896 = _0x1e251e['jobs']?.['find'](
          (_0x3872d1) => _0x3872d1['node'] === _0x21baa3 && _0x3872d1['status'] === 'running',
        );
      return (
        (_0x1c158b &&
          _0x1c158b['expiresAt'] * 0x3e8 > Date['now']() &&
          (_0x1c158b['clientId'] !== _0xe6810 || _0x1c158b['actorId'] !== _0x4b82f3)) ||
        (_0x4ab896 && (_0x4ab896['client'] !== _0xe6810 || _0x4ab896['actor'] !== _0x4b82f3))
      );
    },
    _0x57ae78 = createCollaborationEditing({
      rpc: _0x3fbf5a,
      flush: async () => {
        if (_0x55e51f) await _0x55e51f;
        if (_0x219031 || _0x232bfb || _0xe7ef3b) await _0x1b1796();
      },
      current: _0x6def90,
      canEdit: (_0x7949c2) =>
        _0x1e251e['presenceStatus'] !== 'offline' &&
        _0x307881({ name: 'interaction', args: [], nodeIds: _0x7949c2, removedNodeIds: [] }),
      async update(_0x2b3f06) {
        (Object['assign'](_0x1e251e, _0x2b3f06),
          _0x57ae78['refresh'](_0x2b3f06['locks']),
          onPresence(_0x2b3f06));
        if (_0x2b3f06['documentRevision'] > _0x1e251e['revision']) await _0x1b1796();
      },
      notify(_0x13a2e8) {
        ((_0x1e251e['message'] = _0x13a2e8), onNotice(_0x13a2e8), _0xc83269());
      },
      onChange() {
        ((_0x1e251e['editingPending'] = _0x57ae78['pending']()),
          (_0x540798['editing'] = _0x57ae78['presence']()),
          _0xa0ec68?.['changed'](),
          onPresence(_0x1e251e));
      },
    });
  function _0x56debe() {
    (clearTimeout(_0x5a0f09), (_0x5a0f09 = null));
    if (!_0x3c6d8d || !_0x5c948f || _0x528df0) return Promise['resolve']();
    const _0x4eadf6 = JSON['stringify']([
      _0x35e5d1,
      _0x42206c,
      _0x1e251e['revision'],
      _0xe7ef3b?.['operationId'],
      _0x232bfb,
      _0x6b7c55['list'](),
    ]);
    if (_0x4eadf6 === _0x502216) return _0xf72e2d;
    _0x502216 = _0x4eadf6;
    if (!_0xe7ef3b && !_0x232bfb && !_0x6b7c55['list']()['length'] && !_0x337259['snapshot']()['length'])
      return (_0xf72e2d = journal['clear']()['catch'](() => {
        if (_0x502216 === _0x4eadf6) _0x502216 = '';
      }));
    const _0x589514 = _0xb81c3();
    return (_0xf72e2d = journal['write']({
      packet: _0xe7ef3b,
      base: _0x3c6d8d,
      draft: _0x589514,
      media: _0x337259['snapshot'](),
      conflicts: _0x6b7c55['list']()['map']((_0x57fc02) => ({
        ..._0x57fc02,
        before: _0x82a4dc[_0x57fc02['kind']][_0x57fc02['id']] ?? null,
        after: _0x589514[_0x57fc02['kind']][_0x57fc02['id']] ?? null,
      })),
    })['catch'](() => {
      if (_0x502216 === _0x4eadf6) _0x502216 = '';
      ((_0x1e251e['recoveryError'] = '本机恢复记录写入失败，请保持画布开启直到同步完成'), _0xc83269());
    }));
  }
  function _0x1908c7() {
    if (!_0x5a0f09)
      _0x5a0f09 = setTimeout(() => {
        void _0x56debe();
      }, 0x64);
  }
  const _0xa0ec68 =
      typeof _0x4d7a9d['presence'] === 'function'
        ? createCollaborationPresenceChannel({
            changeDriven: typeof _0x4d7a9d['events'] === 'function',
            send: (_0x2dd68c) =>
              _0x4d7a9d['presence']({ ..._0x1ab936, presence: _0x2dd68c }, _0xd4433b['signal']),
            read: () => _0x540798,
            signal: _0xd4433b['signal'],
            onUpdate(_0x338821) {
              _0x6def90() &&
                (Object['assign'](_0x1e251e, _0x338821),
                _0x57ae78['refresh'](_0x338821['locks']),
                onPresence(_0x338821));
            },
            onError(_0xcec3f5) {
              _0x6def90() &&
                ((_0x1e251e['presenceStatus'] = 'offline'),
                (_0x1e251e['latencyMs'] = null),
                onPresence({ presenceStatus: 'offline', latencyMs: null }),
                PERMANENT_ERRORS['has'](_0xcec3f5['code']) && (_0xa0ec68['stop'](), _0x46d3da(_0xcec3f5)));
            },
          })
        : null,
    _0x2cf4d8 =
      typeof _0x4d7a9d['events'] === 'function'
        ? createCollaborationChangeFeed({
            read: (_0x27c93d) =>
              _0x4d7a9d['events']({ ..._0x1ab936, cursor: _0x27c93d }, _0xd4433b['signal']),
            signal: _0xd4433b['signal'],
            onChange(_0x236157, _0x1d8935) {
              if (!_0x6def90()) return;
              const _0x575194 = { presence: _0x236157['presence'], locks: _0x236157['locks'] };
              if (Number['isInteger'](_0x236157['reviewRevision']))
                void _0x885910['refresh'](_0x236157['reviewRevision']);
              if (
                _0x236157['attention']?.['id'] &&
                _0x236157['attention']['id'] !== _0x572870 &&
                _0x236157['attention']['actorId'] !== _0x4b82f3 &&
                _0x236157['attention']['expiresAt'] * 0x3e8 > Date['now']()
              ) {
                _0x572870 = _0x236157['attention']['id'];
                const _0x164efa = readHostAttention();
                if (_0x164efa) _0x1e251e['locateView'] = _0x236157['attention']['view'];
                onAttention(_0x164efa);
              }
              (Object['assign'](_0x1e251e, _0x575194),
                _0x57ae78['refresh'](_0x575194['locks']),
                onPresence(_0x575194));
              if (_0x1d8935) _0x11bfa9();
            },
            onError(_0x161d0e) {
              PERMANENT_ERRORS['has'](_0x161d0e['code']) && (_0x2cf4d8['stop'](), _0x46d3da(_0x161d0e));
            },
          })
        : null;
  let _0xef6d7a = ![];
  function _0x11bfa9() {
    _0xef6d7a = !![];
    if (!_0x55e51f)
      queueMicrotask(() => {
        _0x6def90() && _0xef6d7a && ((_0xef6d7a = ![]), void _0x563fc7());
      });
  }
  function _0x46d3da(_0x2c0397) {
    if (!_0x6def90()) return;
    ((_0x1e251e['status'] = PERMANENT_ERRORS['has'](_0x2c0397['code']) ? 'blocked' : 'offline'),
      (_0x1e251e['message'] = _0x2c0397['message'] || '连接中断，正在重连；未同步修改保留在本机'),
      (_0x1e251e['errorCode'] = _0x2c0397['code'] || 'NETWORK_ERROR'),
      _0xc83269());
  }
  async function _0x29e620(_0x12e617, _0x3c2457 = graphChanges(_0x82a4dc, _0x12e617)) {
    _0x3c2457 = _0x6b7c55['reconcile'](_0x3c2457, graphChanges(_0x3c6d8d, _0xb81c3()), _0xb81c3());
    if (!_0x3c2457['length']) return;
    const _0x56a965 = cloneGraph(_0x1be6b2['getStateRaw']()),
      _0x23a3f6 = _0xb81c3(),
      _0x46ed76 = new Set(
        graphChanges(_0x3c6d8d, _0x23a3f6)['map']((_0xd4d206) => _0xd4d206['kind'] + ':' + _0xd4d206['id']),
      ),
      _0x295565 = _0x3c2457['map']((_0x46af16) => ({
        ..._0x46af16,
        after: _0x46ed76['has'](_0x46af16['kind'] + ':' + _0x46af16['id'])
          ? mergeCollaborationFields(
              _0x46af16['before'],
              _0x46af16['after'],
              _0x23a3f6[_0x46af16['kind']][_0x46af16['id']] ?? null,
            )
          : _0x46af16['after'],
      })),
      _0x203399 = await _0x337259['materialize']({
        nodes: Object['fromEntries'](
          _0x295565['filter']((_0x49bea5) => _0x49bea5['kind'] === 'nodes' && _0x49bea5['after'])['map'](
            (_0x517f27) => [_0x517f27['id'], _0x517f27['after']],
          ),
        ),
        edges: _0x12e617['edges'],
      });
    _0x24cf08();
    const _0x63b7ba = graphChanges(_0x337259['project'](_0x56a965), _0xb81c3());
    _0x3c2457 = _0x6b7c55['reconcile'](_0x3c2457, _0x63b7ba, _0xb81c3());
    const _0xa0b7f5 = graphChanges(_0x3c6d8d, _0xb81c3()),
      _0x1a030c = new Set(
        _0x3c2457['filter']((_0xa50e25) => _0xa50e25['kind'] === 'nodes')['map'](
          (_0x37d179) => _0x37d179['id'],
        ),
      );
    _0x1be6b2['withGraphMutationBypass'](() =>
      _0x1be6b2['batch'](() => {
        const _0x14feff = _0x3c2457['filter'](
          (_0x65eba4) => _0x65eba4['kind'] === 'nodes' && !_0x65eba4['after'],
        )['map']((_0x5b1387) => _0x5b1387['id']);
        if (_0x14feff['length']) _0x1be6b2['deleteNodes'](_0x14feff);
        for (const [_0x30521a, _0x5cf2b8] of Object['entries'](_0x203399['nodes'])) {
          if (!_0x1a030c['has'](_0x30521a)) continue;
          const _0x41cf2c = _0x1be6b2['getStateRaw']()['nodes'][_0x30521a];
          if (!_0x41cf2c) _0x1be6b2['addNode'](_0x5cf2b8);
          const _0x5addac = sharedValue(_0x56a965['nodes'][_0x30521a] ?? null),
            _0x5332a4 = mergeCollaborationFields(_0x5addac, _0x5cf2b8, sharedValue(_0x41cf2c ?? null)),
            _0x346d04 = mergeSharedNode(_0x41cf2c, _0x5332a4);
          delete _0x346d04['_collaborationPendingMedia'];
          if (_0x5cf2b8['_collaborationPendingMedia'])
            _0x346d04['_collaborationPendingMedia'] = _0x5cf2b8['_collaborationPendingMedia'];
          _0x1be6b2['updateNodeData'](_0x30521a, _0x346d04, { replace: !![] });
        }
        const _0x2a3ed4 = _0x3c2457['filter']((_0x385fb2) => _0x385fb2['kind'] === 'edges');
        if (_0x2a3ed4['length'] || _0x14feff['length'])
          _0x1be6b2['updateEdgesBatch'](
            _0x2a3ed4['map']((_0x40cc5a) => _0x40cc5a['id']),
            _0x2a3ed4['filter']((_0x4abe43) => _0x4abe43['after'])['map']((_0x28dc71) => _0x28dc71['after']),
          );
      }),
    );
    const _0x62ecf4 = _0xb81c3();
    for (const _0x27f1f4 of _0x3c2457) {
      const _0x3656af = _0xa0b7f5['find'](
          (_0x1b894f) => _0x1b894f['kind'] === _0x27f1f4['kind'] && _0x1b894f['id'] === _0x27f1f4['id'],
        ),
        _0x16cdc6 = _0x3656af
          ? mergeCollaborationFields(
              _0x3656af['after'],
              _0x3656af['before'],
              _0x62ecf4[_0x27f1f4['kind']][_0x27f1f4['id']] ?? null,
            )
          : _0x62ecf4[_0x27f1f4['kind']][_0x27f1f4['id']];
      if (_0x16cdc6) _0x3c6d8d[_0x27f1f4['kind']][_0x27f1f4['id']] = _0x16cdc6;
      else delete _0x3c6d8d[_0x27f1f4['kind']][_0x27f1f4['id']];
    }
    _0x337259['prepare'](_0x1be6b2['getStateRaw']());
  }
  async function _0x2041dc() {
    if (!_0x232bfb || _0xe7ef3b) return;
    _0x232bfb = ![];
    const _0x457f16 = _0x337259['prepare'](_0x1be6b2['getStateRaw']());
    (_0x24cf08(), _0x77184['clear']());
    const _0x347651 = graphChanges(_0x3c6d8d, _0x457f16)['filter']((_0x260d74) => {
      if (_0x6b7c55['has'](_0x260d74)) return ![];
      if (_0x260d74['kind'] === 'nodes' && _0xe0fbd6(_0x260d74) && _0x15b0af(_0x260d74['id']))
        return (_0x77184['add'](_0x260d74['id']), ![]);
      return !![];
    });
    _0x347651['length'] &&
      ((_0xe7ef3b = {
        operationId: crypto['randomUUID'](),
        changes: _0x347651['map']((_0x2bfd6a) => ({
          ..._0x2bfd6a,
          before: _0x82a4dc[_0x2bfd6a['kind']][_0x2bfd6a['id']] ?? null,
        })),
      }),
      (_0x3c6d8d = applyGraphChanges(_0x3c6d8d, _0x347651)));
  }
  async function _0x159a1c() {
    if (!_0x6def90() || _0x1e251e['status'] === 'blocked') return;
    try {
      if (_0x219031) {
        if (_0x2322b3) _0x337259['prepare'](cloneGraph(_0x1be6b2['getStateRaw']()));
        const _0xbd370b = graphChanges(_0x3c6d8d, _0x82a4dc),
          _0x57243c = new Set(
            _0xbd370b['filter']((_0x47241e) => _0x47241e['kind'] === 'nodes')['map'](
              (_0x5ec638) => _0x5ec638['id'],
            ),
          );
        if (_0x2322b3 && !hosting)
          for (const [_0x52da89, _0x3bad3e] of Object['entries'](_0x82a4dc['nodes'])) {
            if (JSON['stringify'](_0x3bad3e)['includes']('aic-asset:') && !_0x57243c['has'](_0x52da89))
              _0xbd370b['push']({ kind: 'nodes', id: _0x52da89, before: _0x3bad3e, after: _0x3bad3e });
          }
        await _0x29e620(_0x82a4dc, _0xbd370b);
        if (!_0x2322b3) _0x3c6d8d = _0xb81c3();
        else _0x232bfb = !![];
        ((_0x2322b3 = ![]), (_0x219031 = ![]));
      }
      if (_0x528df0) {
        const _0x5db07f = _0x528df0,
          _0x21fc14 = applyGraphChanges(
            applyGraphChanges(_0x82a4dc, _0x5db07f['packet']?.['changes'] || []),
            _0x5db07f['conflicts'] || [],
          );
        await _0x29e620(_0x21fc14);
        const _0x1f2d54 = _0xb81c3(),
          _0x1a5fa4 = graphChanges(_0x5db07f['base'], _0x5db07f['draft']),
          _0x4c42e8 = applyGraphChanges(_0x21fc14, _0x1a5fa4);
        (await _0x29e620(_0x4c42e8, graphChanges(_0x21fc14, _0x4c42e8)),
          (_0x3c6d8d = _0x1f2d54),
          (_0xe7ef3b = _0x5db07f['packet'] || null),
          (_0x232bfb = _0x1a5fa4['length'] > 0x0),
          _0x6b7c55['hold'](_0x5db07f['conflicts'] || []),
          (_0x528df0 = null));
      }
      if (_0x77184['size']) _0x232bfb = !![];
      (await _0x2041dc(), _0x24cf08());
      if (_0xe7ef3b) {
        const _0x4992b4 = _0xe7ef3b;
        ((_0x1e251e['message'] = '正在同步修改'), _0xc83269());
        let _0x40675d;
        await _0x56debe();
        try {
          _0x40675d = await _0x3fbf5a({
            action: 'apply',
            operationId: _0x4992b4['operationId'],
            changes: _0x4992b4['changes'],
          });
        } catch (_0xe768f0) {
          if (!['EDIT_CONFLICT', 'NODE_BUSY', 'TASK_BUSY']['includes'](_0xe768f0['code'])) throw _0xe768f0;
          const _0x48e018 = await _0x3fbf5a({ action: 'sync', revision: -0x1 }),
            _0x504f9b =
              _0x4992b4['historyMode'] || !_0x48e018['document']
                ? { blocked: _0x4992b4['changes'], safe: [] }
                : partitionCollaborationConflict(_0x4992b4['changes'], _0x48e018, _0x4b82f3, _0xe6810);
          (['NODE_BUSY', 'TASK_BUSY']['includes'](_0xe768f0['code']) &&
            !_0x4992b4['historyMode'] &&
            (_0x504f9b['blocked'] = _0x504f9b['blocked']['filter']((_0x340e8a) => {
              if (!_0xe0fbd6(_0x340e8a)) return !![];
              return (
                _0x77184['add'](_0x340e8a['id']),
                (_0x3c6d8d[_0x340e8a['kind']][_0x340e8a['id']] = _0x340e8a['before']),
                ![]
              );
            })),
            _0x6b7c55['hold'](_0x504f9b['blocked']),
            (_0xe7ef3b = _0x504f9b['safe']['length']
              ? { operationId: crypto['randomUUID'](), changes: _0x504f9b['safe'] }
              : null),
            (_0x1e251e['message'] = '部分节点需要处理冲突，其他节点可继续协作'));
        }
        _0x24cf08();
        if (_0x40675d) {
          const _0x2eef95 = _0x40675d['changes'] || _0x4992b4['changes'];
          if (!_0x2eef95['length'] && _0x4992b4['changes']['length']) _0x1e251e['revision'] = -0x1;
          const _0x33df63 = applyGraphChanges(_0x82a4dc, _0x2eef95);
          if (_0x4992b4['historyMode']) {
            await _0x29e620(_0x33df63, _0x2eef95);
            const _0x46c901 = _0x4992b4['historyMode'] === 'undo' ? _0x2149a4 : _0xf316ee;
            (_0x46c901['pop'](),
              (_0x4992b4['historyMode'] === 'undo' ? _0xf316ee : _0x2149a4)['push'](_0x4992b4['original']));
          } else {
            const _0x4a88b4 = new Map(
                _0x4992b4['changes']['map']((_0x592988) => [
                  _0x592988['kind'] + ':' + _0x592988['id'],
                  _0x592988,
                ]),
              ),
              _0x360e4c = _0x2eef95['filter'](
                (_0x197962) =>
                  JSON['stringify'](_0x197962['after']) !==
                  JSON['stringify'](_0x4a88b4['get'](_0x197962['kind'] + ':' + _0x197962['id'])?.['after']),
              );
            await _0x29e620(
              _0x33df63,
              _0x360e4c['map']((_0x58994c) => ({
                ..._0x58994c,
                before: _0x4a88b4['has'](_0x58994c['kind'] + ':' + _0x58994c['id'])
                  ? _0x4a88b4['get'](_0x58994c['kind'] + ':' + _0x58994c['id'])['after']
                  : _0x58994c['before'],
              })),
            );
            const _0x65b9d9 = _0x2eef95['filter']((_0x14a8a3) => !_0xe0fbd6(_0x14a8a3));
            _0x65b9d9['length'] && (_0x2149a4['push'](_0x65b9d9), (_0xf316ee['length'] = 0x0));
            if (_0x2149a4['length'] > 0x32) _0x2149a4['shift']();
          }
          ((_0x82a4dc = _0x33df63), (_0xe7ef3b = null));
        }
      }
      const _0x3ef2b4 = await _0x3fbf5a({
        action: 'sync',
        revision: _0x1e251e['revision'],
        ...(_0xa0ec68 ? {} : { presence: _0x540798 }),
      });
      _0x24cf08();
      if (
        _0x3ef2b4['roomId'] !== _0x21fa45['roomId'] ||
        !Number['isInteger'](_0x3ef2b4['revision']) ||
        !Array['isArray'](_0x3ef2b4['members'])
      )
        throw new Error('协作服务响应无效');
      const _0x593553 = (_0x3ef2b4['operations'] || [])['flatMap']((_0x488563) => _0x488563['changes']),
        _0x5df14d = _0x593553['length']
          ? applyGraphChanges(_0x3ef2b4['document'] || _0x82a4dc, _0x593553)
          : _0x3ef2b4['document'] || _0x82a4dc,
        _0x4f749c = _0x5df14d === _0x82a4dc ? [] : graphChanges(_0x82a4dc, _0x5df14d);
      _0x4f749c['length'] && (await _0x29e620(_0x5df14d, _0x4f749c), (_0x82a4dc = cloneGraph(_0x5df14d)));
      _0xa0ec68 &&
        _0x1e251e['presenceStatus'] === 'online' &&
        (delete _0x3ef2b4['presence'], delete _0x3ef2b4['locks']);
      (Object['assign'](_0x1e251e, _0x3ef2b4, {
        status: 'online',
        message: _0x6b7c55['list']()['length']
          ? '部分节点有冲突，其他节点可继续协作'
          : '房主已接收修改 · 项目文件由房主保存',
        errorCode: '',
      }),
        _0x57ae78['refresh'](_0x3ef2b4['locks']),
        delete _0x1e251e['document'],
        delete _0x1e251e['operations']);
      if (Number['isInteger'](_0x3ef2b4['reviewRevision']))
        void _0x885910['refresh'](_0x3ef2b4['reviewRevision']);
      for (const [_0x3051d9, _0x2cfa52] of _0x5cf612) {
        const _0x1d5a0f = _0x1be6b2['getStateRaw']()['nodes'][_0x3051d9];
        if (
          _0x2cfa52['released'] &&
          !_0x1d5a0f?.['isGenerating'] &&
          !_0x1d5a0f?.['isLoading'] &&
          !_0x232bfb &&
          !_0xe7ef3b &&
          !_0x337259['states'](_0x1be6b2['getStateRaw']())['some'](
            (_0x57df16) => _0x57df16['id'] === _0x3051d9,
          )
        ) {
          if (
            !_0x2cfa52['uncertain'] ||
            _0x1e251e['jobs']['some'](
              (_0x46b9a0) =>
                _0x46b9a0['node'] === _0x3051d9 &&
                _0x46b9a0['id'] === _0x2cfa52['taskId'] &&
                _0x46b9a0['actor'] === _0x4b82f3 &&
                _0x46b9a0['client'] === _0xe6810 &&
                _0x46b9a0['status'] === 'running',
            )
          )
            await _0x3fbf5a({ action: 'finishTask', nodeId: _0x3051d9, taskId: _0x2cfa52['taskId'] });
          _0x5cf612['delete'](_0x3051d9);
        }
      }
      (_0xc83269(), await _0x56debe());
      if (!_0x232bfb && !_0xe7ef3b && !_0x6b7c55['list']()['length'] && _0x254d76 !== _0x1e251e['revision'])
        try {
          (await onConfirmed(_0x82a4dc, _0x337259['snapshotBindings'](_0x1be6b2['getStateRaw']())),
            (_0x254d76 = _0x1e251e['revision']));
        } catch {
          ((_0x1e251e['recoveryError'] = '无法保存本机协作基线，请保持画布开启并重试'), _0xc83269());
        }
    } catch (_0x193c11) {
      _0x46d3da(_0x193c11);
    }
  }
  function _0x563fc7() {
    if (!_0x55e51f)
      _0x55e51f = _0x159a1c()['finally'](() => {
        _0x55e51f = null;
        if (_0xef6d7a) _0x11bfa9();
      });
    return _0x55e51f;
  }
  async function _0x1b1796(_0x2ffa6c = () => !![]) {
    await _0x563fc7();
    while (_0x2ffa6c() && _0x6def90() && _0x1e251e['status'] === 'online' && (_0x232bfb || _0xe7ef3b))
      await _0x563fc7();
  }
  function _0x6e0fe2() {
    if (_0x2d37b7) return;
    _0x33cdc9 = setTimeout(
      async () => {
        (await _0x563fc7(), _0x6e0fe2());
      },
      _0x1e251e['status'] === 'offline' ? 0xbb8 : _0x2cf4d8 ? 0x2710 : 0x1f4,
    );
  }
  function _0xc91cc() {
    (clearTimeout(_0x3520bd), (_0x3520bd = null));
    if (_0x2d37b7) return _0x40ebd4;
    return (
      (_0x2d37b7 = !![]),
      clearTimeout(_0x33cdc9),
      _0xa0ec68?.['stop'](),
      _0x2cf4d8?.['stop'](),
      _0xd4433b['abort'](),
      void _0x56debe()['finally'](() => journal['close']()),
      _0x3923a4(),
      _0x13f860(),
      _0x337259['dispose'](),
      _0x57ae78['dispose'](),
      (_0x40ebd4 = (
        hosting && _0x4d7a9d['disconnect']
          ? _0x4d7a9d['disconnect']()
          : _0x4d7a9d['rpc']({ action: 'disconnect', roomId: _0x21fa45['roomId'], clientId: _0xe6810 })
      )['catch'](() => {})),
      _0x40ebd4
    );
  }
  function _0x307881({ name: _0x3ddc67, args: _0x1c1fd2, nodeIds: _0x431b7c, removedNodeIds: _0x4a3a80 }) {
    if (!_0x6def90()) return ![];
    if (
      _0x3ddc67 === 'updateNodeData' &&
      _0x1c1fd2[0x2]?.['replace'] !== !![] &&
      _0x1c1fd2[0x1] &&
      Object['keys'](sharedValue(_0x1c1fd2[0x1]))['length'] === 0x0
    )
      return !![];
    if (_0xe7ef3b?.['historyMode']) return ![];
    const _0x3aa365 = _0x3ddc67 === 'updateNodeData' && _0x5cf612['has'](_0x1c1fd2[0x0]);
    if (_0x1e251e['status'] !== 'online' && !_0x3aa365) return ![];
    if (_0x1e251e['role'] === 'viewer') return ![];
    if (_0x6b7c55['blocks'](_0x431b7c, _0x1be6b2['getStateRaw']())) return ![];
    return _0x431b7c['every']((_0x2eda8a) => {
      if (_0xd197a6['has'](_0x2eda8a)) return ![];
      const _0x18ffb8 = _0x1e251e['locks']?.[_0x2eda8a],
        _0x2e5e5f = _0x1e251e['jobs']?.['find'](
          (_0x7749b9) => _0x7749b9['node'] === _0x2eda8a && _0x7749b9['status'] === 'running',
        );
      if (_0x4a3a80['includes'](_0x2eda8a) && (_0x5cf612['has'](_0x2eda8a) || _0x2e5e5f)) return ![];
      return (
        (!_0x18ffb8 ||
          (_0x18ffb8['clientId'] === _0xe6810 && _0x18ffb8['actorId'] === _0x4b82f3) ||
          _0x18ffb8['expiresAt'] * 0x3e8 <= Date['now']()) &&
        (!_0x2e5e5f || (_0x2e5e5f['client'] === _0xe6810 && _0x2e5e5f['actor'] === _0x4b82f3))
      );
    });
  }
  async function _0x5a845f(_0x263359) {
    await _0x563fc7();
    if (_0x1e251e['status'] !== 'online' || _0x232bfb || _0xe7ef3b || _0x5cf612['size'] || _0xd197a6['size'])
      return;
    const _0x561e71 = _0x263359 === 'undo' ? _0x2149a4 : _0xf316ee,
      _0x1b387b = _0x337259['resolveWire'](_0x561e71['at'](-0x1));
    if (!_0x1b387b) return;
    const _0x4ebe6b = _0x263359 === 'undo' ? invertChanges(_0x1b387b) : _0x1b387b;
    try {
      for (const _0xf7127 of _0x4ebe6b)
        mergeCollaborationFields(
          _0xf7127['before'],
          _0xf7127['after'],
          _0x82a4dc[_0xf7127['kind']][_0xf7127['id']] ?? null,
        );
    } catch {
      ((_0x1e251e['message'] = '目标已被其他成员修改，不能撤销或重做这一步'), _0xc83269());
      return;
    }
    ((_0xe7ef3b = {
      operationId: crypto['randomUUID'](),
      changes: _0x4ebe6b,
      historyMode: _0x263359,
      original: _0x1b387b,
    }),
      await _0x563fc7());
  }
  const _0x791b0a = {
    state: _0x1e251e,
    async start({
      publish: publish = ![],
      hostBase: hostBase = null,
      mediaBindings: mediaBindings = [],
    } = {}) {
      try {
        const _0x15cabe = await journal['read']();
        ((_0x5c948f = !![]), _0x337259['restore'](_0x15cabe?.['media']));
        if (
          _0x15cabe?.['schema'] === 0x1 &&
          _0x15cabe['base']?.['nodes'] &&
          _0x15cabe['draft']?.['nodes'] &&
          (_0x15cabe['packet'] ||
            _0x15cabe['conflicts']?.['length'] ||
            graphChanges(_0x15cabe['base'], _0x15cabe['draft'])['length'])
        )
          _0x528df0 = _0x15cabe;
      } catch {
        _0x1e251e['recoveryError'] = '无法读取本机协作恢复记录';
      }
      (_0x337259['restoreBindings'](mediaBindings),
        (_0x3c6d8d = _0x337259['project'](_0x1be6b2['getStateRaw']())),
        (_0x3923a4 = _0x1be6b2['setGraphMutationPolicy']({
          beginInteraction: (_0x4aa5c5) => _0x57ae78['begin'](_0x4aa5c5),
          async beforeWorkspaceTransition() {
            await _0x563fc7();
            if (!_0x791b0a['canDetach']())
              return ((_0x1e251e['message'] = '请先完成同步和生成任务，再切换画布'), _0xc83269(), ![]);
            return (await _0x791b0a['detach'](), !![]);
          },
          before(_0x2bec91) {
            if (!_0x307881(_0x2bec91)) return ![];
            const { name: _0x338989, args: _0x1bb485 } = _0x2bec91,
              _0x355edf =
                _0x338989 === 'updateNodeData' && !_0x1bb485[0x2]?.['replace']
                  ? { [_0x1bb485[0x0]]: _0x1bb485[0x1] }
                  : _0x338989 === 'updateNodesData'
                    ? _0x1bb485[0x0]
                    : null;
            if (
              _0x355edf &&
              Object['entries'](_0x355edf)['every'](
                ([_0x23e8f3, _0x2d8830]) =>
                  _0x2d8830 &&
                  !_0x1be6b2['getStateRaw']()['nodes'][_0x23e8f3]?.['_collaborationPendingMedia']?.['some'](
                    (_0x49e97a) => Object['hasOwn'](_0x2d8830, _0x49e97a['path'][0x0]),
                  ) &&
                  Object['entries'](sharedValue(_0x2d8830))['every'](
                    ([_0xd58832, _0x2bf9c1]) =>
                      JSON['stringify'](_0x2bf9c1) ===
                      JSON['stringify'](
                        sharedValue(_0x1be6b2['getStateRaw']()['nodes'][_0x23e8f3]?.[_0xd58832], _0xd58832),
                      ),
                  ),
              )
            )
              _0x286e6e['add'](_0x2bec91);
            return !![];
          },
          after(_0x269ea6) {
            if (_0x286e6e['delete'](_0x269ea6)) {
              if (_0x269ea6['nodeIds']['some']((_0x24e482) => _0x5cf612['get'](_0x24e482)?.['released']))
                _0x11bfa9();
              return;
            }
            (_0x35e5d1++,
              _0x337259['afterEdit'](_0x269ea6, _0x1be6b2['getStateRaw'](), (_0x54b9b5, _0x325cbe) =>
                _0x1be6b2['withGraphMutationBypass'](() =>
                  _0x1be6b2['updateNodeData'](_0x54b9b5, { _collaborationPendingMedia: _0x325cbe }),
                ),
              ),
              (_0x232bfb = !![]),
              _0xc83269(),
              _0x1908c7());
            if (_0x2cf4d8) _0x11bfa9();
          },
          beforeReplace() {
            if (!_0x791b0a['canDetach']()) return ![];
            return (_0x791b0a['detach'](), !![]);
          },
          history: {
            commit() {
              return (
                _0x35e5d1++,
                (_0x232bfb = !![]),
                _0xc83269(),
                _0x1908c7(),
                { id: 'collaboration-pending' }
              );
            },
            undo: () => {
              void _0x5a845f('undo');
            },
            redo: () => {
              void _0x5a845f('redo');
            },
            getHistoryInfo: () => ({ undoCount: _0x2149a4['length'] + 0x1, redoCount: _0xf316ee['length'] }),
          },
        })));
      const _0x288cd5 = {
          async acquire(_0x1beb57, _0x31e50f = {}) {
            if (_0x1e251e['status'] !== 'online' || _0x1e251e['role'] === 'viewer')
              throw new Error('当前协作画布不能发起生成');
            const _0xc11c3 = _0x1beb57['targetNodeId'] || _0x1beb57['sourceNodeId'];
            if (_0xd197a6['has'](_0xc11c3) || (_0x5cf612['has'](_0xc11c3) && !_0x31e50f['recovering']))
              throw new Error('该节点正在请求或执行生成，请等待结束');
            (_0xd197a6['add'](_0xc11c3), _0xc83269());
            let _0xf75119,
              _0xef08b2 = ![];
            try {
              ((_0x232bfb = !![]), await _0x1b1796(), _0x24cf08());
              if (_0x232bfb || _0xe7ef3b || _0x1e251e['status'] !== 'online')
                throw new Error('请先完成画布同步');
              const _0x1c8871 = new Set([_0xc11c3]);
              for (let _0x361382 = -0x1; _0x361382 !== _0x1c8871['size'];) {
                _0x361382 = _0x1c8871['size'];
                for (const _0x41d7d6 of Object['values'](_0x1be6b2['getStateRaw']()['edges']))
                  if (_0x1c8871['has'](_0x41d7d6['targetId'])) _0x1c8871['add'](_0x41d7d6['sourceId']);
              }
              if (
                _0x337259['states'](_0x1be6b2['getStateRaw']())['some']((_0x5d6f1f) =>
                  _0x1c8871['has'](_0x5d6f1f['id']),
                )
              )
                throw new Error('此节点的素材尚未准备完成，请稍后重试');
              if (_0x31e50f['recovering']) {
                const _0x403486 = _0x1e251e['jobs']?.['find'](
                  (_0x2e9db4) => _0x2e9db4['node'] === _0xc11c3 && _0x2e9db4['status'] === 'running',
                );
                if (!_0x403486 || _0x403486['client'] !== _0xe6810 || _0x403486['actor'] !== _0x4b82f3)
                  throw new Error('只能恢复当前客户端拥有的协作生成任务');
                const _0x41ec8b = { taskId: _0x403486['id'], released: ![] };
                return (
                  _0x5cf612['set'](_0xc11c3, _0x41ec8b),
                  async () => {
                    ((_0x41ec8b['released'] = !![]), (_0x232bfb = !![]), await _0x563fc7());
                  }
                );
              }
              ((_0xf75119 = crypto['randomUUID']()),
                (_0xef08b2 = !![]),
                await _0x3fbf5a({ action: 'claimTask', nodeId: _0xc11c3, taskId: _0xf75119 }),
                _0x24cf08());
              const _0x29a0bd = { taskId: _0xf75119, released: ![] };
              return (
                _0x5cf612['set'](_0xc11c3, _0x29a0bd),
                _0xc83269(),
                async () => {
                  ((_0x29a0bd['released'] = !![]), (_0x232bfb = !![]), await _0x563fc7());
                }
              );
            } catch (_0x2a6160) {
              _0xef08b2 &&
                _0x6def90() &&
                !(_0x2a6160['status'] >= 0x190 && _0x2a6160['status'] < 0x1f4) &&
                (_0x5cf612['set'](_0xc11c3, { taskId: _0xf75119, released: !![], uncertain: !![] }),
                (_0x232bfb = !![]),
                _0x46d3da(_0x2a6160));
              throw _0x2a6160;
            } finally {
              (_0xd197a6['delete'](_0xc11c3), _0xc83269());
            }
          },
        },
        _0x192705 = [setGenerationExecutionPolicy(_0x1be6b2, _0x288cd5)];
      if (_0x1be6b2['graphStore'])
        _0x192705['push'](setGenerationExecutionPolicy(_0x1be6b2['graphStore'], _0x288cd5));
      return (
        (_0x13f860 = () => _0x192705['forEach']((_0x3afeef) => _0x3afeef())),
        publish
          ? ((_0x3c6d8d = cloneGraph(_0x82a4dc)), (_0x232bfb = !![]))
          : (hostBase?.['nodes'] &&
              hostBase?.['edges'] &&
              ((_0x3c6d8d = cloneGraph(hostBase)), (_0x2322b3 = !![])),
            (_0x219031 = !![])),
        await _0x563fc7(),
        _0x6e0fe2(),
        _0xc83269(),
        void _0xa0ec68?.['start'](),
        void _0x2cf4d8?.['start'](),
        _0x791b0a
      );
    },
    setPresence(_0x489bf4) {
      ((_0x540798 = { ..._0x540798, ..._0x489bf4 }), _0xa0ec68?.['changed']());
    },
    beginEditing(_0x19723a) {
      return _0x57ae78['begin'](_0x19723a);
    },
    follow(_0x1eceef) {
      ((_0x1e251e['followActorId'] = _0x1eceef || ''), _0xc83269());
    },
    locate(_0x54566a) {
      ((_0x1e251e['locateActorId'] = _0x54566a || ''), (_0x1e251e['followActorId'] = ''), _0xc83269());
    },
    summon() {
      return _0x791b0a['command']('attention', { view: _0x540798['view'] });
    },
    retryMedia(_0x395003) {
      _0x337259['retry'](_0x395003, _0x1be6b2['getStateRaw']());
    },
    async resolveConflicts(_0x29db5b) {
      await _0x563fc7();
      if (_0xe7ef3b || _0x232bfb || _0x1e251e['status'] !== 'online')
        throw new Error('请先完成其他修改的同步');
      const _0x13d36d = _0x6b7c55['list'](),
        _0x2bfa9c = _0x13d36d['map']((_0x381492) => ({
          ..._0x381492,
          before: _0xb81c3()[_0x381492['kind']][_0x381492['id']] ?? null,
          after: _0x82a4dc[_0x381492['kind']][_0x381492['id']] ?? null,
        }));
      _0x6b7c55['clear']();
      if (_0x29db5b) {
        for (const _0x6dbf4d of _0x13d36d) {
          if (_0x82a4dc[_0x6dbf4d['kind']][_0x6dbf4d['id']])
            _0x3c6d8d[_0x6dbf4d['kind']][_0x6dbf4d['id']] = structuredClone(
              _0x82a4dc[_0x6dbf4d['kind']][_0x6dbf4d['id']],
            );
          else delete _0x3c6d8d[_0x6dbf4d['kind']][_0x6dbf4d['id']];
        }
        _0x232bfb = !![];
      } else await _0x29e620(_0x82a4dc, _0x2bfa9c);
      (await _0x563fc7(), _0xc83269());
    },
    async flush() {
      (await _0xa0ec68?.['flush'](), await _0x1b1796());
    },
    async prepareDetach({ signal: _0x1f97a7, timeoutMs: timeoutMs = 0x2710 } = {}) {
      const _0x1637b6 = () => new DOMException('Aborted', 'AbortError');
      if (_0x1f97a7?.['aborted']) throw _0x1637b6();
      if (_0x17ec17()) throw new Error('请等待当前生成任务结束后退出协作');
      if (_0x507fdb())
        throw new Error(
          '素材尚未同步完成，请等待完成；也可选择“结束本次联机 → 确定”，保留当前本机内容后退出',
        );
      if (_0x6b7c55['list']()['length'])
        throw new Error('存在未处理的冲突，请先处理；也可选择“结束本次联机 → 确定”，保留当前本机内容后退出');
      if (_0x791b0a['canDetach']()) return;
      let _0x942252 = !![],
        _0x38c525,
        _0x14e4c2;
      const _0x3c5fdc = new Promise((_0x15b0d9, _0x35fd01) => {
        ((_0x14e4c2 = () => {
          ((_0x942252 = ![]), _0x35fd01(_0x1637b6()));
        }),
          _0x1f97a7?.['addEventListener']('abort', _0x14e4c2, { once: !![] }),
          (_0x38c525 = setTimeout(() => {
            ((_0x942252 = ![]),
              _0x35fd01(
                new Error('同步等待超时，修改仍保留在当前画布；请重试，或选择“结束本次联机 → 确定”直接退出'),
              ));
          }, timeoutMs)));
      });
      try {
        await Promise['race']([_0x1b1796(() => _0x942252), _0x3c5fdc]);
      } finally {
        ((_0x942252 = ![]), clearTimeout(_0x38c525), _0x1f97a7?.['removeEventListener']('abort', _0x14e4c2));
      }
      if (_0x1f97a7?.['aborted']) throw _0x1637b6();
      _0x24cf08();
      if (!_0x791b0a['canDetach']())
        throw new Error('当前仍有未同步修改，请重试，或选择“结束本次联机 → 确定”保留当前本机内容后退出');
    },
    review: _0x885910,
    async command(_0x3a2a16, _0x3fc6e3 = {}) {
      if (['invite', 'renameSelf']['includes'](_0x3a2a16)) {
        _0x24cf08();
        const _0x50e662 = await _0x3fbf5a({ action: _0x3a2a16, ..._0x3fc6e3 });
        return (
          _0x24cf08(),
          _0x3a2a16 === 'renameSelf' &&
            ((_0x1e251e['members'] = _0x1e251e['members']['map']((_0x3ca7b7) =>
              _0x3ca7b7['id'] === _0x4b82f3 ? { ..._0x3ca7b7, name: _0x50e662['displayName'] } : _0x3ca7b7,
            )),
            (_0x1e251e['presence'] = _0x1e251e['presence']['map']((_0x66812) =>
              _0x66812['actorId'] === _0x4b82f3 ? { ..._0x66812, name: _0x50e662['displayName'] } : _0x66812,
            )),
            _0xc83269()),
          _0x50e662
        );
      }
      await _0x563fc7();
      if (_0xe7ef3b || _0x232bfb) throw new Error('请先完成同步，或保留画布草稿后退出');
      if (['leave', 'close']['includes'](_0x3a2a16) && _0x17ec17()) throw new Error('请先结束当前生成任务');
      if (['leave', 'close']['includes'](_0x3a2a16) && _0x507fdb())
        throw new Error('当前素材尚未同步，请等待完成或保留画布草稿后退出');
      const _0x573e52 = await _0x3fbf5a({ action: _0x3a2a16, ..._0x3fc6e3 });
      if (['leave', 'close']['includes'](_0x3a2a16)) await _0x791b0a['detach']();
      else await _0x563fc7();
      return _0x573e52;
    },
    canDetach() {
      return (
        !_0x219031 &&
        !_0x507fdb() &&
        !_0x232bfb &&
        !_0xe7ef3b &&
        !_0x5cf612['size'] &&
        !_0xd197a6['size'] &&
        !_0x6b7c55['list']()['length']
      );
    },
    detach({ force: force = ![] } = {}) {
      if (_0x17ec17()) throw new Error('请等待当前生成任务结束后退出协作');
      if (!force && (_0x507fdb() || _0xe7ef3b || _0x232bfb || _0x6b7c55['list']()['length']))
        throw new Error('当前有未同步素材、修改或冲突，请先保留画布草稿');
      if (_0x2d37b7) return _0x40ebd4;
      const _0x537a6d = _0xc91cc();
      return (onDetach(), _0x537a6d);
    },
    destroy: _0xc91cc,
  };
  return _0x791b0a;
}
