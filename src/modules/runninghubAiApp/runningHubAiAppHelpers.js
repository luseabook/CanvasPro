// Small normalization/formatting helpers extracted from RunningHubAiAppManager.js.

import {
  COMPONENT_KIND_LABELS,
  CONTROL_TYPE_LABELS,
  DEFAULT_AI_APP_NAME,
  JSON_FILE_EXTENSION_RE,
  OUTPUT_KIND_LABELS,} from './RunningHubAiAppManager.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
export function normalizeKind(item) {
  return Object.hasOwn(OUTPUT_KIND_LABELS, item) ? item : 'image';
}
export function shouldReduceMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}
export function normalizeComponentKind(key) {
  return Object.hasOwn(COMPONENT_KIND_LABELS, key) ? key : 'param';
}
export function normalizeControlType(index) {
  const result = String(index || '')
    .trim()
    .toLowerCase();
  if (result === 'integer' || result === 'number') return 'stepper';
  if (result === 'decimal') return 'float';
  if (result === 'boolean' || result === 'bool') return 'toggle';
  return Object.hasOwn(CONTROL_TYPE_LABELS, result) ? result : 'text';
}
export function cloneComponentDrafts(list = []) {
  return Array.isArray(list) ? list.map((args) => ({ ...args })) : [];
}
export function normalizeAppName(data) {
  const target = String(data || '').trim();
  return target || DEFAULT_AI_APP_NAME;
}
export function normalizeDroppedJsonAppName(source) {
  const next = String(source || '')
    .split(/[\\/]/)
    .pop()
    .replace(JSON_FILE_EXTENSION_RE, '')
    .trim();
  return normalizeAppName(next);
}
export function isJsonFile(error) {
  const current = String(error?.name || '').trim(),
    entry = String(error?.type || '')
      .trim()
      .toLowerCase();
  return JSON_FILE_EXTENSION_RE.test(current) || entry === 'application/json';
}
export function hasFileDragPayload(record) {
  return Array.from(record?.dataTransfer?.types || []).some(
    (payload) => String(payload || '').toLowerCase() === 'files',
  );
}
export function normalizeAppDescription(handle) {
  return String(handle || '').trim();
}
export function normalizePromptHelpTooltip(state) {
  return String(state || '').trim();
}
export function getBundleDisplayName(config) {
  return normalizeAppName(config?.models?.[0]?.displayName);
}
