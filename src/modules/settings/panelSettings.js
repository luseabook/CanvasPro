function getSettingsPanelElements() {
  return {
    settingsOverlay: document.getElementById('settingsOverlay'),
    avatarMenu: document.getElementById('avatarMenu'),
  };
}
function isSettingsPanelOpen(_0x4d721e) {
  return !!_0x4d721e && _0x4d721e.style.display === 'block';
}
function dispatchWebPreviewSettingsSync(_0x2483bb) {
  const _0x2fce6c = globalThis.window;
  if (!_0x2fce6c || typeof _0x2fce6c.dispatchEvent !== 'function') return;
  const _0x100b10 = { reason: _0x2483bb },
    _0x15ba66 =
      typeof globalThis.CustomEvent === 'function'
        ? new globalThis['CustomEvent']('web-preview:force-sync', { detail: _0x100b10 })
        : { type: 'web-preview:force-sync', detail: _0x100b10 };
  _0x2fce6c.dispatchEvent(_0x15ba66);
}
export function openSettingsPanel() {
  const { settingsOverlay: _0x1d14a3, avatarMenu: _0x54894a } = getSettingsPanelElements();
  if (!_0x1d14a3) return false;
  return (
    (_0x1d14a3.style.display = 'block'),
    _0x54894a?.classList.remove('open'),
    dispatchWebPreviewSettingsSync('settings-open'),
    true
  );
}
export function closeSettingsPanel() {
  const { settingsOverlay: _0x3eee50 } = getSettingsPanelElements();
  if (!_0x3eee50) return false;
  return ((_0x3eee50.style.display = 'none'), dispatchWebPreviewSettingsSync('settings-close'), true);
}
export function toggleSettingsPanel() {
  const { settingsOverlay: _0x2ef9a2 } = getSettingsPanelElements();
  if (!_0x2ef9a2) return false;
  return isSettingsPanelOpen(_0x2ef9a2) ? closeSettingsPanel() : openSettingsPanel();
}
export function initSettingsPanelEvents() {
  const _0x4666ff = document.getElementById('btnOpenSettings'),
    _0x4bbb64 = document.getElementById('btnSettingsClose'),
    _0x291135 = document.getElementById('settingsOverlay');
  if (!_0x4666ff || !_0x291135) return;
  (_0x4666ff.addEventListener('click', (_0x4769db) => {
    (_0x4769db.stopPropagation(), openSettingsPanel());
  }),
    _0x4bbb64?.addEventListener('click', () => {
      closeSettingsPanel();
    }),
    _0x291135.addEventListener('click', (_0x30d27c) => {
      _0x30d27c.target === _0x291135 && closeSettingsPanel();
    }));
  const _0x2d6110 = document.querySelectorAll('.settings-nav-item'),
    _0x132efd = document.querySelectorAll('.settings-pane');
  _0x2d6110.forEach((_0x320899) => {
    _0x320899.addEventListener('click', () => {
      (_0x2d6110.forEach((_0x5be137) => _0x5be137.classList.remove('active')),
        _0x132efd.forEach((_0x1dddf3) => _0x1dddf3.classList.remove('active')),
        _0x320899.classList.add('active'));
      const _0x1c2c2 = 'pane-' + _0x320899.dataset.pane,
        _0x22f160 = document.getElementById(_0x1c2c2);
      if (_0x22f160) _0x22f160.classList.add('active');
    });
  });
}
