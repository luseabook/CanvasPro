function normalizeDelay(_0x36b9a2, _0x364b71) {
  const _0x4b1f9c = Number(_0x36b9a2);
  return Number['isFinite'](_0x4b1f9c) && _0x4b1f9c >= 0x0 ? _0x4b1f9c : _0x364b71;
}
function getErrorMessage(_0xf1dbea) {
  return String(_0xf1dbea?.['message'] || _0xf1dbea || '自动保存失败')['trim']() || '自动保存失败';
}
export function createWorkspacePersistenceCoordinator({
  save: _0x567fcd,
  getSnapshot: _0x2c2982,
  ready: ready = !![],
  debounceMs: debounceMs = 0x1f4,
  maxWaitMs: maxWaitMs = 0x0,
  retryBaseMs: retryBaseMs = 0x3e8,
  retryMaxMs: retryMaxMs = 0x2710,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
  onStateChange: onStateChange = () => {},
  onError: onError = () => {},
} = {}) {
  const _0x3f9103 = typeof _0x567fcd === 'function' && typeof _0x2c2982 === 'function',
    _0x4bba47 = normalizeDelay(debounceMs, 0x1f4),
    _0x27a414 = normalizeDelay(maxWaitMs, 0x0),
    _0x53520c = normalizeDelay(retryBaseMs, 0x3e8),
    _0x4445de = Math['max'](_0x53520c, normalizeDelay(retryMaxMs, 0x2710));
  let _0x892bf9 = ready === !![],
    _0x3c4211 = ![],
    _0x34bc85 = 0x0,
    _0x1ed1e6 = 0x0,
    _0x194260 = null,
    _0x5263cb = 0x0,
    _0x11cec1 = 0x0,
    _0x2b871c = 0x0,
    _0x17f4bd = 0x0,
    _0x35f812 = null,
    _0x52f8e0 = null,
    _0x1aa185 = { status: _0x3f9103 ? 'saved' : 'idle', error: '', retryAttempt: 0x0 };
  const _0xb97a9 = (_0x5c1380, { error: error = '', attempt: attempt = _0x17f4bd } = {}) => {
      return (
        (_0x1aa185 = {
          status: _0x5c1380,
          error: String(error || '')['trim'](),
          retryAttempt: Math['max'](0x0, Math['trunc'](Number(attempt) || 0x0)),
        }),
        onStateChange({ ..._0x1aa185 }),
        _0x1aa185
      );
    },
    _0x209705 = () => {
      (_0x34bc85 && typeof clearTimeoutFn === 'function' && clearTimeoutFn(_0x34bc85), (_0x34bc85 = 0x0));
    },
    _0x11dfe4 = () => {
      (_0x5263cb && typeof clearTimeoutFn === 'function' && clearTimeoutFn(_0x5263cb), (_0x5263cb = 0x0));
    },
    _0x1f3517 = () => {
      _0x209705();
      if (_0x1ed1e6) clearTimeoutFn?.(_0x1ed1e6);
      ((_0x1ed1e6 = 0x0), (_0x194260 = null));
    },
    _0xf2812e = (_0x203014) => {
      ((_0x17f4bd += 0x1), _0xb97a9('error', { error: getErrorMessage(_0x203014), attempt: _0x17f4bd }));
      if (_0x3c4211 || !_0x892bf9 || !_0x3f9103 || _0x5263cb || typeof setTimeoutFn !== 'function') return;
      const _0x51e9b9 = Math['min'](_0x53520c * 0x2 ** Math['max'](0x0, _0x17f4bd - 0x1), _0x4445de);
      _0x5263cb =
        setTimeoutFn(() => {
          ((_0x5263cb = 0x0), void _0x21b547()['catch'](onError));
        }, _0x51e9b9) || 0x0;
    },
    _0x461907 = ({ allowStopped: allowStopped = ![] } = {}) => {
      if (!_0x892bf9 || !_0x3f9103 || (_0x3c4211 && !allowStopped)) return Promise['resolve'](_0x52f8e0);
      (_0x1f3517(), _0x11dfe4());
      if (_0x35f812) return _0x35f812;
      const _0x1e0a8d = async () => {
          while (_0x2b871c < _0x11cec1) {
            _0x1f3517();
            const _0x11f265 = _0x11cec1;
            let _0x545129 = ![];
            try {
              const _0x300ad2 = _0x2c2982();
              ((_0x545129 = !![]),
                _0xb97a9('saving', { attempt: _0x17f4bd }),
                (_0x52f8e0 = await _0x567fcd(_0x300ad2)));
            } catch (_0x5b3aa5) {
              _0x1f3517();
              _0x545129
                ? _0xf2812e(_0x5b3aa5)
                : ((_0x17f4bd = 0x0), _0xb97a9('error', { error: getErrorMessage(_0x5b3aa5), attempt: 0x0 }));
              throw _0x5b3aa5;
            }
            ((_0x2b871c = _0x11f265), (_0x17f4bd = 0x0), _0x2b871c >= _0x11cec1 && _0xb97a9('saved'));
          }
          return _0x52f8e0;
        },
        _0x102bba = _0x1e0a8d()['finally'](() => {
          if (_0x35f812 === _0x102bba) _0x35f812 = null;
        });
      return ((_0x35f812 = _0x102bba), _0x102bba);
    };
  function _0x21b547({ force: force = ![] } = {}) {
    return (
      force &&
        _0x3f9103 &&
        !_0x3c4211 &&
        _0x11cec1 <= _0x2b871c &&
        ((_0x11cec1 = _0x2b871c + 0x1), _0xb97a9('pending')),
      _0x461907()
    );
  }
  const _0xf1d162 = (_0x2beeaf = _0x4bba47) => {
      if (!_0x892bf9 || _0x3c4211 || !_0x3f9103 || _0x5263cb || typeof setTimeoutFn !== 'function') return;
      if (_0x34bc85 && _0x194260 !== null && _0x2beeaf > _0x194260) return;
      ((_0x194260 = _0x194260 === null ? _0x2beeaf : Math['min'](_0x194260, _0x2beeaf)),
        _0x209705(),
        (_0x34bc85 =
          setTimeoutFn(() => {
            ((_0x34bc85 = 0x0), void _0x21b547()['catch'](onError));
          }, _0x194260) || 0x0),
        !_0x1ed1e6 &&
          _0x27a414 > 0x0 &&
          (_0x1ed1e6 =
            setTimeoutFn(() => {
              ((_0x1ed1e6 = 0x0), void _0x21b547()['catch'](onError));
            }, _0x27a414) || 0x0));
    },
    _0xd4f663 = ({ immediate: immediate = ![], delayMs: delayMs = _0x4bba47 } = {}) => {
      if (_0x3c4211) return _0x11cec1;
      _0x11cec1 += 0x1;
      if (_0x3f9103 && !['error', 'saving']['includes'](_0x1aa185['status'])) _0xb97a9('pending');
      if (!_0x892bf9 || !_0x3f9103) return _0x11cec1;
      return (
        immediate
          ? (_0x209705(), void _0x21b547()['catch'](onError))
          : _0xf1d162(normalizeDelay(delayMs, _0x4bba47)),
        _0x11cec1
      );
    },
    _0x4f7918 = (_0x2a637b = !![], { immediate: immediate = ![] } = {}) => {
      _0x892bf9 = _0x2a637b === !![];
      if (!_0x892bf9 || _0x3c4211 || _0x11cec1 <= _0x2b871c) return;
      immediate ? void _0x21b547()['catch'](onError) : _0xf1d162();
    },
    _0x1a3d6b = (_0x27aecf) => {
      ((_0x892bf9 = ![]),
        (_0x17f4bd = 0x0),
        _0x1f3517(),
        _0x11dfe4(),
        _0xb97a9('error', { error: getErrorMessage(_0x27aecf), attempt: 0x0 }));
    },
    _0x5a1c3e = async ({ flush: _0x33dd96 = !![], force: force = ![] } = {}) => {
      if (_0x3c4211) return _0x35f812 || _0x52f8e0;
      (_0x1f3517(), _0x11dfe4());
      force && _0x3f9103 && _0x11cec1 <= _0x2b871c && ((_0x11cec1 = _0x2b871c + 0x1), _0xb97a9('pending'));
      _0x3c4211 = !![];
      if (!_0x33dd96 || !_0x892bf9 || !_0x3f9103) return _0x35f812 || _0x52f8e0;
      try {
        return await _0x461907({ allowStopped: !![] });
      } finally {
        (_0x209705(), _0x11dfe4());
      }
    };
  return Object['freeze']({
    schedule: _0xd4f663,
    flush: _0x21b547,
    setReady: _0x4f7918,
    setHydrationError: _0x1a3d6b,
    destroy: _0x5a1c3e,
    getRevision: () => _0x11cec1,
    getPersistedRevision: () => _0x2b871c,
    getState: () => ({ ..._0x1aa185 }),
    isReady: () => _0x892bf9,
    isDirty: () => _0x11cec1 > _0x2b871c,
  });
}
