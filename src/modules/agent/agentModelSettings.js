const STORAGE_KEY = 'aiCanvas.agentModelSettings.v1',
  DEFAULT_AGENT_MODEL_SETTINGS = Object.freeze({
    provider: '',
    model: '',
    temperature: 0,
    executionMode: 'manual',
  });
function getWindowObject(value) {
  if (value) return value;
  if (typeof window !== 'undefined') return window;
  return null;
}
function normalizeSettings(options = {}) {
  const executionMode = String(options.executionMode || '').trim() === 'auto' ? 'auto' : 'manual';
  return {
    provider: String(options.provider || '').trim(),
    model: String(options.model || '').trim(),
    temperature: Number.isFinite(Number(options.temperature))
      ? Math.max(0, Math.min(2, Number(options.temperature)))
      : DEFAULT_AGENT_MODEL_SETTINGS.temperature,
    executionMode: executionMode,
  };
}
export function createAgentModelSettings({ windowObject: windowObject = undefined } = {}) {
  const windowObject2 = getWindowObject(windowObject);
  function getSettings() {
    try {
      const enabled = windowObject2?.localStorage?.getItem?.(STORAGE_KEY);
      if (!enabled) return { ...DEFAULT_AGENT_MODEL_SETTINGS };
      return normalizeSettings({ ...DEFAULT_AGENT_MODEL_SETTINGS, ...JSON.parse(enabled) });
    } catch {
      return { ...DEFAULT_AGENT_MODEL_SETTINGS };
    }
  }
  function updateSettings(args = {}) {
    const settings = normalizeSettings({ ...getSettings(), ...args });
    try {
      windowObject2?.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
    return settings;
  }
  return { getSettings: getSettings, updateSettings: updateSettings };
}
export { DEFAULT_AGENT_MODEL_SETTINGS };
