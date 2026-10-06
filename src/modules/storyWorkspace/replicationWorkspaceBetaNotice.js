import { hasSeenBetaNotice, showWorkspaceBetaNotice } from '../workspaceBetaNotice.js';
export const REPLICATION_BETA_NOTICE_STORAGE_KEY =
  'aicanvas.replicationWorkspace.betaNoticeSeen.v1';
export function hasAcceptedReplicationBetaNotice(windowObject = globalThis.window) {
  return hasSeenBetaNotice({
    windowObject: windowObject,
    storageKey: REPLICATION_BETA_NOTICE_STORAGE_KEY,
  });
}
export function showReplicationWorkspaceBetaNotice({
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
  onConfirm: onConfirm = null,
} = {}) {
  return showWorkspaceBetaNotice({
    documentObject: documentObject,
    windowObject: windowObject,
    storageKey: REPLICATION_BETA_NOTICE_STORAGE_KEY,
    onConfirm: onConfirm,
    title: '复刻工作室 Beta 测试版',
    message:
      '复刻工作室目前为 Beta 测试版，部分功能仍在持续完善。使用过程中可能遇到原片分析失败、生成结果不符合预期或其他异常，建议先用短片段进行测试。如遇问题可尝试重试，若多次重试仍无法完成，请等待后续版本更新。',
  });
}
