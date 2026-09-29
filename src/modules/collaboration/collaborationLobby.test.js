import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationLobby } from './collaborationLobby.js';

// Minimal element/event adapter. ContextMenuIcon is the real transitive import;
// focus, layout-free element factories and event dispatch are local stand-ins.
function documentAdapter() {
  const log = { tags: [], icons: 0 };
  const text = (value) => ({ nodeType: 3, textContent: String(value), parentNode: null });
  const elementsOf = (node) => node.childNodes.filter((child) => child.nodeType === 1);
  const descendants = (node) => {
    const found = [];
    const walk = (current) => {
      for (const child of elementsOf(current)) {
        found.push(child);
        walk(child);
      }
    };
    walk(node);
    return found;
  };
  const document = {
    activeElement: null,
    createElement(tag) {
      const attributes = new Map();
      const node = {
        nodeType: 1,
        localName: tag.toLowerCase(),
        className: '',
        childNodes: [],
        parentNode: null,
        id: '',
        type: '',
        value: '',
        hidden: false,
        disabled: false,
        readOnly: false,
        focusCount: 0,
        selectCount: 0,
        dataset: {},
        listeners: new Map(),
        setAttribute(key, value) {
          attributes.set(key, String(value));
        },
        getAttribute(key) {
          return attributes.get(key) ?? null;
        },
        hasAttribute(key) {
          return attributes.has(key);
        },
        removeAttribute(key) {
          attributes.delete(key);
        },
        querySelector(selector) {
          const match = selector.match(/^\[([\w-]+)="([^"]*)"\]$/);
          assert.ok(match, 'only attribute selectors are supported');
          return descendants(node).find((child) => child.getAttribute(match[1]) === match[2]) || null;
        },
        focus() {
          node.focusCount += 1;
          document.activeElement = node;
        },
        select() {
          node.selectCount += 1;
        },
        click() {
          for (const listener of node.listeners.get('click') || [])
            listener({ preventDefault() {}, stopPropagation() {} });
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
        prepend(...values) {
          for (const value of [...values].reverse()) {
            const child = value?.nodeType ? value : text(value);
            if (child.parentNode)
              child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
            child.parentNode = node;
            node.childNodes.unshift(child);
          }
        },
        insertBefore(child, before) {
          assert.ok(node.childNodes.includes(before), 'reference node must belong to the parent');
          if (child.parentNode)
            child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
          node.childNodes.splice(node.childNodes.indexOf(before), 0, child);
          child.parentNode = node;
          return child;
        },
        addEventListener(type, listener) {
          if (!node.listeners.has(type)) node.listeners.set(type, []);
          node.listeners.get(type).push(listener);
        },
      };
      Object.defineProperties(node, {
        children: { get: () => elementsOf(node) },
        lastChild: { get: () => node.childNodes[node.childNodes.length - 1] || null },
        textContent: {
          get: () => node.childNodes.map((child) => child.textContent).join(''),
          set(value) {
            node.childNodes = [];
            if (value != null && value !== '') node.append(text(value));
          },
        },
      });
      const classes = () => node.className.split(/\s+/).filter(Boolean);
      node.classList = {
        add(...names) {
          node.className = [...new Set([...classes(), ...names])].join(' ');
        },
        remove(...names) {
          node.className = classes()
            .filter((name) => !names.includes(name))
            .join(' ');
        },
        contains(name) {
          return classes().includes(name);
        },
      };
      if (node.localName === 'button') node.type = 'submit';
      log.tags.push(node.localName);
      return node;
    },
    createElementNS(namespace, tag) {
      const node = this.createElement(tag);
      node.namespaceURI = namespace;
      node.appendChild = (...values) => node.append(...values);
      if (tag === 'svg') log.icons += 1;
      return node;
    },
  };
  return { document, log };
}

function installDocument(t, document) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
}

function fire(node, type, over = {}) {
  const calls = { prevented: 0, stopped: 0 };
  const event = {
    key: 'key' in over ? over.key : '',
    isComposing: 'isComposing' in over ? over.isComposing : false,
    target: 'target' in over ? over.target : node,
    preventDefault: () => {
      calls.prevented += 1;
    },
    stopPropagation: () => {
      calls.stopped += 1;
    },
  };
  const results = (node.listeners.get(type) || []).map((listener) => listener(event));
  return { calls, results, event };
}

