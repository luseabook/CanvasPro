import { post } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { normalizeRunningHubModelApiProfileId } from '../src/modules/runningHubProviderProfiles.js';
export function parseRunningHubResourceReference(value, item, key) {
  const index = String(value || '')['trim']();
  let resourceId = index,
    sourceType = item,
    providerProfileId = normalizeRunningHubModelApiProfileId(key);
  if (/^\d{1,30}$/['test'](index) && item === 'auto')
    throw new Error('仅凭 ID 无法识别类型，请粘贴 RunningHub AI 应用或工作流的完整链接');
  if (!/^\d{1,30}$/['test'](index)) {
    let uRL;
    try {
      uRL = new URL(index);
    } catch {
      throw new Error('请输入 RunningHub ID 或完整链接');
    }
    if (
      uRL['protocol'] !== 'https:' ||
      !/^(www\.)?runninghub\.(cn|ai)$/['test'](uRL['hostname']) ||
      uRL['port'] ||
      uRL['username'] ||
      uRL['password']
    )
      throw new Error('请使用 RunningHub 官方国内或国际站链接');
    const result = uRL['pathname']['replace'](
      /^\/[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?(?=\/(?:ai-detail|workflow|post)\/)/i,
      '',
    );
    if (item === 'auto')
      sourceType = /^\/(?:workflow|post|openapi\/v2\/run\/workflow)\//['test'](result)
        ? 'runninghub-workflow'
        : 'runninghub-ai-app';
    const data =
      sourceType === 'runninghub-workflow'
        ? /^\/(?:workflow|post|openapi\/v2\/run\/workflow)\/(\d{1,30})\/?$/
        : /^\/(?:ai-detail|openapi\/v2\/run\/ai-app)\/(\d{1,30})\/?$/;
    resourceId = result['match'](data)?.[0x1];
    if (!resourceId)
      throw new Error(
        item === 'runninghub-workflow'
          ? '请提供工作流链接，不是 AI 应用链接'
          : '请提供 AI 应用链接，不是工作流链接',
      );
    providerProfileId = uRL['hostname']['endsWith']('.ai') ? 'runninghub-international' : 'runninghub';
  }
  return {
    resourceId: resourceId,
    providerProfileId: providerProfileId,
    sourceType: sourceType,
  };
}
export async function fetchRunningHubDefinition({
  reference: reference,
  sourceType: sourceType2,
  profileId: profileId,
  signal: signal,
}) {
  if (!['runninghub-ai-app', 'runninghub-workflow', 'auto']['includes'](sourceType2))
    throw new Error('不支持的 RunningHub 来源类型');
  const workflowId = parseRunningHubResourceReference(reference, sourceType2, profileId);
  await ensureConfig();
  if (signal?.['aborted']) throw new DOMException('已取消', 'AbortError');
  const apiKey = getProviderConfig(workflowId['providerProfileId'])?.['apiKey'];
  if (!apiKey) throw new Error('请先在设置中配置对应站点的 RunningHub API Key');
  const post2 = await post(
    '/api/v2/runninghubwf/definition',
    { ...workflowId, apiKey: apiKey },
    { provider: 'runninghubwf', signal: signal, timeout: 0x88b8 },
  );
  if (Number(post2?.['code']) !== 0x0 || !post2?.['data']) throw new Error('RunningHub 未返回有效配置');
  const enabled = post2['data'];
  if (workflowId['sourceType'] === 'runninghub-workflow') {
    const workflow =
      typeof enabled['prompt'] === 'string' ? JSON['parse'](enabled['prompt']) : enabled['prompt'];
    if (!workflow || typeof workflow !== 'object' || Array['isArray'](workflow))
      throw new Error('RunningHub 未返回 API 格式工作流');
    return {
      ...workflowId,
      input: JSON['stringify']({
        workflowId: workflowId['resourceId'],
        workflow: workflow,
        providerProfileId: workflowId['providerProfileId'],
      }),
      name: 'RH 工作流 ' + workflowId['resourceId'],
    };
  }
  if (!Array['isArray'](enabled['nodeInfoList']) || !enabled['nodeInfoList']['length'])
    throw new Error('该 AI 应用没有返回可编辑参数，请检查应用权限');
  const nodeInfoList = enabled['nodeInfoList']['map']((options) =>
    Object['fromEntries'](
      ['nodeId', 'nodeName', 'fieldName', 'fieldValue', 'fieldType', 'fieldData', 'description']
        ['filter']((target) => Object['hasOwn'](options, target))
        ['map']((source) => [source, options[source]]),
    ),
  );
  return {
    ...workflowId,
    name: String(enabled['webappName'] || 'RH AI应用 ' + workflowId['resourceId']),
    input: JSON['stringify']({
      appId: workflowId['resourceId'],
      nodeInfoList: nodeInfoList,
      providerProfileId: workflowId['providerProfileId'],
    }),
  };
}
