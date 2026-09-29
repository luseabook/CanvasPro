import { getStoryVideoEpisodes } from './storyWorkspaceNavigationTransaction.js';
function normalizeText(_0x4bc989) {
  return String(_0x4bc989 || '')['trim']();
}
export async function runStoryEpisodeSplitBatchTasks(
  _0x451f9e = [],
  _0x36dbfc = null,
  { onSettled: onSettled = null } = {},
) {
  if (typeof _0x36dbfc !== 'function') throw new TypeError('分集批量拆分需要可执行的任务函数。');
  return Promise['all'](
    (Array['isArray'](_0x451f9e) ? _0x451f9e : [])['map'](async (_0x19b2aa, _0xe6cd71) => {
      let _0x32adaa;
      try {
        _0x32adaa = {
          status: 'fulfilled',
          value: await _0x36dbfc(_0x19b2aa, _0xe6cd71),
          target: _0x19b2aa,
          index: _0xe6cd71,
        };
      } catch (_0x4ee4bd) {
        _0x32adaa = { status: 'rejected', reason: _0x4ee4bd, target: _0x19b2aa, index: _0xe6cd71 };
      }
      if (typeof onSettled === 'function') await onSettled(_0x32adaa);
      return _0x32adaa;
    }),
  );
}
export function getStoryEpisodeBatchTargets(_0x1e9a07 = [], _0x64b5af = [], _0x31ab6b = ![]) {
  const _0x3dfbdf = getStoryVideoEpisodes(_0x1e9a07);
  if (!_0x31ab6b) return [..._0x3dfbdf];
  const _0x5d80ee = new Set(
    (Array['isArray'](_0x64b5af) ? _0x64b5af : [])['map'](normalizeText)['filter'](Boolean),
  );
  return _0x3dfbdf['filter']((_0x169ef1) => _0x5d80ee['has'](normalizeText(_0x169ef1?.['id'])));
}
export function getStoryEpisodeCardAction(_0x18d6f1 = {}) {
  const _0x4b5f0a = Math['max'](
    Number(_0x18d6f1?.['clipCount']) || 0x0,
    Array['isArray'](_0x18d6f1?.['clips']) ? _0x18d6f1['clips']['length'] : 0x0,
  );
  return _0x4b5f0a > 0x0 ? { kind: 'edit', label: '进入编辑' } : { kind: 'generate', label: '生成分镜脚本' };
}
export function setStoryEpisodeSplitRunning(_0x55e1e6, _0x4e5512, _0x509dac = !![]) {
  if (!_0x55e1e6 || typeof _0x55e1e6 !== 'object') return [];
  const _0x42b8d2 = normalizeText(_0x4e5512),
    _0x1802c8 = new Set(
      (Array['isArray'](_0x55e1e6['splittingEpisodeIds']) ? _0x55e1e6['splittingEpisodeIds'] : [])
        ['map']((_0x16d85d) => normalizeText(_0x16d85d))
        ['filter'](Boolean),
    );
  if (_0x42b8d2) {
    if (_0x509dac) _0x1802c8['add'](_0x42b8d2);
    else _0x1802c8['delete'](_0x42b8d2);
  }
  return ((_0x55e1e6['splittingEpisodeIds'] = [..._0x1802c8]), [..._0x55e1e6['splittingEpisodeIds']]);
}
export function isStoryAssetExtractionOperation(_0x2137ce = '') {
  return normalizeText(_0x2137ce)['startsWith']('extracting-assets');
}
export function getStoryEpisodeBatchControlState(_0x1ce2f3 = {}) {
  const _0x46244e = normalizeText(_0x1ce2f3['storyPlanningOperation']),
    _0x19dab5 = normalizeText(_0x1ce2f3['episodeBatchSplitOperation']),
    _0x4acd75 = Boolean(_0x46244e && _0x46244e !== 'splitting-episode');
  return {
    isGenerating: Boolean(_0x19dab5),
    disabled: Boolean(_0x19dab5 || _0x4acd75),
    operation: _0x19dab5,
    label: normalizeText(_0x1ce2f3['episodeBatchSplitStatus']),
    ...(_0x19dab5
      ? {
          batchId: normalizeText(_0x1ce2f3['episodeBatchSplitId']),
          cancelRequested: _0x1ce2f3['episodeBatchSplitCancelRequested'] === !![],
        }
      : {}),
  };
}
