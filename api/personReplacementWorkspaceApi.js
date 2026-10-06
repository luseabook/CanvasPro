import { get, post } from './requester.js';
const PERSON_REPLACEMENT_WORKSPACE_USER_FILE = '/api/v2/user/person-replacement-workspace.json';
let workspaceRevision = 0;
export async function fetchReplacementStudioWorkspaceFromServer() {
  const response = await get(PERSON_REPLACEMENT_WORKSPACE_USER_FILE, {
    allow404Null: true,
    provider: 'local',
  });
  if (!response) return null;
  workspaceRevision = Math.max(0, Math.trunc(Number(response.workspaceRevision) || 0));
  return response.workspace && typeof response.workspace === 'object' ? response.workspace : response;
}
export async function saveReplacementStudioWorkspaceToServer(value) {
  const response = await post(PERSON_REPLACEMENT_WORKSPACE_USER_FILE, {
    expectedRevision: workspaceRevision,
    workspace: value || {},
  }, {
    provider: 'local',
  });
  workspaceRevision = Math.max(workspaceRevision, Math.trunc(Number(response?.workspaceRevision) || 0));
  return response;
}
export function getReplacementStudioWorkspaceRevision() { return workspaceRevision; }
export const fetchPersonReplacementWorkspaceFromServer = fetchReplacementStudioWorkspaceFromServer;
export const savePersonReplacementWorkspaceToServer = saveReplacementStudioWorkspaceToServer;
