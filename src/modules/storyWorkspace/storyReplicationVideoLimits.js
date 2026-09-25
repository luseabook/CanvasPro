import { getModelManifest } from '../../manifests/modelRegistry.js';
export const STORY_REPLICATION_MAX_VIDEO_BYTES = 0x64 * 0x400 * 0x400;
const VOLCENGINE_MAX_VIDEO_BYTES = 0x1f4 * 0x400 * 0x400;
export function getStoryReplicationVideoMaxBytes(_0x23cef2 = '') {
  return getModelManifest(_0x23cef2)?.['provider'] === 'volcengine'
    ? VOLCENGINE_MAX_VIDEO_BYTES
    : STORY_REPLICATION_MAX_VIDEO_BYTES;
}
export function validateStoryReplicationVideoSize(_0x12053d = {}, _0x2eb30d = '') {
  const _0x1f932f = getStoryReplicationVideoMaxBytes(_0x2eb30d);
  return Number(_0x12053d['size']) > _0x1f932f
    ? {
        ok: ![],
        error:
          '“' +
          (_0x12053d['name'] || '原视频') +
          '”超过当前模型 ' +
          _0x1f932f / 0x400 / 0x400 +
          'MB 上限，请压缩视频或选择支持更大文件的模型。',
      }
    : { ok: !![], error: '' };
}
