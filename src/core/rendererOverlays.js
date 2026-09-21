import { t } from '../i18n/index.js';
export function createContextMenuEl() {
  const _0x41032f = document.createElement('div');
  return (
    (_0x41032f.id = 'v2-context-menu'),
    (_0x41032f.dataset.uiStop = '1'),
    Object.assign(_0x41032f.style, {
      position: 'absolute',
      display: 'none',
      background: 'var(--preset-menu-bg)',
      border: '1px solid var(--preset-menu-border)',
      borderRadius: 'var(--radius-18)',
      padding: '6px',
      boxShadow: 'var(--preset-menu-shadow)',
      backdropFilter: 'blur(var(--preset-menu-blur))',
      zIndex: '2000',
      minWidth: '160px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }),
    _0x41032f
  );
}
export function renderContextMenu(_0x58101c, _0x3a1fd6) {
  if (!_0x3a1fd6 || !_0x3a1fd6.visible) {
    ((_0x58101c.style.display = 'none'), _0x58101c.replaceChildren());
    return;
  }
  ((_0x58101c.style.display = 'flex'),
    (_0x58101c.style.left = _0x3a1fd6.x + 'px'),
    (_0x58101c.style.top = _0x3a1fd6.y + 'px'));
  if (_0x58101c.children.length > 0) return;
  const _0x2db54b = document.createElement('div');
  ((_0x2db54b.textContent = t('coreUi.rendererOverlays.contextMenuTitle')),
    Object.assign(_0x2db54b.style, {
      fontSize: '11px',
      color: 'var(--text-muted)',
      padding: '4px 8px',
      borderBottom: '1px solid var(--white-08)',
      marginBottom: '4px',
      userSelect: 'none',
    }),
    _0x58101c.appendChild(_0x2db54b));
  const _0x121ab1 = document.createElement('button');
  ((_0x121ab1.dataset.cmd = 'delete_nodes'),
    (_0x121ab1.textContent = t('coreUi.rendererOverlays.delete')),
    Object.assign(_0x121ab1.style, {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-danger)',
      padding: '8px 12px',
      cursor: 'pointer',
      textAlign: 'left',
      borderRadius: '4px',
      fontSize: '13px',
    }),
    _0x58101c.appendChild(_0x121ab1));
}
export function createPickConnectBannerEl() {
  const _0x4a809e = document.createElement('div');
  return (
    (_0x4a809e.id = 'v2-pick-connect-banner'),
    (_0x4a809e.className = 'v2-pick-connect-banner'),
    (_0x4a809e.textContent = t('coreUi.rendererOverlays.pickConnectBanner')),
    Object.assign(_0x4a809e.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-panel-card)',
      border: '1px solid var(--blue-30)',
      borderRadius: '8px',
      padding: '10px 20px',
      color: 'var(--text-primary)',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px var(--black-50)',
      zIndex: '1000',
      display: 'none',
      pointerEvents: 'none',
    }),
    _0x4a809e
  );
}
export function renderPickConnectBanner(_0x3c3232, _0x101c12) {
  _0x3c3232.style.display = _0x101c12?.active ? 'block' : 'none';
}
