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
export function isStoryGenerateShortcut(_0x28baf8) {
  return (
    String(_0x28baf8?.['key'] || '') === 'Enter' &&
    (_0x28baf8?.['ctrlKey'] === !![] || _0x28baf8?.['metaKey'] === !![]) &&
    _0x28baf8?.['altKey'] !== !![] &&
    _0x28baf8?.['shiftKey'] !== !![] &&
    _0x28baf8?.['isComposing'] !== !![]
  );
}
const STORY_WORKSPACE_NESTED_WHEEL_SELECTOR =
    'textarea,\x20[contenteditable=\x22true\x22],\x20.node-model-submenu,\x20.story-style-grid,\x20.story-assets-list,\x20.story-episode-assets,\x20[data-workspace-episode-rail-list],\x20.story-clip-prompt-history-list,\x20.story-clip-strip',
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
export function shouldPreserveStoryWorkspaceNestedWheel(_0x10eaf8, _0x209a1d = {}) {
  return shouldPreserveWorkspaceNestedWheel(_0x10eaf8, {
    ..._0x209a1d,
    nestedSelector: STORY_WORKSPACE_NESTED_WHEEL_SELECTOR,
    boundarySelector: '.story-workspace-root',
  });
}
export function captureStoryAssetListScrollPosition(_0x1b29aa) {
  const _0x4bba53 = _0x1b29aa?.['querySelector']?.('.story-assets-list');
  return captureWorkspaceScrollPosition(_0x4bba53);
}
export function restoreStoryAssetListScrollPosition(_0x2bcbd5, _0x16ffdb) {
  const _0x626362 = _0x2bcbd5?.['querySelector']?.('.story-assets-list');
  return restoreWorkspaceScrollPosition(_0x626362, _0x16ffdb);
}
export function captureStoryWorkspaceNestedScrollPositions(_0x2b28c9) {
  return captureWorkspaceNestedScrollPositions(_0x2b28c9, STORY_WORKSPACE_PERSISTENT_NESTED_SCROLL_SELECTORS);
}
export function restoreStoryWorkspaceNestedScrollPositions(_0x2ac0ef, _0x12f75e) {
  return restoreWorkspaceNestedScrollPositions(_0x2ac0ef, _0x12f75e);
}
export function scrollStoryClipStripWithWheel(_0x3247ec) {
  return scrollWorkspaceTrackWithWheel(_0x3247ec, '.story-clip-strip');
}
export function scrollStoryClipPromptHistoryWithWheel(_0x2eb1fa) {
  const _0x4e4e9b = _0x2eb1fa?.['target']?.['closest']?.('.story-clip-prompt-history-list');
  if (!_0x4e4e9b) return ![];
  const _0x467d40 = Math['max'](
    0x0,
    Number(_0x4e4e9b['scrollHeight'] || 0x0) - Number(_0x4e4e9b['clientHeight'] || 0x0),
  );
  if (_0x467d40 <= 0x0) return ![];
  const _0x1d468d = Math['max'](0x0, Number(_0x4e4e9b['scrollTop']) || 0x0),
    _0x448a06 = Math['max'](0x0, Math['min'](_0x467d40, _0x1d468d + Number(_0x2eb1fa['deltaY'] || 0x0)));
  return (
    _0x2eb1fa['preventDefault']?.(),
    _0x2eb1fa['stopPropagation']?.(),
    (_0x4e4e9b['scrollTop'] = _0x448a06),
    !![]
  );
}
export function getStoryAssetHoverCard(_0x5592ff) {
  return _0x5592ff?.['closest']?.(STORY_ASSET_HOVER_CARD_SELECTOR) || null;
}
export function getStoryAssetHoverCardId(_0x4310cf) {
  return String(
    _0x4310cf?.['dataset']?.['storyAssetHoverId'] ||
      _0x4310cf?.['dataset']?.['storyAssetId'] ||
      _0x4310cf?.['dataset']?.['storyReferenceAsset'] ||
      '',
  );
}
export function getStoryAssetHoverCardAppearanceId(_0x1d683e) {
  return String(_0x1d683e?.['dataset']?.['storyAssetHoverAppearanceId'] || '');
}
export function findStoryAssetForHover(_0x5b9d22, _0x3d96f8, _0x3fcd3b = []) {
  const _0x1045ca = String(_0x3d96f8 || '');
  return (
    (Array['isArray'](_0x5b9d22?.['data']?.['assets']) ? _0x5b9d22['data']['assets'] : [])['find'](
      (_0x278bea) => String(_0x278bea?.['id']) === _0x1045ca,
    ) ||
    (Array['isArray'](_0x3fcd3b) ? _0x3fcd3b : [])['find'](
      (_0x46514f) => String(_0x46514f?.['id']) === _0x1045ca,
    ) ||
    null
  );
}
export function normalizeStoryAssetSplitRatio(_0x215f66) {
  return normalizeWorkspaceAssetSplitRatio(_0x215f66);
}
export function normalizeStoryAssetDetailSplitRatio(_0x164969) {
  return normalizeWorkspaceAssetDetailSplitRatio(_0x164969);
}
export function normalizeStoryEpisodePanelRatios(_0x5f01b0, _0x84e28b) {
  const _0x33362d = Math['max'](
      0xe,
      Math['min'](0x22, Number['isFinite'](Number(_0x5f01b0)) ? Number(_0x5f01b0) : 0x16),
    ),
    _0xdd0397 = Math['max'](
      0x18,
      Math['min'](0x32, Number['isFinite'](Number(_0x84e28b)) ? Number(_0x84e28b) : 0x22),
    );
  return { left: _0x33362d, center: Math['min'](_0xdd0397, 0x4c - _0x33362d) };
}
export function applyStoryAssetSplitRatioToLayout(_0x261491, _0xfe402a, _0x5cf65d) {
  return applyWorkspaceAssetSplitRatioToLayout(_0x261491, _0xfe402a, _0x5cf65d);
}
export function applyStoryAssetDetailSplitRatioToLayout(_0x2d641c, _0x1a19b3, _0x355fc3) {
  return applyWorkspaceAssetDetailSplitRatioToLayout(_0x2d641c, _0x1a19b3, _0x355fc3, {
    styleProperty: '--story-asset-detail-top',
  });
}
export function applyStoryEpisodePanelRatiosToLayout(
  _0x2ae4c2,
  { assetSplitter: assetSplitter = null, previewSplitter: previewSplitter = null } = {},
  _0x4c8115,
  _0x2e3cb9,
) {
  const _0x2d04fc = normalizeStoryEpisodePanelRatios(_0x4c8115, _0x2e3cb9);
  return (
    _0x2ae4c2?.['style']?.['setProperty']?.('--story-episode-assets-width', _0x2d04fc['left'] + '%'),
    _0x2ae4c2?.['style']?.['setProperty']?.('--story-episode-editor-width', _0x2d04fc['center'] + '%'),
    assetSplitter?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x2d04fc['left']))),
    previewSplitter?.['setAttribute']?.(
      'aria-valuenow',
      String(Math['round'](_0x2d04fc['left'] + _0x2d04fc['center'])),
    ),
    _0x2d04fc
  );
}
export function beginStoryHorizontalResizeSession({ ..._0x450071 } = {}) {
  return beginWorkspaceHorizontalResizeSession(_0x450071);
}
export function beginStoryVerticalResizeSession({ ..._0x3a2ae4 } = {}) {
  return beginWorkspaceVerticalResizeSession(_0x3a2ae4);
}
