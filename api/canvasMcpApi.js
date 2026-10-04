import { requester } from './requester.js';
export function requestCanvasMcp(value, signal) {
  return requester({
    url: '/api/v2/canvas-mcp/control',
    provider: 'local',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify'](value),
    signal: signal,
    timeout: 0x61a8,
    retries: 0x0,
  });
}
