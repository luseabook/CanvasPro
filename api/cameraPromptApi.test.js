import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
(test('cameraPromptApi: 无 cameraAngle 时返回原 prompt', () => {
  (assert.equal(applyCameraAngleToPrompt('p', null), 'p'),
    assert.equal(applyCameraAngleToPrompt('', null), ''));
}),
  test('cameraPromptApi: 有 cameraAngle 且原 prompt 为空', () => {
    const _0x44668b = applyCameraAngleToPrompt('', { rotation: 0, pitch: 0, scale: 0.5 });
    assert.equal(_0x44668b, 'switch the camera perspective: wide shot, front view, eye-level shot');
  }),
  test('cameraPromptApi: 有 cameraAngle 且原 prompt 不为空会追加', () => {
    const _0x3345f6 = applyCameraAngleToPrompt('a prompt', { rotation: 0, pitch: 0, scale: 0.5 });
    assert.equal(_0x3345f6, 'switch the camera perspective: wide shot, front view, eye-level shot, a prompt');
  }));
