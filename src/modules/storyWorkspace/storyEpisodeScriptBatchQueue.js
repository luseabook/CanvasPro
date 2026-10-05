export { createStoryTaskBatchCancellationRegistry as createStoryEpisodeScriptBatchCancellationRegistry } from './storyTaskBatchCancellation.js';
export async function runStoryEpisodeScriptBatchQueue({
  targets: targets = [],
  batchId: batchId = '',
  isLive: isLive = () => !![],
  isCancellationRequested: isCancellationRequested = () => ![],
  beforeTarget: beforeTarget = () => {},
  runTarget: runTarget,
  afterTarget: afterTarget = () => {},
} = {}) {
  const total = Array['isArray'](targets) ? [...targets] : [];
  if (typeof runTarget !== 'function') throw new TypeError('runTarget 必须是函数。');
  let completed = 0;
  for (let index = 0; index < total['length']; index += 1) {
    if (!isLive()) return { status: 'interrupted', completed: completed, cancelled: 0 };
    const target = total[index];
    await beforeTarget({
      target: target,
      index: index,
      completed: completed,
      total: total['length'],
      pendingTargets: total['slice'](index),
    });
    const enabled = await runTarget(target, {
      index: index,
      completed: completed,
      total: total['length'],
    });
    if (!enabled || !isLive()) return { status: 'interrupted', completed: completed, cancelled: 0 };
    completed += 1;
    const cancelRequested = Boolean(isCancellationRequested(batchId)),
      pendingTargets = cancelRequested ? [] : total['slice'](completed);
    await afterTarget({
      target: target,
      index: index,
      completed: completed,
      total: total['length'],
      cancelRequested: cancelRequested,
      pendingTargets: pendingTargets,
    });
    if (cancelRequested)
      return {
        status: 'cancelled',
        completed: completed,
        cancelled: Math['max'](0, total['length'] - completed),
      };
  }
  return { status: 'completed', completed: completed, cancelled: 0 };
}
