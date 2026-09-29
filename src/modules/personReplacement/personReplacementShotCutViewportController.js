import {
  getMediaClipTimelineNextZoom,
  getMediaClipTimelineTrackWidthPx,
  getMediaClipTimelineZoomScrollLeft,
} from '../../components/media-clip/mediaClipTimelineModel.js';
import {
  PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
  canSplitPersonReplacementShotCutRange,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
import {
  getPersonReplacementShotCutRulerFrameRate,
  renderPersonReplacementShotCutRulerTicks,
} from './personReplacementShotCutRendering.js';
function clamp(_0x446104, _0xb3bfc3, _0x5a64bf, _0x4a03c7 = _0xb3bfc3) {
  const _0x5e63c5 = Number(_0x446104);
  return Number['isFinite'](_0x5e63c5)
    ? Math['min'](_0x5a64bf, Math['max'](_0xb3bfc3, _0x5e63c5))
    : _0x4a03c7;
}
function formatPreciseClock(_0x289fe3) {
  const _0x5459ef = Math['max'](0x0, Number(_0x289fe3) || 0x0),
    _0x24c397 = Math['floor'](_0x5459ef / 0x3c),
    _0x1c709c = _0x5459ef - _0x24c397 * 0x3c;
  return String(_0x24c397)['padStart'](0x2, '0') + ':' + _0x1c709c['toFixed'](0x2)['padStart'](0x5, '0');
}
export function createPersonReplacementShotCutViewportController({
  session: _0xef9ec0,
  getRoot: getRoot = () => null,
  renderIcon: renderIcon = () => '',
} = {}) {
  if (!_0xef9ec0?.['workspaceState'])
    throw new TypeError('Shot\x20cut\x20viewport\x20requires\x20a\x20session.');
  const _0x25b6cd = _0xef9ec0['workspaceState'],
    _0x3ca114 = () => _0x25b6cd['isSubmitting'] || _0x25b6cd['isSmartDetecting'],
    _0x5c70f7 = () => _0x3ca114() || _0x25b6cd['isKeyframeCapturing'],
    _0x5aedcf = () => {
      const _0x39ab58 = getRoot(),
        _0x5733d8 = getPersonReplacementShotCutTotalDuration(_0x25b6cd['draft']),
        _0x30eb5e = getPersonReplacementShotCutDisplayDuration(_0x25b6cd['draft']),
        _0x35e6d5 = clamp(_0x25b6cd['playheadSec'], 0x0, _0x5733d8, 0x0);
      _0x25b6cd['playheadSec'] = _0x35e6d5;
      !_0x25b6cd['playheadElement'] &&
        (_0x25b6cd['playheadElement'] =
          _0x39ab58?.['querySelector']?.('[data-person-replacement-shot-cut-playhead]') || null);
      _0x25b6cd['playheadElement']?.['style']?.['setProperty']?.(
        'left',
        (_0x30eb5e > 0x0 ? (_0x35e6d5 / _0x30eb5e) * 0x64 : 0x0) + '%',
      );
      !_0x25b6cd['clockElement'] &&
        (_0x25b6cd['clockElement'] =
          _0x39ab58?.['querySelector']?.('[data-person-replacement-shot-cut-current-time]') || null);
      _0x25b6cd['clockElement'] && (_0x25b6cd['clockElement']['textContent'] = formatPreciseClock(_0x35e6d5));
      const _0x30dff1 = _0x39ab58?.['querySelector']?.(
        '[data-person-replacement-action=\x27split-shot-cut\x27]',
      );
      if (_0x30dff1) {
        const _0x31ce80 = getPersonReplacementShotCutPositionAtTimelineSec(_0x25b6cd['draft'], _0x35e6d5),
          _0x4ff18b = _0x25b6cd['draft'][_0x31ce80['shotIndex']],
          _0x24af47 = Boolean(
            _0x4ff18b &&
            canSplitPersonReplacementShotCutRange(
              _0x4ff18b,
              _0x31ce80['sourceTimeSec'] - (Number(_0x4ff18b['startSec']) || 0x0),
            ),
          ),
          _0xc3ba = _0x25b6cd['isSubmitting'] || _0x25b6cd['isSmartDetecting'] || !_0x24af47;
        _0x30dff1['disabled'] = _0xc3ba;
        if (_0xc3ba) _0x30dff1['setAttribute']?.('disabled', '');
        else _0x30dff1['removeAttribute']?.('disabled');
      }
    },
    _0xe3789a = () => {
      const _0x430dba = getRoot()?.['querySelector']?.("[data-person-replacement-action='undo-shot-cut']");
      if (!_0x430dba) return;
      const _0x1be0a2 =
        _0x25b6cd['isSubmitting'] ||
        _0x25b6cd['isSmartDetecting'] ||
        _0x25b6cd['undoStack']['length'] === 0x0;
      _0x430dba['disabled'] = _0x1be0a2;
      if (_0x1be0a2) _0x430dba['setAttribute']?.('disabled', '');
      else _0x430dba['removeAttribute']?.('disabled');
    },
    _0x359b3a = (_0x2b819b, { recordHistory: recordHistory = !![] } = {}) => {
      if (!Array['isArray'](_0x2b819b)) return ![];
      const _0x4987d7 = _0xef9ec0['commitDraft'](_0x2b819b, { recordHistory: recordHistory });
      if (!_0x4987d7) return ![];
      return (_0xe3789a(), !![]);
    },
    _0x512485 = (_0x295df6 = 'reset', { clientX: clientX = Number['NaN'] } = {}) => {
      if (!_0x25b6cd['isOpen']) return ![];
      const _0x3a2838 = getRoot(),
        _0x5c4aa1 = _0x3a2838?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        _0x5b0bd4 = _0x3a2838?.['querySelector']?.('[data-person-replacement-shot-cut-timeline]');
      if (!_0x5c4aa1 || !_0x5b0bd4) return ![];
      const _0x5dc1c2 = Math['max'](0.08, Number(_0x25b6cd['timelineZoom']) || 0x1),
        _0xdfa4b3 =
          _0x295df6 === 'reset'
            ? 0x1
            : getMediaClipTimelineNextZoom({
                currentZoom: _0x5dc1c2,
                delta: _0x295df6 === 'in' ? -0x1 : 0x1,
                minZoom: 0.08,
                maxZoom: 0x6,
              }),
        _0x21cda8 = _0x5c4aa1['getBoundingClientRect']?.() || {
          left: 0x0,
          width: _0x5c4aa1['clientWidth'] || 0x0,
        },
        _0x502093 = Math['max'](0x1, Number(_0x5c4aa1['clientWidth']) || Number(_0x21cda8['width']) || 0x1),
        _0x343262 = clamp(
          Number['isFinite'](Number(clientX))
            ? Number(clientX) - Number(_0x21cda8['left'] || 0x0)
            : _0x502093 / 0x2,
          0x0,
          _0x502093,
          _0x502093 / 0x2,
        ),
        _0x3df1d0 = getPersonReplacementShotCutDisplayDuration(_0x25b6cd['draft']),
        _0x201eb3 = getMediaClipTimelineTrackWidthPx({
          durationSec: getPersonReplacementShotCutTotalDuration(_0x25b6cd['draft']),
          viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
          zoom: _0x5dc1c2,
        }),
        _0x312316 = clamp(
          ((Math['max'](0x0, Number(_0x5c4aa1['scrollLeft']) || 0x0) + _0x343262) /
            Math['max'](0x1, _0x201eb3)) *
            _0x3df1d0,
          0x0,
          _0x3df1d0,
          0x0,
        ),
        _0xc629d6 = getMediaClipTimelineTrackWidthPx({
          durationSec: getPersonReplacementShotCutTotalDuration(_0x25b6cd['draft']),
          viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
          zoom: _0xdfa4b3,
        }),
        _0x3ef40d = getMediaClipTimelineZoomScrollLeft({
          anchorSec: _0x312316,
          anchorX: _0x343262,
          durationSec: _0x3df1d0,
          trackWidthPx: _0xc629d6,
          nextContentWidthPx: _0xc629d6,
          viewportWidthPx: _0x502093,
        });
      ((_0x25b6cd['timelineZoom'] = _0xdfa4b3),
        _0x5b0bd4['style']?.['setProperty']?.('--media-clip-track-content-width', _0xc629d6 + 'px'),
        _0x5b0bd4['style']?.['setProperty']?.('--media-clip-timeline-content-width', _0xc629d6 + 'px'));
      const _0x2c9487 = _0x5b0bd4['querySelector']?.('.person-replacement-shot-cut-ruler');
      return (
        _0x2c9487 &&
          (_0x2c9487['innerHTML'] = renderPersonReplacementShotCutRulerTicks(
            getPersonReplacementShotCutTotalDuration(_0x25b6cd['draft']),
            _0xc629d6,
            _0x3df1d0,
            getPersonReplacementShotCutRulerFrameRate(_0x25b6cd['draft']),
          )),
        (_0x5c4aa1['scrollLeft'] = Math['max'](
          0x0,
          Math['min'](Math['max'](0x0, _0xc629d6 - _0x502093), Number(_0x3ef40d) || 0x0),
        )),
        _0x5aedcf(),
        Math['abs'](_0xdfa4b3 - _0x5dc1c2) > 0.0001
      );
    },
    _0x431bde = (_0x35f1ec) => {
      if (!_0x25b6cd['isOpen'] || _0x3ca114()) return ![];
      _0x25b6cd['soundEnabled'] = !_0x25b6cd['soundEnabled'];
      const _0x3a7673 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (_0x3a7673) _0x3a7673['muted'] = !_0x25b6cd['soundEnabled'];
      const _0x4790a2 = _0x25b6cd['soundEnabled'] ? '关闭声音' : '打开声音';
      return (
        _0x35f1ec?.['classList']?.['toggle']?.('is-sound-enabled', _0x25b6cd['soundEnabled']),
        _0x35f1ec?.['setAttribute']?.('aria-pressed', String(_0x25b6cd['soundEnabled'])),
        _0x35f1ec?.['setAttribute']?.('aria-label', _0x4790a2),
        _0x35f1ec?.['setAttribute']?.('data-tooltip', _0x4790a2),
        _0x35f1ec &&
          (_0x35f1ec['innerHTML'] = renderIcon(_0x25b6cd['soundEnabled'] ? 'soundOn' : 'soundOff')),
        !![]
      );
    };
  return Object['freeze']({
    applyTimelineZoom: _0x512485,
    commitDraft: _0x359b3a,
    isBusy: _0x3ca114,
    isDraftMutationBusy: _0x5c70f7,
    syncPlayhead: _0x5aedcf,
    syncUndoButton: _0xe3789a,
    toggleSound: _0x431bde,
  });
}
