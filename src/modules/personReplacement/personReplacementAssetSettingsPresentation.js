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
function normalizeText(_0x31c3ef) {
  return String(_0x31c3ef ?? '')['trim']();
}
function escapeHtml(_0x223ebf) {
  return String(_0x223ebf ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function normalizeMediaUrl(_0x3a62f2) {
  const _0x4d7f10 = normalizeText(_0x3a62f2);
  if (!_0x4d7f10) return '';
  return localPathToUrl(_0x4d7f10) || _0x4d7f10;
}
function normalizeProjectAssetMediaForRender(_0x1c8130 = {}) {
  return {
    ..._0x1c8130,
    appearances: getWorkspaceAssetAppearances(_0x1c8130)['map']((_0x211ab7) => ({
      ..._0x211ab7,
      imageUrl: normalizeMediaUrl(_0x211ab7['imageUrl']),
      referenceImageUrl: normalizeMediaUrl(_0x211ab7['referenceImageUrl']),
    })),
  };
}
function getCharacterVoiceUrl(_0x19f8d7 = {}) {
  return normalizeMediaUrl(
    _0x19f8d7['voiceReference']?.['audioUrl'] ||
      _0x19f8d7['voiceReference']?.['localPath'] ||
      _0x19f8d7['voiceRef'],
  );
}
function renderVoiceReferenceStatus(_0x34f6da = {}, _0x2c4673 = '') {
  const _0x3ac5a5 = Boolean(getCharacterVoiceUrl(_0x34f6da));
  return (
    '<span class="person-replacement-target-voice-status' +
    (_0x2c4673 ? '\x20' + escapeHtml(_0x2c4673) : '') +
    '\x20' +
    (_0x3ac5a5 ? 'has-reference' : 'is-missing') +
    '"><i aria-hidden="true"></i>' +
    (_0x3ac5a5 ? '有声音参考' : '无声音参考') +
    '</span>'
  );
}
export const PERSON_REPLACEMENT_LIBRARY_TARGETS = Object['freeze']([
  { kind: 'character', label: '人物' },
  { kind: 'scene', label: '场景' },
  { kind: 'audio', label: '音频' },
]);
export function getPersonReplacementSelectableAssets(_0x213112, _0x4c227f) {
  if (_0x4c227f === 'library')
    return _0x213112['libraryAssets']['filter'](
      (_0x336231) =>
        (normalizeText(_0x336231?.['mediaKind'])['toLowerCase']() === 'image' &&
          normalizeText(_0x336231?.['sourceUrl'] || _0x336231?.['imageUrl'])) ||
        (normalizeText(_0x336231?.['mediaKind'])['toLowerCase']() === 'audio' &&
          getPersonReplacementLibraryAudioRef(_0x336231)),
    );
  if (_0x4c227f === 'audio') return getPersonReplacementProjectAudioAssets(_0x213112);
  return _0x4c227f === 'scene' ? _0x213112['scenes'] : _0x213112['characters'];
}
export function renderPersonReplacementAssetSettingsPage(_0x20a201, _0x2253a7 = {}) {
  const _0x222d44 = ['character', 'scene', 'audio', 'library']['includes'](
      _0x20a201['workspace']['characterAssetTab'],
    )
      ? _0x20a201['workspace']['characterAssetTab']
      : 'character',
    _0x3d534e = _0x222d44 === 'library',
    _0xaa214d = _0x222d44 === 'scene',
    _0x9ac240 = _0x222d44 === 'audio',
    _0x1ff73c = new Set(
      Array['isArray'](_0x2253a7['assetUploadPendingKinds']) ? _0x2253a7['assetUploadPendingKinds'] : [],
    ),
    _0x2c4d9f = getPersonReplacementProjectAudioAssets(_0x20a201),
    _0x692f55 = normalizeText(_0x2253a7['voiceLibraryTargetCharacterId']),
    _0x2aac37 = {
      ..._0x20a201,
      characters: _0x20a201['characters']['map'](normalizeProjectAssetMediaForRender),
      scenes: _0x20a201['scenes']['map'](normalizeProjectAssetMediaForRender),
    },
    _0xfb16a7 = _0x2aac37['characters']['find']((_0x3486af) => _0x3486af['id'] === _0x692f55) || null,
    _0x89154c = _0x9ac240 && Boolean(_0xfb16a7),
    _0x425368 = buildPersonReplacementAssetViewState(_0x2aac37);
  _0x89154c &&
    ((_0x425368['selectedAssetIds'] = [_0x425368['selectedAssetId']]),
    (_0x425368['assetSelectionMode'] = ![]));
  _0x425368['isBatchGenerating'] = _0x2253a7['assetBatchGenerationActive'] === !![];
  const _0x259122 = _0x425368['assetSelectionMode'] && _0x425368['selectedAssetIds']['length'] > 0x1;
  ((_0x425368['batchGenerationLabel'] = normalizeText(_0x2253a7['assetBatchGenerationLabel'])),
    (_0x425368['batchCancelRequested'] = _0x2253a7['assetBatchCancelRequested'] === !![]),
    (_0x425368['batchGeneratingAssetIds'] = Array['isArray'](_0x2253a7['assetBatchGeneratingCharacterIds'])
      ? _0x2253a7['assetBatchGeneratingCharacterIds']
      : []),
    (_0x425368['batchCancelAction'] = 'cancel-asset-batch-generation'));
  const _0x4dbe9e = _0x425368['data']['assets'],
    _0x4cafd3 = _0x4dbe9e['find']((_0x10d911) => _0x10d911['id'] === _0x425368['selectedAssetId']) || null,
    _0x205d9c = getPersonReplacementSelectableAssets(_0x2aac37, _0x222d44),
    _0x3fe444 =
      _0x205d9c['length'] > 0x0 &&
      _0x205d9c['every']((_0x5a7019) => _0x425368['selectedAssetIds']['includes'](_0x5a7019['id'])),
    _0x18d4a5 = _0x3d534e
      ? _0x205d9c['filter']((_0x38dc58) => _0x425368['selectedAssetIds']['includes'](_0x38dc58['id']))
      : [],
    _0x344b80 = _0x18d4a5['length'],
    _0x513d54 = _0x2253a7['assetLibraryDisclosure'] || createWorkspaceAssetLibraryDisclosure(),
    _0x399dca = (_0xc586ec) => {
      const _0x3dbde0 = !_0x3d534e && !_0xaa214d && !_0x9ac240,
        _0x534bdd = _0x3dbde0 ? getWorkspaceAssetAppearanceStats(_0xc586ec) : null,
        _0x1692fa = getPersonReplacementVoiceLibraryBoundCharacters(_0x20a201, _0xc586ec);
      if (normalizeText(_0xc586ec?.['mediaKind'])['toLowerCase']() === 'audio')
        return renderPersonReplacementAudioAssetCard(
          { ..._0x425368, allowDeleteAssetCard: _0x425368['allowDeleteAssetCard'] && !_0x89154c },
          _0xc586ec,
          { boundCharacters: _0x1692fa, showVoiceLibraryConfirm: _0x89154c },
        );
      return renderPersonReplacementAssetCard(_0x425368, _0xc586ec, {
        cardAttributes:
          !_0x3d534e && getWorkspaceAssetAppearances(_0xc586ec)['length'] > 0x1
            ? 'data-story-card-appearance-wheel="' + escapeHtml(_0xc586ec['id']) + '\x22'
            : '',
        previewAppearance: _0x3d534e
          ? { ..._0xc586ec, imageUrl: _0xc586ec['thumbnailUrl'] || _0xc586ec['imageUrl'] }
          : getWorkspaceAssetAppearances(_0xc586ec)[
              _0x425368['assetAppearanceIndexes']?.[_0xc586ec['id']] || 0x0
            ],
        accessoryHtml:
          !_0x3d534e && getWorkspaceAssetAppearances(_0xc586ec)['length'] > 0x1
            ? renderWorkspaceCardAppearanceNavigation({
                attributes: { 'data-story-card-appearance-wheel': _0xc586ec['id'] },
                previousAttributes: {
                  'data-story-action': 'previous-appearance',
                  'data-story-card-appearance-id': _0xc586ec['id'],
                },
                nextAttributes: {
                  'data-story-action': 'next-appearance',
                  'data-story-card-appearance-id': _0xc586ec['id'],
                },
              })
            : '',
        fallbackImageUrl: _0x3d534e ? _0xc586ec['sourceUrl'] : '',
        workspaceAssetLibraryImage: _0x3d534e,
        statusText: _0x3dbde0
          ? (_0x425368['assetAppearanceIndexes']?.[_0xc586ec['id']] || 0x0) + 0x1 + ' / ' + _0x534bdd['total']
          : '',
        cardClassName: _0x3dbde0
          ? 'person-replacement-character-asset-card workspace-portrait-card'
          : !_0x3d534e && _0xaa214d
            ? 'workspace-portrait-card'
            : '',
        headingAccessoryHtml: _0x3dbde0
          ? renderWorkspaceCardVoiceStatus(Boolean(getCharacterVoiceUrl(_0xc586ec)))
          : '',
      });
    },
    _0x2e315a = _0x3d534e
      ? _0x513d54['render']({ assets: _0x4dbe9e, renderAsset: _0x399dca })
      : _0x4dbe9e['map'](_0x399dca)['join'](''),
    _0x2d2dc2 =
      _0x18d4a5['length'] && _0x18d4a5['every']((_0x1623c8) => _0x1623c8['mediaKind'] === 'audio')
        ? '<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x22\x20data-person-replacement-action=\x22add-library-assets-to-project\x22\x20data-person-replacement-library-target-kind=\x22audio\x22>加入到音频项目' +
          (_0x425368['assetSelectionMode'] ? '\x20(' + _0x344b80 + ')' : '') +
          '</button>'
        : '<div\x20class=\x22story-asset-batch-menu-wrap\x20story-library-add-menu-wrap\x20person-replacement-library-add-menu-wrap\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20story-asset-batch-trigger\x22\x20data-person-replacement-action=\x22toggle-library-add-targets\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22\x20' +
          (_0x344b80 ? '' : 'disabled') +
          '><span class="story-asset-batch-trigger-label">加入到项目' +
          (_0x425368['assetSelectionMode'] && _0x344b80 ? '\x20(' + _0x344b80 + ')' : '') +
          '</span></button>\n    <div class="story-asset-batch-menu story-library-add-menu" role="menu" aria-label="选择加入项目的素材分类" aria-hidden="true">\n      ' +
          PERSON_REPLACEMENT_LIBRARY_TARGETS['map'](
            ({ kind: _0x55c86a, label: _0x242a2d }) =>
              '<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-person-replacement-action=\x22add-library-assets-to-project\x22\x20data-person-replacement-library-target-kind=\x22' +
              _0x55c86a +
              '"><span class="story-asset-batch-mode-icon">' +
              renderWorkspaceAssetTabIcon(_0x55c86a) +
              '</span><span>' +
              _0x242a2d +
              '</span></button>',
          )['join']('') +
          '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>',
    _0x259403 = (_0x145a2c, _0x3c30bf, _0x5919c) => {
      const _0x535c3c = _0x1ff73c['has'](_0x145a2c);
      return (
        '<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-person-replacement-action=\x22' +
        _0x5919c +
        '\x22' +
        (_0x535c3c ? ' aria-busy="true" disabled' : '') +
        '>' +
        (_0x535c3c
          ? '<span class="storyboard-script-loading-spinner" aria-hidden="true"></span><span>上传中…</span>'
          : '上传' + _0x3c30bf) +
        '</button>'
      );
    },
    _0x190c9d = {
      detailSplitRatio: _0x425368['assetDetailSplitRatio'],
      detailSplitterHtml:
        typeof _0x2253a7['renderDetailSplitter'] === 'function'
          ? _0x2253a7['renderDetailSplitter'](_0x425368['assetDetailSplitRatio'])
          : '',
    },
    _0x1d1702 = _0x9ac240
      ? _0x89154c
        ? '<button type="button" class="story-secondary-button" data-person-replacement-action="cancel-character-voice-library">取消</button>'
        : renderWorkspaceAssetSelectionActions({
            selectedCount: _0x425368['selectedAssetIds']['length'],
            allSelected: _0x3fe444,
            primaryActionHtml: _0x259403('audio', '音频', 'choose-new-audio-files'),
          })
      : renderWorkspaceAssetSelectionActions({
          compactTrigger: ![],
          selectionMode: _0x425368['assetSelectionMode'],
          selectedCount: _0x425368['selectedAssetIds']['length'],
          allSelected: _0x3fe444,
          primaryActionHtml: _0x3d534e
            ? _0x2d2dc2
            : _0xaa214d
              ? _0x259122
                ? ''
                : _0x259403('scene', '场景', 'choose-new-scene-images')
              : _0x259122 || _0x425368['isBatchGenerating']
                ? renderPersonReplacementBatchGenerationControl(_0x425368)
                : _0x259403('character', '人物', 'choose-new-character-images'),
          selectAllLabel: _0x3d534e ? '全选素材' : '全选',
          clearSelectionLabel: '取消全选',
        });
  return renderWorkspaceAssetSettingsShell({
    className: 'person-replacement-assets-page',
    calloutInHeading: !![],
    headingInListColumn: !![],
    calloutStatus: _0x425368['assetSelectionMode']
      ? '已选择\x20' + _0x425368['selectedAssetIds']['length'] + '\x20项'
      : '',
    activeTab: _0x222d44,
    tabCount: 0x4,
    tabsHtml: [
      ['character', '人物', _0x20a201['characters']['length']],
      ['scene', '场景', _0x20a201['scenes']['length']],
      ['audio', '音频', _0x2c4d9f['length']],
      ['library', '总素材', _0x20a201['libraryAssets']['length']],
    ]
      ['map'](
        ([_0x392b0b, _0x5084cd, _0x446e7d]) =>
          '<button type="button" class="' +
          (_0x222d44 === _0x392b0b ? 'is-active' : '') +
          '\x22\x20data-person-replacement-action=\x22select-character-asset-tab\x22\x20data-asset-tab=\x22' +
          _0x392b0b +
          '" role="tab" aria-selected="' +
          (_0x222d44 === _0x392b0b) +
          '" tabindex="' +
          (_0x222d44 === _0x392b0b ? '0' : '-1') +
          '\x22>' +
          renderWorkspaceAssetTabIcon(_0x392b0b) +
          '<span\x20class=\x22story-asset-tab-label\x22>' +
          _0x5084cd +
          '</span><span class="story-asset-tab-count">' +
          _0x446e7d +
          '</span></button>',
      )
      ['join'](''),
    calloutTitle: _0x9ac240
      ? _0x89154c
        ? '为「' + _0xfb16a7['name'] + '」添加声音'
        : '音频素材'
      : _0x3d534e
        ? '从总素材加入项目'
        : _0xaa214d
          ? '项目场景素材'
          : '上传人物基础形象',
    calloutDescription: _0x9ac240
      ? _0x89154c
        ? '请选择音频，再点击「设为角色声音参考」。'
        : '这里只显示已加入当前项目的音频；上传会先保存到总素材再加入项目。'
      : _0x3d534e
        ? _0x425368['assetSelectionMode']
          ? _0x425368['selectedAssetIds']['length']
            ? '已选择 ' + _0x425368['selectedAssetIds']['length'] + ' 项素材'
            : '点击图片或音频进行多选，或拖动鼠标框选。'
          : '单击素材可查看详情；点击加入到项目后，选择人物、场景或音频。'
        : _0xaa214d
          ? _0x425368['assetSelectionMode']
            ? '已选择 ' + _0x425368['selectedAssetIds']['length'] + '\x20项'
            : '从总素材加入的场景可在图像替换中作为画面参考。'
          : _0x425368['assetSelectionMode']
            ? '已选择 ' + _0x425368['selectedAssetIds']['length'] + '\x20项'
            : '上传的第一张图片作为基础形象；后续生成会新增形象。',
    calloutActionsHtml: _0x1d1702,
    cardsHtml: _0x2e315a,
    emptyText: _0x9ac240
      ? '当前项目暂无音频，请从总素材加入或上传音频'
      : _0x3d534e
        ? '总素材中暂无可用素材'
        : _0xaa214d
          ? '请先从总素材加入场景'
          : '请先上传人物基础形象',
    detailHtml:
      normalizeText(_0x4cafd3?.['mediaKind'])['toLowerCase']() === 'audio'
        ? renderPersonReplacementAudioAssetDetail(_0x4cafd3, {
            characters: _0x20a201['characters'],
            isLibrary: _0x3d534e,
            boundCharacters: getPersonReplacementVoiceLibraryBoundCharacters(_0x20a201, _0x4cafd3),
            selectedCharacterId: _0x89154c ? _0xfb16a7?.['id'] || '' : '',
          })
        : renderPersonReplacementAssetDetail(_0x425368, _0x4cafd3, {
            showEmptyDescription: _0x3d534e || _0xaa214d,
            readOnly: _0xaa214d,
            ..._0x190c9d,
          }),
    footerHtml: _0x2253a7['footerHtml'] || '',
    splitRatio: _0x425368['assetSplitRatio'],
  });
}
