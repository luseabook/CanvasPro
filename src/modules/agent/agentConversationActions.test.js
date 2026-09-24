import test from 'node:test';
import assert from 'node:assert/strict';

class El {
  constructor(tag) {
    this.tagName = tag;
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.rows = 0;
    this.type = '';
    this.disabled = false;
    this.title = '';
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.handlers = {};
    this.focusCount = 0;
  }
  get classList() {
    return {
      contains: (name) => this.className.split(/\s+/).includes(name),
    };
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this;
      this.children.push(node);
    }
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }
  addEventListener(type, handler) {
    (this.handlers[type] || (this.handlers[type] = [])).push(handler);
  }
  dispatch(type, event = {}) {
    const payload = { stopPropagation() {}, ...event };
    for (const handler of this.handlers[type] || []) handler(payload);
  }
  click() {
    this.dispatch('click');
  }
  focus() {
    this.focusCount += 1;
  }
  descendants() {
    const out = [];
    const walk = (node) => {
      for (const child of node.children) {
        out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }
  matchesSelector(selector) {
    const [, classes, excluded] = /^\.([^(:]+)(?::not\(\.([^)]+)\))?$/.exec(selector) || [];
    if (!classes) return false;
    const owned = this.className.split(/\s+/);
    if (!classes.split('.').every((name) => owned.includes(name))) return false;
    return excluded ? !owned.includes(excluded) : true;
  }
  querySelectorAll(selector) {
    return this.descendants().filter((node) => node.matchesSelector(selector));
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

globalThis.document = { createElement: (tag) => new El(tag) };

const { createAgentConversationActions } = await import('./agentConversationActions.js');
const { agentIconSvg } = await import('./agentPanelElements.js');

function assistantMessage(over = {}) {
  return {
    role: 'assistant',
    content: '回答一',
    status: 'chat',
    assistantContext: { skillIds: [] },
    itemId: 'm2',
    ts: 20,
    ...over,
  };
}

const userMessage = { role: 'user', content: '画一只猫', ts: 10 };

function make(over = {}) {
  const messagesEl = new El('div');
  const userEl = new El('div');
  userEl.className = 'agent-message';
  const footer = new El('div');
  footer.className = 'agent-message-footer';
  userEl.append(footer);
  const assistantEl = new El('div');
  assistantEl.className = 'agent-message';
  messagesEl.append(userEl, assistantEl);

  const history = 'history' in over ? over.history : [userMessage, assistantMessage()];
  const state = { busy: over.busy || false };
  const calls = {
    setBusy: [],
    notice: [],
    results: [],
    revise: [],
    selectVersion: [],
    removedWaiting: [],
    applies: [],
    errors: [],
  };
  const waiting = new El('div');
  waiting.className = 'agent-message--typing';
  const presentation = over.presentation || {
    appendWaiting: () => {
      messagesEl.append(waiting);
      return waiting;
    },
    removeWaiting: (node) => {
      calls.removedWaiting.push(node);
      node.remove();
    },
  };
  const runtime =
    over.runtime === null
      ? {}
      : {
          sessionStore: { getHistory: () => history },
          reviseAssistantTurn:
            over.revise ||
            (async (input) => {
              calls.revise.push(input);
              return { ok: true, status: 'chat', reply: '新回答' };
            }),
          selectAssistantVersion:
            over.selectVersion ||
            ((input) => {
              calls.selectVersion.push(input);
              return { ok: true, status: 'chat', reply: '版本' };
            }),
        };
  const actions = createAgentConversationActions({
    messagesEl,
    runtime,
    getBusy: () => state.busy,
    setBusy: (value, options) => calls.setBusy.push([value, options === undefined ? null : options]),
    getPresentation: () => presentation,
    onResult: (result) => calls.results.push(result),
    setNotice: (text) => calls.notice.push(text),
    replyActions: over.replyActions || [],
  });
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const buttons = (selector) => messagesEl.querySelectorAll(selector);
  return { actions, messagesEl, userEl, assistantEl, footer, state, calls, history, waiting, flush, buttons };
}

const settle = (list) => list.map((node) => node.textContent);

test('会话动作条：返回 render/setBusy/destroy 三方法', () => {
  const { actions } = make();
  assert.deepEqual(Object.keys(actions), ['render', 'setBusy', 'destroy']);
});

test('会话动作条：runtime 不支持修订时 render 完全空转', () => {
  const { actions, messagesEl } = make({ runtime: null });
  actions.render();
  assert.deepEqual(messagesEl.querySelectorAll('.agent-message-actions'), []);
});

test('会话动作条：末轮不可编辑时不渲染，且会清掉既有动作条', () => {
  const first = make();
  first.actions.render();
  assert.equal(first.messagesEl.querySelectorAll('.agent-message-actions').length, 2);
  const second = make({ history: [userMessage] });
  second.actions.render();
  assert.deepEqual(second.messagesEl.querySelectorAll('.agent-message-actions'), []);
});

test('会话动作条：历史与 DOM 条数不一致时只清除不重建', () => {
  const { actions, messagesEl, history } = make();
  history.push(userMessage, assistantMessage({ itemId: 'm4' }));
  actions.render();
  assert.deepEqual(messagesEl.querySelectorAll('.agent-message-actions'), []);
});

test('会话动作条：编辑按钮挂进用户条 footer，重新回答与版本条挂进助手条', () => {
  const { actions, messagesEl, footer } = make();
  actions.render();
  assert.equal(footer.children.length, 1);
  const editBar = footer.children[0];
  assert.equal(editBar.className, 'agent-message-actions');
  assert.equal(editBar.children[0].className, 'agent-message-action agent-message-edit');
  assert.equal(editBar.children[0].textContent, '编辑提问');
  assert.equal(editBar.children[0].innerHTML, agentIconSvg('edit'));
  const assistantBar = messagesEl.querySelectorAll('.agent-message-actions')[1];
  assert.equal(assistantBar.parentNode.className, 'agent-message');
  assert.deepEqual(settle(assistantBar.children), ['重新回答']);
});

test('会话动作条：replyActions 仅在末轮 status 为 chat 时追加，apply 抛错转提示', async () => {
  const ok = make({
    replyActions: [
      { label: '复制', className: 'copy-x', apply: (content) => ok.calls.applies.push(content) },
    ],
  });
  ok.actions.render();
  const bar = ok.messagesEl.querySelectorAll('.agent-message-actions')[1];
  assert.deepEqual(settle(bar.children), ['重新回答', '复制']);
  bar.children[1].click();
  assert.deepEqual(ok.calls.applies, ['回答一']);

  const boom = make({
    replyActions: [
      {
        label: '复制',
        apply: () => {
          throw new Error('剪贴板不可用');
        },
      },
    ],
  });
  boom.actions.render();
  boom.messagesEl.querySelectorAll('.agent-message-actions')[1].children[1].click();
  assert.deepEqual(boom.calls.notice, ['剪贴板不可用']);

  const stopped = make({ history: [userMessage, assistantMessage({ status: 'stopped' })] });
  stopped.actions.render();
  assert.deepEqual(settle(stopped.messagesEl.querySelectorAll('.agent-message-actions')[1].children), [
    '重新回答',
  ]);
});

test('会话动作条：多版本时渲染左右切换与计数，activeIndex 决定禁用端', () => {
  const versions = {
    activeIndex: 1,
    versions: [
      { prompt: '画一只猫', reply: '回答一', status: 'chat', assistantContext: { skillIds: [] } },
      { prompt: '画一只猫', reply: '回答二', status: 'chat', assistantContext: { skillIds: [] } },
    ],
  };
  const { actions, messagesEl } = make({
    history: [userMessage, assistantMessage({ replyVersions: versions })],
  });
  actions.render();
  const bar = messagesEl.querySelectorAll('.agent-message-actions')[1];
  assert.deepEqual(settle(bar.children), ['重新回答', '‹', '2 / 2', '›']);
  assert.equal(bar.children[1].className, 'agent-message-action agent-message-version-prev');
  assert.equal(bar.children[1].disabled, false);
  assert.equal(bar.children[3].disabled, true);
  assert.equal(bar.children[2].attrs['aria-label'], '回答版本');
});

test('会话动作条：版本切换按钮回 onResult，索引按 activeIndex 加减', () => {
  const versions = {
    activeIndex: 1,
    versions: [
      { prompt: 'q', reply: 'v0', status: 'chat', assistantContext: { skillIds: [] } },
      { prompt: 'q', reply: 'v1', status: 'chat', assistantContext: { skillIds: [] } },
    ],
  };
  const { actions, messagesEl, calls } = make({
    history: [userMessage, assistantMessage({ replyVersions: versions })],
  });
  actions.render();
  const bar = messagesEl.querySelectorAll('.agent-message-actions')[1];
  bar.children[1].click();
  bar.children[3].click();
  assert.deepEqual(
    calls.selectVersion.map((item) => item.index),
    [0, 2],
  );
  assert.deepEqual(
    calls.selectVersion.map((item) => item.itemId),
    ['m2', 'm2'],
  );
  assert.equal(calls.results.length, 2);
});

test('会话动作条：版本数未过半仍渲染，版本达上限时重新回答与编辑一并禁用', () => {
  const versions = {
    activeIndex: 0,
    versions: Array.from({ length: 20 }, (_, i) => ({
      prompt: 'q',
      reply: 'v' + i,
      status: 'chat',
      assistantContext: { skillIds: [] },
    })),
  };
  const { actions, messagesEl } = make({
    history: [userMessage, assistantMessage({ replyVersions: versions })],
  });
  actions.render();
  const bars = messagesEl.querySelectorAll('.agent-message-actions');
  assert.equal(bars[0].children[0].disabled, true, '编辑提问禁用');
  assert.equal(bars[1].children[0].disabled, true, '重新回答禁用');
  assert.equal(bars[1].children[1].disabled, true, '上一版本禁用');
  assert.equal(bars[1].children[3].disabled, false);
});

test('会话动作条：忙碌中只重排禁用态，不重建也不清空既有动作条', () => {
  const { actions, messagesEl, state } = make();
  actions.render();
  const bar = messagesEl.querySelectorAll('.agent-message-actions')[1];
  state.busy = true;
  actions.render();
  assert.equal(messagesEl.querySelectorAll('.agent-message-actions')[1], bar);
  assert.ok(bar.children.every((node) => node.disabled === true));
});

test('会话动作条：指纹未变且条数一致时二次 render 幂等，不重复建条', () => {
  const { actions, messagesEl } = make();
  actions.render();
  const before = messagesEl.querySelectorAll('.agent-message-action');
  actions.render();
  const after = messagesEl.querySelectorAll('.agent-message-action');
  assert.deepEqual(
    after.map((node) => node.textContent),
    before.map((node) => node.textContent),
  );
  assert.equal(messagesEl.querySelectorAll('.agent-message-actions').length, 2);
});

test('会话动作条：忙碌中点击按钮被吞掉，空闲时才触发', async () => {
  const { actions, messagesEl, state, calls } = make();
  actions.render();
  const retry = messagesEl.querySelectorAll('.agent-message-action')[1];
  state.busy = true;
  retry.click();
  assert.deepEqual(calls.revise, []);
  state.busy = false;
  retry.click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.results.length, 1);
});

test('会话动作条：重新回答走完整忙碌周期并只传 itemId', async () => {
  const { actions, messagesEl, calls, state } = make();
  actions.render();
  messagesEl.querySelectorAll('.agent-message-action')[1].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.revise, [{ itemId: 'm2' }]);
  assert.deepEqual(calls.setBusy, [
    [true, { stoppable: true }],
    [false, null],
  ]);
  assert.deepEqual(calls.notice, ['']);
  assert.equal(calls.removedWaiting.length, 1);
  assert.equal(state.busy, false);
});

test('会话动作条：失败且非换代才提示，stale 与成功都静默', async () => {
  const fail = make({ revise: async () => ({ ok: false, reply: '回复失败，请重试' }) });
  fail.actions.render();
  fail.messagesEl.querySelectorAll('.agent-message-action')[1].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fail.calls.notice, ['', '回复失败，请重试']);

  const stale = make({ revise: async () => ({ ok: false, stale: true, reply: '已丢弃' }) });
  stale.actions.render();
  stale.messagesEl.querySelectorAll('.agent-message-action')[1].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(stale.calls.notice, ['']);

  const thrown = make({
    revise: async () => {
      throw new Error('网络中断');
    },
  });
  thrown.actions.render();
  thrown.messagesEl.querySelectorAll('.agent-message-action')[1].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(thrown.calls.notice, ['', '网络中断']);
  assert.deepEqual(thrown.calls.results, []);
});

