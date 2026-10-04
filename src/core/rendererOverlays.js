import { t } from '../i18n/index.js';
export function createContextMenuEl() {
  const el = document.createElement('div');
  return (
    (el.id = 'v2-context-menu'),
    (el.dataset.uiStop = '1'),
    Object.assign(el.style, {
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
    el
  );
}
export function renderContextMenu(el2, box) {
  if (!box || !box.visible) {
    ((el2.style.display = 'none'), el2.replaceChildren());
    return;
  }
  ((el2.style.display = 'flex'), (el2.style.left = box.x + 'px'), (el2.style.top = box.y + 'px'));
  if (el2.children.length > 0) return;
  const el3 = document.createElement('div');
  ((el3.textContent = t('coreUi.rendererOverlays.contextMenuTitle')),
    Object.assign(el3.style, {
      fontSize: '11px',
      color: 'var(--text-muted)',
      padding: '4px 8px',
      borderBottom: '1px solid var(--white-08)',
      marginBottom: '4px',
      userSelect: 'none',
    }),
    el2.appendChild(el3));
  const el4 = document.createElement('button');
  ((el4.dataset.cmd = 'delete_nodes'),
    (el4.textContent = t('coreUi.rendererOverlays.delete')),
    Object.assign(el4.style, {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-danger)',
      padding: '8px 12px',
      cursor: 'pointer',
      textAlign: 'left',
      borderRadius: '4px',
      fontSize: '13px',
    }),
    el2.appendChild(el4));
}
export function createPickConnectBannerEl() {
  const el5 = document.createElement('div');
  return (
    (el5.id = 'v2-pick-connect-banner'),
    (el5.className = 'v2-pick-connect-banner'),
    (el5.textContent = t('coreUi.rendererOverlays.pickConnectBanner')),
    Object.assign(el5.style, {
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
    el5
  );
}
export function renderPickConnectBanner(el6, value) {
  el6.style.display = value?.active ? 'block' : 'none';
}
