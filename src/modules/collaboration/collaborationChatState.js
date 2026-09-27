export function createCollaborationChatState({
  getSession: _0x1f1130,
  onChange: onChange = () => {},
  onMention: onMention = () => {},
}) {
  let _0x5e0763 = null,
    _0x5425fa = ![],
    _0x27bc80 = 0x0,
    _0x21a019 = ![],
    _0x5d8d4e = 0x0,
    _0x5f067b = null;
  const _0x6bba25 = new Map(),
    _0x519b84 = () => ({
      messages: [],
      body: '',
      nodeIds: [],
      mentions: [],
      loading: ![],
      sending: ![],
      error: '',
      unread: 0x0,
      mentioned: ![],
      hasMore: ![],
      revision: -0x1,
    });
  let _0x3ca8c0 = _0x519b84(),
    _0x4ef7fc = ![];
  const _0x4b697f = () => {
      if (!_0x5425fa) onChange(_0x3ca8c0);
    },
    _0x554ef5 = (_0xf504ec) =>
      _0xf504ec ? _0xf504ec['state']['roomId'] + ':' + _0xf504ec['state']['actorId'] : '';
  function _0x5c123c() {
    const _0x4a3057 = _0x1f1130();
    if (_0x4a3057 !== _0x5e0763) {
      if (_0x5e0763)
        _0x6bba25['set'](_0x554ef5(_0x5e0763), {
          body: _0x3ca8c0['body'],
          nodeIds: [..._0x3ca8c0['nodeIds']],
          mentions: [..._0x3ca8c0['mentions']],
          failed: _0x5f067b,
        });
      ((_0x5e0763 = _0x4a3057), _0x27bc80++, (_0x21a019 = ![]), (_0x5d8d4e = 0x0));
      const _0x2e5a94 = _0x6bba25['get'](_0x554ef5(_0x4a3057));
      ((_0x5f067b = _0x2e5a94?.['failed'] || null),
        (_0x3ca8c0 = {
          ..._0x519b84(),
          ...(_0x2e5a94 && {
            body: _0x2e5a94['body'],
            nodeIds: _0x2e5a94['nodeIds'],
            mentions: _0x2e5a94['mentions'],
          }),
        }),
        _0x4b697f());
    }
    if (!_0x5e0763 || _0x5425fa) return;
    _0x5d8d4e = Math['max'](_0x5d8d4e, _0x5e0763['state']['review']?.['chatRevision'] || 0x0);
    if (
      !_0x21a019 &&
      (_0x3ca8c0['revision'] < _0x5d8d4e || _0x3ca8c0['revision'] < 0x0) &&
      !_0x3ca8c0['error']
    )
      void _0xbe6ddd();
  }
  async function _0xbe6ddd() {
    if (!_0x5e0763 || _0x21a019 || _0x5425fa) return;
    const _0x33b18c = _0x5e0763,
      _0x505541 = _0x27bc80;
    ((_0x21a019 = !![]), (_0x3ca8c0['loading'] = !![]), (_0x3ca8c0['error'] = ''), _0x4b697f());
    try {
      let _0x5826a6;
      do {
        const _0x476c3f = _0x3ca8c0['revision'] < 0x0,
          _0x2c547c = await _0x33b18c['review']['readChat'](
            _0x476c3f ? {} : { after: _0x3ca8c0['revision'] },
          );
        if (_0x505541 !== _0x27bc80 || _0x5425fa) return;
        const _0x4b4f68 = new Set(_0x3ca8c0['messages']['map']((_0x530825) => _0x530825['id'])),
          _0x215bce = _0x2c547c['messages']['filter']((_0x284f7a) => !_0x4b4f68['has'](_0x284f7a['id']));
        (_0x3ca8c0['messages']['push'](..._0x215bce),
          _0x3ca8c0['messages']['sort']((_0x3bc34b, _0x315b3f) => _0x3bc34b['seq'] - _0x315b3f['seq']));
        if (_0x476c3f) _0x3ca8c0['hasMore'] = _0x2c547c['hasMore'];
        if (!_0x476c3f)
          for (const _0x5a683f of _0x215bce) {
            if (!_0x4ef7fc && _0x5a683f['actor'] !== _0x33b18c['state']['actorId']) _0x3ca8c0['unread']++;
            if (_0x5a683f['mentions']['includes'](_0x33b18c['state']['actorId'])) {
              if (!_0x4ef7fc) _0x3ca8c0['mentioned'] = !![];
              onMention(_0x5a683f);
            }
          }
        ((_0x5826a6 = !_0x476c3f && _0x2c547c['hasMore']),
          (_0x3ca8c0['revision'] = _0x5826a6
            ? _0x2c547c['messages']['at'](-0x1)['seq']
            : _0x2c547c['chatRevision']),
          _0x4b697f());
      } while (_0x5826a6 || _0x3ca8c0['revision'] < _0x5d8d4e);
    } catch (_0x52c815) {
      if (_0x505541 === _0x27bc80 && !_0x5425fa) _0x3ca8c0['error'] = _0x52c815['message'] || '聊天加载失败';
    } finally {
      _0x505541 === _0x27bc80 && !_0x5425fa && ((_0x21a019 = ![]), (_0x3ca8c0['loading'] = ![]), _0x4b697f());
    }
  }
  async function _0x5d3e64() {
    if (!_0x5e0763 || _0x21a019 || !_0x3ca8c0['hasMore'] || !_0x3ca8c0['messages']['length']) return;
    const _0x4db802 = _0x5e0763,
      _0x324e0e = _0x27bc80;
    ((_0x21a019 = !![]), (_0x3ca8c0['loading'] = !![]), (_0x3ca8c0['error'] = ''), _0x4b697f());
    try {
      const _0xe9458 = await _0x4db802['review']['readChat']({ before: _0x3ca8c0['messages'][0x0]['seq'] });
      if (_0x324e0e !== _0x27bc80 || _0x5425fa) return;
      const _0x48dd4e = new Set(_0x3ca8c0['messages']['map']((_0x10d9c9) => _0x10d9c9['id']));
      (_0x3ca8c0['messages']['unshift'](
        ..._0xe9458['messages']['filter']((_0x1f5146) => !_0x48dd4e['has'](_0x1f5146['id'])),
      ),
        (_0x3ca8c0['hasMore'] = _0xe9458['hasMore']));
    } catch (_0x22fb14) {
      if (_0x324e0e === _0x27bc80 && !_0x5425fa) _0x3ca8c0['error'] = _0x22fb14['message'];
    } finally {
      if (_0x324e0e === _0x27bc80 && !_0x5425fa) {
        ((_0x21a019 = ![]), (_0x3ca8c0['loading'] = ![]), _0x4b697f());
        if (_0x3ca8c0['revision'] < _0x5d8d4e && !_0x3ca8c0['error']) void _0xbe6ddd();
      }
    }
  }
  function _0xecaeb7(_0x55aeaa) {
    if (_0x3ca8c0['sending']) return ![];
    return (Object['assign'](_0x3ca8c0, _0x55aeaa), _0x4b697f(), !![]);
  }
  async function _0x24e9fa() {
    if (
      !_0x5e0763 ||
      _0x3ca8c0['sending'] ||
      (!_0x3ca8c0['body']['trim']() && !_0x3ca8c0['nodeIds']['length'])
    )
      return ![];
    const _0x12bfb0 = _0x5e0763,
      _0x1e1a62 = _0x27bc80,
      _0xe2f6c4 = {
        body: _0x3ca8c0['body']['trim'](),
        nodeIds: [..._0x3ca8c0['nodeIds']],
        mentions: [..._0x3ca8c0['mentions']],
      },
      _0x53251e = JSON['stringify'](_0xe2f6c4),
      _0x35f6c6 = _0x5f067b?.['fingerprint'] === _0x53251e ? _0x5f067b['messageId'] : crypto['randomUUID']();
    ((_0x5f067b = { fingerprint: _0x53251e, messageId: _0x35f6c6 }),
      (_0x3ca8c0['sending'] = !![]),
      (_0x3ca8c0['error'] = ''),
      _0x4b697f());
    try {
      await _0x12bfb0['review']['write']('chatSend', { ..._0xe2f6c4, messageId: _0x35f6c6 });
      if (_0x1e1a62 !== _0x27bc80 || _0x5425fa) return ![];
      return (
        (_0x3ca8c0['body'] = ''),
        (_0x3ca8c0['nodeIds'] = []),
        (_0x3ca8c0['mentions'] = []),
        (_0x5f067b = null),
        await _0xbe6ddd(),
        !![]
      );
    } catch (_0x469397) {
      if (_0x1e1a62 === _0x27bc80 && !_0x5425fa)
        _0x3ca8c0['error'] = _0x469397['message'] || '发送失败，请重试';
      return ![];
    } finally {
      _0x1e1a62 === _0x27bc80 && !_0x5425fa && ((_0x3ca8c0['sending'] = ![]), _0x4b697f());
    }
  }
  return {
    sync: _0x5c123c,
    refresh: _0xbe6ddd,
    older: _0x5d3e64,
    edit: _0xecaeb7,
    send: _0x24e9fa,
    snapshot: () => _0x3ca8c0,
    setVisible(_0x5bef09) {
      ((_0x4ef7fc = _0x5bef09),
        _0x5bef09 && ((_0x3ca8c0['unread'] = 0x0), (_0x3ca8c0['mentioned'] = ![])),
        _0x4b697f());
    },
    destroy() {
      ((_0x5425fa = !![]), _0x27bc80++, _0x6bba25['clear']());
    },
  };
}
