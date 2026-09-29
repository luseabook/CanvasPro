import {
  getStoryAssetAppearance,
  getStoryAssetAppearanceStats,
  getStoryAssetAppearances,
  getStoryAssetBaseAppearance,
  isStoryAssetBaseAppearance,
} from './storyAssetAppearances.js';
import {
  getStoryAssetGenerationControlState,
  isStoryAssetCardLoading,
  isStoryAssetVoiceLoading,
} from './storyAssetGenerationState.js';
import { STORY_CHARACTER_ASSET_PROMPT_PREFIX } from './storyPlanningData.js';
import {
  STORY_CHARACTER_ASSET_PROMPT_PRESETS,
  STORY_SCENE_ASSET_PROMPT_PRESETS,
  getStoryCharacterAssetPromptPreset,
  getStorySceneAssetPromptPreset,
} from './storyAssetPromptPresets.js';
import { resolveStoryStyleSelection } from './storyStyleCatalog.js';
import {
  STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS,
  getStoryCharacterVoiceWorkflow,
  getStoryCharacterVoiceWorkflowItems,
  hasStoryCharacterVoiceReference,
  normalizeStoryCharacterVoiceHistory,
  normalizeStoryCharacterVoiceReference,
} from './storyCharacterVoice.js';
function normalizeText(_0xb6aa01) {
  return String(_0xb6aa01 ?? '')['trim']();
}
function freezeSnapshot(_0x1ba346) {
  if (Array['isArray'](_0x1ba346))
    return Object['freeze'](_0x1ba346['map']((_0x6a3fd) => freezeSnapshot(_0x6a3fd)));
  if (
    _0x1ba346 &&
    typeof _0x1ba346 === 'object' &&
    (Object['getPrototypeOf'](_0x1ba346) === Object['prototype'] ||
      Object['getPrototypeOf'](_0x1ba346) === null)
  )
    return Object['freeze'](
      Object['fromEntries'](
        Object['entries'](_0x1ba346)['map'](([_0x2a1d5d, _0x258123]) => [
          _0x2a1d5d,
          freezeSnapshot(_0x258123),
        ]),
      ),
    );
  return _0x1ba346;
}
export function shouldRenderStoryAssetRoleTag(_0x534cbe = '') {
  return !['scene', 'prop']['includes'](normalizeText(_0x534cbe));
}
export function getStoryAssetBatchDirectMode(_0x59501d = '') {
  return ['scene', 'prop']['includes'](normalizeText(_0x59501d)) ? 'image' : '';
}
export function formatStoryAssetOccurrences(_0x3c013a = '') {
  const _0x3cc791 = normalizeText(_0x3c013a);
  if (!_0x3cc791) return '当前项目';
  const _0x32a07c = _0x3cc791['split'](/[、,，]/u)
      ['map']((_0x3bed86) => _0x3bed86['trim']())
      ['filter'](Boolean),
    _0x1efe19 = _0x32a07c['map']((_0x3bc47a) => {
      const _0xa62b8e = /(?:^|[-_])episode-(\d+)$/iu['exec'](_0x3bc47a);
      return _0xa62b8e ? String(Math['max'](0x1, Number(_0xa62b8e[0x1]) || 0x1)) : '';
    });
  if (_0x32a07c['length'] && _0x1efe19['every'](Boolean)) {
    const _0x330efe = [...new Set(_0x1efe19['map'](Number))]['sort'](
      (_0x28fd16, _0x5c671a) => _0x28fd16 - _0x5c671a,
    );
    return '第\x20' + _0x330efe['join']('、') + '\x20集';
  }
  return _0x32a07c['map']((_0x7b63bf, _0x1a4c10) =>
    _0x1efe19[_0x1a4c10] ? '第\x20' + _0x1efe19[_0x1a4c10] + '\x20集' : _0x7b63bf,
  )['join']('、');
}
export function getSelectedAppearanceIndex(_0x26894c, _0xe95f54) {
  const _0x5d3c0f = Number(_0x26894c['assetAppearanceIndexes']?.[_0xe95f54?.['id']]),
    _0x320a0e = Math['max'](0x0, getStoryAssetAppearances(_0xe95f54)['length'] - 0x1);
  return Math['max'](
    0x0,
    Math['min'](_0x320a0e, Number['isFinite'](_0x5d3c0f) ? Math['trunc'](_0x5d3c0f) : 0x0),
  );
}
function getSelectedAppearance(_0x303db4, _0x3b2faa) {
  return _0x3b2faa?.['isLibraryAsset']
    ? _0x3b2faa
    : getStoryAssetAppearance(_0x3b2faa, getSelectedAppearanceIndex(_0x303db4, _0x3b2faa));
}
function getAppearanceActionKey(_0xb6d191 = {}, _0x5e387e = {}) {
  const _0xcfe53f = normalizeText(_0xb6d191?.['id']),
    _0x30651e = normalizeText(_0x5e387e?.['id']);
  return _0xcfe53f && _0x30651e ? _0xcfe53f + ':' + _0x30651e : '';
}
function isAddedAppearance(_0x4618b4 = {}) {
  return ['library', 'upload']['includes'](normalizeText(_0x4618b4?.['sourceOrigin']));
}
function getCardPromptPreview(_0x5ea9f7 = {}, _0x362fe8 = {}, _0x3ac548 = {}) {
  let _0x1be252 = normalizeText(_0x3ac548?.['prompt'] || _0x362fe8?.['prompt']);
  if (_0x362fe8?.['kind'] !== 'character' || !_0x1be252) return _0x1be252;
  const _0x162eb8 = _0x5ea9f7?.['data']?.['project'] || {},
    _0x3e6c7b = resolveStoryStyleSelection({
      styleId: _0x162eb8['videoStyleId'],
      stylePrompt: _0x162eb8['videoStylePrompt'],
      videoStyle: _0x162eb8['videoStyle'],
    })['stylePrompt'];
  return (
    [STORY_CHARACTER_ASSET_PROMPT_PREFIX, _0x3e6c7b, '正面全身人物设定图']
      ['filter'](Boolean)
      ['forEach']((_0x392e1b) => {
        _0x1be252 = _0x1be252['split'](_0x392e1b)['join']('');
      }),
    _0x1be252['split'](/\r?\n/u)
      ['map']((_0x303878) =>
        _0x303878['trim']()
          ['replace'](/(?:\s*[，,]){2,}/gu, '，')
          ['replace'](/^[\s，,。；;:：|/·-]+|[\s，,。；;:：|/·-]+$/gu, ''),
      )
      ['filter'](Boolean)
      ['join']('\x0a')
  );
}
function formatVoiceHistoryTime(_0x3c7d9c) {
  const _0x4917e5 = new Date(Number(_0x3c7d9c));
  if (!Number['isFinite'](_0x4917e5['getTime']())) return '历史版本';
  const _0x2d40ca = (_0xcdbb58) => String(_0xcdbb58)['padStart'](0x2, '0');
  return (
    _0x4917e5['getFullYear']() +
    '/' +
    _0x2d40ca(_0x4917e5['getMonth']() + 0x1) +
    '/' +
    _0x2d40ca(_0x4917e5['getDate']()) +
    '\x20' +
    _0x2d40ca(_0x4917e5['getHours']()) +
    ':' +
    _0x2d40ca(_0x4917e5['getMinutes']())
  );
}
function projectPreset(_0x3a3981, _0x261035, _0x56c7ee, _0x21a1ae) {
  if (!['character', 'scene']['includes'](_0x261035)) return { visible: ![] };
  const _0xc3991a = _0x261035 === 'scene',
    _0x22e09f =
      !_0xc3991a &&
      Array['isArray'](_0x3a3981['assetPromptPresets']) &&
      _0x3a3981['assetPromptPresets']['length']
        ? _0x3a3981['assetPromptPresets']
        : null,
    _0x442d28 = _0xc3991a
      ? STORY_SCENE_ASSET_PROMPT_PRESETS
      : _0x22e09f || STORY_CHARACTER_ASSET_PROMPT_PRESETS,
    _0x2a2a51 = _0xc3991a
      ? getStorySceneAssetPromptPreset(_0x3a3981['sceneAssetPromptPresetId'])
      : _0x22e09f?.['find']((_0x31a4f2) => _0x31a4f2['id'] === _0x3a3981['assetPromptPresetId']) ||
        _0x22e09f?.[0x0] ||
        getStoryCharacterAssetPromptPreset(_0x3a3981['assetPromptPresetId']),
    _0x5ebf48 =
      _0x56c7ee && _0x21a1ae
        ? getStoryAssetGenerationControlState(_0x3a3981, _0x56c7ee['id'], _0x21a1ae['id'])
        : { disabled: _0x3a3981['isBatchGenerating'] === !![] };
  return {
    visible: !![],
    assetKind: _0x261035,
    label: _0xc3991a ? '场景图片预设' : normalizeText(_0x3a3981['assetPromptPresetLabel']) || '角色图片预设',
    selectedId: _0x2a2a51?.['id'] || '',
    selectedLabel: _0x2a2a51?.['label'] || '',
    disabled: Boolean(_0x5ebf48['disabled']),
    options: _0x442d28['map']((_0x53ea39) => ({
      id: _0x53ea39['id'],
      label: _0x53ea39['label'],
      description: _0x53ea39['description'],
    })),
  };
}
function projectLibrarySyncState(_0x55549f, _0x3bef9c) {
  const _0x5583e2 =
      _0x55549f?.['totalAssetRef'] && typeof _0x55549f['totalAssetRef'] === 'object'
        ? _0x55549f['totalAssetRef']
        : null,
    _0x22fdcb = normalizeText(_0x5583e2?.['assetId']),
    _0x5e2f41 = Math['max'](0x0, Math['trunc'](Number(_0x5583e2?.['itemIndex']) || 0x0));
  if (!_0x22fdcb) return { exists: ![], synced: ![] };
  const _0x56beaf = _0x3bef9c({ assetId: _0x22fdcb, itemIndex: _0x5e2f41 });
  if (!_0x56beaf) return { exists: ![], synced: ![] };
  const _0x110634 = normalizeText(_0x5583e2?.['itemKey']),
    _0x59f999 = normalizeText(_0x56beaf?.['nodeData']?.['assetPackageItemKey']),
    _0x2b3937 = !_0x110634 || !_0x59f999 || _0x110634 === _0x59f999,
    _0x9b32b9 = normalizeText(_0x55549f?.['imageUrl']),
    _0x3ae93d = normalizeText(
      _0x56beaf?.['url'] || _0x56beaf?.['nodeData']?.['imageUrl'] || _0x56beaf?.['nodeData']?.['src'],
    );
  return { exists: _0x2b3937, synced: _0x2b3937 && Boolean(_0x9b32b9) && _0x9b32b9 === _0x3ae93d };
}
function projectPreviewActions(_0x37c9d8, _0x183300, _0x211158, _0x5a1588, _0x445d66, _0x4f08f0) {
  if (_0x183300['isLibraryAsset'] || _0x445d66)
    return {
      canDownload: Boolean(
        normalizeText(_0x211158?.['imageUrl']) &&
        normalizeText(_0x183300?.['mediaKind'])['toLowerCase']() !== 'video',
      ),
      showProjectActions: ![],
    };
  const _0xca3c66 = projectLibrarySyncState(_0x211158, _0x4f08f0),
    _0x250b3c = getAppearanceActionKey(_0x183300, _0x211158),
    _0x403480 = Boolean(
      _0x250b3c && normalizeText(_0x37c9d8['pendingDeleteAssetAppearanceKey']) === _0x250b3c,
    ),
    _0x1c198e = _0x37c9d8['data']?.['project']?.['sourceMode'] === 'video-replication',
    _0xdea0fb = _0x1c198e
      ? Boolean(normalizeText(_0x211158?.['imageUrl'])) ||
        (['character', 'scene', 'prop']['includes'](_0x183300['kind']) &&
          getStoryAssetAppearances(_0x183300)['length'] > 0x1)
      : isAddedAppearance(_0x211158) && getStoryAssetAppearances(_0x183300)['length'] > 0x1,
    _0x56781b =
      normalizeText(_0x37c9d8['exportingAssetAppearanceKey']) ===
      getAppearanceActionKey(_0x183300, _0x211158),
    _0x5b91d9 = Boolean(
      normalizeText(_0x211158?.['imageUrl']) &&
      !_0x5a1588['disabled'] &&
      !_0x56781b &&
      !_0xca3c66['synced'] &&
      !_0x403480,
    );
  return {
    canDownload: Boolean(
      normalizeText(_0x211158?.['imageUrl']) &&
      normalizeText(_0x183300?.['mediaKind'])['toLowerCase']() !== 'video',
    ),
    showProjectActions: !![],
    saveToLibraryLabel: _0x56781b
      ? '正在加入总素材'
      : _0xca3c66['synced']
        ? '已加入总素材'
        : _0xca3c66['exists']
          ? '更新总素材'
          : '将当前形象加入总素材',
    canSaveToLibrary: _0x5b91d9,
    isSavingToLibrary: _0x56781b,
    canUpload: !_0x56781b && !_0x403480,
    showDeleteAppearance: _0xdea0fb,
    deleteAppearanceLabel: _0x1c198e && _0x183300['kind'] !== 'character' ? '删除当前图片' : '删除当前形象',
    canDeleteAppearance: Boolean(_0xdea0fb && !_0x5a1588['disabled'] && !_0x56781b && !_0x403480),
    isDeleteAppearanceConfirming: _0x403480,
    librarySynced: _0xca3c66['synced'],
  };
}
function projectVoicePanel(_0x59d2ae, _0x205b4e, _0x2a52bc) {
  const _0x516091 = _0x59d2ae['characterVoiceEditor'];
  if (
    !_0x516091?.['assetId'] ||
    _0x516091['assetId'] !== _0x205b4e?.['id'] ||
    _0x205b4e['kind'] !== 'character'
  )
    return { visible: ![] };
  const _0x8dd4f1 = normalizeStoryCharacterVoiceReference(_0x205b4e['voiceReference']),
    _0x245f50 = normalizeStoryCharacterVoiceHistory(_0x205b4e['voiceReferenceHistory'])['map'](
      (_0xca0c98) => ({
        ..._0xca0c98,
        label:
          _0xca0c98['modelLabel'] ||
          _0xca0c98['fileName'] ||
          (_0xca0c98['source'] === 'generated' ? 'AI\x20生成声音' : '上传声音'),
        timeLabel: formatVoiceHistoryTime(_0xca0c98['updatedAt']),
      }),
    ),
    _0x228a17 = isStoryAssetVoiceLoading(_0x59d2ae, _0x205b4e['id']);
  return {
    visible: !![],
    isActive: _0x2a52bc,
    isGenerating: _0x228a17,
    reference: _0x8dd4f1,
    history: _0x245f50,
    sampleText: _0x516091['sampleText'] || '',
    voiceDescription: _0x516091['voiceDescription'] || '',
    error: _0x516091['error'] || '',
    sampleMaxCharacters: STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS,
    footer: {
      workflow: getStoryCharacterVoiceWorkflow(_0x516091['nodeData']?.['model']),
      nodeData: _0x516091['nodeData'],
      workflowItems: getStoryCharacterVoiceWorkflowItems(),
    },
  };
}
export function createStoryAssetSettingsProjection({
  resolveLibraryReference: resolveLibraryReference = () => null,
} = {}) {
  function _0x23e097(_0x180efa = {}, _0x1a6ff2 = {}, _0x1c45b3 = {}) {
    const _0x103cbb = _0x1a6ff2['isLibraryAsset'] ? [_0x1a6ff2] : getStoryAssetAppearances(_0x1a6ff2),
      _0x4ceee8 = _0x1a6ff2['isLibraryAsset']
        ? {
            total: 0x1,
            generated: _0x1a6ff2['imageUrl'] ? 0x1 : 0x0,
            failed: 0x0,
            pending: _0x1a6ff2['imageUrl'] ? 0x0 : 0x1,
          }
        : getStoryAssetAppearanceStats(_0x1a6ff2),
      _0x42eff6 =
        _0x1c45b3['previewAppearance'] ||
        (!_0x1a6ff2['isLibraryAsset'] && getSelectedAppearance(_0x180efa, _0x1a6ff2)) ||
        getStoryAssetBaseAppearance(_0x1a6ff2) ||
        _0x103cbb['find']((_0x56c5f6) => normalizeText(_0x56c5f6['imageUrl'])) ||
        _0x103cbb[0x0] ||
        _0x1a6ff2,
      _0x1540da = Array['isArray'](_0x180efa['selectedAssetIds']) ? _0x180efa['selectedAssetIds'] : [],
      _0x4089ff = _0x180efa['assetSelectionMode'] === !![],
      _0x157dbb = _0x4089ff && _0x1540da['length'] > 0x1,
      _0x7dbcd = _0x1540da['includes'](_0x1a6ff2['id']),
      _0x188b72 = isStoryAssetCardLoading(_0x180efa, _0x1a6ff2['id']),
      _0x410cc0 =
        !_0x1a6ff2['isLibraryAsset'] &&
        ['character', 'scene', 'prop']['includes'](_0x1a6ff2['kind']) &&
        _0x180efa['data']?.['project']?.['sourceMode'] === 'video-replication',
      _0x217161 = projectPreviewActions(
        _0x180efa,
        _0x1a6ff2,
        _0x42eff6,
        getStoryAssetGenerationControlState(_0x180efa, _0x1a6ff2['id'], _0x42eff6['id']),
        _0x1a6ff2['isLibraryAsset'] === !![],
        resolveLibraryReference,
      );
    return {
      id: _0x1a6ff2['id'],
      name: normalizeText(_0x1a6ff2['name']) || '未命名素材',
      role: _0x1a6ff2['role'] || '素材',
      kind: _0x1a6ff2['kind'],
      appearanceCount: _0x103cbb['length'],
      showCardVoiceStatus: !_0x1a6ff2['isLibraryAsset'] && !_0x410cc0 && _0x1a6ff2['kind'] === 'character',
      hasCardVoiceReference: hasStoryCharacterVoiceReference(_0x1a6ff2),
      showCardUpload: _0x410cc0,
      showCardImageActions: !_0x410cc0 && !_0x1a6ff2['isLibraryAsset'] && _0x1a6ff2['kind'] === 'character',
      canNavigateAppearances: !_0x1a6ff2['isLibraryAsset'] && _0x103cbb['length'] > 0x1,
      showAppearanceDelete:
        !_0x1a6ff2['isLibraryAsset'] &&
        !_0x157dbb &&
        _0x217161['showDeleteAppearance'] &&
        (!_0x410cc0 || Boolean(normalizeText(_0x42eff6?.['imageUrl']))),
      canDeleteAppearance: _0x217161['canDeleteAppearance'],
      preview: _0x42eff6,
      promptPreview: getCardPromptPreview(_0x180efa, _0x1a6ff2, _0x42eff6),
      stats: _0x4ceee8,
      statusText:
        _0x1c45b3['statusText'] ||
        (_0x410cc0
          ? _0x4ceee8['generated'] + ' / ' + _0x4ceee8['total']
          : !_0x1a6ff2['isLibraryAsset'] && ['character', 'scene', 'prop']['includes'](_0x1a6ff2['kind'])
            ? getSelectedAppearanceIndex(_0x180efa, _0x1a6ff2) + 0x1 + ' / ' + _0x103cbb['length']
            : ''),
      cardStatusHtml: _0x1c45b3['cardStatusHtml'] || '',
      isCurrent: _0x7dbcd,
      isChecked: _0x1540da['includes'](_0x1a6ff2['id']),
      isSelectionMode: _0x4089ff,
      isLoading: _0x188b72,
      showRoleTag: _0x180efa['hideAssetRoleTag'] !== !![] && shouldRenderStoryAssetRoleTag(_0x1a6ff2['kind']),
      canRename: _0x180efa['allowAssetRename'] === !![] && !_0x1a6ff2['isLibraryAsset'],
      canDelete: Boolean(_0x180efa['allowDeleteAssetCard'] && !_0x1a6ff2['isLibraryAsset'] && !_0x157dbb),
      draggable: _0x1c45b3['draggable'] === !![],
      cardClassName: [
        _0x1c45b3['cardClassName'],
        !_0x1a6ff2['isLibraryAsset'] && ['character', 'scene', 'prop']['includes'](_0x1a6ff2['kind'])
          ? 'workspace-portrait-card'
          : '',
        _0x410cc0 ? 'story-replication-character-card' : '',
        _0x410cc0 ? 'story-replication-portrait-card' : '',
      ]
        ['filter'](Boolean)
        ['join']('\x20'),
      cardAttributes: _0x1c45b3['cardAttributes'] || '',
      shellClassName: _0x1c45b3['shellClassName'] || '',
      accessoryHtml: _0x1c45b3['accessoryHtml'] || '',
      cardMetaHtml: _0x1c45b3['cardMetaHtml'] || '',
      cardMediaHtml: _0x1c45b3['cardMediaHtml'] || '',
      fallbackImageUrl: _0x1c45b3['fallbackImageUrl'] || '',
      workspaceAssetLibraryImage: _0x1c45b3['workspaceAssetLibraryImage'] === !![],
    };
  }
  function _0x45051f(_0xed7ff8, _0x3bfc5a = {}) {
    if (_0xed7ff8 === 'batch-generation') {
      const _0x4a4b5c = _0x3bfc5a['state'] || _0x3bfc5a,
        _0x359a3f = Array['isArray'](_0x4a4b5c['selectedAssetIds'])
          ? _0x4a4b5c['selectedAssetIds']['length']
          : 0x0,
        _0x2fb061 = _0x4a4b5c['isBatchGenerating'] === !![],
        _0xe5f535 = _0x4a4b5c['assetBatchCancelRequested'] === !![];
      return {
        selectedCount: _0x359a3f,
        action: _0x2fb061 ? 'cancel-asset-batch-generation' : 'batch-generate-assets',
        isCancellation: _0x2fb061,
        busy: ![],
        cancelRequested: _0xe5f535,
        disabled: _0x2fb061 ? _0xe5f535 : !_0x359a3f,
        label: _0x2fb061
          ? '' +
            (_0xe5f535 ? '已取消后续生成' : '取消后续生成') +
            (_0x359a3f ? '\x20(' + _0x359a3f + ')' : '')
          : '批量生成' + (_0x359a3f ? '\x20(' + _0x359a3f + ')' : ''),
        directMode: _0x2fb061 ? '' : getStoryAssetBatchDirectMode(_0x4a4b5c['assetFilter']),
      };
    }
    if (_0xed7ff8 === 'prompt-generation') {
      const _0x1ea879 = _0x3bfc5a['state'] || {},
        _0x53dd88 = _0x3bfc5a['generationControl'] || {},
        _0x280443 = Array['isArray'](_0x1ea879['selectedAssetIds'])
          ? _0x1ea879['selectedAssetIds']['length']
          : 0x0,
        _0x3756dd = _0x1ea879['assetSelectionMode'] === !![] && _0x280443 > 0x1,
        _0x401c6f = _0x3756dd && _0x1ea879['isBatchGenerating'] === !![],
        _0x426b45 = _0x1ea879['assetBatchCancelRequested'] === !![];
      return {
        isMultiSelection: _0x3756dd,
        selectedCount: _0x280443,
        action: _0x401c6f ? 'cancel-asset-batch-generation' : 'batch-generate-assets',
        isCancellation: _0x401c6f,
        busy: !_0x3756dd && _0x53dd88['isGenerating'] === !![],
        cancelRequested: _0x426b45,
        disabled: _0x3756dd ? _0x401c6f && _0x426b45 : Boolean(_0x53dd88['disabled']),
        label: _0x3756dd
          ? _0x401c6f
            ? (_0x426b45 ? '已取消后续生成' : '取消后续生成') + '\x20(' + _0x280443 + ')'
            : '批量生成\x20(' + _0x280443 + ')'
          : _0x53dd88['label'] || '生成素材图',
      };
    }
    if (_0xed7ff8 === 'library-selection') {
      const _0x5bfc6e = Math['max'](0x0, Math['trunc'](Number(_0x3bfc5a['selectedCount']) || 0x0)),
        _0x2011fe = Array['isArray'](_0x3bfc5a['projectAssets']) ? _0x3bfc5a['projectAssets'] : [];
      return {
        selectionMode: _0x3bfc5a['selectionMode'] === !![],
        selectedCount: _0x5bfc6e,
        allSelected: _0x3bfc5a['allSelected'] === !![],
        targetGroups: ['character', 'scene', 'prop']['map']((_0x15480e) => ({
          kind: _0x15480e,
          label: _0x3bfc5a['getTabLabel']?.(_0x15480e) || _0x15480e,
          targets: _0x2011fe['filter']((_0x4a2100) => normalizeText(_0x4a2100?.['kind']) === _0x15480e)[
            'map'
          ]((_0x5c29e3) => {
            const _0x1083e9 = getStoryAssetAppearances(_0x5c29e3);
            return {
              id: _0x5c29e3['id'],
              kind: _0x5c29e3['kind'],
              name: _0x5c29e3['name'],
              appearanceCount: _0x1083e9['length'],
              appearances: _0x1083e9['map']((_0x4fd9e6) => ({
                id: _0x4fd9e6['id'],
                name: _0x4fd9e6['name'],
                imageUrl: _0x4fd9e6['imageUrl'],
              })),
              preview:
                getStoryAssetBaseAppearance(_0x5c29e3) ||
                _0x1083e9['find']((_0x52618a) => normalizeText(_0x52618a?.['imageUrl'])) ||
                _0x1083e9[0x0] ||
                {},
            };
          }),
        })),
      };
    }
    if (_0xed7ff8 === 'preset') {
      const _0x383e20 = _0x3bfc5a['state'] || {},
        _0x331f56 =
          _0x3bfc5a['asset'] ||
          (Array['isArray'](_0x383e20['data']?.['assets'])
            ? _0x383e20['data']['assets']['find'](
                (_0x232d25) => _0x232d25['id'] === _0x383e20['selectedAssetId'],
              )
            : null);
      return projectPreset(
        _0x383e20,
        _0x3bfc5a['assetKind'],
        _0x331f56,
        _0x331f56 ? getSelectedAppearance(_0x383e20, _0x331f56) : null,
      );
    }
    if (_0xed7ff8 === 'preview-actions')
      return projectPreviewActions(
        _0x3bfc5a['state'] || {},
        _0x3bfc5a['asset'] || {},
        _0x3bfc5a['appearance'] || {},
        _0x3bfc5a['generationControl'] || {},
        _0x3bfc5a['readOnly'] === !![],
        resolveLibraryReference,
      );
    if (_0xed7ff8 === 'voice-capsule') {
      const _0x38587e = _0x3bfc5a['state'] || {},
        _0x31ea62 = _0x3bfc5a['asset'] || {};
      return {
        visible: _0x31ea62['kind'] === 'character' && !_0x31ea62['isLibraryAsset'],
        hasReference: hasStoryCharacterVoiceReference(_0x31ea62),
        isOpen: _0x3bfc5a['isOpen'] === !![],
        uploadLabel: normalizeText(_0x38587e['assetVoiceUploadLabel']),
      };
    }
    if (_0xed7ff8 === 'voice-player') {
      const _0x2aa510 = _0x3bfc5a['asset'] || {};
      return {
        visible:
          _0x2aa510['kind'] === 'character' &&
          !_0x2aa510['isLibraryAsset'] &&
          hasStoryCharacterVoiceReference(_0x2aa510),
        id: _0x2aa510['id'],
        name: _0x2aa510['name'],
      };
    }
    return {};
  }
  function _0x3950c4(
    _0x3aaa0c = {},
    _0x3d518b = null,
    { showEmptyDescription: showEmptyDescription = !![], readOnly: readOnly = ![] } = {},
  ) {
    if (!_0x3d518b)
      return {
        empty: !![],
        emptyDescription:
          _0x3aaa0c['assetFilter'] === 'library'
            ? '总素材中还没有可引用的图片或视频。'
            : '完成剧本分析后，角色、场景和道具会显示在这里。',
        showEmptyDescription: showEmptyDescription,
      };
    const _0x3af82b = _0x3d518b['isLibraryAsset'] ? [_0x3d518b] : getStoryAssetAppearances(_0x3d518b),
      _0x25afd1 = getSelectedAppearanceIndex(_0x3aaa0c, _0x3d518b),
      _0x373029 = getSelectedAppearance(_0x3aaa0c, _0x3d518b) || _0x3d518b,
      _0x45db6c = !_0x3d518b['isLibraryAsset'] && !readOnly && _0x3af82b['length'] > 0x1,
      _0x431b2a = _0x3d518b['kind'] === 'character' && !_0x3d518b['isLibraryAsset'] && !readOnly,
      _0x43521f = _0x431b2a && isStoryAssetBaseAppearance(_0x3d518b, _0x373029),
      _0xb9e806 = getStoryAssetGenerationControlState(_0x3aaa0c, _0x3d518b['id'], _0x373029['id']),
      _0x3c9f03 = _0x3aaa0c['characterVoiceEditor']?.['assetId'] === _0x3d518b['id'],
      _0x263749 = _0x3c9f03 && _0x3aaa0c['characterVoicePanelMotion'] !== 'to-asset',
      _0x792e38 =
        _0x3aaa0c['characterVoicePanelMotion'] === 'to-voice'
          ? 'is-flipping-to-voice'
          : _0x3aaa0c['characterVoicePanelMotion'] === 'to-asset'
            ? 'is-flipping-to-asset'
            : '',
      _0xd46a9f = Array['isArray'](_0x3aaa0c['data']?.['assets'])
        ? _0x3aaa0c['data']['assets']['find']((_0x3a7ccb) => _0x3a7ccb['id'] === _0x3aaa0c['selectedAssetId'])
        : _0x3d518b,
      _0x28dd69 = _0xd46a9f ? getSelectedAppearance(_0x3aaa0c, _0xd46a9f) : _0x373029;
    return {
      empty: ![],
      asset: {
        id: _0x3d518b['id'],
        name: normalizeText(_0x3d518b['name']) || '未命名素材',
        role: _0x3d518b['role'],
        kind: _0x3d518b['kind'],
        mediaKind: _0x3d518b['mediaKind'],
        isLibraryAsset: _0x3d518b['isLibraryAsset'] === !![],
        description: _0x3d518b['description'] || '',
      },
      appearance: _0x373029,
      appearanceIndex: _0x25afd1,
      appearanceCount: _0x3af82b['length'],
      hasMultipleAppearances: _0x45db6c,
      supportsBaseAppearance: _0x431b2a,
      showBaseAppearanceControl:
        _0x431b2a && _0x3aaa0c['data']?.['project']?.['sourceMode'] !== 'video-replication',
      isBaseAppearance: _0x43521f,
      canRename: _0x3aaa0c['allowAssetRename'] === !![] && !_0x3d518b['isLibraryAsset'],
      isBaseAppearanceSelectionDisabled: Boolean(isStoryAssetCardLoading(_0x3aaa0c, _0x3d518b['id'])),
      canSetBaseAppearance: _0x45db6c && !isStoryAssetCardLoading(_0x3aaa0c, _0x3d518b['id']),
      showStyleReference: _0x43521f && _0x3aaa0c['allowAssetStyleReference'] !== ![],
      styleReference: {
        referenceImageUrl: _0x373029['referenceImageUrl'],
        disabled: Boolean(_0xb9e806['disabled']),
      },
      voiceCapsule: {
        visible: _0x3d518b['kind'] === 'character' && !_0x3d518b['isLibraryAsset'],
        hasReference: hasStoryCharacterVoiceReference(_0x3d518b),
        isOpen: _0x263749,
        useSourceMenu: !![],
        uploadLabel: normalizeText(_0x3aaa0c['assetVoiceUploadLabel']),
      },
      voicePlayer: {
        visible:
          _0x3d518b['kind'] === 'character' &&
          !_0x3d518b['isLibraryAsset'] &&
          hasStoryCharacterVoiceReference(_0x3d518b),
      },
      previewActions: projectPreviewActions(
        _0x3aaa0c,
        _0x3d518b,
        _0x373029,
        _0xb9e806,
        readOnly,
        resolveLibraryReference,
      ),
      generationControl: _0xb9e806,
      promptControl: _0x45051f('prompt-generation', { state: _0x3aaa0c, generationControl: _0xb9e806 }),
      preset: projectPreset(_0x3aaa0c, _0x3d518b['kind'], _0xd46a9f, _0x28dd69),
      imageModel: {
        modelId: _0x3aaa0c['models']?.['image'],
        provider: _0x3aaa0c['imageProvider'],
        generationParams: _0x3aaa0c['imageGenerationParams'],
      },
      readOnly: readOnly,
      isGeneratingAppearance: Boolean(_0xb9e806['isGenerating']),
      motionClass: _0x3aaa0c['assetAppearanceMotion']
        ? 'is-sliding-' + _0x3aaa0c['assetAppearanceMotion']
        : '',
      panel: { isVoice: _0x263749, motionClass: _0x792e38, isAnimating: Boolean(_0x792e38) },
      voicePanel: projectVoicePanel(_0x3aaa0c, _0x3d518b, _0x263749),
      captionMeta:
        (_0x373029['name'] || _0x3d518b['role'] || '素材') +
        ' · ' +
        formatStoryAssetOccurrences(_0x373029['occurrences'] || _0x3d518b['occurrences'] || '当前项目') +
        (_0x45db6c ? ' · ' + (_0x25afd1 + 0x1) + '/' + _0x3af82b['length'] : ''),
    };
  }
  return Object['freeze']({
    projectAssetCard: (..._0x31b54f) => freezeSnapshot(_0x23e097(..._0x31b54f)),
    projectAssetControl: (..._0x1ab190) => freezeSnapshot(_0x45051f(..._0x1ab190)),
    projectAssetDetail: (..._0x5c0a14) => freezeSnapshot(_0x3950c4(..._0x5c0a14)),
  });
}
