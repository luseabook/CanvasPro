import assert from 'node:assert/strict';
import test from 'node:test';
import { isLegacyImportCandidateReady, legacyImportPathLines } from './legacyFileSaveImport.js';

const candidate = {
  id: 'legacy-0', fingerprint: 'a'.repeat(64), fileCount: 3,
  sourcePaths: { canvasDir: 'C:\\old\\Canvas Project', dataDir: 'C:\\old\\data', outputDir: 'C:\\old\\output' },
  targetPaths: { canvasDir: 'C:\\new\\projects', dataDir: 'C:\\new\\data', outputDir: 'C:\\new\\output' },
};

test('only server-scanned nonempty error-free candidates may be chosen', () => {
  assert.equal(isLegacyImportCandidateReady(candidate), true);
  assert.equal(isLegacyImportCandidateReady({ ...candidate, fingerprint: '' }), false);
  assert.equal(isLegacyImportCandidateReady({ ...candidate, fileCount: 0 }), false);
  assert.equal(isLegacyImportCandidateReady({ ...candidate, error: 'symlink' }), false);
});

test('confirmation text shows all trusted source and target buckets', () => {
  const lines = legacyImportPathLines(candidate, (key) => `label ${key}`);
  assert.match(lines, /C:\\old\\Canvas Project/);
  assert.match(lines, /C:\\new\\data/);
  assert.match(lines, /label outputDir/);
});
