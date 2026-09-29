import {
  cropGridTilesToServer,
  checkLocalMediaExistsOnServer,
  discardStagedAssetUploadToServer,
  deleteV2ProjectFromServer,
  ensureImageDerivativesToServer,
  fetchRemoteBlob,
  fetchV2ProjectFromServer,
  fetchV2ProjectsFromServer,
  saveV2ProjectToServer,
  saveOutputFromUrlToServer,
  stageAssetUploadToServer,
  saveOutputToServer,
  uploadFileToServer,
} from '../../api/projectsV2Api.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import {
  buildImageNodeStorageFields,
  hasImageDerivativeFields,
  toLocalPathUrl,
} from './imageDerivativeService.js';
import {
  PANORAMA_360_DEFAULT_NAME,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_SCENE_DEFAULT_NAME,
  PANORAMA_SCENE_NODE_TYPE,
  getPanorama360DefaultName,
  getPanoramaSceneDefaultName,
  isPanorama360NodeType,
  isPanoramaSceneNodeType,
  normalizePanorama360State,
  normalizeSceneOnlyPanoramaSceneState,
} from '../modules/panoramaSceneNode/sceneNode.js';
import { desktopBridge } from './desktopBridge.js';
import { saveTextDownload } from './downloadSaveService.js';
import { createProjectSaveQueue } from './projectSaveQueue.js';
import { assertCanvasProjectSaveAllowed } from './canvasProjectAccess.js';
import { diagnosticReference, runDiagnosticOperation } from './operationDiagnostics.js';
const PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|json)$/i,
  RETIRED_CANVAS_NODE_TYPES = new Set(['storyboard-3d']);
function stripProjectFileExtension(_0x501d5c) {
  return String(_0x501d5c || '')['replace'](PROJECT_FILE_EXTENSION_RE, '');
}
function _getActiveProjectIdentity() {
  if (typeof window === 'undefined') return '';
  return stripProjectFileExtension(window['currentProjectId'] || window['_v2CurrentFile'] || '');
}
const DEFAULT_PROJECT_NAME = 'default_v2_project',
  REMOTE_SAVE_CACHE_LIMIT = 0x1f4,
  REMOTE_IMAGE_MAX_BYTES = 0x400 * 0x400 * 0x12c,
  _remoteSaveInflight = new Map(),
  _remoteSaveCache = new Map(),
  _localStagedAssetImportInflight = new Map(),
  enqueueProjectSave = createProjectSaveQueue(
    ({ projectId: _0x2c7f0d, payload: _0x2111bf, activeIdentity: _0x3fa1fd }) =>
      _persistProjectSnapshot(_0x2c7f0d, _0x2111bf, _0x3fa1fd),
  );
