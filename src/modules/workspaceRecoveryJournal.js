const JOURNAL_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createWorkspaceRecoveryJournal({
  storage = globalThis.localStorage,
  key = 'canvas:workspace-recovery',
  now = () => Date.now(),
} = {}) {
  const enabled = !!storage && typeof storage.getItem === 'function';
  function read() {
    if (!enabled) return null;
    try {
      const value = JSON.parse(storage.getItem(key) || 'null');
      if (value?.version !== JOURNAL_VERSION || !value.snapshot) return null;
      return { savedAt: Number(value.savedAt) || 0, snapshot: clone(value.snapshot) };
    } catch {
      return null;
    }
  }
  function write(snapshot) {
    if (!enabled || !snapshot) return false;
    try {
      storage.setItem(key, JSON.stringify({ version: JOURNAL_VERSION, savedAt: now(), snapshot }));
      return true;
    } catch {
      return false;
    }
  }
  function clear() {
    if (!enabled) return;
    try {
      storage.removeItem(key);
    } catch {}
  }
  return Object.freeze({ read, write, clear });
}
