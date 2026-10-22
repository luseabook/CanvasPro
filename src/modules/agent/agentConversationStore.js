import { normalizeAgentRunEvent } from './agentRunEventLog.js';
import { normalizeAgentOfficialTextTask } from './agentOfficialTextTask.js';
import { normalizeAgentReplyVersions } from './agentReplyVersions.js';
import {
  normalizeAgentOperationLedger,
  normalizeAgentResumeCheckpoint,
  normalizeAgentTaskBindings,
} from './agentDurableRunState.js';
import {
  createAgentMessageSessionEvent,
  createAgentOperationSessionEvent,
  createAgentRunSessionEvent,
  createAgentSessionEventsFromLegacyState,
  createAgentTaskSessionEvent,
  normalizeAgentSessionEvent,
} from './agentSessionEventLog.js';
import { normalizeAgentContextDigest } from './agentContextDigest.js';
import { normalizeAgentAssistantContext } from './agentAssistantConversation.js';
import { AGENT_MESSAGE_CONTENT_LIMIT, compactAgentConversationText } from './agentConversationText.js';
export const AGENT_CONVERSATION_STORAGE_KEY = 'aiCanvas.agentConversations.v1';
// schema 2 起会话是「事件溯源」的：sessionEvents 是权威日志，其余都是它的投影/缓存。
const AGENT_CONVERSATION_SCHEMA_VERSION = 2,
  DEFAULT_PROJECT_ID = 'default_v2_project',
  DEFAULT_CONVERSATION_TITLE = '新对话',
  MAX_MESSAGE_CONTENT_CHARS = AGENT_MESSAGE_CONTENT_LIMIT,
  MAX_TITLE_CHARS = 40,
  MAX_SUMMARY_CHARS = 240,
  MAX_MEDIA_URL_CHARS = 2000,
  MAX_MEDIA_NAME_CHARS = 120,
  MAX_MEDIA_ITEMS = 12,
  MAX_RUN_EVENTS = 120,
  MAX_PENDING_ORIGINAL_MESSAGE_CHARS = 4000,
  MAX_PENDING_QUESTION_CHARS = 1200,
  MAX_PENDING_OPTIONS = 12,
  MAX_PENDING_INPUT_REFS = 12,
  MAX_MESSAGE_INPUT_REFS = 12,
  MAX_DIAGNOSTIC_TEXT_CHARS = 360,
  MESSAGE_TYPES = new Set(['text', 'task_status', 'task_result']),
  STORAGE_UNAVAILABLE_MESSAGE = '会话未保存，内容暂存于内存。请勿关闭应用；释放存储空间后重新打开 Agent 即可重试保存。',
  STORAGE_REQUIRED_MESSAGE = '会话存储空间不足或不可用，旧版本已保留，请释放空间后重试';
