import {
  createWorkspaceEntityContextMenuItems,
  createWorkspaceProjectContextMenuItems,
} from '../workspaceEntityContextMenu.js';
import { t } from '../../i18n/index.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
import {
  createWorkspaceAssetLibraryContextMenuItems,
  resolveWorkspaceLibraryContextSelection,
} from '../workspaceAssetLibraryContextMenu.js';
import {
  PERSON_REPLACEMENT_LIBRARY_TARGETS,
  getPersonReplacementSelectableAssets,
} from './personReplacementAssetSettingsPresentation.js';
function libraryAssignmentItems(_0x384203, _0x2a50ab, _0x4b40e1) {
  const _0x1902f4 = _0x2a50ab?.['workspace'];
  if (_0x1902f4?.['characterAssetTab'] !== 'library') return [];
  const _0x53c14c = resolveWorkspaceLibraryContextSelection(
    _0x384203,
    _0x1902f4['assetSelectionMode'],
    _0x1902f4['selectedAssetIds'],
  );
  if (
    _0x2a50ab['libraryAssets']['find']((_0x567a54) => _0x567a54['id'] === _0x384203)?.['mediaKind'] ===
    'audio'
  ) {
    const _0x4491b5 = _0x2a50ab['libraryAssets']
      ['filter']((_0x4aa614) => _0x4aa614['mediaKind'] === 'audio' && _0x53c14c['includes'](_0x4aa614['id']))
      ['map']((_0x5f419a) => _0x5f419a['id']);
    return [
      {
        label:
          '加入到音频项目' + (_0x1902f4['assetSelectionMode'] ? '\x20(' + _0x4491b5['length'] + ')' : ''),
        icon: 'folder-open',
        action: () => _0x4b40e1['addLibraryAssets']?.(_0x4491b5, 'audio'),
      },
    ];
  }
  const _0x50f7fd = getPersonReplacementSelectableAssets(_0x2a50ab, 'library')
    ['filter']((_0x4acff1) => _0x53c14c['includes'](_0x4acff1['id']))
    ['map']((_0x5a0688) => _0x5a0688['id']);
  return createWorkspaceAssetLibraryContextMenuItems({
    selectedCount: _0x50f7fd['length'],
    selectionMode: _0x1902f4['assetSelectionMode'],
    items: PERSON_REPLACEMENT_LIBRARY_TARGETS['map'](({ kind: _0x4be800, label: _0x9b3330 }) => ({
      label: _0x9b3330,
      action: () => _0x4b40e1['addLibraryAssets']?.(_0x50f7fd, _0x4be800),
    })),
  });
}
const contextMenuText = (_0x2a808e) => t('workspaceContextMenu.' + _0x2a808e);
function audioBindingItems(_0x1bb749, _0x425db1, _0x17b6e9) {
  const _0x3105a3 = _0x425db1?.['workspace']?.['characterAssetTab'],
    _0x5eb0bc =
      _0x3105a3 === 'library'
        ? _0x425db1['libraryAssets']
        : _0x3105a3 === 'audio'
          ? _0x425db1['audioAssets']
          : [];
  if (
    !(_0x5eb0bc || [])['some'](
      (_0x3c2996) => _0x3c2996['id'] === _0x1bb749 && _0x3c2996['mediaKind'] === 'audio',
    )
  )
    return [];
  const _0x443d4a = _0x425db1['characters'] || [];
  return [
    {
      label: '绑定角色',
      subItems: _0x443d4a['length']
        ? _0x443d4a['map']((_0x226e86) => ({
            label: _0x226e86['name'],
            action: () => _0x17b6e9['bindAudioCharacter']?.(_0x1bb749, _0x226e86['id']),
            thumbnailUrl: getWorkspaceAssetAppearances(_0x226e86)['find'](
              (_0x19582c) => _0x19582c['imageUrl'],
            )?.['imageUrl'],
          }))
        : [{ label: '暂无可绑定的角色', disabled: !![] }],
    },
  ];
}
function normalizeText(_0x37bdae) {
  return String(_0x37bdae ?? '')['trim']();
}
export function resolvePersonReplacementContextMenuItems({
  event: _0x445cd2,
  root: _0x3fd934,
  projects: projects = [],
  commands: commands = {},
  project: project = null,
} = {}) {
  const _0x32d9be = _0x445cd2?.['target'],
    _0x10fcba = _0x32d9be?.['closest']?.('[data-story-open-project]');
  if (_0x10fcba && _0x3fd934?.['contains']?.(_0x10fcba)) {
    const _0x537863 = normalizeText(_0x10fcba['dataset']['storyOpenProject']),
      _0x2da7c7 = (Array['isArray'](projects) ? projects : [])['find'](
        (_0x3c78fc) => normalizeText(_0x3c78fc?.['id']) === _0x537863,
      ),
      _0x1f5b84 = Number(_0x2da7c7?.['archivedAt'] || 0x0) > 0x0;
    return createWorkspaceProjectContextMenuItems({
      archived: _0x1f5b84,
      onOpen: () => commands['openProject']?.(_0x537863),
      onRename: () => commands['renameProject']?.(_0x537863),
      onDuplicate: () => commands['duplicateProject']?.(_0x537863),
      onCollect: () => commands['collectProject']?.(_0x537863),
      onArchive: () => commands['setProjectArchived']?.(_0x537863, !_0x1f5b84),
      onDelete: () => commands['requestDeleteProject']?.(_0x537863),
    });
  }
  const _0x3fef45 = _0x32d9be?.['closest']?.('.story-media-history-entry');
  if (_0x3fef45 && _0x3fd934?.['contains']?.(_0x3fef45)) {
    const _0x392dd4 = _0x3fef45['querySelector']?.('.story-media-history-item'),
      _0x4b2ac2 = _0x3fef45['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('switchResult'),
      activateIcon: 'update',
      activateShortcutActionId: 'context-person-switch-result',
      onActivate: _0x392dd4 ? () => _0x392dd4['click']?.() : null,
      deleteLabel: contextMenuText('deleteResult'),
      deleteShortcutActionId: 'context-person-delete-result',
      onDelete: _0x4b2ac2 ? () => _0x4b2ac2['click']?.() : null,
      deleteDisabled: _0x4b2ac2?.['disabled'] === !![],
    });
  }
  const _0x549664 = _0x32d9be?.['closest']?.('[data-story-asset-id]');
  if (_0x549664 && _0x3fd934?.['contains']?.(_0x549664)) {
    const _0x91fad8 = _0x549664['dataset']['personReplacementShotCard'] === 'true',
      _0x282a6b = _0x549664['closest']?.('.story-asset-card-shell, .story-clip-card-shell'),
      _0x534ab1 = _0x282a6b?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText(_0x91fad8 ? 'selectClip' : 'viewAsset'),
      activateIcon: 'enable',
      activateShortcutActionId: _0x91fad8 ? 'context-story-select-clip' : 'context-story-view-asset',
      onActivate: () => _0x549664['click']?.(),
      extraItems: _0x91fad8
        ? []
        : [
            ...audioBindingItems(_0x549664['dataset']['storyAssetId'], project, commands),
            ...libraryAssignmentItems(_0x549664['dataset']['storyAssetId'], project, commands),
          ],
      deleteLabel: contextMenuText(_0x91fad8 ? 'deleteClip' : 'deleteAsset'),
      deleteShortcutActionId: _0x91fad8 ? 'context-story-delete-clip' : 'context-story-delete-asset',
      onDelete: _0x534ab1 ? () => _0x534ab1['click']?.() : null,
      deleteDisabled: _0x534ab1?.['disabled'] === !![],
    });
  }
  return [];
}
