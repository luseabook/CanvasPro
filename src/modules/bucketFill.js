function clampInt(value, item, key) {
  const index = Number(value);
  if (!Number.isFinite(index)) return item;
  return Math.max(item, Math.min(key, Math.floor(index)));
}
function createCanvas(result, data) {
  const box = document.createElement('canvas');
  return ((box.width = Math.max(1, Math.floor(result))), (box.height = Math.max(1, Math.floor(data))), box);
}
function hasAnyMarked(list) {
  for (let options = 0; options < list.length; options += 1) {
    if (list[options]) return true;
  }
  return false;
}
function extractMaskFromCanvas(el) {
  const target = el.getContext('2d'),
    { width: width, height: height } = el,
    source = target.getImageData(0, 0, width, height),
    list2 = new Uint8Array(width * height);
  for (let next = 0, current = 0; next < list2.length; next += 1, current += 4) {
    list2[next] = source.data[current + 3] > 10 ? 1 : 0;
  }
  return list2;
}
function buildDiskOffsets(entry) {
  const count = Math.max(0, Math.floor(entry));
  if (count <= 0) return [[0, 0]];
  const list3 = [],
    record = count * count;
  for (let payload = -count; payload <= count; payload += 1) {
    for (let handle = -count; handle <= count; handle += 1) {
      if (handle * handle + payload * payload <= record) list3.push([handle, payload]);
    }
  }
  return list3;
}
function dilate(list4, state, config, list5) {
  const uint8Array = new Uint8Array(list4.length);
  for (let scope = 0; scope < config; scope += 1) {
    const input = scope * state;
    for (let output = 0; output < state; output += 1) {
      if (list4[input + output])
        for (let value2 = 0; value2 < list5.length; value2 += 1) {
          const [value3, value4] = list5[value2],
            count2 = output + value3,
            count3 = scope + value4;
          if (count2 < 0 || count2 >= state || count3 < 0 || count3 >= config) continue;
          uint8Array[count3 * state + count2] = 1;
        }
    }
  }
  return uint8Array;
}
function erode(list6, value5, value6, list7) {
  const uint8Array2 = new Uint8Array(list6.length);
  for (let value7 = 0; value7 < value6; value7 += 1) {
    const value8 = value7 * value5;
    for (let value9 = 0; value9 < value5; value9 += 1) {
      let value10 = true;
      for (let value11 = 0; value11 < list7.length; value11 += 1) {
        const [value12, value13] = list7[value11],
          count4 = value9 + value12,
          count5 = value7 + value13;
        if (count4 < 0 || count4 >= value5 || count5 < 0 || count5 >= value6) {
          value10 = false;
          break;
        }
        if (!list6[count5 * value5 + count4]) {
          value10 = false;
          break;
        }
      }
      if (value10) uint8Array2[value8 + value9] = 1;
    }
  }
  return uint8Array2;
}
function createRegionMaskCanvas(list8, value14, value15) {
  const el2 = createCanvas(value14, value15),
    value16 = el2.getContext('2d'),
    value17 = value16.createImageData(value14, value15);
  for (let value18 = 0, value19 = 0; value18 < list8.length; value18 += 1, value19 += 4) {
    if (!list8[value18]) continue;
    ((value17.data[value19] = 255),
      (value17.data[value19 + 1] = 255),
      (value17.data[value19 + 2] = 255),
      (value17.data[value19 + 3] = 255));
  }
  return (value16.putImageData(value17, 0, 0), el2);
}
const FILL_REGION_CACHE_LIMIT = 64,
  commandSignatureCache = new WeakMap();
