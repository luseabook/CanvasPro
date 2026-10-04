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
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(item, key = '') {
  const index = String(item ?? '')['trim']();
  return index || key;
}
function normalizeMediaUrl(result) {
  const text = normalizeText(result);
  return text ? localPathToUrl(text) || text : '';
}
function formatPersonOrientation(data) {
  return (
    PERSON_REPLACEMENT_ORIENTATION_LABELS[normalizeText(data)] ||
    PERSON_REPLACEMENT_ORIENTATION_LABELS['unknown']
  );
}
function getCharacterAppearance(options, target = '') {
  const list = getWorkspaceAssetAppearances(options);
  return (
    list['find']((source) => source['id'] === target) ||
    getWorkspaceAssetBaseAppearance(options) ||
    list[0x0] ||
    null
  );
}
function normalizeProjectAssetMediaForRender(args = {}) {
  return {
    ...args,
    appearances: getWorkspaceAssetAppearances(args)['map']((args2) => ({
      ...args2,
      imageUrl: normalizeMediaUrl(args2['imageUrl']),
      referenceImageUrl: normalizeMediaUrl(args2['referenceImageUrl']),
    })),
  };
}
function renderPersonReplacementVoiceReferenceStatus(options2 = {}, next = '') {
  const mediaUrl = normalizeMediaUrl(
      options2['voiceReference']?.['audioUrl'] ||
        options2['voiceReference']?.['localPath'] ||
        options2['voiceRef'],
    ),
    current = Boolean(mediaUrl);
  return (
    '<span class="person-replacement-target-voice-status' +
    (next ? '\x20' + escapeHtml(next) : '') +
    '\x20' +
    (current ? 'has-reference' : 'is-missing') +
    '\x22><i\x20aria-hidden=\x22true\x22></i>' +
    (current ? '有声音参考' : '无声音参考') +
    '</span>'
  );
}
function renderPersonDetectionPicker({
  kind: kind,
  value: value2,
  label: label,
  ariaLabel: ariaLabel,
  customInputValue: customInputValue = '',
  sourceCharacterId: sourceCharacterId = '',
} = {}) {
  const text2 = normalizeText(value2),
    text3 = normalizeText(label, '请选择'),
    entry = kind === 'label',
    record = entry
      ? 'data-person-replacement-person-label'
      : kind === 'scope'
        ? 'data-person-replacement-person-scope'
        : 'data-person-replacement-person-orientation';
  return (
    '<span class="person-replacement-detection-picker is-' +
    escapeHtml(kind) +
    '\x22\x20data-person-replacement-detection-picker=\x22' +
    escapeHtml(kind) +
    '">\n    <button type="button" class="person-replacement-detection-picker-trigger" data-person-replacement-action="toggle-detection-picker" data-person-replacement-detection-picker-trigger="' +
    escapeHtml(kind) +
    '\x22\x20' +
    record +
    '\x20value=\x22' +
    escapeHtml(text2) +
    '\x22' +
    (entry
      ? ' data-person-replacement-selected-source-character-id="' + escapeHtml(sourceCharacterId) + '\x22'
      : '') +
    ' aria-label="' +
    escapeHtml(ariaLabel) +
    '\x22\x20aria-haspopup=\x22listbox\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20data-person-replacement-detection-picker-value>' +
    escapeHtml(text3) +
    '</span><span class="story-project-sort-chevron" aria-hidden="true"></span>\n    </button>\n    ' +
    (entry
      ? '<input type="text" class="person-replacement-detection-name-input" value="' +
        escapeHtml(customInputValue || text3) +
        '" maxlength="24" placeholder="输入人物名称" aria-label="自定义人物名称" data-person-replacement-person-custom-label hidden>'
      : '') +
    '\n    <div class="story-project-sort-menu person-replacement-detection-picker-menu" data-person-replacement-detection-picker-menu data-person-replacement-picker-options-lazy="true" role="listbox" aria-label="' +
    escapeHtml(ariaLabel) +
    '选项" aria-hidden="true"></div>\n  </span>'
  );
}
function renderPersonDetectionPickerOptions(list2 = [], payload = '') {
  const text4 = normalizeText(payload);
  return (Array['isArray'](list2) ? list2 : [])
    ['map']((el) => {
      const text5 = normalizeText(el?.['value']),
        text6 = normalizeText(el?.['label'], text5),
        handle = text5 === text4,
        state = el?.['deletable']
          ? '<button type="button" class="person-replacement-detection-picker-option-delete" data-person-replacement-action="delete-detection-custom-label" data-person-replacement-custom-label="' +
            escapeHtml(text5) +
            '" aria-label="删除自定义名称' +
            escapeHtml(text6) +
            '\x22>' +
            renderWorkspaceActionIcon('delete') +
            '</button>'
          : '',
        config = el?.['sourceCharacterId']
          ? ' data-person-replacement-source-character-id="' + escapeHtml(el['sourceCharacterId']) + '\x22'
          : '';
      return (
        '<span class="person-replacement-detection-picker-option-row' +
        (el?.['deletable'] ? '\x20is-deletable' : '') +
        '"><button type="button" class="story-project-sort-option' +
        (handle ? ' is-selected' : '') +
        '" data-person-replacement-action="select-detection-picker-option" data-person-replacement-detection-picker-option="' +
        escapeHtml(text5) +
        '\x22' +
        config +
        ' role="option" aria-selected="' +
        handle +
        '"><span>' +
        escapeHtml(text6) +
        '</span></button>' +
        state +
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
function hasTargetAssetBinding(scope, input) {
  const list3 = Array['isArray'](input?.['referenceImages']) ? input['referenceImages'] : [];
  return list3['some'](
    (output) => output['role'] === 'target-character' && output['targetCharacterId'] === scope['id'],
  );
}
function renderTargetAssetGroup(args3, characterAssetTab, value3) {
  const characters = characterAssetTab === 'scene',
    list4 = characters ? args3['scenes'] : args3['characters'],
    list5 = list4['map'](normalizeProjectAssetMediaForRender),
    value4 = {
      ...buildPersonReplacementAssetViewState({
        ...args3,
        characters: characters ? args3['characters'] : list5,
        scenes: characters ? list5 : args3['scenes'],
        workspace: { ...args3['workspace'], characterAssetTab: characterAssetTab },
      }),
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      assetSelectionStyle: 'single',
      assetSelectionMode: ![],
      selectedAssetIds: [],
    },
    list6 = list5['map']((asset) => {
      const list7 = getWorkspaceAssetAppearances(asset),
        appearances = list7['filter']((value5) => value5['imageUrl']),
        value6 = Math['max'](
          0x0,
          Math['min'](
            list7['length'] - 0x1,
            Math['trunc'](Number(args3['workspace']['assetAppearanceIndexes']?.[asset['id']]) || 0x0),
          ),
        ),
        value7 = list7[value6]?.['id'],
        selectedIndex = Math['max'](
          0x0,
          appearances['findIndex']((value8) => value8['id'] === value7),
        );
      return {
        asset: asset,
        appearances: appearances,
        appearance: appearances[selectedIndex] || null,
        selectedIndex: selectedIndex,
      };
    })['filter']((value9) => value9['appearance']),
    enabled = list6['map'](
      ({
        asset: asset2,
        appearances: appearances2,
        appearance: appearance,
        selectedIndex: selectedIndex2,
      }) => {
        if (characters)
          return renderPersonReplacementAssetCard(value4, asset2, {
            previewAppearance: appearance,
            statusText: '场景图\x20' + (selectedIndex2 + 0x1) + '/' + appearances2['length'],
            draggable: !![],
            cardClassName: 'person-replacement-target-asset person-replacement-scene-reference-asset',
            cardAttributes:
              'data-person-replacement-replacement-asset-kind="scene" data-person-replacement-target-scene-id="' +
              escapeHtml(asset2['id']) +
              '" data-person-replacement-target-scene-appearance-id="' +
              escapeHtml(appearance['id']) +
              '\x22\x20aria-label=\x22' +
              escapeHtml('拖拽' + asset2['name'] + '到首帧画面作为场景参考') +
              '\x22',
            shellClassName: 'person-replacement-target-asset-shell',
          });
        const value10 = appearances2['length'] > 0x1,
          accessoryHtml = value10
            ? '<span class="person-replacement-target-appearance-controls" data-person-replacement-target-controls="' +
              escapeHtml(asset2['id']) +
              '" data-story-asset-hover-id="' +
              escapeHtml(asset2['id']) +
              '\x22>' +
              renderPersonReplacementPreviewArrow('previous', {
                action: 'target-previous-appearance',
                label: asset2['name'] + '上一个形象',
                className: 'person-replacement-target-appearance-arrow',
              }) +
              renderPersonReplacementPreviewArrow('next', {
                action: 'target-next-appearance',
                label: asset2['name'] + '下一个形象',
                className: 'person-replacement-target-appearance-arrow',
              }) +
              '</span>'
            : '',
          hasTargetAssetBinding2 = hasTargetAssetBinding(asset2, value3);
        return renderPersonReplacementAssetCard(value4, asset2, {
          previewAppearance: appearance,
          statusText: '形象 ' + (selectedIndex2 + 0x1) + '/' + appearances2['length'],
          cardMetaHtml: renderPersonReplacementVoiceReferenceStatus(asset2),
          draggable: !![],
          cardClassName:
            'person-replacement-target-asset' +
            (hasTargetAssetBinding2 ? ' has-person-replacement-input' : ''),
          cardAttributes:
            'data-person-replacement-target-character-id="' +
            escapeHtml(asset2['id']) +
            '\x22\x20data-person-replacement-target-appearance-id=\x22' +
            escapeHtml(appearance['id']) +
            '" data-person-replacement-target-appearance-index="' +
            selectedIndex2 +
            '" data-person-replacement-target-appearance-count="' +
            appearances2['length'] +
            '" data-person-replacement-target-appearance-wheel="' +
            value10 +
            '\x22\x20aria-label=\x22拖拽' +
            escapeHtml(asset2['name']) +
            '的' +
            escapeHtml(appearance['name']) +
            '到视频人物框"',
          shellClassName: 'person-replacement-target-asset-shell',
          accessoryHtml: accessoryHtml,
        });
      },
    )['join']('');
  if (characters && !enabled) return '';
  const value11 = characters ? '场景' : '角色',
    value12 = '请先在素材设定上传基础形象';
  return (
    '<div\x20class=\x22person-replacement-target-asset-group\x22\x20data-person-replacement-target-asset-group=\x22' +
    characterAssetTab +
    '" role="group" aria-labelledby="person-replacement-target-asset-group-' +
    characterAssetTab +
    '">\n    <h3 class="person-replacement-target-asset-group-heading" id="person-replacement-target-asset-group-' +
    characterAssetTab +
    '\x22>' +
    value11 +
    '：</h3>\n    <div class="person-replacement-target-asset-group-items">' +
    (enabled || '<p\x20class=\x22person-replacement-inline-empty\x22>' + value12 + '</p>') +
    '</div>\n  </div>'
  );
}
function renderTargetAssetRail(value13, value14) {
  const value15 = value14?.['promptPackage'] || null;
  return (
    '<aside class="person-replacement-target-assets">\n    <div class="person-replacement-target-assets-heading">\n      <strong>替换素材</strong>\n      <small>拖拽角色到首帧人物框；拖拽场景到首帧画面</small>\n    </div>\n    <div class="person-replacement-target-asset-list">\n      ' +
    renderTargetAssetGroup(value13, 'character', value15) +
    '\n      ' +
    renderTargetAssetGroup(value13, 'scene', value15) +
    '\n    </div>\n  </aside>'
  );
}
function renderVideoReplacementReferenceRail(value16, value17) {
  const value18 = value17?.['shot'] || null,
    value19 = value17?.['imageInput'] || {},
    list8 = Array['isArray'](value19['referenceOptions']) ? value19['referenceOptions'] : [],
    value20 = Math['trunc'](Number(value19['activeReferenceIndex'])),
    value21 = value19['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    value22 = value21
      ? '包含上一轮全部图像替换结果与当前镜头的角色绑定图'
      : '来自上一轮图像替换的全部片段结果',
    list9 = list8['map']((value23, value24) => {
      const isCharacterReference =
          value23['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
        value25 = value23['reference'] || {},
        text7 = normalizeText(value23['sourceShotId']),
        value26 = Math['max'](0x0, Math['trunc'](Number(value23['sourceShotIndex']) || 0x0)),
        value27 = Math['max'](0x0, Math['trunc'](Number(value23['resultIndex']) || 0x0)),
        count = Math['max'](0x1, Math['trunc'](Number(value23['resultCount']) || 0x1)),
        label2 = isCharacterReference
          ? normalizeText(value25['characterName']) || '人物参考图'
          : '片段' + (value26 + 0x1) + '.图片' + (value27 + 0x1),
        value28 = isCharacterReference
          ? '角色绑定图 · ' + (normalizeText(value25['appearanceName']) || '基础形象')
          : '图像替换结果',
        value29 = isCharacterReference
          ? '<small>' + escapeHtml(value28) + '</small>'
          : '<span class="person-replacement-video-reference-status" aria-label="图像替换结果 ' +
            (value27 + 0x1) +
            '/' +
            count +
            '\x22>' +
            escapeHtml(value28) +
            '\x20' +
            (value27 + 0x1) +
            '/' +
            count +
            '</span>',
        mediaUrl2 = normalizeMediaUrl(value23['imageRef']),
        value30 = value24 === value20,
        value31 = mediaUrl2
          ? ' data-story-asset-hover-id="' +
            escapeHtml(text7 || value18?.['id'] || '') +
            '" data-person-replacement-video-reference-hover-preview="true"'
          : '',
        characterReferenceId = isCharacterReference
          ? normalizeText(value25['personId'] || value25['characterId'] + ':' + value25['appearanceId'])
          : '',
        value32 = isCharacterReference ? 'character:' + characterReferenceId : 'shot:' + text7,
        value33 = isCharacterReference
          ? ''
          : '\x20data-person-replacement-video-reference-source-shot-id=\x22' +
            escapeHtml(text7) +
            '" data-person-replacement-video-reference-result-index="' +
            value27 +
            '" data-person-replacement-video-reference-result-count="' +
            count +
            '\x22' +
            (count > 0x1 ? ' data-person-replacement-video-reference-wheel="true"' : ''),
        value34 =
          !isCharacterReference && count > 0x1
            ? '<span class="person-replacement-target-appearance-controls person-replacement-video-reference-controls" data-person-replacement-video-reference-controls="' +
              escapeHtml(text7) +
              '" data-person-replacement-video-reference-result-index="' +
              value27 +
              '\x22>' +
              renderPersonReplacementPreviewArrow('previous', {
                action: 'video-reference-previous-result',
                label: label2 + '的上一张图片',
                className:
                  'person-replacement-target-appearance-arrow\x20person-replacement-video-reference-arrow',
              }) +
              renderPersonReplacementPreviewArrow('next', {
                action: 'video-reference-next-result',
                label: label2 + '的下一张图片',
                className:
                  'person-replacement-target-appearance-arrow person-replacement-video-reference-arrow',
              }) +
              '</span>'
            : '',
        cardHtml =
          '<span\x20class=\x22story-asset-card-shell\x20person-replacement-target-asset-shell\x20person-replacement-video-reference-shell\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-video-reference-card\x20' +
          (value30 ? 'is-selected' : '') +
          '" data-story-action="select-video-shot-reference" data-shot-id="' +
          escapeHtml(value18?.['id'] || '') +
          '\x22\x20data-person-replacement-video-reference-index=\x22' +
          value24 +
          '" data-person-replacement-video-reference-key="' +
          escapeHtml(value32) +
          '" data-person-replacement-video-reference-kind="' +
          escapeHtml(value23['kind']) +
          '\x22' +
          (isCharacterReference
            ? '\x20data-person-replacement-video-character-reference=\x22' +
              escapeHtml(characterReferenceId) +
              '\x22'
            : '') +
          value33 +
          value31 +
          '\x20aria-pressed=\x22' +
          value30 +
          '\x22\x20aria-label=\x22' +
          escapeHtml(
            '选择' +
              label2 +
              '作为视频替换参考图' +
              (count > 0x1 && !isCharacterReference ? '，可滚动鼠标滚轮切换图片' : ''),
          ) +
          '\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-video-reference-media\x22>' +
          (mediaUrl2
            ? '<img src="' +
              escapeHtml(mediaUrl2) +
              '" alt="' +
              escapeHtml(label2) +
              '" loading="lazy" decoding="async" draggable="false">'
            : '') +
          '</span>\n      <span class="person-replacement-video-reference-copy' +
          (isCharacterReference ? '' : ' has-result-status') +
          '\x22><strong>' +
          escapeHtml(label2) +
          '</strong>' +
          value29 +
          '</span>\n      <span class="person-replacement-video-reference-selection" aria-hidden="true"' +
          (value30 ? '' : ' hidden') +
          '>当前</span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20' +
          value34 +
          '\x0a\x20\x20\x20\x20</span>';
      return {
        cardHtml: cardHtml,
        characterReferenceId: characterReferenceId,
        isCharacterReference: isCharacterReference,
      };
    }),
    cardsHtml = list9['filter'](({ isCharacterReference: isCharacterReference2 }) => !isCharacterReference2)
      ['map'](({ cardHtml: cardHtml2 }) => cardHtml2)
      ['join'](''),
    map = new Map(
      list9['filter'](({ isCharacterReference: isCharacterReference3 }) => isCharacterReference3)['map'](
        (value35) => [value35['characterReferenceId'], value35['cardHtml']],
      ),
    ),
    list10 = Array['isArray'](value19['references'])
      ? value19['references']['filter']((value36) => normalizeText(value36?.['imageRef']))
      : [],
    cardsHtml2 = list10['map']((value37) => {
      const text8 = normalizeText(
          value37['personId'] || value37['characterId'] + ':' + value37['appearanceId'],
        ),
        value38 = map['get'](text8);
      return value38 || '';
    })['join'](''),
    noteHtml2 =
      value21 && list10['length'] > 0x1
        ? '<p class="person-replacement-reference-note">每次生成使用一张人物参考图，请选择本次入参。</p>'
        : '',
    handler = ({
      kind: kind2,
      label: label3,
      cardsHtml: cardsHtml3,
      emptyText: emptyText,
      noteHtml: noteHtml = '',
    }) =>
      '<section class="person-replacement-target-asset-group person-replacement-video-reference-group" data-person-replacement-video-reference-group="' +
      escapeHtml(kind2) +
      '" role="group" aria-label="' +
      escapeHtml(label3) +
      '">\n      <h3 class="person-replacement-target-asset-group-heading">' +
      escapeHtml(label3) +
      '：</h3>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-target-asset-group-items\x22>' +
      (cardsHtml3 ||
        '<p\x20class=\x22person-replacement-inline-empty\x22>' + escapeHtml(emptyText) + '</p>') +
      noteHtml +
      '</div>\n    </section>',
    value39 = value21
      ? handler({
          kind: 'character',
          label: '人物参考',
          cardsHtml: cardsHtml2,
          emptyText: '当前片段没有已绑定的人物参考图',
          noteHtml: noteHtml2,
        })
      : '',
    value40 = handler({
      kind: 'first-frame',
      label: '首帧参考',
      cardsHtml: cardsHtml,
      emptyText: '请先在图像替换中生成替换首帧',
    });
  return (
    '<aside class="person-replacement-target-assets person-replacement-video-reference-assets">\n    <div class="person-replacement-target-assets-heading"><strong>替换参考图</strong><small>' +
    escapeHtml(value22) +
    '</small></div>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-target-asset-list\x20person-replacement-video-reference-list\x22\x20data-person-replacement-video-reference-list\x20tabindex=\x220\x22>' +
    value39 +
    value40 +
    '</div>\n  </aside>'
  );
}
function renderDetectionBox(
  value41,
  value42,
  value43,
  { duplicateRoleLabels: duplicateRoleLabels = new Set() } = {},
) {
  const box = value41['locator']?.['bbox'] || value41['bbox'];
  if (!box) return '';
  const value44 = value41['detectionMethod'] === 'manual',
    text9 = normalizeText(value43['workspace']['selectedShotId']),
    personReplacementIdentityCorrectionDraftKey = getPersonReplacementIdentityCorrectionDraftKey(
      text9,
      value41['id'],
    ),
    value45 =
      value43['workspace']['identityCorrectionDrafts'][personReplacementIdentityCorrectionDraftKey] || {},
    error = value43['characters']['find']((value46) => value46['id'] === value41['targetCharacterId']),
    error2 = error ? getCharacterAppearance(error, value41['targetAppearanceId']) : null,
    value47 =
      value41['identityReviewStatus'] === 'needs_review' || value41['identityReviewRequired'] === !![],
    value48 = Object['keys'](value45)['length'] > 0x0,
    text10 = normalizeText(value45['orientation'], normalizeText(value41['orientation'])),
    formatPersonOrientation2 = formatPersonOrientation(text10),
    value49 = resolvePersonReplacementDetectionLabel(value41, value42, value43, text9),
    value50 = duplicateRoleLabels['has'](value49),
    sourceCharacterId2 = normalizeText(
      value45['sourceCharacterId'],
      normalizeText(value41['sourceCharacterId']),
    ),
    value51 = value50 ? '角色名重复' : error ? '已绑定' : '未绑定',
    value52 = PERSON_REPLACEMENT_ORIENTATIONS['includes'](text10) && text10 !== 'unknown' ? text10 : '',
    value53 = normalizePersonReplacementScope(value41['replacementScope']),
    label4 = formatPersonReplacementScopeLabel(value53),
    value54 = value47 || value48 || (PERSON_REPLACEMENT_ORIENTATION_ENABLED && !value52),
    value55 = PERSON_REPLACEMENT_ORIENTATION_ENABLED
      ? '<span class="person-replacement-detection-separator" aria-hidden="true">·</span>' +
        renderPersonDetectionPicker({
          kind: 'orientation',
          value: value52,
          label: value52 ? formatPersonOrientation2 : '选择朝向',
          ariaLabel: '人物朝向：' + (value52 ? formatPersonOrientation2 : '待选择'),
        })
      : '',
    value56 =
      '<span class="person-replacement-detection-separator" aria-hidden="true">·</span>' +
      renderPersonDetectionPicker({
        kind: 'scope',
        value: value53,
        label: label4,
        ariaLabel: '替换范围：' + label4,
      }),
    value57 = !error ? 'is-unready' : value54 ? 'is-partially-ready' : 'is-ready',
    value58 =
      '' +
      renderPersonDetectionPicker({
        kind: 'label',
        value: value49,
        label: value49,
        ariaLabel: '人物名称：' + value49,
        customInputValue: value49,
        sourceCharacterId: sourceCharacterId2,
      }) +
      value56 +
      value55 +
      '<span class="person-replacement-detection-separator" aria-hidden="true">·</span><span class="person-replacement-detection-binding-status ' +
      (value50 ? 'is-conflict' : error ? 'is-bound' : 'is-unbound') +
      '\x22>' +
      value51 +
      '</span>',
    value59 =
      error && error2?.['imageUrl']
        ? ' data-story-asset-hover-id="' +
          escapeHtml(error['id']) +
          '" data-story-asset-hover-appearance-id="' +
          escapeHtml(error2['id']) +
          '\x22'
        : '',
    value60 =
      '<button type="button" class="story-action-icon-button is-danger person-replacement-detection-delete-action" data-person-replacement-action="delete-person" data-shot-id="' +
      escapeHtml(value43['workspace']['selectedShotId']) +
      '" data-person-id="' +
      escapeHtml(value41['id']) +
      '" aria-label="删除' +
      escapeHtml(value49) +
      '检测框">' +
      renderWorkspaceActionIcon('delete') +
      '</button>',
    value61 = ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se']
      ['map'](
        (value62) =>
          '<span class="person-replacement-manual-resize-handle is-' +
          value62 +
          '\x22\x20data-person-replacement-manual-resize=\x22' +
          value62 +
          '" aria-hidden="true"></span>',
      )
      ['join'](''),
    value63 = value44
      ? ' data-person-replacement-manual-person tabindex="0" aria-keyshortcuts="Delete D"'
      : ' tabindex="0" aria-keyshortcuts="Delete D"',
    value64 =
      '<svg\x20class=\x22person-replacement-detection-readiness-border\x22\x20width=\x22100%\x22\x20height=\x22100%\x22\x20aria-hidden=\x22true\x22\x20focusable=\x22false\x22><rect\x20class=\x22person-replacement-detection-readiness-stroke\x22></rect></svg>';
  return (
    '<div class="person-replacement-detection-box has-identity-controls is-movable ' +
    (error ? 'is-mapped' : '') +
    '\x20' +
    (value47 ? 'needs-identity-review' : '') +
    '\x20' +
    (value54 ? 'is-identity-editing' : '') +
    '\x20' +
    value57 +
    '\x20' +
    (value44 ? 'is-manual' : '') +
    '\x20' +
    (value50 ? 'has-role-conflict' : '') +
    '" style="--box-x:' +
    box['x'] * 0x64 +
    '%;--box-y:' +
    box['y'] * 0x64 +
    '%;--box-width:' +
    box['width'] * 0x64 +
    '%;--box-height:' +
    box['height'] * 0x64 +
    '%\x22\x20data-person-replacement-person-drop' +
    value59 +
    value63 +
    ' data-person-id="' +
    escapeHtml(value41['id']) +
    '" data-shot-id="' +
    escapeHtml(text9) +
    '" aria-label="' +
    escapeHtml(value50 ? value49 + '，角色名重复' : value49) +
    '\x22' +
    (value50 ? '\x20aria-invalid=\x22true\x22' : '') +
    '>' +
    value64 +
    '<div class="person-replacement-detection-label"><span class="person-replacement-detection-summary">' +
    value58 +
    '</span><span\x20class=\x22person-replacement-detection-actions\x22>' +
    value60 +
    '</span></div>' +
    (error
      ? '<div class="person-replacement-mapping-badge"><span class="person-replacement-mapping-badge-text">→ ' +
        escapeHtml(error['name']) +
        ' · ' +
        escapeHtml(error2?.['name'] || '基础形象') +
        '</span><button\x20type=\x22button\x22\x20class=\x22story-action-icon-button\x20is-danger\x20story-project-delete-trigger\x20person-replacement-mapping-remove\x20person-replacement-detection-delete-action\x22\x20data-person-replacement-action=\x22clear-person-mapping\x22\x20data-shot-id=\x22' +
        escapeHtml(text9) +
        '" data-person-id="' +
        escapeHtml(value41['id']) +
        '" aria-label="解除' +
        escapeHtml(value49) +
        '的人物绑定">' +
        renderWorkspaceActionIcon('unlink') +
        '</button></div>'
      : '<div\x20class=\x22person-replacement-mapping-badge\x22>拖入目标形象</div>') +
    value61 +
    '</div>'
  );
}
function renderVideoReplacementReferenceInputs(value65) {
  const readOnlyFixedInputSlots = value65?.['slotState'] || {},
    { fixedInputConfig: fixedInputConfig } = readOnlyFixedInputSlots;
  if (!fixedInputConfig?.['visibleSlots']?.['length']) return '';
  const inputsBySlot = Object['fromEntries'](
    Object['entries'](readOnlyFixedInputSlots['inputsBySlot'])['map'](([value66, previewVideoUrl]) => [
      value66,
      {
        ...previewVideoUrl,
        url: normalizeMediaUrl(previewVideoUrl['url']),
        thumbUrl: normalizeMediaUrl(previewVideoUrl['thumbUrl']),
        previewVideoUrl: previewVideoUrl['kind'] === 'video' ? normalizeMediaUrl(previewVideoUrl['url']) : '',
      },
    ]),
  );
  return renderVideoReferenceBarMarkup({
    fixedInputConfig: fixedInputConfig,
    inputsBySlot: inputsBySlot,
    readOnlyFixedInputSlots: readOnlyFixedInputSlots['readOnlySlots'],
    showItemTitles: ![],
    attachmentButtonHtml: '',
  });
}
function renderPromptReferenceInputs(shotId, value67) {
  const list11 = Array['isArray'](value67?.['referenceImages']) ? value67['referenceImages'] : [];
  if (!list11['length']) return '';
  const map2 = new Map(shotId['characters']['map']((value68) => [value68['id'], value68])),
    map3 = new Map(shotId['scenes']['map']((value69) => [value69['id'], value69])),
    readOnlyInputs = list11['map']((url) => {
      const value70 = Math['max'](0x1, Number(url['slot']) || 0x1),
        error3 = map2['get'](url['targetCharacterId']),
        error4 = map3['get'](url['targetSceneId']),
        name =
          url['role'] === 'source-keyframe'
            ? '图' +
              value70 +
              '\x20·\x20当前首帧' +
              (value67['annotatedSource'] ? '（提交时叠加人物框）' : '')
            : url['role'] === 'person-location-guide'
              ? '图' + value70 + ' · A–H 定位图'
              : url['role'] === 'target-scene'
                ? '图' + value70 + ' · 场景 · ' + (error4?.['name'] || '场景参考')
                : '图' + value70 + '\x20·\x20' + (error3?.['name'] || '目标形象'),
        removeAction = url['role'] === 'target-character',
        value71 = url['role'] === 'target-scene';
      return {
        kind: 'image',
        slotId: 'image-' + value70,
        name: name,
        url:
          url['role'] === 'person-location-guide'
            ? resolvePersonReplacementLocationGuidePreview(url['ref'])
            : normalizeMediaUrl(url['ref']),
        removeAction: removeAction
          ? 'clear-person-replacement-target'
          : value71
            ? 'clear-person-replacement-scene-reference'
            : '',
        removeValue: removeAction
          ? JSON['stringify']({
              shotId: shotId['workspace']['selectedShotId'],
              targetCharacterId: url['targetCharacterId'],
              targetAppearanceId: url['targetAppearanceId'],
            })
          : value71
            ? JSON['stringify']({ shotId: shotId['workspace']['selectedShotId'] })
            : '',
      };
    });
  return (
    '<div class="person-replacement-prompt-reference-inputs" aria-label="图像生成入参">' +
    renderVideoReferenceBarMarkup({
      readOnlyInputs: readOnlyInputs,
      showItemTitles: ![],
      attachmentButtonHtml: '',
    }) +
    '</div>'
  );
}
export function syncPersonReplacementPromptReferenceInputs(el2, value72, value73) {
  const el3 = el2?.['querySelector']?.('.person-replacement-prompt-reference-inputs');
  if (!el3?.['ownerDocument']?.['createElement']) return;
  const el4 = el3['ownerDocument']['createElement']('template');
  el4['innerHTML'] = renderPromptReferenceInputs(value72, value73);
  const el5 = el4['content']['firstElementChild'];
  if (!el5 || el3['innerHTML'] === el5['innerHTML']) return;
  const el6 = el3['querySelector']('.ref-thumb-container--readonly'),
    el7 = el5['querySelector']('.ref-thumb-container--readonly');
  if (!el6 || !el7) {
    (el3['querySelectorAll']('img')['forEach']((value74) => value74['removeAttribute']('src')),
      el3['replaceChildren'](...el5['childNodes']));
    return;
  }
  const list12 = [...el3['querySelectorAll']('[data-ref-readonly-key]')];
  let value75 = el6['firstElementChild'];
  for (const el8 of el7['querySelectorAll']('[data-ref-readonly-key]')) {
    const count2 = list12['findIndex'](
        (el9) => el9['dataset']['refReadonlyKey'] === el8['dataset']['refReadonlyKey'],
      ),
      el10 = count2 < 0x0 ? el8 : list12['splice'](count2, 0x1)[0x0];
    if (el10 !== el8)
      for (const { name: name2, value: value76 } of el8['attributes']) {
        if (el10['getAttribute'](name2) !== value76) el10['setAttribute'](name2, value76);
      }
    if (el10 !== value75) el6['insertBefore'](el10, value75);
    value75 = el10['nextElementSibling'];
  }
  for (const el11 of list12) {
    (el11['querySelectorAll']('img')['forEach']((value77) => value77['removeAttribute']('src')),
      el11['remove']());
  }
}
export function createPersonReplacementIdentityPresentation() {
  return Object['freeze']({
    buildImage(
      value78,
      value79,
      { people: people = [], duplicateRoleLabels: duplicateRoleLabels = new Set() } = {},
    ) {
      const detectionBoxesHtml = Array['isArray'](people) ? people : [];
      return Object['freeze']({
        targetAssetRailHtml: renderTargetAssetRail(value78, value79),
        detectionBoxesHtml: detectionBoxesHtml['map']((value80, value81) =>
          renderDetectionBox(value80, value81, value78, { duplicateRoleLabels: duplicateRoleLabels }),
        )['join'](''),
        promptReferenceInputsHtml: renderPromptReferenceInputs(value78, value79?.['promptPackage']),
      });
    },
    buildVideo(value82, value83) {
      return Object['freeze']({
        referenceRailHtml: renderVideoReplacementReferenceRail(value82, value83),
        referenceInputsHtml: renderVideoReplacementReferenceInputs(value83),
      });
    },
    renderOverlay(value84, value85 = {}) {
      if (value84 === 'picker-options')
        return renderPersonDetectionPickerOptions(value85['options'], value85['selectedValue']);
      if (value84 === 'mapping-scope') return renderPersonMappingScopeMenu(value85);
      return '';
    },
  });
}
