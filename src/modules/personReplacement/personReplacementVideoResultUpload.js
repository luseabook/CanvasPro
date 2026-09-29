import { pickResultLocalPath } from '../../utils/localMediaPath.js';
import { createPersonReplacementVideoGenerationRevision } from './personReplacementVideoTaskRuntime.js';
import { isPersonReplacementVideoFile } from './personReplacementWorkspaceInput.js';
function normalizeText(_0x1aee83) {
  return String(_0x1aee83 ?? '')['trim']();
}
function resolveOriginalRef(_0x3cb44c = {}) {
  return normalizeText(
    _0x3cb44c['originalLocalPath'] || _0x3cb44c['localPath'] || _0x3cb44c['originalUrl'] || _0x3cb44c['url'],
  );
}
function resolvePlaybackRef(_0x1af66f = {}) {
  return normalizeText(
    _0x1af66f['displayLocalPath'] ||
      _0x1af66f['displayUrl'] ||
      pickResultLocalPath(_0x1af66f) ||
      _0x1af66f['videoUrl'] ||
      _0x1af66f['url'],
  );
}
function resolvePosterRef(_0x43c278 = {}) {
  return normalizeText(
    _0x43c278['posterLocalPath'] ||
      _0x43c278['thumbLocalPath'] ||
      _0x43c278['posterUrl'] ||
      _0x43c278['thumbUrl'],
  );
}
export async function uploadPersonReplacementVideoResult({
  file: _0x5808db,
  context: context = {},
  project: _0x4f781e,
  uploadFile: _0x24c411,
  prepareUploadedVideoAsset: _0xb44762,
  videoTaskRuntime: _0x527368,
  now: now = () => new Date()['toISOString'](),
  showToast: showToast = () => {},
} = {}) {
  if (!_0x5808db || typeof _0x24c411 !== 'function') return null;
  if (!isPersonReplacementVideoFile(_0x5808db)) throw new Error('请选择视频文件');
  const _0x188aec = normalizeText(context['shotId']),
    _0x49836a = _0x4f781e?.['shots']?.['find']((_0x7666a7) => _0x7666a7['id'] === _0x188aec);
  if (!_0x49836a) throw new Error('当前片段不可用');
  const _0x2606ba = _0x4f781e['id'],
    _0xe0bc34 = createPersonReplacementVideoGenerationRevision({ project: _0x4f781e, shot: _0x49836a }),
    _0x537a1d = await _0xb44762(await _0x24c411(_0x5808db, _0x2606ba)),
    _0x1131de = resolveOriginalRef(_0x537a1d),
    _0xa8a1a9 = resolvePlaybackRef(_0x537a1d);
  if (!_0x1131de || !_0xa8a1a9) throw new Error('替换视频保存结果缺少可播放地址');
  const _0x39af81 = _0x527368['acceptUploadedResult']({
    shotId: _0x188aec,
    videoRef: _0x1131de,
    playbackVideoRef: _0xa8a1a9,
    posterRef: resolvePosterRef(_0x537a1d),
    assetId: normalizeText(_0x537a1d['assetId']),
    derivativeStatus: normalizeText(_0x537a1d['derivativeStatus'] || _0x537a1d['status']),
    videoProxyStatus: normalizeText(_0x537a1d['videoProxyStatus']),
    fileName: normalizeText(_0x5808db['name']),
    createdAt: now(),
    expectedProjectId: _0x2606ba,
    expectedShotRevision: _0xe0bc34,
  });
  if (!_0x39af81) return null;
  return (showToast('替换视频已加入当前片段。', 'success'), { project: _0x39af81 });
}
