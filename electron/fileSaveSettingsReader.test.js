import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readUserSettingsFromFilesSync } from './fileSaveSettingsReader.js';

function makeTempDir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'settings-reader-'));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function writeSettings(dir, name, contents) {
  const filePath = path.join(dir, name);
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

test('the first candidate that carries fileSavePaths wins', (t) => {
  const dir = makeTempDir(t),
    first = writeSettings(dir, 'first.json', JSON.stringify({ fileSavePaths: { canvasDir: 'F:/a' } })),
    second = writeSettings(dir, 'second.json', JSON.stringify({ fileSavePaths: { canvasDir: 'F:/b' } }));
  assert.deepEqual(readUserSettingsFromFilesSync([first, second]), {
    fileSavePaths: { canvasDir: 'F:/a' },
  });
  assert.deepEqual(readUserSettingsFromFilesSync([path.join(dir, 'missing.json'), second]), {
    fileSavePaths: { canvasDir: 'F:/b' },
  });
});

test('a fileSavePathsMeta-only settings file is still accepted', (t) => {
  const dir = makeTempDir(t),
    metaOnly = writeSettings(
      dir,
      'meta.json',
      JSON.stringify({ fileSavePathsMeta: { rootDir: 'F:/root' } }),
    );
  assert.deepEqual(readUserSettingsFromFilesSync([metaOnly]), {
    fileSavePathsMeta: { rootDir: 'F:/root' },
  });
});

test('a file without either key is skipped in favour of a later one', (t) => {
  const dir = makeTempDir(t),
    unrelated = writeSettings(dir, 'unrelated.json', JSON.stringify({ theme: 'dark' })),
    valid = writeSettings(dir, 'valid.json', JSON.stringify({ fileSavePaths: { outputDir: 'F:/out' } }));
  assert.deepEqual(readUserSettingsFromFilesSync([unrelated, valid]), {
    fileSavePaths: { outputDir: 'F:/out' },
  });
});

test('a BOM, malformed json and a json array are all tolerated', (t) => {
  const dir = makeTempDir(t),
    bom = writeSettings(dir, 'bom.json', '\uFEFF' + JSON.stringify({ fileSavePaths: { dataDir: 'F:/d' } })),
    malformed = writeSettings(dir, 'broken.json', '{ not json'),
    arraySettings = writeSettings(dir, 'array.json', JSON.stringify([{ fileSavePaths: {} }]));
  assert.deepEqual(readUserSettingsFromFilesSync([bom]), { fileSavePaths: { dataDir: 'F:/d' } });
  assert.deepEqual(readUserSettingsFromFilesSync([malformed, arraySettings, bom]), {
    fileSavePaths: { dataDir: 'F:/d' },
  });
});

test('no candidate yields an empty object', () => {
  assert.deepEqual(readUserSettingsFromFilesSync(), {});
  assert.deepEqual(readUserSettingsFromFilesSync([]), {});
  assert.deepEqual(readUserSettingsFromFilesSync(['', 'F:/definitely/missing.json']), {});
});
