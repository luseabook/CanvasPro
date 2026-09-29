import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationMembers, onlineCollaborationActors } from './collaborationMembers.js';

function createElementFactory(registry) {
  return (tag, className = '', text = '') => {
    const node = {
      tagName: tag,
      className,
      textContent: text,
      id: '',
      hidden: false,
      disabled: false,
      value: '',
      tabIndex: -1,
      isConnected: true,
      firstElementChild: null,
      dataset: {},
      attributes: {},
      children: [],
      options: [],
      selectedOptions: [],
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      append(...items) {
        this.children.push(...items.filter(Boolean));
      },
      replaceChildren() {
        this.children = [];
      },
      before() {},
      focus() {},
      querySelector: () => null,
      dispatchEvent() {},
      showPopover() {},
      hidePopover() {},
      getBoundingClientRect: () => ({ width: 200, top: 0, bottom: 30, right: 100 }),
      checkVisibility: () => true,
      insertBefore(item, reference) {
        const index = reference ? this.children.indexOf(reference) : -1;
        if (index < 0) this.children.push(item);
        else this.children.splice(index, 0, item);
      },
      remove() {
        this.removed = true;
      },
      addEventListener() {},
      removeEventListener() {},
    };
    registry.push(node);
    return node;
  };
}

function createButtonFactory(registry) {
  return (label, handler, parent) => {
    const button = {
      label,
      handler,
      textContent: label,
      disabled: false,
      attributes: {},
      classList: { add() {}, remove() {} },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      removeEventListener() {},
    };
    registry.push(button);
    parent?.append?.(button);
    return button;
  };
}

function createHarness(overrides = {}) {
  const created = [];
  const calls = { follow: [], member: [], remove: [], confirm: [] };
  const state = { session: overrides.session || null, actorId: overrides.actorId || 'me' };
  const root = createElementFactory(created)('div', 'collaboration-members');
  const members = createCollaborationMembers({
    root,
    element: createElementFactory(created),
    button: createButtonFactory(created),
    run: (trigger, action) => action(),
    actions: {
      follow: (id) => calls.follow.push(id),
      member: (id, role) => calls.member.push([id, role]),
      remove: (id) => calls.remove.push(id),
    },
    confirmAction: (message, action) => calls.confirm.push([message, action]),
    getState: () => state,
  });
  return { members, root, created, calls, state };
}

const nowSec = () => Math.floor(Date.now() / 1000);

const stubRegistry = [];
const originalGlobals = {};
globalThis.document = { createElement: (tag) => createElementFactory(stubRegistry)(tag) };
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'uuid-stub' },
  configurable: true,
  writable: true,
});
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
test.after(() => {
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
  for (const [key, value] of Object.entries(originalGlobals)) globalThis[key] = value;
});

test('collaborationMembers: 在线集合按 presence 有效期与自身状态计算', () => {
  assert.equal(onlineCollaborationActors(null, 'me').size, 0);
  const session = {
    status: 'online',
    presence: [
      { actorId: 'a', expiresAt: nowSec() + 60 },
      { actorId: 'b', expiresAt: nowSec() - 60 },
      { actorId: 'c' },
    ],
  };
  const online = onlineCollaborationActors(session, 'me');
  assert.deepEqual([...online].sort(), ['a', 'c', 'me']);
  assert.equal(onlineCollaborationActors({ ...session, status: 'offline' }, 'me').has('me'), false);
  assert.equal(onlineCollaborationActors({ ...session, status: 'blocked' }, 'me').has('me'), false);
  assert.equal(onlineCollaborationActors(session, '').has(''), false);
});

test('collaborationMembers: 没渲染过成员时 close 与 destroy 都是安全的空操作', () => {
  const { members } = createHarness();
  assert.equal(typeof members.render, 'function');
  assert.equal(typeof members.close, 'function');
  assert.equal(typeof members.destroy, 'function');
  members.close();
  members.destroy();
  members.destroy();
});

test('collaborationMembers: 渲染先建行再按成员顺序排布，并返回在线数', () => {
  const memberList = [
    { id: 'a', name: 'Ann', role: 'owner' },
    { id: 'b', name: 'Bob', role: 'editor' },
  ];
  const { members, root, created, calls } = createHarness({
    session: { roomId: 'r1', role: 'viewer', members: memberList, presence: [{ actorId: 'a' }] },
  });
  const onlineCount = members.render({ session: { roomId: 'r1', role: 'viewer', members: memberList, presence: [{ actorId: 'a' }] }, actorId: 'me' });
  assert.equal(onlineCount, 2, '在线的 a 与受邀的自己');
  const rows = created.filter((node) => node.className === 'collaboration-member');
  assert.equal(rows.length, 2);
  assert.deepEqual(root.children, rows, '行顺序与成员顺序一致');
  const roleLabels = created.filter((node) => node.className === 'collaboration-member-role').map((node) => node.textContent);
  assert.deepEqual(roleLabels, ['房主', '可编辑']);
  assert.equal(
    created.filter((node) => node.tagName === 'select').length,
    0,
    '查看者看不到权限下拉与移除按钮',
  );
  const followButtons = created.filter((node) => node.textContent === '跟随' || node.textContent === '中止跟随');
  assert.equal(followButtons.length, 2);
  assert.equal(followButtons[0].disabled, false, 'a 在线可以跟随');
  assert.equal(followButtons[1].disabled, true, 'b 离线不能跟随');
  followButtons[0].handler();
  followButtons[1].handler();
  assert.deepEqual(calls.follow, ['a', 'b']);
});

