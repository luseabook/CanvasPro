import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeCurveVector,
  normalizeEasingCurve,
  sampleBezierEase,
  sampleSpatialCurve,
  smoothDirectorKeys,
} from './directorCurves.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('曲线向量归一化：仅接受长度为 3 的有限数组并返回副本', () => {
  assert.deepEqual(normalizeCurveVector([1, 2, 3]), [1, 2, 3]);
  const input = [1, 2, 3];
  assert.notEqual(normalizeCurveVector(input), input);
  assert.equal(normalizeCurveVector([1, 2]), undefined);
  assert.equal(normalizeCurveVector([1, 2, 3, 4]), undefined);
  assert.equal(normalizeCurveVector([1, 2, Number.NaN]), undefined);
  assert.equal(normalizeCurveVector('1,2,3'), undefined);
  assert.equal(normalizeCurveVector(null), undefined);
});

test('缓动曲线归一化：x 分量夹 0–1，y 分量夹 -4–4', () => {
  assert.deepEqual(normalizeEasingCurve([0.5, 2, 1.5, -5]), [0.5, 2, 1, -4]);
  assert.deepEqual(normalizeEasingCurve([-1, -9, 2, 9]), [0, -4, 1, 4]);
  assert.equal(normalizeEasingCurve([0, 0, 1]), undefined);
  assert.equal(normalizeEasingCurve([0, 0, 'a', 1]), undefined);
  assert.equal(normalizeEasingCurve(undefined), undefined);
});

test('贝塞尔缓动：端点直通，[0,0,1,1] 为恒等映射', () => {
  const linear = [0, 0, 1, 1];
  assert.equal(sampleBezierEase(0, linear), 0);
  assert.equal(sampleBezierEase(1, linear), 1);
  assert.equal(sampleBezierEase(-0.5, linear), -0.5);
  assert.equal(sampleBezierEase(1.5, linear), 1.5);
  close(sampleBezierEase(0.5, linear), 0.5, 1e-6);
  close(sampleBezierEase(0.25, linear), 0.25, 1e-6);
});

test('贝塞尔缓动：ease-in 在前半段推进更慢', () => {
  const easeIn = [0.42, 0, 1, 1];
  assert.ok(sampleBezierEase(0.5, easeIn) < 0.5);
  const easeOut = [0, 0, 0.58, 1];
  assert.ok(sampleBezierEase(0.5, easeOut) > 0.5);
});

test('空间曲线：无切线退化为线性插值', () => {
  const a = { value: [0, 10, -5] };
  const b = { value: [10, 0, 5] };
  assert.deepEqual(sampleSpatialCurve(a, b, 0), [0, 10, -5]);
  assert.deepEqual(sampleSpatialCurve(a, b, 1), [10, 0, 5]);
  assert.deepEqual(sampleSpatialCurve(a, b, 0.5), [5, 5, 0]);
  const quarter = sampleSpatialCurve(a, b, 0.25);
  close(quarter[0], 2.5);
  close(quarter[1], 7.5);
});

test('空间曲线：camera 模式读取 camera.position 而非 value', () => {
  const a = { camera: { position: [0, 0, 0] }, value: [9, 9, 9] };
  const b = { camera: { position: [4, 8, 0] } };
  assert.deepEqual(sampleSpatialCurve(a, b, 0.5, 'camera'), [2, 4, 0]);
});

test('空间曲线：显式切线参与三次插值', () => {
  const a = { value: [0, 0, 0], outTangent: [0, 0, 0] };
  const b = { value: [1, 0, 0], inTangent: [0, 0, 0] };
  const mid = sampleSpatialCurve(a, b, 0.5);
  close(mid[0], 0.5, 1e-9);
  const eased = sampleSpatialCurve(
    { value: [0, 0, 0], outTangent: [3, 0, 0] },
    { value: [1, 0, 0], inTangent: [-3, 0, 0] },
    0.5,
  );
  close(eased[0], 0.5, 1e-9);
  const bent = sampleSpatialCurve(
    { value: [0, 0, 0], outTangent: [9, 0, 0] },
    { value: [1, 0, 0], inTangent: [9, 0, 0] },
    0.5,
  );
  assert.ok(bent[0] > 1);
});

test('平滑关键帧：切线取前后邻居差值的 1/6 且互为相反数', () => {
  const normalize = (v) => v.map((n) => (n === 0 ? 0 : n));
  const keys = [{ value: [0, 0, 0] }, { value: [6, 12, 0] }, { value: [12, 0, 0] }];
  const out = smoothDirectorKeys(keys);
  assert.equal(out, keys);
  assert.deepEqual(keys[0].outTangent, [1, 2, 0]);
  assert.deepEqual(keys[1].outTangent, [2, 0, 0]);
  assert.deepEqual(keys[2].outTangent, [1, -2, 0]);
  assert.deepEqual(normalize(keys[1].inTangent), [-2, 0, 0]);
  assert.deepEqual(normalize(keys[2].inTangent), [-1, 2, 0]);
});

test('平滑关键帧：首尾以自身为邻居，camera 关键帧取 camera.position', () => {
  const keys = [{ camera: { position: [1, 0, 0] } }, { camera: { position: [3, 0, 0] } }];
  smoothDirectorKeys(keys);
  assert.deepEqual(keys[0].outTangent, [(3 - 1) / 6, 0, 0]);
  assert.deepEqual(keys[1].outTangent, [(3 - 1) / 6, 0, 0]);
  const single = [{ value: [5, 5, 5] }];
  smoothDirectorKeys(single);
  assert.deepEqual(single[0].outTangent, [0, 0, 0]);
});
