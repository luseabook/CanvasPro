import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeStoryboard3DBackgroundImage,
  estimateStoryboard3DBackgroundPerspective,
  extractStoryboard3DFocalLength35mmFromExif,
} from './backgroundPerspectiveEstimator.js';

function closeTo(actual, expected, epsilon = 1e-9, label = '') {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${label} expected ${expected} ± ${epsilon}, received ${actual}`,
  );
}

function exifJpeg({ littleEndian = true, focalLength = 35, type = 3 } = {}) {
  const tiffBuffer = new ArrayBuffer(50);
  const tiff = new DataView(tiffBuffer);
  const tiffBytes = new Uint8Array(tiffBuffer);
  tiffBytes[0] = littleEndian ? 73 : 77;
  tiffBytes[1] = littleEndian ? 73 : 77;
  tiff.setUint16(2, 42, littleEndian);
  tiff.setUint32(4, 8, littleEndian);
  tiff.setUint16(8, 1, littleEndian);
  tiff.setUint16(10, 34665, littleEndian);
  tiff.setUint16(12, 4, littleEndian);
  tiff.setUint32(14, 1, littleEndian);
  tiff.setUint32(18, 32, littleEndian);
  tiff.setUint32(22, 0, littleEndian);
  tiff.setUint16(32, 1, littleEndian);
  tiff.setUint16(34, 41989, littleEndian);
  tiff.setUint16(36, type, littleEndian);
  tiff.setUint32(38, 1, littleEndian);
  if (type === 3) tiff.setUint16(42, focalLength, littleEndian);
  else tiff.setUint32(42, focalLength, littleEndian);
  tiff.setUint32(46, 0, littleEndian);

  const exifId = [69, 120, 105, 0x66, 0x00, 0x00];
  const app1Length = 2 + exifId.length + tiffBytes.length;
  const out = new Uint8Array(2 + 2 + app1Length + 2);
  out[0] = 0xff;
  out[1] = 216;
  out[2] = 0xff;
  out[3] = 225;
  out[4] = (app1Length >> 8) & 0xff;
  out[5] = app1Length & 0xff;
  out.set(exifId, 6);
  out.set(tiffBytes, 12);
  out[12 + tiffBytes.length] = 0xff;
  out[13 + tiffBytes.length] = 217;
  return out;
}

function rgba(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = typeof fill === 'function' ? fill(x, y) : fill;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
}

test('背景透视：从 JPEG EXIF 提取 35mm 等效焦距', () => {
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(exifJpeg()), 35);
  assert.equal(
    extractStoryboard3DFocalLength35mmFromExif(exifJpeg({ littleEndian: false, focalLength: 50 })),
    50,
  );
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(exifJpeg({ focalLength: 40, type: 4 })), 40);
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(exifJpeg({ focalLength: 0 })), null);
});

test('背景透视：EXIF 缺失或非法输入返回空', () => {
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(new Uint8Array(4)), null);
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(new Uint8Array(20)), null);
  const plainJpeg = new Uint8Array(24);
  plainJpeg[0] = 0xff;
  plainJpeg[1] = 216;
  plainJpeg[2] = 0xff;
  plainJpeg[3] = 224;
  plainJpeg[4] = 0x00;
  plainJpeg[5] = 0x04;
  plainJpeg[8] = 0xff;
  plainJpeg[9] = 217;
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(plainJpeg), null);
  assert.equal(extractStoryboard3DFocalLength35mmFromExif(null), null);
});

test('背景透视：无纹理画面回落中性视平线', () => {
  const result = estimateStoryboard3DBackgroundPerspective(rgba(64, 64, 128));
  assert.equal(result.horizonY, 0.5);
  assert.equal(result.horizonSlope, 0);
  assert.deepEqual(result.vanishingPoint, [0.5, 0.5]);
  assert.equal(result.horizontalFov, 60);
  closeTo(result.verticalFov, 60, 1e-9);
  assert.equal(result.cameraHeight, 1.6);
  assert.equal(result.imageWidth, 64);
  assert.equal(result.imageHeight, 64);
  assert.equal(result.calibrationMethod, 'local-image-estimate');
  assert.equal(result.calibrationConfidence, 0.2);
  assert.deepEqual(result.groundRegion, [
    [0, 0.5],
    [1, 0.5],
    [1, 1],
    [0, 1],
  ]);
});

test('背景透视：上下分界画面定位视平线', () => {
  const result = estimateStoryboard3DBackgroundPerspective(rgba(64, 64, (_x, y) => (y < 32 ? 0 : 255)));
  closeTo(result.horizonY, 0.5, 0.02);
  assert.equal(result.vanishingPoint[0], 0.5);
  assert.equal(result.calibrationMethod, 'local-image-estimate');
  closeTo(result.calibrationConfidence, 0.61, 0.01);
  assert.ok(result.calibrationConfidence <= 0.78);
});

test('背景透视：给定 35mm 焦距时按 EXIF 来源标定', () => {
  const result = estimateStoryboard3DBackgroundPerspective(rgba(64, 64, 128), {
    focalLength35mm: 35,
    sourceWidth: 1920,
    sourceHeight: 1080,
  });
  closeTo(Math.tan((result.horizontalFov * Math.PI) / 360), 18 / 35, 1e-12);
  assert.equal(result.calibrationMethod, 'exif-local-estimate');
  assert.equal(result.imageWidth, 1920);
  assert.equal(result.imageHeight, 1080);
  assert.ok(result.calibrationConfidence >= 0.2 && result.calibrationConfidence <= 0.9);
});

test('背景透视：图像数据缺失或过短抛类型错误', () => {
  assert.throws(() => estimateStoryboard3DBackgroundPerspective(null), TypeError);
  assert.throws(
    () => estimateStoryboard3DBackgroundPerspective({ width: 4, height: 4, data: new Uint8ClampedArray(10) }),
    /Background perspective estimation requires RGBA image data\./,
  );
});

function fakeDocument() {
  const calls = { drawImage: [], getImageData: [] };
  const context = {
    drawImage(...args) {
      calls.drawImage.push(args);
    },
    getImageData(...args) {
      calls.getImageData.push(args);
      return { data: new Uint8ClampedArray(args[2] * args[3] * 4), width: args[2], height: args[3] };
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  return { documentObject: { createElement: () => canvas }, canvas, calls };
}

test('背景透视：本地分析在缩略画布上取像素并释放位图', async () => {
  const { documentObject, canvas, calls } = fakeDocument();
  let receivedFile = null;
  let closed = false;
  const bitmap = { width: 8, height: 8, close: () => (closed = true) };
  const file = { type: 'image/png', name: 'bg.png' };
  const result = await analyzeStoryboard3DBackgroundImage(file, {
    documentObject,
    imageBitmapFactory: async (input) => {
      receivedFile = input;
      return bitmap;
    },
  });
  assert.equal(receivedFile, file);
  assert.equal(canvas.width, 8);
  assert.equal(canvas.height, 8);
  assert.deepEqual(calls.drawImage[0], [bitmap, 0, 0, 8, 8]);
  assert.deepEqual(calls.getImageData[0], [0, 0, 8, 8]);
  assert.equal(closed, true);
  assert.equal(result.imageWidth, 8);
  assert.equal(result.imageHeight, 8);
  assert.equal(result.horizonY, 0.5);
  assert.equal(result.calibrationMethod, 'local-image-estimate');
});

test('背景透视：本地分析读取 JPEG 焦距并标记来源', async () => {
  const { documentObject } = fakeDocument();
  const bitmap = { width: 8, height: 8, close() {} };
  const file = { type: 'image/jpeg', name: 'shot.jpg', arrayBuffer: async () => exifJpeg().buffer };
  const result = await analyzeStoryboard3DBackgroundImage(file, {
    documentObject,
    imageBitmapFactory: async () => bitmap,
  });
  assert.equal(result.calibrationMethod, 'exif-local-estimate');
  closeTo(Math.tan((result.horizontalFov * Math.PI) / 360), 18 / 35, 1e-12);
});

test('背景透视：本地分析对缺失文件与不支持环境报错', async () => {
  await assert.rejects(() => analyzeStoryboard3DBackgroundImage(null), /Background image file is required\./);
  await assert.rejects(
    () =>
      analyzeStoryboard3DBackgroundImage(
        { type: 'image/png' },
        { imageBitmapFactory: null, documentObject: {} },
      ),
    /当前浏览器不支持本地背景透视分析。/,
  );
});
