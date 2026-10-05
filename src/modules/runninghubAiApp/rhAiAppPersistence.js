export function createRhAiAppPersistence({
  externalBridge: externalBridge,
  storage: storage,
  onWarning: onWarning,
}) {
  let promise = Promise['resolve']();
  return (handler, { saveApps: saveApps = ![], onCommitted: onCommitted = () => {} } = {}) => {
    const promise2 = promise['then'](async () => {
      const value = handler(),
        enabled = externalBridge?.['isAvailable']?.() === !![];
      if (enabled) {
        const response = await externalBridge['write'](value);
        if (response?.['ok'] !== !![]) throw new Error(response?.['error'] || '模型文件保存失败，请重试');
      }
      if (saveApps)
        try {
          if (!storage?.['setItem']) throw new Error('模型存储不可用');
          storage['setItem']('aiCanvas.runningHubAiApp.savedApps.v1', JSON['stringify'](value['savedApps']));
        } catch (item) {
          if (!enabled) throw item;
          onWarning('[RH AI App] local cache update failed:', item);
        }
      return (onCommitted(), { ok: !![] });
    });
    return ((promise = promise2['catch'](() => {})), promise2);
  };
}
