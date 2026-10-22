import { normalizeAgentRunEvent, replayAgentRunEvents } from './agentRunEventLog.js';
import { normalizeAgentOperation } from './agentDurableRunState.js';
import { normalizeAgentSkillUsageSnapshots } from './agentSkillUsage.js';
import {
  compareAgentSessionProjection,
  createAgentMessageSessionEvent,
  createAgentOperationSessionEvent,
  createAgentRunSessionEvent,
  createAgentTaskSessionEvent,
  projectAgentSessionEvents,
} from './agentSessionEventLog.js';
const DEFAULT_RECENT_COMMAND_LIMIT = 50,
  DEFAULT_TRACE_LIMIT = 80,
  DEFAULT_RUN_EVENT_LIMIT = 240,
  MAX_HISTORY_MESSAGES = 100,
  MAX_OPERATION_LEDGER_ENTRIES = 120;
/**
 * Agent 会话运行时状态仓库。
 *
 * 0.8.9 起由「内存态 + 会话快照」升级为「事件溯源」：
 * 每条消息 / 运行事件 / 操作 / 任务绑定都会产出一条 sessionEvent（带单调 seq），
 * 整份状态可用 projectAgentSessionEvents 从事件流派生出等价投影，
 * 并由 compareAgentSessionProjection 做投影与内存态的一致性对账。
 */
