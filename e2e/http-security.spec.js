import { test, expect, request as apiRequest } from '@playwright/test';

test('live server requires a local token for shortdrama and config APIs', async ({ baseURL, request }) => {
  const anonymous = await apiRequest.newContext({ baseURL, extraHTTPHeaders: { 'X-AIC-Local-Token': '' } });
  try {
    for (const endpoint of ['/api/config', '/api/v2/projects']) {
      const response = await anonymous.get(endpoint);
      expect(response.status(), endpoint).toBe(403);
    }
    const denied = await anonymous.post('/api/shortdrama/project', { data: { name: 'unauthorized fixture' } });
    expect(denied.status()).toBe(403);
    const authorized = await request.post('/api/shortdrama/project', { data: { name: 'isolated acceptance fixture' } });
    expect(authorized.ok()).toBe(true);
    expect((await authorized.text()).toLowerCase()).not.toContain('no such table');
  } finally { await anonymous.dispose(); }
});

test('static allowlist blocks repository internals, private files and listings for GET and HEAD', async ({ request }) => {
  for (const endpoint of ['/server.py', '/.git/HEAD', '/package.json', '/backend/shortdrama_db.py', '/electron/main.js', '/user/config.json', '/data/', '/src/']) {
    for (const method of ['get', 'head']) {
      const response = await request[method](endpoint);
      expect([403, 404], `${method} ${endpoint}`).toContain(response.status());
    }
  }
  for (const endpoint of ['/', '/styles/story-workspace-modern.css', '/src/modules/storyWorkspace/storyHomePresentation.js']) {
    expect((await request.get(endpoint)).ok(), endpoint).toBe(true);
  }
});

test('live JSON file routes reject encoded path escapes without breaking normal saves', async ({ request }) => {
  for (const name of ['..%2fescape.json', '..%5cescape.json', 'C%3a%5ctemp%5cescape.json']) {
    const response = await request.post(`/api/v2/user/${name}`, { data: { fixture: true } });
    expect([400, 403, 404], name).toContain(response.status());
  }
  const saved = await request.post('/api/v2/user/acceptance-fixture.json', { data: { fixture: 'temporary-data-only' } });
  expect(saved.ok()).toBe(true);
  const read = await request.get('/api/v2/user/acceptance-fixture.json');
  expect(read.ok()).toBe(true);
  expect(await read.text()).toContain('temporary-data-only');
});


test('private mapped media works with a token, but not without one, for GET and HEAD', async ({ request, baseURL }) => {
  const anonymous = await apiRequest.newContext({ baseURL, extraHTTPHeaders: { 'X-AIC-Local-Token': '' } });
  try {
    for (const method of ['get','head']) {
      expect((await anonymous[method]('/output/acceptance-pixel.png')).status()).toBe(403);
      const response = await request[method]('/output/acceptance-pixel.png');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
  } finally { await anonymous.dispose(); }
});
