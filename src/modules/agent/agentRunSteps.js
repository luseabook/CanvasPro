const TERMINAL_RUN_STATUSES = new Set(['success', 'failed', 'stopped', 'cancelled']),
  COMMAND_LABELS = Object.freeze({
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
function normalizeStatus(value = '') {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  if (['success', 'succeeded', 'completed', 'done', 'chat'].includes(item)) return 'success';
  if (['failed', 'error'].includes(item)) return 'failed';
  if (['cancelled', 'canceled', 'stopped'].includes(item)) return 'cancelled';
  if (['need_confirmation', 'waiting_confirmation'].includes(item)) return 'waiting';
  if (['waiting_tasks', 'pending', 'running', 'planning', 'executing'].includes(item)) return 'running';
  return item || 'pending';
}
function commandLabel(key = '') {
  const index = String(key || '').trim();
  return COMMAND_LABELS[index] || index || '执行画布动作';
}
function upsertStep(list, key2, args = {}) {
  const count = list.findIndex((event) => event.key === key2);
  if (count < 0) {
    list.push({ key: key2, ...args });
    return;
  }
  list[count] = { ...list[count], ...args, key: key2 };
}
export function buildAgentRunSteps({ runEvents: runEvents = [], currentRun: currentRun = null } = {}) {
  const list2 = Array.isArray(runEvents) ? runEvents : [],
    enabled = String(
      currentRun?.id || [...list2].reverse().find((result) => result?.runId)?.runId || '',
    ).trim();
  if (!enabled) return [];
  const data = list2.filter((options) => String(options?.runId || '') === enabled).sort(
      (target, source) => Number(target.ts || 0) - Number(source.ts || 0),
    ),
    list3 = [];
  let next = '',
    enabled2 = '';
  for (const ts of data) {
    if (ts.type === 'approval.requested')
      ((next = enabled + ':approval:' + (ts.step || 0)),
        upsertStep(list3, next, {
          label: '等待确认',
          status: 'waiting',
          step: Number(ts.step || 0),
          ts: ts.ts,
        }));
    else {
      if (ts.type === 'approval.confirmed' && next)
        upsertStep(list3, next, { label: '已确认执行', status: 'success', ts: ts.ts });
      else {
        if (ts.type === 'approval.cancelled' && next)
          upsertStep(list3, next, { label: '已取消执行', status: 'cancelled', ts: ts.ts });
        else {
          if (ts.type === 'tool.completed')
            upsertStep(list3, enabled + ':tool:' + (ts.step || 0) + ':' + ts.commandId, {
              label: commandLabel(ts.commandId),
              status: ts.ok === false ? 'failed' : 'success',
              commandId: ts.commandId,
              step: Number(ts.step || 0),
              ts: ts.ts,
            });
          else {
            if (ts.type === 'task.waiting')
              ((enabled2 = enabled + ':task-wait:' + (ts.step || 0)),
                upsertStep(list3, enabled2, {
                  label: '等待生成任务完成',
                  status: 'running',
                  step: Number(ts.step || 0),
                  ts: ts.ts,
                }));
            else
              ts.type === 'task.resumed' &&
                enabled2 &&
                upsertStep(list3, enabled2, {
                  label: ts.status === 'failed' ? '生成任务失败' : '生成任务已完成',
                  status: ts.status === 'failed' ? 'failed' : 'success',
                  ts: ts.ts,
                });
          }
        }
      }
    }
  }
  const status = normalizeStatus(currentRun?.status || ''),
    enabled3 = TERMINAL_RUN_STATUSES.has(status);
  if (currentRun && !enabled3) {
    const label =
      currentRun.status === 'planning'
        ? '规划下一步'
        : currentRun.status === 'executing'
          ? '执行画布动作'
          : currentRun.status === 'waiting_tasks'
            ? '等待生成任务完成'
            : '处理中';
    (currentRun.status !== 'waiting_tasks' || !enabled2) &&
      upsertStep(list3, enabled + ':current', {
        label: label,
        status: status,
        step: Number(currentRun.step || 0),
        ts: Date.now(),
      });
  } else
    currentRun &&
      enabled3 &&
      upsertStep(list3, enabled + ':terminal', {
        label:
          status === 'success'
            ? '任务完成'
            : currentRun.status === 'stopped'
              ? '任务已停止'
              : status === 'cancelled'
                ? '任务已取消'
                : '任务失败',
        status: status,
        step: Number(currentRun.step || 0),
        ts: Date.now(),
      });
  return list3.slice(-8);
}
export const agentRunStepInternals = Object.freeze({
  normalizeStatus: normalizeStatus,
  commandLabel: commandLabel,
});
