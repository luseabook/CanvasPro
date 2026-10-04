import { startLoading, stopLoading } from './loadingOverlay.js';
const PREVIEW_MODE_EVENT = 'preview-mode-changed',
  previewLoadingRegistry = new Map();
function normalizeNodeId(value) {
  return String(value || '').trim();
}
function getBody() {
  return globalThis.document?.body || null;
}
function broadcastPreviewMode(enabled) {
  try {
    globalThis.window?.dispatchEvent?.(
      new CustomEvent(PREVIEW_MODE_EVENT, { detail: { enabled: enabled === true } }),
    );
  } catch {}
}
function setBodyPreviewModeClass(item) {
  getBody()?.classList?.toggle('preview-mode', item === true);
}
function callPreviewLoadingCallback(key, index) {
  const run = key?.options?.[index];
  if (typeof run !== 'function') return;
  try {
    run();
  } catch {}
}
function stopPreviewLoadingEntry(enabled2) {
  if (!enabled2?.containerEl) return;
  (stopLoading(enabled2.containerEl), callPreviewLoadingCallback(enabled2, 'onStop'));
}
export function isPreviewModeEnabled() {
  return globalThis.window?.PREVIEW_MODE === true;
}
export function setPreviewMode(result) {
  const enabled3 = result === true;
  return (
    globalThis.window && (globalThis.window.PREVIEW_MODE = enabled3),
    setBodyPreviewModeClass(enabled3),
    !enabled3 && clearAllPreviewNodeLoadings(),
    broadcastPreviewMode(enabled3),
    enabled3
  );
}
export function isPreviewNodeLoading(data) {
  const nodeId = normalizeNodeId(data);
  if (!nodeId) return false;
  return previewLoadingRegistry.has(nodeId);
}
export function startPreviewNodeLoading(options, containerEl, options2 = {}) {
  const nodeId2 = normalizeNodeId(options);
  if (!nodeId2 || !containerEl) return false;
  const target = previewLoadingRegistry.get(nodeId2);
  target && stopPreviewLoadingEntry(target);
  const source = { containerEl: containerEl, options: options2 };
  return (
    previewLoadingRegistry.set(nodeId2, source),
    startLoading(containerEl, options2),
    callPreviewLoadingCallback(source, 'onStart'),
    true
  );
}
export function syncPreviewNodeLoading(next, containerEl2, args = null) {
  const nodeId3 = normalizeNodeId(next);
  if (!nodeId3 || !containerEl2) return false;
  const args2 = previewLoadingRegistry.get(nodeId3);
  if (!args2) return false;
  const options3 =
      args && typeof args === 'object' ? { ...(args2.options || {}), ...args } : args2.options || {},
    current = args2.containerEl !== containerEl2 || args != null;
  current && stopPreviewLoadingEntry(args2);
  const entry = { ...args2, containerEl: containerEl2, options: options3 };
  return (
    previewLoadingRegistry.set(nodeId3, entry),
    startLoading(containerEl2, options3),
    current && callPreviewLoadingCallback(entry, 'onStart'),
    true
  );
}
export function stopPreviewNodeLoading(record) {
  const nodeId4 = normalizeNodeId(record);
  if (!nodeId4) return false;
  const enabled4 = previewLoadingRegistry.get(nodeId4);
  if (!enabled4) return false;
  return (previewLoadingRegistry.delete(nodeId4), stopPreviewLoadingEntry(enabled4), true);
}
export function clearAllPreviewNodeLoadings() {
  for (const payload of previewLoadingRegistry.values()) {
    stopPreviewLoadingEntry(payload);
  }
  previewLoadingRegistry.clear();
}
export function _resetPreviewRuntimeForTests() {
  (clearAllPreviewNodeLoadings(),
    globalThis.window && (globalThis.window.PREVIEW_MODE = false),
    setBodyPreviewModeClass(false));
}
