import { get, post } from './requester.js';
import { processInputImages } from './imageUploadApi.js';
import { processInputVideos } from './videoUploadApi.js';
import { processInputAudios } from './audioUploadApi.js';
import { isApimartAssetUrl, isApimartUploadedUrl, normalizeApimartBaseUrl } from './apimartUploadApi.js';
import { DEFAULT_APIMART_API_URL } from '../src/modules/providers.js';
const DEFAULT_APIMART_BASE_URL = DEFAULT_APIMART_API_URL,
  DEFAULT_PROJECT_NAME = 'default',
  DEFAULT_GROUP_NAME = 'aic-seedance2-private-avatar',
  MAX_PRIVATE_AVATAR_ASSET_NAME_LENGTH = 64,
  TERMINAL_SUCCESS_STATUSES = new Set(['completed', 'complete', 'succeeded', 'success', 'done']),
  TERMINAL_FAILED_STATUSES = new Set(['failed', 'failure', 'error', 'rejected']);
function normalizeBaseUrl(_0x1b1253) {
  return normalizeApimartBaseUrl(_0x1b1253 || DEFAULT_APIMART_BASE_URL);
}
function normalizeApiKey(_0x216bcd) {
  return String(_0x216bcd || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
}
function sleep(_0x10a6bf) {
  return new Promise((_0x149e07) => setTimeout(_0x149e07, Math.max(0, _0x10a6bf || 0)));
}
function asPlainObject(_0x537d55) {
  return _0x537d55 && typeof _0x537d55 === 'object' && !Array.isArray(_0x537d55) ? _0x537d55 : {};
}
function normalizePrivateAvatarAssetType(_0x31ecc5) {
  const _0x3e5ad2 = String(_0x31ecc5 || '')
    .trim()
    .toLowerCase();
  if (_0x3e5ad2 === 'video') return 'Video';
  if (_0x3e5ad2 === 'audio') return 'Audio';
  return 'Image';
}
function collectObjects(_0x11d3bf, _0x13d295 = []) {
  if (!_0x11d3bf || typeof _0x11d3bf !== 'object') return _0x13d295;
  if (Array.isArray(_0x11d3bf))
    return (_0x11d3bf.forEach((_0x1bc27c) => collectObjects(_0x1bc27c, _0x13d295)), _0x13d295);
  _0x13d295.push(_0x11d3bf);
  for (const _0x337b74 of Object.values(_0x11d3bf)) {
    if (_0x337b74 && typeof _0x337b74 === 'object') collectObjects(_0x337b74, _0x13d295);
  }
  return _0x13d295;
}
function pickFirstString(_0x536a15) {
  for (const _0x455cef of _0x536a15) {
    const _0x18943a = String(_0x455cef || '').trim();
    if (_0x18943a) return _0x18943a;
  }
  return '';
}
export function extractApimartPrivateAvatarAssetUrl(_0x2e61a1) {
  const _0x37c8f1 = asPlainObject(_0x2e61a1),
    _0x5d0dbe = asPlainObject(_0x37c8f1.data),
    _0x2da073 = asPlainObject(_0x5d0dbe.result || _0x37c8f1.result),
    _0x2699d4 = pickFirstString([
      _0x2da073.asset_url,
      _0x2da073.assetUrl,
      _0x5d0dbe.asset_url,
      _0x5d0dbe.assetUrl,
      _0x37c8f1.asset_url,
      _0x37c8f1.assetUrl,
    ]);
  if (_0x2699d4) return _0x2699d4;
  const _0x410b9f = [
    _0x2da073.usable_assets,
    _0x2da073.usableAssets,
    _0x5d0dbe.usable_assets,
    _0x5d0dbe.usableAssets,
    _0x2da073.assets,
    _0x5d0dbe.assets,
    _0x37c8f1.usable_assets,
    _0x37c8f1.assets,
  ];
  for (const _0x1b719b of _0x410b9f) {
    const _0x5ad78d = collectObjects(_0x1b719b, []);
    for (const _0x146d2a of _0x5ad78d) {
      const _0x488518 = String(_0x146d2a.status || '')
          .trim()
          .toLowerCase(),
        _0x2be05d = pickFirstString([_0x146d2a.asset_url, _0x146d2a.assetUrl, _0x146d2a.url]);
      if (!_0x2be05d) continue;
      if (!_0x488518 || _0x488518 === 'active' || _0x488518 === 'passed' || _0x488518 === 'success')
        return _0x2be05d;
    }
  }
  return '';
}
export function extractApimartPrivateAvatarTaskId(_0x5eb788) {
  const _0x284af8 = asPlainObject(_0x5eb788),
    _0x44ac70 = asPlainObject(_0x284af8.data);
  return pickFirstString([
    _0x44ac70.id,
    _0x44ac70.task_id,
    _0x44ac70.taskId,
    _0x284af8.id,
    _0x284af8.task_id,
    _0x284af8.taskId,
  ]);
}
export function extractApimartPrivateAvatarTaskStatus(_0x28e425) {
  const _0x4637cb = asPlainObject(_0x28e425),
    _0x33e046 = asPlainObject(_0x4637cb.data);
  return String(_0x33e046.status || _0x4637cb.status || '')
    .trim()
    .toLowerCase();
}
function extractApimartPrivateAvatarError(_0x5cfa3e) {
  const _0x7f8e57 = asPlainObject(_0x5cfa3e),
    _0x2b845a = asPlainObject(_0x7f8e57.data),
    _0x47f8ce = asPlainObject(_0x7f8e57.error || _0x2b845a.error);
  return pickFirstString([
    _0x47f8ce.message,
    _0x47f8ce.msg,
    _0x2b845a.message,
    _0x2b845a.msg,
    _0x7f8e57.message,
    _0x7f8e57.msg,
  ]);
}
function assertApimartApiCodeOk(_0x39f947, _0x13866c) {
  const _0x550548 = Number(_0x39f947?.code);
  if (Number.isFinite(_0x550548) && _0x550548 !== 200 && _0x550548 !== 0)
    throw new Error(extractApimartPrivateAvatarError(_0x39f947) || _0x13866c);
}
function buildPrivateAvatarPollUrl({ baseUrl: _0x2ea212, taskId: _0x4f3443 }) {
  return normalizeBaseUrl(_0x2ea212) + '/v1/tasks/' + encodeURIComponent(_0x4f3443) + '?language=zh';
}
async function resolvePrivateAvatarInputUrl(_0x45069d, _0x328d76, _0x1e1c2f, _0x2ee117 = {}) {
  const _0x34cc66 = String(_0x45069d || '').trim();
  if (!_0x34cc66) throw new Error('人脸检测输入地址为空');
  if (isApimartAssetUrl(_0x34cc66)) throw new Error('该素材已经是 APIMart asset URL，无需再次人脸检测');
  if (isApimartUploadedUrl(_0x34cc66)) return _0x34cc66;
  const _0x425c2f = {
    provider: 'apimart',
    strictUpload: true,
    compress: _0x1e1c2f === 'Image' ? _0x2ee117.compress !== false : false,
    apiKey: _0x328d76,
    apiUrl: _0x2ee117.apiUrl,
  };
  if (_0x1e1c2f === 'Video') {
    const _0x5647a6 = await processInputVideos([_0x34cc66], _0x328d76, _0x425c2f);
    return String(_0x5647a6?.[0] || '').trim();
  }
  if (_0x1e1c2f === 'Audio') {
    const _0x3110b7 = await processInputAudios([_0x34cc66], _0x328d76, _0x425c2f);
    return String(_0x3110b7?.[0] || '').trim();
  }
  const _0x423615 = await processInputImages([_0x34cc66], _0x328d76, _0x425c2f);
  return String(_0x423615?.[0] || '').trim();
}
function sanitizePrivateAvatarAssetName(_0xe21b95, _0x556549) {
  const _0x57e694 = _0x556549 === 'Video' ? 'video' : _0x556549 === 'Audio' ? 'audio' : 'image',
    _0x3a9b06 = String(_0xe21b95 || _0x57e694).trim();
  return _0x3a9b06.replace(/[\\/:*?"<>|]/g, '_').slice(0, MAX_PRIVATE_AVATAR_ASSET_NAME_LENGTH) || _0x57e694;
}
function assertPrivateAvatarPublicUrl(_0x2fdbb6) {
  const _0x3c11a3 = String(_0x2fdbb6 || '').trim();
  if (!/^https?:\/\//i.test(_0x3c11a3)) throw new Error('APIMart 人脸检测素材未获得公网 URL，已停止提交');
  try {
    const _0x47a7c2 = new URL(_0x3c11a3).hostname.toLowerCase();
    if (
      _0x47a7c2 === 'localhost' ||
      _0x47a7c2 === '127.0.0.1' ||
      _0x47a7c2 === '::1' ||
      _0x47a7c2.endsWith('.local')
    )
      throw new Error('APIMart 人脸检测素材仍是本地地址，已停止提交');
  } catch (_0x5366ff) {
    if (_0x5366ff instanceof TypeError) throw new Error('APIMart 人脸检测素材 URL 无效，已停止提交');
    throw _0x5366ff;
  }
}
export async function pollApimartPrivateAvatarTask({
  apiKey: _0x58b163,
  apiUrl: _0x50d874,
  taskId: _0x32fdba,
  pollIntervalMs: pollIntervalMs = 0x9c4,
  maxWaitMs: maxWaitMs = 0x1d4c0,
  signal: _0x441fbe,
} = {}) {
  const _0xd92175 = normalizeApiKey(_0x58b163);
  if (!_0xd92175) throw new Error('APIMART API Key 未配置');
  const _0x14d9e4 = String(_0x32fdba || '').trim();
  if (!_0x14d9e4) throw new Error('APIMART 人脸检测任务 ID 为空');
  const _0x51db0b = Date.now();
  while (Date.now() - _0x51db0b <= maxWaitMs) {
    if (_0x441fbe?.aborted) throw new DOMException('Aborted', 'AbortError');
    const _0x3fb2c1 = buildPrivateAvatarPollUrl({ baseUrl: _0x50d874, taskId: _0x14d9e4 }),
      _0x3e2e63 = await get('/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x3fb2c1), {
        provider: 'apimart',
        headers: { Authorization: 'Bearer ' + _0xd92175 },
        timeout: 0xea60,
        signal: _0x441fbe,
      });
    assertApimartApiCodeOk(_0x3e2e63, 'APIMART 人脸检测查询失败');
    const _0x19f916 = extractApimartPrivateAvatarAssetUrl(_0x3e2e63),
      _0x2e69b0 = extractApimartPrivateAvatarTaskStatus(_0x3e2e63);
    if (_0x19f916 && (TERMINAL_SUCCESS_STATUSES.has(_0x2e69b0) || TERMINAL_FAILED_STATUSES.has(_0x2e69b0)))
      return { status: 'passed', taskId: _0x14d9e4, assetUrl: _0x19f916, raw: _0x3e2e63 };
    if (TERMINAL_FAILED_STATUSES.has(_0x2e69b0))
      throw new Error(extractApimartPrivateAvatarError(_0x3e2e63) || 'APIMART 人脸检测未通过');
    if (TERMINAL_SUCCESS_STATUSES.has(_0x2e69b0))
      throw new Error('APIMART 人脸检测已完成但未返回可用 asset URL');
    await sleep(pollIntervalMs);
  }
  throw new Error('APIMART 人脸检测超时，请稍后重试');
}
export async function submitApimartSeedance2PrivateAvatar({
  apiKey: _0x17a2fa,
  apiUrl: _0x1beb87,
  url: _0x3c38d3,
  name: _0xc6cee8,
  assetType: assetType = 'Image',
  group: _0x3c2a76,
  groupId: _0xd69776,
  projectName: projectName = DEFAULT_PROJECT_NAME,
  poll: poll = true,
  pollIntervalMs: _0x590583,
  maxWaitMs: _0x292e57,
  signal: _0x469c4f,
} = {}) {
  const _0x366d0e = normalizeApiKey(_0x17a2fa);
  if (!_0x366d0e) throw new Error('APIMART API Key 未配置');
  const _0xd22745 = normalizeBaseUrl(_0x1beb87),
    _0x9d56ad = normalizePrivateAvatarAssetType(assetType),
    _0x38a790 = await resolvePrivateAvatarInputUrl(_0x3c38d3, _0x366d0e, _0x9d56ad, { apiUrl: _0xd22745 });
  if (!_0x38a790) throw new Error('APIMART 人脸检测素材上传失败');
  assertPrivateAvatarPublicUrl(_0x38a790);
  const _0x58d4d8 = sanitizePrivateAvatarAssetName(_0xc6cee8, _0x9d56ad),
    _0x135350 = {
      project_name: projectName || DEFAULT_PROJECT_NAME,
      asset_type: _0x9d56ad,
      assets: [{ url: _0x38a790, name: _0x58d4d8 }],
    },
    _0x4a30cf = String(_0xd69776 || '').trim();
  _0x4a30cf
    ? (_0x135350.group_id = _0x4a30cf)
    : (_0x135350.group = {
        name: String(_0x3c2a76?.name || DEFAULT_GROUP_NAME).trim() || DEFAULT_GROUP_NAME,
        description: String(_0x3c2a76?.description || 'updream canvas Seedance 2.0 private avatar assets').trim(),
      });
  const _0x2df3c9 = await post(
    '/api/v2/proxy/image',
    { apiUrl: _0xd22745 + '/v1/seedance2/private-avatar', apiKey: _0x366d0e, ..._0x135350 },
    { provider: 'apimart', timeout: 0x1d4c0, signal: _0x469c4f },
  );
  assertApimartApiCodeOk(_0x2df3c9, 'APIMART 人脸检测提交失败');
  const _0x464239 = extractApimartPrivateAvatarAssetUrl(_0x2df3c9),
    _0x5ea9fd = extractApimartPrivateAvatarTaskId(_0x2df3c9);
  if (_0x464239)
    return {
      status: 'passed',
      taskId: _0x5ea9fd,
      assetUrl: _0x464239,
      sourceUrl: _0x38a790,
      assetType: _0x9d56ad,
      raw: _0x2df3c9,
    };
  if (!_0x5ea9fd) throw new Error('APIMART 人脸检测提交失败：未返回任务 ID');
  if (!poll)
    return {
      status: extractApimartPrivateAvatarTaskStatus(_0x2df3c9) || 'processing',
      taskId: _0x5ea9fd,
      sourceUrl: _0x38a790,
      assetType: _0x9d56ad,
      raw: _0x2df3c9,
    };
  const _0x51731f = await pollApimartPrivateAvatarTask({
    apiKey: _0x366d0e,
    apiUrl: _0xd22745,
    taskId: _0x5ea9fd,
    pollIntervalMs: _0x590583,
    maxWaitMs: _0x292e57,
    signal: _0x469c4f,
  });
  return { ..._0x51731f, sourceUrl: _0x38a790, assetType: _0x9d56ad };
}
