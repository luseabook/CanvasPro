import { get, post } from './requester.js';
const STORY_WORKSPACE_USER_FILE = '/api/v2/user/story-workspace.json';
export async function fetchStoryWorkspaceFromServer() {
  return await get(STORY_WORKSPACE_USER_FILE, {
    allow404Null: !![],
    provider: 'local',
  });
}
export async function saveStoryWorkspaceToServer(_0x39187d) {
  return await post(STORY_WORKSPACE_USER_FILE, _0x39187d || {}, {
    provider: 'local',
  });
}
