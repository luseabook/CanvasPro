import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasRuntimeModeController } from './canvasRuntimeMode.js';

test('defaults to the chrome shell runtime when no flag opts out', () => {
  const controller = createCanvasRuntimeModeController({ env: {}, appIsPackaged: false, platform: 'linux' });
  assert.equal(controller.shouldUseChromeShellRuntime(), true);
});

test('honours the electron opt-out for an unpackaged build', () => {
  const controller = createCanvasRuntimeModeController({
    env: { AIC_USE_ELECTRON_CANVAS: '1' },
    appIsPackaged: false,
    platform: 'win32',
  });
  assert.equal(controller.shouldUseChromeShellRuntime(), false);
});

test('packaged desktop builds ignore the electron opt-out', () => {
  for (const platform of ['win32', 'darwin']) {
    const controller = createCanvasRuntimeModeController({
      env: { AIC_USE_ELECTRON_CANVAS: '1' },
      appIsPackaged: true,
      platform: platform,
    });
    assert.equal(controller.shouldUseChromeShellRuntime(), true);
  }
});

test('packaged non-desktop builds still honour the electron opt-out', () => {
  const controller = createCanvasRuntimeModeController({
    env: { AIC_USE_ELECTRON_CANVAS: '1' },
    appIsPackaged: true,
    platform: 'linux',
  });
  assert.equal(controller.shouldUseChromeShellRuntime(), false);
});

test('delegates the runtime selector flags to the launcher', () => {
  const chromeShell = createCanvasRuntimeModeController({
    env: { AIC_CANVAS_RUNTIME: 'chrome-shell' },
    appIsPackaged: false,
    platform: 'linux',
  });
  assert.equal(chromeShell.shouldUseChromeShellRuntime(), true);
  const edgeShell = createCanvasRuntimeModeController({
    env: { AIC_CANVAS_RUNTIME: ' EDGE-SHELL ' },
    appIsPackaged: false,
    platform: 'linux',
  });
  assert.equal(edgeShell.shouldUseChromeShellRuntime(), true);
  const electron = createCanvasRuntimeModeController({
    env: { AIC_CANVAS_RUNTIME: 'electron' },
    appIsPackaged: true,
    platform: 'win32',
  });
  assert.equal(electron.shouldUseChromeShellRuntime(), false);
  const browserWindow = createCanvasRuntimeModeController({
    env: { AIC_CANVAS_RUNTIME: 'browser-window' },
    appIsPackaged: true,
    platform: 'darwin',
  });
  assert.equal(browserWindow.shouldUseChromeShellRuntime(), false);
});

test('useElectronForCurrentLaunch pins the electron runtime for the rest of the launch', () => {
  const controller = createCanvasRuntimeModeController({
    env: { AIC_USE_CHROME_SHELL: '1' },
    appIsPackaged: true,
    platform: 'win32',
  });
  assert.equal(controller.shouldUseChromeShellRuntime(), true);
  controller.useElectronForCurrentLaunch();
  assert.equal(controller.shouldUseChromeShellRuntime(), false);
  controller.useElectronForCurrentLaunch();
  assert.equal(controller.shouldUseChromeShellRuntime(), false);
});

test('exposes only the two launch-mode members', () => {
  const controller = createCanvasRuntimeModeController({ env: {}, appIsPackaged: false, platform: 'linux' });
  assert.deepEqual(Object.keys(controller).sort(), [
    'shouldUseChromeShellRuntime',
    'useElectronForCurrentLaunch',
  ]);
  assert.equal(typeof controller.shouldUseChromeShellRuntime, 'function');
  assert.equal(typeof controller.useElectronForCurrentLaunch, 'function');
});

test('two controllers keep independent launch pins', () => {
  const first = createCanvasRuntimeModeController({ env: {}, appIsPackaged: false, platform: 'linux' });
  const second = createCanvasRuntimeModeController({ env: {}, appIsPackaged: false, platform: 'linux' });
  first.useElectronForCurrentLaunch();
  assert.equal(first.shouldUseChromeShellRuntime(), false);
  assert.equal(second.shouldUseChromeShellRuntime(), true);
});
