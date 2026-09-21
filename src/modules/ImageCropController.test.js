import test from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_CROP_MIN_SIZE, buildImageCropDragRect } from './ImageCropController.js';
const NODE = { x: 100, y: 50, width: 0x190, height: 0x12c };
(test('ImageCropController: Ctrl drag builds a normal crop rect', () => {
  const _0x546640 = buildImageCropDragRect({
    startPoint: { x: 120, y: 70 },
    currentPoint: { x: 0x104, y: 170 },
    node: NODE,
  });
  assert.deepEqual(_0x546640, { rect: { x: 120, y: 70, w: 140, h: 100 }, isValid: true });
}),
  test('ImageCropController: Ctrl drag normalizes reverse direction', () => {
    const _0x15928b = buildImageCropDragRect({
      startPoint: { x: 0x12c, y: 250 },
      currentPoint: { x: 180, y: 140 },
      node: NODE,
    });
    assert.deepEqual(_0x15928b, { rect: { x: 180, y: 140, w: 120, h: 110 }, isValid: true });
  }),
  test('ImageCropController: Ctrl drag clamps the rect inside image bounds', () => {
    const _0x5cef51 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 0x258, y: 0x1f4 },
      node: NODE,
    });
    assert.deepEqual(_0x5cef51, { rect: { x: 120, y: 70, w: 0x17c, h: 0x118 }, isValid: true });
  }),
  test('ImageCropController: Ctrl drag obeys the active aspect ratio', () => {
    const _0x2a4a29 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 0x1b8, y: 0x172 },
      node: NODE,
      aspectRatio: 16 / 9,
    });
    (assert.equal(_0x2a4a29.isValid, true),
      assert.equal(_0x2a4a29.rect.x, 120),
      assert.equal(_0x2a4a29.rect.y, 70),
      assert.equal(_0x2a4a29.rect.w, 0x140),
      assert.equal(_0x2a4a29.rect.h, 180));
  }),
  test('ImageCropController: Ctrl drag marks tiny selections invalid', () => {
    const _0x42abb = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 120 + IMAGE_CROP_MIN_SIZE - 1, y: 70 + IMAGE_CROP_MIN_SIZE - 1 },
      node: NODE,
    });
    (assert.equal(_0x42abb.isValid, false), assert.deepEqual(_0x42abb.rect, { x: 120, y: 70, w: 19, h: 19 }));
  }));