function cacheNumber(value20) {
  const value21 = Number(value20);
  if (!Number.isFinite(value21)) return 0;
  return Math.round(value21 * 1000) / 1000;
}
function pointSignature(value22) {
  return (Array.isArray(value22) ? value22 : [])
    .map((box2) => cacheNumber(box2?.x) + ',' + cacheNumber(box2?.y))
    .join(';');
}
function commandBoundarySignature(enabled) {
  if (!enabled || typeof enabled !== 'object') return '';
  const value23 = commandSignatureCache.get(enabled);
  if (value23) return value23;
  const value24 = String(enabled.type || '');
  let value25 = value24;
  if (value24 === 'brush' || value24 === 'eraser')
    value25 = [value24, cacheNumber(enabled.sizeWorld), pointSignature(enabled.points)].join(':');
  else
    value24 === 'rect' &&
      (value25 = [
        value24,
        cacheNumber(enabled.sizeWorld),
        cacheNumber(enabled.x1),
        cacheNumber(enabled.y1),
        cacheNumber(enabled.x2),
        cacheNumber(enabled.y2),
      ].join(':'));
  return (commandSignatureCache.set(enabled, value25), value25);
}
export function buildFillRegionCacheKey({
  width: width2,
  height: height2,
  zoom: zoom,
  seedX: seedX,
  seedY: seedY,
  fillCommand: fillCommand,
  boundaryCommands: boundaryCommands,
  extraKey: extraKey = '',
} = {}) {
  const value26 = (Array.isArray(boundaryCommands) ? boundaryCommands : [])
    .map(commandBoundarySignature)
    .join('|');
  return [
    cacheNumber(width2),
    cacheNumber(height2),
    cacheNumber(zoom),
    cacheNumber(seedX),
    cacheNumber(seedY),
    cacheNumber(fillCommand?.x ?? fillCommand?.startPoint?.x),
    cacheNumber(fillCommand?.y ?? fillCommand?.startPoint?.y),
    String(fillCommand?.mode || ''),
    String(fillCommand?.color || ''),
    String(extraKey || ''),
    value26,
  ].join('::');
}
function rememberFillRegion(map, value27, value28) {
  if (!map || typeof map.set !== 'function') return;
  if (map.size >= FILL_REGION_CACHE_LIMIT) {
    const value29 = map.keys().next().value;
    if (value29 !== undefined) map.delete(value29);
  }
  map.set(value27, value28);
}
export function getCachedSealedFillRegion({
  cache: cache = null,
  width: width3,
  height: height3,
  zoom: zoom2,
  fillCommand: fillCommand2,
  boundaryCommands: boundaryCommands2,
  seedX: seedX2,
  seedY: seedY2,
  pointToPixel: pointToPixel,
  getStrokeWidth: getStrokeWidth,
  extraKey: extraKey = '',
  buildBoundaryMaskFn: buildBoundaryMaskFn = buildBinaryBoundaryMask,
  floodFillRegionFn: floodFillRegionFn = floodFillRegion,
  sealRegionToBoundaryFn: sealRegionToBoundaryFn = sealRegionToBoundary,
} = {}) {
  const fillRegionCacheKey = buildFillRegionCacheKey({
      width: width3,
      height: height3,
      zoom: zoom2,
      seedX: seedX2,
      seedY: seedY2,
      fillCommand: fillCommand2,
      boundaryCommands: boundaryCommands2,
      extraKey: extraKey,
    }),
    value30 = cache?.get?.(fillRegionCacheKey);
  if (value30?.sealedRegionMask) return value30.sealedRegionMask;
  const box3 = buildBoundaryMaskFn({
      width: width3,
      height: height3,
      commands: boundaryCommands2,
      pointToPixel: pointToPixel,
      getStrokeWidth: getStrokeWidth,
    }),
    floodFillRegionFn2 = floodFillRegionFn(box3.mask, box3.width, box3.height, seedX2, seedY2),
    sealedRegionMask = sealRegionToBoundaryFn(floodFillRegionFn2, box3.mask, box3.width, box3.height);
  return (
    rememberFillRegion(cache, fillRegionCacheKey, { sealedRegionMask: sealedRegionMask }),
    sealedRegionMask
  );
}
export function buildBinaryBoundaryMask({
  width: width4,
  height: height4,
  commands: commands,
  pointToPixel: pointToPixel2,
  getStrokeWidth: getStrokeWidth2,
}) {
  const width5 = Math.max(1, Math.floor(width4)),
    height5 = Math.max(1, Math.floor(height4)),
    el3 = createCanvas(width5, height5),
    ctx = el3.getContext('2d');
  ((ctx.lineCap = 'round'),
    (ctx.lineJoin = 'round'),
    (commands || []).forEach((x) => {
      if (!x) return;
      if (x.type === 'brush') {
        const list9 = Array.isArray(x.points) ? x.points : [];
        if (!list9.length) return;
        (ctx.save(),
          (ctx.globalCompositeOperation = 'source-over'),
          (ctx.strokeStyle = '#fff'),
          (ctx.lineWidth = Math.max(1, Number(getStrokeWidth2?.(x)) || 1)),
          ctx.beginPath());
        for (let count6 = 0; count6 < list9.length; count6 += 1) {
          const box4 = pointToPixel2(list9[count6]);
          if (count6 === 0) ctx.moveTo(box4.x, box4.y);
          else ctx.lineTo(box4.x, box4.y);
        }
        (ctx.stroke(), ctx.restore());
        return;
      }
      if (x.type === 'rect') {
        const box5 = pointToPixel2({ x: x.x1, y: x.y1 }),
          box6 = pointToPixel2({ x: x.x2, y: x.y2 }),
          value31 = Math.min(box5.x, box6.x),
          value32 = Math.min(box5.y, box6.y),
          value33 = Math.abs(box6.x - box5.x),
          value34 = Math.abs(box6.y - box5.y);
        (ctx.save(),
          (ctx.globalCompositeOperation = 'source-over'),
          (ctx.strokeStyle = '#fff'),
          (ctx.lineWidth = Math.max(1, Number(getStrokeWidth2?.(x)) || 1)),
          ctx.strokeRect(value31, value32, value33, value34),
          ctx.restore());
        return;
      }
      if (x.type === 'eraser') {
        const list10 = Array.isArray(x.points) ? x.points : [];
        if (!list10.length) return;
        (ctx.save(),
          (ctx.globalCompositeOperation = 'destination-out'),
          (ctx.strokeStyle = '#000'),
          (ctx.lineWidth = Math.max(1, Number(getStrokeWidth2?.(x)) || 1)),
          ctx.beginPath());
        for (let count7 = 0; count7 < list10.length; count7 += 1) {
          const box7 = pointToPixel2(list10[count7]);
          if (count7 === 0) ctx.moveTo(box7.x, box7.y);
          else ctx.lineTo(box7.x, box7.y);
        }
        (ctx.stroke(), ctx.restore());
      }
    }));
  const mask = extractMaskFromCanvas(el3);
  return { width: width5, height: height5, mask: mask, hasBoundary: hasAnyMarked(mask) };
}
export function autoCloseBoundary(list11, value35, value36, value37) {
  const count8 = Math.max(0, Math.min(64, Math.floor(value37)));
  if (!list11 || !list11.length || count8 <= 0)
    return list11 instanceof Uint8Array ? list11.slice() : new Uint8Array(0);
  const diskOffsets = buildDiskOffsets(count8),
    dilate2 = dilate(list11, value35, value36, diskOffsets);
  return erode(dilate2, value35, value36, diskOffsets);
}
export function floodFillRegion(value38, value39, value40, value41, value42) {
  const value43 = Math.max(1, Math.floor(value39)),
    value44 = Math.max(1, Math.floor(value40)),
    value45 = value38 || new Uint8Array(value43 * value44),
    uint8Array3 = new Uint8Array(value43 * value44),
    x2 = clampInt(value41, 0, value43 - 1),
    y = clampInt(value42, 0, value44 - 1);
  if (!hasAnyMarked(value45)) return (uint8Array3.fill(1), uint8Array3);
  if (value45[y * value43 + x2]) return uint8Array3;
  const list12 = [{ x: x2, y: y }];
  while (list12.length > 0) {
    const { x: x3, y: y2 } = list12.pop();
    if (x3 < 0 || x3 >= value43 || y2 < 0 || y2 >= value44) continue;
    const value46 = y2 * value43 + x3;
    if (uint8Array3[value46] || value45[value46]) continue;
    ((uint8Array3[value46] = 1),
      list12.push({ x: x3 + 1, y: y2 }),
      list12.push({ x: x3 - 1, y: y2 }),
      list12.push({ x: x3, y: y2 + 1 }),
      list12.push({ x: x3, y: y2 - 1 }));
  }
  return uint8Array3;
}
export function sealRegionToBoundary(list13, list14, value47, value48, value49 = 2) {
  const value50 = Math.max(1, Math.floor(value47)),
    value51 = Math.max(1, Math.floor(value48));
  let list15 = list13 instanceof Uint8Array ? list13.slice() : new Uint8Array(value50 * value51);
  if (!list14?.length || !list15.length) return list15;
  const value52 = Math.max(1, Math.min(4, Math.floor(value49))),
    list16 = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
  for (let value53 = 0; value53 < value52; value53 += 1) {
    const value54 = list15.slice();
    for (let value55 = 0; value55 < value51; value55 += 1) {
      const value56 = value55 * value50;
      for (let value57 = 0; value57 < value50; value57 += 1) {
        const value58 = value56 + value57;
        if (!list14[value58] || list15[value58]) continue;
        for (let value59 = 0; value59 < list16.length; value59 += 1) {
          const count9 = value57 + list16[value59][0],
            count10 = value55 + list16[value59][1];
          if (count9 < 0 || count9 >= value50 || count10 < 0 || count10 >= value51) continue;
          if (list15[count10 * value50 + count9]) {
            value54[value58] = 1;
            break;
          }
        }
      }
    }
    list15 = value54;
  }
  return list15;
}
export function paintFilledRegion(
  ctx2,
  list17,
  value60,
  value61,
  {
    fillStyle: fillStyle = 'rgba(255,255,255,1)',
    globalCompositeOperation: globalCompositeOperation = 'source-over',
    globalAlpha: globalAlpha = 1,
  } = {},
) {
  if (!ctx2 || !list17?.length) return;
  const value62 = Math.max(1, Math.floor(value60)),
    value63 = Math.max(1, Math.floor(value61)),
    regionMaskCanvas = createRegionMaskCanvas(list17, value62, value63),
    el4 = createCanvas(value62, value63),
    ctx3 = el4.getContext('2d');
  ((ctx3.fillStyle = fillStyle),
    ctx3.fillRect(0, 0, value62, value63),
    (ctx3.globalCompositeOperation = 'destination-in'),
    ctx3.drawImage(regionMaskCanvas, 0, 0, value62, value63),
    ctx2.save(),
    (ctx2.globalCompositeOperation = globalCompositeOperation),
    (ctx2.globalAlpha = globalAlpha),
    ctx2.drawImage(el4, 0, 0, value62, value63),
    ctx2.restore());
}
