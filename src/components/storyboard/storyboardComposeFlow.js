import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { buildStoryboardCropRect } from '../../core/storyboardCellUtils.js';
import { commit } from '../../modules/history.js';
import { saveOutputBlob } from '../../modules/project.js';
import { drawStoryboardComposeAsset } from '../../modules/storyboard/storyboardComposeDraw.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
const COMPOSE_CANVAS_WIDTH = 0x800;
function getStoryboardCells(value) {
  return Array.isArray(value?.cells) ? value.cells : [];
}
function getCssValue(item, key) {
  if (typeof getComputedStyle !== 'function') return key;
  const computedStyle = getComputedStyle(document.documentElement).getPropertyValue(item).trim();
  return computedStyle || key;
}
function parseAspectRatio(index) {
  const aspectStr = String(index || '1:1'),
    [count, count2] = aspectStr.split(':').map(Number),
    rw = Number.isFinite(count) && count > 0 ? count : 1,
    rh = Number.isFinite(count2) && count2 > 0 ? count2 : 1;
  return { aspectStr: aspectStr, rw: rw, rh: rh };
}
function createComposeImageLoader() {
  const map = new Map();
  return async (result) => {
    const enabled = String(result || '').trim();
    if (!enabled) return null;
    if (map.has(enabled)) return map.get(enabled);
    const data = new Promise((handler) => {
      const image = new Image();
      ((image.crossOrigin = 'anonymous'),
        (image.onload = () => handler(image)),
        (image.onerror = () => handler(null)),
        (image.src = enabled));
    });
    return (map.set(enabled, data), data);
  };
}
function setComposeButtonBusy(el) {
  if (!el) return () => {};
  const list = Array.from(el.childNodes).map((item2) => item2.cloneNode(true)),
    options = el.dataset.tooltip;
  (el.replaceChildren(), (el.dataset.tooltip = '合成中...'));
  const target = 'http://www.w3.org/2000/svg',
    el2 = document.createElementNS(target, 'svg');
  (el2.classList.add('v2-spinning'),
    el2.setAttribute('width', '14'),
    el2.setAttribute('height', '14'),
    el2.setAttribute('viewBox', '0 0 24 24'),
    el2.setAttribute('fill', 'none'),
    el2.setAttribute('stroke', 'currentColor'),
    el2.setAttribute('stroke-width', '2'));
  const el3 = document.createElementNS(target, 'path');
  return (
    el3.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56'),
    el2.appendChild(el3),
    el.appendChild(el2),
    (el.style.pointerEvents = 'none'),
    () => {
      (el.replaceChildren(...list.map((item3) => item3.cloneNode(true))),
        (el.dataset.tooltip = options),
        (el.style.pointerEvents = 'auto'));
    }
  );
}
function createComposeCanvas(source) {
  const { aspectStr: aspectStr2, rw: rw2, rh: rh2 } = parseAspectRatio(source?.aspectRatio),
    canvas = document.createElement('canvas');
  return (
    (canvas.width = COMPOSE_CANVAS_WIDTH),
    (canvas.height = Math.round(COMPOSE_CANVAS_WIDTH * (rh2 / rw2))),
    { aspectStr: aspectStr2, canvas: canvas }
  );
}
async function drawBackdrop(
  ctx,
  { backdropUrl: backdropUrl, canvasW: canvasW, canvasH: canvasH, loadImage: loadImage },
) {
  if (!backdropUrl) return;
  const enabled2 = await loadImage(backdropUrl);
  if (!enabled2) return;
  ctx.drawImage(enabled2, 0, 0, enabled2.naturalWidth, enabled2.naturalHeight, 0, 0, canvasW, canvasH);
}
function getSourceNodePosition(x) {
  return { x: x.x + x.width + 40, y: x.y };
}
async function saveComposeCanvas(box, next, x2) {
  const current = await new Promise((entry) => box.toBlob(entry, 'image/jpeg', 0.9)),
    generateId2 = generateId('compose'),
    record = 'storyboard_compose_' + generateId2 + '.jpg',
    file = new File([current], record, { type: 'image/jpeg' }),
    fileName = await saveOutputBlob(file, { ext: 'jpg' }),
    localPath = String(fileName.localPath || fileName.path || '').replace(/^\//, ''),
    src = String(fileName.url || '').trim() || '/' + String(localPath || ''),
    width = getAutoMediaSizeByShortSide(box.width, box.height),
    id = generateId('node');
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: id,
        type: 'source-image',
        x: x2.x,
        y: x2.y,
        width: width.width,
        height: width.height,
        src: src,
        localPath: localPath,
        fileName: fileName.filename || record,
        name: '合成分镜_' + next,
        needsAutoResize: false,
      }),
    ),
    id
  );
}
export function getStoryboardComposeCellImageElement(payload, handle) {
  const el4 = payload?.[handle] || null;
  if (!el4) return null;
  return (
    Array.from(el4.querySelectorAll?.('.storyboard-cell-img') || []).find(
      (el5) =>
        !el5.classList?.contains?.('storyboard-empty-residual-img') &&
        !el5.classList?.contains?.('storyboard-cell-source-cache'),
    ) || null
  );
}
export function getStoryboardComposeCellDisplayUrl({
  cellEls: cellEls,
  cellIndex: cellIndex,
  getImageElementSource: getImageElementSource,
} = {}) {
  return getImageElementSource?.(getStoryboardComposeCellImageElement(cellEls, cellIndex));
}
export async function drawStoryboardComposeCell(
  state,
  {
    cell: cell,
    cellIndex: cellIndex2,
    displayUrl: displayUrl,
    imageEl: imageEl,
    target: target2,
    loadImage: loadImage2,
    cellEls: cellEls2,
    getImageElementSource: getImageElementSource2,
  },
) {
  const imageEl2 = imageEl || getStoryboardComposeCellImageElement(cellEls2, cellIndex2),
    finalUrl = displayUrl || getImageElementSource2?.(imageEl2);
  return drawStoryboardComposeAsset(state, {
    cell: cell,
    finalUrl: finalUrl,
    imageEl: imageEl2,
    target: target2,
    loadImage: loadImage2,
  });
}
export async function composeStoryboardNode({
  node: node,
  rootEl: rootEl,
  cellEls: cellEls3,
  currentNodeId: currentNodeId,
  isCellEmpty: isCellEmpty,
  getImageElementSource: getImageElementSource3,
  getBackdropUrl: getBackdropUrl,
  markComposing: markComposing,
} = {}) {
  const list2 = getStoryboardCells(node),
    enabled3 = list2.some((item4, cellIndex3) => {
      return (
        !isCellEmpty?.(item4) &&
        getStoryboardComposeCellDisplayUrl({
          cellEls: cellEls3,
          cellIndex: cellIndex3,
          getImageElementSource: getImageElementSource3,
        })
      );
    });
  if (!enabled3) {
    window.showToast?.('分镜内没有任何内容可供合成', 'warning');
    return;
  }
  const config = rootEl?.querySelector?.('.act-compose') || null,
    handler2 = setComposeButtonBusy(config);
  markComposing?.(true);
  try {
    const { aspectStr: aspectStr3, canvas: canvas2 } = createComposeCanvas(node),
      ctx2 = canvas2.getContext('2d'),
      canvasW2 = canvas2.width,
      canvasH2 = canvas2.height,
      cssValue = getCssValue('--surface-node', 'transparent'),
      cssValue2 = getCssValue('--bg-node', cssValue);
    ((ctx2.fillStyle = cssValue), ctx2.fillRect(0, 0, canvasW2, canvasH2));
    const scope = node.cols || 2,
      input = node.rows || 2,
      loadImage3 = createComposeImageLoader();
    (await drawBackdrop(ctx2, {
      backdropUrl: getBackdropUrl?.(),
      canvasW: canvasW2,
      canvasH: canvasH2,
      loadImage: loadImage3,
    }),
      await Promise.all(
        list2.map(async (cell2, cellIndex4) => {
          if (cellIndex4 >= scope * input) return;
          const storyboardCropRect = buildStoryboardCropRect(node, cellIndex4, {
            width: canvasW2,
            height: canvasH2,
            inset: 0,
          });
          if (!storyboardCropRect) return;
          const x0 = storyboardCropRect.x0,
            output = storyboardCropRect.x1,
            y0 = storyboardCropRect.y0,
            value2 = storyboardCropRect.y1,
            drawW = Math.max(1, output - x0),
            drawH = Math.max(1, value2 - y0);
          if (isCellEmpty?.(cell2)) {
            ((ctx2.fillStyle = cssValue2), ctx2.fillRect(x0, y0, drawW, drawH));
            return;
          }
          const imageEl3 = getStoryboardComposeCellImageElement(cellEls3, cellIndex4),
            displayUrl2 = getImageElementSource3?.(imageEl3);
          if (!displayUrl2) return;
          await drawStoryboardComposeCell(ctx2, {
            cell: cell2,
            cellIndex: cellIndex4,
            displayUrl: displayUrl2,
            imageEl: imageEl3,
            target: { x0: x0, y0: y0, drawW: drawW, drawH: drawH },
            loadImage: loadImage3,
            cellEls: cellEls3,
            getImageElementSource: getImageElementSource3,
          });
        }),
      ));
    const saveComposeCanvas2 = await saveComposeCanvas(canvas2, aspectStr3, getSourceNodePosition(node));
    (appStore.setSelectedNodes([saveComposeCanvas2]),
      commit(),
      window.v2FocusOnNodes &&
        typeof requestAnimationFrame === 'function' &&
        requestAnimationFrame(() => window.v2FocusOnNodes([currentNodeId, saveComposeCanvas2])),
      window._triggerLocalCacheSave?.(),
      window.showToast?.('合成成功，源图像节点已生成', 'success'));
  } catch (value3) {
    (console.error('[Storyboard] Compose failed:', value3), window.showToast?.('合成失败', 'error'));
  } finally {
    (markComposing?.(false), handler2());
  }
}
