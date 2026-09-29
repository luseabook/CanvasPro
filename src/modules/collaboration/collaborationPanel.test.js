import test from 'node:test';
import assert from 'node:assert/strict';

import { createCollaborationPanel } from './collaborationPanel.js';

function createDocumentAdapter() {
  const documentListeners = new Map();

  function text(value) {
    return {
      nodeType: 3,
      textContent: String(value),
      parentNode: null,
    };
  }

  function createNode(tagName) {
    const attributes = new Map();
    const listeners = new Map();
    const properties = new Map();
    const node = {
      nodeType: 1,
      localName: tagName.toLowerCase(),
      tagName: tagName.toUpperCase(),
      className: '',
      childNodes: [],
      parentNode: null,
      dataset: {},
      hidden: false,
      disabled: false,
      open: false,
      value: '',
      textContent: '',
      ownerDocument: null,
      listeners,
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      hasAttribute(name) {
        return attributes.has(name);
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      removeEventListener(type, listener) {
        const current = listeners.get(type) || [];
        listeners.set(
          type,
          current.filter((candidate) => candidate !== listener),
        );
      },
      append(...children) {
        for (const value of children) {
          const child = value?.nodeType ? value : text(value);
          if (child.parentNode) child.parentNode.removeChild(child);
          child.parentNode = node;
          node.childNodes.push(child);
        }
      },
      appendChild(child) {
        node.append(child);
        return child;
      },
      prepend(...children) {
        for (const value of [...children].reverse()) {
          const child = value?.nodeType ? value : text(value);
          if (child.parentNode) child.parentNode.removeChild(child);
          child.parentNode = node;
          node.childNodes.unshift(child);
        }
      },
      insertBefore(child, before) {
        if (child.parentNode) child.parentNode.removeChild(child);
        const index = before ? node.childNodes.indexOf(before) : -1;
        node.childNodes.splice(index < 0 ? node.childNodes.length : index, 0, child);
        child.parentNode = node;
        return child;
      },
      before(child) {
        assert.ok(node.parentNode, 'before() requires a parent');
        node.parentNode.insertBefore(child, node);
      },
      replaceChildren(...children) {
        for (const child of node.childNodes) child.parentNode = null;
        node.childNodes = [];
        node.append(...children);
      },
      removeChild(child) {
        const index = node.childNodes.indexOf(child);
        if (index >= 0) node.childNodes.splice(index, 1);
        child.parentNode = null;
      },
      remove() {
        node.parentNode?.removeChild(node);
      },
      contains(candidate) {
        let current = candidate;
        while (current) {
          if (current === node) return true;
          current = current.parentNode;
        }
        return false;
      },
      querySelector(selector) {
        return querySelectorAll(node, selector)[0] || null;
      },
      querySelectorAll(selector) {
        return querySelectorAll(node, selector);
      },
      focus() {
        document.activeElement = node;
      },
      select() {},
      click() {},
      dispatchEvent() {},
      getBoundingClientRect() {
        return { top: 0, right: 0, bottom: 32, left: 0, width: 160, height: 32 };
      },
      checkVisibility() {
        return true;
      },
      show() {
        node.open = true;
      },
      close() {
        node.open = false;
      },
      showPopover() {},
      hidePopover() {},
      style: {
        setProperty(name, value) {
          properties.set(name, String(value));
        },
      },
    };
    const classNames = () => node.className.split(/\s+/).filter(Boolean);
    node.classList = {
      add(...names) {
        node.className = [...new Set([...classNames(), ...names])].join(' ');
      },
      remove(...names) {
        node.className = classNames()
          .filter((name) => !names.includes(name))
          .join(' ');
      },
      contains(name) {
        return classNames().includes(name);
      },
      toggle(name, force) {
        const enabled = force === undefined ? !classNames().includes(name) : Boolean(force);
        if (enabled) node.classList.add(name);
        else node.classList.remove(name);
        return enabled;
      },
    };
    Object.defineProperties(node, {
      children: {
        get: () => node.childNodes.filter((child) => child.nodeType === 1),
      },
      firstChild: {
        get: () => node.childNodes[0] || null,
      },
      lastChild: {
        get: () => node.childNodes[node.childNodes.length - 1] || null,
      },
      firstElementChild: {
        get: () => node.children[0] || null,
      },
      childElementCount: {
        get: () => node.children.length,
      },
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
            if (current === document) return true;
            current = current.parentNode;
          }
          return false;
        },
      },
      options: {
        get: () => node.children.filter((child) => child.localName === 'option'),
      },
      selectedOptions: {
        get: () => {
          const selected = node.options.find((option) => option.value === node.value);
          return selected ? [selected] : [];
        },
      },
      textContent: {
        get: () => node.childNodes.map((child) => child.textContent).join(''),
        set(value) {
          node.childNodes = [];
          if (value != null && String(value) !== '') node.append(String(value));
        },
      },
    });
    return node;
  }

  function querySelectorAll(root, selector) {
    const found = [];
    const simpleClass = selector.startsWith('.') ? selector.slice(1) : '';
    const simpleTag = /^[a-z][\w-]*$/i.test(selector) ? selector.toLowerCase() : '';
    const textMatch = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    const walk = (node) => {
      for (const child of node.childNodes || []) {
        if (child.nodeType !== 1) continue;
        if (
          (simpleClass && child.classList.contains(simpleClass)) ||
          (simpleTag && child.localName === simpleTag) ||
          (textMatch &&
            (textMatch[2] === undefined
              ? child.hasAttribute(textMatch[1])
              : child.getAttribute(textMatch[1]) === textMatch[2]))
        )
          found.push(child);
        walk(child);
      }
    };
    walk(root);
    return found;
  }

  const document = {
    activeElement: null,
    createElement: createNode,
    createElementNS(namespace, tagName) {
      const node = createNode(tagName);
      node.namespaceURI = namespace;
      return node;
    },
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      const current = documentListeners.get(type) || [];
      documentListeners.set(
        type,
        current.filter((candidate) => candidate !== listener),
      );
    },
  };
  document.body = createNode('body');
  document.documentElement = createNode('html');
  document.ownerDocument = document;
  document.defaultView = {
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener() {},
    removeEventListener() {},
  };
  const setOwner = (node) => {
    node.ownerDocument = document;
    for (const child of node.childNodes || []) setOwner(child);
  };
  const originalAppend = document.body.append;
  document.body.append = (...children) => {
    originalAppend(...children);
    setOwner(document.body);
  };
  return { document, documentListeners };
}

