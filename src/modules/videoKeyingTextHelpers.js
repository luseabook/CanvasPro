import { t } from '../i18n/index.js';
const VIDEO_KEYING_CANCELLED_STATUS_TOKENS = Object.freeze(['已取消', 'Cancelled', 'Canceled']);
export function videoKeyingText(_0x17edee, _0x4faec7 = {}) {
  return t('videoKeying.' + _0x17edee, _0x4faec7);
}
export function getVideoKeyingModelLabel(_0x58fae8) {
  return _0x58fae8 === 'remove' ? videoKeyingText('models.remove') : videoKeyingText('models.keying');
}
export function buildVideoKeyingOutputText(_0x3ed5e0, _0xae40d7, _0x36ec36 = {}) {
  const _0x4a42d2 = videoKeyingText('status.' + _0xae40d7),
    _0xa79af0 = { model: getVideoKeyingModelLabel(_0x3ed5e0), status: _0x4a42d2, ..._0x36ec36 };
  if (_0xae40d7 === 'failed') return videoKeyingText('output.failed', _0xa79af0);
  if (_0x36ec36.taskId != null) return videoKeyingText('output.withTask', _0xa79af0);
  return videoKeyingText('output.status', _0xa79af0);
}
export function isVideoKeyingCancelledOutputText(_0x213e98) {
  const _0x4fd952 = String(_0x213e98 || '');
  return VIDEO_KEYING_CANCELLED_STATUS_TOKENS.some((_0x563e46) => _0x4fd952.includes(_0x563e46));
}
