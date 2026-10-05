import { buildManifestDraftBundle } from '../../manifests/index.js';
import { RH_IMAGE_INSTANCE_FIELD } from '../../manifests/shared/runningHubImageManifestShared.js';
import {
  createComfyUiWorkflowComponentDrafts,
  compileComfyUiWorkflowComponents,
} from '../comfyuiWorkflow/comfyUiWorkflowImport.js';
import { buildRunningHubCustomAppExtensions } from './rhAiAppImport.js';
export function createRunningHubWorkflowComponentDrafts(value) {
  const providerProfileId = JSON['parse'](value);
  if (!/^\d{1,30}$/['test'](String(providerProfileId['workflowId'] || '')))
    throw new Error('缺少有效的 RunningHub 工作流 ID，请先获取工作流');
  if (!['runninghub', 'runninghub-international']['includes'](providerProfileId['providerProfileId']))
    throw new Error('工作流缺少来源站点，请重新获取');
  const args = createComfyUiWorkflowComponentDrafts(JSON['stringify'](providerProfileId['workflow']));
  return {
    ...args,
    parsed: {
      ...args['parsed'],
      workflowId: String(providerProfileId['workflowId']),
      providerProfileId: providerProfileId['providerProfileId'],
    },
  };
}
export function buildRunningHubWorkflowManifestBundle({
  input: input,
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = 'RH 工作流',
  description: description = '',
  promptHelpTooltip: promptHelpTooltip = '',
  appKey: appKey = '',
}) {
  const { parsed: parsed } = createRunningHubWorkflowComponentDrafts(input);
  if (!['image', 'video', 'audio']['includes'](kind)) throw new Error('不支持的工作流输出类型');
  const inputSlots = compileComfyUiWorkflowComponents(parsed, kind, components, {
    componentSelectionMode: 'manual',
    promptHelpTooltip: promptHelpTooltip,
  });
  let item = 0x811c9dc5;
  for (const key of JSON['stringify']({
    input: input,
    kind: kind,
    components: components,
    displayName: displayName,
    description: description,
    promptHelpTooltip: promptHelpTooltip,
    appKey: appKey,
  }))
    item = Math['imul'](item ^ key['charCodeAt'](0), 0x1000193);
  const index = kind + '-' + parsed['workflowId'] + '-' + (item >>> 0)['toString'](36),
    modelExtensions = buildRunningHubCustomAppExtensions(kind, '', displayName, appKey, description);
  ((modelExtensions['rhAiApp'] = {
    ...modelExtensions['rhAiApp'],
    workflowId: parsed['workflowId'],
    sourceType: 'runninghub-workflow',
  }),
    (modelExtensions['providerProfiles'] = [parsed['providerProfileId']]));
  const nodeInfoList = inputSlots['mapping']['inputs']['map'](({ inputName: inputName, ...urlField }) => ({
    ...urlField,
    fieldName: inputName,
    preserveValueType: !![],
    ...(['prompt', 'param']['includes'](urlField['source']) && typeof urlField['defaultValue'] === 'string'
      ? { allowEmpty: !![] }
      : {}),
    ...(urlField['source']['endsWith']('Input') ? { urlField: urlField['field'] } : {}),
  }));
  return buildManifestDraftBundle({
    sourceId: 'runninghub-workflow:' + index,
    modelId: 'runninghub/workflow-' + index,
    executionId: 'runninghub.workflow.' + index + '.v1',
    provider: 'runninghubwf',
    adapterType: 'workflow',
    kind: kind,
    outputType: kind,
    displayName: displayName,
    description: description,
    icon: 'images/RH.png',
    vip: !![],
    workflowId: parsed['workflowId'],
    submitMode: 'runninghub-task-create',
    queryMode: 'runninghubwf-query',
    mapping: { nodeInfoList: nodeInfoList, allowEmptyNodeInfoList: !![] },
    uiFields: [RH_IMAGE_INSTANCE_FIELD, ...inputSlots['uiFields']],
    inputSlots: inputSlots['inputSlots'],
    capabilities: inputSlots['capabilities'],
    help: inputSlots['help'],
    prompt: {
      ...inputSlots['prompt'],
      visible: nodeInfoList['some']((result) => result['source'] === 'prompt'),
    },
    instanceType: { field: 'rhInstanceType', defaultValue: 'default' },
    modelExtensions: modelExtensions,
    result: { outputType: kind, taskIdPath: 'data.taskId', paths: ['data[].fileUrl'] },
  });
}
