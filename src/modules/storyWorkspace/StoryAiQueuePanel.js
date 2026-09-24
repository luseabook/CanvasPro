import { createStoryAiQueueStoragePanel } from './StoryAiQueueStoragePanel.js';
import { createStoryAiModelPicker } from './StoryAiModelPicker.js';
import { assertStoryAiModelReady, getStoryAiModels } from '../../../api/storyAiApi.js';
import { createStoryAiQueueBatch, storyAiQueueTask, STORY_AI_QUEUE_LABELS, STORY_AI_QUEUE_LIMITS } from './storyAiQueueModel.js';
import { createStoryAiShotsPreview } from './StoryAiShotsPreview.js';
import { parseStoryAiShotsProposal } from './storyAiShotsModel.js';

function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text); return node;
}
export function createStoryAiQueuePanel({ queue, persistence, workspace, nodes, isCurrent, onApply, onClose }) {
  const abort = new AbortController();
  let storageView = null, rowsAbort = new AbortController();
  let disposed = false, importing = false, selectedId = '', detailId = '', preview = null;
  const root = element('section', 'sw-ai-panel sw-queue-panel'), status = element('p', 'sw-ai-status'); status.setAttribute('role', 'status');
  const summary = element('p'), list = element('div', 'sw-queue-list'), detail = element('section', 'sw-queue-detail');
  const raw = element('textarea', 'sw-ai-json'); raw.rows = 7; raw.spellcheck = false; raw.setAttribute('aria-label', '所选任务结果JSON');
  const review = element('fieldset', 'sw-queue-review'), previewSlot = element('div');
  const settings = element('fieldset', 'sw-ai-settings'), models = getStoryAiModels(nodes);
  function message(text) { if (!disposed) status.textContent = String(text); }
  function listen(target, event, handler) { target.addEventListener(event, handler, { signal: abort.signal }); }
  function button(text, action, signal = abort.signal) {
    const node = element('button', 'sw-button', text); node.type = 'button';
    node.addEventListener('click', () => { try { action(); } catch (error) { message(error.message); } }, { signal }); return node;
  }
  function field(name, input) { const label = element('label', 'sw-field'); label.append(element('span', '', name), input); return label; }
  function multi(items) {
    const select = element('select'); select.multiple = true; select.size = 5;
    for (const item of items) { const option = element('option', '', item.title || item.name || '未命名'); option.value = item.id; select.append(option); }
    return select;
  }
  function selected(select) { return [...select.selectedOptions].map(option => option.value); }
  const episodes = multi(workspace().episodes), characters = multi(workspace().characters), scenes = multi(workspace().scenes);
  const modelPicker = createStoryAiModelPicker(models);
  const count = element('input'); count.type = 'number'; count.min = '1'; count.max = '32'; count.step = '1'; count.value = '8';
  const direction = element('textarea'); direction.rows = 2;
  settings.append(field('单集（Ctrl/Cmd 多选，每批1–6集）', episodes), modelPicker.root, field('每集目标镜数（1–32）', count),
    field('人物文字资料（默认不选，每类最多20项）', characters), field('场景文字资料（默认不选）', scenes), field('创作要求（可选，最多1000字符）', direction));
  function locked() { return importing || queue.isBusy() || persistence.isWorking(); }
  function ensureIdle() { if (locked()) throw new Error('请先暂停并等当前请求结束'); }
  const create = button('建立批次（尚不发送）', () => {
    ensureIdle(); if (!isCurrent()) throw new Error('来源上下文已改变，不能建立新批次');
    const chosenModel = modelPicker.getSelected(); assertStoryAiModelReady(chosenModel);
    const jobs = createStoryAiQueueBatch(workspace(), selected(episodes), chosenModel, { count: Number(count.value), direction: direction.value,
      characterIds: selected(characters), sceneIds: selected(scenes) });
    if (queue.hasJobs() && !window.confirm('替换当前队列？已启用自动保存时也会替换本地副本，请先导出需要保留的快照。项目内容不会被替换。')) return;
    selectedId = jobs[0].id; detailId = ''; queue.replace(jobs); message('已建立批次，尚未发送。请逐项预览输入，再确认开始。');
  });
  const start = button('开始 / 继续待发送项…', () => {
    ensureIdle(); if (!isCurrent()) throw new Error('来源画布已改变，仅可查看或导出');
    const jobs = queue.getJobs().filter(job => job.status === 'queued');
    if (!jobs.length) throw new Error('没有待发送项；导入或失败的任务需核对后逐项重新排队');
    for (const job of jobs) assertStoryAiModelReady(job.model);
    const names = jobs.map(job => `${job.input.episodeTitle || '未命名单集'}：${job.input.script.length}字符，${job.input.count}镜；${job.model.provider} / ${job.model.model}；人物${job.input.characters.length}/场景${job.input.scenes.length}项`).join('\n');
    const saving = persistence.getInfo();
    const storageNotice = saving.enabled ? '已启用本地保存：保存失败会阻止后续发送，但不保证永久备份。' : '未启用本地自动保存，本次仅保留内存记录，请自行导出；勿与另一窗口重复发送。';
    if (!window.confirm(`${storageNotice}\n将串行发送最多 ${jobs.length} 次所列厂商文本请求，可能逐次计费。每项包含正文、所选资料文字和创作要求。沿用执行时的项目服务地址和账号配置，请勿中途切换设置。\n${names}\n遇错暂停、不自动重试。是否开始？`)) return;
    void queue.start().catch(error => message(error.message));
  });
  const pause = button('暂停后续发送', () => { queue.pause(); message('已暂停后续发送；当前请求仍可能继续执行和计费，结果会保留在本窗口会话中。'); });
  const stop = button('停止并跳过待发送项', () => {
    if (!window.confirm('跳过尚未发送的任务？当前请求若已开始，仍可能执行/计费；已返回结果保留。')) return;
    queue.stopPending(); message('已停止后续发送；没有声称取消正在执行的厂商请求。');
  });
  const save = button('导出队列快照 JSON', () => {
    if (!queue.hasJobs()) throw new Error('队列为空');
    const blob = new Blob([queue.snapshot()], { type: 'application/json;charset=utf-8' }), url = URL.createObjectURL(blob), anchor = element('a');
    anchor.href = url; anchor.download = 'story-ai-queue.json'; root.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    message('已触发下载，请确认文件已保存。快照含剧本、所选设定和返回文本，请妥善保管；运行中导出的状态之后可能变化。');
  });
  const file = element('input'); file.type = 'file'; file.accept = '.json,application/json'; file.hidden = true;
  const load = button('导入队列快照（不自动发送）', () => { ensureIdle(); file.click(); });
  listen(file, 'change', () => {
    const picked = file.files?.[0]; file.value = ''; if (!picked) return;
    void importSnapshot(picked);
  });
  async function importSnapshot(picked) {
    try {
      ensureIdle(); if (!isCurrent()) throw new Error('请在原工作室上下文导入');
      if (picked.size > STORY_AI_QUEUE_LIMITS.bytes) throw new Error('快照超过8MiB');
      if (!window.confirm('导入会替换当前队列，已启用自动保存时也会替换本地副本；不会自动发送或追加。快照可能过时，不能证明任务未执行或原工程已保存；请先核对厂商记录及项目内容。继续？')) return;
      importing = true; refresh(); const text = await picked.text();
      if (disposed) return;
      if (!isCurrent()) throw new Error('来源画布已改变，未导入');
      selectedId = ''; detailId = ''; queue.restore(text); message('已导入。待执行项标为“待核对”，进行中项标为“请求状态待核对”；不会自动重发。');
    } catch (error) { message(error.message); }
    finally { importing = false; if (!disposed) refresh(); }
  }
  const clear = button('清空队列', () => {
    ensureIdle(); if (!window.confirm('清空会删除内存队列，开启自动保存时本地副本也会同步为空。请先导出快照；不会删除项目镜头。继续？')) return;
    selectedId = ''; detailId = ''; queue.replace([]); message('队列已清空。');
  });
  const leave = button('返回工作室（暂停队列）', () => {
    queue.pause();
    if (queue.isBusy() && !window.confirm('返回会暂停后续发送；当前请求继续等待，可能计费。未提交到本地或未导出的结果可能在关闭/刷新时丢失，请检查保存状态。继续？')) return;
    onClose();
  });
  const detailsTitle = element('h3'), jobState = element('p', 'sw-help'), inputDetails = element('details'), inputText = element('pre', 'sw-ai-excerpt');
  inputDetails.append(element('summary', '', '本项待发送文字（不请求模型）'), inputText);
  const retry = button('核对后重新排队…', () => {
    ensureIdle();
    if (!window.confirm('请先核对厂商记录。该项可能已执行/计费；重新发送可能重复计费，旧返回文本会清除。确认重新排队？之后仍需点击开始。')) return;
    queue.requeue(selectedId); message('已重新排队，尚未发送；再次开始需要确认费用。');
  });
  const skip = button('跳过此待发送项', () => { ensureIdle(); queue.skip(selectedId); });
  const reopen = button('允许再次追加该结果…', () => {
    ensureIdle();
    if (!window.confirm('只解除“已追加”标记，不请求模型。若原镜头已保存，再次追加会重复。确认原草稿确实丢失或需要重复追加？')) return;
    try { queue.reopenResult(selectedId); } finally { renderDetail(); }
  });
  const validate = button('校验当前 JSON（不请求模型）', () => { ensureIdle(); try { queue.validate(selectedId); } finally { renderDetail(); } });
  const apply = button('确认将勾选镜头追加到草稿', () => {
    ensureIdle(); if (!isCurrent()) throw new Error('来源画布已改变，不会合并');
    if (!preview) throw new Error('请先校验并审阅结果');
    const proposal = queue.result(selectedId);
    onApply(proposal, preview.getSelection()); queue.markApplied(selectedId); preview?.destroy(); preview = null;
    message('已追加到草稿；仍需返回工作室，应用到项目并保存。队列标记不代表工程保存成功。'); refresh();
  });
  listen(raw, 'input', () => {
    try { queue.editRaw(selectedId, raw.value); preview?.destroy(); preview = null; }
    catch (error) { apply.disabled = true; raw.value = queue.getJobs().find(job => job.id === selectedId)?.raw || ''; message(error.message); }
  });
  const jobTools = element('div', 'sw-tools'); jobTools.append(retry, skip, reopen);
  review.append(raw, validate, previewSlot, apply); detail.append(detailsTitle, jobState, inputDetails, jobTools, review);
  function renderDetail() {
    preview?.destroy(); preview = null; previewSlot.replaceChildren();
    const job = queue.getJobs().find(item => item.id === selectedId); detail.hidden = !job; detailId = job?.id || '';
    if (!job) { raw.value = ''; return; }
    detailsTitle.textContent = job.input.episodeTitle || '未命名单集'; raw.value = job.raw;
    const task = storyAiQueueTask(job); inputText.textContent = task.systemPrompt + '\n\n' + task.prompt;
    if (job.status === 'ready') {
      try {
        const proposal = parseStoryAiShotsProposal(job.raw, task), existing = workspace().episodes.find(item => item.id === proposal.episodeId)?.shots.length || 0;
        preview = createStoryAiShotsPreview({ proposal, task, existingCount: existing }); previewSlot.append(preview.root);
      } catch (error) { message(error.message); }
    }
    updateReview();
  }
  function updateReview() {
    const job = queue.getJobs().find(item => item.id === selectedId); if (!job) return;
    jobState.textContent = `${STORY_AI_QUEUE_LABELS[job.status]} · 尝试 ${job.attempts}/3 · ${job.error}`;
    review.disabled = locked(); raw.readOnly = !['ready', 'invalid', 'unknown'].includes(job.status);
    validate.disabled = locked() || raw.readOnly;
    apply.disabled = locked() || job.status !== 'ready' || !preview;
    retry.disabled = locked() || !['held', 'unknown', 'invalid', 'blocked', 'cancelled'].includes(job.status) || job.attempts >= 3;
    skip.disabled = locked() || job.status !== 'queued'; reopen.disabled = locked() || job.status !== 'applied';
  }
  function refresh() {
    if (disposed) return;
    storageView?.refresh();
    const jobs = queue.getJobs();
    let phase = '空闲 / 已暂停';
    if (queue.isRunning()) phase = '串行执行中';
    else if (queue.isBusy()) phase = '已暂停，仍等待当前请求';
    summary.textContent = `共 ${jobs.length} 项 · 待发送 ${jobs.filter(job => job.status === 'queued').length} · 待审阅 ${jobs.filter(job => job.status === 'ready').length} · ${phase}。不显示虚构进度。`;
    settings.disabled = locked(); create.disabled = locked(); start.disabled = locked(); load.disabled = locked(); clear.disabled = locked(); file.disabled = locked();
    rowsAbort.abort(); rowsAbort = new AbortController(); list.replaceChildren();
    for (const job of jobs) {
      const row = element('div', 'sw-queue-row');
      row.append(element('span', '', `${job.input.episodeTitle || '未命名单集'} · ${STORY_AI_QUEUE_LABELS[job.status]} · ${job.attempts}/3次 · ${job.model.provider} / ${job.model.model}`),
        button('查看', () => { selectedId = job.id; renderDetail(); }, rowsAbort.signal)); list.append(row);
    }
    if (!jobs.some(job => job.id === selectedId)) selectedId = jobs[0]?.id || '';
    const current = jobs.find(job => job.id === selectedId);
    if (detailId !== selectedId || (current && raw.value !== current.raw)) renderDetail();
    else updateReview();
    detail.hidden = !current;
  }
  const controls = element('div', 'sw-tools'); controls.append(create, start, pause, stop, save, load, clear, leave);
  root.append(element('h3', '', '多集 AI 分镜队列'), element('p', 'sw-help', '仅串行生成文字分镜，不自动追加或生成媒体。暂停/停止不保证取消当前请求或计费。编辑结果或追加前，请先暂停并等待当前请求结束。'),
    element('p', 'sw-help', '队列不写入工程文件。可明确启用下方本地自动保存；关闭/刷新前请检查保存状态并定期导出快照。切换任务或重新校验后，镜头勾选会恢复全选，请重新核对。'), element('p', 'sw-help', '模型列表来自本机文本清单及画布文本节点；不代表账号已授权。OpenAI/custom 使用现有 OpenAI 兼容配置，custom 不是独立账号。切换下拉选项不会改写已有任务的厂商；请建立新批次。'), settings, controls, file, summary, status, list, detail);
  storageView = createStoryAiQueueStoragePanel({ persistence, isBusy: () => importing || queue.isBusy(), onMessage: message });
  root.insertBefore(storageView.root, settings);
  const unsubscribeStorage = persistence.subscribe(refresh), unsubscribe = queue.subscribe(refresh); refresh(); void persistence.probe();
  return { root, focus() { episodes.focus(); }, destroy() { disposed = true; queue.pause(); unsubscribe(); unsubscribeStorage(); storageView.destroy(); modelPicker.destroy(); preview?.destroy(); rowsAbort.abort(); abort.abort(); root.remove(); } };
}
