import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationActivity } from './collaborationActivity.js';
import { reviewTime } from './collaborationReviewDom.js';

// Minimal tree/event adapter. ReviewDom is the real import; layout metrics, the
// connection state and event dispatch are local stand-ins, not browser behavior.
function documentAdapter() {
  const log = { tags: [], scroll: [], textWrites: 0, htmlWrites: 0 };
  const connected = new Set();
  const text = (value) => ({ nodeType: 3, textContent: String(value), parentNode: null });
  const elementsOf = (node) => node.childNodes.filter((child) => child.nodeType === 1);
  function createElement(tag) {
    let scroll = 0;
    const properties = new Map(),
      attributes = new Map();
    const node = {
      nodeType: 1,
      localName: tag.toLowerCase(),
      className: '',
      childNodes: [],
      parentNode: null,
      listeners: new Map(),
      dataset: {},
      hidden: false,
      disabled: false,
      open: false,
      tabIndex: undefined,
      _rect: { top: 0, bottom: 0 },
      style: {
        setProperty(k, v) {
          properties.set(k, String(v));
        },
        getPropertyValue(k) {
          return properties.get(k) || '';
        },
      },
      setAttribute(k, v) {
        attributes.set(k, String(v));
      },
      getAttribute(k) {
        return attributes.get(k) ?? null;
      },
      getBoundingClientRect() {
        return node._rect;
      },
      append(...values) {
        for (const value of values) {
          const child = value?.nodeType ? value : text(value);
          if (child.parentNode)
            child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
          child.parentNode = node;
          node.childNodes.push(child);
        }
      },
      replaceChildren(...values) {
        for (const child of node.childNodes) child.parentNode = null;
        node.childNodes = [];
        node.append(...values);
      },
      insertBefore(child, before) {
        if (before == null) {
          node.append(child);
          return child;
        }
        assert.ok(node.childNodes.includes(before), 'reference node must belong to the parent');
        if (child.parentNode)
          child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
        node.childNodes.splice(node.childNodes.indexOf(before), 0, child);
        child.parentNode = node;
        return child;
      },
      remove() {
        if (!node.parentNode) return;
        const siblings = node.parentNode.childNodes;
        siblings.splice(siblings.indexOf(node), 1);
        node.parentNode = null;
      },
      addEventListener(type, listener) {
        if (!node.listeners.has(type)) node.listeners.set(type, []);
        node.listeners.get(type).push(listener);
      },
      querySelectorAll(selector) {
        assert.equal(selector, 'button[data-node-id]');
        const found = [];
        const walk = (current) => {
          for (const child of elementsOf(current)) {
            if (child.localName === 'button' && child.dataset.nodeId !== undefined) found.push(child);
            walk(child);
          }
        };
        walk(node);
        return found;
      },
    };
    if (node.localName === 'button') node.type = 'submit';
    const classes = () => node.className.split(/\s+/).filter(Boolean);
    node.classList = {
      add(...names) {
        node.className = [...new Set([...classes(), ...names])].join(' ');
      },
      contains(name) {
        return classes().includes(name);
      },
      toggle(name, force) {
        const set = new Set(classes()),
          enabled = arguments.length === 2 ? !!force : !set.has(name);
        if (enabled) set.add(name);
        else set.delete(name);
        node.className = [...set].join(' ');
        return enabled;
      },
    };
    Object.defineProperties(node, {
      children: { get: () => elementsOf(node) },
      firstChild: { get: () => node.childNodes[0] || null },
      childElementCount: { get: () => elementsOf(node).length },
      nextSibling: {
        get: () => {
          if (!node.parentNode) return null;
          const siblings = node.parentNode.childNodes;
          return siblings[siblings.indexOf(node) + 1] || null;
        },
      },
      isConnected: {
        get: () => {
          let current = node;
          while (current) {
            if (connected.has(current)) return true;
            current = current.parentNode;
          }
          return false;
        },
      },
      textContent: {
        get: () => node.childNodes.map((child) => child.textContent).join(''),
        set(value) {
          log.textWrites += 1;
          node.childNodes = [];
          if (value != null && value !== '') node.append(text(value));
        },
      },
      scrollTop: {
        get: () => scroll,
        set(value) {
          scroll = value;
          log.scroll.push({ node, value, children: elementsOf(node).length });
        },
      },
      innerHTML: {
        set() {
          log.htmlWrites += 1;
          throw new Error('HTML parsing not supported or expected');
        },
      },
    });
    log.tags.push(node.localName);
    return node;
  }
  return {
    document: { createElement, createTextNode: text },
    log,
    connect: (node) => connected.add(node),
  };
}

