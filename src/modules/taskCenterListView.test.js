import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTaskCardView, syncTaskElements } from './taskCenterListView.js';

function createFakeDocument() {
  const created = [];
  let sequence = 0;
  function make(tag, className = '') {
    const node = {
      tagName: tag,
      seq: (sequence += 1),
      className,
      textContent: '',
      hidden: false,
      disabled: false,
      alt: '',
      decoding: '',
      draggable: true,
      attributes: {},
      dataset: {},
      children: [],
      style: {},
      classList: {
        added: new Set(),
        contains: (name) => node.classList.added.has(name),
        add(...names) {
          for (const name of names) node.classList.added.add(name);
        },
        remove(...names) {
          for (const name of names) node.classList.added.delete(name);
        },
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      append(...items) {
        this.children.push(...items.filter(Boolean));
      },
      appendChild(item) {
        this.children.push(item);
        return item;
      },
      insertBefore(item, reference) {
        const existing = this.children.indexOf(item);
        if (existing >= 0) this.children.splice(existing, 1);
        const index = reference ? this.children.indexOf(reference) : -1;
        if (index < 0) this.children.push(item);
        else this.children.splice(index, 0, item);
        return item;
      },
      removeChild(item) {
        const index = this.children.indexOf(item);
        if (index >= 0) this.children.splice(index, 1);
        return item;
      },
      querySelector: (selector) => (selector === '.img-loading-overlay' ? { className: 'img-loading-overlay' } : null),
      querySelectorAll: () => [],
      remove() {
        this.removed = true;
      },
    };
    created.push(node);
    return node;
  }
  return {
    created,
    documentObject: { createElement: (tag) => make(tag) },
  };
}

const fake = createFakeDocument();
globalThis.document = fake.documentObject;

function updatePayload(overrides = {}) {
  return {
    title: '任务标题',
    context: '画布 / 节点',
    meta: '2 分钟前',
    status: 'running',
    statusLabel: '生成中',
    progress: 0.4,
    active: true,
    error: '',
    remoteId: '',
    thumbnail: null,
    thumbnailLabel: '',
    actions: [],
    ...overrides,
  };
}

test('taskCenterListView: 节点增删按目标清单同步，顺序也对齐', () => {
  const container = fake.documentObject.createElement('div');
  const a = fake.documentObject.createElement('button');
  const b = fake.documentObject.createElement('button');
  const c = fake.documentObject.createElement('button');
  container.append(a, b, c);

  const order = () => container.children.map((node) => node.seq);
  syncTaskElements(container, [c, a]);
  assert.deepEqual(order(), [c.seq, a.seq], 'c 提前、b 被摘掉');

  syncTaskElements(container, []);
  assert.deepEqual(order(), []);
});

test('taskCenterListView: 卡片携带任务 id 并组装出各区块', () => {
  const view = createTaskCardView('task-1');
  assert.equal(view.card.className, 'v2-task-card');
  assert.equal(view.card.dataset.taskId, 'task-1');
  const classNames = view.card.children.map((node) => node.className);
  assert.deepEqual(classNames, [
    'v2-task-card-header',
    'v2-task-progress',
    'v2-task-card-error',
    'v2-task-card-context',
    'v2-task-card-actions',
  ]);
  assert.equal(view.thumbnail.image.alt, '');
  assert.equal(view.thumbnail.image.decoding, 'async');
  assert.equal(view.thumbnail.image.draggable, false);
  assert.equal(view.thumbnail.image.hidden, true);
  assert.equal(view.thumbnail.src, '');
});

test('taskCenterListView: 更新时写入文案、状态类与错误/远端 ID 的显隐', () => {
  const view = createTaskCardView('task-2');
  view.update(updatePayload({ error: '生成失败', remoteId: 'remote-9' }));
  const status = view.card.children[0].children[2];
  assert.equal(status.className, 'v2-task-status v2-task-status--running');
  assert.equal(status.textContent, '生成中');
  assert.equal(view.card.attributes['aria-busy'], 'true');
  const progress = view.card.children[1];
  assert.equal(progress.hidden, false);
  assert.equal(progress.attributes.role, 'progressbar');
  assert.equal(progress.attributes['aria-label'], '生成中');
  assert.equal(progress.attributes['aria-valuenow'], '40');
  assert.equal(progress.children[0].style.width, '40%');
  assert.equal(progress.children[0].hidden, false);
  const error = view.card.children[2];
  assert.equal(error.textContent, '生成失败');
  assert.equal(error.hidden, false);
  assert.equal(view.card.children[3].textContent, 'API ID: remote-9');
  assert.equal(view.card.children[3].hidden, false);
});

test('taskCenterListView: 未激活时不显示进度，进度未知时交给加载态接管', () => {
  const view = createTaskCardView('task-3');
  view.update(updatePayload({ active: false, progress: 0.9 }));
  const progress = view.card.children[1];
  assert.equal(progress.hidden, true);
  assert.equal(view.card.attributes['aria-busy'], 'false');
  assert.equal(progress.children[0].style.width, '90%', '宽度仍按最后进度写入');

  view.update(updatePayload({ active: true, progress: null }));
  assert.equal(progress.hidden, false);
  assert.equal(progress.children[0].hidden, true, '进度未知时隐藏填充条');
  assert.equal(Object.hasOwn(progress.attributes, 'aria-valuenow'), false);
});

test('taskCenterListView: 缩略图与角标按种类和数量显示', () => {
  const view = createTaskCardView('task-4');
  view.update(updatePayload({ thumbnail: { src: '/x/a.png', kind: 'video', count: 3 }, thumbnailLabel: '视频缩略图' }));
  const wrap = view.thumbnail.wrap;
  assert.equal(wrap.hidden, false);
  assert.equal(wrap.attributes['aria-label'], '视频缩略图');
  assert.equal(wrap.attributes.role, 'img');
  assert.equal(view.thumbnail.src, '/x/a.png');
  assert.equal(wrap.children[0].textContent, '▷');
  assert.equal(wrap.children[2].textContent, '3');
  assert.equal(wrap.children[2].hidden, false);

  view.update(updatePayload({ thumbnail: { src: '', kind: 'text', count: 1 } }));
  assert.equal(wrap.children[2].textContent, '', '单条不显示数量');
  assert.equal(wrap.children[2].hidden, true);
  assert.equal(wrap.children[0].textContent, '≡');

  view.update(updatePayload({ thumbnail: null }));
  assert.equal(wrap.hidden, true);
  assert.equal(view.thumbnail.src, '');
});

test('taskCenterListView: 动作按钮按 id 复用，按参数改文案与禁用态，并按需增删', () => {
  const view = createTaskCardView('task-5');
  const actionsWrap = view.card.children[4];
  view.update(
    updatePayload({
      actions: [
        { id: 'cancel', label: '取消', pending: false },
        { id: 'open', label: '查看', danger: true, pending: true, localPath: '/x/a.png' },
      ],
    }),
  );
  assert.equal(actionsWrap.hidden, false);
  assert.equal(actionsWrap.children.length, 2);
  const [cancel, open] = actionsWrap.children;
  assert.equal(cancel.dataset.taskAction, 'cancel');
  assert.equal(cancel.dataset.taskId, 'task-5');
  assert.equal(cancel.disabled, false);
  assert.equal(cancel.attributes['aria-busy'], 'false');
  assert.equal(cancel.className, 'v2-task-card-action');
  assert.equal(open.className, 'v2-task-card-action v2-task-card-action--danger');
  assert.equal(open.disabled, true);
  assert.equal(open.textContent, '查看');
  assert.equal(open.dataset.localPath, '/x/a.png');

  view.update(updatePayload({ actions: [{ id: 'open', label: '查看', danger: true, pending: false }] }));
  assert.equal(actionsWrap.children.length, 1);
  assert.equal(actionsWrap.children[0], open, '同一个 id 的按钮被复用');
  assert.equal(open.disabled, false, 'pending 回落时解锁');

  view.update(updatePayload({ actions: [] }));
  assert.equal(actionsWrap.hidden, true);
  assert.equal(actionsWrap.children.length, 0);
});
