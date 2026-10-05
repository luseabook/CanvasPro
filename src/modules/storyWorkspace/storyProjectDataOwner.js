import { normalizeStoryWorkspaceAssetData } from './storyAssetAppearances.js';
import { createStoryProjectUiState } from './storyProjectSession.js';
import { isStoryProjectTaskTokenCurrent, isStoryProjectTaskTokenLive } from './storyProjectTaskToken.js';
import { createStoryWorkspaceSnapshot } from './storyWorkspacePersistence.js';
const normalizeText = (value) => String(value ?? '')['trim'](),
  cloneData = (item) => JSON['parse'](JSON['stringify'](item)),
  getProjectId = (key) => normalizeText(key?.['project']?.['id']),
  getEntryId = (index) => normalizeText(index?.['id'] || index?.['data']?.['project']?.['id']);
export function createStoryProjectDataOwner({ state: state } = {}) {
  if (!state || typeof state !== 'object')
    throw new TypeError('Story project data requires workspace state.');
  const map = new Map();
  function run(result) {
    const projectId = getProjectId(result);
    if (!projectId) return ![];
    return (map['set'](projectId, result), !![]);
  }
  function getEntry(data) {
    const text = normalizeText(data);
    return (state['projects'] || [])['find']((options) => getEntryId(options) === text) || null;
  }
  function getData(target) {
    const text2 = normalizeText(target);
    if (!text2) return null;
    if (text2 === getProjectId(state['data'])) return state['data'];
    if (map['has'](text2)) return map['get'](text2);
    const enabled = getEntry(text2);
    if (!enabled?.['data']?.['project']) return null;
    const storyWorkspaceAssetData = normalizeStoryWorkspaceAssetData(cloneData(enabled['data']));
    return (run(storyWorkspaceAssetData), storyWorkspaceAssetData);
  }
  function run2(
    title,
    { isCurrent: isCurrent = title === state['data'], projectTitleEdited: projectTitleEdited = ![] } = {},
  ) {
    const id = getProjectId(title);
    if (!id) return ![];
    run(title);
    const list = (state['projects'] ||= []),
      count = list['findIndex']((source) => getEntryId(source) === id),
      args = count >= 0 ? list[count] : {},
      next = {
        ...args,
        id: id,
        title: title['project']['title'],
        createdAt: Number(args['createdAt'] || 0) || Date['now'](),
        updatedAt: Date['now'](),
        projectTitleEdited: isCurrent
          ? state['projectTitleEdited'] === !![]
          : projectTitleEdited === !![] || args['projectTitleEdited'] === !![],
        ui:
          isCurrent && state['view'] !== 'home'
            ? createStoryProjectUiState(state)
            : cloneData(args['ui'] || (isCurrent ? createStoryProjectUiState(state) : {})),
        data: cloneData(title),
      };
    if (count >= 0) list[count] = next;
    else list['unshift'](next);
    return !![];
  }
  function syncCurrentEntry() {
    return state['hasCreatedProject'] === !![] && run2(state['data']);
  }
  function registerTaskData(current) {
    return isStoryProjectTaskTokenLive(state, current) && run(current['data']);
  }
  function syncTaskEntry(projectTitleEdited2) {
    if (!isStoryProjectTaskTokenLive(state, projectTitleEdited2)) return ![];
    return run2(projectTitleEdited2['data'], {
      isCurrent: isStoryProjectTaskTokenCurrent(state, projectTitleEdited2),
      projectTitleEdited: projectTitleEdited2['projectTitleEdited'],
    });
  }
  function replaceCurrent(entry) {
    return ((state['data'] = entry), run(entry), entry);
  }
  function activate(record, { beforeActivate: beforeActivate = () => {} } = {}) {
    if (!getEntry(record)) return null;
    syncCurrentEntry();
    const enabled2 = getData(record);
    if (!enabled2) return null;
    return (beforeActivate(), replaceCurrent(enabled2), getEntry(record));
  }
  function addEntry(args2) {
    const id2 = getEntryId(args2);
    if (!id2 || !args2?.['data']?.['project']) return ![];
    const payload = (state['projects'] ||= []);
    if (getEntry(id2)) return ![];
    return (
      run(args2['data']),
      payload['unshift']({ ...args2, id: id2, data: cloneData(args2['data']) }),
      !![]
    );
  }
  function removeEntry(handle) {
    const text3 = normalizeText(handle),
      list2 = state['projects'] || [];
    return (
      (state['projects'] = list2['filter']((config) => getEntryId(config) !== text3)),
      map['delete'](text3),
      state['projects']['length'] !== list2['length']
    );
  }
  function restoreEntries(scope, { preserveLive: preserveLive = ![] } = {}) {
    if (!preserveLive) map['clear']();
    state['projects'] = (scope || [])['map']((args3) => {
      const entryId = getEntryId(args3),
        input = preserveLive
          ? state['hasCreatedProject'] && entryId === getProjectId(state['data'])
            ? state['data']
            : map['get'](entryId)
          : null,
        data2 = input || args3['data'];
      return (run(data2), { ...args3, data: data2 ? cloneData(data2) : data2 });
    });
  }
  function getAllData() {
    const args4 = new Set([
      getProjectId(state['data']),
      ...map['keys'](),
      ...(state['projects'] || [])['map'](getEntryId),
    ]);
    return [...args4]['map'](getData)['filter'](Boolean);
  }
  function applyChanges(handler) {
    let changed = ![],
      currentProjectChanged = ![];
    for (const output of getAllData()) {
      const isCurrent2 = output === state['data'];
      if (!handler(output, { isCurrent: isCurrent2 })) continue;
      if (!isCurrent2 || state['hasCreatedProject']) run2(output, { isCurrent: isCurrent2 });
      ((changed = !![]), (currentProjectChanged ||= isCurrent2));
    }
    return { changed: changed, currentProjectChanged: currentProjectChanged };
  }
  return (
    run(state['data']),
    Object['freeze']({
      activate: activate,
      addEntry: addEntry,
      applyChanges: applyChanges,
      createSnapshot() {
        syncCurrentEntry();
        for (const value2 of state['projects'] || []) {
          const enabled3 = getData(getEntryId(value2));
          if (!enabled3 || enabled3 === state['data']) continue;
          ((value2['title'] = enabled3['project']['title']), (value2['data'] = cloneData(enabled3)));
        }
        return createStoryWorkspaceSnapshot(state);
      },
      getAllData: getAllData,
      getData: getData,
      getEntry: getEntry,
      registerTaskData: registerTaskData,
      releaseData: (value3) => map['delete'](normalizeText(value3)),
      removeEntry: removeEntry,
      replaceCurrent: replaceCurrent,
      restoreEntries: restoreEntries,
      syncCurrentEntry: syncCurrentEntry,
      syncTaskEntry: syncTaskEntry,
    })
  );
}
