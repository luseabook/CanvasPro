export const AGENT_CONVERSATION_STORAGE_KEY = 'aiCanvas.agentConversations.v1';
const AGENT_CONVERSATION_SCHEMA_VERSION = 1,
  DEFAULT_PROJECT_ID = 'default_v2_project',
  DEFAULT_CONVERSATION_TITLE = '新对话',
  MAX_MESSAGE_CONTENT_CHARS = 0x1f40,
  MAX_TITLE_CHARS = 40,
  MAX_SUMMARY_CHARS = 240;
function getWindowObject(value) {
  if (value) return value;
  if (typeof window !== 'undefined') return window;
  return null;
}
function normalizeProjectId(item) {
  return String(item || '').trim() || DEFAULT_PROJECT_ID;
}
function normalizeTimestamp(key, index) {
  const count = Number(key);
  return Number.isFinite(count) && count > 0 ? count : index;
}
function normalizeBoolean(result) {
  return result === true;
}
function stripText(data) {
  return String(data || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(options, target) {
  const list = stripText(options);
  if (list.length <= target) return list;
  return list.slice(0, Math.max(0, target - 3)) + '...';
}
function cloneJson(source) {
  try {
    return JSON.parse(JSON.stringify(source));
  } catch {
    return null;
  }
}
function createDefaultId(next) {
  return (
    'agent-conv-' + Number(next || Date.now()).toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  );
}
function normalizeMessage(error = {}, current = Date.now()) {
  const role = String(error.role || 'assistant').trim() || 'assistant',
    content = truncateText(
      error.content || error.reply || error.message || error.question || '',
      MAX_MESSAGE_CONTENT_CHARS,
    ),
    status = String(error.status || '').trim(),
    ts = normalizeTimestamp(error.ts, current);
  if (!content && !status) return null;
  return { role: role, content: content, status: status, ts: ts };
}
function createTitleFromMessage(options2 = {}) {
  if (String(options2.role || '') !== 'user') return '';
  return truncateText(options2.content, MAX_TITLE_CHARS);
}
function normalizeConversation(lastCanvasSnapshotDigest = {}, entry = Date.now()) {
  const id = String(lastCanvasSnapshotDigest.id || '').trim();
  if (!id) return null;
  const projectId = normalizeProjectId(lastCanvasSnapshotDigest.projectId),
    createdAt = normalizeTimestamp(lastCanvasSnapshotDigest.createdAt, entry),
    updatedAt = normalizeTimestamp(lastCanvasSnapshotDigest.updatedAt, createdAt),
    messages = Array.isArray(lastCanvasSnapshotDigest.messages)
      ? lastCanvasSnapshotDigest.messages.map((item2) => normalizeMessage(item2, updatedAt)).filter(Boolean)
      : [];
  return {
    id: id,
    projectId: projectId,
    title:
      truncateText(lastCanvasSnapshotDigest.title || DEFAULT_CONVERSATION_TITLE, MAX_TITLE_CHARS) ||
      DEFAULT_CONVERSATION_TITLE,
    createdAt: createdAt,
    updatedAt: updatedAt,
    messages: messages,
    lastPlanSummary: truncateText(lastCanvasSnapshotDigest.lastPlanSummary || '', MAX_SUMMARY_CHARS),
    lastCanvasSnapshotDigest:
      lastCanvasSnapshotDigest.lastCanvasSnapshotDigest &&
      typeof lastCanvasSnapshotDigest.lastCanvasSnapshotDigest === 'object'
        ? cloneJson(lastCanvasSnapshotDigest.lastCanvasSnapshotDigest) || null
        : null,
    hasUnfinishedOperation: normalizeBoolean(lastCanvasSnapshotDigest.hasUnfinishedOperation),
    archived: normalizeBoolean(lastCanvasSnapshotDigest.archived),
  };
}
function normalizeStorageState(options3 = {}, record = Date.now()) {
  const activeByProjectId =
      options3.activeByProjectId && typeof options3.activeByProjectId === 'object'
        ? Object.fromEntries(
            Object.entries(options3.activeByProjectId)
              .map(([payload, handle]) => [normalizeProjectId(payload), String(handle || '').trim()])
              .filter(([, state]) => state),
          )
        : {},
    conversations = Array.isArray(options3.conversations)
      ? options3.conversations.map((item3) => normalizeConversation(item3, record)).filter(Boolean)
      : [];
  return {
    schemaVersion: AGENT_CONVERSATION_SCHEMA_VERSION,
    activeByProjectId: activeByProjectId,
    conversations: conversations,
  };
}
function sortConversations(args = []) {
  return [...args].sort((item4, config) => Number(config.updatedAt || 0) - Number(item4.updatedAt || 0));
}
export function createAgentConversationStore({
  windowObject: windowObject = undefined,
  getProjectId: getProjectId = () => DEFAULT_PROJECT_ID,
  now: now = () => Date.now(),
  idFactory: idFactory = undefined,
} = {}) {
  const windowObject2 = getWindowObject(windowObject);
  function projectId2() {
    try {
      return normalizeProjectId(getProjectId?.());
    } catch {
      return DEFAULT_PROJECT_ID;
    }
  }
  function run(now2) {
    if (typeof idFactory === 'function') {
      const scope = String(idFactory({ now: now2, projectId: projectId2() }) || '').trim();
      if (scope) return scope;
    }
    return createDefaultId(now2);
  }
  function run2() {
    try {
      const enabled = windowObject2?.localStorage?.getItem?.(AGENT_CONVERSATION_STORAGE_KEY);
      if (!enabled) return normalizeStorageState({}, now());
      return normalizeStorageState(JSON.parse(enabled), now());
    } catch {
      return normalizeStorageState({}, now());
    }
  }
  function run3(input) {
    const storageState = normalizeStorageState(input, now());
    try {
      windowObject2?.localStorage?.setItem?.(AGENT_CONVERSATION_STORAGE_KEY, JSON.stringify(storageState));
    } catch {}
    return storageState;
  }
  function run4(id2 = {}) {
    const createdAt2 = normalizeTimestamp(id2.createdAt || id2.updatedAt, now());
    return normalizeConversation(
      {
        id: id2.id || run(createdAt2),
        projectId: id2.projectId || projectId2(),
        title: id2.title || DEFAULT_CONVERSATION_TITLE,
        createdAt: createdAt2,
        updatedAt: createdAt2,
        messages: id2.messages || [],
        lastPlanSummary: id2.lastPlanSummary || '',
        lastCanvasSnapshotDigest: id2.lastCanvasSnapshotDigest || null,
        hasUnfinishedOperation: id2.hasUnfinishedOperation === true,
        archived: id2.archived === true,
      },
      createdAt2,
    );
  }
  function run5(output = run2()) {
    const value2 = projectId2();
    return sortConversations(
      output.conversations.filter((item5) => item5.projectId === value2 && item5.archived !== true),
    );
  }
  function run6(value3, value4) {
    const value5 = String(value4 || '').trim();
    return value3.conversations.find((item6) => item6.id === value5) || null;
  }
  function ensureActiveConversation() {
    const value6 = run2(),
      projectId3 = projectId2(),
      value7 = value6.activeByProjectId[projectId3] || '',
      value8 = value7 ? run6(value6, value7) : null;
    if (value8 && value8.projectId === projectId3 && value8.archived !== true) return cloneJson(value8);
    const value9 = run5(value6)[0] || null;
    if (value9) return ((value6.activeByProjectId[projectId3] = value9.id), run3(value6), cloneJson(value9));
    const value10 = run4({ projectId: projectId3 });
    return (
      value6.conversations.push(value10),
      (value6.activeByProjectId[projectId3] = value10.id),
      run3(value6),
      cloneJson(value10)
    );
  }
  function listConversations() {
    return run5().map((item7) => cloneJson(item7));
  }
  function getConversation(value11) {
    const value12 = run2(),
      value13 = run6(value12, value11);
    return value13 ? cloneJson(value13) : null;
  }
  function createConversation(options4 = {}) {
    const value14 = run2(),
      value15 = run4(options4);
    return (
      value14.conversations.push(value15),
      (value14.activeByProjectId[value15.projectId] = value15.id),
      run3(value14),
      cloneJson(value15)
    );
  }
  function updateConversation(value16, args2 = {}) {
    const value17 = run2(),
      value18 = String(value16 || '').trim(),
      count2 = value17.conversations.findIndex((item8) => item8.id === value18);
    if (count2 < 0) return null;
    const id3 = value17.conversations[count2],
      updatedAt2 = normalizeTimestamp(args2.updatedAt, now()),
      conversation = normalizeConversation(
        {
          ...id3,
          ...args2,
          id: id3.id,
          projectId: id3.projectId,
          createdAt: id3.createdAt,
          updatedAt: updatedAt2,
          messages: Array.isArray(args2.messages) ? args2.messages : id3.messages,
        },
        updatedAt2,
      );
    return ((value17.conversations[count2] = conversation), run3(value17), cloneJson(conversation));
  }
  function appendMessage(value19, value20 = {}) {
    const value21 = run2(),
      value22 = String(value19 || '').trim(),
      count3 = value21.conversations.findIndex((item9) => item9.id === value22);
    if (count3 < 0) return null;
    const updatedAt3 = normalizeTimestamp(value20.ts, now()),
      message = normalizeMessage(value20, updatedAt3);
    if (!message) return cloneJson(value21.conversations[count3]);
    const args3 = value21.conversations[count3],
      messages2 = [...args3.messages, message],
      title = args3.title === DEFAULT_CONVERSATION_TITLE ? createTitleFromMessage(message) : '',
      conversation2 = normalizeConversation(
        { ...args3, title: title || args3.title, updatedAt: updatedAt3, messages: messages2 },
        updatedAt3,
      );
    return ((value21.conversations[count3] = conversation2), run3(value21), cloneJson(conversation2));
  }
  function deleteConversation(value23) {
    const value24 = run2(),
      enabled2 = String(value23 || '').trim();
    if (!enabled2) return ensureActiveConversation();
    value24.conversations = value24.conversations.filter((item10) => item10.id !== enabled2);
    for (const [value25, value26] of Object.entries(value24.activeByProjectId)) {
      if (value26 === enabled2) delete value24.activeByProjectId[value25];
    }
    return (run3(value24), ensureActiveConversation());
  }
  function setActiveConversationId(value27) {
    const value28 = run2(),
      value29 = projectId2(),
      enabled3 = run6(value28, value27);
    if (!enabled3 || enabled3.projectId !== value29 || enabled3.archived === true) return null;
    return ((value28.activeByProjectId[value29] = enabled3.id), run3(value28), cloneJson(enabled3));
  }
  function getActiveConversationId() {
    return ensureActiveConversation()?.id || '';
  }
  return {
    listConversations: listConversations,
    getConversation: getConversation,
    createConversation: createConversation,
    updateConversation: updateConversation,
    appendMessage: appendMessage,
    deleteConversation: deleteConversation,
    setActiveConversationId: setActiveConversationId,
    getActiveConversationId: getActiveConversationId,
    ensureActiveConversation: ensureActiveConversation,
  };
}
