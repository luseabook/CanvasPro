import { t } from '../i18n/index.js';
const VIDEO_KEYING_CANCELLED_STATUS_TOKENS = Object.freeze(['已取消', 'Cancelled', 'Canceled']);
export function videoKeyingText(value, item = {}) {
  return t('videoKeying.' + value, item);
}
export function getVideoKeyingModelLabel(key) {
  return key === 'remove' ? videoKeyingText('models.remove') : videoKeyingText('models.keying');
}
export function buildVideoKeyingOutputText(index, result, args = {}) {
  const status = videoKeyingText('status.' + result),
    data = { model: getVideoKeyingModelLabel(index), status: status, ...args };
  if (result === 'failed') return videoKeyingText('output.failed', data);
  if (args.taskId != null) return videoKeyingText('output.withTask', data);
  return videoKeyingText('output.status', data);
}
export function isVideoKeyingCancelledOutputText(options) {
  const list = String(options || '');
  return VIDEO_KEYING_CANCELLED_STATUS_TOKENS.some((item2) => list.includes(item2));
}