function installDocument(t, document) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
}

function review(over = {}) {
  return {
    loading: 'loading' in over ? over.loading : false,
    revision: 'revision' in over ? over.revision : 1,
    error: 'error' in over ? over.error : '',
    activities: 'activities' in over ? over.activities : [],
  };
}

function activity(over = {}) {
  return {
    seq: 'seq' in over ? over.seq : 1,
    name: 'name' in over ? over.name : 'Ann',
    kind: 'kind' in over ? over.kind : 'create',
    created: 'created' in over ? over.created : 1000,
    mentions: 'mentions' in over ? over.mentions : [],
    nodes: 'nodes' in over ? over.nodes : [],
  };
}

function node(over = {}) {
  return { id: 'id' in over ? over.id : 'n1', name: 'name' in over ? over.name : '镜头 A' };
}

function fixture(t, options = {}) {
  const { document, log, connect } = documentAdapter();
  installDocument(t, document);
  const root = document.createElement('div');
  connect(root);
  const state = {
    actorId: 'actorId' in options ? options.actorId : 'ann',
    session: 'session' in options ? options.session : { roomId: 'r1', review: review() },
  };
  const nodePolicy = { hasNode: options.hasNode || (() => true) };
  const calls = { getState: 0, refresh: 0, opened: [], queried: [] };
  const actions = {
    refreshReview() {
      calls.refresh += 1;
    },
    hasReviewNode(id) {
      calls.queried.push(id);
      return nodePolicy.hasNode(id);
    },
    openReviewNode(id, jump) {
      calls.opened.push([id, jump]);
    },
  };
  for (const key of options.dropActions || []) delete actions[key];
  const api = createCollaborationActivity({
    root,
    getState() {
      calls.getState += 1;
      return state;
    },
    actions,
  });
  const details = root.children[0];
  const [summary, feedback, retry, list] = details.childNodes.filter((child) => child.nodeType === 1);
  log.scroll.length = 0;
  log.textWrites = 0;
  return {
    document,
    log,
    root,
    state,
    nodePolicy,
    calls,
    actions,
    api,
    connect,
    details,
    summary,
    feedback,
    retry,
    list,
  };
}

const fire = (target, type) => {
  for (const listener of target.listeners.get(type) || []) listener({ type, target });
};

const openPanel = (ctx) => {
  ctx.details.open = true;
  fire(ctx.details, 'toggle');
};

// The first open is swallowed by the room-id reset (see the documented quirk),
// so a rendered panel needs two opens.
function mount(t, options = {}) {
  const ctx = fixture(t, options);
  openPanel(ctx);
  openPanel(ctx);
  ctx.log.scroll.length = 0;
  ctx.log.textWrites = 0;
  return ctx;
}

test('构造：在 root 下追加 details.collaboration-activity', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.root.children.length, 1);
  assert.equal(ctx.details.localName, 'details');
  assert.ok(ctx.details.classList.contains('collaboration-activity'));
});

test('构造：details 子节点顺序为 summary、feedback、retry、list', (t) => {
  const ctx = fixture(t);
  assert.deepEqual(
    ctx.details.children.map((child) => child.localName),
    ['summary', 'p', 'button', 'div'],
  );
  assert.notEqual(ctx.feedback, undefined);
  assert.notEqual(ctx.retry, undefined);
  assert.notEqual(ctx.list, undefined);
});

test('构造：summary 文本为「协作动态」且 tabIndex 为 0', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.summary.localName, 'summary');
  assert.equal(ctx.summary.textContent, '协作动态');
  assert.equal(ctx.summary.tabIndex, 0);
});

