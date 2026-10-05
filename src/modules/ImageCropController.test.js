import test from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_CROP_MIN_SIZE, buildImageCropDragRect } from './ImageCropController.js';
const NODE = { x: 100, y: 50, width: 400, height: 300 };
(test('ImageCropController: Ctrl drag builds a normal crop rect', () => {
  const imageCropDragRect = buildImageCropDragRect({
    startPoint: { x: 120, y: 70 },
    currentPoint: { x: 260, y: 170 },
    node: NODE,
  });
  assert.deepEqual(imageCropDragRect, { rect: { x: 120, y: 70, w: 140, h: 100 }, isValid: true });
}),
  test('ImageCropController: Ctrl drag normalizes reverse direction', () => {
    const imageCropDragRect2 = buildImageCropDragRect({
      startPoint: { x: 300, y: 250 },
      currentPoint: { x: 180, y: 140 },
      node: NODE,
    });
    assert.deepEqual(imageCropDragRect2, { rect: { x: 180, y: 140, w: 120, h: 110 }, isValid: true });
  }),
  test('ImageCropController: Ctrl drag clamps the rect inside image bounds', () => {
    const imageCropDragRect3 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 600, y: 500 },
      node: NODE,
    });
    assert.deepEqual(imageCropDragRect3, { rect: { x: 120, y: 70, w: 380, h: 280 }, isValid: true });
  }),
  test('ImageCropController: Ctrl drag obeys the active aspect ratio', () => {
    const imageCropDragRect4 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 440, y: 370 },
      node: NODE,
      aspectRatio: 16 / 9,
    });
    (assert.equal(imageCropDragRect4.isValid, true),
      assert.equal(imageCropDragRect4.rect.x, 120),
      assert.equal(imageCropDragRect4.rect.y, 70),
      assert.equal(imageCropDragRect4.rect.w, 320),
      assert.equal(imageCropDragRect4.rect.h, 180));
  }),
  test('ImageCropController: Ctrl drag marks tiny selections invalid', () => {
    const imageCropDragRect5 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 120 + IMAGE_CROP_MIN_SIZE - 1, y: 70 + IMAGE_CROP_MIN_SIZE - 1 },
      node: NODE,
    });
    (assert.equal(imageCropDragRect5.isValid, false),
      assert.deepEqual(imageCropDragRect5.rect, { x: 120, y: 70, w: 19, h: 19 }));
  }));
