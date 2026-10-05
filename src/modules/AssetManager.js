import appStore from '../core/stores/appStore.js';
import {
  MATERIAL_FOLDER_ICON_MARKUP,
  MATERIAL_TREE_CHEVRON_ICON_SVG,
} from '../components/sharedIconMarkup.js';
import { findAvailablePosition, generateId, screenToWorld } from '../core/math.js';
import { getImage } from './storage.js';
import {
  fetchAssetsFromServer,
  fetchAssetCategorySettingsFromServer,
  saveAssetToServer,
  saveAssetCategoriesToServer,
  deleteAssetFromServer,
  saveAssetThumbToServer,
} from '../../api/projectsV2Api.js';
import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { createMaterialLibraryContextMenuController } from './materialLibraryContextMenu.js';
import {
  removeAssetMentionAsset,
  setAssetMentionLibrarySettings,
  setAssetMentionAssets,
  upsertAssetMentionAsset,
} from './assetMentionRegistry.js';
import { createReferenceFallbackThumbHtml } from './referenceThumbnailFallback.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { prepareAssetNodeForRestore, prepareAssetNodesForRestore } from './assetRestoreLayout.js';
import { getLocale, t } from '../i18n/index.js';
import { preloadCanvasImage } from './canvasMediaScheduler.js';
import { playAssetCreateFly } from './assetCreateFly.js';
import {
  fitAssetMaterialVideoThumbnail,
  getAssetMaterialVideoThumbnailKey,
  isAssetMaterialThumbnailUrl,
  isAssetMaterialVideoThumbnailUrl,
  resolveAssetMaterialVideoSourceUrl,
  resolveAssetNodeCoverThumbId,
  resolveAssetNodeCoverUrl,
  resolveAssetNodePreviewAspectRatio,
  resolveAssetNodePreviewUrl,
  resolveMaterialItemPreviewUrl,
  resolveMaterialItemThumbUrl,
} from './assetCoverResolver.js';
import { upsertMediaAssetPackage } from './assetPackageMedia.js';
import { saveMediaFilesDownload } from '../services/downloadSaveService.js';
import { getShortcutLabel, resolveShortcutActionForEvent } from './shortcuts.js';
import {
  buildMaterialCategoryRenamePlan,
  buildMaterialDownloadFiles,
  buildMaterialDuplicate,
  DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
  deleteMaterialFolderParent,
  getMaterialAssetItems,
  getMaterialFolderAssetCounts,
  getMaterialLibraryGroups,
  isMaterialAssetFavorite,
  MATERIAL_LIBRARY_CATEGORY_LIMIT,
  normalizeMaterialFolderParents,
  renameMaterialFolderParent,
} from './materialLibraryPolicy.js';
const DEFAULT_ASSET_CATEGORIES = DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
  REPLACEMENT_STUDIO_CATEGORY = '替换工作室',
  REPLACEMENT_STUDIO_CATEGORY_ALIASES = Object['freeze']([
    REPLACEMENT_STUDIO_CATEGORY,
    '替换工作室资产',
    '替换工作室入参',
  ]),
  PROTECTED_ASSET_CATEGORIES = Object['freeze']([
    ...DEFAULT_ASSET_CATEGORIES,
    '剧本资产',
    ...REPLACEMENT_STUDIO_CATEGORY_ALIASES,
  ]),
  ASSET_CATEGORY_LIMIT = MATERIAL_LIBRARY_CATEGORY_LIMIT,
  HIDDEN_ASSET_CATEGORIES = ['出图历史'],
  HIDDEN_ASSET_KINDS = ['generation-history'],
  ASSET_CATEGORY_I18N_KEYS = Object['freeze']({
    人物: 'people',
    场景: 'scenes',
    物品: 'objects',
    风格: 'styles',
    音效: 'soundEffects',
    Others: 'others',
    剧本资产: 'storyWorkspace',
    替换工作室: 'replacementStudio',
    替换工作室资产: 'replacementStudio',
    替换工作室入参: 'replacementStudio',
    出图历史: 'history',
    自定义: 'custom',
  });
