import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationInvitation } from './collaborationInvitation.js';

function createFakeDocument() {
  const created = [];
  function make(tag, className = '', text = '') {
    const node = {
      tagName: tag,
      className,
      textContent: text,
      id: '',
      hidden: false,
      disabled: false,
      value: '',
      readOnly: false,
      tabIndex: -1,
      isConnected: true,
      innerHTML: '',
      dataset: {},
      attributes: {},
      children: [],
      options: [],
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      append(...items) {
        for (const item of items.filter(Boolean)) {
          this.children.push(item);
          if (item.tagName === 'option') this.options.push(item);
        }
      },
      replaceChildren() {
        this.children = [];
        this.options = [];
      },
      before() {},
      focus() {},
      remove() {
        this.removed = true;
      },
      querySelector: () => null,
      dispatchEvent() {},
      showPopover() {},
      hidePopover() {},
      getBoundingClientRect: () => ({ width: 200, top: 0, bottom: 30, right: 100 }),
      checkVisibility: () => true,
      addEventListener(name, handler) {
        (this.listeners[name] ||= []).push(handler);
      },
      removeEventListener() {},
      listeners: {},
    };
    Object.defineProperty(node, 'selectedOptions', {
      get() {
        return this.options.filter((option) => option.value === this.value);
      },
    });
    created.push(node);
    return node;
  }
  return {
    created,
    documentObject: {
      createElement: (tag, className, text) => make(tag, className, text),
      documentElement: make('html'),
      body: make('body'),
      activeElement: null,
      getElementById: () => null,
      addEventListener() {},
      removeEventListener() {},
    },
  };
}

const savedCrypto = { present: Object.hasOwn(globalThis, 'crypto'), value: globalThis.crypto };
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'uuid-stub' },
  configurable: true,
  writable: true,
});
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.innerWidth = 1200;
globalThis.innerHeight = 800;
test.after(() => {
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
  delete globalThis.innerWidth;
  delete globalThis.innerHeight;
  if (savedCrypto.present) {
    Object.defineProperty(globalThis, 'crypto', {
      value: savedCrypto.value,
      configurable: true,
      writable: true,
    });
  }
});

function createHarness() {
  const { documentObject, created } = createFakeDocument();
  globalThis.document = documentObject;
  const calls = { invite: [], copy: [], feedback: [] };
  const state = { session: null };
  const makeElement = (tag, className, text) => documentObject.createElement(tag, className, text);
  const root = makeElement('div', 'collaboration-panel');
  const invitation = createCollaborationInvitation({
    root,
    element: makeElement,
    button: (label, handler, parent) => {
      const button = makeElement('button');
      button.textContent = label;
      button.handler = handler;
      parent.append(button);
      return button;
    },
    input: (label, parent, options = {}) => {
      const input = makeElement('input');
      input.label = label;
      input.placeholder = options.placeholder;
      parent.append(input);
      return input;
    },
    actions: {
      invite: async (role, address, expiry) => {
        calls.invite.push([role, address, expiry]);
        return 'INVITE-TOKEN';
      },
      copy: async (value) => {
        calls.copy.push(value);
      },
    },
    getState: () => state,
    feedback: (text) => calls.feedback.push(text),
  });
  const selects = created.filter((node) => node.tagName === 'select');
  const inviteButton = created.find((node) => node.textContent === '获取邀请' && node.handler);
  const roleButton = created.find((node) => node.className.includes('collaboration-invite-role'));
  const clickRole = () => roleButton.listeners.click[0]();
  const input = created.find((node) => node.label === '邀请信息');
  return { invitation, root, created, calls, state, selects, inviteButton, roleButton, clickRole, input };
}

test('collaborationInvitation: 构造出标题、权限按钮、有效期选项与只读邀请框', () => {
  const { root, created, inviteButton, roleButton, input, selects } = createHarness();
  assert.ok(root.children.some((node) => node.className === 'collaboration-invite-heading'));
  assert.ok(created.some((node) => node.tagName === 'h4' && node.textContent === '邀请成员'));
  assert.equal(roleButton.textContent, '可编辑');
  assert.equal(roleButton.attributes['aria-pressed'], 'true');
  assert.equal(selects.length, 2, '有效期与局域网地址各一个下拉');
  assert.deepEqual(selects[0].children.map((node) => node.value), ['permanent', '1d', '3d', '7d']);
  assert.deepEqual(selects[0].children.map((node) => node.textContent), ['永久', '1 天', '3 天', '7 天']);
  assert.equal(input.readOnly, true);
  assert.equal(input.placeholder, '获取后可反复分享');
  assert.equal(inviteButton.textContent, '获取邀请');
  assert.ok(root.hidden === false);
});

