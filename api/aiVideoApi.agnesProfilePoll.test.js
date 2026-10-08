import test from 'node:test';
import assert from 'node:assert/strict';

// Regression: Agnes declares TWO provider profiles (agnes-domestic / agnes) and the user may
// configure only one of them. The create request already resolves the key through the declared
// profile, but the poll request used to read the bare manifest provider id ("agnes"). With a
// domestic-only setup that yielded an EMPTY bearer token, so the local proxy answered
// 400 {"error":"Missing apiUrl or apiKey"} and every Agnes video task died right after creation.
// The mirror case (international only) must work too, so the resolution has to be "which declared
// profile actually has a key", not simply the first declared profile.
const VIDEO_MODEL = 'agnes/agnes-video-2.5-flash';

function makeJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return String(name || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

/**
 * Drives the real generateVideo against a stubbed proxy, with exactly the given provider config.
 * Returns what the create body and the poll request looked like on the wire.
 */
async function runVideoWithProviders(providers) {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const createBodies = [];
  const pollRequests = [];
  try {
    globalThis.window = { currentProjectId: 'agnes-video-poll-test', location: { href: 'http://localhost/' } };
    globalThis.fetch = async (target, init = {}) => {
      const url = String(target);
      const method = String(init?.method || 'GET').toUpperCase();
      const headers = new Headers(init?.headers || {});
      if (url.includes('/api/config')) return makeJsonResponse({ providers });
      // Task creation goes through the local proxy.
      if (url.includes('/api/v2/proxy/image')) {
        if (init?.body) createBodies.push(String(init.body));
        return makeJsonResponse(JSON.stringify({ video_id: 'task_vid_1', status: 'queued', progress: 0 }));
      }
      // Task polling also goes through the local proxy: /api/v2/proxy/task?apiUrl=<agnesapi...>.
      if (url.includes('/api/v2/proxy/task')) {
        pollRequests.push({ url, method, authorization: headers.get('authorization') || '' });
        return makeJsonResponse(
          JSON.stringify({
            id: 'task_vid_1',
            status: 'completed',
            progress: 100,
            url: 'https://cos-platform-outputs.example/videos/agnes-video-2.5/task_vid_1.mp4',
          }),
        );
      }
      // Local save / thumbnail helpers are outside the scope of this regression.
      return makeJsonResponse('{}');
    };

    const { clearApiConfig } = await import('./configApi.js');
    clearApiConfig();
    const { generateVideo } = await import('./aiVideoApi.js');

    let thrown = null;
    try {
      await generateVideo({ model: VIDEO_MODEL, prompt: 'a cat walking on grass' });
    } catch (error) {
      thrown = error;
    }
    return { createBodies, pollRequests, thrown };
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
}

function assertPollUsesKey(result, expectedKey) {
  assert.ok(result.createBodies.length > 0, 'the create request must go through the local proxy');
  const created = JSON.parse(result.createBodies[0]);
  assert.equal(created.apiKey, expectedKey, 'create must use the configured profile key');

  assert.ok(result.pollRequests.length > 0, 'the task must be polled through the local proxy');
  const poll = result.pollRequests[0];
  assert.match(
    decodeURIComponent(poll.url),
    /\/agnesapi\?video_id=task_vid_1/,
    'poll URL must be the official /agnesapi route',
  );
  assert.equal(
    poll.authorization,
    'Bearer ' + expectedKey,
    'poll must carry the configured profile key (got: ' + JSON.stringify(poll.authorization) + ')',
  );
  assert.notEqual(result.thrown?.message, 'Missing apiUrl or apiKey', 'the proxy must not reject the poll');
}

test('aiVideoApi agnes video: domestic-only config sends the poll with the domestic key (was an empty bearer)', async () => {
  const result = await runVideoWithProviders({
    'agnes-domestic': { apiUrl: 'https://api.agnes-ai.cn/', apiKey: 'sk-domestic' },
  });
  assertPollUsesKey(result, 'sk-domestic');
});

test('aiVideoApi agnes video: international-only config sends the poll with the international key', async () => {
  const result = await runVideoWithProviders({
    agnes: { apiUrl: 'https://apihub.agnes-ai.com/', apiKey: 'sk-intl' },
  });
  assertPollUsesKey(result, 'sk-intl');
});
