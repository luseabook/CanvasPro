export const AGENT_DISABLED_SKILLS_STORAGE_KEY = 'aiCanvas.agentDisabledSkills.v1';
export function readDisabledAgentSkillIds(_0x2bf69f = globalThis['window']) {
  try {
    const _0x368ee3 = JSON['parse'](
      _0x2bf69f?.['localStorage']?.['getItem']?.(AGENT_DISABLED_SKILLS_STORAGE_KEY) || '[]',
    );
    return Array['isArray'](_0x368ee3)
      ? [
          ...new Set(
            _0x368ee3['map']((_0x2462e2) =>
              String(_0x2462e2 || '')
                ['trim']()
                ['toLowerCase'](),
            )['filter'](Boolean),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function persistDisabledAgentSkillIds(_0x13f2d9, _0x5d41df = globalThis['window']) {
  try {
    const _0xf62046 = _0x13f2d9?.['getState']?.()['disabledSkillIds'] || [];
    return (
      _0x5d41df?.['localStorage']?.['setItem']?.(
        AGENT_DISABLED_SKILLS_STORAGE_KEY,
        JSON['stringify'](_0xf62046),
      ),
      !![]
    );
  } catch {
    return ![];
  }
}
export function hydrateDisabledAgentSkillIds({
  registry: _0x187597,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  return _0x187597?.['setDisabledSkillIds']?.(readDisabledAgentSkillIds(windowObject)) || [];
}
export function setAgentSkillEnabledPreference({
  registry: _0x47a770,
  skillId: _0x44332a,
  enabled: _0x110d1e,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  if (_0x47a770?.['setSkillEnabled']?.(_0x44332a, _0x110d1e) !== !![]) return ![];
  return (persistDisabledAgentSkillIds(_0x47a770, windowObject), !![]);
}
export function forgetAgentSkillPreference({
  registry: _0x46bad9,
  skillId: _0x289e5e,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x5d2c70 = String(_0x289e5e || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x5d2c70 || typeof _0x46bad9?.['setDisabledSkillIds'] !== 'function') return ![];
  const _0x1724a4 = (_0x46bad9['getState']?.()['disabledSkillIds'] || [])['filter'](
    (_0x28d6b8) => _0x28d6b8 !== _0x5d2c70,
  );
  return (
    _0x46bad9['setDisabledSkillIds'](_0x1724a4),
    persistDisabledAgentSkillIds(_0x46bad9, windowObject),
    !![]
  );
}
