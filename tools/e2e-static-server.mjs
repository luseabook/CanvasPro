// Historical filename; deliberately runs the real HTTP backend, not API mocks.
import { spawn } from 'node:child_process';
import { ROOT, resolveTestPython, createTestEnvironment, recordTestServerDirectory } from './test-runtime.mjs';
const flag = process.argv.indexOf('--port');
const port = Number(flag < 0 ? 18779 : process.argv[flag + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid test port');
const fixture = createTestEnvironment(port);
recordTestServerDirectory(port, fixture.directory);
const child = spawn(resolveTestPython(), ['-B', 'server.py', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: ROOT, env: fixture.env, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true,
});
let stopping = false;
const stop = () => { if (!stopping) { stopping = true; child.kill(); } };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.once('error', error => { console.error(error.message); fixture.dispose(); process.exitCode = 1; });
child.once('exit', code => { fixture.dispose(); process.exitCode = stopping ? 0 : (code || 1); });
