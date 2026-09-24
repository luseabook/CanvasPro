import assert from 'node:assert/strict';
import test from 'node:test';
import { createNativeContextMenuIconFactory } from './nativeContextMenuIcons.js';
import { resolveContextMenuIconDefinition } from '../src/utils/contextMenuIconCatalog.js';

function createNativeImageApi(overrides = {}) {
  const calls = { dataUrls: [], resizes: [] };
  const api = {
    createFromDataURL(dataUrl) {
      calls.dataUrls.push(dataUrl);
      if (overrides.createThrows) throw new Error('bad data url');
      if (overrides.empty) return { isEmpty: () => true };
      if (overrides.noResize) return { isEmpty: () => false, id: calls.dataUrls.length };
      return {
        isEmpty: () => false,
        resize(options) {
          calls.resizes.push(options);
          return { resizedWith: options, id: calls.dataUrls.length };
        },
      };
    },
  };
  return { calls, api };
}

function decodeSvg(dataUrl) {
  const prefix = 'data:image/svg+xml;base64,';
  assert.equal(dataUrl.startsWith(prefix), true);
  return Buffer.from(dataUrl.slice(prefix.length), 'base64').toString('utf8');
}

test('returns null when the native image factory cannot decode data URLs', () => {
  const factory = createNativeContextMenuIconFactory({});
  assert.equal(factory('copy'), null);
});

test('returns null for ids the catalog does not know', () => {
  const { calls, api } = createNativeImageApi();
  const factory = createNativeContextMenuIconFactory(api);
  assert.equal(factory('definitely-not-an-icon'), null);
  assert.equal(factory(''), null);
  assert.equal(factory(undefined), null);
  assert.deepEqual(calls.dataUrls, []);
});

test('renders an 18px stroked svg data url from the catalog definition', () => {
  const { calls, api } = createNativeImageApi();
  const icon = createNativeContextMenuIconFactory(api)('copy');
  assert.equal(calls.dataUrls.length, 1);
  const svg = decodeSvg(calls.dataUrls[0]);
  assert.equal(
    svg.startsWith(
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="CanvasText" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
    ),
    true,
  );
  assert.equal(svg.endsWith('</svg>'), true);
  const definition = resolveContextMenuIconDefinition('copy');
  assert.equal(definition.id, 'copy');
  assert.equal(svg.includes('<rect x="8" y="8" width="12" height="12" rx="2"/>'), true);
  assert.deepEqual(calls.resizes, [{ width: 0x10, height: 0x10, quality: 'best' }]);
  assert.deepEqual(icon.resizedWith, { width: 0x10, height: 0x10, quality: 'best' });
});

test('honours the requested size and stroke colour', () => {
  const { calls, api } = createNativeImageApi();
  createNativeContextMenuIconFactory(api, { size: 0x18, stroke: 'red' })('archive');
  assert.deepEqual(calls.resizes, [{ width: 0x18, height: 0x18, quality: 'best' }]);
  const svg = decodeSvg(calls.dataUrls[0]);
  assert.equal(svg.includes('stroke="red"'), true);
});

test('escapes xml-significant characters in the stroke colour', () => {
  const { calls, api } = createNativeImageApi();
  const factory = createNativeContextMenuIconFactory(api, { stroke: 'a&b<c>d"e' });
  assert.notEqual(factory('archive'), null);
  const svg = decodeSvg(calls.dataUrls[0]);
  assert.equal(svg.includes('stroke="a&amp;b&lt;c&gt;d&quot;e"'), true);
});

test('caches one native icon per resolved catalog id', () => {
  const { calls, api } = createNativeImageApi();
  const factory = createNativeContextMenuIconFactory(api);
  const first = factory('folder');
  const second = factory('folder-open');
  assert.equal(calls.dataUrls.length, 1);
  assert.equal(first, second);
  assert.equal(resolveContextMenuIconDefinition('folder').id, 'folder-open');
});

test('missing resized output falls back to the decoded native image', () => {
  const { calls, api } = createNativeImageApi({ noResize: true });
  const icon = createNativeContextMenuIconFactory(api)('copy');
  assert.deepEqual(Object.keys(icon), ['isEmpty', 'id']);
  assert.equal(calls.dataUrls.length, 1);
});

test('an empty native image is rejected and not cached', () => {
  const { calls, api } = createNativeImageApi({ empty: true });
  const factory = createNativeContextMenuIconFactory(api);
  assert.equal(factory('copy'), null);
  assert.equal(factory('copy'), null);
  assert.equal(calls.dataUrls.length, 2);
});

test('a decoder failure propagates instead of returning a broken icon', () => {
  const { api } = createNativeImageApi({ createThrows: true });
  const factory = createNativeContextMenuIconFactory(api);
  assert.throws(() => factory('copy'), /bad data url/);
});
