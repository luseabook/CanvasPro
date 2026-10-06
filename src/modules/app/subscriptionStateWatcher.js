function subscribeToStateSlice(store, handler, handler2) {
  if (typeof handler2 !== 'function') return () => {};
  if (typeof store?.subscribeSelector === 'function')
    return store.subscribeSelector(handler, handler2);
  handler2(handler(store?.getStateRaw?.()));
  if (typeof store?.subscribe !== 'function') return () => {};
  return store.subscribe((value) => handler2(handler(value)));
}
export function subscribeToSubscriptionState(item, key) {
  return subscribeToStateSlice(item, (index) => index?.subscription || {}, key);
}
export function subscribeToModelCatalogState(result, data) {
  return subscribeToStateSlice(result, (options) => options?.modelCatalog || {}, data);
}
