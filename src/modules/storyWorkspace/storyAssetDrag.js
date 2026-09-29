import {
  applyWorkspaceAssetNativeDragPreview,
  resolveWorkspaceAssetDragPreview,
  WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
} from '../workspaceAssetDragPreview.js';
export const STORY_ASSET_DRAG_MIME = 'application/x-ai-canvas-story-asset-id';
export const STORY_ASSET_DRAG_INDEX_MIME = 'application/x-ai-canvas-story-asset-index';
export const STORY_ASSET_DRAG_PREVIEW_POINTER_GAP = WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP;
function normalizeText(_0x57d1e6) {
  return String(_0x57d1e6 || '')['trim']();
}
export function writeStoryAssetDragData(_0x1e26e2, _0x53f7ad, _0x159d1b = 0x0) {
  const _0x24ef16 = normalizeText(_0x53f7ad);
  if (!_0x24ef16 || typeof _0x1e26e2?.['setData'] !== 'function') return ![];
  try {
    return (
      _0x1e26e2['setData'](STORY_ASSET_DRAG_MIME, _0x24ef16),
      _0x1e26e2['setData'](
        STORY_ASSET_DRAG_INDEX_MIME,
        String(Math['max'](0x0, Math['trunc'](Number(_0x159d1b) || 0x0))),
      ),
      (_0x1e26e2['effectAllowed'] = 'copy'),
      !![]
    );
  } catch {
    return ![];
  }
}
export function readStoryAssetDragData(_0x212bdf) {
  if (typeof _0x212bdf?.['getData'] !== 'function') return '';
  try {
    return normalizeText(_0x212bdf['getData'](STORY_ASSET_DRAG_MIME));
  } catch {
    return '';
  }
}
export function readStoryAssetDragItemIndex(_0x10fb70) {
  if (typeof _0x10fb70?.['getData'] !== 'function') return 0x0;
  try {
    return Math['max'](0x0, Math['trunc'](Number(_0x10fb70['getData'](STORY_ASSET_DRAG_INDEX_MIME)) || 0x0));
  } catch {
    return 0x0;
  }
}
export function hasStoryAssetDragData(_0x4cb28e) {
  if (readStoryAssetDragData(_0x4cb28e)) return !![];
  try {
    return Array['from'](_0x4cb28e?.['types'] || [])['includes'](STORY_ASSET_DRAG_MIME);
  } catch {
    return ![];
  }
}
export const resolveStoryAssetDragPreview = resolveWorkspaceAssetDragPreview;
export const applyStoryAssetNativeDragPreview = applyWorkspaceAssetNativeDragPreview;
export function getStoryPromptDropRange(_0x3812ca, _0x1bc470, _0x3512f0, _0x328cf5) {
  if (!_0x3812ca || !_0x1bc470) return null;
  const _0x2c4ea0 = Number(_0x3512f0),
    _0xdae60a = Number(_0x328cf5);
  if (!Number['isFinite'](_0x2c4ea0) || !Number['isFinite'](_0xdae60a)) return null;
  let _0x437b93 = null;
  const _0x32008d = _0x3812ca['caretPositionFromPoint']?.(_0x2c4ea0, _0xdae60a);
  _0x32008d?.['offsetNode'] && typeof _0x3812ca['createRange'] === 'function'
    ? ((_0x437b93 = _0x3812ca['createRange']()),
      _0x437b93['setStart'](_0x32008d['offsetNode'], _0x32008d['offset']))
    : (_0x437b93 = _0x3812ca['caretRangeFromPoint']?.(_0x2c4ea0, _0xdae60a) || null);
  const _0x3ee6ef = _0x437b93?.['startContainer'];
  if (
    !_0x3ee6ef ||
    _0x3ee6ef['nodeType'] !== 0x3 ||
    !_0x1bc470['contains']?.(_0x3ee6ef) ||
    _0x3ee6ef['parentElement']?.['closest']?.('.ref-pill')
  )
    return null;
  return (_0x437b93['collapse']?.(!![]), _0x437b93);
}
export function activateStoryPromptDropSelection(_0x3d3fbf, _0x5f18cc, _0x10e047) {
  const _0x13911d = _0x3d3fbf?.['getSelection']?.();
  if (!_0x5f18cc || !_0x10e047 || !_0x13911d) return ![];
  try {
    return (
      _0x5f18cc['focus']?.({ preventScroll: !![] }),
      _0x13911d['removeAllRanges']?.(),
      _0x13911d['addRange']?.(_0x10e047),
      !![]
    );
  } catch {
    return ![];
  }
}
