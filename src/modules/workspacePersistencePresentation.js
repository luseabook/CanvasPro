export function createWorkspacePersistencePresentation({
  getRoot: _0x316a76,
  showDelayMs: showDelayMs = 0x12c,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
} = {}) {
  let _0x5c4314 = null,
    _0x5eebca = null,
    _0x2a648b = null,
    _0x2d2071 = ![],
    _0x248d07 = '',
    _0x44fddb = null,
    _0x3c285b = { status: 'idle' };
  const _0x1b11e9 = () => {
    if (_0x44fddb !== null) clearTimeoutFn?.(_0x44fddb);
    _0x44fddb = null;
  };
  return {
    update(_0x4e1be0 = {}) {
      if (_0x2d2071) return;
      const _0x50fecb = _0x3c285b['status'];
      _0x3c285b = { ..._0x4e1be0 };
      const _0x5e4439 = _0x316a76?.(),
        _0x4833f7 = _0x5e4439?.['ownerDocument'] || globalThis['document'];
      if (!_0x5e4439?.['appendChild'] || !_0x4833f7?.['createElement']) return;
      !_0x5c4314 &&
        ((_0x5c4314 = _0x4833f7['createElement']('div')),
        (_0x5c4314['className'] = 'workspace-persistence-status'),
        (_0x5c4314['hidden'] = !![]),
        _0x5c4314['setAttribute']('role', 'status'),
        _0x5c4314['setAttribute']('aria-live', 'polite'),
        (_0x2a648b = _0x4833f7['createElement']('span')),
        (_0x2a648b['className'] = 'storyboard-script-loading-spinner\x20workspace-persistence-spinner'),
        _0x2a648b['setAttribute']('aria-hidden', 'true'),
        (_0x5eebca = _0x4833f7['createElement']('span')),
        _0x5c4314['appendChild'](_0x2a648b),
        _0x5c4314['appendChild'](_0x5eebca));
      if (_0x5c4314['parentElement'] !== _0x5e4439) _0x5e4439['appendChild'](_0x5c4314);
      const _0x50af1f = _0x4e1be0['status'] || 'idle';
      if (_0x50af1f === 'error') _0x248d07 = String(_0x4e1be0['error'] || '');
      if (_0x50af1f === 'saved' || _0x50af1f === 'idle') _0x248d07 = '';
      const _0x494397 = _0x50af1f === 'saving' && Number(_0x4e1be0['retryAttempt']) > 0x0,
        _0x1b74f8 = _0x50af1f === 'error' || _0x494397 || Boolean(_0x248d07);
      if (_0x50af1f !== 'saving' || _0x1b74f8) _0x1b11e9();
      if (_0x1b74f8) _0x5c4314['hidden'] = ![];
      else {
        if (_0x50af1f !== 'saving') _0x5c4314['hidden'] = !![];
        else
          (_0x50fecb !== 'saving' || (_0x5c4314['hidden'] && _0x44fddb === null)) &&
            (_0x1b11e9(),
            typeof setTimeoutFn === 'function'
              ? (_0x44fddb = setTimeoutFn(() => {
                  _0x44fddb = null;
                  if (!_0x2d2071 && _0x3c285b['status'] === 'saving') _0x5c4314['hidden'] = ![];
                }, showDelayMs))
              : (_0x5c4314['hidden'] = ![]));
      }
      (_0x5c4314['setAttribute']('data-state', _0x1b74f8 ? 'error' : _0x50af1f),
        (_0x2a648b['hidden'] = _0x50af1f !== 'saving'),
        (_0x5eebca['textContent'] = _0x494397
          ? '保存失败，正在重试' + (_0x248d07 ? '：' + _0x248d07 : '')
          : _0x50af1f === 'error' || (_0x248d07 && _0x50af1f === 'pending')
            ? '尚未保存' +
              (Number(_0x4e1be0['retryAttempt']) > 0x0 ? '，将自动重试' : '') +
              (_0x248d07 ? '：' + _0x248d07 : '')
            : '正在保存…'));
    },
    destroy() {
      ((_0x2d2071 = !![]),
        _0x1b11e9(),
        _0x5c4314?.['remove']?.(),
        (_0x5c4314 = _0x5eebca = _0x2a648b = null));
    },
  };
}
