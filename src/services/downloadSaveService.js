import { deleteOutputFilesFromServer, fetchRemoteBlob, saveOutputToServer } from '../../api/projectsV2Api.js';
import { desktopBridge } from './desktopBridge.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
const DEFAULT_MEDIA_EXTENSIONS = Object.freeze({ image: 'png', video: 'mp4', audio: 'mp3' }),
  MIME_EXTENSIONS = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
  });
function trimText(value) {
  return String(value || '').trim();
}
function normalizeKind(item) {
  const trimText2 = trimText(item).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_MEDIA_EXTENSIONS, trimText2))
    throw new Error('不支持的媒体文件类型');
  return trimText2;
}
function normalizeExternalUrl(key) {
  const trimText3 = trimText(key);
  if (!trimText3) return '';
  if (trimText3.startsWith('//')) {
    const index = /^https?:$/i.test(String(globalThis.location?.protocol || ''))
      ? globalThis.location.protocol
      : 'https:';
    return '' + index + trimText3;
  }
  return trimText3;
}
function extensionFromFile({ filename: filename, blob: blob, kind: kind }) {
  const trimText4 = trimText(filename).match(/\.([a-z0-9]{1,10})$/i);
  if (trimText4?.[1]) return trimText4[1].toLowerCase();
  const trimText5 = trimText(blob?.type).split(';', 1)[0].toLowerCase();
  return MIME_EXTENSIONS[trimText5] || DEFAULT_MEDIA_EXTENSIONS[kind] || 'bin';
}
function getDependency(result, data, options) {
  return Object.prototype.hasOwnProperty.call(result || {}, data) ? result[data] : options;
}
function canUseCapability(target, source, next) {
  const enabled = target?.nodeExport;
  if (!enabled) return false;
  if (typeof enabled[source] === 'function') return enabled[source]() === true;
  return typeof enabled[next] === 'function';
}
function triggerHrefDownload({
  url: url,
  filename: filename2,
  documentRef: documentRef = globalThis.document,
}) {
  if (!url || !documentRef?.createElement) throw new Error('当前环境无法下载文件');
  const el = documentRef.createElement('a');
  ((el.href = url),
    (el.download = filename2 || 'download'),
    (el.rel = 'noopener'),
    (el.hidden = true),
    documentRef.body?.appendChild?.(el),
    el.click(),
    el.remove?.());
  if (el.parentNode) el.parentNode.removeChild?.(el);
}
function triggerBlobDownload({
  blob: blob2,
  filename: filename3,
  documentRef: documentRef = globalThis.document,
  urlApi: urlApi = globalThis.URL,
  schedule: schedule = globalThis.setTimeout,
}) {
  if (!blob2 || typeof urlApi?.createObjectURL !== 'function') throw new Error('当前环境无法下载文件');
  const url2 = urlApi.createObjectURL(blob2);
  try {
    triggerHrefDownload({ url: url2, filename: filename3, documentRef: documentRef });
  } finally {
    typeof schedule === 'function'
      ? schedule(() => urlApi.revokeObjectURL?.(url2), 0)
      : urlApi.revokeObjectURL?.(url2);
  }
}
async function persistBlobAsLocalMedia({ blob: blob3, filename: filename4, kind: kind2 }, current) {
  const run = getDependency(current, 'saveOutputToServer', saveOutputToServer);
  if (typeof run !== 'function') throw new Error('当前环境无法暂存媒体文件');
  const entry = await run(blob3, {
      ext: extensionFromFile({ filename: filename4, blob: blob3, kind: kind2 }),
      subDir: 'desktop-save-staging',
    }),
    localPath = pickResultLocalPath(entry);
  if (!localPath) throw new Error('暂存媒体文件后未返回本地路径');
  return { localPath: localPath, url: localPathToUrl(localPath), staged: true };
}
async function cleanupStagedMedia(record, payload) {
  const localPaths = (Array.isArray(record) ? record : [record])
    .filter((handle) => handle?.staged === true && handle?.localPath)
    .map((state) => state.localPath);
  if (localPaths.length === 0) return;
  const run2 = getDependency(payload, 'deleteOutputFilesFromServer', deleteOutputFilesFromServer);
  if (typeof run2 !== 'function') return;
  try {
    await run2({ localPaths: localPaths });
  } catch (config) {
    console.warn('[downloadSaveService] cleanup staging files failed', config);
  }
}
async function resolveDesktopMediaSource(filename5, scope) {
  const kind3 = normalizeKind(filename5?.kind),
    url3 = normalizeExternalUrl(filename5?.url),
    localPath2 = normalizeLocalPath(filename5?.localPath || url3);
  if (localPath2) return { kind: kind3, localPath: localPath2, url: localPathToUrl(localPath2), staged: false };
  let blob4 = filename5?.blob || null;
  if (!blob4 && /^(?:blob:|data:)/i.test(url3)) {
    const run3 = getDependency(scope, 'fetchRemoteBlob', fetchRemoteBlob);
    if (typeof run3 !== 'function') throw new Error('当前环境无法读取临时媒体文件');
    blob4 = await run3(url3);
  }
  if (blob4)
    return {
      kind: kind3,
      ...(await persistBlobAsLocalMedia(
        { blob: blob4, filename: filename5?.filename, kind: kind3 },
        scope,
      )),
    };
  if (/^https?:/i.test(url3)) return { kind: kind3, localPath: '', url: url3, staged: false };
  throw new Error('没有可保存的媒体文件');
}
function browserMediaUrl(response) {
  const localPath3 = normalizeLocalPath(response?.localPath || response?.url);
  return localPathToUrl(localPath3) || normalizeExternalUrl(response?.url);
}
export async function saveTextDownload(options2 = {}, input = {}) {
  const dependency = getDependency(input, 'desktopBridge', desktopBridge);
  if (canUseCapability(dependency, 'canSaveText', 'saveText'))
    return await dependency.nodeExport.saveText({
      filename: trimText(options2?.filename) || 'export.txt',
      content: String(options2?.content ?? ''),
      mimeType: trimText(options2?.mimeType),
      title: trimText(options2?.title),
      filterName: trimText(options2?.filterName),
    });
  const run4 = getDependency(input, 'Blob', globalThis.Blob);
  if (typeof run4 !== 'function') throw new Error('当前环境无法创建下载文件');
  const blob5 = new run4([String(options2?.content ?? '')], {
    type: trimText(options2?.mimeType) || 'text/plain;charset=utf-8',
  });
  return (
    triggerBlobDownload({
      blob: blob5,
      filename: trimText(options2?.filename) || 'export.txt',
      documentRef: getDependency(input, 'documentRef', globalThis.document),
      urlApi: getDependency(input, 'urlApi', globalThis.URL),
      schedule: getDependency(input, 'schedule', globalThis.setTimeout),
    }),
    { success: true, canceled: false, mode: 'browser' }
  );
}
export async function saveMediaDownload(blob6 = {}, output = {}) {
  const dependency2 = getDependency(output, 'desktopBridge', desktopBridge);
  if (canUseCapability(dependency2, 'canSaveMedia', 'saveMedia')) {
    const kind4 = await resolveDesktopMediaSource(blob6, output),
      value2 = await dependency2.nodeExport.saveMedia({
        kind: kind4.kind,
        localPath: kind4.localPath,
        url: kind4.url,
        filename: trimText(blob6?.filename),
        title: trimText(blob6?.title),
      });
    return (await cleanupStagedMedia(kind4, output), value2);
  }
  return (
    blob6?.blob
      ? triggerBlobDownload({
          blob: blob6.blob,
          filename: trimText(blob6?.filename),
          documentRef: getDependency(output, 'documentRef', globalThis.document),
          urlApi: getDependency(output, 'urlApi', globalThis.URL),
          schedule: getDependency(output, 'schedule', globalThis.setTimeout),
        })
      : triggerHrefDownload({
          url: browserMediaUrl(blob6),
          filename: trimText(blob6?.filename),
          documentRef: getDependency(output, 'documentRef', globalThis.document),
        }),
    { success: true, canceled: false, mode: 'browser' }
  );
}
export async function saveMediaFilesDownload(options3 = {}, args = {}) {
  const count = Array.isArray(options3?.files) ? options3.files : [];
  if (count.length === 0) throw new Error('没有可保存的媒体文件');
  const dependency3 = getDependency(args, 'desktopBridge', desktopBridge);
  if (canUseCapability(dependency3, 'canSaveMediaFiles', 'saveMediaFiles')) {
    const files = [],
      list = [];
    for (const value3 of count) {
      const kind5 = await resolveDesktopMediaSource(value3, args);
      (list.push(kind5),
        files.push({
          kind: kind5.kind,
          localPath: kind5.localPath,
          url: kind5.url,
          filename: trimText(value3?.filename),
        }));
    }
    const value4 = await dependency3.nodeExport.saveMediaFiles({
      title: trimText(options3?.title),
      files: files,
    });
    return (await cleanupStagedMedia(list, args), value4);
  }
  for (const value5 of count) {
    await saveMediaDownload(value5, { ...args, desktopBridge: null });
  }
  return { success: true, canceled: false, count: count.length, mode: 'browser' };
}
export const __downloadSaveServiceForTest = Object.freeze({
  cleanupStagedMedia: cleanupStagedMedia,
  resolveDesktopMediaSource: resolveDesktopMediaSource,
  triggerHrefDownload: triggerHrefDownload,
  triggerBlobDownload: triggerBlobDownload,
});
