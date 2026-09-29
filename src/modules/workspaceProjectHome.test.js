import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkspaceProjectTaskPresentation,
  normalizeWorkspaceProjectSortOrder,
  getWorkspaceProjectHomeEntries,
  refreshWorkspaceProjectResultsInPlace,
  renderWorkspaceProjectSortControl,
  renderWorkspaceProjectCard,
} from './workspaceProjectHome.js';

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function makeRefreshHarness(over = {}) {
  const replaced = [];
  const state = {
    renderCalls: 0,
    tag: null,
    rootSelector: null,
    sectionSelector: null,
    childSelector: null,
    innerHTML: null,
  };
  const firstChild = {
    matches(selector) {
      state.childSelector = selector;
      return 'firstChildMatches' in over ? over.firstChildMatches : true;
    },
  };
  const existing = {
    replaceWith(node) {
      replaced.push(node);
    },
  };
  const section = {
    querySelector(selector) {
      state.sectionSelector = selector;
      return 'existingPresent' in over ? (over.existingPresent ? existing : null) : existing;
    },
  };
  const root = {
    querySelector(selector) {
      state.rootSelector = selector;
      return 'sectionPresent' in over ? (over.sectionPresent ? section : null) : section;
    },
  };
  const template = {
    get innerHTML() {
      return state.innerHTML;
    },
    set innerHTML(value) {
      state.innerHTML = value;
    },
  };
  if ('contentPresent' in over ? over.contentPresent : true) {
    template.content =
      'firstChildPresent' in over
        ? over.firstChildPresent
          ? { firstElementChild: firstChild }
          : {}
        : { firstElementChild: firstChild };
  }
  const documentObject =
    'documentPresent' in over && !over.documentPresent
      ? {}
      : {
          createElement(tag) {
            state.tag = tag;
            return template;
          },
        };
  const rawRender =
    'renderResults' in over ? over.renderResults : () => '  <div class="story-project-grid"></div>  ';
  const renderResults =
    typeof rawRender === 'function'
      ? () => {
          state.renderCalls += 1;
          return rawRender();
        }
      : rawRender;
  return { root, documentObject, renderResults, replaced, firstChild, state, template };
}

/* ---------------------------------------------------------------- task summary */

test('summarizes the default zero task counts as in progress', () => {
  assert.deepEqual(getWorkspaceProjectTaskPresentation(), {
    activeCount: 0,
    failedCount: 0,
    label: '制作中',
  });
  assert.deepEqual(getWorkspaceProjectTaskPresentation({}), {
    activeCount: 0,
    failedCount: 0,
    label: '制作中',
  });
});

test('prefers the active task label over the failed task label', () => {
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: 5, failedCount: 3 }), {
    activeCount: 5,
    failedCount: 3,
    label: '后台生成中 · 5 个任务',
  });
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: 1 }), {
    activeCount: 1,
    failedCount: 0,
    label: '后台生成中 · 1 个任务',
  });
});

test('falls back to the retry label when nothing is generating', () => {
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ failedCount: 4 }), {
    activeCount: 0,
    failedCount: 4,
    label: '4 个任务需重试',
  });
});

test('truncates the task counts toward zero and clamps negatives to zero', () => {
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: 2.9, failedCount: 7.5 }), {
    activeCount: 2,
    failedCount: 7,
    label: '后台生成中 · 2 个任务',
  });
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: -3, failedCount: -0.5 }), {
    activeCount: 0,
    failedCount: 0,
    label: '制作中',
  });
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: 0.9 }), {
    activeCount: 0,
    failedCount: 0,
    label: '制作中',
  });
});

test('coerces task count input and treats unusable values as zero', () => {
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: '6', failedCount: true }), {
    activeCount: 6,
    failedCount: 1,
    label: '后台生成中 · 6 个任务',
  });
  assert.deepEqual(getWorkspaceProjectTaskPresentation({ activeCount: 'abc', failedCount: null }), {
    activeCount: 0,
    failedCount: 0,
    label: '制作中',
  });
  assert.equal(getWorkspaceProjectTaskPresentation({ activeCount: Infinity }).activeCount, Infinity);
});

test('does not mutate the task summary options', () => {
  const options = { activeCount: 2, failedCount: 1, extra: 'kept' };
  const snapshot = { ...options };
  getWorkspaceProjectTaskPresentation(options);
  assert.deepEqual(options, snapshot);
});

/* ------------------------------------------------------------------ sort order */

test('normalizes known sort orders and falls back to the default', () => {
  assert.equal(normalizeWorkspaceProjectSortOrder('updated-desc'), 'updated-desc');
  assert.equal(normalizeWorkspaceProjectSortOrder('created-asc'), 'created-asc');
  assert.equal(normalizeWorkspaceProjectSortOrder('  title-asc  '), 'title-asc');
  for (const value of [undefined, null, '', '   ', 'TITLE-ASC', 'bogus', 42, {}, []]) {
    assert.equal(normalizeWorkspaceProjectSortOrder(value), 'updated-desc', `value ${String(value)}`);
  }
});

