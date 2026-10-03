import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Public, isolated test fixture token; never used by the installed application.
export const E2E_TOKEN = 'canvaspro-isolated-acceptance';
export function resolveTestPython() {
  if (process.env.AIC_TEST_PYTHON) return process.env.AIC_TEST_PYTHON;
  const candidate = path.join(ROOT, process.platform === 'win32' ? 'venv/Scripts/python.exe' : 'venv/bin/python');
  return fs.existsSync(candidate) ? candidate : process.platform === 'win32' ? 'python' : 'python3';
}
export function createTestEnvironment(port) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canvaspro-audit-'));
  const support = path.join(directory, 'python-support');
  fs.mkdirSync(support, { recursive: true });
  // Python loads sitecustomize before server imports. Block cloud and local model ports,
  // including background jobs: only the isolated backend itself is reachable.
  fs.copyFileSync(path.join(ROOT, 'tools/test-python-sitecustomize.py'), path.join(support, 'sitecustomize.py'));
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|LANG|LC_.*|DISPLAY|WAYLAND_DISPLAY|XAUTHORITY|XDG_RUNTIME_DIR)$/i.test(key)) env[key] = value;
  }
  const userData = path.join(directory, 'desktop');
  const storage = path.join(directory, 'files');
  Object.assign(env, {
    HOME: directory, USERPROFILE: directory,
    APPDATA: path.join(directory, 'appdata'), LOCALAPPDATA: path.join(directory, 'localappdata'),
    AIC_USER_DATA_ROOT: userData, AIC_STORAGE_ROOT: storage,
    AIC_DISABLE_PORT_RECLAIM: '1', AIC_DISABLE_GLOBAL_CAPTURE: '1',
    AIC_USER_DIR: path.join(userData, 'user'),
    AIC_CANVAS_DIR: path.join(storage, 'projects'),
    AIC_DATA_DIR: path.join(storage, 'data'),
    AIC_OUTPUT_DIR: path.join(storage, 'output'),
    AIC_UPLOADS_DIR: path.join(storage, 'data', 'uploads'),
    AIC_ASSETS_DIR: path.join(storage, 'data', 'assets'),
    AIC_WORKFLOWS_DIR: path.join(storage, 'data', 'workflows'),
    SHORTDRAMA_DB: path.join(directory, 'shortdrama.sqlite3'),
    AICANVAS_PORT: String(port), AIC_BIND_HOST: '127.0.0.1', AIC_LOCAL_TOKEN: E2E_TOKEN,
    AIC_TEST_PYTHON: resolveTestPython(),
    PYTHONPATH: support, PYTHONDONTWRITEBYTECODE: '1', PYTHONUNBUFFERED: '1', PYTHONUTF8: '1',
  });
  for (const key of ['APPDATA','LOCALAPPDATA','AIC_USER_DIR','AIC_CANVAS_DIR','AIC_DATA_DIR','AIC_OUTPUT_DIR','AIC_UPLOADS_DIR','AIC_ASSETS_DIR','AIC_WORKFLOWS_DIR']) fs.mkdirSync(env[key], { recursive: true });
  fs.writeFileSync(path.join(env.AIC_OUTPUT_DIR, 'acceptance-pixel.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOoiL8DAAMGAbTNA6sRAAAAAElFTkSuQmCC', 'base64'));
  return { directory, env, dispose() { cleanupOwnedTestEnvironment(directory); } };
}


/** Cleanup is constrained to a generated directory with this harness' exact guard file. */
export function cleanupOwnedTestEnvironment(directory) {
  if (!directory || !fs.existsSync(directory)) return;
  const candidate = path.resolve(directory), temporary = path.resolve(os.tmpdir());
  const key = value => process.platform === 'win32' ? value.toLowerCase() : value;
  if (key(path.dirname(candidate)) !== key(temporary) || !/^canvaspro-audit-[A-Za-z0-9]+$/.test(path.basename(candidate)) || fs.lstatSync(candidate).isSymbolicLink()) throw new Error('Refusing to clean a non-test directory');
  const marker = path.join(candidate,'python-support','sitecustomize.py');
  if (fs.lstatSync(marker).isSymbolicLink() || !fs.realpathSync(marker).startsWith(fs.realpathSync(candidate) + path.sep) || !fs.readFileSync(marker).equals(fs.readFileSync(path.join(ROOT,'tools/test-python-sitecustomize.py')))) throw new Error('Test directory ownership check failed');
  fs.rmSync(candidate, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}
function runtimeManifest(port, owner) {
  if (!/^\d+$/.test(String(owner))) return null;
  return path.join(ROOT,'test-artifacts',`e2e-runtime-${Number(port)}-${owner}.json`);
}
export function recordTestServerDirectory(port, directory) {
  const file = runtimeManifest(port, process.env.AIC_E2E_OWNER_PID);
  if (!file) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ owner: process.env.AIC_E2E_OWNER_PID, directory }));
}
export function registerTestServerCleanup(port) {
  // Workers inherit this value. Only the owning Playwright CLI performs the final cleanup.
  process.env.AIC_E2E_OWNER_PID ||= String(process.pid);
  const owner = process.env.AIC_E2E_OWNER_PID;
  if (owner !== String(process.pid)) return;
  const file = runtimeManifest(port, owner);
  // Windows may force-stop the webServer process tree without delivering its SIGTERM hook.
  // The CLI exit hook runs after Playwright has stopped its owned server/browser processes.
  process.once('exit', () => {
    try {
      if (!fs.existsSync(file)) return;
      const state = JSON.parse(fs.readFileSync(file,'utf8'));
      if (state.owner !== owner) return;
      cleanupOwnedTestEnvironment(state.directory);
      fs.unlinkSync(file);
    } catch { console.warn('An isolated test directory could not be cleaned; no normal profile was touched.'); }
  });
}
