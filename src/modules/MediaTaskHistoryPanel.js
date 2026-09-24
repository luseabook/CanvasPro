import { callMediaTaskHistory, createMediaTaskHistoryReader, hasMediaTaskHistoryApi, readMediaTaskHistory } from '../../api/mediaTaskHistoryApi.js';

function element(tag, text = '') { const node = document.createElement(tag); node.textContent = text; return node; }
function time(value) { const date = new Date(value); return value > 0 && Number.isFinite(date.getTime()) ? date.toLocaleString() : '未确认'; }
const STATUS = { held: '待核对（此前等待）', unknown: '待核对（此前处理中）', complete: '记录为完成', failed: '记录为失败', cancelled: '记录为取消' };

export class MediaTaskHistoryPanel {
  constructor({ api, createRecoveryPanel }) {
    this.api = api; this.sequence = 0; this.offset = 0; this.pageSize = 20; this.busy = false; this.state = null; this.total = 0;
    this.abort = new AbortController(); this.el = element('details');
    this.el.setAttribute('aria-label', '本机持久媒体历史');
    this.el.style.cssText = 'padding:10px;border-bottom:1px solid #7775;max-height:40vh;overflow:auto;flex-shrink:0;font-size:12px';
    this.el.addEventListener('click', event => event.stopPropagation(), { signal: this.abort.signal });
    this.el.addEventListener('toggle', () => { if (!this.el.open) this.suspend(); }, { signal: this.abort.signal });
    this.el.addEventListener('keydown', event => event.stopPropagation(), { signal: this.abort.signal });
    this.summary = element('summary', '本机历史记录 · 默认关闭记录');
    this.status = element('p', '点“读取历史 / 状态”进行只读查询。不会重新入队或重放完成事件。');
    this.status.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere';
    this.message = element('p'); this.message.setAttribute('role', 'status');
    this.path = element('textarea'); this.path.readOnly = true; this.path.rows = 2; this.path.setAttribute('aria-label', '本机历史文件路径'); this.path.style.width = '100%';
    this.filter = element('input'); this.filter.type = 'text'; this.filter.maxLength = 256;
    this.filter.placeholder = '可选：任务ID精确筛选'; this.filter.setAttribute('aria-label', '历史任务ID筛选');
    this.filter.style.cssText = 'box-sizing:border-box;width:100%;margin-bottom:6px';
    this.filter.addEventListener('input', () => this.invalidate(), { signal: this.abort.signal });
    this.readButton = this.button('读取历史 / 状态', () => { this.offset = 0; return this.load(); });
    this.enableButton = this.button('明确启用记录…', () => this.configure(true));
    this.pauseButton = this.button('暂停记录并保存设置…', () => this.configure(false));
    this.flushButton = this.button('立即写入待保存摘要', () => this.execute(() => callMediaTaskHistory(this.api, 'flush'), '已请求写入；以下以宿主回执为准'));
    this.previous = this.button('历史上一页', () => { this.offset = Math.max(0, this.offset - this.pageSize); return this.load(); });
    this.next = this.button('历史下一页', () => { this.offset += this.pageSize; return this.load(); });
    this.rows = element('div'); this.page = element('p');
    this.recovery = createRecoveryPanel({ api: null, refresh: async () => false, fixedTask: true,
      helpText: '所选记录来自已写盘历史，不是实时队列。仅第16批四类已核对的本地成功结果可人工取回；不恢复任务执行或原画布归属。' });
    this.recovery.el.hidden = true;
    this.el.append(this.summary, element('p', '启用后只记录宿主任务白名单摘要，最多1000条/8MiB。超限淘汰最旧的已终止或前进程记录，不删媒体；不是永久审计日志。错误详情、提示词、请求参数、密钥、服务URL和厂商原始响应不保存。未启用期间与已结束旧任务不自动回填。'),
      this.status, this.path, this.readButton, this.enableButton, this.pauseButton, this.flushButton,
      this.filter, this.previous, this.next, this.page, this.message, this.rows, this.recovery.el);
    this.updateControls();
    if (!hasMediaTaskHistoryApi(api)) this.message.textContent = '需更新后的源码桌面端；不调用浏览器后端或把旧内存列表冒充历史。';
  }
  button(text, action) {
    const node = element('button', text); node.type = 'button'; node.className = 'v2-task-card-action';
    node.addEventListener('click', () => { const sequence = this.sequence;
      Promise.resolve().then(() => { if (sequence === this.sequence && this.el.isConnected) return action(); }).catch(error => { if (sequence === this.sequence) this.message.textContent = error.message; });
    }, { signal: this.abort.signal }); return node;
  }
  updateControls() {
    const unavailable = !hasMediaTaskHistoryApi(this.api), disabled = this.busy || unavailable;
    this.readButton.disabled = disabled;
    this.enableButton.disabled = disabled || !this.state?.canWrite || this.state.enabled;
    this.pauseButton.disabled = disabled || !this.state?.canWrite || (!this.state.enabled && this.state.persistedEnabled !== true);
    this.flushButton.disabled = disabled || !this.state?.canWrite || !this.state.pending;
    this.previous.disabled = disabled || this.offset === 0;
    this.next.disabled = disabled || this.offset + this.pageSize >= this.total;
    this.filter.disabled = this.busy;
  }
  renderStatus(state) {
    if (state?.version !== 1 || typeof state.enabled !== 'boolean' || typeof state.canWrite !== 'boolean') throw new Error('历史状态版本不受支持');
    this.state = state;
    const diskSwitch = state.persistedEnabled === null ? '未知' : state.persistedEnabled ? '启用' : '关闭';
    this.status.textContent = `本次进程记录：${state.enabled ? '启用' : '暂停'}；最近已确认磁盘开关：${diskSwitch}\n最近成功写盘：${time(state.savedAt)}；版本${state.revision}；待写入：${state.pending ? '有' : '无'}\n已写盘${state.count}条；累计容量淘汰${state.droppedCount}条；本进程未记录${state.skipped}次观察。${state.notice || ''}\n${state.problem || ''}\n关闭/超时不保证写盘已结束；没有回执不能当已保存。上方“清理已完成”只清原界面，不清本历史。`;
    this.path.value = state.path || ''; this.updateControls();
  }
  invalidate() {
    this.sequence += 1; this.rows.replaceChildren(); this.recovery.suspend(); this.recovery.el.hidden = true;
    this.busy = false; this.total = 0; this.page.textContent = ''; this.updateControls();
  }
  suspend() { this.invalidate(); }
  async load() { return this.execute(null, '只读历史已刷新；同任务ID可能有多条记录，必须明确选择'); }
  async execute(action, message) {
    if (this.busy) return;
    this.invalidate(); const sequence = this.sequence; this.busy = true; this.updateControls();
    const query = { offset: this.offset, limit: this.pageSize };
    if (this.filter.value.trim()) query.taskId = this.filter.value.trim();
    try {
      if (action) {
        const response = await action();
        if (sequence !== this.sequence) return;
        this.renderStatus(response.status);
      }
      const page = await readMediaTaskHistory(this.api, query);
      if (sequence !== this.sequence) return;
      this.renderStatus(page.status); this.total = page.total;
      this.page.textContent = `历史 ${page.total ? this.offset + 1 : 0}–${this.offset + page.rows.length} / ${page.total}（只显示已写盘摘要）`;
      for (const task of page.rows) {
        const row = element('section'); row.style.cssText = 'margin:8px 0;padding:8px;border:1px solid #7775;overflow-wrap:anywhere';
        row.append(element('p', `${task.taskId} · ${task.kind} · ${STATUS[task.status] || '待核对'}\n创建：${time(task.createdAt)}；记录：${task.history.recordId}`));
        const open = this.button('查看此历史记录 / 取回…', () => {
          if (sequence !== this.sequence || this.busy) return;
          this.recovery.suspend(); this.recovery.api = createMediaTaskHistoryReader(this.api, task.history.recordId);
          this.recovery.el.hidden = false; return this.recovery.lookup(task.taskId);
        });
        row.append(open); this.rows.append(row);
      }
      this.message.textContent = message;
    } catch (error) {
      if (sequence !== this.sequence) return;
      if (error.historyStatus) this.renderStatus(error.historyStatus);
      this.message.textContent = error.message;
    } finally { if (sequence === this.sequence) { this.busy = false; this.updateControls(); } }
  }
  async configure(enabled) {
    if (this.busy || !this.state?.canWrite) return;
    const state = this.state;
    const detail = enabled
      ? '启用本机宿主任务历史记录？只保存有限任务标识/时间/状态与四类本地输出摘要，不保存payload、密钥/服务URL、提示词或原错误。最多1000条/8MiB，超限淘汰最旧的已终止或前进程记录；非永久备份。不回填所有旧任务，不自动恢复执行。此设置随本机历史文件保存。'
      : '暂停本机历史记录并尝试保存关闭设置？已有历史与媒体文件保留，不取消任何任务。写盘失败时磁盘开关可能仍为启用，请核对回执；不要把暂停当厂商取消。';
    if (!window.confirm(detail)) return;
    return this.execute(() => callMediaTaskHistory(this.api, 'configure', { enabled, expectedSession: state.sessionId,
      expectedControlRevision: state.controlRevision }), '历史设置操作已返回；以当前状态和最近写盘回执为准');
  }
  destroy() { this.suspend(); this.abort.abort(); this.el.remove(); }
}
