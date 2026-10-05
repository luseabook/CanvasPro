export function createCollaborationJournal({
  roomId: roomId,
  actorId: actorId,
  clientId: clientId,
  indexedDB: indexedDB = globalThis['indexedDB'],
}) {
  const value = JSON['stringify']([roomId, actorId, clientId]);
  let promise,
    promise2 = Promise['resolve']();
  function run() {
    if (!indexedDB) return Promise['resolve'](null);
    if (!promise)
      promise = new Promise((handler, handler2) => {
        const item = indexedDB['open']('aicanvas-collaboration-recovery', 1);
        ((item['onupgradeneeded'] = () => item['result']['createObjectStore']('pending')),
          (item['onsuccess'] = () => {
            const key = item['result'];
            ((key['onversionchange'] = () => key['close']()), handler(key));
          }),
          (item['onerror'] = () => handler2(item['error'])),
          (item['onblocked'] = () => handler2(new Error('协作恢复存储正被其他窗口占用'))));
      });
    return promise;
  }
  function run2(index, handler3) {
    const result = promise2['catch'](() => {})['then'](async () => {
      const enabled = await run();
      if (!enabled) return null;
      return new Promise((handler4, handler5) => {
        const data = enabled['transaction']('pending', index),
          options = handler3(data['objectStore']('pending'));
        ((data['oncomplete'] = () => handler4(options['result'])),
          (data['onabort'] = data['onerror'] =
            () => handler5(data['error'] || new Error('无法写入协作恢复存储'))));
      });
    });
    return ((promise2 = result), result);
  }
  return {
    available: !!indexedDB,
    read: () => run2('readonly', (map) => map['get'](value)),
    write(args) {
      const structuredClone2 = structuredClone({ ...args, schema: 1 });
      return run2('readwrite', (target) => target['put'](structuredClone2, value));
    },
    clear: () => run2('readwrite', (map2) => map2['delete'](value)),
    async close() {
      await promise2['catch'](() => {});
      const source = await promise?.['catch'](() => null);
      source?.['close']();
    },
  };
}
