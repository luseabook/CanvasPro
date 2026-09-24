import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  createAgentInformationCapabilityOperations,
  extractAgentInformationHtml,
  isPublicAgentInformationAddress,
  normalizeAgentInformationUrl,
  __agentInformationCapabilityForTest,
} from './agentInformationCapabilityOperations.js';

const { requestPinnedUrl } = __agentInformationCapabilityForTest;

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function serverUrl(server, path = '/') {
  const { port } = server.address();
  return new URL('http://127.0.0.1:' + port + path);
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('normalizeAgentInformationUrl accepts http/https and drops the fragment', () => {
  const url = normalizeAgentInformationUrl('https://example.com/a?b=1#frag');
  assert.equal(url.hash, '');
  assert.equal(url.toString(), 'https://example.com/a?b=1');
  assert.equal(normalizeAgentInformationUrl('http://example.com/').protocol, 'http:');
});

test('normalizeAgentInformationUrl rejects unsafe or unsupported URLs', () => {
  const cases = [
    ['not a url', 'INVALID_URL'],
    ['file:///etc/passwd', 'UNSUPPORTED_URL_PROTOCOL'],
    ['ftp://example.com/', 'UNSUPPORTED_URL_PROTOCOL'],
    ['https://user:pass@example.com/', 'URL_CREDENTIALS_FORBIDDEN'],
    ['https://example.com:8080/', 'URL_PORT_FORBIDDEN'],
    ['http://localhost/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://service.internal/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://printer.local/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://127.0.0.1/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://10.1.2.3/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://192.168.1.4/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://169.254.1.1/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://[::1]/', 'PRIVATE_URL_FORBIDDEN'],
    ['http://[fd00::1]/', 'PRIVATE_URL_FORBIDDEN'],
  ];
  for (const [input, code] of cases) {
    assert.throws(
      () => normalizeAgentInformationUrl(input),
      (error) => error.code === code,
      'expected ' + code + ' for ' + input,
    );
  }
});

test('isPublicAgentInformationAddress classifies public and reserved addresses', () => {
  for (const address of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111']) {
    assert.equal(isPublicAgentInformationAddress(address), true, address);
  }
  for (const address of [
    '0.0.0.0',
    '10.0.0.1',
    '127.0.0.1',
    '100.64.0.1',
    '169.254.10.10',
    '172.16.0.1',
    '192.0.2.1',
    '192.168.0.1',
    '198.18.0.1',
    '203.0.113.1',
    '224.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    '2001:db8::1',
    'fe80::1',
    'not-an-address',
  ]) {
    assert.equal(isPublicAgentInformationAddress(address), false, address);
  }
});

test('extractAgentInformationHtml keeps readable text and drops scripts', () => {
  const html = `<!doctype html><html><head>
    <title>  Hello &amp; World </title>
    <style>body{color:red}</style>
    <script>window.x = '<div>noise</div>'</script>
    </head><body>
    <!-- comment -->
    <h1>Heading</h1><p>First &lt;line&gt;</p><p>Second</p>
    </body></html>`;
  const { title, content } = extractAgentInformationHtml(html);
  assert.equal(title, 'Hello & World');
  assert.equal(content, 'Heading\nFirst <line>\nSecond');
  assert.ok(!content.includes('color:red'));
  assert.ok(!content.includes('window.x'));
});

test('readUrl returns extracted content and pins the resolved address', async () => {
  const calls = [];
  const html = '<html><head><title>T</title></head><body><p>Hello &amp; bye</p></body></html>';
  const operations = createAgentInformationCapabilityOperations({
    resolveHostname: async (hostname, options) => {
      calls.push({ hostname, options });
      return [{ address: '93.184.216.34', family: 4 }];
    },
    requestUrl: async (url, options) => {
      calls.push({ url: url.toString(), options });
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: Buffer.from(html),
      };
    },
  });
  const result = await operations.readUrl({ url: 'https://example.com/page#x' });
  assert.equal(result.success, true);
  assert.equal(result.source.requestedUrl, 'https://example.com/page');
  assert.equal(result.source.finalUrl, 'https://example.com/page');
  assert.equal(result.source.title, 'T');
  assert.equal(result.source.content, 'Hello & bye');
  assert.equal(result.source.contentType, 'text/html');
  assert.equal(result.source.truncated, false);
  assert.equal(result.source.trust, 'untrusted_external');
  assert.equal(result.source.byteLength, Buffer.byteLength(html));
  assert.deepEqual(calls[0], { hostname: 'example.com', options: { all: true, verbatim: true } });
  assert.equal(calls[1].options.address, '93.184.216.34');
  assert.equal(calls[1].options.family, 4);
});

test('readUrl treats plain text without html extraction', async () => {
  const operations = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async () => ({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: Buffer.from('{"a": 1}'),
    }),
  });
  const result = await operations.readUrl({ url: 'https://example.com/data.json' });
  assert.equal(result.source.title, '');
  assert.equal(result.source.content, '{"a": 1}');
  assert.equal(result.source.contentType, 'application/json');
});

test('readUrl rejects a hostname that resolves to a private address', async () => {
  const operations = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ],
  });
  await assert.rejects(
    () => operations.readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'PRIVATE_URL_FORBIDDEN',
  );
});

test('readUrl reports DNS failure', async () => {
  const operations = createAgentInformationCapabilityOperations({
    resolveHostname: async () => {
      throw new Error('ENOTFOUND');
    },
  });
  await assert.rejects(
    () => operations.readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'URL_DNS_FAILED',
  );
});

