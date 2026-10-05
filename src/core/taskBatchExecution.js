function normalizeConcurrency(value, item) {
  const count = Math['trunc'](Number(value));
  if (!Number['isFinite'](count) || count <= 0) return 1;
  return Math['max'](1, Math['min'](count, Math['max'](1, item)));
}
export function createTaskBatchCancellationController() {
  let key = false;
  return Object['freeze']({
    request() {
      if (key) return false;
      return ((key = true), true);
    },
    isRequested: () => key,
  });
}
export async function runTaskBatchQueue({
  targets: targets = [],
  concurrency: concurrency = 1,
  shouldStop: shouldStop = () => false,
  runTarget: runTarget,
  onTargetStart: onTargetStart = () => {},
  onTargetSettled: onTargetSettled = () => {},
} = {}) {
  const total = Array['isArray'](targets)
    ? targets['filter']((index) => index !== null && index !== undefined)
    : [];
  if (!total['length']) return [];
  if (typeof runTarget !== 'function') throw new TypeError('runTarget must be a function');
  const enabled = new Array(total['length']);
  let result = 0;
  const length = normalizeConcurrency(concurrency, total['length']),
    data = Array['from']({ length: length }, async () => {
      while (result < total['length'] && !shouldStop()) {
        const index2 = result;
        result += 1;
        const target = total[index2];
        onTargetStart({ target: target, index: index2, total: total['length'] });
        let args;
        try {
          const value2 = await runTarget(target, { index: index2, total: total['length'] });
          args = { target: target, status: 'fulfilled', value: value2 };
        } catch (reason) {
          args = { target: target, status: 'rejected', reason: reason };
        }
        ((enabled[index2] = args), await onTargetSettled({ ...args, index: index2, total: total['length'] }));
      }
    });
  await Promise['all'](data);
  for (let options = 0; options < total['length']; options += 1) {
    !enabled[options] && (enabled[options] = { target: total[options], status: 'cancelled' });
  }
  return enabled;
}
