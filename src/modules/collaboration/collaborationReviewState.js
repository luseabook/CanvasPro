export function createCollaborationReviewState({
  rpc: _0xb205b6,
  current: _0xa0e9,
  initialRevision: _0x637678,
  onChange: _0xf3ec60,
  onComment: onComment = () => {},
}) {
  let _0x10b001 = { revision: -0x1, summaries: [], activities: [], loading: ![], error: '' },
    _0x1c63f1 = null,
    _0x438286 = -0x1,
    _0x51bc7d = Number['isInteger'](_0x637678) ? _0x637678 : -0x1;
  const _0x1ac419 = (_0x476d5f) => {
    _0xa0e9() && ((_0x10b001 = { ..._0x10b001, ..._0x476d5f }), _0xf3ec60(_0x10b001));
  };
  function _0xab7c07(_0x5f2b43 = _0x438286, _0x180b94 = ![]) {
    if (!_0xa0e9() || !Number['isInteger'](_0x5f2b43)) return Promise['resolve']();
    _0x438286 = Math['max'](_0x438286, _0x5f2b43);
    if (_0x1c63f1) return _0x1c63f1;
    if (!_0x180b94 && _0x10b001['revision'] >= _0x438286 && !_0x10b001['error']) return Promise['resolve']();
    return (
      _0x1ac419({ loading: !![], error: '' }),
      (_0x1c63f1 = (async () => {
        try {
          do {
            const _0x1e5dad = await _0xb205b6({ action: 'reviewRead' });
            if (!_0xa0e9()) return;
            if (
              !Number['isInteger'](_0x1e5dad['revision']) ||
              !Array['isArray'](_0x1e5dad['summaries']) ||
              !Array['isArray'](_0x1e5dad['activities'])
            )
              throw new Error('协作动态响应无效');
            const _0x5a4157 =
              _0x51bc7d < 0x0
                ? []
                : _0x1e5dad['activities']
                    ['filter'](
                      (_0x1eb98d) =>
                        _0x1eb98d['seq'] > _0x51bc7d && ['comment', 'resolve']['includes'](_0x1eb98d['kind']),
                    )
                    ['sort']((_0x18c92e, _0x2a50fd) => _0x18c92e['seq'] - _0x2a50fd['seq']);
            _0x51bc7d = Math['max'](_0x51bc7d, _0x1e5dad['revision']);
            for (const _0x272620 of _0x5a4157) onComment(_0x272620);
            _0x1ac419({ ..._0x1e5dad, error: '' });
          } while (_0xa0e9() && _0x10b001['revision'] < _0x438286);
        } catch (_0x4c25f7) {
          _0x1ac419({ error: _0x4c25f7['name'] === 'AbortError' ? '' : _0x4c25f7['message'] });
        } finally {
          ((_0x1c63f1 = null), _0x1ac419({ loading: ![] }));
        }
      })()),
      _0x1c63f1
    );
  }
  return {
    snapshot: () => _0x10b001,
    refresh: _0xab7c07,
    async readChat(_0x1c6dfd = {}) {
      const _0x1f80c4 = await _0xb205b6({ ..._0x1c6dfd, action: 'chatRead' });
      if (!_0xa0e9()) throw new DOMException('Aborted', 'AbortError');
      return _0x1f80c4;
    },
    async readNode(_0x420487) {
      const _0x4140e4 = await _0xb205b6({ action: 'commentRead', nodeId: _0x420487 });
      if (!_0xa0e9()) throw new DOMException('Aborted', 'AbortError');
      return _0x4140e4;
    },
    async write(_0x21f7fd, _0x23d1b9) {
      if (!_0xa0e9()) throw new DOMException('Aborted', 'AbortError');
      const _0x1d95f0 = await _0xb205b6({ action: _0x21f7fd, ..._0x23d1b9 });
      if (!_0xa0e9()) throw new DOMException('Aborted', 'AbortError');
      return (await _0xab7c07(_0x1d95f0['revision']), _0x1d95f0);
    },
  };
}
