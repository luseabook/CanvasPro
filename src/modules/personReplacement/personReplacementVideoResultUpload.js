import { pickResultLocalPath } from '../../utils/localMediaPath.js';
import { createPersonReplacementVideoGenerationRevision } from './personReplacementVideoTaskRuntime.js';
import { isPersonReplacementVideoFile } from './personReplacementWorkspaceInput.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveOriginalRef(response = {}) {
  return normalizeText(
    response['originalLocalPath'] || response['localPath'] || response['originalUrl'] || response['url'],
  );
}
function resolvePlaybackRef(response2 = {}) {
  return normalizeText(
    response2['displayLocalPath'] ||
      response2['displayUrl'] ||
      pickResultLocalPath(response2) ||
      response2['videoUrl'] ||
      response2['url'],
  );
}
function resolvePosterRef(options = {}) {
  return normalizeText(
    options['posterLocalPath'] || options['thumbLocalPath'] || options['posterUrl'] || options['thumbUrl'],
  );
}
export async function uploadPersonReplacementVideoResult({
  file: file,
  context: context = {},
  project: project,
  uploadFile: uploadFile,
  prepareUploadedVideoAsset: prepareUploadedVideoAsset,
  videoTaskRuntime: videoTaskRuntime,
  now: now = () => new Date()['toISOString'](),
  showToast: showToast = () => {},
} = {}) {
  if (!file || typeof uploadFile !== 'function') return null;
  if (!isPersonReplacementVideoFile(file)) throw new Error('请选择视频文件');
  const shotId = normalizeText(context['shotId']),
    shot = project?.['shots']?.['find']((item) => item['id'] === shotId);
  if (!shot) throw new Error('当前片段不可用');
  const expectedProjectId = project['id'],
    expectedShotRevision = createPersonReplacementVideoGenerationRevision({ project: project, shot: shot }),
    response3 = await prepareUploadedVideoAsset(await uploadFile(file, expectedProjectId)),
    videoRef = resolveOriginalRef(response3),
    playbackVideoRef = resolvePlaybackRef(response3);
  if (!videoRef || !playbackVideoRef) throw new Error('替换视频保存结果缺少可播放地址');
  const project2 = videoTaskRuntime['acceptUploadedResult']({
    shotId: shotId,
    videoRef: videoRef,
    playbackVideoRef: playbackVideoRef,
    posterRef: resolvePosterRef(response3),
    assetId: normalizeText(response3['assetId']),
    derivativeStatus: normalizeText(response3['derivativeStatus'] || response3['status']),
    videoProxyStatus: normalizeText(response3['videoProxyStatus']),
    fileName: normalizeText(file['name']),
    createdAt: now(),
    expectedProjectId: expectedProjectId,
    expectedShotRevision: expectedShotRevision,
  });
  if (!project2) return null;
  return (showToast('替换视频已加入当前片段。', 'success'), { project: project2 });
}
