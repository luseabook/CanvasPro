import {
  applyWorkspaceAssetNativeDragPreview,
  resolveWorkspaceAssetDragPreview,
  WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
} from '../workspaceAssetDragPreview.js';
export const STORY_ASSET_DRAG_MIME = 'application/x-ai-canvas-story-asset-id';
export const STORY_ASSET_DRAG_INDEX_MIME = 'application/x-ai-canvas-story-asset-index';
export const STORY_ASSET_DRAG_PREVIEW_POINTER_GAP = WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP;
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function writeStoryAssetDragData(item, key, index = 0x0) {
  const text = normalizeText(key);
  if (!text || typeof item?.['setData'] !== 'function') return ![];
  try {
    return (
      item['setData'](STORY_ASSET_DRAG_MIME, text),
      item['setData'](
        STORY_ASSET_DRAG_INDEX_MIME,
        String(Math['max'](0x0, Math['trunc'](Number(index) || 0x0))),
      ),
      (item['effectAllowed'] = 'copy'),
      !![]
    );
  } catch {
    return ![];
  }
}
export function readStoryAssetDragData(result) {
  if (typeof result?.['getData'] !== 'function') return '';
  try {
    return normalizeText(result['getData'](STORY_ASSET_DRAG_MIME));
  } catch {
    return '';
  }
}
export function readStoryAssetDragItemIndex(data) {
  if (typeof data?.['getData'] !== 'function') return 0x0;
  try {
    return Math['max'](0x0, Math['trunc'](Number(data['getData'](STORY_ASSET_DRAG_INDEX_MIME)) || 0x0));
  } catch {
    return 0x0;
  }
}
export function hasStoryAssetDragData(options) {
  if (readStoryAssetDragData(options)) return !![];
  try {
    return Array['from'](options?.['types'] || [])['includes'](STORY_ASSET_DRAG_MIME);
  } catch {
    return ![];
  }
}
export const resolveStoryAssetDragPreview = resolveWorkspaceAssetDragPreview;
export const applyStoryAssetNativeDragPreview = applyWorkspaceAssetNativeDragPreview;
export function getStoryPromptDropRange(dom, enabled, target, source) {
  if (!dom || !enabled) return null;
  const next = Number(target),
    current = Number(source);
  if (!Number['isFinite'](next) || !Number['isFinite'](current)) return null;
  let entry = null;
  const record = dom['caretPositionFromPoint']?.(next, current);
  record?.['offsetNode'] && typeof dom['createRange'] === 'function'
    ? ((entry = dom['createRange']()), entry['setStart'](record['offsetNode'], record['offset']))
    : (entry = dom['caretRangeFromPoint']?.(next, current) || null);
  const enabled2 = entry?.['startContainer'];
  if (
    !enabled2 ||
    enabled2['nodeType'] !== 0x3 ||
    !enabled['contains']?.(enabled2) ||
    enabled2['parentElement']?.['closest']?.('.ref-pill')
  )
    return null;
  return (entry['collapse']?.(!![]), entry);
}
export function activateStoryPromptDropSelection(dom2, el, enabled3) {
  const enabled4 = dom2?.['getSelection']?.();
  if (!el || !enabled3 || !enabled4) return ![];
  try {
    return (
      el['focus']?.({ preventScroll: !![] }),
      enabled4['removeAllRanges']?.(),
      enabled4['addRange']?.(enabled3),
      !![]
    );
  } catch {
    return ![];
  }
}
