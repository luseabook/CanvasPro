let pendingRuntimeManifestLoad = Promise['resolve'](),
  pendingRuntimeManifestLoadCount = 0x0;
export function trackRuntimeManifestLoad(value) {
  pendingRuntimeManifestLoadCount += 0x1;
  const item = Promise['resolve'](value)
    ['then'](
      () => undefined,
      () => undefined,
    )
    ['finally'](() => {
      pendingRuntimeManifestLoadCount = Math['max'](0x0, pendingRuntimeManifestLoadCount - 0x1);
    });
  return (
    (pendingRuntimeManifestLoad = Promise['all']([pendingRuntimeManifestLoad, item])['then'](
      () => undefined,
    )),
    value
  );
}
export function hasPendingRuntimeManifestLoad() {
  return pendingRuntimeManifestLoadCount > 0x0;
}
export async function waitForRuntimeManifestLoad({ timeoutMs: timeoutMs = 0x1f4 } = {}) {
  const promise = pendingRuntimeManifestLoad,
    enabled = Math['max'](0x0, Number(timeoutMs) || 0x0);
  if (!enabled) return (await promise, !![]);
  let setTimeout2 = null;
  try {
    return await Promise['race']([
      promise['then'](() => !![]),
      new Promise((handler) => {
        setTimeout2 = setTimeout(() => handler(![]), enabled);
      }),
    ]);
  } finally {
    if (setTimeout2 !== null) clearTimeout(setTimeout2);
  }
}
