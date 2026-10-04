import { t } from '../../i18n/index.js';
const SUCCESS_MESSAGE_KEYS = Object['freeze']({
  image: 'nodeToolbar.common.imageSaved',
  video: 'nodeToolbar.common.videoSaved',
  audio: 'nodeToolbar.common.audioSaved',
});
function basenameFromPath(value) {
  return (
    String(value || '')
      ['trim']()
      ['split'](/[\\/]/)
      ['filter'](Boolean)
      ['pop']() || ''
  );
}
export function showMediaSaveSuccessToast({
  result: result,
  kind: kind,
  showToast: showToast = globalThis['window']?.['showToast'],
} = {}) {
  const enabled = SUCCESS_MESSAGE_KEYS[String(kind || '')['toLowerCase']()],
    enabled2 = String(result?.['path'] || '')['trim']();
  if (result?.['success'] !== !![] || !enabled2 || !enabled) return ![];
  if (typeof showToast !== 'function') return ![];
  const filename = String(result?.['filename'] || '')['trim']() || basenameFromPath(enabled2);
  if (!filename) return ![];
  return (showToast(t(enabled, { filename: filename }), 'success'), !![]);
}
