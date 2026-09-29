import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiRouteSelection } from './apiRouteSelection.js';

function makeButton(routeId) {
  const classes = new Set();
  return {
    routeId,
    attrs: {},
    classList: {
      toggle(name, on) {
        if (on) classes.add(name);
        else classes.delete(name);
      },
      has: (name) => classes.has(name),
    },
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    addEventListener(type, handler) {
      this.handler = handler;
      this.listened = type;
    },
  };
}

function makeHarness(over = {}) {
  const routes = over.routes ?? [
    { id: 'official', apiUrl: 'https://api.example.com' },
    { id: 'mirror', apiUrl: 'https://mirror.example.com' },
  ];
  const buttons = over.buttons ?? [makeButton('official'), makeButton('mirror'), makeButton('custom')];
  const urlElement = over.urlElement ?? { textContent: '' };
  const calls = { resolveConfig: 0 };
  const selection = createApiRouteSelection({
    buttons,
    urlElement,
    routes,
    resolveConfig: (config) => {
      calls.resolveConfig += 1;
      return over.resolved ?? { routeId: config.routeId ?? '', apiUrl: config.apiUrl ?? '' };
    },
    getButtonRouteId: (button) => button.routeId,
    formatCustomUrl: (url) => (url ? '自定义：' + url : ''),
  });
  return { selection, buttons, urlElement, routes, calls };
}

test('hydrate 按解析结果高亮按钮并显示地址', () => {
  const { selection, buttons, urlElement, calls } = makeHarness({
    resolved: { routeId: 'mirror', apiUrl: undefined },
  });
  selection.hydrate({ routeId: 'ignored' });
  assert.equal(calls.resolveConfig, 1);
  assert.equal(buttons[0].classList.has('is-active'), false);
  assert.equal(buttons[1].classList.has('is-active'), true);
  assert.equal(buttons[2].classList.has('is-active'), false);
  assert.deepEqual(buttons[1].attrs, { 'aria-pressed': 'true' });
  assert.deepEqual(buttons[0].attrs, { 'aria-pressed': 'false' });
  assert.equal(urlElement.textContent, 'https://mirror.example.com');
});

test('hydrate 解析到未知路由时全部失效并回落到自定义地址', () => {
  const { selection, buttons, urlElement } = makeHarness({
    resolved: { routeId: 'ghost', apiUrl: 'https://custom.example.com' },
  });
  selection.hydrate();
  assert.deepEqual(
    buttons.map((button) => button.classList.has('is-active')),
    [false, false, false],
  );
  assert.equal(urlElement.textContent, '自定义：https://custom.example.com');
});

test('hydrate 无地址时用空串格式化得到空文本', () => {
  const { selection, urlElement } = makeHarness({ resolved: { routeId: '', apiUrl: '' } });
  selection.hydrate();
  assert.equal(urlElement.textContent, '');
});

test('hydrate 缺少 urlElement 时不抛错', () => {
  const { selection } = makeHarness({ urlElement: null });
  assert.equal(selection.hydrate({ routeId: 'official' }), undefined);
});

test('collect 在已选路由时把 routeId 与 apiUrl 写进结果', () => {
  const { selection } = makeHarness({ resolved: { routeId: 'official', apiUrl: '' } });
  selection.hydrate();
  assert.deepEqual(selection.collect({ name: 'x' }), {
    name: 'x',
    routeId: 'official',
    apiUrl: 'https://api.example.com',
  });
});

test('collect 未选到路由时保留自定义地址并删掉 routeId', () => {
  const { selection } = makeHarness();
  selection.hydrate({ routeId: '', apiUrl: '' });
  assert.deepEqual(selection.collect({ routeId: 'stale', apiUrl: 'https://me.example.com' }), {
    apiUrl: 'https://me.example.com',
  });
});

test('collect 未选到路由且无地址时原样返回副本', () => {
  const { selection } = makeHarness();
  const base = { keep: 1 };
  const result = selection.collect(base);
  assert.deepEqual(result, { keep: 1 });
  assert.notEqual(result, base);
});

test('bind 点击按钮切换选中并显示该路由地址后回调一次', () => {
  const { selection, buttons, urlElement } = makeHarness();
  const changes = [];
  selection.bind(() => changes.push(urlElement.textContent));
  assert.equal(buttons[0].listened, 'click');
  buttons[1].handler();
  assert.equal(buttons[1].classList.has('is-active'), true);
  assert.equal(buttons[0].classList.has('is-active'), false);
  assert.equal(urlElement.textContent, 'https://mirror.example.com');
  assert.deepEqual(changes, ['https://mirror.example.com']);
});

test('bind 点击自定义按钮时显示空地址并清空选择', () => {
  const { selection, buttons, urlElement } = makeHarness();
  selection.bind(() => {});
  buttons[2].handler();
  assert.equal(urlElement.textContent, '');
  assert.deepEqual(selection.collect({}), {});
});
