import {
  createWorkspaceMarqueeRect,
  createWorkspaceMarqueeSelectionController,
  doesWorkspaceMarqueeIntersect,
  hasWorkspaceMarqueeDrag,
  resolveWorkspaceMarqueeSelection,
  WORKSPACE_MARQUEE_DRAG_THRESHOLD,
} from '../workspaceMarqueeSelection.js';
export const STORY_MARQUEE_DRAG_THRESHOLD = WORKSPACE_MARQUEE_DRAG_THRESHOLD;
export const hasStoryMarqueeDrag = hasWorkspaceMarqueeDrag;
export const createStoryMarqueeRect = createWorkspaceMarqueeRect;
export const doesStoryMarqueeIntersect = doesWorkspaceMarqueeIntersect;
export const resolveStoryMarqueeSelection = resolveWorkspaceMarqueeSelection;
const STORY_MARQUEE_SURFACE_SELECTOR = '[data-story-marquee-surface]',
  STORY_MARQUEE_BLOCKED_CONTROL_SELECTOR =
    "[data-story-action], input, textarea, select, a, [contenteditable='true']",
  STORY_MARQUEE_ITEM_SELECTOR = '[data-story-marquee-item]';
export function createStoryAssetMarqueeConfig(
  _0x276d16,
  { getVisibleAssets: _0x44eff7, beforeCommit: _0x28e207, render: _0x1130a0 },
) {
  return {
    enabled: _0x276d16['view'] === 'project' && _0x276d16['step'] === 0x2,
    selectedIds: _0x276d16['selectedAssetIds'],
    commit(_0x2b7e88) {
      _0x28e207();
      const _0x176e57 = new Set(
        _0x44eff7(_0x276d16)
          ['filter'](
            (_0xa51ff3) =>
              _0x276d16['assetFilter'] !== 'library' ||
              (['image', 'audio']['includes'](
                String(_0xa51ff3['mediaKind'] || '')
                  ['trim']()
                  ['toLowerCase'](),
              ) &&
                String(_0xa51ff3['sourceUrl'] || _0xa51ff3['imageUrl'] || '')['trim']()),
          )
          ['map']((_0x18ede) => _0x18ede['id']),
      );
      ((_0x276d16['selectedAssetIds'] = _0x2b7e88['filter']((_0x27e99b) => _0x176e57['has'](_0x27e99b))),
        (_0x276d16['assetSelectionMode'] = _0x276d16['selectedAssetIds']['length'] > 0x0),
        (_0x276d16['selectedAssetId'] =
          _0x276d16['selectedAssetIds']['at'](-0x1) || _0x276d16['selectedAssetId']),
        _0x1130a0());
    },
  };
}
export function createStoryMarqueeSelectionController(_0x1c633b = {}) {
  return createWorkspaceMarqueeSelectionController({
    ..._0x1c633b,
    surfaceSelector: _0x1c633b['surfaceSelector'] || STORY_MARQUEE_SURFACE_SELECTOR,
    blockedControlSelector: _0x1c633b['blockedControlSelector'] || STORY_MARQUEE_BLOCKED_CONTROL_SELECTOR,
    overlayClassName: _0x1c633b['overlayClassName'] || 'story-marquee-selection',
    itemSelector: _0x1c633b['itemSelector'] || STORY_MARQUEE_ITEM_SELECTOR,
    getItemId: _0x1c633b['getItemId'] || ((_0x190f50) => _0x190f50['dataset']?.['storyMarqueeId']),
  });
}
