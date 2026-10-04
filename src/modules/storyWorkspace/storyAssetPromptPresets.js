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
export function getStoryCharacterAssetPromptPreset(value = '') {
  return getWorkspaceCharacterAssetPromptPreset(value);
}
export function applyStoryCharacterAssetPromptPreset(item = '', key = '', index = {}) {
  return applyWorkspaceCharacterAssetPromptPreset(item, key, index);
}
export function getStorySceneAssetPromptPreset(result = '') {
  return getWorkspaceSceneAssetPromptPreset(result);
}
export function applyStorySceneAssetPromptPreset(data = '', options = '') {
  return applyWorkspaceSceneAssetPromptPreset(data, options);
}
