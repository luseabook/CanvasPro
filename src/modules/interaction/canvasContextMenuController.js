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
      cols: 2,
      rows: 2,
      baseShortSide: 400,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-9',
      labelKey: 'canvasInteraction.grids.grid9',
      nameKey: 'canvasInteraction.grids.grid9',
      cols: 3,
      rows: 3,
      baseShortSide: 450,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-16',
      labelKey: 'canvasInteraction.grids.grid16',
      nameKey: 'canvasInteraction.grids.grid16',
      cols: 4,
      rows: 4,
      baseShortSide: 500,
    },
    {
      shortcutActionId: 'context-canvas-create-grid-25',
      labelKey: 'canvasInteraction.grids.grid25',
      nameKey: 'canvasInteraction.grids.grid25',
      cols: 5,
      rows: 5,
      baseShortSide: 550,
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
function isDevModeOn(value = globalThis['window'], dom = globalThis['document']) {
  return value?.['DEV_MODE'] === !![] || dom?.['body']?.['classList']?.['contains']('dev-mode');
}
function getAiGenerationActionLabel(item) {
  if (item === 'ai-image') return t('canvasInteraction.generation.image');
  if (item === 'ai-video') return t('canvasInteraction.generation.video');
  if (item === 'ai-audio') return t('canvasInteraction.generation.audio');
  return t('canvasInteraction.generation.text');
}
function getAiGenerationNodeName(key) {
  if (key === 'ai-image') return t('canvasInteraction.generationNames.image');
  if (key === 'ai-video') return t('canvasInteraction.generationNames.video');
  if (key === 'ai-audio') return t('canvasInteraction.generationNames.audio');
  return t('canvasInteraction.generationNames.text');
}
function getAiGenerationMenuItem(type) {
  const width = getAIGenerationDefaultSizeByType(type);
  return {
    type: type,
    label: getAiGenerationActionLabel(type),
    name: getAiGenerationNodeName(type),
    width: width['width'],
    height: width['height'],
  };
}
function getCreationMenuNodeSize(index) {
  if (AI_GENERATION_TYPES['includes'](index)) return getAIGenerationDefaultSizeByType(index);
  if (index === 'panorama-scene' || index === 'panorama-360') return PANORAMA_SCENE_DEFAULT_SIZE;
  if (index === 'storyboard-script') return STORYBOARD_SCRIPT_DEFAULT_SIZE;
  return getNodeDefaultSize(index);
}
function calcNodesBBox(result, data) {
  let x = Infinity,
    y = Infinity,
    width2 = -Infinity,
    height = -Infinity;
  for (const options of data) {
    const box = result[options];
    if (!box) continue;
    const target = box['width'] || 260,
      source = box['height'] || 100;
    ((x = Math['min'](x, box['x'])),
      (y = Math['min'](y, box['y'])),
      (width2 = Math['max'](width2, box['x'] + target)),
      (height = Math['max'](height, box['y'] + source)));
  }
  if (x === Infinity) return null;
  return { x: x, y: y, width: width2 - x, height: height - y };
}
function pushRow(list, label, kbd, action, args = {}) {
  list['push']({ label: label, kbd: kbd, action: action, icon: 'action', ...args });
}
function pushSeparator(list2) {
  list2['push']('sep');
}
export function createCanvasContextMenuController({
  store: store,
  graphStore: graphStore = store,
  commandAdapter: commandAdapter,
  getShortcuts: getShortcuts,
  onUploadFile: onUploadFile,
  windowObject: windowObject = globalThis['window'],
  documentObject: documentObject = globalThis['document'],
} = {}) {
  const run = () => {
    const el = documentObject?.['querySelector']?.('.v2-canvas-stage') || null,
      next = Number(el?.['getBoundingClientRect']?.()?.['top']);
    return {
      ensureItemIcons: !![],
      viewportTop: Number['isFinite'](next) ? Math['max'](0, next) : 0,
    };
  };
  if (!store || !commandAdapter)
    throw new TypeError('[canvasContextMenuController] store and commandAdapter are required');
  const run2 = () => store['getStateRaw']?.() || store['getState']?.() || {},
    handler = (current, entry = {}) => commandAdapter['execute'](current, entry),
    handler2 = (record, payload = {}) => commandAdapter['executeCanvasCommand'](record, payload),
    handler3 = (handle, state = '') => {
      const map = getShortcuts?.()?.[handle];
      if (!map || !Array['isArray'](map['keys'])) return state;
      return map['keys']['join'](' ');
    },
    handler4 = (ids, dx = 16, dy = 16) => {
      const response = handler2('node.duplicate', {
        ids: ids,
        dx: dx,
        dy: dy,
        edgePolicy: 'all-touching',
      });
      return response['ok'] ? response['result']?.['idMap'] || {} : {};
    };
  function run3(sourceId, cols) {
    if (!sourceId || !cols) return null;
    return handler2('storyboard.createGridFromNode', {
      sourceId: sourceId['id'],
      name: t(cols['nameKey']),
      cols: cols['cols'],
      rows: cols['rows'],
      baseShortSide: cols['baseShortSide'],
    });
  }
  function run4(config) {
    const error = handler2('collage.createFromSelection', {
      ids: Array['isArray'](config) ? config : [],
    });
    if (!error['ok']) {
      const scope = error['errorCode'] === 'NO_COLLAGE_IMAGES' ? 'warning' : 'error';
      return (
        windowObject?.['showToast']?.(error['message'] || t('canvasInteraction.grids.boundsFailed'), scope),
        null
      );
    }
    return error['result']?.['nodeId'] || null;
  }
  function showNodesContextMenu(screenX, screenY, input = {}) {
    removeContextMenus();
    const state2 = run2(),
      enabled = state2['nodes'] || {},
      list3 = Array['isArray'](input['targetNodeIds']) ? input['targetNodeIds'] : [],
      list4 = list3['filter']((output) => !!enabled[output]);
    if (list4['length'] === 0) return null;
    const sourceId2 =
        input['primaryNodeId'] && enabled[input['primaryNodeId']] ? input['primaryNodeId'] : list4[0],
      value2 = sourceId2 ? enabled[sourceId2] : null,
      list5 = [],
      handler5 = (value3, value4, value5, value6) => pushRow(list5, value3, value4, value5, value6),
      handler6 = () => pushSeparator(list5),
      handler7 = (label2, subItems, args2 = {}) =>
        list5['push']({ label: label2, subItems: subItems, ...args2 });
    (handler5(
      t('canvasInteraction.contextMenu.copyNode'),
      handler3('copy', 'Ctrl C'),
      () => {
        (handler('copy', { ids: [...list4] }),
          windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
      },
      { icon: 'copy', shortcutActionId: 'copy' },
    ),
      handler5(
        t('canvasInteraction.contextMenu.cutNode'),
        handler3('cut', 'Ctrl X'),
        () => {
          const ids2 = [...list4];
          (handler('copy', { ids: ids2 }),
            handler('delete_nodes', { ids: ids2 }),
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
        },
        { icon: 'cut', shortcutActionId: 'cut' },
      ),
      handler5(
        t('canvasInteraction.contextMenu.paste'),
        handler3('paste', 'Ctrl V'),
        () => {
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('v2:canvas-paste-request', {
              detail: { screenX: screenX, screenY: screenY },
            }),
          );
        },
        { icon: 'paste', shortcutActionId: 'paste' },
      ));
    const detail = { nodeIds: [...list4], items: [] };
    (windowObject?.['dispatchEvent']?.(new CustomEvent('v2:canvas-node-menu-items', { detail: detail })),
      list5['push'](...detail['items']));
    const list6 = list4['filter']((value7) => isCollageImageNode(enabled[value7])),
      value8 = list4['map']((value9) => enabled[value9])['filter'](Boolean);
    hasMaterialComparisonPair(value8) &&
      handler5(
        t('canvasInteraction.contextMenu.materialComparison'),
        '',
        () => {
          import('../materialComparison.js')
            ['then'](({ openMaterialComparison: openMaterialComparison }) => {
              openMaterialComparison(value8);
            })
            ['catch'](() =>
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.materialComparisonFailed'), 'error'),
            );
        },
        { icon: 'compare', shortcutActionId: 'context-canvas-material-comparison' },
      );
    list6['length'] >= 2 &&
      handler5(
        t('canvasInteraction.contextMenu.createCollage'),
        '',
        () => {
          run4(list6);
        },
        { icon: 'collage', shortcutActionId: 'context-canvas-create-collage' },
      );
    if (value2 && list4['length'] === 1) {
      const value10 = ['ai-image', 'source-image', 'storyboard']['includes'](value2['type']),
        value11 = value2['imageUrl'] || value2['sourceUrl'] || value2['src'] || value2['localPath'];
      value10 &&
        value11 &&
        handler5(
          t('canvasInteraction.contextMenu.copyImage'),
          handler3('copy-media', 'Ctrl Shift C'),
          () => {
            if (value2['id']) graphStore['setSelectedNodes']([value2['id']]);
            windowObject?.['dispatchEvent']?.(new CustomEvent('shortcut-action', { detail: 'copy-media' }));
          },
          { icon: 'copy', shortcutActionId: 'copy-media' },
        );
    }
    const value12 = (event) => {
      if (!sourceId2 || !list4['length']) return;
      const point = {
        x: Number['isFinite'](Number(event?.['clientX'])) ? Number(event['clientX']) : screenX,
        y: Number['isFinite'](Number(event?.['clientY'])) ? Number(event['clientY']) : screenY,
      };
      (graphStore['setSelectedNodes']([...list4]),
        import('../AssetManager.js')
          ['then'](({ assetManager: assetManager }) => {
            assetManager['showLibrarySavePanel']([...list4], null, { point: point });
          })
          ['catch'](() =>
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.assetPanelFailed'), 'error'),
          ));
    };
    let nodeLocalPathForNativeAction = '',
      canShowItemInFolder2 = ![],
      canOpenKnownFolder2 = ![];
    value2 &&
      list4['length'] === 1 &&
      ((nodeLocalPathForNativeAction = resolveNodeLocalPathForNativeAction(value2)),
      (canShowItemInFolder2 = canShowItemInFolder(nodeLocalPathForNativeAction)),
      (canOpenKnownFolder2 = canOpenKnownFolder('output')));
    (value2 || canShowItemInFolder2) &&
      (handler6(),
      value2 &&
        handler5(t('canvasInteraction.contextMenu.addAsset'), '', value12, {
          icon: 'add-to-library',
          shortcutActionId: 'context-canvas-add-to-library',
        }),
      canShowItemInFolder2 &&
        handler5(
          t('canvasInteraction.contextMenu.revealAsset'),
          '',
          () => {
            showItemInFolder(nodeLocalPathForNativeAction)['catch'](() =>
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.assetRevealFailed'), 'error'),
            );
          },
          { icon: 'reveal', shortcutActionId: 'context-canvas-reveal-file' },
        ),
      handler6());
    canOpenKnownFolder2 &&
      (handler5(
        t('canvasInteraction.contextMenu.openOutputFolder'),
        '',
        () => {
          openKnownFolder('output')['catch'](() =>
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.outputFolderFailed'), 'error'),
          );
        },
        { icon: 'folder-open', shortcutActionId: 'context-canvas-open-output-folder' },
      ),
      handler6());
    handler5(
      t('canvasInteraction.contextMenu.duplicate'),
      '',
      () => {
        const state3 = run2(),
          enabled2 = state3['nodes'] || {},
          list7 = (state3['selectedNodeIds'] || [])['filter']((value13) => !!enabled2[value13]),
          value14 = list7['length'] > 0 ? list7 : [...list4],
          box2 = calcNodesBBox(enabled2, value14),
          value15 = Math['max'](280, box2?.['width'] || 0),
          value16 = Math['max'](300, box2?.['height'] || 0),
          box3 = (sourceId2 && enabled2[sourceId2]) || box2;
        if (!box3) return;
        const box4 = calcSafeSpawnPosNearNode(enabled2, box3, value15, value16);
        (handler4(value14, box4['x'] - box3['x'], box4['y'] - box3['y']),
          windowObject?.['showToast']?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
      },
      { icon: 'duplicate', shortcutActionId: 'context-canvas-duplicate' },
    );
    value2 &&
      list4['length'] === 1 &&
      ['ai-text', 'source-text']['includes'](value2['type']) &&
      handler5(
        t('canvasInteraction.contextMenu.copyText'),
        '',
        () => {
          const text = value2['outputText'] || value2['content'] || '';
          if (!text) {
            windowObject?.['showToast']?.(t('canvasInteraction.toasts.noNodeText'), 'warn');
            return;
          }
          navigator['clipboard']
            ['writeText'](text)
            ['then'](() => {
              (markSystemClipboardWrite({ text: text }),
                windowObject?.['showToast']?.(t('canvasInteraction.toasts.textCopied'), 'success'));
            })
            ['catch'](() => {
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            });
        },
        { icon: 'copy', shortcutActionId: 'context-canvas-copy-text' },
      );
    handler5(
      t('canvasInteraction.contextMenu.deleteNode'),
      handler3('delete', 'Del'),
      () => {
        handler('delete_nodes', { ids: [...list4] });
      },
      { danger: !![], icon: 'delete', shortcutActionId: 'delete' },
    );
    if (value2 && list4['length'] === 1) {
      handler6();
      const list8 = AI_GENERATION_TYPES['map'](getAiGenerationMenuItem)['filter']((type2) =>
        isValidConnection(value2, { id: '__fake_' + type2['type'], type: type2['type'] }),
      );
      list8['forEach']((type3) => {
        handler5(
          type3['label'],
          '',
          () => {
            handler2('node.createConnected', {
              sourceId: sourceId2,
              type: type3['type'],
              width: type3['width'],
              height: type3['height'],
              name: type3['name'],
              inheritSource: !![],
            });
          },
          {
            iconEl: createNodeCreationMenuIcon(type3['type'], { documentObject: documentObject }),
            shortcutActionId: 'context-canvas-create-connected-' + type3['type'],
          },
        );
      });
      const value17 = ['ai-image', 'source-image', 'storyboard']['includes'](value2['type']);
      if (value17 && resolveStoryboardSourceImageRef(value2)) {
        handler6();
        const value18 = STORYBOARD_QUICK_CREATE_PRESETS['map']((shortcutActionId) => ({
          label: t(shortcutActionId['labelKey']),
          icon: 'grid',
          shortcutActionId: shortcutActionId['shortcutActionId'],
          action: () => run3(value2, shortcutActionId),
        }));
        handler7(t('canvasInteraction.grids.createGrid'), value18, {
          icon: 'grid',
          shortcutActionId: 'context-canvas-open-grid-menu',
        });
      }
    }
    return showContextMenu(screenX, screenY, list5, run());
  }
  function handleNodeContextMenu(value19, value20) {
    const state4 = run2(),
      primaryNodeId = hitTestNode(value19, value20, state4['nodes'], state4['viewport']);
    if (!primaryNodeId) return null;
    const list9 = state4['selectedNodeIds'] || [];
    !list9['includes'](primaryNodeId) && graphStore['setSelectedNodes']([primaryNodeId]);
    const targetNodeIds = run2();
    return showNodesContextMenu(value19, value20, {
      primaryNodeId: primaryNodeId,
      targetNodeIds: targetNodeIds['selectedNodeIds'],
    });
  }
  function showCanvasContextMenu(screenX2, screenY2) {
    const { viewport: viewport } = run2(),
      { x: x2, y: y2 } = screenToWorld(screenX2, screenY2, viewport),
      list10 = [],
      handler8 = (value21, value22, value23, value24) => pushRow(list10, value21, value22, value23, value24),
      handler9 = (label3, subItems2, args3 = {}) =>
        list10['push']({ label: label3, subItems: subItems2, ...args3 }),
      nodeCreationMenuSections = getNodeCreationMenuSections(CONTEXT_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(windowObject, documentObject),
      })['map']((label4) => ({
        label: label4['label'],
        shortcutActionId: NODE_CREATION_SECTION_SHORTCUT_ACTIONS[label4['id']],
        iconEl: createNodeCreationMenuIcon('section-' + label4['id'], { documentObject: documentObject }),
        subItems: label4['items']['map']((label5) => {
          const width3 = getCreationMenuNodeSize(label5['type']);
          return {
            label: label5['label'],
            desc: label5['subtitle'],
            badge: label5['badge'],
            iconEl: createNodeCreationMenuIcon(label5['type'], { documentObject: documentObject }),
            shortcutActionId: NODE_CREATION_SHORTCUT_ACTIONS[label5['type']],
            action: () => {
              if (label5['type'] === 'debug')
                return openDebugRequestWindow({
                  documentObject: documentObject,
                  windowObject: windowObject,
                  outputText: '点击生成按钮旁的调试按钮，查看当前请求参数。',
                });
              handler('create_node', {
                type: label5['type'],
                x: x2 - width3['width'] / 2,
                y: y2 - width3['height'] / 2,
                width: width3['width'],
                height: width3['height'],
                name: label5['defaultName'] || label5['label'],
                extra: {
                  needsAutoResize: label5['type'] === 'source-image' || label5['type'] === 'source-video',
                },
              });
            },
          };
        }),
      }));
    handler9(t('canvasInteraction.contextMenu.addNode'), nodeCreationMenuSections, {
      iconEl: createNodeCreationMenuIcon('add-node', { documentObject: documentObject }),
      shortcutActionId: 'context-canvas-open-add-node-menu',
    });
    typeof onUploadFile === 'function' &&
      handler8(
        NODE_CREATION_UPLOAD_ITEM['label'],
        '',
        () => {
          onUploadFile({ screenX: screenX2, screenY: screenY2 });
        },
        {
          iconEl: createNodeCreationMenuIcon('upload', { documentObject: documentObject }),
          shortcutActionId: 'upload-file',
        },
      );
    (pushSeparator(list10),
      handler8(
        t('canvasInteraction.contextMenu.paste'),
        handler3('paste', 'Ctrl V'),
        () => {
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('v2:canvas-paste-request', {
              detail: { screenX: screenX2, screenY: screenY2 },
            }),
          );
        },
        {
          iconEl: createNodeCreationMenuIcon('paste', { documentObject: documentObject }),
          shortcutActionId: 'paste',
        },
      ));
    const historyInfo = getHistoryInfo();
    return (
      handler8(t('canvasInteraction.contextMenu.undo'), handler3('undo', 'Ctrl Z'), () => undo(), {
        disabled: !(Number(historyInfo?.['undoCount']) > 0),
        iconEl: createNodeCreationMenuIcon('undo', { documentObject: documentObject }),
        shortcutActionId: 'undo',
      }),
      handler8(t('canvasInteraction.contextMenu.redo'), handler3('redo', 'Ctrl Y'), () => redo(), {
        disabled: !(Number(historyInfo?.['redoCount']) > 0),
        iconEl: createNodeCreationMenuIcon('redo', { documentObject: documentObject }),
        shortcutActionId: 'redo',
      }),
      showContextMenu(screenX2, screenY2, list10, run())
    );
  }
  function handleTextContextMenu(value25, value26, text2, value27 = {}) {
    const value28 = [],
      handler10 = (value29, value30, value31, value32) =>
        pushRow(value28, value29, value30, value31, value32),
      state5 = run2(),
      value33 = state5['viewport'],
      value34 = state5['nodes'] || {},
      { x: x3, y: y3 } = screenToWorld(value25, value26, value33),
      value35 = String(value27['anchorNodeId'] || '')['trim'](),
      value36 = value35 && value34[value35] ? value35 : hitTestNode(value25, value26, value34, value33),
      box5 = value36 ? value34[value36] : null;
    return (
      box5 &&
        (graphStore['setSelectedNodes']([value36]),
        handler10(
          t('canvasInteraction.contextMenu.copyNode'),
          handler3('copy', 'Ctrl C'),
          () => {
            (handler('copy'),
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
          },
          { icon: 'copy', shortcutActionId: 'copy' },
        ),
        handler10(
          t('canvasInteraction.contextMenu.cutNode'),
          handler3('cut', 'Ctrl X'),
          () => {
            (handler('copy', { ids: [value36] }),
              handler('delete_nodes', { ids: [value36] }),
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
          },
          { icon: 'cut', shortcutActionId: 'cut' },
        ),
        handler10(
          t('canvasInteraction.contextMenu.duplicate'),
          '',
          () => {
            const list11 = run2()['selectedNodeIds'] || [],
              list12 = list11['includes'](value36) ? [...list11] : [value36],
              value37 = list12['length'] === 1 ? box5['height'] || 280 : 300,
              box6 = calcSafeSpawnPosNearNode(value34, box5, 280, value37);
            (handler4(list12, box6['x'] - box5['x'], box6['y'] - box5['y']),
              windowObject?.['showToast']?.(
                t('canvasInteraction.toasts.duplicateWithEdgesCreated'),
                'success',
              ));
          },
          { icon: 'duplicate', shortcutActionId: 'context-canvas-duplicate' },
        )),
      handler10(
        t('canvasInteraction.contextMenu.copyText'),
        'Ctrl C',
        () => {
          navigator['clipboard']
            ['writeText'](text2)
            ['then'](() => {
              (markSystemClipboardWrite({ text: text2 }),
                windowObject?.['showToast']?.(t('canvasInteraction.toasts.selectedTextCopied'), 'success'));
            })
            ['catch'](() => {
              windowObject?.['showToast']?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            });
        },
        { icon: 'copy', shortcutActionId: 'context-canvas-copy-text' },
      ),
      value27['pasteTarget'] &&
        handler10(
          t('canvasInteraction.contextMenu.pasteText'),
          'Ctrl V',
          () => {
            pasteTextIntoEditableFromClipboard(value27['pasteTarget'], value27['pasteSelection'] || null);
          },
          { icon: 'paste', shortcutActionId: 'paste' },
        ),
      box5 &&
        handler10(
          t('canvasInteraction.contextMenu.deleteNode'),
          handler3('delete', 'Del'),
          () => {
            handler('delete_nodes', { ids: [value36] });
          },
          { danger: !![], icon: 'delete', shortcutActionId: 'delete' },
        ),
      pushSeparator(value28),
      AI_GENERATION_TYPES['forEach']((type4) => {
        const width4 = getAIGenerationDefaultSizeByType(type4);
        handler10(
          getAiGenerationActionLabel(type4),
          '',
          () => {
            const width5 =
              type4 === 'ai-image' || type4 === 'ai-video'
                ? getAIGenerationNodeSize(width4['width'], width4['height'])
                : { width: width4['width'], height: width4['height'] };
            let x4 = x3 - width5['width'] / 2,
              y4 = y3 - width5['height'] / 2;
            if (box5) {
              const box7 = calcSafeSpawnPosNearNode(value34, box5, width5['width'], width5['height']);
              ((x4 = box7['x']), (y4 = box7['y']));
            }
            handler('create_node', {
              type: type4,
              x: x4,
              y: y4,
              width: width5['width'],
              height: width5['height'],
              name: getAiGenerationNodeName(type4),
              prompt: text2,
              needsAutoResize: type4 === 'ai-image' || type4 === 'ai-video',
              ...(type4 === 'ai-image' || type4 === 'ai-video' ? { aspectRatio: '自适应' } : {}),
            });
          },
          {
            iconEl: createNodeCreationMenuIcon(type4, { documentObject: documentObject }),
            shortcutActionId: NODE_CREATION_SHORTCUT_ACTIONS[type4],
          },
        );
      }),
      showContextMenu(value25, value26, value28, run())
    );
  }
  return {
    handleNodeContextMenu: handleNodeContextMenu,
    handleTextContextMenu: handleTextContextMenu,
    showCanvasContextMenu: showCanvasContextMenu,
    showNodesContextMenu: showNodesContextMenu,
  };
}
