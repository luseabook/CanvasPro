const DEFAULT_DURATION_SECONDS = 0x6,
  DEFAULT_FPS = 0x18,
  MIN_DURATION_SECONDS = 0.1,
  MAX_DURATION_SECONDS = 0xe10,
  MIN_FOV = 0xa,
  MAX_FOV = 0x78,
  EASING_VALUES = new Set(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
function finiteNumber(value, item = 0x0) {
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
function normalizeKeyframe(event, source = 0x0) {
  const x = normalizeVector3(event?.['position'], { x: 0x0, y: 1.6, z: 0x6 }),
    next = { x: x['x'], y: x['y'], z: x['z'] - 0x4 };
  return {
    id:
      String(event?.['id'] || 'camera-keyframe-' + (source + 0x1))['trim']() ||
      'camera-keyframe-' + (source + 0x1),
    time: Math['max'](0x0, finiteNumber(event?.['time'], source)),
    position: x,
    target: normalizeVector3(event?.['target'], next),
    fov: clamp(finiteNumber(event?.['fov'], 0x37), MIN_FOV, MAX_FOV),
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
    currentTime: 0x0,
    isPlaying: ![],
    keyframes: [],
  };
}
export function normalizeCameraTimeline(loop = {}) {
  const defaultCameraTimeline = createDefaultCameraTimeline(),
    keyframes = uniqueSortedKeyframes(Array['isArray'](loop?.['keyframes']) ? loop['keyframes'] : []),
    handle = keyframes['at'](-0x1)?.['time'] || 0x0,
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
    fps: clamp(Math['round'](finiteNumber(loop?.['fps'], defaultCameraTimeline['fps'])), 0x1, 0x78),
    loop: loop?.['loop'] === !![],
    currentTime: clamp(finiteNumber(loop?.['currentTime'], 0x0), 0x0, duration),
    isPlaying: loop?.['isPlaying'] === !![],
    keyframes: keyframes['map']((args) => ({
      ...args,
      time: clamp(args['time'], 0x0, duration),
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
  const clamp2 = clamp(Math['round'](finiteNumber(value6, DEFAULT_FPS)), 0x1, 0x78);
  return Math['max'](0x0, finiteNumber(value5, 0x0)) / clamp2;
}
export function cameraTimelineTimeToFrame(value7, value8 = DEFAULT_FPS) {
  const clamp3 = clamp(Math['round'](finiteNumber(value8, DEFAULT_FPS)), 0x1, 0x78);
  return Math['max'](0x0, Math['round'](finiteNumber(value7, 0x0) * clamp3));
}
export function applyCameraTimelineEasing(value9, value10 = 'linear') {
  const clamp4 = clamp(finiteNumber(value9, 0x0), 0x0, 0x1);
  switch (normalizeEasing(value10)) {
    case 'ease-in':
      return clamp4 * clamp4;
    case 'ease-out':
      return 0x1 - (0x1 - clamp4) * (0x1 - clamp4);
    case 'ease-in-out':
      return clamp4 < 0.5 ? 0x2 * clamp4 * clamp4 : 0x1 - Math['pow'](-0x2 * clamp4 + 0x2, 0x2) / 0x2;
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
    progress: 0x0,
  };
}
export function sampleCameraTimeline(value15, value16) {
  const cameraTimeline = normalizeCameraTimeline(value15),
    list2 = cameraTimeline['keyframes'];
  if (list2['length'] === 0x0) return null;
  let time2 = finiteNumber(value16, cameraTimeline['currentTime']);
  cameraTimeline['loop'] && cameraTimeline['duration'] > 0x0
    ? (time2 =
        ((time2 % cameraTimeline['duration']) + cameraTimeline['duration']) % cameraTimeline['duration'])
    : (time2 = clamp(time2, 0x0, cameraTimeline['duration']));
  if (list2['length'] === 0x1 || time2 <= list2[0x0]['time']) return cloneSample(list2[0x0], time2);
  const value17 = list2['at'](-0x1);
  if (time2 >= value17['time']) return cloneSample(value17, time2);
  let fromKeyframeId = list2[0x0],
    toKeyframeId = list2[0x1];
  for (let value18 = 0x1; value18 < list2['length']; value18 += 0x1) {
    toKeyframeId = list2[value18];
    if (time2 <= toKeyframeId['time']) break;
    fromKeyframeId = toKeyframeId;
  }
  const value19 = Math['max'](1e-8, toKeyframeId['time'] - fromKeyframeId['time']),
    clamp5 = clamp((time2 - fromKeyframeId['time']) / value19, 0x0, 0x1),
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
