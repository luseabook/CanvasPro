import {
  buildWorkspaceMediaDownloadPayload,
  renderWorkspaceMediaDownloadButton,
  runWorkspaceMediaDownloadAction,
  saveWorkspaceMediaDownload,
} from './workspaceMediaDownload.js';
export function buildWorkspaceImageDownloadPayload({
  imageRef: imageRef,
  filenameBase: filenameBase = '生成图片',
  title: title = '下载图片',
} = {}) {
  return buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: imageRef,
    filenameBase: filenameBase,
    title: title,
  });
}
export async function saveWorkspaceImageDownload({
  imageRef: imageRef2,
  filenameBase: filenameBase2,
  title: title2,
  saveMedia: saveMedia,
} = {}) {
  return await saveWorkspaceMediaDownload({
    kind: 'image',
    mediaRef: imageRef2,
    filenameBase: filenameBase2,
    title: title2,
    saveMedia: saveMedia,
  });
}
export function renderWorkspaceImageDownloadButton({
  action: action = 'download-asset-image',
  enabled: enabled = ![],
  className: className = '',
  label: label = '下载图片',
} = {}) {
  return renderWorkspaceMediaDownloadButton({
    action: action,
    enabled: enabled,
    className: className,
    label: label,
  });
}
export async function runWorkspaceImageDownloadAction(value, item) {
  return await runWorkspaceMediaDownloadAction(value, item);
}
