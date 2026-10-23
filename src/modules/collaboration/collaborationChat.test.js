import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMentionIds } from './collaborationChat.js';

const members = [
  { id: 'u1', name: '小明' },
  { id: 'u2', name: '小红' },
  { id: 'u3', name: '张三' },
];

test('collaborationChat: 手打的 @名字 与点选一样能解析出提及', () => {
  assert.deepEqual(
    resolveMentionIds({ body: '@小明 你看下这个', members, actorId: 'me' }),
    ['u1'],
    '正文里出现的名字要算提及——只靠下拉点选的话，打字直接回车就会丢提醒'
  );
  assert.deepEqual(resolveMentionIds({ body: '@小明 @张三 一起看', members, actorId: 'me' }), [
    'u1',
    'u3',
  ]);
  assert.deepEqual(resolveMentionIds({ body: '没有提到任何人', members, actorId: 'me' }), []);
});

test('collaborationChat: @所有人 命中全部成员，但仍排除自己', () => {
  assert.deepEqual(
    resolveMentionIds({ body: '@所有人 十点开会', members, actorId: 'u2' }),
    ['u1', 'u3'],
    '自己 @ 所有人 不该提醒自己'
  );
});

test('collaborationChat: 名字是前缀时不误伤（@小明 不命中 @小明同学）', () => {
  assert.deepEqual(
    resolveMentionIds({ body: '@小明同学 你好', members, actorId: 'me' }),
    [],
    '长名字是另一个用户，不能把 @小明 也算上'
  );
  assert.deepEqual(
    resolveMentionIds({ body: '@小明，你好', members, actorId: 'me' }),
    ['u1'],
    '紧跟中文标点应当算边界'
  );
});

test('collaborationChat: 名字里的正则元字符按字面匹配', () => {
  const special = [{ id: 's1', name: 'a.b' }];
  assert.deepEqual(resolveMentionIds({ body: '@a.b 你好', members: special, actorId: 'me' }), [
    's1',
  ]);
  assert.deepEqual(
    resolveMentionIds({ body: '@aXb 你好', members: special, actorId: 'me' }),
    [],
    '不转义的话 . 会匹配任意字符，把不相干的人也叫上'
  );
});

test('collaborationChat: 已离开的成员与其名字都不产生提及', () => {
  assert.deepEqual(
    resolveMentionIds({ body: '@已离开的人 你好', members, actorId: 'me' }),
    [],
    '成员列表里没有的人不该被提及'
  );
  assert.deepEqual(resolveMentionIds({ body: '', members, actorId: 'me' }), []);
  assert.deepEqual(resolveMentionIds({}), [], '缺参不能抛');
});
