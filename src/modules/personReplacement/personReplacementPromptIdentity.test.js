import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPersonReplacementPersonLabel,
  resolvePersonReplacementPromptLabel,
  assignPersonReplacementPromptIndexes,
} from './personReplacementPromptIdentity.js';

test('promptIdentity: 人物标号按 A..Z、AA.. 进制展开（负数与非法输入归零）', () => {
  assert.equal(formatPersonReplacementPersonLabel(0), '人物A');
  assert.equal(formatPersonReplacementPersonLabel(1), '人物B');
  assert.equal(formatPersonReplacementPersonLabel(25), '人物Z');
  assert.equal(formatPersonReplacementPersonLabel(26), '人物AA');
  assert.equal(formatPersonReplacementPersonLabel(27), '人物AB');
  assert.equal(formatPersonReplacementPersonLabel(51), '人物AZ');
  assert.equal(formatPersonReplacementPersonLabel(52), '人物BA');
  assert.equal(formatPersonReplacementPersonLabel(-5), '人物A');
  assert.equal(formatPersonReplacementPersonLabel('abc'), '人物A');
  assert.equal(formatPersonReplacementPersonLabel(1.9), '人物B');
  assert.equal(formatPersonReplacementPersonLabel(), '人物A');
});

test('promptIdentity: resolve 优先解析 label 文本，失败回退 promptMarkerIndex', () => {
  assert.equal(resolvePersonReplacementPromptLabel({ label: '人物A' }), '人物A');
  assert.equal(resolvePersonReplacementPromptLabel({ label: '人物B' }), '人物B');
  assert.equal(resolvePersonReplacementPromptLabel({ label: '人物AA' }), '人物AA');
  assert.equal(resolvePersonReplacementPromptLabel({ label: '人物Z' }), '人物Z');
  assert.equal(resolvePersonReplacementPromptLabel({ promptMarkerIndex: 2 }), '人物C');
  assert.equal(resolvePersonReplacementPromptLabel({ label: '无名', promptMarkerIndex: 1 }), '人物B');
  assert.equal(resolvePersonReplacementPromptLabel({ label: '人物a' }), '人物A');
  assert.equal(resolvePersonReplacementPromptLabel({}), '人物A');
});

test('promptIdentity: assign 先认显式/合法标号，再按 label 文本，最后按初始位置补号', () => {
  const items = [{ id: 'a', label: '人物B' }, { id: 'b', promptMarkerIndex: 5 }, { id: 'c' }];
  const out = assignPersonReplacementPromptIndexes(items);
  assert.deepEqual(
    out.map((x) => [x.id, x.promptMarkerIndex]),
    [
      ['a', 1],
      ['b', 5],
      ['c', 6],
    ],
  );
  assert.notEqual(out[0], items[0]);
  assert.equal(items[0].promptMarkerIndex, undefined);
});

test('promptIdentity: 重复/非法标号被丢弃，补号从现有最大号 +1 起，按 bbox 中心 x 排序', () => {
  const out = assignPersonReplacementPromptIndexes([
    { id: 'x', promptMarkerIndex: 3 },
    { id: 'y', promptMarkerIndex: 3 },
    { id: 'z', promptMarkerIndex: -1 },
    { id: 'near', bbox: { x: 100, width: 10 } },
    { id: 'far', bbox: { x: 900, width: 10 } },
    { id: 'noBox' },
  ]);
  const byId = Object.fromEntries(out.map((x) => [x.id, x.promptMarkerIndex]));
  assert.equal(byId.x, 3);
  assert.equal(byId.near, 4);
  assert.equal(byId.far, 5);
  assert.equal(byId.y, 6);
  assert.equal(byId.z, 7);
  assert.equal(byId.noBox, 8);
});

test('promptIdentity: label 已用过的位置号不会被再次占用', () => {
  const out = assignPersonReplacementPromptIndexes([
    { id: 'a', label: '人物A' },
    { id: 'b', promptMarkerIndex: 1 },
    { id: 'c' },
  ]);
  const byId = Object.fromEntries(out.map((x) => [x.id, x.promptMarkerIndex]));
  assert.equal(byId.a, 0);
  assert.equal(byId.b, 1);
  assert.equal(byId.c, 2);
});
