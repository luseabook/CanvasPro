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
function fileManagerText(_0x48549c, _0x4f9e0b = {}) {
  return t('generationHistoryFileManager.' + _0x48549c, _0x4f9e0b);
}
function isHistorySource(_0x2b884c) {
  const _0x3b7172 = String(_0x2b884c || '').trim();
  return _0x3b7172 === 'current-canvas' || _0x3b7172 === 'history';
}
function sortByUpdatedAt(_0x54b126) {
  return [...(Array.isArray(_0x54b126) ? _0x54b126 : [])].sort((_0x527152, _0x2116b8) => {
    const _0x195cd2 = Number(_0x527152?.updatedAt || _0x527152?.createdAt || 0),
      _0x5e4f1e = Number(_0x2116b8?.updatedAt || _0x2116b8?.createdAt || 0);
    return _0x5e4f1e - _0x195cd2;
  });
}
function normalizeProjectId(_0x3c3c0a) {
  return String(_0x3c3c0a || '').trim() || 'default_v2_project';
}
function resolveThumbSrc(_0x50e2b0) {
  if (!resolveMediaSrc(_0x50e2b0)) return '';
  const _0x31f412 = Array.isArray(_0x50e2b0?.items) ? _0x50e2b0.items[0] : null,
    _0x2d1e1f = Array.isArray(_0x50e2b0?.nodes) ? _0x50e2b0.nodes[0] : null;
  return String(
    _0x50e2b0?.coverUrl ||
      _0x31f412?.thumbSrc ||
      _0x2d1e1f?.thumbUrl ||
      _0x2d1e1f?.videoThumbSrc ||
      _0x2d1e1f?.imageUrl ||
      _0x2d1e1f?.videoUrl ||
      _0x2d1e1f?.src ||
      '',
  ).trim();
}
function resolveMediaSrc(_0x517fba) {
  const _0x1c22c8 = Array.isArray(_0x517fba?.nodes) ? _0x517fba.nodes[0] : null;
  return String(
    _0x1c22c8?.imageUrl ||
      _0x1c22c8?.sourceUrl ||
      _0x1c22c8?.videoUrl ||
      _0x1c22c8?.audioUrl ||
      _0x1c22c8?.src ||
      '',
  ).trim();
}
function getRecordMediaKind(_0x1db343) {
  const _0x5203de = String(_0x1db343?.mediaKind || '')
    .trim()
    .toLowerCase();
  if (
    _0x5203de === 'image' ||
    _0x5203de === 'video' ||
    _0x5203de === 'audio' ||
    _0x5203de === 'folder' ||
    _0x5203de === 'file'
  )
    return _0x5203de;
  const _0x65f5e3 = String(_0x1db343?.coverType || '')
    .trim()
    .toLowerCase();
  if (
    _0x65f5e3 === 'image' ||
    _0x65f5e3 === 'video' ||
    _0x65f5e3 === 'audio' ||
    _0x65f5e3 === 'folder' ||
    _0x65f5e3 === 'file'
  )
    return _0x65f5e3;
  const _0x1a2057 = Array.isArray(_0x1db343?.nodes) ? _0x1db343.nodes[0] : null,
    _0x28c7fd = String(_0x1a2057?.type || '')
      .trim()
      .toLowerCase();
  if (_0x28c7fd.includes('video')) return 'video';
  if (_0x28c7fd.includes('audio')) return 'audio';
  return 'image';
}
function getMediaLabel(_0x16ea68) {
  if (_0x16ea68 === 'video') return fileManagerText('mediaKinds.video');
  if (_0x16ea68 === 'audio') return fileManagerText('mediaKinds.audio');
  if (_0x16ea68 === 'folder') return fileManagerText('mediaKinds.folder');
  if (_0x16ea68 === 'file') return fileManagerText('mediaKinds.file');
  return fileManagerText('mediaKinds.image');
}
function isSupportedOutputMediaKind(_0x48da03) {
  return isActionableFileManagerMediaKind(_0x48da03);
}
function isFileManagerActionableRecord(_0xe0de3f) {
  const _0x2dab5d = getRecordMediaKind(_0xe0de3f);
  if (!isSupportedOutputMediaKind(_0x2dab5d)) return false;
  return Array.isArray(_0xe0de3f?.nodes) && _0xe0de3f.nodes.length > 0;
}
function resolveRecordLocalPath(_0x51ff83) {
  const _0x404c86 = Array.isArray(_0x51ff83?.nodes) ? _0x51ff83.nodes[0] : null;
  return normalizeLocalPath(
    _0x51ff83?.localPath ||
      _0x51ff83?.outputItem?.localPath ||
      _0x404c86?.originalLocalPath ||
      _0x404c86?.localPath ||
      _0x404c86?.displayLocalPath ||
      _0x404c86?.thumbLocalPath ||
      _0x404c86?.src ||
      _0x404c86?.imageUrl ||
      _0x404c86?.videoUrl ||
      _0x404c86?.audioUrl,
  );
}
function buildHistoryRecordIdentityKey(_0x40a969) {
  return buildFileManagerHistoryMediaKey({
    projectId: normalizeProjectId(_0x40a969?.projectId),
    canvasId: String(_0x40a969?.canvasId || '').trim(),
    mediaKind: getRecordMediaKind(_0x40a969),
    localPath: resolveRecordLocalPath(_0x40a969),
    resultFingerprint: _0x40a969?.resultFingerprint,
  });
}
function dedupeHistoryRecords(_0x394ba9) {
  const _0x5a4bbf = new Set(),
    _0x49b66c = [];
  for (const _0x1c74e7 of sortByUpdatedAt(_0x394ba9)) {
    const _0x4bca8f = buildHistoryRecordIdentityKey(_0x1c74e7);
    if (_0x4bca8f && _0x5a4bbf.has(_0x4bca8f)) continue;
    if (_0x4bca8f) _0x5a4bbf.add(_0x4bca8f);
    _0x49b66c.push(_0x1c74e7);
  }
  return _0x49b66c;
}
function getOutputRecordIdForItem(_0x3a0a58) {
  if (_0x3a0a58?.isDir) return 'folder:' + String(_0x3a0a58?.relPath || '');
  if (
    isSupportedOutputMediaKind(
      String(_0x3a0a58?.mediaKind || '')
        .trim()
        .toLowerCase(),
    )
  )
    return 'output:' + String(_0x3a0a58?.relPath || _0x3a0a58?.localPath || '');
  return 'file:' + String(_0x3a0a58?.relPath || _0x3a0a58?.name || '');
}
function outputFileToRecord(_0x2add8a) {
  const _0x50219d = String(_0x2add8a?.mediaKind || '')
    .trim()
    .toLowerCase();
  if (!isSupportedOutputMediaKind(_0x50219d)) return null;
  const _0x420504 = normalizeLocalPath(_0x2add8a?.localPath || _0x2add8a?.url),
    _0x3ed903 = String(_0x2add8a?.url || localPathToUrl(_0x420504)).trim();
  if (!_0x3ed903) return null;
  const _0xd93e4a = normalizeLocalPath(_0x2add8a?.displayLocalPath),
    _0x570e10 = normalizeLocalPath(_0x2add8a?.thumbLocalPath),
    _0x37c177 = localPathToUrl(_0xd93e4a),
    _0x5913db = localPathToUrl(_0x570e10),
    _0x1c5d2b =
      String(_0x2add8a?.name || '').trim() ||
      _0x420504.split(/[\\/]/).pop() ||
      fileManagerText('fallback.outputFile'),
    _0x360221 =
      _0x50219d === 'video' ? 'source-video' : _0x50219d === 'audio' ? 'source-audio' : 'source-image',
    _0x248d97 = Number(_0x2add8a?.videoWidth || _0x2add8a?.originalWidth || _0x2add8a?.width || 0) || 0,
    _0x2c8c3d = Number(_0x2add8a?.videoHeight || _0x2add8a?.originalHeight || _0x2add8a?.height || 0) || 0,
    _0x42a465 = {
      id: _0x360221 + '-output-' + String(_0x2add8a?.relPath || _0x420504).replace(/[^\w-]+/g, '_'),
      type: _0x360221,
      name: _0x1c5d2b,
      x: 0,
      y: 0,
      ...getNodeDefaultSize(_0x360221),
      src: _0x3ed903,
      localPath: _0x420504,
      displayLocalPath: _0xd93e4a,
      thumbLocalPath: _0x570e10,
      fileName: _0x1c5d2b,
      needsAutoResize: _0x50219d !== 'audio',
    };
  if (_0x50219d === 'image')
    ((_0x42a465.imageUrl = _0x3ed903),
      (_0x42a465.sourceUrl = _0x3ed903),
      (_0x42a465.thumbUrl = _0x5913db),
      _0x248d97 > 0 && ((_0x42a465.originalWidth = _0x248d97), (_0x42a465.imageWidth = _0x248d97)),
      _0x2c8c3d > 0 && ((_0x42a465.originalHeight = _0x2c8c3d), (_0x42a465.imageHeight = _0x2c8c3d)));
  else {
    if (_0x50219d === 'video') {
      ((_0x42a465.videoUrl = _0x3ed903),
        (_0x42a465.thumbUrl = _0x5913db),
        (_0x42a465.videoThumbSrc = _0x5913db));
      if (_0x248d97 > 0) _0x42a465.videoWidth = _0x248d97;
      if (_0x2c8c3d > 0) _0x42a465.videoHeight = _0x2c8c3d;
      if (Number(_0x2add8a?.duration || 0) > 0) _0x42a465.duration = Number(_0x2add8a.duration);
    } else _0x50219d === 'audio' && (_0x42a465.audioUrl = _0x3ed903);
  }
  return {
    id: 'output:' + String(_0x2add8a?.relPath || _0x420504),
    mediaKind: _0x50219d,
    coverType: _0x50219d,
    coverUrl: _0x50219d === 'audio' ? '' : _0x5913db || _0x37c177 || _0x3ed903,
    name: _0x1c5d2b,
    localPath: _0x420504,
    updatedAt: Number(_0x2add8a?.mtime || 0) || 0,
    nodes: [_0x42a465],
  };
}
function outputFileToDisplayRecord(_0x122a1f) {
  if (_0x122a1f?.isDir)
    return {
      id: 'folder:' + String(_0x122a1f?.relPath || _0x122a1f?.name || ''),
      mediaKind: 'folder',
      coverType: 'folder',
      name: String(_0x122a1f?.name || fileManagerText('fallback.folder')),
      updatedAt: Number(_0x122a1f?.mtime || 0) || 0,
      outputItem: _0x122a1f,
      nodes: [],
    };
  const _0x357fb7 = outputFileToRecord(_0x122a1f);
  if (_0x357fb7) return { ..._0x357fb7, outputItem: _0x122a1f };
  return {
    id: 'file:' + String(_0x122a1f?.relPath || _0x122a1f?.name || ''),
    mediaKind: 'file',
    coverType: 'file',
    name: String(_0x122a1f?.name || fileManagerText('fallback.file')),
    updatedAt: Number(_0x122a1f?.mtime || 0) || 0,
    outputItem: _0x122a1f,
    nodes: [],
  };
}
function resolveRecordSize(_0x1d3f2b, _0x5c5432) {
  const _0x32f555 = Array.isArray(_0x1d3f2b?.nodes) ? _0x1d3f2b.nodes[0] : null,
    _0x5df488 = Array.isArray(_0x1d3f2b?.items) ? _0x1d3f2b.items[0] : null,
    _0x5239a3 = _0x5df488?.nodeData || {},
    _0x5ab1ed =
      Number(
        _0x32f555?.videoWidth ||
          _0x32f555?.imageWidth ||
          _0x32f555?.originalWidth ||
          _0x32f555?.width ||
          _0x5239a3.width ||
          0,
      ) || 0,
    _0x11cf33 =
      Number(
        _0x32f555?.videoHeight ||
          _0x32f555?.imageHeight ||
          _0x32f555?.originalHeight ||
          _0x32f555?.height ||
          _0x5239a3.height ||
          0,
      ) || 0;
  if (_0x5ab1ed > 0 && _0x11cf33 > 0) return { width: _0x5ab1ed, height: _0x11cf33 };
  if (_0x5c5432 === GENERATION_HISTORY_MEDIA_KINDS.VIDEO)
    return {
      width: Math.round((FILE_MASONRY.defaultShortSide * 16) / 9),
      height: FILE_MASONRY.defaultShortSide,
    };
  if (_0x5c5432 === GENERATION_HISTORY_MEDIA_KINDS.AUDIO) return { width: 0x140, height: 140 };
  if (_0x5c5432 === 'folder') return { width: 150, height: 118 };
  if (_0x5c5432 === 'file') return { width: 150, height: 132 };
  return { width: FILE_MASONRY.defaultShortSide, height: FILE_MASONRY.defaultShortSide };
}
function resolveRecordAspect(_0x5c975b, _0x477e5c) {
  const { width: _0x272d28, height: _0x47ebbf } = resolveRecordSize(_0x5c975b, _0x477e5c);
  return _0x272d28 + ' / ' + _0x47ebbf;
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
    const _0x1f3cb2 = window.CanvasTabManager;
    return (
      String(_0x1f3cb2?.getActiveCanvasId?.() || '').trim() ||
      String(_0x1f3cb2?._activeId || '').trim() ||
      'canvas_1'
    );
  }
  ['_getCanvasCenterWorld']() {
    const { viewport: _0x425258 } = appStore.getState(),
      _0x4a63ba = window.innerWidth / 2,
      _0x2b66ec = window.innerHeight / 2,
      _0x131261 = document.documentElement?.clientWidth || window.innerWidth || 0,
      _0x2964ff = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!_0x131261 || !_0x2964ff) return screenToWorld(_0x4a63ba, _0x2b66ec, _0x425258);
    let _0xa96b38 = 0,
      _0x25ae84 = 0,
      _0x2d1e1c = _0x131261,
      _0x4aa139 = _0x2964ff;
    const _0x2bfbc0 = [],
      _0x18b812 = document.querySelector('header'),
      _0x283c00 = document.querySelector('.sidebar-floating');
    if (_0x18b812) _0x2bfbc0.push(_0x18b812);
    if (_0x283c00) _0x2bfbc0.push(_0x283c00);
    if (this.panel?.classList.contains('show')) _0x2bfbc0.push(this.panel);
    const _0xb1d269 = 8;
    for (const _0x53c3d8 of _0x2bfbc0) {
      if (!_0x53c3d8?.isConnected) continue;
      const _0x30366d = _0x53c3d8.getBoundingClientRect(),
        _0x5c8357 = Math.max(_0xa96b38, _0x30366d.left),
        _0x1cca19 = Math.max(_0x25ae84, _0x30366d.top),
        _0x4c0046 = Math.min(_0x2d1e1c, _0x30366d.right),
        _0x803524 = Math.min(_0x4aa139, _0x30366d.bottom);
      if (_0x4c0046 <= _0x5c8357 || _0x803524 <= _0x1cca19) continue;
      if (_0x30366d.left <= _0xa96b38 + _0xb1d269 && _0x30366d.right > _0xa96b38 + _0xb1d269) {
        _0xa96b38 = Math.max(_0xa96b38, _0x30366d.right);
        continue;
      }
      if (_0x30366d.right >= _0x2d1e1c - _0xb1d269 && _0x30366d.left < _0x2d1e1c - _0xb1d269) {
        _0x2d1e1c = Math.min(_0x2d1e1c, _0x30366d.left);
        continue;
      }
      if (_0x30366d.top <= _0x25ae84 + _0xb1d269 && _0x30366d.bottom > _0x25ae84 + _0xb1d269) {
        _0x25ae84 = Math.max(_0x25ae84, _0x30366d.bottom);
        continue;
      }
      _0x30366d.bottom >= _0x4aa139 - _0xb1d269 &&
        _0x30366d.top < _0x4aa139 - _0xb1d269 &&
        (_0x4aa139 = Math.min(_0x4aa139, _0x30366d.top));
    }
    const _0x229d24 = _0x2d1e1c - _0xa96b38,
      _0x53f878 = _0x4aa139 - _0x25ae84,
      _0x2f3767 = _0x229d24 > 40 ? _0xa96b38 + _0x229d24 / 2 : _0x4a63ba,
      _0x227cef = _0x53f878 > 40 ? _0x25ae84 + _0x53f878 / 2 : _0x2b66ec;
    return screenToWorld(_0x2f3767, _0x227cef, _0x425258);
  }
  ['_hasRecord'](_0x217741, _0xf7ad40, _0x57f1e4, _0x358816 = '', _0x3e798f = '') {
    const _0x2c0ab1 = buildFileManagerHistoryRecordKey({
        projectId: normalizeProjectId(_0x217741),
        canvasId: String(_0xf7ad40 || '').trim(),
        resultFingerprint: _0x57f1e4,
      }),
      _0x4e6f3b = buildFileManagerHistoryMediaKey({
        projectId: normalizeProjectId(_0x217741),
        canvasId: String(_0xf7ad40 || '').trim(),
        mediaKind: _0x3e798f,
        localPath: _0x358816,
        resultFingerprint: _0x57f1e4,
      });
    if (!String(_0x57f1e4 || '').trim() && !String(_0x358816 || '').trim()) return false;
    return this.records.some(
      (_0x59a268) =>
        buildHistoryRecordIdentityKey(_0x59a268) === _0x4e6f3b ||
        buildFileManagerHistoryRecordKey({
          projectId: normalizeProjectId(_0x59a268?.projectId),
          canvasId: String(_0x59a268?.canvasId || '').trim(),
          resultFingerprint: _0x59a268?.resultFingerprint,
        }) === _0x2c0ab1,
    );
  }
  ['_visibleRecords']() {
    if (this._activeSource === 'output') return this._visibleOutputRecords();
    const _0x22880a = this._getCurrentProjectId(),
      _0x4aec0 = this._getCurrentCanvasId(),
      _0x35aee1 =
        this._sortOrder === 'asc'
          ? dedupeHistoryRecords(this.records).reverse()
          : dedupeHistoryRecords(this.records);
    return _0x35aee1.filter((_0x311283) =>
      isFileManagerHistoryRecordVisible({
        record: _0x311283,
        source: this._activeSource,
        projectId: _0x22880a,
        canvasId: _0x4aec0,
        activeFilter: this._activeFilter,
        getMediaKind: getRecordMediaKind,
      }),
    );
  }
  ['_visibleOutputRecords']() {
    const _0xfa06cb = (Array.isArray(this.outputItems) ? this.outputItems : [])
      .map(outputFileToDisplayRecord)
      .filter(Boolean)
      .filter((_0x839cae) => {
        const _0x213a5c = getRecordMediaKind(_0x839cae);
        if (_0x839cae?.outputItem?.isDir) return true;
        if (this._activeFilter === 'all') return _0x213a5c !== 'file';
        return _0x213a5c === this._activeFilter;
      });
    return (
      _0xfa06cb.sort((_0xb32743, _0x46fae4) => {
        const _0x233c71 = _0xb32743?.outputItem?.isDir ? 0 : 1,
          _0x3bc082 = _0x46fae4?.outputItem?.isDir ? 0 : 1;
        if (_0x233c71 !== _0x3bc082) return _0x233c71 - _0x3bc082;
        const _0x13e681 = Number(_0xb32743?.updatedAt || 0),
          _0x1c7faa = Number(_0x46fae4?.updatedAt || 0),
          _0x4a8e53 = this._sortOrder === 'asc' ? _0x13e681 - _0x1c7faa : _0x1c7faa - _0x13e681;
        if (_0x4a8e53 !== 0) return _0x4a8e53;
        return String(_0xb32743?.name || '').localeCompare(String(_0x46fae4?.name || ''), 'zh-CN');
      }),
      _0xfa06cb
    );
  }
  ['_findVisibleRecordById'](_0x2b4b18) {
    const _0x2a2de4 = String(_0x2b4b18 || '');
    if (!_0x2a2de4) return null;
    return this._visibleRecords().find((_0x3a7ff0) => String(_0x3a7ff0?.id || '') === _0x2a2de4) || null;
  }
  ['_findOutputItemByRecordId'](_0x2d6d9e) {
    const _0x5a0299 = String(_0x2d6d9e || '');
    if (!_0x5a0299) return null;
    return (
      (Array.isArray(this.outputItems) ? this.outputItems : []).find(
        (_0x31f99) => getOutputRecordIdForItem(_0x31f99) === _0x5a0299,
      ) || null
    );
  }
  ['_clearSelection']() {
    if (this._selectedRecordIds.size === 0) return;
    (this._selectedRecordIds.clear(), this._syncSelectionClasses());
  }
  ['_selectRecord'](_0x3bd63b, { shiftKey: shiftKey = false } = {}) {
    const _0x3e0c50 = this._findVisibleRecordById(_0x3bd63b),
      _0x117c72 = getFileManagerSelectionAfterClick({
        current: Array.from(this._selectedRecordIds),
        recordId: _0x3bd63b,
        shiftKey: shiftKey,
        actionable: isFileManagerActionableRecord(_0x3e0c50),
      });
    ((this._selectedRecordIds = new Set(_0x117c72)), this._syncSelectionClasses());
  }
  ['_setSelection'](_0x1ee548) {
    const _0x2960df = (Array.isArray(_0x1ee548) ? _0x1ee548 : []).filter((_0x3ab316) =>
      isFileManagerActionableRecord(this._findVisibleRecordById(_0x3ab316)),
    );
    ((this._selectedRecordIds = new Set(_0x2960df)), this._syncSelectionClasses());
  }
  ['_syncSelectionClasses']() {
    if (!this.contentEl) return;
    this.contentEl.querySelectorAll('.v2-file-history-card').forEach((_0x55e80e) => {
      _0x55e80e.classList.toggle(
        'is-selected',
        this._selectedRecordIds.has(String(_0x55e80e.dataset.recordId || '')),
      );
    });
  }
  ['_pruneSelectionToVisibleRecords']() {
    if (this._selectedRecordIds.size === 0) return;
    const _0x2ba7da = new Set(
      this._visibleRecords()
        .filter(isFileManagerActionableRecord)
        .map((_0x4a9334) => String(_0x4a9334?.id || '')),
    );
    let _0x3b0307 = false;
    for (const _0x15bbb1 of Array.from(this._selectedRecordIds)) {
      !_0x2ba7da.has(_0x15bbb1) && (this._selectedRecordIds.delete(_0x15bbb1), (_0x3b0307 = true));
    }
    if (_0x3b0307) this._syncSelectionClasses();
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
      this.panel.addEventListener('click', (_0x476e6d) => {
        if (this._suppressNextClick) {
          (_0x476e6d.preventDefault(), _0x476e6d.stopPropagation(), (this._suppressNextClick = false));
          return;
        }
        const _0x164702 = _0x476e6d.target.closest('[data-file-action]'),
          _0x17d0cf = _0x164702?.dataset?.fileAction || '';
        if (_0x17d0cf === 'filter') {
          (_0x476e6d.preventDefault(), _0x476e6d.stopPropagation());
          const _0x5e9b70 = String(_0x164702.dataset.filter || 'all').trim();
          FILE_FILTERS.some((_0x3693b7) => _0x3693b7.key === _0x5e9b70) &&
            _0x5e9b70 !== this._activeFilter &&
            ((this._activeFilter = _0x5e9b70),
            this._clearSelection(),
            this.render(),
            isHistorySource(this._activeSource) &&
              (this._resetPageState(), void this.loadRecords({ reset: true })));
          return;
        }
        if (_0x17d0cf === 'source') {
          (_0x476e6d.preventDefault(), _0x476e6d.stopPropagation());
          const _0x5ab9f0 = String(_0x164702.dataset.source || 'history').trim();
          if (
            FILE_SOURCES.some((_0xa2243) => _0xa2243.key === _0x5ab9f0) &&
            _0x5ab9f0 !== this._activeSource
          ) {
            ((this._activeSource = _0x5ab9f0), this._clearSelection(), this.render());
            if (isHistorySource(_0x5ab9f0)) void this.loadRecords({ backfillAfterLoad: true, reset: true });
            else
              _0x5ab9f0 === 'output' &&
                !this._outputLoaded &&
                void this.loadOutputFiles({ dir: this._outputDir });
          }
          return;
        }
        if (_0x17d0cf === 'order') {
          (_0x476e6d.preventDefault(),
            _0x476e6d.stopPropagation(),
            (this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc'),
            this._clearSelection(),
            this.render());
          isHistorySource(this._activeSource)
            ? (this._resetPageState(), void this.loadRecords({ reset: true }))
            : void this.loadOutputFiles({ dir: this._outputDir });
          return;
        }
        if (_0x17d0cf === 'output-dir') {
          (_0x476e6d.preventDefault(),
            _0x476e6d.stopPropagation(),
            this._clearSelection(),
            void this.loadOutputFiles({ dir: _0x164702.dataset.dir || '' }));
          return;
        }
        const _0x5d3895 = _0x476e6d.target.closest('.v2-file-history-card');
        if (!_0x5d3895 || !_0x5d3895.dataset.recordId) return;
        if (this._activeSource === 'output') {
          const _0x1e0cfa = this._findOutputItemByRecordId(_0x5d3895.dataset.recordId);
          if (_0x1e0cfa?.isDir) {
            void this.loadOutputFiles({ dir: _0x1e0cfa.dir || _0x1e0cfa.relPath || '' });
            return;
          }
        }
        this._selectRecord(_0x5d3895.dataset.recordId, { shiftKey: _0x476e6d.shiftKey });
      }));
    const _0x1a6dc8 = document.querySelector('.sidebar-floating') || document.body;
    (_0x1a6dc8.appendChild(this.panel), this._bindResizeHandle());
  }
  ['_bindContentWheelGuard']() {
    if (!this.panel || !this.contentEl) return;
    this.panel.addEventListener(
      'wheel',
      (_0x1d04d4) => {
        if (!this.panel?.classList.contains('show')) return;
        (_0x1d04d4.stopPropagation(), _0x1d04d4.stopImmediatePropagation?.());
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
        const _0x534d0e =
          this.contentEl.scrollHeight - this.contentEl.scrollTop - this.contentEl.clientHeight;
        _0x534d0e <= FILE_HISTORY_SCROLL_PREFETCH_PX && void this.loadRecords({ reset: false });
      },
      { passive: true },
    );
  }
  ['_bindMarqueeSelection']() {
    if (!this.contentEl) return;
    this.contentEl.addEventListener('pointerdown', (_0x34433d) => {
      if (_0x34433d.button !== 0 || !this._isOpen()) return;
      if (_0x34433d.target.closest('[data-file-action], .v2-file-history-resize-handle')) return;
      const _0x5e02d2 = _0x34433d.clientX,
        _0x1f0869 = _0x34433d.clientY,
        _0x25710a = { startX: _0x5e02d2, startY: _0x1f0869, active: false, marqueeEl: null };
      this._selectionDrag = _0x25710a;
      const _0x2a7ffb = (_0x45a046) => {
          if (this._selectionDrag !== _0x25710a) return;
          const _0x418f05 = _0x45a046.clientX - _0x5e02d2,
            _0x29719f = _0x45a046.clientY - _0x1f0869;
          if (!_0x25710a.active && Math.hypot(_0x418f05, _0x29719f) < 6) return;
          !_0x25710a.active &&
            ((_0x25710a.active = true),
            (_0x25710a.marqueeEl = document.createElement('div')),
            (_0x25710a.marqueeEl.className = 'v2-file-history-marquee'),
            this.contentEl.appendChild(_0x25710a.marqueeEl));
          const _0x2416bc = this.contentEl.getBoundingClientRect(),
            _0x4f8902 = Math.min(_0x5e02d2, _0x45a046.clientX) - _0x2416bc.left + this.contentEl.scrollLeft,
            _0x398edf = Math.min(_0x1f0869, _0x45a046.clientY) - _0x2416bc.top + this.contentEl.scrollTop,
            _0x36d30e = Math.abs(_0x45a046.clientX - _0x5e02d2),
            _0x32ecf8 = Math.abs(_0x45a046.clientY - _0x1f0869);
          Object.assign(_0x25710a.marqueeEl.style, {
            left: _0x4f8902 + 'px',
            top: _0x398edf + 'px',
            width: _0x36d30e + 'px',
            height: _0x32ecf8 + 'px',
          });
        },
        _0x4fe2e3 = () => {
          (window.removeEventListener('pointermove', _0x2a7ffb, true),
            window.removeEventListener('pointerup', _0x4fe2e3, true),
            window.removeEventListener('pointercancel', _0x4fe2e3, true));
          if (this._selectionDrag !== _0x25710a) return;
          this._selectionDrag = null;
          if (!_0x25710a.active || !_0x25710a.marqueeEl) return;
          const _0x4f1f47 = _0x25710a.marqueeEl.getBoundingClientRect(),
            _0x4871a5 = Array.from(this.contentEl.querySelectorAll('.v2-file-history-card'))
              .filter((_0x12ec85) => {
                const _0x35a801 = _0x12ec85.getBoundingClientRect();
                return !(
                  _0x35a801.right < _0x4f1f47.left ||
                  _0x35a801.left > _0x4f1f47.right ||
                  _0x35a801.bottom < _0x4f1f47.top ||
                  _0x35a801.top > _0x4f1f47.bottom
                );
              })
              .map((_0x4918f5) => String(_0x4918f5.dataset.recordId || ''))
              .filter(Boolean);
          (_0x25710a.marqueeEl.remove(), (this._suppressNextClick = true), this._setSelection(_0x4871a5));
        };
      (window.addEventListener('pointermove', _0x2a7ffb, true),
        window.addEventListener('pointerup', _0x4fe2e3, true),
        window.addEventListener('pointercancel', _0x4fe2e3, true));
    });
  }
  ['_bindContextMenu']() {
    if (!this.panel) return;
    this.panel.addEventListener('contextmenu', (_0x5ba489) => {
      const _0x14b71c = _0x5ba489.target.closest('.v2-file-history-card');
      if (!_0x14b71c || !this.panel.contains(_0x14b71c)) return;
      (_0x5ba489.preventDefault(), _0x5ba489.stopPropagation());
      const _0x186973 = String(_0x14b71c.dataset.recordId || ''),
        _0x5bb3c7 = this._findVisibleRecordById(_0x186973);
      if (!isFileManagerActionableRecord(_0x5bb3c7)) return;
      if (!this._selectedRecordIds.has(_0x186973)) this._setSelection([_0x186973]);
      const _0x33ebca = this._getSelectedRecords(),
        _0x3f0283 = this._buildContextMenuItems(_0x33ebca);
      if (_0x3f0283.length === 0) return;
      showContextMenu(_0x5ba489.clientX, _0x5ba489.clientY, _0x3f0283, {
        includeNodePicker: false,
        sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY,
      });
    });
  }
  ['_bindDoubleClickToCanvas']() {
    if (!this.panel) return;
    this.panel.addEventListener('dblclick', (_0x5c0f3b) => {
      const _0x1640d1 = _0x5c0f3b.target.closest('.v2-file-history-card');
      if (!_0x1640d1 || !this.panel.contains(_0x1640d1)) return;
      const _0x44c37d = String(_0x1640d1.dataset.recordId || ''),
        _0x46320f = this._findVisibleRecordById(_0x44c37d);
      if (!isFileManagerActionableRecord(_0x46320f)) return;
      (_0x5c0f3b.preventDefault(), _0x5c0f3b.stopPropagation());
      const _0xfd862f =
        this._selectedRecordIds.has(_0x44c37d) && this._getSelectedRecords().length > 0
          ? this._getSelectedRecords()
          : [_0x46320f];
      this.restoreRecordsToCanvas(_0xfd862f);
    });
  }
  ['_getSelectedRecords']() {
    const _0x9b6cfb = this._visibleRecords(),
      _0x213fcd = this._selectedRecordIds;
    return _0x9b6cfb.filter((_0x844150) => _0x213fcd.has(String(_0x844150?.id || '')));
  }
  ['_buildContextMenuItems'](_0x5d3eb0) {
    const _0xc019f2 = (Array.isArray(_0x5d3eb0) ? _0x5d3eb0 : []).filter(isFileManagerActionableRecord),
      _0x6ac010 = _0xc019f2[0] || null,
      _0x2f786a = _0xc019f2.length === 1 ? resolveRecordLocalPath(_0x6ac010) : '',
      _0x2a9ff1 = getFileManagerMenuActions({
        records: _0xc019f2,
        canRevealInFolder: canShowItemInFolder(_0x2f786a),
        getMediaKind: getRecordMediaKind,
        isActionableRecord: isFileManagerActionableRecord,
      }),
      _0x159280 = [];
    for (const _0x25f8c9 of _0x2a9ff1) {
      if (_0x25f8c9 === 'delete' && _0x159280.length > 0) _0x159280.push('sep');
      if (_0x25f8c9 === 'add-to-canvas')
        _0x159280.push({
          label:
            _0xc019f2.length > 1
              ? fileManagerText('contextMenu.addManyToCanvas', { count: _0xc019f2.length })
              : fileManagerText('contextMenu.addToCanvas'),
          action: () => this.restoreRecordsToCanvas(_0xc019f2),
        });
      else {
        if (_0x25f8c9 === 'fullscreen')
          _0x159280.push({
            label: fileManagerText('contextMenu.fullscreen'),
            action: () => this._openRecordPreview(_0x6ac010),
          });
        else {
          if (_0x25f8c9 === 'reveal')
            _0x159280.push({
              label: fileManagerText('contextMenu.reveal'),
              action: () => this._showRecordInFolder(_0x6ac010),
            });
          else
            _0x25f8c9 === 'delete' &&
              _0x159280.push({
                label:
                  _0xc019f2.length > 1
                    ? fileManagerText('contextMenu.deleteMany', { count: _0xc019f2.length })
                    : fileManagerText('contextMenu.delete'),
                action: () => void this._deleteRecords(_0xc019f2),
              });
        }
      }
    }
    return _0x159280;
  }
  ['_clampContentScroll']() {
    if (!this.contentEl) return;
    const _0x57588a = Math.max(0, this.contentEl.scrollHeight - this.contentEl.clientHeight);
    if (_0x57588a <= 0) {
      this.contentEl.scrollTop = 0;
      return;
    }
    this.contentEl.scrollTop > _0x57588a && (this.contentEl.scrollTop = _0x57588a);
  }
  ['_bindResizeHandle']() {
    if (!this.panel || !this.resizeHandleEl) return;
    const _0xc98eb = () => {
        if (!this._resizeState) return;
        (window.removeEventListener('pointermove', _0x84f95a, true),
          window.removeEventListener('pointerup', _0xc98eb, true),
          window.removeEventListener('pointercancel', _0xc98eb, true),
          this.panel.classList.remove('is-resizing'),
          (this._resizeState = null));
      },
      _0x84f95a = (_0x1746de) => {
        if (!this._resizeState) return;
        _0x1746de.preventDefault();
        const _0x5cec67 = Math.max(
            FILE_PANEL_RESIZE.minWidth,
            window.innerWidth - this._resizeState.left - FILE_PANEL_RESIZE.maxViewportGap,
          ),
          _0x68296e = Math.max(
            FILE_PANEL_RESIZE.minWidth,
            Math.min(_0x5cec67, this._resizeState.startWidth + _0x1746de.clientX - this._resizeState.startX),
          );
        ((this._panelWidth = Math.round(_0x68296e)),
          (this.panel.style.width = this._panelWidth + 'px'),
          this._relayoutMasonry(),
          this._clampContentScroll());
      };
    this.resizeHandleEl.addEventListener('pointerdown', (_0xa791d0) => {
      if (_0xa791d0.button !== 0) return;
      (_0xa791d0.preventDefault(), _0xa791d0.stopPropagation());
      const _0x3553b4 = this.panel.getBoundingClientRect();
      ((this._resizeState = {
        startX: _0xa791d0.clientX,
        startWidth: _0x3553b4.width || FILE_PANEL_RESIZE.defaultWidth,
        left: _0x3553b4.left,
      }),
        this.panel.classList.add('is-resizing'),
        this.resizeHandleEl.setPointerCapture?.(_0xa791d0.pointerId),
        window.addEventListener('pointermove', _0x84f95a, true),
        window.addEventListener('pointerup', _0xc98eb, true),
        window.addEventListener('pointercancel', _0xc98eb, true));
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
    const _0x33d544 = document.getElementById('btnFiles');
    if (!_0x33d544) return;
    const _0x10cc25 = () => {
      this.show();
    };
    registerSidebarSubmenu({
      key: FILE_MANAGER_SIDEBAR_KEY,
      button: _0x33d544,
      panel: this.panel,
      open: _0x10cc25,
      close: () => this.hide(),
      isOpen: () => this.panel.classList.contains('show'),
      ignorePointerDown: (_0x245a0b) => this._shouldKeepOpenForExternalPointerDown(_0x245a0b),
    });
  }
  ['_shouldKeepOpenForExternalPointerDown'](_0x46cc9b) {
    const _0x268a4e = _0x46cc9b?.target;
    if (!_0x268a4e?.closest) return false;
    return !!_0x268a4e.closest(FILE_MANAGER_KEEP_OPEN_SELECTOR);
  }
  ['_bindGenerationEvents']() {
    window.addEventListener(GENERATION_HISTORY_EVENT, (_0xddadf8) => {
      const _0xf1738b = _0xddadf8?.detail || {},
        _0x48d63e = buildGenerationHistoryAssetsFromNode({
          images: Array.isArray(_0xf1738b.images) ? _0xf1738b.images : [],
          videos: Array.isArray(_0xf1738b.videos) ? _0xf1738b.videos : [],
          audios: Array.isArray(_0xf1738b.audios) ? _0xf1738b.audios : [],
          nodeData: _0xf1738b.nodeData || {},
          projectId: this._getCurrentProjectId(),
          canvasId: this._getCurrentCanvasId(),
          now: Number(_0xf1738b.createdAt || Date.now()) || Date.now(),
        });
      void this._saveRecords(_0x48d63e);
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
      const _0x1616b4 = await fetchOutputFilesFromServer({ dir: dir, order: this._sortOrder });
      ((this.outputItems = Array.isArray(_0x1616b4?.items) ? _0x1616b4.items : []),
        (this._outputDir = String(_0x1616b4?.dir || '').trim()),
        (this._outputParent = String(_0x1616b4?.parent || '').trim()),
        (this._outputBreadcrumbs =
          Array.isArray(_0x1616b4?.breadcrumbs) && _0x1616b4.breadcrumbs.length > 0
            ? _0x1616b4.breadcrumbs
            : [{ name: 'output', dir: '' }]),
        (this._outputLoaded = true));
    } catch (_0x2596d9) {
      (console.error('[GenerationHistoryFileManager] 加载输出文件夹失败:', _0x2596d9),
        (this.outputItems = []),
        (this._outputLoaded = true));
    } finally {
      this._outputLoading = false;
      if (this._isOpen()) this.render();
    }
  }
  ['_buildAssetPageParams'](_0x5ee49c) {
    const _0x315993 = {
      kind: 'generation-history',
      projectId: this._getCurrentProjectId(),
      offset: Number(_0x5ee49c) || 0,
      limit: FILE_HISTORY_PAGE_SIZE,
    };
    this._activeSource === 'current-canvas' && (_0x315993.canvasId = this._getCurrentCanvasId());
    if (this._activeFilter !== 'all') _0x315993.mediaKind = this._activeFilter;
    return ((_0x315993.order = this._sortOrder), _0x315993);
  }
  ['_normalizeAssetsPageResponse'](_0x52efae, _0x35d93d) {
    if (Array.isArray(_0x52efae))
      return {
        items: _0x52efae.filter(isGenerationHistoryAsset),
        total: _0x52efae.length,
        nextOffset: null,
        hasMore: false,
      };
    const _0x22f553 = Array.isArray(_0x52efae?.items) ? _0x52efae.items.filter(isGenerationHistoryAsset) : [];
    return {
      items: _0x22f553,
      total: Number(_0x52efae?.total || 0) || _0x22f553.length,
      nextOffset:
        _0x52efae?.nextOffset === null || _0x52efae?.nextOffset === undefined
          ? null
          : Number(_0x52efae.nextOffset) || Number(_0x35d93d) + _0x22f553.length,
      hasMore: Boolean(_0x52efae?.hasMore),
    };
  }
  async ['loadRecords']({ backfillAfterLoad: backfillAfterLoad = false, reset: reset = false } = {}) {
    if (this._loading && !reset) return;
    if (reset) this._resetPageState();
    if (!this._hasMore && this._recordsLoaded) return;
    const _0x46bcc8 = ++this._loadToken;
    this._loading = true;
    if (this._isOpen()) this.render();
    let _0x3e4a6a = false;
    const _0x3ffdc4 = reset ? 0 : this._nextOffset;
    try {
      const _0x3d39a8 = await fetchAssetsFromServer(this._buildAssetPageParams(_0x3ffdc4));
      if (_0x46bcc8 !== this._loadToken) return;
      const _0xf5b004 = this._normalizeAssetsPageResponse(_0x3d39a8, _0x3ffdc4),
        _0x9cfecb =
          _0x3ffdc4 === 0
            ? _0xf5b004.items
            : [
                ...this.records,
                ..._0xf5b004.items.filter(
                  (_0x5ee709) =>
                    !this.records.some(
                      (_0x1428c7) => String(_0x1428c7?.id || '') === String(_0x5ee709?.id || ''),
                    ),
                ),
              ];
      ((this.records = dedupeHistoryRecords(_0x9cfecb)),
        (this._nextOffset =
          _0xf5b004.nextOffset === null || _0xf5b004.nextOffset === undefined
            ? this.records.length
            : _0xf5b004.nextOffset),
        (this._hasMore = _0xf5b004.hasMore),
        (this._totalRecords = _0xf5b004.total),
        (this._recordsLoaded = true),
        (this._recordsDirty = false),
        (_0x3e4a6a = backfillAfterLoad && _0x3ffdc4 === 0));
    } catch (_0xabd1c8) {
      if (_0x46bcc8 !== this._loadToken) return;
      console.error('[GenerationHistoryFileManager] 加载生成媒体历史失败:', _0xabd1c8);
    } finally {
      if (_0x46bcc8 === this._loadToken) {
        this._loading = false;
        if (this._isOpen()) this.render();
      }
    }
    _0x46bcc8 === this._loadToken && _0x3e4a6a && this._isOpen() && void this._backfillCurrentCanvas();
  }
  async ['_saveRecords'](_0xa80911) {
    const _0x2cc5cd = Array.isArray(_0xa80911) ? _0xa80911 : [],
      _0x28d5f8 = new Set(),
      _0x359245 = _0x2cc5cd.filter((_0xc4ab67) => {
        const _0x565904 = String(_0xc4ab67?.resultFingerprint || '').trim(),
          _0x109058 = resolveRecordLocalPath(_0xc4ab67);
        if (!_0xc4ab67?.id || (!_0x565904 && !_0x109058)) return false;
        const _0x587666 = buildHistoryRecordIdentityKey(_0xc4ab67),
          _0x31fbaa = buildFileManagerHistoryRecordKey({
            projectId: normalizeProjectId(_0xc4ab67.projectId),
            canvasId: String(_0xc4ab67.canvasId || '').trim(),
            resultFingerprint: _0x565904,
          });
        if (_0x28d5f8.has(_0x587666)) return false;
        _0x28d5f8.add(_0x587666);
        if (this._savingIds.has(_0xc4ab67.id)) return false;
        if (this._savingRecordKeys.has(_0x587666)) return false;
        return (
          !this._hasRecord(
            _0xc4ab67.projectId,
            _0xc4ab67.canvasId,
            _0x565904,
            _0x109058,
            getRecordMediaKind(_0xc4ab67),
          ) && !this._savingRecordKeys.has('fingerprint:' + _0x31fbaa)
        );
      });
    if (_0x359245.length === 0) return 0;
    let _0x4b8140 = 0;
    for (const _0x46d5c5 of _0x359245) {
      const _0x306201 = buildHistoryRecordIdentityKey(_0x46d5c5);
      this._savingIds.add(_0x46d5c5.id);
      if (_0x306201) this._savingRecordKeys.add(_0x306201);
      try {
        (await saveAssetToServer(_0x46d5c5),
          (this.records = dedupeHistoryRecords([
            _0x46d5c5,
            ...this.records.filter((_0x57ce67) => _0x57ce67.id !== _0x46d5c5.id),
          ])),
          (_0x4b8140 += 1));
      } catch (_0x4f888e) {
        console.error('[GenerationHistoryFileManager] 保存生成媒体历史失败:', _0x4f888e);
      } finally {
        this._savingIds.delete(_0x46d5c5.id);
        if (_0x306201) this._savingRecordKeys.delete(_0x306201);
      }
    }
    if (_0x4b8140 > 0) {
      if (this._isOpen()) this.render();
      else this._recordsDirty = true;
    }
    return _0x4b8140;
  }
  async ['_backfillCurrentCanvas']() {
    if (this._backfillInFlight) return;
    this._backfillInFlight = true;
    try {
      const _0x2889a3 = this._getCurrentProjectId(),
        _0x2c2cc0 = this._getCurrentCanvasId(),
        _0x44b2e7 = appStore.getStateRaw?.().nodes || appStore.getState().nodes || {},
        _0x225f43 = [];
      for (const _0x40004f of Object.values(_0x44b2e7 || {})) {
        if (!_0x40004f) continue;
        const _0x2e89ec = String(_0x40004f.type || '');
        if (!['ai-image', 'ai-video', 'ai-audio'].includes(_0x2e89ec)) continue;
        const _0x2a9a8d = _0x2e89ec === 'ai-image' && Array.isArray(_0x40004f.images) ? _0x40004f.images : [],
          _0x45e749 = Array.isArray(_0x40004f.videos) ? _0x40004f.videos : [],
          _0x15f047 =
            _0x2e89ec === 'ai-video'
              ? _0x45e749.length > 0
                ? _0x45e749
                : String(_0x40004f.videoUrl || _0x40004f.localPath || '').trim()
                  ? [_0x40004f]
                  : []
              : [],
          _0x5728ad =
            _0x2e89ec === 'ai-audio' && String(_0x40004f.audioUrl || _0x40004f.localPath || '').trim()
              ? [_0x40004f]
              : [];
        if (_0x2a9a8d.length === 0 && _0x15f047.length === 0 && _0x5728ad.length === 0) continue;
        _0x225f43.push(
          ...buildGenerationHistoryAssetsFromNode({
            images: _0x2a9a8d,
            videos: _0x15f047,
            audios: _0x5728ad,
            nodeData: _0x40004f,
            projectId: _0x2889a3,
            canvasId: _0x2c2cc0,
            now: Number(_0x40004f.generationStartTime || Date.now()) || Date.now(),
          }),
        );
      }
      await this._saveRecords(_0x225f43);
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
      const _0x457632 = document.createElement('div');
      ((_0x457632.className = 'v2-file-history-empty'),
        (_0x457632.textContent = fileManagerText('loading.initial')),
        this.contentEl.appendChild(_0x457632));
      return;
    }
    const _0x1daf5e = this._visibleRecords();
    this._pruneSelectionToVisibleRecords();
    if (_0x1daf5e.length === 0) {
      const _0x24bb14 = document.createElement('div');
      ((_0x24bb14.className = 'v2-file-history-empty'),
        (_0x24bb14.textContent =
          this._activeFilter === 'all'
            ? this._activeSource === 'output'
              ? fileManagerText('empty.output')
              : this._activeSource === 'current-canvas'
                ? fileManagerText('empty.currentCanvas')
                : fileManagerText('empty.history')
            : fileManagerText('empty.filtered', { label: getMediaLabel(this._activeFilter) })),
        this.contentEl.appendChild(_0x24bb14),
        this._clampContentScroll());
      return;
    }
    this._renderMasonry(_0x1daf5e);
    if (isHistorySource(this._activeSource) && this._loading && this._recordsLoaded) {
      const _0x49385 = document.createElement('div');
      ((_0x49385.className = 'v2-file-history-page-status'),
        (_0x49385.textContent = fileManagerText('loading.more')),
        this.contentEl.appendChild(_0x49385));
    }
    this._clampContentScroll();
  }
  ['_renderSourceTabs']() {
    if (!this.sourceTabsEl) return;
    const _0x16e42c = document.createDocumentFragment();
    for (const _0x4e5a32 of FILE_SOURCES) {
      const _0x5ee770 = document.createElement('button');
      ((_0x5ee770.type = 'button'),
        (_0x5ee770.className = 'v2-file-history-source-tab'),
        (_0x5ee770.dataset.fileAction = 'source'),
        (_0x5ee770.dataset.source = _0x4e5a32.key),
        _0x5ee770.setAttribute('role', 'tab'),
        _0x5ee770.setAttribute('aria-selected', this._activeSource === _0x4e5a32.key ? 'true' : 'false'),
        _0x5ee770.classList.toggle('is-active', this._activeSource === _0x4e5a32.key),
        (_0x5ee770.textContent = fileManagerText(_0x4e5a32.labelKey)),
        _0x16e42c.appendChild(_0x5ee770));
    }
    this.sourceTabsEl.replaceChildren(_0x16e42c);
  }
  ['_renderOrderControls']() {
    if (!this.orderEl) return;
    const _0x3d3924 = document.createElement('button');
    ((_0x3d3924.type = 'button'),
      (_0x3d3924.className = 'v2-file-history-order-btn'),
      (_0x3d3924.dataset.fileAction = 'order'),
      (_0x3d3924.dataset.order = this._sortOrder),
      _0x3d3924.setAttribute(
        'aria-label',
        this._sortOrder === 'asc' ? fileManagerText('sort.ascAria') : fileManagerText('sort.descAria'),
      ),
      (_0x3d3924.title =
        this._sortOrder === 'asc' ? fileManagerText('sort.ascTitle') : fileManagerText('sort.descTitle')),
      (_0x3d3924.innerHTML =
        '\n      <svg viewBox="0 0 24 24" aria-hidden="true" class="' +
        (this._sortOrder === 'asc' ? 'is-asc' : 'is-desc') +
        '">\n        <path d="M8 5v14" />\n        <path d="M4.5 8.5 8 5l3.5 3.5" />\n        <path d="M16 19V5" />\n        <path d="m12.5 15.5 3.5 3.5 3.5-3.5" />\n      </svg>\n    '),
      this.orderEl.replaceChildren(_0x3d3924));
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
    const _0x94e902 = Array.isArray(this._outputBreadcrumbs)
      ? this._outputBreadcrumbs
      : [{ name: 'output', dir: '' }];
    if (this._outputDir) {
      const _0x5469f6 = document.createElement('button');
      ((_0x5469f6.type = 'button'),
        (_0x5469f6.className = 'v2-file-history-crumb'),
        (_0x5469f6.dataset.fileAction = 'output-dir'),
        (_0x5469f6.dataset.dir = this._outputParent || ''),
        (_0x5469f6.textContent = fileManagerText('breadcrumbs.up')),
        this.breadcrumbsEl.appendChild(_0x5469f6));
    }
    for (const _0x1efd5a of _0x94e902) {
      const _0x535258 = document.createElement('button');
      ((_0x535258.type = 'button'),
        (_0x535258.className = 'v2-file-history-crumb'),
        (_0x535258.dataset.fileAction = 'output-dir'),
        (_0x535258.dataset.dir = String(_0x1efd5a?.dir || '')),
        (_0x535258.textContent = String(_0x1efd5a?.name || 'output')),
        this.breadcrumbsEl.appendChild(_0x535258));
    }
  }
  ['_getMasonryMetrics']() {
    if (!this.contentEl) return { contentWidth: 1 };
    const _0x272030 = window.getComputedStyle(this.contentEl),
      _0x2221f6 =
        (Number.parseFloat(_0x272030.paddingLeft) || 0) + (Number.parseFloat(_0x272030.paddingRight) || 0);
    return { contentWidth: Math.max(1, (this.contentEl.clientWidth || 1) - _0x2221f6) };
  }
  ['_getRecordDisplaySize'](_0x3887fd, _0x39bfb3) {
    const _0x79abdb = getRecordMediaKind(_0x3887fd),
      { width: _0x58bc34, height: _0x36f962 } = resolveRecordSize(_0x3887fd, _0x79abdb),
      _0x264e4f = Math.max(1, _0x58bc34),
      _0x1013a0 = Math.max(1, _0x36f962),
      _0x12e54e = Math.min(_0x264e4f, _0x1013a0),
      _0xb3a72d = Math.max(_0x264e4f, _0x1013a0),
      _0x3fd722 = FILE_MASONRY.fixedShortSide,
      _0x5d2b55 = Math.min(
        _0x3fd722 / _0x12e54e,
        FILE_MASONRY.maxLongSide / _0xb3a72d,
        _0x264e4f > _0x39bfb3 ? _0x39bfb3 / _0x264e4f : 1,
      );
    return {
      width: Math.max(1, Math.round(_0x264e4f * _0x5d2b55)),
      height: Math.max(1, Math.round(_0x1013a0 * _0x5d2b55)),
    };
  }
  ['_findMasonrySlot'](_0x4bbea9, _0xe40de8, _0x39fe46) {
    const _0x459efb = FILE_MASONRY.gap,
      _0x193a00 = Math.max(0, _0x39fe46 - _0xe40de8.width),
      _0x18afdd = [];
    for (let _0x4c1dad = 0; _0x4c1dad <= _0x193a00; _0x4c1dad += FILE_MASONRY.placementStep) {
      _0x18afdd.push(_0x4c1dad);
    }
    if (_0x18afdd[_0x18afdd.length - 1] !== _0x193a00) _0x18afdd.push(_0x193a00);
    let _0x2497ec = null;
    for (const _0xb4b764 of _0x18afdd) {
      let _0x525a8d = 0;
      for (const _0x46277b of _0x4bbea9) {
        const _0x51d55e =
          _0xb4b764 < _0x46277b.x + _0x46277b.width + _0x459efb &&
          _0xb4b764 + _0xe40de8.width + _0x459efb > _0x46277b.x;
        if (_0x51d55e) _0x525a8d = Math.max(_0x525a8d, _0x46277b.y + _0x46277b.height + _0x459efb);
      }
      (!_0x2497ec || _0x525a8d < _0x2497ec.y || (_0x525a8d === _0x2497ec.y && _0xb4b764 < _0x2497ec.x)) &&
        (_0x2497ec = { x: _0xb4b764, y: _0x525a8d });
    }
    return _0x2497ec || { x: 0, y: 0 };
  }
  ['_renderMasonry'](_0x566761) {
    const { contentWidth: _0x45ebff } = this._getMasonryMetrics(),
      _0x5476bd = document.createElement('div');
    ((_0x5476bd.className = 'v2-file-history-masonry-canvas'), this.contentEl.appendChild(_0x5476bd));
    const _0x500e93 = [];
    let _0x1e4c66 = 0;
    for (const _0xd7b7fd of _0x566761) {
      const _0x341711 = this._getRecordDisplaySize(_0xd7b7fd, _0x45ebff),
        _0x387456 = this._findMasonrySlot(_0x500e93, _0x341711, _0x45ebff),
        _0x9daec3 = this._renderCard(_0xd7b7fd);
      ((_0x9daec3.style.left = _0x387456.x + 'px'),
        (_0x9daec3.style.top = _0x387456.y + 'px'),
        (_0x9daec3.style.width = _0x341711.width + 'px'),
        (_0x9daec3.style.height = _0x341711.height + 'px'),
        _0x5476bd.appendChild(_0x9daec3),
        _0x500e93.push({ ..._0x387456, ..._0x341711 }),
        (_0x1e4c66 = Math.max(_0x1e4c66, _0x387456.y + _0x341711.height)));
    }
    _0x5476bd.style.height = _0x1e4c66 + 'px';
  }
  ['_relayoutMasonry']() {
    if (!this.contentEl || !this._isOpen()) return false;
    const _0x4d00de = this.contentEl.querySelector('.v2-file-history-masonry-canvas');
    if (!_0x4d00de) return (this.render(), false);
    const _0x5acd34 = this._visibleRecords(),
      _0x3c9d00 = new Map(
        Array.from(_0x4d00de.querySelectorAll('.v2-file-history-card')).map((_0x5ab1de) => [
          String(_0x5ab1de.dataset.recordId || ''),
          _0x5ab1de,
        ]),
      );
    if (_0x5acd34.length !== _0x3c9d00.size) return (this.render(), false);
    const { contentWidth: _0x469b55 } = this._getMasonryMetrics(),
      _0x215519 = [];
    let _0x4b19c9 = 0;
    for (const _0x3b98c3 of _0x5acd34) {
      const _0x52d8f2 = String(_0x3b98c3?.id || ''),
        _0x2dfa3c = _0x3c9d00.get(_0x52d8f2);
      if (!_0x2dfa3c) return (this.render(), false);
      const _0x1a1d3a = this._getRecordDisplaySize(_0x3b98c3, _0x469b55),
        _0x2d2061 = this._findMasonrySlot(_0x215519, _0x1a1d3a, _0x469b55);
      ((_0x2dfa3c.style.left = _0x2d2061.x + 'px'),
        (_0x2dfa3c.style.top = _0x2d2061.y + 'px'),
        (_0x2dfa3c.style.width = _0x1a1d3a.width + 'px'),
        (_0x2dfa3c.style.height = _0x1a1d3a.height + 'px'),
        _0x215519.push({ ..._0x2d2061, ..._0x1a1d3a }),
        (_0x4b19c9 = Math.max(_0x4b19c9, _0x2d2061.y + _0x1a1d3a.height)));
    }
    return ((_0x4d00de.style.height = _0x4b19c9 + 'px'), true);
  }
  ['_renderFilters']() {
    if (!this.filterEl) return;
    const _0x49bc54 = new Map(
        Array.from(this.filterEl.querySelectorAll('.v2-file-history-filter')).map((_0x448c5b) => [
          _0x448c5b.dataset.filter || '',
          _0x448c5b,
        ]),
      ),
      _0x5676d3 = document.createDocumentFragment();
    for (const _0x1df17a of FILE_FILTERS) {
      const _0x52c3ba = _0x49bc54.get(_0x1df17a.key) || document.createElement('button');
      (!_0x52c3ba.dataset.filter &&
        ((_0x52c3ba.type = 'button'),
        (_0x52c3ba.className = 'v2-file-history-filter'),
        (_0x52c3ba.dataset.fileAction = 'filter'),
        (_0x52c3ba.dataset.filter = _0x1df17a.key)),
        _0x52c3ba.setAttribute('role', 'tab'),
        _0x52c3ba.setAttribute('aria-selected', this._activeFilter === _0x1df17a.key ? 'true' : 'false'),
        _0x52c3ba.classList.toggle('is-active', this._activeFilter === _0x1df17a.key),
        (_0x52c3ba.textContent = fileManagerText(_0x1df17a.labelKey)),
        _0x5676d3.appendChild(_0x52c3ba));
    }
    this.filterEl.replaceChildren(_0x5676d3);
  }
  ['_renderCard'](_0x3081b8) {
    const _0x453e23 = document.createElement('div');
    ((_0x453e23.className = 'v2-file-history-card'),
      (_0x453e23.dataset.recordId = String(_0x3081b8?.id || '')));
    const _0x20f4fc = getRecordMediaKind(_0x3081b8);
    ((_0x453e23.dataset.mediaKind = _0x20f4fc),
      _0x453e23.classList.toggle('is-selected', this._selectedRecordIds.has(String(_0x3081b8?.id || ''))));
    const _0x3d48f3 = document.createElement('div');
    _0x3d48f3.className = 'v2-file-history-thumb is-' + _0x20f4fc;
    const _0x352d45 = resolveRecordAspect(_0x3081b8, _0x20f4fc);
    if (_0x352d45) _0x3d48f3.style.aspectRatio = _0x352d45;
    const _0x39e50b = resolveThumbSrc(_0x3081b8),
      _0x3c3654 = resolveMediaSrc(_0x3081b8);
    if (_0x20f4fc === 'folder') _0x3d48f3.appendChild(this._renderFolderThumb(_0x3081b8));
    else {
      if (_0x20f4fc === 'file') _0x3d48f3.appendChild(this._renderFileThumb(_0x3081b8));
      else {
        if (_0x20f4fc === GENERATION_HISTORY_MEDIA_KINDS.VIDEO && _0x3c3654) {
          const _0x42c82a = document.createElement('video');
          _0x42c82a.src = _0x3c3654;
          if (_0x39e50b && _0x39e50b !== _0x3c3654) _0x42c82a.poster = _0x39e50b;
          ((_0x42c82a.muted = false),
            (_0x42c82a.volume = 0.72),
            (_0x42c82a.loop = true),
            (_0x42c82a.playsInline = true),
            (_0x42c82a.preload = 'metadata'),
            (_0x42c82a.draggable = false),
            _0x3d48f3.appendChild(_0x42c82a),
            _0x3d48f3.appendChild(this._renderVideoPreviewOverlay()));
        } else {
          if (_0x20f4fc === GENERATION_HISTORY_MEDIA_KINDS.VIDEO && _0x39e50b) {
            const _0x325d07 = document.createElement('img');
            ((_0x325d07.src = _0x39e50b),
              (_0x325d07.alt = fileManagerText('alt.videoHistory')),
              (_0x325d07.draggable = false),
              (_0x325d07.decoding = 'async'),
              (_0x325d07.loading = 'lazy'),
              _0x3d48f3.appendChild(_0x325d07));
          } else {
            if (_0x20f4fc === GENERATION_HISTORY_MEDIA_KINDS.AUDIO)
              _0x3d48f3.appendChild(this._renderAudioThumb(_0x3c3654));
            else {
              if (_0x39e50b) {
                const _0x2d244b = document.createElement('img');
                ((_0x2d244b.src = _0x39e50b),
                  (_0x2d244b.alt = fileManagerText('alt.imageHistory')),
                  (_0x2d244b.draggable = false),
                  (_0x2d244b.decoding = 'async'),
                  (_0x2d244b.loading = 'lazy'),
                  _0x3d48f3.appendChild(_0x2d244b));
              }
            }
          }
        }
      }
    }
    return (_0x453e23.appendChild(_0x3d48f3), this._bindHoverPreview(_0x453e23, _0x20f4fc), _0x453e23);
  }
  ['_bindHoverPreview'](_0x285509, _0x88e11b) {
    if (!_0x285509) return;
    if (_0x88e11b === GENERATION_HISTORY_MEDIA_KINDS.VIDEO) {
      const _0x5c8a8f = _0x285509.querySelector('video');
      if (!_0x5c8a8f) return;
      const _0x2d4fa6 = _0x285509.querySelector('.v2-file-history-video-progress-fill'),
        _0x1a05e3 = () => {
          if (_0x2d4fa6) _0x2d4fa6.style.transform = 'scaleX(0)';
        },
        _0x5ca471 = () => {
          if (!_0x2d4fa6) return;
          const _0x474edd = Number(_0x5c8a8f.duration || 0),
            _0x2a01a1 = Number(_0x5c8a8f.currentTime || 0),
            _0x2e5178 = _0x474edd > 0 ? Math.min(Math.max(_0x2a01a1 / _0x474edd, 0), 1) : 0;
          _0x2d4fa6.style.transform = 'scaleX(' + _0x2e5178 + ')';
        };
      (_0x5c8a8f.addEventListener('timeupdate', _0x5ca471),
        _0x5c8a8f.addEventListener('loadedmetadata', _0x5ca471),
        _0x285509.addEventListener('mouseenter', () => {
          (_0x285509.classList.add('is-preview-playing'),
            (_0x5c8a8f.muted = false),
            (_0x5c8a8f.volume = 0.72));
          const _0x30cf0 = _0x5c8a8f.play();
          _0x30cf0 &&
            typeof _0x30cf0.catch === 'function' &&
            _0x30cf0.catch(() => {
              _0x5c8a8f.muted = true;
              const _0x4cfdd6 = _0x5c8a8f.play();
              _0x4cfdd6 &&
                typeof _0x4cfdd6.catch === 'function' &&
                _0x4cfdd6.catch(() => {
                  (_0x285509.classList.remove('is-preview-playing'), _0x1a05e3());
                });
            });
        }),
        _0x285509.addEventListener('mouseleave', () => {
          _0x5c8a8f.pause();
          try {
            _0x5c8a8f.currentTime = 0;
          } catch {}
          (_0x1a05e3(), (_0x5c8a8f.muted = false), _0x285509.classList.remove('is-preview-playing'));
        }));
      return;
    }
    if (_0x88e11b === GENERATION_HISTORY_MEDIA_KINDS.AUDIO) {
      const _0xb72f6 = _0x285509.querySelector('audio');
      if (!_0xb72f6) return;
      (_0x285509.addEventListener('mouseenter', () => {
        _0x285509.classList.add('is-preview-playing');
        try {
          _0xb72f6.currentTime = 0;
        } catch {}
        const _0x3137e6 = _0xb72f6.play();
        _0x3137e6 &&
          typeof _0x3137e6.catch === 'function' &&
          _0x3137e6.catch(() => {
            _0x285509.classList.remove('is-preview-playing');
          });
      }),
        _0x285509.addEventListener('mouseleave', () => {
          _0xb72f6.pause();
          try {
            _0xb72f6.currentTime = 0;
          } catch {}
          _0x285509.classList.remove('is-preview-playing');
        }));
    }
  }
  ['_renderFolderThumb'](_0x396fcd) {
    const _0x54a7ea = document.createElement('div');
    _0x54a7ea.className = 'v2-file-history-folder-thumb';
    const _0x9c7c90 = document.createElement('div');
    return (
      (_0x9c7c90.className = 'v2-file-history-folder-name'),
      (_0x9c7c90.textContent = _0x396fcd?.name || fileManagerText('fallback.folder')),
      (_0x54a7ea.innerHTML =
        '\n      <svg viewBox="0 0 96 72" aria-hidden="true">\n        <path d="M8 22h28l8 9h44v31a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V22z" class="folder-body"/>\n        <path d="M8 18a8 8 0 0 1 8-8h19l8 9h37a8 8 0 0 1 8 8v6H8V18z" class="folder-tab"/>\n      </svg>\n    '),
      _0x54a7ea.appendChild(_0x9c7c90),
      _0x54a7ea
    );
  }
  ['_renderVideoPreviewOverlay']() {
    const _0x1650d1 = document.createElement('div');
    return (
      (_0x1650d1.className = 'v2-file-history-video-preview-overlay'),
      (_0x1650d1.innerHTML =
        '\n      <div class="v2-file-history-video-progress" aria-hidden="true">\n        <div class="v2-file-history-video-progress-fill"></div>\n      </div>\n    '),
      _0x1650d1
    );
  }
  ['_renderFileThumb'](_0xdf125a) {
    const _0x3d7850 = document.createElement('div');
    ((_0x3d7850.className = 'v2-file-history-file-thumb'),
      (_0x3d7850.innerHTML =
        '\n      <svg viewBox="0 0 72 88" aria-hidden="true">\n        <path d="M14 4h30l14 14v66H14z" class="file-page"/>\n        <path d="M44 4v15h14" class="file-fold"/>\n      </svg>\n    '));
    const _0x39a0f7 = document.createElement('div');
    return (
      (_0x39a0f7.className = 'v2-file-history-folder-name'),
      (_0x39a0f7.textContent = _0xdf125a?.name || fileManagerText('fallback.file')),
      _0x3d7850.appendChild(_0x39a0f7),
      _0x3d7850
    );
  }
  ['_renderAudioThumb'](_0x2d98fb = '') {
    const _0x1178fc = document.createElement('div');
    ((_0x1178fc.className = 'v2-file-history-audio-thumb'),
      (_0x1178fc.innerHTML =
        '\n      <svg viewBox="0 0 120 72" aria-hidden="true">\n        <path d="M12 38h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8" class="wave-line"/>\n        <path d="M20 48V28m16 28V20m16 36V26m16 30V18m16 38V24m16 26V32" class="wave-bars"/>\n      </svg>\n      <div class="v2-file-history-audio-progress-line" aria-hidden="true"></div>\n    '));
    const _0x27465e = String(_0x2d98fb || '').trim();
    if (_0x27465e) {
      const _0x251293 = document.createElement('audio');
      ((_0x251293.src = _0x27465e),
        (_0x251293.preload = 'none'),
        (_0x251293.className = 'v2-file-history-preview-audio'),
        (_0x251293.volume = 0.72),
        _0x1178fc.appendChild(_0x251293));
    }
    return _0x1178fc;
  }
  ['_buildCanvasNodeFromRecord'](
    _0x178027,
    { center: _0x22dc65, occupiedNodes: _0x2f63a0, index: index = 0 } = {},
  ) {
    const _0x31767a = Array.isArray(_0x178027?.nodes) ? _0x178027.nodes[0] : null;
    if (!_0x31767a) return null;
    const _0x347eaf = getRecordMediaKind(_0x178027),
      _0x274537 =
        _0x347eaf === GENERATION_HISTORY_MEDIA_KINDS.VIDEO
          ? 'source-video'
          : _0x347eaf === GENERATION_HISTORY_MEDIA_KINDS.AUDIO
            ? 'source-audio'
            : 'source-image',
      _0x3dce6a = String(_0x31767a.type || _0x274537).trim() || _0x274537,
      _0x3a500c = normalizeFileManagerSourceNodeForCanvas({ ..._0x31767a, type: _0x3dce6a }),
      _0x4899aa = Number(_0x3a500c.width ?? _0x3a500c.w) || (_0x3dce6a === 'source-audio' ? 0x140 : 0x104),
      _0x106163 = Number(_0x3a500c.height ?? _0x3a500c.h) || (_0x3dce6a === 'source-audio' ? 140 : 0x104),
      _0x1882e3 = _0x22dc65 || this._getCanvasCenterWorld(),
      _0x22e4a6 = findAvailablePosition(
        _0x2f63a0 || appStore.getState().nodes,
        _0x1882e3.x - _0x4899aa / 2 + index * 24,
        _0x1882e3.y - _0x106163 / 2 + index * 24,
        _0x4899aa,
        _0x106163,
        24,
        'right',
      ),
      _0x5a87aa = JSON.parse(JSON.stringify(_0x3a500c));
    return (
      (_0x5a87aa.id = generateId(_0x3dce6a)),
      (_0x5a87aa.type = _0x3dce6a),
      (_0x5a87aa.x = _0x22e4a6.x),
      (_0x5a87aa.y = _0x22e4a6.y),
      _0x5a87aa
    );
  }
  ['restoreRecordsToCanvas'](_0x3c3d48) {
    const _0x516d43 = (Array.isArray(_0x3c3d48) ? _0x3c3d48 : []).filter(isFileManagerActionableRecord);
    if (_0x516d43.length === 0) return;
    const _0x2dc516 = this._getCanvasCenterWorld(),
      _0x45d674 = { ...(appStore.getState().nodes || {}) },
      _0xc762d0 = [];
    _0x516d43.forEach((_0x32ed65, _0xff929b) => {
      const _0x33e241 = this._buildCanvasNodeFromRecord(_0x32ed65, {
        center: _0x2dc516,
        occupiedNodes: _0x45d674,
        index: _0xff929b,
      });
      if (!_0x33e241) return;
      ((_0x45d674[_0x33e241.id] = _0x33e241), _0xc762d0.push(_0x33e241));
    });
    if (_0xc762d0.length === 0) return;
    appStore.batch(() => {
      (_0xc762d0.forEach((_0x1ddb7b) => appStore.addNode(_0x1ddb7b)),
        appStore.setSelectedNodes(_0xc762d0.map((_0x244e90) => _0x244e90.id)));
    });
    const _0x63b4fe =
      _0xc762d0.length > 1
        ? fileManagerText('toasts.addedMany', { count: _0xc762d0.length })
        : this._activeSource === 'output'
          ? fileManagerText('toasts.addedOutput')
          : fileManagerText('toasts.addedHistory', {
              label: getMediaLabel(getRecordMediaKind(_0x516d43[0])),
            });
    window.showToast?.(_0x63b4fe, 'success');
  }
  ['_openRecordPreview'](_0x5716e5) {
    if (!isFileManagerActionableRecord(_0x5716e5)) return;
    const _0x503ba5 = getRecordMediaKind(_0x5716e5),
      _0xf1b4fb = resolveMediaSrc(_0x5716e5);
    if (_0x503ba5 === 'image') {
      const _0x3d4b05 = _0xf1b4fb || resolveThumbSrc(_0x5716e5);
      if (_0x3d4b05) openImagePreview(_0x3d4b05, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
      return;
    }
    _0x503ba5 === 'video' &&
      _0xf1b4fb &&
      openVideoPreview(_0xf1b4fb, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
  }
  async ['_showRecordInFolder'](_0x573626) {
    const _0x51c4da = resolveRecordLocalPath(_0x573626);
    if (!canShowItemInFolder(_0x51c4da)) return;
    try {
      await showItemInFolder(_0x51c4da);
    } catch (_0x1b3ee7) {
      (console.warn('[GenerationHistoryFileManager] 打开资源管理器失败:', _0x1b3ee7),
        window.showToast?.(fileManagerText('toasts.revealFailed'), 'error'));
    }
  }
  ['_showDeleteRecordsConfirm'](_0x5c44b0) {
    if (typeof document === 'undefined' || !document.body) return Promise.resolve(false);
    return (
      document.getElementById('file-manager-delete-confirm-overlay')?.remove(),
      new Promise((_0x6867f7) => {
        const _0x160c80 = document.createElement('div');
        ((_0x160c80.id = 'file-manager-delete-confirm-overlay'),
          (_0x160c80.className = 'custom-confirm-overlay'));
        const _0x52fa7b = document.createElement('div');
        ((_0x52fa7b.className = 'custom-confirm-box'),
          _0x52fa7b.setAttribute('role', 'dialog'),
          _0x52fa7b.setAttribute('aria-modal', 'true'),
          _0x52fa7b.setAttribute('aria-label', fileManagerText('deleteConfirm.ariaLabel')));
        const _0x16a147 = document.createElement('div');
        ((_0x16a147.className = 'confirm-title'),
          (_0x16a147.textContent = fileManagerText('deleteConfirm.title')));
        const _0x5de58b = document.createElement('div');
        ((_0x5de58b.className = 'confirm-msg'),
          (_0x5de58b.textContent =
            _0x5c44b0 > 1
              ? fileManagerText('deleteConfirm.messageMany', { count: _0x5c44b0 })
              : fileManagerText('deleteConfirm.messageOne')));
        const _0x580a40 = document.createElement('div');
        _0x580a40.className = 'confirm-btns';
        const _0x1ae03 = document.createElement('button');
        ((_0x1ae03.type = 'button'),
          (_0x1ae03.className = 'confirm-btn confirm-cancel'),
          (_0x1ae03.textContent = fileManagerText('deleteConfirm.cancel')));
        const _0x2c7323 = document.createElement('button');
        ((_0x2c7323.type = 'button'),
          (_0x2c7323.className = 'confirm-btn confirm-ok'),
          (_0x2c7323.textContent = fileManagerText('deleteConfirm.delete')),
          _0x580a40.appendChild(_0x1ae03),
          _0x580a40.appendChild(_0x2c7323),
          _0x52fa7b.appendChild(_0x16a147),
          _0x52fa7b.appendChild(_0x5de58b),
          _0x52fa7b.appendChild(_0x580a40),
          _0x160c80.appendChild(_0x52fa7b),
          document.body.appendChild(_0x160c80));
        let _0x33db36 = false;
        const _0x5edf41 = (_0x5d3183) => {
            if (_0x33db36) return;
            ((_0x33db36 = true),
              document.removeEventListener('keydown', _0x582251, true),
              _0x160c80.remove(),
              _0x6867f7(_0x5d3183));
          },
          _0x582251 = (_0x29b853) => {
            if (_0x29b853.key === 'Escape') {
              (_0x29b853.preventDefault(), _0x5edf41(false));
              return;
            }
            _0x29b853.key === 'Enter' &&
              !_0x29b853.isComposing &&
              (_0x29b853.preventDefault(), _0x5edf41(true));
          };
        (_0x160c80.addEventListener('click', (_0x4ab9e6) => {
          if (_0x4ab9e6.target === _0x160c80) _0x5edf41(false);
        }),
          _0x1ae03.addEventListener('click', () => _0x5edf41(false)),
          _0x2c7323.addEventListener('click', () => _0x5edf41(true)),
          document.addEventListener('keydown', _0x582251, true),
          _0x1ae03.focus?.());
      })
    );
  }
  async ['_deleteRecords'](_0x1923ce) {
    const _0x44baf0 = (Array.isArray(_0x1923ce) ? _0x1923ce : []).filter(isFileManagerActionableRecord);
    if (_0x44baf0.length === 0) return;
    const _0x4dd614 = await this._showDeleteRecordsConfirm(_0x44baf0.length);
    if (!_0x4dd614) return;
    try {
      if (this._activeSource === 'output') {
        const _0x4fc320 = _0x44baf0.map(resolveRecordLocalPath).filter(Boolean);
        if (_0x4fc320.length === 0) return;
        await deleteOutputFilesFromServer({ localPaths: _0x4fc320 });
        const _0x1e51e4 = new Set(_0x4fc320.map((_0x542c76) => normalizeLocalPath(_0x542c76)));
        this.outputItems = (Array.isArray(this.outputItems) ? this.outputItems : []).filter(
          (_0x55252b) => !_0x1e51e4.has(normalizeLocalPath(_0x55252b?.localPath)),
        );
      } else {
        const _0x344d49 = _0x44baf0.map((_0x22857c) => String(_0x22857c?.id || '')).filter(Boolean),
          _0x3ee0db = await Promise.all(_0x344d49.map((_0x42becb) => deleteAssetFromServer(_0x42becb)));
        if (_0x3ee0db.some((_0x38dada) => _0x38dada === false)) throw new Error('delete asset failed');
        const _0x22b864 = new Set(_0x344d49);
        ((this.records = (Array.isArray(this.records) ? this.records : []).filter(
          (_0x161128) => !_0x22b864.has(String(_0x161128?.id || '')),
        )),
          (this._totalRecords = Math.max(0, Number(this._totalRecords || 0) - _0x344d49.length)));
      }
      this._selectedRecordIds.clear();
      if (this._isOpen()) this.render();
      window.showToast?.(
        _0x44baf0.length > 1 ? fileManagerText('toasts.deletedMany') : fileManagerText('toasts.deletedOne'),
        'success',
      );
    } catch (_0x4e604a) {
      (console.error('[GenerationHistoryFileManager] 删除文件失败:', _0x4e604a),
        window.showToast?.(fileManagerText('toasts.deleteFailed'), 'error'));
    }
  }
  ['restoreRecordToCanvas'](_0xbceb38) {
    const _0x27e8fd =
      this._activeSource === 'output'
        ? this._visibleOutputRecords().find(
            (_0x118938) => String(_0x118938?.id || '') === String(_0xbceb38 || ''),
          )
        : this.records.find((_0x1dc866) => String(_0x1dc866?.id || '') === String(_0xbceb38 || ''));
    this.restoreRecordsToCanvas(_0x27e8fd ? [_0x27e8fd] : []);
  }
}
export const generationHistoryFileManager = new GenerationHistoryFileManager();
