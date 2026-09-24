import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { commit, undo, redo } from '../modules/history.js';
import { getLocale, onLocaleChange } from '../i18n/index.js';
import { saveOutputBlob } from '../modules/project.js';
import { calcSafeSpawnPosNearNode } from '../modules/nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import {
  MAX_LAYERS, MAX_POINTS, finite, newLayerId, normalizeWhiteboard,
  hitLayer, moveLayer, scaleLayer, updateShape,
} from '../modules/whiteboard/whiteboardModel.js';
import { svgElement, paintSvg, importWhiteboardImage, renderWhiteboardPng } from '../modules/whiteboard/whiteboardDrawing.js';

const LABELS = {
  select: ['选择/移动', 'Select / move'], pen: ['画笔', 'Pen'], eraser: ['删除图层', 'Erase layer'],
  rect: ['矩形', 'Rectangle'], ellipse: ['椭圆', 'Ellipse'], line: ['直线', 'Line'], arrow: ['箭头', 'Arrow'],
  text: ['文字', 'Text'], textHint: ['先输入文字，再点击白板放置', 'Enter text, then click the board'],
  image: ['导入图片', 'Import image'], color: ['颜色', 'Color'], width: ['笔宽', 'Stroke'],
  fontSize: ['字号', 'Font size'], fill: ['填充', 'Fill'], background: ['背景', 'Background'],
  transparent: ['透明', 'Transparent'], undo: ['撤销', 'Undo'], redo: ['重做', 'Redo'],
  front: ['置顶', 'Bring front'], back: ['置底', 'Send back'], smaller: ['缩小图层', 'Shrink layer'],
  larger: ['放大图层', 'Enlarge layer'], remove: ['删除选中', 'Delete selected'],
  clear: ['清空', 'Clear'], confirmClear: ['再次点击清空', 'Click again to clear'],
  png: ['导出 PNG', 'Export PNG'], toCanvas: ['生成图像节点', 'Create image node'],
  hint: ['拖动外侧标题移动节点；白板内绘图，空格/中键平移画布。', 'Drag the outer title to move. Space / middle button pans the canvas.'],
  imageLimit: ['仅支持 8MB 以内 PNG/JPEG/WebP 图片', 'Use a PNG/JPEG/WebP image under 8 MB'],
  limit: ['白板最多 500 个图层，请删除部分图层', 'Layer limit reached (500). Delete some layers first.'],
  error: ['操作失败，请重试', 'Operation failed. Please retry.'], working: ['处理中…', 'Working…'],
  exported: ['已生成 PNG 下载', 'PNG download created'], created: ['已保存并创建图像节点', 'Saved and created an image node'],
  layers: ['图层', 'Layers'], resize: ['拖动调整节点大小', 'Drag to resize node'],
};
function label(key) { return LABELS[key]?.[getLocale() === 'en-US' ? 1 : 0] || key; }
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function ensureStyles() {
  if (document.getElementById('whiteboard-node-styles')) return;
  const link = element('link'); link.id = 'whiteboard-node-styles'; link.rel = 'stylesheet';
  link.href = new URL('../../styles/whiteboard.css', import.meta.url).href;
  document.head.append(link);
}

