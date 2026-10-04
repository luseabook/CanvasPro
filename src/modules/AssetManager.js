import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId, screenToWorld } from '../core/math.js';
import { getImage } from './storage.js';
import {
  fetchAssetsFromServer,
  fetchAssetCategoriesFromServer,
  saveAssetToServer,
  saveAssetCategoriesToServer,
  deleteAssetFromServer,
  saveAssetThumbToServer,
} from '../../api/projectsV2Api.js';
import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import {
  removeAssetMentionAsset,
  setAssetMentionAssets,
  upsertAssetMentionAsset,
} from './assetMentionRegistry.js';
import { createReferenceFallbackThumbHtml } from './referenceThumbnailFallback.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { createTopAlignedAssetNodes, shouldTopAlignRestoredAsset } from './assetRestoreLayout.js';
import { getLocale, t } from '../i18n/index.js';
import { preloadCanvasImage } from './canvasMediaScheduler.js';
const DEFAULT_ASSET_CATEGORIES = ['人物', '场景', '物品'],
  ASSET_CATEGORY_LIMIT = 10,
  HIDDEN_ASSET_CATEGORIES = ['出图历史'],
  HIDDEN_ASSET_KINDS = ['generation-history'],
  ASSET_CATEGORY_I18N_KEYS = Object.freeze({
    人物: 'people',
    场景: 'scenes',
    物品: 'objects',
    出图历史: 'history',
    自定义: 'custom',
  });
