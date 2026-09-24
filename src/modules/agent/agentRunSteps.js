const TERMINAL_RUN_STATUSES = new Set(['success', 'failed', 'stopped', 'cancelled']),
  COMMAND_LABELS = Object['freeze']({
    'node.create': '创建节点',
    'node.duplicate': '复制节点',
    'node.setPrompt': '写入提示词',
    'node.appendPrompt': '追加提示词',
    'node.setParams': '设置参数',
    'node.setModel': '设置模型',
    'graph.connect': '连接节点',
    'layout.align': '对齐节点',
    'layout.arrangeRow': '横向排列',
    'layout.arrangeColumn': '纵向排列',
    'layout.arrangeGrid': '网格排列',
    'collage.createFromSelection': '创建拼贴',
    'generation.run': '生成内容',
    'generation.runBatch': '批量生成内容',
  });
function normalizeStatus(_0x3c3021 = '') {
  const _0x8f25fc = String(_0x3c3021 || '')
    ['trim']()
    ['toLowerCase']();
  if (['success', 'succeeded', 'completed', 'done', 'chat']['includes'](_0x8f25fc)) return 'success';
  if (['failed', 'error']['includes'](_0x8f25fc)) return 'failed';
  if (['cancelled', 'canceled', 'stopped']['includes'](_0x8f25fc)) return 'cancelled';
  if (['need_confirmation', 'waiting_confirmation']['includes'](_0x8f25fc)) return 'waiting';
  if (['waiting_tasks', 'pending', 'running', 'planning', 'executing']['includes'](_0x8f25fc))
    return 'running';
  return _0x8f25fc || 'pending';
}
function commandLabel(_0x233bd4 = '') {
  const _0x3c516b = String(_0x233bd4 || '')['trim']();
  return COMMAND_LABELS[_0x3c516b] || _0x3c516b || '执行画布动作';
}
function upsertStep(_0x1f4d22, _0x82ff73, _0x42cd1d = {}) {
  const _0x52f594 = _0x1f4d22['findIndex']((_0xdd114b) => _0xdd114b['key'] === _0x82ff73);
  if (_0x52f594 < 0x0) {
    _0x1f4d22['push']({ key: _0x82ff73, ..._0x42cd1d });
    return;
  }
  _0x1f4d22[_0x52f594] = { ..._0x1f4d22[_0x52f594], ..._0x42cd1d, key: _0x82ff73 };
}
export function buildAgentRunSteps({ runEvents: runEvents = [], currentRun: currentRun = null } = {}) {
  const _0x3f3f04 = Array['isArray'](runEvents) ? runEvents : [],
    _0x586e80 = String(
      currentRun?.['id'] ||
        [..._0x3f3f04]['reverse']()['find']((_0x292d0e) => _0x292d0e?.['runId'])?.['runId'] ||
        '',
    )['trim']();
  if (!_0x586e80) return [];
  const _0x1b981d = _0x3f3f04['filter']((_0x5bd2e8) => String(_0x5bd2e8?.['runId'] || '') === _0x586e80)[
      'sort'
    ]((_0x3a8955, _0x593744) => Number(_0x3a8955['ts'] || 0x0) - Number(_0x593744['ts'] || 0x0)),
    _0x446e2b = [];
  let _0x5b6f05 = '',
    _0x4eef22 = '';
  for (const _0x4a420f of _0x1b981d) {
    if (_0x4a420f['type'] === 'approval.requested')
      ((_0x5b6f05 = _0x586e80 + ':approval:' + (_0x4a420f['step'] || 0x0)),
        upsertStep(_0x446e2b, _0x5b6f05, {
          label: '等待确认',
          status: 'waiting',
          step: Number(_0x4a420f['step'] || 0x0),
          ts: _0x4a420f['ts'],
        }));
    else {
      if (_0x4a420f['type'] === 'approval.confirmed' && _0x5b6f05)
        upsertStep(_0x446e2b, _0x5b6f05, { label: '已确认执行', status: 'success', ts: _0x4a420f['ts'] });
      else {
        if (_0x4a420f['type'] === 'approval.cancelled' && _0x5b6f05)
          upsertStep(_0x446e2b, _0x5b6f05, { label: '已取消执行', status: 'cancelled', ts: _0x4a420f['ts'] });
        else {
          if (_0x4a420f['type'] === 'tool.completed')
            upsertStep(
              _0x446e2b,
              _0x586e80 + ':tool:' + (_0x4a420f['step'] || 0x0) + ':' + _0x4a420f['commandId'],
              {
                label: commandLabel(_0x4a420f['commandId']),
                status: _0x4a420f['ok'] === ![] ? 'failed' : 'success',
                commandId: _0x4a420f['commandId'],
                step: Number(_0x4a420f['step'] || 0x0),
                ts: _0x4a420f['ts'],
              },
            );
          else {
            if (_0x4a420f['type'] === 'task.waiting')
              ((_0x4eef22 = _0x586e80 + ':task-wait:' + (_0x4a420f['step'] || 0x0)),
                upsertStep(_0x446e2b, _0x4eef22, {
                  label: '等待生成任务完成',
                  status: 'running',
                  step: Number(_0x4a420f['step'] || 0x0),
                  ts: _0x4a420f['ts'],
                }));
            else
              _0x4a420f['type'] === 'task.resumed' &&
                _0x4eef22 &&
                upsertStep(_0x446e2b, _0x4eef22, {
                  label: _0x4a420f['status'] === 'failed' ? '生成任务失败' : '生成任务已完成',
                  status: _0x4a420f['status'] === 'failed' ? 'failed' : 'success',
                  ts: _0x4a420f['ts'],
                });
          }
        }
      }
    }
  }
  const _0x3bacfe = normalizeStatus(currentRun?.['status'] || ''),
    _0x2ce687 = TERMINAL_RUN_STATUSES['has'](_0x3bacfe);
  if (currentRun && !_0x2ce687) {
    const _0x1c0764 =
      currentRun['status'] === 'planning'
        ? '规划下一步'
        : currentRun['status'] === 'executing'
          ? '执行画布动作'
          : currentRun['status'] === 'waiting_tasks'
            ? '等待生成任务完成'
            : '处理中';
    (currentRun['status'] !== 'waiting_tasks' || !_0x4eef22) &&
      upsertStep(_0x446e2b, _0x586e80 + ':current', {
        label: _0x1c0764,
        status: _0x3bacfe,
        step: Number(currentRun['step'] || 0x0),
        ts: Date['now'](),
      });
  } else
    currentRun &&
      _0x2ce687 &&
      upsertStep(_0x446e2b, _0x586e80 + ':terminal', {
        label:
          _0x3bacfe === 'success'
            ? '任务完成'
            : currentRun['status'] === 'stopped'
              ? '任务已停止'
              : _0x3bacfe === 'cancelled'
                ? '任务已取消'
                : '任务失败',
        status: _0x3bacfe,
        step: Number(currentRun['step'] || 0x0),
        ts: Date['now'](),
      });
  return _0x446e2b['slice'](-0x8);
}
export const agentRunStepInternals = Object['freeze']({
  normalizeStatus: normalizeStatus,
  commandLabel: commandLabel,
});