test('构造：feedback 标记 role=status', (t) => {
  const ctx = fixture(t);
  assert.ok(ctx.feedback.classList.contains('collaboration-feedback'));
  assert.equal(ctx.feedback.getAttribute('role'), 'status');
});

test('构造：list 标记 aria-label 且带 collaboration-activity-list 类', (t) => {
  const ctx = fixture(t);
  assert.ok(ctx.list.classList.contains('collaboration-activity-list'));
  assert.equal(ctx.list.getAttribute('aria-label'), '最近协作动态');
});

test('构造：retry 按钮文本为「重试加载」', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.retry.textContent, '重试加载');
  assert.ok(ctx.retry.classList.contains('collaboration-button'));
});

test('构造：只返回 render 一个方法', (t) => {
  const ctx = fixture(t);
  assert.deepEqual(Object.keys(ctx.api), ['render']);
  assert.equal(typeof ctx.api.render, 'function');
});

test('构造：不调用 getState', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.calls.getState, 0);
});

test('构造：details 初始 open 为 false', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.details.open, false);
});

test('open=false 时直接调用 render 不写 feedback 也不写滚动位置', (t) => {
  const ctx = fixture(t);
  ctx.api.render();
  assert.equal(ctx.log.textWrites, 0);
  assert.equal(ctx.log.scroll.length, 0);
});

test('首次打开被房间重置吞掉：details 关闭、列表清空、不写 feedback', (t) => {
  const ctx = fixture(t);
  openPanel(ctx);
  assert.equal(ctx.details.open, false);
  assert.equal(ctx.list.children.length, 0);
  assert.equal(ctx.log.textWrites, 0);
});

test('roomId 变化时清空列表、关闭 details 并清缓存', (t) => {
  const ctx = mount(t);
  ctx.state.session = { roomId: 'r2', review: review({ activities: [activity({ seq: 1 })] }) };
  ctx.details.open = true;
  fire(ctx.details, 'toggle');
  assert.equal(ctx.details.open, false);
  assert.equal(ctx.list.children.length, 0);
});

test('toggle 在 open=true 时触发渲染，新活动写入列表', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1, name: 'Ann' })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children.length, 1);
});

test('open=false 时 toggle 不再渲染', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  ctx.details.open = false;
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children.length, 1);
});

test('默认 feedback 文本为「最近 100 条操作」', (t) => {
  const ctx = mount(t);
  assert.equal(ctx.feedback.textContent, '最近 100 条操作');
});

test('loading 且 revision 为负时显示加载文案并置 is-pending', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ loading: true, revision: -1 });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.feedback.textContent, '正在加载动态…');
  assert.ok(ctx.feedback.classList.contains('is-pending'));
});

test('loading 但 revision 非负时不视为 pending', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ loading: true, revision: 5 });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.feedback.textContent, '最近 100 条操作');
  assert.equal(ctx.feedback.classList.contains('is-pending'), false);
});

test('error 文本优先于加载文案', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ loading: true, revision: -1, error: '加载失败' });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.feedback.textContent, '加载失败');
  assert.ok(ctx.feedback.classList.contains('is-pending'));
});

test('retry.hidden 由 error 决定', (t) => {
  const ctx = mount(t);
  assert.equal(ctx.retry.hidden, true);
  ctx.state.session.review = review({ error: '加载失败' });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.retry.hidden, false);
});

test('retry.disabled 由 loading 决定', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ loading: true });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.retry.disabled, true);
  ctx.state.session.review = review({ loading: false });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.retry.disabled, false);
});

test('点击 retry 调用 actions.refreshReview', (t) => {
  const ctx = fixture(t);
  fire(ctx.retry, 'click');
  assert.equal(ctx.calls.refresh, 1);
});

test('缺少 refreshReview 时点击 retry 不抛错', (t) => {
  const ctx = fixture(t, { dropActions: ['refreshReview'] });
  assert.doesNotThrow(() => fire(ctx.retry, 'click'));
});

