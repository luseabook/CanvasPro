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
  enabled,
  { getVisibleAssets: getVisibleAssets, beforeCommit: beforeCommit, render: render },
) {
  return {
    enabled: enabled.view === 'project' && enabled.step === 2,
    selectedIds: enabled.selectedAssetIds,
    commit(list) {
      beforeCommit();
      const map = new Set(
        getVisibleAssets(enabled)
          .filter(
            (value) =>
              enabled.assetFilter !== 'library' ||
              (['image', 'audio'].includes(
                String(value.mediaKind || '')
                  .trim()
                  .toLowerCase(),
              ) &&
                String(value.sourceUrl || value.imageUrl || '').trim()),
          )
          .map((item) => item.id),
      );
      ((enabled.selectedAssetIds = list.filter((key) => map.has(key))),
        (enabled.assetSelectionMode = enabled.selectedAssetIds.length > 0),
        (enabled.selectedAssetId = enabled.selectedAssetIds.at(-1) || enabled.selectedAssetId),
        render());
    },
  };
}
export function createStoryMarqueeSelectionController(surfaceSelector = {}) {
  return createWorkspaceMarqueeSelectionController({
    ...surfaceSelector,
    surfaceSelector: surfaceSelector.surfaceSelector || STORY_MARQUEE_SURFACE_SELECTOR,
    blockedControlSelector:
      surfaceSelector.blockedControlSelector || STORY_MARQUEE_BLOCKED_CONTROL_SELECTOR,
    overlayClassName: surfaceSelector.overlayClassName || 'story-marquee-selection',
    itemSelector: surfaceSelector.itemSelector || STORY_MARQUEE_ITEM_SELECTOR,
    getItemId: surfaceSelector.getItemId || ((el) => el.dataset?.storyMarqueeId),
  });
}
