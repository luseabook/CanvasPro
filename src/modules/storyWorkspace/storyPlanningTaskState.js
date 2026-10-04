import { getStoryVideoEpisodes } from './storyWorkspaceNavigationTransaction.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export async function runStoryEpisodeSplitBatchTasks(
  list = [],
  handler = null,
  { onSettled: onSettled = null } = {},
) {
  if (typeof handler !== 'function') throw new TypeError('分集批量拆分需要可执行的任务函数。');
  return Promise['all'](
    (Array['isArray'](list) ? list : [])['map'](async (target, index) => {
      let item;
      try {
        item = {
          status: 'fulfilled',
          value: await handler(target, index),
          target: target,
          index: index,
        };
      } catch (reason) {
        item = { status: 'rejected', reason: reason, target: target, index: index };
      }
      if (typeof onSettled === 'function') await onSettled(item);
      return item;
    }),
  );
}
export function getStoryEpisodeBatchTargets(list2 = [], key = [], enabled = ![]) {
  const list3 = getStoryVideoEpisodes(list2);
  if (!enabled) return [...list3];
  const map = new Set((Array['isArray'](key) ? key : [])['map'](normalizeText)['filter'](Boolean));
  return list3['filter']((result) => map['has'](normalizeText(result?.['id'])));
}
export function getStoryEpisodeCardAction(options = {}) {
  const count = Math['max'](
    Number(options?.['clipCount']) || 0x0,
    Array['isArray'](options?.['clips']) ? options['clips']['length'] : 0x0,
  );
  return count > 0x0 ? { kind: 'edit', label: '进入编辑' } : { kind: 'generate', label: '生成分镜脚本' };
}
export function setStoryEpisodeSplitRunning(args, data, source = !![]) {
  if (!args || typeof args !== 'object') return [];
  const text = normalizeText(data),
    map2 = new Set(
      (Array['isArray'](args['splittingEpisodeIds']) ? args['splittingEpisodeIds'] : [])
        ['map']((next) => normalizeText(next))
        ['filter'](Boolean),
    );
  if (text) {
    if (source) map2['add'](text);
    else map2['delete'](text);
  }
  return ((args['splittingEpisodeIds'] = [...map2]), [...args['splittingEpisodeIds']]);
}
export function isStoryAssetExtractionOperation(current = '') {
  return normalizeText(current)['startsWith']('extracting-assets');
}
export function getStoryEpisodeBatchControlState(cancelRequested = {}) {
  const text2 = normalizeText(cancelRequested['storyPlanningOperation']),
    operation = normalizeText(cancelRequested['episodeBatchSplitOperation']),
    entry = Boolean(text2 && text2 !== 'splitting-episode');
  return {
    isGenerating: Boolean(operation),
    disabled: Boolean(operation || entry),
    operation: operation,
    label: normalizeText(cancelRequested['episodeBatchSplitStatus']),
    ...(operation
      ? {
          batchId: normalizeText(cancelRequested['episodeBatchSplitId']),
          cancelRequested: cancelRequested['episodeBatchSplitCancelRequested'] === !![],
        }
      : {}),
  };
}
