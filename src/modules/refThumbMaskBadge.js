const MASK_BADGE_HTML = '<span class="ref-thumb-mask-badge">遮罩</span>',
  REFERENCE_MASK_FIELDS = Object.freeze([
    'mask',
    'maskImageDataUrl',
    'maskImageUrl',
    'maskUrl',
    'maskLocalPath',
  ]);
function resolveSourceData(nodeData = null) {
  return nodeData?.nodeData && typeof nodeData.nodeData === 'object' ? nodeData.nodeData : nodeData;
}
export function hasReferenceMask(value = null) {
  const sourceData = resolveSourceData(value);
  if (!sourceData || typeof sourceData !== 'object') return false;
  return REFERENCE_MASK_FIELDS.some((item) => !!String(sourceData?.[item] || '').trim());
}
export function createReferenceMaskBadgeHtml(value2 = null) {
  return hasReferenceMask(value2) ? MASK_BADGE_HTML : '';
}
export function getReferenceMaskSignaturePart(value3 = null) {
  return hasReferenceMask(value3) ? 'm1' : 'm0';
}
