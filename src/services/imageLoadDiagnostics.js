import { canUseDiagnostics, logDiagnosticEvent } from './diagnosticsService.js';
export function createImageLoadDiagnostics(
  _0x4ba18d,
  {
    enabled: enabled = canUseDiagnostics(),
    now: now = () => performance['now'](),
    schedule: schedule = setTimeout,
    cancel: cancel = clearTimeout,
    report: report = logDiagnosticEvent,
  } = {},
) {
  if (!enabled) return { mark() {}, finish() {} };
  const _0xad2c70 = now(),
    _0xfe2537 = [];
  let _0x1c3226 = ![],
    _0x3ffe40;
  function _0x25ec4f(_0x294208) {
    void report({
      type: 'image.presentation_timing',
      level: 'info',
      message: 'Image presentation stage timing',
      context: {
        consumer: _0x4ba18d,
        startedAt: _0xad2c70,
        reason: _0x294208,
        elapsedMs: Math['round'](now() - _0xad2c70),
        events: [..._0xfe2537],
      },
    });
  }
  return (
    (_0x3ffe40 = schedule(() => {
      if (!_0x1c3226) _0x25ec4f('after-two-seconds');
    }, 0x7d0)),
    _0x3ffe40?.['unref']?.(),
    {
      mark(_0x29b5ea, _0x1b8822 = {}) {
        if (_0x1c3226) return;
        if (_0xfe2537['length'] >= 0x14) _0xfe2537['shift']();
        _0xfe2537['push']({ stage: _0x29b5ea, elapsedMs: Math['round'](now() - _0xad2c70), ..._0x1b8822 });
        if (_0x29b5ea === 'paint-opportunity') _0x25ec4f(_0x29b5ea);
      },
      finish() {
        if (_0x1c3226) return;
        ((_0x1c3226 = !![]), cancel(_0x3ffe40), _0x25ec4f('closed'));
      },
    }
  );
}
export function getImageLoadTiming(_0x2e8e29) {
  const _0x40366f = globalThis['performance']
    ?.['getEntriesByName']?.(_0x2e8e29['currentSrc'] || _0x2e8e29['src'])
    ?.['at'](-0x1);
  return {
    width: _0x2e8e29['naturalWidth'] || 0x0,
    height: _0x2e8e29['naturalHeight'] || 0x0,
    resourceDurationMs: _0x40366f ? Math['round'](_0x40366f['duration']) : null,
    transferBytes: _0x40366f?.['transferSize'] ?? null,
    documentVisible: globalThis['document']?.['visibilityState'] || 'unknown',
  };
}
