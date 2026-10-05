import {
  buildWorkspaceMediaDownloadPayload,
  renderWorkspaceMediaDownloadButton,
  runWorkspaceMediaDownloadAction,
  saveWorkspaceMediaDownload,
} from './workspaceMediaDownload.js';
export function buildWorkspaceVideoDownloadPayload({
  videoRef: videoRef,
  filenameBase: filenameBase = '生成视频',
  title: title = '下载视频',
} = {}) {
  return buildWorkspaceMediaDownloadPayload({
    kind: 'video',
    mediaRef: videoRef,
    filenameBase: filenameBase,
    title: title,
  });
}
export async function saveWorkspaceVideoDownload({
  videoRef: videoRef2,
  filenameBase: filenameBase2,
  title: title2,
  saveMedia: saveMedia,
} = {}) {
  return await saveWorkspaceMediaDownload({
    kind: 'video',
    mediaRef: videoRef2,
    filenameBase: filenameBase2,
    title: title2,
    saveMedia: saveMedia,
  });
}
export function renderWorkspaceVideoDownloadButton({
  action: action = 'download-replacement-video',
  enabled: enabled = false,
  className: className = '',
  label: label = '下载替换视频',
} = {}) {
  return renderWorkspaceMediaDownloadButton({
    action: action,
    enabled: enabled,
    className: className,
    label: label,
  });
}
export async function runWorkspaceVideoDownloadAction(value, item) {
  return await runWorkspaceMediaDownloadAction(value, item);
}