function assetManagerText(value, item = {}) {
  return t('assetManager.' + value, item);
}
function _formatAssetCategoryLabel(key) {
  const index = String(key || '')['trim'](),
    result = ASSET_CATEGORY_I18N_KEYS[index];
  return result ? assetManagerText('categories.' + result) : index;
}
function _escapeHtml(data) {
  return String(data ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function _clonePlain(options, target) {
  if (options == null) return target;
  try {
    return JSON['parse'](JSON['stringify'](options));
  } catch (source) {
    return target;
  }
}
function _normalizeAssetType(next) {
  const current = String(next || '');
  if (current === 'text' || current === 'source-text' || current === 'ai-text') return 'text';
  if (current === 'audio' || current === 'source-audio' || current === 'ai-audio') return 'audio';
  if (current === 'video' || current === 'source-video' || current === 'ai-video') return 'video';
  if (current === 'image' || current === 'source-image' || current === 'ai-image') return 'image';
  return 'other';
}
function _formatAssetTypeLabel(entry) {
  const _normalizeAssetType2 = _normalizeAssetType(entry);
  return assetManagerText('types.' + _normalizeAssetType2);
}
function _resolveNodeStableThumbSrc(enabled) {
  if (!enabled) return '';
  const record =
    enabled['thumbLocalPath'] ||
    enabled['displayLocalPath'] ||
    enabled['localPath'] ||
    enabled['originalLocalPath'];
  if (record)
    return (
      localPathToUrl(record) ||
      (String(record)['startsWith']('/')
        ? String(record)
        : '/' + String(record)['replace'](/^\/+/, ''))
    );
  if (enabled['thumbUrl'] && typeof enabled['thumbUrl'] === 'string') return enabled['thumbUrl'];
  return String(enabled['src'] || enabled['imageUrl'] || '');
}
function _renderAssetIcon(payload) {
  const _normalizeAssetType3 = _normalizeAssetType(payload);
  if (_normalizeAssetType3 === 'text') return createReferenceFallbackThumbHtml('text', 'v2-asset-icon');
  if (_normalizeAssetType3 === 'audio') return createReferenceFallbackThumbHtml('audio', 'v2-asset-icon');
  if (_normalizeAssetType3 === 'video')
    return '<div class="v2-asset-icon v2-asset-icon--video" aria-hidden="true">\n      <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">\n        <polygon points="5 3 19 12 5 21 5 3" />\n      </svg>\n    </div>';
  return '<div class="v2-asset-icon v2-asset-icon--other" aria-hidden="true">\n    <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">\n      <rect x="3" y="3" width="18" height="18" rx="2" />\n    </svg>\n  </div>';
}
function _buildAssetItem(name) {
  const type = name?.['type'] || 'other',
    thumbSrc = resolveAssetNodeCoverUrl(name) || _resolveNodeStableThumbSrc(name);
  return { type: type, name: name?.['name'] || '', thumbSrc: thumbSrc || '', nodeData: name };
}
function _resolveMaterialItemThumbSrc(handle) {
  return String(
    resolveMaterialItemThumbUrl(handle) || _resolveNodeStableThumbSrc(handle?.['nodeData']) || '',
  );
}
function _resolveMaterialItemPreviewSrc(state) {
  return String(resolveMaterialItemPreviewUrl(state) || _resolveMaterialItemThumbSrc(state));
}
function _sortAssetsByUpdatedTime(config) {
  return [...(Array['isArray'](config) ? config : [])]['sort']((scope, input) => {
    const output = Number(scope?.['updatedAt'] || scope?.['createdAt'] || 0),
      value2 = Number(input?.['updatedAt'] || input?.['createdAt'] || 0);
    return value2 - output;
  });
}
function _formatAssetDateTime(value3) {
  const count2 = Number(value3);
  if (!Number['isFinite'](count2) || count2 <= 0) return assetManagerText('unknownTime');
  return new Date(count2)['toLocaleString'](getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
class AssetManager {
  constructor() {
    ((this['createPanel'] = null),
      (this['createPanelBackdrop'] = null),
      (this['_createPanelKeydownHandler'] = null),
      (this['_createPanelDropdownOutsideHandler'] = null),
      (this['_createPanelDropdownEl'] = null),
      (this['_createPanelCoverObjectUrl'] = ''),
      (this['_createPanelState'] = null),
      (this['sidebarPanel'] = null),
      (this['_openAssetId'] = null),
      (this['_thumbPreloadSet'] = new Set()),
      (this['_thumbDecodePromiseMap'] = new Map()),
      (this['_videoThumbInFlight'] = new Set()),
      (this['_videoThumbTimer'] = 0),
      (this['_sidebarRenderRaf'] = 0),
      (this['_pendingDeleteAssetId'] = ''),
      (this['_renamingAssetId'] = ''),
      (this['_renamingMaterialItemKey'] = ''),
      (this['_savingMaterialItemKey'] = ''),
      (this['_newAssetPulseId'] = ''),
      (this['_sidebarTabsLayoutRaf'] = 0),
      (this['_assetPackageUpsertByKey'] = new Map()),
      (this['_materialSearchQuery'] = ''),
      (this['_materialFavoritesOnly'] = ![]),
      (this['_expandedMaterialCategories'] = new Set()),
      (this['_expandedMaterialAssets'] = new Set()),
      (this['_pendingMaterialFolderDeleteKey'] = ''),
      (this['_deletingMaterialFolderKey'] = ''),
      (this['_renamingMaterialCategoryKey'] = ''),
      (this['_savingMaterialCategoryKey'] = ''),
      (this['_materialMenuEl'] = null),
      (this['_materialMenuState'] = null),
      (this['_materialMenuOutsideHandler'] = null),
      (this['_materialMenuKeydownHandler'] = null),
      (this['_materialAssetRowClickTimer'] = 0),
      (this['_materialAssetRowClickToggle'] = null),
      (this['_materialPreviewEl'] = null),
      (this['_materialPreviewRow'] = null),
      (this['_materialDropTarget'] = null),
      (this['_materialLoadingCount'] = 0),
      (this['activeTab'] = '人物'),
      (this['_materialCurrentFolderCategory'] = this['activeTab']),
      (this['tabs'] = [...DEFAULT_ASSET_CATEGORIES]),
      (this['userCategories'] = []),
      (this['materialCategoryDisplayNames'] = {}),
      (this['materialCategoryParents'] = {}),
      (this['_materialCategorySaveQueue'] = Promise['resolve']()),
      (this['assets'] = []),
      (this['_materialContextMenuController'] = createMaterialLibraryContextMenuController({
        getPanel: () => this['sidebarPanel'],
        getText: (value4) => assetManagerText(value4),
        closeAssetMenu: () => this['_closeMaterialMenu'](),
        openAssetMenu: (value5, value6) => this['_openMaterialMenu'](value5, value6),
        restoreAssetSubItem: (value7, value8) => this['_restoreAssetSubItem'](value7, value8),
      })),
      this['initSidebarPanel'](),
      this['loadAssetCategoriesFromServer'](),
      (this['_assetLoadPromise'] = this['loadAssetsFromServer']()));
  }
  ['_getSortedAssets']() {
    return _sortAssetsByUpdatedTime(
      (this['assets'] || [])['filter']((value9) => this['_isManagedAsset'](value9)),
    );
  }
  ['_normalizeCategoryName'](value10) {
    return String(value10 || '')['trim']();
  }
  ['_canonicalCategoryName'](value11) {
    const value12 = this['_normalizeCategoryName'](value11);
    if (
      REPLACEMENT_STUDIO_CATEGORY_ALIASES['some'](
        (value13) => value13['toLocaleLowerCase']() === value12['toLocaleLowerCase'](),
      )
    )
      return REPLACEMENT_STUDIO_CATEGORY;
    return value12;
  }
  ['_categoryKey'](value14) {
    return this['_canonicalCategoryName'](value14)['toLocaleLowerCase']();
  }
  ['_isDefaultCategory'](value15) {
    return !!this['_findCategoryByName'](value15, DEFAULT_ASSET_CATEGORIES);
  }
  ['_isProtectedCategory'](value16) {
    return !!this['_findCategoryByName'](value16, PROTECTED_ASSET_CATEGORIES);
  }
  ['_isHiddenAssetCategory'](value17) {
    return !!this['_findCategoryByName'](value17, HIDDEN_ASSET_CATEGORIES);
  }
  ['_isManagedAsset'](enabled2) {
    if (!enabled2 || typeof enabled2 !== 'object') return ![];
    if (
      HIDDEN_ASSET_KINDS['includes'](
        String(enabled2?.['kind'] || '')
          ['trim']()
          ['toLowerCase'](),
      )
    )
      return ![];
    return !this['_isHiddenAssetCategory'](enabled2?.['category']);
  }
  ['_findCategoryByName'](value18, value19 = this['tabs']) {
    const enabled3 = this['_categoryKey'](value18);
    if (!enabled3) return '';
    return (value19 || [])['find']((value20) => this['_categoryKey'](value20) === enabled3) || '';
  }
  ['_normalizeUserCategories'](list = []) {
    const list2 = [],
      value21 = (value22) => {
        const enabled4 = this['_normalizeCategoryName'](value22);
        if (!enabled4) return;
        if (this['_isProtectedCategory'](enabled4) || this['_isHiddenAssetCategory'](enabled4)) return;
        if (this['_findCategoryByName'](enabled4, list2)) return;
        if (DEFAULT_ASSET_CATEGORIES['length'] + list2['length'] >= ASSET_CATEGORY_LIMIT) return;
        list2['push'](enabled4);
      };
    return ((Array['isArray'](list) ? list : [])['forEach'](value21), list2);
  }
  ['_normalizeCategoryDisplayNames'](enabled5 = {}) {
    const value23 = {};
    if (!enabled5 || typeof enabled5 !== 'object') return value23;
    for (const [value24, value25] of Object['entries'](enabled5)) {
      const enabled6 = this['_canonicalCategoryName'](value24),
        enabled7 = this['_normalizeCategoryName'](value25);
      if (!enabled6 || !enabled7 || !this['_isProtectedCategory'](enabled6)) continue;
      if (enabled7 === _formatAssetCategoryLabel(enabled6)) continue;
      value23[enabled6] = enabled7;
    }
    return value23;
  }
  ['_normalizeMaterialCategoryParents'](
    parents = this['materialCategoryParents'],
    userCategories = this['userCategories'],
  ) {
    return normalizeMaterialFolderParents({
      parents: parents,
      userCategories: userCategories,
      allCategories: this['_getAssetCategories'](),
      categoryKey: (value26) => this['_categoryKey'](value26),
    });
  }
  ['_getMaterialParentCategory'](value27) {
    const enabled8 = this['_categoryKey'](value27);
    if (!enabled8) return '';
    return (
      Object['entries'](this['materialCategoryParents'] || {})['find'](
        ([value28]) => this['_categoryKey'](value28) === enabled8,
      )?.[1] || ''
    );
  }
  ['_createUniqueMaterialFolderName']() {
    const value29 = this['_normalizeCategoryName'](assetManagerText('newFolder'));
    if (!this['_findCategoryByName'](value29, this['_getAssetCategories']())) return value29;
    for (let value30 = 2; value30 <= ASSET_CATEGORY_LIMIT; value30 += 1) {
      const value31 = value29 + ' ' + value30;
      if (!this['_findCategoryByName'](value31, this['_getAssetCategories']())) return value31;
    }
    return '';
  }
  ['_createMaterialFolder']({ parentCategory: parentCategory2, surface: surface = 'sidebar' } = {}) {
    const value32 = this['_normalizeCategoryName'](parentCategory2),
      parentCategory3 = this['_findCategoryByName'](value32, this['_getAssetCategories']()),
      enabled9 = this['_createUniqueMaterialFolderName']();
    if ((value32 && !parentCategory3) || !enabled9)
      return (
        window['showToast']?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn'),
        ''
      );
    const category = this['_addUserCategory'](enabled9, { parentCategory: parentCategory3 });
    if (!category) return '';
    const value33 = this['_categoryKey'](parentCategory3),
      value34 = this['_categoryKey'](category);
    ((this['_materialCurrentFolderCategory'] = category),
      (this['_renamingMaterialCategoryKey'] = value34));
    if (value33) this['_expandedMaterialCategories']['add'](value33);
    if (surface === 'create-panel' && this['_createPanelState']) {
      const expandedFolderKeys = new Set(this['_createPanelState']['expandedFolderKeys'] || []);
      if (value33) expandedFolderKeys['add'](value33);
      const customCategories = [...(this['_createPanelState']['customCategories'] || [])];
      return (
        !this['_findCategoryByName'](category, customCategories) && customCategories['push'](category),
        this['_setCreatePanelState']({
          draft: { category: category },
          selectedFolderCategory: category,
          customCategories: customCategories,
          expandedFolderKeys: expandedFolderKeys,
          editingFolderCategory: category,
          editingFolderDraft: category,
          pendingFolderDeleteKey: '',
          error: '',
        }),
        this['_renderCreatePanelFolderTree']({ focusRename: !![] }),
        category
      );
    }
    return (
      this['renderSidebarContent'](),
      this['_focusMaterialCategoryRenameInput'](value34, { select: !![] }),
      category
    );
  }
  ['_formatCategoryLabel'](value35) {
    const value36 = this['_canonicalCategoryName'](value35);
    return this['materialCategoryDisplayNames']?.[value36] || _formatAssetCategoryLabel(value36);
  }
  ['_isUserCategory'](value37) {
    return !!this['_findCategoryByName'](value37, this['userCategories']);
  }
  ['_getAssetCategories'](value38 = '') {
    const list3 = [],
      handler = (value39) => {
        const enabled10 = this['_canonicalCategoryName'](value39);
        if (!enabled10) return;
        if (this['_isHiddenAssetCategory'](enabled10)) return;
        if (this['_findCategoryByName'](enabled10, list3)) return;
        if (list3['length'] >= ASSET_CATEGORY_LIMIT) return;
        list3['push'](enabled10);
      };
    DEFAULT_ASSET_CATEGORIES['forEach'](handler);
    for (const value40 of this['userCategories'] || []) {
      handler(value40);
    }
    for (const value41 of this['_getSortedAssets']()) {
      handler(value41?.['category']);
    }
    return (handler(value38), list3);
  }
  ['_syncTabsFromAssets']() {
    ((this['tabs'] = this['_getAssetCategories']()),
      setAssetMentionLibrarySettings({
        categories: this['tabs'],
        displayNames: this['materialCategoryDisplayNames'],
        parents: this['materialCategoryParents'],
      }),
      !this['_findCategoryByName'](this['activeTab'], this['tabs']) &&
        ((this['activeTab'] = DEFAULT_ASSET_CATEGORIES[0]), (this['_openAssetId'] = null)));
  }
  ['_renderSidebarTabsHtml']() {
    return (this['tabs'] || [])
      ['map']((value42) => {
        const value43 =
            this['_categoryKey'](value42) === this['_categoryKey'](this['activeTab']) ? ' active' : '',
          _escapeHtml2 = _escapeHtml(value42),
          _escapeHtml3 = _escapeHtml(this['_formatCategoryLabel'](value42)),
          value44 = this['_isUserCategory'](value42)
            ? '<button\n              type="button"\n              class="v2-asset-category-delete"\n              data-ui-action="asset-category-delete"\n              data-cat="' +
              _escapeHtml2 +
              '"\n              aria-label="' +
              _escapeHtml(
                assetManagerText('deleteCategoryAria', { category: this['_formatCategoryLabel'](value42) }),
              ) +
              '"\n            >×</button>'
            : '';
        return (
          '\n          <div class="v2-asset-sidebar-tab' +
          value43 +
          '" data-cat="' +
          _escapeHtml2 +
          '">\n            <span class="v2-asset-sidebar-tab-text">' +
          _escapeHtml3 +
          '</span>\n            ' +
          value44 +
          '\n          </div>\n        '
        );
      })
      ['join']('');
  }
  ['_renderSidebarTabs']() {
    const el = this['sidebarPanel']?.['querySelector']('#asset-sidebar-tabs');
    if (!el) {
      this['sidebarPanel']?.['classList']['contains']('show') && this['renderSidebarContent']();
      return;
    }
    ((el['innerHTML'] = this['_renderSidebarTabsHtml']()), this['_queueSidebarTabsLayoutSync']());
  }
  ['_queueSidebarTabsLayoutSync']() {
    if (!this['sidebarPanel']) return;
    (this['_sidebarTabsLayoutRaf'] && window['cancelAnimationFrame']?.(this['_sidebarTabsLayoutRaf']),
      (this['_sidebarTabsLayoutRaf'] = window['requestAnimationFrame'](() => {
        ((this['_sidebarTabsLayoutRaf'] = 0), this['_syncSidebarTabsViewport']());
      })));
  }
  ['_syncSidebarTabsViewport']() {
    const el2 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-tabs');
    if (!el2) return;
    const el3 = el2['querySelector']('.v2-asset-sidebar-tab.active');
    if (el3 && el2['clientWidth'] > 0) {
      if (this['_isDefaultCategory'](this['activeTab'])) el2['scrollLeft'] = 0;
      else {
        const value45 = el3['offsetLeft'],
          value46 = value45 + el3['offsetWidth'],
          value47 = el2['scrollLeft'],
          value48 = value47 + el2['clientWidth'];
        if (value45 < value47) el2['scrollLeft'] = value45;
        else value46 > value48 && (el2['scrollLeft'] = value46 - el2['clientWidth']);
      }
    }
    this['_updateSidebarTabsOverflowHint']();
  }
  ['_updateSidebarTabsOverflowHint']() {
    const el4 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-tabs-shell'),
      el5 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-tabs');
    if (!el4 || !el5) return;
    const count3 = Math['max'](0, el5['scrollWidth'] - el5['clientWidth']),
      enabled11 = count3 > 2,
      value49 = !enabled11 || el5['scrollLeft'] <= 2,
      value50 = !enabled11 || el5['scrollLeft'] >= count3 - 2;
    (el4['classList']['toggle']('has-overflow', enabled11),
      el4['classList']['toggle']('is-at-start', value49),
      el4['classList']['toggle']('is-at-end', value50));
    const el6 = el4['querySelector']('.v2-asset-sidebar-tabs-nav--prev'),
      el7 = el4['querySelector']('.v2-asset-sidebar-tabs-nav--next');
    if (el6) el6['hidden'] = !enabled11 || value49;
    if (el7) el7['hidden'] = !enabled11 || value50;
  }
  ['_scrollSidebarTabs'](count4 = 1) {
    const el8 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-tabs');
    if (!el8) return;
    const value51 = Math['max'](1, Math['floor'](el8['clientWidth'] * 0.75)),
      left = el8['scrollLeft'] + value51 * (count4 < 0 ? -1 : 1);
    (typeof el8['scrollTo'] === 'function'
      ? el8['scrollTo']({ left: left, behavior: 'smooth' })
      : (el8['scrollLeft'] = left),
      window['setTimeout'](() => this['_updateSidebarTabsOverflowHint'](), 220));
  }
  ['_getCreatePanelCategories']() {
    const list4 = this['_getAssetCategories'](),
      handler2 = (value52) => {
        const enabled12 = this['_normalizeCategoryName'](value52);
        if (!enabled12) return;
        if (this['_findCategoryByName'](enabled12, list4)) return;
        list4['push'](enabled12);
      };
    for (const value53 of this['_createPanelState']?.['customCategories'] || []) {
      handler2(value53);
    }
    return (handler2(this['_createPanelState']?.['draft']?.['category'] || this['activeTab']), list4);
  }
  ['_canAddCustomCategory']() {
    return this['_getCreatePanelCategories']()['length'] < ASSET_CATEGORY_LIMIT;
  }
  async ['loadAssetCategoriesFromServer']() {
    try {
      const fetchAssetCategorySettingsFromServer2 = await fetchAssetCategorySettingsFromServer();
      ((this['userCategories'] = this['_normalizeUserCategories'](fetchAssetCategorySettingsFromServer2['categories'])),
        (this['materialCategoryDisplayNames'] = this['_normalizeCategoryDisplayNames'](
          fetchAssetCategorySettingsFromServer2['displayNames'],
        )),
        (this['materialCategoryParents'] = this['_normalizeMaterialCategoryParents'](
          fetchAssetCategorySettingsFromServer2['parents'],
          this['userCategories'],
        )),
        this['_syncTabsFromAssets'](),
        this['_renderSidebarTabs'](),
        this['sidebarPanel']?.['classList']['contains']('show') && this['renderSidebarContent']());
    } catch (value54) {
      console['error']('加载素材分类失败', value54);
    }
  }
  async ['_saveUserCategories']() {
    const value55 = this['_normalizeUserCategories'](this['userCategories']);
    ((this['userCategories'] = value55),
      (this['materialCategoryParents'] = this['_normalizeMaterialCategoryParents'](
        this['materialCategoryParents'],
        value55,
      )),
      await this['_saveMaterialCategorySettings'](
        value55,
        this['materialCategoryDisplayNames'],
        this['materialCategoryParents'],
      ));
  }
  async ['_saveMaterialCategorySettings'](
    args = this['userCategories'],
    value56 = this['materialCategoryDisplayNames'],
    value57 = this['materialCategoryParents'],
  ) {
    const value58 = [...args],
      displayNames = { ...(value56 || {}) },
      parents2 = { ...(value57 || {}) },
      value59 = () =>
        saveAssetCategoriesToServer(value58, { displayNames: displayNames, parents: parents2 }),
      value60 = this['_materialCategorySaveQueue']['catch'](() => {})['then'](value59);
    ((this['_materialCategorySaveQueue'] = value60), await value60);
  }
  ['_addUserCategory'](value61, { parentCategory: parentCategory = '' } = {}) {
    const enabled13 = this['_normalizeCategoryName'](value61);
    if (!enabled13 || this['_isProtectedCategory'](enabled13) || this['_isHiddenAssetCategory'](enabled13))
      return '';
    const value62 = this['_findCategoryByName'](enabled13, this['userCategories']);
    if (value62) return value62;
    if (DEFAULT_ASSET_CATEGORIES['length'] + this['userCategories']['length'] >= ASSET_CATEGORY_LIMIT)
      return (
        window['showToast']?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn'),
        ''
      );
    this['userCategories'] = this['_normalizeUserCategories']([...this['userCategories'], enabled13]);
    const value63 = this['_findCategoryByName'](parentCategory, this['_getAssetCategories']());
    return (
      value63 &&
        this['_categoryKey'](value63) !== this['_categoryKey'](enabled13) &&
        (this['materialCategoryParents'] = this['_normalizeMaterialCategoryParents'](
          { ...this['materialCategoryParents'], [enabled13]: value63 },
          this['userCategories'],
        )),
      this['_syncTabsFromAssets'](),
      this['_renderSidebarTabs'](),
      void this['_saveUserCategories']()['catch']((value64) => {
        (console['error']('保存素材分类失败', value64),
          window['showToast']?.(assetManagerText('categorySaveFailed'), 'error'));
      }),
      enabled13
    );
  }
  ['_getMentionEligibleAssets']() {
    return this['_getSortedAssets']()['filter']((value65) =>
      this['_findCategoryByName'](value65?.['category'], this['tabs']),
    );
  }
  ['_normalizeAssetEntity'](args2) {
    if (!args2 || typeof args2 !== 'object') return null;
    const state2 = { ...args2 },
      count5 = Number(state2['createdAt'] || 0),
      count6 = Number(state2['updatedAt'] || count5 || 0);
    count5 > 0 ? (state2['createdAt'] = count5) : delete state2['createdAt'];
    if (count6 > 0) state2['updatedAt'] = count6;
    else count5 > 0 && (state2['updatedAt'] = count5);
    Array['isArray'](state2['nodes']) &&
      state2['nodes'][0] &&
      !isAssetMaterialThumbnailUrl(state2['coverUrl']) &&
      (state2['coverUrl'] =
        resolveAssetNodeCoverUrl(state2['nodes'][0]) || state2['coverUrl'] || '');
    const list5 = getMaterialAssetItems(state2);
    return (
      list5['length'] > 0 &&
        (state2['items'] = list5['map']((args3) => ({
          ...args3,
          thumbSrc: _resolveMaterialItemThumbSrc(args3),
        }))),
      state2
    );
  }
  ['_upsertLocalAsset'](value66) {
    const enabled14 = this['_normalizeAssetEntity'](value66);
    if (!enabled14?.['id']) return;
    const list6 = Array['isArray'](this['assets']) ? this['assets'] : [],
      args4 = list6['filter'](
        (value67) => String(value67?.['id'] || '') !== String(enabled14['id']),
      );
    ((this['assets'] = _sortAssetsByUpdatedTime([enabled14, ...args4])),
      this['_syncTabsFromAssets'](),
      this['_renderSidebarTabs'](),
      this['_findCategoryByName'](enabled14['category'], this['tabs'])
        ? upsertAssetMentionAsset(enabled14)
        : removeAssetMentionAsset(enabled14['id']));
  }
  ['_getSelectedAssetNodes'](value68) {
    const list7 = Array['isArray'](value68) ? value68 : [],
      state3 = appStore['getState']();
    return list7['map']((value69) => state3['nodes'][value69])['filter'](Boolean);
  }
  ['_getSelectedAssetEdges'](value70) {
    const value71 = Array['isArray'](value70) ? value70 : [],
      map = new Set(value71),
      state4 = appStore['getState']();
    return Object['values'](state4['edges'] || {})['filter'](
      (value72) => map['has'](value72?.['sourceId']) && map['has'](value72?.['targetId']),
    );
  }
  ['_buildCreatePanelCoverInfo'](value73, value74 = '') {
    const coverUrl2 = String(value74 || '')['trim'](),
      coverType2 = value73?.['type'] || 'other';
    return {
      coverUrl: coverUrl2,
      coverType: coverType2,
      aspectRatio: resolveAssetNodePreviewAspectRatio(value73),
      coverHtml: coverUrl2
        ? '<img src="' +
          _escapeHtml(coverUrl2) +
          '" alt="' +
          _escapeHtml(assetManagerText('coverAlt')) +
          '" id="asset-create-cover-img" draggable="false" />'
        : _renderAssetIcon(coverType2),
    };
  }
  async ['_resolveCreatePanelCover'](value75, value76 = {}) {
    const value77 =
      value76['preferPreview'] === !![]
        ? resolveAssetNodePreviewUrl(value75)
        : resolveAssetNodeCoverUrl(value75);
    if (value77) return { ...this['_buildCreatePanelCoverInfo'](value75, value77), objectUrl: '' };
    let value78 = '',
      objectUrl = '';
    const assetNodeCoverThumbId = resolveAssetNodeCoverThumbId(value75);
    if (assetNodeCoverThumbId)
      try {
        const image = await getImage(assetNodeCoverThumbId),
          enabled15 = String(image?.['type'] || '')
            ['trim']()
            ['toLowerCase']();
        image &&
          (!enabled15 || enabled15['startsWith']('image/')) &&
          ((objectUrl = URL['createObjectURL'](image)), (value78 = objectUrl));
      } catch (value79) {}
    return { ...this['_buildCreatePanelCoverInfo'](value75, value78), objectUrl: objectUrl };
  }
  ['_applyCreatePanelCoverAspect'](el9, value80) {
    if (!el9) return;
    const value81 = Number(value80) > 0 ? Number(value80) : 4 / 3;
    (el9['style']['setProperty']('--asset-create-cover-aspect', String(value81)),
      el9['style']['setProperty']('--asset-create-cover-width-limit', value81 * 100 + 'cqh'),
      el9['style']['setProperty']('--asset-create-cover-height-limit', 100 / value81 + 'cqw'));
  }
  ['_applyCreatePanelCoverInfo'](el10, coverType3) {
    const value82 = String(coverType3?.['objectUrl'] || '');
    if (!el10 || this['createPanel'] !== el10 || !this['_createPanelState']) {
      if (value82['startsWith']('blob:')) URL['revokeObjectURL'](value82);
      return ![];
    }
    this['_createPanelCoverObjectUrl'] &&
      this['_createPanelCoverObjectUrl'] !== value82 &&
      this['_createPanelCoverObjectUrl']['startsWith']('blob:') &&
      URL['revokeObjectURL'](this['_createPanelCoverObjectUrl']);
    this['_createPanelCoverObjectUrl'] = value82;
    const coverInfo = {
      coverUrl: String(coverType3?.['coverUrl'] || ''),
      coverType: coverType3?.['coverType'] || 'other',
      aspectRatio:
        Number(coverType3?.['aspectRatio']) > 0
          ? Number(coverType3['aspectRatio'])
          : Number(this['_createPanelState']?.['coverInfo']?.['aspectRatio']) || 4 / 3,
      coverHtml: coverType3?.['coverHtml'] || _renderAssetIcon(coverType3?.['coverType'] || 'other'),
    };
    this['_setCreatePanelState']({ coverInfo: coverInfo });
    const el11 = el10['querySelector']('.v2-asset-create-cover');
    return (
      el11 &&
        ((el11['innerHTML'] = coverInfo['coverHtml']),
        this['_applyCreatePanelCoverAspect'](el11, coverInfo['aspectRatio'])),
      !![]
    );
  }
  ['_buildAssetPayloadFromSelection'](value83, error = {}) {
    const items = this['_getSelectedAssetNodes'](value83),
      value84 = items[0] || null,
      value85 = Date['now'](),
      name2 = String(error['name'] || '')['trim']() || assetManagerText('unnamedAsset'),
      category2 = String(error['category'] || '')['trim']() || this['activeTab'],
      coverType4 = value84?.['type'] || 'other',
      coverUrl3 = resolveAssetNodeCoverUrl(value84),
      id = String(error['id'] || '')['trim'](),
      createdAt = Number(error['createdAt'] || value85) || value85,
      updatedAt = Number(error['updatedAt'] || value85) || value85;
    return {
      id: id || generateId('asset'),
      name: name2,
      category: category2,
      coverUrl: coverUrl3,
      coverType: coverType4,
      items: items['map']((value86) => _buildAssetItem(value86)),
      nodes: items,
      edges: this['_getSelectedAssetEdges'](value83),
      createdAt: createdAt,
      updatedAt: updatedAt,
    };
  }
  ['_buildAssetAppendPayload'](id2, value87, error2 = {}) {
    const list8 = this['_getSelectedAssetNodes'](value87),
      list9 = this['_getSelectedAssetEdges'](value87),
      value88 = Date['now'](),
      value89 = {},
      list10 = list8['map']((args5) => {
        const _clonePlain2 = _clonePlain(args5, { ...args5 }),
          value90 = String(_clonePlain2['id'] || ''),
          generateId2 = generateId(_clonePlain2['type']);
        if (value90) value89[value90] = generateId2;
        return ((_clonePlain2['id'] = generateId2), _clonePlain2);
      }),
      args6 = list9['map']((args7) => {
        const _clonePlain3 = _clonePlain(args7, { ...args7 });
        _clonePlain3['id'] = generateId('edge');
        if (value89[_clonePlain3['sourceId']]) _clonePlain3['sourceId'] = value89[_clonePlain3['sourceId']];
        if (value89[_clonePlain3['targetId']]) _clonePlain3['targetId'] = value89[_clonePlain3['targetId']];
        return _clonePlain3;
      }),
      list11 = Array['isArray'](id2?.['nodes']) ? _clonePlain(id2['nodes'], []) : [],
      args8 = Array['isArray'](id2?.['items'])
        ? _clonePlain(id2['items'], [])
        : list11['map']((value91) => _buildAssetItem(value91)),
      args9 = Array['isArray'](id2?.['edges']) ? _clonePlain(id2['edges'], []) : [],
      value92 = list10[0] || null,
      value93 = value92 ? resolveAssetNodeCoverUrl(value92) : '',
      coverUrl4 = id2?.['coverUrl'] || value93,
      coverType5 = id2?.['coverType'] || value92?.['type'] || 'other';
    return {
      ...(id2 || {}),
      id: id2?.['id'],
      name: String(error2['name'] || '')['trim']() || assetManagerText('unnamedAsset'),
      category: String(error2['category'] || '')['trim']() || this['activeTab'],
      coverUrl: coverUrl4,
      coverType: coverType5,
      items: [...args8, ...list10['map']((value94) => _buildAssetItem(value94))],
      nodes: [...list11, ...list10],
      edges: [...args9, ...args6],
      createdAt: Number(id2?.['createdAt'] || id2?.['updatedAt'] || value88) || value88,
      updatedAt: Number(error2['updatedAt'] || value88) || value88,
    };
  }
  ['_createDefaultPanelState'](args10, coverInfo2, presentation = {}) {
    const name3 = String(presentation['defaultName'] || '')['trim']();
    return {
      selectedIds: [...args10],
      presentation: presentation['presentation'] === 'library-save' ? 'library-save' : 'default',
      mode: 'create',
      selectedAssetId: '',
      updateSearchKeyword: '',
      updateConfirmOpen: ![],
      expandedFolderKeys: new Set(),
      selectedFolderCategory: '',
      editingFolderCategory: '',
      editingFolderDraft: '',
      folderActionBusyKey: '',
      pendingFolderDeleteKey: '',
      deletingFolderKey: '',
      customCategoryEditing: ![],
      customCategoryDraft: '',
      customCategories: [],
      error: '',
      saving: ![],
      savingAction: '',
      draft: { name: name3 || assetManagerText('newAsset'), category: this['activeTab'] },
      coverInfo: coverInfo2 || {
        coverUrl: '',
        coverType: 'other',
        aspectRatio: 4 / 3,
        coverHtml: _renderAssetIcon('other'),
      },
    };
  }
  ['_setCreatePanelState'](args11 = {}) {
    if (!this['_createPanelState']) return;
    const args12 = this['_createPanelState'],
      draft = args11['draft']
        ? { ...(args12['draft'] || {}), ...args11['draft'] }
        : args12['draft'];
    this['_createPanelState'] = { ...args12, ...args11, draft: draft };
  }
  ['_getUpdateListCategory']() {
    const value95 = this['_normalizeCategoryName'](this['_createPanelState']?.['draft']?.['category']);
    if (this['_createPanelState']?.['mode'] === 'update' && value95) return value95;
    return this['_findCategoryByName'](this['activeTab'], this['tabs']) || this['activeTab'];
  }
  ['_getFilteredUpdateAssets'](value96 = '') {
    const enabled16 = String(value96 || '')
        ['trim']()
        ['toLowerCase'](),
      value97 = this['_categoryKey'](this['_getUpdateListCategory']()),
      list12 = this['_getSortedAssets']()['filter'](
        (value98) => this['_categoryKey'](value98?.['category']) === value97,
      );
    if (!enabled16) return list12;
    return list12['filter']((error3) =>
      String(error3?.['name'] || '')
        ['toLowerCase']()
        ['includes'](enabled16),
    );
  }
  ['_syncCreatePanelDraftFromTarget'](error4) {
    this['_setCreatePanelState']({
      draft: {
        name: String(error4?.['name'] || '')['trim']() || assetManagerText('unnamedAsset'),
        category: String(error4?.['category'] || '')['trim']() || this['activeTab'],
      },
      selectedAssetId: String(error4?.['id'] || ''),
      updateConfirmOpen: ![],
      customCategoryEditing: ![],
      customCategoryDraft: '',
      error: '',
    });
  }
  ['_syncUpdateSelectionForCategory'](value99) {
    if (this['_createPanelState']?.['mode'] !== 'update') return;
    const category3 = this['_normalizeCategoryName'](value99) || this['activeTab'];
    this['_setCreatePanelState']({
      draft: { category: category3 },
      selectedAssetId: '',
      updateSearchKeyword: '',
      updateConfirmOpen: ![],
      error: '',
    });
    const error5 = this['_getFilteredUpdateAssets']()[0] || null;
    if (!error5) return;
    this['_setCreatePanelState']({
      draft: {
        name: String(error5?.['name'] || '')['trim']() || assetManagerText('unnamedAsset'),
        category: String(error5?.['category'] || '')['trim']() || category3,
      },
      selectedAssetId: String(error5?.['id'] || ''),
    });
  }
  ['_getCreatePanelFolderEntries']() {
    const list13 = this['_getSortedAssets'](),
      groups = this['_getCreatePanelCategories']()['map']((category4) => {
        const assets = list13['filter'](
          (value100) => this['_categoryKey'](value100?.['category']) === this['_categoryKey'](category4),
        );
        return { category: category4, assets: assets };
      }),
      count7 = getMaterialFolderAssetCounts({
        groups: groups,
        parents: this['materialCategoryParents'],
        categoryKey: (value101) => this['_categoryKey'](value101),
      });
    return groups['map']((args13) => ({
      ...args13,
      count: count7['get'](this['_categoryKey'](args13['category'])) ?? args13['assets']['length'],
    }));
  }
  ['_renderCreatePanelFolderAssetHtml'](error6) {
    const materialAssetItems = getMaterialAssetItems(error6),
      value102 = materialAssetItems[0] || null,
      _resolveMaterialItemThumbSrc2 = _resolveMaterialItemThumbSrc(value102) || String(error6?.['coverUrl'] || ''),
      value103 = value102?.['type'] || error6?.['coverType'] || 'other',
      value104 =
        _resolveMaterialItemThumbSrc2 && !this['_isNonImageMediaSrc'](_resolveMaterialItemThumbSrc2)
          ? '<img src="' +
            _escapeHtml(_resolveMaterialItemThumbSrc2) +
            '" alt="" loading="lazy" decoding="async" draggable="false" />'
          : _renderAssetIcon(value103);
    return (
      '\n      <div class="v2-material-asset-row" role="treeitem">\n        <button type="button" class="v2-material-asset-toggle" disabled aria-hidden="true" tabindex="-1"></button>\n        <div class="v2-material-asset-use">\n          <span class="v2-material-row-thumb" aria-hidden="true">' +
      value104 +
      '</span>\n          <span class="v2-material-asset-name">' +
      _escapeHtml(error6?.['name'] || assetManagerText('unnamedAsset')) +
      '</span>\n        </div>\n      </div>\n    '
    );
  }
  ['_createMaterialFolderSection']({
    category: category5,
    count: count = 0,
    expanded: expanded = ![],
    canManageFolder: canManageFolder = ![],
    isRenamingFolder: isRenamingFolder = ![],
    isSavingFolder: isSavingFolder = ![],
    isDeleteConfirming: isDeleteConfirming = ![],
    isDeletingFolder: isDeletingFolder = ![],
    isDeleteRequested: isDeleteRequested = ![],
    actionPrefix: actionPrefix = 'material-folder',
    renameValue: renameValue = '',
  } = {}) {
    const value105 = this['_normalizeCategoryName'](category5),
      value106 = this['_categoryKey'](value105),
      name4 = this['_formatCategoryLabel'](value105),
      handler3 = (value107) => actionPrefix + '-' + value107,
      section = document['createElement']('section');
    ((section['className'] = 'v2-material-folder'),
      (section['dataset']['category'] = value105),
      section['setAttribute']('role', 'treeitem'),
      section['setAttribute']('aria-expanded', expanded ? 'true' : 'false'),
      section['classList']['toggle']('is-delete-shaking', canManageFolder && isDeleteRequested));
    const folderRow = document['createElement']('div');
    ((folderRow['className'] = 'v2-material-folder-row'),
      folderRow['classList']['toggle']('has-delete-actions', canManageFolder),
      folderRow['classList']['toggle']('is-renaming', isRenamingFolder),
      folderRow['classList']['toggle']('is-saving', isSavingFolder));
    const folderToggle = document['createElement']('button');
    ((folderToggle['type'] = 'button'),
      (folderToggle['className'] = 'v2-material-folder-toggle'),
      (folderToggle['dataset']['uiAction'] = handler3('toggle')),
      (folderToggle['dataset']['category'] = value105),
      folderToggle['setAttribute']('aria-expanded', expanded ? 'true' : 'false'),
      folderToggle['setAttribute'](
        'aria-label',
        assetManagerText(expanded ? 'collapseFolder' : 'expandFolder', { name: name4 }),
      ),
      (folderToggle['disabled'] = isRenamingFolder || isDeletingFolder),
      (folderToggle['innerHTML'] =
        '\n      <span class="v2-material-tree-chevron' +
        (expanded ? ' is-open' : '') +
        '" aria-hidden="true">\n        ' +
        MATERIAL_TREE_CHEVRON_ICON_SVG +
        '\n      </span>\n      <span class="v2-material-folder-icon" aria-hidden="true">\n        ' +
        MATERIAL_FOLDER_ICON_MARKUP +
        '\n      </span>\n    '),
      folderRow['appendChild'](folderToggle));
    if (isRenamingFolder) {
      const el12 = document['createElement']('input');
      ((el12['type'] = 'text'),
        (el12['className'] = 'v2-material-folder-name-input'),
        (el12['dataset']['category'] = value105),
        (el12['dataset']['categoryKey'] = value106),
        (el12['value'] = String(renameValue || name4)),
        (el12['maxLength'] = 32),
        (el12['disabled'] = isSavingFolder),
        el12['setAttribute'](
          'aria-label',
          assetManagerText('renameCategoryAria', { category: name4 }),
        ));
      if (isSavingFolder) el12['setAttribute']('aria-busy', 'true');
      folderRow['appendChild'](el12);
    } else {
      if (canManageFolder) {
        const el13 = document['createElement']('button');
        ((el13['type'] = 'button'),
          (el13['className'] = 'v2-material-folder-name is-renameable'),
          (el13['dataset']['uiAction'] = handler3('rename')),
          (el13['dataset']['category'] = value105),
          el13['setAttribute'](
            'aria-label',
            assetManagerText('renameCategoryAria', { category: name4 }),
          ),
          (el13['textContent'] = name4),
          folderRow['appendChild'](el13));
      } else {
        const el14 = document['createElement']('span');
        ((el14['className'] = 'v2-material-folder-name'),
          (el14['textContent'] = name4),
          folderRow['appendChild'](el14));
      }
    }
    if (canManageFolder) {
      const el15 = document['createElement']('div');
      ((el15['className'] = 'v2-material-folder-delete-actions'),
        el15['classList']['toggle']('is-confirming', isDeleteConfirming),
        el15['classList']['toggle']('is-busy', isDeletingFolder),
        el15['setAttribute']('aria-busy', isDeletingFolder ? 'true' : 'false'));
      if (isDeletingFolder) {
        const el16 = document['createElement']('span');
        ((el16['className'] = 'v2-material-folder-delete-pending'),
          el16['setAttribute']('role', 'status'),
          el16['setAttribute']('aria-live', 'polite'),
          el16['setAttribute']('aria-label', assetManagerText('menu.processing')),
          (el16['innerHTML'] = '<span aria-hidden="true"></span>'),
          el15['appendChild'](el16));
      } else {
        if (isDeleteConfirming) {
          const el17 = document['createElement']('button');
          ((el17['type'] = 'button'),
            (el17['className'] = 'v2-material-folder-delete-choice is-confirm'),
            (el17['dataset']['uiAction'] = handler3('delete-confirm')),
            (el17['dataset']['category'] = value105),
            (el17['textContent'] = assetManagerText('confirm')),
            el17['setAttribute']('aria-label', assetManagerText('confirm') + ' ' + name4));
          const el18 = document['createElement']('button');
          ((el18['type'] = 'button'),
            (el18['className'] = 'v2-material-folder-delete-choice is-cancel'),
            (el18['dataset']['uiAction'] = handler3('delete-cancel')),
            (el18['dataset']['category'] = value105),
            (el18['textContent'] = assetManagerText('cancel')),
            el18['setAttribute']('aria-label', assetManagerText('cancel') + ' ' + name4),
            el15['append'](el17, el18));
        } else {
          const el19 = document['createElement']('button');
          ((el19['type'] = 'button'),
            (el19['className'] = 'v2-material-folder-delete-trigger'),
            (el19['dataset']['uiAction'] = handler3('delete-request')),
            (el19['dataset']['category'] = value105),
            el19['setAttribute'](
              'aria-label',
              assetManagerText('deleteCategoryAria', { category: name4 }),
            ),
            (el19['innerHTML'] =
              '\n          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">\n            <path d="M4 7h16M9 3h6l1 4H8l1-4Zm-2 4 1 14h8l1-14M10 11v6m4-6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>\n          </svg>\n        '),
            el15['appendChild'](el19));
        }
      }
      folderRow['appendChild'](el15);
    }
    const el20 = document['createElement']('span');
    ((el20['className'] = 'v2-material-folder-count'),
      (el20['textContent'] = String(count)),
      folderRow['appendChild'](el20),
      section['appendChild'](folderRow));
    const folderContent = document['createElement']('div');
    return (
      (folderContent['className'] = 'v2-material-folder-content'),
      folderContent['setAttribute']('role', 'group'),
      (folderContent['hidden'] = !expanded),
      section['appendChild'](folderContent),
      { section: section, folderRow: folderRow, folderContent: folderContent, folderToggle: folderToggle }
    );
  }
  ['_nestMaterialFolderSections'](el21) {
    if (!el21) return;
    const list14 = Array['from'](el21['querySelectorAll'](':scope > .v2-material-folder')),
      map2 = new Map(
        list14['map']((el22) => [this['_categoryKey'](el22['dataset']['category']), el22]),
      );
    for (const el23 of list14) {
      const value108 = el23['dataset']['category'],
        value109 = this['_getMaterialParentCategory'](value108),
        el24 = map2['get'](this['_categoryKey'](value109));
      if (!el24 || el24 === el23) continue;
      const el25 = el24['querySelector'](':scope > .v2-material-folder-content');
      if (!el25) continue;
      (el25['querySelector'](':scope > .v2-material-folder-empty')?.['remove'](),
        el23['classList']['add']('is-nested'));
      const value110 = Array['from'](el25['children'])['find'](
        (el26) => !el26['classList']['contains']('v2-material-folder'),
      );
      el25['insertBefore'](el23, value110 || null);
    }
  }
  ['_renderCreatePanelFolderTree'](options2 = {}) {
    const el27 = this['createPanel']?.['querySelector']('[data-asset-create-folder-tree]'),
      renameValue2 = this['_createPanelState'];
    if (!el27 || !renameValue2) return;
    const value111 = el27['scrollTop'],
      value112 = this['_normalizeCategoryName'](renameValue2['selectedFolderCategory']),
      value113 = this['_categoryKey'](value112),
      map3 =
        renameValue2['expandedFolderKeys'] instanceof Set ? renameValue2['expandedFolderKeys'] : new Set(),
      value114 = this['_categoryKey'](renameValue2['editingFolderCategory']),
      value115 = String(renameValue2['folderActionBusyKey'] || ''),
      isDeleteRequested2 = String(renameValue2['pendingFolderDeleteKey'] || ''),
      value116 = String(renameValue2['deletingFolderKey'] || ''),
      el28 = document['createDocumentFragment']();
    (this['_getCreatePanelFolderEntries']()['forEach'](
      ({ category: category6, count: count8, assets: assets2 }) => {
        const value117 = this['_categoryKey'](category6),
          canManageFolder2 = this['_isUserCategory'](category6),
          expanded2 = map3['has'](value117),
          isRenamingFolder2 = canManageFolder2 && value114 === value117,
          isDeletingFolder2 = canManageFolder2 && value116 === value117,
          { section: section2, folderContent: folderContent2 } = this['_createMaterialFolderSection']({
            category: category6,
            count: count8,
            expanded: expanded2,
            canManageFolder: canManageFolder2,
            isRenamingFolder: isRenamingFolder2,
            isSavingFolder: isRenamingFolder2 && value115 === value117,
            isDeleteConfirming: canManageFolder2 && (isDeleteRequested2 === value117 || isDeletingFolder2),
            isDeletingFolder: isDeletingFolder2,
            isDeleteRequested: isDeleteRequested2 === value117,
            actionPrefix: 'asset-create-folder',
            renameValue: renameValue2['editingFolderDraft'],
          });
        ((section2['dataset']['assetCreateFolder'] = ''),
          section2['setAttribute']('aria-selected', value117 === value113 ? 'true' : 'false'),
          (folderContent2['innerHTML'] = assets2['length']
            ? assets2['map']((value118) => this['_renderCreatePanelFolderAssetHtml'](value118))['join'](
                '',
              )
            : '<div class="v2-material-folder-empty">' +
              _escapeHtml(assetManagerText('emptyFolder')) +
              '</div>'),
          el28['appendChild'](section2));
      },
    ),
      el27['replaceChildren'](el28),
      this['_nestMaterialFolderSections'](el27),
      (el27['scrollTop'] = value111),
      this['_syncCreatePanelError'](),
      options2['focusRename'] === !![] &&
        window['requestAnimationFrame'](() => {
          const el29 = el27['querySelector']('.v2-material-folder-name-input');
          (el29?.['focus'](), el29?.['select']?.());
        }));
  }
  ['_syncCreatePanelError']() {
    const el30 = this['createPanel']?.['querySelector']('.v2-asset-create-error');
    if (!el30) return;
    const enabled17 = String(this['_createPanelState']?.['error'] || '');
    ((el30['textContent'] = enabled17), (el30['hidden'] = !enabled17));
  }
  ['_renderLibrarySavePanelContent']() {
    const el31 = this['createPanel'],
      enabled18 = this['_createPanelState'];
    if (!el31 || !enabled18) return;
    const count9 = Array['isArray'](enabled18['selectedIds']) ? enabled18['selectedIds']['length'] : 0,
      value119 = enabled18['coverInfo'] || {},
      value120 = value119['coverHtml'] || _renderAssetIcon(value119['coverType'] || 'other'),
      value121 = Number(value119['aspectRatio']) > 0 ? Number(value119['aspectRatio']) : 4 / 3,
      value122 = enabled18['saving']
        ? assetManagerText('createPanel.saving')
        : assetManagerText('createPanel.save');
    ((el31['innerHTML'] =
      '\n      <div class="v2-asset-create-header v2-asset-create-header--library-save">\n        <div class="v2-asset-create-title">\n          <span class="v2-asset-create-header-text">' +
      assetManagerText('createPanel.saveTitle') +
      '</span>\n        </div>\n        <button\n          type="button"\n          class="v2-asset-create-new-folder"\n          data-ui-action="asset-create-new-folder"\n        >\n          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">\n            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>\n          </svg>\n          <span>' +
      assetManagerText('newFolder') +
      '</span>\n        </button>\n      </div>\n      <div class="v2-asset-create-modal-body v2-asset-create-modal-body--library-save">\n        <div class="v2-asset-create-library-layout">\n          <section class="v2-asset-create-source-panel">\n            <div class="v2-asset-create-source-header">\n              <div class="v2-asset-create-source-title">' +
      assetManagerText('createPanel.currentSelection') +
      '</div>\n              <div class="v2-asset-create-source-scope">' +
      assetManagerText('createPanel.selectedNodes', { count: count9 }) +
      '</div>\n            </div>\n            <div class="v2-asset-create-preview-stage">\n              <div class="v2-asset-create-cover">\n                ' +
      value120 +
      '\n              </div>\n            </div>\n            <label class="v2-asset-create-field" for="asset-create-name">\n              <span class="v2-asset-create-label">' +
      assetManagerText('createPanel.assetName') +
      '</span>\n              <input\n                type="text"\n                id="asset-create-name"\n                placeholder="' +
      _escapeHtml(assetManagerText('createPanel.assetNamePlaceholder')) +
      '"\n                value="' +
      _escapeHtml(enabled18['draft']?.['name'] || '') +
      '"\n                autocomplete="off"\n              />\n            </label>\n            <div class="v2-asset-create-error" role="alert"' +
      (enabled18['error'] ? '' : ' hidden') +
      '>' +
      _escapeHtml(enabled18['error'] || '') +
      '</div>\n          </section>\n          <section class="v2-asset-create-library-pane">\n            <div\n              class="v2-asset-create-folder-list v2-material-library-tree"\n              data-asset-create-folder-tree\n              role="tree"\n              aria-label="' +
      _escapeHtml(assetManagerText('createPanel.folderListAria')) +
      '"\n            >\n            </div>\n          </section>\n        </div>\n      </div>\n      <div class="v2-asset-create-footer v2-asset-create-footer--library-save">\n        <button\n          type="button"\n          class="v2-asset-create-btn v2-asset-create-btn--secondary"\n          data-ui-action="asset-create-cancel"\n          ' +
      (enabled18['saving'] ? 'disabled' : '') +
      '\n        >' +
      assetManagerText('cancel') +
      '</button>\n        <button\n          type="button"\n          class="v2-asset-create-btn"\n          id="asset-create-submit"\n          aria-busy="' +
      (enabled18['saving'] ? 'true' : 'false') +
      '"\n          ' +
      (enabled18['saving'] ? 'disabled' : '') +
      '\n        >\n          <span class="v2-asset-create-submit-spinner" aria-hidden="true"' +
      (enabled18['saving'] ? '' : ' hidden') +
      '></span>\n          <span>' +
      value122 +
      '</span>\n        </button>\n      </div>\n    '),
      this['_applyCreatePanelCoverAspect'](el31['querySelector']('.v2-asset-create-cover'), value121),
      this['_renderCreatePanelFolderTree'](),
      this['_bindLibrarySavePanelEvents']());
  }
  ['_bindLibrarySavePanelEvents']() {
    const el32 = this['createPanel'],
      enabled19 = this['_createPanelState'];
    if (!el32 || !enabled19) return;
    (el32['querySelector']('[data-ui-action=\'asset-create-cancel\']')?.['addEventListener'](
      'click',
      () => this['closeCreatePanel'](),
    ),
      el32['querySelector']('[data-ui-action=\'asset-create-new-folder\']')?.['addEventListener'](
        'click',
        () => {
          this['_createMaterialFolder']({
            parentCategory: this['_createPanelState']?.['selectedFolderCategory'] || '',
            surface: 'create-panel',
          });
        },
      ));
    const el33 = el32['querySelector']('[data-asset-create-folder-tree]');
    (el33?.['addEventListener']('click', (event) => {
      const el34 = event['target']['closest']('[data-ui-action]'),
        value123 = String(el34?.['dataset']?.['uiAction'] || ''),
        value124 = this['_normalizeCategoryName'](el34?.['dataset']?.['category']);
      if (value123 === 'asset-create-folder-rename' && value124) {
        this['_beginCreatePanelFolderRename'](value124);
        return;
      }
      if (value123 === 'asset-create-folder-delete-request' && value124) {
        if (!this['_isUserCategory'](value124)) return;
        (this['_setCreatePanelState']({ pendingFolderDeleteKey: this['_categoryKey'](value124), error: '' }),
          this['_renderCreatePanelFolderTree']());
        return;
      }
      if (value123 === 'asset-create-folder-delete-cancel') {
        (this['_setCreatePanelState']({ pendingFolderDeleteKey: '' }),
          this['_renderCreatePanelFolderTree']());
        return;
      }
      if (value123 === 'asset-create-folder-delete-confirm' && value124) {
        void this['_deleteCreatePanelFolder'](value124);
        return;
      }
      if (value123 === 'asset-create-folder-toggle' && value124) {
        this['_toggleCreatePanelFolderDisclosure'](value124);
        return;
      }
      if (
        value123 ||
        event['target']['closest'](
          "input, button, [contenteditable='true'], .v2-material-folder-delete-actions",
        )
      )
        return;
      const el35 = event['target']['closest']('.v2-material-folder-row'),
        el36 = el35?.['querySelector']("[data-ui-action='asset-create-folder-toggle']");
      if (el36 && !el36['disabled'] && event['detail'] <= 1) {
        this['_toggleCreatePanelFolderDisclosure'](el36['dataset']['category']);
        return;
      }
      event['target'] === el33 &&
        this['_createPanelState']?.['selectedFolderCategory'] &&
        (this['_setCreatePanelState']({ selectedFolderCategory: '' }),
        this['_renderCreatePanelFolderTree']());
    }),
      el33?.['addEventListener']('input', (event2) => {
        const editingFolderDraft = event2['target']['closest']('.v2-material-folder-name-input');
        if (!editingFolderDraft) return;
        (this['_setCreatePanelState']({ editingFolderDraft: editingFolderDraft['value'] || '', error: '' }),
          this['_syncCreatePanelError']());
      }),
      el33?.['addEventListener']('keydown', (event3) => {
        const el37 = event3['target']['closest']('.v2-material-folder-name-input');
        if (!el37) return;
        if (event3['key'] === 'Enter' && !event3['isComposing']) {
          (event3['preventDefault'](),
            event3['stopPropagation'](),
            (el37['dataset']['submitted'] = '1'),
            void this['_commitCreatePanelFolderRename'](
              el37['dataset']['category'],
              el37['value'],
            ));
          return;
        }
        event3['key'] === 'Escape' &&
          (event3['preventDefault'](),
          event3['stopPropagation'](),
          (el37['dataset']['submitted'] = '1'),
          (this['_renamingMaterialCategoryKey'] = ''),
          this['_setCreatePanelState']({
            editingFolderCategory: '',
            editingFolderDraft: '',
            folderActionBusyKey: '',
            error: '',
          }),
          this['_renderCreatePanelFolderTree']());
      }),
      el33?.['addEventListener']('focusout', (event4) => {
        const el38 = event4['target']['closest']('.v2-material-folder-name-input');
        if (!el38 || el38['dataset']['submitted'] === '1') return;
        ((el38['dataset']['submitted'] = '1'),
          void this['_commitCreatePanelFolderRename'](el38['dataset']['category'], el38['value']));
      }));
    const el39 = el32['querySelector']('#asset-create-name');
    (el39?.['addEventListener']('input', (name5) => {
      this['_setCreatePanelState']({
        draft: { name: name5['currentTarget']?.['value'] || '' },
        error: '',
      });
    }),
      el39?.['addEventListener']('keydown', (event5) => {
        if (event5['key'] !== 'Enter' || event5['isComposing']) return;
        (event5['preventDefault'](), void this['_submitCreatePanel']());
      }),
      el32['querySelector']('#asset-create-submit')?.['addEventListener']('click', () => {
        void this['_submitCreatePanel']();
      }));
  }
  ['_toggleCreatePanelFolderDisclosure'](value125) {
    const category7 = this['_findCategoryByName'](value125, this['tabs']),
      enabled20 = this['_categoryKey'](category7);
    if (!category7 || !enabled20) return;
    this['_materialCurrentFolderCategory'] = category7;
    const expandedFolderKeys2 = new Set(this['_createPanelState']?.['expandedFolderKeys'] || []);
    (expandedFolderKeys2['has'](enabled20) ? expandedFolderKeys2['delete'](enabled20) : expandedFolderKeys2['add'](enabled20),
      this['_setCreatePanelState']({
        draft: { category: category7 },
        selectedFolderCategory: category7,
        expandedFolderKeys: expandedFolderKeys2,
        error: '',
      }),
      this['_renderCreatePanelFolderTree']());
  }
  ['_beginCreatePanelFolderRename'](value126) {
    const editingFolderCategory = this['_findCategoryByName'](value126, this['tabs']),
      enabled21 = this['_categoryKey'](editingFolderCategory);
    if (
      !editingFolderCategory ||
      !enabled21 ||
      !this['_isUserCategory'](editingFolderCategory) ||
      this['_createPanelState']?.['folderActionBusyKey']
    )
      return;
    ((this['_materialCurrentFolderCategory'] = editingFolderCategory),
      (this['_renamingMaterialCategoryKey'] = enabled21),
      this['_setCreatePanelState']({
        editingFolderCategory: editingFolderCategory,
        editingFolderDraft: this['_formatCategoryLabel'](editingFolderCategory),
        pendingFolderDeleteKey: '',
        error: '',
      }),
      this['_renderCreatePanelFolderTree']({ focusRename: !![] }));
  }
  async ['_deleteCreatePanelFolder'](value127) {
    const enabled22 = this['_findCategoryByName'](value127, this['tabs']),
      deletingFolderKey = this['_categoryKey'](enabled22);
    if (
      !enabled22 ||
      !deletingFolderKey ||
      !this['_isUserCategory'](enabled22) ||
      this['_createPanelState']?.['pendingFolderDeleteKey'] !== deletingFolderKey ||
      this['_createPanelState']?.['deletingFolderKey']
    )
      return ![];
    const draft2 = this['_categoryKey'](this['_createPanelState']['draft']?.['category']) === deletingFolderKey,
      selectedFolderCategory = this['_categoryKey'](this['_createPanelState']['selectedFolderCategory']) === deletingFolderKey;
    (this['_setCreatePanelState']({
      pendingFolderDeleteKey: '',
      deletingFolderKey: deletingFolderKey,
      folderActionBusyKey: deletingFolderKey,
      error: '',
    }),
      this['_renderCreatePanelFolderTree']());
    const enabled23 = await this['_deleteUserCategory'](enabled22);
    if (!this['createPanel'] || !this['_createPanelState']) return enabled23;
    if (!enabled23)
      return (
        this['_setCreatePanelState']({ deletingFolderKey: '', folderActionBusyKey: '' }),
        this['_renderCreatePanelFolderTree'](),
        ![]
      );
    const category8 =
        this['_findCategoryByName']('Others', this['tabs']) ||
        this['tabs'][0] ||
        DEFAULT_ASSET_CATEGORIES[0],
      expandedFolderKeys3 = new Set(this['_createPanelState']['expandedFolderKeys'] || []);
    expandedFolderKeys3['delete'](deletingFolderKey);
    const customCategories2 = (this['_createPanelState']['customCategories'] || [])['filter'](
      (value128) => this['_categoryKey'](value128) !== deletingFolderKey,
    );
    return (
      this['_setCreatePanelState']({
        draft: draft2 ? { category: category8 } : undefined,
        selectedFolderCategory: selectedFolderCategory ? '' : this['_createPanelState']['selectedFolderCategory'],
        customCategories: customCategories2,
        expandedFolderKeys: expandedFolderKeys3,
        editingFolderCategory: '',
        editingFolderDraft: '',
        pendingFolderDeleteKey: '',
        deletingFolderKey: '',
        folderActionBusyKey: '',
        error: '',
      }),
      this['_renderCreatePanelFolderTree'](),
      !![]
    );
  }
  async ['_commitCreatePanelFolderRename'](value129, value130) {
    const enabled24 = this['_findCategoryByName'](value129, this['tabs']),
      folderActionBusyKey = this['_categoryKey'](enabled24);
    if (
      !enabled24 ||
      !folderActionBusyKey ||
      !this['_isUserCategory'](enabled24) ||
      !this['createPanel'] ||
      this['_createPanelState']?.['folderActionBusyKey']
    )
      return ![];
    const value131 = this['_isUserCategory'](enabled24),
      draft3 = this['_categoryKey'](this['_createPanelState']?.['draft']?.['category']) === folderActionBusyKey,
      selectedFolderCategory2 = this['_categoryKey'](this['_createPanelState']?.['selectedFolderCategory']) === folderActionBusyKey,
      expandedFolderKeys4 = new Set(this['_createPanelState']?.['expandedFolderKeys'] || []);
    ((this['_renamingMaterialCategoryKey'] = folderActionBusyKey),
      this['_setCreatePanelState']({
        editingFolderDraft: String(value130 || ''),
        folderActionBusyKey: folderActionBusyKey,
        error: '',
      }),
      this['_renderCreatePanelFolderTree']());
    const enabled25 = await this['_commitRenameMaterialCategory'](enabled24, value130);
    if (!this['createPanel'] || !this['_createPanelState']) return enabled25;
    if (!enabled25)
      return (
        this['_renamingMaterialCategoryKey'] === folderActionBusyKey && (this['_renamingMaterialCategoryKey'] = ''),
        this['_setCreatePanelState']({
          folderActionBusyKey: '',
          error: assetManagerText('categoryRenameFailed'),
        }),
        this['_renderCreatePanelFolderTree']({ focusRename: !![] }),
        ![]
      );
    const category9 = value131
        ? this['_findCategoryByName'](value130, this['tabs']) || this['_normalizeCategoryName'](value130)
        : enabled24,
      value132 = this['_categoryKey'](category9);
    expandedFolderKeys4['delete'](folderActionBusyKey) && expandedFolderKeys4['add'](value132);
    const customCategories3 = (this['_createPanelState']['customCategories'] || [])['map']((value133) =>
      this['_categoryKey'](value133) === folderActionBusyKey ? category9 : value133,
    );
    return (
      this['_setCreatePanelState']({
        draft: draft3 ? { category: category9 } : undefined,
        selectedFolderCategory: selectedFolderCategory2 ? category9 : this['_createPanelState']['selectedFolderCategory'],
        customCategories: customCategories3,
        expandedFolderKeys: expandedFolderKeys4,
        editingFolderCategory: '',
        editingFolderDraft: '',
        folderActionBusyKey: '',
        error: '',
      }),
      this['_renderCreatePanelFolderTree'](),
      !![]
    );
  }
  ['_renderCreatePanelContent']() {
    const el40 = this['createPanel'],
      enabled26 = this['_createPanelState'];
    if (!el40 || !enabled26) return;
    if (enabled26['presentation'] === 'library-save') {
      this['_renderLibrarySavePanelContent']();
      return;
    }
    const value134 =
        enabled26['coverInfo']?.['coverHtml'] ||
        _renderAssetIcon(enabled26['coverInfo']?.['coverType'] || 'other'),
      value135 =
        enabled26['mode'] === 'update'
          ? assetManagerText('createPanel.updateTitle')
          : assetManagerText('createPanel.createTitle'),
      count10 = Array['isArray'](enabled26['selectedIds']) ? enabled26['selectedIds']['length'] : 0,
      value136 = enabled26['saving']
        ? enabled26['mode'] === 'update' && enabled26['savingAction'] === 'join'
          ? assetManagerText('createPanel.overwrite')
          : enabled26['mode'] === 'update'
            ? assetManagerText('createPanel.saving')
            : assetManagerText('createPanel.creating')
        : enabled26['mode'] === 'update'
          ? enabled26['updateConfirmOpen']
            ? assetManagerText('createPanel.confirmOverwrite')
            : assetManagerText('createPanel.overwrite')
          : assetManagerText('createPanel.create'),
      value137 =
        enabled26['saving'] && enabled26['savingAction'] === 'join'
          ? assetManagerText('createPanel.joining')
          : assetManagerText('createPanel.join'),
      list15 = this['_getFilteredUpdateAssets'](enabled26['updateSearchKeyword']),
      name6 =
        list15['find']((value138) => String(value138?.['id'] || '') === enabled26['selectedAssetId']) ||
        null,
      value139 = this['_getUpdateListCategory'](),
      value140 = enabled26['error']
        ? '<div class="v2-asset-create-error" role="alert">' + _escapeHtml(enabled26['error']) + '</div>'
        : '',
      value141 =
        enabled26['mode'] === 'update' && enabled26['updateConfirmOpen'] && name6
          ? '<div class="v2-asset-create-confirm">' +
            _escapeHtml(
              assetManagerText('createPanel.confirmOverwriteAsset', {
                name: name6['name'] || assetManagerText('unnamedAsset'),
              }),
            ) +
            '</div>'
          : '',
      value142 =
        enabled26['mode'] === 'update'
          ? '\n          <div class="v2-asset-update-layout">\n            <div class="v2-asset-update-picker">\n              <input\n                type="search"\n                class="v2-asset-update-search"\n                id="asset-update-search"\n                placeholder="' +
            _escapeHtml(
              assetManagerText('createPanel.searchAssets', {
                category: this['_formatCategoryLabel'](value139),
              }),
            ) +
            '"\n                value="' +
            _escapeHtml(enabled26['updateSearchKeyword'] || '') +
            '"\n              />\n              <div class="v2-asset-update-list">\n                ' +
            (list15['length'] === 0
              ? '<div class="v2-asset-update-empty">' +
                (String(enabled26['updateSearchKeyword'] || '')['trim']()
                  ? _escapeHtml(assetManagerText('createPanel.noMatchedAssets'))
                  : _escapeHtml(
                      assetManagerText('createPanel.noCategoryAssets', {
                        category: this['_formatCategoryLabel'](value139),
                      }),
                    )) +
                '</div>'
              : list15['map']((error7) => {
                  const value143 =
                      String(error7?.['id'] || '') === enabled26['selectedAssetId'] ? ' active' : '',
                    value144 = error7?.['coverUrl']
                      ? '<img src="' +
                        _escapeHtml(error7['coverUrl']) +
                        '" alt="' +
                        _escapeHtml(error7?.['name'] || assetManagerText('assetAlt')) +
                        '" draggable="false" />'
                      : _renderAssetIcon(error7?.['coverType'] || 'other');
                  return (
                    '\n                            <button\n                              type="button"\n                              class="v2-asset-update-item' +
                    value143 +
                    '"\n                              data-asset-id="' +
                    _escapeHtml(error7['id']) +
                    '"\n                            >\n                              <div class="v2-asset-update-thumb">' +
                    value144 +
                    '</div>\n                              <div class="v2-asset-update-info">\n                                <span>' +
                    _escapeHtml(error7['name'] || assetManagerText('unnamedAsset')) +
                    '</span>\n                                <small>' +
                    _formatAssetDateTime(error7['updatedAt'] || error7['createdAt']) +
                    '</small>\n                              </div>\n                            </button>\n                          '
                  );
                })['join']('')) +
            '\n              </div>\n            </div>\n            <div class="v2-asset-update-editor">\n        '
          : '',
      value145 = enabled26['mode'] === 'update' ? '</div></div>' : '',
      value146 = enabled26['mode'] === 'update',
      value147 = value146 ? 'v2-asset-create-body v2-asset-create-body--update' : 'v2-asset-create-body',
      value148 = value146
        ? ''
        : '\n        <div class="v2-asset-create-source-panel">\n          <div class="v2-asset-create-source-header">\n            <div class="v2-asset-create-source-title">' +
          assetManagerText('createPanel.currentSelection') +
          '</div>\n            <div class="v2-asset-create-source-scope">' +
          assetManagerText('createPanel.selectedNodes', { count: count10 }) +
          '</div>\n          </div>\n          <div class="v2-asset-create-cover">\n            ' +
          value134 +
          '\n          </div>\n        </div>\n      ';
    ((el40['innerHTML'] =
      '\n      <div class="v2-asset-create-header">\n        <div class="v2-asset-create-title">\n          <span class="v2-asset-create-header-text">' +
      value135 +
      '</span>\n        </div>\n        <button type="button" class="v2-asset-create-close" data-ui-action="asset-create-close" aria-label="' +
      _escapeHtml(assetManagerText('close')) +
      '">×</button>\n      </div>\n      <div class="v2-asset-create-tabs">\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (enabled26['mode'] === 'create' ? ' active' : '') +
      '"\n          data-mode="create"\n        >' +
      assetManagerText('createPanel.createTab') +
      '</button>\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (enabled26['mode'] === 'update' ? ' active' : '') +
      '"\n          data-mode="update"\n        >' +
      assetManagerText('createPanel.updateTab') +
      '</button>\n      </div>\n      <div class="v2-asset-create-modal-body">\n        ' +
      value142 +
      '\n        <div class="' +
      value147 +
      '">\n          ' +
      value148 +
      '\n          <div class="v2-asset-create-right">\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.assetName') +
      '</div>\n              <input\n                type="text"\n                id="asset-create-name"\n                placeholder="' +
      _escapeHtml(assetManagerText('createPanel.assetNamePlaceholder')) +
      '"\n                value="' +
      _escapeHtml(enabled26['draft']?.['name'] || '') +
      '"\n              />\n            </div>\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.category') +
      '</div>\n              <button type="button" class="v2-asset-create-select-trigger" id="asset-create-category-trigger">\n                <span id="asset-create-category-val">' +
      _escapeHtml(this['_formatCategoryLabel'](enabled26['draft']?.['category'] || this['activeTab'])) +
      '</span>\n                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--white-40)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n                </svg>\n              </button>\n            </div>\n            ' +
      value140 +
      '\n            ' +
      value141 +
      '\n          </div>\n        </div>\n        ' +
      value145 +
      '\n      </div>\n      <div class="v2-asset-create-footer' +
      (value146 ? ' v2-asset-create-footer--update' : '') +
      '">\n        <button\n          type="button"\n          class="v2-asset-create-btn"\n          id="asset-create-submit"\n          ' +
      (enabled26['saving'] ? 'disabled' : '') +
      '\n        >' +
      value136 +
      '</button>\n        ' +
      (value146
        ? '<button\n                type="button"\n                class="v2-asset-create-btn v2-asset-create-btn--secondary"\n                id="asset-join-submit"\n                ' +
          (enabled26['saving'] ? 'disabled' : '') +
          '\n              >' +
          value137 +
          '</button>'
        : '') +
      '\n      </div>\n    '),
      this['_bindCreatePanelEvents']());
  }
  ['_bindCreatePanelEvents']() {
    const el41 = this['createPanel'],
      enabled27 = this['_createPanelState'];
    if (!el41 || !enabled27) return;
    el41['querySelector']("[data-ui-action='asset-create-close']")?.['addEventListener']('click', () => {
      this['closeCreatePanel']();
    });
    const el42 = el41['querySelector']('#asset-create-category-trigger'),
      el43 = el41['querySelector']('#asset-create-category-val');
    this['_createPanelDropdownOutsideHandler'] &&
      (document['removeEventListener']('pointerdown', this['_createPanelDropdownOutsideHandler']),
      (this['_createPanelDropdownOutsideHandler'] = null));
    this['_createPanelDropdownEl'] &&
      (this['_createPanelDropdownEl']['remove'](), (this['_createPanelDropdownEl'] = null));
    if (el42 && el43) {
      const el44 = document['createElement']('div');
      el44['className'] = 'v2-asset-select-dropdown';
      const run = () => {
          const value149 = this['_createPanelState']?.['draft']?.['category'] || this['activeTab'],
            value150 = this['_getCreatePanelCategories']()
              ['map']((value151) => {
                const value152 =
                    this['_categoryKey'](value151) === this['_categoryKey'](value149) ? ' selected' : '',
                  _escapeHtml4 = _escapeHtml(value151),
                  _escapeHtml5 = _escapeHtml(this['_formatCategoryLabel'](value151));
                return (
                  '<div class="v2-asset-select-item' +
                  value152 +
                  '" data-val="' +
                  _escapeHtml4 +
                  '">' +
                  _escapeHtml5 +
                  '</div>'
                );
              })
              ['join'](''),
            value153 = this['_canAddCustomCategory']()
              ? this['_createPanelState']?.['customCategoryEditing']
                ? '<div class="v2-asset-select-custom-row">\n                <input\n                  type="text"\n                  class="v2-asset-select-custom-input"\n                  id="asset-category-custom-input"\n                  placeholder="' +
                  _escapeHtml(assetManagerText('createPanel.categoryNamePlaceholder')) +
                  '"\n                  value="' +
                  _escapeHtml(this['_createPanelState']?.['customCategoryDraft'] || '') +
                  '"\n                />\n              </div>'
                : '<div class="v2-asset-select-item v2-asset-select-item--custom" data-custom-category="1">' +
                  assetManagerText('categories.custom') +
                  '</div>'
              : '';
          el44['innerHTML'] = value150 + value153;
        },
        handler4 = () => {
          const el45 = el44['querySelector']('#asset-category-custom-input'),
            value154 = el45?.['value'] ?? this['_createPanelState']?.['customCategoryDraft'] ?? '',
            enabled28 = this['_normalizeCategoryName'](value154);
          if (!enabled28) {
            (this['_setCreatePanelState']({ customCategoryEditing: ![], customCategoryDraft: '' }),
              run());
            return;
          }
          const list16 = this['_getCreatePanelCategories'](),
            enabled29 = this['_findCategoryByName'](enabled28, list16);
          if (!enabled29 && list16['length'] >= ASSET_CATEGORY_LIMIT) {
            window['showToast']?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn');
            return;
          }
          const category10 = enabled29 || this['_addUserCategory'](enabled28);
          if (!category10) return;
          const customCategories4 = [...(this['_createPanelState']?.['customCategories'] || [])];
          !enabled29 && !this['_findCategoryByName'](category10, customCategories4) && customCategories4['push'](category10);
          this['_setCreatePanelState']({
            draft: { category: category10 },
            customCategoryEditing: ![],
            customCategoryDraft: '',
            customCategories: customCategories4,
            updateConfirmOpen: ![],
            error: '',
          });
          this['_createPanelState']?.['mode'] === 'update' &&
            this['_syncUpdateSelectionForCategory'](category10);
          el43['textContent'] = this['_formatCategoryLabel'](category10);
          if (this['_createPanelState']?.['mode'] === 'update') {
            (run2(), this['_renderCreatePanelContent']());
            return;
          }
          run();
        };
      (run(), document['body']['appendChild'](el44), (this['_createPanelDropdownEl'] = el44));
      const run2 = () => {
        (el44['classList']['remove']('show'), el42['classList']['remove']('active'));
      };
      (el42['addEventListener']('click', (event6) => {
        event6['stopPropagation']();
        if (el44['classList']['contains']('show')) {
          run2();
          return;
        }
        const box = el42['getBoundingClientRect']();
        ((el44['style']['left'] = box['left'] + 'px'),
          (el44['style']['top'] = box['bottom'] + 4 + 'px'),
          (el44['style']['width'] = box['width'] + 'px'),
          el44['classList']['add']('show'),
          el42['classList']['add']('active'));
      }),
        el44['addEventListener']('click', (event7) => {
          const value155 = event7['target']['closest']("[data-custom-category='1']");
          if (value155) {
            (this['_setCreatePanelState']({
              customCategoryEditing: !![],
              customCategoryDraft: '',
              error: '',
            }),
              run(),
              window['requestAnimationFrame'](() => {
                el44['querySelector']('#asset-category-custom-input')?.['focus']();
              }));
            return;
          }
          const el46 = event7['target']['closest']('.v2-asset-select-item[data-val]');
          if (!el46) return;
          const category11 = this['_normalizeCategoryName'](el46['dataset']['val']) || this['activeTab'];
          (this['_createPanelState']?.['mode'] === 'update'
            ? (this['_setCreatePanelState']({ customCategoryEditing: ![], customCategoryDraft: '' }),
              this['_syncUpdateSelectionForCategory'](category11))
            : this['_setCreatePanelState']({
                draft: { category: category11 },
                customCategoryEditing: ![],
                customCategoryDraft: '',
                updateConfirmOpen: ![],
                error: '',
              }),
            run2(),
            this['_renderCreatePanelContent']());
        }),
        el44['addEventListener']('input', (customCategoryDraft) => {
          if (!customCategoryDraft['target']['matches']('#asset-category-custom-input')) return;
          this['_setCreatePanelState']({ customCategoryDraft: customCategoryDraft['target']['value'] || '' });
        }),
        el44['addEventListener']('keydown', (event8) => {
          if (!event8['target']['matches']('#asset-category-custom-input')) return;
          if (event8['key'] === 'Enter') {
            (event8['preventDefault'](), handler4());
            return;
          }
          event8['key'] === 'Escape' &&
            (event8['preventDefault'](),
            this['_setCreatePanelState']({ customCategoryEditing: ![], customCategoryDraft: '' }),
            run());
        }),
        el44['addEventListener']('focusout', (event9) => {
          if (!event9['target']['matches']('#asset-category-custom-input')) return;
          handler4();
        }));
      const value156 = (event10) => {
        !el44['contains'](event10['target']) &&
          !el42['contains'](event10['target']) &&
          run2();
      };
      ((this['_createPanelDropdownOutsideHandler'] = value156),
        document['addEventListener']('pointerdown', value156));
    }
    el41['querySelectorAll']('.v2-asset-create-tab')['forEach']((el47) => {
      el47['addEventListener']('click', () => {
        const mode = el47['dataset']['mode'] === 'update' ? 'update' : 'create';
        if (mode === this['_createPanelState']?.['mode']) return;
        this['_setCreatePanelState']({
          mode: mode,
          updateConfirmOpen: ![],
          customCategoryEditing: ![],
          customCategoryDraft: '',
          error: '',
        });
        if (mode === 'update' && !this['_createPanelState']?.['selectedAssetId']) {
          const value157 = this['_getFilteredUpdateAssets']()[0] || null;
          value157 && this['_syncCreatePanelDraftFromTarget'](value157);
        }
        this['_renderCreatePanelContent']();
      });
    });
    const el48 = el41['querySelector']('#asset-create-name');
    el48 &&
      el48['addEventListener']('input', (name7) => {
        this['_setCreatePanelState']({
          draft: { name: name7['target']['value'] || '' },
          updateConfirmOpen: ![],
          error: '',
        });
      });
    const el49 = el41['querySelector']('#asset-update-search');
    el49 &&
      el49['addEventListener']('input', (updateSearchKeyword) => {
        (this['_setCreatePanelState']({
          updateSearchKeyword: updateSearchKeyword['target']['value'] || '',
          updateConfirmOpen: ![],
          error: '',
        }),
          this['_renderCreatePanelContent']());
      });
    el41['querySelectorAll']('.v2-asset-update-item')['forEach']((el50) => {
      el50['addEventListener']('click', () => {
        const value158 = String(el50['dataset']['assetId'] || ''),
          enabled30 = this['_getSortedAssets']()['find'](
            (value159) => String(value159?.['id'] || '') === value158,
          );
        if (!enabled30) return;
        (this['_syncCreatePanelDraftFromTarget'](enabled30), this['_renderCreatePanelContent']());
      });
    });
    const el51 = el41['querySelector']('#asset-create-submit');
    el51 &&
      el51['addEventListener']('click', () => {
        this['_submitCreatePanel']();
      });
    const el52 = el41['querySelector']('#asset-join-submit');
    el52 &&
      el52['addEventListener']('click', () => {
        this['_joinCreatePanelToAsset']();
      });
  }
  async ['_submitCreatePanel']() {
    const enabled31 = this['_createPanelState'],
      enabled32 = this['createPanel'];
    if (!enabled31 || !enabled32 || enabled31['saving']) return;
    const value160 = Array['isArray'](enabled31['selectedIds']) ? enabled31['selectedIds'] : [],
      list17 = this['_getSelectedAssetNodes'](value160);
    if (!list17['length']) {
      (this['_setCreatePanelState']({ error: assetManagerText('errors.noSavableNodes') }),
        this['_renderCreatePanelContent']());
      return;
    }
    const name8 =
        String(this['_createPanelState']?.['draft']?.['name'] || '')['trim']() ||
        assetManagerText('unnamedAsset'),
      category12 =
        String(this['_createPanelState']?.['draft']?.['category'] || '')['trim']() || this['activeTab'];
    if (enabled31['mode'] === 'update') {
      const id3 = this['_getFilteredUpdateAssets']()['find'](
        (value161) => String(value161?.['id'] || '') === String(enabled31['selectedAssetId'] || ''),
      );
      if (!id3) {
        (this['_setCreatePanelState']({ error: assetManagerText('errors.selectAssetToUpdate') }),
          this['_renderCreatePanelContent']());
        return;
      }
      if (!enabled31['updateConfirmOpen']) {
        (this['_setCreatePanelState']({ updateConfirmOpen: !![], error: '' }),
          this['_renderCreatePanelContent']());
        return;
      }
      const value162 = this['_buildAssetPayloadFromSelection'](value160, {
        id: id3['id'],
        name: name8,
        category: category12,
        createdAt: id3['createdAt'] || id3['updatedAt'] || Date['now'](),
        updatedAt: Date['now'](),
      });
      (this['_setCreatePanelState']({ saving: !![], savingAction: 'overwrite', error: '' }),
        this['_renderCreatePanelContent']());
      try {
        (await saveAssetToServer(value162),
          this['_upsertLocalAsset'](value162),
          this['_scheduleVideoThumbJobs'](),
          (this['_openAssetId'] =
            String(value162['id'] || '') === this['_openAssetId'] ? value162['id'] : this['_openAssetId']),
          window['showToast']?.(assetManagerText('toasts.assetUpdated'), 'success'),
          this['closeCreatePanel'](),
          this['sidebarPanel']?.['classList']['contains']('show') && this['renderSidebarContent']());
      } catch (value163) {
        (this['_setCreatePanelState']({
          saving: ![],
          savingAction: '',
          error: assetManagerText('errors.assetUpdateFailed'),
        }),
          this['_renderCreatePanelContent'](),
          console['error'](value163),
          window['showToast']?.(assetManagerText('errors.assetUpdateFailed'), 'error'));
      }
      return;
    }
    const value164 = this['_buildAssetPayloadFromSelection'](value160, {
      name: name8,
      category: category12,
      createdAt: Date['now'](),
      updatedAt: Date['now'](),
    });
    (this['_setCreatePanelState']({ saving: !![], savingAction: 'create', error: '' }),
      this['_renderCreatePanelContent']());
    try {
      (await saveAssetToServer(value164),
        this['_upsertLocalAsset'](value164),
        this['_scheduleVideoThumbJobs'](),
        window['showToast']?.(assetManagerText('toasts.assetCreated'), 'success'),
        this['_playCreateAssetFly'](enabled32),
        this['closeCreatePanel'](),
        this['sidebarPanel']?.['classList']['contains']('show') &&
          ((this['_newAssetPulseId'] = String(value164['id'] || '')), this['renderSidebarContent']()));
    } catch (value165) {
      (this['_setCreatePanelState']({
        saving: ![],
        savingAction: '',
        error: assetManagerText('errors.assetCreateFailed'),
      }),
        this['_renderCreatePanelContent'](),
        console['error'](value165),
        window['showToast']?.(assetManagerText('errors.assetCreateFailed'), 'error'));
    }
  }
  async ['_joinCreatePanelToAsset']() {
    const enabled33 = this['_createPanelState'],
      enabled34 = this['createPanel'];
    if (!enabled33 || !enabled34 || enabled33['saving']) return;
    const value166 = Array['isArray'](enabled33['selectedIds']) ? enabled33['selectedIds'] : [],
      list18 = this['_getSelectedAssetNodes'](value166);
    if (!list18['length']) {
      (this['_setCreatePanelState']({ error: assetManagerText('errors.noJoinableNodes') }),
        this['_renderCreatePanelContent']());
      return;
    }
    const enabled35 = this['_getFilteredUpdateAssets']()['find'](
      (value167) => String(value167?.['id'] || '') === String(enabled33['selectedAssetId'] || ''),
    );
    if (!enabled35) {
      (this['_setCreatePanelState']({ error: assetManagerText('errors.selectAssetToJoin') }),
        this['_renderCreatePanelContent']());
      return;
    }
    const name9 =
        String(this['_createPanelState']?.['draft']?.['name'] || '')['trim']() ||
        assetManagerText('unnamedAsset'),
      category13 =
        String(this['_createPanelState']?.['draft']?.['category'] || '')['trim']() || this['activeTab'],
      value168 = this['_buildAssetAppendPayload'](enabled35, value166, {
        name: name9,
        category: category13,
        updatedAt: Date['now'](),
      });
    (this['_setCreatePanelState']({ saving: !![], savingAction: 'join', updateConfirmOpen: ![], error: '' }),
      this['_renderCreatePanelContent']());
    try {
      (await saveAssetToServer(value168),
        this['_upsertLocalAsset'](value168),
        this['_scheduleVideoThumbJobs'](),
        (this['_openAssetId'] =
          String(value168['id'] || '') === this['_openAssetId'] ? value168['id'] : this['_openAssetId']),
        window['showToast']?.(assetManagerText('toasts.assetJoined'), 'success'),
        this['closeCreatePanel'](),
        this['sidebarPanel']?.['classList']['contains']('show') && this['renderSidebarContent']());
    } catch (value169) {
      (this['_setCreatePanelState']({
        saving: ![],
        savingAction: '',
        error: assetManagerText('errors.assetJoinFailed'),
      }),
        this['_renderCreatePanelContent'](),
        console['error'](value169),
        window['showToast']?.(assetManagerText('errors.assetJoinFailed'), 'error'));
    }
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: viewport } = appStore['getState'](),
      value170 = window['innerWidth'] / 2,
      value171 = window['innerHeight'] / 2,
      enabled36 = document['documentElement']?.['clientWidth'] || window['innerWidth'] || 0,
      enabled37 = document['documentElement']?.['clientHeight'] || window['innerHeight'] || 0;
    if (!enabled36 || !enabled37) return screenToWorld(value170, value171, viewport);
    let value172 = 0,
      value173 = 0,
      value174 = enabled36,
      value175 = enabled37;
    const list19 = [],
      value176 = document['querySelector']('header');
    if (value176) list19['push'](value176);
    const value177 = document['querySelector']('.sidebar-floating');
    if (value177) list19['push'](value177);
    if (this['sidebarPanel']?.['classList']?.['contains']('show')) list19['push'](this['sidebarPanel']);
    const value178 = 8;
    for (const el53 of list19) {
      if (!el53?.['isConnected']) continue;
      const box2 = el53['getBoundingClientRect'](),
        value179 = Math['max'](value172, box2['left']),
        value180 = Math['max'](value173, box2['top']),
        value181 = Math['min'](value174, box2['right']),
        value182 = Math['min'](value175, box2['bottom']);
      if (value181 <= value179 || value182 <= value180) continue;
      if (box2['left'] <= value172 + value178 && box2['right'] > value172 + value178) {
        value172 = Math['max'](value172, box2['right']);
        continue;
      }
      if (box2['right'] >= value174 - value178 && box2['left'] < value174 - value178) {
        value174 = Math['min'](value174, box2['left']);
        continue;
      }
      if (box2['top'] <= value173 + value178 && box2['bottom'] > value173 + value178) {
        value173 = Math['max'](value173, box2['bottom']);
        continue;
      }
      if (box2['bottom'] >= value175 - value178 && box2['top'] < value175 - value178) {
        value175 = Math['min'](value175, box2['top']);
        continue;
      }
    }
    const count11 = value174 - value172,
      count12 = value175 - value173,
      value183 = count11 > 40 ? value172 + count11 / 2 : value170,
      value184 = count12 > 40 ? value173 + count12 / 2 : value171;
    return screenToWorld(value183, value184, viewport);
  }
  ['_calcNodesBBox'](value185) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const box3 of value185 || []) {
      if (!box3) continue;
      const value186 = Number(box3['x']) || 0,
        value187 = Number(box3['y']) || 0,
        value188 = Number(box3['width'] ?? box3['w']) || 100,
        value189 = Number(box3['height'] ?? box3['h']) || 100;
      ((minX = Math['min'](minX, value186)),
        (minY = Math['min'](minY, value187)),
        (maxX = Math['max'](maxX, value186 + value188)),
        (maxY = Math['max'](maxY, value187 + value189)));
    }
    if (!Number['isFinite'](minX) || !Number['isFinite'](minY))
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
    const w = Math['max'](0, maxX - minX),
      h = Math['max'](0, maxY - minY);
    return {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      w: w,
      h: h,
      cx: minX + w / 2,
      cy: minY + h / 2,
    };
  }
  ['_preloadThumb'](value190) {
    const enabled38 = String(value190 || '')['trim']();
    if (!enabled38) return ![];
    if (enabled38['startsWith']('data:')) return ![];
    if (this['_isNonImageMediaSrc'](enabled38)) return ![];
    if (this['_thumbPreloadSet']['has'](enabled38)) return ![];
    return (this['_thumbPreloadSet']['add'](enabled38), this['_ensureThumbDecoded'](enabled38), !![]);
  }
  ['_isSidebarOpen']() {
    return this['sidebarPanel']?.['classList']?.['contains']('show') === !![];
  }
  ['_renderMaterialLoadingState']() {
    const el54 = this['sidebarPanel']?.['querySelector']('[data-material-loading]');
    if (!el54) return;
    el54['hidden'] = this['_materialLoadingCount'] <= 0;
  }
  ['_warmVisibleAssetMedia']() {
    if (!this['_isSidebarOpen']()) return ![];
    let count13 = 0;
    for (const value191 of this['_getSortedAssets']()) {
      if (count13 >= 32) break;
      value191?.['coverUrl'] && (this['_preloadThumb'](value191['coverUrl']), (count13 += 1));
      const value192 = Array['isArray'](value191?.['items']) ? value191['items'] : [];
      for (const value193 of value192) {
        if (count13 >= 32) break;
        value193?.['thumbSrc'] && (this['_preloadThumb'](value193['thumbSrc']), (count13 += 1));
      }
    }
    return (this['_scheduleVideoThumbJobs'](), count13 > 0);
  }
  ['_ensureThumbDecoded'](value194) {
    const enabled39 = String(value194 || '')['trim']();
    if (!enabled39) return Promise['resolve'](![]);
    if (enabled39['startsWith']('data:')) return Promise['resolve'](!![]);
    if (this['_isNonImageMediaSrc'](enabled39)) return Promise['resolve'](![]);
    const value195 = this['_thumbDecodePromiseMap']['get'](enabled39);
    if (value195) return value195;
    const preloadCanvasImage2 = preloadCanvasImage(enabled39, { priority: 20, fetchPriority: 'auto' })['then'](
      () => !![],
      () => ![],
    );
    return (this['_thumbDecodePromiseMap']['set'](enabled39, preloadCanvasImage2), preloadCanvasImage2);
  }
  ['_isVideoMediaSrc'](value196) {
    const value197 = String(value196 || '')
      ['trim']()
      ['toLowerCase']();
    return /^data:video\//['test'](value197) || /\.(?:mp4|webm|mov|mkv|m4v)(?:[?#].*)?$/['test'](value197);
  }
  ['_isAudioMediaSrc'](value198) {
    const value199 = String(value198 || '')
      ['trim']()
      ['toLowerCase']();
    return (
      /^data:audio\//['test'](value199) ||
      /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/['test'](value199)
    );
  }
  ['_isNonImageMediaSrc'](value200) {
    return this['_isVideoMediaSrc'](value200) || this['_isAudioMediaSrc'](value200);
  }
  async ['_captureVideoFirstFrameDataUrl'](value201) {
    const enabled40 = String(value201 || '');
    if (!enabled40) return '';
    return await new Promise((handler5) => {
      const el55 = document['createElement']('video');
      ((el55['preload'] = 'auto'),
        (el55['muted'] = !![]),
        (el55['playsInline'] = !![]),
        (el55['crossOrigin'] = 'anonymous'));
      const run3 = () => {
          (el55['removeAttribute']('src'), el55['load']());
        },
        handler6 = () => {
          (run3(), handler5(''));
        },
        async2 = async () => {
          try {
            const count14 = Number['isFinite'](el55['duration']) ? el55['duration'] : 0,
              value202 = count14 > 0 ? Math['min'](0.08, Math['max'](0, count14 - 0.08)) : 0,
              value203 = () => {
                try {
                  const enabled41 = el55['videoWidth'] || 0,
                    enabled42 = el55['videoHeight'] || 0;
                  if (!enabled41 || !enabled42) return handler6();
                  const { width: width, height: height } = fitAssetMaterialVideoThumbnail(
                      enabled41,
                      enabled42,
                    ),
                    box4 = document['createElement']('canvas');
                  ((box4['width'] = width), (box4['height'] = height));
                  const ctx = box4['getContext']('2d');
                  ctx['drawImage'](el55, 0, 0, width, height);
                  const value204 = box4['toDataURL']('image/jpeg', 0.9);
                  (run3(), handler5(value204));
                } catch (value205) {
                  handler6();
                } finally {
                  el55['removeEventListener']('seeked', value203);
                }
              };
            (el55['addEventListener']('seeked', value203, { once: !![] }),
              (el55['currentTime'] = value202));
          } catch (value206) {
            handler6();
          }
        };
      (el55['addEventListener']('error', handler6, { once: !![] }),
        el55['addEventListener']('loadeddata', async2, { once: !![] }),
        attachMediaElementPlaybackSource(el55, enabled40, { preload: 'auto' })['catch'](() => {
          if (!String(el55['getAttribute']('src') || el55['src'] || '')['trim']()) {
            el55['src'] = enabled40;
            try {
              el55['load']?.();
            } catch {}
          }
        }));
    });
  }
  ['_scheduleVideoThumbJobs']() {
    if (!this['_isSidebarOpen']()) return;
    if (this['_videoThumbTimer']) return;
    this['_videoThumbTimer'] = window['setTimeout'](() => {
      this['_videoThumbTimer'] = 0;
      if (!this['_isSidebarOpen']()) return;
      this['_runVideoThumbJobs']();
    }, 0);
  }
  ['_scheduleSidebarRender']() {
    if (!this['_isSidebarOpen']()) return;
    if (this['_renamingAssetId'] || this['_renamingMaterialItemKey'] || this['_renamingMaterialCategoryKey'])
      return;
    if (this['_sidebarRenderRaf']) return;
    this['_sidebarRenderRaf'] = window['requestAnimationFrame'](() => {
      this['_sidebarRenderRaf'] = 0;
      if (!this['_isSidebarOpen']()) return;
      if (
        this['_renamingAssetId'] ||
        this['_renamingMaterialItemKey'] ||
        this['_renamingMaterialCategoryKey']
      )
        return;
      this['renderSidebarContent']();
    });
  }
  ['_beginRenameAsset'](value207) {
    const enabled43 = String(value207 || '');
    if (!enabled43) return;
    if (this['_savingMaterialCategoryKey'] || this['_savingMaterialItemKey']) return;
    if (this['_pendingDeleteAssetId']) this['_pendingDeleteAssetId'] = '';
    ((this['_renamingMaterialCategoryKey'] = ''),
      (this['_renamingMaterialItemKey'] = ''),
      (this['_renamingAssetId'] = enabled43),
      this['_closeMaterialMenu'](),
      this['_hideMaterialPreview'](),
      this['renderSidebarContent']());
  }
  ['_cancelRenameAsset']() {
    if (!this['_renamingAssetId']) return;
    ((this['_renamingAssetId'] = ''), this['renderSidebarContent']());
  }
  async ['_commitRenameAsset'](value208, value209) {
    const enabled44 = String(value208 || ''),
      enabled45 = String(value209 || '')['trim']();
    if (!enabled44) return;
    if (!enabled45) {
      window['showToast']?.(assetManagerText('errors.nameRequired'), 'error');
      return;
    }
    const error8 = (this['assets'] || [])['find'](
      (value210) => String(value210?.['id'] || '') === enabled44,
    );
    if (!error8) return;
    const value211 = String(error8?.['name'] || ''),
      value212 = error8?.['updatedAt'];
    if (value211 === enabled45) {
      ((this['_renamingAssetId'] = ''), this['renderSidebarContent']());
      return;
    }
    ((error8['name'] = enabled45), (error8['updatedAt'] = Date['now']()));
    const el56 = this['sidebarPanel']?.['querySelector'](
      '.v2-material-name-input[data-asset-id="' + CSS['escape'](enabled44) + '"]',
    );
    el56?.['setAttribute']('aria-busy', 'true');
    if (el56) el56['disabled'] = !![];
    el56?.['closest']('.v2-material-asset-row, .v2-material-project-row')?.['classList']['add'](
      'is-saving',
    );
    try {
      (await saveAssetToServer(error8),
        this['_upsertLocalAsset'](error8),
        window['showToast']?.(assetManagerText('toasts.renamed'), 'success'));
    } catch (value213) {
      ((error8['name'] = value211),
        (error8['updatedAt'] = value212),
        window['showToast']?.(assetManagerText('errors.renameFailed'), 'error'));
    } finally {
      ((this['_renamingAssetId'] = ''), this['renderSidebarContent']());
    }
  }
  ['_materialItemKey'](value214, value215) {
    const value216 = String(value214 || ''),
      count15 = Number(value215);
    return value216 && Number['isInteger'](count15) && count15 >= 0 ? value216 + ':' + count15 : '';
  }
  ['_beginRenameMaterialItem'](value217, value218) {
    const enabled46 = this['_materialItemKey'](value217, value218),
      value219 = this['_getMaterialAsset'](value217);
    if (
      !enabled46 ||
      !getMaterialAssetItems(value219)[Number(value218)] ||
      this['_savingMaterialCategoryKey'] ||
      this['_savingMaterialItemKey']
    )
      return;
    ((this['_renamingAssetId'] = ''),
      (this['_renamingMaterialCategoryKey'] = ''),
      (this['_renamingMaterialItemKey'] = enabled46),
      this['_closeMaterialMenu'](),
      this['_hideMaterialPreview'](),
      this['renderSidebarContent']());
  }
  ['_cancelRenameMaterialItem']() {
    if (!this['_renamingMaterialItemKey'] || this['_savingMaterialItemKey']) return;
    ((this['_renamingMaterialItemKey'] = ''), this['renderSidebarContent']());
  }
  async ['_commitRenameMaterialItem'](value220, value221, value222) {
    const value223 = String(value220 || ''),
      value224 = Number(value221),
      enabled47 = this['_materialItemKey'](value223, value224),
      name10 = String(value222 || '')['trim']();
    if (!enabled47 || enabled47 !== this['_renamingMaterialItemKey'] || this['_savingMaterialItemKey'])
      return ![];
    if (!name10)
      return (
        window['showToast']?.(assetManagerText('errors.nameRequired'), 'error'),
        this['sidebarPanel']
          ?.['querySelector'](
            '.v2-material-item-name-input[data-item-key="' + CSS['escape'](enabled47) + '"]',
          )
          ?.['focus'](),
        ![]
      );
    const args14 = this['_getMaterialAsset'](value223),
      error9 = getMaterialAssetItems(args14)[value224];
    if (!args14 || !error9) return ![];
    const value225 = String(error9?.['name'] || error9?.['nodeData']?.['name'] || '');
    if (value225 === name10)
      return ((this['_renamingMaterialItemKey'] = ''), this['renderSidebarContent'](), !![]);
    const value226 = {
      ...args14,
      updatedAt: Date['now'](),
      nodes: Array['isArray'](args14['nodes'])
        ? args14['nodes']['map']((args15, value227) =>
            value227 === value224 ? { ...args15, name: name10 } : args15,
          )
        : args14['nodes'],
      items: Array['isArray'](args14['items'])
        ? args14['items']['map']((nodeData, value228) =>
            value228 === value224
              ? {
                  ...nodeData,
                  name: name10,
                  nodeData: nodeData?.['nodeData']
                    ? { ...nodeData['nodeData'], name: name10 }
                    : nodeData?.['nodeData'],
                }
              : nodeData,
          )
        : args14['items'],
    };
    this['_savingMaterialItemKey'] = enabled47;
    const el57 = this['sidebarPanel']?.['querySelector'](
      '.v2-material-item-name-input[data-item-key="' + CSS['escape'](enabled47) + '"]',
    );
    el57?.['setAttribute']('aria-busy', 'true');
    if (el57) el57['disabled'] = !![];
    el57?.['closest']('.v2-material-item-row')?.['classList']['add']('is-saving');
    try {
      return (
        await saveAssetToServer(value226),
        this['_upsertLocalAsset'](value226),
        window['showToast']?.(assetManagerText('toasts.renamed'), 'success'),
        !![]
      );
    } catch (value229) {
      return (
        console['error'](value229),
        window['showToast']?.(assetManagerText('errors.renameFailed'), 'error'),
        ![]
      );
    } finally {
      ((this['_renamingMaterialItemKey'] = ''),
        (this['_savingMaterialItemKey'] = ''),
        this['renderSidebarContent']());
    }
  }
  ['_getMaterialCategoryRenameInput'](value230) {
    return (
      Array['from'](
        this['sidebarPanel']?.['querySelectorAll']?.('.v2-material-folder-name-input[data-category-key]') ||
          [],
      )['find']((el58) => el58['dataset']['categoryKey'] === value230) || null
    );
  }
  ['_focusMaterialCategoryRenameInput'](value231, { select: select = ![] } = {}) {
    window['requestAnimationFrame'](() => {
      const el59 = this['_getMaterialCategoryRenameInput'](value231);
      if (!el59 || el59['disabled'] || !el59['isConnected']) return;
      ((el59['dataset']['submitted'] = ''), el59['focus']());
      if (select) el59['select']?.();
    });
  }
  ['_beginRenameMaterialCategory'](value232) {
    const enabled48 = this['_findCategoryByName'](value232, this['tabs']),
      enabled49 = this['_categoryKey'](enabled48);
    if (!enabled48 || !enabled49 || !this['_isUserCategory'](enabled48)) return;
    if (this['_savingMaterialCategoryKey'] || this['_savingMaterialItemKey']) return;
    ((this['_materialCurrentFolderCategory'] = enabled48),
      (this['_pendingMaterialFolderDeleteKey'] = ''),
      (this['_renamingAssetId'] = ''),
      (this['_renamingMaterialItemKey'] = ''),
      (this['_renamingMaterialCategoryKey'] = enabled49),
      this['_closeMaterialMenu'](),
      this['_hideMaterialPreview'](),
      this['renderSidebarContent'](),
      this['_focusMaterialCategoryRenameInput'](enabled49, { select: !![] }));
  }
  ['_cancelRenameMaterialCategory']() {
    if (!this['_renamingMaterialCategoryKey'] || this['_savingMaterialCategoryKey']) return;
    ((this['_renamingMaterialCategoryKey'] = ''), this['renderSidebarContent']());
  }
  ['_rejectMaterialCategoryRename'](value233, value234) {
    (window['showToast']?.(value234, 'error'), this['_focusMaterialCategoryRenameInput'](value233));
  }
  async ['_commitRenameMaterialCategory'](value235, value236) {
    const currentCategory = this['_findCategoryByName'](value235, this['tabs']),
      enabled50 = this['_categoryKey'](currentCategory),
      nextCategory = this['_normalizeCategoryName'](value236);
    if (
      !currentCategory ||
      !enabled50 ||
      !this['_isUserCategory'](currentCategory) ||
      this['_renamingMaterialCategoryKey'] !== enabled50 ||
      this['_savingMaterialCategoryKey']
    )
      return ![];
    if (!nextCategory)
      return (this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('errors.nameRequired')), ![]);
    if (this['_isHiddenAssetCategory'](nextCategory))
      return (
        this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('categoryNameUnavailable')),
        ![]
      );
    const value237 = this['_formatCategoryLabel'](currentCategory);
    if (value237 === nextCategory)
      return ((this['_renamingMaterialCategoryKey'] = ''), this['renderSidebarContent'](), !![]);
    const value238 = nextCategory['toLocaleLowerCase'](),
      value239 = this['tabs']['some'](
        (value240) =>
          this['_categoryKey'](value240) !== enabled50 &&
          this['_formatCategoryLabel'](value240)['toLocaleLowerCase']() === value238,
      );
    if (value239)
      return (this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('categoryNameExists')), ![]);
    if (this['_isProtectedCategory'](nextCategory))
      return (
        this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('categoryNameUnavailable')),
        ![]
      );
    const userCategories2 = [...this['userCategories']],
      parents3 = { ...this['materialCategoryParents'] },
      nextCategory2 = buildMaterialCategoryRenamePlan({
        assets: this['_getSortedAssets'](),
        userCategories: userCategories2,
        allCategories: this['tabs'],
        currentCategory: currentCategory,
        nextCategory: nextCategory,
        categoryKey: (value241) => this['_categoryKey'](value241),
        now: Date['now'](),
      });
    if (nextCategory2['status'] === 'unchanged')
      return ((this['_renamingMaterialCategoryKey'] = ''), this['renderSidebarContent'](), !![]);
    if (nextCategory2['status'] === 'duplicate')
      return (this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('categoryNameExists')), ![]);
    if (nextCategory2['status'] !== 'ready')
      return (
        this['_rejectMaterialCategoryRename'](enabled50, assetManagerText('categoryRenameFailed')),
        ![]
      );
    const renameMaterialFolderParent2 = renameMaterialFolderParent({
      parents: parents3,
      currentCategory: currentCategory,
      nextCategory: nextCategory2['nextCategory'],
      categoryKey: (value242) => this['_categoryKey'](value242),
    });
    this['_savingMaterialCategoryKey'] = enabled50;
    const el60 = this['_getMaterialCategoryRenameInput'](enabled50);
    el60?.['setAttribute']('aria-busy', 'true');
    if (el60) el60['disabled'] = !![];
    el60?.['closest']('.v2-material-folder-row')?.['classList']['add']('is-saving');
    const list20 = [];
    let value243 = ![];
    try {
      for (let value244 = 0; value244 < nextCategory2['renamedAssets']['length']; value244 += 1) {
        (list20['push'](nextCategory2['originalAssets'][value244]),
          await saveAssetToServer(nextCategory2['renamedAssets'][value244]));
      }
      return (
        (value243 = !![]),
        await this['_saveMaterialCategorySettings'](
          nextCategory2['nextUserCategories'],
          this['materialCategoryDisplayNames'],
          renameMaterialFolderParent2,
        ),
        (this['userCategories'] = nextCategory2['nextUserCategories']),
        (this['materialCategoryParents'] = renameMaterialFolderParent2),
        nextCategory2['renamedAssets']['forEach']((value245) => this['_upsertLocalAsset'](value245)),
        this['_categoryKey'](this['activeTab']) === enabled50 &&
          (this['activeTab'] = nextCategory2['nextCategory']),
        this['_expandedMaterialCategories']['delete'](enabled50) &&
          this['_expandedMaterialCategories']['add'](nextCategory2['nextKey']),
        this['_categoryKey'](this['_materialCurrentFolderCategory']) === enabled50 &&
          (this['_materialCurrentFolderCategory'] = nextCategory2['nextCategory']),
        this['_syncTabsFromAssets'](),
        this['_renderSidebarTabs'](),
        window['showToast']?.(assetManagerText('categoryRenamed'), 'success'),
        !![]
      );
    } catch (value246) {
      const list21 = [];
      for (const value247 of list20['reverse']()) {
        try {
          await saveAssetToServer(value247);
        } catch (value248) {
          list21['push'](value248);
        }
      }
      if (value243)
        try {
          await this['_saveMaterialCategorySettings'](
            userCategories2,
            this['materialCategoryDisplayNames'],
            parents3,
          );
        } catch (value249) {
          list21['push'](value249);
        }
      return (
        list21['length'] && console['error']('回滚素材文件夹重命名失败', list21),
        console['error'](value246),
        window['showToast']?.(assetManagerText('categoryRenameFailed'), 'error'),
        ![]
      );
    } finally {
      ((this['_renamingMaterialCategoryKey'] = ''),
        (this['_savingMaterialCategoryKey'] = ''),
        this['renderSidebarContent']());
    }
  }
  async ['_runVideoThumbJobs']() {
    if (!this['_isSidebarOpen']()) return;
    let count16 = 2;
    for (const value250 of this['_getSortedAssets']()) {
      if (!this['_isSidebarOpen']()) break;
      if (count16 <= 0) break;
      const assetId = String(value250?.['id'] || '')['trim']();
      if (!assetId) continue;
      const list22 = Array['isArray'](value250?.['items']) ? value250['items'] : [];
      for (let count17 = 0; count17 < list22['length']; count17++) {
        if (count16 <= 0) break;
        const value251 = list22[count17],
          _normalizeAssetType4 = _normalizeAssetType(value251?.['type']);
        if (_normalizeAssetType4 !== 'video') continue;
        const value252 = String(value251?.['thumbSrc'] || '');
        if (isAssetMaterialVideoThumbnailUrl(value252)) continue;
        const value253 = assetId + ':' + count17;
        if (this['_videoThumbInFlight']['has'](value253)) continue;
        const assetMaterialVideoSourceUrl =
          resolveAssetMaterialVideoSourceUrl(value251?.['nodeData']) ||
          (this['_isVideoMediaSrc'](value252) ? value252 : '');
        if (!assetMaterialVideoSourceUrl) continue;
        (this['_videoThumbInFlight']['add'](value253),
          (count16 -= 1),
          this['_captureVideoFirstFrameDataUrl'](assetMaterialVideoSourceUrl)
            ['then'](async (dataUrl) => {
              if (!String(dataUrl || '')['startsWith']('data:image/')) return;
              const response = await saveAssetThumbToServer({
                  assetId: assetId,
                  key: getAssetMaterialVideoThumbnailKey(count17),
                  dataUrl: dataUrl,
                }),
                enabled51 = String(response?.['url'] || '');
              if (!enabled51) return;
              value251['thumbSrc'] = enabled51;
              if (count17 === 0) value250['coverUrl'] = enabled51;
              (await saveAssetToServer(value250),
                upsertAssetMentionAsset(value250),
                this['sidebarPanel']?.['classList']['contains']('show') && this['_scheduleSidebarRender']());
            })
            ['catch'](() => {})
            ['finally'](() => {
              this['_videoThumbInFlight']['delete'](value253);
            }));
      }
    }
  }
  async ['loadAssetsFromServer']() {
    ((this['_materialLoadingCount'] += 1), this['_renderMaterialLoadingState']());
    try {
      const fetchAssetsFromServer2 = await fetchAssetsFromServer();
      ((this['assets'] = _sortAssetsByUpdatedTime(
        (Array['isArray'](fetchAssetsFromServer2) ? fetchAssetsFromServer2 : [])
          ['map']((value254) => this['_normalizeAssetEntity'](value254))
          ['filter'](Boolean),
      )),
        this['_syncTabsFromAssets'](),
        this['_renderSidebarTabs'](),
        this['assets']['forEach']((state5) => {
          state5['nodes'] &&
            state5['nodes'][0] &&
            !isAssetMaterialThumbnailUrl(state5['coverUrl']) &&
            (state5['coverUrl'] =
              resolveAssetNodeCoverUrl(state5['nodes'][0]) || state5['coverUrl'] || '');
          if (Array['isArray'](state5['items']))
            state5['items'] = getMaterialAssetItems(state5)['map']((args16) => ({
              ...args16,
              thumbSrc: _resolveMaterialItemThumbSrc(args16),
            }));
          else
            Array['isArray'](state5['nodes']) &&
              (state5['items'] = state5['nodes']['map']((value255) => _buildAssetItem(value255)));
        }),
        setAssetMentionAssets(this['_getMentionEligibleAssets']()),
        this['_warmVisibleAssetMedia'](),
        this['sidebarPanel'] &&
          this['sidebarPanel']['classList']['contains']('show') &&
          this['renderSidebarContent']());
    } catch (value256) {
      console['error']('加载全局素材失败', value256);
    } finally {
      ((this['_materialLoadingCount'] = Math['max'](0, this['_materialLoadingCount'] - 1)),
        this['_renderMaterialLoadingState']());
    }
  }
  ['refreshAssetsFromServer']() {
    const value257 = Promise['resolve'](this['_assetLoadPromise'])
      ['catch'](() => {})
      ['then'](() => this['loadAssetsFromServer']());
    return ((this['_assetLoadPromise'] = value257), value257);
  }
  async ['upsertMediaAssetPackage'](options3 = {}) {
    const enabled52 = String(options3?.['packageKey'] || '')['trim']();
    if (!enabled52) throw new Error('加入素材包失败：缺少素材包标识。');
    const promise = this['_assetPackageUpsertByKey']['get'](enabled52) || Promise['resolve'](),
      value258 = promise['catch'](() => {})['then'](async () => {
        await this['_assetLoadPromise'];
        const value259 =
            (this['assets'] || [])['find'](
              (value260) => String(value260?.['packageKey'] || '')['trim']() === enabled52,
            ) || null,
          assetId2 = upsertMediaAssetPackage(value259, options3, {
            createId: (value261) => generateId(value261),
            now: Date['now'](),
          });
        return (
          await saveAssetToServer(assetId2['asset']),
          this['_upsertLocalAsset'](assetId2['asset']),
          this['_scheduleVideoThumbJobs'](),
          this['sidebarPanel']?.['classList']['contains']('show') &&
            ((this['_newAssetPulseId'] = String(assetId2['asset']['id'] || '')),
            this['renderSidebarContent']()),
          {
            assetId: assetId2['asset']['id'],
            asset: assetId2['asset'],
            itemIndex: assetId2['itemIndex'],
            itemCreated: assetId2['itemCreated'],
            packageCreated: assetId2['packageCreated'],
            imageUrl: String(
              assetId2['item']?.['nodeData']?.['imageUrl'] ||
                (assetId2['item']?.['type'] !== 'source-audio'
                  ? assetId2['item']?.['nodeData']?.['src']
                  : '') ||
                '',
            )['trim'](),
            audioUrl: String(
              assetId2['item']?.['nodeData']?.['audioUrl'] ||
                (assetId2['item']?.['type'] === 'source-audio'
                  ? assetId2['item']?.['nodeData']?.['src']
                  : '') ||
                '',
            )['trim'](),
          }
        );
      });
    this['_assetPackageUpsertByKey']['set'](enabled52, value258);
    try {
      return await value258;
    } finally {
      this['_assetPackageUpsertByKey']['get'](enabled52) === value258 &&
        this['_assetPackageUpsertByKey']['delete'](enabled52);
    }
  }
  ['showCreatePanel'](list23, value262, value263 = {}) {
    if (!list23 || list23['length'] === 0) return;
    (void value262, this['closeCreatePanel']());
    const presentation2 = value263['presentation'] === 'library-save' ? 'library-save' : 'default',
      el61 = document['createElement']('div');
    el61['className'] = 'v2-asset-create-backdrop show';
    const el62 = document['createElement']('div');
    ((el62['className'] =
      'v2-asset-create-panel' + (presentation2 === 'library-save' ? ' v2-asset-create-panel--library-save' : '')),
      el62['setAttribute']('role', 'dialog'),
      el62['setAttribute']('aria-modal', 'true'),
      el62['setAttribute'](
        'aria-label',
        presentation2 === 'library-save' ? assetManagerText('createPanel.saveTitle') : assetManagerText('title'),
      ));
    const state6 = appStore['getState'](),
      error10 = state6['nodes'][list23[0]];
    (el61['appendChild'](el62),
      document['body']['appendChild'](el61),
      (this['createPanelBackdrop'] = el61),
      (this['createPanel'] = el62));
    const value264 =
        presentation2 === 'library-save'
          ? resolveAssetNodePreviewUrl(error10)
          : resolveAssetNodeCoverUrl(error10),
      enabled53 = this['_buildCreatePanelCoverInfo'](error10, value264);
    ((this['_createPanelState'] = this['_createDefaultPanelState'](list23, enabled53, {
      presentation: presentation2,
      defaultName: presentation2 === 'library-save' ? error10?.['name'] : '',
    })),
      this['_renderCreatePanelContent'](),
      el61['addEventListener']('pointerdown', (event11) => {
        if (event11['target'] === el61) this['closeCreatePanel']();
      }),
      (this['_createPanelKeydownHandler'] = (event12) => {
        if (event12['key'] !== 'Escape') return;
        if (this['_createPanelDropdownEl']?.['contains'](event12['target'])) return;
        this['closeCreatePanel']();
      }),
      document['addEventListener']('keydown', this['_createPanelKeydownHandler']),
      !enabled53['coverUrl'] &&
        resolveAssetNodeCoverThumbId(error10) &&
        void this['_resolveCreatePanelCover'](error10, { preferPreview: presentation2 === 'library-save' })
          ['then']((value265) => {
            this['_applyCreatePanelCoverInfo'](el62, value265);
          })
          ['catch'](() => {}));
  }
  ['showLibrarySavePanel'](value266, value267 = null, args17 = {}) {
    this['showCreatePanel'](value266, value267, {
      ...args17,
      placement: 'center',
      presentation: 'library-save',
    });
  }
  ['_playCreateAssetFly'](el63) {
    const el64 = el63 && el63['isConnected'] ? el63 : this['createPanel'];
    if (!el64?.['isConnected']) return;
    const value268 = el64['querySelector']('.v2-asset-create-cover'),
      fromElement = value268?.['firstElementChild'];
    if (!fromElement) return;
    const toElement = document['getElementById']('btnAssets');
    playAssetCreateFly({ fromElement: fromElement, toElement: toElement });
  }
  ['closeCreatePanel']() {
    const value269 = this['_categoryKey'](this['_createPanelState']?.['editingFolderCategory']);
    (value269 &&
      !this['_createPanelState']?.['folderActionBusyKey'] &&
      this['_renamingMaterialCategoryKey'] === value269 &&
      (this['_renamingMaterialCategoryKey'] = ''),
      this['_createPanelDropdownOutsideHandler'] &&
        (document['removeEventListener']('pointerdown', this['_createPanelDropdownOutsideHandler']),
        (this['_createPanelDropdownOutsideHandler'] = null)),
      this['_createPanelDropdownEl'] &&
        (this['_createPanelDropdownEl']['remove'](), (this['_createPanelDropdownEl'] = null)),
      this['_createPanelKeydownHandler'] &&
        (document['removeEventListener']('keydown', this['_createPanelKeydownHandler']),
        (this['_createPanelKeydownHandler'] = null)),
      this['_createPanelCoverObjectUrl'] &&
        (String(this['_createPanelCoverObjectUrl'])['startsWith']('blob:') &&
          URL['revokeObjectURL'](this['_createPanelCoverObjectUrl']),
        (this['_createPanelCoverObjectUrl'] = '')),
      this['createPanel'] && (this['createPanel']['remove'](), (this['createPanel'] = null)),
      this['createPanelBackdrop'] &&
        (this['createPanelBackdrop']['remove'](), (this['createPanelBackdrop'] = null)),
      (this['_createPanelState'] = null));
  }
  ['initSidebarPanel']() {
    ((this['sidebarPanel'] = document['createElement']('div')),
      (this['sidebarPanel']['className'] = 'v2-asset-sidebar-panel canvas-toolbar-panel-surface'),
      this['sidebarPanel']['setAttribute']('aria-label', assetManagerText('libraryTitle')),
      (this['sidebarPanel']['innerHTML'] =
        '\n      <div class="v2-asset-sidebar-header">\n        <button type="button" class="v2-material-library-close" data-ui-action="material-library-close" aria-label="' +
        _escapeHtml(assetManagerText('back')) +
        '">\n          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>\n        </button>\n        <div class="v2-asset-sidebar-title" id="asset-sidebar-title">\n          <span class="v2-asset-sidebar-title-text" id="asset-sidebar-title-text">' +
        assetManagerText('libraryTitle') +
        '</span>\n          <span class="v2-material-library-loading" data-material-loading role="status" aria-live="polite" hidden>\n            <span class="v2-material-library-loading-spinner" aria-hidden="true"></span>\n            <span class="v2-material-library-loading-label">' +
        _escapeHtml(assetManagerText('loading')) +
        '</span>\n          </span>\n        </div>\n        <button type="button" class="v2-material-library-add" data-ui-action="material-new-folder" aria-label="' +
        _escapeHtml(assetManagerText('newFolder')) +
        '">\n          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>\n        </button>\n      </div>\n      <div class="v2-material-library-tools">\n        <label class="v2-material-library-search">\n          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>\n          <input type="search" data-material-search placeholder="' +
        _escapeHtml(assetManagerText('searchPlaceholder')) +
        '" aria-label="' +
        _escapeHtml(assetManagerText('searchAria')) +
        '" autocomplete="off" />\n        </label>\n        <button type="button" class="v2-material-library-favorites" data-ui-action="material-favorites-toggle" aria-pressed="false">\n          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" fill="currentColor"/></svg>\n          <span>' +
        assetManagerText('favorites') +
        '</span>\n        </button>\n        <div class="v2-material-library-divider"></div>\n        <div class="v2-material-library-section-label">' +
        assetManagerText('folders') +
        '</div>\n      </div>\n      <div class="v2-asset-sidebar-content" id="asset-sidebar-content">\n        <div class="v2-material-library-tree" role="tree" aria-label="' +
        _escapeHtml(assetManagerText('folders')) +
        '"></div>\n      </div>\n    '));
    const el65 = document['querySelector']('.sidebar-floating');
    el65
      ? el65['appendChild'](this['sidebarPanel'])
      : document['body']['appendChild'](this['sidebarPanel']);
    const el66 = this['sidebarPanel']['querySelector']('[data-material-search]');
    (el66?.['addEventListener']('input', (event13) => {
      ((this['_materialSearchQuery'] = String(event13['currentTarget']?.['value'] || '')),
        this['_closeMaterialMenu'](),
        this['_hideMaterialPreview'](),
        this['renderSidebarContent']());
    }),
      this['sidebarPanel']['querySelector']('#asset-sidebar-content')?.['addEventListener'](
        'scroll',
        () => {
          this['_closeMaterialMenu']();
          const el67 = this['_materialPreviewRow'];
          el67?.['isConnected']
            ? window['requestAnimationFrame'](() => {
                el67 === this['_materialPreviewRow'] && this['_showMaterialPreview'](el67);
              })
            : this['_hideMaterialPreview']();
        },
        { passive: !![] },
      ),
      this['sidebarPanel']['addEventListener']('click', (event14) => {
        const el68 = event14['target']['closest']('[data-ui-action]'),
          value270 = el68?.['dataset']?.['uiAction'] || '';
        if (value270) this['_cancelPendingMaterialAssetRowToggle']();
        if (value270 === 'material-library-close') {
          this['hideSidebarPanel']();
          return;
        }
        if (value270 === 'material-new-folder') {
          this['_createMaterialFolder']({
            parentCategory: this['_materialCurrentFolderCategory'] || this['activeTab'],
            surface: 'sidebar',
          });
          return;
        }
        if (value270 === 'material-favorites-toggle') {
          ((this['_materialFavoritesOnly'] = !this['_materialFavoritesOnly']),
            this['_closeMaterialMenu'](),
            this['_hideMaterialPreview'](),
            this['renderSidebarContent']());
          return;
        }
        if (value270 === 'material-folder-rename') {
          this['_beginRenameMaterialCategory'](el68?.['dataset']?.['category']);
          return;
        }
        if (value270 === 'material-rename') {
          this['_beginRenameAsset'](el68?.['dataset']?.['assetId']);
          return;
        }
        if (value270 === 'material-item-rename') {
          this['_beginRenameMaterialItem'](
            el68?.['dataset']?.['assetId'],
            el68?.['dataset']?.['itemIndex'],
          );
          return;
        }
        if (value270 === 'material-folder-delete-request') {
          const enabled54 = this['_normalizeCategoryName'](el68?.['dataset']?.['category']);
          if (!enabled54 || !this['_isUserCategory'](enabled54)) return;
          ((this['_pendingMaterialFolderDeleteKey'] = this['_categoryKey'](enabled54)),
            this['_closeMaterialMenu'](),
            this['_hideMaterialPreview'](),
            this['renderSidebarContent']());
          return;
        }
        if (value270 === 'material-folder-delete-cancel') {
          ((this['_pendingMaterialFolderDeleteKey'] = ''), this['renderSidebarContent']());
          return;
        }
        if (value270 === 'material-folder-delete-confirm') {
          const enabled55 = this['_normalizeCategoryName'](el68?.['dataset']?.['category']),
            value271 = this['_categoryKey'](enabled55);
          if (
            !enabled55 ||
            !this['_isUserCategory'](enabled55) ||
            this['_pendingMaterialFolderDeleteKey'] !== value271 ||
            this['_deletingMaterialFolderKey']
          )
            return;
          ((this['_pendingMaterialFolderDeleteKey'] = ''),
            (this['_deletingMaterialFolderKey'] = value271),
            this['renderSidebarContent'](),
            void this['_deleteUserCategory'](enabled55)['finally'](() => {
              (this['_deletingMaterialFolderKey'] === value271 && (this['_deletingMaterialFolderKey'] = ''),
                this['renderSidebarContent']());
            }));
          return;
        }
        if (value270 === 'material-folder-toggle') {
          this['_toggleMaterialFolderDisclosure'](el68);
          return;
        }
        if (value270 === 'material-asset-toggle') {
          this['_toggleMaterialAssetDisclosure'](el68);
          return;
        }
        if (value270 === 'material-menu-open') {
          (event14['preventDefault'](), event14['stopPropagation']());
          const value272 = String(el68?.['dataset']?.['assetId'] || '');
          if (value272) this['_openMaterialMenu'](value272, el68);
          return;
        }
        if (
          value270 ||
          event14['target']['closest'](
            "input, button, [contenteditable='true'], .v2-material-folder-delete-actions",
          )
        )
          return;
        const el69 = event14['target']['closest']('.v2-material-folder-row');
        if (el69) {
          const el70 = el69['querySelector']('[data-ui-action="material-folder-toggle"]');
          el70 &&
            !el70['disabled'] &&
            event14['detail'] <= 1 &&
            this['_toggleMaterialFolderDisclosure'](el70);
          return;
        }
        const el71 = event14['target']['closest']('.v2-material-project-row');
        if (el71) {
          const el72 = el71['querySelector']('[data-ui-action="material-asset-toggle"]');
          el72 &&
            !el72['disabled'] &&
            event14['detail'] <= 1 &&
            this['_toggleMaterialAssetDisclosure'](el72);
          return;
        }
        const el73 = event14['target']['closest']('.v2-material-asset-row');
        if (el73) {
          const el74 = el73['querySelector']('[data-ui-action="material-asset-toggle"]');
          if (!el74 || el74['disabled']) return;
          if (event14['detail'] > 1) {
            this['_cancelPendingMaterialAssetRowToggle']();
            return;
          }
          this['_scheduleMaterialAssetRowToggle'](el74);
        }
      }),
      this['sidebarPanel']['addEventListener']('contextmenu', (value273) => {
        this['_materialContextMenuController']['handleContextMenu'](value273);
      }),
      this['sidebarPanel']['addEventListener']('dblclick', (event15) => {
        event15['stopPropagation']();
        if (
          event15['target']['closest'](
            '.v2-material-name-input, .v2-material-item-name-input, .v2-material-folder-name-input, [data-ui-action]',
          )
        )
          return;
        const el75 = event15['target']['closest']('[data-material-use]'),
          enabled56 = String(el75?.['dataset']?.['assetId'] || '');
        if (!el75 || !enabled56) return;
        (this['_cancelPendingMaterialAssetRowToggle'](),
          event15['preventDefault'](),
          event15['stopPropagation']());
        const value274 = Number(el75['dataset']['itemIndex']);
        el75['dataset']['itemIndex'] !== undefined && Number['isFinite'](value274)
          ? this['_restoreAssetSubItem'](enabled56, value274)
          : this['restoreAssetToCanvas'](enabled56);
      }),
      this['sidebarPanel']['addEventListener']('keydown', (event16) => {
        const el76 = event16['target']['closest']('.v2-material-item-name-input');
        if (el76) {
          if (event16['key'] === 'Enter')
            (event16['preventDefault'](),
              event16['stopPropagation'](),
              (el76['dataset']['submitted'] = '1'),
              void this['_commitRenameMaterialItem'](
                el76['dataset']['assetId'],
                el76['dataset']['itemIndex'],
                el76['value'],
              ));
          else
            event16['key'] === 'Escape' &&
              (event16['preventDefault'](),
              event16['stopPropagation'](),
              (el76['dataset']['submitted'] = '1'),
              this['_cancelRenameMaterialItem']());
          return;
        }
        const el77 = event16['target']['closest']('.v2-material-folder-name-input');
        if (el77) {
          if (event16['key'] === 'Enter')
            (event16['preventDefault'](),
              event16['stopPropagation'](),
              (el77['dataset']['submitted'] = '1'),
              void this['_commitRenameMaterialCategory'](
                el77['dataset']['category'],
                el77['value'],
              ));
          else
            event16['key'] === 'Escape' &&
              (event16['preventDefault'](),
              event16['stopPropagation'](),
              (el77['dataset']['submitted'] = '1'),
              this['_cancelRenameMaterialCategory']());
          return;
        }
        const el78 = event16['target']['closest']('.v2-material-name-input');
        if (!el78) return;
        const value275 = String(el78['dataset']['assetId'] || '');
        if (event16['key'] === 'Enter')
          (event16['preventDefault'](),
            (el78['dataset']['submitted'] = '1'),
            void this['_commitRenameAsset'](value275, el78['value']));
        else
          event16['key'] === 'Escape' &&
            (event16['preventDefault'](),
            (el78['dataset']['submitted'] = '1'),
            this['_cancelRenameAsset']());
      }),
      this['sidebarPanel']['addEventListener']('focusout', (event17) => {
        const el79 = event17['target']['closest']('.v2-material-item-name-input');
        if (el79) {
          if (el79['dataset']['submitted'] === '1') return;
          ((el79['dataset']['submitted'] = '1'),
            void this['_commitRenameMaterialItem'](
              el79['dataset']['assetId'],
              el79['dataset']['itemIndex'],
              el79['value'],
            ));
          return;
        }
        const el80 = event17['target']['closest']('.v2-material-folder-name-input');
        if (el80) {
          if (el80['dataset']['submitted'] === '1') return;
          ((el80['dataset']['submitted'] = '1'),
            void this['_commitRenameMaterialCategory'](el80['dataset']['category'], el80['value']));
          return;
        }
        const el81 = event17['target']['closest']('.v2-material-name-input');
        if (!el81 || el81['dataset']['submitted'] === '1') return;
        ((el81['dataset']['submitted'] = '1'),
          void this['_commitRenameAsset'](el81['dataset']['assetId'], el81['value']));
      }),
      this['sidebarPanel']['addEventListener']('pointerover', (event18) => {
        const enabled57 = event18['target']['closest']('[data-material-preview]');
        if (!enabled57 || enabled57['contains'](event18['relatedTarget'])) return;
        this['_showMaterialPreview'](enabled57);
      }),
      this['sidebarPanel']['addEventListener']('pointerout', (event19) => {
        const enabled58 = event19['target']['closest']('[data-material-preview]');
        if (!enabled58 || enabled58['contains'](event19['relatedTarget'])) return;
        this['_hideMaterialPreview']();
      }),
      this['sidebarPanel']['addEventListener']('dragstart', (event20) => {
        const itemIndex = event20['target']['closest']('[data-material-drag]'),
          assetId3 = String(itemIndex?.['dataset']?.['assetId'] || '');
        if (!itemIndex || !assetId3 || !event20['dataTransfer']) {
          event20['preventDefault']();
          return;
        }
        const value276 = {
          assetId: assetId3,
          itemIndex:
            itemIndex['dataset']['itemIndex'] === undefined
              ? null
              : Number(itemIndex['dataset']['itemIndex']),
        };
        (event20['dataTransfer']['setData'](
          'application/x-aicanvas-material',
          JSON['stringify'](value276),
        ),
          (event20['dataTransfer']['effectAllowed'] = 'copy'),
          itemIndex['classList']['add']('is-dragging'),
          this['_hideMaterialPreview'](),
          this['_closeMaterialMenu']());
      }),
      this['sidebarPanel']['addEventListener']('dragend', (event21) => {
        event21['target']['closest']('[data-material-drag]')?.['classList']['remove']('is-dragging');
      }),
      this['_installMaterialDropTarget']());
    const button = document['getElementById']('btnAssets');
    if (button) {
      let enabled59 = ![];
      const open = () => {
        !this['sidebarPanel']['classList']['contains']('show') && this['showSidebarPanel']();
        if (!enabled59) {
          enabled59 = !![];
          const value277 =
            this['_materialLoadingCount'] > 0 ? this['_assetLoadPromise'] : this['loadAssetsFromServer']();
          ((this['_assetLoadPromise'] = Promise['resolve'](value277)),
            this['_assetLoadPromise']['finally'](() => {
              enabled59 = ![];
            }));
        }
      };
      registerSidebarSubmenu({
        key: 'assets',
        button: button,
        panel: this['sidebarPanel'],
        open: open,
        close: () => this['hideSidebarPanel'](),
        isOpen: () => this['sidebarPanel']['classList']['contains']('show'),
        ignorePointerDown: (event22) =>
          this['_materialMenuEl']?.['contains']?.(event22['target']) === !![],
      });
    }
  }
  ['showSidebarPanel']() {
    (this['_expandedMaterialCategories']['clear'](),
      this['_expandedMaterialAssets']['clear'](),
      (this['_pendingMaterialFolderDeleteKey'] = ''),
      (this['_deletingMaterialFolderKey'] = ''),
      this['sidebarPanel']['classList']['add']('show'),
      this['renderSidebarContent'](),
      this['_warmVisibleAssetMedia']());
  }
  ['hideSidebarPanel']() {
    (this['_materialContextMenuController']['close'](),
      this['_closeMaterialMenu'](),
      this['_hideMaterialPreview'](),
      this['sidebarPanel']['classList']['remove']('show'));
    const el82 = document['getElementById']('btnAssets');
    (el82?.['classList']['remove']('active'), el82?.['setAttribute']('aria-expanded', 'false'));
  }
  ['_installMaterialDropTarget']() {
    if (this['_materialDropTarget']) return;
    const el83 = document['getElementById']('v2-wrap');
    if (!el83) return;
    this['_materialDropTarget'] = el83;
    const run4 = (value278) =>
      Array['from'](value278['dataTransfer']?.['types'] || [])['includes'](
        'application/x-aicanvas-material',
      );
    (el83['addEventListener']('dragover', (event23) => {
      if (!run4(event23)) return;
      if (
        event23['target']['closest']('.v2-asset-sidebar-panel') ||
        event23['target']['closest']('.v2-material-context-menu')
      )
        return;
      (event23['preventDefault'](), (event23['dataTransfer']['dropEffect'] = 'copy'));
    }),
      el83['addEventListener']('drop', (event24) => {
        const enabled60 = event24['dataTransfer']?.['getData']('application/x-aicanvas-material');
        if (!enabled60 || event24['target']['closest']('.v2-asset-sidebar-panel')) return;
        event24['preventDefault']();
        let value279 = null;
        try {
          value279 = JSON['parse'](enabled60);
        } catch (value280) {
          return;
        }
        const enabled61 = String(value279?.['assetId'] || '');
        if (!enabled61) return;
        const world = screenToWorld(
          event24['clientX'],
          event24['clientY'],
          appStore['getState']()['viewport'],
        );
        Number['isFinite'](value279?.['itemIndex'])
          ? this['_restoreAssetSubItem'](enabled61, value279['itemIndex'], world)
          : this['restoreAssetToCanvas'](enabled61, world);
      }));
  }
  ['_getMaterialAsset'](value281) {
    const value282 = String(value281 || '');
    return (this['assets'] || [])['find']((value283) => String(value283?.['id'] || '') === value282);
  }
  ['_materialMenuIcon'](value284) {
    const value285 = {
      favorite:
        '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      rename:
        '<path d="m4 16-.8 4 4-.8L18.4 8 15.9 5.6 4 16Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m13.8 7.7 2.5 2.5" stroke="currentColor" stroke-width="1.7"/>',
      move: '<path d="M3.5 7.5h6l2-2h9v13h-17v-11Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
      duplicate:
        '<rect x="7" y="7" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.7"/>',
      download:
        '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
      cancel:
        '<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      delete:
        '<path d="M4 7h16M9 3h6l1 2H8l1-2Zm-3 4 1 14h10l1-14M10 11v6m4-6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    };
    return (
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' + (value285[value284] || '') + '</svg>'
    );
  }
  ['_materialMenuButton'](value286, value287, value288, value289 = '', value290 = '') {
    const value291 = String(value290 || '')['trim'](),
      value292 = value291 ? getShortcutLabel(value291) : '',
      value293 = value291 ? ' data-shortcut-action="' + _escapeHtml(value291) + '"' : '',
      value294 = value292 ? '<span class="v2-menu-kbd">' + _escapeHtml(value292) + '</span>' : '';
    return (
      '<button type="button" role="menuitem" data-material-menu-action="' +
      value286 +
      '"' +
      value293 +
      ' ' +
      value289 +
      '>\n      ' +
      this['_materialMenuIcon'](value287) +
      '\n      <span>' +
      _escapeHtml(value288) +
      '</span>\n      ' +
      value294 +
      '\n    </button>'
    );
  }
  ['_openMaterialMenu'](value295, anchorEl) {
    const enabled62 = this['_getMaterialAsset'](value295);
    if (!enabled62 || !anchorEl) return;
    (this['_hideMaterialPreview'](),
      this['_closeMaterialMenu'](),
      (this['_materialMenuState'] = {
        assetId: String(value295),
        anchorEl: anchorEl,
        showMove: ![],
        confirmDelete: ![],
        busy: ![],
      }));
    const el84 = document['createElement']('div');
    ((el84['className'] = 'v2-material-context-menu'),
      el84['setAttribute']('role', 'menu'),
      el84['setAttribute']('aria-label', assetManagerText('menu.aria')),
      el84['addEventListener']('click', (event25) => {
        const el85 = event25['target']['closest']('[data-material-menu-action]'),
          enabled63 = String(el85?.['dataset']?.['materialMenuAction'] || '');
        if (!enabled63 || this['_materialMenuState']?.['busy']) return;
        (event25['preventDefault'](),
          event25['stopPropagation'](),
          this['_handleMaterialMenuAction'](enabled63, el85));
      }),
      document['body']['appendChild'](el84),
      (this['_materialMenuEl'] = el84),
      this['_renderMaterialMenu'](),
      (this['_materialMenuOutsideHandler'] = (event26) => {
        if (
          this['_materialMenuEl']?.['contains'](event26['target']) ||
          this['_materialMenuState']?.['anchorEl']?.['contains']?.(event26['target'])
        )
          return;
        this['_closeMaterialMenu']();
      }),
      (this['_materialMenuKeydownHandler'] = (event27) => {
        const list24 = Array['from'](
            this['_materialMenuEl']?.['querySelectorAll']?.('[data-shortcut-action]') || [],
          ),
          shortcutActionForEvent = resolveShortcutActionForEvent(
            event27,
            list24['map']((el86) => el86['dataset']['shortcutAction']),
          );
        if (shortcutActionForEvent && event27['repeat'] !== !![]) {
          const el87 = list24['find'](
              (el88) => el88['dataset']['shortcutAction'] === shortcutActionForEvent,
            ),
            value296 = String(el87?.['dataset']?.['materialMenuAction'] || '');
          if (value296) {
            (event27['preventDefault'](),
              event27['stopImmediatePropagation'](),
              this['_handleMaterialMenuAction'](value296, el87));
            return;
          }
        }
        if (event27['key'] !== 'Escape') return;
        (event27['preventDefault'](), event27['stopImmediatePropagation']());
        const el89 = this['_materialMenuState']?.['anchorEl'];
        (this['_closeMaterialMenu'](), el89?.['focus']?.({ preventScroll: !![] }));
      }),
      document['addEventListener']('pointerdown', this['_materialMenuOutsideHandler']),
      document['addEventListener']('keydown', this['_materialMenuKeydownHandler'], !![]));
  }
  ['_positionMaterialMenu']() {
    const el90 = this['_materialMenuEl'],
      el91 = this['_materialMenuState']?.['anchorEl'];
    if (!el90) return;
    if (!el91?.['isConnected']) {
      this['_closeMaterialMenu']();
      return;
    }
    const box5 = el91['getBoundingClientRect'](),
      box6 = el90['getBoundingClientRect'](),
      value297 = document['documentElement']?.['clientWidth'] || window['innerWidth'] || 0,
      value298 = document['documentElement']?.['clientHeight'] || window['innerHeight'] || 0,
      value299 = 8;
    let value300 = box5['right'] + value299;
    value300 + box6['width'] > value297 - 12 &&
      (value300 = Math['max'](12, box5['left'] - box6['width'] - value299));
    const value301 = Math['max'](
      12,
      Math['min'](box5['top'] - 8, value298 - box6['height'] - 12),
    );
    ((el90['style']['left'] = Math['round'](value300) + 'px'),
      (el90['style']['top'] = Math['round'](value301) + 'px'));
  }
  ['_renderMaterialMenu']() {
    const el92 = this['_materialMenuEl'],
      enabled64 = this['_materialMenuState'],
      name11 = this['_getMaterialAsset'](enabled64?.['assetId']);
    if (!el92 || !enabled64 || !name11) {
      this['_closeMaterialMenu']();
      return;
    }
    if (enabled64['busy']) {
      ((el92['innerHTML'] =
        '<div class="v2-material-menu-pending" role="status"><span></span>' +
        _escapeHtml(assetManagerText('menu.processing')) +
        '</div>'),
        this['_positionMaterialMenu']());
      return;
    }
    if (enabled64['confirmDelete']) {
      ((el92['innerHTML'] =
        '\n        <div class="v2-material-menu-confirm">' +
        _escapeHtml(
          assetManagerText('menu.confirmDelete', {
            name: name11['name'] || assetManagerText('unnamedAsset'),
          }),
        ) +
        '</div>\n        <div class="v2-material-menu-confirm-actions">\n          ' +
        this['_materialMenuButton'](
          'delete-cancel',
          'cancel',
          assetManagerText('cancel'),
          '',
          'context-material-cancel-delete',
        ) +
        '\n          ' +
        this['_materialMenuButton'](
          'delete-confirm',
          'delete',
          assetManagerText('menu.delete'),
          'class="is-danger"',
          'context-material-confirm-delete',
        ) +
        '\n        </div>\n      '),
        this['_positionMaterialMenu']());
      return;
    }
    const value302 = this['_categoryKey'](name11['category']),
      list25 = (this['tabs'] || [])['filter'](
        (value303) => this['_categoryKey'](value303) !== value302,
      ),
      value304 = enabled64['showMove']
        ? '<div class="v2-material-move-submenu" role="menu" aria-label="' +
          _escapeHtml(assetManagerText('menu.moveTo')) +
          '">\n          ' +
          (list25['length']
            ? list25['map'](
                (value305) =>
                  '<button type="button" role="menuitem" data-material-menu-action="move-target" data-category="' +
                  _escapeHtml(value305) +
                  '">' +
                  this['_materialMenuIcon']('move') +
                  '<span>' +
                  _escapeHtml(this['_formatCategoryLabel'](value305)) +
                  '</span></button>',
              )['join']('')
            : '<div class="v2-material-menu-empty">' +
              _escapeHtml(assetManagerText('menu.noMoveTarget')) +
              '</div>') +
          '\n        </div>'
        : '';
    ((el92['innerHTML'] =
      '\n      ' +
      this['_materialMenuButton'](
        'favorite',
        'favorite',
        isMaterialAssetFavorite(name11)
          ? assetManagerText('menu.unfavorite')
          : assetManagerText('menu.favorite'),
        '',
        isMaterialAssetFavorite(name11) ? 'context-material-unfavorite' : 'context-material-favorite',
      ) +
      '\n      ' +
      this['_materialMenuButton'](
        'rename',
        'rename',
        assetManagerText('menu.rename'),
        '',
        'context-material-rename',
      ) +
      '\n      <div class="v2-material-menu-submenu-wrap">\n        ' +
      this['_materialMenuButton'](
        'move',
        'move',
        assetManagerText('menu.moveTo'),
        'aria-haspopup="menu" aria-expanded="' + (enabled64['showMove'] ? 'true' : 'false') + '"',
        'context-material-open-move-menu',
      ) +
      '\n        ' +
      value304 +
      '\n      </div>\n      ' +
      this['_materialMenuButton'](
        'duplicate',
        'duplicate',
        assetManagerText('menu.duplicate'),
        '',
        'context-material-duplicate',
      ) +
      '\n      ' +
      this['_materialMenuButton'](
        'download',
        'download',
        assetManagerText('menu.download'),
        '',
        'context-material-download',
      ) +
      '\n      <div class="v2-material-menu-separator"></div>\n      ' +
      this['_materialMenuButton'](
        'delete',
        'delete',
        assetManagerText('menu.delete'),
        'class="is-danger"',
        'context-material-delete',
      ) +
      '\n    '),
      this['_positionMaterialMenu']());
  }
  ['_closeMaterialMenu']() {
    (this['_materialMenuOutsideHandler'] &&
      (document['removeEventListener']('pointerdown', this['_materialMenuOutsideHandler']),
      (this['_materialMenuOutsideHandler'] = null)),
      this['_materialMenuKeydownHandler'] &&
        (document['removeEventListener']('keydown', this['_materialMenuKeydownHandler'], !![]),
        (this['_materialMenuKeydownHandler'] = null)),
      this['_materialMenuEl']?.['remove'](),
      (this['_materialMenuEl'] = null),
      (this['_materialMenuState'] = null));
  }
  async ['_runMaterialMenuTask'](handler7, value306, value307) {
    const enabled65 = this['_materialMenuState'];
    if (!enabled65 || enabled65['busy']) return;
    ((enabled65['busy'] = !![]), this['_renderMaterialMenu']());
    try {
      const value308 = await handler7();
      (this['_closeMaterialMenu'](),
        this['renderSidebarContent'](),
        value306 &&
          value308 !== ![] &&
          value308?.['canceled'] !== !![] &&
          window['showToast']?.(value306, 'success'));
    } catch (error11) {
      (this['_materialMenuState'] === enabled65 && ((enabled65['busy'] = ![]), this['_renderMaterialMenu']()),
        window['showToast']?.(
          error11?.['message'] || value307 || assetManagerText('menu.actionFailed'),
          'error',
        ));
    }
  }
  ['_handleMaterialMenuAction'](value309, el93) {
    const enabled66 = this['_materialMenuState'],
      enabled67 = String(enabled66?.['assetId'] || '');
    if (!enabled67) return;
    if (value309 === 'rename') {
      (this['_closeMaterialMenu'](), this['_beginRenameAsset'](enabled67));
      return;
    }
    if (value309 === 'move') {
      ((enabled66['showMove'] = !enabled66['showMove']), this['_renderMaterialMenu']());
      return;
    }
    if (value309 === 'delete') {
      ((enabled66['confirmDelete'] = !![]), this['_renderMaterialMenu']());
      return;
    }
    if (value309 === 'delete-cancel') {
      ((enabled66['confirmDelete'] = ![]), this['_renderMaterialMenu']());
      return;
    }
    if (value309 === 'favorite') {
      void this['_runMaterialMenuTask'](
        () => this['_toggleMaterialFavorite'](enabled67),
        assetManagerText('toasts.favoriteUpdated'),
        assetManagerText('menu.actionFailed'),
      );
      return;
    }
    if (value309 === 'move-target') {
      void this['_runMaterialMenuTask'](
        () => this['_moveMaterialAsset'](enabled67, el93?.['dataset']?.['category']),
        assetManagerText('toasts.moved'),
        assetManagerText('menu.actionFailed'),
      );
      return;
    }
    if (value309 === 'duplicate') {
      void this['_runMaterialMenuTask'](
        () => this['_duplicateMaterialAsset'](enabled67),
        assetManagerText('toasts.duplicated'),
        assetManagerText('menu.actionFailed'),
      );
      return;
    }
    if (value309 === 'download') {
      void this['_runMaterialMenuTask'](
        () => this['_downloadMaterialAsset'](enabled67),
        '',
        assetManagerText('menu.downloadFailed'),
      );
      return;
    }
    value309 === 'delete-confirm' &&
      void this['_runMaterialMenuTask'](
        () => this['_deleteAsset'](enabled67),
        assetManagerText('toasts.deleted'),
        assetManagerText('deleteFailed'),
      );
  }
  async ['_toggleMaterialFavorite'](value310) {
    const args18 = this['_getMaterialAsset'](value310);
    if (!args18) throw new Error(assetManagerText('menu.actionFailed'));
    const value311 = {
      ...args18,
      favorite: !isMaterialAssetFavorite(args18),
      updatedAt: Date['now'](),
    };
    return (
      delete value311['isFavorite'],
      await saveAssetToServer(value311),
      this['_upsertLocalAsset'](value311),
      value311
    );
  }
  async ['_moveMaterialAsset'](value312, value313) {
    const args19 = this['_getMaterialAsset'](value312),
      category14 = this['_findCategoryByName'](value313, this['tabs']);
    if (!args19 || !category14) throw new Error(assetManagerText('menu.actionFailed'));
    const value314 = { ...args19, category: category14, updatedAt: Date['now']() };
    return (
      await saveAssetToServer(value314),
      this['_upsertLocalAsset'](value314),
      this['_expandedMaterialCategories']['add'](this['_categoryKey'](category14)),
      value314
    );
  }
  async ['_duplicateMaterialAsset'](value315) {
    const value316 = this['_getMaterialAsset'](value315),
      materialDuplicate = buildMaterialDuplicate(value316, {
        id: generateId('asset'),
        now: Date['now'](),
        nameSuffix: assetManagerText('copySuffix'),
      });
    if (!materialDuplicate) throw new Error(assetManagerText('menu.actionFailed'));
    return (
      await saveAssetToServer(materialDuplicate),
      this['_upsertLocalAsset'](materialDuplicate),
      (this['_newAssetPulseId'] = materialDuplicate['id']),
      materialDuplicate
    );
  }
  async ['_downloadMaterialAsset'](value317) {
    const name12 = this['_getMaterialAsset'](value317),
      files = buildMaterialDownloadFiles(name12);
    if (!files['length']) throw new Error(assetManagerText('menu.noDownloadableMedia'));
    return await saveMediaFilesDownload({
      title: assetManagerText('menu.downloadTitle', {
        name: name12?.['name'] || assetManagerText('unnamedAsset'),
      }),
      files: files,
    });
  }
  ['_ensureMaterialPreview']() {
    if (this['_materialPreviewEl']?.['isConnected']) return this['_materialPreviewEl'];
    const el94 = document['createElement']('div');
    return (
      (el94['className'] = 'v2-material-hover-preview'),
      el94['setAttribute']('role', 'tooltip'),
      (el94['hidden'] = !![]),
      document['body']['appendChild'](el94),
      (this['_materialPreviewEl'] = el94),
      el94
    );
  }
  ['_showMaterialPreview'](el95) {
    if (!this['sidebarPanel']?.['classList']['contains']('show')) return;
    const error12 = this['_getMaterialAsset'](el95?.['dataset']?.['assetId']);
    if (!error12) return;
    this['_materialPreviewRow'] = el95;
    const value318 =
        el95['dataset']['itemIndex'] === undefined ? null : Number(el95['dataset']['itemIndex']),
      list26 = getMaterialAssetItems(error12)['map']((args20) => ({
        ...args20,
        thumbSrc: _resolveMaterialItemThumbSrc(args20),
        previewSrc: _resolveMaterialItemPreviewSrc(args20),
        previewAspectRatio: resolveAssetNodePreviewAspectRatio(args20?.['nodeData']),
      })),
      list27 = Number['isFinite'](value318)
        ? list26['slice'](value318, value318 + 1)
        : list26['slice'](0, 4),
      error13 = Number['isFinite'](value318) ? list26[value318] : null,
      value319 =
        error13?.['name'] ||
        error13?.['nodeData']?.['name'] ||
        error12['name'] ||
        assetManagerText('unnamedAsset'),
      el96 = this['_ensureMaterialPreview'](),
      value320 = list27['length'] === 1 ? list27[0] : null,
      value321 = value320?.['previewAspectRatio'] || 4 / 3;
    el96['classList']['toggle']('is-single', Boolean(value320));
    value320
      ? el96['style']['setProperty']('--material-preview-aspect', String(value321))
      : el96['style']['removeProperty']('--material-preview-aspect');
    el96['innerHTML'] =
      '\n      <div class="v2-material-preview-media"></div>\n      <div class="v2-material-preview-copy">\n        <strong>' +
      _escapeHtml(value319) +
      '</strong>\n      </div>\n    ';
    const value322 = el96['querySelector']('.v2-material-preview-media');
    if (!list27['length'])
      this['_setThumbContent'](value322, error12['coverUrl'], error12['coverType'] || 'other');
    else {
      if (value320) this['_setThumbContent'](value322, value320['previewSrc'], value320['type']);
      else {
        const el97 = document['createElement']('div');
        ((el97['className'] = 'v2-material-preview-grid has-' + Math['min'](4, list27['length'])),
          list27['forEach']((value323) => {
            const value324 = document['createElement']('div');
            ((value324['className'] = 'v2-material-preview-cell'),
              el97['appendChild'](value324),
              this['_setThumbContent'](value324, value323['thumbSrc'], value323['type']));
          }),
          value322['replaceChildren'](el97));
      }
    }
    el96['hidden'] = ![];
    const box7 = el95['getBoundingClientRect'](),
      box8 = this['sidebarPanel']['getBoundingClientRect'](),
      box9 = el96['getBoundingClientRect'](),
      value325 = document['documentElement']?.['clientWidth'] || window['innerWidth'] || 0,
      value326 = document['documentElement']?.['clientHeight'] || window['innerHeight'] || 0;
    let value327 = box8['right'] + 12;
    value327 + box9['width'] > value325 - 12 &&
      (value327 = Math['max'](12, box8['left'] - box9['width'] - 12));
    const value328 = Math['max'](
      12,
      Math['min'](box7['top'] - 8, value326 - box9['height'] - 12),
    );
    ((el96['style']['left'] = Math['round'](value327) + 'px'),
      (el96['style']['top'] = Math['round'](value328) + 'px'));
  }
  ['_hideMaterialPreview']() {
    this['_materialPreviewRow'] = null;
    if (this['_materialPreviewEl']) this['_materialPreviewEl']['hidden'] = !![];
  }
  ['_getVisibleAssetCardsInList']() {
    const listView = this['sidebarPanel']?.['querySelector'](
      '#asset-sidebar-content > .v2-asset-view-list',
    );
    if (!listView) return { listView: null, cards: [] };
    const cards = Array['from'](listView['querySelectorAll'](':scope > .v2-asset-item'))['filter'](
      (el98) => el98['style']['display'] !== 'none',
    );
    return { listView: listView, cards: cards };
  }
  ['_captureRectsById'](value329) {
    const map4 = new Map();
    for (const el99 of value329) {
      const enabled68 = String(el99['dataset']?.['id'] || '');
      if (!enabled68) continue;
      map4['set'](enabled68, el99['getBoundingClientRect']());
    }
    return map4;
  }
  ['_playFlip'](el100, map5) {
    if (!el100 || !map5?.['size']) return;
    const value330 = Array['from'](el100['querySelectorAll'](':scope > .v2-asset-item'))['filter'](
        (el101) => el101['style']['display'] !== 'none',
      ),
      map6 = new Map();
    for (const el102 of value330) {
      const enabled69 = String(el102['dataset']?.['id'] || '');
      if (!enabled69) continue;
      map6['set'](enabled69, el102['getBoundingClientRect']());
    }
    for (const el103 of value330) {
      const enabled70 = String(el103['dataset']?.['id'] || '');
      if (!enabled70) continue;
      const box10 = map5['get'](enabled70),
        box11 = map6['get'](enabled70);
      if (!box10 || !box11) continue;
      const enabled71 = box10['left'] - box11['left'],
        enabled72 = box10['top'] - box11['top'];
      if (!enabled71 && !enabled72) continue;
      el103['animate'](
        [
          { transform: 'translate(' + enabled71 + 'px, ' + enabled72 + 'px)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    }
  }
  ['_playDeleteShake'](el104) {
    if (!el104) return;
    (el104['classList']['remove']('is-delete-shaking'),
      void el104['offsetWidth'],
      el104['classList']['add']('is-delete-shaking'),
      window['setTimeout'](() => {
        if (el104['isConnected']) el104['classList']['remove']('is-delete-shaking');
      }, 240));
  }
  async ['_deleteAsset'](value331) {
    const enabled73 = String(value331 || '');
    if (!enabled73) return;
    const { listView: listView2, cards: cards2 } = this['_getVisibleAssetCardsInList'](),
      value332 = this['_captureRectsById'](cards2);
    try {
      const deleteAssetFromServer2 = await deleteAssetFromServer(enabled73);
      if (deleteAssetFromServer2 !== !![]) throw new Error(assetManagerText('deleteFailed'));
    } catch (value333) {
      return (window['showToast']?.(assetManagerText('deleteFailed'), 'error'), ![]);
    }
    ((this['assets'] = (this['assets'] || [])['filter'](
      (value334) => String(value334?.['id'] || '') !== enabled73,
    )),
      this['_syncTabsFromAssets'](),
      this['_renderSidebarTabs'](),
      removeAssetMentionAsset(enabled73));
    if (this['_openAssetId'] === enabled73) this['_openAssetId'] = null;
    const el105 = this['_assetCardPool']?.['get']?.(enabled73);
    if (el105?.['isConnected']) el105['remove']();
    return (
      this['_assetCardPool']?.['delete']?.(enabled73),
      this['renderSidebarContent'](),
      window['requestAnimationFrame'](() => {
        window['requestAnimationFrame'](() => {
          const { listView: listView3 } = this['_getVisibleAssetCardsInList']();
          this['_playFlip'](listView3, value332);
        });
      }),
      !![]
    );
  }
  async ['_deleteUserCategory'](value335) {
    const category15 = this['_normalizeCategoryName'](value335);
    if (!category15 || !this['_isUserCategory'](category15)) return ![];
    const list28 = this['_getSortedAssets']()['filter'](
        (value336) => this['_categoryKey'](value336?.['category']) === this['_categoryKey'](category15),
      ),
      list29 = [...this['userCategories']],
      parents4 = { ...this['materialCategoryParents'] },
      value337 = this['_getMaterialParentCategory'](category15),
      category16 = this['_findCategoryByName']('Others', this['tabs']) || 'Others',
      value338 = this['_normalizeUserCategories'](
        list29['filter'](
          (value339) => this['_categoryKey'](value339) !== this['_categoryKey'](category15),
        ),
      ),
      deleteMaterialFolderParent2 = deleteMaterialFolderParent({
        parents: parents4,
        category: category15,
        categoryKey: (value340) => this['_categoryKey'](value340),
      }),
      updatedAt2 = Date['now'](),
      list30 = list28['map']((args21, value341) => ({
        ...args21,
        category: category16,
        updatedAt: updatedAt2 + value341,
      })),
      list31 = [];
    let value342 = ![];
    try {
      for (let value343 = 0; value343 < list30['length']; value343 += 1) {
        (list31['push'](list28[value343]), await saveAssetToServer(list30[value343]));
      }
      return (
        (value342 = !![]),
        await this['_saveMaterialCategorySettings'](
          value338,
          this['materialCategoryDisplayNames'],
          deleteMaterialFolderParent2,
        ),
        (this['userCategories'] = value338),
        (this['materialCategoryParents'] = deleteMaterialFolderParent2),
        list30['forEach']((value344) => this['_upsertLocalAsset'](value344)),
        this['_categoryKey'](this['activeTab']) === this['_categoryKey'](category15) &&
          ((this['activeTab'] = DEFAULT_ASSET_CATEGORIES[0]), (this['_openAssetId'] = null)),
        this['_expandedMaterialCategories']['delete'](this['_categoryKey'](category15)),
        this['_categoryKey'](this['_materialCurrentFolderCategory']) === this['_categoryKey'](category15) &&
          (this['_materialCurrentFolderCategory'] = value337 || DEFAULT_ASSET_CATEGORIES[0]),
        this['_syncTabsFromAssets'](),
        this['_renderSidebarTabs'](),
        this['renderSidebarContent'](),
        window['showToast']?.(assetManagerText('categoryDeleted'), 'success'),
        !![]
      );
    } catch (value345) {
      const list32 = [];
      for (const value346 of list31['reverse']()) {
        try {
          await saveAssetToServer(value346);
        } catch (value347) {
          list32['push'](value347);
        }
      }
      if (value342)
        try {
          await this['_saveMaterialCategorySettings'](
            list29,
            this['materialCategoryDisplayNames'],
            parents4,
          );
        } catch (value348) {
          list32['push'](value348);
        }
      return (
        list32['length'] && console['error']('回滚素材文件夹删除失败', list32),
        console['error'](value345),
        window['showToast']?.(assetManagerText('categoryDeleteFailed'), 'error'),
        ![]
      );
    }
  }
  ['_setThumbContent'](el106, value349, value350) {
    if (!el106) return;
    const value351 = String(value349 || '');
    if (value351 && !this['_isNonImageMediaSrc'](value351)) {
      const value352 = el106['dataset']['thumbSrc'] || '';
      if (
        el106['dataset']['thumbKind'] === 'img' &&
        value352 === value351 &&
        el106['querySelector'](':scope > img')
      )
        return;
      const el107 = document['createElement']('img');
      ((el107['alt'] = assetManagerText('thumbnailAlt')),
        (el107['draggable'] = ![]),
        (el107['decoding'] = 'async'),
        (el107['loading'] = 'eager'),
        (el107['className'] = 'v2-asset-thumb-img'),
        el107['addEventListener'](
          'error',
          () => {
            if (el106['dataset']['thumbSrc'] !== value351) return;
            ((el106['dataset']['thumbKind'] = 'icon'),
              (el106['dataset']['thumbType'] = String(value350 || 'other')),
              (el106['dataset']['thumbSrc'] = ''),
              (el106['innerHTML'] = _renderAssetIcon(value350)));
          },
          { once: !![] },
        ),
        (el106['dataset']['thumbKind'] = 'img'),
        (el106['dataset']['thumbType'] = ''),
        (el106['dataset']['thumbSrc'] = value351),
        (el106['dataset']['pendingSrc'] = ''),
        el106['replaceChildren'](el107),
        (el107['src'] = value351),
        void this['_ensureThumbDecoded'](value351)['catch'](() => {}));
      return;
    }
    const value353 = String(value350 || 'other');
    if (el106['dataset']['thumbKind'] === 'icon' && el106['dataset']['thumbType'] === value353)
      return;
    ((el106['dataset']['thumbKind'] = 'icon'),
      (el106['dataset']['thumbType'] = value353),
      (el106['dataset']['thumbSrc'] = ''),
      (el106['dataset']['pendingSrc'] = ''),
      (el106['innerHTML'] = _renderAssetIcon(value353)));
  }
  ['_createMaterialMenuButton'](name13, value354) {
    const el108 = document['createElement']('button');
    return (
      (el108['type'] = 'button'),
      (el108['className'] = 'v2-material-more'),
      (el108['dataset']['uiAction'] = 'material-menu-open'),
      (el108['dataset']['assetId'] = value354),
      el108['setAttribute'](
        'aria-label',
        assetManagerText('menu.open', { name: name13['name'] || assetManagerText('unnamedAsset') }),
      ),
      el108['setAttribute']('aria-haspopup', 'menu'),
      (el108['innerHTML'] =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>'),
      el108
    );
  }
  ['_createMaterialItemGroup'](value355, value356, list33) {
    const el109 = document['createElement']('div');
    return (
      (el109['className'] = 'v2-material-asset-children'),
      (el109['dataset']['assetId'] = value356),
      el109['setAttribute']('role', 'group'),
      list33['forEach']((error14, index2) => {
        const value357 = this['_materialItemKey'](value356, index2),
          enabled74 = this['_renamingMaterialItemKey'] === value357,
          value358 = this['_savingMaterialItemKey'] === value357,
          el110 = document['createElement']('div');
        ((el110['className'] = 'v2-material-item-row'),
          el110['classList']['toggle']('is-renaming', enabled74),
          el110['classList']['toggle']('is-saving', value358),
          (el110['dataset']['materialUse'] = ''),
          (el110['dataset']['assetId'] = value356),
          (el110['dataset']['itemIndex'] = String(index2)),
          (el110['dataset']['materialDrag'] = ''),
          (el110['dataset']['materialPreview'] = ''),
          (el110['draggable'] = !enabled74),
          el110['setAttribute']('role', 'treeitem'));
        const name14 =
          error14?.['name'] ||
          error14?.['nodeData']?.['name'] ||
          assetManagerText('detail.childAssetName', { index: index2 + 1 });
        el110['setAttribute']('aria-label', assetManagerText('doubleClickMaterial', { name: name14 }));
        const value359 = document['createElement']('span');
        ((value359['className'] = 'v2-material-row-thumb is-child'),
          this['_setThumbContent'](
            value359,
            _resolveMaterialItemThumbSrc(error14),
            error14?.['type'] || 'other',
          ),
          el110['appendChild'](value359));
        if (enabled74) {
          const el111 = document['createElement']('input');
          ((el111['type'] = 'text'),
            (el111['className'] = 'v2-material-item-name-input'),
            (el111['dataset']['assetId'] = value356),
            (el111['dataset']['itemIndex'] = String(index2)),
            (el111['dataset']['itemKey'] = value357),
            (el111['value'] = name14),
            (el111['disabled'] = value358),
            el111['setAttribute'](
              'aria-label',
              assetManagerText('renameMaterialAria', { name: name14 }),
            ));
          if (value358) el111['setAttribute']('aria-busy', 'true');
          el110['appendChild'](el111);
        } else {
          const el112 = document['createElement']('button');
          ((el112['type'] = 'button'),
            (el112['className'] = 'v2-material-item-name is-renameable'),
            (el112['dataset']['uiAction'] = 'material-item-rename'),
            (el112['dataset']['assetId'] = value356),
            (el112['dataset']['itemIndex'] = String(index2)),
            (el112['textContent'] = name14),
            el112['setAttribute'](
              'aria-label',
              assetManagerText('renameMaterialAria', { name: name14 }),
            ),
            el110['appendChild'](el112));
        }
        el109['appendChild'](el110);
      }),
      el109
    );
  }
  ['_toggleMaterialFolderDisclosure'](el113) {
    if (this['_materialSearchQuery'] || this['_materialFavoritesOnly']) return;
    const enabled75 = this['_categoryKey'](el113?.['dataset']?.['category']),
      el114 = el113?.['closest']?.('.v2-material-folder'),
      el115 = el114?.['querySelector']?.(':scope > .v2-material-folder-content');
    if (!enabled75 || !el114 || !el115) return;
    this['_materialCurrentFolderCategory'] =
      this['_findCategoryByName'](el113?.['dataset']?.['category'], this['tabs']) || this['activeTab'];
    const enabled76 = el114['getAttribute']('aria-expanded') !== 'true';
    (enabled76
      ? this['_expandedMaterialCategories']['add'](enabled75)
      : (this['_expandedMaterialCategories']['delete'](enabled75),
        this['_hideMaterialPreview'](),
        this['_closeMaterialMenu']()),
      el114['setAttribute']('aria-expanded', enabled76 ? 'true' : 'false'),
      el113['setAttribute']('aria-expanded', enabled76 ? 'true' : 'false'),
      el113['setAttribute'](
        'aria-label',
        assetManagerText(enabled76 ? 'collapseFolder' : 'expandFolder', {
          name: this['_formatCategoryLabel'](el113?.['dataset']?.['category']),
        }),
      ),
      el113['querySelector']('.v2-material-tree-chevron')?.['classList']['toggle']('is-open', enabled76),
      (el115['hidden'] = !enabled76));
  }
  ['_cancelPendingMaterialAssetRowToggle']() {
    (this['_materialAssetRowClickTimer'] && window['clearTimeout'](this['_materialAssetRowClickTimer']),
      (this['_materialAssetRowClickTimer'] = 0),
      (this['_materialAssetRowClickToggle'] = null));
  }
  ['_scheduleMaterialAssetRowToggle'](el116) {
    this['_cancelPendingMaterialAssetRowToggle']();
    if (!el116 || el116['disabled']) return;
    ((this['_materialAssetRowClickToggle'] = el116),
      (this['_materialAssetRowClickTimer'] = window['setTimeout'](() => {
        const el117 = this['_materialAssetRowClickToggle'];
        ((this['_materialAssetRowClickTimer'] = 0),
          (this['_materialAssetRowClickToggle'] = null),
          el117?.['isConnected'] &&
            !el117['disabled'] &&
            this['_toggleMaterialAssetDisclosure'](el117));
      }, 260)));
  }
  ['_toggleMaterialAssetDisclosure'](el118) {
    if (this['_materialSearchQuery'] || this['_materialFavoritesOnly']) return;
    const enabled77 = String(el118?.['dataset']?.['assetId'] || ''),
      name15 = this['_getMaterialAsset'](enabled77),
      list34 = getMaterialAssetItems(name15);
    if (!enabled77 || !name15 || list34['length'] < 1) return;
    const el119 = el118['closest']('.v2-material-project-folder'),
      enabled78 = el118['closest']('.v2-material-project-row, .v2-material-asset-row'),
      el120 = el119 || enabled78;
    if (!enabled78 || !el120) return;
    const enabled79 = el120['getAttribute']('aria-expanded') !== 'true';
    enabled79
      ? this['_expandedMaterialAssets']['add'](enabled77)
      : (this['_expandedMaterialAssets']['delete'](enabled77),
        this['_hideMaterialPreview'](),
        this['_closeMaterialMenu']());
    (el120['setAttribute']('aria-expanded', enabled79 ? 'true' : 'false'),
      el118['setAttribute']('aria-expanded', enabled79 ? 'true' : 'false'),
      el118['setAttribute'](
        'aria-label',
        assetManagerText(enabled79 ? 'collapseMaterial' : 'expandMaterial', {
          name: name15['name'] || assetManagerText('unnamedAsset'),
        }),
      ),
      el118['querySelector']('.v2-material-tree-chevron, svg')?.['classList']['toggle'](
        'is-open',
        enabled79,
      ));
    let el121 = el119
      ? el119['querySelector'](
          ':scope > .v2-material-asset-children[data-asset-id="' +
            CSS['escape'](enabled77) +
            '"]',
        )
      : enabled78['nextElementSibling']?.['matches']?.(
            '.v2-material-asset-children[data-asset-id="' + CSS['escape'](enabled77) + '"]',
          )
        ? enabled78['nextElementSibling']
        : null;
    enabled79 &&
      !el121 &&
      ((el121 = this['_createMaterialItemGroup'](name15, enabled77, list34)),
      el119
        ? el119['appendChild'](el121)
        : enabled78['insertAdjacentElement']('afterend', el121));
    if (el121) el121['hidden'] = !enabled79;
  }
  ['_renderReplacementStudioProjectFolder'](
    name16,
    el122,
    { forceExpanded: forceExpanded = ![] } = {},
  ) {
    const enabled80 = String(name16?.['id'] || '');
    if (!enabled80) return;
    const list35 = getMaterialAssetItems(name16),
      value360 = forceExpanded || this['_expandedMaterialAssets']['has'](enabled80),
      el123 = document['createElement']('div');
    ((el123['className'] = 'v2-material-project-folder'),
      (el123['dataset']['assetId'] = enabled80),
      el123['setAttribute']('role', 'treeitem'),
      el123['setAttribute']('aria-expanded', value360 ? 'true' : 'false'));
    this['_newAssetPulseId'] === enabled80 && el123['classList']['add']('is-new');
    const el124 = document['createElement']('div');
    el124['className'] = 'v2-material-project-row';
    const el125 = document['createElement']('button');
    ((el125['type'] = 'button'),
      (el125['className'] = 'v2-material-project-toggle'),
      (el125['dataset']['uiAction'] = 'material-asset-toggle'),
      (el125['dataset']['assetId'] = enabled80),
      el125['setAttribute']('aria-expanded', value360 ? 'true' : 'false'),
      el125['setAttribute'](
        'aria-label',
        assetManagerText(value360 ? 'collapseMaterial' : 'expandMaterial', {
          name: name16['name'] || assetManagerText('unnamedAsset'),
        }),
      ));
    const el126 = document['createElement']('span');
    ((el126['className'] = 'v2-material-tree-chevron' + (value360 ? ' is-open' : '')),
      el126['setAttribute']('aria-hidden', 'true'),
      (el126['innerHTML'] = MATERIAL_TREE_CHEVRON_ICON_SVG));
    const el127 = document['createElement']('span');
    ((el127['className'] = 'v2-material-project-icon'),
      el127['setAttribute']('aria-hidden', 'true'),
      (el127['innerHTML'] = MATERIAL_FOLDER_ICON_MARKUP),
      el125['append'](el126, el127),
      el124['appendChild'](el125));
    if (this['_renamingAssetId'] === enabled80) {
      el124['classList']['add']('is-renaming');
      const el128 = document['createElement']('input');
      ((el128['type'] = 'text'),
        (el128['className'] = 'v2-material-name-input'),
        (el128['dataset']['assetId'] = enabled80),
        (el128['value'] = String(name16['name'] || '')),
        el128['setAttribute']('aria-label', assetManagerText('createPanel.assetName')),
        el124['appendChild'](el128));
    } else {
      const el129 = document['createElement']('button');
      ((el129['type'] = 'button'),
        (el129['className'] = 'v2-material-project-name is-renameable'),
        (el129['dataset']['uiAction'] = 'material-rename'),
        (el129['dataset']['assetId'] = enabled80),
        (el129['textContent'] = name16['name'] || assetManagerText('unnamedAsset')),
        el129['setAttribute'](
          'aria-label',
          assetManagerText('renameMaterialAria', {
            name: name16['name'] || assetManagerText('unnamedAsset'),
          }),
        ));
      if (isMaterialAssetFavorite(name16)) {
        const el130 = document['createElement']('span');
        ((el130['className'] = 'v2-material-favorite-indicator'),
          (el130['textContent'] = '★'),
          el130['setAttribute']('aria-label', assetManagerText('favorites')),
          el129['appendChild'](el130));
      }
      el124['appendChild'](el129);
    }
    const el131 = document['createElement']('span');
    ((el131['className'] = 'v2-material-project-count'),
      (el131['textContent'] = String(list35['length'])),
      el124['append'](el131, this['_createMaterialMenuButton'](name16, enabled80)),
      el123['appendChild'](el124),
      value360 &&
        el123['appendChild'](this['_createMaterialItemGroup'](name16, enabled80, list35)),
      el122['appendChild'](el123));
  }
  ['renderSidebarContent']() {
    this['_materialContextMenuController']['close']();
    const el132 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-content'),
      el133 = el132?.['querySelector']('.v2-material-library-tree');
    if (!el132 || !el133) return;
    const value361 = el132['scrollTop'],
      el134 = this['sidebarPanel']['querySelector']('[data-material-search]');
    el134 &&
      el134['value'] !== this['_materialSearchQuery'] &&
      (el134['value'] = this['_materialSearchQuery']);
    const el135 = this['sidebarPanel']['querySelector']("[data-ui-action='material-favorites-toggle']");
    (el135?.['classList']['toggle']('is-active', this['_materialFavoritesOnly']),
      el135?.['setAttribute']('aria-pressed', this['_materialFavoritesOnly'] ? 'true' : 'false'));
    const assets3 = this['_getSortedAssets'](),
      groups2 = getMaterialLibraryGroups({
        assets: assets3,
        categories: this['tabs'],
        query: this['_materialSearchQuery'],
        favoritesOnly: this['_materialFavoritesOnly'],
        categoryKey: (value362) => this['_categoryKey'](value362),
      }),
      count18 = getMaterialFolderAssetCounts({
        groups: groups2,
        parents: this['materialCategoryParents'],
        categoryKey: (value363) => this['_categoryKey'](value363),
      }),
      value364 = this['_materialMenuState']?.['anchorEl'];
    value364 && el133['contains'](value364) && this['_closeMaterialMenu']();
    this['_materialPreviewRow'] &&
      el133['contains'](this['_materialPreviewRow']) &&
      this['_hideMaterialPreview']();
    el133['replaceChildren']();
    if (!groups2['length']) {
      const el136 = document['createElement']('div');
      ((el136['className'] = 'v2-material-library-empty'),
        (el136['innerHTML'] =
          '<strong>' +
          _escapeHtml(
            this['_materialFavoritesOnly']
              ? assetManagerText('emptyFavorites')
              : this['_materialSearchQuery']
                ? assetManagerText('emptySearch')
                : assetManagerText('emptyLibrary'),
          ) +
          '</strong>'),
        el133['appendChild'](el136),
        (el132['scrollTop'] = 0));
      return;
    }
    for (const category17 of groups2) {
      const value365 = this['_categoryKey'](category17['category']),
        canManageFolder3 = this['_isUserCategory'](category17['category']),
        isRenamingFolder3 = canManageFolder3 && this['_renamingMaterialCategoryKey'] === value365,
        isSavingFolder2 = isRenamingFolder3 && this['_savingMaterialCategoryKey'] === value365,
        isDeleteConfirming2 =
          canManageFolder3 &&
          (this['_pendingMaterialFolderDeleteKey'] === value365 ||
            this['_deletingMaterialFolderKey'] === value365),
        isDeletingFolder3 = canManageFolder3 && this['_deletingMaterialFolderKey'] === value365,
        forceExpanded2 = Boolean(this['_materialSearchQuery'] || this['_materialFavoritesOnly']),
        enabled81 = !forceExpanded2 && !this['_expandedMaterialCategories']['has'](value365),
        { section: section3, folderContent: folderContent3 } = this['_createMaterialFolderSection']({
          category: category17['category'],
          count:
            count18['get'](this['_categoryKey'](category17['category'])) ?? category17['assets']['length'],
          expanded: !enabled81,
          canManageFolder: canManageFolder3,
          isRenamingFolder: isRenamingFolder3,
          isSavingFolder: isSavingFolder2,
          isDeleteConfirming: isDeleteConfirming2,
          isDeletingFolder: isDeletingFolder3,
          isDeleteRequested: this['_pendingMaterialFolderDeleteKey'] === value365,
          actionPrefix: 'material-folder',
        });
      if (!category17['assets']['length']) {
        const el137 = document['createElement']('div');
        ((el137['className'] = 'v2-material-folder-empty'),
          (el137['textContent'] = assetManagerText('emptyFolder')),
          folderContent3['appendChild'](el137));
      }
      for (const name17 of category17['assets']) {
        if (
          this['_categoryKey'](category17['category']) === this['_categoryKey'](REPLACEMENT_STUDIO_CATEGORY)
        ) {
          this['_renderReplacementStudioProjectFolder'](name17, folderContent3, { forceExpanded: forceExpanded2 });
          continue;
        }
        const enabled82 = String(name17?.['id'] || '');
        if (!enabled82) continue;
        const list36 = getMaterialAssetItems(name17),
          enabled83 = list36['length'] > 1,
          value366 = enabled83 && this['_expandedMaterialAssets']['has'](enabled82),
          el138 = document['createElement']('div');
        ((el138['className'] = 'v2-material-asset-row'),
          (el138['dataset']['assetId'] = enabled82),
          (el138['dataset']['materialPreview'] = ''),
          el138['setAttribute']('role', 'treeitem'));
        enabled83 && el138['setAttribute']('aria-expanded', value366 ? 'true' : 'false');
        this['_newAssetPulseId'] === enabled82 && el138['classList']['add']('is-new');
        const el139 = document['createElement']('button');
        ((el139['type'] = 'button'),
          (el139['className'] = 'v2-material-asset-toggle'),
          (el139['dataset']['uiAction'] = 'material-asset-toggle'),
          (el139['dataset']['assetId'] = enabled82),
          (el139['disabled'] = !enabled83));
        enabled83 && el139['setAttribute']('aria-expanded', value366 ? 'true' : 'false');
        (el139['setAttribute'](
          'aria-label',
          enabled83
            ? assetManagerText(value366 ? 'collapseMaterial' : 'expandMaterial', {
                name: name17['name'] || assetManagerText('unnamedAsset'),
              })
            : '',
        ),
          (el139['innerHTML'] = enabled83
            ? '<svg class="' +
              (value366 ? 'is-open' : '') +
              '" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : ''),
          el138['appendChild'](el139));
        const el140 = document['createElement']('div');
        ((el140['className'] = 'v2-material-asset-use'),
          (el140['dataset']['materialUse'] = ''),
          (el140['dataset']['assetId'] = enabled82),
          (el140['dataset']['materialDrag'] = ''),
          (el140['draggable'] = this['_renamingAssetId'] !== enabled82),
          el140['setAttribute'](
            'aria-label',
            assetManagerText('doubleClickMaterial', {
              name: name17['name'] || assetManagerText('unnamedAsset'),
            }),
          ));
        const value367 = document['createElement']('span');
        value367['className'] = 'v2-material-row-thumb';
        const value368 = list36[0],
          _resolveMaterialItemThumbSrc3 = _resolveMaterialItemThumbSrc(value368) || name17['coverUrl'];
        (this['_setThumbContent'](
          value367,
          _resolveMaterialItemThumbSrc3,
          value368?.['type'] || name17['coverType'] || 'other',
        ),
          el140['appendChild'](value367));
        if (this['_renamingAssetId'] === enabled82) {
          el138['classList']['add']('is-renaming');
          const el141 = document['createElement']('input');
          ((el141['type'] = 'text'),
            (el141['className'] = 'v2-material-name-input'),
            (el141['dataset']['assetId'] = enabled82),
            (el141['value'] = String(name17['name'] || '')),
            el141['setAttribute']('aria-label', assetManagerText('createPanel.assetName')),
            el140['appendChild'](el141),
            el138['appendChild'](el140));
        } else {
          const el142 = document['createElement']('button');
          ((el142['type'] = 'button'),
            (el142['className'] = 'v2-material-asset-name is-renameable'),
            (el142['dataset']['uiAction'] = 'material-rename'),
            (el142['dataset']['assetId'] = enabled82),
            (el142['textContent'] = name17['name'] || assetManagerText('unnamedAsset')),
            el142['setAttribute'](
              'aria-label',
              assetManagerText('renameMaterialAria', {
                name: name17['name'] || assetManagerText('unnamedAsset'),
              }),
            ),
            el140['appendChild'](el142));
          if (isMaterialAssetFavorite(name17)) {
            const el143 = document['createElement']('span');
            ((el143['className'] = 'v2-material-favorite-indicator'),
              (el143['textContent'] = '★'),
              el143['setAttribute']('aria-label', assetManagerText('favorites')),
              el140['appendChild'](el143));
          }
          el138['appendChild'](el140);
        }
        const value369 = this['_createMaterialMenuButton'](name17, enabled82);
        (el138['appendChild'](value369),
          folderContent3['appendChild'](el138),
          value366 &&
            folderContent3['appendChild'](this['_createMaterialItemGroup'](name17, enabled82, list36)));
      }
      el133['appendChild'](section3);
    }
    (this['_nestMaterialFolderSections'](el133), (el132['scrollTop'] = value361));
    if (this['_newAssetPulseId']) {
      const value370 = this['_newAssetPulseId'];
      ((this['_newAssetPulseId'] = ''),
        window['setTimeout'](() => {
          el133['querySelector']('[data-asset-id="' + CSS['escape'](value370) + '"]')?.['classList'][
            'remove'
          ]('is-new');
        }, 650));
    }
    if (this['_renamingAssetId'])
      window['requestAnimationFrame'](() => {
        const el144 = el133['querySelector']('.v2-material-name-input');
        (el144?.['focus'](), el144?.['select']?.());
      });
    else
      this['_renamingMaterialItemKey'] &&
        window['requestAnimationFrame'](() => {
          const el145 = el133['querySelector'](
            '.v2-material-item-name-input[data-item-key="' +
              CSS['escape'](this['_renamingMaterialItemKey']) +
              '"]',
          );
          (el145?.['focus'](), el145?.['select']?.());
        });
  }
  ['_renderLegacySidebarContent']() {
    const el146 = this['sidebarPanel']?.['querySelector']('#asset-sidebar-content');
    if (!el146) return;
    const el147 = this['sidebarPanel']['querySelector']('#asset-sidebar-title-text'),
      el148 = this['sidebarPanel']['querySelector']('.v2-asset-back');
    this['_renderSidebarTabs']();
    const run5 = () => {
        let listView4 = el146['querySelector'](':scope > .v2-asset-view-list');
        !listView4 &&
          ((listView4 = document['createElement']('div')),
          (listView4['className'] = 'v2-asset-view-list'),
          el146['appendChild'](listView4));
        let detailView = el146['querySelector'](':scope > .v2-asset-view-detail');
        return (
          !detailView &&
            ((detailView = document['createElement']('div')),
            (detailView['className'] = 'v2-asset-view-detail'),
            el146['appendChild'](detailView)),
          el146['querySelectorAll'](':scope > .v2-asset-item, :scope > .v2-asset-empty')['forEach'](
            (value371) => listView4['appendChild'](value371),
          ),
          el146['querySelectorAll'](':scope > .v2-asset-detail-actions, :scope > .v2-asset-subgrid')[
            'forEach'
          ]((value372) => detailView['appendChild'](value372)),
          { listView: listView4, detailView: detailView }
        );
      },
      { listView: listView5, detailView: detailView2 } = run5(),
      handler8 = (value373, value374, value375) =>
        this['_setThumbContent'](value373, value374, value375),
      handler9 = (el149) => {
        let el150 = el149['querySelector'](':scope > .v2-asset-cover-grid');
        if (!el150) {
          ((el150 = document['createElement']('div')), (el150['className'] = 'v2-asset-cover-grid'));
          for (let count19 = 0; count19 < 4; count19++) {
            const value376 = document['createElement']('div');
            ((value376['className'] = 'v2-asset-cover-cell'), el150['appendChild'](value376));
          }
          el149['replaceChildren'](el150);
        } else {
          const list37 = el150['querySelectorAll'](':scope > .v2-asset-cover-cell');
          for (let count20 = list37['length']; count20 < 4; count20++) {
            const value377 = document['createElement']('div');
            ((value377['className'] = 'v2-asset-cover-cell'), el150['appendChild'](value377));
          }
        }
        return el150;
      },
      handler10 = (el151, error15) => {
        let el152 = el151['querySelector'](':scope > .v2-asset-item-load'),
          el153 = el151['querySelector'](':scope > .v2-asset-item-delete'),
          el154 = el151['querySelector'](':scope > .v2-asset-item-delete-confirm'),
          enabled84 = el151['querySelector'](':scope > .v2-asset-item-cover'),
          el155 = el151['querySelector'](':scope > .v2-asset-item-name');
        !el152 &&
          ((el152 = document['createElement']('button')),
          (el152['type'] = 'button'),
          (el152['className'] = 'v2-asset-item-load'),
          (el152['dataset']['uiAction'] = 'asset-add-all'),
          el152['setAttribute']('aria-label', assetManagerText('loadToCanvas')),
          (el152['innerHTML'] =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'),
          el151['appendChild'](el152));
        !el153 &&
          ((el153 = document['createElement']('button')),
          (el153['type'] = 'button'),
          (el153['className'] = 'v2-asset-item-delete'),
          (el153['dataset']['uiAction'] = 'asset-delete-open'),
          el153['setAttribute']('aria-label', assetManagerText('deleteAsset')),
          (el153['innerHTML'] =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'),
          el151['appendChild'](el153));
        if (!el154) {
          ((el154 = document['createElement']('div')),
            (el154['className'] = 'v2-asset-item-delete-confirm'),
            (el154['hidden'] = !![]),
            el154['addEventListener']('click', (event28) => {
              if (event28['target'] !== el154) return;
              (event28['stopPropagation'](),
                (this['_pendingDeleteAssetId'] = ''),
                this['renderSidebarContent']());
            }));
          const el156 = document['createElement']('button');
          ((el156['type'] = 'button'),
            (el156['className'] =
              'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--danger'),
            (el156['dataset']['uiAction'] = 'asset-delete-confirm'),
            (el156['textContent'] = '✔'),
            el156['setAttribute']('aria-label', assetManagerText('confirm')));
          const el157 = document['createElement']('button');
          ((el157['type'] = 'button'),
            (el157['className'] =
              'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--neutral'),
            (el157['dataset']['uiAction'] = 'asset-delete-cancel'),
            (el157['textContent'] = '×'),
            el157['setAttribute']('aria-label', assetManagerText('cancel')),
            el154['appendChild'](el156),
            el154['appendChild'](el157),
            el151['appendChild'](el154));
        }
        const value378 = String(error15?.['id'] || '');
        ((el152['dataset']['assetId'] = value378),
          (el152['disabled'] =
            !Array['isArray'](error15?.['nodes']) || error15['nodes']['length'] === 0),
          (el153['dataset']['assetId'] = value378),
          el154['querySelectorAll'](':scope > button')['forEach']((el158) => {
            el158['dataset']['assetId'] = value378;
          }));
        const enabled85 = this['_pendingDeleteAssetId'] === value378;
        ((el153['hidden'] = enabled85), (el154['hidden'] = !enabled85));
        !enabled84 &&
          ((enabled84 = document['createElement']('div')),
          (enabled84['className'] = 'v2-asset-item-cover'),
          el151['appendChild'](enabled84));
        !el155 &&
          ((el155 = document['createElement']('div')),
          (el155['className'] = 'v2-asset-item-name'),
          el155['addEventListener']('click', (event29) => {
            event29['stopPropagation']();
            const el159 = event29['currentTarget']?.['closest']?.('.v2-asset-item'),
              value379 = el159?.['dataset']?.['id'] || '';
            this['_beginRenameAsset'](value379);
          }),
          el151['appendChild'](el155));
        const value380 = String(error15?.['name'] || '');
        if (this['_renamingAssetId'] === value378) {
          el155['classList']['add']('is-editing');
          let el160 = el155['querySelector'](':scope > input.v2-asset-item-name-input');
          !el160 &&
            ((el160 = document['createElement']('input')),
            (el160['type'] = 'text'),
            (el160['className'] = 'v2-asset-item-name-input'),
            el160['addEventListener']('click', (event30) => event30['stopPropagation']()),
            el160['addEventListener']('keydown', (event31) => {
              if (event31['key'] === 'Enter') {
                (event31['preventDefault'](),
                  event31['stopPropagation'](),
                  (el160['dataset']['submitted'] = '1'),
                  this['_commitRenameAsset'](value378, el160['value']));
                return;
              }
              event31['key'] === 'Escape' &&
                (event31['preventDefault'](), event31['stopPropagation'](), this['_cancelRenameAsset']());
            }),
            el160['addEventListener']('blur', () => {
              if (el160['dataset']['submitted'] === '1') return;
              this['_commitRenameAsset'](value378, el160['value']);
            }),
            el155['replaceChildren'](el160));
          if (el160['value'] !== value380) el160['value'] = value380;
          if (el160['getAttribute']('aria-label') !== assetManagerText('createPanel.assetName'))
            el160['setAttribute']('aria-label', assetManagerText('createPanel.assetName'));
          window['requestAnimationFrame'](() => {
            if (!el160['isConnected']) return;
            try {
              (el160['focus'](), el160['select']?.());
            } catch (value381) {}
          });
        } else {
          if (el155['classList']['contains']('is-editing'))
            el155['classList']['remove']('is-editing');
          const value382 = el155['querySelector'](':scope > input.v2-asset-item-name-input');
          if (value382) el155['replaceChildren']();
          if (el155['textContent'] !== value380) el155['textContent'] = value380;
          if (el155['getAttribute']('title') !== value380) el155['setAttribute']('title', value380);
        }
        const list38 = Array['isArray'](error15?.['items'])
          ? error15['items']
          : Array['isArray'](error15?.['nodes'])
            ? error15['nodes']['map']((value383) => _buildAssetItem(value383))
            : [];
        if (list38['length'] > 0) {
          const el161 = handler9(enabled84),
            value384 = el161['querySelectorAll'](':scope > .v2-asset-cover-cell');
          for (let count21 = 0; count21 < 4; count21++) {
            const enabled86 = list38[count21];
            if (!enabled86) {
              const el162 = value384[count21];
              el162 &&
                ((el162['dataset']['thumbKind'] = 'empty'),
                (el162['dataset']['thumbType'] = ''),
                (el162['dataset']['thumbSrc'] = ''),
                (el162['dataset']['pendingSrc'] = ''),
                el162['replaceChildren']());
              continue;
            }
            handler8(value384[count21], enabled86['thumbSrc'], enabled86['type']);
          }
          return;
        }
        error15?.['coverUrl']
          ? handler8(enabled84, error15['coverUrl'], error15['coverType'])
          : handler8(enabled84, '', error15?.['coverType'] || 'other');
      },
      list39 = this['_getSortedAssets']()['filter'](
        (value385) =>
          this['_categoryKey'](value385?.['category']) === this['_categoryKey'](this['activeTab']),
      );
    if (this['_openAssetId']) {
      const category18 = list39['find']((value386) => value386['id'] === this['_openAssetId']);
      if (!category18) {
        ((this['_openAssetId'] = null), this['renderSidebarContent']());
        return;
      }
      if (el147) el147['textContent'] = category18['name'] || assetManagerText('title');
      if (el148) el148['classList']['add']('show');
      (this['sidebarPanel']['classList']['add']('is-detail-view'),
        (listView5['style']['display'] = 'none'),
        (detailView2['style']['display'] = ''));
      const list40 = Array['isArray'](category18?.['items'])
        ? category18['items']
        : Array['isArray'](category18?.['nodes'])
          ? category18['nodes']['map']((value387) => _buildAssetItem(value387))
          : [];
      detailView2['replaceChildren']();
      const el163 = document['createElement']('div');
      el163['className'] = 'v2-asset-detail';
      const value388 = document['createElement']('div');
      ((value388['className'] = 'v2-asset-detail-cover'), el163['appendChild'](value388));
      if (list40['length'] > 0) {
        const el164 = handler9(value388),
          value389 = el164['querySelectorAll'](':scope > .v2-asset-cover-cell');
        for (let count22 = 0; count22 < 4; count22++) {
          const value390 = list40[count22];
          if (value390) handler8(value389[count22], value390['thumbSrc'], value390['type']);
          else value389[count22] && value389[count22]['replaceChildren']();
        }
      } else handler8(value388, category18?.['coverUrl'], category18?.['coverType'] || 'other');
      const el165 = document['createElement']('div');
      ((el165['className'] = 'v2-asset-detail-title'),
        (el165['textContent'] = category18['name'] || assetManagerText('unnamedAsset')),
        el163['appendChild'](el165));
      const el166 = document['createElement']('div');
      el166['className'] = 'v2-asset-detail-meta';
      const count23 = Array['isArray'](category18?.['nodes'])
        ? category18['nodes']['length']
        : list40['length'];
      ((el166['textContent'] = assetManagerText('detail.meta', {
        category: category18['category']
          ? this['_formatCategoryLabel'](category18['category'])
          : assetManagerText('uncategorized'),
        count: count23,
        time: _formatAssetDateTime(category18['updatedAt'] || category18['createdAt']),
      })),
        el163['appendChild'](el166));
      const el167 = document['createElement']('section');
      el167['className'] = 'v2-asset-detail-section';
      const el168 = document['createElement']('div');
      ((el168['className'] = 'v2-asset-detail-section-title'),
        (el168['textContent'] = assetManagerText('detail.content')),
        el167['appendChild'](el168));
      const el169 = document['createElement']('div');
      el169['className'] = 'v2-asset-subgrid';
      if (list40['length'] === 0) {
        const el170 = document['createElement']('div');
        ((el170['className'] = 'v2-asset-empty'),
          (el170['textContent'] = assetManagerText('detail.empty')),
          el169['appendChild'](el170));
      } else
        for (let index3 = 0; index3 < list40['length']; index3++) {
          const error16 = list40[index3],
            el171 = document['createElement']('button');
          ((el171['type'] = 'button'),
            (el171['className'] = 'v2-asset-subitem'),
            (el171['dataset']['assetId'] = category18['id']),
            (el171['dataset']['idx'] = String(index3)));
          const value391 = document['createElement']('div');
          ((value391['className'] = 'v2-asset-subitem-thumb'),
            handler8(value391, error16?.['thumbSrc'], error16?.['type']));
          const value392 = document['createElement']('div');
          value392['className'] = 'v2-asset-subitem-info';
          const el172 = document['createElement']('span');
          ((el172['className'] = 'v2-asset-subitem-type'),
            (el172['textContent'] = _formatAssetTypeLabel(error16?.['type'])));
          const el173 = document['createElement']('div');
          el173['className'] = 'v2-asset-subitem-name';
          const value393 = String(
            error16?.['name'] ||
              error16?.['type'] ||
              assetManagerText('detail.childAssetName', { index: index3 + 1 }),
          );
          ((el173['textContent'] = value393),
            value392['append'](el172, el173),
            el171['append'](value391, value392),
            el169['appendChild'](el171));
        }
      (el167['appendChild'](el169), el163['appendChild'](el167));
      const el174 = document['createElement']('div');
      el174['className'] = 'v2-asset-detail-actions';
      const el175 = document['createElement']('button');
      ((el175['type'] = 'button'),
        (el175['className'] = 'v2-asset-detail-btn'),
        (el175['dataset']['uiAction'] = 'asset-add-all'),
        (el175['dataset']['assetId'] = category18['id']),
        (el175['textContent'] = assetManagerText('loadToCanvas')),
        el174['appendChild'](el175),
        el163['appendChild'](el174),
        detailView2['appendChild'](el163));
      return;
    }
    if (el147) el147['textContent'] = assetManagerText('title');
    if (el148) el148['classList']['remove']('show');
    (this['sidebarPanel']['classList']['remove']('is-detail-view'),
      (listView5['style']['display'] = ''),
      (detailView2['style']['display'] = 'none'),
      detailView2['replaceChildren']());
    let el176 = listView5['querySelector'](':scope > .v2-asset-empty');
    !el176 &&
      ((el176 = document['createElement']('div')),
      (el176['className'] = 'v2-asset-empty'),
      listView5['appendChild'](el176));
    const value394 = this['_getSortedAssets']();
    let count24 = 0,
      value395 = 0;
    for (const value396 of value394) {
      const enabled87 = String(value396?.['id'] || '');
      if (!enabled87) continue;
      let el177 = this['_assetCardPool']?.['get']?.(enabled87);
      if (!el177) {
        ((el177 = document['createElement']('div')),
          (el177['className'] = 'v2-asset-item'),
          (el177['dataset']['id'] = enabled87));
        if (!this['_assetCardPool']) this['_assetCardPool'] = new Map();
        this['_assetCardPool']['set'](enabled87, el177);
      }
      if (el177['parentElement'] !== listView5) listView5['appendChild'](el177);
      const value397 =
        this['_categoryKey'](value396?.['category']) === this['_categoryKey'](this['activeTab']);
      ((el177['style']['display'] = value397 ? '' : 'none'),
        value397 &&
          ((el177['style']['order'] = String(value395++)),
          handler10(el177, value396),
          this['_newAssetPulseId'] &&
            this['_newAssetPulseId'] === enabled87 &&
            ((this['_newAssetPulseId'] = ''),
            window['requestAnimationFrame'](() => {
              if (!el177['isConnected']) return;
              el177['classList']['add']('is-new');
              const value398 = window['setTimeout'](() => {
                if (el177['isConnected']) el177['classList']['remove']('is-new');
              }, 650);
              el177['dataset']['_pulseTimer'] = String(value398);
            })),
          (count24 += 1)));
    }
    ((el176['style']['display'] = count24 === 0 ? '' : 'none'),
      count24 === 0 &&
        ((el176['textContent'] = assetManagerText('emptyCategory', {
          category: this['_formatCategoryLabel'](this['activeTab']),
        })),
        (el176['style']['order'] = '0')));
  }
  ['_restoreAssetSubItem'](value399, value400, box12 = null) {
    const enabled88 = (this['assets'] || [])['find']((value401) => value401['id'] === value399);
    if (!enabled88 || !Array['isArray'](enabled88['nodes'])) return;
    const box13 = prepareAssetNodeForRestore(enabled88, enabled88['nodes'][value400]);
    if (!box13) return;
    const value402 = Number['isFinite'](box12?.['x']) && Number['isFinite'](box12?.['y']),
      box14 = value402 ? box12 : this['_getCanvasCenterWorld'](),
      value403 = Number(box13['width'] ?? box13['w']) || 240,
      value404 = Number(box13['height'] ?? box13['h']) || 240,
      x = box14['x'] - value403 / 2,
      y = box14['y'] - value404 / 2,
      box15 = value402
        ? { x: x, y: y }
        : findAvailablePosition(
            appStore['getState']()['nodes'],
            x,
            y,
            value403,
            value404,
            24,
            'right',
          );
    (appStore['batch'](() => {
      const box16 = JSON['parse'](JSON['stringify'](box13));
      ((box16['id'] = generateId(box16['type'])),
        (box16['x'] = box15['x']),
        (box16['y'] = box15['y']),
        appStore['addNode'](box16),
        appStore['setSelectedNodes']([box16['id']]));
    }),
      window['showToast']?.(assetManagerText('toasts.subAssetAdded'), 'success'));
  }
  ['restoreAssetToCanvas'](value405, box17 = null) {
    const enabled89 = (this['assets'] || [])['find']((value406) => value406['id'] === value405);
    if (!enabled89 || !enabled89['nodes']) return;
    const list41 = prepareAssetNodesForRestore(enabled89, 24),
      value407 = Number['isFinite'](box17?.['x']) && Number['isFinite'](box17?.['y']),
      box18 = value407 ? box17 : this['_getCanvasCenterWorld'](),
      value408 = this['_calcNodesBBox'](list41),
      value409 = box18['x'] - value408['cx'],
      value410 = box18['y'] - value408['cy'],
      x2 = value408['minX'] + value409,
      y2 = value408['minY'] + value410,
      box19 = value407
        ? { x: x2, y: y2 }
        : findAvailablePosition(
            appStore['getState']()['nodes'],
            x2,
            y2,
            Math['max'](1, value408['w']),
            Math['max'](1, value408['h']),
            24,
            'right',
          ),
      value411 = value409 + (box19['x'] - x2),
      value412 = value410 + (box19['y'] - y2);
    (appStore['batch'](() => {
      const value413 = {};
      (list41['forEach']((value414) => {
        const box20 = JSON['parse'](JSON['stringify'](value414)),
          value415 = box20['id'],
          generateId3 = generateId(box20['type']);
        ((value413[value415] = generateId3),
          (box20['id'] = generateId3),
          (box20['x'] = (Number(box20['x']) || 0) + value411),
          (box20['y'] = (Number(box20['y']) || 0) + value412),
          appStore['addNode'](box20));
      }),
        enabled89['edges'] &&
          enabled89['edges']['forEach']((value416) => {
            const value417 = JSON['parse'](JSON['stringify'](value416));
            value417['id'] = generateId('edge');
            if (value413[value417['sourceId']]) value417['sourceId'] = value413[value417['sourceId']];
            if (value413[value417['targetId']]) value417['targetId'] = value413[value417['targetId']];
            appStore['addEdge'](value417);
          }),
        appStore['setSelectedNodes'](Object['values'](value413)));
    }),
      window['showToast']?.(assetManagerText('toasts.assetAdded'), 'success'));
  }
}
export const assetManager = new AssetManager();
