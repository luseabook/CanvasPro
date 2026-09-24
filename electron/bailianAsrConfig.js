import { readFileSync } from 'node:fs';
import path from 'node:path';
export function createBailianAsrConfigResolver({ getUserRoot: getUserRoot, getSecureSettingsStore: getSecureSettingsStore } = {}) {
  return () => {
    let provider = {};
    try {
      provider =
        JSON.parse(readFileSync(path.join(getUserRoot(), 'config.json'), 'utf8'))?.providers?.bailian ||
        {};
    } catch {}
    const secureKey = 'apiConfig.providers.bailian.apiKey';
    let secureValue = '';
    try {
      secureValue = getSecureSettingsStore?.()?.getMany?.([secureKey])?.[secureKey] || '';
    } catch {}
    return {
      apiKey: String(secureValue || provider.apiKey || '').trim(),
      baseUrl: String(provider.apiUrl || '').trim(),
    };
  };
}
