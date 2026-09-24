import {
  cropGridTilesToServer,
  checkLocalMediaExistsOnServer,
  deleteV2ProjectFromServer,
  ensureImageDerivativesToServer,
  fetchRemoteBlob,
  fetchV2ProjectFromServer,
  fetchV2ProjectsFromServer,
  saveV2ProjectToServer,
  saveOutputFromUrlToServer,
  saveOutputToServer,
  uploadFileToServer,
} from '../../api/projectsV2Api.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { readProjectDocument } from './projectDocumentGuard.js';
import { captureRecoverySnapshotBeforeSave, clearRecoverySnapshotAfterSave } from './recoverySnapshotSaveGuard.js';
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
const DEFAULT_PROJECT_NAME = 'default_v2_project',
  REMOTE_SAVE_CACHE_LIMIT = 0x1f4,
  _remoteSaveInflight = new Map(),
  _remoteSaveCache = new Map();
function _buildRemoteSaveCacheKey(_0x49c7b4, _0x222dc2, _0x5285f0 = {}) {
  const _0x2dc9dd = String(_0x222dc2 || '').trim(),
    _0x2c240c = String(
      _0x5285f0?.dedupeKey || (_0x5285f0?.taskKey ? _0x5285f0.taskKey + ':' + _0x2dc9dd : _0x2dc9dd),
    ).trim();
  return (String(_0x49c7b4 || 'media').trim() || 'media') + ':' + (_0x2c240c || _0x2dc9dd);
}
function _rememberRemoteSave(_0x104d8f, _0x27561b) {
  if (!_0x104d8f || !_0x27561b || typeof _0x27561b !== 'object') return;
  _remoteSaveCache.set(_0x104d8f, _0x27561b);
  if (_remoteSaveCache.size > REMOTE_SAVE_CACHE_LIMIT) {
    const _0x41d47a = _remoteSaveCache.keys().next().value;
    if (_0x41d47a) _remoteSaveCache.delete(_0x41d47a);
  }
}
function _runRemoteSaveOnce(_0x35bcf6, _0x3d8f02) {
  if (_remoteSaveCache.has(_0x35bcf6)) return Promise.resolve(_remoteSaveCache.get(_0x35bcf6));
  if (_remoteSaveInflight.has(_0x35bcf6)) return _remoteSaveInflight.get(_0x35bcf6);
  const _0x45ebbe = Promise.resolve()
    .then(_0x3d8f02)
    .then((_0x529a90) => {
      return (_rememberRemoteSave(_0x35bcf6, _0x529a90), _0x529a90);
    });
  return (
    _remoteSaveInflight.set(_0x35bcf6, _0x45ebbe),
    _0x45ebbe
      .finally(() => {
        _remoteSaveInflight.get(_0x35bcf6) === _0x45ebbe && _remoteSaveInflight.delete(_0x35bcf6);
      })
      .catch(() => {}),
    _0x45ebbe
  );
}
function _isPlainObject(_0x452dce) {
  return !!_0x452dce && typeof _0x452dce === 'object' && !Array.isArray(_0x452dce);
}
function _migratePanoramaNodeInPlace(_0x32ad56) {
  if (!_isPlainObject(_0x32ad56)) return;
  const _0x506dec = String(_0x32ad56.type || '').trim();
  if (isPanorama360NodeType(_0x506dec)) {
    _0x32ad56.type = PANORAMA_360_NODE_TYPE;
    const _0x37aeee = _isPlainObject(_0x32ad56.panorama360Node)
      ? _0x32ad56.panorama360Node
      : _0x32ad56.sceneNode;
    ((_0x32ad56.panorama360Node = normalizePanorama360State(_0x37aeee)), delete _0x32ad56.sceneNode);
    !String(_0x32ad56.name || '').trim() && (_0x32ad56.name = getPanorama360DefaultName());
    return;
  }
  if (!isPanoramaSceneNodeType(_0x506dec)) return;
  _0x32ad56.type = PANORAMA_SCENE_NODE_TYPE;
  const _0x232fd6 = _isPlainObject(_0x32ad56.sceneNode) ? _0x32ad56.sceneNode : _0x32ad56.panorama360Node,
    _0x2b0471 = normalizeSceneOnlyPanoramaSceneState(_0x232fd6),
    _0x2a55d5 = String(_0x232fd6?.mode || '')
      .trim()
      .toLowerCase(),
    _0x422d64 = _0x2a55d5 === 'panorama';
  if (_0x422d64) {
    ((_0x32ad56.type = PANORAMA_360_NODE_TYPE),
      (_0x32ad56.panorama360Node = normalizePanorama360State(_0x232fd6)),
      delete _0x32ad56.sceneNode);
    const _0x5b1e9f = String(_0x32ad56.name || '').trim(),
      _0x28feb0 = getPanoramaSceneDefaultName();
    (!_0x5b1e9f || _0x5b1e9f === PANORAMA_SCENE_DEFAULT_NAME || _0x5b1e9f === _0x28feb0) &&
      (_0x32ad56.name = getPanorama360DefaultName());
    return;
  }
  ((_0x32ad56.sceneNode = _0x2b0471),
    delete _0x32ad56.panorama360Node,
    !String(_0x32ad56.name || '').trim() && (_0x32ad56.name = getPanoramaSceneDefaultName()));
}
function _migrateCanvasDataInPlace(_0x44b60a) {
  const _0x1628a3 = Array.isArray(_0x44b60a?.canvases) ? _0x44b60a.canvases : [];
  for (const _0x3f47a8 of _0x1628a3) {
    if (!_0x3f47a8) continue;
    if (_0x3f47a8.nodes && !Array.isArray(_0x3f47a8.nodes)) _0x3f47a8.nodes = Object.values(_0x3f47a8.nodes);
    if (_0x3f47a8.edges && !Array.isArray(_0x3f47a8.edges)) _0x3f47a8.edges = Object.values(_0x3f47a8.edges);
    const _0x21abe4 = Array.isArray(_0x3f47a8.nodes) ? _0x3f47a8.nodes : [];
    for (const _0x2f4641 of _0x21abe4) {
      _migratePanoramaNodeInPlace(_0x2f4641);
    }
  }
  return _0x44b60a;
}
const getCssVar = (_0x5ddd1b) =>
  getComputedStyle(document.documentElement).getPropertyValue(_0x5ddd1b).trim();
