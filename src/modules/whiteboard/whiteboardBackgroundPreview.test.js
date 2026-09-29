import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFastImagePreview,
  createImagePreviewFromDecodedImage,
  readImageFileHeaderSize,
  readImageHeaderSize,
} from '../../services/fastImagePreviewService.js';
import {
  createFastWhiteboardBackgroundPreview,
  createWhiteboardBackgroundPreviewFromDecodedImage,
  readWhiteboardImageFileHeaderSize,
  readWhiteboardImageHeaderSize,
} from './whiteboardBackgroundPreview.js';

test('whiteboardBackgroundPreview: 四个导出都是 fastImagePreviewService 的直通别名', () => {
  assert.equal(createFastWhiteboardBackgroundPreview, createFastImagePreview);
  assert.equal(createWhiteboardBackgroundPreviewFromDecodedImage, createImagePreviewFromDecodedImage);
  assert.equal(readWhiteboardImageFileHeaderSize, readImageFileHeaderSize);
  assert.equal(readWhiteboardImageHeaderSize, readImageHeaderSize);
});

test('whiteboardBackgroundPreview: 别名本身也是函数，可以直接调用', () => {
  for (const fn of [
    createFastWhiteboardBackgroundPreview,
    createWhiteboardBackgroundPreviewFromDecodedImage,
    readWhiteboardImageFileHeaderSize,
    readWhiteboardImageHeaderSize,
  ]) {
    assert.equal(typeof fn, 'function');
  }
});