function getWindowObject(windowObject) {
  if (windowObject) return windowObject;
  if (typeof window !== 'undefined') return window;
  return null;
}
function normalizeProjectId(value) {
  return String(value || '').trim() || DEFAULT_PROJECT_ID;
}
function normalizeTimestamp(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}
function normalizeBoolean(value) {
  return value === true;
}
function normalizeMessageType(value) {
  const normalized = String(value || 'text').trim();
  return MESSAGE_TYPES.has(normalized) ? normalized : 'text';
}
function stripText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(value, limit) {
  const normalized = stripText(value);
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, Math.max(0, limit - 3)) + '...';
}
function truncateMessageContent(value, limit) {
  const normalized = String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim();
  return compactAgentConversationText(normalized, limit);
}
function cloneJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
// 媒体地址只允许普通 URL；data: 内联图会撑爆存储，直接丢弃。
function normalizeTaskMediaText(value = '', limit = MAX_MEDIA_URL_CHARS) {
  const normalized = String(value || '').trim();
  if (!normalized || /^data:/i.test(normalized)) return '';
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit);
}
function normalizeTaskMediaItem(item = {}, fallbackName = '') {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const url = normalizeTaskMediaText(item.url),
    thumbUrl = normalizeTaskMediaText(item.thumbUrl);
  if (!url && !thumbUrl) return null;
  const media = { url: url || thumbUrl, thumbUrl: thumbUrl || url },
    name = normalizeTaskMediaText(item.name || fallbackName, MAX_MEDIA_NAME_CHARS);
  if (name) media.name = name;
  return media;
}
function normalizeTaskMedia(media = {}) {
  if (!media || typeof media !== 'object' || Array.isArray(media)) return null;
  if (String(media.kind || '').trim() !== 'image') return null;
  const name = normalizeTaskMediaText(media.name, MAX_MEDIA_NAME_CHARS),
    items = (Array.isArray(media.items) ? media.items : [])
      .map((item) => normalizeTaskMediaItem(item, name))
      .filter(Boolean)
      .slice(0, MAX_MEDIA_ITEMS),
    singleItem = normalizeTaskMediaItem(media, name),
    resolvedItems = items.length > 0 ? items : singleItem ? [singleItem] : [];
  if (resolvedItems.length === 0) return null;
  const primary = resolvedItems[0],
    normalized = { kind: 'image' };
  (normalized.url = primary.url), (normalized.thumbUrl = primary.thumbUrl);
  if (name) normalized.name = name;
  (resolvedItems.length > 1 || Array.isArray(media.items)) && (normalized.items = resolvedItems);
  return normalized;
}
function normalizeTaskSummary(summary = {}) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null;
  const nodeId = String(summary.nodeId || summary.targetNodeId || '').trim();
  if (!nodeId) return null;
  const normalized = {
      nodeId: nodeId,
      taskId: String(summary.taskId || '').trim(),
      commandId: String(summary.commandId || 'generation.run').trim(),
      status: String(summary.status || '').trim(),
      resultKind: String(summary.resultKind || summary.kind || '').trim(),
    },
    media = normalizeTaskMedia(summary.media);
  if (media) normalized.media = media;
  return normalized;
}
function normalizeInputRef(inputRef = {}) {
  if (!inputRef || typeof inputRef !== 'object' || Array.isArray(inputRef)) return null;
  const nodeId = String(inputRef.nodeId || inputRef.id || '').trim();
  if (!nodeId) return null;
  const normalized = {
      nodeId: nodeId,
      type: String(inputRef.type || '').trim(),
      kind: String(inputRef.kind || '').trim(),
      name: truncateText(inputRef.name || '', MAX_MEDIA_NAME_CHARS),
      label: truncateText(inputRef.label || inputRef.name || '', MAX_MEDIA_NAME_CHARS),
      source: String(inputRef.source || '').trim(),
    },
    thumbUrl = normalizeTaskMediaText(inputRef.thumbUrl);
  if (thumbUrl) normalized.thumbUrl = thumbUrl;
  return normalized;
}
function normalizePendingClarification(clarification = {}) {
  if (!clarification || typeof clarification !== 'object' || Array.isArray(clarification))
    return null;
  const originalMessage = truncateText(
      clarification.originalMessage || '',
      MAX_PENDING_ORIGINAL_MESSAGE_CHARS,
    ),
    question = truncateText(
      clarification.question || clarification.reply || '',
      MAX_PENDING_QUESTION_CHARS,
    );
  if (!originalMessage || !question) return null;
  return {
    originalMessage: originalMessage,
    question: question,
    reply: truncateText(clarification.reply || question, MAX_PENDING_QUESTION_CHARS),
    options: (Array.isArray(clarification.options) ? clarification.options : [])
      .map((option) => ({
        id: String(option?.id || '').trim(),
        label: truncateText(option?.label || option?.id || '', MAX_TITLE_CHARS),
      }))
      .filter((option) => option.id && option.label)
      .slice(0, MAX_PENDING_OPTIONS),
    targetKind: String(clarification.targetKind || '').trim(),
    operation: String(clarification.operation || '')
      .trim()
      .slice(0, 40),
    skillId: String(clarification.skillId || '')
      .trim()
      .slice(0, 64),
    phase: String(clarification.phase || '')
      .trim()
      .slice(0, 60),
    inputRefs: (Array.isArray(clarification.inputRefs) ? clarification.inputRefs : [])
      .map(normalizeInputRef)
      .filter(Boolean)
      .slice(0, MAX_PENDING_INPUT_REFS),
  };
}
function normalizeFailureDiagnostic(diagnostic = {}) {
  if (!diagnostic || typeof diagnostic !== 'object' || Array.isArray(diagnostic)) return null;
  const phase = String(diagnostic.phase || '').trim(),
    summary = truncateText(diagnostic.summary || '', MAX_DIAGNOSTIC_TEXT_CHARS);
  if (!phase || !summary) return null;
  const normalized = {
      phase: phase,
      phaseLabel: truncateText(diagnostic.phaseLabel || phase, MAX_TITLE_CHARS),
      summary: summary,
      detail: truncateText(diagnostic.detail || '', MAX_DIAGNOSTIC_TEXT_CHARS),
      errorCode: String(diagnostic.errorCode || '')
        .trim()
        .slice(0, 80),
      step: Math.max(1, Math.trunc(Number(diagnostic.step || 1))),
      completedSteps: Math.max(0, Math.trunc(Number(diagnostic.completedSteps || 0))),
      retryable: diagnostic.retryable === true,
    },
    sourceErrorCode = String(diagnostic.sourceErrorCode || '')
      .trim()
      .slice(0, 80),
    commandId = String(diagnostic.commandId || '')
      .trim()
      .slice(0, 120);
  if (sourceErrorCode) normalized.sourceErrorCode = sourceErrorCode;
  if (commandId) normalized.commandId = commandId;
  return normalized;
}
function createDefaultId(timestamp) {
  return (
    'agent-conv-' +
    Number(timestamp || Date.now()).toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}
function normalizeMessage(message = {}, fallbackTs = Date.now()) {
  const role = String(message.role || 'assistant').trim() || 'assistant',
    content = truncateMessageContent(
      message.content || message.reply || message.message || message.question || '',
      MAX_MESSAGE_CONTENT_CHARS,
    ),
    status = String(message.status || '').trim(),
    ts = normalizeTimestamp(message.ts, fallbackTs);
  if (!content && !status) return null;
  const messageType = normalizeMessageType(message.messageType || message.type),
    normalized = { role: role, content: content, status: status, ts: ts },
    itemId = String(message.itemId || '').trim(),
    turnId = String(message.turnId || '').trim();
  if (itemId) normalized.itemId = itemId;
  if (turnId) normalized.turnId = turnId;
  if (role === 'user') {
    const inputRefs = (Array.isArray(message.inputRefs) ? message.inputRefs : [])
      .map(normalizeInputRef)
      .filter(Boolean)
      .slice(0, MAX_MESSAGE_INPUT_REFS);
    if (inputRefs.length > 0) normalized.inputRefs = inputRefs;
  }
  if (role === 'assistant') {
    const assistantContext = normalizeAgentAssistantContext(message.assistantContext);
    if (assistantContext) normalized.assistantContext = assistantContext;
    const replyVersions = normalizeAgentReplyVersions(message.replyVersions);
    if (replyVersions) normalized.replyVersions = replyVersions;
    const diagnostic = normalizeFailureDiagnostic(message.diagnostic);
    if (diagnostic) normalized.diagnostic = diagnostic;
  }
  if (messageType !== 'text') {
    normalized.messageType = messageType;
    const task = normalizeTaskSummary(message.task || message.taskBinding);
    if (task) normalized.task = task;
  }
  return normalized;
}
// 老数据没有 pendingClarification 字段：从「最后一条 need_clarification 且之后没有后续回复」推断。
function inferLegacyPendingClarification(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.role !== 'assistant' ||
      message?.status !== 'need_clarification' ||
      !message?.content
    )
      continue;
    const followedByReply = messages.slice(index + 1).some(
      (later) =>
        later?.role === 'assistant' &&
        ['success', 'chat', 'need_confirmation', 'cancelled', 'stopped'].includes(
          String(later?.status || ''),
        ),
    );
    if (followedByReply) return null;
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const userMessage = messages[cursor];
      if (userMessage?.role !== 'user' || !userMessage?.content) continue;
      return normalizePendingClarification({
        originalMessage: userMessage.content,
        question: message.content,
        reply: message.content,
      });
    }
    return null;
  }
  return null;
}
function createTitleFromMessage(message = {}) {
  if (String(message.role || '') !== 'user') return '';
  return truncateText(message.content, MAX_TITLE_CHARS);
}
function normalizeConversation(conversation = {}, fallbackTs = Date.now()) {
  const id = String(conversation.id || '').trim();
  if (!id) return null;
  const projectId = normalizeProjectId(conversation.projectId),
    createdAt = normalizeTimestamp(conversation.createdAt, fallbackTs),
    updatedAt = normalizeTimestamp(conversation.updatedAt, createdAt),
    messages = Array.isArray(conversation.messages)
      ? conversation.messages
          .map((message, index) =>
            normalizeMessage(
              {
                ...message,
                itemId: String(message?.itemId || '').trim() || id + ':message:' + (index + 1),
              },
              updatedAt,
            ),
          )
          .filter(Boolean)
      : [],
    runEvents = Array.isArray(conversation.runEvents)
      ? conversation.runEvents
          .map((runEvent) => normalizeAgentRunEvent(runEvent, updatedAt))
          .filter(Boolean)
          .slice(-MAX_RUN_EVENTS)
      : [],
    operationLedger = normalizeAgentOperationLedger(conversation.operationLedger, updatedAt),
    taskBindings = normalizeAgentTaskBindings(conversation.taskBindings),
    sessionEvents = Array.isArray(conversation.sessionEvents)
      ? conversation.sessionEvents
          .map((sessionEvent, index) =>
            normalizeAgentSessionEvent(sessionEvent, {
              fallbackTs: updatedAt,
              fallbackSeq: index + 1,
            }),
          )
          .filter(Boolean)
      : [],
    // 老数据只有 messages/runEvents：就地补一份等价事件流，不必等一次写盘。
    effectiveSessionEvents =
      sessionEvents.length > 0
        ? sessionEvents
        : createAgentSessionEventsFromLegacyState({
            conversationId: id,
            projectId: projectId,
            messages: messages,
            runEvents: runEvents,
            operationLedger: operationLedger,
            taskBindings: taskBindings,
          }),
    hasPendingClarificationField = Object.prototype.hasOwnProperty.call(
      conversation,
      'pendingClarification',
    );
  return {
    id: id,
    projectId: projectId,
    title:
      truncateText(conversation.title || DEFAULT_CONVERSATION_TITLE, MAX_TITLE_CHARS) ||
      DEFAULT_CONVERSATION_TITLE,
    createdAt: createdAt,
    updatedAt: updatedAt,
    messages: messages,
    runEvents: runEvents,
    operationLedger: operationLedger,
    taskBindings: taskBindings,
    sessionEvents: effectiveSessionEvents,
    resumeCheckpoint: normalizeAgentResumeCheckpoint(conversation.resumeCheckpoint),
    assistantTextTask: normalizeAgentOfficialTextTask(conversation.assistantTextTask),
    pendingClarification: hasPendingClarificationField
      ? normalizePendingClarification(conversation.pendingClarification)
      : inferLegacyPendingClarification(messages),
    contextDigest: normalizeAgentContextDigest(conversation.contextDigest),
    lastPlanSummary: truncateText(conversation.lastPlanSummary || '', MAX_SUMMARY_CHARS),
    lastCanvasSnapshotDigest:
      conversation.lastCanvasSnapshotDigest &&
      typeof conversation.lastCanvasSnapshotDigest === 'object'
        ? cloneJson(conversation.lastCanvasSnapshotDigest) || null
        : null,
    hasUnfinishedOperation: normalizeBoolean(conversation.hasUnfinishedOperation),
    archived: normalizeBoolean(conversation.archived),
  };
}
function normalizeStorageState(state = {}, fallbackTs = Date.now()) {
  const activeByProjectId =
      state.activeByProjectId && typeof state.activeByProjectId === 'object'
        ? Object.fromEntries(
            Object.entries(state.activeByProjectId)
              .map(([projectId, conversationId]) => [
                normalizeProjectId(projectId),
                String(conversationId || '').trim(),
              ])
              .filter(([, conversationId]) => conversationId),
          )
        : {},
    conversations = Array.isArray(state.conversations)
      ? state.conversations
          .map((conversation) => normalizeConversation(conversation, fallbackTs))
          .filter(Boolean)
      : [];
  return {
    schemaVersion: AGENT_CONVERSATION_SCHEMA_VERSION,
    activeByProjectId: activeByProjectId,
    conversations: conversations,
  };
}
function getNextSessionEventSequence(sessionEvents = []) {
  return (
    (Array.isArray(sessionEvents) ? sessionEvents : []).reduce(
      (maxSeq, sessionEvent) => Math.max(maxSeq, Number(sessionEvent?.seq || 0)),
      0,
    ) + 1
  );
}
function appendSessionEventSnapshot(conversation, createEvent, extra = {}, ts = Date.now()) {
  const sessionEvents = Array.isArray(conversation?.sessionEvents)
      ? conversation.sessionEvents
      : [],
    seq = getNextSessionEventSequence(sessionEvents),
    sessionEvent = createEvent({
      id: conversation.id + ':event:' + seq,
      seq: seq,
      conversationId: conversation.id,
      projectId: conversation.projectId,
      ...extra,
    });
  if (!sessionEvent) return sessionEvents;
  return [...sessionEvents, { ...sessionEvent, ts: sessionEvent.ts || ts }];
}
/**
 * updateConversation 未显式传 sessionEvents 时，逐字段对比找出真正变化的
 * 消息 / 操作 / 任务绑定，为每处变化补一条事件——事件流因此不会漏记增量更新。
 */
