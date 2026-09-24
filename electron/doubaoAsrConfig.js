import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
function firstNonEmptyText(...candidates) {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const text = String(candidate).trim();
    if (text) return text;
  }
  return '';
}
function readJsonObjectFileSync(filePath) {
  try {
    if (!filePath || !existsSync(filePath)) return {};
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function readSecureProviderValue(getSecureSettingsStore, providerId, key) {
  const secureKey = 'apiConfig.providers.' + providerId + '.' + key;
  try {
    return String(getSecureSettingsStore?.()?.getMany?.([secureKey])?.[secureKey] || '').trim();
  } catch {
    return '';
  }
}
export function createDoubaoAsrConfigResolver({
  appRoot: appRoot,
  getSecureSettingsStore: getSecureSettingsStore,
  getUserRoot: getUserRoot,
  processEnv: processEnv = process.env,
} = {}) {
  return function resolveDoubaoAsrConfig({ speechOnly: speechOnly = false } = {}) {
    const userConfigPath = path.join(getUserRoot?.() || '', 'config.json'),
      appConfigPath = path.join(appRoot || '', 'user', 'config.json'),
      userConfig = readJsonObjectFileSync(userConfigPath),
      config = Object.keys(userConfig).length ? userConfig : readJsonObjectFileSync(appConfigPath),
      volcengineProvider =
        config?.providers?.volcengine && typeof config.providers.volcengine === 'object'
          ? config.providers.volcengine
          : {},
      speechProvider =
        config?.providers?.['volcengine-speech'] &&
        typeof config.providers['volcengine-speech'] === 'object'
          ? config.providers['volcengine-speech']
          : {};
    return {
      apiKey: firstNonEmptyText(
        processEnv.VOLCENGINE_ASR_API_KEY,
        processEnv.DOUBAO_ASR_API_KEY,
        readSecureProviderValue(getSecureSettingsStore, 'volcengine-speech', 'apiKey'),
        speechProvider.apiKey,
        speechOnly ? '' : readSecureProviderValue(getSecureSettingsStore, 'volcengine', 'apiKey'),
        speechOnly ? '' : volcengineProvider.apiKey,
      ),
      appKey: firstNonEmptyText(
        processEnv.DOUBAO_ASR_APP_KEY,
        processEnv.VOLCENGINE_ASR_APP_KEY,
        volcengineProvider.asrAppKey,
      ),
      accessKey: firstNonEmptyText(
        processEnv.DOUBAO_ASR_ACCESS_KEY,
        processEnv.VOLCENGINE_ASR_ACCESS_KEY,
        volcengineProvider.asrAccessKey,
      ),
      baseUrl: firstNonEmptyText(
        processEnv.DOUBAO_ASR_API_URL,
        processEnv.VOLCENGINE_ASR_API_URL,
        speechProvider.asrApiUrl,
        speechProvider.apiUrl,
        volcengineProvider.asrApiUrl,
      ),
    };
  };
}