function click(node) {
  const listener = node.listeners.get('click')?.[0];
  assert.ok(listener, `${node.className} must have a click listener`);
  return listener({ preventDefault: () => {}, stopPropagation: () => {} });
}

function fixture(t, options = {}) {
  const { document, log } = documentAdapter();
  installDocument(t, document);
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };
  const button = (text, onClick, parent, busyLabel) => {
    const node = document.createElement('button');
    node.textContent = text;
    node.busyLabel = busyLabel;
    node.addEventListener('click', onClick);
    if (parent) parent.append(node);
    return node;
  };
  const input = (label, parent, settings = {}) => {
    const node = document.createElement('input');
    node.label = label;
    node.placeholder = 'placeholder' in settings ? settings.placeholder : '';
    if (parent) parent.append(node);
    return node;
  };
  const root = element('div', 'collaboration-root');
  const head = element('div', 'collaboration-head');
  head.append(element('span', 'head-title', '协作'), element('span', 'head-tail', '尾部'));
  const calls = { displayName: [], create: [], resume: 0, retry: [], join: [] };
  const actions = {
    setDisplayName: (value) => calls.displayName.push(value),
    create: (argument) => {
      calls.create.push(argument);
      return 'created';
    },
    resume: () => {
      calls.resume += 1;
      return 'resumed';
    },
    retryHostPort: (force) => calls.retry.push(force === true),
    join: (token) => calls.join.push(token),
  };
  let busy = 'busy' in options ? options.busy : false;
  const runCalls = [];
  const run = (trigger, task) => {
    runCalls.push({ trigger });
    return task();
  };
  const lobby = createCollaborationLobby({
    root,
    head,
    actions,
    element,
    button,
    input,
    run,
    isBusy: () => busy,
  });
  const tabs = root.children[0];
  const hostView = root.children[1];
  const joinView = root.children[2];
  const sessionSlot = root.children[3];
  const sessionControls = root.children[4];
  const footer = root.children[5];
  const currentBlock = hostView.children[0];
  const portSection = hostView.children[1];
  const hostActions = currentBlock.children[2];
  return {
    document,
    log,
    root,
    head,
    lobby,
    calls,
    runCalls,
    tabs,
    hostTab: tabs.children[0],
    joinTab: tabs.children[1],
    hostView,
    joinView,
    sessionSlot,
    sessionControls,
    footer,
    currentBlock,
    portSection,
    profile: head.children[1],
    nicknameInput: head.children[1].children[0],
    editButton: head.children[1].children[1],
    currentIcon: currentBlock.children[0],
    currentStrong: currentBlock.children[1].children[0],
    nodeCount: currentBlock.children[1].children[1],
    hostActions,
    primaryButton: hostActions.children[0],
    choice: hostActions.children[1],
    resumeButton: hostActions.children[1].children[0],
    freshButton: hostActions.children[1].children[1],
    portMessage: portSection.children[0],
    portActions: portSection.children[2],
    retryButton: portSection.children[2].children[0],
    changePortButton: portSection.children[2].children[1],
    joinHeading: joinView.children[0],
    inviteInput: joinView.children[2],
    joinButton: joinView.children[3],
    helpDetails: footer.children[1],
    setBusy: (value) => {
      busy = value;
    },
  };
}

function render(t, ctx, over = {}) {
  ctx.lobby.render({
    hostPortConflict: 'hostPortConflict' in over ? over.hostPortConflict : undefined,
    session: 'session' in over ? over.session : undefined,
    displayName: 'displayName' in over ? over.displayName : undefined,
    nodeCount: 'nodeCount' in over ? over.nodeCount : 0,
    resumeRoom: 'resumeRoom' in over ? over.resumeRoom : undefined,
  });
  return t;
}

test('the profile row is inserted into the head before its last child', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.head.children.length, 3);
  assert.equal(ctx.head.children[0].className, 'head-title');
  assert.equal(ctx.profile.className, 'collaboration-profile');
  assert.equal(ctx.head.children[1], ctx.profile);
  assert.equal(ctx.head.children[2].className, 'head-tail');
});

test('the nickname input is capped and reports changes to setDisplayName', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.nicknameInput.maxLength, 32);
  assert.equal(ctx.nicknameInput.label, '协作昵称');
  ctx.nicknameInput.value = 'Ann';
  fire(ctx.nicknameInput, 'change');
  assert.deepEqual(ctx.calls.displayName, ['Ann']);
});