function appendChangedDurableStateEvents(previous, next, patch = {}, ts = Date.now()) {
  let sessionEvents = Array.isArray(previous.sessionEvents) ? previous.sessionEvents : [];
  const appendEvent = (createEvent, extra) => {
    sessionEvents = appendSessionEventSnapshot(
      { ...previous, sessionEvents: sessionEvents },
      createEvent,
      extra,
      ts,
    );
  };
  if (Array.isArray(patch.messages)) {
    const previousMessages = new Map(
      previous.messages.map((message) => [message.itemId, message]),
    );
    for (const message of next.messages) {
      if (JSON.stringify(previousMessages.get(message.itemId)) === JSON.stringify(message)) continue;
      appendEvent(createAgentMessageSessionEvent, {
        itemId: message.itemId,
        turnId: message.turnId,
        message: message,
        previousMessage: previousMessages.get(message.itemId),
      });
    }
  }
  if (Array.isArray(patch.operationLedger)) {
    const previousOperations = new Map(
      (previous.operationLedger || []).map((operation) => [operation.id, operation]),
    );
    for (const operation of next.operationLedger || []) {
      if (JSON.stringify(previousOperations.get(operation.id) || null) === JSON.stringify(operation))
        continue;
      appendEvent(createAgentOperationSessionEvent, { operation: operation });
    }
  }
  if (Array.isArray(patch.taskBindings)) {
    const previousBindings = new Map(
      (previous.taskBindings || []).map((binding) => [binding.id, binding]),
    );
    for (const binding of next.taskBindings || []) {
      if (JSON.stringify(previousBindings.get(binding.id) || null) === JSON.stringify(binding))
        continue;
      appendEvent(createAgentTaskSessionEvent, { taskBinding: binding });
    }
  }
  return sessionEvents;
}
function sortConversations(conversations = []) {
  return [...conversations].sort(
    (previous, next) => Number(next.updatedAt || 0) - Number(previous.updatedAt || 0),
  );
}
function hasMessages(conversation = {}) {
  return Array.isArray(conversation.messages) && conversation.messages.length > 0;
}
function findLatestConversationWithMessages(conversations = []) {
  return conversations.find((conversation) => hasMessages(conversation)) || null;
}
export function createAgentConversationStore({
  persistence: persistence = null,
  windowObject: windowObject = undefined,
  getProjectId: getProjectId = () => DEFAULT_PROJECT_ID,
  now: now = () => Date.now(),
  idFactory: idFactory = undefined,
} = {}) {
  const resolvedWindow = getWindowObject(windowObject);
  // 写盘失败时把整份状态留在内存里，等 retryPersistence 再试，避免用户丢内容。
  let pendingState = null,
    persistenceError = '';
  function resolveProjectId() {
    try {
      return normalizeProjectId(getProjectId?.());
    } catch {
      return DEFAULT_PROJECT_ID;
    }
  }
  function createConversationId(timestamp) {
    if (typeof idFactory === 'function') {
      const providedId = String(idFactory({ now: timestamp, projectId: resolveProjectId() }) || '').trim();
      if (providedId) return providedId;
    }
    return createDefaultId(timestamp);
  }
  function readState() {
    if (persistence) return normalizeStorageState(persistence.read() || {}, now());
    if (pendingState) return normalizeStorageState(pendingState, now());
    try {
      const rawState = resolvedWindow?.localStorage?.getItem?.(AGENT_CONVERSATION_STORAGE_KEY);
      if (!rawState) return normalizeStorageState({}, now());
      return normalizeStorageState(JSON.parse(rawState), now());
    } catch {
      return normalizeStorageState({}, now());
    }
  }
  function writeState(nextState, { required: required = false } = {}) {
    const normalizedState = normalizeStorageState(nextState, now());
    if (persistence) return (persistence.write(normalizedState), normalizedState);
    try {
      if (!resolvedWindow?.localStorage?.setItem) throw new Error('Storage unavailable');
      (resolvedWindow.localStorage.setItem(
        AGENT_CONVERSATION_STORAGE_KEY,
        JSON.stringify(normalizedState),
      ),
        (pendingState = null),
        (persistenceError = ''));
    } catch {
      // 关键写入（如回复版本）宁可报错，也不静默丢数据。
      if (required) throw new Error(STORAGE_REQUIRED_MESSAGE);
      ((pendingState = normalizedState), (persistenceError = STORAGE_UNAVAILABLE_MESSAGE));
    }
    return normalizedState;
  }
  function createConversationRecord(options = {}) {
    const createdAt = normalizeTimestamp(options.createdAt || options.updatedAt, now());
    return normalizeConversation(
      {
        id: options.id || createConversationId(createdAt),
        projectId: options.projectId || resolveProjectId(),
        title: options.title || DEFAULT_CONVERSATION_TITLE,
        createdAt: createdAt,
        updatedAt: createdAt,
        messages: options.messages || [],
        runEvents: options.runEvents || [],
        operationLedger: options.operationLedger || [],
        taskBindings: options.taskBindings || [],
        sessionEvents: options.sessionEvents || [],
        resumeCheckpoint: options.resumeCheckpoint || null,
        pendingClarification: options.pendingClarification || null,
        contextDigest: options.contextDigest || null,
        lastPlanSummary: options.lastPlanSummary || '',
        lastCanvasSnapshotDigest: options.lastCanvasSnapshotDigest || null,
        hasUnfinishedOperation: options.hasUnfinishedOperation === true,
        archived: options.archived === true,
      },
      createdAt,
    );
  }
  function listProjectConversations(state = readState()) {
    const projectId = resolveProjectId();
    return sortConversations(
      state.conversations.filter(
        (conversation) => conversation.projectId === projectId && conversation.archived !== true,
      ),
    );
  }
  function findConversation(state, conversationId) {
    const normalizedId = String(conversationId || '').trim();
    return state.conversations.find((conversation) => conversation.id === normalizedId) || null;
  }
  function ensureActiveConversation({ preferLatestWithMessages: preferLatestWithMessages = false } = {}) {
    const state = readState(),
      projectId = resolveProjectId(),
      activeId = state.activeByProjectId[projectId] || '',
      activeConversation = activeId ? findConversation(state, activeId) : null,
      projectConversations = listProjectConversations(state),
      latestWithMessages = findLatestConversationWithMessages(projectConversations);
    if (
      activeConversation &&
      activeConversation.projectId === projectId &&
      activeConversation.archived !== true
    ) {
      // 当前会话是空的、但别处有带内容的会话：切过去，避免用户打开就看不见历史。
      if (
        preferLatestWithMessages &&
        !hasMessages(activeConversation) &&
        latestWithMessages &&
        latestWithMessages.id !== activeConversation.id
      )
        return (
          (state.activeByProjectId[projectId] = latestWithMessages.id),
          writeState(state),
          cloneJson(latestWithMessages)
        );
      return cloneJson(activeConversation);
    }
    const fallbackConversation = latestWithMessages || projectConversations[0] || null;
    if (fallbackConversation)
      return (
        (state.activeByProjectId[projectId] = fallbackConversation.id),
        writeState(state),
        cloneJson(fallbackConversation)
      );
    const createdConversation = createConversationRecord({ projectId: projectId });
    return (
      state.conversations.push(createdConversation),
      (state.activeByProjectId[projectId] = createdConversation.id),
      writeState(state),
      cloneJson(createdConversation)
    );
  }
  function listConversations() {
    return listProjectConversations().map((conversation) => cloneJson(conversation));
  }
  function getConversation(conversationId) {
    const conversation = findConversation(readState(), conversationId);
    return conversation ? cloneJson(conversation) : null;
  }
  function createConversation(options = {}) {
    const state = readState(),
      createdConversation = createConversationRecord(options);
    return (
      state.conversations.push(createdConversation),
      (state.activeByProjectId[createdConversation.projectId] = createdConversation.id),
      writeState(state),
      cloneJson(createdConversation)
    );
  }
  function updateConversation(conversationId, patch = {}, { required: required = false } = {}) {
    const state = readState(),
      normalizedId = String(conversationId || '').trim(),
      existingIndex = state.conversations.findIndex(
        (conversation) => conversation.id === normalizedId,
      );
    if (existingIndex < 0) return null;
    const previousConversation = state.conversations[existingIndex],
      updatedAt = normalizeTimestamp(patch.updatedAt, now()),
      updatedConversation = normalizeConversation(
        {
          ...previousConversation,
          ...patch,
          id: previousConversation.id,
          projectId: previousConversation.projectId,
          createdAt: previousConversation.createdAt,
          updatedAt: updatedAt,
          messages: Array.isArray(patch.messages) ? patch.messages : previousConversation.messages,
          runEvents: Array.isArray(patch.runEvents) ? patch.runEvents : previousConversation.runEvents,
          operationLedger: Array.isArray(patch.operationLedger)
            ? patch.operationLedger
            : previousConversation.operationLedger,
          taskBindings: Array.isArray(patch.taskBindings)
            ? patch.taskBindings
            : previousConversation.taskBindings,
          sessionEvents: Array.isArray(patch.sessionEvents)
            ? patch.sessionEvents
            : previousConversation.sessionEvents,
        },
        updatedAt,
      );
    // 调用方没直接给事件流时，按字段差异自动补事件。
    !Array.isArray(patch.sessionEvents) &&
      (updatedConversation.sessionEvents = appendChangedDurableStateEvents(
        previousConversation,
        updatedConversation,
        patch,
        updatedAt,
      ));
    (state.conversations[existingIndex] = updatedConversation),
      writeState(state, {
        required:
          required ||
          // 回复版本一旦丢失就无法再生成，必须写成功。
          (Array.isArray(patch.messages) &&
            patch.messages.some((message) => message.replyVersions)),
      });
    return cloneJson(updatedConversation);
  }
  function appendMessage(conversationId, message = {}) {
    const state = readState(),
      normalizedId = String(conversationId || '').trim(),
      existingIndex = state.conversations.findIndex(
        (conversation) => conversation.id === normalizedId,
      );
    if (existingIndex < 0) return null;
    const previousConversation = state.conversations[existingIndex],
      ts = normalizeTimestamp(message.ts, now()),
      normalizedMessage = normalizeMessage(
        {
          ...message,
          itemId:
            String(message.itemId || '').trim() ||
            normalizedId + ':message:' + (previousConversation.messages.length + 1),
        },
        ts,
      );
    if (!normalizedMessage) return cloneJson(state.conversations[existingIndex]);
    const nextMessages = [...previousConversation.messages, normalizedMessage],
      generatedTitle =
        previousConversation.title === DEFAULT_CONVERSATION_TITLE
          ? createTitleFromMessage(normalizedMessage)
          : '',
      updatedConversation = normalizeConversation(
        {
          ...previousConversation,
          title: generatedTitle || previousConversation.title,
          updatedAt: ts,
          messages: nextMessages,
          sessionEvents: appendSessionEventSnapshot(
            previousConversation,
            createAgentMessageSessionEvent,
            {
              turnId: String(message.turnId || '').trim(),
              itemId:
                String(message.itemId || '').trim() ||
                normalizedId + ':message:' + nextMessages.length,
              message: normalizedMessage,
            },
            ts,
          ),
        },
        ts,
      );
    return (
      (state.conversations[existingIndex] = updatedConversation),
      writeState(state),
      cloneJson(updatedConversation)
    );
  }
  function appendRunEvent(conversationId, runEvent = {}) {
    const state = readState(),
      normalizedId = String(conversationId || '').trim(),
      existingIndex = state.conversations.findIndex(
        (conversation) => conversation.id === normalizedId,
      );
    if (existingIndex < 0) return null;
    const ts = normalizeTimestamp(runEvent.ts, now()),
      normalizedEvent = normalizeAgentRunEvent(runEvent, ts);
    if (!normalizedEvent) return cloneJson(state.conversations[existingIndex]);
    const previousConversation = state.conversations[existingIndex],
      updatedConversation = normalizeConversation(
        {
          ...previousConversation,
          updatedAt: ts,
          runEvents: [...(previousConversation.runEvents || []), normalizedEvent].slice(
            -MAX_RUN_EVENTS,
          ),
          sessionEvents: appendSessionEventSnapshot(
            previousConversation,
            createAgentRunSessionEvent,
            { runEvent: normalizedEvent },
            ts,
          ),
        },
        ts,
      );
    return (
      (state.conversations[existingIndex] = updatedConversation),
      writeState(state),
      cloneJson(updatedConversation)
    );
  }
  function deleteConversation(conversationId) {
    const state = readState(),
      normalizedId = String(conversationId || '').trim();
    if (!normalizedId) return ensureActiveConversation();
    state.conversations = state.conversations.filter(
      (conversation) => conversation.id !== normalizedId,
    );
    for (const [projectId, activeId] of Object.entries(state.activeByProjectId)) {
      if (activeId === normalizedId) delete state.activeByProjectId[projectId];
    }
    return (writeState(state), ensureActiveConversation());
  }
  function setActiveConversationId(conversationId) {
    const state = readState(),
      projectId = resolveProjectId(),
      conversation = findConversation(state, conversationId);
    if (!conversation || conversation.projectId !== projectId || conversation.archived === true)
      return null;
    return (
      (state.activeByProjectId[projectId] = conversation.id),
      writeState(state),
      cloneJson(conversation)
    );
  }
  function getActiveConversationId() {
    return ensureActiveConversation()?.id || '';
  }
  return {
    getPersistenceError: () => persistenceError,
    retryPersistence() {
      if (pendingState) writeState(pendingState);
      return !pendingState;
    },
    listConversations: listConversations,
    getConversation: getConversation,
    createConversation: createConversation,
    updateConversation: updateConversation,
    flushPersistence: () => persistence?.flush?.(),
    appendMessage: appendMessage,
    appendRunEvent: appendRunEvent,
    deleteConversation: deleteConversation,
    setActiveConversationId: setActiveConversationId,
    getActiveConversationId: getActiveConversationId,
    ensureActiveConversation: ensureActiveConversation,
  };
}
