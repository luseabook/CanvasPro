function defaultNormalizeKey(key) {
  const normalized = String(key || '').trim();
  if (!normalized) throw new TypeError('operation key must be a non-empty string');
  return normalized;
}
export function createKeyedOperationQueue({ normalizeKey = defaultNormalizeKey } = {}) {
  if (typeof normalizeKey !== 'function') throw new TypeError('normalizeKey must be a function');
  const chains = new Map();
  async function run(key, operation) {
    if (typeof operation !== 'function') throw new TypeError('operation must be a function');
    const normalizedKey = normalizeKey(key),
      previous = chains.get(normalizedKey) || Promise.resolve();
    let release;
    const gate = new Promise((resolve) => {
        release = resolve;
      }),
      current = previous.catch(() => undefined).then(() => gate);
    (chains.set(normalizedKey, current), await previous.catch(() => undefined));
    try {
      return await operation();
    } finally {
      (release(), chains.get(normalizedKey) === current && chains.delete(normalizedKey));
    }
  }
  return {
    run: run,
    get pendingKeyCount() {
      return chains.size;
    },
  };
}
export function createCaseInsensitivePathKey(inputPath) {
  const normalized = defaultNormalizeKey(inputPath);
  return process.platform === 'win32' || process.platform === 'darwin'
    ? normalized.toLowerCase()
    : normalized;
}
