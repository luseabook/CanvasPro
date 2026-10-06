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
function toNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clamp(index, result, data) {
  return Math.max(result, Math.min(data, index));
}
function roundMs(options) {
  return Math.round(toNumber(options, 0) * 1000) / 1000;
}
export function getMediaClipTimelineDisplayDuration(target = 0) {
  return Math.max(MEDIA_CLIP_TIMELINE_MIN_DISPLAY_SEC, toNumber(target, 0));
}
export function getMediaClipTimelineRatio(source = 0, next = 0) {
  const mediaClipTimelineDisplayDuration = getMediaClipTimelineDisplayDuration(next);
  return clamp(toNumber(source, 0) / mediaClipTimelineDisplayDuration, 0, 1);
}
export function getMediaClipTimelinePercent(current = 0, entry = 0) {
  return getMediaClipTimelineRatio(current, entry) * 100;
}
export function getMediaClipTimelinePx(record = 0, payload = {}) {
  const handle = Math.max(1, toNumber(payload.trackWidthPx, 1));
  return getMediaClipTimelineRatio(record, payload.durationSec) * handle;
}
export function getMediaClipTimelineSecFromPx(state = 0, config = {}) {
  const scope = Math.max(1, toNumber(config.trackWidthPx, 1)),
    mediaClipTimelineDisplayDuration2 = getMediaClipTimelineDisplayDuration(config.durationSec);
  return roundMs(clamp(toNumber(state, 0) / scope, 0, 1) * mediaClipTimelineDisplayDuration2);
}
export function getMediaClipTimelineSecFromClientX(input = 0, output = {}) {
  const toNumber2 = toNumber(output.trackLeftPx, 0);
  return getMediaClipTimelineSecFromPx(toNumber(input, toNumber2) - toNumber2, output);
}
export function getMediaClipTimelineDeltaSecFromPx(value2 = 0, value3 = {}) {
  const value4 = Math.max(1, toNumber(value3.trackWidthPx, 1)),
    mediaClipTimelineDisplayDuration3 = getMediaClipTimelineDisplayDuration(value3.durationSec);
  return (toNumber(value2, 0) / value4) * mediaClipTimelineDisplayDuration3;
}
export function getMediaClipTimelineRangeRect(options2 = {}) {
  const mediaClipTimelineDisplayDuration4 = getMediaClipTimelineDisplayDuration(options2.durationSec),
    startSec = clamp(toNumber(options2.startSec, 0), 0, mediaClipTimelineDisplayDuration4),
    endSec = clamp(toNumber(options2.endSec, startSec), startSec, mediaClipTimelineDisplayDuration4),
    leftPct = getMediaClipTimelinePercent(startSec, mediaClipTimelineDisplayDuration4),
    rightPct = Math.max(leftPct, getMediaClipTimelinePercent(endSec, mediaClipTimelineDisplayDuration4)),
    value5 = Math.max(
      toNumber(options2.minWidthPct, MEDIA_CLIP_TIMELINE_MIN_SEGMENT_WIDTH_PCT),
      rightPct - leftPct,
    ),
    leftPx = Math.max(0, toNumber(options2.trackWidthPx, 0));
  return {
    startSec: startSec,
    endSec: endSec,
    leftPct: leftPct,
    rightPct: rightPct,
    widthPct: Math.min(100 - leftPct, value5),
    leftPx: leftPx > 0 ? (leftPct / 100) * leftPx : 0,
    widthPx: leftPx > 0 ? ((rightPct - leftPct) / 100) * leftPx : 0,
  };
}
export function getMediaClipTimelinePlayheadModel(options3 = {}) {
  const sec = clamp(
    toNumber(options3.playheadSec, 0),
    0,
    getMediaClipTimelineDisplayDuration(options3.durationSec),
  );
  return {
    sec: sec,
    leftPct: getMediaClipTimelinePercent(sec, options3.durationSec),
    leftPx: getMediaClipTimelinePx(sec, options3),
  };
}
export function getMediaClipTimelineTrackWidthPx(box = {}) {
  const value6 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, Math.ceil(toNumber(box.viewportWidthPx, 0))),
    mediaClipTimelineDisplayDuration5 = getMediaClipTimelineDisplayDuration(box.durationSec),
    value7 = Math.max(1, toNumber(box.pxPerSec, MEDIA_CLIP_TIMELINE_SCROLL_PX_PER_SEC)),
    value8 = Math.max(0.001, toNumber(box.zoom, 1)),
    value9 = Math.max(value6, mediaClipTimelineDisplayDuration5 * value7);
  return Math.ceil(Math.max(value6, value9 * value8));
}
export function getMediaClipFrameCount(value10 = 0) {
  const value11 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(value10, 0));
  return Math.max(
    MEDIA_CLIP_TIMELINE_FRAME_COUNT_MIN,
    Math.min(
      MEDIA_CLIP_TIMELINE_FRAME_COUNT_MAX,
      Math.ceil(value11 / MEDIA_CLIP_TIMELINE_FRAME_MIN_WIDTH_PX),
    ),
  );
}
export function shouldLockMediaClipTimelineWheelScroll(options4 = {}) {
  const value12 = Math.max(0, toNumber(options4.trackWidthPx, 0)),
    value13 = Math.max(1, toNumber(options4.viewportWidthPx, 1)),
    count = Math.max(0, toNumber(options4.maxScrollPx, 0)),
    value14 = MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX;
  return count > 0 && value12 <= value13 + 1 && count <= value14 + 4;
}
export function getMediaClipTimelineAddSlotLeftPx(options5 = {}) {
  const count2 = Math.max(0, toNumber(options5.trackWidthPx, 0)),
    mediaClipTimelineDisplayDuration6 = getMediaClipTimelineDisplayDuration(options5.displayDurationSec),
    clamp2 = clamp(toNumber(options5.materialEndSec, 0), 0, mediaClipTimelineDisplayDuration6);
  if (mediaClipTimelineDisplayDuration6 <= 0 || count2 <= 0) return MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX;
  return Math.round(
    (clamp2 / mediaClipTimelineDisplayDuration6) * count2 + MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX,
  );
}
export function getMediaClipTimelineContentWidthPx(options6 = {}) {
  const value15 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, Math.ceil(toNumber(options6.trackWidthPx, 0)));
  return Math.max(
    value15,
    getMediaClipTimelineAddSlotLeftPx(options6) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  );
}
export function getMediaClipTimelineNextZoom(options7 = {}) {
  const value16 = Math.max(0.001, toNumber(options7.currentZoom, 1)),
    value17 = Math.max(0.001, toNumber(options7.minZoom, 0.5)),
    value18 = Math.max(value17, toNumber(options7.maxZoom, 6)),
    value19 = Math.max(1.001, toNumber(options7.factor, MEDIA_CLIP_TIMELINE_ZOOM_WHEEL_FACTOR)),
    toNumber3 = toNumber(options7.delta, 0);
  if (!toNumber3) return clamp(value16, value17, value18);
  return clamp(value16 * (toNumber3 > 0 ? 1 / value19 : value19), value17, value18);
}
export function getMediaClipTimelineZoomScrollLeft(options8 = {}) {
  const value20 = Math.max(1, toNumber(options8.viewportWidthPx, 1)),
    clamp3 = clamp(toNumber(options8.anchorX, value20 / 2), 0, value20),
    value21 = Math.max(1, toNumber(options8.nextContentWidthPx, 1)),
    value22 = Math.max(0, value21 - value20),
    toNumber4 = toNumber(options8.anchorSec, NaN),
    value23 = Math.max(1, toNumber(options8.trackWidthPx, 1));
  if (Number.isFinite(toNumber4)) {
    const mediaClipTimelineDisplayDuration7 = getMediaClipTimelineDisplayDuration(options8.durationSec),
      clamp4 = clamp(toNumber4 / mediaClipTimelineDisplayDuration7, 0, 1);
    return Math.max(0, Math.min(value22, Math.round(clamp4 * value23 - clamp3)));
  }
  const clamp5 = clamp(toNumber(options8.anchorRatio, 0), 0, 1);
  return Math.max(0, Math.min(value22, Math.round(clamp5 * value21 - clamp3)));
}
function chooseTimelineTickStep(value24, value25 = 0) {
  const mediaClipTimelineDisplayDuration8 = getMediaClipTimelineDisplayDuration(value24),
    value26 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(value25, 0)),
    value27 = value26 / Math.max(1, mediaClipTimelineDisplayDuration8),
    value28 = MEDIA_CLIP_TIMELINE_TICK_MIN_SPACING_PX / Math.max(0.001, value27),
    value29 =
      MEDIA_CLIP_TIMELINE_TICK_STEPS_ASC.find((item2) => item2 >= value28) ||
      MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[0],
    value30 = Math.max(0, MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC.indexOf(value29));
  for (let value31 = value30; value31 < MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC.length; value31 += 1) {
    const count3 = MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[value31];
    if (count3 === 1 || mediaClipTimelineDisplayDuration8 / count3 >= MEDIA_CLIP_TIMELINE_MIN_RULER_INTERVALS)
      return count3;
  }
  return 1;
}
export function buildMediaClipTimelineTicks(value32, value33 = 0) {
  const mediaClipTimelineDisplayDuration9 = getMediaClipTimelineDisplayDuration(value32),
    chooseTimelineTickStep2 = chooseTimelineTickStep(mediaClipTimelineDisplayDuration9, value33),
    list = [];
  for (
    let value34 = 0;
    value34 <= mediaClipTimelineDisplayDuration9 + 0.001;
    value34 += chooseTimelineTickStep2
  ) {
    list.push(roundMs(value34));
  }
  return list;
}
export const MEDIA_CLIP_TIMELINE_RULER_MARK_MIN_SPACING_PX = 44;

