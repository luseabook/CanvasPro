import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRunStatusPresentation } from './agentRunStatusPresentation.js';

function makeElement(tag) {
  const el = {
    tagName: tag,
    className: '',
    textContent: '',
    attrs: {},
    dataset: {},
    children: [],
    hidden: false,
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
    replaceChildren(...nodes) {
      this.children = [...nodes];
    },
  };
  return el;
}

function withDocument(run) {
  const had = 'document' in globalThis;
  const prev = globalThis.document;
  const created = [];
  globalThis.document = {
    createElement(tag) {
      const el = makeElement(tag);
      created.push(el);
      return el;
    },
  };
  try {
    return { result: run(created), created };
  } finally {
    if (had) globalThis.document = prev;
    else delete globalThis.document;
  }
}

const APPROVAL_EVENTS = [
  { type: 'approval.requested', runId: 'r1', step: 1, ts: 1 },
  { type: 'approval.confirmed', runId: 'r1', step: 1, ts: 2 },
  { type: 'tool.completed', runId: 'r1', step: 1, commandId: 'node.create', ok: true, ts: 3 },
];

test('运行步骤呈现：工厂返回冻结的 render / destroy 两键', () => {
  const { result } = withDocument(() => {
    const api = createAgentRunStatusPresentation({ root: makeElement('div') });
    assert.equal(Object.isFrozen(api), true);
    assert.deepEqual(Object.keys(api), ['render', 'destroy']);
    assert.equal(typeof api.render, 'function');
    assert.equal(typeof api.destroy, 'function');
    return api;
  });
  assert.equal(result.destroy(), undefined);
});

test('运行步骤呈现：无步骤时 root 置 hidden 且清空子节点后提前返回', () => {
  withDocument((created) => {
    const root = makeElement('div');
    root.children.push(makeElement('span'));
    createAgentRunStatusPresentation({ root }).render({ runEvents: [], currentRun: null });
    assert.equal(root.hidden, true);
    assert.deepEqual(root.children, []);
    assert.deepEqual(
      created.filter((el) => el.className === 'agent-run-steps-title'),
      [],
    );
  });
});

test('运行步骤呈现：缺 snapshot 参数也能渲染为空态（默认值走空数组）', () => {
  withDocument(() => {
    const root = makeElement('div');
    createAgentRunStatusPresentation({ root }).render();
    assert.equal(root.hidden, true);
  });
});

test('运行步骤呈现：有步骤时产出标题 + 列表两层，hidden 复位 false', () => {
  withDocument(() => {
    const root = makeElement('div');
    createAgentRunStatusPresentation({ root }).render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    assert.equal(root.hidden, false);
    assert.equal(root.children.length, 2);
    assert.equal(root.children[0].className, 'agent-run-steps-title');
    assert.equal(root.children[0].textContent, '执行步骤');
    assert.equal(root.children[1].className, 'agent-run-steps-list');
    assert.equal(root.children[1].attrs.role, 'list');
  });
});

test('运行步骤呈现：每条步骤产出 dot + label 两个 span，状态写进 dataset', () => {
  withDocument(() => {
    const root = makeElement('div');
    createAgentRunStatusPresentation({ root }).render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    const items = root.children[1].children;
    assert.equal(items.length, 2);
    assert.deepEqual(
      items.map((el) => [el.className, el.dataset.status, el.attrs.role]),
      [
        ['agent-run-step', 'success', 'listitem'],
        ['agent-run-step', 'success', 'listitem'],
      ],
    );
    assert.deepEqual(
      items.map((el) => el.children.map((c) => [c.className, c.textContent, c.attrs['aria-hidden']])),
      [
        [
          ['agent-run-step-dot', '', 'true'],
          ['agent-run-step-label', '已确认执行', undefined],
        ],
        [
          ['agent-run-step-dot', '', 'true'],
          ['agent-run-step-label', '创建节点', undefined],
        ],
      ],
    );
  });
});

test('运行步骤呈现：失败步骤与当前运行态各自带自己状态标记', () => {
  withDocument(() => {
    const root = makeElement('div');
    createAgentRunStatusPresentation({ root }).render({
      runEvents: [
        { type: 'tool.completed', runId: 'r2', step: 1, commandId: 'graph.connect', ok: false, ts: 5 },
      ],
      currentRun: { id: 'r2', status: 'planning' },
    });
    const items = root.children[1].children;
    assert.deepEqual(
      items.map((el) => [el.dataset.status, el.children[1].textContent]),
      [
        ['failed', '连接节点'],
        ['running', '规划下一步'],
      ],
    );
  });
});

test('运行步骤呈现：重复 render 先 replaceChildren 再追加，节点不累积', () => {
  withDocument(() => {
    const root = makeElement('div');
    const api = createAgentRunStatusPresentation({ root });
    api.render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    const first = root.children.length;
    api.render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    api.render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    assert.equal(root.children.length, first);
  });
});

test('运行步骤呈现：标题与列表都通过 document.createElement 创建 div（端口现状：无 role 之外属性）', () => {
  const { created } = withDocument(() => {
    createAgentRunStatusPresentation({ root: makeElement('div') }).render({
      runEvents: APPROVAL_EVENTS,
      currentRun: null,
    });
  });
  assert.deepEqual(
    created.map((el) => [el.tagName, el.className]),
    [
      ['div', 'agent-run-steps-title'],
      ['div', 'agent-run-steps-list'],
      ['div', 'agent-run-step'],
      ['span', 'agent-run-step-dot'],
      ['span', 'agent-run-step-label'],
      ['div', 'agent-run-step'],
      ['span', 'agent-run-step-dot'],
      ['span', 'agent-run-step-label'],
    ],
  );
});

test('运行步骤呈现：destroy 是空实现，调用后 render 仍可继续工作（端口现状）', () => {
  withDocument(() => {
    const root = makeElement('div');
    const api = createAgentRunStatusPresentation({ root });
    api.destroy();
    api.render({ runEvents: APPROVAL_EVENTS, currentRun: null });
    assert.equal(root.hidden, false);
    assert.equal(root.children[1].children.length, 2);
  });
});

test('运行步骤呈现：工厂缺 root 时构造不抛、首次 render 抛 TypeError（端口现状）', () => {
  withDocument(() => {
    const api = createAgentRunStatusPresentation({});
    assert.equal(typeof api.render, 'function');
    assert.throws(() => api.render({ runEvents: APPROVAL_EVENTS }), TypeError);
    assert.throws(() => api.render(), TypeError);
    assert.throws(() => createAgentRunStatusPresentation().render({ runEvents: APPROVAL_EVENTS }), TypeError);
  });
});
