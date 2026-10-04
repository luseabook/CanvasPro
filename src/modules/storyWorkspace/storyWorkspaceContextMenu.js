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
function audioBindingItems(value, item, key, index) {
  const list =
    item['assetFilter'] === 'library'
      ? key
      : item['assetFilter'] === 'audio'
        ? item['data']?.['audioAssets'] || []
        : [];
  if (!list['some']((result) => result['id'] === value && result['mediaKind'] === 'audio')) return [];
  const data = item['data']?.['project']?.['id'],
    subItems = (item['data']?.['assets'] || [])['filter']((options) => options['kind'] === 'character');
  return [
    {
      label: '绑定角色',
      subItems: subItems['length']
        ? subItems['map']((label) => ({
            label: label['name'],
            thumbnailUrl: getWorkspaceAssetAppearances(label)['find']((target) => target['imageUrl'])?.[
              'imageUrl'
            ],
            action: () => {
              if (item['data']?.['project']?.['id'] === data)
                index['bindAudioCharacter']?.(value, label['id']);
            },
          }))
        : [{ label: '暂无可绑定的角色', disabled: !![] }],
    },
  ];
}
function libraryAssignmentItems(source, projectAssets, list2, getTabLabel, next) {
  if (projectAssets['assetFilter'] !== 'library') return [];
  const current = projectAssets['data']?.['project']?.['id'],
    list3 = resolveWorkspaceLibraryContextSelection(
      source,
      projectAssets['assetSelectionMode'],
      projectAssets['selectedAssetIds'],
    );
  if (list2['find']((entry) => entry['id'] === source)?.['mediaKind'] === 'audio') {
    const list4 = list2['filter'](
      (record) => list3['includes'](record['id']) && record['mediaKind'] === 'audio',
    )['map']((payload) => payload['id']);
    return [
      {
        label:
          '加入到音频项目' + (projectAssets['assetSelectionMode'] ? '\x20(' + list4['length'] + ')' : ''),
        icon: 'folder-open',
        action: () => {
          if (
            projectAssets['data']?.['project']?.['id'] !== current ||
            projectAssets['assetFilter'] !== 'library'
          )
            return;
          next['addLibraryAudioAssets']?.(list4);
        },
      },
    ];
  }
  const selectedCount = list2['filter'](
      (handle) =>
        list3['includes'](handle['id']) &&
        handle['mediaKind'] === 'image' &&
        (handle['sourceUrl'] || handle['imageUrl']),
    )['map']((config) => config['id']),
    items = assetSettingsProjection['projectAssetControl']('library-selection', {
      projectAssets: projectAssets['data']?.['assets'],
      getTabLabel: getTabLabel,
      selectedCount: selectedCount['length'],
    }),
    handler = (scope, input, output) => {
      if (
        projectAssets['data']?.['project']?.['id'] !== current ||
        projectAssets['assetFilter'] !== 'library'
      )
        return;
      next['addLibraryAssets']?.(selectedCount, scope, input, output);
    };
  return createWorkspaceAssetLibraryContextMenuItems({
    selectedCount: selectedCount['length'],
    selectionMode: projectAssets['assetSelectionMode'],
    items: items['targetGroups']['map']((label2) => ({
      label: label2['label'],
      subItems: label2['targets']['length']
        ? label2['targets']['map']((label3) => ({
            label: label3['name'],
            subItems: [
              ...label3['appearances']['map']((error) => ({
                label: normalizeText(error['name']) || '未命名形象',
                disabled: selectedCount['length'] !== 0x1,
                action: () => handler(label3['id'], error['id'], ![]),
              })),
              { label: '新增形象', icon: 'add', action: () => handler(label3['id'], '', !![]) },
            ],
          }))
        : [{ label: '本剧暂无可绑定的' + label2['label'], disabled: !![] }],
    })),
  });
}
const contextMenuText = (value2) => t('workspaceContextMenu.' + value2);
function normalizeText(value3) {
  return String(value3 ?? '')['trim']();
}
export function resolveStoryWorkspaceContextMenuItems({
  event: event,
  root: root,
  projects: projects = [],
  commands: commands = {},
  state: state = {},
  libraryAssets: libraryAssets = [],
  getTabLabel: getTabLabel2,
} = {}) {
  const el = event?.['target'],
    el2 = el?.['closest']?.('[data-story-open-project]');
  if (el2 && root?.['contains']?.(el2)) {
    const text = normalizeText(el2['dataset']['storyOpenProject']),
      value4 = (Array['isArray'](projects) ? projects : [])['find'](
        (value5) => normalizeText(value5?.['id'] || value5?.['data']?.['project']?.['id']) === text,
      ),
      archived = Number(value4?.['archivedAt'] || 0x0) > 0x0;
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
      activateLabel: contextMenuText('switchVersion'),
      activateIcon: 'update',
      activateShortcutActionId: 'context-story-switch-version',
      onActivate: onActivate ? () => onActivate['click']?.() : null,
      deleteLabel: contextMenuText('deleteVersion'),
      deleteShortcutActionId: 'context-story-delete-version',
      onDelete: onDelete ? () => onDelete['click']?.() : null,
      deleteDisabled: onDelete?.['disabled'] === !![],
    });
  }
  const el4 = el?.['closest']?.('.story-clip-card[data-story-clip-id]');
  if (el4 && root?.['contains']?.(el4)) {
    const el5 = el4['closest']?.('.story-clip-card-shell'),
      onDelete2 = el5?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('selectClip'),
      activateIcon: 'enable',
      activateShortcutActionId: 'context-story-select-clip',
      onActivate: () => el4['click']?.(),
      deleteLabel: contextMenuText('deleteClip'),
      deleteShortcutActionId: 'context-story-delete-clip',
      onDelete: onDelete2 ? () => onDelete2['click']?.() : null,
      deleteDisabled: onDelete2?.['disabled'] === !![],
    });
  }
  const el6 = el?.['closest']?.('[data-story-asset-id]');
  if (el6 && root?.['contains']?.(el6)) {
    const el7 = el6['closest']?.('.story-asset-card-shell'),
      onDelete3 = el7?.['querySelector']?.('.story-card-delete-control');
    return createWorkspaceEntityContextMenuItems({
      activateLabel: contextMenuText('viewAsset'),
      activateIcon: 'enable',
      activateShortcutActionId: 'context-story-view-asset',
      onActivate: () => el6['click']?.(),
      extraItems: [
        ...audioBindingItems(el6['dataset']['storyAssetId'], state, libraryAssets, commands),
        ...libraryAssignmentItems(
          el6['dataset']['storyAssetId'],
          state,
          libraryAssets,
          getTabLabel2,
          commands,
        ),
      ],
      deleteLabel: contextMenuText('deleteAsset'),
      deleteShortcutActionId: 'context-story-delete-asset',
      onDelete: onDelete3 ? () => onDelete3['click']?.() : null,
      deleteDisabled: onDelete3?.['disabled'] === !![],
    });
  }
  return [];
}
