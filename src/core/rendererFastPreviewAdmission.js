const BACKGROUND_NODE_LIMIT = 0x208,
  MEDIA_LIMIT = 0x208,
  LOW_ZOOM_THRESHOLD = 0.45,
  LOW_ZOOM_MEDIA_LIMIT = 0x80,
  VERY_LOW_ZOOM_THRESHOLD = 0.32,
  VERY_LOW_ZOOM_MEDIA_LIMIT = 0x60,
  BUSY_LOW_ZOOM_MEDIA_LIMIT = 0x20,
  REFERENCE_VIEWPORT_AREA = 0x5a0 * 0x3c0,
  SCALED_MEDIA_LIMIT_MAX = 0xf0,
  MEDIUM_PREFETCH_MIN = 0xb4,
  MEDIUM_PREFETCH_MAX = 0x104,
  MEDIUM_PREFETCH_MEDIA_LIMIT = 0x20,
  NON_MEDIA_LIMIT = 0x30,
  LOW_PRIORITY_IMMEDIATE_SRC_LIMIT = 0x18,
  LOW_PRIORITY_LARGE_IMMEDIATE_SRC_LIMIT = 0xc,
  NORMAL_IMMEDIATE_SRC_LIMIT = 0x20,
  NODE_CREATE_IMMEDIATE_LIMIT = 0x8,
  REQUIRED_NODE_CREATE_IMMEDIATE_LIMIT = 0x10,
  POOLED_NODE_CREATE_IMMEDIATE_LIMIT = 0x20,
  NODE_CREATE_BATCH_SIZE = 0x8,
  LARGE_CANDIDATE_COUNT = 0xb4,
  HUGE_CANDIDATE_COUNT = 0x168,
  LARGE_NODE_CREATE_IMMEDIATE_LIMIT = 0x8,
  HUGE_NODE_CREATE_IMMEDIATE_LIMIT = 0x8,
  LARGE_NODE_CREATE_BATCH_SIZE = 0x8,
  HUGE_NODE_CREATE_BATCH_SIZE = 0x8,
  BUSY_IMMEDIATE_SRC_LIMIT = 0x10,
  BUSY_MOTION_AHEAD_MEDIA_LIMIT = 0x6,
  VIDEO_IMMEDIATE_SRC_LIMIT = 0x10,
  LARGE_VIDEO_IMMEDIATE_SRC_LIMIT = 0xa,
  HUGE_VIDEO_IMMEDIATE_SRC_LIMIT = 0x8,
  BUSY_VIDEO_IMMEDIATE_SRC_LIMIT = 0x2,
  DENSE_INITIAL_IMMEDIATE_SRC_LIMIT = 0x2,
  DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT = 0x1,
  MOTION_LOOKAHEAD_FACTOR = 1.5,
  MOTION_AHEAD_PADDING = 0x140,
  VIDEO_EDGE_PREFETCH_PADDING = 0xf0,
  LOW_ZOOM_EDGE_PREFETCH_MIN_ZOOM = 0.38,
  LOW_ZOOM_EDGE_PREFETCH_PADDING = 0x2d0;
