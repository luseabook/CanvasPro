import { post } from './requester.js';
const PROJECT_PACKAGE_UPLOAD_TIMEOUT_MS = 0x1e * 0x3c * 0x3e8;
function normalizeProjectPackageFilename(_0x2b9c4f) {
  const _0x2ea023 = String(_0x2b9c4f?.['name'] || '')['trim']();
  if (!/\.aicpkg$/i['test'](_0x2ea023)) throw new Error('只支持 .aicpkg 项目包');
  return _0x2ea023;
}
export async function stageProjectPackageFile(_0x529242, _0x439425 = {}) {
  const _0x2f2c6d = normalizeProjectPackageFilename(_0x529242),
    _0x118313 = await post(
      '/api/v2/desktop/project/stage-package?filename=' + encodeURIComponent(_0x2f2c6d),
      _0x529242,
      {
        provider: 'local',
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: PROJECT_PACKAGE_UPLOAD_TIMEOUT_MS,
        retries: 0x0,
        signal: _0x439425['signal'],
      },
    ),
    _0x5b7953 = String(_0x118313?.['path'] || '')['trim'](),
    _0x4f70e3 = String(_0x118313?.['stageId'] || '')['trim']();
  if (!_0x5b7953 || !_0x4f70e3) throw new Error('项目包暂存失败：本地服务未返回有效路径');
  return { ..._0x118313, path: _0x5b7953, stageId: _0x4f70e3 };
}
export async function discardStagedProjectPackage(_0x3599cb) {
  const _0x322c3a = String(_0x3599cb || '')['trim']();
  if (!_0x322c3a) return { success: !![], removed: ![] };
  return await post(
    '/api/v2/desktop/project/discard-staged-package',
    { stageId: _0x322c3a },
    { provider: 'local', retries: 0x0 },
  );
}
