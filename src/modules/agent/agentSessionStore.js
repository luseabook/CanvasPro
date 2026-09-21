const DEFAULT_RECENT_COMMAND_LIMIT = 50,
  DEFAULT_TRACE_LIMIT = 80;
export function createAgentSessionStore({
  recentCommandLimit: recentCommandLimit = DEFAULT_RECENT_COMMAND_LIMIT,
  traceLimit: traceLimit = DEFAULT_TRACE_LIMIT,
  conversationStore: conversationStore = null,
} = {}) {
  const _0x2ab3c8 = {
    history: [],
    recentCommands: [],
    debugTrace: [],
    pendingPlan: null,
    pendingRecovery: null,
    pendingClarification: null,
    currentRun: null,
  };
  function _0x4eb9cd(_0x491121 = null) {
    _0x2ab3c8.history = Array.isArray(_0x491121?.messages)
      ? _0x491121.messages.map((_0x2c6334) => ({ ..._0x2c6334 }))
      : [];
  }
  function _0x27c505() {
    const _0x29317a = conversationStore?.ensureActiveConversation?.() || null;
    if (_0x29317a) _0x4eb9cd(_0x29317a);
    return _0x29317a;
  }
  function _0x29ce91() {
    const _0x1a822d = conversationStore?.getActiveConversationId?.();
    return _0x1a822d ? conversationStore?.getConversation?.(_0x1a822d) || null : null;
  }
  function _0xf1408(_0x89d54e = {}) {
    const _0x21ba25 = conversationStore?.getActiveConversationId?.();
    if (!_0x21ba25) return null;
    return conversationStore?.updateConversation?.(_0x21ba25, _0x89d54e) || null;
  }
  function _0x43aef6() {
    ((_0x2ab3c8.recentCommands = []),
      (_0x2ab3c8.debugTrace = []),
      (_0x2ab3c8.pendingPlan = null),
      (_0x2ab3c8.pendingRecovery = null),
      (_0x2ab3c8.pendingClarification = null),
      (_0x2ab3c8.currentRun = null));
  }
  _0x27c505();
  function _0xfa99a1(_0x3b1b92 = {}) {
    const _0x15a8ab = { ..._0x3b1b92, ts: _0x3b1b92.ts || Date.now() };
    _0x2ab3c8.history.push(_0x15a8ab);
    if (_0x2ab3c8.history.length > 100) _0x2ab3c8.history.splice(0, _0x2ab3c8.history.length - 100);
    const _0x12ac91 = conversationStore?.getActiveConversationId?.();
    if (_0x12ac91) {
      const _0x15fd31 = conversationStore?.appendMessage?.(_0x12ac91, _0x15a8ab);
      if (_0x15fd31) _0x4eb9cd(_0x15fd31);
    }
  }
  return {
    getState() {
      return {
        history: [..._0x2ab3c8.history],
        recentCommands: [..._0x2ab3c8.recentCommands],
        debugTrace: [..._0x2ab3c8.debugTrace],
        pendingPlan: _0x2ab3c8.pendingPlan,
        pendingRecovery: _0x2ab3c8.pendingRecovery,
        pendingClarification: _0x2ab3c8.pendingClarification,
        currentRun: _0x2ab3c8.currentRun,
        activeConversation: _0x29ce91(),
      };
    },
    pushHistory: _0xfa99a1,
    getHistory() {
      return [..._0x2ab3c8.history];
    },
    recordCommand(_0x46b800 = {}) {
      (_0x2ab3c8.recentCommands.push({
        commandId: String(_0x46b800.commandId || ''),
        ok: _0x46b800.result?.ok !== false,
        errorCode: _0x46b800.result?.errorCode || '',
        message: _0x46b800.result?.message || '',
        riskLevel: _0x46b800.riskLevel || '',
        ts: _0x46b800.ts || Date.now(),
      }),
        _0x2ab3c8.recentCommands.length > recentCommandLimit &&
          _0x2ab3c8.recentCommands.splice(0, _0x2ab3c8.recentCommands.length - recentCommandLimit));
    },
    getRecentCommands() {
      return [..._0x2ab3c8.recentCommands];
    },
    recordTrace(_0x20a331 = {}) {
      const _0x19dd44 = String(_0x20a331.type || '').trim();
      if (!_0x19dd44) return;
      (_0x2ab3c8.debugTrace.push({ ..._0x20a331, type: _0x19dd44, ts: _0x20a331.ts || Date.now() }),
        _0x2ab3c8.debugTrace.length > traceLimit &&
          _0x2ab3c8.debugTrace.splice(0, _0x2ab3c8.debugTrace.length - traceLimit));
    },
    getDebugTrace() {
      return [..._0x2ab3c8.debugTrace];
    },
    setPendingPlan(_0x54a899) {
      _0x2ab3c8.pendingPlan = _0x54a899 || null;
    },
    getPendingPlan() {
      return _0x2ab3c8.pendingPlan;
    },
    clearPendingPlan() {
      _0x2ab3c8.pendingPlan = null;
    },
    setPendingRecovery(_0x55a42a) {
      _0x2ab3c8.pendingRecovery = _0x55a42a || null;
    },
    getPendingRecovery() {
      return _0x2ab3c8.pendingRecovery;
    },
    clearPendingRecovery() {
      _0x2ab3c8.pendingRecovery = null;
    },
    setPendingClarification(_0x392bf0) {
      _0x2ab3c8.pendingClarification = _0x392bf0 || null;
    },
    getPendingClarification() {
      return _0x2ab3c8.pendingClarification;
    },
    clearPendingClarification() {
      _0x2ab3c8.pendingClarification = null;
    },
    setCurrentRun(_0x293fc5) {
      _0x2ab3c8.currentRun = _0x293fc5 || null;
    },
    getCurrentRun() {
      return _0x2ab3c8.currentRun;
    },
    stopCurrentRun() {
      return (
        _0x2ab3c8.currentRun &&
          (_0x2ab3c8.currentRun = { ..._0x2ab3c8.currentRun, stopped: true, status: 'stopped' }),
        _0x2ab3c8.currentRun
      );
    },
    updateActiveConversation: _0xf1408,
    markUnfinishedOperation({
      lastPlanSummary: lastPlanSummary = '',
      lastCanvasSnapshotDigest: lastCanvasSnapshotDigest = null,
    } = {}) {
      return _0xf1408({
        hasUnfinishedOperation: true,
        lastPlanSummary: lastPlanSummary,
        lastCanvasSnapshotDigest: lastCanvasSnapshotDigest,
      });
    },
    clearUnfinishedOperation() {
      return _0xf1408({ hasUnfinishedOperation: false, lastPlanSummary: '' });
    },
    getActiveConversation: _0x29ce91,
    listConversations() {
      return conversationStore?.listConversations?.() || [];
    },
    startNewConversation() {
      _0x43aef6();
      const _0x5d9263 = conversationStore?.createConversation?.() || null;
      return (_0x4eb9cd(_0x5d9263), _0x5d9263);
    },
    switchConversation(_0x2f64a8) {
      const _0x3317ee = conversationStore?.setActiveConversationId?.(_0x2f64a8);
      if (!_0x3317ee) return null;
      return (_0x43aef6(), _0x4eb9cd(_0x3317ee), _0x3317ee);
    },
    deleteConversation(_0x338280) {
      _0x43aef6();
      const _0x1100aa = conversationStore?.deleteConversation?.(_0x338280) || null;
      return (_0x4eb9cd(_0x1100aa), _0x1100aa);
    },
    reset() {
      _0x43aef6();
    },
  };
}
