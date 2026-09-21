import { post } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
const RH_PENDING_CODES = new Set([0x324, 0x32d]),
  RH_SUCCESS_STATUSES = new Set(['COMPLETED', 'SUCCEEDED', 'SUCCESS']),
  RH_PENDING_STATUSES = new Set(['RUNNING', 'PENDING', 'QUEUED', 'PROCESSING', '']),
  RH_FAILED_STATUSES = new Set(['FAILED', 'FAIL', 'ERROR', 'CANCELLED']);
function normalizeRhStatus(_0x4702f9) {
  return String(_0x4702f9 || '')
    .trim()
    .toUpperCase();
}
function getRhStatus(_0x5d4385) {
  const _0xe7fcee =
    _0x5d4385?.data && typeof _0x5d4385.data === 'object' && !Array.isArray(_0x5d4385.data)
      ? _0x5d4385.data
      : _0x5d4385;
  return normalizeRhStatus(_0xe7fcee?.status || _0x5d4385?.status || _0x5d4385?.taskStatus);
}
function getRhErrorMessage(_0x2864e9, _0x188d07) {
  return String(
    _0x2864e9?.msg || _0x2864e9?.message || _0x2864e9?.error || _0x2864e9?.failure_reason || _0x188d07,
  );
}
function hasRhResult(_0x739aa0) {
  if (typeof _0x739aa0 === 'string') return !!_0x739aa0.trim();
  if (Array.isArray(_0x739aa0?.data)) return _0x739aa0.data.some((_0x3f355c) => hasRhResult(_0x3f355c));
  const _0x5a58cc =
    _0x739aa0?.data && typeof _0x739aa0.data === 'object' && !Array.isArray(_0x739aa0.data)
      ? _0x739aa0.data
      : _0x739aa0;
  if (Array.isArray(_0x5a58cc?.results)) return _0x5a58cc.results.some((_0x3465d6) => hasRhResult(_0x3465d6));
  return !!(_0x5a58cc?.url || _0x5a58cc?.videoUrl || _0x5a58cc?.fileUrl || _0x5a58cc?.download_url);
}
function getInstallId(_0x43f49a) {
  return String(
    _0x43f49a?.installId || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
  ).trim();
}
function buildInstallIdHeaders(_0x379601) {
  const _0x48aa78 = getInstallId(_0x379601);
  return _0x48aa78 ? { 'X-AIC-Install-Id': _0x48aa78 } : {};
}
export async function runRunninghubWorkflow(_0x16b15d, _0x49f3f3 = {}) {
  const { installId: _0x4324a2, ..._0x407586 } = _0x16b15d || {},
    _0x3e1777 = await post('/api/v2/runninghubwf/run', _0x407586, {
      provider: 'runninghubwf',
      signal: _0x49f3f3?.signal,
      headers: buildInstallIdHeaders(_0x16b15d),
    });
  return _0x3e1777;
}
export async function runRunninghubAiApp(_0x3dc6f0, _0x3cd68a = {}) {
  const _0x1b7907 = String(_0x3dc6f0?.appId || _0x3dc6f0?.workflowId || '').trim(),
    _0x53da06 = String(_0x3dc6f0?.apiKey || '').trim();
  if (!_0x1b7907) throw new Error('缺少 RunningHub appId');
  if (!_0x53da06) throw new Error('RunningHub API Key 未配置');
  const { appId: _0x1d0cf8, workflowId: _0x2935e0, installId: _0x20719e, ..._0x2cbde5 } = _0x3dc6f0 || {},
    _0x3c84b2 = await post(
      '/api/v2/proxy/image',
      {
        ..._0x2cbde5,
        apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x1b7907,
        apiKey: _0x53da06,
      },
      {
        provider: 'runninghubwf',
        signal: _0x3cd68a?.signal,
        headers: buildInstallIdHeaders(_0x3dc6f0),
        timeout: 0xdbba0,
      },
    );
  return _0x3c84b2;
}
export async function queryRunninghubWorkflow(_0x4f6585, _0xeb731f = {}) {
  const _0x12107a = _0xeb731f?.useOpenapiQuery === true,
    _0x53354e = await post(
      _0x12107a ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
      _0x12107a
        ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', ...(_0x4f6585 || {}) }
        : _0x4f6585 || {},
      { provider: 'runninghubwf', signal: _0xeb731f?.signal },
    );
  return _0x53354e;
}
export async function resumeRunninghubWorkflowTask(_0x4c9938, _0xb4c053 = {}) {
  const _0x15db81 = String(_0x4c9938?.apiKey || '').trim(),
    _0x242a8d = String(_0x4c9938?.taskId || '').trim();
  if (!_0x15db81) throw new Error('RunningHub API Key 未配置');
  if (!_0x242a8d) throw new Error('缺少 RunningHub 任务ID');
  return runTaskSingleFlight(
    {
      provider: 'runninghubwf',
      kind: String(_0xb4c053?.taskKind || _0xb4c053?.kind || 'video').trim() || 'video',
      taskId: _0x242a8d,
    },
    async () => resumeRunninghubWorkflowTaskOnce({ apiKey: _0x15db81, taskId: _0x242a8d }, _0xb4c053),
  );
}
async function resumeRunninghubWorkflowTaskOnce(_0x3631ac, _0xe62b29 = {}) {
  const _0x1bb6b9 = String(_0x3631ac?.apiKey || '').trim(),
    _0x17b542 = String(_0x3631ac?.taskId || '').trim(),
    _0x5f020f = Math.max(0, Number(_0xe62b29?.pollIntervalMs) || 0x7d0),
    _0x4da444 = Math.max(1, Number(_0xe62b29?.maxPolls) || 0x258);
  for (let _0x441dad = 0; _0x441dad < _0x4da444; _0x441dad++) {
    if (_0xe62b29?.signal?.aborted) throw new Error('CANCELLED');
    if (_0x5f020f > 0) {
      await new Promise((_0x52d339) => setTimeout(_0x52d339, _0x5f020f));
      if (_0xe62b29?.signal?.aborted) throw new Error('CANCELLED');
    }
    const _0x4862ba = await queryRunninghubWorkflow(
        { apiKey: _0x1bb6b9, taskId: _0x17b542 },
        { signal: _0xe62b29?.signal, useOpenapiQuery: _0xe62b29?.useOpenapiQuery === true },
      ),
      _0x4cde74 = typeof _0x4862ba?.code === 'number' ? _0x4862ba.code : null;
    if (_0x4cde74 !== null && RH_PENDING_CODES.has(_0x4cde74)) continue;
    if (_0x4cde74 !== null && _0x4cde74 !== 0)
      throw new Error(getRhErrorMessage(_0x4862ba, '任务轮询失败 (code: ' + _0x4cde74 + ')'));
    const _0x58992a = getRhStatus(_0x4862ba);
    if (RH_FAILED_STATUSES.has(_0x58992a)) throw new Error(getRhErrorMessage(_0x4862ba, '任务执行失败'));
    if (RH_SUCCESS_STATUSES.has(_0x58992a) || hasRhResult(_0x4862ba)) return _0x4862ba;
    if (RH_PENDING_STATUSES.has(_0x58992a)) continue;
  }
  throw new Error('任务超时，请稍后重试');
}
