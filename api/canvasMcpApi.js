import { requester } from './requester.js';
export function requestCanvasMcp(_0x3962fd, _0x5a4864) {
  return requester({
    url: '/api/v2/canvas-mcp/control',
    provider: 'local',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify'](_0x3962fd),
    signal: _0x5a4864,
    timeout: 0x61a8,
    retries: 0x0,
  });
}
