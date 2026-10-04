import { PROMPT_PRESETS } from './promptPresets.js';
import { resolvePromptPresetTemplate } from './promptPresetTemplate.js';
export const WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID = 'none';
export const WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID = 'none';
const CHARACTER_PRESET_DEFINITIONS = Object['freeze']([
    Object['freeze']({ id: 'character-three-view', title: '人物三视图' }),
    Object['freeze']({ id: 'character-three-view-face', title: '人物三视图+脸部' }),
    Object['freeze']({ id: 'character-front-back-view-face', title: '前后视图+脸部' }),
    Object['freeze']({ id: 'character-analysis', title: '人设解析图' }),
  ]),
  SCENE_PRESET_DEFINITIONS = Object['freeze']([
    Object['freeze']({ id: 'scene-four-view', title: '场景四视图' }),
    Object['freeze']({ id: 'scene-nine-view', title: '场景九视图' }),
  ]);
function getSharedPresetGroup(value) {
  return PROMPT_PRESETS['ai-image']?.['find']((item) => item['title'] === value)?.['subItems'] || [];
}
function buildWorkspacePresets(list, list2) {
  return list['map'](({ id: id, title: title }) => {
    const label = list2['find']((key) => key['title'] === title);
    return label
      ? Object['freeze']({
          id: id,
          label: label['title'],
          description: label['desc'],
          template: label['template'],
        })
      : null;
  })['filter'](Boolean);
}
export const WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS = Object['freeze']([
  Object['freeze']({
    id: WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
    label: '无',
    description: '直接使用当前提示词',
    template: null,
  }),
  ...buildWorkspacePresets(CHARACTER_PRESET_DEFINITIONS, getSharedPresetGroup('人设参考')),
]);
export const WORKSPACE_SCENE_ASSET_PROMPT_PRESETS = Object['freeze']([
  Object['freeze']({
    id: WORKSPACE_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
    label: '无',
    description: '直接使用当前提示词',
    template: null,
  }),
  ...buildWorkspacePresets(SCENE_PRESET_DEFINITIONS, getSharedPresetGroup('场景参考')),
]);
export function getWorkspaceCharacterAssetPromptPreset(index = '') {
  return (
    WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS['find'](
      (result) => result['id'] === String(index || '')['trim'](),
    ) || WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS[0x0]
  );
}
export function applyWorkspaceCharacterAssetPromptPreset(data = '', options = '', target = {}) {
  const source = String(options || '')['trim'](),
    workspaceCharacterAssetPromptPreset = getWorkspaceCharacterAssetPromptPreset(data);
  if (!workspaceCharacterAssetPromptPreset['template']) return source;
  return resolvePromptPresetTemplate(workspaceCharacterAssetPromptPreset['template'], source, target)[
    'trim'
  ]();
}
export function getWorkspaceSceneAssetPromptPreset(next = '') {
  return (
    WORKSPACE_SCENE_ASSET_PROMPT_PRESETS['find'](
      (current) => current['id'] === String(next || '')['trim'](),
    ) || WORKSPACE_SCENE_ASSET_PROMPT_PRESETS[0x0]
  );
}
export function applyWorkspaceSceneAssetPromptPreset(entry = '', record = '') {
  const payload = String(record || '')['trim'](),
    workspaceSceneAssetPromptPreset = getWorkspaceSceneAssetPromptPreset(entry);
  if (!workspaceSceneAssetPromptPreset['template']) return payload;
  return resolvePromptPresetTemplate(workspaceSceneAssetPromptPreset['template'], payload)['trim']();
}
