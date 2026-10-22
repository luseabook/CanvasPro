// Boundary cases for `brandDataMigration.migrateLegacyUserData()` that the main
// spec file does not reach:
//   1) The branded target directory exists but is empty → migration must still
//      run (`dirHasEntries === false` must not trip the target-already-has-data
//      guard).
//   2) One file fails mid-copy → the run continues, `failedFiles` is counted and
//      the error is recorded instead of aborting the whole migration.
//   3) `appDataDir` missing → returns `no-legacy-data` instead of throwing.
// Read-only against the module under test; every fixture lives in the isolated
// sandbox pointed to by `AIC_TEST_SANDBOX_ROOT`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  BRAND_USER_DATA_DIRNAME,
  LEGACY_USER_DATA_DIRNAMES,
  MIGRATION_MARKER,
  migrateLegacyUserData,
} from './brandDataMigration.js';

function makeAppData() {
  const base = process.env.AIC_TEST_SANDBOX_ROOT || os.tmpdir();
  return fs.mkdtempSync(path.join(base, 'qa-brand-boundary-'));
}

function writeFile(root, rel, content = 'x') {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

test('边界：新目录存在但为空时仍然执行迁移', () => {
  const appData = makeAppData();
  try {
    writeFile(path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]), 'settings.json', '{"theme":"dark"}');
    // 目标目录已存在但没有任何条目（例如上次启动只建了空目录）
    fs.mkdirSync(path.join(appData, BRAND_USER_DATA_DIRNAME), { recursive: true });

    const result = migrateLegacyUserData({ appDataDir: appData, env: {} });
    assert.equal(result.migrated, true, '空的新目录不应阻止迁移');
    assert.equal(result.reason, 'copied');
    assert.equal(
      fs.readFileSync(path.join(appData, BRAND_USER_DATA_DIRNAME, 'settings.json'), 'utf8'),
      '{"theme":"dark"}',
    );
  } finally {
    fs.rmSync(appData, { recursive: true, force: true });
  }
});

test('边界：单文件复制失败不中断，其余文件仍然迁移并计入 failedFiles', () => {
  const appData = makeAppData();
  try {
    const legacy = path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]);
    writeFile(legacy, 'a-ok.json', 'ok-1');
    writeFile(legacy, 'locked.json', 'will-fail');
    writeFile(legacy, path.join('nested', 'b-ok.json'), 'ok-2');

    // 注入故障：只让 locked.json 的 copyFileSync 抛错，模拟被占用/权限不足
    const patchedFs = Object.create(fs);
    patchedFs.copyFileSync = (from, to, ...rest) => {
      if (String(from).endsWith('locked.json')) {
        throw Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' });
      }
      return fs.copyFileSync(from, to, ...rest);
    };

    const result = migrateLegacyUserData({
      appDataDir: appData,
      env: {},
      fs: patchedFs,
      path,
      now: 0,
    });

    assert.equal(result.migrated, true, '部分失败不应让整体迁移判定为失败');
    assert.equal(result.failedFiles, 1);
    assert.equal(result.copiedFiles, 2);
    assert.ok(Array.isArray(result.errors) && result.errors.length === 1);
    assert.match(String(result.errors[0].error), /EBUSY/);

    const brand = path.join(appData, BRAND_USER_DATA_DIRNAME);
    assert.equal(fs.existsSync(path.join(brand, 'a-ok.json')), true);
    assert.equal(fs.existsSync(path.join(brand, 'nested', 'b-ok.json')), true);
    assert.equal(fs.existsSync(path.join(brand, 'locked.json')), false);

    const marker = JSON.parse(fs.readFileSync(path.join(brand, MIGRATION_MARKER), 'utf8'));
    assert.equal(marker.failedFiles, 1, '标记文件必须记录失败数，便于后续诊断');
  } finally {
    fs.rmSync(appData, { recursive: true, force: true });
  }
});

test('异常：appDataDir 不存在时返回 no-legacy-data 而不是抛异常', () => {
  const base = process.env.AIC_TEST_SANDBOX_ROOT || os.tmpdir();
  const missing = path.join(base, 'qa-brand-missing-' + Date.now());
  // legacyNames 指向一个永远不存在的条目，确保走到 no-legacy-data（无副作用分支）
  const result = migrateLegacyUserData({ appDataDir: missing, env: {} });
  assert.equal(result.migrated, false);
  assert.equal(result.reason, 'no-legacy-data');
});
