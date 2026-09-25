export { createStoryTaskBatchCancellationRegistry as createStoryEpisodeScriptBatchCancellationRegistry } from './storyTaskBatchCancellation.js';
export async function runStoryEpisodeScriptBatchQueue({
  targets: targets = [],
  batchId: batchId = '',
  isLive: isLive = () => !![],
  isCancellationRequested: isCancellationRequested = () => ![],
  beforeTarget: beforeTarget = () => {},
  runTarget: _0x209f3f,
  afterTarget: afterTarget = () => {},
} = {}) {
  const _0x2b7a6b = Array['isArray'](targets) ? [...targets] : [];
  if (typeof _0x209f3f !== 'function') throw new TypeError('runTarget 必须是函数。');
  let _0xad1d6c = 0x0;
  for (let _0x16b1f0 = 0x0; _0x16b1f0 < _0x2b7a6b['length']; _0x16b1f0 += 0x1) {
    if (!isLive()) return { status: 'interrupted', completed: _0xad1d6c, cancelled: 0x0 };
    const _0x48b6da = _0x2b7a6b[_0x16b1f0];
    await beforeTarget({
      target: _0x48b6da,
      index: _0x16b1f0,
      completed: _0xad1d6c,
      total: _0x2b7a6b['length'],
      pendingTargets: _0x2b7a6b['slice'](_0x16b1f0),
    });
    const _0x1645c6 = await _0x209f3f(_0x48b6da, {
      index: _0x16b1f0,
      completed: _0xad1d6c,
      total: _0x2b7a6b['length'],
    });
    if (!_0x1645c6 || !isLive()) return { status: 'interrupted', completed: _0xad1d6c, cancelled: 0x0 };
    _0xad1d6c += 0x1;
    const _0x1572c6 = Boolean(isCancellationRequested(batchId)),
      _0x5108a8 = _0x1572c6 ? [] : _0x2b7a6b['slice'](_0xad1d6c);
    await afterTarget({
      target: _0x48b6da,
      index: _0x16b1f0,
      completed: _0xad1d6c,
      total: _0x2b7a6b['length'],
      cancelRequested: _0x1572c6,
      pendingTargets: _0x5108a8,
    });
    if (_0x1572c6)
      return {
        status: 'cancelled',
        completed: _0xad1d6c,
        cancelled: Math['max'](0x0, _0x2b7a6b['length'] - _0xad1d6c),
      };
  }
  return { status: 'completed', completed: _0xad1d6c, cancelled: 0x0 };
}
