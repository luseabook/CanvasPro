import { openDebugRequestWindow } from '../debugRequestWindow.js';
import { markSystemClipboardWrite } from '../clipboard.js';
import { undo, redo, getHistoryInfo } from '../history.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { isCollageImageNode } from '../collage/collageFactory.js';
import { hasMaterialComparisonPair } from '../materialComparisonEntries.js';
import { removeContextMenus, showContextMenu } from './contextMenuPresenter.js';
import { isValidConnection } from './EdgeController.js';
import {
  CONTEXT_NODE_CREATION_SECTION_IDS,
  NODE_CREATION_UPLOAD_ITEM,
  getNodeCreationMenuSections,
} from '../nodeCreationMenuCatalog.js';
import { createNodeCreationMenuIcon } from '../nodeCreationMenuIcons.js';
import { resolveStoryboardSourceImageRef } from '../../core/storyboardFactory.js';
import { hitTestNode, screenToWorld } from '../../core/math.js';
import { PANORAMA_SCENE_DEFAULT_SIZE } from '../panoramaSceneNode/sceneNode.js';
import { STORYBOARD_SCRIPT_DEFAULT_SIZE } from '../../core/storyboardScriptFactory.js';
import {
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getNodeDefaultSize,
} from '../../services/fileService.js';
import {
  canOpenKnownFolder,
  canShowItemInFolder,
  openKnownFolder,
  resolveNodeLocalPathForNativeAction,
  showItemInFolder,
} from '../../services/nativeFileActionService.js';
import { pasteTextIntoEditableFromClipboard } from '../textInputContextMenu.js';
import { t } from '../../i18n/index.js';
const AI_GENERATION_TYPES = Object['freeze'](['ai-text', 'ai-image', 'ai-video', 'ai-audio']),
  STORYBOARD_QUICK_CREATE_PRESETS = Object['freeze']([
    {
      shortcutActionId: 'context-canvas-create-grid-4',
      labelKey: 'canvasInteraction.grids.grid4',
      nameKey: 'canvasInteraction.grids.grid4',
      cols: 0x2,
      rows: 0x2,
      baseShortSide: 0x190,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-9',
      labelKey: 'canvasInteraction.grids.grid9',
      nameKey: 'canvasInteraction.grids.grid9',
      cols: 0x3,
      rows: 0x3,
      baseShortSide: 0x1c2,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-16',
      labelKey: 'canvasInteraction.grids.grid16',
      nameKey: 'canvasInteraction.grids.grid16',
      cols: 0x4,
      rows: 0x4,
      baseShortSide: 0x1f4,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-25',
      labelKey: 'canvasInteraction.grids.grid25',
      nameKey: 'canvasInteraction.grids.grid25',
      cols: 0x5,
      rows: 0x5,
      baseShortSide: 0x226,
    },
  ]),
  NODE_CREATION_SHORTCUT_ACTIONS = Object['freeze']({
    'ai-text': 'create-ai-text',
    'ai-image': 'create-ai-image',
    'ai-video': 'create-ai-video',
    'ai-audio': 'create-ai-audio',
    'source-text': 'create-text',
    'source-image': 'context-canvas-create-source-image',
    'source-video': 'context-canvas-create-source-video',
    'source-audio': 'context-canvas-create-source-audio',
    'comment-note': 'create-comment-note',
    'panorama-scene': 'context-canvas-create-panorama-scene',
    'panorama-360': 'context-canvas-create-panorama-360',
    storyboard: 'context-canvas-create-storyboard',
    'storyboard-script': 'context-canvas-create-storyboard-script',
    collage: 'context-canvas-create-collage-node',
    whiteboard: 'context-canvas-create-whiteboard',
    'media-clip': 'context-canvas-create-media-clip',
    debug: 'context-canvas-create-debug',
  }),
  NODE_CREATION_SECTION_SHORTCUT_ACTIONS = Object['freeze']({
    generation: 'context-canvas-open-node-section-generation',
    source: 'context-canvas-open-node-section-source',
    function: 'context-canvas-open-node-section-function',
  });
