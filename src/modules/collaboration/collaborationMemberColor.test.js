import test from 'node:test';
import assert from 'node:assert/strict';
import { collaborationMemberColor } from './collaborationMemberColor.js';

// 独立实现的 32 位 FNV-1a，用来对照成员 id 的取色
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (const ch of text) hash = Math.imul(hash ^ ch.charCodeAt(0), 0x1000193) >>> 0;
  return hash;
}
const COLORS = [
  '--blue',
  '--green',
  '--purple',
  '--cyan',
  '--red',
  '--indigo',
  '--group-pink',
  '--warning-text',
];

test('collaborationMemberColor：colorIndex 0–7 直接用 8 种基础色变量', () => {
  COLORS.forEach((name, index) => {
    assert.equal(collaborationMemberColor({ colorIndex: index }), `var(${name})`);
  });
});

test('collaborationMemberColor：colorIndex 8–15 与正文色 70% 混色，16–23 为 45%', () => {
  assert.equal(
    collaborationMemberColor({ colorIndex: 8 }),
    'color-mix(in srgb, var(--blue) 70%, var(--text-primary))',
  );
  assert.equal(
    collaborationMemberColor({ colorIndex: 15 }),
    'color-mix(in srgb, var(--warning-text) 70%, var(--text-primary))',
  );
  assert.equal(
    collaborationMemberColor({ colorIndex: 16 }),
    'color-mix(in srgb, var(--blue) 45%, var(--text-primary))',
  );
  assert.equal(
    collaborationMemberColor({ colorIndex: 23 }),
    'color-mix(in srgb, var(--warning-text) 45%, var(--text-primary))',
  );
  // 超出 24 后按 %24 决定比例
  assert.equal(
    collaborationMemberColor({ colorIndex: 25 }),
    'color-mix(in srgb, var(--green) 70%, var(--text-primary))',
  );
});

test('collaborationMemberColor：没有整数 colorIndex 时按 id 的 FNV-1a 哈希 %24 取色', () => {
  for (const id of ['alice', 'bob', 'member-42', '协作者']) {
    const expected = collaborationMemberColor({ colorIndex: fnv1a(id) % 24 });
    assert.equal(collaborationMemberColor({ id }), expected, id);
    // 非整数 colorIndex 被忽略
    assert.equal(collaborationMemberColor({ id, colorIndex: 1.5 }), expected, id);
  }
});

test('collaborationMemberColor：缺 id 或传空值时用空串的哈希，结果稳定', () => {
  const empty = collaborationMemberColor({ colorIndex: fnv1a('') % 24 });
  assert.equal(collaborationMemberColor(), empty);
  assert.equal(collaborationMemberColor(null), empty);
  assert.equal(collaborationMemberColor({}), empty);
  // 数字 id 先转字符串
  assert.equal(collaborationMemberColor({ id: 7 }), collaborationMemberColor({ id: '7' }));
});
