import { post } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { normalizeRunningHubModelApiProfileId } from '../src/modules/runningHubProviderProfiles.js';
export function parseRunningHubResourceReference(_0x5c09c7, _0x4b99f9, _0x28c385) {
  const _0x379c41 = String(_0x5c09c7 || '')['trim']();
  let _0x50220a = _0x379c41,
    _0x5025be = _0x4b99f9,
    _0xc62d2a = normalizeRunningHubModelApiProfileId(_0x28c385);
  if (/^\d{1,30}$/['test'](_0x379c41) && _0x4b99f9 === 'auto')
    throw new Error('仅凭 ID 无法识别类型，请粘贴 RunningHub AI 应用或工作流的完整链接');
  if (!/^\d{1,30}$/['test'](_0x379c41)) {
    let _0x2c896d;
    try {
      _0x2c896d = new URL(_0x379c41);
    } catch {
      throw new Error('请输入 RunningHub ID 或完整链接');
    }
    if (
      _0x2c896d['protocol'] !== 'https:' ||
      !/^(www\.)?runninghub\.(cn|ai)$/['test'](_0x2c896d['hostname']) ||
      _0x2c896d['port'] ||
      _0x2c896d['username'] ||
      _0x2c896d['password']
    )
      throw new Error('请使用 RunningHub 官方国内或国际站链接');
    const _0x5cc9c7 = _0x2c896d['pathname']['replace'](
      /^\/[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?(?=\/(?:ai-detail|workflow|post)\/)/i,
      '',
    );
    if (_0x4b99f9 === 'auto')
      _0x5025be = /^\/(?:workflow|post|openapi\/v2\/run\/workflow)\//['test'](_0x5cc9c7)
        ? 'runninghub-workflow'
        : 'runninghub-ai-app';
    const _0x3178d2 =
      _0x5025be === 'runninghub-workflow'
        ? /^\/(?:workflow|post|openapi\/v2\/run\/workflow)\/(\d{1,30})\/?$/
        : /^\/(?:ai-detail|openapi\/v2\/run\/ai-app)\/(\d{1,30})\/?$/;
    _0x50220a = _0x5cc9c7['match'](_0x3178d2)?.[0x1];
    if (!_0x50220a)
      throw new Error(
        _0x4b99f9 === 'runninghub-workflow'
          ? '请提供工作流链接，不是 AI 应用链接'
          : '请提供 AI 应用链接，不是工作流链接',
      );
    _0xc62d2a = _0x2c896d['hostname']['endsWith']('.ai') ? 'runninghub-international' : 'runninghub';
  }
  return {
    resourceId: _0x50220a,
    providerProfileId: _0xc62d2a,
    sourceType: _0x5025be,
  };
}
export async function fetchRunningHubDefinition({
  reference: _0x263b19,
  sourceType: _0x47ade5,
  profileId: _0x4af5d4,
  signal: _0x3db586,
}) {
  if (!['runninghub-ai-app', 'runninghub-workflow', 'auto']['includes'](_0x47ade5))
    throw new Error('不支持的 RunningHub 来源类型');
  const _0x459611 = parseRunningHubResourceReference(_0x263b19, _0x47ade5, _0x4af5d4);
  await ensureConfig();
  if (_0x3db586?.['aborted']) throw new DOMException('已取消', 'AbortError');
  const _0x4caa1c = getProviderConfig(_0x459611['providerProfileId'])?.['apiKey'];
  if (!_0x4caa1c) throw new Error('请先在设置中配置对应站点的 RunningHub API Key');
  const _0x34be97 = await post(
    '/api/v2/runninghubwf/definition',
    { ..._0x459611, apiKey: _0x4caa1c },
    { provider: 'runninghubwf', signal: _0x3db586, timeout: 0x88b8 },
  );
  if (Number(_0x34be97?.['code']) !== 0x0 || !_0x34be97?.['data'])
    throw new Error('RunningHub 未返回有效配置');
  const _0x47aba2 = _0x34be97['data'];
  if (_0x459611['sourceType'] === 'runninghub-workflow') {
    const _0x53c108 =
      typeof _0x47aba2['prompt'] === 'string' ? JSON['parse'](_0x47aba2['prompt']) : _0x47aba2['prompt'];
    if (!_0x53c108 || typeof _0x53c108 !== 'object' || Array['isArray'](_0x53c108))
      throw new Error('RunningHub 未返回 API 格式工作流');
    return {
      ..._0x459611,
      input: JSON['stringify']({
        workflowId: _0x459611['resourceId'],
        workflow: _0x53c108,
        providerProfileId: _0x459611['providerProfileId'],
      }),
      name: 'RH 工作流 ' + _0x459611['resourceId'],
    };
  }
  if (!Array['isArray'](_0x47aba2['nodeInfoList']) || !_0x47aba2['nodeInfoList']['length'])
    throw new Error('该 AI 应用没有返回可编辑参数，请检查应用权限');
  const _0x4c8f49 = _0x47aba2['nodeInfoList']['map']((_0x41f937) =>
    Object['fromEntries'](
      ['nodeId', 'nodeName', 'fieldName', 'fieldValue', 'fieldType', 'fieldData', 'description']
        ['filter']((_0x16742b) => Object['hasOwn'](_0x41f937, _0x16742b))
        ['map']((_0x42ad27) => [_0x42ad27, _0x41f937[_0x42ad27]]),
    ),
  );
  return {
    ..._0x459611,
    name: String(_0x47aba2['webappName'] || 'RH AI应用 ' + _0x459611['resourceId']),
    input: JSON['stringify']({
      appId: _0x459611['resourceId'],
      nodeInfoList: _0x4c8f49,
      providerProfileId: _0x459611['providerProfileId'],
    }),
  };
}
