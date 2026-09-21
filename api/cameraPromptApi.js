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
  ['normalizeAzimuth'](_0x11e584) {
    let _0x3cf913 = _0x11e584 % 0x168;
    if (_0x3cf913 > 180) _0x3cf913 -= 0x168;
    if (_0x3cf913 <= -180) _0x3cf913 += 0x168;
    return _0x3cf913;
  }
  ['findClosestAzimuth'](_0x32a93f) {
    const _0x46ac0e = this.normalizeAzimuth(_0x32a93f);
    let _0x1bc572 = this.AZIMUTH_OPTIONS[0],
      _0x197da8 = Math.abs(_0x46ac0e - _0x1bc572.value);
    for (const _0x4fc079 of this.AZIMUTH_OPTIONS) {
      const _0x516b87 = Math.abs(_0x46ac0e - _0x4fc079.value);
      _0x516b87 < _0x197da8 && ((_0x197da8 = _0x516b87), (_0x1bc572 = _0x4fc079));
    }
    return _0x1bc572;
  }
  ['findClosestElevation'](_0x19ecae) {
    let _0x44df09 = this.ELEVATION_OPTIONS[0],
      _0x3201ac = Math.abs(_0x19ecae - _0x44df09.value);
    for (const _0x11b2da of this.ELEVATION_OPTIONS) {
      const _0x14bf4d = Math.abs(_0x19ecae - _0x11b2da.value);
      _0x14bf4d < _0x3201ac && ((_0x3201ac = _0x14bf4d), (_0x44df09 = _0x11b2da));
    }
    return _0x44df09;
  }
  ['findZoomRange'](_0xf9a9da) {
    for (const _0x3e60ec of this.ZOOM_RANGES) {
      if (_0xf9a9da >= _0x3e60ec.min && _0xf9a9da < _0x3e60ec.max) return _0x3e60ec;
    }
    return this.ZOOM_RANGES[this.ZOOM_RANGES.length - 1];
  }
  ['generatePrompt'](_0x5b0b5d) {
    if (!_0x5b0b5d) return '';
    const { rotation: rotation = 35, pitch: pitch = 20, scale: scale = 0.5 } = _0x5b0b5d,
      _0x23d124 = this.findZoomRange(scale).promptKey,
      _0x8e2dd2 = this.findClosestAzimuth(rotation).promptKey,
      _0xbcba73 = this.findClosestElevation(pitch).promptKey;
    return 'switch the camera perspective: ' + _0x23d124 + ', ' + _0x8e2dd2 + ', ' + _0xbcba73;
  }
}
const cameraPromptMapper = new CameraPromptMapper();
export function applyCameraAngleToPrompt(_0x39204f, _0x10fd7e) {
  const _0x4e32d7 = String(_0x39204f || '');
  if (!_0x10fd7e) return _0x4e32d7;
  const _0x488bd3 = cameraPromptMapper.generatePrompt(_0x10fd7e);
  if (!_0x488bd3) return _0x4e32d7;
  return _0x488bd3 + (_0x4e32d7 ? ', ' + _0x4e32d7 : '');
}
