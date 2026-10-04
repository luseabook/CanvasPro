import { get, post } from './requester.js';
const PATH = '/api/v2/canvas-shortcuts';
export async function fetchCanvasShortcuts() {
  return get(PATH, { provider: 'local' });
}
export async function saveCanvasShortcuts(catalog, revision) {
  return post(PATH, { catalog: catalog, revision: revision, developerMode: !![] }, { provider: 'local' });
}
