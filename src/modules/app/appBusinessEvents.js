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
  store: _0x32dcba,
  wrap: _0x179f20,
  addShortcutListener: _0x1d32af,
  executeCommand: _0x53a386,
  undo: _0x20fac5,
  redo: _0x1e5260,
  commit: _0x3205d7,
  closeShortcuts: _0x1daad8,
  getNodeDefaultSize: _0x545ff0,
  getAIGenerationDefaultSizeByType: _0x112324,
  createNodeAtCursor: _0x4095f1,
  createImageNodeFromBlob: _0x3deafb,
  animateViewport: _0x26060e,
  focusNodeAtZoomPercent: _0x3ba4e5,
  focusNodes: _0x151171,
  clearTrackedFocus: _0x52c0ad,
  handlePasteFromClipboard: _0x5dd9a4,
  initCanvasContextMenu: _0x2324a4,
  toggleAgentPanel: _0x15877d,
  ImageAnnotateController: _0x36c7d5,
  ImageMattingController: _0x3fac6d,
  AudioClipController: _0x22bc6d,
  syncPlaySelectedVideos: _0x14cb73 = syncPlaySelectedVideos,
} = {}) {
  const _0x2f3d51 = (_0x18796d) => {
      const _0x4a20a8 = _0x18796d?.viewport;
      if (!_0x4a20a8) return null;
      const _0x3a2f27 = Number(window?._lastMx),
        _0x546c2c = Number(window?._lastMy);
      if (!Number.isFinite(_0x3a2f27) || !Number.isFinite(_0x546c2c)) return null;
      const _0x24bbad = screenToWorld(_0x3a2f27, _0x546c2c, _0x4a20a8);
      if (!_0x24bbad || !Number.isFinite(_0x24bbad.x) || !Number.isFinite(_0x24bbad.y)) return null;
      return { x: _0x24bbad.x, y: _0x24bbad.y };
    },
    _0x2be6a3 = {
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
  function _0x21d535() {
    const _0x5a4d25 = document.getElementById('v2-wrap');
    return !!_0x5a4d25?.classList.contains('is-audio-clip-mode');
  }
  function _0x5a7423(_0x1685fc = _0x32dcba.getState()) {
    return (
      !!_0x1685fc.matting?.active ||
      !!_0x1685fc.annotate?.active ||
      !!_0x1685fc.videoClip?.active ||
      !!_0x1685fc.videoKeying?.active ||
      _0x21d535()
    );
  }
  function _0x52dfae(_0x21d1aa = _0x32dcba.getState()) {
    const _0x292449 = Array.isArray(_0x21d1aa?.selectedNodeIds) ? _0x21d1aa.selectedNodeIds : [];
    if (_0x292449.length !== 1) return false;
    const _0x46717c = _0x292449[0],
      _0x382289 = _0x21d1aa?.nodes?.[_0x46717c] || null;
    if (_0x382289?.type !== 'media-clip' || _0x382289?.mediaClip?.expanded !== true) return false;
    const _0x4fa3e4 =
      typeof CustomEvent === 'function'
        ? new CustomEvent(MEDIA_CLIP_DELETE_MATERIAL_EVENT, { detail: { nodeId: _0x46717c } })
        : { type: MEDIA_CLIP_DELETE_MATERIAL_EVENT, detail: { nodeId: _0x46717c } };
    return (window.dispatchEvent?.(_0x4fa3e4), true);
  }
  function _0xdb0c98() {
    let _0x206579 = false;
    (_0x21d535() || _0x22bc6d.active) && (_0x22bc6d.exit?.({ silent: true }), (_0x206579 = true));
    const _0x4c26a = _0x32dcba.getState();
    return (
      _0x4c26a.annotate?.active && (_0x36c7d5.exit?.({ silent: true }), (_0x206579 = true)),
      _0x4c26a.matting?.active && (_0x3fac6d.exit?.({ silent: true }), (_0x206579 = true)),
      _0x206579
    );
  }
  function _0x4e3545(_0x3f09dc) {
    const _0x2d771a = _0x2be6a3[_0x3f09dc];
    if (!_0x2d771a) return false;
    const _0x2206d8 = _0x32dcba.getState();
    if (_0x5a7423(_0x2206d8)) return false;
    const { selectedNodeIds: _0xb099ab, nodes: _0xe91834 } = _0x2206d8;
    if (!Array.isArray(_0xb099ab) || _0xb099ab.length !== 1) return false;
    const _0x3f553a = _0xb099ab[0],
      _0x4f1939 = _0xe91834?.[_0x3f553a];
    if (!_0x4f1939 || !_0x2d771a.nodeTypes.includes(_0x4f1939.type)) return false;
    const _0x44bc84 = document.getElementById(_0x3f553a);
    if (!_0x44bc84) return false;
    const _0x317471 = _0x44bc84.querySelector(_0x2d771a.selector);
    if (!_0x317471) return false;
    if (_0x3f09dc.startsWith('audio-tool-'))
      try {
        const _0x582f64 = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        });
        return (_0x317471.dispatchEvent(_0x582f64), true);
      } catch {
        const _0x3b6d7c = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
        return (_0x317471.dispatchEvent(_0x3b6d7c), true);
      }
    if (typeof _0x317471.click !== 'function') return false;
    return (_0x317471.click(), true);
  }
  function _0x5b8012() {
    const _0x37b6e5 = _0x32dcba.getState();
    if (_0x5a7423(_0x37b6e5)) return false;
    if (_0x37b6e5?.ui?.promptAttachmentButtonHidden === true) return false;
    const _0x2d1e5c = Array.isArray(_0x37b6e5?.selectedNodeIds) ? _0x37b6e5.selectedNodeIds : [];
    if (_0x2d1e5c.length !== 1) return false;
    const _0x9da8c8 = document.getElementById(_0x2d1e5c[0]),
      _0x4be0b9 = _0x9da8c8?.querySelector?.('.prompt-attachment-btn');
    if (!_0x4be0b9 || typeof _0x4be0b9.click !== 'function') return false;
    return (_0x4be0b9.click(), true);
  }
  function _0x170b36() {
    const _0x3ca9db = _0x32dcba.getStateRaw ? _0x32dcba.getStateRaw() : _0x32dcba.getState(),
      _0x48120a = Array.isArray(_0x3ca9db?.selectedNodeIds) ? _0x3ca9db.selectedNodeIds : [];
    if (_0x48120a.length !== 1) return null;
    const _0x198281 = _0x48120a[0],
      _0x2a18f4 = _0x3ca9db?.nodes?.[_0x198281];
    if (!_0x2a18f4 || (_0x2a18f4.type !== 'panorama-scene' && _0x2a18f4.type !== 'panorama-360')) return null;
    const _0x33fa81 =
      _0x2a18f4.type === 'panorama-360' ? _0x2a18f4.panorama360Node || null : _0x2a18f4.sceneNode || null;
    return {
      nodeId: _0x198281,
      node: _0x2a18f4,
      sceneState: _0x33fa81,
      supportsCamera: _0x2a18f4.type === 'panorama-scene',
    };
  }
  function _0x2329dc({ nodeId: _0xc7060a, mode: _0x19fdc4, slot: _0xd38ef5 }) {
    const _0x32e5bd = Number(_0xd38ef5);
    if (!Number.isInteger(_0x32e5bd) || _0x32e5bd < 1 || _0x32e5bd > 10) return;
    window.dispatchEvent(
      new CustomEvent('panorama-scene:camera-shortcut', {
        detail: { nodeId: _0xc7060a, mode: _0x19fdc4 === 'save' ? 'save' : 'activate', slot: _0x32e5bd },
      }),
    );
  }
  function _0xd35038({ nodeId: _0x1b2d89 }) {
    const _0xe35cab = String(_0x1b2d89 || '').trim();
    if (!_0xe35cab) return;
    window.dispatchEvent(
      new CustomEvent('panorama-scene:capture-shortcut', { detail: { nodeId: _0xe35cab } }),
    );
  }
  function _0x18d4e8(_0x2e9746) {
    const _0xb2f0d1 = String(_0x2e9746?.nodeId || '').trim();
    if (!_0xb2f0d1) return;
    const _0x5f5115 = _0x32dcba.getStateRaw ? _0x32dcba.getStateRaw() : _0x32dcba.getState(),
      _0x4083cc = _0x5f5115?.nodes?.[_0xb2f0d1];
    if (!_0x4083cc) return;
    if (_0x4083cc.type !== 'panorama-scene' && _0x4083cc.type !== 'panorama-360') return;
    (_0x32dcba.setSelectedNodes?.([_0xb2f0d1]),
      setPanoramaSceneEditing({ nodeId: _0xb2f0d1, isEditing: true, storeInstance: _0x32dcba }));
  }
  function _0x2cb79e() {
    const _0x2fd876 = (_0x5c68c6, _0x5cce99 = 0x320) => {
      const _0x3b25f9 = _0x32dcba.getState(),
        _0x20b312 = _0x3b25f9?.nodes?.[_0x5c68c6];
      if (!_0x20b312 || _0x20b312.type !== 'comment-note') return false;
      const _0x4ade52 = computeNodesWorldBounds(_0x3b25f9?.nodes || {}, [_0x5c68c6]),
        _0x3b2245 = getBrowserViewportRect({
          windowObject: typeof window !== 'undefined' ? window : undefined,
          containerEl: _0x179f20,
        }),
        { viewportAlignX: _0xbf51c, viewportAlignY: _0x22598b } = readCommentNoteJumpFocusPref(),
        _0x248bf5 = computeViewportForWorldBounds(_0x4ade52, _0x3b2245, {
          fixedZoom: resolveJumpZoom(_0x20b312?.jumpShortcut?.zoomPercent),
          worldAlignX: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          worldAlignY: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          viewportAlignX: _0xbf51c,
          viewportAlignY: _0x22598b,
        });
      if (!_0x248bf5) return false;
      _0x52c0ad?.('comment-note-jump');
      const _0x36a268 = _0x3b25f9?.viewport || { x: 0, y: 0, zoom: 1 };
      if (typeof _0x26060e === 'function')
        return (
          _0x26060e(
            _0x36a268.x,
            _0x36a268.y,
            _0x36a268.zoom,
            _0x248bf5.x,
            _0x248bf5.y,
            _0x248bf5.zoom,
            _0x5cce99,
          ),
          true
        );
      return (
        _0x32dcba.updateViewport?.(_0x248bf5.x, _0x248bf5.y, _0x248bf5.zoom),
        _0x32dcba.markViewportPersist?.(),
        true
      );
    };
    _0x1d32af((_0x20d5c4) => {
      if (typeof _0x20d5c4 === 'string' && _0x20d5c4.startsWith('comment-note-jump::')) {
        const _0x241e1c = _0x20d5c4.slice('comment-note-jump::'.length);
        _0x2fd876(_0x241e1c, 0x320);
        return;
      }
      const _0x5a2358 = _0x170b36();
      switch (_0x20d5c4) {
        case 'panorama-scene-tool-toggle-mouse': {
          if (!_0x5a2358?.sceneState?.ui?.isEditing) break;
          const _0x1feff1 = String(_0x5a2358.sceneState?.ui?.activeTool || '').trim(),
            _0x288b4f = String(
              _0x5a2358.sceneState?.ui?.mouseTool || _0x5a2358.sceneState?.ui?.activeTool || '',
            ).trim(),
            _0x10260d = _0x1feff1 === 'move' || _0x1feff1 === 'rotate' || _0x1feff1 === 'scale',
            _0x537984 = _0x10260d ? 'navigate' : _0x288b4f === 'box-select' ? 'navigate' : 'box-select';
          setPanoramaSceneTool({ nodeId: _0x5a2358.nodeId, tool: _0x537984 });
          break;
        }
        case 'panorama-scene-tool-move':
        case 'panorama-scene-tool-scale':
        case 'panorama-scene-tool-rotate': {
          if (!_0x5a2358?.sceneState?.ui?.isEditing) break;
          const _0x5d99f9 =
            _0x20d5c4 === 'panorama-scene-tool-move'
              ? 'move'
              : _0x20d5c4 === 'panorama-scene-tool-scale'
                ? 'scale'
                : 'rotate';
          setPanoramaSceneTool({ nodeId: _0x5a2358.nodeId, tool: _0x5d99f9 });
          break;
        }
        case 'panorama-scene-reset-view': {
          if (!_0x5a2358?.sceneState?.ui?.isEditing) break;
          resetPanoramaSceneView({ nodeId: _0x5a2358.nodeId });
          break;
        }
        case 'panorama-scene-capture': {
          if (!_0x5a2358?.sceneState?.ui?.isEditing) break;
          _0xd35038({ nodeId: _0x5a2358.nodeId });
          break;
        }
        case 'panorama-scene-camera-create': {
          if (!_0x5a2358?.sceneState?.ui?.isEditing || _0x5a2358?.supportsCamera !== true) break;
          _0x4e3545(_0x20d5c4);
          break;
        }
        case 'ms-sync-video-play': {
          const _0x5a64d0 = _0x32dcba.getState(),
            _0x21a942 = Array.isArray(_0x5a64d0?.selectedNodeIds) ? _0x5a64d0.selectedNodeIds : [];
          _0x21a942.length >= 2 && void _0x14cb73({ selectedIds: _0x21a942, state: _0x5a64d0 });
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
          _0x4e3545(_0x20d5c4);
          break;
        case 'delete': {
          const _0x39233a = _0x32dcba.getState();
          if (_0x39233a.annotate?.active) {
            _0x36c7d5?.deleteSelectedTextCommand?.();
            break;
          }
          if (_0x39233a.matting?.active) break;
          if (_0x5a2358?.sceneState?.ui?.isEditing) {
            deleteSelectedPanoramaSceneObject({ nodeId: _0x5a2358.nodeId });
            break;
          }
          if (_0x52dfae(_0x39233a)) break;
          const _0x5351b9 = _0x39233a.selectedNodeIds;
          _0x5351b9.length > 0 && (_0x32dcba.deleteNodes(_0x5351b9), _0x32dcba.clearSelection(), _0x3205d7());
          break;
        }
        case 'undo': {
          const _0x57d5e6 = _0x32dcba.getState();
          if (_0x57d5e6.annotate?.active) _0x36c7d5._undo?.call(_0x36c7d5);
          else
            _0x57d5e6.matting?.active
              ? _0x3fac6d._undo?.call(_0x3fac6d)
              : (_0x20fac5(), _0x5a2358?.sceneState?.ui?.isEditing && _0x18d4e8(_0x5a2358));
          break;
        }
        case 'redo': {
          const _0x274fe4 = _0x32dcba.getState();
          if (_0x274fe4.annotate?.active) _0x36c7d5._redo?.call(_0x36c7d5);
          else
            _0x274fe4.matting?.active
              ? _0x3fac6d._redo?.call(_0x3fac6d)
              : (_0x1e5260(), _0x5a2358?.sceneState?.ui?.isEditing && _0x18d4e8(_0x5a2358));
          break;
        }
        case 'copy':
          _0x53a386('copy');
          break;
        case 'copy-media': {
          const _0x3f5b50 = _0x32dcba.getState().selectedNodeIds;
          if (!Array.isArray(_0x3f5b50) || _0x3f5b50.length !== 1) {
            window.showToast?.(t('appBusinessEvents.copyMedia.selectSingleImageNode'), 'warn');
            break;
          }
          const _0x187c80 = _0x32dcba.getState().nodes?.[_0x3f5b50[0]],
            _0x40d484 =
              _0x187c80 &&
              (_0x187c80.type === 'source-image' ||
                _0x187c80.type === 'ai-image' ||
                _0x187c80.type === 'storyboard');
          if (!_0x40d484) {
            window.showToast?.(t('appBusinessEvents.copyMedia.selectSingleImageNode'), 'warn');
            break;
          }
          void copyNodeMediaToSystemClipboard(_0x187c80)
            .then((_0x5abeda) => {
              if (_0x5abeda?.ok) {
                (markSystemClipboardWrite({ mediaType: String(_0x5abeda?.mimeType || 'image/png') }),
                  window.showToast?.(t('appBusinessEvents.copyMedia.copied'), 'success'));
                return;
              }
              if (_0x5abeda?.reason === 'no-media') {
                window.showToast?.(t('appBusinessEvents.copyMedia.noMedia'), 'warn');
                return;
              }
              if (_0x5abeda?.reason === 'not-supported') {
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
            createImageNodeFromBlob: _0x3deafb,
            showToast: (..._0x502d0f) => window.showToast?.(..._0x502d0f),
          });
          break;
        }
        case 'cut': {
          const _0x412c03 = _0x32dcba.getState().selectedNodeIds;
          if (Array.isArray(_0x412c03) && _0x412c03.length > 0) {
            const _0x3aa181 = [..._0x412c03];
            (_0x53a386('copy', { ids: _0x3aa181 }), _0x53a386('delete_nodes', { ids: _0x3aa181 }));
          }
          break;
        }
        case 'paste':
          _0x5dd9a4();
          break;
        case 'group':
          _0x53a386('create_group');
          break;
        case 'align-feature':
        case 'align-feature-toggle':
        case 'align-feature-hold-start':
        case 'align-feature-hold-end': {
          const _0x4f90eb = _0x32dcba.getState();
          if (_0x4f90eb?.ui?.alignFeatureEnabled === false) break;
          if (_0x20d5c4 === 'align-feature-hold-end') {
            _0x32dcba.setAlignPanelVisible(false);
            break;
          }
          const _0x24fdba = Array.isArray(_0x4f90eb?.selectedNodeIds) ? _0x4f90eb.selectedNodeIds : [];
          if (_0x24fdba.length < 2) break;
          const _0x5dbb20 = getAlignableSelectionNodes(_0x4f90eb?.nodes || {}, _0x24fdba);
          if (_0x5dbb20.length < 2) break;
          if (_0x20d5c4 === 'align-feature-hold-start') {
            const _0x3d1e66 = _0x2f3d51(_0x4f90eb);
            (_0x32dcba.setAlignPanelAnchorWorld?.(_0x3d1e66), _0x32dcba.setAlignPanelVisible(true));
            break;
          }
          if (_0x20d5c4 === 'align-feature-toggle' || _0x20d5c4 === 'align-feature') {
            const _0x3d28bd = _0x4f90eb?.ui?.alignPanelVisible === true;
            if (_0x3d28bd) _0x32dcba.setAlignPanelVisible(false);
            else {
              const _0x4d03c8 = _0x2f3d51(_0x4f90eb);
              (_0x32dcba.setAlignPanelAnchorWorld?.(_0x4d03c8), _0x32dcba.setAlignPanelVisible(true));
            }
          }
          break;
        }
        case 'select-all': {
          const _0x2578b9 = _0x32dcba.getState().nodes;
          _0x32dcba.setSelection(Object.keys(_0x2578b9));
          break;
        }
        case 'fit-all': {
          if (_0x5a2358?.sceneState?.ui?.isEditing) {
            focusPanoramaSceneSelection({ nodeId: _0x5a2358.nodeId });
            break;
          }
          const { nodes: _0x444341, selectedNodeIds: _0x46960a } = _0x32dcba.getState(),
            _0x4e5d5a =
              _0x46960a && _0x46960a.length > 0
                ? _0x46960a.filter((_0x476d73) => _0x444341[_0x476d73])
                : Object.keys(_0x444341 || {});
          if (_0x4e5d5a.length === 0) break;
          _0x151171?.(_0x4e5d5a, 80, 0x320);
          break;
        }
        case 'minimap': {
          const _0x66002a = document.getElementById('minimapWrapper'),
            _0x4eb16c = document.getElementById('btnMinimap');
          if (_0x66002a) {
            _0x66002a.classList.toggle('open');
            if (_0x4eb16c) _0x4eb16c.classList.toggle('active', _0x66002a.classList.contains('open'));
          }
          break;
        }
        case 'zoom-in':
        case 'zoom-out': {
          _0x52c0ad?.('shortcut-zoom');
          const { viewport: _0x4dc325 } = _0x32dcba.getState(),
            _0x203a7b = _0x20d5c4 === 'zoom-in' ? 1.1 : 0.9,
            _0x43dca4 = Math.min(2, Math.max(0.2, _0x4dc325.zoom * _0x203a7b)),
            _0x4ecf40 = window.innerWidth / 2,
            _0x2084d4 = window.innerHeight / 2,
            _0x127e8e = _0x4ecf40 - (_0x4ecf40 - _0x4dc325.x) * (_0x43dca4 / _0x4dc325.zoom),
            _0x53e78d = _0x2084d4 - (_0x2084d4 - _0x4dc325.y) * (_0x43dca4 / _0x4dc325.zoom);
          _0x32dcba.updateViewport(_0x127e8e, _0x53e78d, _0x43dca4);
          break;
        }
        case 'snap-guides': {
          const _0x41834b = _0x32dcba.getState(),
            _0x33373e = !(_0x41834b?.ui?.snapGuidesEnabled !== false);
          (_0x32dcba.setSnapGuidesEnabled(_0x33373e), (window.v2SnapGuides = _0x33373e));
          if (!_0x33373e) window._clearSnapGuideLines?.();
          (window.dispatchEvent(
            new CustomEvent('v2-snap-guides-changed', { detail: { enabled: _0x33373e } }),
          ),
            window.showToast?.(
              _0x33373e
                ? t('appBusinessEvents.toggles.snapGuides.on')
                : t('appBusinessEvents.toggles.snapGuides.off'),
            ));
          break;
        }
        case 'snap-grid': {
          const _0x490d14 = applySnapGridEnabled(!readSnapGridEnabled());
          window.showToast?.(
            _0x490d14
              ? t('appBusinessEvents.toggles.snapGrid.on')
              : t('appBusinessEvents.toggles.snapGrid.off'),
          );
          break;
        }
        case 'grid-dots': {
          const _0x54f5d4 = setGridDotsPref(!readGridDotsPref());
          window.showToast?.(
            _0x54f5d4
              ? t('appBusinessEvents.toggles.gridDots.on')
              : t('appBusinessEvents.toggles.gridDots.off'),
          );
          break;
        }
        case 'toggle-connection-lines': {
          const _0x5497d1 = _0x32dcba.getState(),
            _0x19d14e = !(_0x5497d1?.ui?.connectionLinesVisible !== false);
          (_0x32dcba.setConnectionLinesVisible(_0x19d14e),
            window.dispatchEvent(
              new CustomEvent('v2-connection-lines-visibility-changed', { detail: { visible: _0x19d14e } }),
            ),
            window.showToast?.(
              _0x19d14e
                ? t('appBusinessEvents.toggles.connectionLines.on')
                : t('appBusinessEvents.toggles.connectionLines.off'),
            ));
          break;
        }
        case 'toggle-selection-related-highlight': {
          const _0x5a8bf5 = _0x32dcba.getState(),
            _0x5b075e = !(_0x5a8bf5?.ui?.selectionRelatedHighlightEnabled !== false);
          (setSelectionRelatedHighlightPref(_0x5b075e, _0x32dcba),
            window.showToast?.(
              _0x5b075e
                ? t('appBusinessEvents.toggles.selectionRelatedHighlight.on')
                : t('appBusinessEvents.toggles.selectionRelatedHighlight.off'),
            ));
          break;
        }
        case 'toggle-video-meta': {
          const _0x161198 = _0x32dcba.getState(),
            _0x19a074 = !(_0x161198?.ui?.showVideoMeta === true);
          (setVideoMetaPref(_0x19a074, _0x32dcba),
            window.showToast?.(
              _0x19a074
                ? t('appBusinessEvents.toggles.videoMeta.on')
                : t('appBusinessEvents.toggles.videoMeta.off'),
            ));
          break;
        }
        case 'toggle-title-follows-zoom': {
          const _0x7b23ad = _0x32dcba.getState(),
            _0x41f0e3 = !(_0x7b23ad?.ui?.titleFollowsCanvasZoom === true);
          (setTitleFollowsCanvasZoomPref(_0x41f0e3, _0x32dcba),
            window.showToast?.(
              _0x41f0e3
                ? t('appBusinessEvents.toggles.titleFollowsZoom.on')
                : t('appBusinessEvents.toggles.titleFollowsZoom.off'),
            ));
          break;
        }
        case 'toggle-media-node-resize': {
          const _0x4c1b5b = _0x32dcba.getState(),
            _0x230e1e = !(_0x4c1b5b?.ui?.imageVideoNodeResizeEnabled === true);
          (setImageVideoNodeResizePref(_0x230e1e, _0x32dcba),
            window.showToast?.(
              _0x230e1e
                ? t('appBusinessEvents.toggles.mediaNodeResize.on')
                : t('appBusinessEvents.toggles.mediaNodeResize.off'),
            ));
          break;
        }
        case 'toggle-prompt-box-resize': {
          const _0x5907fe = _0x32dcba.getState(),
            _0x2cc15d = !(_0x5907fe?.ui?.promptBoxResizeEnabled !== false);
          (setPromptBoxResizePref(_0x2cc15d, _0x32dcba),
            window.showToast?.(
              _0x2cc15d
                ? t('appBusinessEvents.toggles.promptBoxResize.on')
                : t('appBusinessEvents.toggles.promptBoxResize.off'),
            ));
          break;
        }
        case 'toggle-node-avoid-overlap': {
          const _0x388487 = !(window.v2NodeAvoidOverlap !== false);
          (setNodeAvoidOverlapPref(_0x388487),
            window.showToast?.(
              _0x388487
                ? t('appBusinessEvents.toggles.nodeAvoidOverlap.on')
                : t('appBusinessEvents.toggles.nodeAvoidOverlap.off'),
            ));
          break;
        }
        case 'reset-media-size': {
          const _0x4170e6 = _0x32dcba.getState();
          if (_0x5a7423(_0x4170e6)) break;
          const _0x51df7e = Array.isArray(_0x4170e6?.selectedNodeIds) ? _0x4170e6.selectedNodeIds : [];
          if (_0x51df7e.length === 0) break;
          const _0xb0d6f6 = _0x51df7e.some((_0x3cdb12) => {
            const _0x4ad83a = _0x4170e6?.nodes?.[_0x3cdb12]?.type;
            return (
              _0x4ad83a === 'source-image' ||
              _0x4ad83a === 'ai-image' ||
              _0x4ad83a === 'source-video' ||
              _0x4ad83a === 'ai-video'
            );
          });
          if (!_0xb0d6f6) break;
          _0x53a386('reset_source_media_size', { ids: _0x51df7e });
          break;
        }
        case 'add-reference':
          _0x5b8012();
          break;
        case 'create-text':
          if (_0x32dcba.getState().matting?.active) break;
          {
            const { width: _0x4bc670, height: _0xcb42e8 } = _0x545ff0('source-text');
            _0x4095f1('source-text', _0x4bc670, _0xcb42e8, t('appBusinessEvents.nodeDefaults.sourceText'));
          }
          break;
        case 'create-comment-note': {
          if (_0x32dcba.getState().matting?.active) break;
          const { width: _0xb54c8e, height: _0x589241 } = _0x545ff0('comment-note');
          _0x4095f1('comment-note', _0xb54c8e, _0x589241, '');
          break;
        }
        case 'create-ai-text':
          if (_0x32dcba.getState().matting?.active) break;
          {
            const _0x1733e0 =
              typeof _0x112324 === 'function' ? _0x112324('ai-text') : { width: 0x12c, height: 0x12c };
            _0x4095f1(
              'ai-text',
              _0x1733e0.width,
              _0x1733e0.height,
              t('appBusinessEvents.nodeDefaults.aiText'),
            );
          }
          break;
        case 'create-ai-image':
          if (_0x32dcba.getState().matting?.active) break;
          {
            const _0x37a4ed =
              typeof _0x112324 === 'function' ? _0x112324('ai-image') : { width: 0x120, height: 0x120 };
            _0x4095f1(
              'ai-image',
              _0x37a4ed.width,
              _0x37a4ed.height,
              t('appBusinessEvents.nodeDefaults.aiImage'),
            );
          }
          break;
        case 'create-ai-video':
          if (_0x32dcba.getState().matting?.active) break;
          {
            const _0x1a04db =
              typeof _0x112324 === 'function' ? _0x112324('ai-video') : { width: 0x120, height: 0x120 };
            _0x4095f1(
              'ai-video',
              _0x1a04db.width,
              _0x1a04db.height,
              t('appBusinessEvents.nodeDefaults.aiVideo'),
            );
          }
          break;
        case 'create-ai-audio':
          if (_0x32dcba.getState().matting?.active) break;
          {
            const _0x3b1222 =
              typeof _0x112324 === 'function' ? _0x112324('ai-audio') : { width: 0x120, height: 0x120 };
            _0x4095f1(
              'ai-audio',
              _0x3b1222.width,
              _0x3b1222.height,
              t('appBusinessEvents.nodeDefaults.aiAudio'),
            );
          }
          break;
        case 'create-scene-detection':
          if (_0x32dcba.getState().matting?.active) break;
          _0x4095f1('scene-detection', 0x190, 0x1f4, t('appBusinessEvents.nodeDefaults.sceneDetection'));
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
          _0x15877d?.();
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
          const _0x406ee0 = _0x32dcba.getState(),
            _0x140a1c =
              _0x20d5c4 === 'editor-tool-rect'
                ? 'rect'
                : _0x20d5c4 === 'editor-tool-eraser'
                  ? 'eraser'
                  : _0x20d5c4 === 'editor-tool-bucket'
                    ? 'bucket'
                    : _0x20d5c4 === 'editor-tool-text'
                      ? 'text'
                      : 'brush';
          if (_0x406ee0.annotate?.active)
            _0x36c7d5._setTool
              ? _0x36c7d5._setTool.call(_0x36c7d5, _0x140a1c)
              : _0x32dcba.setAnnotateState({ tool: _0x140a1c });
          else {
            if (_0x406ee0.matting?.active) {
              if (_0x140a1c === 'rect') break;
              if (document.activeElement?.tagName === 'INPUT') document.activeElement.blur();
              _0x3fac6d._switchTool?.call(_0x3fac6d, _0x140a1c);
            }
          }
          break;
        }
        case 'editor-clear': {
          const _0x22a916 = _0x32dcba.getState();
          if (_0x22a916.annotate?.active) _0x36c7d5._clear?.call(_0x36c7d5);
          else _0x22a916.matting?.active && _0x3fac6d._clear?.call(_0x3fac6d);
          break;
        }
        case 'escape-all': {
          if (_0xdb0c98()) break;
          if (_0x5a2358?.sceneState?.ui?.isEditing) {
            setPanoramaSceneEditing({ nodeId: _0x5a2358.nodeId, isEditing: false });
            break;
          }
          const { nodes: _0x4ee39f } = _0x32dcba.getState();
          let _0x2fd16c = false;
          for (const _0xadd367 in _0x4ee39f) {
            _0x4ee39f[_0xadd367].type === 'storyboard' &&
              _0x4ee39f[_0xadd367].isEditing &&
              (_0x32dcba.updateNodeData(_0xadd367, { isEditing: false }), (_0x2fd16c = true));
          }
          if (_0x2fd16c) _0x3205d7();
          const _0x22954b = _0x32dcba.getState().pickConnectMode;
          if (_0x22954b && _0x22954b.active) _0x32dcba.setPickConnectMode({ active: false });
          (_0x1daad8(),
            _0x36c7d5.exit?.({ silent: true }),
            _0x3fac6d.exit?.({ silent: true }),
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
          (_0x32dcba.setAlignPanelVisible(false), _0x32dcba.clearSelection());
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
          if (!_0x5a2358?.sceneState?.ui?.isEditing || _0x5a2358?.supportsCamera !== true) break;
          const _0x258926 = _0x20d5c4.slice(-1),
            _0x3c56f2 = _0x258926 === '0' ? 10 : Number(_0x258926);
          _0x2329dc({ nodeId: _0x5a2358.nodeId, mode: 'activate', slot: _0x3c56f2 });
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
          if (!_0x5a2358?.sceneState?.ui?.isEditing || _0x5a2358?.supportsCamera !== true) break;
          const _0x30bb1a = _0x20d5c4.slice(-1),
            _0x415d15 = _0x30bb1a === '0' ? 10 : Number(_0x30bb1a);
          _0x2329dc({ nodeId: _0x5a2358.nodeId, mode: 'save', slot: _0x415d15 });
          break;
        }
      }
    });
  }
  function _0x24ee61() {
    window.addEventListener('v2:canvas-paste-request', (_0x17a980) => {
      _0x5dd9a4(_0x17a980?.detail || {});
    });
  }
  function _0x56d1f5() {
    (_0x24ee61(), _0x2cb79e(), _0x2324a4?.(_0x179f20));
  }
  return {
    bindAll: _0x56d1f5,
    triggerSelectedNodeToolbarAction: _0x4e3545,
    triggerSelectedNodeReferenceButton: _0x5b8012,
    exitActiveFeatureModes: _0xdb0c98,
  };
}
