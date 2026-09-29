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
  let _0x895993;
  const _0x1e3d47 = (_0x4eb453) => {
    if (
      _0x4eb453?.['target'] &&
      _0x4eb453['target'] !== windowObject &&
      _0x4eb453['target']['tagName'] !== 'SCRIPT'
    )
      return;
    if (!startup['snapshot']()['failure'])
      _0x895993 = collectRendererStartupEvidence(_0x4eb453, windowObject);
    startup['fail']('entry');
  };
  let _0x141c1f = ![],
    _0x535c4a = ![],
    _0x590f59 = () => {};
  _0x590f59 = startup['subscribe']((_0x366a19) => {
    if (_0x366a19['ready']) {
      _0x1c60d5();
      return;
    }
    if (!_0x366a19['failure'] || _0x535c4a) return;
    _0x535c4a = !![];
    const _0x5961a4 = String(windowObject['location']?.['href'] || ''),
      _0x5680a5 = readChromeShellStartupMetadata(_0x5961a4);
    if (!_0x5680a5) return;
    void (async () => {
      for (let _0x39ec0f = 0x0; _0x39ec0f < 0x3 && !_0x141c1f; _0x39ec0f += 0x1) {
        try {
          const _0x353db1 = await report({
            type: CHROME_SHELL_STARTUP_FAILED_EVENT,
            source: 'renderer',
            level: 'error',
            message: 'Renderer startup failed',
            context: {
              href: _0x5961a4,
              ..._0x5680a5,
              stage: _0x366a19['phase'],
              failure: _0x366a19['failure'],
              ...(_0x895993 ? { evidence: _0x895993 } : {}),
            },
          });
          if (_0x353db1?.['success']) break;
        } catch {}
      }
    })();
  });
  function _0x1c60d5() {
    ((_0x141c1f = !![]),
      _0x590f59(),
      windowObject['removeEventListener']('error', _0x1e3d47, !![]),
      windowObject['removeEventListener']('pagehide', _0x1c60d5));
  }
  return (
    windowObject['addEventListener']('error', _0x1e3d47, !![]),
    windowObject['addEventListener']('pagehide', _0x1c60d5, { once: !![] }),
    _0x1c60d5
  );
}
