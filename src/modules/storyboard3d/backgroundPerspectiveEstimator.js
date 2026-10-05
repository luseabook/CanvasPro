const DEFAULT_ANALYSIS_MAX_DIMENSION = 512;
function clamp(value, item, key) {
  return Math['max'](item, Math['min'](key, value));
}
function finite(index, result = 0) {
  const data = Number(index);
  return Number['isFinite'](data) ? data : result;
}
function luminance(options, target) {
  return options[target] * 0.2126 + options[target + 1] * 0.7152 + options[target + 2] * 0.0722;
}
function normalizedVerticalFov(source, next) {
  const current = (clamp(finite(source, 60), 10, 0xaa) * Math['PI']) / 180;
  return (2 * Math['atan'](Math['tan'](current / 2) / Math['max'](0.1, next)) * 180) / Math['PI'];
}
function collectRowFeatures(entry) {
  const { data: data2, width: width, height: height } = entry,
    means = new Float64Array(height),
    textures = new Float64Array(height),
    verticalEdges = new Float64Array(height);
  for (let count = 0; count < height; count += 1) {
    let record = 0,
      payload = 0,
      handle = 0,
      state = 0;
    for (let count2 = 0; count2 < width; count2 += 1) {
      const config = (count * width + count2) * 4,
        luminance2 = luminance(data2, config);
      record += luminance2;
      if (count2 > 0) payload += Math['abs'](luminance2 - state);
      (count > 0 && (handle += Math['abs'](luminance2 - luminance(data2, config - width * 4))),
        (state = luminance2));
    }
    ((means[count] = record / Math['max'](1, width)),
      (textures[count] = payload / Math['max'](1, width - 1)),
      (verticalEdges[count] = handle / Math['max'](1, width)));
  }
  return { means: means, textures: textures, verticalEdges: verticalEdges };
}
function windowMean(list, scope, input) {
  let output = 0,
    count3 = 0;
  for (let value2 = Math['max'](0, scope); value2 < Math['min'](list['length'], input); value2 += 1) {
    ((output += list[value2]), (count3 += 1));
  }
  return count3 > 0 ? output / count3 : 0;
}
function estimateHorizon(value3) {
  const { height: height2 } = value3,
    rowFeatures = collectRowFeatures(value3),
    value4 = Math['max'](2, Math['round'](height2 * 0.018)),
    value5 = Math['max'](value4, Math['round'](height2 * 0.16)),
    value6 = Math['min'](height2 - value4, Math['round'](height2 * 0.8)),
    list2 = [];
  for (let y = value5; y < value6; y += 1) {
    const value7 = Math['abs'](
        windowMean(rowFeatures['means'], y - value4, y) - windowMean(rowFeatures['means'], y, y + value4),
      ),
      value8 = Math['abs'](
        windowMean(rowFeatures['textures'], y - value4, y) -
          windowMean(rowFeatures['textures'], y, y + value4),
      ),
      value9 = y / height2,
      value10 = 0.62 + 0.38 * Math['exp'](-Math['pow']((value9 - 0.48) / 0.3, 2)),
      score = (value7 * 0.58 + value8 * 0.22 + rowFeatures['verticalEdges'][y] * 0.2) * value10;
    list2['push']({ y: y, score: score });
  }
  list2['sort']((value11, value12) => value12['score'] - value11['score']);
  const box = list2[0];
  if (!box || box['score'] < 0.5) return { horizonY: 0.5, confidence: 0.2 };
  const value13 = list2[Math['floor'](list2['length'] / 2)]?.['score'] || 0,
    value14 = box['score'] / Math['max'](0.1, value13);
  return {
    horizonY: clamp(box['y'] / height2, 0.12, 0.88),
    confidence: clamp(0.28 + (value14 - 1) * 0.12 + box['score'] / 220, 0.25, 0.82),
  };
}
function estimateVanishingPointX(value15, value16) {
  const { data: data3, width: width2, height: height3 } = value15,
    value17 = value16 * height3,
    value18 = 96,
    float64Array = new Float64Array(value18);
  let count4 = 0;
  for (
    let value19 = Math['max'](2, Math['round'](value17 + height3 * 0.025));
    value19 < height3 - 2;
    value19 += 2
  ) {
    for (let value20 = 2; value20 < width2 - 2; value20 += 2) {
      const value21 = (value19 * width2 + value20) * 4,
        luminance3 = luminance(data3, value21 + 4) - luminance(data3, value21 - 4),
        luminance4 = luminance(data3, value21 + width2 * 4) - luminance(data3, value21 - width2 * 4),
        count5 = Math['hypot'](luminance3, luminance4);
      if (count5 < 38 || Math['abs'](luminance3) < 0.00001) continue;
      const value22 = -luminance4 / luminance3,
        count6 = Math['abs'](value22);
      if (count6 < 0.08 || count6 > 3.5) continue;
      const value23 = value20 + (value17 - value19) * value22;
      if (value23 < -width2 * 0.35 || value23 > width2 * 1.35) continue;
      const clamp2 = clamp(value23 / width2, 0, 0.999999),
        value24 = Math['floor'](clamp2 * value18),
        value25 = Math['min'](0xff, count5);
      ((float64Array[value24] += value25), (count4 += value25));
    }
  }
  if (count4 <= 0) return { vanishingPointX: 0.5, confidence: 0.12 };
  const list3 = Array['from'](
    float64Array,
    (value26, value27) =>
      (float64Array[value27 - 1] || 0) * 0.25 +
      float64Array[value27] +
      (float64Array[value27 + 1] || 0) * 0.25,
  );
  let value28 = 0;
  for (let value29 = 1; value29 < list3['length']; value29 += 1) {
    if (list3[value29] > list3[value28]) value28 = value29;
  }
  const value30 = list3[value28] / Math['max'](1, count4);
  return {
    vanishingPointX: clamp((value28 + 0.5) / value18, 0.05, 0.95),
    confidence: clamp(value30 * 5, 0.12, 0.7),
  };
}
export function extractStoryboard3DFocalLength35mmFromExif(value31) {
  const list4 = value31 instanceof Uint8Array ? value31 : new Uint8Array(value31 || 0);
  if (list4['length'] < 16 || list4[0] !== 0xff || list4[1] !== 216) return null;
  const dataView = new DataView(list4['buffer'], list4['byteOffset'], list4['byteLength']);
  let value32 = 2;
  while (value32 + 4 <= list4['length']) {
    if (list4[value32] !== 0xff) break;
    const count7 = list4[value32 + 1];
    if (count7 === 218 || count7 === 217) break;
    const count8 = dataView['getUint16'](value32 + 2, false);
    if (count8 < 2 || value32 + 2 + count8 > list4['length']) break;
    if (
      count7 === 225 &&
      count8 >= 14 &&
      String['fromCharCode'](...list4['subarray'](value32 + 4, value32 + 10)) === 'Exif\x00\x00'
    ) {
      const value33 = value32 + 10,
        value34 = String['fromCharCode'](list4[value33], list4[value33 + 1]),
        enabled = value34 === 'II';
      if (!enabled && value34 !== 'MM') return null;
      const run = (value35) => dataView['getUint16'](value35, enabled),
        handler = (value36) => dataView['getUint32'](value36, enabled),
        handler2 = (value37, value38) => {
          if (value37 < value33 || value37 + 2 > list4['length']) return null;
          const value39 = run(value37);
          for (let value40 = 0; value40 < value39; value40 += 1) {
            const value41 = value37 + 2 + value40 * 12;
            if (value41 + 12 > list4['length']) break;
            if (run(value41) === value38) return value41;
          }
          return null;
        },
        value42 = value33 + handler(value33 + 4),
        enabled2 = handler2(value42, 34665);
      if (!enabled2) return null;
      const value43 = value33 + handler(enabled2 + 8),
        enabled3 = handler2(value43, 41989);
      if (!enabled3) return null;
      const count9 = run(enabled3 + 2),
        count10 = handler(enabled3 + 4);
      if (count10 < 1) return null;
      const count11 = count9 === 3 ? run(enabled3 + 8) : count9 === 4 ? handler(enabled3 + 8) : 0;
      return count11 > 0 ? count11 : null;
    }
    value32 += 2 + count8;
  }
  return null;
}
export function estimateStoryboard3DBackgroundPerspective(
  box2,
  {
    sourceWidth: sourceWidth = box2?.['width'],
    sourceHeight: sourceHeight = box2?.['height'],
    focalLength35mm: focalLength35mm = null,
  } = {},
) {
  const value44 = Math['max'](1, Math['round'](finite(box2?.['width'], 1))),
    value45 = Math['max'](1, Math['round'](finite(box2?.['height'], 1)));
  if (!box2?.['data'] || box2['data']['length'] < value44 * value45 * 4)
    throw new TypeError('Background perspective estimation requires RGBA image data.');
  const estimateHorizon2 = estimateHorizon(box2),
    estimateVanishingPointX2 = estimateVanishingPointX(box2, estimateHorizon2['horizonY']),
    imageWidth = Math['max'](1, Math['round'](finite(sourceWidth, value44))),
    imageHeight = Math['max'](1, Math['round'](finite(sourceHeight, value45))),
    value46 = imageWidth / imageHeight,
    value47 =
      focalLength35mm > 0 ? (2 * Math['atan'](36 / (2 * focalLength35mm)) * 180) / Math['PI'] : 60,
    calibrationConfidence = clamp(
      estimateHorizon2['confidence'] * 0.7 + estimateVanishingPointX2['confidence'] * 0.3,
      0.2,
      focalLength35mm > 0 ? 0.9 : 0.78,
    ),
    horizonY = clamp(estimateHorizon2['horizonY'], 0, 1);
  return {
    horizontalFov: clamp(value47, 10, 0xaa),
    verticalFov: clamp(normalizedVerticalFov(value47, value46), 10, 0xaa),
    horizonY: horizonY,
    horizonSlope: 0,
    vanishingPoint: [estimateVanishingPointX2['vanishingPointX'], horizonY],
    cameraHeight: 1.6,
    imageWidth: imageWidth,
    imageHeight: imageHeight,
    groundRegion: [
      [0, horizonY],
      [1, horizonY],
      [1, 1],
      [0, 1],
    ],
    calibrationMethod: focalLength35mm > 0 ? 'exif-local-estimate' : 'local-image-estimate',
    calibrationConfidence: calibrationConfidence,
  };
}
async function readFocalLength35mm(value48) {
  if (!/^image\/jpe?g$/i['test'](String(value48?.['type'] || ''))) return null;
  if (typeof value48?.['arrayBuffer'] !== 'function') return null;
  try {
    return extractStoryboard3DFocalLength35mmFromExif(await value48['arrayBuffer']());
  } catch {
    return null;
  }
}
export async function analyzeStoryboard3DBackgroundImage(
  enabled4,
  {
    documentObject: documentObject = globalThis['document'],
    imageBitmapFactory: imageBitmapFactory = typeof globalThis['createImageBitmap'] === 'function'
      ? globalThis['createImageBitmap']['bind'](globalThis)
      : null,
    maxDimension: maxDimension = DEFAULT_ANALYSIS_MAX_DIMENSION,
  } = {},
) {
  if (!enabled4) throw new TypeError('Background image file is required.');
  if (typeof imageBitmapFactory !== 'function') throw new Error('当前浏览器不支持本地背景透视分析。');
  const box3 = await imageBitmapFactory(enabled4);
  try {
    const sourceWidth2 = Math['max'](1, Number(box3?.['width']) || 1),
      sourceHeight2 = Math['max'](1, Number(box3?.['height']) || 1),
      value49 = Math['min'](
        1,
        Math['max'](64, Number(maxDimension) || DEFAULT_ANALYSIS_MAX_DIMENSION) /
          Math['max'](sourceWidth2, sourceHeight2),
      ),
      value50 = Math['max'](1, Math['round'](sourceWidth2 * value49)),
      value51 = Math['max'](1, Math['round'](sourceHeight2 * value49)),
      box4 = documentObject?.['createElement']?.('canvas'),
      ctx = box4?.['getContext']?.('2d', { willReadFrequently: true });
    if (!box4 || !ctx) throw new Error('无法创建背景透视分析画布。');
    ((box4['width'] = value50),
      (box4['height'] = value51),
      ctx['drawImage'](box3, 0, 0, value50, value51));
    const value52 = ctx['getImageData'](0, 0, value50, value51);
    return estimateStoryboard3DBackgroundPerspective(value52, {
      sourceWidth: sourceWidth2,
      sourceHeight: sourceHeight2,
      focalLength35mm: await readFocalLength35mm(enabled4),
    });
  } finally {
    box3?.['close']?.();
  }
}
