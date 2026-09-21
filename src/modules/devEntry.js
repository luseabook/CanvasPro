import { showLocalUpdatePreview } from './AutoUpdate.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { initPerfPanelDevEntry } from './perf/perfPanel.js';
import { isPreviewModeEnabled, setPreviewMode } from './previewMode.js';
import { bindPreviewUploadEntry } from './previewUploadEntry.js';
const DEV_ENTRY_WRAP_ID = 'devEntryWrap',
  LEGACY_DEV_HELPER_ID = 'dev-shortcut-btn';
let syncBound = false,
  perfPanelController = null,
  localeUnsubscribe = null;
function devEntryText(_0x2e1fb0, _0x2bb636 = {}) {
  return t('devEntry.' + _0x2e1fb0, _0x2bb636);
}
function setToggleButtonState(_0x6c1268, _0x478fd3, _0x30a1e8) {
  if (!_0x6c1268) return;
  (_0x6c1268.classList.toggle('is-active', _0x478fd3 === true),
    _0x6c1268.setAttribute('aria-pressed', _0x478fd3 === true ? 'true' : 'false'),
    (_0x6c1268.title = _0x478fd3 === true ? _0x30a1e8.on : _0x30a1e8.off));
}
function setDevButtonState(_0x17d947, _0x5d2558) {
  setToggleButtonState(_0x17d947, _0x5d2558, {
    on: devEntryText('titles.devOn'),
    off: devEntryText('titles.devOff'),
  });
}
function setPreviewButtonState(_0x38e20a, _0x10be02) {
  setToggleButtonState(_0x38e20a, _0x10be02, {
    on: devEntryText('titles.previewOn'),
    off: devEntryText('titles.previewOff'),
  });
}
function broadcastDevMode(_0x5a83ec) {
  try {
    window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: { enabled: _0x5a83ec === true } }));
  } catch {}
}
function setDevMode(_0x12f8d9, _0x4a0a53) {
  const _0x14b130 = _0x12f8d9 === true;
  ((window.DEV_MODE = _0x14b130),
    document.body?.classList?.toggle('dev-mode', _0x14b130),
    setDevButtonState(_0x4a0a53, _0x14b130),
    broadcastDevMode(_0x14b130));
}
function createEntryButton({ id: _0x3f0a41, label: _0x1aaeb9, title: _0x182d2c, className: className = '' }) {
  const _0x638160 = document.createElement('button');
  return (
    (_0x638160.type = 'button'),
    (_0x638160.id = _0x3f0a41),
    (_0x638160.className = ('dev-entry-btn ' + className).trim()),
    (_0x638160.title = _0x182d2c),
    _0x638160.setAttribute('aria-label', _0x182d2c),
    (_0x638160.textContent = _0x1aaeb9),
    _0x638160
  );
}
function setButtonTextAndTitle(_0x5c28fe, _0x1ec846, _0x24bfa7) {
  if (!_0x5c28fe) return;
  ((_0x5c28fe.textContent = _0x1ec846),
    (_0x5c28fe.title = _0x24bfa7),
    _0x5c28fe.setAttribute('aria-label', _0x24bfa7));
}
function syncDevEntryTexts() {
  const _0xadfc5a = document.getElementById('devEntryModeBtn');
  (setButtonTextAndTitle(_0xadfc5a, devEntryText('buttons.dev'), devEntryText('titles.devOff')),
    setDevButtonState(_0xadfc5a, Boolean(window.DEV_MODE)));
  const _0x302cb8 = document.getElementById('devEntryPreviewModeBtn');
  (setButtonTextAndTitle(_0x302cb8, devEntryText('buttons.preview'), devEntryText('titles.previewOff')),
    setPreviewButtonState(_0x302cb8, isPreviewModeEnabled()),
    setButtonTextAndTitle(
      document.getElementById('devEntryPreviewUploadBtn'),
      devEntryText('buttons.upload'),
      devEntryText('titles.upload'),
    ),
    setButtonTextAndTitle(
      document.getElementById('devEntryUpdatePreviewBtn'),
      devEntryText('buttons.updatePreview'),
      devEntryText('titles.updatePreview'),
    ));
}
function bindLocaleSync() {
  if (localeUnsubscribe) return;
  localeUnsubscribe = onLocaleChange(syncDevEntryTexts);
}
function bindExternalModeSync() {
  if (syncBound) return;
  ((syncBound = true),
    window.addEventListener('dev-mode-changed', (_0x565ed3) => {
      const _0xcf8466 = Boolean(_0x565ed3?.detail?.enabled ?? window.DEV_MODE);
      setDevButtonState(document.getElementById('devEntryModeBtn'), _0xcf8466);
    }),
    window.addEventListener('preview-mode-changed', (_0x48e104) => {
      const _0x174422 = Boolean(_0x48e104?.detail?.enabled ?? globalThis.window?.PREVIEW_MODE);
      setPreviewButtonState(document.getElementById('devEntryPreviewModeBtn'), _0x174422);
    }));
}
function removeDevEntries() {
  (perfPanelController?.destroy?.(),
    (perfPanelController = null),
    localeUnsubscribe?.(),
    (localeUnsubscribe = null),
    document.getElementById(DEV_ENTRY_WRAP_ID)?.remove(),
    document.getElementById(LEGACY_DEV_HELPER_ID)?.remove());
}
export function initDevEntries({ isDevBuild: _0x33c655 } = {}) {
  document.getElementById(LEGACY_DEV_HELPER_ID)?.remove();
  const _0x432fd7 = Boolean(_0x33c655);
  ((window.LOCAL_DEV_BUILD = _0x432fd7), document.body?.classList?.toggle('dev-build', _0x432fd7));
  if (!_0x432fd7) {
    (setPreviewMode(false), removeDevEntries());
    return;
  }
  bindExternalModeSync();
  if (document.getElementById(DEV_ENTRY_WRAP_ID)) return;
  const _0x2aa185 = document.createElement('div');
  ((_0x2aa185.id = DEV_ENTRY_WRAP_ID), (_0x2aa185.className = 'dev-entry-wrap'));
  const _0x2dda2e = createEntryButton({
    id: 'devEntryModeBtn',
    label: devEntryText('buttons.dev'),
    title: devEntryText('titles.devOff'),
    className: 'dev-entry-btn-mode',
  });
  (setDevButtonState(_0x2dda2e, Boolean(window.DEV_MODE)),
    _0x2dda2e.addEventListener('click', () => {
      const _0x4873d0 = !Boolean(window.DEV_MODE);
      (setDevMode(_0x4873d0, _0x2dda2e),
        window.showToast?.(_0x4873d0 ? devEntryText('toasts.devOn') : devEntryText('toasts.devOff')));
    }));
  const _0x51b5ae = createEntryButton({
    id: 'devEntryPerfPanelBtn',
    label: 'Perf',
    title: 'Open performance panel',
    className: 'dev-entry-btn-perf dev-mode-only',
  });
  perfPanelController = initPerfPanelDevEntry({ button: _0x51b5ae });
  const _0x417319 = createEntryButton({
    id: 'devEntryPreviewModeBtn',
    label: devEntryText('buttons.preview'),
    title: devEntryText('titles.previewOff'),
    className: 'dev-entry-btn-preview-mode',
  });
  (setPreviewButtonState(_0x417319, isPreviewModeEnabled()),
    _0x417319.addEventListener('click', () => {
      const _0x443103 = !isPreviewModeEnabled();
      (setPreviewMode(_0x443103),
        window.showToast?.(_0x443103 ? devEntryText('toasts.previewOn') : devEntryText('toasts.previewOff')));
    }));
  const _0xdc811c = createEntryButton({
      id: 'devEntryPreviewUploadBtn',
      label: devEntryText('buttons.upload'),
      title: devEntryText('titles.upload'),
      className: 'dev-entry-btn-preview-upload preview-mode-only',
    }),
    _0x3d752f = document.createElement('input');
  ((_0x3d752f.type = 'file'),
    (_0x3d752f.id = 'devEntryPreviewUploadInput'),
    (_0x3d752f.hidden = true),
    bindPreviewUploadEntry({ button: _0xdc811c, input: _0x3d752f }));
  const _0x4ad6e8 = createEntryButton({
    id: 'devEntryUpdatePreviewBtn',
    label: devEntryText('buttons.updatePreview'),
    title: devEntryText('titles.updatePreview'),
    className: 'dev-entry-btn-update-preview',
  });
  (_0x4ad6e8.addEventListener('click', () => {
    showLocalUpdatePreview();
  }),
    _0x2aa185.appendChild(_0x2dda2e),
    _0x2aa185.appendChild(_0x51b5ae),
    _0x2aa185.appendChild(_0x417319),
    _0x2aa185.appendChild(_0xdc811c),
    _0x2aa185.appendChild(_0x3d752f),
    _0x2aa185.appendChild(_0x4ad6e8),
    document.body.appendChild(_0x2aa185),
    bindLocaleSync());
}
