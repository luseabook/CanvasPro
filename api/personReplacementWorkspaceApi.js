import { get, post } from './requester.js';
const PERSON_REPLACEMENT_WORKSPACE_USER_FILE = '/api/v2/user/person-replacement-workspace.json';
export async function fetchReplacementStudioWorkspaceFromServer() {
  return await get(PERSON_REPLACEMENT_WORKSPACE_USER_FILE, {
    allow404Null: true,
    provider: 'local',
  });
}
export async function saveReplacementStudioWorkspaceToServer(value) {
  return await post(PERSON_REPLACEMENT_WORKSPACE_USER_FILE, value || {}, {
    provider: 'local',
  });
}
export const fetchPersonReplacementWorkspaceFromServer = fetchReplacementStudioWorkspaceFromServer;
export const savePersonReplacementWorkspaceToServer = saveReplacementStudioWorkspaceToServer;
