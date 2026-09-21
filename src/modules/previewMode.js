import { startLoading, stopLoading } from './loadingOverlay.js';
const PREVIEW_MODE_EVENT = 'preview-mode-changed',
  previewLoadingRegistry = new Map();
function normalizeNodeId(_0x3cd101) {
  return String(_0x3cd101 || '').trim();
}
function getBody() {
  return globalThis.document?.body || null;
}
function broadcastPreviewMode(_0x5a01b4) {
  try {
    globalThis.window?.dispatchEvent?.(
      new CustomEvent(PREVIEW_MODE_EVENT, { detail: { enabled: _0x5a01b4 === true } }),
    );
  } catch {}
}
function setBodyPreviewModeClass(_0x5e1040) {
  getBody()?.classList?.toggle('preview-mode', _0x5e1040 === true);
}
function callPreviewLoadingCallback(_0x4d344f, _0x2a1500) {
  const _0x4af7c1 = _0x4d344f?.options?.[_0x2a1500];
  if (typeof _0x4af7c1 !== 'function') return;
  try {
    _0x4af7c1();
  } catch {}
}
function stopPreviewLoadingEntry(_0x517940) {
  if (!_0x517940?.containerEl) return;
  (stopLoading(_0x517940.containerEl), callPreviewLoadingCallback(_0x517940, 'onStop'));
}
export function isPreviewModeEnabled() {
  return globalThis.window?.PREVIEW_MODE === true;
}
export function setPreviewMode(_0x411529) {
  const _0x29cc40 = _0x411529 === true;
  return (
    globalThis.window && (globalThis.window.PREVIEW_MODE = _0x29cc40),
    setBodyPreviewModeClass(_0x29cc40),
    !_0x29cc40 && clearAllPreviewNodeLoadings(),
    broadcastPreviewMode(_0x29cc40),
    _0x29cc40
  );
}
export function isPreviewNodeLoading(_0x201302) {
  const _0x2d005b = normalizeNodeId(_0x201302);
  if (!_0x2d005b) return false;
  return previewLoadingRegistry.has(_0x2d005b);
}
export function startPreviewNodeLoading(_0x5c0595, _0xe4d023, _0x5b7dd6 = {}) {
  const _0x4f9fcf = normalizeNodeId(_0x5c0595);
  if (!_0x4f9fcf || !_0xe4d023) return false;
  const _0x292442 = previewLoadingRegistry.get(_0x4f9fcf);
  _0x292442 && stopPreviewLoadingEntry(_0x292442);
  const _0x96ba6b = { containerEl: _0xe4d023, options: _0x5b7dd6 };
  return (
    previewLoadingRegistry.set(_0x4f9fcf, _0x96ba6b),
    startLoading(_0xe4d023, _0x5b7dd6),
    callPreviewLoadingCallback(_0x96ba6b, 'onStart'),
    true
  );
}
export function syncPreviewNodeLoading(_0x57aaab, _0x5d5977, _0x2a8884 = null) {
  const _0x522ced = normalizeNodeId(_0x57aaab);
  if (!_0x522ced || !_0x5d5977) return false;
  const _0x37fba7 = previewLoadingRegistry.get(_0x522ced);
  if (!_0x37fba7) return false;
  const _0x388af7 =
      _0x2a8884 && typeof _0x2a8884 === 'object'
        ? { ...(_0x37fba7.options || {}), ..._0x2a8884 }
        : _0x37fba7.options || {},
    _0x51f828 = _0x37fba7.containerEl !== _0x5d5977 || _0x2a8884 != null;
  _0x51f828 && stopPreviewLoadingEntry(_0x37fba7);
  const _0x4dafd7 = { ..._0x37fba7, containerEl: _0x5d5977, options: _0x388af7 };
  return (
    previewLoadingRegistry.set(_0x522ced, _0x4dafd7),
    startLoading(_0x5d5977, _0x388af7),
    _0x51f828 && callPreviewLoadingCallback(_0x4dafd7, 'onStart'),
    true
  );
}
export function stopPreviewNodeLoading(_0xacebff) {
  const _0x300de9 = normalizeNodeId(_0xacebff);
  if (!_0x300de9) return false;
  const _0x389ca2 = previewLoadingRegistry.get(_0x300de9);
  if (!_0x389ca2) return false;
  return (previewLoadingRegistry.delete(_0x300de9), stopPreviewLoadingEntry(_0x389ca2), true);
}
export function clearAllPreviewNodeLoadings() {
  for (const _0xb99990 of previewLoadingRegistry.values()) {
    stopPreviewLoadingEntry(_0xb99990);
  }
  previewLoadingRegistry.clear();
}
export function _resetPreviewRuntimeForTests() {
  (clearAllPreviewNodeLoadings(),
    globalThis.window && (globalThis.window.PREVIEW_MODE = false),
    setBodyPreviewModeClass(false));
}
