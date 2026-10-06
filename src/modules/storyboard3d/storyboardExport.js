export const STORYBOARD_EXPORT_ASPECT_RATIOS = Object.freeze({
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '2.39:1': 2.39,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '21:9': 21 / 9,
});
export const STORYBOARD_EXPORT_RESOLUTIONS = Object.freeze({
  '720p': 720,
  '1080p': 1080,
  '2K': 1440,
  '4K': 2160,
});
const DEFAULT_PALETTE = Object.freeze({
  background: '#0b0c10',
  cellBackground: '#171922',
  text: '#f4f6fb',
  mutedText: '#9ba3b4',
  line: '#42485a',
  guide: 'rgba(255,255,255,0.38)',
});
function toPositiveInteger(value, item, { min: min = 1, max: max = Number.MAX_SAFE_INTEGER } = {}) {
  const key = Math.round(Number(value));
  if (!Number.isFinite(key)) return item;
  return Math.min(max, Math.max(min, key));
}
function normalizeAspectRatio(index) {
  const key2 = String(index || '16:9');
  if (Object.hasOwn(STORYBOARD_EXPORT_ASPECT_RATIOS, key2))
    return { key: key2, value: STORYBOARD_EXPORT_ASPECT_RATIOS[key2] };
  const key3 = Number(index);
  if (Number.isFinite(key3) && key3 > 0) return { key: key3 + ':1', value: key3 };
  return { key: '16:9', value: STORYBOARD_EXPORT_ASPECT_RATIOS['16:9'] };
}
export function resolveStoryboardExportDimensions({
  aspectRatio: aspectRatio = '16:9',
  resolution: resolution = '1080p',
} = {}) {
  const aspectRatio2 = normalizeAspectRatio(aspectRatio),
    result =
      STORYBOARD_EXPORT_RESOLUTIONS[resolution] ||
      toPositiveInteger(resolution, STORYBOARD_EXPORT_RESOLUTIONS['1080p'], { min: 240, max: 4320 }),
    width = aspectRatio2.value >= 1 ? Math.round(result * aspectRatio2.value) : result,
    height = aspectRatio2.value >= 1 ? result : Math.round(result / aspectRatio2.value);
  return {
    aspectRatio: aspectRatio2.key,
    ratio: aspectRatio2.value,
    resolution: String(resolution),
    width: width,
    height: height,
  };
}
export function calculateStoryboardGridLayout({
  count: count,
  columns: columns = 3,
  frameWidth: frameWidth,
  frameHeight: frameHeight,
  metadataHeight: metadataHeight = 160,
  gap: gap = 24,
  padding: padding = 32,
  maxSide: maxSide = 16384,
  maxPixels: maxPixels = 120000000,
} = {}) {
  const max2 = toPositiveInteger(count, 1, { max: 1000 }),
    columns2 = toPositiveInteger(columns, 3, { max: max2 }),
    rows = Math.ceil(max2 / columns2),
    cellWidth = toPositiveInteger(frameWidth, 1920, { min: 64, max: 8192 }),
    frameHeight2 = toPositiveInteger(frameHeight, 1080, { min: 64, max: 8192 }),
    metadataHeight2 = toPositiveInteger(metadataHeight, 160, { min: 0, max: 800 }),
    gap2 = toPositiveInteger(gap, 24, { min: 0, max: 256 }),
    padding2 = toPositiveInteger(padding, 32, { min: 0, max: 512 }),
    cellHeight = frameHeight2 + metadataHeight2,
    width2 = padding2 * 2 + columns2 * cellWidth + Math.max(0, columns2 - 1) * gap2,
    height2 = padding2 * 2 + rows * cellHeight + Math.max(0, rows - 1) * gap2;
  if (width2 > maxSide || height2 > maxSide || width2 * height2 > maxPixels)
    throw new RangeError(
      'Storyboard export is too large (' + width2 + '×' + height2 + '). Reduce resolution or grid size.',
    );
  return {
    count: max2,
    columns: columns2,
    rows: rows,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    frameWidth: cellWidth,
    frameHeight: frameHeight2,
    metadataHeight: metadataHeight2,
    gap: gap2,
    padding: padding2,
    width: width2,
    height: height2,
    getCellRect(data) {
      const toPositiveInteger2 = toPositiveInteger(Number(data) + 1, 1, { max: max2 }) - 1,
        options = toPositiveInteger2 % columns2,
        target = Math.floor(toPositiveInteger2 / columns2);
      return {
        x: padding2 + options * (cellWidth + gap2),
        y: padding2 + target * (cellHeight + gap2),
        width: cellWidth,
        height: cellHeight,
        frameHeight: frameHeight2,
        metadataHeight: metadataHeight2,
      };
    },
  };
}
function createDefaultCanvas(source, next, { documentObject: documentObject = globalThis.document } = {}) {
  const run = globalThis.OffscreenCanvas;
  if (typeof run === 'function') return new run(source, next);
  const box = documentObject?.createElement?.('canvas');
  if (!box) throw new Error('Canvas export is unavailable in this runtime.');
  return ((box.width = source), (box.height = next), box);
}
async function canvasToBlob(current, { mimeType: mimeType = 'image/png', quality: quality = 0.92 } = {}) {
  if (typeof current?.convertToBlob === 'function')
    return current.convertToBlob({ type: mimeType, quality: quality });
  if (typeof current?.toBlob === 'function')
    return new Promise((handler, handler2) => {
      current.toBlob(
        (entry) => (entry ? handler(entry) : handler2(new Error('Canvas encoding failed.'))),
        mimeType,
        quality,
      );
    });
  throw new Error('Canvas blob encoding is unavailable in this runtime.');
}
function getFrameSize(box2) {
  const source2 = box2?.image || box2;
  return {
    source: source2,
    width: Number(
      box2?.width || source2?.videoWidth || source2?.naturalWidth || source2?.width || 0,
    ),
    height: Number(
      box2?.height ||
        source2?.videoHeight ||
        source2?.naturalHeight ||
        source2?.height ||
        0,
    ),
  };
}
function drawFrameCover(ctx, record, box3, payload) {
  ((ctx.fillStyle = payload.cellBackground),
    ctx.fillRect(box3.x, box3.y, box3.width, box3.height));
  const { source: source3, width: width3, height: height3 } = getFrameSize(record);
  if (!source3 || width3 <= 0 || height3 <= 0) return;
  const handle = width3 / height3,
    state = box3.width / box3.height;
  let config = 0,
    scope = 0,
    input = width3,
    output = height3;
  if (handle > state) ((input = height3 * state), (config = (width3 - input) / 2));
  else handle < state && ((output = width3 / state), (scope = (height3 - output) / 2));
  ctx.drawImage(
    source3,
    config,
    scope,
    input,
    output,
    box3.x,
    box3.y,
    box3.width,
    box3.height,
  );
}
function drawThirdsGuide(ctx2, box4, value2) {
  (ctx2.save(),
    (ctx2.strokeStyle = value2.guide),
    (ctx2.lineWidth = Math.max(1, Math.round(box4.width / 960))),
    ctx2.beginPath());
  for (const value3 of [1 / 3, 2 / 3]) {
    (ctx2.moveTo(box4.x + box4.width * value3, box4.y),
      ctx2.lineTo(box4.x + box4.width * value3, box4.y + box4.height),
      ctx2.moveTo(box4.x, box4.y + box4.height * value3),
      ctx2.lineTo(box4.x + box4.width, box4.y + box4.height * value3));
  }
  (ctx2.stroke(), ctx2.restore());
}
function buildShotMetaLines(value4, value5, value6) {
  const value7 = value4?.camera || {},
    list = [];
  value6.includeShotNumber !== false &&
    list.push(
      'SHOT ' + String(value5 + 1).padStart(2, '0') + ' · ' + (value4?.shotSize || 'MED'),
    );
  const value8 = [
    value6.includeShotAngle !== false ? value4?.shotAngle : '',
    value6.includeFocalLength !== false && value7.focalLength ? value7.focalLength + 'mm' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  if (value8) list.push(value8);
  return (
    value6.includeDescription !== false &&
      value4?.description &&
      list.push(String(value4.description)),
    list
  );
}
function drawMetadata(ctx3, value9, value10, box5, value11, response) {
  if (box5.metadataHeight <= 0) return;
  const value12 = box5.y + box5.frameHeight;
  ((ctx3.fillStyle = response.cellBackground),
    ctx3.fillRect(box5.x, value12, box5.width, box5.metadataHeight),
    (ctx3.fillStyle = response.text));
  const value13 = Math.max(18, Math.round(box5.width / 42)),
    value14 = Math.round(value13 * 1.35);
  ((ctx3.font = '600 ' + value13 + 'px system-ui, sans-serif'), (ctx3.textBaseline = 'top'));
  const list2 = buildShotMetaLines(value9, value10, value11);
  list2.slice(0, 3).forEach((value15, count2) => {
    count2 > 0 &&
      ((ctx3.fillStyle = response.mutedText),
      (ctx3.font =
        '400 ' + Math.max(16, Math.round(value13 * 0.78)) + 'px system-ui, sans-serif'));
    const value16 = Math.max(12, Math.floor(box5.width / Math.max(12, value13 * 0.55))),
      value17 = String(value15).slice(0, value16);
    ctx3.fillText(value17, box5.x + value13, value12 + value13 + count2 * value14);
  });
}
export async function renderStoryboardGrid({
  shots: shots = [],
  renderFrame: renderFrame,
  aspectRatio: aspectRatio = '16:9',
  resolution: resolution = '1080p',
  columns: columns = 3,
  metadataHeight: metadataHeight3,
  gap: gap3,
  padding: padding3,
  includeThirds: includeThirds = false,
  includeShotNumber: includeShotNumber = true,
  includeShotAngle: includeShotAngle = true,
  includeFocalLength: includeFocalLength = true,
  includeDescription: includeDescription = true,
  mimeType: mimeType = 'image/png',
  quality: quality = 0.92,
  palette: palette = DEFAULT_PALETTE,
  canvasFactory: canvasFactory = createDefaultCanvas,
  onProgress: onProgress,
} = {}) {
  if (!Array.isArray(shots) || shots.length === 0 || !shots.some(Boolean))
    throw new Error('At least one shot is required for storyboard export.');
  if (typeof renderFrame !== 'function') throw new TypeError('renderFrame must be a function.');
  const frameWidth2 = resolveStoryboardExportDimensions({ aspectRatio: aspectRatio, resolution: resolution }),
    width4 = calculateStoryboardGridLayout({
      count: shots.length,
      columns: columns,
      frameWidth: frameWidth2.width,
      frameHeight: frameWidth2.height,
      metadataHeight:
        metadataHeight3 ??
        Math.max(96, Math.round(Math.min(frameWidth2.width, frameWidth2.height) * 0.15)),
      gap: gap3,
      padding: padding3,
    }),
    el = canvasFactory(width4.width, width4.height),
    ctx4 = el?.getContext?.('2d');
  if (!ctx4) throw new Error('2D canvas context is unavailable.');
  const value18 = { ...DEFAULT_PALETTE, ...(palette || {}) };
  ((ctx4.fillStyle = value18.background),
    ctx4.fillRect(0, 0, width4.width, width4.height));
  for (let current2 = 0; current2 < shots.length; current2 += 1) {
    const shotId = shots[current2];
    onProgress?.({
      stage: 'rendering',
      current: current2 + 1,
      total: shots.length,
      shotId: shotId?.id,
    });
    const x = width4.getCellRect(current2),
      value19 = {
        x: x.x,
        y: x.y,
        width: x.width,
        height: x.frameHeight,
      };
    if (!shotId) {
      ((ctx4.fillStyle = value18.cellBackground),
        ctx4.fillRect(x.x, x.y, x.width, x.height));
      continue;
    }
    const value20 = await renderFrame(shotId, {
      width: frameWidth2.width,
      height: frameWidth2.height,
      index: current2,
      total: shots.length,
    });
    drawFrameCover(ctx4, value20, value19, value18);
    if (includeThirds) drawThirdsGuide(ctx4, value19, value18);
    (drawMetadata(
      ctx4,
      shotId,
      current2,
      x,
      {
        includeShotNumber: includeShotNumber,
        includeShotAngle: includeShotAngle,
        includeFocalLength: includeFocalLength,
        includeDescription: includeDescription,
      },
      value18,
    ),
      value20?.close?.(),
      value20?.image?.close?.());
  }
  onProgress?.({ stage: 'encoding', current: shots.length, total: shots.length });
  const blob = await canvasToBlob(el, { mimeType: mimeType, quality: quality });
  return (
    onProgress?.({ stage: 'complete', current: shots.length, total: shots.length }),
    {
      blob: blob,
      mimeType: mimeType,
      width: width4.width,
      height: width4.height,
      layout: width4,
      frame: frameWidth2,
    }
  );
}
export async function renderStoryboardSequence({
  shots: shots = [],
  renderFrame: renderFrame2,
  ...args
} = {}) {
  if (!Array.isArray(shots) || shots.length === 0)
    throw new Error('At least one shot is required for storyboard export.');
  const list3 = [];
  for (let index2 = 0; index2 < shots.length; index2 += 1) {
    const shotId2 = shots[index2],
      args2 = await renderStoryboardGrid({
        ...args,
        shots: [shotId2],
        columns: 1,
        renderFrame: (value21, args3) =>
          renderFrame2(value21, { ...args3, index: index2, total: shots.length }),
        onProgress: (args4) =>
          args.onProgress?.({
            ...args4,
            current: index2 + (args4.stage === 'complete' ? 1 : 0),
            total: shots.length,
            shotId: shotId2?.id,
          }),
      });
    list3.push({ ...args2, shotId: shotId2?.id || '', index: index2 });
  }
  return list3;
}
