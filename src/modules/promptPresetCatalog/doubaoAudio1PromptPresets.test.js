import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOUBAO_AUDIO_1_0_PROMPT_PRESET_ITEMS,
  DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS,
} from './doubaoAudio1PromptPresets.js';

const isFrozen = (value) => Object.isFrozen(value);

test('the preset groups expose the four documented sections in order', () => {
  assert.deepEqual(
    DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS.map((group) => ({
      icon: group.icon,
      title: group.title,
      count: group.subItems.length,
    })),
    [
      { icon: '📝', title: '文本生成', count: 8 },
      { icon: '🔊', title: '参考生成', count: 5 },
      { icon: '⏱️', title: '时间控制', count: 4 },
      { icon: '🌐', title: '多语种', count: 4 },
    ],
  );
});

test('the first group re-uses the exported text preset array by identity', () => {
  assert.equal(DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS[0].subItems, DOUBAO_AUDIO_1_0_PROMPT_PRESET_ITEMS);
  assert.equal(DOUBAO_AUDIO_1_0_PROMPT_PRESET_ITEMS.length, 8);
});

test('every preset carries a complete, decoded payload', () => {
  for (const group of DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS) {
    assert.equal(typeof group.icon, 'string');
    assert.equal(typeof group.title, 'string');
    assert.equal(typeof group.desc, 'string');
    assert.ok(group.desc.length > 0);
    for (const item of group.subItems) {
      assert.equal(typeof item.icon, 'string');
      assert.ok(item.icon.length > 0);
      assert.equal(typeof item.title, 'string');
      assert.ok(item.title.trim().length > 0);
      assert.equal(typeof item.desc, 'string');
      assert.ok(item.desc.length > 0);
      assert.equal(typeof item.template, 'string');
      assert.ok(item.template.length > 20);
      assert.equal(item.template.includes('\\x'), false);
    }
  }
});

test('the catalog is fully frozen', () => {
  assert.equal(isFrozen(DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS), true);
  assert.equal(isFrozen(DOUBAO_AUDIO_1_0_PROMPT_PRESET_ITEMS), true);
  for (const group of DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS) {
    assert.equal(isFrozen(group), true);
    assert.equal(isFrozen(group.subItems), true);
    for (const item of group.subItems) {
      assert.equal(isFrozen(item), true);
    }
  }
});

test('preset titles stay unique across the whole catalog', () => {
  const titles = DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS.flatMap((group) =>
    group.subItems.map((item) => item.title),
  );
  assert.equal(new Set(titles).size, titles.length);
});

test('the text presets keep their cast list and spoken lines intact', () => {
  const first = DOUBAO_AUDIO_1_0_PROMPT_PRESET_ITEMS[0];
  assert.equal(first.title, '悬疑刑侦片');
  assert.equal(first.icon, '🎬');
  assert.ok(first.template.startsWith('男子 1 是青年男性，嗓音低沉，有磁性，轻微鼻音，儒雅，沉稳'));
  assert.ok(first.template.includes('\n'));
  assert.ok(first.template.includes('男子 2 是青年男性'));
  assert.ok(first.template.includes('“难道是刚成为朋友，友情还不够？”'));
});

test('the multilingual presets keep their script-specific openers', () => {
  const multilingual = DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS[3].subItems;
  assert.equal(multilingual[0].title, '法语');
  assert.ok(
    multilingual[0].template.startsWith('La femme est une jeune femme adulte, voix plutôt fine mais posée'),
  );
  assert.equal(multilingual[1].title, '日语');
  assert.ok(multilingual[1].template.startsWith('女の子は20代前半の若い女性'));
  assert.equal(multilingual[2].title, '韩语');
  assert.ok(multilingual[2].template.includes('민우는 30대 초반 남성'));
  assert.equal(multilingual[3].title, '英语');
  assert.ok(multilingual[3].template.startsWith('A young man is a low, slightly husky voice'));
});

test('the timing presets embed second-precision cue markers', () => {
  const timing = DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS[2].subItems;
  assert.equal(timing[0].title, '控制音效卡点');
  assert.ok(timing[0].template.includes('[2.7s:5.7s]'));
  assert.ok(timing[1].template.includes('[3.8s:7.1s]'));
  assert.ok(timing[2].template.includes('[0.5s:7.8s]'));
  assert.ok(timing[3].template.includes('[5.7s:7.9s]'));
});

test('the reference presets ask the model to clone a named voice', () => {
  const reference = DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS[1].subItems;
  assert.equal(reference[0].title, '李米的回忆');
  assert.ok(reference[0].template.includes('饰演者为 参考录音1'));
  assert.ok(reference[1].template.includes('参考录音2'));
  assert.equal(reference[4].title, '多角演绎');
  assert.ok(reference[4].template.includes('角色 1 以 参考录音1 的音色为基础'));
});
