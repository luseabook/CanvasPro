import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateAgentMessageBody,
  createAgentConversationStreamingPresentation,
} from './agentConversationStreamingPresentation.js';

function makeElement(tag) {
  const el = {
    tagName: tag,
    _classes: [],
    textContent: '',
    innerHTML: '',
    attrs: {},
    dataset: {},
    children: [],
    removed: false,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    setAttribute(key, value) {
      this.attrs[key] = value;
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    appendChild(node) {
      this.children.push(node);
      return node;
    },
    insertBefore(node, ref) {
      const index = this.children.indexOf(ref);
      this.children.splice(index < 0 ? this.children.length : index, 0, node);
    },
    remove() {
      this.removed = true;
    },
    querySelector(selector) {
      return queryAll(this, selector)[0] || null;
    },
    querySelectorAll(selector) {
      return queryAll(this, selector);
    },
  };
  Object.defineProperty(el, 'className', {
    get: () => el._classes.join(' '),
    set: (value) => {
      el._classes = String(value).split(/\s+/).filter(Boolean);
    },
    enumerable: true,
  });
  Object.defineProperty(el, 'classList', {
    get: () => ({
      [Symbol.iterator]: () => el._classes[Symbol.iterator](),
      add: (cls) => {
        if (!el._classes.includes(cls)) el._classes.push(cls);
      },
      remove: (cls) => {
        el._classes = el._classes.filter((x) => x !== cls);
      },
      contains: (cls) => el._classes.includes(cls),
    }),
    enumerable: true,
  });
  return el;
}

function matchesClass(el, cls) {
  return String(el.className || '')
    .split(/\s+/)
    .includes(cls);
}

function walk(el, out) {
  for (const child of el.children || []) {
    out.push(child);
    walk(child, out);
  }
  return out;
}

function queryAll(root, selector) {
  const nodes = walk(root, []);
  if (selector.includes(':not(')) {
    const [, base, negated] = /^([^(]*):not\(([^)]*)\)$/.exec(selector);
    return nodes.filter((el) => matchesClass(el, base.slice(1)) && !matchesClass(el, negated.slice(1)));
  }
  if (selector.startsWith('.')) return nodes.filter((el) => matchesClass(el, selector.slice(1)));
  return nodes.filter((el) => el.tagName === selector);
}

function makeMessageNode(extraClass = '') {
  const el = makeElement('div');
  el.className = ('agent-message ' + extraClass).trim();
  const body = makeElement('div');
  body.className = 'agent-message-body';
  const time = makeElement('time');
  time.className = 'agent-message-time';
  el.children.push(body, time);
  el.agentMessageContent = '';
  el.agentMessageCopyText = '';
  return el;
}

function makeMessagesList() {
  const el = makeElement('div');
  el.className = 'agent-messages';
  el.scrollHeight = 500;
  el.clientHeight = 400;
  el.scrollTop = 100;
  return el;
}

function withFrameLoop(run) {
  const hadRaf = 'requestAnimationFrame' in globalThis;
  const hadCam = 'cancelAnimationFrame' in globalThis;
  const prevRaf = globalThis.requestAnimationFrame;
  const prevCam = globalThis.cancelAnimationFrame;
  const queue = [];
  const canceled = [];
  globalThis.requestAnimationFrame = (fn) => {
    queue.push(fn);
    return queue.length;
  };
  globalThis.cancelAnimationFrame = (id) => {
    canceled.push(id);
    queue[id - 1] = null;
  };
  const flush = () => {
    const pending = queue.splice(0, queue.length).filter((fn) => typeof fn === 'function');
    pending.forEach((fn) => fn());
    return pending.length;
  };
  const dropped = () => canceled.length;
  try {
    return run({ flush, dropped });
  } finally {
    if (hadRaf) globalThis.requestAnimationFrame = prevRaf;
    else delete globalThis.requestAnimationFrame;
    if (hadCam) globalThis.cancelAnimationFrame = prevCam;
    else delete globalThis.cancelAnimationFrame;
  }
}

test('消息体渲染：助手消息走 markdown 渲染写入 innerHTML', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: '**加粗**普通', itemId: 'a1', ts: 1767225600000 });
  const body = el.querySelector('.agent-message-body');
  assert.match(body.innerHTML, /<strong>加粗<\/strong>/);
  assert.equal(body.textContent, '');
});

