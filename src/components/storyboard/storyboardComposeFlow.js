import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { buildStoryboardCropRect } from '../../core/storyboardCellUtils.js';
import { commit } from '../../modules/history.js';
import { saveOutputBlob } from '../../modules/project.js';
import { drawStoryboardComposeAsset } from '../../modules/storyboard/storyboardComposeDraw.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
const COMPOSE_CANVAS_WIDTH = 0x800;
function getStoryboardCells(_0x204f77) {
  return Array.isArray(_0x204f77?.cells) ? _0x204f77.cells : [];
}
function getCssValue(_0x4815d6, _0x19442b) {
  if (typeof getComputedStyle !== 'function') return _0x19442b;
  const _0x4fba42 = getComputedStyle(document.documentElement).getPropertyValue(_0x4815d6).trim();
  return _0x4fba42 || _0x19442b;
}
function parseAspectRatio(_0x49f905) {
  const _0x4c6136 = String(_0x49f905 || '1:1'),
    [_0x7927c, _0x1119f2] = _0x4c6136.split(':').map(Number),
    _0x41d62a = Number.isFinite(_0x7927c) && _0x7927c > 0 ? _0x7927c : 1,
    _0x463d62 = Number.isFinite(_0x1119f2) && _0x1119f2 > 0 ? _0x1119f2 : 1;
  return { aspectStr: _0x4c6136, rw: _0x41d62a, rh: _0x463d62 };
}
function createComposeImageLoader() {
  const _0x4772f7 = new Map();
  return async (_0x5aa416) => {
    const _0x1a7b34 = String(_0x5aa416 || '').trim();
    if (!_0x1a7b34) return null;
    if (_0x4772f7.has(_0x1a7b34)) return _0x4772f7.get(_0x1a7b34);
    const _0xef9875 = new Promise((_0xff4a1f) => {
      const _0xa74b14 = new Image();
      ((_0xa74b14.crossOrigin = 'anonymous'),
        (_0xa74b14.onload = () => _0xff4a1f(_0xa74b14)),
        (_0xa74b14.onerror = () => _0xff4a1f(null)),
        (_0xa74b14.src = _0x1a7b34));
    });
    return (_0x4772f7.set(_0x1a7b34, _0xef9875), _0xef9875);
  };
}
function setComposeButtonBusy(_0x1c9018) {
  if (!_0x1c9018) return () => {};
  const _0x1c2a30 = Array.from(_0x1c9018.childNodes).map((_0x5cae8f) => _0x5cae8f.cloneNode(true)),
    _0x1ae5ce = _0x1c9018.dataset.tooltip;
  (_0x1c9018.replaceChildren(), (_0x1c9018.dataset.tooltip = '合成中...'));
  const _0x1357d0 = 'http://www.w3.org/2000/svg',
    _0x2f6d7b = document.createElementNS(_0x1357d0, 'svg');
  (_0x2f6d7b.classList.add('v2-spinning'),
    _0x2f6d7b.setAttribute('width', '14'),
    _0x2f6d7b.setAttribute('height', '14'),
    _0x2f6d7b.setAttribute('viewBox', '0 0 24 24'),
    _0x2f6d7b.setAttribute('fill', 'none'),
    _0x2f6d7b.setAttribute('stroke', 'currentColor'),
    _0x2f6d7b.setAttribute('stroke-width', '2'));
  const _0x31a93b = document.createElementNS(_0x1357d0, 'path');
  return (
    _0x31a93b.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56'),
    _0x2f6d7b.appendChild(_0x31a93b),
    _0x1c9018.appendChild(_0x2f6d7b),
    (_0x1c9018.style.pointerEvents = 'none'),
    () => {
      (_0x1c9018.replaceChildren(..._0x1c2a30.map((_0x2f11d9) => _0x2f11d9.cloneNode(true))),
        (_0x1c9018.dataset.tooltip = _0x1ae5ce),
        (_0x1c9018.style.pointerEvents = 'auto'));
    }
  );
}
function createComposeCanvas(_0x4ead24) {
  const { aspectStr: _0x431fdf, rw: _0x99644c, rh: _0x29e9fb } = parseAspectRatio(_0x4ead24?.aspectRatio),
    _0x18bf65 = document.createElement('canvas');
  return (
    (_0x18bf65.width = COMPOSE_CANVAS_WIDTH),
    (_0x18bf65.height = Math.round(COMPOSE_CANVAS_WIDTH * (_0x29e9fb / _0x99644c))),
    { aspectStr: _0x431fdf, canvas: _0x18bf65 }
  );
}
async function drawBackdrop(
  _0x28ab27,
  { backdropUrl: _0x5d4c4c, canvasW: _0x428abe, canvasH: _0xfea654, loadImage: _0xa52274 },
) {
  if (!_0x5d4c4c) return;
  const _0x2410bc = await _0xa52274(_0x5d4c4c);
  if (!_0x2410bc) return;
  _0x28ab27.drawImage(
    _0x2410bc,
    0,
    0,
    _0x2410bc.naturalWidth,
    _0x2410bc.naturalHeight,
    0,
    0,
    _0x428abe,
    _0xfea654,
  );
}
function getSourceNodePosition(_0x5046e1) {
  return { x: _0x5046e1.x + _0x5046e1.width + 40, y: _0x5046e1.y };
}
async function saveComposeCanvas(_0x495e87, _0x4bca63, _0x2c8fd6) {
  const _0x14cee3 = await new Promise((_0x4434b6) => _0x495e87.toBlob(_0x4434b6, 'image/jpeg', 0.9)),
    _0x51583a = generateId('compose'),
    _0x3815d4 = 'storyboard_compose_' + _0x51583a + '.jpg',
    _0x2e5bd5 = new File([_0x14cee3], _0x3815d4, { type: 'image/jpeg' }),
    _0x54a5f2 = await saveOutputBlob(_0x2e5bd5, { ext: 'jpg' }),
    _0x45a6db = String(_0x54a5f2.localPath || _0x54a5f2.path || '').replace(/^\//, ''),
    _0x5a8cb8 = String(_0x54a5f2.url || '').trim() || '/' + String(_0x45a6db || ''),
    _0x13a51c = getAutoMediaSizeByShortSide(_0x495e87.width, _0x495e87.height),
    _0x3e1d1b = generateId('node');
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: _0x3e1d1b,
        type: 'source-image',
        x: _0x2c8fd6.x,
        y: _0x2c8fd6.y,
        width: _0x13a51c.width,
        height: _0x13a51c.height,
        src: _0x5a8cb8,
        localPath: _0x45a6db,
        fileName: _0x54a5f2.filename || _0x3815d4,
        name: '合成分镜_' + _0x4bca63,
        needsAutoResize: false,
      }),
    ),
    _0x3e1d1b
  );
}
export function getStoryboardComposeCellImageElement(_0x49cb55, _0x28b893) {
  const _0x348ff5 = _0x49cb55?.[_0x28b893] || null;
  if (!_0x348ff5) return null;
  return (
    Array.from(_0x348ff5.querySelectorAll?.('.storyboard-cell-img') || []).find(
      (_0x42522d) =>
        !_0x42522d.classList?.contains?.('storyboard-empty-residual-img') &&
        !_0x42522d.classList?.contains?.('storyboard-cell-source-cache'),
    ) || null
  );
}
export function getStoryboardComposeCellDisplayUrl({
  cellEls: _0x1e6f42,
  cellIndex: _0x1d2dce,
  getImageElementSource: _0x1bd99f,
} = {}) {
  return _0x1bd99f?.(getStoryboardComposeCellImageElement(_0x1e6f42, _0x1d2dce));
}
export async function drawStoryboardComposeCell(
  _0x330c73,
  {
    cell: _0x5a3398,
    cellIndex: _0x24c1a1,
    displayUrl: _0xb3c141,
    imageEl: _0x3d7dab,
    target: _0x11cf94,
    loadImage: _0x15816b,
    cellEls: _0x2e123d,
    getImageElementSource: _0x455266,
  },
) {
  const _0x34be21 = _0x3d7dab || getStoryboardComposeCellImageElement(_0x2e123d, _0x24c1a1),
    _0xfa4a56 = _0xb3c141 || _0x455266?.(_0x34be21);
  return drawStoryboardComposeAsset(_0x330c73, {
    cell: _0x5a3398,
    finalUrl: _0xfa4a56,
    imageEl: _0x34be21,
    target: _0x11cf94,
    loadImage: _0x15816b,
  });
}
export async function composeStoryboardNode({
  node: _0x5bebb7,
  rootEl: _0x34874c,
  cellEls: _0x1e77e4,
  currentNodeId: _0x2661c0,
  isCellEmpty: _0x26e3e5,
  getImageElementSource: _0x3c72ea,
  getBackdropUrl: _0x5afccf,
  markComposing: _0x1de383,
} = {}) {
  const _0x3b26d1 = getStoryboardCells(_0x5bebb7),
    _0x55ee0b = _0x3b26d1.some((_0x4fa42a, _0x34b116) => {
      return (
        !_0x26e3e5?.(_0x4fa42a) &&
        getStoryboardComposeCellDisplayUrl({
          cellEls: _0x1e77e4,
          cellIndex: _0x34b116,
          getImageElementSource: _0x3c72ea,
        })
      );
    });
  if (!_0x55ee0b) {
    window.showToast?.('分镜内没有任何内容可供合成', 'warning');
    return;
  }
  const _0x4d4cac = _0x34874c?.querySelector?.('.act-compose') || null,
    _0x4bba10 = setComposeButtonBusy(_0x4d4cac);
  _0x1de383?.(true);
  try {
    const { aspectStr: _0x5056ce, canvas: _0x18633a } = createComposeCanvas(_0x5bebb7),
      _0x14ede3 = _0x18633a.getContext('2d'),
      _0x34aa74 = _0x18633a.width,
      _0x4b37d0 = _0x18633a.height,
      _0x1bb03f = getCssValue('--surface-node', 'transparent'),
      _0xe53ef7 = getCssValue('--bg-node', _0x1bb03f);
    ((_0x14ede3.fillStyle = _0x1bb03f), _0x14ede3.fillRect(0, 0, _0x34aa74, _0x4b37d0));
    const _0x18ee17 = _0x5bebb7.cols || 2,
      _0x37a98b = _0x5bebb7.rows || 2,
      _0x4d6596 = createComposeImageLoader();
    (await drawBackdrop(_0x14ede3, {
      backdropUrl: _0x5afccf?.(),
      canvasW: _0x34aa74,
      canvasH: _0x4b37d0,
      loadImage: _0x4d6596,
    }),
      await Promise.all(
        _0x3b26d1.map(async (_0x2c1f80, _0x2fff40) => {
          if (_0x2fff40 >= _0x18ee17 * _0x37a98b) return;
          const _0x48d503 = buildStoryboardCropRect(_0x5bebb7, _0x2fff40, {
            width: _0x34aa74,
            height: _0x4b37d0,
            inset: 0,
          });
          if (!_0x48d503) return;
          const _0x3b5589 = _0x48d503.x0,
            _0x3f2c15 = _0x48d503.x1,
            _0x2e39c5 = _0x48d503.y0,
            _0x5231ad = _0x48d503.y1,
            _0x144660 = Math.max(1, _0x3f2c15 - _0x3b5589),
            _0x5c183b = Math.max(1, _0x5231ad - _0x2e39c5);
          if (_0x26e3e5?.(_0x2c1f80)) {
            ((_0x14ede3.fillStyle = _0xe53ef7),
              _0x14ede3.fillRect(_0x3b5589, _0x2e39c5, _0x144660, _0x5c183b));
            return;
          }
          const _0x17b0b0 = getStoryboardComposeCellImageElement(_0x1e77e4, _0x2fff40),
            _0x570013 = _0x3c72ea?.(_0x17b0b0);
          if (!_0x570013) return;
          await drawStoryboardComposeCell(_0x14ede3, {
            cell: _0x2c1f80,
            cellIndex: _0x2fff40,
            displayUrl: _0x570013,
            imageEl: _0x17b0b0,
            target: { x0: _0x3b5589, y0: _0x2e39c5, drawW: _0x144660, drawH: _0x5c183b },
            loadImage: _0x4d6596,
            cellEls: _0x1e77e4,
            getImageElementSource: _0x3c72ea,
          });
        }),
      ));
    const _0xede6d5 = await saveComposeCanvas(_0x18633a, _0x5056ce, getSourceNodePosition(_0x5bebb7));
    (appStore.setSelectedNodes([_0xede6d5]),
      commit(),
      window.v2FocusOnNodes &&
        typeof requestAnimationFrame === 'function' &&
        requestAnimationFrame(() => window.v2FocusOnNodes([_0x2661c0, _0xede6d5])),
      window._triggerLocalCacheSave?.(),
      window.showToast?.('合成成功，源图像节点已生成', 'success'));
  } catch (_0x4c7f6c) {
    (console.error('[Storyboard] Compose failed:', _0x4c7f6c), window.showToast?.('合成失败', 'error'));
  } finally {
    (_0x1de383?.(false), _0x4bba10());
  }
}
