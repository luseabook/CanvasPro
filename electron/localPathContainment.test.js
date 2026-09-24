import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isPathInsideRoot, resolveExistingPathWithinRoot } from './localPathContainment.js';

const identityRealpath = (value) => path.resolve(value);

test('isPathInsideRoot accepts the root itself', () => {
  assert.equal(isPathInsideRoot('/a/b', '/a/b'), true);
  assert.equal(isPathInsideRoot(path.join('/a', 'b'), '/a'), true);
});

test('isPathInsideRoot accepts descendants', () => {
  assert.equal(isPathInsideRoot(path.join('/a', 'b', 'c'), '/a'), true);
});

test('isPathInsideRoot rejects parents and siblings', () => {
  assert.equal(isPathInsideRoot('/a', path.join('/a', 'b')), false);
  assert.equal(isPathInsideRoot(path.join('/a', 'c'), path.join('/a', 'b')), false);
});

test('isPathInsideRoot does not treat a sibling prefix as contained', () => {
  assert.equal(isPathInsideRoot(path.join('/a', 'b-evil'), path.join('/a', 'b')), false);
});

test('resolveExistingPathWithinRoot joins a contained relative path', () => {
  const result = resolveExistingPathWithinRoot('/root', 'sub/file.txt', { realpath: identityRealpath });
  assert.equal(result, path.resolve('/root', 'sub/file.txt'));
});

test('resolveExistingPathWithinRoot rejects an escaping relative path', () => {
  assert.equal(resolveExistingPathWithinRoot('/root', '../outside.txt', { realpath: identityRealpath }), '');
  assert.equal(
    resolveExistingPathWithinRoot('/root', '../../etc/passwd', { realpath: identityRealpath }),
    '',
  );
});

test('resolveExistingPathWithinRoot rejects a bare parent segment', () => {
  assert.equal(resolveExistingPathWithinRoot('/root/sub', '..', { realpath: identityRealpath }), '');
});

test('resolveExistingPathWithinRoot rejects a symlinked escape', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'aic-containment-'));
  const inside = path.join(root, 'inside');
  const outside = mkdtempSync(path.join(os.tmpdir(), 'aic-outside-'));
  mkdirSync(inside);
  writeFileSync(path.join(outside, 'secret.txt'), 'secret');
  let linkCreated = false;
  try {
    symlinkSync(outside, path.join(inside, 'link'), 'junction');
    linkCreated = true;
  } catch {
    linkCreated = false;
  }
  if (!linkCreated) return;
  assert.equal(resolveExistingPathWithinRoot(inside, path.join('link', 'secret.txt')), '');
  assert.equal(
    resolveExistingPathWithinRoot(inside, 'plain.txt', { realpath: identityRealpath }),
    path.resolve(inside, 'plain.txt'),
  );
});

test('resolveExistingPathWithinRoot lets a throwing realpath fall back to empty', () => {
  assert.equal(
    resolveExistingPathWithinRoot('/root', 'sub/file.txt', {
      realpath: () => {
        throw new Error('missing');
      },
    }),
    '',
  );
});
