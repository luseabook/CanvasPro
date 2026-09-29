import {
  buildWorkspaceMediaDownloadPayload,
  renderWorkspaceMediaDownloadButton,
  runWorkspaceMediaDownloadAction,
  saveWorkspaceMediaDownload,
} from './workspaceMediaDownload.js';
export function buildWorkspaceVideoDownloadPayload({
  videoRef: _0x4c1d26,
  filenameBase: filenameBase = '生成视频',
  title: title = '下载视频',
} = {}) {
  return buildWorkspaceMediaDownloadPayload({
    kind: 'video',
    mediaRef: _0x4c1d26,
    filenameBase: filenameBase,
    title: title,
  });
}
export async function saveWorkspaceVideoDownload({
  videoRef: _0x3edafb,
  filenameBase: _0xadf57a,
  title: _0x3a6c29,
  saveMedia: _0x1797c4,
} = {}) {
  return await saveWorkspaceMediaDownload({
    kind: 'video',
    mediaRef: _0x3edafb,
    filenameBase: _0xadf57a,
    title: _0x3a6c29,
    saveMedia: _0x1797c4,
  });
}
export function renderWorkspaceVideoDownloadButton({
  action: action = 'download-replacement-video',
  enabled: enabled = ![],
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
export async function runWorkspaceVideoDownloadAction(_0x26cb6b, _0x35dca9) {
  return await runWorkspaceMediaDownloadAction(_0x26cb6b, _0x35dca9);
}
