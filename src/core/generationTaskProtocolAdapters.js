const PROTOCOL_ALIASES = Object['freeze']({
  workflow: 'workflow',
  runninghub: 'workflow',
  runninghubworkflow: 'workflow',
  rh: 'workflow',
  asyncmodelapi: 'asyncModelApi',
  async_model_api: 'asyncModelApi',
  'async-model-api': 'asyncModelApi',
  modelapi: 'asyncModelApi',
  model_api: 'asyncModelApi',
  'model-api': 'asyncModelApi',
  dreamina: 'dreamina',
});
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeAdapterType(item) {
  return normalizeText(item)['toLowerCase']()['replaceAll'](/[_-]/gu, '');
}
function firstText(...args) {
  for (const key of args) {
    const text = normalizeText(key);
    if (text) return text;
  }
  return '';
}
function positiveTime(...args2) {
  for (const index of args2) {
    const count = Number(index);
    if (Number['isFinite'](count) && count > 0x0) return count;
  }
  return 0x0;
}
function normalizeStatus(result, data = 'pending') {
  return normalizeText(result || data) || data;
}
function normalizeNumber(options, target = 0x0) {
  const source = Number(options);
  return Number['isFinite'](source) ? source : target;
}
function normalizeRecord(next) {
  return next && typeof next === 'object' && !Array['isArray'](next) ? next : {};
}
const PROTOCOL_ADAPTERS = Object['freeze']({
  workflow: Object['freeze']({
    id: 'workflow',
    adapterType: 'workflow',
    async: ![],
    taskIdField: 'rhTaskId',
    statusField: 'rhTaskStatus',
    startedAtField: 'rhTaskStartedAt',
    recoveringField: 'rhTaskRecovering',
    readTaskId: (options2 = {}, current = '') => firstText(current, options2['rhTaskId']),
    readStartedAt: (options3 = {}, entry = 0x0) =>
      positiveTime(entry, options3['rhTaskStartedAt'], options3['generationStartTime']),
    buildPatch: ({
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0x0,
      recovering: recovering = ![],
      useOpenapiQuery: useOpenapiQuery = ![],
    } = {}) => ({
      rhTaskId: normalizeText(taskId),
      rhTaskStatus: normalizeStatus(status),
      rhTaskStartedAt: normalizeNumber(startedAt),
      rhTaskRecovering: recovering === !![],
      rhTaskUseOpenapiQuery: useOpenapiQuery === !![],
    }),
  }),
  dreamina: Object['freeze']({
    id: 'dreamina',
    adapterType: 'localRuntime',
    async: ![],
    taskIdField: 'dreaminaSubmitId',
    statusField: 'dreaminaTaskStatus',
    startedAtField: 'dreaminaTaskStartedAt',
    recoveringField: 'dreaminaTaskRecovering',
    readTaskId: (options4 = {}, record = '') => firstText(record, options4['dreaminaSubmitId']),
    readStartedAt: (options5 = {}, payload = 0x0) =>
      positiveTime(payload, options5['dreaminaTaskStartedAt'], options5['generationStartTime']),
    buildPatch: ({
      taskId: taskId = '',
      submitId: submitId = taskId,
      status: status = 'pending',
      phase: phase = 'generating',
      label: label = '',
      startedAt: startedAt = 0x0,
      lastCheckedAt: lastCheckedAt = Date['now'](),
      recovering: recovering = ![],
      raw: raw = {},
      defaultLabel: defaultLabel = '',
    } = {}) => {
      const text2 = normalizeText(defaultLabel);
      return {
        dreaminaSubmitId: normalizeText(submitId),
        dreaminaTaskStatus: normalizeStatus(status),
        dreaminaTaskPhase: normalizeStatus(phase, 'generating'),
        dreaminaTaskLabel: normalizeText(label || text2),
        dreaminaTaskStartedAt: normalizeNumber(startedAt),
        dreaminaTaskLastCheckedAt: normalizeNumber(lastCheckedAt, Date['now']()),
        dreaminaTaskRecovering: recovering === !![],
        dreaminaTaskLastRaw: normalizeRecord(raw),
      };
    },
  }),
  asyncModelApi: Object['freeze']({
    id: 'asyncModelApi',
    adapterType: 'modelApi',
    async: !![],
    taskIdField: 'asyncTaskId',
    statusField: 'asyncTaskStatus',
    startedAtField: 'asyncTaskStartedAt',
    recoveringField: 'asyncTaskRecovering',
    readTaskId: (options6 = {}, handle = '') => firstText(handle, options6['asyncTaskId']),
    readStartedAt: (options7 = {}, state = 0x0) =>
      positiveTime(state, options7['asyncTaskStartedAt'], options7['generationStartTime']),
    buildPatch: ({
      provider: provider = '',
      kind: kind = 'generation',
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0x0,
      recovering: recovering = ![],
    } = {}) => ({
      asyncTaskProvider: normalizeText(provider),
      asyncTaskKind: normalizeText(kind) || 'generation',
      asyncTaskId: normalizeText(taskId),
      asyncTaskStatus: normalizeStatus(status),
      asyncTaskStartedAt: normalizeNumber(startedAt),
      asyncTaskRecovering: recovering === !![],
    }),
  }),
});
export const GENERATION_TASK_PROTOCOLS = Object['freeze']({
  WORKFLOW: 'workflow',
  DREAMINA: 'dreamina',
  ASYNC_MODEL_API: 'asyncModelApi',
});
export function normalizeGenerationTaskProtocol(config) {
  const text3 = normalizeText(config)['toLowerCase']();
  return PROTOCOL_ALIASES[text3] || '';
}
export function getGenerationTaskProtocolAdapter(scope) {
  const generationTaskProtocol = normalizeGenerationTaskProtocol(scope);
  return PROTOCOL_ADAPTERS[generationTaskProtocol] || null;
}
export function inferGenerationTaskProtocol({
  taskProtocol: taskProtocol = '',
  adapterType: adapterType = '',
  provider: provider = '',
  async: async = ![],
  node: node = {},
} = {}) {
  const text4 = normalizeText(taskProtocol),
    input = text4 === 'modelApi' && async !== !![] ? '' : normalizeGenerationTaskProtocol(text4);
  if (input) return input;
  const adapterType2 = normalizeAdapterType(adapterType || node['taskAdapterType'] || node['adapterType']);
  if (adapterType2 === 'workflow') return GENERATION_TASK_PROTOCOLS['WORKFLOW'];
  if (firstText(node['asyncTaskId'])) return GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API'];
  if (firstText(node['dreaminaSubmitId'])) return GENERATION_TASK_PROTOCOLS['DREAMINA'];
  if (adapterType2 === 'modelapi' && async === !![]) return GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API'];
  if (
    adapterType2 === 'localruntime' &&
    normalizeText(provider || node['provider'])['toLowerCase']() === 'dreamina'
  )
    return GENERATION_TASK_PROTOCOLS['DREAMINA'];
  return '';
}
export function resolveGenerationTaskProtocolAdapter(options8 = {}) {
  return getGenerationTaskProtocolAdapter(inferGenerationTaskProtocol(options8));
}
export function listGenerationTaskProtocolAdapters() {
  return Object['values'](PROTOCOL_ADAPTERS);
}
export function buildGenerationTaskProtocolPatch(output, value2 = {}) {
  const generationTaskProtocolAdapter = getGenerationTaskProtocolAdapter(output);
  if (!generationTaskProtocolAdapter)
    throw new Error('Unknown\x20generation\x20task\x20protocol:\x20' + normalizeText(output));
  return generationTaskProtocolAdapter['buildPatch'](value2);
}
