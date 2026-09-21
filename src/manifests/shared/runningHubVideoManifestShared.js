function freezeField(_0x4935e7) {
  return Object.freeze(_0x4935e7);
}
function freezeSlotGroup(_0x1f326d) {
  return Object.freeze({ ..._0x1f326d, slots: Object.freeze(_0x1f326d?.slots || []) });
}
function freezeDisplayAspectRatioSource(_0x415796) {
  return _0x415796 && typeof _0x415796 === 'object' && !Array.isArray(_0x415796)
    ? Object.freeze({ ..._0x415796 })
    : undefined;
}
export function createRunningHubVideoModelManifest({
  modelId: _0xebc704,
  executionId: _0x4d76e8,
  displayName: _0x2f07d2,
  description: _0x5b3408,
  inputSlots: _0x14edaf,
  uiFields: _0x54866c,
  vip: vip = false,
  fixedAssetSlots: _0x5d2001,
  uiPlacement: _0x51fd9c,
  prompt: _0x442746,
  help: _0x4d1498,
  extensions: _0x33da10,
  subscriptionAliases: subscriptionAliases = [],
}) {
  const _0x15cd92 = freezeDisplayAspectRatioSource(_0x14edaf.displayAspectRatioSource);
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: _0xebc704,
    provider: 'runninghubwf',
    kind: 'video',
    adapterType: 'workflow',
    executionId: _0x4d76e8,
    displayName: _0x2f07d2,
    icon: 'images/RH.png',
    description: _0x5b3408,
    ...(_0x442746 && typeof _0x442746 === 'object' ? { prompt: Object.freeze(_0x442746) } : {}),
    help: Object.freeze(_0x4d1498 || {}),
    ...(_0x33da10 ? { extensions: Object.freeze(_0x33da10) } : {}),
    subscriptionAliases: Object.freeze(subscriptionAliases),
    vip: vip,
    ...(_0x51fd9c ? { uiPlacement: Object.freeze(_0x51fd9c) } : {}),
    capabilities: Object.freeze({
      inputKinds: Object.freeze(_0x14edaf.allowedKinds || []),
      outputType: 'video',
      fixedAssetSlots: _0x5d2001 ? Object.freeze(_0x5d2001) : undefined,
    }),
    inputSlots: Object.freeze({
      allowedKinds: Object.freeze(_0x14edaf.allowedKinds || []),
      minByKind: Object.freeze(_0x14edaf.minByKind || {}),
      maxByKind: Object.freeze(_0x14edaf.maxByKind || {}),
      ...(_0x15cd92 ? { displayAspectRatioSource: _0x15cd92 } : {}),
      fixedSlots: Object.freeze(_0x14edaf.fixedSlots || []),
      exclusiveGroups: Object.freeze((_0x14edaf.exclusiveGroups || []).map(freezeSlotGroup)),
    }),
    uiSchema: Object.freeze({ fields: Object.freeze((_0x54866c || []).map(freezeField)) }),
    async: true,
    cancellable: true,
    outputType: 'video',
  });
}
export function createRunningHubVideoExecutionManifest({
  id: _0x54779a,
  label: _0x4ef006,
  workflowId: _0x58bac5,
  submitMode: _0x3ec548,
  queryMode: _0x58f99a,
  mapping: mapping = {},
  preset: _0x56409f,
  extensions: extensions = {},
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: _0x54779a,
    provider: 'runninghubwf',
    kind: 'video',
    adapterType: 'workflow',
    label: _0x4ef006,
    workflowId: _0x58bac5,
    appId: _0x58bac5,
    submitMode: _0x3ec548,
    queryMode: _0x58f99a,
    instanceType: Object.freeze({ field: 'rhInstanceType', defaultValue: 'default' }),
    mapping: Object.freeze({ ...(_0x56409f ? { preset: _0x56409f } : {}), ...mapping }),
    extensions: Object.freeze(extensions || {}),
    result: Object.freeze({
      taskIdPath: 'taskId',
      videoPaths: Object.freeze(['results[].videoUrl', 'results[].url']),
    }),
  });
}
export const RH_VIDEO_RESOLUTION_FIELD = Object.freeze({
  id: 'rhVideoResolution',
  type: 'slider',
  placement: 'videoParams',
  label: '分辨率',
  defaultValue: 0x340,
  options: Object.freeze([0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780]),
});
export const RH_VIDEO_FPS_FIELD = Object.freeze({
  id: 'rhVideoFps',
  type: 'segmented',
  placement: 'videoParams',
  label: '帧率',
  defaultValue: 24,
  options: Object.freeze([
    Object.freeze({ value: 16, label: '16帧' }),
    Object.freeze({ value: 24, label: '24帧' }),
  ]),
});
export const RH_VIDEO_FPS_30_FIELD = Object.freeze({
  ...RH_VIDEO_FPS_FIELD,
  options: Object.freeze([
    Object.freeze({ value: 16, label: '16帧' }),
    Object.freeze({ value: 24, label: '24帧' }),
    Object.freeze({ value: 30, label: '30帧' }),
  ]),
});
export const RH_INSTANCE_FIELD = Object.freeze({
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
