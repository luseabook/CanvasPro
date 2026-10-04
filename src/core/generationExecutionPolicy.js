const policies = new WeakMap();
export function setGenerationExecutionPolicy(value, item) {
  return (
    policies['set'](value, item),
    () => {
      if (policies['get'](value) === item) policies['delete'](value);
    }
  );
}
export function acquireGenerationExecution(key, index, result = {}) {
  return policies['get'](key)?.['acquire']?.(index, result) || (() => {});
}