/* ------------------------------------------------------- project home filtering */

test('returns an empty list for a non-array project list', () => {
  for (const list of [undefined, null, 'nope', 42, {}]) {
    assert.deepEqual(getWorkspaceProjectHomeEntries(list), []);
  }
});

test('keeps only non archived projects by default and the archived ones on request', () => {
  const projects = [
    { id: 'a', updatedAt: 3 },
    { id: 'b', updatedAt: 2, archivedAt: 1 },
    { id: 'c', updatedAt: 1, archivedAt: 0 },
    { id: 'd', updatedAt: 0, archivedAt: 'yes' },
    { id: 'e', archivedAt: -1 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects).map((project) => project.id),
    ['a', 'c', 'd'],
  );
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { showArchived: true }).map((project) => project.id),
    ['b', 'e'],
  );
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { showArchived: 1 }).map((project) => project.id),
    ['b', 'e'],
  );
});

test('matches a trimmed case insensitive title query, including the nested data title', () => {
  const projects = [
    { id: 'a', title: 'Alpha 项目' },
    { id: 'b', data: { project: { title: 'Beta 项目' } } },
    { id: 'c', title: 'gamma' },
    { id: 'd', title: '', data: { project: { title: 'Delta' } } },
  ];
  const ids = (options) => getWorkspaceProjectHomeEntries(projects, options).map((project) => project.id);
  assert.deepEqual(ids({ query: 'ALPHA' }), ['a']);
  assert.deepEqual(ids({ query: ' 项目 ' }), ['a', 'b']);
  assert.deepEqual(ids({ query: 'delta' }), ['d']);
  assert.deepEqual(ids({ query: 'missing' }), []);
  assert.deepEqual(ids({ query: '' }), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids({ query: '   ' }), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids({ query: null }), ['a', 'b', 'c', 'd']);
});

test('never matches the project id when querying', () => {
  assert.deepEqual(getWorkspaceProjectHomeEntries([{ id: 'alpha', title: 'zzz' }], { query: 'alpha' }), []);
});

test('applies the archive filter before the query filter', () => {
  const projects = [
    { id: 'a', title: 'Alpha', archivedAt: 1 },
    { id: 'b', title: 'Alpha' },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { query: 'alpha' }).map((project) => project.id),
    ['b'],
  );
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { query: 'alpha', showArchived: true }).map(
      (project) => project.id,
    ),
    ['a'],
  );
});

/* ----------------------------------------------------------- project home sorting */

test('sorts by updated time descending and keeps ties in input order', () => {
  const projects = [
    { id: 'a', updatedAt: 10 },
    { id: 'b', updatedAt: 30 },
    { id: 'c', updatedAt: 20 },
    { id: 'd' },
    { id: 'e', updatedAt: 30 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects).map((project) => project.id),
    ['b', 'e', 'c', 'a', 'd'],
  );
  assert.deepEqual(
    projects.map((project) => project.id),
    ['a', 'b', 'c', 'd', 'e'],
  );
});

test('treats a missing updated time as zero when sorting', () => {
  assert.deepEqual(
    getWorkspaceProjectHomeEntries([{ id: 'a' }, { id: 'b', updatedAt: 2 }, { id: 'c', updatedAt: -1 }]).map(
      (project) => project.id,
    ),
    ['b', 'a', 'c'],
  );
});

test('treats a non numeric updated time as a poisoned comparison that keeps input order', () => {
  const projects = [
    { id: 'a', updatedAt: 'soon' },
    { id: 'b', updatedAt: '5' },
    { id: 'c', updatedAt: -1 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects).map((project) => project.id),
    ['a', 'b', 'c'],
  );
});

test('sorts by title with localeCompare and breaks ties by input position', () => {
  const projects = [
    { id: 'a', title: 'banana' },
    { id: 'b', title: 'apple' },
    { id: 'c', title: 'cherry' },
    { id: 'd', data: { project: { title: 'apple' } } },
    { id: 'e', data: { project: { title: 'date' } } },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: 'title-asc' }).map((project) => project.id),
    ['b', 'd', 'a', 'c', 'e'],
  );
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: ' title-asc ' }).map((project) => project.id),
    ['b', 'd', 'a', 'c', 'e'],
  );
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: 'TITLE-ASC' }).map((project) => project.id),
    ['a', 'b', 'c', 'd', 'e'],
  );
});