test('feedback 文本未变时不重复写入', (t) => {
  const ctx = mount(t);
  fire(ctx.details, 'toggle');
  assert.equal(ctx.log.textWrites, 0);
});

test('每个 activity 生成一个列表项且顺序与输入一致', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({
    activities: [activity({ seq: 1, name: 'Ann' }), activity({ seq: 2, name: 'Bob' })],
  });
  fire(ctx.details, 'toggle');
  const items = ctx.list.children;
  assert.equal(items.length, 2);
  for (const item of items) assert.ok(item.classList.contains('collaboration-activity-item'));
  assert.equal(items[0].textContent.startsWith('Ann '), true);
  assert.equal(items[1].textContent.startsWith('Bob '), true);
});

test('文案为 name 加空格加动作标签', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1, name: 'Ann', kind: 'update' })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children[0].childNodes[0].textContent, 'Ann 修改了');
});

test('未知 kind 回退为「操作了」', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1, name: 'Ann', kind: 'mystery' })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children[0].childNodes[0].textContent, 'Ann 操作了');
});

test('mentions 命中 actorId 时标记 is-mentioned', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({
    activities: [activity({ seq: 1, mentions: ['ann', 'bob'] })],
  });
  fire(ctx.details, 'toggle');
  assert.ok(ctx.list.children[0].classList.contains('is-mentioned'));
});

test('mentions 未命中 actorId 时不标记 is-mentioned', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1, mentions: ['bob'] })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children[0].classList.contains('is-mentioned'), false);
});

test('nodes 生成带 dataset.nodeId 的按钮', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({
    activities: [
      activity({ seq: 1, nodes: [node({ id: 'n1', name: '镜头 A' }), node({ id: 'n2', name: '镜头 B' })] }),
    ],
  });
  fire(ctx.details, 'toggle');
  const buttons = ctx.list.querySelectorAll('button[data-node-id]');
  assert.deepEqual(
    buttons.map((button) => button.dataset.nodeId),
    ['n1', 'n2'],
  );
  assert.deepEqual(
    buttons.map((button) => button.textContent),
    ['镜头 A', '镜头 B'],
  );
  assert.ok(buttons[0].classList.contains('collaboration-text-action'));
});

test('hasReviewNode 返回 true 时节点按钮可用', (t) => {
  const ctx = mount(t, { hasNode: () => true });
  ctx.state.session.review = review({ activities: [activity({ seq: 1, nodes: [node({ id: 'n1' })] })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.querySelectorAll('button[data-node-id]')[0].disabled, false);
});

test('hasReviewNode 返回 false 时节点按钮禁用', (t) => {
  const ctx = mount(t, { hasNode: () => false });
  ctx.state.session.review = review({ activities: [activity({ seq: 1, nodes: [node({ id: 'n1' })] })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.querySelectorAll('button[data-node-id]')[0].disabled, true);
});

test('缺少 hasReviewNode 时节点按钮一律禁用', (t) => {
  const ctx = mount(t, { dropActions: ['hasReviewNode'] });
  ctx.state.session.review = review({ activities: [activity({ seq: 1, nodes: [node({ id: 'n1' })] })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.querySelectorAll('button[data-node-id]')[0].disabled, true);
});

test('kind 属于评论类时节点按钮传入跳转标记 true', (t) => {
  const ctx = mount(t);
  for (const kind of ['comment', 'resolve', 'reopen']) {
    ctx.state.session.review = review({
      activities: [activity({ seq: 9, kind, nodes: [node({ id: 'n1' })] })],
    });
    fire(ctx.details, 'toggle');
    fire(ctx.list.querySelectorAll('button[data-node-id]')[0], 'click');
    assert.deepEqual(ctx.calls.opened.at(-1), ['n1', true]);
  }
});

test('kind 非评论类时节点按钮传入跳转标记 false', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({
    activities: [activity({ seq: 1, kind: 'create', nodes: [node({ id: 'n7' })] })],
  });
  fire(ctx.details, 'toggle');
  fire(ctx.list.querySelectorAll('button[data-node-id]')[0], 'click');
  assert.deepEqual(ctx.calls.opened.at(-1), ['n7', false]);
});

test('time 元素带 collaboration-subtle 类且使用 reviewTime 格式化 created', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1, created: 1000 })] });
  fire(ctx.details, 'toggle');
  const item = ctx.list.children[0];
  const time = item.children.find((child) => child.localName === 'time');
  assert.ok(time.classList.contains('collaboration-subtle'));
  assert.equal(time.textContent, reviewTime(1000));
});

