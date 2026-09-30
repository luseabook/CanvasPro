import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnosticLogEntry } from './diagnostics.js';
test('updater diagnostic details remain bounded and redact synthetic credentials/private bodies', () => {
  const token = 'AUDIT_SYNTHETIC_TOKEN_DO_NOT_USE';
  const error = new Error(`HTTP 502 https://example.invalid/feed?token=${token} Authorization: Bearer ${token} ` + 'x'.repeat(10000));
  const entry = buildDiagnosticLogEntry({ type: 'updater.error', error, context: { apiKey: token, requestBody: 'private fixture script' } });
  const serialized = JSON.stringify(entry);
  assert.equal(serialized.includes(token), false);
  assert.equal(serialized.includes('private fixture script'), false);
  assert.ok(entry.message.length < 2100);
  assert.ok(entry.stack.length < 10100);
  assert.ok(serialized.includes('[REDACTED]'));
});
