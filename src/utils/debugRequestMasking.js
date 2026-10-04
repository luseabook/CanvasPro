const SECRET_KEY_NAMES = new Set([
  'apikey',
  'api_key',
  'api-key',
  'modelapikey',
  'model_api_key',
  'model-api-key',
  'cdkey',
  'cd_key',
  'cd-key',
]);
function hasSecretValue(value) {
  return String(value || '').trim() !== '';
}
function isPlainObject(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  const item = Object.getPrototypeOf(enabled);
  return item === Object.prototype || item === null;
}
export function maskDebugSecret(key) {
  return hasSecretValue(key) ? '***' : '';
}
export function maskDebugAuthorization(index) {
  const enabled2 = String(index || '').trim();
  if (!enabled2) return '';
  if (/^Bearer$/i.test(enabled2)) return '';
  return /^Bearer\s+/i.test(enabled2) ? 'Bearer ***' : '***';
}
export function maskDebugBearer(result) {
  return hasSecretValue(result) ? 'Bearer ***' : '';
}
export function maskDebugHeaders(args) {
  if (!args || typeof args !== 'object') return args;
  const data = { ...args };
  for (const options of Object.keys(data)) {
    const target = options.toLowerCase();
    if (target === 'authorization') data[options] = maskDebugAuthorization(data[options]);
    else
      (target === 'x-api-key' || target === 'api-key' || target === 'cdkey') &&
        (data[options] = maskDebugSecret(data[options]));
  }
  return data;
}
export function maskDebugPayloadSecrets(list) {
  if (Array.isArray(list)) return list.map((item2) => maskDebugPayloadSecrets(item2));
  if (!isPlainObject(list)) return list;
  const source = {};
  for (const [next, current] of Object.entries(list)) {
    const entry = next.toLowerCase();
    if (SECRET_KEY_NAMES.has(entry)) source[next] = maskDebugSecret(current);
    else
      entry === 'authorization'
        ? (source[next] = maskDebugAuthorization(current))
        : (source[next] = maskDebugPayloadSecrets(current));
  }
  return source;
}
