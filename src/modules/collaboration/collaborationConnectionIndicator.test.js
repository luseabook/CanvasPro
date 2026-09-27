import test from 'node:test';
import assert from 'node:assert/strict';
import {
  connectionQuality,
  createCollaborationConnectionIndicator,
} from './collaborationConnectionIndicator.js';

// 最小假 DOM：只实现本模块用到的 createElement、append、setAttribute、dataset、hidden、title、textContent
function createFakeDocument() {
  const created = [];
  const doc = {
    createElement(tag) {
      const attrs = new Map();
      let text = '';
      let textWrites = 0;
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        children: [],
        dataset: {},
        hidden: false,
        title: '',
        append(...nodes) {
          el.children.push(...nodes);
        },
        setAttribute(name, value) {
          attrs.set(name, String(value));
        },
        getAttribute(name) {
          return attrs.has(name) ? attrs.get(name) : null;
        },
        get textContent() {
          return text;
        },
        set textContent(value) {
          textWrites++;
          text = String(value);
        },
        get textWrites() {
          return textWrites;
        },
      };
      created.push(el);
      return el;
    },
  };
  return { doc, created };
}

test('connectionQuality：未传状态时为未协作', () => {
  assert.deepEqual(connectionQuality(), { level: 'inactive', label: '未协作', value: '' });
  assert.deepEqual(connectionQuality(null), { level: 'inactive', label: '未协作', value: '' });
});

test('connectionQuality：status 或 presenceStatus 为 offline 时为断线，blocked 为暂停', () => {
  const offline = { level: 'offline', label: '协作连接中断', value: '断线' };
  assert.deepEqual(connectionQuality({ status: 'offline', latencyMs: 10 }), offline);
  assert.deepEqual(
    connectionQuality({ status: 'online', presenceStatus: 'offline', latencyMs: 10 }),
    offline,
  );
  assert.deepEqual(connectionQuality({ status: 'blocked', latencyMs: 10 }), {
    level: 'offline',
    label: '协作已暂停',
    value: '暂停',
  });
});

test('connectionQuality：延迟不是有限数时为连接中', () => {
  const connecting = { level: 'connecting', label: '协作连接中，正在测量延迟', value: '…' };
  assert.deepEqual(connectionQuality({ status: 'online' }), connecting);
  assert.deepEqual(connectionQuality({ latencyMs: Infinity }), connecting);
  assert.deepEqual(connectionQuality({ latencyMs: '20' }), connecting);
});

test('connectionQuality：延迟四舍五入并按 <100 良好、<250 一般、其余较高分级', () => {
  assert.deepEqual(connectionQuality({ latencyMs: 99.4 }), {
    level: 'good',
    label: '协作中，延迟 99 ms，良好',
    value: '99 ms',
  });
  assert.equal(connectionQuality({ latencyMs: 99.5 }).level, 'fair');
  assert.deepEqual(connectionQuality({ latencyMs: 249 }), {
    level: 'fair',
    label: '协作中，延迟 249 ms，一般',
    value: '249 ms',
  });
  assert.deepEqual(connectionQuality({ latencyMs: 250 }), {
    level: 'poor',
    label: '协作中，延迟 250 ms，较高',
    value: '250 ms',
  });
  // 负数夹到 0
  assert.equal(connectionQuality({ latencyMs: -30 }).value, '0 ms');
});

test('createCollaborationConnectionIndicator：结构为信号三格加延迟文字', () => {
  const { doc } = createFakeDocument();
  const { element } = createCollaborationConnectionIndicator(doc);
  assert.equal(element.className, 'collaboration-connection');
  assert.equal(element.getAttribute('role'), 'img');
  const [signal, latency] = element.children;
  assert.equal(signal.className, 'collaboration-signal');
  assert.equal(signal.getAttribute('aria-hidden'), 'true');
  assert.equal(signal.children.length, 3);
  assert.ok(signal.children.every((bar) => bar.tagName === 'I'));
  assert.equal(latency.className, 'collaboration-latency');
});

test('createCollaborationConnectionIndicator：update 同步 hidden、质量、aria-label、title 和延迟文字', () => {
  const { doc } = createFakeDocument();
  const indicator = createCollaborationConnectionIndicator(doc);
  const latency = indicator.element.children[1];
  indicator.update({ latencyMs: 42 });
  assert.equal(indicator.element.hidden, false);
  assert.equal(indicator.element.dataset.quality, 'good');
  assert.equal(indicator.element.getAttribute('aria-label'), '协作中，延迟 42 ms，良好');
  assert.equal(indicator.element.title, '协作中，延迟 42 ms，良好');
  assert.equal(latency.textContent, '42 ms');

  indicator.update(null);
  assert.equal(indicator.element.hidden, true);
  assert.equal(indicator.element.dataset.quality, 'inactive');
  assert.equal(latency.textContent, '');
});

test('createCollaborationConnectionIndicator：延迟文字不变时不重复写 textContent', () => {
  const { doc } = createFakeDocument();
  const indicator = createCollaborationConnectionIndicator(doc);
  const latency = indicator.element.children[1];
  indicator.update({ latencyMs: 120 });
  indicator.update({ latencyMs: 120.2 });
  assert.equal(latency.textWrites, 1);
  indicator.update({ latencyMs: 121 });
  assert.equal(latency.textWrites, 2);
});
