import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMFYUI_CONNECTION_TARGETS,
  COMFYUI_LOCAL_DEFAULT_URL,
  getComfyUiEndpointStatusEntries,
  getComfyUiStatusElementId,
  isComfyUiEndpointConfigured,
  normalizeComfyUiConnectionTarget,
  normalizeComfyUiFormUrl,
} from './comfyUiConnectionSettings.js';

test('the target list is a frozen pair', () => {
  assert.ok(Object.isFrozen(COMFYUI_CONNECTION_TARGETS));
  assert.deepEqual([...COMFYUI_CONNECTION_TARGETS], ['local', 'cloud']);
  assert.equal(COMFYUI_LOCAL_DEFAULT_URL, '127.0.0.1:8188');
});

test('a bare host:port gains the http scheme and drops the path slash', () => {
  assert.equal(normalizeComfyUiFormUrl('127.0.0.1:8188'), 'http://127.0.0.1:8188');
  assert.equal(normalizeComfyUiFormUrl('WEBUI.local:8188'), 'http://webui.local:8188');
  assert.equal(normalizeComfyUiFormUrl('host:8188/path/'), 'http://host:8188/path');
});

test('an explicit scheme is preserved', () => {
  assert.equal(normalizeComfyUiFormUrl('https://host/'), 'https://host');
  assert.equal(normalizeComfyUiFormUrl('ftp://x/'), 'ftp://x');
  assert.equal(normalizeComfyUiFormUrl('https://user:pw@host:9000/a'), 'https://user:pw@host:9000/a');
});

test('query and hash are stripped', () => {
  assert.equal(normalizeComfyUiFormUrl('http://example.com/a/b/?x=1#h'), 'http://example.com/a/b');
});

test('collapsed trailing slashes are removed', () => {
  assert.equal(normalizeComfyUiFormUrl('http://h//'), 'http://h');
});

test('blank input yields an empty string', () => {
  assert.equal(normalizeComfyUiFormUrl(''), '');
  assert.equal(normalizeComfyUiFormUrl('   '), '');
  assert.equal(normalizeComfyUiFormUrl(null), '');
  assert.equal(normalizeComfyUiFormUrl(undefined), '');
});

test('the fallback kicks in only for a falsy primary, and blanks win over it', () => {
  assert.equal(normalizeComfyUiFormUrl('', 'fb.local:1'), 'http://fb.local:1');
  assert.equal(normalizeComfyUiFormUrl('   ', 'fb.local:1'), '');
  assert.equal(normalizeComfyUiFormUrl(null, 'fb.local:1'), 'http://fb.local:1');
  assert.equal(normalizeComfyUiFormUrl(undefined, 'fb.local:1'), 'http://fb.local:1');
  assert.equal(normalizeComfyUiFormUrl('real.local:2', 'fb.local:1'), 'http://real.local:2');
  assert.equal(normalizeComfyUiFormUrl('', ''), '');
});

test('an unparsable scheme-only value degrades through the catch branch', () => {
  assert.equal(normalizeComfyUiFormUrl('http://'), 'http:');
});

test('connection targets are trimmed and lower-cased', () => {
  assert.equal(normalizeComfyUiConnectionTarget(' local '), 'local');
  assert.equal(normalizeComfyUiConnectionTarget('CLOUD'), 'cloud');
  assert.equal(normalizeComfyUiConnectionTarget(''), '');
  assert.equal(normalizeComfyUiConnectionTarget(null), '');
  assert.equal(normalizeComfyUiConnectionTarget('bogus'), '');
});

test('status element ids are namespaced per target', () => {
  assert.equal(getComfyUiStatusElementId('local'), 'providerTestStatus-comfyui-local');
  assert.equal(getComfyUiStatusElementId('CLOUD'), 'providerTestStatus-comfyui-cloud');
  assert.equal(getComfyUiStatusElementId('bogus'), 'providerTestStatus-comfyui');
  assert.equal(getComfyUiStatusElementId(), 'providerTestStatus-comfyui');
});

test('the local target counts as configured through its default url', () => {
  assert.equal(isComfyUiEndpointConfigured({}, 'local'), true);
  assert.equal(isComfyUiEndpointConfigured(), true);
  assert.equal(isComfyUiEndpointConfigured({ providers: { comfyui: {} } }, 'local'), true);
});

test('a whitespace-only url counts as unconfigured instead of falling back', () => {
  assert.equal(isComfyUiEndpointConfigured({ providers: { comfyui: { apiUrl: '   ' } } }, 'local'), false);
  assert.equal(
    isComfyUiEndpointConfigured({ providers: { comfyui: { cloudApiUrl: '   ' } } }, 'cloud'),
    false,
  );
});

test('the cloud target requires an explicit url', () => {
  assert.equal(isComfyUiEndpointConfigured({}, 'cloud'), false);
  assert.equal(
    isComfyUiEndpointConfigured({ providers: { comfyui: { cloudApiUrl: '  ' } } }, 'cloud'),
    false,
  );
  assert.equal(
    isComfyUiEndpointConfigured({ providers: { comfyui: { cloudApiUrl: ' https://c ' } } }, 'cloud'),
    true,
  );
});

test('an unrecognised target falls back to the local endpoint', () => {
  assert.equal(isComfyUiEndpointConfigured({ providers: { comfyui: { apiUrl: 'a' } } }, 'bogus'), true);
});

test('status entries always cover both targets in order', () => {
  const entries = getComfyUiEndpointStatusEntries();
  assert.deepEqual(
    entries.map((entry) => entry.target),
    ['local', 'cloud'],
  );
  assert.deepEqual(entries, [
    { target: 'local', tone: 'configured', textKey: 'statuses.configured' },
    { target: 'cloud', tone: 'unconfigured', textKey: 'statuses.unconfigured' },
  ]);
});

test('a passed capability becomes success and a failed one danger', () => {
  const state = {
    providers: {
      comfyui: {
        apiUrl: 'a',
        cloudApiUrl: 'b',
        connectionVerification: {
          capabilities: { local: { status: 'passed' }, cloud: { status: 'failed' } },
        },
      },
    },
  };
  assert.deepEqual(getComfyUiEndpointStatusEntries(state), [
    { target: 'local', tone: 'success', textKey: 'diagnostics.passed' },
    { target: 'cloud', tone: 'danger', textKey: 'diagnostics.notPassed' },
  ]);
});

test('an unknown capability status stays configured', () => {
  const state = {
    providers: {
      comfyui: {
        apiUrl: 'a',
        cloudApiUrl: 'b',
        connectionVerification: { capabilities: { local: { status: 'pending' } } },
      },
    },
  };
  assert.deepEqual(getComfyUiEndpointStatusEntries(state), [
    { target: 'local', tone: 'configured', textKey: 'statuses.configured' },
    { target: 'cloud', tone: 'configured', textKey: 'statuses.configured' },
  ]);
});

test('a missing capability subtree is tolerated', () => {
  const state = { providers: { comfyui: { apiUrl: 'a', cloudApiUrl: 'b', connectionVerification: {} } } };
  assert.deepEqual(
    getComfyUiEndpointStatusEntries(state).map((entry) => entry.tone),
    ['configured', 'configured'],
  );
  assert.deepEqual(
    getComfyUiEndpointStatusEntries(null).map((entry) => entry.tone),
    ['configured', 'unconfigured'],
  );
});
