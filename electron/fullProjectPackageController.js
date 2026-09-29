import path from 'node:path';
import { exportFullProjectPackage, restoreFullProjectPackage } from './fullProjectPackageService.js';
import { validateFullProject } from '../src/modules/projectPackage/fullProjectPackageModel.js';
import { sanitizeProjectName } from '../src/services/desktopProjectFileStore.js';
export function createFullProjectPackageController({ dialog, getMainWindow, getRoots, getProjectRoot, getTempRoot, getDownloadsRoot, readAppVersion, emitProgress, registerResult,
  consumeExternalPackageTicket,
  service = { exportFullProjectPackage, restoreFullProjectPackage } }) {
  let busy = false;
  function progressFor(context, operationId) {
    return progress => { try { context.assertActive(); emitProgress(context.sender, operationId, progress); } catch { /* Closing a window must not throw from a ZIP stream event. */ } };
  }
  async function run(action) {
    if (busy) throw new Error('已有完整工程包操作正在执行，不会重复开始');
    busy = true; try { return await action(); } finally { busy = false; }
  }
  return {
    exportFullProjectPackage(payload = {}, context = {}) {
      return run(async () => {
        context.assertActive();
        const summary = validateFullProject(payload.multiData);
        const approval = await dialog.showMessageBox(getMainWindow(), {
          type: 'question', title: '收集完整工程（全部画布）',
          message: `将收集 ${summary.canvasCount} 张画布、${summary.nodeCount} 个节点及引用的本地素材。`,
          detail: '只处理已应用到画布的数据，不含未应用工作室草稿、浏览器队列副本或宿主任务历史。包中含工程正文和节点配置，请勿向不可信方共享。缺失素材/在途任务会阻断，不下载远程素材、不生成媒体。原工程不另行自动保存；只创建新包，不覆盖旧包。开始后不能中途取消，异常退出可能残留临时文件。',
          buttons: ['取消', '继续选择新文件'], defaultId: 0, cancelId: 0, noLink: true,
        });
        if (approval.response !== 1) return { success: false, canceled: true };
        context.assertActive();
        const chosen = await dialog.showSaveDialog(getMainWindow(), {
          title: '保存完整工程包（请使用新文件名）', defaultPath: path.join(getDownloadsRoot(), sanitizeProjectName(payload.projectName || '完整工程') + '.aicpkg'),
          filters: [{ name: 'updream canvas Project Package', extensions: ['aicpkg'] }],
        });
        if (chosen.canceled || !chosen.filePath) return { success: false, canceled: true };
        context.assertActive();
        return await service.exportFullProjectPackage({ outputPath: path.extname(chosen.filePath) ? chosen.filePath : chosen.filePath + '.aicpkg',
          multiData: payload.multiData, projectName: payload.projectName || '', projectId: payload.projectId || '', appVersion: readAppVersion(),
          roots: getRoots(), assertActive: context.assertActive, onProgress: progressFor(context, payload.operationId) });
      });
    },
    restoreFullProjectPackage(payload = {}, context = {}) {
      return run(async () => {
        context.assertActive();
        // OS events carry a one-use host handle; normal/menu restores still require a native picker.
        const fromOS = Object.prototype.hasOwnProperty.call(payload, 'externalPackageTicket');
        let packagePath;
        if (fromOS) {
          if (typeof consumeExternalPackageTicket !== 'function') throw new Error('系统工程包恢复宿主未就绪，请更新并重启');
          packagePath = consumeExternalPackageTicket(payload.externalPackageTicket);
          if (typeof packagePath !== 'string' || !path.isAbsolute(packagePath) || path.extname(packagePath).toLowerCase() !== '.aicpkg') throw new Error('系统工程包路径无效');
        } else {
          const chosen = await dialog.showOpenDialog(getMainWindow(), { title: '恢复完整工程包为独立工程', properties: ['openFile'], filters: [{ name: 'updream canvas Project Package', extensions: ['aicpkg'] }] });
          if (chosen.canceled || !chosen.filePaths?.[0]) return { success: false, canceled: true };
          packagePath = chosen.filePaths[0];
        }
        context.assertActive();
        const result = await service.restoreFullProjectPackage({ packagePath, roots: getRoots(), projectRoot: getProjectRoot(), tempRoot: getTempRoot(),
          assertActive: context.assertActive, onProgress: progressFor(context, payload.operationId),
          confirm: async summary => {
            context.assertActive();
            const approval = await dialog.showMessageBox(getMainWindow(), { type: 'question', title: '工程包校验通过，确认落盘',
              message: `${summary.canvasCount} 张画布、${summary.nodeCount} 个节点、${summary.assetsCount} 个素材`,
              detail: `${fromOS ? `系统打开的包：${packagePath}\n` : ''}素材 ${(summary.totalBytes / 1024 ** 2).toFixed(1)} MiB。将创建独立素材目录及新的.aicanvas，不覆盖现有工程/素材。SHA-256只验证包内一致性，不是可信签名，请只恢复可信来源。完成后前端另行确认是否切换；放弃切换也保留落盘工程。节点打开后的原媒体/外部资源加载行为仍可能发生。`,
              buttons: ['取消', '确认恢复到新文件'], defaultId: 0, cancelId: 0, noLink: true });
            context.assertActive(); return approval.response === 1;
          } });
        if (!result.success) return result;
        // Files already exist. Failure to register recents must not disguise them as rolled back.
        try { return { ...registerResult(result), success: true, fullPackageVersion: 1, canvasCount: result.canvasCount, assetsCount: result.assetsCount, projectPath: result.projectPath, cleanupWarnings: result.cleanupWarnings }; }
        catch (error) { return { ...result, fullPackageVersion: 1, displayPath: result.projectPath, filename: path.basename(result.projectPath), recentId: '', recentRegistrationError: String(error?.message || error) }; }
      });
    },
  };
}
