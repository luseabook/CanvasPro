import { createStoryAssetMediaPanel } from './StoryAssetMediaPanel.js';
import { prepareStoryAssetBatch, prepareStoryAssetResult } from './storyAssetMediaCanvas.js';
import { selectStoryAssets, storyAssetLabel, createStoryAssetBatchPolicy, readStoryAssetAcceptedImage, matchesStoryAssetSource } from './storyAssetMediaModel.js';
import { listStoryClipAudioSources, storyClipAudioSummary } from './storyClipMedia.js';
import { generateId } from '../../core/math.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { MEDIA_CLIP_COMPACT_SIZE } from '../../services/mediaSizingPolicy.js';
import { createStoryClipPreview } from './StoryClipPreview.js';
import { readStoryClipItems, buildStoryClipPlan, applyStoryClipPlan } from './storyClipModel.js';
import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { createStoryMediaBatchPanel } from './StoryMediaBatchPanel.js';
import { applyStoryWorkspaceDraft } from './storyWorkspaceApply.js';
import { renderStoryMediaPanel } from './StoryMediaPanel.js';
import { getStoryMediaModels, prepareStoryMediaGeneration, prepareStoryMediaResult, prepareStoryMediaBatch, prepareStoryReferenceVideo } from './storyMediaCanvas.js';
import appStore from '../../core/stores/appStore.js';
import { commit } from '../history.js';
import { extractStoryDocument, isStoryDocumentFile } from '../../../api/storyDocumentApi.js';
import { appendDocumentToWorkspace } from './storyDocumentImport.js';
import { createStoryDocumentPreview } from './StoryDocumentPreview.js';
import { createStoryAiPanel } from './StoryAiPanel.js';
import { createStoryAiQueuePanel } from './StoryAiQueuePanel.js';
import { createStoryAiQueueRunner } from './storyAiQueueRunner.js';
import { getStoryQueueStorageScope } from './storyAiQueueStorage.js';
import { createStoryQueuePersistence } from './storyAiQueuePersistence.js';
import { downloadStoryQueueSnapshot } from './StoryAiQueueStoragePanel.js';
import { assertStoryAiQueueSource } from './storyAiQueueModel.js';
import { assertStoryAiModelReady, isStoryAiPending, requestStoryAi } from '../../../api/storyAiApi.js';
import { mergeStoryAiProposal } from './storyAiModel.js';
import { mergeStoryAiShotsProposal } from './storyAiShotsModel.js';
import { createEpisodeStoryboardNode } from './storyWorkspaceCanvas.js';
import { STORY_LIMITS, normalizeStoryWorkspace, parseStoryWorkspaceJson, createEpisode, createShot, storyId,
  draftShotsFromScript, duplicateEpisode, removeStoryAsset, moveStoryItem, collectStoryboardEpisode,
  storyWorkspaceMarkdown, storyEpisodeCsv } from './storyWorkspaceModel.js';

