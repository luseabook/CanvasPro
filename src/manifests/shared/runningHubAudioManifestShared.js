function freezeField(value) {
  return Object.freeze(value);
}
export function createRunningHubAudioModelManifest({
  modelId: modelId,
  executionId: executionId,
  displayName: displayName,
  description: description,
  inputSlots: inputSlots,
  uiFields: uiFields,
  help: help,
  uiPlacement: uiPlacement,
  extensions: extensions,
  vip: vip = false,
  subscriptionAliases: subscriptionAliases = [],
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: modelId,
    provider: 'runninghubwf',
    kind: 'audio',
    adapterType: 'workflow',
    executionId: executionId,
    displayName: displayName,
    icon: 'images/RH.png',
    description: description,
    ...(extensions ? { extensions: extensions } : {}),
    help: Object.freeze(help || {}),
    uiPlacement: Object.freeze(uiPlacement || ['modelMenu']),
    vip: vip,
    subscriptionAliases: Object.freeze(subscriptionAliases),
    capabilities: Object.freeze({
      inputKinds: Object.freeze(inputSlots.allowedKinds || []),
      outputType: 'audio',
      fixedAssetSlots: Object.freeze((inputSlots.fixedSlots || []).map((item) => item.id)),
    }),
    inputSlots: Object.freeze({
      allowedKinds: Object.freeze(inputSlots.allowedKinds || []),
      minByKind: Object.freeze(inputSlots.minByKind || {}),
      maxByKind: Object.freeze(inputSlots.maxByKind || {}),
      fixedSlots: Object.freeze(inputSlots.fixedSlots || []),
    }),
    uiSchema: Object.freeze({ fields: Object.freeze((uiFields || []).map(freezeField)) }),
    async: true,
    cancellable: true,
    outputType: 'audio',
  });
}
export function createRunningHubAudioExecutionManifest({
  id: id,
  label: label,
  workflowId: workflowId,
  preset: preset,
  mapping: mapping = {},
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: id,
    provider: 'runninghubwf',
    kind: 'audio',
    adapterType: 'workflow',
    label: label,
    workflowId: workflowId,
    appId: workflowId,
    submitMode: 'openapi-v2-ai-app',
    queryMode: 'openapi-v2-query',
    instanceType: Object.freeze({ field: 'rhInstanceType', defaultValue: 'default' }),
    mapping: Object.freeze({ preset: preset, ...mapping }),
    result: Object.freeze({
      taskIdPath: 'taskId',
      audioPaths: Object.freeze(['results[].audioUrl', 'results[].url', 'audioUrl']),
    }),
  });
}
export const RH_AUDIO_INSTANCE_FIELD = Object.freeze({
  id: 'rhInstanceType',
  type: 'segmented',
  placement: 'instance',
  label: '显存',
  defaultValue: 'default',
  options: Object.freeze([
    Object.freeze({ value: 'default', label: '24G' }),
    Object.freeze({ value: 'plus', label: '48G' }),
  ]),
});
