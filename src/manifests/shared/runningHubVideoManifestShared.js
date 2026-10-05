function freezeField(value) {
  return Object.freeze(value);
}
function freezeSlotGroup(args) {
  return Object.freeze({ ...args, slots: Object.freeze(args?.slots || []) });
}
function freezeDisplayAspectRatioSource(args2) {
  return args2 && typeof args2 === 'object' && !Array.isArray(args2)
    ? Object.freeze({ ...args2 })
    : undefined;
}
export function createRunningHubVideoModelManifest({
  modelId: modelId,
  executionId: executionId,
  displayName: displayName,
  description: description,
  inputSlots: inputSlots,
  uiFields: uiFields,
  vip: vip = false,
  fixedAssetSlots: fixedAssetSlots,
  uiPlacement: uiPlacement,
  prompt: prompt,
  help: help,
  extensions: extensions2,
  subscriptionAliases: subscriptionAliases = [],
}) {
  const displayAspectRatioSource = freezeDisplayAspectRatioSource(inputSlots.displayAspectRatioSource);
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: modelId,
    provider: 'runninghubwf',
    kind: 'video',
    adapterType: 'workflow',
    executionId: executionId,
    displayName: displayName,
    icon: 'images/RH.png',
    description: description,
    ...(prompt && typeof prompt === 'object' ? { prompt: Object.freeze(prompt) } : {}),
    help: Object.freeze(help || {}),
    ...(extensions2 ? { extensions: Object.freeze(extensions2) } : {}),
    subscriptionAliases: Object.freeze(subscriptionAliases),
    vip: vip,
    ...(uiPlacement ? { uiPlacement: Object.freeze(uiPlacement) } : {}),
    capabilities: Object.freeze({
      inputKinds: Object.freeze(inputSlots.allowedKinds || []),
      outputType: 'video',
      fixedAssetSlots: fixedAssetSlots ? Object.freeze(fixedAssetSlots) : undefined,
    }),
    inputSlots: Object.freeze({
      allowedKinds: Object.freeze(inputSlots.allowedKinds || []),
      minByKind: Object.freeze(inputSlots.minByKind || {}),
      maxByKind: Object.freeze(inputSlots.maxByKind || {}),
      ...(displayAspectRatioSource ? { displayAspectRatioSource: displayAspectRatioSource } : {}),
      fixedSlots: Object.freeze(inputSlots.fixedSlots || []),
      exclusiveGroups: Object.freeze((inputSlots.exclusiveGroups || []).map(freezeSlotGroup)),
    }),
    uiSchema: Object.freeze({ fields: Object.freeze((uiFields || []).map(freezeField)) }),
    async: true,
    cancellable: true,
    outputType: 'video',
  });
}
export function createRunningHubVideoExecutionManifest({
  id: id,
  label: label,
  workflowId: workflowId,
  submitMode: submitMode,
  queryMode: queryMode,
  mapping: mapping = {},
  preset: preset,
  extensions: extensions = {},
}) {
  return Object.freeze({
    schemaVersion: '1.0',
    id: id,
    provider: 'runninghubwf',
    kind: 'video',
    adapterType: 'workflow',
    label: label,
    workflowId: workflowId,
    appId: workflowId,
    submitMode: submitMode,
    queryMode: queryMode,
    instanceType: Object.freeze({ field: 'rhInstanceType', defaultValue: 'default' }),
    mapping: Object.freeze({ ...(preset ? { preset: preset } : {}), ...mapping }),
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
  defaultValue: 832,
  options: Object.freeze([832, 1024, 1280, 1440, 1600, 1760, 1920]),
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
