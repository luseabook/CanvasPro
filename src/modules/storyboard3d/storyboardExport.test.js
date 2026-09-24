import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_EXPORT_ASPECT_RATIOS,
  STORYBOARD_EXPORT_RESOLUTIONS,
  calculateStoryboardGridLayout,
  renderStoryboardGrid,
  renderStoryboardSequence,
  resolveStoryboardExportDimensions,
} from './storyboardExport.js';

function createCanvasHarness({ mode = 'convertToBlob' } = {}) {
  const ops = [];
  const marker = { kind: 'encoded-blob', mode };
  const context = {
    fillStyle: '',
    font: '',
    textBaseline: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect(x, y, width, height) {
      ops.push({ op: 'fillRect', x, y, width, height, fillStyle: this.fillStyle });
    },
    drawImage(...args) {
      ops.push({ op: 'drawImage', args });
    },
    fillText(text, x, y) {
      ops.push({ op: 'fillText', text, x, y, fillStyle: this.fillStyle, font: this.font });
    },
    beginPath() {
      ops.push({ op: 'beginPath' });
    },
    moveTo(x, y) {
      ops.push({ op: 'moveTo', x, y });
    },
    lineTo(x, y) {
      ops.push({ op: 'lineTo', x, y });
    },
    stroke() {
      ops.push({ op: 'stroke' });
    },
    save() {
      ops.push({ op: 'save' });
    },
    restore() {
      ops.push({ op: 'restore' });
    },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext(type) {
      return type === '2d' ? context : null;
    },
  };
  if (mode === 'convertToBlob')
    canvas.convertToBlob = (options) => {
      ops.push({ op: 'convertToBlob', ...options });
      return Promise.resolve(marker);
    };
  if (mode === 'toBlob')
    canvas.toBlob = (callback, type, quality) => {
      ops.push({ op: 'toBlob', type, quality });
      callback(marker);
    };
  if (mode === 'toBlobNull') canvas.toBlob = (callback) => callback(null);
  const canvasFactory = (width, height) => {
    canvas.width = width;
    canvas.height = height;
    ops.push({ op: 'resize', width, height });
    return canvas;
  };
  return { ops, canvas, marker, canvasFactory, opsOf: (name) => ops.filter((entry) => entry.op === name) };
}

function shot(overrides = {}) {
  return { id: 'shot-1', shotSize: 'CU', shotAngle: 'LOW', camera: { focalLength: 35 }, ...overrides };
}

function frameSource(width, height, record = null) {
  const image = {
    width,
    height,
    naturalWidth: width,
    naturalHeight: height,
    close() {
      if (record) record.imageClosed += 1;
    },
  };
  return {
    image,
    close() {
      if (record) record.frameClosed += 1;
    },
  };
}

test('分镜导出：预设画幅与分辨率冻结', () => {
  assert.ok(Object.isFrozen(STORYBOARD_EXPORT_ASPECT_RATIOS));
  assert.ok(Object.isFrozen(STORYBOARD_EXPORT_RESOLUTIONS));
  assert.equal(STORYBOARD_EXPORT_ASPECT_RATIOS['16:9'], 16 / 9);
  assert.equal(STORYBOARD_EXPORT_ASPECT_RATIOS['21:9'], 21 / 9);
  assert.equal(STORYBOARD_EXPORT_RESOLUTIONS['720p'], 720);
  assert.equal(STORYBOARD_EXPORT_RESOLUTIONS['1080p'], 1080);
  assert.equal(STORYBOARD_EXPORT_RESOLUTIONS['2K'], 1440);
  assert.equal(STORYBOARD_EXPORT_RESOLUTIONS['4K'], 2160);
});

