import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
function emptyIndex() {
  return { version: 1, assets: {} };
}
export class AssetIndexReadError extends Error {
  constructor(indexPath, cause) {
    (super('Failed to read asset index ' + indexPath + ': ' + (cause?.message || cause)),
      (this.name = 'AssetIndexReadError'),
      (this.code = 'ASSET_INDEX_READ_FAILED'),
      (this.indexPath = indexPath),
      (this.cause = cause));
  }
}
export function readAssetIndexFile(indexPath) {
  try {
    const parsed = JSON.parse(readFileSync(indexPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new TypeError('Asset index root must be an object');
    if (
      parsed.assets !== undefined &&
      (!parsed.assets || typeof parsed.assets !== 'object' || Array.isArray(parsed.assets))
    )
      throw new TypeError('Asset index assets must be an object');
    return { version: 1, assets: parsed.assets || {} };
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyIndex();
    throw new AssetIndexReadError(indexPath, error);
  }
}
export function writeAssetIndexFile(indexPath, index) {
  mkdirSync(path.dirname(indexPath), { recursive: true });
  const payload = {
      version: 1,
      assets:
        index?.assets && typeof index.assets === 'object' && !Array.isArray(index.assets)
          ? index.assets
          : {},
    },
    tempPath =
      indexPath +
      '.' +
      process.pid +
      '.' +
      Date.now() +
      '.' +
      randomBytes(6).toString('hex') +
      '.tmp';
  try {
    (writeFileSync(tempPath, JSON.stringify(payload, null, 2) + '\n', 'utf8'),
      renameSync(tempPath, indexPath));
  } finally {
    try {
      if (existsSync(tempPath)) unlinkSync(tempPath);
    } catch {}
  }
}
