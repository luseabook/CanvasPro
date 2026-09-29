export const MEDIA_CLIP_TIMELINE_TICK_COUNT = 6;
export const MEDIA_CLIP_TIMELINE_TICK_MIN_SPACING_PX = 130;
export const MEDIA_CLIP_TIMELINE_FRAME_MIN_WIDTH_PX = 54;
export const MEDIA_CLIP_TIMELINE_SCROLL_PX_PER_SEC = 108;
export const MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX = 46;
export const MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX = 4;
export const MEDIA_CLIP_TIMELINE_ZOOM_WHEEL_FACTOR = 1.12;
export const MEDIA_CLIP_TIMELINE_MIN_DISPLAY_SEC = 5;
export const MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX = 240;
export const MEDIA_CLIP_TIMELINE_MIN_SEGMENT_WIDTH_PCT = 2;
export const MEDIA_CLIP_TIMELINE_FRAME_COUNT_MIN = 8;
export const MEDIA_CLIP_TIMELINE_FRAME_COUNT_MAX = 22;
export const MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC = Object.freeze([15, 10, 5, 2, 1]);
const MEDIA_CLIP_TIMELINE_TICK_STEPS_ASC = Object.freeze([1, 2, 5, 10, 15]),
  MEDIA_CLIP_TIMELINE_MIN_RULER_INTERVALS = 4;