test('分镜导出：导出尺寸按画幅与分辨率推导', () => {
  assert.deepEqual(resolveStoryboardExportDimensions({ aspectRatio: '16:9', resolution: '720p' }), {
    aspectRatio: '16:9',
    ratio: 16 / 9,
    resolution: '720p',
    width: 1280,
    height: 720,
  });
  const vertical = resolveStoryboardExportDimensions({ aspectRatio: '9:16', resolution: '1080p' });
  assert.equal(vertical.width, 1080);
  assert.equal(vertical.height, 1920);
  assert.equal(vertical.ratio, 9 / 16);

  assert.deepEqual(resolveStoryboardExportDimensions({ aspectRatio: '1:1', resolution: '4K' }), {
    aspectRatio: '1:1',
    ratio: 1,
    resolution: '4K',
    width: 2160,
    height: 2160,
  });

  const ultraWide = resolveStoryboardExportDimensions({ aspectRatio: '21:9', resolution: '1080p' });
  assert.equal(ultraWide.width, 2520);
  assert.equal(ultraWide.height, 1080);

  const numericAspect = resolveStoryboardExportDimensions({ aspectRatio: '5', resolution: '1080p' });
  assert.equal(numericAspect.aspectRatio, '5:1');
  assert.equal(numericAspect.width, 5400);
  assert.equal(numericAspect.height, 1080);

  const unknownAspect = resolveStoryboardExportDimensions({ aspectRatio: '16:10', resolution: '1080p' });
  assert.equal(unknownAspect.aspectRatio, '16:9');

  const unknownResolution = resolveStoryboardExportDimensions({ aspectRatio: '16:9', resolution: 'bogus' });
  assert.equal(unknownResolution.resolution, 'bogus');
  assert.equal(unknownResolution.height, 1080);

  const clampedLow = resolveStoryboardExportDimensions({ aspectRatio: '16:9', resolution: '100' });
  assert.equal(clampedLow.height, 240);
  assert.equal(clampedLow.width, 427);

  const clampedHigh = resolveStoryboardExportDimensions({ aspectRatio: '16:9', resolution: '9999' });
  assert.equal(clampedHigh.height, 4320);
  assert.equal(clampedHigh.width, 7680);

  assert.deepEqual(resolveStoryboardExportDimensions(), {
    aspectRatio: '16:9',
    ratio: 16 / 9,
    resolution: '1080p',
    width: 1920,
    height: 1080,
  });
});

test('分镜导出：网格布局与单元格坐标', () => {
  const layout = calculateStoryboardGridLayout({
    count: 5,
    columns: 3,
    frameWidth: 1280,
    frameHeight: 720,
    metadataHeight: 160,
    gap: 24,
    padding: 32,
  });
  assert.equal(layout.count, 5);
  assert.equal(layout.columns, 3);
  assert.equal(layout.rows, 2);
  assert.equal(layout.cellWidth, 1280);
  assert.equal(layout.cellHeight, 880);
  assert.equal(layout.frameHeight, 720);
  assert.equal(layout.metadataHeight, 160);
  assert.equal(layout.width, 3952);
  assert.equal(layout.height, 1848);

  assert.deepEqual(layout.getCellRect(0), {
    x: 32,
    y: 32,
    width: 1280,
    height: 880,
    frameHeight: 720,
    metadataHeight: 160,
  });
  assert.deepEqual(layout.getCellRect(2), {
    x: 32 + 2 * 1304,
    y: 32,
    width: 1280,
    height: 880,
    frameHeight: 720,
    metadataHeight: 160,
  });
  assert.equal(layout.getCellRect(3).y, 32 + 904);
  assert.equal(layout.getCellRect(3).x, 32);
  assert.equal(layout.getCellRect(4).x, 32 + 1304);
  assert.deepEqual(layout.getCellRect(99), layout.getCellRect(4));
  assert.deepEqual(layout.getCellRect(-1), layout.getCellRect(0));
  assert.deepEqual(layout.getCellRect(Number.NaN), layout.getCellRect(0));

  const defaults = calculateStoryboardGridLayout({ count: 1 });
  assert.equal(defaults.columns, 1);
  assert.equal(defaults.rows, 1);
  assert.equal(defaults.cellWidth, 1920);
  assert.equal(defaults.frameHeight, 1080);
  assert.equal(defaults.metadataHeight, 160);
  assert.equal(defaults.width, 1984);
  assert.equal(defaults.height, 1304);
});

test('分镜导出：超大网格被拒绝', () => {
  assert.throws(
    () => calculateStoryboardGridLayout({ count: 1000, columns: 1000, frameWidth: 8192, frameHeight: 8192 }),
    (error) =>
      error instanceof RangeError &&
      /^Storyboard export is too large \(\d+×\d+\)\. Reduce resolution or grid size\.$/.test(error.message),
  );
  assert.throws(
    () =>
      calculateStoryboardGridLayout({
        count: 1000,
        columns: 1000,
        frameWidth: 64,
        frameHeight: 64,
        metadataHeight: 0,
        gap: 0,
        padding: 0,
      }),
    RangeError,
  );
});