test('the quiet edit button focuses and selects the nickname input', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.editButton.type, 'button');
  assert.equal(ctx.editButton.className, 'collaboration-button collaboration-quiet');
  assert.equal(ctx.editButton.getAttribute('aria-label'), '修改协作昵称');
  assert.equal(ctx.editButton.children[0].getAttribute('data-context-menu-icon'), 'edit');
  click(ctx.editButton);
  assert.equal(ctx.nicknameInput.focusCount, 1);
  assert.equal(ctx.nicknameInput.selectCount, 1);
});

test('the tablist carries two tabs wired to their views', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.tabs.className, 'collaboration-tabs');
  assert.equal(ctx.tabs.getAttribute('role'), 'tablist');
  assert.equal(ctx.tabs.getAttribute('aria-label'), '协作方式');
  assert.equal(ctx.tabs.dataset.mode, 'host');
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.id),
    ['collaboration-host-tab', 'collaboration-join-tab'],
  );
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.textContent),
    ['开房', '加入'],
  );
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.getAttribute('aria-controls')),
    ['collaboration-host-view', 'collaboration-join-view'],
  );
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.getAttribute('role')),
    ['tab', 'tab'],
  );
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.getAttribute('aria-selected')),
    ['true', 'false'],
  );
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.tabIndex),
    [0, -1],
  );
});

test('both views exist with tabpanel roles and only host is visible', (t) => {
  const ctx = fixture(t);
  assert.deepEqual(
    [ctx.hostView.id, ctx.joinView.id],
    ['collaboration-host-view', 'collaboration-join-view'],
  );
  assert.deepEqual(
    [ctx.hostView.getAttribute('role'), ctx.joinView.getAttribute('role')],
    ['tabpanel', 'tabpanel'],
  );
  assert.deepEqual(
    [ctx.hostView.getAttribute('aria-labelledby'), ctx.joinView.getAttribute('aria-labelledby')],
    ['collaboration-host-tab', 'collaboration-join-tab'],
  );
  assert.equal(ctx.hostView.hidden, false);
  assert.equal(ctx.joinView.hidden, true);
});

test('the current-canvas block shows the canvas label, an empty node count and the source icon', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.currentStrong.textContent, '当前画布');
  assert.equal(ctx.nodeCount.textContent, '');
  assert.equal(ctx.currentIcon.getAttribute('data-context-menu-icon'), 'source');
  assert.equal(ctx.currentIcon.getAttribute('width'), '28');
});

test('host actions expose the immediate host button and a hidden choice', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.primaryButton.textContent, '立即开房');
  assert.equal(ctx.primaryButton.type, 'button');
  assert.equal(ctx.primaryButton.hidden, false);
  assert.equal(ctx.choice.className, 'collaboration-host-choice');
  assert.equal(ctx.choice.hidden, true);
  assert.equal(ctx.choice.getAttribute('role'), 'group');
  assert.equal(ctx.choice.getAttribute('aria-label'), '恢复上次协作或新建协作');
  assert.equal(ctx.resumeButton.className, 'collaboration-primary');
  assert.equal(ctx.freshButton.textContent, '新建协作');
});

test('hosting with no resumable room runs create straight away', (t) => {
  const ctx = fixture(t);
  click(ctx.primaryButton);
  assert.equal(ctx.runCalls.length, 1);
  assert.equal(ctx.runCalls[0].trigger, ctx.primaryButton);
  assert.deepEqual(ctx.calls.create, [undefined]);
  assert.equal(ctx.primaryButton.hidden, false);
  assert.equal(ctx.choice.hidden, true);
});

test('hosting with a resumable room opens the resume-or-fresh choice', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  assert.deepEqual(ctx.calls.create, []);
  assert.equal(ctx.primaryButton.hidden, true);
  assert.equal(ctx.choice.hidden, false);
  assert.equal(ctx.resumeButton.focusCount, 1);
  assert.ok(ctx.document.activeElement === ctx.resumeButton);
});

test('the choice buttons call resume and a fresh create', (t) => {
  const ctx = fixture(t);
  click(ctx.resumeButton);
  assert.equal(ctx.calls.resume, 1);
  click(ctx.freshButton);
  assert.deepEqual(ctx.calls.create, [{ fresh: true }]);
});