function toNumber(_0x4d9cdd, _0x3de2d4 = 0) {
  const _0x170b14 = Number(_0x4d9cdd);
  return Number.isFinite(_0x170b14) ? _0x170b14 : _0x3de2d4;
}
function clamp(_0x116622, _0x3a95a7, _0x1138c6) {
  return Math.max(_0x3a95a7, Math.min(_0x1138c6, _0x116622));
}
function roundMs(_0x2bc178) {
  return Math.round(toNumber(_0x2bc178, 0) * 0x3e8) / 0x3e8;
}
export function getMediaClipTimelineDisplayDuration(_0x1cc98c = 0) {
  return Math.max(MEDIA_CLIP_TIMELINE_MIN_DISPLAY_SEC, toNumber(_0x1cc98c, 0));
}
export function getMediaClipTimelineRatio(_0x222684 = 0, _0x143982 = 0) {
  const _0x38398a = getMediaClipTimelineDisplayDuration(_0x143982);
  return clamp(toNumber(_0x222684, 0) / _0x38398a, 0, 1);
}
export function getMediaClipTimelinePercent(_0x2bc128 = 0, _0x178a89 = 0) {
  return getMediaClipTimelineRatio(_0x2bc128, _0x178a89) * 100;
}
export function getMediaClipTimelinePx(_0x2a5c6d = 0, _0x53f859 = {}) {
  const _0x4057e6 = Math.max(1, toNumber(_0x53f859.trackWidthPx, 1));
  return getMediaClipTimelineRatio(_0x2a5c6d, _0x53f859.durationSec) * _0x4057e6;
}
export function getMediaClipTimelineSecFromPx(_0x412a2c = 0, _0x49353c = {}) {
  const _0x2f2aff = Math.max(1, toNumber(_0x49353c.trackWidthPx, 1)),
    _0x20cc54 = getMediaClipTimelineDisplayDuration(_0x49353c.durationSec);
  return roundMs(clamp(toNumber(_0x412a2c, 0) / _0x2f2aff, 0, 1) * _0x20cc54);
}
export function getMediaClipTimelineSecFromClientX(_0xf6129f = 0, _0xe52147 = {}) {
  const _0x3c55e3 = toNumber(_0xe52147.trackLeftPx, 0);
  return getMediaClipTimelineSecFromPx(toNumber(_0xf6129f, _0x3c55e3) - _0x3c55e3, _0xe52147);
}
export function getMediaClipTimelineDeltaSecFromPx(_0x13c388 = 0, _0x6ec311 = {}) {
  const _0x4e9c5c = Math.max(1, toNumber(_0x6ec311.trackWidthPx, 1)),
    _0x4054ee = getMediaClipTimelineDisplayDuration(_0x6ec311.durationSec);
  return (toNumber(_0x13c388, 0) / _0x4e9c5c) * _0x4054ee;
}
export function getMediaClipTimelineRangeRect(_0x60dbbb = {}) {
  const _0x50aa5f = getMediaClipTimelineDisplayDuration(_0x60dbbb.durationSec),
    _0x290824 = clamp(toNumber(_0x60dbbb.startSec, 0), 0, _0x50aa5f),
    _0x356363 = clamp(toNumber(_0x60dbbb.endSec, _0x290824), _0x290824, _0x50aa5f),
    _0x585e49 = getMediaClipTimelinePercent(_0x290824, _0x50aa5f),
    _0x3f8af9 = Math.max(_0x585e49, getMediaClipTimelinePercent(_0x356363, _0x50aa5f)),
    _0x13452e = Math.max(
      toNumber(_0x60dbbb.minWidthPct, MEDIA_CLIP_TIMELINE_MIN_SEGMENT_WIDTH_PCT),
      _0x3f8af9 - _0x585e49,
    ),
    _0x373e13 = Math.max(0, toNumber(_0x60dbbb.trackWidthPx, 0));
  return {
    startSec: _0x290824,
    endSec: _0x356363,
    leftPct: _0x585e49,
    rightPct: _0x3f8af9,
    widthPct: Math.min(100 - _0x585e49, _0x13452e),
    leftPx: _0x373e13 > 0 ? (_0x585e49 / 100) * _0x373e13 : 0,
    widthPx: _0x373e13 > 0 ? ((_0x3f8af9 - _0x585e49) / 100) * _0x373e13 : 0,
  };
}
export function getMediaClipTimelinePlayheadModel(_0x1a49d1 = {}) {
  const _0x24a658 = clamp(
    toNumber(_0x1a49d1.playheadSec, 0),
    0,
    getMediaClipTimelineDisplayDuration(_0x1a49d1.durationSec),
  );
  return {
    sec: _0x24a658,
    leftPct: getMediaClipTimelinePercent(_0x24a658, _0x1a49d1.durationSec),
    leftPx: getMediaClipTimelinePx(_0x24a658, _0x1a49d1),
  };
}
export function getMediaClipTimelineTrackWidthPx(_0x456c15 = {}) {
  const _0x16b468 = Math.max(
      MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX,
      Math.ceil(toNumber(_0x456c15.viewportWidthPx, 0)),
    ),
    _0x3124d9 = getMediaClipTimelineDisplayDuration(_0x456c15.durationSec),
    _0x3b558a = Math.max(1, toNumber(_0x456c15.pxPerSec, MEDIA_CLIP_TIMELINE_SCROLL_PX_PER_SEC)),
    _0x20621b = Math.max(0.001, toNumber(_0x456c15.zoom, 1)),
    _0x2ae605 = Math.max(_0x16b468, _0x3124d9 * _0x3b558a);
  return Math.ceil(Math.max(_0x16b468, _0x2ae605 * _0x20621b));
}
export function getMediaClipFrameCount(_0x328e67 = 0) {
  const _0x3856cc = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(_0x328e67, 0));
  return Math.max(
    MEDIA_CLIP_TIMELINE_FRAME_COUNT_MIN,
    Math.min(
      MEDIA_CLIP_TIMELINE_FRAME_COUNT_MAX,
      Math.ceil(_0x3856cc / MEDIA_CLIP_TIMELINE_FRAME_MIN_WIDTH_PX),
    ),
  );
}
export function shouldLockMediaClipTimelineWheelScroll(_0x10dd99 = {}) {
  const _0x52b7c5 = Math.max(0, toNumber(_0x10dd99.trackWidthPx, 0)),
    _0x229ee7 = Math.max(1, toNumber(_0x10dd99.viewportWidthPx, 1)),
    _0x149c3f = Math.max(0, toNumber(_0x10dd99.maxScrollPx, 0)),
    _0x44bb33 = MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX;
  return _0x149c3f > 0 && _0x52b7c5 <= _0x229ee7 + 1 && _0x149c3f <= _0x44bb33 + 4;
}
export function getMediaClipTimelineAddSlotLeftPx(_0x55a0ea = {}) {
  const _0x4fc608 = Math.max(0, toNumber(_0x55a0ea.trackWidthPx, 0)),
    _0x3ba4f3 = getMediaClipTimelineDisplayDuration(_0x55a0ea.displayDurationSec),
    _0x9a5b00 = clamp(toNumber(_0x55a0ea.materialEndSec, 0), 0, _0x3ba4f3);
  if (_0x3ba4f3 <= 0 || _0x4fc608 <= 0) return MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX;
  return Math.round((_0x9a5b00 / _0x3ba4f3) * _0x4fc608 + MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX);
}
export function getMediaClipTimelineContentWidthPx(_0x2d334c = {}) {
  const _0x1568c5 = Math.max(
    MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX,
    Math.ceil(toNumber(_0x2d334c.trackWidthPx, 0)),
  );
  return Math.max(
    _0x1568c5,
    getMediaClipTimelineAddSlotLeftPx(_0x2d334c) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  );
}
export function getMediaClipTimelineNextZoom(_0x4f6624 = {}) {
  const _0x3b2ab8 = Math.max(0.001, toNumber(_0x4f6624.currentZoom, 1)),
    _0x40e5d4 = Math.max(0.001, toNumber(_0x4f6624.minZoom, 0.5)),
    _0x45023e = Math.max(_0x40e5d4, toNumber(_0x4f6624.maxZoom, 6)),
    _0x534266 = Math.max(1.001, toNumber(_0x4f6624.factor, MEDIA_CLIP_TIMELINE_ZOOM_WHEEL_FACTOR)),
    _0x89054f = toNumber(_0x4f6624.delta, 0);
  if (!_0x89054f) return clamp(_0x3b2ab8, _0x40e5d4, _0x45023e);
  return clamp(_0x3b2ab8 * (_0x89054f > 0 ? 1 / _0x534266 : _0x534266), _0x40e5d4, _0x45023e);
}
export function getMediaClipTimelineZoomScrollLeft(_0x26ab69 = {}) {
  const _0x7adbd6 = Math.max(1, toNumber(_0x26ab69.viewportWidthPx, 1)),
    _0x39a836 = clamp(toNumber(_0x26ab69.anchorX, _0x7adbd6 / 2), 0, _0x7adbd6),
    _0x4f99a8 = Math.max(1, toNumber(_0x26ab69.nextContentWidthPx, 1)),
    _0x17a0cf = Math.max(0, _0x4f99a8 - _0x7adbd6),
    _0xc7304 = toNumber(_0x26ab69.anchorSec, NaN),
    _0x1d4ee6 = Math.max(1, toNumber(_0x26ab69.trackWidthPx, 1));
  if (Number.isFinite(_0xc7304)) {
    const _0x1d1346 = getMediaClipTimelineDisplayDuration(_0x26ab69.durationSec),
      _0x11db9e = clamp(_0xc7304 / _0x1d1346, 0, 1);
    return Math.max(0, Math.min(_0x17a0cf, Math.round(_0x11db9e * _0x1d4ee6 - _0x39a836)));
  }
  const _0x3fb5ff = clamp(toNumber(_0x26ab69.anchorRatio, 0), 0, 1);
  return Math.max(0, Math.min(_0x17a0cf, Math.round(_0x3fb5ff * _0x4f99a8 - _0x39a836)));
}
function chooseTimelineTickStep(_0x2d0847, _0x101328 = 0) {
  const _0x4d078e = getMediaClipTimelineDisplayDuration(_0x2d0847),
    _0x4327f3 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(_0x101328, 0)),
    _0x2b40dd = _0x4327f3 / Math.max(1, _0x4d078e),
    _0x1df8f9 = MEDIA_CLIP_TIMELINE_TICK_MIN_SPACING_PX / Math.max(0.001, _0x2b40dd),
    _0x3078b5 =
      MEDIA_CLIP_TIMELINE_TICK_STEPS_ASC.find((_0x277976) => _0x277976 >= _0x1df8f9) ||
      MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[0],
    _0x1e32b2 = Math.max(0, MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC.indexOf(_0x3078b5));
  for (let _0x34ba35 = _0x1e32b2; _0x34ba35 < MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC.length; _0x34ba35 += 1) {
    const _0x5a4986 = MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[_0x34ba35];
    if (_0x5a4986 === 1 || _0x4d078e / _0x5a4986 >= MEDIA_CLIP_TIMELINE_MIN_RULER_INTERVALS) return _0x5a4986;
  }
  return 1;
}
export function buildMediaClipTimelineTicks(_0x3d69fb, _0x2fd666 = 0) {
  const _0x34e7c4 = getMediaClipTimelineDisplayDuration(_0x3d69fb),
    _0x264403 = chooseTimelineTickStep(_0x34e7c4, _0x2fd666),
    _0x52d742 = [];
  for (let _0x1abaf5 = 0; _0x1abaf5 <= _0x34e7c4 + 0.001; _0x1abaf5 += _0x264403) {
    _0x52d742.push(roundMs(_0x1abaf5));
  }
  return _0x52d742;
}
export const MEDIA_CLIP_TIMELINE_RULER_MARK_MIN_SPACING_PX = 0x2c;

