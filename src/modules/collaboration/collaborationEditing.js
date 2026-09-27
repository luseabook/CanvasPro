export function createCollaborationEditing({
  rpc: _0x43e43f,
  flush: _0x4aea8f,
  canEdit: _0x2cd09c,
  current: _0x2e1887,
  update: _0x353430,
  notify: _0x3ce5f6,
  onChange: _0x218318,
}) {
  const _0x19c67b = crypto['randomUUID'](),
    _0x4ec9d6 = new Map();
  let _0x4a6d46 = Promise['resolve'](),
    _0xcb0a04 = ![];
  const _0x2059dc = (_0x4d7c6f) => {
    const _0x37404b = _0x4a6d46['then'](_0x4d7c6f);
    return ((_0x4a6d46 = _0x37404b['catch'](() => {})), _0x37404b);
  };
  function _0x4dfd48(_0x17f11f) {
    return _0x2059dc(async () => {
      if (!_0x2e1887() || _0xcb0a04) return;
      const _0x3f2e4f = _0x17f11f['filter'](
        (_0x4da81f) => !_0x4da81f['refs'] && _0x4ec9d6['get'](_0x4da81f['id']) === _0x4da81f,
      );
      if (!_0x3f2e4f['length']) return;
      try {
        await _0x4aea8f();
      } catch (_0x558f8c) {
        _0x3ce5f6(_0x558f8c['message']);
      }
      if (!_0x2e1887() || _0xcb0a04) return;
      const _0x366e99 = _0x3f2e4f['filter'](
        (_0x45692d) => !_0x45692d['refs'] && _0x4ec9d6['get'](_0x45692d['id']) === _0x45692d,
      );
      if (!_0x366e99['length']) return;
      for (const _0x51c305 of _0x366e99) _0x4ec9d6['delete'](_0x51c305['id']);
      _0x218318();
      const _0x5821d0 = await _0x43e43f({
        action: 'endEdit',
        nodeIds: _0x366e99['map']((_0x298bad) => _0x298bad['id']),
        editId: _0x19c67b,
      });
      if (_0x2e1887() && !_0xcb0a04) _0x353430(_0x5821d0);
    })['catch']((_0x3c8c57) => {
      if (_0x2e1887() && !_0xcb0a04) _0x3ce5f6(_0x3c8c57['message']);
    });
  }
  return {
    presence() {
      return Object['fromEntries'](
        [..._0x4ec9d6['values']()]
          ['filter']((_0x7daf9b) => _0x7daf9b['acquired'])
          ['map']((_0x5a1d04) => [_0x5a1d04['id'], _0x19c67b]),
      );
    },
    pending() {
      return [..._0x4ec9d6['values']()]
        ['filter']((_0x41cfab) => _0x41cfab['refs'] && !_0x41cfab['acquired'] && !_0x41cfab['failed'])
        ['map']((_0x5947ca) => _0x5947ca['id']);
    },
    refresh(_0x2bcf9d) {
      for (const _0x13af95 of _0x4ec9d6['values']()) {
        const _0x1ebc11 = _0x2bcf9d?.[_0x13af95['id']];
        if (_0x1ebc11?.['editId'] === _0x19c67b) _0x13af95['expiresAt'] = _0x1ebc11['expiresAt'] * 0x3e8;
      }
    },
    begin(_0xc59921) {
      let _0x5c390c = ![];
      const _0x1d9ea6 = {
          ready: ![],
          pending: !![],
          allowed: () =>
            !_0x5c390c &&
            !_0xcb0a04 &&
            _0x1d9ea6['ready'] &&
            _0x2e1887() &&
            _0x3ec4b2['every']((_0x4d4fca) => _0x4d4fca['expiresAt'] > Date['now']()) &&
            _0x2cd09c(_0xc59921),
          canPreview: () =>
            !_0x5c390c &&
            !_0xcb0a04 &&
            _0x2e1887() &&
            _0x2cd09c(_0xc59921) &&
            ((_0x1d9ea6['pending'] && _0x3ec4b2['every']((_0x5a19e6) => !_0x5a19e6['failed'])) ||
              _0x1d9ea6['allowed']()),
          wait: null,
          finish() {
            if (_0x5c390c) return;
            _0x5c390c = !![];
            for (const _0x1e5fd2 of _0x3ec4b2) _0x1e5fd2['refs']--;
            return _0x4dfd48(_0x3ec4b2);
          },
        },
        _0x3ec4b2 = [];
      if (!_0x2e1887() || !_0x2cd09c(_0xc59921))
        return (
          _0x3ce5f6('节点正在被其他成员编辑，或当前画布不可编辑'),
          (_0x1d9ea6['pending'] = ![]),
          (_0x1d9ea6['wait'] = Promise['resolve'](![])),
          _0x1d9ea6
        );
      const _0x2d4a5a = [];
      for (const _0x140451 of _0xc59921) {
        let _0x21e12d = _0x4ec9d6['get'](_0x140451);
        ((!_0x21e12d ||
          _0x21e12d['failed'] ||
          (_0x21e12d['acquired'] && _0x21e12d['expiresAt'] <= Date['now']())) &&
          ((_0x21e12d = { id: _0x140451, refs: 0x0, acquired: ![], failed: ![], wait: null }),
          _0x4ec9d6['set'](_0x140451, _0x21e12d),
          _0x2d4a5a['push'](_0x21e12d)),
          _0x21e12d['refs']++,
          _0x3ec4b2['push'](_0x21e12d));
      }
      if (_0x2d4a5a['length']) {
        const _0x2d6608 = _0x2059dc(async () => {
          if (!_0x2e1887() || _0xcb0a04) return ![];
          await _0x4aea8f();
          if (!_0x2e1887() || _0xcb0a04 || !_0x2d4a5a['some']((_0x46ea94) => _0x46ea94['refs'])) return ![];
          const _0x3407b7 = await _0x43e43f({
            action: 'beginEdit',
            nodeIds: _0x2d4a5a['map']((_0x8b30dd) => _0x8b30dd['id']),
            editId: _0x19c67b,
          });
          if (!_0x2e1887() || _0xcb0a04) return ![];
          await _0x353430(_0x3407b7);
          if (!_0x2e1887() || _0xcb0a04) return ![];
          for (const _0x30ea62 of _0x2d4a5a) _0x30ea62['acquired'] = !![];
          return (_0x218318(), !![]);
        })['catch']((_0x267c8e) => {
          for (const _0x390c24 of _0x2d4a5a) _0x390c24['failed'] = !![];
          return (_0x2e1887() && !_0xcb0a04 && (_0x3ce5f6(_0x267c8e['message']), _0x218318()), ![]);
        });
        for (const _0x3b7707 of _0x2d4a5a) _0x3b7707['wait'] = _0x2d6608;
      }
      return (
        (_0x1d9ea6['ready'] = _0x3ec4b2['every']((_0x36a63b) => _0x36a63b['acquired'])),
        (_0x1d9ea6['pending'] = !_0x1d9ea6['ready']),
        (_0x1d9ea6['wait'] = Promise['all'](_0x3ec4b2['map']((_0x1fbe2f) => _0x1fbe2f['wait']))['then'](
          (_0x469e29) => {
            return (
              (_0x1d9ea6['pending'] = ![]),
              (_0x1d9ea6['ready'] = !_0x5c390c && _0x469e29['every'](Boolean) && _0x2e1887() && !_0xcb0a04),
              _0x1d9ea6['ready']
            );
          },
        )),
        _0x218318(),
        _0x1d9ea6
      );
    },
    dispose() {
      ((_0xcb0a04 = !![]), _0x4ec9d6['clear']());
    },
  };
}
