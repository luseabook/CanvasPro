import { localPathToUrl } from '../../utils/localMediaPath.js';
import { createWorkspaceAssetLibraryDisclosure } from '../workspaceAssetLibrary.js';
import {
  getWorkspaceAssetAppearanceStats,
  getWorkspaceAssetAppearances,
} from '../workspaceAssetAppearance.js';
import { renderWorkspaceAssetSelectionActions } from '../workspaceAssetSelection.js';
import { renderWorkspaceAssetSettingsShell } from '../workspaceAssetSettingsShell.js';
import {
  renderWorkspaceAssetTabIcon,
  renderWorkspaceCardVoiceStatus,
  renderWorkspaceCardAppearanceNavigation,
} from '../workspaceAssetPresentation.js';
import {
  buildPersonReplacementAssetViewState,
  renderPersonReplacementAudioAssetCard,
  renderPersonReplacementAudioAssetDetail,
  renderPersonReplacementAssetCard,
  renderPersonReplacementAssetDetail,
  renderPersonReplacementBatchGenerationControl,
} from './personReplacementAssetPresentation.js';
import {
  getPersonReplacementLibraryAudioRef,
  getPersonReplacementProjectAudioAssets,
  getPersonReplacementVoiceLibraryBoundCharacters,
} from './personReplacementVoiceLibrary.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function escapeHtml(item) {
  return String(item ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;');
}
function normalizeMediaUrl(key) {
  const text = normalizeText(key);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function normalizeProjectAssetMediaForRender(args = {}) {
  return {
    ...args,
    appearances: getWorkspaceAssetAppearances(args).map((args2) => ({
      ...args2,
      imageUrl: normalizeMediaUrl(args2.imageUrl),
      referenceImageUrl: normalizeMediaUrl(args2.referenceImageUrl),
    })),
  };
}
function getCharacterVoiceUrl(options = {}) {
  return normalizeMediaUrl(
    options.voiceReference?.audioUrl ||
      options.voiceReference?.localPath ||
      options.voiceRef,
  );
}
function renderVoiceReferenceStatus(options2 = {}, index = '') {
  const result = Boolean(getCharacterVoiceUrl(options2));
  return (
    '<span class="person-replacement-target-voice-status' +
    (index ? ' ' + escapeHtml(index) : '') +
    ' ' +
    (result ? 'has-reference' : 'is-missing') +
    '"><i aria-hidden="true"></i>' +
    (result ? '有声音参考' : '无声音参考') +
    '</span>'
  );
}
export const PERSON_REPLACEMENT_LIBRARY_TARGETS = Object.freeze([
  { kind: 'character', label: '人物' },
  { kind: 'scene', label: '场景' },
  { kind: 'audio', label: '音频' },
]);
export function getPersonReplacementSelectableAssets(data, target) {
  if (target === 'library')
    return data.libraryAssets.filter(
      (source) =>
        (normalizeText(source?.mediaKind).toLowerCase() === 'image' &&
          normalizeText(source?.sourceUrl || source?.imageUrl)) ||
        (normalizeText(source?.mediaKind).toLowerCase() === 'audio' &&
          getPersonReplacementLibraryAudioRef(source)),
    );
  if (target === 'audio') return getPersonReplacementProjectAudioAssets(data);
  return target === 'scene' ? data.scenes : data.characters;
}
export function renderPersonReplacementAssetSettingsPage(characters, footerHtml = {}) {
  const activeTab = ['character', 'scene', 'audio', 'library'].includes(
      characters.workspace.characterAssetTab,
    )
      ? characters.workspace.characterAssetTab
      : 'character',
    previewAppearance = activeTab === 'library',
    readOnly = activeTab === 'scene',
    calloutTitle = activeTab === 'audio',
    map = new Set(
      Array.isArray(footerHtml.assetUploadPendingKinds) ? footerHtml.assetUploadPendingKinds : [],
    ),
    list = getPersonReplacementProjectAudioAssets(characters),
    text2 = normalizeText(footerHtml.voiceLibraryTargetCharacterId),
    next = {
      ...characters,
      characters: characters.characters.map(normalizeProjectAssetMediaForRender),
      scenes: characters.scenes.map(normalizeProjectAssetMediaForRender),
    },
    error = next.characters.find((current) => current.id === text2) || null,
    showVoiceLibraryConfirm = calloutTitle && Boolean(error),
    allowDeleteAssetCard = buildPersonReplacementAssetViewState(next);
  showVoiceLibraryConfirm &&
    ((allowDeleteAssetCard.selectedAssetIds = [allowDeleteAssetCard.selectedAssetId]),
    (allowDeleteAssetCard.assetSelectionMode = false));
  allowDeleteAssetCard.isBatchGenerating = footerHtml.assetBatchGenerationActive === true;
  const entry =
    allowDeleteAssetCard.assetSelectionMode && allowDeleteAssetCard.selectedAssetIds.length > 1;
  ((allowDeleteAssetCard.batchGenerationLabel = normalizeText(footerHtml.assetBatchGenerationLabel)),
    (allowDeleteAssetCard.batchCancelRequested = footerHtml.assetBatchCancelRequested === true),
    (allowDeleteAssetCard.batchGeneratingAssetIds = Array.isArray(
      footerHtml.assetBatchGeneratingCharacterIds,
    )
      ? footerHtml.assetBatchGeneratingCharacterIds
      : []),
    (allowDeleteAssetCard.batchCancelAction = 'cancel-asset-batch-generation'));
  const assets = allowDeleteAssetCard.data.assets,
    record = assets.find((payload) => payload.id === allowDeleteAssetCard.selectedAssetId) || null,
    list2 = getPersonReplacementSelectableAssets(next, activeTab),
    allSelected =
      list2.length > 0 &&
      list2.every((handle) => allowDeleteAssetCard.selectedAssetIds.includes(handle.id)),
    list3 = previewAppearance
      ? list2.filter((state) => allowDeleteAssetCard.selectedAssetIds.includes(state.id))
      : [],
    config = list3.length,
    scope = footerHtml.assetLibraryDisclosure || createWorkspaceAssetLibraryDisclosure(),
    renderAsset = (imageUrl) => {
      const statusText = !previewAppearance && !readOnly && !calloutTitle,
        input = statusText ? getWorkspaceAssetAppearanceStats(imageUrl) : null,
        boundCharacters = getPersonReplacementVoiceLibraryBoundCharacters(characters, imageUrl);
      if (normalizeText(imageUrl?.mediaKind).toLowerCase() === 'audio')
        return renderPersonReplacementAudioAssetCard(
          {
            ...allowDeleteAssetCard,
            allowDeleteAssetCard: allowDeleteAssetCard.allowDeleteAssetCard && !showVoiceLibraryConfirm,
          },
          imageUrl,
          { boundCharacters: boundCharacters, showVoiceLibraryConfirm: showVoiceLibraryConfirm },
        );
      return renderPersonReplacementAssetCard(allowDeleteAssetCard, imageUrl, {
        cardAttributes:
          !previewAppearance && getWorkspaceAssetAppearances(imageUrl).length > 1
            ? 'data-story-card-appearance-wheel="' + escapeHtml(imageUrl.id) + '"'
            : '',
        previewAppearance: previewAppearance
          ? { ...imageUrl, imageUrl: imageUrl.thumbnailUrl || imageUrl.imageUrl }
          : getWorkspaceAssetAppearances(imageUrl)[
              allowDeleteAssetCard.assetAppearanceIndexes?.[imageUrl.id] || 0
            ],
        accessoryHtml:
          !previewAppearance && getWorkspaceAssetAppearances(imageUrl).length > 1
            ? renderWorkspaceCardAppearanceNavigation({
                attributes: { 'data-story-card-appearance-wheel': imageUrl.id },
                previousAttributes: {
                  'data-story-action': 'previous-appearance',
                  'data-story-card-appearance-id': imageUrl.id,
                },
                nextAttributes: {
                  'data-story-action': 'next-appearance',
                  'data-story-card-appearance-id': imageUrl.id,
                },
              })
            : '',
        fallbackImageUrl: previewAppearance ? imageUrl.sourceUrl : '',
        workspaceAssetLibraryImage: previewAppearance,
        statusText: statusText
          ? (allowDeleteAssetCard.assetAppearanceIndexes?.[imageUrl.id] || 0) +
            1 +
            ' / ' +
            input.total
          : '',
        cardClassName: statusText
          ? 'person-replacement-character-asset-card workspace-portrait-card'
          : !previewAppearance && readOnly
            ? 'workspace-portrait-card'
            : '',
        headingAccessoryHtml: statusText
          ? renderWorkspaceCardVoiceStatus(Boolean(getCharacterVoiceUrl(imageUrl)))
          : '',
      });
    },
    cardsHtml = previewAppearance
      ? scope.render({ assets: assets, renderAsset: renderAsset })
      : assets.map(renderAsset).join(''),
    output =
      list3.length && list3.every((value2) => value2.mediaKind === 'audio')
        ? '<button type="button" class="story-primary-button" data-person-replacement-action="add-library-assets-to-project" data-person-replacement-library-target-kind="audio">加入到音频项目' +
          (allowDeleteAssetCard.assetSelectionMode ? ' (' + config + ')' : '') +
          '</button>'
        : '<div class="story-asset-batch-menu-wrap story-library-add-menu-wrap person-replacement-library-add-menu-wrap">\n    <button type="button" class="story-primary-button story-asset-batch-trigger" data-person-replacement-action="toggle-library-add-targets" aria-haspopup="menu" aria-expanded="false" ' +
          (config ? '' : 'disabled') +
          '><span class="story-asset-batch-trigger-label">加入到项目' +
          (allowDeleteAssetCard.assetSelectionMode && config ? ' (' + config + ')' : '') +
          '</span></button>\n    <div class="story-asset-batch-menu story-library-add-menu" role="menu" aria-label="选择加入项目的素材分类" aria-hidden="true">\n      ' +
          PERSON_REPLACEMENT_LIBRARY_TARGETS.map(
            ({ kind: kind, label: label }) =>
              '<button type="button" role="menuitem" data-person-replacement-action="add-library-assets-to-project" data-person-replacement-library-target-kind="' +
              kind +
              '"><span class="story-asset-batch-mode-icon">' +
              renderWorkspaceAssetTabIcon(kind) +
              '</span><span>' +
              label +
              '</span></button>',
          ).join('') +
          '\n    </div>\n  </div>',
    primaryActionHtml = (value3, value4, value5) => {
      const value6 = map.has(value3);
      return (
        '<button type="button" class="story-secondary-button" data-person-replacement-action="' +
        value5 +
        '"' +
        (value6 ? ' aria-busy="true" disabled' : '') +
        '>' +
        (value6
          ? '<span class="storyboard-script-loading-spinner" aria-hidden="true"></span><span>上传中…</span>'
          : '上传' + value4) +
        '</button>'
      );
    },
    args3 = {
      detailSplitRatio: allowDeleteAssetCard.assetDetailSplitRatio,
      detailSplitterHtml:
        typeof footerHtml.renderDetailSplitter === 'function'
          ? footerHtml.renderDetailSplitter(allowDeleteAssetCard.assetDetailSplitRatio)
          : '',
    },
    calloutActionsHtml = calloutTitle
      ? showVoiceLibraryConfirm
        ? '<button type="button" class="story-secondary-button" data-person-replacement-action="cancel-character-voice-library">取消</button>'
        : renderWorkspaceAssetSelectionActions({
            selectedCount: allowDeleteAssetCard.selectedAssetIds.length,
            allSelected: allSelected,
            primaryActionHtml: primaryActionHtml('audio', '音频', 'choose-new-audio-files'),
          })
      : renderWorkspaceAssetSelectionActions({
          compactTrigger: false,
          selectionMode: allowDeleteAssetCard.assetSelectionMode,
          selectedCount: allowDeleteAssetCard.selectedAssetIds.length,
          allSelected: allSelected,
          primaryActionHtml: previewAppearance
            ? output
            : readOnly
              ? entry
                ? ''
                : primaryActionHtml('scene', '场景', 'choose-new-scene-images')
              : entry || allowDeleteAssetCard.isBatchGenerating
                ? renderPersonReplacementBatchGenerationControl(allowDeleteAssetCard)
                : primaryActionHtml('character', '人物', 'choose-new-character-images'),
          selectAllLabel: previewAppearance ? '全选素材' : '全选',
          clearSelectionLabel: '取消全选',
        });
  return renderWorkspaceAssetSettingsShell({
    className: 'person-replacement-assets-page',
    calloutInHeading: true,
    headingInListColumn: true,
    calloutStatus: allowDeleteAssetCard.assetSelectionMode
      ? '已选择 ' + allowDeleteAssetCard.selectedAssetIds.length + ' 项'
      : '',
    activeTab: activeTab,
    tabCount: 4,
    tabsHtml: [
      ['character', '人物', characters.characters.length],
      ['scene', '场景', characters.scenes.length],
      ['audio', '音频', list.length],
      ['library', '总素材', characters.libraryAssets.length],
    ]
      .map(
        ([value7, value8, value9]) =>
          '<button type="button" class="' +
          (activeTab === value7 ? 'is-active' : '') +
          '" data-person-replacement-action="select-character-asset-tab" data-asset-tab="' +
          value7 +
          '" role="tab" aria-selected="' +
          (activeTab === value7) +
          '" tabindex="' +
          (activeTab === value7 ? '0' : '-1') +
          '">' +
          renderWorkspaceAssetTabIcon(value7) +
          '<span class="story-asset-tab-label">' +
          value8 +
          '</span><span class="story-asset-tab-count">' +
          value9 +
          '</span></button>',
      )
      .join(''),
    calloutTitle: calloutTitle
      ? showVoiceLibraryConfirm
        ? '为「' + error.name + '」添加声音'
        : '音频素材'
      : previewAppearance
        ? '从总素材加入项目'
        : readOnly
          ? '项目场景素材'
          : '上传人物基础形象',
    calloutDescription: calloutTitle
      ? showVoiceLibraryConfirm
        ? '请选择音频，再点击「设为角色声音参考」。'
        : '这里只显示已加入当前项目的音频；上传会先保存到总素材再加入项目。'
      : previewAppearance
        ? allowDeleteAssetCard.assetSelectionMode
          ? allowDeleteAssetCard.selectedAssetIds.length
            ? '已选择 ' + allowDeleteAssetCard.selectedAssetIds.length + ' 项素材'
            : '点击图片或音频进行多选，或拖动鼠标框选。'
          : '单击素材可查看详情；点击加入到项目后，选择人物、场景或音频。'
        : readOnly
          ? allowDeleteAssetCard.assetSelectionMode
            ? '已选择 ' + allowDeleteAssetCard.selectedAssetIds.length + ' 项'
            : '从总素材加入的场景可在图像替换中作为画面参考。'
          : allowDeleteAssetCard.assetSelectionMode
            ? '已选择 ' + allowDeleteAssetCard.selectedAssetIds.length + ' 项'
            : '上传的第一张图片作为基础形象；后续生成会新增形象。',
    calloutActionsHtml: calloutActionsHtml,
    cardsHtml: cardsHtml,
    emptyText: calloutTitle
      ? '当前项目暂无音频，请从总素材加入或上传音频'
      : previewAppearance
        ? '总素材中暂无可用素材'
        : readOnly
          ? '请先从总素材加入场景'
          : '请先上传人物基础形象',
    detailHtml:
      normalizeText(record?.mediaKind).toLowerCase() === 'audio'
        ? renderPersonReplacementAudioAssetDetail(record, {
            characters: characters.characters,
            isLibrary: previewAppearance,
            boundCharacters: getPersonReplacementVoiceLibraryBoundCharacters(characters, record),
            selectedCharacterId: showVoiceLibraryConfirm ? error?.id || '' : '',
          })
        : renderPersonReplacementAssetDetail(allowDeleteAssetCard, record, {
            showEmptyDescription: previewAppearance || readOnly,
            readOnly: readOnly,
            ...args3,
          }),
    footerHtml: footerHtml.footerHtml || '',
    splitRatio: allowDeleteAssetCard.assetSplitRatio,
  });
}
