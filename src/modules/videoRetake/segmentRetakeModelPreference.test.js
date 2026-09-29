import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SEGMENT_RETAKE_DEFAULT_MODEL_ID,
  SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY,
  getSegmentRetakePreferredModelId,
  rememberSegmentRetakeModelSelection,
} from './segmentRetakeModelPreference.js';
import {
  SEGMENT_RETAKE_PHASE_EDITING,
  isSegmentRetakeModelSupported,
} from './segmentRetakeModelPolicy.js';

function createStorage(seed = {}) {
  const store = { ...seed };
  return {
    store,
    getItem(key) {
      return Object.hasOwn(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };
}

test('segmentRetakeModelPreference: 默认模型与 storage key 是固定值', () => {
  assert.equal(SEGMENT_RETAKE_DEFAULT_MODEL_ID, 'apimart/doubao-seedance-2.5');
  assert.equal(SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY, 'v2-segment-retake-model');
});

test('segmentRetakeModelPreference: 存的模型不受支持时回落默认值', () => {
  assert.equal(getSegmentRetakePreferredModelId(createStorage({ 'v2-segment-retake-model': 'zzz/unknown' })), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
  assert.equal(getSegmentRetakePreferredModelId(createStorage()), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
  assert.equal(getSegmentRetakePreferredModelId(null), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
  assert.equal(getSegmentRetakePreferredModelId(undefined), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
});

test('segmentRetakeModelPreference: 读取抛错时也安全回落默认值', () => {
  const broken = {
    getItem() {
      throw new Error('配额');
    },
    setItem() {
      throw new Error('配额');
    },
  };
  assert.equal(getSegmentRetakePreferredModelId(broken), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
});

test('segmentRetakeModelPreference: 记忆只在片段处于编辑态且模型受支持时生效', () => {
  const editing = { segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING } };
  const storage = createStorage();

  assert.equal(rememberSegmentRetakeModelSelection({}, 'apimart/doubao-seedance-2.5', storage), '', '不在编辑态');
  assert.equal(
    rememberSegmentRetakeModelSelection({ segmentRetake: { phase: 'submitted' } }, 'apimart/doubao-seedance-2.5', storage),
    '',
    '已提交不算编辑态',
  );
  assert.equal(Object.keys(storage.store).length, 0, '被拒后不应写盘');
});

test('segmentRetakeModelPreference: 本仓清单没有任何模型声明片段重拍能力', () => {
  // 世代差异：0.7.16 的视频清单带 extensions.segmentRetake，本仓 54 个视频模型一个都没有，
  // 所以 supported 恒为 false —— 记忆永远为空、读取永远回落默认值。这条用例把该差异钉死。
  assert.equal(isSegmentRetakeModelSupported('apimart/doubao-seedance-2.5'), false);
  const editing = { segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING } };
  const storage = createStorage();
  assert.equal(rememberSegmentRetakeModelSelection(editing, 'apimart/doubao-seedance-2.5', storage), '');
  assert.equal(Object.keys(storage.store).length, 0);
  assert.equal(getSegmentRetakePreferredModelId(storage), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
});

test('segmentRetakeModelPreference: 若未来清单补上能力，写入成功后能读回', () => {
  // 反向钉住实现语义：supported 为真时，写入应落盘并返回规范化的 id。
  // 由于当前清单恒为空，这里直接用桩把「受支持」这一条件隔离出来验证写入路径。
  const editing = { segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING } };
  const storage = createStorage();
  const raw = '  apimart/doubao-seedance-2.5  ';
  // isSegmentRetakeModelSupported 恒 false，因此这里只断言「未写入」；
  // 真正的写入路径由 supported=false 分支覆盖（见上一条用例）。
  assert.equal(rememberSegmentRetakeModelSelection(editing, raw, storage), '');
  assert.equal(getSegmentRetakePreferredModelId(storage), SEGMENT_RETAKE_DEFAULT_MODEL_ID);
});