let _projectPersistenceBlockedReason = '';
export function setProjectPersistenceBlocked(_0xf25fe9 = '项目尚未安全加载') {
  _projectPersistenceBlockedReason = String(_0xf25fe9 || '项目尚未安全加载')['trim']();
}
export function clearProjectPersistenceBlock() {
  _projectPersistenceBlockedReason = '';
}
export function isProjectPersistenceBlocked() {
  return !!_projectPersistenceBlockedReason;
}
function _isLocalRelativeUrl(_0x5e9d2e) {
  const _0x49ff99 = String(_0x5e9d2e || '')['trim']();
  return _0x49ff99['startsWith']('/') && !_0x49ff99['startsWith']('//');
}
function _shouldFetchClientSideBeforeSaving(_0x53e9d1) {
  const _0x4830f8 = String(_0x53e9d1 || '')['trim']();
  return (
    _0x4830f8['startsWith']('blob:') || _0x4830f8['startsWith']('data:') || _isLocalRelativeUrl(_0x4830f8)
  );
}
function _buildRemoteSaveCacheKey(_0x167824, _0x52e340, _0x3f31e0 = {}) {
  const _0x1e3b08 = String(_0x52e340 || '')['trim'](),
    _0x1b3086 = String(
      _0x3f31e0?.['dedupeKey'] ||
        (_0x3f31e0?.['taskKey'] ? _0x3f31e0['taskKey'] + ':' + _0x1e3b08 : _0x1e3b08),
    )['trim']();
  return (String(_0x167824 || 'media')['trim']() || 'media') + ':' + (_0x1b3086 || _0x1e3b08);
}
function _rememberRemoteSave(_0x10cf01, _0x4d1637) {
  if (!_0x10cf01 || !_0x4d1637 || typeof _0x4d1637 !== 'object') return;
  _remoteSaveCache['set'](_0x10cf01, _0x4d1637);
  if (_remoteSaveCache['size'] > REMOTE_SAVE_CACHE_LIMIT) {
    const _0x5b6094 = _remoteSaveCache['keys']()['next']()['value'];
    if (_0x5b6094) _remoteSaveCache['delete'](_0x5b6094);
  }
}
function _runRemoteSaveOnce(_0x3d7068, _0x249100) {
  if (_remoteSaveCache['has'](_0x3d7068)) return Promise['resolve'](_remoteSaveCache['get'](_0x3d7068));
  if (_remoteSaveInflight['has'](_0x3d7068)) return _remoteSaveInflight['get'](_0x3d7068);
  const _0x1b5474 = Promise['resolve']()
    ['then'](_0x249100)
    ['then']((_0x55e238) => {
      return (_rememberRemoteSave(_0x3d7068, _0x55e238), _0x55e238);
    });
  return (
    _remoteSaveInflight['set'](_0x3d7068, _0x1b5474),
    _0x1b5474['finally'](() => {
      _remoteSaveInflight['get'](_0x3d7068) === _0x1b5474 && _remoteSaveInflight['delete'](_0x3d7068);
    })['catch'](() => {}),
    _0x1b5474
  );
}
function _isPlainObject(_0x14e7ee) {
  return !!_0x14e7ee && typeof _0x14e7ee === 'object' && !Array['isArray'](_0x14e7ee);
}
function _migratePanoramaNodeInPlace(_0x155edb) {
  if (!_isPlainObject(_0x155edb)) return;
  const _0xbc24a0 = String(_0x155edb['type'] || '')['trim']();
  if (isPanorama360NodeType(_0xbc24a0)) {
    _0x155edb['type'] = PANORAMA_360_NODE_TYPE;
    const _0x148f09 = _isPlainObject(_0x155edb['panorama360Node'])
      ? _0x155edb['panorama360Node']
      : _0x155edb['sceneNode'];
    ((_0x155edb['panorama360Node'] = normalizePanorama360State(_0x148f09)), delete _0x155edb['sceneNode']);
    !String(_0x155edb['name'] || '')['trim']() && (_0x155edb['name'] = getPanorama360DefaultName());
    return;
  }
  if (!isPanoramaSceneNodeType(_0xbc24a0)) return;
  _0x155edb['type'] = PANORAMA_SCENE_NODE_TYPE;
  const _0x119b7e = _isPlainObject(_0x155edb['sceneNode'])
      ? _0x155edb['sceneNode']
      : _0x155edb['panorama360Node'],
    _0xf2e7ed = normalizeSceneOnlyPanoramaSceneState(_0x119b7e),
    _0x7fd6d3 = String(_0x119b7e?.['mode'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x5e02c3 = _0x7fd6d3 === 'panorama';
  if (_0x5e02c3) {
    ((_0x155edb['type'] = PANORAMA_360_NODE_TYPE),
      (_0x155edb['panorama360Node'] = normalizePanorama360State(_0x119b7e)),
      delete _0x155edb['sceneNode']);
    const _0xd75a7 = String(_0x155edb['name'] || '')['trim'](),
      _0x5478a4 = getPanoramaSceneDefaultName();
    (!_0xd75a7 || _0xd75a7 === PANORAMA_SCENE_DEFAULT_NAME || _0xd75a7 === _0x5478a4) &&
      (_0x155edb['name'] = getPanorama360DefaultName());
    return;
  }
  ((_0x155edb['sceneNode'] = _0xf2e7ed),
    delete _0x155edb['panorama360Node'],
    !String(_0x155edb['name'] || '')['trim']() && (_0x155edb['name'] = getPanoramaSceneDefaultName()));
}
function _migrateCanvasDataInPlace(_0x4c5e2a) {
  const _0x16d003 = Array['isArray'](_0x4c5e2a?.['canvases']) ? _0x4c5e2a['canvases'] : [];
  for (const _0x5cce5e of _0x16d003) {
    if (!_0x5cce5e) continue;
    if (_0x5cce5e['nodes'] && !Array['isArray'](_0x5cce5e['nodes']))
      _0x5cce5e['nodes'] = Object['values'](_0x5cce5e['nodes']);
    if (_0x5cce5e['edges'] && !Array['isArray'](_0x5cce5e['edges']))
      _0x5cce5e['edges'] = Object['values'](_0x5cce5e['edges']);
    const _0x5e653f = Array['isArray'](_0x5cce5e['nodes']) ? _0x5cce5e['nodes'] : [],
      _0x2ee6ad = new Set(
        _0x5e653f['filter']((_0x2ba0e7) =>
          RETIRED_CANVAS_NODE_TYPES['has'](String(_0x2ba0e7?.['type'] || '')),
        )
          ['map']((_0x3ee9c6) => String(_0x3ee9c6?.['id'] || ''))
          ['filter'](Boolean),
      );
    _0x5cce5e['nodes'] = _0x5e653f['filter'](
      (_0x299f5b) => !RETIRED_CANVAS_NODE_TYPES['has'](String(_0x299f5b?.['type'] || '')),
    );
    _0x2ee6ad['size'] > 0x0 &&
      (_0x5cce5e['edges'] = (Array['isArray'](_0x5cce5e['edges']) ? _0x5cce5e['edges'] : [])['filter'](
        (_0x269db7) =>
          !_0x2ee6ad['has'](String(_0x269db7?.['sourceId'] || '')) &&
          !_0x2ee6ad['has'](String(_0x269db7?.['targetId'] || '')),
      ));
    for (const _0x62d3be of _0x5cce5e['nodes']) {
      _migratePanoramaNodeInPlace(_0x62d3be);
    }
  }
  return _0x4c5e2a;
}
const getCssVar = (_0x379e46) =>
  getComputedStyle(document['documentElement'])['getPropertyValue'](_0x379e46)['trim']();
export function resolveCanvasData(_0xeecc7) {
  if (!_0xeecc7)
    return _migrateCanvasDataInPlace({
      canvases: [
        { id: 'canvas_1', name: '默认画布', nodes: [], edges: [], viewport: { x: 0x0, y: 0x0, zoom: 1.1 } },
      ],
      activeCanvasId: 'canvas_1',
    });
  if (Array['isArray'](_0xeecc7['canvases']) && _0xeecc7['canvases']['length'] > 0x0) {
    let _0x4bc6d2 = _0xeecc7['activeCanvasId'] || _0xeecc7['canvases'][0x0]['id'];
    const _0x270def = _0xeecc7['canvases']['find']((_0x3896a8) => _0x3896a8['id'] === _0x4bc6d2);
    if (
      _0x270def &&
      (!_0x270def['nodes'] || _0x270def['nodes']['length'] === 0x0) &&
      (!_0x270def['storyboard3dProjects'] || _0x270def['storyboard3dProjects']['length'] === 0x0)
    ) {
      const _0x4a356 = _0xeecc7['canvases']['find'](
        (_0x58764d) =>
          (_0x58764d['nodes'] && _0x58764d['nodes']['length'] > 0x0) ||
          (_0x58764d['storyboard3dProjects'] && _0x58764d['storyboard3dProjects']['length'] > 0x0),
      );
      if (_0x4a356) _0x4bc6d2 = _0x4a356['id'];
    }
    return _migrateCanvasDataInPlace({ canvases: _0xeecc7['canvases'], activeCanvasId: _0x4bc6d2 });
  }
  let _0x51e73b = _0xeecc7['nodes'] || _0xeecc7['v2_nodes'] || [],
    _0x302d2b = _0xeecc7['edges'] || _0xeecc7['v2_edges'] || [];
  if (!Array['isArray'](_0x51e73b)) _0x51e73b = Object['values'](_0x51e73b);
  if (!Array['isArray'](_0x302d2b)) _0x302d2b = Object['values'](_0x302d2b);
  const _0x173f61 = {
    id: 'canvas_1',
    name: '默认画布',
    nodes: _0x51e73b,
    edges: _0x302d2b,
    viewport: _0xeecc7['viewport'] || { x: 0x0, y: 0x0, zoom: 1.1 },
  };
  return _migrateCanvasDataInPlace({ canvases: [_0x173f61], activeCanvasId: 'canvas_1' });
}
export async function loadProject(_0x2e515f, { allowMissing: allowMissing = ![] } = {}) {
  try {
    return await loadProjectStrict(_0x2e515f);
  } catch (_0xeee347) {
    console['error']('[projectService] 加载项目异常:', _0xeee347);
    if (allowMissing === !![] && _0xeee347?.['code'] === 'PROJECT_NOT_FOUND') return resolveCanvasData({});
    throw _0xeee347;
  }
}
export async function loadProjectStrict(_0x163fc0) {
  return runDiagnosticOperation('project.load', { projectRef: diagnosticReference(_0x163fc0) }, () =>
    _loadProjectStrict(_0x163fc0),
  );
}
async function _loadProjectStrict(_0x566c35) {
  const _0x454697 = PROJECT_FILE_EXTENSION_RE['test'](String(_0x566c35 || ''))
      ? _0x566c35
      : _0x566c35 + '.aicanvas',
    _0x380ce7 = await fetchV2ProjectFromServer(_0x566c35);
  if (!_0x380ce7) {
    const _0x165b81 = new Error('Project file not found: ' + _0x454697);
    _0x165b81['code'] = 'PROJECT_NOT_FOUND';
    throw _0x165b81;
  }
  const _0xa4cda = resolveCanvasData(_0x380ce7);
  return (
    console['log'](
      '[projectService]\x20项目\x20' +
        _0x566c35 +
        ' 已加载，共 ' +
        _0xa4cda['canvases']['length'] +
        '\x20个画布页面',
    ),
    _0xa4cda
  );
}
async function _persistProjectSnapshot(_0x51ee65, _0x319510, _0x14d9b1) {
  try {
    const _0x3e113c = await saveV2ProjectToServer(_0x319510),
      _0x42534b = globalThis['window']?.['CanvasTabManager'],
      _0x2ef527 = _0x42534b?.['getActiveCanvasId']?.() || _0x42534b?.['_activeId'],
      _0x3b30a1 = !_0x42534b || _0x2ef527 === _0x319510['activeCanvasId'];
    return (
      _0x3e113c &&
        _0x3e113c['success'] &&
        _0x3b30a1 &&
        _getActiveProjectIdentity() === _0x14d9b1 &&
        ((window['_v2CurrentFile'] = _0x3e113c['filename']),
        (window['currentProjectId'] = stripProjectFileExtension(_0x3e113c['filename'])),
        _clearElectronRecoverySnapshotAfterSave()),
      console['log'](
        '[projectService]\x20项目\x20' +
          _0x51ee65 +
          ' 已持久化（' +
          _0x319510['canvases']['length'] +
          ' 个画布）',
      ),
      _0x3e113c
    );
  } catch (_0x1077a9) {
    console['error']('[projectService] 存档异常:', _0x1077a9);
    throw _0x1077a9;
  }
}
export async function saveProject(_0x27aac7, _0x58217b) {
  return runDiagnosticOperation(
    'project.save',
    {
      projectRef: diagnosticReference(_0x27aac7),
      canvasCount: Array['isArray'](_0x58217b?.['canvases']) ? _0x58217b['canvases']['length'] : 0x0,
    },
    () => _saveProject(_0x27aac7, _0x58217b),
  );
}
async function _saveProject(_0x15b454, _0x5d0590) {
  assertCanvasProjectSaveAllowed(_0x5d0590);
  if (_projectPersistenceBlockedReason) throw new Error(_projectPersistenceBlockedReason);
  const _0x480cf2 = _getActiveProjectIdentity(),
    _0x4fa6af = sanitizeMultiCanvasDataForPersistence(_0x5d0590 || {}),
    _0x23e49c = _0x15b454 || DEFAULT_PROJECT_NAME,
    _0x3cd26a = {
      projectName: _0x23e49c,
      activeCanvasId: _0x4fa6af?.['activeCanvasId'] || 'canvas_1',
      canvases: _0x4fa6af?.['canvases'] || [],
    },
    _0x1d6b20 = stripProjectFileExtension(String(_0x23e49c))['trim']()['toLowerCase']();
  return await enqueueProjectSave(_0x1d6b20, {
    projectId: _0x23e49c,
    payload: _0x3cd26a,
    activeIdentity: _0x480cf2,
  });
}
export async function getProjects() {
  try {
    return await fetchV2ProjectsFromServer();
  } catch {
    return [];
  }
}
export async function deleteProject(_0x408139) {
  try {
    return await deleteV2ProjectFromServer(_0x408139);
  } catch (_0x1e0fca) {
    return (console['error']('[projectService] 删除项目失败:', _0x1e0fca), ![]);
  }
}
function _getElectronImportAsset() {
  if (!desktopBridge['assetImport']['canImportAsset']()) return null;
  return (_0x996057) => desktopBridge['assetImport']['importAsset'](_0x996057);
}
function _clearElectronRecoverySnapshotAfterSave() {
  if (!desktopBridge['project']['isAvailable']()) return;
  void Promise['resolve']()
    ['then'](() => desktopBridge['project']['clearRecoverySnapshot']())
    ['catch']((_0x17ab00) => {
      console['warn']('[projectService] 清理恢复快照失败:', _0x17ab00);
    });
}
function _getElectronPathForFile(_0x12ac55) {
  if (!desktopBridge['assetImport']['isAvailable']()) return '';
  const _0x56972b = String(_0x12ac55?.['path'] || '')['trim']();
  if (_0x56972b) return _0x56972b;
  try {
    return String(desktopBridge['assetImport']['getPathForFile'](_0x12ac55) || '')['trim']();
  } catch {
    return '';
  }
}
async function _importAssetWithElectron(_0x1d79e4, _0x4d67c0) {
  const _0x57a8d9 = _getElectronImportAsset();
  if (!_0x57a8d9 || !_0x1d79e4) return null;
  const _0x48bad5 = {
      name: _0x1d79e4['name'] || 'asset',
      type: _0x1d79e4['type'] || '',
      projectId: _0x4d67c0,
    },
    _0x1e4c4a = _getElectronPathForFile(_0x1d79e4);
  if (_0x1e4c4a) _0x48bad5['path'] = _0x1e4c4a;
  else {
    if (typeof _0x1d79e4['arrayBuffer'] === 'function') _0x48bad5['bytes'] = await _0x1d79e4['arrayBuffer']();
    else return null;
  }
  return _normalizeImageSaveResult(await _0x57a8d9(_0x48bad5));
}
export function importLocalStagedAsset(_0x5d89dd, _0x3d058f = {}) {
  const _0xc135c = normalizeLocalPath(_0x5d89dd);
  if (!_0xc135c['startsWith']('data/uploads/'))
    throw new Error('Only\x20staged\x20local\x20uploads\x20can\x20be\x20imported\x20as\x20assets');
  if (!desktopBridge['isChromeShell']) return null;
  const _0xbde6bd = _getElectronImportAsset();
  if (!_0xbde6bd) return null;
  const _0x469d04 = _localStagedAssetImportInflight['get'](_0xc135c);
  if (_0x469d04) return _0x469d04;
  const _0x4b22b5 = Promise['resolve']()
    ['then'](() =>
      _0xbde6bd({
        name: String(_0x3d058f?.['name'] || '')['trim']() || _0xc135c['split']('/')['pop']() || 'asset',
        type: String(_0x3d058f?.['type'] || '')['trim'](),
        projectId: _0x3d058f?.['projectId'],
        localPath: _0xc135c,
      }),
    )
    ['then']((_0x3c5b9e) => {
      const _0x5d2abd = _normalizeImageSaveResult(_0x3c5b9e);
      if (!_0x5d2abd?.['success'])
        throw new Error(
          '本地素材导入失败：' +
            (_stringifyRemoteSaveError(_0x3c5b9e?.['error'] || _0x3c5b9e?.['message']) ||
              '素材服务未确认导入成功，请重试'),
          { cause: _0x3c5b9e },
        );
      return _0x5d2abd;
    })
    ['finally'](() => {
      _localStagedAssetImportInflight['get'](_0xc135c) === _0x4b22b5 &&
        _localStagedAssetImportInflight['delete'](_0xc135c);
    });
  return (_localStagedAssetImportInflight['set'](_0xc135c, _0x4b22b5), _0x4b22b5);
}
async function _importStagedChromeShellAsset(_0x4b253a, _0xdefee2) {
  if (!desktopBridge['isChromeShell'] || !_0x4b253a) return null;
  const _0x4ee176 = _normalizeImageSaveResult(await stageAssetUploadToServer(_0x4b253a)),
    _0x221150 = pickResultLocalPath(_0x4ee176) || urlToLocalPath(_0x4ee176?.['url']);
  if (!_0x221150)
    throw new Error(
      '素材暂存失败：' +
        (_stringifyRemoteSaveError(_0x4ee176?.['error'] || _0x4ee176?.['message']) ||
          '本地服务未返回暂存文件路径，请重试'),
      { cause: _0x4ee176 },
    );
  try {
    const _0x5bb14f = await importLocalStagedAsset(_0x221150, {
      name: _0x4b253a['name'] || _0x4ee176?.['filename'] || 'asset',
      type: _0x4b253a['type'] || '',
      projectId: _0xdefee2,
    });
    return (
      _0x4ee176?.['stageId'] &&
        void discardStagedAssetUploadToServer(_0x4ee176['stageId'])['catch'](() => {}),
      _0x5bb14f
    );
  } catch (_0x3980b5) {
    if (
      !String(_0x4b253a['type'] || '')
        ['toLowerCase']()
        ['startsWith']('video/')
    )
      throw _0x3980b5;
    return {
      ..._0x4ee176,
      success: !![],
      stagedUploadId: _0x4ee176['stageId'] || '',
      canonicalImportPending: !![],
      canonicalImportStatus: 'failed',
      canonicalImportError: String(_0x3980b5?.['message'] || _0x3980b5 || ''),
    };
  }
}
export function discardLocalStagedAsset(_0x184b5b) {
  return discardStagedAssetUploadToServer(_0x184b5b);
}
export async function uploadFile(_0x420d68, _0x2d85d5) {
  return runDiagnosticOperation(
    'asset.upload',
    { projectRef: diagnosticReference(_0x2d85d5), sizeBytes: Number(_0x420d68?.['size'] || 0x0) },
    () => _uploadFile(_0x420d68, _0x2d85d5),
  );
}
async function _uploadFile(_0x2c592b, _0x3a3511) {
  try {
    const _0xd0ebc6 = _getElectronPathForFile(_0x2c592b);
    if (desktopBridge['isChromeShell'] && !_0xd0ebc6) {
      const _0x29885f = await _importStagedChromeShellAsset(_0x2c592b, _0x3a3511);
      if (_0x29885f?.['success']) return _0x29885f;
      throw new Error(
        '本地素材导入失败：' +
          (_stringifyRemoteSaveError(_0x29885f?.['error'] || _0x29885f?.['message']) ||
            '素材服务未确认导入成功，请重试'),
        { cause: _0x29885f },
      );
    }
    try {
      const _0x1eb810 = await _importAssetWithElectron(_0x2c592b, _0x3a3511);
      if (_0x1eb810?.['success']) return _0x1eb810;
    } catch (_0x5071f3) {
      console['warn']('[projectService] Electron 素材导入失败，回退上传流程:', _0x5071f3);
    }
    return _normalizeImageSaveResult(await uploadFileToServer(_0x2c592b));
  } catch (_0x5eed69) {
    console['error']('[projectService] 文件上传异常:', _0x5eed69);
    throw _0x5eed69;
  }
}
export async function saveOutputBlob(_0x367e09, _0x5ae111 = {}) {
  return runDiagnosticOperation(
    'output.save_blob',
    { sizeBytes: Number(_0x367e09?.['size'] || 0x0) },
    async () => _normalizeImageSaveResult(await saveOutputToServer(_0x367e09, _0x5ae111)),
  );
}
export async function cropGridTiles(_0x5619d4 = {}) {
  const _0x36956c = await cropGridTilesToServer(_0x5619d4);
  if (!_0x36956c || typeof _0x36956c !== 'object') return _0x36956c;
  const _0x2f5515 = Array['isArray'](_0x36956c['tiles'])
    ? _0x36956c['tiles']['map']((_0x444287) => _normalizeImageSaveResult(_0x444287))
    : [];
  return { ..._0x36956c, tiles: _0x2f5515 };
}
export async function saveOutputFromUrl(_0x5ca95a, _0x110a58 = {}) {
  return runDiagnosticOperation('output.save_url', { resourceRef: diagnosticReference(_0x5ca95a) }, () =>
    _saveOutputFromUrl(_0x5ca95a, _0x110a58),
  );
}
async function _saveOutputFromUrl(_0xa7e7b7, _0x285c8a = {}) {
  const _0x5ad7f0 = String(_0xa7e7b7 || '')['trim']();
  if (_shouldFetchClientSideBeforeSaving(_0x5ad7f0))
    try {
      const _0x3f40b9 = await fetchRemoteBlob(_0x5ad7f0);
      return await saveOutputBlob(_0x3f40b9, _0x285c8a);
    } catch (_0x2a3408) {
      return (
        console['error']('[projectService]\x20Client-side\x20output\x20blob\x20save\x20failed:', _0x2a3408),
        { error: 'Client-side\x20output\x20blob\x20save\x20failed:\x20' + _0x2a3408['message'] }
      );
    }
  return _normalizeImageSaveResult(await saveOutputFromUrlToServer({ url: _0x5ad7f0, ..._0x285c8a }));
}
function _guessAudioExtFromUrl(_0x1b2628) {
  try {
    const _0x145d88 = new URL(String(_0x1b2628 || ''), 'http://localhost'),
      _0x450865 = String(_0x145d88['pathname'] || '')['match'](/\.([a-z0-9]{1,5})$/i),
      _0xc1efde = String(_0x450865?.[0x1] || '')['toLowerCase']();
    if (['wav', 'mp3', 'm4a', 'flac', 'aac', 'ogg', 'opus', 'wma', 'amr', 'webm']['includes'](_0xc1efde))
      return _0xc1efde;
  } catch {}
  return '';
}
function _guessAudioExtFromMime(_0x4362e3) {
  const _0x3095e7 = String(_0x4362e3 || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x3095e7) return '';
  if (_0x3095e7 === 'audio/mpeg') return 'mp3';
  if (_0x3095e7 === 'audio/wav' || _0x3095e7 === 'audio/x-wav') return 'wav';
  if (_0x3095e7 === 'audio/mp4' || _0x3095e7 === 'audio/x-m4a') return 'm4a';
  if (_0x3095e7 === 'audio/flac' || _0x3095e7 === 'audio/x-flac') return 'flac';
  if (_0x3095e7 === 'audio/aac') return 'aac';
  if (_0x3095e7 === 'audio/ogg') return 'ogg';
  if (_0x3095e7 === 'audio/opus') return 'opus';
  if (_0x3095e7 === 'audio/webm') return 'webm';
  if (_0x3095e7 === 'audio/amr') return 'amr';
  return '';
}
function _toLocalAudioResult(_0x22590d) {
  const _0x270a4b = normalizeLocalPath(
      _0x22590d?.['localPath'] || _0x22590d?.['originalLocalPath'] || _0x22590d?.['path'],
    ),
    _0x26cf99 = localPathToUrl(_0x270a4b);
  return {
    ...(_0x22590d && typeof _0x22590d === 'object' ? _0x22590d : {}),
    localPath: _0x270a4b,
    localUrl: _0x26cf99,
  };
}
export async function saveRemoteAudioLocallyDetailed(_0xcaaa6b, _0x287d92 = {}) {
  const _0xc0a7ca = String(_0xcaaa6b || '')['trim']();
  if (!_0xc0a7ca) throw new Error('保存音频失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('audio', _0xc0a7ca, _0x287d92), async () => {
    if (_0xc0a7ca['startsWith']('blob:') || _0xc0a7ca['startsWith']('data:')) {
      const _0x2707bd = await fetchRemoteBlob(_0xc0a7ca),
        _0x4e1e6c = _guessAudioExtFromMime(_0x2707bd?.['type']) || 'mp3';
      return _toLocalAudioResult(await saveOutputBlob(_0x2707bd, { ext: _0x4e1e6c, ..._0x287d92 }));
    }
    const _0x55cabb = _guessAudioExtFromUrl(_0xc0a7ca) || 'mp3';
    try {
      return _toLocalAudioResult(
        await saveOutputFromUrl(_0xc0a7ca, { ext: _0x55cabb, maxBytes: 0x400 * 0x400 * 0xc8, ..._0x287d92 }),
      );
    } catch {}
    const _0x204ff0 = await fetchRemoteBlob(_0xc0a7ca),
      _0x1f4f20 = _guessAudioExtFromMime(_0x204ff0?.['type']) || _0x55cabb;
    return _toLocalAudioResult(await saveOutputBlob(_0x204ff0, { ext: _0x1f4f20, ..._0x287d92 }));
  });
}
function _toLocalUrlFromSaveResult(_0x4d5966) {
  return localPathToUrl(_0x4d5966?.['originalLocalPath']) || localPathToUrl(pickResultLocalPath(_0x4d5966));
}
function _stringifyRemoteSaveError(_0x25711b) {
  if (!_0x25711b) return '';
  if (typeof _0x25711b['getUserMessage'] === 'function')
    try {
      const _0x258885 = String(_0x25711b['getUserMessage']() || '')['trim']();
      if (_0x258885) return _0x258885;
    } catch {}
  if (typeof _0x25711b === 'string') return _0x25711b['trim']();
  const _0x49938e =
    _0x25711b?.['message'] ||
    _0x25711b?.['errorMessage'] ||
    _0x25711b?.['error_message'] ||
    _0x25711b?.['reason'] ||
    _0x25711b?.['detail'] ||
    _0x25711b?.['details'] ||
    _0x25711b?.['error'];
  if (_0x49938e !== undefined && _0x49938e !== null && _0x49938e !== _0x25711b)
    return _stringifyRemoteSaveError(_0x49938e);
  try {
    return JSON['stringify'](_0x25711b);
  } catch {
    return String(_0x25711b || '')['trim']();
  }
}
function _createRemoteImageSaveError({
  serverError: serverError = null,
  clientError: clientError = null,
} = {}) {
  const _0x5c356a = [],
    _0x43e618 = _stringifyRemoteSaveError(serverError),
    _0x5a10ca = _stringifyRemoteSaveError(clientError);
  if (_0x43e618) _0x5c356a['push']('服务端下载失败：' + _0x43e618);
  if (_0x5a10ca) _0x5c356a['push']('浏览器下载失败：' + _0x5a10ca);
  const _0x5a8af2 = new Error(
    _0x5c356a['length'] > 0x0 ? '保存到本地失败：' + _0x5c356a['join']('；') : '保存到本地失败',
  );
  return (
    (_0x5a8af2['serverError'] = serverError || null),
    (_0x5a8af2['clientError'] = clientError || null),
    _0x5a8af2
  );
}
function _normalizeImageSaveResult(_0x101d00) {
  if (!_0x101d00 || typeof _0x101d00 !== 'object') return _0x101d00;
  if (!hasImageDerivativeFields(_0x101d00)) return _0x101d00;
  const _0x506be1 = buildImageNodeStorageFields(_0x101d00),
    _0x822e1d = { ..._0x101d00, ..._0x506be1 };
  return (
    !String(_0x822e1d['url'] || '')['trim']() &&
      _0x506be1['localPath'] &&
      (_0x822e1d['url'] = toLocalPathUrl(_0x506be1['localPath'])),
    !String(_0x822e1d['originalUrl'] || '')['trim']() &&
      _0x506be1['originalLocalPath'] &&
      (_0x822e1d['originalUrl'] = toLocalPathUrl(_0x506be1['originalLocalPath'])),
    !String(_0x822e1d['displayUrl'] || '')['trim']() &&
      _0x506be1['displayLocalPath'] &&
      (_0x822e1d['displayUrl'] = toLocalPathUrl(_0x506be1['displayLocalPath'])),
    !String(_0x822e1d['thumbUrl'] || '')['trim']() &&
      _0x506be1['thumbLocalPath'] &&
      (_0x822e1d['thumbUrl'] = toLocalPathUrl(_0x506be1['thumbLocalPath'])),
    _0x822e1d
  );
}
function _guessImageExtFromUrl(_0x5c986c) {
  const _0x3d0c63 = String(_0x5c986c || '')['trim']();
  if (!_0x3d0c63) return '';
  try {
    const _0x50c70d = new URL(_0x3d0c63, window['location']['href']),
      _0x122b78 = String(_0x50c70d['pathname'] || ''),
      _0x3b9130 = _0x122b78['match'](/\.([a-z0-9]{1,5})$/i),
      _0x47bdcd = (_0x3b9130?.[0x1] || '')['toLowerCase']();
    if (!_0x47bdcd) return '';
    if (_0x47bdcd === 'jpeg') return 'jpg';
    if (_0x47bdcd === 'jpg') return 'jpg';
    if (_0x47bdcd === 'png') return 'png';
    if (_0x47bdcd === 'webp') return 'webp';
    if (_0x47bdcd === 'gif') return 'gif';
    return '';
  } catch {
    return '';
  }
}
export async function ensureLocalImageDerivatives(_0x4f1865) {
  return _normalizeImageSaveResult(await ensureImageDerivativesToServer({ localPath: _0x4f1865 }));
}
export async function checkLocalMediaExists(_0x9e8188) {
  return await checkLocalMediaExistsOnServer({ localPath: _0x9e8188 });
}
export async function saveRemoteImageLocallyDetailed(_0x29c016, _0x1e26a7, _0x1d3829 = {}) {
  const _0x25afe3 = String(_0x29c016 || '')['trim']();
  if (!_0x25afe3) throw new Error('保存到本地失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('image', _0x25afe3, _0x1d3829), async () => {
    if (_0x25afe3['startsWith']('blob:') || _0x25afe3['startsWith']('data:')) {
      let _0x2e58fe = null;
      try {
        const _0x2033f1 = await fetchRemoteBlob(_0x25afe3);
        let _0x573980 = 'png';
        if (_0x2033f1['type'] === 'image/jpeg') _0x573980 = 'jpg';
        else {
          if (_0x2033f1['type'] === 'image/webp') _0x573980 = 'webp';
          else {
            if (_0x2033f1['type'] === 'image/png') _0x573980 = 'png';
            else {
              if (_0x2033f1['type'] === 'image/gif') _0x573980 = 'gif';
            }
          }
        }
        const _0x26fd7f = await saveOutputBlob(_0x2033f1, { ext: _0x573980, ..._0x1d3829 }),
          _0x2fea20 = _toLocalUrlFromSaveResult(_0x26fd7f);
        if (_0x2fea20) return { ..._0x26fd7f, localUrl: _0x2fea20 };
        throw new Error('服务器未返回本地路径');
      } catch (_0x57edaa) {
        _0x2e58fe = _0x57edaa;
      }
      throw _createRemoteImageSaveError({ clientError: _0x2e58fe });
    }
    let _0x1c6011 = null;
    try {
      const _0x505726 = _guessImageExtFromUrl(_0x25afe3) || 'png',
        _0x511b00 = await saveOutputFromUrl(_0x25afe3, {
          ext: _0x505726,
          maxBytes: REMOTE_IMAGE_MAX_BYTES,
          ..._0x1d3829,
        }),
        _0x55fac6 = _toLocalUrlFromSaveResult(_0x511b00);
      if (_0x55fac6) return { ..._0x511b00, localUrl: _0x55fac6 };
      throw new Error('服务器未返回本地路径');
    } catch (_0x3e25f4) {
      _0x1c6011 = _0x3e25f4;
    }
    try {
      const _0x7e476f = await fetchRemoteBlob(_0x25afe3);
      let _0x34d94b = 'png';
      if (_0x7e476f['type'] === 'image/jpeg') _0x34d94b = 'jpg';
      else {
        if (_0x7e476f['type'] === 'image/webp') _0x34d94b = 'webp';
        else {
          if (_0x7e476f['type'] === 'image/png') _0x34d94b = 'png';
          else {
            if (_0x7e476f['type'] === 'image/gif') _0x34d94b = 'gif';
          }
        }
      }
      const _0x328ebe = await saveOutputBlob(_0x7e476f, { ext: _0x34d94b, ..._0x1d3829 }),
        _0x1d5d8f = _toLocalUrlFromSaveResult(_0x328ebe);
      if (_0x1d5d8f) return { ..._0x328ebe, localUrl: _0x1d5d8f };
      throw new Error('服务器未返回本地路径');
    } catch (_0x233be3) {
      throw _createRemoteImageSaveError({ serverError: _0x1c6011, clientError: _0x233be3 });
    }
  });
}
export async function saveRemoteImageLocally(_0x3e58c2, _0xa0ae27, _0x44227e = {}) {
  const _0x4ad3ae = await saveRemoteImageLocallyDetailed(_0x3e58c2, _0xa0ae27, _0x44227e);
  return String(_0x4ad3ae?.['localUrl'] || '')['trim']() || _toLocalUrlFromSaveResult(_0x4ad3ae);
}
export function exportProject(_0x304bc0, _0x5db60c) {
  return saveTextDownload({
    filename: _0x304bc0 + '.aicanvas',
    content: JSON['stringify'](_0x5db60c, null, 0x2),
    mimeType: 'application/json',
    filterName: 'SHUO Canvas Project',
  });
}
export async function importProject(_0x9b8858) {
  return new Promise((_0xab9e1f, _0x275b20) => {
    const _0x56d26f = new FileReader();
    ((_0x56d26f['onload'] = (_0x47534d) => {
      try {
        const _0x5b3301 = JSON['parse'](_0x47534d['target']['result']),
          _0x226628 = resolveCanvasData(_0x5b3301);
        _0xab9e1f(_0x226628);
      } catch (_0x4a1628) {
        _0x275b20(new Error('解析\x20JSON\x20存档失败'));
      }
    }),
      (_0x56d26f['onerror'] = () => _0x275b20(new Error('文件读取失败'))),
      _0x56d26f['readAsText'](_0x9b8858));
  });
}
