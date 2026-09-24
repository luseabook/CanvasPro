import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeReplicationScenePropUsages,
  defineReplicationPromptMaterials,
} from './storyReplicationDefinitions.js';

test('scene and prop usages are inferred from unique names in the shot text', () => {
  const assets = [
    {
      id: 's1',
      planningRef: 'scene-1',
      kind: 'scene',
      name: '老街茶馆',
      appearances: [{ id: 'ap1', planningRef: 'look-1' }],
    },
    { id: 'p1', ref: 'prop-ref', kind: 'prop', name: '长剑', appearances: [{ id: 'pa' }] },
    { id: 'p2', kind: 'prop', name: '短剑', appearances: [{ id: 'pb' }] },
    {
      id: 'p3',
      kind: 'prop',
      name: '铜镜',
      replicationSource: { name: '镜子' },
      appearances: [{ id: 'pc' }],
    },
    { id: 'p4', kind: 'prop', name: '灯笼', appearances: [{ id: 'l1' }, { id: 'l2' }] },
    { id: 'c1', kind: 'character', name: '李四', appearances: [{ id: 'c' }] },
  ];
  const clips = [
    {
      visual: '李四走进茶馆，拿起长剑和剑',
      camera: '镜子反光，灯笼摇晃',
      assetUsages: [{ assetRef: 'prop-ref', appearanceRef: 'old' }],
    },
    { visual: '空镜' },
  ];
  const result = completeReplicationScenePropUsages(clips, assets);
  assert.deepEqual(result[0].assetUsages, [
    { assetRef: 'prop-ref', appearanceRef: 'old' },
    { assetRef: 'scene-1', appearanceRef: 'look-1' },
    { assetRef: 'p3', appearanceRef: 'pc' },
  ]);
  assert.deepEqual(result[1], { visual: '空镜', assetUsages: [] });
  assert.notEqual(result[0], clips[0]);
  assert.equal(clips[0].assetUsages.length, 1);
});

test('shared name endings are not used as shorthand', () => {
  const assets = [
    { id: 'a', kind: 'scene', name: '东城茶馆', appearances: [{ id: 'x' }] },
    { id: 'b', kind: 'scene', name: '西城茶馆', appearances: [{ id: 'y' }] },
  ];
  assert.deepEqual(completeReplicationScenePropUsages([{ visual: '回到茶馆' }], assets)[0].assetUsages, []);
  assert.deepEqual(completeReplicationScenePropUsages([{ visual: '回到城茶馆' }], assets)[0].assetUsages, []);
});

test('prompt materials define used references and replace mentions outside quotes', () => {
  const assets = [
    {
      id: 'c1',
      kind: 'character',
      name: '李四',
      appearances: [
        { id: 'a1', name: '常服' },
        { id: 'a2', name: '夜行衣' },
      ],
    },
    {
      id: 'sc',
      kind: 'scene',
      name: '茶馆',
      description: '旧木桌',
      appearances: [{ id: 's1', name: '白天', description: '热闹。。' }],
    },
    {
      id: 'pr',
      kind: 'prop',
      name: '灯笼',
      appearances: [
        { id: 'l1', name: '亮' },
        { id: 'l2', name: '灭' },
      ],
    },
  ];
  const clips = [
    { assetUsages: [{ assetRef: 'c1', appearanceRef: 'a2' }] },
    {
      assetUsages: [
        { assetRef: 'c1', appearanceRef: 'a2' },
        { assetRef: 'sc', appearanceRef: 's1' },
      ],
    },
  ];
  const prompt = [
    '@李四 · 夜行衣 提着 @灯笼 · 灭 走进 @茶馆 · 白天',
    '他说“@李四 · 夜行衣 来了”',
    '画面文字：@茶馆 · 白天',
  ].join('\n');
  const output = defineReplicationPromptMaterials(prompt, clips, assets, ' 写实 ');
  assert.deepEqual(output.split('\n'), [
    '【统一风格与约束】',
    '写实',
    '按下方分镜描述呈现画面、镜头和声音；人物参考图确定外观，人物位置与持物按具体站位和动作呈现。片段结束站位是已有动作的结果，不额外定格或延长时间；不添加未描述的画面文字或背景音乐。',
    '',
    '【参考素材】',
    '将 @李四 · 夜行衣 中的角色定义为李四。用于第1、2个镜头。',
    '将 @茶馆 · 白天 定义为茶馆的参考场景。外观与状态：热闹。',
    '将 @灯笼 · 灭 定义为灯笼（灭）的参考道具。',
    '',
    '【分镜与声音】',
    '李四 提着 灯笼（灭） 走进 茶馆',
    '他说“@李四 · 夜行衣 来了”',
    '画面文字：@茶馆 · 白天',
  ]);
});

test('single-appearance characters get no shot list and empty style is omitted', () => {
  const assets = [{ id: 'c1', kind: 'character', name: '张三', appearances: [{ id: 'a1', name: '常服' }] }];
  const output = defineReplicationPromptMaterials(
    '张三出场',
    [{ assetUsages: [{ assetRef: 'c1', appearanceRef: 'a1' }] }],
    assets,
  );
  const lines = output.split('\n');
  assert.equal(lines[1].startsWith('按下方分镜描述'), true);
  assert.equal(lines[4], '将 @张三 · 常服 中的角色定义为张三。');
  assert.equal(lines.at(-1), '张三出场');
  const none = defineReplicationPromptMaterials('空', [], assets, '');
  assert.deepEqual(none.split('\n').slice(3, 6), ['【参考素材】', '', '【分镜与声音】']);
});
