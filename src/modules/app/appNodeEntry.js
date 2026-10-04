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
  type: type2,
  id: id2,
  x: x2,
  y: y2,
  width: width2,
  height: height2,
  name: name,
}) {
  if (type2 === 'panorama-scene')
    return createPanoramaSceneNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name,
    });
  if (type2 === 'panorama-360')
    return createPanorama360NodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name,
    });
  if (type2 === 'storyboard-script')
    return createStoryboardScriptNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name,
    });
  if (type2 === 'collage')
    return createEmptyCollageNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name || t('nodeCreation.items.collage.defaultName'),
    });
  if (type2 === 'story-workspace')
    return createStoryWorkspaceNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name || t('nodeCreation.items.storyWorkspace.defaultName'),
    });
  if (type2 === 'comfyui-workflow')
    return createComfyWorkflowNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name || t('nodeCreation.items.comfyWorkflow.defaultName'),
    });
  if (type2 === 'whiteboard')
    return createWhiteboardNodeData({
      id: id2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name || t('nodeCreation.items.whiteboard.defaultName'),
    });
  if (type2 === 'web-preview')
    return {
      id: id2,
      type: type2,
      x: x2,
      y: y2,
      width: width2,
      height: height2,
      name: name || t('nodeCreation.items.webPreview.defaultName'),
    };
  return null;
}
function isDevModeOn() {
  return window.DEV_MODE === true || document.body.classList.contains('dev-mode');
}
function isDevOnlyNodeType(value) {
  return DEV_ONLY_NODE_TYPES.has(String(value || ''));
}
function resolveNodeSize(item, handler, { forDrop: forDrop = false } = {}) {
  let { width: width3, height: height3 } = handler(item);
  return (
    forDrop && item === 'test-video' && ((width3 = 0x12c), (height3 = 0x12c)),
    forDrop && item === 'scene-detection' && ((width3 = 0x190), (height3 = 0x1f4)),
    { width: width3, height: height3 }
  );
}
export function initAppNodeEntry({
  graphStore: graphStore,
  wrap: wrap,
  btnAddEl: btnAddEl,
  nodeMenuEl: nodeMenuEl,
  initCanvasContextMenu: initCanvasContextMenu,
  getNodeDefaultSize: getNodeDefaultSize,
  commit: commit,
} = {}) {
  const run = () => {
      const isDevModeOn2 = isDevModeOn();
      document.querySelectorAll('.nam-item[data-type]').forEach((el) => {
        const isDevOnlyNodeType2 = isDevOnlyNodeType(el.dataset.type);
        ((el.hidden = isDevOnlyNodeType2 && !isDevModeOn2),
          el.setAttribute('aria-hidden', isDevOnlyNodeType2 && !isDevModeOn2 ? 'true' : 'false'));
      });
    },
    handler2 = (type3, x3, y3, key = {}) => {
      const { width: width4, height: height4 } = resolveNodeSize(type3, getNodeDefaultSize, key),
        id3 = generateId(type3),
        error = createSpecialNodeDataByType({
          type: type3,
          id: id3,
          x: x3 - width4 / 2,
          y: y3 - height4 / 2,
          width: width4,
          height: height4,
        }) || {
          id: id3,
          type: type3,
          x: x3 - width4 / 2,
          y: y3 - height4 / 2,
          width: width4,
          height: height4,
        };
      (type3 === 'media-clip' && (error.name = t('nodeCreation.items.mediaClip.defaultName')),
        graphStore.addNode(error),
        graphStore.setSelectedNodes([id3]),
        commit?.());
    },
    handler3 = (index) => {
      const { viewport: viewport } = graphStore.getState(),
        result = (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        data = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
      handler2(index, result, data);
    };
  if (btnAddEl) {
    let setTimeout2 = null,
      options = '',
      value2 = null;
    const run2 = () => {
        (clearTimeout(setTimeout2), (setTimeout2 = null));
      },
      handler4 = () => {
        (run2(),
          (options = ''),
          value2 && (document.removeEventListener('pointerdown', value2, true), (value2 = null)),
          document.querySelector('#v2PickerOverlay')?.remove());
      },
      target = () => {
        if (options === 'pinned') return;
        (run2(), (setTimeout2 = setTimeout(handler4, 200)));
      },
      handler5 = (source) => {
        const el2 = document.querySelector('#v2PickerOverlay');
        if (!el2) return;
        (run2(), (options = source), (el2.style.pointerEvents = 'none'));
        const el3 = el2.querySelector('.v2-node-picker');
        el3 &&
          ((el3.style.pointerEvents = 'auto'),
          el3.addEventListener('mouseenter', run2),
          el3.addEventListener('mouseleave', target));
        value2 && document.removeEventListener('pointerdown', value2, true);
        value2 = (event) => {
          if (el3?.contains(event.target) || btnAddEl.contains(event.target)) {
            run2();
            return;
          }
          handler4();
        };
        const next = value2;
        requestAnimationFrame(
          () => value2 === next && next && document.addEventListener('pointerdown', next, true),
        );
      },
      handler6 = (current) => {
        (run2(), (options = current));
        const box = btnAddEl.getBoundingClientRect();
        (initCanvasContextMenu._showPicker?.(box.right + 12, box.top, true),
          requestAnimationFrame(() => handler5(current)));
      };
    (btnAddEl.addEventListener('click', (event2) => {
      (event2.preventDefault(), event2.stopPropagation(), handler6('pinned'));
    }),
      btnAddEl.addEventListener('mouseenter', () => {
        run2();
        if (document.querySelector('#v2PickerOverlay')) return;
        handler6('hover');
      }),
      btnAddEl.addEventListener('mouseleave', target));
  }
  (document.addEventListener('click', (event3) => {
    nodeMenuEl &&
      nodeMenuEl.style.display !== 'none' &&
      !event3.target.closest('#nodeMenu') &&
      !event3.target.closest('#btnAdd') &&
      (nodeMenuEl.style.display = 'none');
  }),
    run());
  if (document.body) {
    const mutationObserver = new MutationObserver(() => {
      run();
    });
    mutationObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  (document.querySelectorAll('.nam-item').forEach((el4) => {
    (el4.setAttribute('draggable', 'true'),
      el4.addEventListener('dragstart', (event4) => {
        const entry = event4.currentTarget.dataset.type;
        if (isDevOnlyNodeType(entry) && !isDevModeOn()) {
          event4.preventDefault();
          return;
        }
        (event4.dataTransfer.setData('application/v2-node-type', entry),
          (event4.dataTransfer.effectAllowed = 'copy'));
      }),
      el4.addEventListener('click', (event5) => {
        event5.stopPropagation();
        const enabled = el4.dataset.type;
        if (!enabled || enabled === 'resource') return;
        if (isDevOnlyNodeType(enabled) && !isDevModeOn()) return;
        handler3(enabled);
        if (nodeMenuEl) nodeMenuEl.style.display = 'none';
      }));
  }),
    wrap.addEventListener('dragover', (event6) => {
      event6.dataTransfer.types.includes('application/v2-node-type') &&
        (event6.preventDefault(), (event6.dataTransfer.dropEffect = 'copy'));
    }),
    wrap.addEventListener('drop', (event7) => {
      const enabled2 = event7.dataTransfer.getData('application/v2-node-type');
      if (!enabled2) return;
      if (isDevOnlyNodeType(enabled2) && !isDevModeOn()) return;
      event7.preventDefault();
      const { viewport: viewport2 } = graphStore.getState(),
        box2 = screenToWorld(event7.clientX, event7.clientY, viewport2);
      handler2(enabled2, box2.x, box2.y, { forDrop: true });
    }));
}