function isDevModeOn(_0x5cf41c = globalThis['window'], _0x21b60d = globalThis['document']) {
  return _0x5cf41c?.['DEV_MODE'] === !![] || _0x21b60d?.['body']?.['classList']?.['contains']('dev-mode');
}
function getAiGenerationActionLabel(_0x26fd9a) {
  if (_0x26fd9a === 'ai-image') return t('canvasInteraction.generation.image');
  if (_0x26fd9a === 'ai-video') return t('canvasInteraction.generation.video');
  if (_0x26fd9a === 'ai-audio') return t('canvasInteraction.generation.audio');
  return t('canvasInteraction.generation.text');
}
function getAiGenerationNodeName(_0xcbed09) {
  if (_0xcbed09 === 'ai-image') return t('canvasInteraction.generationNames.image');
  if (_0xcbed09 === 'ai-video') return t('canvasInteraction.generationNames.video');
  if (_0xcbed09 === 'ai-audio') return t('canvasInteraction.generationNames.audio');
  return t('canvasInteraction.generationNames.text');
}
function getAiGenerationMenuItem(_0xd36a1e) {
  const _0x166b94 = getAIGenerationDefaultSizeByType(_0xd36a1e);
  return {
    type: _0xd36a1e,
    label: getAiGenerationActionLabel(_0xd36a1e),
    name: getAiGenerationNodeName(_0xd36a1e),
    width: _0x166b94['width'],
    height: _0x166b94['height'],
  };
}
function getCreationMenuNodeSize(_0x3f99f5) {
  if (AI_GENERATION_TYPES['includes'](_0x3f99f5)) return getAIGenerationDefaultSizeByType(_0x3f99f5);
  if (_0x3f99f5 === 'panorama-scene' || _0x3f99f5 === 'panorama-360') return PANORAMA_SCENE_DEFAULT_SIZE;
  if (_0x3f99f5 === 'storyboard-script') return STORYBOARD_SCRIPT_DEFAULT_SIZE;
  return getNodeDefaultSize(_0x3f99f5);
}
function calcNodesBBox(_0x1a151e, _0x1608cd) {
  let _0x53b159 = Infinity,
    _0x5ed258 = Infinity,
    _0x433b5e = -Infinity,
    _0xb5a359 = -Infinity;
  for (const _0x51afa9 of _0x1608cd) {
    const _0x4fa945 = _0x1a151e[_0x51afa9];
    if (!_0x4fa945) continue;
    const _0x3b317f = _0x4fa945['width'] || 0x104,
      _0x1597ab = _0x4fa945['height'] || 0x64;
    ((_0x53b159 = Math['min'](_0x53b159, _0x4fa945['x'])),
      (_0x5ed258 = Math['min'](_0x5ed258, _0x4fa945['y'])),
      (_0x433b5e = Math['max'](_0x433b5e, _0x4fa945['x'] + _0x3b317f)),
      (_0xb5a359 = Math['max'](_0xb5a359, _0x4fa945['y'] + _0x1597ab)));
  }
  if (_0x53b159 === Infinity) return null;
  return { x: _0x53b159, y: _0x5ed258, width: _0x433b5e - _0x53b159, height: _0xb5a359 - _0x5ed258 };
}
function pushRow(_0x1a681e, _0x5b9997, _0x432618, _0x40e625, _0x23a55c = {}) {
  _0x1a681e['push']({ label: _0x5b9997, kbd: _0x432618, action: _0x40e625, icon: 'action', ..._0x23a55c });
}
function pushSeparator(_0x190044) {
  _0x190044['push']('sep');
}
export function createCanvasContextMenuController({
  store: _0x2526d1,
  graphStore: graphStore = _0x2526d1,
  commandAdapter: _0x42ab8b,
  getShortcuts: _0x2a37bf,
  onUploadFile: _0x10010e,
  windowObject: windowObject = globalThis['window'],
  documentObject: documentObject = globalThis['document'],
} = {}) {
  const _0x222a61 = () => {
    const _0x5cd9fa = documentObject?.['querySelector']?.('.v2-canvas-stage') || null,
      _0x4b0ec7 = Number(_0x5cd9fa?.['getBoundingClientRect']?.()?.['top']);
    return {
      ensureItemIcons: !![],
      viewportTop: Number['isFinite'](_0x4b0ec7) ? Math['max'](0x0, _0x4b0ec7) : 0x0,
    };
  };
  if (!_0x2526d1 || !_0x42ab8b)
    throw new TypeError('[canvasContextMenuController] store and commandAdapter are required');
  const _0x17db47 = () => _0x2526d1['getStateRaw']?.() || _0x2526d1['getState']?.() || {},
    _0x391430 = (_0x52508c, _0x52ac0b = {}) => _0x42ab8b['execute'](_0x52508c, _0x52ac0b),
    _0x201063 = (_0x264ae0, _0x33534d = {}) => _0x42ab8b['executeCanvasCommand'](_0x264ae0, _0x33534d),
    _0x952b21 = (_0xad4e00, _0x305232 = '') => {
      const _0xd1440a = _0x2a37bf?.()?.[_0xad4e00];
      if (!_0xd1440a || !Array['isArray'](_0xd1440a['keys'])) return _0x305232;
      return _0xd1440a['keys']['join']('\x20');
    },
    _0x4606f6 = (_0x199079, _0x470950 = 0x10, _0x24f2f1 = 0x10) => {
      const _0xe03191 = _0x201063('node.duplicate', {
        ids: _0x199079,
        dx: _0x470950,
        dy: _0x24f2f1,
        edgePolicy: 'all-touching',
      });
      return _0xe03191['ok'] ? _0xe03191['result']?.['idMap'] || {} : {};
    };
  function _0x1aa7d9(_0x1a5521, _0x505135) {
    if (!_0x1a5521 || !_0x505135) return null;
    return _0x201063('storyboard.createGridFromNode', {
      sourceId: _0x1a5521['id'],
      name: t(_0x505135['nameKey']),
      cols: _0x505135['cols'],
      rows: _0x505135['rows'],
      baseShortSide: _0x505135['baseShortSide'],
    });
  }
  function _0x24b7b4(_0x6d5cd4) {
    const _0x21307f = _0x201063('collage.createFromSelection', {
      ids: Array['isArray'](_0x6d5cd4) ? _0x6d5cd4 : [],
    });
    if (!_0x21307f['ok']) {
      const _0x2af0b5 = _0x21307f['errorCode'] === 'NO_COLLAGE_IMAGES' ? 'warning' : 'error';
      return (
        windowObject?.['showToast']?.(
          _0x21307f['message'] || t('canvasInteraction.grids.boundsFailed'),
          _0x2af0b5,
        ),
        null
      );
    }
    return _0x21307f['result']?.['nodeId'] || null;
  }
  function _0x596bec(_0x2f26b7, _0x45188c, _0x45088d = {}) {
    removeContextMenus();
    const _0x4a0d45 = _0x17db47(),
      _0x41091a = _0x4a0d45['nodes'] || {},
      _0x3d5c78 = Array['isArray'](_0x45088d['targetNodeIds']) ? _0x45088d['targetNodeIds'] : [],
      _0x170b27 = _0x3d5c78['filter']((_0x52ee48) => !!_0x41091a[_0x52ee48]);
    if (_0x170b27['length'] === 0x0) return null;
    const _0x13f2df =
        _0x45088d['primaryNodeId'] && _0x41091a[_0x45088d['primaryNodeId']]
          ? _0x45088d['primaryNodeId']
          : _0x170b27[0x0],
      _0x2e180d = _0x13f2df ? _0x41091a[_0x13f2df] : null,
      _0x5b2726 = [],
      _0x73354e = (_0x35184d, _0x3cc989, _0x229287, _0x161d26) =>
        pushRow(_0x5b2726, _0x35184d, _0x3cc989, _0x229287, _0x161d26),
      _0x4b0e51 = () => pushSeparator(_0x5b2726),
      _0x92917c = (_0x33ab6a, _0x16c335, _0x5a5835 = {}) =>
        _0x5b2726['push']({ label: _0x33ab6a, subItems: _0x16c335, ..._0x5a5835 });
    (_0x73354e(
      t('canvasInteraction.contextMenu.copyNode'),
      _0x952b21('copy', 'Ctrl C'),
      () => {
        (_0x391430('copy', { ids: [..._0x170b27] }),
          windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
      },
      { icon: 'copy', shortcutActionId: 'copy' },
    ),
      _0x73354e(
        t('canvasInteraction.contextMenu.cutNode'),
        _0x952b21('cut', 'Ctrl X'),
        () => {
          const _0x1e52ee = [..._0x170b27];
          (_0x391430('copy', { ids: _0x1e52ee }),
            _0x391430('delete_nodes', { ids: _0x1e52ee }),
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
        },
        { icon: 'cut', shortcutActionId: 'cut' },
      ),
      _0x73354e(
        t('canvasInteraction.contextMenu.paste'),
        _0x952b21('paste', 'Ctrl V'),
        () => {
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('v2:canvas-paste-request', {
              detail: { screenX: _0x2f26b7, screenY: _0x45188c },
            }),
          );
        },
        { icon: 'paste', shortcutActionId: 'paste' },
      ));
    const _0x35b7f2 = { nodeIds: [..._0x170b27], items: [] };
    (windowObject?.['dispatchEvent']?.(new CustomEvent('v2:canvas-node-menu-items', { detail: _0x35b7f2 })),
      _0x5b2726['push'](..._0x35b7f2['items']));
    const _0x397604 = _0x170b27['filter']((_0xd4858a) => isCollageImageNode(_0x41091a[_0xd4858a])),
      _0x9ad9ef = _0x170b27['map']((_0x2ca71a) => _0x41091a[_0x2ca71a])['filter'](Boolean);
    hasMaterialComparisonPair(_0x9ad9ef) &&
      _0x73354e(
        t('canvasInteraction.contextMenu.materialComparison'),
        '',
        () => {
          import('../materialComparison.js')
            ['then'](({ openMaterialComparison: _0x319fb8 }) => {
              _0x319fb8(_0x9ad9ef);
            })
            ['catch'](() =>
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.materialComparisonFailed'), 'error'),
            );
        },
        { icon: 'compare', shortcutActionId: 'context-canvas-material-comparison' },
      );
    _0x397604['length'] >= 0x2 &&
      _0x73354e(
        t('canvasInteraction.contextMenu.createCollage'),
        '',
        () => {
          _0x24b7b4(_0x397604);
        },
        { icon: 'collage', shortcutActionId: 'context-canvas-create-collage' },
      );
    if (_0x2e180d && _0x170b27['length'] === 0x1) {
      const _0x506fdb = ['ai-image', 'source-image', 'storyboard']['includes'](_0x2e180d['type']),
        _0x5645fc =
          _0x2e180d['imageUrl'] || _0x2e180d['sourceUrl'] || _0x2e180d['src'] || _0x2e180d['localPath'];
      _0x506fdb &&
        _0x5645fc &&
        _0x73354e(
          t('canvasInteraction.contextMenu.copyImage'),
          _0x952b21('copy-media', 'Ctrl Shift C'),
          () => {
            if (_0x2e180d['id']) graphStore['setSelectedNodes']([_0x2e180d['id']]);
            windowObject?.['dispatchEvent']?.(new CustomEvent('shortcut-action', { detail: 'copy-media' }));
          },
          { icon: 'copy', shortcutActionId: 'copy-media' },
        );
    }
    const _0xad501c = (_0x3f6d43) => {
      if (!_0x13f2df || !_0x170b27['length']) return;
      const _0x57bec8 = {
        x: Number['isFinite'](Number(_0x3f6d43?.['clientX'])) ? Number(_0x3f6d43['clientX']) : _0x2f26b7,
        y: Number['isFinite'](Number(_0x3f6d43?.['clientY'])) ? Number(_0x3f6d43['clientY']) : _0x45188c,
      };
      (graphStore['setSelectedNodes']([..._0x170b27]),
        import('../AssetManager.js')
          ['then'](({ assetManager: _0x2fbfbe }) => {
            _0x2fbfbe['showLibrarySavePanel']([..._0x170b27], null, { point: _0x57bec8 });
          })
          ['catch'](() =>
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.assetPanelFailed'), 'error'),
          ));
    };
    let _0x2f1db2 = '',
      _0x83f958 = ![],
      _0x113223 = ![];
    _0x2e180d &&
      _0x170b27['length'] === 0x1 &&
      ((_0x2f1db2 = resolveNodeLocalPathForNativeAction(_0x2e180d)),
      (_0x83f958 = canShowItemInFolder(_0x2f1db2)),
      (_0x113223 = canOpenKnownFolder('output')));
    (_0x2e180d || _0x83f958) &&
      (_0x4b0e51(),
      _0x2e180d &&
        _0x73354e(t('canvasInteraction.contextMenu.addAsset'), '', _0xad501c, {
          icon: 'add-to-library',
          shortcutActionId: 'context-canvas-add-to-library',
        }),
      _0x83f958 &&
        _0x73354e(
          t('canvasInteraction.contextMenu.revealAsset'),
          '',
          () => {
            showItemInFolder(_0x2f1db2)['catch'](() =>
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.assetRevealFailed'), 'error'),
            );
          },
          { icon: 'reveal', shortcutActionId: 'context-canvas-reveal-file' },
        ),
      _0x4b0e51());
    _0x113223 &&
      (_0x73354e(
        t('canvasInteraction.contextMenu.openOutputFolder'),
        '',
        () => {
          openKnownFolder('output')['catch'](() =>
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.outputFolderFailed'), 'error'),
          );
        },
        { icon: 'folder-open', shortcutActionId: 'context-canvas-open-output-folder' },
      ),
      _0x4b0e51());
    _0x73354e(
      t('canvasInteraction.contextMenu.duplicate'),
      '',
      () => {
        const _0x1adc10 = _0x17db47(),
          _0x594b3f = _0x1adc10['nodes'] || {},
          _0x4a84db = (_0x1adc10['selectedNodeIds'] || [])['filter']((_0x290be7) => !!_0x594b3f[_0x290be7]),
          _0x214794 = _0x4a84db['length'] > 0x0 ? _0x4a84db : [..._0x170b27],
          _0x4b73a9 = calcNodesBBox(_0x594b3f, _0x214794),
          _0x2aa196 = Math['max'](0x118, _0x4b73a9?.['width'] || 0x0),
          _0x50d15d = Math['max'](0x12c, _0x4b73a9?.['height'] || 0x0),
          _0x27544f = (_0x13f2df && _0x594b3f[_0x13f2df]) || _0x4b73a9;
        if (!_0x27544f) return;
        const _0x289cd4 = calcSafeSpawnPosNearNode(_0x594b3f, _0x27544f, _0x2aa196, _0x50d15d);
        (_0x4606f6(_0x214794, _0x289cd4['x'] - _0x27544f['x'], _0x289cd4['y'] - _0x27544f['y']),
          windowObject?.['showToast']?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
      },
      { icon: 'duplicate', shortcutActionId: 'context-canvas-duplicate' },
    );
    _0x2e180d &&
      _0x170b27['length'] === 0x1 &&
      ['ai-text', 'source-text']['includes'](_0x2e180d['type']) &&
      _0x73354e(
        t('canvasInteraction.contextMenu.copyText'),
        '',
        () => {
          const _0x3620ce = _0x2e180d['outputText'] || _0x2e180d['content'] || '';
          if (!_0x3620ce) {
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.noNodeText'), 'warn');
            return;
          }
          navigator['clipboard']
            ['writeText'](_0x3620ce)
            ['then'](() => {
              (markSystemClipboardWrite({ text: _0x3620ce }),
                windowObject?.['showToast']?.(t('canvasInteraction.toasts.textCopied'), 'success'));
            })
            ['catch'](() => {
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            });
        },
        { icon: 'copy', shortcutActionId: 'context-canvas-copy-text' },
      );
    _0x73354e(
      t('canvasInteraction.contextMenu.deleteNode'),
      _0x952b21('delete', 'Del'),
      () => {
        _0x391430('delete_nodes', { ids: [..._0x170b27] });
      },
      { danger: !![], icon: 'delete', shortcutActionId: 'delete' },
    );
    if (_0x2e180d && _0x170b27['length'] === 0x1) {
      _0x4b0e51();
      const _0x4661e7 = AI_GENERATION_TYPES['map'](getAiGenerationMenuItem)['filter']((_0x34d90a) =>
        isValidConnection(_0x2e180d, { id: '__fake_' + _0x34d90a['type'], type: _0x34d90a['type'] }),
      );
      _0x4661e7['forEach']((_0x4a5f5b) => {
        _0x73354e(
          _0x4a5f5b['label'],
          '',
          () => {
            _0x201063('node.createConnected', {
              sourceId: _0x13f2df,
              type: _0x4a5f5b['type'],
              width: _0x4a5f5b['width'],
              height: _0x4a5f5b['height'],
              name: _0x4a5f5b['name'],
              inheritSource: !![],
            });
          },
          {
            iconEl: createNodeCreationMenuIcon(_0x4a5f5b['type'], { documentObject: documentObject }),
            shortcutActionId: 'context-canvas-create-connected-' + _0x4a5f5b['type'],
          },
        );
      });
      const _0x550060 = ['ai-image', 'source-image', 'storyboard']['includes'](_0x2e180d['type']);
      if (_0x550060 && resolveStoryboardSourceImageRef(_0x2e180d)) {
        _0x4b0e51();
        const _0x2156bf = STORYBOARD_QUICK_CREATE_PRESETS['map']((_0x16ee98) => ({
          label: t(_0x16ee98['labelKey']),
          icon: 'grid',
          shortcutActionId: _0x16ee98['shortcutActionId'],
          action: () => _0x1aa7d9(_0x2e180d, _0x16ee98),
        }));
        _0x92917c(t('canvasInteraction.grids.createGrid'), _0x2156bf, {
          icon: 'grid',
          shortcutActionId: 'context-canvas-open-grid-menu',
        });
      }
    }
    return showContextMenu(_0x2f26b7, _0x45188c, _0x5b2726, _0x222a61());
  }
  function _0x409b95(_0x308212, _0x2a4617) {
    const _0x5731fd = _0x17db47(),
      _0x25217b = hitTestNode(_0x308212, _0x2a4617, _0x5731fd['nodes'], _0x5731fd['viewport']);
    if (!_0x25217b) return null;
    const _0x24d736 = _0x5731fd['selectedNodeIds'] || [];
    !_0x24d736['includes'](_0x25217b) && graphStore['setSelectedNodes']([_0x25217b]);
    const _0x432190 = _0x17db47();
    return _0x596bec(_0x308212, _0x2a4617, {
      primaryNodeId: _0x25217b,
      targetNodeIds: _0x432190['selectedNodeIds'],
    });
  }
  function _0x3de03f(_0x5347a4, _0x513922) {
    const { viewport: _0x18b280 } = _0x17db47(),
      { x: _0x518429, y: _0x279d31 } = screenToWorld(_0x5347a4, _0x513922, _0x18b280),
      _0x4a28a8 = [],
      _0x5c47af = (_0x3a25da, _0x3d9cc9, _0x440515, _0x5cb30d) =>
        pushRow(_0x4a28a8, _0x3a25da, _0x3d9cc9, _0x440515, _0x5cb30d),
      _0x31607e = (_0x2d8849, _0x58ea5d, _0x2da7c8 = {}) =>
        _0x4a28a8['push']({ label: _0x2d8849, subItems: _0x58ea5d, ..._0x2da7c8 }),
      _0x414ed7 = getNodeCreationMenuSections(CONTEXT_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(windowObject, documentObject),
      })['map']((_0x269582) => ({
        label: _0x269582['label'],
        shortcutActionId: NODE_CREATION_SECTION_SHORTCUT_ACTIONS[_0x269582['id']],
        iconEl: createNodeCreationMenuIcon('section-' + _0x269582['id'], { documentObject: documentObject }),
        subItems: _0x269582['items']['map']((_0x518f5d) => {
          const _0x19977e = getCreationMenuNodeSize(_0x518f5d['type']);
          return {
            label: _0x518f5d['label'],
            desc: _0x518f5d['subtitle'],
            badge: _0x518f5d['badge'],
            iconEl: createNodeCreationMenuIcon(_0x518f5d['type'], { documentObject: documentObject }),
            shortcutActionId: NODE_CREATION_SHORTCUT_ACTIONS[_0x518f5d['type']],
            action: () => {
              if (_0x518f5d['type'] === 'debug')
                return openDebugRequestWindow({
                  documentObject: documentObject,
                  windowObject: windowObject,
                  outputText: '点击生成按钮旁的调试按钮，查看当前请求参数。',
                });
              _0x391430('create_node', {
                type: _0x518f5d['type'],
                x: _0x518429 - _0x19977e['width'] / 0x2,
                y: _0x279d31 - _0x19977e['height'] / 0x2,
                width: _0x19977e['width'],
                height: _0x19977e['height'],
                name: _0x518f5d['defaultName'] || _0x518f5d['label'],
                extra: {
                  needsAutoResize:
                    _0x518f5d['type'] === 'source-image' || _0x518f5d['type'] === 'source-video',
                },
              });
            },
          };
        }),
      }));
    _0x31607e(t('canvasInteraction.contextMenu.addNode'), _0x414ed7, {
      iconEl: createNodeCreationMenuIcon('add-node', { documentObject: documentObject }),
      shortcutActionId: 'context-canvas-open-add-node-menu',
    });
    typeof _0x10010e === 'function' &&
      _0x5c47af(
        NODE_CREATION_UPLOAD_ITEM['label'],
        '',
        () => {
          _0x10010e({ screenX: _0x5347a4, screenY: _0x513922 });
        },
        {
          iconEl: createNodeCreationMenuIcon('upload', { documentObject: documentObject }),
          shortcutActionId: 'upload-file',
        },
      );
    (pushSeparator(_0x4a28a8),
      _0x5c47af(
        t('canvasInteraction.contextMenu.paste'),
        _0x952b21('paste', 'Ctrl V'),
        () => {
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('v2:canvas-paste-request', {
              detail: { screenX: _0x5347a4, screenY: _0x513922 },
            }),
          );
        },
        {
          iconEl: createNodeCreationMenuIcon('paste', { documentObject: documentObject }),
          shortcutActionId: 'paste',
        },
      ));
    const _0x39fe6c = getHistoryInfo();
    return (
      _0x5c47af(t('canvasInteraction.contextMenu.undo'), _0x952b21('undo', 'Ctrl Z'), () => undo(), {
        disabled: !(Number(_0x39fe6c?.['undoCount']) > 0x0),
        iconEl: createNodeCreationMenuIcon('undo', { documentObject: documentObject }),
        shortcutActionId: 'undo',
      }),
      _0x5c47af(t('canvasInteraction.contextMenu.redo'), _0x952b21('redo', 'Ctrl Y'), () => redo(), {
        disabled: !(Number(_0x39fe6c?.['redoCount']) > 0x0),
        iconEl: createNodeCreationMenuIcon('redo', { documentObject: documentObject }),
        shortcutActionId: 'redo',
      }),
      showContextMenu(_0x5347a4, _0x513922, _0x4a28a8, _0x222a61())
    );
  }
  function _0x3731a9(_0x3fa92e, _0x59112d, _0x4b654f, _0x1dbd48 = {}) {
    const _0x56b4cb = [],
      _0x3933fc = (_0x3ecf34, _0x2904cc, _0x56aaf6, _0x59792c) =>
        pushRow(_0x56b4cb, _0x3ecf34, _0x2904cc, _0x56aaf6, _0x59792c),
      _0x138a0a = _0x17db47(),
      _0x5c380a = _0x138a0a['viewport'],
      _0x4e8ead = _0x138a0a['nodes'] || {},
      { x: _0x14e68c, y: _0x47a384 } = screenToWorld(_0x3fa92e, _0x59112d, _0x5c380a),
      _0x2ecf08 = String(_0x1dbd48['anchorNodeId'] || '')['trim'](),
      _0x8139eb =
        _0x2ecf08 && _0x4e8ead[_0x2ecf08]
          ? _0x2ecf08
          : hitTestNode(_0x3fa92e, _0x59112d, _0x4e8ead, _0x5c380a),
      _0x756e55 = _0x8139eb ? _0x4e8ead[_0x8139eb] : null;
    return (
      _0x756e55 &&
        (graphStore['setSelectedNodes']([_0x8139eb]),
        _0x3933fc(
          t('canvasInteraction.contextMenu.copyNode'),
          _0x952b21('copy', 'Ctrl C'),
          () => {
            (_0x391430('copy'),
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
          },
          { icon: 'copy', shortcutActionId: 'copy' },
        ),
        _0x3933fc(
          t('canvasInteraction.contextMenu.cutNode'),
          _0x952b21('cut', 'Ctrl\x20X'),
          () => {
            (_0x391430('copy', { ids: [_0x8139eb] }),
              _0x391430('delete_nodes', { ids: [_0x8139eb] }),
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
          },
          { icon: 'cut', shortcutActionId: 'cut' },
        ),
        _0x3933fc(
          t('canvasInteraction.contextMenu.duplicate'),
          '',
          () => {
            const _0x29378c = _0x17db47()['selectedNodeIds'] || [],
              _0x1551cd = _0x29378c['includes'](_0x8139eb) ? [..._0x29378c] : [_0x8139eb],
              _0x3c7a4f = _0x1551cd['length'] === 0x1 ? _0x756e55['height'] || 0x118 : 0x12c,
              _0x4e4209 = calcSafeSpawnPosNearNode(_0x4e8ead, _0x756e55, 0x118, _0x3c7a4f);
            (_0x4606f6(_0x1551cd, _0x4e4209['x'] - _0x756e55['x'], _0x4e4209['y'] - _0x756e55['y']),
              windowObject?.['showToast']?.(
                t('canvasInteraction.toasts.duplicateWithEdgesCreated'),
                'success',
              ));
          },
          { icon: 'duplicate', shortcutActionId: 'context-canvas-duplicate' },
        )),
      _0x3933fc(
        t('canvasInteraction.contextMenu.copyText'),
        'Ctrl C',
        () => {
          navigator['clipboard']
            ['writeText'](_0x4b654f)
            ['then'](() => {
              (markSystemClipboardWrite({ text: _0x4b654f }),
                windowObject?.['showToast']?.(t('canvasInteraction.toasts.selectedTextCopied'), 'success'));
            })
            ['catch'](() => {
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            });
        },
        { icon: 'copy', shortcutActionId: 'context-canvas-copy-text' },
      ),
      _0x1dbd48['pasteTarget'] &&
        _0x3933fc(
          t('canvasInteraction.contextMenu.pasteText'),
          'Ctrl V',
          () => {
            pasteTextIntoEditableFromClipboard(_0x1dbd48['pasteTarget'], _0x1dbd48['pasteSelection'] || null);
          },
          { icon: 'paste', shortcutActionId: 'paste' },
        ),
      _0x756e55 &&
        _0x3933fc(
          t('canvasInteraction.contextMenu.deleteNode'),
          _0x952b21('delete', 'Del'),
          () => {
            _0x391430('delete_nodes', { ids: [_0x8139eb] });
          },
          { danger: !![], icon: 'delete', shortcutActionId: 'delete' },
        ),
      pushSeparator(_0x56b4cb),
      AI_GENERATION_TYPES['forEach']((_0x1a705c) => {
        const _0x3a3816 = getAIGenerationDefaultSizeByType(_0x1a705c);
        _0x3933fc(
          getAiGenerationActionLabel(_0x1a705c),
          '',
          () => {
            const _0x1f81c8 =
              _0x1a705c === 'ai-image' || _0x1a705c === 'ai-video'
                ? getAIGenerationNodeSize(_0x3a3816['width'], _0x3a3816['height'])
                : { width: _0x3a3816['width'], height: _0x3a3816['height'] };
            let _0x20fa5e = _0x14e68c - _0x1f81c8['width'] / 0x2,
              _0x19c514 = _0x47a384 - _0x1f81c8['height'] / 0x2;
            if (_0x756e55) {
              const _0x37a4e5 = calcSafeSpawnPosNearNode(
                _0x4e8ead,
                _0x756e55,
                _0x1f81c8['width'],
                _0x1f81c8['height'],
              );
              ((_0x20fa5e = _0x37a4e5['x']), (_0x19c514 = _0x37a4e5['y']));
            }
            _0x391430('create_node', {
              type: _0x1a705c,
              x: _0x20fa5e,
              y: _0x19c514,
              width: _0x1f81c8['width'],
              height: _0x1f81c8['height'],
              name: getAiGenerationNodeName(_0x1a705c),
              prompt: _0x4b654f,
              needsAutoResize: _0x1a705c === 'ai-image' || _0x1a705c === 'ai-video',
              ...(_0x1a705c === 'ai-image' || _0x1a705c === 'ai-video' ? { aspectRatio: '自适应' } : {}),
            });
          },
          {
            iconEl: createNodeCreationMenuIcon(_0x1a705c, { documentObject: documentObject }),
            shortcutActionId: NODE_CREATION_SHORTCUT_ACTIONS[_0x1a705c],
          },
        );
      }),
      showContextMenu(_0x3fa92e, _0x59112d, _0x56b4cb, _0x222a61())
    );
  }
  return {
    handleNodeContextMenu: _0x409b95,
    handleTextContextMenu: _0x3731a9,
    showCanvasContextMenu: _0x3de03f,
    showNodesContextMenu: _0x596bec,
  };
}
