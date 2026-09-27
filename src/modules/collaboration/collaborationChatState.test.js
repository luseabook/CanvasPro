import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationChatState } from './collaborationChatState.js';

const flushAll = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
};

// 假会话：state 带 roomId、actorId、review.chatRevision；review.readChat/write 由测试控制
function createSession(over = {}) {
  const reads = [];
  const writes = [];
  const pages = 'pages' in over ? [...over.pages] : [];
  const session = {
    state: {
      roomId: 'roomId' in over ? over.roomId : 'room',
      actorId: 'actorId' in over ? over.actorId : 'me',
      review: { chatRevision: 'chatRevision' in over ? over.chatRevision : 0 },
    },
    review: {
      async readChat(params) {
        reads.push(params);
        const page = typeof over.readChat === 'function' ? over.readChat(params) : pages.shift();
        if (page instanceof Error) throw page;
        return page;
      },
      async write(action, payload) {
        writes.push([action, payload]);
        if (typeof over.write === 'function') return over.write(action, payload);
        return { revision: 1 };
      },
    },
  };
  return { session, reads, writes };
}
const msg = (seq, over = {}) => ({
  id: 'id' in over ? over.id : `m${seq}`,
  seq,
  actor: 'actor' in over ? over.actor : 'other',
  mentions: 'mentions' in over ? over.mentions : [],
  body: `b${seq}`,
});

function setup(sessionRef) {
  const changes = [];
  const mentions = [];
  const chat = createCollaborationChatState({
    getSession: () => sessionRef.current,
    onChange: (s) => changes.push(structuredClone(s)),
    onMention: (m) => mentions.push(m),
  });
  return { chat, changes, mentions };
}

test('初始快照；没有会话时 sync 不读取', async () => {
  const ref = { current: null };
  const { chat, changes } = setup(ref);
  assert.deepEqual(chat.snapshot(), {
    messages: [],
    body: '',
    nodeIds: [],
    mentions: [],
    loading: false,
    sending: false,
    error: '',
    unread: 0,
    mentioned: false,
    hasMore: false,
    revision: -1,
  });
  chat.sync();
  assert.equal(changes.length, 0);
});

test('sync：切到新会话后首读不带参数，记录 hasMore 和 chatRevision；首读消息不计未读', async () => {
  const { session, reads } = createSession({
    pages: [{ messages: [msg(2), msg(1)], hasMore: true, chatRevision: 2 }],
  });
  const ref = { current: session };
  const { chat, mentions } = setup(ref);
  chat.sync();
  await flushAll();
  assert.deepEqual(reads, [{}]);
  const snap = chat.snapshot();
  assert.deepEqual(
    snap.messages.map((m) => m.seq),
    [1, 2],
  );
  assert.equal(snap.hasMore, true);
  assert.equal(snap.revision, 2);
  assert.equal(snap.unread, 0);
  assert.equal(snap.loading, false);
  assert.deepEqual(mentions, []);
});

test('增量读取：带 after，他人消息计未读，提及自己时标记并回调；自己的消息不计未读', async () => {
  const { session, reads } = createSession({
    pages: [
      { messages: [], hasMore: false, chatRevision: 0 },
      {
        messages: [msg(1), msg(2, { actor: 'me' }), msg(3, { mentions: ['me'] })],
        hasMore: false,
        chatRevision: 3,
      },
    ],
  });
  const ref = { current: session };
  const { chat, mentions } = setup(ref);
  chat.sync();
  await flushAll();
  session.state.review.chatRevision = 3;
  chat.sync();
  await flushAll();
  assert.deepEqual(reads, [{}, { after: 0 }]);
  const snap = chat.snapshot();
  assert.equal(snap.unread, 2);
  assert.equal(snap.mentioned, true);
  assert.deepEqual(
    mentions.map((m) => m.seq),
    [3],
  );
});

