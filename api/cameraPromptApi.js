class CameraPromptMapper {
  constructor() {
    ((this.AZIMUTH_OPTIONS = [
      { key: 'frontView', promptKey: 'front view', value: 0 },
      { key: 'frontRightQuarterView', promptKey: 'front-right quarter view', value: -45 },
      { key: 'rightSideView', promptKey: 'right side view', value: -90 },
      { key: 'backRightQuarterView', promptKey: 'back-right quarter view', value: -135 },
      { key: 'backView', promptKey: 'back view', value: 180 },
      { key: 'backLeftQuarterView', promptKey: 'back-left quarter view', value: 135 },
      { key: 'leftSideView', promptKey: 'left side view', value: 90 },
      { key: 'frontLeftQuarterView', promptKey: 'front-left quarter view', value: 45 },
    ]),
      (this.ELEVATION_OPTIONS = [
        { key: 'lowAngleShot', promptKey: 'low-angle shot', value: -30 },
        { key: 'eyeLevelShot', promptKey: 'eye-level shot', value: 0 },
        { key: 'elevatedShot', promptKey: 'elevated shot', value: 30 },
        { key: 'highAngleShot', promptKey: 'high-angle shot', value: 60 },
      ]),
      (this.ZOOM_RANGES = [
        { key: 'wideShot', promptKey: 'wide shot', min: 0.1, max: 0.85, centerValue: 0.5 },
        { key: 'mediumShot', promptKey: 'medium shot', min: 0.85, max: 1.5, centerValue: 1.2 },
        { key: 'closeUp', promptKey: 'close-up', min: 1.5, max: 2, centerValue: 1.8 },
      ]));
  }
  ['normalizeAzimuth'](value) {
    let count = value % 0x168;
    if (count > 180) count -= 0x168;
    if (count <= -180) count += 0x168;
    return count;
  }
  ['findClosestAzimuth'](item) {
    const key = this.normalizeAzimuth(item);
    let el = this.AZIMUTH_OPTIONS[0],
      index = Math.abs(key - el.value);
    for (const el2 of this.AZIMUTH_OPTIONS) {
      const result = Math.abs(key - el2.value);
      result < index && ((index = result), (el = el2));
    }
    return el;
  }
  ['findClosestElevation'](data) {
    let el3 = this.ELEVATION_OPTIONS[0],
      options = Math.abs(data - el3.value);
    for (const el4 of this.ELEVATION_OPTIONS) {
      const target = Math.abs(data - el4.value);
      target < options && ((options = target), (el3 = el4));
    }
    return el3;
  }
  ['findZoomRange'](source) {
    for (const next of this.ZOOM_RANGES) {
      if (source >= next.min && source < next.max) return next;
    }
    return this.ZOOM_RANGES[this.ZOOM_RANGES.length - 1];
  }
  ['generatePrompt'](enabled) {
    if (!enabled) return '';
    const { rotation: rotation = 35, pitch: pitch = 20, scale: scale = 0.5 } = enabled,
      current = this.findZoomRange(scale).promptKey,
      entry = this.findClosestAzimuth(rotation).promptKey,
      record = this.findClosestElevation(pitch).promptKey;
    return 'switch the camera perspective: ' + current + ', ' + entry + ', ' + record;
  }
}
const cameraPromptMapper = new CameraPromptMapper();
export function applyCameraAngleToPrompt(payload, enabled2) {
  const handle = String(payload || '');
  if (!enabled2) return handle;
  const enabled3 = cameraPromptMapper.generatePrompt(enabled2);
  if (!enabled3) return handle;
  return enabled3 + (handle ? ', ' + handle : '');
}
