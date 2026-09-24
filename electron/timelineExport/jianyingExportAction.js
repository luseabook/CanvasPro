import path from 'node:path';
import { homedir } from 'node:os';
import { stat } from 'node:fs/promises';

export async function findJianyingExecutable({
  platform = process.platform,
  localAppData = process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'),
  inspect = stat,
} = {}) {
  if (platform !== 'win32' || !path.isAbsolute(localAppData)) return '';
  const candidate = path.join(localAppData, 'JianyingPro', 'Apps', 'JianyingPro.exe');
  try {
    return (await inspect(candidate)).isFile() ? candidate : '';
  } catch {
    return '';
  }
}
export function createOpenJianyingOperation({
  openPath,
  findExecutable = findJianyingExecutable,
} = {}) {
  return async () => {
    try {
      const executable = await findExecutable();
      if (!executable) return { success: false, error: '未找到剪映启动程序，请手动打开剪映。' };
      const failure = await openPath(executable);
      if (failure) throw new Error(failure);
      return { success: true };
    } catch {
      return { success: false, error: '暂时无法自动打开剪映，请手动打开。' };
    }
  };
}