export class WhiteboardNode {
  constructor(data) {
    this.id = data.id; this.data = data; this.board = normalizeWhiteboard(data.whiteboard);
    this.tool = 'pen'; this.ink = '#222222'; this.strokeWidth = 4; this.fontSize = 32;
    this.fill = false; this.selectedId = ''; this.gesture = null; this.busy = false;
    this.disposed = false; this.frame = 0; this.abort = new AbortController();
  }
  listen(target, event, handler, options = {}) {
    target.addEventListener(event, handler, { ...options, signal: this.abort.signal });
  }
  button(key, action) {
    const button = element('button', 'wb-button', label(key));
    button.type = 'button'; button.dataset.label = key; button.title = label(key);
    this.listen(button, 'click', () => { if (!this.disposed) action(); });
    return button;
  }
  control(key, input) {
    const wrapper = element('label', 'wb-control');
    const text = element('span', '', label(key)); text.dataset.label = key;
    input.setAttribute('aria-label', label(key)); input.dataset.ariaLabel = key;
    wrapper.append(text, input); return wrapper;
  }
  mount() {
    ensureStyles();
    this.el = element('div', 'v2-node-component wb-node');
    this.el.tabIndex = 0;
    const tools = element('div', 'wb-toolbar'); tools.setAttribute('role', 'toolbar');
    this.toolButtons = new Map();
    for (const key of ['select', 'pen', 'eraser', 'rect', 'ellipse', 'line', 'arrow', 'text']) {
      const button = this.button(key, () => {
        this.cancelGesture(); this.tool = key; this.confirmClear = false; this.syncControls(); this.el.focus({ preventScroll: true });
      });
      this.toolButtons.set(key, button); tools.append(button);
    }
    const settings = element('div', 'wb-toolbar');
    const ink = element('input'); ink.type = 'color'; ink.value = this.ink;
    this.listen(ink, 'input', () => { this.ink = ink.value; });
    const width = element('input'); width.type = 'number'; width.min = '1'; width.max = '64'; width.value = '4';
    this.listen(width, 'change', () => { this.strokeWidth = finite(width.value, 4, 1, 64); width.value = this.strokeWidth; });
    const font = element('input'); font.type = 'number'; font.min = '8'; font.max = '256'; font.value = '32';
    this.listen(font, 'change', () => { this.fontSize = finite(font.value, 32, 8, 256); font.value = this.fontSize; });
    const fill = element('input'); fill.type = 'checkbox';
    this.listen(fill, 'change', () => { this.fill = fill.checked; });
    this.backgroundInput = element('input'); this.backgroundInput.type = 'color'; this.backgroundInput.value = '#ffffff';
    this.listen(this.backgroundInput, 'change', () => this.replaceBoard({ ...this.board, background: this.backgroundInput.value }));
    this.transparentInput = element('input'); this.transparentInput.type = 'checkbox';
    this.listen(this.transparentInput, 'change', () => this.replaceBoard({ ...this.board, background: this.transparentInput.checked ? 'transparent' : this.backgroundInput.value }));
    settings.append(this.control('color', ink), this.control('width', width), this.control('fontSize', font),
      this.control('fill', fill), this.control('background', this.backgroundInput), this.control('transparent', this.transparentInput));
    this.textInput = element('input', 'wb-text-input'); this.textInput.type = 'text'; this.textInput.maxLength = 2000;
    this.textInput.placeholder = label('textHint'); this.textInput.setAttribute('aria-label', label('text'));
    this.listen(this.textInput, 'keydown', event => {
      if (event.key !== 'Enter' || event.isComposing) return;
      const selected = this.board.layers.find(layer => layer.id === this.selectedId && layer.type === 'text');
      if (selected && this.textInput.value.trim()) this.modifySelected(layer => ({ ...layer, text: this.textInput.value, fontSize: this.fontSize, color: this.ink }));
      this.tool = 'text'; this.syncControls(); event.preventDefault(); event.stopPropagation();
    });
    const actions = element('div', 'wb-toolbar');
    this.fileInput = element('input'); this.fileInput.type = 'file'; this.fileInput.accept = 'image/png,image/jpeg,image/webp'; this.fileInput.hidden = true;
    this.listen(this.fileInput, 'change', () => {
      const file = this.fileInput.files?.[0]; this.fileInput.value = '';
      if (file) void this.importImage(file);
    });
    actions.append(this.button('image', () => this.fileInput.click()),
      this.button('undo', () => { this.cancelGesture(); undo(); }), this.button('redo', () => { this.cancelGesture(); redo(); }),
      this.button('front', () => this.reorderSelected(true)), this.button('back', () => this.reorderSelected(false)),
      this.button('smaller', () => this.modifySelected(layer => scaleLayer(layer, 0.9))),
      this.button('larger', () => this.modifySelected(layer => scaleLayer(layer, 1.1))),
      this.button('remove', () => this.removeSelected()));
    this.clearButton = this.button('clear', () => {
      if (!this.board.layers.length) return;
      if (!this.confirmClear) { this.confirmClear = true; this.clearButton.textContent = label('confirmClear'); return; }
      this.selectedId = ''; this.replaceBoard({ ...this.board, layers: [] });
    });
    actions.append(this.clearButton, this.button('png', () => void this.exportImage(false)), this.button('toCanvas', () => void this.exportImage(true)));
    this.svg = svgElement('svg', { class: 'wb-surface', role: 'img', 'aria-label': label('textHint'), preserveAspectRatio: 'xMidYMid meet' });
    this.svg.style.touchAction = 'none';
    this.listen(this.svg, 'pointerdown', event => this.pointerDown(event));
    this.listen(this.svg, 'pointermove', event => this.pointerMove(event));
    this.listen(this.svg, 'pointerup', event => this.pointerUp(event));
    this.listen(this.svg, 'pointercancel', () => this.cancelGesture());
    this.listen(this.svg, 'lostpointercapture', () => this.cancelGesture());
    this.listen(this.svg, 'dblclick', event => event.stopPropagation());
    this.listen(this.svg, 'contextmenu', event => { event.preventDefault(); event.stopPropagation(); });
    this.listen(this.svg, 'dragover', event => { event.preventDefault(); event.stopPropagation(); });
    this.listen(this.svg, 'drop', event => {
      event.preventDefault(); event.stopPropagation(); const file = event.dataTransfer?.files?.[0];
      if (file) void this.importImage(file);
    });
    this.layerPicker = element('select', 'wb-layer-picker'); this.layerPicker.setAttribute('aria-label', label('layers'));
    this.listen(this.layerPicker, 'change', () => {
      this.selectedId = this.layerPicker.value; this.tool = 'select';
      const layer = this.board.layers.find(item => item.id === this.selectedId);
      if (layer?.type === 'text') this.textInput.value = layer.text;
      this.syncControls(); this.schedulePaint();
    });
    this.status = element('span', 'wb-status'); this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');
    const footer = element('div', 'wb-footer'); footer.append(this.layerPicker, this.status);
    const hint = element('div', 'wb-hint', label('hint')); hint.dataset.label = 'hint';
    const resize = element('div', 'wb-resizer v2-resize-move'); resize.title = label('resize');
    this.listen(resize, 'pointerdown', event => {
      if (event.button !== 0) return;
      this.cancelGesture();
      startNodeResizePreview({ event, nodeId: this.id,
        getNode: () => appStore.getStateRaw().nodes?.[this.id] || this.data,
        getViewport: () => appStore.getStateRaw().viewport,
        resolveSize: ({ startWidth, startHeight, dx, dy }) => ({ width: Math.max(480, startWidth + dx), height: Math.max(360, startHeight + dy) }),
        applyPatch: patch => { if (!this.disposed && appStore.getStateRaw().nodes?.[this.id]) appStore.updateNodeData(this.id, patch); }, commit,
      });
    });
    for (const area of [tools, settings, actions, this.textInput, footer]) {
      this.listen(area, 'pointerdown', event => { if (event.button === 0) event.stopPropagation(); });
      this.listen(area, 'dblclick', event => event.stopPropagation());
    }
    this.listen(this.el, 'keydown', event => this.keyDown(event));
    this.el.append(tools, settings, this.textInput, actions, this.svg, footer, hint, resize, this.fileInput);
    this.offLocale = onLocaleChange(() => {
      if (this.disposed) return;
      this.el.querySelectorAll('[data-label]').forEach(el => { el.textContent = label(el.dataset.label); el.title = label(el.dataset.label); });
      this.el.querySelectorAll('[data-aria-label]').forEach(el => el.setAttribute('aria-label', label(el.dataset.ariaLabel)));
      this.textInput.placeholder = label('textHint'); this.syncControls();
    });
    this.syncControls(); paintSvg(this.svg, this.board); return this.el;
  }
  point(event) {
    const matrix = this.svg.getScreenCTM();
    if (!matrix) return null;
    const point = this.svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: finite(local.x, 0, 0, this.board.width), y: finite(local.y, 0, 0, this.board.height) };
  }
  pointerDown(event) {
    if (event.button !== 0 || window._spaceHeld || this.busy || this.gesture) return;
    event.preventDefault(); event.stopPropagation(); this.el.focus({ preventScroll: true });
    if (!appStore.getStateRaw().selectedNodeIds?.includes(this.id)) appStore.setSelectedNodes([this.id]);
    const point = this.point(event); if (!point) return;
    const hit = hitLayer(this.board.layers, point);
    if (this.tool === 'eraser') {
      if (hit) { this.selectedId = hit.id; this.removeSelected(); } return;
    }
    if (this.tool === 'select') {
      this.selectedId = hit?.id || '';
      if (hit?.type === 'text') this.textInput.value = hit.text;
      if (hit) this.gesture = { pointerId: event.pointerId, kind: 'move', start: point, layer: hit, draft: this.board };
      this.syncControls(); this.schedulePaint();
    } else {
      if (this.board.layers.length >= MAX_LAYERS) { this.message('limit'); return; }
      const layer = { id: newLayerId(), type: this.tool, x: point.x, y: point.y,
        width: 1, height: 1, x2: point.x, y2: point.y, points: [[point.x, point.y]],
        color: this.ink, fill: this.fill ? this.ink : 'none', strokeWidth: this.strokeWidth,
        text: this.textInput.value, fontSize: this.fontSize };
      if (this.tool === 'text') {
        if (!layer.text.trim()) { this.textInput.focus(); this.message('textHint'); return; }
        this.selectedId = layer.id; this.replaceBoard({ ...this.board, layers: [...this.board.layers, layer] }); return;
      }
      this.selectedId = layer.id;
      this.gesture = { pointerId: event.pointerId, kind: 'draw', start: point, layer,
        draft: { ...this.board, layers: [...this.board.layers, layer] } };
      this.schedulePaint();
    }
    if (this.gesture) this.svg.setPointerCapture(event.pointerId);
  }
  pointerMove(event) {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const point = this.point(event); if (!point) return;
    if (gesture.kind === 'move') {
      const moved = moveLayer(gesture.layer, point.x - gesture.start.x, point.y - gesture.start.y);
      gesture.draft = { ...this.board, layers: this.board.layers.map(layer => layer.id === moved.id ? moved : layer) };
      gesture.changed = Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 0.5;
    } else {
      let layer = gesture.layer;
      if (layer.type === 'pen') {
        const last = layer.points[layer.points.length - 1];
        if (Math.hypot(point.x - last[0], point.y - last[1]) < 1) return;
        if (layer.points.length >= MAX_POINTS) return;
        layer = { ...layer, points: [...layer.points, [point.x, point.y]] };
      } else layer = updateShape(layer, gesture.start, point);
      gesture.layer = layer;
      gesture.draft = { ...this.board, layers: [...this.board.layers, layer] };
    }
    this.schedulePaint();
  }
  pointerUp(event) {
    if (!this.gesture || event.pointerId !== this.gesture.pointerId) return;
    this.pointerMove(event);
    const gesture = this.gesture; this.gesture = null;
    if (this.svg.hasPointerCapture(event.pointerId)) this.svg.releasePointerCapture(event.pointerId);
    if (gesture.kind === 'draw' || gesture.changed) this.replaceBoard(gesture.draft);
    else this.schedulePaint();
    event.stopPropagation();
  }
  cancelGesture() {
    const gesture = this.gesture; this.gesture = null;
    if (gesture && this.svg?.hasPointerCapture(gesture.pointerId)) this.svg.releasePointerCapture(gesture.pointerId);
    if (!this.disposed) this.schedulePaint();
  }
  replaceBoard(board) {
    if (this.disposed || !appStore.getStateRaw().nodes?.[this.id]) return;
    this.cancelGesture(); this.confirmClear = false;
    this.board = normalizeWhiteboard(board);
    // One immutable snapshot per completed operation, never one commit per mouse move.
    appStore.updateNodeData(this.id, { whiteboard: this.board });
    this.data = appStore.getStateRaw().nodes[this.id];
    commit(); this.syncControls(); this.schedulePaint();
  }
  modifySelected(transform) {
    if (!this.board.layers.some(layer => layer.id === this.selectedId)) return;
    this.replaceBoard({ ...this.board, layers: this.board.layers.map(layer => layer.id === this.selectedId ? transform(layer) : layer) });
  }
  removeSelected() {
    const id = this.selectedId;
    if (!this.board.layers.some(layer => layer.id === id)) return;
    this.selectedId = ''; this.replaceBoard({ ...this.board, layers: this.board.layers.filter(layer => layer.id !== id) });
  }
  reorderSelected(front) {
    const layer = this.board.layers.find(item => item.id === this.selectedId); if (!layer) return;
    const rest = this.board.layers.filter(item => item.id !== layer.id);
    this.replaceBoard({ ...this.board, layers: front ? [...rest, layer] : [layer, ...rest] });
  }
  keyDown(event) {
    if (event.isComposing) return;
    const key = event.key.toLowerCase(), command = event.ctrlKey || event.metaKey;
    if (command && key === 's') return; // Preserve the application's Save shortcut.
    if (event.target.matches('input, textarea, select')) { event.stopPropagation(); return; }
    if (command && (key === 'z' || key === 'y')) {
      event.preventDefault(); event.stopPropagation(); this.cancelGesture();
      if (key === 'y' || event.shiftKey) redo(); else undo(); return;
    }
    if (key === 'delete' || key === 'backspace' || key === 'd') { event.preventDefault(); event.stopPropagation(); this.removeSelected(); return; }
    if (key === 'escape') { event.preventDefault(); event.stopPropagation(); this.cancelGesture(); this.selectedId = ''; this.tool = 'select'; this.syncControls(); this.schedulePaint(); return; }
    if (event.key !== ' ' && !command) event.stopPropagation();
  }
  schedulePaint() {
    if (this.frame || this.disposed || !this.svg) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0; if (!this.disposed) paintSvg(this.svg, this.gesture?.draft || this.board, this.selectedId);
    });
  }
  syncControls() {
    if (!this.el || this.disposed) return;
    for (const [tool, button] of this.toolButtons) button.setAttribute('aria-pressed', String(tool === this.tool));
    this.svg.dataset.tool = this.tool;
    if (this.board.background !== 'transparent') this.backgroundInput.value = this.board.background;
    this.transparentInput.checked = this.board.background === 'transparent';
    this.backgroundInput.disabled = this.transparentInput.checked;
    if (this.clearButton) this.clearButton.textContent = label(this.confirmClear ? 'confirmClear' : 'clear');
    const fragment = document.createDocumentFragment();
    const empty = element('option', '', `${label('layers')} (${this.board.layers.length})`); empty.value = ''; fragment.append(empty);
    for (let i = this.board.layers.length - 1; i >= 0; i--) {
      const layer = this.board.layers[i], option = element('option', '', `${i + 1}. ${layer.type === 'text' ? layer.text.slice(0, 24) : label(layer.type)}`);
      option.value = layer.id; fragment.append(option);
    }
    this.layerPicker.replaceChildren(fragment); this.layerPicker.value = this.selectedId;
    this.el.querySelectorAll('button').forEach(button => { button.disabled = this.busy; });
    for (const key of ['front', 'back', 'smaller', 'larger', 'remove']) {
      const button = this.el.querySelector(`button[data-label="${key}"]`);
      if (button) button.disabled = this.busy || !this.board.layers.some(layer => layer.id === this.selectedId);
    }
  }
  message(key, detail = '') {
    if (!this.disposed && this.status) this.status.textContent = label(key) + (detail ? `: ${detail}` : '');
  }
  async importImage(file) {
    if (this.busy || this.disposed) return;
    if (this.board.layers.length >= MAX_LAYERS) { this.message('limit'); return; }
    this.cancelGesture(); this.busy = true; this.message('working'); this.syncControls();
    try {
      const image = await importWhiteboardImage(file);
      if (this.disposed || !appStore.getStateRaw().nodes?.[this.id]) return;
      const scale = Math.min(1, this.board.width * 0.8 / image.width, this.board.height * 0.8 / image.height);
      const width = image.width * scale, height = image.height * scale;
      const layer = { id: newLayerId(), type: 'image', src: image.src, x: (this.board.width - width) / 2,
        y: (this.board.height - height) / 2, width, height };
      this.selectedId = layer.id; this.tool = 'select';
      this.replaceBoard({ ...this.board, layers: [...this.board.layers, layer] }); this.status.textContent = '';
    } catch (error) { this.message(error?.message === 'IMAGE_LIMIT' ? 'imageLimit' : 'error'); }
    finally { this.busy = false; this.syncControls(); }
  }
  async exportImage(toCanvas) {
    if (this.busy || this.disposed) return;
    this.cancelGesture(); this.busy = true; this.message('working'); this.syncControls();
    const board = this.board;
    try {
      const blob = await renderWhiteboardPng(board);
      if (this.disposed) return;
      const fileName = `whiteboard-${Date.now()}.png`;
      if (!toCanvas) {
        const url = URL.createObjectURL(blob), anchor = element('a');
        anchor.href = url; anchor.download = fileName; document.body.append(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000); this.message('exported'); return;
      }
      const saved = await saveOutputBlob(new File([blob], fileName, { type: 'image/png' }), { ext: 'png' });
      if (this.disposed) return;
      const current = appStore.getStateRaw().nodes?.[this.id]; if (!current) return;
      const localPath = String(saved.localPath || saved.path || '').replace(/^\//, '');
      const src = String(saved.url || '').trim() || (localPath ? `/${localPath}` : '');
      if (!src) throw new Error('Output path missing');
      const size = getAutoMediaSizeByShortSide(board.width, board.height);
      const position = calcSafeSpawnPosNearNode(appStore.getStateRaw().nodes, current, size.width, size.height);
      const id = generateId('node');
      appStore.addNode(buildSourceMediaNodePayload({ id, type: 'source-image', ...position, ...size,
        naturalWidth: board.width, naturalHeight: board.height, src, localPath,
        fileName: saved.filename || fileName, name: `${current.name || 'Whiteboard'} PNG`, needsAutoResize: false }));
      appStore.setSelectedNodes([id]); commit(); this.message('created');
    } catch (error) { console.error('[WhiteboardNode] export failed', error); this.message('error'); }
    finally { this.busy = false; this.syncControls(); }
  }
  update(data) {
    const changed = data.whiteboard !== this.data.whiteboard;
    this.data = data;
    if (changed) { this.cancelGesture(); this.board = normalizeWhiteboard(data.whiteboard); }
    if (!this.board.layers.some(layer => layer.id === this.selectedId)) this.selectedId = '';
    this.syncControls(); this.schedulePaint();
  }
  unmount() {
    this.disposed = true; this.cancelGesture(); this.abort.abort(); this.offLocale?.();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}
