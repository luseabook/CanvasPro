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
function normalizeBaseUrl(value) {
  return normalizeApimartBaseUrl(value || DEFAULT_APIMART_BASE_URL);
}
function normalizeApiKey(item) {
  return String(item || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
}
function sleep(key) {
  return new Promise((index) => setTimeout(index, Math.max(0, key || 0)));
}
function asPlainObject(result) {
  return result && typeof result === 'object' && !Array.isArray(result) ? result : {};
}
function normalizePrivateAvatarAssetType(data) {
  const options = String(data || '')
    .trim()
    .toLowerCase();
  if (options === 'video') return 'Video';
  if (options === 'audio') return 'Audio';
  return 'Image';
}
function collectObjects(list, list2 = []) {
  if (!list || typeof list !== 'object') return list2;
  if (Array.isArray(list)) return (list.forEach((item2) => collectObjects(item2, list2)), list2);
  list2.push(list);
  for (const target of Object.values(list)) {
    if (target && typeof target === 'object') collectObjects(target, list2);
  }
  return list2;
}
function pickFirstString(source) {
  for (const next of source) {
    const current = String(next || '').trim();
    if (current) return current;
  }
  return '';
}
export function extractApimartPrivateAvatarAssetUrl(entry) {
  const asPlainObject2 = asPlainObject(entry),
    asPlainObject3 = asPlainObject(asPlainObject2.data),
    asPlainObject4 = asPlainObject(asPlainObject3.result || asPlainObject2.result),
    firstString = pickFirstString([
      asPlainObject4.asset_url,
      asPlainObject4.assetUrl,
      asPlainObject3.asset_url,
      asPlainObject3.assetUrl,
      asPlainObject2.asset_url,
      asPlainObject2.assetUrl,
    ]);
  if (firstString) return firstString;
  const record = [
    asPlainObject4.usable_assets,
    asPlainObject4.usableAssets,
    asPlainObject3.usable_assets,
    asPlainObject3.usableAssets,
    asPlainObject4.assets,
    asPlainObject3.assets,
    asPlainObject2.usable_assets,
    asPlainObject2.assets,
  ];
  for (const payload of record) {
    const objects = collectObjects(payload, []);
    for (const response of objects) {
      const enabled = String(response.status || '')
          .trim()
          .toLowerCase(),
        firstString2 = pickFirstString([response.asset_url, response.assetUrl, response.url]);
      if (!firstString2) continue;
      if (!enabled || enabled === 'active' || enabled === 'passed' || enabled === 'success')
        return firstString2;
    }
  }
  return '';
}
export function extractApimartPrivateAvatarTaskId(handle) {
  const asPlainObject5 = asPlainObject(handle),
    asPlainObject6 = asPlainObject(asPlainObject5.data);
  return pickFirstString([
    asPlainObject6.id,
    asPlainObject6.task_id,
    asPlainObject6.taskId,
    asPlainObject5.id,
    asPlainObject5.task_id,
    asPlainObject5.taskId,
  ]);
}
export function extractApimartPrivateAvatarTaskStatus(state) {
  const response2 = asPlainObject(state),
    response3 = asPlainObject(response2.data);
  return String(response3.status || response2.status || '')
    .trim()
    .toLowerCase();
}
function extractApimartPrivateAvatarError(config) {
  const error = asPlainObject(config),
    error2 = asPlainObject(error.data),
    error3 = asPlainObject(error.error || error2.error);
  return pickFirstString([error3.message, error3.msg, error2.message, error2.msg, error.message, error.msg]);
}
function assertApimartApiCodeOk(scope, input) {
  const count = Number(scope?.code);
  if (Number.isFinite(count) && count !== 200 && count !== 0)
    throw new Error(extractApimartPrivateAvatarError(scope) || input);
}
function buildPrivateAvatarPollUrl({ baseUrl: baseUrl, taskId: taskId }) {
  return normalizeBaseUrl(baseUrl) + '/v1/tasks/' + encodeURIComponent(taskId) + '?language=zh';
}
async function resolvePrivateAvatarInputUrl(output, apiKey, compress, apiUrl = {}) {
  const enabled2 = String(output || '').trim();
  if (!enabled2) throw new Error('人脸检测输入地址为空');
  if (isApimartAssetUrl(enabled2)) throw new Error('该素材已经是 APIMart asset URL，无需再次人脸检测');
  if (isApimartUploadedUrl(enabled2)) return enabled2;
  const value2 = {
    provider: 'apimart',
    strictUpload: true,
    compress: compress === 'Image' ? apiUrl.compress !== false : false,
    apiKey: apiKey,
    apiUrl: apiUrl.apiUrl,
  };
  if (compress === 'Video') {
    const processInputVideos2 = await processInputVideos([enabled2], apiKey, value2);
    return String(processInputVideos2?.[0] || '').trim();
  }
  if (compress === 'Audio') {
    const processInputAudios2 = await processInputAudios([enabled2], apiKey, value2);
    return String(processInputAudios2?.[0] || '').trim();
  }
  const processInputImages2 = await processInputImages([enabled2], apiKey, value2);
  return String(processInputImages2?.[0] || '').trim();
}
function sanitizePrivateAvatarAssetName(value3, value4) {
  const value5 = value4 === 'Video' ? 'video' : value4 === 'Audio' ? 'audio' : 'image',
    value6 = String(value3 || value5).trim();
  return value6.replace(/[\\/:*?"<>|]/g, '_').slice(0, MAX_PRIVATE_AVATAR_ASSET_NAME_LENGTH) || value5;
}
function assertPrivateAvatarPublicUrl(value7) {
  const value8 = String(value7 || '').trim();
  if (!/^https?:\/\//i.test(value8)) throw new Error('APIMart 人脸检测素材未获得公网 URL，已停止提交');
  try {
    const uRL = new URL(value8).hostname.toLowerCase();
    if (uRL === 'localhost' || uRL === '127.0.0.1' || uRL === '::1' || uRL.endsWith('.local'))
      throw new Error('APIMart 人脸检测素材仍是本地地址，已停止提交');
  } catch (value9) {
    if (value9 instanceof TypeError) throw new Error('APIMart 人脸检测素材 URL 无效，已停止提交');
    throw value9;
  }
}
export async function pollApimartPrivateAvatarTask({
  apiKey: apiKey2,
  apiUrl: apiUrl2,
  taskId: taskId2,
  pollIntervalMs: pollIntervalMs = 0x9c4,
  maxWaitMs: maxWaitMs = 0x1d4c0,
  signal: signal,
} = {}) {
  const apiKey3 = normalizeApiKey(apiKey2);
  if (!apiKey3) throw new Error('APIMART API Key 未配置');
  const taskId3 = String(taskId2 || '').trim();
  if (!taskId3) throw new Error('APIMART 人脸检测任务 ID 为空');
  const value10 = Date.now();
  while (Date.now() - value10 <= maxWaitMs) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const privateAvatarPollUrl = buildPrivateAvatarPollUrl({ baseUrl: apiUrl2, taskId: taskId3 }),
      raw = await get('/api/v2/proxy/task?apiUrl=' + encodeURIComponent(privateAvatarPollUrl), {
        provider: 'apimart',
        headers: { Authorization: 'Bearer ' + apiKey3 },
        timeout: 0xea60,
        signal: signal,
      });
    assertApimartApiCodeOk(raw, 'APIMART 人脸检测查询失败');
    const assetUrl = extractApimartPrivateAvatarAssetUrl(raw),
      extractApimartPrivateAvatarTaskStatus2 = extractApimartPrivateAvatarTaskStatus(raw);
    if (
      assetUrl &&
      (TERMINAL_SUCCESS_STATUSES.has(extractApimartPrivateAvatarTaskStatus2) ||
        TERMINAL_FAILED_STATUSES.has(extractApimartPrivateAvatarTaskStatus2))
    )
      return { status: 'passed', taskId: taskId3, assetUrl: assetUrl, raw: raw };
    if (TERMINAL_FAILED_STATUSES.has(extractApimartPrivateAvatarTaskStatus2))
      throw new Error(extractApimartPrivateAvatarError(raw) || 'APIMART 人脸检测未通过');
    if (TERMINAL_SUCCESS_STATUSES.has(extractApimartPrivateAvatarTaskStatus2))
      throw new Error('APIMART 人脸检测已完成但未返回可用 asset URL');
    await sleep(pollIntervalMs);
  }
  throw new Error('APIMART 人脸检测超时，请稍后重试');
}
export async function submitApimartSeedance2PrivateAvatar({
  apiKey: apiKey4,
  apiUrl: apiUrl3,
  url: url,
  name: name,
  assetType: assetType = 'Image',
  group: group,
  groupId: groupId,
  projectName: projectName = DEFAULT_PROJECT_NAME,
  poll: poll = true,
  pollIntervalMs: pollIntervalMs2,
  maxWaitMs: maxWaitMs2,
  signal: signal2,
} = {}) {
  const apiKey5 = normalizeApiKey(apiKey4);
  if (!apiKey5) throw new Error('APIMART API Key 未配置');
  const apiUrl4 = normalizeBaseUrl(apiUrl3),
    asset_type = normalizePrivateAvatarAssetType(assetType),
    url2 = await resolvePrivateAvatarInputUrl(url, apiKey5, asset_type, { apiUrl: apiUrl4 });
  if (!url2) throw new Error('APIMART 人脸检测素材上传失败');
  assertPrivateAvatarPublicUrl(url2);
  const name2 = sanitizePrivateAvatarAssetName(name, asset_type),
    args = {
      project_name: projectName || DEFAULT_PROJECT_NAME,
      asset_type: asset_type,
      assets: [{ url: url2, name: name2 }],
    },
    value11 = String(groupId || '').trim();
  value11
    ? (args.group_id = value11)
    : (args.group = {
        name: String(group?.name || DEFAULT_GROUP_NAME).trim() || DEFAULT_GROUP_NAME,
        description: String(group?.description || 'Canvas Seedance 2.0 private avatar assets').trim(),
      });
  const raw2 = await post(
    '/api/v2/proxy/image',
    { apiUrl: apiUrl4 + '/v1/seedance2/private-avatar', apiKey: apiKey5, ...args },
    { provider: 'apimart', timeout: 0x1d4c0, signal: signal2 },
  );
  assertApimartApiCodeOk(raw2, 'APIMART 人脸检测提交失败');
  const assetUrl2 = extractApimartPrivateAvatarAssetUrl(raw2),
    taskId4 = extractApimartPrivateAvatarTaskId(raw2);
  if (assetUrl2)
    return {
      status: 'passed',
      taskId: taskId4,
      assetUrl: assetUrl2,
      sourceUrl: url2,
      assetType: asset_type,
      raw: raw2,
    };
  if (!taskId4) throw new Error('APIMART 人脸检测提交失败：未返回任务 ID');
  if (!poll)
    return {
      status: extractApimartPrivateAvatarTaskStatus(raw2) || 'processing',
      taskId: taskId4,
      sourceUrl: url2,
      assetType: asset_type,
      raw: raw2,
    };
  const args2 = await pollApimartPrivateAvatarTask({
    apiKey: apiKey5,
    apiUrl: apiUrl4,
    taskId: taskId4,
    pollIntervalMs: pollIntervalMs2,
    maxWaitMs: maxWaitMs2,
    signal: signal2,
  });
  return { ...args2, sourceUrl: url2, assetType: asset_type };
}