test('collaborationMembers: 在线状态变化只更新数据集与按钮，不重建行', () => {
  const memberList = [{ id: 'a', name: 'Ann', role: 'editor' }];
  const { members, created } = createHarness();
  const base = { roomId: 'r1', role: 'viewer', members: memberList, presence: [] };
  members.render({ session: base, actorId: 'me' });
  const rowsAfterFirst = created.filter((node) => node.className === 'collaboration-member').length;
  const onlineDots = created.filter((node) => node.className === 'collaboration-member-online');
  assert.equal(onlineDots[0].dataset.online, 'false');
  assert.equal(onlineDots[0].attributes['aria-label'], '离线');

  members.render({ session: { ...base, presence: [{ actorId: 'a' }] }, actorId: 'me' });
  assert.equal(created.filter((node) => node.className === 'collaboration-member').length, rowsAfterFirst);
  assert.equal(onlineDots[0].dataset.online, 'true');
  assert.equal(onlineDots[0].attributes['aria-label'], '在线');
  const follow = created.find((node) => node.textContent === '跟随');
  assert.equal(follow.disabled, false);
});

test('collaborationMembers: 成员被移除时销毁自己的行与控件', () => {
  const memberList = [{ id: 'a', name: 'Ann', role: 'editor' }, { id: 'b', name: 'Bob', role: 'editor' }];
  const { members, created } = createHarness();
  const base = { roomId: 'r1', role: 'viewer', members: memberList, presence: [] };
  members.render({ session: base, actorId: 'me' });
  const rows = created.filter((node) => node.className === 'collaboration-member');
  assert.equal(rows.length, 2);
  members.render({ session: { ...base, members: [memberList[1]] }, actorId: 'me' });
  assert.equal(rows[0].removed, true, '离场成员的行被摘掉');
  assert.equal(rows[1].removed, undefined);
  members.destroy();
  assert.equal(rows[1].removed, undefined, 'destroy 只解绑权限与昵称控件，不摘行');
  const before = created.filter((node) => node.className === 'collaboration-member').length;
  members.render({ session: { ...base, roomId: 'r2', members: [memberList[1]] }, actorId: 'me' });
  assert.equal(
    created.filter((node) => node.className === 'collaboration-member').length,
    before + 1,
    '销毁后换房间渲染会重建行',
  );
});

test('collaborationMembers: 房主视角会给可管理成员挂权限下拉与移除按钮', () => {
  const memberList = [{ id: 'a', name: 'Ann', role: 'editor' }];
  const { members, created, calls } = createHarness();
  members.render({
    session: { roomId: 'r1', role: 'owner', members: memberList, presence: [] },
    actorId: 'me',
  });
  const selects = created.filter((node) => node.tagName === 'select');
  assert.equal(selects.length, 1);
  assert.deepEqual(selects[0].children.map((node) => node.value), ['admin', 'editor', 'viewer']);
  assert.equal(selects[0].value, 'editor');
  const removeButton = created.find((node) => node.textContent === '移除');
  assert.ok(removeButton);
  removeButton.handler();
  assert.equal(calls.confirm.length, 1);
  assert.equal(calls.confirm[0][0], '移除 Ann 并使现有邀请信息失效？');
  assert.equal(calls.remove.length, 0, '确认前不真的移除');
  calls.confirm[0][1]();
  assert.deepEqual(calls.remove, ['a']);
});

test('collaborationMembers: 管理员只能改可编辑与只读，改不了另一位管理员', () => {
  const memberList = [
    { id: 'a', name: 'Ann', role: 'admin' },
    { id: 'b', name: 'Bob', role: 'editor' },
  ];
  const { members, created } = createHarness();
  members.render({
    session: { roomId: 'r1', role: 'admin', members: memberList, presence: [] },
    actorId: 'me',
  });
  const selects = created.filter((node) => node.tagName === 'select');
  assert.equal(selects.length, 1, '管理员动不了另一位管理员');
  assert.deepEqual(selects[0].children.map((node) => node.value), ['editor', 'viewer']);
  const roles = created.filter((node) => node.className === 'collaboration-member-role').map((node) => node.textContent);
  assert.deepEqual(roles, ['管理员']);
});
