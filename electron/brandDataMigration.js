// 品牌改名后的本地数据迁移
//
// 背景：旧版本把用户数据放在 %APPDATA%/CanvasPro（Electron userData）。换牌后
// 新目录是 %APPDATA%/OneFrame。直接换目录名会让老用户「丢数据」——设置、密钥、
// 工程索引、最近项目全都不见了。
//
// 策略（保守、可回滚、容错）：
//   1. 旧目录存在、新目录不存在（或为空）→ 复制用户数据到新目录，写迁移标记
//   2. 新目录已有内容 → 不动（说明已经在用新品牌），返回 skipped
//   3. 旧目录保留不删除，可随时回滚
//   4. 只复制「用户数据」，跳过可再生的缓存（Cache/GPUCache/chrome-shell-profile 等）
//   5. 单个文件复制失败不中断（记录后继续），避免一个锁文件导致整体迁移失败
//   6. 测试隔离目录（AIC_USER_DATA_ROOT）或 AIC_SKIP_USERDATA_MIGRATION=1 时跳过
//
// 依赖全部通过参数注入，便于在 node:test 里用内存 fs 或临时目录覆盖。

import fsImpl from 'node:fs';
import pathImpl from 'node:path';

/** 换牌前的 userData 目录名（按优先级排列，先出现的先用）。 */
export const LEGACY_USER_DATA_DIRNAMES = ['CanvasPro', 'AI CanvasPro'];
export const LEGACY_USER_DATA_DIRNAME = LEGACY_USER_DATA_DIRNAMES[0];
/** 换牌后的 userData 目录名。 */
export const BRAND_USER_DATA_DIRNAME = 'OneFrame';
export const MIGRATION_MARKER = '.migrated-from-canvaspro';

// 可再生、体积大、且经常被 Chromium 占用的目录：不迁移
const DISPOSABLE_DIRS = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'DawnWebGPUWireCache',
  'blob_storage',
  'logs',
  'Crashpad',
  'ShaderCache',
  'GrShaderCache',
]);

function isDisposable(name) {
  if (DISPOSABLE_DIRS.has(name)) return true;
  return /^chrome-shell-profile(\.recovery-.*)?$/i.test(name);
}

export function shouldSkipMigration(env = process.env) {
  if (String(env.AIC_SKIP_USERDATA_MIGRATION || '') === '1') return true;
  if (String(env.AIC_USER_DATA_ROOT || '').trim()) return true;
  return false;
}

function dirHasEntries(fs, dir) {
  try {
    return fs.readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

function copyTree({ fs, path, from, to, stats, errors, maxErrors = 20 }) {
  let entries;
  try {
    entries = fs.readdirSync(from, { withFileTypes: true });
  } catch (err) {
    errors.push({ path: from, error: String(err?.message || err) });
    return;
  }
  for (const entry of entries) {
    if (isDisposable(entry.name)) {
      stats.skippedDisposable += 1;
      continue;
    }
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isSymbolicLink()) {
      stats.skippedLinks += 1;
      continue;
    }
    if (entry.isDirectory()) {
      try {
        fs.mkdirSync(dst, { recursive: true });
      } catch (err) {
        errors.push({ path: src, error: String(err?.message || err) });
        continue;
      }
      copyTree({ fs, path, from: src, to: dst, stats, errors, maxErrors });
      continue;
    }
    try {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      stats.copiedFiles += 1;
      try {
        stats.copiedBytes += fs.statSync(src).size;
      } catch {
        /* ignore size errors */
      }
    } catch (err) {
      stats.failedFiles += 1;
      if (errors.length < maxErrors) errors.push({ path: src, error: String(err?.message || err) });
    }
  }
}

/**
 * 把旧品牌目录里的用户数据复制到新品牌目录。
 *
 * @param {object} options
 * @param {string} options.appDataDir  %APPDATA%
 * @param {object} [options.fs]
 * @param {object} [options.path]
 * @param {object} [options.env]
 * @param {string[]} [options.legacyNames]
 * @param {string} [options.newName]
 * @param {string|number|Date} [options.now]
 * @returns {{migrated:boolean, reason:string, from:string, to:string, copiedFiles?:number, copiedBytes?:number, skippedDisposable?:number, skippedLinks?:number, failedFiles?:number, errors?:Array}}
 */
export function migrateLegacyUserData({
  appDataDir,
  fs = fsImpl,
  path = pathImpl,
  env = process.env,
  legacyNames = LEGACY_USER_DATA_DIRNAMES,
  newName = BRAND_USER_DATA_DIRNAME,
  now = Date.now(),
} = {}) {
  const to = path.join(appDataDir, newName);
  if (shouldSkipMigration(env)) {
    return { migrated: false, reason: 'skipped-by-env', from: '', to };
  }
  // 只认第一个真实存在的旧目录：并存时以 CanvasPro 为准，避免把两代数据混在一起。
  const legacyName = (Array.isArray(legacyNames) ? legacyNames : [legacyNames])
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .find((name) => fs.existsSync(path.join(appDataDir, name)));
  if (!legacyName) {
    return { migrated: false, reason: 'no-legacy-data', from: '', to };
  }
  const from = path.join(appDataDir, legacyName);
  if (fs.existsSync(to) && dirHasEntries(fs, to)) {
    return { migrated: false, reason: 'target-already-has-data', from, to };
  }

  const stats = { copiedFiles: 0, copiedBytes: 0, skippedDisposable: 0, skippedLinks: 0, failedFiles: 0 };
  const errors = [];
  try {
    fs.mkdirSync(to, { recursive: true });
    copyTree({ fs, path, from, to, stats, errors });
    const marker = {
      migratedFrom: legacyName,
      migratedAt: new Date(now).toISOString(),
      copiedFiles: stats.copiedFiles,
      copiedBytes: stats.copiedBytes,
      skippedDisposable: stats.skippedDisposable,
      skippedLinks: stats.skippedLinks,
      failedFiles: stats.failedFiles,
      note: '旧目录保留未删除，可回滚；缓存类目录未复制（可再生）。',
    };
    fs.writeFileSync(path.join(to, MIGRATION_MARKER), JSON.stringify(marker, null, 2), 'utf8');
    return { migrated: true, reason: 'copied', from, to, ...stats, errors };
  } catch (err) {
    return { migrated: false, reason: 'copy-failed:' + String(err?.message || err), from, to, ...stats, errors };
  }
}

/** 迁移结果的一行日志（无需迁移时返回空串，避免刷日志）。 */
export function formatMigrationResult(result) {
  if (!result) return '';
  if (result.migrated) {
    const mb = ((result.copiedBytes || 0) / 1024 / 1024).toFixed(1);
    const tail = result.failedFiles ? `，${result.failedFiles} 个文件失败` : '';
    return `[userdata] 已迁移用户数据：${result.from} → ${result.to}（${result.copiedFiles} 个文件 / ${mb} MB${tail}）`;
  }
  if (result.reason === 'no-legacy-data' || result.reason === 'skipped-by-env') {
    return '';
  }
  return `[userdata] 未迁移（${result.reason}）`;
}