test('resetHostChoice restores the immediate host button', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  ctx.lobby.resetHostChoice();
  assert.equal(ctx.primaryButton.hidden, false);
  assert.equal(ctx.choice.hidden, true);
});

test('Escape on the choice resets it and returns focus to the host button', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  const { calls } = fire(ctx.choice, 'keydown', { key: 'Escape' });
  assert.equal(calls.prevented, 1);
  assert.equal(calls.stopped, 1);
  assert.equal(ctx.choice.hidden, true);
  assert.equal(ctx.primaryButton.focusCount, 1);
});

test('Escape on the choice is inert while a busy control is present', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  const busyChild = ctx.document.createElement('button');
  busyChild.setAttribute('aria-busy', 'true');
  ctx.choice.append(busyChild);
  const { calls } = fire(ctx.choice, 'keydown', { key: 'Escape' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.choice.hidden, false);
});

test('non-Escape keys on the choice are ignored', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  const { calls } = fire(ctx.choice, 'keydown', { key: 'Enter' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.choice.hidden, false);
});

test('the port recovery section is hidden with both retry buttons wired', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.portSection.localName, 'div');
  assert.equal(ctx.portSection.hidden, true);
  assert.equal(ctx.portSection.getAttribute('aria-label'), '协作端口恢复');
  assert.equal(ctx.retryButton.textContent, '重试原端口');
  assert.equal(ctx.retryButton.busyLabel, '正在重试协作连接…');
  assert.equal(ctx.changePortButton.textContent, '更换端口并继续');
  assert.equal(ctx.changePortButton.busyLabel, '正在更换协作端口…');
  click(ctx.retryButton);
  click(ctx.changePortButton);
  assert.deepEqual(ctx.calls.retry, [false, true]);
});

test('the join view explains how to join and exposes a disabled join button', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.joinHeading.textContent, '加入协作画布');
  assert.equal(ctx.inviteInput.label, '邀请连接信息');
  assert.equal(ctx.inviteInput.placeholder, '粘贴房主生成的 AICLAN2.…');
  assert.equal(ctx.joinButton.textContent, '加入协作');
  assert.equal(ctx.joinButton.className.includes('collaboration-primary'), true);
  assert.equal(ctx.joinButton.disabled, true);
});

test('the join button submits the trimmed invite token', (t) => {
  const ctx = fixture(t);
  ctx.inviteInput.value = '  AICLAN2.token  ';
  click(ctx.joinButton);
  assert.deepEqual(ctx.calls.join, ['AICLAN2.token']);
});

test('typing an invite token enables the join button unless busy', (t) => {
  const ctx = fixture(t);
  ctx.inviteInput.value = 'token';
  fire(ctx.inviteInput, 'input');
  assert.equal(ctx.joinButton.disabled, false);
  ctx.setBusy(true);
  fire(ctx.inviteInput, 'input');
  assert.equal(ctx.joinButton.disabled, true);
});

test('a blank invite keeps the join button disabled', (t) => {
  const ctx = fixture(t);
  ctx.inviteInput.value = '   ';
  fire(ctx.inviteInput, 'input');
  assert.equal(ctx.joinButton.disabled, true);
});

test('Enter in the invite field clicks the join button', (t) => {
  const ctx = fixture(t);
  ctx.inviteInput.value = 'token';
  const { calls, results } = fire(ctx.inviteInput, 'keydown', { key: 'Enter' });
  assert.equal(calls.prevented, 1);
  assert.equal(results.length, 1);
  assert.deepEqual(ctx.calls.join, ['token']);
});

test('composing Enter in the invite field is ignored', (t) => {
  const ctx = fixture(t);
  ctx.inviteInput.value = 'token';
  const { calls } = fire(ctx.inviteInput, 'keydown', { key: 'Enter', isComposing: true });
  assert.equal(calls.prevented, 0);
  assert.deepEqual(ctx.calls.join, []);
});

test('the footer carries the licence note and the help details', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.footer.className, 'collaboration-lobby-footer');
  assert.equal(ctx.footer.children[0].textContent, '已使用本机画布授权');
  assert.equal(ctx.helpDetails.className, 'collaboration-help');
  assert.equal(ctx.helpDetails.children[0].textContent, '连接说明');
  assert.equal(ctx.helpDetails.children[0].children[0].getAttribute('data-context-menu-icon'), 'details');
  assert.equal(ctx.helpDetails.children.length, 3);
  assert.equal(ctx.log.icons, 3);
});

