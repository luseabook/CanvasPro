import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createExternalPackageTickets } from './externalPackageTickets.js';

const packagePath = path.resolve('private', 'my-project.aicpkg');

test('an OS request reveals only basename and opaque handle, not filesystem path', () => {
  const tickets = createExternalPackageTickets(), request = tickets.issueRequest(packagePath, 'open-file');
  assert.equal(request.kind, 'fullProjectPackage');
  assert.equal(request.filename, 'my-project.aicpkg');
  assert.equal(request.source, 'open-file');
  assert.match(request.externalPackageTicket, /^[a-f0-9]{48}$/);
  assert.deepEqual(Object.keys(request).sort(), ['success', 'canceled', 'kind', 'externalPackageTicket', 'filename', 'source'].sort());
  assert.equal(Object.values(request).some(value => typeof value === 'string' && value.includes(path.dirname(packagePath))), false);
  assert.equal(tickets.consume(request.externalPackageTicket), packagePath);
  assert.throws(() => tickets.consume(request.externalPackageTicket), /失效或已使用/);
});
test('relative, non-package and malformed paths cannot issue a handle', () => {
  const tickets = createExternalPackageTickets();
  for (const file of ['', 'relative.aicpkg', path.resolve('other.txt'), null]) {
    assert.throws(() => tickets.issueRequest(file, 'startup'), /路径无效/);
  }
  assert.ok(tickets.issueRequest(path.resolve('UPPER.AICPKG'), 'startup').externalPackageTicket);
});
test('handles cannot be forged or exchanged between independently created stores', () => {
  const a = createExternalPackageTickets(), b = createExternalPackageTickets();
  const ticket = a.issueRequest(packagePath, 'startup').externalPackageTicket;
  const forged = (ticket[0] === 'a' ? 'b' : 'a') + ticket.slice(1);
  for (const invalid of [null, '', forged, 'G'.repeat(48), ticket.slice(1)]) {
    assert.throws(() => a.consume(invalid), /失效或已使用/);
  }
  assert.throws(() => b.consume(ticket), /失效或已使用/);
  assert.equal(a.consume(ticket), packagePath);
});
test('an expired handle fails closed and is pruned before issuing new ones', () => {
  let clock = 10;
  const tickets = createExternalPackageTickets({ now: () => clock });
  const first = tickets.issueRequest(packagePath, 'startup').externalPackageTicket;
  clock += 10 * 60 * 1000;
  assert.throws(() => tickets.consume(first), /失效或已使用/);
  assert.equal(tickets.consume(tickets.issueRequest(packagePath, 'open-file').externalPackageTicket), packagePath);
});
test('at most 32 outstanding OS package handles; capacity recovers after use', () => {
  const tickets = createExternalPackageTickets(), issued = [];
  for (let i = 0; i < 32; i++) issued.push(tickets.issueRequest(packagePath, 'startup').externalPackageTicket);
  assert.throws(() => tickets.issueRequest(packagePath, 'startup'), /过多/);
  assert.equal(new Set(issued).size, 32);
  tickets.consume(issued[0]);
  assert.ok(tickets.issueRequest(packagePath, 'startup').externalPackageTicket);
});
