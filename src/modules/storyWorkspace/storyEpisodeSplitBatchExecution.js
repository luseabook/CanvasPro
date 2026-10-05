function normalizeText(value) {
  return String(value || '')['trim']();
}
export function resetStoryEpisodeSplitBatchState(options = {}) {
  ((options['episodeBatchSplitOperation'] = ''),
    (options['episodeBatchSplitStatus'] = ''),
    (options['episodeBatchSplitId'] = ''),
    (options['episodeBatchSplitCancelRequested'] = ![]));
}
export async function runStoryEpisodeSplitBatchQueue({
  targets: targets = [],
  batchId: batchId = '',
  isLive: isLive = () => !![],
  isCancellationRequested: isCancellationRequested = () => ![],
  resolveTarget: resolveTarget = (item) => item,
  createMissingTargetError: createMissingTargetError = () => new Error('分集不存在，无法拆分。'),
  runTarget: runTarget,
  onTargetSettled: onTargetSettled = () => {},
} = {}) {
  if (typeof runTarget !== 'function') throw new TypeError('runTarget 必须是函数。');
  const total = Array['isArray'](targets) ? [...targets] : [],
    map = new Set(total),
    failures = [];
  let completed = 0;
  for (let index = 0; index < total['length']; index += 1) {
    if (!isLive())
      return {
        status: 'interrupted',
        completed: completed,
        failures: failures,
        pendingTargets: [...map],
      };
    if (isCancellationRequested(batchId)) break;
    const target = total[index],
      target2 = resolveTarget(target);
    if (!target2) failures['push']({ target: target, error: createMissingTargetError(target) });
    else
      try {
        const enabled = await runTarget(target2, {
          target: target,
          index: index,
          total: total['length'],
        });
        if (!enabled || !isLive())
          return {
            status: 'interrupted',
            completed: completed,
            failures: failures,
            pendingTargets: [...map],
          };
        completed += 1;
      } catch (error) {
        failures['push']({ target: target, error: error });
      }
    (map['delete'](target),
      await onTargetSettled({
        target: target,
        index: index,
        total: total['length'],
        completed: completed,
        failures: failures,
        pendingTargets: [...map],
      }));
    if (isCancellationRequested(batchId)) break;
  }
  const cancelled = Math['max'](0, map['size']);
  return {
    status: isCancellationRequested(batchId) ? 'cancelled' : 'completed',
    completed: completed,
    failures: failures,
    pendingTargets: [...map],
    cancelled: cancelled,
  };
}
export function cancelStoryEpisodeSplitBatch({
  state: state = {},
  tasks: tasks = [],
  isTaskActive: isTaskActive = () => ![],
  requestCancellation: requestCancellation = () => ![],
  updateBatch: updateBatch = () => {},
  setEpisodeRunning: setEpisodeRunning = () => {},
  showToast: showToast = () => {},
  render: render = () => {},
} = {}) {
  const text = normalizeText(state['episodeBatchSplitId']);
  if (!text || !state['episodeBatchSplitOperation']) return ![];
  const enabled2 = tasks['find']((key) => isTaskActive(key) && key['batch']?.['id'] === text);
  if (!enabled2) return ![];
  const pendingEpisodeIds = normalizeText(enabled2['scope']?.['episodeId']),
    cancelledEpisodeIds = (
      Array['isArray'](enabled2['batch']?.['pendingEpisodeIds']) ? enabled2['batch']['pendingEpisodeIds'] : []
    )
      ['map'](normalizeText)
      ['filter']((result) => result && result !== pendingEpisodeIds);
  if (!cancelledEpisodeIds['length'])
    return (showToast('当前集正在拆分，暂无可取消的排队分集。', 'info'), ![]);
  if (!requestCancellation(text)) return ![];
  const label = '已取消后续 ' + cancelledEpisodeIds['length'] + ' 集排队，正在完成当前集';
  return (
    updateBatch(text, {
      cancelRequested: !![],
      cancelledEpisodeIds: cancelledEpisodeIds,
      pendingEpisodeIds: pendingEpisodeIds ? [pendingEpisodeIds] : [],
      label: label,
    }),
    cancelledEpisodeIds['forEach']((data) => setEpisodeRunning(data, ![])),
    (state['episodeBatchSplitCancelRequested'] = !![]),
    (state['episodeBatchSplitStatus'] = label),
    render(),
    !![]
  );
}
export function finalizeStoryEpisodeSplitBatch({
  result: result2,
  batch: batch,
  projectToken: projectToken,
  experimental: experimental = ![],
  selectionMode: selectionMode = ![],
  syncBatch: syncBatch = () => {},
  persist: persist = () => {},
  showToast: showToast = () => {},
  resolveErrorMessage: resolveErrorMessage = (error2) =>
    normalizeText(error2?.['message']) || '分镜拆分失败。',
  notifyFailure: notifyFailure = () => {},
  notifySuccess: notifySuccess = () => {},
} = {}) {
  const source = Number(batch?.['total']) || 0;
  if (result2?.['status'] === 'cancelled')
    return (
      syncBatch({
        completed: result2['completed'],
        cancelRequested: !![],
        pendingEpisodeIds: [],
        cancelledEpisodeIds: result2['pendingTargets'],
        label: '已停止批量拆分 · 完成 ' + result2['completed'] + '/' + source,
      }),
      persist(),
      showToast('已停止后续 ' + result2['cancelled'] + ' 集拆分。', 'info'),
      !![]
    );
  persist();
  if (result2?.['failures']?.['length']) {
    const details = result2['failures'][0],
      errorMessage = resolveErrorMessage(details['error']);
    return (
      notifyFailure(
        (experimental ? '实验模式' : '普通模式') +
          '批量拆分已完成 ' +
          result2['completed'] +
          '/' +
          source +
          ' 集；' +
          errorMessage,
        {
          notificationMessage:
            '批量分镜脚本生成结束：成功 ' +
            result2['completed'] +
            ' 集，失败 ' +
            result2['failures']['length'] +
            ' 集。',
          tone: 'error',
          details: details['error'],
        },
      ),
      ![]
    );
  }
  return (
    notifySuccess(
      selectionMode
        ? '已完成 ' + result2['completed'] + ' 个选中分集的片段拆分。'
        : '已完成全部 ' + result2['completed'] + ' 集片段拆分。',
      {
        notificationMessage: selectionMode
          ? '选中的 ' + result2['completed'] + ' 集分镜脚本生成完成。'
          : '全部 ' + result2['completed'] + ' 集分镜脚本生成完成。',
      },
    ),
    !![]
  );
}
