function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}
export const WORKSPACE_ASSET_SPLIT_RATIO_MIN = 28;
export const WORKSPACE_ASSET_SPLIT_RATIO_MAX = 72;
export const WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT = 50;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN = 32;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX = 0x44;
export const WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT = 50;
export function normalizeWorkspaceAssetSplitRatio(item) {
  const key = Number(item);
  return Math.max(
    WORKSPACE_ASSET_SPLIT_RATIO_MIN,
    Math.min(
      WORKSPACE_ASSET_SPLIT_RATIO_MAX,
      Number.isFinite(key) ? key : WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT,
    ),
  );
}
export function normalizeWorkspaceAssetDetailSplitRatio(index) {
  const result = Number(index);
  return Math.max(
    WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN,
    Math.min(
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX,
      Number.isFinite(result) ? result : WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT,
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
    el?.style?.setProperty?.(styleProperty, workspaceAssetSplitRatio + '%'),
    el2?.setAttribute?.('aria-valuenow', String(Math.round(workspaceAssetSplitRatio))),
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
    el3?.style?.setProperty?.(styleProperty, workspaceAssetDetailSplitRatio + '%'),
    el4?.setAttribute?.('aria-valuenow', String(Math.round(workspaceAssetDetailSplitRatio))),
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
  calloutInHeading: calloutInHeading = false,
  headingInListColumn: headingInListColumn = false,
  calloutStatus: calloutStatus = '',
  cardsHtml: cardsHtml = '',
  emptyText: emptyText = '暂无素材',
  detailHtml: detailHtml = '',
  footerHtml: footerHtml = '',
  splitRatio: splitRatio = 50,
  activeTab: activeTab = '',
  tabCount: tabCount = 1,
} = {}) {
  const workspaceAssetSplitRatio2 = normalizeWorkspaceAssetSplitRatio(splitRatio),
    target = Math.max(1, Math.trunc(Number(tabCount) || 1)),
    source =
      activeTab === 'library'
        ? 'story-asset-grid story-asset-grid--workspace-library'
        : 'story-asset-grid workspace-project-asset-grid',
    next =
      '<div class="story-assets-callout' +
      (calloutInHeading ? ' story-assets-callout--toolbar' : '') +
      '">\n    <div>\n      ' +
      (calloutInHeading
        ? '<strong tabindex="0" data-tooltip="' +
          escapeHtml(calloutDescription) +
          '" aria-label="' +
          escapeHtml(calloutTitle + '。' + calloutDescription) +
          '">' +
          escapeHtml(calloutTitle) +
          ' <span aria-hidden="true">ⓘ</span></strong>' +
          (calloutStatus ? '<span role="status">' + escapeHtml(calloutStatus) + '</span>' : '')
        : '<strong>' + escapeHtml(calloutTitle) + '</strong><p>' + escapeHtml(calloutDescription) + '</p>') +
      '\n    </div>\n    <div class="story-assets-callout-actions">' +
      calloutActionsHtml +
      '</div>\n  </div>',
    current =
      '<header class="story-page-heading">\n      <div class="story-asset-tabs" role="tablist" aria-label="' +
      escapeHtml(tablistLabel) +
      '" data-active-tab="' +
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
    (className ? ' ' + escapeHtml(className) : '') +
    '" data-story-marquee-page-surface="assets" data-workspace-marquee-page-surface="assets">\n    ' +
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
    (cardsHtml || '<div class="story-inline-empty">' + escapeHtml(emptyText) + '</div>') +
    '\n          </div>\n        </section>\n        <div class="story-assets-splitter panel-resize-handle panel-resize-handle--transient" data-story-assets-splitter data-workspace-assets-splitter role="separator" aria-orientation="vertical" aria-label="调整素材列表与详情区域宽度" aria-valuemin="28" aria-valuemax="72" aria-valuenow="' +
    Math.round(workspaceAssetSplitRatio2) +
    '" tabindex="0"></div>\n        ' +
    detailHtml +
    '\n      </div>\n      ' +
    footerHtml +
    '\n    </div>\n  </div>'
  );
}
