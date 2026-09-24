import assert from 'node:assert/strict';
import test from 'node:test';

import { createAgentButton, createAgentElement, agentIconSvg } from './agentPanelElements.js';

function fakeElement(tagName) {
  const element = {
    tagName,
    attrs: {},
    children: [],
    className: '',
    textContent: '',
    innerHTML: '',
    type: '',
    title: '',
    disabled: false,
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
  };
  return element;
}

test('createAgentElement：写入 class 与文本', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentElement('div', 'agent-row', '标题');
  assert.equal(node.tagName, 'div');
  assert.equal(node.className, 'agent-row');
  assert.equal(node.textContent, '标题');
});

test('createAgentElement：空 class / 空文本时不写入属性', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentElement('span', '', '');
  assert.equal(node.className, '');
  assert.equal(node.textContent, '');
  assert.equal(createAgentElement('span').textContent, '');
});

test('createAgentButton：始终为 type=button 并带 class', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentButton('agent-btn', '发送');
  assert.equal(node.tagName, 'button');
  assert.equal(node.className, 'agent-btn');
  assert.equal(node.type, 'button');
  assert.equal(node.textContent, '发送');
});

test('createAgentButton：title 同步写入 title 与 aria-label', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentButton('agent-btn', '发送', { title: '发送消息' });
  assert.equal(node.title, '发送消息');
  assert.deepEqual(node.attrs, { 'aria-label': '发送消息' });
});

test('createAgentButton：无 title 时不写 aria-label', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentButton('agent-btn', '发送', { title: '' });
  assert.deepEqual(node.attrs, {});
});

test('createAgentButton：带 icon 时走 innerHTML 并追加 label span', () => {
  const created = [];
  globalThis.document = {
    createElement: (tag) => {
      const node = fakeElement(tag);
      created.push(node);
      return node;
    },
  };
  const node = createAgentButton('agent-btn', '新建', { icon: '<svg></svg>' });
  assert.equal(node.innerHTML, '<svg></svg>');
  assert.equal(node.textContent, '');
  assert.equal(node.children.length, 1);
  assert.equal(node.children[0].tagName, 'span');
  assert.equal(node.children[0].className, 'agent-btn-label');
  assert.equal(node.children[0].textContent, '新建');
  assert.equal(created[1].tagName, 'span');
});

test('createAgentButton：icon 存在但无文案时不追加 span', () => {
  globalThis.document = { createElement: fakeElement };
  const node = createAgentButton('agent-btn', '', { icon: '<svg></svg>' });
  assert.deepEqual(node.children, []);
  assert.equal(node.innerHTML, '<svg></svg>');
});

test('createAgentButton：disabled 同时写 aria-disabled', () => {
  globalThis.document = { createElement: fakeElement };
  const on = createAgentButton('agent-btn', '发送', { disabled: true });
  assert.equal(on.disabled, true);
  assert.equal(on.attrs['aria-disabled'], 'true');
  const off = createAgentButton('agent-btn', '发送');
  assert.equal(off.disabled, false);
  assert.equal(off.attrs['aria-disabled'], undefined);
});

test('agentIconSvg：已知图标返回对应 path，未知图标返回空内芯', () => {
  const plus = agentIconSvg('plus');
  assert.ok(plus.startsWith('<svg class="agent-icon" width="18" height="18" viewBox="0 0 24 24"'));
  assert.ok(plus.endsWith('</svg>'));
  assert.ok(plus.includes('aria-hidden="true"'));
  assert.ok(plus.includes('<path d="M12 5v14"></path>'));
  assert.equal(agentIconSvg('nope'), agentIconSvg(undefined));
  assert.ok(agentIconSvg('nope').includes('><'));
});

test('agentIconSvg：stop 图标带旋转容器，skills/folder 等各有内芯', () => {
  assert.ok(agentIconSvg('stop').includes('<g class="v2-task-cancel-spin">'));
  assert.ok(agentIconSvg('skills').includes('A2.5 2.5 0 0 1 6.5 3H12'));
  assert.ok(agentIconSvg('refresh').includes('M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5'));
  assert.notEqual(agentIconSvg('plus'), agentIconSvg('close'));
});
