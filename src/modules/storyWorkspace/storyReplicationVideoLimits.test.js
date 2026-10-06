import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_REPLICATION_MAX_VIDEO_BYTES,
  getStoryReplicationVideoMaxBytes,
  validateStoryReplicationVideoSize,
} from './storyReplicationVideoLimits.js';

// 上限按本仓 src/manifests 的真实模型声明判断：provider 为 volcengine 的模型放宽到 500MB
const MB = 1024 * 1024;

test('STORY_REPLICATION_MAX_VIDEO_BYTES：默认上限 100MB', () => {
  assert.equal(STORY_REPLICATION_MAX_VIDEO_BYTES, 100 * MB);
});

test('getStoryReplicationVideoMaxBytes：火山引擎模型 500MB，其余与未知模型 100MB', () => {
  assert.equal(getStoryReplicationVideoMaxBytes('volcengine/seedance-2.0'), 500 * MB);
  // 只看 provider，不看模型种类
  assert.equal(getStoryReplicationVideoMaxBytes('volcengine/seedream-5.0'), 500 * MB);
  assert.equal(getStoryReplicationVideoMaxBytes('apimart/doubao-seedance-2.0'), 100 * MB);
  assert.equal(getStoryReplicationVideoMaxBytes('no-such-model'), 100 * MB);
  assert.equal(getStoryReplicationVideoMaxBytes(), 100 * MB);
  // getModelManifest 只做精确查找，不带前缀的 id 查不到
  assert.equal(getStoryReplicationVideoMaxBytes('seedance-2.0'), 100 * MB);
  assert.equal(getStoryReplicationVideoMaxBytes('  volcengine/seedance-2.0  '), 500 * MB);
});

test('validateStoryReplicationVideoSize：不超过上限时通过，等于上限也通过', () => {
  assert.deepEqual(validateStoryReplicationVideoSize({ name: 'a.mp4', size: 100 * MB }), {
    ok: true,
    error: '',
  });
  assert.deepEqual(validateStoryReplicationVideoSize({ size: 1 }), { ok: true, error: '' });
  assert.deepEqual(validateStoryReplicationVideoSize(), { ok: true, error: '' });
});

test('validateStoryReplicationVideoSize：超过上限时返回带文件名和上限的提示', () => {
  assert.deepEqual(validateStoryReplicationVideoSize({ name: '原片.mp4', size: 100 * MB + 1 }), {
    ok: false,
    error: '“原片.mp4”超过 100MB 上限，请压缩视频后重试。',
  });
  assert.equal(
    validateStoryReplicationVideoSize({ size: 100 * MB + 1 }).error,
    '“原视频”超过 100MB 上限，请压缩视频后重试。',
  );
  assert.equal(
    validateStoryReplicationVideoSize({ name: 'big.mp4', size: 600 * MB }, 'volcengine/seedance-2.0').error,
    '“big.mp4”超过 500MB 上限，请压缩视频或选择支持更大文件的模型。',
  );
  assert.equal(validateStoryReplicationVideoSize({ size: 400 * MB }, 'volcengine/seedance-2.0').ok, true);
});

test('validateStoryReplicationVideoSize：size 按数字比较，无法转成数字时视为通过', () => {
  assert.equal(validateStoryReplicationVideoSize({ size: String(100 * MB + 1) }).ok, false);
  assert.equal(validateStoryReplicationVideoSize({ size: 'unknown' }).ok, true);
  assert.equal(validateStoryReplicationVideoSize({ size: undefined }).ok, true);
});