test('collaborationInvitation: 权限按钮在可编辑与只读之间切换并作废旧邀请', async () => {
  const { roleButton, clickRole, inviteButton, input, calls, state, selects } = createHarness();
  state.session = { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: ['192.168.1.5'] };
  selects[0].value = 'permanent';
  selects[1].value = '192.168.1.5';
  await inviteButton.handler();
  assert.equal(input.value, 'INVITE-TOKEN');
  assert.equal(inviteButton.textContent, '复制邀请');

  clickRole();
  assert.equal(roleButton.textContent, '只读');
  assert.equal(roleButton.attributes['aria-pressed'], 'false');
  assert.equal(input.value, '', '换权限会作废已取到的邀请');
  assert.equal(inviteButton.textContent, '获取邀请');

  clickRole();
  assert.equal(roleButton.textContent, '可编辑');
  await inviteButton.handler();
  assert.deepEqual(calls.invite, [
    ['editor', '192.168.1.5', 'permanent'],
    ['editor', '192.168.1.5', 'permanent'],
  ]);
  assert.equal(calls.feedback[0], '邀请已就绪，相同权限和有效期会复用未失效的邀请');
});

test('collaborationInvitation: 第二次点击改为复制已取到的邀请', async () => {
  const { inviteButton, input, calls, state, selects } = createHarness();
  state.session = { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] };
  selects[0].value = '3d';
  await inviteButton.handler();
  assert.equal(input.value, 'INVITE-TOKEN');
  await inviteButton.handler();
  assert.deepEqual(calls.copy, ['INVITE-TOKEN']);
  assert.deepEqual(calls.invite, [['editor', '', '3d']]);
  assert.equal(calls.feedback[calls.feedback.length - 1], '邀请信息已复制');
});

test('collaborationInvitation: 取邀请期间会话变化会被拒绝', async () => {
  const { inviteButton, calls, state, selects } = createHarness();
  state.session = { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] };
  selects[0].value = 'permanent';
  const original = calls.invite.length;
  const pending = inviteButton.handler();
  state.session = { roomId: 'r2', role: 'owner', hosting: true, hostAddresses: [] };
  await assert.rejects(() => pending, { message: '邀请设置已变化，请重新获取邀请' });
  assert.equal(calls.invite.length, original + 1);
});

test('collaborationInvitation: setBusy 与 invalidate 作用于邀请按钮', async () => {
  const { invitation, inviteButton, input, state, selects } = createHarness();
  state.session = { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] };
  selects[0].value = 'permanent';
  await inviteButton.handler();
  invitation.setBusy(true);
  assert.equal(inviteButton.disabled, true);
  invitation.setBusy(false);
  assert.equal(inviteButton.disabled, false);
  invitation.invalidate();
  assert.equal(input.value, '');
  assert.equal(inviteButton.textContent, '获取邀请');
});

test('collaborationInvitation: 只有房主与管理员能看见邀请区', () => {
  const { invitation, root, state } = createHarness();
  state.session = { roomId: 'r1', role: 'viewer', hosting: false, hostAddresses: [] };
  invitation.render({ session: state.session });
  assert.equal(root.hidden, true);
  invitation.render({ session: { roomId: 'r1', role: 'admin', hosting: true, hostAddresses: [] } });
  assert.equal(root.hidden, false);
  invitation.render({ session: { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] } });
  assert.equal(root.hidden, false);
});

test('collaborationInvitation: 局域网地址变化会重建选项，空地址给占位项', () => {
  const { invitation, selects, state } = createHarness();
  invitation.render({
    session: { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: ['192.168.1.5', '10.0.0.2'] },
  });
  assert.deepEqual(selects[1].children.map((node) => node.value), ['192.168.1.5', '10.0.0.2']);

  invitation.render({
    session: { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] },
  });
  assert.deepEqual(
    selects[1].children.map((node) => node.textContent),
    ['未发现局域网地址，仅限本机测试'],
  );
  assert.equal(selects[1].children[0].value, '');
});

test('collaborationInvitation: 只有联机中才显示局域网地址区', () => {
  const { invitation, created } = createHarness();
  invitation.render({ session: { roomId: 'r1', role: 'owner', hosting: false, hostAddresses: [] } });
  const field = created.find((node) => node.className === 'collaboration-field');
  const details = created.find((node) => node.tagName === 'details');
  assert.equal(field.hidden, true);
  assert.equal(details.hidden, true);
  invitation.render({ session: { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] } });
  assert.equal(field.hidden, false);
  assert.equal(details.hidden, false);
});

test('collaborationInvitation: 换房间会作废旧邀请并收起地址区', async () => {
  const { invitation, inviteButton, input, state, selects, created } = createHarness();
  state.session = { roomId: 'r1', role: 'owner', hosting: true, hostAddresses: [] };
  selects[0].value = 'permanent';
  await inviteButton.handler();
  assert.equal(input.value, 'INVITE-TOKEN');
  const details = created.find((node) => node.tagName === 'details');
  details.open = true;

  const nextSession = { roomId: 'r2', role: 'owner', hosting: true, hostAddresses: [] };
  invitation.render({ session: nextSession });
  assert.equal(input.value, '', '换房间作废旧邀请');
  assert.equal(inviteButton.textContent, '获取邀请');
  assert.equal(details.open, false);
  invitation.close();
});
