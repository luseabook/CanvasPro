const GENERATION_NODE_TYPES = ['ai-image', 'ai-text', 'ai-video', 'ai-audio'],
  IMAGE_RESULT_FIELDS = [
    'src',
    'url',
    'imageUrl',
    'sourceUrl',
    'resultUrl',
    'thumbUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbId',
  ],
  VIDEO_RESULT_FIELDS = [
    'src',
    'url',
    'videoUrl',
    'sourceUrl',
    'resultUrl',
    'videoLocalPath',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbId',
    'thumbUrl',
    'posterUrl',
    'posterLocalPath',
    'thumbLocalPath',
    'videoThumbSrc',
    'videoMetaSrc',
  ],
  AUDIO_RESULT_FIELDS = ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'];
function matchesNodeType(value, item, handler) {
  if (typeof handler === 'function') return handler(value, item);
  return String(value?.type || '') === item;
}
function hasStringValue(key) {
  return String(key || '').trim().length > 0;
}
function hasAnyField(enabled, list) {
  if (!enabled || typeof enabled !== 'object') return false;
  return list.some((item2) => hasStringValue(enabled[item2]));
}
function hasAnyResultItem(list2, index) {
  if (!Array.isArray(list2)) return false;
  return list2.some((item3) => hasAnyField(item3, index));
}
export function hasDisplayableImageResult(result) {
  return hasAnyField(result, IMAGE_RESULT_FIELDS) || hasAnyResultItem(result?.images, IMAGE_RESULT_FIELDS);
}
export function hasDisplayableVideoResult(data) {
  return hasAnyField(data, VIDEO_RESULT_FIELDS) || hasAnyResultItem(data?.videos, VIDEO_RESULT_FIELDS);
}
export function hasDisplayableAudioResult(options) {
  return hasAnyField(options, AUDIO_RESULT_FIELDS) || hasAnyResultItem(options?.audios, AUDIO_RESULT_FIELDS);
}
export function hasDisplayableNodeResult(target, source) {
  if (matchesNodeType(target, 'ai-image', source)) return hasDisplayableImageResult(target);
  if (matchesNodeType(target, 'ai-text', source)) return hasStringValue(target?.outputText);
  if (matchesNodeType(target, 'ai-video', source)) return hasDisplayableVideoResult(target);
  if (matchesNodeType(target, 'ai-audio', source)) return hasDisplayableAudioResult(target);
  return false;
}
export function isNodeMissingResult(enabled2, next) {
  if (!enabled2 || !GENERATION_NODE_TYPES.some((item4) => matchesNodeType(enabled2, item4, next)))
    return false;
  return !hasDisplayableNodeResult(enabled2, next);
}
export function syncNodeResultClass(el, current, entry) {
  if (!el?.classList) return;
  isNodeMissingResult(current, entry) ? el.classList.add('no-result') : el.classList.remove('no-result');
}
