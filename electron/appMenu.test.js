import test from 'node:test';
import assert from 'node:assert/strict';
import { installAppMenu } from './appMenu.js';
test('all reload and relaunch menu actions use guarded callbacks, never app.exit', () => {
  let menu; const calls = [];
  installAppMenu({ app: { isPackaged: false, exit() { throw new Error('unsafe exit'); } },
    Menu: { buildFromTemplate: value => value, setApplicationMenu: value => { menu = value; } },
    getMainWindow: () => { throw new Error('unguarded navigation'); },
    reloadCanvas: hard => calls.push(hard ? 'hard' : 'reload'), restartBackendAndReload: () => calls.push('restart'), relaunchElectron: () => calls.push('relaunch') });
  for (const item of menu[0].submenu.filter(item => /Reload|Relaunch/.test(item.label || ''))) item.click();
  assert.deepEqual(calls, ['reload','hard','reload','restart','relaunch']);
});
