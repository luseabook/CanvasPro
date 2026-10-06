import { hasSeenBetaNotice, markBetaNoticeSeen, showWorkspaceBetaNotice } from '../workspaceBetaNotice.js';
export const REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY = 'aicanvas.replacementStudio.betaNoticeSeen.v1';
export function hasSeenReplacementStudioBetaNotice(windowObject2 = globalThis.window) {
  return hasSeenBetaNotice({
    windowObject: windowObject2,
    storageKey: REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY,
  });
}
export function markReplacementStudioBetaNoticeSeen(windowObject3 = globalThis.window) {
  return markBetaNoticeSeen({
    windowObject: windowObject3,
    storageKey: REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY,
  });
}
export function showReplacementStudioBetaNotice({
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
} = {}) {
  return showWorkspaceBetaNotice({
    documentObject: documentObject,
    windowObject: windowObject,
    storageKey: REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY,
    title: '替换工作室 Beta 测试版',
    message:
      '替换工作室目前为 Beta 测试版，部分功能仍在持续完善。使用过程中可能遇到处理失败、结果不符合预期或其他异常；建议先重试，若问题仍然存在，请等待后续版本更新。',
  });
}
