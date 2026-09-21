export const AGENT_CONVERSATION_STORAGE_KEY = 'aiCanvas.agentConversations.v1';
const AGENT_CONVERSATION_SCHEMA_VERSION = 1,
  DEFAULT_PROJECT_ID = 'default_v2_project',
  DEFAULT_CONVERSATION_TITLE = '新对话',
  MAX_MESSAGE_CONTENT_CHARS = 0x1f40,
  MAX_TITLE_CHARS = 40,
  MAX_SUMMARY_CHARS = 240;
function getWindowObject(_0xc1aa87) {
  if (_0xc1aa87) return _0xc1aa87;
  if (typeof window !== 'undefined') return window;
  return null;
}
function normalizeProjectId(_0x433aee) {
  return String(_0x433aee || '').trim() || DEFAULT_PROJECT_ID;
}
function normalizeTimestamp(_0x3d6051, _0xbb2f22) {
  const _0x33a43c = Number(_0x3d6051);
  return Number.isFinite(_0x33a43c) && _0x33a43c > 0 ? _0x33a43c : _0xbb2f22;
}
function normalizeBoolean(_0x12b17f) {
  return _0x12b17f === true;
}
function stripText(_0x3d19af) {
  return String(_0x3d19af || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(_0xf9ec6d, _0x47c7e8) {
  const _0x5bcc12 = stripText(_0xf9ec6d);
  if (_0x5bcc12.length <= _0x47c7e8) return _0x5bcc12;
  return _0x5bcc12.slice(0, Math.max(0, _0x47c7e8 - 3)) + '...';
}
function cloneJson(_0x2773b9) {
  try {
    return JSON.parse(JSON.stringify(_0x2773b9));
  } catch {
    return null;
  }
}
function createDefaultId(_0xeb77af) {
  return (
    'agent-conv-' +
    Number(_0xeb77af || Date.now()).toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}
function normalizeMessage(_0x16acf8 = {}, _0x5d1b6e = Date.now()) {
  const _0x5dc4ab = String(_0x16acf8.role || 'assistant').trim() || 'assistant',
    _0x3b309a = truncateText(
      _0x16acf8.content || _0x16acf8.reply || _0x16acf8.message || _0x16acf8.question || '',
      MAX_MESSAGE_CONTENT_CHARS,
    ),
    _0x2183d6 = String(_0x16acf8.status || '').trim(),
    _0x1dbe82 = normalizeTimestamp(_0x16acf8.ts, _0x5d1b6e);
  if (!_0x3b309a && !_0x2183d6) return null;
  return { role: _0x5dc4ab, content: _0x3b309a, status: _0x2183d6, ts: _0x1dbe82 };
}
function createTitleFromMessage(_0x32910e = {}) {
  if (String(_0x32910e.role || '') !== 'user') return '';
  return truncateText(_0x32910e.content, MAX_TITLE_CHARS);
}
function normalizeConversation(_0x357bf5 = {}, _0xbf5a94 = Date.now()) {
  const _0x4713d8 = String(_0x357bf5.id || '').trim();
  if (!_0x4713d8) return null;
  const _0x2f4349 = normalizeProjectId(_0x357bf5.projectId),
    _0x19218b = normalizeTimestamp(_0x357bf5.createdAt, _0xbf5a94),
    _0x1a4f1b = normalizeTimestamp(_0x357bf5.updatedAt, _0x19218b),
    _0x1500bc = Array.isArray(_0x357bf5.messages)
      ? _0x357bf5.messages.map((_0x22c9a9) => normalizeMessage(_0x22c9a9, _0x1a4f1b)).filter(Boolean)
      : [];
  return {
    id: _0x4713d8,
    projectId: _0x2f4349,
    title:
      truncateText(_0x357bf5.title || DEFAULT_CONVERSATION_TITLE, MAX_TITLE_CHARS) ||
      DEFAULT_CONVERSATION_TITLE,
    createdAt: _0x19218b,
    updatedAt: _0x1a4f1b,
    messages: _0x1500bc,
    lastPlanSummary: truncateText(_0x357bf5.lastPlanSummary || '', MAX_SUMMARY_CHARS),
    lastCanvasSnapshotDigest:
      _0x357bf5.lastCanvasSnapshotDigest && typeof _0x357bf5.lastCanvasSnapshotDigest === 'object'
        ? cloneJson(_0x357bf5.lastCanvasSnapshotDigest) || null
        : null,
    hasUnfinishedOperation: normalizeBoolean(_0x357bf5.hasUnfinishedOperation),
    archived: normalizeBoolean(_0x357bf5.archived),
  };
}
function normalizeStorageState(_0x415905 = {}, _0x4b45ed = Date.now()) {
  const _0x2bff46 =
      _0x415905.activeByProjectId && typeof _0x415905.activeByProjectId === 'object'
        ? Object.fromEntries(
            Object.entries(_0x415905.activeByProjectId)
              .map(([_0x4f18ac, _0x4dfabd]) => [
                normalizeProjectId(_0x4f18ac),
                String(_0x4dfabd || '').trim(),
              ])
              .filter(([, _0x14a1a8]) => _0x14a1a8),
          )
        : {},
    _0x48f591 = Array.isArray(_0x415905.conversations)
      ? _0x415905.conversations
          .map((_0x244022) => normalizeConversation(_0x244022, _0x4b45ed))
          .filter(Boolean)
      : [];
  return {
    schemaVersion: AGENT_CONVERSATION_SCHEMA_VERSION,
    activeByProjectId: _0x2bff46,
    conversations: _0x48f591,
  };
}
function sortConversations(_0x434a89 = []) {
  return [..._0x434a89].sort(
    (_0x2c8e83, _0x29ad46) => Number(_0x29ad46.updatedAt || 0) - Number(_0x2c8e83.updatedAt || 0),
  );
}
export function createAgentConversationStore({
  windowObject: windowObject = undefined,
  getProjectId: getProjectId = () => DEFAULT_PROJECT_ID,
  now: now = () => Date.now(),
  idFactory: idFactory = undefined,
} = {}) {
  const _0x1400cd = getWindowObject(windowObject);
  function _0x3f24cc() {
    try {
      return normalizeProjectId(getProjectId?.());
    } catch {
      return DEFAULT_PROJECT_ID;
    }
  }
  function _0x35aec4(_0x42c42d) {
    if (typeof idFactory === 'function') {
      const _0x33602f = String(idFactory({ now: _0x42c42d, projectId: _0x3f24cc() }) || '').trim();
      if (_0x33602f) return _0x33602f;
    }
    return createDefaultId(_0x42c42d);
  }
  function _0x2742b5() {
    try {
      const _0x4da183 = _0x1400cd?.localStorage?.getItem?.(AGENT_CONVERSATION_STORAGE_KEY);
      if (!_0x4da183) return normalizeStorageState({}, now());
      return normalizeStorageState(JSON.parse(_0x4da183), now());
    } catch {
      return normalizeStorageState({}, now());
    }
  }
  function _0x1c2333(_0x1dd1ce) {
    const _0x62ca1f = normalizeStorageState(_0x1dd1ce, now());
    try {
      _0x1400cd?.localStorage?.setItem?.(AGENT_CONVERSATION_STORAGE_KEY, JSON.stringify(_0x62ca1f));
    } catch {}
    return _0x62ca1f;
  }
  function _0xb5a895(_0x5ce886 = {}) {
    const _0x1e9c4f = normalizeTimestamp(_0x5ce886.createdAt || _0x5ce886.updatedAt, now());
    return normalizeConversation(
      {
        id: _0x5ce886.id || _0x35aec4(_0x1e9c4f),
        projectId: _0x5ce886.projectId || _0x3f24cc(),
        title: _0x5ce886.title || DEFAULT_CONVERSATION_TITLE,
        createdAt: _0x1e9c4f,
        updatedAt: _0x1e9c4f,
        messages: _0x5ce886.messages || [],
        lastPlanSummary: _0x5ce886.lastPlanSummary || '',
        lastCanvasSnapshotDigest: _0x5ce886.lastCanvasSnapshotDigest || null,
        hasUnfinishedOperation: _0x5ce886.hasUnfinishedOperation === true,
        archived: _0x5ce886.archived === true,
      },
      _0x1e9c4f,
    );
  }
  function _0x2ed8a3(_0x253eb5 = _0x2742b5()) {
    const _0x1eb37c = _0x3f24cc();
    return sortConversations(
      _0x253eb5.conversations.filter(
        (_0x40d819) => _0x40d819.projectId === _0x1eb37c && _0x40d819.archived !== true,
      ),
    );
  }
  function _0x2926cb(_0x224cee, _0x150a17) {
    const _0x8eeaf9 = String(_0x150a17 || '').trim();
    return _0x224cee.conversations.find((_0x11f281) => _0x11f281.id === _0x8eeaf9) || null;
  }
  function _0x14cf27() {
    const _0x24badb = _0x2742b5(),
      _0x2a214c = _0x3f24cc(),
      _0x4913d5 = _0x24badb.activeByProjectId[_0x2a214c] || '',
      _0x313838 = _0x4913d5 ? _0x2926cb(_0x24badb, _0x4913d5) : null;
    if (_0x313838 && _0x313838.projectId === _0x2a214c && _0x313838.archived !== true)
      return cloneJson(_0x313838);
    const _0x2104eb = _0x2ed8a3(_0x24badb)[0] || null;
    if (_0x2104eb)
      return (
        (_0x24badb.activeByProjectId[_0x2a214c] = _0x2104eb.id),
        _0x1c2333(_0x24badb),
        cloneJson(_0x2104eb)
      );
    const _0x36af78 = _0xb5a895({ projectId: _0x2a214c });
    return (
      _0x24badb.conversations.push(_0x36af78),
      (_0x24badb.activeByProjectId[_0x2a214c] = _0x36af78.id),
      _0x1c2333(_0x24badb),
      cloneJson(_0x36af78)
    );
  }
  function _0xcd4a47() {
    return _0x2ed8a3().map((_0x35a82e) => cloneJson(_0x35a82e));
  }
  function _0x5e2207(_0x1fc26a) {
    const _0x28437 = _0x2742b5(),
      _0x544bdb = _0x2926cb(_0x28437, _0x1fc26a);
    return _0x544bdb ? cloneJson(_0x544bdb) : null;
  }
  function _0x42c3be(_0x1be3ce = {}) {
    const _0x510d95 = _0x2742b5(),
      _0x303406 = _0xb5a895(_0x1be3ce);
    return (
      _0x510d95.conversations.push(_0x303406),
      (_0x510d95.activeByProjectId[_0x303406.projectId] = _0x303406.id),
      _0x1c2333(_0x510d95),
      cloneJson(_0x303406)
    );
  }
  function _0x408fc4(_0x3ef192, _0x319754 = {}) {
    const _0x311829 = _0x2742b5(),
      _0x2ec08e = String(_0x3ef192 || '').trim(),
      _0x471de5 = _0x311829.conversations.findIndex((_0x2784f6) => _0x2784f6.id === _0x2ec08e);
    if (_0x471de5 < 0) return null;
    const _0x1005f6 = _0x311829.conversations[_0x471de5],
      _0x28918d = normalizeTimestamp(_0x319754.updatedAt, now()),
      _0x65fffa = normalizeConversation(
        {
          ..._0x1005f6,
          ..._0x319754,
          id: _0x1005f6.id,
          projectId: _0x1005f6.projectId,
          createdAt: _0x1005f6.createdAt,
          updatedAt: _0x28918d,
          messages: Array.isArray(_0x319754.messages) ? _0x319754.messages : _0x1005f6.messages,
        },
        _0x28918d,
      );
    return ((_0x311829.conversations[_0x471de5] = _0x65fffa), _0x1c2333(_0x311829), cloneJson(_0x65fffa));
  }
  function _0x2480fd(_0x11174d, _0x4d0227 = {}) {
    const _0x2c2aa2 = _0x2742b5(),
      _0x257813 = String(_0x11174d || '').trim(),
      _0x2adc37 = _0x2c2aa2.conversations.findIndex((_0x354d19) => _0x354d19.id === _0x257813);
    if (_0x2adc37 < 0) return null;
    const _0x166a14 = normalizeTimestamp(_0x4d0227.ts, now()),
      _0x2bacee = normalizeMessage(_0x4d0227, _0x166a14);
    if (!_0x2bacee) return cloneJson(_0x2c2aa2.conversations[_0x2adc37]);
    const _0x441981 = _0x2c2aa2.conversations[_0x2adc37],
      _0x11f9f2 = [..._0x441981.messages, _0x2bacee],
      _0x440d03 = _0x441981.title === DEFAULT_CONVERSATION_TITLE ? createTitleFromMessage(_0x2bacee) : '',
      _0x1185de = normalizeConversation(
        { ..._0x441981, title: _0x440d03 || _0x441981.title, updatedAt: _0x166a14, messages: _0x11f9f2 },
        _0x166a14,
      );
    return ((_0x2c2aa2.conversations[_0x2adc37] = _0x1185de), _0x1c2333(_0x2c2aa2), cloneJson(_0x1185de));
  }
  function _0x53096c(_0x5f434e) {
    const _0x1378a0 = _0x2742b5(),
      _0x4cdf18 = String(_0x5f434e || '').trim();
    if (!_0x4cdf18) return _0x14cf27();
    _0x1378a0.conversations = _0x1378a0.conversations.filter((_0x36d22c) => _0x36d22c.id !== _0x4cdf18);
    for (const [_0x1a468e, _0x51ed56] of Object.entries(_0x1378a0.activeByProjectId)) {
      if (_0x51ed56 === _0x4cdf18) delete _0x1378a0.activeByProjectId[_0x1a468e];
    }
    return (_0x1c2333(_0x1378a0), _0x14cf27());
  }
  function _0x3fddb8(_0x130d47) {
    const _0x429dfe = _0x2742b5(),
      _0x54ca88 = _0x3f24cc(),
      _0x2d9feb = _0x2926cb(_0x429dfe, _0x130d47);
    if (!_0x2d9feb || _0x2d9feb.projectId !== _0x54ca88 || _0x2d9feb.archived === true) return null;
    return (
      (_0x429dfe.activeByProjectId[_0x54ca88] = _0x2d9feb.id),
      _0x1c2333(_0x429dfe),
      cloneJson(_0x2d9feb)
    );
  }
  function _0x4f8587() {
    return _0x14cf27()?.id || '';
  }
  return {
    listConversations: _0xcd4a47,
    getConversation: _0x5e2207,
    createConversation: _0x42c3be,
    updateConversation: _0x408fc4,
    appendMessage: _0x2480fd,
    deleteConversation: _0x53096c,
    setActiveConversationId: _0x3fddb8,
    getActiveConversationId: _0x4f8587,
    ensureActiveConversation: _0x14cf27,
  };
}
