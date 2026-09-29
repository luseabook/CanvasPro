import { requestCanvasMcp } from '../../../api/canvasMcpApi.js';
import { canvasCommandRegistry, executeCanvasCommand } from '../canvasCommands/index.js';
import { listModelManifests } from '../../manifests/index.js';
import { createCanvasMcpSession } from '../canvasMcp/canvasMcpSession.js';
import { createCanvasMcpAutoConnection } from '../canvasMcp/canvasMcpAutoConnection.js';
export function initCanvasMcp({
  commandContext: _0x77446a,
  getCanvasIdentity: _0x4aafa2,
  windowObject: windowObject = window,
}) {
  let _0x19fa3a;
  try {
    ((_0x19fa3a =
      windowObject['sessionStorage']['getItem']('aic-canvas-mcp-owner') || crypto['randomUUID']()),
      windowObject['sessionStorage']['setItem']('aic-canvas-mcp-owner', _0x19fa3a));
  } catch {
    _0x19fa3a = crypto['randomUUID']();
  }
  const _0x1aba94 = createCanvasMcpAutoConnection({
    getBinding: _0x4aafa2,
    isReady: () => windowObject['_isAppLoaded'] === !![],
    createSession: (_0x11baf2) =>
      createCanvasMcpSession({
        request: requestCanvasMcp,
        registry: canvasCommandRegistry,
        execute: (_0x596ec1, _0x177fb0) =>
          executeCanvasCommand(_0x596ec1, _0x177fb0, { ..._0x77446a, recordCommand: null }),
        getBinding: () => (windowObject['_isAppLoaded'] === !![] ? _0x4aafa2() : ''),
        listModels: listModelManifests,
        owner: _0x19fa3a,
        onChange: _0x11baf2,
      }),
  });
  windowObject['addEventListener']('aicanvas:active-canvas-changed', _0x1aba94['refresh']);
  const _0x755330 = () => {
    void _0x1aba94['destroy']();
  };
  return (
    windowObject['addEventListener']('pagehide', _0x755330),
    {
      destroy() {
        return (
          windowObject['removeEventListener']('aicanvas:active-canvas-changed', _0x1aba94['refresh']),
          windowObject['removeEventListener']('pagehide', _0x755330),
          _0x1aba94['destroy']()
        );
      },
    }
  );
}
