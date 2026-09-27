import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationReviewState } from './collaborationReviewState.js';

function setup(over = {}) {
  const calls = [];
  const changes = [];
  const comments = [];
  const replies = 'replies' in over ? [...over.replies] : [];
  const live = { value: true };
  const state = createCollaborationReviewState({
    rpc: async (payload) => {
      calls.push(payload);
      const reply = typeof over.rpc === 'function' ? over.rpc(payload) : replies.shift();
      if (reply instanceof Error) throw reply;
      return reply;
    },
    current: () => live.value,
    initialRevision: 'initialRevision' in over ? over.initialRevision : undefined,
    onChange: (s) => changes.push(structuredClone(s)),
    onComment: (a) => comments.push(a),
  });
  return { state, calls, changes, comments, live };
}
const review = (revision, activities = [], summaries = []) => ({ revision, summaries, activities });

test('createCollaborationReviewState：初始快照', () => {
  const { state } = setup();
  assert.deepEqual(state.snapshot(), {
    revision: -1,
    summaries: [],
    activities: [],
    loading: false,
    error: '',
  });
});

test('refresh：读取 reviewRead 并合并快照，先标 loading 再清除', async () => {
  const { state, calls, changes } = setup({ replies: [review(3, [], [{ nodeId: 'n' }])] });
  await state.refresh(0);
  assert.deepEqual(calls, [{ action: 'reviewRead' }]);
  assert.deepEqual(changes[0], { revision: -1, summaries: [], activities: [], loading: true, error: '' });
  assert.deepEqual(state.snapshot(), {
    revision: 3,
    summaries: [{ nodeId: 'n' }],
    activities: [],
    loading: false,
    error: '',
  });
});

test('refresh：已达到目标修订号时不再请求，force 为真时仍请求；非整数目标直接返回', async () => {
  const { state, calls } = setup({ replies: [review(5), review(5)] });
  await state.refresh(5);
  await state.refresh(4);
  assert.equal(calls.length, 1);
  await state.refresh(4, true);
  assert.equal(calls.length, 2);
  await state.refresh(1.5, true);
  await state.refresh('9', true);
  assert.equal(calls.length, 2);
});

test('refresh：返回修订号仍低于目标时循环读取', async () => {
  const { state, calls } = setup({ replies: [review(1), review(2), review(4)] });
  await state.refresh(3);
  assert.equal(calls.length, 3);
  assert.equal(state.snapshot().revision, 4);
});

test('refresh：并发调用共用进行中的请求，并把目标修订号提高', async () => {
  const replies = [review(2), review(6)];
  const gates = [];
  const { state, calls } = setup({
    rpc: () => {
      const next = replies.shift();
      return new Promise((resolve) => gates.push(() => resolve(next)));
    },
  });
  const first = state.refresh(1);
  const second = state.refresh(5);
  assert.equal(first, second);
  gates.shift()();
  await new Promise((r) => setImmediate(r));
  gates.shift()();
  await first;
  assert.equal(calls.length, 2);
  assert.equal(state.snapshot().revision, 6);
});

test('refresh：响应无效时写入错误文案；AbortError 不显示错误；有错误时下次仍会重读', async () => {
  const abort = new DOMException('Aborted', 'AbortError');
  const { state, calls } = setup({ replies: [{ revision: 1, summaries: [] }, abort, review(1)] });
  await state.refresh(0);
  assert.equal(state.snapshot().error, '协作动态响应无效');
  assert.equal(state.snapshot().loading, false);
  await state.refresh(0);
  assert.equal(state.snapshot().error, '');
  await state.refresh(0);
  assert.equal(calls.length, 3);
  assert.equal(state.snapshot().revision, 1);
});

test('refresh：没有初始修订号时首次读取只建立基线、不回调；之后只回调更晚的 comment/resolve，按 seq 升序', async () => {
  const activities = [
    { seq: 4, kind: 'resolve' },
    { seq: 2, kind: 'comment' },
    { seq: 3, kind: 'edit' },
    { seq: 1, kind: 'comment' },
    { seq: 5, kind: 'comment' },
  ];
  const noInitial = setup({ replies: [review(5, activities), review(7, [{ seq: 6, kind: 'comment' }])] });
  await noInitial.state.refresh(0);
  assert.deepEqual(noInitial.comments, []);
  await noInitial.state.refresh(7);
  assert.deepEqual(noInitial.comments, [{ seq: 6, kind: 'comment' }]);

  const withInitial = setup({
    initialRevision: 1,
    replies: [review(5, activities), review(6, [...activities, { seq: 6, kind: 'comment' }])],
  });
  await withInitial.state.refresh(0);
  assert.deepEqual(
    withInitial.comments.map((a) => a.seq),
    [2, 4, 5],
  );
  // 已回调过的不再重复
  await withInitial.state.refresh(6);
  assert.deepEqual(
    withInitial.comments.map((a) => a.seq),
    [2, 4, 5, 6],
  );
});

test('会话失效后 refresh 直接返回，进行中的结果不写入、不回调', async () => {
  let gate;
  const { state, changes, live } = setup({
    rpc: () => new Promise((resolve) => (gate = () => resolve(review(3)))),
  });
  const running = state.refresh(0);
  const before = changes.length;
  live.value = false;
  gate();
  await running;
  assert.equal(changes.length, before);
  assert.equal(state.snapshot().revision, -1);
  await state.refresh(10, true);
});

test('readChat、readNode：带上 action，会话失效时抛 AbortError', async () => {
  const { state, calls, live } = setup({ rpc: (p) => ({ ok: p.action }) });
  assert.deepEqual(await state.readChat({ after: 3, action: 'x' }), { ok: 'chatRead' });
  assert.deepEqual(await state.readChat(), { ok: 'chatRead' });
  assert.deepEqual(await state.readNode('n1'), { ok: 'commentRead' });
  assert.deepEqual(calls, [
    { after: 3, action: 'chatRead' },
    { action: 'chatRead' },
    { action: 'commentRead', nodeId: 'n1' },
  ]);
  live.value = false;
  await assert.rejects(state.readChat(), { name: 'AbortError' });
  await assert.rejects(state.readNode('n1'), { name: 'AbortError' });
});

test('write：发送写操作后按返回的修订号刷新动态，再返回写结果', async () => {
  const { state, calls } = setup({
    rpc: (p) => (p.action === 'reviewRead' ? review(8) : { revision: 8, id: 'c1' }),
  });
  assert.deepEqual(await state.write('commentAdd', { nodeId: 'n', body: 'hi', action: 'ignored' }), {
    revision: 8,
    id: 'c1',
  });
  // 调用方的 action 字段覆盖参数：参数展开在 action 之后
  assert.deepEqual(calls[0], { action: 'ignored', nodeId: 'n', body: 'hi' });
  assert.deepEqual(calls[1], { action: 'reviewRead' });
  assert.equal(state.snapshot().revision, 8);
});

test('write：会话失效时写前写后都抛 AbortError', async () => {
  const pre = setup({ rpc: () => ({ revision: 1 }) });
  pre.live.value = false;
  await assert.rejects(pre.state.write('x', {}), { name: 'AbortError' });
  assert.equal(pre.calls.length, 0);

  const post = setup({
    rpc: () => {
      post.live.value = false;
      return { revision: 1 };
    },
  });
  await assert.rejects(post.state.write('x', {}), { name: 'AbortError' });
});
