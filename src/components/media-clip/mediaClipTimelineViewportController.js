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
const TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX = 0x30,
  TIMELINE_DRAG_AUTO_SCROLL_MAX_PX = 0x12;
export function primeTimelineScroll(_0x586c27, _0x39b817) {
  if (!_0x39b817) return 0x0;
  const _0x57421b = Math['max'](
      0x0,
      toNumber(_0x586c27['_timelineScrollLeft'], _0x586c27['_timelineView']?.['scrollLeft'] || 0x0),
    ),
    _0x27b9a0 = _0x586c27['_timelineViewportWidth'](),
    _0x50e939 = _0x586c27['_timelineTrackContentWidth'](),
    _0x217868 = Math['max'](0x0, _0x586c27['_timelineContentWidth'](_0x50e939) - _0x27b9a0),
    _0x569a29 = _0x586c27['_clampTimelineScrollLeft'](_0x39b817, _0x57421b, {
      maxScrollPx: _0x217868,
      trackWidthPx: _0x50e939,
      viewportWidthPx: _0x27b9a0,
    });
  ((_0x586c27['_restoringTimelineScroll'] = _0x39b817),
    (_0x39b817['scrollLeft'] = _0x569a29),
    _0x586c27['_syncTimelineScrollFade'](_0x39b817));
  const _0x253cf8 = () => {
    _0x586c27['_restoringTimelineScroll'] === _0x39b817 && (_0x586c27['_restoringTimelineScroll'] = null);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0x253cf8);
  else setTimeout(_0x253cf8, 0x0);
  return _0x569a29;
}
export function bindTimelineScroll(_0x1b35d1, _0x1f8649) {
  if (!_0x1f8649) return;
  (_0x1f8649['addEventListener'](
    'wheel',
    (_0x37e579) => {
      if (_0x37e579['ctrlKey'] || _0x37e579['metaKey']) {
        _0x1b35d1['_handleTimelineZoomWheel'](_0x1f8649, _0x37e579);
        return;
      }
      const _0x49f2c6 = Math['max'](0x0, _0x1f8649['scrollWidth'] - _0x1f8649['clientWidth']);
      if (_0x49f2c6 <= 0x0) {
        _0x1b35d1['_mediaClip']['expanded'] === !![] &&
          (_0x37e579['preventDefault'](), _0x37e579['stopPropagation']());
        return;
      }
      const _0x4afbd8 =
        Math['abs'](_0x37e579['deltaX']) > Math['abs'](_0x37e579['deltaY'])
          ? _0x37e579['deltaX']
          : _0x37e579['deltaY'];
      if (!_0x4afbd8) return;
      if (_0x1b35d1['_shouldLockTimelineWheelScroll'](_0x1f8649, { maxScrollPx: _0x49f2c6 })) {
        (_0x37e579['preventDefault'](), _0x37e579['stopPropagation']());
        Math['abs'](_0x1f8649['scrollLeft']) > 0.5 &&
          ((_0x1f8649['scrollLeft'] = 0x0),
          _0x1b35d1['_updateTimelineView']({ scrollLeft: 0x0 }, { persist: !![], renderOnPersist: ![] }));
        _0x1b35d1['_syncTimelineScrollFade'](_0x1f8649);
        return;
      }
      (_0x37e579['preventDefault'](),
        _0x37e579['stopPropagation'](),
        (_0x1f8649['scrollLeft'] = _0x1b35d1['_clampTimelineScrollLeft'](
          _0x1f8649,
          _0x1f8649['scrollLeft'] + _0x4afbd8,
          { maxScrollPx: _0x49f2c6 },
        )),
        _0x1b35d1['_updateTimelineView'](
          { scrollLeft: _0x1f8649['scrollLeft'] },
          { persist: !![], renderOnPersist: ![] },
        ),
        _0x1b35d1['_syncTimelineScrollFade'](_0x1f8649));
    },
    { passive: ![] },
  ),
    _0x1f8649['addEventListener']('scroll', () => {
      const _0x2f7526 = _0x1b35d1['_clampTimelineScrollLeft'](_0x1f8649, _0x1f8649['scrollLeft']);
      if (Math['abs'](_0x2f7526 - _0x1f8649['scrollLeft']) > 0.5) {
        _0x1f8649['scrollLeft'] = _0x2f7526;
        return;
      }
      (_0x1b35d1['_updateTimelineView'](
        { scrollLeft: _0x2f7526 },
        {
          persist: _0x1b35d1['_restoringTimelineScroll'] !== _0x1f8649 && !_0x1b35d1['_timelineDrag'](),
          renderOnPersist: ![],
        },
      ),
        _0x1b35d1['_syncTimelineScrollFade'](_0x1f8649));
    }));
  const _0x2fbdf4 = () => {
    const _0x561d30 = Math['max'](0x0, _0x1f8649['scrollWidth'] - _0x1f8649['clientWidth']);
    ((_0x1b35d1['_restoringTimelineScroll'] = _0x1f8649),
      (_0x1f8649['scrollLeft'] = _0x1b35d1['_clampTimelineScrollLeft'](
        _0x1f8649,
        _0x1b35d1['_timelineScrollLeft'],
        { maxScrollPx: _0x561d30 },
      )),
      _0x1b35d1['_syncTimelineScrollFade'](_0x1f8649));
    const _0xfa6cfe = () => {
      _0x1b35d1['_restoringTimelineScroll'] === _0x1f8649 && (_0x1b35d1['_restoringTimelineScroll'] = null);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0xfa6cfe);
    else setTimeout(_0xfa6cfe, 0x0);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0x2fbdf4);
  else setTimeout(_0x2fbdf4, 0x0);
}
export function shouldLockTimelineWheelScroll(_0x476ef1, _0x230452, _0x226fbd = {}) {
  if (!_0x230452) return ![];
  const _0x1cdad1 = Math['max'](
      0x0,
      toNumber(_0x226fbd['maxScrollPx'], _0x230452['scrollWidth'] - _0x230452['clientWidth']),
    ),
    _0x3f115a = Math['max'](0x1, toNumber(_0x226fbd['viewportWidthPx'], _0x230452['clientWidth'])),
    _0xc43ed3 = Math['max'](
      0x0,
      toNumber(_0x226fbd['trackWidthPx'], _0x476ef1['_timelineTrackContentWidth']()),
    );
  return shouldLockMediaClipTimelineWheelScroll({
    trackWidthPx: _0xc43ed3,
    viewportWidthPx: _0x3f115a,
    maxScrollPx: _0x1cdad1,
  });
}
export function timelineMaterialRangeSec(_0x588d32) {
  const _0x49c946 = [],
    _0x4c1e19 = (_0x201815, _0x1ed872) => {
      const _0x5ddc43 = Math['max'](0x0, toNumber(_0x201815, 0x0)),
        _0x47a4fa = Math['max'](_0x5ddc43, toNumber(_0x1ed872, _0x5ddc43));
      if (_0x47a4fa > _0x5ddc43) _0x49c946['push']({ startSec: _0x5ddc43, endSec: _0x47a4fa });
    },
    _0x63923e = _0x588d32['_mediaClip']?.['tracks']?.['video'] || null,
    _0x16b21b = _0x588d32['_videoTimelineClips'](_0x63923e);
  if (_0x16b21b['length'])
    _0x16b21b['forEach']((_0x242bdf) => {
      _0x4c1e19(_0x242bdf['timelineStartSec'], _0x242bdf['timelineEndSec']);
    });
  else _0x63923e && _0x4c1e19(_0x63923e['startSec'], _0x63923e['endSec'] || _0x63923e['durationSec']);
  const _0x30ef90 = _0x588d32['_mediaClip']?.['tracks']?.['audio'] || null;
  if (_0x30ef90) {
    const _0x2bfb14 = _0x588d32['_audioTimelineClips'](_0x30ef90);
    _0x2bfb14['length']
      ? _0x2bfb14['forEach']((_0x1c35a0) => {
          _0x4c1e19(_0x1c35a0['timelineStartSec'], _0x1c35a0['timelineEndSec']);
        })
      : _0x4c1e19(_0x30ef90['startSec'], _0x30ef90['endSec'] || _0x30ef90['durationSec']);
  }
  if (!_0x49c946['length']) return { startSec: 0x0, endSec: 0x0 };
  return _0x49c946['reduce'](
    (_0x1b6ba2, _0x740a41) => ({
      startSec: Math['min'](_0x1b6ba2['startSec'], _0x740a41['startSec']),
      endSec: Math['max'](_0x1b6ba2['endSec'], _0x740a41['endSec']),
    }),
    { startSec: _0x49c946[0x0]['startSec'], endSec: _0x49c946[0x0]['endSec'] },
  );
}
export function timelineMaterialScrollBounds(_0x1957bc, _0x1b91a0, _0x5bf9a6 = {}) {
  const _0x4f890b = Math['max'](
      0x1,
      toNumber(
        _0x5bf9a6['viewportWidthPx'],
        _0x1b91a0?.['clientWidth'] || _0x1957bc['_timelineViewportWidth'](),
      ),
    ),
    _0x1e35b4 = Math['max'](
      0x0,
      toNumber(_0x5bf9a6['maxScrollPx'], (_0x1b91a0?.['scrollWidth'] || 0x0) - _0x4f890b),
    );
  if (_0x1e35b4 <= 0x0) return { minScrollLeft: 0x0, maxScrollLeft: 0x0 };
  const _0x108bbf = _0x1957bc['_timelineMaterialRangeSec']();
  if (!(_0x108bbf['endSec'] > _0x108bbf['startSec'])) return { minScrollLeft: 0x0, maxScrollLeft: _0x1e35b4 };
  const _0x512963 = getMediaClipTimelineDisplayDuration(
      _0x5bf9a6['displayDurationSec'] ?? _0x1957bc['_primaryDuration'](),
    ),
    _0x34f19b = Math['max'](
      0x1,
      toNumber(_0x5bf9a6['trackWidthPx'], _0x1957bc['_timelineTrackContentWidth']()),
    ),
    _0x5e3b25 = getMediaClipTimelineRangeRect({
      startSec: _0x108bbf['startSec'],
      endSec: _0x108bbf['endSec'],
      durationSec: _0x512963,
      trackWidthPx: _0x34f19b,
      minWidthPct: 0x0,
    }),
    _0x173b2e = Math['max'](0x0, toNumber(_0x5e3b25['leftPx'], 0x0)),
    _0x160446 = Math['max'](_0x173b2e, _0x173b2e + toNumber(_0x5e3b25['widthPx'], 0x0)),
    _0x3ee7e1 =
      _0x1957bc['_timelineAddSlotLeftPx'](_0x34f19b, {
        displayDurationSec: _0x512963,
        materialEndSec: _0x108bbf['endSec'],
      }) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
    _0x4eefa0 = Math['max'](_0x160446, _0x3ee7e1),
    _0x3e74e3 = Math['max'](0x0, _0x160446 - _0x173b2e);
  let _0x277134 = 0x0,
    _0x1e2f52 = _0x1e35b4;
  if (_0x3e74e3 < _0x4f890b) {
    _0x1e2f52 = Math['min'](_0x1e35b4, _0x173b2e);
    const _0x14424b = Math['max'](0x0, _0x4eefa0 - _0x4f890b),
      _0x3204cb = Math['max'](0x0, _0x160446 - _0x4f890b);
    _0x277134 = Math['min'](_0x1e35b4, _0x14424b <= _0x1e2f52 ? _0x14424b : _0x3204cb);
  } else
    ((_0x277134 = Math['min'](_0x1e35b4, Math['max'](0x0, _0x173b2e))),
      (_0x1e2f52 = Math['min'](_0x1e35b4, Math['max'](0x0, _0x4eefa0 - _0x4f890b))));
  return (
    (_0x277134 = Math['max'](0x0, Math['min'](_0x1e35b4, _0x277134))),
    (_0x1e2f52 = Math['max'](_0x277134, Math['min'](_0x1e35b4, _0x1e2f52))),
    { minScrollLeft: _0x277134, maxScrollLeft: _0x1e2f52 }
  );
}
export function clampTimelineScrollLeft(_0x174a0f, _0x4d8d82, _0x3f5c99 = 0x0, _0x2d41c9 = {}) {
  if (!_0x4d8d82) return 0x0;
  const _0x388c67 = Math['max'](
    0x0,
    toNumber(_0x2d41c9['maxScrollPx'], _0x4d8d82['scrollWidth'] - _0x4d8d82['clientWidth']),
  );
  if (_0x174a0f['_shouldLockTimelineWheelScroll'](_0x4d8d82, { ..._0x2d41c9, maxScrollPx: _0x388c67 }))
    return 0x0;
  const _0x1ec783 = _0x174a0f['_timelineMaterialScrollBounds'](_0x4d8d82, {
    ..._0x2d41c9,
    maxScrollPx: _0x388c67,
  });
  return Math['max'](
    _0x1ec783['minScrollLeft'],
    Math['min'](_0x1ec783['maxScrollLeft'], toNumber(_0x3f5c99, 0x0)),
  );
}
export function handleTimelineZoomWheel(_0x94f22a, _0x86c09c, _0x430c51) {
  if (!_0x86c09c) return;
  const _0x55b8f5 = Number(_0x430c51['deltaX']) || 0x0,
    _0x570e8c = Number(_0x430c51['deltaY']) || 0x0,
    _0x3f8f92 = Math['abs'](_0x55b8f5) > Math['abs'](_0x570e8c) ? _0x55b8f5 : _0x570e8c;
  if (!_0x3f8f92) return;
  (_0x430c51['preventDefault'](), _0x430c51['stopPropagation']());
  const _0x379ed5 = normalizeMediaClipTimelineView(_0x94f22a['_timelineView']),
    _0x429ff4 = getMediaClipTimelineNextZoom({
      currentZoom: _0x379ed5['zoom'],
      delta: _0x3f8f92,
      minZoom: MEDIA_CLIP_TIMELINE_ZOOM_MIN,
      maxZoom: MEDIA_CLIP_TIMELINE_ZOOM_MAX,
    });
  if (Math['abs'](_0x429ff4 - _0x379ed5['zoom']) < 0.001) return;
  const _0x3fae85 = _0x86c09c['getBoundingClientRect']?.() || {
      left: 0x0,
      width: _0x86c09c['clientWidth'] || 0x0,
    },
    _0x5540ca = Math['max'](0x1, _0x86c09c['clientWidth'] || _0x3fae85['width'] || 0x1),
    _0xe35076 = Math['max'](
      0x0,
      Math['min'](
        _0x5540ca,
        Number['isFinite'](_0x430c51['clientX'])
          ? _0x430c51['clientX'] - (_0x3fae85['left'] || 0x0)
          : _0x5540ca / 0x2,
      ),
    ),
    _0x240d89 = _0x94f22a['_timelineTrackContentWidth']({ timelineZoom: _0x379ed5['zoom'] }),
    _0x40df7e = getMediaClipTimelineDisplayDuration(
      _0x94f22a['_primaryDuration']({ timelineZoom: _0x379ed5['zoom'] }),
    ),
    _0x1390bc = Math['max'](
      0x0,
      Math['min'](
        _0x40df7e,
        ((Math['max'](0x0, _0x86c09c['scrollLeft'] || 0x0) + _0xe35076) / Math['max'](0x1, _0x240d89)) *
          _0x40df7e,
      ),
    );
  _0x94f22a['_updateTimelineView']({ zoom: _0x429ff4 }, { persist: ![] });
  const _0x79b5c7 = _0x94f22a['_timelineTrackContentWidth']({ timelineZoom: _0x429ff4 }),
    _0x449897 = getMediaClipTimelineDisplayDuration(
      _0x94f22a['_primaryDuration']({ timelineZoom: _0x429ff4 }),
    ),
    _0x3f05f8 = _0x94f22a['_timelineContentWidth'](_0x79b5c7);
  _0x94f22a['_syncTimelineContentWidth'](_0x79b5c7);
  _0x94f22a['_mediaClip']['tracks']?.['video'] &&
    _0x94f22a['_updateTrackVisuals']('video', {
      durationSec: _0x94f22a['_videoTimelineDuration'](_0x94f22a['_mediaClip']['tracks']['video'], null, {
        timelineZoom: _0x429ff4,
      }),
      syncTimelineWidth: ![],
    });
  _0x94f22a['_mediaClip']['tracks']?.['audio'] &&
    _0x94f22a['_updateTrackVisuals']('audio', {
      durationSec: _0x94f22a['_timelineDurationForKind']('audio', { timelineZoom: _0x429ff4 }),
      syncTimelineWidth: ![],
    });
  const _0x463062 = Math['max'](0x0, _0x3f05f8 - _0x5540ca),
    _0xfbfd61 = _0x94f22a['_clampTimelineScrollLeft'](
      _0x86c09c,
      getMediaClipTimelineZoomScrollLeft({
        anchorSec: _0x1390bc,
        anchorX: _0xe35076,
        durationSec: _0x449897,
        trackWidthPx: _0x79b5c7,
        nextContentWidthPx: _0x3f05f8,
        viewportWidthPx: _0x5540ca,
      }),
      { trackWidthPx: _0x79b5c7, viewportWidthPx: _0x5540ca, maxScrollPx: _0x463062 },
    );
  ((_0x86c09c['scrollLeft'] = _0xfbfd61),
    _0x94f22a['_updateTimelineView']({ scrollLeft: _0xfbfd61 }, { persist: !![], renderOnPersist: ![] }),
    _0x94f22a['_syncTimelineScrollFade'](_0x86c09c));
}
export function syncTimelineScrollFade(_0x3e449b, _0x27ab8e) {
  if (!_0x27ab8e) return;
  const _0x425b9c = Math['max'](0x0, _0x27ab8e['scrollWidth'] - _0x27ab8e['clientWidth']),
    _0x321707 = _0x3e449b['_timelineMaterialScrollBounds'](_0x27ab8e, { maxScrollPx: _0x425b9c }),
    _0x1a89e2 =
      !_0x3e449b['_shouldLockTimelineWheelScroll'](_0x27ab8e, { maxScrollPx: _0x425b9c }) &&
      _0x321707['maxScrollLeft'] > _0x321707['minScrollLeft'] + 0x1 &&
      _0x27ab8e['scrollLeft'] < _0x321707['maxScrollLeft'] - 0x2;
  _0x27ab8e['classList']['toggle']('has-right-overflow', _0x1a89e2);
}
export function timelineDragScrollDeltaPx(_0x5b1485, _0x4fe9b2 = _0x5b1485['_timelineDrag']()) {
  const _0x1b6ed6 = _0x4fe9b2?.['scrollEl'];
  if (!_0x1b6ed6) return 0x0;
  return toNumber(_0x1b6ed6['scrollLeft'], 0x0) - toNumber(_0x4fe9b2['startScrollLeft'], 0x0);
}
export function timelineDragDeltaPx(_0x739bf9, _0x95bd1b = _0x739bf9['_timelineDrag'](), _0x1bdf25 = {}) {
  const _0x56dbb8 = toNumber(
    _0x1bdf25?.['clientX'],
    toNumber(_0x95bd1b?.['latestClientX'], _0x95bd1b?.['startX']),
  );
  return (
    _0x56dbb8 -
    toNumber(_0x95bd1b?.['startX'], _0x56dbb8) +
    _0x739bf9['_timelineDragScrollDeltaPx'](_0x95bd1b)
  );
}
export function timelineDragAutoScrollVelocity(_0x31139a, _0x2422cd) {
  if (!_0x31139a || !Number['isFinite'](_0x2422cd)) return 0x0;
  const _0xb2cb29 = Math['max'](0x0, _0x31139a['scrollWidth'] - _0x31139a['clientWidth']);
  if (_0xb2cb29 <= 0x0) return 0x0;
  const _0x2044dc = _0x31139a['getBoundingClientRect']?.() || {},
    _0xee6072 = toNumber(_0x2044dc['left'], 0x0),
    _0x3154c6 = Math['max'](0x1, toNumber(_0x2044dc['width'], _0x31139a['clientWidth'] || 0x1)),
    _0x6cf610 = toNumber(_0x2044dc['right'], _0xee6072 + _0x3154c6);
  if (_0x2422cd < _0xee6072 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
    const _0x5b478d = Math['max'](
      0x0,
      Math['min'](
        0x1,
        (_0xee6072 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX - _0x2422cd) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
      ),
    );
    return -TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * _0x5b478d;
  }
  if (_0x2422cd > _0x6cf610 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
    const _0x311f22 = Math['max'](
      0x0,
      Math['min'](
        0x1,
        (_0x2422cd - (_0x6cf610 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX)) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
      ),
    );
    return TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * _0x311f22;
  }
  return 0x0;
}
export function scheduleTimelineDragAutoScroll(_0x4d320f, _0x34b91d = _0x4d320f['_timelineDrag']()) {
  const _0x24a7c8 = _0x34b91d?.['scrollEl'],
    _0x51c8a5 = toNumber(_0x34b91d?.['latestClientX'], Number['NaN']);
  if (!_0x24a7c8 || !Number['isFinite'](_0x51c8a5)) return;
  if (!_0x4d320f['_timelineDragAutoScrollVelocity'](_0x24a7c8, _0x51c8a5)) return;
  if (_0x4d320f['_timelineDragAutoScrollRaf']) return;
  const _0x135288 = _0x34b91d['sessionId'],
    _0x18fd97 = () => {
      ((_0x4d320f['_timelineDragAutoScrollRaf'] = 0x0), _0x4d320f['_runTimelineDragAutoScroll'](_0x135288));
    };
  _0x4d320f['_timelineDragAutoScrollRaf'] =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(_0x18fd97)
      : setTimeout(_0x18fd97, 0x10);
}
export function stopTimelineDragAutoScroll(_0x45884b) {
  const _0x598fb4 = _0x45884b['_timelineDragAutoScrollRaf'];
  if (!_0x598fb4) return;
  try {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_0x598fb4);
  } catch {}
  try {
    clearTimeout(_0x598fb4);
  } catch {}
  _0x45884b['_timelineDragAutoScrollRaf'] = 0x0;
}
export function runTimelineDragAutoScroll(_0x3cfc17, _0xd4b841) {
  const _0x418204 = _0x3cfc17['_timelineDrag']();
  if (!_0x418204 || _0x418204['sessionId'] !== _0xd4b841) return;
  const _0x12e8f4 = _0x418204['scrollEl'],
    _0x484ba7 = toNumber(_0x418204['latestClientX'], Number['NaN']),
    _0x56e61a = _0x3cfc17['_timelineDragAutoScrollVelocity'](_0x12e8f4, _0x484ba7);
  if (!_0x12e8f4 || !_0x56e61a) return;
  const _0x11325f = Math['max'](0x0, _0x12e8f4['scrollWidth'] - _0x12e8f4['clientWidth']),
    _0xbbd2b4 = toNumber(_0x12e8f4['scrollLeft'], 0x0),
    _0x1ccfdc = _0x3cfc17['_clampTimelineScrollLeft'](_0x12e8f4, _0xbbd2b4 + _0x56e61a, {
      maxScrollPx: _0x11325f,
    });
  if (Math['abs'](_0x1ccfdc - _0xbbd2b4) <= 0.01) return;
  ((_0x12e8f4['scrollLeft'] = _0x1ccfdc),
    _0x3cfc17['_updateTimelineView']({ scrollLeft: _0x1ccfdc }, { persist: ![], renderOnPersist: ![] }),
    _0x3cfc17['_syncTimelineScrollFade'](_0x12e8f4),
    _0x3cfc17['_applyTimelineDragPreviewFromPointer'](_0x418204, { clientX: _0x484ba7 }),
    _0x3cfc17['_scheduleTimelineDragAutoScroll'](_0x418204));
}
export function persistTimelineDragScroll(_0xb788cd, _0x334028 = _0xb788cd['_timelineDrag']()) {
  const _0x448f64 = _0x334028?.['scrollEl'];
  if (!_0x448f64) return;
  const _0x128a8f = _0xb788cd['_clampTimelineScrollLeft'](_0x448f64, _0x448f64['scrollLeft']);
  (Math['abs'](_0x128a8f - toNumber(_0x448f64['scrollLeft'], 0x0)) > 0.01 &&
    (_0x448f64['scrollLeft'] = _0x128a8f),
    _0xb788cd['_syncTimelineScrollFade'](_0x448f64),
    _0xb788cd['_updateTimelineView']({ scrollLeft: _0x128a8f }, { persist: !![], renderOnPersist: ![] }));
}
