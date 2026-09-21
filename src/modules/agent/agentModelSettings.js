const STORAGE_KEY = 'aiCanvas.agentModelSettings.v1',
  DEFAULT_AGENT_MODEL_SETTINGS = Object.freeze({
    provider: '',
    model: '',
    temperature: 0,
    executionMode: 'manual',
  });
function getWindowObject(_0x5f3768) {
  if (_0x5f3768) return _0x5f3768;
  if (typeof window !== 'undefined') return window;
  return null;
}
function normalizeSettings(_0x3e0052 = {}) {
  const _0x4d94c7 = String(_0x3e0052.executionMode || '').trim() === 'auto' ? 'auto' : 'manual';
  return {
    provider: String(_0x3e0052.provider || '').trim(),
    model: String(_0x3e0052.model || '').trim(),
    temperature: Number.isFinite(Number(_0x3e0052.temperature))
      ? Math.max(0, Math.min(2, Number(_0x3e0052.temperature)))
      : DEFAULT_AGENT_MODEL_SETTINGS.temperature,
    executionMode: _0x4d94c7,
  };
}
export function createAgentModelSettings({ windowObject: windowObject = undefined } = {}) {
  const _0x5e1303 = getWindowObject(windowObject);
  function _0x492d89() {
    try {
      const _0x2e87e3 = _0x5e1303?.localStorage?.getItem?.(STORAGE_KEY);
      if (!_0x2e87e3) return { ...DEFAULT_AGENT_MODEL_SETTINGS };
      return normalizeSettings({ ...DEFAULT_AGENT_MODEL_SETTINGS, ...JSON.parse(_0x2e87e3) });
    } catch {
      return { ...DEFAULT_AGENT_MODEL_SETTINGS };
    }
  }
  function _0x5703ea(_0x30988e = {}) {
    const _0x221997 = normalizeSettings({ ..._0x492d89(), ..._0x30988e });
    try {
      _0x5e1303?.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(_0x221997));
    } catch {}
    return _0x221997;
  }
  return { getSettings: _0x492d89, updateSettings: _0x5703ea };
}
export { DEFAULT_AGENT_MODEL_SETTINGS };
