import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
const REMOTE_ASSET_DOWNLOAD_TIMEOUT_MS = 0x7530,
  REMOTE_VIDEO_DOWNLOAD_TIMEOUT_MS = 5 * 0xea60,
  REMOTE_IMAGE_MAX_BYTES = 50 * 0x400 * 0x400,
  REMOTE_VIDEO_MAX_BYTES = 0x12c * 0x400 * 0x400,
  REMOTE_VIDEO_CACHE_DIR = 'ai-canvas-remote-video',
  REMOTE_IMAGE_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)(?:[?#].*)?$/i,
  REMOTE_VIDEO_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i,
  REMOTE_STREAM_MEDIA_EXTENSION_RE = /\.(?:m3u8|mpd|m4s)(?:[?#].*)?$/i,
  REMOTE_ASSET_KIND_LABELS = { image: '图片', video: '视频' };
function normalizeRemoteAssetKind(_0x43a4a8) {
  const _0x59bba8 = String(_0x43a4a8 || 'image')
    .trim()
    .toLowerCase();
  if (_0x59bba8 === 'image' || _0x59bba8 === 'video') return _0x59bba8;
  throw new Error('不支持的远程素材类型');
}
function getRemoteAssetKindLabel(_0x16554d) {
  return REMOTE_ASSET_KIND_LABELS[_0x16554d] || '素材';
}
function normalizeRemoteAssetUrl(_0x9c2e86, _0x244648 = 'image') {
  const _0x3e5dd5 = String(_0x9c2e86 || '').trim(),
    _0x282b62 = getRemoteAssetKindLabel(_0x244648);
  if (!_0x3e5dd5) throw new Error('缺少远程' + _0x282b62 + '地址');
  let _0x58c762 = null;
  try {
    _0x58c762 = new URL(_0x3e5dd5);
  } catch {
    throw new Error('远程' + _0x282b62 + '地址无效');
  }
  if (_0x58c762.protocol !== 'http:' && _0x58c762.protocol !== 'https:')
    throw new Error('仅支持 http/https ' + _0x282b62 + '地址');
  if (_0x244648 === 'video' && REMOTE_STREAM_MEDIA_EXTENSION_RE.test(_0x58c762.pathname))
    throw new Error('不支持保存流媒体播放列表或加密分段视频');
  return ((_0x58c762.username = ''), (_0x58c762.password = ''), _0x58c762.href);
}
function normalizeRemoteAssetReferrer(_0x5ea79b) {
  const _0x581f5b = String(_0x5ea79b || '').trim();
  if (!_0x581f5b) return '';
  try {
    const _0xf3ac6a = new URL(_0x581f5b);
    if (_0xf3ac6a.protocol !== 'http:' && _0xf3ac6a.protocol !== 'https:') return '';
    return ((_0xf3ac6a.username = ''), (_0xf3ac6a.password = ''), _0xf3ac6a.href);
  } catch {
    return '';
  }
}
function inferRemoteImageMimeType(_0xd17f1e, _0x16adf6 = '') {
  const _0x3c9930 = String(_0x16adf6 || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (_0x3c9930.startsWith('image/')) return _0x3c9930;
  let _0x3b40a4 = '';
  try {
    _0x3b40a4 = new URL(_0xd17f1e).pathname;
  } catch {}
  const _0x38ee26 = _0x3b40a4.split('.').pop()?.toLowerCase() || '';
  return (
    {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    }[_0x38ee26] || ''
  );
}
function inferRemoteVideoMimeType(_0xef242c, _0x54475e = '') {
  const _0x13753f = String(_0x54475e || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (_0x13753f.startsWith('video/')) return _0x13753f;
  let _0xedd60c = '';
  try {
    _0xedd60c = new URL(_0xef242c).pathname;
  } catch {}
  const _0x2a948b = _0xedd60c.split('.').pop()?.toLowerCase() || '';
  return (
    { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' }[
      _0x2a948b
    ] || ''
  );
}
function inferRemoteAssetMimeType(_0x23d483, _0x598ce3, _0x356be5 = '') {
  return _0x23d483 === 'video'
    ? inferRemoteVideoMimeType(_0x598ce3, _0x356be5)
    : inferRemoteImageMimeType(_0x598ce3, _0x356be5);
}
function isLikelyRemoteAssetUrl(_0x22278e, _0x5100c4) {
  try {
    const _0x11c537 = new URL(_0x5100c4).pathname;
    return _0x22278e === 'video'
      ? REMOTE_VIDEO_EXTENSION_RE.test(_0x11c537)
      : REMOTE_IMAGE_EXTENSION_RE.test(_0x11c537);
  } catch {
    return false;
  }
}
function getRemoteAssetMaxBytes(_0x41629c) {
  return _0x41629c === 'video' ? REMOTE_VIDEO_MAX_BYTES : REMOTE_IMAGE_MAX_BYTES;
}
function getRemoteAssetDownloadTimeoutMs(_0x31100c) {
  return _0x31100c === 'video' ? REMOTE_VIDEO_DOWNLOAD_TIMEOUT_MS : REMOTE_ASSET_DOWNLOAD_TIMEOUT_MS;
}
function createRemoteAssetSizeError(_0x55695d, _0x4fa708) {
  return new Error('远程' + _0x55695d + '超过 ' + Math.round(_0x4fa708 / 0x400 / 0x400) + 'MB 限制');
}
function getRemoteVideoTempRoot(_0x59a169 = {}) {
  const _0x542b26 = String(_0x59a169?.tempRoot || _0x59a169?.tempDir || '').trim();
  return _0x542b26 || tmpdir();
}
function getRemoteVideoTempFilePath(_0x32ce9e, _0x3545bb = {}) {
  const _0x1e2020 = createHash('sha256')
    .update(String(_0x32ce9e || ''))
    .digest('hex')
    .slice(0, 32);
  return join(getRemoteVideoTempRoot(_0x3545bb), REMOTE_VIDEO_CACHE_DIR, _0x1e2020 + '.part');
}
async function getExistingFileSize(_0x30fffd) {
  try {
    const _0x158865 = await stat(_0x30fffd);
    return Number(_0x158865?.size || 0) || 0;
  } catch {
    return 0;
  }
}
async function removeRemoteTempFile(_0x5ef148) {
  try {
    await rm(_0x5ef148, { force: true });
  } catch {}
}
function getRemoteResponseContentLength(_0x3f62d2) {
  return Number(_0x3f62d2?.headers?.get?.('content-length') || 0) || 0;
}
function sanitizeRemoteAssetFilename(_0x12c1e8, _0x49b6e8 = 'web-image') {
  const _0x2bdb7e = String(_0x12c1e8 || _0x49b6e8)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return _0x2bdb7e || _0x49b6e8;
}
function getRemoteFilenameFromHeaders(_0x3bb659, _0x361508, _0x428839 = 'image') {
  const _0x53e1c2 = String(_0x3bb659?.get?.('content-disposition') || ''),
    _0x2eec09 = _0x53e1c2.match(/filename\*=UTF-8''([^;]+)/i);
  if (_0x2eec09?.[1])
    try {
      return decodeURIComponent(_0x2eec09[1].trim().replace(/^"|"$/g, ''));
    } catch {}
  const _0x4b2317 = _0x53e1c2.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (_0x4b2317?.[2]) return _0x4b2317[2].trim();
  try {
    const _0x20ac50 = new URL(_0x361508);
    return (
      decodeURIComponent(_0x20ac50.pathname.split('/').filter(Boolean).pop() || '') ||
      (_0x428839 === 'video' ? 'web-video' : 'web-image')
    );
  } catch {
    return _0x428839 === 'video' ? 'web-video' : 'web-image';
  }
}
function getKnownRemoteAssetExtension(_0x3e9ca3, _0x1b4a8a) {
  const _0x104077 = String(_0x1b4a8a || '').toLowerCase(),
    _0xaeda74 =
      _0x3e9ca3 === 'video'
        ? new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv'])
        : new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.avif']);
  return _0xaeda74.has(_0x104077) ? _0x104077 : '';
}
function getFilenameExtension(_0x25faed) {
  const _0x3aa8b3 = String(_0x25faed || '').match(/(\.[a-z0-9]{2,5})$/i);
  return _0x3aa8b3?.[1]?.toLowerCase() || '';
}
function getRemoteAssetExtensionForMime(_0x20d922, _0x2b5adb = 'image') {
  return (
    {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
      'image/avif': '.avif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/ogg': '.ogv',
    }[String(_0x20d922 || '').toLowerCase()] || (_0x2b5adb === 'video' ? '.mp4' : '.img')
  );
}
function ensureFilenameExtension(_0x16f6ca, _0xe770b1, _0x334213 = 'image') {
  const _0x2fb409 = String(_0x16f6ca || '').trim(),
    _0xa6b349 = getFilenameExtension(_0x2fb409);
  if (getKnownRemoteAssetExtension(_0x334213, _0xa6b349)) return _0x2fb409;
  const _0x2ce756 = getRemoteAssetExtensionForMime(_0xe770b1, _0x334213),
    _0x2bdcc8 = _0xa6b349 ? _0x2fb409.slice(0, -_0xa6b349.length) : _0x2fb409;
  return '' + (_0x2bdcc8 || (_0x334213 === 'video' ? 'web-video' : 'web-image')) + _0x2ce756;
}
function getRemoteAssetSession(_0x5b5abf = {}, _0x549c7b) {
  const _0x22d116 = String(_0x5b5abf?.nodeId || '').trim(),
    _0xd7af8b = String(_0x5b5abf?.tabId || 'default').trim() || 'default';
  if (!_0x22d116 || typeof _0x549c7b !== 'function') return null;
  try {
    return _0x549c7b(_0x22d116, _0xd7af8b)?.view?.webContents?.session || null;
  } catch {
    return null;
  }
}
function isBlockedByClientError(_0x3cd6a5) {
  const _0xa55b2 = [_0x3cd6a5?.code, _0x3cd6a5?.name, _0x3cd6a5?.message, String(_0x3cd6a5 || '')]
    .filter(Boolean)
    .join('\n');
  return _0xa55b2.includes('ERR_BLOCKED_BY_CLIENT');
}
function addFetchCandidate(_0x3c3f74, _0x258ce6, _0x219d24) {
  if (typeof _0x258ce6 !== 'function') return;
  if (_0x3c3f74.some((_0x47d649) => _0x47d649.fetchFn === _0x258ce6)) return;
  _0x3c3f74.push({ fetchFn: _0x258ce6, label: _0x219d24 });
}
function getRemoteAssetFetchCandidates(_0x2042d7, _0x278810 = {}) {
  const _0x16e2c4 = [];
  return (
    typeof _0x2042d7?.fetch === 'function' &&
      addFetchCandidate(_0x16e2c4, _0x2042d7.fetch.bind(_0x2042d7), 'session'),
    addFetchCandidate(_0x16e2c4, _0x278810.fetchImpl, 'custom'),
    typeof fetch === 'function' && addFetchCandidate(_0x16e2c4, fetch, 'global'),
    _0x16e2c4
  );
}
function createRemoteAssetFetchContext(_0x3b7115 = {}, _0x6c36df = {}) {
  const _0x251e23 = normalizeRemoteAssetKind(_0x3b7115?.kind || _0x3b7115?.assetKind || 'image'),
    _0x48032b = normalizeRemoteAssetUrl(_0x3b7115?.url, _0x251e23),
    _0x7c2d0f = normalizeRemoteAssetReferrer(
      _0x3b7115?.referrer || _0x3b7115?.pageUrl || _0x3b7115?.webPageUrl,
    ),
    _0x216159 = getRemoteAssetKindLabel(_0x251e23),
    _0x2c3941 = getRemoteAssetMaxBytes(_0x251e23),
    _0x10de35 = {
      Accept: _0x251e23 === 'video' ? 'video/*,*/*;q=0.8' : 'image/*,*/*;q=0.8',
      ...(_0x7c2d0f ? { Referer: _0x7c2d0f } : {}),
    },
    _0x2e3e9e = getRemoteAssetSession(_0x3b7115, _0x6c36df.getWebPreviewEntry),
    _0x108c27 = String(_0x2e3e9e?.getUserAgent?.() || '').trim();
  if (_0x108c27) _0x10de35['User-Agent'] = _0x108c27;
  const _0x5ab359 = getRemoteAssetFetchCandidates(_0x2e3e9e, _0x6c36df);
  if (!_0x5ab359.length) throw new Error('当前环境不支持远程素材下载');
  return {
    kind: _0x251e23,
    url: _0x48032b,
    label: _0x216159,
    maxBytes: _0x2c3941,
    headers: _0x10de35,
    fetchCandidates: _0x5ab359,
  };
}
async function fetchRemoteAssetResponse(_0x2423cd, _0x57b357, _0x39ce63 = {}) {
  for (let _0x142a55 = 0; _0x142a55 < _0x2423cd.length; _0x142a55 += 1) {
    const _0x35fb9a = _0x2423cd[_0x142a55];
    try {
      return await _0x35fb9a.fetchFn(_0x57b357, _0x39ce63);
    } catch (_0xc937) {
      if (isBlockedByClientError(_0xc937) && _0x142a55 < _0x2423cd.length - 1) continue;
      throw _0xc937;
    }
  }
  return null;
}
function normalizeRemoteResponseChunk(_0x17815c) {
  if (Buffer.isBuffer(_0x17815c)) return _0x17815c;
  if (_0x17815c instanceof ArrayBuffer) return Buffer.from(_0x17815c);
  if (_0x17815c instanceof Uint8Array)
    return Buffer.from(_0x17815c.buffer, _0x17815c.byteOffset, _0x17815c.byteLength);
  return Buffer.from(_0x17815c || []);
}
async function writeRemoteStreamChunk(_0x1d2b7b, _0x21ca81) {
  await new Promise((_0x2753ee, _0x10dcd1) => {
    const _0x5aa0de = (_0x10e048) => {
      (_0x1d2b7b.off('error', _0x5aa0de), _0x10dcd1(_0x10e048));
    };
    (_0x1d2b7b.once('error', _0x5aa0de),
      _0x1d2b7b.write(_0x21ca81, (_0x59d369) => {
        _0x1d2b7b.off('error', _0x5aa0de);
        if (_0x59d369) {
          _0x10dcd1(_0x59d369);
          return;
        }
        _0x2753ee();
      }));
  });
}
async function closeRemoteWriteStream(_0x44c40f) {
  await new Promise((_0x1571a8, _0x5f484b) => {
    const _0x21a9ea = () => {
        (_0x44c40f.off('error', _0x3a7c29), _0x44c40f.off('finish', _0xf239b7));
      },
      _0x3a7c29 = (_0x2cf2c2) => {
        (_0x21a9ea(), _0x5f484b(_0x2cf2c2));
      },
      _0xf239b7 = () => {
        (_0x21a9ea(), _0x1571a8());
      };
    (_0x44c40f.once('error', _0x3a7c29), _0x44c40f.once('finish', _0xf239b7), _0x44c40f.end());
  });
}
async function writeRemoteResponseBodyToFile(_0x14c6da, _0x181ee4, _0x70dd76 = {}) {
  const _0x128058 = _0x70dd76.label || '素材',
    _0x389a61 = Number(_0x70dd76.maxBytes || 0) || REMOTE_VIDEO_MAX_BYTES;
  let _0x429371 = Number(_0x70dd76.initialBytes || 0) || 0;
  await mkdir(dirname(_0x181ee4), { recursive: true });
  const _0x4e879e = createWriteStream(_0x181ee4, { flags: _0x70dd76.append ? 'a' : 'w' }),
    _0x3e5c8f = async (_0x57a6ce) => {
      const _0x2b2afd = normalizeRemoteResponseChunk(_0x57a6ce);
      if (!_0x2b2afd.byteLength) return;
      _0x429371 += _0x2b2afd.byteLength;
      if (_0x429371 > _0x389a61) {
        const _0x25cda4 = createRemoteAssetSizeError(_0x128058, _0x389a61);
        ((_0x25cda4.code = 'REMOTE_ASSET_TOO_LARGE'), _0x4e879e.destroy());
        throw _0x25cda4;
      }
      await writeRemoteStreamChunk(_0x4e879e, _0x2b2afd);
    };
  try {
    if (typeof _0x14c6da?.body?.getReader === 'function') {
      const _0x57c410 = _0x14c6da.body.getReader();
      try {
        while (true) {
          const { done: _0x20d1ac, value: _0x4be234 } = await _0x57c410.read();
          if (_0x20d1ac) break;
          await _0x3e5c8f(_0x4be234);
        }
      } finally {
        _0x57c410.releaseLock?.();
      }
    } else {
      if (_0x14c6da?.body && typeof _0x14c6da.body[Symbol.asyncIterator] === 'function')
        for await (const _0x2e1c18 of _0x14c6da.body) {
          await _0x3e5c8f(_0x2e1c18);
        }
      else {
        if (typeof _0x14c6da?.arrayBuffer === 'function') await _0x3e5c8f(await _0x14c6da.arrayBuffer());
        else throw new Error('远程视频响应缺少可读取内容');
      }
    }
    return (await closeRemoteWriteStream(_0x4e879e), _0x429371);
  } catch (_0x1927ce) {
    _0x4e879e.destroy();
    throw _0x1927ce;
  }
}
async function fetchRemoteImageAssetBytes(_0x226c1e, _0x191c16) {
  const {
      kind: _0x45e52a,
      url: _0x5ed88a,
      label: _0x48fe80,
      maxBytes: _0x56b75a,
      headers: _0xd45741,
      fetchCandidates: _0x1ea033,
    } = _0x226c1e,
    _0x1805a6 = await fetchRemoteAssetResponse(_0x1ea033, _0x5ed88a, {
      method: 'GET',
      redirect: 'follow',
      headers: _0xd45741,
      signal: _0x191c16,
    });
  if (!_0x1805a6?.ok) throw new Error('远程' + _0x48fe80 + '下载失败：HTTP ' + (_0x1805a6?.status || 0));
  const _0x53b0 = getRemoteResponseContentLength(_0x1805a6);
  if (_0x53b0 > _0x56b75a) throw createRemoteAssetSizeError(_0x48fe80, _0x56b75a);
  const _0x35d708 = String(_0x1805a6.headers?.get?.('content-type') || ''),
    _0x2ad900 = inferRemoteAssetMimeType(_0x45e52a, _0x5ed88a, _0x35d708);
  if (!_0x2ad900 && !isLikelyRemoteAssetUrl(_0x45e52a, _0x5ed88a))
    throw new Error('远程资源不是可识别的' + _0x48fe80);
  const _0x140b4f = await _0x1805a6.arrayBuffer();
  if (_0x140b4f.byteLength > _0x56b75a) throw createRemoteAssetSizeError(_0x48fe80, _0x56b75a);
  const _0x205bc5 = sanitizeRemoteAssetFilename(
    ensureFilenameExtension(
      getRemoteFilenameFromHeaders(_0x1805a6.headers, _0x5ed88a, _0x45e52a),
      _0x2ad900 || 'image/png',
      _0x45e52a,
    ),
    'web-image.png',
  );
  return {
    kind: _0x45e52a,
    url: _0x5ed88a,
    bytes: Buffer.from(_0x140b4f),
    name: _0x205bc5,
    type: _0x2ad900 || _0x35d708 || '',
  };
}
async function fetchRemoteVideoAssetBytes(_0x18b742, _0x33ecd6 = {}) {
  const {
      kind: _0x453eb7,
      url: _0x46d0f8,
      label: _0x4a9fff,
      maxBytes: _0x37fb87,
      headers: _0x325954,
      fetchCandidates: _0x380c04,
    } = _0x18b742,
    _0x22f92e = getRemoteVideoTempFilePath(_0x46d0f8, _0x33ecd6);
  let _0xddf90e = await getExistingFileSize(_0x22f92e);
  for (let _0x44f4a5 = 0; _0x44f4a5 < 2; _0x44f4a5 += 1) {
    const _0x33870f = { ..._0x325954, Range: 'bytes=' + Math.max(0, _0xddf90e) + '-' },
      _0x3aa45f = await fetchRemoteAssetResponse(_0x380c04, _0x46d0f8, {
        method: 'GET',
        redirect: 'follow',
        headers: _0x33870f,
        signal: _0x33ecd6.signal,
      });
    if (_0x3aa45f?.status === 0x1a0 && _0xddf90e > 0 && _0x44f4a5 === 0) {
      (await removeRemoteTempFile(_0x22f92e), (_0xddf90e = 0));
      continue;
    }
    if (!_0x3aa45f?.ok) throw new Error('远程' + _0x4a9fff + '下载失败：HTTP ' + (_0x3aa45f?.status || 0));
    let _0x4607c2 = _0xddf90e > 0;
    _0xddf90e > 0 &&
      Number(_0x3aa45f.status || 0) === 200 &&
      (await removeRemoteTempFile(_0x22f92e), (_0xddf90e = 0), (_0x4607c2 = false));
    const _0x4324be = getRemoteResponseContentLength(_0x3aa45f);
    if (_0x4324be > 0 && _0xddf90e + _0x4324be > _0x37fb87) {
      await removeRemoteTempFile(_0x22f92e);
      throw createRemoteAssetSizeError(_0x4a9fff, _0x37fb87);
    }
    const _0x3771d2 = String(_0x3aa45f.headers?.get?.('content-type') || ''),
      _0x579bbc = inferRemoteAssetMimeType(_0x453eb7, _0x46d0f8, _0x3771d2);
    if (!_0x579bbc && !isLikelyRemoteAssetUrl(_0x453eb7, _0x46d0f8)) {
      await removeRemoteTempFile(_0x22f92e);
      throw new Error('远程资源不是可识别的' + _0x4a9fff);
    }
    if (REMOTE_STREAM_MEDIA_EXTENSION_RE.test(new URL(_0x46d0f8).pathname)) {
      await removeRemoteTempFile(_0x22f92e);
      throw new Error('不支持保存流媒体播放列表或加密分段视频');
    }
    try {
      await writeRemoteResponseBodyToFile(_0x3aa45f, _0x22f92e, {
        append: _0x4607c2,
        initialBytes: _0xddf90e,
        maxBytes: _0x37fb87,
        label: _0x4a9fff,
      });
    } catch (_0x3ff4a6) {
      _0x3ff4a6?.code === 'REMOTE_ASSET_TOO_LARGE' && (await removeRemoteTempFile(_0x22f92e));
      throw _0x3ff4a6;
    }
    const _0x22924e = await readFile(_0x22f92e);
    if (_0x22924e.byteLength > _0x37fb87) {
      await removeRemoteTempFile(_0x22f92e);
      throw createRemoteAssetSizeError(_0x4a9fff, _0x37fb87);
    }
    const _0x41948c = sanitizeRemoteAssetFilename(
      ensureFilenameExtension(
        getRemoteFilenameFromHeaders(_0x3aa45f.headers, _0x46d0f8, _0x453eb7),
        _0x579bbc || 'video/mp4',
        _0x453eb7,
      ),
      'web-video.mp4',
    );
    return (
      await removeRemoteTempFile(_0x22f92e),
      {
        kind: _0x453eb7,
        url: _0x46d0f8,
        bytes: _0x22924e,
        name: _0x41948c,
        type: _0x579bbc || _0x3771d2 || '',
      }
    );
  }
  throw new Error('远程' + _0x4a9fff + '下载失败：HTTP 416');
}
async function fetchRemoteAssetBytes(_0x4c357b = {}, _0x4a6cb4 = {}) {
  const _0x417ffe = createRemoteAssetFetchContext(_0x4c357b, _0x4a6cb4),
    _0x2aa9e9 = new AbortController(),
    _0x231e42 = setTimeout(() => _0x2aa9e9.abort(), getRemoteAssetDownloadTimeoutMs(_0x417ffe.kind));
  try {
    if (_0x417ffe.kind === 'video')
      return await fetchRemoteVideoAssetBytes(_0x417ffe, { ..._0x4a6cb4, signal: _0x2aa9e9.signal });
    return await fetchRemoteImageAssetBytes(_0x417ffe, _0x2aa9e9.signal);
  } finally {
    clearTimeout(_0x231e42);
  }
}
export function createRemoteAssetImporter({
  importAssetToLibrary: _0x16f9b7,
  getWebPreviewEntry: _0x492ef7,
  fetchImpl: _0x1b8290,
  tempRoot: _0x20f79d,
} = {}) {
  return async function _0xcfd9c2(_0x2b8184 = {}) {
    if (typeof _0x16f9b7 !== 'function') throw new Error('素材库导入服务尚未就绪');
    const _0xa976a5 = await fetchRemoteAssetBytes(_0x2b8184, {
      getWebPreviewEntry: _0x492ef7,
      fetchImpl: _0x1b8290,
      tempRoot: _0x20f79d,
    });
    return await _0x16f9b7({
      name: _0x2b8184?.name || _0xa976a5.name,
      type: _0x2b8184?.type || _0xa976a5.type,
      projectId: _0x2b8184?.projectId,
      bytes: _0xa976a5.bytes,
    });
  };
}
