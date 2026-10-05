import {
  buildWorkspaceAssetLibraryItems,
  createWorkspaceAssetLibraryDisclosure,
} from '../workspaceAssetLibrary.js';
import { renderWorkspaceAssetSettingsShell } from '../workspaceAssetSettingsShell.js';
import { renderWorkspacePreviewArrow } from '../workspaceAssetPresentation.js';
import {
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearance,
  getStoryAssetAppearances,
} from './storyAssetAppearances.js';
import { hasStoryCharacterVoiceReference } from './storyCharacterVoice.js';
import { renderWorkspaceAssetSelectionActions } from '../workspaceAssetSelection.js';
import {
  getStoryProjectAudioAssets,
  getStoryAudioBoundCharacters,
  isStoryAudioAsset,
  storyAudioUploads,
} from './storyAudioAssets.js';
import {
  renderStoryAudioArtwork,
  renderStoryAudioActions,
  renderStoryAudioDetail,
} from './storyAudioAssetsPresentation.js';
import { renderStoryReplicationAssetComparison } from './storyReplicationReplacementPresentation.js';
import {
  normalizeStoryAssetDetailSplitRatio,
  normalizeStoryAssetSplitRatio,
} from './storyWorkspaceInteractions.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function isStoryAddedAssetAppearance(options = {}) {
  return ['library', 'upload']['includes'](normalizeText(options?.['sourceOrigin']));
}
export function removeStoryAddedAssetAppearance(options2 = {}, item = '') {
  const list = getStoryAssetAppearances(options2),
    text = normalizeText(item),
    removedIndex = list['findIndex']((key) => normalizeText(key?.['id']) === text),
    removedAppearance = list[removedIndex] || null;
  if (list['length'] <= 1 || removedIndex < 0 || !isStoryAddedAssetAppearance(removedAppearance))
    return {
      removed: false,
      removedAppearance: null,
      removedIndex: -1,
      nextIndex: Math['max'](0, Math['min'](list['length'] - 1, removedIndex)),
    };
  return (
    (options2['appearances'] = list['filter']((index, result) => result !== removedIndex)),
    normalizeText(options2['baseAppearanceId']) === text &&
      ((options2['baseAppearanceId'] = ''), ensureStoryAssetBaseAppearance(options2)),
    {
      removed: true,
      removedAppearance: removedAppearance,
      removedIndex: removedIndex,
      nextIndex: Math['max'](0, Math['min'](options2['appearances']['length'] - 1, removedIndex)),
    }
  );
}
const STORY_VISUAL_ASSET_KINDS = ['character', 'scene', 'prop'];
export function clearStoryAssetAppearanceImage(options3 = {}, data = '') {
  const list2 = getStoryAssetAppearances(options3),
    nextIndex = list2['findIndex']((target) => target['id'] === data),
    enabled = list2[nextIndex];
  if (!enabled || !normalizeText(enabled['imageUrl'])) return { removed: false };
  return (
    (enabled['imageUrl'] = ''),
    (enabled['generatedImage'] = null),
    (enabled['generatedImages'] = []),
    (enabled['activeIndex'] = 0),
    (enabled['error'] = ''),
    { removed: true, nextIndex: nextIndex }
  );
}
export function getMissingStoryAssetImages(list3 = []) {
  return (Array['isArray'](list3) ? list3 : [])['flatMap']((error) => {
    const kind = normalizeText(error?.['kind']);
    if (!STORY_VISUAL_ASSET_KINDS['includes'](kind)) return [];
    const list4 = getStoryAssetAppearances(error),
      list5 = list4['length'] ? list4 : [error];
    return list5['filter']((source) => !normalizeText(source?.['imageUrl']))['map']((error2) => ({
      kind: kind,
      assetId: normalizeText(error?.['id']),
      assetName: normalizeText(error?.['name']),
      appearanceId: normalizeText(error2?.['id']),
      appearanceName: normalizeText(error2?.['name']),
    }));
  });
}
export function buildMissingStoryAssetImageWarning(list6 = []) {
  const next = { character: '角色', scene: '场景', prop: '道具' },
    list7 = STORY_VISUAL_ASSET_KINDS['map']((current) => {
      const entry = (Array['isArray'](list6) ? list6 : [])['filter'](
        (record) => record?.['kind'] === current,
      )['length'];
      return entry ? next[current] + ' ' + entry + ' 张' : '';
    })['filter'](Boolean);
  if (!list7['length']) return '';
  return (
    '检测到缺少图片：' +
    list7['join']('、') +
    '。跳过后，这些素材不会作为分镜视频的图片参考。是否跳过并继续？'
  );
}
export function createStoryAssetSettingsWorkspacePresentation({
  projection: projection,
  presentation: presentation,
  getTabLabel: getTabLabel = (payload) => payload,
  renderTabIcon: renderTabIcon = () => '',
  renderPageFooter: renderPageFooter = () => '',
} = {}) {
  if (!projection || !presentation)
    throw new TypeError(
      'Story asset settings workspace requires projection and presentation owners.',
    );
  const getVisibleAssets = (handle) => {
      if (handle['assetFilter'] === 'audio') return getStoryProjectAudioAssets(handle['data']);
      if (handle['assetFilter'] === 'library')
        return buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] });
      return handle['data']['assets']['filter']((config) => config['kind'] === handle['assetFilter']);
    },
    isLibraryImageAsset = (options4 = {}) =>
      normalizeText(options4?.['mediaKind'])['toLowerCase']() === 'image' &&
      Boolean(normalizeText(options4?.['sourceUrl'] || options4?.['imageUrl'])),
    getLibraryActionAssetIds = (options5 = {}, scope = []) => {
      const map = new Set(
        (Array['isArray'](scope) ? scope : [])
          ['filter'](isLibraryImageAsset)
          ['map']((input) => normalizeText(input?.['id']))
          ['filter'](Boolean),
      );
      return (Array['isArray'](options5['selectedAssetIds']) ? options5['selectedAssetIds'] : [])
        ['map'](normalizeText)
        ['filter']((output) => map['has'](output));
    },
    getSelectedAsset = (value2, list8) =>
      list8['find']((value3) => value3['id'] === value2['selectedAssetId']) || list8[0] || null,
    getSelectedAppearanceIndex = (value4, value5) => {
      const value6 = Number(value4['assetAppearanceIndexes']?.[value5?.['id']]),
        value7 = Math['max'](0, getStoryAssetAppearances(value5)['length'] - 1);
      return Math['max'](0, Math['min'](value7, Number['isFinite'](value6) ? Math['trunc'](value6) : 0));
    },
    getSelectedAppearance = (value8, value9) =>
      value9?.['isLibraryAsset']
        ? value9
        : getStoryAssetAppearance(value9, getSelectedAppearanceIndex(value8, value9)),
    getAppearanceActionKey = (options6 = {}, value10 = {}) => {
      const text2 = normalizeText(options6?.['id']),
        text3 = normalizeText(value10?.['id']);
      return text2 && text3 ? text2 + ':' + text3 : '';
    },
    isAddedAppearance = isStoryAddedAssetAppearance,
    renderAssetCard = (
      value11,
      value12,
      {
        previewAppearance: previewAppearance = null,
        statusText: statusText = '',
        cardStatusHtml: cardStatusHtml = '',
        draggable: draggable = false,
        cardClassName: cardClassName = '',
        cardAttributes: cardAttributes = '',
        shellClassName: shellClassName = '',
        accessoryHtml: accessoryHtml = '',
        cardMetaHtml: cardMetaHtml = '',
        cardMediaHtml: cardMediaHtml = renderStoryReplicationAssetComparison(value11, value12),
        fallbackImageUrl: fallbackImageUrl = '',
        workspaceAssetLibraryImage: workspaceAssetLibraryImage = false,
      } = {},
    ) =>
      presentation['renderAssetSurface']({
        kind: 'card',
        card: projection['projectAssetCard'](value11, value12, {
          previewAppearance: previewAppearance,
          statusText: statusText,
          cardStatusHtml: cardStatusHtml,
          draggable: draggable,
          cardClassName: cardClassName,
          cardAttributes: cardAttributes,
          shellClassName: shellClassName,
          accessoryHtml: accessoryHtml,
          cardMetaHtml: cardMetaHtml,
          cardMediaHtml: cardMediaHtml,
          fallbackImageUrl: fallbackImageUrl,
          workspaceAssetLibraryImage: workspaceAssetLibraryImage,
        }),
      }),
    renderAppearanceArrow = (direction) =>
      presentation['renderAssetSurface']({ kind: 'appearance-arrow', direction: direction }),
    renderAssetReferenceInput = (referenceImageUrl = {}, { disabled: disabled = false } = {}) =>
      presentation['renderAssetSurface']({
        kind: 'reference-input',
        reference: { referenceImageUrl: referenceImageUrl['referenceImageUrl'], disabled: disabled },
      }),
    renderPreviewArrow = (
      value13,
      { action: action = '', label: label = '', className: className = '' } = {},
    ) =>
      renderWorkspacePreviewArrow(value13, {
        action: action,
        label: label,
        className: className,
        actionAttributes: { 'data-story-action': action },
      }),
    renderClipNavigationArrow = (action2) =>
      renderPreviewArrow(action2, {
        action: action2 === 'previous' ? 'previous-clip' : 'next-clip',
        label: action2 === 'previous' ? '上一幕' : '下一幕',
        className: 'story-clip-navigation-arrow',
      }),
    map2 = new Set(['mp3', 'wav', 'm4a']),
    map3 = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a']),
    isSupportedCharacterVoiceFile = (error3) => {
      const list9 = normalizeText(error3?.['name'])['toLowerCase'](),
        value14 = list9['includes']('.') ? list9['split']('.')['pop']() : '',
        text4 = normalizeText(error3?.['type'])['toLowerCase']();
      return map2['has'](value14) || map3['has'](text4);
    },
    renderAssetBatchGenerationControl = (state2 = {}) =>
      presentation['renderAssetControls']({
        kind: 'batch-generation',
        control: projection['projectAssetControl']('batch-generation', { state: state2 }),
      }),
    renderAssetPromptGenerationControl = (state3 = {}, generationControl2 = {}) =>
      presentation['renderAssetControls']({
        kind: 'prompt-generation',
        control: projection['projectAssetControl']('prompt-generation', {
          state: state3,
          generationControl: generationControl2,
        }),
      }),
    renderLibraryAddToProjectControl = ({
      selectedCount: selectedCount = 0,
      projectAssets: projectAssets = [],
      showCount: showCount = true,
    } = {}) => {
      const args = projection['projectAssetControl']('library-selection', {
        selectionMode: showCount,
        selectedCount: selectedCount,
        projectAssets: projectAssets,
        getTabLabel: getTabLabel,
      });
      return presentation['renderAssetControls']({
        kind: 'library-add',
        control: { ...args, showCount: showCount },
      });
    },
    renderLibrarySelectionActions = ({
      selectionMode: selectionMode = false,
      selectedCount: selectedCount = 0,
      allSelected: allSelected = false,
      projectAssets: projectAssets = [],
    } = {}) =>
      presentation['renderAssetControls']({
        kind: 'library-selection',
        control: projection['projectAssetControl']('library-selection', {
          selectionMode: selectionMode,
          selectedCount: selectedCount,
          allSelected: allSelected,
          projectAssets: projectAssets,
          getTabLabel: getTabLabel,
        }),
      }),
    syncCharacterVoiceCapsuleState = (el, value15 = {}) => {
      if (typeof el?.['classList']?.['toggle'] !== 'function') return false;
      const hasStoryCharacterVoiceReference2 = hasStoryCharacterVoiceReference(value15);
      return (
        el['classList']['toggle']('has-reference', hasStoryCharacterVoiceReference2),
        el['classList']['toggle']('is-missing', !hasStoryCharacterVoiceReference2),
        true
      );
    },
    renderVoiceIcon = (hasVoice = false) =>
      presentation['renderAssetSurface']({ kind: 'voice-icon', hasVoice: hasVoice }),
    handler = (asset2) =>
      presentation['renderAssetSurface']({
        kind: 'voice-player',
        voicePlayer: projection['projectAssetControl']('voice-player', { asset: asset2 }),
      }),
    syncCharacterVoicePlayerState = (el2, value16 = {}) => {
      const el3 = el2?.['querySelector']?.('.story-asset-caption-title');
      if (!el3) return false;
      el3['querySelector']?.('[data-story-character-voice-player]')?.['remove']?.();
      const value17 = handler(value16);
      if (value17) el3['insertAdjacentHTML']('beforeend', value17);
      return true;
    },
    renderAssetPreviewActions = ({
      state: state = {},
      asset: asset = {},
      appearance: appearance = {},
      generationControl: generationControl = {},
      readOnly: readOnly = false,
    } = {}) =>
      presentation['renderAssetSurface']({
        kind: 'preview-actions',
        actions: projection['projectAssetControl']('preview-actions', {
          state: state,
          asset: asset,
          appearance: appearance,
          generationControl: generationControl,
          readOnly: readOnly,
        }),
      }),
    renderAssetDetail = (
      value18,
      value19,
      { showEmptyDescription: showEmptyDescription = true, readOnly: readOnly = false } = {},
    ) =>
      presentation['renderAssetSurface']({
        kind: 'detail',
        detail: {
          ...projection['projectAssetDetail'](value18, value19, {
            showEmptyDescription: showEmptyDescription,
            readOnly: readOnly,
          }),
          detailSplitRatio: normalizeStoryAssetDetailSplitRatio(value18['assetDetailSplitRatio']),
        },
      }),
    renderAssetsPage = (cardMediaHtml2) => {
      const assets = getVisibleAssets(cardMediaHtml2),
        list10 =
          cardMediaHtml2['assetFilter'] === 'library'
            ? assets['filter']((value20) => isLibraryImageAsset(value20) || isStoryAudioAsset(value20))
            : assets,
        allSelected2 =
          list10['length'] > 0 &&
          list10['every']((value21) => cardMediaHtml2['selectedAssetIds']['includes'](value21['id'])),
        value22 = getSelectedAsset(cardMediaHtml2, assets);
      value22 &&
        cardMediaHtml2['selectedAssetId'] !== value22['id'] &&
        (cardMediaHtml2['selectedAssetId'] = value22['id']);
      const selectedCount2 =
          cardMediaHtml2['assetFilter'] === 'library' ? getLibraryActionAssetIds(cardMediaHtml2, assets) : [],
        value23 = cardMediaHtml2['data']['assets']['filter']((value24) => value24['kind'] === 'character')[
          'length'
        ],
        value25 = cardMediaHtml2['data']['assets']['filter']((value26) => value26['kind'] === 'scene')[
          'length'
        ],
        value27 = cardMediaHtml2['data']['assets']['filter']((value28) => value28['kind'] === 'prop')[
          'length'
        ],
        workspaceAssetLibraryItems = buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] })[
          'length'
        ],
        renderAsset = (imageUrl) =>
          isStoryAudioAsset(imageUrl)
            ? renderAssetCard(
                cardMediaHtml2,
                { ...imageUrl, isLibraryAsset: true, imageUrl: '', role: '音频素材' },
                {
                  cardMediaHtml: renderStoryAudioArtwork(),
                  statusText:
                    '已绑定 ' +
                    getStoryAudioBoundCharacters(cardMediaHtml2['data'], imageUrl)['length'] +
                    ' 个角色',
                },
              )
            : renderAssetCard(cardMediaHtml2, imageUrl, {
                cardMediaHtml:
                  cardMediaHtml2['assetFilter'] !== 'library'
                    ? renderStoryReplicationAssetComparison(cardMediaHtml2, imageUrl)
                    : '',
                previewAppearance:
                  cardMediaHtml2['assetFilter'] === 'library'
                    ? { ...imageUrl, imageUrl: imageUrl['thumbnailUrl'] || imageUrl['imageUrl'] }
                    : null,
                fallbackImageUrl: cardMediaHtml2['assetFilter'] === 'library' ? imageUrl['sourceUrl'] : '',
                workspaceAssetLibraryImage: cardMediaHtml2['assetFilter'] === 'library',
              }),
        cardsHtml =
          cardMediaHtml2['assetFilter'] === 'library'
            ? (cardMediaHtml2['assetLibraryDisclosure'] || createWorkspaceAssetLibraryDisclosure())['render'](
                {
                  assets: assets,
                  renderAsset: renderAsset,
                },
              )
            : assets['map'](renderAsset)['join'](''),
        calloutInHeading = true,
        primaryActionHtml = renderStoryAudioActions(
          cardMediaHtml2,
          assets,
          storyAudioUploads['has'](cardMediaHtml2['data']),
        );
      return renderWorkspaceAssetSettingsShell({
        className: 'story-workspace-assets-page',
        calloutInHeading: calloutInHeading,
        headingInListColumn: calloutInHeading,
        calloutStatus:
          calloutInHeading && cardMediaHtml2['assetSelectionMode']
            ? '已选择 ' + cardMediaHtml2['selectedAssetIds']['length'] + ' 项'
            : '',
        activeTab: cardMediaHtml2['assetFilter'],
        tabCount: 5,
        tabsHtml: [
          ['character', value23],
          ['scene', value25],
          ['prop', value27],
          ['audio', getStoryProjectAudioAssets(cardMediaHtml2['data'])['length']],
          ['library', workspaceAssetLibraryItems],
        ]
          ['map'](
            ([value29, value30]) =>
              '<button type="button" class="' +
              (cardMediaHtml2['assetFilter'] === value29 ? 'is-active' : '') +
              '" data-story-asset-filter="' +
              value29 +
              '" role="tab" aria-selected="' +
              (cardMediaHtml2['assetFilter'] === value29) +
              '" tabindex="' +
              (cardMediaHtml2['assetFilter'] === value29 ? '0' : '-1') +
              '">' +
              renderTabIcon(value29) +
              '<span class="story-asset-tab-label">' +
              getTabLabel(value29) +
              '</span><span class="story-asset-tab-count">' +
              value30 +
              '</span></button>',
          )
          ['join'](''),
        calloutTitle:
          cardMediaHtml2['assetFilter'] === 'audio'
            ? '项目音频素材'
            : cardMediaHtml2['assetFilter'] === 'character'
              ? '生成或导入角色形象'
              : cardMediaHtml2['assetFilter'] === 'scene'
                ? '生成或导入场景设定'
                : cardMediaHtml2['assetFilter'] === 'prop'
                  ? '生成或导入道具设定'
                  : '从总素材加入项目',
        calloutDescription:
          cardMediaHtml2['assetFilter'] === 'audio'
            ? '显示已加入当前项目的音频；上传会先保存到总素材，再加入项目。'
            : cardMediaHtml2['assetFilter'] === 'library'
              ? cardMediaHtml2['assetSelectionMode']
                ? cardMediaHtml2['selectedAssetIds']['length']
                  ? '已选择 ' + cardMediaHtml2['selectedAssetIds']['length'] + ' 张图片'
                  : '点击素材进行多选，或拖动鼠标框选。'
                : '选中素材后加入项目；支持框选多选。'
              : cardMediaHtml2['assetSelectionMode']
                ? '已选择 ' + cardMediaHtml2['selectedAssetIds']['length'] + ' 项'
                : cardMediaHtml2['assetFilter'] === 'character'
                  ? '多形象角色会先确定基础形象，再以其作为参考生成其他形象。'
                  : '每项素材保留一张可复用的设定图。',
        calloutActionsHtml:
          cardMediaHtml2['assetFilter'] === 'audio'
            ? renderWorkspaceAssetSelectionActions({
                selectedCount: cardMediaHtml2['selectedAssetIds']['length'],
                allSelected: allSelected2,
                primaryActionHtml: primaryActionHtml,
              })
            : cardMediaHtml2['assetFilter'] === 'library'
              ? primaryActionHtml
                ? renderWorkspaceAssetSelectionActions({
                    selectionMode: cardMediaHtml2['assetSelectionMode'],
                    selectedCount: cardMediaHtml2['selectedAssetIds']['length'],
                    allSelected: allSelected2,
                    primaryActionHtml:
                      primaryActionHtml +
                      (selectedCount2['length']
                        ? renderLibraryAddToProjectControl({
                            selectedCount: selectedCount2['length'],
                            projectAssets: cardMediaHtml2['data']['assets'],
                          })
                        : ''),
                    selectAllLabel: '全选素材',
                  })
                : renderLibrarySelectionActions({
                    selectionMode: cardMediaHtml2['assetSelectionMode'],
                    selectedCount: selectedCount2['length'],
                    allSelected: allSelected2,
                    projectAssets: cardMediaHtml2['data']['assets'],
                  })
              : (cardMediaHtml2['assetSelectionMode'] &&
                    cardMediaHtml2['selectedAssetIds']['length'] > 1) ||
                  cardMediaHtml2['isBatchGenerating']
                ? '<button type="button" class="story-secondary-button" data-story-action="toggle-all-assets" aria-pressed="' +
                  allSelected2 +
                  '" ' +
                  (assets['length'] ? '' : 'disabled') +
                  '>' +
                  (allSelected2 ? '取消全选' : '全选') +
                  '</button>' +
                  renderAssetBatchGenerationControl(cardMediaHtml2)
                : renderWorkspaceAssetSelectionActions(),
        cardsHtml: cardsHtml,
        emptyText:
          cardMediaHtml2['assetFilter'] === 'audio'
            ? '当前项目暂无音频，请从总素材加入或上传音频'
            : '暂无素材',
        detailHtml:
          cardMediaHtml2['assetFilter'] === 'audio' || isStoryAudioAsset(value22)
            ? renderStoryAudioDetail(cardMediaHtml2, value22)
            : renderAssetDetail(cardMediaHtml2, value22),
        footerHtml: renderPageFooter(cardMediaHtml2, {
          nextLabel:
            cardMediaHtml2['data']?.['project']?.['sourceMode'] === 'video-replication'
              ? cardMediaHtml2['data']['episodes']['length'] === 1
                ? cardMediaHtml2['data']['episodes'][0]['clips']?.['length']
                  ? '进入视频制作'
                  : '生成分段提示词'
                : '下一步：视频列表'
              : '生成分镜视频',
        }),
        splitRatio: normalizeStoryAssetSplitRatio(cardMediaHtml2['assetSplitRatio']),
      });
    };
  return Object['freeze']({
    getAppearanceActionKey: getAppearanceActionKey,
    getLibraryActionAssetIds: getLibraryActionAssetIds,
    getSelectedAppearance: getSelectedAppearance,
    getSelectedAppearanceIndex: getSelectedAppearanceIndex,
    getSelectedAsset: getSelectedAsset,
    getVisibleAssets: getVisibleAssets,
    isAddedAppearance: isAddedAppearance,
    isLibraryImageAsset: isLibraryImageAsset,
    isSupportedCharacterVoiceFile: isSupportedCharacterVoiceFile,
    renderAppearanceArrow: renderAppearanceArrow,
    renderAssetBatchGenerationControl: renderAssetBatchGenerationControl,
    renderAssetCard: renderAssetCard,
    renderAssetDetail: renderAssetDetail,
    renderAssetPreviewActions: renderAssetPreviewActions,
    renderAssetPromptGenerationControl: renderAssetPromptGenerationControl,
    renderAssetReferenceInput: renderAssetReferenceInput,
    renderAssetsPage: renderAssetsPage,
    renderClipNavigationArrow: renderClipNavigationArrow,
    renderLibraryAddToProjectControl: renderLibraryAddToProjectControl,
    renderLibrarySelectionActions: renderLibrarySelectionActions,
    renderPreviewArrow: renderPreviewArrow,
    renderVoiceIcon: renderVoiceIcon,
    syncCharacterVoiceCapsuleState: syncCharacterVoiceCapsuleState,
    syncCharacterVoicePlayerState: syncCharacterVoicePlayerState,
  });
}
