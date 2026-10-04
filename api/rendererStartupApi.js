import { post } from './apiBase.js';
export function reportRendererStartupFailure(value) {
  return post('/api/v2/desktop/diagnostics/log-event', value, 0x5dc);
}
