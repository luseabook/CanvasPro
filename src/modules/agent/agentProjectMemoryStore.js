import {
  AGENT_PROJECT_MEMORY_CATEGORIES,
  AGENT_PROJECT_MEMORY_ENTRY_LIMIT,
  AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
  normalizeAgentProjectMemory,
} from './agentProjectMemory.js';
export const AGENT_PROJECT_MEMORY_STORAGE_KEY = 'aicanvas:agent-project-memory:v1';
const MAX_PROJECTS = 50;
function cloneJson(value) {
  return JSON['parse'](JSON['stringify'](value));
}
function getWindowObject(item) {
  if (item !== undefined) return item;
  return typeof window !== 'undefined' ? window : null;
}
function normalizeProjectId(key = '') {
  return (
    String(key || '')
      ['trim']()
      ['slice'](0, 160) || 'default_v2_project'
  );
}
function normalizeState(options = {}, now2 = Date['now']()) {
  const index = options && typeof options === 'object' && !Array['isArray'](options) ? options : {},
    list = Object['entries'](index['projects'] || {})
      ['map'](([projectId, result]) =>
        normalizeAgentProjectMemory(result, { projectId: projectId, now: now2 }),
      )
      ['sort']((data, target) => target['updatedAt'] - data['updatedAt'])
      ['slice'](0, MAX_PROJECTS);
  return {
    schemaVersion: AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
    projects: Object['fromEntries'](list['map']((source) => [source['projectId'], source])),
  };
}
export function createAgentProjectMemoryStore({
  windowObject: windowObject = undefined,
  getProjectId: getProjectId = () => 'default_v2_project',
  now: now = () => Date['now'](),
} = {}) {
  const windowObject2 = getWindowObject(windowObject),
    handler = () => {
      try {
        return normalizeProjectId(getProjectId?.());
      } catch {
        return 'default_v2_project';
      }
    },
    handler2 = () => {
      try {
        const next = windowObject2?.['localStorage']?.['getItem']?.(AGENT_PROJECT_MEMORY_STORAGE_KEY);
        return normalizeState(next ? JSON['parse'](next) : {}, now());
      } catch {
        return normalizeState({}, now());
      }
    },
    handler3 = (current) => {
      const state = normalizeState(current, now());
      try {
        windowObject2?.['localStorage']?.['setItem']?.(
          AGENT_PROJECT_MEMORY_STORAGE_KEY,
          JSON['stringify'](state),
        );
      } catch {}
      return state;
    },
    memory = () => {
      const projectId2 = handler();
      return cloneJson(
        normalizeAgentProjectMemory(handler2()['projects'][projectId2], { projectId: projectId2 }),
      );
    };
  function remember(list2 = []) {
    const entry = handler2(),
      projectId3 = handler(),
      args = normalizeAgentProjectMemory(entry['projects'][projectId3], { projectId: projectId3 }),
      added = [];
    for (const el of Array['isArray'](list2) ? list2 : []) {
      const category2 = AGENT_PROJECT_MEMORY_CATEGORIES['includes'](el?.['category'])
          ? el['category']
          : 'preferences',
        value2 = normalizeAgentProjectMemory({ [category2]: [el?.['value']] }, { projectId: projectId3 })[
          category2
        ][0];
      if (!value2) continue;
      const record = args[category2]['some'](
        (payload) => payload['toLocaleLowerCase']() === value2['toLocaleLowerCase'](),
      );
      if (record) continue;
      ((args[category2] = [...args[category2], value2]['slice'](-AGENT_PROJECT_MEMORY_ENTRY_LIMIT)),
        added['push']({ category: category2, value: value2 }));
    }
    return (
      added['length'] > 0 &&
        ((args['updatedAt'] = now()), (entry['projects'][projectId3] = args), handler3(entry)),
      { memory: cloneJson(args), added: added }
    );
  }
  function forget({ category: category = '', query: query = '' } = {}) {
    const handle = handler2(),
      projectId4 = handler(),
      agentProjectMemory = normalizeAgentProjectMemory(handle['projects'][projectId4], {
        projectId: projectId4,
      }),
      config = AGENT_PROJECT_MEMORY_CATEGORIES['includes'](category)
        ? [category]
        : AGENT_PROJECT_MEMORY_CATEGORIES,
      list3 = String(query || '')
        ['trim']()
        ['toLocaleLowerCase']();
    let removed = 0;
    for (const scope of config) {
      const list4 = agentProjectMemory[scope];
      agentProjectMemory[scope] = list3
        ? list4['filter']((input) => {
            const list5 = input['toLocaleLowerCase'](),
              enabled = list5['includes'](list3) || list3['includes'](list5);
            if (enabled) removed += 1;
            return !enabled;
          })
        : [];
      if (!list3) removed += list4['length'];
    }
    return (
      removed > 0 &&
        ((agentProjectMemory['updatedAt'] = now()),
        (handle['projects'][projectId4] = agentProjectMemory),
        handler3(handle)),
      { memory: cloneJson(agentProjectMemory), removed: removed }
    );
  }
  function clearMemory() {
    const output = handler2(),
      projectId5 = handler(),
      agentProjectMemory2 = normalizeAgentProjectMemory(output['projects'][projectId5], {
        projectId: projectId5,
      }),
      removed2 = AGENT_PROJECT_MEMORY_CATEGORIES['reduce'](
        (value3, value4) => value3 + agentProjectMemory2[value4]['length'],
        0,
      );
    return (delete output['projects'][projectId5], handler3(output), { memory: memory(), removed: removed2 });
  }
  return { getMemory: memory, remember: remember, forget: forget, clearMemory: clearMemory };
}
