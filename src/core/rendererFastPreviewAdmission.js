const BACKGROUND_NODE_LIMIT = 520,
  MEDIA_LIMIT = 520,
  LOW_ZOOM_THRESHOLD = 0.45,
  LOW_ZOOM_MEDIA_LIMIT = 128,
  VERY_LOW_ZOOM_THRESHOLD = 0.32,
  VERY_LOW_ZOOM_MEDIA_LIMIT = 96,
  BUSY_LOW_ZOOM_MEDIA_LIMIT = 32,
  REFERENCE_VIEWPORT_AREA = 1440 * 960,
  SCALED_MEDIA_LIMIT_MAX = 240,
  MEDIUM_PREFETCH_MIN = 180,
  MEDIUM_PREFETCH_MAX = 260,
  MEDIUM_PREFETCH_MEDIA_LIMIT = 32,
  NON_MEDIA_LIMIT = 48,
  LOW_PRIORITY_IMMEDIATE_SRC_LIMIT = 24,
  LOW_PRIORITY_LARGE_IMMEDIATE_SRC_LIMIT = 12,
  NORMAL_IMMEDIATE_SRC_LIMIT = 32,
  NODE_CREATE_IMMEDIATE_LIMIT = 8,
  REQUIRED_NODE_CREATE_IMMEDIATE_LIMIT = 16,
  POOLED_NODE_CREATE_IMMEDIATE_LIMIT = 32,
  NODE_CREATE_BATCH_SIZE = 8,
  LARGE_CANDIDATE_COUNT = 180,
  HUGE_CANDIDATE_COUNT = 360,
  LARGE_NODE_CREATE_IMMEDIATE_LIMIT = 8,
  HUGE_NODE_CREATE_IMMEDIATE_LIMIT = 8,
  LARGE_NODE_CREATE_BATCH_SIZE = 8,
  HUGE_NODE_CREATE_BATCH_SIZE = 8,
  BUSY_IMMEDIATE_SRC_LIMIT = 16,
  BUSY_MOTION_AHEAD_MEDIA_LIMIT = 6,
  VIDEO_IMMEDIATE_SRC_LIMIT = 16,
  LARGE_VIDEO_IMMEDIATE_SRC_LIMIT = 10,
  HUGE_VIDEO_IMMEDIATE_SRC_LIMIT = 8,
  BUSY_VIDEO_IMMEDIATE_SRC_LIMIT = 2,
  DENSE_INITIAL_IMMEDIATE_SRC_LIMIT = 2,
  DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT = 1,
  MOTION_LOOKAHEAD_FACTOR = 1.5,
  MOTION_AHEAD_PADDING = 320,
  VIDEO_EDGE_PREFETCH_PADDING = 240,
  LOW_ZOOM_EDGE_PREFETCH_MIN_ZOOM = 0.38,
  LOW_ZOOM_EDGE_PREFETCH_PADDING = 720;
