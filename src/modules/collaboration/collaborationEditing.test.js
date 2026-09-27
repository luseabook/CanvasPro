import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationEditing } from './collaborationEditing.js';

const flushAll = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
};

function setup(over = {}) {
  const log = [];
  const notices = [];
  let changes = 0;
  const live = { value: true };
  const editable = { value: true };
  const editing = createCollaborationEditing({
    rpc: async (payload) => {
      log.push(['rpc', payload]);
      if (typeof over.rpc === 'function') return over.rpc(payload);
      return { ok: payload.action };
    },
    flush: async () => {
      log.push(['flush']);
      if (typeof over.flush === 'function') return over.flush();
    },
    canEdit: (ids) => ('canEdit' in over ? over.canEdit(ids) : editable.value),
    current: () => live.value,
    update: async (result) => log.push(['update', result]),
    notify: (message) => notices.push(message),
    onChange: () => changes++,
  });
  return { editing, log, notices, live, editable, changes: () => changes };
}

test('begin：当前不可编辑时立即拒绝并提示', async () => {
  const { editing, notices, editable, log } = setup();
  editable.value = false;
  const session = editing.begin(['n1']);
  assert.equal(session.pending, false);
  assert.equal(session.ready, false);
  assert.equal(await session.wait, false);
  assert.deepEqual(notices, ['节点正在被其他成员编辑，或当前画布不可编辑']);
  assert.equal(log.length, 0);
});

test('begin：先 flush 再 beginEdit，成功后 ready 并出现在 presence 中', async () => {
  const { editing, log } = setup();
  const session = editing.begin(['n1', 'n2']);
  assert.equal(session.ready, false);
  assert.equal(session.pending, true);
  assert.deepEqual(editing.pending(), ['n1', 'n2']);
  assert.deepEqual(editing.presence(), {});
  assert.equal(await session.wait, true);
  assert.equal(session.ready, true);
  assert.equal(session.pending, false);
  assert.equal(log[0][0], 'flush');
  const begin = log[1][1];
  assert.equal(begin.action, 'beginEdit');
  assert.deepEqual(begin.nodeIds, ['n1', 'n2']);
  assert.match(begin.editId, /^[0-9a-f-]{36}$/);
  assert.deepEqual(log[2], ['update', { ok: 'beginEdit' }]);
  assert.deepEqual(editing.presence(), { n1: begin.editId, n2: begin.editId });
  assert.deepEqual(editing.pending(), []);
});

test('allowed：需要已获取锁、会话有效、锁未过期且仍可编辑', async () => {
  const { editing, editable, live } = setup();
  const session = editing.begin(['n1']);
  assert.equal(session.allowed(), false);
  await session.wait;
  // 从未 refresh 过期时间时 expiresAt 为 undefined，比较结果为 false
  assert.equal(session.allowed(), false);
  const editId = Object.values(editing.presence())[0];
  editing.refresh({ n1: { editId, expiresAt: Date.now() / 1000 + 60 } });
  assert.equal(session.allowed(), true);
  editable.value = false;
  assert.equal(session.allowed(), false);
  editable.value = true;
  live.value = false;
  assert.equal(session.allowed(), false);
  live.value = true;
  editing.refresh({ n1: { editId, expiresAt: Date.now() / 1000 - 1 } });
  assert.equal(session.allowed(), false);
});

test('refresh：只更新本编辑 id 的锁，过期时间秒转毫秒', async () => {
  const { editing } = setup();
  const session = editing.begin(['n1']);
  await session.wait;
  editing.refresh({ n1: { editId: 'someone-else', expiresAt: 9e9 } });
  assert.equal(session.allowed(), false);
  editing.refresh(undefined);
  editing.refresh({ n1: { editId: Object.values(editing.presence())[0], expiresAt: Date.now() / 1000 + 5 } });
  assert.equal(session.allowed(), true);
});

test('canPreview：等待中且没有失败时可以预览', async () => {
  const { editing } = setup();
  const session = editing.begin(['n1']);
  assert.equal(session.canPreview(), true);
  await session.wait;
  // 获取完成后 pending 为 false，只看 allowed（尚无过期时间）
  assert.equal(session.canPreview(), false);
});