function normalizeViewport(_0x18fd8a = {}) {
  const _0x565468 = Number(_0x18fd8a?.['zoom']);
  return {
    x: Number['isFinite'](Number(_0x18fd8a?.['x'])) ? Number(_0x18fd8a['x']) : 0x0,
    y: Number['isFinite'](Number(_0x18fd8a?.['y'])) ? Number(_0x18fd8a['y']) : 0x0,
    zoom: Number['isFinite'](_0x565468) && _0x565468 > 0x0 ? _0x565468 : 0x1,
  };
}
function resolveRequiredImmediateCreateLimit(_0x4e65ae = {}) {
  const _0x330a5a = Math['trunc'](Number(_0x4e65ae['requiredImmediateCreateLimit']));
  if (!Number['isFinite'](_0x330a5a)) return NODE_CREATE_IMMEDIATE_LIMIT;
  const _0x49fde5 = Math['max'](
      NODE_CREATE_IMMEDIATE_LIMIT,
      Math['min'](_0x330a5a, REQUIRED_NODE_CREATE_IMMEDIATE_LIMIT),
    ),
    _0x427cb6 = Math['max'](0x0, Math['trunc'](Number(_0x4e65ae['availablePreviewNodePoolSize']) || 0x0));
  return Math['min'](POOLED_NODE_CREATE_IMMEDIATE_LIMIT, _0x49fde5 + _0x427cb6);
}
function getViewportContainerSize(_0x2c967a = {}) {
  return {
    width: Math['max'](
      0x1,
      Number(_0x2c967a['containerWidth'] ?? _0x2c967a['containerW']) ||
        (typeof window !== 'undefined' ? Number(window['innerWidth']) : 0x0) ||
        0x640,
    ),
    height: Math['max'](
      0x1,
      Number(_0x2c967a['containerHeight'] ?? _0x2c967a['containerH']) ||
        (typeof window !== 'undefined' ? Number(window['innerHeight']) : 0x0) ||
        0x384,
    ),
  };
}
function getViewportWorldRect(_0x4b50f8 = {}) {
  const _0x313fd3 = normalizeViewport(_0x4b50f8['viewport']),
    { width: _0x3b4e00, height: _0x46c28c } = getViewportContainerSize(_0x4b50f8);
  return {
    left: (0x0 - _0x313fd3['x']) / _0x313fd3['zoom'],
    top: (0x0 - _0x313fd3['y']) / _0x313fd3['zoom'],
    right: (_0x3b4e00 - _0x313fd3['x']) / _0x313fd3['zoom'],
    bottom: (_0x46c28c - _0x313fd3['y']) / _0x313fd3['zoom'],
  };
}
function getViewportWorldCenter(_0x5876c7 = {}) {
  const _0x31fe40 = normalizeViewport(_0x5876c7['viewport']),
    { width: _0x3e366c, height: _0x241864 } = getViewportContainerSize(_0x5876c7);
  return {
    x: ((0x0 - _0x31fe40['x']) / _0x31fe40['zoom'] + (_0x3e366c - _0x31fe40['x']) / _0x31fe40['zoom']) / 0x2,
    y: ((0x0 - _0x31fe40['y']) / _0x31fe40['zoom'] + (_0x241864 - _0x31fe40['y']) / _0x31fe40['zoom']) / 0x2,
  };
}
function getPreviewDistanceSq(_0x58d798, _0x28db05) {
  if (!_0x58d798 || !_0x28db05) return 0x0;
  const _0x5f27ef = _0x58d798['x'] + _0x58d798['width'] / 0x2 - _0x28db05['x'],
    _0x345f1b = _0x58d798['y'] + _0x58d798['height'] / 0x2 - _0x28db05['y'];
  return _0x5f27ef * _0x5f27ef + _0x345f1b * _0x345f1b;
}
function getMotionAdjustedPreviewDistanceSq(_0x59dd01, _0x1df08e, _0x539245 = {}) {
  const _0xa153f3 = _0x1df08e || _0x539245?.['previewMotion']?.['center'];
  if (!_0x59dd01 || !_0xa153f3) return getPreviewDistanceSq(_0x59dd01, _0xa153f3);
  const _0x5cb1bc = _0x539245?.['previewMotion'];
  if (!_0x5cb1bc?.['active']) return getPreviewDistanceSq(_0x59dd01, _0xa153f3);
  const _0x5e85ab = {
    x: _0xa153f3['x'] + _0x5cb1bc['dx'] * MOTION_LOOKAHEAD_FACTOR,
    y: _0xa153f3['y'] + _0x5cb1bc['dy'] * MOTION_LOOKAHEAD_FACTOR,
  };
  return getPreviewDistanceSq(_0x59dd01, _0x5e85ab);
}
function getPreviewViewportDistanceSq(_0x434498, _0x17ea4 = {}) {
  if (!_0x434498) return 0x0;
  const _0x25c3c5 = getViewportWorldRect(_0x17ea4),
    _0x38d425 = Number(_0x434498['x']) || 0x0,
    _0xddf667 = Number(_0x434498['y']) || 0x0,
    _0xd7a087 = _0x38d425 + Math['max'](0x1, Number(_0x434498['width']) || 0x0),
    _0x2e1cf5 = _0xddf667 + Math['max'](0x1, Number(_0x434498['height']) || 0x0),
    _0xde62d9 =
      _0xd7a087 < _0x25c3c5['left']
        ? _0x25c3c5['left'] - _0xd7a087
        : _0x38d425 > _0x25c3c5['right']
          ? _0x38d425 - _0x25c3c5['right']
          : 0x0,
    _0x574def =
      _0x2e1cf5 < _0x25c3c5['top']
        ? _0x25c3c5['top'] - _0x2e1cf5
        : _0xddf667 > _0x25c3c5['bottom']
          ? _0xddf667 - _0x25c3c5['bottom']
          : 0x0;
  return _0xde62d9 * _0xde62d9 + _0x574def * _0x574def;
}
function getMotionAheadViewportOptions(_0x1ae960 = {}) {
  const _0x32e135 = _0x1ae960?.['previewMotion'];
  if (!_0x32e135?.['active']) return null;
  const _0x48fea3 = normalizeViewport(_0x1ae960['viewport']);
  return {
    ..._0x1ae960,
    viewport: {
      ..._0x48fea3,
      x: _0x48fea3['x'] - _0x32e135['dx'] * _0x48fea3['zoom'] * MOTION_LOOKAHEAD_FACTOR,
      y: _0x48fea3['y'] - _0x32e135['dy'] * _0x48fea3['zoom'] * MOTION_LOOKAHEAD_FACTOR,
    },
  };
}
function getPreviewMediaPriorityDistanceSq(_0xa76994, _0x35eff2, _0x385294 = {}) {
  if (isRendererFastPreviewGeometryVisible(_0xa76994, _0x385294))
    return getMotionAdjustedPreviewDistanceSq(
      _0xa76994,
      _0x35eff2 || getViewportWorldCenter(_0x385294),
      _0x385294,
    );
  const _0x3a9032 = Number(_0x385294?.['viewport']?.['zoom']),
    _0x32310b =
      _0x385294?.['viewportBusy'] === !![] ||
      (Number['isFinite'](_0x3a9032) && _0x3a9032 <= LOW_ZOOM_THRESHOLD);
  if (!_0x32310b) return getMotionAdjustedPreviewDistanceSq(_0xa76994, _0x35eff2, _0x385294);
  const _0x182f1c = getMotionAheadViewportOptions(_0x385294);
  return getPreviewViewportDistanceSq(_0xa76994, _0x182f1c || _0x385294);
}
export function isRendererFastPreviewGeometryVisible(_0x3d71c9, _0x2a7c0e = {}, _0x4849c8 = 0x0) {
  if (!_0x3d71c9) return ![];
  const _0xeaeb7e = normalizeViewport(_0x2a7c0e['viewport']),
    { width: _0x126a62, height: _0x65f759 } = getViewportContainerSize(_0x2a7c0e),
    _0x220232 = _0x3d71c9['x'] * _0xeaeb7e['zoom'] + _0xeaeb7e['x'],
    _0x452137 = _0x3d71c9['y'] * _0xeaeb7e['zoom'] + _0xeaeb7e['y'],
    _0x4d3e6d = _0x3d71c9['width'] * _0xeaeb7e['zoom'],
    _0x255cfc = _0x3d71c9['height'] * _0xeaeb7e['zoom'],
    _0x31064c = Math['max'](0x0, Number(_0x4849c8) || 0x0);
  return (
    _0x220232 + _0x4d3e6d > -_0x31064c &&
    _0x220232 < _0x126a62 + _0x31064c &&
    _0x452137 + _0x255cfc > -_0x31064c &&
    _0x452137 < _0x65f759 + _0x31064c
  );
}
function isGeometryMotionAhead(_0x3cad76, _0x4563fa = {}) {
  const _0x24f4db = getMotionAheadViewportOptions(_0x4563fa);
  return !!(_0x24f4db && isRendererFastPreviewGeometryVisible(_0x3cad76, _0x24f4db, MOTION_AHEAD_PADDING));
}
function isGeometryInMotionDirection(_0x13f072, _0x172c0b = {}) {
  const _0x2ea8e8 = _0x172c0b?.['previewMotion'];
  if (!_0x13f072 || !_0x2ea8e8?.['active']) return ![];
  const _0xda7aa7 = getViewportWorldRect(_0x172c0b),
    _0x1cdac0 = (Number(_0x13f072['x']) || 0x0) + Math['max'](0x1, Number(_0x13f072['width']) || 0x0) / 0x2,
    _0x34684d = (Number(_0x13f072['y']) || 0x0) + Math['max'](0x1, Number(_0x13f072['height']) || 0x0) / 0x2;
  if (Math['abs'](_0x2ea8e8['dx']) >= Math['abs'](_0x2ea8e8['dy']))
    return _0x2ea8e8['dx'] >= 0x0 ? _0x1cdac0 > _0xda7aa7['right'] : _0x1cdac0 < _0xda7aa7['left'];
  return _0x2ea8e8['dy'] >= 0x0 ? _0x34684d > _0xda7aa7['bottom'] : _0x34684d < _0xda7aa7['top'];
}
function isGeometryAtMotionFront(_0x4bea34, _0xdd9d71 = {}) {
  return (
    isGeometryInMotionDirection(_0x4bea34, _0xdd9d71) &&
    isRendererFastPreviewGeometryVisible(_0x4bea34, _0xdd9d71, MOTION_AHEAD_PADDING)
  );
}
export function selectRendererMotionAheadMediaIds(_0x54ea79, _0x2125cf = {}) {
  return new Set(
    _0x54ea79['filter'](
      (_0xa2b44) =>
        !isRendererFastPreviewGeometryVisible(_0xa2b44['geometry'], _0x2125cf) &&
        isRendererFastPreviewMediaReadable(_0xa2b44['geometry'], _0x2125cf) &&
        isGeometryAtMotionFront(_0xa2b44['geometry'], _0x2125cf),
    )
      ['sort'](
        (_0xfb14a1, _0x371d6c) =>
          getPreviewViewportDistanceSq(_0xfb14a1['geometry'], _0x2125cf) -
          getPreviewViewportDistanceSq(_0x371d6c['geometry'], _0x2125cf),
      )
      ['slice'](0x0, BUSY_MOTION_AHEAD_MEDIA_LIMIT)
      ['map']((_0x43b03c) => _0x43b03c['nodeId']),
  );
}
export function isRendererFastPreviewMediaReadable(_0xbb55f, _0x5c540c = {}) {
  return (
    Math['max'](Number(_0xbb55f?.['width']) || 0x0, Number(_0xbb55f?.['height']) || 0x0) *
      normalizeViewport(_0x5c540c['viewport'])['zoom'] >=
    0x40
  );
}
function isGeometryAtVideoPrefetchEdge(_0x13e8cd, _0x1d1423 = {}) {
  if (_0x1d1423?.['viewportBusy'] === !![]) return ![];
  return isRendererFastPreviewGeometryVisible(_0x13e8cd, _0x1d1423, VIDEO_EDGE_PREFETCH_PADDING);
}
function isGeometryNearViewport(_0x2966bf, _0x900398 = {}) {
  const _0x7387e6 = Number(_0x900398?.['viewport']?.['zoom']);
  if (
    !Number['isFinite'](_0x7387e6) ||
    _0x7387e6 < LOW_ZOOM_EDGE_PREFETCH_MIN_ZOOM ||
    _0x7387e6 > LOW_ZOOM_THRESHOLD
  )
    return ![];
  return isRendererFastPreviewGeometryVisible(_0x2966bf, _0x900398, LOW_ZOOM_EDGE_PREFETCH_PADDING);
}
function resolveImmediateCreateLimit(_0x17dbb9) {
  if (_0x17dbb9 >= HUGE_CANDIDATE_COUNT) return HUGE_NODE_CREATE_IMMEDIATE_LIMIT;
  if (_0x17dbb9 >= LARGE_CANDIDATE_COUNT) return LARGE_NODE_CREATE_IMMEDIATE_LIMIT;
  return NODE_CREATE_IMMEDIATE_LIMIT;
}
function resolveCreateBatchSize(_0x4ff4f7) {
  if (_0x4ff4f7 >= HUGE_CANDIDATE_COUNT) return HUGE_NODE_CREATE_BATCH_SIZE;
  if (_0x4ff4f7 >= LARGE_CANDIDATE_COUNT) return LARGE_NODE_CREATE_BATCH_SIZE;
  return NODE_CREATE_BATCH_SIZE;
}
function getCandidateUserRank(_0x444b06 = {}) {
  if (_0x444b06['selected'] || _0x444b06['retained'] || _0x444b06['continuationPending']) return 0x0;
  if (_0x444b06['visible'] || _0x444b06['motionFront'] || _0x444b06['motionAhead']) return 0x1;
  if (_0x444b06['mounted']) return 0x2;
  return 0x3;
}
function hasCandidateMedia(_0x27bb60 = {}) {
  return (
    _0x27bb60['hasMediaHint'] === !![] ||
    (Array['isArray'](_0x27bb60['sources']) && _0x27bb60['sources']['length'] > 0x0)
  );
}
export function resolveRendererFastPreviewMediaQueuePriority(_0x3a1fe9 = {}, _0x596d38 = {}) {
  const _0xf4fea0 = _0x596d38?.['previewMotion']?.['center'] || getViewportWorldCenter(_0x596d38);
  return {
    userRank: getCandidateUserRank(_0x3a1fe9),
    distanceSq: getPreviewMediaPriorityDistanceSq(_0x3a1fe9['geometry'], _0xf4fea0, _0x596d38),
    order: Number(_0x3a1fe9['order'] || 0x0),
  };
}
function shouldPrioritizeMediaOrder(_0xa62d95, _0x525f4a = {}) {
  if (!Array['isArray'](_0xa62d95) || _0xa62d95['length'] === 0x0) return ![];
  const _0x4c3751 = _0xa62d95['filter']((_0x171b0e) => hasCandidateMedia(_0x171b0e))['length'];
  if (_0x4c3751 === 0x0) return ![];
  const _0x50844d = Number(_0x525f4a?.['viewport']?.['zoom']),
    _0x521543 = _0xa62d95['some']((_0x5d6045) => _0x5d6045['visible'] && hasCandidateMedia(_0x5d6045)),
    _0x223ef6 = _0xa62d95['some']((_0x1fa816) => !_0x1fa816['visible'] && hasCandidateMedia(_0x1fa816));
  if (_0x4c3751 > NORMAL_IMMEDIATE_SRC_LIMIT && _0x521543 && _0x223ef6) return !![];
  return (
    _0x525f4a['viewportBusy'] === !![] || (Number['isFinite'](_0x50844d) && _0x50844d <= LOW_ZOOM_THRESHOLD)
  );
}
function buildCandidatePriority(_0x2b9397, _0x51d271, _0x54751b) {
  return {
    candidate: _0x2b9397,
    userRank: getCandidateUserRank(_0x2b9397),
    mediaRank: hasCandidateMedia(_0x2b9397) ? 0x0 : 0x1,
    distanceSq: getPreviewMediaPriorityDistanceSq(_0x2b9397['geometry'], _0x51d271, _0x54751b),
    order: _0x2b9397['order'],
  };
}
function compareCandidatePriorities(_0x295af2, _0xb78989) {
  if (_0x295af2['userRank'] !== _0xb78989['userRank']) return _0x295af2['userRank'] - _0xb78989['userRank'];
  if (_0x295af2['mediaRank'] !== _0xb78989['mediaRank'])
    return _0x295af2['mediaRank'] - _0xb78989['mediaRank'];
  if (_0x295af2['distanceSq'] !== _0xb78989['distanceSq'])
    return _0x295af2['distanceSq'] - _0xb78989['distanceSq'];
  return _0x295af2['order'] - _0xb78989['order'];
}
function orderCandidates(_0x615c95, _0x1e16bc = {}) {
  const _0x2aaa66 = _0x615c95['length'] > resolveImmediateCreateLimit(_0x615c95['length']),
    _0x2bcd55 = shouldPrioritizeMediaOrder(_0x615c95, _0x1e16bc);
  if (!_0x2aaa66 && !_0x2bcd55) return _0x615c95;
  const _0x359aa0 = _0x1e16bc?.['previewMotion']?.['center'] || getViewportWorldCenter(_0x1e16bc);
  return _0x615c95['map']((_0x4f9b40) => buildCandidatePriority(_0x4f9b40, _0x359aa0, _0x1e16bc))
    ['sort'](compareCandidatePriorities)
    ['map'](({ candidate: _0x53a776 }) => _0x53a776);
}
function resolveImmediateMediaSrcLimit(_0x23edce, _0x3b562a, _0x46ea7b = {}) {
  if (_0x46ea7b['deferVisibleMediaSrc'] === !![]) return DENSE_INITIAL_IMMEDIATE_SRC_LIMIT;
  if (_0x46ea7b['viewportBusy'] === !![]) return BUSY_IMMEDIATE_SRC_LIMIT;
  if (_0x23edce?.['lowPriority']) {
    if (_0x3b562a >= LARGE_CANDIDATE_COUNT) return LOW_PRIORITY_LARGE_IMMEDIATE_SRC_LIMIT;
    return LOW_PRIORITY_IMMEDIATE_SRC_LIMIT;
  }
  return NORMAL_IMMEDIATE_SRC_LIMIT;
}
function resolveImmediateVideoMediaSrcLimit(_0x43b2a7, _0x1d7076 = {}) {
  if (_0x1d7076['deferVisibleMediaSrc'] === !![]) return DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (_0x1d7076['viewportBusy'] === !![]) return BUSY_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (_0x43b2a7 >= HUGE_CANDIDATE_COUNT) return HUGE_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (_0x43b2a7 >= LARGE_CANDIDATE_COUNT) return LARGE_VIDEO_IMMEDIATE_SRC_LIMIT;
  return VIDEO_IMMEDIATE_SRC_LIMIT;
}
function resolveMediaLimit({
  candidateCount: _0xf1b43d,
  isLowZoom: _0x142cf5,
  isVeryLowZoom: _0x49f926,
  options: _0x4940f6,
  suppressNewMedia: _0x3e813f,
}) {
  if (_0x3e813f) return 0x0;
  if (!_0x142cf5) return MEDIA_LIMIT;
  if (_0x4940f6?.['viewportBusy'] === !![]) return BUSY_LOW_ZOOM_MEDIA_LIMIT;
  const _0x220462 = _0x49f926 ? VERY_LOW_ZOOM_MEDIA_LIMIT : LOW_ZOOM_MEDIA_LIMIT,
    _0x18a7a5 = Number(_0xf1b43d) || 0x0,
    _0x5c6abe = Math['max'](0x1, Number(_0x4940f6['containerWidth'] ?? _0x4940f6['containerW']) || 0x0),
    _0x53cfc7 = Math['max'](0x1, Number(_0x4940f6['containerHeight'] ?? _0x4940f6['containerH']) || 0x0),
    _0x49a8a3 = _0x5c6abe * _0x53cfc7,
    _0x2fecae =
      Number['isFinite'](_0x49a8a3) && _0x49a8a3 > 0x1
        ? Math['max'](0x1, _0x49a8a3 / REFERENCE_VIEWPORT_AREA)
        : 0x1;
  if (!_0x49f926 && _0x18a7a5 >= MEDIUM_PREFETCH_MIN && _0x18a7a5 <= MEDIUM_PREFETCH_MAX)
    return Math['min'](
      SCALED_MEDIA_LIMIT_MAX,
      Math['ceil'](MEDIUM_PREFETCH_MEDIA_LIMIT * _0x2fecae),
      _0x18a7a5,
    );
  if (!Number['isFinite'](_0x49a8a3) || _0x49a8a3 <= 0x1) return _0x220462;
  return Math['min'](SCALED_MEDIA_LIMIT_MAX, Math['max'](_0x220462, Math['ceil'](_0x220462 * _0x2fecae)));
}
function resolveMediaPlan(_0x3c3844, _0x5897af = {}) {
  const _0x47f6e = Number(_0x5897af?.['viewport']?.['zoom']),
    _0x528950 = Number['isFinite'](_0x47f6e) && _0x47f6e <= LOW_ZOOM_THRESHOLD,
    _0x4ba350 = Number['isFinite'](_0x47f6e) && _0x47f6e <= VERY_LOW_ZOOM_THRESHOLD,
    _0xb95fac =
      _0x5897af?.['mediaSourceOwnerIds'] != null &&
      typeof _0x5897af['mediaSourceOwnerIds']?.[Symbol['iterator']] === 'function'
        ? new Set(
            Array['from'](_0x5897af['mediaSourceOwnerIds'], (_0x50fc4f) => String(_0x50fc4f || ''))['filter'](
              Boolean,
            ),
          )
        : null,
    _0x17f155 = _0x5897af?.['suppressNewMedia'] === !![],
    _0x145035 = resolveMediaLimit({
      candidateCount: _0x3c3844['length'],
      isLowZoom: _0x528950,
      isVeryLowZoom: _0x4ba350,
      options: _0x5897af,
      suppressNewMedia: _0x17f155,
    }),
    _0x1f70c3 = _0x3c3844['filter'](
      (_0xc8e3d5) =>
        hasCandidateMedia(_0xc8e3d5) &&
        (_0xb95fac === null ||
          _0xb95fac['has'](_0xc8e3d5['nodeId']) ||
          _0xc8e3d5['fullEligibleVisible'] ||
          _0xc8e3d5['visible'] ||
          _0xc8e3d5['motionFront']),
    );
  if (!_0x17f155 && _0x1f70c3['length'] <= _0x145035)
    return {
      nodeIdsWithMedia: new Set(_0x1f70c3['map']((_0x50ff36) => _0x50ff36['nodeId'])),
      explicitMediaSourceOwnerIds: _0xb95fac,
      lowPriority: _0x528950,
      prefetchAhead: ![],
    };
  const _0x10c0dc = _0x5897af?.['previewMotion']?.['center'],
    _0x484c83 = new Set(
      _0x1f70c3['filter'](
        (_0x4cf9aa) =>
          _0x4cf9aa['fullEligibleVisible'] ||
          _0x4cf9aa['fullEligibleMotionAhead'] ||
          _0x4cf9aa['visible'] ||
          (_0x4cf9aa['kind'] === 'video' && _0x4cf9aa['motionFront']) ||
          _0x4cf9aa['selected'] ||
          _0x4cf9aa['retained'] ||
          _0x4cf9aa['mounted'],
      )['map']((_0x28751c) => _0x28751c['nodeId']),
    );
  _0x528950 &&
    _0x5897af?.['viewportBusy'] === !![] &&
    _0x1f70c3['filter'](
      (_0x1eda56) =>
        !_0x484c83['has'](_0x1eda56['nodeId']) && !_0x1eda56['visible'] && _0x1eda56['motionFront'],
    )
      ['map']((_0x587e77) => ({
        ..._0x587e77,
        distanceSq: getPreviewViewportDistanceSq(_0x587e77['geometry'], _0x5897af),
      }))
      ['sort']((_0x2af9db, _0x12a7e8) => {
        if (_0x2af9db['distanceSq'] !== _0x12a7e8['distanceSq'])
          return _0x2af9db['distanceSq'] - _0x12a7e8['distanceSq'];
        return _0x2af9db['order'] - _0x12a7e8['order'];
      })
      ['slice'](0x0, BUSY_MOTION_AHEAD_MEDIA_LIMIT)
      ['forEach']((_0x3c50f3) => _0x484c83['add'](_0x3c50f3['nodeId']));
  const _0xd54bbd = _0x528950 && _0x5897af?.['viewportBusy'] === !![] && _0x484c83['size'] > 0x0,
    _0x198f2f = _0xd54bbd ? 0x0 : Math['max'](0x0, _0x145035 - _0x484c83['size']),
    _0x1341a6 = _0x1f70c3['filter']((_0x5dc16e) => !_0x484c83['has'](_0x5dc16e['nodeId']))
      ['map']((_0x2d867e) => ({
        ..._0x2d867e,
        priorityRank: _0x2d867e['mounted'] ? 0x0 : 0x1,
        distanceSq: getPreviewMediaPriorityDistanceSq(_0x2d867e['geometry'], _0x10c0dc, _0x5897af),
      }))
      ['sort']((_0x127a84, _0x582f83) => {
        if (_0x127a84['priorityRank'] !== _0x582f83['priorityRank'])
          return _0x127a84['priorityRank'] - _0x582f83['priorityRank'];
        if (_0x127a84['distanceSq'] !== _0x582f83['distanceSq'])
          return _0x127a84['distanceSq'] - _0x582f83['distanceSq'];
        return _0x127a84['order'] - _0x582f83['order'];
      })
      ['slice'](0x0, _0x198f2f);
  return {
    nodeIdsWithMedia: new Set([..._0x484c83, ..._0x1341a6['map']((_0x946ffa) => _0x946ffa['nodeId'])]),
    explicitMediaSourceOwnerIds: _0xb95fac,
    lowPriority: _0x528950,
    prefetchAhead: ![],
  };
}
function isRequiredCandidate(_0x433bd4) {
  return !!(
    _0x433bd4['fullEligibleVisible'] ||
    _0x433bd4['fullEligibleMotionAhead'] ||
    _0x433bd4['motionFront'] ||
    _0x433bd4['visible'] ||
    _0x433bd4['selected'] ||
    _0x433bd4['retained'] ||
    _0x433bd4['continuationPending'] ||
    _0x433bd4['mounted']
  );
}
function isRequiredImmediateCandidate(_0xe0a62c) {
  return !!(
    _0xe0a62c['fullEligibleVisible'] ||
    _0xe0a62c['fullEligibleMotionAhead'] ||
    _0xe0a62c['motionFront'] ||
    _0xe0a62c['visible'] ||
    _0xe0a62c['selected'] ||
    _0xe0a62c['retained'] ||
    _0xe0a62c['continuationPending']
  );
}
function classifyCandidates(_0x216c59, _0x2d871c) {
  const _0x1e0c57 = [],
    _0x183d73 = [];
  let _0x3524ea = NON_MEDIA_LIMIT,
    _0x3d4e31 = 0x0;
  for (const _0x1ad4b8 of _0x216c59) {
    if (!_0x1ad4b8) continue;
    const _0x2c95a3 = _0x1ad4b8['geometry'],
      _0x7a991 = isGeometryMotionAhead(_0x2c95a3, _0x2d871c),
      _0x4616f5 =
        isGeometryAtMotionFront(_0x2c95a3, _0x2d871c) ||
        (_0x1ad4b8['kind'] === 'video' && isGeometryAtVideoPrefetchEdge(_0x2c95a3, _0x2d871c)),
      _0x2d926d = _0x1ad4b8;
    ((_0x2d926d['fullEligibleMotionAhead'] = _0x1ad4b8['fullEligiblePreview'] && _0x7a991),
      (_0x2d926d['motionAhead'] = _0x7a991),
      (_0x2d926d['motionFront'] = _0x4616f5),
      (_0x2d926d['nearViewport'] = isGeometryNearViewport(_0x2c95a3, _0x2d871c)),
      (_0x2d926d['visible'] = isRendererFastPreviewGeometryVisible(_0x2c95a3, _0x2d871c)),
      (_0x2d926d['order'] = _0x3d4e31),
      (_0x3d4e31 += 0x1));
    if (isRequiredCandidate(_0x2d926d)) _0x1e0c57['push'](_0x2d926d);
    else {
      if (_0x183d73['length'] < BACKGROUND_NODE_LIMIT) {
        if (_0x1ad4b8['kind'] !== 'image' && _0x1ad4b8['kind'] !== 'video') {
          if (_0x3524ea <= 0x0) continue;
          _0x3524ea -= 0x1;
        }
        _0x183d73['push'](_0x2d926d);
      }
    }
  }
  const _0x452371 = Math['max'](0x0, BACKGROUND_NODE_LIMIT - _0x1e0c57['length']);
  return [..._0x1e0c57, ..._0x183d73['slice'](0x0, _0x452371)];
}
export function planRendererFastPreviewAdmission({
  candidateSeeds: candidateSeeds = [],
  existingPreviewNodeIds: existingPreviewNodeIds = null,
  options: options = {},
} = {}) {
  const _0x49db92 = orderCandidates(
      classifyCandidates(
        Array['isArray'](candidateSeeds) ? candidateSeeds : Array['from'](candidateSeeds),
        options,
      ),
      options,
    ),
    _0x369dac = resolveMediaPlan(_0x49db92, options),
    _0x5c6fd7 = (_0x3dacc6) => existingPreviewNodeIds?.['has']?.(_0x3dacc6) === !![],
    _0x2c56d0 = _0x49db92['reduce'](
      (_0x5ac929, _0x52a11c) =>
        !_0x5c6fd7(_0x52a11c['nodeId']) && isRequiredImmediateCandidate(_0x52a11c)
          ? _0x5ac929 + 0x1
          : _0x5ac929,
      0x0,
    );
  let _0x14d735 = Math['max'](
    resolveImmediateCreateLimit(_0x49db92['length']),
    Math['min'](_0x2c56d0, resolveRequiredImmediateCreateLimit(options)),
  );
  const _0x219ef3 = [],
    _0x5b0b73 = [];
  for (const _0x36bccb of _0x49db92) {
    const _0x18b001 = _0x5c6fd7(_0x36bccb['nodeId']);
    if (!_0x18b001 && _0x14d735 <= 0x0) {
      _0x5b0b73['push'](_0x36bccb);
      continue;
    }
    if (!_0x18b001) _0x14d735 -= 0x1;
    _0x219ef3['push'](_0x36bccb);
  }
  const _0x5bf457 = options['deferVisibleMediaSrc'] === !![];
  return {
    candidates: _0x49db92,
    createBatchSize: resolveCreateBatchSize(_0x49db92['length']),
    deferredCandidates: _0x5b0b73,
    immediateCandidates: _0x219ef3,
    immediateMediaSrcLimit: resolveImmediateMediaSrcLimit(_0x369dac, _0x49db92['length'], options),
    immediateVideoMediaSrcLimit: resolveImmediateVideoMediaSrcLimit(_0x49db92['length'], options),
    mediaSrcBatchLimit: _0x5bf457 ? DENSE_INITIAL_IMMEDIATE_SRC_LIMIT : null,
    videoMediaSrcBatchLimit: _0x5bf457 ? DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT : null,
    liveIds: new Set(_0x49db92['map']((_0x50eb3a) => _0x50eb3a['nodeId'])),
    mediaPlan: _0x369dac,
    visibleMediaCandidateCount: _0x49db92['filter'](
      (_0x4a27ed) =>
        (_0x4a27ed['fullEligibleVisible'] || _0x4a27ed['visible']) && hasCandidateMedia(_0x4a27ed),
    )['length'],
  };
}