export function createAgentSessionStore({
  recentCommandLimit: recentCommandLimit = DEFAULT_RECENT_COMMAND_LIMIT,
  traceLimit: traceLimit = DEFAULT_TRACE_LIMIT,
  runEventLimit: runEventLimit = DEFAULT_RUN_EVENT_LIMIT,
  conversationStore: conversationStore = null,
} = {}) {
  const state = {
      history: [],
      contextDigest: null,
      recentCommands: [],
      debugTrace: [],
      runEvents: [],
      sessionEvents: [],
      operationLedger: [],
      taskBindings: [],
      pendingPlan: null,
      pendingRecovery: null,
      pendingClarification: null,
      pendingLoopRun: null,
      currentRun: null,
    },
    stateListeners = new Set(),
    assistantStreamListeners = new Set();
  // 当前已加载会话的指纹（projectId::conversationId），用于判定是否需要重新水合。
  let loadedConversationKey = '',
    loadedProjectId = '',
    lastSessionEventSeq = 0;
  function cloneJson(value, fallback = null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return fallback;
    }
  }
  function hydrateFromConversation(conversation = null, { preserveRuntime: preserveRuntime = false } = {}) {
    ((loadedProjectId = String(conversation?.projectId || '')),
      (loadedConversationKey = conversation
        ? loadedProjectId + '::' + String(conversation.id || '')
        : ''),
      (state.history = Array.isArray(conversation?.messages)
        ? conversation.messages.map((message) => ({ ...message }))
        : []),
      (state.contextDigest = conversation?.contextDigest
        ? cloneJson(conversation.contextDigest, null)
        : null),
      (state.runEvents = Array.isArray(conversation?.runEvents)
        ? conversation.runEvents.map((runEvent) => ({ ...runEvent }))
        : []),
      (state.sessionEvents = Array.isArray(conversation?.sessionEvents)
        ? cloneJson(conversation.sessionEvents, [])
        : []),
      (lastSessionEventSeq = state.sessionEvents.reduce(
        (maxSeq, sessionEvent) => Math.max(maxSeq, Number(sessionEvent?.seq || 0)),
        0,
      )),
      (state.operationLedger = Array.isArray(conversation?.operationLedger)
        ? conversation.operationLedger.map((operation) => ({ ...operation }))
        : []),
      (state.taskBindings = Array.isArray(conversation?.taskBindings)
        ? cloneJson(conversation.taskBindings, [])
        : []),
      !preserveRuntime &&
        ((state.pendingLoopRun = conversation?.resumeCheckpoint
          ? cloneJson(conversation.resumeCheckpoint, null)
          : null),
        (state.pendingClarification = conversation?.pendingClarification
          ? cloneJson(conversation.pendingClarification, null)
          : null)));
  }
  // 切会话时清掉只属于上一轮的运行时数据（保留事件流与操作账本，它们随新会话一起水合）。
  function resetEphemeralState() {
    ((state.recentCommands = []),
      (state.debugTrace = []),
      (state.taskBindings = []),
      (state.pendingPlan = null),
      (state.pendingRecovery = null),
      (state.pendingLoopRun = null),
      (state.currentRun = null));
  }
  function ensureActiveConversationLoaded() {
    const conversation = conversationStore?.ensureActiveConversation?.({
      preferLatestWithMessages: true,
    });
    const activeConversation = conversation || null;
    if (activeConversation) hydrateFromConversation(activeConversation);
    return activeConversation;
  }
  function readActiveConversation() {
    const activeConversationId = conversationStore?.getActiveConversationId?.();
    return activeConversationId
      ? conversationStore?.getConversation?.(activeConversationId) || null
      : null;
  }
  // 当前会话可能被外部切换（或跨工程）——指纹一变就整体换水合，避免串会话。
  function syncActiveConversation() {
    const current = readActiveConversation(),
      projectChanged = Boolean(current?.projectId && String(current.projectId) !== loadedProjectId),
      target = projectChanged
        ? conversationStore?.ensureActiveConversation?.({ preferLatestWithMessages: true }) || null
        : current || conversationStore?.ensureActiveConversation?.() || null,
      targetKey = target ? String(target.projectId || '') + '::' + String(target.id || '') : '';
    if (targetKey !== loadedConversationKey) (resetEphemeralState(), hydrateFromConversation(target));
    return target;
  }
  function getActiveConversationInternal() {
    return syncActiveConversation();
  }
  function buildStateSnapshot() {
    const sessionProjection = projectAgentSessionEvents(state.sessionEvents);
    return {
      history: [...state.history],
      contextDigest: cloneJson(state.contextDigest, null),
      recentCommands: [...state.recentCommands],
      debugTrace: [...state.debugTrace],
      runEvents: [...state.runEvents],
      sessionEvents: cloneJson(state.sessionEvents, []),
      sessionProjection: sessionProjection,
      sessionProjectionParity: compareAgentSessionProjection({
        projection: sessionProjection,
        messages: state.history,
        runEvents: state.runEvents,
        operationLedger: state.operationLedger,
        taskBindings: state.taskBindings,
      }),
      operationLedger: cloneJson(state.operationLedger, []),
      taskBindings: cloneJson(state.taskBindings, []),
      pendingPlan: state.pendingPlan,
      pendingRecovery: state.pendingRecovery,
      pendingClarification: state.pendingClarification,
      pendingLoopRun: state.pendingLoopRun,
      currentRun: state.currentRun,
      activeConversation: getActiveConversationInternal(),
    };
  }
  function notifyStateListeners(meta = {}) {
    const snapshot = buildStateSnapshot();
    for (const listener of stateListeners) {
      try {
        listener(snapshot, meta);
      } catch {}
    }
  }
  function updateActiveConversation(patch = {}) {
    syncActiveConversation();
    const activeConversationId = conversationStore?.getActiveConversationId?.();
    if (!activeConversationId) return null;
    const updated = conversationStore?.updateConversation?.(activeConversationId, patch) || null;
    // 会话层可能悄悄追加了事件（例如落盘时补齐 seq），这里跟一次以免内存态落后。
    if (updated?.sessionEvents) {
      state.sessionEvents = cloneJson(updated.sessionEvents, []);
      lastSessionEventSeq = state.sessionEvents.reduce(
        (maxSeq, sessionEvent) => Math.max(maxSeq, Number(sessionEvent?.seq || 0)),
        0,
      );
    }
    return updated;
  }
  function appendSessionEvent(createEvent, extra = {}) {
    const activeConversation = readActiveConversation(),
      seq = ++lastSessionEventSeq,
      sessionEvent = createEvent({
        id: (activeConversation?.id || 'agent-session') + ':event:' + seq,
        seq: seq,
        conversationId: activeConversation?.id || 'in-memory',
        projectId: activeConversation?.projectId || '',
        ...extra,
      });
    if (!sessionEvent) return null;
    return (state.sessionEvents.push(sessionEvent), sessionEvent);
  }
  function clearSessionRuntime() {
    (resetEphemeralState(),
      (state.runEvents = []),
      (state.pendingClarification = null),
      notifyStateListeners({ type: 'runtime_cleared' }));
  }
  ensureActiveConversationLoaded();
  function pushHistory(entry = {}) {
    syncActiveConversation();
    const nextEntry = { ...entry, ts: entry.ts || Date.now() };
    state.history.push(nextEntry);
    if (state.history.length > MAX_HISTORY_MESSAGES)
      state.history.splice(0, state.history.length - MAX_HISTORY_MESSAGES);
    const activeConversationId = conversationStore?.getActiveConversationId?.();
    if (activeConversationId) {
      const updated = conversationStore?.appendMessage?.(activeConversationId, {
        ...nextEntry,
        turnId: String(entry.turnId || state.currentRun?.id || '').trim(),
        itemId: String(entry.itemId || '').trim(),
      });
      // 消息落盘会带回完整会话（含事件流），只水合数据、不动本轮运行时。
      if (updated) hydrateFromConversation(updated, { preserveRuntime: true });
    } else
      appendSessionEvent(createAgentMessageSessionEvent, {
        turnId: String(entry.turnId || state.currentRun?.id || '').trim(),
        itemId: String(entry.itemId || 'agent-message-' + state.history.length).trim(),
        message: nextEntry,
      });
    notifyStateListeners({ type: 'history', entry: nextEntry });
  }
  let runEventSequence = 0;
  function recordRunEvent(event = {}) {
    syncActiveConversation();
    const activeConversation = getActiveConversationInternal(),
      normalizedEvent = normalizeAgentRunEvent({
        ...event,
        id:
          event.id ||
          'agent-event-' + Date.now().toString(36) + '-' + ++runEventSequence,
        conversationId: event.conversationId || activeConversation?.id || '',
        projectId: event.projectId || activeConversation?.projectId || '',
      });
    if (!normalizedEvent) return null;
    state.runEvents.push(normalizedEvent);
    state.runEvents.length > runEventLimit &&
      state.runEvents.splice(0, state.runEvents.length - runEventLimit);
    const activeConversationId = conversationStore?.getActiveConversationId?.();
    if (activeConversationId) {
      const updated = conversationStore?.appendRunEvent?.(activeConversationId, normalizedEvent);
      if (updated) {
        state.runEvents = [...(updated.runEvents || [])];
        state.sessionEvents = cloneJson(updated.sessionEvents, []);
      }
    } else appendSessionEvent(createAgentRunSessionEvent, { runEvent: normalizedEvent });
    return (notifyStateListeners({ type: 'run_event', event: normalizedEvent }), { ...normalizedEvent });
  }
  function normalizeTaskBinding(binding = {}) {
    const id = String(binding.id || '').trim(),
      nodeId = String(binding.nodeId || binding.targetNodeId || '').trim();
    if (!id || !nodeId) return null;
    return {
      id: id,
      conversationId: String(binding.conversationId || '').trim(),
      turnId: String(binding.turnId || '').trim(),
      nodeId: nodeId,
      targetNodeId: String(binding.targetNodeId || nodeId).trim(),
      taskId: String(binding.taskId || '').trim(),
      commandId: String(binding.commandId || 'generation.run').trim(),
      status: String(binding.status || '').trim(),
      messageStatus: String(binding.messageStatus || '').trim(),
      createdAt: Number(binding.createdAt || Date.now()) || Date.now(),
      updatedAt: Number(binding.updatedAt || Date.now()) || Date.now(),
      notifiedTerminal: binding.notifiedTerminal === true,
    };
  }
  function upsertTaskBinding(binding = {}) {
    return upsertTaskBindings([binding])[0] || null;
  }
  function upsertTaskBindings(bindings = []) {
    syncActiveConversation();
    const touched = [];
    for (const candidate of Array.isArray(bindings) ? bindings : []) {
      const normalizedBinding = normalizeTaskBinding(candidate);
      if (!normalizedBinding) continue;
      const existingIndex = state.taskBindings.findIndex(
        (binding) => binding.id === normalizedBinding.id,
      );
      if (existingIndex >= 0) {
        state.taskBindings[existingIndex] = {
          ...state.taskBindings[existingIndex],
          ...normalizedBinding,
          updatedAt: normalizedBinding.updatedAt || Date.now(),
        };
        touched.push({ ...state.taskBindings[existingIndex] });
      } else {
        (state.taskBindings.push(normalizedBinding), touched.push({ ...normalizedBinding }));
      }
    }
    if (touched.length === 0) return [];
    const persisted = updateActiveConversation({ taskBindings: state.taskBindings });
    // 落盘成功就由会话层保留事件流；没落盘才在内存里补一条任务绑定事件。
    if (!persisted)
      touched.forEach((binding) => {
        appendSessionEvent(createAgentTaskSessionEvent, { taskBinding: binding });
      });
    (notifyStateListeners({ type: 'task_bindings', bindings: touched }), touched);
    return touched;
  }
  function updateTaskBinding(id, patch = {}) {
    const normalizedId = String(id || '').trim(),
      existingIndex = state.taskBindings.findIndex((binding) => binding.id === normalizedId);
    if (existingIndex < 0) return null;
    state.taskBindings[existingIndex] = normalizeTaskBinding({
      ...state.taskBindings[existingIndex],
      ...patch,
      id: normalizedId,
      updatedAt: Date.now(),
    });
    const persisted = updateActiveConversation({ taskBindings: state.taskBindings });
    if (!persisted)
      appendSessionEvent(createAgentTaskSessionEvent, {
        taskBinding: state.taskBindings[existingIndex],
      });
    notifyStateListeners({ type: 'task_binding', binding: state.taskBindings[existingIndex] });
    return { ...state.taskBindings[existingIndex] };
  }
  return {
    getPersistenceError: () => conversationStore?.getPersistenceError?.() || '',
    retryPersistence: () => conversationStore?.retryPersistence?.() ?? true,
    subscribe(listener) {
      if (typeof listener !== 'function')
        throw new TypeError('[agentSessionStore] subscribe() requires a function');
      return (
        stateListeners.add(listener),
        listener(null, { type: 'init' }),
        () => stateListeners.delete(listener)
      );
    },
    getState() {
      return (syncActiveConversation(), buildStateSnapshot());
    },
    pushHistory: pushHistory,
    subscribeAssistantStream(listener) {
      return (assistantStreamListeners.add(listener), () => assistantStreamListeners.delete(listener));
    },
    isConversationLoaded(conversationId) {
      return (
        loadedConversationKey === loadedProjectId + '::' + conversationId ||
        (!loadedConversationKey && !conversationId)
      );
    },
    emitAssistantStream(chunk) {
      for (const listener of assistantStreamListeners) {
        try {
          listener(chunk);
        } catch {}
      }
    },
    replaceConversationMessages(messages, { conversationId: conversationId = '' } = {}) {
      const activeConversation = syncActiveConversation();
      // 只有「同一会话 + 长度一致」才做原位替换，否则视为越权写入直接拒绝。
      if (
        String(activeConversation?.id || '') !== conversationId ||
        messages.length !== state.history.length
      )
        return false;
      const previousHistory = state.history,
        persisted = updateActiveConversation({ messages: messages });
      if (persisted) hydrateFromConversation(persisted, { preserveRuntime: true });
      else {
        state.history = messages;
        messages.forEach((message, index) => {
          if (JSON.stringify(message) === JSON.stringify(previousHistory[index])) return;
          appendSessionEvent(createAgentMessageSessionEvent, {
            itemId: message.itemId || 'agent-message-' + (index + 1),
            turnId: message.turnId,
            message: message,
            previousMessage: previousHistory[index],
          });
        });
      }
      return (notifyStateListeners({ type: 'history_replaced' }), true);
    },
    getHistory() {
      return (syncActiveConversation(), [...state.history]);
    },
    getContextDigest() {
      return (syncActiveConversation(), cloneJson(state.contextDigest, null));
    },
    setContextDigest(contextDigest, { conversationId: conversationId = '' } = {}) {
      const activeConversation = syncActiveConversation(),
        activeConversationId = String(activeConversation?.id || '').trim(),
        targetConversationId = String(conversationId || activeConversationId).trim();
      if (!targetConversationId)
        return (
          (state.contextDigest = cloneJson(contextDigest, null)),
          notifyStateListeners({ type: 'context_digest', contextDigest: state.contextDigest }),
          cloneJson(state.contextDigest, null)
        );
      const updated =
        conversationStore?.updateConversation?.(targetConversationId, {
          contextDigest: contextDigest || null,
        }) || null;
      // 只有更新的就是当前会话时才回写内存态，避免跨会话串味。
      if (updated && targetConversationId === activeConversationId) {
        state.contextDigest = cloneJson(updated.contextDigest, null);
        notifyStateListeners({ type: 'context_digest', contextDigest: state.contextDigest });
      }
      return cloneJson(updated?.contextDigest || null, null);
    },
    recordCommand(command = {}) {
      (state.recentCommands.push({
        commandId: String(command.commandId || ''),
        ok: command.result?.ok !== false,
        errorCode: command.result?.errorCode || '',
        message: command.result?.message || '',
        riskLevel: command.riskLevel || '',
        ts: command.ts || Date.now(),
      }),
        state.recentCommands.length > recentCommandLimit &&
          state.recentCommands.splice(0, state.recentCommands.length - recentCommandLimit));
    },
    getRecentCommands() {
      return [...state.recentCommands];
    },
    recordTrace(trace = {}) {
      const type = String(trace.type || '').trim();
      if (!type) return;
      state.debugTrace.push({ ...trace, type: type, ts: trace.ts || Date.now() });
      state.debugTrace.length > traceLimit &&
        state.debugTrace.splice(0, state.debugTrace.length - traceLimit);
      // 关键调试事件顺带转成运行事件，供回放与投影使用。
      if (type === 'agent_loop_tool_result')
        recordRunEvent({
          runId: state.currentRun?.id,
          type: 'tool.completed',
          step: trace.step,
          commandId: trace.commandId,
          ok: trace.ok,
          confirmed: trace.confirmed,
        });
      else if (type === 'agent_capability_discovered')
        recordRunEvent({
          runId: state.currentRun?.id,
          type: 'capability.discovered',
          step: trace.step,
          commandId: trace.sourceCommandId,
          commandIds: trace.commandIds,
          modelIds: trace.modelIds,
        });
      else if (type === 'canvas_action_held_for_chat')
        recordRunEvent({
          runId: state.currentRun?.id,
          type: 'action.held',
          message: trace.reason,
        });
      else if (type === 'agent_skill_context_injected') {
        const runId = String(state.currentRun?.id || '').trim();
        if (!runId) return;
        // 同一 run 内同样的技能快照不重复记，避免每轮注入都堆一条。
        const skillSnapshots = normalizeAgentSkillUsageSnapshots(trace.skills),
          signature = JSON.stringify([trace.channel || '', skillSnapshots]),
          previousEvent = [...state.runEvents]
            .reverse()
            .find((runEvent) => runEvent.type === 'skill.injected' && runEvent.runId === runId),
          previousSignature = previousEvent
            ? JSON.stringify([previousEvent.channel || '', previousEvent.skillSnapshots || []])
            : '';
        if (signature === previousSignature) return;
        recordRunEvent({
          runId: runId,
          type: 'skill.injected',
          status: 'injected',
          channel: trace.channel,
          skillIds: trace.skillIds,
          skillSnapshots: skillSnapshots,
        });
      }
    },
    getDebugTrace() {
      return [...state.debugTrace];
    },
    upsertOperation(operation = {}) {
      syncActiveConversation();
      const normalizedOperation = normalizeAgentOperation(operation);
      if (!normalizedOperation) return null;
      // 目标会话不是当前会话：只允许更新它账本里已有的条目，绝不新建。
      if (
        normalizedOperation.conversationId &&
        normalizedOperation.conversationId !== getActiveConversationInternal()?.id
      ) {
        const targetConversation = conversationStore?.getConversation?.(
          normalizedOperation.conversationId,
        );
        if (
          !targetConversation ||
          (normalizedOperation.projectId &&
            targetConversation.projectId !== normalizedOperation.projectId)
        )
          return null;
        const targetIndex = targetConversation.operationLedger.findIndex(
          (entry) => entry.id === normalizedOperation.id,
        );
        if (targetIndex < 0) return null;
        targetConversation.operationLedger[targetIndex] = {
          ...targetConversation.operationLedger[targetIndex],
          ...normalizedOperation,
        };
        conversationStore.updateConversation(targetConversation.id, {
          operationLedger: targetConversation.operationLedger,
        });
        return cloneJson(targetConversation.operationLedger[targetIndex], null);
      }
      const existingIndex = state.operationLedger.findIndex(
        (entry) => entry.id === normalizedOperation.id,
      );
      if (existingIndex >= 0)
        state.operationLedger[existingIndex] = {
          ...state.operationLedger[existingIndex],
          ...normalizedOperation,
        };
      else state.operationLedger.push(normalizedOperation);
      // 账本只保留最近 120 条，老的靠 sessionEvents 溯源。
      state.operationLedger = state.operationLedger.slice(-MAX_OPERATION_LEDGER_ENTRIES);
      const persisted = updateActiveConversation({ operationLedger: state.operationLedger });
      const effectiveOperation =
        existingIndex >= 0 ? state.operationLedger[existingIndex] : normalizedOperation;
      if (!persisted)
        appendSessionEvent(createAgentOperationSessionEvent, { operation: effectiveOperation });
      notifyStateListeners({ type: 'operation', operation: normalizedOperation });
      return cloneJson(effectiveOperation, null);
    },
    getOperationLedger() {
      return (syncActiveConversation(), cloneJson(state.operationLedger, []));
    },
    getSessionEvents() {
      return (syncActiveConversation(), cloneJson(state.sessionEvents, []));
    },
    getSessionProjection() {
      return (syncActiveConversation(), projectAgentSessionEvents(state.sessionEvents));
    },
    getSessionProjectionParity() {
      return (syncActiveConversation(), buildStateSnapshot().sessionProjectionParity);
    },
    recordRunEvent: recordRunEvent,
    getRunEvents({ runId: runId = '' } = {}) {
      syncActiveConversation();
      const normalizedRunId = String(runId || '').trim();
      return state.runEvents
        .filter((runEvent) => !normalizedRunId || runEvent.runId === normalizedRunId)
        .map((runEvent) => ({ ...runEvent }));
    },
    replayRun(runId = '') {
      return (syncActiveConversation(), replayAgentRunEvents(state.runEvents, { runId: runId }));
    },
    upsertTaskBinding: upsertTaskBinding,
    upsertTaskBindings: upsertTaskBindings,
    updateTaskBinding: updateTaskBinding,
    getTaskBindings() {
      return cloneJson(state.taskBindings, []);
    },
    setPendingPlan(plan) {
      ((state.pendingPlan = plan || null),
        plan &&
          recordRunEvent({
            runId: state.currentRun?.id,
            type: 'approval.requested',
            status: 'need_confirmation',
          }));
    },
    getPendingPlan() {
      return state.pendingPlan;
    },
    clearPendingPlan() {
      state.pendingPlan = null;
    },
    setPendingRecovery(recovery) {
      state.pendingRecovery = recovery || null;
    },
    getPendingRecovery() {
      return state.pendingRecovery;
    },
    clearPendingRecovery() {
      state.pendingRecovery = null;
    },
    setPendingClarification(clarification) {
      (syncActiveConversation(),
        (state.pendingClarification = clarification || null),
        updateActiveConversation({ pendingClarification: clarification || null }));
    },
    getPendingClarification() {
      return (syncActiveConversation(), state.pendingClarification);
    },
    clearPendingClarification() {
      (syncActiveConversation(),
        (state.pendingClarification = null),
        updateActiveConversation({ pendingClarification: null }));
    },
    setPendingLoopRun(checkpoint) {
      (syncActiveConversation(),
        (state.pendingLoopRun = checkpoint || null),
        updateActiveConversation({ resumeCheckpoint: checkpoint || null }));
    },
    getPendingLoopRun() {
      return (syncActiveConversation(), state.pendingLoopRun);
    },
    clearPendingLoopRun() {
      (syncActiveConversation(),
        (state.pendingLoopRun = null),
        updateActiveConversation({ resumeCheckpoint: null }));
    },
    setCurrentRun(run) {
      ((state.currentRun = run || null),
        run &&
          recordRunEvent({
            runId: run.id,
            type: 'run.status',
            status: run.status,
            step: run.step,
          }));
    },
    getAssistantTextTask() {
      return getActiveConversationInternal()?.assistantTextTask || null;
    },
    async setAssistantTextTask(assistantTextTask) {
      const activeConversation = getActiveConversationInternal();
      if (!activeConversation || !conversationStore)
        throw new Error('对话缺少持久化存储，已停止提交文本任务。');
      (conversationStore.updateConversation(
        activeConversation.id,
        { assistantTextTask: assistantTextTask },
        { required: true },
      ),
        await conversationStore.flushPersistence?.());
    },
    getCurrentRun() {
      return state.currentRun;
    },
    stopCurrentRun() {
      return (
        state.currentRun &&
          (state.currentRun = { ...state.currentRun, stopped: true, status: 'stopped' }),
        state.currentRun &&
          recordRunEvent({
            runId: state.currentRun.id,
            type: 'run.status',
            status: 'stopped',
            step: state.currentRun.step,
          }),
        state.currentRun
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
    getActiveConversation: getActiveConversationInternal,
    listConversations() {
      return conversationStore?.listConversations?.() || [];
    },
    startNewConversation() {
      clearSessionRuntime();
      const conversation = conversationStore?.createConversation?.() || null;
      return (hydrateFromConversation(conversation), conversation);
    },
    switchConversation(conversationId) {
      const conversation = conversationStore?.setActiveConversationId?.(conversationId);
      if (!conversation) return null;
      return (clearSessionRuntime(), hydrateFromConversation(conversation), conversation);
    },
    deleteConversation(conversationId) {
      // 删的不是当前会话，就只转发，不动运行时。
      if (String(conversationId || '').trim() !== getActiveConversationInternal()?.id)
        return conversationStore?.deleteConversation?.(conversationId) || null;
      clearSessionRuntime();
      const result = conversationStore?.deleteConversation?.(conversationId) || null;
      return (hydrateFromConversation(result), result);
    },
    reset() {
      clearSessionRuntime();
    },
  };
}