test('同一节点的多个会话共用一把锁；全部 finish 后才发 endEdit', async () => {
  const { editing, log } = setup();
  const a = editing.begin(['n1']);
  const b = editing.begin(['n1']);
  await Promise.all([a.wait, b.wait]);
  assert.equal(log.filter(([k, p]) => k === 'rpc' && p.action === 'beginEdit').length, 1);
  await a.finish();
  assert.equal(log.filter(([k, p]) => k === 'rpc' && p.action === 'endEdit').length, 0);
  await b.finish();
  await flushAll();
  const end = log.filter(([k, p]) => k === 'rpc' && p.action === 'endEdit');
  assert.equal(end.length, 1);
  assert.deepEqual(end[0][1].nodeIds, ['n1']);
  assert.deepEqual(editing.presence(), {});
  // finish 可以重复调用
  assert.equal(b.finish(), undefined);
});

test('finish：释放前先 flush，再发 endEdit 并 update 结果', async () => {
  const { editing, log } = setup();
  const session = editing.begin(['n1']);
  await session.wait;
  log.length = 0;
  await session.finish();
  await flushAll();
  assert.deepEqual(
    log.map(([k, p]) => (k === 'rpc' ? p.action : k)),
    ['flush', 'endEdit', 'update'],
  );
  assert.deepEqual(log[2], ['update', { ok: 'endEdit' }]);
});

test('finish 时 flush 失败只提示，仍然释放锁', async () => {
  let failFlush = false;
  const { editing, log, notices } = setup({
    flush: () => {
      if (failFlush) throw new Error('保存失败');
    },
  });
  const session = editing.begin(['n1']);
  await session.wait;
  failFlush = true;
  await session.finish();
  await flushAll();
  assert.deepEqual(notices, ['保存失败']);
  assert.ok(log.some(([k, p]) => k === 'rpc' && p.action === 'endEdit'));
});

test('beginEdit 失败时标记失败、提示并通知变化；wait 得 false；再次 begin 会重新申请', async () => {
  let fail = true;
  const { editing, notices, log } = setup({
    rpc: (p) => {
      if (fail && p.action === 'beginEdit') throw new Error('已被他人锁定');
      return { ok: p.action };
    },
  });
  const session = editing.begin(['n1']);
  assert.equal(await session.wait, false);
  assert.deepEqual(notices, ['已被他人锁定']);
  assert.equal(session.canPreview(), false);
  assert.deepEqual(editing.pending(), []);
  fail = false;
  const retry = editing.begin(['n1']);
  assert.equal(await retry.wait, true);
  assert.equal(log.filter(([k, p]) => k === 'rpc' && p.action === 'beginEdit').length, 2);
});

test('获取期间所有会话都已 finish 时不再发 beginEdit', async () => {
  let releaseFlush;
  let first = true;
  const { editing, log } = setup({
    flush: () => {
      if (first) {
        first = false;
        return new Promise((resolve) => (releaseFlush = resolve));
      }
    },
  });
  const session = editing.begin(['n1']);
  session.finish();
  // 获取任务在串行队列里异步开始，先让它走到 flush
  await flushAll();
  releaseFlush();
  assert.equal(await session.wait, false);
  await flushAll();
  assert.equal(log.filter(([k, p]) => k === 'rpc' && p.action === 'beginEdit').length, 0);
});

test('dispose：清空锁表，之后不再发送请求', async () => {
  const { editing, log } = setup();
  const session = editing.begin(['n1']);
  editing.dispose();
  assert.equal(await session.wait, false);
  assert.deepEqual(editing.presence(), {});
  assert.equal(log.filter(([k]) => k === 'rpc').length, 0);
  assert.equal(session.allowed(), false);
  assert.equal(session.canPreview(), false);
});

test('会话失效时 begin 被拒绝；锁过期后 begin 重新申请', async () => {
  const { editing, live, log } = setup();
  live.value = false;
  assert.equal(await editing.begin(['n1']).wait, false);
  live.value = true;
  const s = editing.begin(['n1']);
  await s.wait;
  const editId = Object.values(editing.presence())[0];
  editing.refresh({ n1: { editId, expiresAt: Date.now() / 1000 - 10 } });
  const again = editing.begin(['n1']);
  assert.equal(await again.wait, true);
  assert.equal(log.filter(([k, p]) => k === 'rpc' && p.action === 'beginEdit').length, 2);
});

test('onChange：begin 时通知一次，获取成功后再通知一次', async () => {
  const { editing, changes } = setup();
  const session = editing.begin(['n1']);
  assert.equal(changes(), 1);
  await session.wait;
  assert.equal(changes(), 2);
});
