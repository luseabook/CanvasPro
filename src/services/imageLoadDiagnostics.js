import { canUseDiagnostics, logDiagnosticEvent } from './diagnosticsService.js';
export function createImageLoadDiagnostics(
  consumer,
  {
    enabled: enabled = canUseDiagnostics(),
    now: now = () => performance['now'](),
    schedule: schedule = setTimeout,
    cancel: cancel = clearTimeout,
    report: report = logDiagnosticEvent,
  } = {},
) {
  if (!enabled) return { mark() {}, finish() {} };
  const startedAt = now(),
    list = [];
  let enabled2 = false,
    timer;
  function run(reason) {
    void report({
      type: 'image.presentation_timing',
      level: 'info',
      message: 'Image presentation stage timing',
      context: {
        consumer: consumer,
        startedAt: startedAt,
        reason: reason,
        elapsedMs: Math['round'](now() - startedAt),
        events: [...list],
      },
    });
  }
  return (
    (timer = schedule(() => {
      if (!enabled2) run('after-two-seconds');
    }, 2000)),
    timer?.['unref']?.(),
    {
      mark(stage, args = {}) {
        if (enabled2) return;
        if (list['length'] >= 20) list['shift']();
        list['push']({ stage: stage, elapsedMs: Math['round'](now() - startedAt), ...args });
        if (stage === 'paint-opportunity') run(stage);
      },
      finish() {
        if (enabled2) return;
        ((enabled2 = true), cancel(timer), run('closed'));
      },
    }
  );
}
export function getImageLoadTiming(width) {
  const resourceDurationMs = globalThis['performance']
    ?.['getEntriesByName']?.(width['currentSrc'] || width['src'])
    ?.['at'](-1);
  return {
    width: width['naturalWidth'] || 0,
    height: width['naturalHeight'] || 0,
    resourceDurationMs: resourceDurationMs ? Math['round'](resourceDurationMs['duration']) : null,
    transferBytes: resourceDurationMs?.['transferSize'] ?? null,
    documentVisible: globalThis['document']?.['visibilityState'] || 'unknown',
  };
}
