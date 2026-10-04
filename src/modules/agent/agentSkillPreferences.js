export const AGENT_DISABLED_SKILLS_STORAGE_KEY = 'aiCanvas.agentDisabledSkills.v1';
export function readDisabledAgentSkillIds(value = globalThis['window']) {
  try {
    const list = JSON['parse'](
      value?.['localStorage']?.['getItem']?.(AGENT_DISABLED_SKILLS_STORAGE_KEY) || '[]',
    );
    return Array['isArray'](list)
      ? [
          ...new Set(
            list['map']((item) =>
              String(item || '')
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
export function persistDisabledAgentSkillIds(store, key = globalThis['window']) {
  try {
    const index = store?.['getState']?.()['disabledSkillIds'] || [];
    return (
      key?.['localStorage']?.['setItem']?.(AGENT_DISABLED_SKILLS_STORAGE_KEY, JSON['stringify'](index)),
      !![]
    );
  } catch {
    return ![];
  }
}
export function hydrateDisabledAgentSkillIds({
  registry: registry,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  return registry?.['setDisabledSkillIds']?.(readDisabledAgentSkillIds(windowObject)) || [];
}
export function setAgentSkillEnabledPreference({
  registry: registry2,
  skillId: skillId,
  enabled: enabled,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  if (registry2?.['setSkillEnabled']?.(skillId, enabled) !== !![]) return ![];
  return (persistDisabledAgentSkillIds(registry2, windowObject), !![]);
}
export function forgetAgentSkillPreference({
  registry: registry3,
  skillId: skillId2,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const enabled2 = String(skillId2 || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled2 || typeof registry3?.['setDisabledSkillIds'] !== 'function') return ![];
  const result = (registry3['getState']?.()['disabledSkillIds'] || [])['filter']((data) => data !== enabled2);
  return (
    registry3['setDisabledSkillIds'](result),
    persistDisabledAgentSkillIds(registry3, windowObject),
    !![]
  );
}
