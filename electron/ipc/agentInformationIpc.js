export function registerAgentInformationIpcHandlers({ ipcMain, agentInformationOperations }) {
  ipcMain.handle('agentInformation:readUrl', (_event, payload = {}) =>
    agentInformationOperations.readUrl(payload),
  );
}
