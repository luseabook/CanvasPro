import { get, post, del } from './requester.js';
export async function getProjects() {
  try {
    const get2 = await get('/api/projects', { provider: 'local' });
    return Array.isArray(get2) ? get2 : [];
  } catch (value) {
    return (console.error('Failed to get projects:', value), []);
  }
}
export async function createProject(id, name) {
  try {
    return (await post('/api/projects', { id: id, name: name }, { provider: 'local' }), id);
  } catch (item) {
    return (console.error('Failed to create project:', item), null);
  }
}
export async function deleteProject(key) {
  try {
    return (await del('/api/projects?id=' + key, { provider: 'local' }), true);
  } catch (index) {
    return (console.error('Failed to delete project:', index), false);
  }
}
