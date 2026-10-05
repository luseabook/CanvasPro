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
function libraryAssignmentItems(value, item, key) {
  const selectionMode = item?.['workspace'];
  if (selectionMode?.['characterAssetTab'] !== 'library') return [];
  const list = resolveWorkspaceLibraryContextSelection(
    value,
    selectionMode['assetSelectionMode'],
    selectionMode['selectedAssetIds'],
  );
  if (item['libraryAssets']['find']((index) => index['id'] === value)?.['mediaKind'] === 'audio') {
    const list2 = item['libraryAssets']
      ['filter']((result) => result['mediaKind'] === 'audio' && list['includes'](result['id']))
      ['map']((data) => data['id']);
    return [
      {
        label:
          '加入到音频项目' + (selectionMode['assetSelectionMode'] ? ' (' + list2['length'] + ')' : ''),
        icon: 'folder-open',
        action: () => key['addLibraryAssets']?.(list2, 'audio'),
      },
    ];
  }
  const selectedCount = getPersonReplacementSelectableAssets(item, 'library')
    ['filter']((options) => list['includes'](options['id']))
    ['map']((target) => target['id']);
  return createWorkspaceAssetLibraryContextMenuItems({
    selectedCount: selectedCount['length'],
    selectionMode: selectionMode['assetSelectionMode'],
    items: PERSON_REPLACEMENT_LIBRARY_TARGETS['map'](({ kind: kind, label: label }) => ({
      label: label,
      action: () => key['addLibraryAssets']?.(selectedCount, kind),
    })),
  });
}
const contextMenuText = (source) => t('workspaceContextMenu.' + source);
function audioBindingItems(next, current, entry) {
  const record = current?.['workspace']?.['characterAssetTab'],
    payload =
      record === 'library' ? current['libraryAssets'] : record === 'audio' ? current['audioAssets'] : [];
  if (!(payload || [])['some']((handle) => handle['id'] === next && handle['mediaKind'] === 'audio'))
    return [];
  const subItems = current['characters'] || [];
  return [
    {
      label: '绑定角色',
      subItems: subItems['length']
        ? subItems['map']((label2) => ({
            label: label2['name'],
            action: () => entry['bindAudioCharacter']?.(next, label2['id']),
            thumbnailUrl: getWorkspaceAssetAppearances(label2)['find']((state) => state['imageUrl'])?.[
              'imageUrl'
            ],
          }))
        : [{ label: '暂无可绑定的角色', disabled: true }],
    },
  ];
}
function normalizeText(config) {
  return String(config ?? '')['trim']();
}
export function resolvePersonReplacementContextMenuItems({
  event: event,
  root: root,
  projects: projects = [],
  commands: commands = {},
  project: project = null,
} = {}) {
  const el = event?.['target'],
    el2 = el?.['closest']?.('[data-story-open-project]');
  if (el2 && root?.['contains']?.(el2)) {
    const text = normalizeText(el2['dataset']['storyOpenProject']),
      scope = (Array['isArray'](projects) ? projects : [])['find'](
        (input) => normalizeText(input?.['id']) === text,
      ),
      archived = Number(scope?.['archivedAt'] || 0) > 0;
    return createWorkspaceProjectContextMenuItems({
      archived: archived,
      onOpen: () => commands['openProject']?.(text),
      onRename: () => commands['renameProject']?.(text),
      onDuplicate: () => commands['duplicateProject']?.(text),
      onCollect: () => commands['collectProject']?.(text),
      onArchive: () => commands['setProjectArchived']?.(text, !archived),
      onDelete: () => commands['requestDeleteProject']?.(text),
    });
  }
  const el3 = el?.['closest']?.('.story-media-history-entry');
  if (el3 && root?.['contains']?.(el3)) {
    const onActivate = el3['querySelector']?.('.story-media-history-item'),
      onDelete = el3['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('switchResult'),
      activateIcon: 'update',
      activateShortcutActionId: 'context-person-switch-result',
      onActivate: onActivate ? () => onActivate['click']?.() : null,
      deleteLabel: contextMenuText('deleteResult'),
      deleteShortcutActionId: 'context-person-delete-result',
      onDelete: onDelete ? () => onDelete['click']?.() : null,
      deleteDisabled: onDelete?.['disabled'] === true,
    });
  }
  const el4 = el?.['closest']?.('[data-story-asset-id]');
  if (el4 && root?.['contains']?.(el4)) {
    const activateShortcutActionId = el4['dataset']['personReplacementShotCard'] === 'true',
      el5 = el4['closest']?.('.story-asset-card-shell, .story-clip-card-shell'),
      onDelete2 = el5?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText(activateShortcutActionId ? 'selectClip' : 'viewAsset'),
      activateIcon: 'enable',
      activateShortcutActionId: activateShortcutActionId
        ? 'context-story-select-clip'
        : 'context-story-view-asset',
      onActivate: () => el4['click']?.(),
      extraItems: activateShortcutActionId
        ? []
        : [
            ...audioBindingItems(el4['dataset']['storyAssetId'], project, commands),
            ...libraryAssignmentItems(el4['dataset']['storyAssetId'], project, commands),
          ],
      deleteLabel: contextMenuText(activateShortcutActionId ? 'deleteClip' : 'deleteAsset'),
      deleteShortcutActionId: activateShortcutActionId
        ? 'context-story-delete-clip'
        : 'context-story-delete-asset',
      onDelete: onDelete2 ? () => onDelete2['click']?.() : null,
      deleteDisabled: onDelete2?.['disabled'] === true,
    });
  }
  return [];
}
