import { buildApiUrl } from './apiBase.js';
import { get, post, del, requester } from './requester.js';
import { normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { unwrapProjectReadResponse } from '../src/services/projectDocumentGuard.js';
import { assertLocalAssetUploadSize, parseLocalAssetUploadError } from './localAssetUploadPolicy.js';
const WORKFLOWS_FALLBACK_USER_FILE = '/api/v2/user/workflows.json',
  ASSET_CATEGORIES_USER_FILE = '/api/v2/user/asset-categories.json',
  ASSET_STAGE_UPLOAD_TIMEOUT_MS = 30 * 60 * 1000,
  _saveOutputFromUrlInflight = new Map(),
  _saveOutputFromUrlCache = new Map(),
  SAVE_OUTPUT_FROM_URL_CACHE_LIMIT = 500;
function _rememberSavedOutput(enabled, enabled2) {
  if (!enabled || !enabled2 || typeof enabled2 !== 'object') return;
  _saveOutputFromUrlCache.set(enabled, enabled2);
  if (_saveOutputFromUrlCache.size > SAVE_OUTPUT_FROM_URL_CACHE_LIMIT) {
    const value = _saveOutputFromUrlCache.keys().next().value;
    if (value) _saveOutputFromUrlCache.delete(value);
  }
}
function _normalizeProjectFilename(item) {
  const enabled3 = String(item || '').trim();
  if (!enabled3) return 'default_v2_project.json';
  return enabled3.endsWith('.json') ? enabled3 : enabled3 + '.json';
}
function _isNotFoundError(error) {
  return Number(error?.status) === 404 || /not found/i.test(String(error?.message || ''));
}
function _extractWorkflowItems(key) {
  if (Array.isArray(key)) return key;
  if (key && typeof key === 'object' && Array.isArray(key.items)) return key.items;
  return [];
}
function _upsertWorkflowItems(args, index) {
  const list = Array.isArray(args) ? [...args] : [],
    enabled4 = String(index?.id || '').trim();
  if (!enabled4) return list;
  const count = list.findIndex((item2) => String(item2?.id || '').trim() === enabled4);
  return (
    count >= 0 ? (list[count] = { ...list[count], ...(index || {}) }) : list.unshift(index),
    list.sort((item3, result) => Number(result?.updatedAt || 0) - Number(item3?.updatedAt || 0)),
    list
  );
}
export async function fetchV2ProjectFromServer(data) {
  const _normalizeProjectFilename2 = _normalizeProjectFilename(data),
    options = '/api/v2/projects/' + encodeURIComponent(_normalizeProjectFilename2),
    get2 = await get(options, { allow404Null: true, provider: 'local', returnMeta: true });
  return unwrapProjectReadResponse(get2);
}
export async function saveV2ProjectToServer(target) {
  const post2 = await post('/api/v2/projects/save', target || {}, { provider: 'local' });
  return post2;
}
export async function fetchV2ProjectsFromServer() {
  try {
    const get3 = await get('/api/v2/projects', { provider: 'local' });
    return Array.isArray(get3) ? get3 : [];
  } catch {
    return [];
  }
}
export async function deleteV2ProjectFromServer(source) {
  const _normalizeProjectFilename3 = _normalizeProjectFilename(source);
  try {
    return (
      await del('/api/v2/projects/' + encodeURIComponent(_normalizeProjectFilename3), { provider: 'local' }),
      true
    );
  } catch {
    return false;
  }
}
export async function fetchAssetsFromServer(options2 = {}) {
  try {
    const map = new URLSearchParams();
    for (const [next, current] of Object.entries(options2 || {})) {
      if (current === undefined || current === null || current === '') continue;
      map.set(next, String(current));
    }
    const entry = map.toString() ? '?' + map.toString() : '',
      get4 = await get('/api/v2/assets' + entry, { provider: 'local' });
    if (Array.isArray(get4)) return get4;
    if (get4 && typeof get4 === 'object' && Array.isArray(get4.items)) return get4;
    return [];
  } catch {
    return options2 && Object.keys(options2).length > 0
      ? { items: [], total: 0, nextOffset: null, hasMore: false }
      : [];
  }
}
export async function fetchOutputFilesFromServer(options3 = {}) {
  try {
    const map2 = new URLSearchParams();
    for (const [record, payload] of Object.entries(options3 || {})) {
      if (payload === undefined || payload === null || payload === '') continue;
      map2.set(record, String(payload));
    }
    const handle = map2.toString() ? '?' + map2.toString() : '',
      get5 = await get('/api/v2/output-files' + handle, { provider: 'local' });
    return get5 && typeof get5 === 'object' ? get5 : { items: [] };
  } catch {
    return { items: [] };
  }
}
export async function deleteOutputFilesFromServer(options4 = {}) {
  const post3 = await post('/api/v2/output-files/delete', options4 || {}, { provider: 'local' });
  return post3;
}
export async function saveAssetToServer(state) {
  const post4 = await post('/api/v2/assets/save', state || {}, { provider: 'local' });
  return post4;
}
export async function deleteAssetFromServer(config) {
  const scope = config + '.json';
  try {
    return (await del('/api/v2/assets/' + encodeURIComponent(scope), { provider: 'local' }), true);
  } catch {
    return false;
  }
}
export async function fetchAssetCategoriesFromServer() {
  try {
    const get6 = await get(ASSET_CATEGORIES_USER_FILE, { provider: 'local' });
    if (Array.isArray(get6)) return get6;
    if (get6 && typeof get6 === 'object') {
      if (Array.isArray(get6.categories)) return get6.categories;
      if (Array.isArray(get6.items)) return get6.items;
    }
    return [];
  } catch {
    return [];
  }
}
export async function saveAssetCategoriesToServer(list2 = []) {
  const categories = Array.isArray(list2) ? list2 : [],
    post5 = await post(
      ASSET_CATEGORIES_USER_FILE,
      { version: 1, categories: categories },
      { provider: 'local' },
    );
  return post5;
}
export async function saveAssetThumbToServer(input) {
  const assetId = String(input?.assetId ?? input?.id ?? '').trim(),
    enabled5 = String(input?.dataUrl || '');
  if (!assetId) throw new Error('保存资产缩略图失败: 缺少 assetId');
  if (!enabled5.startsWith('data:image/')) throw new Error('保存资产缩略图失败: dataUrl 非法');
  const post6 = await post(
    '/api/v2/assets/thumb/save',
    { ...(input || {}), assetId: assetId },
    { provider: 'local' },
  );
  return post6;
}
export async function fetchWorkflowsFromServer() {
  try {
    const get7 = await get('/api/v2/workflows', { provider: 'local' });
    return Array.isArray(get7) ? get7 : [];
  } catch (output) {
    if (!_isNotFoundError(output)) return [];
    try {
      const get8 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' });
      return _extractWorkflowItems(get8);
    } catch {
      return [];
    }
  }
}
async function deleteWorkflowFromFallbackFile(value2) {
  const get9 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' }).catch(() => ({})),
    value3 = String(value2 || '').trim(),
    items = _extractWorkflowItems(get9).filter((item4) => String(item4?.id || '').trim() !== value3);
  return (await post(WORKFLOWS_FALLBACK_USER_FILE, { items: items }, { provider: 'local' }), true);
}
async function saveWorkflowToFallbackFile(id) {
  const get10 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' }).catch(() => ({})),
    items2 = _upsertWorkflowItems(_extractWorkflowItems(get10), id || {});
  return (
    await post(WORKFLOWS_FALLBACK_USER_FILE, { items: items2 }, { provider: 'local' }),
    { success: true, id: id?.id }
  );
}
export async function saveWorkflowToServer(value4) {
  try {
    const post7 = await post('/api/v2/workflows/save', value4 || {}, { provider: 'local' });
    return post7;
  } catch (value5) {
    if (!_isNotFoundError(value5)) throw value5;
    return await saveWorkflowToFallbackFile(value4);
  }
}
export async function deleteWorkflowFromServer(value6) {
  const enabled6 = String(value6 || '').trim();
  if (!enabled6) return false;
  const value7 = enabled6 + '.json';
  try {
    return (await del('/api/v2/workflows/' + encodeURIComponent(value7), { provider: 'local' }), true);
  } catch (value8) {
    if (!_isNotFoundError(value8)) return false;
    try {
      return await deleteWorkflowFromFallbackFile(enabled6);
    } catch {
      return false;
    }
  }
}
export async function saveWorkflowThumbToServer(value9) {
  const workflowId = String(value9?.workflowId ?? value9?.id ?? '').trim(),
    url = String(value9?.dataUrl || '');
  if (!workflowId) throw new Error('保存工作流封面失败: 缺少 workflowId');
  if (!url.startsWith('data:image/')) throw new Error('保存工作流封面失败: dataUrl 非法');
  try {
    const post8 = await post(
      '/api/v2/workflows/thumb/save',
      { ...(value9 || {}), workflowId: workflowId },
      { provider: 'local' },
    );
    return post8;
  } catch (value10) {
    if (!_isNotFoundError(value10)) throw value10;
    return { success: true, url: url, localPath: url, filename: workflowId + '_cover.inline' };
  }
}
export async function uploadFileToServer(error2) {
  const value11 = error2?.name ? String(error2.name) : 'file',
    formData = new FormData();
  formData.append('file', error2, value11);
  const post9 = await post('/api/upload?filename=' + encodeURIComponent(value11), formData, {
    provider: 'local',
  });
  return post9;
}

export async function stageAssetUploadToServer(error3) {
  assertLocalAssetUploadSize(error3);
  const value12 = error3?.name ? String(error3.name) : 'file';
  return await post('/api/v2/assets/stage?filename=' + encodeURIComponent(value12), error3, {
    provider: 'local',
    timeout: ASSET_STAGE_UPLOAD_TIMEOUT_MS,
    retries: 0,
    headers: { 'Content-Type': 'application/octet-stream' },
    errorParser: parseLocalAssetUploadError,
  });
}
export async function fetchRemoteBlob(value13, signal = {}) {
  const get11 = await get(value13, {
    provider: 'remote',
    buildUrl: false,
    responseType: 'blob',
    signal: signal?.signal,
    timeout: signal?.timeout,
  });
  return get11;
}
export async function saveOutputToServer(value14, value15 = {}) {
  const ext =
      String(value15?.ext || '')
        .trim()
        .toLowerCase() || 'bin',
    value16 = String(value15?.subDir || '').trim(),
    value17 = String(value15?.kind || '').trim(),
    map3 = new URLSearchParams({ ext: ext });
  if (value16) map3.set('subDir', value16);
  if (value17) map3.set('kind', value17);
  const post10 = await post('/api/v2/save_output?' + map3.toString(), value14, {
    provider: 'local',
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  return post10;
}
export async function saveOutputFromUrlToServer(ext2) {
  const url2 = String(ext2?.url || '').trim();
  if (!url2) throw new Error('保存到 output 失败: 缺少 url');
  const dedupeKey = String(ext2?.dedupeKey || (ext2?.taskKey ? ext2.taskKey + ':' + url2 : url2)).trim(),
    value18 = dedupeKey || url2;
  if (_saveOutputFromUrlCache.has(value18)) return _saveOutputFromUrlCache.get(value18);
  if (_saveOutputFromUrlInflight.has(value18)) return _saveOutputFromUrlInflight.get(value18);
  const value19 = {
      url: url2,
      ext: ext2?.ext,
      maxBytes: ext2?.maxBytes,
      dedupeKey: dedupeKey,
    },
    promise = post('/api/v2/save_output_from_url', value19, { provider: 'local' }).then((value20) => {
      return (_rememberSavedOutput(value18, value20), value20);
    });
  return (
    _saveOutputFromUrlInflight.set(value18, promise),
    promise
      .finally(() => {
        _saveOutputFromUrlInflight.get(value18) === promise && _saveOutputFromUrlInflight.delete(value18);
      })
      .catch(() => {}),
    promise
  );
}
export async function cropGridTilesToServer(options5 = {}) {
  const localPath = String(options5?.localPath || options5?.path || '').trim();
  if (!localPath) throw new Error('宫格裁切失败: 缺少 localPath');
  const cols = Math.round(Number(options5?.cols) || 0),
    rows = Math.round(Number(options5?.rows) || 0);
  if (cols <= 0 || rows <= 0) throw new Error('宫格裁切失败: 网格尺寸非法');
  const value21 = {
      localPath: localPath,
      cols: cols,
      rows: rows,
      ext:
        String(options5?.ext || 'jpg')
          .trim()
          .toLowerCase() || 'jpg',
      quality: Number(options5?.quality || 85),
    },
    value22 = String(options5?.subDir || '').trim();
  if (value22) value21.subDir = value22;
  const post11 = await post('/api/v2/grid_tiles/crop', value21, { provider: 'local' });
  return post11;
}
export async function ensureImageDerivativesToServer(value23) {
  const localPath2 = String(value23?.localPath || value23?.path || '').trim();
  if (!localPath2) throw new Error('生成图片派生文件失败: 缺少 localPath');
  const post12 = await post(
    '/api/v2/images/derivatives/ensure',
    { localPath: localPath2 },
    { provider: 'local' },
  );
  return post12;
}
function _localPathToStaticRequestPath(value24) {
  const localPath3 = normalizeLocalPath(value24);
  if (!localPath3) return '';
  return '/' + localPath3.split('/').map(encodeURIComponent).join('/');
}
export async function checkLocalMediaExistsOnServer(value25) {
  const value26 =
      typeof value25 === 'string' ? value25 : String(value25?.localPath || value25?.path || '').trim(),
    url3 = _localPathToStaticRequestPath(value26);
  if (!url3) return false;
  try {
    const response = await requester({
        url: url3,
        method: 'HEAD',
        provider: 'local',
        responseType: 'text',
        allow404Null: true,
        returnMeta: true,
        timeout: 10000,
      }),
      count2 = Number(response?.status || 0);
    return count2 >= 200 && count2 < 400;
  } catch {
    return false;
  }
}
const PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|json)$/i;

export const SAVE_OUTPUT_FROM_URL_TIMEOUT_MS = 5 * 60 * 1000;

const _localMediaStatInflight = new Map(),
  _localMediaStatCache = new Map(),
  LOCAL_MEDIA_EXISTS_CACHE_LIMIT = 1000,
  LOCAL_MEDIA_EXISTS_TRUE_CACHE_TTL_MS = 30 * 1000,
  LOCAL_MEDIA_EXISTS_FALSE_CACHE_TTL_MS = 3 * 1000;

function isLocalRelativeUrl(value27) {
  const enabled7 = String(value27 || '')['trim']();
  return enabled7['startsWith']('/') && !enabled7['startsWith']('//');
}

function normalizePositiveTimeoutMs(value28, value29) {
  const count3 = Number(value28);
  return Number['isFinite'](count3) && count3 > 0 ? count3 : value29;
}

function _collectNormalizedLocalPaths(value30) {
  const value31 = new Set();
  for (const value32 of Array['isArray'](value30) ? value30 : []) {
    const localPath4 = normalizeLocalPath(value32);
    if (localPath4) value31['add'](localPath4);
  }
  return value31;
}

function _evictSavedOutputCacheByLocalPaths(value33) {
  const map4 = _collectNormalizedLocalPaths(value33);
  if (map4['size'] === 0) return;
  for (const [value34, response2] of _saveOutputFromUrlCache['entries']()) {
    const localPath5 = normalizeLocalPath(
      response2?.['localPath'] || response2?.['path'] || response2?.['url'],
    );
    localPath5 && map4['has'](localPath5) && _saveOutputFromUrlCache['delete'](value34);
  }
}

function _evictLocalMediaExistsCacheByLocalPaths(value35) {
  const _collectNormalizedLocalPaths2 = _collectNormalizedLocalPaths(value35);
  for (const value36 of _collectNormalizedLocalPaths2) {
    const _localPathToStaticRequestPath2 = _localPathToStaticRequestPath(value36);
    if (_localPathToStaticRequestPath2) _localMediaStatCache['delete'](_localPathToStaticRequestPath2);
  }
}

function _readLocalMediaStatCache(value37) {
  const enabled8 = _localMediaStatCache['get'](value37);
  if (!enabled8) return undefined;
  if (Number(enabled8['expiresAt'] || 0) <= Date['now']())
    return (_localMediaStatCache['delete'](value37), undefined);
  return enabled8['stat'];
}

function _rememberLocalMediaStat(enabled9, exists) {
  if (!enabled9) return;
  const stat = {
      exists: exists?.['exists'] === true,
      sizeBytes:
        Number['isSafeInteger'](Number(exists?.['sizeBytes'])) && Number(exists['sizeBytes']) >= 0
          ? Number(exists['sizeBytes'])
          : 0,
      contentType: String(exists?.['contentType'] || '')['trim'](),
      lastModified: String(exists?.['lastModified'] || '')['trim'](),
    },
    value38 = stat['exists'] ? LOCAL_MEDIA_EXISTS_TRUE_CACHE_TTL_MS : LOCAL_MEDIA_EXISTS_FALSE_CACHE_TTL_MS;
  _localMediaStatCache['set'](enabled9, { stat: stat, expiresAt: Date['now']() + value38 });
  if (_localMediaStatCache['size'] > LOCAL_MEDIA_EXISTS_CACHE_LIMIT) {
    const value39 = _localMediaStatCache['keys']()['next']()['value'];
    if (value39) _localMediaStatCache['delete'](value39);
  }
  return stat;
}

function _normalizeLegacyProjectFilename(value40) {
  const enabled10 = String(value40 || '')['trim']();
  if (!enabled10) return 'default_v2_project.json';
  return PROJECT_FILE_EXTENSION_RE['test'](enabled10) ? enabled10 : enabled10 + '.json';
}

export async function renameV2ProjectOnServer(value41, value42) {
  const name = String(value42 || '')['trim']();
  if (!name) return { success: false };
  const _normalizeProjectFilename4 = _normalizeProjectFilename(value41);
  return await requester({
    url: '/api/v2/projects/' + encodeURIComponent(_normalizeProjectFilename4),
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify']({ name: name }),
    provider: 'local',
  });
}

export async function saveOutputVideoThumbnailToServer(options6 = {}) {
  return await post('/api/v2/output-files/video-thumbnail', options6 || {}, { provider: 'local' });
}

export async function fetchAssetCategorySettingsFromServer() {
  try {
    const categories2 = await get(ASSET_CATEGORIES_USER_FILE, { provider: 'local' });
    if (Array['isArray'](categories2)) return { categories: categories2, displayNames: {}, parents: {} };
    if (categories2 && typeof categories2 === 'object') {
      const categories3 = Array['isArray'](categories2['categories'])
          ? categories2['categories']
          : Array['isArray'](categories2['items'])
            ? categories2['items']
            : [],
        displayNames =
          categories2['displayNames'] && typeof categories2['displayNames'] === 'object'
            ? categories2['displayNames']
            : {},
        parents =
          categories2['parents'] && typeof categories2['parents'] === 'object' ? categories2['parents'] : {};
      return { categories: categories3, displayNames: displayNames, parents: parents };
    }
    return { categories: [], displayNames: {}, parents: {} };
  } catch {
    return { categories: [], displayNames: {}, parents: {} };
  }
}

export async function discardStagedAssetUploadToServer(value43) {
  const stageId = String(value43 || '')
    ['trim']()
    ['toLowerCase']();
  if (!/^[a-f0-9]{32}$/['test'](stageId)) return { success: false, removed: false };
  return await post(
    '/api/v2/assets/stage/discard',
    { stageId: stageId },
    { provider: 'local', timeout: 30 * 1000, retries: 0 },
  );
}

export async function statLocalMediaOnServer(value44) {
  const value45 =
      typeof value44 === 'string'
        ? value44
        : String(value44?.['localPath'] || value44?.['path'] || '')['trim'](),
    url4 = _localPathToStaticRequestPath(value45);
  if (!url4) return { exists: false, sizeBytes: 0, contentType: '', lastModified: '' };
  const _readLocalMediaStatCache2 = _readLocalMediaStatCache(url4);
  if (_readLocalMediaStatCache2 !== undefined) return _readLocalMediaStatCache2;
  if (_localMediaStatInflight['has'](url4)) return await _localMediaStatInflight['get'](url4);
  const promise2 = requester({
    url: url4,
    method: 'HEAD',
    provider: 'local',
    responseType: 'text',
    allow404Null: true,
    returnMeta: true,
    timeout: 10000,
  })
    ['then']((response3) => {
      const count4 = Number(response3?.['status'] || 0),
        exists2 = count4 >= 200 && count4 < 400,
        count5 = Number(response3?.['headers']?.['get']?.('content-length') || 0);
      return _rememberLocalMediaStat(url4, {
        exists: exists2,
        sizeBytes: exists2 && Number['isSafeInteger'](count5) && count5 >= 0 ? count5 : 0,
        contentType: exists2 ? String(response3?.['headers']?.['get']?.('content-type') || '')['trim']() : '',
        lastModified: exists2
          ? String(response3?.['headers']?.['get']?.('last-modified') || '')['trim']()
          : '',
      });
    })
    ['catch'](() => {
      return _rememberLocalMediaStat(url4, {
        exists: false,
        sizeBytes: 0,
        contentType: '',
        lastModified: '',
      });
    });
  return (
    _localMediaStatInflight['set'](url4, promise2),
    promise2['finally'](() => {
      _localMediaStatInflight['get'](url4) === promise2 && _localMediaStatInflight['delete'](url4);
    })['catch'](() => {}),
    await promise2
  );
}
