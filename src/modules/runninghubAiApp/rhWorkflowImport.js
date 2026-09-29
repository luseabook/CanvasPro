import { buildManifestDraftBundle } from '../../manifests/index.js';
import { RH_IMAGE_INSTANCE_FIELD } from '../../manifests/shared/runningHubImageManifestShared.js';
import {
  createComfyUiWorkflowComponentDrafts,
  compileComfyUiWorkflowComponents,
} from '../comfyuiWorkflow/comfyUiWorkflowImport.js';
import { buildRunningHubCustomAppExtensions } from './rhAiAppImport.js';
export function createRunningHubWorkflowComponentDrafts(_0x55326f) {
  const _0x4556db = JSON['parse'](_0x55326f);
  if (!/^\d{1,30}$/['test'](String(_0x4556db['workflowId'] || '')))
    throw new Error('缺少有效的\x20RunningHub\x20工作流\x20ID，请先获取工作流');
  if (!['runninghub', 'runninghub-international']['includes'](_0x4556db['providerProfileId']))
    throw new Error('工作流缺少来源站点，请重新获取');
  const _0x1ea04e = createComfyUiWorkflowComponentDrafts(JSON['stringify'](_0x4556db['workflow']));
  return {
    ..._0x1ea04e,
    parsed: {
      ..._0x1ea04e['parsed'],
      workflowId: String(_0x4556db['workflowId']),
      providerProfileId: _0x4556db['providerProfileId'],
    },
  };
}
export function buildRunningHubWorkflowManifestBundle({
  input: _0x26b20e,
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = 'RH 工作流',
  description: description = '',
  promptHelpTooltip: promptHelpTooltip = '',
  appKey: appKey = '',
}) {
  const { parsed: _0x3e4159 } = createRunningHubWorkflowComponentDrafts(_0x26b20e);
  if (!['image', 'video', 'audio']['includes'](kind)) throw new Error('不支持的工作流输出类型');
  const _0x266db8 = compileComfyUiWorkflowComponents(_0x3e4159, kind, components, {
    componentSelectionMode: 'manual',
    promptHelpTooltip: promptHelpTooltip,
  });
  let _0x30ee00 = 0x811c9dc5;
  for (const _0x3cb9ff of JSON['stringify']({
    input: _0x26b20e,
    kind: kind,
    components: components,
    displayName: displayName,
    description: description,
    promptHelpTooltip: promptHelpTooltip,
    appKey: appKey,
  }))
    _0x30ee00 = Math['imul'](_0x30ee00 ^ _0x3cb9ff['charCodeAt'](0x0), 0x1000193);
  const _0x262894 = kind + '-' + _0x3e4159['workflowId'] + '-' + (_0x30ee00 >>> 0x0)['toString'](0x24),
    _0x56dd72 = buildRunningHubCustomAppExtensions(kind, '', displayName, appKey, description);
  ((_0x56dd72['rhAiApp'] = {
    ..._0x56dd72['rhAiApp'],
    workflowId: _0x3e4159['workflowId'],
    sourceType: 'runninghub-workflow',
  }),
    (_0x56dd72['providerProfiles'] = [_0x3e4159['providerProfileId']]));
  const _0x34c6f2 = _0x266db8['mapping']['inputs']['map'](({ inputName: _0x2f571e, ..._0x49ff8c }) => ({
    ..._0x49ff8c,
    fieldName: _0x2f571e,
    preserveValueType: !![],
    ...(['prompt', 'param']['includes'](_0x49ff8c['source']) && typeof _0x49ff8c['defaultValue'] === 'string'
      ? { allowEmpty: !![] }
      : {}),
    ...(_0x49ff8c['source']['endsWith']('Input') ? { urlField: _0x49ff8c['field'] } : {}),
  }));
  return buildManifestDraftBundle({
    sourceId: 'runninghub-workflow:' + _0x262894,
    modelId: 'runninghub/workflow-' + _0x262894,
    executionId: 'runninghub.workflow.' + _0x262894 + '.v1',
    provider: 'runninghubwf',
    adapterType: 'workflow',
    kind: kind,
    outputType: kind,
    displayName: displayName,
    description: description,
    icon: 'images/RH.png',
    vip: !![],
    workflowId: _0x3e4159['workflowId'],
    submitMode: 'runninghub-task-create',
    queryMode: 'runninghubwf-query',
    mapping: { nodeInfoList: _0x34c6f2, allowEmptyNodeInfoList: !![] },
    uiFields: [RH_IMAGE_INSTANCE_FIELD, ..._0x266db8['uiFields']],
    inputSlots: _0x266db8['inputSlots'],
    capabilities: _0x266db8['capabilities'],
    help: _0x266db8['help'],
    prompt: {
      ..._0x266db8['prompt'],
      visible: _0x34c6f2['some']((_0x5b3158) => _0x5b3158['source'] === 'prompt'),
    },
    instanceType: { field: 'rhInstanceType', defaultValue: 'default' },
    modelExtensions: _0x56dd72,
    result: { outputType: kind, taskIdPath: 'data.taskId', paths: ['data[].fileUrl'] },
  });
}
