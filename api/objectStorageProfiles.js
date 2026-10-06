export const OBJECT_STORAGE_KEY_PREFIX = 'SHUO-Canvas';
export const OBJECT_STORAGE_PROVIDER_IDS = Object.freeze([
  'cloudflare-r2',
  'tencent-cos',
  'aliyun-oss',
  's3-compatible',
]);
export const DEFAULT_OBJECT_STORAGE_PROVIDER_ID = 'cloudflare-r2';
export const PASSED_OBJECT_STORAGE_CONNECTION_STATUS = 'passed';
const OBJECT_STORAGE_PROVIDER_ID_SET = new Set(OBJECT_STORAGE_PROVIDER_IDS),
  PROFILE_FIELDS = Object.freeze([
    'endpoint',
    'region',
    'bucket',
    'accessKeyId',
    'secretAccessKey',
    'sessionToken',
    'publicBaseUrl',
    'addressingStyle',
  ]),
  LEGACY_PROFILE_HINT_FIELDS = Object.freeze([
    'endpoint',
    'region',
    'bucket',
    'publicBaseUrl',
    'addressingStyle',
  ]);
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}
function normalizeConnectionVerification(response) {
  if (!isPlainObject(response) || response.status !== PASSED_OBJECT_STORAGE_CONNECTION_STATUS) return null;
  const verifiedAt2 = Number(response.verifiedAt);
  return {
    status: PASSED_OBJECT_STORAGE_CONNECTION_STATUS,
    ...(Number.isFinite(verifiedAt2) && verifiedAt2 > 0 ? { verifiedAt: verifiedAt2 } : {}),
  };
}
function getNormalizedProfileIdentity(options = {}) {
  return JSON.stringify(PROFILE_FIELDS.map((item) => String(options[item] || '').trim()));
}
function hasLegacyProfile(key) {
  if (!isPlainObject(key)) return false;
  return LEGACY_PROFILE_HINT_FIELDS.some((index) =>
    Object.prototype.hasOwnProperty.call(key, index),
  );
}
export function detectObjectStorageProviderId(options2 = {}) {
  const isPlainObject2 = isPlainObject(options2) ? options2 : {},
    result = String(isPlainObject2.providerId || '').trim();
  if (OBJECT_STORAGE_PROVIDER_ID_SET.has(result)) return result;
  const list = String(isPlainObject2.endpoint || '')
    .trim()
    .toLowerCase();
  if (list.includes('.r2.cloudflarestorage.com')) return 'cloudflare-r2';
  if (list.includes('.myqcloud.com') || list.includes('.tencentcos.cn')) return 'tencent-cos';
  if (list.includes('.aliyuncs.com')) return 'aliyun-oss';
  return list ? 's3-compatible' : DEFAULT_OBJECT_STORAGE_PROVIDER_ID;
}
export function normalizeObjectStorageProviderId(data, target = {}) {
  const source = String(data || '').trim();
  return OBJECT_STORAGE_PROVIDER_ID_SET.has(source) ? source : detectObjectStorageProviderId(target);
}
export function normalizeObjectStorageProfile(options3 = {}, next) {
  const isPlainObject3 = isPlainObject(options3) ? options3 : {},
    objectStorageProviderId = normalizeObjectStorageProviderId(next, isPlainObject3),
    addressingStyle =
      objectStorageProviderId === 'tencent-cos' || objectStorageProviderId === 'aliyun-oss'
        ? 'virtual-hosted'
        : objectStorageProviderId === 'cloudflare-r2'
          ? 'path'
          : String(isPlainObject3.addressingStyle || '').trim() === 'virtual-hosted'
            ? 'virtual-hosted'
            : 'path',
    current = {
      endpoint: normalizeUrl(isPlainObject3.endpoint),
      region: String(isPlainObject3.region || (objectStorageProviderId === 'cloudflare-r2' ? 'auto' : '')).trim(),
      bucket: String(isPlainObject3.bucket || '').trim(),
      accessKeyId: String(isPlainObject3.accessKeyId || '').trim(),
      secretAccessKey: String(isPlainObject3.secretAccessKey || '').trim(),
      sessionToken: String(isPlainObject3.sessionToken || '').trim(),
      publicBaseUrl: normalizeUrl(isPlainObject3.publicBaseUrl),
      addressingStyle: addressingStyle,
    },
    connectionVerification = normalizeConnectionVerification(isPlainObject3.connectionVerification);
  return (connectionVerification && (current.connectionVerification = connectionVerification), current);
}
export function normalizeObjectStorageSettings(options4 = {}) {
  const enabled2 = isPlainObject(options4) ? options4 : {},
    providerId = normalizeObjectStorageProviderId(enabled2.providerId, enabled2),
    profiles = {},
    isPlainObject4 = isPlainObject(enabled2.profiles) ? enabled2.profiles : {};
  Object.entries(isPlainObject4).forEach(([entry, record]) => {
    if (!OBJECT_STORAGE_PROVIDER_ID_SET.has(entry) || !isPlainObject(record)) return;
    profiles[entry] = normalizeObjectStorageProfile(record, entry);
  });
  if (hasLegacyProfile(enabled2)) {
    const detectObjectStorageProviderId2 = detectObjectStorageProviderId(enabled2);
    !profiles[detectObjectStorageProviderId2] &&
      (profiles[detectObjectStorageProviderId2] = normalizeObjectStorageProfile(
        enabled2,
        detectObjectStorageProviderId2,
      ));
  }
  !profiles[providerId] && (profiles[providerId] = normalizeObjectStorageProfile({}, providerId));
  const payload =
    profiles[providerId]?.connectionVerification?.status === PASSED_OBJECT_STORAGE_CONNECTION_STATUS;
  return { enabled: enabled2.enabled === true && payload, providerId: providerId, profiles: profiles };
}
export function getObjectStorageProviderProfile(options5 = {}, handle) {
  const objectStorageSettings = normalizeObjectStorageSettings(options5),
    objectStorageProviderId2 = normalizeObjectStorageProviderId(
      handle || objectStorageSettings.providerId,
    );
  return normalizeObjectStorageProfile(
    objectStorageSettings.profiles[objectStorageProviderId2],
    objectStorageProviderId2,
  );
}
export function updateObjectStorageProviderProfile(options6 = {}, state, config = {}) {
  const args = normalizeObjectStorageSettings(options6),
    providerId2 = normalizeObjectStorageProviderId(state || args.providerId),
    args2 = isPlainObject(config) ? config : {},
    args3 = normalizeObjectStorageProfile(args.profiles[providerId2], providerId2),
    objectStorageProfile = normalizeObjectStorageProfile({ ...args3, ...args2 }, providerId2);
  return (
    !Object.prototype.hasOwnProperty.call(args2, 'connectionVerification') &&
      getNormalizedProfileIdentity(args3) !== getNormalizedProfileIdentity(objectStorageProfile) &&
      delete objectStorageProfile.connectionVerification,
    {
      ...args,
      providerId: providerId2,
      profiles: { ...args.profiles, [providerId2]: objectStorageProfile },
    }
  );
}
export function isObjectStorageProviderVerified(options7 = {}, scope) {
  return (
    getObjectStorageProviderProfile(options7, scope)?.connectionVerification?.status ===
    PASSED_OBJECT_STORAGE_CONNECTION_STATUS
  );
}
export function markObjectStorageProviderVerified(
  options8 = {},
  input,
  { verifiedAt: verifiedAt = Date.now() } = {},
) {
  const objectStorageSettings2 = normalizeObjectStorageSettings(options8),
    objectStorageProviderId3 = normalizeObjectStorageProviderId(
      input || objectStorageSettings2.providerId,
    );
  return updateObjectStorageProviderProfile(objectStorageSettings2, objectStorageProviderId3, {
    connectionVerification: { status: PASSED_OBJECT_STORAGE_CONNECTION_STATUS, verifiedAt: verifiedAt },
  });
}
export function resolveObjectStorageConfig(options9 = {}) {
  const enabled3 = normalizeObjectStorageSettings(options9),
    bucket = getObjectStorageProviderProfile(enabled3, enabled3.providerId),
    output = String(bucket.region || '').trim();
  let value2 = bucket.endpoint,
    value3 = output;
  if (enabled3.providerId === 'cloudflare-r2') value3 = 'auto';
  else {
    if (enabled3.providerId === 'tencent-cos')
      ((value2 = output ? 'https://cos.' + output + '.myqcloud.com' : ''), (value3 = output));
    else
      enabled3.providerId === 'aliyun-oss' &&
        (value2 = output ? 'https://s3.oss-' + output + '.aliyuncs.com' : '');
  }
  return {
    enabled: enabled3.enabled,
    provider: 's3',
    providerId: enabled3.providerId,
    endpoint: normalizeUrl(value2),
    region: String(value3 || '').trim(),
    location: enabled3.providerId === 'cloudflare-r2' ? '' : output,
    bucket: bucket.bucket,
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    sessionToken: bucket.sessionToken,
    publicBaseUrl: bucket.publicBaseUrl,
    pathPrefix: OBJECT_STORAGE_KEY_PREFIX,
    addressingStyle: bucket.addressingStyle,
  };
}
export function serializeObjectStorageSettings(options10 = {}) {
  const enabled4 = normalizeObjectStorageSettings(options10),
    profiles2 = {};
  return (
    OBJECT_STORAGE_PROVIDER_IDS.forEach((value4) => {
      const enabled5 = enabled4.profiles[value4];
      if (!enabled5) return;
      const objectStorageProfile2 = normalizeObjectStorageProfile(enabled5, value4),
        value5 = PROFILE_FIELDS.some((value6) => String(objectStorageProfile2[value6] || '').trim());
      if (value5) profiles2[value4] = objectStorageProfile2;
    }),
    !profiles2[enabled4.providerId] &&
      (profiles2[enabled4.providerId] = normalizeObjectStorageProfile({}, enabled4.providerId)),
    { enabled: enabled4.enabled, providerId: enabled4.providerId, profiles: profiles2 }
  );
}