test('会话动作条：占位节点未挂进 DOM 时不复位忙碌态', async () => {
  const detached = { appendWaiting: () => new El('div'), removeWaiting: () => {} };
  const { actions, messagesEl, calls } = make({ presentation: detached });
  actions.render();
  messagesEl.querySelectorAll('.agent-message-action')[1].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.setBusy, [[true, { stoppable: true }]], '缺少 setBusy(false) 收尾');
});

test('会话动作条：编辑浮层预填提问、空值锁保存、Ctrl+Enter 触发保存', async () => {
  const { actions, messagesEl, calls } = make();
  actions.render();
  messagesEl.querySelectorAll('.agent-message-action')[0].click();
  const editor = messagesEl.querySelector('.agent-message-editor');
  assert.equal(editor.parentNode, messagesEl.children[0]);
  const textarea = editor.children[0];
  assert.deepEqual(settle([editor.children[1], editor.children[2]]), ['取消', '保存并重新回答']);
  assert.equal(textarea.tagName, 'textarea');
  assert.equal(textarea.value, '画一只猫');
  assert.equal(textarea.rows, 4);
  assert.equal(textarea.attrs['aria-label'], '编辑提问');
  assert.equal(textarea.focusCount, 1);
  textarea.value = '   ';
  textarea.dispatch('input');
  assert.equal(editor.children[2].disabled, true);
  textarea.value = '换个说法';
  textarea.dispatch('input');
  assert.equal(editor.children[2].disabled, false);
  editor.children[2].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.revise, [{ itemId: 'm2', message: '换个说法' }]);
});

