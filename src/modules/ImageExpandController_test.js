import appStore from '../core/stores/appStore.js';
import { worldToScreen, generateId } from '../core/math.js';
import { getDisplayModelName } from './providers.js';
import {
  IMAGE_MODELS,
  getModelDisplayName,
  getModelProvider,
  getProviderIconHtml,
} from '../config/modelConfig.js';
import { generateImage } from '../../api/aiImageApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const ImageExpandController = {
  active: false,
  nodeId: null,
  nodeData: null,
  ratioStr: 'original',
  imageSize: '1K',
  model: null,
  provider: null,
  overlayEl: null,
  frameEl: null,
  frameRect: null,
  _pointerState: null,
  imgEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  sizeMenuEl: null,
  modelMenuEl: null,
  _unsubscribe: null,
  _view: null,
  cleanup: null,
  init(value) {
    if (this.active) return;
    const viewport = appStore.getStateRaw(),
      node = viewport.nodes?.[value];
    if (!node) return;
    ((this.active = true),
      (this.nodeId = value),
      (this.nodeData = node),
      (this._view = { viewport: viewport.viewport, node: node }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const item = Object.keys(IMAGE_MODELS)[0],
      key = IMAGE_MODELS[item].models[0];
    ((this.model = key.id),
      (this.provider = item),
      this._createUI(),
      this._bindEvents(),
      (this._unsubscribe = appStore.subscribeSelector(
        (index) => {
          const nx = index.nodes?.[value],
            vx = index.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!nx,
            vx: vx.x,
            vy: vx.y,
            vz: vx.zoom || 1,
            nx: nx ? nx.x : 0,
            ny: nx ? nx.y : 0,
            nw: nx ? nx.width : 0,
            nh: nx ? nx.height : 0,
          };
        },
        (x2) => {
          if (!x2?.hasNode) return;
          const node2 = appStore.getStateRaw().nodes?.[value];
          if (!node2) return;
          ((this.nodeData = node2),
            (this._view = {
              viewport: { x: x2.vx, y: x2.vy, zoom: x2.vz },
              node: node2,
            }),
            this._updateView(this._view));
        },
      )),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    const run = () => {
      this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0
        ? (this._updateView(this._view),
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          }))
        : requestAnimationFrame(run);
    };
    run();
  },
  _getImageUrl() {
    const result = this.nodeData || {};
    return localPathToUrl(result.localPath) || result.src || result.imageUrl || result.sourceUrl;
  },
  _createExpandedImage(data, x3) {
    return new Promise((handler, handler2) => {
      const image = new Image();
      ((image.crossOrigin = 'anonymous'),
        (image.onload = async () => {
          try {
            const box = document.createElement('canvas'),
              ctx = box.getContext('2d'),
              options = image.naturalWidth,
              target = image.naturalHeight,
              box2 = data,
              box3 = {
                x: x3.x || 0,
                y: x3.y || 0,
                w: x3.width || 1,
                h: x3.height || 1,
              },
              source = options / box3.w,
              next = target / box3.h,
              current = Math.round(box2.w * source),
              entry = Math.round(box2.h * next);
            ((box.width = current),
              (box.height = entry),
              (ctx.fillStyle = '#000'),
              ctx.fillRect(0, 0, current, entry));
            const record = Math.round((box3.x - box2.x) * source),
              payload = Math.round((box3.y - box2.y) * next);
            (ctx.drawImage(image, record, payload, options, target),
              box.toBlob((handle) => {
                if (handle) {
                  const state = URL.createObjectURL(handle);
                  handler(state);
                } else handler2(new Error('无法创建扩展图像'));
              }, 'image/png'));
          } catch (config) {
            handler2(config);
          }
        }),
        (image.onerror = () => {
          handler2(new Error('无法加载原始图像'));
        }));
      const url = localPathToUrl(x3.localPath) || x3.src || x3.imageUrl || x3.sourceUrl;
      image.src = url;
    });
  },
  _parseRatio() {
    if (this.ratioStr === 'original') return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const list = this.ratioStr.split(':').map((item2) => Number(item2));
    if (list.length !== 2 || !list[0] || !list[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return list[0] / list[1];
  },
  _calcFrameWorldRect() {
    const box4 = this.nodeData,
      scope = box4.width || 1,
      input = box4.height || 1,
      x4 = box4.x + scope / 2,
      y2 = box4.y + input / 2,
      output = scope / input,
      value2 = this._parseRatio();
    let value3, value4;
    value2 >= output
      ? ((value4 = input), (value3 = input * value2))
      : ((value3 = scope), (value4 = scope / value2));
    const value5 = 1.35,
      w = Math.max(scope, value3) * value5,
      h = Math.max(input, value4) * value5;
    return { x: x4 - w / 2, y: y2 - h / 2, w: w, h: h };
  },
  _getNodeWorldRect() {
    const x5 = this.nodeData || {},
      w2 = x5.width || 1,
      h2 = x5.height || 1;
    return { x: x5.x || 0, y: x5.y || 0, w: w2, h: h2 };
  },
  _clampFrameRect(box5) {
    const box6 = this._getNodeWorldRect(),
      handler3 = (value6, value7, value8) => Math.min(value8, Math.max(value7, value6)),
      box7 = {
        x: Number(box5?.x) || 0,
        y: Number(box5?.y) || 0,
        w: Number(box5?.w) || 1,
        h: Number(box5?.h) || 1,
      },
      value9 = Math.max(box6.w, 24),
      value10 = Math.max(box6.h, 24);
    ((box7.w = Math.max(box7.w, value9)), (box7.h = Math.max(box7.h, value10)));
    if (this.ratioStr !== 'original') {
      const value11 = this._parseRatio(),
        value12 = box7.x + box7.w / 2,
        value13 = box7.y + box7.h / 2;
      let value14 = box7.w,
        value15 = box7.h;
      (value14 / value15 > value11 ? (value15 = value14 / value11) : (value14 = value15 * value11),
        value14 < value9 && ((value14 = value9), (value15 = value14 / value11)),
        value15 < value10 && ((value15 = value10), (value14 = value15 * value11)),
        (box7.w = value14),
        (box7.h = value15),
        (box7.x = value12 - box7.w / 2),
        (box7.y = value13 - box7.h / 2));
    }
    const value16 = box6.x + box6.w - box7.w,
      value17 = box6.x,
      value18 = box6.y + box6.h - box7.h,
      value19 = box6.y;
    return (
      (box7.x = handler3(box7.x, value16, value17)),
      (box7.y = handler3(box7.y, value18, value19)),
      box7
    );
  },
  _createUI() {
    const el = document.createElement('div');
    el.className = 'v2-expand-overlay';
    const el2 = document.createElement('div');
    ((el2.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((item3) => {
        const el3 = document.createElement('div');
        ((el3.className = 'v2-expand-handle ' + item3), (el3.dataset.handle = item3), el2.appendChild(el3));
      }));
    const value20 = document.createElement('img');
    ((value20.className = 'v2-expand-img'),
      (value20.draggable = false),
      (value20.src = this._getImageUrl()),
      el.appendChild(el2),
      el.appendChild(value20),
      document.body.appendChild(el),
      (this.overlayEl = el),
      (this.frameEl = el2),
      (this.imgEl = value20),
      (this.frameRect = this._calcFrameWorldRect()));
    const el4 = document.createElement('div');
    el4.className = 'v2-expand-toolbar';
    const value21 = this.ratioStr === 'original' ? '比例' : this.ratioStr,
      modelDisplayName = getModelDisplayName(this.model);
    let value22 = '';
    (Object.entries(IMAGE_MODELS).forEach(([value23, error]) => {
      const value24 = error.isTextIcon
        ? '<div style="width:20px;height:20px;border-radius:3px;background:var(--bg-node);color:var(--text-primary);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          error.icon +
          '</div>'
        : '<img src="' +
          error.icon +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          value23 +
          '">';
      let value25 = '';
      (error.models.forEach((error2) => {
        const value26 = error2.icon || error.icon,
          value27 = this.model === error2.id ? 'active' : '';
        value25 +=
          '\n          <div class="floating-menu-item ' +
          value27 +
          '" data-value="' +
          error2.id +
          '" data-provider="' +
          value23 +
          '" style="display:flex;align-items:center;gap:8px;">\n            <img src="' +
          value26 +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          value23 +
          '">\n            <div class="fmi-content">\n              <div class="fmi-title">' +
          error2.name +
          '</div>\n              <div class="fmi-sub">' +
          error2.description +
          '</div>\n            </div>\n          </div>';
      }),
        (value22 +=
          '\n        <div class="' +
          value23 +
          '-group-header floating-menu-item" data-' +
          value23 +
          '-toggle style="display:flex;align-items:center;gap:8px;cursor:var(--link-cursor);">\n          ' +
          value24 +
          '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
          error.name +
          '</div>\n            <div class="fmi-sub">' +
          error.description +
          '</div>\n          </div>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0;"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
          value23 +
          '-submenu" style="position:absolute;left:calc(100% + 6px);top:0;z-index:1001;width:max-content;max-width:320px;background:var(--bg-2);border:1px solid var(--stroke-08);border-radius:14px;padding:8px;box-shadow:var(--shadow-popover);display:none;flex-direction:column;">\n          ' +
          value25 +
          '\n        </div>'));
    }),
      (el4.innerHTML =
        '\n      <button class="v2-expand-toolbar-btn exit" title="退出 (Esc)">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      <div class="v2-expand-divider"></div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn ratio-toggle">\n          <span class="ratio-text">' +
        value21 +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu ratio-menu">\n          <div class="v2-expand-menu-item active" data-type="ratio" data-value="original">原图比例</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="21:9">21:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="16:9">16:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="9:16">9:16</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="4:3">4:3</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="3:4">3:4</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="1:1">1:1</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn size-toggle">\n          <span class="size-text">' +
        this.imageSize +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu size-menu">\n          <div class="v2-expand-menu-item active" data-type="size" data-value="1K">1K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="2K">2K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="4K">4K</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="model-text">' +
        modelDisplayName +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
        value22 +
        '\n        </div>\n      </div>\n      <button class="v2-expand-toolbar-btn go" title="生成扩图">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '),
      document.body.appendChild(el4),
      (this.toolbarEl = el4),
      (this.ratioMenuEl = el4.querySelector('.ratio-menu')),
      (this.sizeMenuEl = el4.querySelector('.size-menu')),
      (this.modelMenuEl = el4.querySelector('.model-menu')),
      this._updateView(this._view));
  },
  _updateView(value28 = this._view) {
    if (!this.active) return;
    const box8 = value28?.node,
      box9 = value28?.viewport;
    if (!box8) return;
    this.nodeData = box8;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const box10 = this.frameRect,
      box11 = worldToScreen(box10.x, box10.y, box9),
      value29 = Math.round(box10.w * box9.zoom),
      value30 = Math.round(box10.h * box9.zoom);
    ((this.frameEl.style.left = Math.round(box11.x) + 'px'),
      (this.frameEl.style.top = Math.round(box11.y) + 'px'),
      (this.frameEl.style.width = value29 + 'px'),
      (this.frameEl.style.height = value30 + 'px'));
    const box12 = worldToScreen(box8.x, box8.y, box9),
      value31 = Math.round(box8.width * box9.zoom),
      value32 = Math.round(box8.height * box9.zoom);
    ((this.imgEl.style.left = Math.round(box12.x) + 'px'),
      (this.imgEl.style.top = Math.round(box12.y) + 'px'),
      (this.imgEl.style.width = value31 + 'px'),
      (this.imgEl.style.height = value32 + 'px'));
    if (this.toolbarEl) {
      const value33 = box12.y + value32 + 14;
      ((this.toolbarEl.style.top = value33 + 'px'),
        (this.toolbarEl.style.left = box12.x + value31 / 2 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'),
        (this.toolbarEl.style.bottom = 'auto'));
    }
  },
  _bindEvents() {
    const value34 = () => this._updateView(this._view);
    window.addEventListener('resize', value34);
    const value35 = (event) => {
      if (event.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', value35);
    const value36 = (event2) => event2.stopPropagation();
    this.overlayEl.addEventListener('wheel', value36, { passive: false });
    const run2 = () => {
      (this.ratioMenuEl?.classList.remove('open'),
        this.sizeMenuEl?.classList.remove('open'),
        this.modelMenuEl?.classList.remove('show'),
        Object.keys(IMAGE_MODELS).forEach((item4) => {
          const el5 = this.modelMenuEl?.querySelector('.' + item4 + '-submenu');
          if (el5) el5.style.display = 'none';
        }));
    };
    this.toolbarEl.querySelector('.exit').onclick = () => this.exit();
    const value37 = this.toolbarEl.querySelector('.ratio-toggle');
    value37.onclick = (event3) => {
      event3.stopPropagation();
      const value38 = this.ratioMenuEl.classList.toggle('open');
      value38 && (this.sizeMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const value39 = this.toolbarEl.querySelector('.size-toggle');
    value39.onclick = (event4) => {
      event4.stopPropagation();
      const value40 = this.sizeMenuEl.classList.toggle('open');
      value40 && (this.ratioMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const value41 = (event5) => {
      const el6 = event5.target.closest('.v2-expand-menu-item');
      if (!el6) return;
      const value42 = el6.dataset.type;
      if (value42 === 'ratio') {
        ((this.ratioStr = el6.dataset.value),
          this.ratioMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((el7) => el7.classList.toggle('active', el7 === el6)),
          (this.toolbarEl.querySelector('.ratio-text').textContent =
            this.ratioStr === 'original' ? '比例' : this.ratioStr),
          this.ratioMenuEl.classList.remove('open'),
          (this.frameRect = this._calcFrameWorldRect()),
          this._updateView(this._view));
        return;
      }
      if (value42 === 'size') {
        ((this.imageSize = el6.dataset.value),
          this.sizeMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((el8) => el8.classList.toggle('active', el8 === el6)),
          (this.toolbarEl.querySelector('.size-text').textContent = this.imageSize),
          this.sizeMenuEl.classList.remove('open'));
        return;
      }
      if (value42 === 'model') {
        ((this.model = el6.dataset.value),
          (this.provider = el6.dataset.provider || getModelProvider(this.model)),
          this.modelMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((el9) => el9.classList.toggle('active', el9 === el6)),
          (this.toolbarEl.querySelector('.model-text').textContent = getModelDisplayName(this.model)),
          this.modelMenuEl.classList.remove('open'));
        return;
      }
    };
    ((this.ratioMenuEl.onclick = value41),
      (this.sizeMenuEl.onclick = value41),
      (this.modelMenuEl.onclick = value41));
    const el10 = this.toolbarEl.querySelector('.model-toggle'),
      el11 = this.modelMenuEl,
      el12 = this.toolbarEl.querySelector('.model-text');
    el10 &&
      el11 &&
      el12 &&
      (el10.addEventListener('click', (event6) => {
        (event6.stopPropagation(),
          el11.classList.toggle('show'),
          this.ratioMenuEl.classList.remove('open'),
          this.sizeMenuEl.classList.remove('open'));
      }),
      Object.keys(IMAGE_MODELS).forEach((item5) => {
        const el13 = el11.querySelector('[data-' + item5 + '-toggle]'),
          el14 = el11.querySelector('.' + item5 + '-submenu');
        if (!el13 || !el14) return;
        let setTimeout2 = null;
        const value43 = () => {
            (clearTimeout(setTimeout2), (el14.style.display = 'flex'));
          },
          handler4 = (value44 = 120) => {
            setTimeout2 = setTimeout(() => {
              el14.style.display = 'none';
            }, value44);
          };
        (el13.addEventListener('mouseenter', value43),
          el13.addEventListener('mouseleave', () => handler4()),
          el14.addEventListener('mouseenter', value43),
          el14.addEventListener('mouseleave', () => handler4()),
          el14.querySelectorAll('.floating-menu-item').forEach((el15) => {
            el15.addEventListener('click', () => {
              const model = el15.dataset.value,
                provider = el15.dataset.provider || item5,
                el16 = el15.querySelector('.fmi-title');
              ((el12.textContent = el16 ? el16.textContent : getModelDisplayName(model)),
                (this.model = model),
                (this.provider = provider),
                appStore.updateNodeData(this.nodeId, { model: model, provider: provider }),
                el11
                  .querySelectorAll('.floating-menu-item')
                  .forEach((el17) => el17.classList.remove('active')),
                el15.classList.add('active'),
                el11.classList.remove('show'),
                (el14.style.display = 'none'));
            });
          }));
      }));
    this.toolbarEl.querySelector('.go').onclick = async () => {
      try {
        window.showToast?.('正在生成扩图...', 'loading');
        const value45 = appStore.getStateRaw(),
          box13 = value45.nodes?.[this.nodeId];
        if (!box13) return;
        const value46 = { ...this.frameRect };
        let width, height;
        const value47 =
            this.ratioStr === 'original'
              ? box13.width / box13.height
              : parseInt(this.ratioStr.split(':')[0]) / parseInt(this.ratioStr.split(':')[1]),
          box14 = getAutoMediaSizeByShortSide(value47, 1);
        ((width = box14.width), (height = box14.height));
        const { x: x6, y: y3 } = calcSafeSpawnPosNearNode(value45.nodes, box13, width, height),
          id = generateId('source-image-expand');
        (appStore.addNode(
          buildSourceMediaNodePayload({
            id: id,
            type: 'source-image',
            x: x6,
            y: y3,
            width: width,
            height: height,
            name: '扩图生成中...',
            src: '',
            isGenerating: true,
            outputText:
              '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
          }),
        ),
          appStore.setSelectedNodes([id]));
        typeof window.v2FocusOnNodes === 'function'
          ? window.v2FocusOnNodes([box13.id, id])
          : window.v2FocusOnNode?.(id);
        const value48 = { ...box13 };
        this.exit();
        const value49 = await this._createExpandedImage(value46, value48),
          value50 = {
            prompt: '保持现有主体不变，填充黑色区域',
            model: this.model,
            provider: this.provider,
            aspectRatio: this.ratioStr === 'original' ? '自适应' : this.ratioStr,
            imageSize: this.imageSize,
            inputUrls: [value49],
            batchSize: 1,
          },
          imageUrl = await generateImage(value50);
        URL.revokeObjectURL(value49);
        if (imageUrl.error) {
          (appStore.updateNodeData(id, {
            isGenerating: false,
            name: '扩图生成失败',
            outputText:
              '模型: ' +
              getDisplayModelName(this.model) +
              '\n提示词: 保持现有主体不变，填充黑色区域\n错误: ' +
              imageUrl.error,
          }),
            window.showToast?.('扩图失败: ' + imageUrl.error, 'error'));
          return;
        }
        (appStore.updateNodeData(id, {
          isGenerating: false,
          name: '扩图结果',
          imageUrl: imageUrl.imageUrl,
          sourceUrl: imageUrl.sourceUrl,
          thumbUrl: imageUrl.thumbUrl,
          sourceId: imageUrl.sourceId,
          thumbId: imageUrl.thumbId,
          localPath: imageUrl.localPath,
          outputText: '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
        }),
          window.showToast?.('扩图生成成功', 'success'));
      } catch (error3) {
        (console.error('扩图生成失败:', error3),
          window.showToast?.('扩图生成失败: ' + (error3.message || '未知错误'), 'error'));
      }
    };
    const value51 = (event7) => {
      if (!this.toolbarEl.contains(event7.target)) run2();
    };
    document.addEventListener('pointerdown', value51, true);
    const run3 = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', value52, true),
          window.removeEventListener('pointerup', value53, true),
          window.removeEventListener('pointercancel', value53, true),
          (this._pointerState = null));
      },
      handler5 = () => this.ratioStr !== 'original',
      value52 = (event8) => {
        const event9 = this._pointerState;
        if (!event9 || event8.pointerId !== event9.pointerId) return;
        event8.preventDefault();
        const value54 = event9.zoom || this._view?.viewport?.zoom || 1,
          value55 = (event8.clientX - event9.startX) / value54,
          value56 = (event8.clientY - event9.startY) / value54,
          box15 = this._getNodeWorldRect(),
          handler6 = (value57, value58, value59) => Math.min(value59, Math.max(value58, value57));
        if (event9.mode === 'drag') {
          const w3 = event9.startRect.w,
            h3 = event9.startRect.h;
          let x7 = event9.startRect.x + value55,
            y4 = event9.startRect.y + value56;
          ((x7 = handler6(x7, box15.x + box15.w - w3, box15.x)),
            (y4 = handler6(y4, box15.y + box15.h - h3, box15.y)),
            (this.frameRect = { x: x7, y: y4, w: w3, h: h3 }),
            this._updateView(this._view));
          return;
        }
        const value60 = event9.handle,
          value61 = Math.max(box15.w, 24),
          value62 = Math.max(box15.h, 24),
          handler7 = (args) => {
            const box16 = { ...args },
              value63 = box15.x + box15.w - box16.w,
              value64 = box15.x,
              value65 = box15.y + box15.h - box16.h,
              value66 = box15.y;
            return (
              (box16.x = handler6(box16.x, value63, value64)),
              (box16.y = handler6(box16.y, value65, value66)),
              box16
            );
          },
          handler8 = (args2, value67) => {
            const box17 = { ...args2 };
            if (box17.w < value61) box17.w = value61;
            if (box17.h < value62) box17.h = value62;
            if (value67 === 'tl')
              ((box17.x = event9.startRect.x + event9.startRect.w - box17.w),
                (box17.y = event9.startRect.y + event9.startRect.h - box17.h));
            else {
              if (value67 === 'tr')
                ((box17.x = event9.startRect.x),
                  (box17.y = event9.startRect.y + event9.startRect.h - box17.h));
              else {
                if (value67 === 'bl')
                  ((box17.x = event9.startRect.x + event9.startRect.w - box17.w),
                    (box17.y = event9.startRect.y));
                else {
                  if (value67 === 'br') ((box17.x = event9.startRect.x), (box17.y = event9.startRect.y));
                  else {
                    if (value67 === 'lm')
                      ((box17.x = event9.startRect.x + event9.startRect.w - box17.w),
                        (box17.y = event9.startRect.y));
                    else {
                      if (value67 === 'rm') ((box17.x = event9.startRect.x), (box17.y = event9.startRect.y));
                      else {
                        if (value67 === 'tm')
                          ((box17.x = event9.startRect.x),
                            (box17.y = event9.startRect.y + event9.startRect.h - box17.h));
                        else
                          value67 === 'bm' &&
                            ((box17.x = event9.startRect.x), (box17.y = event9.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return box17;
          };
        if (!handler5()) {
          let box18 = { ...event9.startRect };
          if (value60 === 'tl')
            ((box18.x = event9.startRect.x + value55),
              (box18.y = event9.startRect.y + value56),
              (box18.w = event9.startRect.w - value55),
              (box18.h = event9.startRect.h - value56),
              (box18 = handler8(box18, 'tl')));
          else {
            if (value60 === 'tr')
              ((box18.y = event9.startRect.y + value56),
                (box18.w = event9.startRect.w + value55),
                (box18.h = event9.startRect.h - value56),
                (box18 = handler8(box18, 'tr')));
            else {
              if (value60 === 'bl')
                ((box18.x = event9.startRect.x + value55),
                  (box18.w = event9.startRect.w - value55),
                  (box18.h = event9.startRect.h + value56),
                  (box18 = handler8(box18, 'bl')));
              else {
                if (value60 === 'br')
                  ((box18.w = event9.startRect.w + value55),
                    (box18.h = event9.startRect.h + value56),
                    (box18 = handler8(box18, 'br')));
                else {
                  if (value60 === 'tm')
                    ((box18.y = event9.startRect.y + value56),
                      (box18.h = event9.startRect.h - value56),
                      (box18 = handler8(box18, 'tm')));
                  else {
                    if (value60 === 'bm')
                      ((box18.h = event9.startRect.h + value56), (box18 = handler8(box18, 'bm')));
                    else {
                      if (value60 === 'lm')
                        ((box18.x = event9.startRect.x + value55),
                          (box18.w = event9.startRect.w - value55),
                          (box18 = handler8(box18, 'lm')));
                      else
                        value60 === 'rm' &&
                          ((box18.w = event9.startRect.w + value55), (box18 = handler8(box18, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = handler7(box18)), this._updateView(this._view));
          return;
        }
        const value68 = this._parseRatio(),
          value69 = event9.startRect.x + event9.startRect.w / 2,
          value70 = event9.startRect.y + event9.startRect.h / 2;
        let box19 = { ...event9.startRect };
        if (value60 === 'lm' || value60 === 'rm') {
          let value71 = event9.startRect.w + (value60 === 'rm' ? value55 : -value55);
          value71 = Math.max(value71, value61);
          let value72 = value71 / value68;
          (value72 < value62 && ((value72 = value62), (value71 = value72 * value68)),
            (box19.w = value71),
            (box19.h = value72),
            (box19.x =
              value60 === 'rm' ? event9.startRect.x : event9.startRect.x + event9.startRect.w - box19.w),
            (box19.y = value70 - box19.h / 2));
        } else {
          if (value60 === 'tm' || value60 === 'bm') {
            let value73 = event9.startRect.h + (value60 === 'bm' ? value56 : -value56);
            value73 = Math.max(value73, value62);
            let value74 = value73 * value68;
            (value74 < value61 && ((value74 = value61), (value73 = value74 / value68)),
              (box19.w = value74),
              (box19.h = value73),
              (box19.y =
                value60 === 'bm' ? event9.startRect.y : event9.startRect.y + event9.startRect.h - box19.h),
              (box19.x = value69 - box19.w / 2));
          } else {
            const value75 = value60 === 'tr' || value60 === 'br' ? 1 : -1,
              value76 = value60 === 'bl' || value60 === 'br' ? 1 : -1;
            let value77 = event9.startRect.w + value55 * value75,
              value78 = event9.startRect.h + value56 * value76;
            ((value77 = Math.max(value77, 1)), (value78 = Math.max(value78, 1)));
            value77 / value78 > value68 ? (value78 = value77 / value68) : (value77 = value78 * value68);
            value77 < value61 && ((value77 = value61), (value78 = value77 / value68));
            value78 < value62 && ((value78 = value62), (value77 = value78 * value68));
            ((box19.w = value77), (box19.h = value78));
            if (value60 === 'br') ((box19.x = event9.startRect.x), (box19.y = event9.startRect.y));
            else {
              if (value60 === 'bl')
                ((box19.x = event9.startRect.x + event9.startRect.w - box19.w),
                  (box19.y = event9.startRect.y));
              else
                value60 === 'tr'
                  ? ((box19.x = event9.startRect.x),
                    (box19.y = event9.startRect.y + event9.startRect.h - box19.h))
                  : ((box19.x = event9.startRect.x + event9.startRect.w - box19.w),
                    (box19.y = event9.startRect.y + event9.startRect.h - box19.h));
            }
          }
        }
        ((this.frameRect = handler7(box19)), this._updateView(this._view));
      },
      value53 = (event10) => {
        const event11 = this._pointerState;
        if (!event11 || event10.pointerId !== event11.pointerId) return;
        (event10.preventDefault(), run3());
      },
      value79 = (pointerId) => {
        if (pointerId.button !== 0) return;
        (pointerId.stopPropagation(), pointerId.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const el18 = pointerId.target.closest('.v2-expand-handle'),
          handle2 = el18?.dataset?.handle || null,
          mode = handle2 ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: pointerId.pointerId,
          mode: mode,
          handle: handle2,
          startX: pointerId.clientX,
          startY: pointerId.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(pointerId.pointerId),
          window.addEventListener('pointermove', value52, true),
          window.addEventListener('pointerup', value53, true),
          window.addEventListener('pointercancel', value53, true));
      };
    (this.frameEl.addEventListener('pointerdown', value79),
      (this.cleanup = () => {
        (run3(),
          window.removeEventListener('resize', value34),
          window.removeEventListener('keydown', value35),
          document.removeEventListener('pointerdown', value51, true),
          this.overlayEl?.removeEventListener('wheel', value36),
          this.frameEl?.removeEventListener('pointerdown', value79));
      }));
  },
  exit() {
    if (!this.active) return;
    this.active = false;
    this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
    if (this.overlayEl) this.overlayEl.classList.remove('visible');
    setTimeout(() => {
      (this.overlayEl?.remove(),
        this.toolbarEl?.remove(),
        this.cleanup?.(),
        (this.nodeId = null),
        (this.nodeData = null),
        (this.frameRect = null),
        (this._view = null));
    }, 200);
  },
};
export default ImageExpandController;