export const MEDIA_CLIP_TIMELINE_RULER_MARK_MAX_COUNT = 2000;

export const MEDIA_CLIP_TIMELINE_FRAME_MARK_MIN_SPACING_PX = 12;

export const MEDIA_CLIP_TIMELINE_FRAME_MARK_MAX_COUNT = 12000;

const MEDIA_CLIP_TIMELINE_RULER_MARK_STEPS_ASC = Object.freeze([0.1, 0.2, 0.5, 1, 2, 5, 10, 15]);

export function buildMediaClipTimelineRulerMarks(value35, value36 = 0, value37 = {}) {
  const mediaClipTimelineDisplayDuration10 = getMediaClipTimelineDisplayDuration(value35),
    value38 = Math.max(MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(value36, 0)),
    value39 = value38 / Math.max(1, mediaClipTimelineDisplayDuration10),
    count4 = Math.max(0, Math.round(toNumber(value37.frameRate, 0))),
    length = count4 > 0 ? Math.floor(mediaClipTimelineDisplayDuration10 * count4 + 0.0001) : 0,
    value40 =
      count4 > 0 &&
      value39 / count4 >= MEDIA_CLIP_TIMELINE_FRAME_MARK_MIN_SPACING_PX &&
      length + 1 <= MEDIA_CLIP_TIMELINE_FRAME_MARK_MAX_COUNT;
  if (value40) {
    const count5 = count4 % 2 === 0 ? count4 / 2 : 0;
    return Array.from({ length: length + 1 }, (value41, sec2) => ({
      sec: sec2 / count4,
      frameIndex: sec2,
      isFrame: true,
      isMajor: sec2 % count4 === 0,
      isMid: sec2 > 0 && count5 > 0 && sec2 % count5 === 0 && sec2 % count4 !== 0,
    }));
  }
  const list2 = buildMediaClipTimelineTicks(mediaClipTimelineDisplayDuration10, value38),
    value42 = Math.max(0.1, Number(list2[1]) - Number(list2[0]) || 1),
    value43 =
      MEDIA_CLIP_TIMELINE_RULER_MARK_STEPS_ASC.find((value44) => {
        const value45 = value42 / value44;
        return (
          value44 <= value42 &&
          Math.abs(value45 - Math.round(value45)) < 0.0001 &&
          value44 * value39 >= MEDIA_CLIP_TIMELINE_RULER_MARK_MIN_SPACING_PX &&
          Math.ceil(mediaClipTimelineDisplayDuration10 / value44) + 1 <=
            MEDIA_CLIP_TIMELINE_RULER_MARK_MAX_COUNT
        );
      }) || value42,
    map = new Set(list2.map((value46) => value46.toFixed(3))),
    count6 = value42 / 2,
    list3 = [];
  for (let value47 = 0; value47 <= mediaClipTimelineDisplayDuration10 + 0.001; value47 += value43) {
    const sec3 = roundMs(value47),
      isMajor = map.has(sec3.toFixed(3)),
      value48 = count6 > 0 ? sec3 / count6 : 0;
    list3.push({
      sec: sec3,
      frameIndex: -1,
      isFrame: false,
      isMajor: isMajor,
      isMid: !isMajor && count6 >= value43 && Math.abs(value48 - Math.round(value48)) < 0.0001,
    });
  }
  return list3;
}
