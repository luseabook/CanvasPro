export const MEDIAPIPE_POSE_LANDMARK_INDEX = Object['freeze']({
  nose: 0x0,
  leftEar: 0x7,
  rightEar: 0x8,
  leftShoulder: 0xb,
  rightShoulder: 0xc,
  leftElbow: 0xd,
  rightElbow: 0xe,
  leftWrist: 0xf,
  rightWrist: 0x10,
  leftPinky: 0x11,
  rightPinky: 0x12,
  leftIndex: 0x13,
  rightIndex: 0x14,
  leftHip: 0x17,
  rightHip: 0x18,
  leftKnee: 0x19,
  rightKnee: 0x1a,
  leftAnkle: 0x1b,
  rightAnkle: 0x1c,
  leftHeel: 0x1d,
  rightHeel: 0x1e,
  leftFootIndex: 0x1f,
  rightFootIndex: 0x20,
});
export const DEFAULT_IMAGE_POSE_MIN_VISIBILITY = 0.5;
const EPSILON = 1e-8,
  IDENTITY_QUATERNION = Object['freeze']([0x0, 0x0, 0x0, 0x1]),
  WORLD_UP = Object['freeze']({ x: 0x0, y: 0x1, z: 0x0 }),
  WORLD_FORWARD = Object['freeze']({ x: 0x0, y: 0x0, z: 0x1 }),
  LEG_REST_DIRECTION = Object['freeze']({ x: 0x0, y: -0x1, z: 0x0 }),
  NATURAL_ARM_OUTWARD = 0.23,
  NATURAL_ARM_DOWN = Math['sqrt'](0x1 - NATURAL_ARM_OUTWARD * NATURAL_ARM_OUTWARD),
  ARM_REST_DIRECTION = Object['freeze']({
    left: Object['freeze']({ x: -NATURAL_ARM_OUTWARD, y: -NATURAL_ARM_DOWN, z: 0x0 }),
    right: Object['freeze']({ x: NATURAL_ARM_OUTWARD, y: -NATURAL_ARM_DOWN, z: 0x0 }),
  }),
  BONE_ANGLE_LIMITS = Object['freeze']({
    pelvis: Math['PI'],
    spine_01: 0.7,
    spine_02: 0.7,
    spine_03: 0.7,
    neck_01: 0.8,
    Head: 1.15,
    upperarm_l: 2.8,
    upperarm_r: 2.8,
    lowerarm_l: 2.45,
    lowerarm_r: 2.45,
    hand_l: 1.2,
    hand_r: 1.2,
    thigh_l: 2.2,
    thigh_r: 2.2,
    calf_l: 2.65,
    calf_r: 2.65,
    foot_l: 1.25,
    foot_r: 1.25,
  });
