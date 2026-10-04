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
function clamp(value, item, key) {
  return Math['max'](item, Math['min'](key, Number(value) || 0x0));
}
function finiteNumber(index) {
  const result = Number(index);
  return Number['isFinite'](result) ? result : null;
}
function add(x2, box) {
  return {
    x: x2['x'] + box['x'],
    y: x2['y'] + box['y'],
    z: x2['z'] + box['z'],
  };
}
function subtract(x3, box2) {
  return {
    x: x3['x'] - box2['x'],
    y: x3['y'] - box2['y'],
    z: x3['z'] - box2['z'],
  };
}
function scaleVector(x4, data) {
  return { x: x4['x'] * data, y: x4['y'] * data, z: x4['z'] * data };
}
function dot(box3, box4) {
  return box3['x'] * box4['x'] + box3['y'] * box4['y'] + box3['z'] * box4['z'];
}
function cross(x5, box5) {
  return {
    x: x5['y'] * box5['z'] - x5['z'] * box5['y'],
    y: x5['z'] * box5['x'] - x5['x'] * box5['z'],
    z: x5['x'] * box5['y'] - x5['y'] * box5['x'],
  };
}
function vectorLength(box6) {
  return Math['hypot'](box6['x'], box6['y'], box6['z']);
}
function normalizeVector(options) {
  const vectorLength2 = vectorLength(options);
  return vectorLength2 > EPSILON ? scaleVector(options, 0x1 / vectorLength2) : null;
}
function midpoint(target, source) {
  return scaleVector(add(target, source), 0.5);
}
function segmentDirection(next, current) {
  return next && current ? normalizeVector(subtract(current, next)) : null;
}
function normalizeQuaternion(list) {
  if (!Array['isArray'](list) || list['length'] !== 0x4) return null;
  const list2 = list['map'](finiteNumber);
  if (list2['some']((entry) => entry === null)) return null;
  const record = Math['hypot'](...list2);
  if (record <= EPSILON) return null;
  const list3 = list2['map']((payload) => payload / record);
  return list3[0x3] < 0x0 ? list3['map']((handle) => -handle) : list3;
}
function multiplyQuaternions(state, config) {
  const [scope, input, output, value2] = state,
    [value3, value4, value5, value6] = config;
  return normalizeQuaternion([
    value2 * value3 + scope * value6 + input * value5 - output * value4,
    value2 * value4 - scope * value5 + input * value6 + output * value3,
    value2 * value5 + scope * value4 - input * value3 + output * value6,
    value2 * value6 - scope * value3 - input * value4 - output * value5,
  ]);
}
function invertQuaternion(value7) {
  return [-value7[0x0], -value7[0x1], -value7[0x2], value7[0x3]];
}
function rotateVectorByQuaternion(value8, value9) {
  const [x6, y2, z2, value10] = value9,
    value11 = { x: x6, y: y2, z: z2 },
    cross2 = cross(value11, value8),
    cross3 = cross(value11, cross2);
  return add(value8, add(scaleVector(cross2, 0x2 * value10), scaleVector(cross3, 0x2)));
}
function quaternionFromTo(value12, value13) {
  const vector = normalizeVector(value12),
    vector2 = normalizeVector(value13);
  if (!vector || !vector2) return null;
  const clamp2 = clamp(dot(vector, vector2), -0x1, 0x1);
  if (clamp2 > 0x1 - EPSILON) return [...IDENTITY_QUATERNION];
  if (clamp2 < -0x1 + EPSILON) {
    const cross4 = cross(vector, { x: 0x1, y: 0x0, z: 0x0 }),
      cross5 = cross(vector, { x: 0x0, y: 0x0, z: 0x1 }),
      box7 = normalizeVector(vectorLength(cross4) > vectorLength(cross5) ? cross4 : cross5);
    return box7 ? [box7['x'], box7['y'], box7['z'], 0x0] : null;
  }
  const box8 = cross(vector, vector2),
    value14 = Math['sqrt']((0x1 + clamp2) * 0x2);
  return normalizeQuaternion([box8['x'] / value14, box8['y'] / value14, box8['z'] / value14, value14 / 0x2]);
}
function quaternionFromBasis(box9, box10, box11) {
  const value15 = box9['x'],
    value16 = box10['x'],
    value17 = box11['x'],
    value18 = box9['y'],
    value19 = box10['y'],
    value20 = box11['y'],
    value21 = box9['z'],
    value22 = box10['z'],
    value23 = box11['z'],
    count = value15 + value19 + value23;
  let value24;
  if (count > 0x0) {
    const value25 = 0.5 / Math['sqrt'](count + 0x1);
    value24 = [
      (value22 - value20) * value25,
      (value17 - value21) * value25,
      (value18 - value16) * value25,
      0.25 / value25,
    ];
  } else {
    if (value15 > value19 && value15 > value23) {
      const value26 = 0x2 * Math['sqrt'](0x1 + value15 - value19 - value23);
      value24 = [
        0.25 * value26,
        (value16 + value18) / value26,
        (value17 + value21) / value26,
        (value22 - value20) / value26,
      ];
    } else {
      if (value19 > value23) {
        const value27 = 0x2 * Math['sqrt'](0x1 + value19 - value15 - value23);
        value24 = [
          (value16 + value18) / value27,
          0.25 * value27,
          (value20 + value22) / value27,
          (value17 - value21) / value27,
        ];
      } else {
        const value28 = 0x2 * Math['sqrt'](0x1 + value23 - value15 - value19);
        value24 = [
          (value17 + value21) / value28,
          (value20 + value22) / value28,
          0.25 * value28,
          (value18 - value16) / value28,
        ];
      }
    }
  }
  return normalizeQuaternion(value24);
}
function frameQuaternion(value29, value30) {
  const vector3 = normalizeVector(value30);
  if (!vector3) return null;
  const subtract2 = subtract(value29, scaleVector(vector3, dot(value29, vector3))),
    vector4 = normalizeVector(subtract2);
  if (!vector4) return null;
  const vector5 = normalizeVector(cross(vector4, vector3));
  if (!vector5) return null;
  const vector6 = normalizeVector(cross(vector3, vector5));
  return vector6 ? quaternionFromBasis(vector6, vector3, vector5) : null;
}
function quaternionFraction(value31, value32) {
  const list4 = normalizeQuaternion(value31);
  if (!list4) return null;
  const clamp3 = clamp(list4[0x3], -0x1, 0x1),
    value33 = 0x2 * Math['acos'](clamp3);
  if (value33 <= EPSILON) return [...IDENTITY_QUATERNION];
  const value34 = Math['sin'](value33 / 0x2);
  if (Math['abs'](value34) <= EPSILON) return [...IDENTITY_QUATERNION];
  const value35 = list4['slice'](0x0, 0x3)['map']((value36) => value36 / value34),
    value37 = (value33 * clamp(value32, 0x0, 0x1)) / 0x2,
    value38 = Math['sin'](value37);
  return normalizeQuaternion([
    value35[0x0] * value38,
    value35[0x1] * value38,
    value35[0x2] * value38,
    Math['cos'](value37),
  ]);
}
function clampQuaternionAngle(value39, value40) {
  const quaternion = normalizeQuaternion(value39);
  if (!quaternion) return null;
  const value41 = 0x2 * Math['acos'](clamp(quaternion[0x3], -0x1, 0x1));
  if (!Number['isFinite'](value40) || value41 <= value40) return quaternion;
  return quaternionFraction(quaternion, value40 / Math['max'](EPSILON, value41));
}
function toStoryboard3DRigQuaternion(value42) {
  const quaternion2 = normalizeQuaternion(value42);
  if (!quaternion2) return null;
  return normalizeQuaternion([quaternion2[0x0], -quaternion2[0x1], -quaternion2[0x2], quaternion2[0x3]]);
}
function unwrapLandmarks(value43) {
  let list5 =
    value43?.['worldLandmarks'] ?? value43?.['poseWorldLandmarks'] ?? value43?.['landmarks'] ?? value43;
  if (Array['isArray'](list5?.[0x0])) list5 = list5[0x0];
  return Array['isArray'](list5) && list5['length'] >= 0x21 ? list5 : null;
}
function landmarkVisibility(enabled) {
  if (!enabled || typeof enabled !== 'object') return 0x0;
  const finiteNumber2 = finiteNumber(enabled['visibility']),
    finiteNumber3 = finiteNumber(enabled['presence']);
  if (finiteNumber2 !== null && finiteNumber3 !== null)
    return clamp(Math['min'](finiteNumber2, finiteNumber3), 0x0, 0x1);
  if (finiteNumber2 !== null) return clamp(finiteNumber2, 0x0, 0x1);
  if (finiteNumber3 !== null) return clamp(finiteNumber3, 0x0, 0x1);
  return 0x1;
}
function convertLandmark(box12, { mirrorX: mirrorX2, invertY: invertY2, invertZ: invertZ2 }) {
  const finiteNumber4 = finiteNumber(box12?.['x']),
    finiteNumber5 = finiteNumber(box12?.['y']),
    finiteNumber6 = finiteNumber(box12?.['z']);
  if (finiteNumber4 === null || finiteNumber5 === null || finiteNumber6 === null) return null;
  return {
    x: mirrorX2 ? -finiteNumber4 : finiteNumber4,
    y: invertY2 ? -finiteNumber5 : finiteNumber5,
    z: invertZ2 ? -finiteNumber6 : finiteNumber6,
    visibility: landmarkVisibility(box12),
  };
}
function normalizationScale(value44) {
  const {
      leftShoulder: leftShoulder,
      rightShoulder: rightShoulder,
      leftHip: leftHip,
      rightHip: rightHip,
    } = MEDIAPIPE_POSE_LANDMARK_INDEX,
    value45 =
      value44[leftShoulder] && value44[rightShoulder]
        ? midpoint(value44[leftShoulder], value44[rightShoulder])
        : null,
    origin = value44[leftHip] && value44[rightHip] ? midpoint(value44[leftHip], value44[rightHip]) : null,
    scale = value45 && origin ? vectorLength(subtract(value45, origin)) : 0x0;
  if (scale > EPSILON) return { origin: origin, scale: scale };
  const list6 = [
      value44[leftShoulder] && value44[rightShoulder]
        ? vectorLength(subtract(value44[leftShoulder], value44[rightShoulder]))
        : 0x0,
      value44[leftHip] && value44[rightHip]
        ? vectorLength(subtract(value44[leftHip], value44[rightHip]))
        : 0x0,
    ]['filter']((value46) => value46 > EPSILON),
    scale2 =
      list6['length'] > 0x0
        ? list6['reduce']((value47, value48) => value47 + value48, 0x0) / list6['length']
        : 0x0;
  return scale2 > EPSILON ? { origin: origin || { x: 0x0, y: 0x0, z: 0x0 }, scale: scale2 } : null;
}
function normalizeLandmarks(list7, value49) {
  const list8 = list7['map']((value50) => convertLandmark(value50, value49)),
    box13 = normalizationScale(list8);
  if (!box13) return null;
  return list8['map'](
    (visibility2) =>
      visibility2 && {
        ...scaleVector(subtract(visibility2, box13['origin']), 0x1 / box13['scale']),
        visibility: visibility2['visibility'],
      },
  );
}
function confidenceFor(value51, value52) {
  const list9 = [...new Set(value52)]['map']((value53) => value51[value53]?.['visibility'] ?? 0x0);
  return list9['length'] > 0x0 ? Math['min'](...list9) : 0x0;
}
function average(list10) {
  return list10['length'] > 0x0
    ? list10['reduce']((value54, value55) => value54 + value55, 0x0) / list10['length']
    : 0x0;
}
function handTarget(value56, value57) {
  const value58 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    value59 = value56[value58[value57 + 'Wrist']],
    value60 = value56[value58[value57 + 'Pinky']],
    value61 = value56[value58[value57 + 'Index']];
  return value59 && value60 && value61 ? segmentDirection(value59, midpoint(value60, value61)) : null;
}
function retargetArm(value62, value63, value64) {
  const value65 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    value66 = value62[value65[value63 + 'Shoulder']],
    value67 = value62[value65[value63 + 'Elbow']],
    value68 = value62[value65[value63 + 'Wrist']],
    invertQuaternion2 = invertQuaternion(value64),
    segmentDirection2 = segmentDirection(value66, value67),
    segmentDirection3 = segmentDirection(value67, value68),
    handTarget2 = handTarget(value62, value63);
  if (!segmentDirection2 || !segmentDirection3) return null;
  const value69 = ARM_REST_DIRECTION[value63],
    rotateVectorByQuaternion2 = rotateVectorByQuaternion(segmentDirection2, invertQuaternion2),
    rotateVectorByQuaternion3 = rotateVectorByQuaternion(segmentDirection3, invertQuaternion2),
    upper = quaternionFromTo(value69, rotateVectorByQuaternion2),
    quaternionFromTo2 = quaternionFromTo(value69, rotateVectorByQuaternion3);
  if (!upper || !quaternionFromTo2) return null;
  const lower = multiplyQuaternions(invertQuaternion(upper), quaternionFromTo2);
  let hand = null;
  if (handTarget2) {
    const rotateVectorByQuaternion4 = rotateVectorByQuaternion(handTarget2, invertQuaternion2),
      quaternionFromTo3 = quaternionFromTo(value69, rotateVectorByQuaternion4);
    hand = quaternionFromTo3
      ? multiplyQuaternions(invertQuaternion(quaternionFromTo2), quaternionFromTo3)
      : null;
  }
  return { upper: upper, lower: lower, hand: hand };
}
function retargetLeg(value70, value71, value72) {
  const value73 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    value74 = value70[value73[value71 + 'Hip']],
    value75 = value70[value73[value71 + 'Knee']],
    value76 = value70[value73[value71 + 'Ankle']],
    value77 = value70[value73[value71 + 'FootIndex']],
    invertQuaternion3 = invertQuaternion(value72),
    segmentDirection4 = segmentDirection(value74, value75),
    segmentDirection5 = segmentDirection(value75, value76);
  if (!segmentDirection4 || !segmentDirection5) return null;
  const rotateVectorByQuaternion5 = rotateVectorByQuaternion(segmentDirection4, invertQuaternion3),
    rotateVectorByQuaternion6 = rotateVectorByQuaternion(segmentDirection5, invertQuaternion3),
    thigh = quaternionFromTo(LEG_REST_DIRECTION, rotateVectorByQuaternion5),
    quaternionFromTo4 = quaternionFromTo(LEG_REST_DIRECTION, rotateVectorByQuaternion6);
  if (!thigh || !quaternionFromTo4) return null;
  const calf = multiplyQuaternions(invertQuaternion(thigh), quaternionFromTo4);
  let foot = null;
  const segmentDirection6 = segmentDirection(value76, value77);
  if (segmentDirection6) {
    const rotateVectorByQuaternion7 = rotateVectorByQuaternion(segmentDirection6, invertQuaternion3),
      quaternionFromTo5 = quaternionFromTo(WORLD_FORWARD, rotateVectorByQuaternion7);
    foot = quaternionFromTo5
      ? multiplyQuaternions(invertQuaternion(quaternionFromTo4), quaternionFromTo5)
      : null;
  }
  return { thigh: thigh, calf: calf, foot: foot };
}
function buildBodyFrames(value78) {
  const value79 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    enabled2 = value78[value79['leftShoulder']],
    enabled3 = value78[value79['rightShoulder']],
    enabled4 = value78[value79['leftHip']],
    enabled5 = value78[value79['rightHip']];
  if (!enabled2 || !enabled3 || !enabled4 || !enabled5) return null;
  const shoulderMid = midpoint(enabled2, enabled3),
    midpoint2 = midpoint(enabled4, enabled5),
    subtract3 = subtract(shoulderMid, midpoint2),
    pelvisQuaternion = frameQuaternion(subtract(enabled5, enabled4), WORLD_UP),
    torsoQuaternion = frameQuaternion(subtract(enabled3, enabled2), subtract3);
  if (!pelvisQuaternion || !torsoQuaternion) return null;
  return {
    shoulderMid: shoulderMid,
    pelvisQuaternion: pelvisQuaternion,
    torsoQuaternion: torsoQuaternion,
    spineQuaternion: multiplyQuaternions(invertQuaternion(pelvisQuaternion), torsoQuaternion),
  };
}
function warning(code, message, args = {}) {
  return { code: code, message: message, ...args };
}
export function retargetMediaPipePoseToStoryboard3D(
  value80,
  {
    minVisibility: minVisibility = DEFAULT_IMAGE_POSE_MIN_VISIBILITY,
    mirrorX: mirrorX = !![],
    invertY: invertY = !![],
    invertZ: invertZ = !![],
  } = {},
) {
  const unwrapLandmarks2 = unwrapLandmarks(value80);
  if (!unwrapLandmarks2)
    return {
      boneOverrides: {},
      confidence: 0x0,
      boneConfidence: {},
      warnings: [
        warning('POSE_LANDMARKS_INVALID', 'MediaPipe pose retargeting requires at least 33 world landmarks.'),
      ],
    };
  const landmarks = normalizeLandmarks(unwrapLandmarks2, {
    mirrorX: mirrorX !== ![],
    invertY: invertY !== ![],
    invertZ: invertZ !== ![],
  });
  if (!landmarks)
    return {
      boneOverrides: {},
      confidence: 0x0,
      boneConfidence: {},
      warnings: [
        warning('POSE_SCALE_UNAVAILABLE', 'Pose landmarks do not contain a usable torso or body scale.'),
      ],
    };
  const threshold = clamp(minVisibility, 0x0, 0x1),
    value81 = MEDIAPIPE_POSE_LANDMARK_INDEX,
    boneOverrides = {},
    boneConfidence = {},
    bones = [],
    bones2 = [],
    handler = (value82, value83, handler2) => {
      const confidenceFor2 = confidenceFor(landmarks, value83);
      boneConfidence[value82] = confidenceFor2;
      if (confidenceFor2 < threshold) {
        bones['push'](value82);
        return;
      }
      const value84 = handler2(),
        clampQuaternionAngle2 = clampQuaternionAngle(value84, BONE_ANGLE_LIMITS[value82]);
      if (!clampQuaternionAngle2) {
        bones2['push'](value82);
        return;
      }
      boneOverrides[value82] = toStoryboard3DRigQuaternion(clampQuaternionAngle2);
    },
    args2 = [value81['leftShoulder'], value81['rightShoulder'], value81['leftHip'], value81['rightHip']],
    bodyFrames = buildBodyFrames(landmarks);
  handler('pelvis', [value81['leftHip'], value81['rightHip']], () => bodyFrames?.['pelvisQuaternion']);
  const value85 = bodyFrames?.['spineQuaternion']
    ? quaternionFraction(bodyFrames['spineQuaternion'], 0x1 / 0x3)
    : null;
  for (const value86 of ['spine_01', 'spine_02', 'spine_03']) {
    handler(value86, args2, () => value85);
  }
  const args3 = [...args2, value81['leftEar'], value81['rightEar']];
  let quaternionFromTo6 = null;
  (handler('neck_01', args3, () => {
    if (!bodyFrames) return null;
    const midpoint3 = midpoint(landmarks[value81['leftEar']], landmarks[value81['rightEar']]),
      segmentDirection7 = segmentDirection(bodyFrames['shoulderMid'], midpoint3);
    if (!segmentDirection7) return null;
    const rotateVectorByQuaternion8 = rotateVectorByQuaternion(
      segmentDirection7,
      invertQuaternion(bodyFrames['torsoQuaternion']),
    );
    return ((quaternionFromTo6 = quaternionFromTo(WORLD_UP, rotateVectorByQuaternion8)), quaternionFromTo6);
  }),
    handler('Head', [...args3, value81['nose']], () => {
      if (!bodyFrames || !quaternionFromTo6) return null;
      const midpoint4 = midpoint(landmarks[value81['leftEar']], landmarks[value81['rightEar']]),
        segmentDirection8 = segmentDirection(midpoint4, landmarks[value81['nose']]);
      if (!segmentDirection8) return null;
      const rotateVectorByQuaternion9 = rotateVectorByQuaternion(
          segmentDirection8,
          invertQuaternion(bodyFrames['torsoQuaternion']),
        ),
        quaternionFromTo7 = quaternionFromTo(WORLD_FORWARD, rotateVectorByQuaternion9);
      return quaternionFromTo7
        ? multiplyQuaternions(invertQuaternion(quaternionFromTo6), quaternionFromTo7)
        : null;
    }));
  for (const value87 of ['left', 'right']) {
    const value88 = value87 === 'left' ? 'l' : 'r',
      args4 = [...args2, value81[value87 + 'Elbow'], value81[value87 + 'Wrist']];
    let retargetArm2 = null;
    const run = () => {
      if (!retargetArm2 && bodyFrames)
        retargetArm2 = retargetArm(landmarks, value87, bodyFrames['torsoQuaternion']);
      return retargetArm2;
    };
    (handler('upperarm_' + value88, [...args2, value81[value87 + 'Elbow']], () => run()?.['upper']),
      handler('lowerarm_' + value88, args4, () => run()?.['lower']),
      handler(
        'hand_' + value88,
        [...args4, value81[value87 + 'Pinky'], value81[value87 + 'Index']],
        () => run()?.['hand'],
      ));
    const args5 = [
      value81['leftHip'],
      value81['rightHip'],
      value81[value87 + 'Knee'],
      value81[value87 + 'Ankle'],
    ];
    let retargetLeg2 = null;
    const run2 = () => {
      if (!retargetLeg2 && bodyFrames)
        retargetLeg2 = retargetLeg(landmarks, value87, bodyFrames['pelvisQuaternion']);
      return retargetLeg2;
    };
    (handler(
      'thigh_' + value88,
      [value81['leftHip'], value81['rightHip'], value81[value87 + 'Knee']],
      () => run2()?.['thigh'],
    ),
      handler('calf_' + value88, args5, () => run2()?.['calf']),
      handler('foot_' + value88, [...args5, value81[value87 + 'FootIndex']], () => run2()?.['foot']));
  }
  const warnings = [];
  return (
    bones['length'] > 0x0 &&
      warnings['push'](
        warning(
          'LOW_CONFIDENCE_BONES_SKIPPED',
          'Low-visibility\x20landmarks\x20were\x20not\x20applied\x20to\x20the\x20affected\x20character\x20bones.',
          { bones: bones, threshold: threshold },
        ),
      ),
    bones2['length'] > 0x0 &&
      warnings['push'](
        warning(
          'DEGENERATE_POSE_SEGMENTS_SKIPPED',
          'Zero-length\x20or\x20ambiguous\x20pose\x20segments\x20were\x20not\x20applied.',
          { bones: bones2 },
        ),
      ),
    {
      boneOverrides: boneOverrides,
      confidence: average(Object['values'](boneConfidence)),
      boneConfidence: boneConfidence,
      warnings: warnings,
    }
  );
}
