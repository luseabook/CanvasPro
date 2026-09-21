import { t } from '../i18n/index.js';
export const GENERATE_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
export const GENERATE_LOADING_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
export const GENERATE_CANCEL_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g class="v2-task-cancel-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
function generateButtonText(_0x158a52, _0x197f95 = {}) {
  return t('previewGenerateButton.' + _0x158a52, _0x197f95);
}
function normalizeTitle(_0x3768e0) {
  const _0x508fbc = generateButtonText('generate');
  return String(_0x3768e0 || _0x508fbc).trim() || _0x508fbc;
}
function applyTooltip(_0x515d65, _0x56fd82) {
  if (!_0x515d65?.dataset) return;
  const _0x3af06e = String(_0x56fd82 || '').trim();
  if (_0x3af06e) _0x515d65.dataset.tooltip = _0x3af06e;
  else delete _0x515d65.dataset.tooltip;
}
export function setGenerateButtonLoadingUi(
  _0x172a2f,
  {
    title: title = generateButtonText('generate'),
    tooltip: tooltip = '',
    disabled: disabled = true,
    ariaLabel: ariaLabel = '',
  } = {},
) {
  if (!_0x172a2f) return;
  _0x172a2f.disabled = disabled === true;
  if (_0x172a2f.style) _0x172a2f.style.color = '';
  (_0x172a2f.classList?.remove?.('is-rh-busy', 'is-task-cancel'), applyTooltip(_0x172a2f, tooltip));
  const _0x4c0d44 = normalizeTitle(ariaLabel || title);
  (_0x172a2f.setAttribute?.('aria-label', _0x4c0d44),
    (_0x172a2f.title = normalizeTitle(title)),
    (_0x172a2f.innerHTML = GENERATE_LOADING_ICON_HTML));
}
export function setGenerateButtonCancellableUi(
  _0x5962a0,
  {
    title: title = generateButtonText('clickCancelTask'),
    tooltip: tooltip = generateButtonText('clickCancelTask'),
    ariaLabel: ariaLabel = generateButtonText('cancelGenerate'),
    color: color = 'var(--white)',
    busy: busy = false,
  } = {},
) {
  if (!_0x5962a0) return;
  _0x5962a0.disabled = false;
  if (_0x5962a0.style) _0x5962a0.style.color = color;
  (_0x5962a0.classList?.toggle?.('is-rh-busy', busy === true),
    _0x5962a0.classList?.add?.('is-task-cancel'),
    applyTooltip(_0x5962a0, tooltip),
    _0x5962a0.setAttribute?.('aria-label', String(ariaLabel || generateButtonText('cancelGenerate'))),
    (_0x5962a0.title = String(title || generateButtonText('clickCancelTask'))),
    (_0x5962a0.innerHTML = GENERATE_CANCEL_ICON_HTML));
}
export function resetGenerateButtonIdleUi(_0x2ea6f8, _0x5d0f1d = generateButtonText('generate')) {
  if (!_0x2ea6f8) return;
  _0x2ea6f8.disabled = false;
  if (_0x2ea6f8.style) _0x2ea6f8.style.color = '';
  (_0x2ea6f8.classList?.remove?.('is-rh-busy', 'is-task-cancel'),
    applyTooltip(_0x2ea6f8, ''),
    _0x2ea6f8.setAttribute?.('aria-label', normalizeTitle(_0x5d0f1d)),
    (_0x2ea6f8.title = normalizeTitle(_0x5d0f1d)),
    (_0x2ea6f8.innerHTML = GENERATE_ICON_HTML));
}
export function setPreviewGenerateButtonLoading(_0x5991fa) {
  setGenerateButtonLoadingUi(_0x5991fa);
}
export function resetPreviewGenerateButton(_0x80cbbd, _0x3e6f61 = generateButtonText('generate')) {
  resetGenerateButtonIdleUi(_0x80cbbd, _0x3e6f61);
}
export function createPreviewGenerateButtonCallbacks(_0x508bba, _0x5188b2 = generateButtonText('generate')) {
  return {
    onStart() {
      setPreviewGenerateButtonLoading(_0x508bba?.btnEl);
    },
    onStop() {
      (resetPreviewGenerateButton(_0x508bba?.btnEl, _0x5188b2), _0x508bba?._updateSubmitButtonState?.());
    },
  };
}