test('sorts by creation time falling back from createdAt to the id and then updatedAt', () => {
  const projects = [
    { id: 'a', createdAt: 3000 },
    { id: 'b', createdAt: '1000' },
    { id: 'c', id: 'proj-1700000000000', updatedAt: 20 },
    { id: 'd', updatedAt: 5 },
    { id: 'e', createdAt: -10, updatedAt: 7 },
    { id: 'f', data: { project: { createdAt: 2500 } } },
    { id: 'g', createdAt: Infinity, updatedAt: 1 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: 'created-asc' }).map((project) => project.id),
    ['g', 'd', 'e', 'b', 'f', 'a', 'proj-1700000000000'],
  );
});

test('needs at least ten id digits before deriving a creation time from the id', () => {
  const projects = [
    { id: 'proj-123456789', updatedAt: 500 },
    { id: 'b', updatedAt: 1000 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: 'created-asc' }).map((project) => project.id),
    ['proj-123456789', 'b'],
  );
});

test('treats a zero creation time as unusable and keeps creation ties in input order', () => {
  const projects = [
    { id: 'a', createdAt: 100 },
    { id: 'b', createdAt: 0, updatedAt: 0 },
    { id: 'c', createdAt: 0, updatedAt: 0 },
    { id: 'd', createdAt: 100 },
  ];
  assert.deepEqual(
    getWorkspaceProjectHomeEntries(projects, { sortOrder: 'created-asc' }).map((project) => project.id),
    ['b', 'c', 'a', 'd'],
  );
});

