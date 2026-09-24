import { normalizeMediaExportItems } from '../modules/nodeExport/nodeMediaExportModel.js';

export function getNodeMediaExportBridge() {
  const bridge = globalThis.window?.electronAPI?.nodeMediaExport;
  if (typeof bridge?.capabilities !== 'function' || typeof bridge?.exportSelected !== 'function') {
    throw new Error('本地媒体批量导出需要更新后的 Electron 桌面端；普通浏览器不支持此功能');
  }
  return bridge;
}
export async function exportNodeMedia(items) {
  const bridge = getNodeMediaExportBridge();
  const capabilities = await bridge.capabilities();
  if (capabilities?.available !== true || capabilities.localOnly !== true) throw new Error('桌面媒体导出能力不可用');
  // No arbitrary fields or target directory are forwarded to the privileged process.
  return bridge.exportSelected({ items: normalizeMediaExportItems({ items }).map(({ nodeId, name, kind, localPath }) =>
    ({ nodeId, name, kind, localPath })) });
}
