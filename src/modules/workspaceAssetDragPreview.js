export const WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP = 24;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getMediaElementUrl(item, ...args) {
  const key = [item?.['currentSrc'], item?.['src'], item?.['poster']]['map'](normalizeText)['find'](Boolean);
  if (key) return key;
  for (const index of args) {
    const text = normalizeText(item?.['getAttribute']?.(index));
    if (text) return text;
  }
  return '';
}
export function resolveWorkspaceAssetDragPreview(element) {
  const element2 = element?.['querySelector']?.('img') || null,
    url = getMediaElementUrl(element2, 'src');
  if (element2 && url) return { element: element2, url: url, mediaType: 'image' };
  const element3 = element?.['querySelector']?.('video') || null;
  if (element3)
    return {
      element: element3,
      url: normalizeText(element3['poster'] || element3['getAttribute']?.('poster')),
      mediaType: 'video',
    };
  return { element: element || null, url: '', mediaType: '' };
}
export function applyWorkspaceAssetNativeDragPreview(
  result,
  data,
  { pointerGap: pointerGap = WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP } = {},
) {
  if (typeof result?.['setDragImage'] !== 'function') return false;
  const { element: element4 } = resolveWorkspaceAssetDragPreview(data);
  if (!element4) return false;
  const options = Math['max'](0, Number(pointerGap) || 0);
  try {
    return (result['setDragImage'](element4, -options, -options), true);
  } catch {
    return false;
  }
}
