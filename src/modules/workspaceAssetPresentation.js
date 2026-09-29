import { renderWorkspaceDeleteIcon, renderWorkspaceActionIcon } from './workspaceActionIcons.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
  getWorkspaceAssetAppearanceStats,
} from './workspaceAssetAppearance.js';
function normalizeText(_0x992e03) {
  return String(_0x992e03 ?? '')['trim']();
}
function escapeHtml(_0x5c3f13) {
  return String(_0x5c3f13 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function renderAttributes(_0x5ef3b8 = {}) {
  return Object['entries'](_0x5ef3b8 && typeof _0x5ef3b8 === 'object' ? _0x5ef3b8 : {})
    ['filter'](([_0x7b9358, _0x40c259]) => normalizeText(_0x7b9358) && _0x40c259 !== ![] && _0x40c259 != null)
    ['map'](([_0x559011, _0x55598f]) =>
      _0x55598f === !![]
        ? '\x20' + escapeHtml(_0x559011)
        : '\x20' + escapeHtml(_0x559011) + '=\x22' + escapeHtml(_0x55598f) + '\x22',
    )
    ['join']('');
}
export function renderWorkspaceCardDeleteControl({
  className: className = '',
  ariaLabel: ariaLabel = '删除',
  actionAttributes: actionAttributes = {},
  disabled: disabled = ![],
} = {}) {
  const _0x4c212b = normalizeText(className);
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-action-icon-button\x20is-danger\x20story-project-delete-trigger\x20story-card-delete-button\x20story-card-delete-control' +
    (_0x4c212b ? '\x20' + escapeHtml(_0x4c212b) : '') +
    '\x22' +
    renderAttributes(actionAttributes) +
    ' aria-label="' +
    escapeHtml(ariaLabel) +
    '\x22' +
    (disabled ? '\x20disabled' : '') +
    '>' +
    renderWorkspaceDeleteIcon() +
    '</button>'
  );
}
export function renderWorkspaceCardImageActions({
  uploadAttributes: _0x15b326,
  generateAttributes: _0x3a890a,
  disabled: disabled = ![],
} = {}) {
  return (
    '<span class="workspace-card-image-actions">' +
    [
      ['upload', '上传形象', _0x15b326],
      ['generate', '生成形象', _0x3a890a],
    ]
      ['map'](
        ([_0x1c1790, _0x2d91c0, _0x55344a]) =>
          '<button type="button" class="story-secondary-button"' +
          renderAttributes(_0x55344a) +
          (disabled ? ' disabled' : '') +
          '>' +
          renderWorkspaceActionIcon(_0x1c1790) +
          '<span>' +
          _0x2d91c0 +
          '</span></button>',
      )
      ['join']('') +
    '</span>'
  );
}
export function isWorkspaceAssetHoverLandscape(_0x4e4eba, _0x311c0b) {
  const _0x371608 = Number(_0x4e4eba) || 0x0,
    _0x2428ae = Number(_0x311c0b) || 0x0;
  return _0x371608 > 0x0 && _0x2428ae > 0x0 && _0x371608 > _0x2428ae;
}
export function resolveWorkspaceWheelDelta(_0x409508) {
  const _0x2fc98e = Number(_0x409508?.['deltaX'] || 0x0),
    _0x417be2 = Number(_0x409508?.['deltaY'] || 0x0),
    _0x416b40 = Math['abs'](_0x417be2) >= Math['abs'](_0x2fc98e) ? _0x417be2 : _0x2fc98e,
    _0x24118e = Number(_0x409508?.['deltaMode'] || 0x0),
    _0x17b60d = _0x24118e === 0x1 ? 0x10 : _0x24118e === 0x2 ? 0x320 : 0x1;
  return _0x416b40 * _0x17b60d;
}
export function consumeWorkspaceWheelDirection(
  _0x1f1a3a,
  _0x30ec5a,
  { threshold: threshold = 0x18, lockDuration: lockDuration = 0xdc, now: now = Date['now']() } = {},
) {
  if (!_0x30ec5a || now < Number(_0x30ec5a['lockedUntil'] || 0x0)) return 0x0;
  const _0x53fd91 = resolveWorkspaceWheelDelta(_0x1f1a3a);
  if (!_0x53fd91) return 0x0;
  _0x30ec5a['accumulator'] &&
    Math['sign'](_0x30ec5a['accumulator']) !== Math['sign'](_0x53fd91) &&
    (_0x30ec5a['accumulator'] = 0x0);
  _0x30ec5a['accumulator'] = Number(_0x30ec5a['accumulator'] || 0x0) + _0x53fd91;
  if (Math['abs'](_0x30ec5a['accumulator']) < threshold) return 0x0;
  const _0x4b41a7 = _0x30ec5a['accumulator'] > 0x0 ? 0x1 : -0x1;
  return ((_0x30ec5a['accumulator'] = 0x0), (_0x30ec5a['lockedUntil'] = now + lockDuration), _0x4b41a7);
}
export function resolveWorkspaceTabTransitionDirection(_0x21dd39, _0x418fd3, _0x15c40d = []) {
  const _0x2411ef = Array['isArray'](_0x15c40d) ? _0x15c40d['map'](normalizeText) : [],
    _0x21c956 = _0x2411ef['indexOf'](normalizeText(_0x21dd39)),
    _0xe83d78 = _0x2411ef['indexOf'](normalizeText(_0x418fd3));
  if (_0x21c956 < 0x0 || _0xe83d78 < 0x0 || _0x21c956 === _0xe83d78) return 'none';
  return _0xe83d78 > _0x21c956 ? 'forward' : 'backward';
}
export function renderWorkspaceAssetTabIcon(_0x394111) {
  const _0x59bfda = ['character', 'scene', 'prop', 'audio', 'library']['includes'](normalizeText(_0x394111))
      ? normalizeText(_0x394111)
      : 'character',
    _0x23cc76 =
      _0x59bfda === 'scene'
        ? '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m6 16 4-4 3 3 2.5-2.5L18 15"/><circle cx="15.5" cy="8.5" r="1.5"/>'
        : _0x59bfda === 'prop'
          ? '<path d="m12 3.5 7.5 4.25v8.5L12 20.5l-7.5-4.25v-8.5z"/><path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.25v8.25"/>'
          : _0x59bfda === 'audio'
            ? '<path d="M5 10v4M8.5 7.5v9M12 4v16M15.5 8.5v7M19 10v4"/>'
            : _0x59bfda === 'library'
              ? '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'
              : '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>';
  return (
    '<span class="story-asset-tab-icon" data-icon="' +
    _0x59bfda +
    '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none">' +
    _0x23cc76 +
    '</svg></span>'
  );
}
export function renderWorkspaceAssetLoadingOverlay({
  compact: compact = ![],
  title: title = '图片生成中',
  description: description = '正在等待生成结果，完成后会自动显示。',
} = {}) {
  const _0x1961b5 = compact
      ? ''
      : '<span\x20class=\x22story-asset-loading-copy\x22><strong>' +
        escapeHtml(title) +
        '</strong>' +
        (description ? '<small>' + escapeHtml(description) + '</small>' : '') +
        '</span>',
    _0x7c5c4d = compact
      ? ''
      : '<div class="storyboard-script-loading-bar" aria-hidden="true"><div class="storyboard-script-loading-bar-fill"></div></div>',
    _0x3faa44 =
      '<span\x20class=\x22storyboard-script-loading-spinner\x22\x20aria-hidden=\x22true\x22></span>',
    _0xe6c717 = compact
      ? _0x3faa44
      : '<div\x20class=\x22story-video-empty\x20story-video-loading\x22>' +
        _0x3faa44 +
        _0x1961b5 +
        _0x7c5c4d +
        '</div>';
  return (
    '<div\x20class=\x22img-loading-overlay\x20story-asset-loading-overlay' +
    (compact ? ' is-compact' : '') +
    '" role="status" aria-busy="true" aria-label="正在生成">' +
    _0xe6c717 +
    '</div>'
  );
}
export function renderWorkspacePreviewArrow(
  _0x6688e6,
  {
    action: action = '',
    label: label = '',
    className: className = '',
    actionAttributes: actionAttributes = null,
  } = {},
) {
  const _0x1b30e3 = _0x6688e6 === 'previous',
    _0x427139 = _0x1b30e3 ? 'story-appearance-arrow--previous' : 'story-appearance-arrow--next',
    _0xfcdce9 = _0x1b30e3 ? 'm14.5\x206.5-5.5\x205.5\x205.5\x205.5' : 'm9.5 6.5 5.5 5.5-5.5 5.5',
    _0xf90f2 = actionAttributes || (action ? { 'data-workspace-action': action } : {});
  return (
    '<button type="button" class="story-appearance-arrow ' +
    _0x427139 +
    (className ? '\x20' + escapeHtml(className) : '') +
    '\x22' +
    renderAttributes(_0xf90f2) +
    ' aria-label="' +
    escapeHtml(label) +
    '\x22><svg\x20class=\x22story-appearance-arrow-icon\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22' +
    _0xfcdce9 +
    '"/></svg></button>'
  );
}
export function renderWorkspaceCardAppearanceNavigation({
  attributes: attributes = {},
  previousAttributes: previousAttributes = {},
  nextAttributes: nextAttributes = {},
} = {}) {
  return (
    '<span\x20class=\x22story-card-appearance-navigation\x22' +
    renderAttributes(attributes) +
    '>' +
    renderWorkspacePreviewArrow('previous', { label: '上一个形象', actionAttributes: previousAttributes }) +
    renderWorkspacePreviewArrow('next', { label: '下一个形象', actionAttributes: nextAttributes }) +
    '</span>'
  );
}
export function buildWorkspaceAssetHoverPreviewContent(
  _0x38f715,
  {
    appearanceId: appearanceId = '',
    selectedAssetId: selectedAssetId = '',
    selectedAppearanceId: selectedAppearanceId = '',
    mediaOnly: mediaOnly = ![],
    getAppearances: getAppearances = getWorkspaceAssetAppearances,
    hasVoiceReference: hasVoiceReference = () => ![],
  } = {},
) {
  if (!_0x38f715) return null;
  const _0x109010 = _0x38f715['isLibraryAsset'] ? [_0x38f715] : getAppearances(_0x38f715),
    _0x3ee092 = normalizeText(appearanceId),
    _0xb2f377 = _0x109010['filter'](
      (_0x2adb25) =>
        Boolean(normalizeText(_0x2adb25?.['imageUrl'])) &&
        (!_0x3ee092 || normalizeText(_0x2adb25?.['id']) === _0x3ee092),
    );
  if (!_0xb2f377['length']) return null;
  const _0x51b4da = _0x38f715['kind'] === 'character' && !_0x38f715['isLibraryAsset'],
    _0x35890b = _0x51b4da && hasVoiceReference(_0x38f715),
    _0x1395ea = Math['ceil'](Math['sqrt'](Math['max'](0x1, _0xb2f377['length']))),
    _0x15d370 = mediaOnly
      ? ''
      : '<div class="story-asset-hover-preview-heading"><strong>' +
        escapeHtml(_0x38f715['hoverTitle'] || _0x38f715['name'] || '素材') +
        '</strong><span class="story-asset-hover-summary">已生成 ' +
        _0xb2f377['length'] +
        '/' +
        _0x109010['length'] +
        '</span>' +
        (_0x51b4da
          ? '<span\x20class=\x22story-character-voice-hover-status\x20' +
            (_0x35890b ? 'has-reference' : 'is-missing') +
            '\x22><i></i>' +
            (_0x35890b ? '有声音参考' : '无声音参考') +
            '</span>'
          : '') +
        '</div>',
    _0xc56be2 =
      _0x15d370 +
      '\n    <div class="story-asset-hover-preview-grid">\n      ' +
      _0xb2f377['map']((_0xa4cb76, _0xa24e07) => {
        const _0x23063e = normalizeText(_0xa4cb76?.['imageUrl']),
          _0x219fbb = _0xa4cb76?.['name'] || '形象 ' + (_0xa24e07 + 0x1),
          _0x497236 = [
            'story-asset-hover-preview-cell',
            _0xa4cb76?.['id'] === selectedAppearanceId && _0x38f715['id'] === selectedAssetId
              ? 'is-current'
              : '',
            _0x38f715['baseAppearanceId'] === _0xa4cb76?.['id'] ? 'is-base' : '',
          ]
            ['filter'](Boolean)
            ['join']('\x20'),
          _0x2f856f = mediaOnly
            ? ''
            : '<span\x20class=\x22story-asset-hover-preview-status\x22>' + escapeHtml(_0x219fbb) + '</span>',
          _0x229af7 = mediaOnly ? '\x20title=\x22' + escapeHtml(_0x219fbb) + '\x22' : '';
        return (
          '<span\x20class=\x22story-asset-hover-preview-item\x22>' +
          _0x2f856f +
          '<span class="' +
          _0x497236 +
          '\x22' +
          _0x229af7 +
          '><img src="' +
          escapeHtml(_0x23063e) +
          '" alt="' +
          escapeHtml(_0x38f715['name'] + ' · ' + _0x219fbb) +
          '" data-story-asset-hover-image loading="eager" decoding="async" draggable="false"></span></span>'
        );
      })['join']('') +
      '\x0a\x20\x20\x20\x20</div>';
  return {
    allAppearances: _0x109010,
    appearances: _0xb2f377,
    columns: _0x1395ea,
    hasVoice: _0x35890b,
    mediaOnly: mediaOnly,
    html: _0xc56be2,
  };
}
export function renderWorkspaceCardVoiceStatus(_0xfabafb) {
  return (
    '<span class="workspace-card-voice-status ' +
    (_0xfabafb ? 'has-reference' : 'is-missing') +
    '"><i aria-hidden="true"></i>' +
    (_0xfabafb ? '有声音参考' : '无声音参考') +
    '</span>'
  );
}
export function renderWorkspaceAssetCard({
  asset: asset = {},
  appearances: appearances = getWorkspaceAssetAppearances(asset),
  previewAppearance: previewAppearance = null,
  stats: stats = getWorkspaceAssetAppearanceStats(asset),
  selected: selected = ![],
  selectionMode: selectionMode = ![],
  checked: checked = ![],
  showSelectionIndicator: showSelectionIndicator = !![],
  loading: loading = ![],
  draggable: draggable = ![],
  promptPreview: promptPreview = '',
  statusText: statusText = '',
  cardStatusHtml: cardStatusHtml = '',
  cardClassName: cardClassName = '',
  cardAttributes: cardAttributes = '',
  shellClassName: shellClassName = '',
  preserveShell: preserveShell = ![],
  accessoryHtml: accessoryHtml = '',
  cardMetaHtml: cardMetaHtml = '',
  headingAccessoryHtml: headingAccessoryHtml = '',
  cardMediaHtml: cardMediaHtml = '',
  fallbackImageUrl: fallbackImageUrl = '',
  workspaceAssetLibraryImage: workspaceAssetLibraryImage = ![],
  nameAttributes: nameAttributes = '',
  roleHtml: roleHtml = '',
  deleteControlHtml: deleteControlHtml = '',
} = {}) {
  const _0x104e09 = Array['isArray'](appearances) ? appearances : [],
    _0x30c89c =
      previewAppearance ||
      getWorkspaceAssetBaseAppearance(asset) ||
      _0x104e09['find']((_0x40fee5) => normalizeText(_0x40fee5?.['imageUrl'])) ||
      _0x104e09[0x0] ||
      asset,
    _0x5c3f3d = normalizeText(_0x30c89c?.['imageUrl']),
    _0x289357 = normalizeText(fallbackImageUrl),
    _0x1220b6 = workspaceAssetLibraryImage
      ? ' data-workspace-asset-library-image' +
        (_0x289357 && _0x289357 !== _0x5c3f3d
          ? ' data-workspace-asset-library-fallback-src="' + escapeHtml(_0x289357) + '\x22'
          : '')
      : '',
    _0x28313e =
      cardMediaHtml ||
      (_0x5c3f3d
        ? '<img\x20class=\x22story-asset-card-image\x22\x20src=\x22' +
          escapeHtml(_0x5c3f3d) +
          '" alt="' +
          escapeHtml(
            '' + (asset['name'] || '') + (_0x30c89c?.['name'] ? '\x20·\x20' + _0x30c89c['name'] : ''),
          ) +
          '" loading="lazy" decoding="async"' +
          _0x1220b6 +
          '>'
        : '<div class="story-asset-card-image story-media-empty" role="img" aria-label="' +
          escapeHtml((asset['name'] || '素材') + '待生成') +
          '\x22><span>待生成</span></div>'),
    _0x219ba5 =
      stats && typeof stats === 'object'
        ? stats
        : { total: _0x104e09['length'], generated: 0x0, failed: 0x0 },
    _0x712039 =
      '<button type="button" class="story-asset-card ' +
      (selected && !selectionMode ? 'is-selected' : '') +
      '\x20' +
      (selectionMode ? 'is-selection-mode' : '') +
      '\x20' +
      (checked ? 'is-checked' : '') +
      (cardClassName ? '\x20' + escapeHtml(cardClassName) : '') +
      '\x22\x20data-workspace-asset-id=\x22' +
      escapeHtml(asset['id']) +
      '" data-story-asset-id="' +
      escapeHtml(asset['id']) +
      '" data-workspace-marquee-item data-story-marquee-item data-workspace-marquee-id="' +
      escapeHtml(asset['id']) +
      '" data-story-marquee-id="' +
      escapeHtml(asset['id']) +
      '\x22\x20data-story-appearance-count=\x22' +
      _0x104e09['length'] +
      '" aria-pressed="' +
      (selectionMode ? String(checked) : 'false') +
      '\x22' +
      (draggable ? ' draggable="true"' : '') +
      (cardAttributes ? '\x20' + cardAttributes : '') +
      '>\n    ' +
      (selectionMode && showSelectionIndicator
        ? '<span\x20class=\x22story-asset-select-indicator\x22\x20aria-hidden=\x22true\x22>' +
          (checked ? '✓' : '') +
          '</span>'
        : '') +
      '\n    <span class="story-asset-card-media ' +
      (loading ? 'img-preview-loading' : '') +
      '" aria-busy="' +
      loading +
      '">\n      ' +
      _0x28313e +
      '\n      ' +
      (!loading && !_0x5c3f3d && normalizeText(_0x30c89c?.['error'])
        ? '<span\x20class=\x22story-asset-card-failure\x22\x20role=\x22status\x22>生成失败</span>'
        : '') +
      '\n      ' +
      (loading ? renderWorkspaceAssetLoadingOverlay({ compact: !![] }) : '') +
      '\x0a\x20\x20\x20\x20</span>\x0a\x20\x20\x20\x20<span\x20class=\x22story-asset-card-copy\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-asset-card-heading\x22><strong' +
      (nameAttributes ? '\x20' + nameAttributes : '') +
      '>' +
      escapeHtml(asset['name'] || '未命名素材') +
      '</strong>' +
      roleHtml +
      headingAccessoryHtml +
      '</span>\n      <span class="story-asset-card-status">' +
      (cardStatusHtml ||
        (statusText
          ? '<span>' + escapeHtml(statusText) + '</span>'
          : _0x219ba5['total'] > 0x1
            ? '<span>形象 ' + _0x219ba5['generated'] + '/' + _0x219ba5['total'] + '</span>'
            : '')) +
      '</span>\n      ' +
      cardMetaHtml +
      '\n      <p>' +
      escapeHtml(promptPreview) +
      '</p>\n    </span>\n  </button>';
  if (!preserveShell && !deleteControlHtml && !accessoryHtml) return _0x712039;
  return (
    '<span\x20class=\x22story-asset-card-shell' +
    (shellClassName ? '\x20' + escapeHtml(shellClassName) : '') +
    '">\n    ' +
    _0x712039 +
    '\n    ' +
    deleteControlHtml +
    accessoryHtml +
    '\x0a\x20\x20</span>'
  );
}
