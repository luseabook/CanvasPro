const TOP_LEVEL_IMAGE_FIELDS = Object.freeze(['imageUrl', 'localPath', 'thumbUrl', 'thumbId']),
  IMAGE_RECORD_FIELDS = Object.freeze([
    'imageUrl',
    'sourceUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbUrl',
    'thumbId',
  ]);
function hasValue(value) {
  return String(value || '').trim().length > 0;
}
function hasDisplayableImageRecord(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  if (enabled.error) return false;
  return IMAGE_RECORD_FIELDS.some((item) => hasValue(enabled[item]));
}
export function hasAIGenMaskPreviewBaseImage(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  const list = Array.isArray(enabled2.images) ? enabled2.images : [];
  if (list.some((item2) => hasDisplayableImageRecord(item2))) return true;
  return TOP_LEVEL_IMAGE_FIELDS.some((item3) => hasValue(enabled2[item3]));
}
