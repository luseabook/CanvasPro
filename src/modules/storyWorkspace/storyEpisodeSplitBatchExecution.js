function normalizeText(_0xd56999) {
  return String(_0xd56999 || '')['trim']();
}
export function resetStoryEpisodeSplitBatchState(_0x1fb60f = {}) {
  ((_0x1fb60f['episodeBatchSplitOperation'] = ''),
    (_0x1fb60f['episodeBatchSplitStatus'] = ''),
    (_0x1fb60f['episodeBatchSplitId'] = ''),
    (_0x1fb60f['episodeBatchSplitCancelRequested'] = ![]));
}
export async function runStoryEpisodeSplitBatchQueue({
  targets: targets = [],
  batchId: batchId = '',
  isLive: isLive = () => !![],
  isCancellationRequested: isCancellationRequested = () => ![],
  resolveTarget: resolveTarget = (_0x218535) => _0x218535,
  createMissingTargetError: createMissingTargetError = () => new Error('分集不存在，无法拆分。'),
  runTarget: _0x9a1a43,
  onTargetSettled: onTargetSettled = () => {},
} = {}) {
  if (typeof _0x9a1a43 !== 'function') throw new TypeError('runTarget 必须是函数。');
  const _0x44f471 = Array['isArray'](targets) ? [...targets] : [],
    _0x310697 = new Set(_0x44f471),
    _0x24c7f8 = [];
  let _0x19aff9 = 0x0;
  for (let _0x377e96 = 0x0; _0x377e96 < _0x44f471['length']; _0x377e96 += 0x1) {
    if (!isLive())
      return {
        status: 'interrupted',
        completed: _0x19aff9,
        failures: _0x24c7f8,
        pendingTargets: [..._0x310697],
      };
    if (isCancellationRequested(batchId)) break;
    const _0x57f37c = _0x44f471[_0x377e96],
      _0x42d018 = resolveTarget(_0x57f37c);
    if (!_0x42d018) _0x24c7f8['push']({ target: _0x57f37c, error: createMissingTargetError(_0x57f37c) });
    else
      try {
        const _0x4caa47 = await _0x9a1a43(_0x42d018, {
          target: _0x57f37c,
          index: _0x377e96,
          total: _0x44f471['length'],
        });
        if (!_0x4caa47 || !isLive())
          return {
            status: 'interrupted',
            completed: _0x19aff9,
            failures: _0x24c7f8,
            pendingTargets: [..._0x310697],
          };
        _0x19aff9 += 0x1;
      } catch (_0x577aa8) {
        _0x24c7f8['push']({ target: _0x57f37c, error: _0x577aa8 });
      }
    (_0x310697['delete'](_0x57f37c),
      await onTargetSettled({
        target: _0x57f37c,
        index: _0x377e96,
        total: _0x44f471['length'],
        completed: _0x19aff9,
        failures: _0x24c7f8,
        pendingTargets: [..._0x310697],
      }));
    if (isCancellationRequested(batchId)) break;
  }
  const _0x52ff97 = Math['max'](0x0, _0x310697['size']);
  return {
    status: isCancellationRequested(batchId) ? 'cancelled' : 'completed',
    completed: _0x19aff9,
    failures: _0x24c7f8,
    pendingTargets: [..._0x310697],
    cancelled: _0x52ff97,
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
  const _0x33f615 = normalizeText(state['episodeBatchSplitId']);
  if (!_0x33f615 || !state['episodeBatchSplitOperation']) return ![];
  const _0x5ac1d5 = tasks['find'](
    (_0x1d5239) => isTaskActive(_0x1d5239) && _0x1d5239['batch']?.['id'] === _0x33f615,
  );
  if (!_0x5ac1d5) return ![];
  const _0x3d1d47 = normalizeText(_0x5ac1d5['scope']?.['episodeId']),
    _0x2d5a42 = (
      Array['isArray'](_0x5ac1d5['batch']?.['pendingEpisodeIds'])
        ? _0x5ac1d5['batch']['pendingEpisodeIds']
        : []
    )
      ['map'](normalizeText)
      ['filter']((_0xa9dc9c) => _0xa9dc9c && _0xa9dc9c !== _0x3d1d47);
  if (!_0x2d5a42['length']) return (showToast('当前集正在拆分，暂无可取消的排队分集。', 'info'), ![]);
  if (!requestCancellation(_0x33f615)) return ![];
  const _0x2bdecc = '已取消后续\x20' + _0x2d5a42['length'] + ' 集排队，正在完成当前集';
  return (
    updateBatch(_0x33f615, {
      cancelRequested: !![],
      cancelledEpisodeIds: _0x2d5a42,
      pendingEpisodeIds: _0x3d1d47 ? [_0x3d1d47] : [],
      label: _0x2bdecc,
    }),
    _0x2d5a42['forEach']((_0x13a071) => setEpisodeRunning(_0x13a071, ![])),
    (state['episodeBatchSplitCancelRequested'] = !![]),
    (state['episodeBatchSplitStatus'] = _0x2bdecc),
    render(),
    !![]
  );
}
export function finalizeStoryEpisodeSplitBatch({
  result: _0x48a663,
  batch: _0x3751ff,
  projectToken: _0x3a27dd,
  experimental: experimental = ![],
  selectionMode: selectionMode = ![],
  syncBatch: syncBatch = () => {},
  persist: persist = () => {},
  showToast: showToast = () => {},
  resolveErrorMessage: resolveErrorMessage = (_0x1c3de2) =>
    normalizeText(_0x1c3de2?.['message']) || '分镜拆分失败。',
  notifyFailure: notifyFailure = () => {},
  notifySuccess: notifySuccess = () => {},
} = {}) {
  const _0x5b6de7 = Number(_0x3751ff?.['total']) || 0x0;
  if (_0x48a663?.['status'] === 'cancelled')
    return (
      syncBatch({
        completed: _0x48a663['completed'],
        cancelRequested: !![],
        pendingEpisodeIds: [],
        cancelledEpisodeIds: _0x48a663['pendingTargets'],
        label: '已停止批量拆分\x20·\x20完成\x20' + _0x48a663['completed'] + '/' + _0x5b6de7,
      }),
      persist(),
      showToast('已停止后续 ' + _0x48a663['cancelled'] + '\x20集拆分。', 'info'),
      !![]
    );
  persist();
  if (_0x48a663?.['failures']?.['length']) {
    const _0x1cb21d = _0x48a663['failures'][0x0],
      _0x5ce61d = resolveErrorMessage(_0x1cb21d['error']);
    return (
      notifyFailure(
        (experimental ? '实验模式' : '普通模式') +
          '批量拆分已完成 ' +
          _0x48a663['completed'] +
          '/' +
          _0x5b6de7 +
          ' 集；' +
          _0x5ce61d,
        {
          notificationMessage:
            '批量分镜脚本生成结束：成功 ' +
            _0x48a663['completed'] +
            ' 集，失败 ' +
            _0x48a663['failures']['length'] +
            '\x20集。',
          tone: 'error',
          details: _0x1cb21d['error'],
        },
      ),
      ![]
    );
  }
  return (
    notifySuccess(
      selectionMode
        ? '已完成 ' + _0x48a663['completed'] + ' 个选中分集的片段拆分。'
        : '已完成全部\x20' + _0x48a663['completed'] + ' 集片段拆分。',
      {
        notificationMessage: selectionMode
          ? '选中的 ' + _0x48a663['completed'] + ' 集分镜脚本生成完成。'
          : '全部 ' + _0x48a663['completed'] + ' 集分镜脚本生成完成。',
      },
    ),
    !![]
  );
}
