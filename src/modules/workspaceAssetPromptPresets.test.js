import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESETS,
  applyWorkspaceCharacterAssetPromptPreset,
  applyWorkspaceSceneAssetPromptPreset,
  getWorkspaceCharacterAssetPromptPreset,
  getWorkspaceSceneAssetPromptPreset,
} from './workspaceAssetPromptPresets.js';

test('workspaceAssetPromptPresets: 两张预设表都是冻结的，首项固定是「无」', () => {
  assert.equal(Object.isFrozen(WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS), true);
  assert.equal(Object.isFrozen(WORKSPACE_SCENE_ASSET_PROMPT_PRESETS), true);

  const none = { id: 'none', label: '无', description: '直接使用当前提示词', template: null };
  assert.deepEqual(WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS[0], none);
  assert.deepEqual(WORKSPACE_SCENE_ASSET_PROMPT_PRESETS[0], none);
  assert.equal(WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID, 'none');
  assert.equal(WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID, 'none');
});

test('workspaceAssetPromptPresets: 只有共享预设组里找得到标题的项才会进表，且都带非空模板', () => {
  for (const preset of [...WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS.slice(1), ...WORKSPACE_SCENE_ASSET_PROMPT_PRESETS.slice(1)]) {
    assert.equal(Object.isFrozen(preset), true);
    assert.equal(typeof preset.label, 'string');
    assert.notEqual(preset.template, null, preset.id + ' 进表就必须有模板');
    assert.equal(typeof preset.template.text, 'string');
    assert.notEqual(preset.template.text.trim(), '');
  }
  assert.ok(WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS.length > 1, '人设参考组在本仓至少能解析出 1 项');
  assert.ok(WORKSPACE_SCENE_ASSET_PROMPT_PRESETS.length > 1, '场景参考组在本仓至少能解析出 1 项');
});

test('workspaceAssetPromptPresets: 三视图类预设按定义顺序排列', () => {
  const characterIds = WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS.map((preset) => preset.id);
  assert.equal(characterIds[0], 'none');
  assert.equal(characterIds[1], 'character-three-view');
  const sceneIds = WORKSPACE_SCENE_ASSET_PROMPT_PRESETS.map((preset) => preset.id);
  assert.equal(sceneIds[0], 'none');
  assert.equal(sceneIds[1], 'scene-four-view');
});

test('workspaceAssetPromptPresets: 找不到或传空 id 都回落到「无」', () => {
  assert.equal(getWorkspaceCharacterAssetPromptPreset('zzz').id, 'none');
  assert.equal(getWorkspaceCharacterAssetPromptPreset('').id, 'none');
  assert.equal(getWorkspaceCharacterAssetPromptPreset().id, 'none');
  assert.equal(getWorkspaceCharacterAssetPromptPreset(' character-three-view ').id, 'character-three-view');
  assert.equal(getWorkspaceSceneAssetPromptPreset('zzz').id, 'none');
  assert.equal(getWorkspaceSceneAssetPromptPreset('scene-four-view').id, 'scene-four-view');
});

test('workspaceAssetPromptPresets: 模板为空（含未知 id）时只把提示词去空白', () => {
  assert.equal(applyWorkspaceCharacterAssetPromptPreset('none', '  文本  '), '文本');
  assert.equal(applyWorkspaceCharacterAssetPromptPreset('zzz', '  文本  '), '文本');
  assert.equal(applyWorkspaceSceneAssetPromptPreset('none', '  文本  '), '文本');
  assert.equal(applyWorkspaceSceneAssetPromptPreset('zzz', '  文本  '), '文本');
  assert.equal(applyWorkspaceCharacterAssetPromptPreset(undefined, ''), '');
});

test('workspaceAssetPromptPresets: 有模板时把用户输入套进模板占位符', () => {
  const character = applyWorkspaceCharacterAssetPromptPreset('character-three-view', '主角');
  assert.equal(character.startsWith('生成全身三视图'), true);
  assert.equal(character.endsWith('主角'), true);

  const scene = applyWorkspaceSceneAssetPromptPreset('scene-four-view', '森林');
  assert.equal(scene.startsWith('森林'), true);
  assert.equal(scene.includes('四宫格场景图'), true);
});

test('workspaceAssetPromptPresets: 场景预设的表与角色预设互不干扰', () => {
  const characterIds = new Set(WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS.map((preset) => preset.id));
  for (const preset of WORKSPACE_SCENE_ASSET_PROMPT_PRESETS) {
    if (preset.id === 'none') continue;
    assert.equal(characterIds.has(preset.id), false, preset.id + ' 不该出现在角色预设表里');
  }
  assert.equal(
    WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS.some((preset) => preset.id === 'scene-four-view'),
    false,
  );
});
