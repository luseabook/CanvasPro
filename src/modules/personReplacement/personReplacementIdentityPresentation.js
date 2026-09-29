import { renderWorkspaceActionIcon } from '../workspaceActionIcons.js';
import { renderVideoReferenceBarMarkup } from '../../components/video-node/promptInputSurface.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolvePersonReplacementLocationGuidePreview } from './personReplacementLocationGuideSvg.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import {
  buildPersonReplacementAssetViewState,
  renderPersonReplacementAssetCard,
  renderPersonReplacementPreviewArrow,
} from './personReplacementAssetPresentation.js';
import {
  PERSON_REPLACEMENT_ORIENTATIONS,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  formatPersonReplacementScopeLabel,
  normalizePersonReplacementScope,
} from './personReplacementProject.js';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';
import {
  getPersonReplacementIdentityCorrectionDraftKey,
  resolvePersonReplacementDetectionLabel,
} from './personReplacementSourceIdentity.js';
const PERSON_REPLACEMENT_ORIENTATION_LABELS = Object['freeze']({
  front: '正面',
  back: '背面',
  side: '侧面',
  left_profile: '左侧面',
  right_profile: '右侧面',
  three_quarter_left: '左前侧',
  three_quarter_right: '右前侧',
  over_shoulder_left: '左过肩',
  over_shoulder_right: '右过肩',
  unknown: '待确认',
});
function escapeHtml(_0x324962) {
  return String(_0x324962 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x48ef30, _0x1807cd = '') {
  const _0x457adf = String(_0x48ef30 ?? '')['trim']();
  return _0x457adf || _0x1807cd;
}
function normalizeMediaUrl(_0x4b3f20) {
  const _0x43bd60 = normalizeText(_0x4b3f20);
  return _0x43bd60 ? localPathToUrl(_0x43bd60) || _0x43bd60 : '';
}
function formatPersonOrientation(_0x3f19da) {
  return (
    PERSON_REPLACEMENT_ORIENTATION_LABELS[normalizeText(_0x3f19da)] ||
    PERSON_REPLACEMENT_ORIENTATION_LABELS['unknown']
  );
}
function getCharacterAppearance(_0x198685, _0x4c5915 = '') {
  const _0x355a5d = getWorkspaceAssetAppearances(_0x198685);
  return (
    _0x355a5d['find']((_0x5999ca) => _0x5999ca['id'] === _0x4c5915) ||
    getWorkspaceAssetBaseAppearance(_0x198685) ||
    _0x355a5d[0x0] ||
    null
  );
}
function normalizeProjectAssetMediaForRender(_0x54d18c = {}) {
  return {
    ..._0x54d18c,
    appearances: getWorkspaceAssetAppearances(_0x54d18c)['map']((_0x3d543d) => ({
      ..._0x3d543d,
      imageUrl: normalizeMediaUrl(_0x3d543d['imageUrl']),
      referenceImageUrl: normalizeMediaUrl(_0x3d543d['referenceImageUrl']),
    })),
  };
}
function renderPersonReplacementVoiceReferenceStatus(_0x28c95c = {}, _0x44cc79 = '') {
  const _0x1cdbca = normalizeMediaUrl(
      _0x28c95c['voiceReference']?.['audioUrl'] ||
        _0x28c95c['voiceReference']?.['localPath'] ||
        _0x28c95c['voiceRef'],
    ),
    _0x3504fe = Boolean(_0x1cdbca);
  return (
    '<span class="person-replacement-target-voice-status' +
    (_0x44cc79 ? '\x20' + escapeHtml(_0x44cc79) : '') +
    '\x20' +
    (_0x3504fe ? 'has-reference' : 'is-missing') +
    '\x22><i\x20aria-hidden=\x22true\x22></i>' +
    (_0x3504fe ? '有声音参考' : '无声音参考') +
    '</span>'
  );
}
function renderPersonDetectionPicker({
  kind: _0x9140a9,
  value: _0x28860a,
  label: _0x130139,
  ariaLabel: _0x1efb30,
  customInputValue: customInputValue = '',
  sourceCharacterId: sourceCharacterId = '',
} = {}) {
  const _0x254522 = normalizeText(_0x28860a),
    _0x22593a = normalizeText(_0x130139, '请选择'),
    _0x57bb87 = _0x9140a9 === 'label',
    _0x3fcce9 = _0x57bb87
      ? 'data-person-replacement-person-label'
      : _0x9140a9 === 'scope'
        ? 'data-person-replacement-person-scope'
        : 'data-person-replacement-person-orientation';
  return (
    '<span class="person-replacement-detection-picker is-' +
    escapeHtml(_0x9140a9) +
    '\x22\x20data-person-replacement-detection-picker=\x22' +
    escapeHtml(_0x9140a9) +
    '">\n    <button type="button" class="person-replacement-detection-picker-trigger" data-person-replacement-action="toggle-detection-picker" data-person-replacement-detection-picker-trigger="' +
    escapeHtml(_0x9140a9) +
    '\x22\x20' +
    _0x3fcce9 +
    '\x20value=\x22' +
    escapeHtml(_0x254522) +
    '\x22' +
    (_0x57bb87
      ? ' data-person-replacement-selected-source-character-id="' + escapeHtml(sourceCharacterId) + '\x22'
      : '') +
    ' aria-label="' +
    escapeHtml(_0x1efb30) +
    '\x22\x20aria-haspopup=\x22listbox\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20data-person-replacement-detection-picker-value>' +
    escapeHtml(_0x22593a) +
    '</span><span class="story-project-sort-chevron" aria-hidden="true"></span>\n    </button>\n    ' +
    (_0x57bb87
      ? '<input type="text" class="person-replacement-detection-name-input" value="' +
        escapeHtml(customInputValue || _0x22593a) +
        '" maxlength="24" placeholder="输入人物名称" aria-label="自定义人物名称" data-person-replacement-person-custom-label hidden>'
      : '') +
    '\n    <div class="story-project-sort-menu person-replacement-detection-picker-menu" data-person-replacement-detection-picker-menu data-person-replacement-picker-options-lazy="true" role="listbox" aria-label="' +
    escapeHtml(_0x1efb30) +
    '选项" aria-hidden="true"></div>\n  </span>'
  );
}
function renderPersonDetectionPickerOptions(_0x508bde = [], _0x1e1fbb = '') {
  const _0x4b3d50 = normalizeText(_0x1e1fbb);
  return (Array['isArray'](_0x508bde) ? _0x508bde : [])
    ['map']((_0x36ce14) => {
      const _0x5b95dc = normalizeText(_0x36ce14?.['value']),
        _0x4701ae = normalizeText(_0x36ce14?.['label'], _0x5b95dc),
        _0x5da939 = _0x5b95dc === _0x4b3d50,
        _0x22d909 = _0x36ce14?.['deletable']
          ? '<button type="button" class="person-replacement-detection-picker-option-delete" data-person-replacement-action="delete-detection-custom-label" data-person-replacement-custom-label="' +
            escapeHtml(_0x5b95dc) +
            '" aria-label="删除自定义名称' +
            escapeHtml(_0x4701ae) +
            '\x22>' +
            renderWorkspaceActionIcon('delete') +
            '</button>'
          : '',
        _0x2a0369 = _0x36ce14?.['sourceCharacterId']
          ? ' data-person-replacement-source-character-id="' +
            escapeHtml(_0x36ce14['sourceCharacterId']) +
            '\x22'
          : '';
      return (
        '<span class="person-replacement-detection-picker-option-row' +
        (_0x36ce14?.['deletable'] ? '\x20is-deletable' : '') +
        '"><button type="button" class="story-project-sort-option' +
        (_0x5da939 ? ' is-selected' : '') +
        '" data-person-replacement-action="select-detection-picker-option" data-person-replacement-detection-picker-option="' +
        escapeHtml(_0x5b95dc) +
        '\x22' +
        _0x2a0369 +
        ' role="option" aria-selected="' +
        _0x5da939 +
        '"><span>' +
        escapeHtml(_0x4701ae) +
        '</span></button>' +
        _0x22d909 +
        '</span>'
      );
    })
    ['join']('');
}
function renderPersonMappingScopeMenu({
  personLabel: personLabel = '当前人物',
  targetName: targetName = '目标人物',
  appearanceName: appearanceName = '当前形象',
} = {}) {
  return (
    '<div class="person-replacement-mapping-scope-menu" data-person-replacement-mapping-scope-menu role="menu" aria-label="选择人物形象应用范围">\n    <div class="person-replacement-mapping-scope-heading">\n      <strong>' +
    escapeHtml(personLabel) +
    ' 已有绑定</strong>\n      <small>' +
    escapeHtml(targetName) +
    ' · ' +
    escapeHtml(appearanceName) +
    '</small>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-mapping-scope-option\x22\x20data-person-replacement-action=\x22confirm-person-mapping-scope\x22\x20data-person-replacement-mapping-scope=\x22current\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-mapping-scope-option-copy\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-mapping-scope-option-title\x22>仅当前片段</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<small\x20class=\x22person-replacement-mapping-scope-option-subtitle\x22>只替换这个片段中的人物形象</small>\x0a\x20\x20\x20\x20\x20\x20</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-mapping-scope-option\x22\x20data-person-replacement-action=\x22confirm-person-mapping-scope\x22\x20data-person-replacement-mapping-scope=\x22all\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-mapping-scope-option-copy\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-mapping-scope-option-title\x22>应用全部片段</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<small\x20class=\x22person-replacement-mapping-scope-option-subtitle\x22>同步替换该人物在所有片段中的形象</small>\x0a\x20\x20\x20\x20\x20\x20</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20</div>'
  );
}
function hasTargetAssetBinding(_0x25a3b1, _0x2f04e3) {
  const _0x4d9058 = Array['isArray'](_0x2f04e3?.['referenceImages']) ? _0x2f04e3['referenceImages'] : [];
  return _0x4d9058['some'](
    (_0x25bf72) =>
      _0x25bf72['role'] === 'target-character' && _0x25bf72['targetCharacterId'] === _0x25a3b1['id'],
  );
}
function renderTargetAssetGroup(_0xc8fafa, _0x30126c, _0xba22cf) {
  const _0x3a49e0 = _0x30126c === 'scene',
    _0x56ddcf = _0x3a49e0 ? _0xc8fafa['scenes'] : _0xc8fafa['characters'],
    _0x55dbb1 = _0x56ddcf['map'](normalizeProjectAssetMediaForRender),
    _0x1c36a4 = {
      ...buildPersonReplacementAssetViewState({
        ..._0xc8fafa,
        characters: _0x3a49e0 ? _0xc8fafa['characters'] : _0x55dbb1,
        scenes: _0x3a49e0 ? _0x55dbb1 : _0xc8fafa['scenes'],
        workspace: { ..._0xc8fafa['workspace'], characterAssetTab: _0x30126c },
      }),
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      assetSelectionStyle: 'single',
      assetSelectionMode: ![],
      selectedAssetIds: [],
    },
    _0x426a59 = _0x55dbb1['map']((_0x1a621e) => {
      const _0x592d1b = getWorkspaceAssetAppearances(_0x1a621e),
        _0x44d7ac = _0x592d1b['filter']((_0x15ddbc) => _0x15ddbc['imageUrl']),
        _0x355d03 = Math['max'](
          0x0,
          Math['min'](
            _0x592d1b['length'] - 0x1,
            Math['trunc'](Number(_0xc8fafa['workspace']['assetAppearanceIndexes']?.[_0x1a621e['id']]) || 0x0),
          ),
        ),
        _0x1c8bb6 = _0x592d1b[_0x355d03]?.['id'],
        _0x82b66b = Math['max'](
          0x0,
          _0x44d7ac['findIndex']((_0x4e231f) => _0x4e231f['id'] === _0x1c8bb6),
        );
      return {
        asset: _0x1a621e,
        appearances: _0x44d7ac,
        appearance: _0x44d7ac[_0x82b66b] || null,
        selectedIndex: _0x82b66b,
      };
    })['filter']((_0x3ddf0d) => _0x3ddf0d['appearance']),
    _0x1b5444 = _0x426a59['map'](
      ({ asset: _0x146fd7, appearances: _0x518622, appearance: _0x12d44d, selectedIndex: _0x1f6267 }) => {
        if (_0x3a49e0)
          return renderPersonReplacementAssetCard(_0x1c36a4, _0x146fd7, {
            previewAppearance: _0x12d44d,
            statusText: '场景图\x20' + (_0x1f6267 + 0x1) + '/' + _0x518622['length'],
            draggable: !![],
            cardClassName: 'person-replacement-target-asset person-replacement-scene-reference-asset',
            cardAttributes:
              'data-person-replacement-replacement-asset-kind="scene" data-person-replacement-target-scene-id="' +
              escapeHtml(_0x146fd7['id']) +
              '" data-person-replacement-target-scene-appearance-id="' +
              escapeHtml(_0x12d44d['id']) +
              '\x22\x20aria-label=\x22' +
              escapeHtml('拖拽' + _0x146fd7['name'] + '到首帧画面作为场景参考') +
              '\x22',
            shellClassName: 'person-replacement-target-asset-shell',
          });
        const _0x1db297 = _0x518622['length'] > 0x1,
          _0x1c8d20 = _0x1db297
            ? '<span class="person-replacement-target-appearance-controls" data-person-replacement-target-controls="' +
              escapeHtml(_0x146fd7['id']) +
              '" data-story-asset-hover-id="' +
              escapeHtml(_0x146fd7['id']) +
              '\x22>' +
              renderPersonReplacementPreviewArrow('previous', {
                action: 'target-previous-appearance',
                label: _0x146fd7['name'] + '上一个形象',
                className: 'person-replacement-target-appearance-arrow',
              }) +
              renderPersonReplacementPreviewArrow('next', {
                action: 'target-next-appearance',
                label: _0x146fd7['name'] + '下一个形象',
                className: 'person-replacement-target-appearance-arrow',
              }) +
              '</span>'
            : '',
          _0x567af6 = hasTargetAssetBinding(_0x146fd7, _0xba22cf);
        return renderPersonReplacementAssetCard(_0x1c36a4, _0x146fd7, {
          previewAppearance: _0x12d44d,
          statusText: '形象 ' + (_0x1f6267 + 0x1) + '/' + _0x518622['length'],
          cardMetaHtml: renderPersonReplacementVoiceReferenceStatus(_0x146fd7),
          draggable: !![],
          cardClassName:
            'person-replacement-target-asset' + (_0x567af6 ? ' has-person-replacement-input' : ''),
          cardAttributes:
            'data-person-replacement-target-character-id="' +
            escapeHtml(_0x146fd7['id']) +
            '\x22\x20data-person-replacement-target-appearance-id=\x22' +
            escapeHtml(_0x12d44d['id']) +
            '" data-person-replacement-target-appearance-index="' +
            _0x1f6267 +
            '" data-person-replacement-target-appearance-count="' +
            _0x518622['length'] +
            '" data-person-replacement-target-appearance-wheel="' +
            _0x1db297 +
            '\x22\x20aria-label=\x22拖拽' +
            escapeHtml(_0x146fd7['name']) +
            '的' +
            escapeHtml(_0x12d44d['name']) +
            '到视频人物框"',
          shellClassName: 'person-replacement-target-asset-shell',
          accessoryHtml: _0x1c8d20,
        });
      },
    )['join']('');
  if (_0x3a49e0 && !_0x1b5444) return '';
  const _0x55f3e7 = _0x3a49e0 ? '场景' : '角色',
    _0x59fa37 = '请先在素材设定上传基础形象';
  return (
    '<div\x20class=\x22person-replacement-target-asset-group\x22\x20data-person-replacement-target-asset-group=\x22' +
    _0x30126c +
    '" role="group" aria-labelledby="person-replacement-target-asset-group-' +
    _0x30126c +
    '">\n    <h3 class="person-replacement-target-asset-group-heading" id="person-replacement-target-asset-group-' +
    _0x30126c +
    '\x22>' +
    _0x55f3e7 +
    '：</h3>\n    <div class="person-replacement-target-asset-group-items">' +
    (_0x1b5444 || '<p\x20class=\x22person-replacement-inline-empty\x22>' + _0x59fa37 + '</p>') +
    '</div>\n  </div>'
  );
}
function renderTargetAssetRail(_0x1bb9be, _0x3e58cc) {
  const _0x3d77b9 = _0x3e58cc?.['promptPackage'] || null;
  return (
    '<aside class="person-replacement-target-assets">\n    <div class="person-replacement-target-assets-heading">\n      <strong>替换素材</strong>\n      <small>拖拽角色到首帧人物框；拖拽场景到首帧画面</small>\n    </div>\n    <div class="person-replacement-target-asset-list">\n      ' +
    renderTargetAssetGroup(_0x1bb9be, 'character', _0x3d77b9) +
    '\n      ' +
    renderTargetAssetGroup(_0x1bb9be, 'scene', _0x3d77b9) +
    '\n    </div>\n  </aside>'
  );
}
function renderVideoReplacementReferenceRail(_0x2fc662, _0x10b094) {
  const _0x2ec007 = _0x10b094?.['shot'] || null,
    _0x2b53f1 = _0x10b094?.['imageInput'] || {},
    _0x25d859 = Array['isArray'](_0x2b53f1['referenceOptions']) ? _0x2b53f1['referenceOptions'] : [],
    _0x3c01ff = Math['trunc'](Number(_0x2b53f1['activeReferenceIndex'])),
    _0x9686a5 = _0x2b53f1['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    _0x580f2b = _0x9686a5
      ? '包含上一轮全部图像替换结果与当前镜头的角色绑定图'
      : '来自上一轮图像替换的全部片段结果',
    _0x2795e5 = _0x25d859['map']((_0x7818b5, _0x8668ad) => {
      const _0x561e4c = _0x7818b5['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
        _0x4c58d8 = _0x7818b5['reference'] || {},
        _0x542b1b = normalizeText(_0x7818b5['sourceShotId']),
        _0x44d661 = Math['max'](0x0, Math['trunc'](Number(_0x7818b5['sourceShotIndex']) || 0x0)),
        _0x1e1ac8 = Math['max'](0x0, Math['trunc'](Number(_0x7818b5['resultIndex']) || 0x0)),
        _0x3b3496 = Math['max'](0x1, Math['trunc'](Number(_0x7818b5['resultCount']) || 0x1)),
        _0x462b27 = _0x561e4c
          ? normalizeText(_0x4c58d8['characterName']) || '人物参考图'
          : '片段' + (_0x44d661 + 0x1) + '.图片' + (_0x1e1ac8 + 0x1),
        _0x8be8ae = _0x561e4c
          ? '角色绑定图 · ' + (normalizeText(_0x4c58d8['appearanceName']) || '基础形象')
          : '图像替换结果',
        _0xe60a06 = _0x561e4c
          ? '<small>' + escapeHtml(_0x8be8ae) + '</small>'
          : '<span class="person-replacement-video-reference-status" aria-label="图像替换结果 ' +
            (_0x1e1ac8 + 0x1) +
            '/' +
            _0x3b3496 +
            '\x22>' +
            escapeHtml(_0x8be8ae) +
            '\x20' +
            (_0x1e1ac8 + 0x1) +
            '/' +
            _0x3b3496 +
            '</span>',
        _0x4036b5 = normalizeMediaUrl(_0x7818b5['imageRef']),
        _0x14eaf0 = _0x8668ad === _0x3c01ff,
        _0x470fe1 = _0x4036b5
          ? ' data-story-asset-hover-id="' +
            escapeHtml(_0x542b1b || _0x2ec007?.['id'] || '') +
            '" data-person-replacement-video-reference-hover-preview="true"'
          : '',
        _0x3c3182 = _0x561e4c
          ? normalizeText(_0x4c58d8['personId'] || _0x4c58d8['characterId'] + ':' + _0x4c58d8['appearanceId'])
          : '',
        _0x3b721e = _0x561e4c ? 'character:' + _0x3c3182 : 'shot:' + _0x542b1b,
        _0x51b838 = _0x561e4c
          ? ''
          : '\x20data-person-replacement-video-reference-source-shot-id=\x22' +
            escapeHtml(_0x542b1b) +
            '" data-person-replacement-video-reference-result-index="' +
            _0x1e1ac8 +
            '" data-person-replacement-video-reference-result-count="' +
            _0x3b3496 +
            '\x22' +
            (_0x3b3496 > 0x1 ? ' data-person-replacement-video-reference-wheel="true"' : ''),
        _0x240640 =
          !_0x561e4c && _0x3b3496 > 0x1
            ? '<span class="person-replacement-target-appearance-controls person-replacement-video-reference-controls" data-person-replacement-video-reference-controls="' +
              escapeHtml(_0x542b1b) +
              '" data-person-replacement-video-reference-result-index="' +
              _0x1e1ac8 +
              '\x22>' +
              renderPersonReplacementPreviewArrow('previous', {
                action: 'video-reference-previous-result',
                label: _0x462b27 + '的上一张图片',
                className:
                  'person-replacement-target-appearance-arrow\x20person-replacement-video-reference-arrow',
              }) +
              renderPersonReplacementPreviewArrow('next', {
                action: 'video-reference-next-result',
                label: _0x462b27 + '的下一张图片',
                className:
                  'person-replacement-target-appearance-arrow person-replacement-video-reference-arrow',
              }) +
              '</span>'
            : '',
        _0x418653 =
          '<span\x20class=\x22story-asset-card-shell\x20person-replacement-target-asset-shell\x20person-replacement-video-reference-shell\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-video-reference-card\x20' +
          (_0x14eaf0 ? 'is-selected' : '') +
          '" data-story-action="select-video-shot-reference" data-shot-id="' +
          escapeHtml(_0x2ec007?.['id'] || '') +
          '\x22\x20data-person-replacement-video-reference-index=\x22' +
          _0x8668ad +
          '" data-person-replacement-video-reference-key="' +
          escapeHtml(_0x3b721e) +
          '" data-person-replacement-video-reference-kind="' +
          escapeHtml(_0x7818b5['kind']) +
          '\x22' +
          (_0x561e4c
            ? '\x20data-person-replacement-video-character-reference=\x22' + escapeHtml(_0x3c3182) + '\x22'
            : '') +
          _0x51b838 +
          _0x470fe1 +
          '\x20aria-pressed=\x22' +
          _0x14eaf0 +
          '\x22\x20aria-label=\x22' +
          escapeHtml(
            '选择' +
              _0x462b27 +
              '作为视频替换参考图' +
              (_0x3b3496 > 0x1 && !_0x561e4c ? '，可滚动鼠标滚轮切换图片' : ''),
          ) +
          '\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-video-reference-media\x22>' +
          (_0x4036b5
            ? '<img src="' +
              escapeHtml(_0x4036b5) +
              '" alt="' +
              escapeHtml(_0x462b27) +
              '" loading="lazy" decoding="async" draggable="false">'
            : '') +
          '</span>\n      <span class="person-replacement-video-reference-copy' +
          (_0x561e4c ? '' : ' has-result-status') +
          '\x22><strong>' +
          escapeHtml(_0x462b27) +
          '</strong>' +
          _0xe60a06 +
          '</span>\n      <span class="person-replacement-video-reference-selection" aria-hidden="true"' +
          (_0x14eaf0 ? '' : ' hidden') +
          '>当前</span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20' +
          _0x240640 +
          '\x0a\x20\x20\x20\x20</span>';
      return { cardHtml: _0x418653, characterReferenceId: _0x3c3182, isCharacterReference: _0x561e4c };
    }),
    _0x20b44f = _0x2795e5['filter'](({ isCharacterReference: _0x2415c6 }) => !_0x2415c6)
      ['map'](({ cardHtml: _0x2016e6 }) => _0x2016e6)
      ['join'](''),
    _0x46917c = new Map(
      _0x2795e5['filter'](({ isCharacterReference: _0x25d5de }) => _0x25d5de)['map']((_0x589ba2) => [
        _0x589ba2['characterReferenceId'],
        _0x589ba2['cardHtml'],
      ]),
    ),
    _0x4c9acc = Array['isArray'](_0x2b53f1['references'])
      ? _0x2b53f1['references']['filter']((_0x46d467) => normalizeText(_0x46d467?.['imageRef']))
      : [],
    _0x248e72 = _0x4c9acc['map']((_0x1bff1f) => {
      const _0x332210 = normalizeText(
          _0x1bff1f['personId'] || _0x1bff1f['characterId'] + ':' + _0x1bff1f['appearanceId'],
        ),
        _0x5d35ab = _0x46917c['get'](_0x332210);
      return _0x5d35ab || '';
    })['join'](''),
    _0x4c5821 =
      _0x9686a5 && _0x4c9acc['length'] > 0x1
        ? '<p class="person-replacement-reference-note">每次生成使用一张人物参考图，请选择本次入参。</p>'
        : '',
    _0x4743d4 = ({
      kind: _0x30bf5d,
      label: _0x49ee7c,
      cardsHtml: _0xd9685b,
      emptyText: _0x1be88b,
      noteHtml: noteHtml = '',
    }) =>
      '<section class="person-replacement-target-asset-group person-replacement-video-reference-group" data-person-replacement-video-reference-group="' +
      escapeHtml(_0x30bf5d) +
      '" role="group" aria-label="' +
      escapeHtml(_0x49ee7c) +
      '">\n      <h3 class="person-replacement-target-asset-group-heading">' +
      escapeHtml(_0x49ee7c) +
      '：</h3>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-target-asset-group-items\x22>' +
      (_0xd9685b || '<p\x20class=\x22person-replacement-inline-empty\x22>' + escapeHtml(_0x1be88b) + '</p>') +
      noteHtml +
      '</div>\n    </section>',
    _0x595ec7 = _0x9686a5
      ? _0x4743d4({
          kind: 'character',
          label: '人物参考',
          cardsHtml: _0x248e72,
          emptyText: '当前片段没有已绑定的人物参考图',
          noteHtml: _0x4c5821,
        })
      : '',
    _0x4863de = _0x4743d4({
      kind: 'first-frame',
      label: '首帧参考',
      cardsHtml: _0x20b44f,
      emptyText: '请先在图像替换中生成替换首帧',
    });
  return (
    '<aside class="person-replacement-target-assets person-replacement-video-reference-assets">\n    <div class="person-replacement-target-assets-heading"><strong>替换参考图</strong><small>' +
    escapeHtml(_0x580f2b) +
    '</small></div>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-target-asset-list\x20person-replacement-video-reference-list\x22\x20data-person-replacement-video-reference-list\x20tabindex=\x220\x22>' +
    _0x595ec7 +
    _0x4863de +
    '</div>\n  </aside>'
  );
}
function renderDetectionBox(
  _0x5941bd,
  _0x7f900a,
  _0xff8594,
  { duplicateRoleLabels: duplicateRoleLabels = new Set() } = {},
) {
  const _0x3319e8 = _0x5941bd['locator']?.['bbox'] || _0x5941bd['bbox'];
  if (!_0x3319e8) return '';
  const _0x5801ae = _0x5941bd['detectionMethod'] === 'manual',
    _0x3a3bef = normalizeText(_0xff8594['workspace']['selectedShotId']),
    _0x51852d = getPersonReplacementIdentityCorrectionDraftKey(_0x3a3bef, _0x5941bd['id']),
    _0x5caa8d = _0xff8594['workspace']['identityCorrectionDrafts'][_0x51852d] || {},
    _0x211096 = _0xff8594['characters']['find'](
      (_0x23f90) => _0x23f90['id'] === _0x5941bd['targetCharacterId'],
    ),
    _0x402072 = _0x211096 ? getCharacterAppearance(_0x211096, _0x5941bd['targetAppearanceId']) : null,
    _0x1095aa =
      _0x5941bd['identityReviewStatus'] === 'needs_review' || _0x5941bd['identityReviewRequired'] === !![],
    _0x1bc6cc = Object['keys'](_0x5caa8d)['length'] > 0x0,
    _0x423dab = normalizeText(_0x5caa8d['orientation'], normalizeText(_0x5941bd['orientation'])),
    _0xc56cea = formatPersonOrientation(_0x423dab),
    _0x1bc380 = resolvePersonReplacementDetectionLabel(_0x5941bd, _0x7f900a, _0xff8594, _0x3a3bef),
    _0x851e38 = duplicateRoleLabels['has'](_0x1bc380),
    _0xcca52b = normalizeText(_0x5caa8d['sourceCharacterId'], normalizeText(_0x5941bd['sourceCharacterId'])),
    _0x2632da = _0x851e38 ? '角色名重复' : _0x211096 ? '已绑定' : '未绑定',
    _0x53c8f8 =
      PERSON_REPLACEMENT_ORIENTATIONS['includes'](_0x423dab) && _0x423dab !== 'unknown' ? _0x423dab : '',
    _0x23e9b3 = normalizePersonReplacementScope(_0x5941bd['replacementScope']),
    _0x98ae6f = formatPersonReplacementScopeLabel(_0x23e9b3),
    _0x1a847a = _0x1095aa || _0x1bc6cc || (PERSON_REPLACEMENT_ORIENTATION_ENABLED && !_0x53c8f8),
    _0x861c8 = PERSON_REPLACEMENT_ORIENTATION_ENABLED
      ? '<span class="person-replacement-detection-separator" aria-hidden="true">·</span>' +
        renderPersonDetectionPicker({
          kind: 'orientation',
          value: _0x53c8f8,
          label: _0x53c8f8 ? _0xc56cea : '选择朝向',
          ariaLabel: '人物朝向：' + (_0x53c8f8 ? _0xc56cea : '待选择'),
        })
      : '',
    _0x320683 =
      '<span class="person-replacement-detection-separator" aria-hidden="true">·</span>' +
      renderPersonDetectionPicker({
        kind: 'scope',
        value: _0x23e9b3,
        label: _0x98ae6f,
        ariaLabel: '替换范围：' + _0x98ae6f,
      }),
    _0xb0c7a6 = !_0x211096 ? 'is-unready' : _0x1a847a ? 'is-partially-ready' : 'is-ready',
    _0x13cdaa =
      '' +
      renderPersonDetectionPicker({
        kind: 'label',
        value: _0x1bc380,
        label: _0x1bc380,
        ariaLabel: '人物名称：' + _0x1bc380,
        customInputValue: _0x1bc380,
        sourceCharacterId: _0xcca52b,
      }) +
      _0x320683 +
      _0x861c8 +
      '<span class="person-replacement-detection-separator" aria-hidden="true">·</span><span class="person-replacement-detection-binding-status ' +
      (_0x851e38 ? 'is-conflict' : _0x211096 ? 'is-bound' : 'is-unbound') +
      '\x22>' +
      _0x2632da +
      '</span>',
    _0xde9d5f =
      _0x211096 && _0x402072?.['imageUrl']
        ? ' data-story-asset-hover-id="' +
          escapeHtml(_0x211096['id']) +
          '" data-story-asset-hover-appearance-id="' +
          escapeHtml(_0x402072['id']) +
          '\x22'
        : '',
    _0x3ddb37 =
      '<button type="button" class="story-action-icon-button is-danger person-replacement-detection-delete-action" data-person-replacement-action="delete-person" data-shot-id="' +
      escapeHtml(_0xff8594['workspace']['selectedShotId']) +
      '" data-person-id="' +
      escapeHtml(_0x5941bd['id']) +
      '" aria-label="删除' +
      escapeHtml(_0x1bc380) +
      '检测框">' +
      renderWorkspaceActionIcon('delete') +
      '</button>',
    _0x269ba1 = ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se']
      ['map'](
        (_0x202b97) =>
          '<span class="person-replacement-manual-resize-handle is-' +
          _0x202b97 +
          '\x22\x20data-person-replacement-manual-resize=\x22' +
          _0x202b97 +
          '" aria-hidden="true"></span>',
      )
      ['join'](''),
    _0x3bbca6 = _0x5801ae
      ? ' data-person-replacement-manual-person tabindex="0" aria-keyshortcuts="Delete D"'
      : ' tabindex="0" aria-keyshortcuts="Delete D"',
    _0x4a2371 =
      '<svg\x20class=\x22person-replacement-detection-readiness-border\x22\x20width=\x22100%\x22\x20height=\x22100%\x22\x20aria-hidden=\x22true\x22\x20focusable=\x22false\x22><rect\x20class=\x22person-replacement-detection-readiness-stroke\x22></rect></svg>';
  return (
    '<div class="person-replacement-detection-box has-identity-controls is-movable ' +
    (_0x211096 ? 'is-mapped' : '') +
    '\x20' +
    (_0x1095aa ? 'needs-identity-review' : '') +
    '\x20' +
    (_0x1a847a ? 'is-identity-editing' : '') +
    '\x20' +
    _0xb0c7a6 +
    '\x20' +
    (_0x5801ae ? 'is-manual' : '') +
    '\x20' +
    (_0x851e38 ? 'has-role-conflict' : '') +
    '" style="--box-x:' +
    _0x3319e8['x'] * 0x64 +
    '%;--box-y:' +
    _0x3319e8['y'] * 0x64 +
    '%;--box-width:' +
    _0x3319e8['width'] * 0x64 +
    '%;--box-height:' +
    _0x3319e8['height'] * 0x64 +
    '%\x22\x20data-person-replacement-person-drop' +
    _0xde9d5f +
    _0x3bbca6 +
    ' data-person-id="' +
    escapeHtml(_0x5941bd['id']) +
    '" data-shot-id="' +
    escapeHtml(_0x3a3bef) +
    '" aria-label="' +
    escapeHtml(_0x851e38 ? _0x1bc380 + '，角色名重复' : _0x1bc380) +
    '\x22' +
    (_0x851e38 ? '\x20aria-invalid=\x22true\x22' : '') +
    '>' +
    _0x4a2371 +
    '<div class="person-replacement-detection-label"><span class="person-replacement-detection-summary">' +
    _0x13cdaa +
    '</span><span\x20class=\x22person-replacement-detection-actions\x22>' +
    _0x3ddb37 +
    '</span></div>' +
    (_0x211096
      ? '<div class="person-replacement-mapping-badge"><span class="person-replacement-mapping-badge-text">→ ' +
        escapeHtml(_0x211096['name']) +
        ' · ' +
        escapeHtml(_0x402072?.['name'] || '基础形象') +
        '</span><button\x20type=\x22button\x22\x20class=\x22story-action-icon-button\x20is-danger\x20story-project-delete-trigger\x20person-replacement-mapping-remove\x20person-replacement-detection-delete-action\x22\x20data-person-replacement-action=\x22clear-person-mapping\x22\x20data-shot-id=\x22' +
        escapeHtml(_0x3a3bef) +
        '" data-person-id="' +
        escapeHtml(_0x5941bd['id']) +
        '" aria-label="解除' +
        escapeHtml(_0x1bc380) +
        '的人物绑定">' +
        renderWorkspaceActionIcon('unlink') +
        '</button></div>'
      : '<div\x20class=\x22person-replacement-mapping-badge\x22>拖入目标形象</div>') +
    _0x269ba1 +
    '</div>'
  );
}
function renderVideoReplacementReferenceInputs(_0x208872) {
  const _0x2df42c = _0x208872?.['slotState'] || {},
    { fixedInputConfig: _0x5e5d6a } = _0x2df42c;
  if (!_0x5e5d6a?.['visibleSlots']?.['length']) return '';
  const _0x4151f3 = Object['fromEntries'](
    Object['entries'](_0x2df42c['inputsBySlot'])['map'](([_0x10a781, _0x41e764]) => [
      _0x10a781,
      {
        ..._0x41e764,
        url: normalizeMediaUrl(_0x41e764['url']),
        thumbUrl: normalizeMediaUrl(_0x41e764['thumbUrl']),
        previewVideoUrl: _0x41e764['kind'] === 'video' ? normalizeMediaUrl(_0x41e764['url']) : '',
      },
    ]),
  );
  return renderVideoReferenceBarMarkup({
    fixedInputConfig: _0x5e5d6a,
    inputsBySlot: _0x4151f3,
    readOnlyFixedInputSlots: _0x2df42c['readOnlySlots'],
    showItemTitles: ![],
    attachmentButtonHtml: '',
  });
}
function renderPromptReferenceInputs(_0x525801, _0x2e4d04) {
  const _0x15f830 = Array['isArray'](_0x2e4d04?.['referenceImages']) ? _0x2e4d04['referenceImages'] : [];
  if (!_0x15f830['length']) return '';
  const _0x30b40a = new Map(_0x525801['characters']['map']((_0x35b626) => [_0x35b626['id'], _0x35b626])),
    _0x436b76 = new Map(_0x525801['scenes']['map']((_0x516551) => [_0x516551['id'], _0x516551])),
    _0x21c511 = _0x15f830['map']((_0x107377) => {
      const _0x35c6ec = Math['max'](0x1, Number(_0x107377['slot']) || 0x1),
        _0x1704e6 = _0x30b40a['get'](_0x107377['targetCharacterId']),
        _0x564228 = _0x436b76['get'](_0x107377['targetSceneId']),
        _0x504e7a =
          _0x107377['role'] === 'source-keyframe'
            ? '图' +
              _0x35c6ec +
              '\x20·\x20当前首帧' +
              (_0x2e4d04['annotatedSource'] ? '（提交时叠加人物框）' : '')
            : _0x107377['role'] === 'person-location-guide'
              ? '图' + _0x35c6ec + ' · A–H 定位图'
              : _0x107377['role'] === 'target-scene'
                ? '图' + _0x35c6ec + ' · 场景 · ' + (_0x564228?.['name'] || '场景参考')
                : '图' + _0x35c6ec + '\x20·\x20' + (_0x1704e6?.['name'] || '目标形象'),
        _0x4f36de = _0x107377['role'] === 'target-character',
        _0x33d464 = _0x107377['role'] === 'target-scene';
      return {
        kind: 'image',
        slotId: 'image-' + _0x35c6ec,
        name: _0x504e7a,
        url:
          _0x107377['role'] === 'person-location-guide'
            ? resolvePersonReplacementLocationGuidePreview(_0x107377['ref'])
            : normalizeMediaUrl(_0x107377['ref']),
        removeAction: _0x4f36de
          ? 'clear-person-replacement-target'
          : _0x33d464
            ? 'clear-person-replacement-scene-reference'
            : '',
        removeValue: _0x4f36de
          ? JSON['stringify']({
              shotId: _0x525801['workspace']['selectedShotId'],
              targetCharacterId: _0x107377['targetCharacterId'],
              targetAppearanceId: _0x107377['targetAppearanceId'],
            })
          : _0x33d464
            ? JSON['stringify']({ shotId: _0x525801['workspace']['selectedShotId'] })
            : '',
      };
    });
  return (
    '<div class="person-replacement-prompt-reference-inputs" aria-label="图像生成入参">' +
    renderVideoReferenceBarMarkup({
      readOnlyInputs: _0x21c511,
      showItemTitles: ![],
      attachmentButtonHtml: '',
    }) +
    '</div>'
  );
}
export function syncPersonReplacementPromptReferenceInputs(_0x59d10e, _0x564460, _0x30e3f3) {
  const _0x1ed6dd = _0x59d10e?.['querySelector']?.('.person-replacement-prompt-reference-inputs');
  if (!_0x1ed6dd?.['ownerDocument']?.['createElement']) return;
  const _0x37d674 = _0x1ed6dd['ownerDocument']['createElement']('template');
  _0x37d674['innerHTML'] = renderPromptReferenceInputs(_0x564460, _0x30e3f3);
  const _0x4f8d34 = _0x37d674['content']['firstElementChild'];
  if (!_0x4f8d34 || _0x1ed6dd['innerHTML'] === _0x4f8d34['innerHTML']) return;
  const _0x598853 = _0x1ed6dd['querySelector']('.ref-thumb-container--readonly'),
    _0x333a14 = _0x4f8d34['querySelector']('.ref-thumb-container--readonly');
  if (!_0x598853 || !_0x333a14) {
    (_0x1ed6dd['querySelectorAll']('img')['forEach']((_0x1c1267) => _0x1c1267['removeAttribute']('src')),
      _0x1ed6dd['replaceChildren'](..._0x4f8d34['childNodes']));
    return;
  }
  const _0x445981 = [..._0x1ed6dd['querySelectorAll']('[data-ref-readonly-key]')];
  let _0x15a488 = _0x598853['firstElementChild'];
  for (const _0x203ffb of _0x333a14['querySelectorAll']('[data-ref-readonly-key]')) {
    const _0x5592ec = _0x445981['findIndex'](
        (_0x3f9559) => _0x3f9559['dataset']['refReadonlyKey'] === _0x203ffb['dataset']['refReadonlyKey'],
      ),
      _0x5ecafe = _0x5592ec < 0x0 ? _0x203ffb : _0x445981['splice'](_0x5592ec, 0x1)[0x0];
    if (_0x5ecafe !== _0x203ffb)
      for (const { name: _0x53ea8c, value: _0x5e46cc } of _0x203ffb['attributes']) {
        if (_0x5ecafe['getAttribute'](_0x53ea8c) !== _0x5e46cc)
          _0x5ecafe['setAttribute'](_0x53ea8c, _0x5e46cc);
      }
    if (_0x5ecafe !== _0x15a488) _0x598853['insertBefore'](_0x5ecafe, _0x15a488);
    _0x15a488 = _0x5ecafe['nextElementSibling'];
  }
  for (const _0x1c211d of _0x445981) {
    (_0x1c211d['querySelectorAll']('img')['forEach']((_0xbff231) => _0xbff231['removeAttribute']('src')),
      _0x1c211d['remove']());
  }
}
export function createPersonReplacementIdentityPresentation() {
  return Object['freeze']({
    buildImage(
      _0x305c16,
      _0x5b8894,
      { people: people = [], duplicateRoleLabels: duplicateRoleLabels = new Set() } = {},
    ) {
      const _0x17036e = Array['isArray'](people) ? people : [];
      return Object['freeze']({
        targetAssetRailHtml: renderTargetAssetRail(_0x305c16, _0x5b8894),
        detectionBoxesHtml: _0x17036e['map']((_0x539d56, _0x4f5ced) =>
          renderDetectionBox(_0x539d56, _0x4f5ced, _0x305c16, { duplicateRoleLabels: duplicateRoleLabels }),
        )['join'](''),
        promptReferenceInputsHtml: renderPromptReferenceInputs(_0x305c16, _0x5b8894?.['promptPackage']),
      });
    },
    buildVideo(_0x142c39, _0x3b8888) {
      return Object['freeze']({
        referenceRailHtml: renderVideoReplacementReferenceRail(_0x142c39, _0x3b8888),
        referenceInputsHtml: renderVideoReplacementReferenceInputs(_0x3b8888),
      });
    },
    renderOverlay(_0x57bdb3, _0x4d305f = {}) {
      if (_0x57bdb3 === 'picker-options')
        return renderPersonDetectionPickerOptions(_0x4d305f['options'], _0x4d305f['selectedValue']);
      if (_0x57bdb3 === 'mapping-scope') return renderPersonMappingScopeMenu(_0x4d305f);
      return '';
    },
  });
}
