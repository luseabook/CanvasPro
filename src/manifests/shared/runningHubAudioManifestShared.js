function freezeField(_0x1d7d81) {
  return Object.freeze(_0x1d7d81);
}
export function createRunningHubAudioModelManifest({
  modelId: _0x51ed01,
  executionId: _0x175c25,
  displayName: _0x44be97,
  description: _0xbb4498,
  inputSlots: _0xe89cb4,
  uiFields: _0x5b28e5,
  help: _0x313a42,
  uiPlacement: _0x47583d,
  extensions: _0x45f457,
  vip: vip = false,
  subscriptionAliases: subscriptionAliases = [],
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: _0x51ed01,
    provider: 'runninghubwf',
    kind: 'audio',
    adapterType: 'workflow',
    executionId: _0x175c25,
    displayName: _0x44be97,
    icon: 'images/RH.png',
    description: _0xbb4498,
    ...(_0x45f457 ? { extensions: _0x45f457 } : {}),
    help: Object.freeze(_0x313a42 || {}),
    uiPlacement: Object.freeze(_0x47583d || ['modelMenu']),
    vip: vip,
    subscriptionAliases: Object.freeze(subscriptionAliases),
    capabilities: Object.freeze({
      inputKinds: Object.freeze(_0xe89cb4.allowedKinds || []),
      outputType: 'audio',
      fixedAssetSlots: Object.freeze((_0xe89cb4.fixedSlots || []).map((_0x2ede0c) => _0x2ede0c.id)),
    }),
    inputSlots: Object.freeze({
      allowedKinds: Object.freeze(_0xe89cb4.allowedKinds || []),
      minByKind: Object.freeze(_0xe89cb4.minByKind || {}),
      maxByKind: Object.freeze(_0xe89cb4.maxByKind || {}),
      fixedSlots: Object.freeze(_0xe89cb4.fixedSlots || []),
    }),
    uiSchema: Object.freeze({ fields: Object.freeze((_0x5b28e5 || []).map(freezeField)) }),
    async: true,
    cancellable: true,
    outputType: 'audio',
  });
}
export function createRunningHubAudioExecutionManifest({
  id: _0x26a24a,
  label: _0x17243e,
  workflowId: _0x5e6d60,
  preset: _0x57bdcf,
  mapping: mapping = {},
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: _0x26a24a,
    provider: 'runninghubwf',
    kind: 'audio',
    adapterType: 'workflow',
    label: _0x17243e,
    workflowId: _0x5e6d60,
    appId: _0x5e6d60,
    submitMode: 'openapi-v2-ai-app',
    queryMode: 'openapi-v2-query',
    instanceType: Object.freeze({ field: 'rhInstanceType', defaultValue: 'default' }),
    mapping: Object.freeze({ preset: _0x57bdcf, ...mapping }),
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
