import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { renderWorkspaceAudioAssetDetail } from '../workspaceAudioAssetDetail.js';
import { renderAIGenImageModelSelectorMarkup } from '../../components/aigenImage/modelSelector.js';
import { renderAudioPlaybackSurface } from '../../components/audio-node/audioPlaybackSurface.js';
import {
  getWorkspaceAssetAppearanceStats,
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import {
  renderWorkspaceAssetCard,
  renderWorkspaceAssetLoadingOverlay,
  renderWorkspaceCardDeleteControl,
  renderWorkspaceCardImageActions,
  renderWorkspacePreviewArrow,
} from '../workspaceAssetPresentation.js';
import { renderWorkspaceActionIcon } from '../workspaceActionIcons.js';
import { renderWorkspaceImageDownloadButton } from '../workspaceImageDownload.js';
import { PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS } from './personReplacementImageGeneration.js';
import { PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID } from './personReplacementProject.js';
import {
  getPersonReplacementAudioSavedName,
  getPersonReplacementLibraryAudioRef,
} from './personReplacementVoiceLibrary.js';
function normalizeText(_0x28f21c) {
  return String(_0x28f21c ?? '')['trim']();
}
function escapeHtml(_0x1ef87d) {
  return String(_0x1ef87d ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
export function buildPersonReplacementAssetViewState(_0xadd068) {
  const _0x2f45a2 = ['character', 'scene', 'audio', 'library']['includes'](
      _0xadd068['workspace']['characterAssetTab'],
    )
      ? _0xadd068['workspace']['characterAssetTab']
      : 'character',
    _0x1f6e75 = _0x2f45a2 === 'library',
    _0x500cd0 = _0x2f45a2 === 'scene',
    _0xfd44a = _0x2f45a2 === 'audio',
    _0x4016d6 = _0x1f6e75
      ? _0xadd068['libraryAssets']
      : _0xfd44a
        ? _0xadd068['audioAssets']
        : _0x500cd0
          ? _0xadd068['scenes']
          : _0xadd068['characters'],
    _0x487f85 = _0x1f6e75
      ? _0xadd068['workspace']['selectedLibraryAssetId']
      : _0xfd44a
        ? _0xadd068['workspace']['selectedAudioAssetId']
        : _0x500cd0
          ? _0xadd068['workspace']['selectedSceneId']
          : _0xadd068['workspace']['selectedCharacterId'],
    _0x8ee703 = _0x4016d6['find']((_0x3c6377) => _0x3c6377['id'] === _0x487f85) || _0x4016d6[0x0] || null;
  return {
    data: { assets: _0x4016d6, project: {} },
    assetFilter: _0x2f45a2,
    assetSelectionStyle: 'border',
    selectedAssetId: _0x8ee703?.['id'] || '',
    selectedAssetIds: _0xadd068['workspace']['selectedAssetIds'],
    assetSelectionMode: _0xadd068['workspace']['assetSelectionMode'],
    assetAppearanceIndexes: _0xadd068['workspace']['assetAppearanceIndexes'],
    assetAppearanceMotion: '',
    assetSplitRatio: _0xadd068['workspace']['assetSplitRatio'],
    assetDetailSplitRatio: _0xadd068['workspace']['assetDetailSplitRatio'],
    generatingAppearanceKeys: _0xadd068['workspace']['generatingAppearanceKeys'],
    isBatchGenerating: ![],
    batchGeneratingAssetIds: [],
    batchGeneratingAppearanceKeys: [],
    characterVoiceEditor: null,
    characterVoicePanelMotion: '',
    models: {
      image: _0xadd068['settings']['characterImageModelId'] || PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    },
    imageProvider: _0xadd068['settings']['characterImageProvider'] || 'apimart',
    imageGenerationParams: _0xadd068['settings']['characterImageGenerationParams'] || {},
    imageGenerationParamsByModel: _0xadd068['settings']['characterImageGenerationParamsByModel'] || {},
    imageProviderProfileId: _0xadd068['settings']['characterImageProviderProfileId'] || '',
    imageProviderProfileIdByModel: _0xadd068['settings']['characterImageProviderProfileIdByModel'] || {},
    assetVoiceUploadLabel: '添加声音',
    allowDeleteAssetAppearance: !_0x500cd0 && !_0xfd44a,
    allowDeleteAssetCard: !_0x1f6e75,
    allowAssetRename: !_0x1f6e75 && !_0x500cd0 && !_0xfd44a,
    allowAssetStyleReference: ![],
    hideAssetRoleTag: !![],
    hideAssetNameTooltip: !![],
    assetGenerateLabel: '生成素材图',
    assetPromptPresetId: _0xadd068['workspace']['assetPromptPresetId'],
    assetPromptPresets: PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS,
    assetPromptPresetLabel: '图1 人设参考',
  };
}
function renderPromptText(_0x33ecaf) {
  return escapeHtml(_0x33ecaf)['replace'](/\r\n?|\n/g, '<br>');
}
export function readPersonReplacementAssetPromptText(_0x3e07b8 = null) {
  if (!_0x3e07b8) return '';
  const _0x7e646a = [],
    _0x21e6e1 = (_0x23dad3) => {
      if (_0x23dad3) _0x7e646a['push'](String(_0x23dad3));
    },
    _0x5f2208 = (_0x67b5a9, { root: root = ![] } = {}) => {
      const _0x536b23 = Number(_0x67b5a9?.['nodeType']);
      if (_0x536b23 === 0x3) {
        _0x21e6e1(_0x67b5a9['textContent'] || '');
        return;
      }
      if (_0x536b23 !== 0x1 && !root) return;
      const _0x45c6ea = String(_0x67b5a9?.['tagName'] || '')['toUpperCase']();
      if (_0x45c6ea === 'BR') {
        _0x21e6e1('\x0a');
        return;
      }
      const _0x509fd2 = !root && ['DIV', 'P']['includes'](_0x45c6ea);
      if (_0x509fd2 && _0x7e646a['length'] && !_0x7e646a['at'](-0x1)['endsWith']('\x0a')) _0x21e6e1('\x0a');
      Array['from'](_0x67b5a9?.['childNodes'] || [])['forEach']((_0x1ee8d6) => _0x5f2208(_0x1ee8d6));
      if (_0x509fd2 && _0x7e646a['length'] && !_0x7e646a['at'](-0x1)['endsWith']('\x0a')) _0x21e6e1('\x0a');
    };
  return (
    _0x5f2208(_0x3e07b8, { root: !![] }),
    _0x7e646a['join']('')
      ['replace'](/\u00a0/g, '\x20')
      ['replace'](/\n{3,}/g, '\x0a\x0a')
      ['replace'](/\n$/g, '')
  );
}
function getSelectedAppearanceIndex(_0x2307c7 = {}, _0x260c1e = {}) {
  const _0x5686e7 = getWorkspaceAssetAppearances(_0x260c1e);
  if (!_0x5686e7['length']) return 0x0;
  const _0x30208a = Math['trunc'](Number(_0x2307c7?.['assetAppearanceIndexes']?.[_0x260c1e['id']]) || 0x0);
  return Math['max'](0x0, Math['min'](_0x5686e7['length'] - 0x1, _0x30208a));
}
function getSelectedAppearance(_0x5b65f9 = {}, _0x3c6a93 = {}) {
  const _0x343efb = getWorkspaceAssetAppearances(_0x3c6a93);
  return (
    _0x343efb[getSelectedAppearanceIndex(_0x5b65f9, _0x3c6a93)] ||
    getWorkspaceAssetBaseAppearance(_0x3c6a93) ||
    _0x343efb[0x0] ||
    null
  );
}
function isAppearanceGenerating(_0x1ded3d = {}, _0x32d15f = {}, _0x2220a4 = {}) {
  if (normalizeText(_0x2220a4?.['error']) || normalizeText(_0x2220a4?.['imageUrl'])) return ![];
  const _0x2f7c13 = normalizeText(_0x32d15f?.['id']) + ':' + normalizeText(_0x2220a4?.['id']);
  return Boolean(
    _0x2f7c13 !== ':' &&
    (_0x1ded3d?.['generatingAppearanceKeys']?.['includes']?.(_0x2f7c13) ||
      (_0x1ded3d?.['isBatchGenerating'] === !![] &&
        _0x1ded3d?.['batchGeneratingAppearanceKeys']?.['includes']?.(_0x2f7c13))),
  );
}
function isAssetGenerating(_0x50d0e1 = {}, _0x2d05e7 = {}) {
  const _0x412e0a = normalizeText(_0x2d05e7?.['id']);
  if (!_0x412e0a) return ![];
  if (
    _0x50d0e1?.['isBatchGenerating'] === !![] &&
    _0x50d0e1?.['batchGeneratingAssetIds']?.['includes']?.(_0x412e0a)
  )
    return !![];
  const _0x4ad227 = new Map(
    getWorkspaceAssetAppearances(_0x2d05e7)['map']((_0x5d2221) => [
      normalizeText(_0x5d2221?.['id']),
      _0x5d2221,
    ]),
  );
  return (
    Array['isArray'](_0x50d0e1?.['generatingAppearanceKeys']) ? _0x50d0e1['generatingAppearanceKeys'] : []
  )['some']((_0x5e1639) => {
    const _0x54fbfe = normalizeText(_0x5e1639);
    if (!_0x54fbfe['startsWith'](_0x412e0a + ':')) return ![];
    const _0x1ad1d1 = _0x4ad227['get'](_0x54fbfe['slice'](_0x412e0a['length'] + 0x1));
    return _0x1ad1d1 && !normalizeText(_0x1ad1d1['error']);
  });
}
function hasVoiceReference(_0x25413 = {}) {
  return Boolean(
    normalizeText(
      _0x25413?.['voiceReference']?.['audioUrl'] ||
        _0x25413?.['voiceReference']?.['localPath'] ||
        _0x25413?.['voiceRef'],
    ),
  );
}
export function renderPersonReplacementVoicePreviewPlayer(
  _0x1ec276 = {},
  { className: className = '', showWaveform: showWaveform = !![] } = {},
) {
  if (_0x1ec276?.['kind'] !== 'character' || _0x1ec276?.['isLibraryAsset'] || !hasVoiceReference(_0x1ec276))
    return '';
  const _0x308cb5 = normalizeText(className);
  return (
    '<span class="story-character-voice-name-player' +
    (_0x308cb5 ? '\x20' + escapeHtml(_0x308cb5) : '') +
    '" data-story-character-voice-player="' +
    escapeHtml(_0x1ec276['id']) +
    '">\n    <button type="button" class="story-character-voice-name-play" data-story-action="play-character-voice" data-story-voice-asset-id="' +
    escapeHtml(_0x1ec276['id']) +
    '" aria-label="播放 ' +
    escapeHtml(_0x1ec276['name']) +
    ' 的声音参考">\n      <svg class="story-character-voice-name-play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5.4v9.2l7.2-4.6L7 5.4Z"/></svg>\n      <svg class="story-character-voice-name-pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5.5h2.3v9H6.5zM11.2 5.5h2.3v9h-2.3z"/></svg>\n    </button>\n    ' +
    (showWaveform
      ? '<span class="story-character-voice-waveform" data-story-character-voice-waveform hidden aria-hidden="true">' +
        Array['from']({ length: 0xc }, () => '<i></i>')['join']('') +
        '</span>'
      : '') +
    '\x0a\x20\x20</span>'
  );
}
function renderVoiceCapsule(_0x59abb4 = {}, _0xdfb276 = '添加声音') {
  if (_0x59abb4?.['kind'] !== 'character' || _0x59abb4?.['isLibraryAsset']) return '';
  const _0x3bc3b8 = hasVoiceReference(_0x59abb4);
  return (
    '<span class="person-replacement-add-voice-menu-wrap">\n    <button type="button" class="story-character-voice-capsule ' +
    (_0x3bc3b8 ? 'has-reference' : 'is-missing') +
    '" data-story-character-voice-capsule data-story-action="toggle-character-voice-menu" aria-label="' +
    escapeHtml(_0xdfb276) +
    '\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-character-voice-icon\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M12\x204v16M8.5\x207.5v9M15.5\x208.5v7M5\x2010v4M19\x2010v4\x22/></svg></span>\x0a\x20\x20\x20\x20\x20\x20<span>' +
    escapeHtml(_0xdfb276) +
    '</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<span\x20class=\x22person-replacement-add-voice-menu\x22\x20role=\x22menu\x22\x20aria-label=\x22添加人物声音\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-action=\x22upload-character-voice\x22>上传声音</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-action=\x22choose-character-voice-from-library\x22>从项目音频添加</button>\x0a\x20\x20\x20\x20\x20\x20' +
    (_0x3bc3b8
      ? '<button type="button" role="menuitem" data-story-action="remove-character-voice">删除音频参考</button>'
      : '') +
    '\x0a\x20\x20\x20\x20</span>\x0a\x20\x20</span>'
  );
}
function renderPromptPresetPicker(_0x4f7ac4 = {}, _0x2acc9b = '') {
  if (_0x2acc9b !== 'character') return '';
  const _0x1ed27f = Array['isArray'](_0x4f7ac4['assetPromptPresets']) ? _0x4f7ac4['assetPromptPresets'] : [];
  if (!_0x1ed27f['length']) return '';
  const _0x47483e =
      _0x1ed27f['find']((_0x12fe63) => _0x12fe63['id'] === _0x4f7ac4['assetPromptPresetId']) ||
      _0x1ed27f[0x0],
    _0x333e8e = normalizeText(_0x4f7ac4['assetPromptPresetLabel']) || '生成参考';
  return (
    '<div\x20class=\x22story-home-param-picker\x20story-asset-preset-picker\x22\x20data-story-asset-preset-picker>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-home-param-trigger\x20story-menu-trigger\x20story-asset-preset-trigger\x22\x20data-story-home-param-trigger=\x22asset-preset\x22\x20aria-haspopup=\x22listbox\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20<span>' +
    escapeHtml(_0x333e8e) +
    '</span><strong>' +
    escapeHtml(_0x47483e?.['label'] || '选择预设') +
    '</strong>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<div\x20class=\x22story-home-param-popover\x20story-asset-preset-popover\x22\x20role=\x22listbox\x22\x20aria-label=\x22' +
    escapeHtml(_0x333e8e) +
    '">\n      <strong>' +
    escapeHtml(_0x333e8e) +
    '</strong>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-asset-preset-options\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    _0x1ed27f['map'](
      (_0x510ec9) =>
        '<button type="button" class="story-asset-preset-option floating-menu-item has-subtitle ' +
        (_0x510ec9['id'] === _0x47483e?.['id'] ? 'active is-selected' : '') +
        '" data-story-asset-preset-option="' +
        escapeHtml(_0x510ec9['id']) +
        '\x22\x20data-story-asset-preset-kind=\x22character\x22\x20role=\x22option\x22\x20aria-selected=\x22' +
        (_0x510ec9['id'] === _0x47483e?.['id']) +
        '"><span class="fmi-content"><span class="fmi-title">' +
        escapeHtml(_0x510ec9['label']) +
        '</span><small class="fmi-sub">' +
        escapeHtml(_0x510ec9['description']) +
        '</small></span></button>',
    )['join']('') +
    '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>'
  );
}
function renderPreviewActions({
  state: state = {},
  asset: asset = {},
  appearance: appearance = {},
  readOnly: readOnly = ![],
  generating: generating = ![],
  canDeleteAppearance: canDeleteAppearance = ![],
} = {}) {
  const _0x404c43 = renderWorkspaceImageDownloadButton({
    action: 'download-asset-image',
    enabled: Boolean(
      normalizeText(appearance?.['imageUrl']) &&
      normalizeText(asset?.['mediaKind'])['toLowerCase']() !== 'video',
    ),
  });
  if (asset['isLibraryAsset'] || readOnly)
    return _0x404c43 ? '<div class="story-asset-preview-actions">' + _0x404c43 + '</div>' : '';
  const _0x23b35e = appearance?.['totalAssetRef'],
    _0x593f2f = _0x23b35e ? '已加入总素材' : '将当前形象加入总素材';
  return (
    '<div class="story-asset-preview-actions">\n    ' +
    _0x404c43 +
    '\n    <button type="button" class="story-character-voice-upload-button story-add-to-library-button ' +
    (_0x23b35e ? 'is-synced' : '') +
    '" data-story-action="add-asset-appearance-to-library" aria-label="' +
    _0x593f2f +
    '" title="' +
    _0x593f2f +
    '\x22\x20' +
    (generating || _0x23b35e ? 'disabled' : '') +
    '>' +
    renderWorkspaceActionIcon('addToLibrary') +
    '</button>\n    <button type="button" class="story-upload-replace story-character-voice-upload-button" data-story-action="upload-asset" aria-label="上传替换图片" title="上传替换图片" ' +
    (generating ? 'disabled' : '') +
    '>' +
    renderWorkspaceActionIcon('upload') +
    '</button>\n    ' +
    (canDeleteAppearance
      ? '<button type="button" class="story-character-voice-remove story-delete-current-appearance-button" data-story-action="delete-appearance" aria-label="删除当前形象" title="删除当前形象" ' +
        (generating ? 'disabled' : '') +
        '>' +
        renderWorkspaceActionIcon('delete') +
        '</button>'
      : '') +
    '\n  </div>'
  );
}
export function renderPersonReplacementAssetCard(
  _0x569455,
  _0x3703c2,
  {
    previewAppearance: previewAppearance = null,
    statusText: statusText = '',
    cardStatusHtml: cardStatusHtml = '',
    draggable: draggable = ![],
    cardClassName: cardClassName = '',
    cardAttributes: cardAttributes = '',
    shellClassName: shellClassName = '',
    preserveShell: preserveShell = ![],
    accessoryHtml: accessoryHtml = '',
    cardMetaHtml: cardMetaHtml = '',
    headingAccessoryHtml: headingAccessoryHtml = '',
    cardMediaHtml: cardMediaHtml = '',
    fallbackImageUrl: fallbackImageUrl = '',
    workspaceAssetLibraryImage: workspaceAssetLibraryImage = ![],
  } = {},
) {
  const _0x16e336 = _0x3703c2['isLibraryAsset'] ? [_0x3703c2] : getWorkspaceAssetAppearances(_0x3703c2),
    _0x5ab17d = _0x3703c2['isLibraryAsset']
      ? {
          total: 0x1,
          generated: _0x3703c2['imageUrl'] ? 0x1 : 0x0,
          failed: 0x0,
          pending: _0x3703c2['imageUrl'] ? 0x0 : 0x1,
        }
      : getWorkspaceAssetAppearanceStats(_0x3703c2),
    _0x210bd4 =
      previewAppearance ||
      getWorkspaceAssetBaseAppearance(_0x3703c2) ||
      _0x16e336['find']((_0x17e828) => normalizeText(_0x17e828?.['imageUrl'])) ||
      _0x16e336[0x0] ||
      _0x3703c2,
    _0x22a09c = isAssetGenerating(_0x569455, _0x3703c2),
    _0x4ba14b = _0x569455?.['allowAssetRename'] === !![] && !_0x3703c2['isLibraryAsset'],
    _0x19213e = _0x4ba14b
      ? 'data-story-asset-name-id=\x22' +
        escapeHtml(_0x3703c2['id']) +
        '" aria-label="重命名' +
        escapeHtml(_0x3703c2['name'] || '未命名素材') +
        '\x22'
      : '',
    _0x406742 =
      _0x569455?.['hideAssetRoleTag'] !== !![] &&
      !['scene', 'prop']['includes'](normalizeText(_0x3703c2?.['kind']))
        ? '<small>' + escapeHtml(_0x3703c2['role'] || '素材') + '</small>'
        : '',
    _0x2a8463 = normalizeText(_0x3703c2['kind'])['toLowerCase'](),
    _0x51af9f = _0x2a8463 === 'scene' ? '场景' : _0x2a8463 === 'audio' ? '音频' : '人物',
    _0x16c279 =
      _0x569455?.['allowDeleteAssetCard'] &&
      !_0x3703c2['isLibraryAsset'] &&
      !(_0x569455['assetSelectionMode'] && _0x569455['selectedAssetIds']?.['length'] > 0x1)
        ? renderWorkspaceCardDeleteControl({
            className: 'story-asset-card-delete-trigger',
            ariaLabel: '删除' + _0x51af9f + '\x20' + _0x3703c2['name'],
            actionAttributes: {
              'data-story-action': 'delete-asset-card',
              'data-story-asset-delete-id': _0x3703c2['id'],
            },
            disabled: _0x22a09c,
          })
        : '';
  return renderWorkspaceAssetCard({
    asset: _0x3703c2,
    appearances: _0x16e336,
    previewAppearance: _0x210bd4,
    stats: _0x5ab17d,
    selected:
      _0x569455?.['assetSelectionStyle'] === 'border'
        ? _0x569455?.['selectedAssetIds']?.['includes']?.(_0x3703c2['id']) === !![]
        : _0x3703c2['id'] === _0x569455?.['selectedAssetId'],
    showSelectionIndicator: ![],
    selectionMode: _0x569455?.['assetSelectionMode'] === !![],
    checked: _0x569455?.['selectedAssetIds']?.['includes']?.(_0x3703c2['id']) === !![],
    loading: _0x22a09c,
    draggable: draggable,
    promptPreview: _0x210bd4?.['prompt'] || _0x3703c2?.['prompt'] || '',
    statusText: statusText,
    cardStatusHtml: cardStatusHtml,
    cardClassName: cardClassName,
    cardAttributes: cardAttributes,
    shellClassName:
      '' +
      shellClassName +
      (!_0x3703c2['isLibraryAsset'] &&
      _0x2a8463 === 'character' &&
      cardClassName['includes']('workspace-portrait-card')
        ? ' workspace-card-with-image-actions'
        : ''),
    preserveShell:
      preserveShell || (_0x569455?.['allowDeleteAssetCard'] === !![] && !_0x3703c2['isLibraryAsset']),
    accessoryHtml:
      accessoryHtml +
      (!_0x3703c2['isLibraryAsset'] &&
      _0x2a8463 === 'character' &&
      cardClassName['includes']('workspace-portrait-card')
        ? renderWorkspaceCardImageActions({
            uploadAttributes: {
              'data-story-action': 'upload-asset',
              'data-story-card-appearance-id': _0x3703c2['id'],
            },
            generateAttributes: {
              'data-story-action': 'generate-asset',
              'data-story-card-appearance-id': _0x3703c2['id'],
            },
            disabled: _0x22a09c,
          })
        : ''),
    cardMetaHtml: cardMetaHtml,
    headingAccessoryHtml: headingAccessoryHtml,
    cardMediaHtml: cardMediaHtml,
    fallbackImageUrl: fallbackImageUrl,
    workspaceAssetLibraryImage: workspaceAssetLibraryImage,
    nameAttributes: _0x19213e,
    roleHtml: _0x406742,
    deleteControlHtml: _0x16c279,
  });
}
function renderAudioArtwork({ compact: compact = ![] } = {}) {
  return (
    '<span class="' +
    (compact ? 'story-asset-card-image ' : '') +
    'person-replacement-audio-artwork' +
    (compact ? ' is-compact' : '') +
    '\x22\x20role=\x22img\x22\x20aria-label=\x22音频素材\x22>\x0a\x20\x20\x20\x20<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M5\x2010v4M8.5\x207.5v9M12\x204v16M15.5\x208.5v7M19\x2010v4\x22/></svg>\x0a\x20\x20\x20\x20<span>' +
    (compact ? '音频' : '声音素材') +
    '</span>\x0a\x20\x20</span>'
  );
}
function getCharacterPreview(_0x450a07 = {}) {
  const _0x2e5b29 =
    getWorkspaceAssetBaseAppearance(_0x450a07) ||
    getWorkspaceAssetAppearances(_0x450a07)['find']((_0x5eb073) => normalizeText(_0x5eb073?.['imageUrl']));
  return {
    imageUrl: normalizeText(_0x2e5b29?.['imageUrl']),
    name: normalizeText(_0x450a07['name']) || '未命名人设',
  };
}
function getAudioAssetDisplayName(_0x437633 = {}) {
  return getPersonReplacementAudioSavedName(_0x437633);
}
export function renderPersonReplacementAudioAssetCard(
  _0x127f4a,
  _0x18f157,
  { boundCharacters: boundCharacters = [], showVoiceLibraryConfirm: showVoiceLibraryConfirm = ![] } = {},
) {
  const _0x1b9302 = Array['isArray'](boundCharacters) ? boundCharacters['length'] : 0x0,
    _0x5675c8 = getAudioAssetDisplayName(_0x18f157),
    _0x4ba2b8 = showVoiceLibraryConfirm
      ? '<button type="button" class="story-primary-button person-replacement-audio-card-add-voice" data-person-replacement-action="confirm-character-voice-library" data-person-replacement-audio-asset-id="' +
        escapeHtml(_0x18f157['id']) +
        '" aria-label="添加声音：' +
        escapeHtml(_0x5675c8) +
        '\x22>添加声音</button>'
      : '';
  return renderPersonReplacementAssetCard(
    _0x127f4a,
    { ..._0x18f157, name: _0x5675c8, prompt: '' },
    {
      cardClassName: 'person-replacement-audio-asset-card',
      cardAttributes: 'data-person-replacement-audio-library-asset="true"',
      shellClassName: showVoiceLibraryConfirm ? 'person-replacement-audio-asset-shell' : '',
      accessoryHtml: _0x4ba2b8,
      cardMediaHtml: renderAudioArtwork({ compact: !![] }),
      cardStatusHtml:
        '<span>' + (_0x1b9302 ? '已绑定\x20' + _0x1b9302 + ' 个人设' : '未绑定人设') + '</span>',
    },
  );
}
export function renderPersonReplacementAudioAssetDetail(
  _0x5aca7f,
  {
    boundCharacters: boundCharacters = [],
    characters: characters = [],
    isLibrary: isLibrary = ![],
    selectedCharacterId: selectedCharacterId = '',
  } = {},
) {
  if (!_0x5aca7f)
    return '<aside class="story-asset-detail story-empty-panel"><strong>暂无音频素材</strong><p>请从总素材加入或上传音频。</p></aside>';
  return renderWorkspaceAudioAssetDetail({
    name: getAudioAssetDisplayName(_0x5aca7f),
    audioUrl: getPersonReplacementLibraryAudioRef(_0x5aca7f),
    waveformUrl: _0x5aca7f['waveformLocalPath'] || _0x5aca7f['waveformUrl'],
    characters: characters,
    selectedCharacterId: selectedCharacterId,
    boundNames: boundCharacters['map']((_0x486770) => _0x486770['name']),
    isLibrary: isLibrary,
    className: 'person-replacement-audio-detail',
    detailAttributes: 'data-workspace-audio-asset-id="' + escapeHtml(_0x5aca7f['id']) + '\x22',
    playerClassName: 'person-replacement-audio-playback',
    selectAttributes: 'data-person-replacement-audio-character',
    bindAttributes: 'data-person-replacement-action="bind-project-audio"',
    membershipAttributes:
      'data-person-replacement-action="' +
      (isLibrary ? 'add-project-audio' : 'remove-project-audio') +
      '\x22',
  });
}
export function renderPersonReplacementAssetDetail(
  _0x41c08b,
  _0x2ced38,
  {
    showEmptyDescription: showEmptyDescription = !![],
    readOnly: readOnly = ![],
    voiceLibrarySelection: voiceLibrarySelection = null,
    detailSplitRatio: detailSplitRatio = 0x32,
    detailSplitterHtml: detailSplitterHtml = '',
  } = {},
) {
  if (!_0x2ced38) {
    const _0xa19715 = _0x41c08b?.['assetFilter'] === 'library' ? '总素材中还没有可引用的图片或音频。' : '';
    return (
      '<aside class="story-asset-detail story-empty-panel">\n      <strong>暂无可用素材</strong>\n      ' +
      (showEmptyDescription && _0xa19715 ? '<p>' + _0xa19715 + '</p>' : '') +
      '\x0a\x20\x20\x20\x20</aside>'
    );
  }
  const _0x2d2d16 = _0x2ced38['isLibraryAsset'] ? [_0x2ced38] : getWorkspaceAssetAppearances(_0x2ced38),
    _0x1d5fa2 = getSelectedAppearanceIndex(_0x41c08b, _0x2ced38),
    _0x2825aa = getSelectedAppearance(_0x41c08b, _0x2ced38) || _0x2ced38,
    _0x1fdc94 = !_0x2ced38['isLibraryAsset'] && !readOnly && _0x2d2d16['length'] > 0x1,
    _0x1f671b = _0x2ced38['kind'] === 'character' && !_0x2ced38['isLibraryAsset'] && !readOnly,
    _0x36f29b = getWorkspaceAssetBaseAppearance(_0x2ced38),
    _0x500b84 =
      _0x1f671b &&
      (_0x2d2d16['length'] === 0x1
        ? _0x2d2d16[0x0]?.['id'] === _0x2825aa?.['id']
        : _0x36f29b?.['id'] === _0x2825aa?.['id']),
    _0x4a69ed = isAppearanceGenerating(_0x41c08b, _0x2ced38, _0x2825aa),
    _0x28ed4c = Boolean(_0x41c08b?.['allowDeleteAssetAppearance'] && _0x1fdc94 && !_0x500b84),
    _0x1011ad = normalizeText(_0x2825aa?.['imageUrl']),
    _0x53cedf = _0x1011ad
      ? '<img class="story-asset-preview" src="' +
        escapeHtml(_0x1011ad) +
        '" alt="' +
        escapeHtml(_0x2ced38['name'] + ' · ' + (_0x2825aa['name'] || '形象')) +
        '" loading="lazy" decoding="async">'
      : '<div\x20class=\x22story-asset-preview\x20story-media-empty\x22\x20role=\x22img\x22\x20aria-label=\x22' +
        escapeHtml(_0x2ced38['name'] + '待生成') +
        '"><span>待生成</span></div>',
    _0x5f3883 =
      _0x41c08b?.['allowAssetRename'] === !![] && !_0x2ced38['isLibraryAsset']
        ? '\x20data-story-asset-name-id=\x22' +
          escapeHtml(_0x2ced38['id']) +
          '" aria-label="重命名' +
          escapeHtml(_0x2ced38['name']) +
          '\x22'
        : '',
    _0x531aa0 = normalizeText(_0x2825aa?.['occurrences'] || _0x2ced38?.['occurrences']) || '当前项目',
    _0x119955 = voiceLibrarySelection?.['audioAsset'] || null,
    _0x5cf8ce = _0x119955 ? getPersonReplacementLibraryAudioRef(_0x119955) : '',
    _0x39cf7e = Boolean(voiceLibrarySelection),
    _0x4d8e15 = _0x39cf7e
      ? '<div\x20class=\x22story-asset-prompt-field\x20person-replacement-voice-library-playback-field\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
        (_0x5cf8ce
          ? renderAudioPlaybackSurface({
              audioUrl: _0x5cf8ce,
              waveformUrl: _0x119955?.['waveformLocalPath'] || _0x119955?.['waveformUrl'],
              className: 'person-replacement-voice-library-playback has-reference',
              playLabel: '播放' + (_0x119955?.['name'] || '所选声音'),
              pauseLabel: '暂停' + (_0x119955?.['name'] || '所选声音'),
            })
          : '<div\x20class=\x22person-replacement-voice-library-playback-empty\x22>请从左侧选择声音</div>') +
        '\n      </div>'
      : '<div class="story-asset-prompt-field">\n        <div class="story-asset-prompt-editor" data-story-asset-prompt data-story-asset-prompt-asset-id="' +
        escapeHtml(_0x2ced38['id']) +
        '\x22\x20data-story-asset-prompt-appearance-id=\x22' +
        escapeHtml(_0x2825aa['id']) +
        '" contenteditable="' +
        (_0x2ced38['isLibraryAsset'] || readOnly ? 'false' : 'true') +
        '" role="textbox" aria-multiline="true" aria-label="形象提示词" spellcheck="false">' +
        renderPromptText(
          _0x2ced38['isLibraryAsset'] || readOnly
            ? _0x2ced38['description'] || _0x2825aa['prompt'] || ''
            : _0x2825aa['prompt'] || '',
        ) +
        '</div>\x0a\x20\x20\x20\x20\x20\x20</div>',
    _0x46889b =
      _0x2ced38['isLibraryAsset'] || readOnly
        ? ''
        : _0x39cf7e
          ? '<div class="story-asset-generation-bar prompt-panel-footer person-replacement-voice-library-confirm-bar">\n          <div class="story-asset-generation-actions">\n            <button type="button" class="story-asset-generate-button story-primary-button" data-person-replacement-action="confirm-character-voice-library" ' +
            (_0x5cf8ce ? '' : 'disabled') +
            '><span>确认</span></button>\n          </div>\n        </div>'
          : '<div class="story-asset-generation-bar prompt-panel-footer">\n          ' +
            renderAIGenImageModelSelectorMarkup({
              modelId: _0x41c08b?.['models']?.['image'],
              provider: _0x41c08b?.['imageProvider'],
              generationParams: _0x41c08b?.['imageGenerationParams'],
              providerProfileId: _0x41c08b?.['imageProviderProfileId'],
              providerProfileIdByModel: _0x41c08b?.['imageProviderProfileIdByModel'],
              showSchemaControls: !![],
              className: 'story-asset-image-model-selector',
            }) +
            '\n          <div class="story-asset-generation-actions">\n            ' +
            renderPromptPresetPicker(_0x41c08b, _0x2ced38['kind']) +
            '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
            renderRequestDebugButton('data-story-action="debug-generation-asset"') +
            '<button\x20type=\x22button\x22\x20class=\x22story-asset-generate-button\x20story-primary-button\x22\x20data-story-action=\x22generate-asset\x22\x20' +
            (_0x4a69ed ? 'disabled' : '') +
            '><span>' +
            (_0x4a69ed ? '生成中' : escapeHtml(_0x41c08b?.['assetGenerateLabel'] || '生成素材图')) +
            '</span></button>\n          </div>\n        </div>',
    _0xf03b76 =
      '<div class="story-asset-preview-caption person-replacement-asset-detail-caption">\n    <div class="story-asset-caption-heading">\n      <span class="story-asset-caption-title"><strong' +
      _0x5f3883 +
      '>' +
      escapeHtml(_0x2ced38['name'] || '未命名素材') +
      '</strong>' +
      renderPersonReplacementVoicePreviewPlayer(_0x2ced38) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-asset-caption-tags\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x1f671b
        ? '<button type="button" class="story-base-appearance-button ' +
          (_0x500b84 ? 'is-active' : '') +
          '\x22\x20' +
          (_0x1fdc94 ? 'data-story-action="set-base-appearance"' : 'disabled') +
          ' aria-pressed="' +
          _0x500b84 +
          '\x22\x20aria-disabled=\x22' +
          !_0x1fdc94 +
          '" title="会以基础形象作为参考，生成角色的其他形象">' +
          (_0x500b84 ? '基础形象' : '设为基础形象') +
          '</button>'
        : '') +
      '\n        ' +
      renderVoiceCapsule(_0x2ced38, _0x41c08b?.['assetVoiceUploadLabel'] || '添加声音') +
      '\n      </span>\n    </div>\n    <span data-story-asset-caption-meta>' +
      escapeHtml(_0x2825aa['name'] || _0x2ced38['role'] || '素材') +
      '\x20·\x20' +
      escapeHtml(_0x531aa0) +
      (_0x1fdc94 ? '\x20·\x20' + (_0x1d5fa2 + 0x1) + '/' + _0x2d2d16['length'] : '') +
      '</span>\n  </div>',
    _0xb5735e = Math['min'](0x44, Math['max'](0x20, Number(detailSplitRatio) || 0x32));
  return (
    '<aside class="story-asset-detail person-replacement-asset-detail-layout' +
    (_0x39cf7e ? ' person-replacement-voice-library-character-detail' : '') +
    '" data-person-replacement-asset-detail-layout style="--person-replacement-asset-detail-top:' +
    _0xb5735e +
    '%;"' +
    (_0x39cf7e ? ' data-person-replacement-voice-library-character-detail' : '') +
    '>\n    <div class="story-asset-preview-wrap" data-story-appearance-wheel="' +
    _0x1fdc94 +
    '\x22\x20' +
    (_0x1fdc94 ? 'tabindex=\x220\x22\x20aria-label=\x22滚动鼠标滚轮或按左右方向键切换形象\x22' : '') +
    '>\n      <div class="story-asset-preview-slide ' +
    (_0x4a69ed ? 'img-preview-loading' : '') +
    '\x22\x20aria-busy=\x22' +
    _0x4a69ed +
    '">\n        ' +
    _0x53cedf +
    '\n        ' +
    (_0x4a69ed ? renderWorkspaceAssetLoadingOverlay() : '') +
    '\n      </div>\n      ' +
    renderPreviewActions({
      state: _0x41c08b,
      asset: _0x2ced38,
      appearance: _0x2825aa,
      readOnly: readOnly,
      generating: _0x4a69ed,
      canDeleteAppearance: _0x28ed4c,
    }) +
    '\n      ' +
    (_0x1fdc94
      ? '' +
        renderWorkspacePreviewArrow('previous', {
          action: 'previous-appearance',
          label: '上一个形象',
          actionAttributes: { 'data-story-action': 'previous-appearance' },
        }) +
        renderWorkspacePreviewArrow('next', {
          action: 'next-appearance',
          label: '下一个形象',
          actionAttributes: { 'data-story-action': 'next-appearance' },
        })
      : '') +
    '\n    </div>\n    ' +
    detailSplitterHtml +
    '\n    <div class="story-asset-detail-panel-stage is-image is-settled" data-story-asset-detail-panel-stage>\n      <div class="story-asset-detail-panel-cube">\n        <div class="story-asset-detail-copy story-asset-detail-panel-face story-asset-detail-panel-face--image" aria-hidden="false">\n          ' +
    _0xf03b76 +
    '\n          ' +
    _0x4d8e15 +
    '\n          ' +
    _0x46889b +
    '\n        </div>\n      </div>\n    </div>\n  </aside>'
  );
}
export function renderPersonReplacementBatchGenerationControl(_0x5acc1c = {}) {
  const _0x1975e1 = Array['isArray'](_0x5acc1c?.['selectedAssetIds'])
      ? _0x5acc1c['selectedAssetIds']['length']
      : 0x0,
    _0x387736 = _0x5acc1c?.['isBatchGenerating'] === !![],
    _0x32d337 = _0x5acc1c?.['batchCancelRequested'] === !![],
    _0x9edc10 = _0x387736 ? _0x32d337 : !_0x1975e1,
    _0x4a3c8e = _0x1975e1 ? '\x20(' + _0x1975e1 + ')' : '',
    _0x22ad30 = normalizeText(_0x5acc1c?.['batchGenerationActionLabel']) || '批量生成',
    _0x2b3338 = _0x387736
      ? '' + (_0x32d337 ? '正在停止' : '取消运行') + _0x4a3c8e
      : '' + _0x22ad30 + _0x4a3c8e,
    _0x10e9ee = ['scene', 'prop']['includes'](normalizeText(_0x5acc1c?.['assetFilter'])) ? 'image' : '',
    _0x165c81 = _0x387736
      ? normalizeText(_0x5acc1c['batchCancelAction']) || 'cancel-asset-batch-generation'
      : 'batch-generate-assets';
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20story-asset-batch-trigger\x22\x20data-story-action=\x22' +
    escapeHtml(_0x165c81) +
    '\x22' +
    (_0x10e9ee ? ' data-story-asset-batch-direct-mode="' + _0x10e9ee + '\x22' : '') +
    ' aria-busy="' +
    _0x387736 +
    '\x22\x20' +
    (_0x9edc10 ? 'disabled' : '') +
    '><span class="story-asset-batch-trigger-label">' +
    escapeHtml(_0x2b3338) +
    '</span></button>'
  );
}
export function renderPersonReplacementPreviewArrow(_0x4a5ea2, _0x142366 = {}) {
  return renderWorkspacePreviewArrow(_0x4a5ea2, {
    ..._0x142366,
    actionAttributes: normalizeText(_0x142366?.['action'])
      ? { 'data-story-action': _0x142366['action'] }
      : {},
  });
}
export function syncPersonReplacementVoicePreviewUi(
  _0x1b10f0,
  { audioEl: audioEl = null, assetId: assetId = '' } = {},
) {
  const _0x59af94 = Number(audioEl?.['duration']),
    _0x34431d = Number(audioEl?.['currentTime']),
    _0x492c44 =
      Number['isFinite'](_0x59af94) && _0x59af94 > 0x0
        ? Math['max'](0x0, Math['min'](0x1, _0x34431d / _0x59af94))
        : 0x0,
    _0x13daa9 = Boolean(audioEl && audioEl['paused'] === ![] && audioEl['ended'] !== !![]);
  return (
    _0x1b10f0?.['querySelectorAll']?.('[data-story-character-voice-player]')?.['forEach']?.((_0x3d81e2) => {
      const _0x7f9c44 =
          normalizeText(_0x3d81e2['dataset']?.['storyCharacterVoicePlayer']) === normalizeText(assetId),
        _0x3b8f23 = _0x3d81e2['querySelector']?.("[data-story-action='play-character-voice']"),
        _0x369e0d = _0x3d81e2['querySelector']?.('[data-story-character-voice-waveform]');
      (_0x3d81e2['classList']?.['toggle']?.('is-active', _0x7f9c44),
        _0x3d81e2['classList']?.['toggle']?.('is-playing', _0x7f9c44 && _0x13daa9),
        _0x3b8f23?.['setAttribute']?.(
          'aria-label',
          _0x7f9c44 && _0x13daa9 ? '暂停声音参考' : '播放声音参考',
        ));
      if (_0x369e0d) {
        ((_0x369e0d['hidden'] = !_0x7f9c44),
          _0x369e0d['setAttribute']?.('aria-hidden', String(!_0x7f9c44)),
          _0x369e0d['style']?.['setProperty']?.('--story-character-voice-progress', '' + _0x492c44));
        const _0x4efe71 = _0x369e0d['querySelectorAll']?.('i') || [];
        _0x4efe71['forEach']?.((_0x4bfa9c, _0x2f6670) => {
          _0x4bfa9c['classList']?.['toggle']?.(
            'is-played',
            _0x7f9c44 && _0x492c44 >= (_0x2f6670 + 0x1) / _0x4efe71['length'],
          );
        });
      }
    }),
    !![]
  );
}
