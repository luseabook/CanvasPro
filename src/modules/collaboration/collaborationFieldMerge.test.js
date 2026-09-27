import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCollaborationFields } from './collaborationFieldMerge.js';

// 三方合并：base 为共同祖先，remote 为他人修改，local 为本地修改；相等性按 JSON 序列化比较

test('mergeCollaborationFields：本地未改或两边改成一样时取本地，并返回深拷贝', () => {
  const local = { a: { b: 1 } };
  const same = mergeCollaborationFields({ a: { b: 1 } }, { a: { b: 1 } }, local);
  assert.deepEqual(same, { a: { b: 1 } });
  assert.notEqual(same, local);
  assert.notEqual(same.a, local.a);
  // local 与 remote 相同
  assert.deepEqual(mergeCollaborationFields(1, 2, 2), 2);
});

test('mergeCollaborationFields：本地未改而远端改了时取远端深拷贝', () => {
  const remote = { x: [1, 2] };
  const out = mergeCollaborationFields({ x: [1] }, remote, { x: [1] });
  assert.deepEqual(out, { x: [1, 2] });
  assert.notEqual(out.x, remote.x);
  assert.equal(mergeCollaborationFields('a', 'b', 'a'), 'b');
});

test('mergeCollaborationFields：对象逐键合并，不同键的修改互不冲突', () => {
  const out = mergeCollaborationFields(
    { title: 't', width: 100, keep: 1 },
    { title: 't2', width: 100, keep: 1 },
    { title: 't', width: 200, keep: 1, localOnly: true },
  );
  assert.deepEqual(out, { title: 't2', width: 200, keep: 1, localOnly: true });
});

test('mergeCollaborationFields：远端删掉的键在合并结果里删除', () => {
  const out = mergeCollaborationFields({ a: 1, b: 2 }, { a: 1 }, { a: 5, b: 2 });
  assert.deepEqual(out, { a: 5 });
  assert.equal(Object.hasOwn(out, 'b'), false);
});

test('mergeCollaborationFields：嵌套对象递归合并', () => {
  const out = mergeCollaborationFields(
    { style: { color: 'red', size: 1 } },
    { style: { color: 'blue', size: 1 } },
    { style: { color: 'red', size: 2 } },
  );
  assert.deepEqual(out, { style: { color: 'blue', size: 2 } });
});

test('mergeCollaborationFields：同一标量两边改成不同值时抛 EDIT_CONFLICT', () => {
  assert.throws(
    () => mergeCollaborationFields({ a: 1 }, { a: 2 }, { a: 3 }),
    (err) => err.code === 'EDIT_CONFLICT' && err.message === '同一字段存在不同修改',
  );
  // 数组不按对象逐键合并
  assert.throws(() => mergeCollaborationFields([1], [2], [3]), { code: 'EDIT_CONFLICT' });
  // 一边是对象、一边是数组也算冲突
  assert.throws(() => mergeCollaborationFields({}, [1], { a: 1 }), { code: 'EDIT_CONFLICT' });
});
