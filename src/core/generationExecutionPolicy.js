const policies = new WeakMap();
export function setGenerationExecutionPolicy(_0x1a50f6, _0xde1a2c) {
  return (
    policies['set'](_0x1a50f6, _0xde1a2c),
    () => {
      if (policies['get'](_0x1a50f6) === _0xde1a2c) policies['delete'](_0x1a50f6);
    }
  );
}
export function acquireGenerationExecution(_0x14b4b3, _0xb6cfa5, _0x2068d1 = {}) {
  return policies['get'](_0x14b4b3)?.['acquire']?.(_0xb6cfa5, _0x2068d1) || (() => {});
}