test('mountSession and mountSessionControls append into their slots', (t) => {
  const ctx = fixture(t);
  const session = ctx.document.createElement('div');
  const one = ctx.document.createElement('button');
  const two = ctx.document.createElement('button');
  ctx.lobby.mountSession(session);
  ctx.lobby.mountSessionControls(one, two);
  assert.equal(ctx.sessionSlot.children.length, 1);
  assert.equal(ctx.sessionSlot.children[0], session);
  assert.deepEqual(ctx.sessionControls.children, [one, two]);
});

test('render hides the port section unless a conflict is present', (t) => {
  const ctx = fixture(t);
  render(t, ctx, {});
  assert.equal(ctx.portSection.hidden, true);
  render(t, ctx, { hostPortConflict: { message: '端口被占用' } });
  assert.equal(ctx.portSection.hidden, false);
  assert.equal(ctx.portMessage.textContent, '端口被占用');
  render(t, ctx, { hostPortConflict: { message: '端口被占用' }, session: { role: 'owner' } });
  assert.equal(ctx.portSection.hidden, true);
});

test('render clears the port message when the conflict is gone', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { hostPortConflict: { message: '端口被占用' } });
  render(t, ctx, {});
  assert.equal(ctx.portMessage.textContent, '');
});

test('render reflects busy state on the host and retry buttons', (t) => {
  const ctx = fixture(t);
  ctx.setBusy(true);
  render(t, ctx, {});
  assert.equal(ctx.primaryButton.disabled, true);
  assert.equal(ctx.retryButton.disabled, true);
  assert.equal(ctx.changePortButton.disabled, true);
  ctx.setBusy(false);
  render(t, ctx, {});
  assert.equal(ctx.primaryButton.disabled, false);
  assert.equal(ctx.retryButton.disabled, false);
  assert.equal(ctx.changePortButton.disabled, false);
});

test('render writes the display name into the nickname field', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { displayName: 'Ann' });
  assert.equal(ctx.nicknameInput.value, 'Ann');
  render(t, ctx, {});
  assert.equal(ctx.nicknameInput.value, '成员');
});

test('render leaves the nickname field alone while it has focus', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { displayName: 'Ann' });
  ctx.document.activeElement = ctx.nicknameInput;
  render(t, ctx, { displayName: 'Bob' });
  assert.equal(ctx.nicknameInput.value, 'Ann');
});

test('render reports the node count', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { nodeCount: 12 });
  assert.equal(ctx.nodeCount.textContent, '12 个节点');
  render(t, ctx, {});
  assert.equal(ctx.nodeCount.textContent, '0 个节点');
});

test('render hides the lobby chrome while a session is active', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { session: { role: 'owner' } });
  assert.equal(ctx.tabs.hidden, true);
  assert.equal(ctx.footer.hidden, true);
  assert.equal(ctx.sessionControls.hidden, false);
  assert.equal(ctx.nicknameInput.readOnly, true);
  assert.equal(ctx.editButton.hidden, true);
  assert.equal(ctx.sessionSlot.hidden, false);
});

test('render hides the profile row when the root is hidden', (t) => {
  const ctx = fixture(t);
  ctx.root.hidden = true;
  render(t, ctx, {});
  assert.equal(ctx.profile.hidden, true);
  ctx.root.hidden = false;
  render(t, ctx, {});
  assert.equal(ctx.profile.hidden, false);
});

test('an owner session locks both views away and disables the join tab', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { session: { role: 'owner' } });
  assert.equal(ctx.tabs.dataset.mode, 'host');
  assert.equal(ctx.hostView.hidden, true);
  assert.equal(ctx.joinView.hidden, true);
  assert.equal(ctx.hostTab.disabled, false);
  assert.equal(ctx.joinTab.disabled, true);
  assert.equal(ctx.hostTab.tabIndex, 0);
  assert.equal(ctx.joinTab.tabIndex, -1);
});

test('a member session locks both views away and disables the host tab', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { session: { role: 'member' } });
  assert.equal(ctx.tabs.dataset.mode, 'join');
  assert.equal(ctx.hostView.hidden, true);
  assert.equal(ctx.joinView.hidden, true);
  assert.equal(ctx.hostTab.disabled, true);
  assert.equal(ctx.joinTab.disabled, false);
});

