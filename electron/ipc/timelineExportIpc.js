import { dialog } from 'electron';
import { assertNodeExportSender } from '../nodeMediaExportService.js';
import { createTimelineExporter } from '../timelineExport/timelineExportService.js';
import { createTimelineProbe } from '../timelineExport/probeTimelineMedia.js';
import { buildTimelineExportConfirmation } from '../timelineExport/timelineExportOperation.js';

export function registerTimelineExportIpcHandlers({ ipcMain, getNodeExportWindow, isNodeExportAppUrl,
  getNodeExportRoots, resolveLocalVirtualPath, getTimelineExportTool }) {
  const assertSender = event => assertNodeExportSender(event, getNodeExportWindow(), isNodeExportAppUrl);
  const exporter = createTimelineExporter({
    getRoots: getNodeExportRoots, resolveLocalVirtualPath, probe: createTimelineProbe(getTimelineExportTool),
    async chooseDirectory() {
      const chosen = await dialog.showOpenDialog(getNodeExportWindow(), { title: '选择时间线工程父目录',
        properties: ['openDirectory', 'createDirectory'] });
      return chosen.canceled ? '' : chosen.filePaths[0];
    },
    async confirmExport(selection) {
      const answer = await dialog.showMessageBox(getNodeExportWindow(), buildTimelineExportConfirmation(selection));
      return answer.response === 1;
    },
  });
  ipcMain.handle('timelineExport:capabilities', event => {
    assertSender(event); return { available: true, format: 'xmeml-v5', requiresFfprobe: true, ffprobeChecked: false };
  });
  ipcMain.handle('timelineExport:export', (event, payload) => {
    assertSender(event); return exporter(payload, { assertActive: () => assertSender(event) });
  });
}
