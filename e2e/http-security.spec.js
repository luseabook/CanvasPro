import net from 'node:net';
import { test, expect, request as apiRequest } from '@playwright/test';
import { E2E_TOKEN as TOKEN } from '../tools/test-runtime.mjs';

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

// RFC 9110: a HEAD response is identical to the GET response minus the message
// body. The server used to answer HEAD through the GET pipeline without dropping
// the body, so a 403 carried 57 bytes of JSON after the headers. Playwright only
// noticed intermittently ("Data after `Connection: close`"), which is exactly why
// this asserts on raw socket bytes instead of on a client that may be lenient.
const rawHead = (baseURL, pathname, token) =>
  new Promise((resolve, reject) => {
    const url = new URL(pathname, baseURL);
    const socket = net.connect(Number(url.port), url.hostname, () => {
      socket.write(
        `HEAD ${pathname} HTTP/1.1\r\nHost: ${url.host}\r\n` +
          `X-AIC-Local-Token: ${token}\r\nConnection: close\r\n\r\n`
      );
    });
    const chunks = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('end', () => resolve(Buffer.concat(chunks).toString('latin1')));
    socket.on('error', reject);
    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error(`HEAD ${pathname} timed out`));
    });
  });

test('HEAD responses carry headers only, for both the denied and the allowed path', async ({ baseURL }) => {
  for (const { token, expected } of [
    { token: '', expected: /^HTTP\/1\.[01] 403/ },
    { token: TOKEN, expected: /^HTTP\/1\.[01] 200/ },
  ]) {
    const raw = await rawHead(baseURL, '/output/acceptance-pixel.png', token);
    const splitAt = raw.indexOf('\r\n\r\n');
    expect(splitAt, `响应头不完整: ${JSON.stringify(raw.slice(0, 120))}`).toBeGreaterThan(0);
    const headers = raw.slice(0, splitAt);
    const body = raw.slice(splitAt + 4);
    expect(headers, headers.split('\r\n')[0]).toMatch(expected);
    // Content-Length is still declared (HEAD must report what GET would send);
    // what must not happen is those bytes actually being written.
    expect(headers.toLowerCase()).toContain('content-length:');
    expect(body.length, `HEAD 不得带 body，实际 ${JSON.stringify(body.slice(0, 80))}`).toBe(0);
  }
});
