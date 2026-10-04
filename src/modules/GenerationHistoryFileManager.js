import {
  deleteAssetFromServer,
  deleteOutputFilesFromServer,
  fetchAssetsFromServer,
  fetchOutputFilesFromServer,
  saveAssetToServer,
} from '../../api/projectsV2Api.js';
import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId, screenToWorld } from '../core/math.js';
import { getNodeDefaultSize } from '../services/fileService.js';
import {
  GENERATION_HISTORY_EVENT,
  GENERATION_HISTORY_MEDIA_KINDS,
  buildGenerationHistoryAssetsFromNode,
  isGenerationHistoryAsset,
} from './generationHistoryAssets.js';
import { normalizeFileManagerSourceNodeForCanvas } from './generationHistoryFileManagerSizing.js';
import {
  buildFileManagerHistoryMediaKey,
  buildFileManagerHistoryRecordKey,
  getFileManagerMenuActions,
  getFileManagerSelectionAfterClick,
  isFileManagerHistoryRecordVisible,
  isActionableFileManagerMediaKind,
} from './generationHistoryFileManagerSelection.js';
import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
import { openImagePreview, openVideoPreview } from './imagePreview.js';
import { canShowItemInFolder, showItemInFolder } from '../services/nativeFileActionService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
import { onLocaleChange, t } from '../i18n/index.js';
const FILE_FILTERS = Object.freeze([
    { key: 'all', labelKey: 'filters.all' },
    { key: 'image', labelKey: 'filters.image' },
    { key: 'video', labelKey: 'filters.video' },
    { key: 'audio', labelKey: 'filters.audio' },
  ]),
  FILE_SOURCES = Object.freeze([
    { key: 'current-canvas', labelKey: 'sources.currentCanvas' },
    { key: 'history', labelKey: 'sources.history' },
    { key: 'output', labelKey: 'sources.output' },
  ]),
  FILE_MANAGER_SIDEBAR_KEY = 'files',
  FILE_MANAGER_KEEP_OPEN_SELECTOR =
    '[data-sidebar-submenu-owner="' + FILE_MANAGER_SIDEBAR_KEY + '"], #file-manager-delete-confirm-overlay',
  FILE_PANEL_RESIZE = Object.freeze({ minWidth: 0x230, defaultWidth: 0x2f8, maxViewportGap: 24 }),
  FILE_MASONRY = Object.freeze({
    gap: 16,
    placementStep: 8,
    fixedShortSide: 150,
    defaultShortSide: 0x104,
    maxLongSide: 0x230,
  }),
  FILE_HISTORY_PAGE_SIZE = 80,
  FILE_HISTORY_SCROLL_PREFETCH_PX = 0x168;