test('消息体渲染：用户消息只写 textContent，markdown 标记原样保留（防注入）', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'user', content: '**加粗**<img src=x>' });
  const body = el.querySelector('.agent-message-body');
  assert.equal(body.textContent, '**加粗**<img src=x>');
  assert.equal(body.innerHTML, '');
});

test('消息体渲染：content 缺失时回落到 status 文本，两者皆无则空串', () => {
  const a = makeMessageNode();
  updateAgentMessageBody(a, { role: 'user', status: '正在思考' });
  assert.equal(a.querySelector('.agent-message-body').textContent, '正在思考');
  const b = makeMessageNode();
  updateAgentMessageBody(b, { role: 'user' });
  assert.equal(b.querySelector('.agent-message-body').textContent, '');
  assert.equal(b.agentMessageContent, '');
});

test('消息体渲染：文本未变则整体跳过重渲染，仅重复挂状态类（端口现状）', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: 'same', status: 'streaming' });
  const first = el.querySelector('.agent-message-body');
  const firstHtml = first.innerHTML;
  first.innerHTML = '被外部改写';
  updateAgentMessageBody(el, { role: 'assistant', content: 'same', status: 'streaming' });
  assert.equal(first.innerHTML, '被外部改写', '第二次调用不应重新渲染');
  assert.equal(firstHtml !== '被外部改写', true);
  assert.equal(el.agentMessageContent, 'same');
  assert.equal(el.agentMessageCopyText, 'same');
});

test('消息体渲染：缓存写在元素属性上，角色切换会因文本不同而重渲染', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: 'A' });
  assert.equal(el.agentMessageContent, 'A');
  updateAgentMessageBody(el, { role: 'user', content: 'B' });
  assert.equal(el.querySelector('.agent-message-body').textContent, 'B');
  assert.equal(el.agentMessageCopyText, 'B');
});

test('消息体渲染：状态类每次先全清再加，旧状态类不会残留', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: 'x', status: 'streaming' });
  assert.equal(matchesClass(el, 'agent-message--status-streaming'), true);
  updateAgentMessageBody(el, { role: 'assistant', content: 'y', status: 'failed' });
  assert.equal(matchesClass(el, 'agent-message--status-streaming'), false);
  assert.equal(matchesClass(el, 'agent-message--status-failed'), true);
  updateAgentMessageBody(el, { role: 'assistant', content: 'z' });
  assert.equal(matchesClass(el, 'agent-message--status-failed'), false);
  assert.equal(el.className, 'agent-message');
});

test('消息体渲染：非状态类（含 agent-message）不会被误清', () => {
  const el = makeMessageNode('agent-message--typing');
  updateAgentMessageBody(el, { role: 'assistant', content: 'x', status: 'chat' });
  assert.equal(matchesClass(el, 'agent-message'), true);
  assert.equal(matchesClass(el, 'agent-message--typing'), true);
  assert.equal(matchesClass(el, 'agent-message--status-chat'), true);
});

test('消息体渲染：messageId 直写 dataset，缺 itemId 时写成空串（端口现状）', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: 'x', itemId: 'm-9' });
  assert.equal(el.dataset.messageId, 'm-9');
  updateAgentMessageBody(el, { role: 'assistant', content: 'y' });
  assert.equal(el.dataset.messageId, '');
});

test('消息体渲染：每次都更新时间节点，时间戳非法时只清空不抛', () => {
  const el = makeMessageNode();
  updateAgentMessageBody(el, { role: 'assistant', content: 'x', ts: 1767225600000 });
  const time = el.querySelector('.agent-message-time');
  assert.equal(time.attrs.datetime, new Date(1767225600000).toISOString());
  assert.match(time.textContent, /^\d{1,2}:\d{2}$/);
  const next = makeMessageNode();
  updateAgentMessageBody(next, { role: 'assistant', content: 'y', ts: 0 });
  assert.deepEqual(next.querySelector('.agent-message-time').attrs, {});
});

test('消息体渲染：缺 body 子节点时抛 TypeError（端口现状：无空值保护）', () => {
  const bare = makeElement('div');
  bare.className = 'agent-message';
  bare.agentMessageContent = '';
  assert.equal(bare.querySelector('.agent-message-body'), null);
  assert.throws(() => updateAgentMessageBody(bare, { role: 'assistant', content: 'x' }), TypeError);
});

