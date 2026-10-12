// Asset/card presentation helpers extracted from storyWorkspace.js.

import {
  escapeHtml,
  isUsableImageUrl,
  normalizeText,
} from './storyWorkspaceSharedHelpers.js';
import { STORY_ASSET_TAB_LABELS } from './storyProjectSession.js';
import {
  buildWorkspaceAssetHoverPreviewContent,
  consumeWorkspaceWheelDirection,
  isWorkspaceAssetHoverLandscape,
  renderWorkspaceAssetTabIcon,
  resolveWorkspaceTabTransitionDirection,
} from '../workspaceAssetPresentation.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
import { hasStoryCharacterVoiceReference } from './storyCharacterVoice.js';

export const STORY_ASSET_TAB_ORDER = Object.freeze(['character', 'scene', 'prop', 'audio', 'library']);

export function getStoryAssetHoverGridColumns(next) {
  const current = Math.max(1, Math.floor(Number(next) || 1));
  return Math.ceil(Math.sqrt(current));
}
export function isStoryAssetHoverLandscape(entry, record) {
  return isWorkspaceAssetHoverLandscape(entry, record);
}
export function getGeneratedStoryAssetHoverAppearances(list4 = [], payload = '') {
  const text2 = normalizeText(payload);
  return (Array.isArray(list4) ? list4 : []).filter(
    (handle) =>
      Boolean(normalizeText(handle?.imageUrl)) && (!text2 || normalizeText(handle?.id) === text2),
  );
}
export function buildStoryAssetHoverPreviewContent(
  state,
  {
    appearanceId: appearanceId = '',
    selectedAssetId: selectedAssetId = '',
    selectedAppearanceId: selectedAppearanceId = '',
    mediaOnly: mediaOnly = false,
  } = {},
) {
  return buildWorkspaceAssetHoverPreviewContent(state, {
    appearanceId: appearanceId,
    selectedAssetId: selectedAssetId,
    selectedAppearanceId: selectedAppearanceId,
    mediaOnly: mediaOnly,
    getAppearances: getStoryAssetAppearances,
    hasVoiceReference: hasStoryCharacterVoiceReference,
  });
}
export function resolveStoryAppearanceWheelDelta(event2) {
  const config = Number(event2?.deltaX || 0),
    scope = Number(event2?.deltaY || 0),
    input = Math.abs(scope) >= Math.abs(config) ? scope : config,
    count = Number(event2?.deltaMode || 0),
    output = count === 1 ? 16 : count === 2 ? 800 : 1;
  return input * output;
}
export function consumeStoryWheelDirection(
  value2,
  value3,
  { threshold: threshold = 24, lockDuration: lockDuration = 220, now: now = Date.now() } = {},
) {
  return consumeWorkspaceWheelDirection(value2, value3, {
    threshold: threshold,
    lockDuration: lockDuration,
    now: now,
  });
}
export function getStoryAssetTabLabel(value4) {
  return STORY_ASSET_TAB_LABELS[value4] || STORY_ASSET_TAB_LABELS.character;
}
export function getStoryAssetTabTransitionDirection(value5, value6) {
  return resolveWorkspaceTabTransitionDirection(value5, value6, STORY_ASSET_TAB_ORDER);
}
export function renderStoryAssetTabIcon(value7) {
  return renderWorkspaceAssetTabIcon(value7);
}
const STORY_ASSET_PACKAGE_CATEGORY = '剧本资产';
export function buildStoryAssetPackageItemRequest({
  project: project = {},
  asset: asset = {},
  appearance: appearance = {},
  image: image = null,
} = {}) {
  const sourceProjectId = normalizeText(project?.id),
    sourceStoryAssetId = normalizeText(asset?.id),
    sourceStoryAppearanceId = normalizeText(appearance?.id),
    packageName = normalizeText(project?.title) || '未命名剧本',
    sourceStoryAssetKind = ['scene', 'prop'].includes(normalizeText(asset?.kind))
      ? normalizeText(asset.kind)
      : 'character',
    itemName = getStoryAssetTabLabel(sourceStoryAssetKind),
    text3 = normalizeText(asset?.name) || '未命名' + itemName,
    text4 = normalizeText(appearance?.name) || '基础形象',
    response =
      image && typeof image === 'object'
        ? image
        : {
            ...(appearance?.generatedImage && typeof appearance.generatedImage === 'object'
              ? appearance.generatedImage
              : {}),
            imageUrl: normalizeText(appearance?.imageUrl),
          };
  return {
    packageKey: 'story-project:' + sourceProjectId,
    packageName: packageName,
    category: STORY_ASSET_PACKAGE_CATEGORY,
    itemKey: 'story-appearance:' + sourceStoryAssetId + ':' + sourceStoryAppearanceId,
    itemName: itemName + '｜' + text3 + '｜' + text4,
    image: {
      ...response,
      imageUrl: normalizeText(
        response.imageUrl || response.displayUrl || response.url || appearance?.imageUrl,
      ),
    },
    metadata: { sourceKind: 'story-workspace', sourceProjectId: sourceProjectId },
    itemMetadata: {
      sourceKind: 'story-workspace',
      sourceProjectId: sourceProjectId,
      sourceStoryAssetId: sourceStoryAssetId,
      sourceStoryAppearanceId: sourceStoryAppearanceId,
      sourceStoryAssetKind: sourceStoryAssetKind,
    },
  };
}
export function renderImageOrEmpty({
  imageUrl: imageUrl = '',
  fallbackImageUrl: fallbackImageUrl = '',
  workspaceAssetLibraryImage: workspaceAssetLibraryImage = false,
  alt: alt = '',
  className: className = '',
} = {}) {
  if (isUsableImageUrl(imageUrl)) {
    const text5 = normalizeText(imageUrl),
      text6 = normalizeText(fallbackImageUrl),
      value8 = workspaceAssetLibraryImage
        ? ' data-workspace-asset-library-image' +
          (isUsableImageUrl(text6) && text6 !== text5
            ? ' data-workspace-asset-library-fallback-src="' + escapeHtml(text6) + '"'
            : '')
        : '';
    return (
      '<img class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(text5) +
      '" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" decoding="async"' +
      value8 +
      '>'
    );
  }
  return (
    '<div class="' +
    escapeHtml(className) +
    ' story-media-empty" role="img" aria-label="' +
    escapeHtml(alt + '待生成') +
    '">\n    <span>待生成</span>\n  </div>'
  );
}
