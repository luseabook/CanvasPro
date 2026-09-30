import { FULL_PACKAGE_LIMITS, validateFullProject } from './fullProjectPackageModel.js';
let busy = false;
export function createFullProjectContextGuard(readContext) {
  const initial = readContext();
  if (!initial?.data || !initial.nodes || !initial.canvases) throw new Error('当前工程快照尚未就绪');
  // The reader may return a mutable context object; retain the original references, not that object.
  const { nodes, canvases, identity } = initial;
  const signature = JSON.stringify(initial.data);
  if (new TextEncoder().encode(signature).byteLength > FULL_PACKAGE_LIMITS.jsonBytes) throw new Error('完整工程JSON超过64MiB');
  return {
    snapshot: JSON.parse(signature),
    assertCurrent() {
      const current = readContext();
      if (current.nodes !== nodes || current.canvases !== canvases || current.identity !== identity || JSON.stringify(current.data) !== signature) throw new Error('等待期间工程/画布或内容已改变，不自动切换；落盘结果请从独立文件打开');
    },
  };
}
export async function runFullProjectPackage({ mode, api, readContext, projectName, projectId, operationId, externalPackageTicket, confirmSwitch, openProject, onRetained }) {
  if (busy) throw new Error('已有完整工程包操作正在执行');
  if (!['export', 'restore'].includes(mode)) throw new Error('未知完整工程包操作');
  const fromOS = externalPackageTicket !== undefined;
  if (fromOS && (mode !== 'restore' || typeof externalPackageTicket !== 'string' || !/^[a-f0-9]{48}$/.test(externalPackageTicket))) throw new Error('系统工程包请求凭据无效；请重新从系统打开文件');
  if (!api?.fullPackageCapabilities || !api?.exportFullPackage || !api?.restoreFullPackage) throw new Error('请更新并重启对应源码桌面端；完整工程包不回退旧接口/浏览器');
  const guard = createFullProjectContextGuard(readContext);
  validateFullProject(guard.snapshot);
  busy = true; let diskResult = null;
  try {
    let capabilities;
    try { capabilities = await api.fullPackageCapabilities(); }
    catch { throw new Error('无法确认完整工程包宿主能力，请更新并重启对应桌面端；不回退旧接口'); }
    if (capabilities?.version !== 1) throw new Error('桌面端不支持本版完整工程包校验，请更新并重启');
    if (fromOS && capabilities.externalPackageTickets !== 1) throw new Error('系统打开完整工程包需更新并重启桌面端；不会回退到仅导入一张画布');
    guard.assertCurrent();
    if (mode === 'export') {
      const result = await api.exportFullPackage({ multiData: guard.snapshot, projectName, projectId, operationId });
      if (result?.canceled) return result;
      if (!result?.success || result.fullPackageVersion !== 1) throw new Error('宿主未确认完整工程包已成功写入');
      return result;
    }
    const result = await api.restoreFullPackage(fromOS ? { operationId, externalPackageTicket } : { operationId });
    if (result?.canceled) return result;
    if (!result?.success || result.fullPackageVersion !== 1 || !result.projectPath) throw new Error('宿主未返回明确的完整工程恢复结果');
    diskResult = result;
    validateFullProject(result.data);
    guard.assertCurrent();
    if (!await confirmSwitch(result)) { onRetained(result, '已恢复到独立文件，未切换当前工程'); return result; }
    guard.assertCurrent();
    // Synchronous original project-open bridge only; no awaited gap after final guard.
    if (openProject(result) !== true) throw new Error('原工程打开入口未完成，请核对独立文件');
    return result;
  } catch (error) {
    if (diskResult) onRetained(diskResult, error.message);
    throw error;
  } finally { busy = false; }
}
export function showRetainedProjectPackage(result, message) {
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'max-width:680px;width:80vw;padding:24px;border-radius:12px';
  const title = document.createElement('h3'); title.textContent = '工程恢复文件已保留';
  const text = document.createElement('p'); text.textContent = message + '。没有回滚已落盘文件；请核对当前工程，再用原“打开本地工程”入口打开下列文件。';
  const field = document.createElement('textarea'); field.readOnly = true; field.rows = 3;
  field.value = result.projectPath; field.setAttribute('aria-label', '独立工程文件路径（可选中复制）'); field.style.width = '100%';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '保留文件并关闭'; close.onclick = () => dialog.close();
  dialog.append(title, text, field, close); dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('keydown', event => event.stopPropagation());
  document.body.append(dialog); dialog.showModal();
}