test('消息体渲染：缺 time 子节点时不抛，时间更新按 null 元素返回 false', () => {
  const noTime = makeElement('div');
  noTime.className = 'agent-message';
  const body = makeElement('div');
  body.className = 'agent-message-body';
  noTime.children.push(body);
  noTime.agentMessageContent = '';
  updateAgentMessageBody(noTime, { role: 'user', content: 'x', ts: 1767225600000 });
  assert.equal(body.textContent, 'x');
});

test('流式呈现：reconcile 少于现有节点时按位更新、多余节点移除，并回调 onSettled', () => {
  const messagesEl = makeMessagesList();
  const kept = makeMessageNode();
  const extra = makeMessageNode();
  messagesEl.children.push(kept, extra);
  let appended = 0;
  let settled = 0;
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry() {
      appended++;
      return makeMessageNode();
    },
    onSettled() {
      settled++;
    },
  });
  api.reconcile([{ role: 'user', content: 'new-first', itemId: 'k1' }]);
  assert.equal(appended, 0);
  assert.equal(settled, 1);
  assert.equal(kept.querySelector('.agent-message-body').textContent, 'new-first');
  assert.equal(extra.removed, true);
  assert.equal(kept.removed, false);
});

test('流式呈现：reconcile 超出已有节点时调用 appendEntry 补齐', () => {
  const messagesEl = makeMessagesList();
  messagesEl.children.push(makeMessageNode());
  const roles = [];
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry(msg) {
      roles.push(msg.role);
      const el = makeMessageNode();
      messagesEl.children.push(el);
      return el;
    },
  });
  api.reconcile([
    { role: 'user', content: 'u' },
    { role: 'assistant', content: 'a' },
    { role: 'user', content: 'u2' },
  ]);
  assert.deepEqual(roles, ['assistant', 'user']);
});

test('流式呈现：接近底部才自动滚到底，用户上翻时保持原滚动位置', () => {
  const near = makeMessagesList();
  near.scrollTop = 99;
  const nearApi = createAgentConversationStreamingPresentation({
    messagesEl: near,
    appendEntry: () => makeMessageNode(),
  });
  nearApi.reconcile([{ role: 'user', content: 'a' }]);
  assert.equal(near.scrollTop, 500, '距底 < 64px 时贴底');

  const far = makeMessagesList();
  far.scrollTop = 0;
  const farApi = createAgentConversationStreamingPresentation({
    messagesEl: far,
    appendEntry: () => makeMessageNode(),
  });
  farApi.reconcile([{ role: 'user', content: 'a' }]);
  assert.equal(far.scrollTop, 0, '用户在上方时保留位置');

  const edge = makeMessagesList();
  edge.scrollTop = 36;
  const edgeApi = createAgentConversationStreamingPresentation({
    messagesEl: edge,
    appendEntry: () => makeMessageNode(),
  });
  edgeApi.reconcile([{ role: 'user', content: 'a' }]);
  assert.equal(edge.scrollTop, 36, '距底恰好 64px 不算贴底（严格小于）');
});

test('流式呈现：start 只建状态不渲染，text 每帧只排一次 rAF', () => {
  const messagesEl = makeMessagesList();
  messagesEl.children.push(makeMessageNode());
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry: () => makeMessageNode(),
  });
  withFrameLoop(({ flush, dropped }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    assert.equal(flush(), 0);
    api.handle({ type: 'text', runId: 'r1', text: '第一段' });
    api.handle({ type: 'text', runId: 'r1', text: '第二段' });
    assert.equal(messagesEl.children.length, 1, '未 flush 前不产出节点');
    assert.equal(flush(), 1, '两次 text 只排一帧');
    assert.equal(dropped(), 0);
  });
});

test('流式呈现：流式条目插在 typing 占位之前，文本按最新值整段替换', () => {
  const messagesEl = makeMessagesList();
  const typed = makeMessageNode('agent-message--typing');
  typed.className = 'agent-message agent-message--typing';
  messagesEl.children.push(typed);
  const created = [];
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry() {
      const el = makeMessageNode();
      created.push(el);
      messagesEl.children.push(el);
      return el;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'r1', text: '半句' });
    flush();
    assert.equal(created.length, 1);
    assert.equal(messagesEl.children.indexOf(created[0]), 0, '插入到 typing 之前');
    assert.match(created[0].querySelector('.agent-message-body').innerHTML, /半句/);
    assert.equal(matchesClass(created[0], 'agent-message--status-streaming'), true);
    api.handle({ type: 'text', runId: 'r1', text: '完整句子' });
    flush();
    assert.equal(created.length, 1, '复用同一条目而非新建');
    assert.match(created[0].querySelector('.agent-message-body').innerHTML, /完整句子/);
    assert.equal(messagesEl.children.indexOf(created[0]), 0);
  });
});

