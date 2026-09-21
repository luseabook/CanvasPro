import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import {
  buildStoryboardGridTemplate,
  getStoryboardCellIndexAtWorldPoint,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  normalizeStoryboardGridGap,
  resolveStoryboardCellSourceIndex,
  resolveStoryboardGridLayout,
  resolveStoryboardCellPreviewSrc,
} from '../core/storyboardCellUtils.js';
import {
  createStoryboardToolbar,
  setStoryboardSplitLinesButtonContent,
  storyboardToolbarText,
} from './storyboard/storyboardToolbar.js';
import {
  closeStoryboardToolbarMenu,
  createStoryboardFloatingMenu,
  mountStoryboardToolbarMenu,
} from './storyboard/storyboardToolbarMenu.js';
import {
  STORYBOARD_ASPECT_MENU_OPTIONS,
  STORYBOARD_GRID_MENU_OPTIONS,
} from './storyboard/storyboardMenuOptions.js';
import {
  buildReusableStoryboardCellImageMap,
  createStoryboardCellContentNode,
} from './storyboard/storyboardCellContent.js';
import {
  appendStoryboardCellElements,
  rebuildStoryboardGridCellElements,
} from './storyboard/storyboardCellDom.js';
import { updateStoryboardCellDOM } from './storyboard/storyboardCellDomUpdate.js';
import {
  getStoryboardBackdropImageUrl,
  getStoryboardCellDisplayImageUrl,
  getStoryboardCellLiveSourceImageUrl,
  getStoryboardCellResidualImageUrl,
  getStoryboardCellSourceDisplayUrl,
  getStoryboardCellSourceImageUrl,
  getStoryboardPuzzleSourceImageUrl,
  normalizeStoryboardLocalImageUrl,
} from './storyboard/storyboardAssetRefs.js';
import {
  createStoryboardBackdropImage,
  syncStoryboardBackdropImage,
} from './storyboard/storyboardBackdrop.js';
import {
  adjustAdjacentStoryboardGridTracks,
  buildStoryboardActiveGridNode,
  buildStoryboardBaseGridLayout,
  getStoryboardActiveCellLayoutBounds,
  getStoryboardBaseCellLayoutBounds,
  getStoryboardCellCutoutRect,
  getStoryboardCustomGridLinePosition,
  hasCustomStoryboardGridLayout,
  isDefaultStoryboardTrackList,
  isSameStoryboardGridLayout,
} from './storyboard/storyboardGridLayoutState.js';
import { bindStoryboardNodeEvents } from './storyboard/storyboardEvents.js';
import {
  getImageElementSource,
  getLoadedStoryboardSourceImageForCell,
  isExpectedImageSource,
  isLoadedImageElement,
  loadStoryboardSourceImage,
  resolveStoryboardCommitSourceImage,
} from './storyboard/storyboardImageRuntime.js';
import {
  buildStoryboardMaterializedCellCrop,
  cropStoryboardCellFromSource,
  materializeStoryboardCellsForConfirmedGrid,
  materializeStoryboardSourceBackedCellsForEditing,
} from './storyboard/storyboardSourceMaterialize.js';
import {
  applyStoryboardCellLayoutStyles,
  applyStoryboardDefaultCellImageStyles,
  applyStoryboardEmptyCutoutStyles,
  applyStoryboardEmptyResidualImageStyles,
  applyStoryboardSourceCropImageStyles,
  captureStoryboardCellVisualState,
  syncStoryboardSourceCacheImage,
} from './storyboard/storyboardCellStyles.js';
import {
  applyStoryboardCustomGridLineSize,
  removeStoryboardCustomGridOverlay,
  renderStoryboardCustomGridOverlay,
} from './storyboard/storyboardCustomGridOverlay.js';
import {
  beginStoryboardCustomGridLineDrag,
  buildStoryboardCustomGridDragDraft,
  endStoryboardCustomGridLineDrag,
} from './storyboard/storyboardCustomGridDrag.js';
import {
  bindStoryboardSplitLinesMenuDismiss,
  createStoryboardSplitLinesMenu,
} from './storyboard/storyboardSplitLinesMenu.js';
import {
  composeStoryboardNode,
  drawStoryboardComposeCell,
  getStoryboardComposeCellDisplayUrl,
  getStoryboardComposeCellImageElement,
} from './storyboard/storyboardComposeFlow.js';
import { applyImmediateStoryboardCellSwap } from './storyboard/storyboardCellSwapDom.js';
import {
  createStoryboardCollapsedBadge,
  createStoryboardContainer,
  createStoryboardGridElement,
  createStoryboardHint,
  createStoryboardScaleWrap,
} from './storyboard/storyboardMountDom.js';
import { isStoryboardEditingOnlyDisplayUpdate } from './storyboard/storyboardUpdateGuards.js';
import {
  buildStoryboardCollapsePatch,
  calculateStoryboardDimsByAspect,
} from './storyboard/storyboardCollapseState.js';
import {
  normalizeStoryboardUpdateData,
  syncStoryboardEditingHint,
  syncStoryboardToolbarLabels,
  updateStoryboardCellsForDataChange,
} from './storyboard/storyboardUpdateFlow.js';
import { clearInlineStoryboardThumbUrls } from './storyboard/storyboardThumbnailBackfill.js';
export class StoryboardNode {
  constructor(_0x4fc3b8) {
    try {
      this._data = structuredClone(_0x4fc3b8);
    } catch (_0x528b99) {
      this._data = JSON.parse(JSON.stringify(_0x4fc3b8));
    }
    (!Array.isArray(this._data.cells) && (this._data.cells = []),
      (this.id = this._data.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component storyboard-node'),
      (this.el.id = 'sb-node-' + this.id),
      (this._isEditing = !!this._data.isEditing),
      (this._isCollapsed = !!this._data.isCollapsed),
      (this._isComposing = false),
      (this._isCustomGridEditing = false),
      (this._isCustomGridConfirming = false),
      (this._customGridDraft = null),
      (this._customGridDraftGap = null),
      (this._customGridDrag = null),
      (this._customGridKeydownHandler = null),
      (this._customGridRefreshVersion = 0),
      (this._customGridFrozenCellStyles = null),
      (this._backdropEl = null),
      this._isEditing
        ? this.el.classList.add('is-editing-mode')
        : this.el.classList.remove('is-editing-mode'));
  }
  ['_setSplitLinesButtonContent'](_0x5e5502) {
    setStoryboardSplitLinesButtonContent(_0x5e5502);
  }
  ['mount']() {
    const _0x5c8002 = this.el,
      _0x102e6e = this._data;
    _0x5c8002.replaceChildren();
    const _0x2825ae = createStoryboardToolbar({
      data: _0x102e6e,
      isEditing: this._isEditing,
      isCollapsed: this._isCollapsed,
    });
    _0x5c8002.appendChild(_0x2825ae);
    const _0x5672d2 = createStoryboardScaleWrap(),
      _0x3b87a4 = createStoryboardContainer(),
      _0x503365 = this._getBaseGridLayout(_0x102e6e),
      _0x38b54a = createStoryboardGridElement(_0x503365),
      _0x331418 = _0x102e6e.cells || [],
      _0x21fe43 = appendStoryboardCellElements({
        grid: _0x38b54a,
        nodeId: this.id,
        cells: _0x331418,
        createContentNode: (_0x3483d3, _0x1d6567) => this._createCellContentNode(_0x3483d3, _0x1d6567),
        applyCellCropStyles: (_0x17aa62, _0x2f7cc1, _0x3442a4) =>
          this._applyCellCropStyles(_0x17aa62, _0x2f7cc1, _0x3442a4),
      });
    return (
      _0x3b87a4.appendChild(_0x38b54a),
      this._isCollapsed &&
        _0x3b87a4.appendChild(createStoryboardCollapsedBadge((_0x102e6e.cols || 2) * (_0x102e6e.rows || 2))),
      _0x5672d2.appendChild(_0x3b87a4),
      _0x5c8002.appendChild(_0x5672d2),
      _0x5c8002.appendChild(createStoryboardHint(this._isEditing)),
      (this._container = _0x3b87a4),
      (this._grid = _0x38b54a),
      (this._cellEls = _0x21fe43),
      this._syncBackdropImage(),
      this._syncCustomGridOverlay(),
      this._updateGridGapButtonState(),
      this._updateCustomGridButtonState(),
      this._initEvents(),
      this._ensureThumbnails(),
      _0x5c8002
    );
  }
  async ['_ensureThumbnails']() {
    const _0x2b499a = clearInlineStoryboardThumbUrls(this._data.cells || []);
    _0x2b499a && appStore.updateNodeData(this.id, { cells: _0x2b499a });
  }
  ['_getCellFinalUrl'](_0xef8c3f) {
    return resolveStoryboardCellPreviewSrc(_0xef8c3f);
  }
  ['_isCellEmpty'](_0x59e622) {
    return isStoryboardCellEmpty(_0x59e622);
  }
  ['_normalizeLocalImageUrl'](_0xf0dd17) {
    return normalizeStoryboardLocalImageUrl(_0xf0dd17);
  }
  ['_getCellSourceImageUrl'](_0xd6de73) {
    return getStoryboardCellSourceImageUrl(_0xd6de73);
  }
  ['_getCellLiveSourceImageUrl'](_0x361604) {
    return getStoryboardCellLiveSourceImageUrl(_0x361604, this._data);
  }
  ['_getCellSourceDisplayUrl'](_0x2bcdbc) {
    return getStoryboardCellSourceDisplayUrl(_0x2bcdbc, this._data);
  }
  ['_getCellDisplayImageUrl'](_0x4cc3ea) {
    return getStoryboardCellDisplayImageUrl(_0x4cc3ea, this._data);
  }
  ['_getCellSourceIndex'](_0x18eb39, _0x5edbd7) {
    return resolveStoryboardCellSourceIndex(_0x18eb39, _0x5edbd7, this._data);
  }
  ['_getStoryboardPuzzleSourceImageUrl']() {
    return getStoryboardPuzzleSourceImageUrl(this._data);
  }
  ['_getCellResidualImageUrl'](_0x16a9f9) {
    return getStoryboardCellResidualImageUrl(_0x16a9f9);
  }
  ['_getStoryboardBackdropImageUrl']() {
    return getStoryboardBackdropImageUrl(this._data);
  }
  ['_createBackdropImage'](_0x418d94 = this._getStoryboardBackdropImageUrl()) {
    return createStoryboardBackdropImage(_0x418d94);
  }
  ['_syncBackdropImage'](_0x57720f = this._container) {
    this._backdropEl = syncStoryboardBackdropImage({
      container: _0x57720f,
      grid: this._grid,
      backdropEl: this._backdropEl,
      nextUrl: this._getStoryboardBackdropImageUrl(),
    });
  }
  ['_getGridGap']() {
    return normalizeStoryboardGridGap(this._data?.gridGap);
  }
  ['_loadStoryboardSourceImage'](_0x2e9d0d) {
    return loadStoryboardSourceImage(_0x2e9d0d);
  }
  ['_isLoadedImageElement'](_0x2eb09e) {
    return isLoadedImageElement(_0x2eb09e);
  }
  ['_getImageElementSource'](_0x58944a) {
    return getImageElementSource(_0x58944a);
  }
  ['_isExpectedImageSource'](_0x27eb04, _0xed49df = '') {
    return isExpectedImageSource(_0x27eb04, _0xed49df);
  }
  ['_getLoadedSourceImageForCell'](_0x1bfb08, _0x37b819 = '') {
    return getLoadedStoryboardSourceImageForCell({
      cellEls: this._cellEls,
      backdropEl: this._backdropEl,
      index: _0x1bfb08,
      sourceUrl: _0x37b819,
    });
  }
  ['_buildMaterializedCellCrop'](_0x21916d, _0x222d74, _0xc86937) {
    return buildStoryboardMaterializedCellCrop({
      cell: _0x21916d,
      index: _0x222d74,
      img: _0xc86937,
      sourceNode: this._getActiveGridNode(),
    });
  }
  ['_materializeSourceBackedCellsForEditing']() {
    return materializeStoryboardSourceBackedCellsForEditing({
      node: this._getActiveGridNode(),
      cells: this._data.cells,
      getLoadedSourceImageForCell: (_0x4154c6, _0x5a538d) =>
        this._getLoadedSourceImageForCell(_0x4154c6, _0x5a538d),
    });
  }
  async ['_resolveCommitSourceImage'](_0x241ba7, _0xde00d5, _0x5f2838) {
    return resolveStoryboardCommitSourceImage({
      index: _0x241ba7,
      sourceUrl: _0xde00d5,
      imageCache: _0x5f2838,
      cellEls: this._cellEls,
      backdropEl: this._backdropEl,
      loadImage: (_0x510673) => this._loadStoryboardSourceImage(_0x510673),
    });
  }
  async ['_cropStoryboardCellFromSource'](_0x15ced5, _0x1e9afb, _0x5b1e5a, _0x1e5684) {
    return cropStoryboardCellFromSource({
      cell: _0x15ced5,
      index: _0x1e9afb,
      sourceNode: _0x5b1e5a,
      imageCache: _0x1e5684,
      resolveSourceImage: (_0x1029a1, _0x23ecb9, _0xcaa7c5) =>
        this._resolveCommitSourceImage(_0x1029a1, _0x23ecb9, _0xcaa7c5),
    });
  }
  async ['_materializeCellsForConfirmedGrid'](_0x1ea3b1, _0x200a48, _0x43d7b3 = null) {
    return materializeStoryboardCellsForConfirmedGrid({
      node: this._data,
      gridLayout: _0x1ea3b1,
      gridGap: _0x200a48,
      cellsOverride: _0x43d7b3,
      cropCell: (_0x4f3646, _0x313bbb, _0x53f690, _0x59ccf8) =>
        this._cropStoryboardCellFromSource(_0x4f3646, _0x313bbb, _0x53f690, _0x59ccf8),
    });
  }
  async ['_refreshSourceBackedCellsForLayout'](_0x2d10de, _0x34dcb1 = null) {
    const { cells: _0x5c81c7 } = await this._materializeCellsForConfirmedGrid(
      _0x2d10de,
      this._getGridGap(),
      _0x34dcb1,
    );
    return _0x5c81c7;
  }
  ['_isSourceCropCell'](_0x418c86) {
    return !!this._getCellSourceImageUrl(_0x418c86);
  }
  ['_applyDefaultCellImageStyles'](_0x33d324, _0x3d3e43, _0x4aff78) {
    applyStoryboardDefaultCellImageStyles(_0x33d324, _0x3d3e43, _0x4aff78);
  }
  ['_applySourceCropImageStyles'](_0x5aa696, _0x150fa3, _0x583ed7, _0x5e7315) {
    applyStoryboardSourceCropImageStyles({
      img: _0x5aa696,
      cell: _0x150fa3,
      index: _0x583ed7,
      sourceUrl: _0x5e7315,
      node: this._data,
      sourceIndex: this._getCellSourceIndex(_0x150fa3, _0x583ed7),
      isLoadedImageElement: (_0x4c9f4b) => this._isLoadedImageElement(_0x4c9f4b),
      onImageLoad: () => this._applySourceCropImageStyles(_0x5aa696, _0x150fa3, _0x583ed7, _0x5e7315),
    });
  }
  ['_applyCellCropStyles'](_0x1cc9d7, _0x52a40c, _0xf303b1) {
    if (!_0x1cc9d7) return;
    this._applyEmptyResidualStyles(_0x1cc9d7, _0x52a40c, _0xf303b1);
    const _0x435c43 = Array.from(_0x1cc9d7.querySelectorAll?.('.storyboard-cell-img') || []).find(
      (_0x5a88d5) =>
        !_0x5a88d5.classList?.contains?.('storyboard-empty-residual-img') &&
        !_0x5a88d5.classList?.contains?.('storyboard-cell-source-cache'),
    );
    if (!_0x435c43) return;
    const _0x53bb14 = this._getCellSourceDisplayUrl(_0x52a40c);
    if (_0x53bb14) {
      (this._applySourceCropImageStyles(_0x435c43, _0x52a40c, _0xf303b1, _0x53bb14),
        this._syncSourceCacheImage(_0x1cc9d7, _0x52a40c, _0x53bb14));
      return;
    }
    const _0x25e12f = this._getCellLiveSourceImageUrl(_0x52a40c);
    _0x25e12f
      ? this._syncSourceCacheImage(_0x1cc9d7, _0x52a40c, _0x25e12f)
      : this._syncSourceCacheImage(_0x1cc9d7, _0x52a40c);
    const _0x58db51 = this._getCellFinalUrl(_0x52a40c);
    this._applyDefaultCellImageStyles(_0x435c43, _0x58db51, _0x52a40c);
  }
  ['_syncSourceCacheImage'](_0x4772ae, _0x176d89, _0x3d9dee = '', _0x24bf92 = null) {
    const _0x52e812 = String(_0x3d9dee || this._getCellSourceImageUrl(_0x176d89) || '').trim();
    syncStoryboardSourceCacheImage({
      cellEl: _0x4772ae,
      sourceUrl: _0x52e812,
      onReady: _0x24bf92,
      isLoadedImageElement: (_0x13bb06) => this._isLoadedImageElement(_0x13bb06),
    });
  }
  ['_applyAllCellCropStyles']() {
    if (!this._cellEls) return;
    const _0x195472 = this._data.cells || [];
    this._cellEls.forEach((_0x572f09, _0x106807) => {
      this._applyCellCropStyles(_0x572f09, _0x195472[_0x106807], _0x106807);
    });
  }
  ['_getActiveGridNode']() {
    return buildStoryboardActiveGridNode(this._data, this._getGridGap());
  }
  ['_getBaseGridLayout'](_0x341184 = this._data) {
    return buildStoryboardBaseGridLayout(_0x341184);
  }
  ['_getCellLayoutBounds'](_0x6b0c4c) {
    return getStoryboardActiveCellLayoutBounds(this._data, _0x6b0c4c, this._getGridGap());
  }
  ['_getBaseCellLayoutBounds'](_0x36ca23) {
    return getStoryboardBaseCellLayoutBounds(this._data, _0x36ca23);
  }
  ['_getCellCutoutRect'](_0xc65f90) {
    return getStoryboardCellCutoutRect(this._data, _0xc65f90, this._getGridGap());
  }
  ['_applyEmptyCutoutStyles'](_0x42159d, _0x53e4c5) {
    applyStoryboardEmptyCutoutStyles(_0x42159d, _0x53e4c5);
  }
  ['_applyEmptyResidualImageStyles'](_0x19a30b, _0x454689, _0x598123) {
    const _0x5bab26 = _0x19a30b?.querySelector?.('.storyboard-empty-residual-img');
    applyStoryboardEmptyResidualImageStyles({
      img: _0x5bab26,
      cell: _0x454689,
      node: this._data,
      activeBounds: this._getCellLayoutBounds(_0x598123),
    });
  }
  ['_applyEmptyResidualStyles'](_0x690873, _0x213e6d, _0x293526) {
    this._applyEmptyResidualImageStyles(_0x690873, _0x213e6d, _0x293526);
    const _0x2c10be = _0x690873?.querySelector?.('.storyboard-empty-residual') || null;
    if (!_0x2c10be) return;
    this._applyEmptyCutoutStyles(_0x2c10be, _0x293526);
  }
  ['_applyCellLayoutStyles'](_0x3b3d13, _0x3cde89) {
    applyStoryboardCellLayoutStyles({
      cellEl: _0x3b3d13,
      isCustomGridEditing: this._isCustomGridEditing,
      frozen: this._customGridFrozenCellStyles?.[_0x3cde89],
      bounds: this._getCellLayoutBounds(_0x3cde89),
    });
  }
  ['_applyAllCellLayoutStyles']() {
    if (!this._cellEls) return;
    this._cellEls.forEach((_0x8957b7, _0x46becd) => {
      this._applyCellLayoutStyles(_0x8957b7, _0x46becd);
    });
  }
  ['_captureCustomGridCellVisualState']() {
    this._customGridFrozenCellStyles = captureStoryboardCellVisualState(this._cellEls);
  }
  ['_restoreCustomGridCellVisualState']() {
    if (!this._cellEls || !this._customGridFrozenCellStyles) return;
    this._cellEls.forEach((_0x53a439, _0x21750f) => {
      this._applyCellLayoutStyles(_0x53a439, _0x21750f);
    });
  }
  ['_createCellContentNode'](_0x9c2eb, _0x31a7c1 = 0) {
    return createStoryboardCellContentNode({
      cell: _0x9c2eb,
      finalUrl: this._getCellDisplayImageUrl(_0x9c2eb),
      residualUrl: this._getCellResidualImageUrl(_0x9c2eb),
      index: _0x31a7c1,
    });
  }
  ['_buildReusableCellImageMap']() {
    return buildReusableStoryboardCellImageMap(this._cellEls);
  }
  ['_renderCells']() {}
  ['_updateCellDOM'](_0x3e6a74, _0x179baa, _0x12be47 = null) {
    const _0x281b58 = Number(_0x3e6a74?.dataset?.index) || 0;
    updateStoryboardCellDOM({
      cellEl: _0x3e6a74,
      cell: _0x179baa,
      reusableImageMap: _0x12be47,
      getCellDisplayImageUrl: (_0x2b248b) => this._getCellDisplayImageUrl(_0x2b248b),
      getCellResidualImageUrl: (_0x4eb46b) => this._getCellResidualImageUrl(_0x4eb46b),
      createContentNode: (_0x1ef582) => this._createCellContentNode(_0x1ef582),
      applyCropStyles: () => this._applyCellCropStyles(_0x3e6a74, _0x179baa, _0x281b58),
    });
  }
  ['_initEvents']() {
    bindStoryboardNodeEvents(this, { store: appStore, normalizeEmptyCell: normalizeEmptyStoryboardCell });
  }
  ['_getActiveGridLayout']() {
    return resolveStoryboardGridLayout(this._data);
  }
  ['_getCustomGridOverlayLayout']() {
    if (this._isCustomGridEditing && this._customGridDraft)
      return resolveStoryboardGridLayout({
        cols: this._data.cols,
        rows: this._data.rows,
        gridLayout: this._customGridDraft,
      });
    return resolveStoryboardGridLayout(this._data);
  }
  ['_getCustomGridDraftGap']() {
    const _0x5ce1fa = Number(this._customGridDraftGap);
    if (Number.isFinite(_0x5ce1fa)) return normalizeStoryboardGridGap(_0x5ce1fa, this._getGridGap());
    return this._getGridGap();
  }
  ['_applyGridLayout']() {
    if (this._isCustomGridEditing && this._customGridFrozenCellStyles) {
      this._restoreCustomGridCellVisualState();
      return;
    }
    const _0xc767c7 = this._grid || this.el.querySelector('.cells-grid');
    if (!_0xc767c7) return;
    const _0x19ffe6 = this._getBaseGridLayout();
    ((_0xc767c7.style.gridTemplateColumns = buildStoryboardGridTemplate(_0x19ffe6.columns, _0x19ffe6.cols)),
      (_0xc767c7.style.gridTemplateRows = buildStoryboardGridTemplate(_0x19ffe6.rowTracks, _0x19ffe6.rows)),
      (_0xc767c7.style.gap = '0px'),
      this._applyAllCellLayoutStyles(),
      this._applyAllCellCropStyles());
  }
  ['_isTrackListEqual'](_0x3c981b) {
    return isDefaultStoryboardTrackList(_0x3c981b);
  }
  ['_hasCustomGridLayout'](_0x164499 = resolveStoryboardGridLayout(this._data)) {
    return hasCustomStoryboardGridLayout(_0x164499);
  }
  ['_isEditingOnlyDisplayUpdate'](_0x1c4d07 = {}, _0xeac886 = {}) {
    return isStoryboardEditingOnlyDisplayUpdate(_0x1c4d07, _0xeac886, {
      isCellEmpty: (_0xb084b4) => this._isCellEmpty(_0xb084b4),
      getCellDisplayImageUrl: (_0x3abf71) => this._getCellDisplayImageUrl(_0x3abf71),
      getCellSourceImageUrl: (_0x6071bf) => this._getCellSourceImageUrl(_0x6071bf),
      getCellLiveSourceImageUrl: (_0x4f2b05) => this._getCellLiveSourceImageUrl(_0x4f2b05),
    });
  }
  ['_isSameGridLayout'](_0x4a2947, _0x3b7d7e) {
    return isSameStoryboardGridLayout(_0x4a2947, _0x3b7d7e);
  }
  ['_refreshSourceBackedCellsForLayoutInBackground'](_0x29f78b, _0x326595) {
    if (
      typeof Image !== 'function' &&
      this._refreshSourceBackedCellsForLayout === StoryboardNode.prototype._refreshSourceBackedCellsForLayout
    )
      return;
    if (
      !Array.isArray(_0x326595) ||
      !_0x326595.some((_0x5c15cf) => !this._isCellEmpty(_0x5c15cf)) ||
      !this._getStoryboardPuzzleSourceImageUrl()
    )
      return;
    const _0x9e856c = ++this._customGridRefreshVersion;
    this._refreshSourceBackedCellsForLayout(_0x29f78b, _0x326595)
      .then((_0x5146b1) => {
        if (!_0x5146b1 || _0x9e856c !== this._customGridRefreshVersion) return;
        const _0x4a36dd =
            typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
          _0x4cf048 = _0x4a36dd?.nodes?.[this.id];
        if (!_0x4cf048 || !this._isSameGridLayout(_0x4cf048, _0x29f78b)) return;
        const _0x1cc84a = Array.isArray(_0x4cf048.cells) ? _0x4cf048.cells : [],
          _0x152a07 = _0x1cc84a.map((_0xcdd284, _0x1b6eec) => {
            const _0x35bbe5 = _0x326595[_0x1b6eec],
              _0x9c389a = _0x5146b1[_0x1b6eec];
            if (!_0xcdd284 || !_0x35bbe5 || !_0x9c389a) return _0xcdd284;
            if (_0xcdd284.id !== _0x35bbe5.id) return _0xcdd284;
            if (this._isCellEmpty(_0xcdd284)) return _0xcdd284;
            return { ..._0xcdd284, ..._0x9c389a };
          });
        appStore.updateNodeData(this.id, { cells: _0x152a07 });
      })
      .catch((_0x291356) => {
        (console.error('[Storyboard] Custom grid crop refresh failed:', _0x291356),
          typeof window !== 'undefined' &&
            window.showToast?.(storyboardToolbarText('customGridPartialRefreshFailed'), 'warning'));
      });
  }
  ['_shouldShowCustomGridOverlay'](_0x11ac2e = this._getActiveGridLayout()) {
    if (this._isCustomGridEditing) return true;
    return _0x11ac2e.cols > 1 || _0x11ac2e.rows > 1;
  }
  ['_syncCustomGridOverlay']({ applyLayout: applyLayout = true } = {}) {
    const _0x7ea4a2 = this._getCustomGridOverlayLayout();
    if (applyLayout) this._applyGridLayout();
    else
      this._isCustomGridEditing &&
        this._customGridFrozenCellStyles &&
        this._restoreCustomGridCellVisualState();
    this._shouldShowCustomGridOverlay(_0x7ea4a2)
      ? this._renderCustomGridHandles({ editable: this._isCustomGridEditing, layout: _0x7ea4a2 })
      : this._removeCustomGridHandles();
  }
  ['_updateCustomGridButtonState']() {
    const _0x396116 = this.el.querySelector('.act-split-lines');
    if (!_0x396116) return;
    (_0x396116.classList.toggle('active', this._isCustomGridEditing),
      _0x396116.classList.remove('is-confirm'),
      (_0x396116.disabled = this._isCustomGridConfirming),
      (_0x396116.dataset.tooltip = this._isCustomGridConfirming
        ? storyboardToolbarText('applying')
        : this._isCustomGridEditing
          ? storyboardToolbarText('finishAdjust')
          : storyboardToolbarText('adjustSplitLines')),
      _0x396116.setAttribute(
        'aria-label',
        this._isCustomGridConfirming
          ? storyboardToolbarText('applyingSplitLines')
          : this._isCustomGridEditing
            ? storyboardToolbarText('finishAdjustSplitLines')
            : storyboardToolbarText('adjustSplitLines'),
      ),
      this._setSplitLinesButtonContent(_0x396116));
  }
  ['_updateGridGapButtonState']() {
    const _0x4486f1 = this.el.querySelector('.act-split-lines');
    if (!_0x4486f1) return;
    if (this._isCustomGridEditing) return;
    ((_0x4486f1.dataset.tooltip = storyboardToolbarText('adjustSplitLines')),
      _0x4486f1.setAttribute('aria-label', storyboardToolbarText('adjustSplitLines')));
  }
  ['_setCustomGridHint'](_0xc7efa4) {
    const _0x4d479a = this.el.querySelector('.v2-storyboard-hint');
    if (!_0x4d479a) return;
    if (_0xc7efa4) {
      _0x4d479a.textContent = storyboardToolbarText('customGridHint');
      return;
    }
    _0x4d479a.textContent = this._isEditing
      ? storyboardToolbarText('editHint')
      : storyboardToolbarText('enterEditHint');
  }
  ['_enterCustomGridEdit']() {
    if (this._isCollapsed || this._isCustomGridConfirming) return false;
    this._closeMenu();
    if (this._isEditing) this._toggleEdit(false);
    const _0x2458c5 = resolveStoryboardGridLayout(this._data);
    return (
      (this._isCustomGridEditing = true),
      (this._customGridDraftGap = this._getGridGap()),
      (this._customGridDraft = { columns: [..._0x2458c5.columns], rows: [..._0x2458c5.rowTracks] }),
      this._captureCustomGridCellVisualState(),
      this.el.classList.add('is-custom-grid-mode'),
      this._bindCustomGridKeyboard(),
      this._syncCustomGridOverlay({ applyLayout: false }),
      this._updateCustomGridButtonState(),
      this._setCustomGridHint(true),
      true
    );
  }
  async ['_confirmCustomGridEdit']() {
    if (!this._isCustomGridEditing || this._isCustomGridConfirming) return;
    ((this._isCustomGridConfirming = true), this._updateCustomGridButtonState());
    const _0x5e30d0 = this._getNormalizedCustomGridDraft(),
      _0x476fc6 = this._getCustomGridDraftGap();
    try {
      const _0x215c97 = { gridGap: _0x476fc6, gridLayout: _0x5e30d0 };
      ((this._data = { ...this._data, ..._0x215c97 }),
        appStore.updateNodeData(this.id, _0x215c97),
        this._exitCustomGridEdit());
    } finally {
      this._isCustomGridEditing &&
        ((this._isCustomGridConfirming = false), this._updateCustomGridButtonState());
    }
  }
  ['_cancelCustomGridEdit']() {
    if (!this._isCustomGridEditing || this._isCustomGridConfirming) return;
    (this._exitCustomGridEdit(), this._closeMenu());
  }
  ['_isSplitLinesMenuMounted']() {
    return (
      this._activeMenu === 'split-lines' &&
      !!this._menuEl &&
      this._menuEl.classList?.contains('storyboard-split-lines-menu')
    );
  }
  ['_showSplitLinesMenu'](_0x5a42cc) {
    if (!_0x5a42cc) return;
    (this._closeMenu({ force: true }), (this._activeMenu = 'split-lines'), _0x5a42cc.classList.add('active'));
    const _0x124924 = createStoryboardSplitLinesMenu({
      getGap: () => this._getCustomGridDraftGap(),
      onGapChange: (_0xa07071) => {
        ((this._customGridDraftGap = _0xa07071), this._syncCustomGridOverlay({ applyLayout: false }));
      },
    });
    (this._mountToolbarMenu(_0x124924, _0x5a42cc),
      (this._dismissHandler = bindStoryboardSplitLinesMenuDismiss({
        menu: _0x124924,
        anchor: _0x5a42cc,
        shouldKeepOpen: () => this._isCustomGridEditing,
        onDismiss: () => this._closeMenu(),
      })));
  }
  ['_exitCustomGridEdit']() {
    const _0x10d6dd = this._activeMenu === 'split-lines';
    (this._endCustomGridLineDrag(),
      (this._isCustomGridEditing = false),
      (this._isCustomGridConfirming = false),
      (this._customGridDraft = null),
      (this._customGridDraftGap = null),
      (this._customGridFrozenCellStyles = null),
      this.el.classList.remove('is-custom-grid-mode'),
      this._unbindCustomGridKeyboard(),
      this._syncCustomGridOverlay(),
      this._updateCustomGridButtonState(),
      this._setCustomGridHint(false),
      _0x10d6dd && this._closeMenu({ force: true }));
  }
  ['_updateEditButtonState']() {
    const _0x4d5abd = this.el.querySelector('.act-edit');
    if (!_0x4d5abd) return;
    (_0x4d5abd.classList.toggle('active', this._isEditing),
      (_0x4d5abd.dataset.tooltip = this._isEditing
        ? storyboardToolbarText('exitEdit')
        : storyboardToolbarText('edit')),
      _0x4d5abd.setAttribute(
        'aria-label',
        this._isEditing ? storyboardToolbarText('exitEdit') : storyboardToolbarText('edit'),
      ));
    const _0x48ef51 = _0x4d5abd.querySelector('span');
    _0x48ef51 &&
      (_0x48ef51.textContent = this._isEditing
        ? storyboardToolbarText('exitEditShort')
        : storyboardToolbarText('editShort'));
  }
  ['_getNormalizedCustomGridDraft']() {
    const _0x5800a4 = resolveStoryboardGridLayout({
      cols: this._data.cols,
      rows: this._data.rows,
      gridLayout: this._customGridDraft,
    });
    return { columns: _0x5800a4.columns, rows: _0x5800a4.rowTracks };
  }
  ['_bindCustomGridKeyboard']() {
    if (this._customGridKeydownHandler) return;
    ((this._customGridKeydownHandler = (_0x279222) => {
      if (_0x279222.key !== 'Escape') return;
      (_0x279222.preventDefault?.(), _0x279222.stopPropagation?.(), this._cancelCustomGridEdit());
    }),
      document.addEventListener('keydown', this._customGridKeydownHandler, true));
  }
  ['_unbindCustomGridKeyboard']() {
    if (!this._customGridKeydownHandler) return;
    (document.removeEventListener('keydown', this._customGridKeydownHandler, true),
      (this._customGridKeydownHandler = null));
  }
  ['_removeCustomGridHandles']() {
    this._customGridOverlay = removeStoryboardCustomGridOverlay(this._customGridOverlay);
  }
  ['_getCustomGridLinePosition'](_0x57bbcf, _0x154c5a) {
    return getStoryboardCustomGridLinePosition(_0x57bbcf, _0x154c5a);
  }
  ['_applyCustomGridLineSize'](_0x21ae90, _0x4e2737, _0x102dc2) {
    applyStoryboardCustomGridLineSize(_0x21ae90, _0x4e2737, _0x102dc2);
  }
  ['_renderCustomGridHandles']({
    editable: editable = this._isCustomGridEditing,
    layout: layout = this._getActiveGridLayout(),
  } = {}) {
    const _0x131193 = this._isCustomGridEditing ? this._getCustomGridDraftGap() : this._getGridGap();
    this._customGridOverlay = renderStoryboardCustomGridOverlay({
      grid: this._grid,
      overlay: this._customGridOverlay,
      editable: editable,
      layout: layout,
      lineSize: _0x131193,
      getLinePosition: (_0x2ad9b2, _0x21516c) => this._getCustomGridLinePosition(_0x2ad9b2, _0x21516c),
      onPointerDown: (_0x196927, _0x59381a, _0x4f7c52) =>
        this._beginCustomGridLineDrag(_0x196927, _0x59381a, _0x4f7c52),
    });
  }
  ['_beginCustomGridLineDrag'](_0x2949c0, _0x47192b, _0xfc977a) {
    if (!this._isCustomGridEditing || !this._grid) return;
    this._customGridDrag = beginStoryboardCustomGridLineDrag({
      event: _0x2949c0,
      axis: _0x47192b,
      index: _0xfc977a,
      grid: this._grid,
      rootEl: this.el,
      layout: this._getCustomGridOverlayLayout(),
      endDrag: () => this._endCustomGridLineDrag(),
      onDragMove: (_0x23100f) => this._dragCustomGridLine(_0x23100f),
      ensureVisualState: () => {
        !this._customGridFrozenCellStyles && this._captureCustomGridCellVisualState();
      },
    });
  }
  ['_dragCustomGridLine'](_0x134777) {
    const _0x179d9f = buildStoryboardCustomGridDragDraft({
      event: _0x134777,
      drag: this._customGridDrag,
      draft: this._customGridDraft,
      adjustTracks: (_0x4056df, _0x56fb2a, _0x5d6add) =>
        this._adjustAdjacentGridTracks(_0x4056df, _0x56fb2a, _0x5d6add),
    });
    if (!_0x179d9f) return;
    ((this._customGridDraft = _0x179d9f), this._syncCustomGridOverlay({ applyLayout: false }));
  }
  ['_adjustAdjacentGridTracks'](_0x24346d, _0x2ac089, _0x2d77e4) {
    return adjustAdjacentStoryboardGridTracks(_0x24346d, _0x2ac089, _0x2d77e4);
  }
  ['_endCustomGridLineDrag']() {
    this._customGridDrag = endStoryboardCustomGridLineDrag({ drag: this._customGridDrag, rootEl: this.el });
  }
  ['_toggleCollapse'](_0xedd1fa) {
    this._isCollapsed = _0xedd1fa;
    const _0x2ee683 = buildStoryboardCollapsePatch(this._data, _0xedd1fa);
    appStore.updateNodeData(this.id, _0x2ee683);
  }
  ['_showAspectMenu'](_0x41d036) {
    this._showFloatingMenu(
      _0x41d036,
      'aspect',
      STORYBOARD_ASPECT_MENU_OPTIONS.map((_0x56a648) => ({
        label: _0x56a648.label,
        icon: _0x56a648.icon,
        action: () => {
          const _0x267e1f = this._calculateDimsByAspect(_0x56a648.label);
          appStore.updateNodeData(this.id, {
            aspectRatio: _0x56a648.label,
            width: _0x267e1f.w,
            height: _0x267e1f.h,
          });
        },
      })),
    );
  }
  ['_showGridMenu'](_0x811696) {
    this._showFloatingMenu(
      _0x811696,
      'grid',
      STORYBOARD_GRID_MENU_OPTIONS.map((_0x3105c7) => ({
        label: _0x3105c7.label,
        icon: _0x3105c7.icon,
        action: () => {
          this._updateGrid(_0x3105c7.cols, _0x3105c7.rows);
        },
      })),
    );
  }
  ['_showFloatingMenu'](_0x2067fe, _0x4a8d0c, _0x5260fc) {
    (this._closeMenu(), (this._activeMenu = _0x4a8d0c));
    const _0x4ccb8e = _0x2067fe.querySelector('.ftb-chevron');
    if (_0x4ccb8e) _0x4ccb8e.style.transform = 'rotate(180deg)';
    _0x2067fe.classList.add('active');
    const _0x2199c1 = createStoryboardFloatingMenu(_0x5260fc, () => this._closeMenu());
    this._mountToolbarMenu(_0x2199c1, _0x2067fe);
    const _0x566c3f = (_0x1f31d1) => {
      !_0x2199c1.contains(_0x1f31d1.target) && !_0x2067fe.contains(_0x1f31d1.target) && this._closeMenu();
    };
    ((this._dismissHandler = _0x566c3f),
      setTimeout(() => {
        if (this._menuEl !== _0x2199c1) return;
        document.addEventListener('pointerdown', _0x566c3f);
      }, 10));
  }
  ['_mountToolbarMenu'](_0x937559, _0x67153d) {
    this._menuEl = mountStoryboardToolbarMenu(_0x937559, _0x67153d);
  }
  ['_closeMenu']({ force: force = false } = {}) {
    const _0x424ba2 = closeStoryboardToolbarMenu({
      rootEl: this.el,
      menuEl: this._menuEl,
      activeMenu: this._activeMenu,
      isCustomGridEditing: this._isCustomGridEditing,
      dismissHandler: this._dismissHandler,
      force: force,
    });
    ((this._menuEl = _0x424ba2.menuEl),
      (this._activeMenu = _0x424ba2.activeMenu),
      (this._dismissHandler = _0x424ba2.dismissHandler));
  }
  ['_updateGrid'](_0x5e6e6c, _0x5f3a69) {
    ((this._customGridRefreshVersion += 1), this._exitCustomGridEdit());
    const _0x1dfdc5 = this._data.cells || [],
      _0x238c7b = this._data.cols || 2,
      _0x1be769 = [];
    for (let _0xfc0653 = 0; _0xfc0653 < _0x5f3a69; _0xfc0653++) {
      for (let _0x26e730 = 0; _0x26e730 < _0x5e6e6c; _0x26e730++) {
        const _0x5601ba = _0xfc0653 * _0x238c7b + _0x26e730,
          _0x14ab63 = _0x1dfdc5[_0x5601ba];
        _0x14ab63
          ? _0x1be769.push({ ..._0x14ab63 })
          : _0x1be769.push({ id: generateId('cell'), url: '', isEmpty: true });
      }
    }
    appStore.updateNodeData(this.id, {
      cols: _0x5e6e6c,
      rows: _0x5f3a69,
      cells: _0x1be769,
      gridLayout: null,
    });
  }
  ['_toggleEdit'](_0x52c429) {
    const _0x16ad30 = !!_0x52c429;
    _0x16ad30 && this._isCustomGridEditing && this._cancelCustomGridEdit();
    ((this._isEditing = _0x16ad30),
      this.el.classList.toggle('is-editing-mode', _0x16ad30),
      this._updateEditButtonState(),
      syncStoryboardEditingHint(this.el, _0x16ad30));
    if (this._isCustomGridEditing) this._setCustomGridHint(true);
    const _0x40ce6f = { isEditing: _0x16ad30 };
    if (_0x16ad30) {
      const _0x57bb50 = this._getStoryboardBackdropImageUrl(),
        _0x54f3eb = this._materializeSourceBackedCellsForEditing();
      if (_0x54f3eb) {
        _0x40ce6f.cells = _0x54f3eb;
        if (_0x57bb50) _0x40ce6f.storyboardBackdropUrl = _0x57bb50;
        ((this._data = {
          ...this._data,
          cells: _0x54f3eb,
          ...(_0x57bb50 ? { storyboardBackdropUrl: _0x57bb50 } : {}),
        }),
          this._syncBackdropImage(),
          this._applyAllCellCropStyles());
      }
    }
    appStore.updateNodeData(this.id, _0x40ce6f);
  }
  ['_getComposeCellImageElement'](_0x3ccbbc) {
    return getStoryboardComposeCellImageElement(this._cellEls, _0x3ccbbc);
  }
  ['_getComposeCellDisplayUrl'](_0x5d3739) {
    return getStoryboardComposeCellDisplayUrl({
      cellEls: this._cellEls,
      cellIndex: _0x5d3739,
      getImageElementSource: (_0x3c51a8) => this._getImageElementSource(_0x3c51a8),
    });
  }
  async ['_drawComposeCell'](
    _0x178216,
    {
      cell: _0x484fb7,
      cellIndex: _0x25f338,
      displayUrl: _0x1da491,
      imageEl: _0x3889b7,
      target: _0x5c32ad,
      loadImage: _0xb76df3,
    },
  ) {
    return drawStoryboardComposeCell(_0x178216, {
      cell: _0x484fb7,
      cellIndex: _0x25f338,
      displayUrl: _0x1da491,
      imageEl: _0x3889b7,
      target: _0x5c32ad,
      loadImage: _0xb76df3,
      cellEls: this._cellEls,
      getImageElementSource: (_0x59adf9) => this._getImageElementSource(_0x59adf9),
    });
  }
  async ['_compose']() {
    return composeStoryboardNode({
      node: this._data,
      rootEl: this.el,
      cellEls: this._cellEls,
      currentNodeId: this.id,
      isCellEmpty: (_0x3f0582) => this._isCellEmpty(_0x3f0582),
      getImageElementSource: (_0x465f23) => this._getImageElementSource(_0x465f23),
      getBackdropUrl: () => this._getStoryboardBackdropImageUrl(),
      markComposing: (_0xe4fbab) => {
        this._isComposing = _0xe4fbab;
      },
    });
  }
  ['_calculateDimsByAspect'](_0x55526c) {
    return calculateStoryboardDimsByAspect(this._data, _0x55526c);
  }
  ['hitTestCell'](_0x556165, _0x2d8352) {
    if (this._isCollapsed) return -1;
    return getStoryboardCellIndexAtWorldPoint(this._data, _0x556165, _0x2d8352);
  }
  ['highlightCell'](_0x2af393) {
    if (this._lastHighlightIndex === _0x2af393) return;
    this._lastHighlightIndex = _0x2af393;
    if (!this._cellEls) return;
    this._cellEls.forEach((_0x3af2e3, _0x222265) => {
      if (_0x222265 === _0x2af393) _0x3af2e3.classList.add('drag-hover');
      else _0x3af2e3.classList.remove('drag-hover');
    });
  }
  ['applyImmediateCellSwap'](_0x5d9925, _0x547e7b) {
    return applyImmediateStoryboardCellSwap(this._cellEls, _0x5d9925, _0x547e7b);
  }
  ['update'](_0xe5f650) {
    const _0x4709ed = this._data || {};
    this._data = normalizeStoryboardUpdateData(_0xe5f650);
    if (this._data.isCollapsed !== _0x4709ed.isCollapsed) {
      (this._exitCustomGridEdit(), (this._isCollapsed = !!this._data.isCollapsed), this.mount());
      return;
    }
    if (this._data.isEditing !== _0x4709ed.isEditing) {
      this._isEditing = !!this._data.isEditing;
      this._isEditing && this._isCustomGridEditing && this._cancelCustomGridEdit();
      (this.el.classList.toggle('is-editing-mode', this._isEditing),
        this._updateEditButtonState(),
        syncStoryboardEditingHint(this.el, this._isEditing));
      if (this._isEditingOnlyDisplayUpdate(_0x4709ed, this._data)) {
        (this._syncBackdropImage(), this._updateGridGapButtonState(), this._updateCustomGridButtonState());
        return;
      }
    }
    syncStoryboardToolbarLabels(this.el, this._data, _0x4709ed);
    if (this._data.cols === _0x4709ed.cols && this._data.rows === _0x4709ed.rows) {
      const _0x212a2c = this._data.cells || [],
        _0xe8a6a3 = _0x4709ed.cells || [];
      updateStoryboardCellsForDataChange({
        cellEls: this._cellEls,
        newCells: _0x212a2c,
        oldCells: _0xe8a6a3,
        buildReusableImageMap: () => this._buildReusableCellImageMap(),
        updateCellDOM: (_0x3df7c8, _0x3d3922, _0x402cda) =>
          this._updateCellDOM(_0x3df7c8, _0x3d3922, _0x402cda),
        applyCellCropStyles: (_0x69b5bf, _0x58f193, _0x99163a) =>
          this._applyCellCropStyles(_0x69b5bf, _0x58f193, _0x99163a),
        renderCells: () => this._renderCells(),
        accessors: {
          isCellEmpty: (_0x11fa13) => this._isCellEmpty(_0x11fa13),
          getCellDisplayImageUrl: (_0x1c46fd) => this._getCellDisplayImageUrl(_0x1c46fd),
          getCellSourceImageUrl: (_0x143a23) => this._getCellSourceImageUrl(_0x143a23),
          getCellLiveSourceImageUrl: (_0x270808) => this._getCellLiveSourceImageUrl(_0x270808),
        },
      });
    } else this._rebuildGrid(this._data.cols, this._data.rows, this._data.cells);
    (this._syncBackdropImage(), this._syncCustomGridOverlay());
    if (this._isCustomGridEditing) this._setCustomGridHint(true);
    (this._updateGridGapButtonState(), this._updateCustomGridButtonState());
  }
  ['_rebuildGrid'](_0x10be77, _0x3b7ebf, _0x50a699) {
    const _0x328605 = this.el.querySelector('.cells-grid');
    if (!_0x328605) return;
    ((this._grid = _0x328605),
      (this._cellEls = rebuildStoryboardGridCellElements({
        grid: _0x328605,
        nodeId: this.id,
        cells: _0x50a699,
        createContentNode: (_0x4dc2ec, _0x133741) => this._createCellContentNode(_0x4dc2ec, _0x133741),
        applyCellCropStyles: (_0x2387a9, _0x33b1f8, _0xb4fed6) =>
          this._applyCellCropStyles(_0x2387a9, _0x33b1f8, _0xb4fed6),
      })),
      this._syncBackdropImage(),
      this._syncCustomGridOverlay());
  }
  ['unmount']() {
    (this._exitCustomGridEdit(), this._closeMenu(), this._removeCustomGridHandles());
  }
}
