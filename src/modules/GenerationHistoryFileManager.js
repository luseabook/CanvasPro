import {
  deleteAssetFromServer,
  deleteOutputFilesFromServer,
  fetchAssetsFromServer,
  fetchOutputFilesFromServer,
  saveAssetToServer,
  saveOutputVideoThumbnailToServer,
} from '../../api/projectsV2Api.js';
import { ensureVideoResultThumbnail } from '../../api/videoResultThumbnailApi.js';
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
  applyGenerationHistoryVideoThumbnail,
  createVideoThumbnailRequestQueue,
  resolveGenerationHistoryVideoPresentation,
} from './generationHistoryVideoThumbnails.js';
import {
  buildFileManagerHistoryEntryKey,
  dedupeFileManagerHistoryRecords,
  getFileManagerMenuActions,
  getFileManagerSelectionAfterClick,
  isFileManagerBackfillDuplicate,
  isFileManagerHistoryRecordVisible,
  isActionableFileManagerMediaKind,
  resolveFileManagerBackfillStartedAt,
} from './generationHistoryFileManagerSelection.js';
import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
import { openImagePreview, openVideoPreview } from './imagePreview.js';
import { canShowItemInFolder, showItemInFolder } from '../services/nativeFileActionService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../services/desktopMediaBlobSource.js';
import { onLocaleChange, t } from '../i18n/index.js';
const FILE_FILTERS = Object['freeze']([
    { key: 'all', labelKey: 'filters.all' },
    { key: 'image', labelKey: 'filters.image' },
    { key: 'video', labelKey: 'filters.video' },
    { key: 'audio', labelKey: 'filters.audio' },
  ]),
  FILE_SOURCES = Object['freeze']([
    { key: 'current-canvas', labelKey: 'sources.currentCanvas' },
    { key: 'history', labelKey: 'sources.history' },
    { key: 'output', labelKey: 'sources.output' },
  ]),
  FILE_MANAGER_SIDEBAR_KEY = 'files',
  FILE_MANAGER_KEEP_OPEN_SELECTOR =
    '[data-sidebar-submenu-owner="' +
    FILE_MANAGER_SIDEBAR_KEY +
    '\x22],\x20#file-manager-delete-confirm-overlay',
  FILE_PANEL_RESIZE = Object['freeze']({ minWidth: 0x230, defaultWidth: 0x2f8, maxViewportGap: 0x18 }),
  FILE_MASONRY = Object['freeze']({
    gap: 0x10,
    placementStep: 0x8,
    fixedShortSide: 0x96,
    defaultShortSide: 0x104,
    maxLongSide: 0x230,
  }),
  FILE_HISTORY_PAGE_SIZE = 0x50,
  FILE_OUTPUT_PAGE_SIZE = 0x50,
  FILE_HISTORY_SCROLL_PREFETCH_PX = 0x168;
