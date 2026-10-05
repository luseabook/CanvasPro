import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COLLABORATION_IDENTITY_PROTOCOL,
  COLLABORATION_IDENTITY_VERSION,
  createCollaborationApi,
  decodeCollaborationInvite,
  encodeCollaborationInvite,
  isCollaborationMediaType,
  normalizeCollaborationMediaSource,
  readCollaborationMedia,
} from './canvasCollaborationApi.js';

test('canvasCollaborationApi: encodes and validates invite links', () => {
  const encoded = encodeCollaborationInvite(
    { url: 'https://relay.test', fingerprint: 'fingerprint-1', hostId: 'host-1' },
    'invite-token',
  );

  assert.match(encoded, /^AICLAN2\./);
  assert.deepEqual(decodeCollaborationInvite(encoded), {
    endpoint: {
      url: 'https://relay.test',
      fingerprint: 'fingerprint-1',
      hostId: 'host-1',
    },
    invite: 'invite-token',
  });
  assert.throws(() => decodeCollaborationInvite('invalid'), /邀请连接信息/);
});

test('canvasCollaborationApi: authenticates and relays through the control channel', async () => {
  const controlCalls = [];
  let sessionRequest = null;
  const api = createCollaborationApi({
    serverUrl: 'https://relay.test/',
    fetchImpl: async (url, options) => {
      sessionRequest = { url, options };
      return new Response(
        JSON.stringify({
          success: true,
          token: 'session-token',
          actorId: 'actor-1',
          protocol: COLLABORATION_IDENTITY_PROTOCOL,
          version: COLLABORATION_IDENTITY_VERSION,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
    controlRequest: async (body) => {
      controlCalls.push(body);
      if (body.action === 'start') {
        return { success: true, connectionId: 'connection-1', hosting: true };
      }
      if (body.action === 'relay') {
        return { success: true, action: body.payload.action };
      }
      return { success: true };
    },
  });

  const session = await api.authenticate({ name: 'User' });
  const connection = await api.startHost(null);
  const events = await api.events({ roomId: 'room-1', after: 3 }, null);
  await api.disconnect();

  assert.equal(session.token, 'session-token');
  assert.equal(sessionRequest.url, 'https://relay.test/api/collaboration/v1/session');
  assert.equal(JSON.parse(sessionRequest.options.body).protocol, COLLABORATION_IDENTITY_PROTOCOL);
  assert.equal(connection.connectionId, 'connection-1');
  assert.deepEqual(events, { success: true, action: 'events' });
  assert.equal(controlCalls[0].action, 'start');
  assert.equal(controlCalls[1].payload.action, 'events');
  assert.equal(controlCalls.at(-1).action, 'disconnect');
});

test('canvasCollaborationApi: rejects insecure endpoints and normalizes media types', () => {
  assert.throws(() => createCollaborationApi({ serverUrl: 'http://relay.test' }), /HTTPS/);
  assert.throws(() => createCollaborationApi({ serverUrl: 'https://user:pass@relay.test' }), /地址无效/);

  assert.equal(isCollaborationMediaType('image/png'), true);
  assert.equal(isCollaborationMediaType('application/pdf'), false);
  assert.equal(
    normalizeCollaborationMediaSource({ localPath: 'data/assets/preview.png' }),
    '/data/assets/preview.png',
  );
});

test('canvasCollaborationApi: reads collaboration media and corrects its detected type', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(new Uint8Array([137, 80, 78, 71, 0x0d, 0x0a, 26, 0x0a]), {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });

  try {
    const blob = await readCollaborationMedia('data/assets/preview.png');
    assert.equal(blob.type, 'image/png');
    assert.equal(blob.size, 8);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
