function isPerfProbeEnabled() {
  return typeof window !== 'undefined' && window['__perfProbeEnabled'] === !![];
}
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
export function createVideoNodeUpdatePerf() {
  if (!isPerfProbeEnabled()) return null;
  const nowMs2 = nowMs();
  let value = nowMs2;
  const sections = [],
    details = {};
  return {
    detail(item, key) {
      details[String(item || '')] = String(key ?? '')['slice'](0, 500);
    },
    mark(index) {
      const nowMs3 = nowMs(),
        durationMs = nowMs3 - value;
      ((value = nowMs3),
        Number['isFinite'](durationMs) &&
          durationMs >= 0 &&
          sections['push']({ name: String(index || ''), durationMs: durationMs }));
    },
    finish() {
      const nowMs4 = nowMs() - nowMs2;
      return {
        totalMs: Number['isFinite'](nowMs4) ? nowMs4 : 0,
        details: details,
        sections: sections['filter']((result) => result['durationMs'] >= 0.05)
          ['sort']((data, options) => options['durationMs'] - data['durationMs'])
          ['slice'](0, 12),
      };
    },
  };
}
