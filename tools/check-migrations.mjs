import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import knex from 'knex';
import { ROOT } from './test-runtime.mjs';
const require = createRequire(import.meta.url);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canvaspro-migration-check-'));
const database = knex({ client: 'better-sqlite3', connection: { filename: path.join(directory, 'fixture.sqlite3') }, useNullAsDefault: true });
try {
  const migrations = { directory: path.join(ROOT, 'db/migrations'), loadExtensions: ['.cjs'] };
  const first = await database.migrate.latest(migrations);
  assert.ok(first[1].includes('001_short_drama_core.cjs'));
  const expected = [...fs.readFileSync(path.join(ROOT,'db/shortdrama-schema.sql'),'utf8').matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi)].map(match => match[1]);
  assert.ok(expected.length >= 17);
  for (const table of expected) assert.equal(await database.schema.hasTable(table), true, table);
  const [id] = await database('o_project').insert({ name: 'isolated migration fixture' });
  assert.deepEqual((await database.migrate.latest(migrations))[1], []);
  // Also verify SQL-level idempotency, independent of Knex's migration ledger.
  await require(path.join(ROOT, 'db/migrations/001_short_drama_core.cjs')).up(database);
  assert.equal((await database('o_project').where({ id }).first()).name, 'isolated migration fixture');
  console.log(JSON.stringify({ success: true, domainTables: expected.length, migrationApplied: first[1], rerunPreservesRows: true }));
} finally {
  await database.destroy();
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
