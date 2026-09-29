import { get, post } from './requester.js';
const PATH = '/api/v2/canvas-shortcuts';
export async function fetchCanvasShortcuts() {
  return get(PATH, { provider: 'local' });
}
export async function saveCanvasShortcuts(_0x2807a0, _0x3175bb) {
  return post(PATH, { catalog: _0x2807a0, revision: _0x3175bb, developerMode: !![] }, { provider: 'local' });
}
