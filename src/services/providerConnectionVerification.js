export const PASSED_PROVIDER_CONNECTION_STATUS = 'passed';
const VOLCENGINE_SPEECH_CAPABILITY_IDS = new Set(['asr', 'tts', 'audioGeneration']),
  RUNNINGHUB_PROVIDER_IDS = new Set(['runninghub', 'runninghub-international']),
  RUNNINGHUB_CAPABILITY_BY_STEP_ID = Object['freeze']({
    auth: 'workflow',
    model: 'modelApi',
    upload: 'modelApi',
  }),
  COMFYUI_CAPABILITY_BY_STEP_ID = Object['freeze']({ service: 'local', cloud: 'cloud' });
function normalizeProviderId(_0x213211 = '') {
  return String(_0x213211 || '')
    ['trim']()
    ['toLowerCase']();
}
function getVerificationStepStatus(_0x3b5f42 = {}) {
  if (_0x3b5f42['ok'] === !![] && !_0x3b5f42['skipped']) return 'passed';
  return _0x3b5f42['skipped'] ? 'unknown' : 'failed';
}
function getRunningHubConfiguredCapabilities(_0xf93271 = {}) {
  const _0x49e329 = [];
  if (String(_0xf93271?.['apiKey'] || '')['trim']()) _0x49e329['push']('workflow');
  if (String(_0xf93271?.['modelApiKey'] || '')['trim']()) _0x49e329['push']('modelApi');
  return _0x49e329;
}
function getRunningHubVerificationStatus(_0x5d9872 = {}, _0x3083af = {}) {
  const _0x29a7b5 = getRunningHubConfiguredCapabilities(_0x5d9872);
  if (_0x29a7b5['length'] === 0x0) return 'failed';
  const _0x4c9ba8 = _0x29a7b5['map']((_0x21753d) => _0x3083af?.[_0x21753d]?.['status'] || 'unknown');
  if (_0x4c9ba8['every']((_0x54887e) => _0x54887e === 'passed')) return PASSED_PROVIDER_CONNECTION_STATUS;
  return _0x4c9ba8['some']((_0x469f5a) => _0x469f5a === 'passed') ? 'partial' : 'failed';
}
function getComfyUiConfiguredCapabilities(_0x252be5 = {}) {
  const _0x32ed3e = ['local'];
  if (String(_0x252be5?.['cloudApiUrl'] || '')['trim']()) _0x32ed3e['push']('cloud');
  return _0x32ed3e;
}
function getComfyUiVerificationStatus(_0x30cc9f = {}, _0x1b9b52 = {}) {
  const _0x41d037 = getComfyUiConfiguredCapabilities(_0x30cc9f);
  if (_0x41d037['length'] === 0x0) return 'failed';
  const _0x48102d = _0x41d037['map']((_0x5d67c2) => _0x1b9b52?.[_0x5d67c2]?.['status'] || 'unknown');
  if (_0x48102d['every']((_0x490450) => _0x490450 === PASSED_PROVIDER_CONNECTION_STATUS))
    return PASSED_PROVIDER_CONNECTION_STATUS;
  return _0x48102d['some']((_0x14af49) => _0x14af49 === PASSED_PROVIDER_CONNECTION_STATUS)
    ? 'partial'
    : 'failed';
}
function getPreservedRunningHubCapabilities(_0x2fbb11, _0x383dae) {
  const _0x27bab5 = _0x2fbb11?.['connectionVerification']?.['capabilities'] || {};
  if (String(_0x2fbb11?.['apiUrl'] || '')['trim']() !== String(_0x383dae?.['apiUrl'] || '')['trim']())
    return {};
  const _0x1bab1b = {};
  return (
    String(_0x2fbb11?.['apiKey'] || '')['trim']() === String(_0x383dae?.['apiKey'] || '')['trim']() &&
      _0x27bab5['workflow'] &&
      (_0x1bab1b['workflow'] = { ..._0x27bab5['workflow'] }),
    String(_0x2fbb11?.['modelApiKey'] || '')['trim']() ===
      String(_0x383dae?.['modelApiKey'] || '')['trim']() &&
      _0x27bab5['modelApi'] &&
      (_0x1bab1b['modelApi'] = { ..._0x27bab5['modelApi'] }),
    _0x1bab1b
  );
}
function getPreservedComfyUiCapabilities(_0x39c458, _0x732795) {
  const _0x533fd3 = _0x39c458?.['connectionVerification']?.['capabilities'] || {},
    _0x2f8a38 = {};
  return (
    String(_0x39c458?.['apiUrl'] || '')['trim']() === String(_0x732795?.['apiUrl'] || '')['trim']() &&
      _0x533fd3['local'] &&
      (_0x2f8a38['local'] = { ..._0x533fd3['local'] }),
    String(_0x39c458?.['cloudApiUrl'] || '')['trim']() ===
      String(_0x732795?.['cloudApiUrl'] || '')['trim']() &&
      _0x533fd3['cloud'] &&
      (_0x2f8a38['cloud'] = { ..._0x533fd3['cloud'] }),
    _0x2f8a38
  );
}
function buildRunningHubConnectionVerification(_0x18b011, _0x1edb6a, _0xbf810b, _0x579f23) {
  const _0x448af = getPreservedRunningHubCapabilities(_0x18b011, _0x1edb6a),
    _0x33f3ca = Array['isArray'](_0xbf810b?.['steps']) ? _0xbf810b['steps'] : [];
  return (
    _0x33f3ca['forEach']((_0x2fa88d) => {
      const _0x302f2b = RUNNINGHUB_CAPABILITY_BY_STEP_ID[_0x2fa88d?.['id']];
      if (!_0x302f2b || _0x2fa88d?.['skipped']) return;
      _0x448af[_0x302f2b] = { status: getVerificationStepStatus(_0x2fa88d), verifiedAt: _0x579f23 };
    }),
    {
      status: getRunningHubVerificationStatus(_0x1edb6a, _0x448af),
      verifiedAt: _0x579f23,
      ...(Object['keys'](_0x448af)['length'] > 0x0 ? { capabilities: _0x448af } : {}),
    }
  );
}
function buildComfyUiConnectionVerification(_0x37ec55, _0x4f41c7, _0x4efa50, _0x43b43e) {
  const _0x2c276e = getPreservedComfyUiCapabilities(_0x37ec55, _0x4f41c7),
    _0x487bac = Array['isArray'](_0x4efa50?.['steps']) ? _0x4efa50['steps'] : [];
  return (
    _0x487bac['forEach']((_0x3481e0) => {
      const _0x3c8019 = COMFYUI_CAPABILITY_BY_STEP_ID[_0x3481e0?.['id']];
      if (!_0x3c8019 || _0x3481e0?.['skipped']) return;
      _0x2c276e[_0x3c8019] = { status: getVerificationStepStatus(_0x3481e0), verifiedAt: _0x43b43e };
    }),
    {
      status: getComfyUiVerificationStatus(_0x4f41c7, _0x2c276e),
      verifiedAt: _0x43b43e,
      ...(Object['keys'](_0x2c276e)['length'] > 0x0 ? { capabilities: _0x2c276e } : {}),
    }
  );
}
function getProviderConnectionIdentity(_0x2e9ab0 = {}, _0x2e510d = '') {
  const _0x2d13c2 = String(_0x2e510d || '')
      ['trim']()
      ['toLowerCase'](),
    _0x2acfa8 = (_0x53e377) => String(_0x2e9ab0?.[_0x53e377] || '')['trim']();
  if (_0x2d13c2 === 'comfyui') return JSON['stringify']([_0x2acfa8('apiUrl'), _0x2acfa8('cloudApiUrl')]);
  if (_0x2d13c2 === 'runninghub' || _0x2d13c2 === 'runninghub-international')
    return JSON['stringify']([_0x2acfa8('apiUrl'), _0x2acfa8('apiKey'), _0x2acfa8('modelApiKey')]);
  return JSON['stringify']([
    _0x2acfa8('apiUrl'),
    _0x2acfa8('apiKey'),
    _0x2d13c2 === 'apimart' ? _0x2acfa8('routeId') : '',
  ]);
}
function isProviderConnectionResultCurrent(_0x42bc3e, _0x555311, _0x310622, _0x19cbc7 = '') {
  const _0x328279 = normalizeProviderId(_0x310622),
    _0x17d729 = _0x42bc3e?.['providers']?.[_0x328279] || {},
    _0x7a898f = _0x555311?.['providers']?.[_0x328279] || {},
    _0x1cb714 = String(_0x19cbc7 || '')
      ['trim']()
      ['toLowerCase']();
  if (_0x328279 === 'comfyui' && ['local', 'cloud']['includes'](_0x1cb714)) {
    const _0x3ebca2 = _0x1cb714 === 'cloud' ? 'cloudApiUrl' : 'apiUrl';
    return String(_0x17d729?.[_0x3ebca2] || '')['trim']() === String(_0x7a898f?.[_0x3ebca2] || '')['trim']();
  }
  return (
    getProviderConnectionIdentity(_0x17d729, _0x328279) ===
    getProviderConnectionIdentity(_0x7a898f, _0x328279)
  );
}
function joinProviderDiagnosticMessages(_0x3b3b9f = {}) {
  return [_0x3b3b9f['message'], _0x3b3b9f['detail']]
    ['map']((_0x526f4b) => String(_0x526f4b || '')['trim']())
    ['filter'](
      (_0x41ee73, _0x4b2812, _0x55dfd7) => _0x41ee73 && _0x55dfd7['indexOf'](_0x41ee73) === _0x4b2812,
    )
    ['join'](' · ');
}
export function formatProviderDiagnosticDetail(_0x3cd4f3 = {}, _0x187abd = {}) {
  const _0x2cb6d1 = [],
    _0x39fe1e =
      _0x3cd4f3['suggestion'] || _0x3cd4f3['summary'] || _0x3cd4f3['error'] || _0x3cd4f3['detail'] || '';
  if (_0x39fe1e) _0x2cb6d1['push'](_0x39fe1e);
  if (Array['isArray'](_0x3cd4f3['steps']) && _0x3cd4f3['steps']['length'] > 0x0)
    _0x3cd4f3['steps']['forEach']((_0x5676b5) => {
      const _0x434a74 = _0x5676b5['skipped']
          ? _0x187abd['skipped'] || '跳过'
          : _0x5676b5['ok']
            ? _0x187abd['passed'] || '通过'
            : _0x187abd['failed'] || '失败',
        _0x599d47 = joinProviderDiagnosticMessages(_0x5676b5);
      _0x2cb6d1['push'](
        (_0x5676b5['label'] || _0x5676b5['id'] || _0x187abd['step'] || '步骤') +
          '：' +
          _0x434a74 +
          (_0x599d47 ? ' - ' + _0x599d47 : ''),
      );
    });
  else _0x3cd4f3['detail'] && _0x2cb6d1['push'](_0x3cd4f3['detail']);
  return _0x2cb6d1['filter'](Boolean)['join']('\x0a');
}
export function isProviderConnectionVerified(_0x1bcaf9 = {}, _0x865bed = '') {
  const _0x3c7c80 = _0x1bcaf9?.['providers']?.[normalizeProviderId(_0x865bed)]?.['connectionVerification'];
  return _0x3c7c80?.['status'] === PASSED_PROVIDER_CONNECTION_STATUS;
}
export function shouldPersistProviderConnectionResult(_0x57c648 = '', _0x3dbe0f = {}) {
  if (_0x3dbe0f?.['ok'] === !![]) return !![];
  const _0x2e47af = normalizeProviderId(_0x57c648);
  if (_0x2e47af === 'comfyui')
    return (Array['isArray'](_0x3dbe0f?.['steps']) ? _0x3dbe0f['steps'] : [])['some'](
      (_0xef44ad) => COMFYUI_CAPABILITY_BY_STEP_ID[_0xef44ad?.['id']] && !_0xef44ad?.['skipped'],
    );
  if (!RUNNINGHUB_PROVIDER_IDS['has'](_0x2e47af)) return ![];
  return (Array['isArray'](_0x3dbe0f?.['steps']) ? _0x3dbe0f['steps'] : [])['some'](
    (_0x5629b4) =>
      RUNNINGHUB_CAPABILITY_BY_STEP_ID[_0x5629b4?.['id']] &&
      _0x5629b4?.['ok'] === !![] &&
      !_0x5629b4?.['skipped'],
  );
}
export function reconcileProviderConnectionVerification(_0x42be92 = {}, _0x427bc5 = {}, _0x294a98 = '') {
  const _0x1478d2 = _0x427bc5 && typeof _0x427bc5 === 'object' ? { ..._0x427bc5 } : {},
    _0x1fa70a = normalizeProviderId(_0x294a98);
  if (RUNNINGHUB_PROVIDER_IDS['has'](_0x1fa70a)) {
    const _0x373659 = _0x42be92?.['connectionVerification'];
    if (!_0x373659) return _0x1478d2;
    const _0x4cd1e1 = getPreservedRunningHubCapabilities(_0x42be92, _0x1478d2);
    if (Object['keys'](_0x4cd1e1)['length'] === 0x0)
      return (delete _0x1478d2['connectionVerification'], _0x1478d2);
    return (
      (_0x1478d2['connectionVerification'] = {
        ..._0x373659,
        status: getRunningHubVerificationStatus(_0x1478d2, _0x4cd1e1),
        capabilities: _0x4cd1e1,
      }),
      _0x1478d2
    );
  }
  if (_0x1fa70a === 'comfyui') {
    const _0x44badc = _0x42be92?.['connectionVerification'];
    if (!_0x44badc) return _0x1478d2;
    const _0x32ae69 = getPreservedComfyUiCapabilities(_0x42be92, _0x1478d2);
    if (Object['keys'](_0x32ae69)['length'] === 0x0)
      return (delete _0x1478d2['connectionVerification'], _0x1478d2);
    return (
      (_0x1478d2['connectionVerification'] = {
        ..._0x44badc,
        status: getComfyUiVerificationStatus(_0x1478d2, _0x32ae69),
        capabilities: _0x32ae69,
      }),
      _0x1478d2
    );
  }
  return (
    getProviderConnectionIdentity(_0x42be92, _0x294a98) !==
      getProviderConnectionIdentity(_0x1478d2, _0x294a98) && delete _0x1478d2['connectionVerification'],
    _0x1478d2
  );
}
export function mergePassedProviderApiConfig(
  _0x356091 = {},
  _0x52471e = {},
  _0x56390f = [],
  _0x373d3e = new Map(),
  _0x1c2438 = {},
) {
  const _0x2fac91 = _0x356091 && typeof _0x356091 === 'object' ? _0x356091 : {},
    _0x5e62d4 = _0x52471e && typeof _0x52471e === 'object' ? _0x52471e : {},
    _0x382b4d = { ...(_0x2fac91['providers'] || {}) },
    _0x460946 = _0x5e62d4['providers'] || {},
    _0x530851 = _0x373d3e instanceof Map ? _0x373d3e : new Map(),
    _0x3bddd9 = Number(_0x1c2438?.['verifiedAt']) || Date['now'](),
    _0x14a727 =
      _0x1c2438?.['providerResults'] && typeof _0x1c2438['providerResults'] === 'object'
        ? _0x1c2438['providerResults']
        : {};
  return (
    _0x56390f['forEach']((_0x56c358) => {
      const _0x35213b = normalizeProviderId(_0x56c358);
      if (!_0x35213b) return;
      const _0x132b1f = _0x382b4d[_0x35213b] || {},
        _0x40f1f1 = { ..._0x132b1f, ...(_0x460946[_0x35213b] || {}), ...(_0x530851['get'](_0x35213b) || {}) },
        _0x52af69 = RUNNINGHUB_PROVIDER_IDS['has'](_0x35213b)
          ? buildRunningHubConnectionVerification(_0x132b1f, _0x40f1f1, _0x14a727[_0x35213b], _0x3bddd9)
          : _0x35213b === 'comfyui'
            ? buildComfyUiConnectionVerification(_0x132b1f, _0x40f1f1, _0x14a727[_0x35213b], _0x3bddd9)
            : { status: PASSED_PROVIDER_CONNECTION_STATUS, verifiedAt: _0x3bddd9 };
      if (_0x35213b === 'volcengine-speech') {
        const _0x4ec497 =
            getProviderConnectionIdentity(_0x132b1f, _0x35213b) ===
            getProviderConnectionIdentity(_0x40f1f1, _0x35213b),
          _0x4eb187 = _0x4ec497 ? { ...(_0x132b1f?.['connectionVerification']?.['capabilities'] || {}) } : {},
          _0x3d4824 = Array['isArray'](_0x14a727[_0x35213b]?.['steps']) ? _0x14a727[_0x35213b]['steps'] : [];
        (_0x3d4824['forEach']((_0x52e26d) => {
          const _0x149bc6 = String(_0x52e26d?.['id'] || '')['trim']();
          if (!VOLCENGINE_SPEECH_CAPABILITY_IDS['has'](_0x149bc6)) return;
          _0x4eb187[_0x149bc6] = {
            status: _0x52e26d['ok'] === !![] ? 'passed' : _0x52e26d['skipped'] ? 'unknown' : 'failed',
            verifiedAt: _0x3bddd9,
          };
        }),
          Object['keys'](_0x4eb187)['length'] > 0x0 && (_0x52af69['capabilities'] = _0x4eb187));
      }
      _0x382b4d[_0x35213b] = { ..._0x40f1f1, connectionVerification: _0x52af69 };
    }),
    { ..._0x2fac91, providers: _0x382b4d }
  );
}
export function mergeCurrentProviderConnectionResults(
  _0xa1e03b = {},
  _0x5c6755 = {},
  _0xf2d902 = [],
  _0x325ef4 = new Map(),
  _0x4d3461 = {},
) {
  const _0x43f3c5 = _0x4d3461?.['connectionCapabilities'] || {},
    _0x1b109c = [],
    _0x4a0017 = [];
  return (
    _0xf2d902['forEach']((_0x4d32f5) => {
      const _0x575ce1 = normalizeProviderId(_0x4d32f5);
      if (!_0x575ce1) return;
      isProviderConnectionResultCurrent(_0xa1e03b, _0x5c6755, _0x575ce1, _0x43f3c5[_0x575ce1])
        ? _0x1b109c['push'](_0x575ce1)
        : _0x4a0017['push'](_0x575ce1);
    }),
    {
      config: mergePassedProviderApiConfig(_0xa1e03b, _0xa1e03b, _0x1b109c, _0x325ef4, _0x4d3461),
      appliedProviderIds: _0x1b109c,
      staleProviderIds: _0x4a0017,
    }
  );
}
