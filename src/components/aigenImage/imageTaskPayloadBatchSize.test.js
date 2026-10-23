import test from 'node:test';
import assert from 'node:assert/strict';
import { _imageTaskPayloadInternalsForTest as internals } from './taskOrchestrationModule.impl.js';

const { hasOwnObjectField, normalizeImageBatchSize, resolveImageNodeBatchSize } = internals;

test('imageTaskPayload: 只有自有属性才算「设置过」', () => {
  assert.equal(hasOwnObjectField({ batchSize: 1 }, 'batchSize'), true);
  assert.equal(hasOwnObjectField({}, 'batchSize'), false);
  assert.equal(
    hasOwnObjectField(Object.create({ batchSize: 2 }), 'batchSize'),
    false,
    '原型链上的不算'
  );
  assert.equal(hasOwnObjectField([], 'length'), false, '数组不算对象字段来源');
  assert.equal(hasOwnObjectField(null, 'batchSize'), false, '空值不能抛');
});

test('imageTaskPayload: 张数归一——非法值回退，不小于 1', () => {
  assert.equal(normalizeImageBatchSize(4, 1), 4);
  assert.equal(normalizeImageBatchSize('3', 1), 3, '字符串数字要能解析');
  assert.equal(normalizeImageBatchSize('3.9', 1), 3, 'parseInt 截断而不是四舍五入');
  assert.equal(normalizeImageBatchSize(0, 1), 1, '0 张无意义，回退');
  assert.equal(normalizeImageBatchSize(-2, 5), 5, '负数回退到上层给的默认值');
  assert.equal(normalizeImageBatchSize('abc', 2), 2);
  assert.equal(normalizeImageBatchSize(undefined, 2), 2);
});

test('imageTaskPayload: 批量张数按「参数 > 原始参数 > 节点数据」取，缺省 1', () => {
  assert.equal(
    resolveImageNodeBatchSize({ generationParams: { batchSize: 4 }, data: { batchSize: 2 } }),
    4,
    '清洗后的生成参数优先级最高'
  );
  assert.equal(
    resolveImageNodeBatchSize({ rawGenerationParams: { batchSize: 3 }, data: { batchSize: 2 } }),
    3,
    '原始参数次之'
  );
  assert.equal(resolveImageNodeBatchSize({ data: { batchSize: 2 } }), 2, '再次是节点数据');
  assert.equal(resolveImageNodeBatchSize({}), 1, '都没有就是 1 张');
  assert.equal(
    resolveImageNodeBatchSize({ generationParams: { batchSize: 0 }, data: { batchSize: 2 } }),
    2,
    '显式 0 视为非法，回退到下一层而不是当没设过'
  );
  assert.equal(
    resolveImageNodeBatchSize({ generationParams: {}, rawGenerationParams: { batchSize: '5' } }),
    5,
    '空对象不算设置过，继续往下找'
  );
});
