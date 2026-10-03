import { isAllowedSecureSettingKey } from './secureSettingsStore.js';
const INVALID_KEY_MESSAGE = 'Invalid secure setting key';
const UNAVAILABLE_MESSAGE = '安全存储不可用';

export function createSecureSettingsCapabilityOperations({
  getSecureSettingsStore,
  normalizeSecureSettingsKeys,
} = {}) {
  const describeError = (error) => String(error?.message || error);
  const allowedKeys = payload => normalizeSecureSettingsKeys?.(payload)?.filter(isAllowedSecureSettingKey) || [];
  return {
    get(payload = {}) {
      let available = false;
      try {
        const store = getSecureSettingsStore();
        available = store?.isAvailable?.() === true;
        const keys = allowedKeys(payload);
        return {
          ok: true,
          available,
          values: available && keys.length > 0 ? store.getMany(keys) : {},
        };
      } catch (error) {
        return { ok: false, available, values: {}, error: describeError(error) };
      }
    },
    set(payload = {}) {
      let available = false;
      try {
        const store = getSecureSettingsStore();
        available = store?.isAvailable?.() === true;
        if (!available) return { ok: false, available, error: UNAVAILABLE_MESSAGE };
        const [key = ''] = allowedKeys({ key: payload?.key });
        if (!key) return { ok: false, available, error: INVALID_KEY_MESSAGE };
        store.set(key, payload?.value);
        return { ok: true, available };
      } catch (error) {
        return { ok: false, available, error: describeError(error) };
      }
    },
    delete(payload = {}) {
      let available = false;
      try {
        const store = getSecureSettingsStore();
        available = store?.isAvailable?.() === true;
        if (!available) return { ok: false, available, error: UNAVAILABLE_MESSAGE };
        const [key = ''] = allowedKeys({ key: payload?.key });
        if (!key) return { ok: false, available, error: INVALID_KEY_MESSAGE };
        store.delete(key);
        return { ok: true, available };
      } catch (error) {
        return { ok: false, available, error: describeError(error) };
      }
    },
  };
}