test('会话动作条：编辑浮层键盘守卫，Escape 关闭、Ctrl+Enter 保存、输入法合成期不触发', async () => {
  const { actions, messagesEl, calls } = make();
  actions.render();
  messagesEl.querySelectorAll('.agent-message-action')[0].click();
  const editor = messagesEl.querySelector('.agent-message-editor');
  const textarea = editor.children[0];
  textarea.dispatch('keydown', { key: 'Enter', ctrlKey: true, isComposing: true });
  assert.deepEqual(calls.revise, []);
  textarea.dispatch('keydown', { key: 'Enter', metaKey: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.revise, [{ itemId: 'm2', message: '画一只猫' }]);
  textarea.dispatch('keydown', { key: 'Escape' });
  assert.equal(messagesEl.querySelector('.agent-message-editor'), null);
});

test('会话动作条：同一时刻只保留一个编辑浮层，setBusy/destroy 均先收起', () => {
  const { actions, messagesEl, state } = make();
  actions.render();
  messagesEl.querySelectorAll('.agent-message-action')[0].click();
  messagesEl.querySelectorAll('.agent-message-action')[0].click();
  assert.equal(messagesEl.querySelectorAll('.agent-message-editor').length, 1);
  state.busy = true;
  actions.setBusy();
  assert.equal(messagesEl.querySelector('.agent-message-editor'), null);

  const doomed = make();
  doomed.actions.render();
  doomed.messagesEl.querySelectorAll('.agent-message-action')[0].click();
  doomed.actions.destroy();
  assert.equal(doomed.messagesEl.querySelector('.agent-message-editor'), null);
  assert.equal(doomed.messagesEl.querySelectorAll('.agent-message-actions').length, 2);
});
