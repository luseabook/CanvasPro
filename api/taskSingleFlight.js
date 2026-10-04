const _inflightTasks = new Map();
function normalizeKeyPart(value) {
  return String(value || '').trim();
}
export function buildTaskSingleFlightKey({
  provider: provider,
  kind: kind,
  taskId: taskId,
  submitId: submitId,
  id: id,
} = {}) {
  const keyPart = normalizeKeyPart(provider),
    keyPart2 = normalizeKeyPart(kind),
    keyPart3 = normalizeKeyPart(taskId || submitId || id);
  if (!keyPart || !keyPart2 || !keyPart3) return '';
  return keyPart + ':' + keyPart2 + ':' + keyPart3;
}
export function runTaskSingleFlight(item, handler) {
  if (typeof handler !== 'function')
    return Promise.reject(new TypeError('task single-flight factory must be a function'));
  const taskSingleFlightKey = buildTaskSingleFlightKey(item);
  if (!taskSingleFlightKey) return Promise.resolve().then(() => handler());
  const key = _inflightTasks.get(taskSingleFlightKey);
  if (key) return key;
  const promise = Promise.resolve().then(handler);
  return (
    _inflightTasks.set(taskSingleFlightKey, promise),
    promise
      .finally(() => {
        _inflightTasks.get(taskSingleFlightKey) === promise && _inflightTasks.delete(taskSingleFlightKey);
      })
      .catch(() => {}),
    promise
  );
}
export function __clearTaskSingleFlightForTest() {
  _inflightTasks.clear();
}