export function resolveCanvasData(_0x5e88f2) {
  if (!_0x5e88f2)
    return _migrateCanvasDataInPlace({
      canvases: [
        { id: 'canvas_1', name: '默认画布', nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1.1 } },
      ],
      activeCanvasId: 'canvas_1',
    });
  if (Array.isArray(_0x5e88f2.canvases) && _0x5e88f2.canvases.length > 0) {
    let _0x478806 = _0x5e88f2.activeCanvasId || _0x5e88f2.canvases[0].id;
    const _0x4a367a = _0x5e88f2.canvases.find((_0x4c1daa) => _0x4c1daa.id === _0x478806);
    if (_0x4a367a && (!_0x4a367a.nodes || _0x4a367a.nodes.length === 0)) {
      const _0xefbd3c = _0x5e88f2.canvases.find((_0x405564) => _0x405564.nodes && _0x405564.nodes.length > 0);
      if (_0xefbd3c) _0x478806 = _0xefbd3c.id;
    }
    return _migrateCanvasDataInPlace({ canvases: _0x5e88f2.canvases, activeCanvasId: _0x478806 });
  }
  let _0x97a7ed = _0x5e88f2.nodes || _0x5e88f2.v2_nodes || [],
    _0x449c45 = _0x5e88f2.edges || _0x5e88f2.v2_edges || [];
  if (!Array.isArray(_0x97a7ed)) _0x97a7ed = Object.values(_0x97a7ed);
  if (!Array.isArray(_0x449c45)) _0x449c45 = Object.values(_0x449c45);
  const _0x5d414a = {
    id: 'canvas_1',
    name: '默认画布',
    nodes: _0x97a7ed,
    edges: _0x449c45,
    viewport: _0x5e88f2.viewport || { x: 0, y: 0, zoom: 1.1 },
  };
  return _migrateCanvasDataInPlace({ canvases: [_0x5d414a], activeCanvasId: 'canvas_1' });
}
export async function loadProject(_0x4e7d52, { allowMissing: allowMissing = false, onMissing } = {}) {
  const projectId = String(_0x4e7d52 || '').trim();
  if (!projectId) throw new Error('项目ID为空；未以空画布替代');
  try {
    const _0x4eec6e = projectId.endsWith('.json') ? projectId : projectId + '.json',
      _0x130c4b = await readProjectDocument(fetchV2ProjectFromServer, projectId, { allowMissing });
    if (_0x130c4b === null)
      return (
        console.warn('[projectService] 未找到工程文件，按明确允许缺失的流程新建空画布：' + _0x4eec6e),
        onMissing?.(),
        resolveCanvasData({})
      );
    const _0x673f3b = resolveCanvasData(_0x130c4b);
    return (
      console.log(
        '[projectService] 项目 ' + _0x4e7d52 + ' 已加载，共 ' + _0x673f3b.canvases.length + ' 个画布页面',
      ),
      _0x673f3b
    );
  } catch (_0xfc51ac) {
    console.error('[projectService] 加载项目异常，未替换为空画布:', _0xfc51ac);
    throw _0xfc51ac;
  }
}
export async function saveProject(_0x3a2cbb, _0x30e137) {
  try {
    const recoveryApi = globalThis.window?.electronAPI?.project,
      recoveryBeforeSave = await captureRecoverySnapshotBeforeSave(recoveryApi),
      _0x166098 = sanitizeMultiCanvasDataForPersistence(_0x30e137 || {}),
      _0x59d4fd = {
        projectName: _0x3a2cbb || DEFAULT_PROJECT_NAME,
        activeCanvasId: _0x166098?.activeCanvasId || 'canvas_1',
        canvases: _0x166098?.canvases || [],
      },
      _0x395f9f = await saveV2ProjectToServer(_0x59d4fd);
    if (_0x395f9f?.success) {
      window._v2CurrentFile = _0x395f9f.filename;
      window.currentProjectId = _0x395f9f.filename.replace('.json', '');
      await clearRecoverySnapshotAfterSave(recoveryApi, recoveryBeforeSave, {
        ..._0x395f9f, projectId: window.currentProjectId,
      });
    }
    console.log('[projectService] 项目 ' + _0x3a2cbb + ' 已持久化（' + _0x59d4fd.canvases.length + ' 个画布）');
    return _0x395f9f;
  } catch (_0x23e8c7) {
    console.error('[projectService] 存档异常:', _0x23e8c7);
    throw _0x23e8c7;
  }
}
export async function getProjects() {
  try {
    return await fetchV2ProjectsFromServer();
  } catch {
    return [];
  }
}
export async function deleteProject(_0x51bac5) {
  try {
    return await deleteV2ProjectFromServer(_0x51bac5);
  } catch (_0x27ca2d) {
    return (console.error('[projectService] 删除项目失败:', _0x27ca2d), false);
  }
}
function _getElectronImportAsset() {
  const _0x35ea38 = globalThis.window?.electronAPI?.importAsset;
  return typeof _0x35ea38 === 'function' ? _0x35ea38 : null;
}
function _getElectronPathForFile(_0x18658d) {
  if (!globalThis.window?.electronAPI) return '';
  const _0x24d4d6 = String(_0x18658d?.path || '').trim();
  if (_0x24d4d6) return _0x24d4d6;
  const _0x2038a0 = globalThis.window.electronAPI.getPathForFile;
  if (typeof _0x2038a0 !== 'function') return '';
  try {
    return String(_0x2038a0(_0x18658d) || '').trim();
  } catch {
    return '';
  }
}
async function _importAssetWithElectron(_0x57a5b7, _0x4e6db3) {
  const _0x42a35b = _getElectronImportAsset();
  if (!_0x42a35b || !_0x57a5b7) return null;
  const _0x17a4ca = { name: _0x57a5b7.name || 'asset', type: _0x57a5b7.type || '', projectId: _0x4e6db3 },
    _0x45bca8 = _getElectronPathForFile(_0x57a5b7);
  if (_0x45bca8) _0x17a4ca.path = _0x45bca8;
  else {
    if (typeof _0x57a5b7.arrayBuffer === 'function') _0x17a4ca.bytes = await _0x57a5b7.arrayBuffer();
    else return null;
  }
  return _normalizeImageSaveResult(await _0x42a35b(_0x17a4ca));
}
export async function uploadFile(_0xde666e, _0x1e099b) {
  try {
    try {
      const _0x37cace = await _importAssetWithElectron(_0xde666e, _0x1e099b);
      if (_0x37cace?.success) return _0x37cace;
    } catch (_0x564f7c) {
      console.warn('[projectService] Electron 素材导入失败，回退上传流程:', _0x564f7c);
    }
    return _normalizeImageSaveResult(await uploadFileToServer(_0xde666e));
  } catch (_0x5c4397) {
    console.error('[projectService] 文件上传异常:', _0x5c4397);
    throw _0x5c4397;
  }
}
export async function saveOutputBlob(_0x4fa99c, _0x257948 = {}) {
  return _normalizeImageSaveResult(await saveOutputToServer(_0x4fa99c, _0x257948));
}
export async function cropGridTiles(_0x3deaa3 = {}) {
  const _0x49d792 = await cropGridTilesToServer(_0x3deaa3);
  if (!_0x49d792 || typeof _0x49d792 !== 'object') return _0x49d792;
  const _0x5219b7 = Array.isArray(_0x49d792.tiles)
    ? _0x49d792.tiles.map((_0x1c1f8b) => _normalizeImageSaveResult(_0x1c1f8b))
    : [];
  return { ..._0x49d792, tiles: _0x5219b7 };
}
export async function saveOutputFromUrl(_0x9c4364, _0x36746b = {}) {
  const _0x43daf5 = String(_0x9c4364 || '').trim();
  if (_0x43daf5.startsWith('blob:') || _0x43daf5.startsWith('data:'))
    try {
      const _0x1312b2 = await fetchRemoteBlob(_0x43daf5);
      return await saveOutputBlob(_0x1312b2, _0x36746b);
    } catch (_0x1ac503) {
      return (
        console.error('[projectService] 本地路径转换 Blob 失败:', _0x1ac503),
        { error: '本地路径转换失败: ' + _0x1ac503.message }
      );
    }
  return _normalizeImageSaveResult(await saveOutputFromUrlToServer({ url: _0x43daf5, ..._0x36746b }));
}
function _guessAudioExtFromUrl(_0x542ab6) {
  try {
    const _0x550cd0 = new URL(String(_0x542ab6 || ''), 'http://localhost'),
      _0x158e92 = String(_0x550cd0.pathname || '').match(/\.([a-z0-9]{1,5})$/i),
      _0x1b959c = String(_0x158e92?.[1] || '').toLowerCase();
    if (['wav', 'mp3', 'm4a', 'flac', 'aac', 'ogg', 'opus', 'wma', 'amr', 'webm'].includes(_0x1b959c))
      return _0x1b959c;
  } catch {}
  return '';
}
function _guessAudioExtFromMime(_0xb136a3) {
  const _0x22e7cb = String(_0xb136a3 || '')
    .trim()
    .toLowerCase();
  if (!_0x22e7cb) return '';
  if (_0x22e7cb === 'audio/mpeg') return 'mp3';
  if (_0x22e7cb === 'audio/wav' || _0x22e7cb === 'audio/x-wav') return 'wav';
  if (_0x22e7cb === 'audio/mp4' || _0x22e7cb === 'audio/x-m4a') return 'm4a';
  if (_0x22e7cb === 'audio/flac' || _0x22e7cb === 'audio/x-flac') return 'flac';
  if (_0x22e7cb === 'audio/aac') return 'aac';
  if (_0x22e7cb === 'audio/ogg') return 'ogg';
  if (_0x22e7cb === 'audio/opus') return 'opus';
  if (_0x22e7cb === 'audio/webm') return 'webm';
  if (_0x22e7cb === 'audio/amr') return 'amr';
  return '';
}
function _toLocalAudioResult(_0x389e23) {
  const _0x412a02 = normalizeLocalPath(
      _0x389e23?.localPath || _0x389e23?.originalLocalPath || _0x389e23?.path,
    ),
    _0x185057 = localPathToUrl(_0x412a02);
  return {
    ...(_0x389e23 && typeof _0x389e23 === 'object' ? _0x389e23 : {}),
    localPath: _0x412a02,
    localUrl: _0x185057,
  };
}
export async function saveRemoteAudioLocallyDetailed(_0x1f6e6e, _0x113c21 = {}) {
  const _0x3a2cb8 = String(_0x1f6e6e || '').trim();
  if (!_0x3a2cb8) throw new Error('保存音频失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('audio', _0x3a2cb8, _0x113c21), async () => {
    if (_0x3a2cb8.startsWith('blob:') || _0x3a2cb8.startsWith('data:')) {
      const _0x52e649 = await fetchRemoteBlob(_0x3a2cb8),
        _0x486cc3 = _guessAudioExtFromMime(_0x52e649?.type) || 'mp3';
      return _toLocalAudioResult(await saveOutputBlob(_0x52e649, { ext: _0x486cc3, ..._0x113c21 }));
    }
    const _0x369ee0 = _guessAudioExtFromUrl(_0x3a2cb8) || 'mp3';
    try {
      return _toLocalAudioResult(
        await saveOutputFromUrl(_0x3a2cb8, { ext: _0x369ee0, maxBytes: 0x400 * 0x400 * 200, ..._0x113c21 }),
      );
    } catch {}
    const _0x5131b9 = await fetchRemoteBlob(_0x3a2cb8),
      _0x4bd2a3 = _guessAudioExtFromMime(_0x5131b9?.type) || _0x369ee0;
    return _toLocalAudioResult(await saveOutputBlob(_0x5131b9, { ext: _0x4bd2a3, ..._0x113c21 }));
  });
}
function _toLocalUrlFromSaveResult(_0x5a2d64) {
  return localPathToUrl(_0x5a2d64?.originalLocalPath) || localPathToUrl(pickResultLocalPath(_0x5a2d64));
}
function _normalizeImageSaveResult(_0x41d7b2) {
  if (!_0x41d7b2 || typeof _0x41d7b2 !== 'object') return _0x41d7b2;
  if (!hasImageDerivativeFields(_0x41d7b2)) return _0x41d7b2;
  const _0x58471d = buildImageNodeStorageFields(_0x41d7b2),
    _0x119078 = { ..._0x41d7b2, ..._0x58471d };
  return (
    !String(_0x119078.url || '').trim() &&
      _0x58471d.localPath &&
      (_0x119078.url = toLocalPathUrl(_0x58471d.localPath)),
    !String(_0x119078.originalUrl || '').trim() &&
      _0x58471d.originalLocalPath &&
      (_0x119078.originalUrl = toLocalPathUrl(_0x58471d.originalLocalPath)),
    !String(_0x119078.displayUrl || '').trim() &&
      _0x58471d.displayLocalPath &&
      (_0x119078.displayUrl = toLocalPathUrl(_0x58471d.displayLocalPath)),
    !String(_0x119078.thumbUrl || '').trim() &&
      _0x58471d.thumbLocalPath &&
      (_0x119078.thumbUrl = toLocalPathUrl(_0x58471d.thumbLocalPath)),
    _0x119078
  );
}
function _guessImageExtFromUrl(_0xa9d14c) {
  const _0xf74109 = String(_0xa9d14c || '').trim();
  if (!_0xf74109) return '';
  try {
    const _0xec7e60 = new URL(_0xf74109, window.location.href),
      _0x1f0955 = String(_0xec7e60.pathname || ''),
      _0x1cd05f = _0x1f0955.match(/\.([a-z0-9]{1,5})$/i),
      _0x4806bd = (_0x1cd05f?.[1] || '').toLowerCase();
    if (!_0x4806bd) return '';
    if (_0x4806bd === 'jpeg') return 'jpg';
    if (_0x4806bd === 'jpg') return 'jpg';
    if (_0x4806bd === 'png') return 'png';
    if (_0x4806bd === 'webp') return 'webp';
    if (_0x4806bd === 'gif') return 'gif';
    return '';
  } catch {
    return '';
  }
}
export async function ensureLocalImageDerivatives(_0x38fd1b) {
  return _normalizeImageSaveResult(await ensureImageDerivativesToServer({ localPath: _0x38fd1b }));
}
export async function checkLocalMediaExists(_0x2a8ff8) {
  return await checkLocalMediaExistsOnServer({ localPath: _0x2a8ff8 });
}
export async function saveRemoteImageLocallyDetailed(_0x1a0b67, _0x47e984, _0x2a03ac = {}) {
  const _0x3146d7 = String(_0x1a0b67 || '').trim();
  if (!_0x3146d7) throw new Error('保存到本地失败: 缺少 remoteUrl');
  return _runRemoteSaveOnce(_buildRemoteSaveCacheKey('image', _0x3146d7, _0x2a03ac), async () => {
    if (_0x3146d7.startsWith('blob:') || _0x3146d7.startsWith('data:')) {
      try {
        const _0xfea851 = await fetchRemoteBlob(_0x3146d7);
        let _0x51a88e = 'png';
        if (_0xfea851.type === 'image/jpeg') _0x51a88e = 'jpg';
        else {
          if (_0xfea851.type === 'image/webp') _0x51a88e = 'webp';
          else {
            if (_0xfea851.type === 'image/png') _0x51a88e = 'png';
            else {
              if (_0xfea851.type === 'image/gif') _0x51a88e = 'gif';
            }
          }
        }
        const _0x443664 = await saveOutputBlob(_0xfea851, { ext: _0x51a88e, ..._0x2a03ac }),
          _0x16d97c = _toLocalUrlFromSaveResult(_0x443664);
        if (_0x16d97c) return { ..._0x443664, localUrl: _0x16d97c };
      } catch {}
      throw new Error('保存到本地失败');
    }
    try {
      const _0x2aa11b = _guessImageExtFromUrl(_0x3146d7) || 'png',
        _0x25e5a9 = await saveOutputFromUrl(_0x3146d7, {
          ext: _0x2aa11b,
          maxBytes: 0x400 * 0x400 * 60,
          ..._0x2a03ac,
        }),
        _0x1e7bc5 = _toLocalUrlFromSaveResult(_0x25e5a9);
      if (_0x1e7bc5) return { ..._0x25e5a9, localUrl: _0x1e7bc5 };
      throw new Error('保存到本地失败: 服务器未返回 url');
    } catch {}
    const _0x6111bb = await fetchRemoteBlob(_0x3146d7);
    let _0x357c2b = 'png';
    if (_0x6111bb.type === 'image/jpeg') _0x357c2b = 'jpg';
    else {
      if (_0x6111bb.type === 'image/webp') _0x357c2b = 'webp';
      else {
        if (_0x6111bb.type === 'image/png') _0x357c2b = 'png';
        else {
          if (_0x6111bb.type === 'image/gif') _0x357c2b = 'gif';
        }
      }
    }
    const _0x510f77 = await saveOutputBlob(_0x6111bb, { ext: _0x357c2b, ..._0x2a03ac }),
      _0x316629 = _toLocalUrlFromSaveResult(_0x510f77);
    if (_0x316629) return { ..._0x510f77, localUrl: _0x316629 };
    throw new Error('保存到本地失败');
  });
}
export async function saveRemoteImageLocally(_0x5c3d4f, _0x28f700, _0x195386 = {}) {
  const _0x5a3b15 = await saveRemoteImageLocallyDetailed(_0x5c3d4f, _0x28f700, _0x195386);
  return String(_0x5a3b15?.localUrl || '').trim() || _toLocalUrlFromSaveResult(_0x5a3b15);
}
export function exportProject(_0x4f61c6, _0x37f839) {
  const _0x4fab6d = new Blob([JSON.stringify(_0x37f839, null, 2)], { type: 'application/json' }),
    _0x355f18 = URL.createObjectURL(_0x4fab6d),
    _0x38945c = document.createElement('a');
  ((_0x38945c.href = _0x355f18),
    (_0x38945c.download = _0x4f61c6 + '.json'),
    document.body.appendChild(_0x38945c),
    _0x38945c.click(),
    document.body.removeChild(_0x38945c),
    URL.revokeObjectURL(_0x355f18));
}
export async function importProject(_0xcaee16) {
  return new Promise((_0x56d050, _0x1499ce) => {
    const _0x1d20e8 = new FileReader();
    ((_0x1d20e8.onload = (_0x2ad99e) => {
      try {
        const _0x5677b8 = JSON.parse(_0x2ad99e.target.result),
          _0xc6554 = resolveCanvasData(_0x5677b8);
        _0x56d050(_0xc6554);
      } catch (_0x3dc8e7) {
        _0x1499ce(new Error('解析 JSON 存档失败'));
      }
    }),
      (_0x1d20e8.onerror = () => _0x1499ce(new Error('文件读取失败'))),
      _0x1d20e8.readAsText(_0xcaee16));
  });
}
