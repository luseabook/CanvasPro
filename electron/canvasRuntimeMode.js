import { shouldUseChromeShellRuntime } from './chromeShellLauncher.js';
export function createCanvasRuntimeModeController({
  env: env = process['env'],
  appIsPackaged: appIsPackaged = false,
  platform: platform = process['platform'],
} = {}) {
  let electronForcedForLaunch = false;
  return {
    shouldUseChromeShellRuntime() {
      return (
        !electronForcedForLaunch &&
        shouldUseChromeShellRuntime(env, { appIsPackaged: appIsPackaged, platform: platform })
      );
    },
    useElectronForCurrentLaunch() {
      electronForcedForLaunch = true;
    },
  };
}
