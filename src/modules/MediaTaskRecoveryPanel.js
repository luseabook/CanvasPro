import { describeRecoverableTask, findMediaTask, recoverMediaTaskResult } from './mediaTaskRecoveryModel.js';

function element(tag, text = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function button(text, handler) {
  const node = element('button', text);
  node.type = 'button'; node.className = 'v2-task-card-action';
  node.addEventListener('click', handler);
  return node;
}
export class MediaTaskRecoveryPanel {
  constructor({ api, refresh, store, buildNode, commit, fixedTask = false,
    helpText = '只查当前桌面宿主内存记录，不发送生成请求。重启可能丢失未持久记录；已明确启用的本机历史请在下方另查。查不到不等于未执行。清理已完成仅清界面。' }) {
    this.store = store; this.buildNode = buildNode; this.commit = commit;
    this.api = api; this.refresh = refresh; this.sequence = 0; this.busy = false; this.preview = null;
    this.el = element('section');
    this.el.setAttribute('aria-label', '本地媒体任务查找与结果取回');
    this.el.style.cssText = 'padding:10px;border-bottom:1px solid #7775;max-height:320px;overflow:auto;flex-shrink:0';
    const help = element('p', helpText);
    help.style.cssText = 'font-size:12px;opacity:.8;margin:0 0 8px';
    this.input = element('input'); this.input.type = 'text'; this.input.maxLength = 256;
    this.input.placeholder = '输入任务ID'; this.input.setAttribute('aria-label', '任务ID');
    this.input.style.cssText = 'box-sizing:border-box;width:100%;margin-bottom:6px';
    this.input.addEventListener('input', () => this.reset());
    // Keep typing/clipboard/Enter scoped, not canvas shortcuts or delegated task actions.
    this.el.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Enter' && event.target === this.input) { event.preventDefault(); void this.lookup(); }
    });
    this.el.addEventListener('click', event => event.stopPropagation());
    this.queryButton = button('查找任务', () => void this.lookup());
    this.refreshButton = button('刷新宿主记录', () => void this.refreshHost());
    this.message = element('p'); this.message.setAttribute('role', 'status');
    this.message.style.cssText = 'font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere';
    this.details = element('div');
    this.el.append(help, this.input, this.queryButton, this.refreshButton, this.message, this.details);
    if (fixedTask) { this.input.hidden = true; this.queryButton.hidden = true; this.refreshButton.hidden = true; }
    if (!api?.list) { this.queryButton.disabled = true; this.refreshButton.disabled = true; this.message.textContent = '桌面媒体任务接口不可用；不会回退浏览器后端。'; }
  }
  reset() {
    this.sequence += 1; this.preview = null; this.details.replaceChildren(); this.takeButton = null;
    this.setBusy(false); this.message.textContent = '';
  }
  suspend() { this.reset(); }
  setBusy(value) {
    this.busy = value;
    this.queryButton.disabled = value || !this.api?.list;
    this.refreshButton.disabled = value || !this.api?.list;
    this.input.disabled = value;
    if (this.takeButton) this.takeButton.disabled = value;
  }
  async refreshHost() {
    if (this.busy) return;
    const sequence = ++this.sequence; this.setBusy(true);
    try {
      const applied = await this.refresh();
      if (sequence === this.sequence) this.message.textContent = applied ? '已刷新宿主最近最多500条；原列表仍按120条容量展示。可用任务ID精确查找。' : '刷新已过期，请重新查询。';
    } catch (error) { if (sequence === this.sequence) this.message.textContent = '刷新失败，保留现有记录；状态待核对。' + error.message; }
    finally { if (sequence === this.sequence) this.setBusy(false); }
  }
  async lookup(taskId = this.input.value) {
    if (this.busy) return;
    this.reset(); this.input.value = taskId;
    const sequence = ++this.sequence; this.setBusy(true); this.message.textContent = '正在只读查询宿主…';
    try {
      const task = await findMediaTask(this.api, taskId);
      if (sequence !== this.sequence) return;
      this.preview = task;
      this.message.textContent = `任务：${task.taskId}\n类型：${task.kind || '未知'}\n状态：${task.status || '未知'}${task.history ? `\n历史记录：${task.history.recordId}（已写盘摘要，非实时执行状态）` : ''}\n原节点ID仅作线索，不证明当前画布归属。`;
      try {
        const description = describeRecoverableTask(task);
        const path = element('textarea'); path.readOnly = true; path.rows = 2;
        path.value = description.localPath; path.setAttribute('aria-label', '结果本地路径（可选中复制）');
        path.style.cssText = 'width:100%;box-sizing:border-box;resize:vertical';
        this.takeButton = button('确认取回到当前画布…', () => void this.take());
        this.details.append(path, element('p', `${description.mediaType === 'video' ? '视频' : '音频'} · ${description.duration || '未知'} 秒。未检查文件存在性；文件可能已移动或覆盖。`), this.takeButton);
      } catch (error) { this.details.append(element('p', error.message)); }
    } catch (error) { if (sequence === this.sequence) this.message.textContent = error.message; }
    finally { if (sequence === this.sequence) this.setBusy(false); }
  }
  async take() {
    if (this.busy || !this.preview) return;
    const sequence = ++this.sequence; this.setBusy(true);
    try {
      const node = await recoverMediaTaskResult({
        api: this.api, preview: this.preview, store: this.store, buildNode: this.buildNode, commit: this.commit,
        isCurrent: () => sequence === this.sequence && this.el.isConnected,
        confirm: description => window.confirm(`把任务结果作为独立素材加入【当前画布】？\n\n任务：${description.taskId}${description.historyRecordId ? `\n历史记录：${description.historyRecordId}` : ''}\n类型：${description.kind}\n路径：${description.localPath}\n\n请先切到你要接收结果的画布。不会切回原画布、覆盖原节点、绑定镜头或恢复生成。只引用现有文件，不重发原任务，不证明文件仍存在。节点会按原逻辑加载/预览。原流程可能已添加过同一文件，请核对。加入后仍需原工程保存。`),
      });
      if (sequence === this.sequence) this.message.textContent = node ? '已加入并选中独立素材；尚未磁盘保存，请使用原工程保存。' : '已取消取回，没有添加。';
    } catch (error) { if (sequence === this.sequence) this.message.textContent = error.message; }
    finally { if (sequence === this.sequence) this.setBusy(false); }
  }
}
