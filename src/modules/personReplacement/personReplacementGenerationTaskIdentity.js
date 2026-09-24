const ACTIVE_GENERATION_TASK_STATUSES = new Set(['queued', 'submitting', 'running']);
export const PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS = Object['freeze']([
  'taskId',
  'modelId',
  'provider',
  'providerProfileId',
  'executionId',
]);
function normalizeText(_0x526e10) {
  return String(_0x526e10 ?? '')['trim']();
}
function firstText(..._0x2a36b5) {
  for (const _0x8b8e9f of _0x2a36b5) {
    const _0x244e01 = normalizeText(_0x8b8e9f);
    if (_0x244e01) return _0x244e01;
  }
  return '';
}
function firstPositiveNumber(..._0x579cbd) {
  for (const _0x201a56 of _0x579cbd) {
    const _0x28ab86 = Number(_0x201a56);
    if (Number['isFinite'](_0x28ab86) && _0x28ab86 > 0x0) return _0x28ab86;
  }
  return 0x0;
}
export function isPersonReplacementGenerationTaskActive(_0x52ba6f) {
  const _0x4e8839 = _0x52ba6f && typeof _0x52ba6f === 'object' ? _0x52ba6f['status'] : _0x52ba6f;
  return ACTIVE_GENERATION_TASK_STATUSES['has'](normalizeText(_0x4e8839)['toLowerCase']());
}
export function normalizePersonReplacementGenerationTaskIdentity(_0x1c1469 = {}) {
  const _0x186c61 =
      _0x1c1469 && typeof _0x1c1469 === 'object' && !Array['isArray'](_0x1c1469) ? _0x1c1469 : {},
    _0x4d1b9f = Object['fromEntries'](
      PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS['flatMap']((_0x5b36c1) => {
        const _0x4e5e1b = normalizeText(_0x186c61[_0x5b36c1]);
        return _0x4e5e1b ? [[_0x5b36c1, _0x4e5e1b]] : [];
      }),
    ),
    _0xf52991 = firstPositiveNumber(_0x186c61['startedAt']);
  return {
    ..._0x4d1b9f,
    ...(_0xf52991 ? { startedAt: _0xf52991 } : {}),
    ...(_0x186c61['useOpenapiQuery'] === !![] ? { useOpenapiQuery: !![] } : {}),
  };
}
export function projectPersonReplacementGenerationTaskIdentity({
  taskId: taskId = '',
  meta: meta = {},
  defaults: defaults = {},
} = {}) {
  const _0x3541d6 = meta && typeof meta === 'object' ? meta : {},
    _0x409fb5 = defaults && typeof defaults === 'object' ? defaults : {};
  return normalizePersonReplacementGenerationTaskIdentity({
    taskId: firstText(_0x3541d6['taskId'], taskId, _0x409fb5['taskId']),
    modelId: firstText(_0x3541d6['modelId'], _0x409fb5['modelId']),
    provider: firstText(_0x3541d6['provider'], _0x409fb5['provider']),
    providerProfileId: firstText(
      _0x3541d6['providerProfileId'],
      _0x3541d6['rhProviderProfileId'],
      _0x409fb5['providerProfileId'],
      _0x409fb5['rhProviderProfileId'],
    ),
    executionId: firstText(_0x3541d6['executionId'], _0x409fb5['executionId']),
    startedAt: firstPositiveNumber(_0x3541d6['startedAt'], _0x409fb5['startedAt']),
    useOpenapiQuery: _0x3541d6['useOpenapiQuery'] === !![] || _0x409fb5['useOpenapiQuery'] === !![],
  });
}
export function hasPersonReplacementGenerationTaskIdentityChanged(_0x5f0d89 = {}, _0x1a9fc3 = {}) {
  const _0x480b4e = normalizePersonReplacementGenerationTaskIdentity(_0x5f0d89),
    _0x1bfe3f = normalizePersonReplacementGenerationTaskIdentity(_0x1a9fc3);
  return [...PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS, 'startedAt', 'useOpenapiQuery']['some'](
    (_0xf72141) => !Object['is'](_0x480b4e[_0xf72141], _0x1bfe3f[_0xf72141]),
  );
}
export function getRecoverablePersonReplacementGenerationTask(_0xc5dbd5 = {}) {
  const _0xace668 =
      _0xc5dbd5 && typeof _0xc5dbd5 === 'object' && !Array['isArray'](_0xc5dbd5) ? _0xc5dbd5 : {},
    _0x59b6e0 = normalizePersonReplacementGenerationTaskIdentity(_0xace668);
  if (!isPersonReplacementGenerationTaskActive(_0xace668) || !_0x59b6e0['taskId'] || !_0x59b6e0['modelId'])
    return null;
  return {
    status: normalizeText(_0xace668['status'])['toLowerCase'](),
    ..._0x59b6e0,
    requestId: normalizeText(_0xace668['requestId']),
  };
}
