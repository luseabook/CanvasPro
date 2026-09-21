import { buildApiUrl } from './apiBase.js';
import { get, post } from './requester.js';
const VOLCENGINE_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3',
  VOLCENGINE_FILE_POLL_INTERVAL_MS = 0x7d0,
  VOLCENGINE_FILE_POLL_TIMEOUT_MS = 2 * 60 * 0x3e8;
function normalizeBaseUrl(_0x3d1146) {
  return String(_0x3d1146 || VOLCENGINE_DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, '');
}
function isVolcengineFileId(_0x360184) {
  return /^file-[A-Za-z0-9_-]+/.test(String(_0x360184 || '').trim());
}
function extensionFromContentType(_0x29642c, _0x4b8e23 = 'bin') {
  const _0x33fd5b = String(_0x29642c || '')
      .trim()
      .toLowerCase(),
    _0x3a3a4b = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
    };
  return _0x3a3a4b[_0x33fd5b] || String(_0x4b8e23 || 'bin').replace(/^\./, '');
}
function guessFileName(_0x3f0d70, _0x451c63, _0x49108e) {
  try {
    const _0x1e9520 = new URL(String(_0x3f0d70 || ''), 'http://local.invalid'),
      _0x41cc34 = _0x1e9520.pathname.split('/').filter(Boolean).pop() || '';
    if (_0x41cc34 && _0x41cc34.includes('.')) return _0x41cc34;
  } catch {}
  const _0x5be122 = extensionFromContentType(_0x49108e, _0x451c63 === 'video' ? 'mp4' : 'png');
  return 'volcengine-input.' + _0x5be122;
}
function resolveInputFetchUrl(_0x2fd7f9) {
  const _0x4ec5cd = String(_0x2fd7f9 || '').trim();
  if (!_0x4ec5cd) return '';
  if (/^(?:https?:|data:|blob:)/i.test(_0x4ec5cd)) return _0x4ec5cd;
  if (_0x4ec5cd.startsWith('/')) return buildApiUrl(_0x4ec5cd);
  return buildApiUrl('/' + _0x4ec5cd);
}
function normalizeFileObject(_0x36ef7c) {
  const _0x2ce301 = _0x36ef7c?.data && typeof _0x36ef7c.data === 'object' ? _0x36ef7c.data : _0x36ef7c;
  return _0x2ce301 && typeof _0x2ce301 === 'object' ? _0x2ce301 : {};
}
async function fetchInputBlob(_0x34ec88) {
  const _0x1c8cf8 = resolveInputFetchUrl(_0x34ec88);
  if (!_0x1c8cf8) throw new Error('火山方舟上传文件地址为空');
  return await get(_0x1c8cf8, {
    provider: 'remote',
    buildUrl: false,
    responseType: 'blob',
    timeout: 5 * 60 * 0x3e8,
  });
}
export async function retrieveVolcengineFile(_0x1e1ee3, _0x2b51fd, _0x3eab15 = {}) {
  const _0x3803da = String(_0x1e1ee3 || '').trim();
  if (!_0x3803da) throw new Error('火山方舟文件 ID 为空');
  if (!_0x2b51fd) throw new Error('火山方舟 API Key 未配置，无法检索文件');
  const _0x32af6b = normalizeBaseUrl(_0x3eab15.baseUrl) + '/files/' + encodeURIComponent(_0x3803da),
    _0x3f0cdd = await get('/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x32af6b), {
      headers: { Authorization: 'Bearer ' + _0x2b51fd },
      provider: 'volcengine',
      timeout: _0x3eab15.timeout || 0x7530,
    });
  return normalizeFileObject(_0x3f0cdd);
}
async function waitForVolcengineFileActive(_0x5e8426, _0x10006e, _0x21d50b = {}) {
  let _0x1bd7cf = normalizeFileObject(_0x5e8426);
  const _0x546a01 = String(_0x1bd7cf.id || '').trim();
  if (!_0x546a01) throw new Error('火山方舟文件上传未返回 file id');
  const _0x3c7470 = Date.now();
  while (true) {
    const _0x189e19 = String(_0x1bd7cf.status || '')
      .trim()
      .toLowerCase();
    if (!_0x189e19 || _0x189e19 === 'active') return _0x1bd7cf;
    if (_0x189e19 === 'failed') {
      const _0x210000 = _0x1bd7cf.error?.message || _0x1bd7cf.message || '火山方舟文件处理失败';
      throw new Error(_0x210000);
    }
    if (Date.now() - _0x3c7470 > (_0x21d50b.timeout || VOLCENGINE_FILE_POLL_TIMEOUT_MS))
      throw new Error('火山方舟文件处理超时，请稍后重试');
    (await new Promise((_0x2f1c55) =>
      setTimeout(_0x2f1c55, _0x21d50b.interval || VOLCENGINE_FILE_POLL_INTERVAL_MS),
    ),
      (_0x1bd7cf = await retrieveVolcengineFile(_0x546a01, _0x10006e, _0x21d50b)));
  }
}
export async function uploadBlobToVolcengineFile(_0x5a191c, _0x2784e9, _0x26fd1b = {}) {
  if (!_0x5a191c) throw new Error('火山方舟上传文件不能为空');
  if (!_0x2784e9) throw new Error('火山方舟 API Key 未配置，无法上传文件');
  const _0x4de626 = String(_0x26fd1b.kind || '')
      .trim()
      .toLowerCase(),
    _0x49f961 = String(_0x5a191c.type || _0x26fd1b.contentType || '').trim(),
    _0x4bf855 =
      _0x26fd1b.filename || guessFileName(_0x26fd1b.sourceUrl, _0x4de626, _0x49f961 || _0x26fd1b.contentType),
    _0x557b10 = normalizeBaseUrl(_0x26fd1b.baseUrl) + '/files',
    _0x32c32a = new FormData();
  (_0x32c32a.append('purpose', 'user_data'), _0x32c32a.append('file', _0x5a191c, _0x4bf855));
  _0x4de626 === 'video' &&
    (_0x32c32a.append('preprocess_configs[video][fps]', String(_0x26fd1b.videoFps ?? 0.3)),
    _0x26fd1b.model && _0x32c32a.append('preprocess_configs[video][model]', String(_0x26fd1b.model)));
  const _0x1cda83 = await post('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x557b10), _0x32c32a, {
    headers: { Authorization: 'Bearer ' + _0x2784e9 },
    provider: 'volcengine',
    timeout: _0x26fd1b.uploadTimeout || 5 * 60 * 0x3e8,
  });
  return await waitForVolcengineFileActive(_0x1cda83, _0x2784e9, _0x26fd1b);
}
export async function uploadInputToVolcengineFile(_0x4c874b, _0x21f09c, _0x2b35af = {}) {
  const _0x506d0a = String(_0x4c874b || '').trim();
  if (!_0x506d0a) return '';
  if (isVolcengineFileId(_0x506d0a)) return _0x506d0a;
  const _0x7b3cf1 = await fetchInputBlob(_0x506d0a),
    _0x2870e2 = await uploadBlobToVolcengineFile(_0x7b3cf1, _0x21f09c, {
      ..._0x2b35af,
      sourceUrl: _0x506d0a,
    }),
    _0x347093 = String(_0x2870e2.id || '').trim();
  if (!_0x347093) throw new Error('火山方舟文件上传未返回 file id');
  return _0x347093;
}
export async function uploadInputsToVolcengineFiles(_0x1f8113, _0xfd1d78, _0xe39ac3 = {}) {
  const _0x1334d7 = Array.isArray(_0x1f8113)
      ? _0x1f8113.map((_0x445196) => String(_0x445196 || '').trim()).filter(Boolean)
      : [],
    _0x549626 = new Array(_0x1334d7.length).fill('');
  for (let _0x4e6ad5 = 0; _0x4e6ad5 < _0x1334d7.length; _0x4e6ad5 += 1) {
    _0x549626[_0x4e6ad5] = await uploadInputToVolcengineFile(_0x1334d7[_0x4e6ad5], _0xfd1d78, _0xe39ac3);
  }
  return _0x549626;
}
