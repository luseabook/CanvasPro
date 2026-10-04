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
function normalizeRemoteAssetKind(value) {
  const item = String(value || 'image')
    .trim()
    .toLowerCase();
  if (item === 'image' || item === 'video') return item;
  throw new Error('不支持的远程素材类型');
}
function getRemoteAssetKindLabel(key) {
  return REMOTE_ASSET_KIND_LABELS[key] || '素材';
}
function normalizeRemoteAssetUrl(index, result = 'image') {
  const enabled = String(index || '').trim(),
    remoteAssetKindLabel = getRemoteAssetKindLabel(result);
  if (!enabled) throw new Error('缺少远程' + remoteAssetKindLabel + '地址');
  let uRL = null;
  try {
    uRL = new URL(enabled);
  } catch {
    throw new Error('远程' + remoteAssetKindLabel + '地址无效');
  }
  if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:')
    throw new Error('仅支持 http/https ' + remoteAssetKindLabel + '地址');
  if (result === 'video' && REMOTE_STREAM_MEDIA_EXTENSION_RE.test(uRL.pathname))
    throw new Error('不支持保存流媒体播放列表或加密分段视频');
  return ((uRL.username = ''), (uRL.password = ''), uRL.href);
}
function normalizeRemoteAssetReferrer(data) {
  const enabled2 = String(data || '').trim();
  if (!enabled2) return '';
  try {
    const uRL2 = new URL(enabled2);
    if (uRL2.protocol !== 'http:' && uRL2.protocol !== 'https:') return '';
    return ((uRL2.username = ''), (uRL2.password = ''), uRL2.href);
  } catch {
    return '';
  }
}
function inferRemoteImageMimeType(options, target = '') {
  const source = String(target || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (source.startsWith('image/')) return source;
  let uRL3 = '';
  try {
    uRL3 = new URL(options).pathname;
  } catch {}
  const next = uRL3.split('.').pop()?.toLowerCase() || '';
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
    }[next] || ''
  );
}
function inferRemoteVideoMimeType(current, entry = '') {
  const record = String(entry || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (record.startsWith('video/')) return record;
  let uRL4 = '';
  try {
    uRL4 = new URL(current).pathname;
  } catch {}
  const payload = uRL4.split('.').pop()?.toLowerCase() || '';
  return (
    { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' }[
      payload
    ] || ''
  );
}
function inferRemoteAssetMimeType(handle, state, config = '') {
  return handle === 'video'
    ? inferRemoteVideoMimeType(state, config)
    : inferRemoteImageMimeType(state, config);
}
function isLikelyRemoteAssetUrl(scope, input) {
  try {
    const uRL5 = new URL(input).pathname;
    return scope === 'video' ? REMOTE_VIDEO_EXTENSION_RE.test(uRL5) : REMOTE_IMAGE_EXTENSION_RE.test(uRL5);
  } catch {
    return false;
  }
}
function getRemoteAssetMaxBytes(output) {
  return output === 'video' ? REMOTE_VIDEO_MAX_BYTES : REMOTE_IMAGE_MAX_BYTES;
}
function getRemoteAssetDownloadTimeoutMs(value2) {
  return value2 === 'video' ? REMOTE_VIDEO_DOWNLOAD_TIMEOUT_MS : REMOTE_ASSET_DOWNLOAD_TIMEOUT_MS;
}
function createRemoteAssetSizeError(value3, value4) {
  return new Error('远程' + value3 + '超过 ' + Math.round(value4 / 0x400 / 0x400) + 'MB 限制');
}
function getRemoteVideoTempRoot(options2 = {}) {
  const value5 = String(options2?.tempRoot || options2?.tempDir || '').trim();
  return value5 || tmpdir();
}
function getRemoteVideoTempFilePath(value6, value7 = {}) {
  const hash = createHash('sha256')
    .update(String(value6 || ''))
    .digest('hex')
    .slice(0, 32);
  return join(getRemoteVideoTempRoot(value7), REMOTE_VIDEO_CACHE_DIR, hash + '.part');
}
async function getExistingFileSize(value8) {
  try {
    const stat2 = await stat(value8);
    return Number(stat2?.size || 0) || 0;
  } catch {
    return 0;
  }
}
async function removeRemoteTempFile(value9) {
  try {
    await rm(value9, { force: true });
  } catch {}
}
function getRemoteResponseContentLength(response) {
  return Number(response?.headers?.get?.('content-length') || 0) || 0;
}
function sanitizeRemoteAssetFilename(value10, value11 = 'web-image') {
  const value12 = String(value10 || value11)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return value12 || value11;
}
function getRemoteFilenameFromHeaders(map, value13, value14 = 'image') {
  const value15 = String(map?.get?.('content-disposition') || ''),
    value16 = value15.match(/filename\*=UTF-8''([^;]+)/i);
  if (value16?.[1])
    try {
      return decodeURIComponent(value16[1].trim().replace(/^"|"$/g, ''));
    } catch {}
  const value17 = value15.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (value17?.[2]) return value17[2].trim();
  try {
    const uRL6 = new URL(value13);
    return (
      decodeURIComponent(uRL6.pathname.split('/').filter(Boolean).pop() || '') ||
      (value14 === 'video' ? 'web-video' : 'web-image')
    );
  } catch {
    return value14 === 'video' ? 'web-video' : 'web-image';
  }
}
function getKnownRemoteAssetExtension(value18, value19) {
  const value20 = String(value19 || '').toLowerCase(),
    map2 =
      value18 === 'video'
        ? new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv'])
        : new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.avif']);
  return map2.has(value20) ? value20 : '';
}
function getFilenameExtension(value21) {
  const value22 = String(value21 || '').match(/(\.[a-z0-9]{2,5})$/i);
  return value22?.[1]?.toLowerCase() || '';
}
function getRemoteAssetExtensionForMime(value23, value24 = 'image') {
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
    }[String(value23 || '').toLowerCase()] || (value24 === 'video' ? '.mp4' : '.img')
  );
}
function ensureFilenameExtension(value25, value26, value27 = 'image') {
  const list = String(value25 || '').trim(),
    list2 = getFilenameExtension(list);
  if (getKnownRemoteAssetExtension(value27, list2)) return list;
  const remoteAssetExtensionForMime = getRemoteAssetExtensionForMime(value26, value27),
    value28 = list2 ? list.slice(0, -list2.length) : list;
  return '' + (value28 || (value27 === 'video' ? 'web-video' : 'web-image')) + remoteAssetExtensionForMime;
}
function getRemoteAssetSession(options3 = {}, handler) {
  const enabled3 = String(options3?.nodeId || '').trim(),
    value29 = String(options3?.tabId || 'default').trim() || 'default';
  if (!enabled3 || typeof handler !== 'function') return null;
  try {
    return handler(enabled3, value29)?.view?.webContents?.session || null;
  } catch {
    return null;
  }
}
function isBlockedByClientError(error) {
  const list3 = [error?.code, error?.name, error?.message, String(error || '')].filter(Boolean).join('\n');
  return list3.includes('ERR_BLOCKED_BY_CLIENT');
}
function addFetchCandidate(list4, fetchFn, label) {
  if (typeof fetchFn !== 'function') return;
  if (list4.some((item2) => item2.fetchFn === fetchFn)) return;
  list4.push({ fetchFn: fetchFn, label: label });
}
function getRemoteAssetFetchCandidates(value30, value31 = {}) {
  const value32 = [];
  return (
    typeof value30?.fetch === 'function' &&
      addFetchCandidate(value32, value30.fetch.bind(value30), 'session'),
    addFetchCandidate(value32, value31.fetchImpl, 'custom'),
    typeof fetch === 'function' && addFetchCandidate(value32, fetch, 'global'),
    value32
  );
}
function createRemoteAssetFetchContext(response2 = {}, value33 = {}) {
  const Accept = normalizeRemoteAssetKind(response2?.kind || response2?.assetKind || 'image'),
    url = normalizeRemoteAssetUrl(response2?.url, Accept),
    Referer = normalizeRemoteAssetReferrer(
      response2?.referrer || response2?.pageUrl || response2?.webPageUrl,
    ),
    label2 = getRemoteAssetKindLabel(Accept),
    maxBytes = getRemoteAssetMaxBytes(Accept),
    headers = {
      Accept: Accept === 'video' ? 'video/*,*/*;q=0.8' : 'image/*,*/*;q=0.8',
      ...(Referer ? { Referer: Referer } : {}),
    },
    remoteAssetSession = getRemoteAssetSession(response2, value33.getWebPreviewEntry),
    value34 = String(remoteAssetSession?.getUserAgent?.() || '').trim();
  if (value34) headers['User-Agent'] = value34;
  const fetchCandidates = getRemoteAssetFetchCandidates(remoteAssetSession, value33);
  if (!fetchCandidates.length) throw new Error('当前环境不支持远程素材下载');
  return {
    kind: Accept,
    url: url,
    label: label2,
    maxBytes: maxBytes,
    headers: headers,
    fetchCandidates: fetchCandidates,
  };
}
async function fetchRemoteAssetResponse(list5, value35, value36 = {}) {
  for (let value37 = 0; value37 < list5.length; value37 += 1) {
    const value38 = list5[value37];
    try {
      return await value38.fetchFn(value35, value36);
    } catch (value39) {
      if (isBlockedByClientError(value39) && value37 < list5.length - 1) continue;
      throw value39;
    }
  }
  return null;
}
function normalizeRemoteResponseChunk(value40) {
  if (Buffer.isBuffer(value40)) return value40;
  if (value40 instanceof ArrayBuffer) return Buffer.from(value40);
  if (value40 instanceof Uint8Array)
    return Buffer.from(value40.buffer, value40.byteOffset, value40.byteLength);
  return Buffer.from(value40 || []);
}
async function writeRemoteStreamChunk(value41, value42) {
  await new Promise((handler2, handler3) => {
    const value43 = (value44) => {
      (value41.off('error', value43), handler3(value44));
    };
    (value41.once('error', value43),
      value41.write(value42, (value45) => {
        value41.off('error', value43);
        if (value45) {
          handler3(value45);
          return;
        }
        handler2();
      }));
  });
}
async function closeRemoteWriteStream(value46) {
  await new Promise((handler4, handler5) => {
    const run = () => {
        (value46.off('error', value47), value46.off('finish', value48));
      },
      value47 = (value49) => {
        (run(), handler5(value49));
      },
      value48 = () => {
        (run(), handler4());
      };
    (value46.once('error', value47), value46.once('finish', value48), value46.end());
  });
}
async function writeRemoteResponseBodyToFile(dom, value50, flags = {}) {
  const value51 = flags.label || '素材',
    value52 = Number(flags.maxBytes || 0) || REMOTE_VIDEO_MAX_BYTES;
  let value53 = Number(flags.initialBytes || 0) || 0;
  await mkdir(dirname(value50), { recursive: true });
  const writeStream = createWriteStream(value50, { flags: flags.append ? 'a' : 'w' }),
    handler6 = async (value54) => {
      const remoteResponseChunk = normalizeRemoteResponseChunk(value54);
      if (!remoteResponseChunk.byteLength) return;
      value53 += remoteResponseChunk.byteLength;
      if (value53 > value52) {
        const remoteAssetSizeError = createRemoteAssetSizeError(value51, value52);
        ((remoteAssetSizeError.code = 'REMOTE_ASSET_TOO_LARGE'), writeStream.destroy());
        throw remoteAssetSizeError;
      }
      await writeRemoteStreamChunk(writeStream, remoteResponseChunk);
    };
  try {
    if (typeof dom?.body?.getReader === 'function') {
      const value55 = dom.body.getReader();
      try {
        while (true) {
          const { done: done, value: value56 } = await value55.read();
          if (done) break;
          await handler6(value56);
        }
      } finally {
        value55.releaseLock?.();
      }
    } else {
      if (dom?.body && typeof dom.body[Symbol.asyncIterator] === 'function')
        for await (const value57 of dom.body) {
          await handler6(value57);
        }
      else {
        if (typeof dom?.arrayBuffer === 'function') await handler6(await dom.arrayBuffer());
        else throw new Error('远程视频响应缺少可读取内容');
      }
    }
    return (await closeRemoteWriteStream(writeStream), value53);
  } catch (value58) {
    writeStream.destroy();
    throw value58;
  }
}
async function fetchRemoteImageAssetBytes(value59, signal) {
  const {
      kind: kind,
      url: url2,
      label: label3,
      maxBytes: maxBytes2,
      headers: headers2,
      fetchCandidates: fetchCandidates2,
    } = value59,
    response3 = await fetchRemoteAssetResponse(fetchCandidates2, url2, {
      method: 'GET',
      redirect: 'follow',
      headers: headers2,
      signal: signal,
    });
  if (!response3?.ok) throw new Error('远程' + label3 + '下载失败：HTTP ' + (response3?.status || 0));
  const remoteResponseContentLength = getRemoteResponseContentLength(response3);
  if (remoteResponseContentLength > maxBytes2) throw createRemoteAssetSizeError(label3, maxBytes2);
  const value60 = String(response3.headers?.get?.('content-type') || ''),
    type = inferRemoteAssetMimeType(kind, url2, value60);
  if (!type && !isLikelyRemoteAssetUrl(kind, url2)) throw new Error('远程资源不是可识别的' + label3);
  const value61 = await response3.arrayBuffer();
  if (value61.byteLength > maxBytes2) throw createRemoteAssetSizeError(label3, maxBytes2);
  const name = sanitizeRemoteAssetFilename(
    ensureFilenameExtension(
      getRemoteFilenameFromHeaders(response3.headers, url2, kind),
      type || 'image/png',
      kind,
    ),
    'web-image.png',
  );
  return {
    kind: kind,
    url: url2,
    bytes: Buffer.from(value61),
    name: name,
    type: type || value60 || '',
  };
}
async function fetchRemoteVideoAssetBytes(value62, signal2 = {}) {
  const {
      kind: kind2,
      url: url3,
      label: label4,
      maxBytes: maxBytes3,
      headers: headers3,
      fetchCandidates: fetchCandidates3,
    } = value62,
    remoteVideoTempFilePath = getRemoteVideoTempFilePath(url3, signal2);
  let initialBytes = await getExistingFileSize(remoteVideoTempFilePath);
  for (let count = 0; count < 2; count += 1) {
    const headers4 = { ...headers3, Range: 'bytes=' + Math.max(0, initialBytes) + '-' },
      response4 = await fetchRemoteAssetResponse(fetchCandidates3, url3, {
        method: 'GET',
        redirect: 'follow',
        headers: headers4,
        signal: signal2.signal,
      });
    if (response4?.status === 0x1a0 && initialBytes > 0 && count === 0) {
      (await removeRemoteTempFile(remoteVideoTempFilePath), (initialBytes = 0));
      continue;
    }
    if (!response4?.ok) throw new Error('远程' + label4 + '下载失败：HTTP ' + (response4?.status || 0));
    let append = initialBytes > 0;
    initialBytes > 0 &&
      Number(response4.status || 0) === 200 &&
      (await removeRemoteTempFile(remoteVideoTempFilePath), (initialBytes = 0), (append = false));
    const remoteResponseContentLength2 = getRemoteResponseContentLength(response4);
    if (remoteResponseContentLength2 > 0 && initialBytes + remoteResponseContentLength2 > maxBytes3) {
      await removeRemoteTempFile(remoteVideoTempFilePath);
      throw createRemoteAssetSizeError(label4, maxBytes3);
    }
    const value63 = String(response4.headers?.get?.('content-type') || ''),
      type2 = inferRemoteAssetMimeType(kind2, url3, value63);
    if (!type2 && !isLikelyRemoteAssetUrl(kind2, url3)) {
      await removeRemoteTempFile(remoteVideoTempFilePath);
      throw new Error('远程资源不是可识别的' + label4);
    }
    if (REMOTE_STREAM_MEDIA_EXTENSION_RE.test(new URL(url3).pathname)) {
      await removeRemoteTempFile(remoteVideoTempFilePath);
      throw new Error('不支持保存流媒体播放列表或加密分段视频');
    }
    try {
      await writeRemoteResponseBodyToFile(response4, remoteVideoTempFilePath, {
        append: append,
        initialBytes: initialBytes,
        maxBytes: maxBytes3,
        label: label4,
      });
    } catch (value64) {
      value64?.code === 'REMOTE_ASSET_TOO_LARGE' && (await removeRemoteTempFile(remoteVideoTempFilePath));
      throw value64;
    }
    const bytes = await readFile(remoteVideoTempFilePath);
    if (bytes.byteLength > maxBytes3) {
      await removeRemoteTempFile(remoteVideoTempFilePath);
      throw createRemoteAssetSizeError(label4, maxBytes3);
    }
    const name2 = sanitizeRemoteAssetFilename(
      ensureFilenameExtension(
        getRemoteFilenameFromHeaders(response4.headers, url3, kind2),
        type2 || 'video/mp4',
        kind2,
      ),
      'web-video.mp4',
    );
    return (
      await removeRemoteTempFile(remoteVideoTempFilePath),
      {
        kind: kind2,
        url: url3,
        bytes: bytes,
        name: name2,
        type: type2 || value63 || '',
      }
    );
  }
  throw new Error('远程' + label4 + '下载失败：HTTP 416');
}
async function fetchRemoteAssetBytes(options4 = {}, args = {}) {
  const remoteAssetFetchContext = createRemoteAssetFetchContext(options4, args),
    signal3 = new AbortController(),
    setTimeout2 = setTimeout(
      () => signal3.abort(),
      getRemoteAssetDownloadTimeoutMs(remoteAssetFetchContext.kind),
    );
  try {
    if (remoteAssetFetchContext.kind === 'video')
      return await fetchRemoteVideoAssetBytes(remoteAssetFetchContext, { ...args, signal: signal3.signal });
    return await fetchRemoteImageAssetBytes(remoteAssetFetchContext, signal3.signal);
  } finally {
    clearTimeout(setTimeout2);
  }
}
export function createRemoteAssetImporter({
  importAssetToLibrary: importAssetToLibrary,
  getWebPreviewEntry: getWebPreviewEntry,
  fetchImpl: fetchImpl,
  tempRoot: tempRoot,
} = {}) {
  return async function run2(name3 = {}) {
    if (typeof importAssetToLibrary !== 'function') throw new Error('素材库导入服务尚未就绪');
    const bytes2 = await fetchRemoteAssetBytes(name3, {
      getWebPreviewEntry: getWebPreviewEntry,
      fetchImpl: fetchImpl,
      tempRoot: tempRoot,
    });
    return await importAssetToLibrary({
      name: name3?.name || bytes2.name,
      type: name3?.type || bytes2.type,
      projectId: name3?.projectId,
      bytes: bytes2.bytes,
    });
  };
}
