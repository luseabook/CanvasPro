export const CHROME_DOWNLOAD_URL = 'https://www.google.com/chrome/';
async function openChromeDownload(shellApi) {
  try {
    await shellApi?.['openExternal']?.(CHROME_DOWNLOAD_URL);
  } catch {}
}
export async function promptForMissingChromeShellBrowser({
  dialogApi: dialogApi,
  shellApi: shellApi,
  appName: appName = 'updream canvas',
} = {}) {
  if (typeof dialogApi?.['showMessageBox'] !== 'function') return 'quit';
  try {
    const response = await dialogApi['showMessageBox']({
      type: 'warning',
      title: appName + ' 启动提示',
      message: '未检测到\x20Chrome\x20浏览器内核',
      detail: [
        '缺少\x20Chrome\x20浏览器内核，部分功能将无法正常使用。',
        '请重新下载安装最新版 Google Chrome 浏览器，然后重新启动 ' + appName + '。',
        '',
        '也可以暂时进入兼容模式。',
        '兼容模式下部分功能不可用，包括部分视频截帧和关键帧功能。',
      ]['join']('\x0a'),
      buttons: ['重新下载 Chrome', '进入兼容模式', '退出'],
      defaultId: 0x0,
      cancelId: 0x2,
      noLink: true,
    });
    if (Number(response?.['response']) === 0x0) return (await openChromeDownload(shellApi), 'download');
    return Number(response?.['response']) === 0x1 ? 'electron' : 'quit';
  } catch {
    return 'quit';
  }
}
export async function promptForChromeShellStartupFailure({
  dialogApi: dialogApi,
  shellApi: shellApi,
  appName: appName = 'updream canvas',
  error: error,
} = {}) {
  if (error?.['code'] === 'CHROME_SHELL_STARTUP_CANCELLED') return 'quit';
  if (typeof dialogApi?.['showMessageBox'] !== 'function') return 'quit';
  try {
    if (error?.['code'] === 'CHROME_SHELL_RENDERER_READY_TIMEOUT') {
      const profileRecoveryError = error['profileRecoveryError'],
        causeCode = String(profileRecoveryError?.['cause']?.['code'] || ''),
        isProfileLocked = ['EPERM', 'EACCES', 'EBUSY']['includes'](causeCode),
        timeoutDetail = isProfileLocked
          ? '自动恢复未完成：浏览器配置目录仍被占用，或访问被系统拒绝（' + causeCode + '）。'
          : profileRecoveryError
            ? '自动恢复浏览器配置未完成，原配置目录已保留，请导出诊断包排查。'
            : '浏览器已启动，但画布页面未在规定时间内回报就绪。',
        timeoutResponse = await dialogApi['showMessageBox']({
          type: 'error',
          title: appName + ' 启动超时',
          message: '画布页面未能就绪',
          detail: [
            timeoutDetail,
            '请先保存工作并退出画布；Windows 用户可重启 Windows 后再启动一次。',
            '若仍然失败，请进入兼容模式并导出诊断包，不要删除配置目录。',
            '',
            '兼容模式下部分功能不可用，包括部分视频截帧和关键帧功能。',
          ]['join']('\x0a'),
          buttons: ['进入兼容模式', '退出'],
          defaultId: 0x0,
          cancelId: 0x1,
          noLink: true,
        });
      return Number(timeoutResponse?.['response']) === 0x0 ? 'electron' : 'quit';
    }
    const failureResponse = await dialogApi['showMessageBox']({
      type: 'error',
      title: appName + ' 启动失败',
      message: '画布未能完成加载',
      detail: [
        error?.['details']?.['stage'] === 'storage-migration'
          ? '升级数据恢复未完成，已停止进入画布，原迁移数据仍保留。'
          : error?.['details']?.['stage'] === 'project-hydration'
            ? '项目恢复未完成，已停止进入画布。'
            : error?.['code'] === 'CHROME_SHELL_EXITED_BEFORE_READY'
              ? '画布加载完成前，浏览器进程异常退出。'
              : '画布启动过程中遇到错误。',
        String(error?.['message'] || error || '未知错误'),
        '',
        '请进入兼容模式并导出诊断包，以便检查页面加载、数据恢复或浏览器进程的错误。',
        '',
        '也可以暂时进入兼容模式。',
        '兼容模式下部分功能不可用，包括部分视频截帧和关键帧功能。',
      ]['join']('\x0a'),
      buttons: ['进入兼容模式', '退出'],
      defaultId: 0x0,
      cancelId: 0x1,
      noLink: true,
    });
    return Number(failureResponse?.['response']) === 0x0 ? 'electron' : 'quit';
  } catch {
    return 'quit';
  }
}