test('相同 activities 再次渲染不重建元素', (t) => {
  const ctx = mount(t);
  const payload = [activity({ seq: 1 }), activity({ seq: 2 })];
  ctx.state.session.review = review({ activities: payload });
  fire(ctx.details, 'toggle');
  const before = [...ctx.list.children];
  fire(ctx.details, 'toggle');
  assert.deepEqual([...ctx.list.children], before);
});

test('顺序变化时复用同一元素并调换位置', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  const [first, second] = [...ctx.list.children];
  ctx.state.session.review = review({ activities: [activity({ seq: 2 }), activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  assert.deepEqual([...ctx.list.children], [second, first]);
});

test('被移除的活动对应元素从列表删除', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  const removed = ctx.list.children[1];
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children.length, 1);
  assert.equal(removed.parentNode, null);
});

test('缓存按 seq 清理，重新出现的活动会新建元素', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  const original = ctx.list.children[0];
  ctx.state.session.review = review({ activities: [activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  assert.notEqual(ctx.list.children[0], original);
});

test('空列表追加空态段落，重复渲染不重复追加', (t) => {
  const ctx = mount(t);
  assert.equal(ctx.list.children.length, 1);
  assert.equal(ctx.list.children[0].textContent, '还没有协作动态');
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children.length, 1);
});

test('从空态变为非空时移除空态段落', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.children.length, 1);
  assert.ok(ctx.list.children[0].classList.contains('collaboration-activity-item'));
});

test('存在锚点时按锚点位移回写 scrollTop', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  const anchor = ctx.list.children[0];
  let reads = 0;
  anchor._rect = {
    get top() {
      reads += 1;
      return reads === 1 ? -5 : 15;
    },
    bottom: 5,
  };
  ctx.list.scrollTop = 120;
  ctx.log.scroll.length = 0;
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.scrollTop, 140);
  assert.equal(ctx.log.scroll.at(-1).value, 140);
});

test('锚点在本次渲染中被移除时恢复原 scrollTop', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  fire(ctx.details, 'toggle');
  ctx.list.children[0]._rect = { top: -50, bottom: -10 };
  ctx.list.children[1]._rect = { top: -5, bottom: 5 };
  ctx.list.scrollTop = 120;
  ctx.log.scroll.length = 0;
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  assert.equal(ctx.list.scrollTop, 120);
});

test('scrollTop 为 0 时不读取任何子元素矩形', (t) => {
  const ctx = mount(t);
  ctx.state.session.review = review({ activities: [activity({ seq: 1 })] });
  fire(ctx.details, 'toggle');
  ctx.list.children[0]._rect = {
    get top() {
      throw new Error('rect must not be read when scrollTop is 0');
    },
    get bottom() {
      throw new Error('rect must not be read when scrollTop is 0');
    },
  };
  ctx.list.scrollTop = 0;
  ctx.state.session.review = review({ activities: [activity({ seq: 1 }), activity({ seq: 2 })] });
  assert.doesNotThrow(() => fire(ctx.details, 'toggle'));
  assert.equal(ctx.list.scrollTop, 0);
});

test('签名未变时也同步复用按钮的禁用态', (t) => {
  const ctx = mount(t, { hasNode: () => true });
  ctx.state.session.review = review({ activities: [activity({ seq: 1, nodes: [node({ id: 'n1' })] })] });
  fire(ctx.details, 'toggle');
  const button = ctx.list.querySelectorAll('button[data-node-id]')[0];
  assert.equal(button.disabled, false);
  ctx.nodePolicy.hasNode = () => false;
  fire(ctx.details, 'toggle');
  assert.equal(button.disabled, true);
});
