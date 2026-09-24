import { screenToWorld, generateId } from '../../core/math.js';
import { createPanorama360NodeData, createPanoramaSceneNodeData } from '../panoramaSceneNode/sceneNode.js';
import { createStoryboardScriptNodeData } from '../../core/storyboardScriptFactory.js';
import { createEmptyCollageNodeData } from '../collage/collageFactory.js';
import { createWhiteboardNodeData } from '../whiteboard/whiteboardModel.js';
import { createComfyWorkflowNodeData } from '../comfyui/comfyWorkflowModel.js';
import { createStoryWorkspaceNodeData } from '../storyWorkspace/storyWorkspaceModel.js';
import { t } from '../../i18n/index.js';
const DEV_ONLY_NODE_TYPES = new Set(['media-clip', 'web-preview']);
export function createSpecialNodeDataByType({
  type: _0x5a6b3f,
  id: _0x4a81e1,
  x: _0x294dbb,
  y: _0x39dc89,
  width: _0x2e16e5,
  height: _0x1a3e21,
  name: _0x3f20a9,
}) {
  if (_0x5a6b3f === 'panorama-scene')
    return createPanoramaSceneNodeData({
      id: _0x4a81e1,
      x: _0x294dbb,
      y: _0x39dc89,
      width: _0x2e16e5,
      height: _0x1a3e21,
      name: _0x3f20a9,
    });
  if (_0x5a6b3f === 'panorama-360')
    return createPanorama360NodeData({
      id: _0x4a81e1,
      x: _0x294dbb,
      y: _0x39dc89,
      width: _0x2e16e5,
      height: _0x1a3e21,
      name: _0x3f20a9,
    });
  if (_0x5a6b3f === 'storyboard-script')
    return createStoryboardScriptNodeData({
      id: _0x4a81e1,
      x: _0x294dbb,
      y: _0x39dc89,
      width: _0x2e16e5,
      height: _0x1a3e21,
      name: _0x3f20a9,
    });
  if (_0x5a6b3f === 'collage')
    return createEmptyCollageNodeData({
      id: _0x4a81e1,
      x: _0x294dbb,
      y: _0x39dc89,
      width: _0x2e16e5,
      height: _0x1a3e21,
      name: _0x3f20a9 || t('nodeCreation.items.collage.defaultName'),
    });
  if (_0x5a6b3f === 'story-workspace')
    return createStoryWorkspaceNodeData({
      id: _0x4a81e1, x: _0x294dbb, y: _0x39dc89,
      width: _0x2e16e5, height: _0x1a3e21,
      name: _0x3f20a9 || t('nodeCreation.items.storyWorkspace.defaultName'),
    });
  if (_0x5a6b3f === 'comfyui-workflow')
    return createComfyWorkflowNodeData({
      id: _0x4a81e1, x: _0x294dbb, y: _0x39dc89,
      width: _0x2e16e5, height: _0x1a3e21,
      name: _0x3f20a9 || t('nodeCreation.items.comfyWorkflow.defaultName'),
    });
  if (_0x5a6b3f === 'whiteboard')
    return createWhiteboardNodeData({
      id: _0x4a81e1, x: _0x294dbb, y: _0x39dc89,
      width: _0x2e16e5, height: _0x1a3e21,
      name: _0x3f20a9 || t('nodeCreation.items.whiteboard.defaultName'),
    });
  if (_0x5a6b3f === 'web-preview')
    return {
      id: _0x4a81e1,
      type: _0x5a6b3f,
      x: _0x294dbb,
      y: _0x39dc89,
      width: _0x2e16e5,
      height: _0x1a3e21,
      name: _0x3f20a9 || t('nodeCreation.items.webPreview.defaultName'),
    };
  return null;
}
function isDevModeOn() {
  return window.DEV_MODE === true || document.body.classList.contains('dev-mode');
}
function isDevOnlyNodeType(_0x2467da) {
  return DEV_ONLY_NODE_TYPES.has(String(_0x2467da || ''));
}
function resolveNodeSize(_0x49b59c, _0xb12b5e, { forDrop: forDrop = false } = {}) {
  let { width: _0x350f3e, height: _0x4a4ca8 } = _0xb12b5e(_0x49b59c);
  return (
    forDrop && _0x49b59c === 'test-video' && ((_0x350f3e = 0x12c), (_0x4a4ca8 = 0x12c)),
    forDrop && _0x49b59c === 'scene-detection' && ((_0x350f3e = 0x190), (_0x4a4ca8 = 0x1f4)),
    { width: _0x350f3e, height: _0x4a4ca8 }
  );
}
export function initAppNodeEntry({
  graphStore: _0x1b5384,
  wrap: _0x164fa1,
  btnAddEl: _0xa5d54a,
  nodeMenuEl: _0x14d599,
  initCanvasContextMenu: _0xfa20a7,
  getNodeDefaultSize: _0x4a1461,
  commit: _0x2655a9,
} = {}) {
  const _0x548b01 = () => {
      const _0x199636 = isDevModeOn();
      document.querySelectorAll('.nam-item[data-type]').forEach((_0x45400d) => {
        const _0x513fa5 = isDevOnlyNodeType(_0x45400d.dataset.type);
        ((_0x45400d.hidden = _0x513fa5 && !_0x199636),
          _0x45400d.setAttribute('aria-hidden', _0x513fa5 && !_0x199636 ? 'true' : 'false'));
      });
    },
    _0x2b2ffb = (_0x4458dc, _0x238157, _0x556969, _0x357389 = {}) => {
      const { width: _0x48096b, height: _0x56161b } = resolveNodeSize(_0x4458dc, _0x4a1461, _0x357389),
        _0x2465a7 = generateId(_0x4458dc),
        _0xb04a36 = createSpecialNodeDataByType({
          type: _0x4458dc,
          id: _0x2465a7,
          x: _0x238157 - _0x48096b / 2,
          y: _0x556969 - _0x56161b / 2,
          width: _0x48096b,
          height: _0x56161b,
        }) || {
          id: _0x2465a7,
          type: _0x4458dc,
          x: _0x238157 - _0x48096b / 2,
          y: _0x556969 - _0x56161b / 2,
          width: _0x48096b,
          height: _0x56161b,
        };
      (_0x4458dc === 'media-clip' && (_0xb04a36.name = t('nodeCreation.items.mediaClip.defaultName')),
        _0x1b5384.addNode(_0xb04a36),
        _0x1b5384.setSelectedNodes([_0x2465a7]),
        _0x2655a9?.());
    },
    _0x4f29b4 = (_0x24f626) => {
      const { viewport: _0x6a9010 } = _0x1b5384.getState(),
        _0x4bfcdb = (window.innerWidth / 2 - _0x6a9010.x) / _0x6a9010.zoom,
        _0xc466f1 = (window.innerHeight / 2 - _0x6a9010.y) / _0x6a9010.zoom;
      _0x2b2ffb(_0x24f626, _0x4bfcdb, _0xc466f1);
    };
  if (_0xa5d54a) {
    let _0x415de8 = null,
      _0x339b3f = '',
      _0x34de9c = null;
    const _0x4b6a35 = () => {
        (clearTimeout(_0x415de8), (_0x415de8 = null));
      },
      _0x5b7991 = () => {
        (_0x4b6a35(),
          (_0x339b3f = ''),
          _0x34de9c && (document.removeEventListener('pointerdown', _0x34de9c, true), (_0x34de9c = null)),
          document.querySelector('#v2PickerOverlay')?.remove());
      },
      _0x2b8b33 = () => {
        if (_0x339b3f === 'pinned') return;
        (_0x4b6a35(), (_0x415de8 = setTimeout(_0x5b7991, 200)));
      },
      _0x5f56ce = (_0x6de3e9) => {
        const _0x52eaab = document.querySelector('#v2PickerOverlay');
        if (!_0x52eaab) return;
        (_0x4b6a35(), (_0x339b3f = _0x6de3e9), (_0x52eaab.style.pointerEvents = 'none'));
        const _0x411623 = _0x52eaab.querySelector('.v2-node-picker');
        _0x411623 &&
          ((_0x411623.style.pointerEvents = 'auto'),
          _0x411623.addEventListener('mouseenter', _0x4b6a35),
          _0x411623.addEventListener('mouseleave', _0x2b8b33));
        _0x34de9c && document.removeEventListener('pointerdown', _0x34de9c, true);
        _0x34de9c = (_0x3d1c31) => {
          if (_0x411623?.contains(_0x3d1c31.target) || _0xa5d54a.contains(_0x3d1c31.target)) {
            _0x4b6a35();
            return;
          }
          _0x5b7991();
        };
        const _0x583edd = _0x34de9c;
        requestAnimationFrame(
          () =>
            _0x34de9c === _0x583edd && _0x583edd && document.addEventListener('pointerdown', _0x583edd, true),
        );
      },
      _0x3a00e8 = (_0x167b42) => {
        (_0x4b6a35(), (_0x339b3f = _0x167b42));
        const _0x4eccd1 = _0xa5d54a.getBoundingClientRect();
        (_0xfa20a7._showPicker?.(_0x4eccd1.right + 12, _0x4eccd1.top, true),
          requestAnimationFrame(() => _0x5f56ce(_0x167b42)));
      };
    (_0xa5d54a.addEventListener('click', (_0x285514) => {
      (_0x285514.preventDefault(), _0x285514.stopPropagation(), _0x3a00e8('pinned'));
    }),
      _0xa5d54a.addEventListener('mouseenter', () => {
        _0x4b6a35();
        if (document.querySelector('#v2PickerOverlay')) return;
        _0x3a00e8('hover');
      }),
      _0xa5d54a.addEventListener('mouseleave', _0x2b8b33));
  }
  (document.addEventListener('click', (_0x156dc1) => {
    _0x14d599 &&
      _0x14d599.style.display !== 'none' &&
      !_0x156dc1.target.closest('#nodeMenu') &&
      !_0x156dc1.target.closest('#btnAdd') &&
      (_0x14d599.style.display = 'none');
  }),
    _0x548b01());
  if (document.body) {
    const _0x8f1dd9 = new MutationObserver(() => {
      _0x548b01();
    });
    _0x8f1dd9.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  (document.querySelectorAll('.nam-item').forEach((_0x37cfde) => {
    (_0x37cfde.setAttribute('draggable', 'true'),
      _0x37cfde.addEventListener('dragstart', (_0x316a86) => {
        const _0xec0dea = _0x316a86.currentTarget.dataset.type;
        if (isDevOnlyNodeType(_0xec0dea) && !isDevModeOn()) {
          _0x316a86.preventDefault();
          return;
        }
        (_0x316a86.dataTransfer.setData('application/v2-node-type', _0xec0dea),
          (_0x316a86.dataTransfer.effectAllowed = 'copy'));
      }),
      _0x37cfde.addEventListener('click', (_0x375a91) => {
        _0x375a91.stopPropagation();
        const _0x46575d = _0x37cfde.dataset.type;
        if (!_0x46575d || _0x46575d === 'resource') return;
        if (isDevOnlyNodeType(_0x46575d) && !isDevModeOn()) return;
        _0x4f29b4(_0x46575d);
        if (_0x14d599) _0x14d599.style.display = 'none';
      }));
  }),
    _0x164fa1.addEventListener('dragover', (_0x1be674) => {
      _0x1be674.dataTransfer.types.includes('application/v2-node-type') &&
        (_0x1be674.preventDefault(), (_0x1be674.dataTransfer.dropEffect = 'copy'));
    }),
    _0x164fa1.addEventListener('drop', (_0x344c81) => {
      const _0x2db376 = _0x344c81.dataTransfer.getData('application/v2-node-type');
      if (!_0x2db376) return;
      if (isDevOnlyNodeType(_0x2db376) && !isDevModeOn()) return;
      _0x344c81.preventDefault();
      const { viewport: _0x5159c5 } = _0x1b5384.getState(),
        _0x5c823d = screenToWorld(_0x344c81.clientX, _0x344c81.clientY, _0x5159c5);
      _0x2b2ffb(_0x2db376, _0x5c823d.x, _0x5c823d.y, { forDrop: true });
    }));
}
