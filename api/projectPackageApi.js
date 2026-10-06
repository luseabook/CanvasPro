import { post } from './requester.js';
const PROJECT_PACKAGE_UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;
function normalizeProjectPackageFilename(error) {
  const value = String(error?.name || '').trim();
  if (!/\.aicpkg$/i.test(value)) throw new Error('只支持 .aicpkg 项目包');
  return value;
}
export async function stageProjectPackageFile(item, signal = {}) {
  const projectPackageFilename = normalizeProjectPackageFilename(item),
    args = await post(
      '/api/v2/desktop/project/stage-package?filename=' + encodeURIComponent(projectPackageFilename),
      item,
      {
        provider: 'local',
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: PROJECT_PACKAGE_UPLOAD_TIMEOUT_MS,
        retries: 0,
        signal: signal.signal,
      },
    ),
    path = String(args?.path || '').trim(),
    stageId = String(args?.stageId || '').trim();
  if (!path || !stageId) throw new Error('项目包暂存失败：本地服务未返回有效路径');
  return { ...args, path: path, stageId: stageId };
}
export async function discardStagedProjectPackage(key) {
  const stageId2 = String(key || '').trim();
  if (!stageId2) return { success: true, removed: false };
  return await post(
    '/api/v2/desktop/project/discard-staged-package',
    { stageId: stageId2 },
    { provider: 'local', retries: 0 },
  );
}
