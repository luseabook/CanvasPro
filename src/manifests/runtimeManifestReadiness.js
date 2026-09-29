let pendingRuntimeManifestLoad = Promise['resolve'](),
  pendingRuntimeManifestLoadCount = 0x0;
export function trackRuntimeManifestLoad(_0x183aa8) {
  pendingRuntimeManifestLoadCount += 0x1;
  const _0x292c80 = Promise['resolve'](_0x183aa8)
    ['then'](
      () => undefined,
      () => undefined,
    )
    ['finally'](() => {
      pendingRuntimeManifestLoadCount = Math['max'](0x0, pendingRuntimeManifestLoadCount - 0x1);
    });
  return (
    (pendingRuntimeManifestLoad = Promise['all']([pendingRuntimeManifestLoad, _0x292c80])['then'](
      () => undefined,
    )),
    _0x183aa8
  );
}
export function hasPendingRuntimeManifestLoad() {
  return pendingRuntimeManifestLoadCount > 0x0;
}
export async function waitForRuntimeManifestLoad({ timeoutMs: timeoutMs = 0x1f4 } = {}) {
  const _0x4b9d5a = pendingRuntimeManifestLoad,
    _0x182907 = Math['max'](0x0, Number(timeoutMs) || 0x0);
  if (!_0x182907) return (await _0x4b9d5a, !![]);
  let _0x53d353 = null;
  try {
    return await Promise['race']([
      _0x4b9d5a['then'](() => !![]),
      new Promise((_0xf62643) => {
        _0x53d353 = setTimeout(() => _0xf62643(![]), _0x182907);
      }),
    ]);
  } finally {
    if (_0x53d353 !== null) clearTimeout(_0x53d353);
  }
}
