import {
  applyWorkspaceCharacterAssetPromptPreset,
  applyWorkspaceSceneAssetPromptPreset,
  getWorkspaceCharacterAssetPromptPreset,
  getWorkspaceSceneAssetPromptPreset,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_SCENE_ASSET_PROMPT_PRESETS,
} from '../workspaceAssetPromptPresets.js';
export const STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID = WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID;
export const STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID = WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID;
export const STORY_CHARACTER_ASSET_PROMPT_PRESETS = WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS;
export const STORY_SCENE_ASSET_PROMPT_PRESETS = WORKSPACE_SCENE_ASSET_PROMPT_PRESETS;
export function getStoryCharacterAssetPromptPreset(_0x2a1775 = '') {
  return getWorkspaceCharacterAssetPromptPreset(_0x2a1775);
}
export function applyStoryCharacterAssetPromptPreset(_0x303bb8 = '', _0xa8c5c = '', _0x3831eb = {}) {
  return applyWorkspaceCharacterAssetPromptPreset(_0x303bb8, _0xa8c5c, _0x3831eb);
}
export function getStorySceneAssetPromptPreset(_0x4a8777 = '') {
  return getWorkspaceSceneAssetPromptPreset(_0x4a8777);
}
export function applyStorySceneAssetPromptPreset(_0x414bf7 = '', _0x4501a0 = '') {
  return applyWorkspaceSceneAssetPromptPreset(_0x414bf7, _0x4501a0);
}