function fileManagerText(value, item = {}) {
  return t('generationHistoryFileManager.' + value, item);
}
function isHistorySource(key) {
  const result = String(key || '')['trim']();
  return result === 'current-canvas' || result === 'history';
}
function normalizeProjectId(data) {
  return String(data || '')['trim']() || 'default_v2_project';
}
function resolveThumbSrc(state) {
  if (!resolveMediaSrc(state)) return '';
  const options = Array['isArray'](state?.['items']) ? state['items'][0x0] : null,
    target = Array['isArray'](state?.['nodes']) ? state['nodes'][0x0] : null;
  return String(
    state?.['coverUrl'] ||
      options?.['thumbSrc'] ||
      target?.['thumbUrl'] ||
      target?.['videoThumbSrc'] ||
      target?.['imageUrl'] ||
      target?.['videoUrl'] ||
      target?.['src'] ||
      '',
  )['trim']();
}
function resolveMediaSrc(state2) {
  const source = Array['isArray'](state2?.['nodes']) ? state2['nodes'][0x0] : null;
  return String(
    source?.['imageUrl'] ||
      source?.['sourceUrl'] ||
      source?.['videoUrl'] ||
      source?.['audioUrl'] ||
      source?.['src'] ||
      '',
  )['trim']();
}
function getRecordMediaKind(state3) {
  const next = String(state3?.['mediaKind'] || '')
    ['trim']()
    ['toLowerCase']();
  if (
    next === 'image' ||
    next === 'video' ||
    next === 'audio' ||
    next === 'folder' ||
    next === 'file'
  )
    return next;
  const current = String(state3?.['coverType'] || '')
    ['trim']()
    ['toLowerCase']();
  if (
    current === 'image' ||
    current === 'video' ||
    current === 'audio' ||
    current === 'folder' ||
    current === 'file'
  )
    return current;
  const entry = Array['isArray'](state3?.['nodes']) ? state3['nodes'][0x0] : null,
    list = String(entry?.['type'] || '')
      ['trim']()
      ['toLowerCase']();
  if (list['includes']('video')) return 'video';
  if (list['includes']('audio')) return 'audio';
  return 'image';
}
function getMediaLabel(record) {
  if (record === 'video') return fileManagerText('mediaKinds.video');
  if (record === 'audio') return fileManagerText('mediaKinds.audio');
  if (record === 'folder') return fileManagerText('mediaKinds.folder');
  if (record === 'file') return fileManagerText('mediaKinds.file');
  return fileManagerText('mediaKinds.image');
}
function isSupportedOutputMediaKind(payload) {
  return isActionableFileManagerMediaKind(payload);
}
function isFileManagerActionableRecord(state4) {
  const recordMediaKind = getRecordMediaKind(state4);
  if (!isSupportedOutputMediaKind(recordMediaKind)) return ![];
  return Array['isArray'](state4?.['nodes']) && state4['nodes']['length'] > 0x0;
}
function resolveRecordLocalPath(state5) {
  const handle = Array['isArray'](state5?.['nodes']) ? state5['nodes'][0x0] : null;
  return normalizeLocalPath(
    state5?.['localPath'] ||
      state5?.['outputItem']?.['localPath'] ||
      handle?.['originalLocalPath'] ||
      handle?.['localPath'] ||
      handle?.['displayLocalPath'] ||
      handle?.['thumbLocalPath'] ||
      handle?.['src'] ||
      handle?.['imageUrl'] ||
      handle?.['videoUrl'] ||
      handle?.['audioUrl'],
  );
}
function buildHistoryRecordIdentityKey(sourceIndex) {
  return buildFileManagerHistoryEntryKey({
    projectId: normalizeProjectId(sourceIndex?.['projectId']),
    canvasId: String(sourceIndex?.['canvasId'] || '')['trim'](),
    generationRunId: String(sourceIndex?.['generationRunId'] || '')['trim'](),
    mediaKind: getRecordMediaKind(sourceIndex),
    sourceIndex: sourceIndex?.['sourceIndex'],
    localPath: resolveRecordLocalPath(sourceIndex),
    resultFingerprint: sourceIndex?.['resultFingerprint'],
  });
}
function dedupeHistoryRecords(config) {
  return dedupeFileManagerHistoryRecords(config, {
    getMediaKind: getRecordMediaKind,
    getLocalPath: resolveRecordLocalPath,
  });
}
function getOutputRecordIdForItem(error) {
  if (error?.['isDir']) return 'folder:' + String(error?.['relPath'] || '');
  if (
    isSupportedOutputMediaKind(
      String(error?.['mediaKind'] || '')
        ['trim']()
        ['toLowerCase'](),
    )
  )
    return 'output:' + String(error?.['relPath'] || error?.['localPath'] || '');
  return 'file:' + String(error?.['relPath'] || error?.['name'] || '');
}
function outputFileToRecord(box) {
  const needsAutoResize = String(box?.['mediaKind'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!isSupportedOutputMediaKind(needsAutoResize)) return null;
  const localPath = normalizeLocalPath(box?.['localPath'] || box?.['url']),
    src = String(box?.['url'] || localPathToUrl(localPath))['trim']();
  if (!src) return null;
  const displayLocalPath = normalizeLocalPath(box?.['displayLocalPath']),
    thumbLocalPath = normalizeLocalPath(box?.['thumbLocalPath']),
    url = localPathToUrl(displayLocalPath),
    url2 = localPathToUrl(thumbLocalPath),
    name =
      String(box?.['name'] || '')['trim']() ||
      localPath['split'](/[\\/]/)['pop']() ||
      fileManagerText('fallback.outputFile'),
    id =
      needsAutoResize === 'video' ? 'source-video' : needsAutoResize === 'audio' ? 'source-audio' : 'source-image',
    count =
      Number(box?.['videoWidth'] || box?.['originalWidth'] || box?.['width'] || 0x0) || 0x0,
    count2 =
      Number(box?.['videoHeight'] || box?.['originalHeight'] || box?.['height'] || 0x0) ||
      0x0,
    scope = {
      id: id + '-output-' + String(box?.['relPath'] || localPath)['replace'](/[^\w-]+/g, '_'),
      type: id,
      name: name,
      x: 0x0,
      y: 0x0,
      ...getNodeDefaultSize(id),
      src: src,
      localPath: localPath,
      displayLocalPath: displayLocalPath,
      thumbLocalPath: thumbLocalPath,
      fileName: name,
      needsAutoResize: needsAutoResize !== 'audio',
    };
  if (needsAutoResize === 'image')
    ((scope['imageUrl'] = src),
      (scope['sourceUrl'] = src),
      (scope['thumbUrl'] = url2),
      count > 0x0 && ((scope['originalWidth'] = count), (scope['imageWidth'] = count)),
      count2 > 0x0 && ((scope['originalHeight'] = count2), (scope['imageHeight'] = count2)));
  else {
    if (needsAutoResize === 'video') {
      ((scope['videoUrl'] = src),
        (scope['posterUrl'] = url2),
        (scope['thumbUrl'] = url2),
        (scope['posterLocalPath'] = thumbLocalPath),
        (scope['videoThumbSrc'] = src));
      if (count > 0x0) scope['videoWidth'] = count;
      if (count2 > 0x0) scope['videoHeight'] = count2;
      if (Number(box?.['duration'] || 0x0) > 0x0) scope['duration'] = Number(box['duration']);
    } else needsAutoResize === 'audio' && (scope['audioUrl'] = src);
  }
  return {
    id: 'output:' + String(box?.['relPath'] || localPath),
    mediaKind: needsAutoResize,
    coverType: needsAutoResize,
    coverUrl:
      needsAutoResize === 'audio' ? '' : needsAutoResize === 'video' ? url2 : url2 || url || src,
    name: name,
    localPath: localPath,
    updatedAt: Number(box?.['mtime'] || 0x0) || 0x0,
    nodes: [scope],
  };
}
function outputFileToDisplayRecord(outputItem) {
  if (outputItem?.['isDir'])
    return {
      id: 'folder:' + String(outputItem?.['relPath'] || outputItem?.['name'] || ''),
      mediaKind: 'folder',
      coverType: 'folder',
      name: String(outputItem?.['name'] || fileManagerText('fallback.folder')),
      updatedAt: Number(outputItem?.['mtime'] || 0x0) || 0x0,
      outputItem: outputItem,
      nodes: [],
    };
  const args = outputFileToRecord(outputItem);
  if (args) return { ...args, outputItem: outputItem };
  return {
    id: 'file:' + String(outputItem?.['relPath'] || outputItem?.['name'] || ''),
    mediaKind: 'file',
    coverType: 'file',
    name: String(outputItem?.['name'] || fileManagerText('fallback.file')),
    updatedAt: Number(outputItem?.['mtime'] || 0x0) || 0x0,
    outputItem: outputItem,
    nodes: [],
  };
}
function resolveRecordSize(state6, input) {
  const box2 = Array['isArray'](state6?.['nodes']) ? state6['nodes'][0x0] : null,
    output = Array['isArray'](state6?.['items']) ? state6['items'][0x0] : null,
    box3 = output?.['nodeData'] || {},
    width =
      Number(
        box2?.['videoWidth'] ||
          box2?.['imageWidth'] ||
          box2?.['originalWidth'] ||
          box2?.['width'] ||
          box3['width'] ||
          0x0,
      ) || 0x0,
    height =
      Number(
        box2?.['videoHeight'] ||
          box2?.['imageHeight'] ||
          box2?.['originalHeight'] ||
          box2?.['height'] ||
          box3['height'] ||
          0x0,
      ) || 0x0;
  if (width > 0x0 && height > 0x0) return { width: width, height: height };
  if (input === GENERATION_HISTORY_MEDIA_KINDS['VIDEO'])
    return {
      width: Math['round']((FILE_MASONRY['defaultShortSide'] * 0x10) / 0x9),
      height: FILE_MASONRY['defaultShortSide'],
    };
  if (input === GENERATION_HISTORY_MEDIA_KINDS['AUDIO']) return { width: 0x140, height: 0x8c };
  if (input === 'folder') return { width: 0x96, height: 0x76 };
  if (input === 'file') return { width: 0x96, height: 0x84 };
  return { width: FILE_MASONRY['defaultShortSide'], height: FILE_MASONRY['defaultShortSide'] };
}
function resolveRecordAspect(value2, value3) {
  const { width: width2, height: height2 } = resolveRecordSize(value2, value3);
  return width2 + '\x20/\x20' + height2;
}
class GenerationHistoryFileManager {
  constructor() {
    ((this['panel'] = null),
      (this['titleEl'] = null),
      (this['contentEl'] = null),
      (this['records'] = []),
      (this['_loading'] = ![]),
      (this['_savingIds'] = new Set()),
      (this['_savingRecordKeys'] = new Set()),
      (this['_backfillInFlight'] = ![]),
      (this['_activeFilter'] = 'all'),
      (this['_activeSource'] = 'current-canvas'),
      (this['_sortOrder'] = 'desc'),
      (this['outputItems'] = []),
      (this['_outputDir'] = ''),
      (this['_outputParent'] = ''),
      (this['_outputBreadcrumbs'] = [{ name: 'output', dir: '' }]),
      (this['_outputLoading'] = ![]),
      (this['_outputLoaded'] = ![]),
      (this['_outputNextOffset'] = 0x0),
      (this['_outputHasMore'] = !![]),
      (this['_outputTotalItems'] = 0x0),
      (this['_outputLoadToken'] = 0x0),
      (this['_panelWidth'] = 0x0),
      (this['_resizeState'] = null),
      (this['_recordsLoaded'] = ![]),
      (this['_recordsDirty'] = ![]),
      (this['_nextOffset'] = 0x0),
      (this['_hasMore'] = !![]),
      (this['_totalRecords'] = 0x0),
      (this['_loadToken'] = 0x0),
      (this['_selectedRecordIds'] = new Set()),
      (this['_selectionDrag'] = null),
      (this['_suppressNextClick'] = ![]),
      (this['_unsubscribeLocale'] = null),
      (this['_videoThumbnailQueue'] = createVideoThumbnailRequestQueue({ concurrency: 0x1 })),
      (this['_videoThumbnailObserver'] = null),
      (this['_videoThumbnailTargets'] = new WeakMap()),
      (this['_videoThumbnailBackfills'] = new Map()),
      (this['_mediaPreviewDisposers'] = new Set()),
      this['_initPanel'](),
      this['_bindButton'](),
      this['_bindLocaleChange'](),
      this['_bindGenerationEvents']());
  }
  ['_isOpen']() {
    return this['panel']?.['classList']['contains']('show') === !![];
  }
  ['_getCurrentProjectId']() {
    return normalizeProjectId(window['currentProjectId']);
  }
  ['_getCurrentCanvasId']() {
    const value4 = window['CanvasTabManager'];
    return (
      String(value4?.['getActiveCanvasId']?.() || '')['trim']() ||
      String(value4?.['_activeId'] || '')['trim']() ||
      'canvas_1'
    );
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: viewport } = appStore['getState'](),
      value5 = window['innerWidth'] / 0x2,
      value6 = window['innerHeight'] / 0x2,
      enabled = document['documentElement']?.['clientWidth'] || window['innerWidth'] || 0x0,
      enabled2 = document['documentElement']?.['clientHeight'] || window['innerHeight'] || 0x0;
    if (!enabled || !enabled2) return screenToWorld(value5, value6, viewport);
    let value7 = 0x0,
      value8 = 0x0,
      value9 = enabled,
      value10 = enabled2;
    const list2 = [],
      value11 = document['querySelector']('header'),
      value12 = document['querySelector']('.sidebar-floating');
    if (value11) list2['push'](value11);
    if (value12) list2['push'](value12);
    if (this['panel']?.['classList']['contains']('show')) list2['push'](this['panel']);
    const value13 = 0x8;
    for (const el of list2) {
      if (!el?.['isConnected']) continue;
      const box4 = el['getBoundingClientRect'](),
        value14 = Math['max'](value7, box4['left']),
        value15 = Math['max'](value8, box4['top']),
        value16 = Math['min'](value9, box4['right']),
        value17 = Math['min'](value10, box4['bottom']);
      if (value16 <= value14 || value17 <= value15) continue;
      if (box4['left'] <= value7 + value13 && box4['right'] > value7 + value13) {
        value7 = Math['max'](value7, box4['right']);
        continue;
      }
      if (box4['right'] >= value9 - value13 && box4['left'] < value9 - value13) {
        value9 = Math['min'](value9, box4['left']);
        continue;
      }
      if (box4['top'] <= value8 + value13 && box4['bottom'] > value8 + value13) {
        value8 = Math['max'](value8, box4['bottom']);
        continue;
      }
      box4['bottom'] >= value10 - value13 &&
        box4['top'] < value10 - value13 &&
        (value10 = Math['min'](value10, box4['top']));
    }
    const count3 = value9 - value7,
      count4 = value10 - value8,
      value18 = count3 > 0x28 ? value7 + count3 / 0x2 : value5,
      value19 = count4 > 0x28 ? value8 + count4 / 0x2 : value6;
    return screenToWorld(value18, value19, viewport);
  }
  ['_hasRecord'](value20) {
    const historyRecordIdentityKey = buildHistoryRecordIdentityKey(value20);
    if (!historyRecordIdentityKey) return ![];
    return this['records']['some']((value21) => buildHistoryRecordIdentityKey(value21) === historyRecordIdentityKey);
  }
  ['_visibleRecords']() {
    if (this['_activeSource'] === 'output') return this['_visibleOutputRecords']();
    const projectId = this['_getCurrentProjectId'](),
      canvasId = this['_getCurrentCanvasId'](),
      list3 =
        this['_sortOrder'] === 'asc'
          ? dedupeHistoryRecords(this['records'])['reverse']()
          : dedupeHistoryRecords(this['records']);
    return list3['filter']((record2) =>
      isFileManagerHistoryRecordVisible({
        record: record2,
        source: this['_activeSource'],
        projectId: projectId,
        canvasId: canvasId,
        activeFilter: this['_activeFilter'],
        getMediaKind: getRecordMediaKind,
      }),
    );
  }
  ['_visibleOutputRecords']() {
    const list4 = (Array['isArray'](this['outputItems']) ? this['outputItems'] : [])
      ['map'](outputFileToDisplayRecord)
      ['filter'](Boolean)
      ['filter']((value22) => {
        const recordMediaKind2 = getRecordMediaKind(value22);
        if (value22?.['outputItem']?.['isDir']) return !![];
        if (this['_activeFilter'] === 'all') return recordMediaKind2 !== 'file';
        return recordMediaKind2 === this['_activeFilter'];
      });
    return (
      list4['sort']((error2, error3) => {
        const value23 = error2?.['outputItem']?.['isDir'] ? 0x0 : 0x1,
          value24 = error3?.['outputItem']?.['isDir'] ? 0x0 : 0x1;
        if (value23 !== value24) return value23 - value24;
        const value25 = Number(error2?.['updatedAt'] || 0x0),
          value26 = Number(error3?.['updatedAt'] || 0x0),
          count5 = this['_sortOrder'] === 'asc' ? value25 - value26 : value26 - value25;
        if (count5 !== 0x0) return count5;
        return String(error2?.['name'] || '')['localeCompare'](String(error3?.['name'] || ''), 'zh-CN');
      }),
      list4
    );
  }
  ['_findVisibleRecordById'](value27) {
    const enabled3 = String(value27 || '');
    if (!enabled3) return null;
    return (
      this['_visibleRecords']()['find']((value28) => String(value28?.['id'] || '') === enabled3) || null
    );
  }
  ['_findOutputItemByRecordId'](value29) {
    const enabled4 = String(value29 || '');
    if (!enabled4) return null;
    return (
      (Array['isArray'](this['outputItems']) ? this['outputItems'] : [])['find'](
        (value30) => getOutputRecordIdForItem(value30) === enabled4,
      ) || null
    );
  }
  ['_clearSelection']() {
    if (this['_selectedRecordIds']['size'] === 0x0) return;
    (this['_selectedRecordIds']['clear'](), this['_syncSelectionClasses']());
  }
  ['_selectRecord'](recordId, { shiftKey: shiftKey = ![] } = {}) {
    const value31 = this['_findVisibleRecordById'](recordId),
      fileManagerSelectionAfterClick = getFileManagerSelectionAfterClick({
        current: Array['from'](this['_selectedRecordIds']),
        recordId: recordId,
        shiftKey: shiftKey,
        actionable: isFileManagerActionableRecord(value31),
      });
    ((this['_selectedRecordIds'] = new Set(fileManagerSelectionAfterClick)), this['_syncSelectionClasses']());
  }
  ['_setSelection'](value32) {
    const value33 = (Array['isArray'](value32) ? value32 : [])['filter']((value34) =>
      isFileManagerActionableRecord(this['_findVisibleRecordById'](value34)),
    );
    ((this['_selectedRecordIds'] = new Set(value33)), this['_syncSelectionClasses']());
  }
  ['_syncSelectionClasses']() {
    if (!this['contentEl']) return;
    this['contentEl']['querySelectorAll']('.v2-file-history-card')['forEach']((el2) => {
      el2['classList']['toggle'](
        'is-selected',
        this['_selectedRecordIds']['has'](String(el2['dataset']['recordId'] || '')),
      );
    });
  }
  ['_pruneSelectionToVisibleRecords']() {
    if (this['_selectedRecordIds']['size'] === 0x0) return;
    const map = new Set(
      this['_visibleRecords']()
        ['filter'](isFileManagerActionableRecord)
        ['map']((value35) => String(value35?.['id'] || '')),
    );
    let value36 = ![];
    for (const value37 of Array['from'](this['_selectedRecordIds'])) {
      !map['has'](value37) && (this['_selectedRecordIds']['delete'](value37), (value36 = !![]));
    }
    if (value36) this['_syncSelectionClasses']();
  }
  ['_initPanel']() {
    ((this['panel'] = document['createElement']('div')),
      (this['panel']['className'] = 'v2-file-history-panel canvas-toolbar-panel-surface'),
      (this['panel']['innerHTML'] =
        '\n      <div class="v2-file-history-header">\n        <div class="v2-file-history-title"></div>\n        <div class="v2-file-history-source-tabs" role="tablist"></div>\n        <div class="v2-file-history-subtitle"></div>\n        <div class="v2-file-history-toolbar">\n        <div class="v2-file-history-filters" role="tablist"></div>\n          <div class="v2-file-history-order" role="tablist"></div>\n        </div>\n        <div class="v2-file-history-breadcrumbs"></div>\n      </div>\n      <div class="v2-file-history-content"></div>\n      <div class="v2-file-history-resize-handle" aria-hidden="true"></div>\n    '),
      (this['titleEl'] = this['panel']['querySelector']('.v2-file-history-title')),
      (this['contentEl'] = this['panel']['querySelector']('.v2-file-history-content')),
      (this['sourceTabsEl'] = this['panel']['querySelector']('.v2-file-history-source-tabs')),
      (this['subtitleEl'] = this['panel']['querySelector']('.v2-file-history-subtitle')),
      (this['filterEl'] = this['panel']['querySelector']('.v2-file-history-filters')),
      (this['orderEl'] = this['panel']['querySelector']('.v2-file-history-order')),
      (this['breadcrumbsEl'] = this['panel']['querySelector']('.v2-file-history-breadcrumbs')),
      (this['resizeHandleEl'] = this['panel']['querySelector']('.v2-file-history-resize-handle')),
      this['_syncPanelStaticTexts'](),
      this['_bindContentWheelGuard'](),
      this['_bindContentPaging'](),
      this['_bindMarqueeSelection'](),
      this['_bindContextMenu'](),
      this['_bindDoubleClickToCanvas'](),
      this['panel']['addEventListener']('click', (shiftKey2) => {
        if (this['_suppressNextClick']) {
          (shiftKey2['preventDefault'](), shiftKey2['stopPropagation'](), (this['_suppressNextClick'] = ![]));
          return;
        }
        const dir2 = shiftKey2['target']['closest']('[data-file-action]'),
          value38 = dir2?.['dataset']?.['fileAction'] || '';
        if (value38 === 'filter') {
          (shiftKey2['preventDefault'](), shiftKey2['stopPropagation']());
          const value39 = String(dir2['dataset']['filter'] || 'all')['trim']();
          FILE_FILTERS['some']((event) => event['key'] === value39) &&
            value39 !== this['_activeFilter'] &&
            ((this['_activeFilter'] = value39),
            this['_clearSelection'](),
            this['render'](),
            isHistorySource(this['_activeSource']) &&
              (this['_resetPageState'](), void this['loadRecords']({ reset: !![] })));
          return;
        }
        if (value38 === 'source') {
          (shiftKey2['preventDefault'](), shiftKey2['stopPropagation']());
          const value40 = String(dir2['dataset']['source'] || 'history')['trim']();
          if (
            FILE_SOURCES['some']((event2) => event2['key'] === value40) &&
            value40 !== this['_activeSource']
          ) {
            ((this['_activeSource'] = value40), this['_clearSelection'](), this['render']());
            if (isHistorySource(value40))
              void this['loadRecords']({ backfillAfterLoad: !![], reset: !![] });
            else
              value40 === 'output' &&
                !this['_outputLoaded'] &&
                void this['loadOutputFiles']({ dir: this['_outputDir'], reset: !![] });
          }
          return;
        }
        if (value38 === 'order') {
          (shiftKey2['preventDefault'](),
            shiftKey2['stopPropagation'](),
            (this['_sortOrder'] = this['_sortOrder'] === 'asc' ? 'desc' : 'asc'),
            this['_clearSelection'](),
            this['render']());
          isHistorySource(this['_activeSource'])
            ? (this['_resetPageState'](), void this['loadRecords']({ reset: !![] }))
            : void this['loadOutputFiles']({ dir: this['_outputDir'], reset: !![] });
          return;
        }
        if (value38 === 'output-dir') {
          (shiftKey2['preventDefault'](),
            shiftKey2['stopPropagation'](),
            this['_clearSelection'](),
            void this['loadOutputFiles']({ dir: dir2['dataset']['dir'] || '', reset: !![] }));
          return;
        }
        const el3 = shiftKey2['target']['closest']('.v2-file-history-card');
        if (!el3 || !el3['dataset']['recordId']) return;
        if (this['_activeSource'] === 'output') {
          const dir3 = this['_findOutputItemByRecordId'](el3['dataset']['recordId']);
          if (dir3?.['isDir']) {
            void this['loadOutputFiles']({
              dir: dir3['dir'] || dir3['relPath'] || '',
              reset: !![],
            });
            return;
          }
        }
        this['_selectRecord'](el3['dataset']['recordId'], { shiftKey: shiftKey2['shiftKey'] });
      }));
    const el4 = document['querySelector']('.sidebar-floating') || document['body'];
    (el4['appendChild'](this['panel']), this['_bindResizeHandle']());
  }
  ['_bindContentWheelGuard']() {
    if (!this['panel'] || !this['contentEl']) return;
    this['panel']['addEventListener'](
      'wheel',
      (event3) => {
        if (!this['panel']?.['classList']['contains']('show')) return;
        (event3['stopPropagation'](), event3['stopImmediatePropagation']?.());
      },
      { passive: ![], capture: !![] },
    );
  }
  ['_bindContentPaging']() {
    if (!this['contentEl']) return;
    this['contentEl']['addEventListener'](
      'scroll',
      () => {
        const value41 =
          this['contentEl']['scrollHeight'] -
          this['contentEl']['scrollTop'] -
          this['contentEl']['clientHeight'];
        if (
          this['_isOpen']() &&
          isHistorySource(this['_activeSource']) &&
          !this['_loading'] &&
          this['_hasMore'] &&
          this['_recordsLoaded'] &&
          value41 <= FILE_HISTORY_SCROLL_PREFETCH_PX
        ) {
          void this['loadRecords']({ reset: ![] });
          return;
        }
        this['_isOpen']() &&
          this['_activeSource'] === 'output' &&
          !this['_outputLoading'] &&
          this['_outputHasMore'] &&
          this['_outputLoaded'] &&
          value41 <= FILE_HISTORY_SCROLL_PREFETCH_PX &&
          void this['loadOutputFiles']({ dir: this['_outputDir'], reset: ![] });
      },
      { passive: !![] },
    );
  }
  ['_bindMarqueeSelection']() {
    if (!this['contentEl']) return;
    this['contentEl']['addEventListener']('pointerdown', (event4) => {
      if (event4['button'] !== 0x0 || !this['_isOpen']()) return;
      if (event4['target']['closest']('[data-file-action],\x20.v2-file-history-resize-handle')) return;
      const startX = event4['clientX'],
        startY = event4['clientY'],
        enabled5 = { startX: startX, startY: startY, active: ![], marqueeEl: null };
      this['_selectionDrag'] = enabled5;
      const value42 = (event5) => {
          if (this['_selectionDrag'] !== enabled5) return;
          const value43 = event5['clientX'] - startX,
            value44 = event5['clientY'] - startY;
          if (!enabled5['active'] && Math['hypot'](value43, value44) < 0x6) return;
          !enabled5['active'] &&
            ((enabled5['active'] = !![]),
            (enabled5['marqueeEl'] = document['createElement']('div')),
            (enabled5['marqueeEl']['className'] = 'v2-file-history-marquee'),
            this['contentEl']['appendChild'](enabled5['marqueeEl']));
          const box5 = this['contentEl']['getBoundingClientRect'](),
            left =
              Math['min'](startX, event5['clientX']) -
              box5['left'] +
              this['contentEl']['scrollLeft'],
            top =
              Math['min'](startY, event5['clientY']) -
              box5['top'] +
              this['contentEl']['scrollTop'],
            width3 = Math['abs'](event5['clientX'] - startX),
            height3 = Math['abs'](event5['clientY'] - startY);
          Object['assign'](enabled5['marqueeEl']['style'], {
            left: left + 'px',
            top: top + 'px',
            width: width3 + 'px',
            height: height3 + 'px',
          });
        },
        value45 = () => {
          (window['removeEventListener']('pointermove', value42, !![]),
            window['removeEventListener']('pointerup', value45, !![]),
            window['removeEventListener']('pointercancel', value45, !![]));
          if (this['_selectionDrag'] !== enabled5) return;
          this['_selectionDrag'] = null;
          if (!enabled5['active'] || !enabled5['marqueeEl']) return;
          const box6 = enabled5['marqueeEl']['getBoundingClientRect'](),
            value46 = Array['from'](this['contentEl']['querySelectorAll']('.v2-file-history-card'))
              ['filter']((el5) => {
                const box7 = el5['getBoundingClientRect']();
                return !(
                  box7['right'] < box6['left'] ||
                  box7['left'] > box6['right'] ||
                  box7['bottom'] < box6['top'] ||
                  box7['top'] > box6['bottom']
                );
              })
              ['map']((el6) => String(el6['dataset']['recordId'] || ''))
              ['filter'](Boolean);
          (enabled5['marqueeEl']['remove'](),
            (this['_suppressNextClick'] = !![]),
            this['_setSelection'](value46));
        };
      (window['addEventListener']('pointermove', value42, !![]),
        window['addEventListener']('pointerup', value45, !![]),
        window['addEventListener']('pointercancel', value45, !![]));
    });
  }
  ['_bindContextMenu']() {
    if (!this['panel']) return;
    this['panel']['addEventListener']('contextmenu', (event6) => {
      const ownerElement = event6['target']['closest']('.v2-file-history-card');
      if (!ownerElement || !this['panel']['contains'](ownerElement)) return;
      (event6['preventDefault'](), event6['stopPropagation']());
      const value47 = String(ownerElement['dataset']['recordId'] || ''),
        value48 = this['_findVisibleRecordById'](value47);
      if (!isFileManagerActionableRecord(value48)) return;
      if (!this['_selectedRecordIds']['has'](value47)) this['_setSelection']([value47]);
      const value49 = this['_getSelectedRecords'](),
        list5 = this['_buildContextMenuItems'](value49);
      if (list5['length'] === 0x0) return;
      showContextMenu(event6['clientX'], event6['clientY'], list5, {
        ensureItemIcons: !![],
        includeNodePicker: ![],
        ownerElement: ownerElement,
        ownerRoot: this['panel'],
        sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY,
      });
    });
  }
  ['_bindDoubleClickToCanvas']() {
    if (!this['panel']) return;
    this['panel']['addEventListener']('dblclick', (event7) => {
      const el7 = event7['target']['closest']('.v2-file-history-card');
      if (!el7 || !this['panel']['contains'](el7)) return;
      const value50 = String(el7['dataset']['recordId'] || ''),
        value51 = this['_findVisibleRecordById'](value50);
      if (!isFileManagerActionableRecord(value51)) return;
      (event7['preventDefault'](), event7['stopPropagation']());
      const value52 =
        this['_selectedRecordIds']['has'](value50) && this['_getSelectedRecords']()['length'] > 0x0
          ? this['_getSelectedRecords']()
          : [value51];
      this['restoreRecordsToCanvas'](value52);
    });
  }
  ['_getSelectedRecords']() {
    const list6 = this['_visibleRecords'](),
      map2 = this['_selectedRecordIds'];
    return list6['filter']((value53) => map2['has'](String(value53?.['id'] || '')));
  }
  ['_buildContextMenuItems'](value54) {
    const records = (Array['isArray'](value54) ? value54 : [])['filter'](isFileManagerActionableRecord),
      value55 = records[0x0] || null,
      value56 = records['length'] === 0x1 ? resolveRecordLocalPath(value55) : '',
      fileManagerMenuActions = getFileManagerMenuActions({
        records: records,
        canRevealInFolder: canShowItemInFolder(value56),
        getMediaKind: getRecordMediaKind,
        isActionableRecord: isFileManagerActionableRecord,
      }),
      list7 = [];
    for (const value57 of fileManagerMenuActions) {
      if (value57 === 'delete' && list7['length'] > 0x0) list7['push']('sep');
      if (value57 === 'add-to-canvas')
        list7['push']({
          label:
            records['length'] > 0x1
              ? fileManagerText('contextMenu.addManyToCanvas', { count: records['length'] })
              : fileManagerText('contextMenu.addToCanvas'),
          icon: 'add-to-canvas',
          shortcutActionId: 'context-history-add-to-canvas',
          action: () => this['restoreRecordsToCanvas'](records),
        });
      else {
        if (value57 === 'fullscreen')
          list7['push']({
            label: fileManagerText('contextMenu.fullscreen'),
            icon: 'fullscreen',
            shortcutActionId: 'context-history-fullscreen',
            action: () => this['_openRecordPreview'](value55),
          });
        else {
          if (value57 === 'reveal')
            list7['push']({
              label: fileManagerText('contextMenu.reveal'),
              icon: 'reveal',
              shortcutActionId: 'context-history-reveal',
              action: () => this['_showRecordInFolder'](value55),
            });
          else
            value57 === 'delete' &&
              list7['push']({
                label:
                  records['length'] > 0x1
                    ? fileManagerText('contextMenu.deleteMany', { count: records['length'] })
                    : fileManagerText('contextMenu.delete'),
                icon: 'delete',
                danger: !![],
                shortcutActionId: 'context-history-delete',
                action: () => void this['_deleteRecords'](records),
              });
        }
      }
    }
    return list7;
  }
  ['_clampContentScroll']() {
    if (!this['contentEl']) return;
    const count6 = Math['max'](0x0, this['contentEl']['scrollHeight'] - this['contentEl']['clientHeight']);
    if (count6 <= 0x0) {
      this['contentEl']['scrollTop'] = 0x0;
      return;
    }
    this['contentEl']['scrollTop'] > count6 && (this['contentEl']['scrollTop'] = count6);
  }
  ['_bindResizeHandle']() {
    if (!this['panel'] || !this['resizeHandleEl']) return;
    const value58 = () => {
        if (!this['_resizeState']) return;
        (window['removeEventListener']('pointermove', value59, !![]),
          window['removeEventListener']('pointerup', value58, !![]),
          window['removeEventListener']('pointercancel', value58, !![]),
          this['panel']['classList']['remove']('is-resizing'),
          (this['_resizeState'] = null));
      },
      value59 = (event8) => {
        if (!this['_resizeState']) return;
        event8['preventDefault']();
        const value60 = Math['max'](
            FILE_PANEL_RESIZE['minWidth'],
            window['innerWidth'] - this['_resizeState']['left'] - FILE_PANEL_RESIZE['maxViewportGap'],
          ),
          value61 = Math['max'](
            FILE_PANEL_RESIZE['minWidth'],
            Math['min'](
              value60,
              this['_resizeState']['startWidth'] + event8['clientX'] - this['_resizeState']['startX'],
            ),
          );
        ((this['_panelWidth'] = Math['round'](value61)),
          (this['panel']['style']['width'] = this['_panelWidth'] + 'px'),
          this['_relayoutMasonry'](),
          this['_clampContentScroll']());
      };
    this['resizeHandleEl']['addEventListener']('pointerdown', (startX2) => {
      if (startX2['button'] !== 0x0) return;
      (startX2['preventDefault'](), startX2['stopPropagation']());
      const startWidth = this['panel']['getBoundingClientRect']();
      ((this['_resizeState'] = {
        startX: startX2['clientX'],
        startWidth: startWidth['width'] || FILE_PANEL_RESIZE['defaultWidth'],
        left: startWidth['left'],
      }),
        this['panel']['classList']['add']('is-resizing'),
        this['resizeHandleEl']['setPointerCapture']?.(startX2['pointerId']),
        window['addEventListener']('pointermove', value59, !![]),
        window['addEventListener']('pointerup', value58, !![]),
        window['addEventListener']('pointercancel', value58, !![]));
    });
  }
  ['_bindLocaleChange']() {
    this['_unsubscribeLocale'] = onLocaleChange(() => {
      (this['_syncPanelStaticTexts'](), this['render']());
    });
  }
  ['_syncPanelStaticTexts']() {
    this['panel']?.['setAttribute']('aria-label', fileManagerText('panel.ariaLabel'));
    if (this['titleEl']) this['titleEl']['textContent'] = fileManagerText('panel.title');
    (this['sourceTabsEl']?.['setAttribute']('aria-label', fileManagerText('panel.sourceTabsAria')),
      this['filterEl']?.['setAttribute']('aria-label', fileManagerText('panel.filtersAria')),
      this['orderEl']?.['setAttribute']('aria-label', fileManagerText('panel.orderAria')));
  }
  ['_bindButton']() {
    const button = document['getElementById']('btnFiles');
    if (!button) return;
    const open = () => {
      this['show']();
    };
    registerSidebarSubmenu({
      key: FILE_MANAGER_SIDEBAR_KEY,
      button: button,
      panel: this['panel'],
      open: open,
      close: () => this['hide'](),
      isOpen: () => this['panel']['classList']['contains']('show'),
      ignorePointerDown: (value62) => this['_shouldKeepOpenForExternalPointerDown'](value62),
    });
  }
  ['_shouldKeepOpenForExternalPointerDown'](event9) {
    const el8 = event9?.['target'];
    if (!el8?.['closest']) return ![];
    return !!el8['closest'](FILE_MANAGER_KEEP_OPEN_SELECTOR);
  }
  ['_bindGenerationEvents']() {
    window['addEventListener'](GENERATION_HISTORY_EVENT, (value63) => {
      const value64 = value63?.['detail'] || {},
        nodeData = { ...(value64['nodeData'] || {}) };
      !String(nodeData['id'] || '')['trim']() &&
        String(value64['sourceNodeId'] || '')['trim']() &&
        (nodeData['id'] = String(value64['sourceNodeId'])['trim']());
      const generationHistoryAssetsFromNode = buildGenerationHistoryAssetsFromNode({
        images: Array['isArray'](value64['images']) ? value64['images'] : [],
        videos: Array['isArray'](value64['videos']) ? value64['videos'] : [],
        audios: Array['isArray'](value64['audios']) ? value64['audios'] : [],
        nodeData: nodeData,
        projectId: this['_getCurrentProjectId'](),
        canvasId: this['_getCurrentCanvasId'](),
        generationStartedAt:
          Number(value64['startedAt'] || nodeData['generationStartTime'] || 0x0) || undefined,
        now: Number(value64['createdAt'] || Date['now']()) || Date['now'](),
      });
      void this['_saveRecords'](generationHistoryAssetsFromNode, { captureSource: 'event' });
    });
  }
  ['_resetPageState']() {
    ((this['records'] = []),
      (this['_recordsLoaded'] = ![]),
      (this['_recordsDirty'] = ![]),
      (this['_nextOffset'] = 0x0),
      (this['_hasMore'] = !![]),
      (this['_totalRecords'] = 0x0));
    if (this['contentEl']) this['contentEl']['scrollTop'] = 0x0;
  }
  ['_resetOutputPageState']() {
    ((this['outputItems'] = []),
      (this['_outputLoaded'] = ![]),
      (this['_outputNextOffset'] = 0x0),
      (this['_outputHasMore'] = !![]),
      (this['_outputTotalItems'] = 0x0));
    if (this['contentEl']) this['contentEl']['scrollTop'] = 0x0;
  }
  ['_normalizeOutputPageResponse'](nextOffset, value65) {
    const items = Array['isArray'](nextOffset?.['items']) ? nextOffset['items'] : [];
    return {
      items: items,
      total: Number(nextOffset?.['total'] || 0x0) || items['length'],
      nextOffset:
        nextOffset?.['nextOffset'] === null || nextOffset?.['nextOffset'] === undefined
          ? null
          : Number(nextOffset['nextOffset']) || Number(value65) + items['length'],
      hasMore: Boolean(nextOffset?.['hasMore']),
    };
  }
  async ['loadOutputFiles']({ dir: dir = this['_outputDir'], reset: reset = !![] } = {}) {
    if (this['_outputLoading'] && !reset) return;
    const dir4 = String(dir || '')['trim'](),
      value66 = dir4 !== String(this['_outputDir'] || '')['trim']();
    if (reset || value66) this['_resetOutputPageState']();
    else {
      if (!this['_outputHasMore'] && this['_outputLoaded']) return;
    }
    ((this['_activeSource'] = 'output'), (this['_outputLoading'] = !![]));
    const value67 = ++this['_outputLoadToken'];
    if (this['_isOpen']()) this['render']();
    const offset = reset || value66 ? 0x0 : this['_outputNextOffset'];
    try {
      const fetchOutputFilesFromServer2 = await fetchOutputFilesFromServer({
        dir: dir4,
        order: this['_sortOrder'],
        offset: offset,
        limit: FILE_OUTPUT_PAGE_SIZE,
      });
      if (value67 !== this['_outputLoadToken']) return;
      const args2 = this['_normalizeOutputPageResponse'](fetchOutputFilesFromServer2, offset);
      if (offset === 0x0) this['outputItems'] = args2['items'];
      else {
        const map3 = new Set(
          this['outputItems']['map']((value68) => getOutputRecordIdForItem(value68)),
        );
        this['outputItems'] = [
          ...this['outputItems'],
          ...args2['items']['filter']((value69) => {
            const outputRecordIdForItem = getOutputRecordIdForItem(value69);
            if (!outputRecordIdForItem || map3['has'](outputRecordIdForItem)) return ![];
            return (map3['add'](outputRecordIdForItem), !![]);
          }),
        ];
      }
      ((this['_outputDir'] = String(fetchOutputFilesFromServer2?.['dir'] || '')['trim']()),
        (this['_outputParent'] = String(fetchOutputFilesFromServer2?.['parent'] || '')['trim']()),
        (this['_outputBreadcrumbs'] =
          Array['isArray'](fetchOutputFilesFromServer2?.['breadcrumbs']) && fetchOutputFilesFromServer2['breadcrumbs']['length'] > 0x0
            ? fetchOutputFilesFromServer2['breadcrumbs']
            : [{ name: 'output', dir: '' }]),
        (this['_outputNextOffset'] =
          args2['nextOffset'] === null || args2['nextOffset'] === undefined
            ? this['outputItems']['length']
            : args2['nextOffset']),
        (this['_outputHasMore'] = args2['hasMore']),
        (this['_outputTotalItems'] = args2['total']),
        (this['_outputLoaded'] = !![]));
    } catch (value70) {
      if (value67 !== this['_outputLoadToken']) return;
      console['error']('[GenerationHistoryFileManager] 加载输出文件夹失败:', value70);
      if (offset === 0x0) this['outputItems'] = [];
      this['_outputLoaded'] = !![];
    } finally {
      if (value67 === this['_outputLoadToken']) {
        this['_outputLoading'] = ![];
        if (this['_isOpen']()) this['render']();
      }
    }
  }
  ['_buildAssetPageParams'](value71) {
    const value72 = {
      kind: 'generation-history',
      projectId: this['_getCurrentProjectId'](),
      offset: Number(value71) || 0x0,
      limit: FILE_HISTORY_PAGE_SIZE,
    };
    this['_activeSource'] === 'current-canvas' && (value72['canvasId'] = this['_getCurrentCanvasId']());
    if (this['_activeFilter'] !== 'all') value72['mediaKind'] = this['_activeFilter'];
    return ((value72['order'] = this['_sortOrder']), value72);
  }
  ['_normalizeAssetsPageResponse'](items2, value73) {
    if (Array['isArray'](items2))
      return {
        items: items2['filter'](isGenerationHistoryAsset),
        total: items2['length'],
        nextOffset: null,
        hasMore: ![],
      };
    const items3 = Array['isArray'](items2?.['items'])
      ? items2['items']['filter'](isGenerationHistoryAsset)
      : [];
    return {
      items: items3,
      total: Number(items2?.['total'] || 0x0) || items3['length'],
      nextOffset:
        items2?.['nextOffset'] === null || items2?.['nextOffset'] === undefined
          ? null
          : Number(items2['nextOffset']) || Number(value73) + items3['length'],
      hasMore: Boolean(items2?.['hasMore']),
    };
  }
  async ['loadRecords']({ backfillAfterLoad: backfillAfterLoad = ![], reset: reset = ![] } = {}) {
    if (this['_loading'] && !reset) return;
    if (reset) this['_resetPageState']();
    if (!this['_hasMore'] && this['_recordsLoaded']) return;
    const value74 = ++this['_loadToken'];
    this['_loading'] = !![];
    if (this['_isOpen']()) this['render']();
    let value75 = ![];
    const count7 = reset ? 0x0 : this['_nextOffset'];
    try {
      const fetchAssetsFromServer2 = await fetchAssetsFromServer(this['_buildAssetPageParams'](count7));
      if (value74 !== this['_loadToken']) return;
      const args3 = this['_normalizeAssetsPageResponse'](fetchAssetsFromServer2, count7),
        value76 =
          count7 === 0x0
            ? args3['items']
            : [
                ...this['records'],
                ...args3['items']['filter'](
                  (value77) =>
                    !this['records']['some'](
                      (value78) => String(value78?.['id'] || '') === String(value77?.['id'] || ''),
                    ),
                ),
              ];
      ((this['records'] = dedupeHistoryRecords(value76)),
        (this['_nextOffset'] =
          args3['nextOffset'] === null || args3['nextOffset'] === undefined
            ? this['records']['length']
            : args3['nextOffset']),
        (this['_hasMore'] = args3['hasMore']),
        (this['_totalRecords'] = args3['total']),
        (this['_recordsLoaded'] = !![]),
        (this['_recordsDirty'] = ![]),
        (value75 = backfillAfterLoad && count7 === 0x0));
    } catch (value79) {
      if (value74 !== this['_loadToken']) return;
      console['error']('[GenerationHistoryFileManager] 加载生成媒体历史失败:', value79);
    } finally {
      if (value74 === this['_loadToken']) {
        this['_loading'] = ![];
        if (this['_isOpen']()) this['render']();
      }
    }
    value74 === this['_loadToken'] &&
      value75 &&
      this['_isOpen']() &&
      void this['_backfillCurrentCanvas']();
  }
  async ['_saveRecords'](value80, { captureSource: captureSource = '' } = {}) {
    const historyCaptureSource = String(captureSource || '')['trim'](),
      list8 = (Array['isArray'](value80) ? value80 : [])['map']((args4) =>
        historyCaptureSource ? { ...args4, historyCaptureSource: historyCaptureSource } : args4,
      ),
      map4 = new Set(),
      list9 = list8['filter']((enabled6) => {
        const enabled7 = String(enabled6?.['resultFingerprint'] || '')['trim'](),
          recordLocalPath = resolveRecordLocalPath(enabled6);
        if (!enabled6?.['id'] || (!enabled7 && !recordLocalPath)) return ![];
        const historyRecordIdentityKey2 = buildHistoryRecordIdentityKey(enabled6);
        if (map4['has'](historyRecordIdentityKey2)) return ![];
        map4['add'](historyRecordIdentityKey2);
        if (this['_savingIds']['has'](enabled6['id'])) return ![];
        if (this['_savingRecordKeys']['has'](historyRecordIdentityKey2)) return ![];
        if (
          historyCaptureSource === 'backfill' &&
          this['records']['some']((value81) =>
            isFileManagerBackfillDuplicate(value81, enabled6, {
              getMediaKind: getRecordMediaKind,
              getLocalPath: resolveRecordLocalPath,
            }),
          )
        )
          return ![];
        return !this['_hasRecord'](enabled6);
      });
    if (list9['length'] === 0x0) return 0x0;
    let count8 = 0x0;
    for (const value82 of list9) {
      const historyRecordIdentityKey3 = buildHistoryRecordIdentityKey(value82);
      this['_savingIds']['add'](value82['id']);
      if (historyRecordIdentityKey3) this['_savingRecordKeys']['add'](historyRecordIdentityKey3);
      try {
        (await saveAssetToServer(value82),
          (this['records'] = dedupeHistoryRecords([
            value82,
            ...this['records']['filter']((value83) => value83['id'] !== value82['id']),
          ])),
          (count8 += 0x1));
      } catch (value84) {
        console['error']('[GenerationHistoryFileManager] 保存生成媒体历史失败:', value84);
      } finally {
        this['_savingIds']['delete'](value82['id']);
        if (historyRecordIdentityKey3) this['_savingRecordKeys']['delete'](historyRecordIdentityKey3);
      }
    }
    if (count8 > 0x0) {
      if (this['_isOpen']()) this['render']();
      else this['_recordsDirty'] = !![];
    }
    return count8;
  }
  async ['_backfillCurrentCanvas']() {
    if (this['_backfillInFlight']) return;
    this['_backfillInFlight'] = !![];
    try {
      const projectId2 = this['_getCurrentProjectId'](),
        canvasId2 = this['_getCurrentCanvasId'](),
        value85 = appStore['getStateRaw']?.()['nodes'] || appStore['getState']()['nodes'] || {},
        list10 = [];
      for (const nodeData2 of Object['values'](value85 || {})) {
        if (!nodeData2) continue;
        const value86 = String(nodeData2['type'] || '');
        if (!['ai-image', 'ai-video', 'ai-audio']['includes'](value86)) continue;
        const images =
            value86 === 'ai-image' && Array['isArray'](nodeData2['images']) ? nodeData2['images'] : [],
          list11 = Array['isArray'](nodeData2['videos']) ? nodeData2['videos'] : [],
          videos =
            value86 === 'ai-video'
              ? list11['length'] > 0x0
                ? list11
                : String(nodeData2['videoUrl'] || nodeData2['localPath'] || '')['trim']()
                  ? [nodeData2]
                  : []
              : [],
          audios =
            value86 === 'ai-audio' &&
            String(nodeData2['audioUrl'] || nodeData2['localPath'] || '')['trim']()
              ? [nodeData2]
              : [];
        if (images['length'] === 0x0 && videos['length'] === 0x0 && audios['length'] === 0x0)
          continue;
        const generationStartedAt = resolveFileManagerBackfillStartedAt(nodeData2);
        list10['push'](
          ...buildGenerationHistoryAssetsFromNode({
            images: images,
            videos: videos,
            audios: audios,
            nodeData: nodeData2,
            projectId: projectId2,
            canvasId: canvasId2,
            generationStartedAt: generationStartedAt,
            now: generationStartedAt,
          }),
        );
      }
      await this['_saveRecords'](list10, { captureSource: 'backfill' });
    } finally {
      this['_backfillInFlight'] = ![];
    }
  }
  ['show']() {
    this['panel']?.['classList']['add']('show');
    this['panel'] &&
      !this['_panelWidth'] &&
      ((this['_panelWidth'] = FILE_PANEL_RESIZE['defaultWidth']),
      (this['panel']['style']['width'] = this['_panelWidth'] + 'px'));
    if (this['_activeSource'] === 'output') {
      !this['_outputLoaded'] && !this['_outputLoading']
        ? void this['loadOutputFiles']({ dir: this['_outputDir'], reset: !![] })
        : this['render']();
      return;
    }
    if (!this['_recordsLoaded'] || this['_recordsDirty']) {
      if (!this['_loading']) void this['loadRecords']({ backfillAfterLoad: !![], reset: !![] });
      else this['render']();
      return;
    }
    (void this['_backfillCurrentCanvas'](), (this['_recordsDirty'] = ![]), this['render']());
  }
  ['hide']() {
    (this['_releaseVideoUiResources'](),
      this['panel']?.['classList']['remove']('show'),
      document['getElementById']('btnFiles')?.['classList']['remove']('active'));
  }
  ['render']() {
    if (!this['contentEl'] || !this['_isOpen']()) return;
    (this['_releaseVideoUiResources'](),
      this['_renderSourceTabs'](),
      this['_renderFilters'](),
      this['_renderOrderControls'](),
      this['_renderSubtitle'](),
      this['_renderBreadcrumbs'](),
      this['contentEl']['replaceChildren']());
    if (
      (isHistorySource(this['_activeSource']) && this['_loading'] && !this['_recordsLoaded']) ||
      (this['_activeSource'] === 'output' && this['_outputLoading'] && !this['_outputLoaded'])
    ) {
      const el9 = document['createElement']('div');
      ((el9['className'] = 'v2-file-history-empty'),
        (el9['textContent'] = fileManagerText('loading.initial')),
        this['contentEl']['appendChild'](el9));
      return;
    }
    const list12 = this['_visibleRecords']();
    this['_pruneSelectionToVisibleRecords']();
    if (list12['length'] === 0x0) {
      const el10 = document['createElement']('div');
      ((el10['className'] = 'v2-file-history-empty'),
        (el10['textContent'] =
          this['_activeFilter'] === 'all'
            ? this['_activeSource'] === 'output'
              ? fileManagerText('empty.output')
              : this['_activeSource'] === 'current-canvas'
                ? fileManagerText('empty.currentCanvas')
                : fileManagerText('empty.history')
            : fileManagerText('empty.filtered', { label: getMediaLabel(this['_activeFilter']) })),
        this['contentEl']['appendChild'](el10),
        this['_clampContentScroll']());
      return;
    }
    this['_renderMasonry'](list12);
    if (
      (isHistorySource(this['_activeSource']) && this['_loading'] && this['_recordsLoaded']) ||
      (this['_activeSource'] === 'output' && this['_outputLoading'] && this['_outputLoaded'])
    ) {
      const el11 = document['createElement']('div');
      ((el11['className'] = 'v2-file-history-page-status'),
        (el11['textContent'] = fileManagerText('loading.more')),
        this['contentEl']['appendChild'](el11));
    }
    this['_clampContentScroll']();
  }
  ['_renderSourceTabs']() {
    if (!this['sourceTabsEl']) return;
    const el12 = document['createDocumentFragment']();
    for (const event10 of FILE_SOURCES) {
      const el13 = document['createElement']('button');
      ((el13['type'] = 'button'),
        (el13['className'] = 'v2-file-history-source-tab'),
        (el13['dataset']['fileAction'] = 'source'),
        (el13['dataset']['source'] = event10['key']),
        el13['setAttribute']('role', 'tab'),
        el13['setAttribute'](
          'aria-selected',
          this['_activeSource'] === event10['key'] ? 'true' : 'false',
        ),
        el13['classList']['toggle']('is-active', this['_activeSource'] === event10['key']),
        (el13['textContent'] = fileManagerText(event10['labelKey'])),
        el12['appendChild'](el13));
    }
    this['sourceTabsEl']['replaceChildren'](el12);
  }
  ['_renderOrderControls']() {
    if (!this['orderEl']) return;
    const el14 = document['createElement']('button');
    ((el14['type'] = 'button'),
      (el14['className'] = 'v2-file-history-order-btn'),
      (el14['dataset']['fileAction'] = 'order'),
      (el14['dataset']['order'] = this['_sortOrder']),
      el14['setAttribute'](
        'aria-label',
        this['_sortOrder'] === 'asc' ? fileManagerText('sort.ascAria') : fileManagerText('sort.descAria'),
      ),
      (el14['title'] =
        this['_sortOrder'] === 'asc' ? fileManagerText('sort.ascTitle') : fileManagerText('sort.descTitle')),
      (el14['innerHTML'] =
        '\n      <svg viewBox="0 0 24 24" aria-hidden="true" class="' +
        (this['_sortOrder'] === 'asc' ? 'is-asc' : 'is-desc') +
        '">\n        <path d="M8 5v14" />\n        <path d="M4.5 8.5 8 5l3.5 3.5" />\n        <path d="M16 19V5" />\n        <path d="m12.5 15.5 3.5 3.5 3.5-3.5" />\n      </svg>\n    '),
      this['orderEl']['replaceChildren'](el14));
  }
  ['_renderSubtitle']() {
    if (!this['subtitleEl']) return;
    this['subtitleEl']['textContent'] =
      this['_activeSource'] === 'output'
        ? fileManagerText('subtitle.output')
        : this['_activeSource'] === 'current-canvas'
          ? fileManagerText('subtitle.currentCanvas')
          : fileManagerText('subtitle.history');
  }
  ['_renderBreadcrumbs']() {
    if (!this['breadcrumbsEl']) return;
    (this['breadcrumbsEl']['replaceChildren'](),
      this['breadcrumbsEl']['classList']['toggle']('is-visible', this['_activeSource'] === 'output'));
    if (this['_activeSource'] !== 'output') return;
    const value87 = Array['isArray'](this['_outputBreadcrumbs'])
      ? this['_outputBreadcrumbs']
      : [{ name: 'output', dir: '' }];
    if (this['_outputDir']) {
      const el15 = document['createElement']('button');
      ((el15['type'] = 'button'),
        (el15['className'] = 'v2-file-history-crumb'),
        (el15['dataset']['fileAction'] = 'output-dir'),
        (el15['dataset']['dir'] = this['_outputParent'] || ''),
        (el15['textContent'] = fileManagerText('breadcrumbs.up')),
        this['breadcrumbsEl']['appendChild'](el15));
    }
    for (const error4 of value87) {
      const el16 = document['createElement']('button');
      ((el16['type'] = 'button'),
        (el16['className'] = 'v2-file-history-crumb'),
        (el16['dataset']['fileAction'] = 'output-dir'),
        (el16['dataset']['dir'] = String(error4?.['dir'] || '')),
        (el16['textContent'] = String(error4?.['name'] || 'output')),
        this['breadcrumbsEl']['appendChild'](el16));
    }
  }
  ['_getMasonryMetrics']() {
    if (!this['contentEl']) return { contentWidth: 0x1 };
    const value88 = window['getComputedStyle'](this['contentEl']),
      value89 =
        (Number['parseFloat'](value88['paddingLeft']) || 0x0) +
        (Number['parseFloat'](value88['paddingRight']) || 0x0);
    return { contentWidth: Math['max'](0x1, (this['contentEl']['clientWidth'] || 0x1) - value89) };
  }
  ['_getRecordDisplaySize'](value90, value91) {
    const recordMediaKind3 = getRecordMediaKind(value90),
      { width: width4, height: height4 } = resolveRecordSize(value90, recordMediaKind3),
      value92 = Math['max'](0x1, width4),
      value93 = Math['max'](0x1, height4),
      value94 = Math['min'](value92, value93),
      value95 = Math['max'](value92, value93),
      value96 = FILE_MASONRY['fixedShortSide'],
      value97 = Math['min'](
        value96 / value94,
        FILE_MASONRY['maxLongSide'] / value95,
        value92 > value91 ? value91 / value92 : 0x1,
      );
    return {
      width: Math['max'](0x1, Math['round'](value92 * value97)),
      height: Math['max'](0x1, Math['round'](value93 * value97)),
    };
  }
  ['_findMasonrySlot'](value98, box8, value99) {
    const value100 = FILE_MASONRY['gap'],
      value101 = Math['max'](0x0, value99 - box8['width']),
      list13 = [];
    for (let value102 = 0x0; value102 <= value101; value102 += FILE_MASONRY['placementStep']) {
      list13['push'](value102);
    }
    if (list13[list13['length'] - 0x1] !== value101) list13['push'](value101);
    let box9 = null;
    for (const x2 of list13) {
      let y2 = 0x0;
      for (const box10 of value98) {
        const value103 =
          x2 < box10['x'] + box10['width'] + value100 &&
          x2 + box8['width'] + value100 > box10['x'];
        if (value103) y2 = Math['max'](y2, box10['y'] + box10['height'] + value100);
      }
      (!box9 ||
        y2 < box9['y'] ||
        (y2 === box9['y'] && x2 < box9['x'])) &&
        (box9 = { x: x2, y: y2 });
    }
    return box9 || { x: 0x0, y: 0x0 };
  }
  ['_renderMasonry'](value104) {
    const { contentWidth: contentWidth } = this['_getMasonryMetrics'](),
      el17 = document['createElement']('div');
    ((el17['className'] = 'v2-file-history-masonry-canvas'),
      this['contentEl']['appendChild'](el17));
    const list14 = [];
    let value105 = 0x0;
    for (const value106 of value104) {
      const box11 = this['_getRecordDisplaySize'](value106, contentWidth),
        box12 = this['_findMasonrySlot'](list14, box11, contentWidth),
        el18 = this['_renderCard'](value106);
      ((el18['style']['left'] = box12['x'] + 'px'),
        (el18['style']['top'] = box12['y'] + 'px'),
        (el18['style']['width'] = box11['width'] + 'px'),
        (el18['style']['height'] = box11['height'] + 'px'),
        el17['appendChild'](el18),
        this['_observeVideoThumbnail'](value106, el18),
        list14['push']({ ...box12, ...box11 }),
        (value105 = Math['max'](value105, box12['y'] + box11['height'])));
    }
    el17['style']['height'] = value105 + 'px';
  }
  ['_observeVideoThumbnail'](value107, el19) {
    if (getRecordMediaKind(value107) !== GENERATION_HISTORY_MEDIA_KINDS['VIDEO']) return;
    const generationHistoryVideoPresentation = resolveGenerationHistoryVideoPresentation(value107);
    if (!generationHistoryVideoPresentation['needsBackfill']) return;
    const value108 = () => {
        if (!el19?.['isConnected'] || !this['_isOpen']()) return;
        void this['_ensureVideoThumbnailForRecord'](value107)['then']((enabled8) => {
          if (!enabled8 || !el19?.['isConnected']) return;
          if (String(el19['dataset']['recordId'] || '') !== String(value107?.['id'] || '')) return;
          const generationHistoryVideoPresentation2 = resolveGenerationHistoryVideoPresentation(enabled8);
          this['_setVideoPosterOnCard'](el19, generationHistoryVideoPresentation2['posterSrc']);
        });
      },
      handler = window['IntersectionObserver'];
    if (typeof handler !== 'function') {
      queueMicrotask(value108);
      return;
    }
    (!this['_videoThumbnailObserver'] &&
      (this['_videoThumbnailObserver'] = new handler(
        (value109) => {
          for (const event11 of value109) {
            if (!event11?.['isIntersecting']) continue;
            const el20 = event11['target'],
              enabled9 = this['_videoThumbnailTargets']['get'](el20);
            this['_videoThumbnailObserver']?.['unobserve'](el20);
            if (!enabled9 || !el20?.['isConnected'] || !this['_isOpen']()) continue;
            void this['_ensureVideoThumbnailForRecord'](enabled9)['then']((enabled10) => {
              if (!enabled10 || !el20?.['isConnected']) return;
              if (String(el20['dataset']['recordId'] || '') !== String(enabled9?.['id'] || '')) return;
              const generationHistoryVideoPresentation3 = resolveGenerationHistoryVideoPresentation(enabled10);
              this['_setVideoPosterOnCard'](el20, generationHistoryVideoPresentation3['posterSrc']);
            });
          }
        },
        { root: this['contentEl'], rootMargin: '240px 0px' },
      )),
      this['_videoThumbnailTargets']['set'](el19, value107),
      this['_videoThumbnailObserver']['observe'](el19));
  }
  ['_ensureVideoThumbnailForRecord'](state7) {
    const videoUrl = resolveGenerationHistoryVideoPresentation(state7);
    if (!videoUrl['needsBackfill']) return Promise['resolve'](state7);
    const value110 = String(state7?.['id'] || '') + ':' + videoUrl['mediaSrc'],
      value111 = this['_videoThumbnailBackfills']['get'](value110);
    if (value111) return value111;
    const args5 = Array['isArray'](state7?.['nodes']) ? state7['nodes'][0x0] || {} : {},
      value112 = {
        ...args5,
        localPath: resolveRecordLocalPath(state7),
        videoUrl: videoUrl['mediaSrc'],
      };
    let value113;
    return (
      (value113 = this['_videoThumbnailQueue']
        ['enqueue'](videoUrl['mediaSrc'], () => ensureVideoResultThumbnail(value112))
        ['then']((value114) => {
          const generationHistoryVideoThumbnail = applyGenerationHistoryVideoThumbnail(state7, value114);
          return (
            this['_rememberVideoThumbnail'](generationHistoryVideoThumbnail, state7),
            void this['_persistVideoThumbnail'](generationHistoryVideoThumbnail, state7),
            generationHistoryVideoThumbnail
          );
        })
        ['catch']((value115) => {
          return (
            console['warn']('[GenerationHistoryFileManager] video thumbnail backfill failed', value115),
            null
          );
        })
        ['finally'](() => {
          this['_videoThumbnailBackfills']['get'](value110) === value113 &&
            this['_videoThumbnailBackfills']['delete'](value110);
        })),
      this['_videoThumbnailBackfills']['set'](value110, value113),
      value113
    );
  }
  ['_rememberVideoThumbnail'](state8, value116) {
    const value117 = String(value116?.['id'] || '');
    if (value116?.['outputItem']) {
      const value118 = Array['isArray'](state8?.['nodes']) ? state8['nodes'][0x0] || {} : {},
        thumbLocalPath2 = normalizeLocalPath(value118?.['thumbLocalPath']);
      if (!thumbLocalPath2) return;
      this['outputItems'] = (Array['isArray'](this['outputItems']) ? this['outputItems'] : [])['map'](
        (args6) =>
          getOutputRecordIdForItem(args6) === value117
            ? { ...args6, thumbLocalPath: thumbLocalPath2 }
            : args6,
      );
      return;
    }
    this['records'] = (Array['isArray'](this['records']) ? this['records'] : [])['map']((value119) =>
      String(value119?.['id'] || '') === value117 ? state8 : value119,
    );
  }
  async ['_persistVideoThumbnail'](state9, value120) {
    try {
      if (value120?.['outputItem']) {
        const value121 = Array['isArray'](state9?.['nodes']) ? state9['nodes'][0x0] || {} : {},
          localPath2 = resolveRecordLocalPath(value120),
          thumbLocalPath3 = normalizeLocalPath(value121?.['thumbLocalPath']);
        if (!localPath2 || !thumbLocalPath3) return;
        await saveOutputVideoThumbnailToServer({ localPath: localPath2, thumbLocalPath: thumbLocalPath3 });
        return;
      }
      await saveAssetToServer(state9);
    } catch (value122) {
      console['warn']('[GenerationHistoryFileManager] video thumbnail persistence failed', value122);
    }
  }
  ['_releaseVideoUiResources']() {
    (this['_videoThumbnailObserver']?.['disconnect'](),
      (this['_videoThumbnailObserver'] = null),
      (this['_videoThumbnailTargets'] = new WeakMap()));
    for (const run of this['_mediaPreviewDisposers']) run();
    this['_mediaPreviewDisposers']['clear']();
  }
  ['_relayoutMasonry']() {
    if (!this['contentEl'] || !this['_isOpen']()) return ![];
    const el21 = this['contentEl']['querySelector']('.v2-file-history-masonry-canvas');
    if (!el21) return (this['render'](), ![]);
    const list15 = this['_visibleRecords'](),
      map5 = new Map(
        Array['from'](el21['querySelectorAll']('.v2-file-history-card'))['map']((el22) => [
          String(el22['dataset']['recordId'] || ''),
          el22,
        ]),
      );
    if (list15['length'] !== map5['size']) return (this['render'](), ![]);
    const { contentWidth: contentWidth2 } = this['_getMasonryMetrics'](),
      list16 = [];
    let value123 = 0x0;
    for (const value124 of list15) {
      const value125 = String(value124?.['id'] || ''),
        el23 = map5['get'](value125);
      if (!el23) return (this['render'](), ![]);
      const box13 = this['_getRecordDisplaySize'](value124, contentWidth2),
        box14 = this['_findMasonrySlot'](list16, box13, contentWidth2);
      ((el23['style']['left'] = box14['x'] + 'px'),
        (el23['style']['top'] = box14['y'] + 'px'),
        (el23['style']['width'] = box13['width'] + 'px'),
        (el23['style']['height'] = box13['height'] + 'px'),
        list16['push']({ ...box14, ...box13 }),
        (value123 = Math['max'](value123, box14['y'] + box13['height'])));
    }
    return ((el21['style']['height'] = value123 + 'px'), !![]);
  }
  ['_renderFilters']() {
    if (!this['filterEl']) return;
    const map6 = new Map(
        Array['from'](this['filterEl']['querySelectorAll']('.v2-file-history-filter'))['map']((el24) => [
          el24['dataset']['filter'] || '',
          el24,
        ]),
      ),
      el25 = document['createDocumentFragment']();
    for (const event12 of FILE_FILTERS) {
      const el26 = map6['get'](event12['key']) || document['createElement']('button');
      (!el26['dataset']['filter'] &&
        ((el26['type'] = 'button'),
        (el26['className'] = 'v2-file-history-filter'),
        (el26['dataset']['fileAction'] = 'filter'),
        (el26['dataset']['filter'] = event12['key'])),
        el26['setAttribute']('role', 'tab'),
        el26['setAttribute'](
          'aria-selected',
          this['_activeFilter'] === event12['key'] ? 'true' : 'false',
        ),
        el26['classList']['toggle']('is-active', this['_activeFilter'] === event12['key']),
        (el26['textContent'] = fileManagerText(event12['labelKey'])),
        el25['appendChild'](el26));
    }
    this['filterEl']['replaceChildren'](el25);
  }
  ['_renderCard'](value126) {
    const el27 = document['createElement']('div');
    ((el27['className'] = 'v2-file-history-card'),
      (el27['dataset']['recordId'] = String(value126?.['id'] || '')));
    const recordMediaKind4 = getRecordMediaKind(value126);
    ((el27['dataset']['mediaKind'] = recordMediaKind4),
      el27['classList']['toggle'](
        'is-selected',
        this['_selectedRecordIds']['has'](String(value126?.['id'] || '')),
      ));
    const el28 = document['createElement']('div');
    el28['className'] = 'v2-file-history-thumb\x20is-' + recordMediaKind4;
    const recordAspect = resolveRecordAspect(value126, recordMediaKind4);
    if (recordAspect) el28['style']['aspectRatio'] = recordAspect;
    const value127 =
        recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS['VIDEO']
          ? resolveGenerationHistoryVideoPresentation(value126)
          : null,
      value128 = value127 ? value127['posterSrc'] : resolveThumbSrc(value126),
      value129 = value127?.['mediaSrc'] || resolveMediaSrc(value126);
    if (recordMediaKind4 === 'folder') el28['appendChild'](this['_renderFolderThumb'](value126));
    else {
      if (recordMediaKind4 === 'file') el28['appendChild'](this['_renderFileThumb'](value126));
      else {
        if (recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS['VIDEO']) {
          ((el27['dataset']['videoMediaSrc'] = value129),
            (el27['dataset']['videoPosterSrc'] = value128));
          value128
            ? el28['appendChild'](this['_createVideoPosterImage'](value128))
            : el28['appendChild'](this['_renderVideoPosterPlaceholder']());
          if (value129) el28['appendChild'](this['_renderVideoPreviewOverlay']());
        } else {
          if (recordMediaKind4 === GENERATION_HISTORY_MEDIA_KINDS['AUDIO'])
            el28['appendChild'](this['_renderAudioThumb'](value129));
          else {
            if (value128) {
              const value130 = document['createElement']('img');
              ((value130['src'] = value128),
                (value130['alt'] = fileManagerText('alt.imageHistory')),
                (value130['draggable'] = ![]),
                (value130['decoding'] = 'async'),
                (value130['loading'] = 'lazy'),
                el28['appendChild'](value130));
            }
          }
        }
      }
    }
    return (
      el27['appendChild'](el28),
      this['_bindHoverPreview'](el27, recordMediaKind4, value129),
      el27
    );
  }
  ['_bindHoverPreview'](el29, value131, value132 = '') {
    if (!el29) return;
    if (value131 === GENERATION_HISTORY_MEDIA_KINDS['VIDEO']) {
      const el30 = el29['querySelector']('.v2-file-history-video-progress-fill'),
        enabled11 = String(value132 || el29['dataset']['videoMediaSrc'] || '')['trim']();
      if (!enabled11) return;
      let enabled12 = null;
      const run2 = () => {
          if (el30) el30['style']['transform'] = 'scaleX(0)';
        },
        value133 = () => {
          if (!el30 || !enabled12) return;
          const count9 = Number(enabled12['duration'] || 0x0),
            value134 = Number(enabled12['currentTime'] || 0x0),
            value135 = count9 > 0x0 ? Math['min'](Math['max'](value134 / count9, 0x0), 0x1) : 0x0;
          el30['style']['transform'] = 'scaleX(' + value135 + ')';
        },
        handler2 = () => {
          if (!enabled12) return;
          const el31 = enabled12;
          ((enabled12 = null),
            el31['removeEventListener']('timeupdate', value133),
            el31['removeEventListener']('loadedmetadata', value133),
            el31['pause']());
          try {
            el31['currentTime'] = 0x0;
          } catch {}
          (el31['removeAttribute']('src'), el31['load']?.(), el31['remove']());
        },
        value136 = () => {
          if (enabled12) return;
          const el32 = el29['querySelector']('.v2-file-history-thumb');
          if (!el32) return;
          const el33 = document['createElement']('video');
          ((el33['className'] = 'v2-file-history-hover-video'), (el33['src'] = enabled11));
          const value137 = String(el29['dataset']['videoPosterSrc'] || '')['trim']();
          if (value137) el33['poster'] = value137;
          ((el33['muted'] = ![]),
            (el33['volume'] = 0.72),
            (el33['loop'] = !![]),
            (el33['playsInline'] = !![]),
            (el33['preload'] = 'metadata'),
            (el33['draggable'] = ![]),
            el33['addEventListener']('timeupdate', value133),
            el33['addEventListener']('loadedmetadata', value133));
          const value138 = el32['querySelector']('.v2-file-history-video-preview-overlay');
          (el32['insertBefore'](el33, value138 || null),
            (enabled12 = el33),
            el29['classList']['add']('is-preview-playing'));
          const promise = el33['play']();
          promise &&
            typeof promise['catch'] === 'function' &&
            promise['catch'](() => {
              if (enabled12 !== el33) return;
              el33['muted'] = !![];
              const promise2 = el33['play']();
              promise2 &&
                typeof promise2['catch'] === 'function' &&
                promise2['catch'](() => {
                  if (enabled12 !== el33) return;
                  (el29['classList']['remove']('is-preview-playing'), run2(), handler2());
                });
            });
        },
        value139 = () => {
          (handler2(), run2(), el29['classList']['remove']('is-preview-playing'));
        };
      (el29['addEventListener']('mouseenter', value136),
        el29['addEventListener']('mouseleave', value139));
      const value140 = () => {
        (el29['removeEventListener']('mouseenter', value136),
          el29['removeEventListener']('mouseleave', value139),
          handler2(),
          run2(),
          el29['classList']['remove']('is-preview-playing'));
      };
      this['_mediaPreviewDisposers']['add'](value140);
      return;
    }
    if (value131 === GENERATION_HISTORY_MEDIA_KINDS['AUDIO']) {
      const enabled13 = String(value132 || '')['trim']();
      if (!enabled13) return;
      let value141 = null,
        value142 = 0x0;
      const run3 = () => {
          value142 += 0x1;
          const el34 = value141;
          ((value141 = null), el29['classList']['remove']('is-preview-playing'));
          if (!el34) return;
          try {
            el34['pause']?.();
          } catch {}
          try {
            (el34['removeAttribute']?.('src'),
              clearDesktopMediaPlaybackSourceMetadata(el34),
              (el34['preload'] = 'none'),
              el34['load']?.());
          } catch {}
          el34['remove']?.();
        },
        value143 = () => {
          if (value141) return;
          const el35 = el29['querySelector']('.v2-file-history-thumb');
          if (!el35) return;
          const value144 = document['createElement']('audio'),
            value145 = value142 + 0x1;
          ((value142 = value145),
            (value144['preload'] = 'auto'),
            (value144['className'] = 'v2-file-history-preview-audio'),
            (value144['volume'] = 0.72),
            el35['appendChild'](value144),
            (value141 = value144),
            void attachMediaElementPlaybackSource(value144, enabled13, {
              preload: 'auto',
              shouldAssign: () =>
                value141 === value144 && value142 === value145 && el29['isConnected'] !== ![],
            })
              ['then'](async (enabled14) => {
                if (!enabled14 || value141 !== value144 || value142 !== value145) return ![];
                return (await value144['play']?.(), !![]);
              })
              ['then']((value146) => {
                value146 === !![] &&
                  value141 === value144 &&
                  value142 === value145 &&
                  el29['classList']['add']('is-preview-playing');
              })
              ['catch'](() => {
                value141 === value144 && value142 === value145 && run3();
              }));
        },
        value147 = () => {
          run3();
        };
      (el29['addEventListener']('mouseenter', value143),
        el29['addEventListener']('mouseleave', value147));
      const value148 = () => {
        (el29['removeEventListener']('mouseenter', value143),
          el29['removeEventListener']('mouseleave', value147),
          run3());
      };
      this['_mediaPreviewDisposers']['add'](value148);
    }
  }
  ['_createVideoPosterImage'](value149) {
    const value150 = document['createElement']('img');
    return (
      (value150['className'] = 'v2-file-history-video-poster'),
      (value150['src'] = String(value149 || '')['trim']()),
      (value150['alt'] = fileManagerText('alt.videoHistory')),
      (value150['draggable'] = ![]),
      (value150['decoding'] = 'async'),
      (value150['loading'] = 'lazy'),
      value150
    );
  }
  ['_renderVideoPosterPlaceholder']() {
    const el36 = document['createElement']('div');
    return (
      (el36['className'] = 'v2-file-history-video-poster-placeholder'),
      el36['setAttribute']('aria-hidden', 'true'),
      (el36['innerHTML'] =
        '\n      <svg viewBox="0 0 48 48">\n        <rect x="7" y="10" width="34" height="28" rx="5"></rect>\n        <path d="m21 18 10 6-10 6z"></path>\n      </svg>\n    '),
      el36
    );
  }
  ['_setVideoPosterOnCard'](el37, value151) {
    const enabled15 = String(value151 || '')['trim']();
    if (!el37 || !enabled15) return;
    el37['dataset']['videoPosterSrc'] = enabled15;
    const value152 = el37['querySelector']('.v2-file-history-video-poster');
    if (value152) {
      value152['src'] = enabled15;
      return;
    }
    const value153 = el37['querySelector']('.v2-file-history-video-poster-placeholder'),
      value154 = this['_createVideoPosterImage'](enabled15);
    if (value153) {
      value153['replaceWith'](value154);
      return;
    }
    const el38 = el37['querySelector']('.v2-file-history-thumb');
    if (el38) el38['insertBefore'](value154, el38['firstChild'] || null);
  }
  ['_renderFolderThumb'](error5) {
    const el39 = document['createElement']('div');
    el39['className'] = 'v2-file-history-folder-thumb';
    const el40 = document['createElement']('div');
    return (
      (el40['className'] = 'v2-file-history-folder-name'),
      (el40['textContent'] = error5?.['name'] || fileManagerText('fallback.folder')),
      (el39['innerHTML'] =
        '\n      <svg viewBox="0 0 96 72" aria-hidden="true">\n        <path d="M8 22h28l8 9h44v31a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V22z" class="folder-body"/>\n        <path d="M8 18a8 8 0 0 1 8-8h19l8 9h37a8 8 0 0 1 8 8v6H8V18z" class="folder-tab"/>\n      </svg>\n    '),
      el39['appendChild'](el40),
      el39
    );
  }
  ['_renderVideoPreviewOverlay']() {
    const el41 = document['createElement']('div');
    return (
      (el41['className'] = 'v2-file-history-video-preview-overlay'),
      (el41['innerHTML'] =
        '\n      <div class="v2-file-history-video-progress" aria-hidden="true">\n        <div class="v2-file-history-video-progress-fill"></div>\n      </div>\n    '),
      el41
    );
  }
  ['_renderFileThumb'](error6) {
    const el42 = document['createElement']('div');
    ((el42['className'] = 'v2-file-history-file-thumb'),
      (el42['innerHTML'] =
        '\n      <svg viewBox="0 0 72 88" aria-hidden="true">\n        <path d="M14 4h30l14 14v66H14z" class="file-page"/>\n        <path d="M44 4v15h14" class="file-fold"/>\n      </svg>\n    '));
    const el43 = document['createElement']('div');
    return (
      (el43['className'] = 'v2-file-history-folder-name'),
      (el43['textContent'] = error6?.['name'] || fileManagerText('fallback.file')),
      el42['appendChild'](el43),
      el42
    );
  }
  ['_renderAudioThumb']() {
    const el44 = document['createElement']('div');
    return (
      (el44['className'] = 'v2-file-history-audio-thumb'),
      (el44['innerHTML'] =
        '\n      <svg viewBox="0 0 120 72" aria-hidden="true">\n        <path d="M12 38h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8" class="wave-line"/>\n        <path d="M20 48V28m16 28V20m16 36V26m16 30V18m16 38V24m16 26V32" class="wave-bars"/>\n      </svg>\n      <div class="v2-file-history-audio-progress-line" aria-hidden="true"></div>\n    '),
      el44
    );
  }
  ['_buildCanvasNodeFromRecord'](
    state10,
    { center: center, occupiedNodes: occupiedNodes, index: index = 0x0 } = {},
  ) {
    const args7 = Array['isArray'](state10?.['nodes']) ? state10['nodes'][0x0] : null;
    if (!args7) return null;
    const recordMediaKind5 = getRecordMediaKind(state10),
      value155 =
        recordMediaKind5 === GENERATION_HISTORY_MEDIA_KINDS['VIDEO']
          ? 'source-video'
          : recordMediaKind5 === GENERATION_HISTORY_MEDIA_KINDS['AUDIO']
            ? 'source-audio'
            : 'source-image',
      type = String(args7['type'] || value155)['trim']() || value155,
      box15 = normalizeFileManagerSourceNodeForCanvas({ ...args7, type: type }),
      value156 =
        Number(box15['width'] ?? box15['w']) || (type === 'source-audio' ? 0x140 : 0x104),
      value157 =
        Number(box15['height'] ?? box15['h']) || (type === 'source-audio' ? 0x8c : 0x104),
      box16 = center || this['_getCanvasCenterWorld'](),
      box17 = findAvailablePosition(
        occupiedNodes || appStore['getState']()['nodes'],
        box16['x'] - value156 / 0x2 + index * 0x18,
        box16['y'] - value157 / 0x2 + index * 0x18,
        value156,
        value157,
        0x18,
        'right',
      ),
      box18 = JSON['parse'](JSON['stringify'](box15));
    return (
      (box18['id'] = generateId(type)),
      (box18['type'] = type),
      (box18['x'] = box17['x']),
      (box18['y'] = box17['y']),
      box18
    );
  }
  ['restoreRecordsToCanvas'](value158) {
    const list17 = (Array['isArray'](value158) ? value158 : [])['filter'](isFileManagerActionableRecord);
    if (list17['length'] === 0x0) return;
    const center2 = this['_getCanvasCenterWorld'](),
      occupiedNodes2 = { ...(appStore['getState']()['nodes'] || {}) },
      count10 = [];
    list17['forEach']((value159, index2) => {
      const enabled16 = this['_buildCanvasNodeFromRecord'](value159, {
        center: center2,
        occupiedNodes: occupiedNodes2,
        index: index2,
      });
      if (!enabled16) return;
      ((occupiedNodes2[enabled16['id']] = enabled16), count10['push'](enabled16));
    });
    if (count10['length'] === 0x0) return;
    appStore['batch'](() => {
      (count10['forEach']((value160) => appStore['addNode'](value160)),
        appStore['setSelectedNodes'](count10['map']((value161) => value161['id'])));
    });
    const value162 =
      count10['length'] > 0x1
        ? fileManagerText('toasts.addedMany', { count: count10['length'] })
        : this['_activeSource'] === 'output'
          ? fileManagerText('toasts.addedOutput')
          : fileManagerText('toasts.addedHistory', {
              label: getMediaLabel(getRecordMediaKind(list17[0x0])),
            });
    window['showToast']?.(value162, 'success');
  }
  ['_openRecordPreview'](value163) {
    if (!isFileManagerActionableRecord(value163)) return;
    const recordMediaKind6 = getRecordMediaKind(value163),
      mediaSrc = resolveMediaSrc(value163);
    if (recordMediaKind6 === 'image') {
      const value164 = mediaSrc || resolveThumbSrc(value163);
      if (value164) openImagePreview(value164, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
      return;
    }
    recordMediaKind6 === 'video' &&
      mediaSrc &&
      openVideoPreview(mediaSrc, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
  }
  async ['_showRecordInFolder'](value165) {
    const recordLocalPath2 = resolveRecordLocalPath(value165);
    if (!canShowItemInFolder(recordLocalPath2)) return;
    try {
      await showItemInFolder(recordLocalPath2);
    } catch (value166) {
      (console['warn']('[GenerationHistoryFileManager] 打开资源管理器失败:', value166),
        window['showToast']?.(fileManagerText('toasts.revealFailed'), 'error'));
    }
  }
  ['_showDeleteRecordsConfirm'](count11) {
    if (typeof document === 'undefined' || !document['body']) return Promise['resolve'](![]);
    return (
      document['getElementById']('file-manager-delete-confirm-overlay')?.['remove'](),
      new Promise((handler3) => {
        const el45 = document['createElement']('div');
        ((el45['id'] = 'file-manager-delete-confirm-overlay'),
          (el45['className'] = 'custom-confirm-overlay'));
        const el46 = document['createElement']('div');
        ((el46['className'] = 'custom-confirm-box'),
          el46['setAttribute']('role', 'dialog'),
          el46['setAttribute']('aria-modal', 'true'),
          el46['setAttribute']('aria-label', fileManagerText('deleteConfirm.ariaLabel')));
        const el47 = document['createElement']('div');
        ((el47['className'] = 'confirm-title'),
          (el47['textContent'] = fileManagerText('deleteConfirm.title')));
        const el48 = document['createElement']('div');
        ((el48['className'] = 'confirm-msg'),
          (el48['textContent'] =
            count11 > 0x1
              ? fileManagerText('deleteConfirm.messageMany', { count: count11 })
              : fileManagerText('deleteConfirm.messageOne')));
        const el49 = document['createElement']('div');
        el49['className'] = 'confirm-btns';
        const el50 = document['createElement']('button');
        ((el50['type'] = 'button'),
          (el50['className'] = 'confirm-btn confirm-cancel'),
          (el50['textContent'] = fileManagerText('deleteConfirm.cancel')));
        const el51 = document['createElement']('button');
        ((el51['type'] = 'button'),
          (el51['className'] = 'confirm-btn confirm-ok'),
          (el51['textContent'] = fileManagerText('deleteConfirm.delete')),
          el49['appendChild'](el50),
          el49['appendChild'](el51),
          el46['appendChild'](el47),
          el46['appendChild'](el48),
          el46['appendChild'](el49),
          el45['appendChild'](el46),
          document['body']['appendChild'](el45));
        let value167 = ![];
        const run4 = (value168) => {
            if (value167) return;
            ((value167 = !![]),
              document['removeEventListener']('keydown', value169, !![]),
              el45['remove'](),
              handler3(value168));
          },
          value169 = (event13) => {
            if (event13['key'] === 'Escape') {
              (event13['preventDefault'](), run4(![]));
              return;
            }
            event13['key'] === 'Enter' &&
              !event13['isComposing'] &&
              (event13['preventDefault'](), run4(!![]));
          };
        (el45['addEventListener']('click', (event14) => {
          if (event14['target'] === el45) run4(![]);
        }),
          el50['addEventListener']('click', () => run4(![])),
          el51['addEventListener']('click', () => run4(!![])),
          document['addEventListener']('keydown', value169, !![]),
          el50['focus']?.());
      })
    );
  }
  async ['_deleteRecords'](value170) {
    const list18 = (Array['isArray'](value170) ? value170 : [])['filter'](isFileManagerActionableRecord);
    if (list18['length'] === 0x0) return;
    const enabled17 = await this['_showDeleteRecordsConfirm'](list18['length']);
    if (!enabled17) return;
    try {
      if (this['_activeSource'] === 'output') {
        const localPaths = list18['map'](resolveRecordLocalPath)['filter'](Boolean);
        if (localPaths['length'] === 0x0) return;
        await deleteOutputFilesFromServer({ localPaths: localPaths });
        const map7 = new Set(localPaths['map']((value171) => normalizeLocalPath(value171)));
        this['outputItems'] = (Array['isArray'](this['outputItems']) ? this['outputItems'] : [])['filter'](
          (value172) => !map7['has'](normalizeLocalPath(value172?.['localPath'])),
        );
      } else {
        const list19 = list18['map']((value173) => String(value173?.['id'] || ''))['filter'](Boolean),
          list20 = await Promise['all'](list19['map']((value174) => deleteAssetFromServer(value174)));
        if (list20['some']((value175) => value175 === ![])) throw new Error('delete asset failed');
        const map8 = new Set(list19);
        ((this['records'] = (Array['isArray'](this['records']) ? this['records'] : [])['filter'](
          (value176) => !map8['has'](String(value176?.['id'] || '')),
        )),
          (this['_totalRecords'] = Math['max'](
            0x0,
            Number(this['_totalRecords'] || 0x0) - list19['length'],
          )));
      }
      this['_selectedRecordIds']['clear']();
      if (this['_isOpen']()) this['render']();
      window['showToast']?.(
        list18['length'] > 0x1
          ? fileManagerText('toasts.deletedMany')
          : fileManagerText('toasts.deletedOne'),
        'success',
      );
    } catch (value177) {
      (console['error']('[GenerationHistoryFileManager] 删除文件失败:', value177),
        window['showToast']?.(fileManagerText('toasts.deleteFailed'), 'error'));
    }
  }
  ['restoreRecordToCanvas'](value178) {
    const value179 =
      this['_activeSource'] === 'output'
        ? this['_visibleOutputRecords']()['find'](
            (value180) => String(value180?.['id'] || '') === String(value178 || ''),
          )
        : this['records']['find']((value181) => String(value181?.['id'] || '') === String(value178 || ''));
    this['restoreRecordsToCanvas'](value179 ? [value179] : []);
  }
}
export const generationHistoryFileManager = new GenerationHistoryFileManager();
