import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
function escapeHtml(_0x459296) {
  return String(_0x459296 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x4334a9) {
  return String(_0x4334a9 ?? '')['trim']();
}
function defaultLocalPathToUrl(_0x39dc5f) {
  return normalizeText(_0x39dc5f);
}
function defaultIsUsableImageUrl(_0xbd0308) {
  return Boolean(normalizeText(_0xbd0308));
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
  function _0x5305d8(_0x58ae43 = {}) {
    const _0x1674d7 = [
      _0x58ae43['posterUrl'],
      _0x58ae43['thumbUrl'],
      _0x58ae43['thumbnailUrl'],
      _0x58ae43['coverUrl'],
      localPathToUrl(_0x58ae43['posterLocalPath']),
      localPathToUrl(_0x58ae43['thumbLocalPath']),
      localPathToUrl(_0x58ae43['thumbnailLocalPath']),
    ];
    return _0x1674d7['map']((_0x3c6b26) => normalizeText(_0x3c6b26))['find'](isUsableImageUrl) || '';
  }
  function _0x5afcfc(_0x170b26 = {}) {
    const _0x57130b = Array['isArray'](_0x170b26?.['video']?.['results'])
      ? _0x170b26['video']['results']['filter']((_0x3f2bb4) => _0x3f2bb4 && typeof _0x3f2bb4 === 'object')
      : [];
    if (!_0x57130b['length']) return [];
    const _0x3e0138 = Math['max'](
      0x0,
      Math['min'](
        _0x57130b['length'] - 0x1,
        Math['trunc'](Number(_0x170b26?.['video']?.['activeIndex']) || 0x0),
      ),
    );
    return [_0x57130b[_0x3e0138], ..._0x57130b['filter']((_0x423e3c, _0x46d5b0) => _0x46d5b0 !== _0x3e0138)][
      'filter'
    ]((_0x32f649) => !normalizeText(_0x32f649['error']));
  }
  function _0x515479(_0x26d898 = {}) {
    const _0x3d528b = Array['isArray'](_0x26d898?.['clips']) ? _0x26d898['clips'] : [];
    for (const _0x449e0b of _0x3d528b) {
      for (const _0x311e06 of _0x5afcfc(_0x449e0b)) {
        const _0x528046 = _0x5305d8(_0x311e06);
        if (_0x528046) return { kind: 'image', url: _0x528046, source: 'video-result' };
      }
    }
    const _0x505da0 = normalizeText(_0x26d898?.['coverUrl']);
    if (isUsableImageUrl(_0x505da0)) return { kind: 'image', url: _0x505da0, source: 'episode-cover' };
    return { kind: 'empty', url: '', source: 'empty' };
  }
  function _0x1f68c7(_0x3efe09 = {}) {
    const _0x502413 = _0x3efe09['media'] || { kind: 'empty', url: '', source: 'empty' },
      _0x4a5c51 = normalizeText(_0x3efe09['title']) || '第\x20' + (_0x3efe09['number'] || '') + '\x20集';
    if (_0x502413['kind'] === 'image')
      return (
        '<img class="story-episode-cover" src="' +
        escapeHtml(_0x502413['url']) +
        '" alt="' +
        escapeHtml(_0x4a5c51) +
        '" data-story-episode-cover-source="' +
        escapeHtml(_0x502413['source']) +
        '" loading="lazy" decoding="async" draggable="false">'
      );
    return renderImageOrEmpty({ imageUrl: '', alt: _0x4a5c51, className: 'story-episode-cover' });
  }
  function _0x393036(_0x3a301e = {}) {
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
        actionLabel: _0x228d2e = '',
        experimentalActionMarkup: experimentalActionMarkup = '',
        requestDebugMarkup: requestDebugMarkup = '',
        splitDraftMarkup: splitDraftMarkup = '',
      } = _0x3a301e,
      _0x5bce13 = isSelectionMode
        ? '' + (isChecked ? '取消选择' : '选择') + sequenceLabel + '：' + title
        : '' +
          (actionKind === 'edit' ? '进入' : '生成') +
          sequenceLabel +
          (actionKind === 'edit' ? '编辑' : '分镜脚本') +
          '：' +
          title,
      _0x201fc1 = isSelectionMode
        ? ''
        : actionKind === 'generate'
          ? '<span class="story-episode-primary-actions"><button type="button" class="story-episode-enter story-episode-enter--' +
            escapeHtml(actionKind) +
            '\x22\x20data-story-action=\x22split-episode\x22\x20data-story-episode-id=\x22' +
            escapeHtml(id) +
            '" aria-label="' +
            escapeHtml(_0x5bce13) +
            '\x22\x20' +
            (disabled ? 'disabled' : '') +
            ' aria-busy="' +
            isSplitting +
            '\x22>' +
            (isSplitting
              ? renderStoryGenerationSpinner({ button: !![] })
              : renderEpisodeCardActionIcon(actionKind)) +
            '<span\x20class=\x22story-episode-enter-label\x22>' +
            escapeHtml(isSplitting ? '生成中' : _0x228d2e) +
            '</span></button></span>'
          : '<span class="story-episode-enter story-episode-enter--' +
            escapeHtml(actionKind) +
            '" aria-hidden="true">' +
            renderEpisodeCardActionIcon(actionKind) +
            '<span\x20class=\x22story-episode-enter-label\x22>' +
            escapeHtml(_0x228d2e) +
            '</span></span>',
      _0x41596c = actionKind === 'edit',
      _0x33418e =
        isSelectionMode || !_0x41596c
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
      _0x3f9cfc = !isSelectionMode && Boolean(experimentalActionMarkup || requestDebugMarkup),
      _0x2f328d = _0x3f9cfc
        ? '<div class="story-episode-utility-actions">' +
          experimentalActionMarkup +
          requestDebugMarkup +
          '</div>' +
          _0x33418e
        : _0x33418e,
      _0xa6d826 =
        '\n      ' +
        _0x1f68c7(_0x3a301e) +
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
        _0x201fc1 +
        '\n      </span>',
      _0x1ef740 = isSelectionMode || actionKind === 'edit',
      _0x50ffe7 = _0x1ef740
        ? '<button type="button" class="story-episode-open" data-story-select-episode="' +
          escapeHtml(id) +
          '" data-story-open-episode="' +
          escapeHtml(id) +
          '\x22\x20aria-label=\x22' +
          escapeHtml(_0x5bce13) +
          '" aria-pressed="' +
          (isSelectionMode ? String(isChecked) : 'false') +
          '\x22\x20' +
          (disabled ? 'disabled aria-disabled="true"' : '') +
          '>' +
          _0xa6d826 +
          '\n    </button>'
        : '<div class="story-episode-open story-episode-open--static" data-story-select-episode="' +
          escapeHtml(id) +
          '" aria-label="' +
          escapeHtml(_0x5bce13) +
          '\x22>' +
          _0xa6d826 +
          '\n    </div>';
    return (
      '<article class="story-episode-card has-inline-actions ' +
      (_0x3a301e['posterLayout'] ? 'story-episode-card--poster' : '') +
      '\x20' +
      (_0x3f9cfc ? 'has-developer-actions' : '') +
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
      _0x50ffe7 +
      '\x0a\x20\x20\x20\x20' +
      _0x2f328d +
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
  function _0x1d29c1(_0x65afe5 = {}) {
    if (_0x65afe5['kind'] === 'card') return _0x393036(_0x65afe5['card']);
    const _0x48ddf = Array['isArray'](_0x65afe5['cards']) ? _0x65afe5['cards'] : [],
      _0x5d851c = _0x65afe5['batchControl'] || {},
      _0x1f2188 = Math['max'](0x0, Math['trunc'](Number(_0x65afe5['selectedCount']) || 0x0)),
      _0x177453 = _0x5d851c['operation'] === 'splitting-selected',
      _0x14f77b = _0x5d851c['operation'] === 'splitting-all',
      _0x3e03bc = _0x177453 || _0x14f77b,
      _0x5dd22b = _0x3e03bc
        ? '<button type="button" class="story-primary-button story-main-action-button" data-story-action="cancel-episode-split-batch" ' +
          (_0x5d851c['cancelRequested'] ? 'disabled' : '') +
          ' aria-busy="true">' +
          renderStoryGenerationSpinner({ button: !![] }) +
          escapeHtml(_0x5d851c['cancelRequested'] ? '正在停止' : '停止批量拆分') +
          '</button>'
        : '';
    return (
      '<div class="story-episodes-page story-content-page ' +
      (_0x65afe5['experimentalMode'] ? 'is-experimental-split-mode' : '') +
      '" data-story-marquee-page-surface="episodes" data-story-experimental-mode="' +
      Boolean(_0x65afe5['experimentalMode']) +
      '">\n    <header class="story-page-heading">\n      <div>\n        <span class="story-eyebrow">' +
      escapeHtml(_0x65afe5['eyebrow'] || '剧本拆分结果') +
      '</span>\n        <h2>' +
      escapeHtml(_0x65afe5['title'] || '分集视频') +
      '</h2>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-heading-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x65afe5['experimentalModeToggleMarkup'] || '') +
      '\n        <button type="button" class="story-secondary-button" data-story-action="toggle-all-episodes" aria-pressed="' +
      Boolean(_0x65afe5['allEpisodesSelected']) +
      '\x22\x20' +
      (_0x5d851c['disabled'] || !_0x48ddf['length'] ? 'disabled' : '') +
      '>' +
      (_0x65afe5['allEpisodesSelected'] ? '取消全选' : '全选') +
      '</button>\n        ' +
      (_0x3e03bc
        ? _0x5dd22b
        : '<button type="button" class="story-primary-button story-main-action-button" data-story-action="' +
          (_0x65afe5['selectionMode'] ? 'split-selected-episodes' : 'split-all-episodes') +
          '\x22\x20' +
          (_0x5d851c['disabled'] || !_0x48ddf['length'] ? 'disabled' : '') +
          ' aria-busy="false">' +
          (_0x65afe5['selectionMode'] ? '拆分选中 (' + _0x1f2188 + ')' : '批量拆分') +
          '</button>') +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20' +
      (_0x65afe5['description'] === ''
        ? ''
        : '<p\x20class=\x22story-page-description\x22>' +
          escapeHtml(_0x65afe5['description'] ?? '每一集会形成一套片段脚本；确认后可创建为新的画布页面。') +
          '</p>') +
      '\n    <div class="story-episode-grid">\n      ' +
      _0x48ddf['map'](_0x393036)['join']('') +
      '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20' +
      (_0x65afe5['footerMarkup'] || '') +
      '\n  </div>'
    );
  }
  function _0x52c237(_0x9458f8 = {}) {
    if (isUsableImageUrl(_0x9458f8['imageUrl']))
      return (
        '<img class="story-episode-asset-image story-episode-library-asset-image" src="' +
        escapeHtml(_0x9458f8['imageUrl']) +
        '" alt="' +
        escapeHtml(_0x9458f8['name']) +
        '" loading="lazy" decoding="async">'
      );
    return (
      '<div class="story-episode-asset-image story-episode-library-asset-fallback" data-media-type="' +
      escapeHtml(_0x9458f8['mediaKind'] || 'other') +
      '" role="img" aria-label="' +
      escapeHtml(_0x9458f8['name'] + '，' + _0x9458f8['typeLabel'] + '素材') +
      '"><span>' +
      escapeHtml(_0x9458f8['typeLabel']) +
      '</span></div>'
    );
  }
  function _0x392e68(_0x2dd6c0 = []) {
    if (!_0x2dd6c0['length'])
      return {
        count: 0x0,
        markup:
          '<div class="story-episode-asset-empty">\n        <strong>画布素材库暂无可引用素材</strong>\n        <span>在画布中把节点加入素材库后，可在这里直接拖入片段提示词。</span>\n      </div>',
      };
    const _0x46164a = new Map();
    return (
      _0x2dd6c0['forEach']((_0x8a554b) => {
        const _0x5bfdbd = normalizeText(_0x8a554b['sourceAssetId']) || 'ungrouped';
        (!_0x46164a['has'](_0x5bfdbd) &&
          _0x46164a['set'](_0x5bfdbd, {
            name: normalizeText(_0x8a554b['assetName']) || '未分组素材',
            assets: [],
          }),
          _0x46164a['get'](_0x5bfdbd)['assets']['push'](_0x8a554b));
      }),
      {
        count: _0x2dd6c0['length'],
        markup: Array['from'](_0x46164a['entries']())
          ['map'](
            ([_0x4e2b06, _0x5197dc]) =>
              '<section data-story-episode-library-group="' +
              escapeHtml(_0x4e2b06) +
              '">\n      <h3>' +
              escapeHtml(_0x5197dc['name']) +
              ' · ' +
              _0x5197dc['assets']['length'] +
              ' 项</h3>\n      <div class="story-episode-asset-grid story-episode-library-asset-grid">\n        ' +
              _0x5197dc['assets']
                ['map'](
                  (_0x28a896) =>
                    '<button\x20type=\x22button\x22\x20draggable=\x22true\x22\x20data-story-reference-asset=\x22' +
                    escapeHtml(_0x28a896['sourceAssetId']) +
                    '" data-story-reference-asset-index="' +
                    Math['max'](0x0, Math['trunc'](Number(_0x28a896['sourceItemIndex']) || 0x0)) +
                    '" data-story-reference-source="library" data-story-reference-media-type="' +
                    escapeHtml(_0x28a896['mediaKind']) +
                    '" aria-label="引用总素材 ' +
                    escapeHtml(_0x28a896['name']) +
                    '，仅可拖入提示词">\n          ' +
                    _0x52c237(_0x28a896) +
                    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
                    escapeHtml(_0x28a896['name']) +
                    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<small>' +
                    escapeHtml(_0x28a896['role']) +
                    '</small>\n        </button>',
                )
                ['join']('') +
              '\n      </div>\n    </section>',
          )
          ['join'](''),
      }
    );
  }
  function _0x189c10(_0x15e9a7) {
    const _0x5bb396 =
      _0x15e9a7 === 'frames'
        ? '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="m7 15 3.5-3.5 2.5 2.5 2-2 2 3"/><circle cx="15.5" cy="9" r="1.25"/>'
        : _0x15e9a7 === 'library'
          ? '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'
          : '<path\x20d=\x22M4\x206.5h6l1.7\x202H20v9.5a2\x202\x200\x200\x201-2\x202H6a2\x202\x200\x200\x201-2-2z\x22/><path\x20d=\x22M4\x209h16\x22/>';
    return (
      '<span class="story-episode-asset-tab-icon" data-icon="' +
      _0x15e9a7 +
      '\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22>' +
      _0x5bb396 +
      '</svg></span>'
    );
  }
  function _0x5cf55d(_0x30aca5 = {}) {
    const _0x5df054 = Array['isArray'](_0x30aca5['assets']) ? _0x30aca5['assets'] : [],
      _0x56394a = Array['isArray'](_0x30aca5['frames']) ? _0x30aca5['frames'] : [],
      _0x5d650b = Array['isArray'](_0x30aca5['clips']) ? _0x30aca5['clips'] : [],
      _0x3eec8b = ['assets', 'frames', 'library']['includes'](_0x30aca5['activeTab'])
        ? _0x30aca5['activeTab']
        : 'assets',
      _0x2bc662 = _0x392e68(Array['isArray'](_0x30aca5['libraryAssets']) ? _0x30aca5['libraryAssets'] : []),
      _0x353a29 = ['character', 'scene', 'prop']
        ['map'](
          (_0x58e250) =>
            '<section>\n      <h3>' +
            escapeHtml(_0x30aca5['assetKindLabels']?.[_0x58e250] || _0x58e250) +
            '</h3>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-episode-asset-grid\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
            _0x5df054['filter']((_0x1ace3a) => _0x1ace3a['kind'] === _0x58e250)
              ['map'](
                (_0x4f7828) =>
                  '<button\x20type=\x22button\x22\x20draggable=\x22true\x22\x20data-story-reference-asset=\x22' +
                  escapeHtml(_0x4f7828['id']) +
                  '" aria-label="引用素材 ' +
                  escapeHtml(_0x4f7828['name']) +
                  '，仅可拖入提示词">\n          ' +
                  renderImageOrEmpty({
                    imageUrl: _0x4f7828['imageUrl'],
                    alt: _0x4f7828['name'],
                    className: 'story-episode-asset-image',
                  }) +
                  '\n          <span>' +
                  escapeHtml(_0x4f7828['name']) +
                  '</span>\n        </button>',
              )
              ['join']('') +
            '\n      </div>\n    </section>',
        )
        ['join'](''),
      _0x4282d8 = new Map();
    _0x56394a['forEach']((_0x317842) => {
      const _0x2f3e5b = normalizeText(_0x317842['clipId']) || 'unassigned';
      if (!_0x4282d8['has'](_0x2f3e5b)) _0x4282d8['set'](_0x2f3e5b, []);
      _0x4282d8['get'](_0x2f3e5b)['push'](_0x317842);
    });
    const _0x1bc9c9 = _0x5d650b['map']((_0x51a1d6, _0x20412e) => {
        const _0x952a74 = normalizeText(_0x51a1d6?.['id']);
        return {
          clipId: _0x952a74,
          label: normalizeText(_0x51a1d6?.['title']) || '片段 ' + (_0x20412e + 0x1),
          frames: _0x4282d8['get'](_0x952a74) || [],
        };
      })['filter']((_0x1e486e) => _0x1e486e['frames']['length'] > 0x0),
      _0x58dd3d = new Set(_0x1bc9c9['map']((_0x18c182) => _0x18c182['clipId']));
    _0x4282d8['forEach']((_0x3d6e66, _0x3c7a86) => {
      if (_0x58dd3d['has'](_0x3c7a86)) return;
      _0x1bc9c9['push']({
        clipId: _0x3c7a86,
        label: normalizeText(_0x3d6e66[0x0]?.['clipTitle']) || '其他片段',
        frames: _0x3d6e66,
      });
    });
    const _0x58fd2e = _0x1bc9c9['length']
      ? _0x1bc9c9['map'](
          (_0x34c160) =>
            '<section class="story-episode-frame-section" data-story-clip-frame-group="' +
            escapeHtml(_0x34c160['clipId']) +
            '">\n        <h3>' +
            escapeHtml(_0x34c160['label']) +
            ' · ' +
            _0x34c160['frames']['length'] +
            ' 项</h3>\n        <div class="story-episode-asset-grid story-episode-frame-grid">\n          ' +
            _0x34c160['frames']
              ['map']((_0x4e8db2) => {
                const _0x8259c5 = _0x4e8db2['mediaType'] === 'video',
                  _0xb91cf2 = '删除' + (_0x8259c5 ? '视频片段' : '片段帧') + '\x20' + _0x4e8db2['name'],
                  _0x5d615a = _0x8259c5
                    ? '<div class="story-episode-frame-video-wrap">\n                  <video class="story-episode-asset-image story-episode-frame-video" src="' +
                      escapeHtml(_0x4e8db2['mediaUrl']) +
                      '\x22' +
                      (_0x4e8db2['imageUrl']
                        ? ' poster="' + escapeHtml(_0x4e8db2['imageUrl']) + '\x22'
                        : '') +
                      ' muted playsinline preload="metadata" aria-label="' +
                      escapeHtml(_0x4e8db2['name']) +
                      '"></video>\n                  <span class="story-episode-frame-video-badge" aria-hidden="true">视频</span>\n                </div>'
                    : renderImageOrEmpty({
                        imageUrl: _0x4e8db2['imageUrl'],
                        alt: _0x4e8db2['name'],
                        className: 'story-episode-asset-image story-episode-frame-image',
                      });
                return (
                  '<div class="story-episode-frame-card">\n              <button type="button" draggable="true" data-story-reference-asset="' +
                  escapeHtml(_0x4e8db2['mentionId']) +
                  '" data-story-reference-frame="' +
                  escapeHtml(_0x4e8db2['id']) +
                  '" data-story-reference-media-type="' +
                  escapeHtml(_0x4e8db2['mediaType']) +
                  '" aria-label="引用' +
                  (_0x8259c5 ? '裁剪视频' : '片段帧') +
                  '\x20' +
                  escapeHtml(_0x4e8db2['name']) +
                  '，仅可拖入提示词\x22\x20aria-busy=\x22' +
                  (_0x4e8db2['captureSavePending'] === !![]) +
                  '">\n                ' +
                  _0x5d615a +
                  '\n                <span>' +
                  escapeHtml(_0x4e8db2['name']) +
                  '</span>\n              </button>\n              <button type="button" class="story-action-icon-button is-danger story-project-delete-trigger story-card-delete-button story-episode-frame-delete-trigger" data-story-action="delete-clip-frame" data-story-clip-frame-id="' +
                  escapeHtml(_0x4e8db2['id']) +
                  '" aria-label="' +
                  escapeHtml(_0xb91cf2) +
                  '\x22\x20' +
                  (_0x4e8db2['captureSavePending'] === !![] ? 'disabled' : '') +
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
      _0x3eec8b +
      '">\n    <header class="story-episode-asset-rail-header">\n      <div class="story-episode-asset-rail-tabs" role="tablist" aria-label="剧本素材类型">\n        <button type="button" class="' +
      (_0x3eec8b === 'assets' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="assets" role="tab" aria-selected="' +
      (_0x3eec8b === 'assets') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x189c10('assets') +
      '<span\x20class=\x22story-episode-asset-tab-label\x22>本集素材</span><span\x20class=\x22story-episode-asset-count\x22\x20data-story-episode-asset-count=\x22assets\x22>' +
      _0x5df054['length'] +
      '</span>\n        </button>\n        <button type="button" class="' +
      (_0x3eec8b === 'frames' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="frames" role="tab" aria-selected="' +
      (_0x3eec8b === 'frames') +
      '">\n          ' +
      _0x189c10('frames') +
      '<span class="story-episode-asset-tab-label">片段帧</span><span class="story-episode-asset-count" data-story-episode-asset-count="frames">' +
      _0x56394a['length'] +
      '</span>\n        </button>\n        <button type="button" class="' +
      (_0x3eec8b === 'library' ? 'is-active' : '') +
      '" data-story-episode-asset-tab="library" role="tab" aria-selected="' +
      (_0x3eec8b === 'library') +
      '">\n          ' +
      _0x189c10('library') +
      '<span class="story-episode-asset-tab-label">总素材</span><span class="story-episode-asset-count" data-story-episode-asset-count="library">' +
      _0x2bc662['count'] +
      '</span>\n        </button>\n      </div>\n      <small data-story-episode-asset-help>' +
      escapeHtml(_0x30aca5['helpText']) +
      '</small>\n    </header>\n    <div class="story-episode-asset-rail-viewport">\n      <div class="story-episode-asset-rail-track" data-story-episode-asset-rail-track>\n        <div class="story-episode-asset-rail-page ' +
      (_0x3eec8b === 'assets' ? 'is-active' : '') +
      '\x22\x20data-story-episode-asset-panel=\x22assets\x22\x20role=\x22tabpanel\x22\x20aria-hidden=\x22' +
      (_0x3eec8b !== 'assets') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x353a29 +
      '\n        </div>\n        <div class="story-episode-asset-rail-page ' +
      (_0x3eec8b === 'frames' ? 'is-active' : '') +
      '" data-story-episode-asset-panel="frames" role="tabpanel" aria-hidden="' +
      (_0x3eec8b !== 'frames') +
      '">\n          ' +
      _0x58fd2e +
      '\n        </div>\n        <div class="story-episode-asset-rail-page ' +
      (_0x3eec8b === 'library' ? 'is-active' : '') +
      '\x22\x20data-story-episode-asset-panel=\x22library\x22\x20role=\x22tabpanel\x22\x20aria-hidden=\x22' +
      (_0x3eec8b !== 'library') +
      '">\n          ' +
      _0x2bc662['markup'] +
      '\n        </div>\n      </div>\n    </div>\n  </aside>'
    );
  }
  function _0x568b0a(_0xb7f3b0 = {}) {
    const _0xb2b549 = _0xb7f3b0['ratios'] || { left: 0x18, center: 0x2c },
      _0x1745e5 =
        '<div\x20class=\x22story-episode-detail-page\x22>\x0a\x20\x20\x20\x20' +
        (_0xb7f3b0['assetRailMarkup'] || '') +
        '\n    <div class="story-episode-splitter story-episode-splitter--assets panel-resize-handle panel-resize-handle--transient" data-story-episode-splitter="assets" role="separator" aria-orientation="vertical" aria-label="调整本集素材区域宽度" aria-valuemin="14" aria-valuemax="34" aria-valuenow="' +
        Math['round'](Number(_0xb2b549['left']) || 0x0) +
        '" tabindex="0"></div>\n    <section class="story-clip-editor">\n      <header>\n        <h2>' +
        escapeHtml(_0xb7f3b0['title'] || '片段脚本') +
        '</h2>\x0a\x20\x20\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-context-row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-meta\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (Array['isArray'](_0xb7f3b0['clipMeta']) ? _0xb7f3b0['clipMeta'] : [])
          ['map']((_0x6dbb22) => '<span>' + escapeHtml(_0x6dbb22) + '</span>')
          ['join']('') +
        '\n        </div>\n        ' +
        (_0xb7f3b0['referenceSummary'] || '') +
        '\n      </div>\n      ' +
        (_0xb7f3b0['promptSurface'] || '') +
        '\n    </section>\n    <div class="story-episode-splitter story-episode-splitter--preview panel-resize-handle panel-resize-handle--transient" data-story-episode-splitter="preview" role="separator" aria-orientation="vertical" aria-label="调整脚本与视频结果区域宽度" aria-valuemin="38" aria-valuemax="76" aria-valuenow="' +
        Math['round']((Number(_0xb2b549['left']) || 0x0) + (Number(_0xb2b549['center']) || 0x0)) +
        '" tabindex="0"></div>\n    <section class="story-video-preview" data-story-clip-navigation="' +
        Boolean(_0xb7f3b0['hasMultipleClips']) +
        '\x22\x20' +
        (_0xb7f3b0['hasMultipleClips']
          ? 'tabindex=\x220\x22\x20aria-label=\x22滚动鼠标滚轮或按左右方向键切换上一幕、下一幕\x22'
          : '') +
        '>\n      ' +
        (_0xb7f3b0['navigationMarkup'] || '') +
        '\n      <div class="story-clip-preview-slide" data-story-clip-preview-slide>\n        ' +
        (_0xb7f3b0['videoPreview'] || '') +
        '\n      </div>\n    </section>\n    ' +
        (_0xb7f3b0['timeline'] || '') +
        '\n  </div>';
    return _0xb7f3b0['episodeRailMarkup']
      ? '<div\x20class=\x22workspace-episode-production\x20story-replication-episode-production\x22\x20data-story-replication-episode-production>' +
          _0xb7f3b0['episodeRailMarkup'] +
          _0x1745e5 +
          '</div>'
      : _0x1745e5;
  }
  return Object['freeze']({
    renderAssetRail: _0x5cf55d,
    renderDetail: _0x568b0a,
    renderOverview: _0x1d29c1,
    resolveEpisodeCardMedia: _0x515479,
  });
}
