function escapeHtml(_0x497ba4) {
  return String(_0x497ba4 ?? '')
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
export function normalizeWorkspaceAssetSplitRatio(_0x3fc543) {
  const _0x6ce6bb = Number(_0x3fc543);
  return Math['max'](
    WORKSPACE_ASSET_SPLIT_RATIO_MIN,
    Math['min'](
      WORKSPACE_ASSET_SPLIT_RATIO_MAX,
      Number['isFinite'](_0x6ce6bb) ? _0x6ce6bb : WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT,
    ),
  );
}
export function normalizeWorkspaceAssetDetailSplitRatio(_0x3adcfa) {
  const _0xfd6808 = Number(_0x3adcfa);
  return Math['max'](
    WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN,
    Math['min'](
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX,
      Number['isFinite'](_0xfd6808) ? _0xfd6808 : WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT,
    ),
  );
}
export function applyWorkspaceAssetSplitRatioToLayout(
  _0x5c03c2,
  _0x4f1833,
  _0x20d977,
  { styleProperty: styleProperty = '--story-assets-left' } = {},
) {
  const _0x5015f0 = normalizeWorkspaceAssetSplitRatio(_0x20d977);
  return (
    _0x5c03c2?.['style']?.['setProperty']?.(styleProperty, _0x5015f0 + '%'),
    _0x4f1833?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x5015f0))),
    _0x5015f0
  );
}
export function applyWorkspaceAssetDetailSplitRatioToLayout(
  _0xab68a2,
  _0x53c309,
  _0x55d7b9,
  { styleProperty: styleProperty = '--workspace-asset-detail-top' } = {},
) {
  const _0x1151d3 = normalizeWorkspaceAssetDetailSplitRatio(_0x55d7b9);
  return (
    _0xab68a2?.['style']?.['setProperty']?.(styleProperty, _0x1151d3 + '%'),
    _0x53c309?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x1151d3))),
    _0x1151d3
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
  const _0x219397 = normalizeWorkspaceAssetSplitRatio(splitRatio),
    _0x1c96dc = Math['max'](0x1, Math['trunc'](Number(tabCount) || 0x1)),
    _0x504c56 =
      activeTab === 'library'
        ? 'story-asset-grid story-asset-grid--workspace-library'
        : 'story-asset-grid workspace-project-asset-grid',
    _0x1b9889 =
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
    _0x2aff91 =
      '<header\x20class=\x22story-page-heading\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-asset-tabs\x22\x20role=\x22tablist\x22\x20aria-label=\x22' +
      escapeHtml(tablistLabel) +
      '\x22\x20data-active-tab=\x22' +
      escapeHtml(activeTab) +
      '" data-tab-count="' +
      _0x1c96dc +
      '">\n        ' +
      tabsHtml +
      '\n      </div>\n      ' +
      (calloutInHeading ? _0x1b9889 : '') +
      '\n    </header>';
  return (
    '<div class="story-assets-page story-content-page' +
    (className ? '\x20' + escapeHtml(className) : '') +
    '\x22\x20data-story-marquee-page-surface=\x22assets\x22\x20data-workspace-marquee-page-surface=\x22assets\x22>\x0a\x20\x20\x20\x20' +
    (headingInListColumn ? '' : _0x2aff91) +
    '\n    <div class="story-assets-switch-region" data-story-assets-switch-region data-workspace-assets-switch-region>\n      <div class="story-assets-layout' +
    (headingInListColumn ? ' story-assets-layout--column-heading' : '') +
    '" style="--story-assets-left: ' +
    _0x219397 +
    '%;">\n        ' +
    (headingInListColumn ? _0x2aff91 : '') +
    '\n        <section class="story-assets-list" data-story-marquee-surface="assets" data-workspace-marquee-surface="assets">\n          ' +
    (calloutInHeading ? '' : _0x1b9889) +
    '\n          <div class="' +
    _0x504c56 +
    '">\n            ' +
    (cardsHtml || '<div\x20class=\x22story-inline-empty\x22>' + escapeHtml(emptyText) + '</div>') +
    '\n          </div>\n        </section>\n        <div class="story-assets-splitter panel-resize-handle panel-resize-handle--transient" data-story-assets-splitter data-workspace-assets-splitter role="separator" aria-orientation="vertical" aria-label="调整素材列表与详情区域宽度" aria-valuemin="28" aria-valuemax="72" aria-valuenow="' +
    Math['round'](_0x219397) +
    '" tabindex="0"></div>\n        ' +
    detailHtml +
    '\n      </div>\n      ' +
    footerHtml +
    '\n    </div>\n  </div>'
  );
}
