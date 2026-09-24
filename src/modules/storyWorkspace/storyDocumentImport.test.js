import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createEpisode, normalizeStoryWorkspace } from './storyWorkspaceModel.js';
import { splitDocumentText, appendDocumentToWorkspace, DOCUMENT_PREVIEW_LIMIT } from './storyDocumentImport.js';

test('splitting preserves all original characters and prefers paragraph boundaries', () => {
  const text = 'a'.repeat(15) + '\n\n' + 'b'.repeat(15) + '\n' + 'c'.repeat(12);
  const parts = splitDocumentText(text, 20);
  assert.equal(parts.join(''), text); assert.ok(parts.every(part => part.length <= 20));
  assert.ok(parts[0].endsWith('\n\n'));
});
test('split never separates a Unicode surrogate pair', () => {
  const text = 'abc😀def😀ghi', parts = splitDocumentText(text, 4);
  assert.equal(parts.join(''), text);
  assert.ok(parts.every(part => !/[\uD800-\uDBFF]$/.test(part)));
  assert.ok(parts.every(part => !/^[\uDC00-\uDFFF]/.test(part)));
});
test('empty and oversized extraction are rejected, not imported as blank episodes', () => {
  assert.throws(() => splitDocumentText(' \n\t'));
  assert.throws(() => splitDocumentText('a'.repeat(DOCUMENT_PREVIEW_LIMIT + 1)));
});
test('document import appends new episodes without mutating the old workspace', () => {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = '原文';
  const result = appendDocumentToWorkspace(workspace, '剧本.docx', '新增文字');
  assert.equal(workspace.episodes.length, 1); assert.equal(workspace.episodes[0].script, '原文');
  assert.equal(result.workspace.episodes.length, 2); assert.equal(result.workspace.episodes[1].title, '剧本');
  assert.equal(result.workspace.episodes[1].script, '新增文字'); assert.equal(result.count, 1);
});
test('long import stays under each episode limit and remains reversible through JSON', () => {
  const text = '长'.repeat(200001), workspace = createStoryWorkspace();
  const result = appendDocumentToWorkspace(workspace, '长篇.pdf', text);
  assert.equal(result.count, 2); assert.equal(result.workspace.episodes.slice(1).map(e => e.script).join(''), text);
  assert.deepEqual(normalizeStoryWorkspace(JSON.parse(JSON.stringify(result.workspace))), result.workspace);
});
test('episode count overflow does not partially append', () => {
  const workspace = createStoryWorkspace(); workspace.episodes = Array.from({ length: 100 }, () => createEpisode());
  assert.throws(() => appendDocumentToWorkspace(workspace, 'file.pdf', '文档内容'));
  assert.equal(workspace.episodes.length, 100);
});
