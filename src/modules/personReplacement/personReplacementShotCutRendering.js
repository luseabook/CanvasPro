import {
  buildMediaClipTimelineRulerMarks,
  getMediaClipFrameCount,
} from '../../components/media-clip/mediaClipTimelineModel.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  canSplitPersonReplacementShotCutRange,
} from './personReplacementShotCutModel.js';
function escapeHtml(_0x71bb71) {
  return String(_0x71bb71 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#039;');
}
function normalizeMediaUrl(_0x2da2b4) {
  const _0xa8861a = String(_0x2da2b4 ?? '')['trim']();
  return _0xa8861a ? localPathToUrl(_0xa8861a) || _0xa8861a : '';
}
function formatClock(_0x13df9e) {
  const _0x3344ff = Math['max'](0x0, Number(_0x13df9e) || 0x0),
    _0x4cd6c5 = Math['floor'](_0x3344ff / 0x3c),
    _0x58aee1 = Math['floor'](_0x3344ff % 0x3c);
  return String(_0x4cd6c5)['padStart'](0x2, '0') + ':' + String(_0x58aee1)['padStart'](0x2, '0');
}
export function renderPersonReplacementShotCutFilmstrip(_0x2e9751 = {}, _0x4a7869 = 0x0, _0x363eb1 = '') {
  const _0x579347 = getMediaClipFrameCount(_0x4a7869),
    _0x30cf8f = normalizeMediaUrl(_0x363eb1 || _0x2e9751['keyframeRef']),
    _0x1260d6 = Array['from']({ length: _0x579347 }, () =>
      _0x30cf8f
        ? '<img\x20class=\x22media-clip-filmstrip-frame\x22\x20src=\x22' +
          escapeHtml(_0x30cf8f) +
          '" alt="" loading="lazy" draggable="false">'
        : '<span class="media-clip-filmstrip-frame" aria-hidden="true"></span>',
    )['join']('');
  return (
    '<div class="media-clip-filmstrip ' +
    (_0x30cf8f ? '' : 'is-placeholder') +
    '\x22\x20aria-hidden=\x22true\x22>' +
    _0x1260d6 +
    '</div>'
  );
}
export function hasSplittablePersonReplacementShotCut(_0x2386e7 = []) {
  return (Array['isArray'](_0x2386e7) ? _0x2386e7 : [])['some']((_0x2b1b38) =>
    canSplitPersonReplacementShotCutRange(
      _0x2b1b38,
      Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(_0x2b1b38?.['durationSec']) || 0x0) / 0x2,
    ),
  );
}
export function getPersonReplacementShotCutRulerFrameRate(_0x3a6fba = []) {
  const _0x529c55 = new Set(
    (Array['isArray'](_0x3a6fba) ? _0x3a6fba : [])['map']((_0x46dfd2) =>
      Math['max'](0x1, Math['round'](Number(_0x46dfd2?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS)),
    ),
  );
  return _0x529c55['size'] === 0x1 ? [..._0x529c55][0x0] : 0x0;
}
export function renderPersonReplacementShotCutRulerTicks(_0x5493ed, _0x1664e0, _0x22fbc1, _0x3145aa) {
  return buildMediaClipTimelineRulerMarks(_0x5493ed, _0x1664e0, { frameRate: _0x3145aa })
    ['filter']((_0x5e0405) => _0x5e0405['sec'] <= _0x5493ed + 0.001)
    ['map']((_0x1cb007) => {
      const _0x25746e = _0x1cb007['isMajor']
          ? 'is-major'
          : _0x1cb007['isMid']
            ? 'is-mid'
            : _0x1cb007['isFrame']
              ? 'is-frame'
              : 'is-minor',
        _0x5a8a18 = _0x1cb007['isMajor'] ? formatClock(_0x1cb007['sec']) : '',
        _0x42299f = _0x1cb007['isFrame']
          ? ' data-person-replacement-shot-cut-frame-index="' + _0x1cb007['frameIndex'] + '\x22'
          : '';
      return (
        '<span class="media-clip-ruler-tick person-replacement-shot-cut-ruler-tick ' +
        _0x25746e +
        '" data-person-replacement-shot-cut-ruler-tick="' +
        _0x1cb007['sec']['toFixed'](0x6) +
        '\x22' +
        _0x42299f +
        '\x20style=\x22left:' +
        ((_0x1cb007['sec'] / _0x22fbc1) * 0x64)['toFixed'](0x4) +
        '%\x22>' +
        _0x5a8a18 +
        '</span>'
      );
    })
    ['join']('');
}
