import { shouldUseChromeShellRuntime } from './chromeShellLauncher.js';
export function createCanvasRuntimeModeController({
  env: env = process['env'],
  appIsPackaged: appIsPackaged = ![],
  platform: platform = process['platform'],
} = {}) {
  let electronForcedForLaunch = ![];
  return {
    shouldUseChromeShellRuntime() {
      return (
        !electronForcedForLaunch &&
        shouldUseChromeShellRuntime(env, { appIsPackaged: appIsPackaged, platform: platform })
      );
    },
    useElectronForCurrentLaunch() {
      electronForcedForLaunch = !![];
    },
  };
}
