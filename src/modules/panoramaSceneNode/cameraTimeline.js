const DEFAULT_DURATION_SECONDS = 6,
  DEFAULT_FPS = 24,
  MIN_DURATION_SECONDS = 0.1,
  MAX_DURATION_SECONDS = 3600,
  MIN_FOV = 10,
  MAX_FOV = 120,
  EASING_VALUES = new Set(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['max'](result, Math['min'](data, index));
}
function normalizeVector3(box, box2) {
  return {
    x: finiteNumber(box?.['x'], box2['x']),
    y: finiteNumber(box?.['y'], box2['y']),
    z: finiteNumber(box?.['z'], box2['z']),
  };
}
function normalizeEasing(options) {
  const target = String(options || 'linear')
    ['trim']()
    ['toLowerCase']();
  return EASING_VALUES['has'](target) ? target : 'linear';
}
function normalizeKeyframe(event, source = 0) {
  const x = normalizeVector3(event?.['position'], { x: 0, y: 1.6, z: 6 }),
    next = { x: x['x'], y: x['y'], z: x['z'] - 4 };
  return {
    id:
      String(event?.['id'] || 'camera-keyframe-' + (source + 1))['trim']() ||
      'camera-keyframe-' + (source + 1),
    time: Math['max'](0, finiteNumber(event?.['time'], source)),
    position: x,
    target: normalizeVector3(event?.['target'], next),
    fov: clamp(finiteNumber(event?.['fov'], 55), MIN_FOV, MAX_FOV),
    easing: normalizeEasing(event?.['easing']),
  };
}
function uniqueSortedKeyframes(list = []) {
  const map = new Map();
  return (
    list['forEach']((current, entry) => {
      const keyframe = normalizeKeyframe(current, entry);
      map['set'](keyframe['id'], keyframe);
    }),
    [...map['values']()]['sort']((record, payload) => {
      if (record['time'] !== payload['time']) return record['time'] - payload['time'];
      return record['id']['localeCompare'](payload['id']);
    })
  );
}
export function createDefaultCameraTimeline() {
  return {
    duration: DEFAULT_DURATION_SECONDS,
    fps: DEFAULT_FPS,
    loop: ![],
    currentTime: 0,
    isPlaying: ![],
    keyframes: [],
  };
}
export function normalizeCameraTimeline(loop = {}) {
  const defaultCameraTimeline = createDefaultCameraTimeline(),
    keyframes = uniqueSortedKeyframes(Array['isArray'](loop?.['keyframes']) ? loop['keyframes'] : []),
    handle = keyframes['at'](-1)?.['time'] || 0,
    duration = clamp(
      Math['max'](
        MIN_DURATION_SECONDS,
        finiteNumber(loop?.['duration'], defaultCameraTimeline['duration']),
        handle,
      ),
      MIN_DURATION_SECONDS,
      MAX_DURATION_SECONDS,
    );
  return {
    duration: duration,
    fps: clamp(Math['round'](finiteNumber(loop?.['fps'], defaultCameraTimeline['fps'])), 1, 120),
    loop: loop?.['loop'] === !![],
    currentTime: clamp(finiteNumber(loop?.['currentTime'], 0), 0, duration),
    isPlaying: loop?.['isPlaying'] === !![],
    keyframes: keyframes['map']((args) => ({
      ...args,
      time: clamp(args['time'], 0, duration),
    })),
  };
}
export function upsertCameraKeyframe(state, config) {
  const args2 = normalizeCameraTimeline(state),
    currentTime = normalizeKeyframe(config, args2['keyframes']['length']),
    keyframes2 = args2['keyframes']['filter']((scope) => scope['id'] !== currentTime['id']);
  return (
    keyframes2['push'](currentTime),
    normalizeCameraTimeline({
      ...args2,
      duration: Math['max'](args2['duration'], currentTime['time']),
      currentTime: currentTime['time'],
      keyframes: keyframes2,
    })
  );
}
export function removeCameraKeyframe(input, output) {
  const keyframes3 = normalizeCameraTimeline(input),
    value2 = String(output || '')['trim']();
  return normalizeCameraTimeline({
    ...keyframes3,
    keyframes: keyframes3['keyframes']['filter']((value3) => value3['id'] !== value2),
  });
}
export function updateCameraTimelineSettings(value4, args3 = {}) {
  const keyframes4 = normalizeCameraTimeline(value4);
  return normalizeCameraTimeline({ ...keyframes4, ...args3, keyframes: keyframes4['keyframes'] });
}
export function cameraTimelineFrameToTime(value5, value6 = DEFAULT_FPS) {
  const clamp2 = clamp(Math['round'](finiteNumber(value6, DEFAULT_FPS)), 1, 120);
  return Math['max'](0, finiteNumber(value5, 0)) / clamp2;
}
export function cameraTimelineTimeToFrame(value7, value8 = DEFAULT_FPS) {
  const clamp3 = clamp(Math['round'](finiteNumber(value8, DEFAULT_FPS)), 1, 120);
  return Math['max'](0, Math['round'](finiteNumber(value7, 0) * clamp3));
}
export function applyCameraTimelineEasing(value9, value10 = 'linear') {
  const clamp4 = clamp(finiteNumber(value9, 0), 0, 1);
  switch (normalizeEasing(value10)) {
    case 'ease-in':
      return clamp4 * clamp4;
    case 'ease-out':
      return 1 - (1 - clamp4) * (1 - clamp4);
    case 'ease-in-out':
      return clamp4 < 0.5 ? 2 * clamp4 * clamp4 : 1 - Math['pow'](-2 * clamp4 + 2, 2) / 2;
    default:
      return clamp4;
  }
}
function interpolateNumber(value11, value12, value13) {
  return value11 + (value12 - value11) * value13;
}
function interpolateVector3(box3, box4, value14) {
  return {
    x: interpolateNumber(box3['x'], box4['x'], value14),
    y: interpolateNumber(box3['y'], box4['y'], value14),
    z: interpolateNumber(box3['z'], box4['z'], value14),
  };
}
function cloneSample(fov, time) {
  return {
    time: time,
    position: { ...fov['position'] },
    target: { ...fov['target'] },
    fov: fov['fov'],
    fromKeyframeId: fov['id'],
    toKeyframeId: fov['id'],
    progress: 0,
  };
}
export function sampleCameraTimeline(value15, value16) {
  const cameraTimeline = normalizeCameraTimeline(value15),
    list2 = cameraTimeline['keyframes'];
  if (list2['length'] === 0) return null;
  let time2 = finiteNumber(value16, cameraTimeline['currentTime']);
  cameraTimeline['loop'] && cameraTimeline['duration'] > 0
    ? (time2 =
        ((time2 % cameraTimeline['duration']) + cameraTimeline['duration']) % cameraTimeline['duration'])
    : (time2 = clamp(time2, 0, cameraTimeline['duration']));
  if (list2['length'] === 1 || time2 <= list2[0]['time']) return cloneSample(list2[0], time2);
  const value17 = list2['at'](-1);
  if (time2 >= value17['time']) return cloneSample(value17, time2);
  let fromKeyframeId = list2[0],
    toKeyframeId = list2[1];
  for (let value18 = 1; value18 < list2['length']; value18 += 1) {
    toKeyframeId = list2[value18];
    if (time2 <= toKeyframeId['time']) break;
    fromKeyframeId = toKeyframeId;
  }
  const value19 = Math['max'](1e-8, toKeyframeId['time'] - fromKeyframeId['time']),
    clamp5 = clamp((time2 - fromKeyframeId['time']) / value19, 0, 1),
    progress = applyCameraTimelineEasing(clamp5, fromKeyframeId['easing']);
  return {
    time: time2,
    position: interpolateVector3(fromKeyframeId['position'], toKeyframeId['position'], progress),
    target: interpolateVector3(fromKeyframeId['target'], toKeyframeId['target'], progress),
    fov: interpolateNumber(fromKeyframeId['fov'], toKeyframeId['fov'], progress),
    fromKeyframeId: fromKeyframeId['id'],
    toKeyframeId: toKeyframeId['id'],
    progress: progress,
  };
}
export const CAMERA_TIMELINE_EASINGS = Object['freeze']([...EASING_VALUES]);