test('returns the original project objects and does not mutate the input list', () => {
  const projects = [
    { id: 'a', updatedAt: 1, title: 'Alpha', data: { project: { title: 'alpha' } } },
    { id: 'b', updatedAt: 9, title: 'Beta' },
    { id: 'c', updatedAt: 5, title: 'Gamma' },
  ];
  const snapshot = JSON.parse(JSON.stringify(projects));
  const result = getWorkspaceProjectHomeEntries(projects, { query: 'a', sortOrder: 'created-asc' });
  assert.deepEqual(
    result.map((project) => project.id),
    ['a', 'c', 'b'],
  );
  assert.equal(result[0], projects[0]);
  assert.equal(result[1], projects[2]);
  assert.equal(result[2], projects[1]);
  assert.deepEqual(projects, snapshot);
  assert.deepEqual(
    projects.map((project) => project.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(Object.keys(projects[0]), ['id', 'updatedAt', 'title', 'data']);
});

test('throws when the options bag itself is null and cannot be destructured', () => {
  assert.throws(() => getWorkspaceProjectHomeEntries([], null), TypeError);
  assert.throws(() => getWorkspaceProjectTaskPresentation(null), TypeError);
  assert.throws(() => renderWorkspaceProjectCard({}, null), TypeError);
});

/* ------------------------------------------------- in place results refreshing */

test('replaces the existing result node with the freshly rendered first child', () => {
  const harness = makeRefreshHarness();
  const result = refreshWorkspaceProjectResultsInPlace(harness);
  assert.equal(result, true);
  assert.equal(harness.state.renderCalls, 1);
  assert.equal(harness.state.tag, 'template');
  assert.equal(harness.state.rootSelector, '.story-projects-section');
  assert.equal(harness.state.sectionSelector, '.story-project-grid, .story-project-empty');
  assert.equal(harness.state.childSelector, '.story-project-grid, .story-project-empty');
  assert.equal(harness.replaced.length, 1);
  assert.equal(harness.replaced[0], harness.firstChild);
  assert.equal(harness.state.innerHTML, '<div class="story-project-grid"></div>');
});

test('trims the rendered html and stringifies non string results', () => {
  const trimmed = makeRefreshHarness({ renderResults: () => '  <i>x</i>\n  ' });
  refreshWorkspaceProjectResultsInPlace(trimmed);
  assert.equal(trimmed.state.innerHTML, '<i>x</i>');

  for (const value of ['', '   ', null, undefined, 0]) {
    const harness = makeRefreshHarness({ renderResults: () => value });
    refreshWorkspaceProjectResultsInPlace(harness);
    assert.equal(harness.state.innerHTML, '', `value ${String(value)}`);
  }

  const numeric = makeRefreshHarness({ renderResults: () => 42 });
  refreshWorkspaceProjectResultsInPlace(numeric);
  assert.equal(numeric.state.innerHTML, '42');
});

test('bails out before rendering when the root or the section is missing', () => {
  const noRoot = makeRefreshHarness({ sectionPresent: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(noRoot), false);
  assert.equal(noRoot.state.renderCalls, 0);

  const emptyRoot = makeRefreshHarness();
  assert.equal(refreshWorkspaceProjectResultsInPlace({ ...emptyRoot, root: {} }), false);
  assert.equal(emptyRoot.state.renderCalls, 0);

  assert.equal(
    refreshWorkspaceProjectResultsInPlace({ root: null, documentObject: noRoot.documentObject }),
    false,
  );
});

test('bails out when the document object or the render function is unusable', () => {
  const noDocument = makeRefreshHarness({ documentPresent: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(noDocument), false);
  assert.equal(noDocument.state.renderCalls, 0);
  assert.equal(noDocument.replaced.length, 0);

  const noRender = makeRefreshHarness({ renderResults: 'not-a-function' });
  assert.equal(refreshWorkspaceProjectResultsInPlace(noRender), false);
  assert.equal(noRender.replaced.length, 0);

  assert.equal(refreshWorkspaceProjectResultsInPlace(), false);
  assert.equal(refreshWorkspaceProjectResultsInPlace({ root: { querySelector: () => null } }), false);
});

test('bails out when the section no longer holds a result node', () => {
  const harness = makeRefreshHarness({ existingPresent: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(harness), false);
  assert.equal(harness.state.renderCalls, 1);
  assert.equal(harness.replaced.length, 0);
});

test('bails out when the rendered content does not start with a result node', () => {
  const notMatching = makeRefreshHarness({ firstChildMatches: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(notMatching), false);
  assert.equal(notMatching.replaced.length, 0);

  const empty = makeRefreshHarness({ firstChildPresent: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(empty), false);
  assert.equal(empty.replaced.length, 0);

  const contentless = makeRefreshHarness({ contentPresent: false });
  assert.equal(refreshWorkspaceProjectResultsInPlace(contentless), false);
  assert.equal(contentless.replaced.length, 0);
});

/* ------------------------------------------------------ sort control rendering */

test('renders the sort control with the default option selected', () => {
  const html = renderWorkspaceProjectSortControl();
  assert.equal(html, renderWorkspaceProjectSortControl('updated-desc'));
  assert.ok(
    html.startsWith(
      '<div class="story-project-sort" data-workspace-project-sort-wrap data-story-project-sort-wrap>\n' +
        '    <button type="button" class="story-project-sort-trigger story-menu-trigger" data-workspace-action="toggle-project-sort-menu" data-story-action="toggle-project-sort-menu" aria-haspopup="menu" aria-expanded="false">\n' +
        '      <span>最近更新</span><span class="story-project-sort-chevron" aria-hidden="true"></span>',
    ),
  );
  assert.ok(html.includes('role="menu" aria-label="项目排序" aria-hidden="true">'));
  assert.equal(count(html, 'role="menuitemradio"'), 3);
  assert.equal(count(html, 'aria-checked="true"'), 1);
  assert.equal(count(html, 'aria-checked="false"'), 2);
  assert.equal(count(html, 'class="story-project-sort-option is-selected"'), 1);
  assert.equal(count(html, 'class="story-project-sort-option" data-workspace-action'), 2);
  assert.ok(html.endsWith('\n    </div>\n  </div>'));
});

test('marks the requested option as selected and repeats its value in both attributes', () => {
  const html = renderWorkspaceProjectSortControl('created-asc');
  assert.ok(
    html.includes(
      '<button type="button" class="story-project-sort-option is-selected" data-workspace-action="select-project-sort" data-story-action="select-project-sort" data-workspace-project-sort-option="created-asc" data-story-project-sort-option="created-asc" role="menuitemradio" aria-checked="true">\n' +
        '        <span>最早创建</span><span class="story-project-sort-check" aria-hidden="true">✓</span>\n' +
        '      </button>',
    ),
  );
  assert.ok(
    html.includes(
      '<button type="button" class="story-project-sort-option" data-workspace-action="select-project-sort" data-story-action="select-project-sort" data-workspace-project-sort-option="title-asc" data-story-project-sort-option="title-asc" role="menuitemradio" aria-checked="false">',
    ),
  );
});

test('falls back to the default option for any unknown sort order', () => {
  const expected = renderWorkspaceProjectSortControl();
  for (const value of [undefined, null, '', '   ', 'bogus', 'TITLE-ASC', 42, {}, []]) {
    assert.equal(renderWorkspaceProjectSortControl(value), expected, `value ${String(value)}`);
  }
  assert.ok(
    renderWorkspaceProjectSortControl(' title-asc ').includes(
      'aria-expanded="false">\n      <span>按名称</span>',
    ),
  );
  assert.ok(
    renderWorkspaceProjectSortControl(' title-asc ').includes(
      'data-workspace-project-sort-option="title-asc" data-story-project-sort-option="title-asc" role="menuitemradio" aria-checked="true"',
    ),
  );
});

/* ------------------------------------------------------- project card rendering */

test('renders a project card with every default', () => {
  const html = renderWorkspaceProjectCard({});
  assert.ok(
    html.startsWith(
      '<article class="story-project-card " data-workspace-open-project="current" data-story-open-project="current">\n' +
        '    <div class="story-project-cover story-media-empty" data-workspace-project-cover role="img" aria-label="项目"><span class="story-project-empty-label">项目</span></div>\n' +
        '    \n' +
        '    <div class="story-project-menu-wrap" data-workspace-project-menu-wrap data-story-project-menu-wrap>',
    ),
  );
  assert.ok(
    html.includes(
      'class="story-project-menu-trigger" data-workspace-action="toggle-project-menu" data-story-action="toggle-project-menu" data-workspace-project-id="current" data-story-project-id="current" aria-label="未命名项目 项目操作" aria-haspopup="menu" aria-expanded="false" >•••</button>',
    ),
  );
  assert.ok(
    html.includes(
      'role="menu" aria-hidden="true" hidden>\n' +
        '        <button type="button" data-workspace-action="rename-project" data-story-action="rename-project" data-workspace-project-id="current" data-story-project-id="current" role="menuitem">重命名</button>',
    ),
  );
  assert.ok(html.includes('role="menuitem">复制项目</button>'));
  assert.ok(html.includes('role="menuitem">收集项目</button>'));
  assert.ok(
    html.includes(
      'data-workspace-action="archive-project" data-story-action="archive-project" data-workspace-project-id="current" data-story-project-id="current" role="menuitem">归档项目</button>',
    ),
  );
  assert.ok(html.includes('class="is-danger" data-workspace-action="request-delete-project"'));
  assert.ok(
    html.includes(
      'data-workspace-project-delete-confirm class="story-project-delete-confirm" hidden aria-label="确认删除 未命名项目">',
    ),
  );
  assert.ok(html.includes('class="story-project-card-copy" data-workspace-project-card-copy>'));
  assert.ok(
    html.includes(
      '<input class="story-project-title-input" data-workspace-project-title="current" data-story-project-title="current" value="未命名项目" maxlength="120" aria-label="项目名称">',
    ),
  );
  assert.ok(html.includes('<div class="story-project-card-meta"><small>刚刚更新 · 0 项</small></div>'));
  assert.ok(html.endsWith('</article>'));
  assert.equal(html.includes('data-workspace-project-status'), false);
  assert.equal(html.includes('data-workspace-project-inline-status'), false);
  assert.equal(html.includes('has-project-type'), false);
});

test('derives the id and the title from the nested project data', () => {
  const html = renderWorkspaceProjectCard({ data: { project: { id: 'p-7', title: '嵌套标题' } } });
  assert.ok(html.includes('data-workspace-open-project="p-7" data-story-open-project="p-7"'));
  assert.ok(html.includes('value="嵌套标题"'));
  assert.ok(html.includes('aria-label="嵌套标题 项目操作"'));
});

test('prefers the top level id and title over the nested project values only when usable', () => {
  const topLevel = renderWorkspaceProjectCard({
    id: 'top',
    title: '顶层标题',
    data: { project: { id: 'nested', title: '嵌套标题' } },
  });
  assert.ok(topLevel.includes('data-workspace-open-project="top"'));
  assert.ok(topLevel.includes('value="嵌套标题"'));

  const blankTop = renderWorkspaceProjectCard({
    id: '   ',
    title: '   ',
    data: { project: { id: 'nested', title: '嵌套标题' } },
  });
  assert.ok(blankTop.includes('data-workspace-open-project="current"'));
  assert.ok(blankTop.includes('value="嵌套标题"'));

  const falsyTop = renderWorkspaceProjectCard({
    id: '',
    title: '',
    data: { project: { id: 'nested', title: '嵌套标题' } },
  });
  assert.ok(falsyTop.includes('data-workspace-open-project="nested"'));
});

test('falls back from the fallback title to the placeholder when everything is blank', () => {
  assert.ok(renderWorkspaceProjectCard({}, { fallbackTitle: '   ' }).includes('value="未命名项目"'));
  assert.ok(
    renderWorkspaceProjectCard({ title: '  ' }, { fallbackTitle: '' }).includes('value="未命名项目"'),
  );
  assert.ok(
    renderWorkspaceProjectCard({ title: '  ' }, { fallbackTitle: ' 备用 ' }).includes('value="备用"'),
  );
});

test('handles a nullish entry like an empty object', () => {
  assert.equal(renderWorkspaceProjectCard(), renderWorkspaceProjectCard({}));
  assert.equal(renderWorkspaceProjectCard(null), renderWorkspaceProjectCard({}));
});

test('renders the archived and interaction flags as class names', () => {
  assert.ok(
    renderWorkspaceProjectCard({}, { isDeleteConfirming: true }).startsWith(
      '<article class="story-project-card is-delete-confirming" ',
    ),
  );
  assert.ok(
    renderWorkspaceProjectCard({}, { isMenuOpen: true }).startsWith(
      '<article class="story-project-card  is-menu-open" ',
    ),
  );
  assert.ok(
    renderWorkspaceProjectCard({ archivedAt: 3 }).startsWith(
      '<article class="story-project-card  is-archived" ',
    ),
  );
  assert.ok(
    renderWorkspaceProjectCard({ archivedAt: 3 }).includes(
      'class="story-project-card  is-archived" data-workspace-open-project="current"',
    ),
  );
});

test('only a positive archived time marks the project as archived', () => {
  for (const archivedAt of [0, -1, '0', null, 'no']) {
    const html = renderWorkspaceProjectCard({ archivedAt });
    assert.equal(html.includes('is-archived'), false, `archivedAt ${String(archivedAt)}`);
    assert.ok(html.includes('>归档项目</button>'));
    assert.ok(html.includes('data-workspace-action="archive-project"'));
  }
  const archived = renderWorkspaceProjectCard({ id: 'p', archivedAt: '1700000000000' });
  assert.ok(archived.startsWith('<article class="story-project-card  is-archived" '));
  assert.ok(
    archived.includes('data-workspace-action="unarchive-project" data-story-action="unarchive-project"'),
  );
  assert.ok(archived.includes('role="menuitem">取消归档</button>'));
  assert.ok(
    archived.includes(
      '<span class="story-project-inline-status is-archived" data-workspace-project-inline-status >已归档</span>',
    ),
  );
});

test('renders the delete confirmation state without a hidden menu', () => {
  const confirming = renderWorkspaceProjectCard({}, { isDeleteConfirming: true });
  assert.ok(confirming.includes('aria-expanded="false" hidden>•••</button>'));
  assert.ok(confirming.includes('aria-hidden="true" hidden>'));
  assert.ok(
    confirming.includes(
      'data-workspace-project-delete-confirm class="story-project-delete-confirm"  aria-label="确认删除 未命名项目">',
    ),
  );
  assert.ok(confirming.includes('data-workspace-action="confirm-delete-project"'));
  assert.ok(confirming.includes('data-workspace-action="cancel-delete-project"'));
  assert.ok(confirming.includes('aria-label="确认删除 未命名项目">'));
});

test('opens the project menu when requested and closes it while deleting', () => {
  const opened = renderWorkspaceProjectCard({}, { isMenuOpen: true });
  assert.ok(opened.includes('aria-expanded="true" >•••</button>'));
  assert.ok(opened.includes('role="menu" aria-hidden="false" >'));

  const confirming = renderWorkspaceProjectCard({}, { isMenuOpen: true, isDeleteConfirming: true });
  assert.ok(confirming.includes('aria-expanded="true" hidden>•••</button>'));
  assert.ok(confirming.includes('role="menu" aria-hidden="true" hidden>'));
});

test('coerces the item count and shows the automatic save state', () => {
  const cases = [
    [12, '已自动保存 · 12 项'],
    ['5', '已自动保存 · 5 项'],
    [3.7, '已自动保存 · 3 项'],
    [-5, '已自动保存 · 0 项'],
    [NaN, '已自动保存 · 0 项'],
    [Infinity, '已自动保存 · 0 项'],
    [null, '已自动保存 · 0 项'],
    ['x', '已自动保存 · 0 项'],
  ];
  for (const [itemCount, meta] of cases) {
    const html = renderWorkspaceProjectCard({ updatedAt: 1 }, { itemCount });
    assert.ok(html.includes(`<small>${meta}</small>`), `itemCount ${String(itemCount)}`);
  }
  assert.ok(renderWorkspaceProjectCard({}, { itemCount: 1 }).includes('<small>刚刚更新 · 1 项</small>'));
});

test('uses the raw updated time only for the saved wording', () => {
  assert.ok(renderWorkspaceProjectCard({ updatedAt: 5 }).includes('>已自动保存 ·'));
  assert.ok(renderWorkspaceProjectCard({ updatedAt: -5 }).includes('>已自动保存 ·'));
  assert.ok(renderWorkspaceProjectCard({ updatedAt: 'abc' }).includes('>刚刚更新 ·'));
  assert.ok(renderWorkspaceProjectCard({ updatedAt: 0 }).includes('>刚刚更新 ·'));
});

test('renders the generating status without an inline status when only tasks are running', () => {
  const html = renderWorkspaceProjectCard({}, { taskSummary: { activeCount: 2 } });
  assert.ok(html.includes('<article class="story-project-card  is-generating" '));
  assert.ok(
    html.includes(
      '<span class="story-project-status is-generating" data-workspace-project-status role="status" aria-live="polite">后台生成中 · 2 个任务</span>',
    ),
  );
  assert.equal(html.includes('data-workspace-project-inline-status'), false);
  assert.equal(html.includes('已归档'), false);
});

test('repeats the generating label in the inline status when failures coexist', () => {
  const html = renderWorkspaceProjectCard({}, { taskSummary: { activeCount: 2, failedCount: 9 } });
  assert.ok(html.includes('<article class="story-project-card  is-generating" '));
  assert.equal(count(html, 'has-task-error'), 1);
  assert.ok(
    html.includes(
      '<span class="story-project-inline-status has-task-error" data-workspace-project-inline-status role="status" aria-live="polite">后台生成中 · 2 个任务</span>',
    ),
  );
  assert.equal(count(html, '后台生成中 · 2 个任务'), 2);
  assert.equal(html.includes('9 个任务需重试'), false);
});

test('does not repeat the archived wording while tasks are running', () => {
  const html = renderWorkspaceProjectCard({ archivedAt: 1 }, { taskSummary: { activeCount: 1 } });
  assert.ok(html.includes('<article class="story-project-card  is-archived is-generating" '));
  assert.ok(
    html.includes(
      '<span class="story-project-inline-status is-archived" data-workspace-project-inline-status >后台生成中 · 1 个任务</span>',
    ),
  );
  assert.equal(html.includes('已归档'), false);
});

test('renders the inline retry status when tasks failed and nothing is generating', () => {
  const html = renderWorkspaceProjectCard({}, { taskSummary: { failedCount: 3 } });
  assert.ok(html.includes('<article class="story-project-card  has-task-error" '));
  assert.equal(html.includes('data-workspace-project-status'), false);
  assert.ok(
    html.includes(
      '<span class="story-project-inline-status has-task-error" data-workspace-project-inline-status role="status" aria-live="polite">3 个任务需重试</span>',
    ),
  );
});

test('prefers the archived wording only when nothing is generating or failing', () => {
  assert.ok(
    renderWorkspaceProjectCard({ archivedAt: 1 }, { taskSummary: { failedCount: 2 } }).includes(
      '>2 个任务需重试</span>',
    ),
  );
  assert.ok(
    renderWorkspaceProjectCard({ archivedAt: 1 }, { taskSummary: { activeCount: 1 } }).includes(
      '>后台生成中 · 1 个任务</span>',
    ),
  );
  assert.ok(renderWorkspaceProjectCard({ archivedAt: 1 }, { taskSummary: {} }).includes('>已归档</span>'));
});

test('prefers a custom task label and ignores blank ones', () => {
  const custom = renderWorkspaceProjectCard({}, { taskSummary: { activeCount: 1, label: '自定义状态' } });
  assert.ok(custom.includes('>自定义状态</span>'));
  assert.equal(custom.includes('后台生成中'), false);

  const blank = renderWorkspaceProjectCard({}, { taskSummary: { activeCount: 1, label: '   ' } });
  assert.ok(blank.includes('>后台生成中 · 1 个任务</span>'));
});

test('ignores a non object task summary', () => {
  for (const taskSummary of [null, 'nope', 7, undefined]) {
    const html = renderWorkspaceProjectCard({}, { taskSummary });
    assert.ok(html.includes('>刚刚更新 · 0 项</small>'), `taskSummary ${String(taskSummary)}`);
    assert.equal(html.includes('data-workspace-project-status'), false);
  }
});

test('renders the project type chip and the card copy modifier', () => {
  const html = renderWorkspaceProjectCard({ id: 'p' }, { projectTypeLabel: '短剧' });
  assert.ok(html.includes('<span class="story-project-type" data-workspace-project-type>短剧</span>'));
  assert.ok(
    html.includes('class="story-project-card-copy has-project-type" data-workspace-project-card-copy>'),
  );

  const blank = renderWorkspaceProjectCard({}, { projectTypeLabel: '   ' });
  assert.equal(blank.includes('story-project-type'), false);
  assert.ok(blank.includes('class="story-project-card-copy" data-workspace-project-card-copy>'));
  assert.ok(
    blank.includes(
      'class="story-project-cover story-media-empty" data-workspace-project-cover role="img" aria-label="项目"><span class="story-project-empty-label">项目</span></div>',
    ),
  );
});

test('keeps the project type padding when the chip is rendered', () => {
  const html = renderWorkspaceProjectCard({}, { projectTypeLabel: '  漫 ' });
  assert.ok(html.includes('<span class="story-project-type" data-workspace-project-type>  漫 </span>'));
  const emptyCover = renderWorkspaceProjectCard({}, { projectTypeLabel: '漫' });
  assert.ok(emptyCover.includes('aria-label="项目"></div>'));
  assert.equal(emptyCover.includes('story-project-empty-label'), false);
});

test('renders a cover collage with at most three numbered images', () => {
  const html = renderWorkspaceProjectCard(
    { id: 'p' },
    { coverImageUrls: ['a.png', ' b.png ', 'c.png', 'd.png'] },
  );
  assert.ok(
    html.includes(
      '<div class="story-project-cover story-project-cover--collage story-project-cover--count-3" data-workspace-project-cover>',
    ),
  );
  assert.equal(count(html, '<img '), 3);
  assert.ok(
    html.includes('<img src="a.png" alt="项目封面 1" loading="lazy" decoding="async" draggable="false">'),
  );
  assert.ok(
    html.includes('<img src="b.png" alt="项目封面 2" loading="lazy" decoding="async" draggable="false">'),
  );
  assert.ok(
    html.includes('<img src="c.png" alt="项目封面 3" loading="lazy" decoding="async" draggable="false">'),
  );
  assert.equal(html.includes('d.png'), false);
});

test('deduplicates, trims and drops unusable cover urls', () => {
  const deduped = renderWorkspaceProjectCard({}, { coverImageUrls: ['a', 'a', ' a ', 'b'] });
  assert.ok(deduped.includes('story-project-cover--count-2'));
  assert.equal(count(deduped, '<img '), 2);

  const blank = renderWorkspaceProjectCard({}, { coverImageUrls: ['', '   ', null] });
  assert.ok(blank.includes('story-project-cover story-media-empty'));

  for (const coverImageUrls of [null, 'nope', 42, {}]) {
    assert.ok(
      renderWorkspaceProjectCard({}, { coverImageUrls }).includes('story-project-cover story-media-empty'),
    );
  }
  assert.ok(
    renderWorkspaceProjectCard({}, { coverImageUrls: [1, 2] }).includes('<img src="1" alt="项目封面 1"'),
  );
});

test('escapes the empty cover label and the cover alt prefix', () => {
  const html = renderWorkspaceProjectCard(
    {},
    { coverImageUrls: ['x'], emptyCoverLabel: '<空>', coverAltPrefix: 'A"B' },
  );
  assert.ok(html.includes('alt="A&quot;B 1"'));
  assert.ok(html.includes('src="x"'));

  const empty = renderWorkspaceProjectCard({}, { emptyCoverLabel: '<空>' });
  assert.ok(
    empty.includes(
      'role="img" aria-label="&lt;空&gt;"><span class="story-project-empty-label">&lt;空&gt;</span>',
    ),
  );
});

test('escapes every user supplied card field', () => {
  const html = renderWorkspaceProjectCard(
    { id: 'i"d<1>', title: 'T"itle<&>' },
    {
      fallbackTitle: 'F',
      itemCount: 2,
      itemLabel: '<项>',
      projectTypeLabel: '类<型>',
      coverImageUrls: ['u"rl'],
      taskSummary: { activeCount: 1, label: '标<签>' },
    },
  );
  assert.ok(
    html.includes(
      'data-workspace-open-project="i&quot;d&lt;1&gt;" data-story-open-project="i&quot;d&lt;1&gt;"',
    ),
  );
  assert.ok(html.includes('data-workspace-project-id="i&quot;d&lt;1&gt;"'));
  assert.ok(html.includes('aria-label="T&quot;itle&lt;&amp;&gt; 项目操作"'));
  assert.ok(html.includes('value="T&quot;itle&lt;&amp;&gt;"'));
  assert.ok(
    html.includes('<span class="story-project-type" data-workspace-project-type>类&lt;型&gt;</span>'),
  );
  assert.ok(html.includes('<img src="u&quot;rl" alt="项目封面 1"'));
  assert.ok(html.includes('>标&lt;签&gt;</span>'));
  assert.ok(html.includes('· 2 &lt;项&gt;</small>'));
  assert.equal(html.includes('<项>'), false);
});

test('does not mutate the entry or the card options', () => {
  const entry = {
    id: 'p-1',
    title: 'T',
    archivedAt: 1,
    updatedAt: 9,
    data: { project: { title: 'Nested', id: 'p-1' } },
  };
  const options = {
    isDeleteConfirming: false,
    isMenuOpen: true,
    fallbackTitle: 'F',
    itemCount: 4,
    itemLabel: '个',
    coverImageUrls: ['a', 'a'],
    emptyCoverLabel: '空',
    coverAltPrefix: '封面',
    projectTypeLabel: '短剧',
    taskSummary: { activeCount: 1, failedCount: 0, label: '生成中' },
  };
  const entrySnapshot = JSON.parse(JSON.stringify(entry));
  const optionsSnapshot = JSON.parse(JSON.stringify(options));
  const html = renderWorkspaceProjectCard(entry, options);
  assert.deepEqual(entry, entrySnapshot);
  assert.deepEqual(options, optionsSnapshot);
  assert.deepEqual(options.coverImageUrls, ['a', 'a']);
  assert.equal(renderWorkspaceProjectCard(entry, options), html);
  assert.ok(html.includes('data-workspace-project-id="p-1"'));
  assert.ok(html.includes('<small>已自动保存 · 4 个</small>'));
  assert.ok(
    html.includes(
      '<span class="story-project-status is-generating" data-workspace-project-status role="status" aria-live="polite">生成中</span>',
    ),
  );
  assert.ok(html.includes('class="story-project-card  is-archived is-menu-open is-generating" '));
  assert.ok(
    html.includes('class="story-project-card-copy has-project-type" data-workspace-project-card-copy>'),
  );
  assert.equal(count(html, '<img '), 1);
});
