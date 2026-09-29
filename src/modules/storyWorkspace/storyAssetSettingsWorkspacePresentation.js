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
function normalizeText(_0x500a52) {
  return String(_0x500a52 ?? '')['trim']();
}
export function isStoryAddedAssetAppearance(_0x55c3cf = {}) {
  return ['library', 'upload']['includes'](normalizeText(_0x55c3cf?.['sourceOrigin']));
}
export function removeStoryAddedAssetAppearance(_0x48b582 = {}, _0x1f522e = '') {
  const _0xda8c87 = getStoryAssetAppearances(_0x48b582),
    _0x4502eb = normalizeText(_0x1f522e),
    _0x336839 = _0xda8c87['findIndex']((_0x403f3f) => normalizeText(_0x403f3f?.['id']) === _0x4502eb),
    _0x261d71 = _0xda8c87[_0x336839] || null;
  if (_0xda8c87['length'] <= 0x1 || _0x336839 < 0x0 || !isStoryAddedAssetAppearance(_0x261d71))
    return {
      removed: ![],
      removedAppearance: null,
      removedIndex: -0x1,
      nextIndex: Math['max'](0x0, Math['min'](_0xda8c87['length'] - 0x1, _0x336839)),
    };
  return (
    (_0x48b582['appearances'] = _0xda8c87['filter']((_0x2b26fe, _0x50e95d) => _0x50e95d !== _0x336839)),
    normalizeText(_0x48b582['baseAppearanceId']) === _0x4502eb &&
      ((_0x48b582['baseAppearanceId'] = ''), ensureStoryAssetBaseAppearance(_0x48b582)),
    {
      removed: !![],
      removedAppearance: _0x261d71,
      removedIndex: _0x336839,
      nextIndex: Math['max'](0x0, Math['min'](_0x48b582['appearances']['length'] - 0x1, _0x336839)),
    }
  );
}
const STORY_VISUAL_ASSET_KINDS = ['character', 'scene', 'prop'];
export function clearStoryAssetAppearanceImage(_0x4f0aa5 = {}, _0x52399b = '') {
  const _0x191ffb = getStoryAssetAppearances(_0x4f0aa5),
    _0xd56c51 = _0x191ffb['findIndex']((_0x5b49a7) => _0x5b49a7['id'] === _0x52399b),
    _0x10770a = _0x191ffb[_0xd56c51];
  if (!_0x10770a || !normalizeText(_0x10770a['imageUrl'])) return { removed: ![] };
  return (
    (_0x10770a['imageUrl'] = ''),
    (_0x10770a['generatedImage'] = null),
    (_0x10770a['generatedImages'] = []),
    (_0x10770a['activeIndex'] = 0x0),
    (_0x10770a['error'] = ''),
    { removed: !![], nextIndex: _0xd56c51 }
  );
}
export function getMissingStoryAssetImages(_0x59a758 = []) {
  return (Array['isArray'](_0x59a758) ? _0x59a758 : [])['flatMap']((_0x57f317) => {
    const _0x4752e0 = normalizeText(_0x57f317?.['kind']);
    if (!STORY_VISUAL_ASSET_KINDS['includes'](_0x4752e0)) return [];
    const _0x3723cb = getStoryAssetAppearances(_0x57f317),
      _0x333379 = _0x3723cb['length'] ? _0x3723cb : [_0x57f317];
    return _0x333379['filter']((_0x3087da) => !normalizeText(_0x3087da?.['imageUrl']))['map'](
      (_0xe04196) => ({
        kind: _0x4752e0,
        assetId: normalizeText(_0x57f317?.['id']),
        assetName: normalizeText(_0x57f317?.['name']),
        appearanceId: normalizeText(_0xe04196?.['id']),
        appearanceName: normalizeText(_0xe04196?.['name']),
      }),
    );
  });
}
export function buildMissingStoryAssetImageWarning(_0x458dc4 = []) {
  const _0x5a6db8 = { character: '角色', scene: '场景', prop: '道具' },
    _0x5d966a = STORY_VISUAL_ASSET_KINDS['map']((_0x1d27d5) => {
      const _0x24f689 = (Array['isArray'](_0x458dc4) ? _0x458dc4 : [])['filter'](
        (_0x4a89ae) => _0x4a89ae?.['kind'] === _0x1d27d5,
      )['length'];
      return _0x24f689 ? _0x5a6db8[_0x1d27d5] + '\x20' + _0x24f689 + '\x20张' : '';
    })['filter'](Boolean);
  if (!_0x5d966a['length']) return '';
  return (
    '检测到缺少图片：' +
    _0x5d966a['join']('、') +
    '。跳过后，这些素材不会作为分镜视频的图片参考。是否跳过并继续？'
  );
}
export function createStoryAssetSettingsWorkspacePresentation({
  projection: _0x41a372,
  presentation: _0x3c3f4e,
  getTabLabel: getTabLabel = (_0x26ebd9) => _0x26ebd9,
  renderTabIcon: renderTabIcon = () => '',
  renderPageFooter: renderPageFooter = () => '',
} = {}) {
  if (!_0x41a372 || !_0x3c3f4e)
    throw new TypeError(
      'Story\x20asset\x20settings\x20workspace\x20requires\x20projection\x20and\x20presentation\x20owners.',
    );
  const _0x445aa7 = (_0x3a9268) => {
      if (_0x3a9268['assetFilter'] === 'audio') return getStoryProjectAudioAssets(_0x3a9268['data']);
      if (_0x3a9268['assetFilter'] === 'library')
        return buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] });
      return _0x3a9268['data']['assets']['filter'](
        (_0x1c287f) => _0x1c287f['kind'] === _0x3a9268['assetFilter'],
      );
    },
    _0x2c84b4 = (_0x588512 = {}) =>
      normalizeText(_0x588512?.['mediaKind'])['toLowerCase']() === 'image' &&
      Boolean(normalizeText(_0x588512?.['sourceUrl'] || _0x588512?.['imageUrl'])),
    _0xe086f9 = (_0x28edff = {}, _0x8e3271 = []) => {
      const _0x37cb76 = new Set(
        (Array['isArray'](_0x8e3271) ? _0x8e3271 : [])
          ['filter'](_0x2c84b4)
          ['map']((_0x1410af) => normalizeText(_0x1410af?.['id']))
          ['filter'](Boolean),
      );
      return (Array['isArray'](_0x28edff['selectedAssetIds']) ? _0x28edff['selectedAssetIds'] : [])
        ['map'](normalizeText)
        ['filter']((_0x119355) => _0x37cb76['has'](_0x119355));
    },
    _0x8422e8 = (_0x2510af, _0x464c18) =>
      _0x464c18['find']((_0x5078a5) => _0x5078a5['id'] === _0x2510af['selectedAssetId']) ||
      _0x464c18[0x0] ||
      null,
    _0x1ad485 = (_0x4ef0bb, _0x2d1ab4) => {
      const _0x7f57cf = Number(_0x4ef0bb['assetAppearanceIndexes']?.[_0x2d1ab4?.['id']]),
        _0x31c6c5 = Math['max'](0x0, getStoryAssetAppearances(_0x2d1ab4)['length'] - 0x1);
      return Math['max'](
        0x0,
        Math['min'](_0x31c6c5, Number['isFinite'](_0x7f57cf) ? Math['trunc'](_0x7f57cf) : 0x0),
      );
    },
    _0x1a3ffe = (_0x5afd6d, _0x45a6f7) =>
      _0x45a6f7?.['isLibraryAsset']
        ? _0x45a6f7
        : getStoryAssetAppearance(_0x45a6f7, _0x1ad485(_0x5afd6d, _0x45a6f7)),
    _0x4abadf = (_0x1a88c7 = {}, _0x4a9f55 = {}) => {
      const _0x58821b = normalizeText(_0x1a88c7?.['id']),
        _0xf5f92c = normalizeText(_0x4a9f55?.['id']);
      return _0x58821b && _0xf5f92c ? _0x58821b + ':' + _0xf5f92c : '';
    },
    _0x4002b7 = isStoryAddedAssetAppearance,
    _0x2df3e2 = (
      _0x16093f,
      _0x23f4e6,
      {
        previewAppearance: previewAppearance = null,
        statusText: statusText = '',
        cardStatusHtml: cardStatusHtml = '',
        draggable: draggable = ![],
        cardClassName: cardClassName = '',
        cardAttributes: cardAttributes = '',
        shellClassName: shellClassName = '',
        accessoryHtml: accessoryHtml = '',
        cardMetaHtml: cardMetaHtml = '',
        cardMediaHtml: cardMediaHtml = renderStoryReplicationAssetComparison(_0x16093f, _0x23f4e6),
        fallbackImageUrl: fallbackImageUrl = '',
        workspaceAssetLibraryImage: workspaceAssetLibraryImage = ![],
      } = {},
    ) =>
      _0x3c3f4e['renderAssetSurface']({
        kind: 'card',
        card: _0x41a372['projectAssetCard'](_0x16093f, _0x23f4e6, {
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
    _0xca99ad = (_0x2537ce) =>
      _0x3c3f4e['renderAssetSurface']({ kind: 'appearance-arrow', direction: _0x2537ce }),
    _0x224528 = (_0x456bdd = {}, { disabled: disabled = ![] } = {}) =>
      _0x3c3f4e['renderAssetSurface']({
        kind: 'reference-input',
        reference: { referenceImageUrl: _0x456bdd['referenceImageUrl'], disabled: disabled },
      }),
    _0xd7e800 = (_0x3fc4f0, { action: action = '', label: label = '', className: className = '' } = {}) =>
      renderWorkspacePreviewArrow(_0x3fc4f0, {
        action: action,
        label: label,
        className: className,
        actionAttributes: { 'data-story-action': action },
      }),
    _0x3c1e5c = (_0x1f2fb7) =>
      _0xd7e800(_0x1f2fb7, {
        action: _0x1f2fb7 === 'previous' ? 'previous-clip' : 'next-clip',
        label: _0x1f2fb7 === 'previous' ? '上一幕' : '下一幕',
        className: 'story-clip-navigation-arrow',
      }),
    _0xc43093 = new Set(['mp3', 'wav', 'm4a']),
    _0x45e257 = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a']),
    _0x686e66 = (_0x5eb44f) => {
      const _0x19c827 = normalizeText(_0x5eb44f?.['name'])['toLowerCase'](),
        _0x47fa46 = _0x19c827['includes']('.') ? _0x19c827['split']('.')['pop']() : '',
        _0x541e99 = normalizeText(_0x5eb44f?.['type'])['toLowerCase']();
      return _0xc43093['has'](_0x47fa46) || _0x45e257['has'](_0x541e99);
    },
    _0x3c7504 = (_0x45e989 = {}) =>
      _0x3c3f4e['renderAssetControls']({
        kind: 'batch-generation',
        control: _0x41a372['projectAssetControl']('batch-generation', { state: _0x45e989 }),
      }),
    _0x424c8f = (_0xd52362 = {}, _0x10a6ac = {}) =>
      _0x3c3f4e['renderAssetControls']({
        kind: 'prompt-generation',
        control: _0x41a372['projectAssetControl']('prompt-generation', {
          state: _0xd52362,
          generationControl: _0x10a6ac,
        }),
      }),
    _0x15c9dc = ({
      selectedCount: selectedCount = 0x0,
      projectAssets: projectAssets = [],
      showCount: showCount = !![],
    } = {}) => {
      const _0x3ba441 = _0x41a372['projectAssetControl']('library-selection', {
        selectionMode: showCount,
        selectedCount: selectedCount,
        projectAssets: projectAssets,
        getTabLabel: getTabLabel,
      });
      return _0x3c3f4e['renderAssetControls']({
        kind: 'library-add',
        control: { ..._0x3ba441, showCount: showCount },
      });
    },
    _0x272bcc = ({
      selectionMode: selectionMode = ![],
      selectedCount: selectedCount = 0x0,
      allSelected: allSelected = ![],
      projectAssets: projectAssets = [],
    } = {}) =>
      _0x3c3f4e['renderAssetControls']({
        kind: 'library-selection',
        control: _0x41a372['projectAssetControl']('library-selection', {
          selectionMode: selectionMode,
          selectedCount: selectedCount,
          allSelected: allSelected,
          projectAssets: projectAssets,
          getTabLabel: getTabLabel,
        }),
      }),
    _0x518bab = (_0x2310e5, _0x1d88b0 = {}) => {
      if (typeof _0x2310e5?.['classList']?.['toggle'] !== 'function') return ![];
      const _0x146ae7 = hasStoryCharacterVoiceReference(_0x1d88b0);
      return (
        _0x2310e5['classList']['toggle']('has-reference', _0x146ae7),
        _0x2310e5['classList']['toggle']('is-missing', !_0x146ae7),
        !![]
      );
    },
    _0x144ac5 = (_0x494007 = ![]) =>
      _0x3c3f4e['renderAssetSurface']({ kind: 'voice-icon', hasVoice: _0x494007 }),
    _0x58655c = (_0x129459) =>
      _0x3c3f4e['renderAssetSurface']({
        kind: 'voice-player',
        voicePlayer: _0x41a372['projectAssetControl']('voice-player', { asset: _0x129459 }),
      }),
    _0x3fc801 = (_0x36e080, _0xc78edf = {}) => {
      const _0x5d0294 = _0x36e080?.['querySelector']?.('.story-asset-caption-title');
      if (!_0x5d0294) return ![];
      _0x5d0294['querySelector']?.('[data-story-character-voice-player]')?.['remove']?.();
      const _0xb581c3 = _0x58655c(_0xc78edf);
      if (_0xb581c3) _0x5d0294['insertAdjacentHTML']('beforeend', _0xb581c3);
      return !![];
    },
    _0x3ba73c = ({
      state: state = {},
      asset: asset = {},
      appearance: appearance = {},
      generationControl: generationControl = {},
      readOnly: readOnly = ![],
    } = {}) =>
      _0x3c3f4e['renderAssetSurface']({
        kind: 'preview-actions',
        actions: _0x41a372['projectAssetControl']('preview-actions', {
          state: state,
          asset: asset,
          appearance: appearance,
          generationControl: generationControl,
          readOnly: readOnly,
        }),
      }),
    _0x5aea27 = (
      _0x585e97,
      _0x356775,
      { showEmptyDescription: showEmptyDescription = !![], readOnly: readOnly = ![] } = {},
    ) =>
      _0x3c3f4e['renderAssetSurface']({
        kind: 'detail',
        detail: {
          ..._0x41a372['projectAssetDetail'](_0x585e97, _0x356775, {
            showEmptyDescription: showEmptyDescription,
            readOnly: readOnly,
          }),
          detailSplitRatio: normalizeStoryAssetDetailSplitRatio(_0x585e97['assetDetailSplitRatio']),
        },
      }),
    _0x291783 = (_0x11ca30) => {
      const _0x689a03 = _0x445aa7(_0x11ca30),
        _0x3eeb0b =
          _0x11ca30['assetFilter'] === 'library'
            ? _0x689a03['filter']((_0x320071) => _0x2c84b4(_0x320071) || isStoryAudioAsset(_0x320071))
            : _0x689a03,
        _0x91a246 =
          _0x3eeb0b['length'] > 0x0 &&
          _0x3eeb0b['every']((_0x40a413) => _0x11ca30['selectedAssetIds']['includes'](_0x40a413['id'])),
        _0x4396d9 = _0x8422e8(_0x11ca30, _0x689a03);
      _0x4396d9 &&
        _0x11ca30['selectedAssetId'] !== _0x4396d9['id'] &&
        (_0x11ca30['selectedAssetId'] = _0x4396d9['id']);
      const _0x48811d = _0x11ca30['assetFilter'] === 'library' ? _0xe086f9(_0x11ca30, _0x689a03) : [],
        _0x51b837 = _0x11ca30['data']['assets']['filter']((_0xa58ced) => _0xa58ced['kind'] === 'character')[
          'length'
        ],
        _0x548e64 = _0x11ca30['data']['assets']['filter']((_0x4df6d9) => _0x4df6d9['kind'] === 'scene')[
          'length'
        ],
        _0x3603e0 = _0x11ca30['data']['assets']['filter']((_0xfdd287) => _0xfdd287['kind'] === 'prop')[
          'length'
        ],
        _0x4b9ddd = buildWorkspaceAssetLibraryItems({ allowedTypes: ['image', 'audio'] })['length'],
        _0x4a3472 = (_0x4a21c0) =>
          isStoryAudioAsset(_0x4a21c0)
            ? _0x2df3e2(
                _0x11ca30,
                { ..._0x4a21c0, isLibraryAsset: !![], imageUrl: '', role: '音频素材' },
                {
                  cardMediaHtml: renderStoryAudioArtwork(),
                  statusText:
                    '已绑定 ' +
                    getStoryAudioBoundCharacters(_0x11ca30['data'], _0x4a21c0)['length'] +
                    ' 个角色',
                },
              )
            : _0x2df3e2(_0x11ca30, _0x4a21c0, {
                cardMediaHtml:
                  _0x11ca30['assetFilter'] !== 'library'
                    ? renderStoryReplicationAssetComparison(_0x11ca30, _0x4a21c0)
                    : '',
                previewAppearance:
                  _0x11ca30['assetFilter'] === 'library'
                    ? { ..._0x4a21c0, imageUrl: _0x4a21c0['thumbnailUrl'] || _0x4a21c0['imageUrl'] }
                    : null,
                fallbackImageUrl: _0x11ca30['assetFilter'] === 'library' ? _0x4a21c0['sourceUrl'] : '',
                workspaceAssetLibraryImage: _0x11ca30['assetFilter'] === 'library',
              }),
        _0x33b4ab =
          _0x11ca30['assetFilter'] === 'library'
            ? (_0x11ca30['assetLibraryDisclosure'] || createWorkspaceAssetLibraryDisclosure())['render']({
                assets: _0x689a03,
                renderAsset: _0x4a3472,
              })
            : _0x689a03['map'](_0x4a3472)['join'](''),
        _0x3907ca = !![],
        _0x20203c = renderStoryAudioActions(
          _0x11ca30,
          _0x689a03,
          storyAudioUploads['has'](_0x11ca30['data']),
        );
      return renderWorkspaceAssetSettingsShell({
        className: 'story-workspace-assets-page',
        calloutInHeading: _0x3907ca,
        headingInListColumn: _0x3907ca,
        calloutStatus:
          _0x3907ca && _0x11ca30['assetSelectionMode']
            ? '已选择\x20' + _0x11ca30['selectedAssetIds']['length'] + '\x20项'
            : '',
        activeTab: _0x11ca30['assetFilter'],
        tabCount: 0x5,
        tabsHtml: [
          ['character', _0x51b837],
          ['scene', _0x548e64],
          ['prop', _0x3603e0],
          ['audio', getStoryProjectAudioAssets(_0x11ca30['data'])['length']],
          ['library', _0x4b9ddd],
        ]
          ['map'](
            ([_0x1226ed, _0x24594d]) =>
              '<button type="button" class="' +
              (_0x11ca30['assetFilter'] === _0x1226ed ? 'is-active' : '') +
              '" data-story-asset-filter="' +
              _0x1226ed +
              '" role="tab" aria-selected="' +
              (_0x11ca30['assetFilter'] === _0x1226ed) +
              '" tabindex="' +
              (_0x11ca30['assetFilter'] === _0x1226ed ? '0' : '-1') +
              '\x22>' +
              renderTabIcon(_0x1226ed) +
              '<span class="story-asset-tab-label">' +
              getTabLabel(_0x1226ed) +
              '</span><span class="story-asset-tab-count">' +
              _0x24594d +
              '</span></button>',
          )
          ['join'](''),
        calloutTitle:
          _0x11ca30['assetFilter'] === 'audio'
            ? '项目音频素材'
            : _0x11ca30['assetFilter'] === 'character'
              ? '生成或导入角色形象'
              : _0x11ca30['assetFilter'] === 'scene'
                ? '生成或导入场景设定'
                : _0x11ca30['assetFilter'] === 'prop'
                  ? '生成或导入道具设定'
                  : '从总素材加入项目',
        calloutDescription:
          _0x11ca30['assetFilter'] === 'audio'
            ? '显示已加入当前项目的音频；上传会先保存到总素材，再加入项目。'
            : _0x11ca30['assetFilter'] === 'library'
              ? _0x11ca30['assetSelectionMode']
                ? _0x11ca30['selectedAssetIds']['length']
                  ? '已选择 ' + _0x11ca30['selectedAssetIds']['length'] + ' 张图片'
                  : '点击素材进行多选，或拖动鼠标框选。'
                : '选中素材后加入项目；支持框选多选。'
              : _0x11ca30['assetSelectionMode']
                ? '已选择 ' + _0x11ca30['selectedAssetIds']['length'] + '\x20项'
                : _0x11ca30['assetFilter'] === 'character'
                  ? '多形象角色会先确定基础形象，再以其作为参考生成其他形象。'
                  : '每项素材保留一张可复用的设定图。',
        calloutActionsHtml:
          _0x11ca30['assetFilter'] === 'audio'
            ? renderWorkspaceAssetSelectionActions({
                selectedCount: _0x11ca30['selectedAssetIds']['length'],
                allSelected: _0x91a246,
                primaryActionHtml: _0x20203c,
              })
            : _0x11ca30['assetFilter'] === 'library'
              ? _0x20203c
                ? renderWorkspaceAssetSelectionActions({
                    selectionMode: _0x11ca30['assetSelectionMode'],
                    selectedCount: _0x11ca30['selectedAssetIds']['length'],
                    allSelected: _0x91a246,
                    primaryActionHtml:
                      _0x20203c +
                      (_0x48811d['length']
                        ? _0x15c9dc({
                            selectedCount: _0x48811d['length'],
                            projectAssets: _0x11ca30['data']['assets'],
                          })
                        : ''),
                    selectAllLabel: '全选素材',
                  })
                : _0x272bcc({
                    selectionMode: _0x11ca30['assetSelectionMode'],
                    selectedCount: _0x48811d['length'],
                    allSelected: _0x91a246,
                    projectAssets: _0x11ca30['data']['assets'],
                  })
              : (_0x11ca30['assetSelectionMode'] && _0x11ca30['selectedAssetIds']['length'] > 0x1) ||
                  _0x11ca30['isBatchGenerating']
                ? '<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-story-action=\x22toggle-all-assets\x22\x20aria-pressed=\x22' +
                  _0x91a246 +
                  '\x22\x20' +
                  (_0x689a03['length'] ? '' : 'disabled') +
                  '>' +
                  (_0x91a246 ? '取消全选' : '全选') +
                  '</button>' +
                  _0x3c7504(_0x11ca30)
                : renderWorkspaceAssetSelectionActions(),
        cardsHtml: _0x33b4ab,
        emptyText:
          _0x11ca30['assetFilter'] === 'audio' ? '当前项目暂无音频，请从总素材加入或上传音频' : '暂无素材',
        detailHtml:
          _0x11ca30['assetFilter'] === 'audio' || isStoryAudioAsset(_0x4396d9)
            ? renderStoryAudioDetail(_0x11ca30, _0x4396d9)
            : _0x5aea27(_0x11ca30, _0x4396d9),
        footerHtml: renderPageFooter(_0x11ca30, {
          nextLabel:
            _0x11ca30['data']?.['project']?.['sourceMode'] === 'video-replication'
              ? _0x11ca30['data']['episodes']['length'] === 0x1
                ? _0x11ca30['data']['episodes'][0x0]['clips']?.['length']
                  ? '进入视频制作'
                  : '生成分段提示词'
                : '下一步：视频列表'
              : '生成分镜视频',
        }),
        splitRatio: normalizeStoryAssetSplitRatio(_0x11ca30['assetSplitRatio']),
      });
    };
  return Object['freeze']({
    getAppearanceActionKey: _0x4abadf,
    getLibraryActionAssetIds: _0xe086f9,
    getSelectedAppearance: _0x1a3ffe,
    getSelectedAppearanceIndex: _0x1ad485,
    getSelectedAsset: _0x8422e8,
    getVisibleAssets: _0x445aa7,
    isAddedAppearance: _0x4002b7,
    isLibraryImageAsset: _0x2c84b4,
    isSupportedCharacterVoiceFile: _0x686e66,
    renderAppearanceArrow: _0xca99ad,
    renderAssetBatchGenerationControl: _0x3c7504,
    renderAssetCard: _0x2df3e2,
    renderAssetDetail: _0x5aea27,
    renderAssetPreviewActions: _0x3ba73c,
    renderAssetPromptGenerationControl: _0x424c8f,
    renderAssetReferenceInput: _0x224528,
    renderAssetsPage: _0x291783,
    renderClipNavigationArrow: _0x3c1e5c,
    renderLibraryAddToProjectControl: _0x15c9dc,
    renderLibrarySelectionActions: _0x272bcc,
    renderPreviewArrow: _0xd7e800,
    renderVoiceIcon: _0x144ac5,
    syncCharacterVoiceCapsuleState: _0x518bab,
    syncCharacterVoicePlayerState: _0x3fc801,
  });
}