export const MEDIA_CLIP_TIMELINE_RULER_MARK_MAX_COUNT = 0x7d0;

export const MEDIA_CLIP_TIMELINE_FRAME_MARK_MIN_SPACING_PX = 0xc;

export const MEDIA_CLIP_TIMELINE_FRAME_MARK_MAX_COUNT = 0x2ee0;

const MEDIA_CLIP_TIMELINE_RULER_MARK_STEPS_ASC = Object['freeze']([0.1, 0.2, 0.5, 0x1, 0x2, 0x5, 0xa, 0xf]);

export function buildMediaClipTimelineRulerMarks(_0x3286cf, _0x32cfd9 = 0x0, _0x198149 = {}) {
  const _0x272a65 = getMediaClipTimelineDisplayDuration(_0x3286cf),
    _0x24442c = Math['max'](MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(_0x32cfd9, 0x0)),
    _0x89c8ff = _0x24442c / Math['max'](0x1, _0x272a65),
    _0x393edb = Math['max'](0x0, Math['round'](toNumber(_0x198149['frameRate'], 0x0))),
    _0x4ca16b = _0x393edb > 0x0 ? Math['floor'](_0x272a65 * _0x393edb + 0.0001) : 0x0,
    _0x344628 =
      _0x393edb > 0x0 &&
      _0x89c8ff / _0x393edb >= MEDIA_CLIP_TIMELINE_FRAME_MARK_MIN_SPACING_PX &&
      _0x4ca16b + 0x1 <= MEDIA_CLIP_TIMELINE_FRAME_MARK_MAX_COUNT;
  if (_0x344628) {
    const _0x109030 = _0x393edb % 0x2 === 0x0 ? _0x393edb / 0x2 : 0x0;
    return Array['from']({ length: _0x4ca16b + 0x1 }, (_0x33078e, _0x3386f4) => ({
      sec: _0x3386f4 / _0x393edb,
      frameIndex: _0x3386f4,
      isFrame: !![],
      isMajor: _0x3386f4 % _0x393edb === 0x0,
      isMid:
        _0x3386f4 > 0x0 && _0x109030 > 0x0 && _0x3386f4 % _0x109030 === 0x0 && _0x3386f4 % _0x393edb !== 0x0,
    }));
  }
  const _0x42eba4 = buildMediaClipTimelineTicks(_0x272a65, _0x24442c),
    _0x358a70 = Math['max'](0.1, Number(_0x42eba4[0x1]) - Number(_0x42eba4[0x0]) || 0x1),
    _0x551afb =
      MEDIA_CLIP_TIMELINE_RULER_MARK_STEPS_ASC['find']((_0xbfd14a) => {
        const _0x10034d = _0x358a70 / _0xbfd14a;
        return (
          _0xbfd14a <= _0x358a70 &&
          Math['abs'](_0x10034d - Math['round'](_0x10034d)) < 0.0001 &&
          _0xbfd14a * _0x89c8ff >= MEDIA_CLIP_TIMELINE_RULER_MARK_MIN_SPACING_PX &&
          Math['ceil'](_0x272a65 / _0xbfd14a) + 0x1 <= MEDIA_CLIP_TIMELINE_RULER_MARK_MAX_COUNT
        );
      }) || _0x358a70,
    _0xd26c9a = new Set(_0x42eba4['map']((_0x316834) => _0x316834['toFixed'](0x3))),
    _0x10c087 = _0x358a70 / 0x2,
    _0x3b2659 = [];
  for (let _0x1f81fa = 0x0; _0x1f81fa <= _0x272a65 + 0.001; _0x1f81fa += _0x551afb) {
    const _0x18a14a = roundMs(_0x1f81fa),
      _0x311df9 = _0xd26c9a['has'](_0x18a14a['toFixed'](0x3)),
      _0x25588b = _0x10c087 > 0x0 ? _0x18a14a / _0x10c087 : 0x0;
    _0x3b2659['push']({
      sec: _0x18a14a,
      frameIndex: -0x1,
      isFrame: ![],
      isMajor: _0x311df9,
      isMid:
        !_0x311df9 && _0x10c087 >= _0x551afb && Math['abs'](_0x25588b - Math['round'](_0x25588b)) < 0.0001,
    });
  }
  return _0x3b2659;
}
