// Module-level helpers extracted from AssetManager.js.

import { getLocale, t } from '../i18n/index.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { createReferenceFallbackThumbHtml } from './referenceThumbnailFallback.js';
import {
  resolveAssetNodeCoverUrl,
  resolveMaterialItemPreviewUrl,
  resolveMaterialItemThumbUrl,
} from './assetCoverResolver.js';

export const ASSET_CATEGORY_I18N_KEYS = Object.freeze({
  人物: 'people',
  场景: 'scenes',
  物品: 'objects',
  风格: 'styles',
  音效: 'soundEffects',
  Others: 'others',
  剧本资产: 'storyWorkspace',
  替换工作室: 'replacementStudio',
  替换工作室资产: 'replacementStudio',
  替换工作室入参: 'replacementStudio',
  出图历史: 'history',
  自定义: 'custom',
});

export function assetManagerText(value, item = {}) {
  return t('assetManager.' + value, item);
}
export function _formatAssetCategoryLabel(key) {
  const index = String(key || '').trim(),
    result = ASSET_CATEGORY_I18N_KEYS[index];
  return result ? assetManagerText('categories.' + result) : index;
}
export function _escapeHtml(data) {
  return String(data ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
export function _clonePlain(options, target) {
  if (options == null) return target;
  try {
    return JSON.parse(JSON.stringify(options));
  } catch (source) {
    return target;
  }
}
export function _normalizeAssetType(next) {
  const current = String(next || '');
  if (current === 'text' || current === 'source-text' || current === 'ai-text') return 'text';
  if (current === 'audio' || current === 'source-audio' || current === 'ai-audio') return 'audio';
  if (current === 'video' || current === 'source-video' || current === 'ai-video') return 'video';
  if (current === 'image' || current === 'source-image' || current === 'ai-image') return 'image';
  return 'other';
}
export function _formatAssetTypeLabel(entry) {
  const _normalizeAssetType2 = _normalizeAssetType(entry);
  return assetManagerText('types.' + _normalizeAssetType2);
}
export function _resolveNodeStableThumbSrc(enabled) {
  if (!enabled) return '';
  const record =
    enabled.thumbLocalPath ||
    enabled.displayLocalPath ||
    enabled.localPath ||
    enabled.originalLocalPath;
  if (record)
    return (
      localPathToUrl(record) ||
      (String(record).startsWith('/')
        ? String(record)
        : '/' + String(record).replace(/^\/+/, ''))
    );
  if (enabled.thumbUrl && typeof enabled.thumbUrl === 'string') return enabled.thumbUrl;
  return String(enabled.src || enabled.imageUrl || '');
}
export function _renderAssetIcon(payload) {
  const _normalizeAssetType3 = _normalizeAssetType(payload);
  if (_normalizeAssetType3 === 'text') return createReferenceFallbackThumbHtml('text', 'v2-asset-icon');
  if (_normalizeAssetType3 === 'audio') return createReferenceFallbackThumbHtml('audio', 'v2-asset-icon');
  if (_normalizeAssetType3 === 'video')
    return '<div class="v2-asset-icon v2-asset-icon--video" aria-hidden="true">\n      <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">\n        <polygon points="5 3 19 12 5 21 5 3" />\n      </svg>\n    </div>';
  return '<div class="v2-asset-icon v2-asset-icon--other" aria-hidden="true">\n    <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">\n      <rect x="3" y="3" width="18" height="18" rx="2" />\n    </svg>\n  </div>';
}
export function _buildAssetItem(name) {
  const type = name?.type || 'other',
    thumbSrc = resolveAssetNodeCoverUrl(name) || _resolveNodeStableThumbSrc(name);
  return { type: type, name: name?.name || '', thumbSrc: thumbSrc || '', nodeData: name };
}
export function _resolveMaterialItemThumbSrc(handle) {
  return String(
    resolveMaterialItemThumbUrl(handle) || _resolveNodeStableThumbSrc(handle?.nodeData) || '',
  );
}
export function _resolveMaterialItemPreviewSrc(state) {
  return String(resolveMaterialItemPreviewUrl(state) || _resolveMaterialItemThumbSrc(state));
}
export function _sortAssetsByUpdatedTime(config) {
  return [...(Array.isArray(config) ? config : [])].sort((scope, input) => {
    const output = Number(scope?.updatedAt || scope?.createdAt || 0),
      value2 = Number(input?.updatedAt || input?.createdAt || 0);
    return value2 - output;
  });
}
export function _formatAssetDateTime(value3) {
  const count2 = Number(value3);
  if (!Number.isFinite(count2) || count2 <= 0) return assetManagerText('unknownTime');
  return new Date(count2).toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
