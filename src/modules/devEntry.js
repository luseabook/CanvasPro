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
function devEntryText(value, item = {}) {
  return t('devEntry.' + value, item);
}
function setToggleButtonState(el, key, index) {
  if (!el) return;
  (el.classList.toggle('is-active', key === true),
    el.setAttribute('aria-pressed', key === true ? 'true' : 'false'),
    (el.title = key === true ? index.on : index.off));
}
function setDevButtonState(result, data) {
  setToggleButtonState(result, data, {
    on: devEntryText('titles.devOn'),
    off: devEntryText('titles.devOff'),
  });
}
function setPreviewButtonState(options, target) {
  setToggleButtonState(options, target, {
    on: devEntryText('titles.previewOn'),
    off: devEntryText('titles.previewOff'),
  });
}
function broadcastDevMode(enabled) {
  try {
    window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: { enabled: enabled === true } }));
  } catch {}
}
function setDevMode(source, next) {
  const current = source === true;
  ((window.DEV_MODE = current),
    document.body?.classList?.toggle('dev-mode', current),
    setDevButtonState(next, current),
    broadcastDevMode(current));
}
function createEntryButton({ id: id, label: label, title: title, className: className = '' }) {
  const el2 = document.createElement('button');
  return (
    (el2.type = 'button'),
    (el2.id = id),
    (el2.className = ('dev-entry-btn ' + className).trim()),
    (el2.title = title),
    el2.setAttribute('aria-label', title),
    (el2.textContent = label),
    el2
  );
}
function setButtonTextAndTitle(el3, entry, record) {
  if (!el3) return;
  ((el3.textContent = entry), (el3.title = record), el3.setAttribute('aria-label', record));
}
function syncDevEntryTexts() {
  const payload = document.getElementById('devEntryModeBtn');
  (setButtonTextAndTitle(payload, devEntryText('buttons.dev'), devEntryText('titles.devOff')),
    setDevButtonState(payload, Boolean(window.DEV_MODE)));
  const handle = document.getElementById('devEntryPreviewModeBtn');
  (setButtonTextAndTitle(handle, devEntryText('buttons.preview'), devEntryText('titles.previewOff')),
    setPreviewButtonState(handle, isPreviewModeEnabled()),
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
    window.addEventListener('dev-mode-changed', (state) => {
      const config = Boolean(state?.detail?.enabled ?? window.DEV_MODE);
      setDevButtonState(document.getElementById('devEntryModeBtn'), config);
    }),
    window.addEventListener('preview-mode-changed', (scope) => {
      const input = Boolean(scope?.detail?.enabled ?? globalThis.window?.PREVIEW_MODE);
      setPreviewButtonState(document.getElementById('devEntryPreviewModeBtn'), input);
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
export function initDevEntries({ isDevBuild: isDevBuild } = {}) {
  document.getElementById(LEGACY_DEV_HELPER_ID)?.remove();
  const enabled2 = Boolean(isDevBuild);
  ((window.LOCAL_DEV_BUILD = enabled2), document.body?.classList?.toggle('dev-build', enabled2));
  if (!enabled2) {
    (setPreviewMode(false), removeDevEntries());
    return;
  }
  bindExternalModeSync();
  if (document.getElementById(DEV_ENTRY_WRAP_ID)) return;
  const el4 = document.createElement('div');
  ((el4.id = DEV_ENTRY_WRAP_ID), (el4.className = 'dev-entry-wrap'));
  const el5 = createEntryButton({
    id: 'devEntryModeBtn',
    label: devEntryText('buttons.dev'),
    title: devEntryText('titles.devOff'),
    className: 'dev-entry-btn-mode',
  });
  (setDevButtonState(el5, Boolean(window.DEV_MODE)),
    el5.addEventListener('click', () => {
      const output = !Boolean(window.DEV_MODE);
      (setDevMode(output, el5),
        window.showToast?.(output ? devEntryText('toasts.devOn') : devEntryText('toasts.devOff')));
    }));
  const button = createEntryButton({
    id: 'devEntryPerfPanelBtn',
    label: 'Perf',
    title: 'Open performance panel',
    className: 'dev-entry-btn-perf dev-mode-only',
  });
  perfPanelController = initPerfPanelDevEntry({ button: button });
  const el6 = createEntryButton({
    id: 'devEntryPreviewModeBtn',
    label: devEntryText('buttons.preview'),
    title: devEntryText('titles.previewOff'),
    className: 'dev-entry-btn-preview-mode',
  });
  (setPreviewButtonState(el6, isPreviewModeEnabled()),
    el6.addEventListener('click', () => {
      const value2 = !isPreviewModeEnabled();
      (setPreviewMode(value2),
        window.showToast?.(value2 ? devEntryText('toasts.previewOn') : devEntryText('toasts.previewOff')));
    }));
  const button2 = createEntryButton({
      id: 'devEntryPreviewUploadBtn',
      label: devEntryText('buttons.upload'),
      title: devEntryText('titles.upload'),
      className: 'dev-entry-btn-preview-upload preview-mode-only',
    }),
    input2 = document.createElement('input');
  ((input2.type = 'file'),
    (input2.id = 'devEntryPreviewUploadInput'),
    (input2.hidden = true),
    bindPreviewUploadEntry({ button: button2, input: input2 }));
  const el7 = createEntryButton({
    id: 'devEntryUpdatePreviewBtn',
    label: devEntryText('buttons.updatePreview'),
    title: devEntryText('titles.updatePreview'),
    className: 'dev-entry-btn-update-preview',
  });
  (el7.addEventListener('click', () => {
    showLocalUpdatePreview();
  }),
    el4.appendChild(el5),
    el4.appendChild(button),
    el4.appendChild(el6),
    el4.appendChild(button2),
    el4.appendChild(input2),
    el4.appendChild(el7),
    document.body.appendChild(el4),
    bindLocaleSync());
}

export function toggleDevMode() {
  if (window.LOCAL_DEV_BUILD !== true) return null;
  const value3 = !Boolean(window.DEV_MODE);
  return (
    setDevMode(value3, document.getElementById('devEntryModeBtn')),
    window.showToast?.(value3 ? devEntryText('toasts.devOn') : devEntryText('toasts.devOff')),
    value3
  );
}
