import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeDiagnosticError } from './diagnosticError.js';

const TRUNCATION_SUFFIX = '... [truncated]';

test('serializeDiagnosticError keeps name, message and stack for an Error', () => {
  const error = new Error('boom');
  error.name = 'CustomError';
  const serialized = serializeDiagnosticError(error);
  assert.equal(serialized.name, 'CustomError');
  assert.equal(serialized.message, 'boom');
  assert.equal(typeof serialized.stack, 'string');
  assert.deepEqual(Object.keys(serialized), ['name', 'message', 'stack']);
});

test('serializeDiagnosticError degrades non-object throwables', () => {
  assert.deepEqual(serializeDiagnosticError('boom'), { name: 'Error', message: 'boom', stack: '' });
  assert.deepEqual(serializeDiagnosticError(42), { name: 'Error', message: '42', stack: '' });
  assert.deepEqual(serializeDiagnosticError(null), { name: 'Error', message: '', stack: '' });
  assert.deepEqual(serializeDiagnosticError(undefined), { name: 'Error', message: '', stack: '' });
});

test('serializeDiagnosticError only copies known metadata keys of supported types', () => {
  const error = new Error('x');
  error.type = 'network';
  error.provider = 'doubao';
  error.code = 401;
  error.status = 'unauthorized';
  error.retryable = false;
  error.extra = 'dropped';
  error.detail = { nested: true };
  const serialized = serializeDiagnosticError(error);
  assert.deepEqual(serialized, {
    name: 'Error',
    message: 'x',
    stack: serialized.stack,
    type: 'network',
    provider: 'doubao',
    code: 401,
    status: 'unauthorized',
    retryable: false,
  });
});

test('serializeDiagnosticError truncates long name, message, stack and metadata', () => {
  const error = new Error('m'.repeat(3000));
  error.name = 'n'.repeat(200);
  error.stack = 's'.repeat(20000);
  error.code = 'c'.repeat(3000);
  const serialized = serializeDiagnosticError(error);
  assert.equal(serialized.name, 'n'.repeat(160) + TRUNCATION_SUFFIX);
  assert.equal(serialized.message, 'm'.repeat(2000) + TRUNCATION_SUFFIX);
  assert.equal(serialized.stack, 's'.repeat(10000) + TRUNCATION_SUFFIX);
  assert.equal(serialized.code, 'c'.repeat(2000) + TRUNCATION_SUFFIX);
});

test('serializeDiagnosticError walks the cause chain up to the depth limit', () => {
  const chain = [new Error('e0'), new Error('e1'), new Error('e2'), new Error('e3'), new Error('e4')];
  chain[0].cause = chain[1];
  chain[1].cause = chain[2];
  chain[2].cause = chain[3];
  chain[3].cause = chain[4];
  const serialized = serializeDiagnosticError(chain[0]);
  assert.equal(serialized.message, 'e0');
  assert.equal(serialized.cause.message, 'e1');
  assert.equal(serialized.cause.cause.message, 'e2');
  assert.equal(serialized.cause.cause.cause.message, 'e3');
  assert.equal(serialized.cause.cause.cause.cause, '[MaxDepth]');
});

test('serializeDiagnosticError marks a self referencing cause as circular', () => {
  const error = new Error('loop');
  error.cause = error;
  const serialized = serializeDiagnosticError(error);
  assert.equal(serialized.cause, '[Circular]');
});

test('serializeDiagnosticError serializes repeated but acyclic causes twice', () => {
  const shared = new Error('shared');
  const error = new Error('outer');
  error.cause = shared;
  error.type = 'outer';
  const serialized = serializeDiagnosticError(error);
  assert.equal(serialized.cause.message, 'shared');
  assert.equal(serialized.cause.name, 'Error');
});
