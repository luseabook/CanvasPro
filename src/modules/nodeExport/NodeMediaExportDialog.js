import { collectNodeMedia } from './collectNodeMedia.js';
import { exportNodeMedia, getNodeMediaExportBridge } from '../../services/nodeMediaExportService.js';

let activeDialog = null;
function element(tag, text) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

export function openNodeMediaExportDialog(nodes, selectedIds) {
  if (activeDialog) { activeDialog.focus(); return; }
  let snapshot;
  try { snapshot = collectNodeMedia(nodes, selectedIds); }
  catch (error) { window.alert(error.message); return; }
  const dialog = element('dialog'), heading = element('h2', '导出选中节点的本地媒体');
  activeDialog = dialog; dialog.className = 'node-media-export-dialog';
  dialog.setAttribute('aria-labelledby', 'node-media-export-title'); heading.id = 'node-media-export-title';
  dialog.style.cssText = 'width:min(760px,90vw);max-height:85vh;overflow:auto;padding:24px;border:1px solid #666;border-radius:12px;background:#202124;color:#eee;';
  dialog.append(heading, element('p', '导出当前选择快照中的原媒体，每节点一个文件。不会导出缩略图、联网下载或触发生成；不修改画布，不替代工程保存。'));
  dialog.append(element('p', '最多 100 项，单文件 512 MiB，整批 2 GiB。将另存到新子目录；复制原编码，不转码，不是时间线或成片导出。'));
  const list = element('ul');
  for (const item of snapshot.items) list.append(element('li', `${item.name} → ${item.fileName}`));
  for (const item of snapshot.skipped) list.append(element('li', `跳过 ${item.name}：${item.reason}`));
  dialog.append(list);
  const status = element('p', `${snapshot.items.length} 项待预检，${snapshot.skipped.length} 项跳过。`);
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const execute = element('button', '选择目录并确认导出'), close = element('button', '关闭');
  for (const button of [execute, close]) { button.type = 'button'; button.style.cssText = 'padding:8px 14px;margin:8px 8px 0 0;cursor:pointer;'; }
  execute.disabled = !snapshot.items.length;
  try { getNodeMediaExportBridge(); }
  catch (error) { status.textContent = error.message; execute.disabled = true; }
  let busy = false;
  const beforeUnload = event => { if (busy) { event.preventDefault(); event.returnValue = ''; } };
  const dispose = () => {
    if (busy) return;
    dialog.close(); dialog.remove(); activeDialog = null;
    window.removeEventListener('beforeunload', beforeUnload);
  };
  close.addEventListener('click', dispose);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dispose(); });
  // Keep canvas shortcuts/selection handlers from acting on this modal.
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'contextmenu', 'wheel']) {
    dialog.addEventListener(type, event => event.stopPropagation());
  }
  execute.addEventListener('click', async () => {
    if (busy) return;
    busy = true; execute.disabled = true; close.disabled = true;
    status.textContent = '正在预检、等待原生目录选择与确认。开始复制后请等待；不自动重试。';
    let allowRetry = false;
    try {
      const result = await exportNodeMedia(snapshot.items);
      if (result?.status === 'cancelled') {
        status.textContent = '已取消，未开始复制。'; allowRetry = true;
      } else {
        if (!Array.isArray(result?.results)) throw new Error('桌面端未返回有效结果');
        list.replaceChildren();
        for (const item of result.results) list.append(element('li', item.status === 'saved'
          ? `已写入 ${item.fileName}（${item.bytes} 字节）`
          : `失败 ${item.name}：${item.error}`));
        for (const item of snapshot.skipped) list.append(element('li', `跳过 ${item.name}：${item.reason}`));
        const saved = result.results.filter(item => item.status === 'saved').length;
        status.textContent = `已写入 ${saved} / ${snapshot.items.length} 项。${result.directory ? `目录：${result.directory}` : '未创建导出目录。'} ${result.manifestSaved ? 'export-manifest.json 已保存，含节点标识、文件名、字节数及 SHA-256。' : '清单未保存；请保留此结果，核对磁盘文件。'} 失败项不自动重试；重新打开会创建另一批，不会续写本批。`;
      }
    } catch {
      status.textContent = '导出未完成或结果未能确认。请先核对所选目录（可能已有部分文件），不要把断线当作未执行；关闭后可重新预览。';
    } finally {
      busy = false; close.disabled = false; execute.disabled = !allowRetry;
    }
  });
  dialog.append(status, execute, close); document.body.append(dialog);
  window.addEventListener('beforeunload', beforeUnload);
  dialog.showModal(); close.focus();
}
