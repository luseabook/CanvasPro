import { spawnSync } from 'node:child_process';
import { ROOT, resolveTestPython } from './test-runtime.mjs';
const result = spawnSync(resolveTestPython(), ['-B', '-m', 'unittest', '-v', 'backend.services.test_audit_security', 'backend.test_shortdrama_schema'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' },
});
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
