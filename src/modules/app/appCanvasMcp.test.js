import test from 'node:test';
import assert from 'node:assert/strict';
import { initCanvasMcp } from './appCanvasMcp.js';

function createWindowHarness() {
  const listeners = new Map();
  return {
    _isAppLoaded: false,
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    listeners,
  };
}

test('canvas MCP stays disconnected by default when the backend route is unavailable', () => {
  const windowObject = createWindowHarness();
  const api = initCanvasMcp({
    commandContext: {},
    getCanvasIdentity: () => 'canvas-1',
    windowObject,
  });

  assert.deepEqual([...windowObject.listeners.keys()], []);
  assert.equal(typeof api.destroy, 'function');
  assert.equal(api.destroy(), false);
});

test('canvas MCP only starts auto-connection when explicitly enabled', () => {
  const windowObject = createWindowHarness();
  const api = initCanvasMcp({
    enabled: true,
    commandContext: {},
    getCanvasIdentity: () => 'canvas-1',
    windowObject,
  });

  assert.deepEqual([...windowObject.listeners.keys()].sort(), [
    'aicanvas:active-canvas-changed',
    'pagehide',
  ]);
  return api.destroy();
});
