import {
  captureWorkspaceNestedScrollPositions,
  captureWorkspaceScrollPosition,
  restoreWorkspaceNestedScrollPositions,
  restoreWorkspaceScrollPosition,
  scrollWorkspaceTrackWithWheel,
  shouldPreserveWorkspaceNestedWheel,
} from '../workspaceWheelNavigation.js';
import {
  beginWorkspaceHorizontalResizeSession,
  beginWorkspaceVerticalResizeSession,
} from '../workspaceResizeSession.js';
import {
  applyWorkspaceAssetDetailSplitRatioToLayout,
  applyWorkspaceAssetSplitRatioToLayout,
  normalizeWorkspaceAssetDetailSplitRatio,
  normalizeWorkspaceAssetSplitRatio,
} from '../workspaceAssetSettingsShell.js';
export function isStoryGenerateShortcut(event) {
  return (
    String(event?.['key'] || '') === 'Enter' &&
    (event?.['ctrlKey'] === !![] || event?.['metaKey'] === !![]) &&
    event?.['altKey'] !== !![] &&
    event?.['shiftKey'] !== !![] &&
    event?.['isComposing'] !== !![]
  );
}
const STORY_WORKSPACE_NESTED_WHEEL_SELECTOR =
    'textarea, [contenteditable="true"], .node-model-submenu, .story-style-grid, .story-assets-list, .story-episode-assets, [data-workspace-episode-rail-list], .story-clip-prompt-history-list, .story-clip-strip',
  STORY_WORKSPACE_PERSISTENT_NESTED_SCROLL_SELECTORS = Object['freeze']([
    '.story-assets-list',
    '.story-asset-prompt-editor',
    '.story-character-voice-history-list',
    '[data-workspace-episode-rail-list]',
    '[data-story-episode-asset-panel]',
    '.story-clip-editor',
    '.story-clip-prompt-comparison',
    '.story-clip-prompt-version-content',
    '.story-clip-generation-actions',
    '.story-clip-strip',
  ]);
export const STORY_ASSET_HOVER_CARD_SELECTOR =
  '[data-story-asset-id], [data-story-reference-asset], [data-story-asset-hover-id]';
export function shouldPreserveStoryWorkspaceNestedWheel(value, args = {}) {
  return shouldPreserveWorkspaceNestedWheel(value, {
    ...args,
    nestedSelector: STORY_WORKSPACE_NESTED_WHEEL_SELECTOR,
    boundarySelector: '.story-workspace-root',
  });
}
export function captureStoryAssetListScrollPosition(el) {
  const item = el?.['querySelector']?.('.story-assets-list');
  return captureWorkspaceScrollPosition(item);
}
export function restoreStoryAssetListScrollPosition(el2, key) {
  const index = el2?.['querySelector']?.('.story-assets-list');
  return restoreWorkspaceScrollPosition(index, key);
}
export function captureStoryWorkspaceNestedScrollPositions(result) {
  return captureWorkspaceNestedScrollPositions(result, STORY_WORKSPACE_PERSISTENT_NESTED_SCROLL_SELECTORS);
}
export function restoreStoryWorkspaceNestedScrollPositions(data, options) {
  return restoreWorkspaceNestedScrollPositions(data, options);
}
export function scrollStoryClipStripWithWheel(target) {
  return scrollWorkspaceTrackWithWheel(target, '.story-clip-strip');
}
export function scrollStoryClipPromptHistoryWithWheel(event2) {
  const el3 = event2?.['target']?.['closest']?.('.story-clip-prompt-history-list');
  if (!el3) return ![];
  const count = Math['max'](0, Number(el3['scrollHeight'] || 0) - Number(el3['clientHeight'] || 0));
  if (count <= 0) return ![];
  const source = Math['max'](0, Number(el3['scrollTop']) || 0),
    next = Math['max'](0, Math['min'](count, source + Number(event2['deltaY'] || 0)));
  return (event2['preventDefault']?.(), event2['stopPropagation']?.(), (el3['scrollTop'] = next), !![]);
}
export function getStoryAssetHoverCard(el4) {
  return el4?.['closest']?.(STORY_ASSET_HOVER_CARD_SELECTOR) || null;
}
export function getStoryAssetHoverCardId(el5) {
  return String(
    el5?.['dataset']?.['storyAssetHoverId'] ||
      el5?.['dataset']?.['storyAssetId'] ||
      el5?.['dataset']?.['storyReferenceAsset'] ||
      '',
  );
}
export function getStoryAssetHoverCardAppearanceId(el6) {
  return String(el6?.['dataset']?.['storyAssetHoverAppearanceId'] || '');
}
export function findStoryAssetForHover(current, entry, record = []) {
  const payload = String(entry || '');
  return (
    (Array['isArray'](current?.['data']?.['assets']) ? current['data']['assets'] : [])['find'](
      (handle) => String(handle?.['id']) === payload,
    ) ||
    (Array['isArray'](record) ? record : [])['find']((state) => String(state?.['id']) === payload) ||
    null
  );
}
export function normalizeStoryAssetSplitRatio(config) {
  return normalizeWorkspaceAssetSplitRatio(config);
}
export function normalizeStoryAssetDetailSplitRatio(scope) {
  return normalizeWorkspaceAssetDetailSplitRatio(scope);
}
export function normalizeStoryEpisodePanelRatios(input, output) {
  const left = Math['max'](14, Math['min'](0x22, Number['isFinite'](Number(input)) ? Number(input) : 22)),
    value2 = Math['max'](24, Math['min'](50, Number['isFinite'](Number(output)) ? Number(output) : 0x22));
  return { left: left, center: Math['min'](value2, 76 - left) };
}
export function applyStoryAssetSplitRatioToLayout(value3, value4, value5) {
  return applyWorkspaceAssetSplitRatioToLayout(value3, value4, value5);
}
export function applyStoryAssetDetailSplitRatioToLayout(value6, value7, value8) {
  return applyWorkspaceAssetDetailSplitRatioToLayout(value6, value7, value8, {
    styleProperty: '--story-asset-detail-top',
  });
}
export function applyStoryEpisodePanelRatiosToLayout(
  el7,
  { assetSplitter: assetSplitter = null, previewSplitter: previewSplitter = null } = {},
  value9,
  value10,
) {
  const box = normalizeStoryEpisodePanelRatios(value9, value10);
  return (
    el7?.['style']?.['setProperty']?.('--story-episode-assets-width', box['left'] + '%'),
    el7?.['style']?.['setProperty']?.('--story-episode-editor-width', box['center'] + '%'),
    assetSplitter?.['setAttribute']?.('aria-valuenow', String(Math['round'](box['left']))),
    previewSplitter?.['setAttribute']?.('aria-valuenow', String(Math['round'](box['left'] + box['center']))),
    box
  );
}
export function beginStoryHorizontalResizeSession({ ...args2 } = {}) {
  return beginWorkspaceHorizontalResizeSession(args2);
}
export function beginStoryVerticalResizeSession({ ...args3 } = {}) {
  return beginWorkspaceVerticalResizeSession(args3);
}
