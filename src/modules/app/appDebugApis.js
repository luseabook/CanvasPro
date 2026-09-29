export function createCanvasCommandsDebugApi({
  executeCanvasCommand: _0x31c022,
  executeCanvasCommandPlan: _0x1dfc09,
  commandContext: _0x14a359,
} = {}) {
  return {
    executeCanvasCommand(_0xf9b738, _0x1a9eae = {}) {
      return _0x31c022?.(_0xf9b738, _0x1a9eae, _0x14a359);
    },
    executeCanvasCommandPlan(_0x2f00d8 = []) {
      return _0x1dfc09?.(_0x2f00d8, _0x14a359);
    },
  };
}
export function createCanvasAgentDebugApi({
  agentRuntime: _0x15c103,
  agentSessionStore: _0x3a0053,
  agentSkillRegistry: _0x116786,
  refreshAgentSkills: _0x3bfcdd,
} = {}) {
  return {
    handleUserMessage: (..._0x18b257) => _0x15c103?.['handleUserMessage']?.(..._0x18b257),
    answerClarification: (..._0x5e8fd) => _0x15c103?.['answerClarification']?.(..._0x5e8fd),
    confirmPendingPlan: (..._0x8e99b9) => _0x15c103?.['confirmPendingPlan']?.(..._0x8e99b9),
    cancelPendingPlan: (..._0x3a0b19) => _0x15c103?.['cancelPendingPlan']?.(..._0x3a0b19),
    retryFailedPlan: (..._0x68a161) => _0x15c103?.['retryFailedPlan']?.(..._0x68a161),
    keepPreparedPlan: (..._0xbdf17c) => _0x15c103?.['keepPreparedPlan']?.(..._0xbdf17c),
    discardInterruptedRun: (..._0x28c75d) => _0x15c103?.['discardInterruptedRun']?.(..._0x28c75d),
    stop: (..._0x1ac620) => _0x15c103?.['stop']?.(..._0x1ac620),
    resetSession: (..._0x9bb605) => _0x15c103?.['resetSession']?.(..._0x9bb605),
    startNewConversation: (..._0x177549) => _0x15c103?.['startNewConversation']?.(..._0x177549),
    switchConversation: (..._0x3a47df) => _0x15c103?.['switchConversation']?.(..._0x3a47df),
    deleteConversation: (..._0x400877) => _0x15c103?.['deleteConversation']?.(..._0x400877),
    listConversations: (..._0x9974e1) => _0x15c103?.['listConversations']?.(..._0x9974e1),
    getActiveConversation: (..._0x3d0275) => _0x15c103?.['getActiveConversation']?.(..._0x3d0275),
    getSessionState: () => _0x3a0053?.['getState']?.(),
    listSkills: () => _0x116786?.['listCatalog']?.() || [],
    getSkillState: () => _0x116786?.['getState']?.() || null,
    refreshSkills: (..._0x1c954b) => _0x3bfcdd?.(..._0x1c954b),
  };
}
export function installAppDebugApis({
  windowObject: windowObject = globalThis['window'],
  canvasCommands: _0x3fdb5c,
  canvasAgent: _0x5e654b,
} = {}) {
  if (windowObject?.['DEV_MODE'] !== !![]) return ![];
  return (
    (windowObject['__aiCanvasDebug'] = {
      ...(windowObject['__aiCanvasDebug'] || {}),
      canvasCommands: _0x3fdb5c,
      canvasAgent: _0x5e654b,
    }),
    !![]
  );
}
