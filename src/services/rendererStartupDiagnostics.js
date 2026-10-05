import { reportRendererStartupFailure } from '../../api/rendererStartupApi.js';
import { rendererStartupState } from './rendererStartupState.js';
import { collectRendererStartupEvidence } from './rendererStartupEvidence.js';
import {
  CHROME_SHELL_STARTUP_FAILED_EVENT,
  readChromeShellStartupMetadata,
} from './chromeShellStartupReadiness.js';
export function installRendererStartupDiagnostics({
  windowObject: windowObject = globalThis['window'],
  startup: startup = rendererStartupState,
  report: report = reportRendererStartupFailure,
} = {}) {
  if (!windowObject?.['addEventListener']) return () => {};
  if (startup['snapshot']()['ready']) return () => {};
  let evidence;
  const value = (event) => {
    if (event?.['target'] && event['target'] !== windowObject && event['target']['tagName'] !== 'SCRIPT')
      return;
    if (!startup['snapshot']()['failure']) evidence = collectRendererStartupEvidence(event, windowObject);
    startup['fail']('entry');
  };
  let enabled = false,
    item = false,
    handler = () => {};
  handler = startup['subscribe']((stage) => {
    if (stage['ready']) {
      run();
      return;
    }
    if (!stage['failure'] || item) return;
    item = true;
    const href = String(windowObject['location']?.['href'] || ''),
      args = readChromeShellStartupMetadata(href);
    if (!args) return;
    void (async () => {
      for (let count = 0; count < 3 && !enabled; count += 1) {
        try {
          const response = await report({
            type: CHROME_SHELL_STARTUP_FAILED_EVENT,
            source: 'renderer',
            level: 'error',
            message: 'Renderer startup failed',
            context: {
              href: href,
              ...args,
              stage: stage['phase'],
              failure: stage['failure'],
              ...(evidence ? { evidence: evidence } : {}),
            },
          });
          if (response?.['success']) break;
        } catch {}
      }
    })();
  });
  function run() {
    ((enabled = true),
      handler(),
      windowObject['removeEventListener']('error', value, true),
      windowObject['removeEventListener']('pagehide', run));
  }
  return (
    windowObject['addEventListener']('error', value, true),
    windowObject['addEventListener']('pagehide', run, { once: true }),
    run
  );
}
