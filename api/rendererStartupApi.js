import { post } from './apiBase.js';
export function reportRendererStartupFailure(_0x532801) {
  return post('/api/v2/desktop/diagnostics/log-event', _0x532801, 0x5dc);
}
