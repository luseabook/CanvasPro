import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveApplicationResourceRoot } from './applicationResourceRoot.js';

test('a packaged asar root resolves to its sibling webapp directory', () => {
  assert.equal(
    resolveApplicationResourceRoot(path.join('F:', 'app', 'resources', 'app.asar')),
    path.join('F:', 'app', 'resources', 'webapp'),
  );
});

test('a plain directory root is returned untouched', () => {
  assert.equal(resolveApplicationResourceRoot('F:\\CanvasPro'), 'F:\\CanvasPro');
  assert.equal(
    resolveApplicationResourceRoot(path.join('F:', 'app', 'resources', 'app.asar.unpacked')),
    path.join('F:', 'app', 'resources', 'app.asar.unpacked'),
  );
  assert.equal(resolveApplicationResourceRoot(''), '');
});
