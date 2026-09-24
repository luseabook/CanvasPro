import test from 'node:test';
import assert from 'node:assert/strict';

// 本模块只走 document.createElement 路径（不做富文本清洗），因此注入假 DOM 是安全的。
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.handlers = {};
    this.classes = new Set();
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
  }
  get className() {
    return [...this.classes].join(' ');
  }
  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }
  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }
  getAttribute(key) {
    return key in this.attrs ? this.attrs[key] : undefined;
  }
  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  replaceChildren(...nodes) {
    this.children = [];
    for (const node of nodes) this.appendChild(node);
  }
  addEventListener(type, fn) {
    (this.handlers[type] ||= []).push(fn);
  }
  dispatch(type, event = {}) {
    return [...(this.handlers[type] || [])].map((fn) =>
      fn({ type, target: this, preventDefault() {}, stopPropagation() {}, ...event }),
    );
  }
}

globalThis.document = { createElement: (tag) => new El(tag) };

const { renderAgentConversationChoices } = await import('./agentConversationChoices.js');

const options = [
  { id: 'opt-a', label: '甲' },
  { id: 'opt-b', label: '乙' },
];

function render(pending, over = {}) {
  const state = {
    container: 'container' in over ? over.container : new El('div'),
    results: [],
    busy: [],
    answers: [],
    waitingEnds: [],
    calls: [],
  };
  const result = 'result' in over ? over.result : null;
  const runtime = Object.assign(
    {
      async answerClarification(id, extra) {
        state.calls.push(['answerClarification', id, extra]);
        return result || { ok: true, status: 'ready', reply: 'clarified:' + id };
      },
      async answerAssistantChoice(id, extra) {
        state.calls.push(['answerAssistantChoice', id, extra]);
        return result || { ok: true, status: 'ready', reply: 'assistant:' + id };
      },
    },
    over.runtime || {},
  );
  renderAgentConversationChoices(
    state.container,
    pending,
    runtime,
    (value) => state.results.push(value),
    'setBusy' in over ? over.setBusy : (value) => state.busy.push(value),
    {
      onAnswer: 'onAnswer' in over ? over.onAnswer : (value) => state.answers.push(value),
      onWaitingStart:
        'onWaitingStart' in over ? over.onWaitingStart : () => ('waiting' in over ? over.waiting : null),
      onWaitingEnd: 'onWaitingEnd' in over ? over.onWaitingEnd : (node) => state.waitingEnds.push(node),
    },
  );
  return state;
}

async function click(button) {
  await Promise.all(button.dispatch('click'));
}

test('空选项集合会清空并隐藏容器', () => {
  const preset = new El('div');
  preset.appendChild(new El('span'));
  const { container } = render({ options: [] }, { container: preset });
  assert.equal(container.hidden, true);
  assert.equal(container.children.length, 0);
  assert.equal(render(undefined).container.hidden, true);
  assert.deepEqual(render({ options: 'nope' }).container.children, []);
});

test('每个选项渲染成一个 agent-option-btn，携带 label 文案与 type=button', () => {
  const { container } = render({ options, questionId: 'q1' });
  assert.equal(container.hidden, false);
  assert.equal(container.children.length, 2);
  assert.deepEqual(
    container.children.map((node) => node.className),
    ['agent-option-btn', 'agent-option-btn'],
  );
  assert.deepEqual(
    container.children.map((node) => node.textContent),
    ['甲', '乙'],
  );
  assert.deepEqual(
    container.children.map((node) => node.type),
    ['button', 'button'],
  );
});

test('点击选项：先回抛答案文案并收起菜单，再走 answerClarification 并把结果交给 applyResult', async () => {
  const state = render({ options, questionId: 'q1' });
  await click(state.container.children[0]);
  assert.deepEqual(state.answers, ['甲']);
  assert.equal(state.container.hidden, true);
  assert.deepEqual(state.calls, [['answerClarification', 'opt-a', { displayAnswer: '甲' }]]);
  assert.deepEqual(state.results, [{ ok: true, status: 'ready', reply: 'clarified:opt-a' }]);
  assert.deepEqual(state.busy, [true, false]);
});

test('responseChannel 为 assistant.message 时改走 answerAssistantChoice 并带上 questionId', async () => {
  const state = render({ options, questionId: 'q7', responseChannel: 'assistant.message' });
  await click(state.container.children[1]);
  assert.deepEqual(state.calls, [['answerAssistantChoice', 'opt-b', { questionId: 'q7' }]]);
  assert.deepEqual(state.results, [{ ok: true, status: 'ready', reply: 'assistant:opt-b' }]);
});

