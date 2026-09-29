import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoryMinimaxH3Prompt } from './storyMinimaxH3Prompt.js';

test('storyMinimaxH3Prompt: builds the reference structure for subjects and sound channels', () => {
  const prompt = buildStoryMinimaxH3Prompt({
    clip: { ref: 'clip-1', transition: '淡入' },
    shots: [
      {
        durationSec: 1.5,
        camera: '固定镜头',
        visual: '林站在窗前',
        dialogue: '林：你好。',
        voiceover: '旁白：她回头。',
        audio: '雨声',
        assetUsages: [
          { assetRef: 'asset-hero', appearanceRef: 'appearance-hero' },
          { assetRef: 'scene-room' },
        ],
      },
      {
        durationSec: 2,
        camera: '推近',
        visual: '她挥手',
        dialogue: '',
        voiceover: '',
        audio: '背景音乐响起',
        assetUsages: [{ assetRef: 'asset-hero' }],
      },
    ],
    assets: [
      {
        id: 'asset-hero',
        planningRef: 'asset-hero',
        name: '林',
        kind: 'character',
        baseAppearanceId: 'appearance-hero',
        appearances: [{ id: 'appearance-hero', name: '红色长裙' }],
      },
      {
        planningRef: 'scene-room',
        name: '客厅',
        kind: 'scene',
        appearances: [{ id: 'scene-base', name: '基础形象' }],
      },
    ],
  });

  assert.match(prompt, /^subject_definitions:\n<Subject 1> 是角色 林/u);
  assert.match(prompt, /<Subject 2> 是场景 客厅/u);
  assert.match(prompt, /summary:\n\[reference generation\] 目标为一个 3\.5 秒、2 镜头的叙事视频/u);
  assert.match(prompt, /retention_analysis:\n<Subject 1> （出现在 \[Shot 1\], \[Shot 2\]）：fully_preserved/u);
  assert.match(prompt, /detailed_description:\n\[Shot 1\]/u);
  assert.match(prompt, /\[Shot 2\] At 00:01\.500，镜头切换为新镜头。/u);
  assert.match(prompt, /转场遵循以下连续性要求：淡入\./u);
  assert.match(prompt, /<Subject 1> \(S1\) 说：<d>\[Chinese\] 你好。<\/d>/u);
  assert.match(prompt, /角色旁白 \(S2\) 以画外音说：<d>\[Chinese\] 她回头。<\/d>/u);
  assert.match(prompt, /画面内音效：雨声\./u);
  assert.match(prompt, /non_diegetic_music:\n背景音乐响起\./u);
  assert.doesNotMatch(prompt, /\[Shot 2\][\s\S]*画面内音效：背景音乐/u);
});

test('storyMinimaxH3Prompt: no-subject prompts use the integrated T2VA shape', () => {
  const prompt = buildStoryMinimaxH3Prompt({
    clip: {},
    shots: [
      {
        durationSec: 2,
        camera: '固定镜头',
        visual: '空镜',
        dialogue: '',
        voiceover: '',
        audio: '风声',
        assetUsages: [],
      },
    ],
    assets: [],
  });

  assert.match(prompt, /^integrated_multimodal_description:\n\[Shot 1\]/u);
  assert.match(prompt, /画面内音效：风声\./u);
  assert.match(prompt, /overall_soundscape: 风声\./u);
  assert.match(prompt, /non_diegetic_music: 无/u);
  assert.doesNotMatch(prompt, /subject_definitions:/u);
});