function clamp(_0x2486dd, _0x3679b1, _0x21a53b) {
  return Math['max'](_0x3679b1, Math['min'](_0x21a53b, Number(_0x2486dd) || 0x0));
}
function finiteNumber(_0x42d66f) {
  const _0x2c0ff3 = Number(_0x42d66f);
  return Number['isFinite'](_0x2c0ff3) ? _0x2c0ff3 : null;
}
function add(_0x1e78d6, _0x3eb97d) {
  return {
    x: _0x1e78d6['x'] + _0x3eb97d['x'],
    y: _0x1e78d6['y'] + _0x3eb97d['y'],
    z: _0x1e78d6['z'] + _0x3eb97d['z'],
  };
}
function subtract(_0x36946f, _0x3d6d82) {
  return {
    x: _0x36946f['x'] - _0x3d6d82['x'],
    y: _0x36946f['y'] - _0x3d6d82['y'],
    z: _0x36946f['z'] - _0x3d6d82['z'],
  };
}
function scaleVector(_0x22d4f2, _0x216343) {
  return { x: _0x22d4f2['x'] * _0x216343, y: _0x22d4f2['y'] * _0x216343, z: _0x22d4f2['z'] * _0x216343 };
}
function dot(_0x6df149, _0x988fea) {
  return _0x6df149['x'] * _0x988fea['x'] + _0x6df149['y'] * _0x988fea['y'] + _0x6df149['z'] * _0x988fea['z'];
}
function cross(_0x43295e, _0x27f86c) {
  return {
    x: _0x43295e['y'] * _0x27f86c['z'] - _0x43295e['z'] * _0x27f86c['y'],
    y: _0x43295e['z'] * _0x27f86c['x'] - _0x43295e['x'] * _0x27f86c['z'],
    z: _0x43295e['x'] * _0x27f86c['y'] - _0x43295e['y'] * _0x27f86c['x'],
  };
}
function vectorLength(_0x5bd7b6) {
  return Math['hypot'](_0x5bd7b6['x'], _0x5bd7b6['y'], _0x5bd7b6['z']);
}
function normalizeVector(_0x34c73d) {
  const _0x3d6468 = vectorLength(_0x34c73d);
  return _0x3d6468 > EPSILON ? scaleVector(_0x34c73d, 0x1 / _0x3d6468) : null;
}
function midpoint(_0x55f910, _0x1eac1e) {
  return scaleVector(add(_0x55f910, _0x1eac1e), 0.5);
}
function segmentDirection(_0x340a29, _0x59aed8) {
  return _0x340a29 && _0x59aed8 ? normalizeVector(subtract(_0x59aed8, _0x340a29)) : null;
}
function normalizeQuaternion(_0x2f8acc) {
  if (!Array['isArray'](_0x2f8acc) || _0x2f8acc['length'] !== 0x4) return null;
  const _0x58fd03 = _0x2f8acc['map'](finiteNumber);
  if (_0x58fd03['some']((_0x181d42) => _0x181d42 === null)) return null;
  const _0x45dd6c = Math['hypot'](..._0x58fd03);
  if (_0x45dd6c <= EPSILON) return null;
  const _0x82a3f3 = _0x58fd03['map']((_0x5e5c30) => _0x5e5c30 / _0x45dd6c);
  return _0x82a3f3[0x3] < 0x0 ? _0x82a3f3['map']((_0x305a86) => -_0x305a86) : _0x82a3f3;
}
function multiplyQuaternions(_0x15492e, _0x2a05e9) {
  const [_0x533865, _0x2cba1f, _0x5ce7c3, _0x13453b] = _0x15492e,
    [_0x274170, _0x4c3715, _0x4909d6, _0x1ddb96] = _0x2a05e9;
  return normalizeQuaternion([
    _0x13453b * _0x274170 + _0x533865 * _0x1ddb96 + _0x2cba1f * _0x4909d6 - _0x5ce7c3 * _0x4c3715,
    _0x13453b * _0x4c3715 - _0x533865 * _0x4909d6 + _0x2cba1f * _0x1ddb96 + _0x5ce7c3 * _0x274170,
    _0x13453b * _0x4909d6 + _0x533865 * _0x4c3715 - _0x2cba1f * _0x274170 + _0x5ce7c3 * _0x1ddb96,
    _0x13453b * _0x1ddb96 - _0x533865 * _0x274170 - _0x2cba1f * _0x4c3715 - _0x5ce7c3 * _0x4909d6,
  ]);
}
function invertQuaternion(_0x100b36) {
  return [-_0x100b36[0x0], -_0x100b36[0x1], -_0x100b36[0x2], _0x100b36[0x3]];
}
function rotateVectorByQuaternion(_0xd7baa8, _0x58cb61) {
  const [_0x583be7, _0x2e76c2, _0x3772b2, _0x6bff19] = _0x58cb61,
    _0x47eded = { x: _0x583be7, y: _0x2e76c2, z: _0x3772b2 },
    _0x10a3de = cross(_0x47eded, _0xd7baa8),
    _0x182163 = cross(_0x47eded, _0x10a3de);
  return add(_0xd7baa8, add(scaleVector(_0x10a3de, 0x2 * _0x6bff19), scaleVector(_0x182163, 0x2)));
}
function quaternionFromTo(_0x16e991, _0x57c2a8) {
  const _0x31f5c7 = normalizeVector(_0x16e991),
    _0x188ad2 = normalizeVector(_0x57c2a8);
  if (!_0x31f5c7 || !_0x188ad2) return null;
  const _0x4b0b8a = clamp(dot(_0x31f5c7, _0x188ad2), -0x1, 0x1);
  if (_0x4b0b8a > 0x1 - EPSILON) return [...IDENTITY_QUATERNION];
  if (_0x4b0b8a < -0x1 + EPSILON) {
    const _0x511dcb = cross(_0x31f5c7, { x: 0x1, y: 0x0, z: 0x0 }),
      _0x2e133f = cross(_0x31f5c7, { x: 0x0, y: 0x0, z: 0x1 }),
      _0x22795e = normalizeVector(vectorLength(_0x511dcb) > vectorLength(_0x2e133f) ? _0x511dcb : _0x2e133f);
    return _0x22795e ? [_0x22795e['x'], _0x22795e['y'], _0x22795e['z'], 0x0] : null;
  }
  const _0x5b3c75 = cross(_0x31f5c7, _0x188ad2),
    _0x5dc174 = Math['sqrt']((0x1 + _0x4b0b8a) * 0x2);
  return normalizeQuaternion([
    _0x5b3c75['x'] / _0x5dc174,
    _0x5b3c75['y'] / _0x5dc174,
    _0x5b3c75['z'] / _0x5dc174,
    _0x5dc174 / 0x2,
  ]);
}
function quaternionFromBasis(_0x1b4ac2, _0x5264e1, _0x12f476) {
  const _0x3f73c5 = _0x1b4ac2['x'],
    _0x4665a3 = _0x5264e1['x'],
    _0x330491 = _0x12f476['x'],
    _0x12e733 = _0x1b4ac2['y'],
    _0x7ef007 = _0x5264e1['y'],
    _0x1c2cea = _0x12f476['y'],
    _0x354e4d = _0x1b4ac2['z'],
    _0x5aa79d = _0x5264e1['z'],
    _0x47db70 = _0x12f476['z'],
    _0x22d880 = _0x3f73c5 + _0x7ef007 + _0x47db70;
  let _0x2482fc;
  if (_0x22d880 > 0x0) {
    const _0x25e70a = 0.5 / Math['sqrt'](_0x22d880 + 0x1);
    _0x2482fc = [
      (_0x5aa79d - _0x1c2cea) * _0x25e70a,
      (_0x330491 - _0x354e4d) * _0x25e70a,
      (_0x12e733 - _0x4665a3) * _0x25e70a,
      0.25 / _0x25e70a,
    ];
  } else {
    if (_0x3f73c5 > _0x7ef007 && _0x3f73c5 > _0x47db70) {
      const _0x15de00 = 0x2 * Math['sqrt'](0x1 + _0x3f73c5 - _0x7ef007 - _0x47db70);
      _0x2482fc = [
        0.25 * _0x15de00,
        (_0x4665a3 + _0x12e733) / _0x15de00,
        (_0x330491 + _0x354e4d) / _0x15de00,
        (_0x5aa79d - _0x1c2cea) / _0x15de00,
      ];
    } else {
      if (_0x7ef007 > _0x47db70) {
        const _0x11d423 = 0x2 * Math['sqrt'](0x1 + _0x7ef007 - _0x3f73c5 - _0x47db70);
        _0x2482fc = [
          (_0x4665a3 + _0x12e733) / _0x11d423,
          0.25 * _0x11d423,
          (_0x1c2cea + _0x5aa79d) / _0x11d423,
          (_0x330491 - _0x354e4d) / _0x11d423,
        ];
      } else {
        const _0xe29c0a = 0x2 * Math['sqrt'](0x1 + _0x47db70 - _0x3f73c5 - _0x7ef007);
        _0x2482fc = [
          (_0x330491 + _0x354e4d) / _0xe29c0a,
          (_0x1c2cea + _0x5aa79d) / _0xe29c0a,
          0.25 * _0xe29c0a,
          (_0x12e733 - _0x4665a3) / _0xe29c0a,
        ];
      }
    }
  }
  return normalizeQuaternion(_0x2482fc);
}
function frameQuaternion(_0x1ea61c, _0xee16a5) {
  const _0x1bab1b = normalizeVector(_0xee16a5);
  if (!_0x1bab1b) return null;
  const _0x4b7612 = subtract(_0x1ea61c, scaleVector(_0x1bab1b, dot(_0x1ea61c, _0x1bab1b))),
    _0x4decbf = normalizeVector(_0x4b7612);
  if (!_0x4decbf) return null;
  const _0x448ffd = normalizeVector(cross(_0x4decbf, _0x1bab1b));
  if (!_0x448ffd) return null;
  const _0x20ccf9 = normalizeVector(cross(_0x1bab1b, _0x448ffd));
  return _0x20ccf9 ? quaternionFromBasis(_0x20ccf9, _0x1bab1b, _0x448ffd) : null;
}
function quaternionFraction(_0xc208ed, _0x1ca7d7) {
  const _0x227c5d = normalizeQuaternion(_0xc208ed);
  if (!_0x227c5d) return null;
  const _0x5853ee = clamp(_0x227c5d[0x3], -0x1, 0x1),
    _0x5f1634 = 0x2 * Math['acos'](_0x5853ee);
  if (_0x5f1634 <= EPSILON) return [...IDENTITY_QUATERNION];
  const _0x295afa = Math['sin'](_0x5f1634 / 0x2);
  if (Math['abs'](_0x295afa) <= EPSILON) return [...IDENTITY_QUATERNION];
  const _0x32a645 = _0x227c5d['slice'](0x0, 0x3)['map']((_0x20199d) => _0x20199d / _0x295afa),
    _0x3197a2 = (_0x5f1634 * clamp(_0x1ca7d7, 0x0, 0x1)) / 0x2,
    _0x2bc2bf = Math['sin'](_0x3197a2);
  return normalizeQuaternion([
    _0x32a645[0x0] * _0x2bc2bf,
    _0x32a645[0x1] * _0x2bc2bf,
    _0x32a645[0x2] * _0x2bc2bf,
    Math['cos'](_0x3197a2),
  ]);
}
function clampQuaternionAngle(_0x2084bc, _0xd00ab2) {
  const _0x691476 = normalizeQuaternion(_0x2084bc);
  if (!_0x691476) return null;
  const _0x342520 = 0x2 * Math['acos'](clamp(_0x691476[0x3], -0x1, 0x1));
  if (!Number['isFinite'](_0xd00ab2) || _0x342520 <= _0xd00ab2) return _0x691476;
  return quaternionFraction(_0x691476, _0xd00ab2 / Math['max'](EPSILON, _0x342520));
}
function toStoryboard3DRigQuaternion(_0x59fd6a) {
  const _0x2709b0 = normalizeQuaternion(_0x59fd6a);
  if (!_0x2709b0) return null;
  return normalizeQuaternion([_0x2709b0[0x0], -_0x2709b0[0x1], -_0x2709b0[0x2], _0x2709b0[0x3]]);
}
function unwrapLandmarks(_0x373313) {
  let _0x22d791 =
    _0x373313?.['worldLandmarks'] ??
    _0x373313?.['poseWorldLandmarks'] ??
    _0x373313?.['landmarks'] ??
    _0x373313;
  if (Array['isArray'](_0x22d791?.[0x0])) _0x22d791 = _0x22d791[0x0];
  return Array['isArray'](_0x22d791) && _0x22d791['length'] >= 0x21 ? _0x22d791 : null;
}
function landmarkVisibility(_0x56eae5) {
  if (!_0x56eae5 || typeof _0x56eae5 !== 'object') return 0x0;
  const _0x235a4c = finiteNumber(_0x56eae5['visibility']),
    _0x249acd = finiteNumber(_0x56eae5['presence']);
  if (_0x235a4c !== null && _0x249acd !== null) return clamp(Math['min'](_0x235a4c, _0x249acd), 0x0, 0x1);
  if (_0x235a4c !== null) return clamp(_0x235a4c, 0x0, 0x1);
  if (_0x249acd !== null) return clamp(_0x249acd, 0x0, 0x1);
  return 0x1;
}
function convertLandmark(_0xefa999, { mirrorX: _0x40071e, invertY: _0x519774, invertZ: _0x20c5d2 }) {
  const _0x48b457 = finiteNumber(_0xefa999?.['x']),
    _0x58ff6 = finiteNumber(_0xefa999?.['y']),
    _0x1134d5 = finiteNumber(_0xefa999?.['z']);
  if (_0x48b457 === null || _0x58ff6 === null || _0x1134d5 === null) return null;
  return {
    x: _0x40071e ? -_0x48b457 : _0x48b457,
    y: _0x519774 ? -_0x58ff6 : _0x58ff6,
    z: _0x20c5d2 ? -_0x1134d5 : _0x1134d5,
    visibility: landmarkVisibility(_0xefa999),
  };
}
function normalizationScale(_0x5e1895) {
  const {
      leftShoulder: _0x3cc81f,
      rightShoulder: _0x219846,
      leftHip: _0x3f10dd,
      rightHip: _0x3ef5d4,
    } = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x1772a6 =
      _0x5e1895[_0x3cc81f] && _0x5e1895[_0x219846]
        ? midpoint(_0x5e1895[_0x3cc81f], _0x5e1895[_0x219846])
        : null,
    _0x149529 =
      _0x5e1895[_0x3f10dd] && _0x5e1895[_0x3ef5d4]
        ? midpoint(_0x5e1895[_0x3f10dd], _0x5e1895[_0x3ef5d4])
        : null,
    _0x4f4f59 = _0x1772a6 && _0x149529 ? vectorLength(subtract(_0x1772a6, _0x149529)) : 0x0;
  if (_0x4f4f59 > EPSILON) return { origin: _0x149529, scale: _0x4f4f59 };
  const _0xe2261e = [
      _0x5e1895[_0x3cc81f] && _0x5e1895[_0x219846]
        ? vectorLength(subtract(_0x5e1895[_0x3cc81f], _0x5e1895[_0x219846]))
        : 0x0,
      _0x5e1895[_0x3f10dd] && _0x5e1895[_0x3ef5d4]
        ? vectorLength(subtract(_0x5e1895[_0x3f10dd], _0x5e1895[_0x3ef5d4]))
        : 0x0,
    ]['filter']((_0x4fe1c8) => _0x4fe1c8 > EPSILON),
    _0x2ed29c =
      _0xe2261e['length'] > 0x0
        ? _0xe2261e['reduce']((_0x91a321, _0x1ee55f) => _0x91a321 + _0x1ee55f, 0x0) / _0xe2261e['length']
        : 0x0;
  return _0x2ed29c > EPSILON ? { origin: _0x149529 || { x: 0x0, y: 0x0, z: 0x0 }, scale: _0x2ed29c } : null;
}
function normalizeLandmarks(_0x3b76a4, _0x1d3d01) {
  const _0x61472a = _0x3b76a4['map']((_0x3b1eb7) => convertLandmark(_0x3b1eb7, _0x1d3d01)),
    _0xf6f06a = normalizationScale(_0x61472a);
  if (!_0xf6f06a) return null;
  return _0x61472a['map'](
    (_0x552afc) =>
      _0x552afc && {
        ...scaleVector(subtract(_0x552afc, _0xf6f06a['origin']), 0x1 / _0xf6f06a['scale']),
        visibility: _0x552afc['visibility'],
      },
  );
}
function confidenceFor(_0x40fec0, _0x4b4fdc) {
  const _0x18c83c = [...new Set(_0x4b4fdc)]['map'](
    (_0x41cdf8) => _0x40fec0[_0x41cdf8]?.['visibility'] ?? 0x0,
  );
  return _0x18c83c['length'] > 0x0 ? Math['min'](..._0x18c83c) : 0x0;
}
function average(_0x3989d6) {
  return _0x3989d6['length'] > 0x0
    ? _0x3989d6['reduce']((_0x53ca63, _0xc92366) => _0x53ca63 + _0xc92366, 0x0) / _0x3989d6['length']
    : 0x0;
}
function handTarget(_0x25e183, _0x267d95) {
  const _0x463dca = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x37a28d = _0x25e183[_0x463dca[_0x267d95 + 'Wrist']],
    _0x3255a9 = _0x25e183[_0x463dca[_0x267d95 + 'Pinky']],
    _0xa47ff = _0x25e183[_0x463dca[_0x267d95 + 'Index']];
  return _0x37a28d && _0x3255a9 && _0xa47ff
    ? segmentDirection(_0x37a28d, midpoint(_0x3255a9, _0xa47ff))
    : null;
}
function retargetArm(_0x3389a9, _0x520857, _0x2fbc23) {
  const _0x4b9dd9 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x3f6040 = _0x3389a9[_0x4b9dd9[_0x520857 + 'Shoulder']],
    _0x1cbeac = _0x3389a9[_0x4b9dd9[_0x520857 + 'Elbow']],
    _0x48a682 = _0x3389a9[_0x4b9dd9[_0x520857 + 'Wrist']],
    _0x1425f6 = invertQuaternion(_0x2fbc23),
    _0x29265e = segmentDirection(_0x3f6040, _0x1cbeac),
    _0x4615de = segmentDirection(_0x1cbeac, _0x48a682),
    _0x43e6a4 = handTarget(_0x3389a9, _0x520857);
  if (!_0x29265e || !_0x4615de) return null;
  const _0x49ee61 = ARM_REST_DIRECTION[_0x520857],
    _0x4e35ba = rotateVectorByQuaternion(_0x29265e, _0x1425f6),
    _0x3fe71d = rotateVectorByQuaternion(_0x4615de, _0x1425f6),
    _0x3b8705 = quaternionFromTo(_0x49ee61, _0x4e35ba),
    _0x355b8b = quaternionFromTo(_0x49ee61, _0x3fe71d);
  if (!_0x3b8705 || !_0x355b8b) return null;
  const _0x1b3b7f = multiplyQuaternions(invertQuaternion(_0x3b8705), _0x355b8b);
  let _0x571790 = null;
  if (_0x43e6a4) {
    const _0x28aef8 = rotateVectorByQuaternion(_0x43e6a4, _0x1425f6),
      _0x2014de = quaternionFromTo(_0x49ee61, _0x28aef8);
    _0x571790 = _0x2014de ? multiplyQuaternions(invertQuaternion(_0x355b8b), _0x2014de) : null;
  }
  return { upper: _0x3b8705, lower: _0x1b3b7f, hand: _0x571790 };
}
function retargetLeg(_0x2576bc, _0x362004, _0x1021a1) {
  const _0x21043d = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x563d2f = _0x2576bc[_0x21043d[_0x362004 + 'Hip']],
    _0x240a8e = _0x2576bc[_0x21043d[_0x362004 + 'Knee']],
    _0x25ba8f = _0x2576bc[_0x21043d[_0x362004 + 'Ankle']],
    _0x34612d = _0x2576bc[_0x21043d[_0x362004 + 'FootIndex']],
    _0x4db7e5 = invertQuaternion(_0x1021a1),
    _0x4c7822 = segmentDirection(_0x563d2f, _0x240a8e),
    _0xb49b6e = segmentDirection(_0x240a8e, _0x25ba8f);
  if (!_0x4c7822 || !_0xb49b6e) return null;
  const _0x59e9d4 = rotateVectorByQuaternion(_0x4c7822, _0x4db7e5),
    _0x8e963f = rotateVectorByQuaternion(_0xb49b6e, _0x4db7e5),
    _0x39d91e = quaternionFromTo(LEG_REST_DIRECTION, _0x59e9d4),
    _0x55b2d0 = quaternionFromTo(LEG_REST_DIRECTION, _0x8e963f);
  if (!_0x39d91e || !_0x55b2d0) return null;
  const _0x3a3cc1 = multiplyQuaternions(invertQuaternion(_0x39d91e), _0x55b2d0);
  let _0x459e5f = null;
  const _0x389e2c = segmentDirection(_0x25ba8f, _0x34612d);
  if (_0x389e2c) {
    const _0x1cc798 = rotateVectorByQuaternion(_0x389e2c, _0x4db7e5),
      _0x1eecac = quaternionFromTo(WORLD_FORWARD, _0x1cc798);
    _0x459e5f = _0x1eecac ? multiplyQuaternions(invertQuaternion(_0x55b2d0), _0x1eecac) : null;
  }
  return { thigh: _0x39d91e, calf: _0x3a3cc1, foot: _0x459e5f };
}
function buildBodyFrames(_0x202d1e) {
  const _0x5dccdb = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x87120a = _0x202d1e[_0x5dccdb['leftShoulder']],
    _0xfada08 = _0x202d1e[_0x5dccdb['rightShoulder']],
    _0x581167 = _0x202d1e[_0x5dccdb['leftHip']],
    _0x2ac143 = _0x202d1e[_0x5dccdb['rightHip']];
  if (!_0x87120a || !_0xfada08 || !_0x581167 || !_0x2ac143) return null;
  const _0x204ab5 = midpoint(_0x87120a, _0xfada08),
    _0x5b3b6b = midpoint(_0x581167, _0x2ac143),
    _0x318082 = subtract(_0x204ab5, _0x5b3b6b),
    _0x2c5e5b = frameQuaternion(subtract(_0x2ac143, _0x581167), WORLD_UP),
    _0x1d841d = frameQuaternion(subtract(_0xfada08, _0x87120a), _0x318082);
  if (!_0x2c5e5b || !_0x1d841d) return null;
  return {
    shoulderMid: _0x204ab5,
    pelvisQuaternion: _0x2c5e5b,
    torsoQuaternion: _0x1d841d,
    spineQuaternion: multiplyQuaternions(invertQuaternion(_0x2c5e5b), _0x1d841d),
  };
}
function warning(_0x5d354f, _0x28aaa4, _0x41eb5c = {}) {
  return { code: _0x5d354f, message: _0x28aaa4, ..._0x41eb5c };
}
export function retargetMediaPipePoseToStoryboard3D(
  _0x40ca40,
  {
    minVisibility: minVisibility = DEFAULT_IMAGE_POSE_MIN_VISIBILITY,
    mirrorX: mirrorX = !![],
    invertY: invertY = !![],
    invertZ: invertZ = !![],
  } = {},
) {
  const _0x5820ac = unwrapLandmarks(_0x40ca40);
  if (!_0x5820ac)
    return {
      boneOverrides: {},
      confidence: 0x0,
      boneConfidence: {},
      warnings: [
        warning('POSE_LANDMARKS_INVALID', 'MediaPipe pose retargeting requires at least 33 world landmarks.'),
      ],
    };
  const _0x1253f7 = normalizeLandmarks(_0x5820ac, {
    mirrorX: mirrorX !== ![],
    invertY: invertY !== ![],
    invertZ: invertZ !== ![],
  });
  if (!_0x1253f7)
    return {
      boneOverrides: {},
      confidence: 0x0,
      boneConfidence: {},
      warnings: [
        warning('POSE_SCALE_UNAVAILABLE', 'Pose landmarks do not contain a usable torso or body scale.'),
      ],
    };
  const _0x5863ac = clamp(minVisibility, 0x0, 0x1),
    _0x51d1ef = MEDIAPIPE_POSE_LANDMARK_INDEX,
    _0x13a1bd = {},
    _0x4841a5 = {},
    _0x36e3f8 = [],
    _0x1bddf0 = [],
    _0x4f762d = (_0x3c71e3, _0x25e0c3, _0x4f3ae8) => {
      const _0x35e96f = confidenceFor(_0x1253f7, _0x25e0c3);
      _0x4841a5[_0x3c71e3] = _0x35e96f;
      if (_0x35e96f < _0x5863ac) {
        _0x36e3f8['push'](_0x3c71e3);
        return;
      }
      const _0x30c228 = _0x4f3ae8(),
        _0x16855e = clampQuaternionAngle(_0x30c228, BONE_ANGLE_LIMITS[_0x3c71e3]);
      if (!_0x16855e) {
        _0x1bddf0['push'](_0x3c71e3);
        return;
      }
      _0x13a1bd[_0x3c71e3] = toStoryboard3DRigQuaternion(_0x16855e);
    },
    _0x45ae32 = [
      _0x51d1ef['leftShoulder'],
      _0x51d1ef['rightShoulder'],
      _0x51d1ef['leftHip'],
      _0x51d1ef['rightHip'],
    ],
    _0x24eee7 = buildBodyFrames(_0x1253f7);
  _0x4f762d('pelvis', [_0x51d1ef['leftHip'], _0x51d1ef['rightHip']], () => _0x24eee7?.['pelvisQuaternion']);
  const _0x233339 = _0x24eee7?.['spineQuaternion']
    ? quaternionFraction(_0x24eee7['spineQuaternion'], 0x1 / 0x3)
    : null;
  for (const _0x18d306 of ['spine_01', 'spine_02', 'spine_03']) {
    _0x4f762d(_0x18d306, _0x45ae32, () => _0x233339);
  }
  const _0x3facbd = [..._0x45ae32, _0x51d1ef['leftEar'], _0x51d1ef['rightEar']];
  let _0x4d7ec4 = null;
  (_0x4f762d('neck_01', _0x3facbd, () => {
    if (!_0x24eee7) return null;
    const _0x479959 = midpoint(_0x1253f7[_0x51d1ef['leftEar']], _0x1253f7[_0x51d1ef['rightEar']]),
      _0x8c6703 = segmentDirection(_0x24eee7['shoulderMid'], _0x479959);
    if (!_0x8c6703) return null;
    const _0x53f728 = rotateVectorByQuaternion(_0x8c6703, invertQuaternion(_0x24eee7['torsoQuaternion']));
    return ((_0x4d7ec4 = quaternionFromTo(WORLD_UP, _0x53f728)), _0x4d7ec4);
  }),
    _0x4f762d('Head', [..._0x3facbd, _0x51d1ef['nose']], () => {
      if (!_0x24eee7 || !_0x4d7ec4) return null;
      const _0x150d66 = midpoint(_0x1253f7[_0x51d1ef['leftEar']], _0x1253f7[_0x51d1ef['rightEar']]),
        _0x3dc5a3 = segmentDirection(_0x150d66, _0x1253f7[_0x51d1ef['nose']]);
      if (!_0x3dc5a3) return null;
      const _0x49f238 = rotateVectorByQuaternion(_0x3dc5a3, invertQuaternion(_0x24eee7['torsoQuaternion'])),
        _0x4df932 = quaternionFromTo(WORLD_FORWARD, _0x49f238);
      return _0x4df932 ? multiplyQuaternions(invertQuaternion(_0x4d7ec4), _0x4df932) : null;
    }));
  for (const _0x558512 of ['left', 'right']) {
    const _0x54ce86 = _0x558512 === 'left' ? 'l' : 'r',
      _0x3c62ee = [..._0x45ae32, _0x51d1ef[_0x558512 + 'Elbow'], _0x51d1ef[_0x558512 + 'Wrist']];
    let _0x5b46c9 = null;
    const _0x12f85c = () => {
      if (!_0x5b46c9 && _0x24eee7)
        _0x5b46c9 = retargetArm(_0x1253f7, _0x558512, _0x24eee7['torsoQuaternion']);
      return _0x5b46c9;
    };
    (_0x4f762d(
      'upperarm_' + _0x54ce86,
      [..._0x45ae32, _0x51d1ef[_0x558512 + 'Elbow']],
      () => _0x12f85c()?.['upper'],
    ),
      _0x4f762d('lowerarm_' + _0x54ce86, _0x3c62ee, () => _0x12f85c()?.['lower']),
      _0x4f762d(
        'hand_' + _0x54ce86,
        [..._0x3c62ee, _0x51d1ef[_0x558512 + 'Pinky'], _0x51d1ef[_0x558512 + 'Index']],
        () => _0x12f85c()?.['hand'],
      ));
    const _0x4e28f3 = [
      _0x51d1ef['leftHip'],
      _0x51d1ef['rightHip'],
      _0x51d1ef[_0x558512 + 'Knee'],
      _0x51d1ef[_0x558512 + 'Ankle'],
    ];
    let _0x115289 = null;
    const _0x10f262 = () => {
      if (!_0x115289 && _0x24eee7)
        _0x115289 = retargetLeg(_0x1253f7, _0x558512, _0x24eee7['pelvisQuaternion']);
      return _0x115289;
    };
    (_0x4f762d(
      'thigh_' + _0x54ce86,
      [_0x51d1ef['leftHip'], _0x51d1ef['rightHip'], _0x51d1ef[_0x558512 + 'Knee']],
      () => _0x10f262()?.['thigh'],
    ),
      _0x4f762d('calf_' + _0x54ce86, _0x4e28f3, () => _0x10f262()?.['calf']),
      _0x4f762d(
        'foot_' + _0x54ce86,
        [..._0x4e28f3, _0x51d1ef[_0x558512 + 'FootIndex']],
        () => _0x10f262()?.['foot'],
      ));
  }
  const _0x2f44f2 = [];
  return (
    _0x36e3f8['length'] > 0x0 &&
      _0x2f44f2['push'](
        warning(
          'LOW_CONFIDENCE_BONES_SKIPPED',
          'Low-visibility\x20landmarks\x20were\x20not\x20applied\x20to\x20the\x20affected\x20character\x20bones.',
          { bones: _0x36e3f8, threshold: _0x5863ac },
        ),
      ),
    _0x1bddf0['length'] > 0x0 &&
      _0x2f44f2['push'](
        warning(
          'DEGENERATE_POSE_SEGMENTS_SKIPPED',
          'Zero-length\x20or\x20ambiguous\x20pose\x20segments\x20were\x20not\x20applied.',
          { bones: _0x1bddf0 },
        ),
      ),
    {
      boneOverrides: _0x13a1bd,
      confidence: average(Object['values'](_0x4841a5)),
      boneConfidence: _0x4841a5,
      warnings: _0x2f44f2,
    }
  );
}
