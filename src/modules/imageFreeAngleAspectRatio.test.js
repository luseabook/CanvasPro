import test from 'node:test';
import assert from 'node:assert/strict';
import { pickClosestRatioForProviderModel } from '../../api/imageRatioPolicy.js';
import {
  resolveImageFreeAngleAspectRatio,
  resolveImageFreeAngleSourceSize,
} from './imageFreeAngleAspectRatio.js';

const pick = (width, height, extra = {}) =>
  pickClosestRatioForProviderModel({ provider: 'grsai', model: 'nano-banana', width, height, ...extra });

test('imageFreeAngleAspectRatio: 源尺寸按候选键的顺序取第一个正值', () => {
  assert.deepEqual(
    resolveImageFreeAngleSourceSize({ originalWidth: 0, imageWidth: 800, originalHeight: 600 }),
    { width: 800, height: 600 },
  );
  assert.deepEqual(
    resolveImageFreeAngleSourceSize({ imgWidth: 640, imgHeight: 480, naturalWidth: 9, naturalHeight: 9 }),
    { width: 640, height: 480 },
  );
});

test('imageFreeAngleAspectRatio: 节点上没有尺寸时回落到元素自然尺寸', () => {
  assert.deepEqual(
    resolveImageFreeAngleSourceSize({ width: 'x' }, { naturalWidth: 1024, naturalHeight: 768 }),
    { width: 1024, height: 768 },
  );
});

test('imageFreeAngleAspectRatio: 任一维度取不到正值就返回 null', () => {
  assert.equal(resolveImageFreeAngleSourceSize({}, { naturalWidth: 0 }), null);
  assert.equal(resolveImageFreeAngleSourceSize({ imageWidth: -5, imageHeight: 10 }), null);
  assert.equal(resolveImageFreeAngleSourceSize({ imageWidth: 'abc', imageHeight: 10 }), null);
  assert.equal(resolveImageFreeAngleSourceSize(), null);
});

test('imageFreeAngleAspectRatio: 具体比例标签原样返回并去掉空白', () => {
  assert.equal(resolveImageFreeAngleAspectRatio({ aspectRatio: ' 4:3 ' }), '4:3');
  assert.equal(resolveImageFreeAngleAspectRatio({ aspectRatio: '16:9' }), '16:9');
});

test('imageFreeAngleAspectRatio: 自适应标签按源尺寸挑选最接近的可用比例', () => {
  assert.equal(
    resolveImageFreeAngleAspectRatio({
      aspectRatio: 'auto',
      provider: 'grsai',
      model: 'nano-banana',
      sourceSize: { width: 1600, height: 900 },
    }),
    pick(1600, 900),
  );
  assert.equal(
    resolveImageFreeAngleAspectRatio({
      aspectRatio: '自适应',
      provider: 'grsai',
      model: 'nano-banana',
      sourceSize: { width: 900, height: 1600 },
    }),
    pick(900, 1600),
  );
});

test('imageFreeAngleAspectRatio: 空标签也按自适应处理', () => {
  assert.equal(
    resolveImageFreeAngleAspectRatio({
      provider: 'grsai',
      model: 'nano-banana',
      sourceSize: { width: 1000, height: 1000 },
    }),
    '1:1',
  );
});

test('imageFreeAngleAspectRatio: 没有源尺寸时按 0 宽高参与挑选', () => {
  assert.equal(
    resolveImageFreeAngleAspectRatio({ aspectRatio: 'auto', provider: 'grsai', model: 'nano-banana' }),
    pick(0, 0),
  );
});

test('imageFreeAngleAspectRatio: imageSize 会透传给比例策略', () => {
  const withSize = resolveImageFreeAngleAspectRatio({
    aspectRatio: 'auto',
    provider: 'grsai',
    model: 'nano-banana',
    imageSize: '4K',
    sourceSize: { width: 100, height: 100 },
  });
  assert.equal(withSize, pick(100, 100, { imageSize: '4K' }));
  assert.equal(withSize, '1:1');
});