function installDocument(t, document) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const requestFrameDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const cancelFrameDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: document,
  });
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: () => 1,
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value() {},
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
    else delete globalThis.document;
    if (requestFrameDescriptor)
      Object.defineProperty(globalThis, 'requestAnimationFrame', requestFrameDescriptor);
    else delete globalThis.requestAnimationFrame;
    if (cancelFrameDescriptor)
      Object.defineProperty(globalThis, 'cancelAnimationFrame', cancelFrameDescriptor);
    else delete globalThis.cancelAnimationFrame;
  });
}

function findByClass(root, className) {
  return root.querySelectorAll(`.${className}`)[0] || null;
}

function findButton(root, label) {
  return root.querySelectorAll('button').find((button) => String(button.textContent).trim() === label);
}

function click(node) {
  const listener = node?.listeners.get('click')?.[0];
  assert.ok(listener, 'expected a click listener');
  return listener({ preventDefault() {}, stopPropagation() {} });
}

test('collaborationPanel: renders session state, confirms disconnect, and destroys cleanly', (t) => {
  const { document, documentListeners } = createDocumentAdapter();
  installDocument(t, document);
  const anchor = document.createElement('button');
  document.body.append(anchor);
  const calls = { disconnect: [], saveAndDisconnect: [], authenticate: 0 };
  const state = {
    authenticated: true,
    authenticating: false,
    actorId: 'owner',
    session: {
      roomId: 'room-1',
      name: '镜头协作',
      role: 'owner',
      hosting: true,
      status: 'connected',
      members: [{ id: 'owner', name: '房主', role: 'owner' }],
      jobs: [],
      conflicts: [],
      hostAddresses: ['192.168.1.2'],
      message: '',
    },
  };
  const panel = createCollaborationPanel({
    actions: {
      authenticate() {
        calls.authenticate += 1;
      },
      disconnect(options) {
        calls.disconnect.push(options);
      },
      saveAndDisconnect(options) {
        calls.saveAndDisconnect.push(options);
      },
      closeRoom() {},
      leaveRoom() {},
      resolveConflicts() {},
      resolveTask() {},
      revokeInvites() {},
      invite() {
        return '';
      },
      copy() {},
      follow() {},
      member() {},
      remove() {},
      renameSelf() {},
      refreshReview() {},
      summon() {},
    },
    getState: () => state,
    anchor,
  });

  panel.render();
  const dialog = document.body.children.find((child) => child.classList.contains('collaboration-dialog'));
  assert.ok(dialog);
  assert.equal(dialog.classList.contains('is-session'), true);
  assert.equal(findByClass(dialog, 'collaboration-room-role-badge').textContent, '房主');
  assert.equal(findByClass(dialog, 'collaboration-room-status').textContent, '本机开房 · 1 人在线');
  panel.feedback('已同步');
  assert.equal(findByClass(dialog, 'collaboration-feedback').textContent, '已同步');

  const disconnect = findButton(dialog, '结束本次联机');
  click(disconnect);
  const confirm = findByClass(dialog, 'collaboration-disconnect-confirm');
  assert.equal(confirm.hidden, false);
  assert.equal(disconnect.hidden, true);
  click(findButton(confirm, '取消'));
  assert.equal(confirm.hidden, true);
  assert.equal(disconnect.hidden, false);

  const listenerCount = (documentListeners.get('pointerdown') || []).length;
  panel.destroy();
  assert.equal(dialog.parentNode, null);
  assert.equal((documentListeners.get('pointerdown') || []).length, listenerCount - 1);
});

test('collaborationPanel: shows the authentication entry before authentication and hides the session body', (t) => {
  const { document } = createDocumentAdapter();
  installDocument(t, document);
  const panel = createCollaborationPanel({
    actions: {
      authenticate() {},
      activate() {},
      closeRoom() {},
      leaveRoom() {},
      resolveConflicts() {},
      resolveTask() {},
      revokeInvites() {},
      invite() {
        return '';
      },
      copy() {},
      follow() {},
      member() {},
      remove() {},
      renameSelf() {},
      refreshReview() {},
      summon() {},
    },
    getState: () => ({
      authenticated: false,
      authenticating: false,
      actorId: 'member',
      session: null,
    }),
  });

  panel.render();
  const dialog = document.body.children[0];
  const body = findByClass(dialog, 'collaboration-body');
  assert.equal(body.children[0].hidden, false);
  assert.equal(body.children[1].hidden, true);
  assert.equal(body.children[2].hidden, true);
  panel.destroy();
});