test('流式呈现：非本次 runId 的 text / end 事件被静默忽略', () => {
  const messagesEl = makeMessagesList();
  let settled = 0;
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry: () => makeMessageNode(),
    onSettled() {
      settled++;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'other', text: '不该出现' });
    api.handle({ type: 'end', runId: 'other' });
    assert.equal(flush(), 0);
    assert.equal(settled, 0);
    api.handle({ type: 'unknown-kind', runId: 'r1' });
    assert.equal(settled, 0);
  });
});

test('流式呈现：end 无 discard 且无 revision 时保留预览并回调 onSettled', () => {
  const messagesEl = makeMessagesList();
  const created = [];
  let settled = 0;
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry() {
      const el = makeMessageNode();
      created.push(el);
      messagesEl.children.push(el);
      return el;
    },
    onSettled() {
      settled++;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'r1', text: '答案' });
    flush();
    api.handle({ type: 'end', runId: 'r1' });
    assert.equal(settled, 1);
    assert.equal(created[0].removed, false);
    api.handle({ type: 'text', runId: 'r1', text: '迟到文本' });
    assert.equal(flush(), 0, 'end 后状态已清空，晚到文本不再渲染');
  });
});

test('流式呈现：discard 或 revision 非零时预览条目被移除（端口现状：revision 从不清零）', () => {
  const messagesEl = makeMessagesList();
  const made = [];
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry() {
      const el = makeMessageNode();
      made.push(el);
      messagesEl.children.push(el);
      return el;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'r1', text: 'a' });
    flush();
    api.handle({ type: 'end', runId: 'r1', discard: true });
    assert.equal(made[0].removed, true);
    api.handle({ type: 'start', runId: 'r2', revision: 3 });
    api.handle({ type: 'text', runId: 'r2', text: 'b' });
    flush();
    api.handle({ type: 'end', runId: 'r2' });
    assert.equal(made[1].removed, true, '带 revision 的流式预览一律丢弃');
  });
});

test('流式呈现：end 带 history 时改走 reconcile 覆盖，onSettled 只在 reconcile 内回调一次', () => {
  const messagesEl = makeMessagesList();
  const kept = makeMessageNode();
  messagesEl.children.push(kept);
  let settled = 0;
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry() {
      const el = makeMessageNode();
      messagesEl.children.push(el);
      return el;
    },
    onSettled() {
      settled++;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'r1', text: 'stream' });
    flush();
    api.handle({
      type: 'end',
      runId: 'r1',
      history: [{ role: 'assistant', content: 'final', itemId: 'h1' }],
    });
    assert.equal(settled, 1, 'history 分支不直接回调，但 reconcile 内部会回调一次');
    assert.equal(kept.querySelector('.agent-message-body').innerHTML, '<p>final</p>');
    assert.equal(kept.dataset.messageId, 'h1');
  });
});

test('流式呈现：destroy 取消排队帧并清空状态', () => {
  const messagesEl = makeMessagesList();
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry: () => makeMessageNode(),
  });
  withFrameLoop(({ flush, dropped }) => {
    api.handle({ type: 'start', runId: 'r1', revision: 0 });
    api.handle({ type: 'text', runId: 'r1', text: 'x' });
    api.destroy();
    assert.equal(dropped(), 1);
    assert.equal(flush(), 0, '已排队的回调被替换后不再产出内容');
    api.handle({ type: 'text', runId: 'r1', text: 'y' });
    assert.equal(flush(), 0);
  });
});

test('流式呈现：未 start 直接 text / end 不建状态也不抛', () => {
  const messagesEl = makeMessagesList();
  let settled = 0;
  const api = createAgentConversationStreamingPresentation({
    messagesEl,
    appendEntry: () => makeMessageNode(),
    onSettled() {
      settled++;
    },
  });
  withFrameLoop(({ flush }) => {
    api.handle({ type: 'text', runId: 'r0', text: 'x' });
    assert.equal(flush(), 0);
    assert.equal(settled, 0);
  });
  assert.equal(
    (() => {
      try {
        api.handle({ type: 'end', runId: 'r0' });
        return 'ok';
      } catch {
        return 'throw';
      }
    })(),
    'ok',
  );
});
