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
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#039;');
}
function normalizeMediaUrl(item) {
  const key = String(item ?? '')['trim']();
  return key ? localPathToUrl(key) || key : '';
}
function formatClock(index) {
  const result = Math['max'](0, Number(index) || 0),
    data = Math['floor'](result / 60),
    options = Math['floor'](result % 60);
  return String(data)['padStart'](2, '0') + ':' + String(options)['padStart'](2, '0');
}
export function renderPersonReplacementShotCutFilmstrip(options2 = {}, target = 0, source = '') {
  const length = getMediaClipFrameCount(target),
    mediaUrl = normalizeMediaUrl(source || options2['keyframeRef']),
    next = Array['from']({ length: length }, () =>
      mediaUrl
        ? '<img class="media-clip-filmstrip-frame" src="' +
          escapeHtml(mediaUrl) +
          '" alt="" loading="lazy" draggable="false">'
        : '<span class="media-clip-filmstrip-frame" aria-hidden="true"></span>',
    )['join']('');
  return (
    '<div class="media-clip-filmstrip ' +
    (mediaUrl ? '' : 'is-placeholder') +
    '" aria-hidden="true">' +
    next +
    '</div>'
  );
}
export function hasSplittablePersonReplacementShotCut(list = []) {
  return (Array['isArray'](list) ? list : [])['some']((current) =>
    canSplitPersonReplacementShotCutRange(
      current,
      Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(current?.['durationSec']) || 0) / 2,
    ),
  );
}
export function getPersonReplacementShotCutRulerFrameRate(list2 = []) {
  const args = new Set(
    (Array['isArray'](list2) ? list2 : [])['map']((entry) =>
      Math['max'](1, Math['round'](Number(entry?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS)),
    ),
  );
  return args['size'] === 1 ? [...args][0] : 0;
}
export function renderPersonReplacementShotCutRulerTicks(record, payload, handle, frameRate) {
  return buildMediaClipTimelineRulerMarks(record, payload, { frameRate: frameRate })
    ['filter']((state) => state['sec'] <= record + 0.001)
    ['map']((config) => {
      const scope = config['isMajor']
          ? 'is-major'
          : config['isMid']
            ? 'is-mid'
            : config['isFrame']
              ? 'is-frame'
              : 'is-minor',
        input = config['isMajor'] ? formatClock(config['sec']) : '',
        output = config['isFrame']
          ? ' data-person-replacement-shot-cut-frame-index="' + config['frameIndex'] + '"'
          : '';
      return (
        '<span class="media-clip-ruler-tick person-replacement-shot-cut-ruler-tick ' +
        scope +
        '" data-person-replacement-shot-cut-ruler-tick="' +
        config['sec']['toFixed'](6) +
        '"' +
        output +
        ' style="left:' +
        ((config['sec'] / handle) * 100)['toFixed'](4) +
        '%">' +
        input +
        '</span>'
      );
    })
    ['join']('');
}
