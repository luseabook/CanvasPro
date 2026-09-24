import test from 'node:test';
import assert from 'node:assert/strict';
import { createClipboardCapabilityOperations } from './clipboardCapabilityOperations.js';

const FORMAT = 'application/x-shuo-file-references';

function createFakeClipboard(overrides = {}) {
  const state = { buffer: null, text: '', image: null };
  return {
    state,
    readBuffer: () => state.buffer,
    writeBuffer: (_format, buffer) => {
      state.buffer = buffer;
    },
    readText: () => state.text,
    writeText: (text) => {
      state.text = text;
    },
    readImage: () => state.image,
    writeImage: (image) => {
      state.lastImage = image;
    },
    write: (payload) => {
      state.lastWrite = payload;
    },
    ...overrides,
  };
}

function createOperations(overrides = {}) {
  const clipboardApi = createFakeClipboard(overrides.clipboardApi);
  const operations = createClipboardCapabilityOperations({
    clipboardApi,
    fileReferencesFormat: FORMAT,
    createClipboardNativeImage: overrides.createClipboardNativeImage || (() => fakeImage()),
    normalizeClipboardFileReferences:
      overrides.normalizeClipboardFileReferences ||
      ((files) =>
        (Array.isArray(files) ? files : [])
          .map((file) => (typeof file === 'string' ? { path: file } : file))
          .filter((file) => file && typeof file.path === 'string' && file.path)),
    parseClipboardFileReferencesFromText:
      overrides.parseClipboardFileReferencesFromText ||
      ((text) =>
        String(text || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ path: line }))),
  });
  return { operations, clipboardApi };
}

function fakeImage(empty = false) {
  return {
    isEmpty: () => empty,
    toPNG: () => Buffer.alloc(empty ? 0 : 8, 1),
  };
}

test('text round-trips through the clipboard operations layer', () => {
  const { operations, clipboardApi } = createOperations();
  assert.deepEqual(operations.writeText({ text: 'hello' }), { ok: true });
  assert.equal(clipboardApi.state.text, 'hello');
  assert.deepEqual(operations.readText(), { ok: true, text: 'hello' });
});

test('writing an empty image is refused instead of touching the clipboard', () => {
  const { operations, clipboardApi } = createOperations({ createClipboardNativeImage: () => fakeImage(true) });
  assert.deepEqual(operations.writeImage({ localPath: 'C:/tmp/a.png' }), { ok: false, reason: 'no-image' });
  assert.equal(clipboardApi.state.lastWrite, undefined);
});

test('image reads report base64 PNG and reject oversized payloads', () => {
  const { operations, clipboardApi } = createOperations();
  assert.deepEqual(operations.readImage(), { ok: false, reason: 'no-image' });
  clipboardApi.state.image = fakeImage();
  const result = operations.readImage();
  assert.equal(result.ok, true);
  assert.equal(result.mimeType, 'image/png');
  assert.equal(Buffer.from(result.dataBase64, 'base64').length, 8);

  const { operations: huge } = createOperations({
    clipboardApi: {
      readImage: () => ({ isEmpty: () => false, toPNG: () => ({ length: 64 * 1024 * 1024 + 1 }) }),
    },
  });
  assert.deepEqual(huge.readImage(), { ok: false, reason: 'image-too-large' });
});

test('file references prefer the custom format and fall back to plain text', () => {
  const { operations, clipboardApi } = createOperations();
  clipboardApi.state.text = 'C:/a.png\nC:/b.png';
  assert.deepEqual(operations.writeFileReferences({ paths: ['C:/a.png', 'C:/b.png'] }), {
    ok: true,
    files: [{ path: 'C:/a.png' }, { path: 'C:/b.png' }],
  });
  assert.equal(clipboardApi.state.buffer.toString('utf8'), '{"version":1,"files":["C:/a.png","C:/b.png"]}');

  clipboardApi.state.buffer = null;
  const fromText = operations.readFileReferences();
  assert.equal(fromText.ok, true);
  assert.deepEqual(fromText.files, [{ path: 'C:/a.png' }, { path: 'C:/b.png' }]);

  clipboardApi.state.buffer = Buffer.from('not json', 'utf8');
  assert.equal(operations.readFileReferences().ok, true);
});

test('a corrupt custom-format buffer never throws and falls back to text', () => {
  const { operations, clipboardApi } = createOperations();
  clipboardApi.state.buffer = Buffer.from('{bad', 'utf8');
  clipboardApi.state.text = '';
  assert.deepEqual(operations.readFileReferences(), { ok: false, files: [] });
});

test('write failures surface as ok:false rather than throwing', () => {
  const { operations } = createOperations({
    clipboardApi: {
      writeText: () => {
        throw new Error('clipboard locked');
      },
    },
  });
  assert.deepEqual(operations.writeText({ text: 'x' }), {
    ok: false,
    reason: 'write-failed',
    error: 'clipboard locked',
  });
});
