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
function stripProjectFileExtension(value) {
  return String(value || '')['replace'](PROJECT_FILE_EXTENSION_RE, '');
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
    ({ projectId: projectId, payload: payload, activeIdentity: activeIdentity }) =>
      _persistProjectSnapshot(projectId, payload, activeIdentity),
  );
let _projectPersistenceBlockedReason = '';
export function setProjectPersistenceBlocked(item = '项目尚未安全加载') {
  _projectPersistenceBlockedReason = String(item || '项目尚未安全加载')['trim']();
}
export function clearProjectPersistenceBlock() {
  _projectPersistenceBlockedReason = '';
}
export function isProjectPersistenceBlocked() {
  return !!_projectPersistenceBlockedReason;
}
function _isLocalRelativeUrl(key) {
  const enabled = String(key || '')['trim']();
  return enabled['startsWith']('/') && !enabled['startsWith']('//');
}
function _shouldFetchClientSideBeforeSaving(index) {
  const result = String(index || '')['trim']();
  return result['startsWith']('blob:') || result['startsWith']('data:') || _isLocalRelativeUrl(result);
}
function _buildRemoteSaveCacheKey(data, options, target = {}) {
  const source = String(options || '')['trim'](),
    next = String(target?.['dedupeKey'] || (target?.['taskKey'] ? target['taskKey'] + ':' + source : source))[
      'trim'
    ]();
  return (String(data || 'media')['trim']() || 'media') + ':' + (next || source);
}
function _rememberRemoteSave(enabled2, enabled3) {
  if (!enabled2 || !enabled3 || typeof enabled3 !== 'object') return;
  _remoteSaveCache['set'](enabled2, enabled3);
  if (_remoteSaveCache['size'] > REMOTE_SAVE_CACHE_LIMIT) {
    const current = _remoteSaveCache['keys']()['next']()['value'];
    if (current) _remoteSaveCache['delete'](current);
  }
}
function _runRemoteSaveOnce(entry, record) {
  if (_remoteSaveCache['has'](entry)) return Promise['resolve'](_remoteSaveCache['get'](entry));
  if (_remoteSaveInflight['has'](entry)) return _remoteSaveInflight['get'](entry);
  const promise = Promise['resolve']()
    ['then'](record)
    ['then']((handle) => {
      return (_rememberRemoteSave(entry, handle), handle);
    });
  return (
    _remoteSaveInflight['set'](entry, promise),
    promise['finally'](() => {
      _remoteSaveInflight['get'](entry) === promise && _remoteSaveInflight['delete'](entry);
    })['catch'](() => {}),
    promise
  );
}
function _isPlainObject(enabled4) {
  return !!enabled4 && typeof enabled4 === 'object' && !Array['isArray'](enabled4);
}
function _migratePanoramaNodeInPlace(error) {
  if (!_isPlainObject(error)) return;
  const state = String(error['type'] || '')['trim']();
  if (isPanorama360NodeType(state)) {
    error['type'] = PANORAMA_360_NODE_TYPE;
    const _isPlainObject2 = _isPlainObject(error['panorama360Node'])
      ? error['panorama360Node']
      : error['sceneNode'];
    ((error['panorama360Node'] = normalizePanorama360State(_isPlainObject2)), delete error['sceneNode']);
    !String(error['name'] || '')['trim']() && (error['name'] = getPanorama360DefaultName());
    return;
  }
  if (!isPanoramaSceneNodeType(state)) return;
  error['type'] = PANORAMA_SCENE_NODE_TYPE;
  const _isPlainObject3 = _isPlainObject(error['sceneNode']) ? error['sceneNode'] : error['panorama360Node'],
    sceneOnlyPanoramaSceneState = normalizeSceneOnlyPanoramaSceneState(_isPlainObject3),
    config = String(_isPlainObject3?.['mode'] || '')
      ['trim']()
      ['toLowerCase'](),
    scope = config === 'panorama';
  if (scope) {
    ((error['type'] = PANORAMA_360_NODE_TYPE),
      (error['panorama360Node'] = normalizePanorama360State(_isPlainObject3)),
      delete error['sceneNode']);
    const enabled5 = String(error['name'] || '')['trim'](),
      panoramaSceneDefaultName = getPanoramaSceneDefaultName();
    (!enabled5 || enabled5 === PANORAMA_SCENE_DEFAULT_NAME || enabled5 === panoramaSceneDefaultName) &&
      (error['name'] = getPanorama360DefaultName());
    return;
  }
  ((error['sceneNode'] = sceneOnlyPanoramaSceneState),
    delete error['panorama360Node'],
    !String(error['name'] || '')['trim']() && (error['name'] = getPanoramaSceneDefaultName()));
}
function _migrateCanvasDataInPlace(input) {
  const output = Array['isArray'](input?.['canvases']) ? input['canvases'] : [];
  for (const enabled6 of output) {
    if (!enabled6) continue;
    if (enabled6['nodes'] && !Array['isArray'](enabled6['nodes']))
      enabled6['nodes'] = Object['values'](enabled6['nodes']);
    if (enabled6['edges'] && !Array['isArray'](enabled6['edges']))
      enabled6['edges'] = Object['values'](enabled6['edges']);
    const list = Array['isArray'](enabled6['nodes']) ? enabled6['nodes'] : [],
      map = new Set(
        list['filter']((value2) => RETIRED_CANVAS_NODE_TYPES['has'](String(value2?.['type'] || '')))
          ['map']((value3) => String(value3?.['id'] || ''))
          ['filter'](Boolean),
      );
    enabled6['nodes'] = list['filter'](
      (value4) => !RETIRED_CANVAS_NODE_TYPES['has'](String(value4?.['type'] || '')),
    );
    map['size'] > 0x0 &&
      (enabled6['edges'] = (Array['isArray'](enabled6['edges']) ? enabled6['edges'] : [])['filter'](
        (value5) =>
          !map['has'](String(value5?.['sourceId'] || '')) && !map['has'](String(value5?.['targetId'] || '')),
      ));
    for (const value6 of enabled6['nodes']) {
      _migratePanoramaNodeInPlace(value6);
    }
  }
  return input;
}
const getCssVar = (value7) =>
  getComputedStyle(document['documentElement'])['getPropertyValue'](value7)['trim']();
