export const COMFYUI_CONNECTION_TARGETS = Object['freeze'](['local', 'cloud']);
export const COMFYUI_LOCAL_DEFAULT_URL = '127.0.0.1:8188';
export function normalizeComfyUiFormUrl(value, item = '') {
  const enabled = String(value || item || '')['trim']();
  if (!enabled) return '';
  const key = /^[a-z][a-z0-9+.-]*:\/\//i['test'](enabled);
  try {
    const uRL = new URL(key ? enabled : 'http://' + enabled);
    return ((uRL['search'] = ''), (uRL['hash'] = ''), uRL['toString']()['replace'](/\/+$/, ''));
  } catch {
    const enabled2 = enabled['replace'](/[?#].*$/, '')['replace'](/\/+$/, '');
    if (!enabled2) return '';
    return key ? enabled2 : 'http://' + enabled2;
  }
}
export function normalizeComfyUiConnectionTarget(index = '') {
  const result = String(index || '')
    ['trim']()
    ['toLowerCase']();
  return COMFYUI_CONNECTION_TARGETS['includes'](result) ? result : '';
}
export function getComfyUiStatusElementId(data = '') {
  const comfyUiConnectionTarget = normalizeComfyUiConnectionTarget(data);
  return 'providerTestStatus-comfyui' + (comfyUiConnectionTarget ? '-' + comfyUiConnectionTarget : '');
}
export function isComfyUiEndpointConfigured(options = {}, target = '') {
  const comfyUiConnectionTarget2 = normalizeComfyUiConnectionTarget(target),
    source = options?.['providers']?.['comfyui'] || {},
    next =
      comfyUiConnectionTarget2 === 'cloud'
        ? source['cloudApiUrl']
        : source['apiUrl'] || COMFYUI_LOCAL_DEFAULT_URL;
  return Boolean(String(next || '')['trim']());
}
export function getComfyUiEndpointStatusEntries(options2 = {}) {
  const current = options2?.['providers']?.['comfyui'] || {},
    entry = current?.['connectionVerification']?.['capabilities'] || {};
  return COMFYUI_CONNECTION_TARGETS['map']((target2) => {
    if (!isComfyUiEndpointConfigured(options2, target2))
      return { target: target2, tone: 'unconfigured', textKey: 'statuses.unconfigured' };
    if (entry?.[target2]?.['status'] === 'passed')
      return { target: target2, tone: 'success', textKey: 'diagnostics.passed' };
    if (entry?.[target2]?.['status'] === 'failed')
      return { target: target2, tone: 'danger', textKey: 'diagnostics.notPassed' };
    return { target: target2, tone: 'configured', textKey: 'statuses.configured' };
  });
}
