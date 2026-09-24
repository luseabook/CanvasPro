const MAX_LEDGER_ENTRIES = 0x78,
  MAX_CHECKPOINT_ITEMS = 0x18,
  MAX_TEXT_CHARS = 0xfa0;
function truncateText(_0x2c36d1, _0x256170 = MAX_TEXT_CHARS) {
  const _0x2865b9 = String(_0x2c36d1 || '')['trim']();
  return _0x2865b9['length'] <= _0x256170
    ? _0x2865b9
    : _0x2865b9['slice'](0x0, Math['max'](0x0, _0x256170 - 0x3)) + '...';
}
function normalizeTimestamp(_0x46abda, _0x48d5d1 = Date['now']()) {
  const _0xaf89d1 = Number(_0x46abda);
  return Number['isFinite'](_0xaf89d1) && _0xaf89d1 > 0x0 ? _0xaf89d1 : _0x48d5d1;
}
function normalizeStringArray(_0x32f29c, _0x41bdc1 = MAX_CHECKPOINT_ITEMS) {
  return Array['isArray'](_0x32f29c)
    ? [...new Set(_0x32f29c['map']((_0x555344) => String(_0x555344 || '')['trim']())['filter'](Boolean))][
        'slice'
      ](0x0, _0x41bdc1)
    : [];
}
function normalizeToolResult(_0x2e7ffb = {}) {
  if (!_0x2e7ffb || typeof _0x2e7ffb !== 'object' || Array['isArray'](_0x2e7ffb)) return null;
  const _0xa52941 = String(_0x2e7ffb['commandId'] || '')['trim']();
  if (!_0xa52941) return null;
  return {
    step: Math['max'](0x0, Math['trunc'](Number(_0x2e7ffb['step'] || 0x0))),
    commandId: _0xa52941,
    ok: _0x2e7ffb['ok'] === !![],
    status: String(_0x2e7ffb['status'] || '')['trim'](),
    errorCode: String(_0x2e7ffb['errorCode'] || '')
      ['trim']()
      ['slice'](0x0, 0x78),
    message: truncateText(_0x2e7ffb['message'] || '', 0x1e0),
  };
}
function normalizeInputRef(_0x104fcb = {}) {
  if (!_0x104fcb || typeof _0x104fcb !== 'object' || Array['isArray'](_0x104fcb)) return null;
  const _0x6e5256 = String(_0x104fcb['nodeId'] || _0x104fcb['id'] || '')['trim']();
  if (!_0x6e5256) return null;
  return {
    nodeId: _0x6e5256,
    type: String(_0x104fcb['type'] || '')['trim'](),
    kind: String(_0x104fcb['kind'] || '')['trim'](),
    name: truncateText(_0x104fcb['name'] || _0x104fcb['label'] || '', 0x78),
    source: String(_0x104fcb['source'] || '')['trim'](),
  };
}
function normalizePrecreatedNode(_0x3c585a = {}) {
  if (!_0x3c585a || typeof _0x3c585a !== 'object' || Array['isArray'](_0x3c585a)) return null;
  const _0x2c8197 = String(_0x3c585a['nodeId'] || '')['trim'](),
    _0x3f6cb9 = String(_0x3c585a['type'] || '')['trim']();
  return _0x2c8197 && _0x3f6cb9 ? { nodeId: _0x2c8197, type: _0x3f6cb9 } : null;
}
export function normalizeAgentOperation(_0x4989e0 = {}, _0x3e0d47 = Date['now']()) {
  if (!_0x4989e0 || typeof _0x4989e0 !== 'object' || Array['isArray'](_0x4989e0)) return null;
  const _0x101314 = String(_0x4989e0['id'] || _0x4989e0['operationId'] || '')['trim'](),
    _0x2d35f2 = String(_0x4989e0['runId'] || '')['trim'](),
    _0x48cb91 = String(_0x4989e0['commandId'] || '')['trim']();
  if (!_0x101314 || !_0x2d35f2 || !_0x48cb91) return null;
  const _0x19d553 = normalizeTimestamp(_0x4989e0['startedAt'], _0x3e0d47);
  return {
    id: _0x101314,
    runId: _0x2d35f2,
    conversationId: String(_0x4989e0['conversationId'] || '')['trim'](),
    projectId: String(_0x4989e0['projectId'] || '')['trim'](),
    step: Math['max'](0x0, Math['trunc'](Number(_0x4989e0['step'] || 0x0))),
    commandId: _0x48cb91,
    fingerprint: String(_0x4989e0['fingerprint'] || '')
      ['trim']()
      ['slice'](0x0, 0x78),
    status: String(_0x4989e0['status'] || 'pending')['trim'](),
    ok: _0x4989e0['ok'] === !![] ? !![] : _0x4989e0['ok'] === ![] ? ![] : null,
    errorCode: String(_0x4989e0['errorCode'] || '')
      ['trim']()
      ['slice'](0x0, 0x78),
    verificationStatus: String(_0x4989e0['verificationStatus'] || '')
      ['trim']()
      ['slice'](0x0, 0x28),
    repairAttempts: Math['max'](
      0x0,
      Math['min'](0x1, Math['trunc'](Number(_0x4989e0['repairAttempts'] || 0x0))),
    ),
    createdNodeIds: normalizeStringArray(_0x4989e0['createdNodeIds']),
    createdEdgeIds: normalizeStringArray(_0x4989e0['createdEdgeIds']),
    startedAt: _0x19d553,
    completedAt: _0x4989e0['completedAt'] ? normalizeTimestamp(_0x4989e0['completedAt'], _0x19d553) : 0x0,
  };
}
export function normalizeAgentOperationLedger(_0x5c9a84 = [], _0xd7f80b = Date['now']()) {
  return (Array['isArray'](_0x5c9a84) ? _0x5c9a84 : [])
    ['map']((_0x1dd3bb) => normalizeAgentOperation(_0x1dd3bb, _0xd7f80b))
    ['filter'](Boolean)
    ['slice'](-MAX_LEDGER_ENTRIES);
}
export function normalizeAgentTaskBinding(_0xa15d76 = {}) {
  if (!_0xa15d76 || typeof _0xa15d76 !== 'object' || Array['isArray'](_0xa15d76)) return null;
  const _0x55457b = String(_0xa15d76['id'] || '')['trim'](),
    _0x1eed7c = String(_0xa15d76['nodeId'] || _0xa15d76['targetNodeId'] || '')['trim']();
  if (!_0x55457b || !_0x1eed7c) return null;
  return {
    id: _0x55457b,
    conversationId: String(_0xa15d76['conversationId'] || '')['trim'](),
    turnId: String(_0xa15d76['turnId'] || '')['trim'](),
    nodeId: _0x1eed7c,
    targetNodeId: String(_0xa15d76['targetNodeId'] || _0x1eed7c)['trim'](),
    taskId: String(_0xa15d76['taskId'] || '')['trim'](),
    commandId: String(_0xa15d76['commandId'] || 'generation.run')['trim'](),
    status: String(_0xa15d76['status'] || '')['trim'](),
    messageStatus: String(_0xa15d76['messageStatus'] || '')['trim'](),
    createdAt: normalizeTimestamp(_0xa15d76['createdAt']),
    updatedAt: normalizeTimestamp(_0xa15d76['updatedAt']),
    notifiedTerminal: _0xa15d76['notifiedTerminal'] === !![],
  };
}
export function normalizeAgentTaskBindings(_0x2e066b = []) {
  return (Array['isArray'](_0x2e066b) ? _0x2e066b : [])
    ['map'](normalizeAgentTaskBinding)
    ['filter'](Boolean)
    ['slice'](-MAX_CHECKPOINT_ITEMS);
}
export function normalizeAgentResumeCheckpoint(_0x2c7db2 = {}) {
  if (!_0x2c7db2 || typeof _0x2c7db2 !== 'object' || Array['isArray'](_0x2c7db2)) return null;
  const _0x324a7a = truncateText(_0x2c7db2['originalMessage'] || '', MAX_TEXT_CHARS),
    _0x584242 = String(_0x2c7db2['conversationId'] || '')['trim'](),
    _0x4440f5 = String(_0x2c7db2['projectId'] || '')['trim']();
  if (!_0x324a7a || !_0x584242 || !_0x4440f5) return null;
  const _0x38929b = String(_0x2c7db2['pendingKind'] || 'interrupted')['trim'](),
    _0x222961 = normalizePrecreatedNode(_0x2c7db2['precreatedNode']);
  return {
    runId: String(_0x2c7db2['runId'] || '')['trim'](),
    originalMessage: _0x324a7a,
    conversationId: _0x584242,
    projectId: _0x4440f5,
    step: Math['max'](0x0, Math['trunc'](Number(_0x2c7db2['step'] || 0x0))),
    pendingKind: _0x38929b === 'confirmation' ? 'interrupted' : _0x38929b,
    waitingTaskBindingIds: normalizeStringArray(_0x2c7db2['waitingTaskBindingIds']),
    toolResults: (Array['isArray'](_0x2c7db2['toolResults']) ? _0x2c7db2['toolResults'] : [])
      ['map'](normalizeToolResult)
      ['filter'](Boolean)
      ['slice'](-MAX_CHECKPOINT_ITEMS),
    runtimeProvenance: {
      createdNodeIds: normalizeStringArray(_0x2c7db2['runtimeProvenance']?.['createdNodeIds']),
      createdEdgeIds: normalizeStringArray(_0x2c7db2['runtimeProvenance']?.['createdEdgeIds']),
    },
    ...(_0x222961 ? { precreatedNode: _0x222961 } : {}),
    actionBudget: {
      duplicateNodeLimit: Math['max'](
        0x0,
        Math['trunc'](Number(_0x2c7db2['actionBudget']?.['duplicateNodeLimit'] || 0x0)),
      ),
      duplicatedNodeCount: Math['max'](
        0x0,
        Math['trunc'](Number(_0x2c7db2['actionBudget']?.['duplicatedNodeCount'] || 0x0)),
      ),
    },
    completedFingerprints: normalizeStringArray(_0x2c7db2['completedFingerprints']),
    failedFingerprints: Object['fromEntries'](
      Object['entries'](_0x2c7db2['failedFingerprints'] || {})
        ['map'](([_0x35042e, _0xe62b5e]) => [
          String(_0x35042e)['slice'](0x0, 0x78),
          Math['max'](0x0, Number(_0xe62b5e || 0x0)),
        ])
        ['filter'](([_0x5a76dc, _0x31a0e3]) => _0x5a76dc && _0x31a0e3 > 0x0)
        ['slice'](0x0, MAX_CHECKPOINT_ITEMS),
    ),
    disclosedCommandIds: normalizeStringArray(_0x2c7db2['disclosedCommandIds']),
    disclosedModelIds: normalizeStringArray(_0x2c7db2['disclosedModelIds']),
    noActionRetryCount: Math['max'](0x0, Math['trunc'](Number(_0x2c7db2['noActionRetryCount'] || 0x0))),
    clarificationAnswer: truncateText(_0x2c7db2['clarificationAnswer'] || '', 0x4b0),
    recoveryInstruction: truncateText(_0x2c7db2['recoveryInstruction'] || '', 0x4b0),
    plannerExtra: {
      targetKind: String(_0x2c7db2['plannerExtra']?.['targetKind'] || '')['trim'](),
      inputRefs: (Array['isArray'](_0x2c7db2['plannerExtra']?.['inputRefs'])
        ? _0x2c7db2['plannerExtra']['inputRefs']
        : [])
        ['map'](normalizeInputRef)
        ['filter'](Boolean)
        ['slice'](0x0, 0xc),
    },
  };
}
