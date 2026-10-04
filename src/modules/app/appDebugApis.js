export function createCanvasCommandsDebugApi({
  executeCanvasCommand: executeCanvasCommand2,
  executeCanvasCommandPlan: executeCanvasCommandPlan2,
  commandContext: commandContext,
} = {}) {
  return {
    executeCanvasCommand(value, item = {}) {
      return executeCanvasCommand2?.(value, item, commandContext);
    },
    executeCanvasCommandPlan(list = []) {
      return executeCanvasCommandPlan2?.(list, commandContext);
    },
  };
}
export function createCanvasAgentDebugApi({
  agentRuntime: agentRuntime,
  agentSessionStore: agentSessionStore,
  agentSkillRegistry: agentSkillRegistry,
  refreshAgentSkills: refreshAgentSkills,
} = {}) {
  return {
    handleUserMessage: (...args) => agentRuntime?.['handleUserMessage']?.(...args),
    answerClarification: (...args2) => agentRuntime?.['answerClarification']?.(...args2),
    confirmPendingPlan: (...args3) => agentRuntime?.['confirmPendingPlan']?.(...args3),
    cancelPendingPlan: (...args4) => agentRuntime?.['cancelPendingPlan']?.(...args4),
    retryFailedPlan: (...args5) => agentRuntime?.['retryFailedPlan']?.(...args5),
    keepPreparedPlan: (...args6) => agentRuntime?.['keepPreparedPlan']?.(...args6),
    discardInterruptedRun: (...args7) => agentRuntime?.['discardInterruptedRun']?.(...args7),
    stop: (...args8) => agentRuntime?.['stop']?.(...args8),
    resetSession: (...args9) => agentRuntime?.['resetSession']?.(...args9),
    startNewConversation: (...args10) => agentRuntime?.['startNewConversation']?.(...args10),
    switchConversation: (...args11) => agentRuntime?.['switchConversation']?.(...args11),
    deleteConversation: (...args12) => agentRuntime?.['deleteConversation']?.(...args12),
    listConversations: (...args13) => agentRuntime?.['listConversations']?.(...args13),
    getActiveConversation: (...args14) => agentRuntime?.['getActiveConversation']?.(...args14),
    getSessionState: () => agentSessionStore?.['getState']?.(),
    listSkills: () => agentSkillRegistry?.['listCatalog']?.() || [],
    getSkillState: () => agentSkillRegistry?.['getState']?.() || null,
    refreshSkills: (...args15) => refreshAgentSkills?.(...args15),
  };
}
export function installAppDebugApis({
  windowObject: windowObject = globalThis['window'],
  canvasCommands: canvasCommands,
  canvasAgent: canvasAgent,
} = {}) {
  if (windowObject?.['DEV_MODE'] !== !![]) return ![];
  return (
    (windowObject['__aiCanvasDebug'] = {
      ...(windowObject['__aiCanvasDebug'] || {}),
      canvasCommands: canvasCommands,
      canvasAgent: canvasAgent,
    }),
    !![]
  );
}
