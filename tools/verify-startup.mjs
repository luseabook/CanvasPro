// Portable entry point: uses the declared dependency, real isolated backend and assertions.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT } from './test-runtime.mjs';
const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
const result = spawnSync(process.execPath, [cli, 'test', 'e2e/workspace.spec.js', ...process.argv.slice(2)], { cwd: ROOT, stdio: 'inherit' });
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
