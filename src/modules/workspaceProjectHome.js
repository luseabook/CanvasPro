function normalizeText(value) {
  return String(value ?? '').trim();
}
function escapeHtml(item) {
  return String(item ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}
export function getWorkspaceProjectTaskPresentation({
  activeCount: activeCount = 0,
  failedCount: failedCount = 0,
} = {}) {
  const activeCount2 = Math.max(0, Math.trunc(Number(activeCount) || 0)),
    failedCount2 = Math.max(0, Math.trunc(Number(failedCount) || 0));
  return {
    activeCount: activeCount2,
    failedCount: failedCount2,
    label: activeCount2
      ? '后台生成中 · ' + activeCount2 + ' 个任务'
      : failedCount2
        ? failedCount2 + ' 个任务需重试'
        : '制作中',
  };
}
const WORKSPACE_PROJECT_SORT_ORDERS = Object.freeze(['updated-desc', 'created-asc', 'title-asc']),
  WORKSPACE_PROJECT_SORT_OPTIONS = Object.freeze([
    { value: 'updated-desc', label: '最近更新' },
    { value: 'created-asc', label: '最早创建' },
    { value: 'title-asc', label: '按名称' },
  ]);
export function normalizeWorkspaceProjectSortOrder(key) {
  const text = normalizeText(key);
  return WORKSPACE_PROJECT_SORT_ORDERS.includes(text) ? text : 'updated-desc';
}
function getWorkspaceProjectCreatedAt(options = {}) {
  const count = Number(options?.createdAt || options?.data?.project?.createdAt || 0);
  if (Number.isFinite(count) && count > 0) return count;
  const count2 = Number(normalizeText(options?.id).match(/\d{10,}/)?.[0] || 0);
  if (Number.isFinite(count2) && count2 > 0) return count2;
  return Math.max(0, Number(options?.updatedAt || 0));
}
export function getWorkspaceProjectHomeEntries(
  list = [],
  { query: query = '', sortOrder: sortOrder = 'updated-desc', showArchived: showArchived = false } = {},
) {
  const text2 = normalizeText(query).toLocaleLowerCase('zh-CN'),
    workspaceProjectSortOrder = normalizeWorkspaceProjectSortOrder(sortOrder);
  return (Array.isArray(list) ? list : [])
    .filter((index) => Boolean(Number(index?.archivedAt || 0)) === Boolean(showArchived))
    .filter((result) => {
      if (!text2) return true;
      const list2 = normalizeText(result?.title || result?.data?.project?.title).toLocaleLowerCase('zh-CN');
      return list2.includes(text2);
    })
    .map((entry, index2) => ({ entry: entry, index: index2 }))
    .sort((data, target) => {
      if (workspaceProjectSortOrder === 'title-asc') {
        const text3 = normalizeText(
            data.entry?.title || data.entry?.data?.project?.title,
          ),
          text4 = normalizeText(
            target.entry?.title || target.entry?.data?.project?.title,
          );
        return text3.localeCompare(text4, 'zh-CN') || data.index - target.index;
      }
      if (workspaceProjectSortOrder === 'created-asc')
        return (
          getWorkspaceProjectCreatedAt(data.entry) - getWorkspaceProjectCreatedAt(target.entry) ||
          data.index - target.index
        );
      return (
        Number(target.entry?.updatedAt || 0) - Number(data.entry?.updatedAt || 0) ||
        data.index - target.index
      );
    })
    .map(({ entry: entry2 }) => entry2);
}
export function refreshWorkspaceProjectResultsInPlace({
  root: root,
  documentObject: documentObject,
  renderResults: renderResults,
} = {}) {
  const el = root?.querySelector?.('.story-projects-section');
  if (!el || !documentObject?.createElement || typeof renderResults !== 'function') return false;
  const el2 = documentObject.createElement('template');
  el2.innerHTML = String(renderResults() || '').trim();
  const enabled = el.querySelector?.('.story-project-grid, .story-project-empty'),
    enabled2 = el2.content?.firstElementChild;
  if (!enabled || !enabled2?.matches?.('.story-project-grid, .story-project-empty')) return false;
  return (enabled.replaceWith(enabled2), true);
}
export function renderWorkspaceProjectSortControl(source = 'updated-desc') {
  const workspaceProjectSortOrder2 = normalizeWorkspaceProjectSortOrder(source),
    next =
      WORKSPACE_PROJECT_SORT_OPTIONS.find((el3) => el3.value === workspaceProjectSortOrder2) ||
      WORKSPACE_PROJECT_SORT_OPTIONS[0];
  return (
    '<div class="story-project-sort" data-workspace-project-sort-wrap data-story-project-sort-wrap>\n    <button type="button" class="story-project-sort-trigger story-menu-trigger" data-workspace-action="toggle-project-sort-menu" data-story-action="toggle-project-sort-menu" aria-haspopup="menu" aria-expanded="false">\n      <span>' +
    next.label +
    '</span><span class="story-project-sort-chevron" aria-hidden="true"></span>\n    </button>\n    <div class="story-project-sort-menu" data-workspace-project-sort-menu data-story-project-sort-menu role="menu" aria-label="项目排序" aria-hidden="true">\n      ' +
    WORKSPACE_PROJECT_SORT_OPTIONS.map(
      (el4) =>
        '<button type="button" class="story-project-sort-option' +
        (el4.value === workspaceProjectSortOrder2 ? ' is-selected' : '') +
        '" data-workspace-action="select-project-sort" data-story-action="select-project-sort" data-workspace-project-sort-option="' +
        el4.value +
        '" data-story-project-sort-option="' +
        el4.value +
        '" role="menuitemradio" aria-checked="' +
        (el4.value === workspaceProjectSortOrder2) +
        '">\n        <span>' +
        el4.label +
        '</span><span class="story-project-sort-check" aria-hidden="true">✓</span>\n      </button>',
    ).join('') +
    '\n    </div>\n  </div>'
  );
}
function renderWorkspaceProjectCover(
  list3 = [],
  {
    emptyLabel: emptyLabel = '项目',
    altPrefix: altPrefix = '项目封面',
    projectTypeLabel: projectTypeLabel = '',
  } = {},
) {
  const text5 = normalizeText(projectTypeLabel),
    list4 = (Array.isArray(list3) ? list3 : [])
      .map(normalizeText)
      .filter((current, record, list5) => current && list5.indexOf(current) === record)
      .slice(0, 3);
  if (!list4.length)
    return (
      '<div class="story-project-cover story-media-empty" data-workspace-project-cover role="img" aria-label="' +
      escapeHtml(emptyLabel) +
      '">' +
      (text5
        ? ''
        : '<span class="story-project-empty-label">' + escapeHtml(emptyLabel) + '</span>') +
      '</div>'
    );
  return (
    '<div class="story-project-cover story-project-cover--collage story-project-cover--count-' +
    list4.length +
    '" data-workspace-project-cover>\n    ' +
    list4.map(
      (payload, handle) =>
        '<img src="' +
        escapeHtml(payload) +
        '" alt="' +
        escapeHtml(altPrefix) +
        ' ' +
        (handle + 1) +
        '" loading="lazy" decoding="async" draggable="false">',
    ).join('') +
    '\n  </div>'
  );
}
export function renderWorkspaceProjectCard(
  state,
  {
    isDeleteConfirming: isDeleteConfirming = false,
    isMenuOpen: isMenuOpen = false,
    fallbackTitle: fallbackTitle = '未命名项目',
    itemCount: itemCount = 0,
    itemLabel: itemLabel = '项',
    coverImageUrls: coverImageUrls = [],
    emptyCoverLabel: emptyCoverLabel = '项目',
    coverAltPrefix: coverAltPrefix = '项目封面',
    projectTypeLabel: projectTypeLabel = '',
    taskSummary: taskSummary = null,
  } = {},
) {
  const config = state?.data?.project || {},
    text6 = normalizeText(state?.id || config.id) || 'current',
    scope = Number(state?.archivedAt || 0) > 0,
    input = Number.isFinite(Number(itemCount)) ? Math.max(0, Math.trunc(Number(itemCount))) : 0,
    text7 =
      normalizeText(config.title || state?.title) || normalizeText(fallbackTitle) || '未命名项目',
    output = Number(state?.updatedAt || 0),
    activeCount3 = taskSummary && typeof taskSummary === 'object' ? taskSummary : {},
    workspaceProjectTaskPresentation = getWorkspaceProjectTaskPresentation({
      activeCount: activeCount3.activeCount,
      failedCount: activeCount3.failedCount,
    }),
    { activeCount: activeCount4, failedCount: failedCount3 } = workspaceProjectTaskPresentation,
    value2 = activeCount4 ? ' is-generating' : '',
    value3 = !activeCount4 && failedCount3 ? ' has-task-error' : '',
    value4 =
      scope && !activeCount4 && !failedCount3
        ? '已归档'
        : normalizeText(activeCount3.label) || workspaceProjectTaskPresentation.label,
    value5 = activeCount4
      ? '<span class="story-project-status' +
        value2 +
        '" data-workspace-project-status role="status" aria-live="polite">' +
        escapeHtml(value4) +
        '</span>'
      : '',
    value6 =
      failedCount3 || scope
        ? '<span class="story-project-inline-status' +
          (failedCount3 ? ' has-task-error' : ' is-archived') +
          '" data-workspace-project-inline-status ' +
          (failedCount3 ? 'role="status" aria-live="polite"' : '') +
          '>' +
          escapeHtml(value4) +
          '</span>'
        : '',
    text8 = normalizeText(projectTypeLabel)
      ? '<span class="story-project-type" data-workspace-project-type>' +
        escapeHtml(projectTypeLabel) +
        '</span>'
      : '';
  return (
    '<article class="story-project-card ' +
    (isDeleteConfirming ? 'is-delete-confirming' : '') +
    (scope ? ' is-archived' : '') +
    (isMenuOpen ? ' is-menu-open' : '') +
    value2 +
    value3 +
    '" data-workspace-open-project="' +
    escapeHtml(text6) +
    '" data-story-open-project="' +
    escapeHtml(text6) +
    '">\n    ' +
    renderWorkspaceProjectCover(coverImageUrls, {
      emptyLabel: emptyCoverLabel,
      altPrefix: coverAltPrefix,
      projectTypeLabel: projectTypeLabel,
    }) +
    '\n    ' +
    value5 +
    '\n    <div class="story-project-menu-wrap" data-workspace-project-menu-wrap data-story-project-menu-wrap>\n      <button type="button" class="story-project-menu-trigger" data-workspace-action="toggle-project-menu" data-story-action="toggle-project-menu" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" aria-label="' +
    escapeHtml(text7) +
    ' 项目操作" aria-haspopup="menu" aria-expanded="' +
    isMenuOpen +
    '" ' +
    (isDeleteConfirming ? 'hidden' : '') +
    '>•••</button>\n      <div class="story-project-menu" data-workspace-project-menu data-story-project-menu role="menu" aria-hidden="' +
    !(isMenuOpen && !isDeleteConfirming) +
    '" ' +
    (isMenuOpen && !isDeleteConfirming ? '' : 'hidden') +
    '>\n        <button type="button" data-workspace-action="rename-project" data-story-action="rename-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" role="menuitem">重命名</button>\n        <button type="button" data-workspace-action="duplicate-project" data-story-action="duplicate-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" role="menuitem">复制项目</button>\n        <button type="button" data-workspace-action="collect-project" data-story-action="collect-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" role="menuitem">收集项目</button>\n        <button type="button" data-workspace-action="' +
    (scope ? 'unarchive-project' : 'archive-project') +
    '" data-story-action="' +
    (scope ? 'unarchive-project' : 'archive-project') +
    '" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" role="menuitem">' +
    (scope ? '取消归档' : '归档项目') +
    '</button>\n        <button type="button" class="is-danger" data-workspace-action="request-delete-project" data-story-action="request-delete-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '" role="menuitem">删除项目</button>\n      </div>\n    </div>\n    <div data-workspace-project-delete-confirm class="story-project-delete-confirm" ' +
    (isDeleteConfirming ? '' : 'hidden') +
    ' aria-label="确认删除 ' +
    escapeHtml(text7) +
    '">\n      <button type="button" class="confirm-btn confirm-cancel" data-workspace-action="cancel-delete-project" data-story-action="cancel-delete-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '">取消</button>\n      <button type="button" class="confirm-btn confirm-ok" data-workspace-action="confirm-delete-project" data-story-action="confirm-delete-project" data-workspace-project-id="' +
    escapeHtml(text6) +
    '" data-story-project-id="' +
    escapeHtml(text6) +
    '">删除</button>\n    </div>\n    <div class="story-project-card-copy' +
    (text8 ? ' has-project-type' : '') +
    '" data-workspace-project-card-copy>\n      ' +
    text8 +
    '\n      <input class="story-project-title-input" data-workspace-project-title="' +
    escapeHtml(text6) +
    '" data-story-project-title="' +
    escapeHtml(text6) +
    '" value="' +
    escapeHtml(text7) +
    '" maxlength="120" aria-label="项目名称">\n      <div class="story-project-card-meta"><small>' +
    (output ? '已自动保存' : '刚刚更新') +
    ' · ' +
    input +
    ' ' +
    escapeHtml(itemLabel) +
    '</small>' +
    value6 +
    '</div>\n    </div>\n  </article>'
  );
}