function assetManagerText(value, item = {}) {
  return t('assetManager.' + value, item);
}
function _formatAssetCategoryLabel(key) {
  const index = String(key || '').trim(),
    result = ASSET_CATEGORY_I18N_KEYS[index];
  return result ? assetManagerText('categories.' + result) : index;
}
function _escapeHtml(data) {
  return String(data ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function _clonePlain(options, target) {
  if (options == null) return target;
  try {
    return JSON.parse(JSON.stringify(options));
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
    enabled.thumbLocalPath || enabled.displayLocalPath || enabled.localPath || enabled.originalLocalPath;
  if (record)
    return (
      localPathToUrl(record) ||
      (String(record).startsWith('/') ? String(record) : '/' + String(record).replace(/^\/+/, ''))
    );
  if (enabled.thumbUrl && typeof enabled.thumbUrl === 'string') return enabled.thumbUrl;
  return String(enabled.src || enabled.imageUrl || '');
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
  const type = name?.type || 'other',
    thumbSrc = _resolveNodeStableThumbSrc(name);
  return { type: type, name: name?.name || '', thumbSrc: thumbSrc || '', nodeData: name };
}
function _sortAssetsByUpdatedTime(handle) {
  return [...(Array.isArray(handle) ? handle : [])].sort((item2, state) => {
    const config = Number(item2?.updatedAt || item2?.createdAt || 0),
      scope = Number(state?.updatedAt || state?.createdAt || 0);
    return scope - config;
  });
}
function _formatAssetDateTime(input) {
  const count = Number(input);
  if (!Number.isFinite(count) || count <= 0) return assetManagerText('unknownTime');
  return new Date(count).toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
class AssetManager {
  constructor() {
    ((this.createPanel = null),
      (this.createPanelBackdrop = null),
      (this._createPanelKeydownHandler = null),
      (this._createPanelDropdownOutsideHandler = null),
      (this._createPanelDropdownEl = null),
      (this._createPanelCoverObjectUrl = ''),
      (this._createPanelState = null),
      (this.sidebarPanel = null),
      (this._openAssetId = null),
      (this._thumbPreloadSet = new Set()),
      (this._thumbDecodePromiseMap = new Map()),
      (this._videoThumbInFlight = new Set()),
      (this._videoThumbTimer = 0),
      (this._sidebarRenderRaf = 0),
      (this._pendingDeleteAssetId = ''),
      (this._renamingAssetId = ''),
      (this._newAssetPulseId = ''),
      (this._sidebarTabsLayoutRaf = 0),
      (this.activeTab = '人物'),
      (this.tabs = [...DEFAULT_ASSET_CATEGORIES]),
      (this.userCategories = []),
      (this.assets = []),
      this.initSidebarPanel(),
      this.loadAssetCategoriesFromServer(),
      this.loadAssetsFromServer());
  }
  ['_getSortedAssets']() {
    return _sortAssetsByUpdatedTime((this.assets || []).filter((item3) => this._isManagedAsset(item3)));
  }
  ['_normalizeCategoryName'](output) {
    return String(output || '').trim();
  }
  ['_categoryKey'](value2) {
    return this._normalizeCategoryName(value2).toLocaleLowerCase();
  }
  ['_isDefaultCategory'](value3) {
    return !!this._findCategoryByName(value3, DEFAULT_ASSET_CATEGORIES);
  }
  ['_isHiddenAssetCategory'](value4) {
    return !!this._findCategoryByName(value4, HIDDEN_ASSET_CATEGORIES);
  }
  ['_isManagedAsset'](enabled2) {
    if (!enabled2 || typeof enabled2 !== 'object') return false;
    if (
      HIDDEN_ASSET_KINDS.includes(
        String(enabled2?.kind || '')
          .trim()
          .toLowerCase(),
      )
    )
      return false;
    return !this._isHiddenAssetCategory(enabled2?.category);
  }
  ['_findCategoryByName'](value5, value6 = this.tabs) {
    const enabled3 = this._categoryKey(value5);
    if (!enabled3) return '';
    return (value6 || []).find((item4) => this._categoryKey(item4) === enabled3) || '';
  }
  ['_normalizeUserCategories'](list = []) {
    const list2 = [],
      item5 = (value7) => {
        const enabled4 = this._normalizeCategoryName(value7);
        if (!enabled4) return;
        if (this._isDefaultCategory(enabled4) || this._isHiddenAssetCategory(enabled4)) return;
        if (this._findCategoryByName(enabled4, list2)) return;
        if (DEFAULT_ASSET_CATEGORIES.length + list2.length >= ASSET_CATEGORY_LIMIT) return;
        list2.push(enabled4);
      };
    return ((Array.isArray(list) ? list : []).forEach(item5), list2);
  }
  ['_isUserCategory'](value8) {
    return !!this._findCategoryByName(value8, this.userCategories);
  }
  ['_getAssetCategories'](value9 = '') {
    const list3 = [],
      handler = (value10) => {
        const enabled5 = this._normalizeCategoryName(value10);
        if (!enabled5) return;
        if (this._isHiddenAssetCategory(enabled5)) return;
        if (this._findCategoryByName(enabled5, list3)) return;
        if (list3.length >= ASSET_CATEGORY_LIMIT) return;
        list3.push(enabled5);
      };
    DEFAULT_ASSET_CATEGORIES.forEach(handler);
    for (const value11 of this.userCategories || []) {
      handler(value11);
    }
    for (const value12 of this._getSortedAssets()) {
      handler(value12?.category);
    }
    return (handler(value9), list3);
  }
  ['_syncTabsFromAssets']() {
    ((this.tabs = this._getAssetCategories()),
      !this._findCategoryByName(this.activeTab, this.tabs) &&
        ((this.activeTab = DEFAULT_ASSET_CATEGORIES[0]), (this._openAssetId = null)));
  }
  ['_renderSidebarTabsHtml']() {
    return (this.tabs || [])
      .map((item6) => {
        const value13 = this._categoryKey(item6) === this._categoryKey(this.activeTab) ? ' active' : '',
          _escapeHtml2 = _escapeHtml(item6),
          _escapeHtml3 = _escapeHtml(_formatAssetCategoryLabel(item6)),
          value14 = this._isUserCategory(item6)
            ? '<button\n              type="button"\n              class="v2-asset-category-delete"\n              data-ui-action="asset-category-delete"\n              data-cat="' +
              _escapeHtml2 +
              '"\n              aria-label="' +
              _escapeHtml(
                assetManagerText('deleteCategoryAria', { category: _formatAssetCategoryLabel(item6) }),
              ) +
              '"\n              title="' +
              _escapeHtml(assetManagerText('deleteCategory')) +
              '"\n            >×</button>'
            : '';
        return (
          '\n          <div class="v2-asset-sidebar-tab' +
          value13 +
          '" data-cat="' +
          _escapeHtml2 +
          '">\n            <span class="v2-asset-sidebar-tab-text">' +
          _escapeHtml3 +
          '</span>\n            ' +
          value14 +
          '\n          </div>\n        '
        );
      })
      .join('');
  }
  ['_renderSidebarTabs']() {
    const el = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!el) return;
    ((el.innerHTML = this._renderSidebarTabsHtml()), this._queueSidebarTabsLayoutSync());
  }
  ['_queueSidebarTabsLayoutSync']() {
    if (!this.sidebarPanel) return;
    (this._sidebarTabsLayoutRaf && window.cancelAnimationFrame?.(this._sidebarTabsLayoutRaf),
      (this._sidebarTabsLayoutRaf = window.requestAnimationFrame(() => {
        ((this._sidebarTabsLayoutRaf = 0), this._syncSidebarTabsViewport());
      })));
  }
  ['_syncSidebarTabsViewport']() {
    const el2 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!el2) return;
    const el3 = el2.querySelector('.v2-asset-sidebar-tab.active');
    if (el3 && el2.clientWidth > 0) {
      if (this._isDefaultCategory(this.activeTab)) el2.scrollLeft = 0;
      else {
        const value15 = el3.offsetLeft,
          value16 = value15 + el3.offsetWidth,
          value17 = el2.scrollLeft,
          value18 = value17 + el2.clientWidth;
        if (value15 < value17) el2.scrollLeft = value15;
        else value16 > value18 && (el2.scrollLeft = value16 - el2.clientWidth);
      }
    }
    this._updateSidebarTabsOverflowHint();
  }
  ['_updateSidebarTabsOverflowHint']() {
    const el4 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs-shell'),
      el5 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!el4 || !el5) return;
    const count2 = Math.max(0, el5.scrollWidth - el5.clientWidth),
      enabled6 = count2 > 2,
      value19 = !enabled6 || el5.scrollLeft <= 2,
      value20 = !enabled6 || el5.scrollLeft >= count2 - 2;
    (el4.classList.toggle('has-overflow', enabled6),
      el4.classList.toggle('is-at-start', value19),
      el4.classList.toggle('is-at-end', value20));
    const el6 = el4.querySelector('.v2-asset-sidebar-tabs-nav--prev'),
      el7 = el4.querySelector('.v2-asset-sidebar-tabs-nav--next');
    if (el6) el6.hidden = !enabled6 || value19;
    if (el7) el7.hidden = !enabled6 || value20;
  }
  ['_scrollSidebarTabs'](count3 = 1) {
    const el8 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!el8) return;
    const value21 = Math.max(1, Math.floor(el8.clientWidth * 0.75)),
      left = el8.scrollLeft + value21 * (count3 < 0 ? -1 : 1);
    (typeof el8.scrollTo === 'function'
      ? el8.scrollTo({ left: left, behavior: 'smooth' })
      : (el8.scrollLeft = left),
      window.setTimeout(() => this._updateSidebarTabsOverflowHint(), 220));
  }
  ['_getCreatePanelCategories']() {
    const list4 = this._getAssetCategories(),
      handler2 = (value22) => {
        const enabled7 = this._normalizeCategoryName(value22);
        if (!enabled7) return;
        if (this._findCategoryByName(enabled7, list4)) return;
        list4.push(enabled7);
      };
    for (const value23 of this._createPanelState?.customCategories || []) {
      handler2(value23);
    }
    return (handler2(this._createPanelState?.draft?.category || this.activeTab), list4);
  }
  ['_canAddCustomCategory']() {
    return this._getCreatePanelCategories().length < ASSET_CATEGORY_LIMIT;
  }
  async ['loadAssetCategoriesFromServer']() {
    try {
      const fetchAssetCategoriesFromServer2 = await fetchAssetCategoriesFromServer();
      ((this.userCategories = this._normalizeUserCategories(fetchAssetCategoriesFromServer2)),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
    } catch (value24) {
      console.error('加载资产分类失败', value24);
    }
  }
  async ['_saveUserCategories']() {
    const value25 = this._normalizeUserCategories(this.userCategories);
    ((this.userCategories = value25), await saveAssetCategoriesToServer(value25));
  }
  ['_addUserCategory'](value26) {
    const enabled8 = this._normalizeCategoryName(value26);
    if (!enabled8 || this._isDefaultCategory(enabled8) || this._isHiddenAssetCategory(enabled8)) return '';
    const value27 = this._findCategoryByName(enabled8, this.userCategories);
    if (value27) return value27;
    if (this._getAssetCategories().length >= ASSET_CATEGORY_LIMIT)
      return (
        window.showToast?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn'),
        ''
      );
    return (
      (this.userCategories = this._normalizeUserCategories([...this.userCategories, enabled8])),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      void this._saveUserCategories().catch((value28) => {
        (console.error('保存资产分类失败', value28),
          window.showToast?.(assetManagerText('categorySaveFailed'), 'error'));
      }),
      enabled8
    );
  }
  ['_getMentionEligibleAssets']() {
    return this._getSortedAssets().filter((item7) => this._findCategoryByName(item7?.category, this.tabs));
  }
  ['_normalizeAssetEntity'](args) {
    if (!args || typeof args !== 'object') return null;
    const enabled9 = { ...args },
      count4 = Number(enabled9.createdAt || 0),
      count5 = Number(enabled9.updatedAt || count4 || 0);
    count4 > 0 ? (enabled9.createdAt = count4) : delete enabled9.createdAt;
    if (count5 > 0) enabled9.updatedAt = count5;
    else count4 > 0 && (enabled9.updatedAt = count4);
    return (
      !enabled9.coverUrl &&
        Array.isArray(enabled9.nodes) &&
        enabled9.nodes[0] &&
        (enabled9.coverUrl = _resolveNodeStableThumbSrc(enabled9.nodes[0])),
      !Array.isArray(enabled9.items) &&
        Array.isArray(enabled9.nodes) &&
        (enabled9.items = enabled9.nodes.map((item8) => _buildAssetItem(item8))),
      enabled9
    );
  }
  ['_upsertLocalAsset'](value29) {
    const enabled10 = this._normalizeAssetEntity(value29);
    if (!enabled10?.id) return;
    const list5 = Array.isArray(this.assets) ? this.assets : [],
      args2 = list5.filter((item9) => String(item9?.id || '') !== String(enabled10.id));
    ((this.assets = _sortAssetsByUpdatedTime([enabled10, ...args2])),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      this._findCategoryByName(enabled10.category, this.tabs)
        ? upsertAssetMentionAsset(enabled10)
        : removeAssetMentionAsset(enabled10.id));
  }
  ['_getSelectedAssetNodes'](value30) {
    const list6 = Array.isArray(value30) ? value30 : [],
      value31 = appStore.getState();
    return list6.map((item10) => value31.nodes[item10]).filter(Boolean);
  }
  ['_getSelectedAssetEdges'](value32) {
    const value33 = Array.isArray(value32) ? value32 : [],
      map = new Set(value33),
      value34 = appStore.getState();
    return Object.values(value34.edges || {}).filter(
      (item11) => map.has(item11?.sourceId) && map.has(item11?.targetId),
    );
  }
  async ['_resolveCreatePanelCover'](value35) {
    let coverUrl2 = '';
    const coverType2 = value35?.type || 'other';
    if (value35?.thumbId) {
      const image = await getImage(value35.thumbId);
      image &&
        ((this._createPanelCoverObjectUrl = URL.createObjectURL(image)),
        (coverUrl2 = this._createPanelCoverObjectUrl));
    }
    return (
      !coverUrl2 && (coverUrl2 = _resolveNodeStableThumbSrc(value35)),
      {
        coverUrl: coverUrl2,
        coverType: coverType2,
        coverHtml: coverUrl2
          ? '<img src="' +
            coverUrl2 +
            '" alt="' +
            _escapeHtml(assetManagerText('coverAlt')) +
            '" id="asset-create-cover-img" draggable="false" />'
          : _renderAssetIcon(coverType2),
      }
    );
  }
  ['_buildAssetPayloadFromSelection'](value36, error = {}) {
    const items = this._getSelectedAssetNodes(value36),
      value37 = items[0] || null,
      value38 = Date.now(),
      name2 = String(error.name || '').trim() || assetManagerText('unnamedAsset'),
      category = String(error.category || '').trim() || this.activeTab,
      coverType3 = value37?.type || 'other',
      coverUrl3 = _resolveNodeStableThumbSrc(value37),
      id = String(error.id || '').trim(),
      createdAt = Number(error.createdAt || value38) || value38,
      updatedAt = Number(error.updatedAt || value38) || value38;
    return {
      id: id || generateId('asset'),
      name: name2,
      category: category,
      coverUrl: coverUrl3,
      coverType: coverType3,
      items: items.map((item12) => _buildAssetItem(item12)),
      nodes: items,
      edges: this._getSelectedAssetEdges(value36),
      createdAt: createdAt,
      updatedAt: updatedAt,
    };
  }
  ['_buildAssetAppendPayload'](id2, value39, error2 = {}) {
    const list7 = this._getSelectedAssetNodes(value39),
      list8 = this._getSelectedAssetEdges(value39),
      value40 = Date.now(),
      value41 = {},
      list9 = list7.map((args3) => {
        const _clonePlain2 = _clonePlain(args3, { ...args3 }),
          value42 = String(_clonePlain2.id || ''),
          generateId2 = generateId(_clonePlain2.type);
        if (value42) value41[value42] = generateId2;
        return ((_clonePlain2.id = generateId2), _clonePlain2);
      }),
      args4 = list8.map((args5) => {
        const _clonePlain3 = _clonePlain(args5, { ...args5 });
        _clonePlain3.id = generateId('edge');
        if (value41[_clonePlain3.sourceId]) _clonePlain3.sourceId = value41[_clonePlain3.sourceId];
        if (value41[_clonePlain3.targetId]) _clonePlain3.targetId = value41[_clonePlain3.targetId];
        return _clonePlain3;
      }),
      list10 = Array.isArray(id2?.nodes) ? _clonePlain(id2.nodes, []) : [],
      args6 = Array.isArray(id2?.items)
        ? _clonePlain(id2.items, [])
        : list10.map((item13) => _buildAssetItem(item13)),
      args7 = Array.isArray(id2?.edges) ? _clonePlain(id2.edges, []) : [],
      value43 = list9[0] || null,
      value44 = value43 ? _resolveNodeStableThumbSrc(value43) : '',
      coverUrl4 = id2?.coverUrl || value44,
      coverType4 = id2?.coverType || value43?.type || 'other';
    return {
      ...(id2 || {}),
      id: id2?.id,
      name: String(error2.name || '').trim() || assetManagerText('unnamedAsset'),
      category: String(error2.category || '').trim() || this.activeTab,
      coverUrl: coverUrl4,
      coverType: coverType4,
      items: [...args6, ...list9.map((item14) => _buildAssetItem(item14))],
      nodes: [...list10, ...list9],
      edges: [...args7, ...args4],
      createdAt: Number(id2?.createdAt || id2?.updatedAt || value40) || value40,
      updatedAt: Number(error2.updatedAt || value40) || value40,
    };
  }
  ['_createDefaultPanelState'](args8, coverInfo) {
    return {
      selectedIds: [...args8],
      mode: 'create',
      selectedAssetId: '',
      updateSearchKeyword: '',
      updateConfirmOpen: false,
      customCategoryEditing: false,
      customCategoryDraft: '',
      customCategories: [],
      error: '',
      saving: false,
      savingAction: '',
      draft: { name: assetManagerText('newAsset'), category: this.activeTab },
      coverInfo: coverInfo || { coverUrl: '', coverType: 'other', coverHtml: _renderAssetIcon('other') },
    };
  }
  ['_setCreatePanelState'](args9 = {}) {
    if (!this._createPanelState) return;
    const args10 = this._createPanelState,
      draft = args9.draft ? { ...(args10.draft || {}), ...args9.draft } : args10.draft;
    this._createPanelState = { ...args10, ...args9, draft: draft };
  }
  ['_getUpdateListCategory']() {
    const value45 = this._normalizeCategoryName(this._createPanelState?.draft?.category);
    if (this._createPanelState?.mode === 'update' && value45) return value45;
    return this._findCategoryByName(this.activeTab, this.tabs) || this.activeTab;
  }
  ['_getFilteredUpdateAssets'](value46 = '') {
    const enabled11 = String(value46 || '')
        .trim()
        .toLowerCase(),
      value47 = this._categoryKey(this._getUpdateListCategory()),
      list11 = this._getSortedAssets().filter((item15) => this._categoryKey(item15?.category) === value47);
    if (!enabled11) return list11;
    return list11.filter((error3) =>
      String(error3?.name || '')
        .toLowerCase()
        .includes(enabled11),
    );
  }
  ['_syncCreatePanelDraftFromTarget'](error4) {
    this._setCreatePanelState({
      draft: {
        name: String(error4?.name || '').trim() || assetManagerText('unnamedAsset'),
        category: String(error4?.category || '').trim() || this.activeTab,
      },
      selectedAssetId: String(error4?.id || ''),
      updateConfirmOpen: false,
      customCategoryEditing: false,
      customCategoryDraft: '',
      error: '',
    });
  }
  ['_syncUpdateSelectionForCategory'](value48) {
    if (this._createPanelState?.mode !== 'update') return;
    const category2 = this._normalizeCategoryName(value48) || this.activeTab;
    this._setCreatePanelState({
      draft: { category: category2 },
      selectedAssetId: '',
      updateSearchKeyword: '',
      updateConfirmOpen: false,
      error: '',
    });
    const error5 = this._getFilteredUpdateAssets()[0] || null;
    if (!error5) return;
    this._setCreatePanelState({
      draft: {
        name: String(error5?.name || '').trim() || assetManagerText('unnamedAsset'),
        category: String(error5?.category || '').trim() || category2,
      },
      selectedAssetId: String(error5?.id || ''),
    });
  }
  ['_renderCreatePanelContent']() {
    const el9 = this.createPanel,
      enabled12 = this._createPanelState;
    if (!el9 || !enabled12) return;
    const value49 =
        enabled12.coverInfo?.coverHtml || _renderAssetIcon(enabled12.coverInfo?.coverType || 'other'),
      value50 =
        enabled12.mode === 'update'
          ? assetManagerText('createPanel.updateTitle')
          : assetManagerText('createPanel.createTitle'),
      count6 = Array.isArray(enabled12.selectedIds) ? enabled12.selectedIds.length : 0,
      value51 = enabled12.saving
        ? enabled12.mode === 'update' && enabled12.savingAction === 'join'
          ? assetManagerText('createPanel.overwrite')
          : enabled12.mode === 'update'
            ? assetManagerText('createPanel.saving')
            : assetManagerText('createPanel.creating')
        : enabled12.mode === 'update'
          ? enabled12.updateConfirmOpen
            ? assetManagerText('createPanel.confirmOverwrite')
            : assetManagerText('createPanel.overwrite')
          : assetManagerText('createPanel.create'),
      value52 =
        enabled12.saving && enabled12.savingAction === 'join'
          ? assetManagerText('createPanel.joining')
          : assetManagerText('createPanel.join'),
      list12 = this._getFilteredUpdateAssets(enabled12.updateSearchKeyword),
      name3 = list12.find((item16) => String(item16?.id || '') === enabled12.selectedAssetId) || null,
      value53 = this._getUpdateListCategory(),
      value54 = enabled12.error
        ? '<div class="v2-asset-create-error" role="alert">' + _escapeHtml(enabled12.error) + '</div>'
        : '',
      value55 =
        enabled12.mode === 'update' && enabled12.updateConfirmOpen && name3
          ? '<div class="v2-asset-create-confirm">' +
            _escapeHtml(
              assetManagerText('createPanel.confirmOverwriteAsset', {
                name: name3.name || assetManagerText('unnamedAsset'),
              }),
            ) +
            '</div>'
          : '',
      value56 =
        enabled12.mode === 'update'
          ? '\n          <div class="v2-asset-update-layout">\n            <div class="v2-asset-update-picker">\n              <input\n                type="search"\n                class="v2-asset-update-search"\n                id="asset-update-search"\n                placeholder="' +
            _escapeHtml(
              assetManagerText('createPanel.searchAssets', {
                category: _formatAssetCategoryLabel(value53),
              }),
            ) +
            '"\n                value="' +
            _escapeHtml(enabled12.updateSearchKeyword || '') +
            '"\n              />\n              <div class="v2-asset-update-list">\n                ' +
            (list12.length === 0
              ? '<div class="v2-asset-update-empty">' +
                (String(enabled12.updateSearchKeyword || '').trim()
                  ? _escapeHtml(assetManagerText('createPanel.noMatchedAssets'))
                  : _escapeHtml(
                      assetManagerText('createPanel.noCategoryAssets', {
                        category: _formatAssetCategoryLabel(value53),
                      }),
                    )) +
                '</div>'
              : list12
                  .map((error6) => {
                    const value57 = String(error6?.id || '') === enabled12.selectedAssetId ? ' active' : '',
                      value58 = error6?.coverUrl
                        ? '<img src="' +
                          _escapeHtml(error6.coverUrl) +
                          '" alt="' +
                          _escapeHtml(error6?.name || assetManagerText('assetAlt')) +
                          '" draggable="false" />'
                        : _renderAssetIcon(error6?.coverType || 'other');
                    return (
                      '\n                            <button\n                              type="button"\n                              class="v2-asset-update-item' +
                      value57 +
                      '"\n                              data-asset-id="' +
                      _escapeHtml(error6.id) +
                      '"\n                            >\n                              <div class="v2-asset-update-thumb">' +
                      value58 +
                      '</div>\n                              <div class="v2-asset-update-info">\n                                <span>' +
                      _escapeHtml(error6.name || assetManagerText('unnamedAsset')) +
                      '</span>\n                                <small>' +
                      _formatAssetDateTime(error6.updatedAt || error6.createdAt) +
                      '</small>\n                              </div>\n                            </button>\n                          '
                    );
                  })
                  .join('')) +
            '\n              </div>\n            </div>\n            <div class="v2-asset-update-editor">\n        '
          : '',
      value59 = enabled12.mode === 'update' ? '</div></div>' : '',
      value60 = enabled12.mode === 'update',
      value61 = value60 ? 'v2-asset-create-body v2-asset-create-body--update' : 'v2-asset-create-body',
      value62 = value60
        ? ''
        : '\n        <div class="v2-asset-create-source-panel">\n          <div class="v2-asset-create-source-header">\n            <div class="v2-asset-create-source-title">' +
          assetManagerText('createPanel.currentSelection') +
          '</div>\n            <div class="v2-asset-create-source-scope">' +
          assetManagerText('createPanel.selectedNodes', { count: count6 }) +
          '</div>\n          </div>\n          <div class="v2-asset-create-cover">\n            ' +
          value49 +
          '\n          </div>\n        </div>\n      ';
    ((el9.innerHTML =
      '\n      <div class="v2-asset-create-header">\n        <div class="v2-asset-create-title">\n          <span class="v2-asset-create-header-text">' +
      value50 +
      '</span>\n        </div>\n        <button type="button" class="v2-asset-create-close" data-ui-action="asset-create-close" aria-label="' +
      _escapeHtml(assetManagerText('close')) +
      '">×</button>\n      </div>\n      <div class="v2-asset-create-tabs">\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (enabled12.mode === 'create' ? ' active' : '') +
      '"\n          data-mode="create"\n        >' +
      assetManagerText('createPanel.createTab') +
      '</button>\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (enabled12.mode === 'update' ? ' active' : '') +
      '"\n          data-mode="update"\n        >' +
      assetManagerText('createPanel.updateTab') +
      '</button>\n      </div>\n      <div class="v2-asset-create-modal-body">\n        ' +
      value56 +
      '\n        <div class="' +
      value61 +
      '">\n          ' +
      value62 +
      '\n          <div class="v2-asset-create-right">\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.assetName') +
      '</div>\n              <input\n                type="text"\n                id="asset-create-name"\n                placeholder="' +
      _escapeHtml(assetManagerText('createPanel.assetNamePlaceholder')) +
      '"\n                value="' +
      _escapeHtml(enabled12.draft?.name || '') +
      '"\n              />\n            </div>\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.category') +
      '</div>\n              <button type="button" class="v2-asset-create-select-trigger" id="asset-create-category-trigger">\n                <span id="asset-create-category-val">' +
      _escapeHtml(_formatAssetCategoryLabel(enabled12.draft?.category || this.activeTab)) +
      '</span>\n                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--white-40)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n                </svg>\n              </button>\n            </div>\n            ' +
      value54 +
      '\n            ' +
      value55 +
      '\n          </div>\n        </div>\n        ' +
      value59 +
      '\n      </div>\n      <div class="v2-asset-create-footer' +
      (value60 ? ' v2-asset-create-footer--update' : '') +
      '">\n        <button\n          type="button"\n          class="v2-asset-create-btn"\n          id="asset-create-submit"\n          ' +
      (enabled12.saving ? 'disabled' : '') +
      '\n        >' +
      value51 +
      '</button>\n        ' +
      (value60
        ? '<button\n                type="button"\n                class="v2-asset-create-btn v2-asset-create-btn--secondary"\n                id="asset-join-submit"\n                ' +
          (enabled12.saving ? 'disabled' : '') +
          '\n              >' +
          value52 +
          '</button>'
        : '') +
      '\n      </div>\n    '),
      this._bindCreatePanelEvents());
  }
  ['_bindCreatePanelEvents']() {
    const el10 = this.createPanel,
      enabled13 = this._createPanelState;
    if (!el10 || !enabled13) return;
    el10.querySelector("[data-ui-action='asset-create-close']")?.addEventListener('click', () => {
      this.closeCreatePanel();
    });
    const el11 = el10.querySelector('#asset-create-category-trigger'),
      el12 = el10.querySelector('#asset-create-category-val');
    this._createPanelDropdownOutsideHandler &&
      (document.removeEventListener('pointerdown', this._createPanelDropdownOutsideHandler),
      (this._createPanelDropdownOutsideHandler = null));
    this._createPanelDropdownEl &&
      (this._createPanelDropdownEl.remove(), (this._createPanelDropdownEl = null));
    if (el11 && el12) {
      const el13 = document.createElement('div');
      el13.className = 'v2-asset-select-dropdown';
      const run = () => {
          const value63 = this._createPanelState?.draft?.category || this.activeTab,
            value64 = this._getCreatePanelCategories()
              .map((item17) => {
                const value65 = this._categoryKey(item17) === this._categoryKey(value63) ? ' selected' : '',
                  _escapeHtml4 = _escapeHtml(item17),
                  _escapeHtml5 = _escapeHtml(_formatAssetCategoryLabel(item17));
                return (
                  '<div class="v2-asset-select-item' +
                  value65 +
                  '" data-val="' +
                  _escapeHtml4 +
                  '">' +
                  _escapeHtml5 +
                  '</div>'
                );
              })
              .join(''),
            value66 = this._canAddCustomCategory()
              ? this._createPanelState?.customCategoryEditing
                ? '<div class="v2-asset-select-custom-row">\n                <input\n                  type="text"\n                  class="v2-asset-select-custom-input"\n                  id="asset-category-custom-input"\n                  placeholder="' +
                  _escapeHtml(assetManagerText('createPanel.categoryNamePlaceholder')) +
                  '"\n                  value="' +
                  _escapeHtml(this._createPanelState?.customCategoryDraft || '') +
                  '"\n                />\n              </div>'
                : '<div class="v2-asset-select-item v2-asset-select-item--custom" data-custom-category="1">' +
                  assetManagerText('categories.custom') +
                  '</div>'
              : '';
          el13.innerHTML = value64 + value66;
        },
        handler3 = () => {
          const el14 = el13.querySelector('#asset-category-custom-input'),
            value67 = el14?.value ?? this._createPanelState?.customCategoryDraft ?? '',
            enabled14 = this._normalizeCategoryName(value67);
          if (!enabled14) {
            (this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }), run());
            return;
          }
          const list13 = this._getCreatePanelCategories(),
            enabled15 = this._findCategoryByName(enabled14, list13);
          if (!enabled15 && list13.length >= ASSET_CATEGORY_LIMIT) {
            window.showToast?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn');
            return;
          }
          const category3 = enabled15 || this._addUserCategory(enabled14);
          if (!category3) return;
          const customCategories = [...(this._createPanelState?.customCategories || [])];
          !enabled15 &&
            !this._findCategoryByName(category3, customCategories) &&
            customCategories.push(category3);
          this._setCreatePanelState({
            draft: { category: category3 },
            customCategoryEditing: false,
            customCategoryDraft: '',
            customCategories: customCategories,
            updateConfirmOpen: false,
            error: '',
          });
          this._createPanelState?.mode === 'update' && this._syncUpdateSelectionForCategory(category3);
          el12.textContent = _formatAssetCategoryLabel(category3);
          if (this._createPanelState?.mode === 'update') {
            (run2(), this._renderCreatePanelContent());
            return;
          }
          run();
        };
      (run(), document.body.appendChild(el13), (this._createPanelDropdownEl = el13));
      const run2 = () => {
        (el13.classList.remove('show'), el11.classList.remove('active'));
      };
      (el11.addEventListener('click', (event) => {
        event.stopPropagation();
        if (el13.classList.contains('show')) {
          run2();
          return;
        }
        const box = el11.getBoundingClientRect();
        ((el13.style.left = box.left + 'px'),
          (el13.style.top = box.bottom + 4 + 'px'),
          (el13.style.width = box.width + 'px'),
          el13.classList.add('show'),
          el11.classList.add('active'));
      }),
        el13.addEventListener('click', (event2) => {
          const value68 = event2.target.closest("[data-custom-category='1']");
          if (value68) {
            (this._setCreatePanelState({ customCategoryEditing: true, customCategoryDraft: '', error: '' }),
              run(),
              window.requestAnimationFrame(() => {
                el13.querySelector('#asset-category-custom-input')?.focus();
              }));
            return;
          }
          const el15 = event2.target.closest('.v2-asset-select-item[data-val]');
          if (!el15) return;
          const category4 = this._normalizeCategoryName(el15.dataset.val) || this.activeTab;
          (this._createPanelState?.mode === 'update'
            ? (this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }),
              this._syncUpdateSelectionForCategory(category4))
            : this._setCreatePanelState({
                draft: { category: category4 },
                customCategoryEditing: false,
                customCategoryDraft: '',
                updateConfirmOpen: false,
                error: '',
              }),
            run2(),
            this._renderCreatePanelContent());
        }),
        el13.addEventListener('input', (customCategoryDraft) => {
          if (!customCategoryDraft.target.matches('#asset-category-custom-input')) return;
          this._setCreatePanelState({ customCategoryDraft: customCategoryDraft.target.value || '' });
        }),
        el13.addEventListener('keydown', (event3) => {
          if (!event3.target.matches('#asset-category-custom-input')) return;
          if (event3.key === 'Enter') {
            (event3.preventDefault(), handler3());
            return;
          }
          event3.key === 'Escape' &&
            (event3.preventDefault(),
            this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }),
            run());
        }),
        el13.addEventListener('focusout', (event4) => {
          if (!event4.target.matches('#asset-category-custom-input')) return;
          handler3();
        }));
      const value69 = (event5) => {
        !el13.contains(event5.target) && !el11.contains(event5.target) && run2();
      };
      ((this._createPanelDropdownOutsideHandler = value69),
        document.addEventListener('pointerdown', value69));
    }
    el10.querySelectorAll('.v2-asset-create-tab').forEach((el16) => {
      el16.addEventListener('click', () => {
        const mode = el16.dataset.mode === 'update' ? 'update' : 'create';
        if (mode === this._createPanelState?.mode) return;
        this._setCreatePanelState({
          mode: mode,
          updateConfirmOpen: false,
          customCategoryEditing: false,
          customCategoryDraft: '',
          error: '',
        });
        if (mode === 'update' && !this._createPanelState?.selectedAssetId) {
          const value70 = this._getFilteredUpdateAssets()[0] || null;
          value70 && this._syncCreatePanelDraftFromTarget(value70);
        }
        this._renderCreatePanelContent();
      });
    });
    const el17 = el10.querySelector('#asset-create-name');
    el17 &&
      el17.addEventListener('input', (name4) => {
        this._setCreatePanelState({
          draft: { name: name4.target.value || '' },
          updateConfirmOpen: false,
          error: '',
        });
      });
    const el18 = el10.querySelector('#asset-update-search');
    el18 &&
      el18.addEventListener('input', (updateSearchKeyword) => {
        (this._setCreatePanelState({
          updateSearchKeyword: updateSearchKeyword.target.value || '',
          updateConfirmOpen: false,
          error: '',
        }),
          this._renderCreatePanelContent());
      });
    el10.querySelectorAll('.v2-asset-update-item').forEach((el19) => {
      el19.addEventListener('click', () => {
        const value71 = String(el19.dataset.assetId || ''),
          enabled16 = this._getSortedAssets().find((item18) => String(item18?.id || '') === value71);
        if (!enabled16) return;
        (this._syncCreatePanelDraftFromTarget(enabled16), this._renderCreatePanelContent());
      });
    });
    const el20 = el10.querySelector('#asset-create-submit');
    el20 &&
      el20.addEventListener('click', () => {
        this._submitCreatePanel();
      });
    const el21 = el10.querySelector('#asset-join-submit');
    el21 &&
      el21.addEventListener('click', () => {
        this._joinCreatePanelToAsset();
      });
  }
  async ['_submitCreatePanel']() {
    const enabled17 = this._createPanelState,
      enabled18 = this.createPanel;
    if (!enabled17 || !enabled18 || enabled17.saving) return;
    const value72 = Array.isArray(enabled17.selectedIds) ? enabled17.selectedIds : [],
      list14 = this._getSelectedAssetNodes(value72);
    if (!list14.length) {
      (this._setCreatePanelState({ error: assetManagerText('errors.noSavableNodes') }),
        this._renderCreatePanelContent());
      return;
    }
    const name5 =
        String(this._createPanelState?.draft?.name || '').trim() || assetManagerText('unnamedAsset'),
      category5 = String(this._createPanelState?.draft?.category || '').trim() || this.activeTab;
    if (enabled17.mode === 'update') {
      const id3 = this._getFilteredUpdateAssets().find(
        (item19) => String(item19?.id || '') === String(enabled17.selectedAssetId || ''),
      );
      if (!id3) {
        (this._setCreatePanelState({ error: assetManagerText('errors.selectAssetToUpdate') }),
          this._renderCreatePanelContent());
        return;
      }
      if (!enabled17.updateConfirmOpen) {
        (this._setCreatePanelState({ updateConfirmOpen: true, error: '' }), this._renderCreatePanelContent());
        return;
      }
      const value73 = this._buildAssetPayloadFromSelection(value72, {
        id: id3.id,
        name: name5,
        category: category5,
        createdAt: id3.createdAt || id3.updatedAt || Date.now(),
        updatedAt: Date.now(),
      });
      (this._setCreatePanelState({ saving: true, savingAction: 'overwrite', error: '' }),
        this._renderCreatePanelContent());
      try {
        (await saveAssetToServer(value73),
          this._upsertLocalAsset(value73),
          this._scheduleVideoThumbJobs(),
          (this._openAssetId =
            String(value73.id || '') === this._openAssetId ? value73.id : this._openAssetId),
          window.showToast?.(assetManagerText('toasts.assetUpdated'), 'success'),
          this.closeCreatePanel(),
          this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
      } catch (value74) {
        (this._setCreatePanelState({
          saving: false,
          savingAction: '',
          error: assetManagerText('errors.assetUpdateFailed'),
        }),
          this._renderCreatePanelContent(),
          console.error(value74),
          window.showToast?.(assetManagerText('errors.assetUpdateFailed'), 'error'));
      }
      return;
    }
    const value75 = this._buildAssetPayloadFromSelection(value72, {
      name: name5,
      category: category5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    (this._setCreatePanelState({ saving: true, savingAction: 'create', error: '' }),
      this._renderCreatePanelContent());
    try {
      (await saveAssetToServer(value75),
        this._upsertLocalAsset(value75),
        this._scheduleVideoThumbJobs(),
        window.showToast?.(assetManagerText('toasts.assetCreated'), 'success'),
        this._playCreateAssetFly(enabled18),
        this.closeCreatePanel(),
        this.sidebarPanel?.classList.contains('show') &&
          ((this._newAssetPulseId = String(value75.id || '')), this.renderSidebarContent()));
    } catch (value76) {
      (this._setCreatePanelState({
        saving: false,
        savingAction: '',
        error: assetManagerText('errors.assetCreateFailed'),
      }),
        this._renderCreatePanelContent(),
        console.error(value76),
        window.showToast?.(assetManagerText('errors.assetCreateFailed'), 'error'));
    }
  }
  async ['_joinCreatePanelToAsset']() {
    const enabled19 = this._createPanelState,
      enabled20 = this.createPanel;
    if (!enabled19 || !enabled20 || enabled19.saving) return;
    const value77 = Array.isArray(enabled19.selectedIds) ? enabled19.selectedIds : [],
      list15 = this._getSelectedAssetNodes(value77);
    if (!list15.length) {
      (this._setCreatePanelState({ error: assetManagerText('errors.noJoinableNodes') }),
        this._renderCreatePanelContent());
      return;
    }
    const enabled21 = this._getFilteredUpdateAssets().find(
      (item20) => String(item20?.id || '') === String(enabled19.selectedAssetId || ''),
    );
    if (!enabled21) {
      (this._setCreatePanelState({ error: assetManagerText('errors.selectAssetToJoin') }),
        this._renderCreatePanelContent());
      return;
    }
    const name6 =
        String(this._createPanelState?.draft?.name || '').trim() || assetManagerText('unnamedAsset'),
      category6 = String(this._createPanelState?.draft?.category || '').trim() || this.activeTab,
      value78 = this._buildAssetAppendPayload(enabled21, value77, {
        name: name6,
        category: category6,
        updatedAt: Date.now(),
      });
    (this._setCreatePanelState({ saving: true, savingAction: 'join', updateConfirmOpen: false, error: '' }),
      this._renderCreatePanelContent());
    try {
      (await saveAssetToServer(value78),
        this._upsertLocalAsset(value78),
        this._scheduleVideoThumbJobs(),
        (this._openAssetId = String(value78.id || '') === this._openAssetId ? value78.id : this._openAssetId),
        window.showToast?.(assetManagerText('toasts.assetJoined'), 'success'),
        this.closeCreatePanel(),
        this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
    } catch (value79) {
      (this._setCreatePanelState({
        saving: false,
        savingAction: '',
        error: assetManagerText('errors.assetJoinFailed'),
      }),
        this._renderCreatePanelContent(),
        console.error(value79),
        window.showToast?.(assetManagerText('errors.assetJoinFailed'), 'error'));
    }
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: viewport } = appStore.getState(),
      value80 = window.innerWidth / 2,
      value81 = window.innerHeight / 2,
      enabled22 = document.documentElement?.clientWidth || window.innerWidth || 0,
      enabled23 = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!enabled22 || !enabled23) return screenToWorld(value80, value81, viewport);
    let value82 = 0,
      value83 = 0,
      value84 = enabled22,
      value85 = enabled23;
    const list16 = [],
      value86 = document.querySelector('header');
    if (value86) list16.push(value86);
    const value87 = document.querySelector('.sidebar-floating');
    if (value87) list16.push(value87);
    if (this.sidebarPanel?.classList?.contains('show')) list16.push(this.sidebarPanel);
    const value88 = 8;
    for (const el22 of list16) {
      if (!el22?.isConnected) continue;
      const box2 = el22.getBoundingClientRect(),
        value89 = Math.max(value82, box2.left),
        value90 = Math.max(value83, box2.top),
        value91 = Math.min(value84, box2.right),
        value92 = Math.min(value85, box2.bottom);
      if (value91 <= value89 || value92 <= value90) continue;
      if (box2.left <= value82 + value88 && box2.right > value82 + value88) {
        value82 = Math.max(value82, box2.right);
        continue;
      }
      if (box2.right >= value84 - value88 && box2.left < value84 - value88) {
        value84 = Math.min(value84, box2.left);
        continue;
      }
      if (box2.top <= value83 + value88 && box2.bottom > value83 + value88) {
        value83 = Math.max(value83, box2.bottom);
        continue;
      }
      if (box2.bottom >= value85 - value88 && box2.top < value85 - value88) {
        value85 = Math.min(value85, box2.top);
        continue;
      }
    }
    const count7 = value84 - value82,
      count8 = value85 - value83,
      value93 = count7 > 40 ? value82 + count7 / 2 : value80,
      value94 = count8 > 40 ? value83 + count8 / 2 : value81;
    return screenToWorld(value93, value94, viewport);
  }
  ['_calcNodesBBox'](value95) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const box3 of value95 || []) {
      if (!box3) continue;
      const value96 = Number(box3.x) || 0,
        value97 = Number(box3.y) || 0,
        value98 = Number(box3.width ?? box3.w) || 100,
        value99 = Number(box3.height ?? box3.h) || 100;
      ((minX = Math.min(minX, value96)),
        (minY = Math.min(minY, value97)),
        (maxX = Math.max(maxX, value96 + value98)),
        (maxY = Math.max(maxY, value97 + value99)));
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY))
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
    const w = Math.max(0, maxX - minX),
      h = Math.max(0, maxY - minY);
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
  ['_preloadThumb'](value100) {
    const enabled24 = String(value100 || '');
    if (!enabled24) return;
    if (enabled24.startsWith('data:')) return;
    if (this._thumbPreloadSet.has(enabled24)) return;
    (this._thumbPreloadSet.add(enabled24), this._ensureThumbDecoded(enabled24));
  }
  ['_ensureThumbDecoded'](value101) {
    const enabled25 = String(value101 || '');
    if (!enabled25) return Promise.resolve(false);
    if (enabled25.startsWith('data:')) return Promise.resolve(true);
    const value102 = this._thumbDecodePromiseMap.get(enabled25);
    if (value102) return value102;
    const preloadCanvasImage2 = preloadCanvasImage(enabled25, { priority: 20, fetchPriority: 'auto' }).then(
      () => true,
      () => false,
    );
    return (this._thumbDecodePromiseMap.set(enabled25, preloadCanvasImage2), preloadCanvasImage2);
  }
  ['_isVideoMediaSrc'](value103) {
    const value104 = String(value103 || '').toLowerCase();
    return (
      value104.endsWith('.mp4') ||
      value104.endsWith('.webm') ||
      value104.endsWith('.mov') ||
      value104.endsWith('.mkv') ||
      value104.endsWith('.m4v')
    );
  }
  async ['_captureVideoFirstFrameDataUrl'](value105) {
    const enabled26 = String(value105 || '');
    if (!enabled26) return '';
    return await new Promise((handler4) => {
      const el23 = document.createElement('video');
      ((el23.preload = 'auto'),
        (el23.muted = true),
        (el23.playsInline = true),
        (el23.crossOrigin = 'anonymous'));
      const run3 = () => {
          (el23.removeAttribute('src'), el23.load());
        },
        handler5 = () => {
          (run3(), handler4(''));
        },
        async2 = async () => {
          try {
            const count9 = Number.isFinite(el23.duration) ? el23.duration : 0,
              value106 = count9 > 0 ? Math.min(0.08, Math.max(0, count9 - 0.08)) : 0,
              value107 = () => {
                try {
                  const enabled27 = el23.videoWidth || 0,
                    enabled28 = el23.videoHeight || 0;
                  if (!enabled27 || !enabled28) return handler5();
                  const value108 = 0x140,
                    value109 = 0x140,
                    value110 = Math.min(1, value108 / enabled27, value109 / enabled28),
                    value111 = Math.max(1, Math.round(enabled27 * value110)),
                    value112 = Math.max(1, Math.round(enabled28 * value110)),
                    box4 = document.createElement('canvas');
                  ((box4.width = value111), (box4.height = value112));
                  const ctx = box4.getContext('2d');
                  ctx.drawImage(el23, 0, 0, value111, value112);
                  const value113 = box4.toDataURL('image/jpeg', 0.82);
                  (run3(), handler4(value113));
                } catch (value114) {
                  handler5();
                } finally {
                  el23.removeEventListener('seeked', value107);
                }
              };
            (el23.addEventListener('seeked', value107, { once: true }), (el23.currentTime = value106));
          } catch (value115) {
            handler5();
          }
        };
      (el23.addEventListener('error', handler5, { once: true }),
        el23.addEventListener('loadeddata', async2, { once: true }),
        attachMediaElementPlaybackSource(el23, enabled26, { preload: 'auto' }).catch(() => {
          if (!String(el23.getAttribute('src') || el23.src || '').trim()) {
            el23.src = enabled26;
            try {
              el23.load?.();
            } catch {}
          }
        }));
    });
  }
  ['_scheduleVideoThumbJobs']() {
    if (this._videoThumbTimer) return;
    this._videoThumbTimer = window.setTimeout(() => {
      ((this._videoThumbTimer = 0), this._runVideoThumbJobs());
    }, 0);
  }
  ['_scheduleSidebarRender']() {
    if (!this.sidebarPanel?.classList.contains('show')) return;
    if (this._renamingAssetId) return;
    if (this._sidebarRenderRaf) return;
    this._sidebarRenderRaf = window.requestAnimationFrame(() => {
      this._sidebarRenderRaf = 0;
      if (!this.sidebarPanel?.classList.contains('show')) return;
      if (this._renamingAssetId) return;
      this.renderSidebarContent();
    });
  }
  ['_beginRenameAsset'](value116) {
    const enabled29 = String(value116 || '');
    if (!enabled29) return;
    if (this._pendingDeleteAssetId) this._pendingDeleteAssetId = '';
    ((this._renamingAssetId = enabled29), this.renderSidebarContent());
  }
  ['_cancelRenameAsset']() {
    if (!this._renamingAssetId) return;
    ((this._renamingAssetId = ''), this.renderSidebarContent());
  }
  async ['_commitRenameAsset'](value117, value118) {
    const enabled30 = String(value117 || ''),
      enabled31 = String(value118 || '').trim();
    if (!enabled30) return;
    if (!enabled31) {
      window.showToast?.(assetManagerText('errors.nameRequired'), 'error');
      return;
    }
    const error7 = (this.assets || []).find((item21) => String(item21?.id || '') === enabled30);
    if (!error7) return;
    const value119 = String(error7?.name || ''),
      value120 = error7?.updatedAt;
    if (value119 === enabled31) {
      ((this._renamingAssetId = ''), this.renderSidebarContent());
      return;
    }
    ((error7.name = enabled31), (error7.updatedAt = Date.now()));
    try {
      (await saveAssetToServer(error7),
        this._upsertLocalAsset(error7),
        window.showToast?.(assetManagerText('toasts.renamed'), 'success'));
    } catch (value121) {
      ((error7.name = value119),
        (error7.updatedAt = value120),
        window.showToast?.(assetManagerText('errors.renameFailed'), 'error'));
    } finally {
      ((this._renamingAssetId = ''), this.renderSidebarContent());
    }
  }
  async ['_runVideoThumbJobs']() {
    let count10 = 2;
    for (const enabled32 of this.assets || []) {
      if (count10 <= 0) break;
      const assetId = String(enabled32?.id || '').trim();
      if (!assetId) continue;
      const list17 = Array.isArray(enabled32?.items) ? enabled32.items : [];
      for (let count11 = 0; count11 < list17.length; count11++) {
        if (count10 <= 0) break;
        const value122 = list17[count11],
          _normalizeAssetType4 = _normalizeAssetType(value122?.type);
        if (_normalizeAssetType4 !== 'video') continue;
        const value123 = String(value122?.thumbSrc || '');
        if (value123 && !this._isVideoMediaSrc(value123)) continue;
        const value124 = assetId + ':' + count11;
        if (this._videoThumbInFlight.has(value124)) continue;
        (this._videoThumbInFlight.add(value124), (count10 -= 1));
        const value125 = value123 || _resolveNodeStableThumbSrc(value122?.nodeData);
        this._captureVideoFirstFrameDataUrl(value125)
          .then(async (dataUrl) => {
            if (!String(dataUrl || '').startsWith('data:image/')) return;
            const response = await saveAssetThumbToServer({
                assetId: assetId,
                key: String(count11),
                dataUrl: dataUrl,
              }),
              enabled33 = String(response?.url || '');
            if (!enabled33) return;
            value122.thumbSrc = enabled33;
            if (!enabled32.coverUrl && count11 === 0) enabled32.coverUrl = enabled33;
            (await saveAssetToServer(enabled32),
              upsertAssetMentionAsset(enabled32),
              this.sidebarPanel?.classList.contains('show') && this._scheduleSidebarRender());
          })
          .catch(() => {})
          .finally(() => {
            this._videoThumbInFlight.delete(value124);
          });
      }
    }
  }
  async ['loadAssetsFromServer']() {
    try {
      const fetchAssetsFromServer2 = await fetchAssetsFromServer();
      ((this.assets = _sortAssetsByUpdatedTime(
        (Array.isArray(fetchAssetsFromServer2) ? fetchAssetsFromServer2 : [])
          .map((item22) => this._normalizeAssetEntity(item22))
          .filter(Boolean),
      )),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.assets.forEach((enabled34) => {
          !enabled34.coverUrl &&
            enabled34.nodes &&
            enabled34.nodes[0] &&
            (enabled34.coverUrl = _resolveNodeStableThumbSrc(enabled34.nodes[0]));
          if (Array.isArray(enabled34.items))
            enabled34.items.forEach((enabled35) => {
              !enabled35.thumbSrc &&
                enabled35.nodeData &&
                (enabled35.thumbSrc = _resolveNodeStableThumbSrc(enabled35.nodeData));
            });
          else
            Array.isArray(enabled34.nodes) &&
              (enabled34.items = enabled34.nodes.map((item23) => _buildAssetItem(item23)));
        }),
        setAssetMentionAssets(this._getMentionEligibleAssets()));
      let count12 = 0;
      for (const value126 of this.assets) {
        if (count12 >= 32) break;
        value126?.coverUrl && (this._preloadThumb(value126.coverUrl), (count12 += 1));
        const value127 = Array.isArray(value126?.items) ? value126.items : [];
        for (const value128 of value127) {
          if (count12 >= 32) break;
          value128?.thumbSrc && (this._preloadThumb(value128.thumbSrc), (count12 += 1));
        }
      }
      (this._scheduleVideoThumbJobs(),
        this.sidebarPanel && this.sidebarPanel.classList.contains('show') && this.renderSidebarContent());
    } catch (value129) {
      console.error('加载全局资产失败', value129);
    }
  }
  async ['showCreatePanel'](list18, value130, value131 = {}) {
    if (!list18 || list18.length === 0) return;
    (void value130, void value131, this.closeCreatePanel());
    const el24 = document.createElement('div');
    el24.className = 'v2-asset-create-backdrop show';
    const el25 = document.createElement('div');
    ((el25.className = 'v2-asset-create-panel'),
      el25.setAttribute('role', 'dialog'),
      el25.setAttribute('aria-modal', 'true'),
      el25.setAttribute('aria-label', assetManagerText('title')));
    const value132 = appStore.getState(),
      value133 = value132.nodes[list18[0]];
    (el24.appendChild(el25),
      document.body.appendChild(el24),
      (this.createPanelBackdrop = el24),
      (this.createPanel = el25));
    const value134 = await this._resolveCreatePanelCover(value133);
    if (!this.createPanel || this.createPanel !== el25) {
      String(this._createPanelCoverObjectUrl || '').startsWith('blob:') &&
        URL.revokeObjectURL(this._createPanelCoverObjectUrl);
      this._createPanelCoverObjectUrl = '';
      return;
    }
    ((this._createPanelState = this._createDefaultPanelState(list18, value134)),
      this._renderCreatePanelContent(),
      el24.addEventListener('pointerdown', (event6) => {
        if (event6.target === el24) this.closeCreatePanel();
      }),
      (this._createPanelKeydownHandler = (event7) => {
        if (event7.key !== 'Escape') return;
        if (this._createPanelDropdownEl?.contains(event7.target)) return;
        this.closeCreatePanel();
      }),
      document.addEventListener('keydown', this._createPanelKeydownHandler));
  }
  ['_playCreateAssetFly'](el26) {
    const value135 = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (value135) return;
    const el27 = el26 && el26.isConnected ? el26 : this.createPanel;
    if (!el27?.isConnected) return;
    const value136 = el27.querySelector('.v2-asset-create-cover'),
      el28 = value136?.firstElementChild;
    if (!el28) return;
    const box5 = el28.getBoundingClientRect();
    if (!box5.width || !box5.height) return;
    const el29 = document.getElementById('btnAssets'),
      box6 = el29?.getBoundingClientRect?.();
    if (!box6) return;
    const el30 = document.createElement('div');
    ((el30.className = 'v2-asset-create-fly'),
      (el30.style.left = box5.left + 'px'),
      (el30.style.top = box5.top + 'px'),
      (el30.style.width = box5.width + 'px'),
      (el30.style.height = box5.height + 'px'));
    const value137 = el28.cloneNode(true);
    if (value137?.id) value137.removeAttribute('id');
    (el30.appendChild(value137), document.body.appendChild(el30));
    const value138 = box5.left + box5.width / 2,
      value139 = box5.top + box5.height / 2,
      value140 = box6.left + box6.width / 2,
      value141 = box6.top + box6.height / 2,
      value142 = value140 - value138,
      value143 = value141 - value139,
      value144 = 0.12,
      value145 = el30.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          {
            transform: 'translate(' + value142 + 'px,' + value143 + 'px) scale(' + value144 + ')',
            opacity: 0.2,
          },
        ],
        { duration: 0x208, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    value145.onfinish = () => {
      (el30.remove(),
        el29?.animate &&
          el29.animate(
            [
              { transform: 'scale(1)', filter: 'brightness(1)' },
              { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
              { transform: 'scale(1)', filter: 'brightness(1)' },
            ],
            { duration: 0x104, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
          ));
    };
  }
  ['closeCreatePanel']() {
    (this._createPanelDropdownOutsideHandler &&
      (document.removeEventListener('pointerdown', this._createPanelDropdownOutsideHandler),
      (this._createPanelDropdownOutsideHandler = null)),
      this._createPanelDropdownEl &&
        (this._createPanelDropdownEl.remove(), (this._createPanelDropdownEl = null)),
      this._createPanelKeydownHandler &&
        (document.removeEventListener('keydown', this._createPanelKeydownHandler),
        (this._createPanelKeydownHandler = null)),
      this._createPanelCoverObjectUrl &&
        (String(this._createPanelCoverObjectUrl).startsWith('blob:') &&
          URL.revokeObjectURL(this._createPanelCoverObjectUrl),
        (this._createPanelCoverObjectUrl = '')),
      this.createPanel && (this.createPanel.remove(), (this.createPanel = null)),
      this.createPanelBackdrop && (this.createPanelBackdrop.remove(), (this.createPanelBackdrop = null)),
      (this._createPanelState = null));
  }
  ['initSidebarPanel']() {
    ((this.sidebarPanel = document.createElement('div')),
      (this.sidebarPanel.className = 'v2-asset-sidebar-panel'),
      (this.sidebarPanel.innerHTML =
        '\n      <div class="v2-asset-sidebar-header">\n        <button type="button" class="v2-asset-back" data-ui-action="asset-back" aria-label="' +
        _escapeHtml(assetManagerText('back')) +
        '">‹</button>\n        <div class="v2-asset-sidebar-title" id="asset-sidebar-title">\n          <span class="v2-asset-sidebar-title-text" id="asset-sidebar-title-text">' +
        assetManagerText('title') +
        '</span>\n        </div>\n      </div>\n      <div class="v2-asset-sidebar-tabs-shell" id="asset-sidebar-tabs-shell">\n        <button\n          type="button"\n          class="v2-asset-sidebar-tabs-nav v2-asset-sidebar-tabs-nav--prev"\n          data-ui-action="asset-tabs-scroll-prev"\n          aria-label="' +
        _escapeHtml(assetManagerText('tabsPrevAria')) +
        '"\n          hidden\n        >‹</button>\n        <div class="v2-asset-sidebar-tabs" id="asset-sidebar-tabs">\n          ' +
        this._renderSidebarTabsHtml() +
        '\n        </div>\n        <button\n          type="button"\n          class="v2-asset-sidebar-tabs-nav v2-asset-sidebar-tabs-nav--next"\n          data-ui-action="asset-tabs-scroll-next"\n          aria-label="' +
        _escapeHtml(assetManagerText('tabsNextAria')) +
        '"\n          hidden\n        >›</button>\n      </div>\n      <div class="v2-asset-sidebar-content" id="asset-sidebar-content"></div>\n    '));
    const el31 = document.querySelector('.sidebar-floating');
    el31 ? el31.appendChild(this.sidebarPanel) : document.body.appendChild(this.sidebarPanel);
    const el32 = this.sidebarPanel.querySelector('#asset-sidebar-tabs');
    (el32.addEventListener('click', (event8) => {
      if (event8.target.closest("[data-ui-action='asset-category-delete']")) return;
      const el33 = event8.target.closest('.v2-asset-sidebar-tab');
      el33 &&
        ((this._renamingAssetId = ''),
        (this._pendingDeleteAssetId = ''),
        (this.activeTab = el33.dataset.cat),
        (this._openAssetId = null),
        el32.querySelectorAll('.v2-asset-sidebar-tab').forEach((el34) => el34.classList.remove('active')),
        el33.classList.add('active'),
        this.renderSidebarContent());
    }),
      el32.addEventListener('scroll', () => this._updateSidebarTabsOverflowHint(), { passive: true }),
      this.sidebarPanel.addEventListener('click', (event9) => {
        const el35 = event9.target.closest('[data-ui-action]'),
          value146 = el35?.dataset?.uiAction || '';
        if (value146 === 'asset-tabs-scroll-prev') {
          (event9.preventDefault(), event9.stopPropagation(), this._scrollSidebarTabs(-1));
          return;
        }
        if (value146 === 'asset-tabs-scroll-next') {
          (event9.preventDefault(), event9.stopPropagation(), this._scrollSidebarTabs(1));
          return;
        }
        if (value146 === 'asset-category-delete') {
          (event9.preventDefault(), event9.stopPropagation());
          const value147 = el35?.dataset?.cat;
          if (value147) void this._deleteUserCategory(value147);
          return;
        }
        if (value146 === 'asset-back') {
          ((this._renamingAssetId = ''),
            (this._pendingDeleteAssetId = ''),
            (this._openAssetId = null),
            this.renderSidebarContent());
          return;
        }
        if (value146 === 'asset-delete-open') {
          (event9.preventDefault(), event9.stopPropagation(), (this._renamingAssetId = ''));
          const enabled36 = el35?.dataset?.assetId;
          if (!enabled36) return;
          ((this._pendingDeleteAssetId = enabled36), this.renderSidebarContent());
          return;
        }
        if (value146 === 'asset-delete-cancel') {
          (event9.preventDefault(),
            event9.stopPropagation(),
            (this._pendingDeleteAssetId = ''),
            this.renderSidebarContent());
          return;
        }
        if (value146 === 'asset-delete-confirm') {
          (event9.preventDefault(), event9.stopPropagation());
          const enabled37 = el35?.dataset?.assetId;
          if (!enabled37) return;
          ((this._pendingDeleteAssetId = ''), this._deleteAsset(enabled37));
          return;
        }
        if (value146 === 'asset-add-all') {
          (event9.preventDefault(),
            event9.stopPropagation(),
            (this._renamingAssetId = ''),
            (this._pendingDeleteAssetId = ''));
          const value148 = el35?.dataset?.assetId;
          if (value148) this.restoreAssetToCanvas(value148);
          return;
        }
        const el36 = event9.target.closest('.v2-asset-subitem');
        if (el36) {
          const value149 = el36.dataset.assetId,
            value150 = Number(el36.dataset.idx);
          if (value149 && Number.isFinite(value150)) this._restoreAssetSubItem(value149, value150);
          return;
        }
        const el37 = event9.target.closest('.v2-asset-item');
        el37 &&
          el37.dataset?.id &&
          ((this._renamingAssetId = ''),
          (this._pendingDeleteAssetId = ''),
          (this._openAssetId = el37.dataset.id),
          this.renderSidebarContent());
      }));
    const button = document.getElementById('btnAssets');
    if (button) {
      let enabled38 = false;
      const open = () => {
        (!this.sidebarPanel.classList.contains('show') && this.showSidebarPanel(),
          !enabled38 &&
            ((enabled38 = true),
            this.loadAssetsFromServer().finally(() => {
              enabled38 = false;
            })));
      };
      registerSidebarSubmenu({
        key: 'assets',
        button: button,
        panel: this.sidebarPanel,
        open: open,
        close: () => this.hideSidebarPanel(),
        isOpen: () => this.sidebarPanel.classList.contains('show'),
      });
    }
  }
  ['showSidebarPanel']() {
    (this.renderSidebarContent(), this.sidebarPanel.classList.add('show'));
  }
  ['hideSidebarPanel']() {
    (this.sidebarPanel.classList.remove('show'),
      document.getElementById('btnAssets')?.classList.remove('active'));
  }
  ['_getVisibleAssetCardsInList']() {
    const listView = this.sidebarPanel?.querySelector('#asset-sidebar-content > .v2-asset-view-list');
    if (!listView) return { listView: null, cards: [] };
    const cards = Array.from(listView.querySelectorAll(':scope > .v2-asset-item')).filter(
      (el38) => el38.style.display !== 'none',
    );
    return { listView: listView, cards: cards };
  }
  ['_captureRectsById'](value151) {
    const map2 = new Map();
    for (const el39 of value151) {
      const enabled39 = String(el39.dataset?.id || '');
      if (!enabled39) continue;
      map2.set(enabled39, el39.getBoundingClientRect());
    }
    return map2;
  }
  ['_playFlip'](el40, map3) {
    if (!el40 || !map3?.size) return;
    const value152 = Array.from(el40.querySelectorAll(':scope > .v2-asset-item')).filter(
        (el41) => el41.style.display !== 'none',
      ),
      map4 = new Map();
    for (const el42 of value152) {
      const enabled40 = String(el42.dataset?.id || '');
      if (!enabled40) continue;
      map4.set(enabled40, el42.getBoundingClientRect());
    }
    for (const el43 of value152) {
      const enabled41 = String(el43.dataset?.id || '');
      if (!enabled41) continue;
      const box7 = map3.get(enabled41),
        box8 = map4.get(enabled41);
      if (!box7 || !box8) continue;
      const enabled42 = box7.left - box8.left,
        enabled43 = box7.top - box8.top;
      if (!enabled42 && !enabled43) continue;
      el43.animate(
        [
          { transform: 'translate(' + enabled42 + 'px, ' + enabled43 + 'px)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    }
  }
  ['_playDeleteShake'](el44) {
    if (!el44) return;
    (el44.classList.remove('is-delete-shaking'),
      void el44.offsetWidth,
      el44.classList.add('is-delete-shaking'),
      window.setTimeout(() => {
        if (el44.isConnected) el44.classList.remove('is-delete-shaking');
      }, 240));
  }
  async ['_deleteAsset'](value153) {
    const enabled44 = String(value153 || '');
    if (!enabled44) return;
    const { listView: listView2, cards: cards2 } = this._getVisibleAssetCardsInList(),
      value154 = this._captureRectsById(cards2);
    try {
      await deleteAssetFromServer(enabled44);
    } catch (value155) {
      window.showToast?.(assetManagerText('deleteFailed'), 'error');
      return;
    }
    ((this.assets = (this.assets || []).filter((item24) => String(item24?.id || '') !== enabled44)),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      removeAssetMentionAsset(enabled44));
    if (this._openAssetId === enabled44) this._openAssetId = null;
    const el45 = this._assetCardPool?.get?.(enabled44);
    if (el45?.isConnected) el45.remove();
    (this._assetCardPool?.delete?.(enabled44),
      this.renderSidebarContent(),
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const { listView: listView3 } = this._getVisibleAssetCardsInList();
          this._playFlip(listView3, value154);
        });
      }));
  }
  async ['_deleteUserCategory'](value156) {
    const enabled45 = this._normalizeCategoryName(value156);
    if (!enabled45 || !this._isUserCategory(enabled45)) return;
    const value157 = this._getSortedAssets().some(
      (item25) => this._categoryKey(item25?.category) === this._categoryKey(enabled45),
    );
    if (value157) {
      window.showToast?.(assetManagerText('categoryHasAssets'), 'warn');
      return;
    }
    const list19 = [...this.userCategories];
    this.userCategories = list19.filter(
      (item26) => this._categoryKey(item26) !== this._categoryKey(enabled45),
    );
    this._categoryKey(this.activeTab) === this._categoryKey(enabled45) &&
      ((this.activeTab = DEFAULT_ASSET_CATEGORIES[0]), (this._openAssetId = null));
    (this._syncTabsFromAssets(), this._renderSidebarTabs(), this.renderSidebarContent());
    try {
      (await this._saveUserCategories(), window.showToast?.(assetManagerText('categoryDeleted'), 'success'));
    } catch (value158) {
      ((this.userCategories = list19),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.renderSidebarContent(),
        console.error(value158),
        window.showToast?.(assetManagerText('categoryDeleteFailed'), 'error'));
    }
  }
  ['_setThumbContent'](el46, value159, value160) {
    if (!el46) return;
    const value161 = String(value159 || ''),
      _normalizeAssetType5 = _normalizeAssetType(value160);
    if (value161 && !(_normalizeAssetType5 === 'video' && this._isVideoMediaSrc(value161))) {
      const value162 = el46.dataset.thumbSrc || '';
      if (el46.dataset.thumbKind === 'img' && value162 === value161) return;
      if (el46.dataset.pendingSrc === value161) return;
      el46.childElementCount === 0 &&
        el46.dataset.thumbKind !== 'img' &&
        ((el46.dataset.thumbKind = 'icon'),
        (el46.dataset.thumbType = String(value160 || 'other')),
        (el46.dataset.thumbSrc = ''),
        (el46.innerHTML = _renderAssetIcon(value160)));
      ((el46.dataset.pendingSrc = value161),
        this._ensureThumbDecoded(value161).then((enabled46) => {
          if (!enabled46) {
            if (el46.dataset.pendingSrc === value161) el46.dataset.pendingSrc = '';
            return;
          }
          if (!el46.isConnected) return;
          if (el46.dataset.pendingSrc !== value161) return;
          el46.dataset.pendingSrc = '';
          let el47 = el46.querySelector(':scope > img');
          !el47
            ? ((el47 = document.createElement('img')),
              (el47.alt = assetManagerText('thumbnailAlt')),
              (el47.draggable = false),
              (el47.decoding = 'async'),
              (el47.loading = 'eager'),
              (el47.className = 'v2-asset-thumb-img'))
            : el47.classList.add('v2-asset-thumb-img');
          if (el47.getAttribute('src') !== value161) el47.setAttribute('src', value161);
          ((el46.dataset.thumbKind = 'img'),
            (el46.dataset.thumbSrc = value161),
            (el46.firstElementChild !== el47 || el46.childElementCount !== 1) && el46.replaceChildren(el47));
        }));
      return;
    }
    const value163 = String(value160 || 'other');
    if (el46.dataset.thumbKind === 'icon' && el46.dataset.thumbType === value163) return;
    ((el46.dataset.thumbKind = 'icon'),
      (el46.dataset.thumbType = value163),
      (el46.dataset.thumbSrc = ''),
      (el46.dataset.pendingSrc = ''),
      (el46.innerHTML = _renderAssetIcon(value163)));
  }
  ['renderSidebarContent']() {
    const el48 = this.sidebarPanel?.querySelector('#asset-sidebar-content');
    if (!el48) return;
    const el49 = this.sidebarPanel.querySelector('#asset-sidebar-title-text'),
      el50 = this.sidebarPanel.querySelector('.v2-asset-back');
    this._renderSidebarTabs();
    const run4 = () => {
        let listView4 = el48.querySelector(':scope > .v2-asset-view-list');
        !listView4 &&
          ((listView4 = document.createElement('div')),
          (listView4.className = 'v2-asset-view-list'),
          el48.appendChild(listView4));
        let detailView = el48.querySelector(':scope > .v2-asset-view-detail');
        return (
          !detailView &&
            ((detailView = document.createElement('div')),
            (detailView.className = 'v2-asset-view-detail'),
            el48.appendChild(detailView)),
          el48
            .querySelectorAll(':scope > .v2-asset-item, :scope > .v2-asset-empty')
            .forEach((item27) => listView4.appendChild(item27)),
          el48
            .querySelectorAll(':scope > .v2-asset-detail-actions, :scope > .v2-asset-subgrid')
            .forEach((item28) => detailView.appendChild(item28)),
          { listView: listView4, detailView: detailView }
        );
      },
      { listView: listView5, detailView: detailView2 } = run4(),
      handler6 = (value164, value165, value166) => this._setThumbContent(value164, value165, value166),
      handler7 = (el51) => {
        let el52 = el51.querySelector(':scope > .v2-asset-cover-grid');
        if (!el52) {
          ((el52 = document.createElement('div')), (el52.className = 'v2-asset-cover-grid'));
          for (let count13 = 0; count13 < 4; count13++) {
            const value167 = document.createElement('div');
            ((value167.className = 'v2-asset-cover-cell'), el52.appendChild(value167));
          }
          el51.replaceChildren(el52);
        } else {
          const list20 = el52.querySelectorAll(':scope > .v2-asset-cover-cell');
          for (let count14 = list20.length; count14 < 4; count14++) {
            const value168 = document.createElement('div');
            ((value168.className = 'v2-asset-cover-cell'), el52.appendChild(value168));
          }
        }
        return el52;
      },
      handler8 = (el53, error8) => {
        let el54 = el53.querySelector(':scope > .v2-asset-item-load'),
          el55 = el53.querySelector(':scope > .v2-asset-item-delete'),
          el56 = el53.querySelector(':scope > .v2-asset-item-delete-confirm'),
          enabled47 = el53.querySelector(':scope > .v2-asset-item-cover'),
          el57 = el53.querySelector(':scope > .v2-asset-item-name');
        !el54 &&
          ((el54 = document.createElement('button')),
          (el54.type = 'button'),
          (el54.className = 'v2-asset-item-load'),
          (el54.dataset.uiAction = 'asset-add-all'),
          (el54.title = assetManagerText('loadToCanvas')),
          el54.setAttribute('aria-label', assetManagerText('loadToCanvas')),
          (el54.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'),
          el53.appendChild(el54));
        !el55 &&
          ((el55 = document.createElement('button')),
          (el55.type = 'button'),
          (el55.className = 'v2-asset-item-delete'),
          (el55.dataset.uiAction = 'asset-delete-open'),
          el55.setAttribute('aria-label', assetManagerText('deleteAsset')),
          (el55.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'),
          el53.appendChild(el55));
        if (!el56) {
          ((el56 = document.createElement('div')),
            (el56.className = 'v2-asset-item-delete-confirm'),
            (el56.hidden = true),
            el56.addEventListener('click', (event10) => {
              if (event10.target !== el56) return;
              (event10.stopPropagation(), (this._pendingDeleteAssetId = ''), this.renderSidebarContent());
            }));
          const el58 = document.createElement('button');
          ((el58.type = 'button'),
            (el58.className = 'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--danger'),
            (el58.dataset.uiAction = 'asset-delete-confirm'),
            (el58.textContent = '✔'),
            el58.setAttribute('aria-label', assetManagerText('confirm')));
          const el59 = document.createElement('button');
          ((el59.type = 'button'),
            (el59.className = 'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--neutral'),
            (el59.dataset.uiAction = 'asset-delete-cancel'),
            (el59.textContent = '×'),
            el59.setAttribute('aria-label', assetManagerText('cancel')),
            el56.appendChild(el58),
            el56.appendChild(el59),
            el53.appendChild(el56));
        }
        const value169 = String(error8?.id || '');
        ((el54.dataset.assetId = value169),
          (el54.disabled = !Array.isArray(error8?.nodes) || error8.nodes.length === 0),
          (el55.dataset.assetId = value169),
          el56.querySelectorAll(':scope > button').forEach((el60) => {
            el60.dataset.assetId = value169;
          }));
        const enabled48 = this._pendingDeleteAssetId === value169;
        ((el55.hidden = enabled48), (el56.hidden = !enabled48));
        !enabled47 &&
          ((enabled47 = document.createElement('div')),
          (enabled47.className = 'v2-asset-item-cover'),
          el53.appendChild(enabled47));
        !el57 &&
          ((el57 = document.createElement('div')),
          (el57.className = 'v2-asset-item-name'),
          el57.addEventListener('click', (event11) => {
            event11.stopPropagation();
            const el61 = event11.currentTarget?.closest?.('.v2-asset-item'),
              value170 = el61?.dataset?.id || '';
            this._beginRenameAsset(value170);
          }),
          el53.appendChild(el57));
        const value171 = String(error8?.name || '');
        if (this._renamingAssetId === value169) {
          el57.classList.add('is-editing');
          let el62 = el57.querySelector(':scope > input.v2-asset-item-name-input');
          !el62 &&
            ((el62 = document.createElement('input')),
            (el62.type = 'text'),
            (el62.className = 'v2-asset-item-name-input'),
            el62.addEventListener('click', (event12) => event12.stopPropagation()),
            el62.addEventListener('keydown', (event13) => {
              if (event13.key === 'Enter') {
                (event13.preventDefault(),
                  event13.stopPropagation(),
                  (el62.dataset.submitted = '1'),
                  this._commitRenameAsset(value169, el62.value));
                return;
              }
              event13.key === 'Escape' &&
                (event13.preventDefault(), event13.stopPropagation(), this._cancelRenameAsset());
            }),
            el62.addEventListener('blur', () => {
              if (el62.dataset.submitted === '1') return;
              this._commitRenameAsset(value169, el62.value);
            }),
            el57.replaceChildren(el62));
          if (el62.value !== value171) el62.value = value171;
          if (el62.getAttribute('aria-label') !== assetManagerText('createPanel.assetName'))
            el62.setAttribute('aria-label', assetManagerText('createPanel.assetName'));
          window.requestAnimationFrame(() => {
            if (!el62.isConnected) return;
            try {
              (el62.focus(), el62.select?.());
            } catch (value172) {}
          });
        } else {
          if (el57.classList.contains('is-editing')) el57.classList.remove('is-editing');
          const value173 = el57.querySelector(':scope > input.v2-asset-item-name-input');
          if (value173) el57.replaceChildren();
          if (el57.textContent !== value171) el57.textContent = value171;
          if (el57.getAttribute('title') !== value171) el57.setAttribute('title', value171);
        }
        const list21 = Array.isArray(error8?.items)
          ? error8.items
          : Array.isArray(error8?.nodes)
            ? error8.nodes.map((item29) => _buildAssetItem(item29))
            : [];
        if (list21.length > 0) {
          const el63 = handler7(enabled47),
            value174 = el63.querySelectorAll(':scope > .v2-asset-cover-cell');
          for (let count15 = 0; count15 < 4; count15++) {
            const enabled49 = list21[count15];
            if (!enabled49) {
              const el64 = value174[count15];
              el64 &&
                ((el64.dataset.thumbKind = 'empty'),
                (el64.dataset.thumbType = ''),
                (el64.dataset.thumbSrc = ''),
                (el64.dataset.pendingSrc = ''),
                el64.replaceChildren());
              continue;
            }
            handler6(value174[count15], enabled49.thumbSrc, enabled49.type);
          }
          return;
        }
        error8?.coverUrl
          ? handler6(enabled47, error8.coverUrl, error8.coverType)
          : handler6(enabled47, '', error8?.coverType || 'other');
      },
      list22 = this._getSortedAssets().filter(
        (item30) => this._categoryKey(item30?.category) === this._categoryKey(this.activeTab),
      );
    if (this._openAssetId) {
      const category7 = list22.find((item31) => item31.id === this._openAssetId);
      if (!category7) {
        ((this._openAssetId = null), this.renderSidebarContent());
        return;
      }
      if (el49) el49.textContent = category7.name || assetManagerText('title');
      if (el50) el50.classList.add('show');
      (this.sidebarPanel.classList.add('is-detail-view'),
        (listView5.style.display = 'none'),
        (detailView2.style.display = ''));
      const list23 = Array.isArray(category7?.items)
        ? category7.items
        : Array.isArray(category7?.nodes)
          ? category7.nodes.map((item32) => _buildAssetItem(item32))
          : [];
      detailView2.replaceChildren();
      const el65 = document.createElement('div');
      el65.className = 'v2-asset-detail';
      const value175 = document.createElement('div');
      ((value175.className = 'v2-asset-detail-cover'), el65.appendChild(value175));
      if (list23.length > 0) {
        const el66 = handler7(value175),
          value176 = el66.querySelectorAll(':scope > .v2-asset-cover-cell');
        for (let count16 = 0; count16 < 4; count16++) {
          const value177 = list23[count16];
          if (value177) handler6(value176[count16], value177.thumbSrc, value177.type);
          else value176[count16] && value176[count16].replaceChildren();
        }
      } else handler6(value175, category7?.coverUrl, category7?.coverType || 'other');
      const el67 = document.createElement('div');
      ((el67.className = 'v2-asset-detail-title'),
        (el67.textContent = category7.name || assetManagerText('unnamedAsset')),
        el65.appendChild(el67));
      const el68 = document.createElement('div');
      el68.className = 'v2-asset-detail-meta';
      const count17 = Array.isArray(category7?.nodes) ? category7.nodes.length : list23.length;
      ((el68.textContent = assetManagerText('detail.meta', {
        category: category7.category
          ? _formatAssetCategoryLabel(category7.category)
          : assetManagerText('uncategorized'),
        count: count17,
        time: _formatAssetDateTime(category7.updatedAt || category7.createdAt),
      })),
        el65.appendChild(el68));
      const el69 = document.createElement('section');
      el69.className = 'v2-asset-detail-section';
      const el70 = document.createElement('div');
      ((el70.className = 'v2-asset-detail-section-title'),
        (el70.textContent = assetManagerText('detail.content')),
        el69.appendChild(el70));
      const el71 = document.createElement('div');
      el71.className = 'v2-asset-subgrid';
      if (list23.length === 0) {
        const el72 = document.createElement('div');
        ((el72.className = 'v2-asset-empty'),
          (el72.textContent = assetManagerText('detail.empty')),
          el71.appendChild(el72));
      } else
        for (let index2 = 0; index2 < list23.length; index2++) {
          const error9 = list23[index2],
            el73 = document.createElement('button');
          ((el73.type = 'button'),
            (el73.className = 'v2-asset-subitem'),
            (el73.dataset.assetId = category7.id),
            (el73.dataset.idx = String(index2)));
          const value178 = document.createElement('div');
          ((value178.className = 'v2-asset-subitem-thumb'),
            handler6(value178, error9?.thumbSrc, error9?.type));
          const value179 = document.createElement('div');
          value179.className = 'v2-asset-subitem-info';
          const el74 = document.createElement('span');
          ((el74.className = 'v2-asset-subitem-type'),
            (el74.textContent = _formatAssetTypeLabel(error9?.type)));
          const el75 = document.createElement('div');
          el75.className = 'v2-asset-subitem-name';
          const value180 = String(
            error9?.name || error9?.type || assetManagerText('detail.childAssetName', { index: index2 + 1 }),
          );
          ((el75.textContent = value180), (el75.title = value180));
          const el76 = document.createElement('div');
          ((el76.className = 'v2-asset-subitem-summary'),
            (el76.textContent = assetManagerText('detail.clickToAdd')),
            value179.append(el74, el75, el76),
            el73.append(value178, value179),
            el71.appendChild(el73));
        }
      (el69.appendChild(el71), el65.appendChild(el69));
      const el77 = document.createElement('div');
      el77.className = 'v2-asset-detail-actions';
      const el78 = document.createElement('button');
      ((el78.type = 'button'),
        (el78.className = 'v2-asset-detail-btn'),
        (el78.dataset.uiAction = 'asset-add-all'),
        (el78.dataset.assetId = category7.id),
        (el78.textContent = assetManagerText('loadToCanvas')),
        el77.appendChild(el78),
        el65.appendChild(el77),
        detailView2.appendChild(el65));
      return;
    }
    if (el49) el49.textContent = assetManagerText('title');
    if (el50) el50.classList.remove('show');
    (this.sidebarPanel.classList.remove('is-detail-view'),
      (listView5.style.display = ''),
      (detailView2.style.display = 'none'),
      detailView2.replaceChildren());
    let el79 = listView5.querySelector(':scope > .v2-asset-empty');
    !el79 &&
      ((el79 = document.createElement('div')),
      (el79.className = 'v2-asset-empty'),
      listView5.appendChild(el79));
    const value181 = this._getSortedAssets();
    let count18 = 0,
      value182 = 0;
    for (const value183 of value181) {
      const enabled50 = String(value183?.id || '');
      if (!enabled50) continue;
      let el80 = this._assetCardPool?.get?.(enabled50);
      if (!el80) {
        ((el80 = document.createElement('div')),
          (el80.className = 'v2-asset-item'),
          (el80.dataset.id = enabled50));
        if (!this._assetCardPool) this._assetCardPool = new Map();
        this._assetCardPool.set(enabled50, el80);
      }
      if (el80.parentElement !== listView5) listView5.appendChild(el80);
      const value184 = this._categoryKey(value183?.category) === this._categoryKey(this.activeTab);
      ((el80.style.display = value184 ? '' : 'none'),
        value184 &&
          ((el80.style.order = String(value182++)),
          handler8(el80, value183),
          this._newAssetPulseId &&
            this._newAssetPulseId === enabled50 &&
            ((this._newAssetPulseId = ''),
            window.requestAnimationFrame(() => {
              if (!el80.isConnected) return;
              el80.classList.add('is-new');
              const value185 = window.setTimeout(() => {
                if (el80.isConnected) el80.classList.remove('is-new');
              }, 0x28a);
              el80.dataset._pulseTimer = String(value185);
            })),
          (count18 += 1)));
    }
    ((el79.style.display = count18 === 0 ? '' : 'none'),
      count18 === 0 &&
        ((el79.textContent = assetManagerText('emptyCategory', {
          category: _formatAssetCategoryLabel(this.activeTab),
        })),
        (el79.style.order = '0')));
  }
  ['_restoreAssetSubItem'](value186, value187) {
    const enabled51 = (this.assets || []).find((item33) => item33.id === value186);
    if (!enabled51 || !Array.isArray(enabled51.nodes)) return;
    const box9 = enabled51.nodes[value187];
    if (!box9) return;
    const box10 = this._getCanvasCenterWorld(),
      value188 = Number(box9.width ?? box9.w) || 240,
      value189 = Number(box9.height ?? box9.h) || 240,
      value190 = box10.x - value188 / 2,
      value191 = box10.y - value189 / 2,
      box11 = findAvailablePosition(
        appStore.getState().nodes,
        value190,
        value191,
        value188,
        value189,
        24,
        'right',
      );
    (appStore.batch(() => {
      const box12 = JSON.parse(JSON.stringify(box9));
      ((box12.id = generateId(box12.type)),
        (box12.x = box11.x),
        (box12.y = box11.y),
        appStore.addNode(box12),
        appStore.setSelectedNodes([box12.id]));
    }),
      window.showToast?.(assetManagerText('toasts.subAssetAdded'), 'success'));
  }
  ['restoreAssetToCanvas'](value192) {
    const enabled52 = (this.assets || []).find((item34) => item34.id === value192);
    if (!enabled52 || !enabled52.nodes) return;
    const list24 = shouldTopAlignRestoredAsset(enabled52.nodes, enabled52.edges)
        ? createTopAlignedAssetNodes(enabled52.nodes, 24)
        : enabled52.nodes,
      box13 = this._getCanvasCenterWorld(),
      value193 = this._calcNodesBBox(list24),
      value194 = box13.x - value193.cx,
      value195 = box13.y - value193.cy,
      value196 = value193.minX + value194,
      value197 = value193.minY + value195,
      box14 = findAvailablePosition(
        appStore.getState().nodes,
        value196,
        value197,
        Math.max(1, value193.w),
        Math.max(1, value193.h),
        24,
        'right',
      ),
      value198 = value194 + (box14.x - value196),
      value199 = value195 + (box14.y - value197);
    (appStore.batch(() => {
      const value200 = {};
      (list24.forEach((item35) => {
        const box15 = JSON.parse(JSON.stringify(item35)),
          value201 = box15.id,
          generateId3 = generateId(box15.type);
        ((value200[value201] = generateId3),
          (box15.id = generateId3),
          (box15.x = (Number(box15.x) || 0) + value198),
          (box15.y = (Number(box15.y) || 0) + value199),
          appStore.addNode(box15));
      }),
        enabled52.edges &&
          enabled52.edges.forEach((item36) => {
            const value202 = JSON.parse(JSON.stringify(item36));
            value202.id = generateId('edge');
            if (value200[value202.sourceId]) value202.sourceId = value200[value202.sourceId];
            if (value200[value202.targetId]) value202.targetId = value200[value202.targetId];
            appStore.addEdge(value202);
          }),
        appStore.setSelectedNodes(Object.values(value200)));
    }),
      window.showToast?.(assetManagerText('toasts.assetAdded'), 'success'));
  }
}
export const assetManager = new AssetManager();
