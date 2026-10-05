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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function freezeSnapshot(list) {
  if (Array['isArray'](list)) return Object['freeze'](list['map']((item) => freezeSnapshot(item)));
  if (
    list &&
    typeof list === 'object' &&
    (Object['getPrototypeOf'](list) === Object['prototype'] || Object['getPrototypeOf'](list) === null)
  )
    return Object['freeze'](
      Object['fromEntries'](Object['entries'](list)['map'](([key, index]) => [key, freezeSnapshot(index)])),
    );
  return list;
}
export function shouldRenderStoryAssetRoleTag(result = '') {
  return !['scene', 'prop']['includes'](normalizeText(result));
}
export function getStoryAssetBatchDirectMode(data = '') {
  return ['scene', 'prop']['includes'](normalizeText(data)) ? 'image' : '';
}
export function formatStoryAssetOccurrences(options = '') {
  const text = normalizeText(options);
  if (!text) return '当前项目';
  const list2 = text['split'](/[、,，]/u)
      ['map']((target) => target['trim']())
      ['filter'](Boolean),
    list3 = list2['map']((source) => {
      const next = /(?:^|[-_])episode-(\d+)$/iu['exec'](source);
      return next ? String(Math['max'](1, Number(next[1]) || 1)) : '';
    });
  if (list2['length'] && list3['every'](Boolean)) {
    const list4 = [...new Set(list3['map'](Number))]['sort']((current, entry) => current - entry);
    return '第 ' + list4['join']('、') + ' 集';
  }
  return list2['map']((record, payload) => (list3[payload] ? '第 ' + list3[payload] + ' 集' : record))[
    'join'
  ]('、');
}
export function getSelectedAppearanceIndex(handle, state) {
  const config = Number(handle['assetAppearanceIndexes']?.[state?.['id']]),
    scope = Math['max'](0, getStoryAssetAppearances(state)['length'] - 1);
  return Math['max'](0, Math['min'](scope, Number['isFinite'](config) ? Math['trunc'](config) : 0));
}
function getSelectedAppearance(input, output) {
  return output?.['isLibraryAsset']
    ? output
    : getStoryAssetAppearance(output, getSelectedAppearanceIndex(input, output));
}
function getAppearanceActionKey(options2 = {}, value2 = {}) {
  const text2 = normalizeText(options2?.['id']),
    text3 = normalizeText(value2?.['id']);
  return text2 && text3 ? text2 + ':' + text3 : '';
}
function isAddedAppearance(options3 = {}) {
  return ['library', 'upload']['includes'](normalizeText(options3?.['sourceOrigin']));
}
function getCardPromptPreview(options4 = {}, value3 = {}, value4 = {}) {
  let text4 = normalizeText(value4?.['prompt'] || value3?.['prompt']);
  if (value3?.['kind'] !== 'character' || !text4) return text4;
  const styleId = options4?.['data']?.['project'] || {},
    storyStyleSelection = resolveStoryStyleSelection({
      styleId: styleId['videoStyleId'],
      stylePrompt: styleId['videoStylePrompt'],
      videoStyle: styleId['videoStyle'],
    })['stylePrompt'];
  return (
    [STORY_CHARACTER_ASSET_PROMPT_PREFIX, storyStyleSelection, '正面全身人物设定图']
      ['filter'](Boolean)
      ['forEach']((value5) => {
        text4 = text4['split'](value5)['join']('');
      }),
    text4['split'](/\r?\n/u)
      ['map']((value6) =>
        value6['trim']()
          ['replace'](/(?:\s*[，,]){2,}/gu, '，')
          ['replace'](/^[\s，,。；;:：|/·-]+|[\s，,。；;:：|/·-]+$/gu, ''),
      )
      ['filter'](Boolean)
      ['join']('\n')
  );
}
function formatVoiceHistoryTime(value7) {
  const value8 = new Date(Number(value7));
  if (!Number['isFinite'](value8['getTime']())) return '历史版本';
  const run = (value9) => String(value9)['padStart'](2, '0');
  return (
    value8['getFullYear']() +
    '/' +
    run(value8['getMonth']() + 1) +
    '/' +
    run(value8['getDate']()) +
    ' ' +
    run(value8['getHours']()) +
    ':' +
    run(value8['getMinutes']())
  );
}
function projectPreset(disabled, assetKind, value10, value11) {
  if (!['character', 'scene']['includes'](assetKind)) return { visible: false };
  const label = assetKind === 'scene',
    list5 =
      !label && Array['isArray'](disabled['assetPromptPresets']) && disabled['assetPromptPresets']['length']
        ? disabled['assetPromptPresets']
        : null,
    options5 = label ? STORY_SCENE_ASSET_PROMPT_PRESETS : list5 || STORY_CHARACTER_ASSET_PROMPT_PRESETS,
    selectedId = label
      ? getStorySceneAssetPromptPreset(disabled['sceneAssetPromptPresetId'])
      : list5?.['find']((value12) => value12['id'] === disabled['assetPromptPresetId']) ||
        list5?.[0] ||
        getStoryCharacterAssetPromptPreset(disabled['assetPromptPresetId']),
    el =
      value10 && value11
        ? getStoryAssetGenerationControlState(disabled, value10['id'], value11['id'])
        : { disabled: disabled['isBatchGenerating'] === true };
  return {
    visible: true,
    assetKind: assetKind,
    label: label ? '场景图片预设' : normalizeText(disabled['assetPromptPresetLabel']) || '角色图片预设',
    selectedId: selectedId?.['id'] || '',
    selectedLabel: selectedId?.['label'] || '',
    disabled: Boolean(el['disabled']),
    options: options5['map']((id) => ({
      id: id['id'],
      label: id['label'],
      description: id['description'],
    })),
  };
}
function projectLibrarySyncState(value13, handler) {
  const value14 =
      value13?.['totalAssetRef'] && typeof value13['totalAssetRef'] === 'object'
        ? value13['totalAssetRef']
        : null,
    assetId = normalizeText(value14?.['assetId']),
    itemIndex = Math['max'](0, Math['trunc'](Number(value14?.['itemIndex']) || 0));
  if (!assetId) return { exists: false, synced: false };
  const response = handler({ assetId: assetId, itemIndex: itemIndex });
  if (!response) return { exists: false, synced: false };
  const text5 = normalizeText(value14?.['itemKey']),
    text6 = normalizeText(response?.['nodeData']?.['assetPackageItemKey']),
    exists = !text5 || !text6 || text5 === text6,
    text7 = normalizeText(value13?.['imageUrl']),
    text8 = normalizeText(
      response?.['url'] || response?.['nodeData']?.['imageUrl'] || response?.['nodeData']?.['src'],
    );
  return { exists: exists, synced: exists && Boolean(text7) && text7 === text8 };
}
function projectPreviewActions(value15, value16, value17, el2, value18, value19) {
  if (value16['isLibraryAsset'] || value18)
    return {
      canDownload: Boolean(
        normalizeText(value17?.['imageUrl']) &&
        normalizeText(value16?.['mediaKind'])['toLowerCase']() !== 'video',
      ),
      showProjectActions: false,
    };
  const librarySynced = projectLibrarySyncState(value17, value19),
    appearanceActionKey = getAppearanceActionKey(value16, value17),
    isDeleteAppearanceConfirming = Boolean(
      appearanceActionKey &&
      normalizeText(value15['pendingDeleteAssetAppearanceKey']) === appearanceActionKey,
    ),
    deleteAppearanceLabel = value15['data']?.['project']?.['sourceMode'] === 'video-replication',
    showDeleteAppearance = deleteAppearanceLabel
      ? Boolean(normalizeText(value17?.['imageUrl'])) ||
        (['character', 'scene', 'prop']['includes'](value16['kind']) &&
          getStoryAssetAppearances(value16)['length'] > 1)
      : isAddedAppearance(value17) && getStoryAssetAppearances(value16)['length'] > 1,
    saveToLibraryLabel =
      normalizeText(value15['exportingAssetAppearanceKey']) === getAppearanceActionKey(value16, value17),
    canSaveToLibrary = Boolean(
      normalizeText(value17?.['imageUrl']) &&
      !el2['disabled'] &&
      !saveToLibraryLabel &&
      !librarySynced['synced'] &&
      !isDeleteAppearanceConfirming,
    );
  return {
    canDownload: Boolean(
      normalizeText(value17?.['imageUrl']) &&
      normalizeText(value16?.['mediaKind'])['toLowerCase']() !== 'video',
    ),
    showProjectActions: true,
    saveToLibraryLabel: saveToLibraryLabel
      ? '正在加入总素材'
      : librarySynced['synced']
        ? '已加入总素材'
        : librarySynced['exists']
          ? '更新总素材'
          : '将当前形象加入总素材',
    canSaveToLibrary: canSaveToLibrary,
    isSavingToLibrary: saveToLibraryLabel,
    canUpload: !saveToLibraryLabel && !isDeleteAppearanceConfirming,
    showDeleteAppearance: showDeleteAppearance,
    deleteAppearanceLabel:
      deleteAppearanceLabel && value16['kind'] !== 'character' ? '删除当前图片' : '删除当前形象',
    canDeleteAppearance: Boolean(
      showDeleteAppearance && !el2['disabled'] && !saveToLibraryLabel && !isDeleteAppearanceConfirming,
    ),
    isDeleteAppearanceConfirming: isDeleteAppearanceConfirming,
    librarySynced: librarySynced['synced'],
  };
}
function projectVoicePanel(value20, value21, isActive) {
  const sampleText = value20['characterVoiceEditor'];
  if (
    !sampleText?.['assetId'] ||
    sampleText['assetId'] !== value21?.['id'] ||
    value21['kind'] !== 'character'
  )
    return { visible: false };
  const reference = normalizeStoryCharacterVoiceReference(value21['voiceReference']),
    history = normalizeStoryCharacterVoiceHistory(value21['voiceReferenceHistory'])['map']((label2) => ({
      ...label2,
      label:
        label2['modelLabel'] ||
        label2['fileName'] ||
        (label2['source'] === 'generated' ? 'AI 生成声音' : '上传声音'),
      timeLabel: formatVoiceHistoryTime(label2['updatedAt']),
    })),
    isGenerating = isStoryAssetVoiceLoading(value20, value21['id']);
  return {
    visible: true,
    isActive: isActive,
    isGenerating: isGenerating,
    reference: reference,
    history: history,
    sampleText: sampleText['sampleText'] || '',
    voiceDescription: sampleText['voiceDescription'] || '',
    error: sampleText['error'] || '',
    sampleMaxCharacters: STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS,
    footer: {
      workflow: getStoryCharacterVoiceWorkflow(sampleText['nodeData']?.['model']),
      nodeData: sampleText['nodeData'],
      workflowItems: getStoryCharacterVoiceWorkflowItems(),
    },
  };
}
export function createStoryAssetSettingsProjection({
  resolveLibraryReference: resolveLibraryReference = () => null,
} = {}) {
  function run2(showRoleTag = {}, generated = {}, statusText = {}) {
    const appearanceCount = generated['isLibraryAsset'] ? [generated] : getStoryAssetAppearances(generated),
      stats = generated['isLibraryAsset']
        ? {
            total: 1,
            generated: generated['imageUrl'] ? 1 : 0,
            failed: 0,
            pending: generated['imageUrl'] ? 0 : 1,
          }
        : getStoryAssetAppearanceStats(generated),
      preview =
        statusText['previewAppearance'] ||
        (!generated['isLibraryAsset'] && getSelectedAppearance(showRoleTag, generated)) ||
        getStoryAssetBaseAppearance(generated) ||
        appearanceCount['find']((value22) => normalizeText(value22['imageUrl'])) ||
        appearanceCount[0] ||
        generated,
      isChecked = Array['isArray'](showRoleTag['selectedAssetIds']) ? showRoleTag['selectedAssetIds'] : [],
      isSelectionMode = showRoleTag['assetSelectionMode'] === true,
      enabled = isSelectionMode && isChecked['length'] > 1,
      isCurrent = isChecked['includes'](generated['id']),
      isLoading = isStoryAssetCardLoading(showRoleTag, generated['id']),
      showCardUpload =
        !generated['isLibraryAsset'] &&
        ['character', 'scene', 'prop']['includes'](generated['kind']) &&
        showRoleTag['data']?.['project']?.['sourceMode'] === 'video-replication',
      canDeleteAppearance = projectPreviewActions(
        showRoleTag,
        generated,
        preview,
        getStoryAssetGenerationControlState(showRoleTag, generated['id'], preview['id']),
        generated['isLibraryAsset'] === true,
        resolveLibraryReference,
      );
    return {
      id: generated['id'],
      name: normalizeText(generated['name']) || '未命名素材',
      role: generated['role'] || '素材',
      kind: generated['kind'],
      appearanceCount: appearanceCount['length'],
      showCardVoiceStatus:
        !generated['isLibraryAsset'] && !showCardUpload && generated['kind'] === 'character',
      hasCardVoiceReference: hasStoryCharacterVoiceReference(generated),
      showCardUpload: showCardUpload,
      showCardImageActions:
        !showCardUpload && !generated['isLibraryAsset'] && generated['kind'] === 'character',
      canNavigateAppearances: !generated['isLibraryAsset'] && appearanceCount['length'] > 1,
      showAppearanceDelete:
        !generated['isLibraryAsset'] &&
        !enabled &&
        canDeleteAppearance['showDeleteAppearance'] &&
        (!showCardUpload || Boolean(normalizeText(preview?.['imageUrl']))),
      canDeleteAppearance: canDeleteAppearance['canDeleteAppearance'],
      preview: preview,
      promptPreview: getCardPromptPreview(showRoleTag, generated, preview),
      stats: stats,
      statusText:
        statusText['statusText'] ||
        (showCardUpload
          ? stats['generated'] + ' / ' + stats['total']
          : !generated['isLibraryAsset'] && ['character', 'scene', 'prop']['includes'](generated['kind'])
            ? getSelectedAppearanceIndex(showRoleTag, generated) + 1 + ' / ' + appearanceCount['length']
            : ''),
      cardStatusHtml: statusText['cardStatusHtml'] || '',
      isCurrent: isCurrent,
      isChecked: isChecked['includes'](generated['id']),
      isSelectionMode: isSelectionMode,
      isLoading: isLoading,
      showRoleTag:
        showRoleTag['hideAssetRoleTag'] !== true && shouldRenderStoryAssetRoleTag(generated['kind']),
      canRename: showRoleTag['allowAssetRename'] === true && !generated['isLibraryAsset'],
      canDelete: Boolean(showRoleTag['allowDeleteAssetCard'] && !generated['isLibraryAsset'] && !enabled),
      draggable: statusText['draggable'] === true,
      cardClassName: [
        statusText['cardClassName'],
        !generated['isLibraryAsset'] && ['character', 'scene', 'prop']['includes'](generated['kind'])
          ? 'workspace-portrait-card'
          : '',
        showCardUpload ? 'story-replication-character-card' : '',
        showCardUpload ? 'story-replication-portrait-card' : '',
      ]
        ['filter'](Boolean)
        ['join'](' '),
      cardAttributes: statusText['cardAttributes'] || '',
      shellClassName: statusText['shellClassName'] || '',
      accessoryHtml: statusText['accessoryHtml'] || '',
      cardMetaHtml: statusText['cardMetaHtml'] || '',
      cardMediaHtml: statusText['cardMediaHtml'] || '',
      fallbackImageUrl: statusText['fallbackImageUrl'] || '',
      workspaceAssetLibraryImage: statusText['workspaceAssetLibraryImage'] === true,
    };
  }
  function promptControl(value23, selectionMode = {}) {
    if (value23 === 'batch-generation') {
      const value24 = selectionMode['state'] || selectionMode,
        selectedCount = Array['isArray'](value24['selectedAssetIds'])
          ? value24['selectedAssetIds']['length']
          : 0,
        action = value24['isBatchGenerating'] === true,
        cancelRequested = value24['assetBatchCancelRequested'] === true;
      return {
        selectedCount: selectedCount,
        action: action ? 'cancel-asset-batch-generation' : 'batch-generate-assets',
        isCancellation: action,
        busy: false,
        cancelRequested: cancelRequested,
        disabled: action ? cancelRequested : !selectedCount,
        label: action
          ? '' +
            (cancelRequested ? '已取消后续生成' : '取消后续生成') +
            (selectedCount ? ' (' + selectedCount + ')' : '')
          : '批量生成' + (selectedCount ? ' (' + selectedCount + ')' : ''),
        directMode: action ? '' : getStoryAssetBatchDirectMode(value24['assetFilter']),
      };
    }
    if (value23 === 'prompt-generation') {
      const value25 = selectionMode['state'] || {},
        el3 = selectionMode['generationControl'] || {},
        selectedCount2 = Array['isArray'](value25['selectedAssetIds'])
          ? value25['selectedAssetIds']['length']
          : 0,
        isMultiSelection = value25['assetSelectionMode'] === true && selectedCount2 > 1,
        action2 = isMultiSelection && value25['isBatchGenerating'] === true,
        cancelRequested2 = value25['assetBatchCancelRequested'] === true;
      return {
        isMultiSelection: isMultiSelection,
        selectedCount: selectedCount2,
        action: action2 ? 'cancel-asset-batch-generation' : 'batch-generate-assets',
        isCancellation: action2,
        busy: !isMultiSelection && el3['isGenerating'] === true,
        cancelRequested: cancelRequested2,
        disabled: isMultiSelection ? action2 && cancelRequested2 : Boolean(el3['disabled']),
        label: isMultiSelection
          ? action2
            ? (cancelRequested2 ? '已取消后续生成' : '取消后续生成') + ' (' + selectedCount2 + ')'
            : '批量生成 (' + selectedCount2 + ')'
          : el3['label'] || '生成素材图',
      };
    }
    if (value23 === 'library-selection') {
      const selectedCount3 = Math['max'](0, Math['trunc'](Number(selectionMode['selectedCount']) || 0)),
        targets = Array['isArray'](selectionMode['projectAssets']) ? selectionMode['projectAssets'] : [];
      return {
        selectionMode: selectionMode['selectionMode'] === true,
        selectedCount: selectedCount3,
        allSelected: selectionMode['allSelected'] === true,
        targetGroups: ['character', 'scene', 'prop']['map']((kind) => ({
          kind: kind,
          label: selectionMode['getTabLabel']?.(kind) || kind,
          targets: targets['filter']((value26) => normalizeText(value26?.['kind']) === kind)['map']((id2) => {
            const appearanceCount2 = getStoryAssetAppearances(id2);
            return {
              id: id2['id'],
              kind: id2['kind'],
              name: id2['name'],
              appearanceCount: appearanceCount2['length'],
              appearances: appearanceCount2['map']((id3) => ({
                id: id3['id'],
                name: id3['name'],
                imageUrl: id3['imageUrl'],
              })),
              preview:
                getStoryAssetBaseAppearance(id2) ||
                appearanceCount2['find']((value27) => normalizeText(value27?.['imageUrl'])) ||
                appearanceCount2[0] ||
                {},
            };
          }),
        })),
      };
    }
    if (value23 === 'preset') {
      const value28 = selectionMode['state'] || {},
        value29 =
          selectionMode['asset'] ||
          (Array['isArray'](value28['data']?.['assets'])
            ? value28['data']['assets']['find']((value30) => value30['id'] === value28['selectedAssetId'])
            : null);
      return projectPreset(
        value28,
        selectionMode['assetKind'],
        value29,
        value29 ? getSelectedAppearance(value28, value29) : null,
      );
    }
    if (value23 === 'preview-actions')
      return projectPreviewActions(
        selectionMode['state'] || {},
        selectionMode['asset'] || {},
        selectionMode['appearance'] || {},
        selectionMode['generationControl'] || {},
        selectionMode['readOnly'] === true,
        resolveLibraryReference,
      );
    if (value23 === 'voice-capsule') {
      const value31 = selectionMode['state'] || {},
        visible = selectionMode['asset'] || {};
      return {
        visible: visible['kind'] === 'character' && !visible['isLibraryAsset'],
        hasReference: hasStoryCharacterVoiceReference(visible),
        isOpen: selectionMode['isOpen'] === true,
        uploadLabel: normalizeText(value31['assetVoiceUploadLabel']),
      };
    }
    if (value23 === 'voice-player') {
      const visible2 = selectionMode['asset'] || {};
      return {
        visible:
          visible2['kind'] === 'character' &&
          !visible2['isLibraryAsset'] &&
          hasStoryCharacterVoiceReference(visible2),
        id: visible2['id'],
        name: visible2['name'],
      };
    }
    return {};
  }
  function run3(
    emptyDescription = {},
    id4 = null,
    { showEmptyDescription: showEmptyDescription = true, readOnly: readOnly = false } = {},
  ) {
    if (!id4)
      return {
        empty: true,
        emptyDescription:
          emptyDescription['assetFilter'] === 'library'
            ? '总素材中还没有可引用的图片或视频。'
            : '完成剧本分析后，角色、场景和道具会显示在这里。',
        showEmptyDescription: showEmptyDescription,
      };
    const appearanceCount3 = id4['isLibraryAsset'] ? [id4] : getStoryAssetAppearances(id4),
      appearanceIndex = getSelectedAppearanceIndex(emptyDescription, id4),
      appearance = getSelectedAppearance(emptyDescription, id4) || id4,
      hasMultipleAppearances = !id4['isLibraryAsset'] && !readOnly && appearanceCount3['length'] > 1,
      supportsBaseAppearance = id4['kind'] === 'character' && !id4['isLibraryAsset'] && !readOnly,
      isBaseAppearance = supportsBaseAppearance && isStoryAssetBaseAppearance(id4, appearance),
      generationControl = getStoryAssetGenerationControlState(emptyDescription, id4['id'], appearance['id']),
      value32 = emptyDescription['characterVoiceEditor']?.['assetId'] === id4['id'],
      isOpen = value32 && emptyDescription['characterVoicePanelMotion'] !== 'to-asset',
      motionClass =
        emptyDescription['characterVoicePanelMotion'] === 'to-voice'
          ? 'is-flipping-to-voice'
          : emptyDescription['characterVoicePanelMotion'] === 'to-asset'
            ? 'is-flipping-to-asset'
            : '',
      value33 = Array['isArray'](emptyDescription['data']?.['assets'])
        ? emptyDescription['data']['assets']['find'](
            (value34) => value34['id'] === emptyDescription['selectedAssetId'],
          )
        : id4,
      value35 = value33 ? getSelectedAppearance(emptyDescription, value33) : appearance;
    return {
      empty: false,
      asset: {
        id: id4['id'],
        name: normalizeText(id4['name']) || '未命名素材',
        role: id4['role'],
        kind: id4['kind'],
        mediaKind: id4['mediaKind'],
        isLibraryAsset: id4['isLibraryAsset'] === true,
        description: id4['description'] || '',
      },
      appearance: appearance,
      appearanceIndex: appearanceIndex,
      appearanceCount: appearanceCount3['length'],
      hasMultipleAppearances: hasMultipleAppearances,
      supportsBaseAppearance: supportsBaseAppearance,
      showBaseAppearanceControl:
        supportsBaseAppearance &&
        emptyDescription['data']?.['project']?.['sourceMode'] !== 'video-replication',
      isBaseAppearance: isBaseAppearance,
      canRename: emptyDescription['allowAssetRename'] === true && !id4['isLibraryAsset'],
      isBaseAppearanceSelectionDisabled: Boolean(isStoryAssetCardLoading(emptyDescription, id4['id'])),
      canSetBaseAppearance: hasMultipleAppearances && !isStoryAssetCardLoading(emptyDescription, id4['id']),
      showStyleReference: isBaseAppearance && emptyDescription['allowAssetStyleReference'] !== false,
      styleReference: {
        referenceImageUrl: appearance['referenceImageUrl'],
        disabled: Boolean(generationControl['disabled']),
      },
      voiceCapsule: {
        visible: id4['kind'] === 'character' && !id4['isLibraryAsset'],
        hasReference: hasStoryCharacterVoiceReference(id4),
        isOpen: isOpen,
        useSourceMenu: true,
        uploadLabel: normalizeText(emptyDescription['assetVoiceUploadLabel']),
      },
      voicePlayer: {
        visible:
          id4['kind'] === 'character' && !id4['isLibraryAsset'] && hasStoryCharacterVoiceReference(id4),
      },
      previewActions: projectPreviewActions(
        emptyDescription,
        id4,
        appearance,
        generationControl,
        readOnly,
        resolveLibraryReference,
      ),
      generationControl: generationControl,
      promptControl: promptControl('prompt-generation', {
        state: emptyDescription,
        generationControl: generationControl,
      }),
      preset: projectPreset(emptyDescription, id4['kind'], value33, value35),
      imageModel: {
        modelId: emptyDescription['models']?.['image'],
        provider: emptyDescription['imageProvider'],
        generationParams: emptyDescription['imageGenerationParams'],
      },
      readOnly: readOnly,
      isGeneratingAppearance: Boolean(generationControl['isGenerating']),
      motionClass: emptyDescription['assetAppearanceMotion']
        ? 'is-sliding-' + emptyDescription['assetAppearanceMotion']
        : '',
      panel: { isVoice: isOpen, motionClass: motionClass, isAnimating: Boolean(motionClass) },
      voicePanel: projectVoicePanel(emptyDescription, id4, isOpen),
      captionMeta:
        (appearance['name'] || id4['role'] || '素材') +
        ' · ' +
        formatStoryAssetOccurrences(appearance['occurrences'] || id4['occurrences'] || '当前项目') +
        (hasMultipleAppearances ? ' · ' + (appearanceIndex + 1) + '/' + appearanceCount3['length'] : ''),
    };
  }
  return Object['freeze']({
    projectAssetCard: (...args) => freezeSnapshot(run2(...args)),
    projectAssetControl: (...args2) => freezeSnapshot(promptControl(...args2)),
    projectAssetDetail: (...args3) => freezeSnapshot(run3(...args3)),
  });
}
