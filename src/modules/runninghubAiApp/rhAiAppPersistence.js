export function createRhAiAppPersistence({
  externalBridge: _0x4da953,
  storage: _0x411acd,
  onWarning: _0x1e5f27,
}) {
  let _0x4e23af = Promise['resolve']();
  return (_0x4faee2, { saveApps: saveApps = ![], onCommitted: onCommitted = () => {} } = {}) => {
    const _0x9c5c0f = _0x4e23af['then'](async () => {
      const _0xa3326d = _0x4faee2(),
        _0x8278dd = _0x4da953?.['isAvailable']?.() === !![];
      if (_0x8278dd) {
        const _0x5a654c = await _0x4da953['write'](_0xa3326d);
        if (_0x5a654c?.['ok'] !== !![]) throw new Error(_0x5a654c?.['error'] || '模型文件保存失败，请重试');
      }
      if (saveApps)
        try {
          if (!_0x411acd?.['setItem']) throw new Error('模型存储不可用');
          _0x411acd['setItem'](
            'aiCanvas.runningHubAiApp.savedApps.v1',
            JSON['stringify'](_0xa3326d['savedApps']),
          );
        } catch (_0x21697a) {
          if (!_0x8278dd) throw _0x21697a;
          _0x1e5f27('[RH\x20AI\x20App]\x20local\x20cache\x20update\x20failed:', _0x21697a);
        }
      return (onCommitted(), { ok: !![] });
    });
    return ((_0x4e23af = _0x9c5c0f['catch'](() => {})), _0x9c5c0f);
  };
}
