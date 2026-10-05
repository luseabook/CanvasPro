import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMediaExportItems, safeExportName, validateExportMediaPath } from './nodeMediaExportModel.js';
import { collectNodeMedia } from './collectNodeMedia.js';

const item = (extra = {}) => ({ nodeId: 'n1', name: '镜头一', kind: 'image', localPath: 'output/one.png', ...extra });
test('export contract strips arbitrary request fields and credentials', () => {
  const [result] = normalizeMediaExportItems({ items: [item({ apiKey: 'secret', url: 'https://bad/', request: {}, fileName: '../x' })], directory: 'C:/' });
  assert.deepEqual(Object.keys(result), ['nodeId', 'name', 'kind', 'localPath', 'fileName']);
  assert.equal(result.fileName, '001-镜头一.png');
});
test('empty, oversized and duplicate batches are rejected', () => {
  for (const items of [[], Array.from({ length: 101 }, (_, i) => item({ nodeId: String(i) })), [item(), item()]]) {
    assert.throws(() => normalizeMediaExportItems({ items }));
  }
});
for (const localPath of ['https://host/a.png', 'file:///a.png', 'C:/a.png', '//server/a.png',
  'output/../x.png', 'output/%2e%2e/x.png', 'output/a.png?key=x', 'output/a.png:stream', 'output\\a.png',
  'output//a.png', 'output/sub./a.png', 'user/a.png']) {
  test(`reject unsafe path ${localPath}`, () => assert.throws(() => validateExportMediaPath(localPath, 'image')));
}
test('media extension must match kind and cannot be an executable', () => {
  assert.throws(() => validateExportMediaPath('output/a.exe', 'image'));
  assert.throws(() => validateExportMediaPath('output/a.png', 'video'));
  assert.throws(() => validateExportMediaPath('output/a.svg', 'image'));
  assert.equal(validateExportMediaPath('data/assets/original/a.MP4', 'video'), 'mp4');
});
test('safe output naming and sequential numbering avoid collisions/reserved device names', () => {
  const result = normalizeMediaExportItems({ items: [item({ name: 'CON' }), item({ nodeId: 'n2', name: 'CON' })] });
  assert.notEqual(result[0].fileName, result[1].fileName);
  assert.equal(safeExportName('../bad:name‮'), '.._bad_name_');
});
test('original media wins over video proxies, posters and thumbnails', () => {
  const { items } = collectNodeMedia({ n1: { type: 'source-video', originalLocalPath: 'data/assets/a.mov',
    localPath: 'output/proxy.mp4', posterLocalPath: 'output/poster.png' } }, ['n1']);
  assert.equal(items[0].localPath, 'data/assets/a.mov');
});
test('remote-only, poster-only, generating and non-media nodes are reported not requested', () => {
  const nodes = { a: { type: 'ai-video', videoUrl: 'https://remote/a.mp4' },
    b: { type: 'source-video', posterLocalPath: 'output/a.png' },
    c: { type: 'ai-image', localPath: 'output/a.png', isGenerating: true }, d: { type: 'story-workspace' } };
  const result = collectNodeMedia(nodes, Object.keys(nodes));
  assert.equal(result.items.length, 0); assert.equal(result.skipped.length, 4);
});
test('missing nodes are skipped, repeated selection is deduplicated', () => {
  const result = collectNodeMedia({ a: { type: 'source-audio', localPath: 'output/a.wav' } }, ['a', 'a', 'missing']);
  assert.equal(result.items.length, 1); assert.equal(result.skipped.length, 1);
});
test('local HTTP media references normalize, no remote URL reaches main process', () => {
  const { items } = collectNodeMedia({ n1: { type: 'source-image', imageUrl: 'http://127.0.0.1:8778/output/a.png' } }, ['n1']);
  assert.equal(items[0].localPath, 'output/a.png');
});
test('selection count is bounded even if all nodes would be skipped', () => {
  assert.throws(() => collectNodeMedia({}, Array.from({ length: 101 }, (_, i) => String(i))));
});
