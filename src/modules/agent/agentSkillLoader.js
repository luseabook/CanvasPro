import { desktopBridge } from '../../services/desktopBridge.js';
export async function refreshInstalledAgentSkills({
  registry: _0x461e8a,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!_0x461e8a || typeof _0x461e8a['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { available: ![], loaded: 0x0, rootPath: '', diagnostics: [] };
  try {
    const _0x410a8a = await bridge['agentSkills']['list']();
    return _0x461e8a['replaceInstalledPackages'](_0x410a8a?.['packages'] || [], _0x410a8a || {});
  } catch (_0x3525ec) {
    const _0x300c01 = _0x461e8a['getState']?.() || {};
    return {
      available: ![],
      loaded: Number(_0x300c01['installedCount'] || 0x0),
      rootPath: String(_0x300c01['rootPath'] || ''),
      diagnostics: [
        {
          ok: ![],
          errorCode: 'SKILL_DISCOVERY_FAILED',
          message: String(_0x3525ec?.['message'] || _0x3525ec || 'Skill discovery failed')['slice'](
            0x0,
            0x12c,
          ),
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
  registry: _0x1daa48,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!_0x1daa48 || typeof _0x1daa48['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent Skill Registry is required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_IMPORT_UNAVAILABLE' };
  const _0x563fa1 = await bridge['agentSkills']['installFromFolder']();
  if (_0x563fa1?.['success'] !== !![]) return _0x563fa1;
  const _0x4d1af7 = await refreshInstalledAgentSkills({ registry: _0x1daa48, bridge: bridge });
  if (_0x4d1af7['available'] === ![])
    return { ..._0x563fa1, success: ![], errorCode: 'SKILL_REFRESH_AFTER_INSTALL_FAILED' };
  return { ..._0x563fa1, loaded: _0x4d1af7['loaded'] };
}
export async function saveManagedAgentSkill({
  registry: _0x51daf8,
  definition: _0x16fab8,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!_0x51daf8 || typeof _0x51daf8['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent\x20Skill\x20Registry\x20is\x20required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_SAVE_UNAVAILABLE' };
  const _0x2b76ee = await bridge['agentSkills']['saveManaged'](_0x16fab8 || {});
  if (_0x2b76ee?.['success'] !== !![]) return _0x2b76ee;
  const _0x672556 = await refreshInstalledAgentSkills({ registry: _0x51daf8, bridge: bridge });
  if (_0x672556['available'] === ![])
    return { ..._0x2b76ee, success: ![], errorCode: 'SKILL_REFRESH_AFTER_SAVE_FAILED' };
  return { ..._0x2b76ee, loaded: _0x672556['loaded'] };
}
export async function deleteInstalledAgentSkill({
  registry: _0x1df578,
  request: _0x3662aa,
  bridge: bridge = desktopBridge,
} = {}) {
  if (!_0x1df578 || typeof _0x1df578['replaceInstalledPackages'] !== 'function')
    throw new TypeError('Agent\x20Skill\x20Registry\x20is\x20required.');
  if (bridge?.['agentSkills']?.['isAvailable']?.() !== !![])
    return { success: ![], canceled: ![], errorCode: 'SKILL_DELETE_UNAVAILABLE' };
  const _0x1c75df = await bridge['agentSkills']['deleteInstalled'](_0x3662aa || {});
  if (_0x1c75df?.['success'] !== !![]) return _0x1c75df;
  const _0x411581 = await refreshInstalledAgentSkills({ registry: _0x1df578, bridge: bridge });
  if (_0x411581['available'] === ![])
    return { ..._0x1c75df, success: ![], errorCode: 'SKILL_REFRESH_AFTER_DELETE_FAILED' };
  return { ..._0x1c75df, loaded: _0x411581['loaded'] };
}
