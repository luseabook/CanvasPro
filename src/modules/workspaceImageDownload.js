import {
  buildWorkspaceMediaDownloadPayload,
  renderWorkspaceMediaDownloadButton,
  runWorkspaceMediaDownloadAction,
  saveWorkspaceMediaDownload,
} from './workspaceMediaDownload.js';
export function buildWorkspaceImageDownloadPayload({
  imageRef: _0x1531df,
  filenameBase: filenameBase = '生成图片',
  title: title = '下载图片',
} = {}) {
  return buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: _0x1531df,
    filenameBase: filenameBase,
    title: title,
  });
}
export async function saveWorkspaceImageDownload({
  imageRef: _0x174c2d,
  filenameBase: _0x360dee,
  title: _0x44cbad,
  saveMedia: _0x50243b,
} = {}) {
  return await saveWorkspaceMediaDownload({
    kind: 'image',
    mediaRef: _0x174c2d,
    filenameBase: _0x360dee,
    title: _0x44cbad,
    saveMedia: _0x50243b,
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
export async function runWorkspaceImageDownloadAction(_0x3926f3, _0x3fab20) {
  return await runWorkspaceMediaDownloadAction(_0x3926f3, _0x3fab20);
}
