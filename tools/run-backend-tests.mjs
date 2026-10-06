import { spawnSync } from 'node:child_process';
import { ROOT, resolveTestPython } from './test-runtime.mjs';
const result = spawnSync(resolveTestPython(), ['-B', '-m', 'unittest', 'discover', '-v', '-s', 'backend', '-t', '.', '-p', 'test_*.py'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' },
});
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
