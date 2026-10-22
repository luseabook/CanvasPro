import { normalizeOfficialTextPendingRequest } from '../../../api/officialTextAdmission.js';
export function normalizeAgentOfficialTextTask(agentTask) {
  if (
    !agentTask ||
    typeof agentTask !== 'object' ||
    !/^[a-zA-Z0-9_-]{20,80}$/.test(String(agentTask.taskId || ''))
  )
    return null;
  return {
    taskId: String(agentTask.taskId),
    model: String(agentTask.model || ''),
    provider: String(agentTask.provider || ''),
    pendingRequest: normalizeOfficialTextPendingRequest(agentTask.pendingRequest),
    message: String(agentTask.message || '').slice(0, 32000),
    revisionItemId: String(agentTask.revisionItemId || ''),
    skillIds: Array.isArray(agentTask.skillIds)
      ? agentTask.skillIds.map(String).slice(0, 32)
      : [],
  };
}