test('分镜导出：单张网格渲染并编码为 PNG', async () => {
  const harness = createCanvasHarness();
  const record = { imageClosed: 0, frameClosed: 0 };
  const progress = [];
  const result = await renderStoryboardGrid({
    shots: [shot({ description: '城市全景推轨' })],
    renderFrame: async (entry, info) => {
      assert.equal(entry.id, 'shot-1');
      assert.equal(info.width, 1280);
      assert.equal(info.height, 720);
      assert.equal(info.index, 0);
      assert.equal(info.total, 1);
      return frameSource(1600, 900, record);
    },
    aspectRatio: '16:9',
    resolution: '720p',
    canvasFactory: harness.canvasFactory,
    onProgress: (entry) => progress.push(entry),
  });

  assert.equal(harness.canvas.width, 1344);
  assert.equal(harness.canvas.height, 892);
  assert.equal(result.blob, harness.marker);
  assert.equal(result.mimeType, 'image/png');
  assert.equal(result.width, 1344);
  assert.equal(result.height, 892);
  assert.deepEqual(result.frame, {
    aspectRatio: '16:9',
    ratio: 16 / 9,
    resolution: '720p',
    width: 1280,
    height: 720,
  });
  assert.deepEqual(
    progress.map((entry) => entry.stage),
    ['rendering', 'encoding', 'complete'],
  );
  assert.deepEqual(progress[0], { stage: 'rendering', current: 1, total: 1, shotId: 'shot-1' });
  assert.deepEqual(harness.opsOf('convertToBlob'), [
    { op: 'convertToBlob', type: 'image/png', quality: 0.92 },
  ]);

  const fills = harness.opsOf('fillRect');
  assert.deepEqual(fills[0], {
    op: 'fillRect',
    x: 0,
    y: 0,
    width: 1344,
    height: 892,
    fillStyle: '#0b0c10',
  });
  assert.deepEqual(fills[1], {
    op: 'fillRect',
    x: 32,
    y: 32,
    width: 1280,
    height: 720,
    fillStyle: '#171922',
  });

  const draws = harness.opsOf('drawImage');
  assert.equal(draws.length, 1);
  assert.deepEqual(draws[0].args.slice(1), [0, 0, 1600, 900, 32, 32, 1280, 720]);

  const texts = harness.opsOf('fillText').map((entry) => entry.text);
  assert.deepEqual(texts, ['SHOT 01 · CU', 'LOW · 35mm', '城市全景推轨']);
  assert.equal(harness.opsOf('fillText')[0].font, '600 30px system-ui, sans-serif');
  assert.equal(record.imageClosed, 1);
  assert.equal(record.frameClosed, 1);
});

test('分镜导出：当帧画幅不同于单元格时按居中裁剪', async () => {
  const harness = createCanvasHarness({ mode: 'toBlob' });
  const result = await renderStoryboardGrid({
    shots: [shot()],
    renderFrame: async () => frameSource(1000, 1000),
    aspectRatio: '16:9',
    resolution: '720p',
    canvasFactory: harness.canvasFactory,
  });
  assert.equal(result.blob, harness.marker);
  assert.deepEqual(harness.opsOf('toBlob'), [{ op: 'toBlob', type: 'image/png', quality: 0.92 }]);
  const [draw] = harness.opsOf('drawImage');
  assert.equal(draw.args[1], 0);
  assert.equal(draw.args[2], 218.75);
  assert.equal(draw.args[3], 1000);
  assert.equal(draw.args[4], 562.5);
});

test('分镜导出：三分线与调色板开关生效', async () => {
  const harness = createCanvasHarness();
  await renderStoryboardGrid({
    shots: [shot({ shotAngle: 'HIGH', camera: { focalLength: 0 } })],
    renderFrame: async () => frameSource(1280, 720),
    aspectRatio: '16:9',
    resolution: '720p',
    includeThirds: true,
    includeShotNumber: false,
    palette: { background: '#000000' },
    canvasFactory: harness.canvasFactory,
  });
  assert.equal(harness.opsOf('fillRect')[0].fillStyle, '#000000');
  assert.equal(harness.opsOf('stroke').length, 1);
  assert.equal(harness.opsOf('moveTo').length, 4);
  assert.equal(harness.opsOf('lineTo').length, 4);
  assert.deepEqual(
    harness.opsOf('fillText').map((entry) => entry.text),
    ['HIGH'],
  );
  assert.equal(harness.opsOf('save').length, 1);
  assert.equal(harness.opsOf('restore').length, 1);
});