function normalizeViewport(box = {}) {
  const count = Number(box?.['zoom']);
  return {
    x: Number['isFinite'](Number(box?.['x'])) ? Number(box['x']) : 0,
    y: Number['isFinite'](Number(box?.['y'])) ? Number(box['y']) : 0,
    zoom: Number['isFinite'](count) && count > 0 ? count : 1,
  };
}
function resolveRequiredImmediateCreateLimit(options2 = {}) {
  const value = Math['trunc'](Number(options2['requiredImmediateCreateLimit']));
  if (!Number['isFinite'](value)) return NODE_CREATE_IMMEDIATE_LIMIT;
  const item = Math['max'](
      NODE_CREATE_IMMEDIATE_LIMIT,
      Math['min'](value, REQUIRED_NODE_CREATE_IMMEDIATE_LIMIT),
    ),
    key = Math['max'](0, Math['trunc'](Number(options2['availablePreviewNodePoolSize']) || 0));
  return Math['min'](POOLED_NODE_CREATE_IMMEDIATE_LIMIT, item + key);
}
function getViewportContainerSize(options3 = {}) {
  return {
    width: Math['max'](
      1,
      Number(options3['containerWidth'] ?? options3['containerW']) ||
        (typeof window !== 'undefined' ? Number(window['innerWidth']) : 0) ||
        1600,
    ),
    height: Math['max'](
      1,
      Number(options3['containerHeight'] ?? options3['containerH']) ||
        (typeof window !== 'undefined' ? Number(window['innerHeight']) : 0) ||
        900,
    ),
  };
}
function getViewportWorldRect(options4 = {}) {
  const box2 = normalizeViewport(options4['viewport']),
    { width: width, height: height } = getViewportContainerSize(options4);
  return {
    left: (0 - box2['x']) / box2['zoom'],
    top: (0 - box2['y']) / box2['zoom'],
    right: (width - box2['x']) / box2['zoom'],
    bottom: (height - box2['y']) / box2['zoom'],
  };
}
function getViewportWorldCenter(options5 = {}) {
  const box3 = normalizeViewport(options5['viewport']),
    { width: width2, height: height2 } = getViewportContainerSize(options5);
  return {
    x: ((0 - box3['x']) / box3['zoom'] + (width2 - box3['x']) / box3['zoom']) / 2,
    y: ((0 - box3['y']) / box3['zoom'] + (height2 - box3['y']) / box3['zoom']) / 2,
  };
}
function getPreviewDistanceSq(box4, box5) {
  if (!box4 || !box5) return 0;
  const index = box4['x'] + box4['width'] / 2 - box5['x'],
    result = box4['y'] + box4['height'] / 2 - box5['y'];
  return index * index + result * result;
}
function getMotionAdjustedPreviewDistanceSq(enabled, data, target = {}) {
  const x = data || target?.['previewMotion']?.['center'];
  if (!enabled || !x) return getPreviewDistanceSq(enabled, x);
  const enabled2 = target?.['previewMotion'];
  if (!enabled2?.['active']) return getPreviewDistanceSq(enabled, x);
  const source = {
    x: x['x'] + enabled2['dx'] * MOTION_LOOKAHEAD_FACTOR,
    y: x['y'] + enabled2['dy'] * MOTION_LOOKAHEAD_FACTOR,
  };
  return getPreviewDistanceSq(enabled, source);
}
function getPreviewViewportDistanceSq(box6, next = {}) {
  if (!box6) return 0;
  const box7 = getViewportWorldRect(next),
    current = Number(box6['x']) || 0,
    entry = Number(box6['y']) || 0,
    record = current + Math['max'](1, Number(box6['width']) || 0),
    payload = entry + Math['max'](1, Number(box6['height']) || 0),
    handle =
      record < box7['left'] ? box7['left'] - record : current > box7['right'] ? current - box7['right'] : 0,
    state =
      payload < box7['top'] ? box7['top'] - payload : entry > box7['bottom'] ? entry - box7['bottom'] : 0;
  return handle * handle + state * state;
}
function getMotionAheadViewportOptions(args = {}) {
  const enabled3 = args?.['previewMotion'];
  if (!enabled3?.['active']) return null;
  const x2 = normalizeViewport(args['viewport']);
  return {
    ...args,
    viewport: {
      ...x2,
      x: x2['x'] - enabled3['dx'] * x2['zoom'] * MOTION_LOOKAHEAD_FACTOR,
      y: x2['y'] - enabled3['dy'] * x2['zoom'] * MOTION_LOOKAHEAD_FACTOR,
    },
  };
}
function getPreviewMediaPriorityDistanceSq(config, scope, input = {}) {
  if (isRendererFastPreviewGeometryVisible(config, input))
    return getMotionAdjustedPreviewDistanceSq(config, scope || getViewportWorldCenter(input), input);
  const output = Number(input?.['viewport']?.['zoom']),
    enabled4 =
      input?.['viewportBusy'] === true || (Number['isFinite'](output) && output <= LOW_ZOOM_THRESHOLD);
  if (!enabled4) return getMotionAdjustedPreviewDistanceSq(config, scope, input);
  const motionAheadViewportOptions = getMotionAheadViewportOptions(input);
  return getPreviewViewportDistanceSq(config, motionAheadViewportOptions || input);
}
export function isRendererFastPreviewGeometryVisible(box8, value2 = {}, value3 = 0) {
  if (!box8) return false;
  const box9 = normalizeViewport(value2['viewport']),
    { width: width3, height: height3 } = getViewportContainerSize(value2),
    value4 = box8['x'] * box9['zoom'] + box9['x'],
    value5 = box8['y'] * box9['zoom'] + box9['y'],
    value6 = box8['width'] * box9['zoom'],
    value7 = box8['height'] * box9['zoom'],
    value8 = Math['max'](0, Number(value3) || 0);
  return (
    value4 + value6 > -value8 &&
    value4 < width3 + value8 &&
    value5 + value7 > -value8 &&
    value5 < height3 + value8
  );
}
function isGeometryMotionAhead(value9, value10 = {}) {
  const motionAheadViewportOptions2 = getMotionAheadViewportOptions(value10);
  return !!(
    motionAheadViewportOptions2 &&
    isRendererFastPreviewGeometryVisible(value9, motionAheadViewportOptions2, MOTION_AHEAD_PADDING)
  );
}
function isGeometryInMotionDirection(box10, value11 = {}) {
  const enabled5 = value11?.['previewMotion'];
  if (!box10 || !enabled5?.['active']) return false;
  const box11 = getViewportWorldRect(value11),
    value12 = (Number(box10['x']) || 0) + Math['max'](1, Number(box10['width']) || 0) / 2,
    value13 = (Number(box10['y']) || 0) + Math['max'](1, Number(box10['height']) || 0) / 2;
  if (Math['abs'](enabled5['dx']) >= Math['abs'](enabled5['dy']))
    return enabled5['dx'] >= 0 ? value12 > box11['right'] : value12 < box11['left'];
  return enabled5['dy'] >= 0 ? value13 > box11['bottom'] : value13 < box11['top'];
}
function isGeometryAtMotionFront(value14, value15 = {}) {
  return (
    isGeometryInMotionDirection(value14, value15) &&
    isRendererFastPreviewGeometryVisible(value14, value15, MOTION_AHEAD_PADDING)
  );
}
export function selectRendererMotionAheadMediaIds(list, value16 = {}) {
  return new Set(
    list['filter'](
      (value17) =>
        !isRendererFastPreviewGeometryVisible(value17['geometry'], value16) &&
        isRendererFastPreviewMediaReadable(value17['geometry'], value16) &&
        isGeometryAtMotionFront(value17['geometry'], value16),
    )
      ['sort'](
        (value18, value19) =>
          getPreviewViewportDistanceSq(value18['geometry'], value16) -
          getPreviewViewportDistanceSq(value19['geometry'], value16),
      )
      ['slice'](0, BUSY_MOTION_AHEAD_MEDIA_LIMIT)
      ['map']((value20) => value20['nodeId']),
  );
}
export function isRendererFastPreviewMediaReadable(box12, value21 = {}) {
  return (
    Math['max'](Number(box12?.['width']) || 0, Number(box12?.['height']) || 0) *
      normalizeViewport(value21['viewport'])['zoom'] >=
    64
  );
}
function isGeometryAtVideoPrefetchEdge(value22, value23 = {}) {
  if (value23?.['viewportBusy'] === true) return false;
  return isRendererFastPreviewGeometryVisible(value22, value23, VIDEO_EDGE_PREFETCH_PADDING);
}
function isGeometryNearViewport(value24, value25 = {}) {
  const value26 = Number(value25?.['viewport']?.['zoom']);
  if (
    !Number['isFinite'](value26) ||
    value26 < LOW_ZOOM_EDGE_PREFETCH_MIN_ZOOM ||
    value26 > LOW_ZOOM_THRESHOLD
  )
    return false;
  return isRendererFastPreviewGeometryVisible(value24, value25, LOW_ZOOM_EDGE_PREFETCH_PADDING);
}
function resolveImmediateCreateLimit(value27) {
  if (value27 >= HUGE_CANDIDATE_COUNT) return HUGE_NODE_CREATE_IMMEDIATE_LIMIT;
  if (value27 >= LARGE_CANDIDATE_COUNT) return LARGE_NODE_CREATE_IMMEDIATE_LIMIT;
  return NODE_CREATE_IMMEDIATE_LIMIT;
}
function resolveCreateBatchSize(value28) {
  if (value28 >= HUGE_CANDIDATE_COUNT) return HUGE_NODE_CREATE_BATCH_SIZE;
  if (value28 >= LARGE_CANDIDATE_COUNT) return LARGE_NODE_CREATE_BATCH_SIZE;
  return NODE_CREATE_BATCH_SIZE;
}
function getCandidateUserRank(options6 = {}) {
  if (options6['selected'] || options6['retained'] || options6['continuationPending']) return 0;
  if (options6['visible'] || options6['motionFront'] || options6['motionAhead']) return 1;
  if (options6['mounted']) return 2;
  return 3;
}
function hasCandidateMedia(options7 = {}) {
  return (
    options7['hasMediaHint'] === true ||
    (Array['isArray'](options7['sources']) && options7['sources']['length'] > 0)
  );
}
export function resolveRendererFastPreviewMediaQueuePriority(options8 = {}, value29 = {}) {
  const value30 = value29?.['previewMotion']?.['center'] || getViewportWorldCenter(value29);
  return {
    userRank: getCandidateUserRank(options8),
    distanceSq: getPreviewMediaPriorityDistanceSq(options8['geometry'], value30, value29),
    order: Number(options8['order'] || 0),
  };
}
function shouldPrioritizeMediaOrder(list2, value31 = {}) {
  if (!Array['isArray'](list2) || list2['length'] === 0) return false;
  const count2 = list2['filter']((value32) => hasCandidateMedia(value32))['length'];
  if (count2 === 0) return false;
  const value33 = Number(value31?.['viewport']?.['zoom']),
    value34 = list2['some']((value35) => value35['visible'] && hasCandidateMedia(value35)),
    value36 = list2['some']((enabled6) => !enabled6['visible'] && hasCandidateMedia(enabled6));
  if (count2 > NORMAL_IMMEDIATE_SRC_LIMIT && value34 && value36) return true;
  return value31['viewportBusy'] === true || (Number['isFinite'](value33) && value33 <= LOW_ZOOM_THRESHOLD);
}
function buildCandidatePriority(candidate, value37, value38) {
  return {
    candidate: candidate,
    userRank: getCandidateUserRank(candidate),
    mediaRank: hasCandidateMedia(candidate) ? 0 : 1,
    distanceSq: getPreviewMediaPriorityDistanceSq(candidate['geometry'], value37, value38),
    order: candidate['order'],
  };
}
function compareCandidatePriorities(value39, value40) {
  if (value39['userRank'] !== value40['userRank']) return value39['userRank'] - value40['userRank'];
  if (value39['mediaRank'] !== value40['mediaRank']) return value39['mediaRank'] - value40['mediaRank'];
  if (value39['distanceSq'] !== value40['distanceSq']) return value39['distanceSq'] - value40['distanceSq'];
  return value39['order'] - value40['order'];
}
function orderCandidates(list3, value41 = {}) {
  const enabled7 = list3['length'] > resolveImmediateCreateLimit(list3['length']),
    shouldPrioritizeMediaOrder2 = shouldPrioritizeMediaOrder(list3, value41);
  if (!enabled7 && !shouldPrioritizeMediaOrder2) return list3;
  const value42 = value41?.['previewMotion']?.['center'] || getViewportWorldCenter(value41);
  return list3['map']((value43) => buildCandidatePriority(value43, value42, value41))
    ['sort'](compareCandidatePriorities)
    ['map'](({ candidate: candidate2 }) => candidate2);
}
function resolveImmediateMediaSrcLimit(value44, value45, value46 = {}) {
  if (value46['deferVisibleMediaSrc'] === true) return DENSE_INITIAL_IMMEDIATE_SRC_LIMIT;
  if (value46['viewportBusy'] === true) return BUSY_IMMEDIATE_SRC_LIMIT;
  if (value44?.['lowPriority']) {
    if (value45 >= LARGE_CANDIDATE_COUNT) return LOW_PRIORITY_LARGE_IMMEDIATE_SRC_LIMIT;
    return LOW_PRIORITY_IMMEDIATE_SRC_LIMIT;
  }
  return NORMAL_IMMEDIATE_SRC_LIMIT;
}
function resolveImmediateVideoMediaSrcLimit(value47, value48 = {}) {
  if (value48['deferVisibleMediaSrc'] === true) return DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (value48['viewportBusy'] === true) return BUSY_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (value47 >= HUGE_CANDIDATE_COUNT) return HUGE_VIDEO_IMMEDIATE_SRC_LIMIT;
  if (value47 >= LARGE_CANDIDATE_COUNT) return LARGE_VIDEO_IMMEDIATE_SRC_LIMIT;
  return VIDEO_IMMEDIATE_SRC_LIMIT;
}
function resolveMediaLimit({
  candidateCount: candidateCount,
  isLowZoom: isLowZoom,
  isVeryLowZoom: isVeryLowZoom,
  options: options9,
  suppressNewMedia: suppressNewMedia,
}) {
  if (suppressNewMedia) return 0;
  if (!isLowZoom) return MEDIA_LIMIT;
  if (options9?.['viewportBusy'] === true) return BUSY_LOW_ZOOM_MEDIA_LIMIT;
  const value49 = isVeryLowZoom ? VERY_LOW_ZOOM_MEDIA_LIMIT : LOW_ZOOM_MEDIA_LIMIT,
    value50 = Number(candidateCount) || 0,
    value51 = Math['max'](1, Number(options9['containerWidth'] ?? options9['containerW']) || 0),
    value52 = Math['max'](1, Number(options9['containerHeight'] ?? options9['containerH']) || 0),
    count3 = value51 * value52,
    value53 =
      Number['isFinite'](count3) && count3 > 1 ? Math['max'](1, count3 / REFERENCE_VIEWPORT_AREA) : 1;
  if (!isVeryLowZoom && value50 >= MEDIUM_PREFETCH_MIN && value50 <= MEDIUM_PREFETCH_MAX)
    return Math['min'](SCALED_MEDIA_LIMIT_MAX, Math['ceil'](MEDIUM_PREFETCH_MEDIA_LIMIT * value53), value50);
  if (!Number['isFinite'](count3) || count3 <= 1) return value49;
  return Math['min'](SCALED_MEDIA_LIMIT_MAX, Math['max'](value49, Math['ceil'](value49 * value53)));
}
function resolveMediaPlan(candidateCount2, options10 = {}) {
  const value54 = Number(options10?.['viewport']?.['zoom']),
    isLowZoom2 = Number['isFinite'](value54) && value54 <= LOW_ZOOM_THRESHOLD,
    isVeryLowZoom2 = Number['isFinite'](value54) && value54 <= VERY_LOW_ZOOM_THRESHOLD,
    explicitMediaSourceOwnerIds =
      options10?.['mediaSourceOwnerIds'] != null &&
      typeof options10['mediaSourceOwnerIds']?.[Symbol['iterator']] === 'function'
        ? new Set(
            Array['from'](options10['mediaSourceOwnerIds'], (value55) => String(value55 || ''))['filter'](
              Boolean,
            ),
          )
        : null,
    suppressNewMedia2 = options10?.['suppressNewMedia'] === true,
    mediaLimit = resolveMediaLimit({
      candidateCount: candidateCount2['length'],
      isLowZoom: isLowZoom2,
      isVeryLowZoom: isVeryLowZoom2,
      options: options10,
      suppressNewMedia: suppressNewMedia2,
    }),
    list4 = candidateCount2['filter'](
      (value56) =>
        hasCandidateMedia(value56) &&
        (explicitMediaSourceOwnerIds === null ||
          explicitMediaSourceOwnerIds['has'](value56['nodeId']) ||
          value56['fullEligibleVisible'] ||
          value56['visible'] ||
          value56['motionFront']),
    );
  if (!suppressNewMedia2 && list4['length'] <= mediaLimit)
    return {
      nodeIdsWithMedia: new Set(list4['map']((value57) => value57['nodeId'])),
      explicitMediaSourceOwnerIds: explicitMediaSourceOwnerIds,
      lowPriority: isLowZoom2,
      prefetchAhead: false,
    };
  const value58 = options10?.['previewMotion']?.['center'],
    map = new Set(
      list4['filter'](
        (value59) =>
          value59['fullEligibleVisible'] ||
          value59['fullEligibleMotionAhead'] ||
          value59['visible'] ||
          (value59['kind'] === 'video' && value59['motionFront']) ||
          value59['selected'] ||
          value59['retained'] ||
          value59['mounted'],
      )['map']((value60) => value60['nodeId']),
    );
  isLowZoom2 &&
    options10?.['viewportBusy'] === true &&
    list4['filter'](
      (enabled8) => !map['has'](enabled8['nodeId']) && !enabled8['visible'] && enabled8['motionFront'],
    )
      ['map']((args2) => ({
        ...args2,
        distanceSq: getPreviewViewportDistanceSq(args2['geometry'], options10),
      }))
      ['sort']((value61, value62) => {
        if (value61['distanceSq'] !== value62['distanceSq'])
          return value61['distanceSq'] - value62['distanceSq'];
        return value61['order'] - value62['order'];
      })
      ['slice'](0, BUSY_MOTION_AHEAD_MEDIA_LIMIT)
      ['forEach']((value63) => map['add'](value63['nodeId']));
  const value64 = isLowZoom2 && options10?.['viewportBusy'] === true && map['size'] > 0,
    value65 = value64 ? 0 : Math['max'](0, mediaLimit - map['size']),
    list5 = list4['filter']((value66) => !map['has'](value66['nodeId']))
      ['map']((priorityRank) => ({
        ...priorityRank,
        priorityRank: priorityRank['mounted'] ? 0 : 1,
        distanceSq: getPreviewMediaPriorityDistanceSq(priorityRank['geometry'], value58, options10),
      }))
      ['sort']((value67, value68) => {
        if (value67['priorityRank'] !== value68['priorityRank'])
          return value67['priorityRank'] - value68['priorityRank'];
        if (value67['distanceSq'] !== value68['distanceSq'])
          return value67['distanceSq'] - value68['distanceSq'];
        return value67['order'] - value68['order'];
      })
      ['slice'](0, value65);
  return {
    nodeIdsWithMedia: new Set([...map, ...list5['map']((value69) => value69['nodeId'])]),
    explicitMediaSourceOwnerIds: explicitMediaSourceOwnerIds,
    lowPriority: isLowZoom2,
    prefetchAhead: false,
  };
}
function isRequiredCandidate(value70) {
  return !!(
    value70['fullEligibleVisible'] ||
    value70['fullEligibleMotionAhead'] ||
    value70['motionFront'] ||
    value70['visible'] ||
    value70['selected'] ||
    value70['retained'] ||
    value70['continuationPending'] ||
    value70['mounted']
  );
}
function isRequiredImmediateCandidate(value71) {
  return !!(
    value71['fullEligibleVisible'] ||
    value71['fullEligibleMotionAhead'] ||
    value71['motionFront'] ||
    value71['visible'] ||
    value71['selected'] ||
    value71['retained'] ||
    value71['continuationPending']
  );
}
function classifyCandidates(value72, value73) {
  const list6 = [],
    list7 = [];
  let count4 = NON_MEDIA_LIMIT,
    value74 = 0;
  for (const enabled9 of value72) {
    if (!enabled9) continue;
    const value75 = enabled9['geometry'],
      isGeometryMotionAhead2 = isGeometryMotionAhead(value75, value73),
      isGeometryAtMotionFront2 =
        isGeometryAtMotionFront(value75, value73) ||
        (enabled9['kind'] === 'video' && isGeometryAtVideoPrefetchEdge(value75, value73)),
      value76 = enabled9;
    ((value76['fullEligibleMotionAhead'] = enabled9['fullEligiblePreview'] && isGeometryMotionAhead2),
      (value76['motionAhead'] = isGeometryMotionAhead2),
      (value76['motionFront'] = isGeometryAtMotionFront2),
      (value76['nearViewport'] = isGeometryNearViewport(value75, value73)),
      (value76['visible'] = isRendererFastPreviewGeometryVisible(value75, value73)),
      (value76['order'] = value74),
      (value74 += 1));
    if (isRequiredCandidate(value76)) list6['push'](value76);
    else {
      if (list7['length'] < BACKGROUND_NODE_LIMIT) {
        if (enabled9['kind'] !== 'image' && enabled9['kind'] !== 'video') {
          if (count4 <= 0) continue;
          count4 -= 1;
        }
        list7['push'](value76);
      }
    }
  }
  const value77 = Math['max'](0, BACKGROUND_NODE_LIMIT - list6['length']);
  return [...list6, ...list7['slice'](0, value77)];
}
export function planRendererFastPreviewAdmission({
  candidateSeeds: candidateSeeds = [],
  existingPreviewNodeIds: existingPreviewNodeIds = null,
  options: options = {},
} = {}) {
  const candidates = orderCandidates(
      classifyCandidates(
        Array['isArray'](candidateSeeds) ? candidateSeeds : Array['from'](candidateSeeds),
        options,
      ),
      options,
    ),
    mediaPlan = resolveMediaPlan(candidates, options),
    handler = (value78) => existingPreviewNodeIds?.['has']?.(value78) === true,
    value79 = candidates['reduce'](
      (value80, value81) =>
        !handler(value81['nodeId']) && isRequiredImmediateCandidate(value81) ? value80 + 1 : value80,
      0,
    );
  let count5 = Math['max'](
    resolveImmediateCreateLimit(candidates['length']),
    Math['min'](value79, resolveRequiredImmediateCreateLimit(options)),
  );
  const immediateCandidates = [],
    deferredCandidates = [];
  for (const value82 of candidates) {
    const enabled10 = handler(value82['nodeId']);
    if (!enabled10 && count5 <= 0) {
      deferredCandidates['push'](value82);
      continue;
    }
    if (!enabled10) count5 -= 1;
    immediateCandidates['push'](value82);
  }
  const mediaSrcBatchLimit = options['deferVisibleMediaSrc'] === true;
  return {
    candidates: candidates,
    createBatchSize: resolveCreateBatchSize(candidates['length']),
    deferredCandidates: deferredCandidates,
    immediateCandidates: immediateCandidates,
    immediateMediaSrcLimit: resolveImmediateMediaSrcLimit(mediaPlan, candidates['length'], options),
    immediateVideoMediaSrcLimit: resolveImmediateVideoMediaSrcLimit(candidates['length'], options),
    mediaSrcBatchLimit: mediaSrcBatchLimit ? DENSE_INITIAL_IMMEDIATE_SRC_LIMIT : null,
    videoMediaSrcBatchLimit: mediaSrcBatchLimit ? DENSE_INITIAL_VIDEO_IMMEDIATE_SRC_LIMIT : null,
    liveIds: new Set(candidates['map']((value83) => value83['nodeId'])),
    mediaPlan: mediaPlan,
    visibleMediaCandidateCount: candidates['filter'](
      (value84) => (value84['fullEligibleVisible'] || value84['visible']) && hasCandidateMedia(value84),
    )['length'],
  };
}
