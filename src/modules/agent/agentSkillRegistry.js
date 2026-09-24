import { parseAgentSkillMarkdown } from './agentSkillPackage.js';
function normalizeText(_0x2b5ce1, _0x4a13ee = 0x0) {
  const _0x4debfc = String(_0x2b5ce1 == null ? '' : _0x2b5ce1)['trim']();
  return _0x4a13ee > 0x0 ? _0x4debfc['slice'](0x0, _0x4a13ee) : _0x4debfc;
}
function normalizeStringArray(_0x253e90, _0x22eff7 = 0x28) {
  return [
    ...new Set(
      (Array['isArray'](_0x253e90) ? _0x253e90 : [])
        ['map']((_0x586e9a) => normalizeText(_0x586e9a, 0xa0))
        ['filter'](Boolean),
    ),
  ]['slice'](0x0, _0x22eff7);
}
function normalizeResources(_0x333649 = []) {
  return (Array['isArray'](_0x333649) ? _0x333649 : [])
    ['map']((_0x53acd8 = {}) => ({
      name: normalizeText(_0x53acd8['name'], 0xa0),
      content: normalizeText(_0x53acd8['content'], 0x10 * 0x400),
    }))
    ['filter']((_0x5da0a4) => _0x5da0a4['name'] && _0x5da0a4['content'])
    ['slice'](0x0, 0x18);
}
export function normalizeRuntimeAgentSkill(_0x3324ae = {}, _0x5c9ed4 = 'built-in') {
  return {
    schemaVersion: 0x1,
    id: normalizeText(_0x3324ae['id'] || _0x3324ae['name'], 0x40)['toLowerCase'](),
    title: normalizeText(_0x3324ae['title'] || _0x3324ae['id'] || _0x3324ae['name'], 0x78),
    description: normalizeText(_0x3324ae['description'], 0x258),
    category: normalizeText(_0x3324ae['category'], 0x50) || 'canvas',
    version: normalizeText(_0x3324ae['version'], 0x28) || 'built-in',
    riskLevel: normalizeText(_0x3324ae['riskLevel'], 0x14) || 'safe',
    appliesWhen: normalizeStringArray(_0x3324ae['appliesWhen']),
    triggers: normalizeStringArray(_0x3324ae['triggers']),
    requiredInputs: normalizeStringArray(_0x3324ae['requiredInputs']),
    missingInputQuestions: normalizeStringArray(_0x3324ae['missingInputQuestions']),
    recommendedModelKind: normalizeText(_0x3324ae['recommendedModelKind'], 0x28),
    defaultParams:
      _0x3324ae['defaultParams'] && typeof _0x3324ae['defaultParams'] === 'object'
        ? { ..._0x3324ae['defaultParams'] }
        : {},
    commands: normalizeStringArray(_0x3324ae['commands']),
    manualOnly: _0x3324ae['manualOnly'] === !![],
    managedBy: normalizeText(_0x3324ae['managedBy'], 0x50),
    instructions: normalizeText(_0x3324ae['instructions'], 0x18 * 0x400),
    source: normalizeText(_0x3324ae['source'], 0x28) || _0x5c9ed4,
    packageId: normalizeText(_0x3324ae['packageId'], 0x64),
    resourceNames: normalizeStringArray(_0x3324ae['resourceNames'], 0x18),
    resources: normalizeResources(_0x3324ae['resources']),
    execution: {
      scriptsAvailable: _0x3324ae['execution']?.['scriptsAvailable'] === !![],
      scriptsEnabled: ![],
    },
  };
}
function escapeSkillReference(_0x22952d = '') {
  return String(_0x22952d || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function containsSkillReference(_0x248d17, _0x5b270c, { prefixed: prefixed = ![] } = {}) {
  const _0x29571c = normalizeText(_0x248d17),
    _0x5a08cc = normalizeText(_0x5b270c);
  if (!_0x29571c || !_0x5a08cc) return ![];
  if (/[^\x00-\x7f]/u['test'](_0x5a08cc) && !prefixed)
    return _0x29571c['toLowerCase']()['includes'](_0x5a08cc['toLowerCase']());
  const _0x409934 = escapeSkillReference(_0x5a08cc),
    _0x2b5370 = prefixed
      ? '[$/]' + _0x409934 + '(?=$|[^\\p{L}\\p{N}_-])'
      : '(?:^|[^\\p{L}\\p{N}_-])' + _0x409934 + '(?=$|[^\\p{L}\\p{N}_-])';
  return new RegExp(_0x2b5370, 'iu')['test'](_0x29571c);
}
function isExplicitSkillRequest(_0x198bc4, _0x42cb62 = {}) {
  const _0x24ce12 = normalizeText(_0x42cb62['id']),
    _0x17e6d5 = normalizeText(_0x42cb62['title']);
  return Boolean(
    (_0x24ce12 && containsSkillReference(_0x198bc4, _0x24ce12, { prefixed: !![] })) ||
    (_0x17e6d5 && containsSkillReference(_0x198bc4, _0x17e6d5)),
  );
}
const IGNORED_RELEVANCE_TERMS = new Set(['一个', '使用', '内容', '可以', '帮助', '支持', '用户', '进行']);
function collectRelevanceTerms(_0xd642e0 = '') {
  const _0x32a36e = normalizeText(_0xd642e0)['toLowerCase'](),
    _0x54c917 = new Set(_0x32a36e['match'](/[a-z0-9][a-z0-9_-]{1,}/g) || []);
  for (const _0x54591c of _0x32a36e['match'](/[\u3400-\u9fff]{2,}/g) || []) {
    const _0x20e19b = _0x54591c['slice'](0x0, 0x50);
    for (const _0x3c9a35 of [0x2, 0x3]) {
      for (let _0x14f7f2 = 0x0; _0x14f7f2 <= _0x20e19b['length'] - _0x3c9a35; _0x14f7f2 += 0x1) {
        const _0x2e4f45 = _0x20e19b['slice'](_0x14f7f2, _0x14f7f2 + _0x3c9a35);
        if (!IGNORED_RELEVANCE_TERMS['has'](_0x2e4f45)) _0x54c917['add'](_0x2e4f45);
      }
    }
  }
  return _0x54c917;
}
function scoreDescriptionRelevance(_0x317b4a, _0x3962d9 = {}) {
  const _0x14a835 = collectRelevanceTerms(_0x317b4a);
  if (_0x14a835['size'] === 0x0) return 0x0;
  const _0x4466e7 = collectRelevanceTerms(
    (_0x3962d9['title'] || '') + '\x20' + (_0x3962d9['description'] || ''),
  );
  let _0x411cca = 0x0;
  for (const _0xdf6bf of _0x14a835) {
    if (_0x4466e7['has'](_0xdf6bf)) _0x411cca += 0x1;
  }
  return Math['min'](0xb4, _0x411cca * 0x3c);
}
function scoreInstalledSkill(_0x4233e4, _0x28c9d6 = {}) {
  const _0x54f042 = normalizeText(_0x28c9d6['userMessage'])['toLowerCase'](),
    _0x2dc6c1 = isExplicitSkillRequest(_0x54f042, _0x4233e4);
  if (_0x4233e4['manualOnly'] && !_0x2dc6c1) return 0x0;
  let _0x485c39 = _0x2dc6c1 ? 0x3e8 : 0x0;
  for (const _0x31a407 of [..._0x4233e4['triggers'], ..._0x4233e4['appliesWhen']]) {
    const _0xdb5d28 = normalizeText(_0x31a407)['toLowerCase']();
    if (_0xdb5d28 && _0x54f042['includes'](_0xdb5d28)) _0x485c39 += 0xf0;
  }
  if (!_0x2dc6c1) _0x485c39 += scoreDescriptionRelevance(_0x54f042, _0x4233e4);
  return (
    _0x485c39 > 0x0 &&
      _0x28c9d6['targetKind'] &&
      _0x4233e4['recommendedModelKind'] === _0x28c9d6['targetKind'] &&
      (_0x485c39 += 0x28),
    _0x485c39
  );
}
function summarizeSkill(_0x23ddec = {}) {
  return {
    id: _0x23ddec['id'],
    title: _0x23ddec['title'],
    description: _0x23ddec['description'],
    category: _0x23ddec['category'],
    version: _0x23ddec['version'],
    source: _0x23ddec['source'],
    riskLevel: _0x23ddec['riskLevel'],
    recommendedModelKind: _0x23ddec['recommendedModelKind'],
    manualOnly: _0x23ddec['manualOnly'],
    editable: _0x23ddec['source'] === 'installed' && _0x23ddec['managedBy'] === 'shuo-canvas',
    enabled: _0x23ddec['enabled'] !== ![],
  };
}
export function createAgentSkillRegistryCore({
  builtInSkills: builtInSkills = [],
  scoreBuiltInSkill: scoreBuiltInSkill = null,
} = {}) {
  const _0xddff94 = (Array['isArray'](builtInSkills) ? builtInSkills : [])
    ['map']((_0x656543) => normalizeRuntimeAgentSkill(_0x656543, 'built-in'))
    ['filter']((_0x4435a9) => _0x4435a9['id']);
  let _0x3d20f2 = [],
    _0x30cafb = [],
    _0x54df3b = '';
  const _0x4306a6 = new Set();
  function _0x388968() {
    return [..._0xddff94, ..._0x3d20f2]['map']((_0x2939dd) => ({
      ..._0x2939dd,
      enabled: !_0x4306a6['has'](_0x2939dd['id']),
      defaultParams: { ..._0x2939dd['defaultParams'] },
      resources: _0x2939dd['resources']['map']((_0x215b98) => ({ ..._0x215b98 })),
      execution: { ..._0x2939dd['execution'] },
    }));
  }
  return {
    replaceInstalledPackages(_0x166f45 = [], _0x5a7e19 = {}) {
      const _0x195947 = [],
        _0x47f009 = Array['isArray'](_0x5a7e19['diagnostics'])
          ? _0x5a7e19['diagnostics']['map']((_0x42c30d) => ({ ..._0x42c30d }))
          : [],
        _0x78f5db = new Set(_0xddff94['map']((_0x2948cc) => _0x2948cc['id']));
      for (const _0x40c691 of Array['isArray'](_0x166f45) ? _0x166f45 : []) {
        const _0x4b295a = parseAgentSkillMarkdown(_0x40c691?.['markdown'], {
          packageId: _0x40c691?.['packageId'],
          source: 'installed',
          resourceNames: _0x40c691?.['resourceNames'],
          resources: _0x40c691?.['resources'],
          hasScripts: _0x40c691?.['hasScripts'],
        });
        if (!_0x4b295a['ok']) {
          _0x47f009['push'](_0x4b295a);
          continue;
        }
        if (_0x78f5db['has'](_0x4b295a['skill']['id'])) {
          _0x47f009['push']({
            ok: ![],
            packageId: _0x4b295a['skill']['packageId'],
            errorCode: 'DUPLICATE_SKILL_ID',
            message: 'Duplicate skill id: ' + _0x4b295a['skill']['id'],
          });
          continue;
        }
        (_0x78f5db['add'](_0x4b295a['skill']['id']),
          _0x195947['push'](normalizeRuntimeAgentSkill(_0x4b295a['skill'], 'installed')));
      }
      return (
        (_0x3d20f2 = _0x195947),
        (_0x30cafb = _0x47f009),
        (_0x54df3b = normalizeText(_0x5a7e19['rootPath'], 0x1f4)),
        {
          available: !![],
          loaded: _0x3d20f2['length'],
          rootPath: _0x54df3b,
          diagnostics: _0x30cafb['map']((_0x5723d6) => ({ ..._0x5723d6 })),
        }
      );
    },
    listSkills: _0x388968,
    listCatalog() {
      return _0x388968()['map'](summarizeSkill);
    },
    setDisabledSkillIds(_0x5db7c7 = []) {
      _0x4306a6['clear']();
      for (const _0x464c31 of normalizeStringArray(_0x5db7c7, 0x64)) _0x4306a6['add'](_0x464c31);
      return [..._0x4306a6];
    },
    setSkillEnabled(_0x58c88c, _0x1543b9 = !![]) {
      const _0x32396f = normalizeText(_0x58c88c, 0x40)['toLowerCase']();
      if (!_0x32396f || !_0x388968()['some']((_0x2e67b6) => _0x2e67b6['id'] === _0x32396f)) return ![];
      if (_0x1543b9 === ![]) _0x4306a6['add'](_0x32396f);
      else _0x4306a6['delete'](_0x32396f);
      return !![];
    },
    select({ maxSkills: maxSkills = 0x2, ..._0x1c466e } = {}) {
      const _0x4164f4 = Number(maxSkills),
        _0x55d98e = Math['max'](0x0, Number['isFinite'](_0x4164f4) ? Math['trunc'](_0x4164f4) : 0x2);
      return _0x388968()
        ['filter']((_0x5da9f3) => _0x5da9f3['enabled'] !== ![])
        ['map']((_0x1552fe, _0x2c90a5) => ({
          skill: _0x1552fe,
          index: _0x2c90a5,
          score:
            _0x1552fe['source'] === 'built-in' && typeof scoreBuiltInSkill === 'function'
              ? scoreBuiltInSkill(_0x1552fe, _0x1c466e)
              : scoreInstalledSkill(_0x1552fe, _0x1c466e),
        }))
        ['filter']((_0x56601b) => _0x56601b['score'] > 0x0)
        ['sort'](
          (_0x139713, _0x47b205) =>
            _0x47b205['score'] - _0x139713['score'] || _0x139713['index'] - _0x47b205['index'],
        )
        ['slice'](0x0, _0x55d98e)
        ['map']((_0x30780e) => _0x30780e['skill']);
    },
    getState() {
      return {
        rootPath: _0x54df3b,
        builtInCount: _0xddff94['length'],
        installedCount: _0x3d20f2['length'],
        disabledSkillIds: [..._0x4306a6],
        diagnostics: _0x30cafb['map']((_0x25c704) => ({ ..._0x25c704 })),
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
