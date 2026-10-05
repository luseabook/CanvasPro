import test from 'node:test';
import assert from 'node:assert/strict';
import { updateAgentMessageTime, createAgentMessageTime } from './agentMessageTime.js';

function makeElement() {
  return {
    attrs: {},
    textContent: '',
    title: '',
    className: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
}

function withDocument(stub, run) {
  const had = 'document' in globalThis;
  const prev = globalThis.document;
  globalThis.document = stub;
  try {
    return run();
  } finally {
    if (had) globalThis.document = prev;
    else delete globalThis.document;
  }
}

test('消息时间：合法时间戳写入 datetime / 文本 / title 并返回 true', () => {
  const el = makeElement();
  const ts = 1_767_225_600_000;
  const d = new Date(ts);
  assert.equal(updateAgentMessageTime(el, ts), true);
  assert.equal(el.attrs.datetime, d.toISOString());
  assert.equal(el.textContent, d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'));
  assert.equal(el.title, d.toLocaleString());
});

test('消息时间：小时不补零、分钟补两位', () => {
  for (const ts of [0, 60_000, 3_600_000]) {
    const el = makeElement();
    const d = new Date(Date.UTC(2026, 0, 1) + ts);
    const ok = updateAgentMessageTime(el, Date.UTC(2026, 0, 1) + ts);
    assert.equal(ok, true, String(ts));
    assert.match(el.textContent, /^\d{1,2}:\d{2}$/);
    assert.equal(el.textContent.split(':')[1], String(d.getMinutes()).padStart(2, '0'));
  }
});

test('消息时间：数值判定走 Number()，故数字字符串同样被接受', () => {
  const el = makeElement();
  const ts = 1_767_225_600_000;
  assert.equal(updateAgentMessageTime(el, String(ts)), true);
  assert.equal(el.attrs.datetime, new Date(ts).toISOString());
});

test('消息时间：0 / 负数 / NaN / 非数字串一律判否且不写任何属性', () => {
  for (const bad of [0, -1, NaN, 'abc', '', null, undefined, [], {}]) {
    const el = makeElement();
    assert.equal(updateAgentMessageTime(el, bad), false, JSON.stringify(bad));
    assert.deepEqual(el.attrs, {});
    assert.equal(el.textContent, '');
    assert.equal(el.title, '');
  }
});

test('消息时间：超出 Date 可行域的大数值在第二道校验被拒（端口现状）', () => {
  const el = makeElement();
  assert.equal(updateAgentMessageTime(el, 1e16), false);
  assert.deepEqual(el.attrs, {});
});

test('消息时间：元素缺失时判否，不抛异常', () => {
  assert.equal(updateAgentMessageTime(null, 1_767_225_600_000), false);
  assert.equal(updateAgentMessageTime(undefined, 1_767_225_600_000), false);
});

test('消息时间：创建路径产出 <time class="agent-message-time">', () => {
  withDocument(
    {
      createElement(tag) {
        const el = makeElement();
        el.tagName = tag;
        return el;
      },
    },
    () => {
      const el = createAgentMessageTime(1_767_225_600_000);
      assert.ok(el);
      assert.equal(el.tagName, 'time');
      assert.equal(el.className, 'agent-message-time');
      assert.equal(el.attrs.datetime, new Date(1_767_225_600_000).toISOString());
    },
  );
});

test('消息时间：时间戳非法时创建路径返回 null，但元素已被创建（端口现状）', () => {
  const created = [];
  withDocument(
    {
      createElement(tag) {
        created.push(tag);
        return makeElement();
      },
    },
    () => {
      assert.equal(createAgentMessageTime(0), null);
      assert.deepEqual(created, ['time']);
    },
  );
});
