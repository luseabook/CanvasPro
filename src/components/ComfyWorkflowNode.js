import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { saveOutputBlob } from '../modules/project.js';
import { calcSafeSpawnPosNearNode } from '../modules/nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { getComfyConnections, callComfy, uploadComfyImage } from '../../api/comfyWorkflowApi.js';
import { parseComfyWorkflow, editableInputs, patchWorkflowInput, newRequestId, resultNodeId, ACTIVE_STATES } from '../modules/comfyui/comfyWorkflowModel.js';

const STATUS = { submitting: '提交中', queued: '排队中', running: '执行中', completed: '已完成', failed: '失败', cancelled: '已取消', unknown: '状态待确认' };
function el(tag, className, text) {
  const item = document.createElement(tag); if (className) item.className = className;
  if (text !== undefined) item.textContent = text; return item;
}
function ensureStyles() {
  if (document.getElementById('comfy-workflow-styles')) return;
  const link = el('link'); link.id = 'comfy-workflow-styles'; link.rel = 'stylesheet';
  link.href = new URL('../../styles/comfy-workflow.css', import.meta.url).href; document.head.append(link);
}
export class ComfyWorkflowNode {
  constructor(data) {
    this.nodesContext = appStore.getStateRaw().nodes;
    this.id = data.id; this.data = data; this.config = data.comfyWorkflow || {};
    this.abort = new AbortController(); this.disposed = false; this.busy = false;
    this.timer = 0; this.tracking = false; this.confirmAbandon = false;
  }
  listen(target, name, fn, options = {}) { target.addEventListener(name, fn, { ...options, signal: this.abort.signal }); }
  current() { return !this.disposed && appStore.getStateRaw().nodes?.[this.id]; }
  guard(requestId = '') {
    const nodes = appStore.getStateRaw().nodes;
    return () => this.current() && appStore.getStateRaw().nodes === nodes &&
      (!requestId || this.current().comfyWorkflow?.job?.requestId === requestId);
  }
  connection(forJob = false) {
    const endpoint = forJob ? this.config.job?.endpoint || this.config.endpoint : this.config.endpoint;
    return { endpoint, token: this.token.value.trim() };
  }
  options() { return { signal: this.abort.signal }; }
  message(text) { if (!this.disposed) this.status.textContent = String(text || ''); }
  button(text, action) {
    const button = el('button', 'cw-button', text); button.type = 'button';
    this.listen(button, 'click', () => { if (!this.disposed) void action(); }); return button;
  }
  patch(patch, history = false) {
    if (!this.current()) return false;
    const current = this.current().comfyWorkflow || {};
    this.config = { ...current, ...patch, version: 1 };
    appStore.updateNodeData(this.id, { comfyWorkflow: this.config });
    this.data = this.current(); if (history) commit(); this.sync(); return true;
  }
  jobPatch(patch) {
    if (!this.config.job) return;
    this.patch({ job: { ...this.config.job, ...patch } });
  }
  mount() {
    ensureStyles(); this.el = el('div', 'v2-node-component cw-node');
    const notice = el('div', 'cw-note', '仅导入可信的 ComfyUI API 工作流；模型和自定义节点需在 ComfyUI 服务端安装。连接密钥只保留在当前节点界面内存，不写入项目。');
    const connection = el('div', 'cw-row');
    this.endpoint = el('select'); this.endpoint.setAttribute('aria-label', 'ComfyUI 服务地址');
    const initial = el('option', '', this.config.endpoint || 'http://127.0.0.1:8188'); initial.value = initial.textContent;
    this.endpoint.append(initial);
    this.token = el('input'); this.token.type = 'password'; this.token.autocomplete = 'off'; this.token.placeholder = '远端 Bearer Token（可选，不保存）'; this.token.setAttribute('aria-label', '远端连接密钥');
    this.testButton = this.button('测试连接', () => this.testConnection());
    connection.append(this.endpoint, this.token, this.testButton);
    this.listen(this.endpoint, 'change', () => this.patch({ endpoint: this.endpoint.value }, true));
    const imports = el('div', 'cw-row');
    this.file = el('input'); this.file.type = 'file'; this.file.accept = '.json,application/json'; this.file.hidden = true;
    this.importButton = this.button('导入 API 工作流 JSON', () => this.file.click());
    this.workflowTitle = el('span', 'cw-workflow-title'); imports.append(this.importButton, this.workflowTitle);
    this.listen(this.file, 'change', async () => {
      const file = this.file.files?.[0]; this.file.value = '';
      if (!file || this.busy || ACTIVE_STATES.has(this.config.job?.state)) return;
      const alive = this.guard();
      this.busy = true; this.sync();
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('工作流文件不能超过 2MB');
        const workflow = parseComfyWorkflow(await file.text()); if (!alive()) return;
        this.stopTracking(); this.patch({ workflow, workflowName: file.name, job: null }, true); this.renderInputs(); this.message('工作流已导入，可修改参数后提交。');
      } catch (error) { this.message(error.message); }
      finally { this.busy = false; this.sync(); }
    });
    this.inputs = el('div', 'cw-inputs');
    const actions = el('div', 'cw-row');
    this.runButton = this.button('提交任务', () => this.submit());
    this.resumeButton = this.button('查询结果 / 恢复跟踪', () => this.resume());
    this.pauseButton = this.button('暂停跟踪', () => { this.stopTracking(); this.message('已暂停查询，远端任务不会被取消。'); this.sync(); });
    this.cancelButton = this.button('取消排队任务', () => this.cancel());
    this.saveButton = this.button('保存结果到画布', () => this.saveResults());
    this.resetButton = this.button('新任务 / 放弃跟踪', () => {
      if (this.busy) return;
      if (ACTIVE_STATES.has(this.config.job?.state) && !this.confirmAbandon) {
        this.confirmAbandon = true; this.message('远端可能仍在执行！再次点击才会放弃本节点的跟踪记录；不会取消任务。'); return;
      }
      this.stopTracking(); this.confirmAbandon = false; this.patch({ job: null }, true); this.message('可配置并提交新任务。');
    });
    actions.append(this.runButton, this.resumeButton, this.pauseButton, this.cancelButton, this.saveButton, this.resetButton);
    this.status = el('div', 'cw-status'); this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');
    this.results = el('div', 'cw-results');
    this.el.append(notice, connection, imports, this.inputs, actions, this.status, this.results, this.file);
    // Keep typing and native text editing inside the form, not in canvas shortcuts.
    this.listen(this.el, 'pointerdown', event => { if (event.button === 0 && !window._spaceHeld) event.stopPropagation(); });
    this.listen(this.el, 'dblclick', event => event.stopPropagation());
    this.listen(this.el, 'wheel', event => { if (event.target.closest('.cw-inputs, .cw-results')) event.stopPropagation(); });
    this.listen(this.el, 'keydown', event => { if (!((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's')) event.stopPropagation(); });
    const resize = el('div', 'cw-resizer v2-resize-move'); resize.title = '调整节点大小'; this.el.append(resize);
    this.listen(resize, 'pointerdown', event => {
      if (event.button !== 0) return;
      startNodeResizePreview({ event, nodeId: this.id, getNode: () => this.current() || this.data,
        getViewport: () => appStore.getStateRaw().viewport,
        resolveSize: ({ startWidth, startHeight, dx, dy }) => ({ width: Math.max(520, startWidth + dx), height: Math.max(480, startHeight + dy) }),
        applyPatch: patch => { if (this.current()) appStore.updateNodeData(this.id, patch); },
        commit: () => { if (this.current()) commit(); } });
    });
    this.renderInputs(); this.sync();
    if (this.config.job) this.message('已恢复任务记录；填写密钥（如需）后点击“查询结果 / 恢复跟踪”。不会自动重新提交。');
    void this.loadConnections(); return this.el;
  }
  async loadConnections() {
    try {
      const result = await getComfyConnections(this.options()); if (!this.current()) return;
      const values = [...new Set([this.config.endpoint, ...(result.endpoints || [])].filter(Boolean))];
      this.endpoint.replaceChildren(...values.map(value => { const option = el('option', '', value); option.value = value; return option; }));
      this.endpoint.value = this.config.endpoint || values[0];
    } catch (error) { this.message('连接目录不可用：请重启当前源码的 Python 后端。' + error.message); }
  }
  renderInputs() {
    if (!this.inputs || this.disposed) return;
    this.renderedWorkflow = this.config.workflow;
    this.renderedWorkflowSignature = JSON.stringify(this.config.workflow);
    const fragment = document.createDocumentFragment();
    const fields = editableInputs(this.config.workflow);
    if (!fields.length) fragment.append(el('p', 'cw-note', '导入后显示提示词、种子、尺寸等可编辑参数。连线字段保持不变。'));
    for (const field of fields) {
      const row = el('label', 'cw-field');
      row.append(el('span', 'cw-field-label', `${field.nodeId} · ${field.title} / ${field.input}`));
      const input = el(typeof field.value === 'string' && !field.isImage ? 'textarea' : 'input');
      if (typeof field.value === 'boolean') { input.type = 'checkbox'; input.checked = field.value; }
      else if (typeof field.value === 'number') { input.type = 'number'; input.step = 'any'; input.value = String(field.value); }
      else { input.value = field.value; if (input.tagName === 'TEXTAREA') input.rows = field.value.length > 100 ? 3 : 1; }
      input.setAttribute('aria-label', `${field.nodeId} ${field.input}`);
      this.listen(input, 'change', () => {
        if (this.busy || ACTIVE_STATES.has(this.config.job?.state)) return;
        try {
          if (input.type === 'number' && !input.value.trim()) throw new Error('数字参数不能为空');
          const value = typeof field.value === 'boolean' ? input.checked : typeof field.value === 'number' ? Number(input.value) : input.value;
          const workflow = patchWorkflowInput(this.config.workflow, field.nodeId, field.input, value);
          // Do not rebuild the focused form during a normal parameter edit.
          this.renderedWorkflow = workflow; this.renderedWorkflowSignature = JSON.stringify(workflow); this.patch({ workflow }, true);
        } catch (error) { this.message(error.message); input.value = String(field.value); }
      });
      row.append(input);
      if (field.isImage) {
        const picker = el('input'); picker.type = 'file'; picker.accept = 'image/png,image/jpeg,image/webp'; picker.hidden = true;
        const button = this.button('上传输入图片', () => picker.click());
        this.listen(picker, 'change', async () => {
          const file = picker.files?.[0]; picker.value = ''; if (!file || this.busy || ACTIVE_STATES.has(this.config.job?.state)) return;
          const alive = this.guard();
          this.busy = true; this.sync();
          try {
            const result = await uploadComfyImage(this.connection(), file, this.options()); if (!alive()) return;
            const workflow = patchWorkflowInput(this.config.workflow, field.nodeId, field.input, result.value);
            this.renderedWorkflow = workflow; this.renderedWorkflowSignature = JSON.stringify(workflow); input.value = result.value; this.patch({ workflow }, true); this.message('输入图片已上传到 ComfyUI。');
          } catch (error) { this.message(error.message); }
          finally { this.busy = false; this.sync(); }
        });
        row.append(button, picker);
      }
      fragment.append(row);
    }
    this.inputs.replaceChildren(fragment); this.sync();
  }
  sync() {
    if (!this.el || this.disposed) return;
    const job = this.config.job, active = ACTIVE_STATES.has(job?.state);
    this.endpoint.disabled = this.busy || active;
    this.importButton.disabled = this.busy || active;
    this.inputs.querySelectorAll('input,textarea,button').forEach(input => { input.disabled = this.busy || active; });
    this.runButton.disabled = this.busy || active || !this.config.workflow;
    this.resumeButton.disabled = this.busy || !job || this.tracking;
    this.pauseButton.disabled = !this.tracking;
    this.cancelButton.disabled = this.busy || !job?.promptId || !active;
    this.saveButton.disabled = this.busy || job?.state !== 'completed' || !job.files?.length;
    this.testButton.disabled = this.busy;
    this.resetButton.disabled = this.busy || !job;
    this.workflowTitle.textContent = this.config.workflowName || '尚未导入';
    if (job) {
      const saved = Object.keys(job.saved || {}).length;
      this.results.textContent = `${STATUS[job.state] || job.state} · ID: ${job.promptId || job.requestId}\n${(job.files || []).map(file => file.filename).join('\n')}\n已加入画布：${saved}/${job.files?.length || 0}`;
    } else this.results.textContent = '';
  }
  async testConnection() {
    if (this.busy) return; this.busy = true; this.sync();
    try { await callComfy('system-stats', this.connection(), {}, this.options()); this.message('ComfyUI 连接成功。'); }
    catch (error) { this.message(error.message); }
    finally { this.busy = false; this.sync(); }
  }
  async submit() {
    if (this.busy || ACTIVE_STATES.has(this.config.job?.state)) return;
    this.stopTracking(); this.busy = true;
    const requestId = newRequestId();
    const alive = this.guard(requestId);
    try {
      const prompt = parseComfyWorkflow(this.config.workflow);
      this.patch({ job: { requestId, endpoint: this.config.endpoint, promptId: '', state: 'submitting', files: [], saved: {} } }, true);
      this.message('提交中，请勿重复点击…');
      const response = await callComfy('prompt', this.connection(), { requestId, prompt }, this.options());
      if (!alive()) return;
      this.jobPatch(response); this.message(response.message || STATUS[response.state]);
      if (response.promptId) { this.tracking = true; this.schedulePoll(); }
    } catch (error) {
      if (alive() && this.config.job?.state === 'submitting') this.jobPatch({ state: 'unknown' });
      this.message(error.message + '；若提交状态未知，请恢复查询，不要直接重复提交。');
    } finally { this.busy = false; this.sync(); }
  }
  stopTracking() { this.tracking = false; clearTimeout(this.timer); this.timer = 0; }
  schedulePoll() {
    clearTimeout(this.timer);
    if (!this.disposed && this.tracking) this.timer = setTimeout(() => void this.poll(), 3000);
  }
  async resume() {
    if (this.busy || !this.config.job) return;
    const requestId = this.config.job.requestId;
    const alive = this.guard(requestId);
    this.busy = true; this.sync();
    try {
      if (!this.config.job.promptId) {
        const result = await callComfy('recover', this.connection(true), { requestId: this.config.job.requestId }, this.options());
        if (!alive()) return; this.jobPatch(result);
        if (!result.promptId) { this.message(result.message || '暂未找到任务，请核对 ComfyUI 队列/历史。'); return; }
      }
      this.tracking = true;
    } catch (error) { this.message(error.message); }
    finally { this.busy = false; this.sync(); }
    if (this.tracking) await this.poll();
  }
  async poll() {
    if (!this.current() || !this.tracking || !this.config.job?.promptId) return;
    if (this.busy) { this.schedulePoll(); return; }
    const requestId = this.config.job.requestId;
    const alive = this.guard(requestId);
    this.busy = true; this.sync();
    try {
      const result = await callComfy('history', this.connection(true), { promptId: this.config.job.promptId }, this.options());
      if (!alive() || !this.tracking) return;
      this.jobPatch(result); this.message(result.message || `${STATUS[result.state]}${result.queuePosition ? ` · 队列位置 ${result.queuePosition}` : ''}`);
      if (!['queued', 'running'].includes(result.state)) this.stopTracking();
    } catch (error) { this.stopTracking(); this.message('查询失败，任务记录已保留，可手动恢复：' + error.message); }
    finally { this.busy = false; this.sync(); this.schedulePoll(); }
  }
  async cancel() {
    if (this.busy || !this.config.job?.promptId) return;
    const requestId = this.config.job.requestId;
    const alive = this.guard(requestId);
    this.stopTracking(); this.busy = true; this.sync();
    try {
      const result = await callComfy('cancel', this.connection(true), { promptId: this.config.job.promptId }, this.options());
      if (!alive()) return; this.jobPatch(result); this.message(result.cancelled ? '已取消排队任务。' : result.message);
    } catch (error) { this.message('取消未确认：' + error.message); }
    finally { this.busy = false; this.sync(); }
  }
  async saveResults() {
    const job = this.config.job;
    if (this.busy || job?.state !== 'completed') return;
    const alive = this.guard(job.requestId);
    this.busy = true; this.sync();
    try {
      for (const file of job.files || []) {
        if (!alive()) return;
        const nodeId = resultNodeId(job.requestId, file.key);
        if (appStore.getStateRaw().nodes?.[nodeId]) { this.jobPatch({ saved: { ...this.config.job.saved, [file.key]: nodeId } }); continue; }
        const blob = await callComfy('view', this.connection(true), { promptId: job.promptId, fileKey: file.key }, { ...this.options(), responseType: 'blob' });
        if (!alive()) return;
        const ext = file.filename.split('.').pop().toLowerCase();
        const saved = await saveOutputBlob(new File([blob], file.filename, { type: file.mimeType }), { ext });
        if (!alive()) return;
        const localPath = String(saved.localPath || saved.path || '').replace(/^\//, '');
        const src = saved.url || (localPath ? '/' + localPath : ''); if (!src) throw new Error('后端未返回保存路径');
        const type = file.mimeType.startsWith('video/') ? 'source-video' : file.mimeType.startsWith('audio/') ? 'source-audio' : 'source-image';
        const size = type === 'source-audio' ? { width: 320, height: 140 } : getAutoMediaSizeByShortSide(640, 480);
        const position = calcSafeSpawnPosNearNode(appStore.getStateRaw().nodes, this.current(), size.width, size.height);
        const data = { id: nodeId, type, ...position, ...size, src, localPath, name: file.filename, fileName: saved.filename || file.filename, needsAutoResize: true };
        appStore.addNode(type === 'source-audio' ? data : buildSourceMediaNodePayload(data));
        this.jobPatch({ saved: { ...this.config.job.saved, [file.key]: nodeId } }); commit();
      }
      this.message('生成结果已保存到本地并加入画布。');
    } catch (error) { this.message('部分结果尚未保存；已成功的节点会保留，可再次点击重试：' + error.message); }
    finally { this.busy = false; this.sync(); }
  }
  update(data) {
    const oldRequest = this.config.job?.requestId;
    if (this.nodesContext !== appStore.getStateRaw().nodes) this.stopTracking();
    this.nodesContext = appStore.getStateRaw().nodes;
    this.data = data; this.config = data.comfyWorkflow || {};
    if (oldRequest !== this.config.job?.requestId) this.stopTracking();
    if (this.renderedWorkflow !== this.config.workflow && this.renderedWorkflowSignature !== JSON.stringify(this.config.workflow)) this.renderInputs();
    if (document.activeElement !== this.endpoint) this.endpoint.value = this.config.endpoint || 'http://127.0.0.1:8188';
    this.sync();
  }
  unmount() { this.disposed = true; this.stopTracking(); this.abort.abort(); if (this.token) this.token.value = ''; }
}
