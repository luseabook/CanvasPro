import { canvasCommandRegistry, executeCanvasCommandSync } from '../canvasCommands/index.js';
export function createInteractionCommandAdapter({
  store: store,
  graphStore: graphStore,
  uiStore: uiStore,
  commit: commit,
  buildNodeData: buildNodeData,
  getNodeDefaultSize: getNodeDefaultSize,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize: getAIGenerationNodeSize,
  connectNodes: connectNodes,
  clipboard: clipboard,
  focusNodes: focusNodes,
  translate: translate,
  showToast: showToast,
  scheduleFrame: scheduleFrame,
  windowObject: windowObject,
  commandRegistry: commandRegistry = canvasCommandRegistry,
  recordCommand: recordCommand,
} = {}) {
  const value = {
    store: store,
    graphStore: graphStore || store,
    uiStore: uiStore || store,
    commit: commit,
    buildNodeData: buildNodeData,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    connectNodes: connectNodes,
    clipboard: clipboard,
    focusNodes: focusNodes,
    translate: translate,
    showToast: showToast,
    scheduleFrame: scheduleFrame,
    windowObject: windowObject,
    commandRegistry: commandRegistry,
    recordCommand: recordCommand,
  };
  return {
    executeCanvasCommand(item, key = {}) {
      return executeCanvasCommandSync(item, key, value);
    },
    execute(index, edgeId = {}) {
      const ids = store?.['getStateRaw']?.() || store?.['getState']?.() || {};
      switch (String(index || '')) {
        case 'delete_edge':
          executeCanvasCommandSync('graph.disconnect', { edgeId: edgeId['edgeId'] || edgeId['id'] }, value);
          return !![];
        case 'delete_nodes':
          executeCanvasCommandSync('node.delete', { ids: edgeId['ids'] }, value);
          return !![];
        case 'rename_node':
          if (!edgeId['id'] || typeof edgeId['name'] !== 'string') return !![];
          executeCanvasCommandSync('node.rename', { nodeId: edgeId['id'], name: edgeId['name'] }, value);
          return !![];
        case 'create_node':
          executeCanvasCommandSync(
            'node.create',
            { ...edgeId, name: edgeId['name'] || edgeId['label'] || '' },
            value,
          );
          return !![];
        case 'group':
        case 'create_group':
          executeCanvasCommandSync('node.group', { ids: edgeId['ids'], name: edgeId['name'] }, value);
          return !![];
        case 'ungroup':
          executeCanvasCommandSync('node.ungroup', { ids: edgeId['ids'] }, value);
          return !![];
        case 'copy':
          executeCanvasCommandSync('clipboard.copy', { ids: edgeId['ids'] }, value);
          return !![];
        case 'paste':
          executeCanvasCommandSync('clipboard.paste', { x: edgeId['x'], y: edgeId['y'] }, value);
          return !![];
        case 'create_collage_from_selection': {
          const error = executeCanvasCommandSync(
            'collage.createFromSelection',
            { ids: edgeId['ids'] },
            value,
          );
          return (
            !error['ok'] &&
              error['errorCode'] === 'NO_COLLAGE_IMAGES' &&
              showToast?.(error['message'], 'warning'),
            !![]
          );
        }
        case 'reset_source_media_size':
        case 'reset_source_image_size':
          executeCanvasCommandSync('media.resetSize', { ids: edgeId['ids'] }, value);
          return !![];
        case 'hide_picker':
          (uiStore || store)?.['hidePicker']?.();
          return !![];
        case 'set_pick_connect_mode':
          (uiStore || store)?.['setPickConnectMode']?.({
            active: !!edgeId['active'],
            sourceNodeId: edgeId['sourceNodeId'] !== undefined ? edgeId['sourceNodeId'] : null,
            handleDirection: edgeId['handleDirection'] !== undefined ? edgeId['handleDirection'] : null,
            hoverNodeId: edgeId['hoverNodeId'] !== undefined ? edgeId['hoverNodeId'] : null,
          });
          return !![];
        case 'select_all': {
          const ids2 = Object['keys'](ids['nodes'] || {});
          if (ids2['length'] === 0) return ((graphStore || store)?.['setSelectedNodes']?.([]), !![]);
          return (executeCanvasCommandSync('node.select', { ids: ids2 }, value), !![]);
        }
        case 'align_nodes': {
          if (ids['ui']?.['alignFeatureEnabled'] === ![]) return !![];
          const axis = String(edgeId['mode'] || '')['trim']();
          if (axis === 'arrange-grid') {
            const count = Number(ids['ui']?.['alignDistributeGap']),
              gapX = Number['isFinite'](count) && count >= 0 ? count : 40;
            return (
              executeCanvasCommandSync(
                'layout.arrangeGrid',
                {
                  ids: ids['selectedNodeIds'] || [],
                  columns: edgeId['columns'],
                  gapX: gapX,
                  gapY: gapX,
                },
                value,
              ),
              !![]
            );
          }
          if (axis === 'distribute-h' || axis === 'distribute-v')
            return (
              executeCanvasCommandSync(
                'layout.distribute',
                {
                  ids: ids['selectedNodeIds'] || [],
                  axis: axis === 'distribute-h' ? 'horizontal' : 'vertical',
                },
                value,
              ),
              !![]
            );
          return (
            executeCanvasCommandSync(
              'layout.align',
              { ids: ids['selectedNodeIds'] || [], mode: axis },
              value,
            ),
            !![]
          );
        }
        default:
          return ![];
      }
    },
  };
}
