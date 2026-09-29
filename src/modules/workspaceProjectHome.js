function normalizeText(_0x414cdd) {
  return String(_0x414cdd ?? '')['trim']();
}
function escapeHtml(_0x2320d6) {
  return String(_0x2320d6 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#039;');
}
export function getWorkspaceProjectTaskPresentation({
  activeCount: activeCount = 0x0,
  failedCount: failedCount = 0x0,
} = {}) {
  const _0x5c1a38 = Math['max'](0x0, Math['trunc'](Number(activeCount) || 0x0)),
    _0x4289c5 = Math['max'](0x0, Math['trunc'](Number(failedCount) || 0x0));
  return {
    activeCount: _0x5c1a38,
    failedCount: _0x4289c5,
    label: _0x5c1a38
      ? '后台生成中 · ' + _0x5c1a38 + ' 个任务'
      : _0x4289c5
        ? _0x4289c5 + ' 个任务需重试'
        : '制作中',
  };
}
const WORKSPACE_PROJECT_SORT_ORDERS = Object['freeze'](['updated-desc', 'created-asc', 'title-asc']),
  WORKSPACE_PROJECT_SORT_OPTIONS = Object['freeze']([
    { value: 'updated-desc', label: '最近更新' },
    { value: 'created-asc', label: '最早创建' },
    { value: 'title-asc', label: '按名称' },
  ]);
export function normalizeWorkspaceProjectSortOrder(_0x21e4e3) {
  const _0x2a7320 = normalizeText(_0x21e4e3);
  return WORKSPACE_PROJECT_SORT_ORDERS['includes'](_0x2a7320) ? _0x2a7320 : 'updated-desc';
}
function getWorkspaceProjectCreatedAt(_0x10a6a7 = {}) {
  const _0x20ee9b = Number(
    _0x10a6a7?.['createdAt'] || _0x10a6a7?.['data']?.['project']?.['createdAt'] || 0x0,
  );
  if (Number['isFinite'](_0x20ee9b) && _0x20ee9b > 0x0) return _0x20ee9b;
  const _0x210352 = Number(normalizeText(_0x10a6a7?.['id'])['match'](/\d{10,}/)?.[0x0] || 0x0);
  if (Number['isFinite'](_0x210352) && _0x210352 > 0x0) return _0x210352;
  return Math['max'](0x0, Number(_0x10a6a7?.['updatedAt'] || 0x0));
}
export function getWorkspaceProjectHomeEntries(
  _0x32f5ea = [],
  { query: query = '', sortOrder: sortOrder = 'updated-desc', showArchived: showArchived = ![] } = {},
) {
  const _0x42c672 = normalizeText(query)['toLocaleLowerCase']('zh-CN'),
    _0x2f13d2 = normalizeWorkspaceProjectSortOrder(sortOrder);
  return (Array['isArray'](_0x32f5ea) ? _0x32f5ea : [])
    ['filter']((_0x5b6f68) => Boolean(Number(_0x5b6f68?.['archivedAt'] || 0x0)) === Boolean(showArchived))
    ['filter']((_0x1625bc) => {
      if (!_0x42c672) return !![];
      const _0x2be28a = normalizeText(_0x1625bc?.['title'] || _0x1625bc?.['data']?.['project']?.['title'])[
        'toLocaleLowerCase'
      ]('zh-CN');
      return _0x2be28a['includes'](_0x42c672);
    })
    ['map']((_0x3b68c1, _0x4a51f8) => ({ entry: _0x3b68c1, index: _0x4a51f8 }))
    ['sort']((_0x2c54f2, _0x1687ee) => {
      if (_0x2f13d2 === 'title-asc') {
        const _0x5b316f = normalizeText(
            _0x2c54f2['entry']?.['title'] || _0x2c54f2['entry']?.['data']?.['project']?.['title'],
          ),
          _0x2c9e05 = normalizeText(
            _0x1687ee['entry']?.['title'] || _0x1687ee['entry']?.['data']?.['project']?.['title'],
          );
        return _0x5b316f['localeCompare'](_0x2c9e05, 'zh-CN') || _0x2c54f2['index'] - _0x1687ee['index'];
      }
      if (_0x2f13d2 === 'created-asc')
        return (
          getWorkspaceProjectCreatedAt(_0x2c54f2['entry']) -
            getWorkspaceProjectCreatedAt(_0x1687ee['entry']) || _0x2c54f2['index'] - _0x1687ee['index']
        );
      return (
        Number(_0x1687ee['entry']?.['updatedAt'] || 0x0) - Number(_0x2c54f2['entry']?.['updatedAt'] || 0x0) ||
        _0x2c54f2['index'] - _0x1687ee['index']
      );
    })
    ['map'](({ entry: _0x37fa1a }) => _0x37fa1a);
}
export function refreshWorkspaceProjectResultsInPlace({
  root: _0x242d6d,
  documentObject: _0x54924a,
  renderResults: _0x367310,
} = {}) {
  const _0x36e8dc = _0x242d6d?.['querySelector']?.('.story-projects-section');
  if (!_0x36e8dc || !_0x54924a?.['createElement'] || typeof _0x367310 !== 'function') return ![];
  const _0x309fcd = _0x54924a['createElement']('template');
  _0x309fcd['innerHTML'] = String(_0x367310() || '')['trim']();
  const _0x46a63a = _0x36e8dc['querySelector']?.('.story-project-grid, .story-project-empty'),
    _0x5d6227 = _0x309fcd['content']?.['firstElementChild'];
  if (!_0x46a63a || !_0x5d6227?.['matches']?.('.story-project-grid,\x20.story-project-empty')) return ![];
  return (_0x46a63a['replaceWith'](_0x5d6227), !![]);
}
export function renderWorkspaceProjectSortControl(_0x16af55 = 'updated-desc') {
  const _0x5734b5 = normalizeWorkspaceProjectSortOrder(_0x16af55),
    _0x5803f1 =
      WORKSPACE_PROJECT_SORT_OPTIONS['find']((_0x1a1d87) => _0x1a1d87['value'] === _0x5734b5) ||
      WORKSPACE_PROJECT_SORT_OPTIONS[0x0];
  return (
    '<div\x20class=\x22story-project-sort\x22\x20data-workspace-project-sort-wrap\x20data-story-project-sort-wrap>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-project-sort-trigger\x20story-menu-trigger\x22\x20data-workspace-action=\x22toggle-project-sort-menu\x22\x20data-story-action=\x22toggle-project-sort-menu\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20<span>' +
    _0x5803f1['label'] +
    '</span><span class="story-project-sort-chevron" aria-hidden="true"></span>\n    </button>\n    <div class="story-project-sort-menu" data-workspace-project-sort-menu data-story-project-sort-menu role="menu" aria-label="项目排序" aria-hidden="true">\n      ' +
    WORKSPACE_PROJECT_SORT_OPTIONS['map'](
      (_0x582600) =>
        '<button type="button" class="story-project-sort-option' +
        (_0x582600['value'] === _0x5734b5 ? ' is-selected' : '') +
        '\x22\x20data-workspace-action=\x22select-project-sort\x22\x20data-story-action=\x22select-project-sort\x22\x20data-workspace-project-sort-option=\x22' +
        _0x582600['value'] +
        '" data-story-project-sort-option="' +
        _0x582600['value'] +
        '\x22\x20role=\x22menuitemradio\x22\x20aria-checked=\x22' +
        (_0x582600['value'] === _0x5734b5) +
        '">\n        <span>' +
        _0x582600['label'] +
        '</span><span class="story-project-sort-check" aria-hidden="true">✓</span>\n      </button>',
    )['join']('') +
    '\n    </div>\n  </div>'
  );
}
function renderWorkspaceProjectCover(
  _0x52c642 = [],
  {
    emptyLabel: emptyLabel = '项目',
    altPrefix: altPrefix = '项目封面',
    projectTypeLabel: projectTypeLabel = '',
  } = {},
) {
  const _0x153097 = normalizeText(projectTypeLabel),
    _0x568791 = (Array['isArray'](_0x52c642) ? _0x52c642 : [])
      ['map'](normalizeText)
      ['filter'](
        (_0x35b011, _0x39bdc9, _0x7701e2) => _0x35b011 && _0x7701e2['indexOf'](_0x35b011) === _0x39bdc9,
      )
      ['slice'](0x0, 0x3);
  if (!_0x568791['length'])
    return (
      '<div class="story-project-cover story-media-empty" data-workspace-project-cover role="img" aria-label="' +
      escapeHtml(emptyLabel) +
      '\x22>' +
      (_0x153097
        ? ''
        : '<span\x20class=\x22story-project-empty-label\x22>' + escapeHtml(emptyLabel) + '</span>') +
      '</div>'
    );
  return (
    '<div class="story-project-cover story-project-cover--collage story-project-cover--count-' +
    _0x568791['length'] +
    '" data-workspace-project-cover>\n    ' +
    _0x568791['map'](
      (_0x30e76c, _0x165718) =>
        '<img src="' +
        escapeHtml(_0x30e76c) +
        '" alt="' +
        escapeHtml(altPrefix) +
        '\x20' +
        (_0x165718 + 0x1) +
        '" loading="lazy" decoding="async" draggable="false">',
    )['join']('') +
    '\x0a\x20\x20</div>'
  );
}
export function renderWorkspaceProjectCard(
  _0x5c4c69,
  {
    isDeleteConfirming: isDeleteConfirming = ![],
    isMenuOpen: isMenuOpen = ![],
    fallbackTitle: fallbackTitle = '未命名项目',
    itemCount: itemCount = 0x0,
    itemLabel: itemLabel = '项',
    coverImageUrls: coverImageUrls = [],
    emptyCoverLabel: emptyCoverLabel = '项目',
    coverAltPrefix: coverAltPrefix = '项目封面',
    projectTypeLabel: projectTypeLabel = '',
    taskSummary: taskSummary = null,
  } = {},
) {
  const _0x1420fa = _0x5c4c69?.['data']?.['project'] || {},
    _0x2a3628 = normalizeText(_0x5c4c69?.['id'] || _0x1420fa['id']) || 'current',
    _0x975bff = Number(_0x5c4c69?.['archivedAt'] || 0x0) > 0x0,
    _0x2b6daa = Number['isFinite'](Number(itemCount))
      ? Math['max'](0x0, Math['trunc'](Number(itemCount)))
      : 0x0,
    _0xb61d8e =
      normalizeText(_0x1420fa['title'] || _0x5c4c69?.['title']) ||
      normalizeText(fallbackTitle) ||
      '未命名项目',
    _0x1c1a5f = Number(_0x5c4c69?.['updatedAt'] || 0x0),
    _0x52582b = taskSummary && typeof taskSummary === 'object' ? taskSummary : {},
    _0x1bba38 = getWorkspaceProjectTaskPresentation({
      activeCount: _0x52582b['activeCount'],
      failedCount: _0x52582b['failedCount'],
    }),
    { activeCount: _0x55b380, failedCount: _0x21e192 } = _0x1bba38,
    _0x901924 = _0x55b380 ? ' is-generating' : '',
    _0x25bf6e = !_0x55b380 && _0x21e192 ? ' has-task-error' : '',
    _0x4ccdde =
      _0x975bff && !_0x55b380 && !_0x21e192
        ? '已归档'
        : normalizeText(_0x52582b['label']) || _0x1bba38['label'],
    _0x3abe41 = _0x55b380
      ? '<span class="story-project-status' +
        _0x901924 +
        '" data-workspace-project-status role="status" aria-live="polite">' +
        escapeHtml(_0x4ccdde) +
        '</span>'
      : '',
    _0x1a0bf1 =
      _0x21e192 || _0x975bff
        ? '<span class="story-project-inline-status' +
          (_0x21e192 ? ' has-task-error' : ' is-archived') +
          '" data-workspace-project-inline-status ' +
          (_0x21e192 ? 'role="status" aria-live="polite"' : '') +
          '>' +
          escapeHtml(_0x4ccdde) +
          '</span>'
        : '',
    _0x3dd536 = normalizeText(projectTypeLabel)
      ? '<span class="story-project-type" data-workspace-project-type>' +
        escapeHtml(projectTypeLabel) +
        '</span>'
      : '';
  return (
    '<article\x20class=\x22story-project-card\x20' +
    (isDeleteConfirming ? 'is-delete-confirming' : '') +
    (_0x975bff ? '\x20is-archived' : '') +
    (isMenuOpen ? ' is-menu-open' : '') +
    _0x901924 +
    _0x25bf6e +
    '" data-workspace-open-project="' +
    escapeHtml(_0x2a3628) +
    '" data-story-open-project="' +
    escapeHtml(_0x2a3628) +
    '">\n    ' +
    renderWorkspaceProjectCover(coverImageUrls, {
      emptyLabel: emptyCoverLabel,
      altPrefix: coverAltPrefix,
      projectTypeLabel: projectTypeLabel,
    }) +
    '\n    ' +
    _0x3abe41 +
    '\x0a\x20\x20\x20\x20<div\x20class=\x22story-project-menu-wrap\x22\x20data-workspace-project-menu-wrap\x20data-story-project-menu-wrap>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-project-menu-trigger\x22\x20data-workspace-action=\x22toggle-project-menu\x22\x20data-story-action=\x22toggle-project-menu\x22\x20data-workspace-project-id=\x22' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '" aria-label="' +
    escapeHtml(_0xb61d8e) +
    ' 项目操作" aria-haspopup="menu" aria-expanded="' +
    isMenuOpen +
    '\x22\x20' +
    (isDeleteConfirming ? 'hidden' : '') +
    '>•••</button>\n      <div class="story-project-menu" data-workspace-project-menu data-story-project-menu role="menu" aria-hidden="' +
    !(isMenuOpen && !isDeleteConfirming) +
    '\x22\x20' +
    (isMenuOpen && !isDeleteConfirming ? '' : 'hidden') +
    '>\n        <button type="button" data-workspace-action="rename-project" data-story-action="rename-project" data-workspace-project-id="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '" role="menuitem">重命名</button>\n        <button type="button" data-workspace-action="duplicate-project" data-story-action="duplicate-project" data-workspace-project-id="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '" role="menuitem">复制项目</button>\n        <button type="button" data-workspace-action="collect-project" data-story-action="collect-project" data-workspace-project-id="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '" role="menuitem">收集项目</button>\n        <button type="button" data-workspace-action="' +
    (_0x975bff ? 'unarchive-project' : 'archive-project') +
    '" data-story-action="' +
    (_0x975bff ? 'unarchive-project' : 'archive-project') +
    '" data-workspace-project-id="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '\x22\x20role=\x22menuitem\x22>' +
    (_0x975bff ? '取消归档' : '归档项目') +
    '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22is-danger\x22\x20data-workspace-action=\x22request-delete-project\x22\x20data-story-action=\x22request-delete-project\x22\x20data-workspace-project-id=\x22' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '" role="menuitem">删除项目</button>\n      </div>\n    </div>\n    <div data-workspace-project-delete-confirm class="story-project-delete-confirm" ' +
    (isDeleteConfirming ? '' : 'hidden') +
    ' aria-label="确认删除 ' +
    escapeHtml(_0xb61d8e) +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22confirm-btn\x20confirm-cancel\x22\x20data-workspace-action=\x22cancel-delete-project\x22\x20data-story-action=\x22cancel-delete-project\x22\x20data-workspace-project-id=\x22' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '">取消</button>\n      <button type="button" class="confirm-btn confirm-ok" data-workspace-action="confirm-delete-project" data-story-action="confirm-delete-project" data-workspace-project-id="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-id="' +
    escapeHtml(_0x2a3628) +
    '">删除</button>\n    </div>\n    <div class="story-project-card-copy' +
    (_0x3dd536 ? ' has-project-type' : '') +
    '" data-workspace-project-card-copy>\n      ' +
    _0x3dd536 +
    '\n      <input class="story-project-title-input" data-workspace-project-title="' +
    escapeHtml(_0x2a3628) +
    '" data-story-project-title="' +
    escapeHtml(_0x2a3628) +
    '" value="' +
    escapeHtml(_0xb61d8e) +
    '" maxlength="120" aria-label="项目名称">\n      <div class="story-project-card-meta"><small>' +
    (_0x1c1a5f ? '已自动保存' : '刚刚更新') +
    ' · ' +
    _0x2b6daa +
    '\x20' +
    escapeHtml(itemLabel) +
    '</small>' +
    _0x1a0bf1 +
    '</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</article>'
  );
}
