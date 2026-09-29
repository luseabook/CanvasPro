import { canvasCommandRegistry, executeCanvasCommandSync } from '../canvasCommands/index.js';
export function createInteractionCommandAdapter({
  store: _0x387134,
  graphStore: _0x2d0cd5,
  uiStore: _0x4660df,
  commit: _0x552abb,
  buildNodeData: _0x3aec8c,
  getNodeDefaultSize: _0x1530da,
  getAIGenerationDefaultSizeByType: _0x283868,
  getAIGenerationNodeSize: _0x5f4da0,
  connectNodes: _0x1f63b8,
  clipboard: _0x4f12e2,
  focusNodes: _0x5e0654,
  translate: _0x31b933,
  showToast: _0xf8f4da,
  scheduleFrame: _0xef3619,
  windowObject: _0x5b5eec,
  commandRegistry: commandRegistry = canvasCommandRegistry,
  recordCommand: _0x543b89,
} = {}) {
  const _0x34267e = {
    store: _0x387134,
    graphStore: _0x2d0cd5 || _0x387134,
    uiStore: _0x4660df || _0x387134,
    commit: _0x552abb,
    buildNodeData: _0x3aec8c,
    getNodeDefaultSize: _0x1530da,
    getAIGenerationDefaultSizeByType: _0x283868,
    getAIGenerationNodeSize: _0x5f4da0,
    connectNodes: _0x1f63b8,
    clipboard: _0x4f12e2,
    focusNodes: _0x5e0654,
    translate: _0x31b933,
    showToast: _0xf8f4da,
    scheduleFrame: _0xef3619,
    windowObject: _0x5b5eec,
    commandRegistry: commandRegistry,
    recordCommand: _0x543b89,
  };
  return {
    executeCanvasCommand(_0x191f00, _0x415d3f = {}) {
      return executeCanvasCommandSync(_0x191f00, _0x415d3f, _0x34267e);
    },
    execute(_0x5eed53, _0x8ce464 = {}) {
      const _0x287408 = _0x387134?.['getStateRaw']?.() || _0x387134?.['getState']?.() || {};
      switch (String(_0x5eed53 || '')) {
        case 'delete_edge':
          executeCanvasCommandSync(
            'graph.disconnect',
            { edgeId: _0x8ce464['edgeId'] || _0x8ce464['id'] },
            _0x34267e,
          );
          return !![];
        case 'delete_nodes':
          executeCanvasCommandSync('node.delete', { ids: _0x8ce464['ids'] }, _0x34267e);
          return !![];
        case 'rename_node':
          if (!_0x8ce464['id'] || typeof _0x8ce464['name'] !== 'string') return !![];
          executeCanvasCommandSync(
            'node.rename',
            { nodeId: _0x8ce464['id'], name: _0x8ce464['name'] },
            _0x34267e,
          );
          return !![];
        case 'create_node':
          executeCanvasCommandSync(
            'node.create',
            { ..._0x8ce464, name: _0x8ce464['name'] || _0x8ce464['label'] || '' },
            _0x34267e,
          );
          return !![];
        case 'group':
        case 'create_group':
          executeCanvasCommandSync(
            'node.group',
            { ids: _0x8ce464['ids'], name: _0x8ce464['name'] },
            _0x34267e,
          );
          return !![];
        case 'ungroup':
          executeCanvasCommandSync('node.ungroup', { ids: _0x8ce464['ids'] }, _0x34267e);
          return !![];
        case 'copy':
          executeCanvasCommandSync('clipboard.copy', { ids: _0x8ce464['ids'] }, _0x34267e);
          return !![];
        case 'paste':
          executeCanvasCommandSync('clipboard.paste', { x: _0x8ce464['x'], y: _0x8ce464['y'] }, _0x34267e);
          return !![];
        case 'create_collage_from_selection': {
          const _0x4fbcb0 = executeCanvasCommandSync(
            'collage.createFromSelection',
            { ids: _0x8ce464['ids'] },
            _0x34267e,
          );
          return (
            !_0x4fbcb0['ok'] &&
              _0x4fbcb0['errorCode'] === 'NO_COLLAGE_IMAGES' &&
              _0xf8f4da?.(_0x4fbcb0['message'], 'warning'),
            !![]
          );
        }
        case 'reset_source_media_size':
        case 'reset_source_image_size':
          executeCanvasCommandSync('media.resetSize', { ids: _0x8ce464['ids'] }, _0x34267e);
          return !![];
        case 'hide_picker':
          (_0x4660df || _0x387134)?.['hidePicker']?.();
          return !![];
        case 'set_pick_connect_mode':
          (_0x4660df || _0x387134)?.['setPickConnectMode']?.({
            active: !!_0x8ce464['active'],
            sourceNodeId: _0x8ce464['sourceNodeId'] !== undefined ? _0x8ce464['sourceNodeId'] : null,
            handleDirection: _0x8ce464['handleDirection'] !== undefined ? _0x8ce464['handleDirection'] : null,
            hoverNodeId: _0x8ce464['hoverNodeId'] !== undefined ? _0x8ce464['hoverNodeId'] : null,
          });
          return !![];
        case 'select_all': {
          const _0x22e222 = Object['keys'](_0x287408['nodes'] || {});
          if (_0x22e222['length'] === 0x0)
            return ((_0x2d0cd5 || _0x387134)?.['setSelectedNodes']?.([]), !![]);
          return (executeCanvasCommandSync('node.select', { ids: _0x22e222 }, _0x34267e), !![]);
        }
        case 'align_nodes': {
          if (_0x287408['ui']?.['alignFeatureEnabled'] === ![]) return !![];
          const _0xb1cb3a = String(_0x8ce464['mode'] || '')['trim']();
          if (_0xb1cb3a === 'arrange-grid') {
            const _0x2c3eef = Number(_0x287408['ui']?.['alignDistributeGap']),
              _0x2ff83c = Number['isFinite'](_0x2c3eef) && _0x2c3eef >= 0x0 ? _0x2c3eef : 0x28;
            return (
              executeCanvasCommandSync(
                'layout.arrangeGrid',
                {
                  ids: _0x287408['selectedNodeIds'] || [],
                  columns: _0x8ce464['columns'],
                  gapX: _0x2ff83c,
                  gapY: _0x2ff83c,
                },
                _0x34267e,
              ),
              !![]
            );
          }
          if (_0xb1cb3a === 'distribute-h' || _0xb1cb3a === 'distribute-v')
            return (
              executeCanvasCommandSync(
                'layout.distribute',
                {
                  ids: _0x287408['selectedNodeIds'] || [],
                  axis: _0xb1cb3a === 'distribute-h' ? 'horizontal' : 'vertical',
                },
                _0x34267e,
              ),
              !![]
            );
          return (
            executeCanvasCommandSync(
              'layout.align',
              { ids: _0x287408['selectedNodeIds'] || [], mode: _0xb1cb3a },
              _0x34267e,
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
