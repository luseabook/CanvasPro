export function registerAgentSkillsIpcHandlers({ ipcMain, agentSkillOperations }) {
  ipcMain.handle('agentSkills:list', () => agentSkillOperations.list());
  ipcMain.handle('agentSkills:openRoot', () => agentSkillOperations.openRoot());
  ipcMain.handle('agentSkills:installFromFolder', () => agentSkillOperations.installFromFolder());
  ipcMain.handle('agentSkills:saveManaged', (_event, payload) =>
    agentSkillOperations.saveManagedDefinition(payload),
  );
  ipcMain.handle('agentSkills:deleteInstalled', (_event, payload) =>
    agentSkillOperations.deleteInstalled(payload),
  );
}
