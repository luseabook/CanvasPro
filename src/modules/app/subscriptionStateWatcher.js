function subscribeToStateSlice(_0x41e3f4, _0x1fe576, _0x33830d) {
  if (typeof _0x33830d !== 'function') return () => {};
  if (typeof _0x41e3f4?.['subscribeSelector'] === 'function')
    return _0x41e3f4['subscribeSelector'](_0x1fe576, _0x33830d);
  _0x33830d(_0x1fe576(_0x41e3f4?.['getStateRaw']?.()));
  if (typeof _0x41e3f4?.['subscribe'] !== 'function') return () => {};
  return _0x41e3f4['subscribe']((_0x53b563) => _0x33830d(_0x1fe576(_0x53b563)));
}
export function subscribeToSubscriptionState(_0x9a4b6c, _0x590e60) {
  return subscribeToStateSlice(_0x9a4b6c, (_0x530948) => _0x530948?.['subscription'] || {}, _0x590e60);
}
export function subscribeToModelCatalogState(_0x55cd12, _0x1714d6) {
  return subscribeToStateSlice(_0x55cd12, (_0x149da3) => _0x149da3?.['modelCatalog'] || {}, _0x1714d6);
}
