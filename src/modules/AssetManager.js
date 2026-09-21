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
function assetManagerText(_0x98cfea, _0x10bf1c = {}) {
  return t('assetManager.' + _0x98cfea, _0x10bf1c);
}
function _formatAssetCategoryLabel(_0x33357e) {
  const _0x4b40a3 = String(_0x33357e || '').trim(),
    _0x3e3cf0 = ASSET_CATEGORY_I18N_KEYS[_0x4b40a3];
  return _0x3e3cf0 ? assetManagerText('categories.' + _0x3e3cf0) : _0x4b40a3;
}
function _escapeHtml(_0x2606d3) {
  return String(_0x2606d3 ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function _clonePlain(_0x4cfd8c, _0x31a68a) {
  if (_0x4cfd8c == null) return _0x31a68a;
  try {
    return JSON.parse(JSON.stringify(_0x4cfd8c));
  } catch (_0x1e5809) {
    return _0x31a68a;
  }
}
function _normalizeAssetType(_0x45aff0) {
  const _0x51b3cd = String(_0x45aff0 || '');
  if (_0x51b3cd === 'text' || _0x51b3cd === 'source-text' || _0x51b3cd === 'ai-text') return 'text';
  if (_0x51b3cd === 'audio' || _0x51b3cd === 'source-audio' || _0x51b3cd === 'ai-audio') return 'audio';
  if (_0x51b3cd === 'video' || _0x51b3cd === 'source-video' || _0x51b3cd === 'ai-video') return 'video';
  if (_0x51b3cd === 'image' || _0x51b3cd === 'source-image' || _0x51b3cd === 'ai-image') return 'image';
  return 'other';
}
function _formatAssetTypeLabel(_0x2a6df4) {
  const _0x97aa06 = _normalizeAssetType(_0x2a6df4);
  return assetManagerText('types.' + _0x97aa06);
}
function _resolveNodeStableThumbSrc(_0x21d99c) {
  if (!_0x21d99c) return '';
  const _0x2fcc4b =
    _0x21d99c.thumbLocalPath ||
    _0x21d99c.displayLocalPath ||
    _0x21d99c.localPath ||
    _0x21d99c.originalLocalPath;
  if (_0x2fcc4b)
    return (
      localPathToUrl(_0x2fcc4b) ||
      (String(_0x2fcc4b).startsWith('/') ? String(_0x2fcc4b) : '/' + String(_0x2fcc4b).replace(/^\/+/, ''))
    );
  if (_0x21d99c.thumbUrl && typeof _0x21d99c.thumbUrl === 'string') return _0x21d99c.thumbUrl;
  return String(_0x21d99c.src || _0x21d99c.imageUrl || '');
}
function _renderAssetIcon(_0x4fea63) {
  const _0x24905d = _normalizeAssetType(_0x4fea63);
  if (_0x24905d === 'text') return createReferenceFallbackThumbHtml('text', 'v2-asset-icon');
  if (_0x24905d === 'audio') return createReferenceFallbackThumbHtml('audio', 'v2-asset-icon');
  if (_0x24905d === 'video')
    return '<div class="v2-asset-icon v2-asset-icon--video" aria-hidden="true">\n      <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">\n        <polygon points="5 3 19 12 5 21 5 3" />\n      </svg>\n    </div>';
  return '<div class="v2-asset-icon v2-asset-icon--other" aria-hidden="true">\n    <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">\n      <rect x="3" y="3" width="18" height="18" rx="2" />\n    </svg>\n  </div>';
}
function _buildAssetItem(_0xf3bc34) {
  const _0x24c8d4 = _0xf3bc34?.type || 'other',
    _0x1eae17 = _resolveNodeStableThumbSrc(_0xf3bc34);
  return { type: _0x24c8d4, name: _0xf3bc34?.name || '', thumbSrc: _0x1eae17 || '', nodeData: _0xf3bc34 };
}
function _sortAssetsByUpdatedTime(_0x5808f2) {
  return [...(Array.isArray(_0x5808f2) ? _0x5808f2 : [])].sort((_0x4393c2, _0x4115e6) => {
    const _0x1b0b29 = Number(_0x4393c2?.updatedAt || _0x4393c2?.createdAt || 0),
      _0x411c1f = Number(_0x4115e6?.updatedAt || _0x4115e6?.createdAt || 0);
    return _0x411c1f - _0x1b0b29;
  });
}
function _formatAssetDateTime(_0x5ed43b) {
  const _0x25aff8 = Number(_0x5ed43b);
  if (!Number.isFinite(_0x25aff8) || _0x25aff8 <= 0) return assetManagerText('unknownTime');
  return new Date(_0x25aff8).toLocaleString(getLocale(), {
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
    return _sortAssetsByUpdatedTime(
      (this.assets || []).filter((_0x344b38) => this._isManagedAsset(_0x344b38)),
    );
  }
  ['_normalizeCategoryName'](_0x482a13) {
    return String(_0x482a13 || '').trim();
  }
  ['_categoryKey'](_0x349693) {
    return this._normalizeCategoryName(_0x349693).toLocaleLowerCase();
  }
  ['_isDefaultCategory'](_0x393f4f) {
    return !!this._findCategoryByName(_0x393f4f, DEFAULT_ASSET_CATEGORIES);
  }
  ['_isHiddenAssetCategory'](_0x137728) {
    return !!this._findCategoryByName(_0x137728, HIDDEN_ASSET_CATEGORIES);
  }
  ['_isManagedAsset'](_0x21212b) {
    if (!_0x21212b || typeof _0x21212b !== 'object') return false;
    if (
      HIDDEN_ASSET_KINDS.includes(
        String(_0x21212b?.kind || '')
          .trim()
          .toLowerCase(),
      )
    )
      return false;
    return !this._isHiddenAssetCategory(_0x21212b?.category);
  }
  ['_findCategoryByName'](_0x4bb53d, _0x2e3fb9 = this.tabs) {
    const _0x33670d = this._categoryKey(_0x4bb53d);
    if (!_0x33670d) return '';
    return (_0x2e3fb9 || []).find((_0x51aecc) => this._categoryKey(_0x51aecc) === _0x33670d) || '';
  }
  ['_normalizeUserCategories'](_0x309796 = []) {
    const _0x2fae04 = [],
      _0x2f9432 = (_0x97ea14) => {
        const _0x44cf53 = this._normalizeCategoryName(_0x97ea14);
        if (!_0x44cf53) return;
        if (this._isDefaultCategory(_0x44cf53) || this._isHiddenAssetCategory(_0x44cf53)) return;
        if (this._findCategoryByName(_0x44cf53, _0x2fae04)) return;
        if (DEFAULT_ASSET_CATEGORIES.length + _0x2fae04.length >= ASSET_CATEGORY_LIMIT) return;
        _0x2fae04.push(_0x44cf53);
      };
    return ((Array.isArray(_0x309796) ? _0x309796 : []).forEach(_0x2f9432), _0x2fae04);
  }
  ['_isUserCategory'](_0x1a2a4c) {
    return !!this._findCategoryByName(_0x1a2a4c, this.userCategories);
  }
  ['_getAssetCategories'](_0x25147c = '') {
    const _0x46948d = [],
      _0x54ed94 = (_0x34e983) => {
        const _0x3b65a4 = this._normalizeCategoryName(_0x34e983);
        if (!_0x3b65a4) return;
        if (this._isHiddenAssetCategory(_0x3b65a4)) return;
        if (this._findCategoryByName(_0x3b65a4, _0x46948d)) return;
        if (_0x46948d.length >= ASSET_CATEGORY_LIMIT) return;
        _0x46948d.push(_0x3b65a4);
      };
    DEFAULT_ASSET_CATEGORIES.forEach(_0x54ed94);
    for (const _0x1bfd1f of this.userCategories || []) {
      _0x54ed94(_0x1bfd1f);
    }
    for (const _0x57f8e1 of this._getSortedAssets()) {
      _0x54ed94(_0x57f8e1?.category);
    }
    return (_0x54ed94(_0x25147c), _0x46948d);
  }
  ['_syncTabsFromAssets']() {
    ((this.tabs = this._getAssetCategories()),
      !this._findCategoryByName(this.activeTab, this.tabs) &&
        ((this.activeTab = DEFAULT_ASSET_CATEGORIES[0]), (this._openAssetId = null)));
  }
  ['_renderSidebarTabsHtml']() {
    return (this.tabs || [])
      .map((_0x2e5f34) => {
        const _0x21f89a = this._categoryKey(_0x2e5f34) === this._categoryKey(this.activeTab) ? ' active' : '',
          _0x3b0ded = _escapeHtml(_0x2e5f34),
          _0x17e8af = _escapeHtml(_formatAssetCategoryLabel(_0x2e5f34)),
          _0x6b48bb = this._isUserCategory(_0x2e5f34)
            ? '<button\n              type="button"\n              class="v2-asset-category-delete"\n              data-ui-action="asset-category-delete"\n              data-cat="' +
              _0x3b0ded +
              '"\n              aria-label="' +
              _escapeHtml(
                assetManagerText('deleteCategoryAria', { category: _formatAssetCategoryLabel(_0x2e5f34) }),
              ) +
              '"\n              title="' +
              _escapeHtml(assetManagerText('deleteCategory')) +
              '"\n            >×</button>'
            : '';
        return (
          '\n          <div class="v2-asset-sidebar-tab' +
          _0x21f89a +
          '" data-cat="' +
          _0x3b0ded +
          '">\n            <span class="v2-asset-sidebar-tab-text">' +
          _0x17e8af +
          '</span>\n            ' +
          _0x6b48bb +
          '\n          </div>\n        '
        );
      })
      .join('');
  }
  ['_renderSidebarTabs']() {
    const _0x34feab = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!_0x34feab) return;
    ((_0x34feab.innerHTML = this._renderSidebarTabsHtml()), this._queueSidebarTabsLayoutSync());
  }
  ['_queueSidebarTabsLayoutSync']() {
    if (!this.sidebarPanel) return;
    (this._sidebarTabsLayoutRaf && window.cancelAnimationFrame?.(this._sidebarTabsLayoutRaf),
      (this._sidebarTabsLayoutRaf = window.requestAnimationFrame(() => {
        ((this._sidebarTabsLayoutRaf = 0), this._syncSidebarTabsViewport());
      })));
  }
  ['_syncSidebarTabsViewport']() {
    const _0x5407ef = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!_0x5407ef) return;
    const _0x564864 = _0x5407ef.querySelector('.v2-asset-sidebar-tab.active');
    if (_0x564864 && _0x5407ef.clientWidth > 0) {
      if (this._isDefaultCategory(this.activeTab)) _0x5407ef.scrollLeft = 0;
      else {
        const _0x16ea4b = _0x564864.offsetLeft,
          _0x152f92 = _0x16ea4b + _0x564864.offsetWidth,
          _0x13ec00 = _0x5407ef.scrollLeft,
          _0x5a562e = _0x13ec00 + _0x5407ef.clientWidth;
        if (_0x16ea4b < _0x13ec00) _0x5407ef.scrollLeft = _0x16ea4b;
        else _0x152f92 > _0x5a562e && (_0x5407ef.scrollLeft = _0x152f92 - _0x5407ef.clientWidth);
      }
    }
    this._updateSidebarTabsOverflowHint();
  }
  ['_updateSidebarTabsOverflowHint']() {
    const _0x4d2f6e = this.sidebarPanel?.querySelector('#asset-sidebar-tabs-shell'),
      _0x4d83f6 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!_0x4d2f6e || !_0x4d83f6) return;
    const _0x1b5fa7 = Math.max(0, _0x4d83f6.scrollWidth - _0x4d83f6.clientWidth),
      _0x134890 = _0x1b5fa7 > 2,
      _0x4c12e3 = !_0x134890 || _0x4d83f6.scrollLeft <= 2,
      _0xa96830 = !_0x134890 || _0x4d83f6.scrollLeft >= _0x1b5fa7 - 2;
    (_0x4d2f6e.classList.toggle('has-overflow', _0x134890),
      _0x4d2f6e.classList.toggle('is-at-start', _0x4c12e3),
      _0x4d2f6e.classList.toggle('is-at-end', _0xa96830));
    const _0x120680 = _0x4d2f6e.querySelector('.v2-asset-sidebar-tabs-nav--prev'),
      _0x392da5 = _0x4d2f6e.querySelector('.v2-asset-sidebar-tabs-nav--next');
    if (_0x120680) _0x120680.hidden = !_0x134890 || _0x4c12e3;
    if (_0x392da5) _0x392da5.hidden = !_0x134890 || _0xa96830;
  }
  ['_scrollSidebarTabs'](_0x13355c = 1) {
    const _0x515da1 = this.sidebarPanel?.querySelector('#asset-sidebar-tabs');
    if (!_0x515da1) return;
    const _0x190a27 = Math.max(1, Math.floor(_0x515da1.clientWidth * 0.75)),
      _0x3c723e = _0x515da1.scrollLeft + _0x190a27 * (_0x13355c < 0 ? -1 : 1);
    (typeof _0x515da1.scrollTo === 'function'
      ? _0x515da1.scrollTo({ left: _0x3c723e, behavior: 'smooth' })
      : (_0x515da1.scrollLeft = _0x3c723e),
      window.setTimeout(() => this._updateSidebarTabsOverflowHint(), 220));
  }
  ['_getCreatePanelCategories']() {
    const _0x199e2d = this._getAssetCategories(),
      _0x29434f = (_0x424c12) => {
        const _0x5a581c = this._normalizeCategoryName(_0x424c12);
        if (!_0x5a581c) return;
        if (this._findCategoryByName(_0x5a581c, _0x199e2d)) return;
        _0x199e2d.push(_0x5a581c);
      };
    for (const _0x550833 of this._createPanelState?.customCategories || []) {
      _0x29434f(_0x550833);
    }
    return (_0x29434f(this._createPanelState?.draft?.category || this.activeTab), _0x199e2d);
  }
  ['_canAddCustomCategory']() {
    return this._getCreatePanelCategories().length < ASSET_CATEGORY_LIMIT;
  }
  async ['loadAssetCategoriesFromServer']() {
    try {
      const _0x2ac2fe = await fetchAssetCategoriesFromServer();
      ((this.userCategories = this._normalizeUserCategories(_0x2ac2fe)),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
    } catch (_0x376d20) {
      console.error('加载资产分类失败', _0x376d20);
    }
  }
  async ['_saveUserCategories']() {
    const _0x4a06ce = this._normalizeUserCategories(this.userCategories);
    ((this.userCategories = _0x4a06ce), await saveAssetCategoriesToServer(_0x4a06ce));
  }
  ['_addUserCategory'](_0x2c9848) {
    const _0x487b4b = this._normalizeCategoryName(_0x2c9848);
    if (!_0x487b4b || this._isDefaultCategory(_0x487b4b) || this._isHiddenAssetCategory(_0x487b4b)) return '';
    const _0x5e8ca8 = this._findCategoryByName(_0x487b4b, this.userCategories);
    if (_0x5e8ca8) return _0x5e8ca8;
    if (this._getAssetCategories().length >= ASSET_CATEGORY_LIMIT)
      return (
        window.showToast?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn'),
        ''
      );
    return (
      (this.userCategories = this._normalizeUserCategories([...this.userCategories, _0x487b4b])),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      void this._saveUserCategories().catch((_0x499895) => {
        (console.error('保存资产分类失败', _0x499895),
          window.showToast?.(assetManagerText('categorySaveFailed'), 'error'));
      }),
      _0x487b4b
    );
  }
  ['_getMentionEligibleAssets']() {
    return this._getSortedAssets().filter((_0x56c3d3) =>
      this._findCategoryByName(_0x56c3d3?.category, this.tabs),
    );
  }
  ['_normalizeAssetEntity'](_0x31b72b) {
    if (!_0x31b72b || typeof _0x31b72b !== 'object') return null;
    const _0xe74003 = { ..._0x31b72b },
      _0x1d9fa1 = Number(_0xe74003.createdAt || 0),
      _0x4a80cf = Number(_0xe74003.updatedAt || _0x1d9fa1 || 0);
    _0x1d9fa1 > 0 ? (_0xe74003.createdAt = _0x1d9fa1) : delete _0xe74003.createdAt;
    if (_0x4a80cf > 0) _0xe74003.updatedAt = _0x4a80cf;
    else _0x1d9fa1 > 0 && (_0xe74003.updatedAt = _0x1d9fa1);
    return (
      !_0xe74003.coverUrl &&
        Array.isArray(_0xe74003.nodes) &&
        _0xe74003.nodes[0] &&
        (_0xe74003.coverUrl = _resolveNodeStableThumbSrc(_0xe74003.nodes[0])),
      !Array.isArray(_0xe74003.items) &&
        Array.isArray(_0xe74003.nodes) &&
        (_0xe74003.items = _0xe74003.nodes.map((_0x6ff292) => _buildAssetItem(_0x6ff292))),
      _0xe74003
    );
  }
  ['_upsertLocalAsset'](_0x5aa009) {
    const _0x24f2b3 = this._normalizeAssetEntity(_0x5aa009);
    if (!_0x24f2b3?.id) return;
    const _0x58f8e6 = Array.isArray(this.assets) ? this.assets : [],
      _0x4f5cde = _0x58f8e6.filter((_0x874125) => String(_0x874125?.id || '') !== String(_0x24f2b3.id));
    ((this.assets = _sortAssetsByUpdatedTime([_0x24f2b3, ..._0x4f5cde])),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      this._findCategoryByName(_0x24f2b3.category, this.tabs)
        ? upsertAssetMentionAsset(_0x24f2b3)
        : removeAssetMentionAsset(_0x24f2b3.id));
  }
  ['_getSelectedAssetNodes'](_0x52dbbf) {
    const _0x48010c = Array.isArray(_0x52dbbf) ? _0x52dbbf : [],
      _0x2ae02e = appStore.getState();
    return _0x48010c.map((_0x30fc2b) => _0x2ae02e.nodes[_0x30fc2b]).filter(Boolean);
  }
  ['_getSelectedAssetEdges'](_0x5a1154) {
    const _0x3ded93 = Array.isArray(_0x5a1154) ? _0x5a1154 : [],
      _0x37cb83 = new Set(_0x3ded93),
      _0x1e537c = appStore.getState();
    return Object.values(_0x1e537c.edges || {}).filter(
      (_0x7f9c4c) => _0x37cb83.has(_0x7f9c4c?.sourceId) && _0x37cb83.has(_0x7f9c4c?.targetId),
    );
  }
  async ['_resolveCreatePanelCover'](_0x1dd6de) {
    let _0x3a9c82 = '';
    const _0x590a1d = _0x1dd6de?.type || 'other';
    if (_0x1dd6de?.thumbId) {
      const _0x2726bf = await getImage(_0x1dd6de.thumbId);
      _0x2726bf &&
        ((this._createPanelCoverObjectUrl = URL.createObjectURL(_0x2726bf)),
        (_0x3a9c82 = this._createPanelCoverObjectUrl));
    }
    return (
      !_0x3a9c82 && (_0x3a9c82 = _resolveNodeStableThumbSrc(_0x1dd6de)),
      {
        coverUrl: _0x3a9c82,
        coverType: _0x590a1d,
        coverHtml: _0x3a9c82
          ? '<img src="' +
            _0x3a9c82 +
            '" alt="' +
            _escapeHtml(assetManagerText('coverAlt')) +
            '" id="asset-create-cover-img" draggable="false" />'
          : _renderAssetIcon(_0x590a1d),
      }
    );
  }
  ['_buildAssetPayloadFromSelection'](_0x2010aa, _0x38ffe5 = {}) {
    const _0x59dc24 = this._getSelectedAssetNodes(_0x2010aa),
      _0x20d3e3 = _0x59dc24[0] || null,
      _0x43fc96 = Date.now(),
      _0x391739 = String(_0x38ffe5.name || '').trim() || assetManagerText('unnamedAsset'),
      _0x339456 = String(_0x38ffe5.category || '').trim() || this.activeTab,
      _0x4ccd2b = _0x20d3e3?.type || 'other',
      _0x200809 = _resolveNodeStableThumbSrc(_0x20d3e3),
      _0x2c0639 = String(_0x38ffe5.id || '').trim(),
      _0x4cbad9 = Number(_0x38ffe5.createdAt || _0x43fc96) || _0x43fc96,
      _0x136834 = Number(_0x38ffe5.updatedAt || _0x43fc96) || _0x43fc96;
    return {
      id: _0x2c0639 || generateId('asset'),
      name: _0x391739,
      category: _0x339456,
      coverUrl: _0x200809,
      coverType: _0x4ccd2b,
      items: _0x59dc24.map((_0x49b88a) => _buildAssetItem(_0x49b88a)),
      nodes: _0x59dc24,
      edges: this._getSelectedAssetEdges(_0x2010aa),
      createdAt: _0x4cbad9,
      updatedAt: _0x136834,
    };
  }
  ['_buildAssetAppendPayload'](_0x480639, _0x85a5a5, _0x573264 = {}) {
    const _0xd3187e = this._getSelectedAssetNodes(_0x85a5a5),
      _0x3b5cec = this._getSelectedAssetEdges(_0x85a5a5),
      _0x2c8c9e = Date.now(),
      _0x1eca6a = {},
      _0x1491dc = _0xd3187e.map((_0xe1a177) => {
        const _0x41bfbe = _clonePlain(_0xe1a177, { ..._0xe1a177 }),
          _0x2ef80f = String(_0x41bfbe.id || ''),
          _0x4e891c = generateId(_0x41bfbe.type);
        if (_0x2ef80f) _0x1eca6a[_0x2ef80f] = _0x4e891c;
        return ((_0x41bfbe.id = _0x4e891c), _0x41bfbe);
      }),
      _0x3f3cd8 = _0x3b5cec.map((_0x1e8274) => {
        const _0x2651e0 = _clonePlain(_0x1e8274, { ..._0x1e8274 });
        _0x2651e0.id = generateId('edge');
        if (_0x1eca6a[_0x2651e0.sourceId]) _0x2651e0.sourceId = _0x1eca6a[_0x2651e0.sourceId];
        if (_0x1eca6a[_0x2651e0.targetId]) _0x2651e0.targetId = _0x1eca6a[_0x2651e0.targetId];
        return _0x2651e0;
      }),
      _0xf983b = Array.isArray(_0x480639?.nodes) ? _clonePlain(_0x480639.nodes, []) : [],
      _0x535c65 = Array.isArray(_0x480639?.items)
        ? _clonePlain(_0x480639.items, [])
        : _0xf983b.map((_0x41f17f) => _buildAssetItem(_0x41f17f)),
      _0x538207 = Array.isArray(_0x480639?.edges) ? _clonePlain(_0x480639.edges, []) : [],
      _0x11bbfd = _0x1491dc[0] || null,
      _0x4cfd2a = _0x11bbfd ? _resolveNodeStableThumbSrc(_0x11bbfd) : '',
      _0x2458ad = _0x480639?.coverUrl || _0x4cfd2a,
      _0x231cb4 = _0x480639?.coverType || _0x11bbfd?.type || 'other';
    return {
      ...(_0x480639 || {}),
      id: _0x480639?.id,
      name: String(_0x573264.name || '').trim() || assetManagerText('unnamedAsset'),
      category: String(_0x573264.category || '').trim() || this.activeTab,
      coverUrl: _0x2458ad,
      coverType: _0x231cb4,
      items: [..._0x535c65, ..._0x1491dc.map((_0x4412aa) => _buildAssetItem(_0x4412aa))],
      nodes: [..._0xf983b, ..._0x1491dc],
      edges: [..._0x538207, ..._0x3f3cd8],
      createdAt: Number(_0x480639?.createdAt || _0x480639?.updatedAt || _0x2c8c9e) || _0x2c8c9e,
      updatedAt: Number(_0x573264.updatedAt || _0x2c8c9e) || _0x2c8c9e,
    };
  }
  ['_createDefaultPanelState'](_0x45e9ff, _0x4618c3) {
    return {
      selectedIds: [..._0x45e9ff],
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
      coverInfo: _0x4618c3 || { coverUrl: '', coverType: 'other', coverHtml: _renderAssetIcon('other') },
    };
  }
  ['_setCreatePanelState'](_0x9f6d08 = {}) {
    if (!this._createPanelState) return;
    const _0x530ce4 = this._createPanelState,
      _0x2694bc = _0x9f6d08.draft ? { ...(_0x530ce4.draft || {}), ..._0x9f6d08.draft } : _0x530ce4.draft;
    this._createPanelState = { ..._0x530ce4, ..._0x9f6d08, draft: _0x2694bc };
  }
  ['_getUpdateListCategory']() {
    const _0x38fecd = this._normalizeCategoryName(this._createPanelState?.draft?.category);
    if (this._createPanelState?.mode === 'update' && _0x38fecd) return _0x38fecd;
    return this._findCategoryByName(this.activeTab, this.tabs) || this.activeTab;
  }
  ['_getFilteredUpdateAssets'](_0x2a0ccf = '') {
    const _0x4fba2a = String(_0x2a0ccf || '')
        .trim()
        .toLowerCase(),
      _0xb61890 = this._categoryKey(this._getUpdateListCategory()),
      _0x3009cf = this._getSortedAssets().filter(
        (_0x1e8a94) => this._categoryKey(_0x1e8a94?.category) === _0xb61890,
      );
    if (!_0x4fba2a) return _0x3009cf;
    return _0x3009cf.filter((_0x348a53) =>
      String(_0x348a53?.name || '')
        .toLowerCase()
        .includes(_0x4fba2a),
    );
  }
  ['_syncCreatePanelDraftFromTarget'](_0x33357f) {
    this._setCreatePanelState({
      draft: {
        name: String(_0x33357f?.name || '').trim() || assetManagerText('unnamedAsset'),
        category: String(_0x33357f?.category || '').trim() || this.activeTab,
      },
      selectedAssetId: String(_0x33357f?.id || ''),
      updateConfirmOpen: false,
      customCategoryEditing: false,
      customCategoryDraft: '',
      error: '',
    });
  }
  ['_syncUpdateSelectionForCategory'](_0x4495df) {
    if (this._createPanelState?.mode !== 'update') return;
    const _0x456df1 = this._normalizeCategoryName(_0x4495df) || this.activeTab;
    this._setCreatePanelState({
      draft: { category: _0x456df1 },
      selectedAssetId: '',
      updateSearchKeyword: '',
      updateConfirmOpen: false,
      error: '',
    });
    const _0x189541 = this._getFilteredUpdateAssets()[0] || null;
    if (!_0x189541) return;
    this._setCreatePanelState({
      draft: {
        name: String(_0x189541?.name || '').trim() || assetManagerText('unnamedAsset'),
        category: String(_0x189541?.category || '').trim() || _0x456df1,
      },
      selectedAssetId: String(_0x189541?.id || ''),
    });
  }
  ['_renderCreatePanelContent']() {
    const _0x439522 = this.createPanel,
      _0x59add5 = this._createPanelState;
    if (!_0x439522 || !_0x59add5) return;
    const _0x397d2e =
        _0x59add5.coverInfo?.coverHtml || _renderAssetIcon(_0x59add5.coverInfo?.coverType || 'other'),
      _0x5deff9 =
        _0x59add5.mode === 'update'
          ? assetManagerText('createPanel.updateTitle')
          : assetManagerText('createPanel.createTitle'),
      _0x2d94d0 = Array.isArray(_0x59add5.selectedIds) ? _0x59add5.selectedIds.length : 0,
      _0x2f0aa4 = _0x59add5.saving
        ? _0x59add5.mode === 'update' && _0x59add5.savingAction === 'join'
          ? assetManagerText('createPanel.overwrite')
          : _0x59add5.mode === 'update'
            ? assetManagerText('createPanel.saving')
            : assetManagerText('createPanel.creating')
        : _0x59add5.mode === 'update'
          ? _0x59add5.updateConfirmOpen
            ? assetManagerText('createPanel.confirmOverwrite')
            : assetManagerText('createPanel.overwrite')
          : assetManagerText('createPanel.create'),
      _0x5bdd4f =
        _0x59add5.saving && _0x59add5.savingAction === 'join'
          ? assetManagerText('createPanel.joining')
          : assetManagerText('createPanel.join'),
      _0xec53f0 = this._getFilteredUpdateAssets(_0x59add5.updateSearchKeyword),
      _0x540d50 =
        _0xec53f0.find((_0x25b048) => String(_0x25b048?.id || '') === _0x59add5.selectedAssetId) || null,
      _0x444a96 = this._getUpdateListCategory(),
      _0x46a2a9 = _0x59add5.error
        ? '<div class="v2-asset-create-error" role="alert">' + _escapeHtml(_0x59add5.error) + '</div>'
        : '',
      _0x3d6c8e =
        _0x59add5.mode === 'update' && _0x59add5.updateConfirmOpen && _0x540d50
          ? '<div class="v2-asset-create-confirm">' +
            _escapeHtml(
              assetManagerText('createPanel.confirmOverwriteAsset', {
                name: _0x540d50.name || assetManagerText('unnamedAsset'),
              }),
            ) +
            '</div>'
          : '',
      _0x28bcea =
        _0x59add5.mode === 'update'
          ? '\n          <div class="v2-asset-update-layout">\n            <div class="v2-asset-update-picker">\n              <input\n                type="search"\n                class="v2-asset-update-search"\n                id="asset-update-search"\n                placeholder="' +
            _escapeHtml(
              assetManagerText('createPanel.searchAssets', {
                category: _formatAssetCategoryLabel(_0x444a96),
              }),
            ) +
            '"\n                value="' +
            _escapeHtml(_0x59add5.updateSearchKeyword || '') +
            '"\n              />\n              <div class="v2-asset-update-list">\n                ' +
            (_0xec53f0.length === 0
              ? '<div class="v2-asset-update-empty">' +
                (String(_0x59add5.updateSearchKeyword || '').trim()
                  ? _escapeHtml(assetManagerText('createPanel.noMatchedAssets'))
                  : _escapeHtml(
                      assetManagerText('createPanel.noCategoryAssets', {
                        category: _formatAssetCategoryLabel(_0x444a96),
                      }),
                    )) +
                '</div>'
              : _0xec53f0
                  .map((_0x3ea43b) => {
                    const _0x4035c6 =
                        String(_0x3ea43b?.id || '') === _0x59add5.selectedAssetId ? ' active' : '',
                      _0x40166d = _0x3ea43b?.coverUrl
                        ? '<img src="' +
                          _escapeHtml(_0x3ea43b.coverUrl) +
                          '" alt="' +
                          _escapeHtml(_0x3ea43b?.name || assetManagerText('assetAlt')) +
                          '" draggable="false" />'
                        : _renderAssetIcon(_0x3ea43b?.coverType || 'other');
                    return (
                      '\n                            <button\n                              type="button"\n                              class="v2-asset-update-item' +
                      _0x4035c6 +
                      '"\n                              data-asset-id="' +
                      _escapeHtml(_0x3ea43b.id) +
                      '"\n                            >\n                              <div class="v2-asset-update-thumb">' +
                      _0x40166d +
                      '</div>\n                              <div class="v2-asset-update-info">\n                                <span>' +
                      _escapeHtml(_0x3ea43b.name || assetManagerText('unnamedAsset')) +
                      '</span>\n                                <small>' +
                      _formatAssetDateTime(_0x3ea43b.updatedAt || _0x3ea43b.createdAt) +
                      '</small>\n                              </div>\n                            </button>\n                          '
                    );
                  })
                  .join('')) +
            '\n              </div>\n            </div>\n            <div class="v2-asset-update-editor">\n        '
          : '',
      _0x3fe105 = _0x59add5.mode === 'update' ? '</div></div>' : '',
      _0x5611bb = _0x59add5.mode === 'update',
      _0x68aa61 = _0x5611bb ? 'v2-asset-create-body v2-asset-create-body--update' : 'v2-asset-create-body',
      _0x276e58 = _0x5611bb
        ? ''
        : '\n        <div class="v2-asset-create-source-panel">\n          <div class="v2-asset-create-source-header">\n            <div class="v2-asset-create-source-title">' +
          assetManagerText('createPanel.currentSelection') +
          '</div>\n            <div class="v2-asset-create-source-scope">' +
          assetManagerText('createPanel.selectedNodes', { count: _0x2d94d0 }) +
          '</div>\n          </div>\n          <div class="v2-asset-create-cover">\n            ' +
          _0x397d2e +
          '\n          </div>\n        </div>\n      ';
    ((_0x439522.innerHTML =
      '\n      <div class="v2-asset-create-header">\n        <div class="v2-asset-create-title">\n          <span class="v2-asset-create-header-text">' +
      _0x5deff9 +
      '</span>\n        </div>\n        <button type="button" class="v2-asset-create-close" data-ui-action="asset-create-close" aria-label="' +
      _escapeHtml(assetManagerText('close')) +
      '">×</button>\n      </div>\n      <div class="v2-asset-create-tabs">\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (_0x59add5.mode === 'create' ? ' active' : '') +
      '"\n          data-mode="create"\n        >' +
      assetManagerText('createPanel.createTab') +
      '</button>\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (_0x59add5.mode === 'update' ? ' active' : '') +
      '"\n          data-mode="update"\n        >' +
      assetManagerText('createPanel.updateTab') +
      '</button>\n      </div>\n      <div class="v2-asset-create-modal-body">\n        ' +
      _0x28bcea +
      '\n        <div class="' +
      _0x68aa61 +
      '">\n          ' +
      _0x276e58 +
      '\n          <div class="v2-asset-create-right">\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.assetName') +
      '</div>\n              <input\n                type="text"\n                id="asset-create-name"\n                placeholder="' +
      _escapeHtml(assetManagerText('createPanel.assetNamePlaceholder')) +
      '"\n                value="' +
      _escapeHtml(_0x59add5.draft?.name || '') +
      '"\n              />\n            </div>\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">' +
      assetManagerText('createPanel.category') +
      '</div>\n              <button type="button" class="v2-asset-create-select-trigger" id="asset-create-category-trigger">\n                <span id="asset-create-category-val">' +
      _escapeHtml(_formatAssetCategoryLabel(_0x59add5.draft?.category || this.activeTab)) +
      '</span>\n                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--white-40)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n                </svg>\n              </button>\n            </div>\n            ' +
      _0x46a2a9 +
      '\n            ' +
      _0x3d6c8e +
      '\n          </div>\n        </div>\n        ' +
      _0x3fe105 +
      '\n      </div>\n      <div class="v2-asset-create-footer' +
      (_0x5611bb ? ' v2-asset-create-footer--update' : '') +
      '">\n        <button\n          type="button"\n          class="v2-asset-create-btn"\n          id="asset-create-submit"\n          ' +
      (_0x59add5.saving ? 'disabled' : '') +
      '\n        >' +
      _0x2f0aa4 +
      '</button>\n        ' +
      (_0x5611bb
        ? '<button\n                type="button"\n                class="v2-asset-create-btn v2-asset-create-btn--secondary"\n                id="asset-join-submit"\n                ' +
          (_0x59add5.saving ? 'disabled' : '') +
          '\n              >' +
          _0x5bdd4f +
          '</button>'
        : '') +
      '\n      </div>\n    '),
      this._bindCreatePanelEvents());
  }
  ['_bindCreatePanelEvents']() {
    const _0x35b712 = this.createPanel,
      _0x12128b = this._createPanelState;
    if (!_0x35b712 || !_0x12128b) return;
    _0x35b712.querySelector("[data-ui-action='asset-create-close']")?.addEventListener('click', () => {
      this.closeCreatePanel();
    });
    const _0x48c446 = _0x35b712.querySelector('#asset-create-category-trigger'),
      _0x4ecd10 = _0x35b712.querySelector('#asset-create-category-val');
    this._createPanelDropdownOutsideHandler &&
      (document.removeEventListener('pointerdown', this._createPanelDropdownOutsideHandler),
      (this._createPanelDropdownOutsideHandler = null));
    this._createPanelDropdownEl &&
      (this._createPanelDropdownEl.remove(), (this._createPanelDropdownEl = null));
    if (_0x48c446 && _0x4ecd10) {
      const _0x56be99 = document.createElement('div');
      _0x56be99.className = 'v2-asset-select-dropdown';
      const _0x5e9a48 = () => {
          const _0x1ffe72 = this._createPanelState?.draft?.category || this.activeTab,
            _0x263efa = this._getCreatePanelCategories()
              .map((_0x225f05) => {
                const _0x1806b1 =
                    this._categoryKey(_0x225f05) === this._categoryKey(_0x1ffe72) ? ' selected' : '',
                  _0x1cf72e = _escapeHtml(_0x225f05),
                  _0x16191b = _escapeHtml(_formatAssetCategoryLabel(_0x225f05));
                return (
                  '<div class="v2-asset-select-item' +
                  _0x1806b1 +
                  '" data-val="' +
                  _0x1cf72e +
                  '">' +
                  _0x16191b +
                  '</div>'
                );
              })
              .join(''),
            _0x2334aa = this._canAddCustomCategory()
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
          _0x56be99.innerHTML = _0x263efa + _0x2334aa;
        },
        _0x138a38 = () => {
          const _0x181092 = _0x56be99.querySelector('#asset-category-custom-input'),
            _0x29332c = _0x181092?.value ?? this._createPanelState?.customCategoryDraft ?? '',
            _0xc269a2 = this._normalizeCategoryName(_0x29332c);
          if (!_0xc269a2) {
            (this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }),
              _0x5e9a48());
            return;
          }
          const _0x972e73 = this._getCreatePanelCategories(),
            _0x2ad351 = this._findCategoryByName(_0xc269a2, _0x972e73);
          if (!_0x2ad351 && _0x972e73.length >= ASSET_CATEGORY_LIMIT) {
            window.showToast?.(assetManagerText('categoryLimit', { limit: ASSET_CATEGORY_LIMIT }), 'warn');
            return;
          }
          const _0x3a54dc = _0x2ad351 || this._addUserCategory(_0xc269a2);
          if (!_0x3a54dc) return;
          const _0xe5b3 = [...(this._createPanelState?.customCategories || [])];
          !_0x2ad351 && !this._findCategoryByName(_0x3a54dc, _0xe5b3) && _0xe5b3.push(_0x3a54dc);
          this._setCreatePanelState({
            draft: { category: _0x3a54dc },
            customCategoryEditing: false,
            customCategoryDraft: '',
            customCategories: _0xe5b3,
            updateConfirmOpen: false,
            error: '',
          });
          this._createPanelState?.mode === 'update' && this._syncUpdateSelectionForCategory(_0x3a54dc);
          _0x4ecd10.textContent = _formatAssetCategoryLabel(_0x3a54dc);
          if (this._createPanelState?.mode === 'update') {
            (_0x216f59(), this._renderCreatePanelContent());
            return;
          }
          _0x5e9a48();
        };
      (_0x5e9a48(), document.body.appendChild(_0x56be99), (this._createPanelDropdownEl = _0x56be99));
      const _0x216f59 = () => {
        (_0x56be99.classList.remove('show'), _0x48c446.classList.remove('active'));
      };
      (_0x48c446.addEventListener('click', (_0x16c0fd) => {
        _0x16c0fd.stopPropagation();
        if (_0x56be99.classList.contains('show')) {
          _0x216f59();
          return;
        }
        const _0x5c8370 = _0x48c446.getBoundingClientRect();
        ((_0x56be99.style.left = _0x5c8370.left + 'px'),
          (_0x56be99.style.top = _0x5c8370.bottom + 4 + 'px'),
          (_0x56be99.style.width = _0x5c8370.width + 'px'),
          _0x56be99.classList.add('show'),
          _0x48c446.classList.add('active'));
      }),
        _0x56be99.addEventListener('click', (_0xad59e9) => {
          const _0x2f9bce = _0xad59e9.target.closest("[data-custom-category='1']");
          if (_0x2f9bce) {
            (this._setCreatePanelState({ customCategoryEditing: true, customCategoryDraft: '', error: '' }),
              _0x5e9a48(),
              window.requestAnimationFrame(() => {
                _0x56be99.querySelector('#asset-category-custom-input')?.focus();
              }));
            return;
          }
          const _0x23c1c2 = _0xad59e9.target.closest('.v2-asset-select-item[data-val]');
          if (!_0x23c1c2) return;
          const _0x296bd4 = this._normalizeCategoryName(_0x23c1c2.dataset.val) || this.activeTab;
          (this._createPanelState?.mode === 'update'
            ? (this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }),
              this._syncUpdateSelectionForCategory(_0x296bd4))
            : this._setCreatePanelState({
                draft: { category: _0x296bd4 },
                customCategoryEditing: false,
                customCategoryDraft: '',
                updateConfirmOpen: false,
                error: '',
              }),
            _0x216f59(),
            this._renderCreatePanelContent());
        }),
        _0x56be99.addEventListener('input', (_0x5d2d95) => {
          if (!_0x5d2d95.target.matches('#asset-category-custom-input')) return;
          this._setCreatePanelState({ customCategoryDraft: _0x5d2d95.target.value || '' });
        }),
        _0x56be99.addEventListener('keydown', (_0x14d486) => {
          if (!_0x14d486.target.matches('#asset-category-custom-input')) return;
          if (_0x14d486.key === 'Enter') {
            (_0x14d486.preventDefault(), _0x138a38());
            return;
          }
          _0x14d486.key === 'Escape' &&
            (_0x14d486.preventDefault(),
            this._setCreatePanelState({ customCategoryEditing: false, customCategoryDraft: '' }),
            _0x5e9a48());
        }),
        _0x56be99.addEventListener('focusout', (_0x3b5137) => {
          if (!_0x3b5137.target.matches('#asset-category-custom-input')) return;
          _0x138a38();
        }));
      const _0x54b56f = (_0x44d569) => {
        !_0x56be99.contains(_0x44d569.target) && !_0x48c446.contains(_0x44d569.target) && _0x216f59();
      };
      ((this._createPanelDropdownOutsideHandler = _0x54b56f),
        document.addEventListener('pointerdown', _0x54b56f));
    }
    _0x35b712.querySelectorAll('.v2-asset-create-tab').forEach((_0x1fdf7e) => {
      _0x1fdf7e.addEventListener('click', () => {
        const _0x4c46af = _0x1fdf7e.dataset.mode === 'update' ? 'update' : 'create';
        if (_0x4c46af === this._createPanelState?.mode) return;
        this._setCreatePanelState({
          mode: _0x4c46af,
          updateConfirmOpen: false,
          customCategoryEditing: false,
          customCategoryDraft: '',
          error: '',
        });
        if (_0x4c46af === 'update' && !this._createPanelState?.selectedAssetId) {
          const _0x21b7b3 = this._getFilteredUpdateAssets()[0] || null;
          _0x21b7b3 && this._syncCreatePanelDraftFromTarget(_0x21b7b3);
        }
        this._renderCreatePanelContent();
      });
    });
    const _0x2dde57 = _0x35b712.querySelector('#asset-create-name');
    _0x2dde57 &&
      _0x2dde57.addEventListener('input', (_0x4d6238) => {
        this._setCreatePanelState({
          draft: { name: _0x4d6238.target.value || '' },
          updateConfirmOpen: false,
          error: '',
        });
      });
    const _0x5b4246 = _0x35b712.querySelector('#asset-update-search');
    _0x5b4246 &&
      _0x5b4246.addEventListener('input', (_0x1aaf70) => {
        (this._setCreatePanelState({
          updateSearchKeyword: _0x1aaf70.target.value || '',
          updateConfirmOpen: false,
          error: '',
        }),
          this._renderCreatePanelContent());
      });
    _0x35b712.querySelectorAll('.v2-asset-update-item').forEach((_0x3d8be1) => {
      _0x3d8be1.addEventListener('click', () => {
        const _0x5e6e91 = String(_0x3d8be1.dataset.assetId || ''),
          _0x272171 = this._getSortedAssets().find((_0x1d31e7) => String(_0x1d31e7?.id || '') === _0x5e6e91);
        if (!_0x272171) return;
        (this._syncCreatePanelDraftFromTarget(_0x272171), this._renderCreatePanelContent());
      });
    });
    const _0x382b0e = _0x35b712.querySelector('#asset-create-submit');
    _0x382b0e &&
      _0x382b0e.addEventListener('click', () => {
        this._submitCreatePanel();
      });
    const _0xecf11d = _0x35b712.querySelector('#asset-join-submit');
    _0xecf11d &&
      _0xecf11d.addEventListener('click', () => {
        this._joinCreatePanelToAsset();
      });
  }
  async ['_submitCreatePanel']() {
    const _0x587e02 = this._createPanelState,
      _0xef7db9 = this.createPanel;
    if (!_0x587e02 || !_0xef7db9 || _0x587e02.saving) return;
    const _0xa2a58b = Array.isArray(_0x587e02.selectedIds) ? _0x587e02.selectedIds : [],
      _0x393ef4 = this._getSelectedAssetNodes(_0xa2a58b);
    if (!_0x393ef4.length) {
      (this._setCreatePanelState({ error: assetManagerText('errors.noSavableNodes') }),
        this._renderCreatePanelContent());
      return;
    }
    const _0x183f39 =
        String(this._createPanelState?.draft?.name || '').trim() || assetManagerText('unnamedAsset'),
      _0x3d4782 = String(this._createPanelState?.draft?.category || '').trim() || this.activeTab;
    if (_0x587e02.mode === 'update') {
      const _0x1b5f7a = this._getFilteredUpdateAssets().find(
        (_0x1e799a) => String(_0x1e799a?.id || '') === String(_0x587e02.selectedAssetId || ''),
      );
      if (!_0x1b5f7a) {
        (this._setCreatePanelState({ error: assetManagerText('errors.selectAssetToUpdate') }),
          this._renderCreatePanelContent());
        return;
      }
      if (!_0x587e02.updateConfirmOpen) {
        (this._setCreatePanelState({ updateConfirmOpen: true, error: '' }), this._renderCreatePanelContent());
        return;
      }
      const _0x4ecf8c = this._buildAssetPayloadFromSelection(_0xa2a58b, {
        id: _0x1b5f7a.id,
        name: _0x183f39,
        category: _0x3d4782,
        createdAt: _0x1b5f7a.createdAt || _0x1b5f7a.updatedAt || Date.now(),
        updatedAt: Date.now(),
      });
      (this._setCreatePanelState({ saving: true, savingAction: 'overwrite', error: '' }),
        this._renderCreatePanelContent());
      try {
        (await saveAssetToServer(_0x4ecf8c),
          this._upsertLocalAsset(_0x4ecf8c),
          this._scheduleVideoThumbJobs(),
          (this._openAssetId =
            String(_0x4ecf8c.id || '') === this._openAssetId ? _0x4ecf8c.id : this._openAssetId),
          window.showToast?.(assetManagerText('toasts.assetUpdated'), 'success'),
          this.closeCreatePanel(),
          this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
      } catch (_0x23a32e) {
        (this._setCreatePanelState({
          saving: false,
          savingAction: '',
          error: assetManagerText('errors.assetUpdateFailed'),
        }),
          this._renderCreatePanelContent(),
          console.error(_0x23a32e),
          window.showToast?.(assetManagerText('errors.assetUpdateFailed'), 'error'));
      }
      return;
    }
    const _0x1c81e5 = this._buildAssetPayloadFromSelection(_0xa2a58b, {
      name: _0x183f39,
      category: _0x3d4782,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    (this._setCreatePanelState({ saving: true, savingAction: 'create', error: '' }),
      this._renderCreatePanelContent());
    try {
      (await saveAssetToServer(_0x1c81e5),
        this._upsertLocalAsset(_0x1c81e5),
        this._scheduleVideoThumbJobs(),
        window.showToast?.(assetManagerText('toasts.assetCreated'), 'success'),
        this._playCreateAssetFly(_0xef7db9),
        this.closeCreatePanel(),
        this.sidebarPanel?.classList.contains('show') &&
          ((this._newAssetPulseId = String(_0x1c81e5.id || '')), this.renderSidebarContent()));
    } catch (_0x155824) {
      (this._setCreatePanelState({
        saving: false,
        savingAction: '',
        error: assetManagerText('errors.assetCreateFailed'),
      }),
        this._renderCreatePanelContent(),
        console.error(_0x155824),
        window.showToast?.(assetManagerText('errors.assetCreateFailed'), 'error'));
    }
  }
  async ['_joinCreatePanelToAsset']() {
    const _0xd752d8 = this._createPanelState,
      _0x3e17ce = this.createPanel;
    if (!_0xd752d8 || !_0x3e17ce || _0xd752d8.saving) return;
    const _0xe38283 = Array.isArray(_0xd752d8.selectedIds) ? _0xd752d8.selectedIds : [],
      _0x1e3b91 = this._getSelectedAssetNodes(_0xe38283);
    if (!_0x1e3b91.length) {
      (this._setCreatePanelState({ error: assetManagerText('errors.noJoinableNodes') }),
        this._renderCreatePanelContent());
      return;
    }
    const _0x1e52c6 = this._getFilteredUpdateAssets().find(
      (_0x1e781a) => String(_0x1e781a?.id || '') === String(_0xd752d8.selectedAssetId || ''),
    );
    if (!_0x1e52c6) {
      (this._setCreatePanelState({ error: assetManagerText('errors.selectAssetToJoin') }),
        this._renderCreatePanelContent());
      return;
    }
    const _0xb598e9 =
        String(this._createPanelState?.draft?.name || '').trim() || assetManagerText('unnamedAsset'),
      _0x5b208b = String(this._createPanelState?.draft?.category || '').trim() || this.activeTab,
      _0x4b4996 = this._buildAssetAppendPayload(_0x1e52c6, _0xe38283, {
        name: _0xb598e9,
        category: _0x5b208b,
        updatedAt: Date.now(),
      });
    (this._setCreatePanelState({ saving: true, savingAction: 'join', updateConfirmOpen: false, error: '' }),
      this._renderCreatePanelContent());
    try {
      (await saveAssetToServer(_0x4b4996),
        this._upsertLocalAsset(_0x4b4996),
        this._scheduleVideoThumbJobs(),
        (this._openAssetId =
          String(_0x4b4996.id || '') === this._openAssetId ? _0x4b4996.id : this._openAssetId),
        window.showToast?.(assetManagerText('toasts.assetJoined'), 'success'),
        this.closeCreatePanel(),
        this.sidebarPanel?.classList.contains('show') && this.renderSidebarContent());
    } catch (_0x313be5) {
      (this._setCreatePanelState({
        saving: false,
        savingAction: '',
        error: assetManagerText('errors.assetJoinFailed'),
      }),
        this._renderCreatePanelContent(),
        console.error(_0x313be5),
        window.showToast?.(assetManagerText('errors.assetJoinFailed'), 'error'));
    }
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: _0x4c05ac } = appStore.getState(),
      _0x5a0ed6 = window.innerWidth / 2,
      _0xf09185 = window.innerHeight / 2,
      _0x4f1c5a = document.documentElement?.clientWidth || window.innerWidth || 0,
      _0x8207d5 = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!_0x4f1c5a || !_0x8207d5) return screenToWorld(_0x5a0ed6, _0xf09185, _0x4c05ac);
    let _0x29d7d8 = 0,
      _0x22e4cf = 0,
      _0x46d1f4 = _0x4f1c5a,
      _0x593c6e = _0x8207d5;
    const _0x4aeaee = [],
      _0x21c8f4 = document.querySelector('header');
    if (_0x21c8f4) _0x4aeaee.push(_0x21c8f4);
    const _0x1a0399 = document.querySelector('.sidebar-floating');
    if (_0x1a0399) _0x4aeaee.push(_0x1a0399);
    if (this.sidebarPanel?.classList?.contains('show')) _0x4aeaee.push(this.sidebarPanel);
    const _0x3c4157 = 8;
    for (const _0x1708f4 of _0x4aeaee) {
      if (!_0x1708f4?.isConnected) continue;
      const _0x586765 = _0x1708f4.getBoundingClientRect(),
        _0x1f8aad = Math.max(_0x29d7d8, _0x586765.left),
        _0x568195 = Math.max(_0x22e4cf, _0x586765.top),
        _0x48f894 = Math.min(_0x46d1f4, _0x586765.right),
        _0x497890 = Math.min(_0x593c6e, _0x586765.bottom);
      if (_0x48f894 <= _0x1f8aad || _0x497890 <= _0x568195) continue;
      if (_0x586765.left <= _0x29d7d8 + _0x3c4157 && _0x586765.right > _0x29d7d8 + _0x3c4157) {
        _0x29d7d8 = Math.max(_0x29d7d8, _0x586765.right);
        continue;
      }
      if (_0x586765.right >= _0x46d1f4 - _0x3c4157 && _0x586765.left < _0x46d1f4 - _0x3c4157) {
        _0x46d1f4 = Math.min(_0x46d1f4, _0x586765.left);
        continue;
      }
      if (_0x586765.top <= _0x22e4cf + _0x3c4157 && _0x586765.bottom > _0x22e4cf + _0x3c4157) {
        _0x22e4cf = Math.max(_0x22e4cf, _0x586765.bottom);
        continue;
      }
      if (_0x586765.bottom >= _0x593c6e - _0x3c4157 && _0x586765.top < _0x593c6e - _0x3c4157) {
        _0x593c6e = Math.min(_0x593c6e, _0x586765.top);
        continue;
      }
    }
    const _0x5ac355 = _0x46d1f4 - _0x29d7d8,
      _0x45083d = _0x593c6e - _0x22e4cf,
      _0x2ab7a3 = _0x5ac355 > 40 ? _0x29d7d8 + _0x5ac355 / 2 : _0x5a0ed6,
      _0x3e65ff = _0x45083d > 40 ? _0x22e4cf + _0x45083d / 2 : _0xf09185;
    return screenToWorld(_0x2ab7a3, _0x3e65ff, _0x4c05ac);
  }
  ['_calcNodesBBox'](_0x244830) {
    let _0x9ed139 = Infinity,
      _0x1c13a6 = Infinity,
      _0x1abb96 = -Infinity,
      _0x3fdb1b = -Infinity;
    for (const _0x470a1d of _0x244830 || []) {
      if (!_0x470a1d) continue;
      const _0x20bca8 = Number(_0x470a1d.x) || 0,
        _0x3b6c14 = Number(_0x470a1d.y) || 0,
        _0x4a86b7 = Number(_0x470a1d.width ?? _0x470a1d.w) || 100,
        _0x400f1e = Number(_0x470a1d.height ?? _0x470a1d.h) || 100;
      ((_0x9ed139 = Math.min(_0x9ed139, _0x20bca8)),
        (_0x1c13a6 = Math.min(_0x1c13a6, _0x3b6c14)),
        (_0x1abb96 = Math.max(_0x1abb96, _0x20bca8 + _0x4a86b7)),
        (_0x3fdb1b = Math.max(_0x3fdb1b, _0x3b6c14 + _0x400f1e)));
    }
    if (!Number.isFinite(_0x9ed139) || !Number.isFinite(_0x1c13a6))
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
    const _0x490479 = Math.max(0, _0x1abb96 - _0x9ed139),
      _0x1dc7f5 = Math.max(0, _0x3fdb1b - _0x1c13a6);
    return {
      minX: _0x9ed139,
      minY: _0x1c13a6,
      maxX: _0x1abb96,
      maxY: _0x3fdb1b,
      w: _0x490479,
      h: _0x1dc7f5,
      cx: _0x9ed139 + _0x490479 / 2,
      cy: _0x1c13a6 + _0x1dc7f5 / 2,
    };
  }
  ['_preloadThumb'](_0x5aed0d) {
    const _0x1386b7 = String(_0x5aed0d || '');
    if (!_0x1386b7) return;
    if (_0x1386b7.startsWith('data:')) return;
    if (this._thumbPreloadSet.has(_0x1386b7)) return;
    (this._thumbPreloadSet.add(_0x1386b7), this._ensureThumbDecoded(_0x1386b7));
  }
  ['_ensureThumbDecoded'](_0x3c2fa1) {
    const _0x31a1f6 = String(_0x3c2fa1 || '');
    if (!_0x31a1f6) return Promise.resolve(false);
    if (_0x31a1f6.startsWith('data:')) return Promise.resolve(true);
    const _0x238e40 = this._thumbDecodePromiseMap.get(_0x31a1f6);
    if (_0x238e40) return _0x238e40;
    const _0x2676b9 = preloadCanvasImage(_0x31a1f6, { priority: 20, fetchPriority: 'auto' }).then(
      () => true,
      () => false,
    );
    return (this._thumbDecodePromiseMap.set(_0x31a1f6, _0x2676b9), _0x2676b9);
  }
  ['_isVideoMediaSrc'](_0x460364) {
    const _0x248f70 = String(_0x460364 || '').toLowerCase();
    return (
      _0x248f70.endsWith('.mp4') ||
      _0x248f70.endsWith('.webm') ||
      _0x248f70.endsWith('.mov') ||
      _0x248f70.endsWith('.mkv') ||
      _0x248f70.endsWith('.m4v')
    );
  }
  async ['_captureVideoFirstFrameDataUrl'](_0x481384) {
    const _0x5e2a82 = String(_0x481384 || '');
    if (!_0x5e2a82) return '';
    return await new Promise((_0x485fae) => {
      const _0x63a578 = document.createElement('video');
      ((_0x63a578.preload = 'auto'),
        (_0x63a578.muted = true),
        (_0x63a578.playsInline = true),
        (_0x63a578.crossOrigin = 'anonymous'));
      const _0x255fc1 = () => {
          (_0x63a578.removeAttribute('src'), _0x63a578.load());
        },
        _0x132110 = () => {
          (_0x255fc1(), _0x485fae(''));
        },
        _0x3cad86 = async () => {
          try {
            const _0x1cf013 = Number.isFinite(_0x63a578.duration) ? _0x63a578.duration : 0,
              _0x3d2134 = _0x1cf013 > 0 ? Math.min(0.08, Math.max(0, _0x1cf013 - 0.08)) : 0,
              _0x454740 = () => {
                try {
                  const _0x58f5ac = _0x63a578.videoWidth || 0,
                    _0x13d33a = _0x63a578.videoHeight || 0;
                  if (!_0x58f5ac || !_0x13d33a) return _0x132110();
                  const _0x1ed68d = 0x140,
                    _0x9bd9f2 = 0x140,
                    _0x5d975e = Math.min(1, _0x1ed68d / _0x58f5ac, _0x9bd9f2 / _0x13d33a),
                    _0x157b43 = Math.max(1, Math.round(_0x58f5ac * _0x5d975e)),
                    _0x5d35a2 = Math.max(1, Math.round(_0x13d33a * _0x5d975e)),
                    _0x3ccef5 = document.createElement('canvas');
                  ((_0x3ccef5.width = _0x157b43), (_0x3ccef5.height = _0x5d35a2));
                  const _0x2d81c9 = _0x3ccef5.getContext('2d');
                  _0x2d81c9.drawImage(_0x63a578, 0, 0, _0x157b43, _0x5d35a2);
                  const _0x462e82 = _0x3ccef5.toDataURL('image/jpeg', 0.82);
                  (_0x255fc1(), _0x485fae(_0x462e82));
                } catch (_0x307f58) {
                  _0x132110();
                } finally {
                  _0x63a578.removeEventListener('seeked', _0x454740);
                }
              };
            (_0x63a578.addEventListener('seeked', _0x454740, { once: true }),
              (_0x63a578.currentTime = _0x3d2134));
          } catch (_0x3de478) {
            _0x132110();
          }
        };
      (_0x63a578.addEventListener('error', _0x132110, { once: true }),
        _0x63a578.addEventListener('loadeddata', _0x3cad86, { once: true }),
        attachMediaElementPlaybackSource(_0x63a578, _0x5e2a82, { preload: 'auto' }).catch(() => {
          if (!String(_0x63a578.getAttribute('src') || _0x63a578.src || '').trim()) {
            _0x63a578.src = _0x5e2a82;
            try {
              _0x63a578.load?.();
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
  ['_beginRenameAsset'](_0x144035) {
    const _0xf7efdf = String(_0x144035 || '');
    if (!_0xf7efdf) return;
    if (this._pendingDeleteAssetId) this._pendingDeleteAssetId = '';
    ((this._renamingAssetId = _0xf7efdf), this.renderSidebarContent());
  }
  ['_cancelRenameAsset']() {
    if (!this._renamingAssetId) return;
    ((this._renamingAssetId = ''), this.renderSidebarContent());
  }
  async ['_commitRenameAsset'](_0x251222, _0x33f8a0) {
    const _0x214c6e = String(_0x251222 || ''),
      _0x7b1f92 = String(_0x33f8a0 || '').trim();
    if (!_0x214c6e) return;
    if (!_0x7b1f92) {
      window.showToast?.(assetManagerText('errors.nameRequired'), 'error');
      return;
    }
    const _0x48ca3d = (this.assets || []).find((_0x433456) => String(_0x433456?.id || '') === _0x214c6e);
    if (!_0x48ca3d) return;
    const _0x49ee62 = String(_0x48ca3d?.name || ''),
      _0x36fd81 = _0x48ca3d?.updatedAt;
    if (_0x49ee62 === _0x7b1f92) {
      ((this._renamingAssetId = ''), this.renderSidebarContent());
      return;
    }
    ((_0x48ca3d.name = _0x7b1f92), (_0x48ca3d.updatedAt = Date.now()));
    try {
      (await saveAssetToServer(_0x48ca3d),
        this._upsertLocalAsset(_0x48ca3d),
        window.showToast?.(assetManagerText('toasts.renamed'), 'success'));
    } catch (_0x5a62c9) {
      ((_0x48ca3d.name = _0x49ee62),
        (_0x48ca3d.updatedAt = _0x36fd81),
        window.showToast?.(assetManagerText('errors.renameFailed'), 'error'));
    } finally {
      ((this._renamingAssetId = ''), this.renderSidebarContent());
    }
  }
  async ['_runVideoThumbJobs']() {
    let _0x4503f0 = 2;
    for (const _0x3edacb of this.assets || []) {
      if (_0x4503f0 <= 0) break;
      const _0x48722b = String(_0x3edacb?.id || '').trim();
      if (!_0x48722b) continue;
      const _0x1fd73b = Array.isArray(_0x3edacb?.items) ? _0x3edacb.items : [];
      for (let _0x566220 = 0; _0x566220 < _0x1fd73b.length; _0x566220++) {
        if (_0x4503f0 <= 0) break;
        const _0x3fcaec = _0x1fd73b[_0x566220],
          _0x4d4ba7 = _normalizeAssetType(_0x3fcaec?.type);
        if (_0x4d4ba7 !== 'video') continue;
        const _0xcb40b1 = String(_0x3fcaec?.thumbSrc || '');
        if (_0xcb40b1 && !this._isVideoMediaSrc(_0xcb40b1)) continue;
        const _0x31190a = _0x48722b + ':' + _0x566220;
        if (this._videoThumbInFlight.has(_0x31190a)) continue;
        (this._videoThumbInFlight.add(_0x31190a), (_0x4503f0 -= 1));
        const _0x1c0487 = _0xcb40b1 || _resolveNodeStableThumbSrc(_0x3fcaec?.nodeData);
        this._captureVideoFirstFrameDataUrl(_0x1c0487)
          .then(async (_0x4ef4ad) => {
            if (!String(_0x4ef4ad || '').startsWith('data:image/')) return;
            const _0x3b941e = await saveAssetThumbToServer({
                assetId: _0x48722b,
                key: String(_0x566220),
                dataUrl: _0x4ef4ad,
              }),
              _0x68fb8b = String(_0x3b941e?.url || '');
            if (!_0x68fb8b) return;
            _0x3fcaec.thumbSrc = _0x68fb8b;
            if (!_0x3edacb.coverUrl && _0x566220 === 0) _0x3edacb.coverUrl = _0x68fb8b;
            (await saveAssetToServer(_0x3edacb),
              upsertAssetMentionAsset(_0x3edacb),
              this.sidebarPanel?.classList.contains('show') && this._scheduleSidebarRender());
          })
          .catch(() => {})
          .finally(() => {
            this._videoThumbInFlight.delete(_0x31190a);
          });
      }
    }
  }
  async ['loadAssetsFromServer']() {
    try {
      const _0x464b70 = await fetchAssetsFromServer();
      ((this.assets = _sortAssetsByUpdatedTime(
        (Array.isArray(_0x464b70) ? _0x464b70 : [])
          .map((_0x26d5c2) => this._normalizeAssetEntity(_0x26d5c2))
          .filter(Boolean),
      )),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.assets.forEach((_0x45a1b8) => {
          !_0x45a1b8.coverUrl &&
            _0x45a1b8.nodes &&
            _0x45a1b8.nodes[0] &&
            (_0x45a1b8.coverUrl = _resolveNodeStableThumbSrc(_0x45a1b8.nodes[0]));
          if (Array.isArray(_0x45a1b8.items))
            _0x45a1b8.items.forEach((_0x5408e3) => {
              !_0x5408e3.thumbSrc &&
                _0x5408e3.nodeData &&
                (_0x5408e3.thumbSrc = _resolveNodeStableThumbSrc(_0x5408e3.nodeData));
            });
          else
            Array.isArray(_0x45a1b8.nodes) &&
              (_0x45a1b8.items = _0x45a1b8.nodes.map((_0x3c6ddd) => _buildAssetItem(_0x3c6ddd)));
        }),
        setAssetMentionAssets(this._getMentionEligibleAssets()));
      let _0x49140b = 0;
      for (const _0x111f53 of this.assets) {
        if (_0x49140b >= 32) break;
        _0x111f53?.coverUrl && (this._preloadThumb(_0x111f53.coverUrl), (_0x49140b += 1));
        const _0x32d106 = Array.isArray(_0x111f53?.items) ? _0x111f53.items : [];
        for (const _0x266b58 of _0x32d106) {
          if (_0x49140b >= 32) break;
          _0x266b58?.thumbSrc && (this._preloadThumb(_0x266b58.thumbSrc), (_0x49140b += 1));
        }
      }
      (this._scheduleVideoThumbJobs(),
        this.sidebarPanel && this.sidebarPanel.classList.contains('show') && this.renderSidebarContent());
    } catch (_0x35d395) {
      console.error('加载全局资产失败', _0x35d395);
    }
  }
  async ['showCreatePanel'](_0x342ca2, _0x1ae58f, _0x1235c2 = {}) {
    if (!_0x342ca2 || _0x342ca2.length === 0) return;
    (void _0x1ae58f, void _0x1235c2, this.closeCreatePanel());
    const _0x126549 = document.createElement('div');
    _0x126549.className = 'v2-asset-create-backdrop show';
    const _0x378271 = document.createElement('div');
    ((_0x378271.className = 'v2-asset-create-panel'),
      _0x378271.setAttribute('role', 'dialog'),
      _0x378271.setAttribute('aria-modal', 'true'),
      _0x378271.setAttribute('aria-label', assetManagerText('title')));
    const _0x1e32e4 = appStore.getState(),
      _0x29f5bc = _0x1e32e4.nodes[_0x342ca2[0]];
    (_0x126549.appendChild(_0x378271),
      document.body.appendChild(_0x126549),
      (this.createPanelBackdrop = _0x126549),
      (this.createPanel = _0x378271));
    const _0x20a37f = await this._resolveCreatePanelCover(_0x29f5bc);
    if (!this.createPanel || this.createPanel !== _0x378271) {
      String(this._createPanelCoverObjectUrl || '').startsWith('blob:') &&
        URL.revokeObjectURL(this._createPanelCoverObjectUrl);
      this._createPanelCoverObjectUrl = '';
      return;
    }
    ((this._createPanelState = this._createDefaultPanelState(_0x342ca2, _0x20a37f)),
      this._renderCreatePanelContent(),
      _0x126549.addEventListener('pointerdown', (_0x1818b6) => {
        if (_0x1818b6.target === _0x126549) this.closeCreatePanel();
      }),
      (this._createPanelKeydownHandler = (_0x5e3a36) => {
        if (_0x5e3a36.key !== 'Escape') return;
        if (this._createPanelDropdownEl?.contains(_0x5e3a36.target)) return;
        this.closeCreatePanel();
      }),
      document.addEventListener('keydown', this._createPanelKeydownHandler));
  }
  ['_playCreateAssetFly'](_0x146c8b) {
    const _0x33f3d4 = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (_0x33f3d4) return;
    const _0x8fd558 = _0x146c8b && _0x146c8b.isConnected ? _0x146c8b : this.createPanel;
    if (!_0x8fd558?.isConnected) return;
    const _0x4c60c6 = _0x8fd558.querySelector('.v2-asset-create-cover'),
      _0x3602b6 = _0x4c60c6?.firstElementChild;
    if (!_0x3602b6) return;
    const _0x24247e = _0x3602b6.getBoundingClientRect();
    if (!_0x24247e.width || !_0x24247e.height) return;
    const _0x7d6506 = document.getElementById('btnAssets'),
      _0x215bc0 = _0x7d6506?.getBoundingClientRect?.();
    if (!_0x215bc0) return;
    const _0x2c7f6f = document.createElement('div');
    ((_0x2c7f6f.className = 'v2-asset-create-fly'),
      (_0x2c7f6f.style.left = _0x24247e.left + 'px'),
      (_0x2c7f6f.style.top = _0x24247e.top + 'px'),
      (_0x2c7f6f.style.width = _0x24247e.width + 'px'),
      (_0x2c7f6f.style.height = _0x24247e.height + 'px'));
    const _0x40d5d0 = _0x3602b6.cloneNode(true);
    if (_0x40d5d0?.id) _0x40d5d0.removeAttribute('id');
    (_0x2c7f6f.appendChild(_0x40d5d0), document.body.appendChild(_0x2c7f6f));
    const _0x3e1a40 = _0x24247e.left + _0x24247e.width / 2,
      _0x41e94f = _0x24247e.top + _0x24247e.height / 2,
      _0xccf294 = _0x215bc0.left + _0x215bc0.width / 2,
      _0x19d253 = _0x215bc0.top + _0x215bc0.height / 2,
      _0x21b414 = _0xccf294 - _0x3e1a40,
      _0x32e45e = _0x19d253 - _0x41e94f,
      _0x179875 = 0.12,
      _0x599e86 = _0x2c7f6f.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          {
            transform: 'translate(' + _0x21b414 + 'px,' + _0x32e45e + 'px) scale(' + _0x179875 + ')',
            opacity: 0.2,
          },
        ],
        { duration: 0x208, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    _0x599e86.onfinish = () => {
      (_0x2c7f6f.remove(),
        _0x7d6506?.animate &&
          _0x7d6506.animate(
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
    const _0x1acabe = document.querySelector('.sidebar-floating');
    _0x1acabe ? _0x1acabe.appendChild(this.sidebarPanel) : document.body.appendChild(this.sidebarPanel);
    const _0x183fc2 = this.sidebarPanel.querySelector('#asset-sidebar-tabs');
    (_0x183fc2.addEventListener('click', (_0x3f3d3a) => {
      if (_0x3f3d3a.target.closest("[data-ui-action='asset-category-delete']")) return;
      const _0x3e278c = _0x3f3d3a.target.closest('.v2-asset-sidebar-tab');
      _0x3e278c &&
        ((this._renamingAssetId = ''),
        (this._pendingDeleteAssetId = ''),
        (this.activeTab = _0x3e278c.dataset.cat),
        (this._openAssetId = null),
        _0x183fc2
          .querySelectorAll('.v2-asset-sidebar-tab')
          .forEach((_0x26bcb3) => _0x26bcb3.classList.remove('active')),
        _0x3e278c.classList.add('active'),
        this.renderSidebarContent());
    }),
      _0x183fc2.addEventListener('scroll', () => this._updateSidebarTabsOverflowHint(), { passive: true }),
      this.sidebarPanel.addEventListener('click', (_0x2919a5) => {
        const _0x837586 = _0x2919a5.target.closest('[data-ui-action]'),
          _0x5b6083 = _0x837586?.dataset?.uiAction || '';
        if (_0x5b6083 === 'asset-tabs-scroll-prev') {
          (_0x2919a5.preventDefault(), _0x2919a5.stopPropagation(), this._scrollSidebarTabs(-1));
          return;
        }
        if (_0x5b6083 === 'asset-tabs-scroll-next') {
          (_0x2919a5.preventDefault(), _0x2919a5.stopPropagation(), this._scrollSidebarTabs(1));
          return;
        }
        if (_0x5b6083 === 'asset-category-delete') {
          (_0x2919a5.preventDefault(), _0x2919a5.stopPropagation());
          const _0x52d561 = _0x837586?.dataset?.cat;
          if (_0x52d561) void this._deleteUserCategory(_0x52d561);
          return;
        }
        if (_0x5b6083 === 'asset-back') {
          ((this._renamingAssetId = ''),
            (this._pendingDeleteAssetId = ''),
            (this._openAssetId = null),
            this.renderSidebarContent());
          return;
        }
        if (_0x5b6083 === 'asset-delete-open') {
          (_0x2919a5.preventDefault(), _0x2919a5.stopPropagation(), (this._renamingAssetId = ''));
          const _0x50b551 = _0x837586?.dataset?.assetId;
          if (!_0x50b551) return;
          ((this._pendingDeleteAssetId = _0x50b551), this.renderSidebarContent());
          return;
        }
        if (_0x5b6083 === 'asset-delete-cancel') {
          (_0x2919a5.preventDefault(),
            _0x2919a5.stopPropagation(),
            (this._pendingDeleteAssetId = ''),
            this.renderSidebarContent());
          return;
        }
        if (_0x5b6083 === 'asset-delete-confirm') {
          (_0x2919a5.preventDefault(), _0x2919a5.stopPropagation());
          const _0x26834b = _0x837586?.dataset?.assetId;
          if (!_0x26834b) return;
          ((this._pendingDeleteAssetId = ''), this._deleteAsset(_0x26834b));
          return;
        }
        if (_0x5b6083 === 'asset-add-all') {
          (_0x2919a5.preventDefault(),
            _0x2919a5.stopPropagation(),
            (this._renamingAssetId = ''),
            (this._pendingDeleteAssetId = ''));
          const _0x4a105b = _0x837586?.dataset?.assetId;
          if (_0x4a105b) this.restoreAssetToCanvas(_0x4a105b);
          return;
        }
        const _0x46c996 = _0x2919a5.target.closest('.v2-asset-subitem');
        if (_0x46c996) {
          const _0x55d74d = _0x46c996.dataset.assetId,
            _0x812042 = Number(_0x46c996.dataset.idx);
          if (_0x55d74d && Number.isFinite(_0x812042)) this._restoreAssetSubItem(_0x55d74d, _0x812042);
          return;
        }
        const _0x273d5a = _0x2919a5.target.closest('.v2-asset-item');
        _0x273d5a &&
          _0x273d5a.dataset?.id &&
          ((this._renamingAssetId = ''),
          (this._pendingDeleteAssetId = ''),
          (this._openAssetId = _0x273d5a.dataset.id),
          this.renderSidebarContent());
      }));
    const _0x1cd4b8 = document.getElementById('btnAssets');
    if (_0x1cd4b8) {
      let _0x3cb123 = false;
      const _0x2b9ddb = () => {
        (!this.sidebarPanel.classList.contains('show') && this.showSidebarPanel(),
          !_0x3cb123 &&
            ((_0x3cb123 = true),
            this.loadAssetsFromServer().finally(() => {
              _0x3cb123 = false;
            })));
      };
      registerSidebarSubmenu({
        key: 'assets',
        button: _0x1cd4b8,
        panel: this.sidebarPanel,
        open: _0x2b9ddb,
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
    const _0x312254 = this.sidebarPanel?.querySelector('#asset-sidebar-content > .v2-asset-view-list');
    if (!_0x312254) return { listView: null, cards: [] };
    const _0x8eff01 = Array.from(_0x312254.querySelectorAll(':scope > .v2-asset-item')).filter(
      (_0x18a75c) => _0x18a75c.style.display !== 'none',
    );
    return { listView: _0x312254, cards: _0x8eff01 };
  }
  ['_captureRectsById'](_0x38a036) {
    const _0x52b523 = new Map();
    for (const _0x411d63 of _0x38a036) {
      const _0x21c490 = String(_0x411d63.dataset?.id || '');
      if (!_0x21c490) continue;
      _0x52b523.set(_0x21c490, _0x411d63.getBoundingClientRect());
    }
    return _0x52b523;
  }
  ['_playFlip'](_0x498563, _0x2d524d) {
    if (!_0x498563 || !_0x2d524d?.size) return;
    const _0x26e1da = Array.from(_0x498563.querySelectorAll(':scope > .v2-asset-item')).filter(
        (_0x2b1a95) => _0x2b1a95.style.display !== 'none',
      ),
      _0x5b0c96 = new Map();
    for (const _0x12a82f of _0x26e1da) {
      const _0x1c8809 = String(_0x12a82f.dataset?.id || '');
      if (!_0x1c8809) continue;
      _0x5b0c96.set(_0x1c8809, _0x12a82f.getBoundingClientRect());
    }
    for (const _0x1f0547 of _0x26e1da) {
      const _0x5d6803 = String(_0x1f0547.dataset?.id || '');
      if (!_0x5d6803) continue;
      const _0x1dd597 = _0x2d524d.get(_0x5d6803),
        _0x29ae7d = _0x5b0c96.get(_0x5d6803);
      if (!_0x1dd597 || !_0x29ae7d) continue;
      const _0x2221f9 = _0x1dd597.left - _0x29ae7d.left,
        _0x4d15c5 = _0x1dd597.top - _0x29ae7d.top;
      if (!_0x2221f9 && !_0x4d15c5) continue;
      _0x1f0547.animate(
        [
          { transform: 'translate(' + _0x2221f9 + 'px, ' + _0x4d15c5 + 'px)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    }
  }
  ['_playDeleteShake'](_0x4b5e94) {
    if (!_0x4b5e94) return;
    (_0x4b5e94.classList.remove('is-delete-shaking'),
      void _0x4b5e94.offsetWidth,
      _0x4b5e94.classList.add('is-delete-shaking'),
      window.setTimeout(() => {
        if (_0x4b5e94.isConnected) _0x4b5e94.classList.remove('is-delete-shaking');
      }, 240));
  }
  async ['_deleteAsset'](_0x1d8d6e) {
    const _0xba435d = String(_0x1d8d6e || '');
    if (!_0xba435d) return;
    const { listView: _0x58e672, cards: _0x42f908 } = this._getVisibleAssetCardsInList(),
      _0x2806c1 = this._captureRectsById(_0x42f908);
    try {
      await deleteAssetFromServer(_0xba435d);
    } catch (_0x126e76) {
      window.showToast?.(assetManagerText('deleteFailed'), 'error');
      return;
    }
    ((this.assets = (this.assets || []).filter((_0x4a86be) => String(_0x4a86be?.id || '') !== _0xba435d)),
      this._syncTabsFromAssets(),
      this._renderSidebarTabs(),
      removeAssetMentionAsset(_0xba435d));
    if (this._openAssetId === _0xba435d) this._openAssetId = null;
    const _0x1320bf = this._assetCardPool?.get?.(_0xba435d);
    if (_0x1320bf?.isConnected) _0x1320bf.remove();
    (this._assetCardPool?.delete?.(_0xba435d),
      this.renderSidebarContent(),
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const { listView: _0x3c0177 } = this._getVisibleAssetCardsInList();
          this._playFlip(_0x3c0177, _0x2806c1);
        });
      }));
  }
  async ['_deleteUserCategory'](_0x3339ae) {
    const _0x2bed5d = this._normalizeCategoryName(_0x3339ae);
    if (!_0x2bed5d || !this._isUserCategory(_0x2bed5d)) return;
    const _0x2aeaca = this._getSortedAssets().some(
      (_0xd1d955) => this._categoryKey(_0xd1d955?.category) === this._categoryKey(_0x2bed5d),
    );
    if (_0x2aeaca) {
      window.showToast?.(assetManagerText('categoryHasAssets'), 'warn');
      return;
    }
    const _0x214ec4 = [...this.userCategories];
    this.userCategories = _0x214ec4.filter(
      (_0x2aa5c2) => this._categoryKey(_0x2aa5c2) !== this._categoryKey(_0x2bed5d),
    );
    this._categoryKey(this.activeTab) === this._categoryKey(_0x2bed5d) &&
      ((this.activeTab = DEFAULT_ASSET_CATEGORIES[0]), (this._openAssetId = null));
    (this._syncTabsFromAssets(), this._renderSidebarTabs(), this.renderSidebarContent());
    try {
      (await this._saveUserCategories(), window.showToast?.(assetManagerText('categoryDeleted'), 'success'));
    } catch (_0x3a1d37) {
      ((this.userCategories = _0x214ec4),
        this._syncTabsFromAssets(),
        this._renderSidebarTabs(),
        this.renderSidebarContent(),
        console.error(_0x3a1d37),
        window.showToast?.(assetManagerText('categoryDeleteFailed'), 'error'));
    }
  }
  ['_setThumbContent'](_0x797c42, _0x862772, _0x78f2c) {
    if (!_0x797c42) return;
    const _0x4a83f3 = String(_0x862772 || ''),
      _0x4ba1d3 = _normalizeAssetType(_0x78f2c);
    if (_0x4a83f3 && !(_0x4ba1d3 === 'video' && this._isVideoMediaSrc(_0x4a83f3))) {
      const _0x4c1b8d = _0x797c42.dataset.thumbSrc || '';
      if (_0x797c42.dataset.thumbKind === 'img' && _0x4c1b8d === _0x4a83f3) return;
      if (_0x797c42.dataset.pendingSrc === _0x4a83f3) return;
      _0x797c42.childElementCount === 0 &&
        _0x797c42.dataset.thumbKind !== 'img' &&
        ((_0x797c42.dataset.thumbKind = 'icon'),
        (_0x797c42.dataset.thumbType = String(_0x78f2c || 'other')),
        (_0x797c42.dataset.thumbSrc = ''),
        (_0x797c42.innerHTML = _renderAssetIcon(_0x78f2c)));
      ((_0x797c42.dataset.pendingSrc = _0x4a83f3),
        this._ensureThumbDecoded(_0x4a83f3).then((_0x31748c) => {
          if (!_0x31748c) {
            if (_0x797c42.dataset.pendingSrc === _0x4a83f3) _0x797c42.dataset.pendingSrc = '';
            return;
          }
          if (!_0x797c42.isConnected) return;
          if (_0x797c42.dataset.pendingSrc !== _0x4a83f3) return;
          _0x797c42.dataset.pendingSrc = '';
          let _0x47e7e8 = _0x797c42.querySelector(':scope > img');
          !_0x47e7e8
            ? ((_0x47e7e8 = document.createElement('img')),
              (_0x47e7e8.alt = assetManagerText('thumbnailAlt')),
              (_0x47e7e8.draggable = false),
              (_0x47e7e8.decoding = 'async'),
              (_0x47e7e8.loading = 'eager'),
              (_0x47e7e8.className = 'v2-asset-thumb-img'))
            : _0x47e7e8.classList.add('v2-asset-thumb-img');
          if (_0x47e7e8.getAttribute('src') !== _0x4a83f3) _0x47e7e8.setAttribute('src', _0x4a83f3);
          ((_0x797c42.dataset.thumbKind = 'img'),
            (_0x797c42.dataset.thumbSrc = _0x4a83f3),
            (_0x797c42.firstElementChild !== _0x47e7e8 || _0x797c42.childElementCount !== 1) &&
              _0x797c42.replaceChildren(_0x47e7e8));
        }));
      return;
    }
    const _0x34c42a = String(_0x78f2c || 'other');
    if (_0x797c42.dataset.thumbKind === 'icon' && _0x797c42.dataset.thumbType === _0x34c42a) return;
    ((_0x797c42.dataset.thumbKind = 'icon'),
      (_0x797c42.dataset.thumbType = _0x34c42a),
      (_0x797c42.dataset.thumbSrc = ''),
      (_0x797c42.dataset.pendingSrc = ''),
      (_0x797c42.innerHTML = _renderAssetIcon(_0x34c42a)));
  }
  ['renderSidebarContent']() {
    const _0x31ce06 = this.sidebarPanel?.querySelector('#asset-sidebar-content');
    if (!_0x31ce06) return;
    const _0x44e62c = this.sidebarPanel.querySelector('#asset-sidebar-title-text'),
      _0x26d245 = this.sidebarPanel.querySelector('.v2-asset-back');
    this._renderSidebarTabs();
    const _0x520aa9 = () => {
        let _0x5448d6 = _0x31ce06.querySelector(':scope > .v2-asset-view-list');
        !_0x5448d6 &&
          ((_0x5448d6 = document.createElement('div')),
          (_0x5448d6.className = 'v2-asset-view-list'),
          _0x31ce06.appendChild(_0x5448d6));
        let _0x37d17e = _0x31ce06.querySelector(':scope > .v2-asset-view-detail');
        return (
          !_0x37d17e &&
            ((_0x37d17e = document.createElement('div')),
            (_0x37d17e.className = 'v2-asset-view-detail'),
            _0x31ce06.appendChild(_0x37d17e)),
          _0x31ce06
            .querySelectorAll(':scope > .v2-asset-item, :scope > .v2-asset-empty')
            .forEach((_0x812138) => _0x5448d6.appendChild(_0x812138)),
          _0x31ce06
            .querySelectorAll(':scope > .v2-asset-detail-actions, :scope > .v2-asset-subgrid')
            .forEach((_0x4b967d) => _0x37d17e.appendChild(_0x4b967d)),
          { listView: _0x5448d6, detailView: _0x37d17e }
        );
      },
      { listView: _0x58c425, detailView: _0x5a5ec9 } = _0x520aa9(),
      _0x438d98 = (_0x2efd17, _0x270fc3, _0x5e55f4) => this._setThumbContent(_0x2efd17, _0x270fc3, _0x5e55f4),
      _0x53b169 = (_0x3b192e) => {
        let _0x94ea55 = _0x3b192e.querySelector(':scope > .v2-asset-cover-grid');
        if (!_0x94ea55) {
          ((_0x94ea55 = document.createElement('div')), (_0x94ea55.className = 'v2-asset-cover-grid'));
          for (let _0x3a3b27 = 0; _0x3a3b27 < 4; _0x3a3b27++) {
            const _0x9883c0 = document.createElement('div');
            ((_0x9883c0.className = 'v2-asset-cover-cell'), _0x94ea55.appendChild(_0x9883c0));
          }
          _0x3b192e.replaceChildren(_0x94ea55);
        } else {
          const _0x2c30cf = _0x94ea55.querySelectorAll(':scope > .v2-asset-cover-cell');
          for (let _0x5a7ca5 = _0x2c30cf.length; _0x5a7ca5 < 4; _0x5a7ca5++) {
            const _0x14f48b = document.createElement('div');
            ((_0x14f48b.className = 'v2-asset-cover-cell'), _0x94ea55.appendChild(_0x14f48b));
          }
        }
        return _0x94ea55;
      },
      _0x117776 = (_0x238478, _0x2ce531) => {
        let _0x155cb7 = _0x238478.querySelector(':scope > .v2-asset-item-load'),
          _0x4fc64d = _0x238478.querySelector(':scope > .v2-asset-item-delete'),
          _0x28bde7 = _0x238478.querySelector(':scope > .v2-asset-item-delete-confirm'),
          _0x373710 = _0x238478.querySelector(':scope > .v2-asset-item-cover'),
          _0x558e15 = _0x238478.querySelector(':scope > .v2-asset-item-name');
        !_0x155cb7 &&
          ((_0x155cb7 = document.createElement('button')),
          (_0x155cb7.type = 'button'),
          (_0x155cb7.className = 'v2-asset-item-load'),
          (_0x155cb7.dataset.uiAction = 'asset-add-all'),
          (_0x155cb7.title = assetManagerText('loadToCanvas')),
          _0x155cb7.setAttribute('aria-label', assetManagerText('loadToCanvas')),
          (_0x155cb7.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'),
          _0x238478.appendChild(_0x155cb7));
        !_0x4fc64d &&
          ((_0x4fc64d = document.createElement('button')),
          (_0x4fc64d.type = 'button'),
          (_0x4fc64d.className = 'v2-asset-item-delete'),
          (_0x4fc64d.dataset.uiAction = 'asset-delete-open'),
          _0x4fc64d.setAttribute('aria-label', assetManagerText('deleteAsset')),
          (_0x4fc64d.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'),
          _0x238478.appendChild(_0x4fc64d));
        if (!_0x28bde7) {
          ((_0x28bde7 = document.createElement('div')),
            (_0x28bde7.className = 'v2-asset-item-delete-confirm'),
            (_0x28bde7.hidden = true),
            _0x28bde7.addEventListener('click', (_0x41553b) => {
              if (_0x41553b.target !== _0x28bde7) return;
              (_0x41553b.stopPropagation(), (this._pendingDeleteAssetId = ''), this.renderSidebarContent());
            }));
          const _0xf072b7 = document.createElement('button');
          ((_0xf072b7.type = 'button'),
            (_0xf072b7.className =
              'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--danger'),
            (_0xf072b7.dataset.uiAction = 'asset-delete-confirm'),
            (_0xf072b7.textContent = '✔'),
            _0xf072b7.setAttribute('aria-label', assetManagerText('confirm')));
          const _0x560fe6 = document.createElement('button');
          ((_0x560fe6.type = 'button'),
            (_0x560fe6.className =
              'v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--neutral'),
            (_0x560fe6.dataset.uiAction = 'asset-delete-cancel'),
            (_0x560fe6.textContent = '×'),
            _0x560fe6.setAttribute('aria-label', assetManagerText('cancel')),
            _0x28bde7.appendChild(_0xf072b7),
            _0x28bde7.appendChild(_0x560fe6),
            _0x238478.appendChild(_0x28bde7));
        }
        const _0x31351f = String(_0x2ce531?.id || '');
        ((_0x155cb7.dataset.assetId = _0x31351f),
          (_0x155cb7.disabled = !Array.isArray(_0x2ce531?.nodes) || _0x2ce531.nodes.length === 0),
          (_0x4fc64d.dataset.assetId = _0x31351f),
          _0x28bde7.querySelectorAll(':scope > button').forEach((_0x374cf5) => {
            _0x374cf5.dataset.assetId = _0x31351f;
          }));
        const _0x3ac0d6 = this._pendingDeleteAssetId === _0x31351f;
        ((_0x4fc64d.hidden = _0x3ac0d6), (_0x28bde7.hidden = !_0x3ac0d6));
        !_0x373710 &&
          ((_0x373710 = document.createElement('div')),
          (_0x373710.className = 'v2-asset-item-cover'),
          _0x238478.appendChild(_0x373710));
        !_0x558e15 &&
          ((_0x558e15 = document.createElement('div')),
          (_0x558e15.className = 'v2-asset-item-name'),
          _0x558e15.addEventListener('click', (_0x2fcc3b) => {
            _0x2fcc3b.stopPropagation();
            const _0x5480e5 = _0x2fcc3b.currentTarget?.closest?.('.v2-asset-item'),
              _0x144238 = _0x5480e5?.dataset?.id || '';
            this._beginRenameAsset(_0x144238);
          }),
          _0x238478.appendChild(_0x558e15));
        const _0x4c935d = String(_0x2ce531?.name || '');
        if (this._renamingAssetId === _0x31351f) {
          _0x558e15.classList.add('is-editing');
          let _0x30f35e = _0x558e15.querySelector(':scope > input.v2-asset-item-name-input');
          !_0x30f35e &&
            ((_0x30f35e = document.createElement('input')),
            (_0x30f35e.type = 'text'),
            (_0x30f35e.className = 'v2-asset-item-name-input'),
            _0x30f35e.addEventListener('click', (_0x3d39ce) => _0x3d39ce.stopPropagation()),
            _0x30f35e.addEventListener('keydown', (_0x17724c) => {
              if (_0x17724c.key === 'Enter') {
                (_0x17724c.preventDefault(),
                  _0x17724c.stopPropagation(),
                  (_0x30f35e.dataset.submitted = '1'),
                  this._commitRenameAsset(_0x31351f, _0x30f35e.value));
                return;
              }
              _0x17724c.key === 'Escape' &&
                (_0x17724c.preventDefault(), _0x17724c.stopPropagation(), this._cancelRenameAsset());
            }),
            _0x30f35e.addEventListener('blur', () => {
              if (_0x30f35e.dataset.submitted === '1') return;
              this._commitRenameAsset(_0x31351f, _0x30f35e.value);
            }),
            _0x558e15.replaceChildren(_0x30f35e));
          if (_0x30f35e.value !== _0x4c935d) _0x30f35e.value = _0x4c935d;
          if (_0x30f35e.getAttribute('aria-label') !== assetManagerText('createPanel.assetName'))
            _0x30f35e.setAttribute('aria-label', assetManagerText('createPanel.assetName'));
          window.requestAnimationFrame(() => {
            if (!_0x30f35e.isConnected) return;
            try {
              (_0x30f35e.focus(), _0x30f35e.select?.());
            } catch (_0x5a7682) {}
          });
        } else {
          if (_0x558e15.classList.contains('is-editing')) _0x558e15.classList.remove('is-editing');
          const _0x1fda48 = _0x558e15.querySelector(':scope > input.v2-asset-item-name-input');
          if (_0x1fda48) _0x558e15.replaceChildren();
          if (_0x558e15.textContent !== _0x4c935d) _0x558e15.textContent = _0x4c935d;
          if (_0x558e15.getAttribute('title') !== _0x4c935d) _0x558e15.setAttribute('title', _0x4c935d);
        }
        const _0x14f876 = Array.isArray(_0x2ce531?.items)
          ? _0x2ce531.items
          : Array.isArray(_0x2ce531?.nodes)
            ? _0x2ce531.nodes.map((_0x831417) => _buildAssetItem(_0x831417))
            : [];
        if (_0x14f876.length > 0) {
          const _0x57769c = _0x53b169(_0x373710),
            _0x261887 = _0x57769c.querySelectorAll(':scope > .v2-asset-cover-cell');
          for (let _0x3ae982 = 0; _0x3ae982 < 4; _0x3ae982++) {
            const _0x35e985 = _0x14f876[_0x3ae982];
            if (!_0x35e985) {
              const _0x5ef89d = _0x261887[_0x3ae982];
              _0x5ef89d &&
                ((_0x5ef89d.dataset.thumbKind = 'empty'),
                (_0x5ef89d.dataset.thumbType = ''),
                (_0x5ef89d.dataset.thumbSrc = ''),
                (_0x5ef89d.dataset.pendingSrc = ''),
                _0x5ef89d.replaceChildren());
              continue;
            }
            _0x438d98(_0x261887[_0x3ae982], _0x35e985.thumbSrc, _0x35e985.type);
          }
          return;
        }
        _0x2ce531?.coverUrl
          ? _0x438d98(_0x373710, _0x2ce531.coverUrl, _0x2ce531.coverType)
          : _0x438d98(_0x373710, '', _0x2ce531?.coverType || 'other');
      },
      _0x57590b = this._getSortedAssets().filter(
        (_0x5b3a4d) => this._categoryKey(_0x5b3a4d?.category) === this._categoryKey(this.activeTab),
      );
    if (this._openAssetId) {
      const _0x3bdfdc = _0x57590b.find((_0x3a209) => _0x3a209.id === this._openAssetId);
      if (!_0x3bdfdc) {
        ((this._openAssetId = null), this.renderSidebarContent());
        return;
      }
      if (_0x44e62c) _0x44e62c.textContent = _0x3bdfdc.name || assetManagerText('title');
      if (_0x26d245) _0x26d245.classList.add('show');
      (this.sidebarPanel.classList.add('is-detail-view'),
        (_0x58c425.style.display = 'none'),
        (_0x5a5ec9.style.display = ''));
      const _0x23e35b = Array.isArray(_0x3bdfdc?.items)
        ? _0x3bdfdc.items
        : Array.isArray(_0x3bdfdc?.nodes)
          ? _0x3bdfdc.nodes.map((_0x486d01) => _buildAssetItem(_0x486d01))
          : [];
      _0x5a5ec9.replaceChildren();
      const _0xcd7008 = document.createElement('div');
      _0xcd7008.className = 'v2-asset-detail';
      const _0x25140a = document.createElement('div');
      ((_0x25140a.className = 'v2-asset-detail-cover'), _0xcd7008.appendChild(_0x25140a));
      if (_0x23e35b.length > 0) {
        const _0x111a76 = _0x53b169(_0x25140a),
          _0x42881d = _0x111a76.querySelectorAll(':scope > .v2-asset-cover-cell');
        for (let _0x1d3dec = 0; _0x1d3dec < 4; _0x1d3dec++) {
          const _0x330428 = _0x23e35b[_0x1d3dec];
          if (_0x330428) _0x438d98(_0x42881d[_0x1d3dec], _0x330428.thumbSrc, _0x330428.type);
          else _0x42881d[_0x1d3dec] && _0x42881d[_0x1d3dec].replaceChildren();
        }
      } else _0x438d98(_0x25140a, _0x3bdfdc?.coverUrl, _0x3bdfdc?.coverType || 'other');
      const _0x51b12d = document.createElement('div');
      ((_0x51b12d.className = 'v2-asset-detail-title'),
        (_0x51b12d.textContent = _0x3bdfdc.name || assetManagerText('unnamedAsset')),
        _0xcd7008.appendChild(_0x51b12d));
      const _0x4e76bf = document.createElement('div');
      _0x4e76bf.className = 'v2-asset-detail-meta';
      const _0x267f85 = Array.isArray(_0x3bdfdc?.nodes) ? _0x3bdfdc.nodes.length : _0x23e35b.length;
      ((_0x4e76bf.textContent = assetManagerText('detail.meta', {
        category: _0x3bdfdc.category
          ? _formatAssetCategoryLabel(_0x3bdfdc.category)
          : assetManagerText('uncategorized'),
        count: _0x267f85,
        time: _formatAssetDateTime(_0x3bdfdc.updatedAt || _0x3bdfdc.createdAt),
      })),
        _0xcd7008.appendChild(_0x4e76bf));
      const _0x5bc227 = document.createElement('section');
      _0x5bc227.className = 'v2-asset-detail-section';
      const _0x25d6b9 = document.createElement('div');
      ((_0x25d6b9.className = 'v2-asset-detail-section-title'),
        (_0x25d6b9.textContent = assetManagerText('detail.content')),
        _0x5bc227.appendChild(_0x25d6b9));
      const _0x1c109f = document.createElement('div');
      _0x1c109f.className = 'v2-asset-subgrid';
      if (_0x23e35b.length === 0) {
        const _0x3e1b3d = document.createElement('div');
        ((_0x3e1b3d.className = 'v2-asset-empty'),
          (_0x3e1b3d.textContent = assetManagerText('detail.empty')),
          _0x1c109f.appendChild(_0x3e1b3d));
      } else
        for (let _0x2a19f3 = 0; _0x2a19f3 < _0x23e35b.length; _0x2a19f3++) {
          const _0x1fcd78 = _0x23e35b[_0x2a19f3],
            _0x3cc406 = document.createElement('button');
          ((_0x3cc406.type = 'button'),
            (_0x3cc406.className = 'v2-asset-subitem'),
            (_0x3cc406.dataset.assetId = _0x3bdfdc.id),
            (_0x3cc406.dataset.idx = String(_0x2a19f3)));
          const _0x635957 = document.createElement('div');
          ((_0x635957.className = 'v2-asset-subitem-thumb'),
            _0x438d98(_0x635957, _0x1fcd78?.thumbSrc, _0x1fcd78?.type));
          const _0x32baa6 = document.createElement('div');
          _0x32baa6.className = 'v2-asset-subitem-info';
          const _0x28da0a = document.createElement('span');
          ((_0x28da0a.className = 'v2-asset-subitem-type'),
            (_0x28da0a.textContent = _formatAssetTypeLabel(_0x1fcd78?.type)));
          const _0x32d3bb = document.createElement('div');
          _0x32d3bb.className = 'v2-asset-subitem-name';
          const _0x58c091 = String(
            _0x1fcd78?.name ||
              _0x1fcd78?.type ||
              assetManagerText('detail.childAssetName', { index: _0x2a19f3 + 1 }),
          );
          ((_0x32d3bb.textContent = _0x58c091), (_0x32d3bb.title = _0x58c091));
          const _0x3782b8 = document.createElement('div');
          ((_0x3782b8.className = 'v2-asset-subitem-summary'),
            (_0x3782b8.textContent = assetManagerText('detail.clickToAdd')),
            _0x32baa6.append(_0x28da0a, _0x32d3bb, _0x3782b8),
            _0x3cc406.append(_0x635957, _0x32baa6),
            _0x1c109f.appendChild(_0x3cc406));
        }
      (_0x5bc227.appendChild(_0x1c109f), _0xcd7008.appendChild(_0x5bc227));
      const _0x263fe9 = document.createElement('div');
      _0x263fe9.className = 'v2-asset-detail-actions';
      const _0x194b60 = document.createElement('button');
      ((_0x194b60.type = 'button'),
        (_0x194b60.className = 'v2-asset-detail-btn'),
        (_0x194b60.dataset.uiAction = 'asset-add-all'),
        (_0x194b60.dataset.assetId = _0x3bdfdc.id),
        (_0x194b60.textContent = assetManagerText('loadToCanvas')),
        _0x263fe9.appendChild(_0x194b60),
        _0xcd7008.appendChild(_0x263fe9),
        _0x5a5ec9.appendChild(_0xcd7008));
      return;
    }
    if (_0x44e62c) _0x44e62c.textContent = assetManagerText('title');
    if (_0x26d245) _0x26d245.classList.remove('show');
    (this.sidebarPanel.classList.remove('is-detail-view'),
      (_0x58c425.style.display = ''),
      (_0x5a5ec9.style.display = 'none'),
      _0x5a5ec9.replaceChildren());
    let _0xd1c7cd = _0x58c425.querySelector(':scope > .v2-asset-empty');
    !_0xd1c7cd &&
      ((_0xd1c7cd = document.createElement('div')),
      (_0xd1c7cd.className = 'v2-asset-empty'),
      _0x58c425.appendChild(_0xd1c7cd));
    const _0x6dce59 = this._getSortedAssets();
    let _0x22558a = 0,
      _0x2f2a3e = 0;
    for (const _0x1a51b4 of _0x6dce59) {
      const _0x43b454 = String(_0x1a51b4?.id || '');
      if (!_0x43b454) continue;
      let _0x4b492b = this._assetCardPool?.get?.(_0x43b454);
      if (!_0x4b492b) {
        ((_0x4b492b = document.createElement('div')),
          (_0x4b492b.className = 'v2-asset-item'),
          (_0x4b492b.dataset.id = _0x43b454));
        if (!this._assetCardPool) this._assetCardPool = new Map();
        this._assetCardPool.set(_0x43b454, _0x4b492b);
      }
      if (_0x4b492b.parentElement !== _0x58c425) _0x58c425.appendChild(_0x4b492b);
      const _0x5b6d9c = this._categoryKey(_0x1a51b4?.category) === this._categoryKey(this.activeTab);
      ((_0x4b492b.style.display = _0x5b6d9c ? '' : 'none'),
        _0x5b6d9c &&
          ((_0x4b492b.style.order = String(_0x2f2a3e++)),
          _0x117776(_0x4b492b, _0x1a51b4),
          this._newAssetPulseId &&
            this._newAssetPulseId === _0x43b454 &&
            ((this._newAssetPulseId = ''),
            window.requestAnimationFrame(() => {
              if (!_0x4b492b.isConnected) return;
              _0x4b492b.classList.add('is-new');
              const _0x5872cd = window.setTimeout(() => {
                if (_0x4b492b.isConnected) _0x4b492b.classList.remove('is-new');
              }, 0x28a);
              _0x4b492b.dataset._pulseTimer = String(_0x5872cd);
            })),
          (_0x22558a += 1)));
    }
    ((_0xd1c7cd.style.display = _0x22558a === 0 ? '' : 'none'),
      _0x22558a === 0 &&
        ((_0xd1c7cd.textContent = assetManagerText('emptyCategory', {
          category: _formatAssetCategoryLabel(this.activeTab),
        })),
        (_0xd1c7cd.style.order = '0')));
  }
  ['_restoreAssetSubItem'](_0x40fb7c, _0x26d6ef) {
    const _0x984169 = (this.assets || []).find((_0x33215d) => _0x33215d.id === _0x40fb7c);
    if (!_0x984169 || !Array.isArray(_0x984169.nodes)) return;
    const _0x4385cf = _0x984169.nodes[_0x26d6ef];
    if (!_0x4385cf) return;
    const _0x3c8683 = this._getCanvasCenterWorld(),
      _0x4e2325 = Number(_0x4385cf.width ?? _0x4385cf.w) || 240,
      _0x9a6659 = Number(_0x4385cf.height ?? _0x4385cf.h) || 240,
      _0x5a4431 = _0x3c8683.x - _0x4e2325 / 2,
      _0x2daac8 = _0x3c8683.y - _0x9a6659 / 2,
      _0x4f1325 = findAvailablePosition(
        appStore.getState().nodes,
        _0x5a4431,
        _0x2daac8,
        _0x4e2325,
        _0x9a6659,
        24,
        'right',
      );
    (appStore.batch(() => {
      const _0x499696 = JSON.parse(JSON.stringify(_0x4385cf));
      ((_0x499696.id = generateId(_0x499696.type)),
        (_0x499696.x = _0x4f1325.x),
        (_0x499696.y = _0x4f1325.y),
        appStore.addNode(_0x499696),
        appStore.setSelectedNodes([_0x499696.id]));
    }),
      window.showToast?.(assetManagerText('toasts.subAssetAdded'), 'success'));
  }
  ['restoreAssetToCanvas'](_0x22ccdb) {
    const _0x1dc858 = (this.assets || []).find((_0x561d49) => _0x561d49.id === _0x22ccdb);
    if (!_0x1dc858 || !_0x1dc858.nodes) return;
    const _0x284920 = shouldTopAlignRestoredAsset(_0x1dc858.nodes, _0x1dc858.edges)
        ? createTopAlignedAssetNodes(_0x1dc858.nodes, 24)
        : _0x1dc858.nodes,
      _0x11f110 = this._getCanvasCenterWorld(),
      _0x5c2764 = this._calcNodesBBox(_0x284920),
      _0x7d8e81 = _0x11f110.x - _0x5c2764.cx,
      _0xdb03ff = _0x11f110.y - _0x5c2764.cy,
      _0x5f09a1 = _0x5c2764.minX + _0x7d8e81,
      _0x2a0429 = _0x5c2764.minY + _0xdb03ff,
      _0x5dcc8f = findAvailablePosition(
        appStore.getState().nodes,
        _0x5f09a1,
        _0x2a0429,
        Math.max(1, _0x5c2764.w),
        Math.max(1, _0x5c2764.h),
        24,
        'right',
      ),
      _0xfcd317 = _0x7d8e81 + (_0x5dcc8f.x - _0x5f09a1),
      _0x56c946 = _0xdb03ff + (_0x5dcc8f.y - _0x2a0429);
    (appStore.batch(() => {
      const _0x238c09 = {};
      (_0x284920.forEach((_0x9228dc) => {
        const _0x5e1612 = JSON.parse(JSON.stringify(_0x9228dc)),
          _0x40a906 = _0x5e1612.id,
          _0x26a465 = generateId(_0x5e1612.type);
        ((_0x238c09[_0x40a906] = _0x26a465),
          (_0x5e1612.id = _0x26a465),
          (_0x5e1612.x = (Number(_0x5e1612.x) || 0) + _0xfcd317),
          (_0x5e1612.y = (Number(_0x5e1612.y) || 0) + _0x56c946),
          appStore.addNode(_0x5e1612));
      }),
        _0x1dc858.edges &&
          _0x1dc858.edges.forEach((_0x1bd6d8) => {
            const _0x439ff7 = JSON.parse(JSON.stringify(_0x1bd6d8));
            _0x439ff7.id = generateId('edge');
            if (_0x238c09[_0x439ff7.sourceId]) _0x439ff7.sourceId = _0x238c09[_0x439ff7.sourceId];
            if (_0x238c09[_0x439ff7.targetId]) _0x439ff7.targetId = _0x238c09[_0x439ff7.targetId];
            appStore.addEdge(_0x439ff7);
          }),
        appStore.setSelectedNodes(Object.values(_0x238c09)));
    }),
      window.showToast?.(assetManagerText('toasts.assetAdded'), 'success'));
  }
}
export const assetManager = new AssetManager();
