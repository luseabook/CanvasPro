import { createStoryMediaBatchRunner } from './storyMediaBatchRunner.js';
import { createStoryMediaBatchRuntime } from './storyMediaBatchRuntime.js';

export function createStoryMediaBatchPanel({ element, runtimeOptions, items, onClose,
  title = '镜头媒体批次 · 先准备，再确认发送', closeLabel = '返回镜头媒体', promptLabel = '本项待发送镜头文字',
  description = '最多6项，同一页面批次串行调用原 runGeneration；只用本镜文字和原模型默认参数，不自动连接人物/场景图。准备仅挂载新建节点；不是发送或恢复按钮。' }) {
  const root = element('section', 'sw-main'); root.tabIndex = -1;
  const abort = new AbortController();
  const status = element('p', 'sw-status'), review = element('div'), rows = element('div');
  let preparedReview = [], destroyed = false, runner;
  function button(label, action) {
    const node = element('button', 'sw-button', label); node.type = 'button';
    node.addEventListener('click', () => {
      Promise.resolve().then(action).catch(error => { if (!destroyed) status.textContent = error.message; });
    }, { signal: abort.signal });
    return node;
  }
  const prepareButton = button('准备原节点（不提交生成）', () => runner.prepare());
  const startButton = button('确认费用并开始 / 继续未发送项', async () => {
    const pending = runner.snapshot().jobs.filter(job => job.state === 'held');
    if (!pending.length) return;
    const selected = preparedReview.filter(item => pending.some(job => job.nodeId === item.nodeId));
    if (!window.confirm(`将逐项调用 ${pending.length} 个原媒体生成节点，可能分别计费。\n${selected.map(item => `${item.kind} · ${item.provider} / ${item.model} · ${item.prompt.length}字符`).join('\n')}\n请核对下方提示词、原模型默认参数及账号/中转配置。本批不添加媒体引用，费用不固定；一次节点调用不等于一次HTTP或一次账单。\n失败或未知时暂停；暂停/关闭不保证取消在途执行或计费。尝试记录需另存工程，未落盘不能保证刷新后的防重复。确定开始？`)) return;
    await runner.start();
  });
  const pauseButton = button('暂停后续（不取消当前）', () => runner.pause());
  const closeButton = button(closeLabel, () => {
    if ((runner.snapshot().running || runner.snapshot().preparing) && !window.confirm('停止后续并返回？已经调用的任务仍可能执行和计费，结果保留在原节点；这不是取消厂商任务。')) return;
    onClose();
  });
  function render(state) {
    if (destroyed) return;
    prepareButton.disabled = state.preparing || state.running || state.prepared;
    startButton.disabled = state.preparing || state.running || !preparedReview.length || !state.jobs.some(job => job.state === 'held');
    pauseButton.disabled = !state.preparing && !state.running;
    status.textContent = `批次：${state.phase}。${state.running ? '正在等待原节点；结果不会自动采纳。' : '未发送项不会自行启动；继续需要重新确认。'}`;
    rows.replaceChildren();
    for (const job of state.jobs) rows.append(element('p', '', `${job.nodeId} · ${job.state} · ${job.message}`));
  }
  const prepare = createStoryMediaBatchRuntime({ ...runtimeOptions, items, onReview: values => {
    preparedReview = values; review.replaceChildren();
    for (const item of values) {
      const details = element('details'); details.append(element('summary', '', `${item.kind} · ${item.provider} / ${item.model} · ${item.nodeId}`));
      const text = element('textarea'); text.readOnly = true; text.rows = 5; text.value = item.prompt; text.setAttribute('aria-label', promptLabel);
      details.append(text, element('p', '', `常用已存参数：${JSON.stringify(item.parameters)}；未列出的参数沿用原模型默认。这不是完整请求预览或报价。`));
      review.append(details);
    }
  } });
  runner = createStoryMediaBatchRunner({ items, prepare, assertCurrent: runtimeOptions.assertCurrent, onChange: render });
  root.append(element('h2', '', title),
    element('p', 'sw-help', description),
    element('p', 'sw-help', '每个批次节点最多一次批次调用；失败、未知或阻止项不自动重发。暂停可继续其余未发送项。结果/尝试标记位于画布节点，仍须原工程保存；此窗口进度不做后台持久化。关闭后不会自动恢复批次。'),
    prepareButton, startButton, pauseButton, closeButton, status, review, rows);
  render(runner.snapshot());
  return { root, focus: () => root.focus(),
    destroy() { if (destroyed) return; destroyed = true; abort.abort(); runner.dispose(); root.remove(); } };
}
