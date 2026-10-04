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
  constructor(value) {
    try {
      this._data = structuredClone(value);
    } catch (item) {
      this._data = JSON.parse(JSON.stringify(value));
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
  ['_setSplitLinesButtonContent'](key) {
    setStoryboardSplitLinesButtonContent(key);
  }
  ['mount']() {
    const el = this.el,
      data = this._data;
    el.replaceChildren();
    const storyboardToolbar = createStoryboardToolbar({
      data: data,
      isEditing: this._isEditing,
      isCollapsed: this._isCollapsed,
    });
    el.appendChild(storyboardToolbar);
    const el2 = createStoryboardScaleWrap(),
      el3 = createStoryboardContainer(),
      index = this._getBaseGridLayout(data),
      grid = createStoryboardGridElement(index),
      cells = data.cells || [],
      appendStoryboardCellElements2 = appendStoryboardCellElements({
        grid: grid,
        nodeId: this.id,
        cells: cells,
        createContentNode: (result, options) => this._createCellContentNode(result, options),
        applyCellCropStyles: (target, source, next) => this._applyCellCropStyles(target, source, next),
      });
    return (
      el3.appendChild(grid),
      this._isCollapsed &&
        el3.appendChild(createStoryboardCollapsedBadge((data.cols || 2) * (data.rows || 2))),
      el2.appendChild(el3),
      el.appendChild(el2),
      el.appendChild(createStoryboardHint(this._isEditing)),
      (this._container = el3),
      (this._grid = grid),
      (this._cellEls = appendStoryboardCellElements2),
      this._syncBackdropImage(),
      this._syncCustomGridOverlay(),
      this._updateGridGapButtonState(),
      this._updateCustomGridButtonState(),
      this._initEvents(),
      this._ensureThumbnails(),
      el
    );
  }
  async ['_ensureThumbnails']() {
    const cells2 = clearInlineStoryboardThumbUrls(this._data.cells || []);
    cells2 && appStore.updateNodeData(this.id, { cells: cells2 });
  }
  ['_getCellFinalUrl'](current) {
    return resolveStoryboardCellPreviewSrc(current);
  }
  ['_isCellEmpty'](entry) {
    return isStoryboardCellEmpty(entry);
  }
  ['_normalizeLocalImageUrl'](record) {
    return normalizeStoryboardLocalImageUrl(record);
  }
  ['_getCellSourceImageUrl'](payload) {
    return getStoryboardCellSourceImageUrl(payload);
  }
  ['_getCellLiveSourceImageUrl'](handle) {
    return getStoryboardCellLiveSourceImageUrl(handle, this._data);
  }
  ['_getCellSourceDisplayUrl'](state) {
    return getStoryboardCellSourceDisplayUrl(state, this._data);
  }
  ['_getCellDisplayImageUrl'](config) {
    return getStoryboardCellDisplayImageUrl(config, this._data);
  }
  ['_getCellSourceIndex'](scope, input) {
    return resolveStoryboardCellSourceIndex(scope, input, this._data);
  }
  ['_getStoryboardPuzzleSourceImageUrl']() {
    return getStoryboardPuzzleSourceImageUrl(this._data);
  }
  ['_getCellResidualImageUrl'](output) {
    return getStoryboardCellResidualImageUrl(output);
  }
  ['_getStoryboardBackdropImageUrl']() {
    return getStoryboardBackdropImageUrl(this._data);
  }
  ['_createBackdropImage'](value2 = this._getStoryboardBackdropImageUrl()) {
    return createStoryboardBackdropImage(value2);
  }
  ['_syncBackdropImage'](container = this._container) {
    this._backdropEl = syncStoryboardBackdropImage({
      container: container,
      grid: this._grid,
      backdropEl: this._backdropEl,
      nextUrl: this._getStoryboardBackdropImageUrl(),
    });
  }
  ['_getGridGap']() {
    return normalizeStoryboardGridGap(this._data?.gridGap);
  }
  ['_loadStoryboardSourceImage'](value3) {
    return loadStoryboardSourceImage(value3);
  }
  ['_isLoadedImageElement'](value4) {
    return isLoadedImageElement(value4);
  }
  ['_getImageElementSource'](value5) {
    return getImageElementSource(value5);
  }
  ['_isExpectedImageSource'](value6, value7 = '') {
    return isExpectedImageSource(value6, value7);
  }
  ['_getLoadedSourceImageForCell'](index2, sourceUrl = '') {
    return getLoadedStoryboardSourceImageForCell({
      cellEls: this._cellEls,
      backdropEl: this._backdropEl,
      index: index2,
      sourceUrl: sourceUrl,
    });
  }
  ['_buildMaterializedCellCrop'](cell, index3, img) {
    return buildStoryboardMaterializedCellCrop({
      cell: cell,
      index: index3,
      img: img,
      sourceNode: this._getActiveGridNode(),
    });
  }
  ['_materializeSourceBackedCellsForEditing']() {
    return materializeStoryboardSourceBackedCellsForEditing({
      node: this._getActiveGridNode(),
      cells: this._data.cells,
      getLoadedSourceImageForCell: (value8, value9) => this._getLoadedSourceImageForCell(value8, value9),
    });
  }
  async ['_resolveCommitSourceImage'](index4, sourceUrl2, imageCache) {
    return resolveStoryboardCommitSourceImage({
      index: index4,
      sourceUrl: sourceUrl2,
      imageCache: imageCache,
      cellEls: this._cellEls,
      backdropEl: this._backdropEl,
      loadImage: (value10) => this._loadStoryboardSourceImage(value10),
    });
  }
  async ['_cropStoryboardCellFromSource'](cell2, index5, sourceNode, imageCache2) {
    return cropStoryboardCellFromSource({
      cell: cell2,
      index: index5,
      sourceNode: sourceNode,
      imageCache: imageCache2,
      resolveSourceImage: (value11, value12, value13) =>
        this._resolveCommitSourceImage(value11, value12, value13),
    });
  }
  async ['_materializeCellsForConfirmedGrid'](gridLayout, gridGap, cellsOverride = null) {
    return materializeStoryboardCellsForConfirmedGrid({
      node: this._data,
      gridLayout: gridLayout,
      gridGap: gridGap,
      cellsOverride: cellsOverride,
      cropCell: (value14, value15, value16, value17) =>
        this._cropStoryboardCellFromSource(value14, value15, value16, value17),
    });
  }
  async ['_refreshSourceBackedCellsForLayout'](value18, value19 = null) {
    const { cells: cells3 } = await this._materializeCellsForConfirmedGrid(
      value18,
      this._getGridGap(),
      value19,
    );
    return cells3;
  }
  ['_isSourceCropCell'](value20) {
    return !!this._getCellSourceImageUrl(value20);
  }
  ['_applyDefaultCellImageStyles'](value21, value22, value23) {
    applyStoryboardDefaultCellImageStyles(value21, value22, value23);
  }
  ['_applySourceCropImageStyles'](img2, cell3, index6, sourceUrl3) {
    applyStoryboardSourceCropImageStyles({
      img: img2,
      cell: cell3,
      index: index6,
      sourceUrl: sourceUrl3,
      node: this._data,
      sourceIndex: this._getCellSourceIndex(cell3, index6),
      isLoadedImageElement: (value24) => this._isLoadedImageElement(value24),
      onImageLoad: () => this._applySourceCropImageStyles(img2, cell3, index6, sourceUrl3),
    });
  }
  ['_applyCellCropStyles'](el4, value25, value26) {
    if (!el4) return;
    this._applyEmptyResidualStyles(el4, value25, value26);
    const enabled = Array.from(el4.querySelectorAll?.('.storyboard-cell-img') || []).find(
      (el5) =>
        !el5.classList?.contains?.('storyboard-empty-residual-img') &&
        !el5.classList?.contains?.('storyboard-cell-source-cache'),
    );
    if (!enabled) return;
    const value27 = this._getCellSourceDisplayUrl(value25);
    if (value27) {
      (this._applySourceCropImageStyles(enabled, value25, value26, value27),
        this._syncSourceCacheImage(el4, value25, value27));
      return;
    }
    const value28 = this._getCellLiveSourceImageUrl(value25);
    value28 ? this._syncSourceCacheImage(el4, value25, value28) : this._syncSourceCacheImage(el4, value25);
    const value29 = this._getCellFinalUrl(value25);
    this._applyDefaultCellImageStyles(enabled, value29, value25);
  }
  ['_syncSourceCacheImage'](cellEl, value30, value31 = '', onReady = null) {
    const sourceUrl4 = String(value31 || this._getCellSourceImageUrl(value30) || '').trim();
    syncStoryboardSourceCacheImage({
      cellEl: cellEl,
      sourceUrl: sourceUrl4,
      onReady: onReady,
      isLoadedImageElement: (value32) => this._isLoadedImageElement(value32),
    });
  }
  ['_applyAllCellCropStyles']() {
    if (!this._cellEls) return;
    const value33 = this._data.cells || [];
    this._cellEls.forEach((item2, value34) => {
      this._applyCellCropStyles(item2, value33[value34], value34);
    });
  }
  ['_getActiveGridNode']() {
    return buildStoryboardActiveGridNode(this._data, this._getGridGap());
  }
  ['_getBaseGridLayout'](value35 = this._data) {
    return buildStoryboardBaseGridLayout(value35);
  }
  ['_getCellLayoutBounds'](value36) {
    return getStoryboardActiveCellLayoutBounds(this._data, value36, this._getGridGap());
  }
  ['_getBaseCellLayoutBounds'](value37) {
    return getStoryboardBaseCellLayoutBounds(this._data, value37);
  }
  ['_getCellCutoutRect'](value38) {
    return getStoryboardCellCutoutRect(this._data, value38, this._getGridGap());
  }
  ['_applyEmptyCutoutStyles'](value39, value40) {
    applyStoryboardEmptyCutoutStyles(value39, value40);
  }
  ['_applyEmptyResidualImageStyles'](el6, cell4, value41) {
    const img3 = el6?.querySelector?.('.storyboard-empty-residual-img');
    applyStoryboardEmptyResidualImageStyles({
      img: img3,
      cell: cell4,
      node: this._data,
      activeBounds: this._getCellLayoutBounds(value41),
    });
  }
  ['_applyEmptyResidualStyles'](el7, value42, value43) {
    this._applyEmptyResidualImageStyles(el7, value42, value43);
    const enabled2 = el7?.querySelector?.('.storyboard-empty-residual') || null;
    if (!enabled2) return;
    this._applyEmptyCutoutStyles(enabled2, value43);
  }
  ['_applyCellLayoutStyles'](cellEl2, value44) {
    applyStoryboardCellLayoutStyles({
      cellEl: cellEl2,
      isCustomGridEditing: this._isCustomGridEditing,
      frozen: this._customGridFrozenCellStyles?.[value44],
      bounds: this._getCellLayoutBounds(value44),
    });
  }
  ['_applyAllCellLayoutStyles']() {
    if (!this._cellEls) return;
    this._cellEls.forEach((item3, value45) => {
      this._applyCellLayoutStyles(item3, value45);
    });
  }
  ['_captureCustomGridCellVisualState']() {
    this._customGridFrozenCellStyles = captureStoryboardCellVisualState(this._cellEls);
  }
  ['_restoreCustomGridCellVisualState']() {
    if (!this._cellEls || !this._customGridFrozenCellStyles) return;
    this._cellEls.forEach((item4, value46) => {
      this._applyCellLayoutStyles(item4, value46);
    });
  }
  ['_createCellContentNode'](cell5, index7 = 0) {
    return createStoryboardCellContentNode({
      cell: cell5,
      finalUrl: this._getCellDisplayImageUrl(cell5),
      residualUrl: this._getCellResidualImageUrl(cell5),
      index: index7,
    });
  }
  ['_buildReusableCellImageMap']() {
    return buildReusableStoryboardCellImageMap(this._cellEls);
  }
  ['_renderCells']() {}
  ['_updateCellDOM'](cellEl3, cell6, reusableImageMap = null) {
    const value47 = Number(cellEl3?.dataset?.index) || 0;
    updateStoryboardCellDOM({
      cellEl: cellEl3,
      cell: cell6,
      reusableImageMap: reusableImageMap,
      getCellDisplayImageUrl: (value48) => this._getCellDisplayImageUrl(value48),
      getCellResidualImageUrl: (value49) => this._getCellResidualImageUrl(value49),
      createContentNode: (value50) => this._createCellContentNode(value50),
      applyCropStyles: () => this._applyCellCropStyles(cellEl3, cell6, value47),
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
    const value51 = Number(this._customGridDraftGap);
    if (Number.isFinite(value51)) return normalizeStoryboardGridGap(value51, this._getGridGap());
    return this._getGridGap();
  }
  ['_applyGridLayout']() {
    if (this._isCustomGridEditing && this._customGridFrozenCellStyles) {
      this._restoreCustomGridCellVisualState();
      return;
    }
    const el8 = this._grid || this.el.querySelector('.cells-grid');
    if (!el8) return;
    const value52 = this._getBaseGridLayout();
    ((el8.style.gridTemplateColumns = buildStoryboardGridTemplate(value52.columns, value52.cols)),
      (el8.style.gridTemplateRows = buildStoryboardGridTemplate(value52.rowTracks, value52.rows)),
      (el8.style.gap = '0px'),
      this._applyAllCellLayoutStyles(),
      this._applyAllCellCropStyles());
  }
  ['_isTrackListEqual'](value53) {
    return isDefaultStoryboardTrackList(value53);
  }
  ['_hasCustomGridLayout'](storyboardGridLayout = resolveStoryboardGridLayout(this._data)) {
    return hasCustomStoryboardGridLayout(storyboardGridLayout);
  }
  ['_isEditingOnlyDisplayUpdate'](options2 = {}, value54 = {}) {
    return isStoryboardEditingOnlyDisplayUpdate(options2, value54, {
      isCellEmpty: (value55) => this._isCellEmpty(value55),
      getCellDisplayImageUrl: (value56) => this._getCellDisplayImageUrl(value56),
      getCellSourceImageUrl: (value57) => this._getCellSourceImageUrl(value57),
      getCellLiveSourceImageUrl: (value58) => this._getCellLiveSourceImageUrl(value58),
    });
  }
  ['_isSameGridLayout'](value59, value60) {
    return isSameStoryboardGridLayout(value59, value60);
  }
  ['_refreshSourceBackedCellsForLayoutInBackground'](value61, list) {
    if (
      typeof Image !== 'function' &&
      this._refreshSourceBackedCellsForLayout === StoryboardNode.prototype._refreshSourceBackedCellsForLayout
    )
      return;
    if (
      !Array.isArray(list) ||
      !list.some((item5) => !this._isCellEmpty(item5)) ||
      !this._getStoryboardPuzzleSourceImageUrl()
    )
      return;
    const value62 = ++this._customGridRefreshVersion;
    this._refreshSourceBackedCellsForLayout(value61, list)
      .then((enabled3) => {
        if (!enabled3 || value62 !== this._customGridRefreshVersion) return;
        const value63 =
            typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
          enabled4 = value63?.nodes?.[this.id];
        if (!enabled4 || !this._isSameGridLayout(enabled4, value61)) return;
        const list2 = Array.isArray(enabled4.cells) ? enabled4.cells : [],
          cells4 = list2.map((args, value64) => {
            const enabled5 = list[value64],
              args2 = enabled3[value64];
            if (!args || !enabled5 || !args2) return args;
            if (args.id !== enabled5.id) return args;
            if (this._isCellEmpty(args)) return args;
            return { ...args, ...args2 };
          });
        appStore.updateNodeData(this.id, { cells: cells4 });
      })
      .catch((value65) => {
        (console.error('[Storyboard] Custom grid crop refresh failed:', value65),
          typeof window !== 'undefined' &&
            window.showToast?.(storyboardToolbarText('customGridPartialRefreshFailed'), 'warning'));
      });
  }
  ['_shouldShowCustomGridOverlay'](value66 = this._getActiveGridLayout()) {
    if (this._isCustomGridEditing) return true;
    return value66.cols > 1 || value66.rows > 1;
  }
  ['_syncCustomGridOverlay']({ applyLayout: applyLayout = true } = {}) {
    const layout2 = this._getCustomGridOverlayLayout();
    if (applyLayout) this._applyGridLayout();
    else
      this._isCustomGridEditing &&
        this._customGridFrozenCellStyles &&
        this._restoreCustomGridCellVisualState();
    this._shouldShowCustomGridOverlay(layout2)
      ? this._renderCustomGridHandles({ editable: this._isCustomGridEditing, layout: layout2 })
      : this._removeCustomGridHandles();
  }
  ['_updateCustomGridButtonState']() {
    const el9 = this.el.querySelector('.act-split-lines');
    if (!el9) return;
    (el9.classList.toggle('active', this._isCustomGridEditing),
      el9.classList.remove('is-confirm'),
      (el9.disabled = this._isCustomGridConfirming),
      (el9.dataset.tooltip = this._isCustomGridConfirming
        ? storyboardToolbarText('applying')
        : this._isCustomGridEditing
          ? storyboardToolbarText('finishAdjust')
          : storyboardToolbarText('adjustSplitLines')),
      el9.setAttribute(
        'aria-label',
        this._isCustomGridConfirming
          ? storyboardToolbarText('applyingSplitLines')
          : this._isCustomGridEditing
            ? storyboardToolbarText('finishAdjustSplitLines')
            : storyboardToolbarText('adjustSplitLines'),
      ),
      this._setSplitLinesButtonContent(el9));
  }
  ['_updateGridGapButtonState']() {
    const el10 = this.el.querySelector('.act-split-lines');
    if (!el10) return;
    if (this._isCustomGridEditing) return;
    ((el10.dataset.tooltip = storyboardToolbarText('adjustSplitLines')),
      el10.setAttribute('aria-label', storyboardToolbarText('adjustSplitLines')));
  }
  ['_setCustomGridHint'](value67) {
    const el11 = this.el.querySelector('.v2-storyboard-hint');
    if (!el11) return;
    if (value67) {
      el11.textContent = storyboardToolbarText('customGridHint');
      return;
    }
    el11.textContent = this._isEditing
      ? storyboardToolbarText('editHint')
      : storyboardToolbarText('enterEditHint');
  }
  ['_enterCustomGridEdit']() {
    if (this._isCollapsed || this._isCustomGridConfirming) return false;
    this._closeMenu();
    if (this._isEditing) this._toggleEdit(false);
    const args3 = resolveStoryboardGridLayout(this._data);
    return (
      (this._isCustomGridEditing = true),
      (this._customGridDraftGap = this._getGridGap()),
      (this._customGridDraft = { columns: [...args3.columns], rows: [...args3.rowTracks] }),
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
    const gridLayout2 = this._getNormalizedCustomGridDraft(),
      gridGap2 = this._getCustomGridDraftGap();
    try {
      const args4 = { gridGap: gridGap2, gridLayout: gridLayout2 };
      ((this._data = { ...this._data, ...args4 }),
        appStore.updateNodeData(this.id, args4),
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
  ['_showSplitLinesMenu'](anchor) {
    if (!anchor) return;
    (this._closeMenu({ force: true }), (this._activeMenu = 'split-lines'), anchor.classList.add('active'));
    const menu = createStoryboardSplitLinesMenu({
      getGap: () => this._getCustomGridDraftGap(),
      onGapChange: (value68) => {
        ((this._customGridDraftGap = value68), this._syncCustomGridOverlay({ applyLayout: false }));
      },
    });
    (this._mountToolbarMenu(menu, anchor),
      (this._dismissHandler = bindStoryboardSplitLinesMenuDismiss({
        menu: menu,
        anchor: anchor,
        shouldKeepOpen: () => this._isCustomGridEditing,
        onDismiss: () => this._closeMenu(),
      })));
  }
  ['_exitCustomGridEdit']() {
    const value69 = this._activeMenu === 'split-lines';
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
      value69 && this._closeMenu({ force: true }));
  }
  ['_updateEditButtonState']() {
    const el12 = this.el.querySelector('.act-edit');
    if (!el12) return;
    (el12.classList.toggle('active', this._isEditing),
      (el12.dataset.tooltip = this._isEditing
        ? storyboardToolbarText('exitEdit')
        : storyboardToolbarText('edit')),
      el12.setAttribute(
        'aria-label',
        this._isEditing ? storyboardToolbarText('exitEdit') : storyboardToolbarText('edit'),
      ));
    const el13 = el12.querySelector('span');
    el13 &&
      (el13.textContent = this._isEditing
        ? storyboardToolbarText('exitEditShort')
        : storyboardToolbarText('editShort'));
  }
  ['_getNormalizedCustomGridDraft']() {
    const columns = resolveStoryboardGridLayout({
      cols: this._data.cols,
      rows: this._data.rows,
      gridLayout: this._customGridDraft,
    });
    return { columns: columns.columns, rows: columns.rowTracks };
  }
  ['_bindCustomGridKeyboard']() {
    if (this._customGridKeydownHandler) return;
    ((this._customGridKeydownHandler = (event) => {
      if (event.key !== 'Escape') return;
      (event.preventDefault?.(), event.stopPropagation?.(), this._cancelCustomGridEdit());
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
  ['_getCustomGridLinePosition'](value70, value71) {
    return getStoryboardCustomGridLinePosition(value70, value71);
  }
  ['_applyCustomGridLineSize'](value72, value73, value74) {
    applyStoryboardCustomGridLineSize(value72, value73, value74);
  }
  ['_renderCustomGridHandles']({
    editable: editable = this._isCustomGridEditing,
    layout: layout = this._getActiveGridLayout(),
  } = {}) {
    const lineSize = this._isCustomGridEditing ? this._getCustomGridDraftGap() : this._getGridGap();
    this._customGridOverlay = renderStoryboardCustomGridOverlay({
      grid: this._grid,
      overlay: this._customGridOverlay,
      editable: editable,
      layout: layout,
      lineSize: lineSize,
      getLinePosition: (value75, value76) => this._getCustomGridLinePosition(value75, value76),
      onPointerDown: (value77, value78, value79) => this._beginCustomGridLineDrag(value77, value78, value79),
    });
  }
  ['_beginCustomGridLineDrag'](event2, axis, index8) {
    if (!this._isCustomGridEditing || !this._grid) return;
    this._customGridDrag = beginStoryboardCustomGridLineDrag({
      event: event2,
      axis: axis,
      index: index8,
      grid: this._grid,
      rootEl: this.el,
      layout: this._getCustomGridOverlayLayout(),
      endDrag: () => this._endCustomGridLineDrag(),
      onDragMove: (value80) => this._dragCustomGridLine(value80),
      ensureVisualState: () => {
        !this._customGridFrozenCellStyles && this._captureCustomGridCellVisualState();
      },
    });
  }
  ['_dragCustomGridLine'](event3) {
    const storyboardCustomGridDragDraft = buildStoryboardCustomGridDragDraft({
      event: event3,
      drag: this._customGridDrag,
      draft: this._customGridDraft,
      adjustTracks: (value81, value82, value83) => this._adjustAdjacentGridTracks(value81, value82, value83),
    });
    if (!storyboardCustomGridDragDraft) return;
    ((this._customGridDraft = storyboardCustomGridDragDraft),
      this._syncCustomGridOverlay({ applyLayout: false }));
  }
  ['_adjustAdjacentGridTracks'](value84, value85, value86) {
    return adjustAdjacentStoryboardGridTracks(value84, value85, value86);
  }
  ['_endCustomGridLineDrag']() {
    this._customGridDrag = endStoryboardCustomGridLineDrag({ drag: this._customGridDrag, rootEl: this.el });
  }
  ['_toggleCollapse'](value87) {
    this._isCollapsed = value87;
    const storyboardCollapsePatch = buildStoryboardCollapsePatch(this._data, value87);
    appStore.updateNodeData(this.id, storyboardCollapsePatch);
  }
  ['_showAspectMenu'](value88) {
    this._showFloatingMenu(
      value88,
      'aspect',
      STORYBOARD_ASPECT_MENU_OPTIONS.map((label) => ({
        label: label.label,
        icon: label.icon,
        action: () => {
          const width = this._calculateDimsByAspect(label.label);
          appStore.updateNodeData(this.id, {
            aspectRatio: label.label,
            width: width.w,
            height: width.h,
          });
        },
      })),
    );
  }
  ['_showGridMenu'](value89) {
    this._showFloatingMenu(
      value89,
      'grid',
      STORYBOARD_GRID_MENU_OPTIONS.map((label2) => ({
        label: label2.label,
        icon: label2.icon,
        action: () => {
          this._updateGrid(label2.cols, label2.rows);
        },
      })),
    );
  }
  ['_showFloatingMenu'](el14, value90, value91) {
    (this._closeMenu(), (this._activeMenu = value90));
    const el15 = el14.querySelector('.ftb-chevron');
    if (el15) el15.style.transform = 'rotate(180deg)';
    el14.classList.add('active');
    const storyboardFloatingMenu = createStoryboardFloatingMenu(value91, () => this._closeMenu());
    this._mountToolbarMenu(storyboardFloatingMenu, el14);
    const value92 = (event4) => {
      !storyboardFloatingMenu.contains(event4.target) && !el14.contains(event4.target) && this._closeMenu();
    };
    ((this._dismissHandler = value92),
      setTimeout(() => {
        if (this._menuEl !== storyboardFloatingMenu) return;
        document.addEventListener('pointerdown', value92);
      }, 10));
  }
  ['_mountToolbarMenu'](value93, value94) {
    this._menuEl = mountStoryboardToolbarMenu(value93, value94);
  }
  ['_closeMenu']({ force: force = false } = {}) {
    const closeStoryboardToolbarMenu2 = closeStoryboardToolbarMenu({
      rootEl: this.el,
      menuEl: this._menuEl,
      activeMenu: this._activeMenu,
      isCustomGridEditing: this._isCustomGridEditing,
      dismissHandler: this._dismissHandler,
      force: force,
    });
    ((this._menuEl = closeStoryboardToolbarMenu2.menuEl),
      (this._activeMenu = closeStoryboardToolbarMenu2.activeMenu),
      (this._dismissHandler = closeStoryboardToolbarMenu2.dismissHandler));
  }
  ['_updateGrid'](cols, rows) {
    ((this._customGridRefreshVersion += 1), this._exitCustomGridEdit());
    const value95 = this._data.cells || [],
      value96 = this._data.cols || 2,
      cells5 = [];
    for (let value97 = 0; value97 < rows; value97++) {
      for (let value98 = 0; value98 < cols; value98++) {
        const value99 = value97 * value96 + value98,
          args5 = value95[value99];
        args5 ? cells5.push({ ...args5 }) : cells5.push({ id: generateId('cell'), url: '', isEmpty: true });
      }
    }
    appStore.updateNodeData(this.id, {
      cols: cols,
      rows: rows,
      cells: cells5,
      gridLayout: null,
    });
  }
  ['_toggleEdit'](enabled6) {
    const isEditing = !!enabled6;
    isEditing && this._isCustomGridEditing && this._cancelCustomGridEdit();
    ((this._isEditing = isEditing),
      this.el.classList.toggle('is-editing-mode', isEditing),
      this._updateEditButtonState(),
      syncStoryboardEditingHint(this.el, isEditing));
    if (this._isCustomGridEditing) this._setCustomGridHint(true);
    const value100 = { isEditing: isEditing };
    if (isEditing) {
      const storyboardBackdropUrl = this._getStoryboardBackdropImageUrl(),
        cells6 = this._materializeSourceBackedCellsForEditing();
      if (cells6) {
        value100.cells = cells6;
        if (storyboardBackdropUrl) value100.storyboardBackdropUrl = storyboardBackdropUrl;
        ((this._data = {
          ...this._data,
          cells: cells6,
          ...(storyboardBackdropUrl ? { storyboardBackdropUrl: storyboardBackdropUrl } : {}),
        }),
          this._syncBackdropImage(),
          this._applyAllCellCropStyles());
      }
    }
    appStore.updateNodeData(this.id, value100);
  }
  ['_getComposeCellImageElement'](value101) {
    return getStoryboardComposeCellImageElement(this._cellEls, value101);
  }
  ['_getComposeCellDisplayUrl'](cellIndex) {
    return getStoryboardComposeCellDisplayUrl({
      cellEls: this._cellEls,
      cellIndex: cellIndex,
      getImageElementSource: (value102) => this._getImageElementSource(value102),
    });
  }
  async ['_drawComposeCell'](
    value103,
    {
      cell: cell7,
      cellIndex: cellIndex2,
      displayUrl: displayUrl,
      imageEl: imageEl,
      target: target2,
      loadImage: loadImage,
    },
  ) {
    return drawStoryboardComposeCell(value103, {
      cell: cell7,
      cellIndex: cellIndex2,
      displayUrl: displayUrl,
      imageEl: imageEl,
      target: target2,
      loadImage: loadImage,
      cellEls: this._cellEls,
      getImageElementSource: (value104) => this._getImageElementSource(value104),
    });
  }
  async ['_compose']() {
    return composeStoryboardNode({
      node: this._data,
      rootEl: this.el,
      cellEls: this._cellEls,
      currentNodeId: this.id,
      isCellEmpty: (value105) => this._isCellEmpty(value105),
      getImageElementSource: (value106) => this._getImageElementSource(value106),
      getBackdropUrl: () => this._getStoryboardBackdropImageUrl(),
      markComposing: (value107) => {
        this._isComposing = value107;
      },
    });
  }
  ['_calculateDimsByAspect'](value108) {
    return calculateStoryboardDimsByAspect(this._data, value108);
  }
  ['hitTestCell'](value109, value110) {
    if (this._isCollapsed) return -1;
    return getStoryboardCellIndexAtWorldPoint(this._data, value109, value110);
  }
  ['highlightCell'](value111) {
    if (this._lastHighlightIndex === value111) return;
    this._lastHighlightIndex = value111;
    if (!this._cellEls) return;
    this._cellEls.forEach((el16, value112) => {
      if (value112 === value111) el16.classList.add('drag-hover');
      else el16.classList.remove('drag-hover');
    });
  }
  ['applyImmediateCellSwap'](value113, value114) {
    return applyImmediateStoryboardCellSwap(this._cellEls, value113, value114);
  }
  ['update'](value115) {
    const value116 = this._data || {};
    this._data = normalizeStoryboardUpdateData(value115);
    if (this._data.isCollapsed !== value116.isCollapsed) {
      (this._exitCustomGridEdit(), (this._isCollapsed = !!this._data.isCollapsed), this.mount());
      return;
    }
    if (this._data.isEditing !== value116.isEditing) {
      this._isEditing = !!this._data.isEditing;
      this._isEditing && this._isCustomGridEditing && this._cancelCustomGridEdit();
      (this.el.classList.toggle('is-editing-mode', this._isEditing),
        this._updateEditButtonState(),
        syncStoryboardEditingHint(this.el, this._isEditing));
      if (this._isEditingOnlyDisplayUpdate(value116, this._data)) {
        (this._syncBackdropImage(), this._updateGridGapButtonState(), this._updateCustomGridButtonState());
        return;
      }
    }
    syncStoryboardToolbarLabels(this.el, this._data, value116);
    if (this._data.cols === value116.cols && this._data.rows === value116.rows) {
      const newCells = this._data.cells || [],
        oldCells = value116.cells || [];
      updateStoryboardCellsForDataChange({
        cellEls: this._cellEls,
        newCells: newCells,
        oldCells: oldCells,
        buildReusableImageMap: () => this._buildReusableCellImageMap(),
        updateCellDOM: (value117, value118, value119) => this._updateCellDOM(value117, value118, value119),
        applyCellCropStyles: (value120, value121, value122) =>
          this._applyCellCropStyles(value120, value121, value122),
        renderCells: () => this._renderCells(),
        accessors: {
          isCellEmpty: (value123) => this._isCellEmpty(value123),
          getCellDisplayImageUrl: (value124) => this._getCellDisplayImageUrl(value124),
          getCellSourceImageUrl: (value125) => this._getCellSourceImageUrl(value125),
          getCellLiveSourceImageUrl: (value126) => this._getCellLiveSourceImageUrl(value126),
        },
      });
    } else this._rebuildGrid(this._data.cols, this._data.rows, this._data.cells);
    (this._syncBackdropImage(), this._syncCustomGridOverlay());
    if (this._isCustomGridEditing) this._setCustomGridHint(true);
    (this._updateGridGapButtonState(), this._updateCustomGridButtonState());
  }
  ['_rebuildGrid'](value127, value128, cells7) {
    const grid2 = this.el.querySelector('.cells-grid');
    if (!grid2) return;
    ((this._grid = grid2),
      (this._cellEls = rebuildStoryboardGridCellElements({
        grid: grid2,
        nodeId: this.id,
        cells: cells7,
        createContentNode: (value129, value130) => this._createCellContentNode(value129, value130),
        applyCellCropStyles: (value131, value132, value133) =>
          this._applyCellCropStyles(value131, value132, value133),
      })),
      this._syncBackdropImage(),
      this._syncCustomGridOverlay());
  }
  ['unmount']() {
    (this._exitCustomGridEdit(), this._closeMenu(), this._removeCustomGridHandles());
  }
}
