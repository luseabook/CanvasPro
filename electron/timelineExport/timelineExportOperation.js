import { createTimelineExporter } from './timelineExportService.js';
import { createTimelineProbe } from './probeTimelineMedia.js';

function showNativeOpenDialog(dialog, parentWindow, options) {
  return parentWindow ? dialog.showOpenDialog(parentWindow, options) : dialog.showOpenDialog(options);
}
function showNativeMessageBox(dialog, parentWindow, options) {
  return parentWindow ? dialog.showMessageBox(parentWindow, options) : dialog.showMessageBox(options);
}

export function buildTimelineExportConfirmation({ directory, plan, totalBytes }) {
  const fps = plan.rate.numerator / plan.rate.denominator;
  const summary = plan.clips
    .map((clip, index) => `${index + 1}. ${clip.name}：源帧 ${clip.inFrame}–${clip.outFrame}，时间线 ${clip.start}–${clip.end}`)
    .join('\n');
  return {
    type: 'question',
    title: '确认导出剪辑工程（不是成片）',
    message: `导出 ${plan.clips.length} 段 Premiere/FCP7 XML 时间线？`,
    detail: `${directory}\n${plan.rate.width}×${plan.rate.height}，${fps.toFixed(3)} fps，${(plan.frames / fps).toFixed(3)} 秒\n媒体副本 ${(totalBytes / 1024 / 1024).toFixed(1)} MiB\n${plan.includeAudio ? '保留合格的原始音轨；无声源保持空白' : '明确静音：XML不含音轨，但媒体副本仍含原音频'}\n\n${summary}\n\n按最近帧量化入出点，无转场/缩放/变速/字幕。复制完整源媒体（含未选片段与原音轨），新建独立子目录，不覆盖、不联网、不转码；无执行中取消。XML引用导出目录绝对路径，移动后需在剪辑软件重链接媒体。原工程和节点不改。`,
    buttons: ['取消', '确认导出工程'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  };
}

export function createTimelineExportOperation({
  dialog,
  getWindow = () => null,
  showOpenDialog: injectedShowOpenDialog,
  showMessageBox: injectedShowMessageBox,
  getDefaultDirectory = () => '',
  rememberDirectory = async () => {},
  getRoots,
  resolveLocalVirtualPath,
  getRuntimeToolOrFallback,
  probe,
  confirmExport: injectedConfirmExport,
} = {}) {
  const getParentWindow = () => {
    try {
      return getWindow() || null;
    } catch {
      return null;
    }
  };
  const openDialog = (options) =>
    typeof injectedShowOpenDialog === 'function'
      ? injectedShowOpenDialog(options)
      : showNativeOpenDialog(dialog, getParentWindow(), options);
  const messageBox = (options) =>
    typeof injectedShowMessageBox === 'function'
      ? injectedShowMessageBox(options)
      : showNativeMessageBox(dialog, getParentWindow(), options);
  let lastChosenDirectory = '';
  const exporter = createTimelineExporter({
    getRoots,
    resolveLocalVirtualPath,
    probe: typeof probe === 'function' ? probe : createTimelineProbe(getRuntimeToolOrFallback),
    async chooseDirectory() {
      const defaultDirectory = String(getDefaultDirectory?.() || '');
      const options = {
        title: '选择时间线工程父目录',
        properties: ['openDirectory', 'createDirectory'],
      };
      if (defaultDirectory) options.defaultPath = defaultDirectory;
      const chosen = await openDialog(options);
      if (chosen?.canceled || !chosen?.filePaths?.[0]) return '';
      lastChosenDirectory = String(chosen.filePaths[0]);
      return lastChosenDirectory;
    },
    confirmExport:
      typeof injectedConfirmExport === 'function'
        ? injectedConfirmExport
        : async (selection) => (await messageBox(buildTimelineExportConfirmation(selection))).response === 1,
  });
  // Same result contract as the existing timelineExport:export IPC route: status complete/cancelled/failed.
  return async function saveTimeline(payload = {}) {
    lastChosenDirectory = '';
    const result = await exporter(payload || {}, {});
    if (result?.status === 'complete' && lastChosenDirectory) {
      // The export is already published; a directory-memory failure must not hide it.
      try {
        await rememberDirectory(lastChosenDirectory);
      } catch {}
    }
    return result;
  };
}