test('label 缺失时答案文案回退到 id，传给 runtime 的仍是原始 id', async () => {
  const state = render({ options: [{ id: 'opt-c' }] });
  await click(state.container.children[0]);
  assert.deepEqual(state.answers, ['opt-c']);
  assert.deepEqual(state.calls, [['answerClarification', 'opt-c', { displayAnswer: 'opt-c' }]]);
});

// 端口现状：label 只经过真值判断，纯空白标签被视为有效值，trim 后答案文案变成空串。
test('label 为纯空白时答案文案变成空串', async () => {
  const state = render({ options: [{ id: 'opt-d', label: '   ' }] });
  await click(state.container.children[0]);
  assert.deepEqual(state.answers, ['']);
  assert.deepEqual(state.calls, [['answerClarification', 'opt-d', { displayAnswer: '' }]]);
});

test('一次渲染只允许一次作答：第二个按钮的点击连同 onAnswer 一起被吞掉', async () => {
  const state = render({ options });
  const first = state.container.children[0].dispatch('click')[0];
  const second = state.container.children[1].dispatch('click')[0];
  await Promise.all([first, second]);
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.answers, ['甲']);
  assert.deepEqual(state.busy, [true, false]);
});

test('disabled 按钮不进入作答流程', async () => {
  const state = render({ options });
  const button = state.container.children[0];
  button.disabled = true;
  await click(button);
  assert.equal(state.calls.length, 0);
  assert.deepEqual(state.answers, []);
  assert.deepEqual(state.busy, []);
});

test('runtime 抛错时向 applyResult 交出 failed 结果，忙碌态照常复位', async () => {
  const state = render(
    { options },
    {
      runtime: {
        answerClarification: async () => {
          throw new Error('boom');
        },
      },
    },
  );
  await click(state.container.children[0]);
  assert.deepEqual(state.results, [{ ok: false, status: 'failed', reply: 'boom' }]);
  assert.deepEqual(state.busy, [true, false]);
  assert.deepEqual(state.waitingEnds, [null]);
});

test('错误没有 message 或抛出的不是 Error 时回退固定兜底文案', async () => {
  const blank = render(
    { options },
    {
      runtime: {
        answerClarification: async () => {
          throw new Error('');
        },
      },
    },
  );
  await click(blank.container.children[0]);
  assert.equal(blank.results[0].reply, 'Agent clarification failed.');
  assert.equal(blank.results[0].status, 'failed');
  const thrown = render(
    { options },
    {
      runtime: {
        answerClarification: async () => {
          throw null;
        },
      },
    },
  );
  await click(thrown.container.children[0]);
  assert.equal(thrown.results[0].reply, 'Agent clarification failed.');
});

test('占位节点未挂进 DOM 时忙碌态永不复位，但 onWaitingEnd 仍被调用', async () => {
  const orphan = new El('div');
  const detached = render({ options }, { waiting: orphan });
  await click(detached.container.children[0]);
  assert.deepEqual(detached.busy, [true]);
  assert.deepEqual(detached.waitingEnds, [orphan]);

  const host = new El('div');
  const attached = new El('div');
  host.appendChild(attached);
  const mounted = render({ options }, { waiting: attached });
  await click(mounted.container.children[0]);
  assert.deepEqual(mounted.busy, [true, false]);
  assert.deepEqual(mounted.waitingEnds, [attached]);
});

test('onWaitingStart 缺省返回 null 时视为可复位，onWaitingEnd 收到 null', async () => {
  const state = render({ options });
  await click(state.container.children[0]);
  assert.deepEqual(state.busy, [true, false]);
  assert.deepEqual(state.waitingEnds, [null]);
});

test('未提供 setBusy / onAnswer / onWaiting* 回调时点击仍然完成作答', async () => {
  const state = render(
    { options },
    { setBusy: null, onAnswer: null, onWaitingStart: null, onWaitingEnd: null },
  );
  await click(state.container.children[0]);
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.results, [{ ok: true, status: 'ready', reply: 'clarified:opt-a' }]);
});

test('render 不读取容器之外的全局状态：重复渲染会重建按钮并复位一次性闸门', async () => {
  const container = new El('div');
  const first = render({ options }, { container });
  await click(first.container.children[0]);
  assert.equal(first.calls.length, 1);
  const second = render({ options }, { container });
  await click(second.container.children[1]);
  assert.deepEqual(second.calls, [['answerClarification', 'opt-b', { displayAnswer: '乙' }]]);
  assert.equal(container.children.length, 2);
});
