import {
  deleteSelectedPanoramaSceneObject,
  focusPanoramaSceneSelection,
  resetPanoramaSceneView,
  setPanoramaSceneEditing,
  setPanoramaSceneTool,
} from '../panoramaSceneNode/sceneNodeActions.js';
import { copyNodeMediaToSystemClipboard } from '../mediaClipboard.js';
import { startCanvasScreenshot } from '../canvasScreenshot.js';
import { markSystemClipboardWrite } from '../clipboard.js';
import { applySnapGridEnabled, readSnapGridEnabled } from '../snapGridState.js';
import { readGridDotsPref, setGridDotsPref } from '../settings/appearanceSettings.js';
import { setSelectionRelatedHighlightPref } from '../settings/canvasAlignmentSettings.js';
import {
  readCommentNoteJumpFocusPref,
  setImageVideoNodeResizePref,
  setNodeAvoidOverlapPref,
  setPromptBoxResizePref,
  setTitleFollowsCanvasZoomPref,
  setVideoMetaPref,
} from '../settings/nodeBehaviorSettings.js';
import { resolveJumpZoom } from '../commentNoteJumpShortcut.js';
import { toggleSettingsPanel } from '../settings/panelSettings.js';
import { toggleSidebarSubmenu } from '../sidebarSubmenuController.js';
import { syncPlaySelectedVideos } from '../videoSyncPlayback.js';
import {
  computeNodesWorldBounds,
  computeViewportForWorldBounds,
  getAlignableSelectionNodes,
  screenToWorld,
} from '../../core/math.js';
import { getBrowserViewportRect } from '../../core/viewportFocus.js';
import { t } from '../../i18n/index.js';
const COMMENT_NOTE_JUMP_WORLD_ALIGN = 0.5,
  MEDIA_CLIP_DELETE_MATERIAL_EVENT = 'media-clip-delete-material';
