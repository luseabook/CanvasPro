// Shared helpers extracted from storyWorkspace.js (asset/episode selection + text).

import {
  toggleWorkspaceAssetSelectAll,
  toggleWorkspaceAssetSelection,
} from '../workspaceAssetSelection.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function normalizeText(item) {
  return String(item || '').trim();
}
export function syncStoryClipFrameCardSaveError(el, key = '') {
  if (!el) return false;
  const text = normalizeText(key);
  el.classList?.toggle?.('is-save-error', Boolean(text));
  if (text) el.setAttribute?.('data-tooltip', text);
  else el.removeAttribute?.('data-tooltip');
  return (
    el.removeAttribute?.('data-native-title'),
    el.removeAttribute?.('data-tooltip-source'),
    el.removeAttribute?.('title'),
    true
  );
}
export function toggleStoryAssetSelectAll(list = [], index = []) {
  return toggleWorkspaceAssetSelectAll(list, index);
}
export function toggleStoryAssetSelection(list2 = [], result = '', data = false) {
  return toggleWorkspaceAssetSelection(list2, result, data);
}
export function updateStoryAssetBatchButtonLabel(el2, options = '') {
  const el3 = el2?.querySelector?.('.story-asset-batch-trigger-label');
  if (!el3) return false;
  return ((el3.textContent = String(options ?? '')), true);
}
export function toggleStoryEpisodeSelectAll(list3 = [], target = []) {
  return toggleStoryAssetSelectAll(list3, target);
}
export function toModelSearchText(options2 = {}) {
  return [options2.label, options2.providerLabel, options2.description, options2.modelId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
export function isUsableImageUrl(source) {
  return /^(?:https?:|blob:|data:|\/|images\/|assets\/)/i.test(normalizeText(source));
}
