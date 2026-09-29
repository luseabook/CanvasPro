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
function getSharedPresetGroup(_0x43bc73) {
  return (
    PROMPT_PRESETS['ai-image']?.['find']((_0x1f9425) => _0x1f9425['title'] === _0x43bc73)?.['subItems'] || []
  );
}
function buildWorkspacePresets(_0x1ab3ab, _0x3213e2) {
  return _0x1ab3ab['map'](({ id: _0x4665a6, title: _0x52559d }) => {
    const _0x46a4e8 = _0x3213e2['find']((_0x5e4388) => _0x5e4388['title'] === _0x52559d);
    return _0x46a4e8
      ? Object['freeze']({
          id: _0x4665a6,
          label: _0x46a4e8['title'],
          description: _0x46a4e8['desc'],
          template: _0x46a4e8['template'],
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
export function getWorkspaceCharacterAssetPromptPreset(_0x5b95a8 = '') {
  return (
    WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS['find'](
      (_0x4e1a2e) => _0x4e1a2e['id'] === String(_0x5b95a8 || '')['trim'](),
    ) || WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS[0x0]
  );
}
export function applyWorkspaceCharacterAssetPromptPreset(_0xb6981b = '', _0x3cfd9c = '', _0x22c97c = {}) {
  const _0x2f23ab = String(_0x3cfd9c || '')['trim'](),
    _0x4a2459 = getWorkspaceCharacterAssetPromptPreset(_0xb6981b);
  if (!_0x4a2459['template']) return _0x2f23ab;
  return resolvePromptPresetTemplate(_0x4a2459['template'], _0x2f23ab, _0x22c97c)['trim']();
}
export function getWorkspaceSceneAssetPromptPreset(_0x24adf2 = '') {
  return (
    WORKSPACE_SCENE_ASSET_PROMPT_PRESETS['find'](
      (_0x5e39c8) => _0x5e39c8['id'] === String(_0x24adf2 || '')['trim'](),
    ) || WORKSPACE_SCENE_ASSET_PROMPT_PRESETS[0x0]
  );
}
export function applyWorkspaceSceneAssetPromptPreset(_0x103562 = '', _0x1304c6 = '') {
  const _0x2c4f16 = String(_0x1304c6 || '')['trim'](),
    _0x56f017 = getWorkspaceSceneAssetPromptPreset(_0x103562);
  if (!_0x56f017['template']) return _0x2c4f16;
  return resolvePromptPresetTemplate(_0x56f017['template'], _0x2c4f16)['trim']();
}
