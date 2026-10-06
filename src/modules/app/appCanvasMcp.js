import { requestCanvasMcp } from '../../../api/canvasMcpApi.js';
import { canvasCommandRegistry, executeCanvasCommand } from '../canvasCommands/index.js';
import { listModelManifests } from '../../manifests/index.js';
import { createCanvasMcpSession } from '../canvasMcp/canvasMcpSession.js';
import { createCanvasMcpAutoConnection } from '../canvasMcp/canvasMcpAutoConnection.js';
export function initCanvasMcp({
  enabled = false,
  allowGeneration = false,
  commandContext: commandContext,
  getCanvasIdentity: getCanvasIdentity,
  windowObject: windowObject = window,
}) {
  // This source backend does not advertise canvas MCP. Opt in only after a
  // supporting backend is selected; creating a timer is itself an activation.
  if (enabled !== true) return Object.freeze({ destroy: () => false });
  let owner;
  try {
    ((owner = windowObject.sessionStorage.getItem('aic-canvas-mcp-owner') || crypto.randomUUID()),
      windowObject.sessionStorage.setItem('aic-canvas-mcp-owner', owner));
  } catch {
    owner = crypto.randomUUID();
  }
  const timer = createCanvasMcpAutoConnection({
    allowGeneration,
    getBinding: getCanvasIdentity,
    isReady: () => windowObject._isAppLoaded === true,
    createSession: (onChange) =>
      createCanvasMcpSession({
        request: requestCanvasMcp,
        registry: canvasCommandRegistry,
        execute: (value, item) =>
          executeCanvasCommand(value, item, { ...commandContext, recordCommand: null }),
        getBinding: () => (windowObject._isAppLoaded === true ? getCanvasIdentity() : ''),
        listModels: listModelManifests,
        owner: owner,
        onChange: onChange,
      }),
  });
  windowObject.addEventListener('aicanvas:active-canvas-changed', timer.refresh);
  const key = () => {
    void timer.destroy();
  };
  return (
    windowObject.addEventListener('pagehide', key),
    {
      destroy() {
        return (
          windowObject.removeEventListener('aicanvas:active-canvas-changed', timer.refresh),
          windowObject.removeEventListener('pagehide', key),
          timer.destroy()
        );
      },
    }
  );
}
