function finite(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['max'](result, Math['min'](data, index));
}
function vector2(options, target) {
  return [finite(options?.[0], target[0]), finite(options?.[1], target[1])];
}
function normalizeGroundRegion(list, source, next) {
  const current = [
    [0, clamp(source - next * 0.5, 0, 1)],
    [1, clamp(source + next * 0.5, 0, 1)],
    [1, 1],
    [0, 1],
  ];
  if (!Array['isArray'](list) || list['length'] < 3) return current;
  return list['slice'](0, 24)['map']((entry) => {
    const vector22 = vector2(entry, [0, 0]);
    return [clamp(vector22[0], 0, 1), clamp(vector22[1], 0, 1)];
  });
}
function aspectFromImage(record, payload = 16 / 9) {
  const count = Math['max'](0, finite(record?.['imageWidth'], 0)),
    count2 = Math['max'](0, finite(record?.['imageHeight'], 0));
  return count > 0 && count2 > 0 ? count / count2 : payload;
}
export function computeStoryboard3DVerticalFov(handle, state = 16 / 9) {
  const config = (clamp(finite(handle, 60), 10, 0xaa) * Math['PI']) / 180;
  return (
    (2 * Math['atan'](Math['tan'](config / 2) / Math['max'](0.1, finite(state, 16 / 9))) * 180) /
    Math['PI']
  );
}
export function computeStoryboard3DFocalLengthFromHorizontalFov(scope) {
  const input = (clamp(finite(scope, 60), 10, 0xaa) * Math['PI']) / 180;
  return 36 / (2 * Math['tan'](input / 2));
}
export function normalizeStoryboard3DBackgroundCalibration(verticalFov = {}) {
  const vector23 = vector2(verticalFov['imageOffset'], [0, 0]),
    vector24 = vector2(verticalFov['vanishingPoint'], [0.5, 0.5]),
    binaryAssetId = String(verticalFov['binaryAssetId'] || '')['trim'](),
    horizonY = clamp(finite(verticalFov['horizonY'], 0.5), 0, 1),
    horizonSlope = clamp(finite(verticalFov['horizonSlope'], 0), -1, 1),
    imageWidth = Math['max'](0, Math['round'](finite(verticalFov['imageWidth'], 0))),
    imageHeight = Math['max'](0, Math['round'](finite(verticalFov['imageHeight'], 0))),
    calibrationMethod = String(verticalFov['calibrationMethod'] || 'manual')['trim']() || 'manual';
  return {
    imageUrl: String(verticalFov['imageUrl'] || '')['trim'](),
    ...(binaryAssetId ? { binaryAssetId: binaryAssetId } : {}),
    horizontalFov: clamp(finite(verticalFov['horizontalFov'], 60), 10, 0xaa),
    verticalFov:
      verticalFov['verticalFov'] == null ? null : clamp(finite(verticalFov['verticalFov'], 40), 10, 0xaa),
    horizonY: horizonY,
    horizonSlope: horizonSlope,
    vanishingPoint: [clamp(vector24[0], 0, 1), clamp(vector24[1], 0, 1)],
    cameraHeight: clamp(finite(verticalFov['cameraHeight'], 1.6), 0.2, 20),
    imageWidth: imageWidth,
    imageHeight: imageHeight,
    groundRegion: normalizeGroundRegion(verticalFov['groundRegion'], horizonY, horizonSlope),
    calibrationMethod: calibrationMethod,
    calibrationConfidence: clamp(
      finite(verticalFov['calibrationConfidence'], calibrationMethod === 'manual' ? 1 : 0),
      0,
      1,
    ),
    imageScale: clamp(finite(verticalFov['imageScale'], 1), 0.1, 10),
    imageOffset: [clamp(vector23[0], -2, 2), clamp(vector23[1], -2, 2)],
    lockedCamera: verticalFov['lockedCamera'] === true,
    lockedCameraSnapshot: verticalFov['lockedCameraSnapshot']
      ? normalizeStoryboard3DBackgroundCamera(verticalFov['lockedCameraSnapshot'])
      : null,
  };
}
export function normalizeStoryboard3DBackgroundCamera(fov = {}) {
  const focalLength = clamp(finite(fov['focalLength'], 50), 1, 300);
  return {
    position: [0, 1.6, 5]['map']((output, value2) => finite(fov['position']?.[value2], output)),
    target: [0, 1.2, 0]['map']((value3, value4) => finite(fov['target']?.[value4], value3)),
    focalLength: focalLength,
    fov: fov['fov'] == null ? null : clamp(finite(fov['fov'], 40), 1, 179),
    roll: clamp(finite(fov['roll'], 0), -Math['PI'], Math['PI']),
    near: Math['max'](0.001, finite(fov['near'], 0.1)),
    far: Math['max'](1, finite(fov['far'], 1000)),
    aspectRatio: String(fov['aspectRatio'] || '16:9'),
  };
}
export function deriveStoryboard3DBackgroundCamera(value5, value6 = {}) {
  const storyboard3DBackgroundCalibration = normalizeStoryboard3DBackgroundCalibration(value5),
    event = normalizeStoryboard3DBackgroundCamera(value6),
    aspectFromImage2 = aspectFromImage(storyboard3DBackgroundCalibration),
    value7 = (storyboard3DBackgroundCalibration['horizontalFov'] * Math['PI']) / 180,
    fov2 =
      storyboard3DBackgroundCalibration['verticalFov'] ||
      computeStoryboard3DVerticalFov(storyboard3DBackgroundCalibration['horizontalFov'], aspectFromImage2),
    value8 = (fov2 * Math['PI']) / 180,
    count3 = Math['atan'](
      (0.5 - storyboard3DBackgroundCalibration['horizonY']) * 2 * Math['tan'](value8 / 2),
    ),
    value9 = Math['atan'](
      (storyboard3DBackgroundCalibration['vanishingPoint'][0] - 0.5) * 2 * Math['tan'](value7 / 2),
    ),
    value10 = Math['cos'](count3),
    box = {
      x: Math['sin'](value9) * value10,
      y: -Math['sin'](count3),
      z: -Math['cos'](value9) * value10,
    },
    finite2 = finite(event['target'][0], 0),
    finite3 = finite(event['target'][2], 0),
    value11 =
      count3 > 0.01
        ? clamp(storyboard3DBackgroundCalibration['cameraHeight'] / Math['tan'](count3), 1.5, 80)
        : 10,
    position = [
      finite2 - Math['sin'](value9) * value11,
      storyboard3DBackgroundCalibration['cameraHeight'],
      finite3 + Math['cos'](value9) * value11,
    ],
    value12 = count3 > 0.01 ? value11 / Math['max'](0.001, value10) : 10,
    target2 = [
      position[0] + box['x'] * value12,
      position[1] + box['y'] * value12,
      position[2] + box['z'] * value12,
    ],
    value13 = storyboard3DBackgroundCalibration['horizonSlope'] / Math['max'](0.1, aspectFromImage2);
  return normalizeStoryboard3DBackgroundCamera({
    ...event,
    position: position,
    target: target2,
    focalLength: computeStoryboard3DFocalLengthFromHorizontalFov(
      storyboard3DBackgroundCalibration['horizontalFov'],
    ),
    fov: fov2,
    roll: -Math['atan'](value13),
  });
}
export function updateStoryboard3DBackgroundCalibration(args, args2 = {}) {
  const value14 = { ...args, ...args2 };
  return (
    (Object['prototype']['hasOwnProperty']['call'](args2, 'horizonY') ||
      Object['prototype']['hasOwnProperty']['call'](args2, 'horizonSlope')) &&
      !Object['prototype']['hasOwnProperty']['call'](args2, 'groundRegion') &&
      delete value14['groundRegion'],
    normalizeStoryboard3DBackgroundCalibration(value14)
  );
}
export function setStoryboard3DBackgroundCameraLock(value15, lockedCamera, value16) {
  const args3 = normalizeStoryboard3DBackgroundCalibration(value15);
  return {
    ...args3,
    lockedCamera: lockedCamera === true,
    lockedCameraSnapshot: lockedCamera === true ? normalizeStoryboard3DBackgroundCamera(value16) : null,
  };
}
function camerasEqual(value17, value18, value19 = 0.000001) {
  const event2 = normalizeStoryboard3DBackgroundCamera(value17),
    event3 = normalizeStoryboard3DBackgroundCamera(value18);
  return (
    [...event2['position'], ...event2['target'], event2['focalLength'], event2['fov'] ?? 0, event2['roll']][
      'every'
    ](
      (value20, value21) =>
        Math['abs'](
          value20 -
            [
              ...event3['position'],
              ...event3['target'],
              event3['focalLength'],
              event3['fov'] ?? 0,
              event3['roll'],
            ][value21],
        ) <= value19,
    ) && event2['aspectRatio'] === event3['aspectRatio']
  );
}
export function guardStoryboard3DBackgroundCameraChange(value22, value23) {
  const storyboard3DBackgroundCalibration2 = normalizeStoryboard3DBackgroundCalibration(value22);
  if (
    !storyboard3DBackgroundCalibration2['lockedCamera'] ||
    !storyboard3DBackgroundCalibration2['lockedCameraSnapshot']
  )
    return { allowed: true, camera: normalizeStoryboard3DBackgroundCamera(value23), reason: '' };
  if (camerasEqual(storyboard3DBackgroundCalibration2['lockedCameraSnapshot'], value23))
    return { allowed: true, camera: normalizeStoryboard3DBackgroundCamera(value23), reason: '' };
  return {
    allowed: false,
    camera: structuredClone(storyboard3DBackgroundCalibration2['lockedCameraSnapshot']),
    reason: '背景相机已锁定；请先解除锁定再修改机位、焦距或画幅。',
  };
}
export function computeStoryboard3DBackgroundProjection(value24, box2 = {}) {
  const groundRegion = normalizeStoryboard3DBackgroundCalibration(value24),
    value25 = Math['max'](1, finite(box2['width'], 1920)),
    horizonY2 = Math['max'](1, finite(box2['height'], 1080)),
    value26 = (groundRegion['horizontalFov'] * Math['PI']) / 180,
    focalPixels = value25 / (2 * Math['tan'](value26 / 2));
  return {
    focalPixels: focalPixels,
    horizonY: horizonY2 * groundRegion['horizonY'],
    horizonLine: [
      [0, horizonY2 * clamp(groundRegion['horizonY'] - groundRegion['horizonSlope'] * 0.5, 0, 1)],
      [value25, horizonY2 * clamp(groundRegion['horizonY'] + groundRegion['horizonSlope'] * 0.5, 0, 1)],
    ],
    vanishingPoint: [
      value25 * groundRegion['vanishingPoint'][0],
      horizonY2 * groundRegion['vanishingPoint'][1],
    ],
    groundRegion: groundRegion['groundRegion']['map'](([value27, value28]) => [
      value25 * value27,
      horizonY2 * value28,
    ]),
    calibrationConfidence: groundRegion['calibrationConfidence'],
    imageScale: groundRegion['imageScale'],
    imageOffsetPixels: [
      value25 * groundRegion['imageOffset'][0],
      horizonY2 * groundRegion['imageOffset'][1],
    ],
  };
}
