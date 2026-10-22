import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  BRAND_USER_DATA_DIRNAME,
  LEGACY_USER_DATA_DIRNAMES,
  MIGRATION_MARKER,
  formatMigrationResult,
  migrateLegacyUserData,
  shouldSkipMigration,
} from './brandDataMigration.js';

function makeAppData() {
  // 必须在隔离沙箱内建临时目录：offline-unit-guard 会拒绝写到沙箱之外。
  const base = process.env.AIC_TEST_SANDBOX_ROOT || os.tmpdir();
  return fs.mkdtempSync(path.join(base, 'oneframe-userdata-'));
}

function writeFile(root, rel, content = 'x') {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

test('没有旧目录时什么也不做，也不创建新目录', () => {
  const appData = makeAppData();
  try {
    const result = migrateLegacyUserData({ appDataDir: appData, env: {} });
    assert.equal(result.migrated, false);
    assert.equal(result.reason, 'no-legacy-data');
    assert.equal(fs.existsSync(path.join(appData, BRAND_USER_DATA_DIRNAME)), false);
    assert.equal(formatMigrationResult(result), '');
  } finally {
    cleanup(appData);
  }
});

test('复制用户数据到新目录，跳过可再生缓存并写迁移标记', () => {
  const appData = makeAppData();
  try {
    const legacy = path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]);
    writeFile(legacy, 'settings.json', '{"theme":"dark"}');
    writeFile(legacy, path.join('projects', 'a.aicproj'), 'project');
    // 缓存目录不迁：体积大、可再生，且常被 Chromium 占用
    writeFile(legacy, path.join('Cache', 'blob'), 'cache');

    const result = migrateLegacyUserData({ appDataDir: appData, env: {}, now: 0 });
    assert.equal(result.migrated, true);
    assert.equal(result.copiedFiles, 2);
    assert.ok(result.skippedDisposable >= 1);

    const brand = path.join(appData, BRAND_USER_DATA_DIRNAME);
    assert.equal(fs.readFileSync(path.join(brand, 'settings.json'), 'utf8'), '{"theme":"dark"}');
    assert.equal(fs.existsSync(path.join(brand, 'projects', 'a.aicproj')), true);
    assert.equal(fs.existsSync(path.join(brand, 'Cache')), false);

    const marker = JSON.parse(fs.readFileSync(path.join(brand, MIGRATION_MARKER), 'utf8'));
    assert.equal(marker.migratedFrom, LEGACY_USER_DATA_DIRNAMES[0]);
    assert.equal(marker.copiedFiles, 2);

    // 旧目录保留，可回滚
    assert.equal(fs.existsSync(path.join(legacy, 'settings.json')), true);
    assert.match(formatMigrationResult(result), /已迁移用户数据/);
  } finally {
    cleanup(appData);
  }
});

test('新目录已有内容时不动，避免覆盖新品牌数据', () => {
  const appData = makeAppData();
  try {
    writeFile(path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]), 'settings.json', 'old');
    writeFile(path.join(appData, BRAND_USER_DATA_DIRNAME), 'settings.json', 'new');

    const result = migrateLegacyUserData({ appDataDir: appData, env: {} });
    assert.equal(result.migrated, false);
    assert.equal(result.reason, 'target-already-has-data');
    assert.equal(
      fs.readFileSync(path.join(appData, BRAND_USER_DATA_DIRNAME, 'settings.json'), 'utf8'),
      'new',
    );
  } finally {
    cleanup(appData);
  }
});

test('测试隔离目录或显式开关会跳过迁移', () => {
  assert.equal(shouldSkipMigration({ AIC_SKIP_USERDATA_MIGRATION: '1' }), true);
  assert.equal(shouldSkipMigration({ AIC_USER_DATA_ROOT: 'C:/tmp/profile' }), true);
  assert.equal(shouldSkipMigration({}), false);

  const appData = makeAppData();
  try {
    writeFile(path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]), 'settings.json', 'old');
    const result = migrateLegacyUserData({ appDataDir: appData, env: { AIC_USER_DATA_ROOT: '/tmp/x' } });
    assert.equal(result.migrated, false);
    assert.equal(result.reason, 'skipped-by-env');
  } finally {
    cleanup(appData);
  }
});

test('多个旧目录并存时优先 CanvasPro', () => {
  const appData = makeAppData();
  try {
    writeFile(path.join(appData, LEGACY_USER_DATA_DIRNAMES[0]), 'settings.json', 'from-canvaspro');
    writeFile(path.join(appData, LEGACY_USER_DATA_DIRNAMES[1]), 'settings.json', 'from-ai-canvaspro');

    const result = migrateLegacyUserData({ appDataDir: appData, env: {} });
    assert.equal(result.migrated, true);
    assert.equal(
      fs.readFileSync(path.join(appData, BRAND_USER_DATA_DIRNAME, 'settings.json'), 'utf8'),
      'from-canvaspro',
    );
  } finally {
    cleanup(appData);
  }
});

test('只有 AI CanvasPro 目录时也能迁移', () => {
  const appData = makeAppData();
  try {
    writeFile(path.join(appData, 'AI CanvasPro'), 'settings.json', 'legacy-ai');
    const result = migrateLegacyUserData({ appDataDir: appData, env: {} });
    assert.equal(result.migrated, true);
    assert.equal(
      fs.readFileSync(path.join(appData, BRAND_USER_DATA_DIRNAME, 'settings.json'), 'utf8'),
      'legacy-ai',
    );
  } finally {
    cleanup(appData);
  }
});