export function resolveCanvasData(canvases) {
  if (!canvases)
    return _migrateCanvasDataInPlace({
      canvases: [
        { id: 'canvas_1', name: '默认画布', nodes: [], edges: [], viewport: { x: 0x0, y: 0x0, zoom: 1.1 } },
      ],
      activeCanvasId: 'canvas_1',
    });
  if (Array['isArray'](canvases['canvases']) && canvases['canvases']['length'] > 0x0) {
    let activeCanvasId = canvases['activeCanvasId'] || canvases['canvases'][0x0]['id'];
    const enabled7 = canvases['canvases']['find']((value8) => value8['id'] === activeCanvasId);
    if (
      enabled7 &&
      (!enabled7['nodes'] || enabled7['nodes']['length'] === 0x0) &&
      (!enabled7['storyboard3dProjects'] || enabled7['storyboard3dProjects']['length'] === 0x0)
    ) {
      const value9 = canvases['canvases']['find'](
        (state2) =>
          (state2['nodes'] && state2['nodes']['length'] > 0x0) ||
          (state2['storyboard3dProjects'] && state2['storyboard3dProjects']['length'] > 0x0),
      );
      if (value9) activeCanvasId = value9['id'];
    }
    return _migrateCanvasDataInPlace({ canvases: canvases['canvases'], activeCanvasId: activeCanvasId });
  }
  let nodes = canvases['nodes'] || canvases['v2_nodes'] || [],
    edges = canvases['edges'] || canvases['v2_edges'] || [];
  if (!Array['isArray'](nodes)) nodes = Object['values'](nodes);
  if (!Array['isArray'](edges)) edges = Object['values'](edges);
  const value10 = {
    id: 'canvas_1',
    name: '默认画布',
    nodes: nodes,
    edges: edges,
    viewport: canvases['viewport'] || { x: 0x0, y: 0x0, zoom: 1.1 },
  };
  return _migrateCanvasDataInPlace({ canvases: [value10], activeCanvasId: 'canvas_1' });
}
export async function loadProject(value11, { allowMissing: allowMissing = ![] } = {}) {
  try {
    return await loadProjectStrict(value11);
  } catch (value12) {
    console['error']('[projectService] 加载项目异常:', value12);
    if (allowMissing === !![] && value12?.['code'] === 'PROJECT_NOT_FOUND') return resolveCanvasData({});
    throw value12;
  }
}
export async function loadProjectStrict(value13) {
  return runDiagnosticOperation('project.load', { projectRef: diagnosticReference(value13) }, () =>
    _loadProjectStrict(value13),
  );
}
async function _loadProjectStrict(value14) {
  const value15 = PROJECT_FILE_EXTENSION_RE['test'](String(value14 || '')) ? value14 : value14 + '.aicanvas',
    fetchV2ProjectFromServer2 = await fetchV2ProjectFromServer(value14);
  if (!fetchV2ProjectFromServer2) {
    const error2 = new Error('Project file not found: ' + value15);
    error2['code'] = 'PROJECT_NOT_FOUND';
    throw error2;
  }
  const canvasData = resolveCanvasData(fetchV2ProjectFromServer2);
  return (
    console['log'](
      '[projectService]\x20项目\x20' +
        value14 +
        ' 已加载，共 ' +
        canvasData['canvases']['length'] +
        '\x20个画布页面',
    ),
    canvasData
  );
}
async function _persistProjectSnapshot(value16, value17, value18) {
  try {
    const response = await saveV2ProjectToServer(value17),
      enabled8 = globalThis['window']?.['CanvasTabManager'],
      value19 = enabled8?.['getActiveCanvasId']?.() || enabled8?.['_activeId'],
      value20 = !enabled8 || value19 === value17['activeCanvasId'];
    return (
      response &&
        response['success'] &&
        value20 &&
        _getActiveProjectIdentity() === value18 &&
        ((window['_v2CurrentFile'] = response['filename']),
        (window['currentProjectId'] = stripProjectFileExtension(response['filename'])),
        _clearElectronRecoverySnapshotAfterSave()),
      console['log'](
        '[projectService]\x20项目\x20' +
          value16 +
          ' 已持久化（' +
          value17['canvases']['length'] +
          ' 个画布）',
      ),
      response
    );
  } catch (value21) {
    console['error']('[projectService] 存档异常:', value21);
    throw value21;
  }
}
export async function saveProject(value22, value23) {
  return runDiagnosticOperation(
    'project.save',
    {
      projectRef: diagnosticReference(value22),
      canvasCount: Array['isArray'](value23?.['canvases']) ? value23['canvases']['length'] : 0x0,
    },
    () => _saveProject(value22, value23),
  );
}
async function _saveProject(value24, value25) {
  assertCanvasProjectSaveAllowed(value25);
  if (_projectPersistenceBlockedReason) throw new Error(_projectPersistenceBlockedReason);
  const activeIdentity2 = _getActiveProjectIdentity(),
    activeCanvasId2 = sanitizeMultiCanvasDataForPersistence(value25 || {}),
    projectName = value24 || DEFAULT_PROJECT_NAME,
    payload2 = {
      projectName: projectName,
      activeCanvasId: activeCanvasId2?.['activeCanvasId'] || 'canvas_1',
      canvases: activeCanvasId2?.['canvases'] || [],
    },
    stripProjectFileExtension2 = stripProjectFileExtension(String(projectName))['trim']()['toLowerCase']();
  return await enqueueProjectSave(stripProjectFileExtension2, {
    projectId: projectName,
    payload: payload2,
    activeIdentity: activeIdentity2,
  });
}
export async function getProjects() {
  try {
    return await fetchV2ProjectsFromServer();
  } catch {
    return [];
  }
}
export async function deleteProject(value26) {
  try {
    return await deleteV2ProjectFromServer(value26);
  } catch (value27) {
    return (console['error']('[projectService] 删除项目失败:', value27), ![]);
  }
}
function _getElectronImportAsset() {
  if (!desktopBridge['assetImport']['canImportAsset']()) return null;
  return (value28) => desktopBridge['assetImport']['importAsset'](value28);
}
function _clearElectronRecoverySnapshotAfterSave() {
  if (!desktopBridge['project']['isAvailable']()) return;
  void Promise['resolve']()
    ['then'](() => desktopBridge['project']['clearRecoverySnapshot']())
    ['catch']((value29) => {
      console['warn']('[projectService] 清理恢复快照失败:', value29);
    });
}
function _getElectronPathForFile(value30) {
  if (!desktopBridge['assetImport']['isAvailable']()) return '';
  const value31 = String(value30?.['path'] || '')['trim']();
  if (value31) return value31;
  try {
    return String(desktopBridge['assetImport']['getPathForFile'](value30) || '')['trim']();
  } catch {
    return '';
  }
}
async function _importAssetWithElectron(name, projectId2) {
  const run = _getElectronImportAsset();
  if (!run || !name) return null;
  const value32 = {
      name: name['name'] || 'asset',
      type: name['type'] || '',
      projectId: projectId2,
    },
    _getElectronPathForFile2 = _getElectronPathForFile(name);
  if (_getElectronPathForFile2) value32['path'] = _getElectronPathForFile2;
  else {
    if (typeof name['arrayBuffer'] === 'function') value32['bytes'] = await name['arrayBuffer']();
    else return null;
  }
  return _normalizeImageSaveResult(await run(value32));
}
export function importLocalStagedAsset(value33, projectId3 = {}) {
  const localPath = normalizeLocalPath(value33);
  if (!localPath['startsWith']('data/uploads/'))
    throw new Error('Only\x20staged\x20local\x20uploads\x20can\x20be\x20imported\x20as\x20assets');
  if (!desktopBridge['isChromeShell']) return null;
  const run2 = _getElectronImportAsset();
  if (!run2) return null;
  const value34 = _localStagedAssetImportInflight['get'](localPath);
  if (value34) return value34;
  const value35 = Promise['resolve']()
    ['then'](() =>
      run2({
        name: String(projectId3?.['name'] || '')['trim']() || localPath['split']('/')['pop']() || 'asset',
        type: String(projectId3?.['type'] || '')['trim'](),
        projectId: projectId3?.['projectId'],
        localPath: localPath,
      }),
    )
    ['then']((cause) => {
      const response2 = _normalizeImageSaveResult(cause);
      if (!response2?.['success'])
        throw new Error(
          '本地素材导入失败：' +
            (_stringifyRemoteSaveError(cause?.['error'] || cause?.['message']) ||
              '素材服务未确认导入成功，请重试'),
          { cause: cause },
        );
      return response2;
    })
    ['finally'](() => {
      _localStagedAssetImportInflight['get'](localPath) === value35 &&
        _localStagedAssetImportInflight['delete'](localPath);
    });
  return (_localStagedAssetImportInflight['set'](localPath, value35), value35);
}
async function _importStagedChromeShellAsset(name2, projectId4) {
  if (!desktopBridge['isChromeShell'] || !name2) return null;
  const cause2 = _normalizeImageSaveResult(await stageAssetUploadToServer(name2)),
    resultLocalPath = pickResultLocalPath(cause2) || urlToLocalPath(cause2?.['url']);
  if (!resultLocalPath)
    throw new Error(
      '素材暂存失败：' +
        (_stringifyRemoteSaveError(cause2?.['error'] || cause2?.['message']) ||
          '本地服务未返回暂存文件路径，请重试'),
      { cause: cause2 },
    );
  try {
    const importLocalStagedAsset2 = await importLocalStagedAsset(resultLocalPath, {
      name: name2['name'] || cause2?.['filename'] || 'asset',
      type: name2['type'] || '',
      projectId: projectId4,
    });
    return (
      cause2?.['stageId'] && void discardStagedAssetUploadToServer(cause2['stageId'])['catch'](() => {}),
      importLocalStagedAsset2
    );
  } catch (error3) {
    if (
      !String(name2['type'] || '')
        ['toLowerCase']()
        ['startsWith']('video/')
    )
      throw error3;
    return {
      ...cause2,
      success: !![],
      stagedUploadId: cause2['stageId'] || '',
      canonicalImportPending: !![],
      canonicalImportStatus: 'failed',
      canonicalImportError: String(error3?.['message'] || error3 || ''),
    };
  }
}
export function discardLocalStagedAsset(value36) {
  return discardStagedAssetUploadToServer(value36);
}
export async function uploadFile(value37, value38) {
  return runDiagnosticOperation(
    'asset.upload',
    { projectRef: diagnosticReference(value38), sizeBytes: Number(value37?.['size'] || 0x0) },
    () => _uploadFile(value37, value38),
  );
}
async function _uploadFile(value39, value40) {
  try {
    const _getElectronPathForFile3 = _getElectronPathForFile(value39);
    if (desktopBridge['isChromeShell'] && !_getElectronPathForFile3) {
      const cause3 = await _importStagedChromeShellAsset(value39, value40);
      if (cause3?.['success']) return cause3;
      throw new Error(
        '本地素材导入失败：' +
          (_stringifyRemoteSaveError(cause3?.['error'] || cause3?.['message']) ||
            '素材服务未确认导入成功，请重试'),
        { cause: cause3 },
      );
    }
    try {
      const response3 = await _importAssetWithElectron(value39, value40);
      if (response3?.['success']) return response3;
    } catch (value41) {
      console['warn']('[projectService] Electron 素材导入失败，回退上传流程:', value41);
    }
    return _normalizeImageSaveResult(await uploadFileToServer(value39));
  } catch (value42) {
    console['error']('[projectService] 文件上传异常:', value42);
    throw value42;
  }
}
export async function saveOutputBlob(value43, value44 = {}) {
  return runDiagnosticOperation(
    'output.save_blob',
    { sizeBytes: Number(value43?.['size'] || 0x0) },
    async () => _normalizeImageSaveResult(await saveOutputToServer(value43, value44)),
  );
}
export async function cropGridTiles(options2 = {}) {
  const args = await cropGridTilesToServer(options2);
  if (!args || typeof args !== 'object') return args;
  const tiles = Array['isArray'](args['tiles'])
    ? args['tiles']['map']((value45) => _normalizeImageSaveResult(value45))
    : [];
  return { ...args, tiles: tiles };
}
export async function saveOutputFromUrl(value46, value47 = {}) {
  return runDiagnosticOperation('output.save_url', { resourceRef: diagnosticReference(value46) }, () =>
    _saveOutputFromUrl(value46, value47),
  );
}
async function _saveOutputFromUrl(value48, args2 = {}) {
  const url = String(value48 || '')['trim']();
  if (_shouldFetchClientSideBeforeSaving(url))
    try {
      const fetchRemoteBlob2 = await fetchRemoteBlob(url);
      return await saveOutputBlob(fetchRemoteBlob2, args2);
    } catch (error4) {
      return (
        console['error']('[projectService]\x20Client-side\x20output\x20blob\x20save\x20failed:', error4),
        { error: 'Client-side\x20output\x20blob\x20save\x20failed:\x20' + error4['message'] }
      );
    }
  return _normalizeImageSaveResult(await saveOutputFromUrlToServer({ url: url, ...args2 }));
}
function _guessAudioExtFromUrl(value49) {
  try {
    const uRL = new URL(String(value49 || ''), 'http://localhost'),
      value50 = String(uRL['pathname'] || '')['match'](/\.([a-z0-9]{1,5})$/i),
      value51 = String(value50?.[0x1] || '')['toLowerCase']();
    if (['wav', 'mp3', 'm4a', 'flac', 'aac', 'ogg', 'opus', 'wma', 'amr', 'webm']['includes'](value51))
      return value51;
  } catch {}
  return '';
}
function _guessAudioExtFromMime(value52) {
  const enabled9 = String(value52 || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled9) return '';
  if (enabled9 === 'audio/mpeg') return 'mp3';
  if (enabled9 === 'audio/wav' || enabled9 === 'audio/x-wav') return 'wav';
  if (enabled9 === 'audio/mp4' || enabled9 === 'audio/x-m4a') return 'm4a';
  if (enabled9 === 'audio/flac' || enabled9 === 'audio/x-flac') return 'flac';
  if (enabled9 === 'audio/aac') return 'aac';
  if (enabled9 === 'audio/ogg') return 'ogg';
  if (enabled9 === 'audio/opus') return 'opus';
  if (enabled9 === 'audio/webm') return 'webm';
  if (enabled9 === 'audio/amr') return 'amr';
  return '';
}
function _toLocalAudioResult(value53) {
  const localPath2 = normalizeLocalPath(
      value53?.['localPath'] || value53?.['originalLocalPath'] || value53?.['path'],
    ),
    localUrl = localPathToUrl(localPath2);
  return {
    ...(value53 && typeof value53 === 'object' ? value53 : {}),
    localPath: localPath2,
    localUrl: localUrl,
  };
}
export async function saveRemoteAudioLocallyDetailed(value54, args3 = {}) {
  const enabled10 = String(value54 || '')['trim']();
  if (!enabled10) throw new Error('保存音频失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('audio', enabled10, args3), async () => {
    if (enabled10['startsWith']('blob:') || enabled10['startsWith']('data:')) {
      const fetchRemoteBlob3 = await fetchRemoteBlob(enabled10),
        ext = _guessAudioExtFromMime(fetchRemoteBlob3?.['type']) || 'mp3';
      return _toLocalAudioResult(await saveOutputBlob(fetchRemoteBlob3, { ext: ext, ...args3 }));
    }
    const ext2 = _guessAudioExtFromUrl(enabled10) || 'mp3';
    try {
      return _toLocalAudioResult(
        await saveOutputFromUrl(enabled10, { ext: ext2, maxBytes: 0x400 * 0x400 * 0xc8, ...args3 }),
      );
    } catch {}
    const fetchRemoteBlob4 = await fetchRemoteBlob(enabled10),
      ext3 = _guessAudioExtFromMime(fetchRemoteBlob4?.['type']) || ext2;
    return _toLocalAudioResult(await saveOutputBlob(fetchRemoteBlob4, { ext: ext3, ...args3 }));
  });
}
function _toLocalUrlFromSaveResult(value55) {
  return localPathToUrl(value55?.['originalLocalPath']) || localPathToUrl(pickResultLocalPath(value55));
}
function _stringifyRemoteSaveError(error5) {
  if (!error5) return '';
  if (typeof error5['getUserMessage'] === 'function')
    try {
      const value56 = String(error5['getUserMessage']() || '')['trim']();
      if (value56) return value56;
    } catch {}
  if (typeof error5 === 'string') return error5['trim']();
  const value57 =
    error5?.['message'] ||
    error5?.['errorMessage'] ||
    error5?.['error_message'] ||
    error5?.['reason'] ||
    error5?.['detail'] ||
    error5?.['details'] ||
    error5?.['error'];
  if (value57 !== undefined && value57 !== null && value57 !== error5)
    return _stringifyRemoteSaveError(value57);
  try {
    return JSON['stringify'](error5);
  } catch {
    return String(error5 || '')['trim']();
  }
}
function _createRemoteImageSaveError({
  serverError: serverError = null,
  clientError: clientError = null,
} = {}) {
  const list2 = [],
    _stringifyRemoteSaveError2 = _stringifyRemoteSaveError(serverError),
    _stringifyRemoteSaveError3 = _stringifyRemoteSaveError(clientError);
  if (_stringifyRemoteSaveError2) list2['push']('服务端下载失败：' + _stringifyRemoteSaveError2);
  if (_stringifyRemoteSaveError3) list2['push']('浏览器下载失败：' + _stringifyRemoteSaveError3);
  const error6 = new Error(
    list2['length'] > 0x0 ? '保存到本地失败：' + list2['join']('；') : '保存到本地失败',
  );
  return (
    (error6['serverError'] = serverError || null),
    (error6['clientError'] = clientError || null),
    error6
  );
}
function _normalizeImageSaveResult(args4) {
  if (!args4 || typeof args4 !== 'object') return args4;
  if (!hasImageDerivativeFields(args4)) return args4;
  const args5 = buildImageNodeStorageFields(args4),
    response4 = { ...args4, ...args5 };
  return (
    !String(response4['url'] || '')['trim']() &&
      args5['localPath'] &&
      (response4['url'] = toLocalPathUrl(args5['localPath'])),
    !String(response4['originalUrl'] || '')['trim']() &&
      args5['originalLocalPath'] &&
      (response4['originalUrl'] = toLocalPathUrl(args5['originalLocalPath'])),
    !String(response4['displayUrl'] || '')['trim']() &&
      args5['displayLocalPath'] &&
      (response4['displayUrl'] = toLocalPathUrl(args5['displayLocalPath'])),
    !String(response4['thumbUrl'] || '')['trim']() &&
      args5['thumbLocalPath'] &&
      (response4['thumbUrl'] = toLocalPathUrl(args5['thumbLocalPath'])),
    response4
  );
}
function _guessImageExtFromUrl(value58) {
  const enabled11 = String(value58 || '')['trim']();
  if (!enabled11) return '';
  try {
    const uRL2 = new URL(enabled11, window['location']['href']),
      value59 = String(uRL2['pathname'] || ''),
      value60 = value59['match'](/\.([a-z0-9]{1,5})$/i),
      enabled12 = (value60?.[0x1] || '')['toLowerCase']();
    if (!enabled12) return '';
    if (enabled12 === 'jpeg') return 'jpg';
    if (enabled12 === 'jpg') return 'jpg';
    if (enabled12 === 'png') return 'png';
    if (enabled12 === 'webp') return 'webp';
    if (enabled12 === 'gif') return 'gif';
    return '';
  } catch {
    return '';
  }
}
export async function ensureLocalImageDerivatives(localPath3) {
  return _normalizeImageSaveResult(await ensureImageDerivativesToServer({ localPath: localPath3 }));
}
export async function checkLocalMediaExists(localPath4) {
  return await checkLocalMediaExistsOnServer({ localPath: localPath4 });
}
export async function saveRemoteImageLocallyDetailed(value61, value62, args6 = {}) {
  const enabled13 = String(value61 || '')['trim']();
  if (!enabled13) throw new Error('保存到本地失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('image', enabled13, args6), async () => {
    if (enabled13['startsWith']('blob:') || enabled13['startsWith']('data:')) {
      let clientError2 = null;
      try {
        const fetchRemoteBlob5 = await fetchRemoteBlob(enabled13);
        let ext4 = 'png';
        if (fetchRemoteBlob5['type'] === 'image/jpeg') ext4 = 'jpg';
        else {
          if (fetchRemoteBlob5['type'] === 'image/webp') ext4 = 'webp';
          else {
            if (fetchRemoteBlob5['type'] === 'image/png') ext4 = 'png';
            else {
              if (fetchRemoteBlob5['type'] === 'image/gif') ext4 = 'gif';
            }
          }
        }
        const args7 = await saveOutputBlob(fetchRemoteBlob5, { ext: ext4, ...args6 }),
          localUrl2 = _toLocalUrlFromSaveResult(args7);
        if (localUrl2) return { ...args7, localUrl: localUrl2 };
        throw new Error('服务器未返回本地路径');
      } catch (value63) {
        clientError2 = value63;
      }
      throw _createRemoteImageSaveError({ clientError: clientError2 });
    }
    let serverError2 = null;
    try {
      const ext5 = _guessImageExtFromUrl(enabled13) || 'png',
        args8 = await saveOutputFromUrl(enabled13, {
          ext: ext5,
          maxBytes: REMOTE_IMAGE_MAX_BYTES,
          ...args6,
        }),
        localUrl3 = _toLocalUrlFromSaveResult(args8);
      if (localUrl3) return { ...args8, localUrl: localUrl3 };
      throw new Error('服务器未返回本地路径');
    } catch (value64) {
      serverError2 = value64;
    }
    try {
      const fetchRemoteBlob6 = await fetchRemoteBlob(enabled13);
      let ext6 = 'png';
      if (fetchRemoteBlob6['type'] === 'image/jpeg') ext6 = 'jpg';
      else {
        if (fetchRemoteBlob6['type'] === 'image/webp') ext6 = 'webp';
        else {
          if (fetchRemoteBlob6['type'] === 'image/png') ext6 = 'png';
          else {
            if (fetchRemoteBlob6['type'] === 'image/gif') ext6 = 'gif';
          }
        }
      }
      const args9 = await saveOutputBlob(fetchRemoteBlob6, { ext: ext6, ...args6 }),
        localUrl4 = _toLocalUrlFromSaveResult(args9);
      if (localUrl4) return { ...args9, localUrl: localUrl4 };
      throw new Error('服务器未返回本地路径');
    } catch (clientError3) {
      throw _createRemoteImageSaveError({ serverError: serverError2, clientError: clientError3 });
    }
  });
}
export async function saveRemoteImageLocally(value65, value66, value67 = {}) {
  const saveRemoteImageLocallyDetailed2 = await saveRemoteImageLocallyDetailed(value65, value66, value67);
  return (
    String(saveRemoteImageLocallyDetailed2?.['localUrl'] || '')['trim']() ||
    _toLocalUrlFromSaveResult(saveRemoteImageLocallyDetailed2)
  );
}
export function exportProject(filename, value68) {
  return saveTextDownload({
    filename: filename + '.aicanvas',
    content: JSON['stringify'](value68, null, 0x2),
    mimeType: 'application/json',
    filterName: 'SHUO Canvas Project',
  });
}
export async function importProject(value69) {
  return new Promise((handler, handler2) => {
    const fileReader = new FileReader();
    ((fileReader['onload'] = (event) => {
      try {
        const value70 = JSON['parse'](event['target']['result']),
          canvasData2 = resolveCanvasData(value70);
        handler(canvasData2);
      } catch (value71) {
        handler2(new Error('解析\x20JSON\x20存档失败'));
      }
    }),
      (fileReader['onerror'] = () => handler2(new Error('文件读取失败'))),
      fileReader['readAsText'](value69));
  });
}
