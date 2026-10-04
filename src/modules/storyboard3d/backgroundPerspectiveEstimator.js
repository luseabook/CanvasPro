const DEFAULT_ANALYSIS_MAX_DIMENSION = 0x200;
function clamp(value, item, key) {
  return Math['max'](item, Math['min'](key, value));
}
function finite(index, result = 0x0) {
  const data = Number(index);
  return Number['isFinite'](data) ? data : result;
}
function luminance(options, target) {
  return options[target] * 0.2126 + options[target + 0x1] * 0.7152 + options[target + 0x2] * 0.0722;
}
function normalizedVerticalFov(source, next) {
  const current = (clamp(finite(source, 0x3c), 0xa, 0xaa) * Math['PI']) / 0xb4;
  return (0x2 * Math['atan'](Math['tan'](current / 0x2) / Math['max'](0.1, next)) * 0xb4) / Math['PI'];
}
function collectRowFeatures(entry) {
  const { data: data2, width: width, height: height } = entry,
    means = new Float64Array(height),
    textures = new Float64Array(height),
    verticalEdges = new Float64Array(height);
  for (let count = 0x0; count < height; count += 0x1) {
    let record = 0x0,
      payload = 0x0,
      handle = 0x0,
      state = 0x0;
    for (let count2 = 0x0; count2 < width; count2 += 0x1) {
      const config = (count * width + count2) * 0x4,
        luminance2 = luminance(data2, config);
      record += luminance2;
      if (count2 > 0x0) payload += Math['abs'](luminance2 - state);
      (count > 0x0 && (handle += Math['abs'](luminance2 - luminance(data2, config - width * 0x4))),
        (state = luminance2));
    }
    ((means[count] = record / Math['max'](0x1, width)),
      (textures[count] = payload / Math['max'](0x1, width - 0x1)),
      (verticalEdges[count] = handle / Math['max'](0x1, width)));
  }
  return { means: means, textures: textures, verticalEdges: verticalEdges };
}
function windowMean(list, scope, input) {
  let output = 0x0,
    count3 = 0x0;
  for (let value2 = Math['max'](0x0, scope); value2 < Math['min'](list['length'], input); value2 += 0x1) {
    ((output += list[value2]), (count3 += 0x1));
  }
  return count3 > 0x0 ? output / count3 : 0x0;
}
function estimateHorizon(value3) {
  const { height: height2 } = value3,
    rowFeatures = collectRowFeatures(value3),
    value4 = Math['max'](0x2, Math['round'](height2 * 0.018)),
    value5 = Math['max'](value4, Math['round'](height2 * 0.16)),
    value6 = Math['min'](height2 - value4, Math['round'](height2 * 0.8)),
    list2 = [];
  for (let y = value5; y < value6; y += 0x1) {
    const value7 = Math['abs'](
        windowMean(rowFeatures['means'], y - value4, y) - windowMean(rowFeatures['means'], y, y + value4),
      ),
      value8 = Math['abs'](
        windowMean(rowFeatures['textures'], y - value4, y) -
          windowMean(rowFeatures['textures'], y, y + value4),
      ),
      value9 = y / height2,
      value10 = 0.62 + 0.38 * Math['exp'](-Math['pow']((value9 - 0.48) / 0.3, 0x2)),
      score = (value7 * 0.58 + value8 * 0.22 + rowFeatures['verticalEdges'][y] * 0.2) * value10;
    list2['push']({ y: y, score: score });
  }
  list2['sort']((value11, value12) => value12['score'] - value11['score']);
  const box = list2[0x0];
  if (!box || box['score'] < 0.5) return { horizonY: 0.5, confidence: 0.2 };
  const value13 = list2[Math['floor'](list2['length'] / 0x2)]?.['score'] || 0x0,
    value14 = box['score'] / Math['max'](0.1, value13);
  return {
    horizonY: clamp(box['y'] / height2, 0.12, 0.88),
    confidence: clamp(0.28 + (value14 - 0x1) * 0.12 + box['score'] / 0xdc, 0.25, 0.82),
  };
}
function estimateVanishingPointX(value15, value16) {
  const { data: data3, width: width2, height: height3 } = value15,
    value17 = value16 * height3,
    value18 = 0x60,
    float64Array = new Float64Array(value18);
  let count4 = 0x0;
  for (
    let value19 = Math['max'](0x2, Math['round'](value17 + height3 * 0.025));
    value19 < height3 - 0x2;
    value19 += 0x2
  ) {
    for (let value20 = 0x2; value20 < width2 - 0x2; value20 += 0x2) {
      const value21 = (value19 * width2 + value20) * 0x4,
        luminance3 = luminance(data3, value21 + 0x4) - luminance(data3, value21 - 0x4),
        luminance4 = luminance(data3, value21 + width2 * 0x4) - luminance(data3, value21 - width2 * 0x4),
        count5 = Math['hypot'](luminance3, luminance4);
      if (count5 < 0x26 || Math['abs'](luminance3) < 0.00001) continue;
      const value22 = -luminance4 / luminance3,
        count6 = Math['abs'](value22);
      if (count6 < 0.08 || count6 > 3.5) continue;
      const value23 = value20 + (value17 - value19) * value22;
      if (value23 < -width2 * 0.35 || value23 > width2 * 1.35) continue;
      const clamp2 = clamp(value23 / width2, 0x0, 0.999999),
        value24 = Math['floor'](clamp2 * value18),
        value25 = Math['min'](0xff, count5);
      ((float64Array[value24] += value25), (count4 += value25));
    }
  }
  if (count4 <= 0x0) return { vanishingPointX: 0.5, confidence: 0.12 };
  const list3 = Array['from'](
    float64Array,
    (value26, value27) =>
      (float64Array[value27 - 0x1] || 0x0) * 0.25 +
      float64Array[value27] +
      (float64Array[value27 + 0x1] || 0x0) * 0.25,
  );
  let value28 = 0x0;
  for (let value29 = 0x1; value29 < list3['length']; value29 += 0x1) {
    if (list3[value29] > list3[value28]) value28 = value29;
  }
  const value30 = list3[value28] / Math['max'](0x1, count4);
  return {
    vanishingPointX: clamp((value28 + 0.5) / value18, 0.05, 0.95),
    confidence: clamp(value30 * 0x5, 0.12, 0.7),
  };
}
export function extractStoryboard3DFocalLength35mmFromExif(value31) {
  const list4 = value31 instanceof Uint8Array ? value31 : new Uint8Array(value31 || 0x0);
  if (list4['length'] < 0x10 || list4[0x0] !== 0xff || list4[0x1] !== 0xd8) return null;
  const dataView = new DataView(list4['buffer'], list4['byteOffset'], list4['byteLength']);
  let value32 = 0x2;
  while (value32 + 0x4 <= list4['length']) {
    if (list4[value32] !== 0xff) break;
    const count7 = list4[value32 + 0x1];
    if (count7 === 0xda || count7 === 0xd9) break;
    const count8 = dataView['getUint16'](value32 + 0x2, ![]);
    if (count8 < 0x2 || value32 + 0x2 + count8 > list4['length']) break;
    if (
      count7 === 0xe1 &&
      count8 >= 0xe &&
      String['fromCharCode'](...list4['subarray'](value32 + 0x4, value32 + 0xa)) === 'Exif\u0000\u0000'
    ) {
      const value33 = value32 + 0xa,
        value34 = String['fromCharCode'](list4[value33], list4[value33 + 0x1]),
        enabled = value34 === 'II';
      if (!enabled && value34 !== 'MM') return null;
      const run = (value35) => dataView['getUint16'](value35, enabled),
        handler = (value36) => dataView['getUint32'](value36, enabled),
        handler2 = (value37, value38) => {
          if (value37 < value33 || value37 + 0x2 > list4['length']) return null;
          const value39 = run(value37);
          for (let value40 = 0x0; value40 < value39; value40 += 0x1) {
            const value41 = value37 + 0x2 + value40 * 0xc;
            if (value41 + 0xc > list4['length']) break;
            if (run(value41) === value38) return value41;
          }
          return null;
        },
        value42 = value33 + handler(value33 + 0x4),
        enabled2 = handler2(value42, 0x8769);
      if (!enabled2) return null;
      const value43 = value33 + handler(enabled2 + 0x8),
        enabled3 = handler2(value43, 0xa405);
      if (!enabled3) return null;
      const count9 = run(enabled3 + 0x2),
        count10 = handler(enabled3 + 0x4);
      if (count10 < 0x1) return null;
      const count11 = count9 === 0x3 ? run(enabled3 + 0x8) : count9 === 0x4 ? handler(enabled3 + 0x8) : 0x0;
      return count11 > 0x0 ? count11 : null;
    }
    value32 += 0x2 + count8;
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
  const value44 = Math['max'](0x1, Math['round'](finite(box2?.['width'], 0x1))),
    value45 = Math['max'](0x1, Math['round'](finite(box2?.['height'], 0x1)));
  if (!box2?.['data'] || box2['data']['length'] < value44 * value45 * 0x4)
    throw new TypeError('Background\x20perspective\x20estimation\x20requires\x20RGBA\x20image\x20data.');
  const estimateHorizon2 = estimateHorizon(box2),
    estimateVanishingPointX2 = estimateVanishingPointX(box2, estimateHorizon2['horizonY']),
    imageWidth = Math['max'](0x1, Math['round'](finite(sourceWidth, value44))),
    imageHeight = Math['max'](0x1, Math['round'](finite(sourceHeight, value45))),
    value46 = imageWidth / imageHeight,
    value47 =
      focalLength35mm > 0x0 ? (0x2 * Math['atan'](0x24 / (0x2 * focalLength35mm)) * 0xb4) / Math['PI'] : 0x3c,
    calibrationConfidence = clamp(
      estimateHorizon2['confidence'] * 0.7 + estimateVanishingPointX2['confidence'] * 0.3,
      0.2,
      focalLength35mm > 0x0 ? 0.9 : 0.78,
    ),
    horizonY = clamp(estimateHorizon2['horizonY'], 0x0, 0x1);
  return {
    horizontalFov: clamp(value47, 0xa, 0xaa),
    verticalFov: clamp(normalizedVerticalFov(value47, value46), 0xa, 0xaa),
    horizonY: horizonY,
    horizonSlope: 0x0,
    vanishingPoint: [estimateVanishingPointX2['vanishingPointX'], horizonY],
    cameraHeight: 1.6,
    imageWidth: imageWidth,
    imageHeight: imageHeight,
    groundRegion: [
      [0x0, horizonY],
      [0x1, horizonY],
      [0x1, 0x1],
      [0x0, 0x1],
    ],
    calibrationMethod: focalLength35mm > 0x0 ? 'exif-local-estimate' : 'local-image-estimate',
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
    const sourceWidth2 = Math['max'](0x1, Number(box3?.['width']) || 0x1),
      sourceHeight2 = Math['max'](0x1, Number(box3?.['height']) || 0x1),
      value49 = Math['min'](
        0x1,
        Math['max'](0x40, Number(maxDimension) || DEFAULT_ANALYSIS_MAX_DIMENSION) /
          Math['max'](sourceWidth2, sourceHeight2),
      ),
      value50 = Math['max'](0x1, Math['round'](sourceWidth2 * value49)),
      value51 = Math['max'](0x1, Math['round'](sourceHeight2 * value49)),
      box4 = documentObject?.['createElement']?.('canvas'),
      ctx = box4?.['getContext']?.('2d', { willReadFrequently: !![] });
    if (!box4 || !ctx) throw new Error('无法创建背景透视分析画布。');
    ((box4['width'] = value50),
      (box4['height'] = value51),
      ctx['drawImage'](box3, 0x0, 0x0, value50, value51));
    const value52 = ctx['getImageData'](0x0, 0x0, value50, value51);
    return estimateStoryboard3DBackgroundPerspective(value52, {
      sourceWidth: sourceWidth2,
      sourceHeight: sourceHeight2,
      focalLength35mm: await readFocalLength35mm(enabled4),
    });
  } finally {
    box3?.['close']?.();
  }
}
