import { hasSeenBetaNotice, markBetaNoticeSeen, showWorkspaceBetaNotice } from '../workspaceBetaNotice.js';
export const STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY = 'aicanvas.storyWorkspace.betaNoticeSeen.v1';
export function hasSeenStoryWorkspaceBetaNotice(windowObject2 = globalThis['window']) {
  return hasSeenBetaNotice({
    windowObject: windowObject2,
    storageKey: STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY,
  });
}
export function markStoryWorkspaceBetaNoticeSeen(windowObject3 = globalThis['window']) {
  return markBetaNoticeSeen({
    windowObject: windowObject3,
    storageKey: STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY,
  });
}
export function showStoryWorkspaceBetaNotice({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  return showWorkspaceBetaNotice({
    documentObject: documentObject,
    windowObject: windowObject,
    storageKey: STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY,
    title: '剧本工作室\x20Beta\x20测试版',
    message:
      '该功能目前为 Beta 测试版，使用过程中可能会遇到内容格式不符合要求而导致报错的情况。如果多次重试仍无法通过，请等待下一版本更新。',
  });
}
