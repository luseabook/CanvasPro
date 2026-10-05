import { parseAgentSkillMarkdown } from './agentSkillPackage.js';
function normalizeText(value, count = 0) {
  const list = String(value == null ? '' : value)['trim']();
  return count > 0 ? list['slice'](0, count) : list;
}
function normalizeStringArray(item, key = 40) {
  return [
    ...new Set(
      (Array['isArray'](item) ? item : [])['map']((index) => normalizeText(index, 160))['filter'](Boolean),
    ),
  ]['slice'](0, key);
}
function normalizeResources(list2 = []) {
  return (Array['isArray'](list2) ? list2 : [])
    ['map']((error = {}) => ({
      name: normalizeText(error['name'], 160),
      content: normalizeText(error['content'], 16 * 1024),
    }))
    ['filter']((error2) => error2['name'] && error2['content'])
    ['slice'](0, 24);
}
export function normalizeRuntimeAgentSkill(defaultParams = {}, result = 'built-in') {
  return {
    schemaVersion: 1,
    id: normalizeText(defaultParams['id'] || defaultParams['name'], 64)['toLowerCase'](),
    title: normalizeText(defaultParams['title'] || defaultParams['id'] || defaultParams['name'], 120),
    description: normalizeText(defaultParams['description'], 600),
    category: normalizeText(defaultParams['category'], 80) || 'canvas',
    version: normalizeText(defaultParams['version'], 40) || 'built-in',
    riskLevel: normalizeText(defaultParams['riskLevel'], 20) || 'safe',
    appliesWhen: normalizeStringArray(defaultParams['appliesWhen']),
    triggers: normalizeStringArray(defaultParams['triggers']),
    requiredInputs: normalizeStringArray(defaultParams['requiredInputs']),
    missingInputQuestions: normalizeStringArray(defaultParams['missingInputQuestions']),
    recommendedModelKind: normalizeText(defaultParams['recommendedModelKind'], 40),
    defaultParams:
      defaultParams['defaultParams'] && typeof defaultParams['defaultParams'] === 'object'
        ? { ...defaultParams['defaultParams'] }
        : {},
    commands: normalizeStringArray(defaultParams['commands']),
    manualOnly: defaultParams['manualOnly'] === true,
    managedBy: normalizeText(defaultParams['managedBy'], 80),
    instructions: normalizeText(defaultParams['instructions'], 24 * 1024),
    source: normalizeText(defaultParams['source'], 40) || result,
    packageId: normalizeText(defaultParams['packageId'], 100),
    resourceNames: normalizeStringArray(defaultParams['resourceNames'], 24),
    resources: normalizeResources(defaultParams['resources']),
    execution: {
      scriptsAvailable: defaultParams['execution']?.['scriptsAvailable'] === true,
      scriptsEnabled: false,
    },
  };
}
function escapeSkillReference(data = '') {
  return String(data || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function containsSkillReference(options, target, { prefixed: prefixed = false } = {}) {
  const text = normalizeText(options),
    text2 = normalizeText(target);
  if (!text || !text2) return false;
  if (/[^\x00-\x7f]/u['test'](text2) && !prefixed)
    return text['toLowerCase']()['includes'](text2['toLowerCase']());
  const escapeSkillReference2 = escapeSkillReference(text2),
    source = prefixed
      ? '[$/]' + escapeSkillReference2 + '(?=$|[^\\p{L}\\p{N}_-])'
      : '(?:^|[^\\p{L}\\p{N}_-])' + escapeSkillReference2 + '(?=$|[^\\p{L}\\p{N}_-])';
  return new RegExp(source, 'iu')['test'](text);
}
function isExplicitSkillRequest(next, current = {}) {
  const text3 = normalizeText(current['id']),
    text4 = normalizeText(current['title']);
  return Boolean(
    (text3 && containsSkillReference(next, text3, { prefixed: true })) ||
    (text4 && containsSkillReference(next, text4)),
  );
}
const IGNORED_RELEVANCE_TERMS = new Set(['一个', '使用', '内容', '可以', '帮助', '支持', '用户', '进行']);
function collectRelevanceTerms(entry = '') {
  const text5 = normalizeText(entry)['toLowerCase'](),
    record = new Set(text5['match'](/[a-z0-9][a-z0-9_-]{1,}/g) || []);
  for (const list3 of text5['match'](/[\u3400-\u9fff]{2,}/g) || []) {
    const list4 = list3['slice'](0, 80);
    for (const payload of [2, 3]) {
      for (let handle = 0; handle <= list4['length'] - payload; handle += 1) {
        const state = list4['slice'](handle, handle + payload);
        if (!IGNORED_RELEVANCE_TERMS['has'](state)) record['add'](state);
      }
    }
  }
  return record;
}
function scoreDescriptionRelevance(config, scope = {}) {
  const relevanceTerms = collectRelevanceTerms(config);
  if (relevanceTerms['size'] === 0) return 0;
  const map = collectRelevanceTerms((scope['title'] || '') + ' ' + (scope['description'] || ''));
  let input = 0;
  for (const output of relevanceTerms) {
    if (map['has'](output)) input += 1;
  }
  return Math['min'](180, input * 60);
}
function scoreInstalledSkill(args, value2 = {}) {
  const list5 = normalizeText(value2['userMessage'])['toLowerCase'](),
    isExplicitSkillRequest2 = isExplicitSkillRequest(list5, args);
  if (args['manualOnly'] && !isExplicitSkillRequest2) return 0;
  let count2 = isExplicitSkillRequest2 ? 1000 : 0;
  for (const value3 of [...args['triggers'], ...args['appliesWhen']]) {
    const text6 = normalizeText(value3)['toLowerCase']();
    if (text6 && list5['includes'](text6)) count2 += 240;
  }
  if (!isExplicitSkillRequest2) count2 += scoreDescriptionRelevance(list5, args);
  return (
    count2 > 0 &&
      value2['targetKind'] &&
      args['recommendedModelKind'] === value2['targetKind'] &&
      (count2 += 40),
    count2
  );
}
function summarizeSkill(id = {}) {
  return {
    id: id['id'],
    title: id['title'],
    description: id['description'],
    category: id['category'],
    version: id['version'],
    source: id['source'],
    riskLevel: id['riskLevel'],
    recommendedModelKind: id['recommendedModelKind'],
    manualOnly: id['manualOnly'],
    editable: id['source'] === 'installed' && id['managedBy'] === 'shuo-canvas',
    enabled: id['enabled'] !== false,
  };
}
export function createAgentSkillRegistryCore({
  builtInSkills: builtInSkills = [],
  scoreBuiltInSkill: scoreBuiltInSkill = null,
} = {}) {
  const builtInCount = (Array['isArray'](builtInSkills) ? builtInSkills : [])
    ['map']((value4) => normalizeRuntimeAgentSkill(value4, 'built-in'))
    ['filter']((value5) => value5['id']);
  let loaded = [],
    diagnostics = [],
    rootPath = '';
  const map2 = new Set();
  function listSkills() {
    return [...builtInCount, ...loaded]['map']((resources) => ({
      ...resources,
      enabled: !map2['has'](resources['id']),
      defaultParams: { ...resources['defaultParams'] },
      resources: resources['resources']['map']((args2) => ({ ...args2 })),
      execution: { ...resources['execution'] },
    }));
  }
  return {
    replaceInstalledPackages(list6 = [], value6 = {}) {
      const list7 = [],
        list8 = Array['isArray'](value6['diagnostics'])
          ? value6['diagnostics']['map']((args3) => ({ ...args3 }))
          : [],
        map3 = new Set(builtInCount['map']((value7) => value7['id']));
      for (const packageId of Array['isArray'](list6) ? list6 : []) {
        const packageId2 = parseAgentSkillMarkdown(packageId?.['markdown'], {
          packageId: packageId?.['packageId'],
          source: 'installed',
          resourceNames: packageId?.['resourceNames'],
          resources: packageId?.['resources'],
          hasScripts: packageId?.['hasScripts'],
        });
        if (!packageId2['ok']) {
          list8['push'](packageId2);
          continue;
        }
        if (map3['has'](packageId2['skill']['id'])) {
          list8['push']({
            ok: false,
            packageId: packageId2['skill']['packageId'],
            errorCode: 'DUPLICATE_SKILL_ID',
            message: 'Duplicate skill id: ' + packageId2['skill']['id'],
          });
          continue;
        }
        (map3['add'](packageId2['skill']['id']),
          list7['push'](normalizeRuntimeAgentSkill(packageId2['skill'], 'installed')));
      }
      return (
        (loaded = list7),
        (diagnostics = list8),
        (rootPath = normalizeText(value6['rootPath'], 500)),
        {
          available: true,
          loaded: loaded['length'],
          rootPath: rootPath,
          diagnostics: diagnostics['map']((args4) => ({ ...args4 })),
        }
      );
    },
    listSkills: listSkills,
    listCatalog() {
      return listSkills()['map'](summarizeSkill);
    },
    setDisabledSkillIds(list9 = []) {
      map2['clear']();
      for (const value8 of normalizeStringArray(list9, 100)) map2['add'](value8);
      return [...map2];
    },
    setSkillEnabled(value9, value10 = true) {
      const text7 = normalizeText(value9, 64)['toLowerCase']();
      if (!text7 || !listSkills()['some']((value11) => value11['id'] === text7)) return false;
      if (value10 === false) map2['add'](text7);
      else map2['delete'](text7);
      return true;
    },
    select({ maxSkills: maxSkills = 2, ...args5 } = {}) {
      const value12 = Number(maxSkills),
        value13 = Math['max'](0, Number['isFinite'](value12) ? Math['trunc'](value12) : 2);
      return listSkills()
        ['filter']((value14) => value14['enabled'] !== false)
        ['map']((skill, index2) => ({
          skill: skill,
          index: index2,
          score:
            skill['source'] === 'built-in' && typeof scoreBuiltInSkill === 'function'
              ? scoreBuiltInSkill(skill, args5)
              : scoreInstalledSkill(skill, args5),
        }))
        ['filter']((value15) => value15['score'] > 0)
        ['sort'](
          (value16, value17) => value17['score'] - value16['score'] || value16['index'] - value17['index'],
        )
        ['slice'](0, value13)
        ['map']((value18) => value18['skill']);
    },
    getState() {
      return {
        rootPath: rootPath,
        builtInCount: builtInCount['length'],
        installedCount: loaded['length'],
        disabledSkillIds: [...map2],
        diagnostics: diagnostics['map']((args6) => ({ ...args6 })),
      };
    },
  };
}
export const agentSkillRegistryInternals = Object['freeze']({
  collectRelevanceTerms: collectRelevanceTerms,
  isExplicitSkillRequest: isExplicitSkillRequest,
  scoreDescriptionRelevance: scoreDescriptionRelevance,
  scoreInstalledSkill: scoreInstalledSkill,
});