let activeEditor = null;
export function storyElement(tag, className = '', text) {
  const element = document.createElement(tag); element.className = className;
  if (text !== undefined) element.textContent = String(text); return element;
}
export function ensureStoryWorkspaceStyles() {
  if (document.getElementById('story-workspace-styles')) return;
  const link = storyElement('link'); link.id = 'story-workspace-styles'; link.rel = 'stylesheet';
  link.href = new URL('../../../styles/story-workspace.css', import.meta.url).href; document.head.append(link);
}
export function openStoryWorkspace(nodeId) {
  if (activeEditor) {
    if (activeEditor.nodeId === nodeId) { activeEditor.dialog.focus(); return activeEditor; }
    if (!activeEditor.close()) return null;
  }
  const editor = new StoryWorkspaceEditor(nodeId);
  editor.mount(); activeEditor = editor; return editor;
}
class StoryWorkspaceEditor {
  constructor(nodeId) {
    this.nodeId = nodeId; this.nodesContext = appStore.getStateRaw().nodes;
    const node = this.nodesContext[nodeId]; if (!node?.storyWorkspace) throw new Error('工作室数据缺失');
    this.draft = normalizeStoryWorkspace(node.storyWorkspace);
    this.baseSignature = JSON.stringify(this.draft); this.dirty = false; this.closed = false; this.detached = false;
    this.episodeId = this.draft.episodes[0]?.id || ''; this.tab = 'script'; this.page = 0; this.assetPage = 0;
    this.abort = new AbortController(); this.viewAbort = null; this.busy = false; this.generation = 0;
    this.importOperation = null; this.documentPreview = null; this.aiSession = null; this.aiQueue = null; this.queueSession = null; this.queuePersistence = null;
    this.queueStorageScope = getStoryQueueStorageScope(window, nodeId);
  }
  current() { return !this.closed && !this.detached && appStore.getStateRaw().nodes === this.nodesContext && this.nodesContext[this.nodeId]; }
  episode() { return this.draft.episodes.find(episode => episode.id === this.episodeId); }
  message(text) { if (!this.closed && this.status) this.status.textContent = text; }
  listen(target, type, action, view = false) {
    target.addEventListener(type, action, { signal: view ? this.viewAbort.signal : this.abort.signal });
  }
  run(action) {
    if (this.closed || this.busy) return;
    try { action(); } catch (error) { this.message(error.message); }
  }
  button(label, action, view = true, allowInvalid = false) {
    const button = storyElement('button', 'sw-button', label); button.type = 'button';
    this.listen(button, 'click', () => this.run(() => { if (!allowInvalid) this.flushField(); action(); }), view); return button;
  }
  change(change, render = false) {
    const next = JSON.parse(JSON.stringify(this.draft)); change(next);
    this.draft = normalizeStoryWorkspace(next); this.generation++;
    this.dirty = JSON.stringify(this.draft) !== this.baseSignature;
    this.message(this.dirty ? '有未应用的编辑。点击“应用到项目”后，使用项目原有保存功能落盘。' : '与项目一致。');
    this.updateBadge(); if (render) this.render();
  }
  updateBadge() { if (this.badge) this.badge.textContent = (this.dirty || this.pendingEdit) ? '未应用' : '已应用'; }
  field(label, value, update, { multiline = false, options, multiple = false, max = 20000, number = false } = {}) {
    const wrapper = storyElement('label', 'sw-field'); wrapper.append(storyElement('span', '', label));
    let input;
    if (options) {
      input = storyElement('select'); input.multiple = multiple; if (multiple) input.size = 4;
      for (const option of options) {
        const child = storyElement('option', '', option.label); child.value = option.value;
        child.selected = multiple ? value.includes(option.value) : option.value === value; input.append(child);
      }
    } else {
      input = storyElement(multiline ? 'textarea' : 'input');
      if (number) { input.type = 'number'; input.min = '0.1'; input.max = '3600'; input.step = 'any'; }
      // Validate on change rather than silently truncating pasted scripts.
      else input.dataset.textLimit = String(max);
      input.value = value; if (multiline) input.rows = max > 20000 ? 18 : 3;
    }
    this.listen(input, 'input', () => { this.pendingEdit = true; this.updateBadge(); }, true);
    this.listen(input, 'change', () => this.run(() => {
      try {
        let next = input.value;
        if (multiple) next = [...input.selectedOptions].map(option => option.value);
        if (number) { if (!String(next).trim()) throw new Error('时长不能为空'); next = Number(next); }
        if (!options && !number && next.length > max) throw new Error(`该字段最多 ${max} 字符，请缩短或拆分；原文仍留在输入框中。`);
        update(next); input.removeAttribute('aria-invalid'); this.pendingEdit = false; this.updateBadge();
      }
      catch (error) { input.setAttribute('aria-invalid', 'true'); throw error; }
    }), true);
    wrapper.append(input); return wrapper;
  }
  flushField() {
    const focused = document.activeElement;
    if (focused && this.dialog.contains(focused) && focused.matches('input,textarea,select')) focused.blur();
    if (this.dialog.querySelector('[aria-invalid=true]')) throw new Error('请先修正标红字段，或重载项目放弃编辑');
  }
  mount() {
    ensureStoryWorkspaceStyles(); this.previousFocus = document.activeElement;
    this.dialog = storyElement('dialog', 'sw-studio'); this.dialog.tabIndex = -1; this.dialog.setAttribute('aria-label', '剧本工作室');
    const header = storyElement('header', 'sw-header'); this.badge = storyElement('span', 'sw-badge', '已应用');
    header.append(storyElement('h2', '', '剧本工作室'), this.badge,
      this.button('应用到项目', () => this.apply(), false), this.button('重载项目', () => this.reload(), false, true), this.button('关闭', () => this.close(), false, true));
    this.cancelImportButton = storyElement('button', 'sw-button', '取消等待 / 放弃导入');
    this.cancelImportButton.type = 'button'; this.cancelImportButton.hidden = true;
    this.listen(this.cancelImportButton, 'click', () => this.cancelDocumentImport());
    header.append(this.cancelImportButton);
    const tools = storyElement('div', 'sw-tools'); this.topTools = tools;
    this.importFile = storyElement('input'); this.importFile.type = 'file'; this.importFile.accept = '.json,.txt,.md,.docx,.pdf,text/plain,text/markdown,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'; this.importFile.hidden = true;
    tools.append(this.button('批量 AI 分镜队列', () => this.openStoryQueue(), false), this.button('AI 拆集 / 资料 / 分镜', () => this.openStoryAi(), false), this.button('导入 JSON / TXT / MD / DOCX / PDF', () => this.importFile.click(), false),
      this.button('导出工作室 JSON', () => this.download('json'), false), this.button('导出 Markdown', () => this.download('md'), false),
      this.button('导出当前集 CSV', () => this.download('csv'), false), this.button('当前集 → 分镜脚本节点', () => this.toCanvas(), false), this.importFile);
    tools.append(storyElement('span', 'sw-document-notice', 'DOCX/PDF 上传至当前 Canvas 后端提取；不调用 AI/OCR。'));
    this.listen(this.importFile, 'change', () => { const file = this.importFile.files?.[0]; this.importFile.value = ''; if (file) void this.import(file); });
    this.layout = storyElement('div', 'sw-layout'); this.sidebar = storyElement('nav', 'sw-sidebar'); this.main = storyElement('main', 'sw-main');
    this.layout.append(this.sidebar, this.main); this.status = storyElement('div', 'sw-status', '编辑先保留为草稿；应用到项目后，可用画布撤销/重做。不会自动调用 AI 或生成付费任务。');
    this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');
    this.dialog.append(header, tools, this.layout, this.status);
    this.listen(this.dialog, 'cancel', event => { event.preventDefault(); this.close(); });
    this.listen(this.dialog, 'keydown', event => {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); this.run(() => this.apply()); }
    });
    for (const type of ['pointerdown', 'pointerup', 'dblclick', 'wheel']) this.listen(this.dialog, type, event => event.stopPropagation());
    this.listen(window, 'beforeunload', event => { if (this.dirty || this.pendingEdit || this.importOperation || this.aiSession || this.mediaSession || this.aiQueue?.hasJobs() || this.dialog.querySelector('[aria-invalid=true]')) { event.preventDefault(); event.returnValue = ''; } });
    document.body.append(this.dialog); this.render(); this.dialog.showModal();
  }
  render() {
    if (this.closed) return;
    this.viewAbort?.abort(); this.viewAbort = new AbortController(); this.sidebar.replaceChildren(); this.main.replaceChildren();
    for (const [key, label] of [['script', '剧本正文'], ['shots', '分镜表'], ['media', '镜头媒体'], ['characters', '人物资料'], ['scenes', '场景资料'], ['collect', '从画布收集']]) {
      const button = this.button(label, () => { this.flushField(); this.tab = key; this.assetPage = 0; this.render(); });
      button.classList.toggle('is-active', this.tab === key); this.sidebar.append(button);
    }
    this.sidebar.append(storyElement('h3', '', `单集 · ${this.draft.episodes.length}`), this.button('＋ 新建单集', () => {
      const episode = createEpisode(`第 ${this.draft.episodes.length + 1} 集`);
      this.change(draft => draft.episodes.push(episode)); this.episodeId = episode.id; this.tab = 'script'; this.page = 0; this.render();
    }));
    for (const episode of this.draft.episodes) {
      const button = this.button(episode.title || '未命名单集', () => { this.flushField(); this.episodeId = episode.id; this.tab = 'script'; this.page = 0; this.render(); });
      button.classList.toggle('is-active', this.episodeId === episode.id); this.sidebar.append(button);
    }
    if (this.tab === 'characters' || this.tab === 'scenes') this.renderAssets(this.tab);
    else if (this.tab === 'collect') this.renderCollect();
    else if (this.episode()) { if (this.tab === 'shots') this.renderShots(); else if (this.tab === 'media') renderStoryMediaPanel(this, storyElement, getStoryMediaModels); else this.renderScript(); }
    else this.main.append(storyElement('p', 'sw-help', '点击“新建单集”开始。'));
  }
  editEpisode(field, value) { this.change(draft => { draft.episodes.find(e => e.id === this.episodeId)[field] = value; }); }
  renderScript() {
    const episode = this.episode(), tools = storyElement('div', 'sw-tools');
    tools.append(this.button('复制单集', () => {
      const copy = duplicateEpisode(this.episode()); this.change(draft => draft.episodes.push(copy)); this.episodeId = copy.id; this.render();
    }), this.button('上移', () => this.change(draft => { draft.episodes = moveStoryItem(draft.episodes, this.episodeId, -1); }, true)),
    this.button('下移', () => this.change(draft => { draft.episodes = moveStoryItem(draft.episodes, this.episodeId, 1); }, true)),
    this.button('删除单集', () => {
      if (!window.confirm(`删除“${this.episode().title}”及其全部分镜？`)) return;
      this.change(draft => { draft.episodes = draft.episodes.filter(e => e.id !== this.episodeId); }); this.episodeId = this.draft.episodes[0]?.id || ''; this.render();
    }));
    this.main.append(this.field('项目标题', this.draft.title, value => this.change(draft => { draft.title = value; }), { max: 300 }),
      this.field('故事梗概', this.draft.synopsis, value => this.change(draft => { draft.synopsis = value; }), { multiline: true }), tools,
      this.field('单集标题', episode.title, value => this.editEpisode('title', value), { max: 300 }),
      this.field('剧本正文（空行分段）', episode.script, value => this.editEpisode('script', value), { multiline: true, max: STORY_LIMITS.script }),
      this.button('按段落重建分镜草稿（非 AI）', () => {
        if (this.episode().shots.length && !window.confirm('这将替换当前集已有分镜；正文不会改变。继续？')) return;
        this.editEpisode('shots', draftShotsFromScript(this.episode().script)); this.tab = 'shots'; this.page = 0; this.render();
      }), storyElement('p', 'sw-help', '每段成为一个待编辑镜头，默认时长 5 秒，仅为占位值。人物、场景、对白不会被自动识别。'));
  }
  renderShots() {
    const episode = this.episode();
    this.page = Math.min(this.page, Math.max(0, Math.ceil(episode.shots.length / 10) - 1));
    const tools = storyElement('div', 'sw-tools');
    tools.append(this.button('＋ 空白分镜', () => { this.editEpisode('shots', [...this.episode().shots, createShot()]); this.page = Math.floor((this.episode().shots.length - 1) / 10); this.render(); }),
      this.button('上一页', () => { this.page = Math.max(0, this.page - 1); this.render(); }),
      storyElement('span', '', `${episode.title} · 共 ${episode.shots.length} 镜 · 第 ${this.page + 1} 页`),
      this.button('下一页', () => { this.page = Math.min(Math.max(0, Math.ceil(episode.shots.length / 10) - 1), this.page + 1); this.render(); }));
    this.main.append(tools);
    episode.shots.slice(this.page * 10, this.page * 10 + 10).forEach((shot, offset) => {
      const card = storyElement('section', 'sw-card'), header = storyElement('div', 'sw-tools');
      const patch = (field, value) => this.change(draft => { draft.episodes.find(e => e.id === this.episodeId).shots.find(s => s.id === shot.id)[field] = value; });
      header.append(storyElement('h3', '', `镜头 ${this.page * 10 + offset + 1}`),
        this.button('↑', () => { this.editEpisode('shots', moveStoryItem(this.episode().shots, shot.id, -1)); this.render(); }),
        this.button('↓', () => { this.editEpisode('shots', moveStoryItem(this.episode().shots, shot.id, 1)); this.render(); }),
        this.button('删除', () => { if (window.confirm('删除这个分镜？')) { this.editEpisode('shots', this.episode().shots.filter(s => s.id !== shot.id)); this.render(); } }));
      const grid = storyElement('div', 'sw-grid');
      grid.append(this.field('时长（秒）', shot.duration, value => patch('duration', value), { number: true }),
        this.field('景别', shot.size, value => patch('size', value), { max: 300 }),
        this.field('场景', shot.sceneId, value => patch('sceneId', value), { options: [{ value: '', label: '未指定' }, ...this.draft.scenes.map(s => ({ value: s.id, label: s.name || '未命名场景' }))] }),
        this.field('人物（Ctrl/Cmd 多选）', shot.characterIds, value => patch('characterIds', value), { multiple: true, options: this.draft.characters.map(c => ({ value: c.id, label: c.name || '未命名人物' })) }));
      for (const [key, label] of Object.entries({ description: '画面描述', characterNotes: '本镜人物设定补充（可选）', dialogue: '对白', action: '动作', mood: '情绪', imagePrompt: '图片提示词', videoPrompt: '视频提示词', sound: '音效' })) {
        grid.append(this.field(label, shot[key], value => patch(key, value), { multiline: true, max: key === 'mood' ? 1000 : 20000 }));
      }
      card.append(header, grid); this.main.append(card);
    });
  }
  renderAssets(kind) {
    const label = kind === 'characters' ? '人物' : '场景';
    const tools = storyElement('div', 'sw-tools');
    tools.append(this.button(`＋ 新建${label}`, () => {
      this.change(draft => draft[kind].push({ id: storyId(kind), name: `新${label}`, description: '', referenceNodeId: '' }));
      this.assetPage = Math.floor((this.draft[kind].length - 1) / 10); this.render();
    }), this.button('上一页', () => { this.assetPage = Math.max(0, this.assetPage - 1); this.render(); }),
    this.button('下一页', () => { this.assetPage = Math.min(Math.max(0, Math.ceil(this.draft[kind].length / 10) - 1), this.assetPage + 1); this.render(); }));
    this.main.append(storyElement('h2', '', `${label}资料 · ${this.draft[kind].length}`), tools,
      storyElement('p', 'sw-help', '参考图片仅引用当前画布的源图像节点。JSON 不打包图片文件；跨画布导入后需重新绑定。生成的分镜节点使用引用快照，不自动同步。'));
    const images = Object.values(this.nodesContext).filter(node => node.type === 'source-image');
    const media = createStoryAssetMediaPanel({ editor: this, element: storyElement, assetKind: kind, getModels: getStoryMediaModels });
    this.draft[kind].slice(this.assetPage * 10, this.assetPage * 10 + 10).forEach(asset => {
      const card = storyElement('section', 'sw-card');
      const patch = (field, value) => this.change(draft => { draft[kind].find(a => a.id === asset.id)[field] = value; });
      const options = [{ value: '', label: '无参考图' }, ...images.filter(node => !node.storyAssetResult || matchesStoryAssetSource(node.storyAssetResult, { workspaceNodeId: this.nodeId, assetKind: kind, assetId: asset.id }, node.id)).map(node => ({ value: node.id, label: node.name || node.id }))];
      if (asset.referenceNodeId && !images.some(n => n.id === asset.referenceNodeId)) options.push({ value: asset.referenceNodeId, label: '引用已失效，请重新选择' });
      card.append(this.field(`${label}名称`, asset.name, value => patch('name', value), { max: 300 }),
        this.field('设定 / 外观 / 备注', asset.description, value => patch('description', value), { multiline: true }),
        this.field('参考图片节点（选择后需应用）', asset.referenceNodeId, value => this.setAssetReference(kind, asset.id, value), { options }),
        this.button('删除资料', () => {
          if (!window.confirm(`删除该${label}资料，并解除所有分镜对它的引用？不会删除图片节点。`)) return;
          const next = removeStoryAsset(this.draft, kind, asset.id); this.change(draft => Object.assign(draft, next));
          this.assetPage = Math.min(this.assetPage, Math.max(0, Math.ceil(this.draft[kind].length / 10) - 1)); this.render();
        })); media.appendCard(card, asset); this.main.append(card);
    });
  }
  renderCollect() {
    this.main.append(storyElement('h2', '', '从当前画布收集'), storyElement('p', 'sw-help', '每次收集新建一个单集，不覆盖原节点。分镜导入支持本版标准文本列；自定义列、角色图片占位符、富文本格式不会迁移。参考图片请在资料页重新绑定。'));
    const sourceNodes = Object.values(this.nodesContext).filter(node => ['source-text', 'storyboard-script'].includes(node.type));
    const select = storyElement('select'); select.setAttribute('aria-label', '选择要收集的画布节点');
    for (const node of sourceNodes) { const option = storyElement('option', '', `${node.name || node.id} · ${node.type}`); option.value = node.id; select.append(option); }
    this.main.append(select, this.button('收集为新单集', () => {
      if (!this.current()) throw new Error('来源画布已改变，请重新打开工作室');
      const node = this.nodesContext[select.value]; if (!node) throw new Error('请选择一个有效源节点');
      if (node.type === 'source-text') {
        const episode = createEpisode(String(node.name || '收集的文字').slice(0, 300), String(node.content || ''));
        this.change(draft => draft.episodes.push(episode)); this.episodeId = episode.id;
      } else {
        const result = collectStoryboardEpisode(this.draft, node); this.change(draft => Object.assign(draft, result.workspace)); this.episodeId = result.episodeId;
      }
      this.tab = 'script'; this.render();
    }));
  }
  apply(additionalNodes = [], additionalEdges = []) {
    this.flushField(); const node = this.current();
    if (!node) throw new Error('来源节点已离开当前画布。请导出草稿，重新打开对应画布后导入。');
    const applied = applyStoryWorkspaceDraft({ store: appStore, commit, nodeId: this.nodeId,
      nodesContext: this.nodesContext, baseSignature: this.baseSignature, draft: this.draft, additionalNodes, additionalEdges });
    this.baseSignature = applied.signature; this.dirty = false;
    this.updateBadge(); this.message('已应用到当前画布项目。请使用项目原有保存功能落盘；关闭工作室后可用画布撤销/重做。');
  }
  reload() {
    if (!this.current()) throw new Error('原画布已不在当前上下文，请关闭后重新打开');
    if (!window.confirm('丢弃当前草稿，重新载入项目中已应用的内容？')) return;
    this.draft = normalizeStoryWorkspace(this.current().storyWorkspace); this.baseSignature = JSON.stringify(this.draft); this.dirty = false; this.pendingEdit = false; this.generation++;
    this.episodeId = this.draft.episodes[0]?.id || ''; this.page = 0; this.updateBadge(); this.render(); this.message('已从项目重载。');
  }
  toCanvas() {
    if (!this.episode()?.shots.length) throw new Error('请先在当前集添加分镜');
    if (!window.confirm('应用草稿并新建一份分镜脚本快照？不会覆盖已有分镜节点，也不会自动执行生成任务。')) return;
    this.apply(); createEpisodeStoryboardNode(this.nodeId, this.draft, this.episodeId, this.nodesContext);
    this.message('已在工作室节点旁创建分镜脚本快照。可关闭工作室，在该节点继续编辑或使用原有生成功能。');
  }
  mediaShot(episodeId, shotId) {
    this.flushField();
    if (!this.current() || JSON.stringify(normalizeStoryWorkspace(this.current().storyWorkspace)) !== this.baseSignature) {
      throw new Error('画布或项目中的工作室已改变，请导出草稿后重载；不会写入其他来源');
    }
    const shot = this.draft.episodes.find(episode => episode.id === episodeId)?.shots.find(item => item.id === shotId);
    if (!shot) throw new Error('来源镜头已不存在');
    return shot;
  }
  createMediaNode(episodeId, shotId, kind, model) {
    const shot = this.mediaShot(episodeId, shotId);
    const existing = Object.values(this.nodesContext).filter(node => {
      const source = node?.storyMediaSource;
      return source?.workspaceNodeId === this.nodeId && source.episodeId === episodeId && source.shotId === shotId && source.kind === kind;
    });
    if (existing.length >= 6) throw new Error('本镜同类生成节点已达6个，请先在画布核对并整理旧节点');
    const node = prepareStoryMediaGeneration({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episodeId, shot, kind, model });
    if (!window.confirm(`应用全部草稿并建立一个${kind === 'image' ? '图片' : '视频'}节点？本镜已有同类节点 ${existing.length} 个。\n模型：${node.provider} / ${node.model}\n这里只复制预览文字，不发送请求。请在原节点核对参数、素材和费用后点击生成。`)) return;
    this.apply([node]); this.render();
    this.message('已建立原 AI 生成节点，未发送请求。点击“关闭并定位原生成节点”，在那里核对参数和费用后生成；结果返回后重新打开工作室 → 镜头媒体。请保存工程。');
  }
  createReferenceVideo(episodeId, shotId, expectedImageId) {
    const shot = this.mediaShot(episodeId, shotId);
    const count = Object.values(this.nodesContext).filter(node => node?.storyMediaSource?.workspaceNodeId === this.nodeId &&
      node.storyMediaSource.episodeId === episodeId && node.storyMediaSource.shotId === shotId && node.storyMediaSource.kind === 'video').length;
    if (count >= 6) throw new Error('本镜视频任务已达6个，请先核对并整理旧节点');
    const plan = prepareStoryReferenceVideo({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episodeId, shot });
    if (plan.node.storyMediaReference.imageNodeId !== expectedImageId) throw new Error('所选首帧已变化，请刷新并重新选择');
    if (!window.confirm(`应用全部草稿并新建首帧视频节点和连线？本镜已有视频任务 ${count} 个。\n首帧：${expectedImageId}\n${plan.node.storyMediaReference.localPath}\n模型：RunningHub Seedance 2.0（图生视频）\n本步不上传或生成。不加入纯文字批次；关闭并定位原视频节点，核对参数/费用后另行确认发送。`)) return;
    this.apply([plan.node], [plan.edge]); this.render();
    this.message('已创建原生首帧连线，未发送。请关闭并定位视频节点；原生成入口会再次核对首帧并确认费用。请保存工程。');
  }
  openStoryClip(episodeId, shotIds) {
    this.flushField();
    const episode = this.draft.episodes.find(item => item.id === episodeId);
    const items = readStoryClipItems({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episode, shotIds });
    for (const item of items) this.mediaShot(episodeId, item.shotId);
    const session = { panel: null };
    session.panel = createStoryClipPreview({ element: storyElement, items, audioSources: listStoryClipAudioSources(this.nodesContext),
      readItems: mediaKinds => readStoryClipItems({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episode, shotIds, mediaKinds }),
      onClose: () => this.closeStoryClip(),
      onLocate: id => { this.closeStoryClip(); this.locateMediaNode(id); },
      onApply: (ranges, selection) => {
        const selectedItems = selection.items, audio = selection.audio;
        if (this.clipSession !== session || !this.current()) throw new Error('初剪预览或来源画布已改变');
        const existing = Object.values(this.nodesContext).filter(node => node?.storySequence?.workspaceNodeId === this.nodeId && node.storySequence.episodeId === episodeId);
        if (existing.length >= 6) throw new Error('本集已有6个初剪节点，请先整理旧版本');
        const episodeNow = this.draft.episodes.find(item => item.id === episodeId);
        const position = calcSafeSpawnPosNearNode(this.nodesContext, this.current(), MEDIA_CLIP_COMPACT_SIZE.width, MEDIA_CLIP_COMPACT_SIZE.height);
        const plan = buildStoryClipPlan({ id: generateId('media-clip'), edgeIds: items.map(() => generateId('edge')), nodes: this.nodesContext,
          workspaceNodeId: this.nodeId, episode: episodeNow, items: selectedItems, ranges, audio,
          audioEdgeId: audio ? generateId('edge') : '', mediaVersion: 2, ...position });
        if (!window.confirm(`应用全部草稿，并创建${items.length}段 / ${plan.total}秒的原剪辑节点？\n本集已有初剪 ${existing.length} 个，本次不覆盖它们。\n${storyClipAudioSummary(audio)}\n这里只建节点，不运行渲染。请保存工程，并在原剪辑入口核对后另行确认导出。`)) return;
        const applied = applyStoryClipPlan({ store: appStore, nodesContext: this.nodesContext, workspaceNodeId: this.nodeId,
          baseSignature: this.baseSignature, draft: this.draft, plan, commit });
        this.baseSignature = applied.signature; this.dirty = false; this.updateBadge(); this.closeStoryClip();
        this.message('已建立原剪辑节点/连线，未渲染。点击“关闭并定位初剪”，原导出入口另行确认后才会运行本地任务。请保存工程。');
      },
    });
    this.clipSession = session; this.busy = true; this.layout.hidden = true; this.layout.inert = true; this.topTools.inert = true;
    this.dialog.insertBefore(session.panel.root, this.layout); session.panel.focus();
  }
  closeStoryClip() {
    if (!this.clipSession) return;
    this.clipSession.panel.destroy(); this.clipSession = null; this.busy = false;
    this.layout.hidden = false; this.layout.inert = false; this.topTools.inert = false;
    this.tab = 'media'; this.render();
  }
  assetFor(assetKind, assetId) {
    storyAssetLabel(assetKind);
    if (!this.current()) throw new Error('来源工作室或画布已改变');
    const asset = this.draft[assetKind].find(item => item.id === assetId);
    if (!asset) throw new Error('来源资料已不存在');
    return asset;
  }
  createAssetBatch(assetKind, assetIds, model) {
    this.flushField();
    const assets = selectStoryAssets(this.draft, assetKind, assetIds);
    for (const asset of assets) this.assetFor(assetKind, asset.id);
    const batchId = storyId('asset-batch');
    const additions = prepareStoryAssetBatch({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, assetKind, assets, model, batchId });
    if (!window.confirm(`应用全部草稿并按资料顺序建立 ${additions.length} 个${storyAssetLabel(assetKind)}图片节点？\n${assets.map(asset => asset.name).join('、')}\n模型：${model.provider} / ${model.model}\n这里只建节点，不上传、不发送，不带已有参考图。重复建立会产生新节点；稍后准备原运行时并再次确认费用。`)) return;
    this.apply(additions);
    const session = { panel: null, returnTab: assetKind };
    const items = additions.map(node => ({ nodeId: node.id, assetId: node.storyAssetSource.assetId, assetKind, kind: 'image' }));
    const assertCurrent = () => {
      if (this.mediaSession !== session || !this.current() || JSON.stringify(normalizeStoryWorkspace(this.current().storyWorkspace)) !== this.baseSignature) {
        throw new Error('来源工作室或画布已改变，后续资料发送已停止');
      }
    };
    const sourcePolicy = createStoryAssetBatchPolicy({ workspaceNodeId: this.nodeId, assetKind, getAsset: id => this.draft[assetKind].find(asset => asset.id === id) });
    session.panel = createStoryMediaBatchPanel({ element: storyElement, items,
      title: `${storyAssetLabel(assetKind)}资料图片批次 · 先准备，再确认发送`, closeLabel: `返回${storyAssetLabel(assetKind)}资料`, promptLabel: '本项待发送资料文字',
      description: '最多6项，与镜头批次共用同一页面串行入口，只用明确预览的资料名称/设定与原图片模型默认参数；不发送已有参考图，不自动采纳或绑定。',
      runtimeOptions: { store: appStore, registry: nodeRuntimeRegistry, renderer: window.v2Renderer, getModels: getStoryMediaModels,
        commit, batchId, workspaceNodeId: this.nodeId, assertCurrent, sourcePolicy }, onClose: () => this.closeMediaBatch(),
    });
    this.mediaSession = session; this.busy = true; this.layout.hidden = true; this.layout.inert = true; this.topTools.inert = true;
    this.dialog.insertBefore(session.panel.root, this.layout); session.panel.focus();
    this.message('资料批次节点已建立，尚未发送。尝试/结果位于原画布节点，仍须原工程保存。');
  }
  adoptAssetResult(assetKind, assetId, nodeId, index, expectedKey) {
    const asset = this.assetFor(assetKind, assetId);
    const node = prepareStoryAssetResult({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, assetKind, asset, nodeId, index, expectedKey });
    if (!window.confirm(`采纳 ${asset.name} 的结果 ${index + 1} 并应用全部草稿？\n${node.localPath}\n将建立独立本地图片，不替换已有参考图；请先在原节点查看真实结果。本步不复制文件、不探测存在性，后续需显式绑定参考并保存工程。`)) return;
    this.apply([node]); this.render();
    this.message('已建立独立资料图片，未自动绑定。可显式设为本资料参考图，再生成新的画布分镜脚本快照；请保存工程。');
  }
  setAssetReference(assetKind, assetId, nodeId, expectedReference = null) {
    const asset = this.assetFor(assetKind, assetId), node = this.nodesContext[nodeId];
    if (nodeId && node?.type !== 'source-image') throw new Error('所选参考图节点已不存在或类型不符');
    let reference;
    if (node?.storyAssetResult) {
      reference = readStoryAssetAcceptedImage({ nodes: this.nodesContext, context: { workspaceNodeId: this.nodeId, assetKind, assetId }, asset, nodeId });
    }
    if (expectedReference && JSON.stringify(reference) !== JSON.stringify(expectedReference)) throw new Error('确认期间参考图已改变，请刷新重新选择');
    this.change(draft => {
      const target = draft[assetKind].find(item => item.id === assetId); target.referenceNodeId = nodeId;
      if (reference) target.referenceImage = reference; else delete target.referenceImage;
    });
  }
  bindAssetReference(assetKind, assetId, reference) {
    const asset = this.assetFor(assetKind, assetId);
    if (!reference) throw new Error('没有可绑定的资料图');
    if (!window.confirm(`将这张已采纳图片显式设为 ${asset.name} 的参考图并应用全部草稿？\n${reference.localPath}\n原参考：${asset.referenceNodeId || '无'}。旧节点/文件保留，不触发生成或上传。之后新建分镜脚本快照才传递给引用本资料的镜头；已有分镜/生成节点不自动更新。`)) return;
    this.setAssetReference(assetKind, assetId, reference.nodeId, reference); this.apply(); this.render();
    this.message('已显式绑定资料参考图。请核对分镜中的人物/场景选择，再生成新的画布分镜脚本快照，并保存工程；未调用模型。');
  }
  createMediaBatch(episodeId, shotIds, kind, model) {
    if (!shotIds.length || shotIds.length > 6) throw new Error('请先选择1–6个镜头');
    const selected = new Set(shotIds);
    const episode = this.draft.episodes.find(item => item.id === episodeId);
    if (!episode) throw new Error('来源单集已不存在');
    const shots = episode.shots.filter(shot => selected.has(shot.id));
    if (shots.length !== selected.size) throw new Error('所选镜头已改变，请重新选择');
    for (const shot of shots) this.mediaShot(episodeId, shot.id);
    const batchId = storyId('media-batch');
    const additions = prepareStoryMediaBatch({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episodeId, shots, kind, model, batchId });
    if (!window.confirm(`应用全部草稿并按当前镜头顺序创建 ${additions.length} 个${kind === 'image' ? '图片' : '视频'}节点？\n模型：${model.provider} / ${model.model}\n这里只建节点，不发送；若本镜已有任务，本次仍会创建新节点，请避免重复。稍后需准备原运行时并再次确认费用。`)) return;
    this.apply(additions);
    const session = { panel: null };
    const items = additions.map(node => ({ nodeId: node.id, shotId: node.storyMediaSource.shotId, kind }));
    const assertCurrent = () => {
      if (this.mediaSession !== session || !this.current() || JSON.stringify(normalizeStoryWorkspace(this.current().storyWorkspace)) !== this.baseSignature) {
        throw new Error('来源工作室或画布已改变，后续发送已停止');
      }
    };
    session.panel = createStoryMediaBatchPanel({ element: storyElement, items,
      runtimeOptions: { store: appStore, registry: nodeRuntimeRegistry, renderer: window.v2Renderer, getModels: getStoryMediaModels,
        commit, batchId, workspaceNodeId: this.nodeId, episodeId, assertCurrent,
        getShot: id => this.draft.episodes.find(item => item.id === episodeId)?.shots.find(shot => shot.id === id) },
      onClose: () => this.closeMediaBatch(),
    });
    this.mediaSession = session; this.busy = true; this.layout.hidden = true; this.layout.inert = true; this.topTools.inert = true;
    this.dialog.insertBefore(session.panel.root, this.layout); session.panel.focus();
    this.message('批次节点已建立，尚未发送；任务/结果保留在画布节点，仍须原工程保存。');
  }
  closeMediaBatch() {
    if (!this.mediaSession) return;
    const returnTab = this.mediaSession.returnTab || 'media';
    this.mediaSession.panel.destroy(); this.mediaSession = null;
    this.busy = false; this.layout.hidden = false; this.layout.inert = false; this.topTools.inert = false;
    this.tab = returnTab; this.render();
    this.message('后续批次发送已停止。已调用的原任务仍可能执行/计费；刷新节点状态后人工采纳结果，并保存工程。');
  }
  adoptMediaResult(episodeId, shotId, nodeId, index, expectedKey) {
    const shot = this.mediaShot(episodeId, shotId);
    const node = prepareStoryMediaResult({ nodes: this.nodesContext, workspaceNodeId: this.nodeId, episodeId, shot, nodeId, index, expectedKey });
    const kind = node.storyMediaResult.kind;
    const previous = (shot.mediaRefs || []).find(ref => ref.kind === kind);
    const previousNode = previous && this.nodesContext[previous.nodeId];
    if (previousNode?.storyMediaResult?.resultKey === expectedKey && previousNode.type === node.type &&
        previousNode.src === node.src && previousNode.localPath === node.localPath &&
        previousNode.originalLocalPath === node.originalLocalPath && previousNode.storyMediaResult.nodeId === previous.nodeId) {
      throw new Error('此结果已经关联，无需重复采纳');
    }
    if (!window.confirm(`采纳结果 ${index + 1} 并应用全部草稿？\n${node.localPath}\n将建立独立源媒体节点${previous ? '并替换本镜同类关联；旧节点保留' : ''}。不复制文件字节，也不保证文件仍存在。请先在原节点查看图片/视频；媒体文件与工程均须保留。`)) return;
    this.change(draft => {
      const target = draft.episodes.find(episode => episode.id === episodeId).shots.find(item => item.id === shotId);
      target.mediaRefs = [...(target.mediaRefs || []).filter(ref => ref.kind !== kind), { kind, nodeId: node.id }];
    });
    this.apply([node]); this.render();
    this.message('已采纳并应用，镜头指向独立本地结果节点；原生成节点再次生成不会自动改写关联。请使用原工程保存。');
  }
  locateMediaNode(nodeId) {
    if (!this.current() || !this.nodesContext[nodeId]) throw new Error('原画布或媒体节点已不存在');
    if (typeof window.v2FocusOnNodes !== 'function' && typeof window.v2FocusOnNode !== 'function') throw new Error('当前画布定位服务不可用，请在画布按节点名称查找');
    if (!this.close()) return;
    appStore.setSelectedNodes([nodeId]);
    if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([nodeId], 80, 800);
    else window.v2FocusOnNode(nodeId, 80, 800);
  }
  openStoryAi() {
    this.flushField();
    if (!this.current()) throw new Error('来源画布已改变，请重新打开工作室');
    const episode = this.episode();
    if (!episode) throw new Error('请先选择一个有正文的单集');
    const session = { generation: this.generation, panel: null };
    const isCurrent = () => {
      try {
        const node = this.current();
        return Boolean(node && this.aiSession === session && this.generation === session.generation &&
          JSON.stringify(normalizeStoryWorkspace(node.storyWorkspace)) === this.baseSignature);
      } catch { return false; }
    };
    session.panel = createStoryAiPanel({ episode, workspace: this.draft, nodes: this.nodesContext, isCurrent,
      onClose: () => { if (this.aiSession === session) this.closeStoryAi(); },
      onApply: (proposal, selection) => {
        if (!isCurrent()) throw new Error('来源画布或草稿已改变，不会合并过期结果');
        const merged = proposal.mode === 'shots'
          ? mergeStoryAiShotsProposal(this.draft, proposal, selection.shots)
          : mergeStoryAiProposal(this.draft, proposal, selection);
        this.change(draft => Object.assign(draft, merged.workspace));
        if (merged.episodeId) this.episodeId = merged.episodeId;
        this.closeStoryAi();
        if (proposal.mode === 'shots') { this.tab = 'shots'; this.page = Math.floor(merged.firstShotIndex / 10); }
        else { this.tab = merged.episodeId ? 'script' : 'characters'; this.page = 0; }
        this.assetPage = 0; this.render();
        this.message(`已向草稿追加 ${merged.added} 项，跳过同名 ${merged.skipped} 项；原内容保留。请核对后应用到项目并保存。`);
      },
    });
    this.aiSession = session; this.busy = true; this.layout.hidden = true; this.layout.inert = true; this.topTools.inert = true;
    this.dialog.insertBefore(session.panel.root, this.layout); session.panel.focus();
    this.message('AI 助手：发送前会确认费用与上传范围，结果只在确认后追加到草稿。');
  }
  closeStoryAi() {
    if (!this.aiSession) return;
    this.aiSession.panel.destroy(); this.aiSession = null;
    this.busy = false; this.layout.hidden = false; this.layout.inert = false; this.topTools.inert = false;
    this.message('已返回工作室；未确认的 AI 结果不会写入草稿，已发送请求可能仍在执行。');
  }
  isQueueContextCurrent() {
    try {
      if (this.queueStorageScope && getStoryQueueStorageScope(window, this.nodeId)?.key !== this.queueStorageScope.key) return false;
      const node = this.current();
      return Boolean(node && JSON.stringify(normalizeStoryWorkspace(node.storyWorkspace)) === this.baseSignature);
    } catch { return false; }
  }
  openStoryQueue() {
    this.flushField();
    if (!this.current() && !this.aiQueue?.hasJobs()) throw new Error('来源画布已改变，请重新打开工作室');
    if (!this.aiQueue) {
      this.aiQueue = createStoryAiQueueRunner({ ownerId: this.nodeId, execute: requestStoryAi,
        checkpoint: () => this.queuePersistence?.checkpoint(),
        beforeRequest: job => {
          if (!this.isQueueContextCurrent()) throw new Error('来源画布或工作室数据已改变，已暂停发送');
          if (isStoryAiPending()) throw new Error('另一个工作室 AI 请求尚未结束，本项尚未发送');
          assertStoryAiQueueSource(this.draft, job);
          assertStoryAiModelReady(job.model);
        },
      });
      this.queuePersistence = createStoryQueuePersistence({ queue: this.aiQueue, scope: this.queueStorageScope, isCurrent: () => this.isQueueContextCurrent() });
    }
    const session = { panel: null };
    session.panel = createStoryAiQueuePanel({ queue: this.aiQueue, persistence: this.queuePersistence, workspace: () => this.draft, nodes: this.nodesContext,
      isCurrent: () => this.queueSession === session && this.isQueueContextCurrent(),
      onClose: () => { if (this.queueSession === session) this.closeStoryQueue(); },
      onApply: (proposal, indices) => {
        if (this.queueSession !== session || !this.isQueueContextCurrent()) throw new Error('来源已改变，不会追加队列结果');
        const merged = mergeStoryAiShotsProposal(this.draft, proposal, indices);
        this.change(draft => Object.assign(draft, merged.workspace));
        this.episodeId = merged.episodeId; this.tab = 'shots'; this.page = Math.floor(merged.firstShotIndex / 10);
      },
    });
    this.queueSession = session; this.busy = true; this.layout.hidden = true; this.layout.inert = true; this.topTools.inert = true;
    this.dialog.insertBefore(session.panel.root, this.layout); session.panel.focus();
    this.message('队列可启用本地自动保存；关闭/刷新前请核对保存状态并定期导出快照。项目保存不包含队列。');
  }
  closeStoryQueue() {
    if (!this.queueSession) return;
    this.queueSession.panel.destroy(); this.queueSession = null;
    this.busy = false; this.layout.hidden = false; this.layout.inert = false; this.topTools.inert = false;
    this.render(); this.message('已返回工作室并暂停队列。已追加结果仍需应用并保存；关闭前请检查本地保存状态，并另行导出队列快照。');
  }
  isCurrentImport(operation) {
    return this.current() && this.importOperation === operation && !operation.controller.signal.aborted && this.generation === operation.generation;
  }
  finishDocumentImport(operation) {
    if (this.importOperation !== operation) return;
    operation.controller.abort(); this.importOperation = null;
    this.documentPreview?.destroy(); this.documentPreview = null;
    this.busy = false; this.layout.inert = false; this.layout.hidden = false; this.topTools.inert = false;
    this.cancelImportButton.hidden = true;
  }
  cancelDocumentImport(announce = true) {
    if (!this.importOperation) return;
    this.finishDocumentImport(this.importOperation);
    if (announce) this.message('已取消等待 / 放弃预览，原草稿未改变。已开始的后端解析仍可能运行至截止时间。');
  }
  previewDocument(file, result, operation) {
    const preview = createStoryDocumentPreview({ fileName: file.name, result,
      onCancel: () => this.cancelDocumentImport(),
      onConfirm: text => {
        if (!this.isCurrentImport(operation)) throw new Error('来源画布或草稿已改变，请放弃此次提取后重新导入。');
        const imported = appendDocumentToWorkspace(this.draft, file.name, text);
        this.change(draft => Object.assign(draft, imported.workspace)); this.episodeId = imported.episodeId;
        this.finishDocumentImport(operation); this.tab = 'script'; this.page = 0; this.render();
        this.message(`已追加 ${imported.count} 个单集草稿，原有单集保留。请检查后应用到项目并保存工程。`);
      },
    });
    this.documentPreview = preview; this.layout.hidden = true;
    this.dialog.insertBefore(preview.root, this.layout); preview.focus();
    this.message('提取完成，尚未写入草稿。请核对警告与文字，再确认追加；可随时放弃。');
  }
  async import(file) {
    if (this.busy || this.closed) return;
    let operation;
    try {
      this.flushField();
      if (!this.current()) throw new Error('来源节点已离开当前画布，请重新打开工作室。');
      operation = { controller: new AbortController(), generation: this.generation };
      this.importOperation = operation;
      this.busy = true; this.layout.inert = true; this.topTools.inert = true; this.cancelImportButton.hidden = false;
      if (isStoryDocumentFile(file)) {
        this.message('正在上传到当前 Canvas 后端并提取文字（不调用 AI/OCR）…');
        const result = await extractStoryDocument(file, { signal: operation.controller.signal });
        if (!this.isCurrentImport(operation)) throw new Error('来源画布或草稿已改变，提取结果未导入。');
        this.previewDocument(file, result, operation); return;
      }
      this.message('正在读取本地文件…');
      if (file.size > STORY_LIMITS.jsonBytes) throw new Error('JSON/TXT/MD 文件超过 4MB');
      const raw = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (!this.isCurrentImport(operation)) throw new Error('读取期间来源画布或草稿已改变，请重新导入。');
      if (/\.json$/i.test(file.name)) {
        const value = parseStoryWorkspaceJson(raw);
        if (!window.confirm('用该 JSON 替换当前工作室草稿？项目内容只有点击“应用到项目”后才会改变。')) return;
        this.change(draft => Object.assign(draft, value)); this.episodeId = this.draft.episodes[0]?.id || '';
      } else if (/\.(txt|md)$/i.test(file.name)) {
        const episode = createEpisode(file.name.replace(/\.[^.]+$/, '').slice(0, 300), raw.replace(/^\uFEFF/, ''));
        this.change(draft => draft.episodes.push(episode)); this.episodeId = episode.id;
      } else throw new Error('仅支持本版 JSON、UTF-8 TXT/MD、DOCX 和 PDF；旧版 DOC 请先另存为 DOCX。');
      this.tab = 'script'; this.page = 0; this.render(); this.message('已导入草稿，请检查后应用到项目。');
    } catch (error) {
      if (!this.closed && (!operation || this.importOperation === operation)) this.message('导入未完成：' + error.message);
    } finally {
      if (operation && this.importOperation === operation && !this.documentPreview) this.finishDocumentImport(operation);
    }
  }
  download(format) {
    this.flushField();
    let content, mime = 'text/plain;charset=utf-8';
    if (format === 'json') { content = JSON.stringify(normalizeStoryWorkspace(this.draft)); mime = 'application/json'; }
    else if (format === 'csv') { if (!this.episode()) throw new Error('请先选择单集'); content = storyEpisodeCsv(this.draft, this.episode()); mime = 'text/csv;charset=utf-8'; }
    else content = storyWorkspaceMarkdown(this.draft);
    const url = URL.createObjectURL(new Blob([content], { type: mime })), anchor = storyElement('a');
    anchor.href = url; anchor.download = `${(this.draft.title || 'story').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 80)}.${format}`;
    this.dialog.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    this.message('已导出当前草稿；导出不会替代项目保存。');
  }
  ownerUnmounted() {
    if (this.closed) return;
    this.cancelDocumentImport(false); this.closeStoryAi(); this.closeStoryQueue(); this.closeMediaBatch(); this.closeStoryClip();
    const focused = document.activeElement; if (focused && this.dialog.contains(focused)) focused.blur();
    if (!this.dirty && !this.aiQueue?.hasJobs() && !this.dialog.querySelector('[aria-invalid=true]')) { this.close(true); return; }
    this.detached = true; this.message('来源节点已卸载，草稿和队列保留在此窗口。请分别导出工作室 JSON 与队列快照后关闭；不会写入其他画布。');
  }
  close(force = false) {
    if (this.closed) return true;
    if (!force) {
      const focused = document.activeElement; if (focused && this.dialog.contains(focused)) focused.blur();
      let warning = this.aiSession ? '关闭将放弃未合并的 AI 结果和未应用的编辑；已发出的请求可能继续计费。确定关闭？' : '有未应用的编辑。确定放弃并关闭？可取消后应用或导出 JSON。';
      if (this.clipSession) warning += '\n关闭将放弃初剪入出点预览，不会启动渲染。';
      if (this.mediaSession) warning += '\n关闭只停止批次后续发送，不取消已调用的媒体任务，仍可能计费。结果/尝试记录需另存工程。';
      if (this.aiQueue?.hasJobs()) warning += '\n队列未提交到本地或未导出的状态/在途结果可能丢失。已发送请求仍可能计费。请先检查本地保存状态或导出快照；工程保存不包含队列。';
      if ((this.dirty || this.documentPreview || this.aiSession || this.mediaSession || this.clipSession || this.aiQueue?.hasJobs() || this.dialog.querySelector('[aria-invalid=true]')) && !window.confirm(warning)) return false;
    }
    this.cancelDocumentImport(false); this.closeStoryAi(); this.closeStoryQueue(); this.closeMediaBatch(); this.closeStoryClip();
    this.aiQueue?.dispose();
    if (this.queuePersistence) void this.queuePersistence.finish().catch(() => {
      if (this.aiQueue?.hasJobs() && window.confirm('队列本地保存失败，当前页面仍有内存记录。是否立即导出快照？刷新后可能无法找回；已发送请求可能计费。')) {
        try { downloadStoryQueueSnapshot(this.aiQueue.snapshot(), 'story-ai-queue-unsaved.json'); }
        catch (error) { window.alert('快照导出失败：' + error.message); }
      }
    });
    this.closed = true; this.abort.abort(); this.viewAbort?.abort(); this.dialog.close(); this.dialog.remove();
    if (activeEditor === this) activeEditor = null;
    if (this.previousFocus?.isConnected) this.previousFocus.focus(); return true;
  }
}
