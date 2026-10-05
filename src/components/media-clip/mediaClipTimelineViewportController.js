import {
  MEDIA_CLIP_TIMELINE_ZOOM_MAX,
  MEDIA_CLIP_TIMELINE_ZOOM_MIN,
  normalizeMediaClipTimelineView,
} from './mediaClipState.js';
import {
  MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  getMediaClipTimelineDisplayDuration,
  getMediaClipTimelineNextZoom,
  getMediaClipTimelineRangeRect,
  getMediaClipTimelineZoomScrollLeft,
  shouldLockMediaClipTimelineWheelScroll,
} from './mediaClipTimelineModel.js';
import { toNumber } from './mediaClipUtils.js';
const TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX = 48,
  TIMELINE_DRAG_AUTO_SCROLL_MAX_PX = 18;
export function primeTimelineScroll(value, enabled) {
  if (!enabled) return 0;
  const item = Math['max'](
      0,
      toNumber(value['_timelineScrollLeft'], value['_timelineView']?.['scrollLeft'] || 0),
    ),
    viewportWidthPx = value['_timelineViewportWidth'](),
    trackWidthPx = value['_timelineTrackContentWidth'](),
    maxScrollPx = Math['max'](0, value['_timelineContentWidth'](trackWidthPx) - viewportWidthPx),
    key = value['_clampTimelineScrollLeft'](enabled, item, {
      maxScrollPx: maxScrollPx,
      trackWidthPx: trackWidthPx,
      viewportWidthPx: viewportWidthPx,
    });
  ((value['_restoringTimelineScroll'] = enabled),
    (enabled['scrollLeft'] = key),
    value['_syncTimelineScrollFade'](enabled));
  const index = () => {
    value['_restoringTimelineScroll'] === enabled && (value['_restoringTimelineScroll'] = null);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(index);
  else setTimeout(index, 0);
  return key;
}
export function bindTimelineScroll(persist, scrollLeft) {
  if (!scrollLeft) return;
  (scrollLeft['addEventListener'](
    'wheel',
    (event) => {
      if (event['ctrlKey'] || event['metaKey']) {
        persist['_handleTimelineZoomWheel'](scrollLeft, event);
        return;
      }
      const maxScrollPx2 = Math['max'](0, scrollLeft['scrollWidth'] - scrollLeft['clientWidth']);
      if (maxScrollPx2 <= 0) {
        persist['_mediaClip']['expanded'] === !![] && (event['preventDefault'](), event['stopPropagation']());
        return;
      }
      const enabled2 =
        Math['abs'](event['deltaX']) > Math['abs'](event['deltaY']) ? event['deltaX'] : event['deltaY'];
      if (!enabled2) return;
      if (persist['_shouldLockTimelineWheelScroll'](scrollLeft, { maxScrollPx: maxScrollPx2 })) {
        (event['preventDefault'](), event['stopPropagation']());
        Math['abs'](scrollLeft['scrollLeft']) > 0.5 &&
          ((scrollLeft['scrollLeft'] = 0),
          persist['_updateTimelineView']({ scrollLeft: 0 }, { persist: !![], renderOnPersist: ![] }));
        persist['_syncTimelineScrollFade'](scrollLeft);
        return;
      }
      (event['preventDefault'](),
        event['stopPropagation'](),
        (scrollLeft['scrollLeft'] = persist['_clampTimelineScrollLeft'](
          scrollLeft,
          scrollLeft['scrollLeft'] + enabled2,
          { maxScrollPx: maxScrollPx2 },
        )),
        persist['_updateTimelineView'](
          { scrollLeft: scrollLeft['scrollLeft'] },
          { persist: !![], renderOnPersist: ![] },
        ),
        persist['_syncTimelineScrollFade'](scrollLeft));
    },
    { passive: ![] },
  ),
    scrollLeft['addEventListener']('scroll', () => {
      const scrollLeft2 = persist['_clampTimelineScrollLeft'](scrollLeft, scrollLeft['scrollLeft']);
      if (Math['abs'](scrollLeft2 - scrollLeft['scrollLeft']) > 0.5) {
        scrollLeft['scrollLeft'] = scrollLeft2;
        return;
      }
      (persist['_updateTimelineView'](
        { scrollLeft: scrollLeft2 },
        {
          persist: persist['_restoringTimelineScroll'] !== scrollLeft && !persist['_timelineDrag'](),
          renderOnPersist: ![],
        },
      ),
        persist['_syncTimelineScrollFade'](scrollLeft));
    }));
  const result = () => {
    const maxScrollPx3 = Math['max'](0, scrollLeft['scrollWidth'] - scrollLeft['clientWidth']);
    ((persist['_restoringTimelineScroll'] = scrollLeft),
      (scrollLeft['scrollLeft'] = persist['_clampTimelineScrollLeft'](
        scrollLeft,
        persist['_timelineScrollLeft'],
        { maxScrollPx: maxScrollPx3 },
      )),
      persist['_syncTimelineScrollFade'](scrollLeft));
    const data = () => {
      persist['_restoringTimelineScroll'] === scrollLeft && (persist['_restoringTimelineScroll'] = null);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(data);
    else setTimeout(data, 0);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(result);
  else setTimeout(result, 0);
}
export function shouldLockTimelineWheelScroll(options, el, target = {}) {
  if (!el) return ![];
  const maxScrollPx4 = Math['max'](
      0,
      toNumber(target['maxScrollPx'], el['scrollWidth'] - el['clientWidth']),
    ),
    viewportWidthPx2 = Math['max'](1, toNumber(target['viewportWidthPx'], el['clientWidth'])),
    trackWidthPx2 = Math['max'](
      0,
      toNumber(target['trackWidthPx'], options['_timelineTrackContentWidth']()),
    );
  return shouldLockMediaClipTimelineWheelScroll({
    trackWidthPx: trackWidthPx2,
    viewportWidthPx: viewportWidthPx2,
    maxScrollPx: maxScrollPx4,
  });
}
export function timelineMaterialRangeSec(source) {
  const startSec = [],
    handler = (next, current) => {
      const startSec2 = Math['max'](0, toNumber(next, 0)),
        endSec = Math['max'](startSec2, toNumber(current, startSec2));
      if (endSec > startSec2) startSec['push']({ startSec: startSec2, endSec: endSec });
    },
    entry = source['_mediaClip']?.['tracks']?.['video'] || null,
    list = source['_videoTimelineClips'](entry);
  if (list['length'])
    list['forEach']((record) => {
      handler(record['timelineStartSec'], record['timelineEndSec']);
    });
  else entry && handler(entry['startSec'], entry['endSec'] || entry['durationSec']);
  const payload = source['_mediaClip']?.['tracks']?.['audio'] || null;
  if (payload) {
    const list2 = source['_audioTimelineClips'](payload);
    list2['length']
      ? list2['forEach']((handle) => {
          handler(handle['timelineStartSec'], handle['timelineEndSec']);
        })
      : handler(payload['startSec'], payload['endSec'] || payload['durationSec']);
  }
  if (!startSec['length']) return { startSec: 0, endSec: 0 };
  return startSec['reduce'](
    (state, config) => ({
      startSec: Math['min'](state['startSec'], config['startSec']),
      endSec: Math['max'](state['endSec'], config['endSec']),
    }),
    { startSec: startSec[0]['startSec'], endSec: startSec[0]['endSec'] },
  );
}
export function timelineMaterialScrollBounds(scope, el2, input = {}) {
  const output = Math['max'](
      1,
      toNumber(input['viewportWidthPx'], el2?.['clientWidth'] || scope['_timelineViewportWidth']()),
    ),
    maxScrollLeft = Math['max'](0, toNumber(input['maxScrollPx'], (el2?.['scrollWidth'] || 0) - output));
  if (maxScrollLeft <= 0) return { minScrollLeft: 0, maxScrollLeft: 0 };
  const startSec3 = scope['_timelineMaterialRangeSec']();
  if (!(startSec3['endSec'] > startSec3['startSec']))
    return { minScrollLeft: 0, maxScrollLeft: maxScrollLeft };
  const durationSec = getMediaClipTimelineDisplayDuration(
      input['displayDurationSec'] ?? scope['_primaryDuration'](),
    ),
    trackWidthPx3 = Math['max'](1, toNumber(input['trackWidthPx'], scope['_timelineTrackContentWidth']())),
    mediaClipTimelineRangeRect = getMediaClipTimelineRangeRect({
      startSec: startSec3['startSec'],
      endSec: startSec3['endSec'],
      durationSec: durationSec,
      trackWidthPx: trackWidthPx3,
      minWidthPct: 0,
    }),
    value2 = Math['max'](0, toNumber(mediaClipTimelineRangeRect['leftPx'], 0)),
    value3 = Math['max'](value2, value2 + toNumber(mediaClipTimelineRangeRect['widthPx'], 0)),
    value4 =
      scope['_timelineAddSlotLeftPx'](trackWidthPx3, {
        displayDurationSec: durationSec,
        materialEndSec: startSec3['endSec'],
      }) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
    value5 = Math['max'](value3, value4),
    value6 = Math['max'](0, value3 - value2);
  let minScrollLeft = 0,
    maxScrollLeft2 = maxScrollLeft;
  if (value6 < output) {
    maxScrollLeft2 = Math['min'](maxScrollLeft, value2);
    const value7 = Math['max'](0, value5 - output),
      value8 = Math['max'](0, value3 - output);
    minScrollLeft = Math['min'](maxScrollLeft, value7 <= maxScrollLeft2 ? value7 : value8);
  } else
    ((minScrollLeft = Math['min'](maxScrollLeft, Math['max'](0, value2))),
      (maxScrollLeft2 = Math['min'](maxScrollLeft, Math['max'](0, value5 - output))));
  return (
    (minScrollLeft = Math['max'](0, Math['min'](maxScrollLeft, minScrollLeft))),
    (maxScrollLeft2 = Math['max'](minScrollLeft, Math['min'](maxScrollLeft, maxScrollLeft2))),
    { minScrollLeft: minScrollLeft, maxScrollLeft: maxScrollLeft2 }
  );
}
export function clampTimelineScrollLeft(value9, el3, value10 = 0, args = {}) {
  if (!el3) return 0;
  const maxScrollPx5 = Math['max'](
    0,
    toNumber(args['maxScrollPx'], el3['scrollWidth'] - el3['clientWidth']),
  );
  if (value9['_shouldLockTimelineWheelScroll'](el3, { ...args, maxScrollPx: maxScrollPx5 })) return 0;
  const value11 = value9['_timelineMaterialScrollBounds'](el3, {
    ...args,
    maxScrollPx: maxScrollPx5,
  });
  return Math['max'](value11['minScrollLeft'], Math['min'](value11['maxScrollLeft'], toNumber(value10, 0)));
}
export function handleTimelineZoomWheel(durationSec2, width2, event2) {
  if (!width2) return;
  const value12 = Number(event2['deltaX']) || 0,
    value13 = Number(event2['deltaY']) || 0,
    delta = Math['abs'](value12) > Math['abs'](value13) ? value12 : value13;
  if (!delta) return;
  (event2['preventDefault'](), event2['stopPropagation']());
  const currentZoom = normalizeMediaClipTimelineView(durationSec2['_timelineView']),
    zoom = getMediaClipTimelineNextZoom({
      currentZoom: currentZoom['zoom'],
      delta: delta,
      minZoom: MEDIA_CLIP_TIMELINE_ZOOM_MIN,
      maxZoom: MEDIA_CLIP_TIMELINE_ZOOM_MAX,
    });
  if (Math['abs'](zoom - currentZoom['zoom']) < 0.001) return;
  const box = width2['getBoundingClientRect']?.() || {
      left: 0,
      width: width2['clientWidth'] || 0,
    },
    viewportWidthPx3 = Math['max'](1, width2['clientWidth'] || box['width'] || 1),
    anchorX = Math['max'](
      0,
      Math['min'](
        viewportWidthPx3,
        Number['isFinite'](event2['clientX'])
          ? event2['clientX'] - (box['left'] || 0)
          : viewportWidthPx3 / 2,
      ),
    ),
    value14 = durationSec2['_timelineTrackContentWidth']({ timelineZoom: currentZoom['zoom'] }),
    mediaClipTimelineDisplayDuration = getMediaClipTimelineDisplayDuration(
      durationSec2['_primaryDuration']({ timelineZoom: currentZoom['zoom'] }),
    ),
    anchorSec = Math['max'](
      0,
      Math['min'](
        mediaClipTimelineDisplayDuration,
        ((Math['max'](0, width2['scrollLeft'] || 0) + anchorX) / Math['max'](1, value14)) *
          mediaClipTimelineDisplayDuration,
      ),
    );
  durationSec2['_updateTimelineView']({ zoom: zoom }, { persist: ![] });
  const trackWidthPx4 = durationSec2['_timelineTrackContentWidth']({ timelineZoom: zoom }),
    durationSec3 = getMediaClipTimelineDisplayDuration(
      durationSec2['_primaryDuration']({ timelineZoom: zoom }),
    ),
    nextContentWidthPx = durationSec2['_timelineContentWidth'](trackWidthPx4);
  durationSec2['_syncTimelineContentWidth'](trackWidthPx4);
  durationSec2['_mediaClip']['tracks']?.['video'] &&
    durationSec2['_updateTrackVisuals']('video', {
      durationSec: durationSec2['_videoTimelineDuration'](
        durationSec2['_mediaClip']['tracks']['video'],
        null,
        {
          timelineZoom: zoom,
        },
      ),
      syncTimelineWidth: ![],
    });
  durationSec2['_mediaClip']['tracks']?.['audio'] &&
    durationSec2['_updateTrackVisuals']('audio', {
      durationSec: durationSec2['_timelineDurationForKind']('audio', { timelineZoom: zoom }),
      syncTimelineWidth: ![],
    });
  const maxScrollPx6 = Math['max'](0, nextContentWidthPx - viewportWidthPx3),
    scrollLeft3 = durationSec2['_clampTimelineScrollLeft'](
      width2,
      getMediaClipTimelineZoomScrollLeft({
        anchorSec: anchorSec,
        anchorX: anchorX,
        durationSec: durationSec3,
        trackWidthPx: trackWidthPx4,
        nextContentWidthPx: nextContentWidthPx,
        viewportWidthPx: viewportWidthPx3,
      }),
      { trackWidthPx: trackWidthPx4, viewportWidthPx: viewportWidthPx3, maxScrollPx: maxScrollPx6 },
    );
  ((width2['scrollLeft'] = scrollLeft3),
    durationSec2['_updateTimelineView']({ scrollLeft: scrollLeft3 }, { persist: !![], renderOnPersist: ![] }),
    durationSec2['_syncTimelineScrollFade'](width2));
}
export function syncTimelineScrollFade(enabled3, el4) {
  if (!el4) return;
  const maxScrollPx7 = Math['max'](0, el4['scrollWidth'] - el4['clientWidth']),
    value15 = enabled3['_timelineMaterialScrollBounds'](el4, { maxScrollPx: maxScrollPx7 }),
    value16 =
      !enabled3['_shouldLockTimelineWheelScroll'](el4, { maxScrollPx: maxScrollPx7 }) &&
      value15['maxScrollLeft'] > value15['minScrollLeft'] + 1 &&
      el4['scrollLeft'] < value15['maxScrollLeft'] - 2;
  el4['classList']['toggle']('has-right-overflow', value16);
}
export function timelineDragScrollDeltaPx(value17, value18 = value17['_timelineDrag']()) {
  const enabled4 = value18?.['scrollEl'];
  if (!enabled4) return 0;
  return toNumber(enabled4['scrollLeft'], 0) - toNumber(value18['startScrollLeft'], 0);
}
export function timelineDragDeltaPx(value19, value20 = value19['_timelineDrag'](), event3 = {}) {
  const toNumber2 = toNumber(event3?.['clientX'], toNumber(value20?.['latestClientX'], value20?.['startX']));
  return (
    toNumber2 - toNumber(value20?.['startX'], toNumber2) + value19['_timelineDragScrollDeltaPx'](value20)
  );
}
export function timelineDragAutoScrollVelocity(el5, value21) {
  if (!el5 || !Number['isFinite'](value21)) return 0;
  const count = Math['max'](0, el5['scrollWidth'] - el5['clientWidth']);
  if (count <= 0) return 0;
  const box2 = el5['getBoundingClientRect']?.() || {},
    toNumber3 = toNumber(box2['left'], 0),
    value22 = Math['max'](1, toNumber(box2['width'], el5['clientWidth'] || 1)),
    toNumber4 = toNumber(box2['right'], toNumber3 + value22);
  if (value21 < toNumber3 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
    const value23 = Math['max'](
      0,
      Math['min'](
        1,
        (toNumber3 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX - value21) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
      ),
    );
    return -TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * value23;
  }
  if (value21 > toNumber4 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
    const value24 = Math['max'](
      0,
      Math['min'](
        1,
        (value21 - (toNumber4 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX)) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
      ),
    );
    return TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * value24;
  }
  return 0;
}
export function scheduleTimelineDragAutoScroll(enabled5, value25 = enabled5['_timelineDrag']()) {
  const enabled6 = value25?.['scrollEl'],
    toNumber5 = toNumber(value25?.['latestClientX'], Number['NaN']);
  if (!enabled6 || !Number['isFinite'](toNumber5)) return;
  if (!enabled5['_timelineDragAutoScrollVelocity'](enabled6, toNumber5)) return;
  if (enabled5['_timelineDragAutoScrollRaf']) return;
  const value26 = value25['sessionId'],
    value27 = () => {
      ((enabled5['_timelineDragAutoScrollRaf'] = 0), enabled5['_runTimelineDragAutoScroll'](value26));
    };
  enabled5['_timelineDragAutoScrollRaf'] =
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(value27) : setTimeout(value27, 16);
}
export function stopTimelineDragAutoScroll(value28) {
  const enabled7 = value28['_timelineDragAutoScrollRaf'];
  if (!enabled7) return;
  try {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(enabled7);
  } catch {}
  try {
    clearTimeout(enabled7);
  } catch {}
  value28['_timelineDragAutoScrollRaf'] = 0;
}
export function runTimelineDragAutoScroll(value29, value30) {
  const enabled8 = value29['_timelineDrag']();
  if (!enabled8 || enabled8['sessionId'] !== value30) return;
  const el6 = enabled8['scrollEl'],
    clientX = toNumber(enabled8['latestClientX'], Number['NaN']),
    enabled9 = value29['_timelineDragAutoScrollVelocity'](el6, clientX);
  if (!el6 || !enabled9) return;
  const maxScrollPx8 = Math['max'](0, el6['scrollWidth'] - el6['clientWidth']),
    toNumber6 = toNumber(el6['scrollLeft'], 0),
    scrollLeft4 = value29['_clampTimelineScrollLeft'](el6, toNumber6 + enabled9, {
      maxScrollPx: maxScrollPx8,
    });
  if (Math['abs'](scrollLeft4 - toNumber6) <= 0.01) return;
  ((el6['scrollLeft'] = scrollLeft4),
    value29['_updateTimelineView']({ scrollLeft: scrollLeft4 }, { persist: ![], renderOnPersist: ![] }),
    value29['_syncTimelineScrollFade'](el6),
    value29['_applyTimelineDragPreviewFromPointer'](enabled8, { clientX: clientX }),
    value29['_scheduleTimelineDragAutoScroll'](enabled8));
}
export function persistTimelineDragScroll(value31, value32 = value31['_timelineDrag']()) {
  const enabled10 = value32?.['scrollEl'];
  if (!enabled10) return;
  const scrollLeft5 = value31['_clampTimelineScrollLeft'](enabled10, enabled10['scrollLeft']);
  (Math['abs'](scrollLeft5 - toNumber(enabled10['scrollLeft'], 0)) > 0.01 &&
    (enabled10['scrollLeft'] = scrollLeft5),
    value31['_syncTimelineScrollFade'](enabled10),
    value31['_updateTimelineView']({ scrollLeft: scrollLeft5 }, { persist: !![], renderOnPersist: ![] }));
}
