import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './test-runtime.mjs';
const groups = {
  'src/core': /^rendererMediaLifecycle\.test\.js$/,
  'src/utils': /^cleanupSteps\.test\.js$/,
  'src/modules': /^workspacePersistenceCoordinator\.test\.js$/,
  electron: /^(atomicJsonStore|deviceIdentityIsolation|appMenu|rendererNavigationGuard|backendProcessTermination|desktopQuitCoordinator|desktopStartupLifecycle|recoverySnapshot|updateInstallPreparation|updaterController|storageRoots|diagnostics|diagnosticsAudit)\.test\.js$/,
  'src/modules/app': /^(workspaceCloseGuard|appCanvasMcp)\.test\.js$/,
  'src/modules/canvasMcp': /^(canvasMcpAutoConnection|canvasMcpSession)\.test\.js$/,
  'src/modules/storyWorkspace': /^(storyWorkspacePersistence|storyProjectPersistenceWorkspaceController|storyProjectDataOwner|storyWorkspaceNavigationTransaction|storyWorkspaceStyles|storyStylePreview)\.test\.js$/,
};
const tests = Object.entries(groups).flatMap(([dir, pattern]) => fs.readdirSync(path.join(ROOT, dir)).filter(name => pattern.test(name)).map(name => `${dir}/${name}`));
if (!tests.length) throw new Error('No regression tests found');
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-timeout=25000', ...tests], { cwd: ROOT, stdio: 'inherit' });
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
