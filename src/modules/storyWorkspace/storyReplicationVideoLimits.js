import { getModelManifest } from '../../manifests/modelRegistry.js';
export const STORY_REPLICATION_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VOLCENGINE_MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export function getStoryReplicationVideoMaxBytes(value = '') {
  return getModelManifest(value)?.['provider'] === 'volcengine'
    ? VOLCENGINE_MAX_VIDEO_BYTES
    : STORY_REPLICATION_MAX_VIDEO_BYTES;
}
export function validateStoryReplicationVideoSize(error = {}, item = '') {
  const storyReplicationVideoMaxBytes = getStoryReplicationVideoMaxBytes(item);
  return Number(error['size']) > storyReplicationVideoMaxBytes
    ? {
        ok: ![],
        error:
          '“' +
          (error['name'] || '原视频') +
          '”超过当前模型 ' +
          storyReplicationVideoMaxBytes / 1024 / 1024 +
          'MB 上限，请压缩视频或选择支持更大文件的模型。',
      }
    : { ok: !![], error: '' };
}
