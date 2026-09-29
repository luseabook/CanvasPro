export const OBJECT_STORAGE_KEY_PREFIX = 'SHUO-Canvas';
export const OBJECT_STORAGE_PROVIDER_IDS = Object['freeze']([
  'cloudflare-r2',
  'tencent-cos',
  'aliyun-oss',
  's3-compatible',
]);
export const DEFAULT_OBJECT_STORAGE_PROVIDER_ID = 'cloudflare-r2';
export const PASSED_OBJECT_STORAGE_CONNECTION_STATUS = 'passed';
const OBJECT_STORAGE_PROVIDER_ID_SET = new Set(OBJECT_STORAGE_PROVIDER_IDS),
  PROFILE_FIELDS = Object['freeze']([
    'endpoint',
    'region',
    'bucket',
    'accessKeyId',
    'secretAccessKey',
    'sessionToken',
    'publicBaseUrl',
    'addressingStyle',
  ]),
  LEGACY_PROFILE_HINT_FIELDS = Object['freeze']([
    'endpoint',
    'region',
    'bucket',
    'publicBaseUrl',
    'addressingStyle',
  ]);
function isPlainObject(_0x2db27c) {
  return !!_0x2db27c && typeof _0x2db27c === 'object' && !Array['isArray'](_0x2db27c);
}
function normalizeUrl(_0x232ecc) {
  return String(_0x232ecc || '')
    ['trim']()
    ['replace'](/\/+$/, '');
}
function normalizeConnectionVerification(_0x51b246) {
  if (!isPlainObject(_0x51b246) || _0x51b246['status'] !== PASSED_OBJECT_STORAGE_CONNECTION_STATUS)
    return null;
  const _0x18a35f = Number(_0x51b246['verifiedAt']);
  return {
    status: PASSED_OBJECT_STORAGE_CONNECTION_STATUS,
    ...(Number['isFinite'](_0x18a35f) && _0x18a35f > 0x0 ? { verifiedAt: _0x18a35f } : {}),
  };
}
function getNormalizedProfileIdentity(_0x17edba = {}) {
  return JSON['stringify'](
    PROFILE_FIELDS['map']((_0x1d0e55) => String(_0x17edba[_0x1d0e55] || '')['trim']()),
  );
}
function hasLegacyProfile(_0x23a34f) {
  if (!isPlainObject(_0x23a34f)) return ![];
  return LEGACY_PROFILE_HINT_FIELDS['some']((_0x241099) =>
    Object['prototype']['hasOwnProperty']['call'](_0x23a34f, _0x241099),
  );
}
export function detectObjectStorageProviderId(_0x280f37 = {}) {
  const _0xaa7cfd = isPlainObject(_0x280f37) ? _0x280f37 : {},
    _0x1518c8 = String(_0xaa7cfd['providerId'] || '')['trim']();
  if (OBJECT_STORAGE_PROVIDER_ID_SET['has'](_0x1518c8)) return _0x1518c8;
  const _0x421b75 = String(_0xaa7cfd['endpoint'] || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x421b75['includes']('.r2.cloudflarestorage.com')) return 'cloudflare-r2';
  if (_0x421b75['includes']('.myqcloud.com') || _0x421b75['includes']('.tencentcos.cn')) return 'tencent-cos';
  if (_0x421b75['includes']('.aliyuncs.com')) return 'aliyun-oss';
  return _0x421b75 ? 's3-compatible' : DEFAULT_OBJECT_STORAGE_PROVIDER_ID;
}
export function normalizeObjectStorageProviderId(_0x160055, _0x15f081 = {}) {
  const _0x2f7731 = String(_0x160055 || '')['trim']();
  return OBJECT_STORAGE_PROVIDER_ID_SET['has'](_0x2f7731)
    ? _0x2f7731
    : detectObjectStorageProviderId(_0x15f081);
}
export function normalizeObjectStorageProfile(_0x4c0335 = {}, _0x5de4f8) {
  const _0x3f7007 = isPlainObject(_0x4c0335) ? _0x4c0335 : {},
    _0x409b9d = normalizeObjectStorageProviderId(_0x5de4f8, _0x3f7007),
    _0x16e55d =
      _0x409b9d === 'tencent-cos' || _0x409b9d === 'aliyun-oss'
        ? 'virtual-hosted'
        : _0x409b9d === 'cloudflare-r2'
          ? 'path'
          : String(_0x3f7007['addressingStyle'] || '')['trim']() === 'virtual-hosted'
            ? 'virtual-hosted'
            : 'path',
    _0x3bbec8 = {
      endpoint: normalizeUrl(_0x3f7007['endpoint']),
      region: String(_0x3f7007['region'] || (_0x409b9d === 'cloudflare-r2' ? 'auto' : ''))['trim'](),
      bucket: String(_0x3f7007['bucket'] || '')['trim'](),
      accessKeyId: String(_0x3f7007['accessKeyId'] || '')['trim'](),
      secretAccessKey: String(_0x3f7007['secretAccessKey'] || '')['trim'](),
      sessionToken: String(_0x3f7007['sessionToken'] || '')['trim'](),
      publicBaseUrl: normalizeUrl(_0x3f7007['publicBaseUrl']),
      addressingStyle: _0x16e55d,
    },
    _0x57457d = normalizeConnectionVerification(_0x3f7007['connectionVerification']);
  return (_0x57457d && (_0x3bbec8['connectionVerification'] = _0x57457d), _0x3bbec8);
}
export function normalizeObjectStorageSettings(_0x33b260 = {}) {
  const _0x29a84d = isPlainObject(_0x33b260) ? _0x33b260 : {},
    _0x7a893b = normalizeObjectStorageProviderId(_0x29a84d['providerId'], _0x29a84d),
    _0x539525 = {},
    _0x46ace6 = isPlainObject(_0x29a84d['profiles']) ? _0x29a84d['profiles'] : {};
  Object['entries'](_0x46ace6)['forEach'](([_0x54ddd6, _0x25a041]) => {
    if (!OBJECT_STORAGE_PROVIDER_ID_SET['has'](_0x54ddd6) || !isPlainObject(_0x25a041)) return;
    _0x539525[_0x54ddd6] = normalizeObjectStorageProfile(_0x25a041, _0x54ddd6);
  });
  if (hasLegacyProfile(_0x29a84d)) {
    const _0x1055d4 = detectObjectStorageProviderId(_0x29a84d);
    !_0x539525[_0x1055d4] && (_0x539525[_0x1055d4] = normalizeObjectStorageProfile(_0x29a84d, _0x1055d4));
  }
  !_0x539525[_0x7a893b] && (_0x539525[_0x7a893b] = normalizeObjectStorageProfile({}, _0x7a893b));
  const _0x31a0d3 =
    _0x539525[_0x7a893b]?.['connectionVerification']?.['status'] === PASSED_OBJECT_STORAGE_CONNECTION_STATUS;
  return { enabled: _0x29a84d['enabled'] === !![] && _0x31a0d3, providerId: _0x7a893b, profiles: _0x539525 };
}
export function getObjectStorageProviderProfile(_0x293753 = {}, _0x1ca5dd) {
  const _0x364dbe = normalizeObjectStorageSettings(_0x293753),
    _0x5b1f5e = normalizeObjectStorageProviderId(_0x1ca5dd || _0x364dbe['providerId']);
  return normalizeObjectStorageProfile(_0x364dbe['profiles'][_0x5b1f5e], _0x5b1f5e);
}
export function updateObjectStorageProviderProfile(_0x4bac1d = {}, _0x51fe94, _0x4c104d = {}) {
  const _0x256318 = normalizeObjectStorageSettings(_0x4bac1d),
    _0x1a3097 = normalizeObjectStorageProviderId(_0x51fe94 || _0x256318['providerId']),
    _0x32e528 = isPlainObject(_0x4c104d) ? _0x4c104d : {},
    _0x568a80 = normalizeObjectStorageProfile(_0x256318['profiles'][_0x1a3097], _0x1a3097),
    _0x572b0e = normalizeObjectStorageProfile({ ..._0x568a80, ..._0x32e528 }, _0x1a3097);
  return (
    !Object['prototype']['hasOwnProperty']['call'](_0x32e528, 'connectionVerification') &&
      getNormalizedProfileIdentity(_0x568a80) !== getNormalizedProfileIdentity(_0x572b0e) &&
      delete _0x572b0e['connectionVerification'],
    { ..._0x256318, providerId: _0x1a3097, profiles: { ..._0x256318['profiles'], [_0x1a3097]: _0x572b0e } }
  );
}
export function isObjectStorageProviderVerified(_0x341725 = {}, _0x323602) {
  return (
    getObjectStorageProviderProfile(_0x341725, _0x323602)?.['connectionVerification']?.['status'] ===
    PASSED_OBJECT_STORAGE_CONNECTION_STATUS
  );
}
export function markObjectStorageProviderVerified(
  _0x1e1c51 = {},
  _0x4491c9,
  { verifiedAt: verifiedAt = Date['now']() } = {},
) {
  const _0x5c8b7f = normalizeObjectStorageSettings(_0x1e1c51),
    _0x3f8304 = normalizeObjectStorageProviderId(_0x4491c9 || _0x5c8b7f['providerId']);
  return updateObjectStorageProviderProfile(_0x5c8b7f, _0x3f8304, {
    connectionVerification: { status: PASSED_OBJECT_STORAGE_CONNECTION_STATUS, verifiedAt: verifiedAt },
  });
}
export function resolveObjectStorageConfig(_0xe2c954 = {}) {
  const _0x1778ec = normalizeObjectStorageSettings(_0xe2c954),
    _0x29dd25 = getObjectStorageProviderProfile(_0x1778ec, _0x1778ec['providerId']),
    _0xa22bdd = String(_0x29dd25['region'] || '')['trim']();
  let _0x58abea = _0x29dd25['endpoint'],
    _0xecba70 = _0xa22bdd;
  if (_0x1778ec['providerId'] === 'cloudflare-r2') _0xecba70 = 'auto';
  else {
    if (_0x1778ec['providerId'] === 'tencent-cos')
      ((_0x58abea = _0xa22bdd ? 'https://cos.' + _0xa22bdd + '.myqcloud.com' : ''), (_0xecba70 = _0xa22bdd));
    else
      _0x1778ec['providerId'] === 'aliyun-oss' &&
        (_0x58abea = _0xa22bdd ? 'https://s3.oss-' + _0xa22bdd + '.aliyuncs.com' : '');
  }
  return {
    enabled: _0x1778ec['enabled'],
    provider: 's3',
    providerId: _0x1778ec['providerId'],
    endpoint: normalizeUrl(_0x58abea),
    region: String(_0xecba70 || '')['trim'](),
    location: _0x1778ec['providerId'] === 'cloudflare-r2' ? '' : _0xa22bdd,
    bucket: _0x29dd25['bucket'],
    accessKeyId: _0x29dd25['accessKeyId'],
    secretAccessKey: _0x29dd25['secretAccessKey'],
    sessionToken: _0x29dd25['sessionToken'],
    publicBaseUrl: _0x29dd25['publicBaseUrl'],
    pathPrefix: OBJECT_STORAGE_KEY_PREFIX,
    addressingStyle: _0x29dd25['addressingStyle'],
  };
}
export function serializeObjectStorageSettings(_0x2801a3 = {}) {
  const _0x3baef2 = normalizeObjectStorageSettings(_0x2801a3),
    _0x5a1647 = {};
  return (
    OBJECT_STORAGE_PROVIDER_IDS['forEach']((_0x42e988) => {
      const _0x2be868 = _0x3baef2['profiles'][_0x42e988];
      if (!_0x2be868) return;
      const _0x329d48 = normalizeObjectStorageProfile(_0x2be868, _0x42e988),
        _0x486e12 = PROFILE_FIELDS['some']((_0x5cd2fc) => String(_0x329d48[_0x5cd2fc] || '')['trim']());
      if (_0x486e12) _0x5a1647[_0x42e988] = _0x329d48;
    }),
    !_0x5a1647[_0x3baef2['providerId']] &&
      (_0x5a1647[_0x3baef2['providerId']] = normalizeObjectStorageProfile({}, _0x3baef2['providerId'])),
    { enabled: _0x3baef2['enabled'], providerId: _0x3baef2['providerId'], profiles: _0x5a1647 }
  );
}
