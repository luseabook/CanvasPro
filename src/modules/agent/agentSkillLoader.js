import { desktopBridge } from '../../services/desktopBridge.js';
export async function refreshInstalledAgentSkills({
  registry: registry,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!registry || typeof registry['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { available: ![], loaded: 0, rootPath: '', diagnostics: [] };
  try {
    const value = await bridge['agentSkills']['list']();
    return registry['replaceInstalledPackages'](value?.['packages'] || [], value || {});
  } catch (error) {
    const item = registry['getState']?.() || {};
    return {
      available: ![],
      loaded: Number(item['installedCount'] || 0),
      rootPath: String(item['rootPath'] || ''),
      diagnostics: [
        {
          ok: ![],
          errorCode: 'SKILL_DISCOVERY_FAILED',
          message: String(error?.['message'] || error || 'Skill discovery failed')['slice'](0, 300),
        },
      ],
    };
  }
}
export async function openInstalledAgentSkillsRoot({ bridge: bridge = desktopBridge } = {}) {
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_FOLDER_OPEN_UNAVAILABLE' };
  return bridge['agentSkills']['openRoot']();
}
export async function installAgentSkillFromFolder({
  registry: registry2,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!registry2 || typeof registry2['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_IMPORT_UNAVAILABLE' };
  const response = await bridge['agentSkills']['installFromFolder']();
  if (response?.['success'] !== !![]) return response;
  const loaded = await refreshInstalledAgentSkills({ registry: registry2, bridge: bridge });
  if (loaded['available'] === ![])
    return { ...response, success: ![], errorCode: 'SKILL_REFRESH_AFTER_INSTALL_FAILED' };
  return { ...response, loaded: loaded['loaded'] };
}
export async function saveManagedAgentSkill({
  registry: registry3,
  definition: definition,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!registry3 || typeof registry3['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_SAVE_UNAVAILABLE' };
  const response2 = await bridge['agentSkills']['saveManaged'](definition || {});
  if (response2?.['success'] !== !![]) return response2;
  const loaded2 = await refreshInstalledAgentSkills({ registry: registry3, bridge: bridge });
  if (loaded2['available'] === ![])
    return { ...response2, success: ![], errorCode: 'SKILL_REFRESH_AFTER_SAVE_FAILED' };
  return { ...response2, loaded: loaded2['loaded'] };
}
export async function deleteInstalledAgentSkill({
  registry: registry4,
  request: request,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!registry4 || typeof registry4['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_DELETE_UNAVAILABLE' };
  const response3 = await bridge['agentSkills']['deleteInstalled'](request || {});
  if (response3?.['success'] !== !![]) return response3;
  const loaded3 = await refreshInstalledAgentSkills({ registry: registry4, bridge: bridge });
  if (loaded3['available'] === ![])
    return { ...response3, success: ![], errorCode: 'SKILL_REFRESH_AFTER_DELETE_FAILED' };
  return { ...response3, loaded: loaded3['loaded'] };
}
