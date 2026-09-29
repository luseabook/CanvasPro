import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CHARACTER_ASSET_PROMPT_PRESETS,
  STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  STORY_SCENE_ASSET_PROMPT_PRESETS,
  STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
  applyStoryCharacterAssetPromptPreset,
  applyStorySceneAssetPromptPreset,
  getStoryCharacterAssetPromptPreset,
  getStorySceneAssetPromptPreset,
} from './storyAssetPromptPresets.js';
import {
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESETS,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
  applyWorkspaceCharacterAssetPromptPreset,
  applyWorkspaceSceneAssetPromptPreset,
  getWorkspaceCharacterAssetPromptPreset,
  getWorkspaceSceneAssetPromptPreset,
} from '../workspaceAssetPromptPresets.js';

test('storyAssetPromptPresets: 常量与 workspace 侧是同一引用，属纯别名件', () => {
  assert.equal(STORY_CHARACTER_ASSET_PROMPT_PRESETS, WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS);
  assert.equal(STORY_SCENE_ASSET_PROMPT_PRESETS, WORKSPACE_SCENE_ASSET_PROMPT_PRESETS);
  assert.equal(STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID, WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID);
  assert.equal(STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID, WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID);
  assert.equal(STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID, 'none');
  assert.equal(STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID, 'none');
});

test('storyAssetPromptPresets: get/apply 逐条转发 workspace 实现', () => {
  for (const preset of WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS) {
    assert.equal(getStoryCharacterAssetPromptPreset(preset.id), getWorkspaceCharacterAssetPromptPreset(preset.id));
  }
  assert.equal(
    applyStoryCharacterAssetPromptPreset('character-three-view', '主角'),
    applyWorkspaceCharacterAssetPromptPreset('character-three-view', '主角'),
  );
  assert.equal(
    applyStoryCharacterAssetPromptPreset('character-three-view', '主角', {}),
    applyWorkspaceCharacterAssetPromptPreset('character-three-view', '主角', {}),
  );
  assert.equal(
    getStorySceneAssetPromptPreset('scene-four-view'),
    getWorkspaceSceneAssetPromptPreset('scene-four-view'),
  );
  assert.equal(
    applyStorySceneAssetPromptPreset('scene-four-view', '场景'),
    applyWorkspaceSceneAssetPromptPreset('scene-four-view', '场景'),
  );
});

test('storyAssetPromptPresets: 未知与空 id 统一落到 none 占位', () => {
  const fallback = { id: 'none', label: '无', description: '直接使用当前提示词', template: null };
  assert.deepEqual(getStoryCharacterAssetPromptPreset('zzz'), fallback);
  assert.deepEqual(getStoryCharacterAssetPromptPreset(''), fallback);
  assert.deepEqual(getStoryCharacterAssetPromptPreset(), fallback);
  assert.deepEqual(getStorySceneAssetPromptPreset('zzz'), fallback);
});

test('storyAssetPromptPresets: 模板会把输入拼进占位，none/未知原样返回', () => {
  assert.equal(applyStoryCharacterAssetPromptPreset('none', '  文本  '), '文本');
  assert.equal(applyStoryCharacterAssetPromptPreset('zzz', '  文本  '), '文本');
  assert.equal(applyStorySceneAssetPromptPreset('none', '  场景  '), '场景');
  assert.equal(
    applyStoryCharacterAssetPromptPreset('character-three-view', '主角'),
    '生成全身三视图，右边放正视图，45度的侧视图，后视图，主角',
  );
});
