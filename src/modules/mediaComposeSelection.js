import { t } from '../i18n/index.js';
const VIDEO_COMPOSE_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_COMPOSE_TYPES = new Set(['source-audio', 'audio', 'ai-audio']);
function mediaComposeText(value, item = {}) {
  return t('mediaProcessing.compose.' + value, item);
}
const VIDEO_SOURCE_FIELDS = Object.freeze(['localPath', 'src', 'videoUrl', 'url', 'resultUrl']),
  AUDIO_SOURCE_FIELDS = Object.freeze(['localPath', 'audioUrl', 'src', 'url', 'resultUrl']);
function hasAnyMediaSource(enabled, list) {
  if (!enabled) return false;
  return list.some((item2) => String(enabled?.[item2] || '').trim());
}
export function getNodeMediaComposeKind(key) {
  const index = String(key?.type || '').trim();
  if (VIDEO_COMPOSE_TYPES.has(index) && hasAnyMediaSource(key, VIDEO_SOURCE_FIELDS)) return 'video';
  if (AUDIO_COMPOSE_TYPES.has(index) && hasAnyMediaSource(key, AUDIO_SOURCE_FIELDS)) return 'audio';
  return '';
}
export function getSelectedMediaComposeKind(options = {}, result = []) {
  const list2 = Array.isArray(result) ? result : [];
  if (list2.length < 2) return '';
  let enabled2 = '';
  for (const data of list2) {
    const nodeMediaComposeKind = getNodeMediaComposeKind(options?.[data]);
    if (!nodeMediaComposeKind) return '';
    if (!enabled2) {
      enabled2 = nodeMediaComposeKind;
      continue;
    }
    if (enabled2 !== nodeMediaComposeKind) return '';
  }
  return enabled2;
}
export function getMediaComposeButtonLabel(target) {
  if (target === 'audio') return mediaComposeText('audio.buttonLabel');
  if (target === 'video') return mediaComposeText('video.buttonLabel');
  return mediaComposeText('buttonLabel');
}
export function getOrderedMediaComposeIds(options2 = {}, list3 = [], source = {}) {
  const list4 = Array.isArray(list3) ? list3.slice() : [],
    selectedMediaComposeKind = getSelectedMediaComposeKind(options2, list4);
  if (!selectedMediaComposeKind) return [];
  const list5 = list4.filter(
    (item3) => getNodeMediaComposeKind(options2?.[item3]) === selectedMediaComposeKind,
  );
  if (source?.source === 'shift') return list5;
  return list5.slice().sort((item4, next) => {
    const box = options2?.[item4],
      box2 = options2?.[next],
      current = Number(box?.x) || 0,
      entry = Number(box2?.x) || 0;
    if (current !== entry) return current - entry;
    const record = Number(box?.y) || 0,
      payload = Number(box2?.y) || 0;
    if (record !== payload) return record - payload;
    return String(item4).localeCompare(String(next));
  });
}
