import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUniqueCanvasName,
  isCanvasProjectFileName,
  isProjectImportFileName,
  stripCanvasProjectFileExtension,
} from './canvasProjectFileNames.js';

test('canvasProjectFileNames: recognizes project and package extensions case-insensitively', () => {
  assert.equal(isCanvasProjectFileName('work.aicanvas'), true);
  assert.equal(isCanvasProjectFileName('work.AICPROJ'), true);
  assert.equal(isCanvasProjectFileName('work.json'), true);
  assert.equal(isCanvasProjectFileName('work.aicpkg'), false);
  assert.equal(isProjectImportFileName('work.aicpkg'), true);
  assert.equal(isProjectImportFileName('work.txt'), false);
  assert.equal(isProjectImportFileName(null), false);
});

test('canvasProjectFileNames: strips only the final recognized extension', () => {
  assert.equal(stripCanvasProjectFileExtension('folder/work.aicanvas'), 'folder/work');
  assert.equal(stripCanvasProjectFileExtension('work.JSON'), 'work');
  assert.equal(stripCanvasProjectFileExtension('work.aicpkg'), 'work.aicpkg');
  assert.equal(stripCanvasProjectFileExtension(''), '');
});

test('canvasProjectFileNames: builds unique names and honors limits', () => {
  assert.equal(buildUniqueCanvasName('', []), 'Canvas');
  assert.equal(buildUniqueCanvasName('', [], { fallbackName: 'Project' }), 'Project');
  assert.equal(buildUniqueCanvasName('  New  ', []), 'New');
  assert.equal(buildUniqueCanvasName('New', [{ name: 'New' }, { name: 'New(1)' }]), 'New(2)');
  assert.match(
    buildUniqueCanvasName('New', [{ name: 'New' }, { name: 'New(1)' }], { maxAttempts: 2 }),
    /^New \d+$/,
  );
  assert.equal(buildUniqueCanvasName('New', [{ name: 'New' }], { maxAttempts: 2 }), 'New(1)');
  const fallback = buildUniqueCanvasName('New', [{ name: 'New' }, { name: 'New(1)' }], {
    maxAttempts: 1,
  });
  assert.match(fallback, /^New \d+$/);
});
