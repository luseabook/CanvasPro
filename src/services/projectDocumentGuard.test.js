// Offline reader doubles only; does not access user project files or the server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { requireOpenedProjectDocument, requireProjectDocument, readProjectDocument, unwrapProjectReadResponse } from './projectDocumentGuard.js';

test('only a genuine 404 response is eligible for new-project initialization', () => {
  assert.equal(unwrapProjectReadResponse({ status: 404, data: null }), null);
  const document = { nodes: [] };
  assert.equal(unwrapProjectReadResponse({ status: 200, data: document }), document);
  for (const response of [{ status: 200, data: null }, { status: 204, data: null }, null]) {
    assert.throws(() => unwrapProjectReadResponse(response), /未以空画布替代/);
  }
});

test('only explicitly allowed missing new/default project becomes an empty template', async () => {
  assert.equal(requireProjectDocument(null, { allowMissing: true }), null);
  assert.throws(() => requireProjectDocument(null), /未以空画布替代/);
  await assert.rejects(readProjectDocument(async () => null, 'existing-project'), /未以空画布替代/);
});

test('read, JSON decoding and permission failures propagate instead of creating a blank project', async () => {
  const error = new Error('permission denied');
  await assert.rejects(readProjectDocument(async () => { throw error; }, 'existing-project', { allowMissing: true }), e => e === error);
});

test('existing multi-canvas and old single-canvas node collections remain supported without mutation', async () => {
  for (const document of [
    { canvases: [{ id: 'a', nodes: [], edges: [] }], activeCanvasId: 'a' },
    { canvases: [] }, { nodes: [] }, { v2_nodes: { n: { id: 'n' } } },
  ]) {
    assert.equal(requireProjectDocument(document), document);
    assert.equal(await readProjectDocument(async () => document, 'valid'), document);
  }
});

test('unsupported or malformed saved data fails closed, including a 200 error-shaped object', () => {
  for (const data of [{}, [], false, 0, 'text', { error: 'Project not found' },
    { canvases: [{ nodes: [] }] }, { canvases: [{ id: 'a', nodes: 'wrong' }] },
    { canvases: {} }, { canvases: {}, nodes: [] }, { nodes: [], edges: 'wrong' },
    { nodes: 'wrong', v2_nodes: [] }]) {
    assert.throws(() => requireProjectDocument(data), /未以空画布替代/);
    assert.throws(() => requireProjectDocument(data, { allowMissing: true }), /未以空画布替代/);
  }
});

test('desktop open requires actual success and a supported project document', () => {
  for (const data of [{ nodes: [] }, { v2_nodes: {} }, { canvases: [{ id: 'old', nodes: [], edges: [] }] }]) {
    assert.equal(requireOpenedProjectDocument({ success: true, data }), data);
  }
  assert.throws(() => requireOpenedProjectDocument({ success: false, error: 'read denied', data: { nodes: [] } }), /read denied/);
  for (const response of [null, {}, { canceled: true }, { success: true }, { success: true, data: {} },
    { success: true, data: { canvases: [{ nodes: [] }] } }]) {
    assert.throws(() => requireOpenedProjectDocument(response), /未以空画布替代/);
  }
});
