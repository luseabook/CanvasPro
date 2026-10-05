const MAX_LEDGER_ENTRIES = 120,
  MAX_CHECKPOINT_ITEMS = 24,
  MAX_TEXT_CHARS = 4000;
function truncateText(value, item = MAX_TEXT_CHARS) {
  const list = String(value || '')['trim']();
  return list['length'] <= item ? list : list['slice'](0, Math['max'](0, item - 3)) + '...';
}
function normalizeTimestamp(key, index = Date['now']()) {
  const count = Number(key);
  return Number['isFinite'](count) && count > 0 ? count : index;
}
function normalizeStringArray(list2, result = MAX_CHECKPOINT_ITEMS) {
  return Array['isArray'](list2)
    ? [...new Set(list2['map']((data) => String(data || '')['trim']())['filter'](Boolean))]['slice'](
        0,
        result,
      )
    : [];
}
function normalizeToolResult(ok = {}) {
  if (!ok || typeof ok !== 'object' || Array['isArray'](ok)) return null;
  const commandId = String(ok['commandId'] || '')['trim']();
  if (!commandId) return null;
  return {
    step: Math['max'](0, Math['trunc'](Number(ok['step'] || 0))),
    commandId: commandId,
    ok: ok['ok'] === !![],
    status: String(ok['status'] || '')['trim'](),
    errorCode: String(ok['errorCode'] || '')
      ['trim']()
      ['slice'](0, 120),
    message: truncateText(ok['message'] || '', 480),
  };
}
function normalizeInputRef(error = {}) {
  if (!error || typeof error !== 'object' || Array['isArray'](error)) return null;
  const nodeId = String(error['nodeId'] || error['id'] || '')['trim']();
  if (!nodeId) return null;
  return {
    nodeId: nodeId,
    type: String(error['type'] || '')['trim'](),
    kind: String(error['kind'] || '')['trim'](),
    name: truncateText(error['name'] || error['label'] || '', 120),
    source: String(error['source'] || '')['trim'](),
  };
}
function normalizePrecreatedNode(enabled = {}) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return null;
  const nodeId2 = String(enabled['nodeId'] || '')['trim'](),
    type = String(enabled['type'] || '')['trim']();
  return nodeId2 && type ? { nodeId: nodeId2, type: type } : null;
}
export function normalizeAgentOperation(ok2 = {}, options = Date['now']()) {
  if (!ok2 || typeof ok2 !== 'object' || Array['isArray'](ok2)) return null;
  const id = String(ok2['id'] || ok2['operationId'] || '')['trim'](),
    runId = String(ok2['runId'] || '')['trim'](),
    commandId2 = String(ok2['commandId'] || '')['trim']();
  if (!id || !runId || !commandId2) return null;
  const startedAt = normalizeTimestamp(ok2['startedAt'], options);
  return {
    id: id,
    runId: runId,
    conversationId: String(ok2['conversationId'] || '')['trim'](),
    projectId: String(ok2['projectId'] || '')['trim'](),
    step: Math['max'](0, Math['trunc'](Number(ok2['step'] || 0))),
    commandId: commandId2,
    fingerprint: String(ok2['fingerprint'] || '')
      ['trim']()
      ['slice'](0, 120),
    status: String(ok2['status'] || 'pending')['trim'](),
    ok: ok2['ok'] === !![] ? !![] : ok2['ok'] === ![] ? ![] : null,
    errorCode: String(ok2['errorCode'] || '')
      ['trim']()
      ['slice'](0, 120),
    verificationStatus: String(ok2['verificationStatus'] || '')
      ['trim']()
      ['slice'](0, 40),
    repairAttempts: Math['max'](0, Math['min'](1, Math['trunc'](Number(ok2['repairAttempts'] || 0)))),
    createdNodeIds: normalizeStringArray(ok2['createdNodeIds']),
    createdEdgeIds: normalizeStringArray(ok2['createdEdgeIds']),
    startedAt: startedAt,
    completedAt: ok2['completedAt'] ? normalizeTimestamp(ok2['completedAt'], startedAt) : 0,
  };
}
export function normalizeAgentOperationLedger(list3 = [], target = Date['now']()) {
  return (Array['isArray'](list3) ? list3 : [])
    ['map']((source) => normalizeAgentOperation(source, target))
    ['filter'](Boolean)
    ['slice'](-MAX_LEDGER_ENTRIES);
}
export function normalizeAgentTaskBinding(notifiedTerminal = {}) {
  if (!notifiedTerminal || typeof notifiedTerminal !== 'object' || Array['isArray'](notifiedTerminal))
    return null;
  const id2 = String(notifiedTerminal['id'] || '')['trim'](),
    nodeId3 = String(notifiedTerminal['nodeId'] || notifiedTerminal['targetNodeId'] || '')['trim']();
  if (!id2 || !nodeId3) return null;
  return {
    id: id2,
    conversationId: String(notifiedTerminal['conversationId'] || '')['trim'](),
    turnId: String(notifiedTerminal['turnId'] || '')['trim'](),
    nodeId: nodeId3,
    targetNodeId: String(notifiedTerminal['targetNodeId'] || nodeId3)['trim'](),
    taskId: String(notifiedTerminal['taskId'] || '')['trim'](),
    commandId: String(notifiedTerminal['commandId'] || 'generation.run')['trim'](),
    status: String(notifiedTerminal['status'] || '')['trim'](),
    messageStatus: String(notifiedTerminal['messageStatus'] || '')['trim'](),
    createdAt: normalizeTimestamp(notifiedTerminal['createdAt']),
    updatedAt: normalizeTimestamp(notifiedTerminal['updatedAt']),
    notifiedTerminal: notifiedTerminal['notifiedTerminal'] === !![],
  };
}
export function normalizeAgentTaskBindings(list4 = []) {
  return (Array['isArray'](list4) ? list4 : [])
    ['map'](normalizeAgentTaskBinding)
    ['filter'](Boolean)
    ['slice'](-MAX_CHECKPOINT_ITEMS);
}
export function normalizeAgentResumeCheckpoint(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array['isArray'](enabled2)) return null;
  const originalMessage = truncateText(enabled2['originalMessage'] || '', MAX_TEXT_CHARS),
    conversationId = String(enabled2['conversationId'] || '')['trim'](),
    projectId = String(enabled2['projectId'] || '')['trim']();
  if (!originalMessage || !conversationId || !projectId) return null;
  const pendingKind = String(enabled2['pendingKind'] || 'interrupted')['trim'](),
    precreatedNode = normalizePrecreatedNode(enabled2['precreatedNode']);
  return {
    runId: String(enabled2['runId'] || '')['trim'](),
    originalMessage: originalMessage,
    conversationId: conversationId,
    projectId: projectId,
    step: Math['max'](0, Math['trunc'](Number(enabled2['step'] || 0))),
    pendingKind: pendingKind === 'confirmation' ? 'interrupted' : pendingKind,
    waitingTaskBindingIds: normalizeStringArray(enabled2['waitingTaskBindingIds']),
    toolResults: (Array['isArray'](enabled2['toolResults']) ? enabled2['toolResults'] : [])
      ['map'](normalizeToolResult)
      ['filter'](Boolean)
      ['slice'](-MAX_CHECKPOINT_ITEMS),
    runtimeProvenance: {
      createdNodeIds: normalizeStringArray(enabled2['runtimeProvenance']?.['createdNodeIds']),
      createdEdgeIds: normalizeStringArray(enabled2['runtimeProvenance']?.['createdEdgeIds']),
    },
    ...(precreatedNode ? { precreatedNode: precreatedNode } : {}),
    actionBudget: {
      duplicateNodeLimit: Math['max'](
        0,
        Math['trunc'](Number(enabled2['actionBudget']?.['duplicateNodeLimit'] || 0)),
      ),
      duplicatedNodeCount: Math['max'](
        0,
        Math['trunc'](Number(enabled2['actionBudget']?.['duplicatedNodeCount'] || 0)),
      ),
    },
    completedFingerprints: normalizeStringArray(enabled2['completedFingerprints']),
    failedFingerprints: Object['fromEntries'](
      Object['entries'](enabled2['failedFingerprints'] || {})
        ['map'](([next, current]) => [
          String(next)['slice'](0, 120),
          Math['max'](0, Number(current || 0)),
        ])
        ['filter'](([entry, count2]) => entry && count2 > 0)
        ['slice'](0, MAX_CHECKPOINT_ITEMS),
    ),
    disclosedCommandIds: normalizeStringArray(enabled2['disclosedCommandIds']),
    disclosedModelIds: normalizeStringArray(enabled2['disclosedModelIds']),
    noActionRetryCount: Math['max'](0, Math['trunc'](Number(enabled2['noActionRetryCount'] || 0))),
    clarificationAnswer: truncateText(enabled2['clarificationAnswer'] || '', 1200),
    recoveryInstruction: truncateText(enabled2['recoveryInstruction'] || '', 1200),
    plannerExtra: {
      targetKind: String(enabled2['plannerExtra']?.['targetKind'] || '')['trim'](),
      inputRefs: (Array['isArray'](enabled2['plannerExtra']?.['inputRefs'])
        ? enabled2['plannerExtra']['inputRefs']
        : [])
        ['map'](normalizeInputRef)
        ['filter'](Boolean)
        ['slice'](0, 12),
    },
  };
}
