import { buildApiUrl } from './apiBase.js';
import { get, post, del, requester } from './requester.js';
import { normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { unwrapProjectReadResponse } from '../src/services/projectDocumentGuard.js';
const WORKFLOWS_FALLBACK_USER_FILE = '/api/v2/user/workflows.json',
  ASSET_CATEGORIES_USER_FILE = '/api/v2/user/asset-categories.json',
  _saveOutputFromUrlInflight = new Map(),
  _saveOutputFromUrlCache = new Map(),
  SAVE_OUTPUT_FROM_URL_CACHE_LIMIT = 0x1f4;
function _rememberSavedOutput(_0x347190, _0x16b4c3) {
  if (!_0x347190 || !_0x16b4c3 || typeof _0x16b4c3 !== 'object') return;
  _saveOutputFromUrlCache.set(_0x347190, _0x16b4c3);
  if (_saveOutputFromUrlCache.size > SAVE_OUTPUT_FROM_URL_CACHE_LIMIT) {
    const _0x59f68d = _saveOutputFromUrlCache.keys().next().value;
    if (_0x59f68d) _saveOutputFromUrlCache.delete(_0x59f68d);
  }
}
function _normalizeProjectFilename(_0x20aaf7) {
  const _0x4506f2 = String(_0x20aaf7 || '').trim();
  if (!_0x4506f2) return 'default_v2_project.json';
  return _0x4506f2.endsWith('.json') ? _0x4506f2 : _0x4506f2 + '.json';
}
function _isNotFoundError(_0x4cd12c) {
  return Number(_0x4cd12c?.status) === 0x194 || /not found/i.test(String(_0x4cd12c?.message || ''));
}
function _extractWorkflowItems(_0x53d573) {
  if (Array.isArray(_0x53d573)) return _0x53d573;
  if (_0x53d573 && typeof _0x53d573 === 'object' && Array.isArray(_0x53d573.items)) return _0x53d573.items;
  return [];
}
function _upsertWorkflowItems(_0x36d3ec, _0x2760c9) {
  const _0x1218aa = Array.isArray(_0x36d3ec) ? [..._0x36d3ec] : [],
    _0x1b40b4 = String(_0x2760c9?.id || '').trim();
  if (!_0x1b40b4) return _0x1218aa;
  const _0x851fda = _0x1218aa.findIndex((_0x3dca1e) => String(_0x3dca1e?.id || '').trim() === _0x1b40b4);
  return (
    _0x851fda >= 0
      ? (_0x1218aa[_0x851fda] = { ..._0x1218aa[_0x851fda], ...(_0x2760c9 || {}) })
      : _0x1218aa.unshift(_0x2760c9),
    _0x1218aa.sort(
      (_0x164057, _0x2565a7) => Number(_0x2565a7?.updatedAt || 0) - Number(_0x164057?.updatedAt || 0),
    ),
    _0x1218aa
  );
}
export async function fetchV2ProjectFromServer(_0xd9f3df) {
  const _0x45e96c = _normalizeProjectFilename(_0xd9f3df),
    _0x4ff162 = '/api/v2/projects/' + encodeURIComponent(_0x45e96c),
    _0x5682bc = await get(_0x4ff162, { allow404Null: true, provider: 'local', returnMeta: true });
  return unwrapProjectReadResponse(_0x5682bc);
}
export async function saveV2ProjectToServer(_0x28bc8f) {
  const _0x349c86 = await post('/api/v2/projects/save', _0x28bc8f || {}, { provider: 'local' });
  return _0x349c86;
}
export async function fetchV2ProjectsFromServer() {
  try {
    const _0x481d15 = await get('/api/v2/projects', { provider: 'local' });
    return Array.isArray(_0x481d15) ? _0x481d15 : [];
  } catch {
    return [];
  }
}
export async function deleteV2ProjectFromServer(_0x550b7e) {
  const _0x30e916 = _normalizeProjectFilename(_0x550b7e);
  try {
    return (await del('/api/v2/projects/' + encodeURIComponent(_0x30e916), { provider: 'local' }), true);
  } catch {
    return false;
  }
}
export async function fetchAssetsFromServer(_0x16046a = {}) {
  try {
    const _0x140fc3 = new URLSearchParams();
    for (const [_0x227bf1, _0xd668e5] of Object.entries(_0x16046a || {})) {
      if (_0xd668e5 === undefined || _0xd668e5 === null || _0xd668e5 === '') continue;
      _0x140fc3.set(_0x227bf1, String(_0xd668e5));
    }
    const _0x2f2b98 = _0x140fc3.toString() ? '?' + _0x140fc3.toString() : '',
      _0x40b062 = await get('/api/v2/assets' + _0x2f2b98, { provider: 'local' });
    if (Array.isArray(_0x40b062)) return _0x40b062;
    if (_0x40b062 && typeof _0x40b062 === 'object' && Array.isArray(_0x40b062.items)) return _0x40b062;
    return [];
  } catch {
    return _0x16046a && Object.keys(_0x16046a).length > 0
      ? { items: [], total: 0, nextOffset: null, hasMore: false }
      : [];
  }
}
export async function fetchOutputFilesFromServer(_0x16a3df = {}) {
  try {
    const _0x265f05 = new URLSearchParams();
    for (const [_0x3fbbca, _0x4b5789] of Object.entries(_0x16a3df || {})) {
      if (_0x4b5789 === undefined || _0x4b5789 === null || _0x4b5789 === '') continue;
      _0x265f05.set(_0x3fbbca, String(_0x4b5789));
    }
    const _0x58a8e8 = _0x265f05.toString() ? '?' + _0x265f05.toString() : '',
      _0x163230 = await get('/api/v2/output-files' + _0x58a8e8, { provider: 'local' });
    return _0x163230 && typeof _0x163230 === 'object' ? _0x163230 : { items: [] };
  } catch {
    return { items: [] };
  }
}
export async function deleteOutputFilesFromServer(_0x3da673 = {}) {
  const _0x561943 = await post('/api/v2/output-files/delete', _0x3da673 || {}, { provider: 'local' });
  return _0x561943;
}
export async function saveAssetToServer(_0x5841fa) {
  const _0x1abaab = await post('/api/v2/assets/save', _0x5841fa || {}, { provider: 'local' });
  return _0x1abaab;
}
export async function deleteAssetFromServer(_0xe934e4) {
  const _0x349fb7 = _0xe934e4 + '.json';
  try {
    return (await del('/api/v2/assets/' + encodeURIComponent(_0x349fb7), { provider: 'local' }), true);
  } catch {
    return false;
  }
}
export async function fetchAssetCategoriesFromServer() {
  try {
    const _0x21ca43 = await get(ASSET_CATEGORIES_USER_FILE, { provider: 'local' });
    if (Array.isArray(_0x21ca43)) return _0x21ca43;
    if (_0x21ca43 && typeof _0x21ca43 === 'object') {
      if (Array.isArray(_0x21ca43.categories)) return _0x21ca43.categories;
      if (Array.isArray(_0x21ca43.items)) return _0x21ca43.items;
    }
    return [];
  } catch {
    return [];
  }
}
export async function saveAssetCategoriesToServer(_0x42ec58 = []) {
  const _0x3cdcca = Array.isArray(_0x42ec58) ? _0x42ec58 : [],
    _0x3449d5 = await post(
      ASSET_CATEGORIES_USER_FILE,
      { version: 1, categories: _0x3cdcca },
      { provider: 'local' },
    );
  return _0x3449d5;
}
export async function saveAssetThumbToServer(_0x344919) {
  const _0x26f9b5 = String(_0x344919?.assetId ?? _0x344919?.id ?? '').trim(),
    _0x5e84fe = String(_0x344919?.dataUrl || '');
  if (!_0x26f9b5) throw new Error('保存资产缩略图失败: 缺少 assetId');
  if (!_0x5e84fe.startsWith('data:image/')) throw new Error('保存资产缩略图失败: dataUrl 非法');
  const _0x5e13d1 = await post(
    '/api/v2/assets/thumb/save',
    { ...(_0x344919 || {}), assetId: _0x26f9b5 },
    { provider: 'local' },
  );
  return _0x5e13d1;
}
export async function fetchWorkflowsFromServer() {
  try {
    const _0x1df45b = await get('/api/v2/workflows', { provider: 'local' });
    return Array.isArray(_0x1df45b) ? _0x1df45b : [];
  } catch (_0x325a71) {
    if (!_isNotFoundError(_0x325a71)) return [];
    try {
      const _0x9e712e = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' });
      return _extractWorkflowItems(_0x9e712e);
    } catch {
      return [];
    }
  }
}
async function deleteWorkflowFromFallbackFile(_0x38885e) {
  const _0x5d0b65 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' }).catch(() => ({})),
    _0x444b67 = String(_0x38885e || '').trim(),
    _0x40f22a = _extractWorkflowItems(_0x5d0b65).filter(
      (_0x208930) => String(_0x208930?.id || '').trim() !== _0x444b67,
    );
  return (await post(WORKFLOWS_FALLBACK_USER_FILE, { items: _0x40f22a }, { provider: 'local' }), true);
}
async function saveWorkflowToFallbackFile(_0x1a71d6) {
  const _0x14b996 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: 'local' }).catch(() => ({})),
    _0x28b39d = _upsertWorkflowItems(_extractWorkflowItems(_0x14b996), _0x1a71d6 || {});
  return (
    await post(WORKFLOWS_FALLBACK_USER_FILE, { items: _0x28b39d }, { provider: 'local' }),
    { success: true, id: _0x1a71d6?.id }
  );
}
export async function saveWorkflowToServer(_0x4a6449) {
  try {
    const _0x5491e0 = await post('/api/v2/workflows/save', _0x4a6449 || {}, { provider: 'local' });
    return _0x5491e0;
  } catch (_0x1f8a31) {
    if (!_isNotFoundError(_0x1f8a31)) throw _0x1f8a31;
    return await saveWorkflowToFallbackFile(_0x4a6449);
  }
}
export async function deleteWorkflowFromServer(_0x3fa57c) {
  const _0x4280a5 = String(_0x3fa57c || '').trim();
  if (!_0x4280a5) return false;
  const _0x27fc43 = _0x4280a5 + '.json';
  try {
    return (await del('/api/v2/workflows/' + encodeURIComponent(_0x27fc43), { provider: 'local' }), true);
  } catch (_0x4e81cf) {
    if (!_isNotFoundError(_0x4e81cf)) return false;
    try {
      return await deleteWorkflowFromFallbackFile(_0x4280a5);
    } catch {
      return false;
    }
  }
}
export async function saveWorkflowThumbToServer(_0x3c3fa1) {
  const _0x343ccb = String(_0x3c3fa1?.workflowId ?? _0x3c3fa1?.id ?? '').trim(),
    _0x4cadcf = String(_0x3c3fa1?.dataUrl || '');
  if (!_0x343ccb) throw new Error('保存工作流封面失败: 缺少 workflowId');
  if (!_0x4cadcf.startsWith('data:image/')) throw new Error('保存工作流封面失败: dataUrl 非法');
  try {
    const _0x58e44b = await post(
      '/api/v2/workflows/thumb/save',
      { ...(_0x3c3fa1 || {}), workflowId: _0x343ccb },
      { provider: 'local' },
    );
    return _0x58e44b;
  } catch (_0x12c546) {
    if (!_isNotFoundError(_0x12c546)) throw _0x12c546;
    return { success: true, url: _0x4cadcf, localPath: _0x4cadcf, filename: _0x343ccb + '_cover.inline' };
  }
}
export async function uploadFileToServer(_0x8efb47) {
  const _0xba85fb = _0x8efb47?.name ? String(_0x8efb47.name) : 'file',
    _0x3149f6 = new FormData();
  _0x3149f6.append('file', _0x8efb47, _0xba85fb);
  const _0x1c53eb = await post('/api/upload?filename=' + encodeURIComponent(_0xba85fb), _0x3149f6, {
    provider: 'local',
  });
  return _0x1c53eb;
}
export async function fetchRemoteBlob(_0x525ea0, _0x1ecb1c = {}) {
  const _0x58ff8a = await get(_0x525ea0, {
    provider: 'remote',
    buildUrl: false,
    responseType: 'blob',
    signal: _0x1ecb1c?.signal,
    timeout: _0x1ecb1c?.timeout,
  });
  return _0x58ff8a;
}
export async function saveOutputToServer(_0x298611, _0x393c19 = {}) {
  const _0x594985 =
      String(_0x393c19?.ext || '')
        .trim()
        .toLowerCase() || 'bin',
    _0xb418ce = String(_0x393c19?.subDir || '').trim(),
    _0x3530a1 = String(_0x393c19?.kind || '').trim(),
    _0x2c6c84 = new URLSearchParams({ ext: _0x594985 });
  if (_0xb418ce) _0x2c6c84.set('subDir', _0xb418ce);
  if (_0x3530a1) _0x2c6c84.set('kind', _0x3530a1);
  const _0x405423 = await post('/api/v2/save_output?' + _0x2c6c84.toString(), _0x298611, {
    provider: 'local',
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  return _0x405423;
}
export async function saveOutputFromUrlToServer(_0x54d9b9) {
  const _0x1ef6fd = String(_0x54d9b9?.url || '').trim();
  if (!_0x1ef6fd) throw new Error('保存到 output 失败: 缺少 url');
  const _0x49e298 = String(
      _0x54d9b9?.dedupeKey || (_0x54d9b9?.taskKey ? _0x54d9b9.taskKey + ':' + _0x1ef6fd : _0x1ef6fd),
    ).trim(),
    _0x238945 = _0x49e298 || _0x1ef6fd;
  if (_saveOutputFromUrlCache.has(_0x238945)) return _saveOutputFromUrlCache.get(_0x238945);
  if (_saveOutputFromUrlInflight.has(_0x238945)) return _saveOutputFromUrlInflight.get(_0x238945);
  const _0x435d06 = {
      url: _0x1ef6fd,
      ext: _0x54d9b9?.ext,
      maxBytes: _0x54d9b9?.maxBytes,
      dedupeKey: _0x49e298,
    },
    _0x409d80 = post('/api/v2/save_output_from_url', _0x435d06, { provider: 'local' }).then((_0x28539b) => {
      return (_rememberSavedOutput(_0x238945, _0x28539b), _0x28539b);
    });
  return (
    _saveOutputFromUrlInflight.set(_0x238945, _0x409d80),
    _0x409d80
      .finally(() => {
        _saveOutputFromUrlInflight.get(_0x238945) === _0x409d80 &&
          _saveOutputFromUrlInflight.delete(_0x238945);
      })
      .catch(() => {}),
    _0x409d80
  );
}
export async function cropGridTilesToServer(_0x5be95a = {}) {
  const _0x3146ed = String(_0x5be95a?.localPath || _0x5be95a?.path || '').trim();
  if (!_0x3146ed) throw new Error('宫格裁切失败: 缺少 localPath');
  const _0x5aa17b = Math.round(Number(_0x5be95a?.cols) || 0),
    _0x34bfc3 = Math.round(Number(_0x5be95a?.rows) || 0);
  if (_0x5aa17b <= 0 || _0x34bfc3 <= 0) throw new Error('宫格裁切失败: 网格尺寸非法');
  const _0x1ff9f6 = {
      localPath: _0x3146ed,
      cols: _0x5aa17b,
      rows: _0x34bfc3,
      ext:
        String(_0x5be95a?.ext || 'jpg')
          .trim()
          .toLowerCase() || 'jpg',
      quality: Number(_0x5be95a?.quality || 85),
    },
    _0x4126af = String(_0x5be95a?.subDir || '').trim();
  if (_0x4126af) _0x1ff9f6.subDir = _0x4126af;
  const _0x4e14a8 = await post('/api/v2/grid_tiles/crop', _0x1ff9f6, { provider: 'local' });
  return _0x4e14a8;
}
export async function ensureImageDerivativesToServer(_0xa3260c) {
  const _0x322608 = String(_0xa3260c?.localPath || _0xa3260c?.path || '').trim();
  if (!_0x322608) throw new Error('生成图片派生文件失败: 缺少 localPath');
  const _0x46c3c4 = await post(
    '/api/v2/images/derivatives/ensure',
    { localPath: _0x322608 },
    { provider: 'local' },
  );
  return _0x46c3c4;
}
function _localPathToStaticRequestPath(_0x51b907) {
  const _0x3f9bdb = normalizeLocalPath(_0x51b907);
  if (!_0x3f9bdb) return '';
  return '/' + _0x3f9bdb.split('/').map(encodeURIComponent).join('/');
}
export async function checkLocalMediaExistsOnServer(_0x40e715) {
  const _0xf921fc =
      typeof _0x40e715 === 'string'
        ? _0x40e715
        : String(_0x40e715?.localPath || _0x40e715?.path || '').trim(),
    _0x4cac77 = _localPathToStaticRequestPath(_0xf921fc);
  if (!_0x4cac77) return false;
  try {
    const _0x226c6b = await requester({
        url: _0x4cac77,
        method: 'HEAD',
        provider: 'local',
        responseType: 'text',
        allow404Null: true,
        returnMeta: true,
        timeout: 0x2710,
      }),
      _0x232842 = Number(_0x226c6b?.status || 0);
    return _0x232842 >= 200 && _0x232842 < 0x190;
  } catch {
    return false;
  }
}
