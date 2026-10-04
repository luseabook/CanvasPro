const DEFAULT_RECENT_COMMAND_LIMIT = 50,
  DEFAULT_TRACE_LIMIT = 80;
export function createAgentSessionStore({
  recentCommandLimit: recentCommandLimit = DEFAULT_RECENT_COMMAND_LIMIT,
  traceLimit: traceLimit = DEFAULT_TRACE_LIMIT,
  conversationStore: conversationStore = null,
} = {}) {
  const pendingPlan = {
    history: [],
    recentCommands: [],
    debugTrace: [],
    pendingPlan: null,
    pendingRecovery: null,
    pendingClarification: null,
    currentRun: null,
  };
  function run(value = null) {
    pendingPlan.history = Array.isArray(value?.messages) ? value.messages.map((args) => ({ ...args })) : [];
  }
  function run2() {
    const item = conversationStore?.ensureActiveConversation?.() || null;
    if (item) run(item);
    return item;
  }
  function activeConversation() {
    const key = conversationStore?.getActiveConversationId?.();
    return key ? conversationStore?.getConversation?.(key) || null : null;
  }
  function updateActiveConversation(options = {}) {
    const enabled = conversationStore?.getActiveConversationId?.();
    if (!enabled) return null;
    return conversationStore?.updateConversation?.(enabled, options) || null;
  }
  function run3() {
    ((pendingPlan.recentCommands = []),
      (pendingPlan.debugTrace = []),
      (pendingPlan.pendingPlan = null),
      (pendingPlan.pendingRecovery = null),
      (pendingPlan.pendingClarification = null),
      (pendingPlan.currentRun = null));
  }
  run2();
  function pushHistory(ts = {}) {
    const index = { ...ts, ts: ts.ts || Date.now() };
    pendingPlan.history.push(index);
    if (pendingPlan.history.length > 100) pendingPlan.history.splice(0, pendingPlan.history.length - 100);
    const result = conversationStore?.getActiveConversationId?.();
    if (result) {
      const data = conversationStore?.appendMessage?.(result, index);
      if (data) run(data);
    }
  }
  return {
    getState() {
      return {
        history: [...pendingPlan.history],
        recentCommands: [...pendingPlan.recentCommands],
        debugTrace: [...pendingPlan.debugTrace],
        pendingPlan: pendingPlan.pendingPlan,
        pendingRecovery: pendingPlan.pendingRecovery,
        pendingClarification: pendingPlan.pendingClarification,
        currentRun: pendingPlan.currentRun,
        activeConversation: activeConversation(),
      };
    },
    pushHistory: pushHistory,
    getHistory() {
      return [...pendingPlan.history];
    },
    recordCommand(ok = {}) {
      (pendingPlan.recentCommands.push({
        commandId: String(ok.commandId || ''),
        ok: ok.result?.ok !== false,
        errorCode: ok.result?.errorCode || '',
        message: ok.result?.message || '',
        riskLevel: ok.riskLevel || '',
        ts: ok.ts || Date.now(),
      }),
        pendingPlan.recentCommands.length > recentCommandLimit &&
          pendingPlan.recentCommands.splice(0, pendingPlan.recentCommands.length - recentCommandLimit));
    },
    getRecentCommands() {
      return [...pendingPlan.recentCommands];
    },
    recordTrace(ts2 = {}) {
      const type = String(ts2.type || '').trim();
      if (!type) return;
      (pendingPlan.debugTrace.push({ ...ts2, type: type, ts: ts2.ts || Date.now() }),
        pendingPlan.debugTrace.length > traceLimit &&
          pendingPlan.debugTrace.splice(0, pendingPlan.debugTrace.length - traceLimit));
    },
    getDebugTrace() {
      return [...pendingPlan.debugTrace];
    },
    setPendingPlan(target) {
      pendingPlan.pendingPlan = target || null;
    },
    getPendingPlan() {
      return pendingPlan.pendingPlan;
    },
    clearPendingPlan() {
      pendingPlan.pendingPlan = null;
    },
    setPendingRecovery(source) {
      pendingPlan.pendingRecovery = source || null;
    },
    getPendingRecovery() {
      return pendingPlan.pendingRecovery;
    },
    clearPendingRecovery() {
      pendingPlan.pendingRecovery = null;
    },
    setPendingClarification(next) {
      pendingPlan.pendingClarification = next || null;
    },
    getPendingClarification() {
      return pendingPlan.pendingClarification;
    },
    clearPendingClarification() {
      pendingPlan.pendingClarification = null;
    },
    setCurrentRun(current) {
      pendingPlan.currentRun = current || null;
    },
    getCurrentRun() {
      return pendingPlan.currentRun;
    },
    stopCurrentRun() {
      return (
        pendingPlan.currentRun &&
          (pendingPlan.currentRun = { ...pendingPlan.currentRun, stopped: true, status: 'stopped' }),
        pendingPlan.currentRun
      );
    },
    updateActiveConversation: updateActiveConversation,
    markUnfinishedOperation({
      lastPlanSummary: lastPlanSummary = '',
      lastCanvasSnapshotDigest: lastCanvasSnapshotDigest = null,
    } = {}) {
      return updateActiveConversation({
        hasUnfinishedOperation: true,
        lastPlanSummary: lastPlanSummary,
        lastCanvasSnapshotDigest: lastCanvasSnapshotDigest,
      });
    },
    clearUnfinishedOperation() {
      return updateActiveConversation({ hasUnfinishedOperation: false, lastPlanSummary: '' });
    },
    getActiveConversation: activeConversation,
    listConversations() {
      return conversationStore?.listConversations?.() || [];
    },
    startNewConversation() {
      run3();
      const entry = conversationStore?.createConversation?.() || null;
      return (run(entry), entry);
    },
    switchConversation(record) {
      const enabled2 = conversationStore?.setActiveConversationId?.(record);
      if (!enabled2) return null;
      return (run3(), run(enabled2), enabled2);
    },
    deleteConversation(payload) {
      run3();
      const handle = conversationStore?.deleteConversation?.(payload) || null;
      return (run(handle), handle);
    },
    reset() {
      run3();
    },
  };
}
