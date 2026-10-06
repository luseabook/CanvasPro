import { deriveStoryboard3DCameraOptics } from './cameraShotSystem.js';
const DEFAULT_SIZE = Object.freeze({ character: [0.65, 1.8, 0.5], prop: [1, 1, 1] }),
  SHOT_PROFILES = Object.freeze([
    { shotSize: 'EST', distanceScale: 4.2, focalLength: 28 },
    { shotSize: 'ELS', distanceScale: 3.3, focalLength: 35 },
    { shotSize: 'LS', distanceScale: 2.6, focalLength: 35 },
    { shotSize: 'MLS', distanceScale: 2.1, focalLength: 50 },
    { shotSize: 'MED', distanceScale: 1.65, focalLength: 50 },
    { shotSize: 'MCU', distanceScale: 1.3, focalLength: 65 },
    { shotSize: 'CU', distanceScale: 1.05, focalLength: 0x55 },
    { shotSize: 'ECU', distanceScale: 0.82, focalLength: 100 },
  ]),
  AZIMUTH_SAMPLES = Object.freeze([0, -45, 45, -90, 90, -135, 135, 180]),
  ELEVATION_SAMPLES = Object.freeze([0, 18, -12, 35]);
function finite(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clamp(index, result, data) {
  return Math.min(data, Math.max(result, index));
}
function vector3(box, options = [0, 0, 0]) {
  if (Array.isArray(box))
    return [finite(box[0], options[0]), finite(box[1], options[1]), finite(box[2], options[2])];
  return [
    finite(box?.x, options[0]),
    finite(box?.y, options[1]),
    finite(box?.z, options[2]),
  ];
}
function add3(target, source) {
  return [target[0] + source[0], target[1] + source[1], target[2] + source[2]];
}
function subtract3(next, current) {
  return [next[0] - current[0], next[1] - current[1], next[2] - current[2]];
}
function scale3(entry, record) {
  return entry.map((payload) => payload * record);
}
function dot3(handle, state) {
  return handle[0] * state[0] + handle[1] * state[1] + handle[2] * state[2];
}
function cross3(config, scope) {
  return [
    config[1] * scope[2] - config[2] * scope[1],
    config[2] * scope[0] - config[0] * scope[2],
    config[0] * scope[1] - config[1] * scope[0],
  ];
}
function length3(input) {
  return Math.hypot(input[0], input[1], input[2]);
}
function normalize3(output, args = [0, 0, 1]) {
  const length32 = length3(output);
  return length32 > 1e-8 ? scale3(output, 1 / length32) : [...args];
}
function degreesToRadians(value2) {
  return (value2 * Math.PI) / 180;
}
function boundsFromMinMax(value3, value4) {
  return {
    min: value3,
    max: value4,
    center: value3.map((value5, value6) => (value5 + value4[value6]) / 2),
    size: value4.map((value7, value8) => value7 - value3[value8]),
  };
}
function mergeBounds(args2) {
  if (args2.length === 0) return null;
  const value9 = [...args2[0].min],
    value10 = [...args2[0].max];
  return (
    args2.slice(1).forEach((value11) => {
      for (let count2 = 0; count2 < 3; count2 += 1) {
        ((value9[count2] = Math.min(value9[count2], value11.min[count2])),
          (value10[count2] = Math.max(value10[count2], value11.max[count2])));
      }
    }),
    boundsFromMinMax(value9, value10)
  );
}
function objectBounds(value12) {
  const vector32 = vector3(value12?.transform?.position),
    vector33 = vector3(value12?.transform?.scale, [1, 1, 1]).map(Math.abs),
    value13 = value12?.worldBounds?.min,
    value14 = value12?.worldBounds?.max;
  if (value13 && value14) {
    const vector34 = vector3(value13),
      vector35 = vector3(value14);
    return boundsFromMinMax(
      vector34.map((value15, value16) => Math.min(value15, vector35[value16])),
      vector35.map((value17, value18) => Math.max(value17, vector34[value18])),
    );
  }
  const vector36 = vector3(
      value12?.dimensions || value12?.bounds?.size,
      DEFAULT_SIZE[value12?.type] || DEFAULT_SIZE.prop,
    ),
    value19 = vector36.map((value20, value21) =>
      Math.max(0.01, Math.abs(value20 * vector33[value21])),
    ),
    scale32 = scale3(value19, 0.5);
  return boundsFromMinMax(subtract3(vector32, scale32), add3(vector32, scale32));
}
function boundsCorners(value22) {
  const list = [];
  for (const value23 of [value22.min[0], value22.max[0]]) {
    for (const value24 of [value22.min[1], value22.max[1]]) {
      for (const value25 of [value22.min[2], value22.max[2]])
        list.push([value23, value24, value25]);
    }
  }
  return list;
}
function cameraBasis(value26) {
  const vector37 = vector3(value26.position),
    vector38 = vector3(value26.target, [0, 1.2, 0]),
    v3 = normalize3(subtract3(vector38, vector37), [0, 0, -1]),
    value27 = Math.abs(v3[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0],
    v32 = normalize3(cross3(v3, value27), [1, 0, 0]),
    v33 = normalize3(cross3(v32, v3), [0, 1, 0]);
  return { position: vector37, forward: v3, right: v32, up: v33 };
}
function projectPoint(value28, value29) {
  const cameraBasis2 = cameraBasis(value29),
    subtract32 = subtract3(value28, cameraBasis2.position),
    dot32 = dot3(subtract32, cameraBasis2.forward);
  if (dot32 <= Math.max(0.001, finite(value29.near, 0.1))) return null;
  const storyboard3DCameraOptics = deriveStoryboard3DCameraOptics(value29),
    value30 = Math.tan(degreesToRadians(storyboard3DCameraOptics.verticalFov) / 2),
    value31 = Math.tan(degreesToRadians(storyboard3DCameraOptics.horizontalFov) / 2);
  return {
    x: dot3(subtract32, cameraBasis2.right) / (dot32 * value31),
    y: dot3(subtract32, cameraBasis2.up) / (dot32 * value30),
    depth: dot32,
  };
}
function segmentIntersectsBounds(value32, value33, value34) {
  const subtract33 = subtract3(value33, value32);
  let count3 = 0,
    value35 = 1;
  for (let count4 = 0; count4 < 3; count4 += 1) {
    if (Math.abs(subtract33[count4]) < 1e-8) {
      if (value32[count4] < value34.min[count4] || value32[count4] > value34.max[count4]) return false;
      continue;
    }
    const value36 = 1 / subtract33[count4];
    let value37 = (value34.min[count4] - value32[count4]) * value36,
      value38 = (value34.max[count4] - value32[count4]) * value36;
    if (value37 > value38) [value37, value38] = [value38, value37];
    ((count3 = Math.max(count3, value37)), (value35 = Math.min(value35, value38)));
    if (count3 > value35) return false;
  }
  return count3 > 0.001 && count3 < 0.98;
}
function resolveShotAngle(value39, count5, value40) {
  if (value40) return 'overShoulder';
  if (count5 >= 32) return 'top';
  if (count5 >= 14) return 'high';
  if (count5 <= -8) return 'low';
  const count6 = Math.abs(value39);
  if (count6 >= 150) return 'rear';
  if (count6 >= 70 && count6 <= 110) return 'profile';
  return 'eye';
}
function candidateSimilarity(value41, value42) {
  const vector39 = vector3(value41.camera.position),
    vector310 = vector3(value42.camera.position),
    vector311 = vector3(value41.camera.target),
    v34 = normalize3(subtract3(vector39, vector311)),
    v35 = normalize3(subtract3(vector310, vector311)),
    value43 = (clamp(dot3(v34, v35), -1, 1) + 1) / 2,
    value44 = Math.abs(value41.camera.focalLength - value42.camera.focalLength),
    value45 = 1 - clamp(value44 / 100, 0, 1),
    value46 = value41.shotSize === value42.shotSize ? 1 : 0;
  return value43 * 0.58 + value45 * 0.27 + value46 * 0.15;
}
export function identifyStoryboard3DSubjects(value47, { subjectIds: subjectIds } = {}) {
  const value48 = (Array.isArray(value47?.objects) ? value47.objects : []).filter(
      (value49) =>
        value49?.visible !== false && !['light', 'camera', 'group'].includes(value49?.type),
    ),
    value50 = new Set((Array.isArray(subjectIds) ? subjectIds : []).map(String)),
    value51 =
      value50.size > 0 ? value48.filter((value52) => value50.has(String(value52.id))) : [],
    value53 = value48.filter((value54) => value54.type === 'character'),
    value55 = value51.length > 0 ? value51 : value53.length > 0 ? value53 : value48;
  return value55.map((value56) => ({
    id: String(value56.id || ''),
    type: value56.type,
    bounds: objectBounds(value56),
  }));
}
export function computeStoryboard3DSubjectBounds(value57, value58 = {}) {
  const list2 = identifyStoryboard3DSubjects(value57, value58),
    args3 = mergeBounds(list2.map((value59) => value59.bounds));
  return args3 ? { ...args3, subjectIds: list2.map((value60) => value60.id) } : null;
}
export function evaluateStoryboard3DFraming(value61, enabled) {
  if (!enabled) return { outOfFrameRatio: 1, headroom: 0, centerOffset: 1, projectedBounds: null };
  const list3 = boundsCorners(enabled)
    .map((value62) => projectPoint(value62, value61))
    .filter(Boolean);
  if (list3.length === 0)
    return { outOfFrameRatio: 1, headroom: 0, centerOffset: 1, projectedBounds: null };
  const value63 = Math.min(...list3.map((box2) => box2.x)),
    value64 = Math.max(...list3.map((box3) => box3.x)),
    value65 = Math.min(...list3.map((box4) => box4.y)),
    value66 = Math.max(...list3.map((box5) => box5.y)),
    value67 = list3.filter((box6) => Math.abs(box6.x) > 1 || Math.abs(box6.y) > 1).length,
    value68 = (value63 + value64) / 2,
    value69 = (value65 + value66) / 2;
  return {
    outOfFrameRatio: value67 / list3.length,
    headroom: 1 - value66,
    centerOffset: Math.hypot(value68, value69),
    projectedBounds: { minX: value63, maxX: value64, minY: value65, maxY: value66 },
  };
}
export function estimateStoryboard3DOcclusion(value70, value71, list4 = []) {
  if (!Array.isArray(value71) || value71.length === 0) return 1;
  const vector312 = vector3(value70?.position);
  let value72 = 0;
  return (
    value71.forEach((value73) => {
      const value74 = value73.bounds.center,
        value75 = list4.some(
          (value76) =>
            value76.id !== value73.id && segmentIntersectsBounds(vector312, value74, value76.bounds),
        );
      if (value75) value72 += 1;
    }),
    value72 / value71.length
  );
}
export function scoreStoryboard3DShotCandidate(
  value77,
  { framing: framing, occlusionRatio: occlusionRatio = 0 } = {},
) {
  const args4 = framing || evaluateStoryboard3DFraming(value77.camera, value77.subjectBounds),
    count7 = 1 - clamp(args4.outOfFrameRatio, 0, 1),
    count8 = 1 - clamp(Math.abs(args4.headroom - 0.12) / 0.7, 0, 1),
    count9 = 1 - clamp(args4.centerOffset / 1.2, 0, 1),
    count10 = 1 - clamp(occlusionRatio, 0, 1),
    value78 =
      Math.round(clamp(count7 * 0.43 + count10 * 0.28 + count8 * 0.17 + count9 * 0.12, 0, 1) * 1000) /
      1000,
    list5 = [];
  if (count7 >= 0.9) list5.push('subjects-in-frame');
  else {
    if (count7 < 0.5) list5.push('subjects-out-of-frame');
  }
  if (count10 >= 0.9) list5.push('low-occlusion');
  else {
    if (count10 < 0.6) list5.push('high-occlusion');
  }
  if (count8 >= 0.75) list5.push('balanced-headroom');
  if (count9 >= 0.78) list5.push('balanced-composition');
  return { score: value78, reasons: list5, metrics: { ...args4, occlusionRatio: occlusionRatio } };
}
export function deduplicateStoryboard3DShotCandidates(
  value79,
  { similarityThreshold: similarityThreshold = 0.91 } = {},
) {
  const list6 = [...(Array.isArray(value79) ? value79 : [])].sort(
      (value80, value81) =>
        value81.score - value80.score || String(value80.id).localeCompare(String(value81.id)),
    ),
    enabled2 = [];
  return (
    list6.forEach((value82) => {
      !enabled2.some((value83) => candidateSimilarity(value82, value83) >= similarityThreshold) &&
        enabled2.push(value82);
    }),
    enabled2
  );
}
export function selectDiverseStoryboard3DShotCandidates(value84, value85 = 9) {
  const list7 = [...(Array.isArray(value84) ? value84 : [])],
    list8 = [],
    value86 = Math.max(0, Math.round(finite(value85, 9)));
  while (list8.length < value86 && list7.length > 0) {
    let value87 = 0,
      value88 = -Infinity;
    (list7.forEach((value89, value90) => {
      const value91 =
          list8.length === 0
            ? 0
            : Math.max(...list8.map((value92) => candidateSimilarity(value89, value92))),
        value93 = 1 - value91,
        value94 = value89.score * 0.72 + value93 * 0.28;
      (value94 > value88 || (value94 === value88 && String(value89.id) < String(list7[value87].id))) &&
        ((value87 = value90), (value88 = value94));
    }),
      list8.push(list7.splice(value87, 1)[0]));
  }
  return list8;
}
export function generateStoryboard3DShotCandidates(
  value95,
  { count: count = 9, subjectIds: subjectIds2, shotSizes: shotSizes, variation: variation = 0 } = {},
) {
  const list9 = identifyStoryboard3DSubjects(value95, { subjectIds: subjectIds2 }),
    args5 = mergeBounds(list9.map((value96) => value96.bounds));
  if (!args5) return [];
  const value97 = (Array.isArray(value95?.objects) ? value95.objects : [])
      .filter(
        (value98) =>
          value98?.visible !== false && !['light', 'camera', 'group'].includes(value98?.type),
      )
      .map((value99) => ({ id: String(value99.id || ''), bounds: objectBounds(value99) })),
    value100 = new Set(
      Array.isArray(shotSizes) && shotSizes.length > 0
        ? shotSizes
        : SHOT_PROFILES.map((value101) => value101.shotSize),
    ),
    value102 = Math.max(1, args5.size[0], args5.size[1], args5.size[2]),
    value103 = Math.round(finite(variation, 0)) * 7,
    value104 = [];
  let value105 = 0;
  SHOT_PROFILES.filter((value106) => value100.has(value106.shotSize)).forEach(
    (value107, value108) => {
      AZIMUTH_SAMPLES.forEach((value109, value110) => {
        const value111 =
            ELEVATION_SAMPLES[(value108 + value110 + Math.abs(value103)) % ELEVATION_SAMPLES.length],
          value112 = value109 + value103,
          radians = degreesToRadians(value112),
          radians2 = degreesToRadians(value111),
          value113 = value102 * value107.distanceScale * (1 + ((value108 + value110) % 3) * 0.08),
          value114 = value113 * Math.cos(radians2),
          value115 = [
            args5.center[0] + Math.sin(radians) * value114,
            args5.center[1] + Math.sin(radians2) * value113,
            args5.center[2] + Math.cos(radians) * value114,
          ],
          value116 = [...args5.center],
          value117 = {
            position: value115,
            target: value116,
            focalLength: value107.focalLength,
            near: 0.1,
            far: Math.max(1000, value113 * 20),
            aspectRatio: '16:9',
          },
          evaluateStoryboard3DFraming2 = evaluateStoryboard3DFraming(value117, args5),
          estimateStoryboard3DOcclusion2 = estimateStoryboard3DOcclusion(value117, list9, value97),
          value118 =
            list9.length >= 2 &&
            Math.abs(value112) >= 25 &&
            Math.abs(value112) <= 60 &&
            value107.shotSize === 'MCU',
          scoreStoryboard3DShotCandidate2 = scoreStoryboard3DShotCandidate(
            { camera: value117, subjectBounds: args5 },
            { framing: evaluateStoryboard3DFraming2, occlusionRatio: estimateStoryboard3DOcclusion2 },
          );
        (value104.push({
          id: 'candidate-' + variation + '-' + value105,
          camera: value117,
          score: scoreStoryboard3DShotCandidate2.score,
          shotSize: value107.shotSize,
          shotAngle: resolveShotAngle(value112, value111, value118),
          reasons: scoreStoryboard3DShotCandidate2.reasons,
          metrics: scoreStoryboard3DShotCandidate2.metrics,
          subjectIds: list9.map((value119) => value119.id),
        }),
          (value105 += 1));
      });
    },
  );
  const deduplicateStoryboard3DShotCandidates2 = deduplicateStoryboard3DShotCandidates(value104);
  return selectDiverseStoryboard3DShotCandidates(deduplicateStoryboard3DShotCandidates2, count);
}