export function createAppBusinessEvents({
  store: store,
  wrap: wrap,
  addShortcutListener: addShortcutListener,
  executeCommand: executeCommand,
  undo: undo,
  redo: redo,
  commit: commit,
  closeShortcuts: closeShortcuts,
  getNodeDefaultSize: getNodeDefaultSize,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  createNodeAtCursor: createNodeAtCursor,
  createImageNodeFromBlob: createImageNodeFromBlob,
  animateViewport: animateViewport,
  focusNodeAtZoomPercent: focusNodeAtZoomPercent,
  focusNodes: focusNodes,
  clearTrackedFocus: clearTrackedFocus,
  handlePasteFromClipboard: handlePasteFromClipboard,
  initCanvasContextMenu: initCanvasContextMenu,
  toggleAgentPanel: toggleAgentPanel,
  ImageAnnotateController: ImageAnnotateController,
  ImageMattingController: ImageMattingController,
  AudioClipController: AudioClipController,
  syncPlaySelectedVideos: syncPlaySelectedVideos2 = syncPlaySelectedVideos,
} = {}) {
  const run = (value) => {
      const enabled = value?.viewport;
      if (!enabled) return null;
      const item = Number(window?._lastMx),
        key = Number(window?._lastMy);
      if (!Number.isFinite(item) || !Number.isFinite(key)) return null;
      const x2 = screenToWorld(item, key, enabled);
      if (!x2 || !Number.isFinite(x2.x) || !Number.isFinite(x2.y)) return null;
      return { x: x2.x, y: x2.y };
    },
    index = {
      'panorama-scene-camera-create': { selector: '.act-camera', nodeTypes: ['panorama-scene'] },
      'image-tool-matting': { selector: '.act-matting', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-repaint': { selector: '.act-repaint', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-erase': { selector: '.act-erase', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-hd': { selector: '.act-hd', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-expand': { selector: '.act-expand', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-auto-subject': {
        selector: '.act-auto-subject',
        nodeTypes: ['source-image', 'ai-image', 'image'],
      },
      'image-tool-multigrid': {
        selector: '.act-multigrid',
        nodeTypes: ['source-image', 'ai-image', 'image'],
      },
      'image-tool-multiangle': {
        selector: '.act-multiangle',
        nodeTypes: ['source-image', 'ai-image', 'image'],
      },
      'image-tool-annotate': { selector: '.act-annotate', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-crop': { selector: '.act-crop', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'image-tool-fullscreen': {
        selector: '.act-fullscreen',
        nodeTypes: ['source-image', 'ai-image', 'image'],
      },
      'image-tool-download': { selector: '.act-download', nodeTypes: ['source-image', 'ai-image', 'image'] },
      'video-tool-clip': { selector: '.act-clip', nodeTypes: ['source-video', 'ai-video', 'video'] },
      'video-tool-separate-av': {
        selector: '.act-separate-av',
        nodeTypes: ['source-video', 'ai-video', 'video'],
      },
      'video-tool-capture-frame': {
        selector: '.video-snap-btn',
        nodeTypes: ['source-video', 'ai-video', 'video'],
      },
      'video-tool-keying': { selector: '.act-keying', nodeTypes: ['source-video', 'ai-video', 'video'] },
      'video-tool-hd': { selector: '.act-hd', nodeTypes: ['source-video', 'ai-video', 'video'] },
      'video-tool-fullscreen': {
        selector: '.act-fullscreen',
        nodeTypes: ['source-video', 'ai-video', 'video'],
      },
      'video-tool-download': { selector: '.act-download', nodeTypes: ['source-video', 'ai-video', 'video'] },
      'audio-tool-clip': { selector: '.clip-btn', nodeTypes: ['source-audio', 'ai-audio', 'audio'] },
      'audio-tool-speed': { selector: '.speed-btn', nodeTypes: ['source-audio', 'ai-audio', 'audio'] },
      'audio-tool-download': { selector: '.download-btn', nodeTypes: ['source-audio', 'ai-audio', 'audio'] },
      'clip-tool-crop': { selector: '.media-clip-tool-crop', nodeTypes: ['media-clip'] },
      'text-tool-copy': { selector: '.act-copy', nodeTypes: ['source-text', 'ai-text', 'text'] },
      'text-tool-fullscreen': { selector: '.act-fullscreen', nodeTypes: ['source-text', 'ai-text', 'text'] },
    };
  function run2() {
    const el = document.getElementById('v2-wrap');
    return !!el?.classList.contains('is-audio-clip-mode');
  }
  function run3(enabled2 = store.getState()) {
    return (
      !!enabled2.matting?.active ||
      !!enabled2.annotate?.active ||
      !!enabled2.videoClip?.active ||
      !!enabled2.videoKeying?.active ||
      run2()
    );
  }
  function run4(result = store.getState()) {
    const list = Array.isArray(result?.selectedNodeIds) ? result.selectedNodeIds : [];
    if (list.length !== 1) return false;
    const nodeId = list[0],
      data = result?.nodes?.[nodeId] || null;
    if (data?.type !== 'media-clip' || data?.mediaClip?.expanded !== true) return false;
    const options =
      typeof CustomEvent === 'function'
        ? new CustomEvent(MEDIA_CLIP_DELETE_MATERIAL_EVENT, { detail: { nodeId: nodeId } })
        : { type: MEDIA_CLIP_DELETE_MATERIAL_EVENT, detail: { nodeId: nodeId } };
    return (window.dispatchEvent?.(options), true);
  }
  function exitActiveFeatureModes() {
    let target = false;
    (run2() || AudioClipController.active) && (AudioClipController.exit?.({ silent: true }), (target = true));
    const source = store.getState();
    return (
      source.annotate?.active && (ImageAnnotateController.exit?.({ silent: true }), (target = true)),
      source.matting?.active && (ImageMattingController.exit?.({ silent: true }), (target = true)),
      target
    );
  }
  function triggerSelectedNodeToolbarAction(next) {
    const enabled3 = index[next];
    if (!enabled3) return false;
    const current = store.getState();
    if (run3(current)) return false;
    const { selectedNodeIds: selectedNodeIds, nodes: nodes } = current;
    if (!Array.isArray(selectedNodeIds) || selectedNodeIds.length !== 1) return false;
    const entry = selectedNodeIds[0],
      enabled4 = nodes?.[entry];
    if (!enabled4 || !enabled3.nodeTypes.includes(enabled4.type)) return false;
    const el2 = document.getElementById(entry);
    if (!el2) return false;
    const el3 = el2.querySelector(enabled3.selector);
    if (!el3) return false;
    if (next.startsWith('audio-tool-'))
      try {
        const pointerEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        });
        return (el3.dispatchEvent(pointerEvent), true);
      } catch {
        const mouseEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
        return (el3.dispatchEvent(mouseEvent), true);
      }
    if (typeof el3.click !== 'function') return false;
    return (el3.click(), true);
  }
  function triggerSelectedNodeReferenceButton() {
    const record = store.getState();
    if (run3(record)) return false;
    if (record?.ui?.promptAttachmentButtonHidden === true) return false;
    const list2 = Array.isArray(record?.selectedNodeIds) ? record.selectedNodeIds : [];
    if (list2.length !== 1) return false;
    const el4 = document.getElementById(list2[0]),
      el5 = el4?.querySelector?.('.prompt-attachment-btn');
    if (!el5 || typeof el5.click !== 'function') return false;
    return (el5.click(), true);
  }
  function run5() {
    const payload = store.getStateRaw ? store.getStateRaw() : store.getState(),
      list3 = Array.isArray(payload?.selectedNodeIds) ? payload.selectedNodeIds : [];
    if (list3.length !== 1) return null;
    const nodeId2 = list3[0],
      node = payload?.nodes?.[nodeId2];
    if (!node || (node.type !== 'panorama-scene' && node.type !== 'panorama-360')) return null;
    const sceneState = node.type === 'panorama-360' ? node.panorama360Node || null : node.sceneNode || null;
    return {
      nodeId: nodeId2,
      node: node,
      sceneState: sceneState,
      supportsCamera: node.type === 'panorama-scene',
    };
  }
  function run6({ nodeId: nodeId3, mode: mode, slot: slot }) {
    const slot2 = Number(slot);
    if (!Number.isInteger(slot2) || slot2 < 1 || slot2 > 10) return;
    window.dispatchEvent(
      new CustomEvent('panorama-scene:camera-shortcut', {
        detail: { nodeId: nodeId3, mode: mode === 'save' ? 'save' : 'activate', slot: slot2 },
      }),
    );
  }
  function run7({ nodeId: nodeId4 }) {
    const nodeId5 = String(nodeId4 || '').trim();
    if (!nodeId5) return;
    window.dispatchEvent(new CustomEvent('panorama-scene:capture-shortcut', { detail: { nodeId: nodeId5 } }));
  }
  function run8(handle) {
    const nodeId6 = String(handle?.nodeId || '').trim();
    if (!nodeId6) return;
    const state = store.getStateRaw ? store.getStateRaw() : store.getState(),
      enabled5 = state?.nodes?.[nodeId6];
    if (!enabled5) return;
    if (enabled5.type !== 'panorama-scene' && enabled5.type !== 'panorama-360') return;
    (store.setSelectedNodes?.([nodeId6]),
      setPanoramaSceneEditing({ nodeId: nodeId6, isEditing: true, storeInstance: store }));
  }
  function run9() {
    const run10 = (config, scope = 800) => {
      const input = store.getState(),
        enabled6 = input?.nodes?.[config];
      if (!enabled6 || enabled6.type !== 'comment-note') return false;
      const nodesWorldBounds = computeNodesWorldBounds(input?.nodes || {}, [config]),
        browserViewportRect = getBrowserViewportRect({
          windowObject: typeof window !== 'undefined' ? window : undefined,
          containerEl: wrap,
        }),
        { viewportAlignX: viewportAlignX, viewportAlignY: viewportAlignY } = readCommentNoteJumpFocusPref(),
        box = computeViewportForWorldBounds(nodesWorldBounds, browserViewportRect, {
          fixedZoom: resolveJumpZoom(enabled6?.jumpShortcut?.zoomPercent),
          worldAlignX: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          worldAlignY: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          viewportAlignX: viewportAlignX,
          viewportAlignY: viewportAlignY,
        });
      if (!box) return false;
      clearTrackedFocus?.('comment-note-jump');
      const box2 = input?.viewport || { x: 0, y: 0, zoom: 1 };
      if (typeof animateViewport === 'function')
        return (animateViewport(box2.x, box2.y, box2.zoom, box.x, box.y, box.zoom, scope), true);
      return (store.updateViewport?.(box.x, box.y, box.zoom), store.markViewportPersist?.(), true);
    };
    addShortcutListener((list4) => {
      if (typeof list4 === 'string' && list4.startsWith('comment-note-jump::')) {
        const output = list4.slice('comment-note-jump::'.length);
        run10(output, 800);
        return;
      }
      const nodeId7 = run5();
      switch (list4) {
        case 'panorama-scene-tool-toggle-mouse': {
          if (!nodeId7?.sceneState?.ui?.isEditing) break;
          const value2 = String(nodeId7.sceneState?.ui?.activeTool || '').trim(),
            value3 = String(
              nodeId7.sceneState?.ui?.mouseTool || nodeId7.sceneState?.ui?.activeTool || '',
            ).trim(),
            value4 = value2 === 'move' || value2 === 'rotate' || value2 === 'scale',
            tool = value4 ? 'navigate' : value3 === 'box-select' ? 'navigate' : 'box-select';
          setPanoramaSceneTool({ nodeId: nodeId7.nodeId, tool: tool });
          break;
        }
        case 'panorama-scene-tool-move':
        case 'panorama-scene-tool-scale':
        case 'panorama-scene-tool-rotate': {
          if (!nodeId7?.sceneState?.ui?.isEditing) break;
          const tool2 =
            list4 === 'panorama-scene-tool-move'
              ? 'move'
              : list4 === 'panorama-scene-tool-scale'
                ? 'scale'
                : 'rotate';
          setPanoramaSceneTool({ nodeId: nodeId7.nodeId, tool: tool2 });
          break;
        }
        case 'panorama-scene-reset-view': {
          if (!nodeId7?.sceneState?.ui?.isEditing) break;
          resetPanoramaSceneView({ nodeId: nodeId7.nodeId });
          break;
        }
        case 'panorama-scene-capture': {
          if (!nodeId7?.sceneState?.ui?.isEditing) break;
          run7({ nodeId: nodeId7.nodeId });
          break;
        }
        case 'panorama-scene-camera-create': {
          if (!nodeId7?.sceneState?.ui?.isEditing || nodeId7?.supportsCamera !== true) break;
          triggerSelectedNodeToolbarAction(list4);
          break;
        }
        case 'ms-sync-video-play': {
          const state2 = store.getState(),
            selectedIds = Array.isArray(state2?.selectedNodeIds) ? state2.selectedNodeIds : [];
          selectedIds.length >= 2 &&
            void syncPlaySelectedVideos2({ selectedIds: selectedIds, state: state2 });
          break;
        }
        case 'image-tool-matting':
        case 'image-tool-repaint':
        case 'image-tool-erase':
        case 'image-tool-hd':
        case 'image-tool-expand':
        case 'image-tool-auto-subject':
        case 'image-tool-multigrid':
        case 'image-tool-multiangle':
        case 'image-tool-annotate':
        case 'image-tool-crop':
        case 'image-tool-fullscreen':
        case 'image-tool-download':
        case 'video-tool-clip':
        case 'video-tool-separate-av':
        case 'video-tool-capture-frame':
        case 'video-tool-keying':
        case 'video-tool-hd':
        case 'video-tool-fullscreen':
        case 'video-tool-download':
        case 'audio-tool-clip':
        case 'audio-tool-speed':
        case 'audio-tool-download':
        case 'clip-tool-crop':
        case 'text-tool-copy':
        case 'text-tool-fullscreen':
          triggerSelectedNodeToolbarAction(list4);
          break;
        case 'delete': {
          const value5 = store.getState();
          if (value5.annotate?.active) {
            ImageAnnotateController?.deleteSelectedTextCommand?.();
            break;
          }
          if (value5.matting?.active) break;
          if (nodeId7?.sceneState?.ui?.isEditing) {
            deleteSelectedPanoramaSceneObject({ nodeId: nodeId7.nodeId });
            break;
          }
          if (run4(value5)) break;
          const list5 = value5.selectedNodeIds;
          list5.length > 0 && (store.deleteNodes(list5), store.clearSelection(), commit());
          break;
        }
        case 'undo': {
          const value6 = store.getState();
          if (value6.annotate?.active) ImageAnnotateController._undo?.call(ImageAnnotateController);
          else
            value6.matting?.active
              ? ImageMattingController._undo?.call(ImageMattingController)
              : (undo(), nodeId7?.sceneState?.ui?.isEditing && run8(nodeId7));
          break;
        }
        case 'redo': {
          const value7 = store.getState();
          if (value7.annotate?.active) ImageAnnotateController._redo?.call(ImageAnnotateController);
          else
            value7.matting?.active
              ? ImageMattingController._redo?.call(ImageMattingController)
              : (redo(), nodeId7?.sceneState?.ui?.isEditing && run8(nodeId7));
          break;
        }
        case 'copy':
          executeCommand('copy');
          break;
        case 'copy-media': {
          const list6 = store.getState().selectedNodeIds;
          if (!Array.isArray(list6) || list6.length !== 1) {
            window.showToast?.(t('appBusinessEvents.copyMedia.selectSingleImageNode'), 'warn');
            break;
          }
          const value8 = store.getState().nodes?.[list6[0]],
            enabled7 =
              value8 &&
              (value8.type === 'source-image' || value8.type === 'ai-image' || value8.type === 'storyboard');
          if (!enabled7) {
            window.showToast?.(t('appBusinessEvents.copyMedia.selectSingleImageNode'), 'warn');
            break;
          }
          void copyNodeMediaToSystemClipboard(value8)
            .then((response) => {
              if (response?.ok) {
                (markSystemClipboardWrite({ mediaType: String(response?.mimeType || 'image/png') }),
                  window.showToast?.(t('appBusinessEvents.copyMedia.copied'), 'success'));
                return;
              }
              if (response?.reason === 'no-media') {
                window.showToast?.(t('appBusinessEvents.copyMedia.noMedia'), 'warn');
                return;
              }
              if (response?.reason === 'not-supported') {
                window.showToast?.(t('appBusinessEvents.copyMedia.clipboardUnsupported'), 'warn');
                return;
              }
              window.showToast?.(t('appBusinessEvents.copyMedia.copyFailed'), 'error');
            })
            .catch(() => {
              window.showToast?.(t('appBusinessEvents.copyMedia.copyFailed'), 'error');
            });
          break;
        }
        case 'canvas-screenshot': {
          void startCanvasScreenshot({
            createImageNodeFromBlob: createImageNodeFromBlob,
            showToast: (...args) => window.showToast?.(...args),
          });
          break;
        }
        case 'cut': {
          const list7 = store.getState().selectedNodeIds;
          if (Array.isArray(list7) && list7.length > 0) {
            const ids = [...list7];
            (executeCommand('copy', { ids: ids }), executeCommand('delete_nodes', { ids: ids }));
          }
          break;
        }
        case 'paste':
          handlePasteFromClipboard();
          break;
        case 'group':
          executeCommand('create_group');
          break;
        case 'align-feature':
        case 'align-feature-toggle':
        case 'align-feature-hold-start':
        case 'align-feature-hold-end': {
          const value9 = store.getState();
          if (value9?.ui?.alignFeatureEnabled === false) break;
          if (list4 === 'align-feature-hold-end') {
            store.setAlignPanelVisible(false);
            break;
          }
          const list8 = Array.isArray(value9?.selectedNodeIds) ? value9.selectedNodeIds : [];
          if (list8.length < 2) break;
          const list9 = getAlignableSelectionNodes(value9?.nodes || {}, list8);
          if (list9.length < 2) break;
          if (list4 === 'align-feature-hold-start') {
            const value10 = run(value9);
            (store.setAlignPanelAnchorWorld?.(value10), store.setAlignPanelVisible(true));
            break;
          }
          if (list4 === 'align-feature-toggle' || list4 === 'align-feature') {
            const value11 = value9?.ui?.alignPanelVisible === true;
            if (value11) store.setAlignPanelVisible(false);
            else {
              const value12 = run(value9);
              (store.setAlignPanelAnchorWorld?.(value12), store.setAlignPanelVisible(true));
            }
          }
          break;
        }
        case 'select-all': {
          const value13 = store.getState().nodes;
          store.setSelection(Object.keys(value13));
          break;
        }
        case 'fit-all': {
          if (nodeId7?.sceneState?.ui?.isEditing) {
            focusPanoramaSceneSelection({ nodeId: nodeId7.nodeId });
            break;
          }
          const { nodes: nodes2, selectedNodeIds: selectedNodeIds2 } = store.getState(),
            list10 =
              selectedNodeIds2 && selectedNodeIds2.length > 0
                ? selectedNodeIds2.filter((item2) => nodes2[item2])
                : Object.keys(nodes2 || {});
          if (list10.length === 0) break;
          focusNodes?.(list10, 80, 800);
          break;
        }
        case 'minimap': {
          const el6 = document.getElementById('minimapWrapper'),
            el7 = document.getElementById('btnMinimap');
          if (el6) {
            el6.classList.toggle('open');
            if (el7) el7.classList.toggle('active', el6.classList.contains('open'));
          }
          break;
        }
        case 'zoom-in':
        case 'zoom-out': {
          clearTrackedFocus?.('shortcut-zoom');
          const { viewport: viewport } = store.getState(),
            value14 = list4 === 'zoom-in' ? 1.1 : 0.9,
            value15 = Math.min(2, Math.max(0.2, viewport.zoom * value14)),
            value16 = window.innerWidth / 2,
            value17 = window.innerHeight / 2,
            value18 = value16 - (value16 - viewport.x) * (value15 / viewport.zoom),
            value19 = value17 - (value17 - viewport.y) * (value15 / viewport.zoom);
          store.updateViewport(value18, value19, value15);
          break;
        }
        case 'snap-guides': {
          const value20 = store.getState(),
            enabled8 = !(value20?.ui?.snapGuidesEnabled !== false);
          (store.setSnapGuidesEnabled(enabled8), (window.v2SnapGuides = enabled8));
          if (!enabled8) window._clearSnapGuideLines?.();
          (window.dispatchEvent(new CustomEvent('v2-snap-guides-changed', { detail: { enabled: enabled8 } })),
            window.showToast?.(
              enabled8
                ? t('appBusinessEvents.toggles.snapGuides.on')
                : t('appBusinessEvents.toggles.snapGuides.off'),
            ));
          break;
        }
        case 'snap-grid': {
          const snapGridEnabled = applySnapGridEnabled(!readSnapGridEnabled());
          window.showToast?.(
            snapGridEnabled
              ? t('appBusinessEvents.toggles.snapGrid.on')
              : t('appBusinessEvents.toggles.snapGrid.off'),
          );
          break;
        }
        case 'grid-dots': {
          const setGridDotsPref2 = setGridDotsPref(!readGridDotsPref());
          window.showToast?.(
            setGridDotsPref2
              ? t('appBusinessEvents.toggles.gridDots.on')
              : t('appBusinessEvents.toggles.gridDots.off'),
          );
          break;
        }
        case 'toggle-connection-lines': {
          const value21 = store.getState(),
            visible = !(value21?.ui?.connectionLinesVisible !== false);
          (store.setConnectionLinesVisible(visible),
            window.dispatchEvent(
              new CustomEvent('v2-connection-lines-visibility-changed', { detail: { visible: visible } }),
            ),
            window.showToast?.(
              visible
                ? t('appBusinessEvents.toggles.connectionLines.on')
                : t('appBusinessEvents.toggles.connectionLines.off'),
            ));
          break;
        }
        case 'toggle-selection-related-highlight': {
          const value22 = store.getState(),
            value23 = !(value22?.ui?.selectionRelatedHighlightEnabled !== false);
          (setSelectionRelatedHighlightPref(value23, store),
            window.showToast?.(
              value23
                ? t('appBusinessEvents.toggles.selectionRelatedHighlight.on')
                : t('appBusinessEvents.toggles.selectionRelatedHighlight.off'),
            ));
          break;
        }
        case 'toggle-video-meta': {
          const value24 = store.getState(),
            value25 = !(value24?.ui?.showVideoMeta === true);
          (setVideoMetaPref(value25, store),
            window.showToast?.(
              value25
                ? t('appBusinessEvents.toggles.videoMeta.on')
                : t('appBusinessEvents.toggles.videoMeta.off'),
            ));
          break;
        }
        case 'toggle-title-follows-zoom': {
          const value26 = store.getState(),
            value27 = !(value26?.ui?.titleFollowsCanvasZoom === true);
          (setTitleFollowsCanvasZoomPref(value27, store),
            window.showToast?.(
              value27
                ? t('appBusinessEvents.toggles.titleFollowsZoom.on')
                : t('appBusinessEvents.toggles.titleFollowsZoom.off'),
            ));
          break;
        }
        case 'toggle-media-node-resize': {
          const value28 = store.getState(),
            value29 = !(value28?.ui?.imageVideoNodeResizeEnabled === true);
          (setImageVideoNodeResizePref(value29, store),
            window.showToast?.(
              value29
                ? t('appBusinessEvents.toggles.mediaNodeResize.on')
                : t('appBusinessEvents.toggles.mediaNodeResize.off'),
            ));
          break;
        }
        case 'toggle-prompt-box-resize': {
          const value30 = store.getState(),
            value31 = !(value30?.ui?.promptBoxResizeEnabled !== false);
          (setPromptBoxResizePref(value31, store),
            window.showToast?.(
              value31
                ? t('appBusinessEvents.toggles.promptBoxResize.on')
                : t('appBusinessEvents.toggles.promptBoxResize.off'),
            ));
          break;
        }
        case 'toggle-node-avoid-overlap': {
          const value32 = !(window.v2NodeAvoidOverlap !== false);
          (setNodeAvoidOverlapPref(value32),
            window.showToast?.(
              value32
                ? t('appBusinessEvents.toggles.nodeAvoidOverlap.on')
                : t('appBusinessEvents.toggles.nodeAvoidOverlap.off'),
            ));
          break;
        }
        case 'reset-media-size': {
          const value33 = store.getState();
          if (run3(value33)) break;
          const ids2 = Array.isArray(value33?.selectedNodeIds) ? value33.selectedNodeIds : [];
          if (ids2.length === 0) break;
          const enabled9 = ids2.some((item3) => {
            const value34 = value33?.nodes?.[item3]?.type;
            return (
              value34 === 'source-image' ||
              value34 === 'ai-image' ||
              value34 === 'source-video' ||
              value34 === 'ai-video'
            );
          });
          if (!enabled9) break;
          executeCommand('reset_source_media_size', { ids: ids2 });
          break;
        }
        case 'add-reference':
          triggerSelectedNodeReferenceButton();
          break;
        case 'create-text':
          if (store.getState().matting?.active) break;
          {
            const { width: width, height: height } = getNodeDefaultSize('source-text');
            createNodeAtCursor('source-text', width, height, t('appBusinessEvents.nodeDefaults.sourceText'));
          }
          break;
        case 'create-comment-note': {
          if (store.getState().matting?.active) break;
          const { width: width2, height: height2 } = getNodeDefaultSize('comment-note');
          createNodeAtCursor('comment-note', width2, height2, '');
          break;
        }
        case 'create-ai-text':
          if (store.getState().matting?.active) break;
          {
            const box3 =
              typeof getAIGenerationDefaultSizeByType === 'function'
                ? getAIGenerationDefaultSizeByType('ai-text')
                : { width: 300, height: 300 };
            createNodeAtCursor(
              'ai-text',
              box3.width,
              box3.height,
              t('appBusinessEvents.nodeDefaults.aiText'),
            );
          }
          break;
        case 'create-ai-image':
          if (store.getState().matting?.active) break;
          {
            const box4 =
              typeof getAIGenerationDefaultSizeByType === 'function'
                ? getAIGenerationDefaultSizeByType('ai-image')
                : { width: 288, height: 288 };
            createNodeAtCursor(
              'ai-image',
              box4.width,
              box4.height,
              t('appBusinessEvents.nodeDefaults.aiImage'),
            );
          }
          break;
        case 'create-ai-video':
          if (store.getState().matting?.active) break;
          {
            const box5 =
              typeof getAIGenerationDefaultSizeByType === 'function'
                ? getAIGenerationDefaultSizeByType('ai-video')
                : { width: 288, height: 288 };
            createNodeAtCursor(
              'ai-video',
              box5.width,
              box5.height,
              t('appBusinessEvents.nodeDefaults.aiVideo'),
            );
          }
          break;
        case 'create-ai-audio':
          if (store.getState().matting?.active) break;
          {
            const box6 =
              typeof getAIGenerationDefaultSizeByType === 'function'
                ? getAIGenerationDefaultSizeByType('ai-audio')
                : { width: 288, height: 288 };
            createNodeAtCursor(
              'ai-audio',
              box6.width,
              box6.height,
              t('appBusinessEvents.nodeDefaults.aiAudio'),
            );
          }
          break;
        case 'create-scene-detection':
          if (store.getState().matting?.active) break;
          createNodeAtCursor(
            'scene-detection',
            400,
            500,
            t('appBusinessEvents.nodeDefaults.sceneDetection'),
          );
          break;
        case 'save':
          typeof window._v2SaveProjectFromShortcut === 'function'
            ? window._v2SaveProjectFromShortcut()
            : window._openSaveDialog?.();
          break;
        case 'open-settings': {
          toggleSettingsPanel();
          break;
        }
        case 'toggle-agent': {
          toggleAgentPanel?.();
          break;
        }
        case 'open-canvas-projects':
          toggleSidebarSubmenu('canvas-project');
          break;
        case 'open-assets':
          toggleSidebarSubmenu('assets');
          break;
        case 'open-workflows':
          toggleSidebarSubmenu('workflows');
          break;
        case 'open-files':
          toggleSidebarSubmenu('files');
          break;
        case 'open-task-center':
          toggleSidebarSubmenu('tasks');
          break;
        case 'editor-tool-brush':
        case 'editor-tool-rect':
        case 'editor-tool-eraser':
        case 'editor-tool-bucket':
        case 'editor-tool-text': {
          const value35 = store.getState(),
            tool3 =
              list4 === 'editor-tool-rect'
                ? 'rect'
                : list4 === 'editor-tool-eraser'
                  ? 'eraser'
                  : list4 === 'editor-tool-bucket'
                    ? 'bucket'
                    : list4 === 'editor-tool-text'
                      ? 'text'
                      : 'brush';
          if (value35.annotate?.active)
            ImageAnnotateController._setTool
              ? ImageAnnotateController._setTool.call(ImageAnnotateController, tool3)
              : store.setAnnotateState({ tool: tool3 });
          else {
            if (value35.matting?.active) {
              if (tool3 === 'rect') break;
              if (document.activeElement?.tagName === 'INPUT') document.activeElement.blur();
              ImageMattingController._switchTool?.call(ImageMattingController, tool3);
            }
          }
          break;
        }
        case 'editor-clear': {
          const value36 = store.getState();
          if (value36.annotate?.active) ImageAnnotateController._clear?.call(ImageAnnotateController);
          else value36.matting?.active && ImageMattingController._clear?.call(ImageMattingController);
          break;
        }
        case 'escape-all': {
          if (exitActiveFeatureModes()) break;
          if (nodeId7?.sceneState?.ui?.isEditing) {
            setPanoramaSceneEditing({ nodeId: nodeId7.nodeId, isEditing: false });
            break;
          }
          const { nodes: nodes3 } = store.getState();
          let value37 = false;
          for (const value38 in nodes3) {
            nodes3[value38].type === 'storyboard' &&
              nodes3[value38].isEditing &&
              (store.updateNodeData(value38, { isEditing: false }), (value37 = true));
          }
          if (value37) commit();
          const value39 = store.getState().pickConnectMode;
          if (value39 && value39.active) store.setPickConnectMode({ active: false });
          (closeShortcuts(),
            ImageAnnotateController.exit?.({ silent: true }),
            ImageMattingController.exit?.({ silent: true }),
            document.getElementById('avatarMenu')?.classList.remove('open'),
            document.querySelector('.canvas-proj-dropdown')?.classList.remove('open'),
            document.getElementById('aboutOverlay') &&
              (document.getElementById('aboutOverlay').style.display = 'none'),
            document.getElementById('v2PickerOverlay')?.remove(),
            document.querySelector('.v2-canvas-ctx-menu')?.remove(),
            document.querySelector('.v2-node-picker')?.remove(),
            document.querySelector('.v2-quote-menu')?.remove());
          document.getElementById('nodeMenu') && (document.getElementById('nodeMenu').style.display = 'none');
          document.getElementById('nodeModal') &&
            (document.getElementById('nodeModal').style.display = 'none');
          document.getElementById('settingsOverlay') &&
            (document.getElementById('settingsOverlay').style.display = 'none');
          document.getElementById('imageViewerOverlay') &&
            (document.getElementById('imageViewerOverlay').style.display = 'none');
          (store.setAlignPanelVisible(false), store.clearSelection());
          break;
        }
        case 'panorama-scene-camera-1':
        case 'panorama-scene-camera-2':
        case 'panorama-scene-camera-3':
        case 'panorama-scene-camera-4':
        case 'panorama-scene-camera-5':
        case 'panorama-scene-camera-6':
        case 'panorama-scene-camera-7':
        case 'panorama-scene-camera-8':
        case 'panorama-scene-camera-9':
        case 'panorama-scene-camera-0': {
          if (!nodeId7?.sceneState?.ui?.isEditing || nodeId7?.supportsCamera !== true) break;
          const value40 = list4.slice(-1),
            slot3 = value40 === '0' ? 10 : Number(value40);
          run6({ nodeId: nodeId7.nodeId, mode: 'activate', slot: slot3 });
          break;
        }
        case 'panorama-scene-camera-save-1':
        case 'panorama-scene-camera-save-2':
        case 'panorama-scene-camera-save-3':
        case 'panorama-scene-camera-save-4':
        case 'panorama-scene-camera-save-5':
        case 'panorama-scene-camera-save-6':
        case 'panorama-scene-camera-save-7':
        case 'panorama-scene-camera-save-8':
        case 'panorama-scene-camera-save-9':
        case 'panorama-scene-camera-save-0': {
          if (!nodeId7?.sceneState?.ui?.isEditing || nodeId7?.supportsCamera !== true) break;
          const value41 = list4.slice(-1),
            slot4 = value41 === '0' ? 10 : Number(value41);
          run6({ nodeId: nodeId7.nodeId, mode: 'save', slot: slot4 });
          break;
        }
      }
    });
  }
  function run11() {
    window.addEventListener('v2:canvas-paste-request', (value42) => {
      handlePasteFromClipboard(value42?.detail || {});
    });
  }
  function bindAll() {
    (run11(), run9(), initCanvasContextMenu?.(wrap));
  }
  return {
    bindAll: bindAll,
    triggerSelectedNodeToolbarAction: triggerSelectedNodeToolbarAction,
    triggerSelectedNodeReferenceButton: triggerSelectedNodeReferenceButton,
    exitActiveFeatureModes: exitActiveFeatureModes,
  };
}
