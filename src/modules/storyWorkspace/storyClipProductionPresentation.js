import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(item) {
  return String(item ?? '')['trim']();
}
function defaultLocalPathToUrl(key) {
  return normalizeText(key);
}
function defaultIsUsableImageUrl(index) {
  return Boolean(normalizeText(index));
}
function defaultRenderImageOrEmpty({
  imageUrl: imageUrl = '',
  alt: alt = '',
  className: className = '',
} = {}) {
  return imageUrl
    ? '<img class="' +
        escapeHtml(className) +
        '" src="' +
        escapeHtml(imageUrl) +
        '\x22\x20alt=\x22' +
        escapeHtml(alt) +
        '" loading="lazy" decoding="async" draggable="false">'
    : '<div class="' +
        escapeHtml(className) +
        ' is-empty" role="img" aria-label="' +
        escapeHtml(alt) +
        '"></div>';
}
function defaultRenderEpisodeCardActionIcon() {
  return '';
}
export function createStoryClipProductionPresentation({
  localPathToUrl: localPathToUrl = defaultLocalPathToUrl,
  isUsableImageUrl: isUsableImageUrl = defaultIsUsableImageUrl,
  renderImageOrEmpty: renderImageOrEmpty = defaultRenderImageOrEmpty,
  renderDeleteIcon: renderDeleteIcon = () => '',
  renderEpisodeCardActionIcon: renderEpisodeCardActionIcon = defaultRenderEpisodeCardActionIcon,
} = {}) {
  function run(options = {}) {
    const list = [
      options['posterUrl'],
      options['thumbUrl'],
      options['thumbnailUrl'],
      options['coverUrl'],
      localPathToUrl(options['posterLocalPath']),
      localPathToUrl(options['thumbLocalPath']),
      localPathToUrl(options['thumbnailLocalPath']),
    ];
    return list['map']((result) => normalizeText(result))['find'](isUsableImageUrl) || '';
  }
  function run2(options2 = {}) {
    const list2 = Array['isArray'](options2?.['video']?.['results'])
      ? options2['video']['results']['filter']((data) => data && typeof data === 'object')
      : [];
    if (!list2['length']) return [];
    const target = Math['max'](
      0x0,
      Math['min'](list2['length'] - 0x1, Math['trunc'](Number(options2?.['video']?.['activeIndex']) || 0x0)),
    );
    return [list2[target], ...list2['filter']((next, current) => current !== target)]['filter'](
      (entry) => !normalizeText(entry['error']),
    );
  }
  function resolveEpisodeCardMedia(options3 = {}) {
    const record = Array['isArray'](options3?.['clips']) ? options3['clips'] : [];
    for (const payload of record) {
      for (const handle of run2(payload)) {
        const url2 = run(handle);
        if (url2) return { kind: 'image', url: url2, source: 'video-result' };
      }
    }
    const url3 = normalizeText(options3?.['coverUrl']);
    if (isUsableImageUrl(url3)) return { kind: 'image', url: url3, source: 'episode-cover' };
    return { kind: 'empty', url: '', source: 'empty' };
  }
  function run3(options4 = {}) {
    const response = options4['media'] || { kind: 'empty', url: '', source: 'empty' },
      alt2 = normalizeText(options4['title']) || '第\x20' + (options4['number'] || '') + '\x20集';
    if (response['kind'] === 'image')
      return (
        '<img class="story-episode-cover" src="' +
        escapeHtml(response['url']) +
        '" alt="' +
        escapeHtml(alt2) +
        '" data-story-episode-cover-source="' +
        escapeHtml(response['source']) +
        '" loading="lazy" decoding="async" draggable="false">'
      );
    return renderImageOrEmpty({ imageUrl: '', alt: alt2, className: 'story-episode-cover' });
  }
  function run4(options5 = {}) {
    const {
        id: id = '',
        number: number = '',
        sequenceLabel: sequenceLabel = '第\x20' + number + '\x20集',
        title: title = '',
        status: status = '',
        characterCount: characterCount = 0x0,
        sceneCount: sceneCount = 0x0,
        propCount: propCount = 0x0,
        clipCount: clipCount = 0x0,
        isChecked: isChecked = ![],
        isSelectionMode: isSelectionMode = ![],
        isSplitting: isSplitting = ![],
        disabled: disabled = ![],
        actionKind: actionKind = 'generate',
        actionLabel: actionLabel = '',
        experimentalActionMarkup: experimentalActionMarkup = '',
        requestDebugMarkup: requestDebugMarkup = '',
        splitDraftMarkup: splitDraftMarkup = '',
      } = options5,
      state = isSelectionMode
        ? '' + (isChecked ? '取消选择' : '选择') + sequenceLabel + '：' + title
        : '' +
          (actionKind === 'edit' ? '进入' : '生成') +
          sequenceLabel +
          (actionKind === 'edit' ? '编辑' : '分镜脚本') +
          '：' +
          title,
      config = isSelectionMode
        ? ''
        : actionKind === 'generate'
          ? '<span class="story-episode-primary-actions"><button type="button" class="story-episode-enter story-episode-enter--' +
            escapeHtml(actionKind) +
            '\x22\x20data-story-action=\x22split-episode\x22\x20data-story-episode-id=\x22' +
            escapeHtml(id) +
            '" aria-label="' +
            escapeHtml(state) +
            '\x22\x20' +
            (disabled ? 'disabled' : '') +
            ' aria-busy="' +
            isSplitting +
            '\x22>' +
            (isSplitting
              ? renderStoryGenerationSpinner({ button: !![] })
              : renderEpisodeCardActionIcon(actionKind)) +
            '<span\x20class=\x22story-episode-enter-label\x22>' +
            escapeHtml(isSplitting ? '生成中' : actionLabel) +
            '</span></button></span>'
          : '<span class="story-episode-enter story-episode-enter--' +
            escapeHtml(actionKind) +
            '" aria-hidden="true">' +
            renderEpisodeCardActionIcon(actionKind) +
            '<span\x20class=\x22story-episode-enter-label\x22>' +
            escapeHtml(actionLabel) +
            '</span></span>',
      enabled = actionKind === 'edit',
      scope =
        isSelectionMode || !enabled
          ? ''
          : '<button type="button" class="story-episode-regenerate story-episode-enter story-regenerate-button" data-story-action="regenerate-episode" data-story-episode-id="' +
            escapeHtml(id) +
            '" aria-label="重新生成' +
            escapeHtml(sequenceLabel) +
            '\x22\x20' +
            (disabled ? 'disabled' : '') +
            ' aria-busy="' +
            isSplitting +
            '\x22>' +
            (isSplitting
              ? renderStoryGenerationSpinner({ button: !![] })
              : renderEpisodeCardActionIcon('regenerate')) +
            '<span\x20class=\x22story-episode-enter-label\x22>' +
            (isSplitting ? '重新生成中' : '重新生成') +
            '</span></button>',
      input = !isSelectionMode && Boolean(experimentalActionMarkup || requestDebugMarkup),
      output = input
        ? '<div class="story-episode-utility-actions">' +
          experimentalActionMarkup +
          requestDebugMarkup +
          '</div>' +
          scope
        : scope,
      value2 =
        '\n      ' +
        run3(options5) +
        '\n      <span class="story-episode-copy">\n        <span class="story-episode-status">' +
        escapeHtml(status) +
        '</span>\n        <span class="story-episode-title">' +
        escapeHtml(sequenceLabel) +
        '：' +
        escapeHtml(title) +
        '</span>\n        <span class="story-episode-summary">角色 ' +
        characterCount +
        ' · 场景 ' +
        sceneCount +
        ' · 道具 ' +
        propCount +
        '\x20·\x20片段\x20' +
        (clipCount || '待拆分') +
        '</span>\n        ' +
        config +
        '\n      </span>',
      value3 = isSelectionMode || actionKind === 'edit',
      value4 = value3
        ? '<button type="button" class="story-episode-open" data-story-select-episode="' +
          escapeHtml(id) +
          '" data-story-open-episode="' +
          escapeHtml(id) +
          '\x22\x20aria-label=\x22' +
          escapeHtml(state) +
          '" aria-pressed="' +
          (isSelectionMode ? String(isChecked) : 'false') +
          '\x22\x20' +
          (disabled ? 'disabled aria-disabled="true"' : '') +
          '>' +
          value2 +
          '\n    </button>'
        : '<div class="story-episode-open story-episode-open--static" data-story-select-episode="' +
          escapeHtml(id) +
          '" aria-label="' +
          escapeHtml(state) +
          '\x22>' +
          value2 +
          '\n    </div>';
    return (
      '<article class="story-episode-card has-inline-actions ' +
      (options5['posterLayout'] ? 'story-episode-card--poster' : '') +
      '\x20' +
      (input ? 'has-developer-actions' : '') +
      '\x20' +
      (isSelectionMode ? 'is-selection-mode' : '') +
      '\x20' +
      (isChecked ? 'is-checked' : '') +
      '\x20' +
      (isSplitting ? 'is-splitting' : '') +
      '" data-story-marquee-item data-story-marquee-id="' +
      escapeHtml(id) +
      '\x22\x20aria-busy=\x22' +
      isSplitting +
      '\x22>\x0a\x20\x20\x20\x20' +
      value4 +
      '\x0a\x20\x20\x20\x20' +
      output +
      '\n    ' +
      (isSelectionMode ? '' : splitDraftMarkup) +
      '\n    ' +
      (isSplitting
        ? '<div\x20class=\x22story-episode-loading\x20storyboard-script-loading-overlay\x22\x20role=\x22status\x22\x20aria-live=\x22polite\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-script-loading-spinner\x22></div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-script-loading-label\x22>正在拆分' +
          escapeHtml(sequenceLabel) +
          '</div>\n      <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n    </div>'
        : '') +
      '\n  </article>'
    );
  }
  function renderOverview(options6 = {}) {
    if (options6['kind'] === 'card') return run4(options6['card']);
    const list3 = Array['isArray'](options6['cards']) ? options6['cards'] : [],
      el = options6['batchControl'] || {},
      value5 = Math['max'](0x0, Math['trunc'](Number(options6['selectedCount']) || 0x0)),
      value6 = el['operation'] === 'splitting-selected',
      value7 = el['operation'] === 'splitting-all',
      value8 = value6 || value7,
      value9 = value8
        ? '<button type="button" class="story-primary-button story-main-action-button" data-story-action="cancel-episode-split-batch" ' +
          (el['cancelRequested'] ? 'disabled' : '') +
          ' aria-busy="true">' +
          renderStoryGenerationSpinner({ button: !![] }) +
          escapeHtml(el['cancelRequested'] ? '正在停止' : '停止批量拆分') +
          '</button>'
        : '';
    return (
      '<div class="story-episodes-page story-content-page ' +
      (options6['experimentalMode'] ? 'is-experimental-split-mode' : '') +
      '" data-story-marquee-page-surface="episodes" data-story-experimental-mode="' +
      Boolean(options6['experimentalMode']) +
      '">\n    <header class="story-page-heading">\n      <div>\n        <span class="story-eyebrow">' +
      escapeHtml(options6['eyebrow'] || '剧本拆分结果') +
      '</span>\n        <h2>' +
      escapeHtml(options6['title'] || '分集视频') +
      '</h2>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-heading-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      (options6['experimentalModeToggleMarkup'] || '') +
      '\n        <button type="button" class="story-secondary-button" data-story-action="toggle-all-episodes" aria-pressed="' +
      Boolean(options6['allEpisodesSelected']) +
      '\x22\x20' +
      (el['disabled'] || !list3['length'] ? 'disabled' : '') +
      '>' +
      (options6['allEpisodesSelected'] ? '取消全选' : '全选') +
      '</button>\n        ' +
      (value8
        ? value9
        : '<button type="button" class="story-primary-button story-main-action-button" data-story-action="' +
          (options6['selectionMode'] ? 'split-selected-episodes' : 'split-all-episodes') +
          '\x22\x20' +
          (el['disabled'] || !list3['length'] ? 'disabled' : '') +
          ' aria-busy="false">' +
          (options6['selectionMode'] ? '拆分选中 (' + value5 + ')' : '批量拆分') +
          '</button>') +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20' +
      (options6['description'] === ''
        ? ''
        : '<p\x20class=\x22story-page-description\x22>' +
          escapeHtml(options6['description'] ?? '每一集会形成一套片段脚本；确认后可创建为新的画布页面。') +
          '</p>') +
      '\n    <div class="story-episode-grid">\n      ' +
      list3['map'](run4)['join']('') +
      '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20' +
      (options6['footerMarkup'] || '') +
      '\n  </div>'
    );
  }
  function run5(error = {}) {
    if (isUsableImageUrl(error['imageUrl']))
      return (
        '<img class="story-episode-asset-image story-episode-library-asset-image" src="' +
        escapeHtml(error['imageUrl']) +
        '" alt="' +
        escapeHtml(error['name']) +
        '" loading="lazy" decoding="async">'
      );
    return (
      '<div class="story-episode-asset-image story-episode-library-asset-fallback" data-media-type="' +
      escapeHtml(error['mediaKind'] || 'other') +
      '" role="img" aria-label="' +
      escapeHtml(error['name'] + '，' + error['typeLabel'] + '素材') +
      '"><span>' +
      escapeHtml(error['typeLabel']) +
      '</span></div>'
    );
  }
  function run6(count = []) {
    if (!count['length'])
      return {
        count: 0x0,
        markup:
          '<div class="story-episode-asset-empty">\n        <strong>画布素材库暂无可引用素材</strong>\n        <span>在画布中把节点加入素材库后，可在这里直接拖入片段提示词。</span>\n      </div>',
      };
    const map = new Map();
    return (
      count['forEach']((value10) => {
        const text = normalizeText(value10['sourceAssetId']) || 'ungrouped';
        (!map['has'](text) &&
          map['set'](text, {
            name: normalizeText(value10['assetName']) || '未分组素材',
            assets: [],
          }),
          map['get'](text)['assets']['push'](value10));
      }),
      {
        count: count['length'],
        markup: Array['from'](map['entries']())
          ['map'](
            ([value11, error2]) =>
              '<section data-story-episode-library-group="' +
              escapeHtml(value11) +
              '">\n      <h3>' +
              escapeHtml(error2['name']) +
              ' · ' +
              error2['assets']['length'] +
              ' 项</h3>\n      <div class="story-episode-asset-grid story-episode-library-asset-grid">\n        ' +
              error2['assets']
                ['map'](
                  (error3) =>
                    '<button\x20type=\x22button\x22\x20draggable=\x22true\x22\x20data-story-reference-asset=\x22' +
                    escapeHtml(error3['sourceAssetId']) +
                    '" data-story-reference-asset-index="' +
                    Math['max'](0x0, Math['trunc'](Number(error3['sourceItemIndex']) || 0x0)) +
                    '" data-story-reference-source="library" data-story-reference-media-type="' +
                    escapeHtml(error3['mediaKind']) +
                    '" aria-label="引用总素材 ' +
                    escapeHtml(error3['name']) +
                    '，仅可拖入提示词">\n          ' +
                    run5(error3) +
                    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
                    escapeHtml(error3['name']) +
                    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<small>' +
                    escapeHtml(error3['role']) +
                    '</small>\n        </button>',
                )
                ['join']('') +
              '\n      </div>\n    </section>',
          )
          ['join'](''),
      }
    );
  }
  function run7(value12) {
    const value13 =
      value12 === 'frames'
        ? '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="m7 15 3.5-3.5 2.5 2.5 2-2 2 3"/><circle cx="15.5" cy="9" r="1.25"/>'
        : value12 === 'library'
          ? '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'
          : '<path\x20d=\x22M4\x206.5h6l1.7\x202H20v9.5a2\x202\x200\x200\x201-2\x202H6a2\x202\x200\x200\x201-2-2z\x22/><path\x20d=\x22M4\x209h16\x22/>';
    return (
      '<span class="story-episode-asset-tab-icon" data-icon="' +
      value12 +
      '\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22>' +
      value13 +
      '</svg></span>'
    );
  }
  function renderAssetRail(options7 = {}) {
    const list4 = Array['isArray'](options7['assets']) ? options7['assets'] : [],
      list5 = Array['isArray'](options7['frames']) ? options7['frames'] : [],
      list6 = Array['isArray'](options7['clips']) ? options7['clips'] : [],
      value14 = ['assets', 'frames', 'library']['includes'](options7['activeTab'])
        ? options7['activeTab']
        : 'assets',
      value15 = run6(Array['isArray'](options7['libraryAssets']) ? options7['libraryAssets'] : []),
      value16 = ['character', 'scene', 'prop']
        ['map'](
          (value17) =>
            '<section>\n      <h3>' +
            escapeHtml(options7['assetKindLabels']?.[value17] || value17) +
            '</h3>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-episode-asset-grid\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
            list4['filter']((value18) => value18['kind'] === value17)
              ['map'](
                (imageUrl2) =>
                  '<button\x20type=\x22button\x22\x20draggable=\x22true\x22\x20data-story-reference-asset=\x22' +
                  escapeHtml(imageUrl2['id']) +
                  '" aria-label="引用素材 ' +
                  escapeHtml(imageUrl2['name']) +
                  '，仅可拖入提示词">\n          ' +
                  renderImageOrEmpty({
                    imageUrl: imageUrl2['imageUrl'],
                    alt: imageUrl2['name'],
                    className: 'story-episode-asset-image',
                  }) +
                  '\n          <span>' +
                  escapeHtml(imageUrl2['name']) +
                  '</span>\n        </button>',
              )
              ['join']('') +
            '\n      </div>\n    </section>',
        )
        ['join'](''),
      frames = new Map();
    list5['forEach']((value19) => {
      const text2 = normalizeText(value19['clipId']) || 'unassigned';
      if (!frames['has'](text2)) frames['set'](text2, []);
      frames['get'](text2)['push'](value19);
    });
    const list7 = list6['map']((value20, value21) => {
        const clipId = normalizeText(value20?.['id']);
        return {
          clipId: clipId,
          label: normalizeText(value20?.['title']) || '片段 ' + (value21 + 0x1),
          frames: frames['get'](clipId) || [],
        };
      })['filter']((value22) => value22['frames']['length'] > 0x0),
      map2 = new Set(list7['map']((value23) => value23['clipId']));
    frames['forEach']((frames2, clipId2) => {
      if (map2['has'](clipId2)) return;
      list7['push']({
        clipId: clipId2,
        label: normalizeText(frames2[0x0]?.['clipTitle']) || '其他片段',
        frames: frames2,
      });
    });
    const value24 = list7['length']
      ? list7['map'](
          (value25) =>
            '<section class="story-episode-frame-section" data-story-clip-frame-group="' +
            escapeHtml(value25['clipId']) +
            '">\n        <h3>' +
            escapeHtml(value25['label']) +
            ' · ' +
            value25['frames']['length'] +
            ' 项</h3>\n        <div class="story-episode-asset-grid story-episode-frame-grid">\n          ' +
            value25['frames']
              ['map']((imageUrl3) => {
                const value26 = imageUrl3['mediaType'] === 'video',
                  value27 = '删除' + (value26 ? '视频片段' : '片段帧') + '\x20' + imageUrl3['name'],
                  value28 = value26
                    ? '<div class="story-episode-frame-video-wrap">\n                  <video class="story-episode-asset-image story-episode-frame-video" src="' +
                      escapeHtml(imageUrl3['mediaUrl']) +
                      '\x22' +
                      (imageUrl3['imageUrl']
                        ? ' poster="' + escapeHtml(imageUrl3['imageUrl']) + '\x22'
                        : '') +
                      ' muted playsinline preload="metadata" aria-label="' +
                      escapeHtml(imageUrl3['name']) +
                      '"></video>\n                  <span class="story-episode-frame-video-badge" aria-hidden="true">视频</span>\n                </div>'
                    : renderImageOrEmpty({
                        imageUrl: imageUrl3['imageUrl'],
                        alt: imageUrl3['name'],
                        className: 'story-episode-asset-image story-episode-frame-image',
                      });
                return (
                  '<div class="story-episode-frame-card">\n              <button type="button" draggable="true" data-story-reference-asset="' +
                  escapeHtml(imageUrl3['mentionId']) +
                  '" data-story-reference-frame="' +
                  escapeHtml(imageUrl3['id']) +
                  '" data-story-reference-media-type="' +
                  escapeHtml(imageUrl3['mediaType']) +
                  '" aria-label="引用' +
                  (value26 ? '裁剪视频' : '片段帧') +
                  '\x20' +
                  escapeHtml(imageUrl3['name']) +
                  '，仅可拖入提示词\x22\x20aria-busy=\x22' +
                  (imageUrl3['captureSavePending'] === !![]) +
                  '">\n                ' +
                  value28 +
                  '\n                <span>' +
                  escapeHtml(imageUrl3['name']) +
                  '</span>\n              </button>\n              <button type="button" class="story-action-icon-button is-danger story-project-delete-trigger story-card-delete-button story-episode-frame-delete-trigger" data-story-action="delete-clip-frame" data-story-clip-frame-id="' +
                  escapeHtml(imageUrl3['id']) +
                  '" aria-label="' +
                  escapeHtml(value27) +
                  '\x22\x20' +
                  (imageUrl3['captureSavePending'] === !![] ? 'disabled' : '') +
                  '>' +
                  renderDeleteIcon() +
                  '</button>\n            </div>'
                );
              })
              ['join']('') +
            '\n        </div>\n      </section>',
        )['join']('')
      : '<div class="story-episode-asset-empty">\n        <strong>还没有片段帧</strong>\n        <span>在右侧视频预览中截取当前帧，或点击裁剪按钮提取视频片段。</span>\n      </div>';
    return (
      '<aside class="story-episode-assets" data-story-episode-asset-rail data-active-tab="' +
      value14 +
      '">\n    <header class="story-episode-asset-rail-header">\n      <div class="story-episode-asset-rail-tabs" role="tablist" aria-label="剧本素材类型">\n        <button type="button" class="' +
      (value14 === 'assets' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="assets" role="tab" aria-selected="' +
      (value14 === 'assets') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      run7('assets') +
      '<span\x20class=\x22story-episode-asset-tab-label\x22>本集素材</span><span\x20class=\x22story-episode-asset-count\x22\x20data-story-episode-asset-count=\x22assets\x22>' +
      list4['length'] +
      '</span>\n        </button>\n        <button type="button" class="' +
      (value14 === 'frames' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="frames" role="tab" aria-selected="' +
      (value14 === 'frames') +
      '">\n          ' +
      run7('frames') +
      '<span class="story-episode-asset-tab-label">片段帧</span><span class="story-episode-asset-count" data-story-episode-asset-count="frames">' +
      list5['length'] +
      '</span>\n        </button>\n        <button type="button" class="' +
      (value14 === 'library' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="library" role="tab" aria-selected="' +
      (value14 === 'library') +
      '">\n          ' +
      run7('library') +
      '<span class="story-episode-asset-tab-label">总素材</span><span class="story-episode-asset-count" data-story-episode-asset-count="library">' +
      value15['count'] +
      '</span>\n        </button>\n      </div>\n      <small data-story-episode-asset-help>' +
      escapeHtml(options7['helpText']) +
      '</small>\n    </header>\n    <div class="story-episode-asset-rail-viewport">\n      <div class="story-episode-asset-rail-track" data-story-episode-asset-rail-track>\n        <div class="story-episode-asset-rail-page ' +
      (value14 === 'assets' ? 'is-active' : '') +
      '\x22\x20data-story-episode-asset-panel=\x22assets\x22\x20role=\x22tabpanel\x22\x20aria-hidden=\x22' +
      (value14 !== 'assets') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      value16 +
      '\n        </div>\n        <div class="story-episode-asset-rail-page ' +
      (value14 === 'frames' ? 'is-active' : '') +
      '" data-story-episode-asset-panel="frames" role="tabpanel" aria-hidden="' +
      (value14 !== 'frames') +
      '">\n          ' +
      value24 +
      '\n        </div>\n        <div class="story-episode-asset-rail-page ' +
      (value14 === 'library' ? 'is-active' : '') +
      '\x22\x20data-story-episode-asset-panel=\x22library\x22\x20role=\x22tabpanel\x22\x20aria-hidden=\x22' +
      (value14 !== 'library') +
      '">\n          ' +
      value15['markup'] +
      '\n        </div>\n      </div>\n    </div>\n  </aside>'
    );
  }
  function renderDetail(options8 = {}) {
    const box = options8['ratios'] || { left: 0x18, center: 0x2c },
      value29 =
        '<div\x20class=\x22story-episode-detail-page\x22>\x0a\x20\x20\x20\x20' +
        (options8['assetRailMarkup'] || '') +
        '\n    <div class="story-episode-splitter story-episode-splitter--assets panel-resize-handle panel-resize-handle--transient" data-story-episode-splitter="assets" role="separator" aria-orientation="vertical" aria-label="调整本集素材区域宽度" aria-valuemin="14" aria-valuemax="34" aria-valuenow="' +
        Math['round'](Number(box['left']) || 0x0) +
        '" tabindex="0"></div>\n    <section class="story-clip-editor">\n      <header>\n        <h2>' +
        escapeHtml(options8['title'] || '片段脚本') +
        '</h2>\x0a\x20\x20\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-context-row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-meta\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (Array['isArray'](options8['clipMeta']) ? options8['clipMeta'] : [])
          ['map']((value30) => '<span>' + escapeHtml(value30) + '</span>')
          ['join']('') +
        '\n        </div>\n        ' +
        (options8['referenceSummary'] || '') +
        '\n      </div>\n      ' +
        (options8['promptSurface'] || '') +
        '\n    </section>\n    <div class="story-episode-splitter story-episode-splitter--preview panel-resize-handle panel-resize-handle--transient" data-story-episode-splitter="preview" role="separator" aria-orientation="vertical" aria-label="调整脚本与视频结果区域宽度" aria-valuemin="38" aria-valuemax="76" aria-valuenow="' +
        Math['round']((Number(box['left']) || 0x0) + (Number(box['center']) || 0x0)) +
        '" tabindex="0"></div>\n    <section class="story-video-preview" data-story-clip-navigation="' +
        Boolean(options8['hasMultipleClips']) +
        '\x22\x20' +
        (options8['hasMultipleClips']
          ? 'tabindex=\x220\x22\x20aria-label=\x22滚动鼠标滚轮或按左右方向键切换上一幕、下一幕\x22'
          : '') +
        '>\n      ' +
        (options8['navigationMarkup'] || '') +
        '\n      <div class="story-clip-preview-slide" data-story-clip-preview-slide>\n        ' +
        (options8['videoPreview'] || '') +
        '\n      </div>\n    </section>\n    ' +
        (options8['timeline'] || '') +
        '\n  </div>';
    return options8['episodeRailMarkup']
      ? '<div\x20class=\x22workspace-episode-production\x20story-replication-episode-production\x22\x20data-story-replication-episode-production>' +
          options8['episodeRailMarkup'] +
          value29 +
          '</div>'
      : value29;
  }
  return Object['freeze']({
    renderAssetRail: renderAssetRail,
    renderDetail: renderDetail,
    renderOverview: renderOverview,
    resolveEpisodeCardMedia: resolveEpisodeCardMedia,
  });
}