test('readUrl follows redirects up to the limit', async () => {
  const seen = [];
  let hop = 0;
  const operations = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async (url) => {
      seen.push(url.toString());
      hop += 1;
      if (hop < 3) {
        return {
          status: 302,
          headers: { location: '/hop-' + hop },
          body: Buffer.alloc(0),
        };
      }
      return { status: 200, headers: { 'content-type': 'text/plain' }, body: Buffer.from('done') };
    },
  });
  const result = await operations.readUrl({ url: 'https://example.com/start' });
  assert.equal(result.source.content, 'done');
  assert.equal(result.source.finalUrl, 'https://example.com/hop-2');
  assert.deepEqual(seen, [
    'https://example.com/start',
    'https://example.com/hop-1',
    'https://example.com/hop-2',
  ]);
});

test('readUrl rejects redirect loops and invalid redirects', async () => {
  const loop = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async () => ({ status: 301, headers: { location: '/again' }, body: Buffer.alloc(0) }),
  });
  await assert.rejects(
    () => loop.readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'URL_TOO_MANY_REDIRECTS',
  );

  const invalid = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async () => ({ status: 302, headers: {}, body: Buffer.alloc(0) }),
  });
  await assert.rejects(
    () => invalid.readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'URL_REDIRECT_INVALID',
  );

  const downgrade = createAgentInformationCapabilityOperations({
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async () => ({
      status: 302,
      headers: { location: 'http://127.0.0.1/secret' },
      body: Buffer.alloc(0),
    }),
  });
  await assert.rejects(
    () => downgrade.readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'PRIVATE_URL_FORBIDDEN',
  );
});

test('readUrl rejects unsupported responses and empty content', async () => {
  const build = (response) =>
    createAgentInformationCapabilityOperations({
      resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
      requestUrl: async () => response,
    });

  await assert.rejects(
    () => build({ status: 404, headers: {}, body: Buffer.alloc(0) }).readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'URL_HTTP_ERROR',
  );
  await assert.rejects(
    () =>
      build({
        status: 200,
        headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' },
        body: Buffer.alloc(0),
      }).readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'UNSUPPORTED_URL_CONTENT_ENCODING',
  );
  await assert.rejects(
    () =>
      build({
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        body: Buffer.alloc(0),
      }).readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'UNSUPPORTED_URL_CONTENT_TYPE',
  );
  await assert.rejects(
    () =>
      build({
        status: 200,
        headers: { 'content-type': 'text/html' },
        body: Buffer.from('<html><body><script>x</script></body></html>'),
      }).readUrl({ url: 'https://example.com/' }),
    (error) => error.code === 'URL_CONTENT_EMPTY',
  );
});

test('readUrl truncates content beyond maxChars', async () => {
  const operations = createAgentInformationCapabilityOperations({
    maxChars: 5,
    resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
    requestUrl: async () => ({
      status: 200,
      headers: { 'content-type': 'text/plain' },
      body: Buffer.from('0123456789'),
    }),
  });
  const result = await operations.readUrl({ url: 'https://example.com/' });
  assert.equal(result.source.content, '01234');
  assert.equal(result.source.truncated, true);
});

test('requestPinnedUrl reads a real loopback response', async () => {
  const server = await startServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('hello from server');
  });
  try {
    const result = await requestPinnedUrl(serverUrl(server, '/x?y=1'), {
      address: '127.0.0.1',
      family: 4,
      timeoutMs: 3000,
      maxBytes: 1024,
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.toString('utf8'), 'hello from server');
  } finally {
    await closeServer(server);
  }
});

test('requestPinnedUrl short-circuits redirect responses', async () => {
  const server = await startServer((_request, response) => {
    response.writeHead(302, { Location: 'https://example.com/next' });
    response.end();
  });
  try {
    const result = await requestPinnedUrl(serverUrl(server), {
      address: '127.0.0.1',
      family: 4,
      timeoutMs: 3000,
      maxBytes: 1024,
    });
    assert.equal(result.status, 302);
    assert.equal(result.headers.location, 'https://example.com/next');
    assert.equal(result.body.length, 0);
  } finally {
    await closeServer(server);
  }
});

test('requestPinnedUrl enforces the byte limit', async () => {
  const server = await startServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('x'.repeat(4096));
  });
  try {
    await assert.rejects(
      () =>
        requestPinnedUrl(serverUrl(server), {
          address: '127.0.0.1',
          family: 4,
          timeoutMs: 3000,
          maxBytes: 128,
        }),
      (error) => error.code === 'URL_RESPONSE_TOO_LARGE',
    );
  } finally {
    await closeServer(server);
  }
});

test('requestPinnedUrl times out and honours abort signals', async () => {
  const server = await startServer(() => {});
  try {
    await assert.rejects(
      () =>
        requestPinnedUrl(serverUrl(server), {
          address: '127.0.0.1',
          family: 4,
          timeoutMs: 150,
          maxBytes: 1024,
        }),
      (error) => error.code === 'URL_READ_TIMEOUT',
    );

    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () =>
        requestPinnedUrl(serverUrl(server), {
          address: '127.0.0.1',
          family: 4,
          signal: controller.signal,
          timeoutMs: 3000,
          maxBytes: 1024,
        }),
      (error) => error.code === 'URL_READ_ABORTED',
    );
  } finally {
    await closeServer(server);
  }
});
