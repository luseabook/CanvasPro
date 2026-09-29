import {
  createWorkspaceEntityContextMenuItems,
  createWorkspaceProjectContextMenuItems,
} from '../workspaceEntityContextMenu.js';
import { t } from '../../i18n/index.js';
import {
  createWorkspaceAssetLibraryContextMenuItems,
  resolveWorkspaceLibraryContextSelection,
} from '../workspaceAssetLibraryContextMenu.js';
import { createStoryAssetSettingsProjection } from './storyAssetSettingsProjection.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
const assetSettingsProjection = createStoryAssetSettingsProjection();
function audioBindingItems(_0x1fc580, _0x275d9d, _0x3b6127, _0x3df83a) {
  const _0x451c64 =
    _0x275d9d['assetFilter'] === 'library'
      ? _0x3b6127
      : _0x275d9d['assetFilter'] === 'audio'
        ? _0x275d9d['data']?.['audioAssets'] || []
        : [];
  if (!_0x451c64['some']((_0x3b8515) => _0x3b8515['id'] === _0x1fc580 && _0x3b8515['mediaKind'] === 'audio'))
    return [];
  const _0x55e528 = _0x275d9d['data']?.['project']?.['id'],
    _0xb6a439 = (_0x275d9d['data']?.['assets'] || [])['filter'](
      (_0x2abb5c) => _0x2abb5c['kind'] === 'character',
    );
  return [
    {
      label: '绑定角色',
      subItems: _0xb6a439['length']
        ? _0xb6a439['map']((_0x4867c9) => ({
            label: _0x4867c9['name'],
            thumbnailUrl: getWorkspaceAssetAppearances(_0x4867c9)['find'](
              (_0x4bdab6) => _0x4bdab6['imageUrl'],
            )?.['imageUrl'],
            action: () => {
              if (_0x275d9d['data']?.['project']?.['id'] === _0x55e528)
                _0x3df83a['bindAudioCharacter']?.(_0x1fc580, _0x4867c9['id']);
            },
          }))
        : [{ label: '暂无可绑定的角色', disabled: !![] }],
    },
  ];
}
function libraryAssignmentItems(_0xc37bfe, _0x5a156f, _0x407956, _0x5a0bc6, _0x341138) {
  if (_0x5a156f['assetFilter'] !== 'library') return [];
  const _0x27067a = _0x5a156f['data']?.['project']?.['id'],
    _0x3dee90 = resolveWorkspaceLibraryContextSelection(
      _0xc37bfe,
      _0x5a156f['assetSelectionMode'],
      _0x5a156f['selectedAssetIds'],
    );
  if (_0x407956['find']((_0x154363) => _0x154363['id'] === _0xc37bfe)?.['mediaKind'] === 'audio') {
    const _0x25bc6c = _0x407956['filter'](
      (_0x4cfa07) => _0x3dee90['includes'](_0x4cfa07['id']) && _0x4cfa07['mediaKind'] === 'audio',
    )['map']((_0x46cb7b) => _0x46cb7b['id']);
    return [
      {
        label:
          '加入到音频项目' + (_0x5a156f['assetSelectionMode'] ? '\x20(' + _0x25bc6c['length'] + ')' : ''),
        icon: 'folder-open',
        action: () => {
          if (_0x5a156f['data']?.['project']?.['id'] !== _0x27067a || _0x5a156f['assetFilter'] !== 'library')
            return;
          _0x341138['addLibraryAudioAssets']?.(_0x25bc6c);
        },
      },
    ];
  }
  const _0x149efc = _0x407956['filter'](
      (_0x1dfaec) =>
        _0x3dee90['includes'](_0x1dfaec['id']) &&
        _0x1dfaec['mediaKind'] === 'image' &&
        (_0x1dfaec['sourceUrl'] || _0x1dfaec['imageUrl']),
    )['map']((_0x41e158) => _0x41e158['id']),
    _0x5900fe = assetSettingsProjection['projectAssetControl']('library-selection', {
      projectAssets: _0x5a156f['data']?.['assets'],
      getTabLabel: _0x5a0bc6,
      selectedCount: _0x149efc['length'],
    }),
    _0x30b420 = (_0x2f87b4, _0x5857f4, _0x403bf6) => {
      if (_0x5a156f['data']?.['project']?.['id'] !== _0x27067a || _0x5a156f['assetFilter'] !== 'library')
        return;
      _0x341138['addLibraryAssets']?.(_0x149efc, _0x2f87b4, _0x5857f4, _0x403bf6);
    };
  return createWorkspaceAssetLibraryContextMenuItems({
    selectedCount: _0x149efc['length'],
    selectionMode: _0x5a156f['assetSelectionMode'],
    items: _0x5900fe['targetGroups']['map']((_0x2ec7aa) => ({
      label: _0x2ec7aa['label'],
      subItems: _0x2ec7aa['targets']['length']
        ? _0x2ec7aa['targets']['map']((_0x40d259) => ({
            label: _0x40d259['name'],
            subItems: [
              ..._0x40d259['appearances']['map']((_0x50b150) => ({
                label: normalizeText(_0x50b150['name']) || '未命名形象',
                disabled: _0x149efc['length'] !== 0x1,
                action: () => _0x30b420(_0x40d259['id'], _0x50b150['id'], ![]),
              })),
              { label: '新增形象', icon: 'add', action: () => _0x30b420(_0x40d259['id'], '', !![]) },
            ],
          }))
        : [{ label: '本剧暂无可绑定的' + _0x2ec7aa['label'], disabled: !![] }],
    })),
  });
}
const contextMenuText = (_0x444548) => t('workspaceContextMenu.' + _0x444548);
function normalizeText(_0x2c4ea4) {
  return String(_0x2c4ea4 ?? '')['trim']();
}
export function resolveStoryWorkspaceContextMenuItems({
  event: _0x1d928a,
  root: _0x22841c,
  projects: projects = [],
  commands: commands = {},
  state: state = {},
  libraryAssets: libraryAssets = [],
  getTabLabel: _0x59b47e,
} = {}) {
  const _0x5705ee = _0x1d928a?.['target'],
    _0x22de7b = _0x5705ee?.['closest']?.('[data-story-open-project]');
  if (_0x22de7b && _0x22841c?.['contains']?.(_0x22de7b)) {
    const _0x36fdd0 = normalizeText(_0x22de7b['dataset']['storyOpenProject']),
      _0x31249f = (Array['isArray'](projects) ? projects : [])['find'](
        (_0x9f32ca) =>
          normalizeText(_0x9f32ca?.['id'] || _0x9f32ca?.['data']?.['project']?.['id']) === _0x36fdd0,
      ),
      _0x569073 = Number(_0x31249f?.['archivedAt'] || 0x0) > 0x0;
    return createWorkspaceProjectContextMenuItems({
      archived: _0x569073,
      onOpen: () => commands['openProject']?.(_0x36fdd0),
      onRename: () => commands['renameProject']?.(_0x36fdd0),
      onDuplicate: () => commands['duplicateProject']?.(_0x36fdd0),
      onCollect: () => commands['collectProject']?.(_0x36fdd0),
      onArchive: () => commands['setProjectArchived']?.(_0x36fdd0, !_0x569073),
      onDelete: () => commands['requestDeleteProject']?.(_0x36fdd0),
    });
  }
  const _0x1d6c2d = _0x5705ee?.['closest']?.('.story-media-history-entry');
  if (_0x1d6c2d && _0x22841c?.['contains']?.(_0x1d6c2d)) {
    const _0x4a9565 = _0x1d6c2d['querySelector']?.('.story-media-history-item'),
      _0x344617 = _0x1d6c2d['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('switchVersion'),
      activateIcon: 'update',
      activateShortcutActionId: 'context-story-switch-version',
      onActivate: _0x4a9565 ? () => _0x4a9565['click']?.() : null,
      deleteLabel: contextMenuText('deleteVersion'),
      deleteShortcutActionId: 'context-story-delete-version',
      onDelete: _0x344617 ? () => _0x344617['click']?.() : null,
      deleteDisabled: _0x344617?.['disabled'] === !![],
    });
  }
  const _0xdff540 = _0x5705ee?.['closest']?.('.story-clip-card[data-story-clip-id]');
  if (_0xdff540 && _0x22841c?.['contains']?.(_0xdff540)) {
    const _0x321efc = _0xdff540['closest']?.('.story-clip-card-shell'),
      _0x4407c2 = _0x321efc?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('selectClip'),
      activateIcon: 'enable',
      activateShortcutActionId: 'context-story-select-clip',
      onActivate: () => _0xdff540['click']?.(),
      deleteLabel: contextMenuText('deleteClip'),
      deleteShortcutActionId: 'context-story-delete-clip',
      onDelete: _0x4407c2 ? () => _0x4407c2['click']?.() : null,
      deleteDisabled: _0x4407c2?.['disabled'] === !![],
    });
  }
  const _0xbe07e2 = _0x5705ee?.['closest']?.('[data-story-asset-id]');
  if (_0xbe07e2 && _0x22841c?.['contains']?.(_0xbe07e2)) {
    const _0x4a50aa = _0xbe07e2['closest']?.('.story-asset-card-shell'),
      _0x24d308 = _0x4a50aa?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('viewAsset'),
      activateIcon: 'enable',
      activateShortcutActionId: 'context-story-view-asset',
      onActivate: () => _0xbe07e2['click']?.(),
      extraItems: [
        ...audioBindingItems(_0xbe07e2['dataset']['storyAssetId'], state, libraryAssets, commands),
        ...libraryAssignmentItems(
          _0xbe07e2['dataset']['storyAssetId'],
          state,
          libraryAssets,
          _0x59b47e,
          commands,
        ),
      ],
      deleteLabel: contextMenuText('deleteAsset'),
      deleteShortcutActionId: 'context-story-delete-asset',
      onDelete: _0x24d308 ? () => _0x24d308['click']?.() : null,
      deleteDisabled: _0x24d308?.['disabled'] === !![],
    });
  }
  return [];
}
