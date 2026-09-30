export function createCanvasMcpAutoConnection({
  createSession: _0x5e161e,
  getBinding: _0x31d1e3,
  isReady: _0x2dfba6,
  onChange: onChange = () => {},
  schedule: schedule = setTimeout,
  cancel: cancel = clearTimeout,
  allowGeneration = false,
}) {
  let _0x446ca4 = ![],
    _0x12734b = ![],
    _0xcf4594 = allowGeneration === true,
    _0x1f629f = '',
    _0x2a455b = ![],
    _0x573597 = { enabled: ![] },
    _0x56c5ab;
  let backendUnavailable = false;
  const _0x34400a = () => onChange({ ..._0x573597, allowGeneration: _0xcf4594 }),
    _0x347949 = _0x5e161e((_0x4bf0e5) => {
      ((_0x573597 = _0x4bf0e5), _0x34400a());
    });
  function _0x30d28b(_0x143dc5) {
    cancel(_0x56c5ab);
    if (!_0x446ca4 && !backendUnavailable)
      _0x56c5ab = schedule(() => {
        void _0x589a4f();
      }, _0x143dc5);
  }
  async function _0x589a4f() {
    if (_0x446ca4 || backendUnavailable) return;
    _0x347949['checkBinding']();
    if (_0x12734b) {
      _0x30d28b(0x3e8);
      return;
    }
    const _0x18ef07 = _0x2dfba6() ? _0x31d1e3() : '';
    if (!_0x18ef07) {
      if (_0x573597['enabled']) await _0x347949['disable']();
      _0x30d28b(0x3e8);
      return;
    }
    if (_0x573597['enabled'] && _0x1f629f === _0x18ef07 && _0x2a455b === _0xcf4594) {
      _0x30d28b(0x3e8);
      return;
    }
    _0x12734b = !![];
    const _0x49ebf7 = _0xcf4594;
    let _0x203038 = 0x3e8;
    try {
      const _0x49d58a = await _0x347949['enable']({ allowGeneration: _0x49ebf7 });
      _0x49d58a && ((_0x1f629f = _0x18ef07), (_0x2a455b = _0x49ebf7));
    } catch (_0x18ccb3) {
      const status = Number(_0x18ccb3?.status || _0x18ccb3?.statusCode);
      backendUnavailable = [401, 403, 404, 405, 501].includes(status) || _0x18ccb3?.code === 'UNSUPPORTED';
      ((_0x573597 = { enabled: ![], reason: _0x18ccb3['message'] }), _0x34400a(), (_0x203038 = 0x1388));
    } finally {
      ((_0x12734b = ![]), _0x30d28b(_0x203038));
    }
  }
  return (
    _0x30d28b(0x0),
    {
      refresh() {
        (_0x347949['checkBinding'](), _0x30d28b(0x0));
      },
      setAllowGeneration(_0x5ad1bc) {
        ((_0xcf4594 = _0x5ad1bc === !![]), void _0x347949['disable'](), _0x30d28b(0x0));
      },
      async destroy() {
        ((_0x446ca4 = !![]), cancel(_0x56c5ab), await _0x347949['destroy']());
      },
    }
  );
}
