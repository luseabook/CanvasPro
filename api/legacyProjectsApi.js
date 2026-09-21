import { get, post, del } from './requester.js';
export async function getProjects() {
  try {
    const _0x375f07 = await get('/api/projects', { provider: 'local' });
    return Array.isArray(_0x375f07) ? _0x375f07 : [];
  } catch (_0x456085) {
    return (console.error('Failed to get projects:', _0x456085), []);
  }
}
export async function createProject(_0x57ce42, _0x5abe48) {
  try {
    return (
      await post('/api/projects', { id: _0x57ce42, name: _0x5abe48 }, { provider: 'local' }),
      _0x57ce42
    );
  } catch (_0x1ad13a) {
    return (console.error('Failed to create project:', _0x1ad13a), null);
  }
}
export async function deleteProject(_0x36d5e2) {
  try {
    return (await del('/api/projects?id=' + _0x36d5e2, { provider: 'local' }), true);
  } catch (_0x4c2eec) {
    return (console.error('Failed to delete project:', _0x4c2eec), false);
  }
}
