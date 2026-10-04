import { t } from '../../i18n/index.js';
export function initAppShellUi({
  store: store,
  initMinimap: initMinimap,
  minimapEl: minimapEl,
  btnMinimapEl: btnMinimapEl,
  minimapWrapperEl: minimapWrapperEl,
  btnToggleDotsEl: btnToggleDotsEl,
  applySnapGridEnabled: applySnapGridEnabled,
  readSnapGridEnabled: readSnapGridEnabled,
  applyGridDotsPrefFromStorage: applyGridDotsPrefFromStorage,
  showDevToast: showDevToast,
} = {}) {
  const el = document.getElementById('canvasVersionBadge');
  if (el) {
    const value = document.querySelector('meta[name="app-version"]')?.getAttribute('content'),
      version = String(value || '')
        .trim()
        .replace(/^v\s*/i, '');
    el.textContent = version ? t('appShell.currentVersionBadge', { version: version }) : '';
  }
  minimapEl && initMinimap?.(minimapEl, store);
  if (btnMinimapEl && minimapWrapperEl) {
    btnMinimapEl.addEventListener('click', () => {
      (minimapWrapperEl.classList.toggle('open'), btnMinimapEl.classList.toggle('active'));
    });
    const item = () => {
      const key = Object.keys(store?.getState?.().nodes || {}).length > 0;
      (minimapWrapperEl.classList.toggle('open', key), btnMinimapEl.classList.toggle('active', key));
    };
    setTimeout(item, 150);
  }
  (btnToggleDotsEl &&
    (applySnapGridEnabled?.(readSnapGridEnabled?.(), { emitEvent: false }),
    btnToggleDotsEl.addEventListener('click', () => {
      const index = !readSnapGridEnabled?.();
      (applySnapGridEnabled?.(index),
        window.showToast?.(
          index ? t('appBusinessEvents.toggles.snapGrid.on') : t('appBusinessEvents.toggles.snapGrid.off'),
        ));
    })),
    applyGridDotsPrefFromStorage?.(),
    void showDevToast);
}