function fileManagerText(value, item = {}) {
  return t('generationHistoryFileManager.' + value, item);
}
function isHistorySource(key) {
  const result = String(key || '').trim();
  return result === 'current-canvas' || result === 'history';
}
function sortByUpdatedAt(data) {
  return [...(Array.isArray(data) ? data : [])].sort((item2, options) => {
    const target = Number(item2?.updatedAt || item2?.createdAt || 0),
      source = Number(options?.updatedAt || options?.createdAt || 0);
    return source - target;
  });
}
function normalizeProjectId(next) {
  return String(next || '').trim() || 'default_v2_project';
}
function resolveThumbSrc(current) {
  if (!resolveMediaSrc(current)) return '';
  const entry = Array.isArray(current?.items) ? current.items[0] : null,
    record = Array.isArray(current?.nodes) ? current.nodes[0] : null;
  return String(
    current?.coverUrl ||
      entry?.thumbSrc ||
      record?.thumbUrl ||
      record?.videoThumbSrc ||
      record?.imageUrl ||
      record?.videoUrl ||
      record?.src ||
      '',
  ).trim();
}
function resolveMediaSrc(payload) {
  const handle = Array.isArray(payload?.nodes) ? payload.nodes[0] : null;
  return String(
    handle?.imageUrl || handle?.sourceUrl || handle?.videoUrl || handle?.audioUrl || handle?.src || '',
  ).trim();
}
function getRecordMediaKind(state) {
  const config = String(state?.mediaKind || '')
    .trim()
    .toLowerCase();
  if (
    config === 'image' ||
    config === 'video' ||
    config === 'audio' ||
    config === 'folder' ||
    config === 'file'
  )
    return config;
  const scope = String(state?.coverType || '')
    .trim()
    .toLowerCase();
  if (scope === 'image' || scope === 'video' || scope === 'audio' || scope === 'folder' || scope === 'file')
    return scope;
  const input = Array.isArray(state?.nodes) ? state.nodes[0] : null,
    list = String(input?.type || '')
      .trim()
      .toLowerCase();
  if (list.includes('video')) return 'video';
  if (list.includes('audio')) return 'audio';
  return 'image';
}
function getMediaLabel(output) {
  if (output === 'video') return fileManagerText('mediaKinds.video');
  if (output === 'audio') return fileManagerText('mediaKinds.audio');
  if (output === 'folder') return fileManagerText('mediaKinds.folder');
  if (output === 'file') return fileManagerText('mediaKinds.file');
  return fileManagerText('mediaKinds.image');
}
function isSupportedOutputMediaKind(value2) {
  return isActionableFileManagerMediaKind(value2);
}
function isFileManagerActionableRecord(value3) {
  const recordMediaKind = getRecordMediaKind(value3);
  if (!isSupportedOutputMediaKind(recordMediaKind)) return false;
  return Array.isArray(value3?.nodes) && value3.nodes.length > 0;
}
function resolveRecordLocalPath(value4) {
  const value5 = Array.isArray(value4?.nodes) ? value4.nodes[0] : null;
  return normalizeLocalPath(
    value4?.localPath ||
      value4?.outputItem?.localPath ||
      value5?.originalLocalPath ||
      value5?.localPath ||
      value5?.displayLocalPath ||
      value5?.thumbLocalPath ||
      value5?.src ||
      value5?.imageUrl ||
      value5?.videoUrl ||
      value5?.audioUrl,
  );
}
function buildHistoryRecordIdentityKey(resultFingerprint) {
  return buildFileManagerHistoryMediaKey({
    projectId: normalizeProjectId(resultFingerprint?.projectId),
    canvasId: String(resultFingerprint?.canvasId || '').trim(),
    mediaKind: getRecordMediaKind(resultFingerprint),
    localPath: resolveRecordLocalPath(resultFingerprint),
    resultFingerprint: resultFingerprint?.resultFingerprint,
  });
}
function dedupeHistoryRecords(value6) {
  const map = new Set(),
    list2 = [];
  for (const value7 of sortByUpdatedAt(value6)) {
    const historyRecordIdentityKey = buildHistoryRecordIdentityKey(value7);
    if (historyRecordIdentityKey && map.has(historyRecordIdentityKey)) continue;
    if (historyRecordIdentityKey) map.add(historyRecordIdentityKey);
    list2.push(value7);
  }
  return list2;
}
function getOutputRecordIdForItem(error) {
  if (error?.isDir) return 'folder:' + String(error?.relPath || '');
  if (
    isSupportedOutputMediaKind(
      String(error?.mediaKind || '')
        .trim()
        .toLowerCase(),
    )
  )
    return 'output:' + String(error?.relPath || error?.localPath || '');
  return 'file:' + String(error?.relPath || error?.name || '');
}
function outputFileToRecord(box) {
  const needsAutoResize = String(box?.mediaKind || '')
    .trim()
    .toLowerCase();
  if (!isSupportedOutputMediaKind(needsAutoResize)) return null;
  const localPath = normalizeLocalPath(box?.localPath || box?.url),
    src = String(box?.url || localPathToUrl(localPath)).trim();
  if (!src) return null;
  const displayLocalPath = normalizeLocalPath(box?.displayLocalPath),
    thumbLocalPath = normalizeLocalPath(box?.thumbLocalPath),
    url = localPathToUrl(displayLocalPath),
    url2 = localPathToUrl(thumbLocalPath),
    name =
      String(box?.name || '').trim() ||
      localPath.split(/[\\/]/).pop() ||
      fileManagerText('fallback.outputFile'),
    id =
      needsAutoResize === 'video'
        ? 'source-video'
        : needsAutoResize === 'audio'
          ? 'source-audio'
          : 'source-image',
    count = Number(box?.videoWidth || box?.originalWidth || box?.width || 0) || 0,
    count2 = Number(box?.videoHeight || box?.originalHeight || box?.height || 0) || 0,
    value8 = {
      id: id + '-output-' + String(box?.relPath || localPath).replace(/[^\w-]+/g, '_'),
      type: id,
      name: name,
      x: 0,
      y: 0,
      ...getNodeDefaultSize(id),
      src: src,
      localPath: localPath,
      displayLocalPath: displayLocalPath,
      thumbLocalPath: thumbLocalPath,
      fileName: name,
      needsAutoResize: needsAutoResize !== 'audio',
    };
  if (needsAutoResize === 'image')
    ((value8.imageUrl = src),
      (value8.sourceUrl = src),
      (value8.thumbUrl = url2),
      count > 0 && ((value8.originalWidth = count), (value8.imageWidth = count)),
      count2 > 0 && ((value8.originalHeight = count2), (value8.imageHeight = count2)));
  else {
    if (needsAutoResize === 'video') {
      ((value8.videoUrl = src), (value8.thumbUrl = url2), (value8.videoThumbSrc = url2));
      if (count > 0) value8.videoWidth = count;
      if (count2 > 0) value8.videoHeight = count2;
      if (Number(box?.duration || 0) > 0) value8.duration = Number(box.duration);
    } else needsAutoResize === 'audio' && (value8.audioUrl = src);
  }
  return {
    id: 'output:' + String(box?.relPath || localPath),
    mediaKind: needsAutoResize,
    coverType: needsAutoResize,
    coverUrl: needsAutoResize === 'audio' ? '' : url2 || url || src,
    name: name,
    localPath: localPath,
    updatedAt: Number(box?.mtime || 0) || 0,
    nodes: [value8],
  };
}
function outputFileToDisplayRecord(outputItem) {
  if (outputItem?.isDir)
    return {
      id: 'folder:' + String(outputItem?.relPath || outputItem?.name || ''),
      mediaKind: 'folder',
      coverType: 'folder',
      name: String(outputItem?.name || fileManagerText('fallback.folder')),
      updatedAt: Number(outputItem?.mtime || 0) || 0,
      outputItem: outputItem,
      nodes: [],
    };
  const args = outputFileToRecord(outputItem);
  if (args) return { ...args, outputItem: outputItem };
  return {
    id: 'file:' + String(outputItem?.relPath || outputItem?.name || ''),
    mediaKind: 'file',
    coverType: 'file',
    name: String(outputItem?.name || fileManagerText('fallback.file')),
    updatedAt: Number(outputItem?.mtime || 0) || 0,
    outputItem: outputItem,
    nodes: [],
  };
}
function resolveRecordSize(value9, value10) {
  const box2 = Array.isArray(value9?.nodes) ? value9.nodes[0] : null,
    value11 = Array.isArray(value9?.items) ? value9.items[0] : null,
    box3 = value11?.nodeData || {},
    width =
      Number(box2?.videoWidth || box2?.imageWidth || box2?.originalWidth || box2?.width || box3.width || 0) ||
      0,
    height =
      Number(
        box2?.videoHeight || box2?.imageHeight || box2?.originalHeight || box2?.height || box3.height || 0,
      ) || 0;
  if (width > 0 && height > 0) return { width: width, height: height };
  if (value10 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO)
    return {
      width: Math.round((FILE_MASONRY.defaultShortSide * 16) / 9),
      height: FILE_MASONRY.defaultShortSide,
    };
  if (value10 === GENERATION_HISTORY_MEDIA_KINDS.AUDIO) return { width: 0x140, height: 140 };
  if (value10 === 'folder') return { width: 150, height: 118 };
  if (value10 === 'file') return { width: 150, height: 132 };
  return { width: FILE_MASONRY.defaultShortSide, height: FILE_MASONRY.defaultShortSide };
}
function resolveRecordAspect(value12, value13) {
  const { width: width2, height: height2 } = resolveRecordSize(value12, value13);
  return width2 + ' / ' + height2;
}
class GenerationHistoryFileManager {
  constructor() {
    ((this.panel = null),
      (this.titleEl = null),
      (this.contentEl = null),
      (this.records = []),
      (this._loading = false),
      (this._savingIds = new Set()),
      (this._savingRecordKeys = new Set()),
      (this._backfillInFlight = false),
      (this._activeFilter = 'all'),
      (this._activeSource = 'current-canvas'),
      (this._sortOrder = 'desc'),
      (this.outputItems = []),
      (this._outputDir = ''),
      (this._outputParent = ''),
      (this._outputBreadcrumbs = [{ name: 'output', dir: '' }]),
      (this._outputLoading = false),
      (this._outputLoaded = false),
      (this._panelWidth = 0),
      (this._resizeState = null),
      (this._recordsLoaded = false),
      (this._recordsDirty = false),
      (this._nextOffset = 0),
      (this._hasMore = true),
      (this._totalRecords = 0),
      (this._loadToken = 0),
      (this._selectedRecordIds = new Set()),
      (this._selectionDrag = null),
      (this._suppressNextClick = false),
      (this._unsubscribeLocale = null),
      this._initPanel(),
      this._bindButton(),
      this._bindLocaleChange(),
      this._bindGenerationEvents());
  }
  ['_isOpen']() {
    return this.panel?.classList.contains('show') === true;
  }
  ['_getCurrentProjectId']() {
    return normalizeProjectId(window.currentProjectId);
  }
  ['_getCurrentCanvasId']() {
    const value14 = window.CanvasTabManager;
    return (
      String(value14?.getActiveCanvasId?.() || '').trim() ||
      String(value14?._activeId || '').trim() ||
      'canvas_1'
    );
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: viewport } = appStore.getState(),
      value15 = window.innerWidth / 2,
      value16 = window.innerHeight / 2,
      enabled = document.documentElement?.clientWidth || window.innerWidth || 0,
      enabled2 = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!enabled || !enabled2) return screenToWorld(value15, value16, viewport);
    let value17 = 0,
      value18 = 0,
      value19 = enabled,
      value20 = enabled2;
    const list3 = [],
      value21 = document.querySelector('header'),
      value22 = document.querySelector('.sidebar-floating');
    if (value21) list3.push(value21);
    if (value22) list3.push(value22);
    if (this.panel?.classList.contains('show')) list3.push(this.panel);
    const value23 = 8;
    for (const el of list3) {
      if (!el?.isConnected) continue;
      const box4 = el.getBoundingClientRect(),
        value24 = Math.max(value17, box4.left),
        value25 = Math.max(value18, box4.top),
        value26 = Math.min(value19, box4.right),
        value27 = Math.min(value20, box4.bottom);
      if (value26 <= value24 || value27 <= value25) continue;
      if (box4.left <= value17 + value23 && box4.right > value17 + value23) {
        value17 = Math.max(value17, box4.right);
        continue;
      }
      if (box4.right >= value19 - value23 && box4.left < value19 - value23) {
        value19 = Math.min(value19, box4.left);
        continue;
      }
      if (box4.top <= value18 + value23 && box4.bottom > value18 + value23) {
        value18 = Math.max(value18, box4.bottom);
        continue;
      }
      box4.bottom >= value20 - value23 &&
        box4.top < value20 - value23 &&
        (value20 = Math.min(value20, box4.top));
    }
    const count3 = value19 - value17,
      count4 = value20 - value18,
      value28 = count3 > 40 ? value17 + count3 / 2 : value15,
      value29 = count4 > 40 ? value18 + count4 / 2 : value16;
    return screenToWorld(value28, value29, viewport);
  }
  ['_hasRecord'](value30, value31, resultFingerprint2, localPath2 = '', mediaKind = '') {
    const fileManagerHistoryRecordKey = buildFileManagerHistoryRecordKey({
        projectId: normalizeProjectId(value30),
        canvasId: String(value31 || '').trim(),
        resultFingerprint: resultFingerprint2,
      }),
      fileManagerHistoryMediaKey = buildFileManagerHistoryMediaKey({
        projectId: normalizeProjectId(value30),
        canvasId: String(value31 || '').trim(),
        mediaKind: mediaKind,
        localPath: localPath2,
        resultFingerprint: resultFingerprint2,
      });
    if (!String(resultFingerprint2 || '').trim() && !String(localPath2 || '').trim()) return false;
    return this.records.some(
      (resultFingerprint3) =>
        buildHistoryRecordIdentityKey(resultFingerprint3) === fileManagerHistoryMediaKey ||
        buildFileManagerHistoryRecordKey({
          projectId: normalizeProjectId(resultFingerprint3?.projectId),
          canvasId: String(resultFingerprint3?.canvasId || '').trim(),
          resultFingerprint: resultFingerprint3?.resultFingerprint,
        }) === fileManagerHistoryRecordKey,
    );
  }
  ['_visibleRecords']() {
    if (this._activeSource === 'output') return this._visibleOutputRecords();
    const projectId = this._getCurrentProjectId(),
      canvasId = this._getCurrentCanvasId(),
      list4 =
        this._sortOrder === 'asc'
          ? dedupeHistoryRecords(this.records).reverse()
          : dedupeHistoryRecords(this.records);
    return list4.filter((record2) =>
      isFileManagerHistoryRecordVisible({
        record: record2,
        source: this._activeSource,
        projectId: projectId,
        canvasId: canvasId,
        activeFilter: this._activeFilter,
        getMediaKind: getRecordMediaKind,
      }),
    );
  }
  ['_visibleOutputRecords']() {
    const list5 = (Array.isArray(this.outputItems) ? this.outputItems : [])
      .map(outputFileToDisplayRecord)
      .filter(Boolean)
      .filter((item3) => {
        const recordMediaKind2 = getRecordMediaKind(item3);
        if (item3?.outputItem?.isDir) return true;
        if (this._activeFilter === 'all') return recordMediaKind2 !== 'file';
        return recordMediaKind2 === this._activeFilter;
      });
    return (
      list5.sort((error2, error3) => {
        const value32 = error2?.outputItem?.isDir ? 0 : 1,
          value33 = error3?.outputItem?.isDir ? 0 : 1;
        if (value32 !== value33) return value32 - value33;
        const value34 = Number(error2?.updatedAt || 0),
          value35 = Number(error3?.updatedAt || 0),
          count5 = this._sortOrder === 'asc' ? value34 - value35 : value35 - value34;
        if (count5 !== 0) return count5;
        return String(error2?.name || '').localeCompare(String(error3?.name || ''), 'zh-CN');
      }),
      list5
    );
  }
  ['_findVisibleRecordById'](value36) {
    const enabled3 = String(value36 || '');
    if (!enabled3) return null;
    return this._visibleRecords().find((item4) => String(item4?.id || '') === enabled3) || null;
  }
  ['_findOutputItemByRecordId'](value37) {
    const enabled4 = String(value37 || '');
    if (!enabled4) return null;
    return (
      (Array.isArray(this.outputItems) ? this.outputItems : []).find(
        (item5) => getOutputRecordIdForItem(item5) === enabled4,
      ) || null
    );
  }
  ['_clearSelection']() {
    if (this._selectedRecordIds.size === 0) return;
    (this._selectedRecordIds.clear(), this._syncSelectionClasses());
  }
  ['_selectRecord'](recordId, { shiftKey: shiftKey = false } = {}) {
    const value38 = this._findVisibleRecordById(recordId),
      fileManagerSelectionAfterClick = getFileManagerSelectionAfterClick({
        current: Array.from(this._selectedRecordIds),
        recordId: recordId,
        shiftKey: shiftKey,
        actionable: isFileManagerActionableRecord(value38),
      });
    ((this._selectedRecordIds = new Set(fileManagerSelectionAfterClick)), this._syncSelectionClasses());
  }
  ['_setSelection'](value39) {
    const value40 = (Array.isArray(value39) ? value39 : []).filter((item6) =>
      isFileManagerActionableRecord(this._findVisibleRecordById(item6)),
    );
    ((this._selectedRecordIds = new Set(value40)), this._syncSelectionClasses());
  }
  ['_syncSelectionClasses']() {
    if (!this.contentEl) return;
    this.contentEl.querySelectorAll('.v2-file-history-card').forEach((el2) => {
      el2.classList.toggle('is-selected', this._selectedRecordIds.has(String(el2.dataset.recordId || '')));
    });
  }
  ['_pruneSelectionToVisibleRecords']() {
    if (this._selectedRecordIds.size === 0) return;
    const map2 = new Set(
      this._visibleRecords()
        .filter(isFileManagerActionableRecord)
        .map((item7) => String(item7?.id || '')),
    );
    let value41 = false;
    for (const value42 of Array.from(this._selectedRecordIds)) {
      !map2.has(value42) && (this._selectedRecordIds.delete(value42), (value41 = true));
    }
    if (value41) this._syncSelectionClasses();
  }
  ['_initPanel']() {
    ((this.panel = document.createElement('div')),
      (this.panel.className = 'v2-file-history-panel'),
      (this.panel.innerHTML =
        '\n      <div class="v2-file-history-header">\n        <div class="v2-file-history-title"></div>\n        <div class="v2-file-history-source-tabs" role="tablist"></div>\n        <div class="v2-file-history-subtitle"></div>\n        <div class="v2-file-history-toolbar">\n        <div class="v2-file-history-filters" role="tablist"></div>\n          <div class="v2-file-history-order" role="tablist"></div>\n        </div>\n        <div class="v2-file-history-breadcrumbs"></div>\n      </div>\n      <div class="v2-file-history-content"></div>\n      <div class="v2-file-history-resize-handle" aria-hidden="true"></div>\n    '),
      (this.titleEl = this.panel.querySelector('.v2-file-history-title')),
      (this.contentEl = this.panel.querySelector('.v2-file-history-content')),
      (this.sourceTabsEl = this.panel.querySelector('.v2-file-history-source-tabs')),
      (this.subtitleEl = this.panel.querySelector('.v2-file-history-subtitle')),
      (this.filterEl = this.panel.querySelector('.v2-file-history-filters')),
      (this.orderEl = this.panel.querySelector('.v2-file-history-order')),
      (this.breadcrumbsEl = this.panel.querySelector('.v2-file-history-breadcrumbs')),
      (this.resizeHandleEl = this.panel.querySelector('.v2-file-history-resize-handle')),
      this._syncPanelStaticTexts(),
      this._bindContentWheelGuard(),
      this._bindContentPaging(),
      this._bindMarqueeSelection(),
      this._bindContextMenu(),
      this._bindDoubleClickToCanvas(),
      this.panel.addEventListener('click', (shiftKey2) => {
        if (this._suppressNextClick) {
          (shiftKey2.preventDefault(), shiftKey2.stopPropagation(), (this._suppressNextClick = false));
          return;
        }
        const dir2 = shiftKey2.target.closest('[data-file-action]'),
          value43 = dir2?.dataset?.fileAction || '';
        if (value43 === 'filter') {
          (shiftKey2.preventDefault(), shiftKey2.stopPropagation());
          const value44 = String(dir2.dataset.filter || 'all').trim();
          FILE_FILTERS.some((event) => event.key === value44) &&
            value44 !== this._activeFilter &&
            ((this._activeFilter = value44),
            this._clearSelection(),
            this.render(),
            isHistorySource(this._activeSource) &&
              (this._resetPageState(), void this.loadRecords({ reset: true })));
          return;
        }
        if (value43 === 'source') {
          (shiftKey2.preventDefault(), shiftKey2.stopPropagation());
          const value45 = String(dir2.dataset.source || 'history').trim();
          if (FILE_SOURCES.some((event2) => event2.key === value45) && value45 !== this._activeSource) {
            ((this._activeSource = value45), this._clearSelection(), this.render());
            if (isHistorySource(value45)) void this.loadRecords({ backfillAfterLoad: true, reset: true });
            else
              value45 === 'output' &&
                !this._outputLoaded &&
                void this.loadOutputFiles({ dir: this._outputDir });
          }
          return;
        }
        if (value43 === 'order') {
          (shiftKey2.preventDefault(),
            shiftKey2.stopPropagation(),
            (this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc'),
            this._clearSelection(),
            this.render());
          isHistorySource(this._activeSource)
            ? (this._resetPageState(), void this.loadRecords({ reset: true }))
            : void this.loadOutputFiles({ dir: this._outputDir });
          return;
        }
        if (value43 === 'output-dir') {
          (shiftKey2.preventDefault(),
            shiftKey2.stopPropagation(),
            this._clearSelection(),
            void this.loadOutputFiles({ dir: dir2.dataset.dir || '' }));
          return;
        }
        const el3 = shiftKey2.target.closest('.v2-file-history-card');
        if (!el3 || !el3.dataset.recordId) return;
        if (this._activeSource === 'output') {
          const dir3 = this._findOutputItemByRecordId(el3.dataset.recordId);
          if (dir3?.isDir) {
            void this.loadOutputFiles({ dir: dir3.dir || dir3.relPath || '' });
            return;
          }
        }
        this._selectRecord(el3.dataset.recordId, { shiftKey: shiftKey2.shiftKey });
      }));
    const el4 = document.querySelector('.sidebar-floating') || document.body;
    (el4.appendChild(this.panel), this._bindResizeHandle());
  }
  ['_bindContentWheelGuard']() {
    if (!this.panel || !this.contentEl) return;
    this.panel.addEventListener(
      'wheel',
      (event3) => {
        if (!this.panel?.classList.contains('show')) return;
        (event3.stopPropagation(), event3.stopImmediatePropagation?.());
      },
      { passive: false, capture: true },
    );
  }
  ['_bindContentPaging']() {
    if (!this.contentEl) return;
    this.contentEl.addEventListener(
      'scroll',
      () => {
        if (
          !this._isOpen() ||
          !isHistorySource(this._activeSource) ||
          this._loading ||
          !this._hasMore ||
          !this._recordsLoaded
        )
          return;
        const value46 = this.contentEl.scrollHeight - this.contentEl.scrollTop - this.contentEl.clientHeight;
        value46 <= FILE_HISTORY_SCROLL_PREFETCH_PX && void this.loadRecords({ reset: false });
      },
      { passive: true },
    );
  }
  ['_bindMarqueeSelection']() {
    if (!this.contentEl) return;
    this.contentEl.addEventListener('pointerdown', (event4) => {
      if (event4.button !== 0 || !this._isOpen()) return;
      if (event4.target.closest('[data-file-action], .v2-file-history-resize-handle')) return;
      const startX = event4.clientX,
        startY = event4.clientY,
        enabled5 = { startX: startX, startY: startY, active: false, marqueeEl: null };
      this._selectionDrag = enabled5;
      const value47 = (event5) => {
          if (this._selectionDrag !== enabled5) return;
          const value48 = event5.clientX - startX,
            value49 = event5.clientY - startY;
          if (!enabled5.active && Math.hypot(value48, value49) < 6) return;
          !enabled5.active &&
            ((enabled5.active = true),
            (enabled5.marqueeEl = document.createElement('div')),
            (enabled5.marqueeEl.className = 'v2-file-history-marquee'),
            this.contentEl.appendChild(enabled5.marqueeEl));
          const box5 = this.contentEl.getBoundingClientRect(),
            left = Math.min(startX, event5.clientX) - box5.left + this.contentEl.scrollLeft,
            top = Math.min(startY, event5.clientY) - box5.top + this.contentEl.scrollTop,
            width3 = Math.abs(event5.clientX - startX),
            height3 = Math.abs(event5.clientY - startY);
          Object.assign(enabled5.marqueeEl.style, {
            left: left + 'px',
            top: top + 'px',
            width: width3 + 'px',
            height: height3 + 'px',
          });
        },
        value50 = () => {
          (window.removeEventListener('pointermove', value47, true),
            window.removeEventListener('pointerup', value50, true),
            window.removeEventListener('pointercancel', value50, true));
          if (this._selectionDrag !== enabled5) return;
          this._selectionDrag = null;
          if (!enabled5.active || !enabled5.marqueeEl) return;
          const box6 = enabled5.marqueeEl.getBoundingClientRect(),
            value51 = Array.from(this.contentEl.querySelectorAll('.v2-file-history-card'))
              .filter((el5) => {
                const box7 = el5.getBoundingClientRect();
                return !(
                  box7.right < box6.left ||
                  box7.left > box6.right ||
                  box7.bottom < box6.top ||
                  box7.top > box6.bottom
                );
              })
              .map((el6) => String(el6.dataset.recordId || ''))
              .filter(Boolean);
          (enabled5.marqueeEl.remove(), (this._suppressNextClick = true), this._setSelection(value51));
        };
      (window.addEventListener('pointermove', value47, true),
        window.addEventListener('pointerup', value50, true),
        window.addEventListener('pointercancel', value50, true));
    });
  }
  ['_bindContextMenu']() {
    if (!this.panel) return;
    this.panel.addEventListener('contextmenu', (event6) => {
      const el7 = event6.target.closest('.v2-file-history-card');
      if (!el7 || !this.panel.contains(el7)) return;
      (event6.preventDefault(), event6.stopPropagation());
      const value52 = String(el7.dataset.recordId || ''),
        value53 = this._findVisibleRecordById(value52);
      if (!isFileManagerActionableRecord(value53)) return;
      if (!this._selectedRecordIds.has(value52)) this._setSelection([value52]);
      const value54 = this._getSelectedRecords(),
        list6 = this._buildContextMenuItems(value54);
      if (list6.length === 0) return;
      showContextMenu(event6.clientX, event6.clientY, list6, {
        includeNodePicker: false,
        sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY,
      });
    });
  }
  ['_bindDoubleClickToCanvas']() {
    if (!this.panel) return;
    this.panel.addEventListener('dblclick', (event7) => {
      const el8 = event7.target.closest('.v2-file-history-card');
      if (!el8 || !this.panel.contains(el8)) return;
      const value55 = String(el8.dataset.recordId || ''),
        value56 = this._findVisibleRecordById(value55);
      if (!isFileManagerActionableRecord(value56)) return;
      (event7.preventDefault(), event7.stopPropagation());
      const value57 =
        this._selectedRecordIds.has(value55) && this._getSelectedRecords().length > 0
          ? this._getSelectedRecords()
          : [value56];
      this.restoreRecordsToCanvas(value57);
    });
  }
  ['_getSelectedRecords']() {
    const list7 = this._visibleRecords(),
      map3 = this._selectedRecordIds;
    return list7.filter((item8) => map3.has(String(item8?.id || '')));
  }
  ['_buildContextMenuItems'](value58) {
    const records = (Array.isArray(value58) ? value58 : []).filter(isFileManagerActionableRecord),
      value59 = records[0] || null,
      value60 = records.length === 1 ? resolveRecordLocalPath(value59) : '',
      fileManagerMenuActions = getFileManagerMenuActions({
        records: records,
        canRevealInFolder: canShowItemInFolder(value60),
        getMediaKind: getRecordMediaKind,
        isActionableRecord: isFileManagerActionableRecord,
      }),
      list8 = [];
    for (const value61 of fileManagerMenuActions) {
      if (value61 === 'delete' && list8.length > 0) list8.push('sep');
      if (value61 === 'add-to-canvas')
        list8.push({
          label:
            records.length > 1
              ? fileManagerText('contextMenu.addManyToCanvas', { count: records.length })
              : fileManagerText('contextMenu.addToCanvas'),
          action: () => this.restoreRecordsToCanvas(records),
        });
      else {
        if (value61 === 'fullscreen')
          list8.push({
            label: fileManagerText('contextMenu.fullscreen'),
            action: () => this._openRecordPreview(value59),
          });
        else {
          if (value61 === 'reveal')
            list8.push({
              label: fileManagerText('contextMenu.reveal'),
              action: () => this._showRecordInFolder(value59),
            });
          else
            value61 === 'delete' &&
              list8.push({
                label:
                  records.length > 1
                    ? fileManagerText('contextMenu.deleteMany', { count: records.length })
                    : fileManagerText('contextMenu.delete'),
                action: () => void this._deleteRecords(records),
              });
        }
      }
    }
    return list8;
  }
  ['_clampContentScroll']() {
    if (!this.contentEl) return;
    const count6 = Math.max(0, this.contentEl.scrollHeight - this.contentEl.clientHeight);
    if (count6 <= 0) {
      this.contentEl.scrollTop = 0;
      return;
    }
    this.contentEl.scrollTop > count6 && (this.contentEl.scrollTop = count6);
  }
  ['_bindResizeHandle']() {
    if (!this.panel || !this.resizeHandleEl) return;
    const value62 = () => {
        if (!this._resizeState) return;
        (window.removeEventListener('pointermove', value63, true),
          window.removeEventListener('pointerup', value62, true),
          window.removeEventListener('pointercancel', value62, true),
          this.panel.classList.remove('is-resizing'),
          (this._resizeState = null));
      },
      value63 = (event8) => {
        if (!this._resizeState) return;
        event8.preventDefault();
        const value64 = Math.max(
            FILE_PANEL_RESIZE.minWidth,
            window.innerWidth - this._resizeState.left - FILE_PANEL_RESIZE.maxViewportGap,
          ),
          value65 = Math.max(
            FILE_PANEL_RESIZE.minWidth,
            Math.min(value64, this._resizeState.startWidth + event8.clientX - this._resizeState.startX),
          );
        ((this._panelWidth = Math.round(value65)),
          (this.panel.style.width = this._panelWidth + 'px'),
          this._relayoutMasonry(),
          this._clampContentScroll());
      };
    this.resizeHandleEl.addEventListener('pointerdown', (startX2) => {
      if (startX2.button !== 0) return;
      (startX2.preventDefault(), startX2.stopPropagation());
      const startWidth = this.panel.getBoundingClientRect();
      ((this._resizeState = {
        startX: startX2.clientX,
        startWidth: startWidth.width || FILE_PANEL_RESIZE.defaultWidth,
        left: startWidth.left,
      }),
        this.panel.classList.add('is-resizing'),
        this.resizeHandleEl.setPointerCapture?.(startX2.pointerId),
        window.addEventListener('pointermove', value63, true),
        window.addEventListener('pointerup', value62, true),
        window.addEventListener('pointercancel', value62, true));
    });
  }
  ['_bindLocaleChange']() {
    this._unsubscribeLocale = onLocaleChange(() => {
      (this._syncPanelStaticTexts(), this.render());
    });
  }
  ['_syncPanelStaticTexts']() {
    this.panel?.setAttribute('aria-label', fileManagerText('panel.ariaLabel'));
    if (this.titleEl) this.titleEl.textContent = fileManagerText('panel.title');
    (this.sourceTabsEl?.setAttribute('aria-label', fileManagerText('panel.sourceTabsAria')),
      this.filterEl?.setAttribute('aria-label', fileManagerText('panel.filtersAria')),
      this.orderEl?.setAttribute('aria-label', fileManagerText('panel.orderAria')));
  }
  ['_bindButton']() {
    const button = document.getElementById('btnFiles');
    if (!button) return;
    const open = () => {
      this.show();
    };
    registerSidebarSubmenu({
      key: FILE_MANAGER_SIDEBAR_KEY,
      button: button,
      panel: this.panel,
      open: open,
      close: () => this.hide(),
      isOpen: () => this.panel.classList.contains('show'),
      ignorePointerDown: (value66) => this._shouldKeepOpenForExternalPointerDown(value66),
    });
  }
  ['_shouldKeepOpenForExternalPointerDown'](event9) {
    const el9 = event9?.target;
    if (!el9?.closest) return false;
    return !!el9.closest(FILE_MANAGER_KEEP_OPEN_SELECTOR);
  }
  ['_bindGenerationEvents']() {
    window.addEventListener(GENERATION_HISTORY_EVENT, (value67) => {
      const nodeData = value67?.detail || {},
        generationHistoryAssetsFromNode = buildGenerationHistoryAssetsFromNode({
          images: Array.isArray(nodeData.images) ? nodeData.images : [],
          videos: Array.isArray(nodeData.videos) ? nodeData.videos : [],
          audios: Array.isArray(nodeData.audios) ? nodeData.audios : [],
          nodeData: nodeData.nodeData || {},
          projectId: this._getCurrentProjectId(),
          canvasId: this._getCurrentCanvasId(),
          now: Number(nodeData.createdAt || Date.now()) || Date.now(),
        });
      void this._saveRecords(generationHistoryAssetsFromNode);
    });
  }
  ['_resetPageState']() {
    ((this.records = []),
      (this._recordsLoaded = false),
      (this._recordsDirty = false),
      (this._nextOffset = 0),
      (this._hasMore = true),
      (this._totalRecords = 0));
    if (this.contentEl) this.contentEl.scrollTop = 0;
  }
  async ['loadOutputFiles']({ dir: dir = this._outputDir } = {}) {
    ((this._activeSource = 'output'), (this._outputLoading = true), this.render());
    try {
      const fetchOutputFilesFromServer2 = await fetchOutputFilesFromServer({
        dir: dir,
        order: this._sortOrder,
      });
      ((this.outputItems = Array.isArray(fetchOutputFilesFromServer2?.items)
        ? fetchOutputFilesFromServer2.items
        : []),
        (this._outputDir = String(fetchOutputFilesFromServer2?.dir || '').trim()),
        (this._outputParent = String(fetchOutputFilesFromServer2?.parent || '').trim()),
        (this._outputBreadcrumbs =
          Array.isArray(fetchOutputFilesFromServer2?.breadcrumbs) &&
          fetchOutputFilesFromServer2.breadcrumbs.length > 0
            ? fetchOutputFilesFromServer2.breadcrumbs
            : [{ name: 'output', dir: '' }]),
        (this._outputLoaded = true));
    } catch (value68) {
      (console.error('[GenerationHistoryFileManager] 加载输出文件夹失败:', value68),
        (this.outputItems = []),
        (this._outputLoaded = true));
    } finally {
      this._outputLoading = false;
      if (this._isOpen()) this.render();
    }
  }
  ['_buildAssetPageParams'](value69) {
    const value70 = {
      kind: 'generation-history',
      projectId: this._getCurrentProjectId(),
      offset: Number(value69) || 0,
      limit: FILE_HISTORY_PAGE_SIZE,
    };
    this._activeSource === 'current-canvas' && (value70.canvasId = this._getCurrentCanvasId());
    if (this._activeFilter !== 'all') value70.mediaKind = this._activeFilter;
    return ((value70.order = this._sortOrder), value70);
  }
  ['_normalizeAssetsPageResponse'](items, value71) {
    if (Array.isArray(items))
      return {
        items: items.filter(isGenerationHistoryAsset),
        total: items.length,
        nextOffset: null,
        hasMore: false,
      };
    const items2 = Array.isArray(items?.items) ? items.items.filter(isGenerationHistoryAsset) : [];
    return {
      items: items2,
      total: Number(items?.total || 0) || items2.length,
      nextOffset:
        items?.nextOffset === null || items?.nextOffset === undefined
          ? null
          : Number(items.nextOffset) || Number(value71) + items2.length,
      hasMore: Boolean(items?.hasMore),
    };
  }
  async ['loadRecords']({ backfillAfterLoad: backfillAfterLoad = false, reset: reset = false } = {}) {
    if (this._loading && !reset) return;
    if (reset) this._resetPageState();
    if (!this._hasMore && this._recordsLoaded) return;
    const value72 = ++this._loadToken;
    this._loading = true;
    if (this._isOpen()) this.render();
    let value73 = false;
    const count7 = reset ? 0 : this._nextOffset;
    try {
      const fetchAssetsFromServer2 = await fetchAssetsFromServer(this._buildAssetPageParams(count7));
      if (value72 !== this._loadToken) return;
      const args2 = this._normalizeAssetsPageResponse(fetchAssetsFromServer2, count7),
        value74 =
          count7 === 0
            ? args2.items
            : [
                ...this.records,
                ...args2.items.filter(
                  (item9) =>
                    !this.records.some((item10) => String(item10?.id || '') === String(item9?.id || '')),
                ),
              ];
      ((this.records = dedupeHistoryRecords(value74)),
        (this._nextOffset =
          args2.nextOffset === null || args2.nextOffset === undefined
            ? this.records.length
            : args2.nextOffset),
        (this._hasMore = args2.hasMore),
        (this._totalRecords = args2.total),
        (this._recordsLoaded = true),
        (this._recordsDirty = false),
        (value73 = backfillAfterLoad && count7 === 0));
    } catch (value75) {
      if (value72 !== this._loadToken) return;
      console.error('[GenerationHistoryFileManager] 加载生成媒体历史失败:', value75);
    } finally {
      if (value72 === this._loadToken) {
        this._loading = false;
        if (this._isOpen()) this.render();
      }
    }
    value72 === this._loadToken && value73 && this._isOpen() && void this._backfillCurrentCanvas();
  }
  async ['_saveRecords'](value76) {
    const list9 = Array.isArray(value76) ? value76 : [],
      map4 = new Set(),
      list10 = list9.filter((enabled6) => {
        const resultFingerprint4 = String(enabled6?.resultFingerprint || '').trim(),
          recordLocalPath = resolveRecordLocalPath(enabled6);
        if (!enabled6?.id || (!resultFingerprint4 && !recordLocalPath)) return false;
        const historyRecordIdentityKey2 = buildHistoryRecordIdentityKey(enabled6),
          fileManagerHistoryRecordKey2 = buildFileManagerHistoryRecordKey({
            projectId: normalizeProjectId(enabled6.projectId),
            canvasId: String(enabled6.canvasId || '').trim(),
            resultFingerprint: resultFingerprint4,
          });
        if (map4.has(historyRecordIdentityKey2)) return false;
        map4.add(historyRecordIdentityKey2);
        if (this._savingIds.has(enabled6.id)) return false;
        if (this._savingRecordKeys.has(historyRecordIdentityKey2)) return false;
        return (
          !this._hasRecord(
            enabled6.projectId,
            enabled6.canvasId,
            resultFingerprint4,
            recordLocalPath,
            getRecordMediaKind(enabled6),
          ) && !this._savingRecordKeys.has('fingerprint:' + fileManagerHistoryRecordKey2)
        );
      });
    if (list10.length === 0) return 0;
    let count8 = 0;
    for (const value77 of list10) {
      const historyRecordIdentityKey3 = buildHistoryRecordIdentityKey(value77);
      this._savingIds.add(value77.id);
      if (historyRecordIdentityKey3) this._savingRecordKeys.add(historyRecordIdentityKey3);
      try {
        (await saveAssetToServer(value77),
          (this.records = dedupeHistoryRecords([
            value77,
            ...this.records.filter((item11) => item11.id !== value77.id),
          ])),
          (count8 += 1));
      } catch (value78) {
        console.error('[GenerationHistoryFileManager] 保存生成媒体历史失败:', value78);
      } finally {
        this._savingIds.delete(value77.id);
        if (historyRecordIdentityKey3) this._savingRecordKeys.delete(historyRecordIdentityKey3);
      }
    }
    if (count8 > 0) {
      if (this._isOpen()) this.render();
      else this._recordsDirty = true;
    }
    return count8;
  }
  async ['_backfillCurrentCanvas']() {
    if (this._backfillInFlight) return;
    this._backfillInFlight = true;
    try {
      const projectId2 = this._getCurrentProjectId(),
        canvasId2 = this._getCurrentCanvasId(),
        value79 = appStore.getStateRaw?.().nodes || appStore.getState().nodes || {},
        list11 = [];
      for (const nodeData2 of Object.values(value79 || {})) {
        if (!nodeData2) continue;
        const value80 = String(nodeData2.type || '');
        if (!['ai-image', 'ai-video', 'ai-audio'].includes(value80)) continue;
        const images = value80 === 'ai-image' && Array.isArray(nodeData2.images) ? nodeData2.images : [],
          list12 = Array.isArray(nodeData2.videos) ? nodeData2.videos : [],
          videos =
            value80 === 'ai-video'
              ? list12.length > 0
                ? list12
                : String(nodeData2.videoUrl || nodeData2.localPath || '').trim()
                  ? [nodeData2]
                  : []
              : [],
          audios =
            value80 === 'ai-audio' && String(nodeData2.audioUrl || nodeData2.localPath || '').trim()
              ? [nodeData2]
              : [];
        if (images.length === 0 && videos.length === 0 && audios.length === 0) continue;
        list11.push(
          ...buildGenerationHistoryAssetsFromNode({
            images: images,
            videos: videos,
            audios: audios,
            nodeData: nodeData2,
            projectId: projectId2,
            canvasId: canvasId2,
            now: Number(nodeData2.generationStartTime || Date.now()) || Date.now(),
          }),
        );
      }
      await this._saveRecords(list11);
    } finally {
      this._backfillInFlight = false;
    }
  }
  ['show']() {
    this.panel?.classList.add('show');
    this.panel &&
      !this._panelWidth &&
      ((this._panelWidth = FILE_PANEL_RESIZE.defaultWidth),
      (this.panel.style.width = this._panelWidth + 'px'));
    if (this._activeSource === 'output') {
      !this._outputLoaded && !this._outputLoading
        ? void this.loadOutputFiles({ dir: this._outputDir })
        : this.render();
      return;
    }
    void this._backfillCurrentCanvas();
    if (!this._recordsLoaded || this._recordsDirty) {
      if (!this._loading) void this.loadRecords({ backfillAfterLoad: true, reset: true });
      else this.render();
      return;
    }
    ((this._recordsDirty = false), this.render());
  }
  ['hide']() {
    (this.panel?.classList.remove('show'), document.getElementById('btnFiles')?.classList.remove('active'));
  }
  ['render']() {
    if (!this.contentEl || !this._isOpen()) return;
    (this._renderSourceTabs(),
      this._renderFilters(),
      this._renderOrderControls(),
      this._renderSubtitle(),
      this._renderBreadcrumbs(),
      this.contentEl.replaceChildren());
    if (
      (isHistorySource(this._activeSource) && this._loading && !this._recordsLoaded) ||
      (this._activeSource === 'output' && this._outputLoading && !this._outputLoaded)
    ) {
      const el10 = document.createElement('div');
      ((el10.className = 'v2-file-history-empty'),
        (el10.textContent = fileManagerText('loading.initial')),
        this.contentEl.appendChild(el10));
      return;
    }
    const list13 = this._visibleRecords();
    this._pruneSelectionToVisibleRecords();
    if (list13.length === 0) {
      const el11 = document.createElement('div');
      ((el11.className = 'v2-file-history-empty'),
        (el11.textContent =
          this._activeFilter === 'all'
            ? this._activeSource === 'output'
              ? fileManagerText('empty.output')
              : this._activeSource === 'current-canvas'
                ? fileManagerText('empty.currentCanvas')
                : fileManagerText('empty.history')
            : fileManagerText('empty.filtered', { label: getMediaLabel(this._activeFilter) })),
        this.contentEl.appendChild(el11),
        this._clampContentScroll());
      return;
    }
    this._renderMasonry(list13);
    if (isHistorySource(this._activeSource) && this._loading && this._recordsLoaded) {
      const el12 = document.createElement('div');
      ((el12.className = 'v2-file-history-page-status'),
        (el12.textContent = fileManagerText('loading.more')),
        this.contentEl.appendChild(el12));
    }
    this._clampContentScroll();
  }
  ['_renderSourceTabs']() {
    if (!this.sourceTabsEl) return;
    const el13 = document.createDocumentFragment();
    for (const event10 of FILE_SOURCES) {
      const el14 = document.createElement('button');
      ((el14.type = 'button'),
        (el14.className = 'v2-file-history-source-tab'),
        (el14.dataset.fileAction = 'source'),
        (el14.dataset.source = event10.key),
        el14.setAttribute('role', 'tab'),
        el14.setAttribute('aria-selected', this._activeSource === event10.key ? 'true' : 'false'),
        el14.classList.toggle('is-active', this._activeSource === event10.key),
        (el14.textContent = fileManagerText(event10.labelKey)),
        el13.appendChild(el14));
    }
    this.sourceTabsEl.replaceChildren(el13);
  }
  ['_renderOrderControls']() {
    if (!this.orderEl) return;
    const el15 = document.createElement('button');
    ((el15.type = 'button'),
      (el15.className = 'v2-file-history-order-btn'),
      (el15.dataset.fileAction = 'order'),
      (el15.dataset.order = this._sortOrder),
      el15.setAttribute(
        'aria-label',
        this._sortOrder === 'asc' ? fileManagerText('sort.ascAria') : fileManagerText('sort.descAria'),
      ),
      (el15.title =
        this._sortOrder === 'asc' ? fileManagerText('sort.ascTitle') : fileManagerText('sort.descTitle')),
      (el15.innerHTML =
        '\n      <svg viewBox="0 0 24 24" aria-hidden="true" class="' +
        (this._sortOrder === 'asc' ? 'is-asc' : 'is-desc') +
        '">\n        <path d="M8 5v14" />\n        <path d="M4.5 8.5 8 5l3.5 3.5" />\n        <path d="M16 19V5" />\n        <path d="m12.5 15.5 3.5 3.5 3.5-3.5" />\n      </svg>\n    '),
      this.orderEl.replaceChildren(el15));
  }
  ['_renderSubtitle']() {
    if (!this.subtitleEl) return;
    this.subtitleEl.textContent =
      this._activeSource === 'output'
        ? fileManagerText('subtitle.output')
        : this._activeSource === 'current-canvas'
          ? fileManagerText('subtitle.currentCanvas')
          : fileManagerText('subtitle.history');
  }
  ['_renderBreadcrumbs']() {
    if (!this.breadcrumbsEl) return;
    (this.breadcrumbsEl.replaceChildren(),
      this.breadcrumbsEl.classList.toggle('is-visible', this._activeSource === 'output'));
    if (this._activeSource !== 'output') return;
    const value81 = Array.isArray(this._outputBreadcrumbs)
      ? this._outputBreadcrumbs
      : [{ name: 'output', dir: '' }];
    if (this._outputDir) {
      const el16 = document.createElement('button');
      ((el16.type = 'button'),
        (el16.className = 'v2-file-history-crumb'),
        (el16.dataset.fileAction = 'output-dir'),
        (el16.dataset.dir = this._outputParent || ''),
        (el16.textContent = fileManagerText('breadcrumbs.up')),
        this.breadcrumbsEl.appendChild(el16));
    }
    for (const error4 of value81) {
      const el17 = document.createElement('button');
      ((el17.type = 'button'),
        (el17.className = 'v2-file-history-crumb'),
        (el17.dataset.fileAction = 'output-dir'),
        (el17.dataset.dir = String(error4?.dir || '')),
        (el17.textContent = String(error4?.name || 'output')),
        this.breadcrumbsEl.appendChild(el17));
    }
  }
  ['_getMasonryMetrics']() {
    if (!this.contentEl) return { contentWidth: 1 };
    const value82 = window.getComputedStyle(this.contentEl),
      value83 =
        (Number.parseFloat(value82.paddingLeft) || 0) + (Number.parseFloat(value82.paddingRight) || 0);
    return { contentWidth: Math.max(1, (this.contentEl.clientWidth || 1) - value83) };
  }
  ['_getRecordDisplaySize'](value84, value85) {
    const recordMediaKind3 = getRecordMediaKind(value84),
      { width: width4, height: height4 } = resolveRecordSize(value84, recordMediaKind3),
      value86 = Math.max(1, width4),
      value87 = Math.max(1, height4),
      value88 = Math.min(value86, value87),
      value89 = Math.max(value86, value87),
      value90 = FILE_MASONRY.fixedShortSide,
      value91 = Math.min(
        value90 / value88,
        FILE_MASONRY.maxLongSide / value89,
        value86 > value85 ? value85 / value86 : 1,
      );
    return {
      width: Math.max(1, Math.round(value86 * value91)),
      height: Math.max(1, Math.round(value87 * value91)),
    };
  }
  ['_findMasonrySlot'](value92, box8, value93) {
    const value94 = FILE_MASONRY.gap,
      value95 = Math.max(0, value93 - box8.width),
      list14 = [];
    for (let value96 = 0; value96 <= value95; value96 += FILE_MASONRY.placementStep) {
      list14.push(value96);
    }
    if (list14[list14.length - 1] !== value95) list14.push(value95);
    let box9 = null;
    for (const x2 of list14) {
      let y2 = 0;
      for (const box10 of value92) {
        const value97 = x2 < box10.x + box10.width + value94 && x2 + box8.width + value94 > box10.x;
        if (value97) y2 = Math.max(y2, box10.y + box10.height + value94);
      }
      (!box9 || y2 < box9.y || (y2 === box9.y && x2 < box9.x)) && (box9 = { x: x2, y: y2 });
    }
    return box9 || { x: 0, y: 0 };
  }
  ['_renderMasonry'](value98) {
    const { contentWidth: contentWidth } = this._getMasonryMetrics(),
      el18 = document.createElement('div');
    ((el18.className = 'v2-file-history-masonry-canvas'), this.contentEl.appendChild(el18));
    const list15 = [];
    let value99 = 0;
    for (const value100 of value98) {
      const box11 = this._getRecordDisplaySize(value100, contentWidth),
        box12 = this._findMasonrySlot(list15, box11, contentWidth),
        el19 = this._renderCard(value100);
      ((el19.style.left = box12.x + 'px'),
        (el19.style.top = box12.y + 'px'),
        (el19.style.width = box11.width + 'px'),
        (el19.style.height = box11.height + 'px'),
        el18.appendChild(el19),
        list15.push({ ...box12, ...box11 }),
        (value99 = Math.max(value99, box12.y + box11.height)));
    }
    el18.style.height = value99 + 'px';
  }
  ['_relayoutMasonry']() {
    if (!this.contentEl || !this._isOpen()) return false;
    const el20 = this.contentEl.querySelector('.v2-file-history-masonry-canvas');
    if (!el20) return (this.render(), false);
    const list16 = this._visibleRecords(),
      map5 = new Map(
        Array.from(el20.querySelectorAll('.v2-file-history-card')).map((el21) => [
          String(el21.dataset.recordId || ''),
          el21,
        ]),
      );
    if (list16.length !== map5.size) return (this.render(), false);
    const { contentWidth: contentWidth2 } = this._getMasonryMetrics(),
      list17 = [];
    let value101 = 0;
    for (const value102 of list16) {
      const value103 = String(value102?.id || ''),
        el22 = map5.get(value103);
      if (!el22) return (this.render(), false);
      const box13 = this._getRecordDisplaySize(value102, contentWidth2),
        box14 = this._findMasonrySlot(list17, box13, contentWidth2);
      ((el22.style.left = box14.x + 'px'),
        (el22.style.top = box14.y + 'px'),
        (el22.style.width = box13.width + 'px'),
        (el22.style.height = box13.height + 'px'),
        list17.push({ ...box14, ...box13 }),
        (value101 = Math.max(value101, box14.y + box13.height)));
    }
    return ((el20.style.height = value101 + 'px'), true);
  }
  ['_renderFilters']() {
    if (!this.filterEl) return;
    const map6 = new Map(
        Array.from(this.filterEl.querySelectorAll('.v2-file-history-filter')).map((el23) => [
          el23.dataset.filter || '',
          el23,
        ]),
      ),
      el24 = document.createDocumentFragment();
    for (const event11 of FILE_FILTERS) {
      const el25 = map6.get(event11.key) || document.createElement('button');
      (!el25.dataset.filter &&
        ((el25.type = 'button'),
        (el25.className = 'v2-file-history-filter'),
        (el25.dataset.fileAction = 'filter'),
        (el25.dataset.filter = event11.key)),
        el25.setAttribute('role', 'tab'),
        el25.setAttribute('aria-selected', this._activeFilter === event11.key ? 'true' : 'false'),
        el25.classList.toggle('is-active', this._activeFilter === event11.key),
        (el25.textContent = fileManagerText(event11.labelKey)),
        el24.appendChild(el25));
    }
    this.filterEl.replaceChildren(el24);
  }
  ['_renderCard'](value104) {
    const el26 = document.createElement('div');
    ((el26.className = 'v2-file-history-card'), (el26.dataset.recordId = String(value104?.id || '')));
    const recordMediaKind4 = getRecordMediaKind(value104);
    ((el26.dataset.mediaKind = recordMediaKind4),
      el26.classList.toggle('is-selected', this._selectedRecordIds.has(String(value104?.id || ''))));
    const el27 = document.createElement('div');
    el27.className = 'v2-file-history-thumb is-' + recordMediaKind4;
    const recordAspect = resolveRecordAspect(value104, recordMediaKind4);
    if (recordAspect) el27.style.aspectRatio = recordAspect;
    const thumbSrc = resolveThumbSrc(value104),
      mediaSrc = resolveMediaSrc(value104);
    if (recordMediaKind4 === 'folder') el27.appendChild(this._renderFolderThumb(value104));
    else {
      if (recordMediaKind4 === 'file') el27.appendChild(this._renderFileThumb(value104));
      else {
        if (recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO && mediaSrc) {
          const value105 = document.createElement('video');
          value105.src = mediaSrc;
          if (thumbSrc && thumbSrc !== mediaSrc) value105.poster = thumbSrc;
          ((value105.muted = false),
            (value105.volume = 0.72),
            (value105.loop = true),
            (value105.playsInline = true),
            (value105.preload = 'metadata'),
            (value105.draggable = false),
            el27.appendChild(value105),
            el27.appendChild(this._renderVideoPreviewOverlay()));
        } else {
          if (recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO && thumbSrc) {
            const value106 = document.createElement('img');
            ((value106.src = thumbSrc),
              (value106.alt = fileManagerText('alt.videoHistory')),
              (value106.draggable = false),
              (value106.decoding = 'async'),
              (value106.loading = 'lazy'),
              el27.appendChild(value106));
          } else {
            if (recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS.AUDIO)
              el27.appendChild(this._renderAudioThumb(mediaSrc));
            else {
              if (thumbSrc) {
                const value107 = document.createElement('img');
                ((value107.src = thumbSrc),
                  (value107.alt = fileManagerText('alt.imageHistory')),
                  (value107.draggable = false),
                  (value107.decoding = 'async'),
                  (value107.loading = 'lazy'),
                  el27.appendChild(value107));
              }
            }
          }
        }
      }
    }
    return (el26.appendChild(el27), this._bindHoverPreview(el26, recordMediaKind4), el26);
  }
  ['_bindHoverPreview'](el28, value108) {
    if (!el28) return;
    if (value108 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO) {
      const el29 = el28.querySelector('video');
      if (!el29) return;
      const el30 = el28.querySelector('.v2-file-history-video-progress-fill'),
        handler = () => {
          if (el30) el30.style.transform = 'scaleX(0)';
        },
        value109 = () => {
          if (!el30) return;
          const count9 = Number(el29.duration || 0),
            value110 = Number(el29.currentTime || 0),
            value111 = count9 > 0 ? Math.min(Math.max(value110 / count9, 0), 1) : 0;
          el30.style.transform = 'scaleX(' + value111 + ')';
        };
      (el29.addEventListener('timeupdate', value109),
        el29.addEventListener('loadedmetadata', value109),
        el28.addEventListener('mouseenter', () => {
          (el28.classList.add('is-preview-playing'), (el29.muted = false), (el29.volume = 0.72));
          const promise = el29.play();
          promise &&
            typeof promise.catch === 'function' &&
            promise.catch(() => {
              el29.muted = true;
              const promise2 = el29.play();
              promise2 &&
                typeof promise2.catch === 'function' &&
                promise2.catch(() => {
                  (el28.classList.remove('is-preview-playing'), handler());
                });
            });
        }),
        el28.addEventListener('mouseleave', () => {
          el29.pause();
          try {
            el29.currentTime = 0;
          } catch {}
          (handler(), (el29.muted = false), el28.classList.remove('is-preview-playing'));
        }));
      return;
    }
    if (value108 === GENERATION_HISTORY_MEDIA_KINDS.AUDIO) {
      const enabled7 = el28.querySelector('audio');
      if (!enabled7) return;
      (el28.addEventListener('mouseenter', () => {
        el28.classList.add('is-preview-playing');
        try {
          enabled7.currentTime = 0;
        } catch {}
        const promise3 = enabled7.play();
        promise3 &&
          typeof promise3.catch === 'function' &&
          promise3.catch(() => {
            el28.classList.remove('is-preview-playing');
          });
      }),
        el28.addEventListener('mouseleave', () => {
          enabled7.pause();
          try {
            enabled7.currentTime = 0;
          } catch {}
          el28.classList.remove('is-preview-playing');
        }));
    }
  }
  ['_renderFolderThumb'](error5) {
    const el31 = document.createElement('div');
    el31.className = 'v2-file-history-folder-thumb';
    const el32 = document.createElement('div');
    return (
      (el32.className = 'v2-file-history-folder-name'),
      (el32.textContent = error5?.name || fileManagerText('fallback.folder')),
      (el31.innerHTML =
        '\n      <svg viewBox="0 0 96 72" aria-hidden="true">\n        <path d="M8 22h28l8 9h44v31a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V22z" class="folder-body"/>\n        <path d="M8 18a8 8 0 0 1 8-8h19l8 9h37a8 8 0 0 1 8 8v6H8V18z" class="folder-tab"/>\n      </svg>\n    '),
      el31.appendChild(el32),
      el31
    );
  }
  ['_renderVideoPreviewOverlay']() {
    const el33 = document.createElement('div');
    return (
      (el33.className = 'v2-file-history-video-preview-overlay'),
      (el33.innerHTML =
        '\n      <div class="v2-file-history-video-progress" aria-hidden="true">\n        <div class="v2-file-history-video-progress-fill"></div>\n      </div>\n    '),
      el33
    );
  }
  ['_renderFileThumb'](error6) {
    const el34 = document.createElement('div');
    ((el34.className = 'v2-file-history-file-thumb'),
      (el34.innerHTML =
        '\n      <svg viewBox="0 0 72 88" aria-hidden="true">\n        <path d="M14 4h30l14 14v66H14z" class="file-page"/>\n        <path d="M44 4v15h14" class="file-fold"/>\n      </svg>\n    '));
    const el35 = document.createElement('div');
    return (
      (el35.className = 'v2-file-history-folder-name'),
      (el35.textContent = error6?.name || fileManagerText('fallback.file')),
      el34.appendChild(el35),
      el34
    );
  }
  ['_renderAudioThumb'](value112 = '') {
    const el36 = document.createElement('div');
    ((el36.className = 'v2-file-history-audio-thumb'),
      (el36.innerHTML =
        '\n      <svg viewBox="0 0 120 72" aria-hidden="true">\n        <path d="M12 38h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8" class="wave-line"/>\n        <path d="M20 48V28m16 28V20m16 36V26m16 30V18m16 38V24m16 26V32" class="wave-bars"/>\n      </svg>\n      <div class="v2-file-history-audio-progress-line" aria-hidden="true"></div>\n    '));
    const value113 = String(value112 || '').trim();
    if (value113) {
      const value114 = document.createElement('audio');
      ((value114.src = value113),
        (value114.preload = 'none'),
        (value114.className = 'v2-file-history-preview-audio'),
        (value114.volume = 0.72),
        el36.appendChild(value114));
    }
    return el36;
  }
  ['_buildCanvasNodeFromRecord'](
    value115,
    { center: center, occupiedNodes: occupiedNodes, index: index = 0 } = {},
  ) {
    const args3 = Array.isArray(value115?.nodes) ? value115.nodes[0] : null;
    if (!args3) return null;
    const recordMediaKind5 = getRecordMediaKind(value115),
      value116 =
        recordMediaKind5 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO
          ? 'source-video'
          : recordMediaKind5 === GENERATION_HISTORY_MEDIA_KINDS.AUDIO
            ? 'source-audio'
            : 'source-image',
      type = String(args3.type || value116).trim() || value116,
      box15 = normalizeFileManagerSourceNodeForCanvas({ ...args3, type: type }),
      value117 = Number(box15.width ?? box15.w) || (type === 'source-audio' ? 0x140 : 0x104),
      value118 = Number(box15.height ?? box15.h) || (type === 'source-audio' ? 140 : 0x104),
      box16 = center || this._getCanvasCenterWorld(),
      box17 = findAvailablePosition(
        occupiedNodes || appStore.getState().nodes,
        box16.x - value117 / 2 + index * 24,
        box16.y - value118 / 2 + index * 24,
        value117,
        value118,
        24,
        'right',
      ),
      box18 = JSON.parse(JSON.stringify(box15));
    return (
      (box18.id = generateId(type)),
      (box18.type = type),
      (box18.x = box17.x),
      (box18.y = box17.y),
      box18
    );
  }
  ['restoreRecordsToCanvas'](value119) {
    const list18 = (Array.isArray(value119) ? value119 : []).filter(isFileManagerActionableRecord);
    if (list18.length === 0) return;
    const center2 = this._getCanvasCenterWorld(),
      occupiedNodes2 = { ...(appStore.getState().nodes || {}) },
      count10 = [];
    list18.forEach((item12, index2) => {
      const enabled8 = this._buildCanvasNodeFromRecord(item12, {
        center: center2,
        occupiedNodes: occupiedNodes2,
        index: index2,
      });
      if (!enabled8) return;
      ((occupiedNodes2[enabled8.id] = enabled8), count10.push(enabled8));
    });
    if (count10.length === 0) return;
    appStore.batch(() => {
      (count10.forEach((item13) => appStore.addNode(item13)),
        appStore.setSelectedNodes(count10.map((item14) => item14.id)));
    });
    const value120 =
      count10.length > 1
        ? fileManagerText('toasts.addedMany', { count: count10.length })
        : this._activeSource === 'output'
          ? fileManagerText('toasts.addedOutput')
          : fileManagerText('toasts.addedHistory', {
              label: getMediaLabel(getRecordMediaKind(list18[0])),
            });
    window.showToast?.(value120, 'success');
  }
  ['_openRecordPreview'](value121) {
    if (!isFileManagerActionableRecord(value121)) return;
    const recordMediaKind6 = getRecordMediaKind(value121),
      mediaSrc2 = resolveMediaSrc(value121);
    if (recordMediaKind6 === 'image') {
      const value122 = mediaSrc2 || resolveThumbSrc(value121);
      if (value122) openImagePreview(value122, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
      return;
    }
    recordMediaKind6 === 'video' &&
      mediaSrc2 &&
      openVideoPreview(mediaSrc2, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
  }
  async ['_showRecordInFolder'](value123) {
    const recordLocalPath2 = resolveRecordLocalPath(value123);
    if (!canShowItemInFolder(recordLocalPath2)) return;
    try {
      await showItemInFolder(recordLocalPath2);
    } catch (value124) {
      (console.warn('[GenerationHistoryFileManager] 打开资源管理器失败:', value124),
        window.showToast?.(fileManagerText('toasts.revealFailed'), 'error'));
    }
  }
  ['_showDeleteRecordsConfirm'](count11) {
    if (typeof document === 'undefined' || !document.body) return Promise.resolve(false);
    return (
      document.getElementById('file-manager-delete-confirm-overlay')?.remove(),
      new Promise((handler2) => {
        const el37 = document.createElement('div');
        ((el37.id = 'file-manager-delete-confirm-overlay'), (el37.className = 'custom-confirm-overlay'));
        const el38 = document.createElement('div');
        ((el38.className = 'custom-confirm-box'),
          el38.setAttribute('role', 'dialog'),
          el38.setAttribute('aria-modal', 'true'),
          el38.setAttribute('aria-label', fileManagerText('deleteConfirm.ariaLabel')));
        const el39 = document.createElement('div');
        ((el39.className = 'confirm-title'), (el39.textContent = fileManagerText('deleteConfirm.title')));
        const el40 = document.createElement('div');
        ((el40.className = 'confirm-msg'),
          (el40.textContent =
            count11 > 1
              ? fileManagerText('deleteConfirm.messageMany', { count: count11 })
              : fileManagerText('deleteConfirm.messageOne')));
        const el41 = document.createElement('div');
        el41.className = 'confirm-btns';
        const el42 = document.createElement('button');
        ((el42.type = 'button'),
          (el42.className = 'confirm-btn confirm-cancel'),
          (el42.textContent = fileManagerText('deleteConfirm.cancel')));
        const el43 = document.createElement('button');
        ((el43.type = 'button'),
          (el43.className = 'confirm-btn confirm-ok'),
          (el43.textContent = fileManagerText('deleteConfirm.delete')),
          el41.appendChild(el42),
          el41.appendChild(el43),
          el38.appendChild(el39),
          el38.appendChild(el40),
          el38.appendChild(el41),
          el37.appendChild(el38),
          document.body.appendChild(el37));
        let value125 = false;
        const run = (value126) => {
            if (value125) return;
            ((value125 = true),
              document.removeEventListener('keydown', value127, true),
              el37.remove(),
              handler2(value126));
          },
          value127 = (event12) => {
            if (event12.key === 'Escape') {
              (event12.preventDefault(), run(false));
              return;
            }
            event12.key === 'Enter' && !event12.isComposing && (event12.preventDefault(), run(true));
          };
        (el37.addEventListener('click', (event13) => {
          if (event13.target === el37) run(false);
        }),
          el42.addEventListener('click', () => run(false)),
          el43.addEventListener('click', () => run(true)),
          document.addEventListener('keydown', value127, true),
          el42.focus?.());
      })
    );
  }
  async ['_deleteRecords'](value128) {
    const list19 = (Array.isArray(value128) ? value128 : []).filter(isFileManagerActionableRecord);
    if (list19.length === 0) return;
    const enabled9 = await this._showDeleteRecordsConfirm(list19.length);
    if (!enabled9) return;
    try {
      if (this._activeSource === 'output') {
        const localPaths = list19.map(resolveRecordLocalPath).filter(Boolean);
        if (localPaths.length === 0) return;
        await deleteOutputFilesFromServer({ localPaths: localPaths });
        const map7 = new Set(localPaths.map((item15) => normalizeLocalPath(item15)));
        this.outputItems = (Array.isArray(this.outputItems) ? this.outputItems : []).filter(
          (item16) => !map7.has(normalizeLocalPath(item16?.localPath)),
        );
      } else {
        const list20 = list19.map((item17) => String(item17?.id || '')).filter(Boolean),
          list21 = await Promise.all(list20.map((item18) => deleteAssetFromServer(item18)));
        if (list21.some((item19) => item19 === false)) throw new Error('delete asset failed');
        const map8 = new Set(list20);
        ((this.records = (Array.isArray(this.records) ? this.records : []).filter(
          (item20) => !map8.has(String(item20?.id || '')),
        )),
          (this._totalRecords = Math.max(0, Number(this._totalRecords || 0) - list20.length)));
      }
      this._selectedRecordIds.clear();
      if (this._isOpen()) this.render();
      window.showToast?.(
        list19.length > 1 ? fileManagerText('toasts.deletedMany') : fileManagerText('toasts.deletedOne'),
        'success',
      );
    } catch (value129) {
      (console.error('[GenerationHistoryFileManager] 删除文件失败:', value129),
        window.showToast?.(fileManagerText('toasts.deleteFailed'), 'error'));
    }
  }
  ['restoreRecordToCanvas'](value130) {
    const value131 =
      this._activeSource === 'output'
        ? this._visibleOutputRecords().find((item21) => String(item21?.id || '') === String(value130 || ''))
        : this.records.find((item22) => String(item22?.id || '') === String(value130 || ''));
    this.restoreRecordsToCanvas(value131 ? [value131] : []);
  }
}
export const generationHistoryFileManager = new GenerationHistoryFileManager();
