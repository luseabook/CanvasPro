import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeStoryboard3DBackgroundProjection,
  computeStoryboard3DFocalLengthFromHorizontalFov,
  computeStoryboard3DVerticalFov,
  deriveStoryboard3DBackgroundCamera,
  guardStoryboard3DBackgroundCameraChange,
  normalizeStoryboard3DBackgroundCalibration,
  normalizeStoryboard3DBackgroundCamera,
  setStoryboard3DBackgroundCameraLock,
  updateStoryboard3DBackgroundCalibration,
} from './backgroundCalibration.js';

function closeTo(actual, expected, epsilon = 1e-9, label = '') {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${label} expected ${expected} ± ${epsilon}, received ${actual}`,
  );
}

const DEG = Math.PI / 180;

test('背景标定：水平视场角换算垂直视场角保持投影不变', () => {
  const vertical = computeStoryboard3DVerticalFov(60, 16 / 9);
  closeTo(Math.tan((vertical * Math.PI) / 360), Math.tan(30 * DEG) / (16 / 9), 1e-12);
  closeTo(computeStoryboard3DVerticalFov(60, 1), 60, 1e-9);
  closeTo(computeStoryboard3DVerticalFov(5, 1), computeStoryboard3DVerticalFov(10, 1), 1e-9);
  closeTo(computeStoryboard3DVerticalFov(200, 1), computeStoryboard3DVerticalFov(170, 1), 1e-9);
  closeTo(computeStoryboard3DVerticalFov(60, 0), computeStoryboard3DVerticalFov(60, 0.1), 1e-9);
});

test('背景标定：水平视场角换算焦距并夹紧区间', () => {
  closeTo(computeStoryboard3DFocalLengthFromHorizontalFov(90), 18, 1e-9);
  closeTo(computeStoryboard3DFocalLengthFromHorizontalFov(60), 36 / (2 * Math.tan(30 * DEG)), 1e-9);
  closeTo(
    computeStoryboard3DFocalLengthFromHorizontalFov(5),
    computeStoryboard3DFocalLengthFromHorizontalFov(10),
    1e-9,
  );
  closeTo(
    computeStoryboard3DFocalLengthFromHorizontalFov(300),
    computeStoryboard3DFocalLengthFromHorizontalFov(170),
    1e-9,
  );
});

test('背景标定：默认标定结果与地面区域', () => {
  const normalized = normalizeStoryboard3DBackgroundCalibration();
  assert.deepEqual(normalized, {
    imageUrl: '',
    horizontalFov: 60,
    verticalFov: null,
    horizonY: 0.5,
    horizonSlope: 0,
    vanishingPoint: [0.5, 0.5],
    cameraHeight: 1.6,
    imageWidth: 0,
    imageHeight: 0,
    groundRegion: [
      [0, 0.5],
      [1, 0.5],
      [1, 1],
      [0, 1],
    ],
    calibrationMethod: 'manual',
    calibrationConfidence: 1,
    imageScale: 1,
    imageOffset: [0, 0],
    lockedCamera: false,
    lockedCameraSnapshot: null,
  });
  assert.equal('binaryAssetId' in normalized, false);
});

test('背景标定：各字段按区间夹紧并整数量化', () => {
  const upper = normalizeStoryboard3DBackgroundCalibration({
    horizontalFov: 200,
    verticalFov: 5,
    horizonY: 2,
    horizonSlope: -5,
    cameraHeight: 100,
    imageScale: 100,
    imageOffset: [5, -5],
    imageWidth: 100.6,
    imageHeight: -3,
  });
  assert.equal(upper.horizontalFov, 170);
  assert.equal(upper.verticalFov, 10);
  assert.equal(upper.horizonY, 1);
  assert.equal(upper.horizonSlope, -1);
  assert.equal(upper.cameraHeight, 20);
  assert.equal(upper.imageScale, 10);
  assert.deepEqual(upper.imageOffset, [2, -2]);
  assert.equal(upper.imageWidth, 101);
  assert.equal(upper.imageHeight, 0);

  const lower = normalizeStoryboard3DBackgroundCalibration({
    horizontalFov: 5,
    verticalFov: 500,
    horizonY: -1,
    horizonSlope: 9,
    cameraHeight: 0,
    imageScale: 0,
  });
  assert.equal(lower.horizontalFov, 10);
  assert.equal(lower.verticalFov, 170);
  assert.equal(lower.horizonY, 0);
  assert.equal(lower.horizonSlope, 1);
  assert.equal(lower.cameraHeight, 0.2);
  assert.equal(lower.imageScale, 0.1);
});

test('背景标定：二进制资源标识与标定来源归一化', () => {
  const withAsset = normalizeStoryboard3DBackgroundCalibration({ binaryAssetId: '  asset-9  ' });
  assert.equal(withAsset.binaryAssetId, 'asset-9');
  const blankAsset = normalizeStoryboard3DBackgroundCalibration({ binaryAssetId: '   ' });
  assert.equal('binaryAssetId' in blankAsset, false);

  assert.equal(
    normalizeStoryboard3DBackgroundCalibration({ calibrationMethod: ' exif ' }).calibrationMethod,
    'exif',
  );
  assert.equal(
    normalizeStoryboard3DBackgroundCalibration({ calibrationMethod: '' }).calibrationMethod,
    'manual',
  );
  assert.equal(normalizeStoryboard3DBackgroundCalibration({}).calibrationConfidence, 1);
  assert.equal(
    normalizeStoryboard3DBackgroundCalibration({ calibrationMethod: 'exif' }).calibrationConfidence,
    0,
  );
  assert.equal(
    normalizeStoryboard3DBackgroundCalibration({ calibrationMethod: 'exif', calibrationConfidence: 5 })
      .calibrationConfidence,
    1,
  );
  assert.equal(normalizeStoryboard3DBackgroundCalibration({ verticalFov: null }).verticalFov, null);
});

test('背景标定：自定义地面区域保留并夹紧，退化输入回落默认梯形', () => {
  const custom = normalizeStoryboard3DBackgroundCalibration({
    groundRegion: [
      [0.1, 0.2],
      [0.9, 0.2],
      [0.9, 0.8],
    ],
  });
  assert.deepEqual(custom.groundRegion, [
    [0.1, 0.2],
    [0.9, 0.2],
    [0.9, 0.8],
  ]);

  const clamped = normalizeStoryboard3DBackgroundCalibration({
    groundRegion: [
      [1.5, -0.5],
      [0.5, 0.5],
      [0.5, 0.5],
    ],
  });
  assert.deepEqual(clamped.groundRegion, [
    [1, 0],
    [0.5, 0.5],
    [0.5, 0.5],
  ]);

  const tooShort = normalizeStoryboard3DBackgroundCalibration({
    horizonY: 0.4,
    groundRegion: [
      [0, 0],
      [1, 0],
    ],
  });
  assert.deepEqual(tooShort.groundRegion, [
    [0, 0.4],
    [1, 0.4],
    [1, 1],
    [0, 1],
  ]);

  const longRegion = normalizeStoryboard3DBackgroundCalibration({
    groundRegion: Array.from({ length: 30 }, () => [0.5, 0.5]),
  });
  assert.equal(longRegion.groundRegion.length, 24);
});

test('背景相机：默认值与夹紧区间', () => {
  assert.deepEqual(normalizeStoryboard3DBackgroundCamera(), {
    position: [0, 1.6, 5],
    target: [0, 1.2, 0],
    focalLength: 50,
    fov: null,
    roll: 0,
    near: 0.1,
    far: 1000,
    aspectRatio: '16:9',
  });

  const clamped = normalizeStoryboard3DBackgroundCamera({
    position: [2],
    target: [1, 2, 3],
    focalLength: 1000,
    fov: 500,
    roll: 100,
    near: 0,
    far: 0,
    aspectRatio: '',
  });
  assert.deepEqual(clamped.position, [2, 1.6, 5]);
  assert.deepEqual(clamped.target, [1, 2, 3]);
  assert.equal(clamped.focalLength, 300);
  assert.equal(clamped.fov, 179);
  closeTo(clamped.roll, Math.PI, 1e-12);
  assert.equal(clamped.near, 0.001);
  assert.equal(clamped.far, 1);
  assert.equal(clamped.aspectRatio, '16:9');

  const lower = normalizeStoryboard3DBackgroundCamera({ focalLength: 0, fov: 0, roll: -100, near: -5 });
  assert.equal(lower.focalLength, 1);
  assert.equal(lower.fov, 1);
  closeTo(lower.roll, -Math.PI, 1e-12);
  assert.equal(lower.near, 0.001);

  assert.equal(normalizeStoryboard3DBackgroundCamera({ fov: null }).fov, null);
  assert.equal(normalizeStoryboard3DBackgroundCamera({ focalLength: 35, fov: 45 }).fov, 45);
});

test('背景相机推导：从标定重建机位与目标点', () => {
  const camera = deriveStoryboard3DBackgroundCamera(
    {
      horizontalFov: 90,
      horizonY: 0.5,
      horizonSlope: 0,
      cameraHeight: 1.6,
      imageWidth: 1920,
      imageHeight: 1080,
    },
    { target: [1, 2, 3], near: 0.5, far: 200, aspectRatio: '4:3' },
  );
  closeTo(camera.focalLength, 18, 1e-9);
  closeTo(Math.tan((camera.fov * Math.PI) / 360), Math.tan(45 * DEG) / (16 / 9), 1e-12);
  assert.deepEqual(camera.position, [1, 1.6, 13]);
  assert.deepEqual(camera.target, [1, 1.6, 3]);
  closeTo(camera.roll, 0, 1e-12);
  assert.equal(camera.near, 0.5);
  assert.equal(camera.far, 200);
  assert.equal(camera.aspectRatio, '4:3');

  const explicit = deriveStoryboard3DBackgroundCamera(
    { horizontalFov: 90, verticalFov: 40, cameraHeight: 1.8 },
    {},
  );
  assert.equal(explicit.fov, 40);
  assert.equal(explicit.position[1], 1.8);
});

test('背景标定更新：地平线变化时重建地面区域，显式传入则保留', () => {
  const base = {
    horizonY: 0.5,
    groundRegion: [
      [0, 0.1],
      [1, 0.1],
      [1, 0.9],
    ],
  };
  const movedHorizon = updateStoryboard3DBackgroundCalibration(base, { horizonY: 0.3 });
  assert.deepEqual(movedHorizon.groundRegion, [
    [0, 0.3],
    [1, 0.3],
    [1, 1],
    [0, 1],
  ]);

  const movedSlope = updateStoryboard3DBackgroundCalibration(base, { horizonSlope: 0.4 });
  assert.deepEqual(movedSlope.groundRegion, [
    [0, 0.3],
    [1, 0.7],
    [1, 1],
    [0, 1],
  ]);

  const explicit = updateStoryboard3DBackgroundCalibration(base, {
    horizonY: 0.3,
    groundRegion: [
      [0.2, 0.3],
      [0.8, 0.3],
      [0.8, 0.9],
    ],
  });
  assert.deepEqual(explicit.groundRegion, [
    [0.2, 0.3],
    [0.8, 0.3],
    [0.8, 0.9],
  ]);

  const untouched = updateStoryboard3DBackgroundCalibration(base, { cameraHeight: 2 });
  assert.deepEqual(untouched.groundRegion, base.groundRegion);
  assert.equal(untouched.cameraHeight, 2);
  assert.deepEqual(updateStoryboard3DBackgroundCalibration(base, {}).groundRegion, base.groundRegion);
});

test('背景相机锁：设置与解除均归一化快照', () => {
  const locked = setStoryboard3DBackgroundCameraLock({}, true, { position: [1, 2, 3], focalLength: 35 });
  assert.equal(locked.lockedCamera, true);
  assert.deepEqual(locked.lockedCameraSnapshot.position, [1, 2, 3]);
  assert.deepEqual(locked.lockedCameraSnapshot.target, [0, 1.2, 0]);
  assert.equal(locked.lockedCameraSnapshot.focalLength, 35);

  const released = setStoryboard3DBackgroundCameraLock(
    { lockedCamera: true, lockedCameraSnapshot: {} },
    false,
  );
  assert.equal(released.lockedCamera, false);
  assert.equal(released.lockedCameraSnapshot, null);

  const loose = setStoryboard3DBackgroundCameraLock({}, 1, {});
  assert.equal(loose.lockedCamera, false);
  assert.equal(loose.lockedCameraSnapshot, null);
});

test('背景相机守卫：未锁或一致时放行，不一致时回退快照', () => {
  const unlocked = guardStoryboard3DBackgroundCameraChange({}, { position: [9, 9, 9] });
  assert.equal(unlocked.allowed, true);
  assert.deepEqual(unlocked.camera.position, [9, 9, 9]);
  assert.equal(unlocked.reason, '');

  const noSnapshot = guardStoryboard3DBackgroundCameraChange({ lockedCamera: true }, {});
  assert.equal(noSnapshot.allowed, true);

  const camera = { position: [0, 1.6, 10], target: [0, 1.6, 0], focalLength: 18, roll: 0 };
  const calibration = setStoryboard3DBackgroundCameraLock({}, true, camera);
  assert.equal(guardStoryboard3DBackgroundCameraChange(calibration, camera).allowed, true);
  assert.equal(
    guardStoryboard3DBackgroundCameraChange(calibration, { ...camera, focalLength: 18 + 5e-7 }).allowed,
    true,
  );

  const blocked = guardStoryboard3DBackgroundCameraChange(calibration, { ...camera, position: [0, 1.6, 11] });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, '背景相机已锁定；请先解除锁定再修改机位、焦距或画幅。');
  assert.deepEqual(blocked.camera, calibration.lockedCameraSnapshot);

  assert.equal(
    guardStoryboard3DBackgroundCameraChange(calibration, { ...camera, focalLength: 18.001 }).allowed,
    false,
  );
  assert.equal(
    guardStoryboard3DBackgroundCameraChange(calibration, { ...camera, aspectRatio: '4:3' }).allowed,
    false,
  );
});

test('背景投影：默认画幅下的像素级几何量', () => {
  const projection = computeStoryboard3DBackgroundProjection({});
  closeTo(projection.focalPixels, 1920 / (2 * Math.tan(30 * DEG)), 1e-9);
  assert.equal(projection.horizonY, 540);
  assert.deepEqual(projection.horizonLine, [
    [0, 540],
    [1920, 540],
  ]);
  assert.deepEqual(projection.vanishingPoint, [960, 540]);
  assert.deepEqual(projection.groundRegion, [
    [0, 540],
    [1920, 540],
    [1920, 1080],
    [0, 1080],
  ]);
  assert.equal(projection.calibrationConfidence, 1);
  assert.equal(projection.imageScale, 1);
  assert.deepEqual(projection.imageOffsetPixels, [0, 0]);
});

test('背景投影：自定义画幅下按比例输出', () => {
  const projection = computeStoryboard3DBackgroundProjection(
    {
      horizonY: 0.5,
      horizonSlope: 0.2,
      vanishingPoint: [0.25, 0.75],
      imageOffset: [0.5, -0.5],
      imageScale: 2,
    },
    { width: 800, height: 600 },
  );
  closeTo(projection.focalPixels, 800 / (2 * Math.tan(30 * DEG)), 1e-9);
  assert.equal(projection.horizonY, 300);
  assert.deepEqual(projection.horizonLine, [
    [0, 240],
    [800, 360],
  ]);
  assert.deepEqual(projection.vanishingPoint, [200, 450]);
  assert.deepEqual(projection.groundRegion, [
    [0, 240],
    [800, 360],
    [800, 600],
    [0, 600],
  ]);
  assert.equal(projection.imageScale, 2);
  assert.deepEqual(projection.imageOffsetPixels, [400, -300]);
});