test('分镜导出：空镜占位不调用取帧', async () => {
  const harness = createCanvasHarness();
  let calls = 0;
  const progress = [];
  await renderStoryboardGrid({
    shots: [shot({ id: 'a' }), null, shot({ id: 'c' })],
    renderFrame: async () => {
      calls += 1;
      return frameSource(1280, 720);
    },
    columns: 3,
    aspectRatio: '16:9',
    resolution: '720p',
    canvasFactory: harness.canvasFactory,
    onProgress: (entry) => progress.push(entry),
  });
  assert.equal(calls, 2);
  assert.equal(progress.filter((entry) => entry.stage === 'rendering').length, 3);
  assert.deepEqual(
    progress.filter((entry) => entry.stage === 'rendering').map((entry) => entry.shotId),
    ['a', undefined, 'c'],
  );
  const fills = harness.opsOf('fillRect');
  assert.deepEqual(fills[3], {
    op: 'fillRect',
    x: 32 + 1304,
    y: 32,
    width: 1280,
    height: 828,
    fillStyle: '#171922',
  });
  assert.equal(harness.opsOf('fillText').filter((entry) => entry.text.startsWith('SHOT 02')).length, 0);
});

test('分镜导出：缺少参数与不可用能力时报错', async () => {
  const harness = createCanvasHarness();
  await assert.rejects(
    renderStoryboardGrid({ shots: [], renderFrame: async () => null }),
    /At least one shot is required for storyboard export\./,
  );
  await assert.rejects(
    renderStoryboardGrid({ shots: [null], renderFrame: async () => null }),
    /At least one shot is required for storyboard export\./,
  );
  await assert.rejects(
    renderStoryboardGrid({ shots: [shot()], renderFrame: null }),
    (error) => error instanceof TypeError && error.message === 'renderFrame must be a function.',
  );

  await assert.rejects(
    renderStoryboardGrid({
      shots: [shot()],
      renderFrame: async () => frameSource(1280, 720),
      canvasFactory: () => ({ getContext: () => null }),
    }),
    /2D canvas context is unavailable\./,
  );

  await assert.rejects(
    renderStoryboardGrid({
      shots: [shot()],
      renderFrame: async () => frameSource(1280, 720),
      canvasFactory: createCanvasHarness({ mode: 'none' }).canvasFactory,
    }),
    /Canvas blob encoding is unavailable in this runtime\./,
  );

  await assert.rejects(
    renderStoryboardGrid({
      shots: [shot()],
      renderFrame: async () => frameSource(1280, 720),
      canvasFactory: createCanvasHarness({ mode: 'toBlobNull' }).canvasFactory,
    }),
    /Canvas encoding failed\./,
  );

  assert.equal(harness.opsOf('drawImage').length, 0);
});

test('分镜导出：逐镜序列导出每镜单列网格', async () => {
  const harness = createCanvasHarness();
  const progress = [];
  const results = await renderStoryboardSequence({
    shots: [shot({ id: 's0' }), shot({ id: 's1' })],
    renderFrame: async (entry, info) => {
      assert.equal(info.total, 2);
      return frameSource(1280, 720);
    },
    aspectRatio: '16:9',
    resolution: '720p',
    canvasFactory: harness.canvasFactory,
    onProgress: (entry) => progress.push(entry),
  });
  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((entry) => entry.index),
    [0, 1],
  );
  assert.deepEqual(
    results.map((entry) => entry.shotId),
    ['s0', 's1'],
  );
  assert.equal(results[0].layout.columns, 1);
  assert.equal(results[0].blob, harness.marker);
  assert.deepEqual(progress[0], { stage: 'rendering', current: 0, total: 2, shotId: 's0' });
  assert.deepEqual(progress[2], { stage: 'complete', current: 1, total: 2, shotId: 's0' });
  assert.deepEqual(progress.at(-1), { stage: 'complete', current: 2, total: 2, shotId: 's1' });

  await assert.rejects(
    renderStoryboardSequence({ shots: [], renderFrame: async () => null }),
    /At least one shot is required for storyboard export\./,
  );
});
