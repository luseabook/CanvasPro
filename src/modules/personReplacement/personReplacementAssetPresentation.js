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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&apos;');
}
export function buildPersonReplacementAssetViewState(selectedAssetIds) {
  const assetFilter = ['character', 'scene', 'audio', 'library']['includes'](
      selectedAssetIds['workspace']['characterAssetTab'],
    )
      ? selectedAssetIds['workspace']['characterAssetTab']
      : 'character',
    enabled = assetFilter === 'library',
    enabled2 = assetFilter === 'scene',
    enabled3 = assetFilter === 'audio',
    assets = enabled
      ? selectedAssetIds['libraryAssets']
      : enabled3
        ? selectedAssetIds['audioAssets']
        : enabled2
          ? selectedAssetIds['scenes']
          : selectedAssetIds['characters'],
    key = enabled
      ? selectedAssetIds['workspace']['selectedLibraryAssetId']
      : enabled3
        ? selectedAssetIds['workspace']['selectedAudioAssetId']
        : enabled2
          ? selectedAssetIds['workspace']['selectedSceneId']
          : selectedAssetIds['workspace']['selectedCharacterId'],
    selectedAssetId = assets['find']((index) => index['id'] === key) || assets[0] || null;
  return {
    data: { assets: assets, project: {} },
    assetFilter: assetFilter,
    assetSelectionStyle: 'border',
    selectedAssetId: selectedAssetId?.['id'] || '',
    selectedAssetIds: selectedAssetIds['workspace']['selectedAssetIds'],
    assetSelectionMode: selectedAssetIds['workspace']['assetSelectionMode'],
    assetAppearanceIndexes: selectedAssetIds['workspace']['assetAppearanceIndexes'],
    assetAppearanceMotion: '',
    assetSplitRatio: selectedAssetIds['workspace']['assetSplitRatio'],
    assetDetailSplitRatio: selectedAssetIds['workspace']['assetDetailSplitRatio'],
    generatingAppearanceKeys: selectedAssetIds['workspace']['generatingAppearanceKeys'],
    isBatchGenerating: false,
    batchGeneratingAssetIds: [],
    batchGeneratingAppearanceKeys: [],
    characterVoiceEditor: null,
    characterVoicePanelMotion: '',
    models: {
      image:
        selectedAssetIds['settings']['characterImageModelId'] || PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    },
    imageProvider: selectedAssetIds['settings']['characterImageProvider'] || 'apimart',
    imageGenerationParams: selectedAssetIds['settings']['characterImageGenerationParams'] || {},
    imageGenerationParamsByModel: selectedAssetIds['settings']['characterImageGenerationParamsByModel'] || {},
    imageProviderProfileId: selectedAssetIds['settings']['characterImageProviderProfileId'] || '',
    imageProviderProfileIdByModel:
      selectedAssetIds['settings']['characterImageProviderProfileIdByModel'] || {},
    assetVoiceUploadLabel: '添加声音',
    allowDeleteAssetAppearance: !enabled2 && !enabled3,
    allowDeleteAssetCard: !enabled,
    allowAssetRename: !enabled && !enabled2 && !enabled3,
    allowAssetStyleReference: false,
    hideAssetRoleTag: true,
    hideAssetNameTooltip: true,
    assetGenerateLabel: '生成素材图',
    assetPromptPresetId: selectedAssetIds['workspace']['assetPromptPresetId'],
    assetPromptPresets: PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS,
    assetPromptPresetLabel: '图1 人设参考',
  };
}
function renderPromptText(result) {
  return escapeHtml(result)['replace'](/\r\n?|\n/g, '<br>');
}
export function readPersonReplacementAssetPromptText(enabled4 = null) {
  if (!enabled4) return '';
  const list = [],
    handler = (data) => {
      if (data) list['push'](String(data));
    },
    handler2 = (el, { root: root = false } = {}) => {
      const count = Number(el?.['nodeType']);
      if (count === 3) {
        handler(el['textContent'] || '');
        return;
      }
      if (count !== 1 && !root) return;
      const options = String(el?.['tagName'] || '')['toUpperCase']();
      if (options === 'BR') {
        handler('\n');
        return;
      }
      const target = !root && ['DIV', 'P']['includes'](options);
      if (target && list['length'] && !list['at'](-1)['endsWith']('\n')) handler('\n');
      Array['from'](el?.['childNodes'] || [])['forEach']((source) => handler2(source));
      if (target && list['length'] && !list['at'](-1)['endsWith']('\n')) handler('\n');
    };
  return (
    handler2(enabled4, { root: true }),
    list['join']('')
      ['replace'](/\u00a0/g, ' ')
      ['replace'](/\n{3,}/g, '\n\n')
      ['replace'](/\n$/g, '')
  );
}
function getSelectedAppearanceIndex(options2 = {}, next = {}) {
  const list2 = getWorkspaceAssetAppearances(next);
  if (!list2['length']) return 0;
  const current = Math['trunc'](Number(options2?.['assetAppearanceIndexes']?.[next['id']]) || 0);
  return Math['max'](0, Math['min'](list2['length'] - 1, current));
}
function getSelectedAppearance(options3 = {}, entry = {}) {
  const workspaceAssetAppearances = getWorkspaceAssetAppearances(entry);
  return (
    workspaceAssetAppearances[getSelectedAppearanceIndex(options3, entry)] ||
    getWorkspaceAssetBaseAppearance(entry) ||
    workspaceAssetAppearances[0] ||
    null
  );
}
function isAppearanceGenerating(options4 = {}, record = {}, payload = {}) {
  if (normalizeText(payload?.['error']) || normalizeText(payload?.['imageUrl'])) return false;
  const text = normalizeText(record?.['id']) + ':' + normalizeText(payload?.['id']);
  return Boolean(
    text !== ':' &&
    (options4?.['generatingAppearanceKeys']?.['includes']?.(text) ||
      (options4?.['isBatchGenerating'] === true &&
        options4?.['batchGeneratingAppearanceKeys']?.['includes']?.(text))),
  );
}
function isAssetGenerating(options5 = {}, handle = {}) {
  const list3 = normalizeText(handle?.['id']);
  if (!list3) return false;
  if (
    options5?.['isBatchGenerating'] === true &&
    options5?.['batchGeneratingAssetIds']?.['includes']?.(list3)
  )
    return true;
  const map = new Map(
    getWorkspaceAssetAppearances(handle)['map']((config) => [normalizeText(config?.['id']), config]),
  );
  return (
    Array['isArray'](options5?.['generatingAppearanceKeys']) ? options5['generatingAppearanceKeys'] : []
  )['some']((scope) => {
    const list4 = normalizeText(scope);
    if (!list4['startsWith'](list3 + ':')) return false;
    const input = map['get'](list4['slice'](list3['length'] + 1));
    return input && !normalizeText(input['error']);
  });
}
function hasVoiceReference(options6 = {}) {
  return Boolean(
    normalizeText(
      options6?.['voiceReference']?.['audioUrl'] ||
        options6?.['voiceReference']?.['localPath'] ||
        options6?.['voiceRef'],
    ),
  );
}
export function renderPersonReplacementVoicePreviewPlayer(
  error = {},
  { className: className = '', showWaveform: showWaveform = true } = {},
) {
  if (error?.['kind'] !== 'character' || error?.['isLibraryAsset'] || !hasVoiceReference(error)) return '';
  const text2 = normalizeText(className);
  return (
    '<span class="story-character-voice-name-player' +
    (text2 ? ' ' + escapeHtml(text2) : '') +
    '" data-story-character-voice-player="' +
    escapeHtml(error['id']) +
    '">\n    <button type="button" class="story-character-voice-name-play" data-story-action="play-character-voice" data-story-voice-asset-id="' +
    escapeHtml(error['id']) +
    '" aria-label="播放 ' +
    escapeHtml(error['name']) +
    ' 的声音参考">\n      <svg class="story-character-voice-name-play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5.4v9.2l7.2-4.6L7 5.4Z"/></svg>\n      <svg class="story-character-voice-name-pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5.5h2.3v9H6.5zM11.2 5.5h2.3v9h-2.3z"/></svg>\n    </button>\n    ' +
    (showWaveform
      ? '<span class="story-character-voice-waveform" data-story-character-voice-waveform hidden aria-hidden="true">' +
        Array['from']({ length: 12 }, () => '<i></i>')['join']('') +
        '</span>'
      : '') +
    '\n  </span>'
  );
}
function renderVoiceCapsule(options7 = {}, output = '添加声音') {
  if (options7?.['kind'] !== 'character' || options7?.['isLibraryAsset']) return '';
  const hasVoiceReference2 = hasVoiceReference(options7);
  return (
    '<span class="person-replacement-add-voice-menu-wrap">\n    <button type="button" class="story-character-voice-capsule ' +
    (hasVoiceReference2 ? 'has-reference' : 'is-missing') +
    '" data-story-character-voice-capsule data-story-action="toggle-character-voice-menu" aria-label="' +
    escapeHtml(output) +
    '" aria-haspopup="menu" aria-expanded="false">\n      <span class="story-character-voice-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M8.5 7.5v9M15.5 8.5v7M5 10v4M19 10v4"/></svg></span>\n      <span>' +
    escapeHtml(output) +
    '</span>\n    </button>\n    <span class="person-replacement-add-voice-menu" role="menu" aria-label="添加人物声音" aria-hidden="true">\n      <button type="button" role="menuitem" data-story-action="upload-character-voice">上传声音</button>\n      <button type="button" role="menuitem" data-story-action="choose-character-voice-from-library">从项目音频添加</button>\n      ' +
    (hasVoiceReference2
      ? '<button type="button" role="menuitem" data-story-action="remove-character-voice">删除音频参考</button>'
      : '') +
    '\n    </span>\n  </span>'
  );
}
function renderPromptPresetPicker(options8 = {}, value2 = '') {
  if (value2 !== 'character') return '';
  const list5 = Array['isArray'](options8['assetPromptPresets']) ? options8['assetPromptPresets'] : [];
  if (!list5['length']) return '';
  const value3 = list5['find']((value4) => value4['id'] === options8['assetPromptPresetId']) || list5[0],
    text3 = normalizeText(options8['assetPromptPresetLabel']) || '生成参考';
  return (
    '<div class="story-home-param-picker story-asset-preset-picker" data-story-asset-preset-picker>\n    <button type="button" class="story-home-param-trigger story-menu-trigger story-asset-preset-trigger" data-story-home-param-trigger="asset-preset" aria-haspopup="listbox" aria-expanded="false">\n      <span>' +
    escapeHtml(text3) +
    '</span><strong>' +
    escapeHtml(value3?.['label'] || '选择预设') +
    '</strong>\n    </button>\n    <div class="story-home-param-popover story-asset-preset-popover" role="listbox" aria-label="' +
    escapeHtml(text3) +
    '">\n      <strong>' +
    escapeHtml(text3) +
    '</strong>\n      <div class="story-asset-preset-options">\n        ' +
    list5['map'](
      (value5) =>
        '<button type="button" class="story-asset-preset-option floating-menu-item has-subtitle ' +
        (value5['id'] === value3?.['id'] ? 'active is-selected' : '') +
        '" data-story-asset-preset-option="' +
        escapeHtml(value5['id']) +
        '" data-story-asset-preset-kind="character" role="option" aria-selected="' +
        (value5['id'] === value3?.['id']) +
        '"><span class="fmi-content"><span class="fmi-title">' +
        escapeHtml(value5['label']) +
        '</span><small class="fmi-sub">' +
        escapeHtml(value5['description']) +
        '</small></span></button>',
    )['join']('') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderPreviewActions({
  state: state = {},
  asset: asset = {},
  appearance: appearance = {},
  readOnly: readOnly = false,
  generating: generating = false,
  canDeleteAppearance: canDeleteAppearance = false,
} = {}) {
  const renderWorkspaceImageDownloadButton2 = renderWorkspaceImageDownloadButton({
    action: 'download-asset-image',
    enabled: Boolean(
      normalizeText(appearance?.['imageUrl']) &&
      normalizeText(asset?.['mediaKind'])['toLowerCase']() !== 'video',
    ),
  });
  if (asset['isLibraryAsset'] || readOnly)
    return renderWorkspaceImageDownloadButton2
      ? '<div class="story-asset-preview-actions">' + renderWorkspaceImageDownloadButton2 + '</div>'
      : '';
  const value6 = appearance?.['totalAssetRef'],
    value7 = value6 ? '已加入总素材' : '将当前形象加入总素材';
  return (
    '<div class="story-asset-preview-actions">\n    ' +
    renderWorkspaceImageDownloadButton2 +
    '\n    <button type="button" class="story-character-voice-upload-button story-add-to-library-button ' +
    (value6 ? 'is-synced' : '') +
    '" data-story-action="add-asset-appearance-to-library" aria-label="' +
    value7 +
    '" title="' +
    value7 +
    '" ' +
    (generating || value6 ? 'disabled' : '') +
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
  selected,
  generated,
  {
    previewAppearance: previewAppearance = null,
    statusText: statusText = '',
    cardStatusHtml: cardStatusHtml = '',
    draggable: draggable = false,
    cardClassName: cardClassName = '',
    cardAttributes: cardAttributes = '',
    shellClassName: shellClassName = '',
    preserveShell: preserveShell = false,
    accessoryHtml: accessoryHtml = '',
    cardMetaHtml: cardMetaHtml = '',
    headingAccessoryHtml: headingAccessoryHtml = '',
    cardMediaHtml: cardMediaHtml = '',
    fallbackImageUrl: fallbackImageUrl = '',
    workspaceAssetLibraryImage: workspaceAssetLibraryImage = false,
  } = {},
) {
  const appearances = generated['isLibraryAsset'] ? [generated] : getWorkspaceAssetAppearances(generated),
    stats = generated['isLibraryAsset']
      ? {
          total: 1,
          generated: generated['imageUrl'] ? 1 : 0,
          failed: 0,
          pending: generated['imageUrl'] ? 0 : 1,
        }
      : getWorkspaceAssetAppearanceStats(generated),
    previewAppearance2 =
      previewAppearance ||
      getWorkspaceAssetBaseAppearance(generated) ||
      appearances['find']((value8) => normalizeText(value8?.['imageUrl'])) ||
      appearances[0] ||
      generated,
    disabled = isAssetGenerating(selected, generated),
    value9 = selected?.['allowAssetRename'] === true && !generated['isLibraryAsset'],
    nameAttributes = value9
      ? 'data-story-asset-name-id="' +
        escapeHtml(generated['id']) +
        '" aria-label="重命名' +
        escapeHtml(generated['name'] || '未命名素材') +
        '"'
      : '',
    roleHtml =
      selected?.['hideAssetRoleTag'] !== true &&
      !['scene', 'prop']['includes'](normalizeText(generated?.['kind']))
        ? '<small>' + escapeHtml(generated['role'] || '素材') + '</small>'
        : '',
    text4 = normalizeText(generated['kind'])['toLowerCase'](),
    value10 = text4 === 'scene' ? '场景' : text4 === 'audio' ? '音频' : '人物',
    deleteControlHtml =
      selected?.['allowDeleteAssetCard'] &&
      !generated['isLibraryAsset'] &&
      !(selected['assetSelectionMode'] && selected['selectedAssetIds']?.['length'] > 1)
        ? renderWorkspaceCardDeleteControl({
            className: 'story-asset-card-delete-trigger',
            ariaLabel: '删除' + value10 + ' ' + generated['name'],
            actionAttributes: {
              'data-story-action': 'delete-asset-card',
              'data-story-asset-delete-id': generated['id'],
            },
            disabled: disabled,
          })
        : '';
  return renderWorkspaceAssetCard({
    asset: generated,
    appearances: appearances,
    previewAppearance: previewAppearance2,
    stats: stats,
    selected:
      selected?.['assetSelectionStyle'] === 'border'
        ? selected?.['selectedAssetIds']?.['includes']?.(generated['id']) === true
        : generated['id'] === selected?.['selectedAssetId'],
    showSelectionIndicator: false,
    selectionMode: selected?.['assetSelectionMode'] === true,
    checked: selected?.['selectedAssetIds']?.['includes']?.(generated['id']) === true,
    loading: disabled,
    draggable: draggable,
    promptPreview: previewAppearance2?.['prompt'] || generated?.['prompt'] || '',
    statusText: statusText,
    cardStatusHtml: cardStatusHtml,
    cardClassName: cardClassName,
    cardAttributes: cardAttributes,
    shellClassName:
      '' +
      shellClassName +
      (!generated['isLibraryAsset'] &&
      text4 === 'character' &&
      cardClassName['includes']('workspace-portrait-card')
        ? ' workspace-card-with-image-actions'
        : ''),
    preserveShell:
      preserveShell || (selected?.['allowDeleteAssetCard'] === true && !generated['isLibraryAsset']),
    accessoryHtml:
      accessoryHtml +
      (!generated['isLibraryAsset'] &&
      text4 === 'character' &&
      cardClassName['includes']('workspace-portrait-card')
        ? renderWorkspaceCardImageActions({
            uploadAttributes: {
              'data-story-action': 'upload-asset',
              'data-story-card-appearance-id': generated['id'],
            },
            generateAttributes: {
              'data-story-action': 'generate-asset',
              'data-story-card-appearance-id': generated['id'],
            },
            disabled: disabled,
          })
        : ''),
    cardMetaHtml: cardMetaHtml,
    headingAccessoryHtml: headingAccessoryHtml,
    cardMediaHtml: cardMediaHtml,
    fallbackImageUrl: fallbackImageUrl,
    workspaceAssetLibraryImage: workspaceAssetLibraryImage,
    nameAttributes: nameAttributes,
    roleHtml: roleHtml,
    deleteControlHtml: deleteControlHtml,
  });
}
function renderAudioArtwork({ compact: compact = false } = {}) {
  return (
    '<span class="' +
    (compact ? 'story-asset-card-image ' : '') +
    'person-replacement-audio-artwork' +
    (compact ? ' is-compact' : '') +
    '" role="img" aria-label="音频素材">\n    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 10v4M8.5 7.5v9M12 4v16M15.5 8.5v7M19 10v4"/></svg>\n    <span>' +
    (compact ? '音频' : '声音素材') +
    '</span>\n  </span>'
  );
}
function getCharacterPreview(error2 = {}) {
  const workspaceAssetBaseAppearance =
    getWorkspaceAssetBaseAppearance(error2) ||
    getWorkspaceAssetAppearances(error2)['find']((value11) => normalizeText(value11?.['imageUrl']));
  return {
    imageUrl: normalizeText(workspaceAssetBaseAppearance?.['imageUrl']),
    name: normalizeText(error2['name']) || '未命名人设',
  };
}
function getAudioAssetDisplayName(options9 = {}) {
  return getPersonReplacementAudioSavedName(options9);
}
export function renderPersonReplacementAudioAssetCard(
  value12,
  args,
  { boundCharacters: boundCharacters = [], showVoiceLibraryConfirm: showVoiceLibraryConfirm = false } = {},
) {
  const value13 = Array['isArray'](boundCharacters) ? boundCharacters['length'] : 0,
    name = getAudioAssetDisplayName(args),
    accessoryHtml2 = showVoiceLibraryConfirm
      ? '<button type="button" class="story-primary-button person-replacement-audio-card-add-voice" data-person-replacement-action="confirm-character-voice-library" data-person-replacement-audio-asset-id="' +
        escapeHtml(args['id']) +
        '" aria-label="添加声音：' +
        escapeHtml(name) +
        '">添加声音</button>'
      : '';
  return renderPersonReplacementAssetCard(
    value12,
    { ...args, name: name, prompt: '' },
    {
      cardClassName: 'person-replacement-audio-asset-card',
      cardAttributes: 'data-person-replacement-audio-library-asset="true"',
      shellClassName: showVoiceLibraryConfirm ? 'person-replacement-audio-asset-shell' : '',
      accessoryHtml: accessoryHtml2,
      cardMediaHtml: renderAudioArtwork({ compact: true }),
      cardStatusHtml: '<span>' + (value13 ? '已绑定 ' + value13 + ' 个人设' : '未绑定人设') + '</span>',
    },
  );
}
export function renderPersonReplacementAudioAssetDetail(
  waveformUrl,
  {
    boundCharacters: boundCharacters = [],
    characters: characters = [],
    isLibrary: isLibrary = false,
    selectedCharacterId: selectedCharacterId = '',
  } = {},
) {
  if (!waveformUrl)
    return '<aside class="story-asset-detail story-empty-panel"><strong>暂无音频素材</strong><p>请从总素材加入或上传音频。</p></aside>';
  return renderWorkspaceAudioAssetDetail({
    name: getAudioAssetDisplayName(waveformUrl),
    audioUrl: getPersonReplacementLibraryAudioRef(waveformUrl),
    waveformUrl: waveformUrl['waveformLocalPath'] || waveformUrl['waveformUrl'],
    characters: characters,
    selectedCharacterId: selectedCharacterId,
    boundNames: boundCharacters['map']((error3) => error3['name']),
    isLibrary: isLibrary,
    className: 'person-replacement-audio-detail',
    detailAttributes: 'data-workspace-audio-asset-id="' + escapeHtml(waveformUrl['id']) + '"',
    playerClassName: 'person-replacement-audio-playback',
    selectAttributes: 'data-person-replacement-audio-character',
    bindAttributes: 'data-person-replacement-action="bind-project-audio"',
    membershipAttributes:
      'data-person-replacement-action="' +
      (isLibrary ? 'add-project-audio' : 'remove-project-audio') +
      '"',
  });
}
export function renderPersonReplacementAssetDetail(
  modelId,
  asset2,
  {
    showEmptyDescription: showEmptyDescription = true,
    readOnly: readOnly = false,
    voiceLibrarySelection: voiceLibrarySelection = null,
    detailSplitRatio: detailSplitRatio = 50,
    detailSplitterHtml: detailSplitterHtml = '',
  } = {},
) {
  if (!asset2) {
    const value14 = modelId?.['assetFilter'] === 'library' ? '总素材中还没有可引用的图片或音频。' : '';
    return (
      '<aside class="story-asset-detail story-empty-panel">\n      <strong>暂无可用素材</strong>\n      ' +
      (showEmptyDescription && value14 ? '<p>' + value14 + '</p>' : '') +
      '\n    </aside>'
    );
  }
  const list6 = asset2['isLibraryAsset'] ? [asset2] : getWorkspaceAssetAppearances(asset2),
    selectedAppearanceIndex = getSelectedAppearanceIndex(modelId, asset2),
    appearance2 = getSelectedAppearance(modelId, asset2) || asset2,
    enabled5 = !asset2['isLibraryAsset'] && !readOnly && list6['length'] > 1,
    value15 = asset2['kind'] === 'character' && !asset2['isLibraryAsset'] && !readOnly,
    workspaceAssetBaseAppearance2 = getWorkspaceAssetBaseAppearance(asset2),
    enabled6 =
      value15 &&
      (list6['length'] === 1
        ? list6[0]?.['id'] === appearance2?.['id']
        : workspaceAssetBaseAppearance2?.['id'] === appearance2?.['id']),
    generating2 = isAppearanceGenerating(modelId, asset2, appearance2),
    canDeleteAppearance2 = Boolean(modelId?.['allowDeleteAssetAppearance'] && enabled5 && !enabled6),
    text5 = normalizeText(appearance2?.['imageUrl']),
    value16 = text5
      ? '<img class="story-asset-preview" src="' +
        escapeHtml(text5) +
        '" alt="' +
        escapeHtml(asset2['name'] + ' · ' + (appearance2['name'] || '形象')) +
        '" loading="lazy" decoding="async">'
      : '<div class="story-asset-preview story-media-empty" role="img" aria-label="' +
        escapeHtml(asset2['name'] + '待生成') +
        '"><span>待生成</span></div>',
    value17 =
      modelId?.['allowAssetRename'] === true && !asset2['isLibraryAsset']
        ? ' data-story-asset-name-id="' +
          escapeHtml(asset2['id']) +
          '" aria-label="重命名' +
          escapeHtml(asset2['name']) +
          '"'
        : '',
    text6 = normalizeText(appearance2?.['occurrences'] || asset2?.['occurrences']) || '当前项目',
    waveformUrl2 = voiceLibrarySelection?.['audioAsset'] || null,
    audioUrl = waveformUrl2 ? getPersonReplacementLibraryAudioRef(waveformUrl2) : '',
    value18 = Boolean(voiceLibrarySelection),
    value19 = value18
      ? '<div class="story-asset-prompt-field person-replacement-voice-library-playback-field">\n        ' +
        (audioUrl
          ? renderAudioPlaybackSurface({
              audioUrl: audioUrl,
              waveformUrl: waveformUrl2?.['waveformLocalPath'] || waveformUrl2?.['waveformUrl'],
              className: 'person-replacement-voice-library-playback has-reference',
              playLabel: '播放' + (waveformUrl2?.['name'] || '所选声音'),
              pauseLabel: '暂停' + (waveformUrl2?.['name'] || '所选声音'),
            })
          : '<div class="person-replacement-voice-library-playback-empty">请从左侧选择声音</div>') +
        '\n      </div>'
      : '<div class="story-asset-prompt-field">\n        <div class="story-asset-prompt-editor" data-story-asset-prompt data-story-asset-prompt-asset-id="' +
        escapeHtml(asset2['id']) +
        '" data-story-asset-prompt-appearance-id="' +
        escapeHtml(appearance2['id']) +
        '" contenteditable="' +
        (asset2['isLibraryAsset'] || readOnly ? 'false' : 'true') +
        '" role="textbox" aria-multiline="true" aria-label="形象提示词" spellcheck="false">' +
        renderPromptText(
          asset2['isLibraryAsset'] || readOnly
            ? asset2['description'] || appearance2['prompt'] || ''
            : appearance2['prompt'] || '',
        ) +
        '</div>\n      </div>',
    value20 =
      asset2['isLibraryAsset'] || readOnly
        ? ''
        : value18
          ? '<div class="story-asset-generation-bar prompt-panel-footer person-replacement-voice-library-confirm-bar">\n          <div class="story-asset-generation-actions">\n            <button type="button" class="story-asset-generate-button story-primary-button" data-person-replacement-action="confirm-character-voice-library" ' +
            (audioUrl ? '' : 'disabled') +
            '><span>确认</span></button>\n          </div>\n        </div>'
          : '<div class="story-asset-generation-bar prompt-panel-footer">\n          ' +
            renderAIGenImageModelSelectorMarkup({
              modelId: modelId?.['models']?.['image'],
              provider: modelId?.['imageProvider'],
              generationParams: modelId?.['imageGenerationParams'],
              providerProfileId: modelId?.['imageProviderProfileId'],
              providerProfileIdByModel: modelId?.['imageProviderProfileIdByModel'],
              showSchemaControls: true,
              className: 'story-asset-image-model-selector',
            }) +
            '\n          <div class="story-asset-generation-actions">\n            ' +
            renderPromptPresetPicker(modelId, asset2['kind']) +
            '\n            ' +
            renderRequestDebugButton('data-story-action="debug-generation-asset"') +
            '<button type="button" class="story-asset-generate-button story-primary-button" data-story-action="generate-asset" ' +
            (generating2 ? 'disabled' : '') +
            '><span>' +
            (generating2 ? '生成中' : escapeHtml(modelId?.['assetGenerateLabel'] || '生成素材图')) +
            '</span></button>\n          </div>\n        </div>',
    value21 =
      '<div class="story-asset-preview-caption person-replacement-asset-detail-caption">\n    <div class="story-asset-caption-heading">\n      <span class="story-asset-caption-title"><strong' +
      value17 +
      '>' +
      escapeHtml(asset2['name'] || '未命名素材') +
      '</strong>' +
      renderPersonReplacementVoicePreviewPlayer(asset2) +
      '</span>\n      <span class="story-asset-caption-tags">\n        ' +
      (value15
        ? '<button type="button" class="story-base-appearance-button ' +
          (enabled6 ? 'is-active' : '') +
          '" ' +
          (enabled5 ? 'data-story-action="set-base-appearance"' : 'disabled') +
          ' aria-pressed="' +
          enabled6 +
          '" aria-disabled="' +
          !enabled5 +
          '" title="会以基础形象作为参考，生成角色的其他形象">' +
          (enabled6 ? '基础形象' : '设为基础形象') +
          '</button>'
        : '') +
      '\n        ' +
      renderVoiceCapsule(asset2, modelId?.['assetVoiceUploadLabel'] || '添加声音') +
      '\n      </span>\n    </div>\n    <span data-story-asset-caption-meta>' +
      escapeHtml(appearance2['name'] || asset2['role'] || '素材') +
      ' · ' +
      escapeHtml(text6) +
      (enabled5 ? ' · ' + (selectedAppearanceIndex + 1) + '/' + list6['length'] : '') +
      '</span>\n  </div>',
    value22 = Math['min'](0x44, Math['max'](32, Number(detailSplitRatio) || 50));
  return (
    '<aside class="story-asset-detail person-replacement-asset-detail-layout' +
    (value18 ? ' person-replacement-voice-library-character-detail' : '') +
    '" data-person-replacement-asset-detail-layout style="--person-replacement-asset-detail-top:' +
    value22 +
    '%;"' +
    (value18 ? ' data-person-replacement-voice-library-character-detail' : '') +
    '>\n    <div class="story-asset-preview-wrap" data-story-appearance-wheel="' +
    enabled5 +
    '" ' +
    (enabled5 ? 'tabindex="0" aria-label="滚动鼠标滚轮或按左右方向键切换形象"' : '') +
    '>\n      <div class="story-asset-preview-slide ' +
    (generating2 ? 'img-preview-loading' : '') +
    '" aria-busy="' +
    generating2 +
    '">\n        ' +
    value16 +
    '\n        ' +
    (generating2 ? renderWorkspaceAssetLoadingOverlay() : '') +
    '\n      </div>\n      ' +
    renderPreviewActions({
      state: modelId,
      asset: asset2,
      appearance: appearance2,
      readOnly: readOnly,
      generating: generating2,
      canDeleteAppearance: canDeleteAppearance2,
    }) +
    '\n      ' +
    (enabled5
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
    value21 +
    '\n          ' +
    value19 +
    '\n          ' +
    value20 +
    '\n        </div>\n      </div>\n    </div>\n  </aside>'
  );
}
export function renderPersonReplacementBatchGenerationControl(options10 = {}) {
  const enabled7 = Array['isArray'](options10?.['selectedAssetIds'])
      ? options10['selectedAssetIds']['length']
      : 0,
    value23 = options10?.['isBatchGenerating'] === true,
    value24 = options10?.['batchCancelRequested'] === true,
    value25 = value23 ? value24 : !enabled7,
    value26 = enabled7 ? ' (' + enabled7 + ')' : '',
    text7 = normalizeText(options10?.['batchGenerationActionLabel']) || '批量生成',
    value27 = value23 ? '' + (value24 ? '正在停止' : '取消运行') + value26 : '' + text7 + value26,
    value28 = ['scene', 'prop']['includes'](normalizeText(options10?.['assetFilter'])) ? 'image' : '',
    value29 = value23
      ? normalizeText(options10['batchCancelAction']) || 'cancel-asset-batch-generation'
      : 'batch-generate-assets';
  return (
    '<button type="button" class="story-primary-button story-asset-batch-trigger" data-story-action="' +
    escapeHtml(value29) +
    '"' +
    (value28 ? ' data-story-asset-batch-direct-mode="' + value28 + '"' : '') +
    ' aria-busy="' +
    value23 +
    '" ' +
    (value25 ? 'disabled' : '') +
    '><span class="story-asset-batch-trigger-label">' +
    escapeHtml(value27) +
    '</span></button>'
  );
}
export function renderPersonReplacementPreviewArrow(value30, args2 = {}) {
  return renderWorkspacePreviewArrow(value30, {
    ...args2,
    actionAttributes: normalizeText(args2?.['action']) ? { 'data-story-action': args2['action'] } : {},
  });
}
export function syncPersonReplacementVoicePreviewUi(
  el2,
  { audioEl: audioEl = null, assetId: assetId = '' } = {},
) {
  const count2 = Number(audioEl?.['duration']),
    value31 = Number(audioEl?.['currentTime']),
    value32 =
      Number['isFinite'](count2) && count2 > 0 ? Math['max'](0, Math['min'](1, value31 / count2)) : 0,
    value33 = Boolean(audioEl && audioEl['paused'] === false && audioEl['ended'] !== true);
  return (
    el2?.['querySelectorAll']?.('[data-story-character-voice-player]')?.['forEach']?.((el3) => {
      const text8 = normalizeText(el3['dataset']?.['storyCharacterVoicePlayer']) === normalizeText(assetId),
        el4 = el3['querySelector']?.("[data-story-action='play-character-voice']"),
        el5 = el3['querySelector']?.('[data-story-character-voice-waveform]');
      (el3['classList']?.['toggle']?.('is-active', text8),
        el3['classList']?.['toggle']?.('is-playing', text8 && value33),
        el4?.['setAttribute']?.('aria-label', text8 && value33 ? '暂停声音参考' : '播放声音参考'));
      if (el5) {
        ((el5['hidden'] = !text8),
          el5['setAttribute']?.('aria-hidden', String(!text8)),
          el5['style']?.['setProperty']?.('--story-character-voice-progress', '' + value32));
        const list7 = el5['querySelectorAll']?.('i') || [];
        list7['forEach']?.((el6, value34) => {
          el6['classList']?.['toggle']?.('is-played', text8 && value32 >= (value34 + 1) / list7['length']);
        });
      }
    }),
    true
  );
}
