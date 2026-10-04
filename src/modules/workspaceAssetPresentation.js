import { renderWorkspaceDeleteIcon, renderWorkspaceActionIcon } from './workspaceActionIcons.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
  getWorkspaceAssetAppearanceStats,
} from './workspaceAssetAppearance.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function renderAttributes(options = {}) {
  return Object['entries'](options && typeof options === 'object' ? options : {})
    ['filter'](([key, index]) => normalizeText(key) && index !== ![] && index != null)
    ['map'](([result, data]) =>
      data === !![]
        ? '\x20' + escapeHtml(result)
        : '\x20' + escapeHtml(result) + '=\x22' + escapeHtml(data) + '\x22',
    )
    ['join']('');
}
export function renderWorkspaceCardDeleteControl({
  className: className = '',
  ariaLabel: ariaLabel = '删除',
  actionAttributes: actionAttributes = {},
  disabled: disabled = ![],
} = {}) {
  const text = normalizeText(className);
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-action-icon-button\x20is-danger\x20story-project-delete-trigger\x20story-card-delete-button\x20story-card-delete-control' +
    (text ? '\x20' + escapeHtml(text) : '') +
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
  uploadAttributes: uploadAttributes,
  generateAttributes: generateAttributes,
  disabled: disabled = ![],
} = {}) {
  return (
    '<span class="workspace-card-image-actions">' +
    [
      ['upload', '上传形象', uploadAttributes],
      ['generate', '生成形象', generateAttributes],
    ]
      ['map'](
        ([target, source, next]) =>
          '<button type="button" class="story-secondary-button"' +
          renderAttributes(next) +
          (disabled ? ' disabled' : '') +
          '>' +
          renderWorkspaceActionIcon(target) +
          '<span>' +
          source +
          '</span></button>',
      )
      ['join']('') +
    '</span>'
  );
}
export function isWorkspaceAssetHoverLandscape(current, entry) {
  const count = Number(current) || 0x0,
    count2 = Number(entry) || 0x0;
  return count > 0x0 && count2 > 0x0 && count > count2;
}
export function resolveWorkspaceWheelDelta(event) {
  const record = Number(event?.['deltaX'] || 0x0),
    payload = Number(event?.['deltaY'] || 0x0),
    handle = Math['abs'](payload) >= Math['abs'](record) ? payload : record,
    count3 = Number(event?.['deltaMode'] || 0x0),
    state = count3 === 0x1 ? 0x10 : count3 === 0x2 ? 0x320 : 0x1;
  return handle * state;
}
export function consumeWorkspaceWheelDirection(
  config,
  enabled,
  { threshold: threshold = 0x18, lockDuration: lockDuration = 0xdc, now: now = Date['now']() } = {},
) {
  if (!enabled || now < Number(enabled['lockedUntil'] || 0x0)) return 0x0;
  const workspaceWheelDelta = resolveWorkspaceWheelDelta(config);
  if (!workspaceWheelDelta) return 0x0;
  enabled['accumulator'] &&
    Math['sign'](enabled['accumulator']) !== Math['sign'](workspaceWheelDelta) &&
    (enabled['accumulator'] = 0x0);
  enabled['accumulator'] = Number(enabled['accumulator'] || 0x0) + workspaceWheelDelta;
  if (Math['abs'](enabled['accumulator']) < threshold) return 0x0;
  const scope = enabled['accumulator'] > 0x0 ? 0x1 : -0x1;
  return ((enabled['accumulator'] = 0x0), (enabled['lockedUntil'] = now + lockDuration), scope);
}
export function resolveWorkspaceTabTransitionDirection(input, output, list = []) {
  const list2 = Array['isArray'](list) ? list['map'](normalizeText) : [],
    count4 = list2['indexOf'](normalizeText(input)),
    count5 = list2['indexOf'](normalizeText(output));
  if (count4 < 0x0 || count5 < 0x0 || count4 === count5) return 'none';
  return count5 > count4 ? 'forward' : 'backward';
}
export function renderWorkspaceAssetTabIcon(value2) {
  const value3 = ['character', 'scene', 'prop', 'audio', 'library']['includes'](normalizeText(value2))
      ? normalizeText(value2)
      : 'character',
    value4 =
      value3 === 'scene'
        ? '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m6 16 4-4 3 3 2.5-2.5L18 15"/><circle cx="15.5" cy="8.5" r="1.5"/>'
        : value3 === 'prop'
          ? '<path d="m12 3.5 7.5 4.25v8.5L12 20.5l-7.5-4.25v-8.5z"/><path d="m4.5 7.75 7.5 4.5 7.5-4.5M12 12.25v8.25"/>'
          : value3 === 'audio'
            ? '<path d="M5 10v4M8.5 7.5v9M12 4v16M15.5 8.5v7M19 10v4"/>'
            : value3 === 'library'
              ? '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'
              : '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>';
  return (
    '<span class="story-asset-tab-icon" data-icon="' +
    value3 +
    '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none">' +
    value4 +
    '</svg></span>'
  );
}
export function renderWorkspaceAssetLoadingOverlay({
  compact: compact = ![],
  title: title = '图片生成中',
  description: description = '正在等待生成结果，完成后会自动显示。',
} = {}) {
  const value5 = compact
      ? ''
      : '<span\x20class=\x22story-asset-loading-copy\x22><strong>' +
        escapeHtml(title) +
        '</strong>' +
        (description ? '<small>' + escapeHtml(description) + '</small>' : '') +
        '</span>',
    value6 = compact
      ? ''
      : '<div class="storyboard-script-loading-bar" aria-hidden="true"><div class="storyboard-script-loading-bar-fill"></div></div>',
    value7 = '<span\x20class=\x22storyboard-script-loading-spinner\x22\x20aria-hidden=\x22true\x22></span>',
    value8 = compact
      ? value7
      : '<div\x20class=\x22story-video-empty\x20story-video-loading\x22>' +
        value7 +
        value5 +
        value6 +
        '</div>';
  return (
    '<div\x20class=\x22img-loading-overlay\x20story-asset-loading-overlay' +
    (compact ? ' is-compact' : '') +
    '" role="status" aria-busy="true" aria-label="正在生成">' +
    value8 +
    '</div>'
  );
}
export function renderWorkspacePreviewArrow(
  value9,
  {
    action: action = '',
    label: label = '',
    className: className = '',
    actionAttributes: actionAttributes = null,
  } = {},
) {
  const value10 = value9 === 'previous',
    value11 = value10 ? 'story-appearance-arrow--previous' : 'story-appearance-arrow--next',
    value12 = value10 ? 'm14.5\x206.5-5.5\x205.5\x205.5\x205.5' : 'm9.5 6.5 5.5 5.5-5.5 5.5',
    value13 = actionAttributes || (action ? { 'data-workspace-action': action } : {});
  return (
    '<button type="button" class="story-appearance-arrow ' +
    value11 +
    (className ? '\x20' + escapeHtml(className) : '') +
    '\x22' +
    renderAttributes(value13) +
    ' aria-label="' +
    escapeHtml(label) +
    '\x22><svg\x20class=\x22story-appearance-arrow-icon\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22' +
    value12 +
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
  error,
  {
    appearanceId: appearanceId = '',
    selectedAssetId: selectedAssetId = '',
    selectedAppearanceId: selectedAppearanceId = '',
    mediaOnly: mediaOnly = ![],
    getAppearances: getAppearances = getWorkspaceAssetAppearances,
    hasVoiceReference: hasVoiceReference = () => ![],
  } = {},
) {
  if (!error) return null;
  const allAppearances = error['isLibraryAsset'] ? [error] : getAppearances(error),
    text2 = normalizeText(appearanceId),
    appearances2 = allAppearances['filter'](
      (value14) =>
        Boolean(normalizeText(value14?.['imageUrl'])) && (!text2 || normalizeText(value14?.['id']) === text2),
    );
  if (!appearances2['length']) return null;
  const value15 = error['kind'] === 'character' && !error['isLibraryAsset'],
    hasVoice = value15 && hasVoiceReference(error),
    columns = Math['ceil'](Math['sqrt'](Math['max'](0x1, appearances2['length']))),
    value16 = mediaOnly
      ? ''
      : '<div class="story-asset-hover-preview-heading"><strong>' +
        escapeHtml(error['hoverTitle'] || error['name'] || '素材') +
        '</strong><span class="story-asset-hover-summary">已生成 ' +
        appearances2['length'] +
        '/' +
        allAppearances['length'] +
        '</span>' +
        (value15
          ? '<span\x20class=\x22story-character-voice-hover-status\x20' +
            (hasVoice ? 'has-reference' : 'is-missing') +
            '\x22><i></i>' +
            (hasVoice ? '有声音参考' : '无声音参考') +
            '</span>'
          : '') +
        '</div>',
    html =
      value16 +
      '\n    <div class="story-asset-hover-preview-grid">\n      ' +
      appearances2['map']((error2, value17) => {
        const text3 = normalizeText(error2?.['imageUrl']),
          value18 = error2?.['name'] || '形象 ' + (value17 + 0x1),
          value19 = [
            'story-asset-hover-preview-cell',
            error2?.['id'] === selectedAppearanceId && error['id'] === selectedAssetId ? 'is-current' : '',
            error['baseAppearanceId'] === error2?.['id'] ? 'is-base' : '',
          ]
            ['filter'](Boolean)
            ['join']('\x20'),
          value20 = mediaOnly
            ? ''
            : '<span\x20class=\x22story-asset-hover-preview-status\x22>' + escapeHtml(value18) + '</span>',
          value21 = mediaOnly ? '\x20title=\x22' + escapeHtml(value18) + '\x22' : '';
        return (
          '<span\x20class=\x22story-asset-hover-preview-item\x22>' +
          value20 +
          '<span class="' +
          value19 +
          '\x22' +
          value21 +
          '><img src="' +
          escapeHtml(text3) +
          '" alt="' +
          escapeHtml(error['name'] + ' · ' + value18) +
          '" data-story-asset-hover-image loading="eager" decoding="async" draggable="false"></span></span>'
        );
      })['join']('') +
      '\x0a\x20\x20\x20\x20</div>';
  return {
    allAppearances: allAppearances,
    appearances: appearances2,
    columns: columns,
    hasVoice: hasVoice,
    mediaOnly: mediaOnly,
    html: html,
  };
}
export function renderWorkspaceCardVoiceStatus(value22) {
  return (
    '<span class="workspace-card-voice-status ' +
    (value22 ? 'has-reference' : 'is-missing') +
    '"><i aria-hidden="true"></i>' +
    (value22 ? '有声音参考' : '无声音参考') +
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
  const total = Array['isArray'](appearances) ? appearances : [],
    error3 =
      previewAppearance ||
      getWorkspaceAssetBaseAppearance(asset) ||
      total['find']((value23) => normalizeText(value23?.['imageUrl'])) ||
      total[0x0] ||
      asset,
    text4 = normalizeText(error3?.['imageUrl']),
    text5 = normalizeText(fallbackImageUrl),
    value24 = workspaceAssetLibraryImage
      ? ' data-workspace-asset-library-image' +
        (text5 && text5 !== text4
          ? ' data-workspace-asset-library-fallback-src="' + escapeHtml(text5) + '\x22'
          : '')
      : '',
    value25 =
      cardMediaHtml ||
      (text4
        ? '<img\x20class=\x22story-asset-card-image\x22\x20src=\x22' +
          escapeHtml(text4) +
          '" alt="' +
          escapeHtml('' + (asset['name'] || '') + (error3?.['name'] ? '\x20·\x20' + error3['name'] : '')) +
          '" loading="lazy" decoding="async"' +
          value24 +
          '>'
        : '<div class="story-asset-card-image story-media-empty" role="img" aria-label="' +
          escapeHtml((asset['name'] || '素材') + '待生成') +
          '\x22><span>待生成</span></div>'),
    value26 =
      stats && typeof stats === 'object' ? stats : { total: total['length'], generated: 0x0, failed: 0x0 },
    value27 =
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
      total['length'] +
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
      value25 +
      '\n      ' +
      (!loading && !text4 && normalizeText(error3?.['error'])
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
          : value26['total'] > 0x1
            ? '<span>形象 ' + value26['generated'] + '/' + value26['total'] + '</span>'
            : '')) +
      '</span>\n      ' +
      cardMetaHtml +
      '\n      <p>' +
      escapeHtml(promptPreview) +
      '</p>\n    </span>\n  </button>';
  if (!preserveShell && !deleteControlHtml && !accessoryHtml) return value27;
  return (
    '<span\x20class=\x22story-asset-card-shell' +
    (shellClassName ? '\x20' + escapeHtml(shellClassName) : '') +
    '">\n    ' +
    value27 +
    '\n    ' +
    deleteControlHtml +
    accessoryHtml +
    '\x0a\x20\x20</span>'
  );
}