test('locked tabs refuse to switch mode', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { session: { role: 'owner' } });
  click(ctx.joinTab);
  assert.equal(ctx.tabs.dataset.mode, 'host');
  assert.equal(ctx.joinView.hidden, true);
});

test('leaving a session restores the unlocked host view', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { session: { role: 'member' } });
  render(t, ctx, {});
  assert.equal(ctx.tabs.dataset.mode, 'host');
  assert.equal(ctx.hostView.hidden, false);
  assert.equal(ctx.joinView.hidden, true);
  assert.equal(ctx.tabs.hidden, false);
});

test('clicking a tab switches the visible view', (t) => {
  const ctx = fixture(t);
  click(ctx.joinTab);
  assert.equal(ctx.tabs.dataset.mode, 'join');
  assert.equal(ctx.hostView.hidden, true);
  assert.equal(ctx.joinView.hidden, false);
  assert.equal(ctx.joinTab.getAttribute('aria-selected'), 'true');
  assert.equal(ctx.hostTab.getAttribute('aria-selected'), 'false');
  assert.deepEqual(
    ctx.tabs.children.map((tab) => tab.tabIndex),
    [-1, 0],
  );
});

test('tab arrow keys move between the two views and focus the new tab', (t) => {
  const ctx = fixture(t);
  const { calls } = fire(ctx.hostTab, 'keydown', { key: 'ArrowRight' });
  assert.equal(calls.prevented, 1);
  assert.equal(ctx.tabs.dataset.mode, 'join');
  assert.equal(ctx.joinTab.focusCount, 1);
  fire(ctx.joinTab, 'keydown', { key: 'ArrowLeft' });
  assert.equal(ctx.tabs.dataset.mode, 'host');
  assert.equal(ctx.hostTab.focusCount, 1);
});

test('Home and End jump the tabs to the ends', (t) => {
  const ctx = fixture(t);
  fire(ctx.hostTab, 'keydown', { key: 'End' });
  assert.equal(ctx.tabs.dataset.mode, 'join');
  fire(ctx.joinTab, 'keydown', { key: 'Home' });
  assert.equal(ctx.tabs.dataset.mode, 'host');
});

test('unrelated tab keys are ignored', (t) => {
  const ctx = fixture(t);
  const { calls } = fire(ctx.hostTab, 'keydown', { key: 'a' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.tabs.dataset.mode, 'host');
});

test('a changed resume room closes an open host choice', (t) => {
  const ctx = fixture(t);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  click(ctx.primaryButton);
  assert.equal(ctx.choice.hidden, false);
  render(t, ctx, { resumeRoom: { canvasId: 'c1', roomId: 'r1', hosting: true } });
  assert.equal(ctx.choice.hidden, false);
  render(t, ctx, { resumeRoom: { canvasId: 'c2', roomId: 'r1', hosting: true } });
  assert.equal(ctx.choice.hidden, true);
  assert.equal(ctx.primaryButton.hidden, false);
});

test('render syncs the join button from the invite value', (t) => {
  const ctx = fixture(t);
  render(t, ctx, {});
  assert.equal(ctx.joinButton.disabled, true);
  ctx.inviteInput.value = 'token';
  render(t, ctx, {});
  assert.equal(ctx.joinButton.disabled, false);
});

test('render leaves a busy join button alone', (t) => {
  const ctx = fixture(t);
  ctx.joinButton.setAttribute('aria-busy', 'true');
  ctx.joinButton.disabled = true;
  ctx.inviteInput.value = 'token';
  render(t, ctx, {});
  assert.equal(ctx.joinButton.disabled, true);
});

test('the construction icon count confirms three distinct icons', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.log.icons, 3);
  assert.equal(ctx.editButton.children[0].getAttribute('data-context-menu-icon'), 'edit');
  assert.equal(ctx.currentIcon.getAttribute('data-context-menu-icon'), 'source');
  assert.equal(ctx.helpDetails.children[0].children[0].getAttribute('data-context-menu-icon'), 'details');
});

test('the root receives the tabs, both views, both slots and the footer', (t) => {
  const ctx = fixture(t);
  assert.deepEqual(
    ctx.root.children.map((child) => child.className),
    [
      'collaboration-tabs',
      'collaboration-lobby-view',
      'collaboration-lobby-view',
      'collaboration-session-slot',
      'collaboration-session-controls',
      'collaboration-lobby-footer',
    ],
  );
});
