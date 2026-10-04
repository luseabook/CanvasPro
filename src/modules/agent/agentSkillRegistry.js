import { parseAgentSkillMarkdown } from './agentSkillPackage.js';
function normalizeText(value, count = 0x0) {
  const list = String(value == null ? '' : value)['trim']();
  return count > 0x0 ? list['slice'](0x0, count) : list;
}
function normalizeStringArray(item, key = 0x28) {
  return [
    ...new Set(
      (Array['isArray'](item) ? item : [])['map']((index) => normalizeText(index, 0xa0))['filter'](Boolean),
    ),
  ]['slice'](0x0, key);
}
function normalizeResources(list2 = []) {
  return (Array['isArray'](list2) ? list2 : [])
    ['map']((error = {}) => ({
      name: normalizeText(error['name'], 0xa0),
      content: normalizeText(error['content'], 0x10 * 0x400),
    }))
    ['filter']((error2) => error2['name'] && error2['content'])
    ['slice'](0x0, 0x18);
}
export function normalizeRuntimeAgentSkill(defaultParams = {}, result = 'built-in') {
  return {
    schemaVersion: 0x1,
    id: normalizeText(defaultParams['id'] || defaultParams['name'], 0x40)['toLowerCase'](),
    title: normalizeText(defaultParams['title'] || defaultParams['id'] || defaultParams['name'], 0x78),
    description: normalizeText(defaultParams['description'], 0x258),
    category: normalizeText(defaultParams['category'], 0x50) || 'canvas',
    version: normalizeText(defaultParams['version'], 0x28) || 'built-in',
    riskLevel: normalizeText(defaultParams['riskLevel'], 0x14) || 'safe',
    appliesWhen: normalizeStringArray(defaultParams['appliesWhen']),
    triggers: normalizeStringArray(defaultParams['triggers']),
    requiredInputs: normalizeStringArray(defaultParams['requiredInputs']),
    missingInputQuestions: normalizeStringArray(defaultParams['missingInputQuestions']),
    recommendedModelKind: normalizeText(defaultParams['recommendedModelKind'], 0x28),
    defaultParams:
      defaultParams['defaultParams'] && typeof defaultParams['defaultParams'] === 'object'
        ? { ...defaultParams['defaultParams'] }
        : {},
    commands: normalizeStringArray(defaultParams['commands']),
    manualOnly: defaultParams['manualOnly'] === !![],
    managedBy: normalizeText(defaultParams['managedBy'], 0x50),
    instructions: normalizeText(defaultParams['instructions'], 0x18 * 0x400),
    source: normalizeText(defaultParams['source'], 0x28) || result,
    packageId: normalizeText(defaultParams['packageId'], 0x64),
    resourceNames: normalizeStringArray(defaultParams['resourceNames'], 0x18),
    resources: normalizeResources(defaultParams['resources']),
    execution: {
      scriptsAvailable: defaultParams['execution']?.['scriptsAvailable'] === !![],
      scriptsEnabled: ![],
    },
  };
}
function escapeSkillReference(data = '') {
  return String(data || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function containsSkillReference(options, target, { prefixed: prefixed = ![] } = {}) {
  const text = normalizeText(options),
    text2 = normalizeText(target);
  if (!text || !text2) return ![];
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
    (text3 && containsSkillReference(next, text3, { prefixed: !![] })) ||
    (text4 && containsSkillReference(next, text4)),
  );
}
const IGNORED_RELEVANCE_TERMS = new Set(['一个', '使用', '内容', '可以', '帮助', '支持', '用户', '进行']);
function collectRelevanceTerms(entry = '') {
  const text5 = normalizeText(entry)['toLowerCase'](),
    record = new Set(text5['match'](/[a-z0-9][a-z0-9_-]{1,}/g) || []);
  for (const list3 of text5['match'](/[\u3400-\u9fff]{2,}/g) || []) {
    const list4 = list3['slice'](0x0, 0x50);
    for (const payload of [0x2, 0x3]) {
      for (let handle = 0x0; handle <= list4['length'] - payload; handle += 0x1) {
        const state = list4['slice'](handle, handle + payload);
        if (!IGNORED_RELEVANCE_TERMS['has'](state)) record['add'](state);
      }
    }
  }
  return record;
}
function scoreDescriptionRelevance(config, scope = {}) {
  const relevanceTerms = collectRelevanceTerms(config);
  if (relevanceTerms['size'] === 0x0) return 0x0;
  const map = collectRelevanceTerms((scope['title'] || '') + '\x20' + (scope['description'] || ''));
  let input = 0x0;
  for (const output of relevanceTerms) {
    if (map['has'](output)) input += 0x1;
  }
  return Math['min'](0xb4, input * 0x3c);
}
function scoreInstalledSkill(args, value2 = {}) {
  const list5 = normalizeText(value2['userMessage'])['toLowerCase'](),
    isExplicitSkillRequest2 = isExplicitSkillRequest(list5, args);
  if (args['manualOnly'] && !isExplicitSkillRequest2) return 0x0;
  let count2 = isExplicitSkillRequest2 ? 0x3e8 : 0x0;
  for (const value3 of [...args['triggers'], ...args['appliesWhen']]) {
    const text6 = normalizeText(value3)['toLowerCase']();
    if (text6 && list5['includes'](text6)) count2 += 0xf0;
  }
  if (!isExplicitSkillRequest2) count2 += scoreDescriptionRelevance(list5, args);
  return (
    count2 > 0x0 &&
      value2['targetKind'] &&
      args['recommendedModelKind'] === value2['targetKind'] &&
      (count2 += 0x28),
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
    enabled: id['enabled'] !== ![],
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
            ok: ![],
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
        (rootPath = normalizeText(value6['rootPath'], 0x1f4)),
        {
          available: !![],
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
      for (const value8 of normalizeStringArray(list9, 0x64)) map2['add'](value8);
      return [...map2];
    },
    setSkillEnabled(value9, value10 = !![]) {
      const text7 = normalizeText(value9, 0x40)['toLowerCase']();
      if (!text7 || !listSkills()['some']((value11) => value11['id'] === text7)) return ![];
      if (value10 === ![]) map2['add'](text7);
      else map2['delete'](text7);
      return !![];
    },
    select({ maxSkills: maxSkills = 0x2, ...args5 } = {}) {
      const value12 = Number(maxSkills),
        value13 = Math['max'](0x0, Number['isFinite'](value12) ? Math['trunc'](value12) : 0x2);
      return listSkills()
        ['filter']((value14) => value14['enabled'] !== ![])
        ['map']((skill, index2) => ({
          skill: skill,
          index: index2,
          score:
            skill['source'] === 'built-in' && typeof scoreBuiltInSkill === 'function'
              ? scoreBuiltInSkill(skill, args5)
              : scoreInstalledSkill(skill, args5),
        }))
        ['filter']((value15) => value15['score'] > 0x0)
        ['sort'](
          (value16, value17) => value17['score'] - value16['score'] || value16['index'] - value17['index'],
        )
        ['slice'](0x0, value13)
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
