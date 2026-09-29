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
function normalizeText(_0x90a079) {
  return String(_0x90a079 || '')['trim']();
}
function normalizeAdapterType(_0x5085d7) {
  return normalizeText(_0x5085d7)['toLowerCase']()['replaceAll'](/[_-]/gu, '');
}
function firstText(..._0x3878df) {
  for (const _0x4e0399 of _0x3878df) {
    const _0x1d4a60 = normalizeText(_0x4e0399);
    if (_0x1d4a60) return _0x1d4a60;
  }
  return '';
}
function positiveTime(..._0x249849) {
  for (const _0x37a675 of _0x249849) {
    const _0x191b1c = Number(_0x37a675);
    if (Number['isFinite'](_0x191b1c) && _0x191b1c > 0x0) return _0x191b1c;
  }
  return 0x0;
}
function normalizeStatus(_0x18986f, _0x321229 = 'pending') {
  return normalizeText(_0x18986f || _0x321229) || _0x321229;
}
function normalizeNumber(_0x3ea5dc, _0x33e097 = 0x0) {
  const _0x397b3c = Number(_0x3ea5dc);
  return Number['isFinite'](_0x397b3c) ? _0x397b3c : _0x33e097;
}
function normalizeRecord(_0xab86a5) {
  return _0xab86a5 && typeof _0xab86a5 === 'object' && !Array['isArray'](_0xab86a5) ? _0xab86a5 : {};
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
    readTaskId: (_0x13c27c = {}, _0x2a15f3 = '') => firstText(_0x2a15f3, _0x13c27c['rhTaskId']),
    readStartedAt: (_0x7d3117 = {}, _0x44eff0 = 0x0) =>
      positiveTime(_0x44eff0, _0x7d3117['rhTaskStartedAt'], _0x7d3117['generationStartTime']),
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
    readTaskId: (_0x4a2db5 = {}, _0xabe9b6 = '') => firstText(_0xabe9b6, _0x4a2db5['dreaminaSubmitId']),
    readStartedAt: (_0x1b89a2 = {}, _0x34aba1 = 0x0) =>
      positiveTime(_0x34aba1, _0x1b89a2['dreaminaTaskStartedAt'], _0x1b89a2['generationStartTime']),
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
      const _0x1a2558 = normalizeText(defaultLabel);
      return {
        dreaminaSubmitId: normalizeText(submitId),
        dreaminaTaskStatus: normalizeStatus(status),
        dreaminaTaskPhase: normalizeStatus(phase, 'generating'),
        dreaminaTaskLabel: normalizeText(label || _0x1a2558),
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
    readTaskId: (_0x20581e = {}, _0x214475 = '') => firstText(_0x214475, _0x20581e['asyncTaskId']),
    readStartedAt: (_0x4e2c62 = {}, _0x8ca1c2 = 0x0) =>
      positiveTime(_0x8ca1c2, _0x4e2c62['asyncTaskStartedAt'], _0x4e2c62['generationStartTime']),
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
export function normalizeGenerationTaskProtocol(_0x39ca1c) {
  const _0x349a9f = normalizeText(_0x39ca1c)['toLowerCase']();
  return PROTOCOL_ALIASES[_0x349a9f] || '';
}
export function getGenerationTaskProtocolAdapter(_0x571929) {
  const _0x10df53 = normalizeGenerationTaskProtocol(_0x571929);
  return PROTOCOL_ADAPTERS[_0x10df53] || null;
}
export function inferGenerationTaskProtocol({
  taskProtocol: taskProtocol = '',
  adapterType: adapterType = '',
  provider: provider = '',
  async: _0x3f37c3 = ![],
  node: node = {},
} = {}) {
  const _0x11c96f = normalizeText(taskProtocol),
    _0x403216 =
      _0x11c96f === 'modelApi' && _0x3f37c3 !== !![] ? '' : normalizeGenerationTaskProtocol(_0x11c96f);
  if (_0x403216) return _0x403216;
  const _0x310ca9 = normalizeAdapterType(adapterType || node['taskAdapterType'] || node['adapterType']);
  if (_0x310ca9 === 'workflow') return GENERATION_TASK_PROTOCOLS['WORKFLOW'];
  if (firstText(node['asyncTaskId'])) return GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API'];
  if (firstText(node['dreaminaSubmitId'])) return GENERATION_TASK_PROTOCOLS['DREAMINA'];
  if (_0x310ca9 === 'modelapi' && _0x3f37c3 === !![]) return GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API'];
  if (
    _0x310ca9 === 'localruntime' &&
    normalizeText(provider || node['provider'])['toLowerCase']() === 'dreamina'
  )
    return GENERATION_TASK_PROTOCOLS['DREAMINA'];
  return '';
}
export function resolveGenerationTaskProtocolAdapter(_0x53a977 = {}) {
  return getGenerationTaskProtocolAdapter(inferGenerationTaskProtocol(_0x53a977));
}
export function listGenerationTaskProtocolAdapters() {
  return Object['values'](PROTOCOL_ADAPTERS);
}
export function buildGenerationTaskProtocolPatch(_0x45b9aa, _0xa33b87 = {}) {
  const _0x290508 = getGenerationTaskProtocolAdapter(_0x45b9aa);
  if (!_0x290508)
    throw new Error('Unknown\x20generation\x20task\x20protocol:\x20' + normalizeText(_0x45b9aa));
  return _0x290508['buildPatch'](_0xa33b87);
}
