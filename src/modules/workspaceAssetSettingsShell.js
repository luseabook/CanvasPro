function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#039;');
}
export const WORKSPACE_ASSET_SPLIT_RATIO_MIN = 0x1c;
export const WORKSPACE_ASSET_SPLIT_RATIO_MAX = 0x48;
export const WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT = 0x32;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN = 0x20;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX = 0x44;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT = 0x32;
export function normalizeWorkspaceAssetSplitRatio(item) {
  const key = Number(item);
  return Math['max'](
    WORKSPACE_ASSET_SPLIT_RATIO_MIN,
    Math['min'](
      WORKSPACE_ASSET_SPLIT_RATIO_MAX,
      Number['isFinite'](key) ? key : WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT,
    ),
  );
}
export function normalizeWorkspaceAssetDetailSplitRatio(index) {
  const result = Number(index);
  return Math['max'](
    WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN,
    Math['min'](
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX,
      Number['isFinite'](result) ? result : WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT,
    ),
  );
}
export function applyWorkspaceAssetSplitRatioToLayout(
  el,
  el2,
  data,
  { styleProperty: styleProperty = '--story-assets-left' } = {},
) {
  const workspaceAssetSplitRatio = normalizeWorkspaceAssetSplitRatio(data);
  return (
    el?.['style']?.['setProperty']?.(styleProperty, workspaceAssetSplitRatio + '%'),
    el2?.['setAttribute']?.('aria-valuenow', String(Math['round'](workspaceAssetSplitRatio))),
    workspaceAssetSplitRatio
  );
}
export function applyWorkspaceAssetDetailSplitRatioToLayout(
  el3,
  el4,
  options,
  { styleProperty: styleProperty = '--workspace-asset-detail-top' } = {},
) {
  const workspaceAssetDetailSplitRatio = normalizeWorkspaceAssetDetailSplitRatio(options);
  return (
    el3?.['style']?.['setProperty']?.(styleProperty, workspaceAssetDetailSplitRatio + '%'),
    el4?.['setAttribute']?.('aria-valuenow', String(Math['round'](workspaceAssetDetailSplitRatio))),
    workspaceAssetDetailSplitRatio
  );
}
export function renderWorkspaceAssetSettingsShell({
  className: className = '',
  tabsHtml: tabsHtml = '',
  tablistLabel: tablistLabel = '素材分类',
  calloutTitle: calloutTitle = '',
  calloutDescription: calloutDescription = '',
  calloutActionsHtml: calloutActionsHtml = '',
  calloutInHeading: calloutInHeading = ![],
  headingInListColumn: headingInListColumn = ![],
  calloutStatus: calloutStatus = '',
  cardsHtml: cardsHtml = '',
  emptyText: emptyText = '暂无素材',
  detailHtml: detailHtml = '',
  footerHtml: footerHtml = '',
  splitRatio: splitRatio = 0x32,
  activeTab: activeTab = '',
  tabCount: tabCount = 0x1,
} = {}) {
  const workspaceAssetSplitRatio2 = normalizeWorkspaceAssetSplitRatio(splitRatio),
    target = Math['max'](0x1, Math['trunc'](Number(tabCount) || 0x1)),
    source =
      activeTab === 'library'
        ? 'story-asset-grid story-asset-grid--workspace-library'
        : 'story-asset-grid workspace-project-asset-grid',
    next =
      '<div class="story-assets-callout' +
      (calloutInHeading ? ' story-assets-callout--toolbar' : '') +
      '\x22>\x0a\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20' +
      (calloutInHeading
        ? '<strong tabindex="0" data-tooltip="' +
          escapeHtml(calloutDescription) +
          '" aria-label="' +
          escapeHtml(calloutTitle + '。' + calloutDescription) +
          '\x22>' +
          escapeHtml(calloutTitle) +
          '\x20<span\x20aria-hidden=\x22true\x22>ⓘ</span></strong>' +
          (calloutStatus ? '<span\x20role=\x22status\x22>' + escapeHtml(calloutStatus) + '</span>' : '')
        : '<strong>' + escapeHtml(calloutTitle) + '</strong><p>' + escapeHtml(calloutDescription) + '</p>') +
      '\n    </div>\n    <div class="story-assets-callout-actions">' +
      calloutActionsHtml +
      '</div>\n  </div>',
    current =
      '<header\x20class=\x22story-page-heading\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-asset-tabs\x22\x20role=\x22tablist\x22\x20aria-label=\x22' +
      escapeHtml(tablistLabel) +
      '\x22\x20data-active-tab=\x22' +
      escapeHtml(activeTab) +
      '" data-tab-count="' +
      target +
      '">\n        ' +
      tabsHtml +
      '\n      </div>\n      ' +
      (calloutInHeading ? next : '') +
      '\n    </header>';
  return (
    '<div class="story-assets-page story-content-page' +
    (className ? '\x20' + escapeHtml(className) : '') +
    '\x22\x20data-story-marquee-page-surface=\x22assets\x22\x20data-workspace-marquee-page-surface=\x22assets\x22>\x0a\x20\x20\x20\x20' +
    (headingInListColumn ? '' : current) +
    '\n    <div class="story-assets-switch-region" data-story-assets-switch-region data-workspace-assets-switch-region>\n      <div class="story-assets-layout' +
    (headingInListColumn ? ' story-assets-layout--column-heading' : '') +
    '" style="--story-assets-left: ' +
    workspaceAssetSplitRatio2 +
    '%;">\n        ' +
    (headingInListColumn ? current : '') +
    '\n        <section class="story-assets-list" data-story-marquee-surface="assets" data-workspace-marquee-surface="assets">\n          ' +
    (calloutInHeading ? '' : next) +
    '\n          <div class="' +
    source +
    '">\n            ' +
    (cardsHtml || '<div\x20class=\x22story-inline-empty\x22>' + escapeHtml(emptyText) + '</div>') +
    '\n          </div>\n        </section>\n        <div class="story-assets-splitter panel-resize-handle panel-resize-handle--transient" data-story-assets-splitter data-workspace-assets-splitter role="separator" aria-orientation="vertical" aria-label="调整素材列表与详情区域宽度" aria-valuemin="28" aria-valuemax="72" aria-valuenow="' +
    Math['round'](workspaceAssetSplitRatio2) +
    '" tabindex="0"></div>\n        ' +
    detailHtml +
    '\n      </div>\n      ' +
    footerHtml +
    '\n    </div>\n  </div>'
  );
}
