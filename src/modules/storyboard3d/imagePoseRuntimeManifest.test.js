import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_IMAGE_POSE_RUNTIME,
  validateStoryboard3DImagePoseFile,
} from './imagePoseRuntimeManifest.js';

const MAX_BYTES = 24 * 1024 * 1024;

test('姿态运行时清单：常量冻结且数值与协议一致', () => {
  assert.ok(Object.isFrozen(STORYBOARD_3D_IMAGE_POSE_RUNTIME));
  assert.equal(STORYBOARD_3D_IMAGE_POSE_RUNTIME.id, 'mediapipe-pose-landmarker-heavy-v1');
  assert.equal(STORYBOARD_3D_IMAGE_POSE_RUNTIME.adapterType, 'localRuntime');
  assert.equal(STORYBOARD_3D_IMAGE_POSE_RUNTIME.version, '0.10.35');
  assert.equal(STORYBOARD_3D_IMAGE_POSE_RUNTIME.maxPoses, 1);
  assert.deepEqual(STORYBOARD_3D_IMAGE_POSE_RUNTIME.input.accept, ['image/jpeg', 'image/png', 'image/webp']);
  assert.equal(STORYBOARD_3D_IMAGE_POSE_RUNTIME.input.maxBytes, MAX_BYTES);
  assert.deepEqual(STORYBOARD_3D_IMAGE_POSE_RUNTIME.options, {
    runningMode: 'IMAGE',
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
});

test('姿态图片校验：接受三种类型并回填归一化类型与字节数', () => {
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'image/png', size: 100 }), {
    type: 'image/png',
    size: 100,
  });
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'image/webp', size: '2048' }), {
    type: 'image/webp',
    size: 2048,
  });
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'IMAGE/JPEG', size: 1 }), {
    type: 'image/jpeg',
    size: 1,
  });
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'image/jpg', size: 1 }), {
    type: 'image/jpeg',
    size: 1,
  });
});

test('姿态图片校验：缺类型时按扩展名推断', () => {
  for (const [name, expected] of [
    ['a.png', 'image/png'],
    ['a.JPEG', 'image/jpeg'],
    ['a.jpeg', 'image/jpeg'],
    ['b.webp', 'image/webp'],
  ])
    assert.equal(validateStoryboard3DImagePoseFile({ name, size: 10 }).type, expected);
});

test('姿态图片校验：显式类型优先于扩展名', () => {
  assert.throws(
    () => validateStoryboard3DImagePoseFile({ type: 'application/octet-stream', name: 'a.png', size: 10 }),
    (error) => error.code === 'POSE_IMAGE_TYPE_UNSUPPORTED',
  );
});

test('姿态图片校验：不支持的类型与推断失败均抛错', () => {
  for (const file of [
    { type: 'image/gif', size: 10 },
    { type: 'video/mp4', size: 10 },
    { name: 'a.txt', size: 10 },
    { name: 'noext', size: 10 },
    {},
  ])
    assert.throws(
      () => validateStoryboard3DImagePoseFile(file),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, '请选择 JPG、PNG 或 WebP 图片。');
        assert.equal(error.code, 'POSE_IMAGE_TYPE_UNSUPPORTED');
        return true;
      },
    );
});

test('姿态图片校验：空文件与非正字节数抛空图错误', () => {
  for (const size of [0, undefined, 'abc', -5, null])
    assert.throws(
      () => validateStoryboard3DImagePoseFile({ type: 'image/png', size }),
      (error) => {
        assert.equal(error.message, '图片为空或无法读取。');
        assert.equal(error.code, 'POSE_IMAGE_EMPTY');
        return true;
      },
    );
});

test('姿态图片校验：超限报 24 MB，边界值放行', () => {
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'image/png', size: MAX_BYTES }), {
    type: 'image/png',
    size: MAX_BYTES,
  });
  assert.throws(
    () => validateStoryboard3DImagePoseFile({ type: 'image/png', size: MAX_BYTES + 1 }),
    (error) => {
      assert.equal(error.message, '图片不能超过 24 MB。');
      assert.equal(error.code, 'POSE_IMAGE_TOO_LARGE');
      return true;
    },
  );
});

test('姿态图片校验：可注入自定义清单以覆盖类型与体积上限', () => {
  const custom = { input: { accept: ['image/png'], maxBytes: 10 } };
  assert.deepEqual(validateStoryboard3DImagePoseFile({ type: 'image/png', size: 10 }, custom), {
    type: 'image/png',
    size: 10,
  });
  assert.throws(
    () => validateStoryboard3DImagePoseFile({ type: 'image/jpeg', size: 1 }, custom),
    (error) => error.code === 'POSE_IMAGE_TYPE_UNSUPPORTED',
  );
  assert.throws(
    () => validateStoryboard3DImagePoseFile({ type: 'image/png', size: 11 }, custom),
    (error) => error.code === 'POSE_IMAGE_TOO_LARGE',
  );
});
