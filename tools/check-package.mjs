// Build an unsigned, unpacked directory. Never install, overwrite an existing output or publish.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { ROOT, createTestEnvironment } from './test-runtime.mjs';
const require = createRequire(import.meta.url);
if (process.platform !== 'win32') throw new Error('This package check targets Windows; use the gated macOS workflow on macOS.');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const electronDist = path.join(path.dirname(require.resolve('electron/package.json')), 'dist');
const electronVersion = fs.readFileSync(path.join(electronDist,'version'),'utf8').trim().replace(/^v/,'');
assert.equal(electronVersion, manifest.devDependencies.electron, 'Installed Electron binary must match the pinned version');
fs.mkdirSync(path.join(ROOT, 'test-artifacts'), { recursive: true });
const output = fs.mkdtempSync(path.join(ROOT, 'test-artifacts', 'package-check-'));
const builderPackage = require.resolve('electron-builder/package.json');
const builder = JSON.parse(fs.readFileSync(builderPackage, 'utf8'));
const cli = path.resolve(path.dirname(builderPackage), typeof builder.bin === 'string' ? builder.bin : builder.bin['electron-builder']);
const env = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' };
for (const key of Object.keys(env)) if (/^(CSC_LINK|CSC_KEY_PASSWORD|WIN_CSC_|GH_TOKEN|GITHUB_TOKEN|AWS_)/i.test(key)) delete env[key];
const result = spawnSync(process.execPath, [cli, '--dir', '--win', '--x64', '--config', 'electron-builder.win.cjs', '--publish', 'never',
  `-c.directories.output=${output}`, `-c.electronDist=${electronDist}`, '-c.win.signAndEditExecutable=false'], { cwd: ROOT, env, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Unpacked package build failed (${result.status}); diagnostics kept at ${output}`);
const app = path.join(output, 'win-unpacked', 'resources', 'app');
const runtime = path.join(output, 'win-unpacked', 'resources', 'runtime');
const required = ['images/story-style-placeholder.svg', 'server.py', 'db/shortdrama-schema.sql', 'styles/story-workspace-modern.css', 'electron/desktopQuitCoordinator.js', 'src/utils/cleanupSteps.js'];
for (const file of required) assert.ok(fs.existsSync(path.join(app,file)), `Package missing ${file}`);
for (const file of ['.git', 'user', 'user-data', 'data', 'test-results', 'backend/services/test_audit_security.py']) assert.equal(fs.existsSync(path.join(app,file)), false, `Private/test file accidentally packaged: ${file}`);
assert.ok(fs.existsSync(path.join(runtime,'ffmpeg/bin/ffmpeg.exe')));
const fixture = createTestEnvironment(18781);
try {
  const code = 'import pathlib,sqlite3,sys; import requests; from PIL import Image; import cv2; import scenedetect; c=sqlite3.connect(":memory:"); c.executescript(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")); n=c.execute("select count(*) from sqlite_master where type=\'table\' and name like \'o_%\'").fetchone()[0]; assert n==17,n; print("Packaged Python dependencies and 17-table schema: OK")';
  const smoke = spawnSync(path.join(runtime,'python/python.exe'), ['-B','-c',code,path.join(app,'db/shortdrama-schema.sql')], { cwd: app, env: fixture.env, stdio: 'inherit' });
  if (smoke.error) throw smoke.error;
  assert.equal(smoke.status,0,'Packaged Python runtime smoke test');
} finally { fixture.dispose(); }
const summary = { success: true, output, electronVersion, requiredFiles: required, packagedRuntimeChecked: true, signed: false, installed: false, published: false };
fs.writeFileSync(path.join(output,'verification.json'), JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary));
