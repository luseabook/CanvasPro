import { createHash, randomBytes } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createAssetDerivativeScheduler } from './assetDerivativeScheduler.js';
import { createAssetIndexCoordinator } from './assetIndexCoordinator.js';
import { readAssetIndexFile, writeAssetIndexFile } from './assetIndexFileStore.js';
import { getExistingAssetOriginalFilename, materializeAssetOriginal } from './assetOriginalStore.js';
import { createKeyedOperationQueue } from './keyedOperationQueue.js';
import {
  VIDEO_PLAYBACK_PROXY_VERSION,
  getVideoPlaybackProxyFilename,
  isCurrentVideoPlaybackProxyLocalPath,
  needsBrowserVideoProxy,
} from './videoPlaybackProxy.js';
const ASSET_MEDIA_TASK_FIELDS = Object.freeze([
  'mediaTaskId',
  'mediaTaskKind',
  'mediaTaskStatus',
  'mediaTaskProgress',
  'mediaTaskError',
]);
function requireFunction(value, label) {
  if (typeof value !== 'function') throw new TypeError(label + ' must be a function');
  return value;
}
function sanitizeUploadFilename(filename) {
  const basename = path.basename(String(filename || 'upload'));
  return basename.replace(/[\\/:*?"<>|]/g, '_').trim() || 'upload';
}
function getSafeOriginalExtension(filename, mimeType = '') {
  const extension = path.extname(sanitizeUploadFilename(filename)).toLowerCase();
  if (extension && extension.length <= 12) return extension;
  const normalizedType = String(mimeType || '')
      .split(';')[0]
      .trim()
      .toLowerCase(),
    extensionByType = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/avif': '.avif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/mp4': '.m4a',
      'audio/x-m4a': '.m4a',
      'audio/aac': '.aac',
      'audio/ogg': '.ogg',
      'audio/flac': '.flac',
      'audio/webm': '.webm',
    };
  return extensionByType[normalizedType] || '.bin';
}
function classifyAssetKind(filename = '', mimeType = '') {
  const normalizedType = String(mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (normalizedType.startsWith('image/')) return 'image';
  if (normalizedType.startsWith('video/')) return 'video';
  if (normalizedType.startsWith('audio/')) return 'audio';
  const extension = path.extname(String(filename || '')).toLowerCase();
  if (/\.(?:png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(extension)) return 'image';
  if (/\.(?:mp4|webm|mov|m4v|avi|mkv)$/i.test(extension)) return 'video';
  if (/\.(?:mp3|wav|m4a|aac|ogg|flac|opus|webm)$/i.test(extension)) return 'audio';
  return 'file';
}
function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
async function hashFileSha256(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = createHash('sha256'),
      stream = createReadStream(filePath);
    (stream.on('data', (chunk) => hash.update(chunk)),
      stream.once('error', reject),
      stream.once('end', () => resolve(hash.digest('hex'))));
  });
}
function bufferFromImportPayload(payload = {}) {
  const bytes = payload?.bytes;
  if (!bytes) return null;
  if (Buffer.isBuffer(bytes)) return bytes;
  if (bytes instanceof ArrayBuffer) return Buffer.from(bytes);
  if (ArrayBuffer.isView(bytes)) return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (Array.isArray(bytes)) return Buffer.from(bytes);
  return null;
}
function resizeImageToMaxEdge(image, maxEdge) {
  const size = image.getSize(),
    width = Number(size.width) || 0,
    height = Number(size.height) || 0;
  if (width <= 0 || height <= 0) return null;
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) return image;
  const scale = maxEdge / longestEdge;
  return image.resize({
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    quality: 'best',
  });
}
function writeImageDerivativeAtomically(targetPath, buffer) {
  const tempPath = targetPath + '.' + randomBytes(8).toString('hex') + '.tmp';
  try {
    (writeFileSync(tempPath, buffer), renameSync(tempPath, targetPath));
  } finally {
    rmSync(tempPath, { force: true });
  }
}
function preserveLatestAssetFields(target, source, fields) {
  for (const field of fields) {
    Object.prototype.hasOwnProperty.call(source, field) && (target[field] = source[field]);
  }
}
export function buildAssetCapabilityResponse(
  asset,
  { reused: reused = false, derivativeStatus: derivativeStatus = '' } = {},
) {
  const primaryLocalPath =
    asset.kind === 'image' || asset.kind === 'video'
      ? asset.displayLocalPath || asset.originalLocalPath
      : asset.originalLocalPath;
  return {
    success: true,
    assetId: asset.assetId,
    assetRevision: Math.max(0, Math.trunc(Number(asset.assetRevision || 0)) || 0),
    assetUpdatedAt: asset.updatedAt || '',
    reused: !!reused,
    kind: asset.kind,
    url: primaryLocalPath ? '/' + primaryLocalPath : '',
    localPath: asset.originalLocalPath || '',
    originalLocalPath: asset.originalLocalPath || '',
    displayLocalPath: asset.displayLocalPath || '',
    thumbLocalPath: asset.thumbLocalPath || asset.posterLocalPath || '',
    posterLocalPath: asset.posterLocalPath || '',
    waveformLocalPath: asset.waveformLocalPath || '',
    filename: asset.originalName || asset.filename || '',
    storedFilename: path.basename(asset.originalLocalPath || ''),
    size: Number(asset.size || 0),
    type: asset.mimeType || '',
    derivativeStatus: derivativeStatus || asset.status || '',
    status: asset.status || '',
    mediaTaskId: asset.mediaTaskId || '',
    mediaTaskKind: asset.mediaTaskKind || '',
    mediaTaskStatus: asset.mediaTaskStatus || '',
    mediaTaskProgress: Number(asset.mediaTaskProgress || 0) || 0,
    mediaTaskError: asset.mediaTaskError || '',
    videoProxyStatus: asset.videoProxyStatus || '',
    videoProxyVersion: asset.videoProxyVersion || '',
    videoCodec: asset.videoCodec || '',
    videoWidth: Number(asset.videoWidth || asset.width || 0) || 0,
    videoHeight: Number(asset.videoHeight || asset.height || 0) || 0,
    videoDuration: Number(asset.videoDuration || 0) || 0,
    videoFps: Number(asset.videoFps || 0) || 0,
    width: Number(asset.width || asset.videoWidth || 0) || 0,
    height: Number(asset.height || asset.videoHeight || 0) || 0,
    originalUrl: asset.originalLocalPath ? '/' + asset.originalLocalPath : '',
    displayUrl: asset.displayLocalPath ? '/' + asset.displayLocalPath : '',
    thumbUrl: asset.thumbLocalPath
      ? '/' + asset.thumbLocalPath
      : asset.posterLocalPath
        ? '/' + asset.posterLocalPath
        : '',
    posterUrl: asset.posterLocalPath ? '/' + asset.posterLocalPath : '',
    waveformUrl: asset.waveformLocalPath ? '/' + asset.waveformLocalPath : '',
  };
}
export function createAssetCapabilityOperations({
  getAssetsDir: getAssetsDir,
  getMediaTaskQueue: getMediaTaskQueue,
  createImageFromPath: createImageFromPath,
  createImageDerivatives: createImageDerivatives = null,
  probeVideoPlaybackInfo: probeVideoPlaybackInfo,
  publishAssetUpdate: publishAssetUpdate = () => {},
  shouldBufferAssetUpdates: shouldBufferAssetUpdates = () => false,
  isImportLoggingEnabled: isImportLoggingEnabled = () => false,
  now: now = Date.now,
  createRandomHex: createRandomHex = (byteLength) => randomBytes(byteLength).toString('hex'),
  logInfo: logInfo = (...args) => console.log(...args),
  logWarning: logWarning = (...args) => console.warn(...args),
} = {}) {
  const getAssetsDirFn = requireFunction(getAssetsDir, 'getAssetsDir'),
    getMediaTaskQueueFn = requireFunction(getMediaTaskQueue, 'getMediaTaskQueue'),
    createImageFromPathFn = requireFunction(createImageFromPath, 'createImageFromPath'),
    probeVideoPlaybackInfoFn = requireFunction(probeVideoPlaybackInfo, 'probeVideoPlaybackInfo'),
    nowFn = requireFunction(now, 'now'),
    importQueue = createKeyedOperationQueue(),
    bufferedAssetUpdates = [];
  function toAssetLocalPath(...segments) {
    return ['data', 'assets', ...segments].filter(Boolean).join('/').replace(/\\/g, '/');
  }
  function getOriginalDir() {
    return path.join(getAssetsDirFn(), 'original');
  }
  function getIndexPath() {
    return path.join(getAssetsDirFn(), 'assets.index.json');
  }
  function readIndex() {
    return readAssetIndexFile(getIndexPath());
  }
  function writeIndex(index) {
    writeAssetIndexFile(getIndexPath(), index);
  }
  const indexCoordinator = createAssetIndexCoordinator({
    readIndex: readIndex,
    writeIndex: writeIndex,
    now: () => new Date(nowFn()).toISOString(),
  });
  function getProxyPaths(assetId) {
    const proxyDir = path.join(getAssetsDirFn(), 'derived', 'video'),
      filename = getVideoPlaybackProxyFilename(assetId);
    return { proxyAbs: path.join(proxyDir, filename) };
  }
  function isProxyCurrent(asset = {}) {
    if (asset.videoProxyVersion !== VIDEO_PLAYBACK_PROXY_VERSION) return false;
    if (!isCurrentVideoPlaybackProxyLocalPath(asset.displayLocalPath, asset.assetId)) return false;
    const { proxyAbs: proxyAbs } = getProxyPaths(asset.assetId);
    try {
      return existsSync(proxyAbs) && statSync(proxyAbs).size > 0;
    } catch {
      return false;
    }
  }
  function isVideoAssetReady(asset = {}) {
    if (asset.kind !== 'video') return false;
    if (!asset.posterLocalPath) return false;
    if (asset.videoProxyStatus === 'not_required') return true;
    return isProxyCurrent(asset);
  }
  function mergeAssetRecord(previous, next) {
    const existing = previous || {},
      merged = { ...existing, ...next, createdAt: existing.createdAt || next.createdAt };
    existing.mediaTaskId && preserveLatestAssetFields(merged, existing, ASSET_MEDIA_TASK_FIELDS);
    if (merged.kind === 'video') {
      if (existing.posterLocalPath) merged.posterLocalPath = existing.posterLocalPath;
      if (existing.thumbLocalPath) merged.thumbLocalPath = existing.thumbLocalPath;
      isProxyCurrent(existing) &&
        preserveLatestAssetFields(merged, existing, [
          'displayLocalPath',
          'videoProxyStatus',
          'videoProxyVersion',
        ]);
      merged.status = isVideoAssetReady(merged) ? 'ready' : 'processing';
      if (merged.status === 'ready') merged.error = '';
    } else {
      if (merged.kind === 'audio') {
        existing.waveformLocalPath && (merged.waveformLocalPath = existing.waveformLocalPath);
        merged.status = merged.waveformLocalPath ? 'ready' : 'processing';
        if (merged.status === 'ready') merged.error = '';
      }
    }
    return merged;
  }
  function updateAssetRecord(assetId, fields, options = {}) {
    return indexCoordinator.patch(assetId, fields, options);
  }
  function publishAsset(asset) {
    if (!asset) return;
    const response = buildAssetCapabilityResponse(asset);
    if (shouldBufferAssetUpdates()) {
      bufferedAssetUpdates.push(response);
      while (bufferedAssetUpdates.length > 200) {
        bufferedAssetUpdates.shift();
      }
    }
    publishAssetUpdate(response);
  }
  function consumeAssetUpdateEvents() {
    return bufferedAssetUpdates.splice(0, bufferedAssetUpdates.length);
  }
  const scheduleAssetDerivatives = createAssetDerivativeScheduler({
    readAssetRecord: (assetId) => readIndex().assets[assetId] || null,
    getQueue: getMediaTaskQueueFn,
    updateAssetRecord: updateAssetRecord,
    sendAssetUpdated: publishAsset,
    createTaskId: (kind) => 'asset-' + kind + '-' + nowFn() + '-' + createRandomHex(6),
  });
  async function ensureImageDerivatives(assetId, sourceAbs, previousRecord = {}) {
    const derivedDir = path.join(getAssetsDirFn(), 'derived', 'image'),
      displayAbs = path.join(derivedDir, assetId + '.display.png'),
      thumbAbs = path.join(derivedDir, assetId + '.thumb.png'),
      paths = {
        displayLocalPath: toAssetLocalPath('derived', 'image', assetId + '.display.png'),
        thumbLocalPath: toAssetLocalPath('derived', 'image', assetId + '.thumb.png'),
        imageDerivativeVersion: createImageDerivatives ? 2 : 1,
      };
    if (
      previousRecord.imageDerivativeVersion === paths.imageDerivativeVersion &&
      previousRecord.originalWidth > 0 &&
      previousRecord.originalHeight > 0 &&
      [displayAbs, thumbAbs].every(
        (candidate) => existsSync(candidate) && statSync(candidate).size > 0,
      )
    )
      return {
        ...paths,
        originalWidth: previousRecord.originalWidth,
        originalHeight: previousRecord.originalHeight,
      };
    if (createImageDerivatives) {
      const derived = await createImageDerivatives(sourceAbs);
      if (
        !(
          derived.originalWidth > 0 &&
          derived.originalHeight > 0 &&
          derived.displayPng?.length &&
          derived.thumbPng?.length
        )
      )
        throw new Error('Incomplete image derivatives');
      return (
        mkdirSync(derivedDir, { recursive: true }),
        writeImageDerivativeAtomically(displayAbs, derived.displayPng),
        writeImageDerivativeAtomically(thumbAbs, derived.thumbPng),
        {
          ...paths,
          originalWidth: derived.originalWidth,
          originalHeight: derived.originalHeight,
        }
      );
    }
    const image = createImageFromPathFn(sourceAbs),
      size = image.getSize(),
      width = Number(size.width) || 0,
      height = Number(size.height) || 0;
    if (image.isEmpty() || width <= 0 || height <= 0) return {};
    mkdirSync(derivedDir, { recursive: true });
    const display = resizeImageToMaxEdge(image, 1280),
      thumb = resizeImageToMaxEdge(image, 320);
    if (!display || !thumb) return {};
    return (
      writeImageDerivativeAtomically(displayAbs, display.toPNG()),
      writeImageDerivativeAtomically(thumbAbs, thumb.toPNG()),
      {
        ...paths,
        displayLocalPath: toAssetLocalPath('derived', 'image', assetId + '.display.png'),
        thumbLocalPath: toAssetLocalPath('derived', 'image', assetId + '.thumb.png'),
        originalWidth: width,
        originalHeight: height,
      }
    );
  }
  async function importAssetToLibrary(payload = {}) {
    const startedAt = nowFn(),
      sourcePath = String(payload?.path || '').trim(),
      bytes = bufferFromImportPayload(payload);
    if (!sourcePath && !bytes) throw new Error('缺少文件路径或文件内容');
    const absolutePath = sourcePath ? realpathSync(sourcePath) : '';
    let sourceStats = null;
    if (absolutePath) {
      if (!path.isAbsolute(absolutePath)) throw new Error('文件路径必须是绝对路径');
      sourceStats = statSync(absolutePath);
      if (!sourceStats.isFile()) throw new Error('只支持导入文件');
    }
    const originalName = sanitizeUploadFilename(
        payload?.name || (absolutePath ? path.basename(absolutePath) : 'asset'),
      ),
      mimeType = String(payload?.type || '').trim(),
      assetId = bytes ? hashBuffer(bytes) : await hashFileSha256(absolutePath);
    return importQueue.run(assetId, async () => {
      const kind = classifyAssetKind(originalName, mimeType),
        extension = getSafeOriginalExtension(originalName, mimeType),
        index = readIndex(),
        previousRecord = index.assets[assetId] || {},
        originalDir = getOriginalDir();
      mkdirSync(originalDir, { recursive: true });
      const storedFilename = getExistingAssetOriginalFilename(assetId, previousRecord) || '' + assetId + extension,
        targetAbs = path.join(originalDir, storedFilename),
        originalLocalPath = toAssetLocalPath('original', storedFilename),
        size = bytes ? bytes.length : Number(sourceStats?.size || 0),
        materialized = await materializeAssetOriginal({
          targetPath: targetAbs,
          expectedSha256: assetId,
          expectedSize: size,
          ...(bytes ? { sourceBuffer: bytes } : { sourcePath: absolutePath }),
        }),
        reused = materialized.reused,
        timestamp = new Date(nowFn()).toISOString();
      let record = {
        ...previousRecord,
        assetId: assetId,
        kind: kind,
        originalName: originalName,
        filename: originalName,
        mimeType: mimeType,
        size: size,
        sha256: assetId,
        originalLocalPath: originalLocalPath,
        createdAt: previousRecord.createdAt || timestamp,
        updatedAt: timestamp,
        status:
          previousRecord.status || (kind === 'image' || kind === 'file' ? 'ready' : 'processing'),
        error: previousRecord.error || '',
      };
      if (kind === 'image')
        try {
          record = {
            ...record,
            ...(await ensureImageDerivatives(assetId, targetAbs, record)),
            status: 'ready',
            error: '',
          };
        } catch (error) {
          ((record = {
            ...record,
            status: 'partial',
            imageDerivativeVersion: 0,
            error: String(error?.message || error),
          }),
            logWarning('[electron] image asset derivative failed:', error));
        }
      else {
        if (kind === 'video') {
          try {
            const meta = await probeVideoPlaybackInfoFn(targetAbs),
              needsProxy = needsBrowserVideoProxy(meta),
              proxyCurrent =
                record.videoProxyVersion === VIDEO_PLAYBACK_PROXY_VERSION &&
                isCurrentVideoPlaybackProxyLocalPath(record.displayLocalPath, assetId);
            record = {
              ...record,
              displayLocalPath: needsProxy ? record.displayLocalPath || '' : '',
              videoCodec: meta.codecName,
              videoWidth: meta.width,
              videoHeight: meta.height,
              width: meta.width,
              height: meta.height,
              videoDuration: meta.duration,
              videoFps: meta.fps,
              videoProxyStatus: needsProxy ? (proxyCurrent ? 'generated' : 'processing') : 'not_required',
              videoProxyVersion: needsProxy && proxyCurrent ? VIDEO_PLAYBACK_PROXY_VERSION : '',
            };
          } catch (error) {
            ((record = {
              ...record,
              videoProxyStatus:
                record.videoProxyVersion === VIDEO_PLAYBACK_PROXY_VERSION &&
                isCurrentVideoPlaybackProxyLocalPath(record.displayLocalPath, assetId)
                  ? 'generated'
                  : 'processing',
              error: record.error || String(error?.message || error),
            }),
              logWarning('[electron] video asset metadata probe failed:', error));
          }
          record.status = isVideoAssetReady(record) ? 'ready' : 'processing';
        } else
          kind === 'audio' && (record.status = record.waveformLocalPath ? 'ready' : 'processing');
      }
      record = indexCoordinator.commit(assetId, (existing) => mergeAssetRecord(existing, record));
      const scheduled = scheduleAssetDerivatives(record);
      return (
        scheduled &&
          (record = readIndex().assets[assetId] || {
            ...record,
            status: 'processing',
            mediaTaskId: scheduled.taskId,
            mediaTaskKind: scheduled.kind,
            mediaTaskStatus: scheduled.status,
            mediaTaskProgress: scheduled.progress,
            mediaTaskError: '',
          }),
        isImportLoggingEnabled() &&
          logInfo('[asset-import] done', {
            t: nowFn(),
            elapsedMs: nowFn() - startedAt,
            assetId: assetId,
            kind: kind,
            reused: reused,
            originalLocalPath: originalLocalPath,
            status: record.status,
          }),
        buildAssetCapabilityResponse(record, { reused: reused, derivativeStatus: record.status })
      );
    });
  }
  return {
    buildAssetResponse: buildAssetCapabilityResponse,
    consumeAssetUpdateEvents: consumeAssetUpdateEvents,
    importAssetToLibrary: importAssetToLibrary,
    isVideoAssetReady: isVideoAssetReady,
    readAssetIndex: readIndex,
    sendAssetUpdated: publishAsset,
    toAssetLocalPath: toAssetLocalPath,
    updateAssetRecord: updateAssetRecord,
  };
}
