import { createHash, randomBytes } from 'node:crypto';
import { mkdir, lstat, open, rename, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
export function getExistingAssetOriginalFilename(assetId, record = {}) {
  const normalizedId = String(assetId || '').trim();
  if (!SHA256_PATTERN.test(normalizedId)) return '';
  const localPath = String(record.originalLocalPath || '').replace(/\\/g, '/');
  if (path.posix.dirname(localPath) !== 'data/assets/original') return '';
  const filename = path.posix.basename(localPath);
  if (!filename.startsWith(normalizedId)) return '';
  const suffix = filename.slice(normalizedId.length);
  if (suffix && !/^\.[a-z0-9]{1,12}$/i.test(suffix)) return '';
  return filename;
}
const targetQueues = new Map();
export class AssetOriginalIntegrityError extends Error {
  constructor({ expectedSha256, actualSha256, expectedSize, actualSize }) {
    (super(
      'Asset original integrity mismatch: expected ' +
        expectedSize +
        ' bytes/' +
        expectedSha256 +
        ', got ' +
        actualSize +
        ' bytes/' +
        (actualSha256 ?? 'unavailable'),
    ),
      (this.name = 'AssetOriginalIntegrityError'),
      (this.code = 'ASSET_ORIGINAL_INTEGRITY_MISMATCH'),
      (this.expectedSha256 = expectedSha256),
      (this.actualSha256 = actualSha256),
      (this.expectedSize = expectedSize),
      (this.actualSize = actualSize));
  }
}
function normalizeOptions(options) {
  if (!options || typeof options !== 'object')
    throw new TypeError('Asset original options must be an object');
  const {
    targetPath: targetPath,
    expectedSha256: expectedSha256,
    expectedSize: expectedSize,
    sourcePath: sourcePath,
    sourceBuffer: sourceBuffer,
    sourceStream: sourceStream,
    createSourceStream: createSourceStream,
  } = options;
  if (typeof targetPath !== 'string' || targetPath.trim() === '')
    throw new TypeError('targetPath must be a non-empty string');
  if (typeof expectedSha256 !== 'string' || !SHA256_PATTERN.test(expectedSha256))
    throw new TypeError('expectedSha256 must be a 64-character hex string');
  if (!Number.isSafeInteger(expectedSize) || expectedSize < 0)
    throw new RangeError('expectedSize must be a non-negative safe integer');
  const sourceCount = [sourcePath !== undefined, sourceBuffer !== undefined, sourceStream !== undefined, createSourceStream !== undefined]
    .filter(Boolean).length;
  if (sourceCount !== 1)
    throw new TypeError(
      'Exactly one of sourcePath, sourceBuffer, sourceStream, or createSourceStream is required',
    );
  if (sourcePath !== undefined && typeof sourcePath !== 'string')
    throw new TypeError('sourcePath must be a string');
  if (
    sourceBuffer !== undefined &&
    !Buffer.isBuffer(sourceBuffer) &&
    !(sourceBuffer instanceof Uint8Array) &&
    !(sourceBuffer instanceof ArrayBuffer)
  )
    throw new TypeError('sourceBuffer must be a Buffer, Uint8Array, or ArrayBuffer');
  if (createSourceStream !== undefined && typeof createSourceStream !== 'function')
    throw new TypeError('createSourceStream must be a function');
  return {
    targetPath: path.resolve(targetPath),
    expectedSha256: expectedSha256.toLowerCase(),
    expectedSize: expectedSize,
    sourcePath: sourcePath === undefined ? undefined : path.resolve(sourcePath),
    sourceBuffer: sourceBuffer,
    sourceStream: sourceStream,
    createSourceStream: createSourceStream,
  };
}
function targetQueueKey(targetPath) {
  return process.platform === 'win32' || process.platform === 'darwin'
    ? targetPath.toLowerCase()
    : targetPath;
}
function runForTarget(targetPath, task) {
  const key = targetQueueKey(targetPath),
    previous = targetQueues.get(key) ?? Promise.resolve(),
    current = previous.catch(() => undefined).then(task);
  return (
    targetQueues.set(key, current),
    current.finally(() => {
      targetQueues.get(key) === current && targetQueues.delete(key);
    })
  );
}
async function inspectExistingTarget({ targetPath: targetPath, expectedSha256: expectedSha256, expectedSize: expectedSize }) {
  try {
    const stats = await lstat(targetPath);
    if (!stats.isFile()) {
      const error = new Error('Asset original target exists but is not a regular file: ' + targetPath);
      error.code = 'ASSET_ORIGINAL_TARGET_NOT_FILE';
      throw error;
    }
    if (stats.size !== expectedSize) return { exists: true, valid: false };
    const hash = createHash('sha256');
    let total = 0;
    for await (const chunk of createReadStream(targetPath)) {
      (hash.update(chunk), (total += chunk.length));
    }
    const digest = hash.digest('hex');
    return { exists: true, valid: total === expectedSize && digest === expectedSha256 };
  } catch (error) {
    if (error?.code === 'ENOENT') return { exists: false, valid: false };
    throw error;
  }
}
function copySourceBuffer(sourceBuffer) {
  if (Buffer.isBuffer(sourceBuffer) || sourceBuffer instanceof Uint8Array)
    return Buffer.from(sourceBuffer);
  return Buffer.from(new Uint8Array(sourceBuffer));
}
async function resolveSource(options) {
  if (options.sourcePath !== undefined) return createReadStream(options.sourcePath);
  if (options.sourceBuffer !== undefined)
    return Readable.from([copySourceBuffer(options.sourceBuffer)]);
  if (options.createSourceStream !== undefined) {
    const source = await options.createSourceStream();
    if (source === undefined || source === null)
      throw new TypeError('createSourceStream must return a readable source');
    return source;
  }
  if (options.sourceStream === null) throw new TypeError('sourceStream must be a readable source');
  return options.sourceStream;
}
async function disposeUnusedSource(source) {
  if (!source) return;
  if (typeof source.destroy === 'function') {
    source.destroy();
    return;
  }
  if (typeof source.cancel === 'function')
    try {
      await source.cancel();
    } catch {}
}
function createPartPath(targetPath) {
  const directory = path.dirname(targetPath),
    basename = path.basename(targetPath),
    random = randomBytes(8).toString('hex');
  return path.join(
    directory,
    '.' + basename + '.' + process.pid + '.' + Date.now() + '.' + random + '.part',
  );
}
function createFileHandleWritable(handle) {
  return new Writable({
    write(chunk, encoding, callback) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
      void (async () => {
        let offset = 0;
        while (offset < buffer.length) {
          const { bytesWritten: bytesWritten } = await handle.write(
            buffer,
            offset,
            buffer.length - offset,
            null,
          );
          if (bytesWritten === 0) throw new Error('Unable to make progress writing asset part file');
          offset += bytesWritten;
        }
      })().then(() => callback(), callback);
    },
  });
}
async function writeVerifiedPart({ partPath: partPath, source: source, expectedSha256: expectedSha256, expectedSize: expectedSize }) {
  let handle;
  const hash = createHash('sha256');
  let total = 0;
  try {
    handle = await open(partPath, 'wx', 0x180);
    const hasher = new Transform({
        transform(chunk, encoding, callback) {
          try {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
            total += buffer.length;
            if (total > expectedSize) {
              callback(
                new AssetOriginalIntegrityError({
                  expectedSha256: expectedSha256,
                  actualSha256: null,
                  expectedSize: expectedSize,
                  actualSize: total,
                }),
              );
              return;
            }
            (hash.update(buffer), callback(null, buffer));
          } catch (error) {
            callback(error);
          }
        },
      }),
      writable = createFileHandleWritable(handle);
    (await pipeline(source, hasher, writable), await handle.sync());
    const digest = hash.digest('hex');
    if (total !== expectedSize || digest !== expectedSha256)
      throw new AssetOriginalIntegrityError({
        expectedSha256: expectedSha256,
        actualSha256: digest,
        expectedSize: expectedSize,
        actualSize: total,
      });
  } finally {
    handle && (await handle.close());
  }
}
async function syncDirectoryBestEffort(directory) {
  let handle;
  try {
    ((handle = await open(directory, 'r')), await handle.sync());
  } catch {
  } finally {
    if (handle)
      try {
        await handle.close();
      } catch {}
  }
}
async function materializeNormalized(options) {
  const directory = path.dirname(options.targetPath);
  await mkdir(directory, { recursive: true });
  const existing = await inspectExistingTarget(options);
  if (existing.valid)
    return (
      await disposeUnusedSource(options.sourceStream),
      {
        targetPath: options.targetPath,
        sha256: options.expectedSha256,
        size: options.expectedSize,
        reused: true,
        repaired: false,
        created: false,
      }
    );
  const partPath = createPartPath(options.targetPath);
  try {
    const source = await resolveSource(options);
    (await writeVerifiedPart({
      partPath: partPath,
      source: source,
      expectedSha256: options.expectedSha256,
      expectedSize: options.expectedSize,
    }),
      await rename(partPath, options.targetPath),
      await syncDirectoryBestEffort(directory));
  } finally {
    await rm(partPath, { force: true });
  }
  return {
    targetPath: options.targetPath,
    sha256: options.expectedSha256,
    size: options.expectedSize,
    reused: false,
    repaired: existing.exists,
    created: !existing.exists,
  };
}
export function createAssetOriginalStore() {
  return {
    materialize(options) {
      const normalized = normalizeOptions(options);
      return runForTarget(normalized.targetPath, () => materializeNormalized(normalized));
    },
  };
}
const defaultStore = createAssetOriginalStore();
export function materializeAssetOriginal(options) {
  return defaultStore.materialize(options);
}