test('增量读取遇到 hasMore 时按最后一条 seq 继续翻页，直到达到 chatRevision', async () => {
  const { session, reads } = createSession({
    pages: [
      { messages: [], hasMore: false, chatRevision: 0 },
      { messages: [msg(1), msg(2)], hasMore: true, chatRevision: 4 },
      { messages: [msg(3), msg(4)], hasMore: false, chatRevision: 4 },
    ],
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  session.state.review.chatRevision = 4;
  chat.sync();
  await flushAll();
  assert.deepEqual(reads, [{}, { after: 0 }, { after: 2 }]);
  assert.equal(chat.snapshot().revision, 4);
  assert.equal(chat.snapshot().messages.length, 4);
});

test('按 id 去重，按 seq 排序', async () => {
  const { session } = createSession({
    pages: [
      { messages: [msg(1), msg(3)], hasMore: false, chatRevision: 3 },
      { messages: [msg(3), msg(2)], hasMore: false, chatRevision: 4 },
    ],
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  session.state.review.chatRevision = 4;
  chat.sync();
  await flushAll();
  assert.deepEqual(
    chat.snapshot().messages.map((m) => m.id),
    ['m1', 'm2', 'm3'],
  );
});

test('setVisible(true)：清零未读和提及；可见期间新消息不计未读但仍回调提及', async () => {
  const { session } = createSession({
    pages: [
      { messages: [], hasMore: false, chatRevision: 0 },
      { messages: [msg(1, { mentions: ['me'] })], hasMore: false, chatRevision: 1 },
      { messages: [msg(2, { mentions: ['me'] })], hasMore: false, chatRevision: 2 },
    ],
  });
  const ref = { current: session };
  const { chat, mentions } = setup(ref);
  chat.sync();
  await flushAll();
  session.state.review.chatRevision = 1;
  chat.sync();
  await flushAll();
  assert.equal(chat.snapshot().unread, 1);
  chat.setVisible(true);
  assert.equal(chat.snapshot().unread, 0);
  assert.equal(chat.snapshot().mentioned, false);
  session.state.review.chatRevision = 2;
  chat.sync();
  await flushAll();
  assert.equal(chat.snapshot().unread, 0);
  assert.equal(chat.snapshot().mentioned, false);
  assert.equal(mentions.length, 2);
});

test('读取失败写入错误；有错误时 sync 不再自动重试，refresh 可手动重试', async () => {
  const { session, reads } = createSession({
    pages: [new Error('网络错误'), { messages: [], hasMore: false, chatRevision: 0 }],
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  assert.equal(chat.snapshot().error, '网络错误');
  assert.equal(chat.snapshot().loading, false);
  chat.sync();
  await flushAll();
  assert.equal(reads.length, 1);
  await chat.refresh();
  assert.equal(chat.snapshot().error, '');
  assert.equal(chat.snapshot().revision, 0);
  // 没有 message 的错误用默认文案
  const other = createSession({ pages: [{ nope: true }] });
  const r2 = setup({ current: other.session });
  r2.chat.sync();
  await flushAll();
  assert.match(r2.chat.snapshot().error, /./);
});

test('older：按最早一条 seq 向前翻页并插到前面；无更多或无消息时不读', async () => {
  const { session, reads } = createSession({
    pages: [
      { messages: [msg(5), msg(6)], hasMore: true, chatRevision: 6 },
      { messages: [msg(3), msg(4), msg(5)], hasMore: false, chatRevision: 6 },
    ],
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  await chat.older();
  assert.deepEqual(reads, [{}, { before: 5 }]);
  assert.deepEqual(
    chat.snapshot().messages.map((m) => m.seq),
    [3, 4, 5, 6],
  );
  assert.equal(chat.snapshot().hasMore, false);
  await chat.older();
  assert.equal(reads.length, 2);
});

test('edit：发送中拒绝修改，否则合并字段并通知', async () => {
  let release;
  const { session } = createSession({
    pages: [{ messages: [], hasMore: false, chatRevision: 0 }],
    write: () => new Promise((resolve) => (release = resolve)),
  });
  const ref = { current: session };
  const { chat, changes } = setup(ref);
  chat.sync();
  await flushAll();
  const before = changes.length;
  assert.equal(chat.edit({ body: 'hi', nodeIds: ['n1'] }), true);
  assert.equal(changes.length, before + 1);
  assert.equal(chat.snapshot().body, 'hi');
  const sending = chat.send();
  assert.equal(chat.snapshot().sending, true);
  assert.equal(chat.edit({ body: 'changed' }), false);
  release({ revision: 1 });
  await sending;
});

test('send：空内容不发送；成功后清空草稿并重新读取', async () => {
  const { session, writes, reads } = createSession({
    pages: [
      { messages: [], hasMore: false, chatRevision: 0 },
      { messages: [msg(1, { actor: 'me' })], hasMore: false, chatRevision: 1 },
    ],
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  chat.edit({ body: '   ' });
  assert.equal(await chat.send(), false);
  assert.equal(writes.length, 0);
  // 只有节点引用也可以发送；正文 trim
  chat.edit({ body: '  你好  ', nodeIds: ['n1'], mentions: ['u2'] });
  assert.equal(await chat.send(), true);
  assert.equal(writes.length, 1);
  const [action, payload] = writes[0];
  assert.equal(action, 'chatSend');
  assert.equal(payload.body, '你好');
  assert.deepEqual(payload.nodeIds, ['n1']);
  assert.deepEqual(payload.mentions, ['u2']);
  assert.match(payload.messageId, /^[0-9a-f-]{36}$/);
  const snap = chat.snapshot();
  assert.equal(snap.body, '');
  assert.deepEqual(snap.nodeIds, []);
  assert.deepEqual(snap.mentions, []);
  assert.equal(snap.sending, false);
  assert.deepEqual(reads, [{}, { after: 0 }]);
});

test('send：失败时保留草稿并写错误；内容不变重试时复用同一 messageId，内容变了换新 id', async () => {
  let fail = true;
  const { session, writes } = createSession({
    readChat: () => ({ messages: [], hasMore: false, chatRevision: 0 }),
    write: () => {
      if (fail) throw new Error('');
      return { revision: 1 };
    },
  });
  const ref = { current: session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  chat.edit({ body: 'x' });
  assert.equal(await chat.send(), false);
  assert.equal(chat.snapshot().error, '发送失败，请重试');
  assert.equal(chat.snapshot().body, 'x');
  assert.equal(await chat.send(), false);
  assert.equal(writes[0][1].messageId, writes[1][1].messageId);
  chat.edit({ body: 'y' });
  assert.equal(await chat.send(), false);
  assert.notEqual(writes[2][1].messageId, writes[1][1].messageId);
  fail = false;
  assert.equal(await chat.send(), true);
  assert.equal(writes[3][1].messageId, writes[2][1].messageId);
});

test('切换会话时按 roomId:actorId 保存草稿和失败指纹，切回时恢复', async () => {
  const a = createSession({
    roomId: 'r1',
    readChat: () => ({ messages: [], hasMore: false, chatRevision: 0 }),
    write: () => {
      throw new Error('x');
    },
  });
  const b = createSession({
    roomId: 'r2',
    readChat: () => ({ messages: [msg(1)], hasMore: false, chatRevision: 1 }),
  });
  const ref = { current: a.session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  chat.edit({ body: '草稿A', nodeIds: ['n1'], mentions: ['u'] });
  await chat.send();
  ref.current = b.session;
  chat.sync();
  await flushAll();
  assert.equal(chat.snapshot().body, '');
  assert.equal(chat.snapshot().messages.length, 1);
  ref.current = a.session;
  chat.sync();
  await flushAll();
  const snap = chat.snapshot();
  assert.equal(snap.body, '草稿A');
  assert.deepEqual(snap.nodeIds, ['n1']);
  assert.deepEqual(snap.mentions, ['u']);
  // 只恢复草稿和失败指纹；错误文案不保存，切回后为空
  assert.equal(snap.error, '');
  await chat.send();
  assert.equal(a.writes[0][1].messageId, a.writes[1][1].messageId);
});

test('切换会话后旧会话的读取结果被丢弃', async () => {
  let release;
  const a = createSession({ readChat: () => new Promise((resolve) => (release = resolve)) });
  const b = createSession({
    roomId: 'r2',
    readChat: () => ({ messages: [], hasMore: false, chatRevision: 0 }),
  });
  const ref = { current: a.session };
  const { chat } = setup(ref);
  chat.sync();
  await flushAll();
  ref.current = b.session;
  chat.sync();
  await flushAll();
  release({ messages: [msg(9)], hasMore: false, chatRevision: 9 });
  await flushAll();
  assert.equal(chat.snapshot().messages.length, 0);
  assert.equal(chat.snapshot().revision, 0);
});

test('destroy：之后不再通知、不再读取', async () => {
  const { session, reads } = createSession({
    readChat: () => ({ messages: [], hasMore: false, chatRevision: 0 }),
  });
  const ref = { current: session };
  const { chat, changes } = setup(ref);
  chat.destroy();
  chat.sync();
  await flushAll();
  assert.equal(reads.length, 0);
  // 切换会话那一步仍会重置快照，但不通知
  assert.equal(changes.length, 0);
  chat.setVisible(true);
  assert.equal(changes.length, 0);
});
